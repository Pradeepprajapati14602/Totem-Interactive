import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/db';
import { generateEmbedding } from '@/app/_lib/gemini';
import { SemanticSearchResult } from '@/app/_lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const agentId = searchParams.get('agentId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (error) {
      console.error('Failed to generate query embedding:', error);
      return NextResponse.json(
        { error: 'Failed to generate query embedding. Please check your GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    const embeddingString = `[${queryEmbedding.join(',')}]`;
    
    const agentFilter = agentId ? `AND m."agentId" = '${agentId}'` : '';
    
    type SearchResult = {
      id: string;
      agentId: string;
      content: string;
      metadata: unknown;
      strength: number;
      createdAt: Date;
      updatedAt: Date;
      similarity: number;
    };
    
    const results = (await prisma.$queryRawUnsafe(`
      SELECT 
        m.id,
        m."agentId",
        m.content,
        m.metadata,
        m.strength,
        m."createdAt",
        m."updatedAt",
        1 - (m.embedding <=> '${embeddingString}'::vector) as similarity
      FROM "Memory" m
      WHERE m.embedding IS NOT NULL
        ${agentFilter}
      ORDER BY m.embedding <=> '${embeddingString}'::vector
      LIMIT ${Math.min(limit, 50)}
    `)) as SearchResult[];

    const memoriesWithAgents: SemanticSearchResult[] = await Promise.all(
      results.map(async (result: SearchResult) => {
        const agent = await prisma.agent.findUnique({
          where: { id: result.agentId },
        });

        return {
          memory: {
            id: result.id,
            agentId: result.agentId,
            content: result.content,
            metadata: result.metadata as Record<string, unknown> | undefined,
            strength: result.strength,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          },
          similarity: result.similarity,
          agent: agent ? {
            ...agent,
            metadata: agent.metadata as Record<string, unknown> | undefined,
          } : undefined,
        };
      })
    );

    return NextResponse.json({
      query,
      results: memoriesWithAgents,
      count: memoriesWithAgents.length,
    });
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return NextResponse.json(
      { error: 'Failed to perform semantic search' },
      { status: 500 }
    );
  }
}
