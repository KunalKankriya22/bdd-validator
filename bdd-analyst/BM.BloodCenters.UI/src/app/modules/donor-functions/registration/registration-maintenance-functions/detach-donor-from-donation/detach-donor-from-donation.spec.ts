import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';

import { DetachDonorFromDonationComponent } from './detach-donor-from-donation';
import { DetachDonorFromDonationService } from './services/detach-donor-from-donation.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ReturnResult, DonationWithDonorDto } from './models/detach-donor-from-donation.model';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('DetachDonorFromDonationComponent', () => {
  let component: DetachDonorFromDonationComponent;
  let fixture: ComponentFixture<DetachDonorFromDonationComponent>;
  let serviceSpy: jasmine.SpyObj<DetachDonorFromDonationService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: { chapterChanged$: Subject<void>; getCurrentChapterId: jasmine.Spy };

  const mockDonationWithDonor: DonationWithDonorDto = {
    donorId: 'DN30136689',
    unitId: 'W633319030301',
    collDate: '2025-01-01T00:00:00',
    enteredBy: 'Celeste Hunter',
    lastName: 'Flores',
    firstName: 'Alison',
    middleInitial: '',
    dob: '1992-08-15T00:00:00',
    sex: 'M',
    abo: 'AB+',
    homeAddress: 'Maple Heights Apartments',
    apartmentNumber: 'Apt 12B',
    city: 'Austin',
    state: 'Texas (TX)',
    zip: '78701',
    homePhone: '214-555-3487',
    businessPhone: '512-555-7812',
    internationalAddress: '',
    employerSchool: 'Austin Community College',
    employerCityState: 'Austin, TX',
    employerZip: '73301',
    ethnicGroup: 'Asian',
    employerInternationalAddress: ''
  };

  const mockGetDonationsResponse: ReturnResult<DonationWithDonorDto> = {
    success: true,
    message: 'Found 1 donation(s) for unit ID W633319030301',
    error: '',
    errorCode: undefined,
    statusCode: 200,
    data: [mockDonationWithDonor],
    item: null as unknown as DonationWithDonorDto,
    total: 1
  };

  const mockValidateResponse: ReturnResult<DonationWithDonorDto> = {
    success: true,
    message: 'Validation passed',
    error: '',
    errorCode: undefined,
    statusCode: 200,
    data: [],
    item: null as unknown as DonationWithDonorDto,
    total: 0
  };

  const mockDetachSuccessResponse: ReturnResult<object> = {
    success: true,
    message: 'Donor ID, interdictions and audit record removed for the donation',
    error: '',
    errorCode: undefined,
    statusCode: 200,
    data: [],
    item: {},
    total: 0
  };

  const mockUnitValidationResponse: UnitValidationResponse = {
    parsedUnitId: 'W633319030301',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: 'W633319030301',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I'
  };

  function performSearch(): void {
    serviceSpy.getDonationsByUnitId.and.returnValue(of(mockGetDonationsResponse));
    serviceSpy.validateDonation.and.returnValue(of(mockValidateResponse));

    component['unitIdField'] = { parsedUnitId: 'W633319030301', clear: jasmine.createSpy('clear') } as any;
    component['verifyUnitIdField'] = { isValid: false, parsedUnitId: null, clear: jasmine.createSpy('clear') } as any;
    component.onUnitValidated(mockUnitValidationResponse);
    tick();
    fixture.detectChanges();
  }

  function setVerifyUnitId(unitId: string | null): void {
    component['verifyUnitIdField'] = { isValid: !!unitId, parsedUnitId: unitId, clear: jasmine.createSpy('clear') } as any;
    component['verifiedUnitId'] = unitId;
  }

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DetachDonorFromDonationService', [
      'getDonationsByUnitId',
      'validateDonation',
      'detachDonor'
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
      imports: [DetachDonorFromDonationComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: DetachDonorFromDonationService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    })
    .overrideProvider(MatDialog, { useValue: dialogSpy });


    


      serviceSpy.getDonationsByUnitId.calls.reset();


      serviceSpy.validateDonation.calls.reset();


      serviceSpy.detachDonor.calls.reset();


      dialogSpy.open.calls.reset();


    fixture = TestBed.createComponent(DetachDonorFromDonationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize search form with required validators', () => {
      expect(component.searchForm).toBeTruthy();
      expect(component.searchForm.get('collectionDate')).toBeTruthy();
      component.searchForm.get('collectionDate')?.setValue(null);
      expect(component.searchForm.get('collectionDate')?.hasError('required')).toBeTrue();
    });



    it('should display Donor ID as "--" before search', () => {
      expect(component['donorId']()).toBe('--');
    });

    it('should display Entered by as "--" before search', () => {
      expect(component['enteredBy']()).toBe('--');
    });

    it('should not show donor information before search', () => {
      expect(component['isDataLoaded']()).toBeFalse();
    });
  });

  describe('Search Functionality', () => {


    it('should call getDonationsByUnitId on valid unit validation', fakeAsync(() => {
      performSearch();
      expect(serviceSpy.getDonationsByUnitId).toHaveBeenCalledWith('W633319030301');
    }));

    it('should populate donation data on successful response', fakeAsync(() => {
      performSearch();
      expect(component['donationData']()).toEqual(mockDonationWithDonor);
      expect(component['isDataLoaded']()).toBeTrue();
    }));

    it('should call validateDonation after successful getDonationsByUnitId', fakeAsync(() => {
      performSearch();
      expect(serviceSpy.validateDonation).toHaveBeenCalledWith('W633319030301', '2025-01-01');
    }));







  });

  describe('Donor Information Display', () => {
    beforeEach(fakeAsync(() => {
      performSearch();
    }));



    it('should display entered by', () => {
      expect(component['enteredBy']()).toBe('Celeste Hunter');
    });

    it('should format gender correctly', () => {
      expect(component['formattedGender']()).toBe('Male');
    });

    it('should format DOB in DD-MON-YYYY format', () => {
      expect(component['formattedDob']()).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should format DOB value correctly', () => {
      expect(component['formattedDob']()).toBe('15-AUG-1992');
    });

    it('should map F gender to Female', fakeAsync(() => {
      component['donationData'].set({ ...mockDonationWithDonor, sex: 'F' });
      expect(component['formattedGender']()).toBe('Female');
    }));

    it('should return raw value for unknown gender', fakeAsync(() => {
      component['donationData'].set({ ...mockDonationWithDonor, sex: 'X' });
      expect(component['formattedGender']()).toBe('X');
    }));

    it('should return "--" for DOB when no data loaded', () => {
      component['donationData'].set(null);
      expect(component['formattedDob']()).toBe('--');
    });
  });

  describe('Detach Functionality', () => {
    beforeEach(fakeAsync(() => {
      performSearch();
    }));









    it('should pass correct payload to detachDonor', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      serviceSpy.detachDonor.and.returnValue(of(mockDetachSuccessResponse));

      setVerifyUnitId('W633319030301');
      component.onDetachDonor();
      tick();

      expect(serviceSpy.detachDonor).toHaveBeenCalledWith(jasmine.objectContaining({
        unitId: 'W633319030301',
        firstUnitId: 'W633319030301',
        secondUnitId: 'W633319030301',
        entryCheck: 'YES',
        chapterId: 'CH01'
      }));
    }));






  });
  describe('Reset', () => {
    it('should reset all form controls and signals', fakeAsync(() => {
      performSearch();

      component.resetForm();

      expect(component.searchForm.get('collectionDate')?.value).toBeNull();
      expect(component['donationData']()).toBeNull();
      expect(component['hasSearched']()).toBeFalse();
      expect(component['isDataLoaded']()).toBeFalse();
    }));

    it('should reset verify unit ID field and clear verifiedUnitId', fakeAsync(() => {
      performSearch();
      setVerifyUnitId('W633319030301');

      component.resetForm();

      expect(component['verifiedUnitId']).toBeNull();
      expect(component['verifyUnitIdField'].clear).toHaveBeenCalled();
    }));


  });
  describe('Error Formatting', () => {
    it('should use mapped error message for known error codes', fakeAsync(() => {
      const errorResponse: ReturnResult<DonationWithDonorDto> = {
        ...mockGetDonationsResponse,
        success: false,
        message: 'server msg',
        errorCode: '1230',
        data: []
      };
      serviceSpy.getDonationsByUnitId.and.returnValue(of(errorResponse));

      component['unitIdField'] = { parsedUnitId: 'TEST', clear: jasmine.createSpy('clear') } as any;
      component.onUnitValidated({ ...mockUnitValidationResponse, parsedUnitId: 'TEST' });
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 1230: Unit ID not found in donations.');
    }));

    it('should use server message for unknown error codes above 599', fakeAsync(() => {
      const errorResponse: ReturnResult<DonationWithDonorDto> = {
        ...mockGetDonationsResponse,
        success: false,
        message: 'Internal server error',
        errorCode: '700',
        data: []
      };
      serviceSpy.getDonationsByUnitId.and.returnValue(of(errorResponse));

      component['unitIdField'] = { parsedUnitId: 'TEST', clear: jasmine.createSpy('clear') } as any;
      component.onUnitValidated({ ...mockUnitValidationResponse, parsedUnitId: 'TEST' });
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 700: Internal server error');
    }));

    it('should use fallback message when no server message or known code', fakeAsync(() => {
      const errorResponse: ReturnResult<DonationWithDonorDto> = {
        ...mockGetDonationsResponse,
        success: false,
        message: '',
        errorCode: undefined,
        data: []
      };
      serviceSpy.getDonationsByUnitId.and.returnValue(of(errorResponse));

      component['unitIdField'] = { parsedUnitId: 'TEST', clear: jasmine.createSpy('clear') } as any;
      component.onUnitValidated({ ...mockUnitValidationResponse, parsedUnitId: 'TEST' });
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('No donation found for the entered Unit ID.');
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
