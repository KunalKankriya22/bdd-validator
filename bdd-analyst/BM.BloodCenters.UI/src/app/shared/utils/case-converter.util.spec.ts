import { toCamelCase, toSnakeCase, keysToCamelCase, keysToSnakeCase } from './case-converter.util';

describe('CaseConverter', () => {
  describe('toCamelCase', () => {
    it('should convert SNAKE_CASE to camelCase', () => {
      expect(toCamelCase('FIRST_NAME')).toBe('firstName');
    });

    it('should convert lower snake_case to camelCase', () => {
      expect(toCamelCase('first_name')).toBe('firstName');
    });

    it('should handle single word', () => {
      expect(toCamelCase('NAME')).toBe('name');
    });

    it('should handle multiple underscores', () => {
      expect(toCamelCase('FIRST_MIDDLE_LAST_NAME')).toBe('firstMiddleLastName');
    });

    it('should return empty string for empty input', () => {
      expect(toCamelCase('')).toBe('');
    });

    it('should return null for null input', () => {
      expect(toCamelCase(null as any)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(toCamelCase(undefined as any)).toBeUndefined();
    });
  });

  describe('toSnakeCase', () => {
    it('should convert camelCase to SNAKE_CASE', () => {
      expect(toSnakeCase('firstName')).toBe('FIRST_NAME');
    });

    it('should handle single lowercase word', () => {
      expect(toSnakeCase('name')).toBe('NAME');
    });

    it('should handle multiple camelCase words', () => {
      expect(toSnakeCase('firstMiddleLastName')).toBe('FIRST_MIDDLE_LAST_NAME');
    });

    it('should return empty string for empty input', () => {
      expect(toSnakeCase('')).toBe('');
    });

    it('should return null for null input', () => {
      expect(toSnakeCase(null as any)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(toSnakeCase(undefined as any)).toBeUndefined();
    });
  });

  describe('keysToCamelCase', () => {
    it('should convert flat object keys with normalizeFirst true', () => {
      const input = { FIRST_NAME: 'John', LAST_NAME: 'Doe' };
      const result = keysToCamelCase(input, true);
      expect(result).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    it('should convert flat object keys with normalizeFirst false (default)', () => {
      const input = { first_name: 'John' };
      const result = keysToCamelCase(input);
      expect(result).toEqual({ firstName: 'John' });
    });

    it('should convert nested object keys', () => {
      const input = { USER_INFO: { FIRST_NAME: 'John' } };
      const result = keysToCamelCase(input, true);
      expect(result).toEqual({ userInfo: { firstName: 'John' } });
    });

    it('should handle arrays of objects', () => {
      const input = [{ FIRST_NAME: 'John' }, { FIRST_NAME: 'Jane' }];
      const result = keysToCamelCase(input, true);
      expect(result).toEqual([{ firstName: 'John' }, { firstName: 'Jane' }]);
    });

    it('should handle arrays inside objects', () => {
      const input = { USERS: [{ FIRST_NAME: 'John' }] };
      const result = keysToCamelCase(input, true);
      expect(result).toEqual({ users: [{ firstName: 'John' }] });
    });

    it('should return null for null input', () => {
      expect(keysToCamelCase(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(keysToCamelCase(undefined)).toBeUndefined();
    });

    it('should return primitives as-is', () => {
      expect(keysToCamelCase('hello')).toBe('hello');
      expect(keysToCamelCase(42)).toBe(42);
      expect(keysToCamelCase(true)).toBe(true);
    });

    it('should not convert keys of non-plain objects', () => {
      const date = new Date('2024-01-01');
      const result = keysToCamelCase(date);
      expect(result).toBe(date);
    });

    it('should use key as-is when normalizeFirst is false', () => {
      const input = { firstName: 'John' };
      const result = keysToCamelCase(input, false);
      expect(result).toEqual({ firstname: 'John' });
    });

    it('should handle empty object', () => {
      expect(keysToCamelCase({})).toEqual({});
    });

    it('should handle empty array', () => {
      expect(keysToCamelCase([])).toEqual([]);
    });
  });

  describe('keysToSnakeCase', () => {
    it('should convert flat object keys', () => {
      const input = { firstName: 'John', lastName: 'Doe' };
      const result = keysToSnakeCase(input);
      expect(result).toEqual({ FIRST_NAME: 'John', LAST_NAME: 'Doe' });
    });

    it('should convert nested object keys', () => {
      const input = { userInfo: { firstName: 'John' } };
      const result = keysToSnakeCase(input);
      expect(result).toEqual({ USER_INFO: { FIRST_NAME: 'John' } });
    });

    it('should handle arrays of objects', () => {
      const input = [{ firstName: 'John' }];
      const result = keysToSnakeCase(input);
      expect(result).toEqual([{ FIRST_NAME: 'John' }]);
    });

    it('should handle arrays inside objects', () => {
      const input = { users: [{ firstName: 'John' }] };
      const result = keysToSnakeCase(input);
      expect(result).toEqual({ USERS: [{ FIRST_NAME: 'John' }] });
    });

    it('should return null for null input', () => {
      expect(keysToSnakeCase(null)).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      expect(keysToSnakeCase(undefined)).toBeUndefined();
    });

    it('should return primitives as-is', () => {
      expect(keysToSnakeCase('hello')).toBe('hello');
      expect(keysToSnakeCase(42)).toBe(42);
      expect(keysToSnakeCase(true)).toBe(true);
    });

    it('should not convert keys of non-plain objects', () => {
      const date = new Date('2024-01-01');
      const result = keysToSnakeCase(date);
      expect(result).toBe(date);
    });

    it('should handle empty object', () => {
      expect(keysToSnakeCase({})).toEqual({});
    });

    it('should handle empty array', () => {
      expect(keysToSnakeCase([])).toEqual([]);
    });
  });
});
