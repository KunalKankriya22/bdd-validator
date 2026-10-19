import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Validators } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';
import { AuthorizeDonorNotificationComponent } from './authorize-donor-notification';
import { AuthorizeDonorNotificationService } from './services/authorize-donor-notification.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DonorNotificationSearchResult } from './models/authorize-donor-notification.model';
import { MarkNoLetterDialog, MarkNoLetterDialogResult } from '@shared/components/mark-no-letter-dialog/mark-no-letter-dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { AuthorizeNotificationLetterDialog } from '@shared/components/authorize-notification-letter-dialog/authorize-notification-letter-dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AuthorizeDonorNotificationComponent', () => {
  let snackBarSpy: any;
  let pageHeaderServiceSpy: any;
  let authServiceSpy: any;
  let component: AuthorizeDonorNotificationComponent;
  let fixture: ComponentFixture<AuthorizeDonorNotificationComponent>;
  let authorizeDonorNotificationService: jasmine.SpyObj<AuthorizeDonorNotificationService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterChangedSubject: Subject<void>;

  const mockDonor: DonorNotificationSearchResult = {
    donorId: 'DN00012345',
    donorName: 'Doe, John',
    lastDonationType: 'WB',
    lastProcCode: 'WB450',
    lastUnitId: '1234567',
    lastDonationDate: '2024-03-15T00:00:00Z',
    interCode: 'INT001',
    interEffDate: '2024-03-16T00:00:00Z',
    unitId: null,
    letterSeqNo: null,
    letterId: null,
    notificationStatus: null,
    chapterId: 'TAMU',
    otherInterdictionCount: 0
  };

  const mockDonorWithStatus: DonorNotificationSearchResult = {
    ...mockDonor,
    donorId: 'DN00099999',
    notificationStatus: 'AUTNO'
  };

  const mockDonorWithMultipleInterdictions: DonorNotificationSearchResult = {
    ...mockDonor,
    donorId: 'DN00056789',
    unitId: 'UNIT123',
    otherInterdictionCount: 2
  };

  const mockSearchResponse = { data: [mockDonor], total: 1 };

  const mockDonorDetails = {
    donorId: 'DN00012345',
    workPhone: '555-1234',
    homePhone: '555-5678',
    mobilePhone: null as string | null,
    preferredContactFlag: 'W',
    address: '123 Main St, Dallas TX 75201'
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthorizeDonorNotificationService', [
      'searchDonors', 'getDonorDetails', 'getDonorCommunications', 'getCodeDescription',
      'markNoLetter', 'approveNoLetter', 'rejectNoLetter', 'getLovLimit', 'getLovCodes', 'checkUnitExists'
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('');
    chapterChangedSubject = new Subject<void>();
    const headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    const dialogSpy = createMockMatDialog();
    snackBarSpy = createMockMatSnackBar();

    authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
    authServiceSpy.getDonorDetails.and.returnValue(of(mockDonorDetails));
    authServiceSpy.getCodeDescription.and.returnValue(of('Test Description'));
    authServiceSpy.getLovLimit.and.returnValue(of(15));
    authServiceSpy.getLovCodes.and.returnValue(of([]));
    authServiceSpy.checkUnitExists.and.returnValue(of(true));
    authServiceSpy.markNoLetter.and.returnValue(of({ success: true, statusCode: 200, message: 'Marked for no letter successfully.' }));
    authServiceSpy.approveNoLetter.and.returnValue(of({ success: true, statusCode: 200, message: 'No letter approved by supervisor.' }));
    authServiceSpy.rejectNoLetter.and.returnValue(of({ success: true, statusCode: 200, message: 'Rejected.' }));
    authServiceSpy.getDonorCommunications.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AuthorizeDonorNotificationComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthorizeDonorNotificationService, useValue: authServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).overrideComponent(AuthorizeDonorNotificationComponent, {
      add: { providers: [{ provide: MatSnackBar, useValue: snackBarSpy }, { provide: MatDialog, useValue: dialogSpy }] }
    });

    authorizeDonorNotificationService = TestBed.inject(AuthorizeDonorNotificationService) as jasmine.SpyObj<AuthorizeDonorNotificationService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    fixture = TestBed.createComponent(AuthorizeDonorNotificationComponent);
    component = fixture.componentInstance;
    dialog = fixture.debugElement.injector.get(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = fixture.debugElement.injector.get(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  describe('Form Initialization', () => {
    it('should initialize search form with default searchType as Auth', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('searchType')?.value).toBe('Auth');
    });
    it('should initialize search form with default values', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('searchType')?.value).toBe('Auth');
      expect(component.searchForm.get('includeNotified')?.value).toBe(false);
    });
    it('should initialize includeNotified as false and disabled', () => {
      expect(component.searchForm.get('includeNotified')?.value).toBe(false);
      expect(component.searchForm.get('includeNotified')?.disabled).toBe(true);
    });
    it('should initialize exclusive as false and disabled', () => {
      expect(component.searchForm.get('exclusive')?.value).toBe(false);
      expect(component.searchForm.get('exclusive')?.disabled).toBe(true);
    });
    it('should have 8 search type options', () => { expect(component.searchTypeOptions.length).toBe(8); });
    it('should have search type options defined', () => {
      expect(component.searchTypeOptions.length).toBeGreaterThan(0);
      expect(component.searchTypeOptions[0].value).toBe('Pending');
    });
    it('should have Pending as first search type option', () => {
      expect(component.searchTypeOptions[0].value).toBe('Pending');
      expect(component.searchTypeOptions[0].label).toBe('All Pending Donors');
    });
    it('should have Auth search type option', () => {
      const authOption = component.searchTypeOptions.find(o => o.value === 'Auth');
      expect(authOption).toBeDefined();
      expect(authOption?.label).toBe('Letters for Authorization');
      expect(authOption?.requiresCode).toBe(false);
    });
  });

  describe('Search Type Changes', () => {
    it('should enable includeNotified for InterCD, LetterID, DonorID', () => {
      ['InterCD', 'LetterID', 'DonorID'].forEach(type => {
        component.searchForm.get('searchType')?.setValue(type);
        fixture.detectChanges();
        expect(component.searchForm.get('includeNotified')?.enabled).toBe(true);
      });
    });
    it('should disable includeNotified for Pending, Auth, All, UnitID, Reinst', () => {
      ['Pending', 'Auth', 'All', 'UnitID', 'Reinst'].forEach(type => {
        component.searchForm.get('searchType')?.setValue(type);
        fixture.detectChanges();
        expect(component.searchForm.get('includeNotified')?.disabled).toBe(true);
      });
    });
    it('should enable exclusive only for Reinst', () => {
      component.searchForm.get('searchType')?.setValue('Reinst');
      fixture.detectChanges();
      expect(component.searchForm.get('exclusive')?.enabled).toBe(true);
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();
      expect(component.searchForm.get('exclusive')?.disabled).toBe(true);
    });
    it('should disable date fields for DonorID', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      fixture.detectChanges();
      expect(component.searchForm.get('startDate')?.disabled).toBe(true);
      expect(component.searchForm.get('endDate')?.disabled).toBe(true);
    });
    it('should disable date fields for UnitID', () => {
      component.searchForm.get('searchType')?.setValue('UnitID');
      fixture.detectChanges();
      expect(component.searchForm.get('startDate')?.disabled).toBe(true);
      expect(component.searchForm.get('endDate')?.disabled).toBe(true);
    });
    it('should enable date fields for All', () => {
      component.searchForm.get('searchType')?.setValue('All');
      fixture.detectChanges();
      expect(component.searchForm.get('startDate')?.enabled).toBe(true);
      expect(component.searchForm.get('endDate')?.enabled).toBe(true);
    });
    it('should load LOV codes for InterCD, LetterID, Reinst', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      fixture.detectChanges();
      expect(authorizeDonorNotificationService.getLovCodes).toHaveBeenCalledWith('InterCD');
    });
    it('should clear code and description on search type change', () => {
      component.codeDescription = 'Some description';
      component.codeValidated = true;
      component.lastValidatedCode = 'ABC';
      component.searchForm.get('searchType')?.setValue('All');
      fixture.detectChanges();
      expect(component.codeDescription).toBe('');
      expect(component.codeValidated).toBe(false);
      expect(component.lastValidatedCode).toBe('');
    });
  });

  describe('DonorID Validators', () => {
    beforeEach(() => { component.searchForm.get('searchType')?.setValue('DonorID'); fixture.detectChanges(); });
    it('should set required validator for DonorID code field', () => {
      const codeControl = component.searchForm.get('code');
      codeControl?.setValue(''); codeControl?.markAsTouched();
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
      component.searchForm.get('searchType')?.setValue('InterCD'); fixture.detectChanges();
      const codeControl = component.searchForm.get('code');
      codeControl?.setValue('LONGCODETHATEXCEEDS10CHARS');
      expect(codeControl?.hasError('maxlength')).toBe(false);
    });
  });

  describe('DonorID Zero-Padding', () => {
    it('should zero-pad DonorID in onCodeBlur', () => {
      component.searchForm.get('searchType')?.setValue('DonorID'); fixture.detectChanges();
      component.searchForm.get('code')?.setValue('123');
      component.onCodeBlur();
      expect(authorizeDonorNotificationService.getCodeDescription).toHaveBeenCalledWith('DonorID', 'DN00000123');
    });
    it('should zero-pad DonorID in loadData', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('DonorID'); fixture.detectChanges();
      component.searchForm.get('code')?.setValue('42'); component.codeValidated = true;
      component.onRetrieve(); tick();
      const callArgs = authorizeDonorNotificationService.searchDonors.calls.mostRecent().args;
      expect(callArgs[2].code).toBe('DN00000042');
    }));
    it('should strip non-numeric characters before padding', () => {
      component.searchForm.get('searchType')?.setValue('DonorID'); fixture.detectChanges();
      component.searchForm.get('code')?.setValue('DN123');
      component.onCodeBlur();
      expect(authorizeDonorNotificationService.getCodeDescription).toHaveBeenCalledWith('DonorID', 'DN00000123');
    });
  });

  describe('Date Validation', () => {
    it('should reject future dates', () => {
      const futureDate = moment().add(1, 'year');
      component.searchForm.patchValue({ searchType: 'All', startDate: futureDate }); fixture.detectChanges();
      component.onRetrieve();
      expect(authorizeDonorNotificationService.searchDonors).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalled();
    });
    it('should reject if start date is after end date', () => {
      component.searchForm.patchValue({ searchType: 'All', startDate: moment('2024-12-31'), endDate: moment('2024-01-01') }); fixture.detectChanges();
      component.onRetrieve();
      expect(authorizeDonorNotificationService.searchDonors).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalled();
    });
    it('should auto-fill date range when no dates provided for non-DonorID/UnitID types', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('All'); fixture.detectChanges();
      component.onRetrieve(); tick();
      expect(component.searchForm.get('startDate')?.value).toBeTruthy();
      expect(component.searchForm.get('endDate')?.value).toBeTruthy();
    }));
  });

  describe('Date Formatting', () => {
    it('should format valid date correctly', () => {
      const formatted = component.formatDate('2024-03-15T00:00:00Z');
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });
    it('should return dash for empty date', () => { expect(component.formatDate('')).toBe('-'); });
    it('should return dash for null value', () => { expect(component.formatDate(null as any)).toBe('-'); });
    it('should return original value for invalid date', () => { expect(component.formatDate('not-a-date')).toBe('not-a-date'); });
    it('should return original value for unparseable date', () => { expect(component.formatDate('NOT_A_DATE')).toBe('NOT_A_DATE'); });
  });

  describe('Table Configuration', () => {
    it('should not have Status column in table config', () => {
      expect(component.tableConfig.columns.find(c => c.key === 'notificationStatus')).toBeUndefined();
    });
    it('should have letterId column with dash formatter for null', () => {
      const letterCol = component.tableConfig.columns.find(c => c.key === 'letterId');
      expect(letterCol?.valueFormatter!(null, mockDonor)).toBe('-');
    });
    it('should have default pagination pageSize of 25', () => { expect(component.tableConfig.pagination?.pageSize).toBe(25); });
    it('should have default sort on donorName ASC', () => {
      expect(component.tableConfig.sortConfig?.column).toBe('donorName');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });
  });

  describe('Row Actions - Auth Letter Disabled Logic', () => {
    it('should have Auth Letter action', () => {
      const authAction = component.tableConfig.rowActions?.find(a => a.action === 'authorize-letter');
      expect(authAction).toBeDefined(); expect(authAction?.label).toBe('Auth Letter');
    });
    it('should enable Auth Letter when notificationStatus is AUTHZ', () => {
      const authAction = component.tableConfig.rowActions?.find(a => a.action === 'authorize-letter');
      expect(authAction?.disabled?.({ ...mockDonor, notificationStatus: 'AUTHZ' })).toBe(false);
    });
    it('should enable Auth Letter when notificationStatus is AUTCM', () => {
      const authAction = component.tableConfig.rowActions?.find(a => a.action === 'authorize-letter');
      expect(authAction?.disabled?.({ ...mockDonor, notificationStatus: 'AUTCM' })).toBe(false);
    });
    it('should disable Auth Letter when notificationStatus is null', () => {
      const authAction = component.tableConfig.rowActions?.find(a => a.action === 'authorize-letter');
      expect(authAction?.disabled?.(mockDonor)).toBe(true);
    });
    it('should disable Auth Letter when notificationStatus is AUTNO', () => {
      const authAction = component.tableConfig.rowActions?.find(a => a.action === 'authorize-letter');
      expect(authAction?.disabled?.(mockDonorWithStatus)).toBe(true);
    });
    it('should disable Auth Letter when notificationStatus is NOLET', () => {
      const authAction = component.tableConfig.rowActions?.find(a => a.action === 'authorize-letter');
      expect(authAction?.disabled?.({ ...mockDonor, notificationStatus: 'NOLET' })).toBe(true);
    });
    it('should disable Auth Letter when notificationStatus is NOTFY', () => {
      const authAction = component.tableConfig.rowActions?.find(a => a.action === 'authorize-letter');
      expect(authAction?.disabled?.({ ...mockDonor, notificationStatus: 'NOTFY' })).toBe(true);
    });
    it('should disable Auth Letter when notificationStatus is CMBLT', () => {
      const authAction = component.tableConfig.rowActions?.find(a => a.action === 'authorize-letter');
      expect(authAction?.disabled?.({ ...mockDonor, notificationStatus: 'CMBLT' })).toBe(true);
    });
    it('should disable Auth Letter when notificationStatus is REJECT', () => {
      const authAction = component.tableConfig.rowActions?.find(a => a.action === 'authorize-letter');
      expect(authAction?.disabled?.({ ...mockDonor, notificationStatus: 'REJECT' })).toBe(true);
    });
  });

  describe('Row Actions - Mark No Letter Disabled Logic', () => {
    it('should have Mark No Letter action', () => {
      const markAction = component.tableConfig.rowActions?.find(a => a.action === 'mark-no-letter');
      expect(markAction).toBeDefined(); expect(markAction?.label).toBe('Mark No Letter');
    });
    it('should enable Mark No Letter when notificationStatus is AUTNO', () => {
      expect(component.tableConfig.rowActions?.find(a => a.action === 'mark-no-letter')?.disabled?.(mockDonorWithStatus)).toBe(false);
    });
    it('should disable Mark No Letter when notificationStatus is null', () => {
      expect(component.tableConfig.rowActions?.find(a => a.action === 'mark-no-letter')?.disabled?.(mockDonor)).toBe(true);
    });
    it('should disable Mark No Letter when notificationStatus is NOLET', () => {
      expect(component.tableConfig.rowActions?.find(a => a.action === 'mark-no-letter')?.disabled?.({ ...mockDonor, notificationStatus: 'NOLET' })).toBe(true);
    });
  });

  describe('Row Actions - All 7 Actions Present', () => {
    it('should have 7 row actions', () => { expect(component.tableConfig.rowActions?.length).toBe(7); });
    it('should have all expected action types', () => {
      expect(component.tableConfig.rowActions?.map(a => a.action)).toEqual([
        'authorize-letter', 'mark-no-letter', 'communication-log', 'interdictions', 'test-results', 'attributes', 'demographics'
      ]);
    });
  });

  describe('Mark No Letter - Mode Detection', () => {
    it('should use SUPER mode when notificationStatus is AUTNO', fakeAsync(() => {
      const afterClosedSubject = new Subject<MarkNoLetterDialogResult>();
      dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);
      component.onRowAction({ action: 'mark-no-letter', row: mockDonorWithStatus }); tick();
      expect(authorizeDonorNotificationService.getDonorCommunications).toHaveBeenCalledWith('DN00099999');
    }));
  });

  describe('Multiple Interdiction Confirmation', () => {
    it('should show confirmation dialog when donor has unitId and otherInterdictionCount > 0', fakeAsync(() => {
      const markNoLetterResult: MarkNoLetterDialogResult = { action: 'save', userComment: 'test' };
      const markNoLetterSubject = new Subject<MarkNoLetterDialogResult>();
      const confirmSubject = new Subject<boolean>();
      dialog.open.and.returnValues(
        { afterClosed: () => markNoLetterSubject.asObservable() } as MatDialogRef<any>,
        { afterClosed: () => confirmSubject.asObservable() } as MatDialogRef<any>
      );
      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonorWithMultipleInterdictions, notificationStatus: null } as any }); tick();
      markNoLetterSubject.next(markNoLetterResult); markNoLetterSubject.complete(); tick();
      expect(dialog.open).toHaveBeenCalledTimes(2);
      const secondCallArgs = dialog.open.calls.argsFor(1);
      expect(secondCallArgs[0]).toBe(ConfirmActionDialogComponent);
      expect(secondCallArgs[1]?.data?.title).toBe('Multiple Interdictions Alert');
    }));
    it('should NOT show confirmation dialog when otherInterdictionCount is 0', fakeAsync(() => {
      const markNoLetterResult: MarkNoLetterDialogResult = { action: 'save', userComment: 'test' };
      const markNoLetterSubject = new Subject<MarkNoLetterDialogResult>();
      dialog.open.and.returnValue({ afterClosed: () => markNoLetterSubject.asObservable() } as MatDialogRef<any>);
      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonor, notificationStatus: null } as any }); tick();
      markNoLetterSubject.next(markNoLetterResult); markNoLetterSubject.complete(); tick();
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(authorizeDonorNotificationService.markNoLetter).toHaveBeenCalled();
    }));
    it('should NOT show confirmation dialog when unitId is null', fakeAsync(() => {
      const donorNoUnit: DonorNotificationSearchResult = { ...mockDonor, unitId: null, otherInterdictionCount: 3, notificationStatus: null };
      const markNoLetterResult: MarkNoLetterDialogResult = { action: 'save', userComment: 'test' };
      const markNoLetterSubject = new Subject<MarkNoLetterDialogResult>();
      dialog.open.and.returnValue({ afterClosed: () => markNoLetterSubject.asObservable() } as MatDialogRef<any>);
      component.onRowAction({ action: 'mark-no-letter', row: donorNoUnit as any }); tick();
      markNoLetterSubject.next(markNoLetterResult); markNoLetterSubject.complete(); tick();
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(authorizeDonorNotificationService.markNoLetter).toHaveBeenCalled();
    }));
    it('should call markNoLetter when confirmation is accepted', fakeAsync(() => {
      const markNoLetterResult: MarkNoLetterDialogResult = { action: 'save', userComment: 'test comment' };
      const markNoLetterSubject = new Subject<MarkNoLetterDialogResult>();
      const confirmSubject = new Subject<boolean>();
      dialog.open.and.returnValues(
        { afterClosed: () => markNoLetterSubject.asObservable() } as MatDialogRef<any>,
        { afterClosed: () => confirmSubject.asObservable() } as MatDialogRef<any>
      );
      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonorWithMultipleInterdictions, notificationStatus: null } as any }); tick();
      markNoLetterSubject.next(markNoLetterResult); markNoLetterSubject.complete(); tick();
      confirmSubject.next(true); confirmSubject.complete(); tick();
      expect(authorizeDonorNotificationService.markNoLetter).toHaveBeenCalled();
    }));
    it('should NOT call markNoLetter when confirmation is declined', fakeAsync(() => {
      const markNoLetterResult: MarkNoLetterDialogResult = { action: 'save', userComment: 'test comment' };
      const markNoLetterSubject = new Subject<MarkNoLetterDialogResult>();
      const confirmSubject = new Subject<boolean>();
      dialog.open.and.returnValues(
        { afterClosed: () => markNoLetterSubject.asObservable() } as MatDialogRef<any>,
        { afterClosed: () => confirmSubject.asObservable() } as MatDialogRef<any>
      );
      component.onRowAction({ action: 'mark-no-letter', row: { ...mockDonorWithMultipleInterdictions, notificationStatus: null } as any }); tick();
      markNoLetterSubject.next(markNoLetterResult); markNoLetterSubject.complete(); tick();
      confirmSubject.next(false); confirmSubject.complete(); tick();
      expect(authorizeDonorNotificationService.markNoLetter).not.toHaveBeenCalled();
    }));
  });

  describe('Mark No Letter - Reject Flow', () => {
    it('should call rejectNoLetter when dialog result is reject', fakeAsync(() => {
      const rejectResult: MarkNoLetterDialogResult = { action: 'reject' };
      const dialogSubject = new Subject<MarkNoLetterDialogResult>();
      authorizeDonorNotificationService.getDonorCommunications.and.returnValue(of([]));
      dialog.open.and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as MatDialogRef<any>);
      component.onRowAction({ action: 'mark-no-letter', row: mockDonorWithStatus }); tick();
      dialogSubject.next(rejectResult); dialogSubject.complete(); tick();
      expect(authorizeDonorNotificationService.rejectNoLetter).toHaveBeenCalledWith(mockDonorWithStatus.donorId, mockDonorWithStatus.interCode, mockDonorWithStatus.unitId);
    }));
  });

  describe('Mark No Letter - SUPER Mode with Approve', () => {
    it('should call approveNoLetter when SUPER mode save is triggered', fakeAsync(() => {
      const saveResult: MarkNoLetterDialogResult = { action: 'save', supervisorComment: 'Approved by supervisor' };
      const dialogSubject = new Subject<MarkNoLetterDialogResult>();
      authorizeDonorNotificationService.getDonorCommunications.and.returnValue(of([]));
      dialog.open.and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as MatDialogRef<any>);
      component.onRowAction({ action: 'mark-no-letter', row: mockDonorWithStatus }); tick();
      dialogSubject.next(saveResult); dialogSubject.complete(); tick();
      expect(authorizeDonorNotificationService.approveNoLetter).toHaveBeenCalledWith(jasmine.objectContaining({
        donorId: mockDonorWithStatus.donorId, interCode: mockDonorWithStatus.interCode, supervisorComment: 'Approved by supervisor'
      }));
    }));
  });

  describe('Authorize Letter', () => {
    it('should open AuthorizeNotificationLetterDialog on authorize-letter action', fakeAsync(() => {
      const dialogSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => dialogSubject.asObservable() } as MatDialogRef<any>);
      component.onRowAction({ action: 'authorize-letter', row: mockDonor }); tick();
      expect(dialog.open).toHaveBeenCalledWith(AuthorizeNotificationLetterDialog, jasmine.objectContaining({
        width: '900px', data: jasmine.objectContaining({ donorId: mockDonor.donorId, interCode: mockDonor.interCode, mode: 'SUPER' })
      }));
    }));
  });

  describe('Search & Data Loading', () => {
    it('should call searchDonors on retrieve', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('All'); fixture.detectChanges();
      component.onRetrieve(); tick();
      expect(authorizeDonorNotificationService.searchDonors).toHaveBeenCalled();
      expect(component.hasSearched).toBe(true);
    }));
    it('should set isLoading during search', fakeAsync(() => {
      const searchSubject = new Subject<any>();
      authorizeDonorNotificationService.searchDonors.and.returnValue(searchSubject.asObservable());
      component.searchForm.get('searchType')?.setValue('All'); fixture.detectChanges();
      component.onRetrieve();
      expect(component.isLoading).toBe(true);
      searchSubject.next(mockSearchResponse); searchSubject.complete(); tick();
      expect(component.isLoading).toBe(false);
    }));
    it('should show error on search failure', fakeAsync(() => {
      authorizeDonorNotificationService.searchDonors.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Search failed' } } })));
      component.searchForm.get('searchType')?.setValue('All'); fixture.detectChanges();
      component.onRetrieve(); tick();
      expect(snackBar.open).toHaveBeenCalled(); expect(component.isLoading).toBe(false);
    }));
    it('should add _rowKey to each data row', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('All'); fixture.detectChanges();
      component.onRetrieve(); tick();
      expect((component.dataSource[0] as any)._rowKey).toBeDefined();
    }));
  });

  describe('Pagination', () => {
    it('should call loadData with correct skip on page change', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('All'); fixture.detectChanges();
      component.onRetrieve(); tick();
      authorizeDonorNotificationService.searchDonors.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 25 }); tick();
      const callArgs = authorizeDonorNotificationService.searchDonors.calls.mostRecent().args;
      expect(callArgs[0]).toBe(25); expect(callArgs[1]).toBe(50);
    }));
  });

  describe('Sorting', () => {
    it('should map sort column names correctly', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('All'); fixture.detectChanges();
      component.onRetrieve(); tick();
      authorizeDonorNotificationService.searchDonors.calls.reset();
      component.onSortChange({ column: 'donorName', direction: 'D' }); tick();
      const callArgs = authorizeDonorNotificationService.searchDonors.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('DonorName'); expect(callArgs[2].sortOrder).toBe('DESC');
    }));
    it('should clear sort on default direction', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('All'); fixture.detectChanges();
      component.onRetrieve(); tick();
      authorizeDonorNotificationService.searchDonors.calls.reset();
      component.onSortChange({ column: 'donorName', direction: 'default' }); tick();
      const callArgs = authorizeDonorNotificationService.searchDonors.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBeNull(); expect(callArgs[2].sortOrder).toBeNull();
    }));
  });

  describe('Row Expand / Donor Details', () => {
    it('should load donor details on first expand', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('All'); fixture.detectChanges();
      component.onRetrieve(); tick();
      const row = { ...component.dataSource[0], _rowKey: 'key1' } as any;
      component.onRowExpandToggle(row); tick();
      expect(authorizeDonorNotificationService.getDonorDetails).toHaveBeenCalledWith(mockDonor.donorId);
    }));
    it('should not reload details if already cached', fakeAsync(() => {
      component.donorDetailsCache.set(mockDonor.donorId, mockDonorDetails);
      const row = { ...mockDonor, _rowKey: 'key1' } as any;
      component.onRowExpandToggle(row); tick();
      expect(authorizeDonorNotificationService.getDonorDetails).not.toHaveBeenCalled();
    }));
    it('should toggle expand state on second call', () => {
      const row = { ...mockDonor, _rowKey: 'key1' } as any;
      component.onRowExpandToggle(row); expect(component.expandedRows.has('key1')).toBe(true);
      component.onRowExpandToggle(row); expect(component.expandedRows.has('key1')).toBe(false);
    });
    it('should expand all rows on expandAllToggle(true)', fakeAsync(() => {
      component.dataSource = [{ ...mockDonor, _rowKey: 'key1' } as any, { ...mockDonor, donorId: 'DN00099999', _rowKey: 'key2' } as any];
      component.onExpandAllToggle(true); tick();
      expect(component.expandedRows.size).toBe(2);
    }));
    it('should collapse all rows on expandAllToggle(false)', () => {
      component.expandedRows = new Set(['key1', 'key2']);
      component.onExpandAllToggle(false); expect(component.expandedRows.size).toBe(0);
    });
    it('should return donor details from cache', () => {
      component.donorDetailsCache.set('DN00012345', mockDonorDetails);
      expect(component.getDonorDetails('DN00012345')).toEqual(mockDonorDetails);
    });
    it('should return undefined for uncached donor details', () => { expect(component.getDonorDetails('DN99999999')).toBeUndefined(); });
    it('should report loading state correctly', () => {
      component.donorDetailsLoading.add('DN00012345');
      expect(component.isDonorDetailsLoading('DN00012345')).toBe(true);
      expect(component.isDonorDetailsLoading('DN99999999')).toBe(false);
    });
  });

  describe('Side Panel', () => {
    it('should open side panel for demographics', () => {
      component.onRowAction({ action: 'demographics', row: mockDonor });
      expect(component.sidePanelOpen()).toBe(true); expect(component.currentSection()).toBe('demographics');
      expect(component.currentCheckDonorId()).toBe(mockDonor.donorId); expect(component.currentCheckDonorName()).toBe(mockDonor.donorName);
    });
    it('should open side panel for interdictions', () => {
      component.onRowAction({ action: 'interdictions', row: mockDonor });
      expect(component.sidePanelOpen()).toBe(true); expect(component.currentSection()).toBe('interdictions');
    });
    it('should open side panel for test-results', () => {
      component.onRowAction({ action: 'test-results', row: mockDonor });
      expect(component.sidePanelOpen()).toBe(true); expect(component.currentSection()).toBe('test-results');
    });
    it('should open side panel for attributes', () => {
      component.onRowAction({ action: 'attributes', row: mockDonor });
      expect(component.sidePanelOpen()).toBe(true); expect(component.currentSection()).toBe('attributes');
    });
    it('should close side panel and reset state', () => {
      component.onRowAction({ action: 'demographics', row: mockDonor }); component.onPanelClose();
      expect(component.sidePanelOpen()).toBe(false); expect(component.currentSection()).toBeNull();
      expect(component.currentCheckDonorId()).toBe(''); expect(component.currentCheckDonorName()).toBe('');
      expect(component.sidePanelWidth()).toBe('70vw');
    });
    it('should update panel width', () => { component.onPanelWidthChange('80vw'); expect(component.sidePanelWidth()).toBe('80vw'); });
  });

  describe('Communication Log', () => {
    it('should open NotificationLogDialog on communication-log action', fakeAsync(() => {
      dialog.open.and.returnValue({ afterClosed: () => of(null) } as MatDialogRef<any>);
      component.onRowAction({ action: 'communication-log', row: mockDonor }); tick();
      expect(dialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({ data: { donorId: mockDonor.donorId } }));
    }));
  });

  describe('Clear All', () => {
    it('should reset form to defaults with searchType Auth', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      component.searchForm.get('code')?.setValue('123');
      component.codeDescription = 'Some description'; component.codeValidated = true;
      component.onClearAll();
      expect(component.searchForm.get('searchType')?.value).toBe('Auth');
      expect(component.codeDescription).toBe(''); expect(component.codeValidated).toBe(false); expect(component.lastValidatedCode).toBe('');
    });
    it('should clear data and reset pagination', () => {
      component.dataSource = [mockDonor as any]; component.hasSearched = true;
      component.onClearAll();
      expect(component.dataSource.length).toBe(0); expect(component.hasSearched).toBe(false);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0); expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
    it('should reset form, code state, and clear results', () => {
      component.codeDescription = 'desc'; component.codeValidated = true; component.lastValidatedCode = 'INT001';
      component.dataSource = [mockSearchResponse.data[0] as any]; component.hasSearched = true;
      component.donorDetailsCache.set('DN001', {} as any); component.expandedRows = new Set(['key1']);
      component.onClearAll();
      expect(component.searchForm.get('searchType')?.value).toBe('Auth');
      expect(component.codeDescription).toBe(''); expect(component.codeValidated).toBe(false); expect(component.lastValidatedCode).toBe('');
      expect(component.dataSource.length).toBe(0); expect(component.hasSearched).toBe(false);
      expect(component.donorDetailsCache.size).toBe(0); expect(component.expandedRows.size).toBe(0);
    });
  });

  describe('onCodeBlur', () => {
    it('should clear description and validation when code is empty', () => {
      component.codeDescription = 'existing'; component.codeValidated = true;
      component.searchForm.get('searchType')?.setValue('InterCD'); component.searchForm.get('code')?.setValue('');
      component.onCodeBlur();
      expect(component.codeDescription).toBe(''); expect(component.codeValidated).toBe(false);
    });
    it('should clear description when searchType is falsy', () => {
      component.codeDescription = 'existing'; component.codeValidated = true;
      component.searchForm.get('code')?.enable(); component.searchForm.get('code')?.setValue('CODE1');
      component.searchForm.get('searchType')?.setValue(null as any); component.onCodeBlur();
      expect(component.codeDescription).toBe(''); expect(component.codeValidated).toBe(false);
    });
    it('should skip validation when code matches lastValidatedCode', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      component.lastValidatedCode = 'INT001'; component.searchForm.get('code')?.setValue('INT001');
      authServiceSpy.getCodeDescription.calls.reset(); component.onCodeBlur();
      expect(authServiceSpy.getCodeDescription).not.toHaveBeenCalled();
    });
    it('should validate directly for UnitID without service call', () => {
      component.searchForm.get('searchType')?.setValue('UnitID'); component.searchForm.get('code')?.setValue('UNIT1');
      authServiceSpy.getCodeDescription.calls.reset(); component.onCodeBlur();
      expect(component.codeValidated).toBe(true); expect(component.lastValidatedCode).toBe('UNIT1');
      expect(authServiceSpy.getCodeDescription).not.toHaveBeenCalled();
    });
    it('should set description on successful service validation', () => {
      authServiceSpy.getCodeDescription.and.returnValue(of('Test Description'));
      component.searchForm.get('searchType')?.setValue('InterCD'); component.searchForm.get('code')?.setValue('INT001');
      component.onCodeBlur();
      expect(component.codeValidating).toBe(false); expect(component.codeDescription).toBe('Test Description');
      expect(component.codeValidated).toBe(true); expect(component.lastValidatedCode).toBe('INT001');
    });
    it('should show error with message on validation failure', () => {
      authServiceSpy.getCodeDescription.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));
      component.searchForm.get('searchType')?.setValue('InterCD'); component.searchForm.get('code')?.setValue('BAD');
      component.onCodeBlur();
      expect(component.codeValidating).toBe(false); expect(component.codeValidated).toBe(false);
      expect(snackBar.open).toHaveBeenCalledWith('Not found', 'Close', jasmine.any(Object));
    });
    it('should show error with errorResponse on validation failure', () => {
      authServiceSpy.getCodeDescription.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Custom error' } } })));
      component.searchForm.get('searchType')?.setValue('InterCD'); component.searchForm.get('code')?.setValue('BAD2');
      component.onCodeBlur();
      expect(snackBar.open).toHaveBeenCalledWith('Custom error', 'Close', jasmine.any(Object));
    });
    it('should show default error when no specific error info', () => {
      authServiceSpy.getCodeDescription.and.returnValue(throwError(() => ({ error: {} })));
      component.searchForm.get('searchType')?.setValue('InterCD'); component.searchForm.get('code')?.setValue('BAD3');
      component.onCodeBlur();
      expect(snackBar.open).toHaveBeenCalledWith('Invalid code. No matching record found.', 'Close', jasmine.any(Object));
    });
  });

  describe('onLovCodeSelected', () => {
    it('should set description and validated when code is found', () => {
      component.lovCodes.set([{ code: 'INT001', description: 'First Interdiction' }, { code: 'INT002', description: 'Second Interdiction' }]);
      component.onLovCodeSelected('INT001');
      expect(component.codeDescription).toBe('First Interdiction'); expect(component.codeValidated).toBe(true); expect(component.lastValidatedCode).toBe('INT001');
    });
    it('should not change state when code is not found', () => {
      component.lovCodes.set([{ code: 'INT001', description: 'First' }]);
      component.codeDescription = ''; component.codeValidated = false;
      component.onLovCodeSelected('NOTFOUND');
      expect(component.codeDescription).toBe(''); expect(component.codeValidated).toBe(false);
    });
  });

  describe('onRetrieve and loadData', () => {
    it('should show error when form is invalid', () => {
      component.searchForm.get('searchType')?.setValue('InterCD'); component.onRetrieve();
      expect(snackBar.open).toHaveBeenCalledWith('Please fill in all required fields', 'Close', jasmine.any(Object));
      expect(authServiceSpy.searchDonors).not.toHaveBeenCalled();
    });
    it('should return early when date has errors on disabled control', () => {
      component.searchForm.get('searchType')?.setValue('UnitID');
      component.searchForm.get('startDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'U1', clear: () => {} };
      authServiceSpy.searchDonors.calls.reset(); component.onRetrieve();
      expect(authServiceSpy.searchDonors).not.toHaveBeenCalled();
    });
    it('should set default dates for non-DonorID/UnitID types when dates empty', () => {
      component.searchForm.get('searchType')?.setValue('All');
      component.searchForm.get('startDate')?.setValue(null); component.searchForm.get('endDate')?.setValue(null);
      authServiceSpy.searchDonors.calls.reset(); component.onRetrieve();
      expect(component.searchForm.get('startDate')?.value).toBeTruthy(); expect(component.searchForm.get('endDate')?.value).toBeTruthy();
      expect(authServiceSpy.searchDonors).toHaveBeenCalled();
    });
    it('should not set default dates for DonorID type', () => {
      component.searchForm.get('searchType')?.setValue('DonorID'); component.searchForm.get('code')?.setValue('DN001');
      authServiceSpy.searchDonors.calls.reset(); component.onRetrieve();
      expect(authServiceSpy.searchDonors).toHaveBeenCalled();
    });
    it('should populate dataSource on successful search', () => {
      authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      component.searchForm.get('searchType')?.setValue('All'); authServiceSpy.searchDonors.calls.reset(); component.onRetrieve();
      expect(component.dataSource.length).toBe(1); expect(component.hasSearched).toBe(true);
      expect(component.isLoading).toBe(false); expect(component.tableConfig.pagination?.totalRecords).toBe(1);
    });
    it('should show server error on loadData failure', () => {
      authServiceSpy.searchDonors.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Server error' } } })));
      component.searchForm.get('searchType')?.setValue('All'); component.onRetrieve();
      expect(component.isLoading).toBe(false); expect(snackBar.open).toHaveBeenCalledWith('Server error', 'Close', jasmine.any(Object));
    });
    it('should show default error on loadData failure without error details', () => {
      authServiceSpy.searchDonors.and.returnValue(throwError(() => ({ error: {} })));
      component.searchForm.get('searchType')?.setValue('All'); component.onRetrieve();
      expect(snackBar.open).toHaveBeenCalledWith('Failed to load donor notifications', 'Close', jasmine.any(Object));
    });
    it('should use UnitID parsedUnitId as code for UnitID type', () => {
      component.searchForm.get('searchType')?.setValue('UnitID');
      authServiceSpy.searchDonors.calls.reset(); authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'PARSED_UNIT', clear: () => {} };
      component.onRetrieve();
      expect(authServiceSpy.searchDonors).toHaveBeenCalledWith(jasmine.any(Number), 0, jasmine.objectContaining({ code: 'PARSED_UNIT' }));
    });
  });

  describe('Pagination and Sorting', () => {
    it('should update pagination and reload data on page change', () => {
      authServiceSpy.searchDonors.calls.reset(); authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      component.onPageChange({ pageIndex: 2, pageSize: 10 } as any);
      expect(component.tableConfig.pagination!.pageIndex).toBe(2); expect(component.tableConfig.pagination!.pageSize).toBe(10);
      expect(authServiceSpy.searchDonors).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
    });
    it('should set ascending sort order', () => {
      authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      component.onSortChange({ column: 'donorName', direction: 'A' } as any);
      expect(component.currentSortColumn).toBe('DonorName'); expect(component.currentSortOrder).toBe('ASC');
    });
    it('should set descending sort order', () => {
      authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      component.onSortChange({ column: 'donorName', direction: 'D' } as any);
      expect(component.currentSortColumn).toBe('DonorName'); expect(component.currentSortOrder).toBe('DESC');
    });
    it('should clear sort on default direction', () => {
      authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      component.onSortChange({ column: 'donorName', direction: 'default' } as any);
      expect(component.currentSortColumn).toBeNull(); expect(component.currentSortOrder).toBeNull();
    });
    it('should set null sortColumn for unmapped column', () => {
      authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      component.onSortChange({ column: 'unknownCol', direction: 'A' } as any);
      expect(component.currentSortColumn).toBeNull(); expect(component.currentSortOrder).toBe('ASC');
    });
  });

  describe('onRowAction', () => {
    const donor = { donorId: 'DN0012345', donorName: 'Doe, John', lastDonationType: 'WB', lastProcCode: 'WB450', lastUnitId: '1234567', lastDonationDate: '2024-03-15T00:00:00Z', interCode: 'INT001', interEffDate: '2024-03-16T00:00:00Z', multipleInterdictionsInd: 'N' as const, letterId: null, notificationStatus: 'AUTHZ', letterSeqNo: 1, dayPhoneNo: '555-1234', homePhoneNo: '555-5678', mobilePhone: null, workFlag: 'Y' as const, homeFlag: 'N' as const, mobileFlag: null, donorAddress: '123 Main St', chapterId: 'TAMU', unitId: 'U001', otherInterdictionCount: 0 };
    it('should call authorizeLetter for authorize-letter action', () => {
      const spy = jasmine.createSpy('authorizeLetter'); (component as any).authorizeLetter = spy;
      component.onRowAction({ action: 'authorize-letter', row: donor } as any); expect(spy).toHaveBeenCalledWith(donor);
    });
    it('should call markNoLetter for mark-no-letter action', () => {
      const spy = jasmine.createSpy('markNoLetter'); (component as any).markNoLetter = spy;
      component.onRowAction({ action: 'mark-no-letter', row: donor } as any); expect(spy).toHaveBeenCalledWith(donor);
    });
    it('should call viewCommunicationLog for communication-log action', () => {
      const spy = jasmine.createSpy('viewCommunicationLog'); (component as any).viewCommunicationLog = spy;
      component.onRowAction({ action: 'communication-log', row: donor } as any); expect(spy).toHaveBeenCalledWith(donor);
    });
    it('should open side panel for interdictions action', () => {
      component.onRowAction({ action: 'interdictions', row: donor } as any);
      expect(component.sidePanelOpen()).toBe(true); expect(component.currentSection()).toBe('interdictions');
      expect(component.currentCheckDonorId()).toBe(donor.donorId); expect(component.currentCheckDonorName()).toBe(donor.donorName);
    });
    it('should open side panel for test-results action', () => {
      component.onRowAction({ action: 'test-results', row: donor } as any);
      expect(component.currentSection()).toBe('test-results'); expect(component.sidePanelOpen()).toBe(true);
    });
    it('should open side panel for attributes action', () => {
      component.onRowAction({ action: 'attributes', row: donor } as any); expect(component.currentSection()).toBe('attributes');
    });
    it('should open side panel for demographics action', () => {
      component.onRowAction({ action: 'demographics', row: donor } as any); expect(component.currentSection()).toBe('demographics');
    });
  });

  describe('Row Expansion', () => {
    const donor = { ...mockSearchResponse.data[0], _rowKey: 'key1' } as any;
    beforeEach(() => {
      component.dataSource = [donor];
      authServiceSpy.getDonorDetails.and.returnValue(of({ workPhone: '', homePhone: '', mobilePhone: null, preferredContactFlag: '', address: '' }));
    });
    it('should add row to expandedRows and load details on toggle', () => {
      authServiceSpy.getDonorDetails.calls.reset(); component.onRowExpandToggle(donor);
      expect(component.expandedRows.has('key1')).toBe(true); expect(authServiceSpy.getDonorDetails).toHaveBeenCalledWith(donor.donorId);
    });
    it('should remove row from expandedRows on second toggle', () => {
      component.expandedRows = new Set(['key1']); component.onRowExpandToggle(donor);
      expect(component.expandedRows.has('key1')).toBe(false);
    });
    it('should not reload details if already cached', () => {
      component.donorDetailsCache.set(donor.donorId, {} as any); authServiceSpy.getDonorDetails.calls.reset();
      component.onRowExpandToggle(donor);
      expect(component.expandedRows.has('key1')).toBe(true); expect(authServiceSpy.getDonorDetails).not.toHaveBeenCalled();
    });
    it('should not reload details if already loading', () => {
      component.donorDetailsLoading.add(donor.donorId); authServiceSpy.getDonorDetails.calls.reset();
      component.onRowExpandToggle(donor); expect(authServiceSpy.getDonorDetails).not.toHaveBeenCalled();
    });
    it('should handle getDonorDetails error gracefully', () => {
      authServiceSpy.getDonorDetails.and.returnValue(throwError(() => new Error('fail')));
      component.onRowExpandToggle(donor);
      expect(component.donorDetailsLoading.has(donor.donorId)).toBe(false); expect(component.donorDetailsCache.has(donor.donorId)).toBe(false);
    });
    it('should expand all rows on expandAll true', () => {
      authServiceSpy.getDonorDetails.calls.reset(); component.onExpandAllToggle(true);
      expect(component.expandedRows.has('key1')).toBe(true); expect(authServiceSpy.getDonorDetails).toHaveBeenCalled();
    });
    it('should collapse all rows on expandAll false', () => {
      component.expandedRows = new Set(['key1']); component.onExpandAllToggle(false);
      expect(component.expandedRows.size).toBe(0);
    });
  });

  describe('Side Panel Reset', () => {
    it('should reset all side panel state on close', () => {
      component.sidePanelOpen.set(true); component.currentSection.set('interdictions');
      component.currentCheckDonorId.set('DN001'); component.currentCheckDonorName.set('Test Donor'); component.sidePanelWidth.set('50vw');
      component.onPanelClose();
      expect(component.sidePanelOpen()).toBe(false); expect(component.sidePanelWidth()).toBe('70vw');
      expect(component.currentCheckDonorId()).toBe(''); expect(component.currentCheckDonorName()).toBe(''); expect(component.currentSection()).toBeNull();
    });
    it('should update panel width', () => { component.onPanelWidthChange('50vw'); expect(component.sidePanelWidth()).toBe('50vw'); });
  });

  describe('Search Type Filtering', () => {
    it('should return all search type options when search text is empty', () => { component.searchTypeSearch.set(''); expect(component.filteredSearchTypeOptions().length).toBe(8); });
    it('should filter search type options by label', () => {
      component.searchTypeSearch.set('donor'); const filtered = component.filteredSearchTypeOptions();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(opt => opt.label.toLowerCase().includes('donor') || opt.value.toLowerCase().includes('donor'))).toBe(true);
    });
    it('should return empty array when no search type options match', () => { component.searchTypeSearch.set('xyznonexistent'); expect(component.filteredSearchTypeOptions().length).toBe(0); });
    it('should filter search type options by value', () => {
      component.searchTypeSearch.set('intercd'); const filtered = component.filteredSearchTypeOptions();
      expect(filtered.length).toBe(1); expect(filtered[0].value).toBe('InterCD');
    });
  });

  describe('LOV Functionality', () => {
    it('should return true for hasLov when search type is InterCD', () => { component.searchForm.get('searchType')?.setValue('InterCD'); expect(component.hasLov).toBe(true); });
    it('should return true for hasLov when search type is LetterID', () => { component.searchForm.get('searchType')?.setValue('LetterID'); expect(component.hasLov).toBe(true); });
    it('should return true for hasLov when search type is Reinst', () => { component.searchForm.get('searchType')?.setValue('Reinst'); expect(component.hasLov).toBe(true); });
    it('should return false for hasLov when search type is DonorID', () => { component.searchForm.get('searchType')?.setValue('DonorID'); expect(component.hasLov).toBe(false); });
    it('should set code description on LOV code selection', () => {
      component.lovCodes.set([{ code: 'INT001', description: 'Test Interdiction' }]); component.onLovCodeSelected('INT001');
      expect(component.codeDescription).toBe('Test Interdiction'); expect(component.codeValidated).toBe(true); expect(component.lastValidatedCode).toBe('INT001');
    });
    it('should filter LOV codes by search text', () => {
      component.lovCodes.set([{ code: 'INT001', description: 'Test Interdiction' }, { code: 'INT002', description: 'Another Code' }]);
      component.lovSearch.set('another'); const filtered = component.filteredLovCodes();
      expect(filtered.length).toBe(1); expect(filtered[0].code).toBe('INT002');
    });
    it('should return all LOV codes when search text is empty', () => {
      component.lovCodes.set([{ code: 'INT001', description: 'Test' }, { code: 'INT002', description: 'Other' }]);
      component.lovSearch.set(''); expect(component.filteredLovCodes().length).toBe(2);
    });
  });

  describe('Code Validation (onCodeBlur)', () => {
    it('should not call API if code is empty', () => {
      component.searchForm.get('searchType')?.setValue('DonorID'); fixture.detectChanges();
      component.searchForm.get('code')?.setValue(''); component.onCodeBlur();
      expect(authorizeDonorNotificationService.getCodeDescription).not.toHaveBeenCalled();
    });
    it('should not call API if code same as lastValidatedCode', () => {
      component.searchForm.get('searchType')?.setValue('DonorID'); fixture.detectChanges();
      component.searchForm.get('code')?.setValue('123'); component.lastValidatedCode = '123'; component.onCodeBlur();
      expect(authorizeDonorNotificationService.getCodeDescription).not.toHaveBeenCalled();
    });
    it('should set codeValidated to true on successful validation', fakeAsync(() => {
      component.searchForm.get('searchType')?.setValue('DonorID'); fixture.detectChanges();
      component.searchForm.get('code')?.setValue('456'); component.onCodeBlur(); tick();
      expect(component.codeValidated).toBe(true); expect(component.codeDescription).toBe('Test Description');
    }));
    it('should show error on code validation failure', fakeAsync(() => {
      authorizeDonorNotificationService.getCodeDescription.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));
      component.searchForm.get('searchType')?.setValue('DonorID'); fixture.detectChanges();
      component.searchForm.get('code')?.setValue('999'); component.onCodeBlur(); tick();
      expect(component.codeValidated).toBe(false); expect(snackBar.open).toHaveBeenCalled();
    }));
  });

  describe('Unit Validation', () => {
    beforeEach(() => { authServiceSpy.checkUnitExists = jasmine.createSpy('checkUnitExists'); });
    it('should confirm when unit exists', () => {
      authServiceSpy.checkUnitExists.and.returnValue(of(true));
      const confirmSpy = jasmine.createSpy('confirm'); const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({ data: { parsedUnitId: 'UNIT001' } as any, confirm: confirmSpy, reject: rejectSpy } as any);
      expect(confirmSpy).toHaveBeenCalled(); expect(rejectSpy).not.toHaveBeenCalled();
    });
    it('should reject when unit does not exist', () => {
      authServiceSpy.checkUnitExists.and.returnValue(of(false));
      const confirmSpy = jasmine.createSpy('confirm'); const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({ data: { parsedUnitId: 'UNIT999' } as any, confirm: confirmSpy, reject: rejectSpy } as any);
      expect(rejectSpy).toHaveBeenCalledWith('Unit ID not found in donations');
    });
    it('should reject on service error', () => {
      authServiceSpy.checkUnitExists.and.returnValue(throwError(() => new Error('fail')));
      const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({ data: { parsedUnitId: 'UNIT001' } as any, confirm: jasmine.createSpy('confirm'), reject: rejectSpy } as any);
      expect(rejectSpy).toHaveBeenCalledWith('Failed to verify unit');
    });
    it('should set validated state on unit validated', () => {
      component.onUnitValidated({ parsedUnitId: 'UNIT001' } as any);
      expect(component.codeValidated).toBe(true); expect(component.lastValidatedCode).toBe('UNIT001');
    });
    it('should clear validated state on unit cleared', () => {
      component.codeValidated = true; component.lastValidatedCode = 'UNIT001'; component.onUnitCleared();
      expect(component.codeValidated).toBe(false); expect(component.lastValidatedCode).toBe('');
    });
  });

  describe('Getters and Computed Properties', () => {
    it('getDonorDetails should return cached details', () => {
      const details = { workPhone: '555-1234' } as any; component.donorDetailsCache.set('DN001', details);
      expect(component.getDonorDetails('DN001')).toBe(details);
    });
    it('getDonorDetails should return undefined for uncached donor', () => { expect(component.getDonorDetails('UNKNOWN')).toBeUndefined(); });
    it('isDonorDetailsLoading should return true for loading donor', () => { component.donorDetailsLoading.add('DN001'); expect(component.isDonorDetailsLoading('DN001')).toBe(true); });
    it('isDonorDetailsLoading should return false for non-loading donor', () => { expect(component.isDonorDetailsLoading('DN001')).toBe(false); });
    it('isRetrieveDisabled should return true when loading', () => { component.isLoading = true; expect(component.isRetrieveDisabled).toBe(true); });
    it('isRetrieveDisabled should return true when code validating', () => { component.codeValidating = true; expect(component.isRetrieveDisabled).toBe(true); });
    it('isRetrieveDisabled should return true when code not validated for requiresCode type', () => {
      component.searchForm.get('searchType')?.setValue('InterCD'); component.codeValidated = false;
      component.searchForm.get('code')?.setValue('INT001'); expect(component.isRetrieveDisabled).toBe(true);
    });
    it('isRetrieveDisabled should return false for non-requiresCode type when form valid', () => {
      component.isLoading = false; component.codeValidating = false; expect(component.isRetrieveDisabled).toBe(false);
    });
    it('isRetrieveDisabled should return true for UnitID when unitIdField not valid', () => {
      component.searchForm.get('searchType')?.setValue('UnitID'); expect(component.isRetrieveDisabled).toBe(true);
    });
    it('isRetrieveDisabled should return true when date has errors', () => {
      component.searchForm.get('searchType')?.setValue('UnitID');
      component.searchForm.get('startDate')?.enable(); component.searchForm.get('startDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isRetrieveDisabled).toBe(true);
    });
    it('hasLov should return true for InterCD', () => { component.searchForm.get('searchType')?.setValue('InterCD'); expect(component.hasLov).toBe(true); });
    it('hasLov should return true for LetterID', () => { component.searchForm.get('searchType')?.setValue('LetterID'); expect(component.hasLov).toBe(true); });
    it('hasLov should return true for Reinst', () => { component.searchForm.get('searchType')?.setValue('Reinst'); expect(component.hasLov).toBe(true); });
    it('hasLov should return false for DonorID', () => { component.searchForm.get('searchType')?.setValue('DonorID'); expect(component.hasLov).toBe(false); });
    it('hasLov should return false for All', () => { component.searchForm.get('searchType')?.setValue('All'); expect(component.hasLov).toBe(false); });
    it('selectedSearchOption should return matching option', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      expect(component.selectedSearchOption?.value).toBe('DonorID'); expect(component.selectedSearchOption?.codePlaceholder).toBe('Donor ID');
    });
    it('filteredLovCodes should filter by search text', () => {
      component.lovCodes.set([{ code: 'INT001', description: 'First' }, { code: 'INT002', description: 'Second' }]);
      component.lovSearch.set('first'); const filtered = component.filteredLovCodes();
      expect(filtered.length).toBe(1); expect(filtered[0].code).toBe('INT001');
    });
    it('filteredLovCodes should filter by code text', () => {
      component.lovCodes.set([{ code: 'INT001', description: 'First' }, { code: 'ABC002', description: 'Second' }]);
      component.lovSearch.set('abc'); const filtered = component.filteredLovCodes();
      expect(filtered.length).toBe(1); expect(filtered[0].code).toBe('ABC002');
    });
    it('filteredLovCodes should return all when search is empty', () => {
      component.lovCodes.set([{ code: 'INT001', description: 'First' }, { code: 'INT002', description: 'Second' }]);
      component.lovSearch.set(''); expect(component.filteredLovCodes().length).toBe(2);
    });
  });

  describe('Retrieve Disabled State', () => {
    it('should be disabled when loading', () => { component.isLoading = true; expect(component.isRetrieveDisabled).toBe(true); });
    it('should be disabled when code is validating', () => { component.codeValidating = true; expect(component.isRetrieveDisabled).toBe(true); });
    it('should be disabled when form is invalid', () => {
      component.searchForm.get('searchType')?.setValue(''); component.searchForm.get('searchType')?.markAsTouched();
      expect(component.isRetrieveDisabled).toBe(true);
    });
    it('should be disabled when code required but not validated', () => {
      component.searchForm.get('searchType')?.setValue('DonorID'); fixture.detectChanges();
      component.codeValidated = false; expect(component.isRetrieveDisabled).toBe(true);
    });
    it('should be enabled for non-code search types when form is valid', () => {
      component.searchForm.get('searchType')?.setValue('All'); fixture.detectChanges();
      component.isLoading = false; component.codeValidating = false; expect(component.isRetrieveDisabled).toBe(false);
    });
  });

  describe('Chapter Change', () => {
    it('should reset form to Pending searchType on chapter change', () => {
      component.searchForm.get('searchType')?.setValue('DonorID'); component.hasSearched = true;
      chapterChangedSubject.next();
      expect(component.searchForm.get('searchType')?.value).toBe('Pending'); expect(component.hasSearched).toBe(false);
    });
  });

  describe('Destroy', () => {
    it('should clean up on destroy', () => { expect(() => component.ngOnDestroy()).not.toThrow(); });
  });

  describe('Date Error Messages', () => {
    it('getStartDateError should return empty when control is untouched', () => { expect(component.getStartDateError()).toBe(''); });
    it('getStartDateError should return required message', () => {
      component.searchForm.get('endDate')?.setValue(moment('2024-06-01'));
      const ctrl = component.searchForm.get('startDate'); ctrl?.setValue(null); ctrl?.markAsTouched(); ctrl?.updateValueAndValidity();
      expect(component.getStartDateError()).toBe('Effective Date From is required');
    });
    it('getStartDateError should return invalid for parse error', () => {
      const ctrl = component.searchForm.get('startDate'); ctrl?.setErrors({ matDatepickerParse: { text: 'bad' } }); ctrl?.markAsTouched();
      expect(component.getStartDateError()).toBe('Effective Date From is invalid');
    });
    it('getStartDateError should return invalid for invalidDateFormat', () => {
      const ctrl = component.searchForm.get('startDate'); ctrl?.setErrors({ invalidDateFormat: true }); ctrl?.markAsTouched();
      expect(component.getStartDateError()).toBe('Effective Date From is invalid');
    });
    it('getStartDateError should return invalid for invalidDate', () => {
      const ctrl = component.searchForm.get('startDate'); ctrl?.setErrors({ invalidDate: true }); ctrl?.markAsTouched();
      expect(component.getStartDateError()).toBe('Effective Date From is invalid');
    });
    it('getStartDateError should return future date error', () => {
      const ctrl = component.searchForm.get('startDate');
      ctrl?.setErrors({ matDatepickerMax: { max: moment(), actual: moment().add(1, 'day') } }); ctrl?.markAsTouched();
      expect(component.getStartDateError()).toBe('Effective Date From cannot be a future date');
    });
    it('getStartDateError should return range error when start was last changed', () => {
      const ctrl = component.searchForm.get('startDate'); ctrl?.markAsTouched(); ctrl?.markAsDirty();
      (component as any).lastChangedDateField = 'start'; component.searchForm.setErrors({ dateRangeInvalid: true });
      expect(component.getStartDateError()).toBe('Effective Date From must be less than or equal to Effective Date To');
    });
    it('getEndDateError should return empty when control is untouched', () => { expect(component.getEndDateError()).toBe(''); });
    it('getEndDateError should return required message', () => {
      component.searchForm.get('startDate')?.setValue(moment('2024-01-01'));
      const ctrl = component.searchForm.get('endDate'); ctrl?.setValue(null); ctrl?.markAsTouched(); ctrl?.updateValueAndValidity();
      expect(component.getEndDateError()).toBe('Effective Date To is required');
    });
    it('getEndDateError should return invalid for parse error', () => {
      const ctrl = component.searchForm.get('endDate'); ctrl?.setErrors({ matDatepickerParse: true }); ctrl?.markAsTouched();
      expect(component.getEndDateError()).toBe('Effective Date To is invalid');
    });
    it('getEndDateError should return invalid for invalidDateFormat', () => {
      const ctrl = component.searchForm.get('endDate'); ctrl?.setErrors({ invalidDateFormat: true }); ctrl?.markAsTouched();
      expect(component.getEndDateError()).toBe('Effective Date To is invalid');
    });
    it('getEndDateError should return invalid for invalidDate', () => {
      const ctrl = component.searchForm.get('endDate'); ctrl?.setErrors({ invalidDate: true }); ctrl?.markAsTouched();
      expect(component.getEndDateError()).toBe('Effective Date To is invalid');
    });
    it('getEndDateError should return future date error', () => {
      const ctrl = component.searchForm.get('endDate'); ctrl?.setErrors({ matDatepickerMax: true }); ctrl?.markAsTouched();
      expect(component.getEndDateError()).toBe('Effective Date To cannot be a future date');
    });
    it('getEndDateError should return min date error', () => {
      const ctrl = component.searchForm.get('endDate'); ctrl?.setErrors({ matDatepickerMin: true }); ctrl?.markAsTouched();
      expect(component.getEndDateError()).toBe('Effective Date To must be greater than or equal to Effective Date From');
    });
    it('getEndDateError should return range error when end was last changed', () => {
      const ctrl = component.searchForm.get('endDate'); ctrl?.markAsTouched(); ctrl?.markAsDirty();
      (component as any).lastChangedDateField = 'end'; component.searchForm.setErrors({ dateRangeInvalid: true });
      expect(component.getEndDateError()).toBe('Effective Date To must be greater than or equal to Effective Date From');
    });
  });

  describe('Search Type Subscription', () => {
    it('should require code for InterCD', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      const codeCtrl = component.searchForm.get('code'); codeCtrl?.setValue(null); codeCtrl?.updateValueAndValidity();
      expect(codeCtrl?.enabled).toBe(true); expect(codeCtrl?.hasError('required')).toBe(true);
    });
    it('should disable code and dates for UnitID', () => {
      component.searchForm.get('searchType')?.setValue('UnitID');
      expect(component.searchForm.get('code')?.disabled).toBe(true);
      expect(component.searchForm.get('startDate')?.disabled).toBe(true); expect(component.searchForm.get('endDate')?.disabled).toBe(true);
    });
    it('should disable dates for DonorID', () => {
      component.searchForm.get('searchType')?.setValue('DonorID');
      expect(component.searchForm.get('startDate')?.disabled).toBe(true); expect(component.searchForm.get('endDate')?.disabled).toBe(true);
    });
    it('should enable dates for non-DonorID/UnitID types', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      expect(component.searchForm.get('startDate')?.enabled).toBe(true); expect(component.searchForm.get('endDate')?.enabled).toBe(true);
    });
    it('should enable includeNotified for DonorID', () => { component.searchForm.get('searchType')?.setValue('DonorID'); expect(component.searchForm.get('includeNotified')?.enabled).toBe(true); });
    it('should enable includeNotified for InterCD', () => { component.searchForm.get('searchType')?.setValue('InterCD'); expect(component.searchForm.get('includeNotified')?.enabled).toBe(true); });
    it('should enable includeNotified for LetterID', () => { component.searchForm.get('searchType')?.setValue('LetterID'); expect(component.searchForm.get('includeNotified')?.enabled).toBe(true); });
    it('should disable includeNotified for All', () => {
      component.searchForm.get('searchType')?.setValue('All');
      expect(component.searchForm.get('includeNotified')?.disabled).toBe(true); expect(component.searchForm.get('includeNotified')?.value).toBe(false);
    });
    it('should enable exclusive for Reinst', () => { component.searchForm.get('searchType')?.setValue('Reinst'); expect(component.searchForm.get('exclusive')?.enabled).toBe(true); });
    it('should disable exclusive for non-Reinst types', () => {
      component.searchForm.get('searchType')?.setValue('InterCD');
      expect(component.searchForm.get('exclusive')?.disabled).toBe(true); expect(component.searchForm.get('exclusive')?.value).toBe(false);
    });
    it('should load LOV codes for LetterID type', () => { authServiceSpy.getLovCodes.calls.reset(); component.searchForm.get('searchType')?.setValue('LetterID'); expect(authServiceSpy.getLovCodes).toHaveBeenCalledWith('LetterID'); });
    it('should load LOV codes for Reinst type', () => { authServiceSpy.getLovCodes.calls.reset(); component.searchForm.get('searchType')?.setValue('Reinst'); expect(authServiceSpy.getLovCodes).toHaveBeenCalledWith('Reinst'); });
    it('should clear code description and validated on type change', () => {
      component.codeDescription = 'existing'; component.codeValidated = true; component.lastValidatedCode = 'OLD';
      component.searchForm.get('searchType')?.setValue('All');
      expect(component.codeDescription).toBe(''); expect(component.codeValidated).toBe(false); expect(component.lastValidatedCode).toBe('');
    });
    it('should disable code for non-requiresCode types', () => { component.searchForm.get('searchType')?.setValue('Pending'); expect(component.searchForm.get('code')?.disabled).toBe(true); });
    it('should handle getLovCodes error gracefully', () => {
      authServiceSpy.getLovCodes.and.returnValue(throwError(() => new Error('fail')));
      component.searchForm.get('searchType')?.setValue('Reinst');
      expect(component.isLoadingLov).toBe(false); expect(component.lovCodes().length).toBe(0);
    });
  });

  describe('Authorize Letter Flow', () => {
    const donor = { donorId: 'DN001', donorName: 'Doe, John', lastDonationType: 'WB', lastProcCode: 'WB450', interCode: 'INT001', unitId: 'U001', letterSeqNo: 1, notificationStatus: 'AUTHZ' } as any;
    let dialogOpenSpy: jasmine.Spy;
    beforeEach(() => { dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as any); });
    it('should open dialog and refresh page on close', () => {
      authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse)); authServiceSpy.searchDonors.calls.reset();
      (component as any).authorizeLetter(donor); expect(dialogOpenSpy).toHaveBeenCalled(); expect(authServiceSpy.searchDonors).toHaveBeenCalled();
    });
  });

  describe('Communication Log Dialog', () => {
    let dialogOpenSpy: jasmine.Spy;
    beforeEach(() => { dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as any); });
    it('should open communication log dialog', () => {
      const donor = { donorId: 'DN001' } as any; (component as any).viewCommunicationLog(donor); expect(dialogOpenSpy).toHaveBeenCalled();
    });
  });

  describe('Mark No Letter Flow', () => {
    const superDonor = { donorId: 'DN001', donorName: 'Doe, John', interCode: 'INT001', unitId: 'U001', notificationStatus: 'AUTNO' } as any;
    const userDonor = { donorId: 'DN002', donorName: 'Smith, Jane', interCode: 'INT002', unitId: '', notificationStatus: 'PEND' } as any;
    let dialogOpenSpy: jasmine.Spy;
    beforeEach(() => { dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({ afterClosed: () => of(null) } as any); });
    it('should call getDonorCommunications for SUPER mode (AUTNO status)', () => {
      authServiceSpy.getDonorCommunications.and.returnValue(of([])); (component as any).markNoLetter(superDonor);
      expect(authServiceSpy.getDonorCommunications).toHaveBeenCalledWith('DN001'); expect(dialogOpenSpy).toHaveBeenCalled();
    });
    it('should extract existing NOLET comment for SUPER mode', () => {
      const comms = [{ comCode: 'NOLET', comDesc: 'User comment*20240315*SomeUser' }];
      authServiceSpy.getDonorCommunications.and.returnValue(of(comms)); (component as any).markNoLetter(superDonor);
      expect(dialogOpenSpy).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ data: jasmine.objectContaining({ existingUserComment: 'User comment' }) }));
    });
    it('should open dialog with empty comment when getDonorCommunications fails', () => {
      authServiceSpy.getDonorCommunications.and.returnValue(throwError(() => new Error('fail'))); (component as any).markNoLetter(superDonor);
      expect(dialogOpenSpy).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ data: jasmine.objectContaining({ existingUserComment: '' }) }));
    });
    it('should directly open dialog for USER mode (non-AUTNO status)', () => {
      (component as any).markNoLetter(userDonor);
      expect(authServiceSpy.getDonorCommunications).not.toHaveBeenCalled(); expect(dialogOpenSpy).toHaveBeenCalled();
    });
    it('should handle approve no letter on save in SUPER mode', () => {
      authServiceSpy.getDonorCommunications.and.returnValue(of([])); authServiceSpy.approveNoLetter.and.returnValue(of({ message: 'Approved' }));
      authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'save', supervisorComment: 'OK' }) } as any);
      (component as any).markNoLetter(superDonor);
      expect(authServiceSpy.approveNoLetter).toHaveBeenCalled(); expect(snackBar.open).toHaveBeenCalledWith('Approved', 'Close', jasmine.any(Object));
    });
    it('should show default success message for approve when no message returned', () => {
      authServiceSpy.getDonorCommunications.and.returnValue(of([])); authServiceSpy.approveNoLetter.and.returnValue(of({}));
      authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'save', supervisorComment: 'OK' }) } as any);
      (component as any).markNoLetter(superDonor);
      expect(snackBar.open).toHaveBeenCalledWith('No letter approved by supervisor.', 'Close', jasmine.any(Object));
    });
    it('should show error on approve no letter failure', () => {
      authServiceSpy.getDonorCommunications.and.returnValue(of([]));
      authServiceSpy.approveNoLetter.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Approve failed' } } })));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'save', supervisorComment: 'OK' }) } as any);
      (component as any).markNoLetter(superDonor);
      expect(snackBar.open).toHaveBeenCalledWith('Approve failed', 'Close', jasmine.any(Object));
    });
    it('should show default error on approve failure without details', () => {
      authServiceSpy.getDonorCommunications.and.returnValue(of([])); authServiceSpy.approveNoLetter.and.returnValue(throwError(() => ({ error: {} })));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'save', supervisorComment: 'OK' }) } as any);
      (component as any).markNoLetter(superDonor);
      expect(snackBar.open).toHaveBeenCalledWith('Failed to approve no letter', 'Close', jasmine.any(Object));
    });
    it('should handle mark no letter save in USER mode', () => {
      authServiceSpy.markNoLetter.and.returnValue(of({ message: 'Marked' })); authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'save', userComment: 'test comment' }) } as any);
      (component as any).markNoLetter(userDonor);
      expect(authServiceSpy.markNoLetter).toHaveBeenCalled(); expect(snackBar.open).toHaveBeenCalledWith('Marked', 'Close', jasmine.any(Object));
    });
    it('should show default success on mark no letter save when no message', () => {
      authServiceSpy.markNoLetter.and.returnValue(of({})); authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'save', userComment: '' }) } as any);
      (component as any).markNoLetter(userDonor);
      expect(snackBar.open).toHaveBeenCalledWith('Marked for no letter successfully. Awaiting supervisor approval.', 'Close', jasmine.any(Object));
    });
    it('should show error on mark no letter save failure', () => {
      authServiceSpy.markNoLetter.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Mark failed' } } })));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'save', userComment: '' }) } as any);
      (component as any).markNoLetter(userDonor);
      expect(snackBar.open).toHaveBeenCalledWith('Mark failed', 'Close', jasmine.any(Object));
    });
    it('should show default error on mark no letter failure without details', () => {
      authServiceSpy.markNoLetter.and.returnValue(throwError(() => ({ error: {} })));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'save', userComment: '' }) } as any);
      (component as any).markNoLetter(userDonor);
      expect(snackBar.open).toHaveBeenCalledWith('Failed to mark no letter', 'Close', jasmine.any(Object));
    });
    it('should handle reject action', () => {
      authServiceSpy.getDonorCommunications.and.returnValue(of([])); authServiceSpy.rejectNoLetter.and.returnValue(of({ message: 'Rejected' }));
      authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'reject' }) } as any);
      (component as any).markNoLetter(superDonor);
      expect(authServiceSpy.rejectNoLetter).toHaveBeenCalled(); expect(snackBar.open).toHaveBeenCalledWith('Rejected', 'Close', jasmine.any(Object));
    });
    it('should show default success on reject when no message', () => {
      authServiceSpy.getDonorCommunications.and.returnValue(of([])); authServiceSpy.rejectNoLetter.and.returnValue(of({}));
      authServiceSpy.searchDonors.and.returnValue(of(mockSearchResponse));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'reject' }) } as any);
      (component as any).markNoLetter(superDonor);
      expect(snackBar.open).toHaveBeenCalledWith('No-letter status rejected. Record returned to pending.', 'Close', jasmine.any(Object));
    });
    it('should show error on reject failure', () => {
      authServiceSpy.getDonorCommunications.and.returnValue(of([]));
      authServiceSpy.rejectNoLetter.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Reject failed' } } })));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'reject' }) } as any);
      (component as any).markNoLetter(superDonor);
      expect(snackBar.open).toHaveBeenCalledWith('Reject failed', 'Close', jasmine.any(Object));
    });
    it('should show default error on reject failure without details', () => {
      authServiceSpy.getDonorCommunications.and.returnValue(of([])); authServiceSpy.rejectNoLetter.and.returnValue(throwError(() => ({ error: {} })));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of({ action: 'reject' }) } as any);
      (component as any).markNoLetter(superDonor);
      expect(snackBar.open).toHaveBeenCalledWith('Failed to reject no letter', 'Close', jasmine.any(Object));
    });
    it('should do nothing when dialog is cancelled (null result)', () => {
      authServiceSpy.markNoLetter.calls.reset(); authServiceSpy.approveNoLetter.calls.reset(); authServiceSpy.rejectNoLetter.calls.reset();
      (component as any).markNoLetter(userDonor);
      expect(authServiceSpy.markNoLetter).not.toHaveBeenCalled(); expect(authServiceSpy.approveNoLetter).not.toHaveBeenCalled(); expect(authServiceSpy.rejectNoLetter).not.toHaveBeenCalled();
    });
  });

  describe('Date Cross-Validation', () => {
    it('should make startDate required when endDate has value', () => {
      component.searchForm.get('endDate')?.setValue(moment('2024-06-01'));
      const startCtrl = component.searchForm.get('startDate'); startCtrl?.setValue(null); startCtrl?.updateValueAndValidity();
      expect(startCtrl?.hasError('required')).toBe(true);
    });
    it('should make endDate required when startDate has value', () => {
      component.searchForm.get('startDate')?.setValue(moment('2024-01-01'));
      const endCtrl = component.searchForm.get('endDate'); endCtrl?.setValue(null); endCtrl?.updateValueAndValidity();
      expect(endCtrl?.hasError('required')).toBe(true);
    });
    it('should not require startDate when endDate is empty', () => {
      component.searchForm.get('endDate')?.setValue(null);
      const startCtrl = component.searchForm.get('startDate'); startCtrl?.setValue(null); startCtrl?.updateValueAndValidity();
      expect(startCtrl?.hasError('required')).toBe(false);
    });
  });
});
