'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/app/_components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { Activity, Database, TrendingUp, Zap, Clock, CheckCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MetricData {
  timestamp: string;
  avgLatency: number;
  requestCount: number;
  errorRate: number;
}

interface MemoryStats {
  totalMemories: number;
  totalAgents: number;
  avgStrength: number;
  weakMemories: number;
  strongMemories: number;
}

interface EvolutionEvent {
  id: string;
  timestamp: Date;
  type: string;
  memoriesAffected: number;
  summary: string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    totalMemories: 0,
    totalAgents: 0,
    avgStrength: 0,
    weakMemories: 0,
    strongMemories: 0,
  });
  const [evolutionEvents, setEvolutionEvents] = useState<EvolutionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    const now = new Date();
    const mockMetrics: MetricData[] = Array.from({ length: 12 }, (_, i) => ({
      timestamp: new Date(now.getTime() - (11 - i) * 5 * 60000).toLocaleTimeString(),
      avgLatency: 80 + Math.random() * 120,
      requestCount: Math.floor(10 + Math.random() * 50),
      errorRate: Math.random() * 5,
    }));
    setMetrics(mockMetrics);
  };

  const fetchMemoryStats = async () => {
    try {
      const [memoriesRes, agentsRes] = await Promise.all([
        fetch('/api/memory?limit=1000'),
        fetch('/api/agent'),
      ]);

      const memoriesData = await memoriesRes.json();
      const agentsData = await agentsRes.json();

      const memories = memoriesData.memories || [];
      const agents = agentsData.agents || [];

      const totalMemories = memories.length;
      const avgStrength = memories.length > 0 
        ? memories.reduce((sum: number, m: { strength: number }) => sum + m.strength, 0) / memories.length 
        : 0;
      const weakMemories = memories.filter((m: { strength: number }) => m.strength < 0.5).length;
      const strongMemories = memories.filter((m: { strength: number }) => m.strength >= 0.8).length;

      setMemoryStats({
        totalMemories,
        totalAgents: agents.length,
        avgStrength,
        weakMemories,
        strongMemories,
      });
    } catch (error) {
      console.error('Error fetching memory stats:', error);
    }
  };

  const fetchEvolutionEvents = async () => {
    const mockEvents: EvolutionEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000),
        type: 'consolidation',
        memoriesAffected: 5,
        summary: 'Consolidated 5 related memories about data processing',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000),
        type: 'decay',
        memoriesAffected: 3,
        summary: 'Decreased strength of 3 old memories',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 10800000),
        type: 'creation',
        memoriesAffected: 1,
        summary: 'New memory created with high confidence',
      },
    ];
    setEvolutionEvents(mockEvents);
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchMetrics(),
      fetchMemoryStats(),
      fetchEvolutionEvents(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strengthDistribution = [
    { name: 'Weak (0-0.3)', value: memoryStats.weakMemories, fill: COLORS[4] },
    { name: 'Medium (0.3-0.7)', value: memoryStats.totalMemories - memoryStats.weakMemories - memoryStats.strongMemories, fill: COLORS[3] },
    { name: 'Strong (0.7-1.0)', value: memoryStats.strongMemories, fill: COLORS[2] },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-xl">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              System Monitoring
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Real-time performance metrics and memory analytics
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="font-semibold">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Memories</p>
                <p className="text-3xl font-bold mt-2">{memoryStats.totalMemories}</p>
              </div>
              <Database className="w-10 h-10 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Agents</p>
                <p className="text-3xl font-bold mt-2">{memoryStats.totalAgents}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Strength</p>
                <p className="text-3xl font-bold mt-2">{(memoryStats.avgStrength * 100).toFixed(0)}%</p>
              </div>
              <Zap className="w-10 h-10 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Latency</p>
                <p className="text-3xl font-bold mt-2">
                  {metrics.length > 0 ? Math.round(metrics[metrics.length - 1].avgLatency) : 0}ms
                </p>
              </div>
              <Clock className="w-10 h-10 text-green-600" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="memory">Memory Stats</TabsTrigger>
            <TabsTrigger value="evolution">Evolution Log</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">API Response Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgLatency" stroke="#8b5cf6" name="Avg Latency (ms)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Request Volume</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requestCount" fill="#3b82f6" name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Error Rate</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="errorRate" stroke="#ef4444" name="Error %" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="memory" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Memory Strength Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={strengthDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {strengthDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Memory Quality Metrics</h3>
                <div className="space-y-4 mt-8">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Strong Memories</span>
                    <span className="text-2xl font-bold text-green-600">{memoryStats.strongMemories}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Weak Memories</span>
                    <span className="text-2xl font-bold text-red-600">{memoryStats.weakMemories}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Average Strength</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {(memoryStats.avgStrength * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Memories per Agent</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {memoryStats.totalAgents > 0 ? (memoryStats.totalMemories / memoryStats.totalAgents).toFixed(1) : 0}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Evolution Events</h3>
              <div className="space-y-4">
                {evolutionEvents.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No evolution events recorded yet</p>
                ) : (
                  evolutionEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800"
                    >
                      <div className="mt-1">
                        {event.type === 'consolidation' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {event.type === 'decay' && <TrendingUp className="w-5 h-5 text-orange-600" />}
                        {event.type === 'creation' && <Zap className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold capitalize">{event.type}</span>
                          <span className="text-sm text-slate-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {event.summary}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          Affected {event.memoriesAffected} {event.memoriesAffected === 1 ? 'memory' : 'memories'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Evolution Recommendations</h3>
              <div className="space-y-3">
                {memoryStats.weakMemories > 10 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm">
                      ⚠️ You have {memoryStats.weakMemories} weak memories. Consider running memory consolidation.
                    </p>
                  </div>
                )}
                {memoryStats.totalMemories > 100 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm">
                      💡 Large memory bank detected. Consider archiving old memories to improve performance.
                    </p>
                  </div>
                )}
                {memoryStats.avgStrength < 0.5 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm">
                      🔴 Average memory strength is low. Review and strengthen important memories.
                    </p>
                  </div>
                )}
                {memoryStats.avgStrength >= 0.7 && memoryStats.weakMemories < 5 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm">
                      ✅ Memory health is excellent! Keep up the good memory management practices.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
