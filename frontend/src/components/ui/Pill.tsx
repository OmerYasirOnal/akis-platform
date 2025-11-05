interface PillProps {
  type: 'scribe' | 'trace' | 'proto';
}

const typeColors = {
  scribe: 'bg-purple-100 text-purple-800',
  trace: 'bg-indigo-100 text-indigo-800',
  proto: 'bg-pink-100 text-pink-800',
};

export function Pill({ type }: PillProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[type]}`}
    >
      {type}
    </span>
  );
}
