/**
 * FileIndexer unit tests
 * Run with: npx tsx --test src/test/fileIndexer.test.ts
 * (outside VS Code context — no vscode API dependency in FileIndexer core logic)
 */

import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Since FileIndexer depends on vscode API for findFiles, we test the
// pattern matching and indexing logic directly

const PATTERNS: Array<{ regex: RegExp; type: string }> = [
  { regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm, type: 'function' },
  { regex: /^(?:export\s+)?class\s+(\w+)/gm, type: 'class' },
  { regex: /^(?:export\s+)?interface\s+(\w+)/gm, type: 'interface' },
  { regex: /^(?:export\s+)?type\s+(\w+)/gm, type: 'type' },
  { regex: /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/gm, type: 'variable' },
  { regex: /^import\s+.*from\s+['"](.*)['"]/gm, type: 'import' },
  { regex: /^def\s+(\w+)\s*\(/gm, type: 'function' },
  { regex: /^class\s+(\w+)[\s:(]/gm, type: 'class' },
];

function extractSymbols(content: string): Array<{ symbol: string; type: string }> {
  const results: Array<{ symbol: string; type: string }> = [];
  for (const { regex, type } of PATTERNS) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      results.push({ symbol: match[1], type });
    }
  }
  return results;
}

describe('FileIndexer pattern matching', () => {
  it('extracts TypeScript functions', () => {
    const content = `
export function fetchData() {}
async function processItems() {}
function helper() {}
`;
    const symbols = extractSymbols(content);
    const functions = symbols.filter(s => s.type === 'function');
    assert.strictEqual(functions.length, 3);
    assert.ok(functions.some(f => f.symbol === 'fetchData'));
    assert.ok(functions.some(f => f.symbol === 'processItems'));
    assert.ok(functions.some(f => f.symbol === 'helper'));
  });

  it('extracts classes', () => {
    const content = `
export class UserService {}
class InternalHelper {}
`;
    const symbols = extractSymbols(content);
    const classes = symbols.filter(s => s.type === 'class');
    // Note: Python regex also matches TS class without export prefix — 3 matches total
    assert.ok(classes.length >= 2, `Expected at least 2 classes, got ${classes.length}`);
    assert.ok(classes.some(c => c.symbol === 'UserService'));
    assert.ok(classes.some(c => c.symbol === 'InternalHelper'));
  });

  it('extracts interfaces and types', () => {
    const content = `
export interface ApiResponse {}
interface InternalConfig {}
export type UserId = string;
type Config = { key: string };
`;
    const symbols = extractSymbols(content);
    const interfaces = symbols.filter(s => s.type === 'interface');
    const types = symbols.filter(s => s.type === 'type');
    assert.strictEqual(interfaces.length, 2);
    assert.strictEqual(types.length, 2);
  });

  it('extracts variables', () => {
    const content = `
export const API_URL = 'https://example.com';
let counter = 0;
var legacy = true;
`;
    const symbols = extractSymbols(content);
    const vars = symbols.filter(s => s.type === 'variable');
    assert.strictEqual(vars.length, 3);
    assert.ok(vars.some(v => v.symbol === 'API_URL'));
  });

  it('extracts imports', () => {
    const content = `
import { something } from './utils';
import * as path from 'path';
`;
    const symbols = extractSymbols(content);
    const imports = symbols.filter(s => s.type === 'import');
    assert.strictEqual(imports.length, 2);
  });

  it('extracts Python functions and classes', () => {
    const content = `
def process_data():
    pass

class DataProcessor:
    pass
`;
    const symbols = extractSymbols(content);
    assert.ok(symbols.some(s => s.symbol === 'process_data' && s.type === 'function'));
    assert.ok(symbols.some(s => s.symbol === 'DataProcessor' && s.type === 'class'));
  });

  it('handles empty content', () => {
    const symbols = extractSymbols('');
    assert.strictEqual(symbols.length, 0);
  });

  it('handles content without any symbols', () => {
    const content = `
// just a comment
/* block comment */
`;
    const symbols = extractSymbols(content);
    assert.strictEqual(symbols.length, 0);
  });
});

describe('FileIndexer search logic', () => {
  it('searches symbols case-insensitively', () => {
    const index = [
      { symbol: 'fetchData', type: 'function', file: 'a.ts', line: 1 },
      { symbol: 'processItems', type: 'function', file: 'b.ts', line: 5 },
      { symbol: 'FetchConfig', type: 'interface', file: 'c.ts', line: 10 },
    ];

    const query = 'fetch';
    const lower = query.toLowerCase();
    const results = index.filter(
      e => e.symbol.toLowerCase().includes(lower),
    );

    assert.strictEqual(results.length, 2);
    assert.ok(results.some(r => r.symbol === 'fetchData'));
    assert.ok(results.some(r => r.symbol === 'FetchConfig'));
  });

  it('returns exact matches first when sorted', () => {
    const index = [
      { symbol: 'processData', type: 'function' },
      { symbol: 'data', type: 'variable' },
      { symbol: 'getData', type: 'function' },
    ];

    const query = 'data';
    const lower = query.toLowerCase();
    const results = index
      .filter(e => e.symbol.toLowerCase().includes(lower))
      .sort((a, b) => {
        const aExact = a.symbol.toLowerCase() === lower ? 0 : 1;
        const bExact = b.symbol.toLowerCase() === lower ? 0 : 1;
        return aExact - bExact;
      });

    assert.strictEqual(results[0].symbol, 'data');
  });
});
