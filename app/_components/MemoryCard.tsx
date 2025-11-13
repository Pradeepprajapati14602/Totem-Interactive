'use client';

import { Memory, Agent } from '@/app/_lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { formatDistanceToNow } from 'date-fns';

interface MemoryCardProps {
  memory: Memory & { Agent?: Agent };
  onDelete?: (id: string) => void;
  onShowSources?: (sourceIds: string[]) => void;
  isHighlighted?: boolean;
}

export function MemoryCard({ memory, onDelete, onShowSources, isHighlighted }: MemoryCardProps) {
  const strengthPercentage = Math.round(memory.strength * 100);
  const strengthColor = 
    memory.strength > 0.7 ? 'bg-green-500' :
    memory.strength > 0.4 ? 'bg-yellow-500' :
    'bg-red-500';

  const isEvolved = memory.metadata && 
    typeof memory.metadata === 'object' && 
    'type' in memory.metadata && 
    memory.metadata.type === 'evolved';

  const sourceMemoryIds = isEvolved && 
    memory.metadata && 
    typeof memory.metadata === 'object' && 
    'sourceMemoryIds' in memory.metadata && 
    Array.isArray(memory.metadata.sourceMemoryIds)
      ? memory.metadata.sourceMemoryIds as string[]
      : [];

  const handleShowSources = () => {
    if (onShowSources && sourceMemoryIds.length > 0) {
      onShowSources(sourceMemoryIds);
    }
  };

  return (
    <Card className={`hover:shadow-md transition-all ${isHighlighted ? 'ring-2 ring-purple-500 shadow-lg' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {memory.Agent?.name || 'Unknown Agent'}
              {isEvolved && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                  Evolved
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
            </CardDescription>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(memory.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Delete memory"
            >
              ×
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-3">{memory.content}</p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Strength:</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${strengthColor} transition-all duration-300`}
                style={{ width: `${strengthPercentage}%` }}
              />
            </div>
            <span className="text-xs font-medium">{strengthPercentage}%</span>
          </div>

          {isEvolved && memory.metadata && typeof memory.metadata === 'object' && 'sourceMemoryCount' in memory.metadata && (
            <button
              onClick={handleShowSources}
              disabled={sourceMemoryIds.length === 0}
              className="text-xs text-purple-600 hover:text-purple-800 hover:underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Consolidated from {String(memory.metadata.sourceMemoryCount)} memories
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
