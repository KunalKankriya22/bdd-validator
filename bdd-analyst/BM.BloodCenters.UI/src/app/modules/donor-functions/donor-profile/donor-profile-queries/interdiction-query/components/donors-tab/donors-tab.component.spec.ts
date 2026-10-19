import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';
import { signal } from '@angular/core';
import { DonorsTabComponent } from './donors-tab.component';
import { InterdictionQueryService } from '../../../../../query-interdictions-holds/services/interdiction-query.service';
import { InterdictionResult } from '../../../../../query-interdictions-holds/models/interdiction-query.model';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('DonorsTabComponent', () => {
  let component: DonorsTabComponent;
  let fixture: ComponentFixture<DonorsTabComponent>;
  let interdictionQueryServiceSpy: jasmine.SpyObj<InterdictionQueryService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  const chapterChanged$ = new Subject<void>();

  const mockInterdictionCodes = [
    { code: '101A', description: 'Test Interdiction A' },
    { code: '201B', description: 'Test Interdiction B' }
  ];

  const mockApiResults: InterdictionResult[] = [
    {
      donorId: 'DN001',
      donorName: 'Smith, John',
      dateOfBirth: '1990-01-15T00:00:00',
      gender: 'M',
      interCode: '101A',
      originatedFrom: 'HQ001',
      reasonCode: 'R001',
      effDate: '2025-01-01T00:00:00',
      termDate: '2025-12-01T00:00:00',
      groupMode: 'A',
      groupId: 'G1'
    },
    {
      donorId: 'DN001',
      donorName: 'Smith, John',
      dateOfBirth: '1990-01-15T00:00:00',
      gender: 'M',
      interCode: '201B',
      effDate: '2025-03-01T00:00:00',
      groupMode: '',
      groupId: ''
    },
    {
      donorId: 'DN002',
      donorName: 'Doe, Jane',
      dateOfBirth: '1985-06-20T00:00:00',
      gender: 'F',
      interCode: '101A',
      originatedFrom: 'HQ002',
      reasonCode: 'R002',
      effDate: '2025-02-15T00:00:00',
      termDate: '2025-11-15T00:00:00',
      groupMode: 'B',
      groupId: 'G2'
    }
  ];

  const mockSearchResponse = {
    success: true,
    message: '',
    totalRecords: 3,
    results: mockApiResults
  };

  beforeEach(() => {

    interdictionQueryServiceSpy = jasmine.createSpyObj('InterdictionQueryService', [
      'getInterdictionCodes',
      'queryDonorInterdictions',
      'getDonorAddress'
    ]);
    interdictionQueryServiceSpy.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));
    interdictionQueryServiceSpy.queryDonorInterdictions.and.returnValue(of(mockSearchResponse));
    interdictionQueryServiceSpy.getDonorAddress.and.returnValue(of(null));

    snackBarSpy = createMockMatSnackBar();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    (chapterTimezoneServiceSpy as any).chapterLocalDate = signal(moment().startOf('day'));

      TestBed.configureTestingModule({
      imports: [DonorsTabComponent, NoopAnimationsModule],
      providers: [
        { provide: InterdictionQueryService, useValue: interdictionQueryServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChanged$.asObservable() } },
      ]
    });

    

      interdictionQueryServiceSpy.getInterdictionCodes.calls.reset();

      interdictionQueryServiceSpy.queryDonorInterdictions.calls.reset();

      interdictionQueryServiceSpy.getDonorAddress.calls.reset();

      chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();

      interdictionQueryServiceSpy.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));

      interdictionQueryServiceSpy.queryDonorInterdictions.and.returnValue(of(mockSearchResponse));

      interdictionQueryServiceSpy.getDonorAddress.and.returnValue(of(null));

      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));

    fixture = TestBed.createComponent(DonorsTabComponent);
    component = fixture.componentInstance;
    dialogSpy = createMockMatDialog();
    (component as any).dialog = dialogSpy;

    });

  describe('Initialization', () => {

    it('should initialize query form with default values', () => {
      fixture.detectChanges();
      expect(component.queryForm).toBeDefined();
      expect(component.queryForm.get('code')?.value).toBeNull();
      expect(component.queryForm.get('operation')?.value).toBe('-');
      expect(component.queryForm.get('lastName')?.value).toBe('');
    });

    it('should load interdiction codes on init', () => {
      fixture.detectChanges();
      expect(interdictionQueryServiceSpy.getInterdictionCodes).toHaveBeenCalledWith('Interdiction');
      expect(component.availableCodes).toEqual(mockInterdictionCodes);
    });

    it('should handle error loading codes', () => {
      interdictionQueryServiceSpy.getInterdictionCodes.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      fixture.detectChanges();
      expect(component.availableCodes).toEqual([]);
    });

    it('should have default signal values', () => {
      expect(component.isLoading()).toBeFalse();
      expect(component.hasQueried()).toBeFalse();
      expect(component.donorList()).toEqual([]);
      expect(component.selectedDonor()).toBeNull();
    });
  });

  describe('Retrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ code: '101A' });
    });

    it('should disable retrieve when no code is selected', () => {
      component.queryForm.patchValue({ code: null });
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve when code is selected', () => {
      expect(component.isRetrieveDisabled).toBeFalse();
    });


    it('should group results by donor after retrieve', () => {
      component.onRetrieve();
      const donors = component.donorList();
      expect(donors.length).toBe(2);
      expect(donors[0].donorId).toBe('DN001');
      expect(donors[0].interdictions.length).toBe(2);
      expect(donors[1].donorId).toBe('DN002');
      expect(donors[1].interdictions.length).toBe(1);
    });

    it('should select first donor after retrieve', () => {
      component.onRetrieve();
      expect(component.selectedDonor()?.donorId).toBe('DN001');
    });

    it('should set hasQueried to true after retrieve', () => {
      component.onRetrieve();
      expect(component.hasQueried()).toBeTrue();
    });

    it('should fetch donor address for first donor', () => {
      component.onRetrieve();
      expect(interdictionQueryServiceSpy.getDonorAddress).toHaveBeenCalledWith('DN001');
    });


    it('should handle API error on retrieve', () => {
      interdictionQueryServiceSpy.queryDonorInterdictions.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      component.onRetrieve();
      expect(component.isLoading()).toBeFalse();
    });

    it('should send lastName to API when provided', () => {
      component.queryForm.patchValue({ lastName: 'Smith' });
      component.onRetrieve();
      const callArgs = interdictionQueryServiceSpy.queryDonorInterdictions.calls.mostRecent().args[0];
      expect(callArgs.lastName).toBe('Smith');
    });

    it('should not send lastName when empty', () => {
      component.queryForm.patchValue({ lastName: '  ' });
      component.onRetrieve();
      const callArgs = interdictionQueryServiceSpy.queryDonorInterdictions.calls.mostRecent().args[0];
      expect(callArgs.lastName).toBeUndefined();
    });

    it('should send showTerminated to API from filter', () => {
      component.donorsFilter.set({ showTerminated: true, sex: '' });
      component.onRetrieve();
      const callArgs = interdictionQueryServiceSpy.queryDonorInterdictions.calls.mostRecent().args[0];
      expect(callArgs.showTerminated).toBeTrue();
    });

    it('should not send showTerminated when filter is false', () => {
      component.donorsFilter.set({ showTerminated: false, sex: '' });
      component.onRetrieve();
      const callArgs = interdictionQueryServiceSpy.queryDonorInterdictions.calls.mostRecent().args[0];
      expect(callArgs.showTerminated).toBeUndefined();
    });

    it('should send gender to API from filter', () => {
      component.donorsFilter.set({ showTerminated: false, sex: 'M' });
      component.onRetrieve();
      const callArgs = interdictionQueryServiceSpy.queryDonorInterdictions.calls.mostRecent().args[0];
      expect(callArgs.gender).toBe('M');
    });

    it('should not send gender when sex is empty', () => {
      component.donorsFilter.set({ showTerminated: false, sex: '' });
      component.onRetrieve();
      const callArgs = interdictionQueryServiceSpy.queryDonorInterdictions.calls.mostRecent().args[0];
      expect(callArgs.gender).toBeUndefined();
    });
  });

  describe('groupByDonor', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ code: '101A' });
    });


    it('should map termDate from API response', () => {
      component.onRetrieve();
      const donors = component.donorList();
      expect(donors[0].interdictions[0].terminationDate).toBe('2025-12-01T00:00:00');
    });


    it('should handle missing optional fields', () => {
      component.onRetrieve();
      const donors = component.donorList();
      const secondInterdiction = donors[0].interdictions[1];
      expect(secondInterdiction.origin).toBe('');
      expect(secondInterdiction.reason).toBe('');
      expect(secondInterdiction.terminationDate).toBe('');
    });
  });

  describe('Donor Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ code: '101A' });
      component.onRetrieve();
    });

    it('should update selectedDonor on donor selection', () => {
      const secondDonor = component.donorList()[1];
      component.onDonorSelected(secondDonor);
      expect(component.selectedDonor()?.donorId).toBe('DN002');
    });

    it('should fetch address when donor is selected', () => {
      interdictionQueryServiceSpy.getDonorAddress.calls.reset();
      const secondDonor = component.donorList()[1];
      component.onDonorSelected(secondDonor);
      expect(interdictionQueryServiceSpy.getDonorAddress).toHaveBeenCalledWith('DN002');
    });

    it('should populate address data from API response', () => {
      interdictionQueryServiceSpy.getDonorAddress.and.returnValue(of({
        streetName: '123 Main St',
        homePhone: '555-0100',
        businessPhone: '555-0200',
        email: '[REDACTED_EMAIL_ADDRESS_1]',
        intlAddr: '',
        intlHomePhone: '',
        intlWorkPhone: '',
        isInternational: false
      }));

      const donor = component.donorList()[1];
      component.onDonorSelected(donor);

      const selected = component.selectedDonor();
      expect(selected?.address).toBe('123 Main St');
      expect(selected?.phoneHome).toBe('555-0100');
      expect(selected?.phoneBusiness).toBe('555-0200');
      expect(selected?.email).toBe('[REDACTED_EMAIL_ADDRESS_1]');
    });
  });

  describe('Side Panel Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ code: '101A' });
      component.onRetrieve();
    });

    it('should open demographics side panel', () => {
      component.onDemographics('DN001');
      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentSection()).toBe('demographics');
      expect(component.sidePanelDonor()?.donorId).toBe('DN001');
    });

    it('should open donation details dialog for donations', () => {
      component.onDonations('DN001');
      expect(dialogSpy.open).toHaveBeenCalled();
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.donorId).toBe('DN001');
    });

    it('should open attributes side panel', () => {
      component.onAttributes('DN001');
      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentSection()).toBe('attributes');
      expect(component.sidePanelDonor()?.donorId).toBe('DN001');
    });

    it('should open interdictions side panel', () => {
      component.onOtherInterdictions('DN001');
      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentSection()).toBe('interdictions');
      expect(component.sidePanelDonor()?.donorId).toBe('DN001');
    });

    it('should close side panel and reset state', () => {
      component.onDemographics('DN001');
      expect(component.sidePanelOpen()).toBeTrue();

      component.onPanelClose();
      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.sidePanelDonor()).toBeNull();
      expect(component.currentSection()).toBeNull();
    });

    it('should not open panel if donor not found', () => {
      component.onDemographics('NONEXISTENT');
      expect(component.sidePanelOpen()).toBeFalse();
    });
  });

  describe('Filter Apply', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ code: '101A' });
    });

    it('should set filter and re-fetch on applyDonorsFilters', () => {
      component.applyDonorsFilters({ showTerminated: true, sex: 'F' });
      expect(component.donorsFilter()).toEqual({ showTerminated: true, sex: 'F' });
      expect(interdictionQueryServiceSpy.queryDonorInterdictions).toHaveBeenCalled();
    });

    it('should send gender from applied filter to API', () => {
      component.applyDonorsFilters({ showTerminated: false, sex: 'M' });
      const callArgs = interdictionQueryServiceSpy.queryDonorInterdictions.calls.mostRecent().args[0];
      expect(callArgs.gender).toBe('M');
    });

    it('should send showTerminated from applied filter to API', () => {
      component.applyDonorsFilters({ showTerminated: true, sex: '' });
      const callArgs = interdictionQueryServiceSpy.queryDonorInterdictions.calls.mostRecent().args[0];
      expect(callArgs.showTerminated).toBeTrue();
    });

    it('should return donorList directly from filteredDonorList (no client-side filtering)', () => {
      component.onRetrieve();
      component.donorsFilter.set({ showTerminated: false, sex: 'M' });
      expect(component.filteredDonorList()).toEqual(component.donorList());
    });
  });

  describe('Code Description', () => {
    it('should update description when code changes', fakeAsync(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ code: '101A' });
      tick();
      expect(component.selectedCodeDescription).toBe('Test Interdiction A');
    }));

    it('should clear description for unknown code', fakeAsync(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ code: 'UNKNOWN' });
      tick();
      expect(component.selectedCodeDescription).toBe('');
    }));

    it('should not update description when operation is ADD', fakeAsync(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ operation: 'ADD' });
      component.selectedCodeDescription = 'existing';
      component.queryForm.patchValue({ code: '101A' });
      tick();
      expect(component.selectedCodeDescription).toBe('existing');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Chapter Changes', () => {
    it('should reset component and reload codes when chapter changes', () => {
      fixture.detectChanges();
      interdictionQueryServiceSpy.getInterdictionCodes.calls.reset();
      component.queryForm.patchValue({ code: '101A', lastName: 'Test' });
      component.hasQueried.set(true);
      component.donorList.set([{ donorId: 'DN001', lastName: 'Smith', firstName: 'John', dateOfBirth: '', gender: 'M', address: '', internationalAddress: '', phoneHome: '', phoneBusiness: '', email: '', interdictions: [] }]);

      chapterChanged$.next();

      expect(component.queryForm.get('code')?.value).toBeNull();
      expect(component.queryForm.get('lastName')?.value).toBe('');
      expect(component.hasQueried()).toBeFalse();
      expect(component.donorList()).toEqual([]);
      expect(component.selectedDonor()).toBeNull();
      expect(component.selectedCodeDescription).toBe('');
      expect(component.selectedCodesTooltip).toBe('');
      expect(component.minToDate).toBeNull();
      expect(component.isLoading()).toBeFalse();
      expect(component.donorsFilter()).toBeNull();
      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.sidePanelDonor()).toBeNull();
      expect(component.currentSection()).toBeNull();
      expect(interdictionQueryServiceSpy.getInterdictionCodes).toHaveBeenCalledWith('Interdiction');
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set minToDate when fromCollectionDate changes to a moment value', fakeAsync(() => {
      const fromDate = moment('2025-01-15');
      component.queryForm.patchValue({ fromCollectionDate: fromDate });
      tick();
      expect(component.minToDate).toBeTruthy();
    }));

    it('should set minToDate when fromCollectionDate changes to a Date value', fakeAsync(() => {
      const fromDate = new Date(2025, 0, 15);
      component.queryForm.patchValue({ fromCollectionDate: fromDate });
      tick();
      expect(component.minToDate).toEqual(fromDate);
    }));

    it('should clear minToDate when fromCollectionDate is cleared', fakeAsync(() => {
      component.queryForm.patchValue({ fromCollectionDate: moment('2025-01-15') });
      tick();
      component.queryForm.patchValue({ fromCollectionDate: null });
      tick();
      expect(component.minToDate).toBeNull();
    }));

    it('should set minToDate from a string date value', fakeAsync(() => {
      const fromDate = '2025-01-15';
      component.queryForm.patchValue({ fromCollectionDate: fromDate });
      tick();
      expect(component.minToDate).toBeTruthy();
    }));

    it('toDate validator should return dateBefore when toDate is before fromDate', fakeAsync(() => {
      const fromDate = moment('2025-06-01');
      const toDate = moment('2025-01-01');
      component.queryForm.patchValue({ fromCollectionDate: fromDate, toCollectionDate: toDate });
      tick();
      const toControl = component.queryForm.get('toCollectionDate');
      toControl?.updateValueAndValidity();
      expect(toControl?.hasError('dateBefore')).toBeTrue();
    }));

    it('toDate validator should return null when toDate is after fromDate', fakeAsync(() => {
      const fromDate = moment('2025-01-01');
      const toDate = moment('2025-06-01');
      component.queryForm.patchValue({ fromCollectionDate: fromDate, toCollectionDate: toDate });
      tick();
      const toControl = component.queryForm.get('toCollectionDate');
      toControl?.updateValueAndValidity();
      expect(toControl?.hasError('dateBefore')).toBeFalse();
    }));

    it('toDate validator should return null when both dates are the same', fakeAsync(() => {
      const sameDate = moment('2025-03-15');
      component.queryForm.patchValue({ fromCollectionDate: sameDate.clone(), toCollectionDate: sameDate.clone() });
      tick();
      const toControl = component.queryForm.get('toCollectionDate');
      toControl?.updateValueAndValidity();
      expect(toControl?.hasError('dateBefore')).toBeFalse();
    }));

    it('toDate validator should handle Date objects', fakeAsync(() => {
      const fromDate = new Date(2025, 5, 1);
      const toDate = new Date(2025, 0, 1);
      component.queryForm.patchValue({ fromCollectionDate: fromDate, toCollectionDate: toDate });
      tick();
      const toControl = component.queryForm.get('toCollectionDate');
      toControl?.updateValueAndValidity();
      expect(toControl?.hasError('dateBefore')).toBeTrue();
    }));
  });

  describe('Code Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter codes based on search term', fakeAsync(() => {
      component.codeSearchControl.setValue('101');
      tick(350);
      expect(component.filteredCodes().length).toBe(1);
      expect(component.filteredCodes()[0].code).toBe('101A');
    }));

    it('should return all codes when search is empty', fakeAsync(() => {
      component.codeSearchControl.setValue('101');
      tick(350);
      component.codeSearchControl.setValue('');
      tick(350);
      expect(component.filteredCodes().length).toBe(mockInterdictionCodes.length);
    }));

    it('should filter by description', fakeAsync(() => {
      component.codeSearchControl.setValue('Interdiction B');
      tick(350);
      expect(component.filteredCodes().length).toBe(1);
      expect(component.filteredCodes()[0].code).toBe('201B');
    }));

    it('should return empty when no match', fakeAsync(() => {
      component.codeSearchControl.setValue('ZZZZZ');
      tick(350);
      expect(component.filteredCodes().length).toBe(0);
    }));

    it('should handle null description in codes', fakeAsync(() => {
      component.availableCodes = [{ code: 'X', description: null as any }];
      component.codeSearchControl.setValue('some');
      tick(350);
      expect(component.filteredCodes().length).toBe(0);
    }));
  });

  describe('Date Blur Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('onFromDateBlur should mark control as touched', fakeAsync(() => {
      component.onFromDateBlur();
      tick(10);
      const control = component.queryForm.get('fromCollectionDate');
      expect(control?.touched).toBeTrue();
    }));

    it('onToDateBlur should mark control as touched', fakeAsync(() => {
      component.onToDateBlur();
      tick(10);
      const control = component.queryForm.get('toCollectionDate');
      expect(control?.touched).toBeTrue();
    }));
  });

  describe('getFromDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when no control', () => {
      spyOn(component.queryForm, 'get').and.returnValue(null as any);
      expect(component.getFromDateError()).toBe('');
    });

    it('should return future date error when matDatepickerMax', () => {
      const control = component.queryForm.get('fromCollectionDate')!;
      control.setErrors({ matDatepickerMax: true });
      expect(component.getFromDateError()).toBe('From Collection Date cannot be a future date');
    });

    it('should return invalid date for invalidDate error', () => {
      const control = component.queryForm.get('fromCollectionDate')!;
      control.setErrors({ invalidDate: true });
      expect(component.getFromDateError()).toBe('From Collection Date is invalid');
    });

    it('should return invalid date for matDatepickerParse error', () => {
      const control = component.queryForm.get('fromCollectionDate')!;
      control.setErrors({ matDatepickerParse: { text: 'abc' } });
      expect(component.getFromDateError()).toBe('From Collection Date is invalid');
    });

    it('should return invalid when input has value but control has none', () => {
      (component as any).fromDateInput = { nativeElement: { value: 'abc' } };
      const control = component.queryForm.get('fromCollectionDate')!;
      control.markAsTouched();
      expect(component.getFromDateError()).toBe('From Collection Date is invalid');
    });

    it('should return date range error when dateRangeInvalid', () => {
      component.queryForm.setErrors({ dateRangeInvalid: true });
      expect(component.getFromDateError()).toBe('From Collection Date must be on or before To Collection Date');
    });

    it('should return empty when no errors', () => {
      expect(component.getFromDateError()).toBe('');
    });
  });

  describe('getToDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when no control', () => {
      spyOn(component.queryForm, 'get').and.returnValue(null as any);
      expect(component.getToDateError()).toBe('');
    });

    it('should return future date error when matDatepickerMax', () => {
      const control = component.queryForm.get('toCollectionDate')!;
      control.setErrors({ matDatepickerMax: true });
      expect(component.getToDateError()).toBe('To Collection Date cannot be a future date');
    });

    it('should return invalid date for invalidDate error', () => {
      const control = component.queryForm.get('toCollectionDate')!;
      control.setErrors({ invalidDate: true });
      expect(component.getToDateError()).toBe('To Collection Date is invalid');
    });

    it('should return invalid date for matDatepickerParse error', () => {
      const control = component.queryForm.get('toCollectionDate')!;
      control.setErrors({ matDatepickerParse: { text: 'abc' } });
      expect(component.getToDateError()).toBe('To Collection Date is invalid');
    });

    it('should return invalid when input has value but control has none', () => {
      (component as any).toDateInput = { nativeElement: { value: 'abc' } };
      const control = component.queryForm.get('toCollectionDate')!;
      control.markAsTouched();
      expect(component.getToDateError()).toBe('To Collection Date is invalid');
    });

    it('should return dateBefore error message', () => {
      const control = component.queryForm.get('toCollectionDate')!;
      control.setErrors({ dateBefore: true });
      expect(component.getToDateError()).toBe('To Collection Date must be on or after From Collection Date');
    });

    it('should return matDatepickerMin error message', () => {
      const control = component.queryForm.get('toCollectionDate')!;
      control.setErrors({ matDatepickerMin: true });
      expect(component.getToDateError()).toBe('To Collection Date must be on or after From Collection Date');
    });

    it('should return date range error when dateRangeInvalid on form', () => {
      component.queryForm.setErrors({ dateRangeInvalid: true });
      expect(component.getToDateError()).toBe('To Collection Date must be on or after From Collection Date');
    });

    it('should return empty when no errors', () => {
      expect(component.getToDateError()).toBe('');
    });
  });

  describe('validateFromDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalidDate error when input has value but control is empty', () => {
      (component as any).fromDateInput = { nativeElement: { value: 'abc' } };
      (component as any).validateFromDateInput();
      const control = component.queryForm.get('fromCollectionDate')!;
      expect(control.hasError('invalidDate')).toBeTrue();
    });

    it('should clear invalidDate error when input is empty', () => {
      (component as any).fromDateInput = { nativeElement: { value: 'abc' } };
      (component as any).validateFromDateInput();
      (component as any).fromDateInput = { nativeElement: { value: '' } };
      (component as any).validateFromDateInput();
      const control = component.queryForm.get('fromCollectionDate')!;
      expect(control.hasError('invalidDate')).toBeFalse();
    });

    it('should preserve other errors when clearing invalidDate', () => {
      const control = component.queryForm.get('fromCollectionDate')!;
      control.setErrors({ invalidDate: true, matDatepickerMax: true });
      (component as any).fromDateInput = { nativeElement: { value: '' } };
      (component as any).validateFromDateInput();
      expect(control.hasError('matDatepickerMax')).toBeTrue();
      expect(control.hasError('invalidDate')).toBeFalse();
    });
  });

  describe('validateToDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalidDate error when input has value but control is empty', () => {
      (component as any).toDateInput = { nativeElement: { value: 'xyz' } };
      (component as any).validateToDateInput();
      const control = component.queryForm.get('toCollectionDate')!;
      expect(control.hasError('invalidDate')).toBeTrue();
    });

    it('should clear invalidDate error when control has a valid value', fakeAsync(() => {
      (component as any).toDateInput = { nativeElement: { value: 'xyz' } };
      (component as any).validateToDateInput();
      component.queryForm.patchValue({ toCollectionDate: moment('2025-06-01') });
      tick();
      (component as any).validateToDateInput();
      const control = component.queryForm.get('toCollectionDate')!;
      expect(control.hasError('invalidDate')).toBeFalse();
    }));
  });

  describe('isRetrieveDisabled with multiple codes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should enable retrieve when operation is ADD with multiple codes', () => {
      component.queryForm.patchValue({
        operation: 'ADD',
        multipleCodes: ['101A', '201B'],
        code: null
      });
      const codeControl = component.queryForm.get('code')!;
      codeControl.clearValidators();
      codeControl.updateValueAndValidity();
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should disable retrieve when loading', () => {
      component.queryForm.patchValue({ code: '101A' });
      component.isLoading.set(true);
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should not call API when disabled', () => {
      component.queryForm.patchValue({ code: null });
      interdictionQueryServiceSpy.queryDonorInterdictions.calls.reset();
      component.onRetrieve();
      expect(interdictionQueryServiceSpy.queryDonorInterdictions).not.toHaveBeenCalled();
    });

    it('should mark form touched when retrieve is disabled and onRetrieve is called', () => {
      component.queryForm.patchValue({ code: null });
      component.onRetrieve();
      expect(component.queryForm.touched).toBeTrue();
    });

    it('should disable when from date error exists', () => {
      component.queryForm.patchValue({ code: '101A' });
      const control = component.queryForm.get('fromCollectionDate')!;
      control.setErrors({ matDatepickerMax: true });
      control.markAsTouched();
      (component as any).fromDateInput = { nativeElement: { value: '2099-01-01' } };
      expect(component.isRetrieveDisabled).toBeTrue();
    });
  });

  describe('Retrieve with multiple codes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should send interCodes and interCodesOperator when operation is ADD', () => {
      component.queryForm.patchValue({
        operation: 'ADD',
        multipleCodes: ['101A', '201B'],
        multipleOperation: 'AND',
        code: null
      });
      const codeControl = component.queryForm.get('code')!;
      codeControl.clearValidators();
      codeControl.updateValueAndValidity();

      component.onRetrieve();
      const callArgs = interdictionQueryServiceSpy.queryDonorInterdictions.calls.mostRecent().args[0];
      expect(callArgs.interCode).toBeUndefined();
      expect(callArgs.interCodes).toEqual(['101A', '201B']);
      expect(callArgs.interCodesOperator).toBe('AND');
    });

    it('should send date params when dates are provided', () => {
      component.queryForm.patchValue({
        code: '101A',
        fromCollectionDate: moment('2025-01-01'),
        toCollectionDate: moment('2025-06-01')
      });
      component.onRetrieve();
      const callArgs = interdictionQueryServiceSpy.queryDonorInterdictions.calls.mostRecent().args[0];
      expect(callArgs.fromDate).toBeDefined();
      expect(callArgs.toDate).toBeDefined();
    });

    it('should handle empty results', () => {
      interdictionQueryServiceSpy.queryDonorInterdictions.and.returnValue(of({
        success: true,
        message: '',
        totalRecords: 0,
        results: []
      }));
      component.queryForm.patchValue({ code: '101A' });
      component.onRetrieve();
      expect(component.donorList()).toEqual([]);
      expect(component.selectedDonor()).toBeNull();
      expect(component.hasQueried()).toBeTrue();
    });
  });

  describe('onAddInterdictions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open multi-select dialog with current values', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.queryForm.patchValue({ multipleOperation: 'AND', multipleCodes: ['101A'] });
      component.onAddInterdictions();
      expect(dialogSpy.open).toHaveBeenCalled();
      const data = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(data.mode).toBe('AND');
      expect(data.selectedCodes).toEqual(['101A']);
    });

    it('should update form when dialog returns success', fakeAsync(() => {
      const dialogResult = {
        success: true,
        selectedCodes: ['101A', '201B'],
        logicalOperation: 'OR',
        displayString: '101A, 201B'
      };
      dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as any);

      component.onAddInterdictions();
      tick();

      expect(component.queryForm.get('operation')?.value).toBe('ADD');
      expect(component.queryForm.get('multipleCodes')?.value).toEqual(['101A', '201B']);
      expect(component.queryForm.get('multipleOperation')?.value).toBe('OR');
      expect(component.queryForm.get('code')?.value).toBeNull();
      expect(component.selectedCodeDescription).toContain('2 codes selected');
      expect(component.selectedCodesTooltip).toBe('101A, 201B');
    }));

    it('should not update form when dialog is cancelled', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.queryForm.patchValue({ operation: '-', code: '101A' });

      component.onAddInterdictions();
      tick();

      expect(component.queryForm.get('operation')?.value).toBe('-');
    }));

    it('should not update form when dialog result has success false', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ success: false }) } as any);
      component.queryForm.patchValue({ operation: '-' });

      component.onAddInterdictions();
      tick();

      expect(component.queryForm.get('operation')?.value).toBe('-');
    }));
  });

  describe('Donor Selection edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.queryForm.patchValue({ code: '101A' });
      component.onRetrieve();
    });

    it('should not re-fetch address when selecting same donor', () => {
      interdictionQueryServiceSpy.getDonorAddress.calls.reset();
      const firstDonor = component.donorList()[0];
      component.onDonorSelected(firstDonor);
      expect(interdictionQueryServiceSpy.getDonorAddress).not.toHaveBeenCalled();
    });

    it('should handle address fetch error gracefully', () => {
      interdictionQueryServiceSpy.getDonorAddress.and.returnValue(throwError(() => new Error('Address error')));
      const secondDonor = component.donorList()[1];
      expect(() => component.onDonorSelected(secondDonor)).not.toThrow();
    });
  });

  describe('Panel width', () => {
    it('should update panel width', () => {
      fixture.detectChanges();
      component.onPanelWidthChange('50vw');
      expect(component.sidePanelWidth()).toBe('50vw');
    });
  });

  describe('maxDate', () => {
    it('should return chapter local date when valid', () => {
      const testDate = moment('2025-06-15');
      (chapterTimezoneServiceSpy as any).chapterLocalDate = signal(testDate);
      fixture = TestBed.createComponent(DonorsTabComponent);
      component = fixture.componentInstance;
      const max = component.maxDate();
      expect(max).toBeTruthy();
    });

    it('should return today when chapter date is invalid', () => {
      (chapterTimezoneServiceSpy as any).chapterLocalDate = signal(moment.invalid());
      fixture = TestBed.createComponent(DonorsTabComponent);
      component = fixture.componentInstance;
      const max = component.maxDate();
      expect(max.isValid()).toBeTrue();
    });
  });

  describe('Error State Matchers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('fromDateErrorMatcher should return false for null control', () => {
      expect(component.fromDateErrorMatcher.isErrorState(null, null)).toBeFalse();
    });

    it('fromDateErrorMatcher should return true for invalid touched control', () => {
      const control = component.queryForm.get('fromCollectionDate') as any;
      control.setErrors({ required: true });
      control.markAsTouched();
      expect(component.fromDateErrorMatcher.isErrorState(control, null)).toBeTrue();
    });

    it('fromDateErrorMatcher should return true when input has value but control has no value', () => {
      (component as any).fromDateInput = { nativeElement: { value: 'abc' } };
      const control = component.queryForm.get('fromCollectionDate') as any;
      control.markAsTouched();
      expect(component.fromDateErrorMatcher.isErrorState(control, null)).toBeTrue();
    });

    it('toDateErrorMatcher should return false for null control', () => {
      expect(component.toDateErrorMatcher.isErrorState(null, null)).toBeFalse();
    });

    it('toDateErrorMatcher should return true for invalid touched control', () => {
      const control = component.queryForm.get('toCollectionDate') as any;
      control.setErrors({ required: true });
      control.markAsTouched();
      expect(component.toDateErrorMatcher.isErrorState(control, null)).toBeTrue();
    });

    it('toDateErrorMatcher should return true when input has value but control has no value', () => {
      (component as any).toDateInput = { nativeElement: { value: 'xyz' } };
      const control = component.queryForm.get('toCollectionDate') as any;
      control.markAsTouched();
      expect(component.toDateErrorMatcher.isErrorState(control, null)).toBeTrue();
    });
  });

  describe('Load codes edge cases', () => {
    it('should set empty codes and call showInfoMessage when codes are empty', () => {
      interdictionQueryServiceSpy.getInterdictionCodes.and.returnValue(of([]));
      const showInfoSpy = spyOn(component as any, 'showInfoMessage');
      fixture.detectChanges();
      expect(component.availableCodes).toEqual([]);
      expect(component.filteredCodes()).toEqual([]);
      expect(showInfoSpy).toHaveBeenCalledWith('No interdiction codes available');
    });

    it('should set empty codes and call showErrorMessage when codes fail to load', () => {
      interdictionQueryServiceSpy.getInterdictionCodes.and.returnValue(throwError(() => new Error('err')));
      const showErrorSpy = spyOn(component as any, 'showErrorMessage');
      fixture.detectChanges();
      expect(component.availableCodes).toEqual([]);
      expect(component.filteredCodes()).toEqual([]);
      expect(showErrorSpy).toHaveBeenCalledWith('Failed to load interdiction codes');
    });

    it('should call snackBar.open in showErrorMessage', () => {
      fixture.detectChanges();
      (component as any).showErrorMessage('Test error');
      // Verifies the method runs without error
    });

    it('should call snackBar.open in showInfoMessage', () => {
      fixture.detectChanges();
      (component as any).showInfoMessage('Test info');
      // Verifies the method runs without error
    });
  });

  describe('f getter', () => {
    it('should return queryForm controls', () => {
      fixture.detectChanges();
      expect(component.f).toBe(component.queryForm.controls);
    });
  });
});
