import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { ViewLabCodeType } from './view-code-type';
import { LabMasterCodesService, MasterCodeDetail } from '../../services/lab-master-codes.service';
import { FilterLabMasterCodesComponent } from '../../filter-lab-master-codes/filter-lab-master-codes';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('ViewLabCodeType', () => {
  let component: ViewLabCodeType;
  let fixture: ComponentFixture<ViewLabCodeType>;
  let mockService: jasmine.SpyObj<LabMasterCodesService>;
  let mockActivatedRoute: any;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockCodeTypes: MasterCodeDetail[] = [
    {
      codeType: 'APITY',
      code: 'APITY001',
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
      codeType: 'APITY',
      code: 'APITY002',
      description: 'Software error',
      changeControlFlag: '',
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

    mockService = jasmine.createSpyObj('LabMasterCodesService', [
      'getLabMasterCodesByType',
      'getMasterCodeById',
      'createMasterCode',
      'updateMasterCode',
      'deleteMasterCode',
      'getMasterCodes',
      'getCodeTypesByCode'
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

    mockService.getLabMasterCodesByType.and.returnValue(of({ data: mockCodeTypes, total: 2 }));



      TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ViewLabCodeType,
        MatDialogModule,
        MatTableModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        FilterLabMasterCodesComponent
      ],
      providers: [
        provideHttpClient(),
        { provide: LabMasterCodesService, useValue: mockService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog }
      ]
    });


    


      mockService.getLabMasterCodesByType.calls.reset();


      mockService.getMasterCodeById.calls.reset();


      mockService.createMasterCode.calls.reset();


      mockService.updateMasterCode.calls.reset();


      mockService.deleteMasterCode.calls.reset();


      mockService.getMasterCodes.calls.reset();


      mockService.getCodeTypesByCode.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.getCurrentNavigation.calls.reset();


      mockDialog.open.calls.reset();


      mockRouter.getCurrentNavigation.and.returnValue(null);


      mockService.getLabMasterCodesByType.and.returnValue(of({ data: mockCodeTypes, total: 2 }));


    fixture = TestBed.createComponent(ViewLabCodeType);
    component = fixture.componentInstance;


    });


  describe('ngOnInit', () => {
    it('should load codes for code type from route params', () => {
      component.ngOnInit();

      expect(component.codeParam).toBe('APITY');
      expect(mockService.getLabMasterCodesByType).toHaveBeenCalledWith(
        'APITY',
        25,
        0,
        jasmine.any(Object)
      );
      expect(component.masterCodes.length).toBe(2);
      expect(component.isLoading).toBeFalse();
    });



    it('should handle error when loading codes', () => {
      mockService.getLabMasterCodesByType.and.returnValue(throwError(() => new Error('Load failed')));

      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });
  });

  describe('loadMasterCodes', () => {
    it('should load codes with default filter', () => {
      component.codeParam = 'APITY';

      component.loadMasterCodes();

      expect(mockService.getLabMasterCodesByType).toHaveBeenCalledWith(
        'APITY',
        25,
        0,
        jasmine.objectContaining({
          searchKeyword: undefined,
          sort: undefined
        })
      );
    });



    it('should load with search term', () => {
      component.codeParam = 'APITY';
      component.searchTerm = 'APITY001';

      component.loadMasterCodes();

      expect(mockService.getLabMasterCodesByType).toHaveBeenCalledWith(
        'APITY',
        25,
        0,
        jasmine.objectContaining({
          searchKeyword: 'APITY001'
        })
      );
    });

    it('should calculate correct skip for pagination', () => {
      component.codeParam = 'APITY';
      component.pageIndex = 2;
      component.pageSize = 25;

      component.loadMasterCodes();

      expect(mockService.getLabMasterCodesByType).toHaveBeenCalledWith(
        'APITY',
        25,
        50,
        jasmine.any(Object)
      );
    });

    it('should load with filters', () => {
      const testDate = new Date('2025-01-15');
      component.codeParam = 'APITY';
      component.currentFilters = {
        effectiveDate: testDate,
        effectiveDatePeriod: 'BEFORE'
      };

      component.loadMasterCodes();

      expect(mockService.getLabMasterCodesByType).toHaveBeenCalledWith(
        'APITY',
        25,
        0,
        jasmine.objectContaining({
          effectiveDate: testDate,
          effectiveDatePeriod: 'BEFORE'
        })
      );
    });
  });

  describe('onSearch', () => {
    it('should update search term and reload', () => {
      mockService.getLabMasterCodesByType.and.returnValue(of({ data: mockCodeTypes, total: 2 }));
      component.codeParam = 'APITY';
      component.pageIndex = 2;

      component.onSearch('search term');

      expect(component.pageIndex).toBe(0);
      expect(mockService.getLabMasterCodesByType).toHaveBeenCalled();
    });
  });

  describe('onSort', () => {




    it('should reset pagination on sort', () => {
      component.codeParam = 'APITY';
      component.pageIndex = 2;

      component.onSort();

      expect(component.pageIndex).toBe(0);
    });
  });

  describe('getSortIcon', () => {


    it('should return arrow_upward for ascending', () => {
      component.sortDirection = 'A';

      expect(component.getSortIcon()).toBe('arrow_upward');
    });

    it('should return arrow_downward for descending', () => {
      component.sortDirection = 'D';

      expect(component.getSortIcon()).toBe('arrow_downward');
    });
  });
  describe('formatDate', () => {
    it('should format date in DD-MON-YYYY format', () => {
      const date = new Date('2025-01-11');
      const formatted = component.formatDate(date);

      expect(formatted).toBe('11-JAN-2025');
    });



    it('should pad day with leading zero', () => {
      const date = new Date('2025-01-05');
      const formatted = component.formatDate(date);

      expect(formatted).toContain('05');
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
    it('should reset all filters and sort', () => {
      mockService.getLabMasterCodesByType.and.returnValue(of({ data: mockCodeTypes, total: 2 }));
      component.codeParam = 'APITY';
      component.searchTerm = 'test';
      component.currentFilters = { searchKeyword: 'test' };
      component.pageIndex = 2;
      component.sortDirection = 'D';

      component.clearFilters();

      expect(component.searchTerm).toBe('');
      expect(component.currentFilters).toEqual({});
      expect(component.pageIndex).toBe(0);
      expect(component.sortDirection).toBe('');
    });


  });

  describe('isEditDisabled', () => {
    it('should return true when changeControlFlag is D', () => {
      const row = { ...mockCodeTypes[0], changeControlFlag: 'D' };
      expect(component.isEditDisabled(row)).toBe(true);
    });

    it('should return false when changeControlFlag is not D', () => {
      const row = { ...mockCodeTypes[0], changeControlFlag: 'S' };
      expect(component.isEditDisabled(row)).toBe(false);
    });



    it('should return false when changeControlFlag is null', () => {
      const row = { ...mockCodeTypes[0], changeControlFlag: null as any };
      expect(component.isEditDisabled(row)).toBe(false);
    });
  });

  describe('isRowHighlighted', () => {
    it('should return true when selectedRow matches the given row code', () => {
      component['selectedRow'] = mockCodeTypes[0];
      expect(component.isRowHighlighted(mockCodeTypes[0])).toBeTrue();
    });

    it('should return false when selectedRow is null', () => {
      component['selectedRow'] = null;
      expect(component.isRowHighlighted(mockCodeTypes[0])).toBeFalse();
    });

    it('should return false when selectedRow has a different code', () => {
      component['selectedRow'] = mockCodeTypes[1];
      expect(component.isRowHighlighted(mockCodeTypes[0])).toBeFalse();
    });
  });

  describe('onDescriptionHover', () => {
    it('should disable tooltip when element is not overflowing', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 100 });
      Object.defineProperty(el, 'clientWidth', { value: 200 });
      const event = { currentTarget: el } as unknown as MouseEvent;

      component.onDescriptionHover(event, mockCodeTypes[0].code);

      expect(component.descriptionTooltipDisabled.get(mockCodeTypes[0].code)).toBeTrue();
    });

    it('should not disable tooltip when element is overflowing', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 300 });
      Object.defineProperty(el, 'clientWidth', { value: 200 });
      const event = { currentTarget: el } as unknown as MouseEvent;

      component.onDescriptionHover(event, mockCodeTypes[0].code);

      expect(component.descriptionTooltipDisabled.get(mockCodeTypes[0].code)).toBeUndefined();
    });
  });

  describe('Dialog Operations', () => {
    beforeEach(() => {
      component.codeParam = 'APITY';
      component.codeTypeDescription = 'Equipment Test';
    });

    function createMockDialogRef() {
      const saveRequest = new Subject<any>();
      const ref = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      ref.afterClosed.and.returnValue(of(undefined));
      ref.componentInstance = { saveRequest };
      return ref;
    }



    it('should not open dialog when codeParam is missing', () => {
      const dialogSpy = spyOn((component as any).dialog, 'open');
      component.codeParam = '';

      component.onAddNew();

      expect(dialogSpy).not.toHaveBeenCalled();
    });



    it('should not open edit dialog when codeParam is missing', () => {
      const dialogSpy = spyOn((component as any).dialog, 'open');
      component.codeParam = '';

      component.onEdit(mockCodeTypes[0]);

      expect(dialogSpy).not.toHaveBeenCalled();
    });

    it('should not open edit dialog when row code is missing', () => {
      const dialogSpy = spyOn((component as any).dialog, 'open');
      const rowWithoutCode = { ...mockCodeTypes[0], code: '' };

      component.onEdit(rowWithoutCode);

      expect(dialogSpy).not.toHaveBeenCalled();
    });



    it('should open edit dialog with correct mode and row data', () => {
      const mockDialogRef = createMockDialogRef();
      const dialogSpy = spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);

      component.onEdit(mockCodeTypes[0]);

      const openArgs = dialogSpy.calls.mostRecent().args as any[];
      expect(openArgs[1].data.mode).toBe('edit');
      expect(openArgs[1].data.code).toBe('APITY001');
      expect(openArgs[1].data.codeType).toBe('APITY');
    });
  });

  describe('Filter Chips', () => {
    beforeEach(() => {
      component.codeParam = 'APITY';
      mockService.getLabMasterCodesByType.and.returnValue(of({ data: mockCodeTypes, total: 2 }));
    });





    it('should clear all filter chips and reload', () => {
      spyOn(component, 'loadMasterCodes');
      component.currentFilters = { effectiveDate: new Date(), effectiveDatePeriod: 'AFTER' };
      component.filterChips = [{ key: 'effectiveDate', label: 'Effective Date', value: new Date() }];

      component.clearAllFiltersChips();

      expect(component.currentFilters).toEqual({});
      expect(component.filterChips).toEqual([]);
      expect(component.pageIndex).toBe(0);
      expect(component.loadMasterCodes).toHaveBeenCalled();
    });
  });
  describe('onEdit - numericalValue in dialog data', () => {
    function createMockDialogRef() {
      const saveRequest = new Subject<any>();
      const ref = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      ref.afterClosed.and.returnValue(of(undefined));
      ref.componentInstance = { saveRequest };
      return ref;
    }

    beforeEach(() => {
      component.codeParam = 'APITY';
      component.codeTypeDescription = 'Equipment Test';
    });

    it('should pass numericalValue from row to edit dialog data', () => {
      const rowWithNumericalValue = { ...mockCodeTypes[0], numericalValue: 42.5 };
      const mockDialogRef = createMockDialogRef();
      const dialogSpy = spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);

      component.onEdit(rowWithNumericalValue);

      const openArgs = dialogSpy.calls.mostRecent().args as any[];
      expect(openArgs[1].data.numericalValue).toBe(42.5);
    });



    it('should pass sequence fields from row to edit dialog data', () => {
      const rowWithSequences = { ...mockCodeTypes[0], sequence1: 10, sequence2: 20, sequence3: 30 };
      const mockDialogRef = createMockDialogRef();
      const dialogSpy = spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);

      component.onEdit(rowWithSequences);

      const openArgs = dialogSpy.calls.mostRecent().args as any[];
      expect(openArgs[1].data.sequence1).toBe(10);
      expect(openArgs[1].data.sequence2).toBe(20);
      expect(openArgs[1].data.sequence3).toBe(30);
    });
  });

  describe('openFilter', () => {
    beforeEach(() => {
      component.codeParam = 'APITY';
    });

    it('should apply filters and reload data when dialog closes with result', () => {
      const filters = {
        effectiveDate: new Date('2025-01-11'),
        effectiveDatePeriod: 'AFTER' as const
      };
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(filters));
      const dialogSpy = spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);
      mockService.getLabMasterCodesByType.and.returnValue(of({ data: mockCodeTypes, total: 2 }));

      const mockEvent = {
        currentTarget: document.createElement('button')
      } as unknown as MouseEvent;

      component.openFilter(mockEvent);

      expect(dialogSpy).toHaveBeenCalled();
      expect(component.currentFilters).toEqual(filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(component.pageIndex).toBe(0);
    });

    it('should not apply filters when dialog is dismissed without result', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));
      spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);

      component.currentFilters = {};
      const mockEvent = {
        currentTarget: document.createElement('button')
      } as unknown as MouseEvent;

      component.openFilter(mockEvent);

      expect(component.currentFilters).toEqual({});
    });
  });

});
