import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  describe('basic truncation', () => {
    it('should truncate text exceeding the default limit of 50', () => {
      const longText = 'A'.repeat(60);
      const result = pipe.transform(longText);
      expect(result).toBe('A'.repeat(50) + '...');
    });

    it('should not truncate text at or under the limit', () => {
      const shortText = 'Hello World';
      expect(pipe.transform(shortText)).toBe('Hello World');
    });

    it('should not truncate text exactly at the limit', () => {
      const text = 'A'.repeat(50);
      expect(pipe.transform(text)).toBe(text);
    });
  });

  describe('custom limit', () => {
    it('should truncate to custom limit', () => {
      expect(pipe.transform('Hello World', 5)).toBe('Hello...');
    });

    it('should handle limit of 0', () => {
      expect(pipe.transform('Hello', 0)).toBe('...');
    });

    it('should not truncate when limit exceeds text length', () => {
      expect(pipe.transform('Hi', 100)).toBe('Hi');
    });
  });

  describe('custom suffix', () => {
    it('should use custom suffix', () => {
      expect(pipe.transform('Hello World', 5, ' [more]')).toBe('Hello [more]');
    });

    it('should use empty suffix', () => {
      expect(pipe.transform('Hello World', 5, '')).toBe('Hello');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for null', () => {
      expect(pipe.transform(null as any)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined as any)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(pipe.transform('')).toBe('');
    });

    it('should trim trailing whitespace before appending suffix', () => {
      expect(pipe.transform('Hello World Test', 6)).toBe('Hello...');
    });
  });
});
