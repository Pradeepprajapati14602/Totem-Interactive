import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/db';
import { cache } from '@/app/_lib/redis';
import { CreateAgentRequest } from '@/app/_lib/types';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const cacheKey = 'agents:list';
    const cached = await cache.get<unknown[]>(cacheKey);
    
    if (cached) {
      return NextResponse.json({ agents: cached });
    }

    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { memories: true },
        },
      },
    });

    await cache.set(cacheKey, agents, 300);

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAgentRequest = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name: body.name.trim(),
        metadata: (body.metadata || {}) as Prisma.InputJsonValue,
      },
    });

    // Clear agents list cache
    await cache.del('agents:list');

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
