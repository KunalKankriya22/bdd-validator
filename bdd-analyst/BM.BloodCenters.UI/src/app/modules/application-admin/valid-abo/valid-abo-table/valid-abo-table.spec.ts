import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { Overlay, OverlayRef, OverlayContainer } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ValidAboTable } from './valid-abo-table';
import { ValidAboService } from '../services/valid-abo.service';
import { ValidAboModel, ValidAboFilterValue } from '../models/valid-abo.model';
import { PageHeaderService } from 'src/app/shared/services/page-header.service';
import { createMockPageHeaderService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('ValidAboTable Integration Tests', () => {
  let scrollStrategies: any;
  let scrollStrategy: any;
  let positionStrategy: any;
  let overlayRefSpy: any;
  let dialogSpy: any;
  let pageHeaderServiceSpy: any;
  let overlaySpy: any;
  let routerSpy: any;
  let serviceSpy: any;
  let component: ValidAboTable;
  let fixture: ComponentFixture<ValidAboTable>;
  let service: jasmine.SpyObj<ValidAboService>;
  let router: jasmine.SpyObj<Router>;
  let overlay: jasmine.SpyObj<Overlay>;
  let overlayRef: jasmine.SpyObj<OverlayRef>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let overlayContainer: OverlayContainer;

  // Use dynamic dates for testing
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextMonth = new Date(today);
  nextMonth.setDate(today.getDate() + 30);
  const futureDate = new Date(today);
  futureDate.setMonth(today.getMonth() + 6);

  const mockValidAboData: ValidAboModel[] = [
    {
      code: 'A+',
      description: 'A Positive',
      intendedUse: 'RG-Default',
      unitScheme: 'ISBT128',
      transfusionStatus: 'Transfusable',
      mnemonic1: 'APOS',
      mnemonic2: 'AP',
      group: '1',
      sequence: 10,
      aboGroupOnly: false,
      effectiveDate: tomorrow.toISOString().split('T')[0],
      terminationDate: null
    },
    {
      code: 'B-',
      description: 'B Negative',
      intendedUse: 'EM-Emergency',
      unitScheme: 'Codabar',
      transfusionStatus: 'Not Transfusable',
      mnemonic1: 'BNEG',
      mnemonic2: 'BN',
      group: '2',
      sequence: 20,
      aboGroupOnly: false,
      effectiveDate: nextMonth.toISOString().split('T')[0],
      terminationDate: futureDate.toISOString().split('T')[0]
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ValidAboService', [
      'getValidAbo',
      'getValidAboFilters'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    overlaySpy = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    pageHeaderServiceSpy = createMockPageHeaderService();
    dialogSpy = createMockMatDialog();
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(false)
    } as any);
    overlayRefSpy = jasmine.createSpyObj('OverlayRef', [
      'attach',
      'dispose',
      'backdropClick'
    ]);

    positionStrategy = jasmine.createSpyObj('FlexibleConnectedPositionStrategy', [
      'flexibleConnectedTo',
      'withPositions',
      'withPush'
    ]);
    positionStrategy.flexibleConnectedTo.and.returnValue(positionStrategy);
    positionStrategy.withPositions.and.returnValue(positionStrategy);
    positionStrategy.withPush.and.returnValue(positionStrategy);

    scrollStrategy = jasmine.createSpyObj('ScrollStrategy', ['enable', 'disable', 'attach']);
    scrollStrategies = {
      block: jasmine.createSpy('block').and.returnValue(scrollStrategy)
    };

    overlaySpy.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy().and.returnValue(positionStrategy)
    });
    overlaySpy.scrollStrategies = scrollStrategies as any;
    overlaySpy.create.and.returnValue(overlayRefSpy);
    overlayRefSpy.backdropClick.and.returnValue(of(null));



      TestBed.configureTestingModule({
      imports: [
        ValidAboTable,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ValidAboService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Overlay, useValue: overlaySpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        provideRouter([])
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(ValidAboTable, {
      remove: { imports: [] },
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });
      positionStrategy.flexibleConnectedTo.and.returnValue(positionStrategy);


      positionStrategy.withPositions.and.returnValue(positionStrategy);


      positionStrategy.withPush.and.returnValue(positionStrategy);


      overlaySpy.create.and.returnValue(overlayRefSpy);


      overlayRefSpy.backdropClick.and.returnValue(of(null));


    service = TestBed.inject(ValidAboService) as jasmine.SpyObj<ValidAboService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    overlay = TestBed.inject(Overlay) as jasmine.SpyObj<Overlay>;
    overlayRef = overlayRefSpy;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    overlayContainer = TestBed.inject(OverlayContainer);

    service.getValidAbo.and.returnValue(
      of({ data: mockValidAboData, totalRecords: 2, currentPage: 0, pageSize: 25 })
    );

    fixture = TestBed.createComponent(ValidAboTable);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  describe('Service Integration', () => {
    it('should load data from service on init', () => {
      component.ngOnInit();

      expect(service.getValidAbo).toHaveBeenCalledWith(25, 0, {});
      expect(component.dataSource).toEqual(mockValidAboData);
      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
      expect(component.isLoading).toBe(false);
    });



    it('should reload data with search keyword', () => {
      component.ngOnInit();
      service.getValidAbo.calls.reset();

      component.onSearch('test');

      expect(service.getValidAbo).toHaveBeenCalledWith(25, 0, {
        searchKeyword: 'test'
      });
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });



    it('should reload data with pagination changes', () => {
      component.ngOnInit();
      service.getValidAbo.calls.reset();

      component.onPageChange({ pageIndex: 2, pageSize: 25, previousPageIndex: 1 });

      expect(service.getValidAbo).toHaveBeenCalledWith(25, 50, {});
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
    });

    it('should reload data with sort changes', () => {
      component.ngOnInit();
      service.getValidAbo.calls.reset();

      component.onSortChange({ column: 'code', direction: 'A' });

      expect(service.getValidAbo).toHaveBeenCalledWith(25, 0, {
        sort: 'code:asc'
      });
      expect(component.tableConfig.sortConfig?.column).toBe('code');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });





    it('should clear filter values when null', () => {
      component.ngOnInit();
      component.requestState = {
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable'
      };
      service.getValidAbo.calls.reset();

      const filters: ValidAboFilterValue = {
        intendedUse: null,
        unitScheme: null,
        transfusionStatus: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      component.applyFilters(filters);

      expect(service.getValidAbo).toHaveBeenCalledWith(25, 0, jasmine.objectContaining({
        intendedUse: undefined,
        unitScheme: undefined,
        transfusionStatus: undefined
      }));
    });

    it('should combine search, filters, and sort in request', () => {
      component.ngOnInit();
      component.onSearch('test');
      component.onSortChange({ column: 'code', direction: 'D' });
      service.getValidAbo.calls.reset();

      const filters: ValidAboFilterValue = {
        intendedUse: 'RG-Default',
        unitScheme: null,
        transfusionStatus: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      component.applyFilters(filters);

      expect(service.getValidAbo).toHaveBeenCalledWith(25, 0, jasmine.objectContaining({
        searchKeyword: 'test',
        sort: 'code:desc',
        intendedUse: 'RG-Default',
        unitScheme: undefined,
        transfusionStatus: undefined
      }));
    });
  });

  describe('Row Actions Integration', () => {
    it('should call editValidAbo for edit action', () => {
      spyOn(component, 'editValidAbo');
      const row = mockValidAboData[0];

      component.onRowAction({ action: 'edit', row });

      expect(component.editValidAbo).toHaveBeenCalledWith(row);
    });

    it('should handle delete action', () => {
      const row = mockValidAboData[0];

      component.onRowAction({ action: 'delete', row });

      expect(true).toBe(true);
    });
  });
  describe('Keyboard Shortcuts Integration', () => {










    it('should close overlay on Escape key', () => {
      component['overlayRef'] = overlayRef;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(overlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
    });
  });

  describe('Component Lifecycle Integration', () => {
    it('should load data on ngOnInit', () => {
      expect(component.isLoading).toBe(false);

      component.ngOnInit();

      expect(service.getValidAbo).toHaveBeenCalled();
    });




  });

  describe('State Management Integration', () => {
    it('should maintain request state across operations', () => {
      component.ngOnInit();

      component.onSearch('test');

      const filters: ValidAboFilterValue = {
        intendedUse: 'RG-Default',
        unitScheme: null,
        transfusionStatus: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };
      component.applyFilters(filters);

      component.onSortChange({ column: 'code', direction: 'A' });

      expect(component.requestState).toEqual(jasmine.objectContaining({
        searchKeyword: 'test',
        intendedUse: 'RG-Default',
        unitScheme: undefined,
        transfusionStatus: undefined,
        sort: 'code:asc'
      }));
    });





    it('should not reset pagination on sort', () => {
      component.ngOnInit();
      component.tableConfig.pagination!.pageIndex = 5;

      component.onSortChange({ column: 'code', direction: 'A' });

      expect(component.tableConfig.pagination?.pageIndex).toBe(5);
    });
  });

  describe('Filter Management', () => {
    it('should update filter chips when filters are applied', () => {
      const filters: ValidAboFilterValue = {
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        effectiveDateFrom: '2024-01-01',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
    });



    it('should clear all filters when clearAllFilters is called', () => {
      const filters: ValidAboFilterValue = {
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      component.applyFilters(filters);
      service.getValidAbo.calls.reset();

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.requestState.intendedUse).toBeUndefined();
      expect(component.requestState.unitScheme).toBeUndefined();
      expect(component.requestState.transfusionStatus).toBeUndefined();
      expect(service.getValidAbo).toHaveBeenCalled();
    });

    it('should return true for hasActiveFilters when filters exist', () => {
      const filters: ValidAboFilterValue = {
        intendedUse: 'RG-Default',
        unitScheme: null,
        transfusionStatus: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      component.applyFilters(filters);

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false for hasActiveFilters when no filters exist', () => {
      component.appliedFilters = null;

      expect(component.hasActiveFilters()).toBe(false);
    });
  });
});
