import * as fs from 'fs';
import { SRC_DIR, findSpecFiles, checkBraceBalance } from './spec-utils';

let fixedCount = 0;

for (const file of findSpecFiles(SRC_DIR)) {
  const content = fs.readFileSync(file, 'utf8');
  const { finalDepth, issues } = checkBraceBalance(content);

  if (finalDepth === 0 && issues.length === 0) continue;

  console.log(`ISSUE in ${file}: finalDepth=${finalDepth}, issues=${issues.length}`);

  if (finalDepth < 0) {
    const lines = content.split('\n');
    let removals = Math.abs(finalDepth);
    for (let i = lines.length - 1; i >= 0 && removals > 0; i--) {
      if (/^\s*\}\s*\)\s*;?\s*$/.test(lines[i])) {
        lines.splice(i, 1);
        removals--;
      }
    }
    if (removals === 0) {
      fs.writeFileSync(file, lines.join('\n'), 'utf8');
      fixedCount++;
      console.log(`  -> Fixed by removing ${Math.abs(finalDepth)} extra }); lines`);
    }
  }

  if (finalDepth > 0) {
    let fixed = content;
    for (let i = 0; i < finalDepth; i++) fixed += '\n});';
    fixed += '\n';
    fs.writeFileSync(file, fixed, 'utf8');
    fixedCount++;
    console.log(`  -> Fixed by adding ${finalDepth} missing }); at end`);
  }
}

console.log(`\nFixed ${fixedCount} files with brace issues`);
