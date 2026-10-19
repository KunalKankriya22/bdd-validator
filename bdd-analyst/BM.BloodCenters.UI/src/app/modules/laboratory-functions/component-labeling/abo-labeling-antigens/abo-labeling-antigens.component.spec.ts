import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { AboLabelingAntigensComponent } from './abo-labeling-antigens.component';
import { AboLabelingAntigensService } from './services/abo-labeling-antigens.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PageHeaderService } from '@shared/services/page-header.service';
import { signal } from '@angular/core';

describe('AboLabelingAntigensComponent', () => {
  let component: AboLabelingAntigensComponent;
  let fixture: ComponentFixture<AboLabelingAntigensComponent>;
  let serviceSpy: jasmine.SpyObj<AboLabelingAntigensService>;
  let labelScanSpy: jasmine.SpyObj<DonorLibLabelScanService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('AboLabelingAntigensService', [
      'validateAccess',
      'validateUnit',
      'getAntigens',
      'processLabel',
      'reprint',
      'confirmVerification',
      'getLovAboValues',
      'getLovSpecialTestCodes'
    ]);

    labelScanSpy = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateUnitAboScan',
      'validateUnitScan',
      'validateAboScan',
      'validateProductScan',
      'validateProductExpiryScan',
      'validateExpiryScan',
      'validateSpTestScan'
    ]);

    headerSpy = jasmine.createSpyObj('HeaderService', [], {
      chapterChanged$: chapterChanged$.asObservable()
    });

    snackbarSpy = jasmine.createSpyObj('SnackbarService', [
      'showError',
      'showSuccess',
      'showInfo'
    ]);

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    sessionStorage.setItem('printerConfig', JSON.stringify({ labelPrinterCode: 'LP1', tieTagPrinterCode: 'TT1' }));

    serviceSpy.validateAccess.and.returnValue(of({
      success: true,
      item: { unitScheme: 'I' }
    }));

    serviceSpy.getAntigens.and.returnValue(of({ data: [] }));
    serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));
    serviceSpy.getLovSpecialTestCodes.and.returnValue(of({ success: true, item: [] }));

    TestBed.configureTestingModule({
      imports: [AboLabelingAntigensComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        FormBuilder,
        { provide: AboLabelingAntigensService, useValue: serviceSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PageHeaderService, useValue: jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], { pageHeaderData: signal(undefined) }) }
      ]
    });

    fixture = TestBed.createComponent(AboLabelingAntigensComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template binding errors */ }
  });

  afterEach(() => sessionStorage.clear());

  describe('Unit Scan with Antigen Mode', () => {
    it('should call validateUnit with isAntigenMode true', (done) => {
      // Arrange
      const mockEvent = {
        data: { parsedUnitId: 'W12345', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: true,
        item: {
          unitId: 'W12345',
          collDate: '2025-01-01',
          components: [{ productCode: 'E0791', productDescription: 'RBC', componentPrefix: '01' }]
        }
      }));

      // Act
      component.onUnitPostValidate(mockEvent as any);

      // Assert
      setTimeout(() => {
        expect(serviceSpy.validateUnit).toHaveBeenCalledWith(
          jasmine.objectContaining({ isAntigenMode: true })
        );
        expect(mockEvent.confirm).toHaveBeenCalled();
        expect(serviceSpy.getAntigens).toHaveBeenCalledWith('W12345', '2025-01-01');
        done();
      });
    });

    it('should reject when no labelable components found', (done) => {
      // Arrange
      const mockEvent = {
        data: { parsedUnitId: 'W12345', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: true,
        item: { unitId: 'W12345', collDate: '2025-01-01', components: [] }
      }));

      // Act
      component.onUnitPostValidate(mockEvent as any);

      // Assert
      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('No labelable component found');
        done();
      });
    });
  });

  describe('Antigen Panel Selection', () => {
    it('should store antigen selections and close panel on save', () => {
      // Arrange
      const selections = [
        { antigenCode: 'D', result: 'POS' },
        { antigenCode: 'C', result: 'NEG' }
      ];
      component.unitData.set({
        unitId: 'W12345',
        collDate: '2025-01-01',
        components: [{ productCode: 'E0791', productDescription: 'RBC', componentPrefix: '01' }]
      } as any);
      serviceSpy.processLabel.and.returnValue(of({
        success: true,
        item: { labelDecision: 'A', labelDecisionDisplay: 'A', rhDisplay: 'Pos' }
      }));

      // Act
      component.onAntigenPanelSaved(selections as any);

      // Assert
      expect(component.antigenSelections()).toEqual(selections as any);
      expect(component.antigenPanelOpen()).toBe(false);
    });

    it('should close antigen panel on panel closed event', () => {
      // Arrange
      component.antigenPanelOpen.set(true);
      component.unitData.set({
        unitId: 'W12345',
        collDate: '2025-01-01',
        components: [{ productCode: 'E0791', componentPrefix: '01' }, { productCode: 'E0792', componentPrefix: '02' }]
      } as any);

      // Act
      component.onAntigenPanelClosed();

      // Assert
      expect(component.antigenPanelOpen()).toBe(false);
    });
  });

  describe('ABO Validation During Verification', () => {
    it('should show error 1509 when ABO mismatch detected', () => {
      // Arrange
      component.labelResult.set({
        labelDecision: 'B',
        labelDecisionDisplay: 'B',
        rhDisplay: 'Pos'
      } as any);

      // Act
      component.onAboFieldChanged({ code: 'O', description: 'O' });

      // Assert
      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('1509')
      );
    });

    it('should accept when ABO matches label decision', () => {
      // Arrange
      component.labelResult.set({
        labelDecision: 'AB',
        labelDecisionDisplay: 'AB',
        rhDisplay: 'Neg'
      } as any);

      // Act
      component.onAboFieldChanged({ code: 'AB', description: 'AB' });

      // Assert
      expect(snackbarSpy.showError).not.toHaveBeenCalled();
    });
  });

  describe('Process Label with Antigen Selections', () => {
    it('should include antigen selections in process label request', (done) => {
      // Arrange
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.antigenSelections.set([{ antigenCode: 'D', result: 'POS' }] as any);
      component.printerContext.set({ labelPrinterCode: 'LP1', tieTagPrinterCode: 'TT1' } as any);
      serviceSpy.processLabel.and.returnValue(of({
        success: true,
        item: {
          labelDecision: 'A',
          labelDecisionDisplay: 'A',
          rhDisplay: 'Pos',
          expiryDate: '2025-06-01'
        }
      }));

      // Act
      (component as any).proceedToProcessLabel();

      // Assert
      setTimeout(() => {
        expect(serviceSpy.processLabel).toHaveBeenCalledWith(
          jasmine.objectContaining({
            isAntigenMode: true,
            antigenSelections: [{ antigenCode: 'D', result: 'POS' }]
          })
        );
        expect(component.phase()).toBe('labeled');
        done();
      });
    });
  });

  describe('Confirm Verification Submission', () => {
    it('should clear state after successful verification', (done) => {
      // Arrange
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.labelResult.set({
        labelDecision: 'A',
        expiryDate: '2025-06-01',
        identifierCode: '',
        testedAboCode: null
      } as any);
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      // Act
      (component as any).confirmVerification();

      // Assert
      setTimeout(() => {
        expect(serviceSpy.confirmVerification).toHaveBeenCalled();
        expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
          jasmine.stringContaining('verified')
        );
        done();
      });
    });
  });

  describe('Clear All State', () => {
    it('should reset all signals and form on clearAll', () => {
      // Arrange
      component.unitData.set({ unitId: 'X' } as any);
      component.labelResult.set({ labelDecision: 'B' } as any);
      component.antigens.set([{ code: 'D' }] as any);
      component.antigenSelections.set([{ antigenCode: 'D', result: 'POS' }] as any);
      component.antigenPanelOpen.set(true);

      // Act
      component.clearAll();

      // Assert
      expect(component.unitData()).toBeNull();
      expect(component.labelResult()).toBeNull();
      expect(component.antigens()).toEqual([]);
      expect(component.antigenSelections()).toEqual([]);
      expect(component.antigenPanelOpen()).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Additional coverage tests
  // ────────────────────────────────────────────────────────────────────────

  const mockUnitData: any = {
    unitId: 'W12345',
    collDate: '2025-01-01',
    components: [
      { productCode: 'E0791', productDescription: 'RBC', componentPrefix: '01', componentStatus: 'A', systemLabelDecision: null, bagsUsed: 1 }
    ],
    isReagent: false,
    interdictions: [],
    attributes: []
  };

  const mockLabelResult: any = {
    labelDecision: 'A',
    labelDecisionDisplay: 'A',
    rhDisplay: 'Pos',
    intendedUse: 'Transfusion',
    identifierCode: 'V',
    testedAboCode: 'A',
    testedAboDescription: 'A',
    expiryDate: '2025-06-01',
    expiryDateDisplay: '01-JUN-2025',
    productType: 'RBC',
    specialTestingCode: null,
    barcodeValue: null,
    labelProductCode: 'E0791',
    isWarning: false,
    warningMessage: null,
    warningCode: null,
    holdReasons: [],
    interdictions: [],
    attributes: []
  };

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('initScreen', () => {
    it('should redirect to change printer page when no printer context in storage', () => {
      sessionStorage.clear();
      (component as any).initScreen();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/laboratory-functions/labeling-functions/common-labeling-functions/change-label-printer'],
        jasmine.objectContaining({ queryParams: { returnUrl: '/laboratory-functions/component-labeling/abo-labeling-antigens' } })
      );
    });

    it('should redirect when printer context has no labelPrinterCode', () => {
      sessionStorage.setItem('labelPrinterContext', JSON.stringify({ labelPrinterCode: null }));
      (component as any).initScreen();
      expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should load chapter config when printer context is found', () => {
      sessionStorage.setItem('labelPrinterContext', JSON.stringify({ labelPrinterCode: 'LP1', tieTagPrinterCode: 'TT1' }));
      serviceSpy.validateAccess.and.returnValue(of({ success: true, item: { chapterId: 'CH1', unitScheme: 'I' } }));
      (component as any).initScreen();
      expect(component.printerContext()).toEqual(jasmine.objectContaining({ labelPrinterCode: 'LP1' }));
      expect(serviceSpy.validateAccess).toHaveBeenCalled();
      expect(component.phase()).toBe('ready');
    });
  });

  describe('loadPrinterContextFromStorage', () => {
    it('should return null on invalid JSON', () => {
      sessionStorage.setItem('labelPrinterContext', 'not-json');
      const result = (component as any).loadPrinterContextFromStorage();
      expect(result).toBeNull();
    });

    it('should return null when no item in storage', () => {
      sessionStorage.removeItem('labelPrinterContext');
      const result = (component as any).loadPrinterContextFromStorage();
      expect(result).toBeNull();
    });

    it('should return parsed context when valid', () => {
      sessionStorage.setItem('labelPrinterContext', JSON.stringify({ labelPrinterCode: 'P1' }));
      const result = (component as any).loadPrinterContextFromStorage();
      expect(result).toEqual({ labelPrinterCode: 'P1' });
    });
  });

  describe('loadChapterConfig', () => {
    it('should set phase to ready on success with item', () => {
      serviceSpy.validateAccess.and.returnValue(of({ success: true, item: { chapterId: 'CH1' } }));
      (component as any).loadChapterConfig();
      expect(component.chapterConfig()).toEqual(jasmine.objectContaining({ chapterId: 'CH1' }));
      expect(component.phase()).toBe('ready');
      expect(component.loading()).toBe(false);
    });

    it('should not set phase to ready when success is false', () => {
      component.phase.set('init');
      serviceSpy.validateAccess.and.returnValue(of({ success: false }));
      (component as any).loadChapterConfig();
      expect(component.phase()).toBe('init');
      expect(component.loading()).toBe(false);
    });

    it('should not set phase to ready when item is missing', () => {
      component.phase.set('init');
      serviceSpy.validateAccess.and.returnValue(of({ success: true, item: undefined }));
      (component as any).loadChapterConfig();
      expect(component.phase()).toBe('init');
    });

    it('should set loading to false on error', () => {
      component.loading.set(true);
      serviceSpy.validateAccess.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadChapterConfig();
      expect(component.loading()).toBe(false);
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should call clearAll and initScreen on chapter change', () => {
      spyOn(component, 'clearAll');
      chapterChanged$.next();
      expect(component.clearAll).toHaveBeenCalled();
    });
  });

  describe('enableVerificationFields', () => {
    it('should enable all verification form controls', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'ST1' });
      (component as any).enableVerificationFields();
      Object.keys(component.verificationForm.controls).forEach(key => {
        expect(component.verificationForm.get(key)!.enabled).toBe(true);
      });
    });

    it('should disable scanSpecialTest when no special testing code', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: null });
      (component as any).enableVerificationFields();
      expect(component.verificationForm.get('scanSpecialTest')!.disabled).toBe(true);
      expect(component.verificationForm.get('scanUnitAbo')!.enabled).toBe(true);
    });
  });

  describe('disableVerificationFields', () => {
    it('should disable all verification form controls', () => {
      (component as any).enableVerificationFields();
      (component as any).disableVerificationFields();
      Object.keys(component.verificationForm.controls).forEach(key => {
        expect(component.verificationForm.get(key)!.disabled).toBe(true);
      });
    });
  });

  describe('bloodTypeDisplay computed', () => {
    it('should return null when no label result', () => {
      component.labelResult.set(null);
      expect(component.bloodTypeDisplay()).toBeNull();
    });

    it('should return normal display for non-special code', () => {
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'A', labelDecisionDisplay: 'A POS', rhDisplay: 'Pos', intendedUse: 'Transfusion', identifierCode: 'V' });
      const display = component.bloodTypeDisplay();
      expect(display).toEqual(jasmine.objectContaining({
        labelDecision: 'A',
        labelDecisionDisplay: 'A POS',
        rhDisplay: 'Pos',
        intendedUse: 'Transfusion'
      }));
    });

    it('should map Mq to HOLD and clear rhDisplay', () => {
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'Mq', labelDecisionDisplay: 'QUARANTINE', identifierCode: 'X' });
      const display = component.bloodTypeDisplay();
      expect(display!.labelDecisionDisplay).toBe('HOLD');
      expect(display!.rhDisplay).toBe('');
      expect(display!.intendedUse).toBe('');
    });

    it('should map Mb to BIO', () => {
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'Mb', labelDecisionDisplay: 'BIO', identifierCode: 'X' });
      const display = component.bloodTypeDisplay();
      expect(display!.labelDecisionDisplay).toBe('BIO');
      expect(display!.rhDisplay).toBe('');
    });

    it('should map Md to DISC', () => {
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'Md', labelDecisionDisplay: 'DISCARD', identifierCode: 'X' });
      const display = component.bloodTypeDisplay();
      expect(display!.labelDecisionDisplay).toBe('DISC');
    });

    it('should map Mf to MFG', () => {
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'Mf', labelDecisionDisplay: 'MFG', identifierCode: 'X' });
      const display = component.bloodTypeDisplay();
      expect(display!.labelDecisionDisplay).toBe('MFG');
    });

    it('should show intendedUse for directed bio (DB) even with special code', () => {
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'Mb', identifierCode: 'DB', intendedUse: 'Directed Bio' });
      const display = component.bloodTypeDisplay();
      expect(display!.intendedUse).toBe('Directed Bio');
    });
  });

  describe('row1ProductCodeDisabled computed', () => {
    it('should return true when phase is init', () => {
      component.phase.set('init');
      expect(component.row1ProductCodeDisabled()).toBe(true);
    });

    it('should return true when phase is ready', () => {
      component.phase.set('ready');
      expect(component.row1ProductCodeDisabled()).toBe(true);
    });

    it('should return false when phase is unit-validated', () => {
      component.phase.set('unit-validated');
      expect(component.row1ProductCodeDisabled()).toBe(false);
    });

    it('should return false when phase is labeled', () => {
      component.phase.set('labeled');
      expect(component.row1ProductCodeDisabled()).toBe(false);
    });

    it('should return false when phase is verifying', () => {
      component.phase.set('verifying');
      expect(component.row1ProductCodeDisabled()).toBe(false);
    });
  });

  describe('isAnyFieldProcessing', () => {
    it('should return false when no fields are processing', () => {
      component.fieldProcessing = {};
      expect(component.isAnyFieldProcessing).toBe(false);
    });

    it('should return true when at least one field is processing', () => {
      component.fieldProcessing = { scanUnitId: false, scanAbo: true };
      expect(component.isAnyFieldProcessing).toBe(true);
    });

    it('should return false when all fields are false', () => {
      component.fieldProcessing = { scanUnitId: false, scanAbo: false };
      expect(component.isAnyFieldProcessing).toBe(false);
    });
  });

  describe('onUnitPostValidate', () => {
    it('should skip if already validating', () => {
      (component as any).unitValidating = true;
      const event = {
        data: { parsedUnitId: 'W99999', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event as any);
      expect(serviceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should reject with errorResponse message on failed validation', () => {
      const event = {
        data: { parsedUnitId: 'W12345', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: false,
        errorResponse: { message: 'Custom error msg' }
      }));
      component.onUnitPostValidate(event as any);
      expect(event.reject).toHaveBeenCalledWith('Custom error msg');
    });

    it('should reject with default message when no errorResponse', () => {
      const event = {
        data: { parsedUnitId: 'W12345', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: false,
        message: 'General fail'
      }));
      component.onUnitPostValidate(event as any);
      expect(event.reject).toHaveBeenCalledWith('General fail');
    });

    it('should reject with fallback message when none provided', () => {
      const event = {
        data: { parsedUnitId: 'W12345', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(of({ success: false }));
      component.onUnitPostValidate(event as any);
      expect(event.reject).toHaveBeenCalledWith('Unit validation failed');
    });

    it('should reject on service error', () => {
      const event = {
        data: { parsedUnitId: 'W12345', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(throwError(() => new Error('Network error')));
      component.onUnitPostValidate(event as any);
      expect(event.reject).toHaveBeenCalledWith('Unit validation failed');
    });

    it('should set row1ProductCodeOptions from components', () => {
      const event = {
        data: { parsedUnitId: 'W12345', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: true,
        item: {
          unitId: 'W12345',
          collDate: '2025-01-01',
          components: [
            { productCode: 'E0791', productDescription: 'RBC', componentPrefix: '01' },
            { productCode: 'E0792', productDescription: 'PLT', componentPrefix: '02' }
          ]
        }
      }));
      component.onUnitPostValidate(event as any);
      expect(component.row1ProductCodeOptions().length).toBe(2);
      expect(component.row1ProductCodeOptions()[0]).toEqual({ code: 'E0791', description: 'RBC' });
    });

    it('should handle null parsedUnitId gracefully', () => {
      const event = {
        data: { parsedUnitId: null, codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: true,
        item: {
          unitId: 'W12345',
          collDate: '2025-01-01',
          components: [{ productCode: 'E0791', productDescription: 'RBC', componentPrefix: '01' }]
        }
      }));
      component.onUnitPostValidate(event as any);
      expect(component.phase1ParsedUnitId()).toBe('');
    });
  });

  describe('onUnitValidated', () => {
    it('should be a no-op method', () => {
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });
  });

  describe('onUnitCleared', () => {
    it('should call clearAll and set phase to ready when printer and config exist', () => {
      spyOn(component, 'clearAll').and.callThrough();
      component.printerContext.set({ labelPrinterCode: 'LP1' } as any);
      component.chapterConfig.set({ chapterId: 'C1' } as any);
      component.onUnitCleared();
      expect(component.clearAll).toHaveBeenCalled();
      expect(component.phase()).toBe('ready');
    });

    it('should not set phase to ready when no printer context', () => {
      component.printerContext.set(null);
      component.chapterConfig.set({ chapterId: 'C1' } as any);
      component.phase.set('init');
      component.onUnitCleared();
      expect(component.phase()).not.toBe('ready');
    });

    it('should not set phase to ready when no chapter config', () => {
      component.printerContext.set({ labelPrinterCode: 'LP1' } as any);
      component.chapterConfig.set(null);
      component.phase.set('init');
      component.onUnitCleared();
      expect(component.phase()).not.toBe('ready');
    });
  });

  describe('onClearAll', () => {
    it('should clear all state and set phase to ready', () => {
      spyOn(component, 'clearAll').and.callThrough();
      component.onClearAll();
      expect(component.clearAll).toHaveBeenCalled();
      expect(component.phase()).toBe('ready');
    });
  });

  describe('onVerifyUnitPostValidate', () => {
    it('should confirm when unit ID matches', () => {
      component.phase1ParsedUnitId.set('W12345');
      const event = {
        data: { parsedUnitId: 'W12345', manualUnitId: 'W12345-1' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onVerifyUnitPostValidate(event as any);
      expect(event.confirm).toHaveBeenCalled();
      expect(event.reject).not.toHaveBeenCalled();
    });

    it('should reject with error 1508 when unit ID does not match', () => {
      component.phase1ParsedUnitId.set('W12345');
      const event = {
        data: { parsedUnitId: 'W99999', manualUnitId: 'W99999' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onVerifyUnitPostValidate(event as any);
      expect(event.reject).toHaveBeenCalledWith('Unit ID does not match (Error 1508).');
      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1508'));
    });

    it('should set verifyParsedUnitId and patch form', () => {
      component.phase1ParsedUnitId.set('W12345');
      const event = {
        data: { parsedUnitId: 'W12345', manualUnitId: 'W12345-MANUAL' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onVerifyUnitPostValidate(event as any);
      expect(component.verifyParsedUnitId()).toBe('W12345');
    });

    it('should use parsedUnitId as fallback when manualUnitId is missing', () => {
      component.phase1ParsedUnitId.set('W12345');
      const event = {
        data: { parsedUnitId: 'W12345' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onVerifyUnitPostValidate(event as any);
      expect(event.confirm).toHaveBeenCalled();
    });
  });

  describe('onVerifyUnitValidated', () => {
    it('should call tryAutoVerify', () => {
      spyOn(component as any, 'tryAutoVerify');
      component.onVerifyUnitValidated({} as any);
      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });
  });

  describe('onVerifyUnitCleared', () => {
    it('should clear scanUnitId form value and field error', () => {
      component.verificationForm.get('scanUnitId')?.enable();
      component.verificationForm.patchValue({ scanUnitId: 'W12345' });
      component.fieldErrors['scanUnitId'] = 'some error';
      component.onVerifyUnitCleared();
      expect(component.verificationForm.getRawValue().scanUnitId).toBe('');
      expect(component.fieldErrors['scanUnitId']).toBe('');
    });
  });

  describe('parseAbo', () => {
    it('should return option on successful validation', (done) => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true,
        item: { aboCode: 'A', aboShortName: 'A Positive' }
      }));
      component.parseAbo('=A+').subscribe(result => {
        expect(result).toEqual({ code: 'A', description: 'A Positive' });
        done();
      });
    });

    it('should throw on failed validation', (done) => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: false,
        errorResponse: { error: 'Bad ABO' }
      }));
      component.parseAbo('INVALID').subscribe({
        error: (err: any) => {
          expect(err.message).toBe('Bad ABO');
          done();
        }
      });
    });

    it('should use message as fallback error', (done) => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: false,
        message: 'fallback msg'
      }));
      component.parseAbo('INVALID').subscribe({
        error: (err: any) => {
          expect(err.message).toBe('fallback msg');
          done();
        }
      });
    });

    it('should use default error message when no error info', (done) => {
      labelScanSpy.validateAboScan.and.returnValue(of({ success: false }));
      component.parseAbo('INVALID').subscribe({
        error: (err: any) => {
          expect(err.message).toBe('Invalid ABO code');
          done();
        }
      });
    });

    it('should handle null aboShortName', (done) => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true,
        item: { aboCode: 'O', aboShortName: null }
      }));
      component.parseAbo('=O').subscribe(result => {
        expect(result).toEqual({ code: 'O', description: '' });
        done();
      });
    });
  });

  describe('parseProductCode', () => {
    it('should return option on success', (done) => {
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: true,
        item: { productCode: 'E0791', productDescription: 'RBC' }
      }));
      component.parseProductCode('E0791').subscribe(result => {
        expect(result).toEqual({ code: 'E0791', description: 'RBC' });
        done();
      });
    });

    it('should throw on failure', (done) => {
      labelScanSpy.validateProductScan.and.returnValue(of({ success: false }));
      component.parseProductCode('BAD').subscribe({
        error: (err: any) => {
          expect(err.message).toBe('Invalid product code');
          done();
        }
      });
    });
  });

  describe('parseSpTest', () => {
    it('should return option on success', (done) => {
      labelScanSpy.validateSpTestScan.and.returnValue(of({
        success: true,
        item: { spTestCode: 'ST1', description: 'Special Test 1' }
      }));
      component.parseSpTest('ST1').subscribe(result => {
        expect(result).toEqual({ code: 'ST1', description: 'Special Test 1' });
        done();
      });
    });

    it('should throw on failure', (done) => {
      labelScanSpy.validateSpTestScan.and.returnValue(of({ success: false }));
      component.parseSpTest('BAD').subscribe({
        error: (err: any) => {
          expect(err.message).toBe('Invalid SP test code');
          done();
        }
      });
    });
  });

  describe('onAboFieldChanged', () => {
    it('should clear form value and description when option is null', () => {
      component.onAboFieldChanged(null);
      expect(component.verificationForm.getRawValue().scanAbo).toBe('');
      expect(component.scannedAboDescription()).toBe('');
    });

    it('should set aboField error on mismatch', () => {
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'B' });
      const aboFieldSpy = jasmine.createSpyObj('ScanSelectFieldComponent', ['setError', 'focus']);
      (component as any).aboField = aboFieldSpy;
      component.onAboFieldChanged({ code: 'O', description: 'O Negative' });
      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1509'));
      expect(aboFieldSpy.setError).toHaveBeenCalled();
      expect(component.scannedAboDescription()).toBe('');
    });
  });

  describe('onAboFieldCleared', () => {
    it('should clear scanAbo value and description', () => {
      component.verificationForm.get('scanAbo')?.enable();
      component.verificationForm.patchValue({ scanAbo: 'A' });
      component.scannedAboDescription.set('A Positive');
      component.onAboFieldCleared();
      expect(component.verificationForm.getRawValue().scanAbo).toBe('');
      expect(component.scannedAboDescription()).toBe('');
    });
  });

  describe('onSpecialTestFieldChanged', () => {
    it('should clear field error and patch form when null', () => {
      component.onSpecialTestFieldChanged(null);
      expect(component.verificationForm.getRawValue().scanSpecialTest).toBe('');
    });

    it('should show error 4300 when special test code does not match', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'ST1' });
      const stFieldSpy = jasmine.createSpyObj('ScanSelectFieldComponent', ['setError', 'focus']);
      (component as any).specialTestField = stFieldSpy;
      component.onSpecialTestFieldChanged({ code: 'ST9', description: 'Wrong' });
      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('4300'));
      expect(stFieldSpy.setError).toHaveBeenCalled();
    });

    it('should accept when special test code matches', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'ST1' });
      spyOn(component as any, 'tryAutoVerify');
      component.onSpecialTestFieldChanged({ code: 'ST1', description: 'Matching' });
      expect(snackbarSpy.showError).not.toHaveBeenCalled();
      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should accept when no expected special test code', () => {
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: null });
      spyOn(component as any, 'tryAutoVerify');
      component.onSpecialTestFieldChanged({ code: 'ST1', description: 'Test' });
      expect(snackbarSpy.showError).not.toHaveBeenCalled();
    });
  });

  describe('onSpecialTestFieldCleared', () => {
    it('should clear scanSpecialTest form value', () => {
      component.verificationForm.get('scanSpecialTest')?.enable();
      component.verificationForm.patchValue({ scanSpecialTest: 'ST1' });
      component.onSpecialTestFieldCleared();
      expect(component.verificationForm.getRawValue().scanSpecialTest).toBe('');
    });
  });

  describe('loadAntigens', () => {
    it('should set antigens from response.data', () => {
      const antigens = [{ antigenCode: 'D', antigenResult: 'POS' }];
      serviceSpy.getAntigens.and.returnValue(of({ data: antigens }));
      (component as any).loadAntigens('W12345', '2025-01-01');
      expect(component.antigens()).toEqual(antigens as any);
      expect(component.antigenPanelOpen()).toBe(true);
    });

    it('should set antigens from response.item when data is missing', () => {
      const antigens = [{ antigenCode: 'C', antigenResult: 'NEG' }];
      serviceSpy.getAntigens.and.returnValue(of({ item: antigens }));
      (component as any).loadAntigens('W12345', '2025-01-01');
      expect(component.antigens()).toEqual(antigens as any);
    });

    it('should set empty array when response data is not an array', () => {
      serviceSpy.getAntigens.and.returnValue(of({ data: null }));
      (component as any).loadAntigens('W12345', '2025-01-01');
      expect(component.antigens()).toEqual([]);
      expect(component.antigenPanelOpen()).toBe(true);
    });

    it('should set empty array and open panel on error', () => {
      serviceSpy.getAntigens.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadAntigens('W12345', '2025-01-01');
      expect(component.antigens()).toEqual([]);
      expect(component.antigenPanelOpen()).toBe(true);
    });
  });

  describe('autoSelectProductAfterPanel', () => {
    it('should do nothing when no unit data', () => {
      component.unitData.set(null);
      (component as any).autoSelectProductAfterPanel();
      expect(component.selectedComponent()).toBeNull();
    });

    it('should focus row1ProductCodeField when unit data exists', () => {
      component.unitData.set(mockUnitData as any);
      const fieldSpy = jasmine.createSpyObj('ScanSelectFieldComponent', ['setValue', 'blur', 'focus']);
      (component as any).row1ProductCodeField = fieldSpy;
      (component as any).autoSelectProductAfterPanel();
      expect(fieldSpy.focus).toHaveBeenCalled();
    });

    it('should focus product code field when multiple components', () => {
      const multiData = {
        ...mockUnitData,
        components: [
          { productCode: 'E0791', productDescription: 'RBC', componentPrefix: '01' },
          { productCode: 'E0792', productDescription: 'PLT', componentPrefix: '02' }
        ]
      };
      component.unitData.set(multiData as any);
      const fieldSpy = jasmine.createSpyObj('ScanSelectFieldComponent', ['focus', 'setValue', 'blur']);
      (component as any).row1ProductCodeField = fieldSpy;
      (component as any).autoSelectProductAfterPanel();
      expect(fieldSpy.focus).toHaveBeenCalled();
      expect(component.selectedComponent()).toBeNull();
    });
  });

  describe('onProductCodeChange', () => {
    it('should set selectedComponent and call proceedToProcessLabel', () => {
      const comp = { productCode: 'E0791', componentPrefix: '01' } as any;
      component.unitData.set(mockUnitData as any);
      serviceSpy.processLabel.and.returnValue(of({ success: true, item: mockLabelResult }));
      component.onProductCodeChange(comp);
      expect(component.selectedComponent()).toBe(comp);
    });
  });

  describe('onRow1ProductCodeChanged', () => {
    it('should do nothing when option is null', () => {
      component.unitData.set(mockUnitData as any);
      component.onRow1ProductCodeChanged(null);
      expect(component.selectedComponent()).toBeNull();
    });

    it('should set matching component and proceed', () => {
      component.unitData.set(mockUnitData as any);
      serviceSpy.processLabel.and.returnValue(of({ success: true, item: mockLabelResult }));
      component.onRow1ProductCodeChanged({ code: 'E0791', description: 'RBC' });
      expect(component.selectedComponent()).toEqual(mockUnitData.components[0]);
    });

    it('should not proceed when no matching component', () => {
      component.unitData.set(mockUnitData as any);
      component.onRow1ProductCodeChanged({ code: 'NOMATCH', description: 'None' });
      expect(component.selectedComponent()).toBeNull();
    });
  });

  describe('proceedToProcessLabel', () => {
    it('should not proceed when unit is null', () => {
      component.unitData.set(null);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      (component as any).processingLabel = false;
      (component as any).proceedToProcessLabel();
      expect(serviceSpy.processLabel).not.toHaveBeenCalled();
    });

    it('should not proceed when component is null', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(null);
      (component as any).processingLabel = false;
      (component as any).proceedToProcessLabel();
      expect(serviceSpy.processLabel).not.toHaveBeenCalled();
    });

    it('should not proceed when already processing', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      (component as any).processingLabel = true;
      (component as any).proceedToProcessLabel();
      // processLabel should have been called once max (from any prior call), not again
      expect(component.loading()).toBe(false);
    });
  });

  describe('callProcessLabel', () => {
    beforeEach(() => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.printerContext.set({ labelPrinterCode: 'LP1', tieTagPrinterCode: 'TT1' } as any);
    });

    it('should build request with empty antigenSelections as null', () => {
      component.antigenSelections.set([]);
      component.processLabelOverrides.set([]);
      serviceSpy.processLabel.and.returnValue(of({ success: true, item: mockLabelResult }));
      (component as any).callProcessLabel();
      expect(serviceSpy.processLabel).toHaveBeenCalledWith(jasmine.objectContaining({
        antigenSelections: null,
        overrides: null,
        agPrinterId: 'TT1'
      }));
    });

    it('should set overrides from processLabelOverrides when present', () => {
      component.processLabelOverrides.set(['OVR1']);
      component.antigenSelections.set([]);
      serviceSpy.processLabel.and.returnValue(of({ success: true, item: mockLabelResult }));
      (component as any).callProcessLabel();
      expect(serviceSpy.processLabel).toHaveBeenCalledWith(jasmine.objectContaining({
        overrides: ['OVR1']
      }));
    });

    it('should handle warning response by opening dialog', () => {
      const warningResult = {
        ...mockLabelResult,
        isWarning: true,
        warningCode: 'WARN1',
        warningMessage: 'Product expired'
      };
      serviceSpy.processLabel.and.returnValue(of({ success: true, item: warningResult }));
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: false, codes: [] }));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      const fieldSpy = jasmine.createSpyObj('ScanSelectFieldComponent', ['blur']);
      (component as any).row1ProductCodeField = fieldSpy;

      (component as any).callProcessLabel();

      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should retry callProcessLabel when dialog override is true', () => {
      const warningResult = {
        ...mockLabelResult,
        isWarning: true,
        warningCode: 'WARN1',
        warningMessage: 'Product expired'
      };
      let callCount = 0;
      serviceSpy.processLabel.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return of({ success: true, item: warningResult });
        }
        return of({ success: true, item: mockLabelResult });
      });
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: true, codes: ['WARN1'] }));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      const fieldSpy = jasmine.createSpyObj('ScanSelectFieldComponent', ['blur']);
      (component as any).row1ProductCodeField = fieldSpy;

      (component as any).callProcessLabel();

      expect(serviceSpy.processLabel).toHaveBeenCalledTimes(2);
      expect(component.processLabelOverrides()).toContain('WARN1');
    });

    it('should not proceed on unsuccessful response', () => {
      serviceSpy.processLabel.and.returnValue(of({ success: false }));
      (component as any).callProcessLabel();
      expect(component.labelResult()).toBeNull();
    });

    it('should handle service error', () => {
      component.loading.set(true);
      serviceSpy.processLabel.and.returnValue(throwError(() => new Error('fail')));
      (component as any).callProcessLabel();
      expect(component.loading()).toBe(false);
      expect((component as any).processingLabel).toBe(false);
    });

    it('should use default warning message when warningMessage is null', () => {
      const warningResult = {
        ...mockLabelResult,
        isWarning: true,
        warningCode: 'WARN1',
        warningMessage: null
      };
      serviceSpy.processLabel.and.returnValue(of({ success: true, item: warningResult }));
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      const fieldSpy = jasmine.createSpyObj('ScanSelectFieldComponent', ['blur']);
      (component as any).row1ProductCodeField = fieldSpy;

      (component as any).callProcessLabel();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            warnings: [{ code: 'WARN1', message: 'Warning' }]
          })
        })
      );
    });
  });

  describe('showWarningDialog', () => {
    it('should call callback with false when dialog returns null', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      const callback = jasmine.createSpy('callback');

      (component as any).showWarningDialog('Title', [{ code: 'W1', message: 'Msg' }], callback);

      expect(callback).toHaveBeenCalledWith(false, []);
    });

    it('should call callback with override result when dialog returns result', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: true, codes: ['W1'] }));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      const callback = jasmine.createSpy('callback');

      (component as any).showWarningDialog('Title', [{ code: 'W1', message: 'Msg' }], callback);

      expect(callback).toHaveBeenCalledWith(true, ['W1']);
    });
  });

  describe('onReprint', () => {
    it('should do nothing when unit is null', () => {
      component.unitData.set(null);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.labelResult.set(mockLabelResult as any);
      component.onReprint();
      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should do nothing when component is null', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(null);
      component.labelResult.set(mockLabelResult as any);
      component.onReprint();
      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should do nothing when label result is null', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.labelResult.set(null);
      component.onReprint();
      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should call reprint service and show success on success', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.labelResult.set(mockLabelResult as any);
      serviceSpy.reprint.and.returnValue(of({ success: true }));
      component.onReprint();
      expect(serviceSpy.reprint).toHaveBeenCalledWith(jasmine.objectContaining({
        unitId: 'W12345',
        productCode: 'E0791',
        labelDecision: 'A'
      }));
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Label reprinted successfully.');
      expect(component.loading()).toBe(false);
    });

    it('should set loading false on reprint error', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.labelResult.set(mockLabelResult as any);
      serviceSpy.reprint.and.returnValue(throwError(() => new Error('fail')));
      component.onReprint();
      expect(component.loading()).toBe(false);
    });

    it('should not show success when reprint response is not successful', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.labelResult.set(mockLabelResult as any);
      serviceSpy.reprint.and.returnValue(of({ success: false }));
      component.onReprint();
      expect(snackbarSpy.showSuccess).not.toHaveBeenCalled();
    });
  });

  describe('showScanError', () => {
    it('should show error via snackbar', () => {
      (component as any).showScanError('1234', 'Some error');
      expect(snackbarSpy.showError).toHaveBeenCalledWith('1234: Some error');
    });

    it('should set form control error when controlName is provided', () => {
      component.verificationForm.get('scanAbo')?.enable();
      (component as any).showScanError('1509', 'ABO mismatch', 'scanAbo');
      const control = component.verificationForm.get('scanAbo');
      expect(control!.errors).toEqual({ scanError: true });
      expect(control!.touched).toBe(true);
    });

    it('should not set control error when no controlName', () => {
      (component as any).showScanError('9999', 'No control');
      // no control modification should happen - just the snackbar
      expect(snackbarSpy.showError).toHaveBeenCalledWith('9999: No control');
    });
  });

  describe('clearFieldError', () => {
    it('should clear field error and form control errors', () => {
      component.fieldErrors['scanUnitId'] = 'some error';
      component.verificationForm.get('scanUnitId')?.enable();
      component.verificationForm.get('scanUnitId')?.setErrors({ scanError: true });
      (component as any).clearFieldError('scanUnitId');
      expect(component.fieldErrors['scanUnitId']).toBe('');
      expect(component.verificationForm.get('scanUnitId')!.errors).toBeNull();
    });
  });

  describe('onAutoScan', () => {
    it('should blur input when value matches scan pattern', () => {
      const mockInput = { value: '=A+00000000000000', blur: jasmine.createSpy('blur') };
      const event = { target: mockInput } as any;
      const patterns = [{ prefix: '=', length: 17 }] as any;
      component.onAutoScan(event, patterns);
      expect(mockInput.blur).toHaveBeenCalled();
    });

    it('should not blur input when value does not match scan pattern', () => {
      const mockInput = { value: 'short', blur: jasmine.createSpy('blur') };
      const event = { target: mockInput } as any;
      const patterns = [{ prefix: '=', length: 17 }] as any;
      component.onAutoScan(event, patterns);
      expect(mockInput.blur).not.toHaveBeenCalled();
    });
  });

  describe('onScanUnitAboBlur', () => {
    beforeEach(() => {
      (component as any).enableVerificationFields();
    });

    it('should do nothing when scan value is empty', () => {
      component.verificationForm.patchValue({ scanUnitAbo: '' });
      component.onScanUnitAboBlur();
      expect(labelScanSpy.validateUnitAboScan).not.toHaveBeenCalled();
    });

    it('should do nothing when scan value is only whitespace', () => {
      component.verificationForm.patchValue({ scanUnitAbo: '   ' });
      component.onScanUnitAboBlur();
      expect(labelScanSpy.validateUnitAboScan).not.toHaveBeenCalled();
    });

    it('should process successful unit+ABO scan', () => {
      component.phase1ParsedUnitId.set('W12345');
      component.labelResult.set(mockLabelResult as any);
      component.verificationForm.patchValue({ scanUnitAbo: '=W12345A+' });
      const verifyFieldSpy = jasmine.createSpyObj('UnitIdFieldComponent', ['setValue']);
      const aboFieldSpy = jasmine.createSpyObj('ScanSelectFieldComponent', ['setValue']);
      (component as any).verifyUnitIdField = verifyFieldSpy;
      (component as any).aboField = aboFieldSpy;

      labelScanSpy.validateUnitAboScan.and.returnValue(of({
        success: true,
        item: { parsedUnitId: 'W12345', aboCode: 'A', manualUnitId: 'W12345-M', aboDescription: 'A Positive' }
      }));

      component.onScanUnitAboBlur();

      expect(component.verifyParsedUnitId()).toBe('W12345');
      expect(component.scannedAboDescription()).toBe('A Positive');
      expect(verifyFieldSpy.setValue).toHaveBeenCalledWith('W12345-M');
      expect(aboFieldSpy.setValue).toHaveBeenCalledWith('A');
    });

    it('should show error 1508 when unit ID does not match', () => {
      component.phase1ParsedUnitId.set('W99999');
      component.verificationForm.patchValue({ scanUnitAbo: '=W12345A+' });
      labelScanSpy.validateUnitAboScan.and.returnValue(of({
        success: true,
        item: { parsedUnitId: 'W12345', aboCode: 'A', manualUnitId: 'W12345' }
      }));

      component.onScanUnitAboBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1508'));
    });

    it('should show error 1509 when ABO does not match', () => {
      component.phase1ParsedUnitId.set('W12345');
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'B' });
      component.verificationForm.patchValue({ scanUnitAbo: '=W12345A+' });
      labelScanSpy.validateUnitAboScan.and.returnValue(of({
        success: true,
        item: { parsedUnitId: 'W12345', aboCode: 'A', manualUnitId: 'W12345' }
      }));

      component.onScanUnitAboBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1509'));
    });

    it('should show error on failed validation', () => {
      component.verificationForm.patchValue({ scanUnitAbo: 'BAD' });
      labelScanSpy.validateUnitAboScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '6040', error: 'Bad scan' }
      }));

      component.onScanUnitAboBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('6040'));
    });

    it('should use fallback error code when errorResponse is missing', () => {
      component.verificationForm.patchValue({ scanUnitAbo: 'BAD' });
      labelScanSpy.validateUnitAboScan.and.returnValue(of({
        success: false,
        message: 'Fallback msg'
      }));

      component.onScanUnitAboBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6040: Fallback msg');
    });

    it('should reset fieldProcessing on error', () => {
      component.verificationForm.patchValue({ scanUnitAbo: 'BAD' });
      labelScanSpy.validateUnitAboScan.and.returnValue(throwError(() => new Error('net error')));
      component.onScanUnitAboBlur();
      expect(component.fieldProcessing['scanUnitAbo']).toBe(false);
    });
  });

  describe('onScanUnitIdBlur', () => {
    beforeEach(() => {
      (component as any).enableVerificationFields();
    });

    it('should do nothing when value is empty', () => {
      component.verificationForm.patchValue({ scanUnitId: '' });
      component.onScanUnitIdBlur();
      expect(labelScanSpy.validateUnitScan).not.toHaveBeenCalled();
    });

    it('should process successful scan and match unit ID', () => {
      component.phase1ParsedUnitId.set('W12345');
      component.verificationForm.patchValue({ scanUnitId: 'W12345' });
      labelScanSpy.validateUnitScan.and.returnValue(of({
        success: true,
        item: { parsedUnitId: 'W12345', manualUnitId: 'W12345-M' }
      }));
      spyOn(component as any, 'tryAutoVerify');

      component.onScanUnitIdBlur();

      expect(component.verifyParsedUnitId()).toBe('W12345');
      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should show error 1508 on unit ID mismatch', () => {
      component.phase1ParsedUnitId.set('W99999');
      component.verificationForm.patchValue({ scanUnitId: 'W12345' });
      labelScanSpy.validateUnitScan.and.returnValue(of({
        success: true,
        item: { parsedUnitId: 'W12345' }
      }));

      component.onScanUnitIdBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1508'));
    });

    it('should show error on failed validation', () => {
      component.verificationForm.patchValue({ scanUnitId: 'BAD' });
      labelScanSpy.validateUnitScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '1230', error: 'Bad unit' }
      }));

      component.onScanUnitIdBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1230'));
    });

    it('should use fallback error when no errorResponse', () => {
      component.verificationForm.patchValue({ scanUnitId: 'BAD' });
      labelScanSpy.validateUnitScan.and.returnValue(of({ success: false }));

      component.onScanUnitIdBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('1230: Invalid Unit ID');
    });

    it('should reset fieldProcessing on error', () => {
      component.verificationForm.patchValue({ scanUnitId: 'BAD' });
      labelScanSpy.validateUnitScan.and.returnValue(throwError(() => new Error('net error')));
      component.onScanUnitIdBlur();
      expect(component.fieldProcessing['scanUnitId']).toBe(false);
    });

    it('should use scanValue as fallback when parsedUnitId missing', () => {
      component.phase1ParsedUnitId.set('SCANVAL');
      component.verificationForm.patchValue({ scanUnitId: 'SCANVAL' });
      labelScanSpy.validateUnitScan.and.returnValue(of({
        success: true,
        item: { parsedUnitId: null }
      }));
      spyOn(component as any, 'tryAutoVerify');

      component.onScanUnitIdBlur();

      // parsedUnitId fallback is scanValue='SCANVAL'
      expect(component.fieldProcessing['scanUnitId']).toBe(false);
    });
  });

  describe('onScanAboBlur', () => {
    beforeEach(() => {
      (component as any).enableVerificationFields();
    });

    it('should do nothing when value is empty', () => {
      component.verificationForm.patchValue({ scanAbo: '' });
      component.onScanAboBlur();
      expect(labelScanSpy.validateAboScan).not.toHaveBeenCalled();
    });

    it('should process successful scan and match ABO', () => {
      component.labelResult.set(mockLabelResult as any);
      component.verificationForm.patchValue({ scanAbo: 'A' });
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true,
        item: { aboCode: 'A', aboShortName: 'A Pos' }
      }));
      spyOn(component as any, 'tryAutoVerify');

      component.onScanAboBlur();

      expect(component.scannedAboDescription()).toBe('A Pos');
      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should show error 1509 on ABO mismatch', () => {
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'B' });
      component.verificationForm.patchValue({ scanAbo: 'A' });
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true,
        item: { aboCode: 'A', aboShortName: 'A Pos' }
      }));

      component.onScanAboBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1509'));
    });

    it('should show error on failed validation', () => {
      component.verificationForm.patchValue({ scanAbo: 'BAD' });
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '6010', error: 'Bad ABO' }
      }));

      component.onScanAboBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('6010'));
    });

    it('should use fallback error when no errorResponse', () => {
      component.verificationForm.patchValue({ scanAbo: 'BAD' });
      labelScanSpy.validateAboScan.and.returnValue(of({ success: false }));

      component.onScanAboBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6010: Invalid ABO code');
    });

    it('should reset fieldProcessing on error', () => {
      component.verificationForm.patchValue({ scanAbo: 'BAD' });
      labelScanSpy.validateAboScan.and.returnValue(throwError(() => new Error('net error')));
      component.onScanAboBlur();
      expect(component.fieldProcessing['scanAbo']).toBe(false);
    });
  });

  describe('onScanProdExpBlur', () => {
    beforeEach(() => {
      (component as any).enableVerificationFields();
    });

    it('should do nothing when value is empty', () => {
      component.verificationForm.patchValue({ scanProdExp: '' });
      component.onScanProdExpBlur();
      expect(labelScanSpy.validateProductExpiryScan).not.toHaveBeenCalled();
    });

    it('should process successful scan and match product code', () => {
      component.labelResult.set(mockLabelResult as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.verificationForm.patchValue({ scanProdExp: '=E079120250601' });
      labelScanSpy.validateProductExpiryScan.and.returnValue(of({
        success: true,
        item: { productCode: 'E0791', expiryDate: '2025-06-01' }
      }));
      spyOn(component as any, 'tryAutoVerify');

      component.onScanProdExpBlur();

      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should show error 9728 on product mismatch', () => {
      component.labelResult.set({ ...mockLabelResult, labelProductCode: 'E0791' });
      component.verificationForm.patchValue({ scanProdExp: '=E079220250601' });
      labelScanSpy.validateProductExpiryScan.and.returnValue(of({
        success: true,
        item: { productCode: 'E0792', expiryDate: '2025-06-01' }
      }));

      component.onScanProdExpBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('9728'));
    });

    it('should show error on failed validation', () => {
      component.verificationForm.patchValue({ scanProdExp: 'BAD' });
      labelScanSpy.validateProductExpiryScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '9710', error: 'Bad scan' }
      }));

      component.onScanProdExpBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('9710'));
    });

    it('should use fallback error when no errorResponse', () => {
      component.verificationForm.patchValue({ scanProdExp: 'BAD' });
      labelScanSpy.validateProductExpiryScan.and.returnValue(of({ success: false }));

      component.onScanProdExpBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('9710: Invalid Product+Expiry scan');
    });

    it('should reset fieldProcessing on error', () => {
      component.verificationForm.patchValue({ scanProdExp: 'BAD' });
      labelScanSpy.validateProductExpiryScan.and.returnValue(throwError(() => new Error('net error')));
      component.onScanProdExpBlur();
      expect(component.fieldProcessing['scanProdExp']).toBe(false);
    });

    it('should fallback to selectedComponent productCode when labelProductCode is null', () => {
      component.labelResult.set({ ...mockLabelResult, labelProductCode: null });
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.verificationForm.patchValue({ scanProdExp: '=E079220250601' });
      labelScanSpy.validateProductExpiryScan.and.returnValue(of({
        success: true,
        item: { productCode: 'E0792', expiryDate: '2025-06-01' }
      }));

      component.onScanProdExpBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('9728'));
    });
  });

  describe('onScanProductCodeBlur', () => {
    beforeEach(() => {
      (component as any).enableVerificationFields();
    });

    it('should do nothing when value is empty', () => {
      component.verificationForm.patchValue({ scanProductCode: '' });
      component.onScanProductCodeBlur();
      expect(labelScanSpy.validateProductScan).not.toHaveBeenCalled();
    });

    it('should process successful scan and match product', () => {
      component.labelResult.set(mockLabelResult as any);
      component.verificationForm.patchValue({ scanProductCode: 'E0791' });
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: true,
        item: { productCode: 'E0791' }
      }));
      spyOn(component as any, 'tryAutoVerify');

      component.onScanProductCodeBlur();

      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should show error 9728 on product mismatch', () => {
      component.labelResult.set({ ...mockLabelResult, labelProductCode: 'E0791' });
      component.verificationForm.patchValue({ scanProductCode: 'E0792' });
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: true,
        item: { productCode: 'E0792' }
      }));

      component.onScanProductCodeBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('9728'));
    });

    it('should show error on failed validation', () => {
      component.verificationForm.patchValue({ scanProductCode: 'BAD' });
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '6035', error: 'Bad product' }
      }));

      component.onScanProductCodeBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('6035'));
    });

    it('should use fallback error when no errorResponse', () => {
      component.verificationForm.patchValue({ scanProductCode: 'BAD' });
      labelScanSpy.validateProductScan.and.returnValue(of({ success: false }));

      component.onScanProductCodeBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6035: Invalid product code');
    });

    it('should reset fieldProcessing on error', () => {
      component.verificationForm.patchValue({ scanProductCode: 'BAD' });
      labelScanSpy.validateProductScan.and.returnValue(throwError(() => new Error('net error')));
      component.onScanProductCodeBlur();
      expect(component.fieldProcessing['scanProductCode']).toBe(false);
    });
  });

  describe('onScanExpDateBlur', () => {
    beforeEach(() => {
      (component as any).enableVerificationFields();
    });

    it('should do nothing when value is empty', () => {
      component.verificationForm.patchValue({ scanExpDate: '' });
      component.onScanExpDateBlur();
      expect(labelScanSpy.validateExpiryScan).not.toHaveBeenCalled();
    });

    it('should process successful scan', () => {
      component.verificationForm.patchValue({ scanExpDate: '20250601' });
      labelScanSpy.validateExpiryScan.and.returnValue(of({
        success: true,
        item: { expiryDate: '2025-06-01' }
      }));
      spyOn(component as any, 'tryAutoVerify');

      component.onScanExpDateBlur();

      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should show error when validation fails', () => {
      component.verificationForm.patchValue({ scanExpDate: 'BAD' });
      labelScanSpy.validateExpiryScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '6030', error: 'Bad expiry' }
      }));

      component.onScanExpDateBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('6030'));
    });

    it('should show error when success but no expiryDate', () => {
      component.verificationForm.patchValue({ scanExpDate: 'NODATE' });
      labelScanSpy.validateExpiryScan.and.returnValue(of({
        success: true,
        item: { expiryDate: null }
      }));

      component.onScanExpDateBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('6030'));
    });

    it('should use fallback error when no errorResponse', () => {
      component.verificationForm.patchValue({ scanExpDate: 'BAD' });
      labelScanSpy.validateExpiryScan.and.returnValue(of({ success: false }));

      component.onScanExpDateBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('6030: Invalid expiry date');
    });

    it('should reset fieldProcessing on error', () => {
      component.verificationForm.patchValue({ scanExpDate: 'BAD' });
      labelScanSpy.validateExpiryScan.and.returnValue(throwError(() => new Error('net error')));
      component.onScanExpDateBlur();
      expect(component.fieldProcessing['scanExpDate']).toBe(false);
    });
  });

  describe('onScanSpecialTestBlur', () => {
    beforeEach(() => {
      (component as any).enableVerificationFields();
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'ST1' });
    });

    it('should do nothing when value is empty', () => {
      component.verificationForm.patchValue({ scanSpecialTest: '' });
      component.onScanSpecialTestBlur();
      expect(labelScanSpy.validateSpTestScan).not.toHaveBeenCalled();
    });

    it('should process successful scan and match', () => {
      component.verificationForm.patchValue({ scanSpecialTest: 'ST1' });
      labelScanSpy.validateSpTestScan.and.returnValue(of({
        success: true,
        item: { spTestCode: 'ST1' }
      }));
      spyOn(component as any, 'tryAutoVerify');

      component.onScanSpecialTestBlur();

      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should show error 4300 on special test mismatch', () => {
      component.verificationForm.patchValue({ scanSpecialTest: 'ST9' });
      labelScanSpy.validateSpTestScan.and.returnValue(of({
        success: true,
        item: { spTestCode: 'ST9' }
      }));

      component.onScanSpecialTestBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('4300'));
    });

    it('should show error on failed validation', () => {
      component.verificationForm.patchValue({ scanSpecialTest: 'BAD' });
      labelScanSpy.validateSpTestScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '4327', error: 'Bad SP test' }
      }));

      component.onScanSpecialTestBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('4327'));
    });

    it('should use fallback error when no errorResponse', () => {
      component.verificationForm.patchValue({ scanSpecialTest: 'BAD' });
      labelScanSpy.validateSpTestScan.and.returnValue(of({ success: false }));

      component.onScanSpecialTestBlur();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('4327: Invalid SP test code');
    });

    it('should reset fieldProcessing on error', () => {
      component.verificationForm.patchValue({ scanSpecialTest: 'BAD' });
      labelScanSpy.validateSpTestScan.and.returnValue(throwError(() => new Error('net error')));
      component.onScanSpecialTestBlur();
      expect(component.fieldProcessing['scanSpecialTest']).toBe(false);
    });
  });

  describe('tryAutoVerify', () => {
    beforeEach(() => {
      (component as any).enableVerificationFields();
    });

    it('should not proceed when field is processing', () => {
      component.fieldProcessing = { scanUnitId: true };
      spyOn(component as any, 'doVerificationComparison');
      (component as any).tryAutoVerify();
      expect((component as any).doVerificationComparison).not.toHaveBeenCalled();
    });

    it('should focus verifyUnitIdField when unitId is missing', () => {
      component.verificationForm.patchValue({ scanUnitId: '', scanAbo: 'A', scanProductCode: 'E0791' });
      const verifyFieldSpy = jasmine.createSpyObj('UnitIdFieldComponent', ['focus']);
      (component as any).verifyUnitIdField = verifyFieldSpy;
      (component as any).tryAutoVerify();
      expect(verifyFieldSpy.focus).toHaveBeenCalled();
    });

    it('should focus aboField when ABO is missing', () => {
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: '', scanProductCode: 'E0791' });
      const aboFieldSpy = jasmine.createSpyObj('ScanSelectFieldComponent', ['focus']);
      (component as any).aboField = aboFieldSpy;
      (component as any).tryAutoVerify();
      expect(aboFieldSpy.focus).toHaveBeenCalled();
    });

    it('should focus scanProdExpInput when product code is missing', (done) => {
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: '' });
      const inputSpy = { nativeElement: { focus: jasmine.createSpy('focus') } };
      (component as any).scanProdExpInput = inputSpy;
      (component as any).tryAutoVerify();
      setTimeout(() => {
        expect(inputSpy.nativeElement.focus).toHaveBeenCalled();
        done();
      });
    });

    it('should not proceed when labelResult is null', () => {
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0791' });
      component.labelResult.set(null);
      spyOn(component as any, 'doVerificationComparison');
      (component as any).tryAutoVerify();
      expect((component as any).doVerificationComparison).not.toHaveBeenCalled();
    });

    it('should not proceed when expiryDate exists but expDate is empty', () => {
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0791', scanExpDate: '' });
      component.labelResult.set({ ...mockLabelResult, expiryDate: '2025-06-01' });
      spyOn(component as any, 'doVerificationComparison');
      (component as any).tryAutoVerify();
      expect((component as any).doVerificationComparison).not.toHaveBeenCalled();
    });

    it('should focus specialTestField when specialTestingCode required but missing', () => {
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0791', scanExpDate: '01-JUN-2025', scanSpecialTest: '' });
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'ST1' });
      const stFieldSpy = jasmine.createSpyObj('ScanSelectFieldComponent', ['focus']);
      (component as any).specialTestField = stFieldSpy;
      (component as any).tryAutoVerify();
      expect(stFieldSpy.focus).toHaveBeenCalled();
    });

    it('should call doVerificationComparison when all fields present', () => {
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0791', scanExpDate: '01-JUN-2025' });
      component.labelResult.set({ ...mockLabelResult, expiryDate: '2025-06-01', specialTestingCode: null });
      spyOn(component as any, 'doVerificationComparison');
      (component as any).tryAutoVerify();
      expect((component as any).doVerificationComparison).toHaveBeenCalled();
    });
  });

  describe('doVerificationComparison', () => {
    beforeEach(() => {
      (component as any).enableVerificationFields();
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.phase1ParsedUnitId.set('W12345');
      component.verifyParsedUnitId.set('W12345');
      component.labelResult.set({
        ...mockLabelResult,
        labelDecision: 'A',
        labelProductCode: 'E0791',
        expiryDate: null,
        specialTestingCode: null
      });
    });

    it('should show error 1508 when unit ID does not match', () => {
      component.verifyParsedUnitId.set('W99999');
      component.verificationForm.patchValue({ scanUnitId: 'W99999', scanAbo: 'A', scanProductCode: 'E0791' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1508'));
    });

    it('should show error 1509 when ABO does not match', () => {
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'B', scanProductCode: 'E0791' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1509'));
    });

    it('should show error 9728 when product does not match', () => {
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0792' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('9728'));
    });

    it('should show error 1170 when expiryDate required but empty', () => {
      component.labelResult.set({ ...mockLabelResult, expiryDate: '2025-06-01', expiryDateDisplay: '01-JUN-2025' });
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0791', scanExpDate: '' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1170'));
    });

    it('should show error 1170 when expiry dates do not match', () => {
      component.labelResult.set({ ...mockLabelResult, expiryDate: '2025-06-01', expiryDateDisplay: '01-JUN-2025' });
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0791', scanExpDate: '02-JUN-2025' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1170'));
    });

    it('should show error 4300 when special test does not match', () => {
      component.labelResult.set({ ...mockLabelResult, expiryDate: null, specialTestingCode: 'ST1' });
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0791', scanSpecialTest: 'ST9' });

      (component as any).doVerificationComparison();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('4300'));
    });

    it('should call confirmVerification when all fields match', () => {
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));
      component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0791' });

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });

    it('should call confirmVerification with matching expiry', () => {
      component.labelResult.set({ ...mockLabelResult, expiryDate: '2025-06-01', expiryDateDisplay: '01-JUN-2025' });
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));
      component.verificationForm.patchValue({
        scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0791', scanExpDate: '01-JUN-2025'
      });

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });

    it('should call confirmVerification with matching special test', () => {
      component.labelResult.set({ ...mockLabelResult, expiryDate: null, specialTestingCode: 'ST1' });
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));
      component.verificationForm.patchValue({
        scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: 'E0791', scanSpecialTest: 'ST1'
      });

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });

    it('should return early when result is null', () => {
      component.labelResult.set(null);
      spyOn(component as any, 'confirmVerification');
      (component as any).doVerificationComparison();
      expect((component as any).confirmVerification).not.toHaveBeenCalled();
    });

    it('should return early when unit is null', () => {
      component.unitData.set(null);
      spyOn(component as any, 'confirmVerification');
      (component as any).doVerificationComparison();
      expect((component as any).confirmVerification).not.toHaveBeenCalled();
    });

    it('should use verifyParsedUnitId over form value', () => {
      component.verifyParsedUnitId.set('W12345');
      component.verificationForm.patchValue({ scanUnitId: 'WRONG', scanAbo: 'A', scanProductCode: 'E0791' });
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).doVerificationComparison();

      expect(serviceSpy.confirmVerification).toHaveBeenCalled();
    });
  });

  describe('confirmVerification', () => {
    it('should not call service when unit is null', () => {
      component.unitData.set(null);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.labelResult.set(mockLabelResult as any);
      (component as any).confirmVerification();
      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should not call service when component is null', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(null);
      component.labelResult.set(mockLabelResult as any);
      (component as any).confirmVerification();
      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should not call service when label result is null', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.labelResult.set(null);
      (component as any).confirmVerification();
      expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
    });

    it('should build request with isMfgProduct true when labelDecision is Mf', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.labelResult.set({ ...mockLabelResult, labelDecision: 'Mf' });
      serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

      (component as any).confirmVerification();

      expect(serviceSpy.confirmVerification).toHaveBeenCalledWith(jasmine.objectContaining({
        isMfgProduct: true
      }));
    });

    it('should set loading false on error', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.labelResult.set(mockLabelResult as any);
      serviceSpy.confirmVerification.and.returnValue(throwError(() => new Error('fail')));

      (component as any).confirmVerification();

      expect(component.loading()).toBe(false);
    });

    it('should not show success when response.success is false', () => {
      component.unitData.set(mockUnitData as any);
      component.selectedComponent.set(mockUnitData.components[0] as any);
      component.labelResult.set(mockLabelResult as any);
      serviceSpy.confirmVerification.and.returnValue(of({ success: false }));

      (component as any).confirmVerification();

      expect(snackbarSpy.showSuccess).not.toHaveBeenCalled();
    });
  });

  describe('formatExpiryDisplay', () => {
    it('should return empty string for null', () => {
      expect((component as any).formatExpiryDisplay(null)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect((component as any).formatExpiryDisplay('')).toBe('');
    });

    it('should return original value for invalid date', () => {
      expect((component as any).formatExpiryDisplay('not-a-date')).toBe('not-a-date');
    });

    it('should format date without time when hours and minutes are 0', () => {
      const result = (component as any).formatExpiryDisplay('2025-06-01T00:00:00');
      expect(result).toBe('01-JUN-2025');
    });

    it('should format date with time when hours or minutes are not 0', () => {
      const result = (component as any).formatExpiryDisplay('2025-06-01T14:30:00');
      expect(result).toBe('01-JUN-2025 14:30');
    });

    it('should pad single-digit day', () => {
      const result = (component as any).formatExpiryDisplay('2025-01-05T00:00:00');
      expect(result).toBe('05-JAN-2025');
    });

    it('should pad single-digit hours and minutes', () => {
      const result = (component as any).formatExpiryDisplay('2025-03-10T05:03:00');
      expect(result).toBe('10-MAR-2025 05:03');
    });
  });

  describe('stripCheckDigit', () => {
    it('should return empty string for empty input', () => {
      expect((component as any).stripCheckDigit('')).toBe('');
    });

    it('should strip check digit after last dash', () => {
      expect((component as any).stripCheckDigit('W12345-1')).toBe('W12345');
    });

    it('should return original value when no dash', () => {
      expect((component as any).stripCheckDigit('W12345')).toBe('W12345');
    });

    it('should handle value with dash at start', () => {
      expect((component as any).stripCheckDigit('-1')).toBe('-1');
    });

    it('should strip after last dash with multiple dashes', () => {
      expect((component as any).stripCheckDigit('A-B-C')).toBe('A-B');
    });
  });

  describe('loadLovData', () => {
    it('should load ABO values on call', () => {
      serviceSpy.getLovAboValues.and.returnValue(of({
        success: true,
        item: [{ code: 'A', description: 'A Type' }]
      }));
      component.labelResult.set(null);
      (component as any).loadLovData();
      expect(serviceSpy.getLovAboValues).toHaveBeenCalled();
      expect(component.aboLovOptions()).toEqual([{ code: 'A', description: 'A Type' }]);
    });

    it('should show error when ABO values fail', () => {
      serviceSpy.getLovAboValues.and.returnValue(throwError(() => new Error('fail')));
      component.labelResult.set(null);
      (component as any).loadLovData();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load ABO values');
    });

    it('should not set aboLovOptions when response is not successful', () => {
      serviceSpy.getLovAboValues.and.returnValue(of({ success: false }));
      component.labelResult.set(null);
      component.aboLovOptions.set([]);
      (component as any).loadLovData();
      expect(component.aboLovOptions()).toEqual([]);
    });

    it('should load special test codes when label result has specialTestingCode', () => {
      serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));
      serviceSpy.getLovSpecialTestCodes.and.returnValue(of({
        success: true,
        item: [{ code: 'ST1', description: 'Special Test 1' }]
      }));
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'ST1' });
      (component as any).loadLovData();
      expect(serviceSpy.getLovSpecialTestCodes).toHaveBeenCalled();
      expect(component.specialTestLovOptions()).toEqual([{ code: 'ST1', description: 'Special Test 1' }]);
    });

    it('should not load special test codes when no specialTestingCode', () => {
      serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: null });
      (component as any).loadLovData();
      expect(serviceSpy.getLovSpecialTestCodes).not.toHaveBeenCalled();
    });

    it('should show error when special test codes fail', () => {
      serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));
      serviceSpy.getLovSpecialTestCodes.and.returnValue(throwError(() => new Error('fail')));
      component.labelResult.set({ ...mockLabelResult, specialTestingCode: 'ST1' });
      (component as any).loadLovData();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load special test codes');
    });
  });

  describe('clearAll guard', () => {
    it('should prevent re-entrant clearing', () => {
      (component as any).clearing = true;
      const originalUnitData = { unitId: 'keep' } as any;
      component.unitData.set(originalUnitData);
      component.clearAll();
      expect(component.unitData()).toBe(originalUnitData);
    });

    it('should reset processingLabel flag', () => {
      (component as any).processingLabel = true;
      component.clearAll();
      expect((component as any).processingLabel).toBe(false);
    });

    it('should reset unitValidating flag', () => {
      (component as any).unitValidating = true;
      component.clearAll();
      expect((component as any).unitValidating).toBe(false);
    });

    it('should reset fieldErrors and fieldProcessing', () => {
      component.fieldErrors = { scanUnitId: 'error' };
      component.fieldProcessing = { scanUnitId: true };
      component.clearAll();
      expect(component.fieldErrors).toEqual({});
      expect(component.fieldProcessing).toEqual({});
    });

    it('should reset processLabelOverrides', () => {
      component.processLabelOverrides.set(['OVR1']);
      component.clearAll();
      expect(component.processLabelOverrides()).toEqual([]);
    });

    it('should reset row1ProductCodeOptions', () => {
      component.row1ProductCodeOptions.set([{ code: 'E0791', description: 'RBC' }]);
      component.clearAll();
      expect(component.row1ProductCodeOptions()).toEqual([]);
    });

    it('should reset scannedAboDescription', () => {
      component.scannedAboDescription.set('A Positive');
      component.clearAll();
      expect(component.scannedAboDescription()).toBe('');
    });
  });

  describe('initVerificationForm', () => {
    it('should create form with all expected controls', () => {
      const expectedControls = [
        'scanUnitAbo', 'scanUnitId', 'scanAbo', 'scanProdExp',
        'scanProductCode', 'scanExpDate', 'scanSpecialTest'
      ];
      expectedControls.forEach(name => {
        expect(component.verificationForm.get(name)).toBeTruthy();
      });
    });

    it('should initialize all controls as disabled', () => {
      Object.keys(component.verificationForm.controls).forEach(key => {
        expect(component.verificationForm.get(key)!.disabled).toBe(true);
      });
    });
  });

  describe('headerConfig', () => {
    it('should have correct breadcrumbs', () => {
      expect(component.headerConfig.breadcrumbs).toEqual([
        { label: 'Home', link: '/home' },
        { label: 'ABO Labeling - Antigens', link: null }
      ]);
    });
  });
});
