import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal, Component, Input, Output, EventEmitter } from '@angular/core';
import { ViewDistributionMasterCodes } from './view-distribution-master-codes';
import { DistributionMasterCodesService, MasterCodeListItem } from '../services/distribution-master-codes.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { createMockMatDialog } from '@shared/testing/common-mocks';

@Component({ selector: 'app-data-table', standalone: true, template: '' })
class MockDataTable {
  @Input() config: any;
  @Input() data: any;
  @Input() loading: any;
  @Input() highlightedRow: any;
  @Output() pageChange = new EventEmitter();
  @Output() sortChange = new EventEmitter();
  @Output() rowAction = new EventEmitter();
}

describe('ViewDistributionMasterCodes', () => {
  let component: ViewDistributionMasterCodes;
  let fixture: ComponentFixture<ViewDistributionMasterCodes>;
  let mockService: jasmine.SpyObj<DistributionMasterCodesService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockHeaderService: any;

  const mockMasterCodes: MasterCodeListItem[] = [
    {
      codeType: 'APITY',
      description: 'Equipment malfunction detected',
      changeControlFlag: '',
      numericalValue: 0,
      sequence1: 0,
      sequence2: 0,
      sequence3: 0,
      effDate: new Date('2025-01-11'),
      termDate: null,
      lastModifiedDate: new Date('2025-01-11'),
      auditKey: 1,
      status: 'Active',
      isActive: true
    },
    {
      codeType: 'ABO',
      description: 'ABO/Rh Values',
      changeControlFlag: '',
      numericalValue: 0,
      sequence1: 0,
      sequence2: 0,
      sequence3: 0,
      effDate: new Date('2025-01-11'),
      termDate: new Date('2025-01-26'),
      lastModifiedDate: new Date('2025-01-11'),
      auditKey: 2,
      status: 'Inactive',
      isActive: false
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DistributionMasterCodesService', ['getMasterCodes', 'getDistributionMasterCodesByType']);
    mockHeaderService = {
      chapterId: signal('CH01'),
      getCurrentChapterId: () => 'CH01',
      chapterChanged$: new Subject<void>()
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    mockDialog = createMockMatDialog();



      TestBed.configureTestingModule({
      imports: [
        ViewDistributionMasterCodes,
        MatDialogModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: DistributionMasterCodesService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } },
        { provide: HeaderService, useValue: mockHeaderService },
        Overlay
      ]
    })
    .overrideComponent(ViewDistributionMasterCodes, {
      remove: { imports: [DataTable] },
      add: { imports: [MockDataTable] }
    });


    


      mockService.getMasterCodes.calls.reset();


      mockService.getDistributionMasterCodesByType.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


    fixture = TestBed.createComponent(ViewDistributionMasterCodes);
    component = fixture.componentInstance;


    });


  describe('initialization', () => {
    it('should initialize table config with columns', () => {
      expect(component.tableConfig.columns.length).toBe(5);
      expect(component.tableConfig.columns[0].key).toBe('codeType');
      expect(component.tableConfig.columns[0].sortable).toBeTrue();
    });



    it('should initialize search config', () => {
      expect(component.searchConfig.placeholder).toBe('Search by code type or description');
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
    });

    it('should initialize row actions with edit and navigate', () => {
      expect(component.tableConfig.rowActions?.length).toBe(2);
      expect(component.tableConfig.rowActions?.[0].action).toBe('edit');
      expect(component.tableConfig.rowActions?.[1].action).toBe('navigate');
    });

    it('should start with empty data source', () => {
      expect(component.dataSource).toEqual([]);
    });

    it('should not have active filters initially', () => {
      expect(component.hasActiveFilters()).toBeFalse();
    });
  });
  describe('onSearch', () => {
    it('should set search keyword and reload data', () => {
      mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));

      component.onSearch('APITY');

      expect(component.requestState.searchKeyword).toBe('APITY');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(mockService.getMasterCodes).toHaveBeenCalled();
    });

    it('should clear search keyword when empty string', () => {
      mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));

      component.onSearch('');

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(mockService.getMasterCodes).toHaveBeenCalled();
    });
  });
  describe('onRowAction', () => {
    it('should call onEdit for edit action', () => {
      spyOn(component, 'onEdit').and.stub();

      component.onRowAction({ action: 'edit', row: mockMasterCodes[0] });

      expect(component.onEdit).toHaveBeenCalledWith(mockMasterCodes[0]);
    });

    it('should call onNavigate for navigate action', () => {
      spyOn(component, 'onNavigate');

      component.onRowAction({ action: 'navigate', row: mockMasterCodes[0] });

      expect(component.onNavigate).toHaveBeenCalledWith(mockMasterCodes[0]);
    });
  });
  describe('row action visibility', () => {
    it('should always show edit action (no visibility restriction)', () => {
      const editAction = component.tableConfig.rowActions?.find(a => a.action === 'edit');
      const systemRow = { ...mockMasterCodes[0], changeControlFlag: 'S' };

      // Edit action has no visible property — it is always shown
      expect(editAction).toBeDefined();
      expect(editAction?.visible).toBeUndefined();
    });

    it('should show edit for non-system-controlled rows', () => {
      const editAction = component.tableConfig.rowActions?.find(a => a.action === 'edit');

      // Edit action is always present with no visibility restriction
      expect(editAction).toBeDefined();
      expect(editAction?.visible).toBeUndefined();
    });
  });
});
