import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DonorLibLabelScanService } from './donor-lib-label-scan.service';
import { ApiService } from './api.service';
import { API } from '../../core/constants/api.constants';

describe('DonorLibLabelScanService', () => {
  let service: DonorLibLabelScanService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockSuccessResponse = {
    success: true,
    message: 'OK',
    statusCode: 200,
    errorCode: null,
    item: { isValid: true },
    errorResponse: null,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['post']);
    apiServiceSpy.post.and.returnValue(of(mockSuccessResponse));

    TestBed.configureTestingModule({
      providers: [
        DonorLibLabelScanService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(DonorLibLabelScanService);
  });

  // =============================================
  // Validation methods - parameterized tests
  // =============================================
  describe('validation methods', () => {
    const cases: {
      name: string;
      endpoint: string;
      invoke: (svc: DonorLibLabelScanService) => any;
      expectedBody: Record<string, unknown>;
    }[] = [
      {
        name: 'validateUnitScan',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT,
        invoke: (svc) => svc.validateUnitScan('UNIT-123'),
        expectedBody: { unitId: 'UNIT-123', validateFfValue: 'N' },
      },
      {
        name: 'validateUnitAboScan with codeScheme',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT_ABO_SCAN,
        invoke: (svc) => svc.validateUnitAboScan('SCAN-1', 'ISBT'),
        expectedBody: { scan: 'SCAN-1', codeScheme: 'ISBT' },
      },
      {
        name: 'validateUnitAboScan without codeScheme',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT_ABO_SCAN,
        invoke: (svc) => svc.validateUnitAboScan('SCAN-1'),
        expectedBody: { scan: 'SCAN-1', codeScheme: undefined },
      },
      {
        name: 'validateAboScan with codeScheme',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_ABO_SCAN,
        invoke: (svc) => svc.validateAboScan('ABO-SCAN', 'CODABAR'),
        expectedBody: { scan: 'ABO-SCAN', codeScheme: 'CODABAR' },
      },
      {
        name: 'validateAboScan without codeScheme',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_ABO_SCAN,
        invoke: (svc) => svc.validateAboScan('ABO-SCAN'),
        expectedBody: { scan: 'ABO-SCAN', codeScheme: undefined },
      },
      {
        name: 'validateProductExpdateScan',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_PRODUCT_EXPDATE_SCAN,
        invoke: (svc) => svc.validateProductExpdateScan('PROD-EXP-SCAN'),
        expectedBody: { scan: 'PROD-EXP-SCAN' },
      },
      {
        name: 'validateProductScan with codeScheme',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_PRODUCT_SCAN,
        invoke: (svc) => svc.validateProductScan('PROD-SCAN', 'ISBT'),
        expectedBody: { scan: 'PROD-SCAN', codeScheme: 'ISBT' },
      },
      {
        name: 'validateProductScan without codeScheme',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_PRODUCT_SCAN,
        invoke: (svc) => svc.validateProductScan('PROD-SCAN'),
        expectedBody: { scan: 'PROD-SCAN', codeScheme: undefined },
      },
      {
        name: 'validateExpdateScan with codeScheme',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_EXPDATE_SCAN,
        invoke: (svc) => svc.validateExpdateScan('EXP-SCAN', 'ISBT'),
        expectedBody: { scan: 'EXP-SCAN', codeScheme: 'ISBT' },
      },
      {
        name: 'validateExpdateScan without codeScheme',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_EXPDATE_SCAN,
        invoke: (svc) => svc.validateExpdateScan('EXP-SCAN'),
        expectedBody: { scan: 'EXP-SCAN', codeScheme: undefined },
      },
      {
        name: 'validateExpiryScan with codeScheme',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_EXPIRY_SCAN,
        invoke: (svc) => svc.validateExpiryScan('EXPIRY-SCAN', 'CODABAR'),
        expectedBody: { scan: 'EXPIRY-SCAN', codeScheme: 'CODABAR' },
      },
      {
        name: 'validateExpiryScan without codeScheme',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_EXPIRY_SCAN,
        invoke: (svc) => svc.validateExpiryScan('EXPIRY-SCAN'),
        expectedBody: { scan: 'EXPIRY-SCAN', codeScheme: undefined },
      },
      {
        name: 'validateProductExpiryScan',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_PRODUCT_EXPIRY_SCAN,
        invoke: (svc) => svc.validateProductExpiryScan('PROD-EXPIRY'),
        expectedBody: { scan: 'PROD-EXPIRY' },
      },
      {
        name: 'validateSpTestScan',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_SP_TEST_SCAN,
        invoke: (svc) => svc.validateSpTestScan('SP-TEST'),
        expectedBody: { scan: 'SP-TEST' },
      },
      {
        name: 'validateCatalogScan with programName',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_CATALOG_SCAN,
        invoke: (svc) => svc.validateCatalogScan('CAT-SCAN', 'Program-A'),
        expectedBody: { scan: 'CAT-SCAN', programName: 'Program-A' },
      },
      {
        name: 'validateCatalogScan without programName',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_CATALOG_SCAN,
        invoke: (svc) => svc.validateCatalogScan('CAT-SCAN'),
        expectedBody: { scan: 'CAT-SCAN', programName: undefined },
      },
      {
        name: 'validateLotScan',
        endpoint: API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_LOT_SCAN,
        invoke: (svc) => svc.validateLotScan('LOT-SCAN', 'CAT-001'),
        expectedBody: { scan: 'LOT-SCAN', catalogNumber: 'CAT-001' },
      },
    ];

    cases.forEach(({ name, endpoint, invoke, expectedBody }) => {
      describe(name, () => {
        it('should POST to the correct endpoint with SKIP_ERROR_TOAST context', (done) => {
          // Arrange & Act
          invoke(service).subscribe(() => {
            // Assert
            expect(apiServiceSpy.post).toHaveBeenCalledWith(
              endpoint,
              jasmine.objectContaining(expectedBody),
              jasmine.objectContaining({ context: jasmine.any(Object) })
            );
            done();
          });
        });

        it('should pass the correct request body', (done) => {
          // Arrange & Act
          invoke(service).subscribe(() => {
            // Assert
            const actualBody = apiServiceSpy.post.calls.mostRecent().args[1];
            expect(actualBody).toEqual(expectedBody);
            done();
          });
        });

        it('should return the API response on success', (done) => {
          // Arrange & Act
          invoke(service).subscribe((result: any) => {
            // Assert
            expect(result).toEqual(mockSuccessResponse as any);
            expect(result.success).toBe(true);
            done();
          });
        });

        it('should handle error and return error response instead of throwing', (done) => {
          // Arrange
          apiServiceSpy.post.and.returnValue(
            throwError(() => ({ status: 400, error: { message: 'Invalid scan' } }))
          );

          // Act
          invoke(service).subscribe((result: any) => {
            // Assert
            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid scan');
            expect(result.statusCode).toBe(400);
            expect(result.item).toBeNull();
            done();
          });
        });
      });
    });
  });

  // =============================================
  // handleError - comprehensive branch coverage
  // =============================================
  describe('handleError', () => {
    // ----- message resolution branches -----
    describe('message resolution', () => {
      it('should use err.error.message when available', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ status: 400, error: { message: 'Unit not found' } }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.message).toBe('Unit not found');
          done();
        });
      });

      it('should fall back to err.error.error when err.error.message is absent', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ status: 422, error: { error: 'Unprocessable scan' } }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.message).toBe('Unprocessable scan');
          done();
        });
      });

      it('should fall back to err.message when err.error has no message or error', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ message: 'Network error', error: {} }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.message).toBe('Network error');
          done();
        });
      });

      it('should fall back to err.message when err.error is undefined', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ message: 'Connection refused' }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.message).toBe('Connection refused');
          done();
        });
      });

      it('should fall back to err.message when err.error is null', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ message: 'Null error body', error: null }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.message).toBe('Null error body');
          done();
        });
      });

      it('should fall back to "Validation failed" when no details are present', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(throwError(() => ({})));

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.message).toBe('Validation failed');
          done();
        });
      });

      it('should fall back to "Validation failed" when err is null', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(throwError(() => null));

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.message).toBe('Validation failed');
          done();
        });
      });

      it('should fall back to "Validation failed" when err is undefined', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(throwError(() => undefined));

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.message).toBe('Validation failed');
          done();
        });
      });
    });

    // ----- statusCode resolution branches -----
    describe('statusCode resolution', () => {
      it('should use err.status when available', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ status: 400, error: { message: 'Bad' } }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.statusCode).toBe(400);
          done();
        });
      });

      it('should default to 500 when err.status is absent', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(throwError(() => ({})));

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.statusCode).toBe(500);
          done();
        });
      });

      it('should default to 500 when err is null', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(throwError(() => null));

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.statusCode).toBe(500);
          done();
        });
      });

      it('should use status 409 for conflict errors', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ status: 409, error: { message: 'Conflict' } }))
        );

        // Act
        service.validateUnitScan('DUP').subscribe((result) => {
          // Assert
          expect(result.statusCode).toBe(409);
          done();
        });
      });
    });

    // ----- errorCode resolution branches -----
    describe('errorCode resolution', () => {
      it('should extract errorCode from err.error.errorCode', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({
            status: 409,
            error: { message: 'Conflict', errorCode: 'DUPLICATE_UNIT' },
          }))
        );

        // Act
        service.validateUnitScan('DUP').subscribe((result) => {
          // Assert
          expect(result.errorCode).toBe('DUPLICATE_UNIT');
          done();
        });
      });

      it('should fall back to err.error.errorResponse.errorCode when err.error.errorCode is absent', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({
            status: 500,
            error: {
              errorResponse: { errorCode: 'SYS_ERR', error: 'System failure' },
            },
          }))
        );

        // Act
        service.validateUnitScan('ERR').subscribe((result) => {
          // Assert
          expect(result.errorCode).toBe('SYS_ERR');
          done();
        });
      });

      it('should return null errorCode when neither errorCode source is present', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(throwError(() => ({})));

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.errorCode).toBeNull();
          done();
        });
      });

      it('should return null errorCode when err.error is undefined', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ status: 400 }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.errorCode).toBeNull();
          done();
        });
      });
    });

    // ----- errorResponse resolution branches -----
    describe('errorResponse resolution', () => {
      it('should use err.error.errorResponse when present', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({
            status: 500,
            error: {
              errorResponse: { errorCode: 'SYS_ERR', error: 'System failure' },
            },
          }))
        );

        // Act
        service.validateUnitScan('ERR').subscribe((result) => {
          // Assert
          expect(result.errorResponse).toEqual({ errorCode: 'SYS_ERR', error: 'System failure' });
          done();
        });
      });

      it('should build default errorResponse using errorBody.message when errorResponse is absent', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ status: 400, error: { message: 'Bad scan' } }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.errorResponse).toEqual({ errorCode: '', error: 'Bad scan' });
          done();
        });
      });

      it('should build default errorResponse with "Validation failed" when both are absent', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(throwError(() => ({})));

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.errorResponse).toEqual({ errorCode: '', error: 'Validation failed' });
          done();
        });
      });

      it('should build default errorResponse when err.error is null', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ status: 400, error: null }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.errorResponse).toEqual({ errorCode: '', error: 'Validation failed' });
          done();
        });
      });
    });

    // ----- item is always null on error -----
    describe('item property', () => {
      it('should always return null item on error', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ status: 400, error: { message: 'Bad' } }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.item).toBeNull();
          done();
        });
      });
    });

    // ----- success is always false on error -----
    describe('success property', () => {
      it('should always return false on error', (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ status: 500, error: { message: 'Error' } }))
        );

        // Act
        service.validateUnitScan('BAD').subscribe((result) => {
          // Assert
          expect(result.success).toBe(false);
          done();
        });
      });
    });
  });

  // =============================================
  // Error handling via different validation methods
  // (ensures catchError is wired up for each method)
  // =============================================
  describe('error handling wiring per method', () => {
    const errorCases: {
      name: string;
      invoke: (svc: DonorLibLabelScanService) => any;
    }[] = [
      { name: 'validateUnitScan', invoke: (svc) => svc.validateUnitScan('U1') },
      { name: 'validateUnitAboScan', invoke: (svc) => svc.validateUnitAboScan('S1') },
      { name: 'validateAboScan', invoke: (svc) => svc.validateAboScan('S1') },
      { name: 'validateProductExpdateScan', invoke: (svc) => svc.validateProductExpdateScan('S1') },
      { name: 'validateProductScan', invoke: (svc) => svc.validateProductScan('S1') },
      { name: 'validateExpdateScan', invoke: (svc) => svc.validateExpdateScan('S1') },
      { name: 'validateExpiryScan', invoke: (svc) => svc.validateExpiryScan('S1') },
      { name: 'validateProductExpiryScan', invoke: (svc) => svc.validateProductExpiryScan('S1') },
      { name: 'validateSpTestScan', invoke: (svc) => svc.validateSpTestScan('S1') },
      { name: 'validateCatalogScan', invoke: (svc) => svc.validateCatalogScan('S1') },
      { name: 'validateLotScan', invoke: (svc) => svc.validateLotScan('S1', 'C1') },
    ];

    errorCases.forEach(({ name, invoke }) => {
      it(`${name} should catch error and return error response`, (done) => {
        // Arrange
        apiServiceSpy.post.and.returnValue(
          throwError(() => ({ status: 422, error: { message: 'Validation failed for ' + name } }))
        );

        // Act
        invoke(service).subscribe((result: any) => {
          // Assert
          expect(result.success).toBe(false);
          expect(result.statusCode).toBe(422);
          expect(result.message).toBe('Validation failed for ' + name);
          expect(result.item).toBeNull();
          done();
        });
      });
    });
  });

  // =============================================
  // Context verification (SKIP_ERROR_TOAST)
  // =============================================
  describe('SKIP_ERROR_TOAST context', () => {
    it('should pass HttpContext with SKIP_ERROR_TOAST to every POST request', (done) => {
      // Arrange & Act
      service.validateUnitScan('U1').subscribe(() => {
        // Assert
        const options = apiServiceSpy.post.calls.mostRecent().args[2];
        expect(options).toBeDefined();
        expect(options.context).toBeDefined();
        done();
      });
    });

    it('should use the same context instance for all validation calls', (done) => {
      // Arrange & Act
      service.validateUnitScan('U1').subscribe(() => {
        const ctx1 = apiServiceSpy.post.calls.mostRecent().args[2];

        service.validateAboScan('S1').subscribe(() => {
          const ctx2 = apiServiceSpy.post.calls.mostRecent().args[2];

          // Assert - same context object reference (readonly field)
          expect(ctx1).toBe(ctx2);
          done();
        });
      });
    });
  });
});
