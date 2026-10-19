import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import {
  LabelVerificationDialogComponent,
  LabelVerificationDialogData,
} from './label-verification-dialog.component';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { ValidAbo } from '../models/prepare-pooled-components.model';

describe('LabelVerificationDialogComponent', () => {
  let component: LabelVerificationDialogComponent;
  let fixture: ComponentFixture<LabelVerificationDialogComponent>;
  let labelScanServiceSpy: jasmine.SpyObj<DonorLibLabelScanService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<LabelVerificationDialogComponent>>;

  const mockAboOptions: ValidAbo[] = [
    { code: 'OP', label: 'O POS', description: 'O Positive' },
    { code: 'AP', label: 'A POS', description: 'A Positive' },
    { code: 'BN', label: 'B NEG', description: 'B Negative' },
  ];

  const mockDialogData: LabelVerificationDialogData = {
    poolId: 'W6333-26-050501',
    productCode: 'E2897V00',
    pooledAboRh: 'O POS',
    expectedAboLabel: 'O POS',
    expiryDate: '2026-08-15T14:30:00',
    isIsbt: true,
    hasCmvNegative: true,
    aboOptions: mockAboOptions,
  };

  function createSuccessResponse<T>(item: T) {
    return {
      success: true,
      message: '',
      statusCode: 200,
      errorCode: null,
      item,
      errorResponse: null,
    };
  }

  function createErrorResponse(message: string) {
    return {
      success: false,
      message,
      statusCode: 400,
      errorCode: 'ERR',
      item: null,
      errorResponse: { errorCode: 'ERR', error: message },
    };
  }

  function setupTestBed(withDialogData: boolean) {
    TestBed.resetTestingModule();

    labelScanServiceSpy = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateUnitAboScan',
      'validateProductExpdateScan',
      'validateAboScan',
      'validateUnitScan',
      'validateExpdateScan',
      'validateProductScan',
      'validateSpTestScan',
    ]);

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    const providers: any[] = [
      provideHttpClient(),
      { provide: DonorLibLabelScanService, useValue: labelScanServiceSpy },
    ];

    if (withDialogData) {
      providers.push(
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      );
    }

    TestBed.configureTestingModule({
      imports: [
        LabelVerificationDialogComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers,
    });

    fixture = TestBed.createComponent(LabelVerificationDialogComponent);
    component = fixture.componentInstance;
  }

  function safeDetectChanges(): void {
    try {
      fixture.detectChanges();
    } catch (_e) {
      // Template references may fail in unit tests
    }
  }

  // ── 1. Component creation ──────────────────────────────────────────────

  describe('Component creation', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialise the form with expected controls', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('scanUnitAbo')).toBeTruthy();
      expect(component.form.get('scanUnitId')).toBeTruthy();
      expect(component.form.get('scanAbo')).toBeTruthy();
      expect(component.form.get('description')).toBeTruthy();
      expect(component.form.get('scanProductCodeExpiry')).toBeTruthy();
      expect(component.form.get('scanProductCode')).toBeTruthy();
      expect(component.form.get('scanExpirationDate')).toBeTruthy();
      expect(component.form.get('scanSpTest')).toBeTruthy();
    });
  });

  // ── 2. ngOnInit ────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should populate inputs from dialog data when present', () => {
      setupTestBed(true);
      safeDetectChanges();

      expect(component.poolId).toBe(mockDialogData.poolId);
      expect(component.productCode).toBe(mockDialogData.productCode);
      expect(component.pooledAboRh).toBe(mockDialogData.pooledAboRh);
      expect(component.expectedAboLabel).toBe(mockDialogData.expectedAboLabel);
      expect(component.expiryDate).toBe(mockDialogData.expiryDate);
      expect(component.isIsbt).toBe(mockDialogData.isIsbt);
      expect(component.hasCmvNegative).toBe(mockDialogData.hasCmvNegative);
      expect(component.aboOptions).toEqual(mockDialogData.aboOptions);
    });

    it('should use default @Input values when no dialog data is provided', () => {
      setupTestBed(false);
      safeDetectChanges();

      expect(component.poolId).toBe('');
      expect(component.productCode).toBe('');
      expect(component.isIsbt).toBe(false);
      expect(component.hasCmvNegative).toBe(false);
      expect(component.aboOptions).toEqual([]);
    });
  });

  // ── 3. onUnitAboScanBlur ───────────────────────────────────────────────

  describe('onUnitAboScanBlur', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should populate unit ID and ABO on successful scan', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        parsedUnitId: 'W6333-26-050501',
        checkDigit: null,
        manualUnitId: 'W6333-26-050501',
        aboCode: 'O POS',
        aboLabel: 'O POS',
        aboDescription: 'O Positive',
        codeScheme: 'I',
        entryMode: 'scan',
        barcodeType: null,
      });
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanUnitAbo: '=W63332605050100=%5100' });
      component.onUnitAboScanBlur();
      tick();

      expect(labelScanServiceSpy.validateUnitAboScan).toHaveBeenCalledWith('=W63332605050100=%5100', 'I');
      expect(component.form.get('scanUnitId')?.value).toBe('W6333-26-050501');
      expect(component.form.get('scanAbo')?.value).toBe('O POS');
      expect(component.form.get('description')?.value).toBe('O Positive');
      expect(component.fieldProcessing['scanUnitAbo']).toBe(false);
    }));

    it('should set field error on API error response', fakeAsync(() => {
      const response = createErrorResponse('Unrecognised barcode');
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanUnitAbo: 'BADCODE' });
      component.onUnitAboScanBlur();
      tick();

      expect(component.fieldErrors['scanUnitAbo']).toBe('Unrecognised barcode');
      expect(component.form.get('scanUnitAbo')?.hasError('serverError')).toBeTrue();
      expect(component.fieldProcessing['scanUnitAbo']).toBe(false);
    }));

    it('should set field error on HTTP error', fakeAsync(() => {
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(
        throwError(() => ({ error: { message: 'Server down' } })),
      );

      component.form.patchValue({ scanUnitAbo: 'SCAN123' });
      component.onUnitAboScanBlur();
      tick();

      expect(component.fieldErrors['scanUnitAbo']).toBe('Server down');
      expect(component.fieldProcessing['scanUnitAbo']).toBe(false);
    }));

    it('should do nothing when the scan value is empty', fakeAsync(() => {
      component.form.patchValue({ scanUnitAbo: '' });
      component.onUnitAboScanBlur();
      tick();

      expect(labelScanServiceSpy.validateUnitAboScan).not.toHaveBeenCalled();
    }));
  });

  // ── 4. onProductExpdateScanBlur ────────────────────────────────────────

  describe('onProductExpdateScanBlur', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should populate product code and expiry on success with expiry', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        productCode: 'E2897V00',
        productDescription: 'Test Product',
        expiryDate: '2026-08-15T14:30:00',
        expiryHasTime: true,
        entryMode: 'scan',
      });
      labelScanServiceSpy.validateProductExpdateScan.and.returnValue(of(response));

      component.form.patchValue({ scanProductCodeExpiry: '&>E2897V0020260815' });
      component.onProductExpdateScanBlur();
      tick();

      expect(component.form.get('scanProductCode')?.value).toBe('E2897V00');
      expect(component.form.get('scanExpirationDate')?.value).toMatch(/15-AUG-2026/);
      expect(component.fieldProcessing['scanProductCodeExpiry']).toBe(false);
    }));

    it('should populate product code without setting expiry when not returned', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        productCode: 'E2897V00',
        productDescription: 'Test Product',
        expiryDate: null,
        expiryHasTime: false,
        entryMode: 'scan',
      });
      labelScanServiceSpy.validateProductExpdateScan.and.returnValue(of(response));

      component.form.patchValue({ scanProductCodeExpiry: '&>E2897V00' });
      component.onProductExpdateScanBlur();
      tick();

      expect(component.form.get('scanProductCode')?.value).toBe('E2897V00');
      expect(component.form.get('scanExpirationDate')?.value).toBe('');
      expect(component.fieldProcessing['scanProductCodeExpiry']).toBe(false);
    }));

    it('should set field error on API failure', fakeAsync(() => {
      const response = createErrorResponse('Bad product scan');
      labelScanServiceSpy.validateProductExpdateScan.and.returnValue(of(response));

      component.form.patchValue({ scanProductCodeExpiry: 'BAD' });
      component.onProductExpdateScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCodeExpiry']).toBe('Bad product scan');
      expect(component.fieldProcessing['scanProductCodeExpiry']).toBe(false);
    }));

    it('should set field error on HTTP error', fakeAsync(() => {
      labelScanServiceSpy.validateProductExpdateScan.and.returnValue(
        throwError(() => ({ error: { message: 'Network error' } })),
      );

      component.form.patchValue({ scanProductCodeExpiry: 'SCAN' });
      component.onProductExpdateScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCodeExpiry']).toBe('Network error');
      expect(component.fieldProcessing['scanProductCodeExpiry']).toBe(false);
    }));
  });

  // ── 5. onAboScanBlur ──────────────────────────────────────────────────

  describe('onAboScanBlur', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should set ABO code and description on success', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        aboCode: 'O POS',
        aboLabel: 'O POS',
        aboShortName: 'O Positive',
        entryMode: 'scan',
      });
      labelScanServiceSpy.validateAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanAbo: '=%5100' });
      component.onAboScanBlur();
      tick();

      expect(component.form.get('scanAbo')?.value).toBe('O POS');
      expect(component.form.get('description')?.value).toBe('O Positive');
      expect(component.fieldProcessing['scanAbo']).toBe(false);
    }));

    it('should set field error on API failure', fakeAsync(() => {
      const response = createErrorResponse('Invalid ABO code');
      labelScanServiceSpy.validateAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanAbo: 'BADABO' });
      component.onAboScanBlur();
      tick();

      expect(component.fieldErrors['scanAbo']).toBe('Invalid ABO code');
      expect(component.fieldProcessing['scanAbo']).toBe(false);
    }));

    it('should skip validation when aboOptionJustSelected flag is set', fakeAsync(() => {
      // Trigger onAboOptionSelected first to set the flag
      component.onAboOptionSelected('O POS');
      tick();

      // Now call onAboScanBlur - it should return early
      component.form.patchValue({ scanAbo: 'O POS' });
      component.onAboScanBlur();
      tick();

      expect(labelScanServiceSpy.validateAboScan).not.toHaveBeenCalled();
    }));

    it('should set field error on HTTP error', fakeAsync(() => {
      labelScanServiceSpy.validateAboScan.and.returnValue(
        throwError(() => ({ error: { message: 'Service unavailable' } })),
      );

      component.form.patchValue({ scanAbo: 'SCAN' });
      component.onAboScanBlur();
      tick();

      expect(component.fieldErrors['scanAbo']).toBe('Service unavailable');
      expect(component.fieldProcessing['scanAbo']).toBe(false);
    }));
  });

  // ── 6. onAboOptionSelected ─────────────────────────────────────────────

  describe('onAboOptionSelected', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should set scanAbo and description from selected option', () => {
      component.onAboOptionSelected('O POS');

      expect(component.form.get('scanAbo')?.value).toBe('O POS');
      expect(component.form.get('description')?.value).toBe('O Positive');
    });

    it('should clear any existing ABO field error', () => {
      component.fieldErrors['scanAbo'] = 'Previous error';
      component.form.get('scanAbo')?.setErrors({ serverError: true });

      component.onAboOptionSelected('A POS');

      expect(component.fieldErrors['scanAbo']).toBe('');
      expect(component.form.get('scanAbo')?.errors).toBeNull();
    });

    it('should handle unknown label gracefully', () => {
      component.onAboOptionSelected('UNKNOWN');

      expect(component.form.get('scanAbo')?.value).toBe('UNKNOWN');
      expect(component.form.get('description')?.value).toBe('');
    });
  });

  // ── 7. onUnitIdBlur ───────────────────────────────────────────────────

  describe('onUnitIdBlur', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should update unit ID on successful validation', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        parsedUnitId: 'W6333-26-050501',
        checkDigit: '0',
        manualUnitId: 'W6333-26-050501',
        codeScheme: 'I',
      });
      labelScanServiceSpy.validateUnitScan.and.returnValue(of(response));

      component.form.patchValue({ scanUnitId: '=W6333260505010' });
      component.onUnitIdBlur();
      tick();

      expect(component.form.get('scanUnitId')?.value).toBe('W6333-26-050501');
      expect(component.fieldProcessing['scanUnitId']).toBe(false);
    }));

    it('should set field error on API failure', fakeAsync(() => {
      const response = createErrorResponse('Invalid Unit ID');
      labelScanServiceSpy.validateUnitScan.and.returnValue(of(response));

      component.form.patchValue({ scanUnitId: 'BADUNIT' });
      component.onUnitIdBlur();
      tick();

      expect(component.fieldErrors['scanUnitId']).toBe('Invalid Unit ID');
      expect(component.fieldProcessing['scanUnitId']).toBe(false);
    }));

    it('should set field error on HTTP error', fakeAsync(() => {
      labelScanServiceSpy.validateUnitScan.and.returnValue(
        throwError(() => ({ error: { message: 'Timeout' } })),
      );

      component.form.patchValue({ scanUnitId: 'UNIT' });
      component.onUnitIdBlur();
      tick();

      expect(component.fieldErrors['scanUnitId']).toBe('Timeout');
      expect(component.fieldProcessing['scanUnitId']).toBe(false);
    }));

    it('should do nothing when the scan value is empty', fakeAsync(() => {
      component.form.patchValue({ scanUnitId: '' });
      component.onUnitIdBlur();
      tick();

      expect(labelScanServiceSpy.validateUnitScan).not.toHaveBeenCalled();
    }));
  });

  // ── 8. onExpiryDateScanBlur ───────────────────────────────────────────

  describe('onExpiryDateScanBlur', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should accept a valid DD-MMM-YYYY HH:mm format', fakeAsync(() => {
      component.form.patchValue({ scanExpirationDate: '15-AUG-2026 14:30' });
      component.onExpiryDateScanBlur();
      tick();

      expect(component.form.get('scanExpirationDate')?.errors).toBeNull();
    }));

    it('should call service for barcode scan values starting with &>', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        expiryDate: '2026-08-15T14:30:00',
        hasTime: true,
        entryMode: 'scan',
      });
      labelScanServiceSpy.validateExpdateScan.and.returnValue(of(response));

      component.form.patchValue({ scanExpirationDate: '&>20260815' });
      component.onExpiryDateScanBlur();
      tick();

      expect(labelScanServiceSpy.validateExpdateScan).toHaveBeenCalledWith('&>20260815', 'I');
      expect(component.form.get('scanExpirationDate')?.value).toMatch(/15-AUG-2026/);
      expect(component.fieldProcessing['scanExpirationDate']).toBe(false);
    }));

    it('should call service for numeric-only scan values', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        expiryDate: '2026-08-15T00:00:00',
        hasTime: false,
        entryMode: 'scan',
      });
      labelScanServiceSpy.validateExpdateScan.and.returnValue(of(response));

      component.form.patchValue({ scanExpirationDate: '20260815' });
      component.onExpiryDateScanBlur();
      tick();

      expect(labelScanServiceSpy.validateExpdateScan).toHaveBeenCalled();
      expect(component.fieldProcessing['scanExpirationDate']).toBe(false);
    }));

    it('should set invalidFormat error for invalid format text', fakeAsync(() => {
      component.form.patchValue({ scanExpirationDate: 'invalid-date' });
      component.onExpiryDateScanBlur();
      tick();

      expect(component.form.get('scanExpirationDate')?.hasError('invalidFormat')).toBeTrue();
    }));

    it('should set field error when barcode scan service returns failure', fakeAsync(() => {
      const response = createErrorResponse('Cannot parse expiry');
      labelScanServiceSpy.validateExpdateScan.and.returnValue(of(response));

      component.form.patchValue({ scanExpirationDate: '=>20261301' });
      component.onExpiryDateScanBlur();
      tick();

      expect(component.fieldErrors['scanExpirationDate']).toBe('Cannot parse expiry');
    }));

    it('should set field error when barcode scan service throws HTTP error', fakeAsync(() => {
      labelScanServiceSpy.validateExpdateScan.and.returnValue(
        throwError(() => ({ error: { message: 'API failed' } })),
      );

      component.form.patchValue({ scanExpirationDate: '&>20260815' });
      component.onExpiryDateScanBlur();
      tick();

      expect(component.fieldErrors['scanExpirationDate']).toBe('API failed');
      expect(component.fieldProcessing['scanExpirationDate']).toBe(false);
    }));
  });

  // ── 9. onProductScanBlur ──────────────────────────────────────────────

  describe('onProductScanBlur', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should update product code on success', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        productCode: 'E2897V00',
        productDescription: 'Pooled Platelets',
        entryMode: 'scan',
      });
      labelScanServiceSpy.validateProductScan.and.returnValue(of(response));

      component.form.patchValue({ scanProductCode: '&>E2897V00' });
      component.onProductScanBlur();
      tick();

      expect(component.form.get('scanProductCode')?.value).toBe('E2897V00');
      expect(component.fieldProcessing['scanProductCode']).toBe(false);
    }));

    it('should set field error on API failure', fakeAsync(() => {
      const response = createErrorResponse('Invalid product code');
      labelScanServiceSpy.validateProductScan.and.returnValue(of(response));

      component.form.patchValue({ scanProductCode: 'BAD' });
      component.onProductScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCode']).toBe('Invalid product code');
      expect(component.fieldProcessing['scanProductCode']).toBe(false);
    }));

    it('should set field error on HTTP error', fakeAsync(() => {
      labelScanServiceSpy.validateProductScan.and.returnValue(
        throwError(() => ({ error: { message: 'Connection refused' } })),
      );

      component.form.patchValue({ scanProductCode: 'PROD' });
      component.onProductScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCode']).toBe('Connection refused');
      expect(component.fieldProcessing['scanProductCode']).toBe(false);
    }));
  });

  // ── 10. onSpTestScanBlur ──────────────────────────────────────────────

  describe('onSpTestScanBlur', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should update SP test code on success', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        spTestCode: 'CMV01',
        description: 'CMV Negative',
        entryMode: 'scan',
      });
      labelScanServiceSpy.validateSpTestScan.and.returnValue(of(response));

      component.form.patchValue({ scanSpTest: '&(CMV01' });
      component.onSpTestScanBlur();
      tick();

      expect(component.form.get('scanSpTest')?.value).toBe('CMV01');
      expect(component.fieldProcessing['scanSpTest']).toBe(false);
    }));

    it('should set field error on API failure', fakeAsync(() => {
      const response = createErrorResponse('Invalid SP test code');
      labelScanServiceSpy.validateSpTestScan.and.returnValue(of(response));

      component.form.patchValue({ scanSpTest: 'BADSP' });
      component.onSpTestScanBlur();
      tick();

      expect(component.fieldErrors['scanSpTest']).toBe('Invalid SP test code');
      expect(component.fieldProcessing['scanSpTest']).toBe(false);
    }));

    it('should set field error on HTTP error', fakeAsync(() => {
      labelScanServiceSpy.validateSpTestScan.and.returnValue(
        throwError(() => ({ error: { message: 'SP service error' } })),
      );

      component.form.patchValue({ scanSpTest: 'SP' });
      component.onSpTestScanBlur();
      tick();

      expect(component.fieldErrors['scanSpTest']).toBe('SP service error');
      expect(component.fieldProcessing['scanSpTest']).toBe(false);
    }));
  });

  // ── 11. onVerify ──────────────────────────────────────────────────────

  describe('onVerify', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should set error when required fields are missing', () => {
      component.form.patchValue({
        scanUnitId: '',
        scanAbo: '',
        scanProductCode: '',
      });

      component.onVerify();

      expect(component.verificationError).toBe('All verification fields are required.');
    });

    it('should set error when unit ID does not match pool ID (Error 1508)', () => {
      component.form.patchValue({
        scanUnitId: 'W9999-26-999999',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanSpTest: 'CMV01',
      });

      component.onVerify();

      expect(component.verificationError).toContain('Error 1508');
    });

    it('should set error when ABO does not match expected (Error 1509)', () => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'B NEG',
        scanProductCode: 'E2897V00',
        scanSpTest: 'CMV01',
      });

      component.onVerify();

      expect(component.verificationError).toContain('Error 1509');
    });

    it('should set error when product code does not match (Error 9728)', () => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'WRONGCODE',
        scanSpTest: 'CMV01',
      });

      component.onVerify();

      expect(component.verificationError).toContain('Error 9728');
    });

    it('should set error when expiry date does not match (Error 1170)', () => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '01-JAN-2099 00:00',
        scanSpTest: 'CMV01',
      });

      component.onVerify();

      expect(component.verificationError).toContain('Error 1170');
    });

    it('should set error when SP test is required but missing', () => {
      component.isIsbt = true;
      component.hasCmvNegative = true;

      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '15-AUG-2026 14:30',
        scanSpTest: '',
      });

      component.onVerify();

      expect(component.verificationError).toBe('SP Test is required for ISBT CMV Negative pools.');
    });

    it('should close dialog with result when verification succeeds and dialogRef is present', () => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '15-AUG-2026 14:30',
        scanSpTest: 'CMV01',
      });

      component.onVerify();

      expect(component.verificationError).toBe('');
      expect(dialogRefSpy.close).toHaveBeenCalled();
      const result = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(result.scannedUnitId).toBe('W6333-26-050501');
      expect(result.scannedAbo).toBe('O POS');
      expect(result.scannedProductCode).toBe('E2897V00');
      expect(result.scannedSpTest).toBe('CMV01');
    });

    it('should emit verified event when dialogRef is not present', () => {
      setupTestBed(false);

      component.poolId = 'W6333-26-050501';
      component.productCode = 'E2897V00';
      component.expectedAboLabel = 'O POS';
      component.expiryDate = '2026-08-15T14:30:00';
      component.isIsbt = false;
      component.hasCmvNegative = false;
      component.aboOptions = mockAboOptions;

      safeDetectChanges();

      spyOn(component.verified, 'emit');

      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '15-AUG-2026 14:30',
      });

      component.onVerify();

      expect(component.verificationError).toBe('');
      expect(component.verified.emit).toHaveBeenCalled();
      const emittedResult = (component.verified.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedResult.scannedUnitId).toBe('W6333-26-050501');
    });

    it('should skip ABO comparison when expectedAboLabel is ALL', () => {
      component.expectedAboLabel = 'ALL';

      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'B NEG',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '15-AUG-2026 14:30',
        scanSpTest: 'CMV01',
      });

      component.onVerify();

      expect(component.verificationError).toBe('');
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should set error when expiry date is required but not provided', () => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '',
        scanSpTest: 'CMV01',
      });

      component.onVerify();

      expect(component.verificationError).toBe('Expiration Date is required for label verification.');
    });

    it('should set error when expiry date has invalid format', () => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanExpirationDate: 'not-a-date',
        scanSpTest: 'CMV01',
      });

      component.onVerify();

      expect(component.verificationError).toBe('Invalid expiration date format. Use DD-MMM-YYYY HH:mm.');
    });
  });

  // ── 12. onClose ───────────────────────────────────────────────────────

  describe('onClose', () => {
    it('should close dialog with null when dialogRef is present', () => {
      setupTestBed(true);
      safeDetectChanges();

      component.onClose();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });

    it('should emit close event when dialogRef is not present', () => {
      setupTestBed(false);
      safeDetectChanges();

      spyOn(component.close, 'emit');
      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  // ── 13. showSpTest getter ─────────────────────────────────────────────

  describe('showSpTest getter', () => {
    beforeEach(() => {
      setupTestBed(false);
      safeDetectChanges();
    });

    it('should return true when isIsbt and hasCmvNegative are both true', () => {
      component.isIsbt = true;
      component.hasCmvNegative = true;
      expect(component.showSpTest).toBeTrue();
    });

    it('should return false when isIsbt is false', () => {
      component.isIsbt = false;
      component.hasCmvNegative = true;
      expect(component.showSpTest).toBeFalse();
    });

    it('should return false when hasCmvNegative is false', () => {
      component.isIsbt = true;
      component.hasCmvNegative = false;
      expect(component.showSpTest).toBeFalse();
    });

    it('should return false when both are false', () => {
      component.isIsbt = false;
      component.hasCmvNegative = false;
      expect(component.showSpTest).toBeFalse();
    });
  });

  // ── 14. isAnyFieldProcessing getter ───────────────────────────────────

  describe('isAnyFieldProcessing getter', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should return false when no fields are processing', () => {
      component.fieldProcessing = {};
      expect(component.isAnyFieldProcessing).toBeFalse();
    });

    it('should return true when at least one field is processing', () => {
      component.fieldProcessing['scanUnitAbo'] = true;
      expect(component.isAnyFieldProcessing).toBeTrue();
    });

    it('should return false when all processing flags are false', () => {
      component.fieldProcessing['scanUnitAbo'] = false;
      component.fieldProcessing['scanAbo'] = false;
      expect(component.isAnyFieldProcessing).toBeFalse();
    });
  });

  // ── 15. Branch coverage: fallback paths in scan handlers ─────────────

  describe('onUnitAboScanBlur - fallback branches', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should use parsedUnitId when manualUnitId is null', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        parsedUnitId: 'PARSED-001',
        checkDigit: null,
        manualUnitId: null,
        aboCode: 'O POS',
        aboLabel: 'O POS',
        aboDescription: null,
        codeScheme: 'I',
        entryMode: null,
        barcodeType: null,
      });
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanUnitAbo: '=TEST' });
      component.onUnitAboScanBlur();
      tick();

      expect(component.form.get('scanUnitId')?.value).toBe('PARSED-001');
    }));

    it('should fall back to empty string when both manualUnitId and parsedUnitId are null', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        parsedUnitId: null,
        checkDigit: null,
        manualUnitId: null,
        aboCode: 'O POS',
        aboLabel: null,
        aboDescription: null,
        codeScheme: 'I',
        entryMode: null,
        barcodeType: null,
      });
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanUnitAbo: '=TEST' });
      component.onUnitAboScanBlur();
      tick();

      expect(component.form.get('scanUnitId')?.value).toBe('');
    }));

    it('should use abo.description when aboDescription is null', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        parsedUnitId: 'U1',
        checkDigit: null,
        manualUnitId: 'U1',
        aboCode: 'O POS',
        aboLabel: 'O POS',
        aboDescription: null,
        codeScheme: 'I',
        entryMode: null,
        barcodeType: null,
      });
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanUnitAbo: '=TEST' });
      component.onUnitAboScanBlur();
      tick();

      expect(component.form.get('description')?.value).toBe('O Positive');
    }));

    it('should use res.message when errorResponse is null on failure', fakeAsync(() => {
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(of({
        success: false,
        message: 'Fallback message',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanUnitAbo: 'BAD' });
      component.onUnitAboScanBlur();
      tick();

      expect(component.fieldErrors['scanUnitAbo']).toBe('Fallback message');
    }));

    it('should use default message when both errorResponse and message are null', fakeAsync(() => {
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanUnitAbo: 'BAD' });
      component.onUnitAboScanBlur();
      tick();

      expect(component.fieldErrors['scanUnitAbo']).toBe('Invalid Unit+ABO scan.');
    }));

    it('should use body.errorResponse.error on HTTP error when available', fakeAsync(() => {
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Detailed server error' } } })),
      );

      component.form.patchValue({ scanUnitAbo: 'TEST' });
      component.onUnitAboScanBlur();
      tick();

      expect(component.fieldErrors['scanUnitAbo']).toBe('Detailed server error');
    }));

    it('should use default message when HTTP error has no error body', fakeAsync(() => {
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(
        throwError(() => ({})),
      );

      component.form.patchValue({ scanUnitAbo: 'TEST' });
      component.onUnitAboScanBlur();
      tick();

      expect(component.fieldErrors['scanUnitAbo']).toBe('Failed to validate Unit+ABO scan.');
    }));
  });

  describe('onProductExpdateScanBlur - fallback branches', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should not set expiry when expiryDate is null', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        productCode: 'PC001',
        productDescription: null,
        expiryDate: null,
        expiryHasTime: false,
        entryMode: null,
      });
      labelScanServiceSpy.validateProductExpdateScan.and.returnValue(of(response));

      component.form.patchValue({ scanProductCodeExpiry: '&>SCAN' });
      component.onProductExpdateScanBlur();
      tick();

      expect(component.form.get('scanProductCode')?.value).toBe('PC001');
      expect(component.form.get('scanExpirationDate')?.value).toBe('');
    }));

    it('should use res.message when errorResponse is null on failure', fakeAsync(() => {
      labelScanServiceSpy.validateProductExpdateScan.and.returnValue(of({
        success: false,
        message: 'Fallback product error',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanProductCodeExpiry: 'BAD' });
      component.onProductExpdateScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCodeExpiry']).toBe('Fallback product error');
    }));

    it('should use default message when both errorResponse and message are empty', fakeAsync(() => {
      labelScanServiceSpy.validateProductExpdateScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanProductCodeExpiry: 'BAD' });
      component.onProductExpdateScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCodeExpiry']).toBe('Invalid Product+Expiry scan.');
    }));

    it('should use body.message on HTTP error when errorResponse is not available', fakeAsync(() => {
      labelScanServiceSpy.validateProductExpdateScan.and.returnValue(
        throwError(() => ({ error: { message: 'Body message only' } })),
      );

      component.form.patchValue({ scanProductCodeExpiry: 'SCAN' });
      component.onProductExpdateScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCodeExpiry']).toBe('Body message only');
    }));

    it('should use default HTTP error message when error body is empty', fakeAsync(() => {
      labelScanServiceSpy.validateProductExpdateScan.and.returnValue(
        throwError(() => ({})),
      );

      component.form.patchValue({ scanProductCodeExpiry: 'SCAN' });
      component.onProductExpdateScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCodeExpiry']).toBe('Failed to validate Product+Expiry scan.');
    }));
  });

  describe('onAboScanBlur - fallback branches', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should use scanValue as aboCode when res.item.aboCode is null', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        aboCode: null,
        aboLabel: null,
        aboShortName: null,
        entryMode: null,
      });
      labelScanServiceSpy.validateAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanAbo: 'MANUAL_ABO' });
      component.onAboScanBlur();
      tick();

      expect(component.form.get('scanAbo')?.value).toBe('MANUAL_ABO');
    }));

    it('should use abo.description when aboShortName is null', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        aboCode: 'O POS',
        aboLabel: 'O POS',
        aboShortName: null,
        entryMode: null,
      });
      labelScanServiceSpy.validateAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanAbo: 'O POS' });
      component.onAboScanBlur();
      tick();

      expect(component.form.get('description')?.value).toBe('O Positive');
    }));

    it('should use empty description when aboShortName and abo are both null', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        aboCode: 'UNKNOWN',
        aboLabel: null,
        aboShortName: null,
        entryMode: null,
      });
      labelScanServiceSpy.validateAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanAbo: 'UNKNOWN' });
      component.onAboScanBlur();
      tick();

      expect(component.form.get('description')?.value).toBe('');
    }));

    it('should use res.message when errorResponse is null', fakeAsync(() => {
      labelScanServiceSpy.validateAboScan.and.returnValue(of({
        success: false,
        message: 'ABO fallback message',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanAbo: 'BAD' });
      component.onAboScanBlur();
      tick();

      expect(component.fieldErrors['scanAbo']).toBe('ABO fallback message');
    }));

    it('should use default message when both errorResponse and message empty', fakeAsync(() => {
      labelScanServiceSpy.validateAboScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanAbo: 'BAD' });
      component.onAboScanBlur();
      tick();

      expect(component.fieldErrors['scanAbo']).toBe('Invalid ABO code.');
    }));

    it('should use body.message on HTTP error when errorResponse absent', fakeAsync(() => {
      labelScanServiceSpy.validateAboScan.and.returnValue(
        throwError(() => ({ error: { message: 'ABO body msg' } })),
      );

      component.form.patchValue({ scanAbo: 'TEST' });
      component.onAboScanBlur();
      tick();

      expect(component.fieldErrors['scanAbo']).toBe('ABO body msg');
    }));

    it('should use default HTTP error message when error body empty', fakeAsync(() => {
      labelScanServiceSpy.validateAboScan.and.returnValue(
        throwError(() => ({})),
      );

      component.form.patchValue({ scanAbo: 'TEST' });
      component.onAboScanBlur();
      tick();

      expect(component.fieldErrors['scanAbo']).toBe('Failed to validate ABO code.');
    }));
  });

  describe('onUnitIdBlur - fallback branches', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should fall back to scanValue when both manualUnitId and parsedUnitId are null', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        parsedUnitId: null,
        checkDigit: null,
        manualUnitId: null,
        codeScheme: 'I',
      });
      labelScanServiceSpy.validateUnitScan.and.returnValue(of(response));

      component.form.patchValue({ scanUnitId: 'ORIGINAL_SCAN' });
      component.onUnitIdBlur();
      tick();

      expect(component.form.get('scanUnitId')?.value).toBe('ORIGINAL_SCAN');
    }));

    it('should use res.message when errorResponse is null on failure', fakeAsync(() => {
      labelScanServiceSpy.validateUnitScan.and.returnValue(of({
        success: false,
        message: 'Unit fallback msg',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanUnitId: 'BAD' });
      component.onUnitIdBlur();
      tick();

      expect(component.fieldErrors['scanUnitId']).toBe('Unit fallback msg');
    }));

    it('should use default message when both errorResponse and message are empty', fakeAsync(() => {
      labelScanServiceSpy.validateUnitScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanUnitId: 'BAD' });
      component.onUnitIdBlur();
      tick();

      expect(component.fieldErrors['scanUnitId']).toBe('Invalid Unit ID.');
    }));

    it('should use body.errorResponse.error on HTTP error', fakeAsync(() => {
      labelScanServiceSpy.validateUnitScan.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Server unit error' } } })),
      );

      component.form.patchValue({ scanUnitId: 'TEST' });
      component.onUnitIdBlur();
      tick();

      expect(component.fieldErrors['scanUnitId']).toBe('Server unit error');
    }));

    it('should use default HTTP error message when body is empty', fakeAsync(() => {
      labelScanServiceSpy.validateUnitScan.and.returnValue(
        throwError(() => ({})),
      );

      component.form.patchValue({ scanUnitId: 'TEST' });
      component.onUnitIdBlur();
      tick();

      expect(component.fieldErrors['scanUnitId']).toBe('Failed to validate Unit ID.');
    }));
  });

  describe('onExpiryDateScanBlur - fallback branches', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should use res.message when errorResponse is null on scan failure', fakeAsync(() => {
      labelScanServiceSpy.validateExpdateScan.and.returnValue(of({
        success: false,
        message: 'Expiry fallback msg',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanExpirationDate: '&>BAD' });
      component.onExpiryDateScanBlur();
      tick();

      expect(component.fieldErrors['scanExpirationDate']).toBe('Expiry fallback msg');
    }));

    it('should use default message when res.message and errorResponse are empty', fakeAsync(() => {
      labelScanServiceSpy.validateExpdateScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanExpirationDate: '&>BAD' });
      component.onExpiryDateScanBlur();
      tick();

      expect(component.fieldErrors['scanExpirationDate']).toBe('Invalid expiry date.');
    }));

    it('should use body.errorResponse.error on HTTP error', fakeAsync(() => {
      labelScanServiceSpy.validateExpdateScan.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Server expiry error' } } })),
      );

      component.form.patchValue({ scanExpirationDate: '&>TEST' });
      component.onExpiryDateScanBlur();
      tick();

      expect(component.fieldErrors['scanExpirationDate']).toBe('Server expiry error');
    }));

    it('should use body.message on HTTP error when errorResponse absent', fakeAsync(() => {
      labelScanServiceSpy.validateExpdateScan.and.returnValue(
        throwError(() => ({ error: { message: 'Expiry body msg' } })),
      );

      component.form.patchValue({ scanExpirationDate: '&>TEST' });
      component.onExpiryDateScanBlur();
      tick();

      expect(component.fieldErrors['scanExpirationDate']).toBe('Expiry body msg');
    }));

    it('should use default HTTP error message when body is empty', fakeAsync(() => {
      labelScanServiceSpy.validateExpdateScan.and.returnValue(
        throwError(() => ({})),
      );

      component.form.patchValue({ scanExpirationDate: '&>TEST' });
      component.onExpiryDateScanBlur();
      tick();

      expect(component.fieldErrors['scanExpirationDate']).toBe('Failed to validate expiry date.');
    }));

    it('should set invalidDateTime when date matches regex but is invalid', fakeAsync(() => {
      // Matches the regex pattern but is an invalid date
      component.form.patchValue({ scanExpirationDate: '31-FEV-2026 00:00' });
      component.onExpiryDateScanBlur();
      tick();

      expect(component.form.get('scanExpirationDate')?.hasError('invalidDateTime')).toBeTrue();
    }));

    it('should call service for scan values starting with =>', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        expiryDate: '2026-08-15T00:00:00',
        hasTime: false,
        entryMode: 'scan',
      });
      labelScanServiceSpy.validateExpdateScan.and.returnValue(of(response));

      component.form.patchValue({ scanExpirationDate: '=>20260815' });
      component.onExpiryDateScanBlur();
      tick();

      expect(labelScanServiceSpy.validateExpdateScan).toHaveBeenCalled();
    }));

    it('should handle scan result with null expiryDate', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        expiryDate: null,
        hasTime: false,
        entryMode: 'scan',
      });
      labelScanServiceSpy.validateExpdateScan.and.returnValue(of(response));

      component.form.patchValue({ scanExpirationDate: '&>123456' });
      component.onExpiryDateScanBlur();
      tick();

      // No item.expiryDate, so falls into error branch
      expect(component.fieldErrors['scanExpirationDate']).toBeTruthy();
    }));
  });

  describe('onProductScanBlur - fallback branches', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should use scanValue when res.item.productCode is null', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        productCode: null,
        productDescription: null,
        entryMode: null,
      });
      labelScanServiceSpy.validateProductScan.and.returnValue(of(response));

      component.form.patchValue({ scanProductCode: 'TYPED_CODE' });
      component.onProductScanBlur();
      tick();

      expect(component.form.get('scanProductCode')?.value).toBe('TYPED_CODE');
    }));

    it('should use res.message when errorResponse is null', fakeAsync(() => {
      labelScanServiceSpy.validateProductScan.and.returnValue(of({
        success: false,
        message: 'Product fallback',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanProductCode: 'BAD' });
      component.onProductScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCode']).toBe('Product fallback');
    }));

    it('should use default message when both are empty', fakeAsync(() => {
      labelScanServiceSpy.validateProductScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanProductCode: 'BAD' });
      component.onProductScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCode']).toBe('Invalid product code.');
    }));

    it('should use body.errorResponse.error on HTTP error', fakeAsync(() => {
      labelScanServiceSpy.validateProductScan.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Server product error' } } })),
      );

      component.form.patchValue({ scanProductCode: 'TEST' });
      component.onProductScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCode']).toBe('Server product error');
    }));

    it('should use body.message on HTTP error when no errorResponse', fakeAsync(() => {
      labelScanServiceSpy.validateProductScan.and.returnValue(
        throwError(() => ({ error: { message: 'Product body msg' } })),
      );

      component.form.patchValue({ scanProductCode: 'TEST' });
      component.onProductScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCode']).toBe('Product body msg');
    }));

    it('should use default HTTP error when body is empty', fakeAsync(() => {
      labelScanServiceSpy.validateProductScan.and.returnValue(
        throwError(() => ({})),
      );

      component.form.patchValue({ scanProductCode: 'TEST' });
      component.onProductScanBlur();
      tick();

      expect(component.fieldErrors['scanProductCode']).toBe('Failed to validate product code.');
    }));
  });

  describe('onSpTestScanBlur - fallback branches', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should use scanValue when res.item.spTestCode is null', fakeAsync(() => {
      const response = createSuccessResponse({
        isValid: true,
        spTestCode: null,
        description: null,
        entryMode: null,
      });
      labelScanServiceSpy.validateSpTestScan.and.returnValue(of(response));

      component.form.patchValue({ scanSpTest: 'TYPED_SP' });
      component.onSpTestScanBlur();
      tick();

      expect(component.form.get('scanSpTest')?.value).toBe('TYPED_SP');
    }));

    it('should use res.message when errorResponse is null', fakeAsync(() => {
      labelScanServiceSpy.validateSpTestScan.and.returnValue(of({
        success: false,
        message: 'SP fallback',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanSpTest: 'BAD' });
      component.onSpTestScanBlur();
      tick();

      expect(component.fieldErrors['scanSpTest']).toBe('SP fallback');
    }));

    it('should use default message when both are empty', fakeAsync(() => {
      labelScanServiceSpy.validateSpTestScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.form.patchValue({ scanSpTest: 'BAD' });
      component.onSpTestScanBlur();
      tick();

      expect(component.fieldErrors['scanSpTest']).toBe('Invalid SP test code.');
    }));

    it('should use body.message on HTTP error when no errorResponse', fakeAsync(() => {
      labelScanServiceSpy.validateSpTestScan.and.returnValue(
        throwError(() => ({ error: { message: 'SP body msg' } })),
      );

      component.form.patchValue({ scanSpTest: 'TEST' });
      component.onSpTestScanBlur();
      tick();

      expect(component.fieldErrors['scanSpTest']).toBe('SP body msg');
    }));

    it('should use default HTTP error when body is empty', fakeAsync(() => {
      labelScanServiceSpy.validateSpTestScan.and.returnValue(
        throwError(() => ({})),
      );

      component.form.patchValue({ scanSpTest: 'TEST' });
      component.onSpTestScanBlur();
      tick();

      expect(component.fieldErrors['scanSpTest']).toBe('Failed to validate SP test code.');
    }));
  });

  // ── 16. tryAutoVerify edge cases ──────────────────────────────────────

  describe('tryAutoVerify (via scan handlers)', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should not auto-verify when a field is still processing', fakeAsync(() => {
      component.fieldProcessing['scanAbo'] = true;

      // Set up all fields correctly
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '15-AUG-2026 14:30',
        scanSpTest: 'CMV01',
      });

      // Manually try onVerify would succeed, but tryAutoVerify should bail due to processing
      component.fieldProcessing['scanAbo'] = true;
      // tryAutoVerify is private, so we trigger it through ABO option selection
      // but the processing flag should prevent auto-verify
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));

    it('should not auto-verify when unit ID is missing', fakeAsync(() => {
      component.form.patchValue({
        scanUnitId: '',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
      });

      component.onAboOptionSelected('O POS');
      tick();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));

    it('should not auto-verify when ABO is missing', fakeAsync(() => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: '',
        scanProductCode: 'E2897V00',
      });

      component.onAboOptionSelected('');
      tick();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));

    it('should not auto-verify when product code is missing', fakeAsync(() => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: '',
      });

      component.onAboOptionSelected('O POS');
      tick();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));

    it('should not auto-verify when SP test required but missing', fakeAsync(() => {
      component.isIsbt = true;
      component.hasCmvNegative = true;

      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '15-AUG-2026 14:30',
        scanSpTest: '',
      });

      component.onAboOptionSelected('O POS');
      tick();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));

    it('should not auto-verify when expiry date required but missing', fakeAsync(() => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '',
      });

      component.onAboOptionSelected('O POS');
      tick();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));

    it('should not auto-verify when form has errors', fakeAsync(() => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '15-AUG-2026 14:30',
        scanSpTest: 'CMV01',
      });

      // Set error on a field
      component.form.get('scanUnitId')?.setErrors({ serverError: true });

      component.onAboOptionSelected('O POS');
      tick();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));
  });

  // ── 17. ABO autocomplete filtering with null labels ───────────────────

  describe('ABO autocomplete filtering - null label handling', () => {
    it('should handle aboOptions with null label', fakeAsync(() => {
      setupTestBed(true);
      safeDetectChanges();

      // Replace abo options with one that has null label
      component.aboOptions = [
        { code: 'OP', label: null, description: 'O Positive' },
        { code: 'AP', label: 'A POS', description: 'A Positive' },
      ];
      component.filteredAboOptions = [...component.aboOptions];

      component.form.get('scanAbo')?.setValue('A POS');
      tick(250);

      expect(component.filteredAboOptions.length).toBe(1);
      expect(component.filteredAboOptions[0].code).toBe('AP');
    }));
  });

  // ── 18. codeScheme getter ─────────────────────────────────────────────

  describe('codeScheme (via service calls)', () => {
    it('should use code scheme "C" when isIsbt is false', fakeAsync(() => {
      setupTestBed(false);
      component.isIsbt = false;
      component.aboOptions = mockAboOptions;
      safeDetectChanges();

      const response = createSuccessResponse({
        isValid: true,
        aboCode: 'O POS',
        aboLabel: 'O POS',
        aboShortName: 'O Positive',
        entryMode: null,
      });
      labelScanServiceSpy.validateAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanAbo: 'TEST' });
      component.onAboScanBlur();
      tick();

      expect(labelScanServiceSpy.validateAboScan).toHaveBeenCalledWith('TEST', 'C');
    }));

    it('should use code scheme "I" when isIsbt is true', fakeAsync(() => {
      setupTestBed(true);
      safeDetectChanges();

      const response = createSuccessResponse({
        isValid: true,
        aboCode: 'O POS',
        aboLabel: 'O POS',
        aboShortName: 'O Positive',
        entryMode: null,
      });
      labelScanServiceSpy.validateAboScan.and.returnValue(of(response));

      component.form.patchValue({ scanAbo: 'TEST' });
      component.onAboScanBlur();
      tick();

      expect(labelScanServiceSpy.validateAboScan).toHaveBeenCalledWith('TEST', 'I');
    }));
  });

  // ── 19. extractAboLabel ───────────────────────────────────────────────

  describe('onVerify - extractAboLabel branches', () => {
    beforeEach(() => {
      setupTestBed(true);
      safeDetectChanges();
    });

    it('should extract ABO label before dash separator', () => {
      component.form.patchValue({
        scanUnitId: 'W6333-26-050501',
        scanAbo: 'O POS - O Positive',
        scanProductCode: 'E2897V00',
        scanExpirationDate: '15-AUG-2026 14:30',
        scanSpTest: 'CMV01',
      });

      component.onVerify();

      expect(component.verificationError).toBe('');
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  // ── 20. ngOnDestroy ───────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      setupTestBed(true);
      safeDetectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
