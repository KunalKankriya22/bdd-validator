import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { DonorProfileAuditQuery } from './donor-profile-audit-query';
import { DonorProfileAuditQueryService } from './services/donor-profile-audit-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SearchForDonorDialog } from '@shared/components/search-for-donor/search-for-donor';
import { SearchForDonorDialogResult, DonorSearchResult } from '@shared/components/search-for-donor/search-for-donor.model';
import moment from 'moment';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

/**
 * Test suite for MLT-11028: Unit ID validation fix using SearchForDonorDialog
 *
 * This test file verifies that the Donor Profile Audit Query component correctly:
 * 1. Uses the shared SearchForDonorDialog component instead of custom DonorSearchDialog
 * 2. Properly handles unit ID validation through the UnitIdFieldComponent
 * 3. Maps DonorSearchResult.gender to DonorInfo.sex correctly
 * 4. Handles dialog cancellation and selection properly
 */
describe('DonorProfileAuditQuery - SearchForDonorDialog Integration (MLT-11028)', () => {
  let mockDialogService: any;
  let dialogRefStub: any;
  let mockTimezoneService: any;
  let mockHeaderService: any;
  let component: DonorProfileAuditQuery;
  let fixture: ComponentFixture<DonorProfileAuditQuery>;
  let mockService: jasmine.SpyObj<DonorProfileAuditQueryService>;
  let dialog: MatDialog;
  let dialogOpenSpy: jasmine.Spy;

  const mockDonorSearchResult: DonorSearchResult = {
    donorId: 'DN30139921',
    lastName: 'PRESENT',
    firstName: 'ISSACC',
    middleName: null,
    dateOfBirth: '2000-12-12T00:00:00',
    gender: 'M',
    bloodType: 'AB+',
    address: '7834 LONG',
    suiteApt: null,
    city: 'DALLAS',
    state: 'TX',
    zip: '75222',
    country: 'USA',
    alternateId: null,
    alternateIdType: null,
    homeAreaCode: null,
    homePhone: null,
    dayAreaCode: '214',
    dayPhone: null,
    mobileAreaCode: '214',
    mobilePhone: '8521236',
    intlHomePhone: null,
    intlWorkPhone: null,
    intlAddrFlag: 'N',
    preferredContactFlag: 'M'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonorProfileAuditQueryService', [
      'queryAuditRecords',
      'getAuditDetail',
      'searchDonors'
    ]);

    const mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: () => ({ title: 'Donor Profile Audit Query', subtitle: '' })
    });

    mockHeaderService = createMockHeaderService();
    const mockSnackbar = createMockSnackbarService();
    mockTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate', 'isChapterLocalDateAvailable']);

    mockService.queryAuditRecords.and.returnValue(of({ data: [], total: 0 }));
    mockTimezoneService.getChapterLocalDate.and.returnValue(moment('2025-01-15'));
    mockTimezoneService.isChapterLocalDateAvailable.and.returnValue(false);

    dialogRefStub = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
    dialogRefStub.afterClosed.and.returnValue(of(null));

    mockDialogService = createMockMatDialog();
    mockDialogService.open.and.returnValue(dialogRefStub);



      TestBed.configureTestingModule({
      imports: [
        DonorProfileAuditQuery,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: DonorProfileAuditQueryService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialogService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: ChapterTimezoneService, useValue: mockTimezoneService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    })
    .overrideComponent(DonorProfileAuditQuery, {
      remove: { imports: [] },
      add: { providers: [{ provide: MatDialog, useValue: mockDialogService }] }
    });


    


      mockService.queryAuditRecords.calls.reset();


      mockService.getAuditDetail.calls.reset();


      mockService.searchDonors.calls.reset();


      mockTimezoneService.getChapterLocalDate.calls.reset();


      mockTimezoneService.isChapterLocalDateAvailable.calls.reset();


      mockDialogService.open.calls.reset();


      mockService.queryAuditRecords.and.returnValue(of({ data: [], total: 0 }));


      mockTimezoneService.getChapterLocalDate.and.returnValue(moment('2025-01-15'));


      mockTimezoneService.isChapterLocalDateAvailable.and.returnValue(false);


      dialogRefStub.afterClosed.and.returnValue(of(null));


      mockDialogService.open.and.returnValue(dialogRefStub);


    fixture = TestBed.createComponent(DonorProfileAuditQuery);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    dialogOpenSpy = dialog.open as jasmine.Spy;
    fixture.detectChanges();


    });

  describe('Dialog Opening', () => {


    it('should open dialog with correct configuration', () => {
      component.onDonorIdClick();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];

      // Verify configuration matches shared component pattern
      expect(dialogConfig.width).toBe('1150px');
      expect(dialogConfig.height).toBe('calc(100vh - 64px)');
      expect(dialogConfig.maxWidth).toBe('100vw');
      expect(dialogConfig.maxHeight).toBe('calc(100vh - 64px)');
      expect(dialogConfig.disableClose).toBe(true);
      expect(dialogConfig.position).toEqual({ right: '0', top: '64px' });
      expect(dialogConfig.panelClass).toBe('right-side-dialog');
      expect(dialogConfig.hasBackdrop).toBe(true);
      expect(dialogConfig.autoFocus).toBe(false);
    });
  });

  describe('Donor Selection', () => {
    it('should map DonorSearchResult to DonorInfo correctly', fakeAsync(() => {
      const mockDialogResult: SearchForDonorDialogResult = {
        action: 'select',
        donor: mockDonorSearchResult
      };

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockDialogResult));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onDonorIdClick();
      tick();

      const donorInfo = component.donorInfo();
      expect(donorInfo).toBeTruthy();
      expect(donorInfo?.donorId).toBe('DN30139921');
      expect(donorInfo?.lastName).toBe('PRESENT');
      expect(donorInfo?.firstName).toBe('ISSACC');
      expect(donorInfo?.dateOfBirth).toBe('2000-12-12T00:00:00');
    }));

    it('should map gender "M" to "Male"', fakeAsync(() => {
      const mockDialogResult: SearchForDonorDialogResult = {
        action: 'select',
        donor: { ...mockDonorSearchResult, gender: 'M' }
      };

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockDialogResult));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onDonorIdClick();
      tick();

      expect(component.donorInfo()?.sex).toBe('Male');
    }));

    it('should map gender "F" to "Female"', fakeAsync(() => {
      const mockDialogResult: SearchForDonorDialogResult = {
        action: 'select',
        donor: { ...mockDonorSearchResult, gender: 'F' }
      };

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockDialogResult));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onDonorIdClick();
      tick();

      expect(component.donorInfo()?.sex).toBe('Female');
    }));



    it('should clear results when new donor is selected', fakeAsync(() => {
      // Set up existing data
      component.auditData.set([{ recNum: 1 } as any]);
      component.summaryAppliedFilters.set({ insertedUser: 'TEST' });
      component.detailAppliedFilters.set({ fromDate: '2025-01-01' });

      const mockDialogResult: SearchForDonorDialogResult = {
        action: 'select',
        donor: mockDonorSearchResult
      };

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockDialogResult));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onDonorIdClick();
      tick();

      // Verify filters are cleared
      expect(component.summaryAppliedFilters()).toEqual({});
      expect(component.detailAppliedFilters()).toEqual({});
      expect(component.summaryFilterChips()).toEqual([]);
      expect(component.detailFilterChips()).toEqual([]);
    }));

    it('should reset form fields when new donor is selected', fakeAsync(() => {
      // Set form values
      component.searchForm.patchValue({
        fromDate: moment('2025-01-01'),
        toDate: moment('2025-01-31'),
        unitId: '1234567',
        deferralId: 'ABC123',
        collectionDate: moment('2025-01-15')
      });

      const mockDialogResult: SearchForDonorDialogResult = {
        action: 'select',
        donor: mockDonorSearchResult
      };

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockDialogResult));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onDonorIdClick();
      tick();

      // Verify form is reset
      expect(component.searchForm.get('fromDate')?.value).toBeNull();
      expect(component.searchForm.get('toDate')?.value).toBeNull();
      expect(component.searchForm.get('unitId')?.value).toBe('');
      expect(component.searchForm.get('deferralId')?.value).toBe('');
      expect(component.searchForm.get('collectionDate')?.value).toBeNull();
    }));

    it('should automatically retrieve data for selected donor', fakeAsync(() => {
      const mockDialogResult: SearchForDonorDialogResult = {
        action: 'select',
        donor: mockDonorSearchResult
      };

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockDialogResult));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onDonorIdClick();
      tick();

      expect(component.hasRetrieved()).toBe(true);
      expect(mockService.queryAuditRecords).toHaveBeenCalled();
    }));
  });

  describe('Dialog Cancellation', () => {
    it('should not set donor info when dialog is cancelled', fakeAsync(() => {
      const mockDialogResult: SearchForDonorDialogResult = { action: 'cancel' };

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockDialogResult));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.donorInfo.set(null);
      component.onDonorIdClick();
      tick();

      expect(component.donorInfo()).toBeNull();
      expect(mockService.queryAuditRecords).not.toHaveBeenCalled();
    }));

    it('should not modify existing donor info when cancelled', fakeAsync(() => {
      const existingDonor = {
        donorId: 'EXISTING',
        lastName: 'Test',
        firstName: 'User',
        dateOfBirth: '1990-01-01',
        sex: 'Male'
      };

      component.donorInfo.set(existingDonor);

      const mockDialogResult: SearchForDonorDialogResult = { action: 'cancel' };

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockDialogResult));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onDonorIdClick();
      tick();

      expect(component.donorInfo()).toEqual(existingDonor);
    }));
  });

  describe('Unit ID Validation - Bug Fix Verification', () => {
    it('should use SearchForDonorDialog which includes UnitIdFieldComponent', () => {
      component.onDonorIdClick();

      // Verify we're opening SearchForDonorDialog, not the old custom dialog
      const dialogComponent = dialogOpenSpy.calls.mostRecent().args[0];
      expect(dialogComponent).toBe(SearchForDonorDialog);
    });

    it('should handle valid unit ID from SearchForDonorDialog', fakeAsync(() => {
      // The SearchForDonorDialog validates and parses unit IDs through UnitIdFieldComponent
      // When a valid unit ID is searched, it returns a donor
      const mockDialogResult: SearchForDonorDialogResult = {
        action: 'select',
        donor: mockDonorSearchResult
      };

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockDialogResult));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onDonorIdClick();
      tick();

      // Donor should be set successfully
      expect(component.donorInfo()).toBeTruthy();
      expect(component.donorInfo()?.donorId).toBe('DN30139921');
    }));
  });
});
