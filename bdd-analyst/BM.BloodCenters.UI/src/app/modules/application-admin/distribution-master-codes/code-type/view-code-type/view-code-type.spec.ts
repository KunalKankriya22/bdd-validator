import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError } from 'rxjs';
import { ViewCodeType } from './view-code-type';
import { DistributionMasterCodesService, MasterCodeDetail } from '../../services/distribution-master-codes.service';
import { CodeTypeDialogService } from '../services/code-type-dialog.service';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('ViewCodeType', () => {
  let component: ViewCodeType;
  let fixture: ComponentFixture<ViewCodeType>;
  let mockService: jasmine.SpyObj<DistributionMasterCodesService>;
  let mockActivatedRoute: any;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockCodeTypes: MasterCodeDetail[] = [
    {
      codeType: 'APITY',
      code: 'APITY001',
      description: 'Equipment malfunction detected',
      changeControlFlag: '',
      numberalValue: 0,
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
      codeType: 'APITY',
      code: 'APITY002',
      description: 'Software error',
      changeControlFlag: '',
      numberalValue: 0,
      numericalValue: 0,
      sequence1: 0,
      sequence2: 0,
      sequence3: 0,
      effDate: new Date('2025-01-11'),
      termDate: null,
      lastModifiedDate: new Date('2025-01-11'),
      auditKey: 2,
      status: 'Active',
      isActive: true
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DistributionMasterCodesService', [
      'getDistributionMasterCodesByType',
      'getMasterCodes',
      'createCode',
      'updateCode'
    ]);
    mockActivatedRoute = {
      params: of({ code: 'APITY' })
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.getCurrentNavigation.and.returnValue(null);
    mockDialog = createMockMatDialog();
    mockSnackBar = createMockMatSnackBar();

    mockService.getDistributionMasterCodesByType.and.returnValue(of({ data: mockCodeTypes, total: 2 }));



      TestBed.configureTestingModule({
      imports: [
        ViewCodeType,
        MatDialogModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: DistributionMasterCodesService, useValue: mockService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        CodeTypeDialogService,
        Overlay
      ]
    });


    


      mockService.getDistributionMasterCodesByType.calls.reset();


      mockService.getMasterCodes.calls.reset();


      mockService.createCode.calls.reset();


      mockService.updateCode.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.getCurrentNavigation.calls.reset();


      mockRouter.getCurrentNavigation.and.returnValue(null);


      mockService.getDistributionMasterCodesByType.and.returnValue(of({ data: mockCodeTypes, total: 2 }));


    fixture = TestBed.createComponent(ViewCodeType);
    component = fixture.componentInstance;


    });


  describe('initialization', () => {
    it('should initialize table config with 9 columns', () => {
      expect(component.tableConfig.columns.length).toBe(9);
      expect(component.tableConfig.columns[0].key).toBe('code');
      expect(component.tableConfig.columns[0].sortable).toBeTrue();
    });



    it('should initialize search config', () => {
      expect(component.searchConfig.placeholder).toBe('Search by code or description');
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
    });



    it('should start with empty data source', () => {
      expect(component.dataSource).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should load codes for code type from route params', () => {
      component.ngOnInit();

      expect(component.codeParam).toBe('APITY');
      expect(mockService.getDistributionMasterCodesByType).toHaveBeenCalledWith(
        'APITY',
        25,
        0,
        jasmine.any(Object)
      );
      expect(component.dataSource.length).toBe(2);
      expect(component.isLoading).toBeFalse();
    });



    it('should handle error when loading codes', () => {
      mockService.getDistributionMasterCodesByType.and.returnValue(throwError(() => new Error('Load failed')));

      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeTrue();
    });
  });

  describe('onSearch', () => {
    it('should set search keyword and reload data', () => {
      component.codeParam = 'APITY';

      component.onSearch('APITY001');

      expect(component.requestState.searchKeyword).toBe('APITY001');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(mockService.getDistributionMasterCodesByType).toHaveBeenCalled();
    });


  });
  describe('onRowAction', () => {
    it('should call onEdit for edit action', () => {
      spyOn(component, 'onEdit').and.stub();

      component.onRowAction({ action: 'edit', row: mockCodeTypes[0] });

      expect(component.onEdit).toHaveBeenCalledWith(mockCodeTypes[0]);
    });
  });
  describe('formatDate', () => {
    it('should format date in DD-MON-YYYY format', () => {
      const date = new Date('2025-01-11');
      const formatted = component.formatDate(date);

      expect(formatted).toBe('11-JAN-2025');
    });


  });

  describe('getStatusClass', () => {


    it('should return active for future termination date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      expect(component.getStatusClass(futureDate)).toBe('active');
    });

    it('should return inactive for past termination date', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      expect(component.getStatusClass(pastDate)).toBe('inactive');
    });
  });

  describe('clearFilters', () => {
    it('should reset all filters and reload data', () => {
      component.codeParam = 'APITY';
      component.appliedFilters = { effectiveDate: new Date() };
      component.filterChips = [{ key: 'effectiveDate', label: 'Test', value: 'test' }];

      component.clearFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.sortConfig?.column).toBe('');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
      expect(mockService.getDistributionMasterCodesByType).toHaveBeenCalled();
    });
  });

  describe('row action visibility state', () => {
    it('should hide edit for non-customer-controlled rows', () => {
      const editAction = component.tableConfig.rowActions?.find(a => a.action === 'edit');
      const systemRow = { ...mockCodeTypes[0], changeControlFlag: 'S' };

      expect(editAction?.visible?.(systemRow)).toBeFalse();
    });

    it('should show edit for customer-controlled rows', () => {
      const editAction = component.tableConfig.rowActions?.find(a => a.action === 'edit');
      const customerRow = { ...mockCodeTypes[0], changeControlFlag: 'D' };

      expect(editAction?.visible?.(customerRow)).toBeTrue();
    });
  });
});
