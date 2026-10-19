export function toCamelCase(str: string): string {
  if (!str) {
    return str;
  }
  return str
    .toLowerCase()
    .replace(/_(.)/g, (_, char) => char.toUpperCase());
}

export function toSnakeCase(str: string): string {
  if (!str) {
    return str;
  }
  return str
    .replace(/([A-Z])/g, '_$1')
    .toUpperCase()
    .replace(/^_/, '');
}

export function keysToCamelCase<T = any>(obj: any, normalizeFirst: boolean = false): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToCamelCase(item, normalizeFirst)) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const processedKey = normalizeFirst ? key.toUpperCase() : key;
      const camelKey = toCamelCase(processedKey);
      acc[camelKey] = keysToCamelCase(obj[key], normalizeFirst);
      return acc;
    }, {} as any);
  }

  return obj;
}

export function keysToSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToSnakeCase(item)) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = toSnakeCase(key);
      acc[snakeKey] = keysToSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}