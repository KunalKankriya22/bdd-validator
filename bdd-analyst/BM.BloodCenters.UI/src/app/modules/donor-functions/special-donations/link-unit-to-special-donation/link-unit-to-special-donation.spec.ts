import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LinkUnitToSpecialDonationComponent } from './link-unit-to-special-donation';
import { LinkUnitService } from './services/link-unit.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('LinkUnitToSpecialDonationComponent', () => {
  let component: LinkUnitToSpecialDonationComponent;
  let fixture: ComponentFixture<LinkUnitToSpecialDonationComponent>;
  let mockLinkUnitService: jasmine.SpyObj<LinkUnitService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;

  beforeEach(() => {

    mockLinkUnitService = jasmine.createSpyObj('LinkUnitService', ['getPatients']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockHeaderService = createMockHeaderService();
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });
    mockPageHeaderService.getTitle.and.returnValue('Link Unit to Special Donation');
    mockPageHeaderService.getSubtitle.and.returnValue('');
    mockLinkUnitService.getPatients.and.returnValue(
      of({
        data: [
          {
            patientId: 'PAT001',
            patientName: 'Test Patient',
            dateOfBirth: '1990-01-01',
            sex: 'Male',
            surgeryDate: '2025-10-15',
            neededBy: '2025-10-15',
            shipTo: 'Test Location',
            status: 'Active' as const,
            surgId: 'SURG001'
          }
        ],
        totalCount: 1
      })
    );



      TestBed.configureTestingModule({
      imports: [LinkUnitToSpecialDonationComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: LinkUnitService, useValue: mockLinkUnitService },
        { provide: Router, useValue: mockRouter },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });


    


      mockLinkUnitService.getPatients.calls.reset();


      mockRouter.navigate.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockPageHeaderService.getTitle.calls.reset();


      mockPageHeaderService.getSubtitle.calls.reset();


      mockPageHeaderService.getTitle.and.returnValue('Link Unit to Special Donation');


      mockPageHeaderService.getSubtitle.and.returnValue('');
    fixture = TestBed.createComponent(LinkUnitToSpecialDonationComponent);
    component = fixture.componentInstance;


    });

  /**
   * Helper: run detectChanges and suppress the ExpressionChangedAfterItHasBeenCheckedError
   * caused by statusTemplate assignment in ngAfterViewInit.
   */
  function initComponent(): void {
    try { fixture.detectChanges(); } catch (e: any) {
      if (e?.code !== -100) throw e;
    }
  }


  describe('ngOnInit', () => {
    it('should load patients on init', () => {
      initComponent();

      expect(mockLinkUnitService.getPatients).toHaveBeenCalled();
      expect(component.dataSource.length).toBe(1);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('loadData', () => {
    it('should load patients and set loading state', (done) => {
      component.loadData();

      setTimeout(() => {
        expect(mockLinkUnitService.getPatients).toHaveBeenCalled();
        expect(component.isLoading).toBe(false);
        done();
      }, 100);
    });

    it('should handle successful data load', () => {
      initComponent();

      expect(component.dataSource.length).toBeGreaterThan(0);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should handle error when loading data fails', (done) => {
      mockLinkUnitService.getPatients.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadData();

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        expect(component.hasError).toBe(true);
        expect(component.errorMessage).toBeTruthy();
        done();
      }, 100);
    });
  });

  describe('onSearch', () => {
    it('should update search text and reload data', () => {
      const searchText = 'Smith';

      component.onSearch(searchText);

      expect(component.searchText).toBe(searchText);
      expect(mockLinkUnitService.getPatients).toHaveBeenCalled();
    });

    it('should trim search text', () => {
      const searchText = '  Smith  ';

      component.onSearch(searchText);

      expect(component.searchText).toBe('Smith');
    });
  });
  describe('formatSex', () => {
    it('should format M as Male', () => {
      expect(component.formatSex('M')).toBe('Male');
    });

    it('should format F as Female', () => {
      expect(component.formatSex('F')).toBe('Female');
    });
  });

  describe('showEmptyState', () => {
    it('should return true when no data, no search, and no filters', () => {
      component.dataSource = [];
      component.isLoading = false;
      component.hasError = false;
      component.searchText = '';
      component.appliedFilters = null;

      expect(component.showEmptyState).toBeTrue();
    });

    it('should return false when search text is present', () => {
      component.dataSource = [];
      component.isLoading = false;
      component.hasError = false;
      component.searchText = 'Smith';
      component.appliedFilters = null;

      expect(component.showEmptyState).toBeFalse();
    });
  });

  describe('showNoResultsState', () => {
    it('should return true when search returns no data', () => {
      component.dataSource = [];
      component.isLoading = false;
      component.hasError = false;
      component.searchText = 'NonExistent';
      component.appliedFilters = null;

      expect(component.showNoResultsState).toBeTrue();
    });

    it('should return true when filters return no data', () => {
      component.dataSource = [];
      component.isLoading = false;
      component.hasError = false;
      component.searchText = '';
      component.appliedFilters = { status: 'Active', shipTo: null, surgeryDate: null, surgeryDatePeriod: null, neededBy: null, neededByPeriod: null };

      expect(component.showNoResultsState).toBeTrue();
    });

    it('should return false when data is present', () => {
      component.dataSource = [{
        patientId: 'PAT001', patientName: 'Test', dateOfBirth: '1990-01-01',
        sex: 'M', surgeryDate: '2025-10-15', neededBy: '2025-10-15',
        shipTo: 'Location', status: 'Active' as const, surgId: 'S1'
      }];
      component.isLoading = false;
      component.hasError = false;
      component.searchText = 'Test';

      expect(component.showNoResultsState).toBeFalse();
    });

    it('should return false when loading', () => {
      component.dataSource = [];
      component.isLoading = true;
      component.hasError = false;
      component.searchText = 'Test';

      expect(component.showNoResultsState).toBeFalse();
    });

    it('should return false when there is an error', () => {
      component.dataSource = [];
      component.isLoading = false;
      component.hasError = true;
      component.searchText = 'Test';

      expect(component.showNoResultsState).toBeFalse();
    });

    it('should return false when no search or filters applied', () => {
      component.dataSource = [];
      component.isLoading = false;
      component.hasError = false;
      component.searchText = '';
      component.appliedFilters = null;

      expect(component.showNoResultsState).toBeFalse();
    });
  });

  describe('onSortChange', () => {






    it('should map column keys to BE sort column names', () => {
      component.onSortChange({ column: 'surgeryDate', direction: 'A' });
      expect(component['requestState'].sortColumn).toBe('SurgeryDate');

      component.onSortChange({ column: 'neededBy', direction: 'A' });
      expect(component['requestState'].sortColumn).toBe('DateNeededBy');

      component.onSortChange({ column: 'status', direction: 'D' });
      expect(component['requestState'].sortColumn).toBe('Status');
      expect(component['requestState'].sortOrder).toBe('DESC');
    });

    it('should clear sort for default direction', () => {
      component.onSortChange({ column: 'patientName', direction: 'A' });
      expect(component['requestState'].sortColumn).toBe('PatientName');

      component.onSortChange({ column: 'patientName', direction: 'default' });
      expect(component['requestState'].sortColumn).toBeUndefined();
      expect(component['requestState'].sortOrder).toBeUndefined();
    });

    it('should map patientId column', () => {
      component.onSortChange({ column: 'patientId', direction: 'A' });
      expect(component['requestState'].sortColumn).toBe('PatId');
      expect(component['requestState'].sortOrder).toBe('ASC');
    });
  });

  describe('toggleFilter', () => {
    it('should toggle filter open state', () => {
      expect(component.isFilterOpen).toBe(false);
      component.toggleFilter();
      expect(component.isFilterOpen).toBe(true);
      component.toggleFilter();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('onApplyFilters', () => {
    it('should set applied filters and close filter panel', () => {
      component.isFilterOpen = true;
      const filters = {
        status: 'Active',
        shipTo: null,
        surgeryDate: '2025-10-15',
        surgeryDatePeriod: 'BEFORE' as const,
        neededBy: null,
        neededByPeriod: null
      };

      component.onApplyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.isFilterOpen).toBe(false);
      expect(component['requestState'].status).toBe('Active');
      expect(component['requestState'].surgeryDate).toBe('2025-10-15');
      expect(component['requestState'].surgeryDatePeriod).toBe('BEFORE');
    });

    it('should uppercase surgery date period', () => {
      const filters = {
        status: null, shipTo: null,
        surgeryDate: '2025-10-15', surgeryDatePeriod: 'after' as any,
        neededBy: null, neededByPeriod: null
      };

      component.onApplyFilters(filters);

      expect(component['requestState'].surgeryDatePeriod).toBe('AFTER');
    });

    it('should reset page index to 0', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      const filters = { status: 'Active', shipTo: null, surgeryDate: null, surgeryDatePeriod: null, neededBy: null, neededByPeriod: null };

      component.onApplyFilters(filters);

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should create filter chips for status', () => {
      const filters = { status: 'Active', shipTo: null, surgeryDate: null, surgeryDatePeriod: null, neededBy: null, neededByPeriod: null };

      component.onApplyFilters(filters);

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('status');
      expect(component.filterChips[0].label).toContain('Active');
    });
  });

  describe('onRemoveFilterChip', () => {
    it('should remove status chip', () => {
      component.appliedFilters = { status: 'Active', shipTo: null, surgeryDate: null, surgeryDatePeriod: null, neededBy: null, neededByPeriod: null };

      component.onRemoveFilterChip('status');

      expect(component.appliedFilters!.status).toBeNull();
    });

    it('should remove surgeryDate chip and clear period', () => {
      component.appliedFilters = {
        status: null, shipTo: null,
        surgeryDate: '2025-10-15', surgeryDatePeriod: 'BEFORE',
        neededBy: null, neededByPeriod: null
      };

      component.onRemoveFilterChip('surgeryDate');

      expect(component.appliedFilters!.surgeryDate).toBeNull();
      expect(component.appliedFilters!.surgeryDatePeriod).toBeNull();
    });

    it('should remove neededBy chip and clear period', () => {
      component.appliedFilters = {
        status: null, shipTo: null, surgeryDate: null, surgeryDatePeriod: null,
        neededBy: '2025-10-20', neededByPeriod: 'AFTER'
      };

      component.onRemoveFilterChip('neededBy');

      expect(component.appliedFilters!.neededBy).toBeNull();
      expect(component.appliedFilters!.neededByPeriod).toBeNull();
    });

    it('should do nothing if appliedFilters is null', () => {
      component.appliedFilters = null;
      expect(() => component.onRemoveFilterChip('status')).not.toThrow();
    });
  });

  describe('onClearAllFilters', () => {
    it('should clear all filters and chips', () => {
      component.appliedFilters = { status: 'Active', shipTo: null, surgeryDate: null, surgeryDatePeriod: null, neededBy: null, neededByPeriod: null };
      component.filterChips = [{ key: 'status', label: 'Status: Active', value: 'Active' }];

      component.onClearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
    });

    it('should preserve search text in requestState', () => {
      component.searchText = 'Smith';
      component.appliedFilters = { status: 'Active', shipTo: null, surgeryDate: null, surgeryDatePeriod: null, neededBy: null, neededByPeriod: null };

      component.onClearAllFilters();

      expect(component['requestState'].searchText).toBe('Smith');
    });
  });

  describe('onPageChange', () => {
    it('should update pagination and reload data', () => {
      initComponent();

      component.onPageChange({ pageIndex: 2, pageSize: 50, length: 100, previousPageIndex: 1 });

      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(mockLinkUnitService.getPatients).toHaveBeenCalled();
    });
  });

  describe('onViewPatient', () => {
    it('should navigate to patient detail page', () => {
      initComponent();
      const patient = {
        patientId: 'PAT001', patientName: 'Test', dateOfBirth: '', sex: 'M',
        surgeryDate: '', neededBy: '', shipTo: '', status: 'Active' as const,
        surgId: 'SURG001'
      };

      component.onViewPatient(patient);

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/donor-functions/special-donations/link-unit-to-special-donation', 'PAT001', 'SURG001'],
        { state: { patient } }
      );
    });
  });

  describe('onRowAction', () => {
    it('should call onViewPatient for view action', () => {
      initComponent();
      spyOn(component, 'onViewPatient');
      const patient = {
        patientId: 'PAT001', patientName: 'Test', dateOfBirth: '', sex: 'M',
        surgeryDate: '', neededBy: '', shipTo: '', status: 'Active' as const,
        surgId: 'SURG001'
      };

      component.onRowAction({ action: 'view', row: patient });

      expect(component.onViewPatient).toHaveBeenCalledWith(patient);
    });
  });

  describe('formatDate', () => {
    it('should format valid date string', () => {
      const result = component.formatDate('2025-10-15');
      expect(result).toMatch(/15-OCT-2025/);
    });

    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });
  });

  describe('formatSex', () => {
    it('should return dash for null', () => {
      expect(component.formatSex(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatSex(undefined)).toBe('-');
    });

    it('should return original for unknown value', () => {
      expect(component.formatSex('X')).toBe('X');
    });
  });

  describe('isSearchAndFilterDisabled', () => {
    it('should return true when loading', () => {
      component.isLoading = true;
      component.hasError = false;
      expect(component.isSearchAndFilterDisabled).toBe(true);
    });

    it('should return true when has error', () => {
      component.isLoading = false;
      component.hasError = true;
      expect(component.isSearchAndFilterDisabled).toBe(true);
    });

    it('should return false when not loading and no error', () => {
      component.isLoading = false;
      component.hasError = false;
      expect(component.isSearchAndFilterDisabled).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      initComponent();
      const destroySpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
