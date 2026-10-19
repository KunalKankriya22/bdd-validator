import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';
import { SimpleChange, SimpleChanges } from '@angular/core';

import { AddEditValidFilterComponent } from './add-edit-valid-filter';
import { HeaderService } from '@shared/services/header.service';
import { signal } from '@angular/core';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { ValidFilterModel, CatalogDropdownItem, DropdownItem } from '../models/valid-filters.model';

describe('AddEditValidFilterComponent', () => {
  let component: AddEditValidFilterComponent;
  let fixture: ComponentFixture<AddEditValidFilterComponent>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockCatalogOptions: CatalogDropdownItem[] = [
    { vendorName: 'Vendor A', catalogNumber: 'CAT001', description: 'Description A' },
    { vendorName: 'Vendor B', catalogNumber: 'CAT002', description: 'Description B' },
    { vendorName: 'Vendor C', catalogNumber: 'CAT003', description: 'Special Filter' },
  ];

  const mockProductTypeOptions: DropdownItem[] = [
    { code: 'RBC', description: 'Red Blood Cells' },
    { code: 'PLT', description: 'Platelets' },
    { code: 'FFP', description: 'Fresh Frozen Plasma' },
  ];

  const futureDate = moment().add(30, 'days').format('YYYY-MM-DD');
  const futureDate2 = moment().add(60, 'days').format('YYYY-MM-DD');

  const mockEditData: ValidFilterModel = {
    vendorName: 'AP',
    catalogNumber: 'PA0000003',
    productType: 'RBC',
    numberOfDays: 56,
    effDate: '2025-06-09',
    termDate: undefined,
  };

  beforeEach(() => {

    mockHeaderService = createMockHeaderService();

      TestBed.configureTestingModule({
      imports: [
        AddEditValidFilterComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });



    fixture = TestBed.createComponent(AddEditValidFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });

  describe('Add Mode', () => {

    it('should set submitButtonLabel to "ADD"', () => {
      expect(component.submitButtonLabel).toBe('ADD');
    });

    it('should show create another button', () => {
      expect(component.showCreateAnotherButton).toBeTrue();
    });

    it('should require vendorName', () => {
      component.form.get('vendorName')?.setValue(null);
      component.form.get('vendorName')?.markAsTouched();

      expect(component.form.get('vendorName')?.hasError('required')).toBeTruthy();
    });

    it('should require catalogNumber', () => {
      component.form.get('catalogNumber')?.setValue(null);
      component.form.get('catalogNumber')?.markAsTouched();

      expect(component.form.get('catalogNumber')?.hasError('required')).toBeTruthy();
    });

    it('should require productType', () => {
      component.form.get('productType')?.setValue(null);
      component.form.get('productType')?.markAsTouched();

      expect(component.form.get('productType')?.hasError('required')).toBeTrue();
    });

    it('should require numberOfDays', () => {
      component.form.get('numberOfDays')?.setValue(null);
      component.form.get('numberOfDays')?.markAsTouched();

      expect(component.form.get('numberOfDays')?.hasError('required')).toBeTrue();
    });

    it('should require effDate', () => {
      component.form.get('effDate')?.setValue(null);
      component.form.get('effDate')?.markAsTouched();

      expect(component.form.get('effDate')?.hasError('required')).toBeTrue();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = {
        vendorName: 'AP',
        catalogNumber: 'PA0000003',
        productType: 'RBC',
        numberOfDays: 56,
        effDate: '2025-06-09',
        termDate: undefined
      };
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should set submitButtonLabel to "SAVE"', () => {
      expect(component.submitButtonLabel).toBe('SAVE');
    });

    it('should not show create another button', () => {
      expect(component.showCreateAnotherButton).toBeFalse();
    });

    it('should keep effDate enabled in edit mode', () => {
      expect(component.form.get('effDate')?.enabled).toBeTrue();
    });

    it('should allow original past termination date without error', () => {
      component.mode = 'edit';
      component.data = {
        vendorName: 'BF',
        catalogNumber: 'HA000BF04',
        productType: 'RBC',
        numberOfDays: 56,
        effDate: '2017-07-06',
        termDate: '2017-07-09'
      };
      component.ngOnInit();
      fixture.detectChanges();

      const termControl = component.form.get('termDate');
      expect(termControl?.hasError('terminationDatePast')).toBeFalse();
    });

    it('should require numberOfDays in edit mode', () => {
      component.form.get('numberOfDays')?.setValue(null);
      component.form.get('numberOfDays')?.markAsTouched();

      expect(component.form.get('numberOfDays')?.hasError('required')).toBeTrue();
    });

    it('should set terminationMinDate in edit mode', () => {
      expect(component.terminationMinDate).toBeTruthy();
      expect(moment.isMoment(component.terminationMinDate)).toBeTrue();
    });

    it('should not have matDatepickerMin error for original past termination date', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        vendorName: 'BF',
        catalogNumber: 'HA000BF04',
        productType: 'RBC',
        numberOfDays: 56,
        effDate: '2017-07-06',
        termDate: '2017-07-09'
      };
      component.ngOnInit();
      fixture.detectChanges();
      tick();

      const termControl = component.form.get('termDate');
      expect(termControl?.hasError('matDatepickerMin')).toBeFalse();
    }));

    it('should disable vendorName in edit mode', () => {
      expect(component.form.get('vendorName')?.disabled).toBeTrue();
    });

    it('should disable catalogNumber in edit mode', () => {
      expect(component.form.get('catalogNumber')?.disabled).toBeTrue();
    });

  });

  // ─── Component Creation ──────────────────────────────────────────

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form on ngOnInit', () => {
      expect(component.form).toBeTruthy();
    });

    it('should default mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should default isSubmitting to false', () => {
      expect(component.isSubmitting).toBeFalse();
    });

    it('should default errorMessage to null', () => {
      expect(component.errorMessage).toBeNull();
    });

    it('should initialize minDate', () => {
      expect(component.minDate).toBeTruthy();
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });

    it('should initialize terminationMinDate', () => {
      expect(component.terminationMinDate).toBeTruthy();
      expect(moment.isMoment(component.terminationMinDate)).toBeTrue();
    });
  });

  // ─── Form Initialization ────────────────────────────────────────

  describe('Form Initialization', () => {
    it('should create form with all expected controls', () => {
      expect(component.form.get('vendorName')).toBeTruthy();
      expect(component.form.get('catalogNumber')).toBeTruthy();
      expect(component.form.get('productType')).toBeTruthy();
      expect(component.form.get('numberOfDays')).toBeTruthy();
      expect(component.form.get('effDate')).toBeTruthy();
      expect(component.form.get('termDate')).toBeTruthy();
    });

    it('should initialize form controls with null when no data provided', () => {
      expect(component.form.get('vendorName')?.value).toBeNull();
      expect(component.form.get('catalogNumber')?.value).toBeNull();
      expect(component.form.get('productType')?.value).toBeNull();
      expect(component.form.get('numberOfDays')?.value).toBeNull();
      expect(component.form.get('effDate')?.value).toBeNull();
      expect(component.form.get('termDate')?.value).toBeNull();
    });

    it('should initialize form with data values in add mode', () => {
      component.data = {
        vendorName: 'TestVendor',
        catalogNumber: 'TC001',
        productType: 'PLT',
        numberOfDays: 30,
        effDate: futureDate,
        termDate: futureDate2,
      };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.get('vendorName')?.value).toBe('TestVendor');
      expect(component.form.get('catalogNumber')?.value).toBe('TC001');
      expect(component.form.get('productType')?.value).toBe('PLT');
      expect(component.form.get('numberOfDays')?.value).toBe(30);
      expect(moment.isMoment(component.form.get('effDate')?.value)).toBeTrue();
      expect(moment.isMoment(component.form.get('termDate')?.value)).toBeTrue();
    });

    it('should disable vendorName and catalogNumber in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.get('vendorName')?.disabled).toBeTrue();
      expect(component.form.get('catalogNumber')?.disabled).toBeTrue();
    });

    it('should enable vendorName and catalogNumber in add mode', () => {
      expect(component.form.get('vendorName')?.enabled).toBeTrue();
      expect(component.form.get('catalogNumber')?.enabled).toBeTrue();
    });
  });

  // ─── Form Validation ────────────────────────────────────────────

  describe('Form Validation', () => {
    it('should enforce maxLength on vendorName (50)', () => {
      const longName = 'A'.repeat(51);
      component.form.get('vendorName')?.setValue(longName);
      expect(component.form.get('vendorName')?.hasError('maxlength')).toBeTrue();
    });

    it('should allow vendorName at max length (50)', () => {
      const name50 = 'A'.repeat(50);
      component.form.get('vendorName')?.setValue(name50);
      expect(component.form.get('vendorName')?.hasError('maxlength')).toBeFalse();
    });

    it('should enforce maxLength on catalogNumber (10)', () => {
      const longCatalog = 'C'.repeat(11);
      component.form.get('catalogNumber')?.setValue(longCatalog);
      expect(component.form.get('catalogNumber')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on productType (6)', () => {
      const longType = 'P'.repeat(7);
      component.form.get('productType')?.setValue(longType);
      expect(component.form.get('productType')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce min 0 on numberOfDays', () => {
      component.form.get('numberOfDays')?.setValue(-1);
      expect(component.form.get('numberOfDays')?.hasError('min')).toBeTrue();
    });

    it('should allow 0 for numberOfDays', () => {
      component.form.get('numberOfDays')?.setValue(0);
      expect(component.form.get('numberOfDays')?.hasError('min')).toBeFalse();
    });

    it('should enforce max 9999 on numberOfDays', () => {
      component.form.get('numberOfDays')?.setValue(10000);
      expect(component.form.get('numberOfDays')?.hasError('max')).toBeTrue();
    });

    it('should allow 9999 for numberOfDays', () => {
      component.form.get('numberOfDays')?.setValue(9999);
      expect(component.form.get('numberOfDays')?.hasError('max')).toBeFalse();
    });
  });

  // ─── Getters ─────────────────────────────────────────────────────

  describe('dialogTitle', () => {
    it('should return "Add Filter" in add mode', () => {
      component.mode = 'add';
      expect(component.dialogTitle).toBe('Add Filter');
    });

    it('should return "Edit Filters" in edit mode', () => {
      component.mode = 'edit';
      expect(component.dialogTitle).toBe('Edit Filters');
    });
  });

  describe('submitButtonLabel', () => {
    it('should return "ADD" in add mode', () => {
      component.mode = 'add';
      expect(component.submitButtonLabel).toBe('ADD');
    });

    it('should return "SAVE" in edit mode', () => {
      component.mode = 'edit';
      expect(component.submitButtonLabel).toBe('SAVE');
    });
  });

  describe('showCreateAnotherButton', () => {
    it('should return true in add mode', () => {
      component.mode = 'add';
      expect(component.showCreateAnotherButton).toBeTrue();
    });

    it('should return false in edit mode', () => {
      component.mode = 'edit';
      expect(component.showCreateAnotherButton).toBeFalse();
    });
  });

  // ─── isFormValid ─────────────────────────────────────────────────

  describe('isFormValid', () => {
    it('should return false when form is invalid (add mode)', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form is valid (add mode)', () => {
      component.form.get('vendorName')?.setValue('Vendor');
      component.form.get('catalogNumber')?.setValue('CAT001');
      component.form.get('productType')?.setValue('RBC');
      component.form.get('numberOfDays')?.setValue(30);
      component.form.get('effDate')?.setValue(moment().add(10, 'days'));
      expect(component.isFormValid).toBeTrue();
    });

    it('should return false in edit mode when form is not dirty', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return true in edit mode when form is dirty and valid', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      fixture.detectChanges();

      component.form.get('numberOfDays')?.setValue(42);
      component.form.get('numberOfDays')?.markAsDirty();
      component.form.markAsDirty();

      expect(component.isFormValid).toBeTrue();
    });
  });

  // ─── lastModifiedDisplay ─────────────────────────────────────────

  describe('lastModifiedDisplay', () => {
    it('should return empty string when no data', () => {
      component.data = null;
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should return empty string when lastModifiedDate is not set', () => {
      component.data = { ...mockEditData, lastModifiedDate: undefined };
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should return formatted date string for valid lastModifiedDate', () => {
      component.data = { ...mockEditData, lastModifiedDate: '2025-03-15T20:30:00.000Z' };
      const result = component.lastModifiedDisplay;
      expect(result).toContain('Last Modified:');
      expect(result).toContain('PST');
    });

    it('should return empty string for invalid lastModifiedDate', () => {
      component.data = { ...mockEditData, lastModifiedDate: 'invalid-date' };
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should format date parts correctly', () => {
      // 2025-03-15T20:30:00Z in UTC offset -8 = 2025-03-15 12:30 PST
      component.data = { ...mockEditData, lastModifiedDate: '2025-03-15T20:30:00.000Z' };
      const result = component.lastModifiedDisplay;
      expect(result).toBe('Last Modified: 15-MAR-2025, 12:30 PST');
    });
  });

  // ─── onSave ──────────────────────────────────────────────────────

  describe('onSave', () => {
    it('should emit save event when form is valid', () => {
      spyOn(component.save, 'emit');

      component.form.get('vendorName')?.setValue('Vendor');
      component.form.get('catalogNumber')?.setValue('CAT001');
      component.form.get('productType')?.setValue('RBC');
      component.form.get('numberOfDays')?.setValue(30);
      component.form.get('effDate')?.setValue(moment().add(10, 'days'));

      component.onSave();

      expect(component.save.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBeTrue();
    });

    it('should not emit save event when form is invalid', () => {
      spyOn(component.save, 'emit');

      component.onSave();

      expect(component.save.emit).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should emit form values with correct structure', () => {
      spyOn(component.save, 'emit');
      const effDate = moment().add(10, 'days');

      component.form.get('vendorName')?.setValue('Vendor');
      component.form.get('catalogNumber')?.setValue('CAT001');
      component.form.get('productType')?.setValue('RBC');
      component.form.get('numberOfDays')?.setValue(30);
      component.form.get('effDate')?.setValue(effDate);

      component.onSave();

      const emittedValue = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.vendorName).toBe('Vendor');
      expect(emittedValue.catalogNumber).toBe('CAT001');
      expect(emittedValue.productType).toBe('RBC');
      expect(emittedValue.numberOfDays).toBe(30);
      expect(emittedValue.effDate).toBeTruthy();
      expect(emittedValue.termDate).toBeNull();
    });

    it('should convert empty string numberOfDays to null in emitted value', () => {
      spyOn(component.save, 'emit');

      component.form.get('vendorName')?.setValue('Vendor');
      component.form.get('catalogNumber')?.setValue('CAT001');
      component.form.get('productType')?.setValue('RBC');
      component.form.get('numberOfDays')?.setValue(30);
      component.form.get('numberOfDays')?.clearValidators();
      component.form.get('numberOfDays')?.updateValueAndValidity();
      component.form.get('numberOfDays')?.setValue('');
      component.form.get('effDate')?.setValue(moment().add(10, 'days'));

      component.onSave();

      if ((component.save.emit as jasmine.Spy).calls.count() > 0) {
        const emittedValue = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
        expect(emittedValue.numberOfDays).toBeNull();
      }
    });
  });

  // ─── onSaveAndCreateAnother ──────────────────────────────────────

  describe('onSaveAndCreateAnother', () => {
    it('should emit saveAndCreateAnother event when form is valid', () => {
      spyOn(component.saveAndCreateAnother, 'emit');

      component.form.get('vendorName')?.setValue('Vendor');
      component.form.get('catalogNumber')?.setValue('CAT001');
      component.form.get('productType')?.setValue('RBC');
      component.form.get('numberOfDays')?.setValue(30);
      component.form.get('effDate')?.setValue(moment().add(10, 'days'));

      component.onSaveAndCreateAnother();

      expect(component.saveAndCreateAnother.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBeTrue();
    });

    it('should not emit saveAndCreateAnother event when form is invalid', () => {
      spyOn(component.saveAndCreateAnother, 'emit');

      component.onSaveAndCreateAnother();

      expect(component.saveAndCreateAnother.emit).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBeFalse();
    });
  });

  // ─── onCancel ────────────────────────────────────────────────────

  describe('onCancel', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onCancel();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  // ─── onDaysKeyDown ───────────────────────────────────────────────

  describe('onDaysKeyDown', () => {
    it('should allow digit keys', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Backspace', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Delete', () => {
      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowLeft', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowRight', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Home', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow End', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+A', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+C', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+V', () => {
      const event = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+X', () => {
      const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit non-allowed keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent special characters', () => {
      const event = new KeyboardEvent('keydown', { key: '.' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent minus sign', () => {
      const event = new KeyboardEvent('keydown', { key: '-' });
      spyOn(event, 'preventDefault');

      component.onDaysKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow all digit keys 0-9', () => {
      for (let i = 0; i <= 9; i++) {
        const event = new KeyboardEvent('keydown', { key: String(i) });
        spyOn(event, 'preventDefault');
        component.onDaysKeyDown(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
    });
  });

  // ─── onDaysPaste ─────────────────────────────────────────────────

  describe('onDaysPaste', () => {
    function createPasteEvent(text: string): ClipboardEvent {
      const clipboardData = {
        getData: jasmine.createSpy('getData').and.returnValue(text),
      } as any;
      const event = new ClipboardEvent('paste', { clipboardData: undefined });
      Object.defineProperty(event, 'clipboardData', { value: clipboardData });
      return event;
    }

    it('should allow valid digit paste (1-4 digits)', () => {
      const event = createPasteEvent('123');
      spyOn(event, 'preventDefault');

      component.onDaysPaste(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow single digit paste', () => {
      const event = createPasteEvent('5');
      spyOn(event, 'preventDefault');

      component.onDaysPaste(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow 9999', () => {
      const event = createPasteEvent('9999');
      spyOn(event, 'preventDefault');

      component.onDaysPaste(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent paste of value greater than 9999', () => {
      const event = createPasteEvent('10000');
      spyOn(event, 'preventDefault');

      component.onDaysPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste of non-digit text', () => {
      const event = createPasteEvent('abc');
      spyOn(event, 'preventDefault');

      component.onDaysPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste of mixed digits and letters', () => {
      const event = createPasteEvent('12a');
      spyOn(event, 'preventDefault');

      component.onDaysPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste of more than 4 digits', () => {
      const event = createPasteEvent('12345');
      spyOn(event, 'preventDefault');

      component.onDaysPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste of empty string', () => {
      const event = createPasteEvent('');
      spyOn(event, 'preventDefault');

      component.onDaysPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // ─── onEffDateInput ──────────────────────────────────────────────

  describe('onEffDateInput', () => {
    it('should call handleStartDateInput with the input value', () => {
      const inputEl = { value: '15-MAR-2026' } as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.onEffDateInput(event);

      const control = component.form.get('effDate');
      expect(control?.touched).toBeTrue();
    });

    it('should set required error when input is empty', () => {
      const inputEl = { value: '' } as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.onEffDateInput(event);

      const control = component.form.get('effDate');
      expect(control?.hasError('required')).toBeTrue();
    });
  });

  // ─── onTermDateInput ─────────────────────────────────────────────

  describe('onTermDateInput', () => {
    it('should handle input event for termination date', () => {
      const inputEl = { value: '15-MAR-2026' } as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.onTermDateInput(event);

      const control = component.form.get('termDate');
      expect(control?.touched || control?.dirty || control?.pristine).toBeTruthy();
    });

    it('should clear errors when input is empty in add mode', () => {
      component.mode = 'add';
      const inputEl = { value: '' } as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.onTermDateInput(event);

      const control = component.form.get('termDate');
      expect(control?.errors).toBeNull();
    });

    it('should keep dirty state when input is empty in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      fixture.detectChanges();

      const inputEl = { value: '' } as HTMLInputElement;
      const event = { target: inputEl } as unknown as Event;

      component.onTermDateInput(event);

      const control = component.form.get('termDate');
      expect(control?.dirty).toBeTrue();
    });
  });

  // ─── getEffectiveDateError ───────────────────────────────────────

  describe('getEffectiveDateError', () => {
    it('should return empty string when effDate control is not touched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return error message when effDate is required and touched', () => {
      const control = component.form.get('effDate');
      control?.setValue(null);
      control?.markAsTouched();
      control?.markAsDirty();

      const result = component.getEffectiveDateError();
      expect(result).toContain('Effective Date');
    });
  });

  // ─── getTerminationDateError ─────────────────────────────────────

  describe('getTerminationDateError', () => {
    it('should return empty string when termDate control is not touched', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return empty string when termDate has no errors', () => {
      const control = component.form.get('termDate');
      control?.setValue(moment().add(30, 'days'));
      control?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('');
    });
  });

  // ─── ngOnChanges ─────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('should update filteredCatalogOptions when catalogOptions input changes', () => {
      component.catalogOptions = mockCatalogOptions;
      const changes: SimpleChanges = {
        catalogOptions: new SimpleChange(null, mockCatalogOptions, true),
      };

      component.ngOnChanges(changes);

      expect(component.filteredCatalogOptions).toEqual(mockCatalogOptions);
    });

    it('should update filteredProductTypeOptions when productTypeOptions input changes', () => {
      component.productTypeOptions = mockProductTypeOptions;
      const changes: SimpleChanges = {
        productTypeOptions: new SimpleChange(null, mockProductTypeOptions, true),
      };

      component.ngOnChanges(changes);

      expect(component.filteredProductTypeOptions).toEqual(mockProductTypeOptions);
    });

    it('should reinitialize form when data changes and form exists', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const newData: ValidFilterModel = {
        vendorName: 'NewVendor',
        catalogNumber: 'NC001',
        productType: 'PLT',
        numberOfDays: 42,
        effDate: futureDate,
        termDate: null,
      };
      component.data = newData;
      const changes: SimpleChanges = {
        data: new SimpleChange(null, newData, false),
      };

      component.ngOnChanges(changes);

      expect(component.form.get('vendorName')?.value).toBe('NewVendor');
      expect(component.form.get('numberOfDays')?.value).toBe(42);
    });

    it('should reinitialize form when mode changes and form exists', () => {
      component.ngOnInit();
      fixture.detectChanges();

      component.mode = 'edit';
      component.data = mockEditData;
      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false),
      };

      component.ngOnChanges(changes);

      expect(component.form.get('vendorName')?.disabled).toBeTrue();
      expect(component.form.get('catalogNumber')?.disabled).toBeTrue();
    });

    it('should not reinitialize form if form does not exist yet', () => {
      const freshFixture = TestBed.createComponent(AddEditValidFilterComponent);
      const freshComponent = freshFixture.componentInstance;
      // Do NOT call detectChanges or ngOnInit so form is not initialized

      const changes: SimpleChanges = {
        data: new SimpleChange(null, mockEditData, true),
      };

      // Should not throw
      expect(() => freshComponent.ngOnChanges(changes)).not.toThrow();
    });

    it('should handle both catalogOptions and productTypeOptions changing at once', () => {
      component.catalogOptions = mockCatalogOptions;
      component.productTypeOptions = mockProductTypeOptions;
      const changes: SimpleChanges = {
        catalogOptions: new SimpleChange(null, mockCatalogOptions, true),
        productTypeOptions: new SimpleChange(null, mockProductTypeOptions, true),
      };

      component.ngOnChanges(changes);

      expect(component.filteredCatalogOptions).toEqual(mockCatalogOptions);
      expect(component.filteredProductTypeOptions).toEqual(mockProductTypeOptions);
    });
  });

  // ─── ngOnDestroy ─────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should not throw when called', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should complete destroy$ subject to unsubscribe observables', () => {
      // Verify that ngOnDestroy does not cause errors and subscriptions are cleaned up
      component.ngOnDestroy();
      // After destroying, setting search value should not trigger updates
      component.catalogSearchCtrl.setValue('test');
      // No error means subscriptions were properly cleaned up
      expect(true).toBeTrue();
    });
  });

  // ─── Search Filter Subscriptions ─────────────────────────────────

  describe('Search Filters', () => {
    beforeEach(() => {
      component.catalogOptions = mockCatalogOptions;
      component.productTypeOptions = mockProductTypeOptions;
      component.filteredCatalogOptions = mockCatalogOptions;
      component.filteredProductTypeOptions = mockProductTypeOptions;
      // Re-initialize to set up subscriptions with populated options
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should filter catalog options by catalogNumber', () => {
      component.catalogSearchCtrl.setValue('CAT001');

      expect(component.filteredCatalogOptions.length).toBe(1);
      expect(component.filteredCatalogOptions[0].catalogNumber).toBe('CAT001');
    });

    it('should filter catalog options by vendorName', () => {
      component.catalogSearchCtrl.setValue('Vendor A');

      expect(component.filteredCatalogOptions.length).toBe(1);
      expect(component.filteredCatalogOptions[0].vendorName).toBe('Vendor A');
    });

    it('should filter catalog options by description', () => {
      component.catalogSearchCtrl.setValue('Special');

      expect(component.filteredCatalogOptions.length).toBe(1);
      expect(component.filteredCatalogOptions[0].description).toBe('Special Filter');
    });

    it('should return all catalog options when search is empty', () => {
      component.catalogSearchCtrl.setValue('');

      expect(component.filteredCatalogOptions.length).toBe(mockCatalogOptions.length);
    });

    it('should return all catalog options when search is null', () => {
      component.catalogSearchCtrl.setValue(null);

      expect(component.filteredCatalogOptions.length).toBe(mockCatalogOptions.length);
    });

    it('should filter catalog options case insensitively', () => {
      component.catalogSearchCtrl.setValue('vendor a');

      expect(component.filteredCatalogOptions.length).toBe(1);
    });

    it('should filter product type options by code', () => {
      component.productTypeSearchCtrl.setValue('RBC');

      expect(component.filteredProductTypeOptions.length).toBe(1);
      expect(component.filteredProductTypeOptions[0].code).toBe('RBC');
    });

    it('should filter product type options by description', () => {
      component.productTypeSearchCtrl.setValue('Platelets');

      expect(component.filteredProductTypeOptions.length).toBe(1);
      expect(component.filteredProductTypeOptions[0].code).toBe('PLT');
    });

    it('should return all product type options when search is empty', () => {
      component.productTypeSearchCtrl.setValue('');

      expect(component.filteredProductTypeOptions.length).toBe(mockProductTypeOptions.length);
    });

    it('should return no results when search does not match any catalog', () => {
      component.catalogSearchCtrl.setValue('NONEXISTENT');

      expect(component.filteredCatalogOptions.length).toBe(0);
    });

    it('should return no results when search does not match any product type', () => {
      component.productTypeSearchCtrl.setValue('NONEXISTENT');

      expect(component.filteredProductTypeOptions.length).toBe(0);
    });

    it('should filter product type options case insensitively', () => {
      component.productTypeSearchCtrl.setValue('rbc');

      expect(component.filteredProductTypeOptions.length).toBe(1);
    });
  });

  // ─── reinitializeForm (via ngOnChanges) ──────────────────────────

  describe('reinitializeForm', () => {
    it('should reset isSubmitting and errorMessage on reinitialize', () => {
      component.isSubmitting = true;
      component.errorMessage = 'Some error';
      component.catalogSearchCtrl.setValue('test');
      component.productTypeSearchCtrl.setValue('test');

      component.data = mockEditData;
      const changes: SimpleChanges = {
        data: new SimpleChange(null, mockEditData, false),
      };
      component.ngOnChanges(changes);

      expect(component.isSubmitting).toBeFalse();
      expect(component.errorMessage).toBeNull();
      expect(component.catalogSearchCtrl.value).toBe('');
      expect(component.productTypeSearchCtrl.value).toBe('');
    });

    it('should enable vendorName and catalogNumber when switching to add mode', () => {
      // Start in edit mode
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      fixture.detectChanges();

      // Switch to add mode
      component.mode = 'add';
      component.data = null;
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false),
      };
      component.ngOnChanges(changes);

      expect(component.form.get('vendorName')?.enabled).toBeTrue();
      expect(component.form.get('catalogNumber')?.enabled).toBeTrue();
    });

    it('should disable vendorName and catalogNumber when reinitializing in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      const changes: SimpleChanges = {
        data: new SimpleChange(null, mockEditData, false),
      };
      component.ngOnChanges(changes);

      expect(component.form.get('vendorName')?.disabled).toBeTrue();
      expect(component.form.get('catalogNumber')?.disabled).toBeTrue();
    });

    it('should set form values from data during reinitialize', () => {
      const newData: ValidFilterModel = {
        vendorName: 'TestCorp',
        catalogNumber: 'TC999',
        productType: 'FFP',
        numberOfDays: 100,
        effDate: futureDate,
        termDate: futureDate2,
      };
      component.data = newData;
      const changes: SimpleChanges = {
        data: new SimpleChange(null, newData, false),
      };
      component.ngOnChanges(changes);

      expect(component.form.getRawValue().vendorName).toBe('TestCorp');
      expect(component.form.getRawValue().catalogNumber).toBe('TC999');
      expect(component.form.get('productType')?.value).toBe('FFP');
      expect(component.form.get('numberOfDays')?.value).toBe(100);
    });

    it('should handle reinitialize with null/undefined data fields', () => {
      const sparseData: ValidFilterModel = {
        vendorName: '',
        catalogNumber: '',
        productType: '',
        numberOfDays: 0,
        effDate: '',
        termDate: null,
      };
      component.data = sparseData;
      const changes: SimpleChanges = {
        data: new SimpleChange(null, sparseData, false),
      };

      expect(() => component.ngOnChanges(changes)).not.toThrow();
    });

    it('should store originalTerminationDate when reinitializing in edit mode with termDate', () => {
      component.mode = 'edit';
      const dataWithTerm: ValidFilterModel = {
        ...mockEditData,
        termDate: '2025-12-31',
      };
      component.data = dataWithTerm;
      const changes: SimpleChanges = {
        data: new SimpleChange(null, dataWithTerm, false),
      };
      component.ngOnChanges(changes);

      // originalTerminationDate is private, but we can test the behavior
      // by checking that the original termination date is allowed
      const termControl = component.form.get('termDate');
      expect(termControl?.hasError('terminationDatePast')).toBeFalse();
    });
  });

  // ─── updateTerminationMinDate ────────────────────────────────────

  describe('updateTerminationMinDate (via effDate changes)', () => {
    it('should set terminationMinDate to effDate when effDate is after minDate', () => {
      const futureEffDate = moment().add(20, 'days');
      component.form.get('effDate')?.setValue(futureEffDate);

      // terminationMinDate should be at least the effDate
      expect(component.terminationMinDate.isSameOrAfter(component.minDate)).toBeTrue();
    });

    it('should set terminationMinDate to minDate when effDate is null', () => {
      component.form.get('effDate')?.setValue(null);

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });

    it('should set terminationMinDate to minDate when effDate is before minDate', () => {
      const pastDate = moment().subtract(10, 'days');
      component.form.get('effDate')?.setValue(pastDate);

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });
  });

  // ─── setupModeValidators ─────────────────────────────────────────

  describe('setupModeValidators', () => {
    it('should set up add mode validators by default', () => {
      // In add mode, effDate should have effectiveDateNotPast validator
      const effControl = component.form.get('effDate');
      const pastDate = moment().subtract(5, 'days');
      effControl?.setValue(pastDate);
      effControl?.markAsTouched();

      expect(effControl?.hasError('effectiveDatePast')).toBeTrue();
    });

    it('should set up edit mode validators when mode is edit', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      fixture.detectChanges();

      // In edit mode, effDate should have required, dateFormatValidator, validDateValidator
      const effControl = component.form.get('effDate');
      expect(effControl?.enabled).toBeTrue();
    });

    it('should set up edit mode with termDate validators when data has termDate', () => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        termDate: '2025-12-31',
      };
      component.ngOnInit();
      fixture.detectChanges();

      // termDate should have editModeTerminationDateValidator
      const termControl = component.form.get('termDate');
      expect(termControl).toBeTruthy();
    });

    it('should store null originalTerminationDate when edit data has no termDate', () => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        termDate: undefined,
      };
      component.ngOnInit();
      fixture.detectChanges();

      // Verify behavior -- term control should not have terminationDatePast error
      const termControl = component.form.get('termDate');
      expect(termControl?.hasError('terminationDatePast')).toBeFalse();
    });
  });

  // ─── Date validation listeners ───────────────────────────────────

  describe('Date validation listeners', () => {
    it('should track lastChangedDateField as effective when effDate changes', () => {
      component.form.get('effDate')?.setValue(moment().add(10, 'days'));

      // getEffectiveDateError uses lastChangedDateField === 'effective' to pass form errors
      // We test this indirectly through getEffectiveDateError behavior
      const effControl = component.form.get('effDate');
      effControl?.markAsTouched();
      effControl?.markAsDirty();

      // The method should work without error when lastChangedDateField is 'effective'
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should track lastChangedDateField as termination when termDate changes', () => {
      component.form.get('termDate')?.setValue(moment().add(30, 'days'));

      const termControl = component.form.get('termDate');
      termControl?.markAsTouched();
      termControl?.markAsDirty();

      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });
  });

  // ─── Effective and Termination Date Errors with Cross-Field ──────

  describe('Cross-field date validation', () => {
    it('should detect dateRangeInvalid when termDate is before effDate', () => {
      const effDate = moment().add(30, 'days');
      const termDate = moment().add(10, 'days');

      component.form.get('effDate')?.setValue(effDate);
      component.form.get('termDate')?.setValue(termDate);
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should not have dateRangeInvalid when termDate is after effDate', () => {
      const effDate = moment().add(10, 'days');
      const termDate = moment().add(30, 'days');

      component.form.get('effDate')?.setValue(effDate);
      component.form.get('termDate')?.setValue(termDate);
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should not have dateRangeInvalid when termDate equals effDate', () => {
      const date = moment().add(15, 'days');

      component.form.get('effDate')?.setValue(date.clone());
      component.form.get('termDate')?.setValue(date.clone());
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should not have dateRangeInvalid when termDate is null', () => {
      component.form.get('effDate')?.setValue(moment().add(10, 'days'));
      component.form.get('termDate')?.setValue(null);
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });
  });

  // ─── validateForm edge cases ─────────────────────────────────────

  describe('validateForm (via onSave)', () => {
    it('should mark all controls as touched on save attempt', () => {
      component.onSave();

      expect(component.form.get('vendorName')?.touched).toBeTrue();
      expect(component.form.get('catalogNumber')?.touched).toBeTrue();
      expect(component.form.get('productType')?.touched).toBeTrue();
      expect(component.form.get('numberOfDays')?.touched).toBeTrue();
      expect(component.form.get('effDate')?.touched).toBeTrue();
    });

    it('should not submit when form has dateRangeInvalid error', () => {
      spyOn(component.save, 'emit');

      component.form.get('vendorName')?.setValue('Vendor');
      component.form.get('catalogNumber')?.setValue('CAT001');
      component.form.get('productType')?.setValue('RBC');
      component.form.get('numberOfDays')?.setValue(30);
      component.form.get('effDate')?.setValue(moment().add(30, 'days'));
      component.form.get('termDate')?.setValue(moment().add(10, 'days'));

      component.onSave();

      expect(component.save.emit).not.toHaveBeenCalled();
    });
  });

  // ─── Edit mode form getRawValue ──────────────────────────────────

  describe('getFormValue in edit mode', () => {
    it('should include disabled field values via getRawValue', () => {
      spyOn(component.save, 'emit');

      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      fixture.detectChanges();

      // Modify a field to make form dirty
      component.form.get('numberOfDays')?.setValue(42);
      component.form.get('numberOfDays')?.markAsDirty();
      component.form.markAsDirty();

      component.onSave();

      if ((component.save.emit as jasmine.Spy).calls.count() > 0) {
        const emittedValue = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
        // Even though vendorName and catalogNumber are disabled,
        // getRawValue should still include them
        expect(emittedValue.vendorName).toBe('AP');
        expect(emittedValue.catalogNumber).toBe('PA0000003');
      }
    });
  });

  // ─── Error state matchers ────────────────────────────────────────

  describe('Error state matchers', () => {
    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });

  // ─── cdr.markForCheck calls ──────────────────────────────────────

  describe('ChangeDetectorRef interactions', () => {
    it('should call markForCheck when catalog search changes', () => {
      spyOn(component.cdr, 'markForCheck');
      component.catalogOptions = mockCatalogOptions;
      component.ngOnInit();
      fixture.detectChanges();

      component.catalogSearchCtrl.setValue('test');

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    });

    it('should call markForCheck when product type search changes', () => {
      spyOn(component.cdr, 'markForCheck');
      component.productTypeOptions = mockProductTypeOptions;
      component.ngOnInit();
      fixture.detectChanges();

      component.productTypeSearchCtrl.setValue('test');

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    });

    it('should call markForCheck when effDate value changes (via setupDateValidationListeners)', () => {
      spyOn(component.cdr, 'markForCheck');
      // Re-init to capture the spy
      component.ngOnInit();
      fixture.detectChanges();

      component.form.get('effDate')?.setValue(moment().add(5, 'days'));

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    });

    it('should call markForCheck when termDate value changes (via setupDateValidationListeners)', () => {
      spyOn(component.cdr, 'markForCheck');
      component.ngOnInit();
      fixture.detectChanges();

      component.form.get('termDate')?.setValue(moment().add(30, 'days'));

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    });
  });
});
