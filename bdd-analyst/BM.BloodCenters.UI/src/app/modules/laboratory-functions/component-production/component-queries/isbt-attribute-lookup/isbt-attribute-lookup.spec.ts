import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';

import { IsbtAttributeLookupComponent } from './isbt-attribute-lookup';
import { IsbtAttributeLookupApiService } from './services/isbt-attribute-lookup-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  IsbtAttributeDto,
  IsbtAttributeGroupDto,
  ProductFormulaDto,
  ProductLovOption,
  AttributeGroupLovOption,
  AttributeCodeLovOption,
} from './models/isbt-attribute-lookup.model';

describe('IsbtAttributeLookupComponent', () => {
  let apiServiceSpy: any;
  let component: IsbtAttributeLookupComponent;
  let fixture: ComponentFixture<IsbtAttributeLookupComponent>;
  let apiService: jasmine.SpyObj<IsbtAttributeLookupApiService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockAttributeGroup: IsbtAttributeGroupDto = {
    code: 'V0020',
    oldGroup: 'J',
    description: 'Dosage',
  };

  const mockSearchResults: IsbtAttributeDto[] = [
    {
      attribGroup: 'V0020',
      attribCode: 'V002001',
      oldAttribCode: 'J1',
      attribDesc: '*Default Not Indicated',
      effDate: '01-JAN-2020',
      termDate: '',
    },
    {
      attribGroup: 'V0020',
      attribCode: 'V002002',
      oldAttribCode: 'J2',
      attribDesc: 'From 2 Donors',
      effDate: '01-JAN-2020',
      termDate: '',
    },
  ];

  const mockProductFormula: ProductFormulaDto = {
    productCode: '016545656',
    productClass: 'C0002',
    modifierCode: 'M000',
    productFormula: 'V0001022',
    oldProductFormula: '@/22',
  };

  const mockProductOptions: ProductLovOption[] = [
    { productCode: '016545656', description: 'Test Product' },
    { productCode: '016545657', description: 'Another Product' },
  ];

  const mockAttributeGroupOptions: AttributeGroupLovOption[] = [
    { code: 'V0020', description: 'Dosage' },
    { code: 'V0030', description: 'Processing Method' },
  ];

  const mockNewCodeOptions: AttributeCodeLovOption[] = [
    { attribCode: 'V002001', attribDesc: '*Default Not Indicated' },
    { attribCode: 'V002002', attribDesc: 'From 2 Donors' },
  ];

  const mockOldCodeOptions: AttributeCodeLovOption[] = [
    { attribCode: 'J1', attribDesc: '*Default Not Indicated' },
    { attribCode: 'J2', attribDesc: 'From 2 Donors' },
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('IsbtAttributeLookupApiService', [
      'searchAttributes',
      'getAttributeGroup',
      'getAttributeGroupsLov',
      'getNewCodesLov',
      'getOldCodesLov',
      'getProductsLov',
      'getProductFormula',
      'getOldCodeFromNewCode',
      'getNewCodeFromOldCode',
      'getGroupMapping',
    ]);

    // Set default return values to prevent undefined errors
    apiServiceSpy.getAttributeGroupsLov.and.returnValue(of([]));
    apiServiceSpy.getNewCodesLov.and.returnValue(of([]));
    apiServiceSpy.getOldCodesLov.and.returnValue(of([]));
    apiServiceSpy.getProductsLov.and.returnValue(of([]));
    apiServiceSpy.getAttributeGroup.and.returnValue(of(mockAttributeGroup));
    apiServiceSpy.searchAttributes.and.returnValue(of([]));
    apiServiceSpy.getProductFormula.and.returnValue(of(mockProductFormula));
    apiServiceSpy.getOldCodeFromNewCode.and.returnValue(of(null));
    apiServiceSpy.getNewCodeFromOldCode.and.returnValue(of(null));
    apiServiceSpy.getGroupMapping.and.returnValue(of(null));

    const snackbarServiceSpy = createMockSnackbarService();



      TestBed.configureTestingModule({
      imports: [
        IsbtAttributeLookupComponent,
        ReactiveFormsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: IsbtAttributeLookupApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        },
      ],
    });


    


      apiServiceSpy.searchAttributes.calls.reset();


      apiServiceSpy.getAttributeGroup.calls.reset();


      apiServiceSpy.getAttributeGroupsLov.calls.reset();


      apiServiceSpy.getNewCodesLov.calls.reset();


      apiServiceSpy.getOldCodesLov.calls.reset();


      apiServiceSpy.getProductsLov.calls.reset();


      apiServiceSpy.getProductFormula.calls.reset();
      apiServiceSpy.getOldCodeFromNewCode.calls.reset();
      apiServiceSpy.getNewCodeFromOldCode.calls.reset();
      apiServiceSpy.getGroupMapping.calls.reset();


      apiServiceSpy.getAttributeGroupsLov.and.returnValue(of([]));


      apiServiceSpy.getNewCodesLov.and.returnValue(of([]));


      apiServiceSpy.getOldCodesLov.and.returnValue(of([]));


      apiServiceSpy.getProductsLov.and.returnValue(of([]));


      apiServiceSpy.getAttributeGroup.and.returnValue(of(mockAttributeGroup));


      apiServiceSpy.searchAttributes.and.returnValue(of([]));


      apiServiceSpy.getProductFormula.and.returnValue(of(mockProductFormula));

      apiServiceSpy.getOldCodeFromNewCode.and.returnValue(of(null));
      apiServiceSpy.getNewCodeFromOldCode.and.returnValue(of(null));
      apiServiceSpy.getGroupMapping.and.returnValue(of(null));


    apiService = TestBed.inject(IsbtAttributeLookupApiService) as jasmine.SpyObj<IsbtAttributeLookupApiService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    fixture = TestBed.createComponent(IsbtAttributeLookupComponent);
    component = fixture.componentInstance;


    });


  describe('Component Initialization', () => {
    it('should initialize with empty forms', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.productForm).toBeDefined();
      expect(component.searchForm.value).toEqual({
        attribGroup: '',
        oldGroup: '',
        attribCode: '',
        oldAttribCode: '',
        attribDesc: '',
      });
    });

    it('should load all LOV options on init', () => {
      apiService.getAttributeGroupsLov.and.returnValue(of(mockAttributeGroupOptions));
      apiService.getNewCodesLov.and.returnValue(of(mockNewCodeOptions));
      apiService.getOldCodesLov.and.returnValue(of(mockOldCodeOptions));
      apiService.getProductsLov.and.returnValue(of(mockProductOptions));

      fixture.detectChanges();

      expect(apiService.getAttributeGroupsLov).toHaveBeenCalled();
      expect(apiService.getNewCodesLov).toHaveBeenCalled();
      expect(apiService.getOldCodesLov).toHaveBeenCalled();
      expect(apiService.getProductsLov).toHaveBeenCalled();
      expect(component.attributeGroupOptions()).toEqual(mockAttributeGroupOptions);
      expect(component.newCodeOptions()).toEqual(mockNewCodeOptions);
      expect(component.oldCodeOptions()).toEqual(mockOldCodeOptions);
      expect(component.productOptions()).toEqual(mockProductOptions);
    });

    it('should handle error when loading attribute groups fails', () => {
      apiService.getAttributeGroupsLov.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      apiService.getNewCodesLov.and.returnValue(of([]));
      apiService.getOldCodesLov.and.returnValue(of([]));
      apiService.getProductsLov.and.returnValue(of([]));

      fixture.detectChanges();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Failed to load attribute groups'
      );
    });

    it('should handle error when loading new codes fails', () => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      apiService.getOldCodesLov.and.returnValue(of([]));
      apiService.getProductsLov.and.returnValue(of([]));

      fixture.detectChanges();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Failed to load new ISBT codes'
      );
    });

    it('should handle error when loading old codes fails', () => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(of([]));
      apiService.getOldCodesLov.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      apiService.getProductsLov.and.returnValue(of([]));

      fixture.detectChanges();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Failed to load old codes'
      );
    });

    it('should handle error when loading product options fails', () => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(of([]));
      apiService.getOldCodesLov.and.returnValue(of([]));
      apiService.getProductsLov.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Failed to load product codes'
      );
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(of([]));
      apiService.getOldCodesLov.and.returnValue(of([]));
      apiService.getProductsLov.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should search attributes by group successfully', () => {
      apiService.searchAttributes.and.returnValue(of(mockSearchResults));
      component.attributeGroup.set(mockAttributeGroup);
      component.hasAnySearchValue.set(true);

      component.onRetrieve();

      expect(apiService.searchAttributes).toHaveBeenCalledWith(
        jasmine.objectContaining({
          attribGroup: 'V0020',
          oldGroup: 'J',
        })
      );
      expect(component.searchResults()).toEqual(mockSearchResults);
      expect(component.hasSearched()).toBe(true);
      // Success notification removed - no longer showing "Found X record(s)"
      expect(snackbarService.showSuccess).not.toHaveBeenCalled();
    });

    it('should search attributes by code successfully', () => {
      apiService.searchAttributes.and.returnValue(of(mockSearchResults));
      component.searchForm.patchValue({ attribCode: 'V002001' });
      component.hasAnySearchValue.set(true);

      component.onRetrieve();

      expect(apiService.searchAttributes).toHaveBeenCalledWith(
        jasmine.objectContaining({
          attribCode: 'V002001',
        })
      );
      expect(component.searchResults()).toEqual(mockSearchResults);
    });

    it('should search attributes by old code successfully', () => {
      apiService.searchAttributes.and.returnValue(of(mockSearchResults));
      component.searchForm.patchValue({ oldAttribCode: 'J1' });
      component.hasAnySearchValue.set(true);

      component.onRetrieve();

      expect(apiService.searchAttributes).toHaveBeenCalledWith(
        jasmine.objectContaining({
          oldAttribCode: 'J1',
        })
      );
    });

    it('should handle search with no results', () => {
      apiService.searchAttributes.and.returnValue(of([]));
      component.searchForm.patchValue({ attribCode: 'INVALID' });
      component.hasAnySearchValue.set(true);

      component.onRetrieve();

      expect(component.searchResults()).toEqual([]);
      expect(snackbarService.showInfo).toHaveBeenCalledWith('No records found');
    });



    it('should set loading state during search', fakeAsync(() => {
      // Use a delayed observable to catch the loading state
      let resolveSearch: any;
      const delayedObservable = new Observable<IsbtAttributeDto[]>((observer) => {
        resolveSearch = () => {
          observer.next(mockSearchResults);
          observer.complete();
        };
      });

      apiService.searchAttributes.and.returnValue(delayedObservable);
      component.searchForm.patchValue({ attribCode: 'V002001' });
      component.hasAnySearchValue.set(true);

      expect(component.isSearchLoading()).toBe(false);

      component.onRetrieve();
      expect(component.isSearchLoading()).toBe(true);

      resolveSearch();
      tick();
      expect(component.isSearchLoading()).toBe(false);
    }));
  });

  describe('Attribute Group Lookup', () => {
    beforeEach(() => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(of([]));
      apiService.getOldCodesLov.and.returnValue(of([]));
      apiService.getProductsLov.and.returnValue(of([]));
      apiService.getAttributeGroup.and.returnValue(of(mockAttributeGroup));
      fixture.detectChanges();
    });

    it('should lookup attribute group when new group is selected', fakeAsync(() => {
      apiService.getAttributeGroup.and.returnValue(of(mockAttributeGroup));

      component.searchForm.patchValue({ attribGroup: 'V0020' });
      tick();

      expect(apiService.getAttributeGroup).toHaveBeenCalledWith('V0020');
      expect(component.attributeGroup()).toEqual(mockAttributeGroup);
      expect(component.searchForm.get('oldGroup')?.value).toBe('J');
    }));

    it('should lookup attribute group when old group is selected', fakeAsync(() => {
      apiService.getAttributeGroup.and.returnValue(of(mockAttributeGroup));

      component.searchForm.patchValue({ oldGroup: 'J' });
      tick();

      expect(apiService.getAttributeGroup).toHaveBeenCalledWith('J');
      expect(component.attributeGroup()).toEqual(mockAttributeGroup);
      expect(component.searchForm.get('attribGroup')?.value).toBe('V0020');
    }));

    it('should clear attribute group when cleared', fakeAsync(() => {
      component.attributeGroup.set(mockAttributeGroup);

      component.searchForm.patchValue({ attribGroup: '' });
      tick();

      expect(component.attributeGroup()).toBeNull();
    }));

    it('should handle attribute group not found', fakeAsync(() => {
      apiService.getAttributeGroup.and.returnValue(
        throwError(() => ({ status: 404 }))
      );

      component.searchForm.patchValue({ attribGroup: 'INVALID' });
      tick();

      expect(snackbarService.showError).toHaveBeenCalled();
      expect(component.attributeGroup()).toBeNull();
    }));
  });

  describe('Product Formula Lookup', () => {
    beforeEach(() => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(of([]));
      apiService.getOldCodesLov.and.returnValue(of([]));
      apiService.getProductsLov.and.returnValue(of(mockProductOptions));
      fixture.detectChanges();
    });

    it('should load product formula when product code is selected', fakeAsync(() => {
      apiService.getProductFormula.and.returnValue(of(mockProductFormula));

      component.productForm.patchValue({ productCode: '016545656' });
      tick();

      expect(apiService.getProductFormula).toHaveBeenCalledWith('016545656');
      expect(component.productFormula()).toEqual(mockProductFormula);
      expect(component.isProductLoading()).toBe(false);
    }));

    it('should clear formula when product code is cleared', fakeAsync(() => {
      component.productFormula.set(mockProductFormula);

      component.productForm.patchValue({ productCode: '' });
      tick();

      expect(component.productFormula()).toBeNull();
    }));

    it('should handle product formula error', fakeAsync(() => {
      apiService.getProductFormula.and.returnValue(
        throwError(() => new Error('Product not found'))
      );

      component.productForm.patchValue({ productCode: 'INVALID' });
      tick();

      expect(snackbarService.showError).toHaveBeenCalled();
      expect(component.productFormula()).toBeNull();
    }));

    it('should set loading state during product lookup', fakeAsync(() => {
      let resolveProduct: any;
      const delayedObservable = new Observable<ProductFormulaDto>((observer) => {
        resolveProduct = () => {
          observer.next(mockProductFormula);
          observer.complete();
        };
      });
      apiService.getProductFormula.and.returnValue(delayedObservable);

      expect(component.isProductLoading()).toBe(false);

      component.productForm.patchValue({ productCode: '016545656' });
      expect(component.isProductLoading()).toBe(true);

      resolveProduct();
      tick();
      expect(component.isProductLoading()).toBe(false);
    }));
  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(of([]));
      apiService.getOldCodesLov.and.returnValue(of([]));
      apiService.getProductsLov.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should clear all form fields and results', () => {
      component.searchForm.patchValue({
        attribGroup: 'V0020',
        oldGroup: 'J',
        attribCode: 'V002001',
        oldAttribCode: 'J1',
        attribDesc: 'Test',
      });
      component.productForm.patchValue({ productCode: '016545656' });
      component.searchResults.set(mockSearchResults);
      component.attributeGroup.set(mockAttributeGroup);
      component.productFormula.set(mockProductFormula);
      component.hasSearched.set(true);
      component.hasAnySearchValue.set(true);

      component.onClearAll();

      expect(component.searchForm.value).toEqual({
        attribGroup: null,
        oldGroup: null,
        attribCode: null,
        oldAttribCode: null,
        attribDesc: null,
      });
      expect(component.productForm.value).toEqual({
        productCode: null,
      });
      expect(component.searchResults()).toEqual([]);
      expect(component.attributeGroup()).toBeNull();
      expect(component.productFormula()).toBeNull();
      expect(component.hasSearched()).toBe(false);
      expect(component.hasAnySearchValue()).toBe(false);
    });
  });

  describe('Input Transformation', () => {
    beforeEach(() => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(of([]));
      apiService.getOldCodesLov.and.returnValue(of([]));
      apiService.getProductsLov.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should transform search form input to uppercase', () => {
      component.searchForm.patchValue({ attribDesc: 'test description' });
      component.toUpperCase('attribDesc');

      expect(component.searchForm.get('attribDesc')?.value).toBe('TEST DESCRIPTION');
    });

    it('should transform product form input to uppercase', () => {
      component.productForm.patchValue({ productCode: 'abc123' });
      component.toUpperCase('productCode');

      expect(component.productForm.get('productCode')?.value).toBe('ABC123');
    });

    it('should handle empty values when transforming to uppercase', () => {
      component.searchForm.patchValue({ attribDesc: '' });
      component.toUpperCase('attribDesc');

      expect(component.searchForm.get('attribDesc')?.value).toBe('');
    });
  });

  describe('Computed Values', () => {
    beforeEach(() => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(of([]));
      apiService.getOldCodesLov.and.returnValue(of([]));
      apiService.getProductsLov.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should compute hasResults correctly', () => {
      expect(component.hasResults()).toBe(false);

      component.searchResults.set(mockSearchResults);

      expect(component.hasResults()).toBe(true);
    });

    it('should compute showEmptyState correctly', () => {
      component.hasSearched.set(true);
      component.searchResults.set([]);
      component.isSearchLoading.set(false);

      expect(component.showEmptyState()).toBe(true);

      component.searchResults.set(mockSearchResults);

      expect(component.showEmptyState()).toBe(false);
    });

    it('should compute isRetrieveDisabled correctly', () => {
      // Disabled when no search value
      component.hasAnySearchValue.set(false);
      component.isSearchLoading.set(false);
      expect(component.isRetrieveDisabled()).toBe(true);

      // Enabled when has search value and not loading
      component.hasAnySearchValue.set(true);
      component.isSearchLoading.set(false);
      expect(component.isRetrieveDisabled()).toBe(false);

      // Disabled when loading
      component.hasAnySearchValue.set(true);
      component.isSearchLoading.set(true);
      expect(component.isRetrieveDisabled()).toBe(true);
    });

    it('should compute canShowClearAll correctly', () => {
      component.hasSearched.set(false);
      expect(component.canShowClearAll()).toBe(false);

      component.hasSearched.set(true);
      expect(component.canShowClearAll()).toBe(true);
    });
  });

  describe('Dropdown Filtering', () => {
    beforeEach(() => {
      apiService.getAttributeGroupsLov.and.returnValue(of(mockAttributeGroupOptions));
      apiService.getNewCodesLov.and.returnValue(of(mockNewCodeOptions));
      apiService.getOldCodesLov.and.returnValue(of(mockOldCodeOptions));
      apiService.getProductsLov.and.returnValue(of(mockProductOptions));
      fixture.detectChanges();
    });







    it('should filter old group options', fakeAsync(() => {
      component.oldGroupSearchControl.setValue('V0020');
      tick();

      expect(component.filteredOldGroupOptions().length).toBe(1);
    }));



    it('should filter new code options by description', fakeAsync(() => {
      component.attribCodeSearchControl.setValue('Default');
      tick();

      expect(component.filteredNewCodeOptions().length).toBe(1);
    }));





    it('should filter product options by description', fakeAsync(() => {
      component.productCodeSearchControl.setValue('Test Product');
      tick();

      expect(component.filteredProductOptions().length).toBe(1);
    }));

    it('should handle case-insensitive filtering', fakeAsync(() => {
      component.attribGroupSearchControl.setValue('dosage');
      tick();

      expect(component.filteredAttribGroupOptions().length).toBe(1);
    }));
  });

  describe('Auto-population', () => {
    beforeEach(() => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(of(mockNewCodeOptions));
      apiService.getOldCodesLov.and.returnValue(of(mockOldCodeOptions));
      apiService.getProductsLov.and.returnValue(of([]));

      // Mock code mapping APIs used by the component's valueChanges watchers
      apiService.getOldCodeFromNewCode.and.callFake((code: string) => {
        if (code === 'V002001') {
          return of({ attribCode: 'V002001', oldAttribCode: 'J1', attribDesc: '*Default Not Indicated' });
        }
        if (code === 'V002002') {
          return of({ attribCode: 'V002002', oldAttribCode: 'J2', attribDesc: 'From 2 Donors' });
        }
        return of(null);
      });

      apiService.getNewCodeFromOldCode.and.callFake((code: string) => {
        if (code === 'J1') {
          return of({ attribCode: 'V002001', oldAttribCode: 'J1', attribDesc: '*Default Not Indicated' });
        }
        return of(null);
      });

      fixture.detectChanges();
    });

    it('should auto-populate description when new code is selected', fakeAsync(() => {
      component.searchForm.patchValue({ attribCode: 'V002001' });
      tick();

      expect(component.searchForm.get('attribDesc')?.value).toBe('*Default Not Indicated');
    }));

    it('should auto-populate description when old code is selected (without new code)', fakeAsync(() => {
      component.searchForm.patchValue({ oldAttribCode: 'J1' });
      tick();

      expect(component.searchForm.get('attribDesc')?.value).toBe('*Default Not Indicated');
    }));

    it('should clear and auto-populate when old code is selected even if new code exists', fakeAsync(() => {
      component.searchForm.patchValue({
        attribCode: 'V002002',
        attribDesc: 'From 2 Donors'
      });
      tick();

      component.searchForm.patchValue({ oldAttribCode: 'J1' });
      tick();

      // When old code is selected, it clears first then auto-populates new code
      expect(component.searchForm.get('attribDesc')?.value).toBe('*Default Not Indicated');
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      apiService.getAttributeGroupsLov.and.returnValue(of([]));
      apiService.getNewCodesLov.and.returnValue(of([]));
      apiService.getOldCodesLov.and.returnValue(of([]));
      apiService.getProductsLov.and.returnValue(of([]));
      fixture.detectChanges();
    });





    it('should track hasAnySearchValue when form changes', fakeAsync(() => {
      // Clear the form by calling onClearAll which properly resets the state
      component.onClearAll();
      tick();

      expect(component.hasAnySearchValue()).toBe(false);

      component.searchForm.patchValue({ attribGroup: 'V0020' });
      tick();

      expect(component.hasAnySearchValue()).toBe(true);

      component.onClearAll();
      tick();

      expect(component.hasAnySearchValue()).toBe(false);
    }));
  });


});
