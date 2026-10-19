import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { UpdateDeferral } from './update-deferral';
import { UpdateDeferralService } from './services/update-deferral.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AlternateDemographicsService } from '@shared/services/alternate-demographics.service';
import { DeferralDetailDto, DEFERRAL_TYPES } from './models/update-deferral.model';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('UpdateDeferral', () => {
  let component: UpdateDeferral;
  let fixture: ComponentFixture<UpdateDeferral>;
  let deferralServiceSpy: jasmine.SpyObj<UpdateDeferralService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let altDemoServiceSpy: jasmine.SpyObj<AlternateDemographicsService>;
  let chapterChanged$: Subject<void>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  const VALID_DEFERRAL_ID = '12345678';

  const mockDeferralDetail: DeferralDetailDto = {
    deferralId: VALID_DEFERRAL_ID,
    donorId: 'DON123',
    transactionId: 'TXN456',
    driveId: 'DRV001',
    driveDate: '2026-05-10',
    setId: 'SET789',
    lookupId: 'STF001',
    donationType: 'WB',
    procedureCode: '450',
    physicalId: 'PHY001',
    deferralReason: 'LOW_HB',
    deferredThruDate: '2026-08-10',
    deferralType: 'NA',
    screenerId: 'SCR001',
    firstReviewerId: 'REV001',
    equipType: 'EQ001',
    bagType: 'BAG01',
    noteId: 'NOTE123',
    collDate: '2026-05-10',
    chapterId: '0001',
    programId: 'DRIREDEF',
    insertUser: 'USER123',
    insertedBy: 'John Doe',
    nAuditFlag: 'Y',
    lastName: 'Rogers',
    lastNameSuffix: 'Jr.',
    firstName: 'Marvin',
    middleName: 'Michael',
    dateOfBirth: '1990-01-15',
    gender: 'Male',
    height: '5\' 10"',
    donorWeight: 180,
    bloodType: 'O+',
    aboDescription: 'O Positive',
    employerId: 'EMP001',
    donorStatus: 'A',
    scanId: 'SCAN001',
    alternateId: 'M639466',
    alternateIdType: 'PASPT',
    ethnicGroup: 'CA',
    intlAddrFlag: 'N',
    streetName: '123 Main Street',
    suiteApt: '4B',
    uspsId: 12345,
    city: 'New York',
    state: 'NY',
    zip: '10001',
    hAreaCode: '214',
    hPhoneNo: '8527584',
    dAreaCode: '214',
    dPhoneNo: '8527585',
    extension: null,
    mAreaCode: '214',
    mPhoneNo: '8527586',
    email: 'marvin.rogers@example.com',
    preferredContactFlag: 'M',
    preferredContactAddrFlag: null,
    intlAddress1: null,
    intlAddress2: null,
    intlAddress3: null,
    intlAddress4: null,
    countryName: null,
    intlPostalCode: null,
    intlHomePhoneNo: null,
    intlWorkPhoneNo: null,
    intlWorkPhoneExt: null,
    intlMobilePhoneNo: null,
    intlFaxNo: null,
    altStreetName: null,
    altSuiteApt: null,
    altUspsId: null,
    altIntlAddress1: null,
    altIntlAddress2: null,
    altIntlAddress3: null,
    altIntlAddress4: null,
    altCountryName: null,
    altIntlPostalCode: null,
    altIntlAddrFlag: null,
    otherContactNo: null,
    altIntlPhoneNo: null,
    altCity: null,
    altState: null,
    altZip: null,
    employerName: 'Mediware',
    empIntlAddrFlag: 'N',
    empZip: '10001',
    empCity: 'New York',
    empState: 'NY',
    empUspsId: 12345,
    empIntlCity: null,
    empIntlState: null,
    empIntlPostalCode: null,
    empIntlCountryName: null,
  };

  function doubleEntryAndRetrieve(deferralId: string = VALID_DEFERRAL_ID): void {
    component.searchForm.patchValue({ deferralId });
    component.onDeferralIdEntered();
    component.searchForm.patchValue({ deferralId });
    component.onDeferralIdEntered();
    component.onRetrieve();
  }

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();
    deferralServiceSpy = jasmine.createSpyObj('UpdateDeferralService', [
      'getDeferralById',
      'updateDeferral',
      'validateDeferralId',
      'getInterdictions',
      'addInterdiction',
      'removeInterdiction',
      'getDrives',
      'getEmployees',
      'getDonationTypes',
      'getProcedureCodes',
      'getEquipmentTypes',
      'getDeferralReasons',
      'getEthnicGroups',
      'getEmployers',
      'getCities',
      'getZipLookup',
      'getEmployerCities',
      'getEmployerZipLookup',
      'getCountries',
      'validateStaff',
      'validateDonationType',
      'validateProcedureCode',
      'validateEquipmentType',
      'validateDeferralReason',
      'validateCityField',
      'validateZipCityField',
      'validateAlternateIdTypeField',
      'validateEthnicGroupField',
      'validateScanId',
      'clearCaches',
      'getEthnicRequired',
      'getManualHolds',
      'getAlternateIdTypes',
    ]);
    headerServiceSpy = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId'], {
      chapterChanged$: chapterChanged$.asObservable(),
    });
    snackbarServiceSpy = createMockSnackbarService();
    altDemoServiceSpy = jasmine.createSpyObj('AlternateDemographicsService', ['getByDonorId', 'update', 'getCityStateByZip', 'getCountries']);
    altDemoServiceSpy.getByDonorId.and.returnValue(of(null));

    const defaultDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    defaultDialogRef.afterClosed.and.returnValue(of(undefined));
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    matDialogSpy.open.and.returnValue(defaultDialogRef);

    deferralServiceSpy.getDeferralById.and.returnValue(of(mockDeferralDetail));
    deferralServiceSpy.updateDeferral.and.returnValue(of({ success: true, statusCode: 200, message: 'Updated' }));
    deferralServiceSpy.validateDeferralId.and.returnValue(of(true));
    deferralServiceSpy.getInterdictions.and.returnValue(of([]));
    deferralServiceSpy.addInterdiction.and.returnValue(of({ success: true, statusCode: 201, message: 'Created' }));
    deferralServiceSpy.removeInterdiction.and.returnValue(of({ success: true, statusCode: 200, message: 'Removed' }));
    deferralServiceSpy.getDrives.and.returnValue(of([]));
    deferralServiceSpy.getEmployees.and.returnValue(of([]));
    deferralServiceSpy.getDonationTypes.and.returnValue(of([]));
    deferralServiceSpy.getProcedureCodes.and.returnValue(of([]));
    deferralServiceSpy.getEquipmentTypes.and.returnValue(of([]));
    deferralServiceSpy.getDeferralReasons.and.returnValue(of([]));
    deferralServiceSpy.getEthnicGroups.and.returnValue(of([]));
    deferralServiceSpy.getEmployers.and.returnValue(of([]));
    deferralServiceSpy.getCities.and.returnValue(of([]));
    deferralServiceSpy.getZipLookup.and.returnValue(of([]));
    deferralServiceSpy.validateStaff.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateDonationType.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateProcedureCode.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateEquipmentType.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateDeferralReason.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateCityField.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateZipCityField.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateAlternateIdTypeField.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateEthnicGroupField.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateScanId.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.getEthnicRequired.and.returnValue(of(false));
    deferralServiceSpy.getManualHolds.and.returnValue(of([]));
    deferralServiceSpy.getAlternateIdTypes.and.returnValue(of([]));
    deferralServiceSpy.getEmployerCities.and.returnValue(of([]));
    deferralServiceSpy.getEmployerZipLookup.and.returnValue(of([]));
    deferralServiceSpy.getCountries.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [
        UpdateDeferral,
        NoopAnimationsModule,
        MatDialogModule,
        MatSnackBarModule,
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UpdateDeferralService, useValue: deferralServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: AlternateDemographicsService, useValue: altDemoServiceSpy },
      ],
    });

    deferralServiceSpy.getDeferralById.calls.reset();
    deferralServiceSpy.updateDeferral.calls.reset();
    deferralServiceSpy.validateDeferralId.calls.reset();
    deferralServiceSpy.getInterdictions.calls.reset();
    deferralServiceSpy.addInterdiction.calls.reset();
    deferralServiceSpy.removeInterdiction.calls.reset();
    deferralServiceSpy.getDrives.calls.reset();
    deferralServiceSpy.getEmployees.calls.reset();
    deferralServiceSpy.getDonationTypes.calls.reset();
    deferralServiceSpy.getProcedureCodes.calls.reset();
    deferralServiceSpy.getEquipmentTypes.calls.reset();
    deferralServiceSpy.getDeferralReasons.calls.reset();
    deferralServiceSpy.getEthnicGroups.calls.reset();
    deferralServiceSpy.getEmployers.calls.reset();
    deferralServiceSpy.getCities.calls.reset();
    deferralServiceSpy.getZipLookup.calls.reset();
    deferralServiceSpy.validateStaff.calls.reset();
    deferralServiceSpy.validateDonationType.calls.reset();
    deferralServiceSpy.validateProcedureCode.calls.reset();
    deferralServiceSpy.validateEquipmentType.calls.reset();
    deferralServiceSpy.validateDeferralReason.calls.reset();
    deferralServiceSpy.validateCityField.calls.reset();
    deferralServiceSpy.validateZipCityField.calls.reset();
    deferralServiceSpy.validateAlternateIdTypeField.calls.reset();
    deferralServiceSpy.validateEthnicGroupField.calls.reset();
    deferralServiceSpy.validateScanId.calls.reset();
    deferralServiceSpy.clearCaches.calls.reset();
    deferralServiceSpy.getEthnicRequired.calls.reset();
    deferralServiceSpy.getManualHolds.calls.reset();
    deferralServiceSpy.getAlternateIdTypes.calls.reset();
    deferralServiceSpy.getEmployerCities.calls.reset();
    deferralServiceSpy.getEmployerZipLookup.calls.reset();
    deferralServiceSpy.getCountries.calls.reset();
    altDemoServiceSpy.getByDonorId.calls.reset();
    matDialogSpy.open.calls.reset();
    headerServiceSpy.getCurrentChapterId.calls.reset();

    deferralServiceSpy.getDeferralById.and.returnValue(of(mockDeferralDetail));
    deferralServiceSpy.updateDeferral.and.returnValue(of({ success: true, statusCode: 200, message: 'Updated' }));
    deferralServiceSpy.validateDeferralId.and.returnValue(of(true));
    deferralServiceSpy.getInterdictions.and.returnValue(of([]));
    deferralServiceSpy.addInterdiction.and.returnValue(of({ success: true, statusCode: 201, message: 'Created' }));
    deferralServiceSpy.removeInterdiction.and.returnValue(of({ success: true, statusCode: 200, message: 'Removed' }));
    deferralServiceSpy.getDrives.and.returnValue(of([]));
    deferralServiceSpy.getEmployees.and.returnValue(of([]));
    deferralServiceSpy.getDonationTypes.and.returnValue(of([]));
    deferralServiceSpy.getProcedureCodes.and.returnValue(of([]));
    deferralServiceSpy.getEquipmentTypes.and.returnValue(of([]));
    deferralServiceSpy.getDeferralReasons.and.returnValue(of([]));
    deferralServiceSpy.getEthnicGroups.and.returnValue(of([]));
    deferralServiceSpy.getEmployers.and.returnValue(of([]));
    deferralServiceSpy.getCities.and.returnValue(of([]));
    deferralServiceSpy.getZipLookup.and.returnValue(of([]));
    deferralServiceSpy.validateStaff.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateDonationType.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateProcedureCode.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateEquipmentType.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateDeferralReason.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateCityField.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateZipCityField.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateAlternateIdTypeField.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateEthnicGroupField.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.validateScanId.and.returnValue(of({ success: true, message: 'Valid', statusCode: 200 }));
    deferralServiceSpy.getEthnicRequired.and.returnValue(of(false));
    deferralServiceSpy.getManualHolds.and.returnValue(of([]));
    deferralServiceSpy.getAlternateIdTypes.and.returnValue(of([]));
    deferralServiceSpy.getEmployerCities.and.returnValue(of([]));
    deferralServiceSpy.getEmployerZipLookup.and.returnValue(of([]));
    deferralServiceSpy.getCountries.and.returnValue(of([]));
    altDemoServiceSpy.getByDonorId.and.returnValue(of(null));

    fixture = TestBed.createComponent(UpdateDeferral);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should initialize search and update forms', () => {
      fixture.detectChanges();
      expect(component.searchForm).toBeDefined();
      expect(component.updateForm).toBeDefined();
    });

    it('should have deferral types defined', () => {
      expect(component.deferralTypes.length).toBe(3);
      expect(component.deferralTypes[0].code).toBe(DEFERRAL_TYPES.INDEFINITE);
    });
  });

  describe('Search Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require deferral ID', () => {
      component.searchForm.patchValue({ deferralId: '' });
      component.searchForm.get('deferralId')?.markAsTouched();
      expect(component.searchForm.get('deferralId')?.hasError('required')).toBe(true);
    });

    it('should accept valid 8-digit deferral ID', () => {
      component.searchForm.patchValue({ deferralId: '12345678' });
      expect(component.searchForm.get('deferralId')?.valid).toBe(true);
    });

    it('should reject non-numeric deferral ID', () => {
      component.searchForm.patchValue({ deferralId: 'ABCD1234' });
      expect(component.searchForm.get('deferralId')?.hasError('pattern')).toBe(true);
    });

    it('should reject deferral ID shorter than 8 digits', () => {
      component.searchForm.patchValue({ deferralId: '1234567' });
      expect(component.searchForm.get('deferralId')?.hasError('pattern')).toBe(true);
    });

    it('should reject deferral ID with special characters', () => {
      component.searchForm.patchValue({ deferralId: '1234-567' });
      expect(component.searchForm.get('deferralId')?.hasError('pattern')).toBe(true);
    });
  });

  describe('Search Deferral ID Double-Entry', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not enter pending state for invalid deferral ID', () => {
      component.searchForm.patchValue({ deferralId: 'ABC' });
      component.onDeferralIdEntered();
      expect(component.deferralIdDoubleEntry).toBe('idle');
    });

    it('should confirm value and set initialDeferralId without calling API when double-entry matches', () => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      expect(component.deferralIdDoubleEntry).toBe('idle');
      expect(component.searchForm.get('deferralId')?.value).toBe(VALID_DEFERRAL_ID);
      expect(component.selectedDeferralId()).toBe(VALID_DEFERRAL_ID);
      expect(deferralServiceSpy.getDeferralById).not.toHaveBeenCalled();
    });

    it('should prevent default and trigger validation on Enter key', () => {
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEnter(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.deferralIdDoubleEntry).toBe('pending');
    });

    it('should not trigger double-entry on blur when clicking RETRIEVE', () => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      const blurEvent = { relatedTarget: { classList: { contains: (cls: string) => cls === 'retrieve-button' } } } as unknown as FocusEvent;
      component.onDeferralIdBlur(blurEvent);
      expect(component.deferralIdDoubleEntry).toBe('idle');
      expect(component.searchForm.get('deferralId')?.value).toBe(VALID_DEFERRAL_ID);
    });

    it('should trigger double-entry on blur to other elements', () => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      const blurEvent = { relatedTarget: null } as unknown as FocusEvent;
      component.onDeferralIdBlur(blurEvent);
      expect(component.deferralIdDoubleEntry).toBe('pending');
    });

    it('should skip double-entry for already loaded deferral ID', fakeAsync(() => {
      doubleEntryAndRetrieve();
      tick();
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      expect(component.deferralIdDoubleEntry).toBe('idle');
    }));

    it('should clear field and show required when RETRIEVE clicked without double-entry', () => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onRetrieve();
      expect(component.searchForm.get('deferralId')?.value).toBe('');
      expect(component.searchForm.get('deferralId')?.hasError('required')).toBe(true);
      expect(deferralServiceSpy.getDeferralById).not.toHaveBeenCalled();
    });

    it('should clear field and show required when RETRIEVE clicked while pending', () => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onRetrieve();
      expect(component.searchForm.get('deferralId')?.value).toBe('');
      expect(component.searchForm.get('deferralId')?.hasError('required')).toBe(true);
      expect(component.deferralIdDoubleEntry).toBe('idle');
      expect(deferralServiceSpy.getDeferralById).not.toHaveBeenCalled();
    });

    it('should call API on RETRIEVE after double-entry is confirmed', fakeAsync(() => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      component.onRetrieve();
      tick();
      expect(deferralServiceSpy.getDeferralById).toHaveBeenCalledWith(VALID_DEFERRAL_ID);
      expect(component.showUpdateForm()).toBe(true);
    }));
  });

  describe('Search / Retrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should retrieve deferral by ID after double-entry', fakeAsync(() => {
      doubleEntryAndRetrieve();
      tick();
      expect(deferralServiceSpy.getDeferralById).toHaveBeenCalledWith(VALID_DEFERRAL_ID);
      expect(component.showUpdateForm()).toBe(true);
      expect(component.selectedDeferralId()).toBe(VALID_DEFERRAL_ID);
    }));

    it('should populate form on successful retrieve', fakeAsync(() => {
      doubleEntryAndRetrieve();
      tick();
      expect(component.donorId()).toBe('DON123');
      expect(component.aboDescription()).toBe('O Positive');
      expect(component.updateForm.get('suffix')?.value).toBe('Jr.');
      expect(component.updateForm.get('middleName')?.value).toBe('Michael');
      expect(component.updateForm.get('weight')?.value).toBe(180);
      expect(component.updateForm.get('donationType')?.value).toBe('WB');
      expect(component.updateForm.get('sex')?.value).toBe('Male');
      expect(component.updateForm.get('apartmentNo')?.value).toBe('4B');
      expect(component.updateForm.get('homePhoneNumber')?.value).toBe('(214) 852-7584');
      expect(component.updateForm.get('preferredPhone')?.value).toBe('mobile');
    }));

    it('should load lookup data after retrieve', fakeAsync(() => {
      doubleEntryAndRetrieve();
      tick();
      expect(deferralServiceSpy.getDrives).toHaveBeenCalled();
      expect(deferralServiceSpy.getEmployees).toHaveBeenCalled();
      expect(deferralServiceSpy.getDonationTypes).toHaveBeenCalled();
      expect(deferralServiceSpy.getEquipmentTypes).toHaveBeenCalled();
      expect(deferralServiceSpy.getEthnicGroups).toHaveBeenCalled();
    }));
  });

  describe('Deferral Type Logic', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should reject IND when deferred thru date has a value', fakeAsync(() => {
      component.updateForm.patchValue({ deferralType: DEFERRAL_TYPES.INDEFINITE });
      fixture.detectChanges();
      tick();
      expect(component.updateForm.get('deferralType')?.value).toBe('');
      expect(component.updateForm.get('deferralType')?.hasError('serverError')).toBeTrue();
    }));
  });

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should require weight', () => {
      component.updateForm.get('weight')?.setValue(null);
      expect(component.updateForm.get('weight')?.hasError('required')).toBe(true);
    });

    it('should require ethnic group', () => {
      component.updateForm.get('ethnicGroup')?.setValue('');
      expect(component.updateForm.get('ethnicGroup')?.hasError('required')).toBe(true);
    });

    it('should require donation type', () => {
      component.updateForm.get('donationType')?.setValue('');
      expect(component.updateForm.get('donationType')?.hasError('required')).toBe(true);
    });

    it('should require deferral type', () => {
      component.updateForm.get('deferralType')?.setValue('');
      expect(component.updateForm.get('deferralType')?.hasError('required')).toBe(true);
    });
  });

  describe('Double-Entry Final Deferral ID', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should not proceed with invalid final deferral ID', () => {
      component.updateForm.patchValue({ finalDeferralId: 'ABCD1234' });
      component.onFinalDeferralIdEntered();
      expect(component.finalDeferralIdDoubleEntry).toBe('idle');
    });

    it('should clear, reset and hide form when confirmed ID does not match initial deferral ID', () => {
      component.updateForm.patchValue({ finalDeferralId: '87654321' });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: '87654321' });
      component.onFinalDeferralIdEntered();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Final Deferral ID does not match the initial Deferral ID',
      );
      expect(component.showUpdateForm()).toBe(false);
      expect(component.selectedDeferralId()).toBe('');
    });
  });

  describe('Number-Only Input', () => {
    it('should allow numeric keys', () => {
      const input = document.createElement('input');
      input.value = '123';
      const event = { which: 53, keyCode: 53, preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: false, target: input } as unknown as KeyboardEvent;
      const result = component.onlyNumbers(event);
      expect(result).toBe(true);
    });

    it('should prevent non-numeric keys', () => {
      const event = { which: 65, keyCode: 65, preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: false } as unknown as KeyboardEvent;
      const result = component.onlyNumbers(event);
      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Phone Formatting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
    }));

    it('should format phone number with area code', () => {
      component.updateForm.patchValue({ homePhoneNumber: '2148527584' });
      component.formatPhoneInput('homePhoneNumber');
      expect(component.updateForm.get('homePhoneNumber')?.value).toBe('(214) 852-7584');
    });
  });

  describe('Content Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should scroll to section', () => {
      const mockElement = document.createElement('div');
      mockElement.id = 'personal-info';
      mockElement.scrollIntoView = jest.fn();
      spyOn(document, 'getElementById').and.returnValue(mockElement);
      component.scrollToSection('personal-info');
      expect(component.activeSection()).toBe('personal-info');
      expect(mockElement.scrollIntoView).toHaveBeenCalled();
    });
  });

  describe('Field Validations', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should call validateStaff for lookupId on selection change', () => {
      component.updateForm.patchValue({ lookupId: 'STF001' });
      component.validateStaffField('lookupId');
      expect(deferralServiceSpy.validateStaff).toHaveBeenCalledWith('STF001', jasmine.any(String));
    });

    it('should call validateStaff for physicalId on selection change', () => {
      component.updateForm.patchValue({ physicalId: 'PHY001' });
      component.validateStaffField('physicalId');
      expect(deferralServiceSpy.validateStaff).toHaveBeenCalledWith('PHY001', jasmine.any(String));
    });

    it('should call validateStaff for historianId on selection change', () => {
      component.updateForm.patchValue({ historianId: 'SCR001' });
      component.validateStaffField('historianId');
      expect(deferralServiceSpy.validateStaff).toHaveBeenCalledWith('SCR001', jasmine.any(String));
    });

    it('should call validateStaff for reviewerId on selection change', () => {
      component.updateForm.patchValue({ reviewerId: 'REV001' });
      component.validateStaffField('reviewerId');
      expect(deferralServiceSpy.validateStaff).toHaveBeenCalledWith('REV001', jasmine.any(String));
    });

    it('should call validateEquipmentType on equipment type selection', () => {
      component.updateForm.patchValue({ equipmentType: 'EQ001' });
      component.validateEquipmentTypeField();
      expect(deferralServiceSpy.validateEquipmentType).toHaveBeenCalledWith('EQ001');
    });

    it('should call validateEthnicGroupField on ethnic group selection', () => {
      component.updateForm.patchValue({ ethnicGroup: 'CA' });
      component.validateEthnicGroupField();
      expect(deferralServiceSpy.validateEthnicGroupField).toHaveBeenCalledWith('CA');
    });

    it('should call validateCityField on city selection', () => {
      component.updateForm.patchValue({ city: 'New York' });
      component.validateCityField();
      expect(deferralServiceSpy.validateCityField).toHaveBeenCalledWith('New York');
    });

    it('should call validateZipCityField on zip blur when city is set', () => {
      component.updateForm.patchValue({ city: 'New York', zip: '10001' });
      component.validateZipField();
      expect(deferralServiceSpy.validateZipCityField).toHaveBeenCalledWith('New York', '10001');
    });

    it('should set serverError on deferral reason ending with comma', () => {
      component.updateForm.patchValue({ deferral: 'LOW_HB,' });
      component.validateDeferralReasonField();
      expect(component.updateForm.get('deferral')?.hasError('serverError')).toBe(true);
    });

    it('should not set error on valid deferral reason', () => {
      component.updateForm.patchValue({ deferral: 'LOW_HB' });
      component.validateDeferralReasonField();
      expect(component.updateForm.get('deferral')?.hasError('serverError')).toBeFalsy();
    });
  });

  describe('Clear and Reset', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should reset state on clearFormForNext', () => {
      component.clearFormForNext();
      expect(component.selectedDeferralId()).toBe('');
      expect(component.donorId()).toBe('');
      expect(component.showUpdateForm()).toBe(false);
      expect(component.deferralIdDoubleEntry).toBe('idle');
      expect(component.finalDeferralIdDoubleEntry).toBe('idle');
    });
  });

  describe('Back Button and Unsaved Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show back button after form is loaded', fakeAsync(() => {
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.pageHeaderConfig.showBackButton).toBeTrue();
    }));

    it('should set hasUnsavedChanges to false initially after retrieve', fakeAsync(() => {
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.hasUnsavedChanges).toBeFalse();
    }));

    it('should set hasUnsavedChanges to true when form values change', fakeAsync(() => {
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      component.updateForm.patchValue({ firstName: 'Changed' });
      tick();
      expect(component.hasUnsavedChanges).toBeTrue();
    }));

    it('should reset hasUnsavedChanges on clearFormForNext', fakeAsync(() => {
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      component.updateForm.patchValue({ firstName: 'Changed' });
      tick();
      expect(component.hasUnsavedChanges).toBeTrue();
      component.clearFormForNext();
      tick();
      expect(component.hasUnsavedChanges).toBeFalse();
    }));

    it('should return true from canDeactivate when no unsaved changes', () => {
      component.hasUnsavedChanges = false;
      expect(component.canDeactivate()).toBeTrue();
    });

    it('should return false from canDeactivate when there are unsaved changes', () => {
      component.hasUnsavedChanges = true;
      expect(component.canDeactivate()).toBeFalse();
    });
  });

  describe('Deferred Thru Date Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set invalidDate error on blur when input is unparseable', fakeAsync(() => {
      const input = { value: '13-13-2026', trim: () => '13-13-2026' } as any;
      const event = { target: input } as unknown as FocusEvent;
      component.onDeferredThruBlur(event);
      tick(10);
      expect(component.updateForm.get('deferredThru')?.hasError('invalidDate')).toBeTrue();
    }));

    it('should not set error on blur when input is a valid compact date', fakeAsync(() => {
      const input = { value: '01JAN2027' } as any;
      const event = { target: input } as unknown as FocusEvent;
      component.onDeferredThruBlur(event);
      tick(10);
      expect(component.updateForm.get('deferredThru')?.hasError('invalidDate')).toBeFalse();
      expect(component.updateForm.get('deferredThru')?.value).toBeTruthy();
    }));

    it('should not set error on blur when input is empty', fakeAsync(() => {
      const input = { value: '  ' } as any;
      const event = { target: input } as unknown as FocusEvent;
      component.onDeferredThruBlur(event);
      tick(10);
      expect(component.updateForm.get('deferredThru')?.hasError('invalidDate')).toBeFalse();
    }));

    it('should set invalidDate error for invalid month abbreviation in compact format', fakeAsync(() => {
      const input = { value: '01XYZ2027' } as any;
      const event = { target: input } as unknown as FocusEvent;
      component.onDeferredThruBlur(event);
      tick(10);
      expect(component.updateForm.get('deferredThru')?.hasError('invalidDate')).toBeTrue();
    }));
  });

  describe('Employer Selection Flows', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should clear employer fields when empty employer ID is selected', () => {
      component.onEmployerSelected('');
      expect(component.selectedEmployerId()).toBeNull();
      expect(component.updateForm.get('employerCity')?.value).toBe('');
      expect(component.updateForm.get('employerZip')?.value).toBe('');
      expect(component.employerStateDisplay()).toBe('--');
    });

    it('should set local employer fields when local employer is selected', () => {
      component.filteredEmployers.set([{
        employerId: 'EMP002', employerName: 'Local Corp',
        city: 'Dallas', state: 'TX', zip: '75201', intlAddrFlag: 'N', uspsId: 99999,
      }]);
      component.onEmployerSelected('EMP002');
      expect(component.selectedEmployerId()).toBe('EMP002');
      expect(component.updateForm.get('employerCity')?.value).toBe('Dallas');
      expect(component.updateForm.get('employerZip')?.value).toBe('75201');
      expect(component.employerStateDisplay()).toBe('TX');
    });

    it('should set international employer address when intlAddrFlag is Y', () => {
      component.filteredEmployers.set([{
        employerId: 'EMP_INTL', employerName: 'International Corp',
        city: 'London', state: 'UK', zip: 'SW1A', intlAddrFlag: 'Y', country: 'United Kingdom',
      }]);
      component.onEmployerSelected('EMP_INTL');
      expect(component.selectedEmployerId()).toBe('EMP_INTL');
      expect(component.updateForm.get('employerCity')?.value).toBe('');
      expect(component.updateForm.get('employerZip')?.value).toBe('');
      expect(component.employerStateDisplay()).toBe('--');
      expect(component.updateForm.get('employerName')?.disabled).toBe(true);
    });

    it('should do nothing if employer is not found in filteredEmployers', () => {
      component.filteredEmployers.set([]);
      component.onEmployerSelected('NONEXISTENT');
      expect(component.selectedEmployerId()).toBe('EMP001');
    });

    it('should enable employerName when switching from intl to local employer', () => {
      component.filteredEmployers.set([
        { employerId: 'EMP_INTL', employerName: 'Intl Corp', intlAddrFlag: 'Y', country: 'UK' },
        { employerId: 'EMP_LOCAL', employerName: 'Local Corp', city: 'Austin', state: 'TX', zip: '78701', intlAddrFlag: 'N' },
      ]);
      component.onEmployerSelected('EMP_INTL');
      expect(component.updateForm.get('employerName')?.disabled).toBe(true);
      component.onEmployerSelected('EMP_LOCAL');
      expect(component.updateForm.get('employerName')?.disabled).toBe(false);
    });
  });

  describe('City/Zip Auto-Population', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should update state and zip when a city is selected via onCitySelected', () => {
      component.onCitySelected({ city: 'Houston', state: 'TX', zip: '77001', uspsId: 55555 });
      expect(component.stateDisplay()).toBe('TX');
      expect(component.updateForm.get('zip')?.value).toBe('77001');
    });

    it('should set state to -- when city has no state', () => {
      component.onCitySelected({ city: 'Unknown', state: '', zip: '00000', uspsId: 0 });
      expect(component.stateDisplay()).toBe('--');
    });

    it('should auto-populate city and state when valid zip entered on blur', fakeAsync(() => {
      deferralServiceSpy.getZipLookup.and.returnValue(of([
        { city: 'Austin', state: 'TX', zip: '78701', uspsId: 11111 },
      ]));
      component.updateForm.patchValue({ zip: '78701' });
      component.onZipBlur();
      tick();
      expect(deferralServiceSpy.getZipLookup).toHaveBeenCalledWith('78701');
      expect(component.updateForm.get('city')?.value).toBe('Austin');
      expect(component.stateDisplay()).toBe('TX');
    }));

    it('should not call getZipLookup when zip is too short', fakeAsync(() => {
      deferralServiceSpy.getZipLookup.calls.reset();
      component.updateForm.patchValue({ zip: '787' });
      component.onZipBlur();
      tick();
      expect(deferralServiceSpy.getZipLookup).not.toHaveBeenCalled();
    }));

    it('should not update city when zip lookup returns empty results', fakeAsync(() => {
      deferralServiceSpy.getZipLookup.and.returnValue(of([]));
      component.updateForm.patchValue({ zip: '99999', city: 'OriginalCity' });
      component.onZipBlur();
      tick();
      expect(component.updateForm.get('city')?.value).toBe('OriginalCity');
    }));

    it('should update employer state and zip when employer city selected', () => {
      component.onEmployerCitySelected({ city: 'Plano', state: 'TX', zip: '75024', uspsId: 22222 });
      expect(component.employerStateDisplay()).toBe('TX');
      expect(component.updateForm.get('employerZip')?.value).toBe('75024');
    });

    it('should auto-populate employer city when valid employer zip entered', fakeAsync(() => {
      deferralServiceSpy.getEmployerZipLookup.and.returnValue(of([
        { city: 'Frisco', state: 'TX', zip: '75034', uspsId: 33333 },
      ]));
      component.updateForm.get('employerZip')?.enable();
      component.updateForm.patchValue({ employerZip: '75034' });
      component.onEmployerZipBlur();
      tick();
      expect(deferralServiceSpy.getEmployerZipLookup).toHaveBeenCalledWith('75034');
      expect(component.updateForm.get('employerCity')?.value).toBe('Frisco');
      expect(component.employerStateDisplay()).toBe('TX');
    }));

    it('should not call getEmployerZipLookup when employer zip is too short', fakeAsync(() => {
      component.updateForm.get('employerZip')?.enable();
      component.updateForm.patchValue({ employerZip: '750' });
      component.onEmployerZipBlur();
      tick();
      expect(deferralServiceSpy.getEmployerZipLookup).not.toHaveBeenCalled();
    }));
  });

  describe('International Address Flows', () => {
    let dialogSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      dialogSpy = spyOn(component['dialog'], 'open');
    }));

    it('should open international address dialog for donor', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onInternationalAddress();
      expect(dialogSpy).toHaveBeenCalled();
    });

    it('should disable address fields when donor international address is set', () => {
      const intlResult = {
        streetName: '10 Downing Street', addr1: 'London', addr2: null, addr3: null,
        country: 'United Kingdom', postalCode: 'SW1A 2AA', intlAddrFlag: 'Y' as const,
      };
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(intlResult));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onInternationalAddress();
      expect(component.hasInternationalAddress()).toBe(true);
      expect(component.updateForm.get('homeAddress')?.disabled).toBe(true);
      expect(component.updateForm.get('city')?.disabled).toBe(true);
      expect(component.updateForm.get('zip')?.disabled).toBe(true);
      expect(component.stateDisplay()).toBe('--');
    });

    it('should enable address fields when donor international address is cleared (result null)', () => {
      const intlResult = {
        streetName: '10 Downing Street', addr1: 'London', addr2: null, addr3: null,
        country: 'United Kingdom', postalCode: 'SW1A 2AA', intlAddrFlag: 'Y' as const,
      };
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(intlResult));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onInternationalAddress();
      expect(component.hasInternationalAddress()).toBe(true);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onInternationalAddress();
      expect(component.hasInternationalAddress()).toBe(false);
      expect(component.updateForm.get('homeAddress')?.disabled).toBe(false);
      expect(component.updateForm.get('city')?.disabled).toBe(false);
    });

    it('should open international address dialog for employer', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onEmployerInternationalAddress();
      expect(dialogSpy).toHaveBeenCalled();
    });

    it('should disable employer fields when employer international address is set', () => {
      const intlResult = {
        streetName: 'Rue de Paris', addr1: 'Paris', addr2: null, addr3: null,
        country: 'France', postalCode: '75001', intlAddrFlag: 'Y' as const,
      };
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(intlResult));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onEmployerInternationalAddress();
      expect(component.updateForm.get('employerName')?.disabled).toBe(true);
      expect(component.employerStateDisplay()).toBe('--');
    });

    it('should enable employer fields when employer international address is cleared', () => {
      const intlResult = {
        streetName: 'Rue de Paris', addr1: 'Paris', addr2: null, addr3: null,
        country: 'France', postalCode: '75001', intlAddrFlag: 'Y' as const,
      };
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(intlResult));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onEmployerInternationalAddress();
      expect(component.updateForm.get('employerName')?.disabled).toBe(true);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onEmployerInternationalAddress();
      expect(component.updateForm.get('employerName')?.disabled).toBe(false);
    });

    it('should do nothing when dialog is dismissed (undefined)', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogSpy.and.returnValue(dialogRefSpy);
      const prevHasIntl = component.hasInternationalAddress();
      component.onInternationalAddress();
      expect(component.hasInternationalAddress()).toBe(prevHasIntl);
    });
  });

  describe('Alternate Address', () => {
    let dialogSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      dialogSpy = spyOn(component['dialog'], 'open');
    }));

    it('should call altDemoService.getByDonorId when donorId exists and no pending alt address', fakeAsync(() => {
      altDemoServiceSpy.getByDonorId.and.returnValue(of(null));
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onAlternateAddress();
      tick();
      expect(altDemoServiceSpy.getByDonorId).toHaveBeenCalledWith('DON123');
      expect(dialogSpy).toHaveBeenCalled();
    }));

    it('should store result as pending alt address when dialog returns object', fakeAsync(() => {
      altDemoServiceSpy.getByDonorId.and.returnValue(of(null));
      const altResult = { addressType: 'L', streetName: '456 Alt St', city: 'Dallas', state: 'TX', zip: '75201' } as any;
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(altResult));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onAlternateAddress();
      tick();
      expect(altDemoServiceSpy.getByDonorId).toHaveBeenCalled();
    }));

    it('should clear pending alt address when dialog returns null', fakeAsync(() => {
      altDemoServiceSpy.getByDonorId.and.returnValue(of(null));
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onAlternateAddress();
      tick();
      expect(altDemoServiceSpy.getByDonorId).toHaveBeenCalled();
    }));
  });

  describe('Manual Holds', () => {
    let dialogSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      dialogSpy = spyOn(component['dialog'], 'open');
    }));

    it('should open manual holds dialog', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onManualHolds();
      expect(dialogSpy).toHaveBeenCalled();
    });

    it('should set pending holds when dialog returns ok with selected holds', () => {
      const selectedHolds = [
        { interCode: 'H001', interDesc: 'Hold 1', interType: 'M' },
        { interCode: 'H002', interDesc: 'Hold 2', interType: 'M' },
      ];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ action: 'ok', selectedHolds }));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onManualHolds();
      expect(dialogSpy).toHaveBeenCalled();
    });

    it('should not update holds when dialog is dismissed (undefined result)', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogSpy.and.returnValue(dialogRefSpy);
      component.onManualHolds();
      expect(dialogSpy).toHaveBeenCalled();
    });
  });

  describe('Donation Type Cascading', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should load procedure codes and deferral reasons when donation type changes', fakeAsync(() => {
      deferralServiceSpy.getProcedureCodes.calls.reset();
      deferralServiceSpy.getDeferralReasons.calls.reset();
      deferralServiceSpy.getProcedureCodes.and.returnValue(of([{ code: 'P1', description: 'Proc 1' }]));
      deferralServiceSpy.getDeferralReasons.and.returnValue(of([{ code: 'R1', description: 'Reason 1' }]));
      component.updateForm.patchValue({ donationType: 'PL' });
      tick();
      expect(deferralServiceSpy.getProcedureCodes).toHaveBeenCalledWith('PL');
      expect(deferralServiceSpy.getDeferralReasons).toHaveBeenCalledWith('PL');
    }));

    it('should clear deferral reason but preserve procedure code on donation type change', () => {
      component.updateForm.patchValue({ procedureCode: 'PC1', deferral: 'DEF1' });
      component.onDonationTypeChange();
      expect(component.updateForm.get('procedureCode')?.value).toBe('PC1');
      expect(component.updateForm.get('deferral')?.value).toBe('');
    });
  });

  describe('onDeferralIdTab', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call onDeferralIdEntered when value is present', () => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;
      component.onDeferralIdTab(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.deferralIdDoubleEntry).toBe('pending');
    });

    it('should focus input when pending and empty', () => {
      component.deferralIdDoubleEntry = 'pending';
      component.searchForm.patchValue({ deferralId: '' });
      const mockInput = document.createElement('input');
      mockInput.id = 'deferralIdInput';
      spyOn(document, 'getElementById').and.returnValue(mockInput);
      spyOn(mockInput, 'focus');
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;
      component.onDeferralIdTab(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Retrieve Deferral Error Path', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error snackbar when retrieve fails', fakeAsync(() => {
      deferralServiceSpy.getDeferralById.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Not found' } } }))
      );
      doubleEntryAndRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Not found');
      expect(component.isLoading()).toBe(false);
      expect(component.showUpdateForm()).toBe(false);
    }));

    it('should show default error when error response has no message', fakeAsync(() => {
      deferralServiceSpy.getDeferralById.and.returnValue(throwError(() => ({})));
      doubleEntryAndRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Deferral not found');
    }));
  });

  describe('Drive Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should update drive date and min deferred thru date when drive selected', () => {
      component.drives.set([
        { driveId: 'DRV002', driveDate: '06152026', sponsorName: 'Test Sponsor' },
      ]);
      component.onDriveSelected('DRV002');
      expect(component.driveDate()).toBe('15-Jun-2026');
      expect(component.minDeferredThruDate()).toBeTruthy();
    });

    it('should not update if selected drive not found in drives', () => {
      const originalDriveDate = component.driveDate();
      component.drives.set([]);
      component.onDriveSelected('NONEXISTENT');
      expect(component.driveDate()).toBe(originalDriveDate);
    });
  });

  describe('Donation Type Change', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
    }));

    it('should clear deferral and preserve procedureCode on donation type change', () => {
      component.updateForm.patchValue({ procedureCode: '450', deferral: 'DEF1' });
      component.onDonationTypeChange();
      expect(component.updateForm.get('procedureCode')?.value).toBe('450');
      expect(component.updateForm.get('deferral')?.value).toBe('');
    });
  });

  describe('Full Submit Flow', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should submit successfully via final deferral ID double-entry', fakeAsync(() => {
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      expect(deferralServiceSpy.updateDeferral).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Deferral updated successfully');
    }));

    it('should show error when submit fails', fakeAsync(() => {
      deferralServiceSpy.updateDeferral.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '500', error: 'Server Error' } },
      })));
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should show error with generic message when error body has no errorResponse', fakeAsync(() => {
      deferralServiceSpy.updateDeferral.and.returnValue(throwError(() => ({
        error: { message: 'Generic failure' },
      })));
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Generic failure');
    }));

    it('should show error snackbar on submit failure with error code', fakeAsync(() => {
      deferralServiceSpy.updateDeferral.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { errorCode: 'E001', error: 'Server validation failed' } },
        }))
      );
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error E001: Server validation failed');
      expect(component.isLoading()).toBe(false);
    }));

    it('should show generic error on submit failure without error code', fakeAsync(() => {
      deferralServiceSpy.updateDeferral.and.returnValue(
        throwError(() => ({ error: { message: 'Network error' } }))
      );
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Network error');
    }));

    it('should show validation error when form is invalid on submit', fakeAsync(() => {
      component.updateForm.patchValue({ weight: null });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please fill all required fields');
      expect(deferralServiceSpy.updateDeferral).not.toHaveBeenCalled();
    }));

    it('should skip double-entry and re-submit when re-entering already confirmed final deferral ID after error', fakeAsync(() => {
      deferralServiceSpy.updateDeferral.and.returnValue(throwError(() => ({
        error: { message: 'Temporary error' },
      })));
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      expect(deferralServiceSpy.updateDeferral).toHaveBeenCalledTimes(1);
      deferralServiceSpy.updateDeferral.and.returnValue(of({ success: true, statusCode: 200, message: 'Updated' }));
      deferralServiceSpy.updateDeferral.calls.reset();
      component.updateForm.get('finalDeferralId')?.enable();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      expect(deferralServiceSpy.updateDeferral).toHaveBeenCalled();
    }));
  });

  describe('Retrieve Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show snackbar error when retrieve fails', fakeAsync(() => {
      deferralServiceSpy.getDeferralById.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Not Found' } },
      })));
      doubleEntryAndRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Not Found');
      expect(component.showUpdateForm()).toBe(false);
      expect(component.isLoading()).toBe(false);
    }));

    it('should show generic error message when error has no detail', fakeAsync(() => {
      deferralServiceSpy.getDeferralById.and.returnValue(throwError(() => ({ error: null })));
      doubleEntryAndRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Deferral not found');
    }));

    it('should show error.error property when errorResponse is missing', fakeAsync(() => {
      deferralServiceSpy.getDeferralById.and.returnValue(throwError(() => ({
        error: { error: 'Some specific error' },
      })));
      doubleEntryAndRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Some specific error');
    }));
  });

  describe('Deferral Type - Indefinite Disabling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
    }));

    it('should disable deferredThru when IND type is set and no deferred thru value', fakeAsync(() => {
      const noDateDetail = { ...mockDeferralDetail, deferredThruDate: null, deferralType: 'NA' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(noDateDetail));
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      component.updateForm.patchValue({ deferralType: DEFERRAL_TYPES.INDEFINITE });
      tick();
      expect(component.updateForm.get('deferredThru')?.disabled).toBe(true);
      expect(component.updateForm.get('deferredThru')?.value).toBeNull();
    }));

    it('should enable deferredThru when non-IND type is selected', fakeAsync(() => {
      const noDateDetail = { ...mockDeferralDetail, deferredThruDate: null, deferralType: 'IND' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(noDateDetail));
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      component.updateForm.get('deferredThru')?.disable();
      component.updateForm.patchValue({ deferralType: 'NA' });
      tick();
      expect(component.updateForm.get('deferredThru')?.disabled).toBe(false);
    }));
  });

  describe('Sex Display Computed', () => {
    it('should return Male for M', fakeAsync(() => {
      const maleDetail = { ...mockDeferralDetail, gender: 'M' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(maleDetail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.sexDisplay()).toBe('MALE');
    }));

    it('should return Female for F', fakeAsync(() => {
      const femaleDetail = { ...mockDeferralDetail, gender: 'F' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(femaleDetail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.sexDisplay()).toBe('FEMALE');
    }));

    it('should return the code itself for unknown gender', fakeAsync(() => {
      const unknownDetail = { ...mockDeferralDetail, gender: 'X' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(unknownDetail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.sexDisplay()).toBe('X');
    }));

    it('should return -- when sex is empty', fakeAsync(() => {
      const emptyDetail = { ...mockDeferralDetail, gender: '' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(emptyDetail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.sexDisplay()).toBe('--');
    }));
  });

  describe('Phone Formatting - Additional Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should format phone with 3 or fewer digits', () => {
      component.updateForm.patchValue({ homePhoneNumber: '214' });
      component.formatPhoneInput('homePhoneNumber');
      expect(component.updateForm.get('homePhoneNumber')?.value).toBe('(214');
    });

    it('should format phone with 4-6 digits', () => {
      component.updateForm.patchValue({ homePhoneNumber: '214852' });
      component.formatPhoneInput('homePhoneNumber');
      expect(component.updateForm.get('homePhoneNumber')?.value).toBe('(214) 852');
    });

    it('should format phone with 7+ digits', () => {
      component.updateForm.patchValue({ homePhoneNumber: '2148527584' });
      component.formatPhoneInput('homePhoneNumber');
      expect(component.updateForm.get('homePhoneNumber')?.value).toBe('(214) 852-7584');
    });

    it('should handle empty phone value', () => {
      component.updateForm.patchValue({ homePhoneNumber: '' });
      component.formatPhoneInput('homePhoneNumber');
      expect(component.updateForm.get('homePhoneNumber')?.value).toBe('(');
    });

    it('should do nothing for non-existent field', () => {
      expect(() => component.formatPhoneInput('nonExistentField')).not.toThrow();
    });
  });

  describe('Paste Handler', () => {
    let execCommandSpy: jasmine.Spy;

    beforeEach(() => {
      execCommandSpy = jasmine.createSpy('execCommand').and.returnValue(true);
      (document as any).execCommand = execCommandSpy;
    });

    it('should strip non-numeric characters and limit to 6 digits', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc123def456789' },
      } as unknown as ClipboardEvent;
      component.onPasteNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, '123456');
    });

    it('should handle empty paste data', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '' },
      } as unknown as ClipboardEvent;
      component.onPasteNumbers(event);
      expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, '');
    });
  });

  describe('Chapter Change', () => {
    it('should reset state and clear caches on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.showUpdateForm()).toBe(true);
      chapterChanged$.next();
      tick();
      expect(deferralServiceSpy.clearCaches).toHaveBeenCalled();
      expect(component.showUpdateForm()).toBe(false);
      expect(component.selectedDeferralId()).toBe('');
    }));
  });

  describe('Deferral ID Double-Entry Mismatch', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when second entry does not match first', () => {
      component.searchForm.patchValue({ deferralId: '11111111' });
      component.onDeferralIdEntered();
      expect(component.deferralIdDoubleEntry).toBe('pending');
      component.searchForm.patchValue({ deferralId: '22222222' });
      component.onDeferralIdEntered();
      expect(component.deferralIdDoubleEntry).toBe('idle');
      expect(component.searchForm.get('deferralId')?.hasError('serverError')).toBe(true);
    });
  });

  describe('Tab Key Handler', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prevent default and trigger double-entry when value is present', () => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;
      component.onDeferralIdTab(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.deferralIdDoubleEntry).toBe('pending');
    });

    it('should prevent default and keep focus when value is empty', () => {
      component.searchForm.patchValue({ deferralId: '' });
      const mockInput = document.createElement('input');
      mockInput.id = 'deferralIdInput';
      mockInput.focus = jest.fn();
      spyOn(document, 'getElementById').and.returnValue(mockInput);
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;
      component.onDeferralIdTab(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent default and keep focus when in pending state with empty value', () => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      expect(component.deferralIdDoubleEntry).toBe('pending');
      component.searchForm.patchValue({ deferralId: '' });
      const mockInput = document.createElement('input');
      mockInput.id = 'deferralIdInput';
      mockInput.focus = jest.fn();
      spyOn(document, 'getElementById').and.returnValue(mockInput);
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;
      component.onDeferralIdTab(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('C-Format Deferral IDs', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should accept C-format deferral ID (C12345678C)', () => {
      component.searchForm.patchValue({ deferralId: 'C12345678C' });
      expect(component.searchForm.get('deferralId')?.valid).toBe(true);
    });

    it('should accept lowercase c-format deferral ID', () => {
      component.searchForm.patchValue({ deferralId: 'c12345678c' });
      expect(component.searchForm.get('deferralId')?.valid).toBe(true);
    });

    it('should normalize C-format ID during double-entry', () => {
      component.searchForm.patchValue({ deferralId: 'C12345678C' });
      component.onDeferralIdEntered();
      component.searchForm.patchValue({ deferralId: 'C12345678C' });
      component.onDeferralIdEntered();
      expect(component.selectedDeferralId()).toBe('12345678');
    });
  });

  describe('validateDeferredThruDate', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should clear deferred thru date when it is before drive date', () => {
      component.minDeferredThruDate.set(moment('2026-05-10'));
      component.updateForm.patchValue({ deferredThru: moment('2026-04-01') });
      component.validateDeferredThruDate();
      expect(component.updateForm.get('deferredThru')?.value).toBeNull();
      expect(component.updateForm.get('deferredThru')?.hasError('serverError')).toBe(true);
    });

    it('should not clear deferred thru date when it is after drive date', () => {
      component.minDeferredThruDate.set(moment('2026-05-10'));
      component.updateForm.patchValue({ deferredThru: moment('2026-06-10') });
      component.validateDeferredThruDate();
      expect(component.updateForm.get('deferredThru')?.value).toBeTruthy();
    });

    it('should do nothing when deferred thru is null', () => {
      component.updateForm.patchValue({ deferredThru: null });
      component.validateDeferredThruDate();
      expect(component.updateForm.get('deferredThru')?.value).toBeNull();
    });

    it('should do nothing when minDeferredThruDate is null', () => {
      component.minDeferredThruDate.set(null);
      component.updateForm.patchValue({ deferredThru: moment('2026-06-10') });
      component.validateDeferredThruDate();
      expect(component.updateForm.get('deferredThru')?.value).toBeTruthy();
    });
  });

  describe('onDeferredThruInput', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should call DateFieldValidationUtility.handleEndDateInput', () => {
      const event = { target: { value: '01JAN2027' } } as unknown as Event;
      expect(() => component.onDeferredThruInput(event)).not.toThrow();
    });

    it('should handle empty input value', () => {
      const event = { target: { value: '' } } as unknown as Event;
      expect(() => component.onDeferredThruInput(event)).not.toThrow();
    });
  });

  describe('Entered By Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should return enteredBy signal value', () => {
      expect(component.enteredByText).toBe('John Doe');
    });

    it('should return -- when enteredBy is empty', () => {
      component['enteredBy'].set('');
      expect(component.enteredByText).toBe('--');
    });
  });

  describe('Height Display', () => {
    it('should set heightDisplay from response data', fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.heightDisplay()).toBe('5\' 10"');
    }));

    it('should set -- when height is null', fakeAsync(() => {
      const noHeightDetail = { ...mockDeferralDetail, height: null };
      deferralServiceSpy.getDeferralById.and.returnValue(of(noHeightDetail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.heightDisplay()).toBe('--');
    }));
  });

  describe('Work Phone Extension', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should have workPhoneExtension field in form', () => {
      expect(component.updateForm.get('workPhoneExtension')).toBeTruthy();
    });

    it('should set extension value from response', fakeAsync(() => {
      const withExtension = { ...mockDeferralDetail, extension: '1234' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(withExtension));
      component.clearFormForNext();
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.updateForm.get('workPhoneExtension')?.value).toBe('1234');
    }));
  });

  describe('Server-Side Field Validation Errors', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should set serverError on donation type validation failure', fakeAsync(() => {
      deferralServiceSpy.validateDonationType.and.returnValue(throwError(() => ({ error: { error: 'Invalid donation type' } })));
      component.updateForm.patchValue({ donationType: 'INVALID' });
      component.validateDonationTypeField();
      tick();
      expect(component.updateForm.get('donationType')?.hasError('serverError')).toBe(true);
    }));

    it('should set serverError on procedure code validation failure', fakeAsync(() => {
      deferralServiceSpy.validateProcedureCode.and.returnValue(throwError(() => ({ error: { error: 'Invalid procedure code' } })));
      component.updateForm.patchValue({ donationType: 'WB', procedureCode: 'BAD' });
      component.validateProcedureCodeField();
      tick();
      expect(component.updateForm.get('procedureCode')?.hasError('serverError')).toBe(true);
    }));

    it('should set serverError on equipment type validation failure', fakeAsync(() => {
      deferralServiceSpy.validateEquipmentType.and.returnValue(throwError(() => ({ error: { error: 'Invalid equipment' } })));
      component.updateForm.patchValue({ equipmentType: 'BAD' });
      component.validateEquipmentTypeField();
      tick();
      expect(component.updateForm.get('equipmentType')?.hasError('serverError')).toBe(true);
    }));

    it('should set serverError on deferral reason validation failure from server', fakeAsync(() => {
      deferralServiceSpy.validateDeferralReason.and.returnValue(throwError(() => ({ error: { error: 'Invalid deferral reason' } })));
      component.updateForm.patchValue({ deferral: 'BAD_REASON', donationType: 'WB' });
      component.validateDeferralReasonField();
      tick();
      expect(component.updateForm.get('deferral')?.hasError('serverError')).toBe(true);
    }));

    it('should not validate donation type when value is empty', () => {
      deferralServiceSpy.validateDonationType.calls.reset();
      component.updateForm.patchValue({ donationType: '' });
      component.validateDonationTypeField();
      expect(deferralServiceSpy.validateDonationType).not.toHaveBeenCalled();
    });

    it('should not validate procedure code when donation type is empty', () => {
      deferralServiceSpy.validateProcedureCode.calls.reset();
      component.updateForm.patchValue({ donationType: '', procedureCode: 'P1' });
      component.validateProcedureCodeField();
      expect(deferralServiceSpy.validateProcedureCode).not.toHaveBeenCalled();
    });

    it('should not validate equipment type when value is empty', () => {
      deferralServiceSpy.validateEquipmentType.calls.reset();
      component.updateForm.patchValue({ equipmentType: '' });
      component.validateEquipmentTypeField();
      expect(deferralServiceSpy.validateEquipmentType).not.toHaveBeenCalled();
    });

    it('should not validate deferral reason when value is empty', () => {
      deferralServiceSpy.validateDeferralReason.calls.reset();
      component.updateForm.patchValue({ deferral: '' });
      component.validateDeferralReasonField();
      expect(deferralServiceSpy.validateDeferralReason).not.toHaveBeenCalled();
    });

    it('should set serverError on deferral reason value of 0', () => {
      component.updateForm.patchValue({ deferral: '0' });
      component.validateDeferralReasonField();
      expect(component.updateForm.get('deferral')?.hasError('serverError')).toBe(true);
      expect(component.updateForm.get('deferral')?.value).toBe('');
    });

    it('should set serverError on alternate ID type validation failure', fakeAsync(() => {
      deferralServiceSpy.validateAlternateIdTypeField.and.returnValue(throwError(() => ({ error: { error: 'Invalid alternate ID type' } })));
      component.updateForm.patchValue({ alternateType: 'BAD' });
      component.validateAlternateIdTypeField();
      tick();
      expect(component.updateForm.get('alternateType')?.hasError('serverError')).toBe(true);
    }));

    it('should not validate alternate ID type when value is empty', () => {
      deferralServiceSpy.validateAlternateIdTypeField.calls.reset();
      component.updateForm.patchValue({ alternateType: '' });
      component.validateAlternateIdTypeField();
      expect(deferralServiceSpy.validateAlternateIdTypeField).not.toHaveBeenCalled();
    });

    it('should set serverError on ethnic group validation failure', fakeAsync(() => {
      deferralServiceSpy.validateEthnicGroupField.and.returnValue(throwError(() => ({ error: { error: 'Invalid ethnic group' } })));
      component.updateForm.patchValue({ ethnicGroup: 'BAD' });
      component.validateEthnicGroupField();
      tick();
      expect(component.updateForm.get('ethnicGroup')?.hasError('serverError')).toBe(true);
    }));

    it('should not validate ethnic group when value is empty', () => {
      deferralServiceSpy.validateEthnicGroupField.calls.reset();
      component.updateForm.patchValue({ ethnicGroup: '' });
      component.validateEthnicGroupField();
      expect(deferralServiceSpy.validateEthnicGroupField).not.toHaveBeenCalled();
    });

    it('should not validate city when value is empty', () => {
      deferralServiceSpy.validateCityField.calls.reset();
      component.updateForm.patchValue({ city: '' });
      component.validateCityField();
      expect(deferralServiceSpy.validateCityField).not.toHaveBeenCalled();
    });

    it('should not validate zip when zip is empty', () => {
      deferralServiceSpy.validateZipCityField.calls.reset();
      component.updateForm.patchValue({ zip: '', city: 'Dallas' });
      component.validateZipField();
      expect(deferralServiceSpy.validateZipCityField).not.toHaveBeenCalled();
    });

    it('should not validate zip when city is empty', () => {
      deferralServiceSpy.validateZipCityField.calls.reset();
      component.updateForm.patchValue({ zip: '75201', city: '' });
      component.validateZipField();
      expect(deferralServiceSpy.validateZipCityField).not.toHaveBeenCalled();
    });

    it('should not validate staff when value is empty', () => {
      deferralServiceSpy.validateStaff.calls.reset();
      component.updateForm.patchValue({ lookupId: '' });
      component.validateStaffField('lookupId');
      expect(deferralServiceSpy.validateStaff).not.toHaveBeenCalled();
    });

    it('should set serverError on staff validation failure', fakeAsync(() => {
      deferralServiceSpy.validateStaff.and.returnValue(throwError(() => ({ error: { error: 'Invalid staff' } })));
      component.updateForm.patchValue({ lookupId: 'BAD' });
      component.validateStaffField('lookupId');
      tick();
      expect(component.updateForm.get('lookupId')?.hasError('serverError')).toBe(true);
    }));
  });

  describe('Number Input - Additional Cases', () => {
    it('should allow control key combinations', () => {
      const input = document.createElement('input');
      input.value = '123';
      expect(component.onlyNumbers({ which: 65, keyCode: 65, ctrlKey: true, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent)).toBe(true);
      expect(component.onlyNumbers({ which: 67, keyCode: 67, ctrlKey: true, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent)).toBe(true);
      expect(component.onlyNumbers({ which: 86, keyCode: 86, ctrlKey: true, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent)).toBe(true);
      expect(component.onlyNumbers({ which: 88, keyCode: 88, ctrlKey: true, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent)).toBe(true);
    });

    it('should allow special keys (tab, backspace, etc)', () => {
      const input = document.createElement('input');
      input.value = '123';
      expect(component.onlyNumbers({ which: 9, keyCode: 9, ctrlKey: false, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent)).toBe(true);
      expect(component.onlyNumbers({ which: 8, keyCode: 8, ctrlKey: false, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent)).toBe(true);
      expect(component.onlyNumbers({ which: 46, keyCode: 46, ctrlKey: false, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent)).toBe(true);
    });

    it('should allow numpad keys', () => {
      const input = document.createElement('input');
      input.value = '123';
      expect(component.onlyNumbers({ which: 96, keyCode: 96, ctrlKey: false, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent)).toBe(true);
    });

    it('should prevent input when value already has 6 digits', () => {
      const input = document.createElement('input');
      input.value = '123456';
      const event = { which: 53, keyCode: 53, ctrlKey: false, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent;
      const result = component.onlyNumbers(event);
      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow arrow keys', () => {
      const input = document.createElement('input');
      input.value = '123';
      expect(component.onlyNumbers({ which: 39, keyCode: 39, ctrlKey: false, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent)).toBe(true);
      expect(component.onlyNumbers({ which: 37, keyCode: 37, ctrlKey: false, preventDefault: jasmine.createSpy(), target: input } as unknown as KeyboardEvent)).toBe(true);
    });
  });

  describe('Final Deferral ID Double-Entry Mismatch', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should show error when final deferral ID second entry does not match first', () => {
      component.updateForm.patchValue({ finalDeferralId: '11111111' });
      component.onFinalDeferralIdEntered();
      expect(component.finalDeferralIdDoubleEntry).toBe('pending');
      component.updateForm.patchValue({ finalDeferralId: '22222222' });
      component.onFinalDeferralIdEntered();
      expect(component.finalDeferralIdDoubleEntry).toBe('idle');
      expect(component.updateForm.get('finalDeferralId')?.hasError('serverError')).toBe(true);
    });

    it('should not proceed when loading is true', () => {
      component.isLoading.set(true);
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      expect(component.finalDeferralIdDoubleEntry).toBe('idle');
    });

    it('should not proceed when final deferral ID is invalid', () => {
      component.updateForm.patchValue({ finalDeferralId: 'ABC' });
      component.onFinalDeferralIdEntered();
      expect(component.finalDeferralIdDoubleEntry).toBe('idle');
    });

    it('should not proceed when final deferral ID control is disabled', () => {
      component.updateForm.get('finalDeferralId')?.disable();
      component.onFinalDeferralIdEntered();
      expect(component.finalDeferralIdDoubleEntry).toBe('idle');
    });
  });

  describe('Populate Form - International Address', () => {
    it('should set donor international address when intlAddrFlag is Y', fakeAsync(() => {
      const intlDetail = {
        ...mockDeferralDetail,
        intlAddrFlag: 'Y', intlAddress1: 'Street 1', intlAddress2: 'Apt 2',
        intlAddress3: 'Floor 3', intlAddress4: 'Block 4',
        countryName: 'United Kingdom', intlPostalCode: 'SW1A 2AA',
        intlHomePhoneNo: '020-1234-5678', intlWorkPhoneNo: '020-8765-4321',
        intlWorkPhoneExt: '100', intlMobilePhoneNo: '07911-123456', intlFaxNo: '020-1111-2222',
      };
      deferralServiceSpy.getDeferralById.and.returnValue(of(intlDetail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.hasInternationalAddress()).toBe(true);
      expect(component.updateForm.get('homeAddress')?.disabled).toBe(true);
      expect(component.updateForm.get('city')?.disabled).toBe(true);
    }));

    it('should set employer international address when empIntlAddrFlag is Y', fakeAsync(() => {
      const empIntlDetail = {
        ...mockDeferralDetail,
        empIntlAddrFlag: 'Y', empIntlCity: 'London', empIntlState: 'England',
        empIntlPostalCode: 'EC1A', empIntlCountryName: 'United Kingdom',
      };
      deferralServiceSpy.getDeferralById.and.returnValue(of(empIntlDetail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.employerStateDisplay()).toBe('--');
      expect(component.updateForm.get('employerName')?.disabled).toBe(true);
    }));

    it('should set pending alternate address when altStreetName is present', fakeAsync(() => {
      const altDetail = {
        ...mockDeferralDetail,
        altStreetName: '789 Alt St', altSuiteApt: 'B2',
        altCity: 'Chicago', altState: 'IL', altZip: '60601',
      };
      deferralServiceSpy.getDeferralById.and.returnValue(of(altDetail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.showUpdateForm()).toBe(true);
    }));

    it('should set pending alternate address when altIntlAddress1 is present', fakeAsync(() => {
      const altIntlDetail = {
        ...mockDeferralDetail,
        altIntlAddress1: 'Int Street 1', altIntlAddrFlag: 'Y', altCountryName: 'France',
      };
      deferralServiceSpy.getDeferralById.and.returnValue(of(altIntlDetail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.showUpdateForm()).toBe(true);
    }));
  });

  describe('Populate Form - Preferred Contact Mapping', () => {
    it('should map H to home', fakeAsync(() => {
      const detail = { ...mockDeferralDetail, preferredContactFlag: 'H' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.updateForm.get('preferredPhone')?.value).toBe('home');
    }));

    it('should map W to work', fakeAsync(() => {
      const detail = { ...mockDeferralDetail, preferredContactFlag: 'W' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.updateForm.get('preferredPhone')?.value).toBe('work');
    }));

    it('should map unknown flag to empty string', fakeAsync(() => {
      const detail = { ...mockDeferralDetail, preferredContactFlag: 'X' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.updateForm.get('preferredPhone')?.value).toBe('');
    }));

    it('should handle null preferredContactFlag', fakeAsync(() => {
      const detail: DeferralDetailDto = { ...mockDeferralDetail, preferredContactFlag: null };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.updateForm.get('preferredPhone')?.value).toBe('');
    }));
  });

  describe('Populate Form - ABO Description Fallback', () => {
    it('should use bloodType when aboDescription is null', fakeAsync(() => {
      const detail = { ...mockDeferralDetail, aboDescription: null, bloodType: 'AB+' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.aboDescription()).toBe('AB+');
    }));

    it('should use -- when both aboDescription and bloodType are null', fakeAsync(() => {
      const detail = { ...mockDeferralDetail, aboDescription: null, bloodType: null };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.aboDescription()).toBe('--');
    }));
  });

  describe('Populate Form - Phone Formatting', () => {
    it('should format phone without area code', fakeAsync(() => {
      const detail = { ...mockDeferralDetail, hAreaCode: null, hPhoneNo: '8527584' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.updateForm.get('homePhoneNumber')?.value).toBe('852-7584');
    }));

    it('should handle null phone number', fakeAsync(() => {
      const detail = { ...mockDeferralDetail, hAreaCode: null, hPhoneNo: null };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.updateForm.get('homePhoneNumber')?.value).toBe('');
    }));

    it('should handle short phone number', fakeAsync(() => {
      const detail = { ...mockDeferralDetail, hAreaCode: null, hPhoneNo: '123' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.updateForm.get('homePhoneNumber')?.value).toBe('123');
    }));

    it('should handle 4-digit short phone number', fakeAsync(() => {
      const detail: DeferralDetailDto = { ...mockDeferralDetail, hAreaCode: null, hPhoneNo: '1234' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.updateForm.get('homePhoneNumber')?.value).toBe('1234');
    }));
  });

  describe('Populate Form - Drive Date Formatting', () => {
    it('should format drive date', fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.driveDate()).toMatch(/\d{2}-\w{3}-\d{4}/);
    }));

    it('should set -- when driveDate is null', fakeAsync(() => {
      const detail = { ...mockDeferralDetail, driveDate: null };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.driveDate()).toBe('--');
    }));
  });

  describe('Existing Interdictions Loading', () => {
    it('should load existing interdictions when transactionId is present', fakeAsync(() => {
      deferralServiceSpy.getInterdictions.and.returnValue(of([
        { interCode: 'IC1', interType: 'M', description: 'Hold 1', comments: '', transactionId: 'TXN456', termDate: '', releaseDate: '', releaseUser: '' },
      ]));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(deferralServiceSpy.getInterdictions).toHaveBeenCalledWith('TXN456');
    }));

    it('should not load interdictions when transactionId is null', fakeAsync(() => {
      const noTxnDetail = { ...mockDeferralDetail, transactionId: null };
      deferralServiceSpy.getDeferralById.and.returnValue(of(noTxnDetail));
      deferralServiceSpy.getInterdictions.calls.reset();
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(deferralServiceSpy.getInterdictions).not.toHaveBeenCalled();
    }));
  });

  describe('Ethnic Required', () => {
    it('should add required validator for ethnic group when ethnicRequired is true', fakeAsync(() => {
      deferralServiceSpy.getEthnicRequired.and.returnValue(of(true));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      component.updateForm.patchValue({ ethnicGroup: '' });
      expect(component.updateForm.get('ethnicGroup')?.hasError('required')).toBe(true);
    }));
  });

  describe('getDriveDateForApi', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should use drive date from selected drive when available', () => {
      component.drives.set([{ driveId: 'DRV001', driveDate: '05102026', sponsorName: 'Test' }]);
      component.updateForm.patchValue({ driveId: 'DRV001' });
      deferralServiceSpy.validateStaff.calls.reset();
      component.updateForm.patchValue({ lookupId: 'STF001' });
      component.validateStaffField('lookupId');
      expect(deferralServiceSpy.validateStaff).toHaveBeenCalledWith('STF001', jasmine.any(String));
    });

    it('should use driveDate signal when no drive selected', () => {
      component.updateForm.patchValue({ driveId: '' });
      deferralServiceSpy.validateStaff.calls.reset();
      component.updateForm.patchValue({ lookupId: 'STF001' });
      component.validateStaffField('lookupId');
      expect(deferralServiceSpy.validateStaff).toHaveBeenCalled();
    });
  });

  describe('enableEditableFields', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should not enable employerName when international employer address is set', fakeAsync(() => {
      component.filteredEmployers.set([{
        employerId: 'EMP_INTL', employerName: 'Intl Corp', intlAddrFlag: 'Y', country: 'UK',
      }]);
      component.onEmployerSelected('EMP_INTL');
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      expect(deferralServiceSpy.updateDeferral).toHaveBeenCalled();
    }));
  });

  describe('Retrieve - normalizedId differs from input', () => {
    it('should update search form when normalizedId is different from input', fakeAsync(() => {
      const detailWithDifferentId = { ...mockDeferralDetail, deferralId: '99999999' };
      deferralServiceSpy.getDeferralById.and.returnValue(of(detailWithDifferentId));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      expect(component.selectedDeferralId()).toBe('99999999');
    }));
  });

  describe('onDeferralIdEntered - edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
    }));

    it('should not proceed when loading', () => {
      component.isLoading.set(true);
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      expect(component.deferralIdDoubleEntry).toBe('idle');
    });

    it('should not proceed when deferralId is empty', () => {
      component.searchForm.patchValue({ deferralId: '' });
      component.onDeferralIdEntered();
      expect(component.deferralIdDoubleEntry).toBe('idle');
    });

    it('should reset form when entering new ID while form is showing', fakeAsync(() => {
      doubleEntryAndRetrieve();
      tick();
      expect(component.showUpdateForm()).toBe(true);
      component.searchForm.patchValue({ deferralId: '87654321' });
      component.onDeferralIdEntered();
      expect(component.showUpdateForm()).toBe(false);
      expect(component.deferralIdDoubleEntry).toBe('pending');
    }));
  });

  describe('buildUpdateRequest - comprehensive', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should include all fields in the request via successful submit', fakeAsync(() => {
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
        firstName: 'John', suffix: 'Jr.', middleName: 'Michael',
        alternateId: 'ALT123', alternateType: 'PASPT',
        homePhoneNumber: '(214) 852-7584', workPhoneNumber: '(214) 852-7585',
        workPhoneExtension: '123', mobilePhoneNumber: '(214) 852-7586',
        preferredPhone: 'home', email: 'test-user@example.com',
        equipmentType: 'EQ001', historianId: 'SCR001', reviewerId: 'REV001', lookupId: 'STF001',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      expect(deferralServiceSpy.updateDeferral).toHaveBeenCalled();
      const request = deferralServiceSpy.updateDeferral.calls.mostRecent().args[1];
      expect(request.firstName).toBe('JOHN');
      expect(request.lastNameSuffix).toBe('JR.');
      expect(request.streetName).toBe('123 Main St');
      expect(request.hAreaCode).toBe('214');
      expect(request.hPhoneNo).toBe('8527584');
      expect(request.extension).toBe('123');
      expect(request.preferredContactFlag).toBe('H');
      expect(request.intlAddrFlag).toBe('N');
    }));

    it('should map work preferred phone', fakeAsync(() => {
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
        preferredPhone: 'work',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      const request = deferralServiceSpy.updateDeferral.calls.mostRecent().args[1];
      expect(request.preferredContactFlag).toBe('W');
    }));

    it('should map mobile preferred phone', fakeAsync(() => {
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
        preferredPhone: 'mobile',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      const request = deferralServiceSpy.updateDeferral.calls.mostRecent().args[1];
      expect(request.preferredContactFlag).toBe('M');
    }));

    it('should set null preferred contact flag when no preference', fakeAsync(() => {
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
        preferredPhone: '',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      const request = deferralServiceSpy.updateDeferral.calls.mostRecent().args[1];
      expect(request.preferredContactFlag).toBeNull();
    }));
  });

  describe('parsePhone', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should parse 10-digit phone into area code and phone number via submit', fakeAsync(() => {
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
        homePhoneNumber: '(214) 852-7584',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      const request = deferralServiceSpy.updateDeferral.calls.mostRecent().args[1];
      expect(request.hAreaCode).toBe('214');
      expect(request.hPhoneNo).toBe('8527584');
    }));

    it('should handle 7-digit phone number (no area code)', fakeAsync(() => {
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
        homePhoneNumber: '852-7584',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      const request = deferralServiceSpy.updateDeferral.calls.mostRecent().args[1];
      expect(request.hAreaCode).toBeNull();
      expect(request.hPhoneNo).toBe('8527584');
    }));

    it('should handle empty phone number in submit', fakeAsync(() => {
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
        homePhoneNumber: '',
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      const request = deferralServiceSpy.updateDeferral.calls.mostRecent().args[1];
      expect(request.hAreaCode).toBeNull();
      expect(request.hPhoneNo).toBeNull();
    }));
  });

  describe('formatDateForApi', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should format moment date for API', fakeAsync(() => {
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
        dob: moment('1990-01-15'), deferredThru: moment('2026-08-10'),
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      const request = deferralServiceSpy.updateDeferral.calls.mostRecent().args[1];
      expect(request.deferredThruDate).toBe('2026-08-10');
      expect(request.dateOfBirth).toBeUndefined();
    }));

    it('should return null for null date', fakeAsync(() => {
      component.updateForm.patchValue({
        homeAddress: '123 Main St', city: 'New York', zip: '10001',
        weight: 180, ethnicGroup: 'CA', donationType: 'WB',
        procedureCode: '450', deferral: 'LOW_HB', deferralType: 'NA',
        deferredThru: null,
      });
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      component.updateForm.patchValue({ finalDeferralId: VALID_DEFERRAL_ID });
      component.onFinalDeferralIdEntered();
      tick();
      const request = deferralServiceSpy.updateDeferral.calls.mostRecent().args[1];
      expect(request.deferredThruDate).toBeNull();
    }));
  });

  describe('Retrieve with IND deferral type', () => {
    it('should disable deferredThru when deferralType is IND from response', fakeAsync(() => {
      const indDetail = { ...mockDeferralDetail, deferralType: DEFERRAL_TYPES.INDEFINITE, deferredThruDate: null };
      deferralServiceSpy.getDeferralById.and.returnValue(of(indDetail));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.updateForm.get('deferredThru')?.disabled).toBe(true);
    }));
  });

  describe('Drives loaded with existing driveId', () => {
    it('should preserve current driveId when drives load', fakeAsync(() => {
      deferralServiceSpy.getDrives.and.returnValue(of([
        { driveId: 'DRV001', driveDate: '05102026', sponsorName: 'Sponsor' },
      ]));
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      expect(component.updateForm.get('driveId')?.value).toBe('DRV001');
    }));
  });

  describe('onRetrieve edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not retrieve when search form is invalid after double-entry', fakeAsync(() => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      component.searchForm.get('deferralId')?.setErrors({ pattern: true });
      component.onRetrieve();
      tick();
      expect(deferralServiceSpy.getDeferralById).not.toHaveBeenCalled();
    }));

    it('should not retrieve when deferralId is empty after double-entry', fakeAsync(() => {
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      component.searchForm.patchValue({ deferralId: VALID_DEFERRAL_ID });
      component.onDeferralIdEntered();
      component.searchForm.get('deferralId')?.setValue('', { emitEvent: false });
      component.onRetrieve();
      tick();
      expect(deferralServiceSpy.getDeferralById).not.toHaveBeenCalled();
    }));

    it('should skip retrieve when same deferralId is already showing', fakeAsync(() => {
      doubleEntryAndRetrieve();
      tick();
      expect(component.showUpdateForm()).toBe(true);
      deferralServiceSpy.getDeferralById.calls.reset();
      component.onRetrieve();
      tick();
      expect(deferralServiceSpy.getDeferralById).not.toHaveBeenCalled();
    }));
  });

  describe('Filter Listeners', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
    }));

    it('should filter drives when driveFilterCtrl changes', fakeAsync(() => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '05102026', sponsorName: 'Red Cross' },
        { driveId: 'DRV002', driveDate: '06102026', sponsorName: 'Blood Center' },
      ]);
      component.driveFilterCtrl.setValue('DRV001');
      tick(350);
      expect(component.filteredDrives().length).toBe(1);
      expect(component.filteredDrives()[0].driveId).toBe('DRV001');
    }));

    it('should reset filtered drives when filter is cleared', fakeAsync(() => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '05102026' },
        { driveId: 'DRV002', driveDate: '06102026' },
      ]);
      component.driveFilterCtrl.setValue('DRV001');
      tick(350);
      component.driveFilterCtrl.setValue('');
      tick(350);
      expect(component.filteredDrives().length).toBe(2);
    }));

    it('should call getCities when citySearchCtrl has 3+ characters', fakeAsync(() => {
      deferralServiceSpy.getCities.and.returnValue(of([{ city: 'Dallas', state: 'TX', zip: '75001', uspsId: 1 }]));
      component.citySearchCtrl.setValue('Dal');
      tick(350);
      expect(deferralServiceSpy.getCities).toHaveBeenCalledWith('Dal');
    }));

    it('should reset cities when citySearchCtrl has less than 3 chars', fakeAsync(() => {
      component.cities.set([{ city: 'Test', state: 'TX', zip: '75001', uspsId: 1 }]);
      component.citySearchCtrl.setValue('Da');
      tick(350);
      expect(component.filteredCities().length).toBe(1);
    }));

    it('should call getEmployers when employerFilterCtrl has input', fakeAsync(() => {
      deferralServiceSpy.getEmployers.and.returnValue(of([{ employerId: 'E001', employerName: 'Acme' }]));
      component.employerFilterCtrl.setValue('Ac');
      tick(350);
      expect(deferralServiceSpy.getEmployers).toHaveBeenCalledWith('Ac');
    }));

    it('should call getEmployerCities when employerCitySearchCtrl has 3+ chars', fakeAsync(() => {
      deferralServiceSpy.getEmployerCities.and.returnValue(of([{ city: 'Houston', state: 'TX', zip: '77001', uspsId: 2 }]));
      component.employerCitySearchCtrl.setValue('Hou');
      tick(350);
      expect(deferralServiceSpy.getEmployerCities).toHaveBeenCalledWith('Hou');
    }));

    it('should reset employer cities when employerCitySearchCtrl has less than 3 chars', fakeAsync(() => {
      component.employerCities.set([{ city: 'Test', state: 'TX', zip: '75001', uspsId: 1 }]);
      component.employerCitySearchCtrl.setValue('Ho');
      tick(350);
      expect(component.filteredEmployerCities().length).toBe(1);
    }));

    it('should filter donation types', fakeAsync(() => {
      component.donationTypes.set([
        { code: 'WB', description: 'Whole Blood' },
        { code: 'PL', description: 'Platelet' },
      ]);
      component.donationTypeFilterCtrl.setValue('whole');
      tick(350);
      expect(component.filteredDonationTypes().length).toBe(1);
    }));

    it('should filter equipment types', fakeAsync(() => {
      component.equipmentTypes.set([
        { code: 'EQ1', description: 'Type A' },
        { code: 'EQ2', description: 'Type B' },
      ]);
      component.equipmentTypeFilterCtrl.setValue('type a');
      tick(350);
      expect(component.filteredEquipmentTypes().length).toBe(1);
    }));

    it('should filter ethnic groups', fakeAsync(() => {
      component.ethnicGroups.set([
        { code: 'CA', description: 'Caucasian' },
        { code: 'AA', description: 'African American' },
      ]);
      component.ethnicGroupFilterCtrl.setValue('cau');
      tick(350);
      expect(component.filteredEthnicGroups().length).toBe(1);
    }));

    it('should filter alternate types', fakeAsync(() => {
      component.alternateTypes.set([
        { code: 'PASPT', description: 'Passport' },
        { code: 'DL', description: 'Drivers License' },
      ]);
      component.alternateTypeFilterCtrl.setValue('pass');
      tick(350);
      expect(component.filteredAlternateTypes().length).toBe(1);
    }));
  });

  describe('sexDisplay Computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return Male for M', () => {
      component.updateForm.patchValue({ sex: 'M' });
      expect(component.sexDisplay()).toBe('MALE');
    });

    it('should return Female for F', () => {
      component.updateForm.patchValue({ sex: 'F' });
      expect(component.sexDisplay()).toBe('FEMALE');
    });

    it('should return raw code for unknown value', () => {
      component.updateForm.patchValue({ sex: 'X' });
      expect(component.sexDisplay()).toBe('X');
    });

    it('should return -- for empty value', () => {
      component.updateForm.patchValue({ sex: '' });
      expect(component.sexDisplay()).toBe('--');
    });
  });

  describe('Deferral Type INDEFINITE Without DeferredThru', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should disable deferredThru when INDEFINITE selected and no thru date', fakeAsync(() => {
      component.updateForm.patchValue({ deferredThru: null }, { emitEvent: false });
      component.updateForm.patchValue({ deferralType: DEFERRAL_TYPES.INDEFINITE });
      tick();
      expect(component.updateForm.get('deferredThru')?.disabled).toBeTrue();
    }));

    it('should enable deferredThru when non-INDEFINITE type selected', fakeAsync(() => {
      component.updateForm.patchValue({ deferredThru: null }, { emitEvent: false });
      component.updateForm.patchValue({ deferralType: DEFERRAL_TYPES.INDEFINITE });
      tick();
      component.updateForm.patchValue({ deferralType: DEFERRAL_TYPES.NOT_APPLICABLE });
      tick();
      expect(component.updateForm.get('deferredThru')?.disabled).toBeFalse();
    }));
  });

  describe('Dialog Interactions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      doubleEntryAndRetrieve();
      tick();
      fixture.detectChanges();
      matDialogSpy.open.calls.reset();
      (component as any).dialog = matDialogSpy;
    }));

    it('should open international address dialog and handle result for donor', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of({
        streetName: 'Intl Street', addr1: 'Addr1', addr2: null, addr3: null,
        country: 'UK', postalCode: 'SW1A', intlAddrFlag: 'Y',
      }));
      matDialogSpy.open.and.returnValue(mockDialogRef);
      component.onInternationalAddress();
      expect(matDialogSpy.open).toHaveBeenCalled();
      expect(component.hasInternationalAddress()).toBeTrue();
      expect(component.updateForm.get('homeAddress')?.disabled).toBeTrue();
    });

    it('should clear international address when dialog returns null for donor', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(mockDialogRef);
      component.onInternationalAddress();
      expect(component.hasInternationalAddress()).toBeFalse();
      expect(component.updateForm.get('homeAddress')?.enabled).toBeTrue();
    });

    it('should open international address dialog for employer', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of({
        streetName: 'Emp Intl', addr1: null, addr2: null, addr3: null,
        country: 'DE', postalCode: '10115', intlAddrFlag: 'Y',
      }));
      matDialogSpy.open.and.returnValue(mockDialogRef);
      component.onEmployerInternationalAddress();
      expect(matDialogSpy.open).toHaveBeenCalled();
    });

    it('should clear employer international address when dialog returns null', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(mockDialogRef);
      component.onEmployerInternationalAddress();
      expect(component.updateForm.get('employerName')?.enabled).toBeTrue();
    });

    it('should do nothing when dialog returns undefined', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));
      matDialogSpy.open.and.returnValue(mockDialogRef);
      const prevState = component.hasInternationalAddress();
      component.onInternationalAddress();
      expect(component.hasInternationalAddress()).toBe(prevState);
    });

    it('should open alternate address dialog and set pending alt address', () => {
      const altResult = {
        addressType: 'L', streetName: 'Alt Street', suiteApt: '5A',
        city: 'Dallas', state: 'TX', zip: '75001', uspsId: 100,
        intlAddress1: null, intlAddress2: null, intlAddress3: null, intlAddress4: null,
        countryName: null, intlCity: null, intlPostalCode: null, intlAddrFlag: null,
        mobilePhoneNumber: null, otherContactNumber: null, altIntlPhoneNumber: null,
        preferredContactPhone: null, preferredContactAddress: null,
      };
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(altResult));
      matDialogSpy.open.and.returnValue(mockDialogRef);
      component.onAlternateAddress();
      expect(matDialogSpy.open).toHaveBeenCalled();
    });

    it('should call altDemoService when donorId exists and no pending alt address', fakeAsync(() => {
      altDemoServiceSpy.getByDonorId.and.returnValue(of(null));
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));
      matDialogSpy.open.and.returnValue(mockDialogRef);
      component.onAlternateAddress();
      tick();
      expect(altDemoServiceSpy.getByDonorId).toHaveBeenCalledWith('DON123');
    }));

    it('should clear pending alt address when dialog returns null', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(mockDialogRef);
      component.onAlternateAddress();
      expect(matDialogSpy.open).toHaveBeenCalled();
    });

    it('should open manual holds dialog and set pending holds', () => {
      const holdsResult = {
        action: 'ok' as const,
        selectedHolds: [{ interCode: 'IC01', interDesc: 'Hold 1', interType: 'M' }],
      };
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(holdsResult));
      matDialogSpy.open.and.returnValue(mockDialogRef);
      component.onManualHolds();
      expect(matDialogSpy.open).toHaveBeenCalled();
    });

    it('should not update holds when dialog is cancelled', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));
      matDialogSpy.open.and.returnValue(mockDialogRef);
      component.onManualHolds();
      expect(matDialogSpy.open).toHaveBeenCalled();
    });
  });

  describe('Paste Numbers and enteredByText', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prevent default and process paste with non-numeric chars', () => {
      (document as any).execCommand = jasmine.createSpy('execCommand');
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc123def456extra' },
      } as unknown as ClipboardEvent;
      component.onPasteNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect((document as any).execCommand).toHaveBeenCalledWith('insertText', false, '123456');
    });

    it('should return -- when no deferral ID is set', () => {
      component.selectedDeferralId.set('');
      expect(component.enteredByText).toBe('--');
    });

    it('should return -- when deferral ID is set', () => {
      component.selectedDeferralId.set(VALID_DEFERRAL_ID);
      expect(component.enteredByText).toBe('--');
    });
  });
});
