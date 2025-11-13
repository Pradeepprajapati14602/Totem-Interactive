export interface Agent {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Memory {
  id: string;
  agentId: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  strength: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryWithAgent extends Memory {
  Agent: Agent;
}

export interface MemoryCluster {
  id: string;
  memories: Memory[];
  centroid: number[];
  summary?: string;
  strength: number;
}

export interface EvolutionEvent {
  id: string;
  timestamp: Date;
  type: 'creation' | 'evolution' | 'decay' | 'consolidation';
  memoryIds: string[];
  summary: string;
}

export interface SemanticSearchResult {
  memory: Memory;
  similarity: number;
  agent?: Agent;
}

export interface CreateMemoryRequest {
  agentId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAgentRequest {
  name: string;
  metadata?: Record<string, unknown>;
}

export interface EvolveMemoriesRequest {
  agentId?: string;
  olderThanDays?: number;
}
