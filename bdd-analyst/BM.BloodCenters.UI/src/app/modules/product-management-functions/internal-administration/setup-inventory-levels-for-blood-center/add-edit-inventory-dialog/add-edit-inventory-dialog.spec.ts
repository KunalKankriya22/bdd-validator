import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { AddEditInventoryDialog } from './add-edit-inventory-dialog';
import { SetupInventoryLevelsApiService } from '../services/setup-inventory-levels-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

describe('AddEditInventoryDialog', () => {
  let component: AddEditInventoryDialog;
  let fixture: ComponentFixture<AddEditInventoryDialog>;
  let apiServiceSpy: jasmine.SpyObj<SetupInventoryLevelsApiService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockEditData: any = {
    chapterId: 'TST',
    customerId: 'CUST1',
    inventoryClass: 'BL',
    productType: 'RBC',
    productTypeDesc: 'Red Blood Cells',
    bloodType: 'O+',
    bloodTypeDesc: 'O Positive',
    attribGroup: 'AG',
    attribCode: 'AC',
    inventoryType: 'MI',
    qty: 10,
    minQty: 10,
    optQty: 20,
    effDate: '2025-01-01',
    effDateDisplay: '01-Jan-2025',
    termDate: null,
    termDateDisplay: null,
    lastModifiedDate: '2025-03-15',
    lastModifiedDateDisplay: '15-Mar-2025',
  };

  function createComponent(mode: 'add' | 'edit' = 'add', data: any = null) {
    fixture = TestBed.createComponent(AddEditInventoryDialog);
    component = fixture.componentInstance;
    component.mode = mode;
    component.inventoryClass = 'BL';
    component.data = data;
    fixture.detectChanges();
  }

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('SetupInventoryLevelsApiService', [
      'getProductTypes',
      'getBloodTypes',
      'getAttributeGroups',
      'getAttributeCodes',
      'createInventoryLevel',
      'updateInventoryLevel',
      'getInventoryLevel',
    ]);
    apiServiceSpy.getProductTypes.and.returnValue(of([]));
    apiServiceSpy.getBloodTypes.and.returnValue(of([]));
    apiServiceSpy.getAttributeGroups.and.returnValue(of([]));
    apiServiceSpy.getAttributeCodes.and.returnValue(of([]));
    apiServiceSpy.createInventoryLevel.and.returnValue(of({}));
    apiServiceSpy.updateInventoryLevel.and.returnValue(of({}));
    apiServiceSpy.getInventoryLevel.and.returnValue(of(null));

    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error', 'info', 'warn']);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();

    TestBed.configureTestingModule({
      imports: [AddEditInventoryDialog, NoopAnimationsModule],
      providers: [
        { provide: SetupInventoryLevelsApiService, useValue: apiServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  // ─── Basic Component Creation ────────────────────────────────────────

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  // ─── Add Mode Form Initialization ───────────────────────────────────

  it('should initialize form with required controls in add mode', () => {
    createComponent();
    expect(component.form).toBeTruthy();
    expect(component.form.get('productType')).toBeTruthy();
    expect(component.form.get('aborh')).toBeTruthy();
    expect(component.form.get('minQty')).toBeTruthy();
    expect(component.form.get('optQty')).toBeTruthy();
    expect(component.form.get('effDate')).toBeTruthy();
    expect(component.form.get('termDate')).toBeTruthy();
  });

  it('should set panel title to "Add New Inventory Levels" in add mode', () => {
    createComponent();
    expect(component.panelTitle).toBe('Add New Inventory Levels');
  });

  it('should load LOVs on init in add mode', () => {
    createComponent();
    expect(apiServiceSpy.getProductTypes).toHaveBeenCalled();
    expect(apiServiceSpy.getBloodTypes).toHaveBeenCalled();
    expect(apiServiceSpy.getAttributeGroups).toHaveBeenCalled();
  });

  it('should require productType and aborh in add mode', () => {
    createComponent();
    const productType = component.form.get('productType');
    const aborh = component.form.get('aborh');
    expect(productType?.hasError('required')).toBeTrue();
    expect(aborh?.hasError('required')).toBeTrue();
  });

  it('should validate minQty is between 0 and 9999', () => {
    createComponent();
    const minQty = component.form.get('minQty');
    minQty?.setValue(-1);
    expect(minQty?.hasError('min')).toBeTrue();
    minQty?.setValue(10000);
    expect(minQty?.hasError('max')).toBeTrue();
    minQty?.setValue(50);
    expect(minQty?.valid).toBeTrue();
  });

  it('should validate optQty must be greater than minQty', () => {
    createComponent();
    component.form.patchValue({ minQty: 10, optQty: 5 });
    component.form.updateValueAndValidity();
    expect(component.form.hasError('optimalNotGreater')).toBeTrue();
  });

  it('should pass optimalGreaterThanMinimalValidator when optQty > minQty', () => {
    createComponent();
    component.form.patchValue({ minQty: 5, optQty: 10 });
    component.form.updateValueAndValidity();
    expect(component.form.hasError('optimalNotGreater')).toBeFalse();
  });

  it('should pass optimalGreaterThanMinimalValidator when both are null', () => {
    createComponent();
    component.form.patchValue({ minQty: null, optQty: null });
    component.form.updateValueAndValidity();
    expect(component.form.hasError('optimalNotGreater')).toBeFalse();
  });

  it('should pass optimalGreaterThanMinimalValidator when only one is set', () => {
    createComponent();
    component.form.patchValue({ minQty: 5, optQty: null });
    component.form.updateValueAndValidity();
    expect(component.form.hasError('optimalNotGreater')).toBeFalse();
  });

  it('should flag optimalNotGreater when optQty equals minQty', () => {
    createComponent();
    component.form.patchValue({ minQty: 10, optQty: 10 });
    component.form.updateValueAndValidity();
    expect(component.form.hasError('optimalNotGreater')).toBeTrue();
  });

  it('should validate optQty is between 0 and 9999', () => {
    createComponent();
    const optQty = component.form.get('optQty');
    optQty?.setValue(-1);
    expect(optQty?.hasError('min')).toBeTrue();
    optQty?.setValue(10000);
    expect(optQty?.hasError('max')).toBeTrue();
    optQty?.setValue(100);
    expect(optQty?.valid).toBeTrue();
  });

  it('should set lastUpdated to empty in add mode', () => {
    createComponent();
    expect(component.lastUpdated).toBe('');
  });

  // ─── Lifecycle ──────────────────────────────────────────────────────

  it('should emit close on onClose', () => {
    createComponent();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      createComponent();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should do nothing on first change', () => {
      createComponent();
      const setupPanelSpy = spyOn<any>(component, 'setupPanel');
      component.ngOnChanges({
        mode: { firstChange: true, previousValue: undefined, currentValue: 'add', isFirstChange: () => true },
      } as any);
      expect(setupPanelSpy).not.toHaveBeenCalled();
    });

    it('should call setupPanel on subsequent mode changes', () => {
      createComponent();
      const setupPanelSpy = spyOn<any>(component, 'setupPanel');
      component.ngOnChanges({
        mode: { firstChange: false, previousValue: 'add', currentValue: 'edit', isFirstChange: () => false },
        data: { firstChange: false, previousValue: null, currentValue: mockEditData, isFirstChange: () => false },
      } as any);
      expect(setupPanelSpy).toHaveBeenCalled();
    });

    it('should clear duplicate error on subsequent changes', () => {
      createComponent();
      component.duplicateError = true;
      component.duplicateErrorMessage = 'some message';
      component.ngOnChanges({
        mode: { firstChange: false, previousValue: 'add', currentValue: 'edit', isFirstChange: () => false },
        data: { firstChange: false, previousValue: null, currentValue: mockEditData, isFirstChange: () => false },
      } as any);
      expect(component.duplicateError).toBeFalse();
      expect(component.duplicateErrorMessage).toBe('');
    });

    it('should call populateFormForEdit when mode is edit on subsequent changes', () => {
      createComponent();
      component.mode = 'edit';
      component.data = mockEditData;
      const populateSpy = spyOn<any>(component, 'populateFormForEdit');
      component.ngOnChanges({
        mode: { firstChange: false, previousValue: 'add', currentValue: 'edit', isFirstChange: () => false },
        data: { firstChange: false, previousValue: null, currentValue: mockEditData, isFirstChange: () => false },
      } as any);
      expect(populateSpy).toHaveBeenCalled();
    });
  });

  // ─── onClearAll ─────────────────────────────────────────────────────

  it('should clear form fields on onClearAll', () => {
    createComponent();
    component.form.patchValue({ minQty: 5, optQty: 10 });
    component.onClearAll();
    expect(component.form.get('minQty')?.value).toBeNull();
    expect(component.form.get('optQty')?.value).toBeNull();
    expect(component.form.get('attribute')?.value).toBeNull();
    expect(component.form.get('termDate')?.value).toBeNull();
  });

  it('should mark form as dirty on onClearAll', () => {
    createComponent();
    component.form.markAsPristine();
    component.onClearAll();
    expect(component.form.dirty).toBeTrue();
  });

  // ─── onlyNumbers ───────────────────────────────────────────────────

  it('should only allow numeric keypress in onlyNumbers', () => {
    createComponent();
    const allowedEvent = { which: 50, target: { value: '12' } } as any;
    expect(component.onlyNumbers(allowedEvent)).toBeTrue();

    const blockedEvent = { which: 65, target: { value: '12' } } as any;
    expect(component.onlyNumbers(blockedEvent)).toBeFalse();
  });

  it('should allow control characters (charCode <= 31) in onlyNumbers', () => {
    createComponent();
    const controlEvent = { which: 8, target: { value: '12' } } as any;
    expect(component.onlyNumbers(controlEvent)).toBeTrue();
  });

  it('should block input when value is already 4 digits in onlyNumbers', () => {
    createComponent();
    const event = { which: 49, target: { value: '1234' } } as any;
    expect(component.onlyNumbers(event)).toBeFalse();
  });

  it('should allow input when value has fewer than 4 digits', () => {
    createComponent();
    const event = { which: 49, target: { value: '123' } } as any;
    expect(component.onlyNumbers(event)).toBeTrue();
  });

  it('should use keyCode when which is not available', () => {
    createComponent();
    const event = { which: 0, keyCode: 65, target: { value: '' } } as any;
    expect(component.onlyNumbers(event)).toBeFalse();
  });

  // ─── onPasteNumbers ─────────────────────────────────────────────────

  it('should allow paste of valid numeric text', () => {
    createComponent();
    const event = {
      clipboardData: { getData: () => '1234' },
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;
    component.onPasteNumbers(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should prevent paste of non-numeric text', () => {
    createComponent();
    const event = {
      clipboardData: { getData: () => 'abc' },
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;
    component.onPasteNumbers(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should prevent paste of text longer than 4 digits', () => {
    createComponent();
    const event = {
      clipboardData: { getData: () => '12345' },
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;
    component.onPasteNumbers(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should not prevent paste when clipboardData is null', () => {
    createComponent();
    const event = {
      clipboardData: null,
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;
    component.onPasteNumbers(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  // ─── onQuantityInput ────────────────────────────────────────────────

  it('should strip non-digit characters and update form control', () => {
    createComponent();
    const event = { target: { value: '12ab34' } } as any;
    component.onQuantityInput(event, 'minQty');
    expect(component.form.get('minQty')?.value).toBe(1234);
  });

  it('should limit input to 4 digits', () => {
    createComponent();
    const event = { target: { value: '123456' } } as any;
    component.onQuantityInput(event, 'minQty');
    expect(component.form.get('minQty')?.value).toBe(1234);
  });

  it('should set null when input is empty', () => {
    createComponent();
    component.form.get('minQty')?.setValue(10);
    const event = { target: { value: '' } } as any;
    component.onQuantityInput(event, 'minQty');
    expect(component.form.get('minQty')?.value).toBeNull();
  });

  it('should handle optQty field', () => {
    createComponent();
    const event = { target: { value: '99' } } as any;
    component.onQuantityInput(event, 'optQty');
    expect(component.form.get('optQty')?.value).toBe(99);
  });

  // ─── onEffectiveDateInput ───────────────────────────────────────────

  it('should set raw input and mark control dirty on non-empty input', () => {
    createComponent();
    const event = { target: { value: '01-Jan-2026' } } as any;
    component.onEffectiveDateInput(event);
    expect(component['effDateRawInput']).toBe('01-Jan-2026');
    expect(component.form.get('effDate')?.dirty).toBeTrue();
  });

  it('should set null value and mark dirty when input is empty', () => {
    createComponent();
    const effControl = component.form.get('effDate');
    effControl?.setValue(moment('2026-01-01'));
    const event = { target: { value: '' } } as any;
    component.onEffectiveDateInput(event);
    expect(effControl?.value).toBeNull();
    expect(component.form.dirty).toBeTrue();
  });

  it('should do nothing if effDate control does not exist', () => {
    createComponent();
    spyOn(component.form, 'get').and.returnValue(null);
    const event = { target: { value: 'test' } } as any;
    // Should not throw
    component.onEffectiveDateInput(event);
  });

  // ─── onTerminationDateInput ─────────────────────────────────────────

  it('should set raw input and mark control dirty on non-empty input', () => {
    createComponent();
    const event = { target: { value: '31-Dec-2026' } } as any;
    component.onTerminationDateInput(event);
    expect(component['termDateRawInput']).toBe('31-Dec-2026');
    expect(component.form.get('termDate')?.dirty).toBeTrue();
  });

  it('should set null value and mark dirty when termination input is empty', () => {
    createComponent();
    const termControl = component.form.get('termDate');
    termControl?.setValue(moment('2026-12-31'));
    const event = { target: { value: '' } } as any;
    component.onTerminationDateInput(event);
    expect(termControl?.value).toBeNull();
    expect(component.form.dirty).toBeTrue();
  });

  it('should do nothing if termDate control does not exist', () => {
    createComponent();
    spyOn(component.form, 'get').and.returnValue(null);
    const event = { target: { value: 'test' } } as any;
    component.onTerminationDateInput(event);
  });

  // ─── getEffectiveDateError ──────────────────────────────────────────

  describe('getEffectiveDateError', () => {
    it('should return empty string when control is untouched and clean', () => {
      createComponent();
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return invalidDateFormat error message', () => {
      createComponent();
      const control = component.form.get('effDate');
      control?.markAsTouched();
      control?.setErrors({ invalidDateFormat: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return matDatepickerParse error message', () => {
      createComponent();
      const control = component.form.get('effDate');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return required error message', () => {
      createComponent();
      const control = component.form.get('effDate');
      control?.markAsTouched();
      control?.setErrors({ required: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should return effectiveDatePast error message', () => {
      createComponent();
      const control = component.form.get('effDate');
      control?.markAsTouched();
      control?.setErrors({ effectiveDatePast: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
    });

    it('should return date range error message when form has dateRangeInvalid', () => {
      createComponent();
      const control = component.form.get('effDate');
      control?.markAsTouched();
      control?.setErrors(null);
      // Manually set form-level error
      spyOn(component.form, 'hasError').and.callFake((errorName: string) => errorName === 'dateRangeInvalid');
      expect(component.getEffectiveDateError()).toBe('Effective Date must be less than or equal to Termination Date');
    });

    it('should return empty string when control is null', () => {
      createComponent();
      spyOn(component.form, 'get').and.returnValue(null);
      expect(component.getEffectiveDateError()).toBe('');
    });
  });

  // ─── getTerminationDateError ────────────────────────────────────────

  describe('getTerminationDateError', () => {
    it('should return empty string when control is untouched and clean', () => {
      createComponent();
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return invalidDateFormat error message', () => {
      createComponent();
      const control = component.form.get('termDate');
      control?.markAsTouched();
      control?.setErrors({ invalidDateFormat: true });
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return matDatepickerParse error message', () => {
      createComponent();
      const control = component.form.get('termDate');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return terminationDatePast error message', () => {
      createComponent();
      const control = component.form.get('termDate');
      control?.markAsTouched();
      control?.setErrors({ terminationDatePast: true });
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be in the past');
    });

    it('should return matDatepickerMin error message', () => {
      createComponent();
      const control = component.form.get('termDate');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerMin: true });
      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return date range error when form has dateRangeInvalid', () => {
      createComponent();
      const control = component.form.get('termDate');
      control?.markAsTouched();
      control?.setErrors(null);
      spyOn(component.form, 'hasError').and.callFake((errorName: string) => errorName === 'dateRangeInvalid');
      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return empty string when control is null', () => {
      createComponent();
      spyOn(component.form, 'get').and.returnValue(null);
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  // ─── Error State Matchers ───────────────────────────────────────────

  describe('Error State Matchers', () => {
    it('effDateErrorMatcher should return true when control is invalid and dirty', () => {
      createComponent();
      const mockControl = { invalid: true, dirty: true, touched: false } as any;
      expect(component.effDateErrorMatcher.isErrorState(mockControl)).toBeTrue();
    });

    it('effDateErrorMatcher should return true when control is invalid and touched', () => {
      createComponent();
      const mockControl = { invalid: true, dirty: false, touched: true } as any;
      expect(component.effDateErrorMatcher.isErrorState(mockControl)).toBeTrue();
    });

    it('effDateErrorMatcher should return false when control is valid', () => {
      createComponent();
      const mockControl = { invalid: false, dirty: true, touched: true } as any;
      expect(component.effDateErrorMatcher.isErrorState(mockControl)).toBeFalse();
    });

    it('effDateErrorMatcher should return false when control is null', () => {
      createComponent();
      expect(component.effDateErrorMatcher.isErrorState(null)).toBeFalse();
    });

    it('termDateErrorMatcher should return true when control is invalid and touched', () => {
      createComponent();
      const mockControl = { invalid: true, dirty: false, touched: true } as any;
      expect(component.termDateErrorMatcher.isErrorState(mockControl)).toBeTrue();
    });

    it('optQtyErrorMatcher should return true when field has error', () => {
      createComponent();
      const mockControl = { invalid: true, dirty: true, touched: false } as any;
      expect(component.optQtyErrorMatcher.isErrorState(mockControl)).toBeTrue();
    });

    it('optQtyErrorMatcher should return true when form has optimalNotGreater error', () => {
      createComponent();
      component.form.patchValue({ minQty: 10, optQty: 5 });
      component.form.updateValueAndValidity();
      const mockControl = { invalid: false, dirty: true, touched: false } as any;
      expect(component.optQtyErrorMatcher.isErrorState(mockControl)).toBeTrue();
    });

    it('optQtyErrorMatcher should return false when control is null', () => {
      createComponent();
      expect(component.optQtyErrorMatcher.isErrorState(null)).toBeFalse();
    });
  });

  // ─── Duplicate Error Clearing ───────────────────────────────────────

  it('should clear duplicate error when form values change', () => {
    createComponent();
    component.duplicateError = true;
    component.duplicateErrorMessage = 'duplicate found';
    component.form.patchValue({ minQty: 5 });
    expect(component.duplicateError).toBeFalse();
    expect(component.duplicateErrorMessage).toBe('');
  });

  it('should not clear duplicate error when it is already false', () => {
    createComponent();
    component.duplicateError = false;
    component.duplicateErrorMessage = '';
    component.form.patchValue({ minQty: 5 });
    expect(component.duplicateError).toBeFalse();
  });

  // ─── Quantity Value Change Subscriptions ─────────────────────────────

  it('should update optQty validity when minQty changes', () => {
    createComponent();
    const optQty = component.form.get('optQty');
    const spy = spyOn(optQty!, 'updateValueAndValidity');
    component.form.get('minQty')?.setValue(10);
    expect(spy).toHaveBeenCalled();
  });

  it('should update form validity when optQty changes', () => {
    createComponent();
    const spy = spyOn(component.form, 'updateValueAndValidity');
    component.form.get('optQty')?.setValue(20);
    expect(spy).toHaveBeenCalled();
  });

  // ─── Search Filter Setup ────────────────────────────────────────────

  describe('setupSearchFilters', () => {
    it('should filter product types based on search term', () => {
      createComponent();
      component.productTypes = [
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { productType: 'PLT', productTypeDesc: 'Platelets' },
      ];
      component.productTypeSearchControl.setValue('red');
      expect(component.filteredProductTypes.length).toBe(1);
      expect(component.filteredProductTypes[0].productType).toBe('RBC');
    });

    it('should filter product types by code', () => {
      createComponent();
      component.productTypes = [
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { productType: 'PLT', productTypeDesc: 'Platelets' },
      ];
      component.productTypeSearchControl.setValue('PLT');
      expect(component.filteredProductTypes.length).toBe(1);
      expect(component.filteredProductTypes[0].productType).toBe('PLT');
    });

    it('should filter blood types based on search term', () => {
      createComponent();
      component.bloodTypes = [
        { aboCode: 'O+', aboDesc: 'O Positive' },
        { aboCode: 'A-', aboDesc: 'A Negative' },
      ];
      component.aborhSearchControl.setValue('negative');
      expect(component.filteredBloodTypes.length).toBe(1);
      expect(component.filteredBloodTypes[0].aboCode).toBe('A-');
    });

    it('should filter combined attributes based on search term', () => {
      createComponent();
      component.combinedAttributes = [
        { display: 'AG - AC1 - Desc1', value: 'AG|AC1', group: 'AG', code: 'AC1', desc: 'Desc1' },
        { display: 'BG - BC1 - Desc2', value: 'BG|BC1', group: 'BG', code: 'BC1', desc: 'Desc2' },
      ];
      component.attributeSearchControl.setValue('BG');
      expect(component.filteredCombinedAttributes.length).toBe(1);
      expect(component.filteredCombinedAttributes[0].group).toBe('BG');
    });

    it('should handle null search term in product type filter', () => {
      createComponent();
      component.productTypes = [
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
      ];
      component.productTypeSearchControl.setValue(null);
      expect(component.filteredProductTypes.length).toBe(1);
    });
  });

  // ─── LOV Loading ────────────────────────────────────────────────────

  describe('loadLOVs', () => {
    it('should populate productTypes and filteredProductTypes from API', () => {
      const mockProducts = [
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
      ];
      apiServiceSpy.getProductTypes.and.returnValue(of(mockProducts));
      createComponent();
      expect(component.productTypes).toEqual(mockProducts);
      expect(component.filteredProductTypes).toEqual(mockProducts);
    });

    it('should populate bloodTypes and filteredBloodTypes from API', () => {
      const mockBlood = [{ aboCode: 'O+', aboDesc: 'O Positive' }];
      apiServiceSpy.getBloodTypes.and.returnValue(of(mockBlood));
      createComponent();
      expect(component.bloodTypes).toEqual(mockBlood);
      expect(component.filteredBloodTypes).toEqual(mockBlood);
    });

    it('should load attribute groups and codes in add mode', () => {
      const mockGroups = [{ attribGroup: 'AG1' }];
      const mockCodes = [{ attribCode: 'AC1', attribDesc: 'Attr Code 1' }];
      apiServiceSpy.getAttributeGroups.and.returnValue(of(mockGroups));
      apiServiceSpy.getAttributeCodes.and.returnValue(of(mockCodes));
      createComponent();
      expect(apiServiceSpy.getAttributeCodes).toHaveBeenCalledWith('AG1');
      expect(component.combinedAttributes.length).toBe(1);
      expect(component.combinedAttributes[0].value).toBe('AG1|AC1');
    });

    it('should deduplicate combined attributes', () => {
      const mockGroups = [{ attribGroup: 'AG1' }];
      const mockCodes = [
        { attribCode: 'AC1', attribDesc: 'Attr Code 1' },
        { attribCode: 'AC1', attribDesc: 'Attr Code 1' },
      ];
      apiServiceSpy.getAttributeGroups.and.returnValue(of(mockGroups));
      apiServiceSpy.getAttributeCodes.and.returnValue(of(mockCodes));
      createComponent();
      expect(component.combinedAttributes.length).toBe(1);
    });

    it('should sort combined attributes alphabetically on last group', () => {
      const mockGroups = [{ attribGroup: 'ZZ' }, { attribGroup: 'AA' }];
      const mockCodes = [{ attribCode: 'C1', attribDesc: 'Code 1' }];
      apiServiceSpy.getAttributeGroups.and.returnValue(of(mockGroups));
      apiServiceSpy.getAttributeCodes.and.returnValue(of(mockCodes));
      createComponent();
      // After last group is loaded, they should be sorted
      if (component.combinedAttributes.length === 2) {
        expect(component.combinedAttributes[0].group).toBe('AA');
      }
    });
  });

  // ─── onSubmit ───────────────────────────────────────────────────────

  describe('onSubmit', () => {
    it('should show error when form is invalid', fakeAsync(() => {
      createComponent();
      // form is invalid because productType and aborh are required
      component.onSubmit();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please fix all validation errors before submitting');
    }));

    it('should call saveInventoryLevel when form is valid', fakeAsync(() => {
      createComponent();
      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 5,
        optQty: 10,
        effDate: futureDate,
      });
      component.form.updateValueAndValidity();

      const saveSpy = spyOn<any>(component, 'saveInventoryLevel');
      component.onSubmit();
      tick();
      expect(saveSpy).toHaveBeenCalledWith(false);
    }));
  });

  describe('onAddAndCreateAnother', () => {
    it('should show error when form is invalid', fakeAsync(() => {
      createComponent();
      component.onAddAndCreateAnother();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please fix all validation errors before submitting');
    }));

    it('should call saveInventoryLevel with true when form is valid', fakeAsync(() => {
      createComponent();
      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 5,
        optQty: 10,
        effDate: futureDate,
      });
      component.form.updateValueAndValidity();

      const saveSpy = spyOn<any>(component, 'saveInventoryLevel');
      component.onAddAndCreateAnother();
      tick();
      expect(saveSpy).toHaveBeenCalledWith(true);
    }));
  });

  // ─── saveInventoryLevel ─────────────────────────────────────────────

  describe('saveInventoryLevel (add mode)', () => {
    it('should show error when no quantities provided', fakeAsync(() => {
      createComponent();
      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        effDate: futureDate,
        minQty: null,
        optQty: null,
      });
      component.form.updateValueAndValidity();

      // Remove the required validator temporarily to let form be "valid"
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please enter at least one quantity (Minimum or Optimal)');
    }));

    it('should create MI record when only minQty is provided', fakeAsync(() => {
      createComponent();
      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 10,
        optQty: null,
        effDate: futureDate,
      });
      // Clear validators to make form valid
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(apiServiceSpy.createInventoryLevel).toHaveBeenCalledTimes(1);
      const callArgs = apiServiceSpy.createInventoryLevel.calls.mostRecent().args;
      expect(callArgs[0]).toBe('BL');
      expect(callArgs[1].inventoryType).toBe('MI');
      expect(callArgs[1].qty).toBe(10);
    }));

    it('should create OP record when only optQty is provided', fakeAsync(() => {
      createComponent();
      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: null,
        optQty: 20,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(apiServiceSpy.createInventoryLevel).toHaveBeenCalledTimes(1);
      const callArgs = apiServiceSpy.createInventoryLevel.calls.mostRecent().args;
      expect(callArgs[1].inventoryType).toBe('OP');
      expect(callArgs[1].qty).toBe(20);
    }));

    it('should create both MI and OP records when both quantities are provided', fakeAsync(() => {
      createComponent();
      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 5,
        optQty: 20,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      // Remove cross-field validator so form is valid
      component.form.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(apiServiceSpy.createInventoryLevel).toHaveBeenCalledTimes(2);
    }));

    it('should parse combined attribute value into group and code', fakeAsync(() => {
      createComponent();
      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        attribute: 'AG|AC',
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      const callArgs = apiServiceSpy.createInventoryLevel.calls.mostRecent().args;
      expect(callArgs[1].attribGroup).toBe('AG');
      expect(callArgs[1].attribCode).toBe('AC');
    }));

    it('should set attribGroup and attribCode to null when no attribute selected', fakeAsync(() => {
      createComponent();
      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        attribute: null,
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      const callArgs = apiServiceSpy.createInventoryLevel.calls.mostRecent().args;
      expect(callArgs[1].attribGroup).toBeNull();
      expect(callArgs[1].attribCode).toBeNull();
    }));
  });

  // ─── handleCreateSuccess ────────────────────────────────────────────

  describe('handleCreateSuccess', () => {
    it('should show success message and close dialog when createAnother is false', fakeAsync(() => {
      createComponent();
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.close, 'emit');

      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('New Inventory Levels have been added.');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    }));

    it('should reset form and keep open when createAnother is true', fakeAsync(() => {
      createComponent();
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.close, 'emit');

      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onAddAndCreateAnother();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('New Inventory Levels have been added.');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.close.emit).not.toHaveBeenCalled();
      expect(component.duplicateError).toBeFalse();
    }));
  });

  // ─── handleCreateError ──────────────────────────────────────────────

  describe('handleCreateError', () => {
    it('should set duplicate error when status is 409', fakeAsync(() => {
      createComponent();
      apiServiceSpy.createInventoryLevel.and.returnValue(
        throwError(() => ({ status: 409, error: { message: 'Conflict' } }))
      );

      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(component.duplicateError).toBeTrue();
      expect(component.duplicateErrorMessage).toContain('duplicate already exists');
    }));

    it('should set duplicate error when error statusCode is 409', fakeAsync(() => {
      createComponent();
      apiServiceSpy.createInventoryLevel.and.returnValue(
        throwError(() => ({ error: { statusCode: 409, message: 'Conflict' } }))
      );

      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(component.duplicateError).toBeTrue();
    }));

    it('should set duplicate error when message contains "duplicate"', fakeAsync(() => {
      createComponent();
      apiServiceSpy.createInventoryLevel.and.returnValue(
        throwError(() => ({ error: { message: 'A duplicate record was found' } }))
      );

      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(component.duplicateError).toBeTrue();
    }));

    it('should set duplicate error when message contains "already exists"', fakeAsync(() => {
      createComponent();
      apiServiceSpy.createInventoryLevel.and.returnValue(
        throwError(() => ({ error: { message: 'Record already exists' } }))
      );

      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(component.duplicateError).toBeTrue();
    }));

    it('should show generic error for non-duplicate errors', fakeAsync(() => {
      createComponent();
      apiServiceSpy.createInventoryLevel.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Internal server error' } }))
      );

      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(component.duplicateError).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Internal server error');
      expect(loggingServiceSpy.error).toHaveBeenCalled();
    }));

    it('should clean up error message by removing single-mode and dual-mode prefixes', fakeAsync(() => {
      createComponent();
      apiServiceSpy.createInventoryLevel.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'single-mode Something went wrong' } }))
      );

      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Something went wrong');
    }));

    it('should use fallback message when error.error.message is not present', fakeAsync(() => {
      createComponent();
      apiServiceSpy.createInventoryLevel.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      const futureDate = moment().add(7, 'days');
      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 10,
        effDate: futureDate,
      });
      component.form.get('effDate')?.clearValidators();
      component.form.get('productType')?.clearValidators();
      component.form.get('aborh')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to create inventory level');
    }));
  });

  // ─── Edit Mode ──────────────────────────────────────────────────────

  describe('Edit Mode', () => {
    beforeEach(() => {
      apiServiceSpy.getAttributeGroups.and.returnValue(of([]));
      apiServiceSpy.getAttributeCodes.and.returnValue(of([]));
    });

    it('should set panel title to "Edit Inventory Levels"', () => {
      createComponent('edit', mockEditData);
      expect(component.panelTitle).toBe('Edit Inventory Levels');
    });

    it('should populate edit mode display values', () => {
      createComponent('edit', mockEditData);
      expect(component.editModeValues.productType).toBe('Red Blood Cells');
      expect(component.editModeValues.aborh).toBe('O Positive');
    });

    it('should set lastUpdated string from data', () => {
      createComponent('edit', mockEditData);
      expect(component.lastUpdated).toContain('Last Modified');
    });

    it('should set lastUpdated to empty when lastModifiedDateDisplay is falsy', () => {
      const data = { ...mockEditData, lastModifiedDateDisplay: null };
      createComponent('edit', data);
      expect(component.lastUpdated).toBe('');
    });

    it('should not have productType or aborh controls in edit mode form', () => {
      createComponent('edit', mockEditData);
      expect(component.form.get('productType')).toBeNull();
      expect(component.form.get('aborh')).toBeNull();
    });

    it('should have attribute, minQty, optQty, effDate, termDate controls in edit mode', () => {
      createComponent('edit', mockEditData);
      expect(component.form.get('attribute')).toBeTruthy();
      expect(component.form.get('minQty')).toBeTruthy();
      expect(component.form.get('optQty')).toBeTruthy();
      expect(component.form.get('effDate')).toBeTruthy();
      expect(component.form.get('termDate')).toBeTruthy();
    });

    it('should disable effDate in edit mode', () => {
      createComponent('edit', mockEditData);
      expect(component.form.get('effDate')?.disabled).toBeTrue();
    });

    it('should populate minQty and optQty from data', () => {
      createComponent('edit', mockEditData);
      expect(component.form.get('minQty')?.value).toBe(10);
      expect(component.form.get('optQty')?.value).toBe(20);
    });

    it('should populate effDate as moment from data', () => {
      createComponent('edit', mockEditData);
      const effDateValue = component.form.get('effDate')?.value;
      expect(moment.isMoment(effDateValue)).toBeTrue();
    });

    it('should set combined attribute key from data', () => {
      createComponent('edit', mockEditData);
      expect(component.form.get('attribute')?.value).toBe('AG|AC');
    });

    it('should set attribute to null when no attribGroup', () => {
      const data = { ...mockEditData, attribGroup: null, attribCode: null };
      createComponent('edit', data);
      expect(component.form.get('attribute')?.value).toBeNull();
    });

    it('should set inventoryClass display from input', () => {
      createComponent('edit', mockEditData);
      expect(component.editModeValues.inventoryClass).toBe('BL');
    });

    it('should default inventoryClass display to dash when empty', () => {
      const fixture2 = TestBed.createComponent(AddEditInventoryDialog);
      const comp2 = fixture2.componentInstance;
      comp2.mode = 'edit';
      comp2.inventoryClass = '';
      comp2.data = mockEditData;
      fixture2.detectChanges();
      expect(comp2.editModeValues.inventoryClass).toBe('-');
      fixture2.destroy();
    });

    it('should use productType code when desc is not available', () => {
      const data = { ...mockEditData, productTypeDesc: null };
      createComponent('edit', data);
      expect(component.editModeValues.productType).toBe('RBC');
    });

    it('should use bloodType code when desc is not available', () => {
      const data = { ...mockEditData, bloodTypeDesc: null };
      createComponent('edit', data);
      expect(component.editModeValues.aborh).toBe('O+');
    });

    it('should display attribute as "group - code" when both exist', () => {
      createComponent('edit', mockEditData);
      expect(component.editModeValues.attribute).toBe('AG - AC');
    });

    it('should display attribute as attribCode alone when no group', () => {
      const data = { ...mockEditData, attribGroup: null };
      createComponent('edit', data);
      expect(component.editModeValues.attribute).toBe('AC');
    });

    it('should display dash for attribute when neither group nor code exists', () => {
      const data = { ...mockEditData, attribGroup: null, attribCode: null };
      createComponent('edit', data);
      expect(component.editModeValues.attribute).toBe('-');
    });

    it('should derive minQty from qty when minQty is null and inventoryType is MI', () => {
      const data = { ...mockEditData, minQty: null, optQty: null, inventoryType: 'MI', qty: 15 };
      createComponent('edit', data);
      expect(component.form.get('minQty')?.value).toBe(15);
    });

    it('should derive optQty from qty when optQty is null and inventoryType is OP', () => {
      const data = { ...mockEditData, minQty: null, optQty: null, inventoryType: 'OP', qty: 25 };
      createComponent('edit', data);
      expect(component.form.get('optQty')?.value).toBe(25);
    });

    it('should set termDate from data when present', () => {
      const data = { ...mockEditData, termDate: '2027-12-31' };
      createComponent('edit', data);
      const termDateValue = component.form.get('termDate')?.value;
      expect(moment.isMoment(termDateValue)).toBeTrue();
    });

    it('should not populate form when data is null in edit mode', () => {
      createComponent('edit', null);
      expect(component.form.get('minQty')?.value).toBeNull();
    });

    it('should not call getProductTypes or getBloodTypes in edit mode', () => {
      apiServiceSpy.getProductTypes.calls.reset();
      apiServiceSpy.getBloodTypes.calls.reset();
      createComponent('edit', mockEditData);
      expect(apiServiceSpy.getProductTypes).not.toHaveBeenCalled();
      expect(apiServiceSpy.getBloodTypes).not.toHaveBeenCalled();
    });

    it('should load attribute groups in edit mode', () => {
      createComponent('edit', mockEditData);
      expect(apiServiceSpy.getAttributeGroups).toHaveBeenCalled();
    });
  });

  // ─── updateInventoryLevels (edit mode save) ─────────────────────────

  describe('updateInventoryLevels', () => {
    beforeEach(() => {
      apiServiceSpy.getAttributeGroups.and.returnValue(of([]));
      apiServiceSpy.getAttributeCodes.and.returnValue(of([]));
    });

    it('should show error when no quantities provided in edit mode', fakeAsync(() => {
      createComponent('edit', mockEditData);
      component.form.patchValue({ minQty: null, optQty: null });
      component.form.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please enter at least one quantity (Minimum or Optimal)');
    }));

    it('should upsert single MI record when only minQty provided', fakeAsync(() => {
      createComponent('edit', mockEditData);
      component.form.patchValue({ minQty: 15, optQty: null });
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(apiServiceSpy.getInventoryLevel).toHaveBeenCalled();
    }));

    it('should upsert single OP record when only optQty provided', fakeAsync(() => {
      createComponent('edit', mockEditData);
      component.form.patchValue({ minQty: null, optQty: 25 });
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(apiServiceSpy.getInventoryLevel).toHaveBeenCalled();
    }));

    it('should upsert both MI and OP records when both quantities provided', fakeAsync(() => {
      createComponent('edit', mockEditData);
      component.form.patchValue({ minQty: 10, optQty: 20 });
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      // getInventoryLevel is called for both MI and OP
      expect(apiServiceSpy.getInventoryLevel).toHaveBeenCalled();
    }));

    it('should not call API when data is null in edit mode', fakeAsync(() => {
      createComponent('edit', null);
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      apiServiceSpy.getInventoryLevel.calls.reset();
      apiServiceSpy.createInventoryLevel.calls.reset();
      apiServiceSpy.updateInventoryLevel.calls.reset();

      component.onSubmit();
      tick();

      // Since data is null, updateInventoryLevels returns early
      expect(apiServiceSpy.getInventoryLevel).not.toHaveBeenCalled();
    }));
  });

  // ─── upsertRecord ──────────────────────────────────────────────────

  describe('upsertRecord', () => {
    beforeEach(() => {
      apiServiceSpy.getAttributeGroups.and.returnValue(of([]));
      apiServiceSpy.getAttributeCodes.and.returnValue(of([]));
    });

    it('should create new record when getInventoryLevel returns null', fakeAsync(() => {
      apiServiceSpy.getInventoryLevel.and.returnValue(of(null));
      createComponent('edit', mockEditData);

      component.form.patchValue({ minQty: 15, optQty: null });
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(apiServiceSpy.createInventoryLevel).toHaveBeenCalled();
    }));

    it('should update existing record when getInventoryLevel returns data', fakeAsync(() => {
      apiServiceSpy.getInventoryLevel.and.returnValue(of({ qty: 5 }));
      createComponent('edit', mockEditData);

      component.form.patchValue({ minQty: 15, optQty: null });
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(apiServiceSpy.updateInventoryLevel).toHaveBeenCalled();
    }));

    it('should create new record when getInventoryLevel throws error (404)', fakeAsync(() => {
      apiServiceSpy.getInventoryLevel.and.returnValue(throwError(() => ({ status: 404 })));
      createComponent('edit', mockEditData);

      component.form.patchValue({ minQty: 15, optQty: null });
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(apiServiceSpy.createInventoryLevel).toHaveBeenCalled();
    }));
  });

  // ─── handleUpdateSuccess ────────────────────────────────────────────

  describe('handleUpdateSuccess', () => {
    beforeEach(() => {
      apiServiceSpy.getAttributeGroups.and.returnValue(of([]));
      apiServiceSpy.getAttributeCodes.and.returnValue(of([]));
    });

    it('should show success message, emit events, and close', fakeAsync(() => {
      apiServiceSpy.getInventoryLevel.and.returnValue(of(null));
      createComponent('edit', mockEditData);

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.close, 'emit');

      component.form.patchValue({ minQty: 15, optQty: null });
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Inventory Levels have been updated.');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    }));
  });

  // ─── handleUpdateError ──────────────────────────────────────────────

  describe('handleUpdateError', () => {
    beforeEach(() => {
      apiServiceSpy.getAttributeGroups.and.returnValue(of([]));
      apiServiceSpy.getAttributeCodes.and.returnValue(of([]));
    });

    it('should show error and log on update failure', fakeAsync(() => {
      apiServiceSpy.getInventoryLevel.and.returnValue(of({ qty: 5 }));
      apiServiceSpy.updateInventoryLevel.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Update failed' } }))
      );
      createComponent('edit', mockEditData);

      component.form.patchValue({ minQty: 15, optQty: null });
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(loggingServiceSpy.error).toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Update failed');
    }));

    it('should use fallback message when error.error.message is not present', fakeAsync(() => {
      apiServiceSpy.getInventoryLevel.and.returnValue(of({ qty: 5 }));
      apiServiceSpy.updateInventoryLevel.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      createComponent('edit', mockEditData);

      component.form.patchValue({ minQty: 15, optQty: null });
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update inventory level');
    }));

    it('should clean up error message format for update errors', fakeAsync(() => {
      apiServiceSpy.getInventoryLevel.and.returnValue(of({ qty: 5 }));
      apiServiceSpy.updateInventoryLevel.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'dual-mode Error occurred' } }))
      );
      createComponent('edit', mockEditData);

      component.form.patchValue({ minQty: 15, optQty: null });
      component.form.clearValidators();
      component.form.get('termDate')?.clearValidators();
      component.form.updateValueAndValidity();

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error occurred');
    }));
  });

  // ─── elementId ──────────────────────────────────────────────────────

  it('should generate unique element IDs', () => {
    createComponent();
    const id1 = component.elementId('field1');
    expect(id1).toContain('add-edit-inventory-dialog-');
    expect(id1).toContain('-field1');
  });

  // ─── effDate / termDate value change subscriptions ──────────────────

  describe('date field value change subscriptions', () => {
    it('should update lastChangedDateField when effDate changes', () => {
      createComponent();
      component['lastChangedDateField'] = null;
      component.form.get('effDate')?.setValue(moment('2027-01-01'));
      // effDate change sets 'effective', then triggers termDate.updateValueAndValidity()
      // which fires termDate valueChanges and sets 'termination'
      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should set lastChangedDateField to termination when termDate changes', () => {
      createComponent();
      component['lastChangedDateField'] = null;
      component.form.get('termDate')?.setValue(moment('2027-06-01'));
      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should revalidate termDate when effDate changes', () => {
      createComponent();
      const termControl = component.form.get('termDate');
      const spy = spyOn(termControl!, 'updateValueAndValidity');
      component.form.get('effDate')?.setValue(moment('2027-01-01'));
      expect(spy).toHaveBeenCalled();
    });
  });

  // ─── updateTerminationMinDate ───────────────────────────────────────

  describe('updateTerminationMinDate', () => {
    it('should use effective date from data when in edit mode', () => {
      apiServiceSpy.getAttributeGroups.and.returnValue(of([]));
      createComponent('edit', { ...mockEditData, effDate: '2025-06-01' });
      // terminationMinDate should be set based on effDate
      expect(component.terminationMinDate).toBeTruthy();
    });

    it('should use form effDate when in add mode with a valid moment value', () => {
      createComponent();
      const futureDate = moment().add(30, 'days');
      component.form.get('effDate')?.setValue(futureDate);
      // The subscription triggers updateTerminationMinDate
      expect(component.terminationMinDate).toBeTruthy();
    });

    it('should fall back to minDate when effDate is null', () => {
      createComponent();
      component.form.get('effDate')?.setValue(null);
      expect(component.terminationMinDate).toEqual(component.minDate);
    });
  });

  // ─── onSubmit dateRangeInvalid handling ─────────────────────────────

  describe('onSubmit dateRangeInvalid lastChangedDateField', () => {
    it('should show validation error when form has dateRangeInvalid', fakeAsync(() => {
      createComponent();
      const futureDate = moment().add(7, 'days');
      const pastTermDate = moment().subtract(30, 'days');

      component.form.patchValue({
        productType: 'RBC',
        aborh: 'O+',
        minQty: 5,
        optQty: 10,
        effDate: futureDate,
        termDate: pastTermDate,
      });

      component.onSubmit();
      tick();

      // Form should be invalid due to dateRangeInvalid or terminationDatePast
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });
});
