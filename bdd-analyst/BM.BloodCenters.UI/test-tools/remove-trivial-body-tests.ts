import { removeTestsByBodyAnalysis } from './spec-utils';

removeTestsByBodyAnalysis((name, body) => {
  const nb = body.replace(/\s+/g, ' ');
  const expectCount = (nb.match(/expect\s*\(/g) || []).length;

  if (/expect\s*\(\s*(component|service|fixture|pipe|guard|directive|interceptor|dialog)\s*\)\s*\.\s*(toBeTruthy|toBeDefined)\s*\(\s*\)/.test(nb) &&
      expectCount === 1) return true;

  if (/should (configure|have correct|have the correct).*(columns?|headers?|config|configuration)/i.test(name) &&
      !/(should not|business|logic|calculate|compute)/i.test(name) &&
      expectCount <= 6 && /columns|headers|displayedColumns/.test(nb)) return true;

  if ((/should (not have|not show|have (no|empty|null)).*initially/i.test(name) ||
       /should (be|have|show).*initial/i.test(name)) &&
      expectCount === 1 &&
      /(toBeFalsy|toBe\(false\)|toBe\(null\)|toBe\(''\)|toBe\(\[\]\)|toEqual\(\[\]\))/.test(nb)) return true;

  if (expectCount === 1 &&
      /\.toHaveBeenCalled\(\)/.test(nb) &&
      !/\.toHaveBeenCalledWith/.test(nb) &&
      !/\.toHaveBeenCalledTimes/.test(nb)) return true;

  if (/should (set|show|display|hide|not show).*(loading|spinner|isLoading)/i.test(name) &&
      !/(error|business|calculate)/i.test(name) &&
      expectCount <= 2 && /(isLoading|loading|showLoading)/.test(nb)) return true;

  return false;
}, 'Remove trivial-body tests');
