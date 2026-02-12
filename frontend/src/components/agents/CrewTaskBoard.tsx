import React from 'react';

interface Task {
  id: string;
  title: string;
  status: string;
  assignedTo: string | null;
  priority: number;
}

interface CrewTaskBoardProps {
  tasks: Task[];
  workerMap: Map<string, { role: string; color: string }>;
}

const statusIcons: Record<string, string> = {
  pending: '○',
  in_progress: '◉',
  completed: '●',
  blocked: '⊘',
};

const statusLabels: Record<string, string> = {
  pending: 'Bekliyor',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  blocked: 'Engelli',
};

const statusColors: Record<string, string> = {
  pending: 'text-zinc-400',
  in_progress: 'text-blue-400',
  completed: 'text-emerald-400',
  blocked: 'text-red-400',
};

export const CrewTaskBoard: React.FC<CrewTaskBoardProps> = ({ tasks, workerMap }) => {
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-zinc-300">Görev Listesi</h3>
        <span className="text-xs text-zinc-500">
          {completedCount}/{tasks.length} tamamlandı
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-zinc-700/50 rounded-full h-1">
        <div
          className="h-1 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
        />
      </div>

      {/* Tasks */}
      <div className="space-y-1">
        {tasks.map((task) => {
          const worker = task.assignedTo ? workerMap.get(task.assignedTo) : null;
          return (
            <div
              key={task.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800/50"
            >
              <span className={`text-sm ${statusColors[task.status] || 'text-zinc-400'}`}>
                {statusIcons[task.status] || '○'}
              </span>
              <span className={`text-sm flex-1 ${
                task.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-300'
              }`}>
                {task.title}
              </span>
              {worker && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    color: worker.color,
                    backgroundColor: `${worker.color}15`,
                  }}
                >
                  @{worker.role}
                </span>
              )}
              <span className={`text-xs ${statusColors[task.status] || 'text-zinc-500'}`}>
                {statusLabels[task.status] || task.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
