import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/db';
import { generateEmbedding } from '@/app/_lib/gemini';
import { cache } from '@/app/_lib/redis';
import { CreateMemoryRequest } from '@/app/_lib/types';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = agentId ? { agentId } : {};

    const memories = await prisma.memory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
      include: {
        Agent: true,
      },
    });

    const total = await prisma.memory.count({ where });

    return NextResponse.json({
      memories,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + memories.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateMemoryRequest = await request.json();

    if (!body.agentId || !body.content) {
      return NextResponse.json(
        { error: 'agentId and content are required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { id: body.agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(body.content);
    } catch (error) {
      console.error('Failed to generate embedding:', error);
    }

    const memory = await prisma.memory.create({
      data: {
        agentId: body.agentId,
        content: body.content,
        embedding: embedding ? JSON.stringify(embedding) : null,
        metadata: (body.metadata || {}) as Prisma.InputJsonValue,
        strength: 1.0,
      },
      include: {
        Agent: true,
      },
    });

    await cache.del(`agent:${body.agentId}`);
    await cache.clearPattern(`memory:agent:${body.agentId}:*`);

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    );
  }
}
