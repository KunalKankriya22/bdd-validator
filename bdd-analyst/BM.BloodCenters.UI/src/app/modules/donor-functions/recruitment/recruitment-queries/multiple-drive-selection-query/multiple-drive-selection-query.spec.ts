import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { MultipleDriveSelectionQueryComponent } from './multiple-drive-selection-query';
import { MultipleDriveSelectionQueryService } from './services/multiple-drive-selection-query.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  MultipleDriveSelectionLookups,
  DriveRecord
} from './models/multiple-drive-selection-query.model';
import { DescribeCriteriaDialog } from './components/describe-criteria-dialog/describe-criteria-dialog';

describe('MultipleDriveSelectionQueryComponent', () => {
  let fixture: ComponentFixture<MultipleDriveSelectionQueryComponent>;
  let component: MultipleDriveSelectionQueryComponent;
  let queryService: jasmine.SpyObj<MultipleDriveSelectionQueryService>;
  let dialogOpenSpy: jasmine.Spy;
  let snackBarOpenSpy: jasmine.Spy;
  let liveAnnouncerSpy: jasmine.SpyObj<LiveAnnouncer>;

  const mockLookups: MultipleDriveSelectionLookups = {
    select: [{ code: 'C1', description: 'Col 1' }],
    facility: [],
    status: [],
    sponsors: [],
    zipCode: [],
    sponsorCategory: [],
    territory: [],
    procedure: [],
    driveCategory: [],
    fixedDrive: []
  };

  beforeEach(() => {

    queryService = jasmine.createSpyObj('MultipleDriveSelectionQueryService', [
      'getLookups',
      'searchDrives'
    ]);
    queryService.getLookups.and.returnValue(of(mockLookups));
    queryService.searchDrives.and.returnValue(
      of({ data: [], total: 0 })
    );

    liveAnnouncerSpy = jasmine.createSpyObj('LiveAnnouncer', ['announce']);

    const pageHeaderServiceStub = {
      getTitle: jasmine.createSpy('getTitle').and.returnValue(undefined),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue(undefined)
    };

      TestBed.configureTestingModule({
      imports: [
        MultipleDriveSelectionQueryComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MultipleDriveSelectionQueryService, useValue: queryService },
        { provide: HeaderService, useValue: { chapterId: () => 'CH1' } },
        { provide: PageHeaderService, useValue: pageHeaderServiceStub },
        { provide: LiveAnnouncer, useValue: liveAnnouncerSpy }
      ]
    });

    

      queryService.getLookups.calls.reset();

      queryService.searchDrives.calls.reset();

      liveAnnouncerSpy.announce.calls.reset();

      queryService.getLookups.and.returnValue(of(mockLookups));

    fixture = TestBed.createComponent(MultipleDriveSelectionQueryComponent);
    component = fixture.componentInstance;

    const inj = fixture.debugElement.injector;
    snackBarOpenSpy = spyOn(inj.get(MatSnackBar), 'open');
    dialogOpenSpy = spyOn(inj.get(MatDialog), 'open').and.returnValue({
      afterClosed: () => of(undefined),
      close: () => {}
    } as any);

    });

  describe('initialization', () => {
    it('should stop loading lookups on error', () => {
      queryService.getLookups.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.isLoadingLookups()).toBeFalse();
      expect(snackBarOpenSpy).toHaveBeenCalled();
    });

    it('should build filter form with required dates', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('fromDate')?.hasError('required')).toBeTrue();
      expect(component.filterForm.get('toDate')?.hasError('required')).toBeTrue();
    });
  });

  describe('onRetrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark form touched when invalid', () => {
      component.onRetrieve();
      expect(component.filterForm.touched).toBeTrue();
      expect(queryService.searchDrives).not.toHaveBeenCalled();
    });

    it('should search when form valid', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31')
      });
      component.filterForm.updateValueAndValidity();
      tick();

      component.onRetrieve();
      tick();

      expect(queryService.searchDrives).toHaveBeenCalled();
      expect(component.isLoadingData()).toBeFalse();
    }));
  });

  describe('search and table', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31')
      });
      component.filterForm.updateValueAndValidity();
    });

    it('should update drives and announce on success', fakeAsync(() => {
      const rows: DriveRecord[] = [{ driveId: 'D1' }];
      queryService.searchDrives.and.returnValue(of({ data: rows, total: 1 }));

      component.onRetrieve();
      tick();

      expect(component.drives()).toEqual(rows);
      expect(component.totalRecords()).toBe(1);
      expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith(
        jasmine.stringMatching(/1 drives found/),
        'polite'
      );
    }));
  });

  describe('selection and header actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should enable describe criteria when drives selected; drive details stays disabled until routed', () => {
      component.onSelectionChange([{ driveId: 'X' } as DriveRecord]);
      const cfg = component.headerConfig();
      const describe = cfg.actions?.find((a) => a.label === 'DESCRIBE CRITERIA');
      const driveDetails = cfg.actions?.find((a) => a.label === 'DRIVE DETAILS');
      expect(describe?.disabled).toBeFalse();
      expect(driveDetails?.disabled).toBeTrue();
      expect(liveAnnouncerSpy.announce).toHaveBeenCalled();
    });

    it('should not error when navigateToDriveDetails called with selection (navigation deferred until route exists)', () => {
      component.onSelectionChange([{ driveId: 'A' } as DriveRecord, { driveId: 'B' } as DriveRecord]);
      expect(() => component.navigateToDriveDetails()).not.toThrow();
      expect(snackBarOpenSpy).not.toHaveBeenCalled();
    });
  });

  describe('filters and chips', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31')
      });
    });

    it('should clear state on onClearAllFilters', () => {
      component.drives.set([{ driveId: '1' }]);
      component.searchKeyword.set('x');
      component.onClearAllFilters();
      expect(component.drives().length).toBe(0);
      expect(component.searchKeyword()).toBe('');
      expect(component.filterChips().length).toBe(0);
    });

    it('should compute hasActiveFilters from applied optional filters', () => {
      expect(component.hasActiveFilters()).toBeFalse();
      component.appliedFilters.set({
        fromDate: 'a',
        toDate: 'b',
        select: ['C1']
      } as any);
      expect(component.hasActiveFilters()).toBeTrue();
    });
  });

  describe('multi-select helpers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('removeMultiSelectValue should remove code', () => {
      component.filterForm.patchValue({ select: ['a', 'b'] });
      const ev = new Event('click');
      spyOn(ev, 'stopPropagation');
      component.removeMultiSelectValue('select', 'a', ev);
      expect(component.filterForm.get('select')?.value).toEqual(['b']);
      expect(ev.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('time input helpers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('formatTimeInput pads valid time', () => {
      component.filterForm.patchValue({ minimumDriveStartTimeEnterTime: '9:30' });
      component.formatTimeInput('minimumDriveStartTimeEnterTime');
      expect(component.filterForm.get('minimumDriveStartTimeEnterTime')?.value).toBe('09:30');
    });
  });

  describe('calendar filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('fromDateCalendarFilter allows all when to date missing', () => {
      component.filterForm.patchValue({ toDate: null, fromDate: null }, { emitEvent: false });
      component['syncDatepickerBounds']();
      expect(component.fromDateCalendarFilter(new Date('2028-06-01'))).toBeTrue();
    });

    it('toDateCalendarFilter allows all when from date missing', () => {
      component.filterForm.patchValue({ toDate: null, fromDate: null }, { emitEvent: false });
      component['syncDatepickerBounds']();
      expect(component.toDateCalendarFilter(new Date('2028-06-01'))).toBeTrue();
    });

    it('fromDateCalendarFilter restricts dates after toDate', () => {
      component.filterForm.patchValue({ toDate: new Date('2028-06-15') }, { emitEvent: false });
      component['syncDatepickerBounds']();
      expect(component.fromDateCalendarFilter(new Date('2028-06-14'))).toBeTrue();
      expect(component.fromDateCalendarFilter(new Date('2028-06-16'))).toBeFalse();
    });

    it('toDateCalendarFilter restricts dates before fromDate', () => {
      component.filterForm.patchValue({ fromDate: new Date('2028-06-10') }, { emitEvent: false });
      component['syncDatepickerBounds']();
      expect(component.toDateCalendarFilter(new Date('2028-06-11'))).toBeTrue();
      expect(component.toDateCalendarFilter(new Date('2028-06-09'))).toBeFalse();
    });

    it('fromDateCalendarFilter returns true for null input', () => {
      component.filterForm.patchValue({ toDate: new Date('2028-06-15') }, { emitEvent: false });
      component['syncDatepickerBounds']();
      expect(component.fromDateCalendarFilter(null)).toBeTrue();
    });

    it('toDateCalendarFilter returns true for null input', () => {
      component.filterForm.patchValue({ fromDate: new Date('2028-06-10') }, { emitEvent: false });
      component['syncDatepickerBounds']();
      expect(component.toDateCalendarFilter(null)).toBeTrue();
    });
  });

  describe('onApplyFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark form touched when invalid', () => {
      component.onApplyFilters();
      expect(component.filterForm.touched).toBeTrue();
      expect(queryService.searchDrives).not.toHaveBeenCalled();
    });

    it('should search and close panel when valid', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31')
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      tick();
      component.isFilterPanelOpen.set(true);

      component.onApplyFilters();
      tick();

      expect(queryService.searchDrives).toHaveBeenCalled();
      expect(component.isFilterPanelOpen()).toBeFalse();
    }));
  });

  describe('searchDrives error path', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31')
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
    });

    it('should show error snackbar on search failure', fakeAsync(() => {
      queryService.searchDrives.and.returnValue(throwError(() => new Error('network')));
      component.onRetrieve();
      tick();
      expect(component.isLoadingData()).toBeFalse();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Failed to search drives. Please try again.',
        'Close',
        jasmine.any(Object)
      );
    }));
  });

  describe('onPageChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31')
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
    });

    it('should update pagination and search', fakeAsync(() => {
      component.onPageChange({ pageSize: 50, pageIndex: 2, length: 100 });
      tick();
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(queryService.searchDrives).toHaveBeenCalled();
    }));
  });

  describe('onSortChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31')
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
    });

    it('should update sort config and search', fakeAsync(() => {
      component.onSortChange({ column: 'sponsorName', direction: 'D' });
      tick();
      expect(component.tableConfig.sortConfig?.column).toBe('sponsorName');
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
      expect(queryService.searchDrives).toHaveBeenCalled();
    }));
  });

  describe('onSearchChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31')
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
    });

    it('should reset page index and set keyword', fakeAsync(() => {
      // Make hasSearched() true by setting drives
      component.drives.set([{ driveId: 'D1' }]);
      component.onSearchChange('sponsor');
      tick();
      expect(component.searchKeyword()).toBe('sponsor');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(queryService.searchDrives).toHaveBeenCalled();
    }));

    it('should not search if no prior results and empty keyword', fakeAsync(() => {
      component.drives.set([]);
      component.searchKeyword.set('');
      component.onSearchChange('');
      tick();
      expect(queryService.searchDrives).not.toHaveBeenCalled();
    }));
  });

  describe('openAdvancedSearch', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle filter panel open', () => {
      expect(component.isFilterPanelOpen()).toBeFalse();
      component.openAdvancedSearch();
      expect(component.isFilterPanelOpen()).toBeTrue();
    });

    it('should toggle filter panel closed', () => {
      component.isFilterPanelOpen.set(true);
      component.openAdvancedSearch();
      expect(component.isFilterPanelOpen()).toBeFalse();
    });

    it('should blur event target when HTMLElement', fakeAsync(() => {
      // Mock advancedFilterSection to prevent scrollIntoView error
      component['advancedFilterSection'] = {
        nativeElement: { scrollIntoView: jasmine.createSpy('scrollIntoView') }
      } as any;
      const button = document.createElement('button');
      spyOn(button, 'blur');
      const ev = new Event('click');
      Object.defineProperty(ev, 'currentTarget', { value: button });
      component.openAdvancedSearch(ev);
      tick();
      expect(button.blur).toHaveBeenCalled();
    }));
  });

  describe('onClearAdvancedFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset advanced filter fields', () => {
      component.filterForm.patchValue({
        zipCode: ['12345'],
        sponsorCategory: 'CAT1',
        territory: ['T1'],
        procedure: 'PROC1',
        driveCategory: ['DC1'],
        fixedDrive: 'I',
        minimumProjectDraw: 10,
        maximumProjectDraw: 50,
        minimumTravelTime: 5,
        maximumTravelTime: 30,
        minimumDriveDurationHour: 2,
        minimumDriveDurationMinute: 15,
        maximumDriveDurationHour: 6,
        maximumDriveDurationMinute: 30,
        minimumDriveStartTimeEnterTime: '08:00',
        minimumDriveStartTimeAMorPM: 'AM',
        maximumDriveStartTimeEnterTime: '05:00',
        maximumDriveStartTimeAMorPM: 'PM',
      }, { emitEvent: false });

      component.onClearAdvancedFilters();

      expect(component.filterForm.get('zipCode')?.value).toEqual([]);
      expect(component.filterForm.get('sponsorCategory')?.value).toBe('');
      expect(component.filterForm.get('territory')?.value).toEqual([]);
      expect(component.filterForm.get('procedure')?.value).toBe('');
      expect(component.filterForm.get('driveCategory')?.value).toEqual([]);
      expect(component.filterForm.get('fixedDrive')?.value).toBe('');
      expect(component.filterForm.get('minimumProjectDraw')?.value).toBeNull();
      expect(component.filterForm.get('maximumProjectDraw')?.value).toBeNull();
      expect(component.filterForm.get('minimumTravelTime')?.value).toBeNull();
      expect(component.filterForm.get('maximumTravelTime')?.value).toBeNull();
    });
  });

  describe('onRemoveFilterChip', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31'),
        select: ['C1'],
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
    });

    it('should remove chip and re-search', fakeAsync(() => {
      // First do a search to populate chips
      component.onRetrieve();
      tick();

      // Set a chip manually
      component.filterChips.set([{ key: 'select', label: 'Columns: Col 1', value: ['C1'], removable: true }]);
      component.appliedFilters.set({
        fromDate: '2028-01-01',
        toDate: '2028-01-31',
        select: ['C1']
      } as any);

      queryService.searchDrives.calls.reset();
      component.onRemoveFilterChip('select');
      tick();

      expect(component.filterForm.get('select')?.value).toEqual([]);
    }));
  });

  describe('onClearAllFilters edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close advanced panel if open', () => {
      component.isFilterPanelOpen.set(true);
      component.onClearAllFilters();
      expect(component.isFilterPanelOpen()).toBeFalse();
    });

    it('should reset pagination totalRecords', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.totalRecords = 100;
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.onClearAllFilters();
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should clear selectedDriveIds', () => {
      component.selectedDriveIds.set(new Set(['D1', 'D2']));
      component.onClearAllFilters();
      expect(component.selectedDriveIds().size).toBe(0);
    });
  });

  describe('openDescribeCriteria', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open dialog with criteria list', () => {
      component.lookups.set(mockLookups);
      component.appliedFilters.set({
        fromDate: '2028-01-01',
        toDate: '2028-01-31',
      } as any);

      component.openDescribeCriteria();

      expect(dialogOpenSpy).toHaveBeenCalledWith(
        DescribeCriteriaDialog,
        jasmine.objectContaining({
          width: '70%',
          minWidth: '600px',
          data: jasmine.objectContaining({ criteriaList: jasmine.any(Array) }),
        })
      );
    });
  });

  describe('navigateToDriveDetails', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when no drives selected', () => {
      component.selectedDriveIds.set(new Set());
      component.navigateToDriveDetails();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Please select at least one drive.',
        'Close',
        jasmine.any(Object)
      );
    });
  });

  describe('generateCriteriaDescription', () => {
    const richLookups: any = {
      select: [{ code: 'C1', description: 'Col 1' }],
      facility: [{ code: 'F1', description: 'Facility 1' }],
      status: [{ code: 'S1', description: 'Active' }],
      sponsors: [{ code: 'SP1', description: 'Sponsor 1' }],
      zipCode: [{ code: 'Z1', description: '10001' }],
      sponsorCategory: [{ code: 'SC1', description: 'Category 1' }],
      territory: [{ code: 'T1', description: 'Territory 1' }],
      procedure: [{ code: 'P1', description: 'Procedure 1' }],
      driveCategory: [{ code: 'DC1', description: 'Drive Cat 1' }],
      fixedDrive: [
        { code: 'I', description: 'Include' },
        { code: 'E', description: 'Exclude' },
        { code: 'O', description: 'Only' },
      ],
    };

    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return no criteria when lookups are null', () => {
      component.lookups.set(null);
      const result = component['generateCriteriaDescription']();
      expect(result).toEqual(['No criteria available.']);
    });

    it('should include date range criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31' } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Drive Date Between:'))).toBeTrue();
    });

    it('should include select columns criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', select: ['C1'] } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Selected Columns:'))).toBeTrue();
    });

    it('should include facility criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', facility: ['F1'] } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Facility:'))).toBeTrue();
    });

    it('should include status criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', status: ['S1'] } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Status:'))).toBeTrue();
    });

    it('should include sponsors criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', sponsors: ['SP1'] } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Sponsors:'))).toBeTrue();
    });

    it('should include zipCode criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', zipCode: ['Z1'] } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Zip Code:'))).toBeTrue();
    });

    it('should include sponsorCategory criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', sponsorCategory: 'SC1' } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Sponsor Category:'))).toBeTrue();
    });

    it('should include territory criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', territory: ['T1'] } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Territory:'))).toBeTrue();
    });

    it('should include procedure criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', procedure: 'P1' } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Procedure:'))).toBeTrue();
    });

    it('should include driveCategory criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', driveCategory: ['DC1'] } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Drive Category:'))).toBeTrue();
    });

    it('should show Include Fixed Drives for code I', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', fixedDrive: 'I' } as any);
      const result = component['generateCriteriaDescription']();
      expect(result).toContain('Include Fixed Drives');
    });

    it('should show Do Not Include Fixed Drives for code E', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', fixedDrive: 'E' } as any);
      const result = component['generateCriteriaDescription']();
      expect(result).toContain('Do Not Include Fixed Drives');
    });

    it('should show Only Fixed Drives for code O', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', fixedDrive: 'O' } as any);
      const result = component['generateCriteriaDescription']();
      expect(result).toContain('Only Fixed Drives');
    });

    it('should show generic fixedDrive label for unknown code', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', fixedDrive: 'X' } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.startsWith('Fixed Drive:'))).toBeTrue();
    });

    it('should include projected draw criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', minimumProjectDraw: 5, maximumProjectDraw: 20 } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.includes('Minimum Projected Draw'))).toBeTrue();
      expect(result.some((c: string) => c.includes('Maximum Projected Draw'))).toBeTrue();
    });

    it('should include travel time criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', minimumTravelTime: 10, maximumTravelTime: 30 } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.includes('Minimum Travel Time'))).toBeTrue();
      expect(result.some((c: string) => c.includes('Maximum Travel Time'))).toBeTrue();
    });

    it('should include drive duration criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', minimumDriveDurationHour: 2, minimumDriveDurationMinute: 30 } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.includes('Minimum Drive Duration'))).toBeTrue();
    });

    it('should include max drive duration criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31', maximumDriveDurationHour: 6, maximumDriveDurationMinute: 0 } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.includes('Maximum Drive Duration'))).toBeTrue();
    });

    it('should include drive start time criteria', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({
        fromDate: '2028-01-01', toDate: '2028-01-31',
        minimumDriveStartTimeEnterTime: '08:00', minimumDriveStartTimeAMorPM: 'AM',
        maximumDriveStartTimeEnterTime: '05:00', maximumDriveStartTimeAMorPM: 'PM',
      } as any);
      const result = component['generateCriteriaDescription']();
      expect(result.some((c: string) => c.includes('Minimum Drive Start Time'))).toBeTrue();
      expect(result.some((c: string) => c.includes('Maximum Drive Start Time'))).toBeTrue();
    });

    it('should return no filter criteria when lookups exist but no filters', () => {
      component.lookups.set(richLookups);
      component.appliedFilters.set({} as any);
      const result = component['generateCriteriaDescription']();
      expect(result).toContain('No filter criteria applied.');
    });
  });

  describe('date error messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('getFromDateErrorMessage should return message', () => {
      const msg = component.getFromDateErrorMessage();
      expect(typeof msg).toBe('string');
    });

    it('getToDateErrorMessage should return message', () => {
      const msg = component.getToDateErrorMessage();
      expect(typeof msg).toBe('string');
    });
  });

  describe('getProjectedDrawRangeErrorMessage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty when no error', () => {
      expect(component.getProjectedDrawRangeErrorMessage()).toBe('');
    });

    it('should return error message when min > max and controls touched', () => {
      component.filterForm.patchValue({ minimumProjectDraw: 100, maximumProjectDraw: 5 }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      component.filterForm.get('minimumProjectDraw')?.markAsTouched();
      expect(component.getProjectedDrawRangeErrorMessage()).toBe('Minimum cannot exceed Maximum');
    });

    it('should return empty when error exists but controls not touched', () => {
      component.filterForm.patchValue({ minimumProjectDraw: 100, maximumProjectDraw: 5 }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      expect(component.getProjectedDrawRangeErrorMessage()).toBe('');
    });
  });

  describe('getDriveDurationRangeErrorMessage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty when no error', () => {
      expect(component.getDriveDurationRangeErrorMessage()).toBe('');
    });

    it('should return error when min duration > max duration and touched', () => {
      component.filterForm.patchValue({
        minimumDriveDurationHour: 5,
        minimumDriveDurationMinute: 0,
        maximumDriveDurationHour: 2,
        maximumDriveDurationMinute: 0,
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      component.filterForm.get('minimumDriveDurationHour')?.markAsTouched();
      expect(component.getDriveDurationRangeErrorMessage()).toBe('Minimum duration cannot exceed Maximum');
    });
  });

  describe('getMinimumDriveStartTimeEnterTimeErrorMessage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty when untouched', () => {
      expect(component.getMinimumDriveStartTimeEnterTimeErrorMessage()).toBe('');
    });

    it('should return error for invalid pattern', () => {
      const ctrl = component.filterForm.get('minimumDriveStartTimeEnterTime');
      ctrl?.setValue('abc');
      ctrl?.markAsTouched();
      expect(component.getMinimumDriveStartTimeEnterTimeErrorMessage()).toContain('Invalid time format');
    });
  });

  describe('getMaximumDriveStartTimeEnterTimeErrorMessage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty when untouched', () => {
      expect(component.getMaximumDriveStartTimeEnterTimeErrorMessage()).toBe('');
    });

    it('should return error for invalid pattern', () => {
      const ctrl = component.filterForm.get('maximumDriveStartTimeEnterTime');
      ctrl?.setValue('xyz');
      ctrl?.markAsTouched();
      expect(component.getMaximumDriveStartTimeEnterTimeErrorMessage()).toContain('Invalid time format');
    });

    it('should return range error when min time > max time', () => {
      component.filterForm.patchValue({
        minimumDriveStartTimeEnterTime: '05:00',
        minimumDriveStartTimeAMorPM: 'PM',
        maximumDriveStartTimeEnterTime: '08:00',
        maximumDriveStartTimeAMorPM: 'AM',
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      component.filterForm.get('maximumDriveStartTimeEnterTime')?.markAsTouched();
      component.filterForm.get('minimumDriveStartTimeEnterTime')?.markAsTouched();
      const msg = component.getMaximumDriveStartTimeEnterTimeErrorMessage();
      expect(msg).toContain('Minimum start time cannot be after Maximum');
    });
  });

  describe('getMultiSelectDisplay', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string for no values', () => {
      component.filterForm.patchValue({ select: [] }, { emitEvent: false });
      expect(component.getMultiSelectDisplay('select', 'select')).toBe('');
    });

    it('should return joined descriptions for <= 2 values', () => {
      component.lookups.set({
        ...mockLookups,
        select: [{ code: 'C1', description: 'Col 1' }, { code: 'C2', description: 'Col 2' }]
      });
      component.filterForm.patchValue({ select: ['C1', 'C2'] }, { emitEvent: false });
      expect(component.getMultiSelectDisplay('select', 'select')).toBe('Col 1, Col 2');
    });

    it('should show +N for > 2 values', () => {
      component.lookups.set({
        ...mockLookups,
        select: [
          { code: 'C1', description: 'Col 1' },
          { code: 'C2', description: 'Col 2' },
          { code: 'C3', description: 'Col 3' },
        ]
      });
      component.filterForm.patchValue({ select: ['C1', 'C2', 'C3'] }, { emitEvent: false });
      expect(component.getMultiSelectDisplay('select', 'select')).toBe('Col 1, Col 2 +1');
    });
  });

  describe('getLookupDescription', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return description when found', () => {
      component.lookups.set(mockLookups);
      expect(component.getLookupDescription('C1', 'select')).toBe('Col 1');
    });

    it('should return code when not found', () => {
      component.lookups.set(mockLookups);
      expect(component.getLookupDescription('UNKNOWN', 'select')).toBe('UNKNOWN');
    });
  });

  describe('onMultiSelectChange', () => {
    const multiLookups: any = {
      ...mockLookups,
      facility: [
        { code: 'F1', description: 'Fac 1' },
        { code: 'F2', description: 'Fac 2' },
      ]
    };

    beforeEach(() => {
      fixture.detectChanges();
      component.lookups.set(multiLookups);
    });

    it('should select all options when ALL_OPTION_VALUE selected', () => {
      component.filterForm.patchValue({ facility: [component.ALL_OPTION_VALUE] }, { emitEvent: false });
      component.onMultiSelectChange('facility', 'facility');
      expect(component.filterForm.get('facility')?.value).toEqual(['F1', 'F2']);
    });

    it('should handle when all individual options are selected', () => {
      component.filterForm.patchValue({ facility: ['F1', 'F2'] }, { emitEvent: false });
      component.onMultiSelectChange('facility', 'facility');
      // No error thrown, isAllSelected should be true
      expect(component.isAllSelected('facility', 'facility')).toBeTrue();
    });

    it('should handle non-existent control gracefully', () => {
      expect(() => component.onMultiSelectChange('nonExistent', 'facility')).not.toThrow();
    });
  });

  describe('isAllSelected', () => {
    const multiLookups: any = {
      ...mockLookups,
      facility: [
        { code: 'F1', description: 'Fac 1' },
        { code: 'F2', description: 'Fac 2' },
      ]
    };

    beforeEach(() => {
      fixture.detectChanges();
      component.lookups.set(multiLookups);
    });

    it('should return true when all selected', () => {
      component.filterForm.patchValue({ facility: ['F1', 'F2'] }, { emitEvent: false });
      expect(component.isAllSelected('facility', 'facility')).toBeTrue();
    });

    it('should return false when not all selected', () => {
      component.filterForm.patchValue({ facility: ['F1'] }, { emitEvent: false });
      expect(component.isAllSelected('facility', 'facility')).toBeFalse();
    });

    it('should return false for non-existent control', () => {
      expect(component.isAllSelected('nonExistent', 'facility')).toBeFalse();
    });
  });

  describe('isSomeSelected', () => {
    const multiLookups: any = {
      ...mockLookups,
      facility: [
        { code: 'F1', description: 'Fac 1' },
        { code: 'F2', description: 'Fac 2' },
      ]
    };

    beforeEach(() => {
      fixture.detectChanges();
      component.lookups.set(multiLookups);
    });

    it('should return true when some selected', () => {
      component.filterForm.patchValue({ facility: ['F1'] }, { emitEvent: false });
      expect(component.isSomeSelected('facility', 'facility')).toBeTrue();
    });

    it('should return false when all selected', () => {
      component.filterForm.patchValue({ facility: ['F1', 'F2'] }, { emitEvent: false });
      expect(component.isSomeSelected('facility', 'facility')).toBeFalse();
    });

    it('should return false when none selected', () => {
      component.filterForm.patchValue({ facility: [] }, { emitEvent: false });
      expect(component.isSomeSelected('facility', 'facility')).toBeFalse();
    });

    it('should return false for non-existent control', () => {
      expect(component.isSomeSelected('nonExistent', 'facility')).toBeFalse();
    });
  });

  describe('getAllCheckboxState', () => {
    const multiLookups: any = {
      ...mockLookups,
      facility: [
        { code: 'F1', description: 'Fac 1' },
        { code: 'F2', description: 'Fac 2' },
      ]
    };

    beforeEach(() => {
      fixture.detectChanges();
      component.lookups.set(multiLookups);
    });

    it('should return checked when all selected', () => {
      component.filterForm.patchValue({ facility: ['F1', 'F2'] }, { emitEvent: false });
      expect(component.getAllCheckboxState('facility', 'facility')).toBe('checked');
    });

    it('should return indeterminate when some selected', () => {
      component.filterForm.patchValue({ facility: ['F1'] }, { emitEvent: false });
      expect(component.getAllCheckboxState('facility', 'facility')).toBe('indeterminate');
    });

    it('should return unchecked when none selected', () => {
      component.filterForm.patchValue({ facility: [] }, { emitEvent: false });
      expect(component.getAllCheckboxState('facility', 'facility')).toBe('unchecked');
    });
  });

  describe('toggleAllSelection', () => {
    const multiLookups: any = {
      ...mockLookups,
      facility: [
        { code: 'F1', description: 'Fac 1' },
        { code: 'F2', description: 'Fac 2' },
      ]
    };

    beforeEach(() => {
      fixture.detectChanges();
      component.lookups.set(multiLookups);
    });

    it('should select all when none selected', () => {
      component.filterForm.patchValue({ facility: [] }, { emitEvent: false });
      component.toggleAllSelection('facility', 'facility');
      expect(component.filterForm.get('facility')?.value).toEqual(['F1', 'F2']);
    });

    it('should deselect all when all selected', () => {
      component.filterForm.patchValue({ facility: ['F1', 'F2'] }, { emitEvent: false });
      component.toggleAllSelection('facility', 'facility');
      expect(component.filterForm.get('facility')?.value).toEqual([]);
    });

    it('should handle non-existent control gracefully', () => {
      expect(() => component.toggleAllSelection('nonExistent', 'facility')).not.toThrow();
    });
  });

  describe('areDatesFilledAndValid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when dates are empty', () => {
      expect(component.areDatesFilledAndValid()).toBeFalse();
    });

    it('should return true when both dates valid', () => {
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31')
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      expect(component.areDatesFilledAndValid()).toBeTrue();
    });

    it('should return false when fromDate after toDate (invalid range)', () => {
      component.filterForm.patchValue({
        fromDate: new Date('2028-02-01'),
        toDate: new Date('2028-01-01')
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      expect(component.areDatesFilledAndValid()).toBeFalse();
    });
  });

  describe('onApplyDropdownFilter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should search when dates are filled and form valid', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31')
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();

      const ev = new Event('click');
      spyOn(ev, 'stopPropagation');
      component.onApplyDropdownFilter(ev);
      tick();

      expect(ev.stopPropagation).toHaveBeenCalled();
      expect(queryService.searchDrives).toHaveBeenCalled();
    }));

    it('should not search when dates are missing', fakeAsync(() => {
      const ev = new Event('click');
      spyOn(ev, 'stopPropagation');
      component.onApplyDropdownFilter(ev);
      tick();
      expect(queryService.searchDrives).not.toHaveBeenCalled();
    }));
  });

  describe('onTimeKeyPress', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should allow digits', () => {
      const ev = new KeyboardEvent('keypress', { key: '5' });
      spyOn(ev, 'preventDefault');
      component.onTimeKeyPress(ev);
      expect(ev.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow colon', () => {
      const ev = new KeyboardEvent('keypress', { key: ':' });
      spyOn(ev, 'preventDefault');
      component.onTimeKeyPress(ev);
      expect(ev.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab', () => {
      const ev = new KeyboardEvent('keypress', { key: 'Tab' });
      spyOn(ev, 'preventDefault');
      component.onTimeKeyPress(ev);
      expect(ev.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Backspace', () => {
      const ev = new KeyboardEvent('keypress', { key: 'Backspace' });
      spyOn(ev, 'preventDefault');
      component.onTimeKeyPress(ev);
      expect(ev.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent letters', () => {
      const ev = new KeyboardEvent('keypress', { key: 'a' });
      spyOn(ev, 'preventDefault');
      component.onTimeKeyPress(ev);
      expect(ev.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onTimeInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should auto-add colon after 2 digits', () => {
      const input = document.createElement('input');
      input.value = '09';
      const ev = new Event('input');
      Object.defineProperty(ev, 'target', { value: input });
      component.onTimeInput(ev, 'minimumDriveStartTimeEnterTime');
      expect(input.value).toBe('09:');
    });

    it('should strip non-numeric non-colon chars', () => {
      const input = document.createElement('input');
      input.value = '1a2b';
      const ev = new Event('input');
      Object.defineProperty(ev, 'target', { value: input });
      component.onTimeInput(ev, 'minimumDriveStartTimeEnterTime');
      expect(input.value).toBe('12:');
    });

    it('should limit to 5 characters', () => {
      const input = document.createElement('input');
      input.value = '12:345';
      const ev = new Event('input');
      Object.defineProperty(ev, 'target', { value: input });
      component.onTimeInput(ev, 'minimumDriveStartTimeEnterTime');
      expect(input.value).toBe('12:34');
    });

    it('should handle multiple colons', () => {
      const input = document.createElement('input');
      input.value = '1:2:3';
      const ev = new Event('input');
      Object.defineProperty(ev, 'target', { value: input });
      component.onTimeInput(ev, 'minimumDriveStartTimeEnterTime');
      expect(input.value.split(':').length).toBeLessThanOrEqual(2);
    });
  });

  describe('formatTimeInput extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear errors for empty value', () => {
      const ctrl = component.filterForm.get('minimumDriveStartTimeEnterTime');
      ctrl?.setValue('   ');
      component.formatTimeInput('minimumDriveStartTimeEnterTime');
      expect(ctrl?.errors).toBeNull();
    });

    it('should pad minutes to 2 digits', () => {
      const ctrl = component.filterForm.get('minimumDriveStartTimeEnterTime');
      ctrl?.setValue('12:5');
      component.formatTimeInput('minimumDriveStartTimeEnterTime');
      expect(ctrl?.value).toBe('12:05');
    });

    it('should set invalidTime for hours > 12', () => {
      const ctrl = component.filterForm.get('minimumDriveStartTimeEnterTime');
      ctrl?.setValue('13:30');
      component.formatTimeInput('minimumDriveStartTimeEnterTime');
      expect(ctrl?.hasError('invalidTime')).toBeTrue();
    });

    it('should set invalidTime for hours < 1', () => {
      const ctrl = component.filterForm.get('minimumDriveStartTimeEnterTime');
      ctrl?.setValue('00:30');
      component.formatTimeInput('minimumDriveStartTimeEnterTime');
      expect(ctrl?.hasError('invalidTime')).toBeTrue();
    });

    it('should set invalidTime for minutes > 59', () => {
      const ctrl = component.filterForm.get('minimumDriveStartTimeEnterTime');
      ctrl?.setValue('10:65');
      component.formatTimeInput('minimumDriveStartTimeEnterTime');
      expect(ctrl?.hasError('invalidTime')).toBeTrue();
    });

    it('should parse 3-digit input without colon (e.g. 930 -> 09:30)', () => {
      const ctrl = component.filterForm.get('minimumDriveStartTimeEnterTime');
      ctrl?.setValue('930');
      component.formatTimeInput('minimumDriveStartTimeEnterTime');
      expect(ctrl?.value).toBe('09:30');
    });

    it('should parse 4-digit input without colon (e.g. 1030 -> 10:30)', () => {
      const ctrl = component.filterForm.get('minimumDriveStartTimeEnterTime');
      ctrl?.setValue('1030');
      component.formatTimeInput('minimumDriveStartTimeEnterTime');
      expect(ctrl?.value).toBe('10:30');
    });

    it('should set invalidTime for invalid 4-digit input without colon', () => {
      const ctrl = component.filterForm.get('minimumDriveStartTimeEnterTime');
      ctrl?.setValue('1399');
      component.formatTimeInput('minimumDriveStartTimeEnterTime');
      expect(ctrl?.hasError('invalidTime')).toBeTrue();
    });

    it('should set invalidTime for single digit input', () => {
      const ctrl = component.filterForm.get('minimumDriveStartTimeEnterTime');
      ctrl?.setValue('9');
      component.formatTimeInput('minimumDriveStartTimeEnterTime');
      expect(ctrl?.hasError('invalidTime')).toBeTrue();
    });

    it('should handle non-existent control gracefully', () => {
      expect(() => component.formatTimeInput('nonExistent')).not.toThrow();
    });
  });

  describe('buildSortString', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return undefined for default direction', () => {
      if (component.tableConfig.sortConfig) {
        component.tableConfig.sortConfig.direction = 'default';
      }
      expect(component['buildSortString']()).toBeUndefined();
    });

    it('should return asc string for A direction', () => {
      if (component.tableConfig.sortConfig) {
        component.tableConfig.sortConfig.column = 'driveDate';
        component.tableConfig.sortConfig.direction = 'A';
      }
      expect(component['buildSortString']()).toBe('driveDate asc');
    });

    it('should return desc string for D direction', () => {
      if (component.tableConfig.sortConfig) {
        component.tableConfig.sortConfig.column = 'sponsorName';
        component.tableConfig.sortConfig.direction = 'D';
      }
      expect(component['buildSortString']()).toBe('sponsorName desc');
    });
  });

  describe('formatDate and formatDateForApi', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('formatDate returns empty for falsy value', () => {
      expect(component['formatDate'](null)).toBe('');
      expect(component['formatDate'](undefined)).toBe('');
    });

    it('formatDate returns formatted date string', () => {
      const result = component['formatDate']('2028-06-15');
      expect(result).toMatch(/\d{2}-\w{3}-\d{4}/);
    });

    it('formatDateForApi returns empty for falsy value', () => {
      expect(component['formatDateForApi'](null)).toBe('');
    });

    it('formatDateForApi returns ISO formatted date', () => {
      const result = component['formatDateForApi'](new Date('2028-06-15'));
      expect(result).toContain('2028-06-15');
    });
  });

  describe('coerceToDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for null', () => {
      expect(component['coerceToDate'](null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(component['coerceToDate']('')).toBeNull();
    });

    it('should return Date for valid Date', () => {
      const d = new Date('2028-01-01');
      expect(component['coerceToDate'](d)).toEqual(d);
    });

    it('should return null for invalid Date', () => {
      expect(component['coerceToDate'](new Date('invalid'))).toBeNull();
    });

    it('should coerce string to Date', () => {
      const result = component['coerceToDate']('2028-06-15');
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for invalid string', () => {
      expect(component['coerceToDate']('not-a-date')).toBeNull();
    });
  });

  describe('convertTo24Hour', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should convert PM time correctly', () => {
      expect(component['convertTo24Hour']('05:30', 'PM')).toBe(17 * 60 + 30);
    });

    it('should not add 12 for 12 PM', () => {
      expect(component['convertTo24Hour']('12:00', 'PM')).toBe(12 * 60);
    });

    it('should convert 12 AM to 0 hours', () => {
      expect(component['convertTo24Hour']('12:00', 'AM')).toBe(0);
    });

    it('should handle AM time correctly', () => {
      expect(component['convertTo24Hour']('09:15', 'AM')).toBe(9 * 60 + 15);
    });
  });

  describe('trackBy functions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('trackByLookupCode returns code', () => {
      expect(component.trackByLookupCode(0, { code: 'X', description: 'Y' })).toBe('X');
    });

    it('trackByStringCode returns string', () => {
      expect(component.trackByStringCode(0, 'abc')).toBe('abc');
    });

    it('trackByNumber returns number', () => {
      expect(component.trackByNumber(0, 42)).toBe(42);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const spy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('hasSearched returns true when drives exist', () => {
      component.drives.set([{ driveId: 'D1' }]);
      expect(component.hasSearched()).toBeTrue();
    });

    it('hasSearched returns true when keyword exists', () => {
      component.searchKeyword.set('test');
      expect(component.hasSearched()).toBeTrue();
    });

    it('hasSearched returns false when no drives and no keyword', () => {
      component.drives.set([]);
      component.searchKeyword.set('');
      expect(component.hasSearched()).toBeFalse();
    });

    it('hasSelectedDrives returns true when drives selected', () => {
      component.selectedDriveIds.set(new Set(['D1']));
      expect(component.hasSelectedDrives()).toBeTrue();
    });

    it('hasSelectedDrives returns false when no drives selected', () => {
      component.selectedDriveIds.set(new Set());
      expect(component.hasSelectedDrives()).toBeFalse();
    });
  });

  describe('searchDrives with advanced filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: new Date('2028-01-01'),
        toDate: new Date('2028-01-31'),
        select: ['C1'],
        facility: ['F1'],
        status: ['S1'],
        sponsor: ['SP1'],
        zipCode: ['Z1'],
        sponsorCategory: 'SC1',
        territory: ['T1'],
        procedure: 'P1',
        driveCategory: ['DC1'],
        fixedDrive: 'I',
        minimumProjectDraw: 5,
        maximumProjectDraw: 20,
        minimumTravelTime: 10,
        maximumTravelTime: 30,
        minimumDriveDurationHour: 1,
        minimumDriveDurationMinute: 15,
        maximumDriveDurationHour: 5,
        maximumDriveDurationMinute: 30,
        minimumDriveStartTimeEnterTime: '08:00',
        minimumDriveStartTimeAMorPM: 'AM',
        maximumDriveStartTimeEnterTime: '05:00',
        maximumDriveStartTimeAMorPM: 'PM',
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
    });

    it('should pass all filter fields to service', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(queryService.searchDrives).toHaveBeenCalled();
      const callArgs = queryService.searchDrives.calls.mostRecent().args;
      const filters = callArgs[2];
      expect(filters.select).toEqual(['C1']);
      expect(filters.facility).toEqual(['F1']);
      expect(filters.status).toEqual(['S1']);
      expect(filters.sponsors).toEqual(['SP1']);
      expect(filters.zipCode).toEqual(['Z1']);
      expect(filters.sponsorCategory).toBe('SC1');
      expect(filters.territory).toEqual(['T1']);
      expect(filters.procedure).toBe('P1');
      expect(filters.driveCategory).toEqual(['DC1']);
      expect(filters.fixedDrive).toBe('I');
      expect(filters.minimumProjectDraw).toBe(5);
      expect(filters.maximumProjectDraw).toBe(20);
    }));
  });

  describe('headerConfig computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have describe criteria disabled when no selection', () => {
      component.selectedDriveIds.set(new Set());
      const cfg = component.headerConfig();
      const describe = cfg.actions?.find((a) => a.label === 'DESCRIBE CRITERIA');
      expect(describe?.disabled).toBeTrue();
    });

    it('should have describe criteria enabled when selection exists', () => {
      component.selectedDriveIds.set(new Set(['D1']));
      const cfg = component.headerConfig();
      const describe = cfg.actions?.find((a) => a.label === 'DESCRIBE CRITERIA');
      expect(describe?.disabled).toBeFalse();
    });

    it('should have breadcrumbs', () => {
      const cfg = component.headerConfig();
      expect(cfg.breadcrumbs?.length).toBeGreaterThan(0);
    });

    it('describe criteria action onClick should open dialog', () => {
      component.selectedDriveIds.set(new Set(['D1']));
      component.lookups.set(mockLookups);
      component.appliedFilters.set({ fromDate: '2028-01-01', toDate: '2028-01-31' } as any);
      const cfg = component.headerConfig();
      const describe = cfg.actions?.find((a) => a.label === 'DESCRIBE CRITERIA');
      describe?.onClick?.();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('drive details action onClick should not throw with selection', () => {
      component.selectedDriveIds.set(new Set(['D1']));
      const cfg = component.headerConfig();
      const details = cfg.actions?.find((a) => a.label === 'DRIVE DETAILS');
      expect(() => details?.onClick?.()).not.toThrow();
    });
  });

  describe('updateFormFromFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update form controls from filter object', () => {
      const filters: any = {
        select: ['C1'],
        facility: ['F1'],
        status: ['S1'],
        sponsors: ['SP1'],
        zipCode: ['Z1'],
        sponsorCategory: 'SC1',
        territory: ['T1'],
        procedure: 'P1',
        driveCategory: ['DC1'],
        fixedDrive: 'I',
        minimumProjectDraw: 5,
        maximumProjectDraw: 20,
        minimumTravelTime: 10,
        maximumTravelTime: 30,
        minimumDriveDurationHour: 1,
        minimumDriveDurationMinute: 15,
        maximumDriveDurationHour: 5,
        maximumDriveDurationMinute: 30,
        minimumDriveStartTimeEnterTime: '08:00',
        minimumDriveStartTimeAMorPM: 'AM',
        maximumDriveStartTimeEnterTime: '05:00',
        maximumDriveStartTimeAMorPM: 'PM',
      };

      component['updateFormFromFilters'](filters);

      expect(component.filterForm.get('select')?.value).toEqual(['C1']);
      expect(component.filterForm.get('facility')?.value).toEqual(['F1']);
      expect(component.filterForm.get('sponsor')?.value).toEqual(['SP1']);
      expect(component.filterForm.get('sponsorCategory')?.value).toBe('SC1');
    });

    it('should handle empty/undefined filter values with defaults', () => {
      component['updateFormFromFilters']({} as any);
      expect(component.filterForm.get('select')?.value).toEqual([]);
      expect(component.filterForm.get('sponsorCategory')?.value).toBe('');
      expect(component.filterForm.get('minimumProjectDraw')?.value).toBeNull();
    });
  });

  describe('onSelectionChange announcer', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should announce number of selected drives', () => {
      component.onSelectionChange([
        { driveId: 'D1' } as DriveRecord,
        { driveId: 'D2' } as DriveRecord,
      ]);
      expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('2 drives selected', 'polite');
    });

    it('should handle records without driveId', () => {
      component.onSelectionChange([{ driveId: undefined } as DriveRecord]);
      expect(component.selectedDriveIds().size).toBe(0);
    });
  });

  describe('validators', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('projectedDrawRange validator returns null when min <= max', () => {
      component.filterForm.patchValue({ minimumProjectDraw: 5, maximumProjectDraw: 10 }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      expect(component.filterForm.hasError('projectedDrawRange')).toBeFalse();
    });

    it('projectedDrawRange validator returns error when min > max', () => {
      component.filterForm.patchValue({ minimumProjectDraw: 15, maximumProjectDraw: 5 }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      expect(component.filterForm.hasError('projectedDrawRange')).toBeTrue();
    });

    it('driveDurationRange validator returns null when both zero', () => {
      component.filterForm.patchValue({
        minimumDriveDurationHour: 0, minimumDriveDurationMinute: 0,
        maximumDriveDurationHour: 0, maximumDriveDurationMinute: 0,
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      expect(component.filterForm.hasError('driveDurationRange')).toBeFalse();
    });

    it('driveDurationRange validator returns error when min > max', () => {
      component.filterForm.patchValue({
        minimumDriveDurationHour: 3, minimumDriveDurationMinute: 0,
        maximumDriveDurationHour: 1, maximumDriveDurationMinute: 0,
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      expect(component.filterForm.hasError('driveDurationRange')).toBeTrue();
    });

    it('driveStartTimeRange validator returns null when fields empty', () => {
      component.filterForm.patchValue({
        minimumDriveStartTimeEnterTime: '',
        minimumDriveStartTimeAMorPM: '',
        maximumDriveStartTimeEnterTime: '',
        maximumDriveStartTimeAMorPM: '',
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      expect(component.filterForm.hasError('driveStartTimeRange')).toBeFalse();
    });

    it('driveStartTimeRange validator returns error when min > max', () => {
      component.filterForm.patchValue({
        minimumDriveStartTimeEnterTime: '05:00',
        minimumDriveStartTimeAMorPM: 'PM',
        maximumDriveStartTimeEnterTime: '08:00',
        maximumDriveStartTimeAMorPM: 'AM',
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      expect(component.filterForm.hasError('driveStartTimeRange')).toBeTrue();
    });

    it('driveStartTimeRange validator returns null when min < max', () => {
      component.filterForm.patchValue({
        minimumDriveStartTimeEnterTime: '08:00',
        minimumDriveStartTimeAMorPM: 'AM',
        maximumDriveStartTimeEnterTime: '05:00',
        maximumDriveStartTimeAMorPM: 'PM',
      }, { emitEvent: false });
      component.filterForm.updateValueAndValidity();
      expect(component.filterForm.hasError('driveStartTimeRange')).toBeFalse();
    });
  });
});
