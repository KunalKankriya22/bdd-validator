import { removeTestsByBodyAnalysis } from './spec-utils';

removeTestsByBodyAnalysis((name, body) => {
  const nb = body.replace(/\s+/g, ' ');
  const expectCount = (nb.match(/expect\s*\(/g) || []).length;

  if (/(calculat|comput|workflow|permission|guard|intercept|transform|pipe|conver|encrypt|decrypt|hash|authori|authen)/i.test(name)) return false;

  if (expectCount === 2) {
    const trivial = (nb.match(/\.\s*(toBeTruthy|toBeFalsy|toBeDefined|toBeNull|toBeUndefined|toBe\(true\)|toBe\(false\)|toBe\(null\)|toBe\(0\)|toBe\(''\)|toEqual\(\[\]\)|toEqual\(\{\}\))\s*[;)]/g) || []).length;
    if (trivial === 2) return true;
  }

  if (expectCount === 1 && /\.\s*length\s*\)\s*\.\s*toBe\s*\(/i.test(nb) &&
      /(column|header|row|option|item|list|array)/i.test(name) &&
      !/(filter|search|query|compute|business)/i.test(name)) return true;

  if (/should (have|contain|include|show).*\d+.*(column|row|option|item|button)/i.test(name) &&
      expectCount <= 2) return true;

  if (/should (render|display|show|have).*\b(title|header|label|button|input|icon|text)\b/i.test(name) &&
      expectCount === 1 && /(nativeElement|querySelector|textContent|innerText|innerHTML)/.test(nb) &&
      /(toBeTruthy|toBeDefined|toContain)/.test(nb)) return true;

  if (/should call\b/i.test(name) && expectCount === 1 &&
      /\.toHaveBeenCalled/.test(nb) && !/toHaveBeenCalledWith/.test(nb)) return true;

  if (/should (open|close|toggle|show|hide).*(panel|dialog|drawer|modal|overlay|sidebar|menu)/i.test(name) &&
      expectCount <= 2 && /(toBe\(true|toBe\(false|toBeTruthy|toBeFalsy)/.test(nb)) return true;

  if (/should emit\b/i.test(name) && expectCount === 1 && /\.\s*toHaveBeenCalled/.test(nb)) return true;

  if (/should (set|be in|have|switch to).*(mode|state|flag|status)/i.test(name) &&
      expectCount === 1 && /(toBe\(|toEqual\()/.test(nb) && !/calculat|comput|logic/i.test(name)) return true;

  if (/should (disable|enable|be disabled|be enabled)\b/i.test(name) &&
      expectCount <= 2 && /(toBe\(true|toBe\(false|disabled|enabled)/.test(nb)) return true;

  if (/should (display|show|render|have).*correct (number|count) of/i.test(name) &&
      expectCount <= 2) return true;

  return false;
}, 'Remove low-value UI tests', 0.6);
