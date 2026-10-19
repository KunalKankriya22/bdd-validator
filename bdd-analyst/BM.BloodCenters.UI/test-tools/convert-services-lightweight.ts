import * as fs from 'fs';
import * as path from 'path';
import { SRC_DIR, findSpecFiles } from './spec-utils';

function findConvertibleServiceSpecs(): string[] {
  const results: string[] = [];
  const allFiles = findSpecFiles(SRC_DIR);

  for (const specPath of allFiles) {
    if (!specPath.endsWith('.service.spec.ts')) continue;

    const srcPath = specPath.replace('.spec.ts', '.ts');
    if (!fs.existsSync(srcPath)) continue;

    const srcContent = fs.readFileSync(srcPath, 'utf8');
    if (/=\s*inject\s*\(/.test(srcContent)) continue;
    if (!(/constructor\s*\(/.test(srcContent))) continue;

    const specContent = fs.readFileSync(specPath, 'utf8');
    if (!(/TestBed\.configureTestingModule/.test(specContent))) continue;
    if (/HttpTestingController/.test(specContent)) continue;

    results.push(specPath);
  }

  return results;
}

function extractConstructorParams(srcPath: string): string[] {
  const content = fs.readFileSync(srcPath, 'utf8');
  const match = content.match(/constructor\s*\(([^)]*)\)/);
  if (!match) return [];

  return match[1]
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      const parts = p.replace(/^(private|protected|public|readonly)\s+/g, '').trim();
      const nameMatch = parts.match(/^(\w+)/);
      return nameMatch ? nameMatch[1] : '';
    })
    .filter(n => n.length > 0);
}

function convertSpec(specPath: string): boolean {
  const srcPath = specPath.replace('.spec.ts', '.ts');
  const params = extractConstructorParams(srcPath);
  const content = fs.readFileSync(specPath, 'utf8');

  const testBedBlock = content.match(
    /TestBed\.configureTestingModule\s*\(\s*\{[\s\S]*?\}\s*\)\s*;?\s*\n/
  );
  if (!testBedBlock) return false;

  const injectLine = content.match(
    /service\s*=\s*TestBed\.inject\s*\(\s*(\w+)\s*\)\s*;/
  );
  if (!injectLine) return false;

  const serviceClass = injectLine[1];

  const providerMatches = [...content.matchAll(
    /provide:\s*(\w+)\s*,\s*useValue:\s*(\w+)/g
  )];
  const mockVarMap = new Map<string, string>();
  for (const m of providerMatches) {
    mockVarMap.set(m[1], m[2]);
  }

  const constructorArgs = params.map(paramName => {
    for (const [, mockVar] of mockVarMap) {
      if (mockVar.toLowerCase().includes(paramName.toLowerCase())) {
        return `${mockVar} as any`;
      }
    }
    for (const [provClass, mockVar] of mockVarMap) {
      return `${mockVar} as any`;
    }
    return 'undefined as any';
  });

  const newInstantiation = `service = new ${serviceClass}(${constructorArgs.join(', ')});`;

  let modified = content;
  modified = modified.replace(testBedBlock[0], '');
  modified = modified.replace(injectLine[0], newInstantiation);

  if (/^\s*import\s*\{[^}]*TestBed[^}]*\}\s*from\s*['"]@angular\/core\/testing['"]/.test(modified)) {
    modified = modified.replace(
      /import\s*\{\s*TestBed\s*\}\s*from\s*['"]@angular\/core\/testing['"];\s*\n/,
      ''
    );
    modified = modified.replace(/,?\s*TestBed\s*,?/g, (match) => {
      if (match.startsWith(',') && match.endsWith(',')) return ',';
      return '';
    });
  }

  if (/^\s*import\s*\{[^}]*HttpClientTestingModule[^}]*\}/.test(modified)) {
    modified = modified.replace(
      /import\s*\{\s*HttpClientTestingModule\s*\}\s*from\s*['"]@angular\/common\/http\/testing['"];\s*\n/,
      ''
    );
  }

  if (modified !== content) {
    fs.writeFileSync(specPath, modified, 'utf8');
    return true;
  }

  return false;
}

const convertible = findConvertibleServiceSpecs();
console.log(`Found ${convertible.length} convertible service specs`);

let converted = 0;
for (const spec of convertible) {
  if (convertSpec(spec)) {
    converted++;
    console.log(`  Converted: ${path.relative(SRC_DIR, spec)}`);
  }
}

console.log(`\nConverted ${converted} of ${convertible.length} service specs to lightweight tests`);
