'use client';

import { useState, useEffect } from 'react';
import { MemoryCard } from '@/app/_components/MemoryCard';
import { ClusterGraph } from '@/app/_components/ClusterGraph';
import { EvolutionTimeline } from '@/app/_components/EvolutionTimeline';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { Plus, Search, Brain, TrendingUp } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    memories: number;
  };
}

interface Memory {
  id: string;
  agentId: string;
  content: string;
  strength: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  Agent?: Agent;
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [newAgentName, setNewAgentName] = useState('');
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [highlightedMemories, setHighlightedMemories] = useState<string[]>([]);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agent');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const url = selectedAgent === 'all' 
        ? '/api/memory?limit=100'
        : `/api/memory?agentId=${selectedAgent}&limit=100`;
      
      const response = await fetch(url);
      const data = await response.json();
      setMemories(data.memories || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAgentName }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewAgentName('');
        await fetchAgents();
        if (data.agent) {
          setSelectedAgent(data.agent.id);
        }
      }
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateMemory = async () => {
    if (!newMemoryContent.trim() || selectedAgent === 'all') return;
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          content: newMemoryContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewMemoryContent('');
        if (data.memory) {
          setMemories(prev => [data.memory, ...prev]);
          setAgents(prev => prev.map(agent => 
            agent.id === selectedAgent
              ? { 
                  ...agent, 
                  _count: { 
                    memories: (agent._count?.memories || 0) + 1 
                  } 
                }
              : agent
          ));
        }
      }
    } catch (error) {
      console.error('Error creating memory:', error);
      await fetchMemories();
      await fetchAgents();
    } finally {
      setIsCreating(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      fetchMemories();
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ query: searchQuery, limit: '50' });
      if (selectedAgent !== 'all') {
        params.append('agentId', selectedAgent);
      }

      const response = await fetch(`/api/memory/similar?${params}`);
      const data = await response.json();
      setMemories(data.results?.map((r: { memory: Memory }) => r.memory) || []);
    } catch (error) {
      console.error('Error searching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvolveMemories = async () => {
    setIsCreating(true);
    try {
      const body = selectedAgent !== 'all' ? { agentId: selectedAgent } : {};
      const response = await fetch('/api/memory/evolve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Evolution Complete!\n${data.summary || data.message}\nProcessed: ${data.processed} memories\nEvolved: ${data.evolutions?.length || 0} new memories`);
        await fetchMemories();
      } else {
        const error = await response.json();
        alert(`Evolution failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error evolving memories:', error);
      alert('Error evolving memories. Check console for details.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) {
      return;
    }

    try {
      const response = await fetch(`/api/memory/${memoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMemories(prev => prev.filter(m => m.id !== memoryId));
        
        if (selectedAgent !== 'all') {
          setAgents(prev => prev.map(agent => 
            agent.id === selectedAgent
              ? { 
                  ...agent, 
                  _count: { 
                    memories: Math.max((agent._count?.memories || 0) - 1, 0)
                  } 
                }
              : agent
          ));
        }
        
        await fetchAgents();
      } else {
        await fetchMemories();
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
      await fetchMemories();
    }
  };

  const handleShowSources = (sourceIds: string[]) => {
    setHighlightedMemories(sourceIds);
    
    setTimeout(() => {
      setHighlightedMemories([]);
    }, 3000);
    
    if (sourceIds.length > 0) {
      const firstElement = document.querySelector(`[data-memory-id="${sourceIds[0]}"]`);
      if (firstElement) {
        firstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const filteredMemories = memories.filter(memory =>
    memory.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Totem Interactive
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Long-Term Memory Warehouse for AI Agents
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">{agents.length}</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">Agents</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">{memories.length}</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">Memories</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="New agent name..."
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateAgent()}
              className="max-w-xs"
            />
            <Button onClick={handleCreateAgent} disabled={isCreating}>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-64 bg-white dark:bg-slate-800">
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent._count?.memories || 0} memories)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Search or ask semantically..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                className="bg-white dark:bg-slate-800"
              />
              <Button onClick={handleSemanticSearch} variant="secondary">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <Button 
              onClick={handleEvolveMemories}
              disabled={isCreating}
              variant="outline"
            >
              Evolve Memories
            </Button>
          </div>
        </header>

        <Tabs defaultValue="memories" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800">
            <TabsTrigger value="memories">Memories</TabsTrigger>
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="memories" className="space-y-4">
            {selectedAgent !== 'all' && (
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new memory..."
                    value={newMemoryContent}
                    onChange={(e) => setNewMemoryContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateMemory()}
                    className="flex-1"
                  />
                  <Button onClick={handleCreateMemory} disabled={isCreating}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Memory
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading memories...</p>
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
                <Brain className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No memories found. Create an agent and add some memories to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMemories.map((memory) => (
                  <div key={memory.id} data-memory-id={memory.id}>
                    <MemoryCard
                      memory={{
                        ...memory,
                        createdAt: new Date(memory.createdAt),
                        updatedAt: new Date(memory.updatedAt),
                        Agent: memory.Agent ? {
                          ...memory.Agent,
                          createdAt: new Date(memory.Agent.createdAt),
                          updatedAt: new Date(memory.Agent.updatedAt),
                        } : undefined,
                      }}
                      onDelete={handleDeleteMemory}
                      onShowSources={handleShowSources}
                      isHighlighted={highlightedMemories.includes(memory.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="clusters">
            <ClusterGraph memories={memories} />
          </TabsContent>

          <TabsContent value="timeline">
            <EvolutionTimeline memories={memories} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
