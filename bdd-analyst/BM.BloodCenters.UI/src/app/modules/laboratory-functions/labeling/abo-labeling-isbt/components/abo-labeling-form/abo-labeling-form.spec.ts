import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { signal } from '@angular/core';
import moment from 'moment';

import { AboLabelingFormComponent } from './abo-labeling-form';
import { AboLabelingApiService } from '../../services/abo-labeling-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AboLabelingFormComponent', () => {
  let dialogRefSpy: any;
  let component: any; // typed as any to access protected signals/properties in tests
  let fixture: ComponentFixture<AboLabelingFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<AboLabelingApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockUnitValidationResult = {
    isValid: true,
    unitId: 'W6333-19',
    checkDigit: '03',
    collectionDate: '2018-01-10T00:00:00Z',
    chapterId: 'CHAP01',
    errorMessage: null,
    errorCode: null,
  };

  const mockProductValidationResult = {
    isValid: true,
    productCode: 'E0385400',
    productDescription: 'FFP CPD',
    componentPrefix: '00',
    aboOnly: false,
    productFormula: 'FORMULA_FFP',
    errorMessage: null,
    errorCode: null,
  };

  const mockBarcodeValidationResult = {
    isValid: true,
    parsedValue: '026100',
    detectedFormat: 'CODE128',
    parsedDate: '2027-12-31T00:00:00Z',
    formatMetadata: 'Year=26, DayOfYear=100',
    errorMessage: null,
    errorCode: null,
  };

  const mockLabelResult = {
    success: true,
    labelLines: [
      'A POS',
      '',
      '',
      '',
      '',
      '',
      '',
      'Unit: W6333-19',
      'Product: E0385400',
    ],
    unitIdWithCheckDigit: 'W6333-19-03',
    productCode: 'E0385400',
    expiryDate128: '026100',
    aboType: 'A',
    rhType: 'POS',
    errorMessage: null,
    errorCode: null,
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('AboLabelingApiService', [
      'validateUnit',
      'validateProduct',
      'validateBarcode',
      'generateLabel',
    ]);
    headerServiceSpy = createMockHeaderService({ chapterId: signal('CHAP01') });
    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    apiServiceSpy.validateUnit.and.returnValue(of(mockUnitValidationResult));
    apiServiceSpy.validateProduct.and.returnValue(of(mockProductValidationResult));
    apiServiceSpy.validateBarcode.and.returnValue(of(mockBarcodeValidationResult));
    apiServiceSpy.generateLabel.and.returnValue(of(mockLabelResult));
      TestBed.configureTestingModule({
      imports: [AboLabelingFormComponent, NoopAnimationsModule],
      providers: [
        { provide: AboLabelingApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    })
    .overrideComponent(AboLabelingFormComponent, {
      remove: { imports: [MatDialogModule] },
    });
      apiServiceSpy.validateUnit.and.returnValue(of(mockUnitValidationResult));


      apiServiceSpy.validateProduct.and.returnValue(of(mockProductValidationResult));


      apiServiceSpy.validateBarcode.and.returnValue(of(mockBarcodeValidationResult));


      apiServiceSpy.generateLabel.and.returnValue(of(mockLabelResult));
    fixture = TestBed.createComponent(AboLabelingFormComponent);
    component = fixture.componentInstance as any;


    });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form on ngOnInit', () => {
      fixture.detectChanges();
      expect(component.form).toBeTruthy();
      expect(component.form.get('unitId')).toBeTruthy();
      expect(component.form.get('productCode')).toBeTruthy();
      expect(component.form.get('collectionDate')).toBeTruthy();
      expect(component.form.get('productDescription')).toBeTruthy();
      expect(component.form.get('scanUnitAbo')).toBeTruthy();
      expect(component.form.get('scannedUnitId')).toBeTruthy();
      expect(component.form.get('aboCode')).toBeTruthy();
      expect(component.form.get('aboDescription')).toBeTruthy();
      expect(component.form.get('scanProductExp')).toBeTruthy();
      expect(component.form.get('scannedProductCode')).toBeTruthy();
      expect(component.form.get('expirationDate')).toBeTruthy();
      expect(component.form.get('specialTesting')).toBeTruthy();
      expect(component.form.get('testedAbo')).toBeTruthy();
      expect(component.form.get('testedAboDescription')).toBeTruthy();
    });

    it('should have collectionDate disabled', () => {
      fixture.detectChanges();
      expect(component.form.get('collectionDate').disabled).toBeTrue();
    });

    it('should have productDescription disabled', () => {
      fixture.detectChanges();
      expect(component.form.get('productDescription').disabled).toBeTrue();
    });

    it('should have aboDescription disabled', () => {
      fixture.detectChanges();
      expect(component.form.get('aboDescription').disabled).toBeTrue();
    });

    it('should have testedAbo disabled', () => {
      fixture.detectChanges();
      expect(component.form.get('testedAbo').disabled).toBeTrue();
    });

    it('should have testedAboDescription disabled', () => {
      fixture.detectChanges();
      expect(component.form.get('testedAboDescription').disabled).toBeTrue();
    });

    it('should load interdictions on init', () => {
      fixture.detectChanges();
      expect(component.interdictions().length).toBe(3);
    });

    it('should load attributes on init', () => {
      fixture.detectChanges();
      expect(component.attributes().length).toBe(5);
    });

    it('should have initial signal values', () => {
      fixture.detectChanges();
      expect(component.unitData()).toBeNull();
      expect(component.scanData()).toBeNull();
      expect(component.aboDisplay()).toBeNull();
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
      expect(component.submitted()).toBeFalse();
    });

    it('should expose aboTypes and rhTypes', () => {
      fixture.detectChanges();
      expect(component.aboTypes.length).toBe(4);
      expect(component.rhTypes.length).toBe(2);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component.destroy$, 'next');
      const completeSpy = spyOn(component.destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility ID Generation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate elementId with component prefix', () => {
      const id = component.elementId('unitId');
      expect(id).toContain('abo-labeling-form-');
      expect(id).toContain('-unitId');
    });

    it('should generate errorId with component prefix and -error suffix', () => {
      const id = component.errorId('unitId');
      expect(id).toContain('abo-labeling-form-');
      expect(id).toContain('-unitId-error');
    });

    it('should generate labelId with component prefix and -label suffix', () => {
      const id = component.labelId('unitId');
      expect(id).toContain('abo-labeling-form-');
      expect(id).toContain('-unitId-label');
    });

    it('should generate hintId with component prefix and -hint suffix', () => {
      const id = component.hintId('unitId');
      expect(id).toContain('abo-labeling-form-');
      expect(id).toContain('-unitId-hint');
    });
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for isReady when not loading and no error', () => {
      component.loading.set(false);
      component.error.set(null);
      expect(component.isReady()).toBeTrue();
    });

    it('should return false for isReady when loading', () => {
      component.loading.set(true);
      component.error.set(null);
      expect(component.isReady()).toBeFalse();
    });

    it('should return false for isReady when there is an error', () => {
      component.loading.set(false);
      component.error.set('some error');
      expect(component.isReady()).toBeFalse();
    });

    it('should return false for hasUnitData when unitData is null', () => {
      component.unitData.set(null);
      expect(component.hasUnitData()).toBeFalse();
    });

    it('should return true for hasUnitData when unitData is set', () => {
      component.unitData.set({ unitId: 'W6333-19' });
      expect(component.hasUnitData()).toBeTrue();
    });

    it('should return false for hasAboDisplay when aboDisplay is null', () => {
      component.aboDisplay.set(null);
      expect(component.hasAboDisplay()).toBeFalse();
    });

    it('should return true for hasAboDisplay when aboDisplay is set', () => {
      component.aboDisplay.set({ aboType: 'A', rhType: 'POS', displayText: 'A POS', defaultUseStatus: '' });
      expect(component.hasAboDisplay()).toBeTrue();
    });
  });

  describe('Form Controls Getter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return form controls via f getter', () => {
      const controls = component.f;
      expect(controls['unitId']).toBeTruthy();
      expect(controls['productCode']).toBeTruthy();
      expect(controls['aboCode']).toBeTruthy();
      expect(controls['expirationDate']).toBeTruthy();
    });
  });

  describe('Form Fields', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have required validators on unitId', () => {
      const unitIdControl = component.form.get('unitId');
      expect(unitIdControl?.hasError('required')).toBeTrue();

      unitIdControl?.setValue('W6333-19');
      expect(unitIdControl?.hasError('required')).toBeFalse();
    });

    it('should have maxLength validator on unitId', () => {
      const unitIdControl = component.form.get('unitId');
      unitIdControl?.setValue('12345678901234567');
      expect(unitIdControl?.hasError('maxlength')).toBeTrue();
    });

    it('should accept unitId within maxLength', () => {
      const unitIdControl = component.form.get('unitId');
      unitIdControl?.setValue('1234567890123456');
      expect(unitIdControl?.hasError('maxlength')).toBeFalse();
    });

    it('should have required validators on productCode', () => {
      const productCodeControl = component.form.get('productCode');
      expect(productCodeControl?.hasError('required')).toBeTrue();

      productCodeControl?.setValue('E0385400');
      expect(productCodeControl?.hasError('required')).toBeFalse();
    });

    it('should have maxLength validator on productCode', () => {
      const productCodeControl = component.form.get('productCode');
      productCodeControl?.setValue('123456789');
      expect(productCodeControl?.hasError('maxlength')).toBeTrue();
    });

    it('should accept productCode within maxLength', () => {
      const productCodeControl = component.form.get('productCode');
      productCodeControl?.setValue('12345678');
      expect(productCodeControl?.hasError('maxlength')).toBeFalse();
    });
  });

  describe('Unit ID Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate unit ID on Enter key', fakeAsync(() => {
      component.form.patchValue({ unitId: 'W6333-19-0301-X' });

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith({
        scannedUnitId: 'W6333-19-0301-X',
        entryMode: null,
        chapterId: 'CHAP01',
      });
      expect(component.unitData()?.unitId).toBe('W6333-19');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should update collection date after unit validation', fakeAsync(() => {
      component.form.patchValue({ unitId: 'W6333-19' });

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(component.f['collectionDate'].value).toBe('10-JAN-2018');
    }));

    it('should not call API if key is not Enter', () => {
      component.form.patchValue({ unitId: 'W6333-19' });
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      component.onUnitIdScan(event);

      expect(apiServiceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should not call API if unitId is empty', () => {
      component.form.patchValue({ unitId: '' });
      component.onUnitIdScan();

      expect(apiServiceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should not call API if unitId is only whitespace', () => {
      component.form.patchValue({ unitId: '   ' });
      component.onUnitIdScan();

      expect(apiServiceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should use entryMode M when called without event (manual entry)', fakeAsync(() => {
      component.form.patchValue({ unitId: 'W6333-19' });
      component.onUnitIdScan();
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith({
        scannedUnitId: 'W6333-19',
        entryMode: 'M',
        chapterId: 'CHAP01',
      });
    }));

    it('should handle invalid unit validation result', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        isValid: false,
        unitId: '',
        checkDigit: null,
        collectionDate: null,
        chapterId: null,
        errorMessage: 'Unit not found',
        errorCode: 'UNIT_NOT_FOUND',
      }));

      component.form.patchValue({ unitId: 'INVALID-ID' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(component.error()).toBe('Unit not found');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unit not found');
      expect(component.loading()).toBeFalse();
    }));

    it('should use default error message when errorMessage is null on invalid result', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        isValid: false,
        unitId: '',
        checkDigit: null,
        collectionDate: null,
        chapterId: null,
        errorMessage: null,
        errorCode: null,
      }));

      component.form.patchValue({ unitId: 'INVALID-ID' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(component.error()).toBe('Invalid Unit ID');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid Unit ID');
    }));

    it('should handle API error on unit validation', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.form.patchValue({ unitId: 'W6333-19' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(component.error()).toBe('Network error');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to validate Unit ID');
      expect(component.loading()).toBeFalse();
    }));

    it('should use default error message when API error has no message', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({}))
      );

      component.form.patchValue({ unitId: 'W6333-19' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(component.error()).toBe('Failed to validate Unit ID');
    }));

    it('should set loading to false after validation completes', fakeAsync(() => {
      component.form.patchValue({ unitId: 'W6333-19' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(component.loading()).toBeFalse();
    }));

    it('should clear error before validation', fakeAsync(() => {
      component.error.set('previous error');
      component.form.patchValue({ unitId: 'W6333-19' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(component.error()).toBeNull();
    }));

    it('should not set collection date if result has no collectionDate', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        isValid: true,
        unitId: 'W6333-19',
        checkDigit: '03',
        collectionDate: null,
        chapterId: 'CHAP01',
        errorMessage: null,
        errorCode: null,
      }));

      component.form.patchValue({ unitId: 'W6333-19' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(component.f['collectionDate'].value).toBe('');
    }));

    it('should set checkDigit as undefined when result has no checkDigit', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        isValid: true,
        unitId: 'W6333-19',
        checkDigit: null,
        collectionDate: null,
        chapterId: 'CHAP01',
        errorMessage: null,
        errorCode: null,
      }));

      component.form.patchValue({ unitId: 'W6333-19' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(component.unitData()?.checkDigit).toBeUndefined();
    }));
  });

  describe('Product Code Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate product code on Enter key', fakeAsync(() => {
      component.unitData.set({
        unitId: 'W6333-19',
        checkDigit: '03',
      });
      component.form.patchValue({ productCode: 'E0385400' });

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onProductCodeScan(event);
      tick();

      expect(apiServiceSpy.validateProduct).toHaveBeenCalledWith({
        scannedProductCode: 'E0385400',
        unitId: 'W6333-19',
        entryMode: null,
        chapterId: 'CHAP01',
      });
      expect(component.f['productDescription'].value).toBe('FFP CPD');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should not call API if key is not Enter', () => {
      component.form.patchValue({ productCode: 'E0385400' });
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      component.onProductCodeScan(event);

      expect(apiServiceSpy.validateProduct).not.toHaveBeenCalled();
    });

    it('should not call API if productCode is empty', () => {
      component.form.patchValue({ productCode: '' });
      component.onProductCodeScan();

      expect(apiServiceSpy.validateProduct).not.toHaveBeenCalled();
    });

    it('should not call API if productCode is only whitespace', () => {
      component.form.patchValue({ productCode: '   ' });
      component.onProductCodeScan();

      expect(apiServiceSpy.validateProduct).not.toHaveBeenCalled();
    });

    it('should use entryMode M when called without event (manual entry)', fakeAsync(() => {
      component.form.patchValue({ productCode: 'E0385400' });
      component.onProductCodeScan();
      tick();

      expect(apiServiceSpy.validateProduct).toHaveBeenCalledWith(
        jasmine.objectContaining({ entryMode: 'M' })
      );
    }));

    it('should send unitId as undefined when no unitData exists', fakeAsync(() => {
      component.unitData.set(null);
      component.form.patchValue({ productCode: 'E0385400' });
      component.onProductCodeScan();
      tick();

      expect(apiServiceSpy.validateProduct).toHaveBeenCalledWith(
        jasmine.objectContaining({ unitId: undefined })
      );
    }));

    it('should handle invalid product validation result', fakeAsync(() => {
      apiServiceSpy.validateProduct.and.returnValue(of({
        isValid: false,
        productCode: '',
        productDescription: null,
        componentPrefix: null,
        aboOnly: false,
        productFormula: null,
        errorMessage: 'Product not found',
        errorCode: 'PROD_NOT_FOUND',
      }));

      component.form.patchValue({ productCode: 'INVALID' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onProductCodeScan(event);
      tick();

      expect(component.error()).toBe('Product not found');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Product not found');
      expect(component.loading()).toBeFalse();
    }));

    it('should use default error message when errorMessage is null on invalid product', fakeAsync(() => {
      apiServiceSpy.validateProduct.and.returnValue(of({
        isValid: false,
        productCode: '',
        productDescription: null,
        componentPrefix: null,
        aboOnly: false,
        productFormula: null,
        errorMessage: null,
        errorCode: null,
      }));

      component.form.patchValue({ productCode: 'INVALID' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onProductCodeScan(event);
      tick();

      expect(component.error()).toBe('Invalid Product Code');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid Product Code');
    }));

    it('should handle API error on product validation', fakeAsync(() => {
      apiServiceSpy.validateProduct.and.returnValue(
        throwError(() => new Error('Server unavailable'))
      );

      component.form.patchValue({ productCode: 'E0385400' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onProductCodeScan(event);
      tick();

      expect(component.error()).toBe('Server unavailable');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to validate Product Code');
      expect(component.loading()).toBeFalse();
    }));

    it('should use default error message when API error has no message', fakeAsync(() => {
      apiServiceSpy.validateProduct.and.returnValue(
        throwError(() => ({}))
      );

      component.form.patchValue({ productCode: 'E0385400' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onProductCodeScan(event);
      tick();

      expect(component.error()).toBe('Failed to validate Product Code');
    }));

    it('should update unitData with product info when unitData exists', fakeAsync(() => {
      component.unitData.set({ unitId: 'W6333-19', checkDigit: '03' });
      component.form.patchValue({ productCode: 'E0385400' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onProductCodeScan(event);
      tick();

      const updatedUnit = component.unitData();
      expect(updatedUnit.unitId).toBe('W6333-19');
      expect(updatedUnit.productCode).toBe('E0385400');
      expect(updatedUnit.productDescription).toBe('FFP CPD');
    }));

    it('should not update unitData when unitData is null', fakeAsync(() => {
      component.unitData.set(null);
      component.form.patchValue({ productCode: 'E0385400' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onProductCodeScan(event);
      tick();

      expect(component.unitData()).toBeNull();
      expect(component.f['productDescription'].value).toBe('FFP CPD');
    }));

    it('should set productDescription to empty string when result has no productDescription', fakeAsync(() => {
      apiServiceSpy.validateProduct.and.returnValue(of({
        isValid: true,
        productCode: 'E0385400',
        productDescription: null,
        componentPrefix: null,
        aboOnly: false,
        productFormula: null,
        errorMessage: null,
        errorCode: null,
      }));

      component.unitData.set({ unitId: 'W6333-19' });
      component.form.patchValue({ productCode: 'E0385400' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onProductCodeScan(event);
      tick();

      expect(component.f['productDescription'].value).toBe('');
      expect(component.unitData().productDescription).toBeUndefined();
    }));

    it('should set loading to false after product validation completes', fakeAsync(() => {
      component.form.patchValue({ productCode: 'E0385400' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onProductCodeScan(event);
      tick();

      expect(component.loading()).toBeFalse();
    }));

    it('should clear error before product validation', fakeAsync(() => {
      component.error.set('previous error');
      component.form.patchValue({ productCode: 'E0385400' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onProductCodeScan(event);
      tick();

      expect(component.error()).toBeNull();
    }));
  });

  describe('ABO Code Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update ABO description on selection', () => {
      component.form.patchValue({ aboCode: 'A' });
      component.onAboCodeChange();

      expect(component.f['aboDescription'].value).toBe('A Pos Regular');
    });

    it('should update ABO display on selection', () => {
      component.form.patchValue({ aboCode: 'O' });
      component.onAboCodeChange();

      const display = component.aboDisplay();
      expect(display?.aboType).toBe('O');
      expect(display?.rhType).toBe('POS');
      expect(display?.displayText).toBe('O POS');
    });

    it('should not update if aboCode is empty', () => {
      component.form.patchValue({ aboCode: '' });
      component.onAboCodeChange();

      expect(component.f['aboDescription'].value).toBe('');
    });

    it('should update display for each ABO type', () => {
      component.form.patchValue({ aboCode: 'B' });
      component.onAboCodeChange();
      expect(component.f['aboDescription'].value).toBe('B Pos Regular');

      component.form.patchValue({ aboCode: 'AB' });
      component.onAboCodeChange();
      expect(component.f['aboDescription'].value).toBe('AB Pos Regular');
    });

    it('should not update aboDescription for unknown aboCode', () => {
      component.form.patchValue({ aboCode: 'X' });
      component.onAboCodeChange();

      // aboType.find returns undefined for unknown code, so aboDescription is not updated
      expect(component.aboDisplay()).toBeNull();
    });

    it('should set defaultUseStatus with Rh description', () => {
      component.form.patchValue({ aboCode: 'A' });
      component.onAboCodeChange();

      const display = component.aboDisplay();
      expect(display?.defaultUseStatus).toContain('Rh POSITIVE');
      expect(display?.defaultUseStatus).toContain('DEFAULT / INTENDED USE NOT SPECIFIED');
    });
  });

  describe('Expiration Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate Code 128 barcode (6 digits)', fakeAsync(() => {
      component.form.patchValue({ expirationDate: '026100' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      expect(apiServiceSpy.validateBarcode).toHaveBeenCalledWith({
        scannedBarcode: '026100',
        barcodeFormat: '128',
        fieldType: 'EXPIRY_DATE',
      });
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should detect Codabar format for non-6-digit input', fakeAsync(() => {
      component.form.patchValue({ expirationDate: '05-27-26 14:30' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      expect(apiServiceSpy.validateBarcode).toHaveBeenCalledWith({
        scannedBarcode: '05-27-26 14:30',
        barcodeFormat: 'CODABAR',
        fieldType: 'EXPIRY_DATE',
      });
    }));

    it('should not call API if key is not Enter', () => {
      component.form.patchValue({ expirationDate: '026100' });
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      component.onExpirationDateScan(event);

      expect(apiServiceSpy.validateBarcode).not.toHaveBeenCalled();
    });

    it('should not call API if expirationDate is empty', () => {
      component.form.patchValue({ expirationDate: '' });
      component.onExpirationDateScan();

      expect(apiServiceSpy.validateBarcode).not.toHaveBeenCalled();
    });

    it('should not call API if expirationDate is only whitespace', () => {
      component.form.patchValue({ expirationDate: '   ' });
      component.onExpirationDateScan();

      expect(apiServiceSpy.validateBarcode).not.toHaveBeenCalled();
    });

    it('should handle invalid barcode validation result', fakeAsync(() => {
      apiServiceSpy.validateBarcode.and.returnValue(of({
        isValid: false,
        parsedValue: '',
        detectedFormat: '',
        parsedDate: null,
        formatMetadata: null,
        errorMessage: 'Invalid barcode',
        errorCode: 'BARCODE_INVALID',
      }));

      component.form.patchValue({ expirationDate: 'XXXXX' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      expect(component.error()).toBe('Invalid barcode');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid barcode');
      expect(component.loading()).toBeFalse();
    }));

    it('should use default error message when barcode errorMessage is null', fakeAsync(() => {
      apiServiceSpy.validateBarcode.and.returnValue(of({
        isValid: false,
        parsedValue: '',
        detectedFormat: '',
        parsedDate: null,
        formatMetadata: null,
        errorMessage: null,
        errorCode: null,
      }));

      component.form.patchValue({ expirationDate: 'XXXXX' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      expect(component.error()).toBe('Invalid barcode format');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid barcode format');
    }));

    it('should handle valid barcode with null parsedDate as invalid', fakeAsync(() => {
      apiServiceSpy.validateBarcode.and.returnValue(of({
        isValid: true,
        parsedValue: '026100',
        detectedFormat: 'CODE128',
        parsedDate: null,
        formatMetadata: null,
        errorMessage: null,
        errorCode: null,
      }));

      component.form.patchValue({ expirationDate: '026100' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      // isValid is true but parsedDate is null, so the else branch should be taken
      expect(component.error()).toBe('Invalid barcode format');
    }));

    it('should handle API error on barcode validation', fakeAsync(() => {
      apiServiceSpy.validateBarcode.and.returnValue(
        throwError(() => new Error('Service down'))
      );

      component.form.patchValue({ expirationDate: '026100' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      expect(component.error()).toBe('Service down');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to validate barcode');
      expect(component.loading()).toBeFalse();
    }));

    it('should use default error message when API error has no message', fakeAsync(() => {
      apiServiceSpy.validateBarcode.and.returnValue(
        throwError(() => ({}))
      );

      component.form.patchValue({ expirationDate: '026100' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      expect(component.error()).toBe('Failed to validate barcode');
    }));

    it('should clear expiration date if user declines to continue with expired product', fakeAsync(() => {
      const pastDate = moment().subtract(1, 'day').toISOString();
      apiServiceSpy.validateBarcode.and.returnValue(
        of({
          isValid: true,
          parsedValue: '026001',
          detectedFormat: 'CODE128',
          parsedDate: pastDate,
          formatMetadata: null,
          errorMessage: null,
          errorCode: null,
        })
      );

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.form.patchValue({ expirationDate: '026001' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      expect(component.f['expirationDate'].value).toBe('');
    }));

    it('should keep expiration date if user accepts expired product', fakeAsync(() => {
      const pastDate = moment().subtract(1, 'day').toISOString();
      apiServiceSpy.validateBarcode.and.returnValue(
        of({
          isValid: true,
          parsedValue: '026001',
          detectedFormat: 'CODE128',
          parsedDate: pastDate,
          formatMetadata: null,
          errorMessage: null,
          errorCode: null,
        })
      );

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.form.patchValue({ expirationDate: '026001' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      expect(component.f['expirationDate'].value).toBe('026001');
      expect(component.loading()).toBeFalse();
    }));

    it('should show success and not open dialog for non-expired date', fakeAsync(() => {
      const futureDate = moment().add(30, 'days').toISOString();
      apiServiceSpy.validateBarcode.and.returnValue(
        of({
          isValid: true,
          parsedValue: '026200',
          detectedFormat: 'CODE128',
          parsedDate: futureDate,
          formatMetadata: null,
          errorMessage: null,
          errorCode: null,
        })
      );

      component.form.patchValue({ expirationDate: '026200' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Expiration date validated successfully');
      expect(component.loading()).toBeFalse();
    }));

    it('should set loading to false after barcode validation completes', fakeAsync(() => {
      component.form.patchValue({ expirationDate: '026100' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onExpirationDateScan(event);
      tick();

      expect(component.loading()).toBeFalse();
    }));
  });

  describe('Reprint Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.unitData.set({
        unitId: 'W6333-19',
        productCode: 'E0385400',
      });
      component.form.patchValue({
        aboCode: 'A',
        expirationDate: '026100',
      });
      component.aboDisplay.set({
        aboType: 'A',
        rhType: 'POS',
        displayText: 'A POS',
        defaultUseStatus: 'Rh POSITIVE',
      });
    });

    it('should generate label on reprint', fakeAsync(() => {
      component.onReprint();
      tick();

      expect(apiServiceSpy.generateLabel).toHaveBeenCalledWith({
        unitId: 'W6333-19',
        productCode: 'E0385400',
        expiryDate128: '026100',
        expiryDateCodabar: undefined,
        aboType: 'A',
        rhType: 'POS',
        chapterId: 'CHAP01',
      });
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should show error if unitId is missing', () => {
      component.unitData.set(null);
      component.onReprint();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please complete all required fields before reprinting'
      );
      expect(apiServiceSpy.generateLabel).not.toHaveBeenCalled();
    });

    it('should show error if productCode is missing', () => {
      component.unitData.set({ unitId: 'W6333-19' });
      component.onReprint();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please complete all required fields before reprinting'
      );
      expect(apiServiceSpy.generateLabel).not.toHaveBeenCalled();
    });

    it('should show error if aboCode is missing', () => {
      component.form.patchValue({ aboCode: '' });
      component.onReprint();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please complete all required fields before reprinting'
      );
      expect(apiServiceSpy.generateLabel).not.toHaveBeenCalled();
    });

    it('should show error if expirationDate is missing', () => {
      component.form.patchValue({ expirationDate: '' });
      component.onReprint();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please complete all required fields before reprinting'
      );
      expect(apiServiceSpy.generateLabel).not.toHaveBeenCalled();
    });

    it('should use Codabar format when expirationDate is not 6 digits', fakeAsync(() => {
      component.form.patchValue({ expirationDate: '05-27-2026' });
      component.onReprint();
      tick();

      expect(apiServiceSpy.generateLabel).toHaveBeenCalledWith(
        jasmine.objectContaining({
          expiryDate128: undefined,
          expiryDateCodabar: '05-27-2026',
        })
      );
    }));

    it('should use expiryDate128 when expirationDate is exactly 6 digits', fakeAsync(() => {
      component.form.patchValue({ expirationDate: '026100' });
      component.onReprint();
      tick();

      expect(apiServiceSpy.generateLabel).toHaveBeenCalledWith(
        jasmine.objectContaining({
          expiryDate128: '026100',
          expiryDateCodabar: undefined,
        })
      );
    }));

    it('should handle unsuccessful label generation', fakeAsync(() => {
      apiServiceSpy.generateLabel.and.returnValue(of({
        success: false,
        labelLines: [],
        unitIdWithCheckDigit: '',
        productCode: '',
        aboType: '',
        errorMessage: 'Print queue full',
        errorCode: 'QUEUE_FULL',
      }));

      component.onReprint();
      tick();

      expect(component.error()).toBe('Print queue full');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Print queue full');
      expect(component.loading()).toBeFalse();
    }));

    it('should use default error when unsuccessful generation has no errorMessage', fakeAsync(() => {
      apiServiceSpy.generateLabel.and.returnValue(of({
        success: false,
        labelLines: [],
        unitIdWithCheckDigit: '',
        productCode: '',
        aboType: '',
        errorMessage: null,
        errorCode: null,
      }));

      component.onReprint();
      tick();

      expect(component.error()).toBe('Failed to generate label');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to generate label');
    }));

    it('should handle generate label error', fakeAsync(() => {
      apiServiceSpy.generateLabel.and.returnValue(
        throwError(() => new Error('Generation failed'))
      );

      component.onReprint();
      tick();

      expect(component.error()).toBe('Generation failed');
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should use default error message when label API error has no message', fakeAsync(() => {
      apiServiceSpy.generateLabel.and.returnValue(
        throwError(() => ({}))
      );

      component.onReprint();
      tick();

      expect(component.error()).toBe('Failed to generate label');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to generate label');
    }));

    it('should use POS as default rhType when aboDisplay has no rhType', fakeAsync(() => {
      component.aboDisplay.set(null);
      component.onReprint();
      tick();

      expect(apiServiceSpy.generateLabel).toHaveBeenCalledWith(
        jasmine.objectContaining({ rhType: 'POS' })
      );
    }));

    it('should set loading to false after label generation completes', fakeAsync(() => {
      component.onReprint();
      tick();

      expect(component.loading()).toBeFalse();
    }));
  });

  describe('Error State', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show inline error message', () => {
      component.error.set('Test error message');
      component.loading.set(false);
      fixture.detectChanges();

      const errorContainer = fixture.nativeElement.querySelector('.inline-error');
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.textContent).toContain('Test error message');
    });

    it('should not show error when error is null', () => {
      component.error.set(null);
      fixture.detectChanges();

      const errorContainer = fixture.nativeElement.querySelector('.inline-error');
      expect(errorContainer).toBeFalsy();
    });
  });

  describe('Format Date', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format valid date as DD-MMM-YYYY uppercase', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        isValid: true,
        unitId: 'W6333-19',
        checkDigit: '03',
        collectionDate: '2023-06-15T00:00:00Z',
        chapterId: 'CHAP01',
        errorMessage: null,
        errorCode: null,
      }));

      component.form.patchValue({ unitId: 'W6333-19' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      expect(component.f['collectionDate'].value).toBe('15-JUN-2023');
    }));

    it('should return original value for invalid date', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        isValid: true,
        unitId: 'W6333-19',
        checkDigit: '03',
        collectionDate: 'not-a-date',
        chapterId: 'CHAP01',
        errorMessage: null,
        errorCode: null,
      }));

      component.form.patchValue({ unitId: 'W6333-19' });
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onUnitIdScan(event);
      tick();

      // moment('not-a-date').isValid() is false, so the original value is returned
      expect(component.f['collectionDate'].value).toBe('not-a-date');
    }));
  });
});
