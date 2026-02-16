#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, 'docs');
const scanAllDocs = process.argv.includes('--all');

const defaultTargets = [
  path.join(docsRoot, 'NEXT.md'),
  path.join(docsRoot, 'ROADMAP.md'),
  path.join(docsRoot, 'planning'),
];

function collectMarkdownFiles(targetPath, acc = []) {
  if (!fs.existsSync(targetPath)) {
    return acc;
  }

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    if (targetPath.toLowerCase().endsWith('.md')) {
      acc.push(targetPath);
    }
    return acc;
  }

  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      collectMarkdownFiles(fullPath, acc);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function normalizeLinkTarget(raw) {
  let value = raw.trim();
  if (!value) return null;

  if (value.startsWith('<') && value.endsWith('>')) {
    value = value.slice(1, -1).trim();
  }

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('file://') ||
    value.startsWith('cci:') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    value.startsWith('#') ||
    value.startsWith('/')
  ) {
    return null;
  }

  const firstToken = value.split(/\s+/)[0];
  const withoutHash = firstToken.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return withoutQuery || null;
}

function pathExistsWithMarkdownFallback(targetPath) {
  if (fs.existsSync(targetPath)) return true;
  if (!path.extname(targetPath)) {
    const withMd = `${targetPath}.md`;
    if (fs.existsSync(withMd)) return true;
  }
  return false;
}

if (!fs.existsSync(docsRoot)) {
  console.error('[check_docs_references] docs/ dizini bulunamadı.');
  process.exit(1);
}

const markdownFiles = scanAllDocs
  ? collectMarkdownFiles(docsRoot)
  : defaultTargets.flatMap((target) => collectMarkdownFiles(target));
const markdownLinkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
const missing = [];

for (const file of markdownFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const rawTarget = match[1];
    const normalizedTarget = normalizeLinkTarget(rawTarget);
    if (!normalizedTarget) continue;

    const resolved = normalizedTarget.startsWith('/')
      ? path.join(repoRoot, normalizedTarget.slice(1))
      : path.resolve(path.dirname(file), normalizedTarget);

    if (!pathExistsWithMarkdownFallback(resolved)) {
      missing.push({
        file: path.relative(repoRoot, file),
        target: normalizedTarget,
      });
    }
  }
}

if (missing.length === 0) {
  const mode = scanAllDocs ? 'all-docs' : 'active-docs';
  console.log(`[check_docs_references] OK (${mode}) - ${markdownFiles.length} markdown dosyası kontrol edildi, kırık referans yok.`);
  process.exit(0);
}

console.error(`[check_docs_references] ${missing.length} kırık referans bulundu:`);
for (const item of missing) {
  console.error(`- ${item.file} -> ${item.target}`);
}
process.exit(1);
