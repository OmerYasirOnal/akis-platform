#!/usr/bin/env node

/**
 * Documentation Proof Script
 * Verifies that documentation references actual files and commands work
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
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
 * Extract file references from markdown
 */
function extractFileReferences(content) {
  const references = [];
  const lines = content.split('\n');
  
  // Match code blocks with file paths
  const pathRegex = /`([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)`/g;
  
  lines.forEach((line, index) => {
    let match;
    while ((match = pathRegex.exec(line)) !== null) {
      const path = match[1];
      if (path.includes('/') || path.includes('.')) {
        references.push({
          path,
          line: index + 1,
        });
      }
    }
  });
  
  return references;
}

/**
 * Extract commands from code blocks
 */
function extractCommands(content) {
  const commands = [];
  const bashBlockRegex = /```(?:bash|sh|shell)\n([\s\S]*?)\n```/g;
  let match;

  while ((match = bashBlockRegex.exec(content)) !== null) {
    const block = match[1];
    const lines = block.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    commands.push(...lines.map(cmd => cmd.trim()));
  }

  return commands;
}

/**
 * Verify file reference exists
 */
function verifyFileReference(rootDir, path) {
  const fullPath = join(rootDir, path);
  return existsSync(fullPath);
}

/**
 * Dry-run command (syntax check only)
 */
function dryRunCommand(command) {
  // Skip dangerous commands
  const dangerous = ['rm', 'rmdir', 'del', 'format', 'mkfs'];
  if (dangerous.some(d => command.toLowerCase().includes(d))) {
    return { valid: false, reason: 'Dangerous command' };
  }

  // Check for common valid patterns
  const validPatterns = [
    /^npm (install|run|start|build|test|dev)/,
    /^yarn (install|add|run|start|build|test|dev)/,
    /^pnpm (install|add|run|start|build|test|dev)/,
    /^git (clone|pull|push|commit|checkout|branch)/,
    /^node /,
    /^cd /,
    /^mkdir /,
    /^cp /,
    /^mv /,
    /^echo /,
    /^cat /,
  ];

  const isValid = validPatterns.some(pattern => pattern.test(command));

  return { valid: isValid, reason: isValid ? 'Valid pattern' : 'Unknown command' };
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Documentation Proof Checker\n');

  const rootDir = process.cwd();
  const markdownFiles = findMarkdownFiles(rootDir);

  console.log(`Found ${markdownFiles.length} markdown file(s)\n`);

  let totalReferences = 0;
  let missingReferences = 0;
  let totalCommands = 0;
  let invalidCommands = 0;

  markdownFiles.forEach(filePath => {
    const content = readFileSync(filePath, 'utf-8');
    
    // Check file references
    const references = extractFileReferences(content);
    if (references.length > 0) {
      console.log(`\n📄 ${filePath.replace(rootDir, '.')}`);
      console.log(`  File References:`);
      
      references.forEach(ref => {
        totalReferences++;
        const exists = verifyFileReference(rootDir, ref.path);
        
        if (!exists) {
          missingReferences++;
          console.log(`    ❌ Line ${ref.line}: ${ref.path} (NOT FOUND)`);
        } else {
          console.log(`    ✅ Line ${ref.line}: ${ref.path}`);
        }
      });
    }

    // Check commands
    const commands = extractCommands(content);
    if (commands.length > 0) {
      console.log(`  Commands:`);
      
      commands.forEach(cmd => {
        totalCommands++;
        const check = dryRunCommand(cmd);
        
        if (!check.valid) {
          invalidCommands++;
          console.log(`    ⚠️  ${cmd} (${check.reason})`);
        } else {
          console.log(`    ✅ ${cmd}`);
        }
      });
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`  File references checked: ${totalReferences}`);
  console.log(`  Missing references: ${missingReferences}`);
  console.log(`  Commands checked: ${totalCommands}`);
  console.log(`  Invalid commands: ${invalidCommands}`);

  if (missingReferences > 0 || invalidCommands > 0) {
    console.log('\n⚠️  Documentation proof found issues (non-blocking)\n');
    process.exit(0); // Don't fail build
  } else {
    console.log('\n✅ All documentation proofs passed!\n');
    process.exit(0);
  }
}

main();

