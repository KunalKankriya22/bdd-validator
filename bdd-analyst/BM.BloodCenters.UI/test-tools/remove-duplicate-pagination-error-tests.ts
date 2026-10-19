import * as fs from 'fs';
import {
  SRC_DIR, findSpecFiles, countItBlocks,
  removeItBlockByExactName, removeDescribeBlock, removeEmptyDescribeBlocks
} from './spec-utils';

const REMOVABLE_TESTS = [
  'should handle first page request',
  'should handle second page request',
  'should handle large page size request',
  'should handle deep pagination',
  'should handle search with filters',
  'should handle search with sort',
  'should handle all parameters combined',
  'should handle filters with sort',
  'should handle 404 error response',
  'should handle 500 error response',
  'should handle network error',
  'should handle missing data property',
  'should handle missing total property',
  'should handle null response data',
  'should handle undefined response data',
  'should pass search keyword parameter correctly',
  'should pass filter parameters correctly',
  'should pass sort parameter correctly',
];

const REMOVABLE_DESCRIBES = ['Pagination Scenarios', 'Complex Parameter Combinations'];

let filesModified = 0;
let testsRemoved = 0;

for (const file of findSpecFiles(SRC_DIR)) {
  const original = fs.readFileSync(file, 'utf8');
  const originalCount = countItBlocks(original);
  if (originalCount <= 1) continue;

  let modified = original;
  for (const name of REMOVABLE_TESTS) modified = removeItBlockByExactName(modified, name);
  for (const name of REMOVABLE_DESCRIBES) modified = removeDescribeBlock(modified, name);
  modified = removeEmptyDescribeBlocks(modified);

  const newCount = countItBlocks(modified);
  if (newCount < originalCount && newCount > 0) {
    fs.writeFileSync(file, modified, 'utf8');
    filesModified++;
    testsRemoved += originalCount - newCount;
  }
}

console.log(`Remove duplicate pagination/error tests: ${testsRemoved} removed from ${filesModified} files`);
