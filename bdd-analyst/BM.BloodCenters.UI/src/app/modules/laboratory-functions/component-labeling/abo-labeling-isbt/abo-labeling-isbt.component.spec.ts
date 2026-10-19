import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject, EMPTY } from 'rxjs';
import { AboLabelingIsbtComponent } from './abo-labeling-isbt.component';
import { AboLabelingIsbtService } from './services/abo-labeling-isbt.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderService } from '@shared/services/page-header.service';
import { signal } from '@angular/core';

describe('AboLabelingIsbtComponent', () => {
  let component: AboLabelingIsbtComponent;
  let fixture: ComponentFixture<AboLabelingIsbtComponent>;
  let serviceSpy: jasmine.SpyObj<AboLabelingIsbtService>;
  let labelScanSpy: jasmine.SpyObj<DonorLibLabelScanService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('AboLabelingIsbtService', [
      'validateAccess',
      'validateUnit',
      'processLabel',
      'reprint',
      'confirmVerification',
      'logAbandonedLabel',
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

    serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));
    serviceSpy.getLovSpecialTestCodes.and.returnValue(of({ success: true, item: [] }));
    serviceSpy.confirmVerification.and.returnValue(of({ success: true }));
    serviceSpy.reprint.and.returnValue(of({ success: true }));
    serviceSpy.logAbandonedLabel.and.returnValue(of({}));

    TestBed.configureTestingModule({
      imports: [AboLabelingIsbtComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FormBuilder,
        { provide: AboLabelingIsbtService, useValue: serviceSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PageHeaderService, useValue: jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], { pageHeaderData: signal(undefined) }) }
      ]
    });

    fixture = TestBed.createComponent(AboLabelingIsbtComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template binding errors */ }
  });

  afterEach(() => sessionStorage.clear());

  describe('Unit Scan Validation', () => {
    it('should reject unit when no components found', (done) => {
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

    it('should confirm and auto-select product when single component exists', (done) => {
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
      serviceSpy.processLabel.and.returnValue(of({
        success: true,
        item: { labelDecision: 'A', labelDecisionDisplay: 'A', rhDisplay: 'Pos', expiryDate: '2025-06-01' }
      }));

      // Act
      component.onUnitPostValidate(mockEvent as any);

      // Assert
      setTimeout(() => {
        expect(mockEvent.confirm).toHaveBeenCalled();
        expect(component.phase()).toBe('labeled');
        expect(component.selectedComponent()).toBeTruthy();
        done();
      });
    });

    it('should reject when API returns failure', (done) => {
      // Arrange
      const mockEvent = {
        data: { parsedUnitId: 'BAD', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: false,
        errorResponse: { message: 'Unit not found' }
      }));

      // Act
      component.onUnitPostValidate(mockEvent as any);

      // Assert
      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('Unit not found');
        done();
      });
    });
  });

  describe('ABO Verification', () => {
    it('should show error 1509 when ABO does not match label decision', () => {
      // Arrange
      component.labelResult.set({
        labelDecision: 'O',
        labelDecisionDisplay: 'O',
        rhDisplay: 'Neg'
      } as any);

      // Act
      component.onAboFieldChanged({ code: 'A', description: 'A' });

      // Assert
      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('1509')
      );
    });

    it('should not show error when ABO matches label decision', () => {
      // Arrange
      component.labelResult.set({
        labelDecision: 'A',
        labelDecisionDisplay: 'A',
        rhDisplay: 'Pos'
      } as any);

      // Act
      component.onAboFieldChanged({ code: 'A', description: 'A' });

      // Assert
      expect(snackbarSpy.showError).not.toHaveBeenCalled();
    });
  });

  describe('Verify Unit ID Matching', () => {
    it('should reject when verify unit ID does not match phase1 unit', () => {
      // Arrange
      component.phase1ParsedUnitId.set('W12345');
      const mockEvent = {
        data: { parsedUnitId: 'W99999', manualUnitId: 'W99999' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      // Act
      component.onVerifyUnitPostValidate(mockEvent as any);

      // Assert
      expect(mockEvent.reject).toHaveBeenCalledWith('Unit ID does not match (Error 1508).');
    });
  });

  describe('Reprint', () => {
    it('should block reprint when verification is in progress', () => {
      // Arrange
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.labelResult.set({ labelDecision: 'A' } as any);
      component.verificationForm.patchValue({ scanUnitId: 'W12345' });

      // Act
      component.onReprint();

      // Assert
      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('5308')
      );
    });
  });

  describe('Clear All and Abandoned Label', () => {
    it('should log abandoned label when clearing after label was called', () => {
      // Arrange
      component.doLabelCalled.set(true);
      component.phase.set('labeled');
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      serviceSpy.logAbandonedLabel.and.returnValue(of({}));

      // Act
      component.clearAll();

      // Assert
      expect(serviceSpy.logAbandonedLabel).toHaveBeenCalledWith(
        jasmine.objectContaining({ unitId: 'W12345', errorCode: '1506' })
      );
    });

    it('should reset all signals on clearAll', () => {
      // Arrange
      component.unitData.set({ unitId: 'X' } as any);
      component.labelResult.set({ labelDecision: 'A' } as any);
      component.phase1ParsedUnitId.set('X');
      component.isSecondScan.set(true);
      component.firstScanCompleted.set(true);

      // Act
      component.clearAll();

      // Assert
      expect(component.unitData()).toBeNull();
      expect(component.labelResult()).toBeNull();
      expect(component.phase1ParsedUnitId()).toBe('');
      expect(component.isSecondScan()).toBe(false);
      expect(component.firstScanCompleted()).toBe(false);
    });
  });

  describe('Printer Context Initialization', () => {
    it('should redirect to change printer when no printer context in storage', () => {
      // Arrange
      sessionStorage.removeItem('printerConfig');

      // Act
      const newFixture = TestBed.createComponent(AboLabelingIsbtComponent);
      try { newFixture.detectChanges(); } catch (e) { /* template */ }

      // Assert
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [jasmine.stringContaining('change-label-printer')],
        jasmine.objectContaining({ queryParams: jasmine.objectContaining({ returnUrl: jasmine.any(String) }) })
      );
    });
  });

  describe('Computed Signals', () => {
    describe('bloodTypeDisplay', () => {
      it('should return null when labelResult is null', () => {
        component.labelResult.set(null);
        expect(component.bloodTypeDisplay()).toBeNull();
      });

      it('should return normal display for standard label decision', () => {
        component.labelResult.set({
          labelDecision: 'A',
          labelDecisionDisplay: 'A',
          rhDisplay: 'Pos',
          intendedUse: 'Transfusion',
        } as any);
        component.isSecondScan.set(false);
        const result = component.bloodTypeDisplay();
        expect(result).toEqual({
          labelDecision: 'A',
          labelDecisionDisplay: 'A',
          rhDisplay: 'Pos',
          intendedUse: 'Transfusion',
        });
      });

      it('should return HOLD for Mq label decision', () => {
        component.labelResult.set({
          labelDecision: 'Mq',
          labelDecisionDisplay: 'Mq',
          rhDisplay: 'Pos',
          intendedUse: 'Transfusion',
        } as any);
        const result = component.bloodTypeDisplay();
        expect(result!.labelDecisionDisplay).toBe('HOLD');
        expect(result!.rhDisplay).toBe('');
        expect(result!.intendedUse).toBe('');
      });

      it('should return BIO for Mb label decision', () => {
        component.labelResult.set({
          labelDecision: 'Mb',
          labelDecisionDisplay: 'Mb',
          rhDisplay: 'Pos',
          intendedUse: 'Transfusion',
        } as any);
        const result = component.bloodTypeDisplay();
        expect(result!.labelDecisionDisplay).toBe('BIO');
        expect(result!.rhDisplay).toBe('');
        expect(result!.intendedUse).toBe('');
      });

      it('should return DISC for Md label decision', () => {
        component.labelResult.set({
          labelDecision: 'Md',
          labelDecisionDisplay: 'Md',
          rhDisplay: 'Neg',
          intendedUse: 'Research',
        } as any);
        const result = component.bloodTypeDisplay();
        expect(result!.labelDecisionDisplay).toBe('DISC');
        expect(result!.rhDisplay).toBe('');
        expect(result!.intendedUse).toBe('');
      });

      it('should return MFG for Mf label decision', () => {
        component.labelResult.set({
          labelDecision: 'Mf',
          labelDecisionDisplay: 'Mf',
          rhDisplay: 'Pos',
          intendedUse: 'Manufacturing',
        } as any);
        const result = component.bloodTypeDisplay();
        expect(result!.labelDecisionDisplay).toBe('MFG');
        expect(result!.rhDisplay).toBe('');
        expect(result!.intendedUse).toBe('');
      });

      it('should show intendedUse for directed bio (DB identifier)', () => {
        component.labelResult.set({
          labelDecision: 'Mb',
          labelDecisionDisplay: 'Mb',
          rhDisplay: 'Pos',
          intendedUse: 'BioHazard',
          identifierCode: 'DB',
        } as any);
        const result = component.bloodTypeDisplay();
        expect(result!.labelDecisionDisplay).toBe('BIO');
        expect(result!.intendedUse).toBe('BioHazard');
      });

      it('should use second scan values when isSecondScan is true', () => {
        component.labelResult.set({
          labelDecision: 'A',
          labelDecisionDisplay: 'A',
          rhDisplay: 'Pos',
          intendedUse: 'First',
          secondLabelDecision: 'B',
          secondLabelDecisionDisplay: 'B',
          secondRhDisplay: 'Neg',
          secondIntendedUse: 'Second',
        } as any);
        component.isSecondScan.set(true);
        const result = component.bloodTypeDisplay();
        expect(result!.labelDecision).toBe('B');
        expect(result!.labelDecisionDisplay).toBe('B');
        expect(result!.rhDisplay).toBe('Neg');
        expect(result!.intendedUse).toBe('Second');
      });

      it('should fallback to first scan values when second scan values are missing', () => {
        component.labelResult.set({
          labelDecision: 'A',
          labelDecisionDisplay: 'A',
          rhDisplay: 'Pos',
          intendedUse: 'First',
          secondLabelDecision: 'A',
        } as any);
        component.isSecondScan.set(true);
        const result = component.bloodTypeDisplay();
        expect(result!.labelDecision).toBe('A');
        expect(result!.rhDisplay).toBe('Pos');
        expect(result!.intendedUse).toBe('First');
      });
    });

    describe('row1ProductCodeDisabled', () => {
      it('should be true when phase is init', () => {
        component.phase.set('init');
        expect(component.row1ProductCodeDisabled()).toBe(true);
      });

      it('should be true when phase is ready', () => {
        component.phase.set('ready');
        expect(component.row1ProductCodeDisabled()).toBe(true);
      });

      it('should be false when phase is unit-validated', () => {
        component.phase.set('unit-validated');
        expect(component.row1ProductCodeDisabled()).toBe(false);
      });

      it('should be false when phase is labeled', () => {
        component.phase.set('labeled');
        expect(component.row1ProductCodeDisabled()).toBe(false);
      });
    });

    describe('isMfOrRplFlow', () => {
      it('should return false when labelResult is null', () => {
        component.labelResult.set(null);
        expect(component.isMfOrRplFlow()).toBe(false);
      });

      it('should return true for Mf labelDecision', () => {
        component.labelResult.set({ labelDecision: 'Mf', productType: 'WB' } as any);
        expect(component.isMfOrRplFlow()).toBe(true);
      });

      it('should return true for RPL productType', () => {
        component.labelResult.set({ labelDecision: 'A', productType: 'RPL' } as any);
        expect(component.isMfOrRplFlow()).toBe(true);
      });

      it('should return true for RPFF productType', () => {
        component.labelResult.set({ labelDecision: 'A', productType: 'RPFF' } as any);
        expect(component.isMfOrRplFlow()).toBe(true);
      });

      it('should return false for standard flow', () => {
        component.labelResult.set({ labelDecision: 'A', productType: 'WB' } as any);
        expect(component.isMfOrRplFlow()).toBe(false);
      });
    });

    describe('isVerificationStarted', () => {
      it('should return false when all fields empty', () => {
        component.verificationForm.patchValue({ scanUnitId: '', scanAbo: '', scanProductCode: '' });
        expect(component.isVerificationStarted()).toBe(false);
      });

      it('should return true when scanUnitId has value', () => {
        component.verificationForm.get('scanUnitId')!.enable();
        component.verificationForm.patchValue({ scanUnitId: 'W12345' });
        expect(component.isVerificationStarted()).toBe(true);
      });

      it('should return true when scanAbo has value', () => {
        component.verificationForm.get('scanAbo')!.enable();
        component.verificationForm.patchValue({ scanAbo: 'A' });
        expect(component.isVerificationStarted()).toBe(true);
      });

      it('should return true when scanProductCode has value', () => {
        component.verificationForm.get('scanProductCode')!.enable();
        component.verificationForm.patchValue({ scanProductCode: 'E0791' });
        expect(component.isVerificationStarted()).toBe(true);
      });
    });

    describe('reprintDisabled', () => {
      it('should be true when phase is not labeled', () => {
        component.phase.set('ready');
        component.loading.set(false);
        expect(component.reprintDisabled()).toBe(true);
      });

      it('should be true when loading', () => {
        component.phase.set('labeled');
        component.loading.set(true);
        expect(component.reprintDisabled()).toBe(true);
      });

      it('should be false when labeled, not loading, and verification not started', () => {
        component.phase.set('labeled');
        component.loading.set(false);
        expect(component.reprintDisabled()).toBe(false);
      });
    });
  });

  describe('isAnyFieldProcessing', () => {
    it('should return false when no fields are processing', () => {
      component.fieldProcessing = {};
      expect(component.isAnyFieldProcessing).toBe(false);
    });

    it('should return true when a field is processing', () => {
      component.fieldProcessing = { scanUnitId: true };
      expect(component.isAnyFieldProcessing).toBe(true);
    });

    it('should return false when all fields are done processing', () => {
      component.fieldProcessing = { scanUnitId: false, scanAbo: false };
      expect(component.isAnyFieldProcessing).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Initialization with valid printer context', () => {
    it('should set phase to ready when printer context and access validation succeed', () => {
      sessionStorage.setItem('labelPrinterContext', JSON.stringify({ labelPrinterCode: 'LP1' }));
      serviceSpy.validateAccess.and.returnValue(of({ success: true, item: { unitScheme: 'I' } }));

      (component as any).initScreen();

      expect(component.phase()).toBe('ready');
      expect(component.chapterConfig()).toEqual({ unitScheme: 'I' } as any);
      expect(component.loading()).toBe(false);
    });

    it('should remain loading false when validateAccess errors', () => {
      sessionStorage.setItem('labelPrinterContext', JSON.stringify({ labelPrinterCode: 'LP1' }));
      serviceSpy.validateAccess.and.returnValue(throwError(() => new Error('Server error')));

      (component as any).initScreen();

      expect(component.loading()).toBe(false);
    });

    it('should handle invalid JSON in sessionStorage gracefully', () => {
      sessionStorage.setItem('labelPrinterContext', 'not-valid-json');

      (component as any).initScreen();

      expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should not set phase to ready when validateAccess returns failure', () => {
      sessionStorage.setItem('labelPrinterContext', JSON.stringify({ labelPrinterCode: 'LP1' }));
      serviceSpy.validateAccess.and.returnValue(of({ success: false }));

      (component as any).initScreen();

      expect(component.phase()).toBe('init');
      expect(component.loading()).toBe(false);
    });
  });

  describe('Chapter Changes', () => {
    it('should clearAll and reinit on chapter change', () => {
      spyOn(component, 'clearAll');
      sessionStorage.setItem('labelPrinterContext', JSON.stringify({ labelPrinterCode: 'LP1' }));
      serviceSpy.validateAccess.and.returnValue(of({ success: true, item: { unitScheme: 'I' } }));

      chapterChanged$.next();

      expect(component.clearAll).toHaveBeenCalled();
    });
  });

  describe('enableVerificationFields', () => {
    beforeEach(() => {
      (component as any).initVerificationForm();
    });

    it('should enable all fields and disable specialTest when no specialTestingCode', () => {
      component.labelResult.set({ labelDecision: 'A', productType: 'WB' } as any);
      (component as any).enableVerificationFields();

      expect(component.verificationForm.get('scanUnitId')!.enabled).toBe(true);
      expect(component.verificationForm.get('scanAbo')!.enabled).toBe(true);
      expect(component.verificationForm.get('scanSpecialTest')!.disabled).toBe(true);
    });

    it('should enable specialTest when specialTestingCode is present', () => {
      component.labelResult.set({ labelDecision: 'A', productType: 'WB', specialTestingCode: 'SP1' } as any);
      (component as any).enableVerificationFields();

      expect(component.verificationForm.get('scanSpecialTest')!.enabled).toBe(true);
    });

    it('should disable exp fields for Mf flow', () => {
      component.labelResult.set({ labelDecision: 'Mf', productType: 'MFG' } as any);
      (component as any).enableVerificationFields();

      expect(component.verificationForm.get('scanExpDate')!.disabled).toBe(true);
      expect(component.verificationForm.get('scanProdExp')!.disabled).toBe(true);
      expect(component.verificationForm.get('scanCollDate')!.enabled).toBe(true);
      expect(component.verificationForm.get('colldate')!.enabled).toBe(true);
    });

    it('should disable coll date fields for non-Mf flow', () => {
      component.labelResult.set({ labelDecision: 'A', productType: 'WB' } as any);
      (component as any).enableVerificationFields();

      expect(component.verificationForm.get('scanCollDate')!.disabled).toBe(true);
      expect(component.verificationForm.get('colldate')!.disabled).toBe(true);
      expect(component.verificationForm.get('scanExpDate')!.enabled).toBe(true);
    });
  });

  describe('disableVerificationFields', () => {
    it('should disable all verification form controls', () => {
      component.verificationForm.get('scanUnitId')!.enable();
      component.verificationForm.get('scanAbo')!.enable();

      (component as any).disableVerificationFields();

      Object.keys(component.verificationForm.controls).forEach((key) => {
        expect(component.verificationForm.get(key)!.disabled).toBe(true);
      });
    });
  });

  describe('loadLovData', () => {
    it('should load ABO values successfully', () => {
      component.unitCodeScheme.set('I');
      serviceSpy.getLovAboValues.and.returnValue(of({
        success: true,
        item: [{ code: 'A', description: 'A Positive' }, { code: 'B', description: 'B Negative' }]
      }));
      component.labelResult.set({ labelDecision: 'A' } as any);

      (component as any).loadLovData();

      expect(serviceSpy.getLovAboValues).toHaveBeenCalledWith('I');
      expect(component.aboLovOptions().length).toBe(2);
      expect(component.aboLovOptions()[0]).toEqual({ code: 'A', description: 'A Positive' });
    });

    it('should show error when ABO values fail to load', () => {
      serviceSpy.getLovAboValues.and.returnValue(throwError(() => new Error('fail')));
      component.labelResult.set({ labelDecision: 'A' } as any);

      (component as any).loadLovData();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load ABO values');
    });

    it('should load special test codes when specialTestingCode is present', () => {
      serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));
      serviceSpy.getLovSpecialTestCodes.and.returnValue(of({
        success: true,
        item: [{ code: 'SP1', description: 'Special Test 1' }]
      }));
      component.labelResult.set({ labelDecision: 'A', specialTestingCode: 'SP1' } as any);

      (component as any).loadLovData();

      expect(serviceSpy.getLovSpecialTestCodes).toHaveBeenCalled();
      expect(component.specialTestLovOptions().length).toBe(1);
    });

    it('should not load special test codes when specialTestingCode is absent', () => {
      serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));
      component.labelResult.set({ labelDecision: 'A' } as any);

      (component as any).loadLovData();

      expect(serviceSpy.getLovSpecialTestCodes).not.toHaveBeenCalled();
    });

    it('should show error when special test codes fail to load', () => {
      serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));
      serviceSpy.getLovSpecialTestCodes.and.returnValue(throwError(() => new Error('fail')));
      component.labelResult.set({ labelDecision: 'A', specialTestingCode: 'SP1' } as any);

      (component as any).loadLovData();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load special test codes');
    });
  });

  describe('Unit Event Handlers', () => {
    it('should do nothing in onUnitValidated', () => {
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });

    it('should clear and set phase to ready on onUnitCleared when printer and config exist', () => {
      component.printerContext.set({ labelPrinterCode: 'LP1' } as any);
      component.chapterConfig.set({ unitScheme: 'I' } as any);
      component.phase.set('unit-validated');

      component.onUnitCleared();

      expect(component.phase()).toBe('ready');
    });

    it('should clear but not set phase to ready when no printer context', () => {
      component.printerContext.set(null);
      component.chapterConfig.set({ unitScheme: 'I' } as any);

      component.onUnitCleared();

      expect(component.unitData()).toBeNull();
    });

    it('should clear all and focus unit field on onClearAll', () => {
      component.unitIdField = { clear: jasmine.createSpy(), focus: jasmine.createSpy() } as any;
      component.unitData.set({ unitId: 'X' } as any);

      component.onClearAll();

      expect(component.phase()).toBe('ready');
      expect(component.unitIdField.clear).toHaveBeenCalled();
      expect(component.unitIdField.focus).toHaveBeenCalled();
    });

    it('should not double validate when unitValidating is true', () => {
      (component as any).unitValidating = true;
      const mockEvent = {
        data: { parsedUnitId: 'W12345', codeScheme: 'I' },
        confirm: jasmine.createSpy(),
        reject: jasmine.createSpy()
      };

      component.onUnitPostValidate(mockEvent as any);

      expect(serviceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should focus product code field when multiple components exist', (done) => {
      component.row1ProductCodeField = {
        focus: jasmine.createSpy(),
        setValue: jasmine.createSpy(),
        blur: jasmine.createSpy(),
        clear: jasmine.createSpy()
      } as any;
      const mockEvent = {
        data: { parsedUnitId: 'W12345', codeScheme: 'I' },
        confirm: jasmine.createSpy(),
        reject: jasmine.createSpy()
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: true,
        item: {
          unitId: 'W12345',
          collDate: '2025-01-01',
          components: [
            { productCode: 'E0791', productDescription: 'RBC', componentPrefix: '01' },
            { productCode: 'E0792', productDescription: 'Plasma', componentPrefix: '02' }
          ]
        }
      }));

      component.onUnitPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockEvent.confirm).toHaveBeenCalled();
        expect(component.phase()).toBe('unit-validated');
        expect(component.row1ProductCodeOptions().length).toBe(2);
        expect(component.row1ProductCodeField.focus).toHaveBeenCalled();
        done();
      });
    });

    it('should reject on validateUnit error', (done) => {
      const mockEvent = {
        data: { parsedUnitId: 'W12345', codeScheme: 'I' },
        confirm: jasmine.createSpy(),
        reject: jasmine.createSpy()
      };
      serviceSpy.validateUnit.and.returnValue(throwError(() => new Error('Network error')));

      component.onUnitPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('Unit validation failed');
        done();
      });
    });

    it('should use message when no errorResponse on failure', (done) => {
      const mockEvent = {
        data: { parsedUnitId: 'BAD', codeScheme: 'I' },
        confirm: jasmine.createSpy(),
        reject: jasmine.createSpy()
      };
      serviceSpy.validateUnit.and.returnValue(of({
        success: false,
        message: 'Custom failure message'
      }));

      component.onUnitPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('Custom failure message');
        done();
      });
    });
  });

  describe('Verify Unit Event Handlers', () => {
    it('should confirm when verify unit ID matches phase1 unit', () => {
      component.phase1ParsedUnitId.set('W12345');
      const mockEvent = {
        data: { parsedUnitId: 'W12345', manualUnitId: 'W12345' },
        confirm: jasmine.createSpy(),
        reject: jasmine.createSpy()
      };

      component.onVerifyUnitPostValidate(mockEvent as any);

      expect(mockEvent.confirm).toHaveBeenCalled();
      expect(mockEvent.reject).not.toHaveBeenCalled();
    });

    it('should call tryAutoVerify on onVerifyUnitValidated', () => {
      spyOn(component as any, 'tryAutoVerify');
      component.onVerifyUnitValidated({} as any);
      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should clear form value and error on onVerifyUnitCleared', () => {
      component.verificationForm.get('scanUnitId')!.enable();
      component.verificationForm.patchValue({ scanUnitId: 'W12345' });

      component.onVerifyUnitCleared();

      expect(component.verificationForm.getRawValue().scanUnitId).toBe('');
    });
  });

  describe('Field Change Handlers', () => {
    it('should clear ABO form value on onAboFieldCleared', () => {
      component.verificationForm.get('scanAbo')!.enable();
      component.verificationForm.patchValue({ scanAbo: 'A' });
      component.scannedAboDescription.set('Type A');

      component.onAboFieldCleared();

      expect(component.verificationForm.getRawValue().scanAbo).toBe('');
      expect(component.scannedAboDescription()).toBe('');
    });

    it('should clear and tryAutoVerify on matching ABO', () => {
      spyOn(component as any, 'tryAutoVerify');
      component.labelResult.set({ labelDecision: 'A' } as any);

      component.onAboFieldChanged({ code: 'A', description: 'A Positive' });

      expect(component.verificationForm.getRawValue().scanAbo).toBe('A');
      expect(component.scannedAboDescription()).toBe('A Positive');
      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should patch form with empty when null option for onAboFieldChanged', () => {
      spyOn(component as any, 'tryAutoVerify');
      component.onAboFieldChanged(null);

      expect(component.verificationForm.getRawValue().scanAbo).toBe('');
      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should show error 1509 and set ABO field error when ABO mismatches', () => {
      component.labelResult.set({ labelDecision: 'O' } as any);
      component.aboField = { setError: jasmine.createSpy(), clear: jasmine.createSpy() } as any;

      component.onAboFieldChanged({ code: 'A', description: 'A' });

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1509'));
      expect(component.aboField.setError).toHaveBeenCalled();
      expect(component.scannedAboDescription()).toBe('');
    });

    describe('Special Test Field', () => {
      it('should show error 4300 on special test mismatch', () => {
        component.labelResult.set({ specialTestingCode: 'SP1' } as any);
        component.specialTestField = { setError: jasmine.createSpy(), clear: jasmine.createSpy() } as any;

        component.onSpecialTestFieldChanged({ code: 'SP2', description: 'Wrong' });

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('4300'));
        expect(component.specialTestField.setError).toHaveBeenCalled();
      });

      it('should tryAutoVerify on special test match', () => {
        spyOn(component as any, 'tryAutoVerify');
        component.labelResult.set({ specialTestingCode: 'SP1' } as any);

        component.onSpecialTestFieldChanged({ code: 'SP1', description: 'Correct' });

        expect(snackbarSpy.showError).not.toHaveBeenCalled();
        expect((component as any).tryAutoVerify).toHaveBeenCalled();
      });

      it('should tryAutoVerify when null option for special test', () => {
        spyOn(component as any, 'tryAutoVerify');
        component.onSpecialTestFieldChanged(null);
        expect((component as any).tryAutoVerify).toHaveBeenCalled();
      });

      it('should clear special test form and error on onSpecialTestFieldCleared', () => {
        component.verificationForm.get('scanSpecialTest')!.enable();
        component.verificationForm.patchValue({ scanSpecialTest: 'SP1' });

        component.onSpecialTestFieldCleared();

        expect(component.verificationForm.getRawValue().scanSpecialTest).toBe('');
      });
    });

    describe('Product Code', () => {
      it('should set component and proceed on onProductCodeChange', () => {
        component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
        serviceSpy.processLabel.and.returnValue(of({
          success: true,
          item: { labelDecision: 'A', labelDecisionDisplay: 'A', rhDisplay: 'Pos' }
        }));
        const comp = { productCode: 'E0791', componentPrefix: '01' } as any;

        component.onProductCodeChange(comp);

        expect(component.selectedComponent()).toBe(comp);
        expect(serviceSpy.processLabel).toHaveBeenCalled();
      });

      it('should set component when matching product found in onRow1ProductCodeChanged', () => {
        component.unitData.set({
          unitId: 'W12345', collDate: '2025-01-01',
          components: [
            { productCode: 'E0791', productDescription: 'RBC', componentPrefix: '01' },
            { productCode: 'E0792', productDescription: 'Plasma', componentPrefix: '02' }
          ]
        } as any);
        serviceSpy.processLabel.and.returnValue(of({
          success: true,
          item: { labelDecision: 'A', labelDecisionDisplay: 'A', rhDisplay: 'Pos' }
        }));

        component.onRow1ProductCodeChanged({ code: 'E0791', description: 'RBC' });

        expect(component.selectedComponent()!.productCode).toBe('E0791');
        expect(serviceSpy.processLabel).toHaveBeenCalled();
      });

      it('should not proceed when no matching product in onRow1ProductCodeChanged', () => {
        component.unitData.set({
          unitId: 'W12345', collDate: '2025-01-01',
          components: [{ productCode: 'E0791', productDescription: 'RBC', componentPrefix: '01' }]
        } as any);

        component.onRow1ProductCodeChanged({ code: 'XXXXX', description: 'Unknown' });

        expect(serviceSpy.processLabel).not.toHaveBeenCalled();
      });

      it('should do nothing when null option in onRow1ProductCodeChanged', () => {
        component.onRow1ProductCodeChanged(null);
        expect(serviceSpy.processLabel).not.toHaveBeenCalled();
      });
    });
  });

  describe('Process Label', () => {
    beforeEach(() => {
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.row1ProductCodeField = { blur: jasmine.createSpy(), clear: jasmine.createSpy(), focus: jasmine.createSpy() } as any;
    });

    it('should not proceed when processingLabel is true', () => {
      (component as any).processingLabel = true;

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.processLabel).not.toHaveBeenCalled();
    });

    it('should not proceed when unitData is null', () => {
      component.unitData.set(null);
      (component as any).processingLabel = false;

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.processLabel).not.toHaveBeenCalled();
    });

    it('should not proceed when selectedComponent is null', () => {
      component.selectedComponent.set(null);
      (component as any).processingLabel = false;

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.processLabel).not.toHaveBeenCalled();
    });

    it('should show error for DU product type', () => {
      serviceSpy.processLabel.and.returnValue(of({
        success: true,
        item: { productType: 'DU01', labelDecision: 'A' }
      }));
      (component as any).processingLabel = false;

      (component as any).proceedToProcessLabel();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1527'));
    });

    it('should show warning dialog when result has warning', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      serviceSpy.processLabel.and.returnValue(of({
        success: true,
        item: { isWarning: true, warningCode: 'W001', warningMessage: 'Expired product' }
      }));
      (component as any).processingLabel = false;

      (component as any).proceedToProcessLabel();

      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should retry processLabel when warning is overridden', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: true, codes: ['W001'] }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      let callCount = 0;
      serviceSpy.processLabel.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return of({ success: true, item: { isWarning: true, warningCode: 'W001', warningMessage: 'Warning' } });
        }
        return of({ success: true, item: { labelDecision: 'A', labelDecisionDisplay: 'A', rhDisplay: 'Pos' } });
      });
      (component as any).processingLabel = false;

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.processLabel).toHaveBeenCalledTimes(2);
      expect(component.processLabelOverrides()).toContain('W001');
    });

    it('should not retry when warning is not overridden', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: false, codes: [] }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      serviceSpy.processLabel.and.returnValue(of({
        success: true,
        item: { isWarning: true, warningCode: 'W001', warningMessage: 'Warning' }
      }));
      (component as any).processingLabel = false;

      (component as any).proceedToProcessLabel();

      expect(serviceSpy.processLabel).toHaveBeenCalledTimes(1);
      expect((component as any).processingLabel).toBe(false);
    });

    it('should handle processLabel error', () => {
      serviceSpy.processLabel.and.returnValue(throwError(() => new Error('Server error')));
      (component as any).processingLabel = false;

      (component as any).proceedToProcessLabel();

      expect((component as any).processingLabel).toBe(false);
      expect(component.loading()).toBe(false);
    });

    it('should return early when response is not success', () => {
      serviceSpy.processLabel.and.returnValue(of({ success: false }));
      (component as any).processingLabel = false;

      (component as any).proceedToProcessLabel();

      expect(component.labelResult()).toBeNull();
      expect(component.loading()).toBe(false);
    });

    it('should set labeled phase on successful processLabel', () => {
      component.scanUnitAboInput = { nativeElement: { focus: jasmine.createSpy() } } as any;
      serviceSpy.processLabel.and.returnValue(of({
        success: true,
        item: { labelDecision: 'A', labelDecisionDisplay: 'A', rhDisplay: 'Pos', expiryDate: '2025-06-01' }
      }));
      serviceSpy.getLovAboValues.and.returnValue(of({ success: true, item: [] }));
      (component as any).processingLabel = false;

      (component as any).proceedToProcessLabel();

      expect(component.phase()).toBe('labeled');
      expect(component.doLabelCalled()).toBe(true);
      expect(component.labelResult()).toBeTruthy();
    });
  });

  describe('Reprint additional', () => {
    it('should reprint successfully', () => {
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.labelResult.set({ labelDecision: 'A' } as any);
      serviceSpy.reprint.and.returnValue(of({ success: true }));

      component.onReprint();

      expect(serviceSpy.reprint).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Label reprinted successfully.');
      expect(component.loading()).toBe(false);
    });

    it('should do nothing when unitData is null', () => {
      component.unitData.set(null);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.labelResult.set({ labelDecision: 'A' } as any);

      component.onReprint();

      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should do nothing when selectedComponent is null', () => {
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set(null);
      component.labelResult.set({ labelDecision: 'A' } as any);

      component.onReprint();

      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should do nothing when labelResult is null', () => {
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.labelResult.set(null);

      component.onReprint();

      expect(serviceSpy.reprint).not.toHaveBeenCalled();
    });

    it('should handle reprint error', () => {
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
      component.labelResult.set({ labelDecision: 'A' } as any);
      serviceSpy.reprint.and.returnValue(throwError(() => new Error('fail')));

      component.onReprint();

      expect(component.loading()).toBe(false);
    });
  });

  describe('Scan Blur Handlers', () => {
    describe('onScanUnitAboBlur', () => {
      beforeEach(() => {
        component.verificationForm.get('scanUnitAbo')!.enable();
      });

      it('should do nothing when scanUnitAbo is empty', () => {
        component.verificationForm.patchValue({ scanUnitAbo: '' });
        component.onScanUnitAboBlur();
        expect(labelScanSpy.validateUnitAboScan).not.toHaveBeenCalled();
      });

      it('should process successful unit+ABO scan', () => {
        component.verificationForm.patchValue({ scanUnitAbo: 'W12345A' });
        component.phase1ParsedUnitId.set('W12345');
        component.labelResult.set({ labelDecision: 'A' } as any);
        component.verifyUnitIdField = { setValue: jasmine.createSpy(), clear: jasmine.createSpy() } as any;
        component.aboField = { setValue: jasmine.createSpy(), clear: jasmine.createSpy() } as any;

        labelScanSpy.validateUnitAboScan.and.returnValue(of({
          success: true,
          item: { parsedUnitId: 'W12345', manualUnitId: 'W12345', aboCode: 'A', aboDescription: 'Type A' }
        }));

        component.onScanUnitAboBlur();

        expect(component.fieldProcessing['scanUnitAbo']).toBe(false);
        expect(component.verifyUnitIdField.setValue).toHaveBeenCalledWith('W12345');
        expect(component.aboField.setValue).toHaveBeenCalledWith('A');
        expect(component.scannedAboDescription()).toBe('Type A');
      });

      it('should show error 1508 when unit IDs do not match', () => {
        component.verificationForm.patchValue({ scanUnitAbo: 'W99999A' });
        component.phase1ParsedUnitId.set('W12345');
        component.verifyUnitIdField = { setValue: jasmine.createSpy(), clear: jasmine.createSpy() } as any;
        component.aboField = { setValue: jasmine.createSpy(), clear: jasmine.createSpy() } as any;

        labelScanSpy.validateUnitAboScan.and.returnValue(of({
          success: true,
          item: { parsedUnitId: 'W99999', manualUnitId: 'W99999', aboCode: 'A' }
        }));

        component.onScanUnitAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1508'));
      });

      it('should show error 1509 when ABO does not match', () => {
        component.verificationForm.patchValue({ scanUnitAbo: 'W12345B' });
        component.phase1ParsedUnitId.set('W12345');
        component.labelResult.set({ labelDecision: 'A' } as any);
        component.verifyUnitIdField = { setValue: jasmine.createSpy(), clear: jasmine.createSpy() } as any;
        component.aboField = { setValue: jasmine.createSpy(), clear: jasmine.createSpy() } as any;

        labelScanSpy.validateUnitAboScan.and.returnValue(of({
          success: true,
          item: { parsedUnitId: 'W12345', manualUnitId: 'W12345', aboCode: 'B' }
        }));

        component.onScanUnitAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1509'));
      });

      it('should show error on scan failure', () => {
        component.verificationForm.patchValue({ scanUnitAbo: 'INVALID' });

        labelScanSpy.validateUnitAboScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '6040', error: 'Bad scan' }
        }));

        component.onScanUnitAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('6040'));
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanUnitAbo: 'ERROR' });

        labelScanSpy.validateUnitAboScan.and.returnValue(throwError(() => new Error('fail')));

        component.onScanUnitAboBlur();

        expect(component.fieldProcessing['scanUnitAbo']).toBe(false);
      });

      it('should use fallback error message when no errorResponse', () => {
        component.verificationForm.patchValue({ scanUnitAbo: 'BAD' });

        labelScanSpy.validateUnitAboScan.and.returnValue(of({
          success: false,
          message: 'Custom message'
        }));

        component.onScanUnitAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('Custom message'));
      });
    });

    describe('onScanUnitIdBlur', () => {
      beforeEach(() => {
        component.verificationForm.get('scanUnitId')!.enable();
      });

      it('should do nothing when empty', () => {
        component.verificationForm.patchValue({ scanUnitId: '' });
        component.onScanUnitIdBlur();
        expect(labelScanSpy.validateUnitScan).not.toHaveBeenCalled();
      });

      it('should process successful unit scan', () => {
        component.verificationForm.patchValue({ scanUnitId: 'W12345' });
        component.phase1ParsedUnitId.set('W12345');

        labelScanSpy.validateUnitScan.and.returnValue(of({
          success: true,
          item: { parsedUnitId: 'W12345', manualUnitId: 'W12345' }
        }));

        component.onScanUnitIdBlur();

        expect(component.fieldProcessing['scanUnitId']).toBe(false);
        expect(component.verifyParsedUnitId()).toBe('W12345');
      });

      it('should show error 1508 on unit ID mismatch', () => {
        component.verificationForm.patchValue({ scanUnitId: 'W99999' });
        component.phase1ParsedUnitId.set('W12345');

        labelScanSpy.validateUnitScan.and.returnValue(of({
          success: true,
          item: { parsedUnitId: 'W99999', manualUnitId: 'W99999' }
        }));

        component.onScanUnitIdBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1508'));
      });

      it('should show error on scan failure', () => {
        component.verificationForm.patchValue({ scanUnitId: 'BAD' });

        labelScanSpy.validateUnitScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '1230', error: 'Invalid' }
        }));

        component.onScanUnitIdBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1230'));
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanUnitId: 'ERR' });

        labelScanSpy.validateUnitScan.and.returnValue(throwError(() => new Error('fail')));

        component.onScanUnitIdBlur();

        expect(component.fieldProcessing['scanUnitId']).toBe(false);
      });
    });

    describe('onScanAboBlur', () => {
      beforeEach(() => {
        component.verificationForm.get('scanAbo')!.enable();
      });

      it('should do nothing when empty', () => {
        component.verificationForm.patchValue({ scanAbo: '' });
        component.onScanAboBlur();
        expect(labelScanSpy.validateAboScan).not.toHaveBeenCalled();
      });

      it('should process successful ABO scan', () => {
        component.verificationForm.patchValue({ scanAbo: '=A' });
        component.labelResult.set({ labelDecision: 'A' } as any);

        labelScanSpy.validateAboScan.and.returnValue(of({
          success: true,
          item: { aboCode: 'A', aboShortName: 'A Positive' }
        }));

        component.onScanAboBlur();

        expect(component.fieldProcessing['scanAbo']).toBe(false);
        expect(component.scannedAboDescription()).toBe('A Positive');
      });

      it('should show error 1509 on ABO mismatch', () => {
        component.verificationForm.patchValue({ scanAbo: '=B' });
        component.labelResult.set({ labelDecision: 'A' } as any);

        labelScanSpy.validateAboScan.and.returnValue(of({
          success: true,
          item: { aboCode: 'B', aboShortName: 'B' }
        }));

        component.onScanAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1509'));
      });

      it('should show error on scan failure', () => {
        component.verificationForm.patchValue({ scanAbo: 'BAD' });

        labelScanSpy.validateAboScan.and.returnValue(of({
          success: false,
          message: 'Invalid ABO'
        }));

        component.onScanAboBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('Invalid ABO'));
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanAbo: 'ERR' });

        labelScanSpy.validateAboScan.and.returnValue(throwError(() => new Error('fail')));

        component.onScanAboBlur();

        expect(component.fieldProcessing['scanAbo']).toBe(false);
      });
    });

    describe('onScanProdExpBlur', () => {
      beforeEach(() => {
        component.verificationForm.get('scanProdExp')!.enable();
      });

      it('should do nothing when empty', () => {
        component.verificationForm.patchValue({ scanProdExp: '' });
        component.onScanProdExpBlur();
        expect(labelScanSpy.validateProductExpiryScan).not.toHaveBeenCalled();
      });

      it('should process successful product+expiry scan', () => {
        component.verificationForm.patchValue({ scanProdExp: 'E0791|20250601' });
        component.labelResult.set({ labelProductCode: 'E0791' } as any);
        component.selectedComponent.set({ productCode: 'E0791' } as any);

        labelScanSpy.validateProductExpiryScan.and.returnValue(of({
          success: true,
          item: { productCode: 'E0791', expiryDate: '2025-06-01T00:00:00' }
        }));

        component.onScanProdExpBlur();

        expect(component.fieldProcessing['scanProdExp']).toBe(false);
        expect(component.verificationForm.getRawValue().scanProductCode).toBe('E0791');
      });

      it('should show error 9728 on product mismatch', () => {
        component.verificationForm.patchValue({ scanProdExp: 'WRONG|20250601' });
        component.labelResult.set({ labelProductCode: 'E0791' } as any);

        labelScanSpy.validateProductExpiryScan.and.returnValue(of({
          success: true,
          item: { productCode: 'WRONG', expiryDate: '2025-06-01T00:00:00' }
        }));

        component.onScanProdExpBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('9728'));
      });

      it('should show error on scan failure', () => {
        component.verificationForm.patchValue({ scanProdExp: 'BAD' });

        labelScanSpy.validateProductExpiryScan.and.returnValue(of({
          success: false,
          errorResponse: { errorCode: '9710', error: 'Invalid scan' }
        }));

        component.onScanProdExpBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('9710'));
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanProdExp: 'ERR' });

        labelScanSpy.validateProductExpiryScan.and.returnValue(throwError(() => new Error('fail')));

        component.onScanProdExpBlur();

        expect(component.fieldProcessing['scanProdExp']).toBe(false);
      });
    });

    describe('onScanProductCodeBlur', () => {
      beforeEach(() => {
        component.verificationForm.get('scanProductCode')!.enable();
      });

      it('should do nothing when empty', () => {
        component.verificationForm.patchValue({ scanProductCode: '' });
        component.onScanProductCodeBlur();
        expect(labelScanSpy.validateProductScan).not.toHaveBeenCalled();
      });

      it('should process successful product scan', () => {
        component.verificationForm.patchValue({ scanProductCode: 'E0791' });
        component.labelResult.set({ labelProductCode: 'E0791' } as any);

        labelScanSpy.validateProductScan.and.returnValue(of({
          success: true,
          item: { productCode: 'E0791', productDescription: 'RBC' }
        }));

        component.onScanProductCodeBlur();

        expect(component.fieldProcessing['scanProductCode']).toBe(false);
      });

      it('should show error 9728 on product mismatch', () => {
        component.verificationForm.patchValue({ scanProductCode: 'WRONG' });
        component.labelResult.set({ labelProductCode: 'E0791' } as any);

        labelScanSpy.validateProductScan.and.returnValue(of({
          success: true,
          item: { productCode: 'WRONG', productDescription: 'Wrong' }
        }));

        component.onScanProductCodeBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('9728'));
      });

      it('should fallback to selectedComponent productCode when labelProductCode is null', () => {
        component.verificationForm.patchValue({ scanProductCode: 'E0791' });
        component.labelResult.set({ labelProductCode: null } as any);
        component.selectedComponent.set({ productCode: 'E0791' } as any);

        labelScanSpy.validateProductScan.and.returnValue(of({
          success: true,
          item: { productCode: 'E0791', productDescription: 'RBC' }
        }));

        component.onScanProductCodeBlur();

        expect(snackbarSpy.showError).not.toHaveBeenCalled();
      });

      it('should show error on scan failure', () => {
        component.verificationForm.patchValue({ scanProductCode: 'BAD' });

        labelScanSpy.validateProductScan.and.returnValue(of({
          success: false,
          message: 'Invalid product'
        }));

        component.onScanProductCodeBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('Invalid product'));
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanProductCode: 'ERR' });

        labelScanSpy.validateProductScan.and.returnValue(throwError(() => new Error('fail')));

        component.onScanProductCodeBlur();

        expect(component.fieldProcessing['scanProductCode']).toBe(false);
      });
    });

    describe('onScanExpDateBlur', () => {
      beforeEach(() => {
        component.verificationForm.get('scanExpDate')!.enable();
      });

      it('should do nothing when empty', () => {
        component.verificationForm.patchValue({ scanExpDate: '' });
        component.onScanExpDateBlur();
        expect(labelScanSpy.validateExpiryScan).not.toHaveBeenCalled();
      });

      it('should process successful expiry scan', () => {
        component.verificationForm.patchValue({ scanExpDate: '20250601' });

        labelScanSpy.validateExpiryScan.and.returnValue(of({
          success: true,
          item: { expiryDate: '2025-06-01T00:00:00' }
        }));

        component.onScanExpDateBlur();

        expect(component.fieldProcessing['scanExpDate']).toBe(false);
      });

      it('should show error on scan failure', () => {
        component.verificationForm.patchValue({ scanExpDate: 'BAD' });

        labelScanSpy.validateExpiryScan.and.returnValue(of({
          success: false,
          message: 'Invalid expiry'
        }));

        component.onScanExpDateBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('Invalid expiry'));
      });

      it('should handle missing expiryDate in response', () => {
        component.verificationForm.patchValue({ scanExpDate: 'PARTIAL' });

        labelScanSpy.validateExpiryScan.and.returnValue(of({
          success: true,
          item: { expiryDate: null }
        }));

        component.onScanExpDateBlur();

        expect(snackbarSpy.showError).toHaveBeenCalled();
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanExpDate: 'ERR' });

        labelScanSpy.validateExpiryScan.and.returnValue(throwError(() => new Error('fail')));

        component.onScanExpDateBlur();

        expect(component.fieldProcessing['scanExpDate']).toBe(false);
      });
    });

    describe('onScanCollDateBlur', () => {
      beforeEach(() => {
        component.verificationForm.get('scanCollDate')!.enable();
      });

      it('should do nothing when empty', () => {
        component.verificationForm.patchValue({ scanCollDate: '' });
        component.onScanCollDateBlur();
        expect(labelScanSpy.validateExpiryScan).not.toHaveBeenCalled();
      });

      it('should process successful collection date scan', () => {
        component.verificationForm.patchValue({ scanCollDate: '20250101' });

        labelScanSpy.validateExpiryScan.and.returnValue(of({
          success: true,
          item: { expiryDate: '2025-01-15T00:00:00' }
        }));

        component.onScanCollDateBlur();

        expect(component.fieldProcessing['scanCollDate']).toBe(false);
        expect(component.verificationForm.getRawValue().scanCollDate).toBe('');
      });

      it('should show error on scan failure', () => {
        component.verificationForm.patchValue({ scanCollDate: 'BAD' });

        labelScanSpy.validateExpiryScan.and.returnValue(of({
          success: false,
          message: 'Invalid collection date'
        }));

        component.onScanCollDateBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('Invalid collection date'));
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanCollDate: 'ERR' });

        labelScanSpy.validateExpiryScan.and.returnValue(throwError(() => new Error('fail')));

        component.onScanCollDateBlur();

        expect(component.fieldProcessing['scanCollDate']).toBe(false);
      });
    });

    describe('onCollDateBlur', () => {
      beforeEach(() => {
        component.verificationForm.get('colldate')!.enable();
      });

      it('should do nothing when empty', () => {
        component.verificationForm.patchValue({ colldate: '' });
        component.onCollDateBlur();
        expect(snackbarSpy.showError).not.toHaveBeenCalled();
      });

      it('should show error 1145 when collection dates do not match', () => {
        component.unitData.set({ collDate: '2025-01-15T00:00:00' } as any);
        component.verificationForm.patchValue({ colldate: '01-FEB-2025' });

        component.onCollDateBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1145'));
      });

      it('should call tryAutoVerify when collection dates match', () => {
        spyOn(component as any, 'tryAutoVerify');
        component.unitData.set({ collDate: '2025-01-15T00:00:00' } as any);
        component.verificationForm.patchValue({ colldate: '15-JAN-2025' });

        component.onCollDateBlur();

        expect(snackbarSpy.showError).not.toHaveBeenCalled();
        expect((component as any).tryAutoVerify).toHaveBeenCalled();
      });
    });

    describe('onScanSpecialTestBlur', () => {
      beforeEach(() => {
        component.verificationForm.get('scanSpecialTest')!.enable();
      });

      it('should do nothing when empty', () => {
        component.verificationForm.patchValue({ scanSpecialTest: '' });
        component.onScanSpecialTestBlur();
        expect(labelScanSpy.validateSpTestScan).not.toHaveBeenCalled();
      });

      it('should process successful special test scan', () => {
        component.verificationForm.patchValue({ scanSpecialTest: 'SP1' });
        component.labelResult.set({ specialTestingCode: 'SP1' } as any);

        labelScanSpy.validateSpTestScan.and.returnValue(of({
          success: true,
          item: { spTestCode: 'SP1', description: 'Special Test 1' }
        }));

        component.onScanSpecialTestBlur();

        expect(component.fieldProcessing['scanSpecialTest']).toBe(false);
      });

      it('should show error 4300 on special test mismatch', () => {
        component.verificationForm.patchValue({ scanSpecialTest: 'SP2' });
        component.labelResult.set({ specialTestingCode: 'SP1' } as any);

        labelScanSpy.validateSpTestScan.and.returnValue(of({
          success: true,
          item: { spTestCode: 'SP2', description: 'Wrong' }
        }));

        component.onScanSpecialTestBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('4300'));
      });

      it('should show error on scan failure', () => {
        component.verificationForm.patchValue({ scanSpecialTest: 'BAD' });

        labelScanSpy.validateSpTestScan.and.returnValue(of({
          success: false,
          message: 'Invalid SP test'
        }));

        component.onScanSpecialTestBlur();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('Invalid SP test'));
      });

      it('should handle observable error', () => {
        component.verificationForm.patchValue({ scanSpecialTest: 'ERR' });

        labelScanSpy.validateSpTestScan.and.returnValue(throwError(() => new Error('fail')));

        component.onScanSpecialTestBlur();

        expect(component.fieldProcessing['scanSpecialTest']).toBe(false);
      });
    });
  });

  describe('Verification Flow', () => {
    describe('tryAutoVerify', () => {
      it('should not verify when a field is processing', () => {
        component.fieldProcessing = { scanUnitId: true };
        spyOn(component as any, 'doVerificationComparison');

        (component as any).tryAutoVerify();

        expect((component as any).doVerificationComparison).not.toHaveBeenCalled();
      });

      it('should focus unit ID field when missing', () => {
        component.verifyUnitIdField = { focus: jasmine.createSpy(), clear: jasmine.createSpy() } as any;
        component.verificationForm.get('scanUnitId')!.enable();
        component.verificationForm.patchValue({ scanUnitId: '', scanAbo: 'A', scanProductCode: 'E0791' });

        (component as any).tryAutoVerify();

        expect(component.verifyUnitIdField.focus).toHaveBeenCalled();
      });

      it('should focus ABO field when missing', () => {
        component.aboField = { focus: jasmine.createSpy(), clear: jasmine.createSpy() } as any;
        component.verificationForm.get('scanUnitId')!.enable();
        component.verificationForm.get('scanAbo')!.enable();
        component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: '', scanProductCode: 'E0791' });

        (component as any).tryAutoVerify();

        expect(component.aboField.focus).toHaveBeenCalled();
      });

      it('should not call doVerificationComparison when product code is missing', () => {
        spyOn(component as any, 'doVerificationComparison');
        component.scanProdExpInput = { nativeElement: { focus: jasmine.createSpy() } } as any;
        component.verificationForm.get('scanUnitId')!.enable();
        component.verificationForm.get('scanAbo')!.enable();
        component.verificationForm.get('scanProductCode')!.enable();
        component.verificationForm.patchValue({ scanUnitId: 'W12345', scanAbo: 'A', scanProductCode: '' });

        (component as any).tryAutoVerify();

        expect((component as any).doVerificationComparison).not.toHaveBeenCalled();
      });

      it('should not verify when colldate missing for Mf flow', () => {
        spyOn(component as any, 'doVerificationComparison');
        component.labelResult.set({ labelDecision: 'Mf', productType: 'MFG', expiryDate: '2025-06-01' } as any);
        component.verificationForm.get('scanUnitId')!.enable();
        component.verificationForm.get('scanAbo')!.enable();
        component.verificationForm.get('scanProductCode')!.enable();
        component.verificationForm.get('colldate')!.enable();
        component.verificationForm.patchValue({
          scanUnitId: 'W12345',
          scanAbo: 'Mf',
          scanProductCode: 'E0791',
          colldate: '',
        });

        (component as any).tryAutoVerify();

        expect((component as any).doVerificationComparison).not.toHaveBeenCalled();
      });

      it('should focus special test field when missing and required', () => {
        component.specialTestField = { focus: jasmine.createSpy(), clear: jasmine.createSpy() } as any;
        component.labelResult.set({ labelDecision: 'A', productType: 'WB', specialTestingCode: 'SP1', expiryDate: '2025-06-01T00:00:00' } as any);
        component.verificationForm.get('scanUnitId')!.enable();
        component.verificationForm.get('scanAbo')!.enable();
        component.verificationForm.get('scanProductCode')!.enable();
        component.verificationForm.get('scanExpDate')!.enable();
        component.verificationForm.get('scanSpecialTest')!.enable();
        component.verificationForm.patchValue({
          scanUnitId: 'W12345',
          scanAbo: 'A',
          scanProductCode: 'E0791',
          scanExpDate: '01-JUN-2025',
          scanSpecialTest: '',
        });

        (component as any).tryAutoVerify();

        expect(component.specialTestField.focus).toHaveBeenCalled();
      });

      it('should not verify when expDate missing and not Mf flow with expiryDate', () => {
        spyOn(component as any, 'doVerificationComparison');
        component.labelResult.set({ labelDecision: 'A', productType: 'WB', expiryDate: '2025-06-01T00:00:00' } as any);
        component.verificationForm.get('scanUnitId')!.enable();
        component.verificationForm.get('scanAbo')!.enable();
        component.verificationForm.get('scanProductCode')!.enable();
        component.verificationForm.get('scanExpDate')!.enable();
        component.verificationForm.patchValue({
          scanUnitId: 'W12345',
          scanAbo: 'A',
          scanProductCode: 'E0791',
          scanExpDate: '',
        });

        (component as any).tryAutoVerify();

        expect((component as any).doVerificationComparison).not.toHaveBeenCalled();
      });
    });

    describe('doVerificationComparison', () => {
      beforeEach(() => {
        component.unitData.set({ unitId: 'W12345', collDate: '2025-01-15T00:00:00' } as any);
        component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
        component.phase1ParsedUnitId.set('W12345');
        component.verifyParsedUnitId.set('W12345');
        component.labelResult.set({
          labelDecision: 'A',
          labelProductCode: 'E0791',
          expiryDate: '2025-06-01T00:00:00',
          specialTestingCode: null,
          doubleScanReqd: false,
        } as any);
        Object.keys(component.verificationForm.controls).forEach((key) => {
          component.verificationForm.get(key)!.enable();
        });
        component.verificationForm.patchValue({
          scanUnitId: 'W12345',
          scanAbo: 'A',
          scanProductCode: 'E0791',
          scanExpDate: '01-JUN-2025',
        });
      });

      it('should return early when labelResult is null', () => {
        component.labelResult.set(null);
        (component as any).doVerificationComparison();
        expect(snackbarSpy.showError).not.toHaveBeenCalled();
      });

      it('should return early when unitData is null', () => {
        component.unitData.set(null);
        (component as any).doVerificationComparison();
        expect(snackbarSpy.showError).not.toHaveBeenCalled();
      });

      it('should show error 1508 on unit ID mismatch', () => {
        component.verifyParsedUnitId.set('W99999');

        (component as any).doVerificationComparison();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1508'));
      });

      it('should show error 1509 on ABO mismatch', () => {
        component.verificationForm.patchValue({ scanAbo: 'B' });

        (component as any).doVerificationComparison();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1509'));
      });

      it('should show error 9728 on product code mismatch', () => {
        component.verificationForm.patchValue({ scanProductCode: 'WRONG' });

        (component as any).doVerificationComparison();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('9728'));
      });

      it('should show error 1170 on expiry date mismatch', () => {
        component.verificationForm.patchValue({ scanExpDate: '01-JAN-2099' });

        (component as any).doVerificationComparison();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1170'));
      });

      it('should show error 1170 when expiry date is missing but required', () => {
        component.verificationForm.patchValue({ scanExpDate: '' });

        (component as any).doVerificationComparison();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1170'));
      });

      it('should show error 1145 on collection date mismatch for Mf flow', () => {
        component.labelResult.set({
          labelDecision: 'Mf',
          labelProductCode: 'E0791',
          productType: 'MFG',
          specialTestingCode: null,
          doubleScanReqd: false,
        } as any);
        component.verificationForm.patchValue({
          scanAbo: 'Mf',
          colldate: '01-FEB-2025',
        });

        (component as any).doVerificationComparison();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1145'));
      });

      it('should show error 1145 when collection date is empty for Mf flow', () => {
        component.labelResult.set({
          labelDecision: 'Mf',
          labelProductCode: 'E0791',
          productType: 'MFG',
          specialTestingCode: null,
          doubleScanReqd: false,
        } as any);
        component.verificationForm.patchValue({
          scanAbo: 'Mf',
          colldate: '',
        });

        (component as any).doVerificationComparison();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('1145'));
      });

      it('should show error 4300 on special test mismatch', () => {
        component.labelResult.set({
          labelDecision: 'A',
          labelProductCode: 'E0791',
          expiryDate: '2025-06-01T00:00:00',
          specialTestingCode: 'SP1',
          doubleScanReqd: false,
        } as any);
        component.verificationForm.patchValue({ scanSpecialTest: 'SP2' });

        (component as any).doVerificationComparison();

        expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('4300'));
      });

      it('should trigger second scan when doubleScanReqd and not second scan', () => {
        component.labelResult.set({
          labelDecision: 'A',
          labelProductCode: 'E0791',
          expiryDate: '2025-06-01T00:00:00',
          specialTestingCode: null,
          doubleScanReqd: true,
        } as any);
        component.isSecondScan.set(false);

        (component as any).doVerificationComparison();

        expect(component.isSecondScan()).toBe(true);
        expect(component.firstScanCompleted()).toBe(true);
        expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(jasmine.stringContaining('SECOND'));
      });

      it('should call confirmVerification when all checks pass', () => {
        serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

        (component as any).doVerificationComparison();

        expect(serviceSpy.confirmVerification).toHaveBeenCalled();
      });

      it('should call confirmVerification on second scan when doubleScanReqd', () => {
        serviceSpy.confirmVerification.and.returnValue(of({ success: true }));
        component.labelResult.set({
          labelDecision: 'A',
          labelProductCode: 'E0791',
          expiryDate: '2025-06-01T00:00:00',
          specialTestingCode: null,
          doubleScanReqd: true,
        } as any);
        component.isSecondScan.set(true);

        (component as any).doVerificationComparison();

        expect(serviceSpy.confirmVerification).toHaveBeenCalled();
      });
    });

    describe('confirmVerification', () => {
      beforeEach(() => {
        component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
        component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);
        component.labelResult.set({
          labelDecision: 'A',
          expiryDate: '2025-06-01',
          identifierCode: 'AA',
          testedAboCode: 'A',
        } as any);
      });

      it('should confirm verification successfully', () => {
        serviceSpy.confirmVerification.and.returnValue(of({ success: true }));

        (component as any).confirmVerification();

        expect(serviceSpy.confirmVerification).toHaveBeenCalled();
        expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Label verified and confirmed successfully.');
        expect(component.doLabelCalled()).toBe(false);
        expect(component.phase()).toBe('ready');
      });

      it('should handle confirmVerification error', () => {
        serviceSpy.confirmVerification.and.returnValue(throwError(() => new Error('fail')));

        (component as any).confirmVerification();

        expect(component.loading()).toBe(false);
      });

      it('should not call confirmVerification when unitData is null', () => {
        component.unitData.set(null);

        (component as any).confirmVerification();

        expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
      });

      it('should not call confirmVerification when selectedComponent is null', () => {
        component.selectedComponent.set(null);

        (component as any).confirmVerification();

        expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
      });

      it('should not call confirmVerification when labelResult is null', () => {
        component.labelResult.set(null);

        (component as any).confirmVerification();

        expect(serviceSpy.confirmVerification).not.toHaveBeenCalled();
      });
    });
  });

  describe('Format Helpers', () => {
    describe('formatExpiryDisplay', () => {
      it('should return empty string for null', () => {
        expect((component as any).formatExpiryDisplay(null)).toBe('');
      });

      it('should return empty string for empty string', () => {
        expect((component as any).formatExpiryDisplay('')).toBe('');
      });

      it('should format date without time (midnight)', () => {
        const result = (component as any).formatExpiryDisplay('2025-06-15T00:00:00');
        expect(result).toBe('15-JUN-2025');
      });

      it('should format date with time', () => {
        const result = (component as any).formatExpiryDisplay('2025-06-15T14:30:00');
        expect(result).toBe('15-JUN-2025 14:30');
      });

      it('should return original value for invalid date', () => {
        expect((component as any).formatExpiryDisplay('not-a-date')).toBe('not-a-date');
      });
    });

    describe('formatCollDateDisplay', () => {
      it('should return empty string for null', () => {
        expect((component as any).formatCollDateDisplay(null)).toBe('');
      });

      it('should return empty string for empty string', () => {
        expect((component as any).formatCollDateDisplay('')).toBe('');
      });

      it('should format valid date', () => {
        const result = (component as any).formatCollDateDisplay('2025-01-15T00:00:00');
        expect(result).toBe('15-JAN-2025');
      });

      it('should return original value for invalid date', () => {
        expect((component as any).formatCollDateDisplay('not-a-date')).toBe('not-a-date');
      });
    });

    describe('stripCheckDigit', () => {
      it('should return empty string for empty input', () => {
        expect((component as any).stripCheckDigit('')).toBe('');
      });

      it('should strip check digit after last dash', () => {
        expect((component as any).stripCheckDigit('W12345-3')).toBe('W12345');
      });

      it('should return original when no dash present', () => {
        expect((component as any).stripCheckDigit('W12345')).toBe('W12345');
      });
    });
  });

  describe('onAutoScan', () => {
    it('should not blur input when scan does not match pattern', () => {
      const blurSpy = jasmine.createSpy('blur');
      const event = { target: { value: '', blur: blurSpy } } as any;

      component.onAutoScan(event, []);

      expect(blurSpy).not.toHaveBeenCalled();
    });
  });

  describe('Parse Functions', () => {
    it('parseAbo should return option on success', (done) => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true,
        item: { aboCode: 'A', aboShortName: 'A Positive' }
      }));

      component.parseAbo('=A').subscribe({
        next: (result) => {
          expect(result).toEqual({ code: 'A', description: 'A Positive' });
          done();
        }
      });
    });

    it('parseAbo should throw error on failure', (done) => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: false,
        message: 'Invalid ABO'
      }));

      component.parseAbo('BAD').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Invalid ABO');
          done();
        }
      });
    });

    it('parseAbo should use errorResponse error when available', (done) => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: false,
        errorResponse: { error: 'ABO error from response' }
      }));

      component.parseAbo('BAD').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('ABO error from response');
          done();
        }
      });
    });

    it('parseProductCode should return option on success', (done) => {
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: true,
        item: { productCode: 'E0791', productDescription: 'RBC' }
      }));

      component.parseProductCode('E0791').subscribe({
        next: (result) => {
          expect(result).toEqual({ code: 'E0791', description: 'RBC' });
          done();
        }
      });
    });

    it('parseProductCode should throw error on failure', (done) => {
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: false,
        errorResponse: { error: 'Bad product' }
      }));

      component.parseProductCode('BAD').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Bad product');
          done();
        }
      });
    });

    it('parseSpTest should return option on success', (done) => {
      labelScanSpy.validateSpTestScan.and.returnValue(of({
        success: true,
        item: { spTestCode: 'SP1', description: 'Special 1' }
      }));

      component.parseSpTest('SP1').subscribe({
        next: (result) => {
          expect(result).toEqual({ code: 'SP1', description: 'Special 1' });
          done();
        }
      });
    });

    it('parseSpTest should throw error on failure', (done) => {
      labelScanSpy.validateSpTestScan.and.returnValue(of({
        success: false,
        message: 'Invalid SP test'
      }));

      component.parseSpTest('BAD').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Invalid SP test');
          done();
        }
      });
    });
  });

  describe('showScanError', () => {
    it('should show snackbar error and set control error when controlName provided', () => {
      component.verificationForm.get('scanUnitId')!.enable();
      component.verificationForm.patchValue({ scanUnitId: 'someValue' });

      (component as any).showScanError('1508', 'Test error', 'scanUnitId');

      expect(snackbarSpy.showError).toHaveBeenCalledWith('1508: Test error');
      expect(component.verificationForm.get('scanUnitId')!.value).toBe('');
      expect(component.verificationForm.get('scanUnitId')!.hasError('scanError')).toBe(true);
    });

    it('should show snackbar error without control changes when no controlName', () => {
      (component as any).showScanError('1508', 'Test error');

      expect(snackbarSpy.showError).toHaveBeenCalledWith('1508: Test error');
    });
  });

  describe('clearFieldError', () => {
    it('should clear field error and control errors', () => {
      component.fieldErrors['scanAbo'] = 'Some error';
      component.verificationForm.get('scanAbo')!.enable();
      component.verificationForm.get('scanAbo')!.setErrors({ scanError: true });

      (component as any).clearFieldError('scanAbo');

      expect(component.fieldErrors['scanAbo']).toBe('');
      expect(component.verificationForm.get('scanAbo')!.errors).toBeNull();
    });
  });

  describe('resetVerificationFields', () => {
    it('should reset form, clear fields, and re-enable verification fields', () => {
      component.verifyUnitIdField = { clear: jasmine.createSpy(), focus: jasmine.createSpy() } as any;
      component.aboField = { clear: jasmine.createSpy(), focus: jasmine.createSpy() } as any;
      component.specialTestField = { clear: jasmine.createSpy() } as any;
      component.labelResult.set({ labelDecision: 'A', productType: 'WB' } as any);
      component.scannedAboDescription.set('Type A');
      component.verifyParsedUnitId.set('W12345');
      component.fieldErrors = { scanUnitId: 'error' };
      component.fieldProcessing = { scanUnitId: true };

      (component as any).resetVerificationFields();

      expect(component.scannedAboDescription()).toBe('');
      expect(component.verifyParsedUnitId()).toBe('');
      expect(component.fieldErrors).toEqual({});
      expect(component.fieldProcessing).toEqual({});
      expect(component.verifyUnitIdField.clear).toHaveBeenCalled();
      expect(component.aboField.clear).toHaveBeenCalled();
      expect(component.specialTestField.clear).toHaveBeenCalled();
    });
  });

  describe('clearAll additional', () => {
    it('should not log abandoned label when doLabelCalled is false', () => {
      component.doLabelCalled.set(false);
      component.phase.set('labeled');

      component.clearAll();

      expect(serviceSpy.logAbandonedLabel).not.toHaveBeenCalled();
    });

    it('should not log abandoned label when phase is init', () => {
      component.doLabelCalled.set(true);
      component.phase.set('init');

      component.clearAll();

      expect(serviceSpy.logAbandonedLabel).not.toHaveBeenCalled();
    });

    it('should not double-clear', () => {
      (component as any).clearing = true;
      component.doLabelCalled.set(true);
      component.phase.set('labeled');
      component.unitData.set({ unitId: 'W12345', collDate: '2025-01-01' } as any);
      component.selectedComponent.set({ productCode: 'E0791', componentPrefix: '01' } as any);

      component.clearAll();

      expect(serviceSpy.logAbandonedLabel).not.toHaveBeenCalled();
      (component as any).clearing = false;
    });

    it('should not log abandoned when unitData is null', () => {
      component.doLabelCalled.set(true);
      component.phase.set('labeled');
      component.unitData.set(null);

      component.clearAll();

      expect(serviceSpy.logAbandonedLabel).not.toHaveBeenCalled();
    });

    it('should clear all ViewChild references', () => {
      component.unitIdField = { clear: jasmine.createSpy() } as any;
      component.verifyUnitIdField = { clear: jasmine.createSpy() } as any;
      component.row1ProductCodeField = { clear: jasmine.createSpy() } as any;
      component.aboField = { clear: jasmine.createSpy() } as any;
      component.specialTestField = { clear: jasmine.createSpy() } as any;

      component.clearAll();

      expect(component.unitIdField.clear).toHaveBeenCalled();
      expect(component.verifyUnitIdField.clear).toHaveBeenCalled();
      expect(component.row1ProductCodeField.clear).toHaveBeenCalled();
      expect(component.aboField.clear).toHaveBeenCalled();
      expect(component.specialTestField.clear).toHaveBeenCalled();
    });
  });
});
