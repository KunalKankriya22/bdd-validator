import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';

import { UnitComponentAttributesQueryComponent } from './unit-component-attributes-query.component';
import { UnitComponentAttributesApiService } from './services/unit-component-attributes-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import {
  UnitAttributeDto,
  ComponentAttributeDto,
  ApiResponse,
  CpqQueryAttributesResponseDto,
  CpqUnitValidationResponseDto,
  ProductCodeLovDto,
} from './models/unit-component-attributes.interface';

describe('UnitComponentAttributesQueryComponent', () => {
  let apiSpy: any;
  let component: UnitComponentAttributesQueryComponent;
  let fixture: ComponentFixture<UnitComponentAttributesQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<UnitComponentAttributesApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<void>;

  const mockUnitAttribute: UnitAttributeDto = {
    attribCode: 'ATTR001',
    attribDesc: 'Test Attribute',
    attribGroup: 'LAB',
    attribType: 'A',
    insertDate: '2024-01-15T10:30:00Z',
    insertUserId: 'USER01'
  };

  const mockComponentAttribute: ComponentAttributeDto = {
    productCode: 'RBC001',
    attribCode: 'CATTR01',
    attribDesc: 'Component Attribute',
    attribGroup: 'COMP',
    insertDate: '2024-01-15T11:00:00Z',
    procDate: '2024-01-15T12:00:00Z',
    insertUserId: 'USER02'
  };

  const mockValidationResponse: ApiResponse<CpqUnitValidationResponseDto> = {
    success: true,
    statusCode: 200,
    message: 'Unit validated successfully.',
    data: {
      unitId: 'TEST12345',
      collectionDate: '2024-01-15T00:00:00Z',
      codeScheme: 'I'
    }
  };

  const mockQueryResponse: ApiResponse<CpqQueryAttributesResponseDto> = {
    success: true,
    statusCode: 200,
    message: 'Successfully retrieved 2 attribute(s).',
    data: {
      unitAttributes: [mockUnitAttribute],
      componentAttributes: [mockComponentAttribute],
      messages: []
    }
  };

  const mockProductCodesResponse: ApiResponse<ProductCodeLovDto[]> = {
    success: true,
    statusCode: 200,
    message: 'Successfully retrieved product codes.',
    data: [
      { productCode: 'RBC001', productDesc: 'Red Blood Cells' }
    ]
  };

  const mockUnitValidationEvent: UnitValidationResponse = {
    parsedUnitId: 'TEST12345',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: 'TEST12345',
    codabarUnitScheme: null,
    entryMode: 'M',
    barcodeType: 'CODE128',
    chapterScheme: 'I'
  };

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiSpy = jasmine.createSpyObj('UnitComponentAttributesApiService', [
      'validateUnit',
      'queryAttributes',
      'getProductCodes',
      'getUnitAttributesPaginated',
      'getComponentAttributesPaginated',
      'getUnitAttributesFilterOptions',
      'getComponentAttributesFilterOptions'
    ]);
    const snackbarSpy = createMockSnackbarService();
    const headerSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
    });

    TestBed.configureTestingModule({
      imports: [
        UnitComponentAttributesQueryComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UnitComponentAttributesApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: PageHeaderService, useValue: {
          pageHeaderData: signal(undefined),
          getCurrentMenuItem: jasmine.createSpy().and.returnValue(undefined),
          getTitle: jasmine.createSpy().and.returnValue(''),
          getSubtitle: jasmine.createSpy().and.returnValue(''),
        }},
      ]
    });
  });

  beforeEach(() => {

    apiServiceSpy = TestBed.inject(UnitComponentAttributesApiService) as jasmine.SpyObj<UnitComponentAttributesApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    fixture = TestBed.createComponent(UnitComponentAttributesQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });

  describe('onUnitValidated', () => {
    it('should not proceed if parsedUnitId is empty', () => {
      component.onUnitValidated({ ...mockUnitValidationEvent, parsedUnitId: '' });
      expect(apiServiceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should validate unit and fetch attributes for active tab on success', () => {
      const mockUnitPaginatedResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockUnitAttribute],
        total: 1
      };
      const mockUnitFilterOptionsResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { attribCodes: [], attribGroups: [], users: [] }
      };
      const mockComponentFilterOptionsResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { productCodes: [], attribCodes: [], attribGroups: [], users: [] }
      };

      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of(mockUnitFilterOptionsResponse));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of(mockComponentFilterOptionsResponse));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of(mockUnitPaginatedResponse));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith('TEST12345');
      expect(component.filteredUnitAttributes().length).toBe(1);
      expect(apiServiceSpy.getComponentAttributesPaginated).not.toHaveBeenCalled();
    });

    it('should show error when collection date is missing', () => {
      const noCollDateResponse: ApiResponse<CpqUnitValidationResponseDto> = {
        ...mockValidationResponse,
        data: { unitId: 'TEST12345', collectionDate: null, codeScheme: 'I' }
      };
      apiServiceSpy.validateUnit.and.returnValue(of(noCollDateResponse));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Collection date not found for this unit.');
      expect(apiServiceSpy.queryAttributes).not.toHaveBeenCalled();
    });

    it('should show error on validation failure', () => {
      const failResponse: ApiResponse<CpqUnitValidationResponseDto> = {
        success: false,
        statusCode: 404,
        message: 'Unit not found',
      };
      apiServiceSpy.validateUnit.and.returnValue(of(failResponse));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unit not found');
      expect(component.hasResults()).toBe(false);
    });

    it('should handle validation API error', () => {
      const errorResponse = { error: { message: 'Server error' } };
      apiServiceSpy.validateUnit.and.returnValue(throwError(() => errorResponse));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.hasResults()).toBe(false);
    });

    it('should show tabs with empty state when active tab has no attributes', () => {
      const mockUnitFilterOptionsResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { attribCodes: [], attribGroups: [], users: [] }
      };
      const mockComponentFilterOptionsResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { productCodes: [], attribCodes: [], attribGroups: [], users: [] }
      };
      const emptyUnitResponse = {
        success: true,
        statusCode: 200,
        message: 'No unit level attributes found.',
        errorCode: '0209',
        data: [],
        total: 0
      };

      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of(mockUnitFilterOptionsResponse));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of(mockComponentFilterOptionsResponse));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of(emptyUnitResponse));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(component.hasResults()).toBe(true);
      expect(component.filteredUnitAttributes().length).toBe(0);
      expect(component.unitAttributesMessage()).toBe('No unit level attributes found.');
      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
    });

    it('should handle query API error for active tab', () => {
      const mockUnitFilterOptionsResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { attribCodes: [], attribGroups: [], users: [] }
      };
      const mockComponentFilterOptionsResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { productCodes: [], attribCodes: [], attribGroups: [], users: [] }
      };

      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of(mockUnitFilterOptionsResponse));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of(mockComponentFilterOptionsResponse));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(apiServiceSpy.getComponentAttributesPaginated).not.toHaveBeenCalled();
    });
  });

  describe('onUnitCleared', () => {
    it('should reset all results', () => {
      component.onUnitCleared();

      expect(component.filteredUnitAttributes().length).toBe(0);
      expect(component.filteredComponentAttributes().length).toBe(0);
      expect(component.hasResults()).toBe(false);
      expect(component.componentIdControl.value).toBe('');
    });
  });

  describe('onComponentIdChange', () => {
    it('should call API and update description when product code selected', () => {
      const mockComponentPaginatedResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockComponentAttribute],
        total: 1
      };

      component.componentOptions.set([{ productCode: 'RBC001', productDesc: 'Red Blood Cells' }]);
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of(mockComponentPaginatedResponse));

      component.componentIdControl.setValue('RBC001');
      component.onComponentIdChange();

      expect(component.selectedDescription).toBe('Red Blood Cells');
      expect(apiServiceSpy.getComponentAttributesPaginated).toHaveBeenCalled();
    });

    it('should populate componentOptions from product codes endpoint', () => {
      const mockUnitPaginatedResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockUnitAttribute],
        total: 1
      };
      const mockUnitFilterOptionsResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { attribCodes: [], attribGroups: [], users: [] }
      };
      const mockComponentFilterOptionsResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { productCodes: [], attribCodes: [], attribGroups: [], users: [] }
      };

      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of(mockUnitFilterOptionsResponse));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of(mockComponentFilterOptionsResponse));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of(mockUnitPaginatedResponse));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(component.componentOptions().length).toBe(1);
      expect(component.componentOptions()[0].productCode).toBe('RBC001');
    });
  });

  describe('onUnitTableSearch', () => {
    it('should call API with search keyword', () => {
      const mockUnitPaginatedResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockUnitAttribute],
        total: 1
      };

      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of(mockUnitPaginatedResponse));

      component.onUnitTableSearch('ATTR001');

      expect(apiServiceSpy.getUnitAttributesPaginated).toHaveBeenCalled();
    });

    it('should reset page index when searching', () => {
      const mockUnitPaginatedResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        total: 0
      };

      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of(mockUnitPaginatedResponse));
      component.unitAttributesTableConfig.pagination!.pageIndex = 5;

      component.onUnitTableSearch('Test');

      expect(component.unitAttributesTableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('onComponentTableSearch', () => {
    it('should call API with search keyword', () => {
      const mockComponentPaginatedResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockComponentAttribute],
        total: 1
      };

      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of(mockComponentPaginatedResponse));

      component.onComponentTableSearch('RBC');

      expect(apiServiceSpy.getComponentAttributesPaginated).toHaveBeenCalled();
    });

    it('should reset page index when searching', () => {
      const mockComponentPaginatedResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        total: 0
      };

      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of(mockComponentPaginatedResponse));
      component.componentAttributesTableConfig.pagination!.pageIndex = 5;

      component.onComponentTableSearch('Test');

      expect(component.componentAttributesTableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('ngOnInit', () => {
    it('should clear results and unitIdField on chapter change', () => {
      component['currentUnitId'] = 'UNIT1';
      component['currentCollDate'] = '2024-01-01';
      component.unitIdField = { clear: jasmine.createSpy() } as any;

      chapterChangedSubject.next();

      expect(component['currentUnitId']).toBe('');
      expect(component.hasResults()).toBe(false);
      expect(component.unitIdField.clear).toHaveBeenCalled();
    });

    it('should not throw if unitIdField is not set on chapter change', () => {
      (component as any).unitIdField = undefined;
      expect(() => chapterChangedSubject.next()).not.toThrow();
    });

    it('should update componentSearch signal when componentSearchCtrl changes', () => {
      component.componentSearchCtrl.setValue('test');
      expect(component['componentSearch']()).toBe('test');
    });

    it('should set componentSearch to empty string when componentSearchCtrl is null', () => {
      component.componentSearchCtrl.setValue(null);
      expect(component['componentSearch']()).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should dispose unit overlay on destroy', () => {
      const overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = overlayRefSpy;

      component.ngOnDestroy();

      expect(overlayRefSpy.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
    });

    it('should dispose comp overlay on destroy', () => {
      const overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['compOverlayRef'] = overlayRefSpy;

      component.ngOnDestroy();

      expect(overlayRefSpy.dispose).toHaveBeenCalled();
      expect(component['compOverlayRef']).toBeNull();
    });

    it('should not throw when no overlays exist on destroy', () => {
      component['overlayRef'] = null;
      component['compOverlayRef'] = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('onComponentSelectOpenedChange', () => {
    it('should clear componentSearchCtrl when opened', () => {
      component.componentSearchCtrl.setValue('existing search');
      component.onComponentSelectOpenedChange(true);
      expect(component.componentSearchCtrl.value).toBe('');
    });

    it('should not change componentSearchCtrl when closed', () => {
      component.componentSearchCtrl.setValue('existing search');
      component.onComponentSelectOpenedChange(false);
      expect(component.componentSearchCtrl.value).toBe('existing search');
    });
  });

  describe('onComponentIdChange - additional', () => {
    it('should truncate description at pipe character', () => {
      component.componentOptions.set([
        { productCode: 'PLT001', productDesc: 'Platelets | Apheresis' }
      ]);
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.componentIdControl.setValue('PLT001');
      component.onComponentIdChange();

      expect(component.selectedDescription).toBe('Platelets');
    });

    it('should set empty description when product code not found in options', () => {
      component.componentOptions.set([]);
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.componentIdControl.setValue('UNKNOWN');
      component.onComponentIdChange();

      expect(component.selectedDescription).toBe('');
    });

    it('should reset page index to 0 when product code changes', () => {
      component.componentAttributesTableConfig = {
        ...component.componentAttributesTableConfig,
        pagination: { ...component.componentAttributesTableConfig.pagination!, pageIndex: 5 }
      };
      component.componentOptions.set([]);
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onComponentIdChange();

      expect(component.componentAttributesTableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should use full description when no pipe character present', () => {
      component.componentOptions.set([
        { productCode: 'RBC001', productDesc: 'Red Blood Cells' }
      ]);
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.componentIdControl.setValue('RBC001');
      component.onComponentIdChange();

      expect(component.selectedDescription).toBe('Red Blood Cells');
    });
  });

  describe('onTabChange', () => {
    it('should set selectedTabIndex and load unit data for tab 0', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onTabChange(0);

      expect(component.selectedTabIndex).toBe(0);
      expect(apiServiceSpy.getUnitAttributesPaginated).toHaveBeenCalled();
    });

    it('should set selectedTabIndex and load component data for tab 1', () => {
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onTabChange(1);

      expect(component.selectedTabIndex).toBe(1);
      expect(apiServiceSpy.getComponentAttributesPaginated).toHaveBeenCalled();
    });
  });

  describe('onUnitTablePageChange', () => {
    it('should update pagination and reload data', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [mockUnitAttribute], total: 1
      }));

      component.onUnitTablePageChange({ pageIndex: 2, pageSize: 50 });

      expect(component.unitAttributesTableConfig.pagination!.pageIndex).toBe(2);
      expect(component.unitAttributesTableConfig.pagination!.pageSize).toBe(50);
      expect(apiServiceSpy.getUnitAttributesPaginated).toHaveBeenCalled();
    });

    it('should pass correct skip value to API', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitTablePageChange({ pageIndex: 3, pageSize: 25 });

      const callArgs = apiServiceSpy.getUnitAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[0]).toBe(25);
      expect(callArgs[1]).toBe(75);
    });
  });

  describe('onUnitTableSortChange', () => {
    it('should update sort config, reset page, and reload data', () => {
      component.unitAttributesTableConfig = {
        ...component.unitAttributesTableConfig,
        pagination: { ...component.unitAttributesTableConfig.pagination!, pageIndex: 3 }
      };
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitTableSortChange({ column: 'attribCode', direction: 'A' });

      expect(component.unitAttributesTableConfig.sortConfig).toEqual({ column: 'attribCode', direction: 'A' });
      expect(component.unitAttributesTableConfig.pagination!.pageIndex).toBe(0);
      expect(apiServiceSpy.getUnitAttributesPaginated).toHaveBeenCalled();
    });

    it('should pass ASC sort order to API when direction is A', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitTableSortChange({ column: 'attribCode', direction: 'A' });

      const callArgs = apiServiceSpy.getUnitAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('AttribCode');
      expect(callArgs[2].sortOrder).toBe('ASC');
    });

    it('should pass DESC sort order to API when direction is D', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitTableSortChange({ column: 'attribCode', direction: 'D' });

      const callArgs = apiServiceSpy.getUnitAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('AttribCode');
      expect(callArgs[2].sortOrder).toBe('DESC');
    });

    it('should pass null sortOrder when direction is default', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitTableSortChange({ column: 'attribCode', direction: 'default' as any });

      const callArgs = apiServiceSpy.getUnitAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[2].sortOrder).toBeNull();
    });

    it('should pass null sortColumn for non-attribCode columns', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitTableSortChange({ column: 'someOtherColumn', direction: 'A' });

      const callArgs = apiServiceSpy.getUnitAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBeNull();
    });
  });

  describe('onComponentTablePageChange', () => {
    it('should update pagination and reload data', () => {
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [mockComponentAttribute], total: 1
      }));

      component.onComponentTablePageChange({ pageIndex: 3, pageSize: 100 });

      expect(component.componentAttributesTableConfig.pagination!.pageIndex).toBe(3);
      expect(component.componentAttributesTableConfig.pagination!.pageSize).toBe(100);
      expect(apiServiceSpy.getComponentAttributesPaginated).toHaveBeenCalled();
    });

    it('should pass correct skip value to API', () => {
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onComponentTablePageChange({ pageIndex: 2, pageSize: 50 });

      const callArgs = apiServiceSpy.getComponentAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[0]).toBe(50);
      expect(callArgs[1]).toBe(100);
    });
  });

  describe('onComponentTableSortChange', () => {
    it('should update sort config, reset page, and reload data', () => {
      component.componentAttributesTableConfig = {
        ...component.componentAttributesTableConfig,
        pagination: { ...component.componentAttributesTableConfig.pagination!, pageIndex: 3 }
      };
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onComponentTableSortChange({ column: 'productCode', direction: 'A' });

      expect(component.componentAttributesTableConfig.sortConfig).toEqual({ column: 'productCode', direction: 'A' });
      expect(component.componentAttributesTableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should pass ProductCode sort column to API for productCode column', () => {
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onComponentTableSortChange({ column: 'productCode', direction: 'D' });

      const callArgs = apiServiceSpy.getComponentAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('ProductCode');
      expect(callArgs[2].sortOrder).toBe('DESC');
    });

    it('should pass null sortColumn for non-productCode columns', () => {
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onComponentTableSortChange({ column: 'attribCode', direction: 'A' });

      const callArgs = apiServiceSpy.getComponentAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBeNull();
    });
  });

  describe('Unit Filter operations', () => {
    describe('hasActiveUnitFilters', () => {
      it('should return false when no filters applied', () => {
        component.appliedUnitFilters = null;
        expect(component.hasActiveUnitFilters()).toBe(false);
      });

      it('should return true when attribCode filter is applied', () => {
        component.appliedUnitFilters = { attribCode: 'ABC' };
        expect(component.hasActiveUnitFilters()).toBe(true);
      });

      it('should return true when attribGroup filter is applied', () => {
        component.appliedUnitFilters = { attribGroup: 'GRP' };
        expect(component.hasActiveUnitFilters()).toBe(true);
      });

      it('should return true when insertUserId filter is applied', () => {
        component.appliedUnitFilters = { insertUserId: 'USER01' };
        expect(component.hasActiveUnitFilters()).toBe(true);
      });

      it('should return false when all filter fields are empty', () => {
        component.appliedUnitFilters = {};
        expect(component.hasActiveUnitFilters()).toBe(false);
      });
    });

    describe('onRemoveUnitFilterChip', () => {
      it('should do nothing when no filters are applied', () => {
        component.appliedUnitFilters = null;
        component.onRemoveUnitFilterChip('attribCode');
        expect(component.appliedUnitFilters).toBeNull();
      });

      it('should remove attribCode chip and keep remaining filters', () => {
        component.appliedUnitFilters = { attribCode: 'ABC', attribGroup: 'GRP' };
        component.unitFilterChips = [
          { key: 'attribCode', label: 'Attribute Code: ABC', value: 'ABC', removable: true },
          { key: 'attribGroup', label: 'Attribute Type: GRP', value: 'GRP', removable: true }
        ];
        apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
          success: true, statusCode: 200, message: '', data: [], total: 0
        }));

        component.onRemoveUnitFilterChip('attribCode');

        expect(component.appliedUnitFilters?.attribCode).toBeUndefined();
        expect(component.appliedUnitFilters?.attribGroup).toBe('GRP');
        expect(apiServiceSpy.getUnitAttributesPaginated).toHaveBeenCalled();
      });

      it('should clear all filters when last chip is removed', () => {
        component.appliedUnitFilters = { attribCode: 'ABC' };
        component.unitFilterChips = [
          { key: 'attribCode', label: 'Attribute Code: ABC', value: 'ABC', removable: true }
        ];
        apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
          success: true, statusCode: 200, message: '', data: [], total: 0
        }));

        component.onRemoveUnitFilterChip('attribCode');

        expect(component.appliedUnitFilters).toBeNull();
        expect(component.unitFilterChips).toEqual([]);
      });

      it('should reset page index when removing chip', () => {
        component.appliedUnitFilters = { attribCode: 'ABC', attribGroup: 'GRP' };
        component.unitAttributesTableConfig = {
          ...component.unitAttributesTableConfig,
          pagination: { ...component.unitAttributesTableConfig.pagination!, pageIndex: 3 }
        };
        apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
          success: true, statusCode: 200, message: '', data: [], total: 0
        }));

        component.onRemoveUnitFilterChip('attribCode');

        expect(component.unitAttributesTableConfig.pagination!.pageIndex).toBe(0);
      });
    });

    describe('clearAllUnitFilters', () => {
      it('should clear filters, chips, reset page, and reload', () => {
        component.appliedUnitFilters = { attribCode: 'ABC' };
        component.unitFilterChips = [
          { key: 'attribCode', label: 'Attribute Code: ABC', value: 'ABC', removable: true }
        ];
        component.unitAttributesTableConfig = {
          ...component.unitAttributesTableConfig,
          pagination: { ...component.unitAttributesTableConfig.pagination!, pageIndex: 5 }
        };
        apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
          success: true, statusCode: 200, message: '', data: [], total: 0
        }));

        component.clearAllUnitFilters();

        expect(component.appliedUnitFilters).toBeNull();
        expect(component.unitFilterChips).toEqual([]);
        expect(component.unitAttributesTableConfig.pagination!.pageIndex).toBe(0);
        expect(apiServiceSpy.getUnitAttributesPaginated).toHaveBeenCalled();
      });
    });

    describe('openUnitFilter', () => {
      let createSpy: jasmine.Spy;

      function setupOverlayMock(overrides?: {
        applySubject?: Subject<any>;
        closeSubject?: Subject<void>;
        backdropSubject?: Subject<void>;
        mockInstance?: any;
      }) {
        const applySubject = overrides?.applySubject || new Subject<any>();
        const closeSubject = overrides?.closeSubject || new Subject<void>();
        const backdropSubject = overrides?.backdropSubject || new Subject<void>();
        const mockInstance = overrides?.mockInstance || {
          currentFilters: null as any,
          filterOptions: null as any,
          apply: applySubject,
          close: closeSubject,
        };

        const mockRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
        mockRef.attach.and.returnValue({ instance: mockInstance });
        mockRef.backdropClick.and.returnValue(backdropSubject);

        createSpy = spyOn(component['overlay'], 'create').and.returnValue(mockRef);
        component.unitFilterBtn = { nativeElement: document.createElement('button') } as any;

        return { mockRef, mockInstance, applySubject, closeSubject, backdropSubject };
      }

      it('should close existing overlay when overlayRef exists (toggle off)', () => {
        const existingOverlay = jasmine.createSpyObj('OverlayRef', ['dispose']);
        component['overlayRef'] = existingOverlay;
        component.isUnitFilterOpen = true;

        component.openUnitFilter();

        expect(existingOverlay.dispose).toHaveBeenCalled();
        expect(component['overlayRef']).toBeNull();
        expect(component.isUnitFilterOpen).toBe(false);
      });

      it('should create overlay and set isUnitFilterOpen when no overlayRef', () => {
        const { mockRef } = setupOverlayMock();

        component.openUnitFilter();

        expect(component.isUnitFilterOpen).toBe(true);
        expect(createSpy).toHaveBeenCalled();
        expect(component['overlayRef']).toBe(mockRef);
      });

      it('should close overlay on backdrop click', () => {
        const { mockRef, backdropSubject } = setupOverlayMock();

        component.openUnitFilter();
        backdropSubject.next();

        expect(mockRef.dispose).toHaveBeenCalled();
        expect(component.isUnitFilterOpen).toBe(false);
      });

      it('should apply filters when filter panel emits apply event', () => {
        const applySubject = new Subject<any>();
        const { mockRef } = setupOverlayMock({ applySubject });

        apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
          success: true, statusCode: 200, message: '', data: [], total: 0
        }));

        component.openUnitFilter();
        applySubject.next({ attribCode: 'ABC' });

        expect(component.appliedUnitFilters).toEqual({ attribCode: 'ABC' });
        expect(component.unitFilterChips.length).toBeGreaterThan(0);
        expect(mockRef.dispose).toHaveBeenCalled();
      });

      it('should close overlay when filter panel emits close event', () => {
        const closeSubject = new Subject<void>();
        const { mockRef } = setupOverlayMock({ closeSubject });

        component.openUnitFilter();
        closeSubject.next();

        expect(mockRef.dispose).toHaveBeenCalled();
        expect(component.isUnitFilterOpen).toBe(false);
      });

      it('should pass current filters and filter options to panel instance', () => {
        component.appliedUnitFilters = { attribCode: 'TEST' };
        component.unitFilterOptions = { attribCodes: [], attribGroups: [], users: [] };

        const mockInstance = {
          currentFilters: null as any,
          filterOptions: null as any,
          apply: new Subject(),
          close: new Subject(),
        };
        setupOverlayMock({ mockInstance });

        component.openUnitFilter();

        expect(mockInstance.currentFilters).toEqual({ attribCode: 'TEST' });
        expect(mockInstance.filterOptions).toEqual({ attribCodes: [], attribGroups: [], users: [] });
      });
    });
  });

  describe('Component Filter operations', () => {
    describe('hasActiveCompFilters', () => {
      it('should return false when no filters applied', () => {
        component.appliedCompFilters = null;
        expect(component.hasActiveCompFilters()).toBe(false);
      });

      it('should return true when productCode filter is applied', () => {
        component.appliedCompFilters = { productCode: 'RBC001' };
        expect(component.hasActiveCompFilters()).toBe(true);
      });

      it('should return true when attribCode filter is applied', () => {
        component.appliedCompFilters = { attribCode: 'ATTR01' };
        expect(component.hasActiveCompFilters()).toBe(true);
      });

      it('should return false when all filter fields are empty', () => {
        component.appliedCompFilters = {};
        expect(component.hasActiveCompFilters()).toBe(false);
      });
    });

    describe('onRemoveCompFilterChip', () => {
      it('should do nothing when no filters are applied', () => {
        component.appliedCompFilters = null;
        component.onRemoveCompFilterChip('productCode');
        expect(component.appliedCompFilters).toBeNull();
      });

      it('should remove productCode chip and keep remaining filters', () => {
        component.appliedCompFilters = { productCode: 'RBC001', attribCode: 'ATTR01' };
        component.compFilterChips = [
          { key: 'productCode', label: 'Product Code: RBC001', value: 'RBC001', removable: true },
          { key: 'attribCode', label: 'Attribute Code: ATTR01', value: 'ATTR01', removable: true }
        ];
        apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
          success: true, statusCode: 200, message: '', data: [], total: 0
        }));

        component.onRemoveCompFilterChip('productCode');

        expect(component.appliedCompFilters?.productCode).toBeUndefined();
        expect(component.appliedCompFilters?.attribCode).toBe('ATTR01');
        expect(apiServiceSpy.getComponentAttributesPaginated).toHaveBeenCalled();
      });

      it('should clear all filters when last chip is removed', () => {
        component.appliedCompFilters = { productCode: 'RBC001' };
        component.compFilterChips = [
          { key: 'productCode', label: 'Product Code: RBC001', value: 'RBC001', removable: true }
        ];
        apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
          success: true, statusCode: 200, message: '', data: [], total: 0
        }));

        component.onRemoveCompFilterChip('productCode');

        expect(component.appliedCompFilters).toBeNull();
        expect(component.compFilterChips).toEqual([]);
      });

      it('should reset page index when removing chip', () => {
        component.appliedCompFilters = { productCode: 'RBC001', attribCode: 'ATTR01' };
        component.componentAttributesTableConfig = {
          ...component.componentAttributesTableConfig,
          pagination: { ...component.componentAttributesTableConfig.pagination!, pageIndex: 3 }
        };
        apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
          success: true, statusCode: 200, message: '', data: [], total: 0
        }));

        component.onRemoveCompFilterChip('productCode');

        expect(component.componentAttributesTableConfig.pagination!.pageIndex).toBe(0);
      });
    });

    describe('clearAllCompFilters', () => {
      it('should clear filters, chips, reset page, and reload', () => {
        component.appliedCompFilters = { productCode: 'RBC001' };
        component.compFilterChips = [
          { key: 'productCode', label: 'Product Code: RBC001', value: 'RBC001', removable: true }
        ];
        component.componentAttributesTableConfig = {
          ...component.componentAttributesTableConfig,
          pagination: { ...component.componentAttributesTableConfig.pagination!, pageIndex: 5 }
        };
        apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
          success: true, statusCode: 200, message: '', data: [], total: 0
        }));

        component.clearAllCompFilters();

        expect(component.appliedCompFilters).toBeNull();
        expect(component.compFilterChips).toEqual([]);
        expect(component.componentAttributesTableConfig.pagination!.pageIndex).toBe(0);
        expect(apiServiceSpy.getComponentAttributesPaginated).toHaveBeenCalled();
      });
    });

    describe('openCompFilter', () => {
      let createSpy: jasmine.Spy;

      function setupCompOverlayMock(overrides?: {
        applySubject?: Subject<any>;
        closeSubject?: Subject<void>;
        backdropSubject?: Subject<void>;
      }) {
        const applySubject = overrides?.applySubject || new Subject<any>();
        const closeSubject = overrides?.closeSubject || new Subject<void>();
        const backdropSubject = overrides?.backdropSubject || new Subject<void>();

        const mockRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
        mockRef.attach.and.returnValue({
          instance: {
            currentFilters: null,
            filterOptions: null,
            apply: applySubject,
            close: closeSubject,
          }
        });
        mockRef.backdropClick.and.returnValue(backdropSubject);

        createSpy = spyOn(component['overlay'], 'create').and.returnValue(mockRef);
        component.compFilterBtn = { nativeElement: document.createElement('button') } as any;

        return { mockRef, applySubject, closeSubject, backdropSubject };
      }

      it('should close existing overlay when compOverlayRef exists (toggle off)', () => {
        const existingOverlay = jasmine.createSpyObj('OverlayRef', ['dispose']);
        component['compOverlayRef'] = existingOverlay;
        component.isCompFilterOpen = true;

        component.openCompFilter();

        expect(existingOverlay.dispose).toHaveBeenCalled();
        expect(component['compOverlayRef']).toBeNull();
        expect(component.isCompFilterOpen).toBe(false);
      });

      it('should create overlay and set isCompFilterOpen when no compOverlayRef', () => {
        const { mockRef } = setupCompOverlayMock();

        component.openCompFilter();

        expect(component.isCompFilterOpen).toBe(true);
        expect(createSpy).toHaveBeenCalled();
        expect(component['compOverlayRef']).toBe(mockRef);
      });

      it('should close overlay on backdrop click', () => {
        const { mockRef, backdropSubject } = setupCompOverlayMock();

        component.openCompFilter();
        backdropSubject.next();

        expect(mockRef.dispose).toHaveBeenCalled();
        expect(component.isCompFilterOpen).toBe(false);
      });

      it('should apply filters when filter panel emits apply event', () => {
        const applySubject = new Subject<any>();
        const { mockRef } = setupCompOverlayMock({ applySubject });

        apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
          success: true, statusCode: 200, message: '', data: [], total: 0
        }));

        component.openCompFilter();
        applySubject.next({ productCode: 'RBC001' });

        expect(component.appliedCompFilters).toEqual({ productCode: 'RBC001' });
        expect(component.compFilterChips.length).toBeGreaterThan(0);
        expect(mockRef.dispose).toHaveBeenCalled();
      });

      it('should close overlay when filter panel emits close event', () => {
        const closeSubject = new Subject<void>();
        const { mockRef } = setupCompOverlayMock({ closeSubject });

        component.openCompFilter();
        closeSubject.next();

        expect(mockRef.dispose).toHaveBeenCalled();
        expect(component.isCompFilterOpen).toBe(false);
      });
    });
  });

  describe('filteredComponentOptions', () => {
    it('should return all options when no search text', () => {
      const options = [
        { productCode: 'RBC001', productDesc: 'Red Blood Cells' },
        { productCode: 'PLT001', productDesc: 'Platelets' }
      ];
      component.componentOptions.set(options);
      component.componentSearchCtrl.setValue('');

      expect(component.filteredComponentOptions().length).toBe(2);
    });

    it('should filter by product code (case insensitive)', () => {
      const options = [
        { productCode: 'RBC001', productDesc: 'Red Blood Cells' },
        { productCode: 'PLT001', productDesc: 'Platelets' }
      ];
      component.componentOptions.set(options);
      component.componentSearchCtrl.setValue('rbc');

      expect(component.filteredComponentOptions().length).toBe(1);
      expect(component.filteredComponentOptions()[0].productCode).toBe('RBC001');
    });

    it('should filter by product description', () => {
      const options = [
        { productCode: 'RBC001', productDesc: 'Red Blood Cells' },
        { productCode: 'PLT001', productDesc: 'Platelets' }
      ];
      component.componentOptions.set(options);
      component.componentSearchCtrl.setValue('Platelet');

      expect(component.filteredComponentOptions().length).toBe(1);
      expect(component.filteredComponentOptions()[0].productCode).toBe('PLT001');
    });

    it('should return empty when no match found', () => {
      const options = [
        { productCode: 'RBC001', productDesc: 'Red Blood Cells' }
      ];
      component.componentOptions.set(options);
      component.componentSearchCtrl.setValue('XYZ');

      expect(component.filteredComponentOptions().length).toBe(0);
    });

    it('should handle null productDesc gracefully', () => {
      const options = [
        { productCode: 'RBC001', productDesc: null }
      ];
      component.componentOptions.set(options);
      component.componentSearchCtrl.setValue('RBC');

      expect(component.filteredComponentOptions().length).toBe(1);
    });
  });

  describe('loadUnitAttributesData - response handling', () => {
    it('should set message without error code when total is 0 and message exists', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: 'No attributes found.', data: [], total: 0
      }));

      component.onUnitTableSearch('test');

      expect(component.unitAttributesMessage()).toBe('No attributes found.');
    });

    it('should clear message when results are returned', () => {
      component.unitAttributesMessage.set('Previous message');
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [mockUnitAttribute], total: 1
      }));

      component.onUnitTableSearch('test');

      expect(component.unitAttributesMessage()).toBe('');
    });

    it('should set empty array and zero total on unsuccessful response', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: false, statusCode: 500, message: 'Server error'
      }));

      component.onUnitTableSearch('test');

      expect(component.filteredUnitAttributes()).toEqual([]);
      expect(component.unitAttributesTableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should handle API error in loadUnitAttributesData', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(
        throwError(() => ({ error: { message: 'Network error' } }))
      );

      component.onUnitTableSearch('test');

      expect(component.filteredUnitAttributes()).toEqual([]);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should include applied filters in API call', () => {
      component.appliedUnitFilters = { attribCode: 'ABC', attribGroup: 'LAB', insertUserId: 'USER01' };
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitTableSearch('searchText');

      const callArgs = apiServiceSpy.getUnitAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[2].attribCode).toBe('ABC');
      expect(callArgs[2].attribGroup).toBe('LAB');
      expect(callArgs[2].insertUserId).toBe('USER01');
      expect(callArgs[2].searchKeyword).toBe('searchText');
    });

    it('should update total records from response', () => {
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [mockUnitAttribute], total: 42
      }));

      component.onUnitTableSearch('test');

      expect(component.unitAttributesTableConfig.pagination!.totalRecords).toBe(42);
    });
  });

  describe('loadComponentAttributesData - response handling', () => {
    it('should set message without error code when total is 0 and message exists', () => {
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: 'No component attributes found.', data: [], total: 0
      }));

      component.onComponentTableSearch('test');

      expect(component.compAttributesMessage()).toBe('No component attributes found.');
    });

    it('should set message without error code prefix when total is 0 and errorCode exists', () => {
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: 'Not found', errorCode: '0210', data: [], total: 0
      }));

      component.onComponentTableSearch('test');

      expect(component.compAttributesMessage()).toBe('Not found');
    });

    it('should clear message when results are returned', () => {
      component.compAttributesMessage.set('Previous message');
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [mockComponentAttribute], total: 1
      }));

      component.onComponentTableSearch('test');

      expect(component.compAttributesMessage()).toBe('');
    });

    it('should set empty array and zero total on unsuccessful response', () => {
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: false, statusCode: 500, message: 'Server error'
      }));

      component.onComponentTableSearch('test');

      expect(component.filteredComponentAttributes()).toEqual([]);
      expect(component.componentAttributesTableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should handle API error in loadComponentAttributesData', () => {
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(
        throwError(() => ({ error: { message: 'Network error' } }))
      );

      component.onComponentTableSearch('test');

      expect(component.filteredComponentAttributes()).toEqual([]);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should use componentIdControl value as productCode in API call', () => {
      component.componentIdControl.setValue('PLT001');
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onComponentTableSearch('test');

      const callArgs = apiServiceSpy.getComponentAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[2].productCode).toBe('PLT001');
    });

    it('should use filter productCode when componentIdControl is empty', () => {
      component.componentIdControl.setValue('');
      component.appliedCompFilters = { productCode: 'RBC001' };
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onComponentTableSearch('test');

      const callArgs = apiServiceSpy.getComponentAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[2].productCode).toBe('RBC001');
    });

    it('should use null productCode when both control and filter are empty', () => {
      component.componentIdControl.setValue('');
      component.appliedCompFilters = null;
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onComponentTableSearch('test');

      const callArgs = apiServiceSpy.getComponentAttributesPaginated.calls.mostRecent().args;
      expect(callArgs[2].productCode).toBeNull();
    });
  });

  describe('fetchAttributes - additional scenarios', () => {
    it('should set componentOptions to empty when product codes request fails', () => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(of({
        success: false, statusCode: 500, message: 'Failed'
      }));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { attribCodes: [], attribGroups: [], users: [] }
      }));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { productCodes: [], attribCodes: [], users: [] }
      }));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(component.componentOptions()).toEqual([]);
      expect(component.hasResults()).toBe(true);
    });

    it('should set unitFilterOptions to null when filter options request fails', () => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of({
        success: false, statusCode: 500, message: 'Failed'
      }));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { productCodes: [], attribCodes: [], users: [] }
      }));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(component.unitFilterOptions).toBeNull();
    });

    it('should set componentFilterOptions to null when filter options request fails', () => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { attribCodes: [], attribGroups: [], users: [] }
      }));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of({
        success: false, statusCode: 500, message: 'Failed'
      }));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(component.componentFilterOptions).toBeNull();
    });

    it('should load component attributes when tab 1 is active', () => {
      component.selectedTabIndex = 1;
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { attribCodes: [], attribGroups: [], users: [] }
      }));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { productCodes: [], attribCodes: [], users: [] }
      }));
      apiServiceSpy.getComponentAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [mockComponentAttribute], total: 1
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(apiServiceSpy.getComponentAttributesPaginated).toHaveBeenCalled();
      expect(component.filteredComponentAttributes().length).toBe(1);
    });

    it('should handle getProductCodes error via catchError', () => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(throwError(() => new Error('Network error')));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { attribCodes: [], attribGroups: [], users: [] }
      }));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { productCodes: [], attribCodes: [], users: [] }
      }));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(component.componentOptions()).toEqual([]);
      expect(component.hasResults()).toBe(true);
    });

    it('should store unitFilterOptions on successful response', () => {
      const filterOpts = { attribCodes: [{ code: 'A1', description: 'Attr 1' }], attribGroups: [], users: ['USER01'] };
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: filterOpts
      }));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { productCodes: [], attribCodes: [], users: [] }
      }));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(component.unitFilterOptions).toEqual(filterOpts);
    });
  });

  describe('onUnitValidated - additional scenarios', () => {
    it('should use default error message when validation response has no message', () => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        success: false, statusCode: 400, message: ''
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unit validation failed.');
    });

    it('should clear componentIdControl and selectedDescription on new validation', () => {
      component.componentIdControl.setValue('RBC001');
      component.selectedDescription = 'Red Blood Cells';
      component.componentOptions.set([{ productCode: 'RBC001', productDesc: 'Red Blood Cells' }]);

      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationResponse));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { attribCodes: [], attribGroups: [], users: [] }
      }));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { productCodes: [], attribCodes: [], users: [] }
      }));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(component.componentIdControl.value).toBe('');
      expect(component.selectedDescription).toBe('');
    });

    it('should use codeScheme from validation data when available', () => {
      const responseWithScheme = {
        ...mockValidationResponse,
        data: { unitId: 'TEST12345', collectionDate: '2024-01-15T00:00:00Z', codeScheme: 'C' }
      };
      apiServiceSpy.validateUnit.and.returnValue(of(responseWithScheme));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { attribCodes: [], attribGroups: [], users: [] }
      }));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { productCodes: [], attribCodes: [], users: [] }
      }));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(apiServiceSpy.getProductCodes).toHaveBeenCalledWith('TEST12345', '2024-01-15T00:00:00Z', 'C');
    });

    it('should fall back to event codeScheme when validation response codeScheme is null', () => {
      const responseNoScheme = {
        ...mockValidationResponse,
        data: { unitId: 'TEST12345', collectionDate: '2024-01-15T00:00:00Z', codeScheme: null }
      };
      apiServiceSpy.validateUnit.and.returnValue(of(responseNoScheme));
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
      apiServiceSpy.getUnitAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { attribCodes: [], attribGroups: [], users: [] }
      }));
      apiServiceSpy.getComponentAttributesFilterOptions.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { productCodes: [], attribCodes: [], users: [] }
      }));
      apiServiceSpy.getUnitAttributesPaginated.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: [], total: 0
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(apiServiceSpy.getProductCodes).toHaveBeenCalledWith('TEST12345', '2024-01-15T00:00:00Z', 'I');
    });

    it('should handle empty collection date string as missing', () => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        ...mockValidationResponse,
        data: { unitId: 'TEST12345', collectionDate: '', codeScheme: 'I' }
      }));

      component.onUnitValidated(mockUnitValidationEvent);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Collection date not found for this unit.');
    });
  });

  describe('constructor effect - pageHeaderData', () => {
    it('should update headerConfig when pageHeaderData is set', () => {
      const pageHeaderSvc = TestBed.inject(PageHeaderService);
      (pageHeaderSvc as any).pageHeaderData.set({ title: 'Test Page', subtitle: 'Test Subtitle' });
      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('Test Page');
      expect(component.headerConfig.subtitle).toBe('Test Subtitle');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
    });

    it('should handle pageHeaderData with empty subtitle', () => {
      const pageHeaderSvc = TestBed.inject(PageHeaderService);
      (pageHeaderSvc as any).pageHeaderData.set({ title: 'My Page', subtitle: '' });
      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('My Page');
      expect(component.headerConfig.subtitle).toBe('');
    });

    it('should handle pageHeaderData with no subtitle property', () => {
      const pageHeaderSvc = TestBed.inject(PageHeaderService);
      (pageHeaderSvc as any).pageHeaderData.set({ title: 'My Page' });
      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('My Page');
      expect(component.headerConfig.subtitle).toBe('');
    });
  });
});
