import { removeTestsByBodyAnalysis } from './spec-utils';

removeTestsByBodyAnalysis((name, body) => {
  const nb = body.replace(/\s+/g, ' ');
  const expectCount = (nb.match(/expect\s*\(/g) || []).length;

  if (/(calculat|comput|workflow|permission|guard|intercept|transform|pipe|conver|encrypt|decrypt|hash|authori|authen|rule|logic|algorithm|formula)/i.test(name)) return false;

  if (expectCount === 2) {
    const simple = (nb.match(/\.\s*(toBe|toEqual)\s*\(\s*(['"`][^'"]*['"`]|\d+|true|false|null|undefined|\[\]|\{\})\s*\)/g) || []).length;
    if (simple === 2 && !/calculat|comput|transform|conver/i.test(name)) return true;
  }

  if (/should (show|display).*(snackbar|toast|notification|message|error|success)/i.test(name) &&
      expectCount <= 2 && /(showSuccess|showError|snackbar|toast|showWarning|showInfo)/.test(nb)) return true;

  if (/should (have|contain|include).*(form|control|field|input)/i.test(name) &&
      expectCount <= 3 && /(form\.get|form\.contains|controls\[)/.test(nb)) return true;

  if (/should (navigate|redirect|route)/i.test(name) && expectCount === 1 && /\.toHaveBeenCalled/.test(nb)) return true;

  if (/should (focus|blur|set focus|remove focus)/i.test(name) && expectCount <= 2) return true;

  if (/should (subscribe|unsubscribe|complete.*subject)/i.test(name) && expectCount <= 2) return true;

  if (/should (clear|reset|empty|remove).*(selection|state|form|filter|search|data|value)/i.test(name) &&
      expectCount <= 2 && /(toBe\(|toEqual\(|toBeFalsy|toBeNull)/.test(nb)) return true;

  if (/should (have|add|remove|toggle).*(class|style|css)/i.test(name) && expectCount <= 2) return true;

  if (expectCount === 1 && /toHaveBeenCalledWith\s*\(\s*jasmine\.any\(String\)/.test(nb)) return true;

  if (/should (have|set|update|initialize).*(page|pageSize|pageIndex|paginator|pagination)/i.test(name) &&
      expectCount <= 3 && /(pageSize|pageIndex|paginator|totalRecords|length)/.test(nb)) return true;

  if (/should (open|close).*(dialog|modal)/i.test(name) &&
      expectCount <= 2 && /(dialog|matDialog|dialogRef)/.test(nb)) return true;

  return false;
}, 'Remove final low-value tests', 0.5);
