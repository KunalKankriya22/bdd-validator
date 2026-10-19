import * as fs from 'fs';
import * as path from 'path';

export interface ItBlock {
  name: string;
  start: number;
  end: number;
  body: string;
}

export interface DescribeBlock {
  name: string;
  start: number;
  end: number;
  body: string;
  itCount: number;
  nestedDescribeCount: number;
}

export interface BraceAnalysis {
  finalDepth: number;
  issues: Array<{ line: number; type: string; depth: number }>;
}

const projectRoot = path.resolve(__dirname, '..');
export const SRC_DIR = fs.existsSync(path.join(projectRoot, 'src'))
  ? path.join(projectRoot, 'src')
  : path.resolve(projectRoot, '..', 'src');

export function findSpecFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findSpecFiles(fullPath));
    else if (entry.name.endsWith('.spec.ts')) results.push(fullPath);
  }
  return results;
}

export function countItBlocks(content: string): number {
  return (content.match(/\bit\s*\(/g) || []).length;
}

export function removeItBlockByExactName(content: string, testName: string): string {
  const escapedName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(\\n[ \\t]*)it\\s*\\(\\s*['"\`]${escapedName}['"\`]`,
    'g'
  );

  let match: RegExpExecArray | null;
  let result = content;

  while ((match = pattern.exec(result)) !== null) {
    const startIdx = match.index;
    const leadingNewline = match[1];
    const parenStart = result.indexOf('(', startIdx + leadingNewline.length + 2);
    if (parenStart === -1) continue;

    let depth = 1;
    let i = parenStart + 1;
    let inString = false;
    let stringChar = '';

    while (i < result.length && depth > 0) {
      const ch = result[i];
      if (inString) {
        if (ch === '\\') { i += 2; continue; }
        if (ch === stringChar) inString = false;
      } else {
        if (ch === "'" || ch === '"' || ch === '`') { inString = true; stringChar = ch; }
        else if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      i++;
    }

    if (depth === 0) {
      let endIdx = i;
      while (endIdx < result.length && (result[endIdx] === ';' || result[endIdx] === ' ' || result[endIdx] === '\t')) endIdx++;
      if (result[endIdx] === '\n') endIdx++;
      result = result.slice(0, startIdx) + result.slice(endIdx);
      pattern.lastIndex = startIdx;
    }
  }

  return result;
}

export function removeDescribeBlock(content: string, describeName: string): string {
  const escapedName = describeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(\\n[ \\t]*)describe\\s*\\(\\s*['"\`]${escapedName}['"\`]`,
    'g'
  );

  let match: RegExpExecArray | null;
  let result = content;

  while ((match = pattern.exec(result)) !== null) {
    const startIdx = match.index;
    const leadingNewline = match[1];
    const parenStart = result.indexOf('(', startIdx + leadingNewline.length + 8);
    if (parenStart === -1) continue;

    let depth = 1;
    let i = parenStart + 1;
    let inString = false;
    let stringChar = '';

    while (i < result.length && depth > 0) {
      const ch = result[i];
      if (inString) {
        if (ch === '\\') { i += 2; continue; }
        if (ch === stringChar) inString = false;
      } else {
        if (ch === "'" || ch === '"' || ch === '`') { inString = true; stringChar = ch; }
        else if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      i++;
    }

    if (depth === 0) {
      const block = result.slice(startIdx, i);
      const itCount = (block.match(/\bit\s*\(/g) || []).length;

      if (itCount === 0) {
        let endIdx = i;
        while (endIdx < result.length && (result[endIdx] === ';' || result[endIdx] === ' ' || result[endIdx] === '\t')) endIdx++;
        if (result[endIdx] === '\n') endIdx++;
        result = result.slice(0, startIdx) + result.slice(endIdx);
        pattern.lastIndex = startIdx;
      }
    }
  }

  return result;
}

export function removeEmptyDescribeBlocks(content: string): string {
  let result = content;
  let prevLength: number;
  do {
    prevLength = result.length;
    result = result.replace(
      /\n\s*describe\s*\(\s*['"`][^'"`]*['"`]\s*,\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)\s*;?\s*\n/g,
      '\n'
    );
  } while (result.length !== prevLength);
  return result;
}

export function extractItBlocks(content: string): ItBlock[] {
  const blocks: ItBlock[] = [];
  const pattern = /(\n[ \t]*)it\s*\(\s*['"`]([^'"`]*)['"`]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const startIdx = match.index;
    const indent = match[1];
    const name = match[2];

    const parenStart = content.indexOf('(', startIdx + indent.length + 2);
    if (parenStart === -1) continue;

    let depth = 1;
    let i = parenStart + 1;
    let inString = false;
    let stringChar = '';

    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (inString) {
        if (ch === '\\') { i += 2; continue; }
        if (ch === stringChar) inString = false;
      } else {
        if (ch === "'" || ch === '"' || ch === '`') { inString = true; stringChar = ch; }
        else if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      i++;
    }

    if (depth === 0) {
      let endIdx = i;
      while (endIdx < content.length && (content[endIdx] === ';' || content[endIdx] === ' ' || content[endIdx] === '\t')) endIdx++;
      if (content[endIdx] === '\n') endIdx++;

      blocks.push({ name, start: startIdx, end: endIdx, body: content.slice(startIdx, endIdx) });
    }
  }
  return blocks;
}

export function removeTestsByName(testNames: string[], label: string): void {
  const specFiles = findSpecFiles(SRC_DIR);
  let totalFilesModified = 0;
  let totalTestsRemoved = 0;

  for (const file of specFiles) {
    const original = fs.readFileSync(file, 'utf8');
    const originalCount = countItBlocks(original);
    if (originalCount <= 1) continue;

    let modified = original;
    for (const name of testNames) {
      modified = removeItBlockByExactName(modified, name);
    }
    modified = removeEmptyDescribeBlocks(modified);

    const newCount = countItBlocks(modified);
    if (newCount < originalCount && newCount > 0) {
      fs.writeFileSync(file, modified, 'utf8');
      totalFilesModified++;
      totalTestsRemoved += originalCount - newCount;
    }
  }

  const remaining = specFiles.reduce((s, f) => s + countItBlocks(fs.readFileSync(f, 'utf8')), 0);
  console.log(`${label}:`);
  console.log(`Files modified: ${totalFilesModified}`);
  console.log(`Tests removed: ${totalTestsRemoved}`);
  console.log(`Total remaining tests: ${remaining}`);
}

export function removeTestsByBodyAnalysis(
  predicate: (name: string, body: string) => boolean,
  label: string,
  maxRemovalRatio = 1.0
): void {
  const specFiles = findSpecFiles(SRC_DIR);
  let totalFilesModified = 0;
  let totalTestsRemoved = 0;

  for (const file of specFiles) {
    const original = fs.readFileSync(file, 'utf8');
    const originalCount = countItBlocks(original);
    if (originalCount <= 2) continue;

    const blocks = extractItBlocks(original);
    let toRemove = blocks.filter(b => predicate(b.name, b.body));

    if (toRemove.length === 0) continue;
    if (maxRemovalRatio < 1.0 && toRemove.length > originalCount * maxRemovalRatio) {
      toRemove = toRemove.slice(0, Math.floor(originalCount * maxRemovalRatio));
    }
    if (toRemove.length >= originalCount) continue;

    let modified = original;
    for (const block of toRemove.sort((a, b) => b.start - a.start)) {
      modified = modified.slice(0, block.start) + modified.slice(block.end);
    }
    modified = removeEmptyDescribeBlocks(modified);

    const newCount = countItBlocks(modified);
    if (newCount < originalCount && newCount > 0) {
      fs.writeFileSync(file, modified, 'utf8');
      totalFilesModified++;
      totalTestsRemoved += originalCount - newCount;
    }
  }

  const remaining = specFiles.reduce((s, f) => s + countItBlocks(fs.readFileSync(f, 'utf8')), 0);
  console.log(`${label}:`);
  console.log(`Files modified: ${totalFilesModified}`);
  console.log(`Tests removed: ${totalTestsRemoved}`);
  console.log(`Total remaining tests: ${remaining}`);
}

export function checkBraceBalance(content: string): BraceAnalysis {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let lineNum = 1;
  const issues: Array<{ line: number; type: string; depth: number }> = [];

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '\n') { lineNum++; continue; }

    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === stringChar) inString = false;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') { inString = true; stringChar = ch; continue; }
    if (ch === '/' && content[i + 1] === '/') {
      while (i < content.length && content[i] !== '\n') i++;
      lineNum++;
      continue;
    }
    if (ch === '/' && content[i + 1] === '*') {
      i += 2;
      while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
        if (content[i] === '\n') lineNum++;
        i++;
      }
      i++;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth < 0) issues.push({ line: lineNum, type: 'extra-close', depth });
    }
  }

  return { finalDepth: depth, issues };
}

export function findDescribeBlocks(content: string): DescribeBlock[] {
  const blocks: DescribeBlock[] = [];
  const pattern = /(\n[ \t]*)describe\s*\(\s*['"`]([^'"`]*)['"`]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const startIdx = match.index;
    const indent = match[1];
    const name = match[2];

    const parenStart = content.indexOf('(', startIdx + indent.length + 8);
    if (parenStart === -1) continue;

    let depth = 1;
    let i = parenStart + 1;
    let inString = false;
    let stringChar = '';

    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (inString) {
        if (ch === '\\') { i += 2; continue; }
        if (ch === stringChar) inString = false;
      } else {
        if (ch === "'" || ch === '"' || ch === '`') { inString = true; stringChar = ch; }
        else if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      i++;
    }

    if (depth === 0) {
      let endIdx = i;
      while (endIdx < content.length && (content[endIdx] === ';' || content[endIdx] === ' ' || content[endIdx] === '\t')) endIdx++;
      if (content[endIdx] === '\n') endIdx++;

      const body = content.slice(startIdx, endIdx);
      const itCount = (body.match(/\bit\s*\(/g) || []).length;
      const nestedDescribeCount = (body.match(/\bdescribe\s*\(/g) || []).length - 1;

      blocks.push({ name, start: startIdx, end: endIdx, body, itCount, nestedDescribeCount });
    }
  }

  return blocks;
}
