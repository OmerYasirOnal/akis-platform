import { useState, useCallback } from 'react';

// ═══ Language detection ═══
function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', html: 'html', css: 'css', scss: 'scss',
    md: 'markdown', yaml: 'yaml', yml: 'yaml', sh: 'shell',
    py: 'python', sql: 'sql', toml: 'toml', xml: 'xml',
  };
  return langMap[ext] || 'text';
}

// ═══ Simple syntax highlighting ═══
const TOKEN_CLASSES: Record<string, string> = {
  keyword: 'text-[#d73a49] dark:text-[#ff7b72]',
  string: 'text-[#032f62] dark:text-[#a5d6ff]',
  comment: 'text-[#6a737d] dark:text-[#8b949e] italic',
  number: 'text-[#005cc5] dark:text-[#79c0ff]',
  type: 'text-[#6f42c1] dark:text-[#d2a8ff]',
  function: 'text-[#6f42c1] dark:text-[#d2a8ff]',
  tag: 'text-[#22863a] dark:text-[#7ee787]',
  attr: 'text-[#005cc5] dark:text-[#79c0ff]',
  punct: 'text-ak-text-tertiary',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Single-pass tokenizer: avoids chained regex issues where
// keyword patterns match inside generated <span> attributes.
function highlightLine(line: string, language: string): string {
  const escaped = escapeHtml(line);

  // Build a regex with named alternations for the language
  const rules = getTokenRules(language);
  if (rules.length === 0) return escaped;

  // Build combined pattern — order matters (first match wins)
  const combined = rules.map((r) => `(?<${r.name}>${r.pattern})`).join('|');
  const re = new RegExp(combined, 'g');

  // Map rule name → CSS class
  const classMap: Record<string, string> = {};
  for (const r of rules) classMap[r.name] = r.cls;

  return escaped.replace(re, (...args) => {
    const groups = args[args.length - 1] as Record<string, string | undefined>;
    for (const [name, val] of Object.entries(groups)) {
      if (val !== undefined) {
        return `<span class="${classMap[name]}">${val}</span>`;
      }
    }
    return args[0] as string;
  });
}

interface TokenRule { name: string; pattern: string; cls: string }

function getTokenRules(language: string): TokenRule[] {
  if (language === 'json') {
    return [
      { name: 'jkey', pattern: `"(?:[^"\\\\]|\\\\.)*"(?=\\s*:)`, cls: TOKEN_CLASSES.attr },
      { name: 'jstr', pattern: `"(?:[^"\\\\]|\\\\.)*"`, cls: TOKEN_CLASSES.string },
      { name: 'jnum', pattern: `\\b\\d+\\.?\\d*\\b`, cls: TOKEN_CLASSES.number },
      { name: 'jkw', pattern: `\\b(?:true|false|null)\\b`, cls: TOKEN_CLASSES.keyword },
    ];
  }

  if (language === 'html' || language === 'xml') {
    return [
      { name: 'hcmt', pattern: `&lt;!--[\\s\\S]*?--&gt;`, cls: TOKEN_CLASSES.comment },
      { name: 'htag', pattern: `(?<=&lt;\\/?)\\w[\\w-]*`, cls: TOKEN_CLASSES.tag },
      { name: 'hattr', pattern: `[\\w-]+(?==)`, cls: TOKEN_CLASSES.attr },
      { name: 'hstr', pattern: `&quot;[^&]*&quot;`, cls: TOKEN_CLASSES.string },
    ];
  }

  if (language === 'css' || language === 'scss') {
    return [
      { name: 'ccmt', pattern: `\\/\\*[\\s\\S]*?\\*\\/`, cls: TOKEN_CLASSES.comment },
      { name: 'clcmt', pattern: `\\/\\/.*$`, cls: TOKEN_CLASSES.comment },
      { name: 'chex', pattern: `#[0-9a-fA-F]{3,8}`, cls: TOKEN_CLASSES.number },
      { name: 'cstr', pattern: `"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'`, cls: TOKEN_CLASSES.string },
      { name: 'cnum', pattern: `\\b\\d+(?:px|em|rem|%|vh|vw|s|ms)?\\b`, cls: TOKEN_CLASSES.number },
    ];
  }

  if (language === 'markdown') {
    return [
      { name: 'mhead', pattern: `^#{1,6}\\s.*$`, cls: TOKEN_CLASSES.keyword },
      { name: 'mbold', pattern: `\\*\\*[^*]+\\*\\*`, cls: 'font-bold' },
      { name: 'mcode', pattern: '`[^`]+`', cls: TOKEN_CLASSES.string },
      { name: 'mlist', pattern: `^\\s*[-*]\\s`, cls: TOKEN_CLASSES.punct },
    ];
  }

  // TypeScript / JavaScript / default
  return [
    { name: 'cmt', pattern: `\\/\\/.*$`, cls: TOKEN_CLASSES.comment },
    { name: 'sqstr', pattern: `'(?:[^'\\\\]|\\\\.)*'`, cls: TOKEN_CLASSES.string },
    { name: 'dqstr', pattern: `"(?:[^"\\\\]|\\\\.)*"`, cls: TOKEN_CLASSES.string },
    { name: 'tmpl', pattern: '`(?:[^`\\\\]|\\\\.)*`', cls: TOKEN_CLASSES.string },
    { name: 'kw', pattern: `\\b(?:import|export|from|default|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|typeof|instanceof|in|of|class|extends|super|this|async|await|yield)\\b`, cls: TOKEN_CLASSES.keyword },
    { name: 'typ', pattern: `\\b(?:interface|type|enum|string|number|boolean|void|null|undefined|any|never|unknown|Array|Record|Promise|React|useState|useEffect|useCallback|useRef|useMemo)\\b`, cls: TOKEN_CLASSES.type },
    { name: 'bool', pattern: `\\b(?:true|false|null|undefined)\\b`, cls: TOKEN_CLASSES.keyword },
    { name: 'num', pattern: `\\b\\d+\\.?\\d*\\b`, cls: TOKEN_CLASSES.number },
  ];
}

// ═══ CodeViewer Component ═══

interface CodeViewerProps {
  filePath: string;
  content: string;
  language?: string;
  agent?: 'proto' | 'trace';
  lines?: number;
}

export function CodeViewer({ filePath, content, language, agent, lines }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const lang = language || detectLanguage(filePath);
  const fileName = filePath.split('/').pop() || filePath;
  const codeLines = content.split('\n');
  const lineCount = lines || codeLines.length;
  const agentColor = agent === 'trace' ? 'text-ak-trace' : 'text-ak-proto';
  const agentLabel = agent === 'trace' ? 'TRACE' : 'PROTO';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-ak-surface">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-ak-border px-3 py-2">
        <span className="text-xs">📄</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-xs font-medium text-ak-text-primary">{fileName}</span>
            <span className={`flex-shrink-0 text-[9px] font-bold ${agentColor}`}>{agentLabel}</span>
          </div>
          <p className="truncate font-mono text-[10px] text-ak-text-tertiary">{filePath}</p>
        </div>
        <span className="flex-shrink-0 font-mono text-[10px] text-ak-text-tertiary">{lineCount}L</span>
        <span className="mx-1 h-3 w-px bg-ak-border" />
        <span className="flex-shrink-0 rounded bg-ak-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-ak-text-tertiary">{lang}</span>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex-shrink-0 rounded-md p-1 text-ak-text-tertiary transition-colors hover:bg-ak-hover hover:text-ak-text-primary"
          title="Copy to clipboard"
        >
          {copied ? (
            <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse font-mono text-[12px] leading-[1.6]">
          <tbody>
            {codeLines.map((line, i) => (
              <tr key={i} className="hover:bg-ak-hover/50">
                <td className="select-none border-r border-ak-border px-3 py-0 text-right text-[11px] text-ak-text-tertiary/60">
                  {i + 1}
                </td>
                <td className="whitespace-pre px-4 py-0 text-ak-text-primary">
                  <span dangerouslySetInnerHTML={{ __html: highlightLine(line, lang) }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
