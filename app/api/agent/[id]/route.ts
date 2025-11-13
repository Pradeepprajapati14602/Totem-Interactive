import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/db';
import { cache } from '@/app/_lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const cacheKey = `agent:${id}`;
    const cached = await cache.get<unknown>(cacheKey);
    
    if (cached) {
      return NextResponse.json({ agent: cached });
    }

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        memories: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    await cache.set(cacheKey, agent, 120);

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.agent.delete({
      where: { id },
    });

    await cache.del(`agent:${id}`);
    await cache.del('agents:list');
    await cache.clearPattern(`memory:agent:${id}:*`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
