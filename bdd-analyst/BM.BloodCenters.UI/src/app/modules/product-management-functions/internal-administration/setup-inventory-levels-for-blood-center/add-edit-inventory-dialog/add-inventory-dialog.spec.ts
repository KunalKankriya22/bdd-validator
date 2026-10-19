import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditInventoryDialog } from './add-edit-inventory-dialog';
import { SetupInventoryLevelsApiService } from '../services/setup-inventory-levels-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { SetInventoryLevelDisplay } from '../models/setup-inventory-levels.model';

describe('AddEditInventoryDialog', () => {
  let component: AddEditInventoryDialog;
  let fixture: ComponentFixture<AddEditInventoryDialog>;
  let apiService: jasmine.SpyObj<SetupInventoryLevelsApiService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  const mockProductTypes = [
    { productType: 'PT01', productTypeDesc: 'Product One' },
    { productType: 'PT02', productTypeDesc: 'Product Two' }
  ];

  const mockBloodTypes = [
    { aboCode: 'A+', aboDesc: 'A Positive' },
    { aboCode: 'B-', aboDesc: 'B Negative' }
  ];

  const mockAttributeGroups = [
    { attribGroup: 'AG1' }
  ];

  const mockAttributeCodes = [
    { attribCode: 'AC1', attribDesc: 'Attribute Code 1' },
    { attribCode: 'AC2', attribDesc: 'Attribute Code 2' }
  ];

  const mockEditData: SetInventoryLevelDisplay = {
    chapterId: 'CH1',
    customerId: 'C1',
    inventoryClass: 'WB',
    inventoryType: 'MI',
    productType: 'PT01',
    productTypeDesc: 'Product One',
    bloodType: 'A+',
    bloodTypeDesc: 'A Positive',
    attribGroup: 'AG1',
    attribCode: 'AC1',
    tier: null,
    qty: 10,
    minQty: 10,
    optQty: 15,
    effDate: '2025-01-15T00:00:00',
    termDate: '2025-12-31T00:00:00',
    lastModifiedDate: '2025-01-10T14:30:00',
    effDateDisplay: '15-JAN-2025',
    termDateDisplay: '31-DEC-2025',
    lastModifiedDateDisplay: '10-JAN-2025, 14:30 PST'
  };

  function createComponent(mode: 'add' | 'edit' = 'add', data: SetInventoryLevelDisplay | null = null) {
    fixture = TestBed.createComponent(AddEditInventoryDialog);
    component = fixture.componentInstance;
    component.inventoryClass = 'WB';
    component.mode = mode;
    component.data = data;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    apiService = jasmine.createSpyObj('SetupInventoryLevelsApiService', [
      'getProductTypes',
      'getBloodTypes',
      'getAttributeGroups',
      'getAttributeCodes',
      'createInventoryLevel',
      'updateInventoryLevel',
      'getInventoryLevel'
    ]);

    snackbarService = jasmine.createSpyObj('SnackbarService', ['showError', 'showSuccess']);
    loggingService = jasmine.createSpyObj('LoggingService', ['error']);
    headerService = jasmine.createSpyObj('HeaderService', ['chapterTimeZone']);

    apiService.getProductTypes.and.returnValue(of(mockProductTypes));
    apiService.getBloodTypes.and.returnValue(of(mockBloodTypes));
    apiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
    apiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
    apiService.createInventoryLevel.and.returnValue(of(null as any));
    apiService.updateInventoryLevel.and.returnValue(of(null as any));
    apiService.getInventoryLevel.and.returnValue(of(null));
    headerService.chapterTimeZone.and.returnValue('America/Los_Angeles');

    await TestBed.configureTestingModule({
      imports: [
        AddEditInventoryDialog,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SetupInventoryLevelsApiService, useValue: apiService },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: LoggingService, useValue: loggingService },
        { provide: HeaderService, useValue: headerService }
      ]
    }).compileComponents();
  });

  describe('Add Mode', () => {
    beforeEach(() => createComponent('add'));

    it('should create in add mode', () => {
      expect(component).toBeTruthy();
      expect(component.mode).toBe('add');
    });

    it('should set panel title for add mode', () => {
      expect(component.panelTitle).toBe('Add New Inventory Levels');
    });

    it('should have empty last updated for add mode', () => {
      expect(component.lastUpdated).toBe('');
    });

    it('should initialize form with required fields', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('productType')).toBeDefined();
      expect(component.form.get('aborh')).toBeDefined();
      expect(component.form.get('attribute')).toBeDefined();
      expect(component.form.get('minQty')).toBeDefined();
      expect(component.form.get('optQty')).toBeDefined();
      expect(component.form.get('effDate')).toBeDefined();
      expect(component.form.get('termDate')).toBeDefined();
    });

    it('should require product type', () => {
      component.form.get('productType')?.setValue(null);
      expect(component.form.get('productType')?.hasError('required')).toBeTrue();
    });

    it('should require aborh', () => {
      component.form.get('aborh')?.setValue(null);
      expect(component.form.get('aborh')?.hasError('required')).toBeTrue();
    });

    it('should require effective date', () => {
      component.form.get('effDate')?.setValue(null);
      component.form.get('effDate')?.markAsTouched();
      expect(component.form.get('effDate')?.hasError('required')).toBeTrue();
    });

    it('should validate min quantity is not negative', () => {
      component.form.get('minQty')?.setValue(-1);
      expect(component.form.get('minQty')?.hasError('min')).toBeTrue();
    });

    it('should validate max quantity is 9999', () => {
      component.form.get('minQty')?.setValue(10000);
      expect(component.form.get('minQty')?.hasError('max')).toBeTrue();
    });

    it('should validate optimal quantity is not negative', () => {
      component.form.get('optQty')?.setValue(-5);
      expect(component.form.get('optQty')?.hasError('min')).toBeTrue();
    });

    it('should validate optimal must be greater than minimal', () => {
      component.form.patchValue({ minQty: 20, optQty: 10 });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('optimalNotGreater')).toBeTrue();
    });

    it('should not error when optimal is greater than minimal', () => {
      component.form.patchValue({ minQty: 10, optQty: 20 });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('optimalNotGreater')).toBeFalse();
    });

    it('should not validate when only one quantity is set', () => {
      component.form.patchValue({ minQty: 10, optQty: null });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('optimalNotGreater')).toBeFalse();
    });

    it('should load product types in add mode', () => {
      expect(apiService.getProductTypes).toHaveBeenCalled();
    });

    it('should load blood types in add mode', () => {
      expect(apiService.getBloodTypes).toHaveBeenCalled();
    });

    it('should load attribute groups in add mode', () => {
      expect(apiService.getAttributeGroups).toHaveBeenCalled();
    });

    it('should load attribute codes for each group', () => {
      expect(apiService.getAttributeCodes).toHaveBeenCalledWith('AG1');
    });

    it('should build combined attributes list', () => {
      expect(component.combinedAttributes.length).toBe(2);
      expect(component.combinedAttributes[0].value).toContain('AG1|');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => createComponent('edit', mockEditData));

    it('should create in edit mode', () => {
      expect(component.mode).toBe('edit');
    });

    it('should set panel title for edit mode', () => {
      expect(component.panelTitle).toBe('Edit Inventory Levels');
    });

    it('should set last updated from data', () => {
      expect(component.lastUpdated).toContain('Last Modified:');
    });

    it('should populate edit mode display values', () => {
      expect(component.editModeValues.productType).toBe('Product One');
      expect(component.editModeValues.aborh).toBe('A Positive');
      expect(component.editModeValues.effectiveDate).toBe('15-JAN-2025');
    });

    it('should populate form with edit data quantities', () => {
      expect(component.form.get('minQty')?.value).toBe(10);
      expect(component.form.get('optQty')?.value).toBe(15);
    });

    it('should populate termination date from edit data', () => {
      expect(component.form.get('termDate')?.value).toBeTruthy();
    });

    it('should populate attribute from edit data', () => {
      expect(component.form.get('attribute')?.value).toBe('AG1|AC1');
    });

    it('should not load product types in edit mode', () => {
      apiService.getProductTypes.calls.reset();
      createComponent('edit', mockEditData);
      expect(apiService.getProductTypes).not.toHaveBeenCalled();
    });

    it('should load attribute groups in edit mode', () => {
      expect(apiService.getAttributeGroups).toHaveBeenCalled();
    });

    it('should handle edit data without attribGroup', () => {
      const dataNoAttrib = { ...mockEditData, attribGroup: null, attribCode: null };
      createComponent('edit', dataNoAttrib);
      expect(component.form.get('attribute')?.value).toBeNull();
    });

    it('should handle edit data with null optQty but MI type', () => {
      const dataMinOnly = { ...mockEditData, minQty: null, optQty: null, inventoryType: 'MI', qty: 5 };
      createComponent('edit', dataMinOnly);
      expect(component.form.get('minQty')?.value).toBe(5);
    });

    it('should handle edit data with null minQty but OP type', () => {
      const dataOptOnly = { ...mockEditData, minQty: null, optQty: null, inventoryType: 'OP', qty: 8 };
      createComponent('edit', dataOptOnly);
      expect(component.form.get('optQty')?.value).toBe(8);
    });

    it('should display attribute as group-code in display values', () => {
      expect(component.editModeValues.attribute).toBe('AG1 - AC1');
    });

    it('should handle edit data with no lastModifiedDateDisplay', () => {
      const noLastModified = { ...mockEditData, lastModifiedDateDisplay: null };
      createComponent('edit', noLastModified);
      expect(component.lastUpdated).toBe('');
    });
  });

  describe('search filters in dialog', () => {
    beforeEach(() => createComponent('add'));

    it('should filter product types by search', () => {
      component.productTypeSearchControl.setValue('One');
      expect(component.filteredProductTypes.length).toBe(1);
    });

    it('should filter blood types by search', () => {
      component.aborhSearchControl.setValue('Negative');
      expect(component.filteredBloodTypes.length).toBe(1);
    });

    it('should filter combined attributes by search', () => {
      component.attributeSearchControl.setValue('AC1');
      expect(component.filteredCombinedAttributes.length).toBe(1);
    });

    it('should handle null search for product types', () => {
      component.productTypeSearchControl.setValue(null as any);
      expect(component.filteredProductTypes.length).toBe(2);
    });

    it('should handle null search for attributes', () => {
      component.attributeSearchControl.setValue(null as any);
      expect(component.filteredCombinedAttributes.length).toBe(2);
    });
  });

  describe('date error methods', () => {
    beforeEach(() => createComponent('add'));

    it('should return empty string for untouched effective date', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return required error when effective date is required', () => {
      const control = component.form.get('effDate');
      control?.setValue(null);
      control?.markAsTouched();
      control?.updateValueAndValidity();
      const error = component.getEffectiveDateError();
      expect(error).toBeTruthy();
    });

    it('should return empty string for untouched termination date', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return error for invalid termination date format', () => {
      const control = component.form.get('termDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return error for matDatepickerParse on effective date', () => {
      const control = component.form.get('effDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return error for matDatepickerParse on termination date', () => {
      const control = component.form.get('termDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return past date error for effective date', () => {
      const control = component.form.get('effDate');
      control?.setErrors({ effectiveDatePast: true });
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
    });

    it('should return past date error for termination date', () => {
      const control = component.form.get('termDate');
      control?.setErrors({ terminationDatePast: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be in the past');
    });

    it('should return min date error for termination date', () => {
      const control = component.form.get('termDate');
      control?.setErrors({ matDatepickerMin: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should show dateRangeInvalid error on effective date', () => {
      component.form.setErrors({ dateRangeInvalid: true });
      const control = component.form.get('effDate');
      control?.setErrors(null);
      control?.markAsTouched();
      control?.markAsDirty();
      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date must be less than or equal to Termination Date');
    });

    it('should show dateRangeInvalid error on termination date', () => {
      component.form.setErrors({ dateRangeInvalid: true });
      const control = component.form.get('termDate');
      control?.markAsTouched();
      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date must be greater than or equal to Effective Date');
    });
  });

  describe('onlyNumbers', () => {
    beforeEach(() => createComponent('add'));

    it('should allow digit keys', () => {
      const event = { which: 48, target: { value: '12' } } as any;
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should reject non-digit keys', () => {
      const event = { which: 65, target: { value: '' } } as any;
      expect(component.onlyNumbers(event)).toBeFalse();
    });

    it('should reject when already 4 digits', () => {
      const event = { which: 49, target: { value: '1234' } } as any;
      expect(component.onlyNumbers(event)).toBeFalse();
    });

    it('should allow control characters (charCode <= 31)', () => {
      const event = { which: 8, target: { value: '123' } } as any;
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should handle empty input value', () => {
      const event = { which: 49, target: { value: '' } } as any;
      expect(component.onlyNumbers(event)).toBeTrue();
    });
  });

  describe('onPasteNumbers', () => {
    beforeEach(() => createComponent('add'));

    it('should allow pasting digits within limit', () => {
      const event = {
        clipboardData: { getData: () => '123' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onPasteNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent pasting non-digits', () => {
      const event = {
        clipboardData: { getData: () => 'abc' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onPasteNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent pasting more than 4 digits', () => {
      const event = {
        clipboardData: { getData: () => '12345' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onPasteNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle null clipboard data', () => {
      const event = {
        clipboardData: null,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      expect(() => component.onPasteNumbers(event)).not.toThrow();
    });
  });

  describe('onQuantityInput', () => {
    beforeEach(() => createComponent('add'));

    it('should set numeric value from input', () => {
      const event = { target: { value: '42' } } as any;
      component.onQuantityInput(event, 'minQty');
      expect(component.form.get('minQty')?.value).toBe(42);
    });

    it('should strip non-digit characters', () => {
      const event = { target: { value: '1a2b' } } as any;
      component.onQuantityInput(event, 'minQty');
      expect(component.form.get('minQty')?.value).toBe(12);
    });

    it('should truncate to 4 digits', () => {
      const event = { target: { value: '12345' } } as any;
      component.onQuantityInput(event, 'optQty');
      expect(component.form.get('optQty')?.value).toBe(1234);
    });

    it('should set null for empty value', () => {
      const event = { target: { value: '' } } as any;
      component.onQuantityInput(event, 'minQty');
      expect(component.form.get('minQty')?.value).toBeNull();
    });
  });

  describe('date input handlers', () => {
    beforeEach(() => createComponent('add'));

    it('should handle effective date input with value', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      component.onEffectiveDateInput(event);
      const control = component.form.get('effDate');
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });

    it('should handle effective date input clearing', () => {
      const event = { target: { value: '' } } as any;
      component.onEffectiveDateInput(event);
      const control = component.form.get('effDate');
      expect(control?.value).toBeNull();
    });

    it('should handle termination date input with value', () => {
      const event = { target: { value: '31-DEC-2025' } } as any;
      component.onTerminationDateInput(event);
      const control = component.form.get('termDate');
      expect(control?.touched).toBeTrue();
    });

    it('should handle termination date input clearing', () => {
      const event = { target: { value: '' } } as any;
      component.onTerminationDateInput(event);
      const control = component.form.get('termDate');
      expect(control?.value).toBeNull();
    });

    it('should mark form as dirty on effective date input', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      component.onEffectiveDateInput(event);
      expect(component.form.dirty).toBeTrue();
    });

    it('should mark form as dirty on termination date input', () => {
      const event = { target: { value: '31-DEC-2025' } } as any;
      component.onTerminationDateInput(event);
      expect(component.form.dirty).toBeTrue();
    });
  });

  describe('onClose', () => {
    beforeEach(() => createComponent('add'));

    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    beforeEach(() => createComponent('edit', mockEditData));

    it('should clear editable fields', () => {
      component.onClearAll();
      expect(component.form.get('attribute')?.value).toBeNull();
      expect(component.form.get('minQty')?.value).toBeNull();
      expect(component.form.get('optQty')?.value).toBeNull();
      expect(component.form.get('termDate')?.value).toBeNull();
    });

    it('should mark form as dirty', () => {
      component.form.markAsPristine();
      component.onClearAll();
      expect(component.form.dirty).toBeTrue();
    });
  });

  describe('form value changes', () => {
    beforeEach(() => createComponent('add'));

    it('should clear duplicate error on form value change', () => {
      component.duplicateError = true;
      component.duplicateErrorMessage = 'duplicate';
      component.form.patchValue({ minQty: 5 });
      expect(component.duplicateError).toBeFalse();
      expect(component.duplicateErrorMessage).toBe('');
    });

    it('should update optQty validation when minQty changes', () => {
      component.form.patchValue({ minQty: 10, optQty: 5 });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('optimalNotGreater')).toBeTrue();

      component.form.patchValue({ minQty: 3 });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('optimalNotGreater')).toBeFalse();
    });
  });

  describe('create inventory levels', () => {
    beforeEach(() => createComponent('add'));

    function setValidAddForm(overrides: any = {}) {
      const futureDate = moment().add(30, 'days');
      const defaults = {
        productType: 'PT01',
        aborh: 'A+',
        minQty: 10,
        optQty: null,
        effDate: futureDate
      };
      component.form.patchValue({ ...defaults, ...overrides });
      component.form.get('effDate')?.setErrors(null);
      component.form.setErrors(null);
      component.form.updateValueAndValidity();
    }

    it('should create with single MI quantity via saveInventoryLevel', () => {
      setValidAddForm({ minQty: 10, optQty: null });
      component['saveInventoryLevel'](false);
      expect(apiService.createInventoryLevel).toHaveBeenCalled();
      const dto = apiService.createInventoryLevel.calls.mostRecent().args[1];
      expect(dto.inventoryType).toBe('MI');
      expect(dto.qty).toBe(10);
    });

    it('should create with single OP quantity via saveInventoryLevel', () => {
      setValidAddForm({ minQty: null, optQty: 20 });
      component['saveInventoryLevel'](false);
      expect(apiService.createInventoryLevel).toHaveBeenCalled();
      const dto = apiService.createInventoryLevel.calls.mostRecent().args[1];
      expect(dto.inventoryType).toBe('OP');
      expect(dto.qty).toBe(20);
    });

    it('should create both MI and OP when both quantities provided', () => {
      setValidAddForm({ minQty: 10, optQty: 20 });
      component['saveInventoryLevel'](false);
      expect(apiService.createInventoryLevel).toHaveBeenCalledTimes(2);
    });

    it('should show error when no quantity provided', () => {
      setValidAddForm({ minQty: null, optQty: null });
      component['saveInventoryLevel'](false);
      expect(snackbarService.showError).toHaveBeenCalledWith('Please enter at least one quantity (Minimum or Optimal)');
    });

    it('should show success message after create', () => {
      setValidAddForm({ minQty: 10 });
      component['saveInventoryLevel'](false);
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('New Inventory Levels have been added.');
    });

    it('should close dialog after successful create', () => {
      spyOn(component.close, 'emit');
      setValidAddForm({ minQty: 10 });
      component['saveInventoryLevel'](false);
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should emit saveSuccess after create', () => {
      spyOn(component.saveSuccess, 'emit');
      setValidAddForm({ minQty: 10 });
      component['saveInventoryLevel'](false);
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });

    it('should handle duplicate error (409)', () => {
      apiService.createInventoryLevel.and.returnValue(throwError(() => ({
        status: 409,
        error: { statusCode: 409, message: 'Duplicate' }
      })));
      setValidAddForm({ minQty: 10 });
      component['saveInventoryLevel'](false);
      expect(component.duplicateError).toBeTrue();
      expect(component.duplicateErrorMessage).toContain('duplicate');
    });

    it('should handle duplicate error by message content', () => {
      apiService.createInventoryLevel.and.returnValue(throwError(() => ({
        status: 400,
        error: { message: 'Record already exists' }
      })));
      setValidAddForm({ minQty: 10 });
      component['saveInventoryLevel'](false);
      expect(component.duplicateError).toBeTrue();
    });

    it('should handle generic create error', () => {
      apiService.createInventoryLevel.and.returnValue(throwError(() => ({
        error: { message: 'Server error' }
      })));
      setValidAddForm({ minQty: 10 });
      component['saveInventoryLevel'](false);
      expect(snackbarService.showError).toHaveBeenCalledWith('Server error');
    });

    it('should clean up error message format', () => {
      apiService.createInventoryLevel.and.returnValue(throwError(() => ({
        error: { message: 'single-mode Failed to create' }
      })));
      setValidAddForm({ minQty: 10 });
      component['saveInventoryLevel'](false);
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to create');
    });

    it('should not submit when form is invalid', fakeAsync(() => {
      component.form.patchValue({ productType: null, aborh: null });
      component.onSubmit();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please fix all validation errors before submitting');
    }));

    it('should parse combined attribute value', () => {
      setValidAddForm({ attribute: 'AG1|AC1', minQty: 10 });
      component['saveInventoryLevel'](false);
      const dto = apiService.createInventoryLevel.calls.mostRecent().args[1];
      expect(dto.attribGroup).toBe('AG1');
      expect(dto.attribCode).toBe('AC1');
    });

    it('should handle null attribute', () => {
      setValidAddForm({ attribute: null, minQty: 10 });
      component['saveInventoryLevel'](false);
      const dto = apiService.createInventoryLevel.calls.mostRecent().args[1];
      expect(dto.attribGroup).toBeNull();
      expect(dto.attribCode).toBeNull();
    });

    it('should include termDate when provided', () => {
      setValidAddForm({ minQty: 10, termDate: moment().add(60, 'days') });
      component['saveInventoryLevel'](false);
      const dto = apiService.createInventoryLevel.calls.mostRecent().args[1];
      expect(dto.termDate).toBeTruthy();
    });

    it('should set isSaving while creating', () => {
      setValidAddForm({ minQty: 10 });
      expect(component.isSaving).toBeFalse();
      component['saveInventoryLevel'](false);
      expect(component.isSaving).toBeFalse(); // Completes synchronously in test
    });
  });

  describe('add and create another', () => {
    beforeEach(() => createComponent('add'));

    it('should reset form after create another', () => {
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'PT01',
        aborh: 'A+',
        minQty: 10,
        effDate: futureDate
      });
      component.form.get('effDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](true);
      expect(component.form.get('productType')?.value).toBeNull();
    });

    it('should not close dialog on create another', () => {
      spyOn(component.close, 'emit');
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'PT01',
        aborh: 'A+',
        minQty: 10,
        effDate: futureDate
      });
      component.form.get('effDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](true);
      expect(component.close.emit).not.toHaveBeenCalled();
    });

    it('should not create another when form is invalid', fakeAsync(() => {
      component.form.patchValue({ productType: null });
      component.onAddAndCreateAnother();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please fix all validation errors before submitting');
    }));

    it('should clear duplicate error on create another', () => {
      component.duplicateError = true;
      component.duplicateErrorMessage = 'duplicate';
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'PT01',
        aborh: 'A+',
        minQty: 10,
        effDate: futureDate
      });
      component.form.get('effDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](true);
      expect(component.duplicateError).toBeFalse();
    });
  });

  describe('update inventory levels', () => {
    beforeEach(() => createComponent('edit', mockEditData));

    function callUpdate(overrides: any = {}) {
      const defaults = { minQty: 15, optQty: null };
      component.form.patchValue({ ...defaults, ...overrides });
      component.form.get('termDate')?.setErrors(null);
      component.form.setErrors(null);
      component.form.updateValueAndValidity();
      component['saveInventoryLevel'](false);
    }

    it('should upsert record on update', () => {
      callUpdate({ minQty: 15 });
      expect(apiService.getInventoryLevel).toHaveBeenCalled();
    });

    it('should show success message after update', () => {
      callUpdate({ minQty: 15 });
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Inventory Levels have been updated.');
    });

    it('should close dialog after update', () => {
      spyOn(component.close, 'emit');
      callUpdate({ minQty: 15 });
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should handle update error', () => {
      apiService.getInventoryLevel.and.returnValue(of({ inventoryType: 'MI' } as any));
      apiService.updateInventoryLevel.and.returnValue(throwError(() => ({
        error: { message: 'Update failed' }
      })));
      callUpdate({ minQty: 15 });
      expect(snackbarService.showError).toHaveBeenCalledWith('Update failed');
    });

    it('should clean up update error message', () => {
      apiService.getInventoryLevel.and.returnValue(of({ inventoryType: 'MI' } as any));
      apiService.updateInventoryLevel.and.returnValue(throwError(() => ({
        error: { message: 'dual-mode Failed to update' }
      })));
      callUpdate({ minQty: 15 });
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to update');
    });

    it('should show error when no quantity in edit mode', () => {
      component.form.patchValue({ minQty: null, optQty: null });
      component.form.get('termDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](false);
      expect(snackbarService.showError).toHaveBeenCalledWith('Please enter at least one quantity (Minimum or Optimal)');
    });

    it('should update both MI and OP when both quantities present', () => {
      callUpdate({ minQty: 15, optQty: 25 });
      expect(apiService.getInventoryLevel).toHaveBeenCalledTimes(2);
    });

    it('should create record when GET returns null (upsert)', () => {
      apiService.getInventoryLevel.and.returnValue(of(null));
      callUpdate({ minQty: 15 });
      expect(apiService.createInventoryLevel).toHaveBeenCalled();
    });

    it('should update record when GET returns existing record (upsert)', () => {
      apiService.getInventoryLevel.and.returnValue(of({ inventoryType: 'MI' } as any));
      callUpdate({ minQty: 15 });
      expect(apiService.updateInventoryLevel).toHaveBeenCalled();
    });

    it('should not call update when data is null', () => {
      component.data = null;
      component.form.patchValue({ minQty: 15 });
      component['saveInventoryLevel'](false);
      expect(apiService.getInventoryLevel).not.toHaveBeenCalled();
    });

    it('should emit saveSuccess after update', () => {
      spyOn(component.saveSuccess, 'emit');
      callUpdate({ minQty: 15 });
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => createComponent('edit', mockEditData));

    it('should update panel on mode/data change (not first)', () => {
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: 'add',
          firstChange: false,
          isFirstChange: () => false
        },
        data: {
          currentValue: mockEditData,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.panelTitle).toBe('Edit Inventory Levels');
    });

    it('should skip update on first change', () => {
      const spy = spyOn<any>(component, 'setupPanel');
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('optQtyErrorMatcher', () => {
    beforeEach(() => createComponent('add'));

    it('should return false when control is null', () => {
      expect(component.optQtyErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('should return true when form has optimalNotGreater error', () => {
      component.form.patchValue({ minQty: 20, optQty: 10 });
      component.form.updateValueAndValidity();
      const control = component.form.get('optQty');
      control?.markAsTouched();
      expect(component.optQtyErrorMatcher.isErrorState(control as any, null as any)).toBeTrue();
    });
  });

  describe('edit mode form initialization', () => {
    it('should create edit form with disabled effDate', () => {
      createComponent('edit', mockEditData);
      const effDateControl = component.form.get('effDate');
      expect(effDateControl?.disabled).toBeTrue();
    });

    it('should not populate form when data is null in edit mode', () => {
      createComponent('edit', null);
      expect(component.editModeValues.productType).toBe('');
    });

    it('should handle edit data with attribCode only (no attribGroup)', () => {
      const dataOnlyCode = { ...mockEditData, attribGroup: null, attribCode: 'AC1' };
      createComponent('edit', dataOnlyCode);
      expect(component.editModeValues.attribute).toBe('AC1');
    });
  });

  describe('updateTerminationMinDate', () => {
    it('should use chapter min date when no effective date in add mode', () => {
      createComponent('add');
      component.form.get('effDate')?.setValue(null);
      component['updateTerminationMinDate']();
      expect(component.terminationMinDate).toBeTruthy();
    });

    it('should use effective date as min when it is after chapter min', () => {
      createComponent('add');
      const futureDate = moment().add(60, 'days');
      component.form.get('effDate')?.setValue(futureDate);
      component['updateTerminationMinDate']();
      expect(component.terminationMinDate.isSameOrAfter(component.minDate)).toBeTrue();
    });

    it('should use chapter min date when effective date is before it', () => {
      createComponent('add');
      const pastDate = moment('2020-01-01');
      component.form.get('effDate')?.setValue(pastDate);
      component['updateTerminationMinDate']();
      expect(component.terminationMinDate.isSameOrAfter(component.minDate)).toBeTrue();
    });

    it('should use data effDate in edit mode', () => {
      createComponent('edit', mockEditData);
      component['updateTerminationMinDate']();
      expect(component.terminationMinDate).toBeTruthy();
    });
  });

  describe('loadAllAttributeCodes deduplication', () => {
    beforeEach(() => {
      apiService.getAttributeCodes.and.returnValue(of([
        { attribCode: 'AC1', attribDesc: 'Code 1' },
        { attribCode: 'AC1', attribDesc: 'Code 1' }
      ]));
    });

    it('should deduplicate attribute codes in add mode', () => {
      createComponent('add');
      expect(component.combinedAttributes.filter(a => a.code === 'AC1').length).toBe(1);
    });
  });

  describe('setupSearchFilters in edit mode', () => {
    it('should filter combined attributes in edit mode', () => {
      createComponent('edit', mockEditData);
      component.attributeSearchControl.setValue('AC1');
      expect(component.filteredCombinedAttributes.length).toBe(1);
    });

    it('should handle null search in edit mode', () => {
      createComponent('edit', mockEditData);
      component.attributeSearchControl.setValue(null as any);
      expect(component.filteredCombinedAttributes.length).toBe(2);
    });
  });

  describe('onlyNumbers with keyCode fallback', () => {
    beforeEach(() => createComponent('add'));

    it('should use keyCode when which is 0', () => {
      const event = { which: 0, keyCode: 48, target: { value: '12' } } as any;
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should handle null input value', () => {
      const event = { which: 49, target: { value: null } } as any;
      expect(component.onlyNumbers(event)).toBeTrue();
    });
  });

  describe('onQuantityInput edge cases', () => {
    beforeEach(() => createComponent('add'));

    it('should handle value with only non-digit characters', () => {
      const event = { target: { value: 'abc' } } as any;
      component.onQuantityInput(event, 'minQty');
      expect(component.form.get('minQty')?.value).toBeNull();
    });

    it('should update optQty', () => {
      const event = { target: { value: '99' } } as any;
      component.onQuantityInput(event, 'optQty');
      expect(component.form.get('optQty')?.value).toBe(99);
    });
  });

  describe('date input edge cases', () => {
    beforeEach(() => createComponent('add'));

    it('should handle whitespace-only effective date input', () => {
      const event = { target: { value: '   ' } } as any;
      component.onEffectiveDateInput(event);
      const control = component.form.get('effDate');
      expect(control?.touched).toBeTrue();
    });

    it('should handle whitespace-only termination date input', () => {
      const event = { target: { value: '   ' } } as any;
      component.onTerminationDateInput(event);
      const control = component.form.get('termDate');
      expect(control?.touched).toBeTrue();
    });
  });

  describe('create with both quantities (dual-mode)', () => {
    beforeEach(() => createComponent('add'));

    it('should create MI first then OP for dual quantities', () => {
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'PT01',
        aborh: 'A+',
        minQty: 5,
        optQty: 15,
        effDate: futureDate
      });
      component.form.get('effDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](false);

      expect(apiService.createInventoryLevel).toHaveBeenCalledTimes(2);
      const firstCall = apiService.createInventoryLevel.calls.first().args[1];
      expect(firstCall.inventoryType).toBe('MI');
      expect(firstCall.qty).toBe(5);
    });

    it('should handle error in dual-mode create', () => {
      apiService.createInventoryLevel.and.returnValue(throwError(() => ({
        error: { message: 'Failed' }
      })));
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'PT01',
        aborh: 'A+',
        minQty: 5,
        optQty: 15,
        effDate: futureDate
      });
      component.form.get('effDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](false);

      expect(component.isSaving).toBeFalse();
    });
  });

  describe('update with single OP quantity', () => {
    beforeEach(() => createComponent('edit', mockEditData));

    it('should upsert single OP record', () => {
      component.form.patchValue({ minQty: null, optQty: 25 });
      component.form.get('termDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](false);
      expect(apiService.getInventoryLevel).toHaveBeenCalled();
    });
  });

  describe('onSubmit with dateRangeInvalid', () => {
    beforeEach(() => createComponent('add'));

    it('should set lastChangedDateField when dateRangeInvalid and not previously set', (done) => {
      component.form.patchValue({ productType: null });
      component.form.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = null;
      component.onSubmit();
      setTimeout(() => {
        done();
      });
    });
  });

  describe('handleCreateError edge cases', () => {
    beforeEach(() => createComponent('add'));

    it('should handle error with statusCode 409 in nested error', () => {
      apiService.createInventoryLevel.and.returnValue(throwError(() => ({
        status: 200,
        error: { statusCode: 409, message: 'Conflict' }
      })));
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'PT01', aborh: 'A+', minQty: 10, effDate: futureDate
      });
      component.form.get('effDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](false);
      expect(component.duplicateError).toBeTrue();
    });

    it('should show generic error when no message available', () => {
      apiService.createInventoryLevel.and.returnValue(throwError(() => ({})));
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'PT01', aborh: 'A+', minQty: 10, effDate: futureDate
      });
      component.form.get('effDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](false);
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to create inventory level');
    });

    it('should clean up dual-mode prefix in error messages', () => {
      apiService.createInventoryLevel.and.returnValue(throwError(() => ({
        error: { message: 'dual-mode Error occurred' }
      })));
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'PT01', aborh: 'A+', minQty: 10, effDate: futureDate
      });
      component.form.get('effDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](false);
      expect(snackbarService.showError).toHaveBeenCalledWith('Error occurred');
    });
  });

  describe('handleUpdateError edge cases', () => {
    beforeEach(() => createComponent('edit', mockEditData));

    it('should handle update error without message', () => {
      apiService.getInventoryLevel.and.returnValue(of({ inventoryType: 'MI' } as any));
      apiService.updateInventoryLevel.and.returnValue(throwError(() => ({})));
      component.form.patchValue({ minQty: 15 });
      component.form.get('termDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](false);
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to update inventory level');
    });
  });

  describe('upsertRecord with error on GET', () => {
    beforeEach(() => createComponent('edit', mockEditData));

    it('should create when GET throws error (404 path)', () => {
      apiService.getInventoryLevel.and.returnValue(throwError(() => new Error('Not found')));
      component.form.patchValue({ minQty: 15 });
      component.form.get('termDate')?.setErrors(null);
      component.form.setErrors(null);
      component['saveInventoryLevel'](false);
      expect(apiService.createInventoryLevel).toHaveBeenCalled();
    });
  });

  describe('effDateErrorMatcher and termDateErrorMatcher', () => {
    beforeEach(() => createComponent('add'));

    it('effDateErrorMatcher should return false for null control', () => {
      expect(component.effDateErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('effDateErrorMatcher should return true for invalid dirty control', () => {
      const control = component.form.get('effDate') as any;
      control.setErrors({ invalidDateFormat: true });
      control.markAsDirty();
      expect(component.effDateErrorMatcher.isErrorState(control, null as any)).toBeTrue();
    });

    it('termDateErrorMatcher should return false for null control', () => {
      expect(component.termDateErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('termDateErrorMatcher should return true for invalid touched control', () => {
      const control = component.form.get('termDate') as any;
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
      expect(component.termDateErrorMatcher.isErrorState(control, null as any)).toBeTrue();
    });
  });

  describe('element ID helpers', () => {
    beforeEach(() => createComponent('add'));

    it('should generate unique element IDs', () => {
      const id = component.elementId('test');
      expect(id).toContain('add-edit-inventory-dialog-');
      expect(id).toContain('-test');
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => createComponent('add'));

    it('should not throw on destroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
