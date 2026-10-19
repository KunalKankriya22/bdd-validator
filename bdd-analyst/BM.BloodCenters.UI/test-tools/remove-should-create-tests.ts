import * as fs from 'fs';
import { SRC_DIR, findSpecFiles, countItBlocks } from './spec-utils';

const REMOVABLE_PATTERNS = [
  /\n\s*it\s*\(\s*['"`]should create['"`]\s*,\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)\s*;?/g,
  /\n\s*it\s*\(\s*['"`]should be created['"`]\s*,\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)\s*;?/g,
  /\n\s*it\s*\(\s*['"`]should create the component['"`]\s*,\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)\s*;?/g,
  /\n\s*it\s*\(\s*['"`]should create component['"`]\s*,\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)\s*;?/g,
  /\n\s*it\s*\(\s*['"`]should create the dialog['"`]\s*,\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)\s*;?/g,
  /\n\s*it\s*\(\s*['"`]should inject ApiService['"`]\s*,\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)\s*;?/g,
  /\n\s*it\s*\(\s*['"`]should inject[^'"`]*['"`]\s*,\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)\s*;?/g,
];

const EMPTY_DESCRIBE = /\n\s*describe\s*\(\s*['"`][^'"`]*Initialization[^'"`]*['"`]\s*,\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)\s*;?/g;

let filesModified = 0;
let testsRemoved = 0;

for (const file of findSpecFiles(SRC_DIR)) {
  const original = fs.readFileSync(file, 'utf8');
  const originalCount = countItBlocks(original);
  if (originalCount <= 1) continue;

  let modified = original;
  for (const pattern of REMOVABLE_PATTERNS) modified = modified.replace(pattern, '');
  modified = modified.replace(EMPTY_DESCRIBE, '');

  const newCount = countItBlocks(modified);
  if (newCount < originalCount && newCount > 0) {
    fs.writeFileSync(file, modified, 'utf8');
    filesModified++;
    testsRemoved += originalCount - newCount;
  }
}

console.log(`Remove should-create tests: ${testsRemoved} removed from ${filesModified} files`);
