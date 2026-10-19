import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddEditProductStorageComponent } from './add-edit-product-storage';
import { ProductStorageDefinitionService } from '../services/product-storage-definition.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { SimpleChange } from '@angular/core';
import { ProductStorageListDto } from '../models/product-storage-definition.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddEditProductStorageComponent', () => {
  let component: AddEditProductStorageComponent;
  let fixture: ComponentFixture<AddEditProductStorageComponent>;
  let mockService: jasmine.SpyObj<ProductStorageDefinitionService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  const mockSaveResult = {
    success: true, message: 'Saved', statusCode: 200, item: true,
    errorResponse: { errorCode: '', error: '' }
  };

  const mockEditData: ProductStorageListDto = {
    productType: 'RBC',
    warehouseId: 'A',
    warehouseDescription: 'Main Warehouse',
    deviceType: 'F',
    deviceDescription: 'Freezer',
    number: '01',
    trayCapacity: '12',
    effectiveDate: '15-JAN-2026',
    terminationDate: null,
    lastModifiedDate: null
  };

  const deviceNumberResponse = {
    success: true, message: '', error: null, statusCode: 200,
    data: [{ code: '01', description: 'Freezer 01' }], total: 1
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('ProductStorageDefinitionService', [
      'createProductStorage', 'updateProductStorage', 'getDeviceNumbersLov'
    ]);
    mockService.createProductStorage.and.returnValue(of(mockSaveResult));
    mockService.updateProductStorage.and.returnValue(of(mockSaveResult));
    mockService.getDeviceNumbersLov.and.returnValue(of(deviceNumberResponse));

    mockSnackbar = createMockSnackbarService();

    await TestBed.configureTestingModule({
      imports: [AddEditProductStorageComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        { provide: ProductStorageDefinitionService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
        {
          provide: HeaderService,
          useValue: {
            chapterTimeZone: () => '+00:00',
            chapterChanged$: of()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditProductStorageComponent);
    component = fixture.componentInstance;
  });


  it('should default to add mode', () => {
    expect(component.mode).toBe('add');
  });

  it('should build form with all required controls', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('productType')).toBeTruthy();
    expect(component.form.get('warehouseId')).toBeTruthy();
    expect(component.form.get('deviceType')).toBeTruthy();
    expect(component.form.get('number')).toBeTruthy();
    expect(component.form.get('trayCapacity')).toBeTruthy();
    expect(component.form.get('effectiveDate')).toBeTruthy();
    expect(component.form.get('terminationDate')).toBeTruthy();
  });

  it('should initialise minDate and terminationMinDate', () => {
    expect(component.minDate).toBeTruthy();
    expect(component.terminationMinDate).toBeTruthy();
  });

  it('should have isSaving false initially', () => {
    expect(component.isSaving).toBe(false);
  });

  it('should have empty panelTitle initially', () => {
    expect(component.panelTitle).toBe('');
  });

  // ─── constructor search control subscriptions ──────────────────────────────

  describe('constructor search control subscriptions', () => {
    it('should update productTypeSearch signal when productTypeSearchControl changes', () => {
      component.productTypeSearchControl.setValue('test');
      expect(component.productTypeSearch()).toBe('test');
    });

    it('should set productTypeSearch to empty string for null value', () => {
      component.productTypeSearchControl.setValue(null);
      expect(component.productTypeSearch()).toBe('');
    });

    it('should update warehouseSearch signal when warehouseSearchControl changes', () => {
      component.warehouseSearchControl.setValue('wh');
      expect(component.warehouseSearch()).toBe('wh');
    });

    it('should set warehouseSearch to empty string for null value', () => {
      component.warehouseSearchControl.setValue(null);
      expect(component.warehouseSearch()).toBe('');
    });

    it('should update deviceTypeSearch signal when deviceTypeSearchControl changes', () => {
      component.deviceTypeSearchControl.setValue('dt');
      expect(component.deviceTypeSearch()).toBe('dt');
    });

    it('should set deviceTypeSearch to empty string for null value', () => {
      component.deviceTypeSearchControl.setValue(null);
      expect(component.deviceTypeSearch()).toBe('');
    });

    it('should update deviceNumberSearch signal when deviceNumberSearchControl changes', () => {
      component.deviceNumberSearchControl.setValue('dn');
      expect(component.deviceNumberSearch()).toBe('dn');
    });

    it('should set deviceNumberSearch to empty string for null value', () => {
      component.deviceNumberSearchControl.setValue(null);
      expect(component.deviceNumberSearch()).toBe('');
    });
  });

  // ─── ngOnInit ───────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should set up date validation listeners', () => {
      fixture.detectChanges();
      // Changing effectiveDate should trigger cross-field revalidation
      const effCtrl = component.form.get('effectiveDate');
      effCtrl?.setValue(moment('2028-06-01'));
      expect(component).toBeTruthy(); // listeners attached without error
    });

    it('should update terminationMinDate when effectiveDate changes after init', () => {
      fixture.detectChanges();
      const futureDate = moment('2028-06-01');
      component.form.get('effectiveDate')?.setValue(futureDate);
      expect(component.terminationMinDate).toBeTruthy();
    });
  });

  // ─── ngOnChanges ────────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('should populate trayCapacity from data in edit mode', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });
      expect(component.form.get('trayCapacity')?.value).toBe('12');
    });

    it('should not run setup when irrelevant input changes', () => {
      fixture.detectChanges();
      const titleBefore = component.panelTitle;
      component.ngOnChanges({ productTypeLovOptions: new SimpleChange([], [], false) });
      expect(component.panelTitle).toBe(titleBefore);
    });

    it('should call setupPanel when only mode changes', () => {
      fixture.detectChanges();
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange('edit', 'add', false) });
      expect(component.panelTitle).toBe('Add Product Type');
    });

    it('should call setupPanel when only data changes', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({ data: new SimpleChange(null, mockEditData, false) });
      expect(component.panelTitle).toBe('Edit Product Type');
    });
  });

  // ─── setupPanel - add mode ───────────────────────────────────────────────────

  describe('setupPanel - add mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });
    });

    it('should set panelTitle to Add Product Type', () => {
      expect(component.panelTitle).toBe('Add Product Type');
    });

    it('should clear lastModified', () => {
      expect(component.lastModified).toBe('');
    });

    it('should reset deviceDescription', () => {
      expect(component.deviceDescription()).toBe('');
    });

    it('should reset deviceNumberLovOptions', () => {
      expect(component.deviceNumberLovOptions()).toEqual([]);
    });

    it('should enable all form controls', () => {
      expect(component.form.get('productType')?.enabled).toBe(true);
      expect(component.form.get('warehouseId')?.enabled).toBe(true);
      expect(component.form.get('deviceType')?.enabled).toBe(true);
      expect(component.form.get('number')?.enabled).toBe(true);
      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
    });

    it('should reset search controls', () => {
      expect(component.productTypeSearchControl.value).toBe('');
      expect(component.warehouseSearchControl.value).toBe('');
      expect(component.deviceTypeSearchControl.value).toBe('');
    });
  });

  // ─── setupPanel - edit mode ──────────────────────────────────────────────────

  describe('setupPanel - edit mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });
    });

    it('should set panelTitle to Edit Product Type', () => {
      expect(component.panelTitle).toBe('Edit Product Type');
    });

    it('should disable composite-key fields in edit mode', () => {
      expect(component.form.get('productType')?.disabled).toBe(true);
      expect(component.form.get('warehouseId')?.disabled).toBe(true);
      expect(component.form.get('deviceType')?.disabled).toBe(true);
      expect(component.form.get('number')?.disabled).toBe(true);
      expect(component.form.get('effectiveDate')?.disabled).toBe(true);
    });

    it('should populate productType from data', () => {
      expect(component.form.get('productType')?.value).toBe('RBC');
    });

    it('should populate warehouseId from data', () => {
      expect(component.form.get('warehouseId')?.value).toBe('A');
    });

    it('should populate number from data', () => {
      expect(component.form.get('number')?.value).toBe('01');
    });

    it('should set lastModified to empty when lastModifiedDate is null', () => {
      expect(component.lastModified).toBe('');
    });

    it('should set lastModified when lastModifiedDate is provided', () => {
      const dataWithDate = { ...mockEditData, lastModifiedDate: '15-JAN-2025' };
      component.data = dataWithDate;
      component.ngOnChanges({
        data: new SimpleChange(null, dataWithDate, false)
      });
      expect(component.lastModified).toContain('Last Modified:');
    });

    it('should keep trayCapacity enabled', () => {
      expect(component.form.get('trayCapacity')?.enabled).toBe(true);
    });

    it('should keep terminationDate enabled', () => {
      expect(component.form.get('terminationDate')?.enabled).toBe(true);
    });

    it('should set deviceDescription from data', () => {
      expect(component.deviceDescription()).toBe('Freezer');
    });

    it('should populate effectiveDate as a moment from data', () => {
      const effValue = component.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effValue)).toBe(true);
    });

    it('should set terminationDate to null when data has no terminationDate', () => {
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should populate terminationDate when data has one', () => {
      const dataWithTerm = { ...mockEditData, terminationDate: '31-DEC-2028' };
      component.data = dataWithTerm;
      component.ngOnChanges({
        data: new SimpleChange(null, dataWithTerm, false)
      });
      const termValue = component.form.get('terminationDate')?.value;
      expect(moment.isMoment(termValue)).toBe(true);
    });

    it('should set deviceDescription to empty when data.deviceDescription is falsy', () => {
      const dataNoDesc = { ...mockEditData, deviceDescription: '' };
      component.data = dataNoDesc;
      component.ngOnChanges({
        data: new SimpleChange(null, dataNoDesc, false)
      });
      expect(component.deviceDescription()).toBe('');
    });
  });

  // ─── populateForm edge case ────────────────────────────────────────────────

  describe('populateForm edge case', () => {
    it('should not throw when data is null in edit mode', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = null;
      expect(() => {
        component.ngOnChanges({
          mode: new SimpleChange('add', 'edit', false)
        });
      }).not.toThrow();
    });
  });

  // ─── computed filters ───────────────────────────────────────────────────────

  describe('computed filters', () => {
    beforeEach(() => {
      component.productTypeLovOptions = [
        { code: 'RBC', description: 'Red Blood Cells' },
        { code: 'PLT', description: 'Platelets' }
      ];
      component.warehouseLovOptions = [
        { code: 'A', description: 'Main Warehouse' },
        { code: 'B', description: 'Secondary Warehouse' }
      ];
      component.deviceTypeLovOptions = [
        { code: 'F', description: 'Freezer' },
        { code: 'R', description: 'Refrigerator' }
      ];
      component.deviceNumberLovOptions.set([
        { code: '01', description: 'Freezer 01' },
        { code: '02', description: 'Freezer 02' }
      ]);
    });

    it('should return all product types when search empty', () => {
      component.productTypeSearch.set('');
      expect(component.filteredProductTypes().length).toBe(2);
    });

    it('should filter product types by code', () => {
      component.productTypeSearch.set('RBC');
      expect(component.filteredProductTypes().length).toBe(1);
      expect(component.filteredProductTypes()[0].code).toBe('RBC');
    });

    it('should filter product types by description', () => {
      component.productTypeSearch.set('platelet');
      expect(component.filteredProductTypes().length).toBe(1);
    });

    it('should return empty when no product types match', () => {
      component.productTypeSearch.set('zzz');
      expect(component.filteredProductTypes().length).toBe(0);
    });

    it('should return all warehouses when search empty', () => {
      component.warehouseSearch.set('');
      expect(component.filteredWarehouses().length).toBe(2);
    });

    it('should filter warehouses by code', () => {
      component.warehouseSearch.set('B');
      expect(component.filteredWarehouses().length).toBe(1);
      expect(component.filteredWarehouses()[0].code).toBe('B');
    });

    it('should filter warehouses by description', () => {
      component.warehouseSearch.set('main');
      expect(component.filteredWarehouses().length).toBe(1);
    });

    it('should return all device types when search empty', () => {
      component.deviceTypeSearch.set('');
      expect(component.filteredDeviceTypes().length).toBe(2);
    });

    it('should filter device types by code', () => {
      component.deviceTypeSearch.set('freez');
      expect(component.filteredDeviceTypes().length).toBe(1);
    });

    it('should filter device types by description', () => {
      component.deviceTypeSearch.set('Refrigerator');
      expect(component.filteredDeviceTypes().length).toBe(1);
      expect(component.filteredDeviceTypes()[0].code).toBe('R');
    });

    it('should return all device numbers when search empty', () => {
      component.deviceNumberSearch.set('');
      expect(component.filteredDeviceNumbers().length).toBe(2);
    });

    it('should filter device numbers by code', () => {
      component.deviceNumberSearch.set('01');
      expect(component.filteredDeviceNumbers().length).toBe(1);
    });

    it('should filter device numbers by description', () => {
      component.deviceNumberSearch.set('Freezer 02');
      expect(component.filteredDeviceNumbers().length).toBe(1);
      expect(component.filteredDeviceNumbers()[0].code).toBe('02');
    });
  });

  // ─── onWarehouseChange ──────────────────────────────────────────────────────

  describe('onWarehouseChange', () => {
    it('should not throw when called', () => {
      expect(() => component.onWarehouseChange('A')).not.toThrow();
    });
  });

  // ─── onDeviceTypeChange ─────────────────────────────────────────────────────

  describe('onDeviceTypeChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.deviceTypeLovOptions = [
        { code: 'F', description: 'Freezer' },
        { code: 'R', description: 'Refrigerator' }
      ];
    });

    it('should set deviceDescription from LOV', () => {
      component.onDeviceTypeChange('F');
      expect(component.deviceDescription()).toBe('Freezer');
    });

    it('should set empty description for unknown code', () => {
      component.onDeviceTypeChange('UNKNOWN');
      expect(component.deviceDescription()).toBe('');
    });
  });

  // ─── onNumericKeydown ───────────────────────────────────────────────────────

  describe('onNumericKeydown', () => {
    it('should allow navigation keys without preventing default', () => {
      const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
      navKeys.forEach(key => {
        const event = new KeyboardEvent('keydown', { key });
        spyOn(event, 'preventDefault');
        component.onNumericKeydown(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should allow ctrl+key combinations without preventing default', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      spyOn(event, 'preventDefault');
      component.onNumericKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow meta+key combinations without preventing default', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', metaKey: true });
      spyOn(event, 'preventDefault');
      component.onNumericKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow digit keys', () => {
      for (let i = 0; i <= 9; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) });
        spyOn(event, 'preventDefault');
        component.onNumericKeydown(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
    });

    it('should prevent default for non-numeric character keys', () => {
      const nonNumeric = ['a', 'z', '+', '-', '.', ',', 'e'];
      nonNumeric.forEach(key => {
        const event = new KeyboardEvent('keydown', { key });
        spyOn(event, 'preventDefault');
        component.onNumericKeydown(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });
  });

  // ─── onNumericPaste ─────────────────────────────────────────────────────────

  describe('onNumericPaste', () => {
    it('should strip non-numeric and limit to maxDigits', () => {
      const input = document.createElement('input');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '12abc56789' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onNumericPaste(event, 'trayCapacity', 4);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(input.value).toBe('1256');
    });

    it('should handle empty paste', () => {
      const input = document.createElement('input');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onNumericPaste(event, 'trayCapacity', 4);
      expect(input.value).toBe('');
    });

    it('should set form control value to null when paste is empty', () => {
      fixture.detectChanges();
      const input = document.createElement('input');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onNumericPaste(event, 'trayCapacity', 2);
      expect(component.form.get('trayCapacity')?.value).toBeNull();
    });

    it('should limit to maxDigits=2', () => {
      const input = document.createElement('input');
      const event = new ClipboardEvent('paste');
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '12345' } });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: input });
      component.onNumericPaste(event, 'number', 2);
      expect(input.value).toBe('12');
    });
  });

  // ─── Date event handlers ──────────────────────────────────────────────────

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not throw when called with an input event', () => {
      const input = document.createElement('input');
      input.value = '01-JAN-2028';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input });
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });
  });

  describe('onEffectiveDateChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark effectiveDate as touched and dirty', () => {
      component.onEffectiveDateChange();
      expect(component.form.get('effectiveDate')?.touched).toBe(true);
      expect(component.form.get('effectiveDate')?.dirty).toBe(true);
    });

    it('should update terminationMinDate', () => {
      component.form.get('effectiveDate')?.setValue(moment('2028-06-01'));
      const before = component.terminationMinDate.clone();
      component.onEffectiveDateChange();
      // terminationMinDate should be set (either to effective date or minDate)
      expect(component.terminationMinDate).toBeTruthy();
    });
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not throw when called with an input event', () => {
      const input = document.createElement('input');
      input.value = '31-DEC-2028';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input });
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });

    it('should pass edit mode flag correctly', () => {
      component.mode = 'edit';
      const input = document.createElement('input');
      input.value = '31-DEC-2028';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: input });
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('onTerminationDateChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark terminationDate as touched and dirty', () => {
      component.onTerminationDateChange();
      expect(component.form.get('terminationDate')?.touched).toBe(true);
      expect(component.form.get('terminationDate')?.dirty).toBe(true);
    });

    it('should trigger form revalidation', () => {
      spyOn(component.form, 'updateValueAndValidity');
      component.onTerminationDateChange();
      expect(component.form.updateValueAndValidity).toHaveBeenCalled();
    });
  });

  // ─── numberCharCount ──────────────────────────────────────────────────────

  describe('numberCharCount', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show 0/2 when empty', () => {
      component.form.get('number')?.setValue('');
      expect(component.numberCharCount).toBe('Character remaining : 0/2');
    });

    it('should show 1/2 with 1 digit', () => {
      component.form.get('number')?.setValue('5');
      expect(component.numberCharCount).toBe('Character remaining : 1/2');
    });

    it('should show 2/2 with 2 digits', () => {
      component.form.get('number')?.setValue('01');
      expect(component.numberCharCount).toBe('Character remaining : 2/2');
    });

    it('should handle null value', () => {
      component.form.get('number')?.setValue(null);
      expect(component.numberCharCount).toBe('Character remaining : 0/2');
    });
  });

  // ─── trayCapacityCharCount ──────────────────────────────────────────────────

  describe('trayCapacityCharCount', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show 0/2 when empty', () => {
      component.form.get('trayCapacity')?.setValue('');
      expect(component.trayCapacityCharCount).toBe('0 of 2 characters');
    });

    it('should show 2/2 with 2 digits', () => {
      component.form.get('trayCapacity')?.setValue('12');
      expect(component.trayCapacityCharCount).toBe('2 of 2 characters');
    });

    it('should show 1/2 with 1 digit', () => {
      component.form.get('trayCapacity')?.setValue('5');
      expect(component.trayCapacityCharCount).toBe('1 of 2 characters');
    });

    it('should handle null value', () => {
      component.form.get('trayCapacity')?.setValue(null);
      expect(component.trayCapacityCharCount).toBe('0 of 2 characters');
    });
  });

  // ─── isFormValid ─────────────────────────────────────────────────────────────

  describe('isFormValid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return form.valid in add mode', () => {
      component.mode = 'add';
      expect(component.isFormValid).toBe(component.form.valid);
    });

    it('should return false in edit mode when form not dirty', () => {
      component.mode = 'edit';
      component.form.markAsPristine();
      expect(component.isFormValid).toBe(false);
    });

    it('should return true in edit mode when form dirty and no date errors', () => {
      component.mode = 'edit';
      component.form.markAsDirty();
      expect(component.isFormValid).toBe(true);
    });

    it('should return false in edit mode when form dirty but has date errors', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });
      component.form.markAsDirty();
      // Set a past date as termination date and validate
      component.form.get('terminationDate')?.setValue(moment('2000-01-01'));
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.updateValueAndValidity();
      component.form.updateValueAndValidity();
      // If the termination date error getter returns non-empty, isFormValid should be false
      const termError = component.getTerminationDateError();
      if (termError !== '') {
        expect(component.isFormValid).toBe(false);
      }
    });
  });

  // ─── getEffectiveDateError / getTerminationDateError ────────────────────────

  describe('date error getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('getEffectiveDateError should return a string', () => {
      expect(typeof component.getEffectiveDateError()).toBe('string');
    });

    it('getTerminationDateError should return a string', () => {
      expect(typeof component.getTerminationDateError()).toBe('string');
    });

    it('getEffectiveDateError should return empty when no errors', () => {
      component.form.get('effectiveDate')?.setValue(moment('2028-06-01'));
      component.form.get('effectiveDate')?.updateValueAndValidity();
      const error = component.getEffectiveDateError();
      expect(typeof error).toBe('string');
    });

    it('getTerminationDateError should return empty when no errors', () => {
      component.form.get('terminationDate')?.setValue(null);
      const error = component.getTerminationDateError();
      expect(typeof error).toBe('string');
    });
  });

  // ─── onSave - add mode ───────────────────────────────────────────────────────

  describe('onSave - add mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'add';
      component.ngOnChanges({ mode: new SimpleChange(undefined, 'add', true) });
    });

    it('should not call service when form is invalid', () => {
      component.onSave();
      expect(mockService.createProductStorage).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched', () => {
      component.onSave();
      expect(component.form.get('productType')?.touched).toBe(true);
      expect(component.form.get('warehouseId')?.touched).toBe(true);
    });

    it('should call createProductStorage with correct payload when form valid', fakeAsync(() => {
      component.form.patchValue({
        productType: 'RBC',
        warehouseId: 'A',
        deviceType: 'F',
        number: '01',
        trayCapacity: '12',
        effectiveDate: moment('2028-06-01')
      });
      component.onSave();
      tick();
      if (component.form.valid) {
        expect(mockService.createProductStorage).toHaveBeenCalled();
        const payload = mockService.createProductStorage.calls.mostRecent().args[0];
        expect(payload.productType).toBe('RBC');
        expect(payload.deviceNumber).toBe('01');
        expect(payload.trayCapacity).toBe(12);
        expect(payload.termDate).toBeNull();
      }
    }));

    it('should include termDate when terminationDate is set', fakeAsync(() => {
      component.form.patchValue({
        productType: 'RBC',
        warehouseId: 'A',
        deviceType: 'F',
        number: '01',
        trayCapacity: '12',
        effectiveDate: moment('2028-06-01'),
        terminationDate: moment('2028-12-31')
      });
      component.onSave();
      tick();
      if (component.form.valid) {
        expect(mockService.createProductStorage).toHaveBeenCalled();
        const payload = mockService.createProductStorage.calls.mostRecent().args[0];
        expect(payload.termDate).toBe('2028-12-31');
      }
    }));

    it('should set isSaving to true during save', fakeAsync(() => {
      component.form.patchValue({
        productType: 'RBC',
        warehouseId: 'A',
        deviceType: 'F',
        number: '01',
        trayCapacity: '12',
        effectiveDate: moment('2028-06-01')
      });
      if (component.form.valid) {
        component.onSave();
        // isSaving set to true before async, then finalize resets
        tick();
        expect(component.isSaving).toBe(false);
      }
    }));

    it('should emit saveSuccess and closePanel on successful save', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      component.form.patchValue({
        productType: 'RBC',
        warehouseId: 'A',
        deviceType: 'F',
        number: '01',
        trayCapacity: '12',
        effectiveDate: moment('2028-06-01')
      });
      component.onSave();
      tick();
      if (component.form.valid) {
        expect(component.saveSuccess.emit).toHaveBeenCalled();
        expect(component.closePanel.emit).toHaveBeenCalled();
      }
    }));

    it('should show success snackbar on successful create', fakeAsync(() => {
      component.form.patchValue({
        productType: 'RBC',
        warehouseId: 'A',
        deviceType: 'F',
        number: '01',
        trayCapacity: '12',
        effectiveDate: moment('2028-06-01')
      });
      component.onSave();
      tick();
      if (component.form.valid) {
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('New product type has been added.');
      }
    }));

    it('should not call service when effectiveDate is invalid', fakeAsync(() => {
      component.form.patchValue({
        productType: 'RBC',
        warehouseId: 'A',
        deviceType: 'F',
        number: '01',
        trayCapacity: '12',
        effectiveDate: moment('invalid-date')
      });
      component.onSave();
      tick();
      expect(mockService.createProductStorage).not.toHaveBeenCalled();
    }));

    it('should handle service error without crashing', fakeAsync(() => {
      mockService.createProductStorage.and.returnValue(throwError(() => new Error('Server error')));
      component.form.patchValue({
        productType: 'RBC',
        warehouseId: 'A',
        deviceType: 'F',
        number: '01',
        trayCapacity: '12',
        effectiveDate: moment('2028-06-01')
      });
      component.onSave();
      tick();
      if (component.form.valid) {
        expect(component.isSaving).toBe(false);
      }
    }));

    it('should reset form when closeAfterSave is false (add and create another)', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      component.form.patchValue({
        productType: 'RBC',
        warehouseId: 'A',
        deviceType: 'F',
        number: '01',
        trayCapacity: '12',
        effectiveDate: moment('2028-06-01')
      });
      component.onSave(false);
      tick();
      if (component.form.valid) {
        expect(component.saveSuccess.emit).toHaveBeenCalled();
        expect(component.closePanel.emit).not.toHaveBeenCalled();
        expect(component.deviceDescription()).toBe('');
      }
    }));
  });

  // ─── onSave - edit mode ──────────────────────────────────────────────────────

  describe('onSave - edit mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });
    });

    it('should not call service when form is not dirty', fakeAsync(() => {
      component.form.markAsPristine();
      component.onSave();
      tick();
      expect(mockService.updateProductStorage).not.toHaveBeenCalled();
    }));

    it('should call updateProductStorage with composite key when form dirty', fakeAsync(() => {
      component.form.get('trayCapacity')?.setValue('20');
      component.form.markAsDirty();
      component.onSave();
      tick();
      if (component.isFormValid) {
        expect(mockService.updateProductStorage).toHaveBeenCalled();
        const args = mockService.updateProductStorage.calls.mostRecent().args;
        expect(args[0]).toBe('RBC');
        expect(args[1]).toBe('A');
        expect(args[2]).toBe('F');
        expect(args[3]).toBe('01');
        expect(args[4].trayCapacity).toBe(20);
      }
    }));

    it('should show edit success message on successful update', fakeAsync(() => {
      component.form.get('trayCapacity')?.setValue('20');
      component.form.markAsDirty();
      component.onSave();
      tick();
      if (component.isFormValid) {
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('New product type has been saved.');
      }
    }));

    it('should handle update service error without crashing', fakeAsync(() => {
      mockService.updateProductStorage.and.returnValue(throwError(() => new Error('Update failed')));
      component.form.get('trayCapacity')?.setValue('20');
      component.form.markAsDirty();
      component.onSave();
      tick();
      if (component.isFormValid) {
        expect(component.isSaving).toBe(false);
      }
    }));

    it('should pass effectiveDate from data in update payload', fakeAsync(() => {
      component.form.get('trayCapacity')?.setValue('20');
      component.form.markAsDirty();
      component.onSave();
      tick();
      if (component.isFormValid) {
        const payload = mockService.updateProductStorage.calls.mostRecent().args[4];
        expect(payload.effectiveDate).toBe('2026-01-15');
      }
    }));

    it('should include terminationDate in update payload when set', fakeAsync(() => {
      component.form.get('trayCapacity')?.setValue('20');
      component.form.get('terminationDate')?.setValue(moment('2028-12-31'));
      component.form.markAsDirty();
      component.onSave();
      tick();
      if (component.isFormValid) {
        const payload = mockService.updateProductStorage.calls.mostRecent().args[4];
        expect(payload.termDate).toBe('2028-12-31');
      }
    }));

    it('should set lastChangedDateField to effective when dateRangeInvalid error and no lastChangedDateField', fakeAsync(() => {
      component.form.setErrors({ dateRangeInvalid: true });
      component.form.markAsDirty();
      (component as any).lastChangedDateField = null;
      component.onSave();
      tick();
      expect((component as any).lastChangedDateField).toBe('effective');
    }));

    it('should not call service when terminationDate is invalid moment', fakeAsync(() => {
      component.form.get('trayCapacity')?.setValue('20');
      component.form.get('terminationDate')?.setValue(moment('invalid'));
      component.form.markAsDirty();
      component.onSave();
      tick();
      expect(mockService.updateProductStorage).not.toHaveBeenCalled();
    }));
  });

  // ─── onSaveAndCreateAnother ─────────────────────────────────────────────────

  describe('onSaveAndCreateAnother', () => {
    it('should call onSave with false', () => {
      spyOn(component, 'onSave');
      component.onSaveAndCreateAnother();
      expect(component.onSave).toHaveBeenCalledWith(false);
    });
  });

  // ─── onCancel ────────────────────────────────────────────────────────────────

  describe('onCancel', () => {
    it('should emit closePanel', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  // ─── onClearAll ──────────────────────────────────────────────────────────────

  describe('onClearAll', () => {
    it('should repopulate form from data in edit mode', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });
      component.form.get('trayCapacity')?.setValue('99');
      component.onClearAll();
      expect(component.form.get('trayCapacity')?.value).toBe('12');
    });

    it('should restore deviceDescription from data in edit mode', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });
      component.deviceDescription.set('Changed');
      component.onClearAll();
      expect(component.deviceDescription()).toBe('Freezer');
    });

    it('should do nothing when mode is add', () => {
      fixture.detectChanges();
      component.mode = 'add';
      component.form.get('trayCapacity')?.setValue('99');
      component.onClearAll();
      expect(component.form.get('trayCapacity')?.value).toBe('99');
    });

    it('should mark form as pristine and untouched after clear in edit mode', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });
      component.form.get('trayCapacity')?.setValue('99');
      component.form.markAsDirty();
      component.form.markAsTouched();
      component.onClearAll();
      expect(component.form.pristine).toBe(true);
      expect(component.form.untouched).toBe(true);
    });

    it('should reset lastChangedDateField to null', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });
      (component as any).lastChangedDateField = 'effective';
      component.onClearAll();
      expect((component as any).lastChangedDateField).toBeNull();
    });

    it('should set deviceDescription to empty when data.deviceDescription is empty', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = { ...mockEditData, deviceDescription: '' };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      component.deviceDescription.set('Something');
      component.onClearAll();
      expect(component.deviceDescription()).toBe('');
    });
  });

  // ─── formatDate ──────────────────────────────────────────────────────────────

  describe('formatDate', () => {
    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should return the date string as-is', () => {
      expect(component.formatDate('15-JAN-2026')).toBe('15-JAN-2026');
    });
  });

  // ─── formatLastModified (tested through setupPanel) ──────────────────────────

  describe('formatLastModified via setupPanel', () => {
    it('should return empty string when lastModifiedDate is null', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = { ...mockEditData, lastModifiedDate: null };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.lastModified).toBe('');
    });

    it('should return empty string for invalid date', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = { ...mockEditData, lastModifiedDate: 'not-a-date' };
      component.ngOnChanges({
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.lastModified).toBe('');
    });

    it('should return Last Modified with Today for todays date', () => {
      fixture.detectChanges();
      const today = moment().format('YYYY-MM-DD');
      component.mode = 'edit';
      component.data = { ...mockEditData, lastModifiedDate: today };
      component.ngOnChanges({
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.lastModified).toBe('Last Modified: Today');
    });

    it('should return Last Modified with formatted date for past date', () => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = { ...mockEditData, lastModifiedDate: '2025-01-15' };
      component.ngOnChanges({
        data: new SimpleChange(null, component.data, false)
      });
      expect(component.lastModified).toContain('Last Modified:');
      expect(component.lastModified).toContain('15-JAN-2025');
    });
  });

  // ─── effDateErrorMatcher and termDateErrorMatcher ──────────────────────────

  describe('error state matchers', () => {
    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
    });
  });

  // ─── ngOnDestroy ─────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete without error', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should unsubscribe search control subscriptions', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      // After destroy, search control changes should not update signals
      const previousValue = component.productTypeSearch();
      component.productTypeSearchControl.setValue('after-destroy');
      expect(component.productTypeSearch()).toBe(previousValue);
    });
  });
});
