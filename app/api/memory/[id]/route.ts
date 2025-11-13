import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/db';
import { cache } from '@/app/_lib/redis';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cacheKey = `memory:${id}`;
    const cached = await cache.get<unknown>(cacheKey);
    
    if (cached) {
      return NextResponse.json({ memory: cached });
    }

    const memory = await prisma.memory.findUnique({
      where: { id },
      include: {
        Agent: true,
      },
    });

    if (!memory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    await cache.set(cacheKey, memory, 300);

    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Error fetching memory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memory' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const memory = await prisma.memory.findUnique({
      where: { id },
    });

    if (!memory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    await prisma.memory.delete({
      where: { id },
    });

    await cache.del(`memory:${id}`);
    await cache.del(`agent:${memory.agentId}`);
    await cache.clearPattern(`memory:agent:${memory.agentId}:*`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json(
      { error: 'Failed to delete memory' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updateData: {
      strength?: number;
      metadata?: Prisma.InputJsonValue;
    } = {};
    
    if (typeof body.strength === 'number') {
      updateData.strength = Math.max(0, Math.min(1, body.strength));
    }
    
    if (body.metadata) {
      updateData.metadata = body.metadata as Prisma.InputJsonValue;
    }

    const memory = await prisma.memory.update({
      where: { id },
      data: updateData,
      include: {
        Agent: true,
      },
    });

    await cache.del(`memory:${id}`);
    await cache.del(`agent:${memory.agentId}`);

    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Error updating memory:', error);
    return NextResponse.json(
      { error: 'Failed to update memory' },
      { status: 500 }
    );
  }
}
