import { TestBed } from '@angular/core/testing';
import { ErrorCodeService } from './error-code.service';

describe('ErrorCodeService', () => {
  let service: ErrorCodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorCodeService);
  });

  it('getErrorMessage returns mapped message, custom default, or generic default', () => {
    expect(service.getErrorMessage('0060')).toBe('Collection date cannot be in the future');
    expect(service.getErrorMessage('UNKNOWN', 'Custom')).toBe('Custom');
    expect(service.getErrorMessage('UNKNOWN')).toBe('An error occurred. Please try again.');
  });

  it('hasErrorCode returns true for known codes and false for unknown', () => {
    expect(service.hasErrorCode('0060')).toBeTrue();
    expect(service.hasErrorCode('NONEXISTENT')).toBeFalse();
  });

  it('getAllErrorCodes returns all registered code keys', () => {
    const codes = service.getAllErrorCodes();
    expect(codes).toContain('0060');
    expect(codes).toContain('DUPLICATE_UNIT');
    expect(codes.length).toBeGreaterThan(0);
  });

  it('formatErrorMessage returns message and replaces params when present', () => {
    expect(service.formatErrorMessage('0060')).toBe('Collection date cannot be in the future');
    expect(service.formatErrorMessage('0060', { key: 'val' })).toBe(
      'Collection date cannot be in the future'
    );
  });

  describe('mapApiError', () => {
    it('maps error with errorCode from API response', () => {
      const error = { error: { errorResponse: { errorCode: '0060', error: 'fallback' } } };
      const result = service.mapApiError(error);

      expect(result.code).toBe('0060');
      expect(result.message).toBe('Collection date cannot be in the future');
    });

    [
      { status: 400, expectedCode: 'VALIDATION_ERROR' },
      { status: 401, expectedCode: 'UNAUTHORIZED' },
      { status: 403, expectedCode: 'UNAUTHORIZED' },
      { status: 404, expectedCode: 'UNIT_NOT_FOUND' },
      { status: 500, expectedCode: 'SERVER_ERROR' },
      { status: 502, expectedCode: 'NETWORK_ERROR' },
    ].forEach(({ status, expectedCode }) => {
      it(`maps HTTP ${status} to ${expectedCode}`, () => {
        const result = service.mapApiError({ status });
        expect(result.code).toBe(expectedCode);
        expect(result.message).toBe(service.getErrorMessage(expectedCode));
      });
    });

    it('returns UNKNOWN_ERROR with error.message for unrecognized shape', () => {
      const result = service.mapApiError({ message: 'oops' });
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('oops');
    });

    it('returns UNKNOWN_ERROR with default message for null error', () => {
      const result = service.mapApiError(null);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unexpected error occurred');
    });
  });
});
