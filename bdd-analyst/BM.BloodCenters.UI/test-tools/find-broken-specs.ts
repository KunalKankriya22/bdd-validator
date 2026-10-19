import * as fs from 'fs';
import { SRC_DIR, findSpecFiles } from './spec-utils';

function analyzeFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let depth = 0;
  let minDepth = 0;
  let itAtZero = false;
  let hasDescribe = false;

  for (const line of lines) {
    let inString = false;
    let opens = 0;
    let closes = 0;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (inString) {
        if (ch === '\\') { j++; continue; }
        if (ch === "'" || ch === '"') inString = false;
        continue;
      }
      if (ch === "'" || ch === '"') { inString = true; continue; }
      if (ch === '/' && line[j + 1] === '/') break;
      if (ch === '{') opens++;
      if (ch === '}') closes++;
    }

    depth += opens - closes;
    if (depth < minDepth) minDepth = depth;
    if (/\bdescribe\s*\(/.test(line)) hasDescribe = true;
    if (/\bit\s*\(/.test(line) && depth <= 0) itAtZero = true;
  }

  return { finalDepth: depth, minDepth, itAtZero, hasDescribe };
}

const specFiles = findSpecFiles(SRC_DIR);
let brokenCount = 0;

for (const file of specFiles) {
  const result = analyzeFile(file);
  if (result.finalDepth !== 0 || result.minDepth < -1 || result.itAtZero) {
    brokenCount++;
    console.log(`BROKEN: ${file}`);
    console.log(`  finalDepth=${result.finalDepth} minDepth=${result.minDepth} itAtZero=${result.itAtZero}`);
  }
}

console.log(`\nTotal broken files: ${brokenCount}`);
