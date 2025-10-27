#!/usr/bin/env node

/**
 * Link Checker Script
 * Validates all HTTP/HTTPS links in markdown files
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const TIMEOUT_MS = 5000;
const ALLOWED_STATUS = [200, 201, 202, 203, 204, 205, 206, 301, 302, 303, 307, 308];

/**
 * Extract links from markdown content
 */
function extractLinks(content) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2];
    if (url.startsWith('http://') || url.startsWith('https://')) {
      links.push({ text: match[1], url });
    }
  }

  return links;
}

/**
 * Check if URL is valid
 */
async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    return {
      url,
      status: response.status,
      valid: ALLOWED_STATUS.includes(response.status),
    };
  } catch (error) {
    return {
      url,
      status: error.name === 'AbortError' ? 'TIMEOUT' : 'ERROR',
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (!file.startsWith('.') && file !== 'node_modules') {
        findMarkdownFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Main function
 */
async function main() {
  console.log('🔗 Link Checker\n');

  const rootDir = process.cwd();
  const markdownFiles = findMarkdownFiles(rootDir);

  console.log(`Found ${markdownFiles.length} markdown file(s)\n`);

  let totalLinks = 0;
  let brokenLinks = 0;
  const allBrokenLinks = [];

  for (const filePath of markdownFiles) {
    const content = readFileSync(filePath, 'utf-8');
    const links = extractLinks(content);

    if (links.length === 0) continue;

    console.log(`\n📄 ${filePath.replace(rootDir, '.')}`);
    totalLinks += links.length;

    for (const link of links) {
      const result = await checkUrl(link.url);

      if (!result.valid) {
        brokenLinks++;
        console.log(`  ❌ [${result.status}] ${link.url}`);
        allBrokenLinks.push({ file: filePath, ...link, ...result });
      } else {
        console.log(`  ✅ [${result.status}] ${link.url}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`  Total links checked: ${totalLinks}`);
  console.log(`  Working links: ${totalLinks - brokenLinks}`);
  console.log(`  Broken links: ${brokenLinks}`);

  if (brokenLinks > 0) {
    console.log('\n❌ Link check failed!\n');
    console.log('Broken links:');
    allBrokenLinks.forEach(link => {
      console.log(`  - ${link.file}: ${link.url} (${link.status})`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All links are valid!\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

