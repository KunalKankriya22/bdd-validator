import { TestBed } from '@angular/core/testing';

import { ErrorCodeStateService } from './error-code-state.service';
import {
  ErrorCode,
  ErrorCodeFilter,
  TabType,
  ErrorType,
  AuditFlag
} from '../models/error-code.model';

describe('ErrorCodeStateService', () => {
  let service: ErrorCodeStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorCodeStateService]
    });

    service = TestBed.inject(ErrorCodeStateService);
  });

  // ── setCurrentTab ────────────────────────────────────────────────────────────

  describe('setCurrentTab', () => {
    it('should update currentTab signal and clear filters', () => {
      // Arrange
      service.setFilters({ codeFrom: 'A', codeTo: 'Z', errorType: ErrorType.SHOW_MESSAGE_ONLY, auditFlag: AuditFlag.YES, showEmpty: true });
      service.setSearchKeyword('test');

      // Act
      service.setCurrentTab(TabType.LAB);

      // Assert
      expect(service.currentTab$()).toBe(TabType.LAB);
      expect(service.currentFilters$().codeFrom).toBe('');
      expect(service.currentFilters$().errorType).toBeNull();
      expect(service.searchKeyword$()).toBe('');
      expect(service.pagination$().skip).toBe(0);
      expect(service.sort$()).toBeNull();
    });
  });

  // ── setErrorCodes ────────────────────────────────────────────────────────────

  describe('setErrorCodes', () => {
    it('should update errorCodes signal', () => {
      // Arrange
      const codes: ErrorCode[] = [{ errorCode: 'E1', errorType: ErrorType.SHOW_MESSAGE_ONLY, error: 'msg', auditFlag: AuditFlag.NO }];

      // Act
      service.setErrorCodes(codes);

      // Assert
      expect(service.errorCodes$()).toEqual(codes);
    });
  });

  // ── setLoading ───────────────────────────────────────────────────────────────

  describe('setLoading', () => {
    it('should update loading signal', () => {
      // Act
      service.setLoading(true);

      // Assert
      expect(service.loading$()).toBeTrue();
    });
  });

  // ── setTotalRecords ──────────────────────────────────────────────────────────

  describe('setTotalRecords', () => {
    it('should update totalRecords signal', () => {
      // Act
      service.setTotalRecords(42);

      // Assert
      expect(service.totalRecords$()).toBe(42);
    });
  });

  // ── setFilters ───────────────────────────────────────────────────────────────

  describe('setFilters', () => {
    it('should update filters and reset pagination skip to zero', () => {
      // Arrange
      service.setPagination({ take: 50, skip: 100 });
      const filters: ErrorCodeFilter = { codeFrom: 'A', codeTo: 'Z', errorType: ErrorType.SHOW_ERROR_ONLY, auditFlag: AuditFlag.YES, showEmpty: false };

      // Act
      service.setFilters(filters);

      // Assert
      expect(service.currentFilters$()).toEqual(filters);
      expect(service.pagination$().skip).toBe(0);
      expect(service.pagination$().take).toBe(50);
    });
  });

  // ── setSearchKeyword ─────────────────────────────────────────────────────────

  describe('setSearchKeyword', () => {
    it('should update keyword and reset pagination skip to zero', () => {
      // Arrange
      service.setPagination({ take: 25, skip: 50 });

      // Act
      service.setSearchKeyword('blood');

      // Assert
      expect(service.searchKeyword$()).toBe('blood');
      expect(service.pagination$().skip).toBe(0);
      expect(service.pagination$().take).toBe(25);
    });
  });

  // ── setPagination ────────────────────────────────────────────────────────────

  describe('setPagination', () => {
    it('should update pagination signal', () => {
      // Act
      service.setPagination({ take: 50, skip: 100 });

      // Assert
      expect(service.pagination$()).toEqual({ take: 50, skip: 100 });
    });
  });

  // ── setSort ──────────────────────────────────────────────────────────────────

  describe('setSort', () => {
    it('should update sort signal', () => {
      // Act
      service.setSort('errorCode asc');

      // Assert
      expect(service.sort$()).toBe('errorCode asc');
    });
  });

  // ── resetPagination ──────────────────────────────────────────────────────────

  describe('resetPagination', () => {
    it('should set skip to zero while preserving take', () => {
      // Arrange
      service.setPagination({ take: 50, skip: 75 });

      // Act
      service.resetPagination();

      // Assert
      expect(service.pagination$()).toEqual({ take: 50, skip: 0 });
    });
  });

  // ── clearFilters ─────────────────────────────────────────────────────────────

  describe('clearFilters', () => {
    it('should reset filters, keyword, and pagination', () => {
      // Arrange
      service.setFilters({ codeFrom: 'A', codeTo: 'Z', errorType: ErrorType.SHOW_ERROR_ONLY, auditFlag: AuditFlag.YES, showEmpty: true });
      service.setSearchKeyword('test');
      service.setPagination({ take: 50, skip: 100 });

      // Act
      service.clearFilters();

      // Assert
      expect(service.currentFilters$().codeFrom).toBe('');
      expect(service.currentFilters$().errorType).toBeNull();
      expect(service.currentFilters$().showEmpty).toBeFalse();
      expect(service.searchKeyword$()).toBe('');
      expect(service.pagination$().skip).toBe(0);
    });
  });

  // ── buildListRequest ─────────────────────────────────────────────────────────

  describe('buildListRequest', () => {
    it('should return empty request when all state is default', () => {
      // Act
      const request = service.buildListRequest();

      // Assert
      expect(request).toEqual({});
    });

    it('should include all populated fields in request', () => {
      // Arrange
      service.setSearchKeyword('test');
      service.setFilters({ codeFrom: 'A', codeTo: 'Z', errorType: ErrorType.SHOW_ERROR_ONLY, auditFlag: AuditFlag.YES, showEmpty: true });
      service.setSort('errorCode desc');

      // Act
      const request = service.buildListRequest();

      // Assert
      expect(request.searchKeyword).toBe('test');
      expect(request.codeFrom).toBe('A');
      expect(request.codeTo).toBe('Z');
      expect(request.errorType).toBe(ErrorType.SHOW_ERROR_ONLY);
      expect(request.auditFlag).toBe(AuditFlag.YES);
      expect(request.showEmpty).toBeTrue();
      expect(request.sort).toBe('errorCode desc');
    });

    it('should exclude showEmpty when it is false', () => {
      // Arrange
      service.setFilters({ codeFrom: '', codeTo: '', errorType: null, auditFlag: null, showEmpty: false });

      // Act
      const request = service.buildListRequest();

      // Assert
      expect(request.showEmpty).toBeUndefined();
    });
  });

  // ── updateErrorCodeInList ────────────────────────────────────────────────────

  describe('updateErrorCodeInList', () => {
    it('should replace matching error code in list', () => {
      // Arrange
      const codes: ErrorCode[] = [
        { errorCode: 'E1', errorType: ErrorType.SHOW_MESSAGE_ONLY, error: 'old', auditFlag: AuditFlag.NO },
        { errorCode: 'E2', errorType: ErrorType.SHOW_ERROR_ONLY, error: 'msg', auditFlag: AuditFlag.YES }
      ];
      service.setErrorCodes(codes);
      const updated: ErrorCode = { errorCode: 'E1', errorType: ErrorType.SHOW_WARNING_ONLY, error: 'new', auditFlag: AuditFlag.YES };

      // Act
      service.updateErrorCodeInList(updated);

      // Assert
      expect(service.errorCodes$()[0].error).toBe('new');
      expect(service.errorCodes$()[0].errorType).toBe(ErrorType.SHOW_WARNING_ONLY);
      expect(service.errorCodes$()[1].errorCode).toBe('E2');
    });

    it('should not modify list when errorCode is not found', () => {
      // Arrange
      const codes: ErrorCode[] = [
        { errorCode: 'E1', errorType: ErrorType.SHOW_MESSAGE_ONLY, error: 'msg', auditFlag: AuditFlag.NO }
      ];
      service.setErrorCodes(codes);

      // Act
      service.updateErrorCodeInList({ errorCode: 'E999', errorType: ErrorType.SHOW_ERROR_ONLY, error: 'x', auditFlag: AuditFlag.NO });

      // Assert
      expect(service.errorCodes$().length).toBe(1);
      expect(service.errorCodes$()[0].errorCode).toBe('E1');
    });
  });

  // ── addErrorCodeToList ───────────────────────────────────────────────────────

  describe('addErrorCodeToList', () => {
    it('should prepend new code and increment totalRecords', () => {
      // Arrange
      service.setErrorCodes([{ errorCode: 'E1', errorType: ErrorType.SHOW_MESSAGE_ONLY, error: 'msg', auditFlag: AuditFlag.NO }]);
      service.setTotalRecords(1);
      const newCode: ErrorCode = { errorCode: 'E0', errorType: ErrorType.SHOW_ERROR_ONLY, error: 'new', auditFlag: AuditFlag.YES };

      // Act
      service.addErrorCodeToList(newCode);

      // Assert
      expect(service.errorCodes$().length).toBe(2);
      expect(service.errorCodes$()[0].errorCode).toBe('E0');
      expect(service.totalRecords$()).toBe(2);
    });
  });

  // ── resetAllStates ───────────────────────────────────────────────────────────

  describe('resetAllStates', () => {
    it('should clear all state to defaults', () => {
      // Arrange
      service.setCurrentTab(TabType.LAB);
      service.setErrorCodes([{ errorCode: 'E1', errorType: ErrorType.SHOW_MESSAGE_ONLY, error: 'msg', auditFlag: AuditFlag.NO }]);
      service.setTotalRecords(5);
      service.setLoading(true);
      service.setSort('errorCode asc');

      // Act
      service.resetAllStates();

      // Assert
      expect(service.errorCodes$()).toEqual([]);
      expect(service.totalRecords$()).toBe(0);
      expect(service.currentFilters$().codeFrom).toBe('');
      expect(service.searchKeyword$()).toBe('');
      expect(service.pagination$()).toEqual({ take: 25, skip: 0 });
      expect(service.sort$()).toBeNull();
    });
  });
});
