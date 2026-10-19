import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MaintainVehicleDetailsComponent } from './maintain-vehicle-details';
import { VehicleDetailsService } from './services/vehicle-details.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { VehicleDetails, VehicleDetailsFilterValue } from './models/vehicle-details.model';
import { PageEvent } from '@angular/material/paginator';
import moment from 'moment';

describe('MaintainVehicleDetailsComponent', () => {
  let component: MaintainVehicleDetailsComponent;
  let fixture: ComponentFixture<MaintainVehicleDetailsComponent>;
  let mockVehicleService: jasmine.SpyObj<VehicleDetailsService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockVehicle: VehicleDetails = {
    vehicleId: 'TEST001',
    vehicleName: 'Test Vehicle',
    vehicleType: 'VAN',
    identificationNumber: 'VIN123',
    effectiveDate: '2025-01-01T00:00:00Z',
    terminationDate: '2025-12-31T00:00:00Z'
  };

  const mockVehicle2: VehicleDetails = {
    vehicleId: 'TEST002',
    vehicleName: 'Test Vehicle 2',
    vehicleType: 'COACH',
    effectiveDate: '2025-02-01T00:00:00Z'
  };

  beforeEach(() => {

    // Create mock service
    mockVehicleService = jasmine.createSpyObj('VehicleDetailsService', [
      'getVehicles',
      'getVehicleById',
      'createVehicle',
      'updateVehicle',
      'addNote',
      'updateNote',
      'deleteNote',
      'getVehicleTypes',
      'getVehicleIds',
      'getNotes'
    ]);

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'getChapterLocalDateTime',
      'isChapterLocalDateAvailable',
      'fetchChapterTimezone'
    ]);

    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2025-06-15'));

    mockVehicleService.getVehicleTypes.and.returnValue(of([
      { value: 'COACH', label: 'COACH' },
      { value: 'VAN', label: 'VAN' }
    ]));

    mockVehicleService.getVehicleIds.and.returnValue(of([
      { value: 'VECHL11111', label: 'VECHL11111 - VT-01' }
    ]));

    // Setup default mock responses
    mockVehicleService.getVehicles.and.returnValue(of({
      data: [],
      total: 0
    }));



      TestBed.configureTestingModule({
      imports: [
        MaintainVehicleDetailsComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: VehicleDetailsService, useValue: mockVehicleService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        Overlay
      ]
    });



      mockVehicleService.getVehicles.calls.reset();
      mockVehicleService.getVehicleById.calls.reset();
      mockVehicleService.createVehicle.calls.reset();
      mockVehicleService.updateVehicle.calls.reset();
      mockVehicleService.addNote.calls.reset();
      mockVehicleService.updateNote.calls.reset();
      mockVehicleService.deleteNote.calls.reset();
      mockVehicleService.getVehicleTypes.calls.reset();
      mockVehicleService.getVehicleIds.calls.reset();
      mockVehicleService.getNotes.calls.reset();


    fixture = TestBed.createComponent(MaintainVehicleDetailsComponent);
    component = fixture.componentInstance;


    });



  it('should initialize with correct default values', () => {
    expect(component.pageSize).toBe(25);
    expect(component.pageIndex).toBe(0);
    expect(component.sortDirection).toBe('default');
    expect(component.dataSource.data).toEqual([]);
  });

  it('should open add new vehicle side panel', () => {
    component.addNewVehicle();
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  });

  it('should open edit vehicle side panel', () => {
    const mockVehicleData = {
      vehicleId: 'TEST001',
      vehicleName: 'Test Vehicle',
      vehicleType: 'VAN',
      effectiveDate: '2025-01-01T00:00:00Z'
    } as any;

    component.editRecord(mockVehicleData);
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toBe(mockVehicleData);
  });

  // --- Initialization and Configuration Tests ---

  describe('initializeConfigurations', () => {
    it('should set headerConfig with correct breadcrumbs', () => {
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[0].link).toBe('/home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Maintain Vehicle Details');
      expect(component.headerConfig.breadcrumbs[1].link).toBe('');
    });

    it('should set headerConfig with ADD NEW VEHICLE DETAILS action', () => {
      expect(component.headerConfig.actions.length).toBe(1);
      expect(component.headerConfig.actions[0].label).toBe('ADD NEW VEHICLE DETAILS');
      expect(component.headerConfig.actions[0].icon).toBe('add');
      expect(component.headerConfig.actions[0].ariaLabel).toBe('Add new vehicle details');
    });

    it('should set searchConfig with correct values', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Vehicle Name or Vehicle ID');
      expect(component.searchConfig.minLength).toBe(3);
      expect(component.searchConfig.ariaLabel).toBe('Search vehicles by vehicle name or ID');
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
      expect(component.searchConfig.alwaysShowTooltip).toBeTrue();
    });

    it('should set displayedColumns correctly', () => {
      expect(component.displayedColumns).toEqual([
        'expand',
        'vehicleId',
        'vehicleName',
        'vehicleType',
        'identificationNumber',
        'effectiveDate',
        'terminationDate',
        'actions'
      ]);
    });

    it('should set pageSizeOptions correctly', () => {
      expect(component.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should initialize requestState with showTerminated false', () => {
      expect(component.requestState).toEqual({ showTerminated: false });
    });

    it('should initialize currentYear to current year', () => {
      expect(component.currentYear).toBe(new Date().getFullYear());
    });

    it('should initialize side panel state correctly', () => {
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelActiveTab).toBe(0);
    });

    it('should initialize filter state correctly', () => {
      expect(component.isFilterOpen).toBeFalse();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should initialize loading/error state correctly', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.searchText).toBe('');
    });

    it('should call addNewVehicle when header action onClick is invoked', () => {
      spyOn(component, 'addNewVehicle');
      component.headerConfig.actions[0].onClick();
      expect(component.addNewVehicle).toHaveBeenCalled();
    });
  });

  // --- ngOnInit Tests ---

  describe('ngOnInit', () => {
    it('should call loadData on init', () => {
      spyOn(component, 'loadData');
      component.ngOnInit();
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  // --- ngOnDestroy Tests ---

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySubject = (component as any).destroy$;
      spyOn(destroySubject, 'next');
      spyOn(destroySubject, 'complete');
      component.ngOnDestroy();
      expect(destroySubject.next).toHaveBeenCalled();
      expect(destroySubject.complete).toHaveBeenCalled();
    });

    it('should dispose overlayRef if it exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;
      component.ngOnDestroy();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not throw if overlayRef is null', () => {
      (component as any).overlayRef = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // --- loadData Tests ---

  describe('loadData', () => {
    it('should set isLoading to true and hasError to false when called', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.loadData();
      // After subscribe completes synchronously, isLoading should be false again
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
    });

    it('should call getVehicles with correct filter parameters', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.searchText = 'test';
      component.sortColumn = 'vehicleName';
      component.sortDirection = 'A';
      component.pageSize = 10;
      component.pageIndex = 2;
      component.loadData();

      expect(mockVehicleService.getVehicles).toHaveBeenCalledWith(
        jasmine.objectContaining({
          showTerminated: false,
          chapterLocalDate: jasmine.any(String),
          searchText: 'test',
          sort: 'vehicleName_asc',
          sortDirection: 'ASC'
        }),
        10,
        2
      );
    });

    it('should not include searchText when it is empty', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.searchText = '';
      component.sortDirection = 'default';
      component.loadData();

      const calledFilter = mockVehicleService.getVehicles.calls.mostRecent().args[0];
      expect(calledFilter.searchText).toBeUndefined();
    });

    it('should set sort and sortDirection correctly when sortDirection is D', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.sortColumn = 'vehicleType';
      component.sortDirection = 'D';
      component.loadData();

      const calledFilter = mockVehicleService.getVehicles.calls.mostRecent().args[0];
      expect(calledFilter.sort).toBe('vehicleType_desc');
      expect(calledFilter.sortDirection).toBe('DESC');
    });

    it('should not include sort/sortDirection when sortDirection is default', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.sortDirection = 'default';
      component.loadData();

      const calledFilter = mockVehicleService.getVehicles.calls.mostRecent().args[0];
      expect(calledFilter.sort).toBeUndefined();
      expect(calledFilter.sortDirection).toBeUndefined();
    });

    it('should populate dataSource and totalRecords on success', () => {
      const mockData = [mockVehicle, mockVehicle2];
      mockVehicleService.getVehicles.and.returnValue(of({ data: mockData, total: 2 }));
      component.loadData();

      expect(component.dataSource.data).toEqual(mockData);
      expect(component.totalRecords).toBe(2);
      expect(component.isLoading).toBeFalse();
    });

    it('should clear expandedElements on successful load', () => {
      component.expandedElements.add(mockVehicle);
      mockVehicleService.getVehicles.and.returnValue(of({ data: [mockVehicle], total: 1 }));
      component.loadData();

      expect(component.expandedElements.size).toBe(0);
    });

    it('should handle error from getVehicles', () => {
      mockVehicleService.getVehicles.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(console, 'error');
      component.loadData();

      expect(component.hasError).toBeTrue();
      expect(component.errorMessage).toBe('Failed to load vehicle details. Please try again.');
      expect(component.isLoading).toBeFalse();
      expect(console.error).toHaveBeenCalled();
    });

    it('should use chapterTimezoneService to get chapter local date', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.loadData();
      expect(mockChapterTimezoneService.getChapterLocalDate).toHaveBeenCalled();
    });

    it('should pass chapterLocalDate in YYYY-MM-DD format', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.loadData();

      const calledFilter = mockVehicleService.getVehicles.calls.mostRecent().args[0];
      expect(calledFilter.chapterLocalDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // --- onSearch Tests ---

  describe('onSearch', () => {
    it('should set searchText and reset pageIndex, then load data', () => {
      spyOn(component, 'loadData');
      component.pageIndex = 5;
      component.onSearch('test keyword');

      expect(component.searchText).toBe('test keyword');
      expect(component.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should handle empty search string', () => {
      spyOn(component, 'loadData');
      component.onSearch('');

      expect(component.searchText).toBe('');
      expect(component.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  // --- onPageChange Tests ---

  describe('onPageChange', () => {
    it('should update pageIndex and pageSize and call loadData', () => {
      spyOn(component, 'loadData');
      const pageEvent: PageEvent = { pageIndex: 3, pageSize: 50, length: 100 };
      component.onPageChange(pageEvent);

      expect(component.pageIndex).toBe(3);
      expect(component.pageSize).toBe(50);
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should handle first page event', () => {
      spyOn(component, 'loadData');
      const pageEvent: PageEvent = { pageIndex: 0, pageSize: 10, length: 50 };
      component.onPageChange(pageEvent);

      expect(component.pageIndex).toBe(0);
      expect(component.pageSize).toBe(10);
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  // --- onSort Tests ---

  describe('onSort', () => {
    it('should cycle from default to A when sorting same column', () => {
      spyOn(component, 'loadData');
      component.sortColumn = 'vehicleId';
      component.sortDirection = 'default';
      component.onSort('vehicleId');

      expect(component.sortDirection).toBe('A');
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should cycle from A to D when sorting same column', () => {
      spyOn(component, 'loadData');
      component.sortColumn = 'vehicleId';
      component.sortDirection = 'A';
      component.onSort('vehicleId');

      expect(component.sortDirection).toBe('D');
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should cycle from D to default when sorting same column', () => {
      spyOn(component, 'loadData');
      component.sortColumn = 'vehicleId';
      component.sortDirection = 'D';
      component.onSort('vehicleId');

      expect(component.sortDirection).toBe('default');
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should set new column and direction A when sorting a different column', () => {
      spyOn(component, 'loadData');
      component.sortColumn = 'vehicleId';
      component.sortDirection = 'D';
      component.onSort('vehicleName');

      expect(component.sortColumn).toBe('vehicleName');
      expect(component.sortDirection).toBe('A');
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  // --- Row Expansion Tests ---

  describe('toggleRow', () => {
    it('should add element to expandedElements if not expanded', () => {
      component.toggleRow(mockVehicle);
      expect(component.expandedElements.has(mockVehicle)).toBeTrue();
    });

    it('should remove element from expandedElements if already expanded', () => {
      component.expandedElements.add(mockVehicle);
      component.toggleRow(mockVehicle);
      expect(component.expandedElements.has(mockVehicle)).toBeFalse();
    });

    it('should stop event propagation when event is provided', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
      component.toggleRow(mockVehicle, mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not throw when event is undefined', () => {
      expect(() => component.toggleRow(mockVehicle)).not.toThrow();
    });
  });

  describe('isExpanded', () => {
    it('should return true if element is in expandedElements', () => {
      component.expandedElements.add(mockVehicle);
      expect(component.isExpanded(mockVehicle)).toBeTrue();
    });

    it('should return false if element is not in expandedElements', () => {
      expect(component.isExpanded(mockVehicle)).toBeFalse();
    });
  });

  describe('areAllExpanded', () => {
    it('should return true when all rows are expanded', () => {
      component.dataSource.data = [mockVehicle, mockVehicle2];
      component.expandedElements.add(mockVehicle);
      component.expandedElements.add(mockVehicle2);
      expect(component.areAllExpanded()).toBeTrue();
    });

    it('should return false when not all rows are expanded', () => {
      component.dataSource.data = [mockVehicle, mockVehicle2];
      component.expandedElements.add(mockVehicle);
      expect(component.areAllExpanded()).toBeFalse();
    });

    it('should return false when no data is present', () => {
      component.dataSource.data = [];
      expect(component.areAllExpanded()).toBeFalse();
    });

    it('should return false when expandedElements is empty but data exists', () => {
      component.dataSource.data = [mockVehicle];
      expect(component.areAllExpanded()).toBeFalse();
    });
  });

  describe('toggleAllRows', () => {
    it('should expand all rows when not all are expanded', () => {
      component.dataSource.data = [mockVehicle, mockVehicle2];
      component.toggleAllRows();
      expect(component.expandedElements.size).toBe(2);
      expect(component.expandedElements.has(mockVehicle)).toBeTrue();
      expect(component.expandedElements.has(mockVehicle2)).toBeTrue();
    });

    it('should collapse all rows when all are expanded', () => {
      component.dataSource.data = [mockVehicle, mockVehicle2];
      component.expandedElements.add(mockVehicle);
      component.expandedElements.add(mockVehicle2);
      component.toggleAllRows();
      expect(component.expandedElements.size).toBe(0);
    });

    it('should expand all when some are expanded', () => {
      component.dataSource.data = [mockVehicle, mockVehicle2];
      component.expandedElements.add(mockVehicle);
      component.toggleAllRows();
      expect(component.expandedElements.size).toBe(2);
    });
  });

  // --- Side Panel Tests ---

  describe('editRecord', () => {
    it('should set side panel to edit mode with vehicle data', () => {
      component.editRecord(mockVehicle);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockVehicle);
      expect(component.sidePanelActiveTab).toBe(0);
      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('addNewVehicle', () => {
    it('should set side panel to add mode with null data', () => {
      component.addNewVehicle();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelActiveTab).toBe(0);
      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('openNotes', () => {
    it('should set side panel to edit mode with notes tab active', () => {
      component.openNotes(mockVehicle);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockVehicle);
      expect(component.sidePanelActiveTab).toBe(1);
      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('closeSidePanel', () => {
    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockVehicle;
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('onSaveSuccess', () => {
    it('should close side panel and reload data', () => {
      spyOn(component, 'closeSidePanel');
      spyOn(component, 'loadData');
      component.onSaveSuccess();
      expect(component.closeSidePanel).toHaveBeenCalled();
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  // --- Filter Panel Tests ---

  describe('openFilter', () => {
    it('should call closeFilter if already open', () => {
      spyOn(component, 'closeFilter');
      component.isFilterOpen = true;
      component.openFilter();
      expect(component.closeFilter).toHaveBeenCalled();
    });

    it('should return early if filterBtn is not available', () => {
      component.isFilterOpen = false;
      (component as any).filterBtn = undefined;
      (component as any).tableCard = { nativeElement: document.createElement('div') };
      component.openFilter();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should return early if tableCard is not available', () => {
      component.isFilterOpen = false;
      (component as any).filterBtn = { nativeElement: document.createElement('button') };
      (component as any).tableCard = undefined;
      component.openFilter();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should return early if both filterBtn and tableCard are not available', () => {
      component.isFilterOpen = false;
      (component as any).filterBtn = undefined;
      (component as any).tableCard = undefined;
      component.openFilter();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('closeFilter', () => {
    it('should dispose overlay and set isFilterOpen to false', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;
      component.closeFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should handle null overlayRef gracefully', () => {
      (component as any).overlayRef = null;
      component.isFilterOpen = true;
      component.closeFilter();

      expect(component.isFilterOpen).toBeFalse();
    });

    it('should set overlayRef to null after dispose', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;
      component.closeFilter();
      expect((component as any).overlayRef).toBeNull();
    });
  });

  // --- Filter Application Tests ---

  describe('applyFilters', () => {
    it('should update appliedFilters, requestState, filterChips and reload data', () => {
      spyOn(component, 'loadData');
      const filters: VehicleDetailsFilterValue = {
        vehicleId: 'V001',
        vehicleType: 'VAN',
        showTerminated: true,
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'After',
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'Before'
      };

      component.pageIndex = 5;
      component.applyFilters(filters);

      expect(component.appliedFilters).toBe(filters);
      expect(component.requestState.vehicleId).toBe('V001');
      expect(component.requestState.vehicleType).toBe('VAN');
      expect(component.requestState.showTerminated).toBeTrue();
      expect(component.requestState.effDate).toBe('2025-01-01');
      expect(component.requestState.effDatePeriod).toBe('After');
      expect(component.requestState.termDate).toBe('2025-12-31');
      expect(component.requestState.termDatePeriod).toBe('Before');
      expect(component.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should set undefined for empty/null filter values', () => {
      spyOn(component, 'loadData');
      const filters: VehicleDetailsFilterValue = {
        vehicleId: null,
        vehicleType: null,
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.applyFilters(filters);

      expect(component.requestState.vehicleId).toBeUndefined();
      expect(component.requestState.vehicleType).toBeUndefined();
      expect(component.requestState.showTerminated).toBeFalse();
      expect(component.requestState.effDate).toBeUndefined();
      expect(component.requestState.effDatePeriod).toBeUndefined();
      expect(component.requestState.termDate).toBeUndefined();
      expect(component.requestState.termDatePeriod).toBeUndefined();
    });

    it('should generate filter chips from applied filters with vehicleId', () => {
      spyOn(component, 'loadData');
      const filters: VehicleDetailsFilterValue = {
        vehicleId: 'V001',
        vehicleType: null,
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('vehicleId');
    });

    it('should generate multiple filter chips for multiple active filters', () => {
      spyOn(component, 'loadData');
      const filters: VehicleDetailsFilterValue = {
        vehicleId: 'V001',
        vehicleType: 'VAN',
        showTerminated: true,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBe(3);
    });

    it('should reset pageIndex to 0 when applying filters', () => {
      spyOn(component, 'loadData');
      component.pageIndex = 10;
      const filters: VehicleDetailsFilterValue = {
        vehicleId: null,
        vehicleType: null,
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.applyFilters(filters);
      expect(component.pageIndex).toBe(0);
    });

    it('should handle empty string filter values as undefined', () => {
      spyOn(component, 'loadData');
      const filters: VehicleDetailsFilterValue = {
        vehicleId: '',
        vehicleType: '',
        showTerminated: false,
        effectiveDate: '',
        effectiveDatePeriod: null,
        terminationDate: '',
        terminationDatePeriod: null
      };

      component.applyFilters(filters);

      expect(component.requestState.vehicleId).toBeUndefined();
      expect(component.requestState.vehicleType).toBeUndefined();
      expect(component.requestState.effDate).toBeUndefined();
      expect(component.requestState.termDate).toBeUndefined();
    });
  });

  describe('onRemoveFilterChip', () => {
    it('should return early if appliedFilters is null', () => {
      spyOn(component, 'applyFilters');
      component.appliedFilters = null;
      component.onRemoveFilterChip('vehicleId');
      expect(component.applyFilters).not.toHaveBeenCalled();
    });

    it('should remove the vehicleId filter chip and reapply', () => {
      spyOn(component, 'applyFilters');
      component.appliedFilters = {
        vehicleId: 'V001',
        vehicleType: 'VAN',
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.onRemoveFilterChip('vehicleId');
      expect(component.applyFilters).toHaveBeenCalled();
      const appliedArg = (component.applyFilters as jasmine.Spy).calls.mostRecent().args[0];
      expect(appliedArg.vehicleId).toBeNull();
      expect(appliedArg.vehicleType).toBe('VAN');
    });

    it('should remove vehicleType filter chip', () => {
      spyOn(component, 'applyFilters');
      component.appliedFilters = {
        vehicleId: 'V001',
        vehicleType: 'VAN',
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.onRemoveFilterChip('vehicleType');
      const appliedArg = (component.applyFilters as jasmine.Spy).calls.mostRecent().args[0];
      expect(appliedArg.vehicleType).toBeNull();
      expect(appliedArg.vehicleId).toBe('V001');
    });

    it('should remove showTerminated filter chip', () => {
      spyOn(component, 'applyFilters');
      component.appliedFilters = {
        vehicleId: null,
        vehicleType: null,
        showTerminated: true,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.onRemoveFilterChip('showTerminated');
      const appliedArg = (component.applyFilters as jasmine.Spy).calls.mostRecent().args[0];
      expect(appliedArg.showTerminated).toBeFalse();
    });

    it('should remove effectiveDate filter chip and clear period', () => {
      spyOn(component, 'applyFilters');
      component.appliedFilters = {
        vehicleId: null,
        vehicleType: null,
        showTerminated: false,
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'After',
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.onRemoveFilterChip('effectiveDate');
      const appliedArg = (component.applyFilters as jasmine.Spy).calls.mostRecent().args[0];
      expect(appliedArg.effectiveDate).toBeNull();
      expect(appliedArg.effectiveDatePeriod).toBeNull();
    });

    it('should remove terminationDate filter chip and clear period', () => {
      spyOn(component, 'applyFilters');
      component.appliedFilters = {
        vehicleId: null,
        vehicleType: null,
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'Before'
      };

      component.onRemoveFilterChip('terminationDate');
      const appliedArg = (component.applyFilters as jasmine.Spy).calls.mostRecent().args[0];
      expect(appliedArg.terminationDate).toBeNull();
      expect(appliedArg.terminationDatePeriod).toBeNull();
    });
  });

  describe('clearAllFilters', () => {
    it('should clear all filters and reapply with empty values', () => {
      spyOn(component, 'applyFilters');
      component.clearAllFilters();

      expect(component.applyFilters).toHaveBeenCalledWith({
        vehicleId: null,
        vehicleType: null,
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      });
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when appliedFilters is null', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBeFalse();
    });

    it('should return true when vehicleId filter is set', () => {
      component.appliedFilters = {
        vehicleId: 'V001',
        vehicleType: null,
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should return false when no filters are active', () => {
      component.appliedFilters = {
        vehicleId: null,
        vehicleType: null,
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };
      expect(component.hasActiveFilters()).toBeFalse();
    });

    it('should return true when showTerminated is true', () => {
      component.appliedFilters = {
        vehicleId: null,
        vehicleType: null,
        showTerminated: true,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should return true when vehicleType filter is set', () => {
      component.appliedFilters = {
        vehicleId: null,
        vehicleType: 'VAN',
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should return true when effectiveDate filter is set', () => {
      component.appliedFilters = {
        vehicleId: null,
        vehicleType: null,
        showTerminated: false,
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'After',
        terminationDate: null,
        terminationDatePeriod: null
      };
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should return true when terminationDate filter is set', () => {
      component.appliedFilters = {
        vehicleId: null,
        vehicleType: null,
        showTerminated: false,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'Before'
      };
      expect(component.hasActiveFilters()).toBeTrue();
    });
  });

  // --- formatDate Tests ---

  describe('formatDate', () => {
    it('should return formatted date for valid ISO date', () => {
      const result = component.formatDate('2025-01-11T00:00:00Z');
      expect(result).not.toBe('-');
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should return dash for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });
  });

  // --- onResize Tests ---

  describe('onResize', () => {
    it('should update overlay position when filter is open and overlayRef exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['updatePosition', 'dispose']);
      component.isFilterOpen = true;
      (component as any).overlayRef = mockOverlayRef;
      component.onResize();
      expect(mockOverlayRef.updatePosition).toHaveBeenCalled();
    });

    it('should not update overlay position when filter is closed', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['updatePosition', 'dispose']);
      component.isFilterOpen = false;
      (component as any).overlayRef = mockOverlayRef;
      component.onResize();
      expect(mockOverlayRef.updatePosition).not.toHaveBeenCalled();
    });

    it('should not update overlay position when overlayRef is null', () => {
      component.isFilterOpen = true;
      (component as any).overlayRef = null;
      expect(() => component.onResize()).not.toThrow();
    });

    it('should not throw when both filter closed and overlayRef null', () => {
      component.isFilterOpen = false;
      (component as any).overlayRef = null;
      expect(() => component.onResize()).not.toThrow();
    });
  });

  // --- getSortString (private, tested via loadData) ---

  describe('getSortString via loadData', () => {
    it('should produce empty string for default sort', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.sortDirection = 'default';
      component.loadData();

      const calledFilter = mockVehicleService.getVehicles.calls.mostRecent().args[0];
      expect(calledFilter.sort).toBeUndefined();
    });

    it('should produce column_asc for ascending sort', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.sortColumn = 'vehicleName';
      component.sortDirection = 'A';
      component.loadData();

      const calledFilter = mockVehicleService.getVehicles.calls.mostRecent().args[0];
      expect(calledFilter.sort).toBe('vehicleName_asc');
    });

    it('should produce column_desc for descending sort', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.sortColumn = 'vehicleType';
      component.sortDirection = 'D';
      component.loadData();

      const calledFilter = mockVehicleService.getVehicles.calls.mostRecent().args[0];
      expect(calledFilter.sort).toBe('vehicleType_desc');
    });
  });

  // --- Full sort cycle ---

  describe('full sort cycle', () => {
    beforeEach(() => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
    });

    it('should cycle through default -> A -> D -> default on same column', () => {
      component.sortColumn = 'vehicleId';
      component.sortDirection = 'default';

      component.onSort('vehicleId');
      expect(component.sortDirection).toBe('A');

      component.onSort('vehicleId');
      expect(component.sortDirection).toBe('D');

      component.onSort('vehicleId');
      expect(component.sortDirection).toBe('default');
    });

    it('should reset to A when switching columns mid-cycle', () => {
      component.sortColumn = 'vehicleId';
      component.sortDirection = 'D';

      component.onSort('vehicleName');
      expect(component.sortColumn).toBe('vehicleName');
      expect(component.sortDirection).toBe('A');
    });
  });

  // --- loadData with filters applied ---

  describe('loadData with filters applied', () => {
    it('should pass requestState properties in the filter', () => {
      mockVehicleService.getVehicles.and.returnValue(of({ data: [], total: 0 }));
      component.requestState = {
        vehicleId: 'V001',
        vehicleType: 'VAN',
        showTerminated: true,
        effDate: '2025-01-01',
        effDatePeriod: 'After',
        termDate: '2025-12-31',
        termDatePeriod: 'Before'
      };
      component.loadData();

      const calledFilter = mockVehicleService.getVehicles.calls.mostRecent().args[0];
      expect(calledFilter.vehicleId).toBe('V001');
      expect(calledFilter.vehicleType).toBe('VAN');
      expect(calledFilter.showTerminated).toBeTrue();
      expect(calledFilter.effDate).toBe('2025-01-01');
      expect(calledFilter.effDatePeriod).toBe('After');
      expect(calledFilter.termDate).toBe('2025-12-31');
      expect(calledFilter.termDatePeriod).toBe('Before');
    });
  });
});
