import * as fs from 'fs';
import { SRC_DIR, findSpecFiles, countItBlocks, findDescribeBlocks } from './spec-utils';

let totalFilesFixed = 0;

for (const file of findSpecFiles(SRC_DIR)) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  let iterations = 0;

  while (iterations < 10) {
    iterations++;
    const blocks = findDescribeBlocks(content);
    const emptyBlocks = blocks.filter(b => b.itCount === 0 && b.nestedDescribeCount === 0);

    if (emptyBlocks.length === 0) break;

    for (const block of emptyBlocks.sort((a, b) => b.start - a.start)) {
      content = content.slice(0, block.start) + content.slice(block.end);
      changed = true;
    }
  }

  if (changed && countItBlocks(content) > 0) {
    fs.writeFileSync(file, content, 'utf8');
    totalFilesFixed++;
  }
}

console.log(`Fixed ${totalFilesFixed} files with empty describe blocks`);
