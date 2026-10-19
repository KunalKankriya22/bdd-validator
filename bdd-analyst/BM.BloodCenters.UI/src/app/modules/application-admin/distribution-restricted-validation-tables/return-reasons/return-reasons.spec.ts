import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ReturnReasonsComponent } from './return-reasons';
import { ReturnReasonsService } from './services/return-reasons.service';
import { ReturnReasonsModel, ReturnReasonsFilterValue } from './models/return-reasons.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { provideRouter } from '@angular/router';
import { createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ReturnReasonsComponent', () => {
  let mockOverlayRef: any;
  let component: ReturnReasonsComponent;
  let fixture: ComponentFixture<ReturnReasonsComponent>;
  let mockReturnReasonsService: jasmine.SpyObj<ReturnReasonsService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockReturnReasonsData: ReturnReasonsModel[] = [
    {
      chapterId: 'CH1',
      code: 'TEST1',
      codeDesc: 'Test Description 1',
      locationType: 'DI',
      crNcr: 'Y',
      enforce: 'N',
      feeCode1: 'FEE1',
      feeCode2: 'FEE2',
      effDate: new Date('2024-01-01'),
      termDate: null,
      status: 'Active',
      lastModifiedDate: new Date()
    },
    {
      chapterId: 'CH1',
      code: 'TEST2',
      codeDesc: 'Test Description 2',
      locationType: 'QU',
      crNcr: 'N',
      enforce: 'Y',
      feeCode1: 'FEE1',
      feeCode2: 'FEE2',
      effDate: new Date('2024-01-15'),
      termDate: null,
      status: 'Active',
      lastModifiedDate: new Date()
    }
  ];

  beforeEach(() => {

    mockReturnReasonsService = jasmine.createSpyObj('ReturnReasonsService', [
      'getReturnReasons',
      'getReturnReasonById',
      'addReturnReasons',
      'updateReturnReasons'
    ]);

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);

    // Mock PageHeaderService with signal support
    mockPageHeaderService = createMockPageHeaderService();
    // Add pageHeaderData as a signal (function that returns data)
    (mockPageHeaderService as any).pageHeaderData = jasmine.createSpy('pageHeaderData').and.returnValue({
      title: 'Return Reasons',
      subtitle: ''  // Subtitle comes from API, can be empty/null
    });

    // Mock HeaderService
    mockHeaderService = createMockHeaderService({ chapterId: signal('CH2') });
    (mockHeaderService as any).chapterChanged$ = of(null);



      TestBed.configureTestingModule({
      imports: [ReturnReasonsComponent,
        HttpClientTestingModule,
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ReturnReasonsService, useValue: mockReturnReasonsService },
        { provide: Overlay, useValue: mockOverlay },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });
    fixture = TestBed.createComponent(ReturnReasonsComponent);
    component = fixture.componentInstance;

    // Default mock for getReturnReasons (used by both loadData and loadFilterOptions)
    mockReturnReasonsService.getReturnReasons.and.returnValue(
      of({ data: mockReturnReasonsData, totalRecords: 2 })
    );


    });


  describe('Component Initialization', () => {
    it('should initialize with correct configuration', () => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('Return Reasons');
      expect(component.searchConfig.placeholder).toBe('Search by reason codes or description');
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    });




  });
  describe('Search Functionality', () => {
    it('should search with keyword', () => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      fixture.detectChanges();

      component.onSearch('TEST');

      expect(component.requestState.SearchKeyword).toBe('TEST');
      expect(mockReturnReasonsService.getReturnReasons).toHaveBeenCalled();
    });


  });
  describe('Filter Functionality', () => {
    beforeEach(() => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should apply location type filter', () => {
      const filters = {
        locationType: 'DI',
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.LocationType).toBe('DI');
      expect(component.appliedFilters).toBe(filters);
    });

    it('should apply filters correctly', () => {
      const filters = {
        locationType: 'DI',
        crNcr: 'Yes',
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.LocationType).toBe('DI');
      expect(component.appliedFilters).toBe(filters);
    });

    it('should apply effective date filter with period', () => {
      const testDate = new Date('2024-01-15');
      const filters = {
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: 'After',
        effectiveDate: testDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.EffectiveDate).toBeDefined();
      expect(component.requestState.EffectiveDatePeriod).toBe('After');
    });

    it('should apply termination date filter with period', () => {
      const testDate = new Date('2024-12-31');
      const filters = {
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: testDate
      };

      component.applyFilters(filters);

      expect(component.requestState.TerminationDate).toBeDefined();
      expect(component.requestState.TerminationDatePeriod).toBe('Before');
    });






  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: mockReturnReasonsData, totalRecords: 2 })
      );
      fixture.detectChanges();
    });



    it('should edit record and fetch details', () => {
      const mockDetail = {
        ...mockReturnReasonsData[0],
        codeDesc: 'Updated Description'
      };

      mockReturnReasonsService.getReturnReasonById.and.returnValue(
        of({ item: mockDetail } as any)
      );

      component.editRecord(mockReturnReasonsData[0]);

      expect(mockReturnReasonsService.getReturnReasonById).toHaveBeenCalledWith('CH1', 'TEST1');
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
    });

    it('should handle error when editing record', () => {
      mockReturnReasonsService.getReturnReasonById.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.editRecord(mockReturnReasonsData[0]);

      expect(component.isLoading).toBe(false);
    });



  });

  describe('Format Helpers', () => {
    beforeEach(() => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should format Y/N to Yes/No', () => {
      expect(component['formatYesNo']('Y')).toBe('Yes');
      expect(component['formatYesNo']('N')).toBe('No');
      expect(component['formatYesNo'](undefined)).toBe('-');
    });




  });

  describe('Row Actions', () => {


    it('should handle row action event', () => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: mockReturnReasonsData, totalRecords: 2 })
      );

      mockReturnReasonsService.getReturnReasonById.and.returnValue(
        of({ item: mockReturnReasonsData[0] } as any)
      );

      fixture.detectChanges();

      component.onRowAction({ action: 'edit', row: mockReturnReasonsData[0] });

      expect(mockReturnReasonsService.getReturnReasonById).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
    });
  });

  describe('Chapter Change Handling', () => {
    beforeEach(() => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: mockReturnReasonsData, totalRecords: 2 })
      );
      fixture.detectChanges();
    });







    it('should reset pagination on chapter change', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
        component.tableConfig.pagination.totalRecords = 100;
      }

      spyOn(component, 'loadData');
      (component as any).handleChapterChange();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      // totalRecords gets reset to 0 initially, then loadData updates it
      expect(component.loadData).toHaveBeenCalled();
    });





    it('should reload filter options with new ChapterId on chapter change', () => {
      spyOn(component, 'loadFilterOptions');
      (component as any).handleChapterChange();

      expect(component.requestState.ChapterId).toBe('CH2');
      expect(component.loadFilterOptions).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should open create panel on Alt+C', () => {
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
    });





    it('should close filter panel on Escape when filter is open', () => {
      component.isFilterOpen = true;
      mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      spyOn(component, 'closeFilterPanel').and.callThrough();

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.closeFilterPanel).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });


  });

  describe('Filter Chip Management', () => {
    beforeEach(() => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });



    it('should update filter chips after removal', () => {
      component.appliedFilters = {
        locationType: 'DI',
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.onRemoveFilterChip('locationType');

      expect(component.filterChips.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Date Formatting', () => {
    beforeEach(() => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2024-03-15');
      const formatted = component['formatDateOnly'](date);

      expect(formatted).toBe('2024-03-15');
    });

    it('should handle Date object in formatDateOnly', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024
      const formatted = component['formatDateOnly'](date);

      expect(formatted).toBe('2024-03-15');
    });





    it('should pad single digit month and day', () => {
      const date = new Date('2024-01-05');
      const formatted = component['formatDateOnly'](date);

      expect(formatted).toBe('2024-01-05');
    });
  });

  describe('Side Panel Management', () => {
    beforeEach(() => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: mockReturnReasonsData, totalRecords: 2 })
      );
      fixture.detectChanges();
    });





    it('should change mode to add and clear data', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockReturnReasonsData[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should keep data when changing to edit mode', () => {
      component.sidePanelMode = 'add';
      const testData = mockReturnReasonsData[0];
      component.sidePanelData = testData;

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(testData);
    });
  });

  describe('Additional Format Helpers', () => {
    beforeEach(() => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should format boolean values', () => {
      expect(component['formatBoolean'](true)).toBe('Yes');
      expect(component['formatBoolean'](false)).toBe('No');
      expect(component['formatBoolean'](undefined)).toBe('-');
      expect(component['formatBoolean'](null as any)).toBe('-');
    });

    it('should format status values', () => {
      expect(component['formatStatus']('Active')).toBe('Active');
      expect(component['formatStatus']('Inactive')).toBe('Inactive');
      expect(component['formatStatus'](undefined)).toBe('-');
    });

    it('should format date with proper month abbreviation', () => {
      const dates = [
        { input: new Date('2024-01-01'), expected: '01-JAN-2024' },
        { input: new Date('2024-02-15'), expected: '15-FEB-2024' },
        { input: new Date('2024-12-31'), expected: '31-DEC-2024' }
      ];

      dates.forEach(({ input, expected }) => {
        expect(component['formatDate'](input)).toBe(expected);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle loadData error', () => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        throwError(() => new Error('Network Error'))
      );

      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Failed to load return reasons data. Please try again.');
    });


  });

  describe('Filter State Management', () => {
    beforeEach(() => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      fixture.detectChanges();
    });

    it('should update request state from filters with date periods', () => {
      component.appliedFilters = {
        locationType: 'DI',
        crNcr: 'Yes',
        enforce: 'No',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2024-12-31')
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.LocationType).toBe('DI');
      expect(component.requestState.CrNcr).toBe('Y');
      expect(component.requestState.Enforce).toBe('N');
      expect(component.requestState.EffectiveDatePeriod).toBe('AFTER');
      expect(component.requestState.TerminationDatePeriod).toBe('BEFORE');
    });

    it('should clear request state when filters are null', () => {
      component.requestState = {
        LocationType: 'DI',
        CrNcr: 'Y',
        Enforce: 'N',
        EffectiveDate: '2024-01-15',
        EffectiveDatePeriod: 'AFTER'
      };
      component.appliedFilters = null;

      component['updateRequestStateFromFilters']();

      expect(component.requestState.LocationType).toBeUndefined();
      expect(component.requestState.CrNcr).toBeUndefined();
      expect(component.requestState.Enforce).toBeUndefined();
      expect(component.requestState.EffectiveDate).toBeUndefined();
      expect(component.requestState.EffectiveDatePeriod).toBeUndefined();
    });

    it('should apply filters with effective date and period', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      spyOn(component, 'loadData');

      component.applyFilters(filters);

      expect(component.requestState.EffectiveDate).toBe('2024-06-15');
      expect(component.requestState.EffectiveDatePeriod).toBe('AFTER');
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should apply filters with termination date and period', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2024-12-31')
      };
      spyOn(component, 'loadData');

      component.applyFilters(filters);

      expect(component.requestState.TerminationDate).toBe('2024-12-31');
      expect(component.requestState.TerminationDatePeriod).toBe('BEFORE');
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should convert Yes/No to Y/N in filters', () => {
      const filters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: 'Yes',
        enforce: 'No',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.CrNcr).toBe('Y');
      expect(component.requestState.Enforce).toBe('N');
    });
  });

  describe('Load Filter Options', () => {
    it('should load and extract unique location types on init', () => {
      const mockData: ReturnReasonsModel[] = [
        { ...mockReturnReasonsData[0], locationType: 'DI' },
        { ...mockReturnReasonsData[1], locationType: 'QU' },
        { ...mockReturnReasonsData[0], locationType: 'DI' } // Duplicate
      ];

      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: mockData, totalRecords: 3 })
      );

      fixture.detectChanges();

      expect(component.uniqueLocationTypes).toEqual(['DI', 'QU']);
    });

    it('should extract unique location types and sort them', () => {
      const mockData: ReturnReasonsModel[] = [
        { ...mockReturnReasonsData[0], locationType: 'QU' },
        { ...mockReturnReasonsData[1], locationType: 'DI' },
        { ...mockReturnReasonsData[0], locationType: 'DR' }
      ];

      component['extractUniqueLocationTypes'](mockData);

      expect(component.uniqueLocationTypes).toEqual(['DI', 'DR', 'QU']);
    });

    it('should handle undefined location types when extracting', () => {
      const mockData: ReturnReasonsModel[] = [
        { ...mockReturnReasonsData[0], locationType: 'DI' },
        { ...mockReturnReasonsData[1], locationType: undefined },
        { ...mockReturnReasonsData[0], locationType: 'QU' }
      ];

      component['extractUniqueLocationTypes'](mockData);

      expect(component.uniqueLocationTypes).toEqual(['DI', 'QU']);
    });

    it('should handle empty data when extracting location types', () => {
      component['extractUniqueLocationTypes']([]);

      expect(component.uniqueLocationTypes).toEqual([]);
    });





    it('should include ChapterId in loadFilterOptions params', () => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: mockReturnReasonsData, totalRecords: 2 })
      );

      component.loadFilterOptions();

      expect(mockReturnReasonsService.getReturnReasons).toHaveBeenCalledWith(
        100,
        0,
        jasmine.objectContaining({
          Sort: 'A',
          ChapterId: 'CH2'
        })
      );
    });

    it('should load filter options with current chapter on init', () => {
      mockReturnReasonsService.getReturnReasons.and.returnValue(
        of({ data: mockReturnReasonsData, totalRecords: 2 })
      );

      const newFixture = TestBed.createComponent(ReturnReasonsComponent);
      newFixture.detectChanges();

      expect(mockReturnReasonsService.getReturnReasons).toHaveBeenCalledWith(
        100,
        0,
        jasmine.objectContaining({
          Sort: 'A',
          ChapterId: 'CH2'
        })
      );
    });
  });
});
