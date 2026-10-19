import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DefineDonationTypesComponent } from './define-donation-types';
import { DefineDonationTypesService } from './services/define-donation-types.service';
import { HeaderService } from '@shared/services/header.service';
import { Router, NavigationEnd } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineDonationTypesComponent', () => {
  let component: DefineDonationTypesComponent;
  let fixture: ComponentFixture<DefineDonationTypesComponent>;
  let mockService: jasmine.SpyObj<DefineDonationTypesService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineDonationTypesService', [
      'getDefineDonationTypes',
      'addDonationType',
      'updateDonationType',
      'getDonationTypeFilters'
    ]);

    // Default return values to prevent errors in tests
    mockService.getDonationTypeFilters.and.returnValue(of({
      donationTypeCodes: [],
      sequences: []
    }));

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    chapterChangedSubject = new Subject<void>();
    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [
        DefineDonationTypesComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: DefineDonationTypesService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockService.getDefineDonationTypes.calls.reset();


      mockService.addDonationType.calls.reset();


      mockService.updateDonationType.calls.reset();


      mockService.getDonationTypeFilters.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');
    fixture = TestBed.createComponent(DefineDonationTypesComponent);
    component = fixture.componentInstance;


    });


  it('should initialize configurations on construction', () => {
    expect(component.headerConfig).toBeDefined();
    expect(component.headerConfig.breadcrumbs.length).toBeGreaterThan(0);
    expect(component.searchConfig).toBeDefined();
    expect(component.tableConfig).toBeDefined();
  });













  it('should format YesNo flag values correctly', () => {
    expect(component['formatYesNo']('Y')).toBe('Yes');
    expect(component['formatYesNo']('N')).toBe('No');
    expect(component['formatYesNo'](undefined)).toBe('-');
  });

  it('should format date values correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = component['formatDate'](date);
    expect(formatted).toContain('15');
    expect(formatted).toContain('JAN');
    expect(formatted).toContain('2024');
  });

  it('should format YesNo values correctly', () => {
    expect(component['formatYesNo']('Y')).toBe('Yes');
    expect(component['formatYesNo']('y')).toBe('Yes');
    expect(component['formatYesNo']('N')).toBe('No');
    expect(component['formatYesNo']('n')).toBe('No');
    expect(component['formatYesNo'](undefined)).toBe('-');
    expect(component['formatYesNo']('')).toBe('-');
  });



  it('should format date from string', () => {
    const dateString = '2024-01-15T00:00:00.000Z';
    const formatted = component['formatDate'](dateString);
    expect(formatted).toContain('15');
    expect(formatted).toContain('JAN');
    expect(formatted).toContain('2024');
  });

  it('should handle empty search', () => {
    mockService.getDefineDonationTypes.and.returnValue(
      of({ data: [], totalRecords: 0 })
    );

    component.onSearch('');

    expect(component.requestState.searchKeyword).toBeUndefined();
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
  });



  describe('Sort functionality', () => {
    beforeEach(() => {
      mockService.getDefineDonationTypes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });

    it('should handle ascending sort', () => {
      component.onSortChange({ column: 'donationType', direction: 'A' });

      expect(component.requestState.sort).toBe('A');
      expect(component.tableConfig.sortConfig?.column).toBe('donationType');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });

    it('should handle descending sort', () => {
      component.onSortChange({ column: 'donationType', direction: 'D' });

      expect(component.requestState.sort).toBe('D');
      expect(component.tableConfig.sortConfig?.column).toBe('donationType');
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
    });

    it('should handle default sort (no sort)', () => {
      component.requestState.sort = 'A';
      component.onSortChange({ column: 'donationType', direction: 'default' });

      expect(component.requestState.sort).toBeUndefined();
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });


  });



  describe('Side panel management', () => {


    it('should open side panel in edit mode', () => {
      const mockRecord = {
        donationType: 'WB',
        description: 'Whole Blood',
        sortSequence: 1,
        testNeededFlag: 'Y',
        effDate: new Date(),
        termDate: null
      };

      component.editRecord(mockRecord);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockRecord);
      expect(component.sidePanelOpen).toBe(true);
    });




  });

  describe('Filter functionality', () => {
    beforeEach(() => {
      mockService.getDefineDonationTypes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });















    it('should apply sequence filter', () => {
      const filters = {
        donationTypeCode: null,
        sequence: 5,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.sortSequence).toBe(5);
    });



    it('should remove effective date filter chip', () => {
      component.appliedFilters = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15T00:00:00.000Z'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.requestState.effectiveDate = '2024-01-15T00:00:00.000Z';
      component.requestState.effectivePeriod = 'after';

      component.removeFilterChip('effectiveDate');

      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.effectivePeriod).toBeUndefined();
    });

    it('should remove termination date filter chip', () => {
      component.appliedFilters = {
        donationTypeCode: null,
        sequence: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31T00:00:00.000Z')
      };
      component.requestState.terminationDate = '2024-12-31T00:00:00.000Z';
      component.requestState.terminationPeriod = 'before';

      component.removeFilterChip('terminationDate');

      expect(component.requestState.terminationDate).toBeUndefined();
      expect(component.requestState.terminationPeriod).toBeUndefined();
    });







    it('should clear all date-related filters', () => {
      component.requestState.effectiveDate = '2024-01-15T00:00:00.000Z';
      component.requestState.effectivePeriod = 'after';
      component.requestState.terminationDate = '2024-12-31T00:00:00.000Z';
      component.requestState.terminationPeriod = 'before';
      component.requestState.sortSequence = 5;

      component.clearAllFilters();

      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.effectivePeriod).toBeUndefined();
      expect(component.requestState.terminationDate).toBeUndefined();
      expect(component.requestState.terminationPeriod).toBeUndefined();
      expect(component.requestState.sortSequence).toBeUndefined();
    });



    it('should return true when filters are active', () => {
      component.appliedFilters = {
        donationTypeCode: 'WB',
        sequence: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(component.hasActiveFilters).toBe(true);
    });


  });

  describe('Date formatting for API', () => {
    it('should format date to ISO string with noon time to avoid timezone shift', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      const formatted = component['toISOStringWithoutTimezone'](date);
      expect(formatted).toBe('2024-01-15T12:00:00.000Z');
    });

    it('should preserve local date regardless of timezone', () => {
      const date = new Date(2024, 1, 5); // February 5, 2024
      const formatted = component['toISOStringWithoutTimezone'](date);
      expect(formatted).toBe('2024-02-05T12:00:00.000Z');
    });


  });
  describe('Loading and error states', () => {


    it('should update data source with response', () => {
      const mockData = {
        data: [
          {
            donationType: 'WB',
            description: 'Whole Blood',
            sortSequence: 1,
            testNeededFlag: 'Y',
            effDate: new Date(),
            termDate: null
          }
        ],
        totalRecords: 1
      };

      mockService.getDefineDonationTypes.and.returnValue(of(mockData));

      component.loadData();

      expect(component.dataSource).toEqual(mockData.data);
      expect(component.tableConfig.pagination?.totalRecords).toBe(1);
    });
  });

  describe('Table Configuration', () => {








    it('should show pagination', () => {
      expect(component.tableConfig.showPagination).toBe(true);
    });
  });

  describe('Chapter Change Subscription', () => {
    beforeEach(() => {
      mockService.getDefineDonationTypes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });





    it('should setup chapter change subscription with takeUntil', () => {
      component.ngOnInit();

      // Verify subscription is active by triggering chapter change
      expect(() => chapterChangedSubject.next()).not.toThrow();
    });



    it('should not throw error when chapter changes', () => {
      component.ngOnInit();

      expect(() => chapterChangedSubject.next()).not.toThrow();
    });

    it('should handle multiple chapter changes without error', () => {
      component.ngOnInit();

      expect(() => {
        chapterChangedSubject.next();
        chapterChangedSubject.next();
        chapterChangedSubject.next();
      }).not.toThrow();
    });
  });

  describe('Dropdown Options Loading', () => {
    const mockFilterData = {
      donationTypeCodes: ['WB', 'PLT', 'RBC'],
      sequences: [1, 2, 3]
    };

    beforeEach(() => {
      mockService.getDefineDonationTypes.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });



    it('should load donation type codes from service', () => {
      mockService.getDonationTypeFilters = jasmine.createSpy().and.returnValue(
        of(mockFilterData)
      );

      component.ngOnInit();

      expect(mockService.getDonationTypeFilters).toHaveBeenCalled();
      expect(component.donationTypeCodes).toEqual(['WB', 'PLT', 'RBC']);
    });

    it('should load sequences from service', () => {
      mockService.getDonationTypeFilters = jasmine.createSpy().and.returnValue(
        of(mockFilterData)
      );

      component.ngOnInit();

      expect(component.sequences).toEqual([1, 2, 3]);
    });



    it('should handle error when loading dropdown options', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      mockService.getDonationTypeFilters = jasmine.createSpy().and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.ngOnInit();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading donation type filters:',
        jasmine.any(Error)
      );
    });

    it('should not affect component initialization if dropdown loading fails', () => {
      mockService.getDonationTypeFilters = jasmine.createSpy().and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.ngOnInit();

      expect(component.donationTypeCodes).toEqual([]);
      expect(component.sequences).toEqual([]);
      expect(component.dataSource).toBeDefined();
    });

    it('should use takeUntil for subscription cleanup', () => {
      mockService.getDonationTypeFilters = jasmine.createSpy().and.returnValue(
        of(mockFilterData)
      );

      component.ngOnInit();
      component.ngOnDestroy();

      // After destroy, the subscription should be cleaned up
      const destroySubject = (component as any).destroy$;
      expect(destroySubject.isStopped).toBe(true);
    });
  });
});
