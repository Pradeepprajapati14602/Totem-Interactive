'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface Memory {
  id: string;
  agentId: string;
  content: string;
  strength: number;
  createdAt: string;
  updatedAt: string;
  Agent?: {
    name: string;
  };
}

interface EvolutionTimelineProps {
  memories: Memory[];
}

export function EvolutionTimeline({ memories }: EvolutionTimelineProps) {
  const timelineData = useMemo(() => {
    if (memories.length === 0) return [];

    const sorted = [...memories].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const grouped = sorted.reduce((acc, memory) => {
      const date = format(parseISO(memory.createdAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          avgStrength: 0,
          totalStrength: 0,
          memories: [],
        };
      }
      acc[date].count++;
      acc[date].totalStrength += memory.strength;
      acc[date].memories.push(memory);
      return acc;
    }, {} as Record<string, { date: string; count: number; avgStrength: number; totalStrength: number; memories: Memory[] }>);

    return Object.values(grouped).map(item => ({
      date: item.date,
      count: item.count,
      avgStrength: parseFloat((item.totalStrength / item.count).toFixed(2)),
      cumulative: 0,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [memories]);

  const withCumulative = useMemo(() => {
    return timelineData.reduce((acc, item, index) => {
      const cumulative = index === 0 ? item.count : acc[index - 1].cumulative + item.count;
      acc.push({ ...item, cumulative });
      return acc;
    }, [] as Array<{ date: string; count: number; avgStrength: number; cumulative: number }>);
  }, [timelineData]);

  const evolutionEvents = useMemo(() => {
    return memories
      .filter(m => new Date(m.updatedAt) > new Date(m.createdAt))
      .map(m => ({
        id: m.id,
        date: format(parseISO(m.updatedAt), 'yyyy-MM-dd HH:mm'),
        content: m.content.substring(0, 50) + '...',
        strength: m.strength,
        agent: m.Agent?.name || 'Unknown',
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [memories]);

  if (memories.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow text-center">
        <p className="text-slate-600 dark:text-slate-400">No timeline data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Memory Growth Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={withCumulative}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => format(parseISO(value as string), 'PPP')}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="cumulative" 
              stroke="#8b5cf6" 
              fill="#8b5cf6" 
              fillOpacity={0.6}
              name="Total Memories"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Daily Memory Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={withCumulative}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 1]} />
            <Tooltip 
              labelFormatter={(value) => format(parseISO(value as string), 'PPP')}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="count" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Daily Count"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="avgStrength" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Avg Strength"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Recent Evolution Events</h3>
        {evolutionEvents.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">No evolution events yet</p>
        ) : (
          <div className="space-y-3">
            {evolutionEvents.map((event) => (
              <div 
                key={event.id} 
                className="flex items-start gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
              >
                <div className="shrink-0">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ 
                      backgroundColor: `hsl(${event.strength * 120}, 70%, 50%)` 
                    }}
                  >
                    {Math.round(event.strength * 100)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {event.agent}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {event.content}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {event.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Memories</p>
          <p className="text-2xl font-bold text-purple-600">{memories.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <p className="text-sm text-slate-600 dark:text-slate-400">Avg Strength</p>
          <p className="text-2xl font-bold text-green-600">
            {(memories.reduce((sum, m) => sum + m.strength, 0) / memories.length).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <p className="text-sm text-slate-600 dark:text-slate-400">Strong Memories</p>
          <p className="text-2xl font-bold text-blue-600">
            {memories.filter(m => m.strength > 0.7).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <p className="text-sm text-slate-600 dark:text-slate-400">Evolution Events</p>
          <p className="text-2xl font-bold text-amber-600">
            {evolutionEvents.length}
          </p>
        </div>
      </div>
    </div>
  );
}
