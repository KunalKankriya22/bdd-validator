import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ReleaseAuditInterdictionComponent } from './release-audit-interdiction.component';
import { ReleaseAuditInterdictionService } from './release-audit-interdiction.service';
import { ReleaseInterdictionConfirmationDialogComponent } from './release-interdiction-confirmation-dialog.component';
import { RemoveInterdictionDialogComponent } from './remove-interdiction-dialog.component';
import { TerminatedInterdictionsDialogComponent } from './terminated-interdictions-dialog.component';
import {
  SearchResponseData,
  Interdiction,
  SearchRequest
} from './release-audit-interdiction.models';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('ReleaseAuditInterdictionComponent', () => {
  let component: ReleaseAuditInterdictionComponent;
  let fixture: ComponentFixture<ReleaseAuditInterdictionComponent>;
  let serviceSpy: jasmine.SpyObj<ReleaseAuditInterdictionService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let headerServiceStub: { chapterChanged$: Subject<void> };

  const mockInterdiction: Interdiction = {
    interCode: 'BPHLD',
    interType: 'HOLD S',
    effectiveDate: '2020-01-21',
    terminationDate: '2026-02-25',
    releaseDate: null,
    releasedUser: '',
    insertedUser: 'ET1234',
    originated: 'INQR',
    reason: 'TATTO',
    groupMode: '',
    groupId: 'HQ0250',
    interDescription: 'Blood Pressure Hold',
    reasonRequired: false,
    isPermanentDeferral: false,
    canRelease: true,
    canRemove: false
  };

  const mockSearchResponse: SearchResponseData = {
    donationInfo: {
      donationType: 'Allogeneic',
      procedureType: 'Whole Blood',
      driveId: 'DRV0173339',
      donorCue: 'No',
      numberOfOtherInterdictions: 1,
      collectionDate: '2025-03-15'
    },
    donorInfo: {
      name: 'Samual, Marcus',
      aboType: 'No ABO',
      dateOfBirth: '1980-03-11',
      sex: 'Male',
      donorIdNumber: 'DEF82783'
    },
    interdictions: [mockInterdiction],
    transactionId: 'TXN123456',
    donorId: 'DON123456',
    hasHiddenInterdictions: false
  };

  const mockSearchResponseWithHidden: SearchResponseData = {
    ...mockSearchResponse,
    hasHiddenInterdictions: true
  };

  function createDialogRefSpy<T>(result: T): jasmine.SpyObj<MatDialogRef<unknown>> {
    const ref = jasmine.createSpyObj<MatDialogRef<unknown>>('MatDialogRef', ['afterClosed', 'close']);
    ref.afterClosed.and.returnValue(of(result));
    return ref;
  }

  function mockUnitIdField(parsedUnitId = '12345678', valid = true): void {
    component.unitIdField = {
      isValid: valid,
      parsedUnitId,
      clear: jasmine.createSpy('clear')
    } as any;
  }

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('ReleaseAuditInterdictionService', [
      'search', 'release', 'remove', 'getTerminatedInterdictions', 'getRemovalReasons'
    ]);
    snackBarSpy = createMockMatSnackBar();
    dialogSpy = createMockMatDialog();
    headerServiceStub = { chapterChanged$: new Subject<void>() };

    serviceSpy.search.and.returnValue(of(mockSearchResponse));
    serviceSpy.release.and.returnValue(of({
      success: true, message: 'Released successfully', statusCode: 200
    } as any));
    serviceSpy.remove.and.returnValue(of({
      success: true, message: 'Removed successfully', statusCode: 200
    } as any));
    serviceSpy.getTerminatedInterdictions.and.returnValue(of([]));
    serviceSpy.getRemovalReasons.and.returnValue(of([]));

    const defaultRef = createDialogRefSpy(false);
    dialogSpy.open.and.returnValue(defaultRef);

    TestBed.configureTestingModule({
      imports: [
        ReleaseAuditInterdictionComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ReleaseAuditInterdictionService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceStub }
      ]
    })
    .overrideComponent(ReleaseAuditInterdictionComponent, {
      add: {
        providers: [
          { provide: MatDialog, useValue: dialogSpy },
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      }
    });

    fixture = TestBed.createComponent(ReleaseAuditInterdictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Initialization ─────────────────────────────────────────────

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should start with empty option', () => {
      expect(component.selectedOption()).toBe('');
    });

    it('should have required validator on id field initially', () => {
      const idControl = component.searchForm.get('id');
      expect(idControl?.hasError('required')).toBeTrue();
      idControl?.setValue('TEST123');
      expect(idControl?.hasError('required')).toBeFalse();
    });

    it('should start with loading false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should start with error null', () => {
      expect(component.error()).toBeNull();
    });

    it('should start with searchResults null', () => {
      expect(component.searchResults()).toBeNull();
    });

    it('should start with hasResults false', () => {
      expect(component.hasResults()).toBeFalse();
    });

    it('should start with isDonationOption false', () => {
      expect(component.isDonationOption()).toBeFalse();
    });

    it('should start with isDeferralOption false', () => {
      expect(component.isDeferralOption()).toBeFalse();
    });

    it('should have idMaxLength 15 by default', () => {
      expect(component.idMaxLength()).toBe(15);
    });

    it('should have empty formattedCollectionDate', () => {
      expect(component.formattedCollectionDate()).toBe('');
    });

    it('should have deferralStep as enter', () => {
      expect(component.deferralStep()).toBe('enter');
    });

    it('should have deferralMismatch false', () => {
      expect(component.deferralMismatch()).toBeFalse();
    });
  });

  // ─── Option Toggle ──────────────────────────────────────────────

  describe('Option Toggle', () => {
    it('should clear id validators when donation option selected', () => {
      component.searchForm.patchValue({ option: 'donation' });
      fixture.detectChanges();
      const idControl = component.searchForm.get('id');
      expect(idControl?.valid).toBeTrue();
    });

    it('should set deferral validators when deferral option selected', () => {
      component.searchForm.patchValue({ option: 'deferral' });
      fixture.detectChanges();
      const idControl = component.searchForm.get('id');
      expect(idControl?.hasError('required')).toBeTrue();
    });

    it('should update selectedOption signal on donation', () => {
      component.searchForm.patchValue({ option: 'donation' });
      fixture.detectChanges();
      expect(component.selectedOption()).toBe('donation');
      expect(component.isDonationOption()).toBeTrue();
      expect(component.isDeferralOption()).toBeFalse();
    });

    it('should update selectedOption signal on deferral', () => {
      component.searchForm.patchValue({ option: 'deferral' });
      fixture.detectChanges();
      expect(component.selectedOption()).toBe('deferral');
      expect(component.isDonationOption()).toBeFalse();
      expect(component.isDeferralOption()).toBeTrue();
    });

    it('should set idMaxLength 10 for deferral', () => {
      component.searchForm.patchValue({ option: 'deferral' });
      fixture.detectChanges();
      expect(component.idMaxLength()).toBe(10);
    });

    it('should set idMaxLength 15 for donation', () => {
      component.searchForm.patchValue({ option: 'donation' });
      fixture.detectChanges();
      expect(component.idMaxLength()).toBe(15);
    });

    it('should clear results when switching options', () => {
      component.searchResults.set(mockSearchResponse);
      component.searchForm.patchValue({ option: 'deferral' });
      fixture.detectChanges();
      expect(component.searchResults()).toBeNull();
    });

    it('should clear id field when switching options', () => {
      component.searchForm.patchValue({ id: '12345678' });
      component.searchForm.patchValue({ option: 'deferral' });
      fixture.detectChanges();
      expect(component.searchForm.get('id')?.value).toBe('');
    });

    it('should reset deferral state when switching options', () => {
      component.deferralStep.set('confirm');
      component.deferralMismatch.set(true);
      component.searchForm.patchValue({ option: 'donation' });
      fixture.detectChanges();
      expect(component.deferralStep()).toBe('enter');
      expect(component.deferralMismatch()).toBeFalse();
    });
  });

  // ─── Search - Donation ──────────────────────────────────────────

  describe('Search - Donation', () => {
    beforeEach(() => {
      component.searchForm.patchValue({ option: 'donation' });
      fixture.detectChanges();
    });

    it('should call service with correct donation parameters', fakeAsync(() => {
      mockUnitIdField();
      component.onRetrieve();
      tick();
      expect(serviceSpy.search).toHaveBeenCalledWith(jasmine.objectContaining({
        option: 'donation',
        unitId: '12345678'
      }));
    }));

    it('should not call service when unitIdField is invalid', fakeAsync(() => {
      mockUnitIdField('12345678', false);
      component.onRetrieve();
      tick();
      expect(serviceSpy.search).not.toHaveBeenCalled();
    }));

    it('should set loading state during search', fakeAsync(() => {
      const searchSubject = new Subject<SearchResponseData>();
      serviceSpy.search.and.returnValue(searchSubject.asObservable());
      mockUnitIdField();

      expect(component.loading()).toBeFalse();
      component.onRetrieve();
      expect(component.loading()).toBeTrue();

      searchSubject.next(mockSearchResponse);
      searchSubject.complete();
      tick();

      expect(component.loading()).toBeFalse();
    }));

    it('should populate search results on success', fakeAsync(() => {
      mockUnitIdField();
      component.onRetrieve();
      tick();
      expect(component.searchResults()).toEqual(mockSearchResponse);
      expect(component.sortedInterdictions().length).toBe(1);
      expect(component.collectionDate()).toBe('2025-03-15');
    }));

    it('should set error on search failure', fakeAsync(() => {
      serviceSpy.search.and.returnValue(throwError(() => ({
        error: { errorCode: '1230', message: 'Invalid Unit ID' }
      })));
      mockUnitIdField();
      component.onRetrieve();
      tick();
      expect(component.error()).toBe('Err:1230 - Invalid Unit ID');
      expect(component.searchResults()).toBeNull();
      expect(component.loading()).toBeFalse();
    }));

    it('should use fallback error message when no error code', fakeAsync(() => {
      serviceSpy.search.and.returnValue(throwError(() => ({
        message: 'Network error'
      })));
      mockUnitIdField();
      component.onRetrieve();
      tick();
      expect(component.error()).toBe('Network error');
    }));

    it('should use fallback message when error has no details', fakeAsync(() => {
      serviceSpy.search.and.returnValue(throwError(() => ({})));
      mockUnitIdField();
      component.onRetrieve();
      tick();
      expect(component.error()).toBe('Failed to retrieve data');
    }));

    it('should use errorResponse.error when available', fakeAsync(() => {
      serviceSpy.search.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Custom error from response' } }
      })));
      mockUnitIdField();
      component.onRetrieve();
      tick();
      expect(component.error()).toBe('Custom error from response');
    }));
  });

  // ─── Search - Deferral (double-entry) ───────────────────────────

  describe('Search - Deferral', () => {
    beforeEach(() => {
      component.searchForm.patchValue({ option: 'deferral' });
      fixture.detectChanges();
    });

    it('should not search on form invalid', fakeAsync(() => {
      component.searchForm.patchValue({ id: '' });
      component.onRetrieve();
      tick();
      expect(serviceSpy.search).not.toHaveBeenCalled();
    }));

    it('should enter confirm step on first entry', fakeAsync(() => {
      component.searchForm.patchValue({ id: 'DEF123' });
      component.onRetrieve();
      tick();
      expect(component.deferralStep()).toBe('confirm');
      expect(serviceSpy.search).not.toHaveBeenCalled();
      expect(component.searchForm.get('id')?.value).toBe('');
    }));

    it('should call service when confirm matches', fakeAsync(() => {
      component.searchForm.patchValue({ id: 'DEF123' });
      component.onRetrieve();
      tick();

      component.searchForm.patchValue({ id: 'DEF123' });
      component.onRetrieve();
      tick();

      expect(serviceSpy.search).toHaveBeenCalledWith(jasmine.objectContaining({
        option: 'deferral',
        deferralId: 'DEF123'
      }));
    }));

    it('should set deferralMismatch when confirm does not match', fakeAsync(() => {
      component.searchForm.patchValue({ id: 'DEF123' });
      component.onRetrieve();
      tick();

      component.searchForm.patchValue({ id: 'DEF456' });
      component.onRetrieve();
      tick();

      expect(component.deferralMismatch()).toBeTrue();
      expect(serviceSpy.search).not.toHaveBeenCalled();
    }));

    it('should clear deferralMismatch when id value changes', fakeAsync(() => {
      component.deferralMismatch.set(true);
      component.searchForm.get('id')?.setValue('NEW');
      fixture.detectChanges();
      tick();
      expect(component.deferralMismatch()).toBeFalse();
    }));

    it('should strip barcode control chars from deferral ID', fakeAsync(() => {
      component.searchForm.patchValue({ id: '\x01DEF123\x0D' });
      component.onRetrieve();
      tick();

      component.searchForm.patchValue({ id: '\x01DEF123\x0D' });
      component.onRetrieve();
      tick();

      expect(serviceSpy.search).toHaveBeenCalledWith(jasmine.objectContaining({
        deferralId: 'DEF123'
      }));
    }));
  });

  // ─── Release Functionality ──────────────────────────────────────

  describe('Release Functionality', () => {
    beforeEach(() => {
      component.searchResults.set(mockSearchResponse);
    });

    it('should open release confirmation dialog', fakeAsync(() => {
      const ref = createDialogRefSpy(false);
      dialogSpy.open.and.returnValue(ref);

      component.onRelease(mockInterdiction);
      tick();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ReleaseInterdictionConfirmationDialogComponent,
        jasmine.objectContaining({ width: '490px', data: { interdiction: mockInterdiction } })
      );
    }));

    it('should call release service when dialog confirmed', fakeAsync(() => {
      const ref = createDialogRefSpy(true);
      dialogSpy.open.and.returnValue(ref);

      component.onRelease(mockInterdiction);
      tick();

      expect(serviceSpy.release).toHaveBeenCalledWith(jasmine.objectContaining({
        transactionId: 'TXN123456',
        interCode: 'BPHLD',
        interType: 'HOLD S'
      }));
    }));

    it('should not call release service when dialog cancelled', fakeAsync(() => {
      const ref = createDialogRefSpy(false);
      dialogSpy.open.and.returnValue(ref);

      component.onRelease(mockInterdiction);
      tick();

      expect(serviceSpy.release).not.toHaveBeenCalled();
    }));

    it('should show success snackbar after release', fakeAsync(() => {
      const ref = createDialogRefSpy(true);
      dialogSpy.open.and.returnValue(ref);

      component.onRelease(mockInterdiction);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Released successfully', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));

    it('should set loading false after release completes', fakeAsync(() => {
      const ref = createDialogRefSpy(true);
      dialogSpy.open.and.returnValue(ref);

      component.onRelease(mockInterdiction);
      tick();

      expect(component.loading()).toBeFalse();
    }));

    it('should show error snackbar on release failure', fakeAsync(() => {
      serviceSpy.release.and.returnValue(throwError(() => ({
        error: { errorCode: '16112', message: 'Not found' }
      })));
      const ref = createDialogRefSpy(true);
      dialogSpy.open.and.returnValue(ref);

      component.onRelease(mockInterdiction);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('16112'),
        'Close',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.loading()).toBeFalse();
    }));

    it('should not perform release if searchResults is null', fakeAsync(() => {
      component.searchResults.set(null);
      const ref = createDialogRefSpy(true);
      dialogSpy.open.and.returnValue(ref);

      component.onRelease(mockInterdiction);
      tick();

      expect(serviceSpy.release).not.toHaveBeenCalled();
    }));

    it('should build release request with correct transactionId', fakeAsync(() => {
      const ref = createDialogRefSpy(true);
      dialogSpy.open.and.returnValue(ref);

      component.onRelease(mockInterdiction);
      tick();

      expect(serviceSpy.release).toHaveBeenCalledWith(jasmine.objectContaining({
        transactionId: 'TXN123456'
      }));
    }));
  });

  // ─── Remove Functionality ───────────────────────────────────────

  describe('Remove Functionality', () => {
    beforeEach(() => {
      component.searchResults.set(mockSearchResponse);
    });

    it('should open remove dialog', fakeAsync(() => {
      const ref = createDialogRefSpy(null);
      dialogSpy.open.and.returnValue(ref);

      component.onRemove(mockInterdiction);
      tick();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        RemoveInterdictionDialogComponent,
        jasmine.objectContaining({
          width: '450px',
          data: { interdiction: mockInterdiction, reasonRequired: mockInterdiction.reasonRequired }
        })
      );
    }));

    it('should call remove service when dialog confirmed', fakeAsync(() => {
      const ref = createDialogRefSpy({
        confirmed: true,
        reasonCode: 'RCODE',
        termDate: '2026-07-16'
      });
      dialogSpy.open.and.returnValue(ref);

      component.onRemove(mockInterdiction);
      tick();

      expect(serviceSpy.remove).toHaveBeenCalledWith(jasmine.objectContaining({
        transactionId: 'TXN123456',
        interCode: 'BPHLD',
        termDate: '2026-07-16',
        removalReasonCode: 'RCODE'
      }));
    }));

    it('should not call remove service when dialog cancelled', fakeAsync(() => {
      const ref = createDialogRefSpy(null);
      dialogSpy.open.and.returnValue(ref);

      component.onRemove(mockInterdiction);
      tick();

      expect(serviceSpy.remove).not.toHaveBeenCalled();
    }));

    it('should show success snackbar after remove', fakeAsync(() => {
      const ref = createDialogRefSpy({
        confirmed: true,
        reasonCode: null,
        termDate: '2026-07-16'
      });
      dialogSpy.open.and.returnValue(ref);

      component.onRemove(mockInterdiction);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Interdiction removed successfully', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));

    it('should show error snackbar on remove failure', fakeAsync(() => {
      serviceSpy.remove.and.returnValue(throwError(() => ({
        error: { message: 'Remove failed' }
      })));
      const ref = createDialogRefSpy({
        confirmed: true,
        reasonCode: null,
        termDate: '2026-07-16'
      });
      dialogSpy.open.and.returnValue(ref);

      component.onRemove(mockInterdiction);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Remove failed', 'Close',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.loading()).toBeFalse();
    }));

    it('should not perform remove if searchResults is null', fakeAsync(() => {
      component.searchResults.set(null);
      const ref = createDialogRefSpy({ confirmed: true, reasonCode: null, termDate: '2026-07-16' });
      dialogSpy.open.and.returnValue(ref);

      component.onRemove(mockInterdiction);
      tick();

      expect(serviceSpy.remove).not.toHaveBeenCalled();
    }));

    it('should pass null reasonCode when not provided', fakeAsync(() => {
      const ref = createDialogRefSpy({
        confirmed: true,
        reasonCode: null,
        termDate: '2026-07-16'
      });
      dialogSpy.open.and.returnValue(ref);

      component.onRemove(mockInterdiction);
      tick();

      expect(serviceSpy.remove).toHaveBeenCalledWith(jasmine.objectContaining({
        removalReasonCode: null
      }));
    }));
  });

  // ─── Show Terminated ────────────────────────────────────────────

  describe('Show Terminated', () => {
    beforeEach(() => {
      component.searchResults.set(mockSearchResponse);
    });

    it('should open terminated dialog', fakeAsync(() => {
      const ref = createDialogRefSpy(null);
      dialogSpy.open.and.returnValue(ref);

      component.onShowTerminated();
      tick();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        TerminatedInterdictionsDialogComponent,
        jasmine.objectContaining({
          width: '900px',
          data: { transactionId: 'TXN123456' }
        })
      );
    }));

    it('should perform release when terminated dialog returns release action', fakeAsync(() => {
      const ref = createDialogRefSpy({
        action: 'release',
        interdiction: mockInterdiction
      });
      dialogSpy.open.and.returnValue(ref);

      component.onShowTerminated();
      tick();

      expect(serviceSpy.release).toHaveBeenCalled();
    }));

    it('should not perform release when terminated dialog returns null', fakeAsync(() => {
      const ref = createDialogRefSpy(null);
      dialogSpy.open.and.returnValue(ref);

      component.onShowTerminated();
      tick();

      expect(serviceSpy.release).not.toHaveBeenCalled();
    }));

    it('should do nothing if searchResults is null', fakeAsync(() => {
      component.searchResults.set(null);

      component.onShowTerminated();
      tick();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));
  });

  // ─── Sorting ────────────────────────────────────────────────────

  describe('Sorting', () => {
    beforeEach(() => {
      const multiResponse: SearchResponseData = {
        ...mockSearchResponse,
        interdictions: [
          { ...mockInterdiction, interCode: 'ZZZ' },
          { ...mockInterdiction, interCode: 'AAA' }
        ]
      };
      component.searchResults.set(multiResponse);
      component.sortedInterdictions.set(multiResponse.interdictions);
    });

    it('should sort ascending', () => {
      component.onInterdictionSort({ column: 'interCode', direction: 'A' });
      const codes = component.sortedInterdictions().map(i => i.interCode);
      expect(codes[0]).toBe('AAA');
      expect(codes[1]).toBe('ZZZ');
    });

    it('should sort descending', () => {
      component.onInterdictionSort({ column: 'interCode', direction: 'D' });
      const codes = component.sortedInterdictions().map(i => i.interCode);
      expect(codes[0]).toBe('ZZZ');
      expect(codes[1]).toBe('AAA');
    });

    it('should reset to default order', () => {
      component.onInterdictionSort({ column: 'interCode', direction: 'default' });
      const results = component.searchResults();
      expect(component.sortedInterdictions()).toEqual(results!.interdictions);
    });

    it('should update table config on sort', () => {
      component.onInterdictionSort({ column: 'interCode', direction: 'A' });
      expect(component.interdictionTableConfig.sortConfig).toEqual({
        column: 'interCode', direction: 'A'
      });
    });
  });

  // ─── Interdiction Action Dispatch ───────────────────────────────

  describe('Interdiction Action Dispatch', () => {
    beforeEach(() => {
      component.searchResults.set(mockSearchResponse);
    });

    it('should dispatch release action', fakeAsync(() => {
      const ref = createDialogRefSpy(false);
      dialogSpy.open.and.returnValue(ref);

      component.onInterdictionAction({ action: 'release', row: mockInterdiction });
      tick();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ReleaseInterdictionConfirmationDialogComponent,
        jasmine.anything()
      );
    }));

    it('should dispatch remove action', fakeAsync(() => {
      const ref = createDialogRefSpy(null);
      dialogSpy.open.and.returnValue(ref);

      component.onInterdictionAction({ action: 'remove', row: mockInterdiction });
      tick();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        RemoveInterdictionDialogComponent,
        jasmine.anything()
      );
    }));
  });

  // ─── Clear ──────────────────────────────────────────────────────

  describe('Clear', () => {
    it('should reset form on clear', () => {
      component.searchForm.patchValue({ option: 'donation', id: '123' });
      component.searchResults.set(mockSearchResponse);
      component.selectedOption.set('donation');
      component.collectionDate.set('2025-03-15');

      component.onClear();

      expect(component.searchForm.get('option')?.value).toBe('');
      expect(component.searchForm.get('id')?.value).toBe('');
      expect(component.selectedOption()).toBe('');
      expect(component.searchResults()).toBeNull();
      expect(component.collectionDate()).toBe('');
      expect(component.error()).toBeNull();
      expect(component.deferralStep()).toBe('enter');
      expect(component.deferralMismatch()).toBeFalse();
    });
  });

  // ─── Chapter Changed ───────────────────────────────────────────

  describe('Chapter Changed', () => {
    it('should clear on chapter change', () => {
      component.searchResults.set(mockSearchResponse);
      component.selectedOption.set('donation');

      headerServiceStub.chapterChanged$.next();

      expect(component.searchResults()).toBeNull();
      expect(component.selectedOption()).toBe('');
    });
  });

  // ─── Date Formatting ───────────────────────────────────────────

  describe('Date Formatting', () => {
    it('should format valid date to DD-MMM-YYYY', () => {
      expect(component.formatDate('2026-05-06')).toBe('06-MAY-2026');
    });

    it('should return raw string for invalid date', () => {
      expect(component.formatDate('invalid')).toBe('invalid');
    });

    it('should format collection date signal', () => {
      component.collectionDate.set('2025-03-15');
      expect(component.formattedCollectionDate()).toBe('15-MAR-2025');
    });

    it('should return empty for empty collection date', () => {
      component.collectionDate.set('');
      expect(component.formattedCollectionDate()).toBe('');
    });
  });

  // ─── Unit Validation Callback ──────────────────────────────────

  describe('Unit Validation', () => {
    it('should handle onUnitValidated', () => {
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });

    it('should clear results on unit cleared', () => {
      component.searchResults.set(mockSearchResponse);
      component.onUnitCleared();
      expect(component.searchResults()).toBeNull();
    });
  });

  // ─── Deferral Focus Hack ───────────────────────────────────────

  describe('Deferral Focus Hack', () => {
    it('should sync input value with form value', () => {
      component.searchForm.patchValue({ id: 'ABC' });
      const mockEvent = {
        target: { value: 'XYZ' }
      } as any;
      component.deferralFocusHack(mockEvent);
      expect(mockEvent.target.value).toBe('ABC');
    });

    it('should not overwrite when input is empty', () => {
      component.searchForm.patchValue({ id: 'ABC' });
      const mockEvent = {
        target: { value: '' }
      } as any;
      component.deferralFocusHack(mockEvent);
      expect(mockEvent.target.value).toBe('');
    });

    it('should not overwrite when values match', () => {
      component.searchForm.patchValue({ id: 'ABC' });
      const mockEvent = {
        target: { value: 'ABC' }
      } as any;
      component.deferralFocusHack(mockEvent);
      expect(mockEvent.target.value).toBe('ABC');
    });
  });

  // ─── ngOnDestroy ────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // ─── UI Display ─────────────────────────────────────────────────

  describe('UI Display', () => {
    it('should show unit-id-field when donation option selected', () => {
      component.searchForm.patchValue({ option: 'donation' });
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('app-unit-id-field'))).toBeTruthy();
    });

    it('should show deferral input when deferral option selected', () => {
      component.searchForm.patchValue({ option: 'deferral' });
      fixture.detectChanges();
      const input = fixture.debugElement.query(By.css('input[formControlName="id"]'));
      expect(input).toBeTruthy();
      expect(input.nativeElement.type).toBe('text');
      expect(input.nativeElement.classList).toContain('concealed-input');
    });

    it('should show re-enter label in confirm step', () => {
      component.searchForm.patchValue({ option: 'deferral' });
      component.deferralStep.set('confirm');
      fixture.detectChanges();
      const labels = fixture.debugElement.queryAll(By.css('mat-label'));
      const reenterLabel = labels.find(l => l.nativeElement.textContent.includes('Re-enter'));
      expect(reenterLabel).toBeTruthy();
    });

    it('should show mismatch error', () => {
      component.searchForm.patchValue({ option: 'deferral' });
      component.deferralMismatch.set(true);
      component.searchForm.get('id')?.markAsTouched();
      fixture.detectChanges();
      const errors = fixture.debugElement.queryAll(By.css('mat-error'));
      const mismatchError = errors.find(e => e.nativeElement.textContent.includes('do not match'));
      expect(mismatchError).toBeTruthy();
    });

    it('should show empty state initially', () => {
      expect(fixture.debugElement.query(By.css('.empty-state'))).toBeTruthy();
    });

    it('should display error message when error exists', () => {
      component.error.set('Test error message');
      fixture.detectChanges();
      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Test error message');
    });

    it('should display results when search is successful', () => {
      component.searchResults.set(mockSearchResponse);
      component.loading.set(false);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.data-container'))).toBeTruthy();
    });

    it('should display interdiction section with data-table', () => {
      component.searchResults.set(mockSearchResponse);
      component.loading.set(false);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.interdiction-card'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('app-data-table'))).toBeTruthy();
    });

    it('should show warning banner when hidden interdictions exist', () => {
      component.searchResults.set(mockSearchResponseWithHidden);
      component.loading.set(false);
      fixture.detectChanges();
      const banner = fixture.debugElement.query(By.css('.warning-banner'));
      expect(banner).toBeTruthy();
      expect(banner.nativeElement.textContent).toContain('Additional interdictions');
    });

    it('should not show warning banner when no hidden interdictions', () => {
      component.searchResults.set(mockSearchResponse);
      component.loading.set(false);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.warning-banner'))).toBeFalsy();
    });

    it('should show loading spinner during search', () => {
      component.loading.set(true);
      component.searchResults.set(null);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('mat-spinner'))).toBeTruthy();
    });

    it('should display collection date when available', () => {
      component.searchResults.set(mockSearchResponse);
      component.collectionDate.set('2025-03-15');
      component.loading.set(false);
      fixture.detectChanges();
      const dateField = fixture.debugElement.query(By.css('.collection-date-field .field-value'));
      expect(dateField?.nativeElement.textContent).toContain('15-MAR-2025');
    });

    it('should display donation info fields', () => {
      component.searchResults.set(mockSearchResponse);
      component.loading.set(false);
      fixture.detectChanges();
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      const texts = values.map(v => v.nativeElement.textContent.trim());
      expect(texts).toContain('Allogeneic');
      expect(texts).toContain('Whole Blood');
    });

    it('should display donor info fields', () => {
      component.searchResults.set(mockSearchResponse);
      component.loading.set(false);
      fixture.detectChanges();
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      const texts = values.map(v => v.nativeElement.textContent.trim());
      expect(texts).toContain('Samual, Marcus');
      expect(texts).toContain('Male');
    });

    it('should disable retrieve button when loading', () => {
      component.searchForm.patchValue({ option: 'donation' });
      component.loading.set(true);
      fixture.detectChanges();
      const btn = fixture.debugElement.query(By.css('.retrieve-button'));
      expect(btn.nativeElement.disabled).toBeTrue();
    });
  });

  // ─── Form accessor ─────────────────────────────────────────────

  describe('Form accessor', () => {
    it('should return form controls via f getter', () => {
      expect(component.f['option']).toBe(component.searchForm.get('option'));
      expect(component.f['id']).toBe(component.searchForm.get('id'));
    });
  });

  // ─── Date Input Handling ────────────────────────────────────────

  describe('Date Input Handling', () => {
    it('should reformat valid date on blur', () => {
      const control = component.searchForm.get('collDate');
      const dateVal = moment('2026-01-15', 'YYYY-MM-DD');
      control?.setValue(dateVal);
      control?.updateValueAndValidity();
      if (control?.valid) {
        component.onDateInputBlur('collDate');
        expect(control?.value).toBeTruthy();
      } else {
        component.onDateInputBlur('collDate');
        expect(control?.value).toEqual(dateVal);
      }
    });

    it('should do nothing on blur when control is null', () => {
      expect(() => component.onDateInputBlur('nonExistent')).not.toThrow();
    });

    it('should do nothing on blur when value is empty', () => {
      component.searchForm.get('collDate')?.setValue(null);
      component.onDateInputBlur('collDate');
      expect(component.searchForm.get('collDate')?.value).toBeNull();
    });

    it('should return empty for untouched collDate error', () => {
      expect(component.getCollDateError()).toBe('');
    });

    it('should return error for invalid date format', () => {
      const control = component.searchForm.get('collDate');
      control?.setValue('invalid');
      control?.markAsTouched();
      control?.setErrors({ invalidDateFormat: true });
      expect(component.getCollDateError()).toBe('Collection Date is invalid');
    });

    it('should return error for invalid date', () => {
      const control = component.searchForm.get('collDate');
      control?.setValue('invalid');
      control?.markAsTouched();
      control?.setErrors({ invalidDate: true });
      expect(component.getCollDateError()).toBe('Collection Date is invalid');
    });

    it('should return error for matDatepickerParse error', () => {
      const control = component.searchForm.get('collDate');
      control?.setValue('xyz');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: { text: 'xyz' } });
      expect(component.getCollDateError()).toBe('Collection Date is invalid');
    });

    it('should return error state from collDateErrorMatcher when control is invalid', () => {
      const control = component.searchForm.get('collDate') as any;
      control?.setValue('bad');
      control?.markAsTouched();
      control?.setErrors({ invalidDate: true });
      expect(component.collDateErrorMatcher.isErrorState(control, null)).toBeTrue();
    });

    it('should not return error state from collDateErrorMatcher when control is valid', () => {
      const control = component.searchForm.get('collDate') as any;
      control?.setValue(null);
      control?.markAsUntouched();
      expect(component.collDateErrorMatcher.isErrorState(control, null)).toBeFalse();
    });

    it('should return false from collDateErrorMatcher when control is null', () => {
      expect(component.collDateErrorMatcher.isErrorState(null, null)).toBeFalse();
    });
  });

  // ─── Branch coverage: null/undefined fallbacks ─────────────────

  describe('Branch Coverage - Null Fallbacks', () => {
    it('should handle search response with null interdictions', fakeAsync(() => {
      const responseNoInterdictions: SearchResponseData = {
        ...mockSearchResponse,
        interdictions: null as any,
        donationInfo: { ...mockSearchResponse.donationInfo, collectionDate: null as any }
      };
      serviceSpy.search.and.returnValue(of(responseNoInterdictions));

      component.searchForm.patchValue({ option: 'donation' });
      fixture.detectChanges();
      mockUnitIdField();

      component.onRetrieve();
      tick();

      expect(component.sortedInterdictions()).toEqual([]);
      expect(component.collectionDate()).toBe('');
    }));

    it('should handle search response with missing donationInfo', fakeAsync(() => {
      const responseNoDonation: SearchResponseData = {
        ...mockSearchResponse,
        donationInfo: null as any
      };
      serviceSpy.search.and.returnValue(of(responseNoDonation));

      component.searchForm.patchValue({ option: 'donation' });
      fixture.detectChanges();
      mockUnitIdField();

      component.onRetrieve();
      tick();

      expect(component.collectionDate()).toBe('');
    }));

    it('should handle release with empty/undefined interdiction fields', fakeAsync(() => {
      component.searchResults.set(mockSearchResponse);

      const interWithNulls: Interdiction = {
        interCode: 'TST',
        interType: 'TYPE',
        effectiveDate: '2020-01-01',
        terminationDate: '',
        releaseDate: null,
        releasedUser: '',
        insertedUser: 'USR',
        originated: '',
        reason: '',
        groupMode: '',
        groupId: '',
        canRelease: true
      };

      const ref = createDialogRefSpy(true);
      dialogSpy.open.and.returnValue(ref);
      component.onRelease(interWithNulls);
      tick();

      expect(serviceSpy.release).toHaveBeenCalledWith(jasmine.objectContaining({
        terminationDate: null,
        originatedFrom: null,
        reasonCode: null,
        groupId: null,
        groupMode: null
      }));
    }));

    it('should handle remove with null optional fields in response', fakeAsync(() => {
      const responseNoDriveId: SearchResponseData = {
        ...mockSearchResponse,
        donationInfo: { ...mockSearchResponse.donationInfo, driveId: '' }
      };
      component.searchResults.set(responseNoDriveId);

      const interNoOptionals: Interdiction = {
        ...mockInterdiction,
        originated: '',
        reason: '',
        groupMode: '',
        groupId: ''
      };

      const ref = createDialogRefSpy({
        confirmed: true,
        reasonCode: 'RSN1',
        termDate: '2026-08-01'
      });
      dialogSpy.open.and.returnValue(ref);

      component.onRemove(interNoOptionals);
      tick();

      expect(serviceSpy.remove).toHaveBeenCalledWith(jasmine.objectContaining({
        originatedFrom: null,
        reasonCode: null,
        groupMode: null,
        groupId: null,
        removalReasonCode: 'RSN1'
      }));
    }));

    it('should handle deferralMismatch with empty id value change', fakeAsync(() => {
      component.deferralMismatch.set(true);
      component.searchForm.get('id')?.setValue('');
      fixture.detectChanges();
      tick();
      expect(component.deferralMismatch()).toBeTrue();
    }));

    it('should handle stripBarcodeCodes with empty value', fakeAsync(() => {
      component.searchForm.patchValue({ option: 'deferral' });
      fixture.detectChanges();

      component.searchForm.patchValue({ id: '' });
      component.onRetrieve();
      tick();

      expect(serviceSpy.search).not.toHaveBeenCalled();
    }));

    it('should handle deferralFocusHack when form id is null', () => {
      component.searchForm.get('id')?.setValue(null);
      const mockEvent = { target: { value: 'XYZ' } } as any;
      component.deferralFocusHack(mockEvent);
      expect(mockEvent.target.value).toBe('');
    });

    it('should handle sort with null values in column', () => {
      const responseNullValues: SearchResponseData = {
        ...mockSearchResponse,
        interdictions: [
          { ...mockInterdiction, reason: '' },
          { ...mockInterdiction, reason: null as any }
        ]
      };
      component.searchResults.set(responseNullValues);
      component.sortedInterdictions.set(responseNullValues.interdictions);

      component.onInterdictionSort({ column: 'reason', direction: 'A' });

      expect(component.sortedInterdictions().length).toBe(2);
    });

    it('should handle release request with undefined terminationDate', fakeAsync(() => {
      component.searchResults.set(mockSearchResponse);

      const interUndefined: Interdiction = {
        ...mockInterdiction,
        terminationDate: undefined as any,
        originated: undefined as any,
        reason: undefined as any,
        groupMode: undefined as any,
        groupId: undefined as any
      };

      const ref = createDialogRefSpy(true);
      dialogSpy.open.and.returnValue(ref);
      component.onRelease(interUndefined);
      tick();

      expect(serviceSpy.release).toHaveBeenCalledWith(jasmine.objectContaining({
        terminationDate: null,
        originatedFrom: null,
        reasonCode: null,
        groupId: null,
        groupMode: null
      }));
    }));

    it('should handle remove with empty collectionDate in donationInfo', fakeAsync(() => {
      const responseNullColl: SearchResponseData = {
        ...mockSearchResponse,
        donationInfo: { ...mockSearchResponse.donationInfo, collectionDate: '' }
      };
      component.searchResults.set(responseNullColl);

      const ref = createDialogRefSpy({
        confirmed: true,
        reasonCode: null,
        termDate: '2026-08-01'
      });
      dialogSpy.open.and.returnValue(ref);

      component.onRemove(mockInterdiction);
      tick();

      expect(serviceSpy.remove).toHaveBeenCalledWith(jasmine.objectContaining({
        collDate: null
      }));
    }));
  });
});
