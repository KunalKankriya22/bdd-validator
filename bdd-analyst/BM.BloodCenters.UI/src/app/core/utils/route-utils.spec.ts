import { getRelativePath, getLastPathSegment, removePathPrefix } from './route-utils';

describe('route-utils', () => {

  // ── getRelativePath ────────────────────────────────────────────

  describe('getRelativePath', () => {
    it('extracts relative path when fullPath starts with prefix', () => {
      const result = getRelativePath(
        '/application-administration/common-validation/view-institution',
        '/application-administration/common-validation/'
      );

      expect(result).toBe('view-institution');
    });

    it('returns remaining multi-segment path after prefix removal', () => {
      const result = getRelativePath('/a/b/c/d', '/a/b/');

      expect(result).toBe('c/d');
    });

    it('returns empty string when fullPath equals prefix exactly', () => {
      const result = getRelativePath('/a/b/', '/a/b/');

      expect(result).toBe('');
    });

    it('returns last segment as fallback when prefix does not match', () => {
      spyOn(console, 'warn');

      const result = getRelativePath('/x/y/z', '/a/b/');

      expect(result).toBe('z');
    });

    it('logs a warning when prefix does not match', () => {
      const warnSpy = spyOn(console, 'warn');

      getRelativePath('/x/y/z', '/a/b/');

      expect(warnSpy).toHaveBeenCalledWith(
        'Path "/x/y/z" does not start with prefix "/a/b/"'
      );
    });

    it('returns empty string for empty fullPath when prefix does not match', () => {
      spyOn(console, 'warn');

      const result = getRelativePath('', '/prefix/');

      expect(result).toBe('');
    });

    it('returns the single segment when path has one segment and prefix does not match', () => {
      spyOn(console, 'warn');

      const result = getRelativePath('/only-segment', '/wrong-prefix/');

      expect(result).toBe('only-segment');
    });

    it('ignores trailing slash in fallback path', () => {
      spyOn(console, 'warn');

      const result = getRelativePath('/a/b/c/', '/wrong/');

      expect(result).toBe('c');
    });

    it('handles prefix that is a partial match but not a true prefix', () => {
      spyOn(console, 'warn');

      const result = getRelativePath('/admin-extra/settings', '/admin/');

      expect(result).toBe('settings');
    });
  });

  // ── getLastPathSegment ─────────────────────────────────────────

  describe('getLastPathSegment', () => {
    it('returns last segment of a multi-segment path', () => {
      expect(getLastPathSegment('/a/b/c')).toBe('c');
    });

    it('returns the segment from a single-segment path with leading slash', () => {
      expect(getLastPathSegment('/only')).toBe('only');
    });

    it('returns the segment from a path without leading slash', () => {
      expect(getLastPathSegment('no-leading-slash')).toBe('no-leading-slash');
    });

    it('returns empty string for empty path', () => {
      expect(getLastPathSegment('')).toBe('');
    });

    it('returns empty string for root path (single slash)', () => {
      expect(getLastPathSegment('/')).toBe('');
    });

    it('ignores trailing slash and returns second-to-last segment', () => {
      expect(getLastPathSegment('/a/b/')).toBe('b');
    });

    it('handles multiple consecutive slashes by filtering empty segments', () => {
      expect(getLastPathSegment('/a//b///c')).toBe('c');
    });

    it('returns the deep segment from a long path', () => {
      expect(getLastPathSegment('/one/two/three/four/five')).toBe('five');
    });
  });

  // ── removePathPrefix ───────────────────────────────────────────

  describe('removePathPrefix', () => {
    describe('successful prefix removal', () => {
      it('removes prefix and returns remaining path when prefix has no trailing slash', () => {
        const result = removePathPrefix('/admin/settings/users', '/admin/settings');

        expect(result).toBe('users');
      });

      it('removes prefix that already ends with slash', () => {
        const result = removePathPrefix('/admin/settings/users', '/admin/settings/');

        expect(result).toBe('users');
      });

      it('returns multi-segment remainder after prefix removal', () => {
        const result = removePathPrefix('/admin/settings/users/edit', '/admin/settings');

        expect(result).toBe('users/edit');
      });
    });

    describe('path normalization (leading slash)', () => {
      it('normalizes path that lacks a leading slash', () => {
        const result = removePathPrefix('admin/settings/users', '/admin/settings');

        expect(result).toBe('users');
      });

      it('normalizes prefix that lacks a leading slash', () => {
        const result = removePathPrefix('/admin/settings/users', 'admin/settings');

        expect(result).toBe('users');
      });

      it('normalizes both path and prefix that lack leading slashes', () => {
        const result = removePathPrefix('admin/settings/users', 'admin/settings');

        expect(result).toBe('users');
      });

      it('normalizes prefix without leading slash that already ends with slash', () => {
        const result = removePathPrefix('admin/settings/users', 'admin/settings/');

        expect(result).toBe('users');
      });
    });

    describe('exact match (no trailing segments)', () => {
      it('returns empty string when path exactly matches prefix', () => {
        const result = removePathPrefix('/admin/settings', '/admin/settings');

        expect(result).toBe('');
      });

      it('returns empty string for exact match without leading slashes', () => {
        const result = removePathPrefix('admin/settings', 'admin/settings');

        expect(result).toBe('');
      });
    });

    describe('prefix does not match (fallback)', () => {
      it('falls back to last path segment when prefix does not match', () => {
        spyOn(console, 'warn');

        const result = removePathPrefix('/a/b/c', '/x/y');

        expect(result).toBe('c');
      });

      it('logs a warning when prefix does not match', () => {
        const warnSpy = spyOn(console, 'warn');

        removePathPrefix('/a/b/c', '/x/y');

        expect(warnSpy).toHaveBeenCalledWith(
          'Path "/a/b/c" does not start with prefix "/x/y"'
        );
      });

      it('uses original (non-normalized) path in warning message', () => {
        const warnSpy = spyOn(console, 'warn');

        removePathPrefix('a/b/c', 'x/y');

        expect(warnSpy).toHaveBeenCalledWith(
          'Path "a/b/c" does not start with prefix "x/y"'
        );
      });

      it('returns last segment via getLastPathSegment for non-matching prefix', () => {
        spyOn(console, 'warn');

        const result = removePathPrefix('/one/two/three', '/wrong/prefix');

        expect(result).toBe('three');
      });
    });
  });
});
