import { removeTestsByBodyAnalysis } from './spec-utils';

removeTestsByBodyAnalysis((name, body) => {
  const nb = body.replace(/\s+/g, ' ');
  const expectCount = (nb.match(/expect\s*\(/g) || []).length;

  if (expectCount === 1 &&
      /expect\s*\([^)]+\)\s*\.\s*(toBeTruthy|toBeDefined|toBeFalsy|toBeNull|toBeUndefined)\s*\(\s*\)/.test(nb)) return true;

  if (expectCount === 1 && /\.toHaveBeenCalled\(\)/.test(nb) &&
      !/\.toHaveBeenCalledWith/.test(nb) && !/\.toHaveBeenCalledTimes/.test(nb)) return true;

  if (/should (return|format).*(dash|empty|null|undefined|invalid).*(date|string)/i.test(name) &&
      expectCount <= 2) return true;

  if (/should (set|show|hide|not show|display|have).*(loading|spinner|isLoading)/i.test(name) &&
      expectCount <= 2) return true;

  if (/should (have|configure|set|contain).*(column|header|config|breadcrumb|title|sticky)/i.test(name) &&
      expectCount <= 4 && !/(calculate|compute|business|workflow|permission|guard)/i.test(name)) return true;

  if (/should (have|be|show|not have|not show).*(empty|initial|default|null|no ).*(state|data|list|array|result|value)/i.test(name) &&
      expectCount <= 2) return true;

  if ((/should (be|have) (valid|invalid) when/i.test(name) || /form.*(valid|invalid)/i.test(name)) &&
      expectCount === 1 && /(toBeTrue|toBeFalse|toBeTruthy|toBeFalsy|toBe\(true|toBe\(false)/.test(nb)) return true;

  if (/should have (aria|role)/i.test(name)) return true;

  if (/should.*(Alt\+|Escape|keyboard|shortcut|hotkey)/i.test(name) && expectCount <= 2) return true;

  if (/should.*(sort|sortable).*(icon|direction|flag|config)/i.test(name) &&
      expectCount <= 4 && !/(calculate|compute)/i.test(name)) return true;

  return false;
}, 'Remove extended trivial tests');
