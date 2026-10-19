import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { OverlayModule, Overlay } from '@angular/cdk/overlay';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CustomerPreferredTierComponent } from './customer-preferred-tier';
import { CustomerPreferredTierService } from './services/customer-preferred-tier.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { CustomerPreferredTierModel } from './models/customer-preferred-tier.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CustomerPreferredTierComponent', () => {
  let mockPositionStrategy: any;
  let serviceSpy: any;
  let component: CustomerPreferredTierComponent;
  let fixture: ComponentFixture<CustomerPreferredTierComponent>;
  let service: jasmine.SpyObj<CustomerPreferredTierService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;

  const mockData: CustomerPreferredTierModel[] = [
    {
      productType: 'WB',
      chapterId: 'CH001',
      customerId: 'CUST001',
      tier: 1,
      effDate: new Date('2024-06-01'),
      termDate: null,
      productTypeDesc: 'Whole Blood',
      customerName: 'ABC Hospital',
      fromDay: 0,
      toDay: 7,
      unitPrice: 150.00,
      lifeSpan: 42,
      lifeSpanInd: 'D',
      lastModifiedDate: new Date('2024-06-01T10:30:00Z')
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('CustomerPreferredTierService', [
      'getAll', 'getCustomersDropdown', 'getFilterProductTypes'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    Object.defineProperty(mockRouter, 'events', { get: () => of(), enumerable: true, configurable: true });
    Object.defineProperty(mockRouter, 'url', { get: () => '/', enumerable: true, configurable: true });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    const mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { params: {}, queryParams: {} },
      params: of({}),
      queryParams: of({})
    });

    const pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });
    const headerSpy = createMockHeaderService();
    const snackbarSpy = createMockSnackbarService();

    mockPositionStrategy = jasmine.createSpyObj('FlexibleConnectedPositionStrategy', [
      'flexibleConnectedTo', 'withPositions', 'withPush'
    ]);
    mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);

    mockOverlay = jasmine.createSpyObj('Overlay', ['position', 'create']);
    Object.defineProperty(mockOverlay, 'scrollStrategies', {
      get: () => ({ block: jasmine.createSpy('block').and.returnValue({}) }),
      enumerable: true, configurable: true
    });
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy().and.returnValue(mockPositionStrategy)
    } as any);



      TestBed.configureTestingModule({
      imports: [CustomerPreferredTierComponent, CommonModule, NoopAnimationsModule, OverlayModule],
      providers: [
        provideHttpClient(),
        { provide: CustomerPreferredTierService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Overlay, useValue: mockOverlay }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });


    


      serviceSpy.getAll.calls.reset();


      serviceSpy.getCustomersDropdown.calls.reset();


      serviceSpy.getFilterProductTypes.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockPositionStrategy.flexibleConnectedTo.calls.reset();


      mockPositionStrategy.withPositions.calls.reset();


      mockPositionStrategy.withPush.calls.reset();


      mockOverlay.position.calls.reset();


      mockOverlay.create.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);


    fixture = TestBed.createComponent(CustomerPreferredTierComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(CustomerPreferredTierService) as jasmine.SpyObj<CustomerPreferredTierService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    service.getAll.and.returnValue(of({ data: mockData, totalRecords: 1 }));
    service.getCustomersDropdown.and.returnValue(of([{ customerId: 'CUST001', customerName: 'ABC Hospital' }]));
    service.getFilterProductTypes.and.returnValue(of([]));


    });


  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(component.headerConfig.title).toBe('Setup Customer Preferred Product Tiers');
      expect(component.tableConfig.showPagination).toBeFalse();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should not load data on init without customer selection', () => {
      fixture.detectChanges();
      expect(component.selectedCustomerId).toBe('');
    });


  });

  describe('Customer Selection', () => {
    it('should load data when customer is selected', () => {
      fixture.detectChanges();
      component.onCustomerSelected('CUST001');
      expect(component.selectedCustomerId).toBe('CUST001');
      expect(component.selectedCustomerName).toBe('ABC Hospital');
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should clear data when customer is cleared', () => {
      component.selectedCustomerId = 'CUST001';
      component.dataSource = mockData;
      component.onClearCustomer();
      expect(component.selectedCustomerId).toBe('');
      expect(component.selectedCustomerName).toBe('');
      expect(component.dataSource).toEqual([]);
    });


  });

  describe('Data Loading', () => {


    it('should handle loading errors', (done) => {
      service.getAll.and.returnValue(throwError(() => new Error('Test error')));
      fixture.detectChanges();
      component.onCustomerSelected('CUST001');
      setTimeout(() => {
        expect(component.hasError).toBeTrue();
        expect(component.isLoading).toBeFalse();
        done();
      }, 100);
    });
  });
  describe('Side Panel', () => {
    it('should open side panel for add', () => {
      component.createRecord();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open side panel for edit with correct data', () => {
      component.editRecord(mockData[0]);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0]);
    });

    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should reload data on save success', () => {
      fixture.detectChanges();
      service.getAll.calls.reset();
      component.onSaveSuccess();
      expect(service.getAll).toHaveBeenCalled();
    });
  });

  describe('Row Actions', () => {
    it('should call editRecord when row action is edit', () => {
      component.onRowAction({ action: 'edit', row: mockData[0] });
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0]);
    });
  });

  describe('Filters', () => {
    it('should apply filters', () => {
      const filters = {
        productType: 'WB',
        effDatePeriod: null,
        effDateFilter: null,
        termDatePeriod: null,
        termDateFilter: null
      };
      component.applyFilters(filters);
      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.productType).toBe('WB');
    });

    it('should close side panel when applying filters', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];
      const filters = {
        productType: 'WB',
        effDatePeriod: null,
        effDateFilter: null,
        termDatePeriod: null,
        termDateFilter: null
      };
      component.applyFilters(filters);
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should close side panel when removing a filter chip', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];
      component.appliedFilters = {
        productType: 'WB',
        effDatePeriod: null,
        effDateFilter: null,
        termDatePeriod: null,
        termDateFilter: null
      };
      component.onRemoveFilterChip('productType');
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should close side panel when clearing all filters', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];
      component.clearAllFilters();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should not affect side panel state when panel is already closed', () => {
      component.sidePanelOpen = false;
      const filters = {
        productType: 'WB',
        effDatePeriod: null,
        effDateFilter: null,
        termDatePeriod: null,
        termDateFilter: null
      };
      component.applyFilters(filters);
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should return true for hasActiveFilters when filters applied', () => {
      component.appliedFilters = {
        productType: 'WB',
        effDatePeriod: null,
        effDateFilter: null,
        termDatePeriod: null,
        termDateFilter: null
      };
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should return false for hasActiveFilters when no filters', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBeFalse();
    });
  });
  describe('Currency Formatting', () => {
    it('should format currency values', () => {
      expect(component['formatCurrency'](150.50)).toBe('$150.50');
    });

    it('should return dash for null values', () => {
      expect(component['formatCurrency'](null)).toBe('-');
    });
  });
});
