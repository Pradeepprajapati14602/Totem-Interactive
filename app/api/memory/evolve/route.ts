import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/db';
import { summarizeMemories } from '@/app/_lib/gemini';
import { cache } from '@/app/_lib/redis';
import { EvolveMemoriesRequest } from '@/app/_lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: EvolveMemoriesRequest = await request.json();

    const olderThanDays = body.olderThanDays || parseInt(process.env.EVOLUTION_THRESHOLD_DAYS || '7');
    const decayRate = parseFloat(process.env.MEMORY_DECAY_RATE || '0.1');
    const agentId = body.agentId;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const where = {
      createdAt: { lt: cutoffDate },
      strength: { gt: 0.1 },
      ...(agentId && { agentId }),
    };

    const oldMemories = await prisma.memory.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: {
        Agent: true,
      },
    });

    if (oldMemories.length === 0) {
      return NextResponse.json({
        message: 'No memories to evolve',
        processed: 0,
      });
    }

    type MemoryWithAgent = typeof oldMemories[0];
    const memoriesByAgent = oldMemories.reduce((acc: Record<string, MemoryWithAgent[]>, memory: MemoryWithAgent) => {
      if (!acc[memory.agentId]) {
        acc[memory.agentId] = [];
      }
      acc[memory.agentId].push(memory);
      return acc;
    }, {} as Record<string, MemoryWithAgent[]>);

    let processedCount = 0;
    const evolutions = [];

    for (const [currentAgentId, memories] of Object.entries(memoriesByAgent)) {
      const agentMemories = memories as MemoryWithAgent[];
      
      if (agentMemories.length < 3) {
        for (const memory of agentMemories) {
          await prisma.memory.update({
            where: { id: memory.id },
            data: {
              strength: Math.max(0.1, memory.strength - decayRate),
            },
          });
          processedCount++;
        }
        continue;
      }

      let summary: string;
      try {
        const memoryContents = agentMemories.map((m: MemoryWithAgent) => m.content);
        summary = await summarizeMemories(memoryContents);
      } catch (error) {
        console.error('AI summarization failed, using fallback:', error);
        summary = `Consolidated memory cluster: ${agentMemories.length} memories from ${agentMemories[0].createdAt.toLocaleDateString()}`;
      }

      const evolvedMemory = await prisma.memory.create({
        data: {
          agentId: currentAgentId,
          content: summary,
          metadata: {
            type: 'evolved',
            sourceMemoryIds: agentMemories.map((m: MemoryWithAgent) => m.id),
            sourceMemoryCount: agentMemories.length,
            evolutionDate: new Date().toISOString(),
            originalDateRange: {
              start: agentMemories[0].createdAt,
              end: agentMemories[agentMemories.length - 1].createdAt,
            },
          },
          strength: 0.9,
        },
      });

      evolutions.push({
        agentId: currentAgentId,
        evolvedMemoryId: evolvedMemory.id,
        sourceCount: agentMemories.length,
      });

      for (const memory of agentMemories) {
        await prisma.memory.update({
          where: { id: memory.id },
          data: {
            strength: Math.max(0.05, memory.strength - decayRate * 2),
            metadata: {
              ...(typeof memory.metadata === 'object' && memory.metadata !== null ? memory.metadata : {}),
              evolvedInto: evolvedMemory.id,
            },
          },
        });
        processedCount++;
      }

      await cache.del(`agent:${currentAgentId}`);
      await cache.clearPattern(`memory:agent:${currentAgentId}:*`);
    }

    return NextResponse.json({
      message: 'Memory evolution completed',
      processed: processedCount,
      evolutions,
      summary: `Processed ${processedCount} memories, created ${evolutions.length} evolved memories`,
    });
  } catch (error) {
    console.error('Error evolving memories:', error);
    return NextResponse.json(
      { error: 'Failed to evolve memories' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function GET() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(process.env.EVOLUTION_THRESHOLD_DAYS || '7'));

    const stats = await prisma.memory.groupBy({
      by: ['agentId'],
      where: {
        createdAt: { lt: cutoffDate },
        strength: { gt: 0.1 },
      },
      _count: {
        id: true,
      },
    });

    const totalEligible = stats.reduce((sum: number, stat: { agentId: string; _count: { id: number } }) => sum + stat._count.id, 0);

    const evolvedCount = await prisma.memory.count({
      where: {
        metadata: {
          path: ['type'],
          equals: 'evolved',
        },
      },
    });

    return NextResponse.json({
      eligibleForEvolution: totalEligible,
      byAgent: stats,
      totalEvolved: evolvedCount,
      threshold: `${process.env.EVOLUTION_THRESHOLD_DAYS || '7'} days`,
    });
  } catch (error) {
    console.error('Error fetching evolution stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evolution statistics' },
      { status: 500 }
    );
  }
}
