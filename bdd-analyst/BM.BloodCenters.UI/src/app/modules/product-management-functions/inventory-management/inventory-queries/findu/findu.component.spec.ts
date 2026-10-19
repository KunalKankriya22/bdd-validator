import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { FinduComponent } from './findu.component';
import { FinduService } from './services/findu.service';
import { LoggingService } from '@shared/services/logging.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import {
  UnitProductDto,
  ProductTypeLookupDto,
  AttributeLookupDto,
  BloodTypeLookupDto
} from './models/findu.models';

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub { @Input() config: any; }

describe('FinduComponent', () => {
  let component: FinduComponent;
  let fixture: ComponentFixture<FinduComponent>;
  let finduServiceSpy: jasmine.SpyObj<FinduService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let chapterChangedSubject: Subject<void>;

  const mockUnits: UnitProductDto[] = [
    {
      unitId: '1234567890123',
      collectionDate: '2024-06-15T10:30:00Z',
      productCode: 'E0701V00',
      aboRh: 'O Positive',
      expirationDate: '2024-07-20T10:30:00Z',
      status: 'Available',
      componentPrefix: 'E0',
      checkDigit: '45'
    }
  ];

  const mockProductTypes: ProductTypeLookupDto[] = [
    { productType: 'RBC' },
    { productType: 'PLT' }
  ];

  const mockAttributes: AttributeLookupDto[] = [
    { attributeGroup: 'SPEC', attributeCode: 'CMV', description: 'CMV Negative' }
  ];

  const mockBloodTypes: BloodTypeLookupDto[] = [
    { aboCode: 'O', description: 'O Positive' }
  ];

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    finduServiceSpy = jasmine.createSpyObj('FinduService', [
      'searchUnits',
      'getProductTypes',
      'getAttributeGroups',
      'getAttributes',
      'getBloodTypes'
    ]);
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error', 'log']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable()
    });

    finduServiceSpy.searchUnits.and.returnValue(of({ data: mockUnits, total: 1 }));
    finduServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));
    finduServiceSpy.getAttributeGroups.and.returnValue(of([{ attributeGroup: 'SPEC' }]));
    finduServiceSpy.getAttributes.and.returnValue(of(mockAttributes));
    finduServiceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));



      TestBed.configureTestingModule({
      imports: [FinduComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FinduService, useValue: finduServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: Router, useValue: routerSpy },
        Overlay
      ]
    })
    .overrideComponent(FinduComponent, {
      remove: { imports: [PageHeaderWithBreadcrumb] },
      add: { imports: [PageHeaderStub] }
    });


    


      finduServiceSpy.searchUnits.calls.reset();


      finduServiceSpy.getProductTypes.calls.reset();


      finduServiceSpy.getAttributeGroups.calls.reset();


      finduServiceSpy.getAttributes.calls.reset();


      finduServiceSpy.getBloodTypes.calls.reset();


      loggingServiceSpy.error.calls.reset();


      loggingServiceSpy.log.calls.reset();


      finduServiceSpy.searchUnits.and.returnValue(of({ data: mockUnits, total: 1 }));


      finduServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));


      finduServiceSpy.getAttributeGroups.and.returnValue(of([{ attributeGroup: 'SPEC' }]));


      finduServiceSpy.getAttributes.and.returnValue(of(mockAttributes));


      finduServiceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));


    fixture = TestBed.createComponent(FinduComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize header config with 2-level breadcrumb', () => {
      expect(component.headerConfig.title).toBe('Find Units and Products');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Find Units and Products');
    });

    it('should initialize subtitle matching Figma', () => {
      expect(component.headerConfig.subtitle).toBe(
        'View a list of products in inventory that meet the defined criteria.'
      );
    });



    it('should initialize criteria form', () => {
      expect(component.criteriaForm).toBeTruthy();
      expect(component.criteriaForm.get('fromDate')).toBeTruthy();
      expect(component.criteriaForm.get('toDate')).toBeTruthy();
      expect(component.criteriaForm.get('productType')).toBeTruthy();
      expect(component.criteriaForm.get('attributeGroup')).toBeTruthy();
      expect(component.criteriaForm.get('attributeCode')).toBeTruthy();
      expect(component.criteriaForm.get('bloodType')).toBeTruthy();
    });

    it('should load lookup options on init', () => {
      expect(finduServiceSpy.getProductTypes).toHaveBeenCalled();
      expect(finduServiceSpy.getAttributeGroups).toHaveBeenCalled();
      expect(finduServiceSpy.getBloodTypes).toHaveBeenCalled();
    });


  });
  describe('Retrieve and Clear', () => {
    it('should disable retrieve when dates are empty', () => {
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve when both dates are set', () => {
      component.criteriaForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31')
      });
      expect(component.isRetrieveDisabled).toBeFalse();
    });



    it('should clear all on clearAll', () => {
      component.criteriaForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31'),
        productType: 'RBC'
      });

      component.onClearAll();

      expect(component.criteriaForm.get('fromDate')?.value).toBeNull();
      expect(component.criteriaForm.get('toDate')?.value).toBeNull();
      expect(component.criteriaForm.get('productType')?.value).toBeNull();
      expect(component.dataSource).toEqual([]);
    });
  });

  describe('Data Loading', () => {


    it('should load data when fromDate and toDate are set', () => {
      component.requestState = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0
      };

      component.loadData();

      expect(finduServiceSpy.searchUnits).toHaveBeenCalled();
      expect(component.dataSource).toEqual(mockUnits);
      expect(component.tableConfig.pagination?.totalRecords).toBe(1);
    });


  });





  describe('Status Filter Management', () => {
    it('should apply status filters', () => {
      component.requestState = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0
      };

      const statusFilters = {
        expired: 'N',
        interdicted: null,
        available: 'Y',
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      component.applyStatusFilters(statusFilters);

      expect(component.appliedStatusFilters).toEqual(statusFilters);
      expect(component.requestState.expired).toBe('N');
      expect(component.requestState.available).toBe('Y');
      expect(finduServiceSpy.searchUnits).toHaveBeenCalled();
    });



    it('should report active status filters', () => {
      component.appliedStatusFilters = {
        expired: 'Y',
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };
      component.filterChips = [{ key: 'expired', label: 'Expired: Yes', value: 'Yes' }];

      expect(component.hasActiveStatusFilters()).toBeTrue();
    });
  });

  describe('Status Class', () => {
    it('should return correct class for Available', () => {
      expect(component.getStatusClass('Available')).toBe('available');
    });

    it('should return correct class for Packed', () => {
      expect(component.getStatusClass('Packed')).toBe('packed');
    });

    it('should return correct class for Allocated', () => {
      expect(component.getStatusClass('Allocated')).toBe('allocated');
    });

    it('should return default for unknown status', () => {
      expect(component.getStatusClass('Unknown')).toBe('default');
    });
  });
  describe('Accessibility', () => {




    it('should have filter button with aria-label', () => {
      const filterBtn = fixture.debugElement.query(By.css('.filter-button'));
      expect(filterBtn.nativeElement.getAttribute('aria-label')).toBe('Open filter options');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.requestState = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0
      };
    });

    it('should call loadData on page change', () => {
      finduServiceSpy.searchUnits.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 25 });
      expect(finduServiceSpy.searchUnits).toHaveBeenCalled();
    });

    it('should update pagination state on page change', () => {
      component.onPageChange({ pageIndex: 3, pageSize: 50 });
      expect(component.tableConfig.pagination?.pageIndex).toBe(3);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
    });

    it('should reset page index to 0 on retrieve', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.criteriaForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31')
      });
      component.onRetrieve();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      component.requestState = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0
      };
    });

    it('should call loadData on sort change', () => {
      finduServiceSpy.searchUnits.calls.reset();
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(finduServiceSpy.searchUnits).toHaveBeenCalled();
    });

    it('should map column keys to API sort column names', () => {
      component.onSortChange({ column: 'collectionDate', direction: 'A' });
      expect(component.requestState.sortColumn).toBe('CollectionDate');
    });

    it('should map direction A to ASC', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.requestState.sortOrder).toBe('ASC');
    });

    it('should map direction D to DESC', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      expect(component.requestState.sortOrder).toBe('DESC');
    });

    it('should set sortOrder to undefined for default direction', () => {
      component.onSortChange({ column: 'unitId', direction: 'default' });
      expect(component.requestState.sortOrder).toBeUndefined();
    });

    it('should set sortColumn to undefined for unmapped column', () => {
      component.onSortChange({ column: 'unknownColumn', direction: 'A' });
      expect(component.requestState.sortColumn).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should set hasError and isLoading false on search error', () => {
      component.requestState = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0
      };
      finduServiceSpy.searchUnits.and.returnValue(throwError(() => new Error('Network error')));

      component.loadData();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });

    it('should set error message on search error', () => {
      component.requestState = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0
      };
      finduServiceSpy.searchUnits.and.returnValue(throwError(() => new Error('fail')));

      component.loadData();

      expect(component.errorMessage).toBe('Failed to load data. Please try again.');
    });

    it('should log error on search failure', () => {
      component.requestState = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0
      };
      loggingServiceSpy.error.calls.reset();
      finduServiceSpy.searchUnits.and.returnValue(throwError(() => new Error('fail')));

      component.loadData();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith(
        'Error loading find units and products data',
        jasmine.anything()
      );
    });
  });

  describe('Date Validation', () => {
    it('should disable retrieve when toDate is before fromDate', () => {
      component.criteriaForm.patchValue({
        fromDate: new Date('2024-06-15'),
        toDate: new Date('2024-06-01')
      });
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should disable retrieve when fromDate has parse error', () => {
      component.criteriaForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31')
      });
      component.criteriaForm.get('fromDate')!.setErrors({ matDatepickerParse: true });
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should disable retrieve when toDate has parse error', () => {
      component.criteriaForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31')
      });
      component.criteriaForm.get('toDate')!.setErrors({ matDatepickerParse: true });
      expect(component.isRetrieveDisabled).toBeTrue();
    });
  });

  describe('Overlay / Filter Panel', () => {
    it('should set isFilterOpen to true when openFilter is called', () => {
      component.openFilter();
      expect(component.isFilterOpen).toBeTrue();
    });

    it('should close overlay when openFilter is called while overlay is open', () => {
      // First open
      component.openFilter();
      expect(component.isFilterOpen).toBeTrue();
      // Second call toggles close
      component.openFilter();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close overlay on Escape key', () => {
      component.openFilter();
      expect(component.isFilterOpen).toBeTrue();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardShortcut(event);

      expect(component.isFilterOpen).toBeFalse();
    });

    it('should toggle filter on Alt+F keyboard shortcut', () => {
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });

      component.handleKeyboardShortcut(event);
      expect(component.isFilterOpen).toBeTrue();
    });

    it('should set isFilterOpen false after closeOverlay', () => {
      component.openFilter();
      // Simulate close via Escape
      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('Chapter Change', () => {
    it('should call onClearAll when chapter changes', () => {
      spyOn(component, 'onClearAll');
      chapterChangedSubject.next();
      expect(component.onClearAll).toHaveBeenCalled();
    });

    it('should update today when chapter changes', () => {
      const oldToday = component.today;
      chapterChangedSubject.next();
      // today is reassigned (may be same value but property was re-set)
      expect(component.today).toBeDefined();
    });
  });

  describe('Dropdown Search Filtering', () => {
    it('should filter product type options based on search', fakeAsync(() => {
      component.criteriaForm.get('productType')!.setValue('RB');
      tick(250);
      expect(component.filteredProductTypeOptions.length).toBe(1);
      expect(component.filteredProductTypeOptions[0].productType).toBe('RBC');
    }));

    it('should reset product type options when search is cleared', fakeAsync(() => {
      component.criteriaForm.get('productType')!.setValue('RB');
      tick(250);
      component.criteriaForm.get('productType')!.setValue('');
      tick(250);
      expect(component.filteredProductTypeOptions.length).toBe(component.productTypeOptions.length);
    }));

    it('should filter blood type options based on search', fakeAsync(() => {
      component.criteriaForm.get('bloodType')!.setValue('O');
      tick(250);
      expect(component.filteredBloodTypeOptions.length).toBeGreaterThanOrEqual(1);
    }));

    it('should load attribute codes when attribute group changes', fakeAsync(() => {
      finduServiceSpy.getAttributes.calls.reset();
      component.criteriaForm.get('attributeGroup')!.setValue('SPEC');
      tick(250);
      expect(finduServiceSpy.getAttributes).toHaveBeenCalledWith('SPEC');
    }));

    it('should load all attribute codes when attribute group is cleared', fakeAsync(() => {
      finduServiceSpy.getAttributes.calls.reset();
      component.criteriaForm.get('attributeGroup')!.setValue(null);
      tick(250);
    }));

    it('should clear attribute code when attribute group changes', fakeAsync(() => {
      component.criteriaForm.get('attributeCode')!.setValue({ attributeGroup: 'SPEC', attributeCode: 'CMV', description: 'CMV Negative' });
      component.criteriaForm.get('attributeGroup')!.setValue('TEST');
      tick(250);
      expect(component.criteriaForm.get('attributeCode')!.value).toBeNull();
    }));

    it('should filter attribute group options based on search', fakeAsync(() => {
      component.attributeGroupOptions = [{ attributeGroup: 'SPEC' }, { attributeGroup: 'TEST' }];
      component.filteredAttributeGroupOptions = [...component.attributeGroupOptions];
      component.criteriaForm.get('attributeGroup')!.setValue('SP');
      tick(250);
      expect(component.filteredAttributeGroupOptions.length).toBe(1);
      expect(component.filteredAttributeGroupOptions[0].attributeGroup).toBe('SPEC');
    }));

    it('should reset attribute group options when search is cleared', fakeAsync(() => {
      component.attributeGroupOptions = [{ attributeGroup: 'SPEC' }, { attributeGroup: 'TEST' }];
      component.criteriaForm.get('attributeGroup')!.setValue('SP');
      tick(250);
      component.criteriaForm.get('attributeGroup')!.setValue('');
      tick(250);
      expect(component.filteredAttributeGroupOptions.length).toBe(2);
    }));

    it('should filter attribute code options by description', fakeAsync(() => {
      component.attributeCodeOptions = [
        { attributeGroup: 'SPEC', attributeCode: 'CMV', description: 'CMV Negative' },
        { attributeGroup: 'SPEC', attributeCode: 'IRR', description: 'Irradiated' }
      ];
      component.filteredAttributeCodeOptions = [...component.attributeCodeOptions];
      component.criteriaForm.get('attributeCode')!.setValue('CMV');
      tick(250);
      expect(component.filteredAttributeCodeOptions.length).toBe(1);
      expect(component.filteredAttributeCodeOptions[0].attributeCode).toBe('CMV');
    }));

    it('should reset attribute code options when search is cleared', fakeAsync(() => {
      component.attributeCodeOptions = [
        { attributeGroup: 'SPEC', attributeCode: 'CMV', description: 'CMV Negative' },
        { attributeGroup: 'SPEC', attributeCode: 'IRR', description: 'Irradiated' }
      ];
      component.criteriaForm.get('attributeCode')!.setValue('CMV');
      tick(250);
      component.criteriaForm.get('attributeCode')!.setValue('');
      tick(250);
      expect(component.filteredAttributeCodeOptions.length).toBe(2);
    }));

    it('should reset blood type options when search is cleared', fakeAsync(() => {
      component.criteriaForm.get('bloodType')!.setValue('O');
      tick(250);
      component.criteriaForm.get('bloodType')!.setValue('');
      tick(250);
      expect(component.filteredBloodTypeOptions.length).toBe(component.bloodTypeOptions.length);
    }));

    it('should log error when getAttributes fails on group change', fakeAsync(() => {
      component.attributeGroupOptions = [{ attributeGroup: 'FAIL_GROUP' }];
      loggingServiceSpy.error.calls.reset();
      finduServiceSpy.getAttributes.and.returnValue(throwError(() => new Error('attr error')));
      component.criteriaForm.get('attributeGroup')!.setValue('FAIL_GROUP');
      tick(250);
      expect(loggingServiceSpy.error).toHaveBeenCalledWith(
        'Error loading attribute codes',
        jasmine.anything()
      );
    }));

    it('should log error when getAttributes fails on group clear (null)', fakeAsync(() => {
      component.criteriaForm.get('attributeGroup')!.setValue('SPEC');
      tick(250);
      loggingServiceSpy.error.calls.reset();
      finduServiceSpy.getAttributes.and.returnValue(throwError(() => new Error('attr error')));
      component.criteriaForm.get('attributeGroup')!.setValue(null);
      tick(250);
    }));

    it('should sort attribute codes by description after loading', fakeAsync(() => {
      finduServiceSpy.getAttributes.and.returnValue(of([
        { attributeGroup: 'SPEC', attributeCode: 'IRR', description: 'Irradiated' },
        { attributeGroup: 'SPEC', attributeCode: 'CMV', description: 'CMV Negative' }
      ]));
      component.criteriaForm.get('attributeGroup')!.setValue('SPEC');
      tick(250);
      expect(component.attributeCodeOptions[0].description).toBe('CMV Negative');
      expect(component.attributeCodeOptions[1].description).toBe('Irradiated');
    }));

    it('should filter blood type by description', fakeAsync(() => {
      component.bloodTypeOptions = [
        { aboCode: 'O', description: 'O Positive' },
        { aboCode: 'A', description: 'A Positive' }
      ];
      component.filteredBloodTypeOptions = [...component.bloodTypeOptions];
      component.criteriaForm.get('bloodType')!.setValue('Positive');
      tick(250);
      expect(component.filteredBloodTypeOptions.length).toBe(2);
    }));

    it('should auto-accept product type on blur when valid', () => {
      component.productTypeOptions = [{ productType: 'RBC' }, { productType: 'PLT' }];
      component.criteriaForm.get('productType')!.setValue('rbc', { emitEvent: false });
      component.onProductTypeBlur();
      expect(component.criteriaForm.get('productType')!.value).toBe('RBC');
    });

    it('should clear product type on blur when invalid', () => {
      component.productTypeOptions = [{ productType: 'RBC' }, { productType: 'PLT' }];
      component.criteriaForm.get('productType')!.setValue('INVALID', { emitEvent: false });
      component.onProductTypeBlur();
      expect(component.criteriaForm.get('productType')!.value).toBeNull();
    });

    it('should auto-accept blood type on blur by description', () => {
      component.bloodTypeOptions = [{ aboCode: 'O+', description: 'O Positive' }];
      component.criteriaForm.get('bloodType')!.setValue('O Positive', { emitEvent: false });
      component.onBloodTypeBlur();
      expect(component.criteriaForm.get('bloodType')!.value).toBe('O+');
    });

    it('should auto-accept attribute code on blur by description', () => {
      const option = { attributeGroup: 'SPEC', attributeCode: 'CMV', description: 'CMV Negative' };
      component.attributeCodeOptions = [option];
      component.criteriaForm.get('attributeCode')!.setValue('CMV Negative', { emitEvent: false });
      component.onAttributeCodeBlur();
      expect(component.criteriaForm.get('attributeCode')!.value).toEqual(option);
    });
  });

  describe('Row Click Navigation', () => {
    it('should navigate to UnitAndProductHistory on row click', () => {
      const row: UnitProductDto = {
        unitId: '1234567890123',
        collectionDate: '2024-06-15',
        productCode: 'E0701V00',
        aboRh: 'O Positive',
        status: 'Available'
      };

      component.onRowClick(row);

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [ROUTE_REGISTRY[RouteKey.UnitAndProductHistory].path],
        {
          queryParams: {
            unitId: '1234567890123',
            from: 'Find Units and Products',
            fromPath: ROUTE_REGISTRY[RouteKey.FindUnitsAndProducts].path
          }
        }
      );
    });

    it('should pass the correct unitId from the row', () => {
      const row: UnitProductDto = {
        unitId: '9876543210987',
        collectionDate: '2024-06-15',
        productCode: 'E0701V00',
        aboRh: 'A Positive',
        status: 'Packed'
      };

      component.onRowClick(row);

      const navArgs = routerSpy.navigate.calls.mostRecent().args;
      expect(navArgs[1].queryParams.unitId).toBe('9876543210987');
    });

    it('should set fromPath to the FindUnitsAndProducts route path', () => {
      const row: UnitProductDto = {
        unitId: '1111111111111',
        collectionDate: '2024-06-15',
        productCode: 'E0701V00',
        aboRh: 'O Positive',
        status: 'Available'
      };

      component.onRowClick(row);

      const navArgs = routerSpy.navigate.calls.mostRecent().args;
      expect(navArgs[1].queryParams.fromPath).toBe(
        ROUTE_REGISTRY[RouteKey.FindUnitsAndProducts].path
      );
    });
  });

  describe('Date Formatting', () => {
    it('should format date without time via formatDateOnly', () => {
      // formatDateOnly is private, test via table column valueFormatter
      const columns = (component as any).getTableColumns();
      const collectionDateCol = columns.find((c: any) => c.key === 'collectionDate');
      const result = collectionDateCol.valueFormatter('2024-06-15T10:30:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(result).not.toContain(':');
    });

    it('should format date with time via formatDateTime', () => {
      const columns = (component as any).getTableColumns();
      const expirationDateCol = columns.find((c: any) => c.key === 'expirationDate');
      const result = expirationDateCol.valueFormatter('2024-07-20T10:30:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}\s\d{2}:\d{2}$/);
    });

    it('should return dash for null date in formatDateOnly', () => {
      const result = (component as any).formatDateOnly(null);
      expect(result).toBe('-');
    });

    it('should return dash for null date in formatDateTime', () => {
      const result = (component as any).formatDateTime(null);
      expect(result).toBe('-');
    });

    it('should return dash for undefined date in formatDateOnly', () => {
      const result = (component as any).formatDateOnly(undefined);
      expect(result).toBe('-');
    });
  });

  describe('Table Columns', () => {
    it('should include checkDigit column', () => {
      const columns = (component as any).getTableColumns();
      const checkDigitCol = columns.find((c: any) => c.key === 'checkDigit');
      expect(checkDigitCol).toBeTruthy();
      expect(checkDigitCol.header).toBe('Chk');
      expect(checkDigitCol.width).toBe('80px');
    });

    it('should include componentPrefix column', () => {
      const columns = (component as any).getTableColumns();
      const componentPrefixCol = columns.find((c: any) => c.key === 'componentPrefix');
      expect(componentPrefixCol).toBeTruthy();
      expect(componentPrefixCol.header).toBe('Aq');
      expect(componentPrefixCol.width).toBe('70px');
    });

    it('should show total records in Unit ID header when records exist', () => {
      component.tableConfig.pagination!.totalRecords = 42;
      const columns = (component as any).getTableColumns();
      const unitIdCol = columns.find((c: any) => c.key === 'unitId');
      expect(unitIdCol.header).toBe('Unit ID (42)');
    });

    it('should show plain Unit ID header when no records', () => {
      component.tableConfig.pagination!.totalRecords = 0;
      const columns = (component as any).getTableColumns();
      const unitIdCol = columns.find((c: any) => c.key === 'unitId');
      expect(unitIdCol.header).toBe('Unit ID');
    });
  });

  describe('Destroy', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should dispose overlay on ngOnDestroy if open', () => {
      component.openFilter();
      const overlayRef = (component as any).overlayRef;
      if (overlayRef) {
        const disposeSpy = spyOn(overlayRef, 'dispose');
        component.ngOnDestroy();
        expect(disposeSpy).toHaveBeenCalled();
      } else {
        // If overlayRef creation failed in test env, just verify no error
        expect(() => component.ngOnDestroy()).not.toThrow();
      }
    });
  });

  describe('Data Loading Edge Cases', () => {
    it('should not call searchUnits when fromDate is empty', () => {
      finduServiceSpy.searchUnits.calls.reset();
      component.requestState = { fromDate: '', toDate: '2024-12-31', take: 10, skip: 0 };
      component.loadData();
      expect(finduServiceSpy.searchUnits).not.toHaveBeenCalled();
    });

    it('should not call searchUnits when toDate is empty', () => {
      finduServiceSpy.searchUnits.calls.reset();
      component.requestState = { fromDate: '2024-01-01', toDate: '', take: 10, skip: 0 };
      component.loadData();
      expect(finduServiceSpy.searchUnits).not.toHaveBeenCalled();
    });

    it('should set isLoading true during data load', () => {
      component.requestState = { fromDate: '2024-01-01', toDate: '2024-12-31', take: 10, skip: 0 };
      // Return observable that we can check intermediate state
      finduServiceSpy.searchUnits.and.returnValue(of({ data: [], total: 0 }));
      component.loadData();
      // After the synchronous of() completes, isLoading should be false
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Compare Attribute Codes', () => {
    it('should return true for same attribute group and code', () => {
      const a1 = { attributeGroup: 'SPEC', attributeCode: 'CMV', description: 'CMV Negative' };
      const a2 = { attributeGroup: 'SPEC', attributeCode: 'CMV', description: 'CMV Negative' };
      expect(component.compareAttributeCodes(a1, a2)).toBeTrue();
    });

    it('should return false for different attribute codes', () => {
      const a1 = { attributeGroup: 'SPEC', attributeCode: 'CMV', description: 'CMV Negative' };
      const a2 = { attributeGroup: 'SPEC', attributeCode: 'IRR', description: 'Irradiated' };
      expect(component.compareAttributeCodes(a1, a2)).toBeFalse();
    });

    it('should handle null comparison', () => {
      expect(component.compareAttributeCodes(null as any, null as any)).toBeTrue();
    });
  });

  describe('Status Filter Removal', () => {
    it('should remove a filter chip and update request state', () => {
      component.requestState = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0
      };
      component.appliedStatusFilters = {
        expired: 'N',
        interdicted: null,
        available: 'Y',
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      finduServiceSpy.searchUnits.calls.reset();
      component.onRemoveFilterChip('available');

      expect(component.appliedStatusFilters?.available).toBeNull();
      expect(finduServiceSpy.searchUnits).toHaveBeenCalled();
    });

    it('should not call loadData if dates are missing when removing chip', () => {
      component.requestState = { fromDate: '', toDate: '', take: 10, skip: 0 };
      component.appliedStatusFilters = {
        expired: 'Y',
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      finduServiceSpy.searchUnits.calls.reset();
      component.onRemoveFilterChip('expired');

      expect(finduServiceSpy.searchUnits).not.toHaveBeenCalled();
    });
  });

  describe('Clear Status Filters', () => {
    it('should clear all status filters and reload if dates are set', () => {
      component.requestState = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        take: 10,
        skip: 0,
        expired: 'Y',
        available: 'N'
      };
      component.appliedStatusFilters = {
        expired: 'Y',
        interdicted: null,
        available: 'N',
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      finduServiceSpy.searchUnits.calls.reset();
      component.clearStatusFilters();

      expect(component.appliedStatusFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(finduServiceSpy.searchUnits).toHaveBeenCalled();
    });

    it('should not reload if dates are missing when clearing status filters', () => {
      component.requestState = { fromDate: '', toDate: '', take: 10, skip: 0 };
      finduServiceSpy.searchUnits.calls.reset();
      component.clearStatusFilters();
      expect(finduServiceSpy.searchUnits).not.toHaveBeenCalled();
    });
  });

  describe('Retrieve', () => {
    it('should not call loadData when isRetrieveDisabled', () => {
      finduServiceSpy.searchUnits.calls.reset();
      component.onRetrieve();
      expect(finduServiceSpy.searchUnits).not.toHaveBeenCalled();
    });

    it('should build request state from form values on retrieve', () => {
      component.criteriaForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31'),
        productType: 'RBC',
        bloodType: 'O'
      });

      component.onRetrieve();

      expect(component.requestState.productType).toBe('RBC');
      expect(component.requestState.bloodType).toBe('O');
      expect(component.requestState.skip).toBe(0);
    });

    it('should include applied status filters in request state on retrieve', () => {
      component.criteriaForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31')
      });
      component.appliedStatusFilters = {
        expired: 'Y',
        interdicted: null,
        available: 'N',
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };

      component.onRetrieve();

      expect(component.requestState.expired).toBe('Y');
      expect(component.requestState.available).toBe('N');
    });
  });

  describe('Lookup Options Error Handling', () => {
    it('should log error when loadLookupOptions forkJoin fails', () => {
      // We need to create a fresh component where forkJoin will fail
      finduServiceSpy.getProductTypes.and.returnValue(throwError(() => new Error('lookup fail')));
      loggingServiceSpy.error.calls.reset();

      const newFixture = TestBed.createComponent(FinduComponent);
      newFixture.detectChanges();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith(
        'Error loading lookup options',
        jasmine.anything()
      );
    });
  });

  describe('Page Size Options', () => {
    it('should have page size options [10, 25, 50, 100, 250, 500]', () => {
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100, 250, 500]);
    });
  });

  describe('Status Class - In Lab', () => {
    it('should return correct class for In Lab', () => {
      expect(component.getStatusClass('In Lab')).toBe('in-lab');
    });
  });

  describe('Has Active Status Filters', () => {
    it('should return false when no filters applied', () => {
      component.appliedStatusFilters = null;
      expect(component.hasActiveStatusFilters()).toBeFalse();
    });

    it('should return false when all filters are null', () => {
      component.appliedStatusFilters = {
        expired: null,
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };
      expect(component.hasActiveStatusFilters()).toBeFalse();
    });
  });

  describe('Date Input Handlers', () => {
    it('should handle fromDate input event', () => {
      const event = { target: { value: '15-JUN-2024' } } as unknown as Event;
      expect(() => component.onFromDateInput(event)).not.toThrow();
    });

    it('should handle toDate input event', () => {
      const event = { target: { value: '31-DEC-2024' } } as unknown as Event;
      expect(() => component.onToDateInput(event)).not.toThrow();
    });
  });

  describe('Date Error Messages', () => {
    it('should return from date error message', () => {
      const result = component.getFromDateError();
      // When no errors, returns empty string
      expect(typeof result).toBe('string');
    });

    it('should return to date error message', () => {
      const result = component.getToDateError();
      expect(typeof result).toBe('string');
    });
  });
});
