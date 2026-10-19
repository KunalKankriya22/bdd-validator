import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AddProductCombinationComponent } from './add-product-combination';
import { ProductCombinationsApiService } from '../../services/product-combinations-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ProductTypeDetailDto } from '../../models/product-combinations.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddProductCombinationComponent', () => {
  let component: AddProductCombinationComponent;
  let fixture: ComponentFixture<AddProductCombinationComponent>;
  let apiServiceSpy: jasmine.SpyObj<ProductCombinationsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddProductCombinationComponent>>;

  const mockProductTypes: ProductTypeDetailDto[] = [
    { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
    { productTypeCode: 'PLT', productTypeDesc: 'Platelets' },
    { productTypeCode: 'PLASMA', productTypeDesc: 'Plasma' }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ProductCombinationsApiService', ['createProductCombination', 'getNextSetId']);
    apiServiceSpy.getNextSetId.and.returnValue(of(17)); // Mock next set ID
    snackbarServiceSpy = createMockSnackbarService();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [AddProductCombinationComponent, NoopAnimationsModule],
      providers: [
        { provide: ProductCombinationsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });


    


      apiServiceSpy.createProductCombination.calls.reset();


      apiServiceSpy.getNextSetId.calls.reset();


      dialogRefSpy.close.calls.reset();


      apiServiceSpy.getNextSetId.and.returnValue(of(17)); // Mock next set ID


    fixture = TestBed.createComponent(AddProductCombinationComponent);
    component = fixture.componentInstance;
    component.activeProductTypes = mockProductTypes;


    });


  describe('Initialization', () => {
    it('should initialize form with null bag count', () => {
      fixture.detectChanges();

      expect(component.form.get('bagCount')?.value).toBeNull();
    });

    it('should have bag count options from 1 to 15', () => {
      fixture.detectChanges();

      expect(component.bagCountOptions.length).toBe(15);
      expect(component.bagCountOptions[0]).toBe(1);
      expect(component.bagCountOptions[14]).toBe(15);
    });

    it('should initialize with empty product slots', () => {
      fixture.detectChanges();

      expect(component.productSlots.length).toBe(0);
    });
  });

  describe('Product Slots Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create product slots when bag count is set', fakeAsync(() => {
      component.form.patchValue({ bagCount: 3 });
      tick();

      expect(component.productSlots.length).toBe(3);
      expect(component.productSlots[0].productTypeCode).toBeNull();
      expect(component.productSlots[0].description).toBe('');
    }));



    it('should remove slots when bag count decreases', fakeAsync(() => {
      component.form.patchValue({ bagCount: 4 });
      tick();
      component.productSlots[0].productTypeCode = 'RBC';
      component.productSlots[1].productTypeCode = 'PLT';

      component.form.patchValue({ bagCount: 2 });
      tick();
      expect(component.productSlots.length).toBe(2);
    }));


  });

  describe('Product Type Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should allow currently selected type for the same slot', fakeAsync(() => {
      component.form.patchValue({ bagCount: 2 });
      tick();
      component.productSlots[0].productTypeCode = 'RBC';

      const available = component.getAvailableTypesForSlot(0);

      expect(available.find(pt => pt.productTypeCode === 'RBC')).toBeDefined();
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not require bag count', () => {
      expect(component.form.get('bagCount')?.hasError('required')).toBe(false);
    });






  });

  describe('Code Set Value', () => {


    it('should return next set ID regardless of bag count', fakeAsync(() => {
      fixture.detectChanges();
      component.form.patchValue({ bagCount: 3 });
      tick();

      // Code set is loaded on init, not when bag count changes
      expect(component.codeSetValue).toBe('17');
    }));
  });

  describe('Save Product Combination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should save valid product combination', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Created', statusCode: 201 };
      apiServiceSpy.createProductCombination.and.returnValue(of(mockResponse));
      component.form.patchValue({ bagCount: 2 });
      tick();
      component.productSlots[0].productTypeCode = 'RBC';
      component.productSlots[1].productTypeCode = 'PLT';

      component.onSave();

      expect(apiServiceSpy.createProductCombination).toHaveBeenCalledWith({
        numberOfBags: 2,
        productTypes: ['RBC', 'PLT']
      });

      tick();
      expect(component.isSubmitting).toBe(false);
    }));

    it('should show success message and close dialog on successful save', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Created', statusCode: 201 };
      apiServiceSpy.createProductCombination.and.returnValue(of(mockResponse));
      component.form.patchValue({ bagCount: 2 });
      tick();
      component.productSlots[0].productTypeCode = 'RBC';
      component.productSlots[1].productTypeCode = 'PLT';

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product combination created successfully');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
      expect(component.isSubmitting).toBe(false);
    }));



    it('should handle generic error message', fakeAsync(() => {
      apiServiceSpy.createProductCombination.and.returnValue(throwError(() => ({ message: 'Network error' })));
      component.form.patchValue({ bagCount: 2 });
      tick();
      component.productSlots[0].productTypeCode = 'RBC';
      component.productSlots[1].productTypeCode = 'PLT';

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Network error');
    }));
  });

  describe('Save and Create Another', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should save and reset form for creating another', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Created', statusCode: 201 };
      apiServiceSpy.createProductCombination.and.returnValue(of(mockResponse));
      component.form.patchValue({ bagCount: 2 });
      tick();
      component.productSlots[0].productTypeCode = 'RBC';
      component.productSlots[1].productTypeCode = 'PLT';

      component.onSaveAndCreateAnother();
      tick();

      expect(apiServiceSpy.createProductCombination).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product combination created successfully');
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(component.form.get('bagCount')?.value).toBeNull();
      expect(component.productSlots.length).toBe(0);
    }));
  });

  describe('Close Dialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close dialog with false on onClose', fakeAsync(() => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    }));
  });

  describe('Product Type Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set description when valid product type selected', fakeAsync(() => {
      component.form.patchValue({ bagCount: 2 });
      tick();

      component.onProductTypeChange(0, 'RBC');

      expect(component.productSlots[0].description).toBe('Red Blood Cells');
    }));

    it('should clear description when invalid product type selected', fakeAsync(() => {
      component.form.patchValue({ bagCount: 2 });
      tick();

      component.onProductTypeChange(0, 'INVALID');

      expect(component.productSlots[0].description).toBe('');
    }));
  });

  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter bag count options', fakeAsync(() => {
      component.bagCountSearchControl.setValue('1');
      tick();

      expect(component.filteredBagCountOptions.every(count => count.toString().includes('1'))).toBe(true);
    }));

    it('should reset bag count filter when search is empty', fakeAsync(() => {
      component.bagCountSearchControl.setValue('');
      tick();

      expect(component.filteredBagCountOptions.length).toBe(component.bagCountOptions.length);
    }));

    it('should filter product types by code', fakeAsync(() => {
      component.productTypeSearchControl.setValue('RBC');
      tick();

      expect(component.filteredProductTypes.length).toBeGreaterThan(0);
      expect(component.filteredProductTypes.every(type =>
        type.productTypeCode.toLowerCase().includes('rbc') ||
        type.productTypeDesc.toLowerCase().includes('rbc')
      )).toBe(true);
    }));

    it('should filter product types by description', fakeAsync(() => {
      component.productTypeSearchControl.setValue('Red');
      tick();

      expect(component.filteredProductTypes.length).toBeGreaterThan(0);
      expect(component.filteredProductTypes.every(type =>
        type.productTypeCode.toLowerCase().includes('red') ||
        type.productTypeDesc.toLowerCase().includes('red')
      )).toBe(true);
    }));

    it('should reset product type filter when search is empty', fakeAsync(() => {
      component.productTypeSearchControl.setValue('');
      tick();

      expect(component.filteredProductTypes.length).toBe(component.activeProductTypes.length);
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when not all slots filled', fakeAsync(() => {
      component.form.patchValue({ bagCount: 3 });
      tick();
      component.productSlots[0].productTypeCode = 'RBC';
      component.productSlots[1].productTypeCode = 'PLT';

      expect(component.isFormValid).toBe(false);
    }));
  });

  describe('Component Lifecycle', () => {
    it('should complete destroy subject on ngOnDestroy', fakeAsync(() => {
      fixture.detectChanges();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    }));
  });

  // Validation message tests removed - component doesn't implement validation messages
  // The component uses isFormValid getter instead of displaying text messages
});
