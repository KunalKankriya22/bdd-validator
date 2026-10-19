import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, of, throwError } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PrepareDonorNotification } from './prepare-donor-notification';
import { PrepareDonorNotificationService } from './services/donor-notification.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  DonorNotificationSearchResult,
  DonorDetailsDto,
  SearchType,
  LovCodeDto
} from './models/donor-notification.model';
import { MarkNoLetterDialogResult } from '@shared/components/mark-no-letter-dialog/mark-no-letter-dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { AuthorizeNotificationLetterDialog } from '@shared/components/authorize-notification-letter-dialog/authorize-notification-letter-dialog';
import { NotificationLogDialogComponent } from '@shared/components/notification-log-dialog/notification-log-dialog';
import moment from 'moment';

describe('PrepareDonorNotification', () => {
  let component: PrepareDonorNotification;
  let fixture: ComponentFixture<PrepareDonorNotification>;
  let serviceSpy: jasmine.SpyObj<PrepareDonorNotificationService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterChangedSubject: Subject<void>;

  const mockDonor: DonorNotificationSearchResult = {
    donorId: 'DN00017648',
    donorName: 'ROGERS, ALLESIA',
    lastDonationType: 'AL',
    lastProcCode: 'PP',
    lastUnitId: 'W633324041051',
    lastDonationDate: '2025-01-11',
    interCode: 'HBCX',
    interEffDate: '2025-02-11',
    unitId: 'W633324041051',
    letterSeqNo: null,
    letterId: '18.03',
    notificationStatus: null,
    chapterId: '0001',
    otherInterdictionCount: 0
  };

  const mockResults: DonorNotificationSearchResult[] = [mockDonor];

  const mockDonorWithMultipleInterdictions: DonorNotificationSearchResult = {
    ...mockDonor,
    donorId: 'DN00056789',
    unitId: 'UNIT123',
    otherInterdictionCount: 2
  };

  const mockDonorWithStatus: DonorNotificationSearchResult = {
    ...mockDonor,
    notificationStatus: 'AUTNO'
  };

  const mockSearchResponse = {
    data: [mockDonor],
    total: 1
  };

  const mockMultiPageResponse = {
    data: [mockDonor, { ...mockDonor, donorId: 'DN00017649', donorName: 'SMITH, JOHN' }],
    total: 50
  };

  const mockDonorDetails: DonorDetailsDto = {
    donorId: 'DN00017648',
    workPhone: '555-123-4567',
    homePhone: '555-987-6543',
    mobilePhone: '555-456-7890',
    address: '123 Main St, Anytown, ST 12345',
    preferredContactFlag: 'H'
  };

  const mockLovCodes: LovCodeDto[] = [
    { code: 'HBCX', description: 'Hepatitis B Confirmed' },
    { code: 'HCVC', description: 'Hepatitis C Confirmed' },
    { code: 'HTLV', description: 'HTLV Positive' },
    { code: 'HIV1', description: 'HIV-1 Positive' }
  ];

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('PrepareDonorNotificationService', [
      'searchDonors',
      'getDonorDetails',
      'getCodeDescription',
      'markNoLetter',
      'getLovLimit',
      'getLovCodes',
      'checkUnitExists'
    ]);

    serviceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
    serviceSpy.getLovLimit.and.returnValue(of(100));
    serviceSpy.getCodeDescription.and.returnValue(of('Test Description'));
    serviceSpy.markNoLetter.and.returnValue(of({ success: true, statusCode: 200, message: 'Marked for no letter successfully.' }));
    serviceSpy.getLovCodes.and.returnValue(of([]));
    serviceSpy.getDonorDetails.and.returnValue(of(mockDonorDetails));
    serviceSpy.checkUnitExists.and.returnValue(of(true));

    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    chapterChangedSubject = new Subject<void>();

    await TestBed.configureTestingModule({
      imports: [PrepareDonorNotification, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PrepareDonorNotificationService, useValue: serviceSpy },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable(), chapterTimeZone: () => 'UTC' } },
        { provide: PageHeaderService, useValue: { pageHeaderData: () => null, getTitle: () => '', getSubtitle: () => '' } },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).overrideComponent(PrepareDonorNotification, {
      add: { providers: [
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ] }
    }).compileComponents();

    fixture = TestBed.createComponent(PrepareDonorNotification);
    component = fixture.componentInstance;
    dialog = fixture.debugElement.injector.get(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = fixture.debugElement.injector.get(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture.detectChanges();
  });

  it('should initialize with Pending search type', () => {
    expect(component.searchForm.get('searchType')?.value).toBe('Pending');
  });



  it('should format dates to DD-MMM-YYYY uppercase', () => {
    expect(component.formatDate('2025-01-15')).toBe('15-JAN-2025');
  });


  it('should disable retrieve when loading', () => {
    component.isLoading = true;
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  // --- hasLov getter ---
  it('should return true for hasLov when searchType is InterCD', () => {
    component.searchForm.get('searchType')!.setValue('InterCD', { emitEvent: false });
    expect(component.hasLov).toBeTrue();
  });

  it('should return true for hasLov when searchType is LetterID', () => {
    component.searchForm.get('searchType')!.setValue('LetterID', { emitEvent: false });
    expect(component.hasLov).toBeTrue();
  });

  it('should return true for hasLov when searchType is Reinst', () => {
    component.searchForm.get('searchType')!.setValue('Reinst', { emitEvent: false });
    expect(component.hasLov).toBeTrue();
  });

  it('should return false for hasLov when searchType is Pending', () => {
    component.searchForm.get('searchType')!.setValue('Pending', { emitEvent: false });
    expect(component.hasLov).toBeFalse();
  });

  it('should return false for hasLov when searchType is DonorID', () => {
    component.searchForm.get('searchType')!.setValue('DonorID', { emitEvent: false });
    expect(component.hasLov).toBeFalse();
  });

  // --- selectedSearchOption getter ---
  it('should return selectedSearchOption matching the current searchType', () => {
    component.searchForm.get('searchType')!.setValue('DonorID', { emitEvent: false });
    const option = component.selectedSearchOption;
    expect(option).toBeDefined();
    expect(option!.value).toBe('DonorID');
    expect(option!.label).toBe('By Donor ID');
  });

  // --- f getter ---
  it('should return form controls via f getter', () => {
    expect(component.f).toBe(component.searchForm.controls);
  });

  // --- isRetrieveDisabled branches ---
  it('should disable retrieve when codeValidating', () => {
    component.codeValidating = true;
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should disable retrieve when form is invalid', () => {
    component.searchForm.get('searchType')!.setValue('InterCD', { emitEvent: false });
    component.searchForm.get('code')!.setValidators([() => ({ required: true })]);
    component.searchForm.get('code')!.setValue('', { emitEvent: false });
    component.searchForm.get('code')!.updateValueAndValidity({ emitEvent: false });
    component.isLoading = false;
    component.codeValidating = false;
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should disable retrieve when searchType requires code but not validated', () => {
    component.searchForm.get('searchType')!.setValue('DonorID', { emitEvent: false });
    component.searchForm.get('code')!.enable({ emitEvent: false });
    component.searchForm.get('code')!.setValue('SOMEDONOR', { emitEvent: false });
    component.searchForm.get('code')!.clearValidators();
    component.searchForm.get('code')!.updateValueAndValidity({ emitEvent: false });
    component.isLoading = false;
    component.codeValidating = false;
    component.codeValidated = false;
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should enable retrieve when code is validated for requiresCode type', () => {
    component.searchForm.get('searchType')!.setValue('DonorID', { emitEvent: false });
    component.searchForm.get('code')!.enable({ emitEvent: false });
    component.searchForm.get('code')!.setValue('SOMEDONOR', { emitEvent: false });
    component.searchForm.get('code')!.clearValidators();
    component.searchForm.get('code')!.updateValueAndValidity({ emitEvent: false });
    component.isLoading = false;
    component.codeValidating = false;
    component.codeValidated = true;
    expect(component.isRetrieveDisabled).toBeFalse();
  });

  it('should disable retrieve when startDate has errors', () => {
    const startCtrl = component.searchForm.get('startDate')!;
    startCtrl.setErrors({ matDatepickerParse: true });
    component.isLoading = false;
    component.codeValidating = false;
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should disable retrieve when endDate has errors', () => {
    const endCtrl = component.searchForm.get('endDate')!;
    endCtrl.setErrors({ invalidDateFormat: true });
    component.isLoading = false;
    component.codeValidating = false;
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  // --- formatDate edge cases ---
  it('should return dash when formatDate receives empty string', () => {
    expect(component.formatDate('')).toBe('-');
  });

  it('should return dash when formatDate receives null-like value', () => {
    expect(component.formatDate(null as any)).toBe('-');
  });

  it('should return original value for invalid date', () => {
    expect(component.formatDate('not-a-date')).toBe('not-a-date');
  });

  // --- getStartDateError ---
  it('should return empty string for getStartDateError when ctrl not touched', () => {
    expect(component['getStartDateError']()).toBe('');
  });

  it('should return required error for startDate', () => {
    const ctrl = component.searchForm.get('startDate')!;
    ctrl.setErrors({ required: true });
    ctrl.markAsTouched();
    expect(component['getStartDateError']()).toBe('Effective Date From is required');
  });

  it('should return parse error for startDate', () => {
    const ctrl = component.searchForm.get('startDate')!;
    ctrl.setErrors({ matDatepickerParse: true });
    ctrl.markAsTouched();
    expect(component['getStartDateError']()).toBe('Effective Date From is invalid');
  });

  it('should return invalid format error for startDate', () => {
    const ctrl = component.searchForm.get('startDate')!;
    ctrl.setErrors({ invalidDateFormat: true });
    ctrl.markAsTouched();
    expect(component['getStartDateError']()).toBe('Effective Date From is invalid');
  });

  it('should return invalidDate error for startDate', () => {
    const ctrl = component.searchForm.get('startDate')!;
    ctrl.setErrors({ invalidDate: true });
    ctrl.markAsTouched();
    expect(component['getStartDateError']()).toBe('Effective Date From is invalid');
  });

  it('should return future date error for startDate', () => {
    const ctrl = component.searchForm.get('startDate')!;
    ctrl.setErrors({ matDatepickerMax: { max: moment(), actual: moment() } });
    ctrl.markAsTouched();
    expect(component['getStartDateError']()).toBe('Effective Date From cannot be a future date');
  });

  it('should return dateRangeInvalid error for startDate when lastChangedDateField is start', () => {
    component['lastChangedDateField'] = 'start';
    const ctrl = component.searchForm.get('startDate')!;
    ctrl.markAsTouched();
    ctrl.setErrors(null);
    component.searchForm.setErrors({ dateRangeInvalid: true });
    expect(component['getStartDateError']()).toBe('Effective Date From must be less than or equal to Effective Date To');
  });

  // --- getEndDateError ---
  it('should return empty string for getEndDateError when ctrl not touched', () => {
    expect(component['getEndDateError']()).toBe('');
  });

  it('should return required error for endDate', () => {
    const ctrl = component.searchForm.get('endDate')!;
    ctrl.setErrors({ required: true });
    ctrl.markAsTouched();
    expect(component['getEndDateError']()).toBe('Effective Date To is required');
  });

  it('should return parse error for endDate', () => {
    const ctrl = component.searchForm.get('endDate')!;
    ctrl.setErrors({ matDatepickerParse: true });
    ctrl.markAsTouched();
    expect(component['getEndDateError']()).toBe('Effective Date To is invalid');
  });

  it('should return invalidDateFormat error for endDate', () => {
    const ctrl = component.searchForm.get('endDate')!;
    ctrl.setErrors({ invalidDateFormat: true });
    ctrl.markAsTouched();
    expect(component['getEndDateError']()).toBe('Effective Date To is invalid');
  });

  it('should return invalidDate error for endDate', () => {
    const ctrl = component.searchForm.get('endDate')!;
    ctrl.setErrors({ invalidDate: true });
    ctrl.markAsTouched();
    expect(component['getEndDateError']()).toBe('Effective Date To is invalid');
  });

  it('should return future date error for endDate', () => {
    const ctrl = component.searchForm.get('endDate')!;
    ctrl.setErrors({ matDatepickerMax: true });
    ctrl.markAsTouched();
    expect(component['getEndDateError']()).toBe('Effective Date To cannot be a future date');
  });

  it('should return matDatepickerMin error for endDate', () => {
    const ctrl = component.searchForm.get('endDate')!;
    ctrl.setErrors({ matDatepickerMin: true });
    ctrl.markAsTouched();
    expect(component['getEndDateError']()).toBe('Effective Date To must be greater than or equal to Effective Date From');
  });

  it('should return dateRangeInvalid error for endDate when lastChangedDateField is end', () => {
    component['lastChangedDateField'] = 'end';
    const ctrl = component.searchForm.get('endDate')!;
    ctrl.markAsTouched();
    ctrl.setErrors(null);
    component.searchForm.setErrors({ dateRangeInvalid: true });
    expect(component['getEndDateError']()).toBe('Effective Date To must be greater than or equal to Effective Date From');
  });

  // --- onUnitValidated / onUnitCleared ---
  it('should set codeValidated on onUnitValidated', () => {
    component.onUnitValidated({ parsedUnitId: 'UNIT123' } as any);
    expect(component.codeValidated).toBeTrue();
    expect(component.lastValidatedCode).toBe('UNIT123');
  });

  it('should clear codeValidated on onUnitCleared', () => {
    component.codeValidated = true;
    component.lastValidatedCode = 'UNIT123';
    component.onUnitCleared();
    expect(component.codeValidated).toBeFalse();
    expect(component.lastValidatedCode).toBe('');
  });

  // --- onLovCodeSelected ---
  it('should set codeDescription when lov code is found', () => {
    component.lovCodes.set([{ code: 'ABC', description: 'Test Description' }]);
    component.onLovCodeSelected('ABC');
    expect(component.codeDescription).toBe('Test Description');
    expect(component.codeValidated).toBeTrue();
    expect(component.lastValidatedCode).toBe('ABC');
  });

  it('should not change codeDescription when lov code is not found', () => {
    component.lovCodes.set([{ code: 'ABC', description: 'Test Description' }]);
    component.codeDescription = '';
    component.onLovCodeSelected('XYZ');
    expect(component.codeDescription).toBe('');
  });

  // --- onCodeBlur ---
  it('should clear code description when code is empty on blur', () => {
    component.searchForm.get('searchType')!.setValue('DonorID', { emitEvent: false });
    component.searchForm.get('code')!.enable({ emitEvent: false });
    component.searchForm.get('code')!.setValue('', { emitEvent: false });
    component.codeDescription = 'old desc';
    component.onCodeBlur();
    expect(component.codeDescription).toBe('');
    expect(component.codeValidated).toBeFalse();
  });

  it('should skip validation when code equals lastValidatedCode', () => {
    component.searchForm.get('searchType')!.setValue('DonorID', { emitEvent: false });
    component.searchForm.get('code')!.enable({ emitEvent: false });
    component.searchForm.get('code')!.setValue('DN001', { emitEvent: false });
    component.lastValidatedCode = 'DN001';
    component.onCodeBlur();
    expect(serviceSpy.getCodeDescription).not.toHaveBeenCalled();
  });

  it('should skip validation when searchType is UnitID', () => {
    component.searchForm.get('searchType')!.setValue('UnitID', { emitEvent: false });
    component.searchForm.get('code')!.enable({ emitEvent: false });
    component.searchForm.get('code')!.setValue('UNIT1', { emitEvent: false });
    component.lastValidatedCode = '';
    component.onCodeBlur();
    expect(serviceSpy.getCodeDescription).not.toHaveBeenCalled();
  });

  it('should validate code successfully on blur', () => {
    serviceSpy.getCodeDescription.and.returnValue(of('Test Donor Name'));
    component.searchForm.get('searchType')!.setValue('DonorID', { emitEvent: false });
    component.searchForm.get('code')!.enable({ emitEvent: false });
    component.searchForm.get('code')!.setValue('DN002', { emitEvent: false });
    component.lastValidatedCode = '';
    component.onCodeBlur();
    expect(component.codeValidating).toBeFalse();
    expect(component.codeDescription).toBe('Test Donor Name');
    expect(component.codeValidated).toBeTrue();
    expect(component.lastValidatedCode).toBe('DN002');
  });

  it('should handle code validation error on blur', () => {
    serviceSpy.getCodeDescription.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));
    const snackSpy = spyOn(component['snackBar'], 'open');
    component.searchForm.get('searchType')!.setValue('DonorID', { emitEvent: false });
    component.searchForm.get('code')!.enable({ emitEvent: false });
    component.searchForm.get('code')!.setValue('INVALID', { emitEvent: false });
    component.lastValidatedCode = '';
    component.onCodeBlur();
    expect(component.codeValidating).toBeFalse();
    expect(component.codeValidated).toBeFalse();
    expect(snackSpy).toHaveBeenCalled();
  });

  it('should handle code validation error with errorResponse on blur', () => {
    serviceSpy.getCodeDescription.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Server error' } } })));
    const snackSpy = spyOn(component['snackBar'], 'open');
    component.searchForm.get('searchType')!.setValue('InterCD', { emitEvent: false });
    component.searchForm.get('code')!.enable({ emitEvent: false });
    component.searchForm.get('code')!.setValue('ERR', { emitEvent: false });
    component.lastValidatedCode = '';
    component.onCodeBlur();
    expect(snackSpy).toHaveBeenCalledWith('Server error', 'Close', jasmine.any(Object));
  });

  it('should handle code validation error with no specific message', () => {
    serviceSpy.getCodeDescription.and.returnValue(throwError(() => ({ error: {} })));
    const snackSpy = spyOn(component['snackBar'], 'open');
    component.searchForm.get('searchType')!.setValue('DonorID', { emitEvent: false });
    component.searchForm.get('code')!.enable({ emitEvent: false });
    component.searchForm.get('code')!.setValue('ERR2', { emitEvent: false });
    component.lastValidatedCode = '';
    component.onCodeBlur();
    expect(snackSpy).toHaveBeenCalledWith('Invalid code. No matching record found.', 'Close', jasmine.any(Object));
  });

  // --- loadLovCodes ---
  it('should load lov codes on search type change to InterCD', () => {
    serviceSpy.getLovCodes.and.returnValue(of([{ code: 'A', description: 'Desc A' }]));
    component.searchForm.get('searchType')!.setValue('InterCD');
    expect(serviceSpy.getLovCodes).toHaveBeenCalledWith('InterCD');
    expect(component.lovCodes().length).toBe(1);
  });

  it('should handle error when loading lov codes', () => {
    serviceSpy.getLovCodes.and.returnValue(throwError(() => new Error('fail')));
    component.searchForm.get('searchType')!.setValue('LetterID');
    expect(component.lovCodes().length).toBe(0);
  });

  // --- filteredLovCodes computed ---
  it('should filter lov codes by search term', () => {
    component.lovCodes.set([
      { code: 'ABC', description: 'Alpha' },
      { code: 'DEF', description: 'Beta' }
    ]);
    component.lovSearch.set('alpha');
    expect(component.filteredLovCodes().length).toBe(1);
    expect(component.filteredLovCodes()[0].code).toBe('ABC');
  });

  it('should return all lov codes when search is empty', () => {
    component.lovCodes.set([
      { code: 'ABC', description: 'Alpha' },
      { code: 'DEF', description: 'Beta' }
    ]);
    component.lovSearch.set('');
    expect(component.filteredLovCodes().length).toBe(2);
  });

  // --- onRetrieve ---
  it('should show error and mark form touched when form is invalid on retrieve', () => {
    const snackSpy = spyOn(component['snackBar'], 'open');
    component.searchForm.get('searchType')!.setValue('InterCD', { emitEvent: false });
    component.searchForm.get('code')!.enable({ emitEvent: false });
    component.searchForm.get('code')!.setValue('', { emitEvent: false });
    component.searchForm.get('code')!.setValidators([() => ({ required: true })]);
    component.searchForm.get('code')!.updateValueAndValidity({ emitEvent: false });
    component.onRetrieve();
    expect(snackSpy).toHaveBeenCalledWith('Please fill in all required fields', 'Close', jasmine.any(Object));
  });

  it('should abort retrieve when date has errors', () => {
    component.searchForm.get('startDate')!.setErrors({ matDatepickerParse: true });
    serviceSpy.searchDonors.calls.reset();
    component.onRetrieve();
    expect(serviceSpy.searchDonors).not.toHaveBeenCalled();
  });

  it('should auto-fill dates when non-DonorID/UnitID type has no dates', () => {
    component.searchForm.get('searchType')!.setValue('Pending', { emitEvent: false });
    component.searchForm.get('startDate')!.setValue(null, { emitEvent: false });
    component.searchForm.get('endDate')!.setValue(null, { emitEvent: false });
    component.searchForm.get('startDate')!.setErrors(null);
    component.searchForm.get('endDate')!.setErrors(null);
    serviceSpy.searchDonors.calls.reset();
    component.onRetrieve();
    expect(component.searchForm.get('startDate')!.value).not.toBeNull();
    expect(component.searchForm.get('endDate')!.value).not.toBeNull();
    expect(serviceSpy.searchDonors).toHaveBeenCalled();
  });

  it('should abort retrieve when dateRangeInvalid error exists', () => {
    component.searchForm.get('startDate')!.setValue(moment('2025-02-01'), { emitEvent: false });
    component.searchForm.get('endDate')!.setValue(moment('2025-01-01'), { emitEvent: false });
    component.searchForm.get('startDate')!.setErrors(null);
    component.searchForm.get('endDate')!.setErrors(null);
    component.searchForm.setErrors({ dateRangeInvalid: true });
    serviceSpy.searchDonors.calls.reset();
    component.onRetrieve();
    expect(serviceSpy.searchDonors).not.toHaveBeenCalled();
  });

  it('should load data successfully on retrieve', () => {
    serviceSpy.searchDonors.and.returnValue(of({ data: mockResults, total: 1 }));
    component.searchForm.get('searchType')!.setValue('Pending', { emitEvent: false });
    component.searchForm.get('startDate')!.setValue(moment('2025-01-01'), { emitEvent: false });
    component.searchForm.get('endDate')!.setValue(moment('2025-01-31'), { emitEvent: false });
    component.searchForm.get('startDate')!.setErrors(null);
    component.searchForm.get('endDate')!.setErrors(null);
    component.searchForm.setErrors(null);
    component.onRetrieve();
    expect(component.dataSource.length).toBe(1);
    expect(component.hasSearched).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });

  it('should handle loadData error', () => {
    serviceSpy.searchDonors.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Search failed' } } })));
    const snackSpy = spyOn(component['snackBar'], 'open');
    component.searchForm.get('searchType')!.setValue('Pending', { emitEvent: false });
    component.searchForm.get('startDate')!.setValue(moment('2025-01-01'), { emitEvent: false });
    component.searchForm.get('endDate')!.setValue(moment('2025-01-31'), { emitEvent: false });
    component.searchForm.get('startDate')!.setErrors(null);
    component.searchForm.get('endDate')!.setErrors(null);
    component.searchForm.setErrors(null);
    component.onRetrieve();
    expect(component.isLoading).toBeFalse();
    expect(snackSpy).toHaveBeenCalledWith('Search failed', 'Close', jasmine.any(Object));
  });

  it('should handle loadData error with fallback message', () => {
    serviceSpy.searchDonors.and.returnValue(throwError(() => ({ error: {} })));
    const snackSpy = spyOn(component['snackBar'], 'open');
    component.searchForm.get('searchType')!.setValue('Pending', { emitEvent: false });
    component.searchForm.get('startDate')!.setValue(moment('2025-01-01'), { emitEvent: false });
    component.searchForm.get('endDate')!.setValue(moment('2025-01-31'), { emitEvent: false });
    component.searchForm.get('startDate')!.setErrors(null);
    component.searchForm.get('endDate')!.setErrors(null);
    component.searchForm.setErrors(null);
    component.onRetrieve();
    expect(snackSpy).toHaveBeenCalledWith('Failed to load donor notifications', 'Close', jasmine.any(Object));
  });

  // --- onPageChange ---
  it('should update pagination and reload data on page change', () => {
    serviceSpy.searchDonors.calls.reset();
    component.onPageChange({ pageIndex: 2, pageSize: 10 });
    expect(serviceSpy.searchDonors).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
  });

  // --- onSortChange ---
  it('should set sort column and order for ascending', () => {
    serviceSpy.searchDonors.calls.reset();
    component.onSortChange({ column: 'donorName', direction: 'A' });
    expect(component.currentSortColumn).toBe('DonorName');
    expect(component.currentSortOrder).toBe('ASC');
    expect(serviceSpy.searchDonors).toHaveBeenCalled();
  });

  it('should set sort column and order for descending', () => {
    serviceSpy.searchDonors.calls.reset();
    component.onSortChange({ column: 'interCode', direction: 'D' });
    expect(component.currentSortColumn).toBe('InterCode');
    expect(component.currentSortOrder).toBe('DESC');
  });

  it('should clear sort column for default direction', () => {
    component.onSortChange({ column: 'donorName', direction: 'default' });
    expect(component.currentSortColumn).toBeNull();
    expect(component.currentSortOrder).toBeNull();
  });

  it('should use null for unknown sort column', () => {
    component.onSortChange({ column: 'unknownCol', direction: 'A' });
    expect(component.currentSortColumn).toBeNull();
  });

  // --- onRowAction ---
  it('should call sendLetter on send-letter action', () => {
    const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);
    component.onRowAction({ action: 'send-letter', row: mockResults[0] });
    expect(dialogSpy).toHaveBeenCalled();
  });

  it('should call markNoLetter on mark-no-letter action', () => {
    const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);
    component.onRowAction({ action: 'mark-no-letter', row: mockResults[0] });
    expect(dialogSpy).toHaveBeenCalled();
  });

  it('should open communication log dialog on communication-log action', () => {
    const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);
    component.onRowAction({ action: 'communication-log', row: mockResults[0] });
    expect(dialogSpy).toHaveBeenCalled();
  });

  it('should open side panel for interdictions action', () => {
    component.onRowAction({ action: 'interdictions', row: mockResults[0] });
    expect(component.sidePanelOpen()).toBeTrue();
    expect(component.currentSection()).toBe('interdictions');
    expect(component.currentCheckDonorId()).toBe('DN00017648');
  });

  it('should open side panel for test-results action', () => {
    component.onRowAction({ action: 'test-results', row: mockResults[0] });
    expect(component.sidePanelOpen()).toBeTrue();
    expect(component.currentSection()).toBe('test-results');
  });

  it('should open side panel for attributes action', () => {
    component.onRowAction({ action: 'attributes', row: mockResults[0] });
    expect(component.sidePanelOpen()).toBeTrue();
    expect(component.currentSection()).toBe('attributes');
  });

  it('should open side panel for demographics action', () => {
    component.onRowAction({ action: 'demographics', row: mockResults[0] });
    expect(component.sidePanelOpen()).toBeTrue();
    expect(component.currentSection()).toBe('demographics');
  });

  // --- onRowClick ---
  it('should handle onRowClick without error', () => {
    expect(() => component.onRowClick(mockResults[0])).not.toThrow();
  });

  // --- onPanelClose ---
  it('should close side panel and reset signals', () => {
    component.sidePanelOpen.set(true);
    component.currentCheckDonorId.set('DN001');
    component.currentCheckDonorName.set('Test');
    component.currentSection.set('interdictions');
    component.onPanelClose();
    expect(component.sidePanelOpen()).toBeFalse();
    expect(component.currentCheckDonorId()).toBe('');
    expect(component.currentCheckDonorName()).toBe('');
    expect(component.currentSection()).toBeNull();
    expect(component.sidePanelWidth()).toBe('70vw');
  });

  // --- onPanelWidthChange ---
  it('should update sidePanelWidth signal', () => {
    component.onPanelWidthChange('50vw');
    expect(component.sidePanelWidth()).toBe('50vw');
  });

  // --- onClearAll ---
  it('should reset form and clear results on clearAll', () => {
    component.dataSource = mockResults;
    component.hasSearched = true;
    component.codeDescription = 'some desc';
    component.codeValidated = true;
    component.lastValidatedCode = 'code';
    component.onClearAll();
    expect(component.searchForm.get('searchType')!.value).toBe('Pending');
    expect(component.codeDescription).toBe('');
    expect(component.codeValidated).toBeFalse();
    expect(component.lastValidatedCode).toBe('');
    expect(component.dataSource.length).toBe(0);
    expect(component.hasSearched).toBeFalse();
  });

  // --- onRowExpandToggle ---
  it('should expand a row and load details', () => {
    const row = { ...mockResults[0], _rowKey: 'key1' } as any;
    serviceSpy.getDonorDetails.and.returnValue(of({ donorId: 'DN00017648', workPhone: null, homePhone: null, mobilePhone: null, address: null, preferredContactFlag: null }));
    component.onRowExpandToggle(row);
    expect(component.expandedRows.has('key1')).toBeTrue();
    expect(serviceSpy.getDonorDetails).toHaveBeenCalledWith('DN00017648');
  });

  it('should collapse an already expanded row', () => {
    const row = { ...mockResults[0], _rowKey: 'key1' } as any;
    component.expandedRows.add('key1');
    component.onRowExpandToggle(row);
    expect(component.expandedRows.has('key1')).toBeFalse();
  });

  it('should not reload details if already cached', () => {
    const row = { ...mockResults[0], _rowKey: 'key2' } as any;
    component.donorDetailsCache.set('DN00017648', { donorId: 'DN00017648' } as any);
    serviceSpy.getDonorDetails.calls.reset();
    component.onRowExpandToggle(row);
    expect(serviceSpy.getDonorDetails).not.toHaveBeenCalled();
  });

  it('should not reload details if already loading', () => {
    const row = { ...mockResults[0], _rowKey: 'key3' } as any;
    component.donorDetailsLoading.add('DN00017648');
    serviceSpy.getDonorDetails.calls.reset();
    component.onRowExpandToggle(row);
    expect(serviceSpy.getDonorDetails).not.toHaveBeenCalled();
  });

  // --- onExpandAllToggle ---
  it('should expand all rows and load missing details', () => {
    component.dataSource = [{ ...mockResults[0], _rowKey: 'key1' } as any];
    serviceSpy.getDonorDetails.and.returnValue(of({ donorId: 'DN00017648' } as any));
    component.onExpandAllToggle(true);
    expect(component.expandedRows.size).toBe(1);
    expect(serviceSpy.getDonorDetails).toHaveBeenCalled();
  });

  it('should collapse all rows', () => {
    component.expandedRows.add('key1');
    component.onExpandAllToggle(false);
    expect(component.expandedRows.size).toBe(0);
  });

  // --- getDonorDetails / isDonorDetailsLoading ---
  it('should return cached donor details', () => {
    const details: DonorDetailsDto = { donorId: 'D1', workPhone: '123', homePhone: null, mobilePhone: null, address: 'addr', preferredContactFlag: null };
    component.donorDetailsCache.set('D1', details);
    expect(component.getDonorDetails('D1')).toBe(details);
  });

  it('should return undefined for uncached donor', () => {
    expect(component.getDonorDetails('UNKNOWN')).toBeUndefined();
  });

  it('should return true for loading donor', () => {
    component.donorDetailsLoading.add('D1');
    expect(component.isDonorDetailsLoading('D1')).toBeTrue();
  });

  it('should return false for non-loading donor', () => {
    expect(component.isDonorDetailsLoading('D2')).toBeFalse();
  });

  // --- loadDonorDetails error path ---
  it('should handle error when loading donor details', () => {
    serviceSpy.getDonorDetails.and.returnValue(throwError(() => new Error('fail')));
    const row = { ...mockResults[0], _rowKey: 'key_err' } as any;
    component.onRowExpandToggle(row);
    expect(component.donorDetailsLoading.has('DN00017648')).toBeFalse();
  });

  // --- sendLetter dialog ---
  it('should open authorize notification letter dialog and refresh on close', () => {
    const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);
    serviceSpy.searchDonors.calls.reset();
    component.onRowAction({ action: 'send-letter', row: mockResults[0] });
    expect(dialogSpy).toHaveBeenCalled();
    expect(serviceSpy.searchDonors).toHaveBeenCalled();
  });

  // --- markNoLetter dialog with save result ---
  it('should handle markNoLetter dialog save result successfully', () => {
    const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of({ action: 'save', userComment: 'test comment' })
    } as any);
    serviceSpy.markNoLetter.and.returnValue(of({ success: true, statusCode: 200, message: 'Marked successfully' }));
    const snackSpy = spyOn(component['snackBar'], 'open');
    component.onRowAction({ action: 'mark-no-letter', row: mockResults[0] });
    expect(serviceSpy.markNoLetter).toHaveBeenCalled();
    expect(snackSpy).toHaveBeenCalledWith('Marked successfully', 'Close', jasmine.any(Object));
  });

  it('should handle markNoLetter save with no message in response', () => {
    const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of({ action: 'save', userComment: '' })
    } as any);
    serviceSpy.markNoLetter.and.returnValue(of({ success: true, statusCode: 200, message: '' }));
    const snackSpy = spyOn(component['snackBar'], 'open');
    component.onRowAction({ action: 'mark-no-letter', row: mockResults[0] });
    expect(snackSpy).toHaveBeenCalledWith('Marked for no letter successfully. Awaiting supervisor approval.', 'Close', jasmine.any(Object));
  });

  it('should handle markNoLetter save error', () => {
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of({ action: 'save', userComment: 'comment' })
    } as any);
    serviceSpy.markNoLetter.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Save failed' } } })));
    const snackSpy = spyOn(component['snackBar'], 'open');
    component.onRowAction({ action: 'mark-no-letter', row: mockResults[0] });
    expect(snackSpy).toHaveBeenCalledWith('Save failed', 'Close', jasmine.any(Object));
  });

  it('should handle markNoLetter save error with fallback message', () => {
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of({ action: 'save', userComment: '' })
    } as any);
    serviceSpy.markNoLetter.and.returnValue(throwError(() => ({ error: {} })));
    const snackSpy = spyOn(component['snackBar'], 'open');
    component.onRowAction({ action: 'mark-no-letter', row: mockResults[0] });
    expect(snackSpy).toHaveBeenCalledWith('Failed to mark no letter', 'Close', jasmine.any(Object));
  });

  it('should not call markNoLetter service when dialog result is not save', () => {
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of(undefined)
    } as any);
    serviceSpy.markNoLetter.calls.reset();
    component.onRowAction({ action: 'mark-no-letter', row: mockResults[0] });
    expect(serviceSpy.markNoLetter).not.toHaveBeenCalled();
  });

  // --- subscribeToSearchTypeChanges - various types ---
  it('should enable code field and set required when switching to DonorID', () => {
    component.searchForm.get('searchType')!.setValue('DonorID');
    const codeCtrl = component.searchForm.get('code')!;
    expect(codeCtrl.enabled).toBeTrue();
    expect(component.searchForm.get('startDate')!.disabled).toBeTrue();
    expect(component.searchForm.get('endDate')!.disabled).toBeTrue();
    expect(component.searchForm.get('includeNotified')!.enabled).toBeTrue();
  });

  it('should disable code and dates when switching to UnitID', () => {
    component.searchForm.get('searchType')!.setValue('UnitID');
    const codeCtrl = component.searchForm.get('code')!;
    expect(codeCtrl.disabled).toBeTrue();
    expect(component.searchForm.get('startDate')!.disabled).toBeTrue();
    expect(component.searchForm.get('endDate')!.disabled).toBeTrue();
  });

  it('should disable code when switching to Pending', () => {
    component.searchForm.get('searchType')!.setValue('Pending');
    const codeCtrl = component.searchForm.get('code')!;
    expect(codeCtrl.disabled).toBeTrue();
  });

  it('should disable code when switching to All', () => {
    component.searchForm.get('searchType')!.setValue('All');
    const codeCtrl = component.searchForm.get('code')!;
    expect(codeCtrl.disabled).toBeTrue();
  });

  it('should enable exclusive when switching to Reinst', () => {
    serviceSpy.getLovCodes.and.returnValue(of([]));
    component.searchForm.get('searchType')!.setValue('Reinst');
    expect(component.searchForm.get('exclusive')!.enabled).toBeTrue();
  });

  it('should disable exclusive when switching away from Reinst', () => {
    component.searchForm.get('searchType')!.setValue('Pending');
    expect(component.searchForm.get('exclusive')!.disabled).toBeTrue();
  });

  it('should enable includeNotified for InterCD', () => {
    serviceSpy.getLovCodes.and.returnValue(of([]));
    component.searchForm.get('searchType')!.setValue('InterCD');
    expect(component.searchForm.get('includeNotified')!.enabled).toBeTrue();
  });

  it('should enable includeNotified for LetterID', () => {
    serviceSpy.getLovCodes.and.returnValue(of([]));
    component.searchForm.get('searchType')!.setValue('LetterID');
    expect(component.searchForm.get('includeNotified')!.enabled).toBeTrue();
  });

  it('should disable includeNotified for All', () => {
    component.searchForm.get('searchType')!.setValue('All');
    expect(component.searchForm.get('includeNotified')!.disabled).toBeTrue();
  });

  // --- noFutureDateValidator ---
  it('should return null for empty value in noFutureDateValidator', () => {
    const validator = component['noFutureDateValidator']();
    expect(validator({ value: null } as any)).toBeNull();
  });

  it('should return null for invalid date in noFutureDateValidator', () => {
    const validator = component['noFutureDateValidator']();
    expect(validator({ value: 'not-a-date-at-all-xyz' } as any)).toBeNull();
  });

  it('should return null for past date in noFutureDateValidator', () => {
    const validator = component['noFutureDateValidator']();
    expect(validator({ value: moment('2020-01-01') } as any)).toBeNull();
  });

  it('should return error for future date in noFutureDateValidator', () => {
    const validator = component['noFutureDateValidator']();
    const futureDate = moment().add(1, 'year');
    const result = validator({ value: futureDate } as any);
    expect(result).not.toBeNull();
    expect(result!['matDatepickerMax']).toBeDefined();
  });

  // --- onStartDateInput / onEndDateInput ---
  it('should call DateFieldValidationUtility.handleEndDateInput on start date input', () => {
    const event = { target: { value: '01-JAN-2025' } } as any;
    expect(() => component.onStartDateInput(event)).not.toThrow();
  });

  it('should call DateFieldValidationUtility.handleEndDateInput on end date input', () => {
    const event = { target: { value: '31-JAN-2025' } } as any;
    expect(() => component.onEndDateInput(event)).not.toThrow();
  });

  // --- onUnitPostValidate ---
  it('should confirm when unit exists', () => {
    serviceSpy.checkUnitExists.and.returnValue(of(true));
    const confirmSpy = jasmine.createSpy('confirm');
    const rejectSpy = jasmine.createSpy('reject');
    component.onUnitPostValidate({
      data: { parsedUnitId: 'UNIT1' },
      confirm: confirmSpy,
      reject: rejectSpy
    } as any);
    expect(confirmSpy).toHaveBeenCalled();
    expect(rejectSpy).not.toHaveBeenCalled();
  });

  it('should reject when unit does not exist', () => {
    serviceSpy.checkUnitExists.and.returnValue(of(false));
    const confirmSpy = jasmine.createSpy('confirm');
    const rejectSpy = jasmine.createSpy('reject');
    component.onUnitPostValidate({
      data: { parsedUnitId: 'UNIT_BAD' },
      confirm: confirmSpy,
      reject: rejectSpy
    } as any);
    expect(rejectSpy).toHaveBeenCalledWith('Unit ID not found in donations');
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('should reject on checkUnitExists error', () => {
    serviceSpy.checkUnitExists.and.returnValue(throwError(() => new Error('fail')));
    const confirmSpy = jasmine.createSpy('confirm');
    const rejectSpy = jasmine.createSpy('reject');
    component.onUnitPostValidate({
      data: { parsedUnitId: 'UNIT_ERR' },
      confirm: confirmSpy,
      reject: rejectSpy
    } as any);
    expect(rejectSpy).toHaveBeenCalledWith('Failed to verify unit');
  });

  // --- loadData with UnitID searchType ---
  it('should use unitIdField parsedUnitId for UnitID searches', () => {
    component.searchForm.get('searchType')!.setValue('UnitID', { emitEvent: false });
    component.searchForm.get('startDate')!.setValue(null, { emitEvent: false });
    component.searchForm.get('endDate')!.setValue(null, { emitEvent: false });
    component.searchForm.get('startDate')!.disable({ emitEvent: false });
    component.searchForm.get('endDate')!.disable({ emitEvent: false });
    component.searchForm.get('code')!.disable({ emitEvent: false });
    component.searchForm.setErrors(null);
    (component as any).unitIdField = { parsedUnitId: 'PARSED_UNIT', isValid: true, clear: () => {} };
    component.codeValidated = true;
    serviceSpy.searchDonors.calls.reset();
    serviceSpy.searchDonors.and.returnValue(of({ data: [], total: 0 }));
    component.onRetrieve();
    const callArgs = serviceSpy.searchDonors.calls.mostRecent().args;
    expect(callArgs[2].code).toBe('PARSED_UNIT');
  });

  // --- ngOnDestroy ---
  it('should clean up on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // --- valueFormatter in table columns ---
  it('should format lastDonationDate column via valueFormatter', () => {
    const cols = component.tableConfig.columns;
    const dateCol = cols.find(c => c.key === 'lastDonationDate');
    expect(dateCol).toBeDefined();
    if (dateCol?.valueFormatter) {
      expect(dateCol.valueFormatter('2025-03-15')).toBe('15-MAR-2025');
      expect(dateCol.valueFormatter(null)).toBe('-');
      expect(dateCol.valueFormatter(undefined)).toBe('-');
    }
  });

  it('should format interEffDate column via valueFormatter', () => {
    const cols = component.tableConfig.columns;
    const dateCol = cols.find(c => c.key === 'interEffDate');
    expect(dateCol).toBeDefined();
    if (dateCol?.valueFormatter) {
      expect(dateCol.valueFormatter('2025-06-20')).toBe('20-JUN-2025');
    }
  });

  it('should format letterId column via valueFormatter', () => {
    const cols = component.tableConfig.columns;
    const letterCol = cols.find(c => c.key === 'letterId');
    expect(letterCol).toBeDefined();
    if (letterCol?.valueFormatter) {
      expect(letterCol.valueFormatter('18.03')).toBe('18.03');
      expect(letterCol.valueFormatter(null)).toBe('-');
      expect(letterCol.valueFormatter(undefined)).toBe('-');
    }
  });

  // --- rowAction disabled checks ---
  it('should disable send-letter when notificationStatus is set', () => {
    const actions = component.tableConfig.rowActions!;
    const sendAction = actions.find(a => a.action === 'send-letter');
    expect(sendAction).toBeDefined();
    if (sendAction?.disabled) {
      const rowWithStatus = { ...mockResults[0], notificationStatus: 'NOTFY' as any };
      expect(sendAction.disabled(rowWithStatus)).toBeTrue();
    }
  });

  it('should enable send-letter when notificationStatus is null', () => {
    const actions = component.tableConfig.rowActions!;
    const sendAction = actions.find(a => a.action === 'send-letter');
    if (sendAction?.disabled) {
      expect(sendAction.disabled(mockResults[0])).toBeFalse();
    }
  });

  it('should disable mark-no-letter when notificationStatus is set', () => {
    const actions = component.tableConfig.rowActions!;
    const markAction = actions.find(a => a.action === 'mark-no-letter');
    if (markAction?.disabled) {
      const rowWithStatus = { ...mockResults[0], notificationStatus: 'AUTNO' as any };
      expect(markAction.disabled(rowWithStatus)).toBeTrue();
    }
  });

  // --- markNoLetter with unitId on donor ---
  it('should pass unitId in markNoLetter payload when donor has unitId', () => {
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of({ action: 'save', userComment: 'c' })
    } as any);
    serviceSpy.markNoLetter.and.returnValue(of({ success: true, statusCode: 200, message: 'OK' }));
    spyOn(component['snackBar'], 'open');
    const donorWithUnit = { ...mockResults[0], unitId: 'W12345' };
    component.onRowAction({ action: 'mark-no-letter', row: donorWithUnit });
    const payload = serviceSpy.markNoLetter.calls.mostRecent().args[0];
    expect(payload.unitId).toBe('W12345');
  });

  it('should pass null unitId in markNoLetter payload when donor has no unitId', () => {
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of({ action: 'save', userComment: '' })
    } as any);
    serviceSpy.markNoLetter.and.returnValue(of({ success: true, statusCode: 200, message: 'OK' }));
    spyOn(component['snackBar'], 'open');
    const donorNoUnit = { ...mockResults[0], unitId: '' };
    component.onRowAction({ action: 'mark-no-letter', row: donorNoUnit });
    const payload = serviceSpy.markNoLetter.calls.mostRecent().args[0];
    expect(payload.unitId).toBeNull();
  });

  // --- isRetrieveDisabled for UnitID with unitIdField ---
  it('should disable retrieve for UnitID when unitIdField is invalid', () => {
    component.searchForm.get('searchType')!.setValue('UnitID', { emitEvent: false });
    (component as any).unitIdField = { isValid: false, clear: () => {} };
    component.isLoading = false;
    component.codeValidating = false;
    component.searchForm.get('startDate')!.setErrors(null);
    component.searchForm.get('endDate')!.setErrors(null);
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should enable retrieve for UnitID when unitIdField is valid', () => {
    component.searchForm.get('searchType')!.setValue('UnitID', { emitEvent: false });
    component.searchForm.get('code')!.clearValidators();
    component.searchForm.get('code')!.updateValueAndValidity({ emitEvent: false });
    (component as any).unitIdField = { isValid: true, clear: () => {} };
    component.isLoading = false;
    component.codeValidating = false;
    component.searchForm.get('startDate')!.setErrors(null);
    component.searchForm.get('endDate')!.setErrors(null);
    component.searchForm.setErrors(null);
    expect(component.isRetrieveDisabled).toBeFalse();
  });

  // --- hasDateErrors branches ---
  it('should return true for hasDateErrors with invalidDate', () => {
    component.searchForm.get('startDate')!.setErrors({ invalidDate: true });
    expect(component['hasDateErrors']('startDate')).toBeTrue();
  });

  it('should return true for hasDateErrors with matDatepickerMax', () => {
    component.searchForm.get('endDate')!.setErrors({ matDatepickerMax: true });
    expect(component['hasDateErrors']('endDate')).toBeTrue();
  });

  it('should return true for hasDateErrors with matDatepickerMin', () => {
    component.searchForm.get('endDate')!.setErrors({ matDatepickerMin: true });
    expect(component['hasDateErrors']('endDate')).toBeTrue();
  });

  it('should return false for hasDateErrors with no errors', () => {
    component.searchForm.get('startDate')!.setErrors(null);
    expect(component['hasDateErrors']('startDate')).toBeFalse();
  });

  it('should return false for hasDateErrors with non-existent control', () => {
    expect(component['hasDateErrors']('nonExistent')).toBeFalse();
  });

  // ─── COMPONENT INITIALIZATION ────────────────────────────────────

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with Pending search type', () => {
      expect(component.searchForm.get('searchType')?.value).toBe('Pending');
    });

    it('should initialize with empty data source', () => {
      expect(component.dataSource).toEqual([]);
    });

    it('should initialize with hasSearched=false', () => {
      expect(component.hasSearched).toBeFalse();
    });

    it('should initialize with isLoading=false', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('should initialize with default sort column DonorName ASC', () => {
      expect(component.currentSortColumn).toBe('DonorName');
      expect(component.currentSortOrder).toBe('ASC');
    });

    it('should call getLovLimit on init', () => {
      expect(serviceSpy.getLovLimit).toHaveBeenCalled();
    });

    it('should initialize side panel as closed', () => {
      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.sidePanelWidth()).toBe('70vw');
      expect(component.currentSection()).toBeNull();
    });

    it('should initialize table config with pagination', () => {
      expect(component.tableConfig.pagination).toBeDefined();
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should initialize codeValidated as false', () => {
      expect(component.codeValidated).toBeFalse();
    });

    it('should initialize codeDescription as empty', () => {
      expect(component.codeDescription).toBe('');
    });
  });

  // ─── SEARCH TYPE OPTIONS ─────────────────────────────────────────

  describe('Search Type Options', () => {
    it('should have 7 search type options', () => {
      expect(component.searchTypeOptions.length).toBe(7);
    });

    it('should have Pending as first option with requiresCode=false', () => {
      const pending = component.searchTypeOptions[0];
      expect(pending.value).toBe('Pending');
      expect(pending.requiresCode).toBeFalse();
    });

    it('should require code for InterCD, LetterID, DonorID, UnitID, Reinst', () => {
      const codeRequired = component.searchTypeOptions.filter(o => o.requiresCode);
      expect(codeRequired.length).toBe(5);
      expect(codeRequired.map(o => o.value)).toEqual(jasmine.arrayContaining(['InterCD', 'LetterID', 'DonorID', 'UnitID', 'Reinst']));
    });

    it('should not require code for Pending and All', () => {
      const noCode = component.searchTypeOptions.filter(o => !o.requiresCode);
      expect(noCode.map(o => o.value)).toEqual(['Pending', 'All']);
    });
  });

  // ─── SEARCH TYPE CHANGES ─────────────────────────────────────────

  describe('Search Type Changes', () => {
    it('should reset code fields when switching search type', () => {
      component.codeDescription = 'Some description';
      component.codeValidated = true;
      component.lastValidatedCode = 'HBCX';

      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      expect(component.codeDescription).toBe('');
      expect(component.codeValidated).toBeFalse();
      expect(component.lastValidatedCode).toBe('');
    });

    it('should enable code field for DonorID', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();

      expect(component.searchForm.get('code')?.enabled).toBeTrue();
    });

    it('should disable code field for Pending', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();
      component.searchForm.get('searchType')?.setValue('Pending');
      fixture.detectChanges();

      expect(component.searchForm.get('code')?.disabled).toBeTrue();
    });

    it('should disable code field for All', () => {
      component.searchForm.get('searchType')?.setValue('All');
      fixture.detectChanges();

      expect(component.searchForm.get('code')?.disabled).toBeTrue();
    });

    it('should disable code for UnitID (uses separate component)', () => {
      component.searchForm.get('searchType')?.setValue('UnitID');
      fixture.detectChanges();

      expect(component.searchForm.get('code')?.disabled).toBeTrue();
    });

    it('should disable date fields for DonorID', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();

      expect(component.searchForm.get('startDate')?.disabled).toBeTrue();
      expect(component.searchForm.get('endDate')?.disabled).toBeTrue();
    });

    it('should disable date fields for UnitID', () => {
      component.searchForm.get('searchType')?.setValue('UnitID');
      fixture.detectChanges();

      expect(component.searchForm.get('startDate')?.disabled).toBeTrue();
      expect(component.searchForm.get('endDate')?.disabled).toBeTrue();
    });

    it('should enable date fields for InterCD', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      expect(component.searchForm.get('startDate')?.enabled).toBeTrue();
      expect(component.searchForm.get('endDate')?.enabled).toBeTrue();
    });

    it('should enable includeNotified for InterCD', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      expect(component.searchForm.get('includeNotified')?.enabled).toBeTrue();
    });

    it('should enable includeNotified for DonorID', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();

      expect(component.searchForm.get('includeNotified')?.enabled).toBeTrue();
    });

    it('should disable includeNotified for Pending', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();
      component.searchForm.get('searchType')?.setValue('Pending');
      fixture.detectChanges();

      expect(component.searchForm.get('includeNotified')?.disabled).toBeTrue();
    });

    it('should enable exclusive for Reinst', () => {
      component.searchForm.get('searchType')?.setValue('Reinst');
      fixture.detectChanges();

      expect(component.searchForm.get('exclusive')?.enabled).toBeTrue();
    });

    it('should disable exclusive for non-Reinst types', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      expect(component.searchForm.get('exclusive')?.disabled).toBeTrue();
    });

    it('should load LOV codes for InterCD', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      expect(serviceSpy.getLovCodes).toHaveBeenCalledWith('InterCD');
    });

    it('should load LOV codes for LetterID', () => {
      component.searchForm.get('searchType')?.setValue('LetterID');
      fixture.detectChanges();

      expect(serviceSpy.getLovCodes).toHaveBeenCalledWith('LetterID');
    });

    it('should load LOV codes for Reinst', () => {
      component.searchForm.get('searchType')?.setValue('Reinst');
      fixture.detectChanges();

      expect(serviceSpy.getLovCodes).toHaveBeenCalledWith('Reinst');
    });
  });

  // ─── DONOR ID VALIDATORS ─────────────────────────────────────────

  describe('DonorID Validators', () => {
    beforeEach(() => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();
    });

    it('should set required validator for DonorID code field', () => {
      const codeControl = component.searchForm.get('code');
      codeControl?.setValue('');
      codeControl?.markAsTouched();
      expect(codeControl?.hasError('required')).toBe(true);
    });

    it('should set maxLength(10) validator for DonorID code field', () => {
      const codeControl = component.searchForm.get('code');
      codeControl?.setValue('12345678901');
      expect(codeControl?.hasError('maxlength')).toBe(true);
    });

    it('should accept valid numeric DonorID within 10 chars', () => {
      const codeControl = component.searchForm.get('code');
      codeControl?.setValue('12345');
      expect(codeControl?.valid).toBe(true);
    });

    it('should not add DonorID-specific validators for other search types', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      const codeControl = component.searchForm.get('code');
      codeControl?.setValue('LONGCODETHATEXCEEDS10CHARS');
      expect(codeControl?.hasError('maxlength')).toBe(false);
    });
  });

  // ─── DONOR ID ZERO-PADDING ───────────────────────────────────────

  describe('DonorID Zero-Padding', () => {
    it('should zero-pad DonorID in onCodeBlur', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('123');
      component.onCodeBlur();

      expect(serviceSpy.getCodeDescription).toHaveBeenCalledWith('DonorID', 'DN00000123');
    });

    it('should zero-pad DonorID in loadData', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('42');
      component.codeValidated = true;
      component.onRetrieve();
      tick();

      const callArgs = serviceSpy.searchDonors.calls.mostRecent().args;
      expect(callArgs[2].code).toBe('DN00000042');
    }));

    it('should strip non-numeric characters before padding', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('DN123');
      component.onCodeBlur();

      expect(serviceSpy.getCodeDescription).toHaveBeenCalledWith('DonorID', 'DN00000123');
    });

    it('should reject all-non-numeric DonorID input', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('abc');
      component.onCodeBlur();

      expect(component.codeValidated).toBeFalse();
      expect(snackBar.open).toHaveBeenCalled();
      expect(serviceSpy.getCodeDescription).not.toHaveBeenCalled();
    });

    it('should reject special-characters-only DonorID input', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('DN-');
      component.onCodeBlur();

      expect(component.codeValidated).toBeFalse();
      expect(snackBar.open).toHaveBeenCalled();
      expect(serviceSpy.getCodeDescription).not.toHaveBeenCalled();
    });
  });

  // ─── CODE VALIDATION (onCodeBlur) ────────────────────────────────

  describe('Code Validation', () => {
    it('should call getCodeDescription on blur for InterCD', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('HBCX');
      component.onCodeBlur();

      expect(serviceSpy.getCodeDescription).toHaveBeenCalledWith('InterCD', 'HBCX');
    });

    it('should set codeValidated=true on successful validation', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('HBCX');
      component.onCodeBlur();
      tick();

      expect(component.codeValidated).toBeTrue();
      expect(component.codeDescription).toBe('Test Description');
    }));

    it('should show error when getCodeDescription fails', fakeAsync(() => {
      serviceSpy.getCodeDescription.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));

      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('INVALID');
      component.onCodeBlur();
      tick();

      expect(component.codeValidated).toBeFalse();
      expect(component.codeDescription).toBe('');
      expect(snackBar.open).toHaveBeenCalled();
    }));

    it('should not validate when code is empty', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('');
      component.onCodeBlur();

      expect(serviceSpy.getCodeDescription).not.toHaveBeenCalled();
      expect(component.codeValidated).toBeFalse();
    });

    it('should skip validation when code equals lastValidatedCode', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('HBCX');
      component.lastValidatedCode = 'HBCX';
      serviceSpy.getCodeDescription.calls.reset();

      component.onCodeBlur();

      expect(serviceSpy.getCodeDescription).not.toHaveBeenCalled();
    });

    it('should skip validation when searchType is UnitID', () => {
      component.searchForm.get('searchType')?.setValue('UnitID');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('UNIT123');
      serviceSpy.getCodeDescription.calls.reset();

      component.onCodeBlur();

      expect(serviceSpy.getCodeDescription).not.toHaveBeenCalled();
    });

    it('should set codeValidating=true during validation', () => {
      const subject = new Subject<string>();
      serviceSpy.getCodeDescription.and.returnValue(subject.asObservable());

      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();

      component.searchForm.get('code')?.setValue('HBCX');
      component.onCodeBlur();

      expect(component.codeValidating).toBeTrue();

      subject.next('Description');
      subject.complete();

      expect(component.codeValidating).toBeFalse();
    });
  });

  // ─── LOV CODE SELECTION ──────────────────────────────────────────

  describe('LOV Code Selection', () => {
    it('should set description when LOV code selected', () => {
      component.lovCodes.set(mockLovCodes);
      component.onLovCodeSelected('HBCX');

      expect(component.codeDescription).toBe('Hepatitis B Confirmed');
      expect(component.codeValidated).toBeTrue();
      expect(component.lastValidatedCode).toBe('HBCX');
    });

    it('should not update state when LOV code not found', () => {
      component.lovCodes.set(mockLovCodes);
      component.codeValidated = false;
      component.onLovCodeSelected('NONEXISTENT');

      expect(component.codeValidated).toBeFalse();
    });

    it('should filter LOV codes by search text', () => {
      component.lovCodes.set(mockLovCodes);
      component.lovSearch.set('hepat');

      const filtered = component.filteredLovCodes();
      expect(filtered.length).toBe(2);
      expect(filtered[0].code).toBe('HBCX');
      expect(filtered[1].code).toBe('HCVC');
    });

    it('should return all codes when search is empty', () => {
      component.lovCodes.set(mockLovCodes);
      component.lovSearch.set('');

      expect(component.filteredLovCodes().length).toBe(4);
    });

    it('should filter by code or description case-insensitively', () => {
      component.lovCodes.set(mockLovCodes);
      component.lovSearch.set('HIV');

      const filtered = component.filteredLovCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('HIV1');
    });
  });

  // ─── hasLov GETTER ───────────────────────────────────────────────

  describe('hasLov Getter', () => {
    it('should return true for InterCD', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      expect(component.hasLov).toBeTrue();
    });

    it('should return true for LetterID', () => {
      component.searchForm.get('searchType')?.setValue('LetterID');
      expect(component.hasLov).toBeTrue();
    });

    it('should return true for Reinst', () => {
      component.searchForm.get('searchType')?.setValue('Reinst');
      expect(component.hasLov).toBeTrue();
    });

    it('should return false for DonorID', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      expect(component.hasLov).toBeFalse();
    });

    it('should return false for Pending', () => {
      expect(component.hasLov).toBeFalse();
    });
  });

  // ─── DATE VALIDATION ─────────────────────────────────────────────

  describe('Date Validation', () => {
    it('should format dates to DD-MMM-YYYY uppercase', () => {
      expect(component.formatDate('2025-01-15')).toBe('15-JAN-2025');
    });

    it('should return dash for null date', () => {
      expect(component.formatDate(null as any)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should getStartDateError return empty for untouched control', () => {
      expect(component.getStartDateError()).toBe('');
    });

    it('should getEndDateError return empty for untouched control', () => {
      expect(component.getEndDateError()).toBe('');
    });

    it('should getStartDateError return required error', () => {
      const ctrl = component.searchForm.get('startDate');
      ctrl?.setValidators([() => ({ required: true })]);
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      ctrl?.setErrors({ required: true });

      expect(component.getStartDateError()).toBe('Effective Date From is required');
    });

    it('should getEndDateError return required error', () => {
      const ctrl = component.searchForm.get('endDate');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      ctrl?.setErrors({ required: true });

      expect(component.getEndDateError()).toBe('Effective Date To is required');
    });

    it('should getStartDateError return invalid date error', () => {
      const ctrl = component.searchForm.get('startDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ matDatepickerParse: true });

      expect(component.getStartDateError()).toBe('Effective Date From is invalid');
    });

    it('should getEndDateError return invalid date error for invalidDateFormat', () => {
      const ctrl = component.searchForm.get('endDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ invalidDateFormat: true });

      expect(component.getEndDateError()).toBe('Effective Date To is invalid');
    });
  });

  // ─── isRetrieveDisabled GETTER ───────────────────────────────────

  describe('isRetrieveDisabled', () => {
    it('should return true when loading', () => {
      component.isLoading = true;
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should return true when codeValidating', () => {
      component.codeValidating = true;
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should return true when form is invalid', () => {
      component.searchForm.get('searchType')?.setValue(null);
      component.searchForm.get('searchType')?.markAsTouched();
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should return false for Pending type (no code required)', () => {
      component.isLoading = false;
      component.codeValidating = false;
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should return true when code type requires validation and code not validated', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();
      component.searchForm.get('code')?.setValue('HBCX');
      component.codeValidated = false;

      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should return false when code type is validated', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();
      component.searchForm.get('code')?.setValue('HBCX');
      component.codeValidated = true;

      expect(component.isRetrieveDisabled).toBeFalse();
    });
  });

  // ─── RETRIEVE AND SEARCH ─────────────────────────────────────────

  describe('Retrieve and Search', () => {
    it('should show error for invalid form on retrieve', () => {
      component.searchForm.get('searchType')?.setValue(null);
      component.onRetrieve();

      expect(snackBar.open).toHaveBeenCalled();
      expect(serviceSpy.searchDonors).not.toHaveBeenCalled();
    });

    it('should call searchDonors on valid retrieve', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(serviceSpy.searchDonors).toHaveBeenCalled();
    }));

    it('should set isLoading=true during search', () => {
      const subject = new Subject<any>();
      serviceSpy.searchDonors.and.returnValue(subject.asObservable());

      component.onRetrieve();

      expect(component.isLoading).toBeTrue();

      subject.next(mockSearchResponse);
      subject.complete();

      expect(component.isLoading).toBeFalse();
    });

    it('should set hasSearched=true after search', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(component.hasSearched).toBeTrue();
    }));

    it('should populate dataSource from response', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].donorId).toBe('DN00017648');
    }));

    it('should add _rowKey to each row', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect((component.dataSource[0] as any)._rowKey).toBeDefined();
    }));

    it('should update totalRecords from response', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(component.tableConfig.pagination!.totalRecords).toBe(1);
    }));

    it('should show error when search fails', fakeAsync(() => {
      serviceSpy.searchDonors.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'DB error' } } })));

      component.onRetrieve();
      tick();

      expect(snackBar.open).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    }));

    it('should auto-fill dates when none provided for non-DonorID/UnitID', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('Pending');
      component.searchForm.get('startDate')?.setValue(null);
      component.searchForm.get('endDate')?.setValue(null);

      component.onRetrieve();
      tick();

      expect(component.searchForm.get('startDate')?.value).toBeTruthy();
      expect(component.searchForm.get('endDate')?.value).toBeTruthy();
    }));

    it('should clear expanded rows and caches on search', fakeAsync(() => {
      component.expandedRows.add('someKey');
      component.donorDetailsCache.set('D001', mockDonorDetails);

      component.onRetrieve();
      tick();

      expect(component.expandedRows.size).toBe(0);
      expect(component.donorDetailsCache.size).toBe(0);
    }));

    it('should pass sort parameters in search request', fakeAsync(() => {
      component.currentSortColumn = 'InterCode';
      component.currentSortOrder = 'DESC';
      component.onRetrieve();
      tick();

      const callArgs = serviceSpy.searchDonors.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('InterCode');
      expect(callArgs[2].sortOrder).toBe('DESC');
    }));

    it('should pass includeNotified=N by default', fakeAsync(() => {
      component.onRetrieve();
      tick();

      const callArgs = serviceSpy.searchDonors.calls.mostRecent().args;
      expect(callArgs[2].includeNotified).toBe('N');
    }));
  });

  // ─── PAGINATION ──────────────────────────────────────────────────

  describe('Pagination', () => {
    it('should update page index and size on page change', fakeAsync(() => {
      component.onPageChange({ pageIndex: 2, pageSize: 50 } as any);
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
    }));

    it('should calculate correct skip on page change', fakeAsync(() => {
      component.onPageChange({ pageIndex: 2, pageSize: 25 } as any);
      tick();

      const callArgs = serviceSpy.searchDonors.calls.mostRecent().args;
      expect(callArgs[1]).toBe(50);
    }));

    it('should pass correct take on page change', fakeAsync(() => {
      component.onPageChange({ pageIndex: 0, pageSize: 100 } as any);
      tick();

      const callArgs = serviceSpy.searchDonors.calls.mostRecent().args;
      expect(callArgs[0]).toBe(100);
    }));
  });

  // ─── SORTING ─────────────────────────────────────────────────────

  describe('Sorting', () => {
    it('should map donorName column to DonorName', fakeAsync(() => {
      component.onSortChange({ column: 'donorName', direction: 'A' } as any);
      tick();

      expect(component.currentSortColumn).toBe('DonorName');
      expect(component.currentSortOrder).toBe('ASC');
    }));

    it('should map interCode column to InterCode', fakeAsync(() => {
      component.onSortChange({ column: 'interCode', direction: 'D' } as any);
      tick();

      expect(component.currentSortColumn).toBe('InterCode');
      expect(component.currentSortOrder).toBe('DESC');
    }));

    it('should set null sort for default direction', fakeAsync(() => {
      component.onSortChange({ column: 'donorName', direction: 'default' } as any);
      tick();

      expect(component.currentSortColumn).toBeNull();
      expect(component.currentSortOrder).toBeNull();
    }));

    it('should reset to page 0 on sort change', fakeAsync(() => {
      component.onSortChange({ column: 'donorName', direction: 'A' } as any);
      tick();

      const callArgs = serviceSpy.searchDonors.calls.mostRecent().args;
      expect(callArgs[1]).toBe(0);
    }));
  });

  // ─── ROW ACTIONS DISPATCH ────────────────────────────────────────

  describe('Row Actions', () => {
    it('should dispatch send-letter action', () => {
      const dialogSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as MatDialogRef<any>);

      component.onRowAction({ action: 'send-letter', row: mockDonor as any });

      expect(dialog.open).toHaveBeenCalled();
      const dialogComponent = dialog.open.calls.mostRecent().args[0];
      expect(dialogComponent).toBe(AuthorizeNotificationLetterDialog);
    });

    it('should dispatch communication-log action', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as MatDialogRef<any>);

      component.onRowAction({ action: 'communication-log', row: mockDonor as any });

      expect(dialog.open).toHaveBeenCalled();
      const dialogComponent = dialog.open.calls.mostRecent().args[0];
      expect(dialogComponent).toBe(NotificationLogDialogComponent);
    });

    it('should dispatch interdictions action to side panel', () => {
      component.onRowAction({ action: 'interdictions', row: mockDonor as any });

      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentSection()).toBe('interdictions');
      expect(component.currentCheckDonorId()).toBe('DN00017648');
    });

    it('should dispatch test-results action to side panel', () => {
      component.onRowAction({ action: 'test-results', row: mockDonor as any });

      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentSection()).toBe('test-results');
    });

    it('should dispatch attributes action to side panel', () => {
      component.onRowAction({ action: 'attributes', row: mockDonor as any });

      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentSection()).toBe('attributes');
    });

    it('should dispatch demographics action to side panel', () => {
      component.onRowAction({ action: 'demographics', row: mockDonor as any });

      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentSection()).toBe('demographics');
    });

    it('should configure Send Letter as disabled when notificationStatus is set', () => {
      const sendLetterAction = component.tableConfig.rowActions!.find((a: any) => a.action === 'send-letter');
      expect(sendLetterAction?.disabled!(mockDonorWithStatus)).toBeTrue();
      expect(sendLetterAction?.disabled!(mockDonor)).toBeFalse();
    });

    it('should configure Mark No Letter as disabled when notificationStatus is set', () => {
      const markNoLetterAction = component.tableConfig.rowActions!.find((a: any) => a.action === 'mark-no-letter');
      expect(markNoLetterAction?.disabled!(mockDonorWithStatus)).toBeTrue();
      expect(markNoLetterAction?.disabled!(mockDonor)).toBeFalse();
    });
  });

  // ─── ROW EXPANSION ───────────────────────────────────────────────

  describe('Row Expansion', () => {
    const rowWithKey = { ...mockDonor, _rowKey: 'DN00017648_HBCX_W633324041051_0' } as any;

    it('should add row to expandedRows on toggle', () => {
      component.onRowExpandToggle(rowWithKey);
      expect(component.expandedRows.has(rowWithKey._rowKey)).toBeTrue();
    });

    it('should remove row from expandedRows on second toggle', () => {
      component.expandedRows.add(rowWithKey._rowKey);
      component.onRowExpandToggle(rowWithKey);
      expect(component.expandedRows.has(rowWithKey._rowKey)).toBeFalse();
    });

    it('should load donor details when expanding row', fakeAsync(() => {
      component.onRowExpandToggle(rowWithKey);
      tick();

      expect(serviceSpy.getDonorDetails).toHaveBeenCalledWith('DN00017648');
    }));

    it('should not reload details if already cached', fakeAsync(() => {
      component.donorDetailsCache.set('DN00017648', mockDonorDetails);

      component.onRowExpandToggle(rowWithKey);
      tick();

      expect(serviceSpy.getDonorDetails).not.toHaveBeenCalled();
    }));

    it('should cache loaded details', fakeAsync(() => {
      component.onRowExpandToggle(rowWithKey);
      tick();

      expect(component.getDonorDetails('DN00017648')).toBeDefined();
      expect(component.getDonorDetails('DN00017648')?.workPhone).toBe('555-123-4567');
    }));

    it('should track loading state', () => {
      const subject = new Subject<DonorDetailsDto>();
      serviceSpy.getDonorDetails.and.returnValue(subject.asObservable());

      component.onRowExpandToggle(rowWithKey);

      expect(component.isDonorDetailsLoading('DN00017648')).toBeTrue();

      subject.next(mockDonorDetails);
      subject.complete();

      expect(component.isDonorDetailsLoading('DN00017648')).toBeFalse();
    });

    it('should expand all rows on expandAllToggle(true)', fakeAsync(() => {
      component.dataSource = [
        { ...mockDonor, _rowKey: 'key1' } as any,
        { ...mockDonor, donorId: 'DN00017649', _rowKey: 'key2' } as any
      ];

      component.onExpandAllToggle(true);
      tick();

      expect(component.expandedRows.size).toBe(2);
    }));

    it('should collapse all rows on expandAllToggle(false)', () => {
      component.expandedRows.add('key1');
      component.expandedRows.add('key2');

      component.onExpandAllToggle(false);

      expect(component.expandedRows.size).toBe(0);
    });

    it('should return undefined for uncached donor details', () => {
      expect(component.getDonorDetails('NONEXISTENT')).toBeUndefined();
    });
  });

  // ─── SIDE PANEL ──────────────────────────────────────────────────

  describe('Side Panel', () => {
    it('should open panel with correct section and donor data', () => {
      component.onRowAction({ action: 'interdictions', row: mockDonor as any });

      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentSection()).toBe('interdictions');
      expect(component.currentCheckDonorId()).toBe('DN00017648');
      expect(component.currentCheckDonorName()).toBe('ROGERS, ALLESIA');
    });

    it('should close panel and reset all signals', () => {
      component.onRowAction({ action: 'interdictions', row: mockDonor as any });
      component.onPanelClose();

      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.currentSection()).toBeNull();
      expect(component.currentCheckDonorId()).toBe('');
      expect(component.currentCheckDonorName()).toBe('');
      expect(component.sidePanelWidth()).toBe('70vw');
    });

    it('should update panel width', () => {
      component.onPanelWidthChange('80vw');
      expect(component.sidePanelWidth()).toBe('80vw');
    });
  });

  // ─── SEND LETTER DIALOG ─────────────────────────────────────────

  describe('Send Letter Dialog', () => {
    it('should open with correct data', () => {
      const dialogSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as MatDialogRef<any>);

      component.onRowAction({ action: 'send-letter', row: mockDonor as any });

      const callArgs = dialog.open.calls.mostRecent().args;
      expect(callArgs[0]).toBe(AuthorizeNotificationLetterDialog);
      expect(callArgs[1]?.width).toBe('900px');
      expect(callArgs[1]?.data.donorId).toBe('DN00017648');
      expect(callArgs[1]?.data.interCode).toBe('HBCX');
      expect(callArgs[1]?.disableClose).toBeTrue();
    });

    it('should refresh page after dialog closes', fakeAsync(() => {
      const dialogSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as MatDialogRef<any>);

      component.onRowAction({ action: 'send-letter', row: mockDonor as any });
      serviceSpy.searchDonors.calls.reset();

      dialogSubject.next(null);
      dialogSubject.complete();
      tick();

      expect(serviceSpy.searchDonors).toHaveBeenCalled();
    }));
  });

  // ─── MARK NO LETTER FLOW ────────────────────────────────────────

  describe('Mark No Letter Flow', () => {
    it('should open MarkNoLetterDialog with USER mode', fakeAsync(() => {
      const dialogSubject = new Subject<MarkNoLetterDialogResult>();
      dialog.open.and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as MatDialogRef<any>);

      component.onRowAction({ action: 'mark-no-letter', row: mockDonor as any });

      const callArgs = dialog.open.calls.mostRecent().args;
      expect(callArgs[1]?.data.mode).toBe('USER');
      expect(callArgs[1]?.data.donor).toEqual(mockDonor);
    }));

    it('should not call save when dialog cancelled', fakeAsync(() => {
      const dialogSubject = new Subject<MarkNoLetterDialogResult>();
      dialog.open.and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as MatDialogRef<any>);

      component.onRowAction({ action: 'mark-no-letter', row: mockDonor as any });
      tick();

      dialogSubject.next({ action: 'cancel' } as any);
      dialogSubject.complete();
      tick();

      expect(serviceSpy.markNoLetter).not.toHaveBeenCalled();
    }));

    it('should call markNoLetter with correct payload when saved without multi-interdictions', fakeAsync(() => {
      const dialogSubject = new Subject<MarkNoLetterDialogResult>();
      dialog.open.and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as MatDialogRef<any>);

      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonor, notificationStatus: null } as any });
      tick();

      dialogSubject.next({ action: 'save', userComment: 'Test comment' });
      dialogSubject.complete();
      tick();

      expect(serviceSpy.markNoLetter).toHaveBeenCalledWith(jasmine.objectContaining({
        donorId: 'DN00017648',
        interCode: 'HBCX',
        userComment: 'Test comment',
        mode: 'USER'
      }));
    }));

    it('should show success snackbar after successful mark no letter', fakeAsync(() => {
      dialog.open.and.returnValue({ afterClosed: () => of({ action: 'save', userComment: 'test' }) } as MatDialogRef<any>);

      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonor, notificationStatus: null } as any });
      tick();

      expect(snackBar.open).toHaveBeenCalled();
      const snackBarArgs = snackBar.open.calls.mostRecent().args;
      expect(snackBarArgs[0]).toContain('Marked for no letter successfully');
    }));

    it('should show error when markNoLetter fails', fakeAsync(() => {
      serviceSpy.markNoLetter.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Already processed' } } })));
      dialog.open.and.returnValue({ afterClosed: () => of({ action: 'save', userComment: 'test' }) } as MatDialogRef<any>);

      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonor, notificationStatus: null } as any });
      tick();

      expect(snackBar.open).toHaveBeenCalled();
    }));
  });

  // ─── MULTIPLE INTERDICTION CONFIRMATION ──────────────────────────

  describe('Multiple Interdiction Confirmation', () => {
    it('should show confirmation dialog when donor has unitId and otherInterdictionCount > 0', fakeAsync(() => {
      const markNoLetterResult: MarkNoLetterDialogResult = { action: 'save', userComment: 'test' };
      const markNoLetterSubject = new Subject<MarkNoLetterDialogResult>();
      const confirmSubject = new Subject<boolean>();

      dialog.open.and.returnValues(
        { afterClosed: () => markNoLetterSubject.asObservable() } as MatDialogRef<any>,
        { afterClosed: () => confirmSubject.asObservable() } as MatDialogRef<any>
      );

      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonorWithMultipleInterdictions, notificationStatus: null } as any });
      tick();

      markNoLetterSubject.next(markNoLetterResult);
      markNoLetterSubject.complete();
      tick();

      expect(dialog.open).toHaveBeenCalledTimes(2);
      const secondCallArgs = dialog.open.calls.argsFor(1);
      expect(secondCallArgs[0]).toBe(ConfirmActionDialogComponent);
      expect(secondCallArgs[1]?.data?.title).toBe('Multiple Interdictions Alert');
    }));

    it('should NOT show confirmation dialog when otherInterdictionCount is 0', fakeAsync(() => {
      const markNoLetterResult: MarkNoLetterDialogResult = { action: 'save', userComment: 'test' };
      const markNoLetterSubject = new Subject<MarkNoLetterDialogResult>();

      dialog.open.and.returnValue({ afterClosed: () => markNoLetterSubject.asObservable() } as MatDialogRef<any>);

      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonor, notificationStatus: null } as any });
      tick();

      markNoLetterSubject.next(markNoLetterResult);
      markNoLetterSubject.complete();
      tick();

      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(serviceSpy.markNoLetter).toHaveBeenCalled();
    }));

    it('should NOT show confirmation dialog when unitId is null', fakeAsync(() => {
      const donorNoUnit: DonorNotificationSearchResult = {
        ...mockDonor,
        unitId: null as any,
        otherInterdictionCount: 3,
        notificationStatus: null
      };
      const markNoLetterResult: MarkNoLetterDialogResult = { action: 'save', userComment: 'test' };
      const markNoLetterSubject = new Subject<MarkNoLetterDialogResult>();

      dialog.open.and.returnValue({ afterClosed: () => markNoLetterSubject.asObservable() } as MatDialogRef<any>);

      component.onRowAction({ action: 'mark-no-letter', row: donorNoUnit as any });
      tick();

      markNoLetterSubject.next(markNoLetterResult);
      markNoLetterSubject.complete();
      tick();

      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(serviceSpy.markNoLetter).toHaveBeenCalled();
    }));

    it('should call markNoLetter when confirmation is accepted', fakeAsync(() => {
      const markNoLetterResult: MarkNoLetterDialogResult = { action: 'save', userComment: 'test comment' };
      const markNoLetterSubject = new Subject<MarkNoLetterDialogResult>();
      const confirmSubject = new Subject<boolean>();

      dialog.open.and.returnValues(
        { afterClosed: () => markNoLetterSubject.asObservable() } as MatDialogRef<any>,
        { afterClosed: () => confirmSubject.asObservable() } as MatDialogRef<any>
      );

      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonorWithMultipleInterdictions, notificationStatus: null } as any });
      tick();

      markNoLetterSubject.next(markNoLetterResult);
      markNoLetterSubject.complete();
      tick();

      confirmSubject.next(true);
      confirmSubject.complete();
      tick();

      expect(serviceSpy.markNoLetter).toHaveBeenCalled();
    }));

    it('should NOT call markNoLetter when confirmation is declined', fakeAsync(() => {
      const markNoLetterResult: MarkNoLetterDialogResult = { action: 'save', userComment: 'test comment' };
      const markNoLetterSubject = new Subject<MarkNoLetterDialogResult>();
      const confirmSubject = new Subject<boolean>();

      dialog.open.and.returnValues(
        { afterClosed: () => markNoLetterSubject.asObservable() } as MatDialogRef<any>,
        { afterClosed: () => confirmSubject.asObservable() } as MatDialogRef<any>
      );

      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonorWithMultipleInterdictions, notificationStatus: null } as any });
      tick();

      markNoLetterSubject.next(markNoLetterResult);
      markNoLetterSubject.complete();
      tick();

      confirmSubject.next(false);
      confirmSubject.complete();
      tick();

      expect(serviceSpy.markNoLetter).not.toHaveBeenCalled();
    }));
  });

  // ─── COMMUNICATION LOG ───────────────────────────────────────────

  describe('Communication Log', () => {
    it('should open NotificationLogDialogComponent with correct data', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as MatDialogRef<any>);

      component.onRowAction({ action: 'communication-log', row: mockDonor as any });

      const callArgs = dialog.open.calls.mostRecent().args;
      expect(callArgs[0]).toBe(NotificationLogDialogComponent);
      expect(callArgs[1]?.data.donorId).toBe('DN00017648');
      expect(callArgs[1]?.width).toBe('960px');
      expect(callArgs[1]?.disableClose).toBeTrue();
    });
  });

  // ─── CLEAR ALL ───────────────────────────────────────────────────

  describe('Clear All', () => {
    it('should reset form to defaults', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      component.searchForm.get('code')?.setValue('123');
      fixture.detectChanges();

      component.onClearAll();

      expect(component.searchForm.get('searchType')?.value).toBe('Pending');
      expect(component.searchForm.get('code')?.value).toBe('');
    });

    it('should clear code state', () => {
      component.codeDescription = 'Some Desc';
      component.codeValidated = true;
      component.lastValidatedCode = 'HBCX';

      component.onClearAll();

      expect(component.codeDescription).toBe('');
      expect(component.codeValidated).toBeFalse();
      expect(component.lastValidatedCode).toBe('');
    });

    it('should clear data source and pagination', () => {
      component.dataSource = [mockDonor as any];
      component.hasSearched = true;
      component.tableConfig = { ...component.tableConfig, pagination: { ...component.tableConfig.pagination!, totalRecords: 50 } };

      component.onClearAll();

      expect(component.dataSource).toEqual([]);
      expect(component.hasSearched).toBeFalse();
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should clear expanded rows and caches', () => {
      component.expandedRows.add('key1');
      component.donorDetailsCache.set('D001', mockDonorDetails);

      component.onClearAll();

      expect(component.expandedRows.size).toBe(0);
      expect(component.donorDetailsCache.size).toBe(0);
    });
  });

  // ─── CHAPTER CHANGE ──────────────────────────────────────────────

  describe('Chapter Change', () => {
    it('should clear results when chapter changes', () => {
      component.dataSource = [mockDonor as any];
      component.hasSearched = true;

      chapterChangedSubject.next();

      expect(component.dataSource).toEqual([]);
      expect(component.hasSearched).toBeFalse();
    });

    it('should reset form to Pending when chapter changes', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();

      chapterChangedSubject.next();

      expect(component.searchForm.get('searchType')?.value).toBe('Pending');
    });
  });

  // ─── UNIT ID HANDLING ────────────────────────────────────────────

  describe('Unit ID Handling', () => {
    it('should call checkUnitExists on post-validate', fakeAsync(() => {
      const mockEvent = {
        data: { parsedUnitId: 'W633324041051' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(serviceSpy.checkUnitExists).toHaveBeenCalledWith('W633324041051');
      expect(mockEvent.confirm).toHaveBeenCalled();
    }));

    it('should reject when unit does not exist', fakeAsync(() => {
      serviceSpy.checkUnitExists.and.returnValue(of(false));

      const mockEvent = {
        data: { parsedUnitId: 'INVALID' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Unit ID not found in donations');
    }));

    it('should reject on checkUnitExists error', fakeAsync(() => {
      serviceSpy.checkUnitExists.and.returnValue(throwError(() => new Error('Network error')));

      const mockEvent = {
        data: { parsedUnitId: 'UNIT123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Failed to verify unit');
    }));

    it('should set codeValidated on unit validated', () => {
      component.onUnitValidated({ parsedUnitId: 'W633324041051' } as any);

      expect(component.codeValidated).toBeTrue();
      expect(component.lastValidatedCode).toBe('W633324041051');
    });

    it('should reset codeValidated on unit cleared', () => {
      component.codeValidated = true;
      component.lastValidatedCode = 'W633324041051';

      component.onUnitCleared();

      expect(component.codeValidated).toBeFalse();
      expect(component.lastValidatedCode).toBe('');
    });
  });

  // ─── selectedSearchOption GETTER ─────────────────────────────────

  describe('selectedSearchOption Getter', () => {
    it('should return matching option for current search type', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      const option = component.selectedSearchOption;
      expect(option?.value).toBe('DonorID');
      expect(option?.label).toBe('By Donor ID');
    });

    it('should return undefined for null search type', () => {
      component.searchForm.get('searchType')?.setValue(null);
      expect(component.selectedSearchOption).toBeUndefined();
    });
  });

  // ─── TABLE COLUMNS ───────────────────────────────────────────────

  describe('Table Columns', () => {
    it('should have 9 columns configured', () => {
      expect(component.tableConfig.columns.length).toBe(9);
    });

    it('should have donorName as the first sortable column', () => {
      const firstCol = component.tableConfig.columns[0];
      expect(firstCol.key).toBe('donorName');
      expect(firstCol.sortable).toBeTrue();
    });

    it('should format lastDonationDate column values', () => {
      const dateCol = component.tableConfig.columns.find(c => c.key === 'lastDonationDate');
      expect(dateCol?.valueFormatter?.('2025-03-15')).toBe('15-MAR-2025');
    });

    it('should format letterId column to dash when null', () => {
      const letterCol = component.tableConfig.columns.find(c => c.key === 'letterId');
      expect(letterCol?.valueFormatter?.(null)).toBe('-');
    });

    it('should format letterId column to string when present', () => {
      const letterCol = component.tableConfig.columns.find(c => c.key === 'letterId');
      expect(letterCol?.valueFormatter?.('18.03')).toBe('18.03');
    });
  });

  // ─── ROW ACTIONS CONFIGURATION ──────────────────────────────────

  describe('Row Actions Configuration', () => {
    it('should have 7 row actions', () => {
      expect(component.tableConfig.rowActions!.length).toBe(7);
    });

    it('should have Send Letter and Mark No Letter as first two actions', () => {
      expect(component.tableConfig.rowActions![0].action).toBe('send-letter');
      expect(component.tableConfig.rowActions![1].action).toBe('mark-no-letter');
    });

    it('should not disable Communication Log regardless of status', () => {
      const commLogAction = component.tableConfig.rowActions!.find((a: any) => a.action === 'communication-log');
      expect(commLogAction?.disabled).toBeUndefined();
    });
  });

  // ─── onRowClick ──────────────────────────────────────────────────

  describe('onRowClick', () => {
    it('should be a no-op', () => {
      expect(() => component.onRowClick(mockDonor)).not.toThrow();
    });
  });

  // ─── DESTROY ─────────────────────────────────────────────────────

  describe('Destroy', () => {
    it('should clean up on destroy without errors', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
