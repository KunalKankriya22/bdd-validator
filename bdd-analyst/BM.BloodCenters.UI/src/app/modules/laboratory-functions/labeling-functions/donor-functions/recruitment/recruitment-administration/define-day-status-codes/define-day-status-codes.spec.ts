import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { DefineDayStatusCodesComponent } from './define-day-status-codes';
import { DayStatusCodesService } from './services/day-status-codes.service';
import { DayStatusCodeModel } from './models/day-status-codes.model';

describe('DefineDayStatusCodesComponent', () => {
  let serviceSpy: any;
  let component: DefineDayStatusCodesComponent;
  let fixture: ComponentFixture<DefineDayStatusCodesComponent>;
  let mockService: jasmine.SpyObj<DayStatusCodesService>;

  const mockData = {
    data: [
      {
        status: 'AC',
        description: 'Active',
        resourceCode: 'RES01',
        lower: 0,
        upper: 10,
        effectiveDate: new Date(2024, 0, 1),
        terminationDate: null
      }
    ],
    total: 1
  };

  const mockFilters = {
    resourceCodes: [{ resourceCode: 'RES01' }],
    statusCodes: [{ status: 'AC' }]
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DayStatusCodesService', [
      'getDayStatusCodes',
      'getDayStatusFilters',
      'addDayStatusCode',
      'updateDayStatusCode'
    ]);

    serviceSpy.getDayStatusCodes.and.returnValue(of(mockData));
    serviceSpy.getDayStatusFilters.and.returnValue(of(mockFilters));



      TestBed.configureTestingModule({
imports: [
        DefineDayStatusCodesComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: DayStatusCodesService, useValue: serviceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.getDayStatusCodes.calls.reset();


      serviceSpy.getDayStatusFilters.calls.reset();


      serviceSpy.addDayStatusCode.calls.reset();


      serviceSpy.updateDayStatusCode.calls.reset();


      serviceSpy.getDayStatusCodes.and.returnValue(of(mockData));


      serviceSpy.getDayStatusFilters.and.returnValue(of(mockFilters));


    fixture = TestBed.createComponent(DefineDayStatusCodesComponent);
    component = fixture.componentInstance;
    mockService = TestBed.inject(DayStatusCodesService) as jasmine.SpyObj<DayStatusCodesService>;
    fixture.detectChanges();


    });


  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load data on init', () => {
      expect(mockService.getDayStatusCodes).toHaveBeenCalled();
    });

    it('should load filter options on init', () => {
      expect(mockService.getDayStatusFilters).toHaveBeenCalled();
    });

    it('should populate resourceCodes from filter options', () => {
      expect(component.resourceCodes).toEqual(mockFilters.resourceCodes);
    });

    it('should populate statusCodes from filter options', () => {
      expect(component.statusCodes).toEqual(mockFilters.statusCodes);
    });

    it('should set dataSource from loaded data', () => {
      expect(component.dataSource).toEqual(mockData.data);
    });

    it('should set isLoading to false after data loads', () => {
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Load Data', () => {
    it('should set totalRecords in pagination from response', () => {
      expect(component.dataTableConfig.pagination?.totalRecords).toBe(1);
    });

    it('should handle error when loading data', () => {
      spyOn(console, 'error');
      mockService.getDayStatusCodes.and.returnValue(throwError(() => new Error('Server error')));

      component.loadData();

      expect(component.isLoading).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should pass sort=undefined when sortConfig direction is default', () => {
      component.dataTableConfig.sortConfig!.direction = 'default';
      mockService.getDayStatusCodes.calls.reset();

      component.loadData();

      const callArgs = mockService.getDayStatusCodes.calls.mostRecent().args;
      expect(callArgs[2].sort).toBeUndefined();
    });

    it('should pass sort direction when not default', () => {
      component.dataTableConfig.sortConfig!.direction = 'A';
      mockService.getDayStatusCodes.calls.reset();

      component.loadData();

      const callArgs = mockService.getDayStatusCodes.calls.mostRecent().args;
      expect(callArgs[2].sort).toBe('A');
    });

    it('should include filter params when appliedFilters has resourceCode', () => {
      component.appliedFilters = {
        resourceCode: 'RES01',
        status: undefined,
        effectiveDatePeriod: undefined,
        effectiveDate: null,
        terminationDatePeriod: undefined,
        terminationDate: null
      };
      mockService.getDayStatusCodes.calls.reset();

      component.loadData();

      const callArgs = mockService.getDayStatusCodes.calls.mostRecent().args;
      expect(callArgs[2].resourceCode).toBe('RES01');
    });

    it('should include filter params when appliedFilters has status', () => {
      component.appliedFilters = {
        resourceCode: undefined,
        status: 'AC',
        effectiveDatePeriod: undefined,
        effectiveDate: null,
        terminationDatePeriod: undefined,
        terminationDate: null
      };
      mockService.getDayStatusCodes.calls.reset();

      component.loadData();

      const callArgs = mockService.getDayStatusCodes.calls.mostRecent().args;
      expect(callArgs[2].status).toBe('AC');
    });

    it('should include effectiveDate params when period and date are set', () => {
      const testDate = new Date('2024-06-01');
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: testDate,
        terminationDatePeriod: undefined,
        terminationDate: null
      };
      mockService.getDayStatusCodes.calls.reset();

      component.loadData();

      const callArgs = mockService.getDayStatusCodes.calls.mostRecent().args;
      expect(callArgs[2].effectiveDate).toBe(testDate.toISOString());
      expect(callArgs[2].effectiveDatePeriod).toBe('after');
    });

    it('should include terminationDate params when period and date are set', () => {
      const testDate = new Date('2025-12-31');
      component.appliedFilters = {
        effectiveDatePeriod: undefined,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: testDate
      };
      mockService.getDayStatusCodes.calls.reset();

      component.loadData();

      const callArgs = mockService.getDayStatusCodes.calls.mostRecent().args;
      expect(callArgs[2].terminationDate).toBe(testDate.toISOString());
      expect(callArgs[2].terminationDatePeriod).toBe('before');
    });

    it('should not include date params when only period is set without date', () => {
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: undefined,
        terminationDate: null
      };
      mockService.getDayStatusCodes.calls.reset();

      component.loadData();

      const callArgs = mockService.getDayStatusCodes.calls.mostRecent().args;
      expect(callArgs[2].effectiveDate).toBeUndefined();
    });

    it('should pass searchKeyword when set', () => {
      component.searchKeyword = 'test';
      mockService.getDayStatusCodes.calls.reset();

      component.loadData();

      const callArgs = mockService.getDayStatusCodes.calls.mostRecent().args;
      expect(callArgs[2].searchKeyword).toBe('test');
    });

    it('should pass correct take and skip values for pagination', () => {
      component.dataTableConfig.pagination!.pageIndex = 2;
      component.dataTableConfig.pagination!.pageSize = 10;
      mockService.getDayStatusCodes.calls.reset();

      component.loadData();

      const callArgs = mockService.getDayStatusCodes.calls.mostRecent().args;
      expect(callArgs[0]).toBe(10); // take
      expect(callArgs[1]).toBe(20); // skip = 2 * 10
    });
  });

  describe('Load Filter Options', () => {
    it('should handle error when loading filter options', () => {
      spyOn(console, 'warn');
      mockService.getDayStatusFilters.and.returnValue(throwError(() => new Error('Filters error')));

      (component as any).loadFilterOptions();

      expect(component.resourceCodes).toEqual([]);
      expect(component.statusCodes).toEqual([]);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle null resourceCodes in response', () => {
      mockService.getDayStatusFilters.and.returnValue(of({ resourceCodes: null, statusCodes: null }));

      (component as any).loadFilterOptions();

      expect(component.resourceCodes).toEqual([]);
      expect(component.statusCodes).toEqual([]);
    });
  });

  describe('Sort Functionality', () => {
    it('should handle sort change to ascending', () => {
      const sortEvent = { column: 'status', direction: 'A' as const };
      component.onSortChange(sortEvent);

      expect(component.dataTableConfig.sortConfig?.direction).toBe('A');
      expect(mockService.getDayStatusCodes).toHaveBeenCalled();
    });

    it('should handle sort change to descending', () => {
      const sortEvent = { column: 'status', direction: 'D' as const };
      component.onSortChange(sortEvent);

      expect(component.dataTableConfig.sortConfig?.direction).toBe('D');
      expect(mockService.getDayStatusCodes).toHaveBeenCalled();
    });

    it('should handle sort change to default', () => {
      const sortEvent = { column: 'status', direction: 'default' as const };
      component.onSortChange(sortEvent);

      expect(component.dataTableConfig.sortConfig?.direction).toBe('default');
      expect(mockService.getDayStatusCodes).toHaveBeenCalled();
    });

    it('should update sort column on sort change', () => {
      const sortEvent = { column: 'description', direction: 'A' as const };
      component.onSortChange(sortEvent);

      expect(component.dataTableConfig.sortConfig?.column).toBe('description');
    });
  });

  describe('Search Functionality', () => {
    it('should set searchKeyword and reload on search', () => {
      mockService.getDayStatusCodes.calls.reset();

      component.onSearch('test search');

      expect(component.searchKeyword).toBe('test search');
      expect(mockService.getDayStatusCodes).toHaveBeenCalled();
    });

    it('should set empty string when search text is empty', () => {
      component.searchKeyword = 'old';
      mockService.getDayStatusCodes.calls.reset();

      component.onSearch('');

      expect(component.searchKeyword).toBe('');
      expect(mockService.getDayStatusCodes).toHaveBeenCalled();
    });

    it('should reset page index to 0 on search', () => {
      component.dataTableConfig.pagination!.pageIndex = 3;

      component.onSearch('test');

      expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should update pageIndex and pageSize on page change', () => {
      mockService.getDayStatusCodes.calls.reset();

      component.onPageChange({ pageIndex: 2, pageSize: 50 });

      expect(component.dataTableConfig.pagination!.pageIndex).toBe(2);
      expect(component.dataTableConfig.pagination!.pageSize).toBe(50);
      expect(mockService.getDayStatusCodes).toHaveBeenCalled();
    });
  });

  describe('Row Actions', () => {
    it('should open edit drawer when edit action is triggered', () => {
      spyOn(component, 'openEditDrawer');
      const row = mockData.data[0];

      component.onRowAction({ action: 'edit', row });

      expect(component.openEditDrawer).toHaveBeenCalledWith(row);
    });

    it('should not open edit drawer for unknown action', () => {
      spyOn(component, 'openEditDrawer');

      component.onRowAction({ action: 'unknown', row: mockData.data[0] });

      expect(component.openEditDrawer).not.toHaveBeenCalled();
    });
  });

  describe('Side Drawer Operations', () => {
    it('should open add drawer', () => {
      component.openAddDrawer();
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open edit drawer with data', () => {
      const data = mockData.data[0];
      component.openEditDrawer(data);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(data);
    });

    it('should close side drawer', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData.data[0];

      component.closeSideDrawer();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Save Operations', () => {
    it('should save new record and reload data', () => {
      const addDto = {
        status: 'AC',
        description: 'Test',
        resourceCode: 'RES01',
        lower: 0,
        upper: 10,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null,
        chapterId: ''
      };

      mockService.addDayStatusCode.and.returnValue(of({}));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      spyOn(component['cdr'], 'detectChanges');

      component.onSave(addDto);

      expect(mockService.addDayStatusCode).toHaveBeenCalledWith(addDto);
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should update existing record and reload data', () => {
      const updateDto = {
        resourceCode: 'RES01',
        status: 'AC',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        description: 'Updated',
        lower: 5,
        upper: 15,
        terminationDate: null,
        chapterId: ''
      };

      mockService.updateDayStatusCode.and.returnValue(of({}));
      component.sidePanelMode = 'edit';
      component.sidePanelOpen = true;
      spyOn(component['cdr'], 'detectChanges');

      component.onSave(updateDto);

      expect(mockService.updateDayStatusCode).toHaveBeenCalledWith(updateDto);
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should handle save error for add mode with 409 status', () => {
      const addDto = {
        status: 'AC',
        description: 'Test',
        resourceCode: 'RES01',
        lower: 0,
        upper: 10,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null,
        chapterId: ''
      };

      mockService.addDayStatusCode.and.returnValue(throwError(() => ({ status: 409 })));
      component.sidePanelMode = 'add';
      component.sideDrawerComponent = { setErrorMessage: jasmine.createSpy(), resetForm: jasmine.createSpy(), resetSubmissionState: jasmine.createSpy() } as any;

      component.onSave(addDto);

      expect(component.sideDrawerComponent!.setErrorMessage).toHaveBeenCalledWith(
        'A record with this Status, Resource Code, and Effective Date already exists.'
      );
    });

    it('should handle save error for add mode with 404 status', () => {
      const addDto = {
        status: 'AC',
        description: 'Test',
        resourceCode: 'RES01',
        lower: 0,
        upper: 10,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null,
        chapterId: ''
      };

      mockService.addDayStatusCode.and.returnValue(throwError(() => ({ status: 404 })));
      component.sidePanelMode = 'add';
      component.sideDrawerComponent = { setErrorMessage: jasmine.createSpy(), resetForm: jasmine.createSpy(), resetSubmissionState: jasmine.createSpy() } as any;

      component.onSave(addDto);

      expect(component.sideDrawerComponent!.setErrorMessage).toHaveBeenCalledWith(
        'The record was not found. It may have been deleted.'
      );
    });

    it('should handle save error with custom error message', () => {
      const addDto = {
        status: 'AC',
        description: 'Test',
        resourceCode: 'RES01',
        lower: 0,
        upper: 10,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null,
        chapterId: ''
      };

      mockService.addDayStatusCode.and.returnValue(throwError(() => ({
        status: 500,
        error: { message: 'Custom backend error' }
      })));
      component.sidePanelMode = 'add';
      component.sideDrawerComponent = { setErrorMessage: jasmine.createSpy(), resetForm: jasmine.createSpy(), resetSubmissionState: jasmine.createSpy() } as any;

      component.onSave(addDto);

      expect(component.sideDrawerComponent!.setErrorMessage).toHaveBeenCalledWith('Custom backend error');
    });

    it('should handle save error with generic error', () => {
      const addDto = {
        status: 'AC',
        description: 'Test',
        resourceCode: 'RES01',
        lower: 0,
        upper: 10,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null,
        chapterId: ''
      };

      mockService.addDayStatusCode.and.returnValue(throwError(() => ({ status: 500 })));
      component.sidePanelMode = 'add';
      component.sideDrawerComponent = { setErrorMessage: jasmine.createSpy(), resetForm: jasmine.createSpy(), resetSubmissionState: jasmine.createSpy() } as any;

      component.onSave(addDto);

      expect(component.sideDrawerComponent!.setErrorMessage).toHaveBeenCalledWith(
        'An error occurred while saving. Please try again.'
      );
    });

    it('should handle update error in edit mode', () => {
      const updateDto = {
        resourceCode: 'RES01',
        status: 'AC',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        description: 'Updated',
        lower: 5,
        upper: 15,
        terminationDate: null,
        chapterId: ''
      };

      mockService.updateDayStatusCode.and.returnValue(throwError(() => ({ status: 409 })));
      component.sidePanelMode = 'edit';
      component.sideDrawerComponent = { setErrorMessage: jasmine.createSpy(), resetForm: jasmine.createSpy(), resetSubmissionState: jasmine.createSpy() } as any;

      component.onSave(updateDto);

      expect(component.sideDrawerComponent!.setErrorMessage).toHaveBeenCalledWith(
        'A record with this Status, Resource Code, and Effective Date already exists.'
      );
    });
  });

  describe('Save And Create Another', () => {
    it('should call addDayStatusCode in add mode', () => {
      const addDto = {
        status: 'AC',
        description: 'Test',
        resourceCode: 'RES01',
        lower: 0,
        upper: 10,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null,
        chapterId: ''
      };

      mockService.addDayStatusCode.and.returnValue(of({}));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSaveAndCreateAnother(addDto);

      expect(mockService.addDayStatusCode).toHaveBeenCalledWith(addDto);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should call updateDayStatusCode and close drawer in edit mode', () => {
      const updateDto = {
        resourceCode: 'RES01',
        status: 'AC',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        description: 'Updated',
        lower: 5,
        upper: 15,
        terminationDate: null,
        chapterId: ''
      };

      mockService.updateDayStatusCode.and.returnValue(of({}));
      component.sidePanelMode = 'edit';
      component.sidePanelOpen = true;

      component.onSaveAndCreateAnother(updateDto);

      expect(mockService.updateDayStatusCode).toHaveBeenCalledWith(updateDto);
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should handle error during save and create another in add mode', () => {
      const addDto = {
        status: 'AC',
        description: 'Test',
        resourceCode: 'RES01',
        lower: 0,
        upper: 10,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        terminationDate: null,
        chapterId: ''
      };

      mockService.addDayStatusCode.and.returnValue(throwError(() => ({ status: 500 })));
      component.sidePanelMode = 'add';
      component.sideDrawerComponent = { setErrorMessage: jasmine.createSpy(), resetForm: jasmine.createSpy(), resetSubmissionState: jasmine.createSpy() } as any;

      component.onSaveAndCreateAnother(addDto);

      expect(component.sideDrawerComponent!.setErrorMessage).toHaveBeenCalledWith(
        'An error occurred while saving. Please try again.'
      );
    });

    it('should handle error during save and create another in edit mode', () => {
      const updateDto = {
        resourceCode: 'RES01',
        status: 'AC',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        description: 'Updated',
        lower: 5,
        upper: 15,
        terminationDate: null,
        chapterId: ''
      };

      mockService.updateDayStatusCode.and.returnValue(throwError(() => ({ status: 409 })));
      component.sidePanelMode = 'edit';
      component.sideDrawerComponent = { setErrorMessage: jasmine.createSpy(), resetForm: jasmine.createSpy(), resetSubmissionState: jasmine.createSpy() } as any;

      component.onSaveAndCreateAnother(updateDto);

      expect(component.sideDrawerComponent!.setErrorMessage).toHaveBeenCalledWith(
        'A record with this Status, Resource Code, and Effective Date already exists.'
      );
    });
  });

  describe('Filter Functionality', () => {
    it('should apply filters and reload data', () => {
      const filters = {
        resourceCode: 'RES01',
        status: 'AC',
        effectiveDatePeriod: undefined as any,
        effectiveDate: null,
        terminationDatePeriod: undefined as any,
        terminationDate: null
      };
      mockService.getDayStatusCodes.calls.reset();

      component.applyFilters(filters);

      expect(component.appliedFilters).toBe(filters);
      expect(mockService.getDayStatusCodes).toHaveBeenCalled();
    });

    it('should reset page index when applying filters', () => {
      component.dataTableConfig.pagination!.pageIndex = 3;
      const filters = {
        resourceCode: 'RES01'
      };

      component.applyFilters(filters as any);

      expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should remove a filter chip and reload data', () => {
      component.appliedFilters = {
        resourceCode: 'RES01',
        status: 'AC'
      };
      mockService.getDayStatusCodes.calls.reset();

      component.onRemoveFilterChip('resourceCode');

      expect(mockService.getDayStatusCodes).toHaveBeenCalled();
    });

    it('should reset page index when removing filter chip', () => {
      component.dataTableConfig.pagination!.pageIndex = 3;
      component.appliedFilters = {
        resourceCode: 'RES01',
        status: 'AC'
      };

      component.onRemoveFilterChip('resourceCode');

      expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should clear all filters and reload data', () => {
      component.appliedFilters = { resourceCode: 'RES01' };
      component.filterChips = [{ key: 'resourceCode', label: 'RES01', value: 'RES01' }];
      mockService.getDayStatusCodes.calls.reset();

      component.onClearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(mockService.getDayStatusCodes).toHaveBeenCalled();
    });

    it('should reset page index when clearing all filters', () => {
      component.dataTableConfig.pagination!.pageIndex = 3;

      component.onClearAllFilters();

      expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('Filter Panel', () => {
    it('should close filter panel if already open when openFilterPanel is called', () => {
      const mockOverlayRef = { dispose: jasmine.createSpy() };
      component.filterOverlayRef = mockOverlayRef as any;

      component.openFilterPanel();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.filterOverlayRef).toBeNull();
    });

    it('should close filter panel when filterOverlayRef exists', () => {
      const mockOverlayRef = { dispose: jasmine.createSpy() };
      component.filterOverlayRef = mockOverlayRef as any;

      component.closeFilterPanel();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.filterOverlayRef).toBeNull();
    });

    it('should not throw when closing filter panel with no overlay', () => {
      component.filterOverlayRef = null;

      expect(() => component.closeFilterPanel()).not.toThrow();
    });
  });

  describe('Format Date', () => {
    it('should return empty string for null date', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should format a valid date', () => {
      const date = new Date(2024, 0, 15);
      const result = component.formatDate(date);
      expect(result).toContain('15');
      expect(result).toContain('JAN');
      expect(result).toContain('2024');
    });

    it('should format a date at end of year', () => {
      const date = new Date(2025, 11, 31);
      const result = component.formatDate(date);
      expect(result).toContain('31');
      expect(result).toContain('DEC');
      expect(result).toContain('2025');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should open add drawer on Alt+C when side panel is closed', () => {
      component.sidePanelOpen = false;
      spyOn(component, 'openAddDrawer');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openAddDrawer).toHaveBeenCalled();
    });

    it('should not open add drawer on Alt+C when side panel is open', () => {
      component.sidePanelOpen = true;
      spyOn(component, 'openAddDrawer');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });

      component.handleKeyboardEvent(event);

      expect(component.openAddDrawer).not.toHaveBeenCalled();
    });

    it('should open filter panel on Alt+F when filter is not open', () => {
      component.filterOverlayRef = null;
      spyOn(component, 'openFilterPanel');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilterPanel).toHaveBeenCalled();
    });

    it('should not open filter panel on Alt+F when filter is already open', () => {
      component.filterOverlayRef = { dispose: jasmine.createSpy() } as any;
      spyOn(component, 'openFilterPanel');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });

      component.handleKeyboardEvent(event);

      expect(component.openFilterPanel).not.toHaveBeenCalled();
    });

    it('should close side drawer on Escape when side panel is open', () => {
      component.sidePanelOpen = true;
      spyOn(component, 'closeSideDrawer');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardEvent(event);

      expect(component.closeSideDrawer).toHaveBeenCalled();
    });

    it('should close filter panel on Escape when filter is open and side panel is closed', () => {
      component.sidePanelOpen = false;
      component.filterOverlayRef = { dispose: jasmine.createSpy() } as any;
      spyOn(component, 'closeFilterPanel');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardEvent(event);

      expect(component.closeFilterPanel).toHaveBeenCalled();
    });

    it('should not take action for unrelated keys', () => {
      spyOn(component, 'openAddDrawer');
      spyOn(component, 'openFilterPanel');
      spyOn(component, 'closeSideDrawer');
      spyOn(component, 'closeFilterPanel');
      const event = new KeyboardEvent('keydown', { key: 'x' });

      component.handleKeyboardEvent(event);

      expect(component.openAddDrawer).not.toHaveBeenCalled();
      expect(component.openFilterPanel).not.toHaveBeenCalled();
      expect(component.closeSideDrawer).not.toHaveBeenCalled();
      expect(component.closeFilterPanel).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should close filter panel on destroy', () => {
      spyOn(component, 'closeFilterPanel');

      component.ngOnDestroy();

      expect(component.closeFilterPanel).toHaveBeenCalled();
    });
  });

  describe('Page Header Config', () => {
    it('should have an ADD action that calls openAddDrawer', () => {
      spyOn(component, 'openAddDrawer');

      const addAction = component.pageHeaderConfig.actions?.[0];
      expect(addAction).toBeTruthy();
      addAction!.onClick!();

      expect(component.openAddDrawer).toHaveBeenCalled();
    });
  });

});
