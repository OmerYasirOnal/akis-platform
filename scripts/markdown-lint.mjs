#!/usr/bin/env node

/**
 * Markdown Linter Script
 * Basic markdown validation and style checking
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .git, and .next
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        findMarkdownFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Lint rules
 */
const rules = [
  {
    name: 'no-empty-headings',
    check: (lines) => {
      const issues = [];
      lines.forEach((line, index) => {
        if (line.match(/^#{1,6}\s*$/)) {
          issues.push({
            line: index + 1,
            message: 'Empty heading',
          });
        }
      });
      return issues;
    },
  },
  {
    name: 'no-trailing-spaces',
    check: (lines) => {
      const issues = [];
      lines.forEach((line, index) => {
        if (line.endsWith(' ') || line.endsWith('\t')) {
          issues.push({
            line: index + 1,
            message: 'Trailing whitespace',
          });
        }
      });
      return issues;
    },
  },
  {
    name: 'heading-increment',
    check: (lines) => {
      const issues = [];
      let prevLevel = 0;
      
      lines.forEach((line, index) => {
        const match = line.match(/^(#{1,6})\s+/);
        if (match) {
          const level = match[1].length;
          if (prevLevel > 0 && level > prevLevel + 1) {
            issues.push({
              line: index + 1,
              message: `Heading level jumped from ${prevLevel} to ${level}`,
            });
          }
          prevLevel = level;
        }
      });
      
      return issues;
    },
  },
  {
    name: 'no-bare-urls',
    check: (lines) => {
      const issues = [];
      const urlRegex = /(?<![(<])(https?:\/\/[^\s)>]+)(?![)>])/g;
      
      lines.forEach((line, index) => {
        // Skip code blocks
        if (line.trim().startsWith('```')) return;
        
        let match;
        while ((match = urlRegex.exec(line)) !== null) {
          issues.push({
            line: index + 1,
            message: `Bare URL found: ${match[1]}. Consider using markdown link format.`,
          });
        }
      });
      
      return issues;
    },
  },
  {
    name: 'code-block-language',
    check: (lines) => {
      const issues = [];
      
      lines.forEach((line, index) => {
        if (line.trim().startsWith('```') && line.trim() === '```') {
          issues.push({
            line: index + 1,
            message: 'Code block missing language identifier',
          });
        }
      });
      
      return issues;
    },
  },
];

/**
 * Lint a single file
 */
function lintFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  rules.forEach(rule => {
    const ruleIssues = rule.check(lines);
    ruleIssues.forEach(issue => {
      issues.push({
        rule: rule.name,
        ...issue,
      });
    });
  });

  return issues;
}

/**
 * Main function
 */
function main() {
  console.log('📝 Markdown Linter\n');

  const rootDir = process.cwd();
  const markdownFiles = findMarkdownFiles(rootDir);

  console.log(`Found ${markdownFiles.length} markdown file(s)\n`);

  let totalIssues = 0;
  const fileIssues = [];

  markdownFiles.forEach(filePath => {
    const issues = lintFile(filePath);
    
    if (issues.length > 0) {
      totalIssues += issues.length;
      fileIssues.push({ file: filePath, issues });
      
      console.log(`\n📄 ${filePath.replace(rootDir, '.')}`);
      issues.forEach(issue => {
        console.log(`  Line ${issue.line}: [${issue.rule}] ${issue.message}`);
      });
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`  Total files checked: ${markdownFiles.length}`);
  console.log(`  Files with issues: ${fileIssues.length}`);
  console.log(`  Total issues: ${totalIssues}`);

  if (totalIssues > 0) {
    console.log('\n⚠️  Markdown linting found issues (non-blocking)\n');
    process.exit(0); // Don't fail build, just warn
  } else {
    console.log('\n✅ All markdown files are valid!\n');
    process.exit(0);
  }
}

main();

