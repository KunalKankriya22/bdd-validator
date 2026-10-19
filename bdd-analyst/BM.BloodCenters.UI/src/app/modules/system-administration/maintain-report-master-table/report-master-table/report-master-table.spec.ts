import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ReportMasterTable } from './report-master-table';
import { ReportMasterTableService } from '../services/report-master-table.service';
import { ReportMasterTableModel, ReportMasterTableFilterValue } from '../models/report-master-table.model';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('ReportMasterTable Integration Tests', () => {
  let scrollStrategy: any;
  let positionStrategy: any;
  let overlayRefSpy: any;
  let overlaySpy: any;
  let dialogSpy: any;
  let routerSpy: any;
  let serviceSpy: any;
  let component: ReportMasterTable;
  let fixture: ComponentFixture<ReportMasterTable>;
  let service: jasmine.SpyObj<ReportMasterTableService>;
  let router: jasmine.SpyObj<Router>;
  let overlay: jasmine.SpyObj<Overlay>;
  let overlayRef: jasmine.SpyObj<OverlayRef>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockReportData: ReportMasterTableModel[] = [
    {
      chapterID: 'CH01',
      type: 'Type1',
      code: 'CODE001',
      description: 'Test Description 1',
      command: '192.168.1.1',
      port: '8080',
      sequence: 1,
      warehouse: 'WH1',
      warehouseDescrription: 'Warehouse 1',
      clientHostName: 'host1'
    },
    {
      chapterID: 'CH02',
      type: 'Type2',
      code: 'CODE002',
      description: 'Test Description 2',
      command: '192.168.1.2',
      port: '8081',
      sequence: 2,
      warehouse: 'WH2',
      warehouseDescrription: 'Warehouse 2',
      clientHostName: 'host2'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ReportMasterTableService', [
      'getReportMasterTable',
      'getReportMasterTableFilters'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');
    dialogSpy = createMockMatDialog();
    overlaySpy = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
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
    const scrollStrategies = {
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
        ReportMasterTable,
        TranslateModule.forRoot(),
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        { provide: ReportMasterTableService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Overlay, useValue: overlaySpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });


      dialogSpy.open.calls.reset();


      routerSpy.createUrlTree.and.returnValue({} as any);


      routerSpy.serializeUrl.and.returnValue('');


      positionStrategy.flexibleConnectedTo.and.returnValue(positionStrategy);


      positionStrategy.withPositions.and.returnValue(positionStrategy);


      positionStrategy.withPush.and.returnValue(positionStrategy);


      overlaySpy.create.and.returnValue(overlayRefSpy);


      overlayRefSpy.backdropClick.and.returnValue(of(null));


    service = TestBed.inject(ReportMasterTableService) as jasmine.SpyObj<ReportMasterTableService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    overlay = TestBed.inject(Overlay) as jasmine.SpyObj<Overlay>;
    overlayRef = overlayRefSpy;

    service.getReportMasterTable.and.returnValue(
      of({ data: mockReportData, totalRecords: 2 })
    );

    fixture = TestBed.createComponent(ReportMasterTable);
    component = fixture.componentInstance;


    });

  describe('Service Integration', () => {
    it('should load data from service on init', () => {
      component.ngOnInit();

      expect(service.getReportMasterTable).toHaveBeenCalledWith(25, 0, {});
      expect(component.dataSource).toEqual(mockReportData);
      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
      expect(component.isLoading).toBe(false);
    });



    it('should reload data with search keyword', () => {
      component.ngOnInit();
      service.getReportMasterTable.calls.reset();

      component.searchTerm = 'test';
      component.onSearch();

      expect(service.getReportMasterTable).toHaveBeenCalledWith(25, 0, {
        SearchKeyword: 'test'
      });
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });



    it('should reload data with pagination changes', () => {
      component.ngOnInit();
      service.getReportMasterTable.calls.reset();

      component.onPageChange({ pageIndex: 2, pageSize: 25, previousPageIndex: 1 });

      expect(service.getReportMasterTable).toHaveBeenCalledWith(25, 50, {});
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
    });

    it('should reload data with sort changes', () => {
      component.ngOnInit();
      service.getReportMasterTable.calls.reset();

      component.onSortChange({ column: 'code', direction: 'A' });

      expect(service.getReportMasterTable).toHaveBeenCalledWith(25, 0, {
        Sort: 'A'
      });
      expect(component.tableConfig.sortConfig?.column).toBe('code');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });





    it('should clear filter values when null', () => {
      component.ngOnInit();
      component.requestState = {
        CodeType: 'Type1',
        ChapterID: 'CH01',
        Warehouse: 'WH1'
      };
      service.getReportMasterTable.calls.reset();

      const filters: ReportMasterTableFilterValue = {
        type: null,
        chapterId: null,
        warehouse: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(service.getReportMasterTable).toHaveBeenCalledWith(25, 0, {
        CodeType: undefined,
        ChapterID: undefined,
        Warehouse: undefined,
        EffectiveDatePeriod: undefined,
        EffectiveDate: undefined,
        TerminationDatePeriod: undefined,
        TerminationDate: undefined
      });
    });

    it('should combine search, filters, and sort in request', () => {
      component.ngOnInit();
      component.searchTerm = 'test';
      component.onSearch();
      component.onSortChange({ column: 'code', direction: 'D' });
      service.getReportMasterTable.calls.reset();

      const filters: ReportMasterTableFilterValue = {
        type: 'Type1',
        chapterId: null,
        warehouse: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(service.getReportMasterTable).toHaveBeenCalledWith(25, 0, {
        SearchKeyword: 'test',
        Sort: 'D',
        CodeType: 'Type1',
        ChapterID: undefined,
        Warehouse: undefined,
        EffectiveDatePeriod: undefined,
        EffectiveDate: undefined,
        TerminationDatePeriod: undefined,
        TerminationDate: undefined
      });
    });
  });

  describe('Row Actions Integration', () => {
    it('should call editReport for edit action', () => {
      spyOn(component, 'editReport').and.stub();
      const row = mockReportData[0];

      component.onRowAction({ action: 'edit', row });

      expect(component.editReport).toHaveBeenCalledWith(row);
    });



    it('should log edit record data', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialog.open.and.returnValue(dialogRefSpy);
      spyOn(console, 'log');
      const row = mockReportData[0];

      component.editReport(row);

      expect(dialog.open).toHaveBeenCalledWith(jasmine.any(Function), {
        width: '660px',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        disableClose: true,
        autoFocus: 'first-tabbable',
        position: { right: '0', top: '0' },
        panelClass: 'report-master-drawer',
        hasBackdrop: false,
        data: {
          mode: 'edit',
          record: row
        }
      });
      expect(console.log).toHaveBeenCalledWith('Updated:', true);
    });
  });
  describe('Component Lifecycle Integration', () => {
    it('should load data on ngOnInit', () => {
      expect(component.isLoading).toBe(false);
      
      component.ngOnInit();

      expect(service.getReportMasterTable).toHaveBeenCalled();
    });




  });

  describe('State Management Integration', () => {
    it('should maintain request state across operations', () => {
      component.ngOnInit();

      component.searchTerm = 'test';
      component.onSearch();

      const filters: ReportMasterTableFilterValue = {
        type: 'Type1',
        chapterId: null,
        warehouse: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.applyFilters(filters);

      component.onSortChange({ column: 'code', direction: 'A' });

      expect(component.requestState).toEqual({
        SearchKeyword: 'test',
        CodeType: 'Type1',
        ChapterID: undefined,
        Warehouse: undefined,
        EffectiveDatePeriod: undefined,
        EffectiveDate: undefined,
        TerminationDatePeriod: undefined,
        TerminationDate: undefined,
        Sort: 'A'
      });
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
      const filters: ReportMasterTableFilterValue = {
        type: 'Type1',
        chapterId: 'CH01',
        warehouse: 'WH1',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
    });



    it('should clear all filters when clearAllFilters is called', () => {
      const filters: ReportMasterTableFilterValue = {
        type: 'Type1',
        chapterId: 'CH01',
        warehouse: 'WH1',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      
      component.applyFilters(filters);
      service.getReportMasterTable.calls.reset();

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.requestState.CodeType).toBeUndefined();
      expect(component.requestState.ChapterID).toBeUndefined();
      expect(component.requestState.Warehouse).toBeUndefined();
      expect(service.getReportMasterTable).toHaveBeenCalled();
    });

    it('should return true for hasActiveFilters when filters exist', () => {
      const filters: ReportMasterTableFilterValue = {
        type: 'Type1',
        chapterId: null,
        warehouse: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
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