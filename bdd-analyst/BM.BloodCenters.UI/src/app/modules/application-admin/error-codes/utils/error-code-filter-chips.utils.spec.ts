import { ErrorCodeFilterChipsUtils } from './error-code-filter-chips.utils';
import { ErrorCodeFilter, ErrorType, AuditFlag } from '../models/error-code.model';

describe('ErrorCodeFilterChipsUtils', () => {
  // -------------------------------------------------------
  // convertFiltersToChips
  // -------------------------------------------------------
  describe('convertFiltersToChips', () => {

    it('should return empty array when filters is empty', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: null,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.convertFiltersToChips(filters);
      expect(result).toEqual([]);
    });

    it('should create chip for codeFrom only', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '',
        errorType: null,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'codeRange',
        label: 'Code From: 0001',
        value: { from: '0001', to: '' },
        removable: true
      });
    });

    it('should create chip for codeTo only', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '9999',
        errorType: null,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'codeRange',
        label: 'Code To: 9999',
        value: { from: '', to: '9999' },
        removable: true
      });
    });

    it('should create chip for code range (both codeFrom and codeTo)', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '9999',
        errorType: null,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'codeRange',
        label: 'Code: 0001 - 9999',
        value: { from: '0001', to: '9999' },
        removable: true
      });
    });

    it('should create chip for errorType with proper display name', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'errorType',
        label: 'Type: Show Message Only',
        value: ErrorType.SHOW_MESSAGE_ONLY,
        removable: true
      });
    });

    it('should create chip for auditFlag Y', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: null,
        auditFlag: AuditFlag.YES,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'auditFlag',
        label: 'Audit: Yes',
        value: AuditFlag.YES,
        removable: true
      });
    });

    it('should create chip for auditFlag N', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: null,
        auditFlag: AuditFlag.NO,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'auditFlag',
        label: 'Audit: No',
        value: AuditFlag.NO,
        removable: true
      });
    });

    it('should create chip for showEmpty', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: null,
        auditFlag: null,
        showEmpty: true
      };
      const result = ErrorCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        key: 'showEmpty',
        label: 'Show Empty Records',
        value: true,
        removable: true
      });
    });

    it('should create multiple chips when multiple filters are active', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '9999',
        errorType: ErrorType.SHOW_WARNING_ONLY,
        auditFlag: AuditFlag.YES,
        showEmpty: true
      };
      const result = ErrorCodeFilterChipsUtils.convertFiltersToChips(filters);

      expect(result.length).toBe(4);
      expect(result[0].key).toBe('codeRange');
      expect(result[1].key).toBe('errorType');
      expect(result[2].key).toBe('auditFlag');
      expect(result[3].key).toBe('showEmpty');
    });
  });

  // -------------------------------------------------------
  // removeFilterByChipKey
  // -------------------------------------------------------
  describe('removeFilterByChipKey', () => {

    it('should remove codeRange filter (clears both codeFrom and codeTo)', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '9999',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.removeFilterByChipKey(filters, 'codeRange');

      expect(result).not.toBeNull();
      expect(result!.codeFrom).toBe('');
      expect(result!.codeTo).toBe('');
      expect(result!.errorType).toBe(ErrorType.SHOW_MESSAGE_ONLY);
    });

    it('should remove errorType filter', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.removeFilterByChipKey(filters, 'errorType');

      expect(result).not.toBeNull();
      expect(result!.errorType).toBeNull();
      expect(result!.codeFrom).toBe('0001');
    });

    it('should remove auditFlag filter', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        auditFlag: AuditFlag.YES,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.removeFilterByChipKey(filters, 'auditFlag');

      expect(result).not.toBeNull();
      expect(result!.auditFlag).toBeNull();
      expect(result!.errorType).toBe(ErrorType.SHOW_MESSAGE_ONLY);
    });

    it('should remove showEmpty filter', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '',
        errorType: null,
        auditFlag: null,
        showEmpty: true
      };
      const result = ErrorCodeFilterChipsUtils.removeFilterByChipKey(filters, 'showEmpty');

      expect(result).not.toBeNull();
      expect(result!.showEmpty).toBe(false);
      expect(result!.codeFrom).toBe('0001');
    });


    it('should return updated filters when other filters remain', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '9999',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        auditFlag: AuditFlag.YES,
        showEmpty: true
      };
      const result = ErrorCodeFilterChipsUtils.removeFilterByChipKey(filters, 'codeRange');

      expect(result).not.toBeNull();
      expect(result!.codeFrom).toBe('');
      expect(result!.codeTo).toBe('');
      expect(result!.errorType).toBe(ErrorType.SHOW_MESSAGE_ONLY);
      expect(result!.auditFlag).toBe(AuditFlag.YES);
      expect(result!.showEmpty).toBe(true);
    });

  });

  // -------------------------------------------------------
  // hasActiveFilters
  // -------------------------------------------------------
  describe('hasActiveFilters', () => {

    it('should return false when all filters are empty', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: null,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return true when codeFrom is set', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '',
        errorType: null,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when codeTo is set', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '9999',
        errorType: null,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when errorType is set', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        auditFlag: null,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when auditFlag is set', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: null,
        auditFlag: AuditFlag.YES,
        showEmpty: false
      };
      const result = ErrorCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when showEmpty is set', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: null,
        auditFlag: null,
        showEmpty: true
      };
      const result = ErrorCodeFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

  });
});
