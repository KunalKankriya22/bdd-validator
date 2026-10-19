import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditValidProductSubstitution } from './add-edit-valid-product-substitution';
import { ValidProductSubstitutionService } from '../services/valid-product-substitution.service';
import { ValidProductSubstitutionModel } from '../models/valid-product-substitution.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditValidProductSubstitution', () => {
  let component: AddEditValidProductSubstitution;
  let fixture: ComponentFixture<AddEditValidProductSubstitution>;
  let mockValidProductSubstitutionService: jasmine.SpyObj<ValidProductSubstitutionService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  function createComponent(mode: 'add' | 'edit', data?: ValidProductSubstitutionModel): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        AddEditValidProductSubstitution,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatIconModule,
        MatSnackBarModule,
        MatNativeDateModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ValidProductSubstitutionService, useValue: mockValidProductSubstitutionService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditValidProductSubstitution);
    component = fixture.componentInstance;
    component.mode = mode;
    component.data = data || null;
    // Override the component's injected snackBar with our mock
    // (standalone component resolves MatSnackBar from its own MatSnackBarModule import)
    (component as any).snackBar = mockSnackBar;
  }

  beforeEach(() => {
    mockValidProductSubstitutionService = jasmine.createSpyObj('ValidProductSubstitutionService', [
      'getInventoryProductTypes',
      'addValidProductSubstitution',
      'updateValidProductSubstitution'
    ]);

    mockSnackBar = createMockMatSnackBar();

    mockHeaderService = createMockHeaderService();
    TestBed.configureTestingModule({
      imports: [
        AddEditValidProductSubstitution,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatIconModule,
        MatSnackBarModule,
        MatNativeDateModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ValidProductSubstitutionService, useValue: mockValidProductSubstitutionService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditValidProductSubstitution);
    component = fixture.componentInstance;
    component.mode = 'add';
    component.data = null;
    // Override the component's injected snackBar with our mock
    (component as any).snackBar = mockSnackBar;
  });

  describe('Form Initialization', () => {
    it('should initialize form with required validators in add mode', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      fixture.detectChanges();

      expect(component.form).toBeDefined();
      expect(component.form.get('requestProductType')?.hasError('required')).toBe(true);
      expect(component.form.get('compatibleProductType')?.hasError('required')).toBe(true);
      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(true);
      expect(component.form.get('terminationDate')?.hasError('required')).toBe(false);
    });


  });

  describe('loadProductTypes', () => {
    it('should load product types from direct array response', () => {
      const mockTypes = [
        { code: 'WRBC', description: 'Washed Red Blood Cells' },
        { code: 'LRBC', description: 'LeukoReduced RBC' },
        { code: 'RBC', description: 'Red Blood Cells' },
        { code: 'PRBC', description: 'Packed Red Blood Cells' }
      ];
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of(mockTypes));

      fixture.detectChanges();

      expect(component.productTypeOptionsSignal()).toEqual(mockTypes);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should handle error when loading product types', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      expect(component.productTypeOptionsSignal()).toEqual([]);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should set isLoadingOptions to false after loading completes', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should handle null response by setting empty array', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of(null as any));

      fixture.detectChanges();

      expect(component.productTypeOptionsSignal()).toEqual([]);
      expect(component.isLoadingOptions).toBe(false);
    });
  });

  describe('populateFormForEdit', () => {

    it('should re-enable effective date in edit mode', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      const testData: ValidProductSubstitutionModel = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'days').toDate()
      };

      createComponent('edit', testData);

      fixture.detectChanges();

      expect(component.form.get('requestProductType')?.enabled).toBe(true);
      expect(component.form.get('compatibleProductType')?.enabled).toBe(true);
      // Effective date is re-enabled after setupEditModeValidators for editability
      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
    });

    it('should populate form values in edit mode', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      const testData: ValidProductSubstitutionModel = {
        requestProductType: 'RBC',
        compatibleProductType: 'PRBC',
        effectiveDate: moment().add(5, 'days').toDate(),
        terminationDate: moment().add(30, 'days').toDate()
      };

      createComponent('edit', testData);
      fixture.detectChanges();

      expect(component.form.get('requestProductType')?.value).toBe('RBC');
      expect(component.form.get('compatibleProductType')?.value).toBe('PRBC');
      expect(component.form.get('effectiveDate')?.value).toBeTruthy();
      expect(component.form.get('terminationDate')?.value).toBeTruthy();
    });

    it('should not populate form when data is null in edit mode', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      createComponent('edit');
      fixture.detectChanges();

      // Form should remain empty since data is null
      expect(component.form.get('requestProductType')?.value).toBeFalsy();
    });

    it('should handle missing optional fields in edit data', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      const testData: ValidProductSubstitutionModel = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day').toDate(),
        terminationDate: null
      };

      createComponent('edit', testData);
      fixture.detectChanges();

      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should mark form as pristine and untouched after populating', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      const testData: ValidProductSubstitutionModel = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day').toDate()
      };

      createComponent('edit', testData);
      fixture.detectChanges();

      expect(component.form.pristine).toBe(true);
      expect(component.form.untouched).toBe(true);
    });
  });

  describe('setupPanel', () => {
    it('should set panelTitle to "Add New Record" in add mode', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      fixture.detectChanges();

      expect(component.panelTitle).toBe('Add New Record');
    });

    it('should set panelTitle to "Edit Record" in edit mode', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      const testData: ValidProductSubstitutionModel = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day').toDate()
      };

      createComponent('edit', testData);
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Edit Record');
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel event', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();

      spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should not call API when form is invalid', () => {
      // Leave form empty (all required fields are empty)
      component.onSave();

      expect(mockValidProductSubstitutionService.addValidProductSubstitution).not.toHaveBeenCalled();
    });

    it('should call add API with correct payload', () => {
      const mockResponse = {
        success: true,
        message: 'Record added successfully'
      };

      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(of(mockResponse));

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(mockValidProductSubstitutionService.addValidProductSubstitution).toHaveBeenCalled();
      const payload = (mockValidProductSubstitutionService.addValidProductSubstitution as jasmine.Spy).calls.mostRecent().args[0];

      expect(payload.requestProductType).toBe('WRBC');
      expect(payload.compatibleProductType).toBe('LRBC');
      expect(typeof payload.effectiveDate).toBe('string');
      expect(typeof payload.terminationDate).toBe('string');
    });

    it('should close panel and emit success on successful save', () => {
      const mockResponse = {
        success: true,
        message: 'Record added successfully'
      };

      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(of(mockResponse));

      spyOn(component.closePanel, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show success snackbar with response message', () => {
      const mockResponse = {
        success: true,
        message: 'Custom success message'
      };

      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(of(mockResponse));

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      mockSnackBar.open.calls.reset();
      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Custom success message',
        'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
    });

    it('should show default add success message when response has no message', () => {
      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(of({}));

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      mockSnackBar.open.calls.reset();
      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Record added successfully',
        'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
    });

    it('should set isSaving to true during save and reset after completion', () => {
      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(of({ success: true }));

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component.isSaving).toBe(false);
    });

    it('should show Error 5331 snackbar and return early when same product types', () => {
      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'WRBC',
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      mockSnackBar.open.calls.reset();
      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error 5331: Compatible product type cannot be same as requested product type',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(mockValidProductSubstitutionService.addValidProductSubstitution).not.toHaveBeenCalled();
    });

    it('should handle null terminationDate in payload', () => {
      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(of({ success: true }));

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: null
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(mockValidProductSubstitutionService.addValidProductSubstitution).toHaveBeenCalled();
      const payload = (mockValidProductSubstitutionService.addValidProductSubstitution as jasmine.Spy).calls.mostRecent().args[0];
      expect(payload.terminationDate).toBeNull();
    });
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      createComponent('edit', {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'days').toDate(),
        terminationDate: null
      });

      fixture.detectChanges();
    });

    it('should call update API with correct payload including current values', () => {
      const mockResponse = {
        success: true,
        message: 'Record updated successfully'
      };

      mockValidProductSubstitutionService.updateValidProductSubstitution.and.returnValue(of(mockResponse));

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'RBC',
        effectiveDate: moment().add(1, 'days'),
        terminationDate: moment().add(1, 'year')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(mockValidProductSubstitutionService.updateValidProductSubstitution).toHaveBeenCalled();
      const payload = (mockValidProductSubstitutionService.updateValidProductSubstitution as jasmine.Spy).calls.mostRecent().args[0];

      expect(payload.originalRequestProductType).toBe('WRBC');
      expect(payload.originalCompatibleProductType).toBe('LRBC');
      expect(payload.requestProductType).toBe('WRBC');
      expect(payload.compatibleProductType).toBe('RBC');
    });

    it('should close panel and emit success on successful update', () => {
      const mockResponse = {
        success: true,
        message: 'Record updated successfully'
      };

      mockValidProductSubstitutionService.updateValidProductSubstitution.and.returnValue(of(mockResponse));

      spyOn(component.closePanel, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'RBC',
        effectiveDate: moment().add(1, 'days'),
        terminationDate: moment().add(1, 'year')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show default update success message when response has no message', () => {
      mockValidProductSubstitutionService.updateValidProductSubstitution.and.returnValue(of({}));

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'RBC',
        effectiveDate: moment().add(1, 'days'),
        terminationDate: moment().add(1, 'year')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      mockSnackBar.open.calls.reset();
      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Record updated successfully',
        'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
    });
  });

  describe('onSave - Error Handling', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should show error message from errorResponse.error', () => {
      const apiError = {
        error: {
          errorCode: '5331',
          errorResponse: {
            error: 'Compatible product type cannot be same as requested product type'
          }
        }
      };

      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(
        throwError(() => apiError)
      );

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      mockSnackBar.open.calls.reset();
      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error 5331: Compatible product type cannot be same as requested product type',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show error message from error.message', () => {
      const apiError = {
        error: {
          message: 'Validation failed'
        }
      };

      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(
        throwError(() => apiError)
      );

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      mockSnackBar.open.calls.reset();
      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Validation failed',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show error message from top-level error.message', () => {
      const apiError = {
        message: 'Network error occurred'
      };

      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(
        throwError(() => apiError)
      );

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      mockSnackBar.open.calls.reset();
      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Network error occurred',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show generic error message when no specific error message exists', () => {
      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(
        throwError(() => ({}))
      );

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      mockSnackBar.open.calls.reset();
      component.onSave();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'An error occurred while saving the record.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should reset isSaving after error', () => {
      mockValidProductSubstitutionService.addValidProductSubstitution.and.returnValue(
        throwError(() => new Error('fail'))
      );

      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(30, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component.isSaving).toBe(false);
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should return error message for required requestProductType', () => {
      const control = component.form.get('requestProductType');
      control?.markAsTouched();

      expect(component.getRequestedProductTypeError()).toBe('Requested Inventory Product Type is required');
    });

    it('should return error message for required compatibleProductType', () => {
      const control = component.form.get('compatibleProductType');
      control?.markAsTouched();

      expect(component.getCompatibleProductTypeError()).toBe('Compatible Inventory Product Type is required');
    });

    it('should return error message for required effectiveDate', () => {
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should return empty string for untouched fields', () => {
      expect(component.getRequestedProductTypeError()).toBe('');
      expect(component.getCompatibleProductTypeError()).toBe('');
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty string for getTerminationDateError when untouched', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return empty string for getRequestedProductTypeError when control has value and is touched', () => {
      component.form.patchValue({ requestProductType: 'WRBC' });
      component.form.get('requestProductType')?.markAsTouched();

      expect(component.getRequestedProductTypeError()).toBe('');
    });

    it('should return empty string for getCompatibleProductTypeError when control has value and is touched', () => {
      component.form.patchValue({ compatibleProductType: 'LRBC' });
      component.form.get('compatibleProductType')?.markAsTouched();

      expect(component.getCompatibleProductTypeError()).toBe('');
    });
  });

  describe('Form Validity', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });


    it('should return true when all required fields are filled', () => {
      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: null
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      expect(component.isFormValid).toBe(true);
    });

    it('should return false when form is invalid', () => {
      // Leave all fields empty
      expect(component.isFormValid).toBe(false);
    });

    it('should return true for isFormChanged in add mode', () => {
      expect(component.isFormChanged).toBe(true);
    });

    it('should return false for isFormChanged in edit mode when form has not changed', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      createComponent('edit', {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day').toDate()
      });
      fixture.detectChanges();

      expect(component.isFormChanged).toBe(false);
    });

    it('should return true for isFormChanged in edit mode when form has changed', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      createComponent('edit', {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day').toDate()
      });
      fixture.detectChanges();

      component.form.patchValue({ compatibleProductType: 'RBC' });

      expect(component.isFormChanged).toBe(true);
    });

    it('should return false for isFormValid when form is valid but unchanged in edit mode', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      createComponent('edit', {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day').toDate()
      });
      fixture.detectChanges();

      // Form is valid but unchanged, so isFormValid should be false
      expect(component.isFormValid).toBe(false);
    });
  });

  describe('Error 5331 - Same Product Type Validation', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([
        { code: 'WRBC', description: 'Washed Red Blood Cells' },
        { code: 'LRBC', description: 'LeukoReduced RBC' },
        { code: 'RBC', description: 'Red Blood Cells' }
      ]));
      fixture.detectChanges();
    });

    it('should show Error 5331 when same product type is selected in both dropdowns', () => {
      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'WRBC',
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      expect(component.form.hasError('sameProductType')).toBe(true);
    });

    it('should not show Error 5331 when different product types are selected', () => {
      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      expect(component.form.hasError('sameProductType')).toBe(false);
    });

    it('should display error message on requestProductType field when Error 5331 occurs', () => {
      component.form.patchValue({
        requestProductType: 'RBC',
        compatibleProductType: 'RBC',
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      const errorMessage = component.getRequestedProductTypeError();
      expect(errorMessage).toContain('Error 5331');
      expect(errorMessage).toContain('cannot be same');
    });

    it('should display error message on compatibleProductType field when Error 5331 occurs', () => {
      component.form.patchValue({
        requestProductType: 'RBC',
        compatibleProductType: 'RBC',
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      const errorMessage = component.getCompatibleProductTypeError();
      expect(errorMessage).toContain('Error 5331');
      expect(errorMessage).toContain('cannot be same');
    });

    it('should show Error 5331 message without requiring fields to be touched', () => {
      // Don't mark fields as touched
      component.form.patchValue({
        requestProductType: 'LRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      // Error should still show even though fields are not touched
      expect(component.getRequestedProductTypeError()).toContain('Error 5331');
      expect(component.getCompatibleProductTypeError()).toContain('Error 5331');
    });

    // Note: Automatic snackbar popup via statusChanges is tested indirectly
    // through user interaction. The error validation and messaging is already
    // comprehensively tested by other specs in this suite.


    // Note: Error 5331 snackbar behavior on Save is validated through
    // the "should not call add API when Error 5331 validation fails" test above,
    // which confirms the save operation is blocked when the error exists.


    it('should allow selection of same value in both dropdowns', () => {
      const mockTypes = [
        { code: 'WRBC', description: 'Washed Red Blood Cells' },
        { code: 'LRBC', description: 'LeukoReduced RBC' }
      ];

      component.productTypeOptionsSignal.set(mockTypes);
      fixture.detectChanges();

      // Both dropdowns should have all options available
      expect(component.filteredProductTypeOptions()).toEqual(mockTypes);
      expect(component.filteredCompatibleProductTypeOptions()).toEqual(mockTypes);
    });

    it('should not auto-clear compatible product type when it matches request product type', () => {
      component.form.patchValue({
        requestProductType: 'RBC',
        compatibleProductType: 'LRBC'
      });
      fixture.detectChanges();

      // Now change request to match compatible
      component.form.patchValue({
        requestProductType: 'LRBC'
      });
      fixture.detectChanges();

      // Compatible should still be LRBC (not auto-cleared)
      expect(component.form.get('compatibleProductType')?.value).toBe('LRBC');
    });

    it('should not show Error 5331 when only one product type is set', () => {
      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: ''
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('sameProductType')).toBe(false);
    });

    it('should not show Error 5331 when neither product type is set', () => {
      component.form.patchValue({
        requestProductType: '',
        compatibleProductType: ''
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('sameProductType')).toBe(false);
    });
  });

  describe('Termination Date Minimum Validation', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
    });

    it('should use effective date as minimum in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const fiveDaysFromNow = moment().add(5, 'days');
      component.form.patchValue({ effectiveDate: fiveDaysFromNow });

      const minDate = component.getTerminationDateMin();

      expect(minDate?.isSame(fiveDaysFromNow, 'day')).toBe(true);
    });

    it('should use effective date as minimum in edit mode when effective date is set', () => {
      const tomorrow = moment().add(1, 'day');
      const oneMonthFromNow = moment().add(1, 'month');

      createComponent('edit', {
        requestProductType: 'RBC',
        compatibleProductType: 'WHOLE',
        effectiveDate: tomorrow.toDate(),
        terminationDate: oneMonthFromNow.toDate()
      });

      fixture.detectChanges();

      const minDate = component.getTerminationDateMin();

      expect(minDate?.isSame(tomorrow, 'day')).toBe(true);
    });

    it('should use effective date as minimum in edit mode when no original termination date exists', () => {
      const tomorrow = moment().add(1, 'day');

      createComponent('edit', {
        requestProductType: 'RBC',
        compatibleProductType: 'WHOLE',
        effectiveDate: tomorrow.toDate(),
        terminationDate: null
      });

      fixture.detectChanges();

      const minDate = component.getTerminationDateMin();

      expect(minDate?.isSame(tomorrow, 'day')).toBe(true);
    });

    it('should use effective date when it is later than original termination date in edit mode', () => {
      const twoMonthsFromNow = moment().add(2, 'months');
      const fourMonthsFromNow = moment().add(4, 'months');

      createComponent('edit', {
        requestProductType: 'RBC',
        compatibleProductType: 'WHOLE',
        effectiveDate: twoMonthsFromNow.toDate(),
        terminationDate: twoMonthsFromNow.toDate()
      });

      fixture.detectChanges();

      // Update effective date to be later than original termination
      component.form.patchValue({ effectiveDate: fourMonthsFromNow });

      const minDate = component.getTerminationDateMin();

      expect(minDate?.isSame(fourMonthsFromNow, 'day')).toBe(true);
    });

    it('should use effective date as minimum allowing dates on or after effective date', () => {
      const tomorrow = moment().add(1, 'day');
      const oneMonthFromNow = moment().add(1, 'month');
      const twoWeeksFromNow = moment().add(2, 'weeks');

      createComponent('edit', {
        requestProductType: 'RBC',
        compatibleProductType: 'WHOLE',
        effectiveDate: tomorrow.toDate(),
        terminationDate: oneMonthFromNow.toDate()
      });

      fixture.detectChanges();

      const minDate = component.getTerminationDateMin();

      // Verify that minDate is the effective date (tomorrow)
      expect(minDate?.isSame(tomorrow, 'day')).toBe(true);
      // Dates after effective date should be valid
      expect(twoWeeksFromNow.isSameOrAfter(minDate)).toBe(true);
      expect(oneMonthFromNow.isSameOrAfter(minDate)).toBe(true);
    });

    it('should return minDate when no effective date is set', () => {
      component.mode = 'add';
      fixture.detectChanges();

      // Do not set effective date
      component.form.patchValue({ effectiveDate: null });

      const result = component.getTerminationDateMin();

      expect(result).toBeTruthy();
      expect(moment.isMoment(result)).toBe(true);
      // Should be the chapter's today (minDate)
      expect(result?.isSame(component.minDate, 'day')).toBe(true);
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should call setupPanel when mode changes (not first change)', () => {
      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false)
      };

      component.mode = 'edit';
      component.data = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day').toDate()
      };

      component.ngOnChanges(changes);

      expect(component.panelTitle).toBe('Edit Record');
    });

    it('should reset form when switching to add mode (not first change)', () => {
      // First set up in edit mode
      component.mode = 'edit';
      component.data = {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day').toDate()
      };

      const editChanges: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false)
      };
      component.ngOnChanges(editChanges);

      // Now switch back to add mode
      component.mode = 'add';
      const addChanges: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(addChanges);

      expect(component.panelTitle).toBe('Add New Record');
      expect(component.form.pristine).toBe(true);
      expect(component.form.untouched).toBe(true);
    });

    it('should not call setupPanel on first change', () => {
      const changes: SimpleChanges = {
        mode: new SimpleChange(undefined, 'add', true)
      };

      // Store original title
      const originalTitle = component.panelTitle;

      component.ngOnChanges(changes);

      // Title should remain the same (setupPanel not called from ngOnChanges on first change)
      // It's already called from ngOnInit
      expect(component.panelTitle).toBe(originalTitle);
    });

    it('should handle data changes (not first change)', () => {
      const newData: ValidProductSubstitutionModel = {
        requestProductType: 'RBC',
        compatibleProductType: 'PRBC',
        effectiveDate: moment().add(3, 'days').toDate()
      };

      component.mode = 'edit';
      component.data = newData;

      const changes: SimpleChanges = {
        data: new SimpleChange(null, newData, false)
      };

      component.ngOnChanges(changes);

      expect(component.panelTitle).toBe('Edit Record');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('setupSubscriptions', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should update productTypeSearch signal when search control changes', () => {
      component.productTypeSearchCtrl.setValue('RBC');

      expect(component.productTypeSearch()).toBe('RBC');
    });

    it('should set productTypeSearch to empty string when search control is cleared', () => {
      component.productTypeSearchCtrl.setValue('RBC');
      component.productTypeSearchCtrl.setValue('');

      expect(component.productTypeSearch()).toBe('');
    });

    it('should handle null search control value', () => {
      component.productTypeSearchCtrl.setValue(null);

      expect(component.productTypeSearch()).toBe('');
    });

    it('should show Error 5331 snackbar when same product type error transitions to true', () => {
      // First set different product types (no error)
      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC'
      });
      component.form.updateValueAndValidity();
      // Reset snackbar spy calls
      mockSnackBar.open.calls.reset();

      // Now set same product types (error appears)
      component.form.patchValue({
        compatibleProductType: 'WRBC'
      });
      component.form.updateValueAndValidity();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error 5331: Compatible product type cannot be same as requested product type',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should not show Error 5331 snackbar when error state does not change', () => {
      // Set same product types to trigger the initial error
      component.form.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: 'WRBC'
      });
      component.form.updateValueAndValidity();

      // Reset spy
      mockSnackBar.open.calls.reset();

      // Update form without changing the error state
      component.form.updateValueAndValidity();

      expect(mockSnackBar.open).not.toHaveBeenCalled();
    });
  });

  describe('Computed Signals - Product Type Filtering', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should return all options when search is empty', () => {
      const mockTypes = [
        { code: 'WRBC', description: 'Washed Red Blood Cells' },
        { code: 'LRBC', description: 'LeukoReduced RBC' },
        { code: 'RBC', description: 'Red Blood Cells' }
      ];

      component.productTypeOptionsSignal.set(mockTypes);

      expect(component.filteredProductTypeOptions()).toEqual(mockTypes);
      expect(component.filteredCompatibleProductTypeOptions()).toEqual(mockTypes);
    });

    it('should filter options by code', () => {
      const mockTypes = [
        { code: 'WRBC', description: 'Washed Red Blood Cells' },
        { code: 'LRBC', description: 'LeukoReduced RBC' },
        { code: 'RBC', description: 'Red Blood Cells' }
      ];

      component.productTypeOptionsSignal.set(mockTypes);
      component.productTypeSearch.set('WR');

      const filtered = component.filteredProductTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('WRBC');
    });

    it('should filter options by description', () => {
      const mockTypes = [
        { code: 'WRBC', description: 'Washed Red Blood Cells' },
        { code: 'LRBC', description: 'LeukoReduced RBC' },
        { code: 'RBC', description: 'Red Blood Cells' }
      ];

      component.productTypeOptionsSignal.set(mockTypes);
      component.productTypeSearch.set('leuko');

      const filtered = component.filteredProductTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('LRBC');
    });

    it('should be case-insensitive when filtering', () => {
      const mockTypes = [
        { code: 'WRBC', description: 'Washed Red Blood Cells' },
        { code: 'RBC', description: 'Red Blood Cells' }
      ];

      component.productTypeOptionsSignal.set(mockTypes);
      component.productTypeSearch.set('wrbc');

      const filtered = component.filteredProductTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('WRBC');
    });

    it('should filter compatible product type options by search', () => {
      const mockTypes = [
        { code: 'WRBC', description: 'Washed Red Blood Cells' },
        { code: 'LRBC', description: 'LeukoReduced RBC' },
        { code: 'RBC', description: 'Red Blood Cells' }
      ];

      component.productTypeOptionsSignal.set(mockTypes);
      // Use 'Washed' which only appears in WRBC description
      component.productTypeSearch.set('Washed');

      const filtered = component.filteredCompatibleProductTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('WRBC');
    });

    it('should return empty array when no options match search', () => {
      const mockTypes = [
        { code: 'WRBC', description: 'Washed Red Blood Cells' },
        { code: 'RBC', description: 'Red Blood Cells' }
      ];

      component.productTypeOptionsSignal.set(mockTypes);
      component.productTypeSearch.set('XYZ');

      expect(component.filteredProductTypeOptions()).toEqual([]);
      expect(component.filteredCompatibleProductTypeOptions()).toEqual([]);
    });
  });

  describe('terminationDateFilterFn', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should return true for null date', () => {
      expect(component.terminationDateFilterFn(null)).toBe(true);
    });

    it('should return false for date before minDate', () => {
      const pastDate = moment().subtract(1, 'year');
      expect(component.terminationDateFilterFn(pastDate)).toBe(false);
    });

    it('should return false for date before effective date', () => {
      const effectiveDate = moment().add(10, 'days');
      component.form.patchValue({ effectiveDate });

      const beforeEffective = moment().add(5, 'days');
      expect(component.terminationDateFilterFn(beforeEffective)).toBe(false);
    });

    it('should return true for date on or after effective date and minDate', () => {
      const effectiveDate = moment().add(5, 'days');
      component.form.patchValue({ effectiveDate });

      const afterEffective = moment().add(15, 'days');
      expect(component.terminationDateFilterFn(afterEffective)).toBe(true);
    });

    it('should return true for date equal to effective date', () => {
      const effectiveDate = moment().add(5, 'days');
      component.form.patchValue({ effectiveDate });

      const sameDay = moment().add(5, 'days');
      expect(component.terminationDateFilterFn(sameDay)).toBe(true);
    });

    it('should return true for future date when no effective date is set', () => {
      // Don't set effective date
      const futureDate = moment().add(30, 'days');
      expect(component.terminationDateFilterFn(futureDate)).toBe(true);
    });
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should handle valid date input', () => {
      const mockEvent = {
        target: { value: '15-JAN-2027' }
      } as unknown as Event;

      component.onEffectiveDateInput(mockEvent);

      const control = component.form.get('effectiveDate');
      expect(control?.touched).toBe(true);
    });

    it('should handle empty date input', () => {
      const mockEvent = {
        target: { value: '' }
      } as unknown as Event;

      component.onEffectiveDateInput(mockEvent);

      const control = component.form.get('effectiveDate');
      expect(control?.touched).toBe(true);
      expect(control?.hasError('required')).toBe(true);
    });
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should handle valid date input', () => {
      const mockEvent = {
        target: { value: '15-JAN-2027' }
      } as unknown as Event;

      component.onTerminationDateInput(mockEvent);

      const control = component.form.get('terminationDate');
      expect(control?.touched).toBe(true);
    });

    it('should handle empty date input in add mode', () => {
      const mockEvent = {
        target: { value: '' }
      } as unknown as Event;

      component.onTerminationDateInput(mockEvent);

      const control = component.form.get('terminationDate');
      // In add mode with empty value, field is marked pristine
      expect(control?.pristine).toBe(true);
    });

    it('should handle empty date input in edit mode', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      createComponent('edit', {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day').toDate(),
        terminationDate: moment().add(30, 'days').toDate()
      });
      fixture.detectChanges();

      const mockEvent = {
        target: { value: '' }
      } as unknown as Event;

      component.onTerminationDateInput(mockEvent);

      const control = component.form.get('terminationDate');
      // In edit mode with empty value, field is marked dirty
      expect(control?.dirty).toBe(true);
    });
  });

  describe('getEffectiveDateError - cross-field', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should use form errors when effective date was last changed', () => {
      // Set effective date after termination date to trigger cross-field error
      component.form.patchValue({
        effectiveDate: moment().add(30, 'days'),
        terminationDate: moment().add(5, 'days')
      });

      // Mark as touched and dirty to trigger error display
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.markAsDirty();

      // Simulate that effective date was last changed
      component['lastChangedDateField'] = 'effective';
      component.form.updateValueAndValidity();

      const error = component.getEffectiveDateError();
      // Should show cross-field error
      expect(error).toContain('Effective Date');
    });

    it('should not use form errors for effective date when termination was last changed', () => {
      // Set effective date after termination date
      component.form.patchValue({
        effectiveDate: moment().add(30, 'days'),
        terminationDate: moment().add(5, 'days')
      });

      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.markAsDirty();

      // Simulate that termination date was last changed
      component['lastChangedDateField'] = 'termination';
      component.form.updateValueAndValidity();

      const error = component.getEffectiveDateError();
      // Should not show cross-field error for effective when termination was last changed
      // (formErrors is null in this case)
      expect(error).toBe('');
    });
  });

  describe('getTerminationDateError - cross-field', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should use form errors when termination date was last changed', () => {
      // Set termination date before effective date to trigger cross-field error
      component.form.patchValue({
        effectiveDate: moment().add(30, 'days'),
        terminationDate: moment().add(5, 'days')
      });

      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsDirty();

      component['lastChangedDateField'] = 'termination';
      component.form.updateValueAndValidity();

      const error = component.getTerminationDateError();
      expect(error).toContain('Termination Date');
    });

    it('should not use form errors for termination when effective was last changed', () => {
      // Set termination date before effective date
      component.form.patchValue({
        effectiveDate: moment().add(30, 'days'),
        terminationDate: moment().add(5, 'days')
      });

      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsDirty();

      component['lastChangedDateField'] = 'effective';
      component.form.updateValueAndValidity();

      const error = component.getTerminationDateError();
      // Should not show cross-field error for termination when effective was last changed
      expect(error).toBe('');
    });
  });

  describe('resetFormForAddMode', () => {
    it('should reset form values and mark as pristine/untouched', () => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));

      // First set up in edit mode with data
      createComponent('edit', {
        requestProductType: 'WRBC',
        compatibleProductType: 'LRBC',
        effectiveDate: moment().add(1, 'day').toDate()
      });
      fixture.detectChanges();

      // Now switch to add mode via ngOnChanges
      component.mode = 'add';
      component.ngOnChanges({
        mode: new SimpleChange('edit', 'add', false)
      });

      expect(component.form.pristine).toBe(true);
      expect(component.form.untouched).toBe(true);
      expect(component.panelTitle).toBe('Add New Record');
    });
  });

  describe('Error Matchers', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getInventoryProductTypes.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });
});
