#!/usr/bin/env node
/**
 * verify_docs_i18n_parity.mjs — check EN/TR locale parity for docs keys.
 *
 * Usage: node scripts/verify_docs_i18n_parity.mjs
 *
 * Exits 0 if parity is met, 1 if keys are missing.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_I18N = resolve(__dirname, '../frontend/src/i18n/locales');

function loadJson(filename) {
  const raw = readFileSync(resolve(FRONTEND_I18N, filename), 'utf-8');
  return JSON.parse(raw);
}

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

try {
  const en = loadJson('en.json');
  const tr = loadJson('tr.json');

  const enKeys = new Set(flattenKeys(en));
  const trKeys = new Set(flattenKeys(tr));

  const missingInTr = [...enKeys].filter((k) => !trKeys.has(k));
  const missingInEn = [...trKeys].filter((k) => !enKeys.has(k));

  // Filter for docs keys specifically
  const docsInTrMissing = missingInTr.filter((k) => k.startsWith('docs.'));
  const docsInEnMissing = missingInEn.filter((k) => k.startsWith('docs.'));

  console.log(`EN keys: ${enKeys.size}`);
  console.log(`TR keys: ${trKeys.size}`);
  console.log(`Docs keys missing in TR: ${docsInTrMissing.length}`);
  console.log(`Docs keys missing in EN: ${docsInEnMissing.length}`);

  if (docsInTrMissing.length > 0) {
    console.log('\n--- Missing in TR ---');
    docsInTrMissing.forEach((k) => console.log(`  ${k}`));
  }

  if (docsInEnMissing.length > 0) {
    console.log('\n--- Missing in EN ---');
    docsInEnMissing.forEach((k) => console.log(`  ${k}`));
  }

  const totalMissing = docsInTrMissing.length + docsInEnMissing.length;
  if (totalMissing > 0) {
    console.log(`\nFAIL: ${totalMissing} docs i18n key(s) out of parity`);
    process.exit(1);
  }

  console.log('\nPASS: All docs i18n keys are in parity');
  process.exit(0);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(2);
}
