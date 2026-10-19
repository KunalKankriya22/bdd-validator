import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { DetachDonorFromDeferralComponent } from './detach-donor-from-deferral';
import { DetachDonorFromDeferralService } from './services/detach-donor-from-deferral.service';
import { ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ReturnResult, DeferralWithDonorDto } from './models/detach-donor-from-deferral.model';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('DetachDonorFromDeferralComponent', () => {
  let component: DetachDonorFromDeferralComponent;
  let fixture: ComponentFixture<DetachDonorFromDeferralComponent>;
  let serviceSpy: jasmine.SpyObj<DetachDonorFromDeferralService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: { chapterChanged$: Subject<void>; getCurrentChapterId: jasmine.Spy };

  const mockDeferralWithDonor: DeferralWithDonorDto = {
    deferralId: 'W6331902',
    transactionId: 'TXN001',
    donorId: 'DN30136689',
    collDate: '2025-01-01T00:00:00',
    enteredBy: 'Celeste Hunter',
    unitId: 'U001',
    programId: 'P001',
    chapterId: 'CH01',
    driveId: 'D001',
    lastName: 'Flores',
    firstName: 'Alison',
    middleName: '',
    dateOfBirth: '1992-08-15T00:00:00',
    gender: 'M',
    bloodType: 'AB',
    aboDescription: 'AB+',
    streetName: 'Maple Heights Apartments',
    suiteApt: 'Apt 12B',
    city: 'Austin',
    state: 'Texas (TX)',
    zip: '78701',
    homeAreaCode: '214',
    homePhone: '555-3487',
    businessAreaCode: '512',
    businessPhone: '555-7812',
    ethnicGroup: 'Asian',
    intlAddrFlag: 'N',
    intlAddress: '221B Baker Street, Marylebone, London NW1 6XE, United Kingdom',
    employerName: 'Austin Community College',
    employerCity: 'Austin',
    employerState: 'TX',
    employerZip: '73301',
    employerIntlAddress: '221B Baker Street, Marylebone, London NW1 6XE, United Kingdom'
  };

  const mockGetDeferralResponse: ReturnResult<DeferralWithDonorDto> = {
    success: true,
    message: 'Deferral details retrieved successfully',
    error: '',
    errorCode: undefined,
    statusCode: 200,
    data: [mockDeferralWithDonor],
    item: mockDeferralWithDonor,
    total: 1
  };

  const mockDetachSuccessResponse: ReturnResult<object> = {
    success: true,
    message: 'Donor successfully detached from deferral',
    error: '',
    errorCode: '16158',
    statusCode: 200,
    data: [],
    item: {},
    total: 0
  };

  function performSearch(): void {
    serviceSpy.getDeferralDetails.and.returnValue(of(mockGetDeferralResponse));

    component.searchForm.patchValue({
      deferralId: 'W6331902'
    });

    // Simulate completed double-entry flow so confirmedDeferralId is set
    (component as any).confirmedDeferralId = 'W6331902';
    (component as any).deferralIdDoubleEntry = 'confirmed';

    component.onSearch();
    tick();
    fixture.detectChanges();
  }

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DetachDonorFromDeferralService', [
      'getDeferralDetails',
      'executeDeferralDetach'
    ]);
    dialogSpy = createMockMatDialog();
    snackbarSpy = createMockSnackbarService();
    mockHeaderService = {
      chapterChanged$: new Subject<void>(),
      getCurrentChapterId: jasmine.createSpy('getCurrentChapterId').and.returnValue('CH01')
    };

    const mockPageHeaderService = {
      pageHeaderData: signal(undefined),
      getTitle: () => undefined,
      getSubtitle: () => undefined
    } as any;



      TestBed.configureTestingModule({
      imports: [DetachDonorFromDeferralComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: DetachDonorFromDeferralService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    })
    .overrideProvider(MatDialog, { useValue: dialogSpy });


    


      serviceSpy.getDeferralDetails.calls.reset();


      serviceSpy.executeDeferralDetach.calls.reset();


      dialogSpy.open.calls.reset();


    fixture = TestBed.createComponent(DetachDonorFromDeferralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize search form with required validators', () => {
      expect(component.searchForm).toBeTruthy();
      component.searchForm.get('deferralId')?.setValue('');
      expect(component.searchForm.get('deferralId')?.hasError('required')).toBeTrue();
    });

    it('should display Donor ID as "--" before search', () => {
      expect(component['donorId']()).toBe('--');
    });

    it('should display Entered by as "--" before search', () => {
      expect(component['enteredBy']()).toBe('--');
    });

    it('should have collectionDate form control as null before search', () => {
      expect(component.searchForm.get('collectionDate')?.value).toBeNull();
    });

    it('should not show donor information before search', () => {
      expect(component['isDataLoaded']()).toBeFalse();
    });
  });

  describe('Search Functionality', () => {




    it('should call getDeferralDetails on valid search', fakeAsync(() => {
      performSearch();
      expect(serviceSpy.getDeferralDetails).toHaveBeenCalledWith('W6331902');
    }));

    it('should populate deferral data on successful response', fakeAsync(() => {
      performSearch();
      expect(component['deferralData']()).toEqual(mockDeferralWithDonor);
      expect(component['isDataLoaded']()).toBeTrue();
    }));







    it('should set hasSearched to true on search', fakeAsync(() => {
      performSearch();
      expect(component['hasSearched']()).toBeTrue();
    }));
  });

  describe('Donor Information Display', () => {
    beforeEach(fakeAsync(() => {
      performSearch();
    }));



    it('should display entered by', () => {
      expect(component['enteredBy']()).toBe('Celeste Hunter');
    });

    it('should set collectionDate form control to transactionId on search', () => {
      expect(component.searchForm.get('collectionDate')?.value).toBe('TXN001');
    });

    it('should format gender correctly', () => {
      expect(component['formattedGender']()).toBe('Male');
    });

    it('should format DOB in DD-MON-YYYY format', () => {
      expect(component['formattedDob']()).toBe('15-AUG-1992');
    });

    it('should map F gender to Female', fakeAsync(() => {
      component['deferralData'].set({ ...mockDeferralWithDonor, gender: 'F' });
      expect(component['formattedGender']()).toBe('Female');
    }));

    it('should return raw value for unknown gender', fakeAsync(() => {
      component['deferralData'].set({ ...mockDeferralWithDonor, gender: 'X' });
      expect(component['formattedGender']()).toBe('X');
    }));

    it('should return "--" for DOB when no data loaded', () => {
      component['deferralData'].set(null);
      expect(component['formattedDob']()).toBe('--');
    });
  });

  describe('Detach Functionality', () => {
    beforeEach(fakeAsync(() => {
      performSearch();
    }));

    it('should show error when verify deferral ID is empty', () => {
      component.verifyDeferralIdControl.setValue('');
      component.onDetachDeferral();

      expect(component.verifyDeferralIdControl.touched).toBeTrue();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });



    it('should set mismatch error on verify control when IDs do not match', () => {
      component.verifyDeferralIdControl.setValue('DIFFERENT_ID');
      component.onDetachDeferral();

      expect(component.verifyDeferralIdControl.hasError('mismatch')).toBeTrue();
    });





    it('should pass correct payload to executeDeferralDetach', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      serviceSpy.executeDeferralDetach.and.returnValue(of(mockDetachSuccessResponse));

      component.verifyDeferralIdControl.setValue('W6331902');
      component.onDetachDeferral();
      tick();

      expect(serviceSpy.executeDeferralDetach).toHaveBeenCalledWith(jasmine.objectContaining({
        deferralId: 'W6331902',
        confirmationDeferralId: 'W6331902'
      }));
    }));







    it('should pass dialog data with correct title and message', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.verifyDeferralIdControl.setValue('W6331902');
      component.onDetachDeferral();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data as ConfirmActionDialogData;
      expect(dialogData.title).toBe('Confirm Deferral Detachment');
      expect(dialogData.message).toContain('DN30136689');
      expect(dialogData.confirmText).toBe('YES, DETACH DEFERRAL');
    });
  });
  describe('Reset', () => {
    it('should reset all form controls and signals', fakeAsync(() => {
      performSearch();

      component.resetForm();

      expect(component.searchForm.get('deferralId')?.value).toBe('');
      expect(component['deferralData']()).toBeNull();
      expect(component['hasSearched']()).toBeFalse();
      expect(component['isDataLoaded']()).toBeFalse();
    }));




  });

  describe('Alternate Address', () => {


    it('should open AlternateDemographicsDialog with donor ID when data is loaded', fakeAsync(() => {
      performSearch();

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogSpy.open.calls.reset();
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAlternateAddress();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data as AlternateDemographicsDialogData;
      expect(dialogData.donorId).toBe('DN30136689');
      expect(dialogData.readOnly).toBeTrue();
    }));
  });
  describe('Error Formatting', () => {
    it('should use mapped error message for known error codes', fakeAsync(() => {
      const errorResponse: ReturnResult<DeferralWithDonorDto> = {
        ...mockGetDeferralResponse,
        success: false,
        message: 'server msg',
        errorCode: '16060',
        item: null as unknown as DeferralWithDonorDto,
        data: null as unknown as DeferralWithDonorDto[]
      };
      serviceSpy.getDeferralDetails.and.returnValue(of(errorResponse));

      component.searchForm.patchValue({ deferralId: 'TEST' });
      component.onSearch();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 16060: Invalid deferral ID.');
    }));

    it('should use server message for unknown error codes above 599', fakeAsync(() => {
      const errorResponse: ReturnResult<DeferralWithDonorDto> = {
        ...mockGetDeferralResponse,
        success: false,
        message: 'Internal server error',
        errorCode: '700',
        item: null as unknown as DeferralWithDonorDto,
        data: null as unknown as DeferralWithDonorDto[]
      };
      serviceSpy.getDeferralDetails.and.returnValue(of(errorResponse));

      component.searchForm.patchValue({ deferralId: 'TEST' });
      component.onSearch();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 700: Internal server error');
    }));

    it('should use fallback message when no server message or known code', fakeAsync(() => {
      const errorResponse: ReturnResult<DeferralWithDonorDto> = {
        ...mockGetDeferralResponse,
        success: false,
        message: '',
        errorCode: undefined,
        item: null as unknown as DeferralWithDonorDto,
        data: null as unknown as DeferralWithDonorDto[]
      };
      serviceSpy.getDeferralDetails.and.returnValue(of(errorResponse));

      component.searchForm.patchValue({ deferralId: 'TEST' });
      component.onSearch();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('No deferral found for the entered Deferral ID.');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should call next and complete on destroy$', () => {
      const nextSpy = spyOn(component['destroy$'], 'next').and.callThrough();
      const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
