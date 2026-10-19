import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { AddEditAntigenPricingMatrixComponent } from './add-edit-antigen-pricing-matrix';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { of } from 'rxjs';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { AntigenPricingMatrixModel } from '../models/antigen-pricing-matrix.model';
import moment from 'moment';

describe('AddEditAntigenPricingMatrixComponent', () => {
  let component: AddEditAntigenPricingMatrixComponent;
  let fixture: ComponentFixture<AddEditAntigenPricingMatrixComponent>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(async () => {
    mockHeaderService = createMockHeaderService();
    await TestBed.configureTestingModule({
      imports: [AddEditAntigenPricingMatrixComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], { pageHeaderData: signal(undefined) }) },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditAntigenPricingMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to add mode', () => {
    // Arrange - component created with defaults in beforeEach

    // Act - no action needed, checking defaults

    // Assert
    expect(component.mode).toBe('add');
    expect(component.data).toBeNull();
  });

  it('should initialize the form with required controls', () => {
    // Arrange - form initialized in ngOnInit via beforeEach

    // Act
    const form = component.form;

    // Assert
    expect(form).toBeTruthy();
    expect(form.get('code')).toBeTruthy();
    expect(form.get('quantity')).toBeTruthy();
    expect(form.get('price')).toBeTruthy();
    expect(form.get('description')).toBeTruthy();
    expect(form.get('effDate')).toBeTruthy();
    expect(form.get('termDate')).toBeTruthy();
  });

  it('should return dialogTitle as "Add New Price" in add mode', () => {
    // Arrange
    component.mode = 'add';

    // Act
    const title = component.dialogTitle;

    // Assert
    expect(title).toBe('Add New Price');
  });

  it('should return dialogTitle as "Edit Price" in edit mode', () => {
    // Arrange
    component.mode = 'edit';

    // Act
    const title = component.dialogTitle;

    // Assert
    expect(title).toBe('Edit Price');
  });

  it('should return submitButtonLabel as "ADD" in add mode', () => {
    // Arrange
    component.mode = 'add';

    // Act & Assert
    expect(component.submitButtonLabel).toBe('ADD');
  });

  it('should return submitButtonLabel as "SAVE" in edit mode', () => {
    // Arrange
    component.mode = 'edit';

    // Act & Assert
    expect(component.submitButtonLabel).toBe('SAVE');
  });

  it('should calculate code characters remaining correctly', () => {
    // Arrange
    component.form.get('code')?.setValue('ABC');

    // Act
    const remaining = component.getCodeCharactersRemaining();

    // Assert
    expect(remaining).toBe(5);
  });

  it('should return 8 for code characters remaining when code is empty', () => {
    // Arrange
    component.form.get('code')?.setValue('');

    // Act & Assert
    expect(component.getCodeCharactersRemaining()).toBe(8);
  });

  it('should calculate quantity characters remaining correctly', () => {
    // Arrange
    component.form.get('quantity')?.setValue(999);

    // Act
    const remaining = component.getQuantityCharactersRemaining();

    // Assert
    expect(remaining).toBe(1);
  });

  it('should calculate description characters remaining correctly', () => {
    // Arrange
    component.form.get('description')?.setValue('Test description');

    // Act
    const remaining = component.getDescriptionCharactersRemaining();

    // Assert
    expect(remaining).toBe(34);
  });

  it('should emit save event with form value when form is valid and onSave is called', () => {
    // Arrange
    spyOn(component.save, 'emit');
    component.form.patchValue({
      code: 'TESTCODE',
      quantity: 5,
      price: 10.50,
      description: 'Test description',
      effDate: moment().add(1, 'year')
    });
    component.form.updateValueAndValidity();

    // Act
    component.onSave();

    // Assert
    expect(component.isSubmitting).toBeTrue();
    expect(component.save.emit).toHaveBeenCalled();
    const emittedValue = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.code).toBe('TESTCODE');
    expect(emittedValue.quantity).toBe(5);
  });

  it('should not emit save event when form is invalid', () => {
    // Arrange
    spyOn(component.save, 'emit');
    // Leave form invalid (required fields empty)

    // Act
    component.onSave();

    // Assert
    expect(component.isSubmitting).toBeFalse();
    expect(component.save.emit).not.toHaveBeenCalled();
  });

  it('should emit saveAndCreateAnother event with form value when form is valid', () => {
    // Arrange
    spyOn(component.saveAndCreateAnother, 'emit');
    component.form.patchValue({
      code: 'CODE01',
      quantity: 10,
      price: 25.00,
      description: 'Another test',
      effDate: moment().add(1, 'year')
    });
    component.form.updateValueAndValidity();

    // Act
    component.onSaveAndCreateAnother();

    // Assert
    expect(component.isSubmitting).toBeTrue();
    expect(component.saveAndCreateAnother.emit).toHaveBeenCalled();
  });

  it('should emit close event when onCancel is called', () => {
    // Arrange
    spyOn(component.close, 'emit');

    // Act
    component.onCancel();

    // Assert
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should reset all fields in add mode when onClearAll is called', () => {
    // Arrange
    component.mode = 'add';
    component.form.patchValue({
      code: 'TESTCODE',
      quantity: 5,
      price: 10.50,
      description: 'Test',
      effDate: moment('2025-01-15')
    });

    // Act
    component.onClearAll();

    // Assert
    expect(component.form.get('code')?.value).toBeFalsy();
    expect(component.form.get('quantity')?.value).toBeFalsy();
    expect(component.form.get('price')?.value).toBeFalsy();
    expect(component.form.get('description')?.value).toBeFalsy();
    expect(component.form.get('effDate')?.value).toBeFalsy();
    expect(component.errorMessage).toBeNull();
  });

  it('should clear only editable fields in edit mode when onClearAll is called', () => {
    // Arrange
    component.mode = 'edit';
    component.form.patchValue({
      code: 'TESTCODE',
      quantity: 5,
      price: 10.50,
      description: 'Test description',
      effDate: moment('2025-01-15'),
      termDate: moment('2025-12-31')
    });

    // Act
    component.onClearAll();

    // Assert - editable fields cleared
    expect(component.form.get('code')?.value).toBe('');
    expect(component.form.get('price')?.value).toBeNull();
    expect(component.form.get('description')?.value).toBe('');
    expect(component.form.get('termDate')?.value).toBeNull();
    // readonly fields preserved
    expect(component.form.get('quantity')?.value).toBe(5);
    expect(component.form.get('effDate')?.value).toBeTruthy();
  });

  it('should reset isSubmitting and trigger change detection when resetSubmitting is called', () => {
    // Arrange
    component.isSubmitting = true;
    spyOn(component.cdr, 'markForCheck');

    // Act
    component.resetSubmitting();

    // Assert
    expect(component.isSubmitting).toBeFalse();
    expect(component.cdr.markForCheck).toHaveBeenCalled();
  });

  it('should report isFormValid as false in edit mode when form is valid but not dirty', () => {
    // Arrange
    component.mode = 'edit';
    component.form.patchValue({
      code: 'TESTCODE',
      quantity: 5,
      price: 10.50,
      description: 'Test',
      effDate: moment('2025-01-15')
    });
    component.form.markAsPristine();

    // Act & Assert
    expect(component.isFormValid).toBeFalse();
  });

  it('should report isFormValid as true in edit mode when form is valid and dirty', () => {
    // Arrange
    component.mode = 'edit';
    component.form.patchValue({
      code: 'TESTCODE',
      quantity: 5,
      price: 10.50,
      description: 'Test description',
      effDate: moment().add(1, 'year')
    });
    component.form.markAsDirty();

    // Act & Assert
    expect(component.isFormValid).toBeTrue();
  });

  it('should format price to two decimal places in getPriceDisplayValue', () => {
    // Arrange
    component.form.get('price')?.setValue(10.5);

    // Act
    const displayValue = component.getPriceDisplayValue();

    // Assert
    expect(displayValue).toBe('10.50');
  });

  it('should return empty string from getPriceDisplayValue when price is null', () => {
    // Arrange
    component.form.get('price')?.setValue(null);

    // Act & Assert
    expect(component.getPriceDisplayValue()).toBe('');
  });

  it('should format effective date as DD-MMM-YYYY in getFormattedEffectiveDate', () => {
    // Arrange
    component.form.get('effDate')?.setValue(moment('2025-03-15'));

    // Act
    const formatted = component.getFormattedEffectiveDate();

    // Assert
    expect(formatted).toBe('15-Mar-2025');
  });

  it('should return empty string from getFormattedEffectiveDate when no date set', () => {
    // Arrange
    component.form.get('effDate')?.setValue(null);

    // Act & Assert
    expect(component.getFormattedEffectiveDate()).toBe('');
  });

  it('should prevent quantity overflow for keypress that would exceed 4 digits', () => {
    // Arrange
    const event = {
      key: '5',
      target: { value: '9999', selectionStart: 4, selectionEnd: 4 } as HTMLInputElement,
      ctrlKey: false,
      metaKey: false,
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    // Act
    component.preventQuantityOverflow(event);

    // Assert
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should allow control keys in preventQuantityOverflow', () => {
    // Arrange
    const event = {
      key: 'Backspace',
      target: { value: '999', selectionStart: 3, selectionEnd: 3 } as HTMLInputElement,
      ctrlKey: false,
      metaKey: false,
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    // Act
    component.preventQuantityOverflow(event);

    // Assert
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should prevent price input that would exceed 5 integer digits', () => {
    // Arrange
    const event = {
      key: '6',
      target: { value: '99999', selectionStart: 5, selectionEnd: 5 } as HTMLInputElement,
      ctrlKey: false,
      metaKey: false,
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    // Act
    component.preventPriceOverflow(event);

    // Assert
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should format modification date with chapter timezone', () => {
    // Arrange
    const mockData: AntigenPricingMatrixModel = {
      code: 'TEST',
      quantity: 1,
      price: 10.00,
      description: 'Test',
      effDate: '2025-01-01',
      modificationDate: '2025-06-15T14:30:00Z'
    };
    component.data = mockData;

    // Act
    const result = component.getFormattedModificationDate();

    // Assert — format is DD-MMM-YYYY, HH:mm (TZ)
    expect(result).toMatch(/\d{2}-\w{3}-\d{4}, \d{2}:\d{2} \(.+\)/);
  });

  it('should return empty string from getFormattedModificationDate when data has no modification date', () => {
    // Arrange
    component.data = null;

    // Act & Assert
    expect(component.getFormattedModificationDate()).toBe('');
  });

  it('should re-initialize form when data input changes via ngOnChanges', () => {
    // Arrange
    const newData: AntigenPricingMatrixModel = {
      code: 'UPD',
      quantity: 5,
      price: 25.00,
      description: 'Updated desc',
      effDate: '2025-03-01'
    };
    component.data = newData;

    // Act
    component.ngOnChanges({ data: { currentValue: newData, previousValue: null, firstChange: false, isFirstChange: () => false } } as any);

    // Assert
    expect(component.form.get('code')?.value).toBe('UPD');
    expect(component.form.get('quantity')?.value).toBe(5);
  });

  it('should re-initialize form when mode input changes via ngOnChanges', () => {
    // Arrange
    component.mode = 'edit';

    // Act
    component.ngOnChanges({ mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false } } as any);

    // Assert - form should still exist after re-init
    expect(component.form).toBeTruthy();
  });

  it('should return true from terminationDateFilter for null date', () => {
    // Act
    const result = component.terminationDateFilter(null);

    // Assert
    expect(result).toBeTrue();
  });

  it('should return false from terminationDateFilter for a past date', () => {
    const pastDate = moment('2020-01-01');

    const result = component.terminationDateFilter(pastDate);

    expect(result).toBeFalse();
  });

  it('should handle onEffDateInput with a date string', () => {
    const event = { target: { value: '01-Jan-2025' } } as any;

    expect(() => component.onEffDateInput(event)).not.toThrow();
  });

  it('should handle onTermDateInput with a date string in add mode', () => {
    component.mode = 'add';
    const event = { target: { value: '01-Dec-2025' } } as any;

    expect(() => component.onTermDateInput(event)).not.toThrow();
  });

  it('should handle onTermDateInput in edit mode', () => {
    component.mode = 'edit';
    const event = { target: { value: '01-Dec-2025' } } as any;

    expect(() => component.onTermDateInput(event)).not.toThrow();
  });

  it('should return empty string from getEffectiveDateError when no form errors', () => {
    expect(component.getEffectiveDateError()).toBe('');
  });

  it('should return empty string from getEffectiveDateError when effDate is valid', () => {
    component.form.get('effDate')?.setValue(moment().add(1, 'year'));

    const error = component.getEffectiveDateError();

    expect(error).toBe('');
  });

  it('should return empty string from getTerminationDateError when no form errors', () => {
    expect(component.getTerminationDateError()).toBe('');
  });

  it('should return empty string from getTerminationDateError when termDate is valid', () => {
    component.form.get('termDate')?.setValue(moment().add(2, 'year'));

    const error = component.getTerminationDateError();

    expect(error).toBe('');
  });

  it('should block non-digit key in preventQuantityOverflow', () => {
    const event = {
      key: 'a',
      target: { value: '12', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
      ctrlKey: false,
      metaKey: false,
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.preventQuantityOverflow(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should block decimal key in preventPriceOverflow when decimal already present', () => {
    const event = {
      key: '.',
      target: { value: '10.5', selectionStart: 4, selectionEnd: 4 } as HTMLInputElement,
      ctrlKey: false,
      metaKey: false,
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.preventPriceOverflow(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should allow decimal key in preventPriceOverflow when no decimal present', () => {
    const event = {
      key: '.',
      target: { value: '10', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
      ctrlKey: false,
      metaKey: false,
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.preventPriceOverflow(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should block non-digit non-decimal key in preventPriceOverflow', () => {
    const event = {
      key: 'e',
      target: { value: '10', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
      ctrlKey: false,
      metaKey: false,
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.preventPriceOverflow(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should block digit in preventPriceOverflow when decimal part would exceed 2 digits', () => {
    const event = {
      key: '3',
      target: { value: '10.12', selectionStart: 5, selectionEnd: 5 } as HTMLInputElement,
      ctrlKey: false,
      metaKey: false,
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as KeyboardEvent;

    component.preventPriceOverflow(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should handle onPriceBlur and format the price value', () => {
    component.form.get('price')?.setValue(10.5);

    const event = new FocusEvent('blur');
    component.onPriceBlur(event);

    expect(component.form.get('price')?.value).toBeCloseTo(10.5, 2);
  });

  it('should skip onPriceBlur when price is null', () => {
    component.form.get('price')?.setValue(null);

    expect(() => component.onPriceBlur(new FocusEvent('blur'))).not.toThrow();
  });

  it('should initialize form with data values in edit mode with ngOnChanges', () => {
    const editData: AntigenPricingMatrixModel = {
      code: 'EDIT01',
      quantity: 3,
      price: 15.50,
      description: 'Edit mode',
      effDate: '2025-06-01',
      termDate: '2025-12-31'
    };
    component.mode = 'edit';
    component.data = editData;

    component.ngOnChanges({
      data: { currentValue: editData, previousValue: null, firstChange: false, isFirstChange: () => false }
    } as any);

    expect(component.form.get('code')?.value).toBe('EDIT01');
    expect(component.form.get('quantity')?.value).toBe(3);
    expect(component.form.get('termDate')?.value).toBeTruthy();
  });
});
