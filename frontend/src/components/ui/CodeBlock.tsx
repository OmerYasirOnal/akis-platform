interface CodeBlockProps {
  data: unknown;
  title?: string;
}

export function CodeBlock({ data, title }: CodeBlockProps) {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="bg-ak-surface rounded-lg p-4 overflow-x-auto">
      {title && <div className="text-sm text-ak-text-secondary mb-2">{title}</div>}
      <pre className="text-sm text-ak-text-primary">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
