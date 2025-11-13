'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';

interface Memory {
  id: string;
  agentId: string;
  content: string;
  strength: number;
  createdAt: string;
  Agent?: {
    name: string;
  };
}

interface ClusterGraphProps {
  memories: Memory[];
}

export function ClusterGraph({ memories }: ClusterGraphProps) {
  const clusterData = useMemo(() => {
    const agentGroups = memories.reduce((acc, memory) => {
      const agentName = memory.Agent?.name || 'Unknown';
      if (!acc[agentName]) {
        acc[agentName] = [];
      }
      acc[agentName].push(memory);
      return acc;
    }, {} as Record<string, Memory[]>);
    return Object.entries(agentGroups).map(([agentName, agentMemories]) => {
      const avgStrength = agentMemories.reduce((sum, m) => sum + m.strength, 0) / agentMemories.length;
      const totalMemories = agentMemories.length;
      
      return {
        agent: agentName,
        count: totalMemories,
        avgStrength: parseFloat(avgStrength.toFixed(2)),
        strongMemories: agentMemories.filter(m => m.strength > 0.7).length,
        weakMemories: agentMemories.filter(m => m.strength <= 0.3).length,
      };
    });
  }, [memories]);

  const scatterData = useMemo(() => {
    return memories.map((memory, index) => ({
      x: index,
      y: memory.strength,
      name: memory.Agent?.name || 'Unknown',
      strength: memory.strength,
    }));
  }, [memories]);

  if (memories.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow text-center">
        <p className="text-slate-600 dark:text-slate-400">No data to visualize</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Memory Clusters by Agent</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={clusterData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="agent" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8b5cf6" name="Total Memories" />
            <Bar dataKey="strongMemories" fill="#10b981" name="Strong (>0.7)" />
            <Bar dataKey="weakMemories" fill="#f59e0b" name="Weak (≤0.3)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Memory Strength Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name="Memory Index" />
            <YAxis dataKey="y" name="Strength" domain={[0, 1]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                if (payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-2 border rounded shadow">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm">Strength: {data.strength.toFixed(2)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={scatterData} fill="#8b5cf6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {clusterData.map((cluster) => (
          <div key={cluster.agent} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <h4 className="font-semibold text-lg mb-2">{cluster.agent}</h4>
            <div className="space-y-1 text-sm">
              <p className="text-slate-600 dark:text-slate-400">
                Total: <span className="font-semibold text-slate-900 dark:text-slate-100">{cluster.count}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Avg Strength: <span className="font-semibold text-slate-900 dark:text-slate-100">{cluster.avgStrength}</span>
              </p>
              <p className="text-green-600 dark:text-green-400">
                Strong: {cluster.strongMemories}
              </p>
              <p className="text-amber-600 dark:text-amber-400">
                Weak: {cluster.weakMemories}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
