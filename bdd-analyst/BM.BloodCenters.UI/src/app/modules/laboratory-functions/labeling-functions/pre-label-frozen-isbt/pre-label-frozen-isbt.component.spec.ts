import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';

import { PreLabelFrozenIsbtComponent } from './pre-label-frozen-isbt.component';
import { PreLabelFrozenIsbtService } from './services/pre-label-frozen-isbt.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { UnitIdPostValidateEvent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ScanSelectOption } from '@shared/components/scan-select-field';
import {
  ComponentDto,
  ProcessLabelResponse,
  ValidateUnitResponse,
  ChapterConfigResponse,
} from './models/pre-label-frozen-isbt.model';
import { LabelPrinterContext } from '../common-labeling-functions/change-label-printer/change-label-printer.model';

// ────────────── Mock Data ──────────────

const mockPrinterContext: LabelPrinterContext = {
  labelPrinterCode: 'LP01',
  tieTagPrinterCode: null,
  processingFacilityAuditKey: null,
};

const mockChapterConfig: ChapterConfigResponse = {
  chapterId: 'TST',
  unitScheme: 'I',
  qcReqdFlag: 'N',
  nursingFlag: 'N',
  chapterName: 'Test Chapter',
};

const mockComponent: ComponentDto = {
  productCode: 'E0280',
  productDescription: 'Red Blood Cells',
  componentPrefix: '01',
  componentStatus: 'L',
  systemLabelDecision: 'OP',
  preLabelSld: 'OP',
  bagsUsed: 1,
};

const mockComponent2: ComponentDto = {
  productCode: 'E0290',
  productDescription: 'Plasma',
  componentPrefix: '02',
  componentStatus: 'L',
  systemLabelDecision: 'OP',
  preLabelSld: 'OP',
  bagsUsed: 1,
};

const mockUnitData: ValidateUnitResponse = {
  unitId: 'W123456789012',
  displayUnitId: 'W123456789012',
  collDate: '2026-01-15T00:00:00',
  contractId: 'INTERNAL',
  contractType: 'I',
  donorDecisionCode: 'A',
  isReagent: false,
  qcLabelFlag: 'N',
  systemLabelDecision: 'OP',
  components: [mockComponent],
  interdictions: [],
  attributes: [],
} as any;

const mockMultiComponentUnit: ValidateUnitResponse = {
  ...mockUnitData,
  components: [mockComponent, mockComponent2],
} as any;

const mockLabelResult: ProcessLabelResponse = {
  labelDecision: 'OP',
  labelDecisionDisplay: 'O Pos',
  rhDisplay: 'Pos',
  intendedUse: 'V',
  identifierCode: 'VL',
  testedAboCode: 'OP',
  testedAboDescription: 'O Positive',
  expiryDate: '2026-07-01T23:59:00',
  productType: 'RBC',
  specialTestingCode: null,
  barcodeValue: '=W123456789012',
  labelProductCode: 'E0280',
  isWarning: false,
  warningMessage: null,
  warningCode: null,
  doubleScanReqd: false,
  secondLabelDecision: null,
  secondLabelDecisionDisplay: null,
  secondRhDisplay: null,
  secondIntendedUse: null,
  holdReasons: [],
  interdictions: [],
  attributes: [],
  overrideMessage: null,
  overrideReasons: [],
} as any;

// ────────────── Helpers ──────────────

function apiSuccess<T>(item: T): any {
  return { success: true, statusCode: 200, message: 'OK', item };
}

function apiError(message = 'Error', errorCode?: string): any {
  return {
    success: false,
    statusCode: 400,
    message,
    errorResponse: { errorCode: errorCode || '9999', error: message, message },
  };
}

function makePostValidateEvent(parsedUnitId: string, codeScheme: 'I' | 'C' = 'I'): UnitIdPostValidateEvent {
  return {
    data: {
      parsedUnitId,
      checkDigit: null,
      codeScheme,
      manualUnitId: parsedUnitId,
      codabarUnitScheme: null,
      entryMode: 'S',
      barcodeType: 'CODE128',
      chapterScheme: 'I',
    } as UnitValidationResponse,
    confirm: jasmine.createSpy('confirm'),
    reject: jasmine.createSpy('reject'),
  };
}

// ────────────── Tests ──────────────

describe('PreLabelFrozenIsbtComponent', () => {
  let component: PreLabelFrozenIsbtComponent;
  let fixture: ComponentFixture<PreLabelFrozenIsbtComponent>;
  let serviceSpy: jasmine.SpyObj<PreLabelFrozenIsbtService>;
  let labelScanSpy: jasmine.SpyObj<DonorLibLabelScanService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let dialogRefSpy: jasmine.SpyObj<any>;
  let router: Router;
  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('PreLabelFrozenIsbtService', [
      'validateAccess',
      'validateUnit',
      'processLabel',
      'confirmVerification',
      'reprint',
      'getLovAboValues',
      'getLovSpecialTestCodes',
      'logAbandonedLabel',
      'getPrinterConfig',
    ]);
    serviceSpy.validateAccess.and.returnValue(of(apiSuccess(mockChapterConfig)));
    serviceSpy.getLovAboValues.and.returnValue(of(apiSuccess([{ aboLabel: 'OP', aboShortName: 'O Pos' }])));
    serviceSpy.getLovSpecialTestCodes.and.returnValue(of(apiSuccess([])));
    serviceSpy.logAbandonedLabel.and.returnValue(of(apiSuccess(true)));

    labelScanSpy = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateAboScan',
      'validateProductScan',
      'validateSpTestScan',
      'validateUnitAboScan',
      'validateUnitScan',
      'validateProductExpiryScan',
      'validateExpiryScan',
    ]);

    snackbarSpy = createMockSnackbarService();

    chapterChangedSubject = new Subject<void>();
    headerSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
    });

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogRefSpy.afterClosed.and.returnValue(of(null));
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
    dialogSpy.open.and.returnValue(dialogRefSpy);

    sessionStorage.setItem('labelPrinterContext', JSON.stringify(mockPrinterContext));

    TestBed.configureTestingModule({
      imports: [PreLabelFrozenIsbtComponent],
      providers: [
        provideAnimationsAsync(),
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideRouter([]),
        { provide: PreLabelFrozenIsbtService, useValue: serviceSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    });

    fixture = TestBed.createComponent(PreLabelFrozenIsbtComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function initComponent(): void {
    try { fixture.detectChanges(); } catch (_e) { /* child template errors */ }
  }

  function setupLabeledPhase(labelOverrides: Partial<ProcessLabelResponse> = {}): void {
    component.unitData.set(mockUnitData as any);
    component.selectedComponent.set(mockComponent);
    component.labelResult.set({ ...mockLabelResult, ...labelOverrides } as any);
    component.phase1ParsedUnitId.set('W123456789012');
    component.phase.set('labeled');
    component.doLabelCalled.set(true);
    Object.keys(component.verificationForm.controls).forEach((key) => {
      component.verificationForm.get(key)?.enable();
    });
  }

  // ────────────── Initialization ──────────────

  describe('Initialization', () => {
    it('should set phase to ready after successful validateAccess with printer context', () => {
      initComponent();

      expect(component.phase()).toBe('ready');
      expect(component.loading()).toBe(false);
      expect(component.chapterConfig()).toEqual(mockChapterConfig);
      expect(component.printerContext()).toEqual(mockPrinterContext);
    });

    it('should redirect to change-printer when no printer code in storage', () => {
      sessionStorage.clear();

      initComponent();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/laboratory-functions/labeling-functions/common-labeling-functions/change-label-printer'],
        { queryParams: { returnUrl: '/laboratory-functions/labeling-functions/pre-label-frozen-product' } },
      );
      expect(component.phase()).toBe('init');
    });

    it('should redirect when printer context has null labelPrinterCode', () => {
      sessionStorage.setItem('labelPrinterContext',
        JSON.stringify({ labelPrinterCode: null, tieTagPrinterCode: null, processingFacilityAuditKey: null }),
      );

      initComponent();

      expect(router.navigate).toHaveBeenCalled();
    });

    it('should handle invalid JSON in sessionStorage gracefully', () => {
      sessionStorage.setItem('labelPrinterContext', 'NOT_VALID_JSON');

      initComponent();

      expect(router.navigate).toHaveBeenCalled();
    });

    it('should handle validateAccess error', () => {
      serviceSpy.validateAccess.and.returnValue(throwError(() => new Error('Server error')));

      initComponent();

      expect(component.loading()).toBe(false);
      expect(component.chapterConfig()).toBeNull();
    });

    it('should handle validateAccess returning unsuccessful response', () => {
      serviceSpy.validateAccess.and.returnValue(of(apiError('No access')));

      initComponent();

      expect(component.loading()).toBe(false);
      expect(component.phase()).toBe('init');
    });

    it('should initialize the verification form with all disabled controls', () => {
      initComponent();

      const controls = component.verificationForm.controls;
      expect(controls['scanUnitAbo']).toBeDefined();
      expect(controls['scanUnitId']).toBeDefined();
      expect(controls['scanAbo']).toBeDefined();
      expect(controls['scanProdExp']).toBeDefined();
      expect(controls['scanProductCode']).toBeDefined();
      expect(controls['scanExpDate']).toBeDefined();
      expect(controls['scanCollDate']).toBeDefined();
      expect(controls['colldate']).toBeDefined();
      expect(controls['scanSpecialTest']).toBeDefined();

      Object.values(controls).forEach((ctrl) => {
        expect(ctrl.disabled).toBeTrue();
      });
    });
  });

  // ────────────── Chapter Change Subscription ──────────────

  describe('Chapter Change Subscription', () => {
    it('should clear all and reinitialize on chapter change', () => {
      initComponent();
      expect(component.phase()).toBe('ready');

      component.unitData.set(mockUnitData as any);
      component.phase.set('labeled');

      serviceSpy.validateAccess.calls.reset();
      chapterChangedSubject.next();

      expect(component.unitData()).toBeNull();
      expect(serviceSpy.validateAccess).toHaveBeenCalled();
    });
  });

  // ────────────── Computed Signals ──────────────

  describe('Computed Signals', () => {
    beforeEach(() => initComponent());

    describe('bloodTypeDisplay', () => {
      it('should return null when no labelResult', () => {
        component.labelResult.set(null);
        expect(component.bloodTypeDisplay()).toBeNull();
      });

      it('should return normal display for non-special label decision', () => {
        component.labelResult.set({ ...mockLabelResult } as any);
        component.isSecondScan.set(false);

        const display = component.bloodTypeDisplay()!;
        expect(display.labelDecision).toBe('OP');
        expect(display.labelDecisionDisplay).toBe('O Pos');
        expect(display.rhDisplay).toBe('Pos');
        expect(display.intendedUse).toBe('V');
      });

      it.each([
        { decision: 'Mq', expectedDisplay: 'HOLD' },
        { decision: 'Mb', expectedDisplay: 'BIO' },
        { decision: 'Md', expectedDisplay: 'DISC' },
        { decision: 'Mf', expectedDisplay: 'MFG' },
      ])('should map special code $decision to $expectedDisplay', ({ decision, expectedDisplay }) => {
        component.labelResult.set({
          ...mockLabelResult,
          labelDecision: decision,
          labelDecisionDisplay: 'Original',
          identifierCode: 'VL',
        } as any);
        component.isSecondScan.set(false);

        const display = component.bloodTypeDisplay()!;
        expect(display.labelDecisionDisplay).toBe(expectedDisplay);
        expect(display.rhDisplay).toBe('');
        expect(display.intendedUse).toBe('');
      });

      it('should show intendedUse for directed bio even when special code', () => {
        component.labelResult.set({
          ...mockLabelResult,
          labelDecision: 'Mb',
          identifierCode: 'DB',
          intendedUse: 'Directed Bio Use',
        } as any);
        component.isSecondScan.set(false);

        const display = component.bloodTypeDisplay()!;
        expect(display.labelDecisionDisplay).toBe('BIO');
        expect(display.intendedUse).toBe('Directed Bio Use');
      });

      it('should use second label values when isSecondScan and secondLabelDecision exists', () => {
        component.labelResult.set({
          ...mockLabelResult,
          secondLabelDecision: 'AN',
          secondLabelDecisionDisplay: 'A Neg',
          secondRhDisplay: 'Neg',
          secondIntendedUse: 'V2',
        } as any);
        component.isSecondScan.set(true);

        const display = component.bloodTypeDisplay()!;
        expect(display.labelDecision).toBe('AN');
        expect(display.labelDecisionDisplay).toBe('A Neg');
        expect(display.rhDisplay).toBe('Neg');
        expect(display.intendedUse).toBe('V2');
      });

      it('should fall back to first label when isSecondScan but no secondLabelDecision', () => {
        component.labelResult.set({
          ...mockLabelResult,
          secondLabelDecision: null,
        } as any);
        component.isSecondScan.set(true);

        const display = component.bloodTypeDisplay()!;
        expect(display.labelDecision).toBe('OP');
        expect(display.labelDecisionDisplay).toBe('O Pos');
      });

      it('should fall back to first Rh/intendedUse when second values are null', () => {
        component.labelResult.set({
          ...mockLabelResult,
          secondLabelDecision: 'BN',
          secondLabelDecisionDisplay: 'B Neg',
          secondRhDisplay: null,
          secondIntendedUse: null,
        } as any);
        component.isSecondScan.set(true);

        const display = component.bloodTypeDisplay()!;
        expect(display.rhDisplay).toBe('Pos');
        expect(display.intendedUse).toBe('V');
      });

      it('should use secondLabelDecision as display when secondLabelDecisionDisplay is null', () => {
        component.labelResult.set({
          ...mockLabelResult,
          secondLabelDecision: 'BN',
          secondLabelDecisionDisplay: null,
          secondRhDisplay: 'Neg',
        } as any);
        component.isSecondScan.set(true);

        const display = component.bloodTypeDisplay()!;
        expect(display.labelDecisionDisplay).toBe('BN');
      });
    });

    describe('row1ProductCodeDisabled', () => {
      it.each([
        { phase: 'init' as const, expected: true },
        { phase: 'ready' as const, expected: true },
        { phase: 'unit-validated' as const, expected: false },
        { phase: 'labeled' as const, expected: false },
        { phase: 'verifying' as const, expected: false },
      ])('should return $expected when phase is $phase', ({ phase, expected }) => {
        component.phase.set(phase);
        expect(component.row1ProductCodeDisabled()).toBe(expected);
      });
    });

    describe('isMfOrRplFlow', () => {
      it('should return false when no labelResult', () => {
        component.labelResult.set(null);
        expect(component.isMfOrRplFlow()).toBeFalse();
      });

      it.each([
        { labelDecision: 'Mf', productType: 'RBC', expected: true },
        { labelDecision: 'OP', productType: 'RPL', expected: true },
        { labelDecision: 'OP', productType: 'RPFF', expected: true },
        { labelDecision: 'OP', productType: 'RBC', expected: false },
      ])('should return $expected for decision=$labelDecision, type=$productType',
        ({ labelDecision, productType, expected }) => {
          component.labelResult.set({ ...mockLabelResult, labelDecision, productType } as any);
          expect(component.isMfOrRplFlow()).toBe(expected);
        });
    });

    describe('isVerificationStarted', () => {
      it('should return false when all verification fields are empty', () => {
        expect(component.isVerificationStarted()).toBeFalse();
      });

      it('should return true when scanUnitId has value', () => {
        component.verificationForm.get('scanUnitId')?.enable();
        component.verificationForm.patchValue({ scanUnitId: 'W123' });
        expect(component.isVerificationStarted()).toBeTrue();
      });

      it('should return true when scanAbo has value', () => {
        component.verificationForm.get('scanAbo')?.enable();
        component.verificationForm.patchValue({ scanAbo: 'OP' });
        expect(component.isVerificationStarted()).toBeTrue();
      });

      it('should return true when scanProductCode has value', () => {
        component.verificationForm.get('scanProductCode')?.enable();
        component.verificationForm.patchValue({ scanProductCode: 'E0280' });
        expect(component.isVerificationStarted()).toBeTrue();
      });

      it('should return false when values are only whitespace', () => {
        component.verificationForm.get('scanUnitId')?.enable();
        component.verificationForm.patchValue({ scanUnitId: '   ' });
        expect(component.isVerificationStarted()).toBeFalse();
      });
    });

    describe('reprintDisabled', () => {
      it('should be true when phase is not labeled', () => {
        component.phase.set('ready');
        component.loading.set(false);
        expect(component.reprintDisabled()).toBeTrue();
      });

      it('should be true when loading', () => {
        component.phase.set('labeled');
        component.loading.set(true);
        expect(component.reprintDisabled()).toBeTrue();
      });

      it('should be true when verification is started', () => {
        component.phase.set('labeled');
        component.loading.set(false);
        component.verificationForm.get('scanUnitId')?.enable();
        component.verificationForm.patchValue({ scanUnitId: 'W123' });
        expect(component.reprintDisabled()).toBeTrue();
      });

      it('should be false when labeled, not loading, and no verification started', () => {
        component.phase.set('labeled');
        component.loading.set(false);
        expect(component.reprintDisabled()).toBeFalse();
      });
    });

    describe('isAnyFieldProcessing', () => {
      it('should return false when no fields are processing', () => {
        component.fieldProcessing = {};
        expect(component.isAnyFieldProcessing).toBeFalse();
      });

      it('should return true when any field is processing', () => {
        component.fieldProcessing = { scanUnitId: true, scanAbo: false };
        expect(component.isAnyFieldProcessing).toBeTrue();
      });

      it('should return false when all fields are false', () => {
        component.fieldProcessing = { scanUnitId: false, scanAbo: false };
        expect(component.isAnyFieldProcessing).toBeFalse();
      });
    });
  });

  // ────────────── Phase 1: Unit Scan ──────────────

  describe('Phase 1: Unit Scan', () => {
    beforeEach(() => initComponent());

    describe('onUnitPostValidate', () => {
      it('should validate unit and set phase to unit-validated with single component', () => {
        serviceSpy.validateUnit.and.returnValue(of(apiSuccess(mockUnitData)));
        serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));
        const event = makePostValidateEvent('W123456789012');

        component.onUnitPostValidate(event);

        expect(serviceSpy.validateUnit).toHaveBeenCalledWith({ unitId: 'W123456789012' });
        expect(event.confirm).toHaveBeenCalled();
        expect(component.unitData()).toEqual(mockUnitData as any);
        expect(component.phase1ParsedUnitId()).toBe('W123456789012');
        expect(component.selectedComponent()).toEqual(mockComponent);
      });

      it('should focus product code field when multiple components', () => {
        serviceSpy.validateUnit.and.returnValue(of(apiSuccess(mockMultiComponentUnit)));
        const event = makePostValidateEvent('W123456789012');

        component.onUnitPostValidate(event);

        expect(event.confirm).toHaveBeenCalled();
        expect(component.phase()).toBe('unit-validated');
        expect(component.row1ProductCodeOptions().length).toBe(2);
      });

      it('should reject when response is unsuccessful', () => {
        serviceSpy.validateUnit.and.returnValue(of({
          success: false, message: 'Not found',
          errorResponse: { message: 'Unit not found' },
        }));
        const event = makePostValidateEvent('W999999999999');

        component.onUnitPostValidate(event);

        expect(event.reject).toHaveBeenCalledWith('Unit not found');
      });

      it('should reject with default message when no error detail', () => {
        serviceSpy.validateUnit.and.returnValue(of({ success: false }));
        const event = makePostValidateEvent('W999999999999');

        component.onUnitPostValidate(event);

        expect(event.reject).toHaveBeenCalledWith('Unit validation failed');
      });

      it('should reject when response has no item', () => {
        serviceSpy.validateUnit.and.returnValue(of({ success: true, item: null }));
        const event = makePostValidateEvent('W999999999999');

        component.onUnitPostValidate(event);

        expect(event.reject).toHaveBeenCalledWith('Unit validation failed');
      });

      it('should reject when unit has no components', () => {
        const unitNoComps = { ...mockUnitData, components: [] };
        serviceSpy.validateUnit.and.returnValue(of(apiSuccess(unitNoComps)));
        const event = makePostValidateEvent('W123456789012');

        component.onUnitPostValidate(event);

        expect(event.reject).toHaveBeenCalledWith('No labelable component found');
      });

      it('should reject on observable error', () => {
        serviceSpy.validateUnit.and.returnValue(throwError(() => new Error('Network error')));
        const event = makePostValidateEvent('W123456789012');

        component.onUnitPostValidate(event);

        expect(event.reject).toHaveBeenCalledWith('Unit validation failed');
      });

      it('should prevent concurrent unit validations', () => {
        serviceSpy.validateUnit.and.returnValue(of(apiSuccess(mockUnitData)));
        serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));
        const event1 = makePostValidateEvent('W123456789012');

        (component as any).unitValidating = true;
        component.onUnitPostValidate(event1);

        expect(serviceSpy.validateUnit).not.toHaveBeenCalled();
      });

      it('should set unit code scheme from event data', () => {
        serviceSpy.validateUnit.and.returnValue(of(apiSuccess(mockUnitData)));
        serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));
        const event = makePostValidateEvent('C123456789012', 'C');

        component.onUnitPostValidate(event);

        expect(component.unitCodeScheme()).toBe('C');
      });

      it('should use message field when errorResponse.message is absent', () => {
        serviceSpy.validateUnit.and.returnValue(of({
          success: false,
          message: 'Fallback message',
          errorResponse: null,
        }));
        const event = makePostValidateEvent('W999999999999');

        component.onUnitPostValidate(event);

        expect(event.reject).toHaveBeenCalledWith('Fallback message');
      });
    });

    describe('onUnitCleared', () => {
      it('should clear all and set phase to ready when printer and config exist', () => {
        component.phase.set('unit-validated');
        component.unitData.set(mockUnitData as any);

        component.onUnitCleared();

        expect(component.unitData()).toBeNull();
        expect(component.phase()).toBe('ready');
      });

      it('should not set phase to ready when printer context is null', () => {
        component.printerContext.set(null);
        component.chapterConfig.set(mockChapterConfig);
        component.phase.set('init');

        component.onUnitCleared();

        expect(component.phase()).not.toBe('ready');
      });
    });

    describe('onClearAll', () => {
      it('should clear all, set phase to ready', () => {
        component.unitData.set(mockUnitData as any);
        component.phase.set('labeled');
        component.unitIdField = { clear: jasmine.createSpy('clear'), focus: jasmine.createSpy('focus') } as any;

        component.onClearAll();

        expect(component.phase()).toBe('ready');
        expect(component.unitData()).toBeNull();
        expect(component.unitIdField.clear).toHaveBeenCalled();
        expect(component.unitIdField.focus).toHaveBeenCalled();
      });
    });
  });

  // ────────────── Product Code Selection ──────────────

  describe('Product Code Selection', () => {
    beforeEach(() => {
      initComponent();
      component.unitData.set(mockMultiComponentUnit as any);
      component.phase.set('unit-validated');
    });

    describe('onRow1ProductCodeChanged', () => {
      it('should set selected component and process label when match found', () => {
        serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));
        const option: ScanSelectOption = { code: 'E0280', description: 'Red Blood Cells' };

        component.onRow1ProductCodeChanged(option);

        expect(component.selectedComponent()).toEqual(mockComponent);
        expect(serviceSpy.processLabel).toHaveBeenCalled();
      });

      it('should not do anything when option is null', () => {
        component.onRow1ProductCodeChanged(null);
        expect(serviceSpy.processLabel).not.toHaveBeenCalled();
      });

      it('should not set selected component when no match found', () => {
        const option: ScanSelectOption = { code: 'NONEXISTENT', description: 'Unknown' };

        component.onRow1ProductCodeChanged(option);

        expect(serviceSpy.processLabel).not.toHaveBeenCalled();
      });

      it('should match product codes case-insensitively', () => {
        serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));
        const option: ScanSelectOption = { code: 'e0280', description: 'Red Blood Cells' };

        component.onRow1ProductCodeChanged(option);

        expect(component.selectedComponent()).toEqual(mockComponent);
      });
    });

    describe('onProductCodeChange', () => {
      it('should set selected component and call processLabel', () => {
        serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));

        component.onProductCodeChange(mockComponent2);

        expect(component.selectedComponent()).toEqual(mockComponent2);
        expect(serviceSpy.processLabel).toHaveBeenCalled();
      });
    });
  });

  // ────────────── Process Label ──────────────

  describe('Process Label', () => {
    beforeEach(() => {
      initComponent();
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockComponent);
      component.phase.set('unit-validated');
    });

    it('should process label successfully and set phase to labeled', fakeAsync(() => {
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));

      (component as any).proceedToProcessLabel();
      tick();

      expect(component.labelResult()).toEqual(mockLabelResult as any);
      expect(component.phase()).toBe('labeled');
      expect(component.doLabelCalled()).toBeTrue();
      expect(component.loading()).toBeFalse();
    }));

    it('should not process when unitData is null', () => {
      component.unitData.set(null);

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.processLabel).not.toHaveBeenCalled();
    });

    it('should not process when selectedComponent is null', () => {
      component.selectedComponent.set(null);

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.processLabel).not.toHaveBeenCalled();
    });

    it('should prevent concurrent label processing', () => {
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));

      (component as any).processingLabel = true;
      (component as any).proceedToProcessLabel();

      expect(serviceSpy.processLabel).not.toHaveBeenCalled();
    });

    it('should build request with overrides when present', () => {
      component.processLabelOverrides.set(['WARN01', 'WARN02']);
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));

      (component as any).proceedToProcessLabel();

      const request = serviceSpy.processLabel.calls.mostRecent().args[0];
      expect(request.overrides).toEqual(['WARN01', 'WARN02']);
    });

    it('should send null overrides when empty', () => {
      component.processLabelOverrides.set([]);
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));

      (component as any).proceedToProcessLabel();

      const request = serviceSpy.processLabel.calls.mostRecent().args[0];
      expect(request.overrides).toBeNull();
    });

    it('should show warning dialog when isWarning is true', () => {
      const warningResult = {
        ...mockLabelResult,
        isWarning: true,
        warningCode: 'W001',
        warningMessage: 'Product expired',
      };
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(warningResult)));

      (component as any).proceedToProcessLabel();

      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should retry processLabel with override codes when warning is overridden', () => {
      const warningResult = {
        ...mockLabelResult,
        isWarning: true,
        warningCode: 'W001',
        warningMessage: 'Product expired',
      };
      serviceSpy.processLabel.and.returnValues(
        of(apiSuccess(warningResult)),
        of(apiSuccess(mockLabelResult)),
      );
      dialogRefSpy.afterClosed.and.returnValue(of({ override: true, codes: ['W001'] }));

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.processLabel).toHaveBeenCalledTimes(2);
      expect(component.processLabelOverrides()).toContain('W001');
    });

    it('should not retry when warning is cancelled', () => {
      const warningResult = {
        ...mockLabelResult,
        isWarning: true,
        warningCode: 'W001',
        warningMessage: 'Product expired',
      };
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(warningResult)));
      dialogRefSpy.afterClosed.and.returnValue(of({ override: false, codes: [] }));

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.processLabel).toHaveBeenCalledTimes(1);
    });

    it('should show error for DU product type', () => {
      const duResult = { ...mockLabelResult, isWarning: false, productType: 'DU01' };
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(duResult)));

      (component as any).proceedToProcessLabel();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        '1527: This product type cannot be labeled through this screen.',
      );
      expect(component.phase()).not.toBe('labeled');
    });

    it('should handle processLabel error', () => {
      serviceSpy.processLabel.and.returnValue(throwError(() => new Error('API error')));

      (component as any).proceedToProcessLabel();

      expect(component.loading()).toBeFalse();
    });

    it('should not set phase when response is unsuccessful', () => {
      serviceSpy.processLabel.and.returnValue(of({ success: false }));

      (component as any).proceedToProcessLabel();

      expect(component.phase()).not.toBe('labeled');
    });

    it('should load LOV data after successful label processing', () => {
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.getLovAboValues).toHaveBeenCalledWith('I');
    });

    it('should load special test codes when specialTestingCode is set', () => {
      const resultWithSpTest = { ...mockLabelResult, specialTestingCode: 'CMV' };
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(resultWithSpTest)));

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.getLovSpecialTestCodes).toHaveBeenCalled();
    });

    it('should not load special test codes when specialTestingCode is null', () => {
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(mockLabelResult)));
      serviceSpy.getLovSpecialTestCodes.calls.reset();

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.getLovSpecialTestCodes).not.toHaveBeenCalled();
    });
  });

  // ────────────── LOV Data Loading ──────────────

  describe('LOV Data Loading', () => {
    beforeEach(() => {
      initComponent();
      component.unitCodeScheme.set('I');
    });

    it('should map ABO values to ScanSelectOptions using aboLabel and aboShortName', () => {
      component.labelResult.set(mockLabelResult as any);
      serviceSpy.getLovAboValues.and.returnValue(of(apiSuccess([
        { aboLabel: 'OP', aboShortName: 'O Pos' },
        { code: 'AN', description: 'A Neg' },
      ])));

      (component as any).loadLovData();

      expect(component.aboLovOptions()).toEqual([
        { code: 'OP', description: 'O Pos' },
        { code: 'AN', description: 'A Neg' },
      ]);
    });

    it('should show error on ABO LOV load failure', () => {
      component.labelResult.set(mockLabelResult as any);
      serviceSpy.getLovAboValues.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadLovData();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load ABO values');
    });

    it('should map special test codes using code and codeDescription', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'CMV' } as any);
      serviceSpy.getLovSpecialTestCodes.and.returnValue(of(apiSuccess([
        { code: 'CMV', codeDescription: 'CMV Neg' },
        { code: 'HBS', description: 'HBsAg' },
      ])));

      (component as any).loadLovData();

      expect(component.specialTestLovOptions()).toEqual([
        { code: 'CMV', description: 'CMV Neg' },
        { code: 'HBS', description: 'HBsAg' },
      ]);
    });

    it('should show error on special test LOV load failure', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'CMV' } as any);
      serviceSpy.getLovSpecialTestCodes.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadLovData();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load special test codes');
    });
  });

  // ────────────── Enable/Disable Verification Fields ──────────────

  describe('enableVerificationFields', () => {
    beforeEach(() => initComponent());

    it('should enable all fields then selectively disable based on label', () => {
      component.labelResult.set(mockLabelResult as any);

      (component as any).enableVerificationFields();

      expect(component.verificationForm.get('scanUnitId')?.enabled).toBeTrue();
      expect(component.verificationForm.get('scanAbo')?.enabled).toBeTrue();
      expect(component.verificationForm.get('scanProductCode')?.enabled).toBeTrue();
      // Non-Mf flow should disable scanCollDate and colldate
      expect(component.verificationForm.get('scanCollDate')?.disabled).toBeTrue();
      expect(component.verificationForm.get('colldate')?.disabled).toBeTrue();
    });

    it('should disable scanSpecialTest when specialTestingCode is null', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: null } as any);

      (component as any).enableVerificationFields();

      expect(component.verificationForm.get('scanSpecialTest')?.disabled).toBeTrue();
    });

    it.each(['Mq', 'Mf', 'Mb', 'Md'])(
      'should disable scanSpecialTest for labelDecision %s',
      (decision) => {
        component.labelResult.set({
          ...mockLabelResult,
          labelDecision: decision,
          specialTestingCode: 'CMV',
        } as any);

        (component as any).enableVerificationFields();

        expect(component.verificationForm.get('scanSpecialTest')?.disabled).toBeTrue();
      },
    );

    it('should enable scanSpecialTest when specialTestingCode exists and label is not special', () => {
      component.labelResult.set({
        ...mockLabelResult,
        labelDecision: 'OP',
        specialTestingCode: 'CMV',
      } as any);

      (component as any).enableVerificationFields();

      expect(component.verificationForm.get('scanSpecialTest')?.enabled).toBeTrue();
    });

    it('should disable scanExpDate and scanProdExp for Mf/RPL flow', () => {
      component.labelResult.set({
        ...mockLabelResult,
        labelDecision: 'Mf',
        productType: 'RBC',
      } as any);

      (component as any).enableVerificationFields();

      expect(component.verificationForm.get('scanExpDate')?.disabled).toBeTrue();
      expect(component.verificationForm.get('scanProdExp')?.disabled).toBeTrue();
      expect(component.verificationForm.get('scanCollDate')?.enabled).toBeTrue();
      expect(component.verificationForm.get('colldate')?.enabled).toBeTrue();
    });
  });

  // ────────────── Reprint ──────────────

  describe('onReprint', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    it('should reprint successfully', () => {
      serviceSpy.reprint.and.returnValue(of({ success: true }));

      component.onReprint();

      expect(serviceSpy.reprint).toHaveBeenCalledWith(jasmine.objectContaining({
        unitId: 'W123456789012',
        productCode: 'E0280',
        componentPrefix: '01',
        labelDecision: 'OP',
      }));
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Label reprinted successfully.');
      expect(component.loading()).toBeFalse();
    });

    it('should show error when verification is in progress', () => {
      component.verificationForm.patchValue({ scanUnitId: 'W123' });

      component.onReprint();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        '5308: Cannot reprint while verification is in progress.',
      );
      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should not reprint when unitData is null', () => {
      component.unitData.set(null);

      component.onReprint();

      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should not reprint when selectedComponent is null', () => {
      component.selectedComponent.set(null);

      component.onReprint();

      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should not reprint when labelResult is null', () => {
      component.labelResult.set(null);

      component.onReprint();

      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should handle reprint error', () => {
      serviceSpy.reprint.and.returnValue(throwError(() => new Error('Reprint failed')));

      component.onReprint();

      expect(component.loading()).toBeFalse();
    });

    it('should not show success when reprint response is unsuccessful', () => {
      serviceSpy.reprint.and.returnValue(of({ success: false }));

      component.onReprint();

      expect(snackbarSpy.showSuccess).not.toHaveBeenCalled();
    });
  });

  // ────────────── Verify Unit ID ──────────────

  describe('Phase 2: Verify Unit ID', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    describe('onVerifyUnitPostValidate', () => {
      it('should confirm when unit IDs match', () => {
        const event = makePostValidateEvent('W123456789012');

        component.onVerifyUnitPostValidate(event);

        expect(event.confirm).toHaveBeenCalled();
        expect(component.verifyParsedUnitId()).toBe('W123456789012');
      });

      it('should reject when unit IDs do not match', () => {
        const event = makePostValidateEvent('W999999999999');

        component.onVerifyUnitPostValidate(event);

        expect(event.reject).toHaveBeenCalledWith('Unit ID does not match (Error 1508).');
        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '1508: This unit ID must be same as the original unit ID',
        );
      });

      it('should match case-insensitively', () => {
        component.phase1ParsedUnitId.set('w123456789012');
        const event = makePostValidateEvent('W123456789012');

        component.onVerifyUnitPostValidate(event);

        expect(event.confirm).toHaveBeenCalled();
      });

      it('should patch form with manual unit ID', () => {
        const event = makePostValidateEvent('W123456789012');
        event.data.manualUnitId = 'W123456789012-MANUAL';

        component.onVerifyUnitPostValidate(event);

        expect(component.verificationForm.get('scanUnitId')?.value).toBe('W123456789012-MANUAL');
      });

      it('should confirm when scanned unit ID is empty', () => {
        const event = makePostValidateEvent('');

        component.onVerifyUnitPostValidate(event);

        expect(event.confirm).toHaveBeenCalled();
      });
    });

    describe('onVerifyUnitCleared', () => {
      it('should clear scanUnitId form value and field error', () => {
        component.verificationForm.patchValue({ scanUnitId: 'W123' });
        component.fieldErrors['scanUnitId'] = 'some error';

        component.onVerifyUnitCleared();

        expect(component.verificationForm.get('scanUnitId')?.value).toBe('');
      });
    });
  });

  // ────────────── ABO / Special Test Field Changes ──────────────

  describe('Field Change Handlers', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    describe('onAboFieldChanged', () => {
      it('should patch form with ABO code when option provided', () => {
        const option: ScanSelectOption = { code: 'OP', description: 'O Pos' };

        component.onAboFieldChanged(option);

        expect(component.verificationForm.getRawValue().scanAbo).toBe('OP');
        expect(component.scannedAboDescription()).toBe('O Pos');
      });

      it('should clear scanAbo when option is null', () => {
        component.onAboFieldChanged(null);

        expect(component.verificationForm.getRawValue().scanAbo).toBe('');
        expect(component.scannedAboDescription()).toBe('');
      });

      it('should show error when ABO does not match label decision', () => {
        component.aboField = { setError: jasmine.createSpy('setError') } as any;
        const option: ScanSelectOption = { code: 'AN', description: 'A Neg' };

        component.onAboFieldChanged(option);

        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '1509: ABO label must be same as system label decision',
        );
        expect(component.aboField.setError).toHaveBeenCalled();
        expect(component.scannedAboDescription()).toBe('');
      });

      it('should not error when ABO matches label decision case-insensitively', () => {
        const option: ScanSelectOption = { code: 'op', description: 'O Pos' };

        component.onAboFieldChanged(option);

        expect(snackbarSpy.showError).not.toHaveBeenCalled();
      });
    });

    describe('onAboFieldCleared', () => {
      it('should clear scanAbo form value and description', () => {
        component.verificationForm.patchValue({ scanAbo: 'OP' });
        component.scannedAboDescription.set('O Pos');

        component.onAboFieldCleared();

        expect(component.verificationForm.getRawValue().scanAbo).toBe('');
        expect(component.scannedAboDescription()).toBe('');
      });
    });

    describe('onSpecialTestFieldChanged', () => {
      beforeEach(() => {
        setupLabeledPhase({ specialTestingCode: 'CMV' });
      });

      it('should patch form with special test code', () => {
        const option: ScanSelectOption = { code: 'CMV', description: 'CMV Neg' };

        component.onSpecialTestFieldChanged(option);

        expect(component.verificationForm.getRawValue().scanSpecialTest).toBe('CMV');
      });

      it('should clear when option is null', () => {
        component.onSpecialTestFieldChanged(null);

        expect(component.verificationForm.getRawValue().scanSpecialTest).toBe('');
      });

      it('should show error when code does not match', () => {
        component.specialTestField = { setError: jasmine.createSpy('setError') } as any;
        const option: ScanSelectOption = { code: 'HBS', description: 'HBsAg' };

        component.onSpecialTestFieldChanged(option);

        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '4300: Invalid Special Testing Code',
        );
        expect(component.specialTestField.setError).toHaveBeenCalledWith('Invalid Special Testing Code');
      });
    });

    describe('onSpecialTestFieldCleared', () => {
      it('should clear scanSpecialTest form value', () => {
        component.verificationForm.patchValue({ scanSpecialTest: 'CMV' });

        component.onSpecialTestFieldCleared();

        expect(component.verificationForm.getRawValue().scanSpecialTest).toBe('');
      });
    });
  });

  // ────────────── Scan Blur Handlers ──────────────

  describe('Scan Blur Handlers', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    describe('onScanUnitAboBlur', () => {
      it('should return early when scanUnitAbo is empty', () => {
        component.verificationForm.patchValue({ scanUnitAbo: '' });

        component.onScanUnitAboBlur();

        expect(labelScanSpy.validateUnitAboScan).not.toHaveBeenCalled();
      });

      it('should validate and patch form on success with matching values', () => {
        component.verificationForm.patchValue({ scanUnitAbo: '=W123456789012OP' });
        component.verifyUnitIdField = { setValue: jasmine.createSpy('setValue') } as any;
        component.aboField = { setValue: jasmine.createSpy('setValue') } as any;
        labelScanSpy.validateUnitAboScan.and.returnValue(of({
          success: true,
          item: {
            parsedUnitId: 'W123456789012',
            aboCode: 'OP',
            manualUnitId: 'W123456789012',
            aboDescription: 'O Positive',
          },
        }));

        component.onScanUnitAboBlur();

        expect(component.verificationForm.getRawValue().scanUnitId).toBe('W123456789012');
        expect(component.verificationForm.getRawValue().scanAbo).toBe('OP');
        expect(component.scannedAboDescription()).toBe('O Positive');
        expect(component.fieldProcessing['scanUnitAbo']).toBeFalse();
      });

      it('should show error 1508 when unit ID does not match', () => {
        component.verificationForm.patchValue({ scanUnitAbo: '=W999999999999OP' });
        component.verifyUnitIdField = { setValue: jasmine.createSpy('setValue') } as any;
        component.aboField = { setValue: jasmine.createSpy('setValue') } as any;
        labelScanSpy.validateUnitAboScan.and.returnValue(of({
          success: true,
          item: {
            parsedUnitId: 'W999999999999',
            aboCode: 'OP',
            manualUnitId: 'W999999999999',
          },
        }));

        component.onScanUnitAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '1508: This unit ID must be same as the original unit ID',
        );
      });

      it('should show error 1509 when ABO does not match', () => {
        component.verificationForm.patchValue({ scanUnitAbo: '=W123456789012AN' });
        component.verifyUnitIdField = { setValue: jasmine.createSpy('setValue') } as any;
        component.aboField = { setValue: jasmine.createSpy('setValue') } as any;
        labelScanSpy.validateUnitAboScan.and.returnValue(of({
          success: true,
          item: {
            parsedUnitId: 'W123456789012',
            aboCode: 'AN',
            manualUnitId: 'W123456789012',
          },
        }));

        component.onScanUnitAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '1509: ABO label must be same as system label decision',
        );
      });

      it('should show error on validation failure', () => {
        component.verificationForm.patchValue({ scanUnitAbo: 'INVALID' });
        labelScanSpy.validateUnitAboScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '6040', error: 'Invalid scan' },
        }));

        component.onScanUnitAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith('6040: Invalid scan');
      });

      it('should use default error code on validation failure without errorResponse', () => {
        component.verificationForm.patchValue({ scanUnitAbo: 'INVALID' });
        labelScanSpy.validateUnitAboScan.and.returnValue(of({
          success: false,
          message: 'Bad scan',
        }));

        component.onScanUnitAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith('6040: Bad scan');
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanUnitAbo: 'SCAN' });
        labelScanSpy.validateUnitAboScan.and.returnValue(throwError(() => new Error('err')));

        component.onScanUnitAboBlur();

        expect(component.fieldProcessing['scanUnitAbo']).toBeFalse();
      });
    });

    describe('onScanUnitIdBlur', () => {
      it('should return early when scanUnitId is empty', () => {
        component.verificationForm.patchValue({ scanUnitId: '' });

        component.onScanUnitIdBlur();

        expect(labelScanSpy.validateUnitScan).not.toHaveBeenCalled();
      });

      it('should validate and patch form on success', () => {
        component.verificationForm.patchValue({ scanUnitId: 'W123456789012' });
        labelScanSpy.validateUnitScan.and.returnValue(of({
          success: true,
          item: { parsedUnitId: 'W123456789012', manualUnitId: 'W123456789012' },
        }));

        component.onScanUnitIdBlur();

        expect(component.verifyParsedUnitId()).toBe('W123456789012');
        expect(component.fieldProcessing['scanUnitId']).toBeFalse();
      });

      it('should use scanValue as fallback when parsedUnitId is empty', () => {
        component.verificationForm.patchValue({ scanUnitId: 'W123456789012' });
        labelScanSpy.validateUnitScan.and.returnValue(of({
          success: true,
          item: { parsedUnitId: '', manualUnitId: '' },
        }));

        component.onScanUnitIdBlur();

        expect(component.verificationForm.getRawValue().scanUnitId).toBe('W123456789012');
      });

      it('should show error 1508 on unit ID mismatch', () => {
        component.verificationForm.patchValue({ scanUnitId: 'W999999999999' });
        labelScanSpy.validateUnitScan.and.returnValue(of({
          success: true,
          item: { parsedUnitId: 'W999999999999' },
        }));

        component.onScanUnitIdBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '1508: This unit ID must be same as the original unit ID',
        );
      });

      it('should show error on validation failure', () => {
        component.verificationForm.patchValue({ scanUnitId: 'INVALID' });
        labelScanSpy.validateUnitScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '1230', error: 'Invalid unit' },
        }));

        component.onScanUnitIdBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith('1230: Invalid unit');
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanUnitId: 'SCAN' });
        labelScanSpy.validateUnitScan.and.returnValue(throwError(() => new Error('err')));

        component.onScanUnitIdBlur();

        expect(component.fieldProcessing['scanUnitId']).toBeFalse();
      });
    });

    describe('onScanAboBlur', () => {
      it('should return early when scanAbo is empty', () => {
        component.verificationForm.patchValue({ scanAbo: '' });

        component.onScanAboBlur();

        expect(labelScanSpy.validateAboScan).not.toHaveBeenCalled();
      });

      it('should validate and patch form on success', () => {
        component.verificationForm.patchValue({ scanAbo: 'OP' });
        labelScanSpy.validateAboScan.and.returnValue(of({
          success: true,
          item: { aboCode: 'OP', aboShortName: 'O Pos' },
        }));

        component.onScanAboBlur();

        expect(component.verificationForm.getRawValue().scanAbo).toBe('OP');
        expect(component.scannedAboDescription()).toBe('O Pos');
      });

      it('should show error 1509 on ABO mismatch', () => {
        component.verificationForm.patchValue({ scanAbo: 'AN' });
        labelScanSpy.validateAboScan.and.returnValue(of({
          success: true,
          item: { aboCode: 'AN', aboShortName: 'A Neg' },
        }));

        component.onScanAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '1509: ABO label must be same as system label decision',
        );
      });

      it('should show error on validation failure', () => {
        component.verificationForm.patchValue({ scanAbo: 'XX' });
        labelScanSpy.validateAboScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '6010', error: 'Invalid ABO' },
        }));

        component.onScanAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith('6010: Invalid ABO');
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanAbo: 'X' });
        labelScanSpy.validateAboScan.and.returnValue(throwError(() => new Error('err')));

        component.onScanAboBlur();

        expect(component.fieldProcessing['scanAbo']).toBeFalse();
      });
    });

    describe('onScanProdExpBlur', () => {
      it('should return early when scanProdExp is empty', () => {
        component.verificationForm.patchValue({ scanProdExp: '' });

        component.onScanProdExpBlur();

        expect(labelScanSpy.validateProductExpiryScan).not.toHaveBeenCalled();
      });

      it('should validate and patch form on success', () => {
        component.verificationForm.patchValue({ scanProdExp: '=E028020260701' });
        labelScanSpy.validateProductExpiryScan.and.returnValue(of({
          success: true,
          item: { productCode: 'E0280', expiryDate: '2026-07-01T23:59:00' },
        }));

        component.onScanProdExpBlur();

        expect(component.verificationForm.getRawValue().scanProductCode).toBe('E0280');
        expect(component.verificationForm.getRawValue().scanProdExp).toBe('');
      });

      it('should show error 9728 on product code mismatch', () => {
        component.verificationForm.patchValue({ scanProdExp: '=E029020260701' });
        labelScanSpy.validateProductExpiryScan.and.returnValue(of({
          success: true,
          item: { productCode: 'E0290', expiryDate: '2026-07-01T23:59:00' },
        }));

        component.onScanProdExpBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '9728: Product verification failed, mismatch in product codes',
        );
      });

      it('should show error on validation failure', () => {
        component.verificationForm.patchValue({ scanProdExp: 'INVALID' });
        labelScanSpy.validateProductExpiryScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '9710', error: 'Invalid scan' },
        }));

        component.onScanProdExpBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith('9710: Invalid scan');
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanProdExp: 'SCAN' });
        labelScanSpy.validateProductExpiryScan.and.returnValue(throwError(() => new Error('err')));

        component.onScanProdExpBlur();

        expect(component.fieldProcessing['scanProdExp']).toBeFalse();
      });
    });

    describe('onScanProductCodeBlur', () => {
      it('should return early when scanProductCode is empty', () => {
        component.verificationForm.patchValue({ scanProductCode: '' });

        component.onScanProductCodeBlur();

        expect(labelScanSpy.validateProductScan).not.toHaveBeenCalled();
      });

      it('should validate and patch form on success', () => {
        component.verificationForm.patchValue({ scanProductCode: 'E0280' });
        labelScanSpy.validateProductScan.and.returnValue(of({
          success: true,
          item: { productCode: 'E0280', productDescription: 'RBC' },
        }));

        component.onScanProductCodeBlur();

        expect(component.verificationForm.getRawValue().scanProductCode).toBe('E0280');
        expect(component.fieldProcessing['scanProductCode']).toBeFalse();
      });

      it('should show error 9728 on product code mismatch', () => {
        component.verificationForm.patchValue({ scanProductCode: 'E0999' });
        labelScanSpy.validateProductScan.and.returnValue(of({
          success: true,
          item: { productCode: 'E0999' },
        }));

        component.onScanProductCodeBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '9728: Product verification failed, mismatch in product codes',
        );
      });

      it('should use selectedComponent productCode when labelProductCode is null', () => {
        component.labelResult.set({ ...mockLabelResult, labelProductCode: null } as any);
        component.verificationForm.patchValue({ scanProductCode: 'E0280' });
        labelScanSpy.validateProductScan.and.returnValue(of({
          success: true,
          item: { productCode: 'E0280' },
        }));

        component.onScanProductCodeBlur();

        expect(snackbarSpy.showError).not.toHaveBeenCalled();
      });

      it('should show error on validation failure', () => {
        component.verificationForm.patchValue({ scanProductCode: 'XX' });
        labelScanSpy.validateProductScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '6035', error: 'Bad code' },
        }));

        component.onScanProductCodeBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith('6035: Bad code');
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanProductCode: 'X' });
        labelScanSpy.validateProductScan.and.returnValue(throwError(() => new Error('err')));

        component.onScanProductCodeBlur();

        expect(component.fieldProcessing['scanProductCode']).toBeFalse();
      });
    });

    describe('onScanExpDateBlur', () => {
      it('should return early when scanExpDate is empty', () => {
        component.verificationForm.patchValue({ scanExpDate: '' });

        component.onScanExpDateBlur();

        expect(labelScanSpy.validateExpiryScan).not.toHaveBeenCalled();
      });

      it('should validate and patch form on success', () => {
        component.verificationForm.patchValue({ scanExpDate: '20260701' });
        labelScanSpy.validateExpiryScan.and.returnValue(of({
          success: true,
          item: { expiryDate: '2026-07-01T23:59:00' },
        }));

        component.onScanExpDateBlur();

        expect(component.verificationForm.getRawValue().scanExpDate).toBeTruthy();
        expect(component.fieldProcessing['scanExpDate']).toBeFalse();
      });

      it('should show error on validation failure', () => {
        component.verificationForm.patchValue({ scanExpDate: 'BAD' });
        labelScanSpy.validateExpiryScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '6030', error: 'Invalid date' },
        }));

        component.onScanExpDateBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith('6030: Invalid date');
      });

      it('should show error when expiryDate is null in success response', () => {
        component.verificationForm.patchValue({ scanExpDate: '20260701' });
        labelScanSpy.validateExpiryScan.and.returnValue(of({
          success: true,
          item: { expiryDate: null },
        }));

        component.onScanExpDateBlur();

        expect(snackbarSpy.showError).toHaveBeenCalled();
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanExpDate: 'X' });
        labelScanSpy.validateExpiryScan.and.returnValue(throwError(() => new Error('err')));

        component.onScanExpDateBlur();

        expect(component.fieldProcessing['scanExpDate']).toBeFalse();
      });
    });

    describe('onScanCollDateBlur', () => {
      beforeEach(() => {
        setupLabeledPhase({ labelDecision: 'Mf', productType: 'RBC' });
      });

      it('should return early when scanCollDate is empty', () => {
        component.verificationForm.patchValue({ scanCollDate: '' });

        component.onScanCollDateBlur();

        expect(labelScanSpy.validateExpiryScan).not.toHaveBeenCalled();
      });

      it('should validate and patch form on success', () => {
        component.verificationForm.patchValue({ scanCollDate: '20260115' });
        labelScanSpy.validateExpiryScan.and.returnValue(of({
          success: true,
          item: { expiryDate: '2026-01-15T00:00:00' },
        }));

        component.onScanCollDateBlur();

        expect(component.verificationForm.getRawValue().scanCollDate).toBe('');
        expect(component.verificationForm.getRawValue().colldate).toBeTruthy();
      });

      it('should show error on validation failure', () => {
        component.verificationForm.patchValue({ scanCollDate: 'BAD' });
        labelScanSpy.validateExpiryScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '1210', error: 'Invalid date' },
        }));

        component.onScanCollDateBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith('1210: Invalid date');
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanCollDate: 'X' });
        labelScanSpy.validateExpiryScan.and.returnValue(throwError(() => new Error('err')));

        component.onScanCollDateBlur();

        expect(component.fieldProcessing['scanCollDate']).toBeFalse();
      });
    });

    describe('onCollDateBlur', () => {
      beforeEach(() => {
        setupLabeledPhase({ labelDecision: 'Mf', productType: 'RBC' });
        component.unitData.set({ ...mockUnitData, collDate: '2026-01-15T00:00:00' } as any);
      });

      it('should return early when colldate is empty', () => {
        component.verificationForm.patchValue({ colldate: '' });

        component.onCollDateBlur();

        expect(snackbarSpy.showError).not.toHaveBeenCalled();
      });

      it('should pass when collection date matches', () => {
        component.verificationForm.patchValue({ colldate: '15-JAN-2026' });

        component.onCollDateBlur();

        expect(snackbarSpy.showError).not.toHaveBeenCalled();
      });

      it('should show error 1145 when collection date does not match', () => {
        component.verificationForm.patchValue({ colldate: '20-FEB-2026' });

        component.onCollDateBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '1145: Collection date does not match',
        );
      });
    });

    describe('onScanSpecialTestBlur', () => {
      beforeEach(() => {
        setupLabeledPhase({ specialTestingCode: 'CMV' });
      });

      it('should return early when scanSpecialTest is empty', () => {
        component.verificationForm.patchValue({ scanSpecialTest: '' });

        component.onScanSpecialTestBlur();

        expect(labelScanSpy.validateSpTestScan).not.toHaveBeenCalled();
      });

      it('should validate and patch form on success', () => {
        component.verificationForm.patchValue({ scanSpecialTest: 'CMV' });
        labelScanSpy.validateSpTestScan.and.returnValue(of({
          success: true,
          item: { spTestCode: 'CMV', description: 'CMV Negative' },
        }));

        component.onScanSpecialTestBlur();

        expect(component.verificationForm.getRawValue().scanSpecialTest).toBe('CMV');
      });

      it('should show error 4300 on mismatch', () => {
        component.verificationForm.patchValue({ scanSpecialTest: 'HBS' });
        labelScanSpy.validateSpTestScan.and.returnValue(of({
          success: true,
          item: { spTestCode: 'HBS', description: 'HBsAg' },
        }));

        component.onScanSpecialTestBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(
          '4300: Invalid Special Testing Code',
        );
      });

      it('should show error on validation failure', () => {
        component.verificationForm.patchValue({ scanSpecialTest: 'XX' });
        labelScanSpy.validateSpTestScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '4327', error: 'Bad code' },
        }));

        component.onScanSpecialTestBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith('4327: Bad code');
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanSpecialTest: 'X' });
        labelScanSpy.validateSpTestScan.and.returnValue(throwError(() => new Error('err')));

        component.onScanSpecialTestBlur();

        expect(component.fieldProcessing['scanSpecialTest']).toBeFalse();
      });
    });
  });

  // ────────────── onAutoScan ──────────────

  describe('onAutoScan', () => {
    beforeEach(() => initComponent());

    it('should blur input when value matches scan pattern', () => {
      const blurSpy = jasmine.createSpy('blur');
      const event = { target: { value: '=W12345678901234', blur: blurSpy } } as any;
      const patterns = [{ prefix: '=', length: [16, 17] }];

      component.onAutoScan(event, patterns);

      expect(blurSpy).toHaveBeenCalled();
    });

    it('should not blur when value does not match scan pattern', () => {
      const blurSpy = jasmine.createSpy('blur');
      const event = { target: { value: 'AB', blur: blurSpy } } as any;
      const patterns = [{ prefix: '=', length: [16, 17] }];

      component.onAutoScan(event, patterns);

      expect(blurSpy).not.toHaveBeenCalled();
    });
  });

  // ────────────── tryAutoVerify ──────────────

  describe('tryAutoVerify', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    it('should not verify when any field is still processing', () => {
      component.fieldProcessing = { scanAbo: true };
      component.verificationForm.patchValue({
        scanUnitId: 'W123456789012',
        scanAbo: 'OP',
        scanProductCode: 'E0280',
        scanExpDate: '01-JUL-2026 23:59',
      });

      (component as any).tryAutoVerify();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should not proceed when unitId is missing', () => {
      component.verificationForm.patchValue({
        scanUnitId: '',
        scanAbo: 'OP',
        scanProductCode: 'E0280',
      });

      (component as any).tryAutoVerify();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should not proceed when ABO is missing', () => {
      component.verificationForm.patchValue({
        scanUnitId: 'W123456789012',
        scanAbo: '',
        scanProductCode: 'E0280',
      });

      (component as any).tryAutoVerify();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should not proceed when product code is missing', () => {
      component.verificationForm.patchValue({
        scanUnitId: 'W123456789012',
        scanAbo: 'OP',
        scanProductCode: '',
      });

      (component as any).tryAutoVerify();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should not proceed when labelResult is null', () => {
      component.labelResult.set(null);
      component.verificationForm.patchValue({
        scanUnitId: 'W123456789012',
        scanAbo: 'OP',
        scanProductCode: 'E0280',
      });

      (component as any).tryAutoVerify();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should require expDate for non-Mf flow when expiryDate exists', () => {
      component.verificationForm.patchValue({
        scanUnitId: 'W123456789012',
        scanAbo: 'OP',
        scanProductCode: 'E0280',
        scanExpDate: '',
      });

      (component as any).tryAutoVerify();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should require colldate for Mf/RPL flow', () => {
      setupLabeledPhase({ labelDecision: 'Mf', productType: 'RBC' });
      component.verificationForm.patchValue({
        scanUnitId: 'W123456789012',
        scanAbo: 'OP',
        scanProductCode: 'E0280',
        colldate: '',
      });

      (component as any).tryAutoVerify();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should require specialTest when specialTestingCode is set', () => {
      setupLabeledPhase({ specialTestingCode: 'CMV' });
      component.verificationForm.patchValue({
        scanUnitId: 'W123456789012',
        scanAbo: 'OP',
        scanProductCode: 'E0280',
        scanExpDate: '01-JUL-2026 23:59',
        scanSpecialTest: '',
      });

      (component as any).tryAutoVerify();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });
  });

  // ────────────── doVerificationComparison ──────────────

  describe('doVerificationComparison', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    function fillVerificationForm(overrides: Record<string, string> = {}): void {
      const defaults: Record<string, string> = {
        scanUnitId: 'W123456789012',
        scanAbo: 'OP',
        scanProductCode: 'E0280',
        scanExpDate: '01-JUL-2026 23:59',
      };
      component.verificationForm.patchValue({ ...defaults, ...overrides });
      component.verifyParsedUnitId.set(overrides['scanUnitId'] || 'W123456789012');
    }

    it('should show error 1508 when unit ID mismatches', () => {
      fillVerificationForm();
      component.verifyParsedUnitId.set('W999999999999');

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        '1508: This unit ID must be same as the original unit ID',
      );
    });

    it('should show error 1509 when ABO mismatches', () => {
      fillVerificationForm({ scanAbo: 'AN' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        '1509: ABO label must be same as system label decision',
      );
    });

    it('should show error 9728 when product code mismatches', () => {
      fillVerificationForm({ scanProductCode: 'E9999' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        '9728: Product verification failed, mismatch in product codes',
      );
    });

    it('should show error 1170 when expiry date mismatches (non-Mf flow)', () => {
      fillVerificationForm({ scanExpDate: '15-FEB-2027' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        '1170: Invalid expiration date',
      );
    });

    it('should show error 1170 when expiry date is missing (non-Mf flow)', () => {
      fillVerificationForm({ scanExpDate: '' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        '1170: Invalid expiration date',
      );
    });

    it('should show error 1145 when coll date mismatches (Mf flow)', () => {
      setupLabeledPhase({ labelDecision: 'Mf', productType: 'RBC', expiryDate: null });
      fillVerificationForm({ scanAbo: 'Mf' });
      component.verificationForm.patchValue({ colldate: '20-FEB-2099' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        '1145: Collection date does not match',
      );
    });

    it('should show error 1145 when coll date is empty (Mf flow)', () => {
      setupLabeledPhase({ labelDecision: 'Mf', productType: 'RBC', expiryDate: null });
      fillVerificationForm({ scanAbo: 'Mf' });
      component.verificationForm.patchValue({ colldate: '' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        '1145: Collection date does not match',
      );
    });

    it('should show error 4300 when special test code mismatches', () => {
      setupLabeledPhase({ specialTestingCode: 'CMV' });
      fillVerificationForm();
      component.verificationForm.patchValue({ scanSpecialTest: 'HBS' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        '4300: Invalid Special Testing Code',
      );
    });

    it('should handle double scan requirement on first scan', () => {
      setupLabeledPhase({ doubleScanReqd: true });
      fillVerificationForm();
      component.isSecondScan.set(false);

      (component as any).doVerificationComparison();

      expect(component.isSecondScan()).toBeTrue();
      expect(component.firstScanCompleted()).toBeTrue();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        'First label verified. Scan SECOND label now.',
      );
    });

    it('should proceed to confirmVerification on second scan when double scan required', () => {
      setupLabeledPhase({ doubleScanReqd: true });
      fillVerificationForm();
      component.isSecondScan.set(true);
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });

    it('should proceed to confirmVerification when all values match and no double scan', () => {
      fillVerificationForm();
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });

    it('should not proceed when unitData is null', () => {
      component.unitData.set(null);
      fillVerificationForm();

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should not proceed when labelResult is null', () => {
      component.labelResult.set(null);
      fillVerificationForm();

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should skip expiry check when expiryDate is null on non-Mf flow', () => {
      setupLabeledPhase({ expiryDate: null });
      fillVerificationForm();
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });

    it('should use verifyParsedUnitId for comparison when available', () => {
      fillVerificationForm();
      component.verifyParsedUnitId.set('');
      component.verificationForm.patchValue({ scanUnitId: 'W123456789012' });

      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });

    it('should use selectedComponent productCode when labelProductCode is null', () => {
      setupLabeledPhase({ labelProductCode: null });
      fillVerificationForm();
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });

    it('should skip special test check when specialTestingCode is null', () => {
      fillVerificationForm();
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
      expect(snackbarSpy.showError).not.toHaveBeenCalledWith(
        jasmine.stringContaining('4300'),
      );
    });

    it('should match collDate for Mf flow with RPL productType', () => {
      setupLabeledPhase({ labelDecision: 'OP', productType: 'RPL', expiryDate: null });
      fillVerificationForm();
      component.verificationForm.patchValue({ colldate: '15-JAN-2026' });
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });

    it('should match collDate for Mf flow with RPFF productType', () => {
      setupLabeledPhase({ labelDecision: 'OP', productType: 'RPFF', expiryDate: null });
      fillVerificationForm();
      component.verificationForm.patchValue({ colldate: '15-JAN-2026' });
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });
  });

  // ────────────── confirmVerification ──────────────

  describe('confirmVerification', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    it('should confirm verification and clear all on success', () => {
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).confirmVerification();

      expect(serviceSpy.confirmVerification).toHaveBeenCalledWith(jasmine.objectContaining({
        unitId: 'W123456789012',
        productCode: 'E0280',
        componentPrefix: '01',
        labelDecision: 'OP',
        isMfgProduct: false,
      }));
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        'Label verified and confirmed successfully.',
      );
      expect(component.doLabelCalled()).toBeFalse();
      expect(component.phase()).toBe('ready');
    });

    it('should set isMfgProduct true for Mf labelDecision', () => {
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'Mf' } as any);
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).confirmVerification();

      expect(serviceSpy.confirmVerification).toHaveBeenCalledWith(
        jasmine.objectContaining({ isMfgProduct: true }),
      );
    });

    it('should handle confirmVerification error', () => {
      serviceSpy.confirmVerification.and.returnValue(throwError(() => new Error('err')));

      (component as any).confirmVerification();

      expect(component.loading()).toBeFalse();
    });

    it('should not call API when unitData is null', () => {
      component.unitData.set(null);

      (component as any).confirmVerification();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should not call API when selectedComponent is null', () => {
      component.selectedComponent.set(null);

      (component as any).confirmVerification();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should not call API when labelResult is null', () => {
      component.labelResult.set(null);

      (component as any).confirmVerification();

      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should include testedAboCode and expiryDate in request', () => {
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).confirmVerification();

      expect(serviceSpy.confirmVerification).toHaveBeenCalledWith(
        jasmine.objectContaining({
          testedAboCode: 'OP',
          expiryDate: '2026-07-01T23:59:00',
          identifierCode: 'VL',
        }),
      );
    });

    it('should pass null testedAboCode when not set', () => {
      component.labelResult.set({ ...mockLabelResult, testedAboCode: undefined } as any);
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).confirmVerification();

      expect(serviceSpy.confirmVerification).toHaveBeenCalledWith(
        jasmine.objectContaining({ testedAboCode: null }),
      );
    });
  });

  // ────────────── Clear & Reset ──────────────

  describe('clearAll', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    it('should log abandoned label when doLabelCalled and phase is not init', () => {
      component.clearAll();

      expect(serviceSpy.logAbandonedLabel).toHaveBeenCalledWith(jasmine.objectContaining({
        unitId: 'W123456789012',
        productCode: 'E0280',
        componentPrefix: '01',
        errorCode: '1506',
      }));
    });

    it('should not log abandoned label when doLabelCalled is false', () => {
      component.doLabelCalled.set(false);

      component.clearAll();

      expect(serviceSpy.logAbandonedLabel).not.toHaveBeenCalled();
    });

    it('should not log abandoned label when phase is init', () => {
      component.phase.set('init');

      component.clearAll();

      expect(serviceSpy.logAbandonedLabel).not.toHaveBeenCalled();
    });

    it('should not log abandoned label when unitData or component is null', () => {
      component.unitData.set(null);

      component.clearAll();

      expect(serviceSpy.logAbandonedLabel).not.toHaveBeenCalled();
    });

    it('should reset all signals to default values', () => {
      component.clearAll();

      expect(component.unitData()).toBeNull();
      expect(component.phase1ParsedUnitId()).toBe('');
      expect(component.verifyParsedUnitId()).toBe('');
      expect(component.labelResult()).toBeNull();
      expect(component.selectedComponent()).toBeNull();
      expect(component.processLabelOverrides()).toEqual([]);
      expect(component.row1ProductCodeOptions()).toEqual([]);
      expect(component.scannedAboDescription()).toBe('');
      expect(component.doLabelCalled()).toBeFalse();
      expect(component.isSecondScan()).toBeFalse();
      expect(component.firstScanCompleted()).toBeFalse();
    });

    it('should reset verification form and disable fields', () => {
      component.clearAll();

      Object.keys(component.verificationForm.controls).forEach((key) => {
        expect(component.verificationForm.get(key)?.disabled).toBeTrue();
      });
    });

    it('should clear field errors and processing flags', () => {
      component.fieldErrors = { scanAbo: 'error' };
      component.fieldProcessing = { scanAbo: true };

      component.clearAll();

      expect(component.fieldErrors['scanAbo']).toBeFalsy();
      expect(Object.values(component.fieldProcessing).some(v => v)).toBeFalse();
    });

    it('should prevent re-entrant clearing', () => {
      (component as any).clearing = true;
      const initialUnitData = component.unitData();

      component.clearAll();

      expect(component.unitData()).toBe(initialUnitData);
      (component as any).clearing = false;
    });
  });

  describe('resetVerificationFields', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    it('should reset form but keep verification fields enabled', () => {
      component.verificationForm.patchValue({
        scanUnitId: 'W123',
        scanAbo: 'OP',
      });
      component.scannedAboDescription.set('O Pos');
      component.verifyParsedUnitId.set('W123');

      (component as any).resetVerificationFields();

      expect(component.scannedAboDescription()).toBe('');
      expect(component.verifyParsedUnitId()).toBe('');
      expect(component.fieldErrors).toEqual({});
      expect(component.fieldProcessing).toEqual({});
    });
  });

  // ────────────── Parse Functions ──────────────

  describe('Parse Functions', () => {
    beforeEach(() => initComponent());

    describe('parseAbo', () => {
      it('should return ScanSelectOption on successful validation', (done) => {
        labelScanSpy.validateAboScan.and.returnValue(of({
          success: true,
          item: { aboCode: 'OP', aboShortName: 'O Positive' },
        }));

        component.parseAbo('=OP').subscribe((result) => {
          expect(result).toEqual({ code: 'OP', description: 'O Positive' });
          done();
        });
      });

      it('should throw error when validation fails', (done) => {
        labelScanSpy.validateAboScan.and.returnValue(of({
          success: false,
          message: 'Invalid ABO',
        }));

        component.parseAbo('XX').subscribe({
          error: (err: Error) => {
            expect(err.message).toBe('Invalid ABO');
            done();
          },
        });
      });

      it('should throw error when item has no aboCode', (done) => {
        labelScanSpy.validateAboScan.and.returnValue(of({
          success: true,
          item: { aboCode: null },
        }));

        component.parseAbo('XX').subscribe({
          error: (err: Error) => {
            expect(err.message).toBe('Invalid ABO code');
            done();
          },
        });
      });

      it('should use errorResponse.error when available', (done) => {
        labelScanSpy.validateAboScan.and.returnValue(of({
          success: false,
          errorResponse: { error: 'Specific ABO error' },
        }));

        component.parseAbo('XX').subscribe({
          error: (err: Error) => {
            expect(err.message).toBe('Specific ABO error');
            done();
          },
        });
      });
    });

    describe('parseProductCode', () => {
      it('should return ScanSelectOption on successful validation', (done) => {
        labelScanSpy.validateProductScan.and.returnValue(of({
          success: true,
          item: { productCode: 'E0280', productDescription: 'RBC' },
        }));

        component.parseProductCode('=E0280').subscribe((result) => {
          expect(result).toEqual({ code: 'E0280', description: 'RBC' });
          done();
        });
      });

      it('should throw error when validation fails', (done) => {
        labelScanSpy.validateProductScan.and.returnValue(of({
          success: false,
          message: 'Invalid product',
        }));

        component.parseProductCode('XX').subscribe({
          error: (err: Error) => {
            expect(err.message).toBe('Invalid product');
            done();
          },
        });
      });

      it('should use default error message when no details', (done) => {
        labelScanSpy.validateProductScan.and.returnValue(of({
          success: false,
        }));

        component.parseProductCode('XX').subscribe({
          error: (err: Error) => {
            expect(err.message).toBe('Invalid product code');
            done();
          },
        });
      });
    });

    describe('parseSpTest', () => {
      it('should return ScanSelectOption on successful validation', (done) => {
        labelScanSpy.validateSpTestScan.and.returnValue(of({
          success: true,
          item: { spTestCode: 'CMV', description: 'CMV Negative' },
        }));

        component.parseSpTest('CMV').subscribe((result) => {
          expect(result).toEqual({ code: 'CMV', description: 'CMV Negative' });
          done();
        });
      });

      it('should throw error when validation fails', (done) => {
        labelScanSpy.validateSpTestScan.and.returnValue(of({
          success: false,
          errorResponse: { error: 'Invalid SP test' },
        }));

        component.parseSpTest('XX').subscribe({
          error: (err: Error) => {
            expect(err.message).toBe('Invalid SP test');
            done();
          },
        });
      });
    });
  });

  // ────────────── Format Functions ──────────────

  describe('Format Functions', () => {
    beforeEach(() => initComponent());

    describe('formatExpiryDisplay', () => {
      it('should return empty string for null', () => {
        expect((component as any).formatExpiryDisplay(null)).toBe('');
      });

      it('should return empty string for empty string', () => {
        expect((component as any).formatExpiryDisplay('')).toBe('');
      });

      it('should return value as-is for invalid date', () => {
        expect((component as any).formatExpiryDisplay('NOT_A_DATE')).toBe('NOT_A_DATE');
      });

      it('should format date without time when hours and minutes are 0', () => {
        const result = (component as any).formatExpiryDisplay('2026-01-15T00:00:00');
        expect(result).toBe('15-JAN-2026');
      });

      it('should format date with time when hours or minutes are non-zero', () => {
        const result = (component as any).formatExpiryDisplay('2026-07-01T23:59:00');
        expect(result).toBe('01-JUL-2026 23:59');
      });

      it('should pad single-digit day', () => {
        const result = (component as any).formatExpiryDisplay('2026-03-05T14:30:00');
        expect(result).toBe('05-MAR-2026 14:30');
      });

      it('should pad single-digit hours and minutes', () => {
        const result = (component as any).formatExpiryDisplay('2026-06-10T09:05:00');
        expect(result).toBe('10-JUN-2026 09:05');
      });
    });

    describe('formatCollDateDisplay', () => {
      it('should return empty string for null', () => {
        expect((component as any).formatCollDateDisplay(null)).toBe('');
      });

      it('should return empty string for empty string', () => {
        expect((component as any).formatCollDateDisplay('')).toBe('');
      });

      it('should return value as-is for invalid date', () => {
        expect((component as any).formatCollDateDisplay('BAD')).toBe('BAD');
      });

      it('should format valid date as DD-MON-YYYY', () => {
        const result = (component as any).formatCollDateDisplay('2026-01-15T00:00:00');
        expect(result).toBe('15-JAN-2026');
      });

      it('should format date without time even if time is present', () => {
        const result = (component as any).formatCollDateDisplay('2026-12-25T14:30:00');
        expect(result).toBe('25-DEC-2026');
      });
    });
  });

  // ────────────── Utility Methods ──────────────

  describe('Utility Methods', () => {
    beforeEach(() => initComponent());

    describe('stripCheckDigit', () => {
      it('should return empty string for empty input', () => {
        expect((component as any).stripCheckDigit('')).toBe('');
      });

      it('should strip after last dash', () => {
        expect((component as any).stripCheckDigit('W123-45-6')).toBe('W123-45');
      });

      it('should return value as-is when no dash', () => {
        expect((component as any).stripCheckDigit('W123456')).toBe('W123456');
      });

      it('should handle single character after dash', () => {
        expect((component as any).stripCheckDigit('ABC-1')).toBe('ABC');
      });
    });

    describe('showScanError', () => {
      it('should show error via snackbar with formatted message', () => {
        (component as any).showScanError('1508', 'Unit ID mismatch');

        expect(snackbarSpy.showError).toHaveBeenCalledWith('1508: Unit ID mismatch');
      });

      it('should clear control value and set errors when controlName provided', () => {
        component.verificationForm.get('scanAbo')?.enable();
        component.verificationForm.patchValue({ scanAbo: 'OP' });

        (component as any).showScanError('1509', 'ABO mismatch', 'scanAbo');

        expect(component.verificationForm.get('scanAbo')?.value).toBe('');
        expect(component.verificationForm.get('scanAbo')?.hasError('scanError')).toBeTrue();
      });
    });

    describe('clearFieldError', () => {
      it('should clear field error and control errors', () => {
        component.fieldErrors['scanAbo'] = 'some error';
        component.verificationForm.get('scanAbo')?.enable();
        component.verificationForm.get('scanAbo')?.setErrors({ scanError: true });

        (component as any).clearFieldError('scanAbo');

        expect(component.fieldErrors['scanAbo']).toBe('');
        expect(component.verificationForm.get('scanAbo')?.errors).toBeNull();
      });
    });
  });

  // ────────────── Warning Dialog ──────────────

  describe('showWarningDialog', () => {
    beforeEach(() => initComponent());

    it('should open dialog with correct data', () => {
      const warnings = [{ code: 'W001', message: 'Expired' }];
      const callback = jasmine.createSpy('callback');

      (component as any).showWarningDialog('Warning Title', warnings, callback);

      expect(dialogSpy.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          width: '560px',
          disableClose: true,
          data: {
            title: 'Warning Title',
            warnings,
            allowOverride: true,
          },
        }),
      );
    });

    it('should call callback with override=true when user overrides', () => {
      dialogRefSpy.afterClosed.and.returnValue(of({ override: true, codes: ['W001'] }));
      const callback = jasmine.createSpy('callback');

      (component as any).showWarningDialog('Title', [{ code: 'W001', message: 'Warn' }], callback);

      expect(callback).toHaveBeenCalledWith(true, ['W001']);
    });

    it('should call callback with override=false when user cancels', () => {
      dialogRefSpy.afterClosed.and.returnValue(of({ override: false, codes: [] }));
      const callback = jasmine.createSpy('callback');

      (component as any).showWarningDialog('Title', [{ code: 'W001', message: 'Warn' }], callback);

      expect(callback).toHaveBeenCalledWith(false, []);
    });

    it('should call callback with override=false when dialog returns null', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      const callback = jasmine.createSpy('callback');

      (component as any).showWarningDialog('Title', [{ code: 'W001', message: 'Warn' }], callback);

      expect(callback).toHaveBeenCalledWith(false, []);
    });
  });

  // ────────────── onVerifyUnitValidated ──────────────

  describe('onVerifyUnitValidated', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    it('should call tryAutoVerify', () => {
      spyOn(component as any, 'tryAutoVerify');

      component.onVerifyUnitValidated({} as any);

      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });
  });

  // ────────────── onUnitValidated ──────────────

  describe('onUnitValidated', () => {
    beforeEach(() => initComponent());

    it('should be a no-op method', () => {
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });
  });

  // ────────────── disableVerificationFields ──────────────

  describe('disableVerificationFields', () => {
    beforeEach(() => initComponent());

    it('should disable all verification form controls', () => {
      Object.keys(component.verificationForm.controls).forEach((key) => {
        component.verificationForm.get(key)?.enable();
      });

      (component as any).disableVerificationFields();

      Object.keys(component.verificationForm.controls).forEach((key) => {
        expect(component.verificationForm.get(key)?.disabled).toBeTrue();
      });
    });
  });

  // ────────────── Default error codes for scan handlers ──────────────

  describe('Default error codes for validation failures', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    it('should use default error code 1230 for unit ID scan failure', () => {
      component.verificationForm.patchValue({ scanUnitId: 'BAD' });
      labelScanSpy.validateUnitScan.and.returnValue(of({
        success: false,
        message: 'Invalid',
      }));

      component.onScanUnitIdBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('1230: Invalid');
    });

    it('should use default error code 6010 for ABO scan failure', () => {
      component.verificationForm.patchValue({ scanAbo: 'XX' });
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: false,
        message: 'Invalid',
      }));

      component.onScanAboBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6010: Invalid');
    });

    it('should use default error code 9710 for product expiry scan failure', () => {
      component.verificationForm.patchValue({ scanProdExp: 'BAD' });
      labelScanSpy.validateProductExpiryScan.and.returnValue(of({
        success: false,
        message: 'Invalid',
      }));

      component.onScanProdExpBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('9710: Invalid');
    });

    it('should use default error code 6035 for product code scan failure', () => {
      component.verificationForm.patchValue({ scanProductCode: 'BAD' });
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: false,
        message: 'Invalid',
      }));

      component.onScanProductCodeBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6035: Invalid');
    });

    it('should use default error code 6030 for expiry scan failure', () => {
      component.verificationForm.patchValue({ scanExpDate: 'BAD' });
      labelScanSpy.validateExpiryScan.and.returnValue(of({
        success: false,
        message: 'Invalid',
      }));

      component.onScanExpDateBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6030: Invalid');
    });

    it('should use default error code 1210 for collection date scan failure', () => {
      setupLabeledPhase({ labelDecision: 'Mf' });
      component.verificationForm.patchValue({ scanCollDate: 'BAD' });
      labelScanSpy.validateExpiryScan.and.returnValue(of({
        success: false,
        message: 'Invalid',
      }));

      component.onScanCollDateBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('1210: Invalid');
    });

    it('should use default error code 4327 for special test scan failure', () => {
      setupLabeledPhase({ specialTestingCode: 'CMV' });
      component.verificationForm.patchValue({ scanSpecialTest: 'BAD' });
      labelScanSpy.validateSpTestScan.and.returnValue(of({
        success: false,
        message: 'Invalid',
      }));

      component.onScanSpecialTestBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('4327: Invalid');
    });

    it('should use fallback message when no message in response', () => {
      component.verificationForm.patchValue({ scanUnitAbo: 'BAD' });
      labelScanSpy.validateUnitAboScan.and.returnValue(of({
        success: false,
      }));

      component.onScanUnitAboBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6040: Invalid Unit+ABO scan');
    });
  });

  // ────────────── LOV ABO options not set when response is unsuccessful ──────────────

  describe('LOV data edge cases', () => {
    beforeEach(() => initComponent());

    it('should not set aboLovOptions when ABO LOV response is unsuccessful', () => {
      component.labelResult.set(mockLabelResult as any);
      serviceSpy.getLovAboValues.and.returnValue(of({ success: false }));

      (component as any).loadLovData();

      expect(component.aboLovOptions()).toEqual([]);
    });

    it('should not set specialTestLovOptions when special test LOV response is unsuccessful', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'CMV' } as any);
      serviceSpy.getLovSpecialTestCodes.and.returnValue(of({ success: false }));

      (component as any).loadLovData();

      expect(component.specialTestLovOptions()).toEqual([]);
    });
  });

  // ────────────── Full verification flow integration ──────────────

  describe('Full Verification Flow', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase({ specialTestingCode: 'CMV' });
    });

    it('should successfully verify when all scanned fields match expected values', () => {
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      component.verifyParsedUnitId.set('W123456789012');
      component.verificationForm.patchValue({
        scanUnitId: 'W123456789012',
        scanAbo: 'OP',
        scanProductCode: 'E0280',
        scanExpDate: '01-JUL-2026 23:59',
        scanSpecialTest: 'CMV',
      });

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        'Label verified and confirmed successfully.',
      );
      expect(component.phase()).toBe('ready');
    });
  });

  // ────────────── Branch Coverage: Fallback / Optional Chaining ──────────────

  describe('Branch coverage: fallback paths', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    // onScanUnitAboBlur: manualUnitId is null, should fallback to parsedUnitId
    it('should use parsedUnitId as fallback when manualUnitId is null in unit+abo scan', () => {
      component.verificationForm.patchValue({ scanUnitAbo: '=W123456789012OP' });
      component.verifyUnitIdField = { setValue: jasmine.createSpy('setValue') } as any;
      component.aboField = { setValue: jasmine.createSpy('setValue') } as any;
      labelScanSpy.validateUnitAboScan.and.returnValue(of({
        success: true,
        item: {
          parsedUnitId: 'W123456789012',
          aboCode: 'OP',
          manualUnitId: null,
          aboDescription: null,
        },
      }));

      component.onScanUnitAboBlur();

      expect(component.verificationForm.getRawValue().scanUnitId).toBe('W123456789012');
      expect(component.scannedAboDescription()).toBe('');
    });

    // onScanUnitIdBlur: manualUnitId is null, should fallback to parsedUnitId
    it('should use parsedUnitId as fallback when manualUnitId is null in unit scan', () => {
      component.verificationForm.patchValue({ scanUnitId: 'W123456789012' });
      labelScanSpy.validateUnitScan.and.returnValue(of({
        success: true,
        item: { parsedUnitId: 'W123456789012', manualUnitId: null },
      }));

      component.onScanUnitIdBlur();

      expect(component.verificationForm.getRawValue().scanUnitId).toBe('W123456789012');
    });

    // onScanAboBlur: aboCode is null, should fallback to scanValue
    it('should use scanValue as fallback when aboCode is null in abo scan', () => {
      component.verificationForm.patchValue({ scanAbo: 'OP' });
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true,
        item: { aboCode: null, aboShortName: null },
      }));

      component.onScanAboBlur();

      expect(component.verificationForm.getRawValue().scanAbo).toBe('OP');
      expect(component.scannedAboDescription()).toBe('');
    });

    // onScanProductCodeBlur: productCode is null, should fallback to scanValue
    it('should use scanValue as fallback when productCode is null in product scan', () => {
      component.verificationForm.patchValue({ scanProductCode: 'E0280' });
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: true,
        item: { productCode: null, productDescription: 'RBC' },
      }));

      component.onScanProductCodeBlur();

      expect(component.verificationForm.getRawValue().scanProductCode).toBe('E0280');
    });

    // onScanSpecialTestBlur: spTestCode is null, should fallback to scanValue
    it('should use scanValue as fallback when spTestCode is null in special test scan', () => {
      setupLabeledPhase({ specialTestingCode: 'CMV' });
      component.verificationForm.patchValue({ scanSpecialTest: 'CMV' });
      labelScanSpy.validateSpTestScan.and.returnValue(of({
        success: true,
        item: { spTestCode: null, description: 'CMV Negative' },
      }));

      component.onScanSpecialTestBlur();

      expect(component.verificationForm.getRawValue().scanSpecialTest).toBe('CMV');
    });

    // onScanProdExpBlur: productCode is null, should fallback to empty string
    it('should use empty string when productCode is null in product+expiry scan', () => {
      component.verificationForm.patchValue({ scanProdExp: '=20260701' });
      labelScanSpy.validateProductExpiryScan.and.returnValue(of({
        success: true,
        item: { productCode: null, expiryDate: '2026-07-01T23:59:00' },
      }));

      component.onScanProdExpBlur();

      expect(component.verificationForm.getRawValue().scanProductCode).toBe('');
    });

    // confirmVerification: response.success is false
    it('should not show success when confirmVerification returns unsuccessful', () => {
      serviceSpy.confirmVerification.and.returnValue(of({ success: false }));

      (component as any).confirmVerification();

      expect(snackbarSpy.showSuccess).not.toHaveBeenCalled();
      expect(component.loading()).toBeFalse();
    });

    // clearAll: doLabelCalled but selectedComponent is null
    it('should not log abandoned label when selectedComponent is null despite doLabelCalled', () => {
      component.doLabelCalled.set(true);
      component.phase.set('labeled');
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(null);

      component.clearAll();

      expect(serviceSpy.logAbandonedLabel).not.toHaveBeenCalled();
    });

    // formatExpiryDisplay: hours=0 but minutes>0 (should show time)
    it('should format date with time when hours are 0 but minutes are non-zero', () => {
      const result = (component as any).formatExpiryDisplay('2026-06-15T00:30:00');
      expect(result).toBe('15-JUN-2026 00:30');
    });

    // formatExpiryDisplay: minutes=0 but hours>0 (should show time)
    it('should format date with time when hours are non-zero but minutes are 0', () => {
      const result = (component as any).formatExpiryDisplay('2026-06-15T14:00:00');
      expect(result).toBe('15-JUN-2026 14:00');
    });

    // ngOnDestroy: should complete the destroy$ subject
    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySub = (component as any).destroy$;
      spyOn(destroySub, 'next');
      spyOn(destroySub, 'complete');

      component.ngOnDestroy();

      expect(destroySub.next).toHaveBeenCalled();
      expect(destroySub.complete).toHaveBeenCalled();
    });

    // onScanExpDateBlur: empty value should return early (targets line 866)
    it('should return early when scanExpDate value is null', () => {
      component.verificationForm.get('scanExpDate')?.setValue(null);

      component.onScanExpDateBlur();

      expect(labelScanSpy.validateExpiryScan).not.toHaveBeenCalled();
    });

    // processLabel: warningMessage is null, fallback to 'Warning'
    it('should use default warning message when warningMessage is null', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockComponent);
      component.phase.set('unit-validated');

      const warningResult = {
        ...mockLabelResult,
        isWarning: true,
        warningCode: 'W001',
        warningMessage: null,
      };
      serviceSpy.processLabel.and.returnValue(of(apiSuccess(warningResult)));
      dialogRefSpy.afterClosed.and.returnValue(of(null));

      (component as any).proceedToProcessLabel();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            warnings: [{ code: 'W001', message: 'Warning' }],
          }),
        }),
      );
    });

    // doVerificationComparison: both verifyParsedUnitId and formValue.scanUnitId are empty
    it('should use empty string when both verifyParsedUnitId and scanUnitId are empty', () => {
      component.verifyParsedUnitId.set('');
      component.phase1ParsedUnitId.set('');
      component.verificationForm.patchValue({ scanUnitId: '' });

      (component as any).doVerificationComparison();

      // With both empty, they match (both empty), so it should proceed to ABO check
      // but ABO won't match since scanAbo is empty and labelDecision is 'OP'
      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('1509'),
      );
    });

    // onScanCollDateBlur: test default error message fallback
    it('should use default error message for collection date scan when no error details', () => {
      setupLabeledPhase({ labelDecision: 'Mf', productType: 'RBC' });
      component.verificationForm.patchValue({ scanCollDate: 'BAD' });
      labelScanSpy.validateExpiryScan.and.returnValue(of({
        success: false,
      }));

      component.onScanCollDateBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('1210: Invalid collection date scan');
    });

    // onScanUnitIdBlur: test default error message fallback
    it('should use default error message for unit ID scan when no error details', () => {
      component.verificationForm.patchValue({ scanUnitId: 'BAD' });
      labelScanSpy.validateUnitScan.and.returnValue(of({
        success: false,
      }));

      component.onScanUnitIdBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('1230: Invalid Unit ID');
    });

    // onScanAboBlur: test default error message fallback
    it('should use default error message for ABO scan when no error details', () => {
      component.verificationForm.patchValue({ scanAbo: 'XX' });
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: false,
      }));

      component.onScanAboBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6010: Invalid ABO code');
    });

    // onScanProdExpBlur: test default error message fallback
    it('should use default error message for product+expiry scan when no error details', () => {
      component.verificationForm.patchValue({ scanProdExp: 'BAD' });
      labelScanSpy.validateProductExpiryScan.and.returnValue(of({
        success: false,
      }));

      component.onScanProdExpBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('9710: Invalid Product+Expiry scan');
    });

    // onScanProductCodeBlur: test default error message fallback
    it('should use default error message for product code scan when no error details', () => {
      component.verificationForm.patchValue({ scanProductCode: 'XX' });
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: false,
      }));

      component.onScanProductCodeBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6035: Invalid product code');
    });

    // onScanExpDateBlur: test default error message fallback
    it('should use default error message for expiry scan when no error details', () => {
      component.verificationForm.patchValue({ scanExpDate: 'BAD' });
      labelScanSpy.validateExpiryScan.and.returnValue(of({
        success: false,
      }));

      component.onScanExpDateBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6030: Invalid expiry date');
    });

    // onScanSpecialTestBlur: test default error message fallback
    it('should use default error message for special test scan when no error details', () => {
      setupLabeledPhase({ specialTestingCode: 'CMV' });
      component.verificationForm.patchValue({ scanSpecialTest: 'XX' });
      labelScanSpy.validateSpTestScan.and.returnValue(of({
        success: false,
      }));

      component.onScanSpecialTestBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('4327: Invalid SP test code');
    });

    // onScanCollDateBlur: expiryDate is null in response item
    it('should show error when expiryDate is null in collection date scan response', () => {
      setupLabeledPhase({ labelDecision: 'Mf', productType: 'RBC' });
      component.verificationForm.patchValue({ scanCollDate: '20260115' });
      labelScanSpy.validateExpiryScan.and.returnValue(of({
        success: true,
        item: { expiryDate: null },
      }));

      component.onScanCollDateBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('1210'),
      );
    });

    // onScanProdExpBlur: product code matches but from selectedComponent (labelProductCode is null)
    it('should use selectedComponent productCode for ProdExp comparison when labelProductCode is null', () => {
      component.labelResult.set({ ...mockLabelResult, labelProductCode: null } as any);
      component.verificationForm.patchValue({ scanProdExp: '=E028020260701' });
      labelScanSpy.validateProductExpiryScan.and.returnValue(of({
        success: true,
        item: { productCode: 'E0280', expiryDate: '2026-07-01T23:59:00' },
      }));

      component.onScanProdExpBlur();

      expect(snackbarSpy.showError).not.toHaveBeenCalled();
    });

    // LOV mapping: aboLabel is null, should fallback to code
    it('should use code field as fallback when aboLabel is null in LOV data', () => {
      component.labelResult.set(mockLabelResult as any);
      serviceSpy.getLovAboValues.and.returnValue(of(apiSuccess([
        { aboLabel: null, aboShortName: null, code: 'OP', description: 'O Positive' },
      ])));

      (component as any).loadLovData();

      expect(component.aboLovOptions()).toEqual([
        { code: 'OP', description: 'O Positive' },
      ]);
    });

    // LOV mapping: specialTest codeDescription is null, should fallback to description
    it('should use description field as fallback when codeDescription is null in special test LOV', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'CMV' } as any);
      serviceSpy.getLovSpecialTestCodes.and.returnValue(of(apiSuccess([
        { code: 'CMV', codeDescription: null, description: 'CMV Negative' },
      ])));

      (component as any).loadLovData();

      expect(component.specialTestLovOptions()).toEqual([
        { code: 'CMV', description: 'CMV Negative' },
      ]);
    });

    // LOV mapping: both description fields are null
    it('should use empty string when all description fields are null in LOV data', () => {
      component.labelResult.set(mockLabelResult as any);
      serviceSpy.getLovAboValues.and.returnValue(of(apiSuccess([
        { aboLabel: 'OP', aboShortName: null, description: null },
      ])));

      (component as any).loadLovData();

      expect(component.aboLovOptions()).toEqual([
        { code: 'OP', description: '' },
      ]);
    });

    // LOV mapping: specialTest both description fields are null
    it('should use empty string when all description fields are null in special test LOV', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'CMV' } as any);
      serviceSpy.getLovSpecialTestCodes.and.returnValue(of(apiSuccess([
        { code: 'CMV', codeDescription: null, description: null },
      ])));

      (component as any).loadLovData();

      expect(component.specialTestLovOptions()).toEqual([
        { code: 'CMV', description: '' },
      ]);
    });

    // onVerifyUnitPostValidate: use parsedUnitId when manualUnitId is empty
    it('should use parsedUnitId as manualUnitId fallback in verify unit post-validate', () => {
      const event = makePostValidateEvent('W123456789012');
      event.data.manualUnitId = undefined as any;

      component.onVerifyUnitPostValidate(event);

      expect(component.verificationForm.getRawValue().scanUnitId).toBe('W123456789012');
    });

    // onVerifyUnitPostValidate: empty parsedUnitId should still confirm
    it('should confirm when phase1ParsedUnitId is also empty', () => {
      component.phase1ParsedUnitId.set('');
      const event = makePostValidateEvent('');

      component.onVerifyUnitPostValidate(event);

      expect(event.confirm).toHaveBeenCalled();
    });

    // onScanAboBlur: aboShortName is empty string
    it('should set empty description when aboShortName is empty string in ABO scan', () => {
      component.verificationForm.patchValue({ scanAbo: 'OP' });
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true,
        item: { aboCode: 'OP', aboShortName: '' },
      }));

      component.onScanAboBlur();

      expect(component.scannedAboDescription()).toBe('');
    });
  });

  // ────────────── Branch Coverage: tryAutoVerify focus paths ──────────────

  describe('tryAutoVerify focus paths', () => {
    beforeEach(() => {
      initComponent();
      setupLabeledPhase();
    });

    it('should focus verifyUnitIdField when unitId is empty', () => {
      component.verifyUnitIdField = { focus: jasmine.createSpy('focus') } as any;
      component.verificationForm.patchValue({
        scanUnitId: '',
        scanAbo: 'OP',
        scanProductCode: 'E0280',
      });

      (component as any).tryAutoVerify();

      expect(component.verifyUnitIdField.focus).toHaveBeenCalled();
    });

    it('should focus aboField when unitId is set but abo is empty', () => {
      component.aboField = { focus: jasmine.createSpy('focus') } as any;
      component.verificationForm.patchValue({
        scanUnitId: 'W123456789012',
        scanAbo: '',
        scanProductCode: 'E0280',
      });

      (component as any).tryAutoVerify();

      expect(component.aboField.focus).toHaveBeenCalled();
    });

    it('should focus specialTestField when special test is required but empty', () => {
      setupLabeledPhase({ specialTestingCode: 'CMV', expiryDate: null });
      component.specialTestField = { focus: jasmine.createSpy('focus') } as any;
      component.verificationForm.patchValue({
        scanUnitId: 'W123456789012',
        scanAbo: 'OP',
        scanProductCode: 'E0280',
        scanSpecialTest: '',
      });

      (component as any).tryAutoVerify();

      expect(component.specialTestField.focus).toHaveBeenCalled();
    });
  });
});
