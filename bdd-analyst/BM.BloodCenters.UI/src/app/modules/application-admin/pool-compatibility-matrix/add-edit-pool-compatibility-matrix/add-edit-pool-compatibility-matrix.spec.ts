import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';

import { AddEditPoolCompatibilityMatrix } from './add-edit-pool-compatibility-matrix';
import { PoolCompatibilityMatrixService } from '../services/pool-compatibility-matrix.service';
import { ProductTypeOption, WorkOptionModel } from '../models/pool-compatibility-matrix.model';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import moment from 'moment';

describe('AddEditPoolCompatibilityMatrix', () => {
  let component: AddEditPoolCompatibilityMatrix;
  let fixture: ComponentFixture<AddEditPoolCompatibilityMatrix>;
  let mockService: jasmine.SpyObj<PoolCompatibilityMatrixService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  const mockWorkOptions: WorkOptionModel[] = [
    { code: 'POOL', description: 'Pool' },
    { code: 'SPLIT', description: 'Split' }
  ];

  const mockInventoryProductTypes: ProductTypeOption[] = [
    { productType: 'RBC', description: 'Red Blood Cells' },
    { productType: 'PLASMA', description: 'Plasma' },
    { productType: 'PLATELETS', description: 'Platelets' }
  ];

  const mockFinishedProductTypes: ProductTypeOption[] = [
    { productType: 'RBC_POOLED', description: 'Pooled RBC' },
    { productType: 'PLASMA_POOLED', description: 'Pooled Plasma' }
  ];

  // Use dynamic dates to avoid test failures when hardcoded dates become past dates
  const futureEffectiveDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month from now
  const futureTerminationDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months from now

  const mockEditData = {
    chapterId: 'CHAPTER-001',
    workOption: 'POOL',
    inventoryProductType: 'RBC',
    finishedInventoryProductType: 'RBC_POOLED',
    effectiveDate: new Date('2026-04-10'),
    terminationDate: new Date('2026-12-31')
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('PoolCompatibilityMatrixService', [
      'getWorkOptions',
      'getInventoryProductTypes',
      'getFinishedProductTypes',
      'createPoolCompatibilityMatrix',
      'updatePoolCompatibilityMatrix'
    ]);

    mockSnackbarService = createMockSnackbarService();
    const mockHeaderService = createMockHeaderService();

    TestBed.configureTestingModule({
      imports: [AddEditPoolCompatibilityMatrix, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: PoolCompatibilityMatrixService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    mockService.getWorkOptions.calls.reset();
    mockService.getInventoryProductTypes.calls.reset();
    mockService.getFinishedProductTypes.calls.reset();
    mockService.createPoolCompatibilityMatrix.calls.reset();
    mockService.updatePoolCompatibilityMatrix.calls.reset();

    fixture = TestBed.createComponent(AddEditPoolCompatibilityMatrix);
    component = fixture.componentInstance;
    // Ensure component uses the mock snackbar service (standalone component may resolve its own instance)
    (component as any).snackbarService = mockSnackbarService;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should initialize with add mode by default', () => {
      expect(component.mode).toBe('add');
      expect(component.data).toBeNull();
    });

    it('should handle dropdown loading error', () => {
      mockService.getWorkOptions.and.returnValue(throwError(() => new Error('API Error')));
      mockService.getInventoryProductTypes.and.returnValue(of(mockInventoryProductTypes));
      mockService.getFinishedProductTypes.and.returnValue(of(mockFinishedProductTypes));

      component.ngOnInit();

      expect(component.workOptionOptions).toEqual([]);
    });

    it('should initialize addedProducts array as empty in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();

      expect(component.addedProducts).toEqual([]);
    });
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      mockService.getWorkOptions.and.returnValue(of(mockWorkOptions));
      mockService.getInventoryProductTypes.and.returnValue(of(mockInventoryProductTypes));
      mockService.getFinishedProductTypes.and.returnValue(of(mockFinishedProductTypes));
      component.mode = 'add';
      component.data = null;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should have required validators on required fields', () => {
      const workOption = component.form.get('workOption');
      const inventoryProductType = component.form.get('inventoryProductType');
      const finishedInventoryProductType = component.form.get('finishedInventoryProductType');
      const effectiveDate = component.form.get('effectiveDate');

      expect(workOption?.hasError('required')).toBe(true);
      expect(inventoryProductType?.hasError('required')).toBe(true);
      expect(finishedInventoryProductType?.hasError('required')).toBe(true);
      expect(effectiveDate?.hasError('required')).toBe(true);
    });
  });

  describe('onAdd - Adding Products', () => {
    beforeEach(() => {
      mockService.getWorkOptions.and.returnValue(of(mockWorkOptions));
      mockService.getInventoryProductTypes.and.returnValue(of(mockInventoryProductTypes));
      mockService.getFinishedProductTypes.and.returnValue(of(mockFinishedProductTypes));
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should add product to addedProducts array when form is valid', () => {
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(30, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();

      component.onAdd();

      expect(component.addedProducts.length).toBe(1);
      expect(component.addedProducts[0].workOption).toBe('POOL');
      expect(component.addedProducts[0].inventoryProductType).toBe('RBC');
      expect(component.addedProducts[0].finishedInventoryProductType).toBe('RBC_POOLED');
    });

    it('should reset form after adding product', () => {
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();

      component.onAdd();

      expect(component.form.get('workOption')?.value).toBeNull();
      expect(component.form.get('inventoryProductType')?.value).toBeNull();
      expect(component.form.get('finishedInventoryProductType')?.value).toBeNull();
      expect(component.form.pristine).toBe(true);
    });

    it('should format dates correctly when adding product', () => {
      const effectiveDate = moment().add(10, 'days');
      const terminationDate = moment().add(30, 'days');

      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate,
        terminationDate
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();

      component.onAdd();

      expect(component.addedProducts[0].effectiveDateFormatted).toBe(effectiveDate.format('DD-MMM-YYYY').toUpperCase());
      expect(component.addedProducts[0].terminationDateFormatted).toBe(terminationDate.format('DD-MMM-YYYY').toUpperCase());
    });
  });

  describe('onAdd - Duplicate Validation', () => {
    beforeEach(() => {
      mockService.getWorkOptions.and.returnValue(of(mockWorkOptions));
      mockService.getInventoryProductTypes.and.returnValue(of(mockInventoryProductTypes));
      mockService.getFinishedProductTypes.and.returnValue(of(mockFinishedProductTypes));
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should detect duplicate combination and show error', () => {
      // Add first product
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      // Try to add same combination again
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(15, 'days') // Different date
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      expect(component.addedProducts.length).toBe(1);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Error 0069: Duplicate values'
      );
    });

    it('should allow adding different combinations', () => {
      // Add first product
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      // Add product with different workOption
      component.form.patchValue({
        workOption: 'SPLIT',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      expect(component.addedProducts.length).toBe(2);
      expect(mockSnackbarService.showError).not.toHaveBeenCalledWith(
        'Error 0069: Duplicate values'
      );
    });

    it('should allow adding product with different inventoryProductType', () => {
      // Add first product
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      // Add product with different inventoryProductType
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'PLASMA',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      expect(component.addedProducts.length).toBe(2);
    });

    it('should allow adding product with different finishedInventoryProductType', () => {
      // Add first product
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      // Add product with different finishedInventoryProductType
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'PLASMA_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      expect(component.addedProducts.length).toBe(2);
    });

    it('should not add duplicate even with different dates', () => {
      // Add first product
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(30, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      // Try to add same combination with different dates
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(20, 'days'),
        terminationDate: moment().add(60, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      expect(component.addedProducts.length).toBe(1);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Error 0069: Duplicate values'
      );
    });
  });

  describe('deleteProduct', () => {
    beforeEach(() => {
      mockService.getWorkOptions.and.returnValue(of(mockWorkOptions));
      mockService.getInventoryProductTypes.and.returnValue(of(mockInventoryProductTypes));
      mockService.getFinishedProductTypes.and.returnValue(of(mockFinishedProductTypes));
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should remove product at specified index', () => {
      // Add two products
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.onAdd();

      component.form.patchValue({
        workOption: 'SPLIT',
        inventoryProductType: 'PLASMA',
        finishedInventoryProductType: 'PLASMA_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.onAdd();

      expect(component.addedProducts.length).toBe(2);

      // Delete first product
      component.deleteProduct(0);

      expect(component.addedProducts.length).toBe(1);
      expect(component.addedProducts[0].workOption).toBe('SPLIT');
    });

    it('should create new array reference for change detection', () => {
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.onAdd();

      const originalArray = component.addedProducts;
      component.deleteProduct(0);

      expect(component.addedProducts).not.toBe(originalArray);
    });
  });

  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      mockService.getWorkOptions.and.returnValue(of(mockWorkOptions));
      mockService.getInventoryProductTypes.and.returnValue(of(mockInventoryProductTypes));
      mockService.getFinishedProductTypes.and.returnValue(of(mockFinishedProductTypes));
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should call create API with correct payload', () => {
      // Add product
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(30, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      mockService.createPoolCompatibilityMatrix.and.returnValue(
        of({ message: 'Success' })
      );

      component.onSave();

      expect(mockService.createPoolCompatibilityMatrix).toHaveBeenCalledWith(
        jasmine.objectContaining({
          workOption: 'POOL',
          inventoryProductType: 'RBC',
          finishedInventoryProductType: 'RBC_POOLED'
        })
      );
    });

    it('should emit saveSuccess and closePanel on successful save', (done) => {
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      mockService.createPoolCompatibilityMatrix.and.returnValue(
        of({ message: 'Success' })
      );

      let saveEmitted = false;
      let closeEmitted = false;

      component.saveSuccess.subscribe(() => {
        saveEmitted = true;
        if (closeEmitted) done();
      });

      component.closePanel.subscribe(() => {
        closeEmitted = true;
        if (saveEmitted) done();
      });

      component.onSave();
    });

    it('should save multiple products individually', () => {
      // Add multiple products
      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      component.form.patchValue({
        workOption: 'SPLIT',
        inventoryProductType: 'PLASMA',
        finishedInventoryProductType: 'PLASMA_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      mockService.createPoolCompatibilityMatrix.and.returnValue(
        of({ message: 'Success' })
      );

      component.onSave();

      expect(mockService.createPoolCompatibilityMatrix).toHaveBeenCalledTimes(2);
    });
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      mockService.getWorkOptions.and.returnValue(of(mockWorkOptions));
      mockService.getInventoryProductTypes.and.returnValue(of(mockInventoryProductTypes));
      mockService.getFinishedProductTypes.and.returnValue(of(mockFinishedProductTypes));
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should call update API with correct payload', () => {
      mockService.updatePoolCompatibilityMatrix.and.returnValue(
        of({ message: 'Success' })
      );

      component.onSave();

      expect(mockService.updatePoolCompatibilityMatrix).toHaveBeenCalledWith(
        jasmine.objectContaining({
          chapterId: 'CHAPTER-001',
          workOption: 'POOL',
          inventoryProductType: 'RBC',
          finishedInventoryProductType: 'RBC_POOLED',
          originalInventoryProductType: 'RBC',
          originalFinishedInventoryProductType: 'RBC_POOLED'
        })
      );
    });

    it('should include original values and chapterId in update payload', () => {
      mockService.updatePoolCompatibilityMatrix.and.returnValue(
        of({ message: 'Success' })
      );

      component.onSave();

      const call = mockService.updatePoolCompatibilityMatrix.calls.mostRecent();
      const payload = call.args[0];

      expect(payload.chapterId).toBe('CHAPTER-001');
      expect(payload.originalInventoryProductType).toBe('RBC');
      expect(payload.originalFinishedInventoryProductType).toBe('RBC_POOLED');
    });
  });
  describe('isFormChanged getter', () => {
    beforeEach(() => {
      mockService.getWorkOptions.and.returnValue(of(mockWorkOptions));
      mockService.getInventoryProductTypes.and.returnValue(of(mockInventoryProductTypes));
      mockService.getFinishedProductTypes.and.returnValue(of(mockFinishedProductTypes));
    });

    it('should return false when no products added in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();

      expect(component.isFormChanged).toBe(false);
    });

    it('should return true when products added in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges();

      component.form.patchValue({
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'RBC_POOLED',
        effectiveDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();
      fixture.detectChanges();
      component.onAdd();

      expect(component.isFormChanged).toBe(true);
    });

    it('should return false when form unchanged in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();

      expect(component.isFormChanged).toBe(false);
    });

    it('should return true when form changed in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();

      component.form.patchValue({
        terminationDate: moment().add(60, 'days')
      });

      expect(component.isFormChanged).toBe(true);
    });
  });

  describe('Date Formatting', () => {
    it('should handle moment objects', () => {
      const momentDate = moment(new Date('2026-06-15'));
      const formatted = component.formatDateDisplay(momentDate);

      expect(formatted).toBe('15-JUN-2026');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null data in edit mode', () => {
      mockService.getWorkOptions.and.returnValue(of(mockWorkOptions));
      mockService.getInventoryProductTypes.and.returnValue(of(mockInventoryProductTypes));
      mockService.getFinishedProductTypes.and.returnValue(of(mockFinishedProductTypes));
      component.mode = 'edit';
      component.data = null;

      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle empty dropdown responses', () => {
      mockService.getWorkOptions.and.returnValue(of([]));
      mockService.getInventoryProductTypes.and.returnValue(of([]));
      mockService.getFinishedProductTypes.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.workOptionOptions).toEqual([]);
      expect(component.inventoryProductTypeOptions).toEqual([]);
      expect(component.finishedProductTypeOptions).toEqual([]);
    });
  });
});
