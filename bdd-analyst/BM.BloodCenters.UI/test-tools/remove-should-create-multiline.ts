import { removeTestsByName, removeItBlockByExactName, SRC_DIR, findSpecFiles, countItBlocks } from './spec-utils';
import * as fs from 'fs';

const SHOULD_CREATE_NAMES = [
  'should create',
  'should be created',
  'should create the component',
  'should create component',
  'should create the dialog',
  'should inject ApiService',
];

let filesModified = 0;
let testsRemoved = 0;

for (const file of findSpecFiles(SRC_DIR)) {
  const original = fs.readFileSync(file, 'utf8');
  const originalCount = countItBlocks(original);
  if (originalCount <= 1) continue;

  let modified = original;
  for (const name of SHOULD_CREATE_NAMES) modified = removeItBlockByExactName(modified, name);

  const injectMatch = modified.match(/it\s*\(\s*['"`](should inject[^'"`]*)['"`]/);
  if (injectMatch) modified = removeItBlockByExactName(modified, injectMatch[1]);

  const newCount = countItBlocks(modified);
  if (newCount < originalCount && newCount > 0) {
    fs.writeFileSync(file, modified, 'utf8');
    filesModified++;
    testsRemoved += originalCount - newCount;
  }
}

console.log(`Remove should-create (multiline): ${testsRemoved} removed from ${filesModified} files`);
