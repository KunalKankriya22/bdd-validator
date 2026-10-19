import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MaintainPhysicianListComponent } from './maintain-physician-list';
import { PhysicianService } from './services/physician.service';
import { PhysicianModel, ApiResponse } from './models/physician.model';
import { PhysicianFilterValue } from './models/physician-filter.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

describe('MaintainPhysicianListComponent', () => {
  let component: MaintainPhysicianListComponent;
  let fixture: ComponentFixture<MaintainPhysicianListComponent>;
  let mockPhysicianService: jasmine.SpyObj<PhysicianService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let pageHeaderDataSignal: WritableSignal<{ title: string; subtitle: string } | undefined>;
  let snackBarOpenSpy: jasmine.Spy;
  let chapterSubject: Subject<void>;

  const mockPhysician: PhysicianModel = {
    physicianId: 'PHY001',
    lastName: 'Smith',
    firstName: 'John',
    middleName: null,
    physicianName: 'Smith, John',
    specialtyCode: 'CARD',
    specialtyDescription: 'Cardiology',
    phoneNumber: '555-1234',
    streetAddress: '123 Main St',
    zipCode: '02101',
    city: 'Boston',
    state: 'MA',
    effectiveDate: '2024-01-01',
    terminationDate: null,
    comments: null,
    chapterId: 'CH01'
  };

  const mockPhysician2: PhysicianModel = {
    physicianId: 'PHY002',
    lastName: 'Jones',
    firstName: 'Mary',
    middleName: null,
    physicianName: 'Jones, Mary',
    specialtyCode: 'NEUR',
    specialtyDescription: 'Neurology',
    phoneNumber: null,
    streetAddress: null,
    zipCode: null,
    city: null,
    state: null,
    effectiveDate: '2024-02-01',
    terminationDate: null,
    comments: null,
    chapterId: 'CH01'
  };

  const mockApiResponse: ApiResponse<PhysicianModel> = {
    success: true,
    statusCode: 200,
    message: 'OK',
    data: [mockPhysician, mockPhysician2],
    total: 2
  };

  const emptyApiResponse: ApiResponse<PhysicianModel> = {
    ...mockApiResponse,
    data: [],
    total: 0
  };

  beforeEach(async () => {
    chapterSubject = new Subject<void>();
    pageHeaderDataSignal = signal(undefined);

    mockPhysicianService = jasmine.createSpyObj('PhysicianService', ['getPhysicians']);
    mockPhysicianService.getPhysicians.and.returnValue(of(mockApiResponse));

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: pageHeaderDataSignal
    });

    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId', 'chapterTimeZone'], {
      chapterChanged$: chapterSubject.asObservable()
    });
    mockHeaderService.getCurrentChapterId.and.returnValue('CH01');
    mockHeaderService.chapterTimeZone.and.returnValue('+00:00');

    await TestBed.configureTestingModule({
      imports: [MaintainPhysicianListComponent],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PhysicianService, useValue: mockPhysicianService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    // Spy on the prototype so calls from any MatSnackBar instance are captured,
    // regardless of which injector scope provided the service instance.
    snackBarOpenSpy = spyOn(MatSnackBar.prototype, 'open');

    fixture = TestBed.createComponent(MaintainPhysicianListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    chapterSubject.complete();
  });

  // ─── Creation & initialization ────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize headerConfig with correct defaults', () => {
    expect(component.headerConfig.title).toBe('Maintain Physician List');
    expect(component.headerConfig.subtitle).toBe('Create, update, and manage physician records for donor communication');
    expect(component.headerConfig.breadcrumbs).toEqual([{ label: 'Home', link: '/home' }]);
  });

  it('should initialize searchConfig with correct placeholder and settings', () => {
    expect(component.searchConfig.placeholder).toBe('Search by physician ID or name (press Enter)');
    expect(component.searchConfig.minLength).toBe(1);
    expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
  });

  it('should initialize signals with default values', () => {
    expect(component.physicians()).toEqual([]);
    expect(component.selectedPhysician()).toBeNull();
    expect(component.isLoading()).toBeFalse();
    expect(component.hasError()).toBeFalse();
    expect(component.errorMessage()).toBe('');
    expect(component.isAddMode()).toBeFalse();
    expect(component.showDetailPanel()).toBeFalse();
  });

  // ─── ngOnInit ────────────────────────────────────────────────────────────

  it('should call subscribeToChapterChanges on ngOnInit', fakeAsync(() => {
    spyOn<any>(component, 'clearAll');
    component.ngOnInit();
    tick();
    chapterSubject.next();
    tick();
    expect((component as any).clearAll).toHaveBeenCalled();
  }));

  it('should subscribe to chapter changes on ngOnInit', fakeAsync(() => {
    spyOn<any>(component, 'clearAll');
    component.ngOnInit();
    tick();
    chapterSubject.next();
    tick();
    expect((component as any).clearAll).toHaveBeenCalled();
  }));

  // ─── ngOnDestroy ─────────────────────────────────────────────────────────

  it('should complete destroy$ on ngOnDestroy', () => {
    const nextSpy = spyOn((component as any).destroy$, 'next').and.callThrough();
    const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should unsubscribe from chapter changes after destroy', fakeAsync(() => {
    spyOn<any>(component, 'clearAll');
    component.ngOnInit();
    tick();
    component.ngOnDestroy();
    (component as any).clearAll.calls.reset();
    chapterSubject.next();
    tick();
    // clearAll should NOT be called after destroy
    expect((component as any).clearAll).not.toHaveBeenCalled();
  }));

  // ─── isSearchAndFilterDisabled getter ────────────────────────────────────

  it('should return true for isSearchAndFilterDisabled when loading', () => {
    component.isLoading.set(true);
    component.hasError.set(false);
    expect(component.isSearchAndFilterDisabled).toBeTrue();
  });

  it('should return true for isSearchAndFilterDisabled when hasError', () => {
    component.isLoading.set(false);
    component.hasError.set(true);
    expect(component.isSearchAndFilterDisabled).toBeTrue();
  });

  it('should return false for isSearchAndFilterDisabled when neither loading nor error', () => {
    component.isLoading.set(false);
    component.hasError.set(false);
    expect(component.isSearchAndFilterDisabled).toBeFalse();
  });

  // ─── loadData() ──────────────────────────────────────────────────────────

  it('should set isLoading=true and hasError=false before API call', () => {
    let loadingDuringCall = false;
    let errorDuringCall = true;
    mockPhysicianService.getPhysicians.and.callFake(() => {
      loadingDuringCall = component.isLoading();
      errorDuringCall = component.hasError();
      return of(mockApiResponse);
    });
    component.loadData();
    expect(loadingDuringCall).toBeTrue();
    expect(errorDuringCall).toBeFalse();
  });

  it('should populate physicians signal on success', () => {
    component.loadData();
    expect(component.physicians()).toEqual(mockApiResponse.data);
  });

  it('should set isLoading=false after successful response', () => {
    component.loadData();
    expect(component.isLoading()).toBeFalse();
  });

  it('should populate physicians when loadData is called and data arrives', () => {
    component.selectedPhysician.set(null);
    component.loadData();
    expect(component.physicians()).toEqual(mockApiResponse.data);
    expect(component.isLoading()).toBeFalse();
  });

  it('should reselect previously selected physician after reload', () => {
    component.selectedPhysician.set(mockPhysician2);
    component.loadData();
    expect(component.selectedPhysician()).toEqual(mockPhysician2);
  });

  it('should not auto-select when selected physician ID is no longer in new list', () => {
    const ghost: PhysicianModel = { ...mockPhysician, physicianId: 'PHY999' };
    component.selectedPhysician.set(ghost);
    component.loadData();
    // Ghost is gone — selection stays as ghost; no reselect, no auto-select
    expect(component.selectedPhysician()).toEqual(ghost);
  });

  it('should set hasError=true and errorMessage on API failure', () => {
    mockPhysicianService.getPhysicians.and.returnValue(throwError(() => new Error('Network error')));
    component.loadData();
    expect(component.hasError()).toBeTrue();
    expect(component.errorMessage()).toBe('Failed to load physicians. Please try again.');
  });

  it('should set isLoading=false on API failure', () => {
    mockPhysicianService.getPhysicians.and.returnValue(throwError(() => new Error('err')));
    component.loadData();
    expect(component.isLoading()).toBeFalse();
  });

  it('should include chapterId from headerService in query params', () => {
    mockHeaderService.getCurrentChapterId.and.returnValue('CH99');
    component.loadData();
    const calledParams = mockPhysicianService.getPhysicians.calls.mostRecent().args[0];
    expect(calledParams.chapterId).toBe('CH99');
  });

  // ─── onSearch() ──────────────────────────────────────────────────────────

  it('should trim search text and update requestState', () => {
    spyOn(component, 'loadData');
    component.onSearch('  Smith  ');
    expect(component.searchText).toBe('Smith');
    expect(component.requestState.searchText).toBe('Smith');
  });

  it('should set searchText to undefined in requestState when blank', () => {
    spyOn(component, 'loadData');
    component.onSearch('   ');
    expect(component.requestState.searchText).toBeUndefined();
  });

  it('should call loadData after search', () => {
    spyOn(component, 'loadData');
    component.onSearch('Jones');
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should merge search params into requestState without overwriting existing filter state', () => {
    spyOn(component, 'loadData');
    component.requestState = { effectiveDateFrom: '2024-01-01' };
    component.onSearch('Smith');
    expect(component.requestState.searchText).toBe('Smith');
    expect(component.requestState.effectiveDateFrom).toBe('2024-01-01');
  });

  // ─── toggleFilter() ──────────────────────────────────────────────────────

  it('should open filter panel when closed', () => {
    component.isFilterOpen = false;
    component.toggleFilter();
    expect(component.isFilterOpen).toBeTrue();
  });

  it('should close filter panel when open', () => {
    component.isFilterOpen = true;
    component.toggleFilter();
    expect(component.isFilterOpen).toBeFalse();
  });

  // ─── onApplyFilters() ────────────────────────────────────────────────────

  it('should store applied filters and close the filter panel', () => {
    const filters: PhysicianFilterValue = {
      effectiveDate: '2024-01-01',
      effectiveDatePeriod: 'after',
      terminationDate: null,
      terminationDatePeriod: null
    };
    component.isFilterOpen = true;
    spyOn(component, 'loadData');
    component.onApplyFilters(filters);
    expect(component.appliedFilters).toEqual(filters);
    expect(component.isFilterOpen).toBeFalse();
  });

  it('should set effectiveDateFrom when effective date period is "after"', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({
      effectiveDate: '2024-06-01',
      effectiveDatePeriod: 'after',
      terminationDate: null,
      terminationDatePeriod: null
    });
    expect(component.requestState.effectiveDateFrom).toBe('2024-06-01');
    expect(component.requestState.effectiveDateTo).toBeUndefined();
  });

  it('should set effectiveDateTo when effective date period is "before"', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({
      effectiveDate: '2024-06-01',
      effectiveDatePeriod: 'before',
      terminationDate: null,
      terminationDatePeriod: null
    });
    expect(component.requestState.effectiveDateTo).toBe('2024-06-01');
    expect(component.requestState.effectiveDateFrom).toBeUndefined();
  });

  it('should set terminationDateFrom when termination date period is "after"', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({
      effectiveDate: null,
      effectiveDatePeriod: null,
      terminationDate: '2025-12-31',
      terminationDatePeriod: 'after'
    });
    expect(component.requestState.terminationDateFrom).toBe('2025-12-31');
    expect(component.requestState.terminationDateTo).toBeUndefined();
  });

  it('should set terminationDateTo when termination date period is "before"', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({
      effectiveDate: null,
      effectiveDatePeriod: null,
      terminationDate: '2025-12-31',
      terminationDatePeriod: 'before'
    });
    expect(component.requestState.terminationDateTo).toBe('2025-12-31');
    expect(component.requestState.terminationDateFrom).toBeUndefined();
  });

  it('should leave date params undefined when date is null', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({
      effectiveDate: null,
      effectiveDatePeriod: 'after',
      terminationDate: null,
      terminationDatePeriod: null
    });
    expect(component.requestState.effectiveDateFrom).toBeUndefined();
    expect(component.requestState.effectiveDateTo).toBeUndefined();
  });

  it('should call loadData after applying filters', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({ effectiveDate: null, effectiveDatePeriod: null, terminationDate: null, terminationDatePeriod: null });
    expect(component.loadData).toHaveBeenCalled();
  });

  // ─── updateFilterChips (via onApplyFilters) ───────────────────────────────

  it('should create effectiveDate chip with >= symbol for "after" period', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({
      effectiveDate: '2024-01-15',
      effectiveDatePeriod: 'after',
      terminationDate: null,
      terminationDatePeriod: null
    });
    const chip = component.filterChips.find(c => c.key === 'effectiveDate');
    expect(chip).toBeTruthy();
    expect(chip!.label).toContain('Effective Date >=');
  });

  it('should create effectiveDate chip with <= symbol for "before" period', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({
      effectiveDate: '2024-01-15',
      effectiveDatePeriod: 'before',
      terminationDate: null,
      terminationDatePeriod: null
    });
    const chip = component.filterChips.find(c => c.key === 'effectiveDate');
    expect(chip).toBeTruthy();
    expect(chip!.label).toContain('Effective Date <=');
  });

  it('should create terminationDate chip with correct symbol', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({
      effectiveDate: null,
      effectiveDatePeriod: null,
      terminationDate: '2025-12-31',
      terminationDatePeriod: 'after'
    });
    const chip = component.filterChips.find(c => c.key === 'terminationDate');
    expect(chip).toBeTruthy();
    expect(chip!.label).toContain('Termination Date >=');
  });

  it('should create no chips when all filter dates are null', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({
      effectiveDate: null,
      effectiveDatePeriod: null,
      terminationDate: null,
      terminationDatePeriod: null
    });
    expect(component.filterChips.length).toBe(0);
  });

  it('should create two chips when both dates are provided', () => {
    spyOn(component, 'loadData');
    component.onApplyFilters({
      effectiveDate: '2024-01-01',
      effectiveDatePeriod: 'after',
      terminationDate: '2025-12-31',
      terminationDatePeriod: 'before'
    });
    expect(component.filterChips.length).toBe(2);
  });

  // ─── onRemoveFilterChip() ─────────────────────────────────────────────────

  it('should do nothing when appliedFilters is null', () => {
    spyOn(component, 'loadData');
    component.appliedFilters = null;
    component.onRemoveFilterChip('effectiveDate');
    expect(component.loadData).not.toHaveBeenCalled();
  });

  it('should clear effectiveDate fields and reapply when effectiveDate chip is removed', () => {
    spyOn(component, 'loadData');
    component.appliedFilters = {
      effectiveDate: '2024-01-01',
      effectiveDatePeriod: 'after',
      terminationDate: null,
      terminationDatePeriod: null
    };
    component.onRemoveFilterChip('effectiveDate');
    expect(component.appliedFilters?.effectiveDate).toBeNull();
    expect(component.appliedFilters?.effectiveDatePeriod).toBeNull();
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should clear terminationDate fields and reapply when terminationDate chip is removed', () => {
    spyOn(component, 'loadData');
    component.appliedFilters = {
      effectiveDate: null,
      effectiveDatePeriod: null,
      terminationDate: '2025-12-31',
      terminationDatePeriod: 'before'
    };
    component.onRemoveFilterChip('terminationDate');
    expect(component.appliedFilters?.terminationDate).toBeNull();
    expect(component.appliedFilters?.terminationDatePeriod).toBeNull();
    expect(component.loadData).toHaveBeenCalled();
  });

  // ─── onClearAllFilters() ──────────────────────────────────────────────────

  it('should reset appliedFilters, filterChips, and call loadData', () => {
    spyOn(component, 'loadData');
    component.appliedFilters = { effectiveDate: '2024-01-01', effectiveDatePeriod: 'after', terminationDate: null, terminationDatePeriod: null };
    component.filterChips = [{ key: 'effectiveDate', label: 'Effective Date >= 01/01/2024', value: '2024-01-01' }];
    component.onClearAllFilters();
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should preserve searchText in requestState when clearing filters', () => {
    spyOn(component, 'loadData');
    component.searchText = 'Smith';
    component.onClearAllFilters();
    expect(component.requestState.searchText).toBe('Smith');
  });

  it('should omit searchText from requestState when empty on clear', () => {
    spyOn(component, 'loadData');
    component.searchText = '';
    component.onClearAllFilters();
    expect(component.requestState.searchText).toBeUndefined();
  });

  // ─── onSelectPhysician() ──────────────────────────────────────────────────

  it('should select a physician and show the detail panel', () => {
    component.onSelectPhysician(mockPhysician);
    expect(component.selectedPhysician()).toEqual(mockPhysician);
    expect(component.isAddMode()).toBeFalse();
    expect(component.showDetailPanel()).toBeTrue();
  });

  // ─── onAddNewPhysician() ──────────────────────────────────────────────────

  it('should clear selection, set add mode, and show the detail panel', () => {
    component.selectedPhysician.set(mockPhysician);
    component.onAddNewPhysician();
    expect(component.selectedPhysician()).toBeNull();
    expect(component.isAddMode()).toBeTrue();
    expect(component.showDetailPanel()).toBeTrue();
  });

  // ─── onPhysicianSaved() ───────────────────────────────────────────────────

  it('should show "created" success message when in add mode', () => {
    component.isAddMode.set(true);
    component.onPhysicianSaved(mockPhysician);
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      `Physician ${mockPhysician.physicianName} created successfully`,
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should show "updated" success message when in edit mode', () => {
    component.isAddMode.set(false);
    component.onPhysicianSaved(mockPhysician);
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      `Physician ${mockPhysician.physicianName} updated successfully`,
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should reload data, set selectedPhysician, exit add mode, and keep panel open after save', () => {
    spyOn(component, 'loadData');
    component.isAddMode.set(true);
    component.onPhysicianSaved(mockPhysician);
    expect(component.loadData).toHaveBeenCalled();
    expect(component.selectedPhysician()).toEqual(mockPhysician);
    expect(component.isAddMode()).toBeFalse();
    expect(component.showDetailPanel()).toBeTrue();
  });

  // ─── onCancelDetail() ────────────────────────────────────────────────────

  it('should hide the detail panel, clear selection, and exit add mode on cancel', () => {
    component.selectedPhysician.set(mockPhysician);
    component.isAddMode.set(true);
    component.showDetailPanel.set(true);
    component.onCancelDetail();
    expect(component.showDetailPanel()).toBeFalse();
    expect(component.selectedPhysician()).toBeNull();
    expect(component.isAddMode()).toBeFalse();
  });

  // ─── Snackbar config ──────────────────────────────────────────────────────

  it('should open snackbar with correct position and panelClass on success', () => {
    component.isAddMode.set(false);
    component.onPhysicianSaved(mockPhysician);
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      jasmine.any(String),
      'DISMISS',
      jasmine.objectContaining({
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      })
    );
  });

  // ─── Chapter change subscription ──────────────────────────────────────────

  it('should clear all state when chapter changes', fakeAsync(() => {
    component.ngOnInit();
    tick();

    // Populate state to verify clearAll resets everything
    component.selectedPhysician.set(mockPhysician);
    component.isAddMode.set(true);
    component.showDetailPanel.set(true);
    component.searchText = 'Jones';
    component.appliedFilters = { effectiveDate: '2024-01-01', effectiveDatePeriod: 'after', terminationDate: null, terminationDatePeriod: null };
    component.filterChips = [{ key: 'effectiveDate', label: 'test', value: '2024-01-01' }];

    chapterSubject.next();
    tick();

    expect(component.selectedPhysician()).toBeNull();
    expect(component.isAddMode()).toBeFalse();
    expect(component.showDetailPanel()).toBeFalse();
    expect(component.searchText).toBe('');
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
  }));

  // ─── Page header effect ───────────────────────────────────────────────────

  it('should update headerConfig title and breadcrumbs from pageHeaderData signal', fakeAsync(() => {
    // Empty response prevents auto-select so PhysicianDetailForm is never rendered
    mockPhysicianService.getPhysicians.and.returnValue(of(emptyApiResponse));

    fixture.detectChanges(); // triggers ngOnInit + registers effect
    tick();

    pageHeaderDataSignal.set({ title: 'Physician List', subtitle: 'Manage physicians' });
    fixture.detectChanges(); // effect re-runs with new signal value
    tick();

    expect(component.headerConfig.title).toBe('Physician List');
    expect(component.headerConfig.subtitle).toBe('Manage physicians');
    expect(component.headerConfig.breadcrumbs).toEqual([
      { label: 'Home', link: '/home' },
      { label: 'Physician List', link: null }
    ]);
  }));

  it('should use the default subtitle when pageHeaderData has an empty subtitle', fakeAsync(() => {
    mockPhysicianService.getPhysicians.and.returnValue(of(emptyApiResponse));

    fixture.detectChanges();
    tick();

    pageHeaderDataSignal.set({ title: 'Physician List', subtitle: '' });
    fixture.detectChanges();
    tick();

    expect(component.headerConfig.subtitle).toBe('Create, update, and manage physician records for donor communication');
  }));
});
