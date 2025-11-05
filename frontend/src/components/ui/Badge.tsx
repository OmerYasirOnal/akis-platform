interface BadgeProps {
  state: 'pending' | 'running' | 'completed' | 'failed';
}

const stateColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export function Badge({ state }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stateColors[state]}`}
    >
      {state}
    </span>
  );
}

