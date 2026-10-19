import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { ViewLabMasterCodes } from './view-lab-master-codes';
import { LabMasterCodesService, MasterCodeListItem } from '../services/lab-master-codes.service';
import { FilterLabMasterCodesComponent } from '../filter-lab-master-codes/filter-lab-master-codes';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('ViewLabMasterCodes', () => {
  let component: ViewLabMasterCodes;
  let fixture: ComponentFixture<ViewLabMasterCodes>;
  let mockService: jasmine.SpyObj<LabMasterCodesService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockMasterCodes: MasterCodeListItem[] = [
    {
      code: 'APITY',
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
      code: 'ABO',
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

    mockService = jasmine.createSpyObj('LabMasterCodesService', ['getMasterCodes', 'getLabMasterCodesByType']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    mockDialog = createMockMatDialog();



      TestBed.configureTestingModule({
      imports: [
        ViewLabMasterCodes,
        MatDialogModule,
        MatTableModule,
        MatPaginatorModule,
        FilterLabMasterCodesComponent
      ],
      providers: [
        provideHttpClient(),
        { provide: LabMasterCodesService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });


    


      mockService.getMasterCodes.calls.reset();


      mockService.getLabMasterCodesByType.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


    fixture = TestBed.createComponent(ViewLabMasterCodes);
    component = fixture.componentInstance;


    });


  describe('ngOnInit', () => {
    it('should load master codes on init', () => {
      mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));

      component.ngOnInit();

      expect(mockService.getMasterCodes).toHaveBeenCalled();
      expect(component.masterCodes.length).toBe(2);
      expect(component.totalRecords).toBe(2);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle error when loading master codes', () => {
      mockService.getMasterCodes.and.returnValue(throwError(() => new Error('Load failed')));

      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });
  });
  describe('onSearch', () => {
    it('should trigger search on enter key', () => {
      mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));
      const searchKeyword = 'APITY';

      component.onSearch(searchKeyword);

      expect(component.pageIndex).toBe(0);
      expect(mockService.getMasterCodes).toHaveBeenCalled();
    });
  });

  describe('getSortIcon', () => {


    it('should return unfold_more when no sort', () => {
      component.sortDirection = '';
      expect(component.getSortIcon()).toBe('unfold_more');
    });
  });

  describe('Filter Chips', () => {
    beforeEach(() => {
      mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));
    });



    it('should call clearAllFiltersChips when removing last filter chip without duplicate API calls', () => {
      spyOn(component, 'clearAllFiltersChips').and.stub();
      spyOn(component, 'loadMasterCodes');
      component.currentFilters = {
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: 'AFTER',
        terminationDatePeriod: 'BEFORE'
      };
      component.filterChips = [
        { key: 'effectiveDate', label: 'Effective Date', value: '2024-01-01' }
      ];

      component.removeFilterChip('effectiveDate');

      expect(component.clearAllFiltersChips).toHaveBeenCalledTimes(1);
      // loadMasterCodes should NOT be called separately since clearAllFiltersChips handles it
      expect(component.loadMasterCodes).not.toHaveBeenCalled();
    });


  });

  describe('formatDate', () => {


    it('should format date as DD-MON-YYYY', () => {
      const date = new Date('2025-01-11');
      expect(component.formatDate(date)).toBe('11-JAN-2025');
    });

    it('should pad single-digit day with leading zero', () => {
      const date = new Date('2025-03-05');
      expect(component.formatDate(date)).toContain('05-MAR-2025');
    });
  });

  describe('getStatusClass', () => {


    it('should return active for future termination date', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(component.getStatusClass(future)).toBe('active');
    });

    it('should return inactive for past termination date', () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      expect(component.getStatusClass(past)).toBe('inactive');
    });
  });

  describe('isEditDisabled', () => {
    it('should return false for any row (all records are editable except D)', () => {
      const row = { ...mockMasterCodes[0], changeControlFlag: 'S' };
      expect(component.isEditDisabled(row)).toBe(false);
    });
  

  
    it('should return true when changeControlFlag is D', () => {
      const row = { ...mockMasterCodes[0], changeControlFlag: 'D' };
      expect(component.isEditDisabled(row)).toBe(true);
    });
  
    it('should return false when changeControlFlag is null', () => {
      const row = { ...mockMasterCodes[0], changeControlFlag: null as any };
      expect(component.isEditDisabled(row)).toBe(false);
    });
  });

  describe('isRowHighlighted', () => {
    it('should return true when selectedRow matches the given row code', () => {
      component['selectedRow'] = mockMasterCodes[0];
      expect(component.isRowHighlighted(mockMasterCodes[0])).toBeTrue();
    });

    it('should return false when selectedRow is null', () => {
      component['selectedRow'] = null;
      expect(component.isRowHighlighted(mockMasterCodes[0])).toBeFalse();
    });

    it('should return false when selectedRow has a different code', () => {
      component['selectedRow'] = mockMasterCodes[1];
      expect(component.isRowHighlighted(mockMasterCodes[0])).toBeFalse();
    });
  });

  describe('onDescriptionHover', () => {
    it('should disable tooltip when element is not overflowing', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 100 });
      Object.defineProperty(el, 'clientWidth', { value: 200 });
      const event = { currentTarget: el } as unknown as MouseEvent;

      component.onDescriptionHover(event, mockMasterCodes[0].code);

      expect(component.descriptionTooltipDisabled.get(mockMasterCodes[0].code)).toBeTrue();
    });

    it('should not disable tooltip when element is overflowing', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 300 });
      Object.defineProperty(el, 'clientWidth', { value: 200 });
      const event = { currentTarget: el } as unknown as MouseEvent;

      component.onDescriptionHover(event, mockMasterCodes[0].code);

      expect(component.descriptionTooltipDisabled.get(mockMasterCodes[0].code)).toBeUndefined();
    });
  });



  describe('clearFilters', () => {
    it('should reset all state and reload', () => {
      mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));
      component.searchTerm = 'test';
      component.currentFilters = { effectiveDate: new Date(), effectiveDatePeriod: 'AFTER' };
      component.filterChips = [{ key: 'effectiveDate', label: 'Effective Date', value: new Date() }];
      component.pageIndex = 3;
      component.sortDirection = 'D';

      component.clearFilters();

      expect(component.searchTerm).toBe('');
      expect(component.currentFilters).toEqual({});
      expect(component.filterChips).toEqual([]);
      expect(component.pageIndex).toBe(0);
      expect(component.sortDirection).toBe('');
    });
  });
  describe('openFilter', () => {
    it('should apply filters and reload data when dialog closes with result', () => {
      const filters = {
        effectiveDate: new Date('2025-01-11'),
        effectiveDatePeriod: 'AFTER' as const
      };
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(filters));
      const dialogSpy = spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);
      mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));

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
