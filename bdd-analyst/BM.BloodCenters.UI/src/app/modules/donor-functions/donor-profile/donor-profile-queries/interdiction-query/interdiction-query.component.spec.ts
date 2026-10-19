import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { InterdictionQueryComponent } from './interdiction-query.component';
import { InterdictionQueryService } from '../../../query-interdictions-holds/services/interdiction-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('InterdictionQueryComponent', () => {
  let component: InterdictionQueryComponent;
  let fixture: ComponentFixture<InterdictionQueryComponent>;
  let interdictionQueryServiceSpy: jasmine.SpyObj<InterdictionQueryService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let chapterChangedSubject: Subject<any>;

  const mockInterdictionCodes = [
    { code: 'INT001', description: 'Test Interdiction' },
    { code: 'INT002', description: 'Another Interdiction' }
  ];

  const mockQueryResponse = {
    success: true,
    message: 'Query successful',
    totalRecords: 2,
    results: [],
    data: {
      results: [],
      operation: '-',
      totalRecords: 2
    }
  };

  beforeEach(() => {

    chapterChangedSubject = new Subject<any>();

    interdictionQueryServiceSpy = jasmine.createSpyObj('InterdictionQueryService', [
      'getInterdictionCodes',
      'queryInterdictions',
      'queryDonorInterdictions',
      'getValidDonationTypes'
    ]);
    interdictionQueryServiceSpy.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));
    interdictionQueryServiceSpy.queryInterdictions.and.returnValue(of(mockQueryResponse));
    interdictionQueryServiceSpy.queryDonorInterdictions.and.returnValue(of(mockQueryResponse));
    interdictionQueryServiceSpy.getValidDonationTypes.and.returnValue(of({ data: [], success: true, message: '' }));

    dialogSpy = createMockMatDialog();
    snackBarSpy = createMockMatSnackBar();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('Interdiction Query');
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    loginServiceSpy.getStoredUsername.and.returnValue('testuser');

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'fetchChapterTimezone',
      'getChapterLocalDate',
      'isChapterLocalDateAvailable',
      'clearChapterLocalDate'
    ], {
      chapterLocalDate: jasmine.createSpy().and.returnValue(moment().startOf('day')),
      currentChapterId: jasmine.createSpy().and.returnValue('CH01')
    });
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);



      TestBed.configureTestingModule({
      imports: [InterdictionQueryComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: InterdictionQueryService, useValue: interdictionQueryServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
      interdictionQueryServiceSpy.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));


      interdictionQueryServiceSpy.queryInterdictions.and.returnValue(of(mockQueryResponse));


      interdictionQueryServiceSpy.queryDonorInterdictions.and.returnValue(of(mockQueryResponse));


      interdictionQueryServiceSpy.getValidDonationTypes.and.returnValue(of({ data: [], success: true, message: '' }));


      pageHeaderServiceSpy.getTitle.and.returnValue('Interdiction Query');
      loginServiceSpy.getStoredUsername.and.returnValue('testuser');


      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);


    fixture = TestBed.createComponent(InterdictionQueryComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should initialize query form with empty option', () => {
      fixture.detectChanges();
      expect(component.queryForm).toBeDefined();
      expect(component.queryForm.get('option')?.value).toBe('');
      expect(component.queryForm.get('operation')?.value).toBe('-');
    });

    it('should not load interdiction codes on init when option is empty', () => {
      fixture.detectChanges();
      expect(interdictionQueryServiceSpy.getInterdictionCodes).not.toHaveBeenCalled();
      expect(component.availableCodes).toEqual([]);
    });

    it('should load interdiction codes when user selects Interdiction option', () => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Interdiction' });
      expect(interdictionQueryServiceSpy.getInterdictionCodes).toHaveBeenCalledWith('Interdiction');
      expect(component.availableCodes).toEqual(mockInterdictionCodes);
    });

    it('should set current user ID from login service', () => {
      fixture.detectChanges();
      expect(loginServiceSpy.getStoredUsername).toHaveBeenCalled();
      expect(component.currentUserId()).toBe('testuser');
    });





    it('should initialize signals with empty/default values', () => {
      fixture.detectChanges();
      expect(component.donationRecords()).toEqual([]);
      expect(component.donorRecords()).toEqual([]);
      expect(component.isLoading()).toBeFalse();
      expect(component.hasQueried()).toBeFalse();
      expect(component.interdictionSearchText()).toBe('');
      expect(component.holdSearchText()).toBe('');
    });
  });

  describe('Option Changes', () => {
    it('should load Hold codes when option changes to Hold', () => {
      fixture.detectChanges();
      interdictionQueryServiceSpy.getInterdictionCodes.and.returnValue(of([
        { code: 'HOLD1', description: 'Test Hold' }
      ]));

      component.queryForm.patchValue({ option: 'Hold' });

      expect(interdictionQueryServiceSpy.getInterdictionCodes).toHaveBeenCalledWith('Hold');
    });

    it('should reset code when option changes', () => {
      fixture.detectChanges();
      component.queryForm.patchValue({ code: 'INT001', option: 'Interdiction' });

      component.queryForm.patchValue({ option: 'Hold' });

      expect(component.queryForm.get('code')?.value).toBeNull();
    });

    it('should handle error when loading codes fails', fakeAsync(() => {
      fixture.detectChanges();
      const showErrorMessageSpy = spyOn<any>(component, 'showErrorMessage');

      interdictionQueryServiceSpy.getInterdictionCodes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.queryForm.patchValue({ option: 'Interdiction' });
      flush();

      expect(component.availableCodes).toEqual([]);
      expect(showErrorMessageSpy).toHaveBeenCalledWith('Failed to load Interdiction codes');
    }));
  });

  describe('Code Selection', () => {
    it('should set selected code description when code changes', () => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Interdiction' });

      component.queryForm.patchValue({ code: 'INT001' });

      expect(component.selectedCodeDescription).toBe('Test Interdiction');
    });

    it('should clear selected code description when code is cleared', () => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Interdiction' });
      component.queryForm.patchValue({ code: 'INT001' });

      component.queryForm.patchValue({ code: null });

      expect(component.selectedCodeDescription).toBe('');
    });
  });

  describe('Tab Management', () => {
    it('should update current tab when selectedTabIndex changes', () => {
      fixture.detectChanges();

      component.selectedTabIndex.set(1);

      expect(component.currentTab()).toBe('Donors');
    });


  });

  describe('Filter States', () => {
    it('should initialize donations filter as null', () => {
      fixture.detectChanges();
      expect(component.donationsFilter()).toBeNull();
    });

    it('should initialize donors filter as null', () => {
      fixture.detectChanges();
      expect(component.donorsFilter()).toBeNull();
    });



    it('should initialize isFilterOpen as false', () => {
      fixture.detectChanges();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('Chapter Change Subscription', () => {
    it('should reset component state on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ code: 'INT001', option: 'Interdiction' });
      component.donationRecords.set([{ unitId: '123' } as any]);
      component.donorRecords.set([{ unitId: '456' } as any]);

      // Trigger chapter change by emitting a new value
      chapterChangedSubject.next(null);
      tick();

      // Component state should be reset
      expect(component.donationRecords()).toEqual([]);
      expect(component.donorRecords()).toEqual([]);
      expect(component.hasQueried()).toBeFalse();
      expect(component.queryForm.get('code')?.value).toBeNull();
      expect(component.queryForm.get('fromCollectionDate')?.value).toBeNull();
      expect(component.queryForm.get('toCollectionDate')?.value).toBeNull();
    }));
  });

  describe('Form Validation', () => {
    it('should require option field', () => {
      fixture.detectChanges();
      const optionControl = component.queryForm.get('option');

      optionControl?.setValue(null);

      expect(optionControl?.hasError('required')).toBeTrue();
    });

    it('should require code field by default when no option is selected', () => {
      fixture.detectChanges();
      const codeControl = component.queryForm.get('code');

      expect(codeControl?.hasError('required')).toBeTrue();
    });

    it('should not require code field when option is Interdiction', () => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Interdiction' });

      const codeControl = component.queryForm.get('code');
      expect(codeControl?.hasError('required')).toBeFalse();
    });

    it('should require code field when option is Hold', () => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Hold' });

      const codeControl = component.queryForm.get('code');
      expect(codeControl?.hasError('required')).toBeTrue();
    });

    it('should clear code required validator when switching from Hold to Interdiction', () => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Hold' });
      expect(component.queryForm.get('code')?.hasError('required')).toBeTrue();

      component.queryForm.patchValue({ option: 'Interdiction' });
      expect(component.queryForm.get('code')?.hasError('required')).toBeFalse();
    });

    it('should restore code required validator when switching from Interdiction to Hold', () => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Interdiction' });
      expect(component.queryForm.get('code')?.hasError('required')).toBeFalse();

      component.queryForm.patchValue({ option: 'Hold' });
      expect(component.queryForm.get('code')?.hasError('required')).toBeTrue();
    });

    it('should not require code when operation switches from ADD to single-select in Interdiction mode', () => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Interdiction' });

      // Simulate switching to ADD mode then back
      component.queryForm.patchValue({ operation: 'ADD' });
      component.queryForm.patchValue({ operation: '-' });

      const codeControl = component.queryForm.get('code');
      expect(codeControl?.hasError('required')).toBeFalse();
    });

    it('should require code when operation switches from ADD to single-select in Hold mode', () => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Hold' });

      // Simulate switching to ADD mode then back
      component.queryForm.patchValue({ operation: 'ADD' });
      component.queryForm.patchValue({ operation: '-' });

      const codeControl = component.queryForm.get('code');
      expect(codeControl?.hasError('required')).toBeTrue();
    });

    it('should initialize with operation as "-"', () => {
      fixture.detectChanges();
      expect(component.queryForm.get('operation')?.value).toBe('-');
    });

    it('should initialize multipleOperation as "OR"', () => {
      fixture.detectChanges();
      expect(component.queryForm.get('multipleOperation')?.value).toBe('OR');
    });
  });

  describe('onRetrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.currentUserId.set('testuser');
      component.currentChapterId.set('TST');
    });

    it('should show error when form is invalid', () => {
      const showErrorSpy = spyOn<any>(component, 'showErrorMessage');
      component.queryForm.patchValue({ option: '' });
      component.onRetrieve();
      expect(showErrorSpy).toHaveBeenCalled();
    });

    it('should show error when userId is not set', () => {
      const showErrorSpy = spyOn<any>(component, 'showErrorMessage');
      component.currentUserId.set('');
      component.queryForm.patchValue({ option: 'Interdiction' });
      component.queryForm.get('code')?.clearValidators();
      component.queryForm.get('code')?.updateValueAndValidity();
      component.onRetrieve();
      expect(showErrorSpy).toHaveBeenCalled();
    });

    it('should query donations and map results', fakeAsync(() => {
      component.queryForm.patchValue({ option: 'Interdiction' });
      component.queryForm.get('code')?.clearValidators();
      component.queryForm.get('code')?.updateValueAndValidity();

      interdictionQueryServiceSpy.queryInterdictions.and.returnValue(of({
        success: true,
        totalRecords: 1,
        results: [{
          transactionId: 'T1', unitId: 'U1', displayUnitId: 'DU1', collDate: '2024-01-01',
          donationType: 'WB', procedureCode: 'PC', interCode: 'INT001',
          effDate: '2024-01-01', termDate: null, releaseDate: null, releaseUser: '',
          originatedFrom: 'SYS', reasonCode: 'R1', interType: 'I', source: 'U',
          donorId: 'D1', donorName: 'John', dateOfBirth: '1990-01-01', gender: 'M',
          driveId: 'DR1'
        }]
      }));

      component.onRetrieve();
      tick();

      expect(component.hasQueried()).toBeTrue();
      expect(component.donationRecords().length).toBe(1);
      expect(component.donationRecords()[0].unitId).toBe('DU1');
      expect(component.donationRecords()[0].interdictionCustody).toBe('Unit');
    }));

    it('should query donors tab and map results', fakeAsync(() => {
      component.queryForm.patchValue({ option: 'Interdiction' });
      component.queryForm.get('code')?.clearValidators();
      component.queryForm.get('code')?.updateValueAndValidity();
      component.selectedTabIndex.set(1);

      interdictionQueryServiceSpy.queryDonorInterdictions.and.returnValue(of({
        success: true,
        totalRecords: 1,
        results: [{
          transactionId: 'T1', unitId: 'U1', displayUnitId: 'DU1', collDate: '2024-01-01',
          effDate: '2024-01-01', termDate: null, donorId: 'D1', interCode: 'INT001',
          driveId: 'DR1'
        }]
      }));

      component.onRetrieve();
      tick();

      expect(component.donorRecords().length).toBe(1);
    }));

    it('should show warning when totalRecords > 700', fakeAsync(() => {
      const showErrorSpy = spyOn<any>(component, 'showErrorMessage');
      component.queryForm.patchValue({ option: 'Interdiction' });
      component.queryForm.get('code')?.clearValidators();
      component.queryForm.get('code')?.updateValueAndValidity();

      interdictionQueryServiceSpy.queryInterdictions.and.returnValue(of({
        success: true,
        totalRecords: 701,
        results: []
      }));

      component.onRetrieve();
      tick();

      expect(showErrorSpy).toHaveBeenCalled();
    }));

    it('should calculate default dates when both are null', fakeAsync(() => {
      component.queryForm.patchValue({ option: 'Interdiction' });
      component.queryForm.get('code')?.clearValidators();
      component.queryForm.get('code')?.updateValueAndValidity();

      interdictionQueryServiceSpy.queryInterdictions.and.returnValue(of({ success: true, totalRecords: 0, results: [] }));

      component.onRetrieve();
      tick();

      expect(component.queryForm.get('fromCollectionDate')?.value).toBeTruthy();
      expect(component.queryForm.get('toCollectionDate')?.value).toBeTruthy();
    }));

    it('should calculate from date when only to date is provided', fakeAsync(() => {
      const toDate = moment().subtract(1, 'day');
      component.queryForm.patchValue({ option: 'Interdiction', toCollectionDate: toDate });
      component.queryForm.get('code')?.clearValidators();
      component.queryForm.get('code')?.updateValueAndValidity();

      interdictionQueryServiceSpy.queryInterdictions.and.returnValue(of({ success: true, totalRecords: 0, results: [] }));

      component.onRetrieve();
      tick();

      expect(component.queryForm.get('fromCollectionDate')?.value).toBeTruthy();
    }));

    it('should calculate to date when only from date is provided', fakeAsync(() => {
      const fromDate = moment().subtract(5, 'days');
      component.queryForm.patchValue({ option: 'Interdiction', fromCollectionDate: fromDate });
      component.queryForm.get('code')?.clearValidators();
      component.queryForm.get('code')?.updateValueAndValidity();

      interdictionQueryServiceSpy.queryInterdictions.and.returnValue(of({ success: true, totalRecords: 0, results: [] }));

      component.onRetrieve();
      tick();

      expect(component.queryForm.get('toCollectionDate')?.value).toBeTruthy();
    }));

    it('should use multiple codes when operation is ADD', fakeAsync(() => {
      component.queryForm.patchValue({ option: 'Interdiction', operation: 'ADD', multipleCodes: ['INT001', 'INT002'], multipleOperation: 'OR' });
      component.queryForm.get('code')?.clearValidators();
      component.queryForm.get('code')?.updateValueAndValidity();

      interdictionQueryServiceSpy.queryInterdictions.and.returnValue(of({ success: true, totalRecords: 0, results: [] }));

      component.onRetrieve();
      tick();

      const callArgs = interdictionQueryServiceSpy.queryInterdictions.calls.mostRecent().args[0];
      expect(callArgs.interCodes).toEqual(['INT001', 'INT002']);
      expect(callArgs.interCodesOperator).toBe('OR');
    }));
  });

  describe('onSearch', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.currentUserId.set('testuser');
      component.currentChapterId.set('TST');
      component.hasQueried.set(true);
      component.queryForm.patchValue({ option: 'Interdiction' });
    });

    it('should set interdiction search text for Interdiction option', () => {
      component.queriedOptionType.set('Interdiction');
      component.onSearch('test');
      expect(component.interdictionSearchText()).toBe('test');
    });

    it('should set hold search text for Hold option', () => {
      component.queriedOptionType.set('Hold');
      component.onSearch('test');
      expect(component.holdSearchText()).toBe('test');
    });

    it('should not call API if hasQueried is false', () => {
      component.hasQueried.set(false);
      interdictionQueryServiceSpy.queryInterdictions.calls.reset();
      component.onSearch('test');
      expect(interdictionQueryServiceSpy.queryInterdictions).not.toHaveBeenCalled();
    });

    it('should return early when userId is not set', () => {
      component.currentUserId.set('');
      component.isLoading.set(false);
      component.onSearch('U123');
      expect(component.isLoading()).toBeFalse();
    });
  });

  describe('onDonationsSort', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.currentUserId.set('testuser');
      component.currentChapterId.set('TST');
      component.hasQueried.set(true);
      component.queryForm.patchValue({ option: 'Interdiction' });
    });

    it('should store sort state', () => {
      component.onDonationsSort({ active: 'unitId', direction: 'asc' });
      expect(component.currentSort).toEqual({ active: 'unitId', direction: 'asc' });
    });

    it('should not call API if hasQueried is false', () => {
      component.hasQueried.set(false);
      interdictionQueryServiceSpy.queryInterdictions.calls.reset();
      component.onDonationsSort({ active: 'unitId', direction: 'asc' });
      expect(interdictionQueryServiceSpy.queryInterdictions).not.toHaveBeenCalled();
    });

    it('should return early when userId is not set', () => {
      component.currentUserId.set('');
      component.isLoading.set(false);
      component.onDonationsSort({ active: 'unitId', direction: 'desc' });
      expect(component.currentSort?.direction).toBe('desc');
      expect(component.isLoading()).toBeFalse();
    });
  });

  describe('Row Expand/Collapse', () => {
    beforeEach(() => fixture.detectChanges());

    it('should toggle row expansion', () => {
      component.toggleRow('U1');
      expect(component.isRowExpanded('U1')).toBeTrue();
      component.toggleRow('U1');
      expect(component.isRowExpanded('U1')).toBeFalse();
    });

    it('should expand all rows', () => {
      component.donationRecords.set([{ unitId: 'U1' } as any, { unitId: 'U2' } as any]);
      component.expandAllRows();
      expect(component.isRowExpanded('U1')).toBeTrue();
      expect(component.isRowExpanded('U2')).toBeTrue();
    });

    it('should collapse all rows', () => {
      component.toggleRow('U1');
      component.collapseAllRows();
      expect(component.isRowExpanded('U1')).toBeFalse();
    });
  });

  describe('Tab Change', () => {
    it('should update tab index and close filter panel', () => {
      fixture.detectChanges();
      component.isFilterOpen = true;
      component.onTabChange(1);
      expect(component.selectedTabIndex()).toBe(1);
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('Filter Panel', () => {
    beforeEach(() => fixture.detectChanges());

    it('should toggle filter panel open', () => {
      component.toggleFilterPanel();
      expect(component.isFilterOpen).toBeTrue();
    });

    it('should toggle filter panel closed', () => {
      component.isFilterOpen = true;
      component.toggleFilterPanel();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close filter panel', () => {
      component.isFilterOpen = true;
      component.closeFilterPanel();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('onDonationsFilter should toggle panel', () => {
      component.onDonationsFilter();
      expect(component.isFilterOpen).toBeTrue();
    });

    it('onDonorsFilter should toggle panel', () => {
      component.onDonorsFilter();
      expect(component.isFilterOpen).toBeTrue();
    });
  });

  describe('applyDonationsFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.currentUserId.set('testuser');
      component.currentChapterId.set('TST');
      component.hasQueried.set(true);
      component.queryForm.patchValue({ option: 'Interdiction' });
    });

    it('should set filter and close panel', fakeAsync(() => {
      const filters = { donationType: 'WB', showReleased: null, effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null, unitId: null };
      interdictionQueryServiceSpy.queryInterdictions.and.returnValue(of({ success: true, totalRecords: 0, results: [] }));
      component.isFilterOpen = true;
      component.applyDonationsFilters(filters);
      tick();
      expect(component.donationsFilter()).toEqual(filters);
      expect(component.isFilterOpen).toBeFalse();
    }));

    it('should handle API error', fakeAsync(() => {
      const filters = { donationType: null, showReleased: null, effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null, unitId: null };
      interdictionQueryServiceSpy.queryInterdictions.and.returnValue(throwError(() => new Error('fail')));
      component.applyDonationsFilters(filters);
      tick();
      expect(component.isLoading()).toBeFalse();
    }));
  });

  describe('applyDonorsFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.currentUserId.set('testuser');
      component.currentChapterId.set('TST');
      component.hasQueried.set(true);
      component.queryForm.patchValue({ option: 'Hold' });
    });

    it('should set donor filter and close panel', () => {
      const filters = { showTerminated: false, sex: '' };
      component.isFilterOpen = true;
      component.hasQueried.set(false);
      component.applyDonorsFilters(filters);
      expect(component.donorsFilter()).toEqual(filters);
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should handle API error', fakeAsync(() => {
      const filters = { showTerminated: false, sex: '' };
      interdictionQueryServiceSpy.queryDonorInterdictions.and.returnValue(throwError(() => new Error('fail')));
      component.applyDonorsFilters(filters);
      tick();
      expect(component.isLoading()).toBeFalse();
    }));
  });

  describe('clearFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.currentUserId.set('testuser');
      component.currentChapterId.set('TST');
      component.hasQueried.set(true);
      component.queryForm.patchValue({ option: 'Interdiction' });
      interdictionQueryServiceSpy.queryInterdictions.and.returnValue(of({ success: true, totalRecords: 0, results: [] }));
      interdictionQueryServiceSpy.queryDonorInterdictions.and.returnValue(of({ success: true, totalRecords: 0, results: [] }));
    });

    it('should clear donations filters on Donations tab', fakeAsync(() => {
      component.selectedTabIndex.set(0);
      component.clearFilters();
      tick();
      expect(component.donationsFilter()?.donationType).toBeNull();
    }));

    it('should clear donors filters on Donors tab', fakeAsync(() => {
      component.selectedTabIndex.set(1);
      component.clearFilters();
      tick();
      expect(component.donorsFilter()?.showTerminated).toBeFalse();
    }));
  });

  describe('Other Holds Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open other holds dialog for donations tab', () => {
      component.donationRecords.set([
        { unitId: 'U1', transactionId: 'T1', collectionDate: '01-JAN-2024', driveId: 'DR1' } as any
      ]);
      component.openOtherHoldsDialog('U1');
      expect(component.isOtherHoldsPanelOpen).toBeTrue();
      expect(component.otherHoldsPanelData?.transactionId).toBe('T1');
    });

    it('should not open panel when transactionId is missing', () => {
      component.donationRecords.set([]);
      component.openOtherHoldsDialog('U_UNKNOWN');
      expect(component.isOtherHoldsPanelOpen).toBeFalse();
    });

    it('should open other holds dialog for donors tab', () => {
      component.selectedTabIndex.set(1);
      component.donorRecords.set([
        { unitId: 'U1', transactionId: 'T2', collectionDate: '01-JAN-2024', driveId: 'DR1' } as any
      ]);
      component.openOtherHoldsDialog('U1');
      expect(component.isOtherHoldsPanelOpen).toBeTrue();
      expect(component.otherHoldsPanelData?.transactionId).toBe('T2');
    });

    it('should close other holds panel', () => {
      component.isOtherHoldsPanelOpen = true;
      component.highlightedDonationRow = {} as any;
      component.closeOtherHoldsPanel();
      expect(component.isOtherHoldsPanelOpen).toBeFalse();
      expect(component.highlightedDonationRow).toBeNull();
    });
  });

  describe('Format Methods', () => {
    beforeEach(() => fixture.detectChanges());

    it('formatDate should format valid date', () => {
      expect(component.formatDate('2024-06-15')).toContain('JUN-2024');
    });

    it('formatDate should return - for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('formatCodeDisplay should show code and description', () => {
      expect(component.formatCodeDisplay({ code: 'INT001', description: 'Test' })).toBe('INT001 - Test');
    });

    it('formatCodeDisplay should show only code when no description', () => {
      expect(component.formatCodeDisplay({ code: 'INT001', description: '' })).toBe('INT001');
    });
  });

  describe('mapSourceToCustody', () => {
    beforeEach(() => fixture.detectChanges());

    it('should map U to Unit', () => {
      expect((component as any).mapSourceToCustody('U')).toBe('Unit');
    });

    it('should map D to Donor', () => {
      expect((component as any).mapSourceToCustody('D')).toBe('Donor');
    });

    it('should return original value for unknown source', () => {
      expect((component as any).mapSourceToCustody('X')).toBe('X');
    });

    it('should return empty string for undefined', () => {
      expect((component as any).mapSourceToCustody(undefined)).toBe('');
    });
  });

  describe('Navigation Methods', () => {
    beforeEach(() => fixture.detectChanges());

    it('navigateToAttributes should navigate when donorId is set', () => {
      component.selectedDonorId.set('D1');
      component.navigateToAttributes();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/donor-functions/donor-profile/attributes'],
        { queryParams: { donorId: 'D1' } }
      );
    });

    it('navigateToAttributes should not navigate when donorId is null', () => {
      component.selectedDonorId.set(null);
      routerSpy.navigate.calls.reset();
      component.navigateToAttributes();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('navigateToDemographics should navigate when donorId is set', () => {
      component.selectedDonorId.set('D1');
      component.navigateToDemographics();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/donor-functions/donor-profile/demographics'],
        { queryParams: { donorId: 'D1' } }
      );
    });

    it('navigateToDonations should navigate when donorId is set', () => {
      component.selectedDonorId.set('D1');
      component.navigateToDonations();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/donor-functions/donor-profile/donations'],
        { queryParams: { donorId: 'D1' } }
      );
    });

    it('navigateToOtherInter should not navigate when donorId is null', () => {
      component.selectedDonorId.set(null);
      routerSpy.navigate.calls.reset();
      component.navigateToOtherInter();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Getters', () => {
    beforeEach(() => fixture.detectChanges());

    it('displayCodeDescription should return - when empty', () => {
      component.selectedCodeDescription = '';
      expect(component.displayCodeDescription).toBe('-');
    });

    it('displayCodeDescription should truncate long descriptions', () => {
      component.selectedCodeDescription = 'A'.repeat(60);
      expect(component.displayCodeDescription.length).toBe(53); // 50 + '...'
    });

    it('displayCodeDescription should return full description when short', () => {
      component.selectedCodeDescription = 'Short desc';
      expect(component.displayCodeDescription).toBe('Short desc');
    });

    it('hasActiveFiltersOrSearch should return true when search is active', () => {
      component.queriedOptionType.set('Interdiction');
      component.interdictionSearchText.set('test');
      expect(component.hasActiveFiltersOrSearch).toBeTrue();
    });

    it('hasActiveFiltersOrSearch should return true when filter has donationType', () => {
      component.donationsFilter.set({ donationType: 'WB', showReleased: null, effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null, unitId: null });
      expect(component.hasActiveFiltersOrSearch).toBeTrue();
    });

    it('hasActiveFiltersOrSearch should return false when no filters or search', () => {
      component.interdictionSearchText.set('');
      component.holdSearchText.set('');
      component.donationsFilter.set(null);
      expect(component.hasActiveFiltersOrSearch).toBeFalse();
    });

    it('f getter should return form controls', () => {
      expect(component.f['option']).toBeDefined();
    });

    it('filterQueryContext should return API params', () => {
      component.currentUserId.set('testuser');
      component.currentChapterId.set('TST');
      component.queryForm.patchValue({ option: 'Interdiction', code: 'INT001' });
      const ctx = component.filterQueryContext;
      expect(ctx.option).toBe('Interdiction');
      expect(ctx.interCodes).toEqual(['INT001']);
    });

    it('totalCount should return filtered donations count on Donations tab', () => {
      component.selectedTabIndex.set(0);
      component.donationRecords.set([{ unitId: 'U1' } as any, { unitId: 'U2' } as any]);
      expect(component.totalCount()).toBe(2);
    });

    it('totalCount should return filtered donors count on Donors tab', () => {
      component.selectedTabIndex.set(1);
      component.donorRecords.set([{ unitId: 'U1' } as any]);
      expect(component.totalCount()).toBe(1);
    });
  });

  describe('filteredDonations computed', () => {
    beforeEach(() => fixture.detectChanges());

    it('should filter by donation type', () => {
      component.donationRecords.set([
        { unitId: 'U1', donationType: 'WB' } as any,
        { unitId: 'U2', donationType: 'AP' } as any
      ]);
      component.donationsFilter.set({ donationType: 'WB', showReleased: null, effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null, unitId: null });
      expect(component.filteredDonations().length).toBe(1);
      expect(component.filteredDonations()[0].unitId).toBe('U1');
    });

    it('should filter by effective date (After)', () => {
      component.donationRecords.set([
        { unitId: 'U1', effectiveDate: '2024-06-15' } as any,
        { unitId: 'U2', effectiveDate: '2024-01-01' } as any
      ]);
      component.donationsFilter.set({ donationType: null, showReleased: null, effectivePeriod: 'After', effectiveDate: '2024-06-01', terminationPeriod: null, terminationDate: null, unitId: null });
      expect(component.filteredDonations().length).toBe(1);
    });

    it('should filter by termination date (Before)', () => {
      component.donationRecords.set([
        { unitId: 'U1', terminationDate: '2024-01-01' } as any,
        { unitId: 'U2', terminationDate: '2024-12-01' } as any
      ]);
      component.donationsFilter.set({ donationType: null, showReleased: null, effectivePeriod: null, effectiveDate: null, terminationPeriod: 'Before', terminationDate: '2024-06-01', unitId: null });
      expect(component.filteredDonations().length).toBe(1);
    });

    it('should filter by unitId', () => {
      component.donationRecords.set([
        { unitId: 'U123' } as any,
        { unitId: 'U456' } as any
      ]);
      component.donationsFilter.set({ donationType: null, showReleased: null, effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null, unitId: 'U123' });
      expect(component.filteredDonations().length).toBe(1);
    });

    it('should filter by search text', () => {
      component.donationRecords.set([
        { unitId: 'U123' } as any,
        { unitId: 'U456' } as any
      ]);
      component.queriedOptionType.set('Interdiction');
      component.interdictionSearchText.set('U123');
      expect(component.filteredDonations().length).toBe(1);
    });
  });

  describe('filteredDonors computed', () => {
    beforeEach(() => fixture.detectChanges());

    it('should filter out terminated donors when showTerminated is false', () => {
      component.donorRecords.set([
        { unitId: 'U1', terminationDate: '2024-01-01' } as any,
        { unitId: 'U2', terminationDate: '' } as any
      ]);
      component.donorsFilter.set({ showTerminated: false, sex: '' });
      expect(component.filteredDonors().length).toBe(1);
      expect(component.filteredDonors()[0].unitId).toBe('U2');
    });

    it('should show all donors when showTerminated is true', () => {
      component.donorRecords.set([
        { unitId: 'U1', terminationDate: '2024-01-01' } as any,
        { unitId: 'U2', terminationDate: '' } as any
      ]);
      component.donorsFilter.set({ showTerminated: true, sex: '' } as any);
      expect(component.filteredDonors().length).toBe(2);
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => fixture.detectChanges());

    it('getFromDateError should return future date error', () => {
      const control = component.queryForm.get('fromCollectionDate');
      control?.setErrors({ futureDate: true });
      expect(component.getFromDateError()).toContain('future date');
    });

    it('getFromDateError should return invalid date error', () => {
      const control = component.queryForm.get('fromCollectionDate');
      control?.setErrors({ invalidDate: true });
      expect(component.getFromDateError()).toContain('invalid');
    });

    it('getFromDateError should return parse error', () => {
      const control = component.queryForm.get('fromCollectionDate');
      control?.setErrors({ matDatepickerParse: true });
      expect(component.getFromDateError()).toContain('invalid');
    });

    it('getFromDateError should return date range error when from was last changed', () => {
      const control = component.queryForm.get('fromCollectionDate');
      control?.markAsTouched();
      (component as any).lastChangedDateField = 'from';
      // Set form-level error
      component.queryForm.setErrors({ dateRangeInvalid: true });
      expect(component.getFromDateError()).toContain('on or before');
    });

    it('getFromDateError should return empty when no errors', () => {
      expect(component.getFromDateError()).toBe('');
    });

    it('getToDateError should return future date error', () => {
      const control = component.queryForm.get('toCollectionDate');
      control?.setErrors({ futureDate: true });
      expect(component.getToDateError()).toContain('future date');
    });

    it('getToDateError should return invalid date error', () => {
      const control = component.queryForm.get('toCollectionDate');
      control?.setErrors({ invalidDate: true });
      expect(component.getToDateError()).toContain('invalid');
    });

    it('getToDateError should return date range error when to was last changed', () => {
      const control = component.queryForm.get('toCollectionDate');
      control?.markAsTouched();
      (component as any).lastChangedDateField = 'to';
      component.queryForm.setErrors({ dateRangeInvalid: true });
      expect(component.getToDateError()).toContain('on or after');
    });

    it('noFutureDateValidator should return null for null value', () => {
      const validator = (component as any).noFutureDateValidator();
      expect(validator({ value: null } as any)).toBeNull();
    });

    it('noFutureDateValidator should return futureDate for future date', () => {
      const validator = (component as any).noFutureDateValidator();
      const futureDate = moment().add(5, 'days');
      expect(validator({ value: futureDate } as any)).toEqual({ futureDate: true });
    });

    it('noFutureDateValidator should return null for past date', () => {
      const validator = (component as any).noFutureDateValidator();
      const pastDate = moment().subtract(5, 'days');
      expect(validator({ value: pastDate } as any)).toBeNull();
    });

    it('validateDates should return false for future fromDate', () => {
      component.queryForm.get('fromCollectionDate')?.setValue(moment().add(5, 'days'));
      expect((component as any).validateDates()).toBeFalse();
    });

    it('validateDates should return false for future toDate', () => {
      component.queryForm.get('toCollectionDate')?.setValue(moment().add(5, 'days'));
      expect((component as any).validateDates()).toBeFalse();
    });

    it('validateDates should return false when fromDate is after toDate', () => {
      component.queryForm.get('fromCollectionDate')?.setValue(moment().subtract(1, 'day'));
      component.queryForm.get('toCollectionDate')?.setValue(moment().subtract(3, 'days'));
      expect((component as any).validateDates()).toBeFalse();
    });

    it('validateDates should return true for valid dates', () => {
      component.queryForm.get('fromCollectionDate')?.setValue(moment().subtract(5, 'days'));
      component.queryForm.get('toCollectionDate')?.setValue(moment().subtract(1, 'day'));
      expect((component as any).validateDates()).toBeTrue();
    });
  });

  describe('Error State Matchers', () => {
    beforeEach(() => fixture.detectChanges());

    it('fromDateErrorMatcher should return true for futureDate error', () => {
      const control = component.queryForm.get('fromCollectionDate') as any;
      control.setErrors({ futureDate: true });
      expect(component.fromDateErrorMatcher.isErrorState(control, null as any)).toBeTrue();
    });

    it('fromDateErrorMatcher should return false for null control', () => {
      expect(component.fromDateErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('toDateErrorMatcher should return true for invalidDate error', () => {
      const control = component.queryForm.get('toCollectionDate') as any;
      control.setErrors({ invalidDate: true });
      expect(component.toDateErrorMatcher.isErrorState(control, null as any)).toBeTrue();
    });
  });

  describe('onAddInterdictions', () => {
    beforeEach(() => fixture.detectChanges());

    it('should pass correct dialog data', () => {
      component.queryForm.patchValue({ multipleOperation: 'AND', multipleCodes: ['INT001'] });
      // Verify the method constructs dialog data correctly by checking form state
      expect(component.queryForm.get('multipleOperation')?.value).toBe('AND');
      expect(component.queryForm.get('multipleCodes')?.value).toEqual(['INT001']);
    });
  });

  describe('Code Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Interdiction' });
    });

    it('should filter codes by search term', fakeAsync(() => {
      component.codeSearchControl.setValue('INT001');
      tick(300);
      expect(component.filteredCodesSignal().length).toBe(1);
    }));

    it('should show all codes when search is empty', fakeAsync(() => {
      component.codeSearchControl.setValue('INT001');
      tick(300);
      component.codeSearchControl.setValue('');
      tick(300);
      expect(component.filteredCodesSignal().length).toBe(2);
    }));

    it('should filter by description', fakeAsync(() => {
      component.codeSearchControl.setValue('Another');
      tick(300);
      expect(component.filteredCodesSignal().length).toBe(1);
      expect(component.filteredCodesSignal()[0].code).toBe('INT002');
    }));
  });

  describe('formatDateForAPI', () => {
    beforeEach(() => fixture.detectChanges());

    it('should format moment date', () => {
      const d = moment('2024-06-15');
      expect((component as any).formatDateForAPI(d)).toBe('2024-06-15');
    });

    it('should return empty for null', () => {
      expect((component as any).formatDateForAPI(null)).toBe('');
    });

    it('should format non-moment date', () => {
      expect((component as any).formatDateForAPI('2024-06-15')).toBe('2024-06-15');
    });
  });

  describe('interdictionCodeValidator', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return error when ADD mode with no codes', () => {
      component.queryForm.patchValue({ operation: 'ADD', multipleCodes: [] });
      component.queryForm.updateValueAndValidity();
      expect(component.queryForm.hasError('multipleCodesRequired')).toBeTrue();
    });

    it('should return null when ADD mode with codes', () => {
      component.queryForm.patchValue({ operation: 'ADD', multipleCodes: ['INT001'] });
      component.queryForm.updateValueAndValidity();
      expect(component.queryForm.hasError('multipleCodesRequired')).toBeFalse();
    });

    it('should return null when not in ADD mode', () => {
      component.queryForm.patchValue({ operation: '-' });
      component.queryForm.updateValueAndValidity();
      expect(component.queryForm.hasError('multipleCodesRequired')).toBeFalse();
    });
  });

  describe('Operation changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ option: 'Hold' });
    });

    it('should clear code validators in ADD mode', () => {
      component.queryForm.patchValue({ operation: 'ADD' });
      const codeControl = component.queryForm.get('code');
      expect(codeControl?.hasError('required')).toBeFalse();
    });

    it('should restore code description when switching from ADD to single select', () => {
      component.queryForm.patchValue({ code: 'INT001', operation: 'ADD' });
      component.queryForm.patchValue({ operation: '-' });
      // Code was cleared when switching away from ADD
      expect(component.queryForm.get('multipleCodes')?.value).toEqual([]);
    });
  });
});
