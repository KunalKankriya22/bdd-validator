import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ReprintLabelsComponent } from './reprint-labels.component';
import { ReprintLabelsService } from './services/reprint-labels.service';
import { HeaderService } from '../../../shared/services/header.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { DonorLibLabelScanService } from '../../../shared/services/donor-lib-label-scan.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ReprintLabelsComponent', () => {
  let component: ReprintLabelsComponent;
  let fixture: ComponentFixture<ReprintLabelsComponent>;

  const chapterChanged$ = new Subject<void>();

  const serviceMock = jasmine.createSpyObj('ReprintLabelsService', [
    'getLabelTypes',
    'validateUnit',
    'processLabel',
    'verifyLabel',
    'getComponents',
    'getAboLov',
    'getSpecialTestLov',
    'getPrinterConfig',
  ]);

  const headerServiceMock = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });

  const snackbarMock = createMockSnackbarService();

  const scanServiceMock = jasmine.createSpyObj('DonorLibLabelScanService', [
    'validateUnitScan',
    'validateUnitAboScan',
    'validateAboScan',
    'validateProductScan',
    'validateProductExpdateScan',
    'validateProductExpiryScan',
    'validateExpiryScan',
    'validateSpTestScan',
  ]);

  const dialogMock = createMockMatDialog();

  beforeEach(() => {

    serviceMock.getLabelTypes.and.returnValue(of({
      success: true,
      statusCode: 200,
      data: [
        { code: 'PFF', description: 'Print Full Face Label - ISBT' },
        { code: 'PCA', description: 'Codabar ABO/Expiration Label' },
        { code: 'PAD', description: 'ISBT ABO/Date Label' },
        { code: 'PPD', description: 'ISBT product/Date label' },
      ],
    }));

    serviceMock.getComponents.and.returnValue(of({
      success: true,
      statusCode: 200,
      data: [],
    }));

    sessionStorage.setItem('labelPrinterContext', JSON.stringify({ labelPrinterCode: 'KAS 4x4' }));



      TestBed.configureTestingModule({
      imports: [
        ReprintLabelsComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ReprintLabelsService, useValue: serviceMock },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: SnackbarService, useValue: snackbarMock },
        { provide: DonorLibLabelScanService, useValue: scanServiceMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
    });


    



    fixture = TestBed.createComponent(ReprintLabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {


    it('should have phase set to ready', () => {
      expect(component.phase()).toBe('ready');
    });

    it('should have verification fields disabled', () => {
      expect(component.verifyFieldsDisabled()).toBe(true);
    });

    it('should load label types on init', () => {
      expect(serviceMock.getLabelTypes).toHaveBeenCalled();
      expect(component.labelTypeOptions().length).toBe(4);
    });

    it('should load printer config on init', () => {
      expect(component.currentPrinterName()).toBe('KAS 4x4');
    });

    it('should show Not configured when printer not available', fakeAsync(() => {
      sessionStorage.removeItem('labelPrinterContext');

      const newFixture = TestBed.createComponent(ReprintLabelsComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.currentPrinterName()).toBe('Not configured');
    }));
  });
  describe('Label Type Selection', () => {
    it('should set description when label type selected', () => {
      component.labelTypeControl.setValue('PFF');
      component.onLabelTypeChange();

      expect(component.labelTypeDescription()).toBe('Print Full Face Label - ISBT');
    });

    it('should clear description when label type cleared', () => {
      component.labelTypeControl.setValue('PFF');
      component.onLabelTypeChange();
      component.labelTypeControl.setValue('');
      component.onLabelTypeChange();

      expect(component.labelTypeDescription()).toBe('');
    });

    it('should disable unit ID when no label type selected', () => {
      component.labelTypeControl.setValue('');
      expect(component.labelTypeControl.value).toBe('');
    });
  });

  describe('Phase State Machine', () => {
    it('should start in ready phase', () => {
      expect(component.phase()).toBe('ready');
    });






  });

  describe('Conditional Field Visibility', () => {
    it('should show Scan Unit/ABO for non-PPD label types', () => {
      component.labelTypeControl.setValue('PFF');
      expect(component.showScanUnitAbo()).toBe(true);
    });

    it('should show ABO field for non-PPD label types', () => {
      component.labelTypeControl.setValue('PAD');
      expect(component.showAboField()).toBe(true);
    });


  });

  describe('Date Formatting', () => {
    it('should format date as DD-MMM-YYYY uppercase', () => {
      const formatted = (component as any).formatDateDisplay('2034-02-12T00:00:00');
      expect(formatted).toBe('12-FEB-2034');
    });



    it('should return uppercase original for non-parseable string', () => {
      const formatted = (component as any).formatDateDisplay('not-a-date');
      expect(formatted).toBe('NOT-A-DATE');
    });

    it('should format dd-MMM-yyyy string correctly', () => {
      const formatted = (component as any).formatDateDisplay('12-Feb-2034 23:59');
      expect(formatted).toBe('12-FEB-2034 23:59');
    });
  });

  describe('Chapter Change', () => {
    it('should clear state when chapter changes', () => {
      component.labelTypeControl.setValue('PFF');
      component.labelTypeDescription.set('Test');

      chapterChanged$.next();

      expect(component.labelTypeControl.value).toBe('');
      expect(component.labelTypeDescription()).toBe('');
      expect(component.phase()).toBe('ready');
    });
  });

  describe('codeScheme getter', () => {
    it('should return unitCodeScheme value', () => {
      component.unitCodeScheme.set('J');
      expect(component.codeScheme).toBe('J');
    });
  });

  describe('isAnyFieldProcessing', () => {
    it('should return false when no fields processing', () => {
      component.fieldProcessing = {};
      expect(component.isAnyFieldProcessing).toBe(false);
    });

    it('should return true when a field is processing', () => {
      component.fieldProcessing = { scanUnitAbo: true };
      expect(component.isAnyFieldProcessing).toBe(true);
    });
  });

  describe('Computed Signals', () => {
    it('showScanUnitAbo should return false for PPD', () => {
      component.labelTypeControl.setValue('PPD');
      expect(component.showScanUnitAbo()).toBe(false);
    });

    it('showAboField should return false for PPD', () => {
      component.labelTypeControl.setValue('PPD');
      expect(component.showAboField()).toBe(false);
    });

    it('isMfProduct should return true for Mf label', () => {
      component.labelResult.set({ label: 'Mf' } as any);
      expect(component.isMfProduct()).toBe(true);
    });

    it('isMfProduct should return true for 49 label', () => {
      component.labelResult.set({ label: '49' } as any);
      expect(component.isMfProduct()).toBe(true);
    });

    it('isMfProduct should return false for other label', () => {
      component.labelResult.set({ label: 'XX' } as any);
      expect(component.isMfProduct()).toBe(false);
    });

    it('showSpecialTesting should return false when no result', () => {
      component.labelResult.set(null);
      expect(component.showSpecialTesting()).toBe(false);
    });

    it('showSpecialTesting should return true when requiresSpecialTesting and not PCA', () => {
      component.labelResult.set({ requiresSpecialTesting: true } as any);
      component.labelTypeControl.setValue('PFF');
      expect(component.showSpecialTesting()).toBe(true);
    });

    it('showSpecialTesting should return false for PCA even if requiresSpecialTesting', () => {
      component.labelResult.set({ requiresSpecialTesting: true } as any);
      component.labelTypeControl.setValue('PCA');
      expect(component.showSpecialTesting()).toBe(false);
    });

    it('showDateField should return false for PPD', () => {
      component.labelTypeControl.setValue('PPD');
      expect(component.showDateField()).toBe(false);
    });

    it('showDateField should return false for OFF with rejectReasonCode', () => {
      component.labelTypeControl.setValue('OFF');
      component.labelResult.set({ rejectReasonCode: 'R1', expiryDate: '2025-01-01' } as any);
      expect(component.showDateField()).toBe(false);
    });

    it('showDateField should return true when expiryDate exists for PFF', () => {
      component.labelTypeControl.setValue('PFF');
      component.labelResult.set({ expiryDate: '2025-01-01' } as any);
      expect(component.showDateField()).toBe(true);
    });

    it('showDateField should return false when no expiryDate and not Mf', () => {
      component.labelTypeControl.setValue('PFF');
      component.labelResult.set({ expiryDate: null, label: 'XX' } as any);
      expect(component.showDateField()).toBe(false);
    });

    it('showDateField should return true for Mf product even without expiryDate', () => {
      component.labelTypeControl.setValue('PFF');
      component.labelResult.set({ expiryDate: null, label: 'Mf' } as any);
      expect(component.showDateField()).toBe(true);
    });
  });

  describe('onUnitPostValidate', () => {
    it('should return early when parsedUnitId is missing', () => {
      const event = { data: {}, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onUnitPostValidate(event);
      expect(event.reject).not.toHaveBeenCalled();
      expect(event.confirm).not.toHaveBeenCalled();
    });

    it('should reject when no label type is selected', () => {
      const event = { data: { parsedUnitId: 'W1234' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.labelTypeControl.setValue('');
      component.onUnitPostValidate(event);
      expect(event.reject).toHaveBeenCalledWith('Select a label type first');
    });

    it('should set unitCodeScheme when codeScheme provided', fakeAsync(() => {
      component.labelTypeControl.setValue('PFF');
      serviceMock.validateUnit.and.returnValue(of({
        success: true,
        item: { unitId: 'U1', collDate: '2024-01-01', donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: 'J' }
      }));
      serviceMock.getComponents.and.returnValue(of({ success: true, data: [] }));
      const event = { data: { parsedUnitId: 'W1234', codeScheme: 'J' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onUnitPostValidate(event);
      tick();
      expect(component.unitCodeScheme()).toBe('J');
      expect(event.confirm).toHaveBeenCalled();
      expect(component.phase()).toBe('unit-validated');
    }));

    it('should reject on validation failure with errorResponse', fakeAsync(() => {
      component.labelTypeControl.setValue('PFF');
      serviceMock.validateUnit.and.returnValue(of({ success: false, errorResponse: { error: 'Invalid unit' } }));
      const event = { data: { parsedUnitId: 'W1234' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onUnitPostValidate(event);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Invalid unit');
      expect(component.loading()).toBe(false);
    }));

    it('should reject on validation failure with message', fakeAsync(() => {
      component.labelTypeControl.setValue('PFF');
      serviceMock.validateUnit.and.returnValue(of({ success: false, message: 'Bad unit' }));
      const event = { data: { parsedUnitId: 'W1234' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onUnitPostValidate(event);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Bad unit');
    }));

    it('should reject on API error', fakeAsync(() => {
      component.labelTypeControl.setValue('PFF');
      serviceMock.validateUnit.and.returnValue(throwError(() => new Error('Network')));
      const event = { data: { parsedUnitId: 'W1234' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onUnitPostValidate(event);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Unit validation failed');
      expect(component.loading()).toBe(false);
    }));

    it('should load product code options on success', fakeAsync(() => {
      component.labelTypeControl.setValue('PFF');
      serviceMock.validateUnit.and.returnValue(of({
        success: true,
        item: { unitId: 'U1', collDate: '2024-01-01', donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: 'I' }
      }));
      serviceMock.getComponents.and.returnValue(of({
        success: true,
        data: [{ productCode: 'PC1', productDescription: 'Red Cells' }]
      }));
      const event = { data: { parsedUnitId: 'W1234' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onUnitPostValidate(event);
      tick();
      expect(serviceMock.getComponents).toHaveBeenCalledWith('U1', 'PFF');
      expect(component.productCodeOptions().length).toBe(1);
    }));
  });

  describe('onRow1ProductCodeChanged', () => {
    it('should return early when option is null', () => {
      component.onRow1ProductCodeChanged(null);
      expect(serviceMock.processLabel).not.toHaveBeenCalled();
    });

    it('should return early when option has no code', () => {
      component.onRow1ProductCodeChanged({ code: '', description: '' });
      expect(serviceMock.processLabel).not.toHaveBeenCalled();
    });

    it('should call processLabel on valid option with unitData', fakeAsync(() => {
      component.unitData.set({ unitId: 'U1', parsedUnitId: 'W1234', collDate: '2024-01-01', donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: 'I' });
      component.labelTypeControl.setValue('PFF');
      serviceMock.processLabel.and.returnValue(of({
        success: true,
        item: { status: 'OK', productCode: 'PC1', label: 'FL', expiryDate: '2025-01-01', codeScheme: 'I', requiresSpecialTesting: false, warnings: [] }
      }));
      serviceMock.getAboLov.and.returnValue(of({ success: true, data: [] }));
      component.onRow1ProductCodeChanged({ code: 'PC1', description: 'Red Cells' });
      tick();
      expect(serviceMock.processLabel).toHaveBeenCalled();
      expect(component.phase()).toBe('labeled');
      expect(snackbarMock.showSuccess).toHaveBeenCalled();
    }));

    it('should not call processLabel when unitData is null', () => {
      component.unitData.set(null);
      serviceMock.processLabel.calls.reset();
      component.onRow1ProductCodeChanged({ code: 'PC1', description: 'Test' });
      expect(serviceMock.processLabel).not.toHaveBeenCalled();
    });
  });

  describe('callProcessLabel (via onRow1ProductCodeChanged)', () => {
    beforeEach(() => {
      component.unitData.set({ unitId: 'U1', parsedUnitId: 'W1234', collDate: '2024-01-01', donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: 'I' });
      component.labelTypeControl.setValue('PFF');
    });

    it('should not advance to labeled phase when response has no item', fakeAsync(() => {
      serviceMock.processLabel.and.returnValue(of({ success: true, item: null }));
      component.onRow1ProductCodeChanged({ code: 'PC1', description: 'Test' });
      tick();
      expect(component.phase()).not.toBe('labeled');
      expect(component.loading()).toBe(false);
    }));

    it('should handle error from processLabel', fakeAsync(() => {
      serviceMock.processLabel.and.returnValue(throwError(() => new Error('API Error')));
      component.onRow1ProductCodeChanged({ code: 'PC1', description: 'Test' });
      tick();
      expect(component.loading()).toBe(false);
    }));

    it('should handle not success response', fakeAsync(() => {
      serviceMock.processLabel.and.returnValue(of({ success: false }));
      component.onRow1ProductCodeChanged({ code: 'PC1', description: 'Test' });
      tick();
      expect(component.phase()).not.toBe('labeled');
    }));

    it('should load ABO LOV on success with productCode', fakeAsync(() => {
      serviceMock.processLabel.and.returnValue(of({
        success: true,
        item: { status: 'OK', productCode: 'PC1', productType: 'RBC', label: 'FL', expiryDate: '2025-01-01', codeScheme: 'I', requiresSpecialTesting: true, specialTestingCode: 'ST1', warnings: [] }
      }));
      serviceMock.getAboLov.and.returnValue(of({ success: true, data: [{ code: 'O+', description: 'O Positive' }] }));
      serviceMock.getSpecialTestLov.and.returnValue(of({ success: true, data: [{ code: 'CMV', description: 'CMV Neg' }] }));
      component.onRow1ProductCodeChanged({ code: 'PC1', description: 'Test' });
      tick();
      expect(serviceMock.getAboLov).toHaveBeenCalled();
      expect(serviceMock.getSpecialTestLov).toHaveBeenCalled();
      expect(component.aboLovOptions().length).toBe(1);
      expect(component.specialTestLovOptions().length).toBe(1);
    }));

    it('should send overrides when processLabelOverrides has values', fakeAsync(() => {
      component.processLabelOverrides.set(['OVR1']);
      serviceMock.processLabel.and.returnValue(of({
        success: true,
        item: { status: 'OK', productCode: 'PC1', label: 'FL', expiryDate: '2025-01-01', codeScheme: 'I', requiresSpecialTesting: false, warnings: [] }
      }));
      serviceMock.getAboLov.and.returnValue(of({ success: true, data: [] }));
      component.onRow1ProductCodeChanged({ code: 'PC1', description: 'Test' });
      tick();
      const callArgs = serviceMock.processLabel.calls.mostRecent().args[0];
      expect(callArgs.overrides).toEqual(['OVR1']);
    }));
  });

  describe('onChangePrinter', () => {
    it('should navigate to change-label-printer route', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      component.onChangePrinter();
      expect(router.navigate).toHaveBeenCalledWith(
        ['/laboratory-functions/labeling-functions/common-labeling-functions/change-label-printer'],
        { queryParams: { returnUrl: '/laboratory-functions/reprint-labels' } },
      );
    });
  });

  describe('onClearAll', () => {
    it('should clear all state and reload', () => {
      component.labelTypeControl.setValue('PFF');
      component.labelTypeDescription.set('Test');
      component.unitData.set({ unitId: 'U1', parsedUnitId: 'W1234', collDate: '', donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: null });
      serviceMock.getLabelTypes.calls.reset();
      component.onClearAll();
      expect(component.labelTypeControl.value).toBe('');
      expect(component.phase()).toBe('ready');
      expect(component.unitData()).toBeNull();
      expect(serviceMock.getLabelTypes).toHaveBeenCalled();
    });
  });

  describe('onAutoScan', () => {
    it('should blur input when scan matches pattern', () => {
      const blurSpy = jasmine.createSpy('blur');
      const event = { target: { value: '=' + '0'.repeat(15), blur: blurSpy } } as any;
      component.onAutoScan(event, component.SCAN_PATTERNS.UNIT_ID);
      expect(blurSpy).toHaveBeenCalled();
    });

    it('should not blur when scan does not match pattern', () => {
      const blurSpy = jasmine.createSpy('blur');
      const event = { target: { value: 'short', blur: blurSpy } } as any;
      component.onAutoScan(event, component.SCAN_PATTERNS.UNIT_ID);
      expect(blurSpy).not.toHaveBeenCalled();
    });
  });

  describe('onScanUnitAboBlur', () => {
    beforeEach(() => {
      component.unitData.set({ unitId: 'U1', parsedUnitId: 'W1234', collDate: '2024-01-01', donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: 'I' });
      component.verificationForm.get('scanUnitAbo')?.enable();
    });

    it('should return early when scan value is empty', () => {
      component.verificationForm.patchValue({ scanUnitAbo: '' });
      component.onScanUnitAboBlur();
      expect(scanServiceMock.validateUnitAboScan).not.toHaveBeenCalled();
    });

    it('should parse unit+abo scan on success', fakeAsync(() => {
      component.verificationForm.patchValue({ scanUnitAbo: '=SCAN12345678901' });
      scanServiceMock.validateUnitAboScan.and.returnValue(of({
        success: true,
        item: { parsedUnitId: 'W1234', aboCode: 'O+', aboDescription: 'O Positive', manualUnitId: '' }
      }));
      component.onScanUnitAboBlur();
      tick();
      expect(component.verifyParsedUnitId()).toBe('W1234');
    }));

    it('should show error when scanned unitId differs from expected', fakeAsync(() => {
      component.verificationForm.patchValue({ scanUnitAbo: '=SCAN12345678901' });
      scanServiceMock.validateUnitAboScan.and.returnValue(of({
        success: true,
        item: { parsedUnitId: 'DIFFERENT', aboCode: 'O+', aboDescription: 'O Positive', manualUnitId: '' }
      }));
      component.onScanUnitAboBlur();
      tick();
      expect(snackbarMock.showError).toHaveBeenCalled();
    }));

    it('should show error on failure response', fakeAsync(() => {
      component.verificationForm.patchValue({ scanUnitAbo: '=SCAN12345678901' });
      scanServiceMock.validateUnitAboScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '6040', error: 'Invalid scan' }
      }));
      component.onScanUnitAboBlur();
      tick();
      expect(snackbarMock.showError).toHaveBeenCalled();
    }));

    it('should handle API error', fakeAsync(() => {
      component.verificationForm.patchValue({ scanUnitAbo: '=SCAN12345678901' });
      scanServiceMock.validateUnitAboScan.and.returnValue(throwError(() => new Error('Network')));
      component.onScanUnitAboBlur();
      tick();
      expect(component.fieldProcessing['scanUnitAbo']).toBe(false);
    }));
  });

  describe('onVerifyUnitPostValidate', () => {
    it('should reject when scanned unitId differs from expected', () => {
      component.unitData.set({ unitId: 'U1', parsedUnitId: 'W1234', collDate: '', donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: null });
      const event = { data: { parsedUnitId: 'DIFFERENT' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onVerifyUnitPostValidate(event as any);
      expect(event.reject).toHaveBeenCalled();
    });

    it('should confirm when scanned unitId matches', () => {
      component.unitData.set({ unitId: 'U1', parsedUnitId: 'W1234', collDate: '', donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: null });
      const event = { data: { parsedUnitId: 'W1234' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onVerifyUnitPostValidate(event as any);
      expect(event.confirm).toHaveBeenCalled();
      expect(component.verifyParsedUnitId()).toBe('W1234');
    });
  });

  describe('onVerifyUnitValidated', () => {
    it('should call tryAutoVerify', () => {
      spyOn<any>(component, 'tryAutoVerify');
      component.onVerifyUnitValidated({} as any);
      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });
  });

  describe('onVerifyUnitCleared', () => {
    it('should clear verify parsed unit id', () => {
      component.verifyParsedUnitId.set('W1234');
      component.onVerifyUnitCleared();
      expect(component.verifyParsedUnitId()).toBe('');
    });
  });

  describe('onAboFieldChanged', () => {
    it('should set abo value and call tryAutoVerify', () => {
      spyOn<any>(component, 'tryAutoVerify');
      component.onAboFieldChanged({ code: 'O+', description: 'O Positive' });
      expect(component.scannedAboDescription()).toBe('O Positive');
      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should not call tryAutoVerify when option is null', () => {
      spyOn<any>(component, 'tryAutoVerify');
      component.onAboFieldChanged(null);
      expect((component as any).tryAutoVerify).not.toHaveBeenCalled();
    });
  });

  describe('onScanProdExpBlur', () => {
    beforeEach(() => {
      component.verificationForm.get('scanProdExp')?.enable();
    });

    it('should return early when scan value is empty', () => {
      component.verificationForm.patchValue({ scanProdExp: '' });
      component.onScanProdExpBlur();
      expect(scanServiceMock.validateProductExpiryScan).not.toHaveBeenCalled();
    });

    it('should parse product+expiry on success', fakeAsync(() => {
      component.verificationForm.patchValue({ scanProdExp: '=PRODEXP1234' });
      component.labelResult.set({ productCode: 'PC1' } as any);
      scanServiceMock.validateProductExpiryScan.and.returnValue(of({
        success: true,
        item: { productCode: 'PC1', expiryDate: '2025-01-01' }
      }));
      component.onScanProdExpBlur();
      tick();
      expect(component.verificationForm.get('scanProductCode')?.value).toBe('PC1');
    }));

    it('should show error on product mismatch', fakeAsync(() => {
      component.verificationForm.patchValue({ scanProdExp: '=PRODEXP1234' });
      component.labelResult.set({ productCode: 'PC1' } as any);
      scanServiceMock.validateProductExpiryScan.and.returnValue(of({
        success: true,
        item: { productCode: 'DIFFERENT', expiryDate: '2025-01-01' }
      }));
      component.onScanProdExpBlur();
      tick();
      expect(snackbarMock.showError).toHaveBeenCalled();
    }));

    it('should show error on failure response', fakeAsync(() => {
      component.verificationForm.patchValue({ scanProdExp: '=PRODEXP1234' });
      scanServiceMock.validateProductExpiryScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '9710', error: 'Bad scan' }
      }));
      component.onScanProdExpBlur();
      tick();
      expect(snackbarMock.showError).toHaveBeenCalled();
    }));

    it('should handle API error', fakeAsync(() => {
      component.verificationForm.patchValue({ scanProdExp: '=PRODEXP1234' });
      scanServiceMock.validateProductExpiryScan.and.returnValue(throwError(() => new Error('err')));
      component.onScanProdExpBlur();
      tick();
      expect(component.fieldProcessing['scanProdExp']).toBe(false);
    }));
  });

  describe('onScanProductCodeBlur', () => {
    beforeEach(() => {
      component.verificationForm.get('scanProductCode')?.enable();
    });

    it('should return early when scan value is empty', () => {
      component.verificationForm.patchValue({ scanProductCode: '' });
      component.onScanProductCodeBlur();
      expect(scanServiceMock.validateProductScan).not.toHaveBeenCalled();
    });

    it('should validate product code on success', fakeAsync(() => {
      component.verificationForm.patchValue({ scanProductCode: 'PC1' });
      component.labelResult.set({ productCode: 'PC1' } as any);
      scanServiceMock.validateProductScan.and.returnValue(of({
        success: true,
        item: { productCode: 'PC1' }
      }));
      component.onScanProductCodeBlur();
      tick();
      expect(component.verificationForm.get('scanProductCode')?.value).toBe('PC1');
    }));

    it('should show error on product mismatch', fakeAsync(() => {
      component.verificationForm.patchValue({ scanProductCode: 'PC2' });
      component.labelResult.set({ productCode: 'PC1' } as any);
      scanServiceMock.validateProductScan.and.returnValue(of({
        success: true,
        item: { productCode: 'PC2' }
      }));
      component.onScanProductCodeBlur();
      tick();
      expect(snackbarMock.showError).toHaveBeenCalled();
    }));

    it('should show error on failure response', fakeAsync(() => {
      component.verificationForm.patchValue({ scanProductCode: 'BAD' });
      scanServiceMock.validateProductScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '6035', error: 'Invalid product' }
      }));
      component.onScanProductCodeBlur();
      tick();
      expect(snackbarMock.showError).toHaveBeenCalled();
    }));

    it('should handle API error', fakeAsync(() => {
      component.verificationForm.patchValue({ scanProductCode: 'PC1' });
      scanServiceMock.validateProductScan.and.returnValue(throwError(() => new Error('err')));
      component.onScanProductCodeBlur();
      tick();
      expect(component.fieldProcessing['scanProductCode']).toBe(false);
    }));
  });

  describe('onScanExpDateBlur', () => {
    beforeEach(() => {
      component.verificationForm.get('scanExpDate')?.enable();
    });

    it('should return early when scan value is empty', () => {
      component.verificationForm.patchValue({ scanExpDate: '' });
      component.onScanExpDateBlur();
      expect(scanServiceMock.validateExpiryScan).not.toHaveBeenCalled();
    });

    it('should validate expiry date on success', fakeAsync(() => {
      component.verificationForm.patchValue({ scanExpDate: '20250101' });
      scanServiceMock.validateExpiryScan.and.returnValue(of({
        success: true,
        item: { expiryDate: '2025-01-01' }
      }));
      component.onScanExpDateBlur();
      tick();
      const val = component.verificationForm.get('scanExpDate')?.value;
      expect(val).toContain('JAN-2025');
    }));

    it('should show error on failure response', fakeAsync(() => {
      component.verificationForm.patchValue({ scanExpDate: 'BAD' });
      scanServiceMock.validateExpiryScan.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: '6030', error: 'Invalid date' }
      }));
      component.onScanExpDateBlur();
      tick();
      expect(snackbarMock.showError).toHaveBeenCalled();
    }));

    it('should handle API error', fakeAsync(() => {
      component.verificationForm.patchValue({ scanExpDate: '20250101' });
      scanServiceMock.validateExpiryScan.and.returnValue(throwError(() => new Error('err')));
      component.onScanExpDateBlur();
      tick();
      expect(component.fieldProcessing['scanExpDate']).toBe(false);
    }));
  });

  describe('onSpecialTestFieldChanged', () => {
    it('should set scanSpecialTest and call tryAutoVerify', () => {
      spyOn<any>(component, 'tryAutoVerify');
      component.onSpecialTestFieldChanged({ code: 'CMV', description: 'CMV Neg' });
      expect((component as any).tryAutoVerify).toHaveBeenCalled();
    });

    it('should not call tryAutoVerify when option is null', () => {
      spyOn<any>(component, 'tryAutoVerify');
      component.onSpecialTestFieldChanged(null);
      expect((component as any).tryAutoVerify).not.toHaveBeenCalled();
    });
  });

  describe('enableVerificationFields (via process-label success)', () => {
    beforeEach(() => {
      component.unitData.set({ unitId: 'U1', parsedUnitId: 'W1234', collDate: '2024-01-01', donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: 'I' });
    });

    it('should disable scanUnitAbo and scanAbo for PPD label type', fakeAsync(() => {
      component.labelTypeControl.setValue('PPD');
      serviceMock.processLabel.and.returnValue(of({
        success: true,
        item: { status: 'OK', productCode: 'PC1', label: 'FL', expiryDate: null, codeScheme: 'I', requiresSpecialTesting: false, warnings: [] }
      }));
      serviceMock.getAboLov.and.returnValue(of({ success: true, data: [] }));
      component.onRow1ProductCodeChanged({ code: 'PC1', description: 'Test' });
      tick();
      expect(component.verificationForm.get('scanUnitAbo')?.disabled).toBe(true);
      expect(component.verificationForm.get('scanAbo')?.disabled).toBe(true);
    }));

    it('should enable all fields for PFF with expiry and special testing', fakeAsync(() => {
      component.labelTypeControl.setValue('PFF');
      serviceMock.processLabel.and.returnValue(of({
        success: true,
        item: { status: 'OK', productCode: 'PC1', productType: 'RBC', label: 'FL', expiryDate: '2025-01-01', codeScheme: 'I', requiresSpecialTesting: true, warnings: [] }
      }));
      serviceMock.getAboLov.and.returnValue(of({ success: true, data: [] }));
      serviceMock.getSpecialTestLov.and.returnValue(of({ success: true, data: [] }));
      component.onRow1ProductCodeChanged({ code: 'PC1', description: 'Test' });
      tick();
      expect(component.verificationForm.get('scanUnitAbo')?.enabled).toBe(true);
      expect(component.verificationForm.get('scanSpecialTest')?.enabled).toBe(true);
    }));
  });

  describe('doVerification (via tryAutoVerify)', () => {
    beforeEach(() => {
      component.unitData.set({ unitId: 'U1', parsedUnitId: 'W1234', collDate: '2024-01-01', donorDecisionCode: null, systemLabelDecision: null, contractId: null, codeScheme: 'I' });
      component.labelTypeControl.setValue('PPD');
      component.labelResult.set({
        unitId: 'U1', productCode: 'PC1', label: 'FL', expiryDate: null, codeScheme: 'I',
        requiresSpecialTesting: false, rejectReasonCode: null, specialTestingCode: null,
        identifierCode: null, collDate: null, productType: null, productDescription: null,
        lifeSpanInd: null, isMfProduct: false, status: 'OK', warnings: []
      } as any);
      component.verificationForm.get('scanUnitId')?.enable();
      component.verificationForm.get('scanProductCode')?.enable();
    });

    it('should verify and clear for next unit on success', fakeAsync(() => {
      component.verificationForm.patchValue({ scanUnitId: 'W1234', scanProductCode: 'PC1' });
      component.verifyParsedUnitId.set('W1234');
      serviceMock.verifyLabel.and.returnValue(of({
        success: true,
        item: { verificationComplete: true }
      }));
      (component as any).tryAutoVerify();
      tick();
      expect(snackbarMock.showSuccess).toHaveBeenCalledWith('Label verified successfully');
      expect(component.unitData()).toBeNull();
      expect(component.phase()).toBe('ready');
    }));

    it('should show error on mismatch field', fakeAsync(() => {
      component.verificationForm.patchValue({ scanUnitId: 'W1234', scanProductCode: 'PC1' });
      component.verifyParsedUnitId.set('W1234');
      serviceMock.verifyLabel.and.returnValue(of({
        success: true,
        item: { verificationComplete: false, mismatchField: 'productCode', mismatchErrorCode: '9728' }
      }));
      (component as any).tryAutoVerify();
      tick();
      expect(snackbarMock.showError).toHaveBeenCalled();
    }));
  });

  describe('parseRow1ProductCode', () => {
    it('should return null for empty value', (done) => {
      component.parseRow1ProductCode('').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return matching option from productCodeOptions', (done) => {
      component.productCodeOptions.set([{ code: 'PC1', description: 'Red Cells' }]);
      component.parseRow1ProductCode('PC1').subscribe(result => {
        expect(result?.code).toBe('PC1');
        done();
      });
    });

    it('should call labelScanService when no local match', (done) => {
      component.productCodeOptions.set([]);
      scanServiceMock.validateProductScan.and.returnValue(of({
        success: true,
        item: { productCode: 'PC2', productDescription: 'Plasma' }
      }));
      component.parseRow1ProductCode('PC2').subscribe(result => {
        expect(result?.code).toBe('PC2');
        done();
      });
    });
  });

  describe('parseAbo', () => {
    it('should return parsed ABO on success', (done) => {
      scanServiceMock.validateAboScan.and.returnValue(of({
        success: true,
        item: { aboCode: 'O+', aboShortName: 'O Positive' }
      }));
      component.parseAbo('O+').subscribe(result => {
        expect(result?.code).toBe('O+');
        done();
      });
    });

    it('should throw on failure', (done) => {
      scanServiceMock.validateAboScan.and.returnValue(of({
        success: false,
        errorResponse: { error: 'Invalid ABO' }
      }));
      component.parseAbo('XX').subscribe({
        error: (err: any) => {
          expect(err.message).toBe('Invalid ABO');
          done();
        }
      });
    });
  });

  describe('parseSpTest', () => {
    it('should return parsed special test on success', (done) => {
      scanServiceMock.validateSpTestScan.and.returnValue(of({
        success: true,
        item: { spTestCode: 'CMV', description: 'CMV Neg' }
      }));
      component.parseSpTest('CMV').subscribe(result => {
        expect(result?.code).toBe('CMV');
        done();
      });
    });

    it('should throw on failure', (done) => {
      scanServiceMock.validateSpTestScan.and.returnValue(of({
        success: false,
        message: 'Invalid SP test'
      }));
      component.parseSpTest('XX').subscribe({
        error: (err: any) => {
          expect(err.message).toBe('Invalid SP test');
          done();
        }
      });
    });
  });

  describe('formatDateDisplay (additional branches)', () => {
    it('should return empty string for null', () => {
      expect((component as any).formatDateDisplay(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect((component as any).formatDateDisplay(undefined)).toBe('');
    });

    it('should format date with time component', () => {
      const formatted = (component as any).formatDateDisplay('2025-06-15T14:30:00');
      expect(formatted).toBe('15-JUN-2025 14:30');
    });
  });

  describe('mapMismatchFieldToControl', () => {
    it('should map unitId to scanUnitId', () => {
      expect((component as any).mapMismatchFieldToControl('unitId')).toBe('scanUnitId');
    });

    it('should map abo to scanAbo', () => {
      expect((component as any).mapMismatchFieldToControl('abo')).toBe('scanAbo');
    });

    it('should map productCode to scanProductCode', () => {
      expect((component as any).mapMismatchFieldToControl('productCode')).toBe('scanProductCode');
    });

    it('should map date to scanExpDate', () => {
      expect((component as any).mapMismatchFieldToControl('date')).toBe('scanExpDate');
    });

    it('should map specialTesting to scanSpecialTest', () => {
      expect((component as any).mapMismatchFieldToControl('specialTesting')).toBe('scanSpecialTest');
    });

    it('should return undefined for unknown field', () => {
      expect((component as any).mapMismatchFieldToControl('unknown')).toBeUndefined();
    });
  });

  describe('loadPrinterFromStorage edge cases', () => {
    it('should handle invalid JSON in sessionStorage', () => {
      sessionStorage.setItem('labelPrinterContext', 'not-json');
      (component as any).loadPrinterFromStorage();
      expect(component.currentPrinterName()).toBe('Not configured');
    });
  });

  describe('clearFieldError', () => {
    it('should clear scanError from control', () => {
      const control = component.verificationForm.get('scanUnitAbo');
      control?.enable();
      control?.setErrors({ scanError: true });
      (component as any).clearFieldError('scanUnitAbo');
      expect(control?.hasError('scanError')).toBe(false);
    });

    it('should not clear non-scanError errors', () => {
      const control = component.verificationForm.get('scanUnitAbo');
      control?.enable();
      control?.setErrors({ required: true });
      (component as any).clearFieldError('scanUnitAbo');
      expect(control?.hasError('required')).toBe(true);
    });
  });

  describe('showScanError', () => {
    it('should show error and set control errors', () => {
      const control = component.verificationForm.get('scanUnitId');
      control?.enable();
      control?.setValue('test');
      (component as any).showScanError('1508', 'Mismatch', 'scanUnitId');
      expect(snackbarMock.showError).toHaveBeenCalledWith('1508: Mismatch');
      expect(control?.value).toBe('');
      expect(control?.hasError('scanError')).toBe(true);
    });

    it('should work without controlName', () => {
      (component as any).showScanError('1508', 'Mismatch');
      expect(snackbarMock.showError).toHaveBeenCalledWith('1508: Mismatch');
    });
  });
});
