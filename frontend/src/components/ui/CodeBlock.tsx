interface CodeBlockProps {
  data: unknown;
  title?: string;
}

export function CodeBlock({ data, title }: CodeBlockProps) {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
      {title && <div className="text-sm text-gray-400 mb-2">{title}</div>}
      <pre className="text-sm text-gray-100">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
