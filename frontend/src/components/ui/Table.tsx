interface TableProps {
  children: React.ReactNode;
}

export function Table({ children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-ak-border">{children}</table>
    </div>
  );
}

interface TableHeaderProps {
  children: React.ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
  return <thead className="bg-ak-surface">{children}</thead>;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

export function TableRow({ children, className = '' }: TableRowProps) {
  return <tr className={className}>{children}</tr>;
}

interface TableHeadProps {
  children: React.ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-ak-text-secondary uppercase tracking-wider">
      {children}
    </th>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody className="bg-ak-surface-2 divide-y divide-ak-border">{children}</tbody>;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return <td className={`px-6 py-4 whitespace-nowrap ${className}`}>{children}</td>;
}
