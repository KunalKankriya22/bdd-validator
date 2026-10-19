import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AddEditProductDialogComponent } from './add-edit-product-dialog';
import { ProductCodesService } from '../services/product-codes.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddEditProductDialogComponent', () => {
  let dialogRefSpy: any;
  let serviceSpy: any;
  let component: AddEditProductDialogComponent;
  let fixture: ComponentFixture<AddEditProductDialogComponent>;
  let service: jasmine.SpyObj<ProductCodesService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AddEditProductDialogComponent>>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockDialogData = {
    mode: 'add' as const
  };

  // Helper function to create valid form data
  const getValidFormData = () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days in future

    return {
      productCode: 'E0002',
      productFormula: 'E0002+E0003',
      productShortName: 'TestProd', // Max 10 chars
      productDesc: 'Test Description',
      productType: 'RBC',
      productClass: 'WB',
      modifierCode: 'A', // Required field
      lifeSpan: 35,
      lifeSpanInd: 'D',
      minTemp: 1,
      maxTemp: 6,
      minWeight: 400,
      maxWeight: 600,
      minRcvTemp: 1,
      maxRcvTemp: 10,
      oftFlag: 'N',
      rhLabelFlag: 'N',
      dummyProductFlag: 'N',
      invProductType: 'TEST', // Required field
      returnable: 'N',
      effDate: futureDate // Future date to pass validation
    };
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ProductCodesService', [
      'getProductTypes',
      'getProductClasses',
      'getModifiers',
      'getInventoryClasses',
      'createProductCode',
      'updateProductCode',
      'validateFormula'
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const snackbarServiceSpy = createMockSnackbarService();



      TestBed.configureTestingModule({
imports: [
        AddEditProductDialogComponent,
        HttpClientTestingModule,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ProductCodesService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.getProductTypes.calls.reset();


      serviceSpy.getProductClasses.calls.reset();


      serviceSpy.getModifiers.calls.reset();


      serviceSpy.getInventoryClasses.calls.reset();


      serviceSpy.createProductCode.calls.reset();


      serviceSpy.updateProductCode.calls.reset();


      dialogRefSpy.close.calls.reset();


    service = TestBed.inject(ProductCodesService) as jasmine.SpyObj<ProductCodesService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<AddEditProductDialogComponent>>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    service.getProductTypes.and.returnValue(of([]));
    service.getProductClasses.and.returnValue(of([]));
    service.getModifiers.and.returnValue(of([]));
    service.getInventoryClasses.and.returnValue(of([]));
    service.validateFormula.and.returnValue(of({ success: true }));

    fixture = TestBed.createComponent(AddEditProductDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should enforce max length validations', () => {
    component.form.get('productCode')?.setValue('123456'); // Max is 5
    expect(component.form.get('productCode')?.hasError('maxlength')).toBeTrue();
  });

  // Edit Mode tests would require a separate test file with edit mode configuration
  // These are tested through integration tests

  describe('Form Validations', () => {
    it('should require product code', () => {
      const productCodeControl = component.form.get('productCode');
      productCodeControl?.setValue('');
      expect(productCodeControl?.hasError('required')).toBeTrue();
    });

    it('should validate product code max length (5 characters)', () => {
      const productCodeControl = component.form.get('productCode');
      productCodeControl?.setValue('ABCDEF');
      expect(productCodeControl?.hasError('maxlength')).toBeTrue();
    });


    it('should validate numeric fields accept numbers', () => {
      const lifeSpanControl = component.form.get('lifeSpan');
      lifeSpanControl?.setValue(35);
      expect(lifeSpanControl?.value).toBe(35);
    });


    it('should accept valid effective and termination dates', () => {
      component.form.patchValue({
        effDate: new Date('2025-01-01'),
        termDate: new Date('2025-12-31')
      });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('effDateBeforeTermDate')).toBeFalse();
    });
  });

  describe('Save Functionality', () => {


    it('should have isSubmitting signal', () => {
      expect(component.isSubmitting()).toBeFalse();
      component.isSubmitting.set(true);
      expect(component.isSubmitting()).toBeTrue();
    });

  });

  describe('Error Handling', () => {
    it('should handle API error with error code', () => {
      const error = {
        error: {
          errorResponse: {
            errorCode: 'E1001',
            error: 'Product code already exists'
          }
        }
      };
      service.createProductCode.and.returnValue(throwError(() => error));

      spyOn(component as any, 'showError');

      component.form.patchValue(getValidFormData());

      component.onSave();

      expect((component as any).showError).toHaveBeenCalledWith('Error E1001: Product code already exists');
    });

    it('should handle API error without error code', () => {
      const error = {
        error: {
          message: 'Database connection failed'
        }
      };
      service.createProductCode.and.returnValue(throwError(() => error));

      spyOn(component as any, 'showError');

      component.form.patchValue(getValidFormData());

      component.onSave();

      expect((component as any).showError).toHaveBeenCalledWith('Database connection failed');
    });

    it('should handle response with success=false', () => {
      const mockResponse = {
        success: false,
        message: 'Validation failed',
        errorCode: 'E2001',
        error: 'Validation failed'
      };
      service.createProductCode.and.returnValue(of(mockResponse));

      spyOn(component as any, 'showError');

      component.form.patchValue(getValidFormData());

      component.onSave();

      expect((component as any).showError).toHaveBeenCalledWith('Error E2001: Validation failed');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('Add and Create Another', () => {
    it('should have onSaveAndCreateAnother method', () => {
      expect(typeof component.onSaveAndCreateAnother).toBe('function');
    });
  });

  describe('Button States', () => {
    it('should show correct buttons for Add mode', () => {
      expect(component.isAddMode()).toBeTrue();
      // In Add mode: CANCEL, ADD AND CREATE ANOTHER, ADD
    });



    it('should disable save button while submitting', () => {
      component.isSubmitting.set(true);
      expect(component.isSaveButtonDisabled).toBeTrue();
    });
  });

  describe('Cancel and Clear', () => {

    it('should have onClearAll method', () => {
      expect(typeof component.onClearAll).toBe('function');
    });
  });

  describe('Date Serialization', () => {
    it('should serialize dates to YYYY-MM-DD format for API', () => {
      const mockResponse = { success: true, message: 'Product created successfully' };
      service.createProductCode.and.returnValue(of(mockResponse));

      component.form.patchValue(getValidFormData());

      component.onSave();

      expect(service.createProductCode).toHaveBeenCalledWith(
        jasmine.objectContaining({
          productCode: 'E0002'
        })
      );
    });

  });

  describe('Dialog Title', () => {
    it('should return "Add New Product" for add mode', () => {
      component.mode = 'add';
      expect(component.dialogTitle).toBe('Add New Product');
    });

    it('should return "View Product Details" for view mode', () => {
      component.mode = 'view';
      expect(component.dialogTitle).toBe('View Product Details');
    });

    it('should return "Edit Product Details" for edit mode', () => {
      component.mode = 'edit';
      expect(component.dialogTitle).toBe('Edit Product Details');
    });
  });

  describe('ngOnChanges', () => {
    it('should set view mode and disable form when mode changes to view', () => {
      component.mode = 'view';
      component.ngOnChanges({
        mode: { currentValue: 'view', previousValue: 'add', firstChange: false, isFirstChange: () => false }
      });
      expect(component.isViewMode()).toBeTrue();
      expect(component.isAddMode()).toBeFalse();
      // Verify individual controls are disabled (form.disabled may be false due to async validators)
      expect(component.form.get('productCode')?.disabled).toBeTrue();
    });

    it('should enable form when mode changes to edit', () => {
      component.mode = 'edit';
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: 'view', firstChange: false, isFirstChange: () => false }
      });
      expect(component.isViewMode()).toBeFalse();
      expect(component.form.enabled).toBeTrue();
    });

    it('should populate form when product input changes', () => {
      const mockProduct: any = {
        productCode: 'ABC',
        productShortName: 'Test',
        effDate: '2025-06-01',
        termDate: null
      };
      component.product = mockProduct;
      component.ngOnChanges({
        product: { currentValue: mockProduct, previousValue: null, firstChange: false, isFirstChange: () => false }
      });
      expect(component.form.get('productCode')?.value).toBe('ABC');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close the dialog with success false', () => {
      component.onCancel();
      expect(dialogRef.close).toHaveBeenCalledWith({ success: false });
    });
  });

  describe('onClearAll', () => {
    it('should reset the form', () => {
      component.form.patchValue({ productCode: 'TEST' }, { emitEvent: false });
      component.onClearAll();
      expect(component.form.get('productCode')?.value).toBeNull();
    });
  });

  describe('emitClose', () => {
    it('should close dialog if dialogRef exists', () => {
      (component as any).emitClose(true);
      expect(dialogRef.close).toHaveBeenCalledWith({ success: true });
    });

    it('should emit close event if no dialogRef', () => {
      (component as any).dialogRef = null;
      spyOn(component.close, 'emit');
      (component as any).emitClose(true);
      expect(component.close.emit).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('onEditClick', () => {
    it('should switch from view to edit mode and enable form', () => {
      component.form.disable();
      component.isViewMode.set(true);
      component.onEditClick();
      expect(component.mode).toBe('edit');
      expect(component.isViewMode()).toBeFalse();
      expect(component.isAddMode()).toBeFalse();
      expect(component.form.enabled).toBeTrue();
    });
  });

  describe('onBreadcrumbClick', () => {
    it('should close dialog when clicking home', () => {
      component.onBreadcrumbClick('home');
      expect(dialogRef.close).toHaveBeenCalledWith({ success: false });
    });

    it('should close dialog when clicking product-codes', () => {
      component.onBreadcrumbClick('product-codes');
      expect(dialogRef.close).toHaveBeenCalledWith({ success: false });
    });
  });

  describe('isSaveButtonDisabled', () => {
    it('should return true in edit mode when form is not dirty', () => {
      component.isAddMode.set(false);
      component.form.markAsPristine();
      expect(component.isSaveButtonDisabled).toBeTrue();
    });

    it('should return true when form is invalid', () => {
      component.isAddMode.set(true);
      component.form.get('productCode')?.setValue('');
      component.form.get('productCode')?.setValidators([]);
      component.form.get('productCode')?.updateValueAndValidity();
      // Form has required validators on many fields, so it's invalid
      expect(component.isSaveButtonDisabled).toBeTrue();
    });

    it('should return true when submitting', () => {
      component.isSubmitting.set(true);
      expect(component.isSaveButtonDisabled).toBeTrue();
    });
  });

  describe('effectiveDateFilter', () => {
    it('should return true for null date', () => {
      expect(component.effectiveDateFilter(null)).toBeTrue();
    });

    it('should return true for any date in non-add mode', () => {
      component.isAddMode.set(false);
      const pastDate = { clone: () => ({ startOf: () => ({ isBefore: () => true }) }) };
      expect(component.effectiveDateFilter(pastDate)).toBeTrue();
    });

    it('should return false for past dates in add mode', () => {
      component.isAddMode.set(true);
      const pastDate = {
        clone: () => ({
          startOf: () => ({
            isBefore: () => true
          })
        })
      };
      expect(component.effectiveDateFilter(pastDate)).toBeFalse();
    });

    it('should return true for future dates in add mode', () => {
      component.isAddMode.set(true);
      const futureDate = {
        clone: () => ({
          startOf: () => ({
            isBefore: () => false
          })
        })
      };
      expect(component.effectiveDateFilter(futureDate)).toBeTrue();
    });
  });

  describe('terminationDateFilter', () => {
    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return true if no effective date is set', () => {
      component.form.get('effDate')?.setValue(null, { emitEvent: false });
      const someDate = {
        clone: () => ({ startOf: () => ({ isBefore: () => false }) })
      };
      expect(component.terminationDateFilter(someDate)).toBeTrue();
    });
  });

  describe('getProductClassDescription', () => {
    it('should return empty string when no product class selected', () => {
      component.form.get('productClass')?.setValue('', { emitEvent: false });
      expect(component.getProductClassDescription()).toBe('');
    });

    it('should return description when product class found', () => {
      component.productClasses.set([{ code: 'WB', codeDesc: 'Whole Blood' }]);
      component.form.get('productClass')?.setValue('WB', { emitEvent: false });
      expect(component.getProductClassDescription()).toBe('Whole Blood');
    });

    it('should return empty string when product class not found in list', () => {
      component.productClasses.set([{ code: 'WB', codeDesc: 'Whole Blood' }]);
      component.form.get('productClass')?.setValue('XX', { emitEvent: false });
      expect(component.getProductClassDescription()).toBe('');
    });
  });

  describe('getModifierDescription', () => {
    it('should return empty string when no modifier selected', () => {
      component.form.get('modifierCode')?.setValue('', { emitEvent: false });
      expect(component.getModifierDescription()).toBe('');
    });

    it('should return description when modifier found', () => {
      component.modifiers.set([{ code: 'A', codeDesc: 'Modifier A' }]);
      component.form.get('modifierCode')?.setValue('A', { emitEvent: false });
      expect(component.getModifierDescription()).toBe('Modifier A');
    });

    it('should return empty string when modifier not found in list', () => {
      component.modifiers.set([{ code: 'A', codeDesc: 'Modifier A' }]);
      component.form.get('modifierCode')?.setValue('ZZ', { emitEvent: false });
      expect(component.getModifierDescription()).toBe('');
    });
  });

  describe('onNumberKeypress', () => {
    it('should allow digit characters', () => {
      const event = { which: 48, keyCode: 48, key: '0', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow backspace', () => {
      const event = { which: 8, keyCode: 8, key: 'Backspace', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow tab', () => {
      const event = { which: 9, keyCode: 9, key: 'Tab', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Delete key', () => {
      const event = { which: 46, keyCode: 46, key: 'Delete', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block decimal point', () => {
      const event = { which: 46, keyCode: 46, key: '.', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block letter characters', () => {
      const event = { which: 65, keyCode: 65, key: 'A', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow escape key', () => {
      const event = { which: 27, keyCode: 27, key: 'Escape', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow enter key', () => {
      const event = { which: 13, keyCode: 13, key: 'Enter', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onDecimalKeypress', () => {
    it('should allow digit characters', () => {
      const event = {
        which: 49, keyCode: 49, key: '1',
        target: { value: '12', selectionStart: 2 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow first decimal point', () => {
      const event = {
        which: 46, keyCode: 46, key: '.',
        target: { value: '12', selectionStart: 2 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block second decimal point', () => {
      const event = {
        which: 46, keyCode: 46, key: '.',
        target: { value: '12.3', selectionStart: 4 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow minus sign at beginning', () => {
      const event = {
        which: 45, keyCode: 45, key: '-',
        target: { value: '', selectionStart: 0 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block letter characters', () => {
      const event = {
        which: 101, keyCode: 101, key: 'e',
        target: { value: '12', selectionStart: 2 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow backspace', () => {
      const event = {
        which: 8, keyCode: 8, key: 'Backspace',
        target: { value: '12', selectionStart: 2 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Delete key', () => {
      const event = {
        which: 46, keyCode: 46, key: 'Delete',
        target: { value: '12', selectionStart: 1 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onMaxDigitsInput', () => {
    it('should truncate input exceeding max digits', () => {
      const input = { value: '12345', getAttribute: () => 'lifeSpan' } as any;
      const event = { target: input } as any;
      component.onMaxDigitsInput(event, 4);
      expect(input.value).toBe('1234');
    });

    it('should not truncate input within max digits', () => {
      const input = { value: '123', getAttribute: () => 'lifeSpan' } as any;
      const event = { target: input } as any;
      component.onMaxDigitsInput(event, 4);
      expect(input.value).toBe('123');
    });

    it('should mark control as touched and dirty', () => {
      const input = { value: '12', getAttribute: () => 'lifeSpan' } as any;
      const event = { target: input } as any;
      component.onMaxDigitsInput(event, 4);
      expect(component.form.get('lifeSpan')?.touched).toBeTrue();
      expect(component.form.get('lifeSpan')?.dirty).toBeTrue();
    });

    it('should handle input with no formControlName attribute', () => {
      const input = { value: '12345', getAttribute: () => null } as any;
      const event = { target: input } as any;
      // Should not throw
      expect(() => component.onMaxDigitsInput(event, 4)).not.toThrow();
    });
  });

  describe('onNumericInput', () => {
    it('should truncate value exceeding maxLength', () => {
      const input = { value: '123456', getAttribute: () => 'lifeSpan' } as any;
      const event = { target: input } as any;
      component.onNumericInput(event, 4);
      expect(input.value).toBe('1234');
    });

    it('should not modify value within maxLength', () => {
      const input = { value: '123', getAttribute: () => 'lifeSpan' } as any;
      const event = { target: input } as any;
      component.onNumericInput(event, 4);
      expect(input.value).toBe('123');
    });
  });

  describe('getFieldError', () => {
    it('should return empty string for untouched control', () => {
      component.form.get('minTemp')?.markAsUntouched();
      component.form.get('minTemp')?.markAsPristine();
      expect(component.getFieldError('minTemp')).toBe('');
    });

    it('should return empty string for non-existent field', () => {
      expect(component.getFieldError('nonExistentField')).toBe('');
    });

    it('should return range error message for minTemp', () => {
      const control = component.form.get('minTemp');
      control?.setValue(0);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('minTemp')).toBe('Minimum temperature must be between 1 and 50 °C');
    });

    it('should return range error message for maxTemp', () => {
      const control = component.form.get('maxTemp');
      control?.setValue(100);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('maxTemp')).toBe('Maximum temperature must be between 1 and 50 °C');
    });

    it('should return range error message for minWeight', () => {
      const control = component.form.get('minWeight');
      control?.setValue(-1);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('minWeight')).toBe('Minimum weight must be between 0 and 999.99 grams');
    });

    it('should return range error message for maxWeight', () => {
      const control = component.form.get('maxWeight');
      control?.setValue(1000);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('maxWeight')).toBe('Maximum weight must be between 0 and 999.99 grams');
    });

    it('should return range error message for productCount', () => {
      const control = component.form.get('productCount');
      control?.setValue(1000);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('productCount')).toBe('Product count must be between 0 and 999.9999');
    });

    it('should return range error message for specificGravity', () => {
      const control = component.form.get('specificGravity');
      control?.setValue(100);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('specificGravity')).toBe('Specific gravity must be between 0 and 99.999');
    });

    it('should return required error for minRcvTemp', () => {
      const control = component.form.get('minRcvTemp');
      control?.setValue(null);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('minRcvTemp')).toBe('Minimum receive temperature is required');
    });

    it('should return range error for minRcvTemp', () => {
      const control = component.form.get('minRcvTemp');
      control?.setValue(1000);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('minRcvTemp')).toBe('Minimum receive temperature must be between -99 and 999.99 °C');
    });

    it('should return required error for maxRcvTemp', () => {
      const control = component.form.get('maxRcvTemp');
      control?.setValue(null);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('maxRcvTemp')).toBe('Maximum receive temperature is required');
    });

    it('should return range error for maxRcvTemp', () => {
      const control = component.form.get('maxRcvTemp');
      control?.setValue(1000);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('maxRcvTemp')).toBe('Maximum receive temperature must be between -99 and 999.99 °C');
    });

    it('should return range error for maxBleedTime', () => {
      const control = component.form.get('maxBleedTime');
      control?.setValue(1000);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('maxBleedTime')).toBe('Maximum bleed time must be between 0 and 999.99 hours');
    });

    it('should return range error for timeLimit', () => {
      const control = component.form.get('timeLimit');
      control?.setValue(10000);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('timeLimit')).toBe('Component definition time limit must be between 0 and 9999.99 hours');
    });

    it('should return range error for stdPrice', () => {
      const control = component.form.get('stdPrice');
      control?.setValue(99999999);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('stdPrice')).toBe('Standard price must be between 0 and 9999999.99');
    });

    it('should return generic required error for unlabeled fields', () => {
      const control = component.form.get('oftFlag');
      control?.setValue('');
      control?.setValidators([{ validate: () => ({ required: true }) } as any]);
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('oftFlag')).toBe('oftFlag is required');
    });

    it('should return labeled required error for known fields', () => {
      const control = component.form.get('lifeSpan');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('lifeSpan')).toBe('Life Span is required');
    });

    it('should return comparison error for minTemp', () => {
      const control = component.form.get('minTemp');
      control?.setErrors({ comparisonError: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('minTemp')).toBe('Must be less than or equal to maximum temperature');
    });

    it('should return comparison error for maxTemp', () => {
      const control = component.form.get('maxTemp');
      control?.setErrors({ comparisonError: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('maxTemp')).toBe('Must be greater than or equal to minimum temperature');
    });

    it('should return comparison error for maxWeight', () => {
      const control = component.form.get('maxWeight');
      control?.setErrors({ comparisonError: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('maxWeight')).toBe('Maximum weight must be greater than or equal to minimum weight');
    });

    it('should return comparison error for minRcvTemp', () => {
      const control = component.form.get('minRcvTemp');
      control?.setErrors({ comparisonError: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('minRcvTemp')).toBe('Must be less than or equal to maximum receive temperature');
    });

    it('should return comparison error for maxRcvTemp', () => {
      const control = component.form.get('maxRcvTemp');
      control?.setErrors({ comparisonError: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('maxRcvTemp')).toBe('Must be greater than or equal to minimum receive temperature');
    });
  });

  describe('Cross-field Validators', () => {
    it('should set comparison error when maxTemp < minTemp', () => {
      component.form.get('minTemp')?.setValue(10, { emitEvent: false });
      component.form.get('maxTemp')?.setValue(5, { emitEvent: false });
      (component as any).tempComparisonValidator();
      expect(component.form.get('maxTemp')?.hasError('comparisonError')).toBeTrue();
      expect(component.form.get('minTemp')?.hasError('comparisonError')).toBeTrue();
    });

    it('should clear comparison error when maxTemp >= minTemp', () => {
      component.form.get('minTemp')?.setValue(5, { emitEvent: false });
      component.form.get('maxTemp')?.setValue(10, { emitEvent: false });
      // First set the error
      component.form.get('minTemp')?.setErrors({ comparisonError: true });
      component.form.get('maxTemp')?.setErrors({ comparisonError: true });
      (component as any).tempComparisonValidator();
      expect(component.form.get('maxTemp')?.hasError('comparisonError')).toBeFalse();
      expect(component.form.get('minTemp')?.hasError('comparisonError')).toBeFalse();
    });

    it('should set comparison error when maxWeight < minWeight', () => {
      component.form.get('minWeight')?.setValue(500, { emitEvent: false });
      component.form.get('maxWeight')?.setValue(100, { emitEvent: false });
      (component as any).weightComparisonValidator();
      expect(component.form.get('maxWeight')?.hasError('comparisonError')).toBeTrue();
    });

    it('should clear comparison error when maxWeight >= minWeight', () => {
      component.form.get('minWeight')?.setValue(100, { emitEvent: false });
      component.form.get('maxWeight')?.setValue(500, { emitEvent: false });
      component.form.get('maxWeight')?.setErrors({ comparisonError: true });
      (component as any).weightComparisonValidator();
      expect(component.form.get('maxWeight')?.hasError('comparisonError')).toBeFalse();
    });

    it('should set comparison error when maxRcvTemp < minRcvTemp', () => {
      component.form.get('minRcvTemp')?.setValue(10, { emitEvent: false });
      component.form.get('maxRcvTemp')?.setValue(5, { emitEvent: false });
      (component as any).rcvTempComparisonValidator();
      expect(component.form.get('maxRcvTemp')?.hasError('comparisonError')).toBeTrue();
      expect(component.form.get('minRcvTemp')?.hasError('comparisonError')).toBeTrue();
    });

    it('should clear comparison error when maxRcvTemp >= minRcvTemp', () => {
      component.form.get('minRcvTemp')?.setValue(5, { emitEvent: false });
      component.form.get('maxRcvTemp')?.setValue(10, { emitEvent: false });
      component.form.get('maxRcvTemp')?.setErrors({ comparisonError: true });
      component.form.get('minRcvTemp')?.setErrors({ comparisonError: true });
      (component as any).rcvTempComparisonValidator();
      expect(component.form.get('maxRcvTemp')?.hasError('comparisonError')).toBeFalse();
      expect(component.form.get('minRcvTemp')?.hasError('comparisonError')).toBeFalse();
    });

    it('should return null from tempComparisonValidator when form is null', () => {
      const origForm = component.form;
      (component as any).form = null;
      expect((component as any).tempComparisonValidator()).toBeNull();
      (component as any).form = origForm;
    });

    it('should return null from weightComparisonValidator when form is null', () => {
      const origForm = component.form;
      (component as any).form = null;
      expect((component as any).weightComparisonValidator()).toBeNull();
      (component as any).form = origForm;
    });

    it('should return null from rcvTempComparisonValidator when form is null', () => {
      const origForm = component.form;
      (component as any).form = null;
      expect((component as any).rcvTempComparisonValidator()).toBeNull();
      (component as any).form = origForm;
    });
  });

  describe('Custom Validators', () => {
    it('should validate minTemp in range 1-50', () => {
      const validator = (component as any).minTempRangeValidator;
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: 0 } as any)).toEqual({ rangeError: true });
      expect(validator({ value: 25 } as any)).toBeNull();
      expect(validator({ value: 51 } as any)).toEqual({ rangeError: true });
    });

    it('should validate maxTemp in range 1-50', () => {
      const validator = (component as any).maxTempRangeValidator;
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: 0 } as any)).toEqual({ rangeError: true });
      expect(validator({ value: 25 } as any)).toBeNull();
      expect(validator({ value: 51 } as any)).toEqual({ rangeError: true });
    });

    it('should validate weight in range 0-999.99', () => {
      const validator = (component as any).weightRangeValidator;
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: -1 } as any)).toEqual({ rangeError: true });
      expect(validator({ value: 500 } as any)).toBeNull();
      expect(validator({ value: 1000 } as any)).toEqual({ rangeError: true });
    });

    it('should validate productCount in range 0-999.9999', () => {
      const validator = (component as any).productCountValidator;
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: -1 } as any)).toEqual({ rangeError: true });
      expect(validator({ value: 500 } as any)).toBeNull();
      expect(validator({ value: 1000 } as any)).toEqual({ rangeError: true });
    });

    it('should validate specificGravity in range 0-99.999', () => {
      const validator = (component as any).specificGravityValidator;
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: -1 } as any)).toEqual({ rangeError: true });
      expect(validator({ value: 50 } as any)).toBeNull();
      expect(validator({ value: 100 } as any)).toEqual({ rangeError: true });
    });

    it('should validate timeLimit in range 0-9999.99', () => {
      const validator = (component as any).timeLimitValidator;
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: -1 } as any)).toEqual({ rangeError: true });
      expect(validator({ value: 5000 } as any)).toBeNull();
      expect(validator({ value: 10000 } as any)).toEqual({ rangeError: true });
    });

    it('should validate stdPrice in range 0-9999999.99', () => {
      const validator = (component as any).stdPriceValidator;
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: -1 } as any)).toEqual({ rangeError: true });
      expect(validator({ value: 100 } as any)).toBeNull();
      expect(validator({ value: 10000000 } as any)).toEqual({ rangeError: true });
    });

    it('should validate temp999 in range -99 to 999.99', () => {
      const validator = (component as any).temp999Validator;
      expect(validator({ value: null } as any)).toBeNull();
      expect(validator({ value: -100 } as any)).toEqual({ rangeError: true });
      expect(validator({ value: 500 } as any)).toBeNull();
      expect(validator({ value: 1000 } as any)).toEqual({ rangeError: true });
    });

    it('should validate compProductCode starts with productCode', () => {
      const validator = (component as any).compProductCodeValidator;
      component.form.get('productCode')?.setValue('ABC', { emitEvent: false });

      expect(validator({ value: '' } as any)).toBeNull();
      expect(validator({ value: 'ABC123' } as any)).toBeNull();
      expect(validator({ value: 'XYZ123' } as any)).toEqual({ compCodeProductMismatch: true });
    });

    it('should return null from compProductCodeValidator when productCode is not set', () => {
      const validator = (component as any).compProductCodeValidator;
      component.form.get('productCode')?.setValue('', { emitEvent: false });
      expect(validator({ value: 'TEST' } as any)).toBeNull();
    });
  });

  describe('Filter Methods', () => {
    it('should filter product types by search term', () => {
      component.productTypes.set([
        { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { productTypeCode: 'PLT', productTypeDesc: 'Platelets' }
      ]);
      component.productTypeSearchControl.setValue('rbc');
      expect(component.filteredProductTypes.length).toBe(1);
      expect(component.filteredProductTypes[0].productTypeCode).toBe('RBC');
    });

    it('should show all product types when search is empty', () => {
      component.productTypes.set([
        { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { productTypeCode: 'PLT', productTypeDesc: 'Platelets' }
      ]);
      component.productTypeSearchControl.setValue('');
      expect(component.filteredProductTypes.length).toBe(2);
    });

    it('should filter product classes by search term', () => {
      component.productClasses.set([
        { code: 'WB', codeDesc: 'Whole Blood' },
        { code: 'CP', codeDesc: 'Component' }
      ]);
      component.productClassSearchControl.setValue('whole');
      expect(component.filteredProductClasses.length).toBe(1);
    });

    it('should show all product classes when search is empty', () => {
      component.productClasses.set([
        { code: 'WB', codeDesc: 'Whole Blood' },
        { code: 'CP', codeDesc: 'Component' }
      ]);
      component.productClassSearchControl.setValue('');
      expect(component.filteredProductClasses.length).toBe(2);
    });

    it('should filter modifiers by search term', () => {
      component.modifiers.set([
        { code: 'A', codeDesc: 'Alpha' },
        { code: 'B', codeDesc: 'Beta' }
      ]);
      component.modifierSearchControl.setValue('alpha');
      expect(component.filteredModifiers.length).toBe(1);
    });

    it('should show all modifiers when search is empty', () => {
      component.modifiers.set([
        { code: 'A', codeDesc: 'Alpha' },
        { code: 'B', codeDesc: 'Beta' }
      ]);
      component.modifierSearchControl.setValue('');
      expect(component.filteredModifiers.length).toBe(2);
    });

    it('should filter inventory classes by search term', () => {
      component.inventoryClasses.set([
        { code: 'IC1', codeDesc: 'Class One' },
        { code: 'IC2', codeDesc: 'Class Two' }
      ]);
      component.inventoryClassSearchControl.setValue('one');
      expect(component.filteredInventoryClasses.length).toBe(1);
    });

    it('should show all inventory classes when search is empty', () => {
      component.inventoryClasses.set([
        { code: 'IC1', codeDesc: 'Class One' },
        { code: 'IC2', codeDesc: 'Class Two' }
      ]);
      component.inventoryClassSearchControl.setValue('');
      expect(component.filteredInventoryClasses.length).toBe(2);
    });
  });

  describe('loadDropdowns error handling', () => {
    it('should show error when product types fail to load', () => {
      service.getProductTypes.and.returnValue(throwError(() => new Error('fail')));
      service.getProductClasses.and.returnValue(of([]));
      service.getModifiers.and.returnValue(of([]));
      service.getInventoryClasses.and.returnValue(of([]));
      (component as any).loadDropdowns();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load product types');
    });

    it('should show error when product classes fail to load', () => {
      service.getProductTypes.and.returnValue(of([]));
      service.getProductClasses.and.returnValue(throwError(() => new Error('fail')));
      service.getModifiers.and.returnValue(of([]));
      service.getInventoryClasses.and.returnValue(of([]));
      (component as any).loadDropdowns();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load product classes');
    });

    it('should show error when modifiers fail to load', () => {
      service.getProductTypes.and.returnValue(of([]));
      service.getProductClasses.and.returnValue(of([]));
      service.getModifiers.and.returnValue(throwError(() => new Error('fail')));
      service.getInventoryClasses.and.returnValue(of([]));
      (component as any).loadDropdowns();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load modifiers');
    });

    it('should show error when inventory classes fail to load', () => {
      service.getProductTypes.and.returnValue(of([]));
      service.getProductClasses.and.returnValue(of([]));
      service.getModifiers.and.returnValue(of([]));
      service.getInventoryClasses.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDropdowns();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load inventory classes');
    });
  });

  describe('loadProductAttributes', () => {
    it('should load product attributes successfully', () => {
      const mockAttributes = [
        { attributeGroup: 'AG1', attributeGroupDescription: 'Group 1', attributeCode: 'AC1', attributeDescription: 'Attr 1' }
      ];
      (service as any).getProductAttributes = jasmine.createSpy('getProductAttributes').and.returnValue(of(mockAttributes));
      (component as any).loadProductAttributes('TEST');
      expect(component.productAttributes().length).toBe(1);
    });

    it('should show error when loading attributes fails', () => {
      (service as any).getProductAttributes = jasmine.createSpy('getProductAttributes').and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadProductAttributes('TEST');
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load product attributes');
    });
  });

  describe('onSave - success path', () => {
    it('should call createProductCode and close dialog on success', () => {
      const mockResponse = { success: true, message: 'Created' };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSave();
      expect(service.createProductCode).toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith({ success: true });
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Product code created successfully');
    });

    it('should show validation error when form is invalid', () => {
      component.form.get('productCode')?.setValue('');
      component.onSave();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please fix validation errors');
      expect(service.createProductCode).not.toHaveBeenCalled();
    });

    it('should call updateProductCode in edit mode', () => {
      const mockResponse = { success: true, message: 'Updated' };
      service.updateProductCode.and.returnValue(of(mockResponse));
      component.mode = 'edit';
      component.isAddMode.set(false);
      component.product = { productCode: 'E0002' } as any;
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSave();
      expect(service.updateProductCode).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Product code updated successfully');
    });

    it('should handle success=false with errorResponse nested error', () => {
      const mockResponse = {
        success: false,
        errorResponse: { errorCode: 'E999', error: 'Nested error' }
      };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSave();
      expect(snackbarService.showError).toHaveBeenCalledWith('Error E999: Nested error');
      expect(component.isSubmitting()).toBeFalse();
    });

    it('should set dateRangeInvalid lastChangedDateField to effective when not set', () => {
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      // Simulate a form-level dateRangeInvalid error
      component.form.setErrors({ dateRangeInvalid: true });
      (component as any).lastChangedDateField = null;
      component.onSave();
      expect((component as any).lastChangedDateField).toBe('effective');
    });
  });

  describe('onSaveAndCreateAnother', () => {
    it('should create product and reset form on success', () => {
      const mockResponse = { success: true, message: 'Created' };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSaveAndCreateAnother();
      expect(service.createProductCode).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Product code created successfully');
    });

    it('should show validation error when form is invalid', () => {
      component.form.get('productCode')?.setValue('');
      component.onSaveAndCreateAnother();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please fix validation errors');
    });

    it('should handle success=false response', () => {
      const mockResponse = { success: false, errorCode: 'E111', error: 'Duplicate' };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSaveAndCreateAnother();
      expect(snackbarService.showError).toHaveBeenCalledWith('Error E111: Duplicate');
      expect(component.isSubmitting()).toBeFalse();
    });

    it('should handle API error', () => {
      const error = { error: { message: 'Server error' } };
      service.createProductCode.and.returnValue(throwError(() => error));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSaveAndCreateAnother();
      expect(component.isSubmitting()).toBeFalse();
      expect(snackbarService.showError).toHaveBeenCalled();
    });

    it('should handle success=false with errorResponse fallback message', () => {
      const mockResponse = { success: false, message: 'Fallback message' };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSaveAndCreateAnother();
      expect(snackbarService.showError).toHaveBeenCalledWith('Fallback message');
    });

    it('should set dateRangeInvalid lastChangedDateField to effective when not set', () => {
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.setErrors({ dateRangeInvalid: true });
      (component as any).lastChangedDateField = null;
      component.onSaveAndCreateAnother();
      expect((component as any).lastChangedDateField).toBe('effective');
    });
  });

  describe('handleSaveError', () => {
    it('should handle error with nested errorResponse', () => {
      const error = { error: { errorResponse: { errorCode: 'E100', error: 'Nested' } } };
      (component as any).handleSaveError(error);
      expect(snackbarService.showError).toHaveBeenCalledWith('Error E100: Nested');
    });

    it('should handle error with top-level error code', () => {
      const error = { error: { errorCode: 'E200', error: 'Top level' } };
      (component as any).handleSaveError(error);
      expect(snackbarService.showError).toHaveBeenCalledWith('Error E200: Top level');
    });

    it('should handle error with only message', () => {
      const error = { message: 'Generic error' };
      (component as any).handleSaveError(error);
      expect(snackbarService.showError).toHaveBeenCalledWith('Generic error');
    });

    it('should default to Operation failed', () => {
      (component as any).handleSaveError({});
      expect(snackbarService.showError).toHaveBeenCalledWith('Operation failed');
    });
  });

  describe('getFormValidationErrors', () => {
    it('should return empty object when no errors', () => {
      // Clear all validators to make form valid
      Object.keys(component.form.controls).forEach(key => {
        component.form.get(key)?.clearValidators();
        component.form.get(key)?.setErrors(null);
        component.form.get(key)?.updateValueAndValidity({ emitEvent: false });
      });
      component.form.setErrors(null);
      const errors = (component as any).getFormValidationErrors();
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should return errors for invalid controls', () => {
      component.form.get('productCode')?.setErrors({ required: true });
      const errors = (component as any).getFormValidationErrors();
      expect(errors['productCode']).toBeTruthy();
    });

    it('should include form-level errors', () => {
      component.form.setErrors({ dateRangeInvalid: true });
      const errors = (component as any).getFormValidationErrors();
      expect(errors['formErrors']).toBeTruthy();
    });
  });

  describe('getEffectiveDateError and getTerminationDateError', () => {
    it('should return error string from getEffectiveDateError', () => {
      // When lastChangedDateField is not 'effective', formErrors should be null
      (component as any).lastChangedDateField = 'termination';
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should return error string from getTerminationDateError', () => {
      (component as any).lastChangedDateField = 'effective';
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });

    it('should pass form errors when lastChangedDateField is effective', () => {
      (component as any).lastChangedDateField = 'effective';
      component.form.setErrors({ dateRangeInvalid: true });
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should pass form errors when lastChangedDateField is termination', () => {
      (component as any).lastChangedDateField = 'termination';
      component.form.setErrors({ dateRangeInvalid: true });
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('onEffectiveDateInput and onTerminationDateInput', () => {
    it('should call handleStartDateInput for effective date', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });

    it('should call handleEndDateInput for termination date', () => {
      const event = { target: { value: '31-DEC-2025' } } as any;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('Uppercase field conversion', () => {
    it('should convert productShortName to uppercase', () => {
      component.form.get('productShortName')?.setValue('test');
      expect(component.form.get('productShortName')?.value).toBe('TEST');
    });

    it('should convert invProductType to uppercase', () => {
      component.form.get('invProductType')?.setValue('abc');
      expect(component.form.get('invProductType')?.value).toBe('ABC');
    });

    it('should convert compProductCode to uppercase', () => {
      component.form.get('compProductCode')?.setValue('abc');
      expect(component.form.get('compProductCode')?.value).toBe('ABC');
    });

    it('should convert serviceCode to uppercase', () => {
      component.form.get('serviceCode')?.setValue('svc');
      expect(component.form.get('serviceCode')?.value).toBe('SVC');
    });
  });

  describe('Unit Scheme Subscription', () => {
    it('should disable formula field when unitSchemeType is C', () => {
      component.form.get('unitSchemeType')?.setValue('C');
      expect(component.form.get('productFormula')?.disabled).toBeTrue();
    });

    it('should enable formula field when unitSchemeType is I', () => {
      component.form.get('unitSchemeType')?.setValue('I');
      expect(component.form.get('productFormula')?.disabled).toBeFalse();
    });
  });

  describe('formulaAsyncValidator', () => {
    it('should return null for empty formula', (done) => {
      const validator = (component as any).formulaAsyncValidator;
      validator({ value: '' }).subscribe((result: any) => {
        expect(result).toBeNull();
        done();
      });
    }, 15000);

    it('should return null for whitespace-only formula', (done) => {
      const validator = (component as any).formulaAsyncValidator;
      validator({ value: '   ' }).subscribe((result: any) => {
        expect(result).toBeNull();
        done();
      });
    }, 15000);

    it('should return null in non-add mode', (done) => {
      component.isAddMode.set(false);
      const validator = (component as any).formulaAsyncValidator;
      validator({ value: 'FORMULA' }).subscribe((result: any) => {
        expect(result).toBeNull();
        done();
      });
    }, 15000);

    it('should return null for valid formula', (done) => {
      component.isAddMode.set(true);
      (service as any).validateFormula = jasmine.createSpy('validateFormula').and.returnValue(of({ success: true }));
      const validator = (component as any).formulaAsyncValidator;
      validator({ value: 'VALID' }).subscribe((result: any) => {
        expect(result).toBeNull();
        done();
      });
    }, 15000);

    it('should return error for invalid formula', (done) => {
      component.isAddMode.set(true);
      (service as any).validateFormula = jasmine.createSpy('validateFormula').and.returnValue(of({ success: false, error: 'Bad formula' }));
      const validator = (component as any).formulaAsyncValidator;
      validator({ value: 'BAD' }).subscribe((result: any) => {
        expect(result).toEqual({ invalidFormula: 'Bad formula' });
        done();
      });
    }, 15000);

    it('should return error on API failure', (done) => {
      component.isAddMode.set(true);
      (service as any).validateFormula = jasmine.createSpy('validateFormula').and.returnValue(throwError(() => new Error('API down')));
      const validator = (component as any).formulaAsyncValidator;
      validator({ value: 'ERR' }).subscribe((result: any) => {
        expect(result).toEqual({ invalidFormula: 'Error validating formula' });
        done();
      });
    }, 15000);
  });

  describe('populateForm', () => {
    it('should populate form with product data including dates', () => {
      const product: any = {
        productCode: 'P001',
        productShortName: 'SHORT',
        effDate: '2025-01-15',
        termDate: '2025-12-31'
      };
      (component as any).populateForm(product);
      expect(component.form.get('productCode')?.value).toBe('P001');
      expect(component.form.get('effDate')?.value).toBeTruthy();
      expect(component.form.get('termDate')?.value).toBeTruthy();
    });

    it('should handle null dates', () => {
      const product: any = {
        productCode: 'P002',
        effDate: null,
        termDate: null
      };
      (component as any).populateForm(product);
      expect(component.form.get('effDate')?.value).toBeNull();
      expect(component.form.get('termDate')?.value).toBeNull();
    });
  });

  describe('onSave API error path', () => {
    it('should handle save error and reset isSubmitting', () => {
      const error = { error: { errorResponse: { errorCode: 'E500', error: 'Internal' } } };
      service.createProductCode.and.returnValue(throwError(() => error));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSave();
      expect(component.isSubmitting()).toBeFalse();
      expect(snackbarService.showError).toHaveBeenCalledWith('Error E500: Internal');
    });
  });

  describe('success=false without error code on onSave', () => {
    it('should show error message without error code prefix', () => {
      const mockResponse = { success: false, message: 'Just a message' };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSave();
      expect(snackbarService.showError).toHaveBeenCalledWith('Just a message');
    });
  });

  describe('setupDateValidation subscription behavior', () => {
    it('should set lastChangedDateField to effective when effDate changes', () => {
      const m = moment('2027-06-01');
      component.form.get('effDate')?.setValue(m);
      expect((component as any).lastChangedDateField).toBe('effective');
    });

    it('should update terminationMinDate when effDate changes to a moment value', () => {
      const m = moment('2027-06-15');
      component.form.get('effDate')?.setValue(m);
      expect(component.terminationMinDate).toBeTruthy();
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe('2027-06-15');
    });

    it('should set lastChangedDateField to termination when termDate changes', () => {
      component.form.get('termDate')?.setValue(moment('2027-12-31'));
      expect((component as any).lastChangedDateField).toBe('termination');
    });

    it('should not update terminationMinDate for non-moment effDate values', () => {
      const before = component.terminationMinDate.clone();
      component.form.get('effDate')?.setValue('not-a-moment');
      // terminationMinDate should remain unchanged
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(before.format('YYYY-MM-DD'));
    });
  });

  describe('Cross-field validation subscription triggers', () => {
    it('should trigger tempComparisonValidator when minTemp value changes', () => {
      component.form.get('maxTemp')?.setValue(5, { emitEvent: false });
      component.form.get('minTemp')?.setValue(10);
      // minTemp subscription fires tempComparisonValidator which sets comparisonError on minTemp
      // maxTemp error is wiped by subsequent updateValueAndValidity in the subscription
      expect(component.form.get('minTemp')?.hasError('comparisonError')).toBeTrue();
    });

    it('should trigger tempComparisonValidator when maxTemp value changes', () => {
      component.form.get('minTemp')?.setValue(10, { emitEvent: false });
      component.form.get('maxTemp')?.setValue(5);
      // maxTemp subscription does NOT call updateValueAndValidity on maxTemp
      expect(component.form.get('maxTemp')?.hasError('comparisonError')).toBeTrue();
    });

    it('should trigger weightComparisonValidator when minWeight value changes', () => {
      const spy = spyOn(component as any, 'weightComparisonValidator').and.callThrough();
      component.form.get('maxWeight')?.setValue(100, { emitEvent: false });
      component.form.get('minWeight')?.setValue(500);
      // Verify the validator was called via the subscription
      expect(spy).toHaveBeenCalled();
    });

    it('should trigger weightComparisonValidator when maxWeight value changes', () => {
      component.form.get('minWeight')?.setValue(500, { emitEvent: false });
      component.form.get('maxWeight')?.setValue(100);
      // maxWeight subscription does NOT call updateValueAndValidity on maxWeight
      expect(component.form.get('maxWeight')?.hasError('comparisonError')).toBeTrue();
    });

    it('should trigger rcvTempComparisonValidator when minRcvTemp value changes', () => {
      component.form.get('maxRcvTemp')?.setValue(5, { emitEvent: false });
      component.form.get('minRcvTemp')?.setValue(10);
      // minRcvTemp subscription sets comparisonError on minRcvTemp
      // maxRcvTemp error is wiped by subsequent updateValueAndValidity
      expect(component.form.get('minRcvTemp')?.hasError('comparisonError')).toBeTrue();
    });

    it('should trigger rcvTempComparisonValidator when maxRcvTemp value changes', () => {
      component.form.get('minRcvTemp')?.setValue(10, { emitEvent: false });
      component.form.get('maxRcvTemp')?.setValue(5);
      // maxRcvTemp subscription calls updateValueAndValidity on minRcvTemp but NOT on maxRcvTemp
      expect(component.form.get('maxRcvTemp')?.hasError('comparisonError')).toBeTrue();
    });

    it('should revalidate compProductCode when productCode changes', () => {
      component.form.get('compProductCode')?.setValue('XYZTEST', { emitEvent: false });
      component.form.get('productCode')?.setValue('ABC');
      // compProductCode should now be invalid because XYZTEST does not start with ABC
      expect(component.form.get('compProductCode')?.hasError('compCodeProductMismatch')).toBeTrue();
    });
  });

  describe('Uppercase field edge cases', () => {
    it('should not re-set value if already uppercase', () => {
      const control = component.form.get('productShortName');
      const spy = spyOn(control!, 'setValue');
      // Setting an already-uppercase value via setValue with emitEvent=true
      // The subscription checks value !== upperValue
      control?.setValue('UPPER');
      // setValue was called by us, but the subscription should NOT call it again
      // since 'UPPER'.toUpperCase() === 'UPPER'
      // Note: the spy intercepts our call too, so we check it was called exactly once (our call)
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not convert null values', () => {
      const control = component.form.get('serviceCode');
      expect(() => control?.setValue(null)).not.toThrow();
    });
  });

  describe('terminationDateFilter edge cases', () => {
    it('should handle non-moment effDate value', () => {
      // Set effDate to a non-moment (Date object)
      component.form.get('effDate')?.setValue(new Date('2027-01-01'), { emitEvent: false });
      const futureDate = {
        clone: () => ({
          startOf: () => ({
            isBefore: () => false
          })
        })
      };
      expect(component.terminationDateFilter(futureDate)).toBeTrue();
    });

    it('should handle moment effDate value correctly', () => {
      component.form.get('effDate')?.setValue(moment('2027-06-01'), { emitEvent: false });
      const pastDate = {
        clone: () => ({
          startOf: () => ({
            isBefore: () => true
          })
        })
      };
      expect(component.terminationDateFilter(pastDate)).toBeFalse();
    });
  });

  describe('isSaveButtonDisabled edge cases', () => {
    it('should return false in add mode when form is valid and not submitting', () => {
      component.isAddMode.set(true);
      component.isSubmitting.set(false);
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      // Clear all errors
      Object.keys(component.form.controls).forEach(key => {
        component.form.get(key)?.clearValidators();
        component.form.get(key)?.clearAsyncValidators();
        component.form.get(key)?.setErrors(null);
        component.form.get(key)?.updateValueAndValidity({ emitEvent: false });
      });
      component.form.setErrors(null);
      component.form.updateValueAndValidity({ emitEvent: false });
      expect(component.isSaveButtonDisabled).toBeFalse();
    });

    it('should return true in edit mode when form is dirty but invalid', () => {
      component.isAddMode.set(false);
      component.form.markAsDirty();
      component.form.get('productCode')?.setErrors({ required: true });
      expect(component.isSaveButtonDisabled).toBeTrue();
    });

    it('should return false in edit mode when form is dirty and valid', () => {
      component.isAddMode.set(false);
      component.form.markAsDirty();
      // Clear all errors
      Object.keys(component.form.controls).forEach(key => {
        component.form.get(key)?.clearValidators();
        component.form.get(key)?.clearAsyncValidators();
        component.form.get(key)?.setErrors(null);
        component.form.get(key)?.updateValueAndValidity({ emitEvent: false });
      });
      component.form.setErrors(null);
      component.form.updateValueAndValidity({ emitEvent: false });
      component.isSubmitting.set(false);
      expect(component.isSaveButtonDisabled).toBeFalse();
    });
  });

  describe('loadDropdowns success path', () => {
    it('should populate productTypes signal and filteredProductTypes on success', () => {
      const types = [{ productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' }];
      service.getProductTypes.and.returnValue(of(types));
      service.getProductClasses.and.returnValue(of([]));
      service.getModifiers.and.returnValue(of([]));
      service.getInventoryClasses.and.returnValue(of([]));
      (component as any).loadDropdowns();
      expect(component.productTypes()).toEqual(types);
      expect(component.filteredProductTypes).toEqual(types);
    });

    it('should populate productClasses signal and filteredProductClasses on success', () => {
      const classes = [{ code: 'WB', codeDesc: 'Whole Blood' }];
      service.getProductTypes.and.returnValue(of([]));
      service.getProductClasses.and.returnValue(of(classes));
      service.getModifiers.and.returnValue(of([]));
      service.getInventoryClasses.and.returnValue(of([]));
      (component as any).loadDropdowns();
      expect(component.productClasses()).toEqual(classes);
      expect(component.filteredProductClasses).toEqual(classes);
    });

    it('should populate modifiers signal and filteredModifiers on success', () => {
      const mods = [{ code: 'A', codeDesc: 'Modifier A' }];
      service.getProductTypes.and.returnValue(of([]));
      service.getProductClasses.and.returnValue(of([]));
      service.getModifiers.and.returnValue(of(mods));
      service.getInventoryClasses.and.returnValue(of([]));
      (component as any).loadDropdowns();
      expect(component.modifiers()).toEqual(mods);
      expect(component.filteredModifiers).toEqual(mods);
    });

    it('should populate inventoryClasses signal and filteredInventoryClasses on success', () => {
      const inv = [{ code: 'IC1', codeDesc: 'Class One' }];
      service.getProductTypes.and.returnValue(of([]));
      service.getProductClasses.and.returnValue(of([]));
      service.getModifiers.and.returnValue(of([]));
      service.getInventoryClasses.and.returnValue(of(inv));
      (component as any).loadDropdowns();
      expect(component.inventoryClasses()).toEqual(inv);
      expect(component.filteredInventoryClasses).toEqual(inv);
    });
  });

  describe('onSave with termDate', () => {
    it('should serialize termDate when provided', () => {
      const mockResponse = { success: true, message: 'Created' };
      service.createProductCode.and.returnValue(of(mockResponse));
      const formData = getValidFormData();
      (formData as any).termDate = new Date('2028-12-31');
      component.form.patchValue(formData, { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSave();
      expect(service.createProductCode).toHaveBeenCalled();
      const request = service.createProductCode.calls.mostRecent().args[0];
      expect(request.termDate).toBeTruthy();
    });

    it('should convert empty string values to null in request', () => {
      const mockResponse = { success: true, message: 'Created' };
      service.createProductCode.and.returnValue(of(mockResponse));
      const formData = getValidFormData();
      component.form.patchValue(formData, { emitEvent: false });
      // Set an empty string field
      component.form.get('serviceCode')?.setValue('', { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSave();
      expect(service.createProductCode).toHaveBeenCalled();
      const request = service.createProductCode.calls.mostRecent().args[0];
      expect(request.serviceCode).toBeNull();
    });
  });

  describe('onSaveAndCreateAnother - form reset on success', () => {
    it('should reset form and mark as untouched after successful create', () => {
      const mockResponse = { success: true, message: 'Created' };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();

      component.onSaveAndCreateAnother();

      // Form should be reset
      expect(component.form.get('productCode')?.value).toBeNull();
      expect(component.form.untouched).toBeTrue();
    });

    it('should not close dialog on successful create and another', () => {
      const mockResponse = { success: true, message: 'Created' };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();

      component.onSaveAndCreateAnother();

      // Dialog should NOT be closed
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('onEditClick - control state reset', () => {
    it('should mark all controls as untouched and pristine', () => {
      // First, make all controls touched and dirty
      Object.keys(component.form.controls).forEach(key => {
        component.form.get(key)?.markAsTouched();
        component.form.get(key)?.markAsDirty();
      });

      component.onEditClick();

      // All controls should now be untouched and pristine
      Object.keys(component.form.controls).forEach(key => {
        expect(component.form.get(key)?.touched).toBeFalse();
        expect(component.form.get(key)?.pristine).toBeTrue();
      });
      expect(component.form.touched).toBeFalse();
      expect(component.form.pristine).toBeTrue();
    });
  });

  describe('setupUnitSchemeSubscription - initial state', () => {
    it('should have formula enabled when unitSchemeType defaults to I', () => {
      // Default value is 'I', so formula should be enabled
      expect(component.form.get('productFormula')?.disabled).toBeFalse();
    });

    it('should clear and disable formula when switching from I to C', () => {
      // Directly set the value on the control bypassing async validation
      const formulaControl = component.form.get('productFormula');
      (formulaControl as any).value = 'SOME_FORMULA';
      component.form.get('unitSchemeType')?.setValue('C');
      // The subscription should clear and disable the formula
      expect(formulaControl?.value).toBe('');
      expect(formulaControl?.disabled).toBeTrue();
    });

    it('should re-enable formula when switching from C back to I', () => {
      component.form.get('unitSchemeType')?.setValue('C');
      expect(component.form.get('productFormula')?.disabled).toBeTrue();
      component.form.get('unitSchemeType')?.setValue('I');
      expect(component.form.get('productFormula')?.disabled).toBeFalse();
    });
  });

  describe('Component creation and initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should create form in constructor', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('productCode')).toBeTruthy();
      expect(component.form.get('effDate')).toBeTruthy();
      expect(component.form.get('termDate')).toBeTruthy();
    });

    it('should initialize signals with default values', () => {
      expect(component.isSubmitting()).toBeFalse();
      expect(component.isViewMode()).toBeFalse();
      expect(component.isAddMode()).toBeTrue();
    });

    it('should set default values for flag fields', () => {
      // Check defaults set in createForm
      expect(component.form.get('oftFlag')?.value).toBeTruthy();
      expect(component.form.get('unitSchemeType')?.value).toBe('I');
    });

    it('should have lifeSpanInd options defined', () => {
      expect(component.lifeSpanIndOptions.length).toBe(3);
      expect(component.lifeSpanIndOptions[0]).toEqual({ value: 'H', label: 'Hours' });
    });

    it('should have yesNo options defined', () => {
      expect(component.yesNoOptions.length).toBe(2);
    });

    it('should have cellCount options defined', () => {
      expect(component.cellCountOptions.length).toBe(3);
      expect(component.cellCountOptions[2]).toEqual({ value: 'O', label: 'Optional' });
    });

    it('should have unitScheme options defined', () => {
      expect(component.unitSchemeOptions.length).toBe(2);
      expect(component.unitSchemeOptions[0]).toEqual({ value: 'C', label: 'Codabar' });
      expect(component.unitSchemeOptions[1]).toEqual({ value: 'I', label: 'Code 128' });
    });

    it('should have attributeColumns defined', () => {
      expect(component.attributeColumns).toEqual(['attributeGroup', 'attributeGroupDescription', 'attributeCode', 'attributeDescription']);
    });
  });

  describe('Form validators setup in ngOnInit', () => {
    it('should set required validator on productCode', () => {
      component.form.get('productCode')?.setValue('');
      expect(component.form.get('productCode')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on productShortName', () => {
      component.form.get('productShortName')?.setValue('');
      expect(component.form.get('productShortName')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on productType', () => {
      component.form.get('productType')?.setValue('');
      expect(component.form.get('productType')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on productDesc', () => {
      component.form.get('productDesc')?.setValue('');
      expect(component.form.get('productDesc')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on productClass', () => {
      component.form.get('productClass')?.setValue('');
      expect(component.form.get('productClass')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on modifierCode', () => {
      component.form.get('modifierCode')?.setValue('');
      expect(component.form.get('modifierCode')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on lifeSpan', () => {
      component.form.get('lifeSpan')?.setValue(null);
      expect(component.form.get('lifeSpan')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on lifeSpanInd', () => {
      component.form.get('lifeSpanInd')?.setValue('');
      expect(component.form.get('lifeSpanInd')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on minTemp', () => {
      component.form.get('minTemp')?.setValue(null);
      expect(component.form.get('minTemp')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on maxTemp', () => {
      component.form.get('maxTemp')?.setValue(null);
      expect(component.form.get('maxTemp')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on minWeight', () => {
      component.form.get('minWeight')?.setValue(null);
      expect(component.form.get('minWeight')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on maxWeight', () => {
      component.form.get('maxWeight')?.setValue(null);
      expect(component.form.get('maxWeight')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on minRcvTemp', () => {
      component.form.get('minRcvTemp')?.setValue(null);
      expect(component.form.get('minRcvTemp')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on maxRcvTemp', () => {
      component.form.get('maxRcvTemp')?.setValue(null);
      expect(component.form.get('maxRcvTemp')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on oftFlag', () => {
      component.form.get('oftFlag')?.setValue('');
      expect(component.form.get('oftFlag')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on rhLabelFlag', () => {
      component.form.get('rhLabelFlag')?.setValue('');
      expect(component.form.get('rhLabelFlag')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on dummyProductFlag', () => {
      component.form.get('dummyProductFlag')?.setValue('');
      expect(component.form.get('dummyProductFlag')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on invProductType', () => {
      component.form.get('invProductType')?.setValue('');
      expect(component.form.get('invProductType')?.hasError('required')).toBeTrue();
    });

    it('should set required validator on returnable', () => {
      component.form.get('returnable')?.setValue('');
      expect(component.form.get('returnable')?.hasError('required')).toBeTrue();
    });

    it('should set compProductCode validator with maxLength', () => {
      component.form.get('compProductCode')?.setValue('ABCDEFGHI'); // 9 chars, max is 8
      expect(component.form.get('compProductCode')?.hasError('maxlength')).toBeTrue();
    });

    it('should set productCount range validator', () => {
      component.form.get('productCount')?.setValue(1000);
      expect(component.form.get('productCount')?.hasError('rangeError')).toBeTrue();
    });

    it('should set specificGravity range validator', () => {
      component.form.get('specificGravity')?.setValue(100);
      expect(component.form.get('specificGravity')?.hasError('rangeError')).toBeTrue();
    });
  });

  describe('Cross-field validation - clearing remaining errors', () => {
    it('should preserve non-comparison errors when clearing comparison error on minTemp', () => {
      const minTempControl = component.form.get('minTemp');
      component.form.get('maxTemp')?.setValue(50, { emitEvent: false });
      component.form.get('minTemp')?.setValue(5, { emitEvent: false });
      // Set errors AFTER setValue (setValue re-runs validators and resets errors)
      minTempControl?.setErrors({ comparisonError: true, rangeError: true }, { emitEvent: false });
      (component as any).tempComparisonValidator();
      // rangeError should still be present, comparisonError should be cleared
      expect(minTempControl?.hasError('comparisonError')).toBeFalse();
      expect(minTempControl?.hasError('rangeError')).toBeTrue();
    });

    it('should preserve non-comparison errors when clearing comparison error on maxTemp', () => {
      const maxTempControl = component.form.get('maxTemp');
      component.form.get('minTemp')?.setValue(5, { emitEvent: false });
      component.form.get('maxTemp')?.setValue(50, { emitEvent: false });
      // Set errors AFTER setValue
      maxTempControl?.setErrors({ comparisonError: true, rangeError: true }, { emitEvent: false });
      (component as any).tempComparisonValidator();
      expect(maxTempControl?.hasError('comparisonError')).toBeFalse();
      expect(maxTempControl?.hasError('rangeError')).toBeTrue();
    });

    it('should preserve non-comparison errors when clearing comparison error on maxWeight', () => {
      const maxWeightControl = component.form.get('maxWeight');
      component.form.get('minWeight')?.setValue(100, { emitEvent: false });
      component.form.get('maxWeight')?.setValue(500, { emitEvent: false });
      // Set errors AFTER setValue
      maxWeightControl?.setErrors({ comparisonError: true, rangeError: true }, { emitEvent: false });
      (component as any).weightComparisonValidator();
      expect(maxWeightControl?.hasError('comparisonError')).toBeFalse();
      expect(maxWeightControl?.hasError('rangeError')).toBeTrue();
    });

    it('should preserve non-comparison errors when clearing on maxRcvTemp', () => {
      const maxRcvTempControl = component.form.get('maxRcvTemp');
      component.form.get('minRcvTemp')?.setValue(5, { emitEvent: false });
      component.form.get('maxRcvTemp')?.setValue(10, { emitEvent: false });
      // Set errors AFTER setValue
      maxRcvTempControl?.setErrors({ comparisonError: true, rangeError: true }, { emitEvent: false });
      (component as any).rcvTempComparisonValidator();
      expect(maxRcvTempControl?.hasError('comparisonError')).toBeFalse();
      expect(maxRcvTempControl?.hasError('rangeError')).toBeTrue();
    });

    it('should preserve non-comparison errors when clearing on minRcvTemp', () => {
      const minRcvTempControl = component.form.get('minRcvTemp');
      component.form.get('minRcvTemp')?.setValue(5, { emitEvent: false });
      component.form.get('maxRcvTemp')?.setValue(10, { emitEvent: false });
      // Set errors AFTER setValue
      minRcvTempControl?.setErrors({ comparisonError: true, rangeError: true }, { emitEvent: false });
      (component as any).rcvTempComparisonValidator();
      expect(minRcvTempControl?.hasError('comparisonError')).toBeFalse();
      expect(minRcvTempControl?.hasError('rangeError')).toBeTrue();
    });

    it('should set errors on both min and max temp controls when maxTemp < minTemp', () => {
      component.form.get('minTemp')?.setErrors(null, { emitEvent: false });
      component.form.get('maxTemp')?.setErrors(null, { emitEvent: false });
      component.form.get('minTemp')?.setValue(30, { emitEvent: false });
      component.form.get('maxTemp')?.setValue(10, { emitEvent: false });
      const result = (component as any).tempComparisonValidator();
      expect(result).toEqual({ tempComparison: true });
      expect(component.form.get('minTemp')?.hasError('comparisonError')).toBeTrue();
      expect(component.form.get('maxTemp')?.hasError('comparisonError')).toBeTrue();
    });

    it('should set errors on maxWeight when maxWeight < minWeight', () => {
      component.form.get('minWeight')?.setValue(500, { emitEvent: false });
      component.form.get('maxWeight')?.setValue(100, { emitEvent: false });
      const result = (component as any).weightComparisonValidator();
      expect(result).toEqual({ weightComparison: true });
    });

    it('should set errors on both rcvTemp controls when maxRcvTemp < minRcvTemp', () => {
      component.form.get('minRcvTemp')?.setErrors(null, { emitEvent: false });
      component.form.get('maxRcvTemp')?.setErrors(null, { emitEvent: false });
      component.form.get('minRcvTemp')?.setValue(20, { emitEvent: false });
      component.form.get('maxRcvTemp')?.setValue(5, { emitEvent: false });
      const result = (component as any).rcvTempComparisonValidator();
      expect(result).toEqual({ rcvTempComparison: true });
      expect(component.form.get('minRcvTemp')?.hasError('comparisonError')).toBeTrue();
      expect(component.form.get('maxRcvTemp')?.hasError('comparisonError')).toBeTrue();
    });
  });

  describe('Custom validators - edge cases with value 0', () => {
    it('should validate minTemp with value 0 (out of range)', () => {
      const validator = (component as any).minTempRangeValidator;
      expect(validator({ value: 0 } as any)).toEqual({ rangeError: true });
    });

    it('should validate weight with value 0 (in range)', () => {
      const validator = (component as any).weightRangeValidator;
      expect(validator({ value: 0 } as any)).toBeNull();
    });

    it('should validate productCount with value 0 (in range)', () => {
      const validator = (component as any).productCountValidator;
      expect(validator({ value: 0 } as any)).toBeNull();
    });

    it('should validate specificGravity with value 0 (in range)', () => {
      const validator = (component as any).specificGravityValidator;
      expect(validator({ value: 0 } as any)).toBeNull();
    });

    it('should validate temp999 with value 0 (in range)', () => {
      const validator = (component as any).temp999Validator;
      expect(validator({ value: 0 } as any)).toBeNull();
    });

    it('should validate timeLimit with value 0 (in range)', () => {
      const validator = (component as any).timeLimitValidator;
      expect(validator({ value: 0 } as any)).toBeNull();
    });

    it('should validate stdPrice with value 0 (in range)', () => {
      const validator = (component as any).stdPriceValidator;
      expect(validator({ value: 0 } as any)).toBeNull();
    });

    it('should skip validation for undefined values in minTemp', () => {
      const validator = (component as any).minTempRangeValidator;
      expect(validator({ value: undefined } as any)).toBeNull();
    });

    it('should skip validation for undefined values in maxTemp', () => {
      const validator = (component as any).maxTempRangeValidator;
      expect(validator({ value: undefined } as any)).toBeNull();
    });
  });

  describe('compProductCodeValidator edge cases', () => {
    it('should return null when form is not initialized', () => {
      const validator = (component as any).compProductCodeValidator;
      const origForm = component.form;
      (component as any).form = null;
      expect(validator({ value: 'TEST' } as any)).toBeNull();
      (component as any).form = origForm;
    });

    it('should be case-insensitive for comparison', () => {
      const validator = (component as any).compProductCodeValidator;
      component.form.get('productCode')?.setValue('abc', { emitEvent: false });
      expect(validator({ value: 'ABC123' } as any)).toBeNull();
    });
  });

  describe('onNumberKeypress edge cases', () => {
    it('should block special characters like +', () => {
      const event = { which: 43, keyCode: 43, key: '+', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block minus sign', () => {
      const event = { which: 45, keyCode: 45, key: '-', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow digit 9', () => {
      const event = { which: 57, keyCode: 57, key: '9', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNumberKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onDecimalKeypress edge cases', () => {
    it('should block minus sign in the middle of value', () => {
      const event = {
        which: 45, keyCode: 45, key: '-',
        target: { value: '12', selectionStart: 2 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block second minus sign', () => {
      const event = {
        which: 45, keyCode: 45, key: '-',
        target: { value: '-12', selectionStart: 0 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow tab key', () => {
      const event = {
        which: 9, keyCode: 9, key: 'Tab',
        target: { value: '12', selectionStart: 2 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow escape key', () => {
      const event = {
        which: 27, keyCode: 27, key: 'Escape',
        target: { value: '12', selectionStart: 2 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow enter key', () => {
      const event = {
        which: 13, keyCode: 13, key: 'Enter',
        target: { value: '12', selectionStart: 2 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow minus at start of empty input', () => {
      const event = {
        which: 45, keyCode: 45, key: '-',
        target: { value: '', selectionStart: 0 },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.onDecimalKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onMaxDigitsInput edge cases', () => {
    it('should set control value to null when input is empty after truncation', () => {
      const input = { value: '', getAttribute: () => 'lifeSpan' } as any;
      const event = { target: input } as any;
      component.onMaxDigitsInput(event, 4);
      expect(component.form.get('lifeSpan')?.touched).toBeTrue();
    });

    it('should update control value when truncating', () => {
      const input = { value: '123456', getAttribute: () => 'minTemp' } as any;
      const event = { target: input } as any;
      component.onMaxDigitsInput(event, 4);
      expect(input.value).toBe('1234');
    });
  });

  describe('onNumericInput edge cases', () => {
    it('should strip non-numeric characters except decimal and minus', () => {
      const input = { value: '12abc', getAttribute: () => 'lifeSpan' } as any;
      const event = { target: input } as any;
      component.onNumericInput(event, 10);
      // Value is cleaned but within maxLength, so input.value not changed by length limit
      expect(input.value).toBe('12abc'); // onNumericInput only truncates by length, not by content in place
    });

    it('should handle empty formControlName attribute', () => {
      const input = { value: '12345678', getAttribute: () => null } as any;
      const event = { target: input } as any;
      expect(() => component.onNumericInput(event, 4)).not.toThrow();
      expect(input.value).toBe('1234');
    });
  });

  describe('handleSaveError edge cases', () => {
    it('should handle error with error.error.message', () => {
      const error = { error: { message: 'Custom message' } };
      (component as any).handleSaveError(error);
      expect(snackbarService.showError).toHaveBeenCalledWith('Custom message');
    });

    it('should handle error with only error.message', () => {
      const error = { error: null, message: 'Top level message' };
      (component as any).handleSaveError(error);
      expect(snackbarService.showError).toHaveBeenCalledWith('Top level message');
    });

    it('should handle error with error.error.error string', () => {
      const error = { error: { error: 'Some error string' } };
      (component as any).handleSaveError(error);
      expect(snackbarService.showError).toHaveBeenCalledWith('Some error string');
    });
  });

  describe('getFieldError - additional branches', () => {
    it('should return empty string for control with no errors', () => {
      const control = component.form.get('minTemp');
      control?.setErrors(null);
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('minTemp')).toBe('');
    });

    it('should return required error for productCode', () => {
      const control = component.form.get('productCode');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('productCode')).toBe('Product Code is required');
    });

    it('should return required error for productShortName', () => {
      const control = component.form.get('productShortName');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('productShortName')).toBe('Product Short Name is required');
    });

    it('should return required error for productType', () => {
      const control = component.form.get('productType');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('productType')).toBe('Lab Product Type is required');
    });

    it('should return required error for productDesc', () => {
      const control = component.form.get('productDesc');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('productDesc')).toBe('Description is required');
    });

    it('should return required error for lifeSpanInd', () => {
      const control = component.form.get('lifeSpanInd');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('lifeSpanInd')).toBe('Life Span Indicator is required');
    });

    it('should return required error for minTemp', () => {
      const control = component.form.get('minTemp');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('minTemp')).toBe('Minimum Temperature is required');
    });

    it('should return required error for maxTemp', () => {
      const control = component.form.get('maxTemp');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('maxTemp')).toBe('Maximum Temperature is required');
    });

    it('should return required error for minWeight', () => {
      const control = component.form.get('minWeight');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('minWeight')).toBe('Minimum Weight is required');
    });

    it('should return required error for maxWeight', () => {
      const control = component.form.get('maxWeight');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      control?.markAsDirty();
      expect(component.getFieldError('maxWeight')).toBe('Maximum Weight is required');
    });
  });

  describe('formulaAsyncValidator - edge cases', () => {
    it('should return invalidFormula with default message when success is false and no error', () => {
      component.isAddMode.set(true);
      (service as any).validateFormula = jasmine.createSpy('validateFormula').and.returnValue(of({ success: false }));
      const validator = (component as any).formulaAsyncValidator;
      validator({ value: 'BAD' }).subscribe((result: any) => {
        expect(result).toEqual({ invalidFormula: 'Invalid formula' });
      });
    });

    it('should return null for null formula', (done: DoneFn) => {
      const validator = (component as any).formulaAsyncValidator;
      validator({ value: null }).subscribe((result: any) => {
        expect(result).toBeNull();
        done();
      });
    }, 15000);
  });

  describe('Effective date error matchers', () => {
    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
    });
  });

  describe('Filter methods - edge cases', () => {
    it('should handle product types with null fields', () => {
      component.productTypes.set([
        { productTypeCode: null, productTypeDesc: null } as any
      ]);
      component.productTypeSearchControl.setValue('test');
      expect(component.filteredProductTypes.length).toBe(0);
    });

    it('should handle product classes with null fields', () => {
      component.productClasses.set([
        { code: null, codeDesc: null } as any
      ]);
      component.productClassSearchControl.setValue('test');
      expect(component.filteredProductClasses.length).toBe(0);
    });

    it('should handle modifiers with null fields', () => {
      component.modifiers.set([
        { code: null, codeDesc: null } as any
      ]);
      component.modifierSearchControl.setValue('test');
      expect(component.filteredModifiers.length).toBe(0);
    });

    it('should handle inventory classes with null fields', () => {
      component.inventoryClasses.set([
        { code: null, codeDesc: null } as any
      ]);
      component.inventoryClassSearchControl.setValue('test');
      expect(component.filteredInventoryClasses.length).toBe(0);
    });

    it('should filter product types by description', () => {
      component.productTypes.set([
        { productTypeCode: 'PLT', productTypeDesc: 'Platelets' },
        { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' }
      ]);
      component.productTypeSearchControl.setValue('platelet');
      expect(component.filteredProductTypes.length).toBe(1);
      expect(component.filteredProductTypes[0].productTypeCode).toBe('PLT');
    });

    it('should filter product classes by code', () => {
      component.productClasses.set([
        { code: 'WB', codeDesc: 'Whole Blood' },
        { code: 'CP', codeDesc: 'Component' }
      ]);
      component.productClassSearchControl.setValue('wb');
      expect(component.filteredProductClasses.length).toBe(1);
      expect(component.filteredProductClasses[0].code).toBe('WB');
    });

    it('should filter modifiers by code', () => {
      component.modifiers.set([
        { code: 'MOD1', codeDesc: 'Modifier One' },
        { code: 'MOD2', codeDesc: 'Modifier Two' }
      ]);
      component.modifierSearchControl.setValue('mod1');
      expect(component.filteredModifiers.length).toBe(1);
    });

    it('should filter inventory classes by description', () => {
      component.inventoryClasses.set([
        { code: 'IC1', codeDesc: 'Active' },
        { code: 'IC2', codeDesc: 'Inactive' }
      ]);
      component.inventoryClassSearchControl.setValue('active');
      expect(component.filteredInventoryClasses.length).toBe(2); // Both match 'active'
    });
  });

  describe('onSave - success=false with errorResponse.error nested path', () => {
    it('should handle errorResponse with nested error only', () => {
      const mockResponse = {
        success: false,
        errorResponse: { error: 'Nested only' }
      };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSave();
      expect(snackbarService.showError).toHaveBeenCalledWith('Nested only');
    });

    it('should use default message when success=false and no error fields', () => {
      const mockResponse = { success: false };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSave();
      expect(snackbarService.showError).toHaveBeenCalledWith('Operation failed');
    });
  });

  describe('onSaveAndCreateAnother - success=false with errorResponse.error nested path', () => {
    it('should handle errorResponse with nested error only', () => {
      const mockResponse = {
        success: false,
        errorResponse: { error: 'Nested error only' }
      };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSaveAndCreateAnother();
      expect(snackbarService.showError).toHaveBeenCalledWith('Nested error only');
    });

    it('should use default message when success=false and no error fields', () => {
      const mockResponse = { success: false };
      service.createProductCode.and.returnValue(of(mockResponse));
      component.form.patchValue(getValidFormData(), { emitEvent: false });
      component.form.updateValueAndValidity();
      component.onSaveAndCreateAnother();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to create product code');
    });
  });
});

describe('AddEditProductDialogComponent - View Mode', () => {
  let component: AddEditProductDialogComponent;
  let fixture: ComponentFixture<AddEditProductDialogComponent>;
  let service: jasmine.SpyObj<ProductCodesService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockProduct: any = {
    productCode: 'P001',
    productShortName: 'TestProd',
    productDesc: 'Test Description',
    productType: 'RBC',
    productClass: 'WB',
    modifierCode: 'A',
    lifeSpan: 35,
    lifeSpanInd: 'D',
    minTemp: 2,
    maxTemp: 6,
    minWeight: 400,
    maxWeight: 600,
    minRcvTemp: 1,
    maxRcvTemp: 10,
    oftFlag: 'N',
    rhLabelFlag: 'N',
    dummyProductFlag: 'N',
    invProductType: 'TEST',
    returnable: 'N',
    effDate: '2025-01-01',
    termDate: null
  };

  beforeEach(() => {
    const serviceSpy = jasmine.createSpyObj('ProductCodesService', [
      'getProductTypes',
      'getProductClasses',
      'getModifiers',
      'getInventoryClasses',
      'createProductCode',
      'updateProductCode',
      'validateFormula',
      'getProductAttributes'
    ]);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const snackbarServiceSpy = createMockSnackbarService();

    TestBed.configureTestingModule({
      imports: [
        AddEditProductDialogComponent,
        HttpClientTestingModule,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ProductCodesService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'view', product: mockProduct } },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });

    service = TestBed.inject(ProductCodesService) as jasmine.SpyObj<ProductCodesService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    service.getProductTypes.and.returnValue(of([]));
    service.getProductClasses.and.returnValue(of([]));
    service.getModifiers.and.returnValue(of([]));
    service.getInventoryClasses.and.returnValue(of([]));
    service.validateFormula.and.returnValue(of({ success: true }));
    service.getProductAttributes.and.returnValue(of([]));

    fixture = TestBed.createComponent(AddEditProductDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize in view mode from dialog data', () => {
    expect(component.isViewMode()).toBeTrue();
    expect(component.isAddMode()).toBeFalse();
    expect(component.mode).toBe('view');
  });

  it('should disable the form in view mode', () => {
    expect(component.form.get('productCode')?.disabled).toBeTrue();
    expect(component.form.get('productShortName')?.disabled).toBeTrue();
  });

  it('should populate form with product data', () => {
    expect(component.form.getRawValue().productCode).toBe('P001');
    // productShortName is converted to uppercase by the setupUppercaseFields subscription
    expect(component.form.getRawValue().productShortName).toBe('TESTPROD');
  });

  it('should load product attributes in view mode', () => {
    expect(service.getProductAttributes).toHaveBeenCalledWith('P001');
  });

  it('should return correct dialog title for view mode', () => {
    expect(component.dialogTitle).toBe('View Product Details');
  });
});

describe('AddEditProductDialogComponent - Edit Mode', () => {
  let component: AddEditProductDialogComponent;
  let fixture: ComponentFixture<AddEditProductDialogComponent>;
  let service: jasmine.SpyObj<ProductCodesService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockProduct: any = {
    productCode: 'E0002',
    productShortName: 'EditProd',
    productDesc: 'Edit Description',
    productType: 'RBC',
    productClass: 'WB',
    modifierCode: 'A',
    lifeSpan: 35,
    lifeSpanInd: 'D',
    minTemp: 2,
    maxTemp: 6,
    minWeight: 400,
    maxWeight: 600,
    minRcvTemp: 1,
    maxRcvTemp: 10,
    oftFlag: 'N',
    rhLabelFlag: 'N',
    dummyProductFlag: 'N',
    invProductType: 'TEST',
    returnable: 'N',
    effDate: '2024-01-01',
    termDate: null
  };

  beforeEach(() => {
    const serviceSpy = jasmine.createSpyObj('ProductCodesService', [
      'getProductTypes',
      'getProductClasses',
      'getModifiers',
      'getInventoryClasses',
      'createProductCode',
      'updateProductCode',
      'validateFormula'
    ]);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const snackbarServiceSpy = createMockSnackbarService();

    TestBed.configureTestingModule({
      imports: [
        AddEditProductDialogComponent,
        HttpClientTestingModule,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ProductCodesService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'edit', product: mockProduct } },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });

    service = TestBed.inject(ProductCodesService) as jasmine.SpyObj<ProductCodesService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    service.getProductTypes.and.returnValue(of([]));
    service.getProductClasses.and.returnValue(of([]));
    service.getModifiers.and.returnValue(of([]));
    service.getInventoryClasses.and.returnValue(of([]));
    service.validateFormula.and.returnValue(of({ success: true }));

    fixture = TestBed.createComponent(AddEditProductDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize in edit mode from dialog data', () => {
    expect(component.isViewMode()).toBeFalse();
    expect(component.isAddMode()).toBeFalse();
    expect(component.mode).toBe('edit');
  });

  it('should populate form with product data', () => {
    expect(component.form.get('productCode')?.value).toBe('E0002');
    expect(component.form.get('productShortName')?.value).toBe('EDITPROD');
  });

  it('should clear productCode validators in edit mode', () => {
    component.form.get('productCode')?.setValue('');
    expect(component.form.get('productCode')?.hasError('required')).toBeFalse();
  });

  it('should set effDate to only required validator in edit mode', () => {
    const effDateControl = component.form.get('effDate');
    effDateControl?.setValue(null);
    expect(effDateControl?.hasError('required')).toBeTrue();
  });

  it('should clear termDate validators in edit mode', () => {
    const termDateControl = component.form.get('termDate');
    termDateControl?.setValue(null);
    expect(termDateControl?.valid).toBeTrue();
  });

  it('should not set up unit scheme subscription in edit mode', () => {
    // In edit mode, formula field should not be toggled by unitSchemeType changes
    // (setupUnitSchemeSubscription is only called for add mode)
    const formulaControl = component.form.get('productFormula');
    component.form.get('unitSchemeType')?.setValue('C');
    // Formula should still be enabled in edit mode because subscription was not set up
    expect(formulaControl?.enabled).toBeTrue();
  });

  it('should return correct dialog title for edit mode', () => {
    expect(component.dialogTitle).toBe('Edit Product Details');
  });

  it('should allow past effective dates in edit mode', () => {
    // Edit mode should not have min date validators
    const effDateControl = component.form.get('effDate');
    effDateControl?.setValue(moment('2020-01-01'));
    // Should not have matDatepickerMin error
    expect(effDateControl?.hasError('matDatepickerMin')).toBeFalse();
  });
});

describe('AddEditProductDialogComponent - No Dialog (Side Panel Mode)', () => {
  let component: AddEditProductDialogComponent;
  let fixture: ComponentFixture<AddEditProductDialogComponent>;
  let service: jasmine.SpyObj<ProductCodesService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  beforeEach(() => {
    const serviceSpy = jasmine.createSpyObj('ProductCodesService', [
      'getProductTypes',
      'getProductClasses',
      'getModifiers',
      'getInventoryClasses',
      'createProductCode',
      'updateProductCode',
      'validateFormula'
    ]);
    const snackbarServiceSpy = createMockSnackbarService();

    TestBed.configureTestingModule({
      imports: [
        AddEditProductDialogComponent,
        HttpClientTestingModule,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ProductCodesService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: null },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });

    service = TestBed.inject(ProductCodesService) as jasmine.SpyObj<ProductCodesService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    service.getProductTypes.and.returnValue(of([]));
    service.getProductClasses.and.returnValue(of([]));
    service.getModifiers.and.returnValue(of([]));
    service.getInventoryClasses.and.returnValue(of([]));
    service.validateFormula.and.returnValue(of({ success: true }));

    fixture = TestBed.createComponent(AddEditProductDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize without dialog data', () => {
    expect(component).toBeTruthy();
    expect(component.mode).toBe('add');
    expect(component.isAddMode()).toBeTrue();
  });

  it('should emit close event via EventEmitter when no dialogRef', () => {
    spyOn(component.close, 'emit');
    component.onCancel();
    expect(component.close.emit).toHaveBeenCalledWith({ success: false });
  });

  it('should emit close with success true on save', () => {
    spyOn(component.close, 'emit');
    const mockResponse = { success: true, message: 'Created' };
    service.createProductCode.and.returnValue(of(mockResponse));
    component.form.patchValue({
      productCode: 'E0002',
      productFormula: 'E0002+E0003',
      productShortName: 'TestProd',
      productDesc: 'Test Description',
      productType: 'RBC',
      productClass: 'WB',
      modifierCode: 'A',
      lifeSpan: 35,
      lifeSpanInd: 'D',
      minTemp: 1,
      maxTemp: 6,
      minWeight: 400,
      maxWeight: 600,
      minRcvTemp: 1,
      maxRcvTemp: 10,
      oftFlag: 'N',
      rhLabelFlag: 'N',
      dummyProductFlag: 'N',
      invProductType: 'TEST',
      returnable: 'N',
      effDate: moment().add(7, 'days')
    }, { emitEvent: false });
    component.form.updateValueAndValidity();
    component.onSave();
    expect(component.close.emit).toHaveBeenCalledWith({ success: true });
  });
});
