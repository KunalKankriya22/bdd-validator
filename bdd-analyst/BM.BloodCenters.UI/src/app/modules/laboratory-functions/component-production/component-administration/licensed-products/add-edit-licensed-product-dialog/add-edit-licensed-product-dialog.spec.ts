import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { AddEditLicensedProductDialog } from './add-edit-licensed-product-dialog';
import { LicensedProductsService } from '../services/licensed-products.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  LicensedProduct,
  AddEditLicensedProductDialogData,
  LicensedProductRequest,
  ValidProduct
} from '../models/licensed-products.model';

describe('AddEditLicensedProductDialog', () => {
  let component: AddEditLicensedProductDialog;
  let fixture: ComponentFixture<AddEditLicensedProductDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditLicensedProductDialog>>;
  let serviceSpy: jasmine.SpyObj<LicensedProductsService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockProduct: LicensedProduct = {
    productCode: 'RBC001',
    productDescription: 'Red Blood Cells',
    chapterId: 'DAL',
    osokFlag: 'Y',
    effDate: '2024-01-01',
    termDate: '2025-12-31',
    insertDate: '2024-01-01T10:00:00Z'
  };

  const mockValidProducts: ValidProduct[] = [
    { productCode: 'RBC001', productDesc: 'Red Blood Cells' },
    { productCode: 'PLT001', productDesc: 'Platelets' },
    { productCode: 'PLM001', productDesc: 'Plasma' }
  ];

  const addModeData: AddEditLicensedProductDialogData = {
    mode: 'add',
    chapterId: 'DAL',
    validProducts: mockValidProducts
  };

  const editModeData: AddEditLicensedProductDialogData = {
    mode: 'edit',
    chapterId: 'DAL',
    product: mockProduct
  };

  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('LicensedProductsService', [
      'createLicensedProduct',
      'updateLicensedProduct',
      'getValidProducts'
    ]);
    snackBarSpy = createMockMatSnackBar();
    headerServiceSpy = createMockHeaderService();

    serviceSpy.getValidProducts.and.returnValue(of(mockValidProducts));



      TestBed.configureTestingModule({
imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: addModeData },
        { provide: LicensedProductsService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.getValidProducts.and.returnValue(of(mockValidProducts));


    fixture = TestBed.createComponent(AddEditLicensedProductDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Form Initialization - Add Mode', () => {



    it('should update product description when product code changes', fakeAsync(() => {
      component.form.patchValue({ productCode: 'RBC001' });
      tick();

      expect(component.selectedProductDesc()).toBe('Red Blood Cells');
    }));
  });

  describe('Form Initialization - Edit Mode', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editModeData },
          { provide: LicensedProductsService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      fixture = TestBed.createComponent(AddEditLicensedProductDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should initialize form with product data', () => {
      expect(component.form.get('osokFlag')?.value).toBe('Y');
      expect(component.form.get('termDate')?.value).toBeTruthy();
    });

    it('should not have productCode in form', () => {
      expect(component.form.get('productCode')).toBeNull();
    });

    it('should display product description', () => {
      expect(component.selectedProductDesc()).toBe('Red Blood Cells');
    });

    it('should set terminationMinDate from existing effective date', () => {
      const expectedDate = moment('2024-01-01');
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(expectedDate.format('YYYY-MM-DD'));
    });
  });

  describe('Dialog Title', () => {
    it('should return "Add New Licensed Products" for add mode', () => {
      expect(component.dialogTitle).toBe('Add New Licensed Products');
    });

    it('should return "Edit Licensed Products" for edit mode', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editModeData },
          { provide: LicensedProductsService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      const editFixture = TestBed.createComponent(AddEditLicensedProductDialog);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      expect(editComponent.dialogTitle).toBe('Edit Licensed Products');
    });
  });

  describe('Last Modified', () => {
    it('should return formatted date for edit mode', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editModeData },
          { provide: LicensedProductsService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      const editFixture = TestBed.createComponent(AddEditLicensedProductDialog);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      expect(editComponent.lastModified).toContain('2024');
    });

  });

  describe('Product Search Functionality', () => {
    it('should filter products by product code', fakeAsync(() => {
      component.productSearchControl.setValue('rbc');
      tick();

      expect(component.filteredProducts.length).toBeGreaterThan(0);
      expect(component.filteredProducts.some(p => p.productCode.toLowerCase().includes('rbc'))).toBe(true);
    }));

    it('should filter products by product description', fakeAsync(() => {
      component.productSearchControl.setValue('platelets');
      tick();

      expect(component.filteredProducts.length).toBeGreaterThan(0);
      expect(component.filteredProducts.some(p => p.productDesc?.toLowerCase().includes('platelets'))).toBe(true);
    }));

    it('should show all products when search is empty', fakeAsync(() => {
      component.productSearchControl.setValue('');
      tick();

      expect(component.filteredProducts.length).toBe(component.validProducts.length);
    }));
  });

  describe('Date Validation', () => {
    it('should have effective date error message for required', () => {
      component.form.get('effDate')?.markAsTouched();
      const error = component.getEffectiveDateError();
      expect(error).toBeTruthy();
      expect(error).toContain('Effective Date is required');
    });

    it('should have termination date validation', () => {
      component.form.patchValue({
        effDate: moment().add(2, 'days'),
        termDate: moment()
      });

      component.form.updateValueAndValidity();

      expect(component.form.errors).toBeTruthy();
      expect(component.form.errors?.['dateRangeInvalid']).toBeTruthy();
    });

    it('should update terminationMinDate when effective date changes', fakeAsync(() => {
      const initialMinDate = component.terminationMinDate.format('YYYY-MM-DD');

      const futureEffDate = moment().add(10, 'days');
      component.form.patchValue({
        effDate: futureEffDate
      });
      tick();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureEffDate.format('YYYY-MM-DD'));
    }));

    it('should set terminationMinDate to minDate when effective date equals minDate', fakeAsync(() => {
      component.form.patchValue({
        effDate: component.minDate
      });
      tick();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    }));

    it('should reset terminationMinDate to minDate when effective date is cleared', fakeAsync(() => {
      const futureEffDate = moment().add(10, 'days');
      component.form.patchValue({
        effDate: futureEffDate
      });
      tick();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureEffDate.format('YYYY-MM-DD'));

      component.form.patchValue({
        effDate: null
      });
      tick();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    }));
  });

  describe('Save Functionality - Add Mode', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({
        productCode: 'RBC001',
        osokFlag: 'Y',
        effDate: moment().add(1, 'days'),
        termDate: null
      });
      tick(); // Allow form value changes to propagate
    }));

    it('should call createLicensedProduct with chapterId on save', fakeAsync(() => {
      serviceSpy.createLicensedProduct.and.returnValue(of(void 0));

      component.onSave();
      tick();

      expect(serviceSpy.createLicensedProduct).toHaveBeenCalledWith(
        jasmine.any(Object),
        'DAL'
      );
      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({ action: 'save' }));
    }));

    it('should handle save failure gracefully', fakeAsync(() => {
      const errorResponse = {
        error: {
          errorResponse: {
            errorCode: '0001',
            error: 'Duplicate product code'
          }
        }
      };
      serviceSpy.createLicensedProduct.and.returnValue(throwError(() => errorResponse));

      component.onSave();
      tick();

      expect(component.saving()).toBe(false);
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));


  });

  describe('Save and Add Another Functionality', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({
        productCode: 'RBC001',
        osokFlag: 'Y',
        effDate: moment().add(1, 'days'),
        termDate: null
      });
      tick(); // Allow form value changes to propagate
    }));

    it('should reset form and keep dialog open on successful save', fakeAsync(() => {
      serviceSpy.createLicensedProduct.and.returnValue(of(void 0));

      component.onSaveAndAddAnother();
      tick();

      expect(serviceSpy.createLicensedProduct).toHaveBeenCalled();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(component.form.get('productCode')?.value).toBeNull();
      expect(component.selectedProductDesc()).toBe('--');
    }));

    it('should keep dialog open and stop saving when error occurs', fakeAsync(() => {
      const errorResponse = {
        error: {
          errorResponse: {
            errorCode: '0001',
            error: 'Duplicate product code'
          }
        }
      };
      serviceSpy.createLicensedProduct.and.returnValue(throwError(() => errorResponse));

      component.onSaveAndAddAnother();
      tick();

      expect(serviceSpy.createLicensedProduct).toHaveBeenCalled();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(component.saving()).toBe(false);
    }));
  });

  describe('Save Functionality - Edit Mode', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editModeData },
          { provide: LicensedProductsService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      fixture = TestBed.createComponent(AddEditLicensedProductDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should call updateLicensedProduct on save', fakeAsync(() => {
      serviceSpy.updateLicensedProduct.and.returnValue(of(void 0));

      component.onSave();
      tick();

      expect(serviceSpy.updateLicensedProduct).toHaveBeenCalledWith(
        'RBC001',
        'DAL',
        jasmine.any(Object)
      );
      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({ action: 'save' }));
    }));


    it('should handle update failure gracefully', fakeAsync(() => {
      const errorResponse = {
        error: {
          errorResponse: {
            errorCode: '0002',
            error: 'Update failed'
          }
        }
      };
      serviceSpy.updateLicensedProduct.and.returnValue(throwError(() => errorResponse));

      component.onSave();
      tick();

      expect(component.saving()).toBe(false);
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));
  });
  describe('Error Message Extraction', () => {
    it('should extract error message with error code', () => {
      const error = {
        error: {
          errorResponse: {
            errorCode: '0001',
            error: 'Test error message'
          }
        }
      };

      const message = component['extractErrorMessage'](error);
      expect(message).toBe('Error 0001: Test error message');
    });

    it('should extract error message without error code', () => {
      const error = {
        error: {
          message: 'Simple error message'
        }
      };

      const message = component['extractErrorMessage'](error);
      expect(message).toBe('Simple error message');
    });

    it('should return default message for unknown error', () => {
      const error = {};

      const message = component['extractErrorMessage'](error);
      expect(message).toBe('An error occurred');
    });
  });

  describe('OSOK Options', () => {
    it('should have correct OSOK options', () => {
      expect(component.osokOptions.length).toBe(2);
      expect(component.osokOptions[0]).toEqual({ value: 'Y', label: 'Yes' });
      expect(component.osokOptions[1]).toEqual({ value: 'N', label: 'No' });
    });
  });

  describe('Form Field Errors', () => {
    it('should return error message for required field', () => {
      const productCodeControl = component.form.get('productCode');
      productCodeControl?.markAsTouched();

      const error = component.getErrorMessage('productCode');
      expect(error).toBe('Product Code is required');
    });

    it('should return empty string for untouched fields', () => {
      expect(component.getErrorMessage('productCode')).toBe('');
    });

    it('should return empty string for non-existent fields', () => {
      expect(component.getErrorMessage('nonExistent')).toBe('');
    });
  });

  describe('Cancel Functionality', () => {
    it('should close dialog with cancel action in dialog mode', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'cancel' });
    });
  });

  describe('Date Input Handlers', () => {
    it('should handle effective date input', () => {
      const mockEvent = { target: { value: '15-JAN-2026' } } as any;
      expect(() => component.onEffectiveDateInput(mockEvent)).not.toThrow();
    });

    it('should handle termination date input', () => {
      const mockEvent = { target: { value: '31-DEC-2026' } } as any;
      expect(() => component.onTerminationDateInput(mockEvent)).not.toThrow();
    });
  });

  describe('Date Filters', () => {
    it('should allow null date in effectiveDateFilter', () => {
      expect(component.effectiveDateFilter(null)).toBe(true);
    });

    it('should allow future dates in add mode effectiveDateFilter', () => {
      const futureDate = moment().add(30, 'days');
      expect(component.effectiveDateFilter(futureDate)).toBe(true);
    });

    it('should allow null date in terminationDateFilter', () => {
      expect(component.terminationDateFilter(null)).toBe(true);
    });

    it('should allow future dates in terminationDateFilter', () => {
      const futureDate = moment().add(30, 'days');
      expect(component.terminationDateFilter(futureDate)).toBe(true);
    });

    it('should reject past termination dates before terminationMinDate', () => {
      component.terminationMinDate = moment().add(10, 'days');
      const pastDate = moment().subtract(5, 'days');
      expect(component.terminationDateFilter(pastDate)).toBe(false);
    });
  });

  describe('ngOnChanges', () => {
    it('should re-initialize when mode changes (not first change)', fakeAsync(() => {
      const formBefore = component.form;
      component.ngOnChanges({
        product: {
          previousValue: null,
          currentValue: mockProduct,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();
      // Form should be re-created
      expect(component.form).not.toBe(formBefore);
    }));

    it('should not re-initialize on first change', () => {
      const formBefore = component.form;
      component.ngOnChanges({
        mode: {
          previousValue: undefined,
          currentValue: 'add',
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component.form).toBe(formBefore);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Save Validation', () => {
    it('should not save when form is invalid', () => {
      component.form.patchValue({ productCode: '', effDate: null });
      component.onSave();
      expect(serviceSpy.createLicensedProduct).not.toHaveBeenCalled();
    });

    it('should not save and add another when form is invalid', () => {
      component.form.patchValue({ productCode: '', effDate: null });
      component.onSaveAndAddAnother();
      expect(serviceSpy.createLicensedProduct).not.toHaveBeenCalled();
    });

    it('should stop on dateRangeInvalid on onSave', fakeAsync(() => {
      component.form.patchValue({
        productCode: 'RBC001',
        osokFlag: 'Y',
        effDate: moment().add(5, 'days'),
        termDate: moment().subtract(1, 'days')
      });
      tick();
      component.onSave();
      expect(serviceSpy.createLicensedProduct).not.toHaveBeenCalled();
    }));

    it('should stop on dateRangeInvalid on onSaveAndAddAnother', fakeAsync(() => {
      component.form.patchValue({
        productCode: 'RBC001',
        osokFlag: 'Y',
        effDate: moment().add(5, 'days'),
        termDate: moment().subtract(1, 'days')
      });
      tick();
      component.onSaveAndAddAnother();
      expect(serviceSpy.createLicensedProduct).not.toHaveBeenCalled();
    }));
  });

  describe('Termination Date Error', () => {
    it('should return termination date error message', () => {
      component.form.get('termDate')?.markAsTouched();
      const err = component.getTerminationDateError();
      expect(typeof err).toBe('string');
    });
  });

  describe('Last Modified - empty', () => {
    it('should return empty string when no product insertDate', () => {
      expect(component.lastModified).toBe('');
    });
  });

  describe('Side Panel Mode (no dialogRef)', () => {
    let sidePanelFixture: ComponentFixture<AddEditLicensedProductDialog>;
    let sidePanelComponent: AddEditLicensedProductDialog;

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: null },
          { provide: MAT_DIALOG_DATA, useValue: null },
          { provide: LicensedProductsService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      sidePanelFixture = TestBed.createComponent(AddEditLicensedProductDialog);
      sidePanelComponent = sidePanelFixture.componentInstance;
      sidePanelComponent.mode = 'add';
      sidePanelComponent.chapterId = 'DAL';
      sidePanelComponent.validProducts = mockValidProducts;
      sidePanelFixture.detectChanges();
    });

    it('should emit close on cancel in side panel mode', () => {
      spyOn(sidePanelComponent.close, 'emit');
      sidePanelComponent.onCancel();
      expect(sidePanelComponent.close.emit).toHaveBeenCalled();
    });

    it('should emit saveSuccess and close on successful create', fakeAsync(() => {
      spyOn(sidePanelComponent.saveSuccess, 'emit');
      spyOn(sidePanelComponent.close, 'emit');
      serviceSpy.createLicensedProduct.and.returnValue(of(void 0));

      sidePanelComponent.form.patchValue({
        productCode: 'RBC001',
        osokFlag: 'Y',
        effDate: moment().add(1, 'days')
      });
      tick();

      sidePanelComponent.onSave();
      tick();

      expect(sidePanelComponent.saveSuccess.emit).toHaveBeenCalled();
      expect(sidePanelComponent.close.emit).toHaveBeenCalled();
    }));

    it('should emit saveSuccess on save and add another', fakeAsync(() => {
      spyOn(sidePanelComponent.saveSuccess, 'emit');
      serviceSpy.createLicensedProduct.and.returnValue(of(void 0));

      sidePanelComponent.form.patchValue({
        productCode: 'RBC001',
        osokFlag: 'Y',
        effDate: moment().add(1, 'days')
      });
      tick();

      sidePanelComponent.onSaveAndAddAnother();
      tick();

      expect(sidePanelComponent.saveSuccess.emit).toHaveBeenCalled();
    }));
  });

  describe('Side Panel Mode - Edit without dialogRef', () => {
    let sidePanelFixture: ComponentFixture<AddEditLicensedProductDialog>;
    let sidePanelComponent: AddEditLicensedProductDialog;

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: null },
          { provide: MAT_DIALOG_DATA, useValue: null },
          { provide: LicensedProductsService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      sidePanelFixture = TestBed.createComponent(AddEditLicensedProductDialog);
      sidePanelComponent = sidePanelFixture.componentInstance;
      sidePanelComponent.mode = 'edit';
      sidePanelComponent.chapterId = 'DAL';
      sidePanelComponent.product = mockProduct;
      sidePanelFixture.detectChanges();
    });

    it('should emit saveSuccess and close on successful update', fakeAsync(() => {
      spyOn(sidePanelComponent.saveSuccess, 'emit');
      spyOn(sidePanelComponent.close, 'emit');
      serviceSpy.updateLicensedProduct.and.returnValue(of(void 0));

      sidePanelComponent.onSave();
      tick();

      expect(sidePanelComponent.saveSuccess.emit).toHaveBeenCalled();
      expect(sidePanelComponent.close.emit).toHaveBeenCalled();
    }));

    it('should handle update error in side panel mode', fakeAsync(() => {
      serviceSpy.updateLicensedProduct.and.returnValue(throwError(() => ({ message: 'fail' })));

      sidePanelComponent.onSave();
      tick();

      expect(sidePanelComponent.saving()).toBe(false);
    }));
  });

  describe('loadValidProducts fallback', () => {
    it('should load products from API when none provided', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'add', chapterId: 'DAL', validProducts: [] } },
          { provide: LicensedProductsService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      serviceSpy.getValidProducts.and.returnValue(of(mockValidProducts));
      const f = TestBed.createComponent(AddEditLicensedProductDialog);
      f.detectChanges();
      tick();

      expect(f.componentInstance.validProducts.length).toBe(3);
      expect(f.componentInstance.loadingProducts()).toBe(false);
    }));

    it('should handle loadValidProducts API error', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'add', chapterId: 'DAL', validProducts: [] } },
          { provide: LicensedProductsService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      serviceSpy.getValidProducts.and.returnValue(throwError(() => new Error('API Error')));
      const f = TestBed.createComponent(AddEditLicensedProductDialog);
      f.detectChanges();
      tick();

      expect(f.componentInstance.loadingProducts()).toBe(false);
    }));
  });

  describe('effectiveDateFilter in Edit mode', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editModeData },
          { provide: LicensedProductsService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      fixture = TestBed.createComponent(AddEditLicensedProductDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should allow past dates in edit mode', () => {
      const pastDate = moment().subtract(30, 'days');
      expect(component.effectiveDateFilter(pastDate)).toBe(true);
    });
  });

  describe('Update product without product set', () => {
    it('should return early from updateProduct when no product', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditLicensedProductDialog, NoopAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'edit', chapterId: 'DAL', product: null } },
          { provide: LicensedProductsService, useValue: serviceSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: HeaderService, useValue: headerServiceSpy }
        ]
      });

      const f = TestBed.createComponent(AddEditLicensedProductDialog);
      f.detectChanges();

      f.componentInstance.onSave();
      tick();
      expect(serviceSpy.updateLicensedProduct).not.toHaveBeenCalled();
    }));
  });
});
