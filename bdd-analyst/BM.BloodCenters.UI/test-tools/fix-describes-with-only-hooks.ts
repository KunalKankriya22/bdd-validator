import * as fs from 'fs';
import { SRC_DIR, findSpecFiles, countItBlocks } from './spec-utils';

function findAndRemoveEmptyDescribes(content: string): string {
  let result = content;
  let changed = true;

  while (changed) {
    changed = false;
    const lines = result.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].replace(/\r/g, '').trim();

      if (/^describe\s*\(/.test(trimmed)) {
        let depth = 0;
        let endLine = -1;
        let hasIt = false;

        for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j]) {
            if (ch === '(') depth++;
            if (ch === ')') {
              depth--;
              if (depth === 0) { endLine = j; break; }
            }
          }
          if (/\bit\s*\(/.test(lines[j]) && j > i) hasIt = true;
          if (endLine >= 0) break;
        }

        if (endLine >= 0 && !hasIt) {
          let removeEnd = endLine + 1;
          if (removeEnd < lines.length && lines[removeEnd].trim() === '') removeEnd++;
          lines.splice(i, removeEnd - i);
          result = lines.join('\n');
          changed = true;
          break;
        }
      }
    }
  }

  return result;
}

let fixedCount = 0;

for (const file of findSpecFiles(SRC_DIR)) {
  const original = fs.readFileSync(file, 'utf8');
  const fixed = findAndRemoveEmptyDescribes(original);

  if (fixed !== original && countItBlocks(fixed) > 0) {
    fs.writeFileSync(file, fixed, 'utf8');
    fixedCount++;
  }
}

console.log(`Fixed ${fixedCount} files with empty describe+hook blocks`);
