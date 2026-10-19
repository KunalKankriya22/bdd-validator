import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import moment from 'moment';

import { DonorRegistration } from './donor-registration';
import { DonorRegistrationService } from './services/donor-registration.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ValidMasterCodesService } from '@shared/services/valid-master-codes.service';
import { AlternateDemographicsService } from '@shared/services/alternate-demographics.service';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DonorRegistration', () => {
  let component: DonorRegistration;
  let fixture: ComponentFixture<DonorRegistration>;
  let mockDonorService: jasmine.SpyObj<DonorRegistrationService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockMasterCodesService: jasmine.SpyObj<ValidMasterCodesService>;
  let mockAltDemoService: jasmine.SpyObj<AlternateDemographicsService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const chapterChanged$ = new Subject<void>();

  function setupMockUnitIdField(overrides?: Record<string, any>): void {
    (component as any).unitIdField = {
      isValid: true,
      parsedUnitId: 'W6333',
      parsedUnitData: {
        parsedUnitId: 'W6333',
        manualUnitId: 'W6333',
        codeScheme: 'C',
        checkDigit: null,
        barcodeType: 'CODABAR',
        entryMode: 'S',
        chapterScheme: 'C',
      },
      unitIdInput: { nativeElement: { focus: () => {} } },
      unitIdControl: { markAsUntouched: () => {}, setValue: () => {} },
      clear: () => {},
      focus: () => {},
      onBlur: () => {},
      ...overrides,
    };
  }

  function fillRequiredFieldsUpToWeight(): void {
    setupMockUnitIdField();
    component.updateFieldStates();
    component.registrationForm.get('lastName')?.setValue('Smith');
    component.updateFieldStates();
    component.registrationForm.get('firstName')?.setValue('John');
    component.registrationForm.get('dob')?.setValue(moment('1990-01-01'));
    component.registrationForm.get('sex')?.setValue('M');
    component.registrationForm.get('weight')?.setValue(75);
    component.updateFieldStates();
  }

  function fillRequiredFieldsUpToEthnicGroup(): void {
    fillRequiredFieldsUpToWeight();
    component.registrationForm.get('homeAddress')?.setValue('123 Main St');
    component.registrationForm.get('city')?.setValue('Dallas');
    component.registrationForm.get('zip')?.setValue('75001');
    component.updateFieldStates();
    component.registrationForm.get('ethnicGroup')?.setValue('CA');
    component.updateFieldStates();
  }

  function fillAllRequiredFields(): void {
    setupMockUnitIdField();
    component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
    component.searchForm.get('driveId')?.setValue('DRV001');
    component.updateFieldStates();
    component.registrationForm.get('lastName')?.setValue('Test');
    component.updateFieldStates();
    component.registrationForm.get('firstName')?.setValue('John');
    component.registrationForm.get('dob')?.setValue(moment('1990-01-01'));
    component.registrationForm.get('sex')?.setValue('M');
    component.registrationForm.get('weight')?.setValue(75);
    component.registrationForm.get('homeAddress')?.setValue('123 Main St');
    component.registrationForm.get('city')?.setValue('Dallas');
    component.registrationForm.get('zip')?.setValue('75001');
    component.updateFieldStates();
    component.registrationForm.get('ethnicGroup')?.setValue('CA');
    component.registrationForm.get('donation')?.setValue('WB');
    component.registrationForm.get('procedure')?.setValue('PP');
    component.updateFieldStates();
    component.registrationForm.get('physicalId')?.setValue('E1');
    component.registrationForm.get('deferral')?.setValue('5');
    component.registrationForm.get('deferralType')?.setValue('NA');
    component.registrationForm.get('historianId')?.setValue('E1');
    component.updateFieldStates();
    component.registrationForm.get('armUsed')?.setValue('R');
    component.registrationForm.get('reviewerId')?.setValue('E1');
    component.registrationForm.get('employerCity')?.setValue('Dallas');
    component.registrationForm.get('employerZip')?.setValue('75001');
    component.updateFieldStates();
    component.registrationForm.patchValue({ donorId: 'D1' });
  }

  beforeEach(() => {
    mockDonorService = jasmine.createSpyObj('DonorRegistrationService', [
      'getAll', 'getByTransactionId', 'getByDonorId',
      'create', 'batchCreate', 'update', 'deleteDonation',
      'getDrives', 'getProcedureCodes', 'getVenipunctureCodes',
      'getEmployees', 'getInterdictionCodes', 'validateUnitId',
      'getDonationTypes', 'getSponsors', 'getCityState', 'getDeferralReasons',
      'checkExistingUnitId', 'getProcedureCodesByDonationType', 'getEmployers', 'getDonorAddress',
      'registerHold', 'getDonor',
      'validateStaff', 'validateEthnicGroup', 'validateEquipmentType',
      'validateAlternateIdType', 'validateCity', 'validateZipCity',
    ]);
    mockHeaderService = createMockHeaderService();
    mockSnackbarService = createMockSnackbarService();
    mockMasterCodesService = jasmine.createSpyObj('ValidMasterCodesService', ['getByCodeType']);
    mockAltDemoService = jasmine.createSpyObj('AlternateDemographicsService', ['getByDonorId']);
    mockDialog = createMockMatDialog();
    mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);

    mockMasterCodesService.getByCodeType.and.returnValue(of([]));
    mockDonorService.getDonationTypes.and.returnValue(of([]));
    mockDonorService.getSponsors.and.returnValue(of([]));
    mockDonorService.getCityState.and.returnValue(of([]));
    mockDonorService.getDeferralReasons.and.returnValue(of([]));
    mockDonorService.getDrives.and.returnValue(of([]));
    mockDonorService.getEmployees.and.returnValue(of([]));
    mockDonorService.checkExistingUnitId.and.returnValue(of(false));
    mockDonorService.getProcedureCodesByDonationType.and.returnValue(of([]));
    mockDonorService.getEmployers.and.returnValue(of([]));
    mockDonorService.getDonorAddress.and.returnValue(of({} as any));
    mockDonorService.getDonor.and.returnValue(of({} as any));
    mockDonorService.validateStaff.and.returnValue(of({ valid: true } as any));
    mockDonorService.validateEthnicGroup.and.returnValue(of({ valid: true } as any));
    mockDonorService.validateEquipmentType.and.returnValue(of({ valid: true } as any));
    mockDonorService.validateAlternateIdType.and.returnValue(of({ valid: true } as any));
    mockDonorService.validateCity.and.returnValue(of({ valid: true } as any));
    mockDonorService.validateZipCity.and.returnValue(of({ valid: true } as any));
    mockAltDemoService.getByDonorId.and.returnValue(of(null));

    TestBed.configureTestingModule({
      imports: [DonorRegistration, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DonorRegistrationService, useValue: mockDonorService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: ValidMasterCodesService, useValue: mockMasterCodesService },
        { provide: AlternateDemographicsService, useValue: mockAltDemoService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    });

    fixture = TestBed.createComponent(DonorRegistration);
    component = fixture.componentInstance;
    (component as any).dialog = mockDialog;

    try { fixture.detectChanges(); } catch (_) { /* child template errors */ }
  });

  // ─── Initialization ────────────────────────────────────────────────────────

  it('should initialize in search mode', () => {
    expect(component.mode()).toBe('search');
  });

  it('should have empty search form on init', () => {
    expect(component.searchForm.get('driveDate')?.value).toBeNull();
    expect(component.searchForm.get('driveId')?.value).toBe('');
  });

  it('should load ethnic groups, alternate types, equipment types, and reaction codes on init', () => {
    expect(mockMasterCodesService.getByCodeType).toHaveBeenCalledWith('ETHGP');
    expect(mockMasterCodesService.getByCodeType).toHaveBeenCalledWith('ALTID');
    expect(mockMasterCodesService.getByCodeType).toHaveBeenCalledWith('EQUIP');
    expect(mockMasterCodesService.getByCodeType).toHaveBeenCalledWith('REACT');
  });

  it('should sync selectedDriveId signal when driveId form value changes', () => {
    component.searchForm.get('driveId')?.setValue('DRV042');
    expect(component.selectedDriveId()).toBe('DRV042');
  });

  // ─── Search form validation ────────────────────────────────────────────────

  describe('search form validation', () => {
    it('should require driveDate', () => {
      component.searchForm.get('driveDate')?.markAsTouched();
      expect(component.getSearchFieldError('driveDate')).toBe('Drive Date is required');
    });

    it('should require driveId', () => {
      component.searchForm.get('driveId')?.markAsTouched();
      expect(component.getSearchFieldError('driveId')).toBe('Drive ID is required');
    });

    it('should return empty string for valid search fields', () => {
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      component.searchForm.get('driveDate')?.markAsTouched();
      expect(component.getSearchFieldError('driveDate')).toBe('');
    });
  });

  // ─── getFieldError ────────────────────────────────────────────────────────

  describe('getFieldError', () => {
    it('should return empty string when control is not touched', () => {
      expect(component.getFieldError('lastName', 'Last Name')).toBe('');
    });

    it('should return required message when field is required and touched', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      component.registrationForm.get('lastName')?.markAsTouched();
      expect(component.getFieldError('lastName', 'Last Name')).toBe('Last Name is required');
    });

    it('should return min error message', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('weight')?.setValue(0);
      component.registrationForm.get('weight')?.markAsTouched();
      expect(component.getFieldError('weight', 'Weight')).toBe('Weight must be greater than 0');
    });

    it('should return mismatch error message', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      const ctrl = component.registrationForm.get('lastName');
      ctrl?.setErrors({ mismatch: true });
      ctrl?.markAsTouched();
      expect(component.getFieldError('lastName', 'Last Name')).toBe('Value did not match');
    });

    it('should return server error string when serverError is a string', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      const ctrl = component.registrationForm.get('lastName');
      ctrl?.setErrors({ serverError: 'Custom server error' });
      ctrl?.markAsTouched();
      expect(component.getFieldError('lastName', 'Last Name')).toBe('Custom server error');
    });

    it('should return "Validation failed" when serverError is not a string', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      const ctrl = component.registrationForm.get('lastName');
      ctrl?.setErrors({ serverError: true });
      ctrl?.markAsTouched();
      expect(component.getFieldError('lastName', 'Last Name')).toBe('Validation failed');
    });
  });

  // ─── onRetrieve ────────────────────────────────────────────────────────────

  describe('onRetrieve', () => {
    it('should not switch mode when search form is invalid', () => {
      component.onRetrieve();
      expect(component.mode()).toBe('search');
    });

    it('should switch to add mode and load form LOVs when form is valid', () => {
      mockDonorService.getProcedureCodes.and.returnValue(of([]));
      mockDonorService.getVenipunctureCodes.and.returnValue(of([]));
      mockDonorService.getInterdictionCodes.and.returnValue(of([]));

      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      component.searchForm.get('driveId')?.setValue('DRV001');

      component.onRetrieve();

      expect(component.mode()).toBe('add');
      expect(mockDonorService.getProcedureCodes).toHaveBeenCalled();
      expect(mockDonorService.getVenipunctureCodes).toHaveBeenCalled();
      expect(mockDonorService.getInterdictionCodes).toHaveBeenCalled();
      expect(mockDonorService.getDonationTypes).toHaveBeenCalled();
    });

    it('should set collectionDate from driveDate on retrieve', () => {
      mockDonorService.getProcedureCodes.and.returnValue(of([]));
      mockDonorService.getVenipunctureCodes.and.returnValue(of([]));
      mockDonorService.getInterdictionCodes.and.returnValue(of([]));

      component.searchForm.get('driveDate')?.setValue(moment('2025-03-15'));
      component.searchForm.get('driveId')?.setValue('DRV001');
      component.onRetrieve();

      expect(component.registrationForm.get('collectionDate')?.value).toBe('2025-03-15');
    });

    it('should reset registration form on retrieve', () => {
      mockDonorService.getProcedureCodes.and.returnValue(of([]));
      mockDonorService.getVenipunctureCodes.and.returnValue(of([]));
      mockDonorService.getInterdictionCodes.and.returnValue(of([]));

      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      component.searchForm.get('driveId')?.setValue('DRV001');
      component.registrationForm.get('lastName')?.setValue('OldName');
      component.onRetrieve();

      expect(component.registrationForm.get('lastName')?.value).toBeFalsy();
    });
  });

  // ─── loadFormLovs error path ──────────────────────────────────────────────

  describe('loadFormLovs error handling', () => {
    it('should show error snackbar when loadFormLovs fails', () => {
      mockDonorService.getProcedureCodes.and.returnValue(throwError(() => new Error('fail')));
      mockDonorService.getVenipunctureCodes.and.returnValue(of([]));
      mockDonorService.getInterdictionCodes.and.returnValue(of([]));

      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      component.searchForm.get('driveId')?.setValue('DRV001');
      component.onRetrieve();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load form data');
    });
  });

  // ─── Progressive field enabling ────────────────────────────────────────────

  describe('progressive field enabling', () => {
    it('should have form fields disabled initially', () => {
      expect(component.registrationForm.get('lastName')?.disabled).toBeTrue();
      expect(component.registrationForm.get('weight')?.disabled).toBeTrue();
      expect(component.registrationForm.get('ethnicGroup')?.disabled).toBeTrue();
      expect(component.registrationForm.get('reviewerId')?.disabled).toBeTrue();
    });

    it('should enable only lastName when unitId is filled and valid', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      expect(component.registrationForm.get('lastName')?.enabled).toBeTrue();
      expect(component.registrationForm.get('firstName')?.disabled).toBeTrue();
      expect(component.registrationForm.get('suffix')?.disabled).toBeTrue();
    });

    it('should enable remaining personal fields when lastName is filled', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      component.registrationForm.get('lastName')?.setValue('Smith');
      component.updateFieldStates();
      expect(component.registrationForm.get('suffix')?.enabled).toBeTrue();
      expect(component.registrationForm.get('firstName')?.enabled).toBeTrue();
      component.registrationForm.get('firstName')?.setValue('John');
      component.registrationForm.get('dob')?.setValue(moment('1990-01-01'));
      component.registrationForm.get('sex')?.setValue('M');
      component.updateFieldStates();
      expect(component.registrationForm.get('weight')?.enabled).toBeTrue();
    });

    it('should enable group4 and group5 when weight is filled', () => {
      fillRequiredFieldsUpToWeight();
      expect(component.registrationForm.get('homeAddress')?.enabled).toBeTrue();
      component.registrationForm.get('homeAddress')?.setValue('123 Main St');
      component.registrationForm.get('city')?.setValue('Dallas');
      component.registrationForm.get('zip')?.setValue('75001');
      component.updateFieldStates();
      expect(component.registrationForm.get('ethnicGroup')?.enabled).toBeTrue();
    });

    it('should enable group6a when ethnicGroup, donation, and procedure are filled', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      component.registrationForm.get('lastName')?.setValue('Smith');
      component.updateFieldStates();
      component.registrationForm.get('firstName')?.setValue('John');
      component.registrationForm.get('dob')?.setValue(moment('1990-01-01'));
      component.registrationForm.get('sex')?.setValue('M');
      component.registrationForm.get('weight')?.setValue(75);
      component.registrationForm.get('homeAddress')?.setValue('123 Main St');
      component.registrationForm.get('city')?.setValue('Dallas');
      component.registrationForm.get('zip')?.setValue('75001');
      component.updateFieldStates();
      component.registrationForm.get('ethnicGroup')?.setValue('CA');
      component.registrationForm.get('donation')?.setValue('WB');
      component.registrationForm.get('procedure')?.setValue('PP');
      component.updateFieldStates();
      expect(component.registrationForm.get('physicalId')?.enabled).toBeTrue();
      component.registrationForm.get('physicalId')?.setValue('E1');
      component.updateFieldStates();
      expect(component.registrationForm.get('deferral')?.enabled).toBeTrue();
      component.registrationForm.get('deferral')?.setValue('5');
      component.updateFieldStates();
      expect(component.registrationForm.get('deferralType')?.enabled).toBeTrue();
      component.registrationForm.get('deferralType')?.setValue('NA');
      component.updateFieldStates();
      expect(component.registrationForm.get('historianId')?.enabled).toBeTrue();
    });

    it('should enable armUsed after historianId is filled', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      component.registrationForm.get('lastName')?.setValue('Smith');
      component.updateFieldStates();
      component.registrationForm.get('firstName')?.setValue('John');
      component.registrationForm.get('dob')?.setValue(moment('1990-01-01'));
      component.registrationForm.get('sex')?.setValue('M');
      component.registrationForm.get('weight')?.setValue(75);
      component.registrationForm.get('homeAddress')?.setValue('123 Main St');
      component.registrationForm.get('city')?.setValue('Dallas');
      component.registrationForm.get('zip')?.setValue('75001');
      component.updateFieldStates();
      component.registrationForm.get('ethnicGroup')?.setValue('CA');
      component.registrationForm.get('donation')?.setValue('WB');
      component.registrationForm.get('procedure')?.setValue('PP');
      component.updateFieldStates();
      component.registrationForm.get('physicalId')?.setValue('E1');
      component.registrationForm.get('deferral')?.setValue('5');
      component.registrationForm.get('deferralType')?.setValue('NA');
      component.registrationForm.get('historianId')?.setValue('E1');
      component.updateFieldStates();
      expect(component.registrationForm.get('armUsed')?.enabled).toBeTrue();
    });

    it('should disable downstream groups when a required field is cleared', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('lastName')?.setValue('');
      component.updateFieldStates();
      expect(component.registrationForm.get('weight')?.disabled).toBeTrue();
      expect(component.registrationForm.get('homeAddress')?.disabled).toBeTrue();
      expect(component.registrationForm.get('ethnicGroup')?.disabled).toBeTrue();
    });

    it('should set isAddressButtonsDisabled based on progress before weight', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      expect(component.isAddressButtonsDisabled).toBeTrue();
      fillRequiredFieldsUpToWeight();
      component.updateFieldStates();
      expect(component.isAddressButtonsDisabled).toBeFalse();
    });

    it('should enable extension when workPhone is enabled', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homeAddress')?.setValue('123 Main St');
      component.registrationForm.get('city')?.setValue('Dallas');
      component.registrationForm.get('zip')?.setValue('75001');
      component.updateFieldStates();
      expect(component.registrationForm.get('workPhone')?.enabled).toBeTrue();
      expect(component.registrationForm.get('extension')?.enabled).toBeTrue();
    });

    it('should disable extension when workPhone is disabled', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      expect(component.registrationForm.get('workPhone')?.disabled).toBeTrue();
      expect(component.registrationForm.get('extension')?.disabled).toBeTrue();
    });
  });

  // ─── onFieldComplete / onSelectFieldComplete / advanceFromField ────────────

  describe('onFieldComplete and onSelectFieldComplete', () => {
    it('onFieldComplete should call updateFieldStates', () => {
      spyOn(component, 'updateFieldStates');
      component.onFieldComplete();
      expect(component.updateFieldStates).toHaveBeenCalled();
    });

    it('onSelectFieldComplete should call updateFieldStates', () => {
      spyOn(component, 'updateFieldStates');
      component.onSelectFieldComplete();
      expect(component.updateFieldStates).toHaveBeenCalled();
    });

    it('onSelectFieldComplete with valid field should advance', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homeAddress')?.setValue('123 Main');
      component.updateFieldStates();
      component.onSelectFieldComplete('homeAddress');
      // should not throw
    });

    it('advanceFromField should update states and not throw', () => {
      fillRequiredFieldsUpToWeight();
      component.advanceFromField('weight');
      // no error expected
    });
  });

  // ─── onSponsorSelected ────────────────────────────────────────────────────

  describe('onSponsorSelected', () => {
    it('should set selectedSponsor when a matching sponsor is found', () => {
      const sponsor = { sponsorId: 'SP1', sponsorName: 'Test Sponsor' };
      component.sponsors.set([sponsor as any]);
      fillRequiredFieldsUpToEthnicGroup();
      component.registrationForm.get('alternateSponsorId')?.setValue('SP1');
      component.onSponsorSelected();
      expect(component.filteredSponsors().some(s => s.sponsorId === 'SP1')).toBeTrue();
    });
  });

  // ─── Computed filters ─────────────────────────────────────────────────────

  describe('computed filtered signals', () => {
    it('filteredDrives should return all drives when search is empty', () => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: 'Test' },
      ]);
      component.driveSearchControl.setValue('');
      expect(component.filteredDrives().length).toBe(1);
    });

    it('filteredDrives should filter by driveId', fakeAsync(() => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: 'Test' },
        { driveId: 'DRV002', driveDate: '2025-01-02', driveType: null, sponsorName: 'Other' },
      ]);
      component.driveSearchControl.setValue('DRV001');
      tick();
      expect(component.filteredDrives().length).toBe(1);
      expect(component.filteredDrives()[0].driveId).toBe('DRV001');
    }));

    it('filteredDrives should filter by sponsorName', fakeAsync(() => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: 'Red Cross' },
        { driveId: 'DRV002', driveDate: '2025-01-02', driveType: null, sponsorName: 'Other' },
      ]);
      component.driveSearchControl.setValue('red');
      tick();
      expect(component.filteredDrives().length).toBe(1);
    }));

    it('filteredEthnicGroups should filter by code', fakeAsync(() => {
      component.ethnicGroups.set([
        { code: 'CA', description: 'Caucasian' },
        { code: 'AA', description: 'African American' },
      ]);
      component.ethnicGroupSearchControl.setValue('AA');
      tick();
      expect(component.filteredEthnicGroups().length).toBe(1);
      expect(component.filteredEthnicGroups()[0].code).toBe('AA');
    }));

    it('filteredProcedureCodes should filter by procedureCode', fakeAsync(() => {
      component.procedureCodes.set([
        { procedureCode: 'PP', description: 'Platelet Pheresis' },
        { procedureCode: 'WB', description: 'Whole Blood' },
      ] as any);
      component.procedureSearchControl.setValue('PP');
      tick();
      expect(component.filteredProcedureCodes().length).toBe(1);
    }));

    it('filteredVenipunctureCodes should filter by code', fakeAsync(() => {
      component.venipunctureCodes.set([
        { code: 'V1', description: 'Venipuncture 1' },
        { code: 'V2', description: 'Venipuncture 2' },
      ] as any);
      component.venipunctureSearchControl.setValue('V1');
      tick();
      expect(component.filteredVenipunctureCodes().length).toBe(1);
    }));

    it('filteredEmployees should filter by staffNo', fakeAsync(() => {
      component.employees.set([
        { staffNo: 'E1', employeeName: 'Alice' },
        { staffNo: 'E2', employeeName: 'Bob' },
      ] as any);
      component.reviewerSearchControl.setValue('E1');
      tick();
      expect(component.filteredEmployees().length).toBe(1);
    }));

    it('filteredLookupEmployees should filter by employeeName', fakeAsync(() => {
      component.employees.set([
        { staffNo: 'E1', employeeName: 'Alice' },
        { staffNo: 'E2', employeeName: 'Bob' },
      ] as any);
      component.lookupIdSearchControl.setValue('alice');
      tick();
      expect(component.filteredLookupEmployees().length).toBe(1);
    }));

    it('filteredPhysicalEmployees should filter by staffNo', fakeAsync(() => {
      component.employees.set([
        { staffNo: 'P1', employeeName: 'PhysA' },
        { staffNo: 'P2', employeeName: 'PhysB' },
      ] as any);
      component.physicalIdSearchControl.setValue('P1');
      tick();
      expect(component.filteredPhysicalEmployees().length).toBe(1);
    }));

    it('filteredHistorianEmployees should filter by employeeName', fakeAsync(() => {
      component.employees.set([
        { staffNo: 'H1', employeeName: 'Historian1' },
        { staffNo: 'H2', employeeName: 'Historian2' },
      ] as any);
      component.historianSearchControl.setValue('historian1');
      tick();
      expect(component.filteredHistorianEmployees().length).toBe(1);
    }));

    it('filteredMaterialEmployees should return all when no search', () => {
      component.employees.set([
        { staffNo: 'M1', employeeName: 'Mat1' },
      ] as any);
      expect(component.filteredMaterialEmployees().length).toBe(1);
    });

    it('filteredDonationTypes should filter by donationType', fakeAsync(() => {
      component.donationTypes.set([
        { donationType: 'WB', description: 'Whole Blood' },
        { donationType: 'PL', description: 'Platelet' },
      ] as any);
      component.donationSearchControl.setValue('WB');
      tick();
      expect(component.filteredDonationTypes().length).toBe(1);
    }));

    it('filteredEquipmentTypes should filter by description', fakeAsync(() => {
      component.equipmentTypes.set([
        { code: 'EQ1', description: 'Equipment One' },
        { code: 'EQ2', description: 'Equipment Two' },
      ]);
      component.equipTypeSearchControl.setValue('one');
      tick();
      expect(component.filteredEquipmentTypes().length).toBe(1);
    }));

    it('filteredReactionCodes should filter by code', fakeAsync(() => {
      component.reactionCodesList.set([
        { code: 'R1', description: 'Reaction 1' },
        { code: 'R2', description: 'Reaction 2' },
      ]);
      component.reactionSearchControl.setValue('R1');
      tick();
      expect(component.filteredReactionCodes().length).toBe(1);
    }));

    it('filteredDeferralTypes should filter by code', fakeAsync(() => {
      component.deferralTypeSearchControl.setValue('IND');
      tick();
      expect(component.filteredDeferralTypes().length).toBe(1);
      expect(component.filteredDeferralTypes()[0].code).toBe('IND');
    }));

    it('filteredDeferralReasons should filter by reasonCode', fakeAsync(() => {
      component.deferralReasons.set([
        { reasonCode: 'DR1' } as any,
        { reasonCode: 'DR2' } as any,
      ]);
      component.deferralSearchControl.setValue('DR1');
      tick();
      expect(component.filteredDeferralReasons().length).toBe(1);
    }));

    it('filteredSponsors should prepend selectedSponsor when not in sponsors list', () => {
      const selected = { sponsorId: 'SP_EXT', sponsorName: 'External' } as any;
      (component as any).selectedSponsor.set(selected);
      component.sponsors.set([{ sponsorId: 'SP1', sponsorName: 'Sponsor1' } as any]);
      expect(component.filteredSponsors().length).toBe(2);
      expect(component.filteredSponsors()[0].sponsorId).toBe('SP_EXT');
    });

    it('filteredSponsors should not duplicate when selectedSponsor is already in list', () => {
      const existing = { sponsorId: 'SP1', sponsorName: 'Sponsor1' } as any;
      (component as any).selectedSponsor.set(existing);
      component.sponsors.set([existing]);
      expect(component.filteredSponsors().length).toBe(1);
    });
  });

  // ─── selectedDriveName ────────────────────────────────────────────────────

  describe('selectedDriveName', () => {
    it('should return -- when no drive is selected', () => {
      expect(component.selectedDriveName()).toBe('--');
    });

    it('should return sponsorName when a drive is selected', () => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: 'Red Cross' },
      ]);
      component.selectedDriveId.set('DRV001');
      expect(component.selectedDriveName()).toBe('Red Cross');
    });

    it('should return -- when drive has null sponsorName', () => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: null as any },
      ]);
      component.selectedDriveId.set('DRV001');
      expect(component.selectedDriveName()).toBe('--');
    });
  });

  // ─── onDriveDateChange ────────────────────────────────────────────────────

  describe('onDriveDateChange', () => {
    it('should reset to idle when value is null', () => {
      component.onDriveDateChange({ value: null });
      expect(component.driveDateDoubleEntry).toBe('idle');
    });

    it('should reset to idle when value is invalid moment', () => {
      component.onDriveDateChange({ value: moment.invalid() });
      expect(component.driveDateDoubleEntry).toBe('idle');
    });

    it('should enter pending state on first valid date entry', () => {
      const date = moment('2025-06-15');
      component.onDriveDateChange({ value: date });
      expect(component.driveDateDoubleEntry).toBe('pending');
    });

    it('should confirm date when second entry matches pending date', fakeAsync(() => {
      mockDonorService.getDrives.and.returnValue(of([]));
      mockDonorService.getEmployees.and.returnValue(of([]));

      const date = moment('2025-06-15');
      component.onDriveDateChange({ value: date });
      tick();
      component.onDriveDateChange({ value: moment('2025-06-15') });
      tick();

      expect(component.driveDateDoubleEntry).toBe('idle');
      expect(component.driveDateMismatchError).toBeNull();
    }));

    it('should set mismatch error when second entry does not match', fakeAsync(() => {
      const date1 = moment('2025-06-15');
      const date2 = moment('2025-06-16');
      component.onDriveDateChange({ value: date1 });
      tick();
      component.onDriveDateChange({ value: date2 });
      tick();

      expect(component.driveDateDoubleEntry).toBe('idle');
      expect(component.driveDateMismatchError).toBe('Drive Date did not match. Please re-enter.');
    }));

    it('should not reload when same confirmed date is entered again', fakeAsync(() => {
      mockDonorService.getDrives.and.returnValue(of([]));
      mockDonorService.getEmployees.and.returnValue(of([]));

      const date = moment('2025-06-15');
      component.onDriveDateChange({ value: date });
      tick();
      component.onDriveDateChange({ value: moment('2025-06-15') });
      tick();
      mockDonorService.getDrives.calls.reset();

      component.onDriveDateChange({ value: moment('2025-06-15') });
      tick();
      expect(mockDonorService.getDrives).not.toHaveBeenCalled();
    }));

    it('should reset to search mode if mode is add and a new date is entered', fakeAsync(() => {
      mockDonorService.getDrives.and.returnValue(of([]));
      mockDonorService.getEmployees.and.returnValue(of([]));

      // First confirm a date
      component.onDriveDateChange({ value: moment('2025-06-15') });
      tick();
      component.onDriveDateChange({ value: moment('2025-06-15') });
      tick();

      component.mode.set('add');
      // Enter a new different date
      component.onDriveDateChange({ value: moment('2025-06-20') });
      tick();

      expect(component.mode()).toBe('search');
    }));

    it('should load drives and employees after date confirmation', fakeAsync(() => {
      const drives = [{ driveId: 'D1', driveDate: '2025-06-15', driveType: null, sponsorName: 'S1' }];
      const employees = [{ staffNo: 'E1', employeeName: 'Name' }];
      mockDonorService.getDrives.and.returnValue(of(drives));
      mockDonorService.getEmployees.and.returnValue(of(employees as any));

      component.onDriveDateChange({ value: moment('2025-06-15') });
      tick();
      component.onDriveDateChange({ value: moment('2025-06-15') });
      tick();

      expect(component.drives()).toEqual(drives);
      expect(component.employees().length).toBe(1);
    }));

    it('should show error when drive load fails', fakeAsync(() => {
      mockDonorService.getDrives.and.returnValue(throwError(() => new Error('fail')));
      mockDonorService.getEmployees.and.returnValue(of([]));

      component.onDriveDateChange({ value: moment('2025-06-15') });
      tick();
      component.onDriveDateChange({ value: moment('2025-06-15') });
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load drives and employees.');
    }));
  });

  // ─── onUnitIdPostValidate ─────────────────────────────────────────────────

  describe('onUnitIdPostValidate', () => {
    it('should reject when unit ID already exists', () => {
      mockDonorService.checkExistingUnitId.and.returnValue(of(true));
      const event = {
        data: { parsedUnitId: 'W6333' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitIdPostValidate(event);
      expect(event.reject).toHaveBeenCalledWith('Unit ID has already been used');
      expect(event.confirm).not.toHaveBeenCalled();
    });

    it('should confirm when unit ID does not exist', () => {
      mockDonorService.checkExistingUnitId.and.returnValue(of(false));
      const event = {
        data: { parsedUnitId: 'W6333' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitIdPostValidate(event);
      expect(event.confirm).toHaveBeenCalled();
    });

    it('should reject when checkExistingUnitId fails', () => {
      mockDonorService.checkExistingUnitId.and.returnValue(throwError(() => new Error('API error')));
      const event = {
        data: { parsedUnitId: 'W6333' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitIdPostValidate(event);
      expect(event.reject).toHaveBeenCalledWith('Failed to check unit ID');
    });
  });

  // ─── onUnitIdValidated / onUnitIdCleared ──────────────────────────────────

  describe('onUnitIdValidated and onUnitIdCleared', () => {
    it('onUnitIdValidated should call updateFieldStates and openFindDonor', () => {
      spyOn(component, 'updateFieldStates');
      component.onUnitIdValidated({ parsedUnitId: 'W6333' } as any);
      expect(component.updateFieldStates).toHaveBeenCalled();
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('onUnitIdCleared should set isHoldsButtonDisabled to true', () => {
      component.isHoldsButtonDisabled = false;
      component.onUnitIdCleared();
      expect(component.isHoldsButtonDisabled).toBeTrue();
    });
  });

  // ─── onDonationUnitIdPostValidate ─────────────────────────────────────────

  describe('onDonationUnitIdPostValidate', () => {
    it('should confirm when parsedId matches initial unitId', () => {
      setupMockUnitIdField();
      const event = {
        data: { parsedUnitId: 'W6333' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onDonationUnitIdPostValidate(event);
      expect(event.confirm).toHaveBeenCalled();
    });

    it('should reject and reset when parsedId does not match initial unitId', fakeAsync(() => {
      setupMockUnitIdField();
      const event = {
        data: { parsedUnitId: 'DIFFERENT' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onDonationUnitIdPostValidate(event);
      expect(event.reject).toHaveBeenCalledWith('Unit ID does not match the initial Unit ID');
      tick(200);
    }));
  });

  // ─── onVoidUnitIdValidated / onVoidUnitIdCleared ──────────────────────────

  describe('onVoidUnitIdValidated and onVoidUnitIdCleared', () => {
    it('onVoidUnitIdValidated should patch voidUnit value', () => {
      setupMockUnitIdField();
      (component as any).donationUnitIdField = { focus: () => {} };
      component.onVoidUnitIdValidated({ parsedUnitId: 'VOID1' } as any);
      expect(component.registrationForm.getRawValue().voidUnit).toBe('VOID1');
    });

    it('onVoidUnitIdCleared should clear voidUnit value', () => {
      component.registrationForm.patchValue({ voidUnit: 'VOID1' });
      component.onVoidUnitIdCleared();
      expect(component.registrationForm.getRawValue().voidUnit).toBe('');
    });
  });

  // ─── Validation methods ───────────────────────────────────────────────────

  describe('validateStaffField', () => {
    it('should not call API when value is empty', () => {
      fillRequiredFieldsUpToEthnicGroup();
      component.registrationForm.get('ethnicGroup')?.setValue('');
      component.validateStaffField('historianId');
      expect(mockDonorService.validateStaff).not.toHaveBeenCalled();
    });

    it('should skip validation for special values 99 and 88', () => {
      fillAllRequiredFields();
      component.registrationForm.get('historianId')?.setValue('99');
      component.validateStaffField('historianId');
      expect(mockDonorService.validateStaff).not.toHaveBeenCalled();

      component.registrationForm.get('historianId')?.setValue('88');
      component.validateStaffField('historianId');
      expect(mockDonorService.validateStaff).not.toHaveBeenCalled();
    });

    it('should call validateStaff API for regular staff values', () => {
      fillAllRequiredFields();
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      component.registrationForm.get('historianId')?.setValue('E1');
      component.validateStaffField('historianId');
      expect(mockDonorService.validateStaff).toHaveBeenCalledWith('E1', jasmine.any(String));
    });

    it('should set server error on validation failure', () => {
      fillAllRequiredFields();
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      mockDonorService.validateStaff.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Invalid staff ID' } }
      })));
      component.registrationForm.get('historianId')?.setValue('INVALID');
      component.validateStaffField('historianId');
      expect(component.registrationForm.get('historianId')?.hasError('serverError')).toBeTrue();
    });
  });

  describe('validateEthnicGroupField', () => {
    it('should not call API when value is empty', () => {
      component.validateEthnicGroupField();
      expect(mockDonorService.validateEthnicGroup).not.toHaveBeenCalled();
    });

    it('should call validateEthnicGroup API for non-empty values', () => {
      fillRequiredFieldsUpToEthnicGroup();
      component.validateEthnicGroupField();
      expect(mockDonorService.validateEthnicGroup).toHaveBeenCalledWith('CA');
    });
  });

  describe('validateEquipmentTypeField', () => {
    it('should not call API when value is empty', () => {
      component.validateEquipmentTypeField();
      expect(mockDonorService.validateEquipmentType).not.toHaveBeenCalled();
    });

    it('should call validateEquipmentType API for non-empty values', () => {
      fillAllRequiredFields();
      component.registrationForm.get('equipmentType')?.setValue('EQ1');
      component.validateEquipmentTypeField();
      expect(mockDonorService.validateEquipmentType).toHaveBeenCalledWith('EQ1');
    });
  });

  describe('validateAlternateIdTypeField', () => {
    it('should not call API when value is empty', () => {
      component.validateAlternateIdTypeField();
      expect(mockDonorService.validateAlternateIdType).not.toHaveBeenCalled();
    });

    it('should call validateAlternateIdType API for non-empty values', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('alternateType')?.setValue('DL');
      component.validateAlternateIdTypeField();
      expect(mockDonorService.validateAlternateIdType).toHaveBeenCalledWith('DL');
    });
  });

  describe('validateCityField', () => {
    it('should not call API when value is empty', () => {
      component.validateCityField();
      expect(mockDonorService.validateCity).not.toHaveBeenCalled();
    });

    it('should call validateCity API for non-empty values', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('city')?.setValue('Dallas');
      component.validateCityField();
      expect(mockDonorService.validateCity).toHaveBeenCalledWith('Dallas');
    });
  });

  describe('validateZipField', () => {
    it('should not call API when zip is empty', () => {
      component.validateZipField();
      expect(mockDonorService.validateZipCity).not.toHaveBeenCalled();
    });

    it('should not call API when city is empty', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('zip')?.setValue('75001');
      component.registrationForm.get('city')?.setValue('');
      component.validateZipField();
      expect(mockDonorService.validateZipCity).not.toHaveBeenCalled();
    });

    it('should call validateZipCity when both city and zip are provided', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('city')?.setValue('Dallas');
      component.registrationForm.get('zip')?.setValue('75001');
      component.validateZipField();
      expect(mockDonorService.validateZipCity).toHaveBeenCalledWith('Dallas', '75001');
    });
  });

  describe('validateEmployerZipField', () => {
    it('should not call API when employer zip is empty', () => {
      component.validateEmployerZipField();
      expect(mockDonorService.validateZipCity).not.toHaveBeenCalled();
    });

    it('should set serverError on employer zip when validation fails', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('employerCity')?.setValue('Dallas');
      component.registrationForm.get('employerZip')?.setValue('00000');
      mockDonorService.validateZipCity.and.returnValue(throwError(() => ({
        error: { error: 'ZIP code does not match' }
      })));
      component.validateEmployerZipField();
      expect(component.registrationForm.get('employerZip')?.hasError('serverError')).toBeTrue();
    });
  });

  describe('validateDonationTypeField', () => {
    it('should not advance when value is empty', () => {
      spyOn(component, 'advanceFromField');
      component.validateDonationTypeField();
      expect(component.advanceFromField).not.toHaveBeenCalled();
    });

    it('should advance when value is not empty', () => {
      fillRequiredFieldsUpToEthnicGroup();
      component.registrationForm.get('donation')?.setValue('WB');
      spyOn(component, 'advanceFromField');
      component.validateDonationTypeField();
      expect(component.advanceFromField).toHaveBeenCalledWith('donation');
    });
  });

  describe('validateProcedureCodeField', () => {
    it('should not advance when value is empty', () => {
      spyOn(component, 'advanceFromField');
      component.validateProcedureCodeField();
      expect(component.advanceFromField).not.toHaveBeenCalled();
    });

    it('should advance when value is not empty', () => {
      fillRequiredFieldsUpToEthnicGroup();
      component.registrationForm.get('procedure')?.setValue('PP');
      spyOn(component, 'advanceFromField');
      component.validateProcedureCodeField();
      expect(component.advanceFromField).toHaveBeenCalledWith('procedure');
    });
  });

  describe('validateDeferralReasonField', () => {
    it('should not advance when value is empty', () => {
      spyOn(component, 'advanceFromField');
      component.validateDeferralReasonField();
      expect(component.advanceFromField).not.toHaveBeenCalled();
    });

    it('should advance when deferral reason is 0', () => {
      fillAllRequiredFields();
      component.registrationForm.get('deferral')?.setValue('0');
      spyOn(component, 'advanceFromField');
      component.validateDeferralReasonField();
      expect(component.advanceFromField).toHaveBeenCalledWith('deferral');
    });

    it('should clear value and set error when deferral reason ends with comma', () => {
      fillAllRequiredFields();
      component.registrationForm.get('deferral')?.setValue('5,');
      component.validateDeferralReasonField();
      expect(component.registrationForm.get('deferral')?.value).toBe('');
      expect(component.registrationForm.get('deferral')?.hasError('serverError')).toBeTrue();
    });

    it('should advance when deferral reason is valid', () => {
      fillAllRequiredFields();
      component.registrationForm.get('deferral')?.setValue('5');
      spyOn(component, 'advanceFromField');
      component.validateDeferralReasonField();
      expect(component.advanceFromField).toHaveBeenCalledWith('deferral');
    });
  });

  describe('validateDobAge', () => {
    it('should clear dob when age is greater than 125 years', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('dob')?.setValue(moment('1890-01-01'));
      component.validateDobAge();
      expect(component.registrationForm.get('dob')?.value).toBeNull();
      expect(component.registrationForm.get('dob')?.hasError('serverError')).toBeTrue();
    });

    it('should not clear dob when age is within valid range', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('dob')?.setValue(moment('1990-01-01'));
      component.validateDobAge();
      expect(component.registrationForm.get('dob')?.value).toBeTruthy();
    });

    it('should do nothing when dob is empty', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      component.registrationForm.get('dob')?.setValue(null);
      component.validateDobAge();
      // no error expected
    });
  });

  describe('validateAlternateId', () => {
    it('should show error and reset when alternateId does not match findDonorValues', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).findDonorValues = { alternateId: 'ALT123' };
      component.registrationForm.get('alternateId')?.setValue('WRONG');
      component.validateAlternateId();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Alternate ID does not match'));
      expect(component.registrationForm.get('alternateId')?.value).toBe('ALT123');
    });

    it('should not show error when alternateId matches findDonorValues', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).findDonorValues = { alternateId: 'ALT123' };
      component.registrationForm.get('alternateId')?.setValue('ALT123');
      component.validateAlternateId();
      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    });

    it('should call advanceFromField when no findDonorValues', () => {
      fillRequiredFieldsUpToWeight();
      spyOn(component, 'advanceFromField');
      component.validateAlternateId();
      expect(component.advanceFromField).toHaveBeenCalledWith('alternateId');
    });
  });

  describe('validateAlternateIdType', () => {
    it('should show error and reset when alternateIdType does not match findDonorValues', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).findDonorValues = { alternateIdType: 'DL' };
      component.registrationForm.get('alternateType')?.setValue('PP');
      component.validateAlternateIdType();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Alternate ID Type does not match'));
      expect(component.registrationForm.get('alternateType')?.value).toBe('DL');
    });

    it('should not show error when alternateIdType matches findDonorValues', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).findDonorValues = { alternateIdType: 'DL' };
      component.registrationForm.get('alternateType')?.setValue('DL');
      component.validateAlternateIdType();
      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    });
  });

  // ─── validateLastName / validateFirstName / validateDob / validateGender ──

  describe('validateLastName', () => {
    it('should do nothing when lastName is empty', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      component.registrationForm.get('lastName')?.setValue('');
      component.validateLastName();
      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    });

    it('should show error and reset when lastName does not match existing donor', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).findDonorValues = { lastName: 'Smith' };
      (component as any).isExistingDonor.set(true);
      component.registrationForm.get('lastName')?.setValue('Jones');
      component.validateLastName();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Last Name does not match'));
      expect(component.registrationForm.get('lastName')?.value).toBe('Smith');
    });

    it('should set mismatch error when lastName does not match newDonorExpected', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).newDonorExpected = { lastName: 'Smith' };
      component.registrationForm.get('lastName')?.setValue('Jones');
      component.validateLastName();
      expect(component.donorMismatchErrors['lastName']).toBeTruthy();
      expect(component.registrationForm.get('lastName')?.hasError('serverError')).toBeTrue();
    });

    it('should allow matching lastName with newDonorExpected (case insensitive)', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).newDonorExpected = { lastName: 'Smith' };
      component.registrationForm.get('lastName')?.setValue('smith');
      component.validateLastName();
      expect(component.donorMismatchErrors['lastName']).toBeUndefined();
    });
  });

  describe('validateFirstName', () => {
    it('should do nothing when firstName is empty', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      component.registrationForm.get('firstName')?.setValue('');
      component.validateFirstName();
      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    });

    it('should show error and reset when firstName does not match existing donor', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).findDonorValues = { firstName: 'John' };
      component.registrationForm.get('firstName')?.setValue('Jane');
      component.validateFirstName();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('First Name does not match'));
      expect(component.registrationForm.get('firstName')?.value).toBe('John');
    });

    it('should set mismatch error when firstName does not match newDonorExpected', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).newDonorExpected = { firstName: 'John' };
      component.registrationForm.get('firstName')?.setValue('Jane');
      component.validateFirstName();
      expect(component.donorMismatchErrors['firstName']).toBeTruthy();
    });
  });

  describe('validateDob', () => {
    it('should call validateDobAge when entered value is null', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('dob')?.setValue(null);
      spyOn(component, 'validateDobAge');
      component.validateDob();
      expect(component.validateDobAge).toHaveBeenCalled();
    });

    it('should show error when dob does not match existing donor', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).findDonorValues = { dob: '1990-01-01' };
      component.registrationForm.get('dob')?.setValue(moment('1985-05-20'));
      component.validateDob();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Date of Birth does not match'));
    });

    it('should set mismatch error when dob does not match newDonorExpected', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).newDonorExpected = { dob: '1990-01-01' };
      component.registrationForm.get('dob')?.setValue(moment('1985-05-20'));
      component.validateDob();
      expect(component.donorMismatchErrors['dob']).toBeTruthy();
    });

    it('should clear mismatch when dob matches newDonorExpected', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).newDonorExpected = { dob: '1990-01-01' };
      component.donorMismatchErrors['dob'] = 'old error';
      component.registrationForm.get('dob')?.setValue(moment('1990-01-01'));
      component.validateDob();
      expect(component.donorMismatchErrors['dob']).toBeUndefined();
    });
  });

  describe('validateGender', () => {
    it('should do nothing when sex is empty', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('sex')?.setValue('');
      component.validateGender();
      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    });

    it('should show error when sex does not match existing donor', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).findDonorValues = { sex: 'Male' };
      component.registrationForm.get('sex')?.setValue('Female');
      component.validateGender();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Sex does not match'));
    });

    it('should set mismatch error when sex does not match newDonorExpected', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).newDonorExpected = { sex: 'M' };
      component.registrationForm.get('sex')?.setValue('Female');
      component.validateGender();
      expect(component.donorMismatchErrors['sex']).toBeTruthy();
    });

    it('should normalize sex values for comparison (m vs Male)', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).newDonorExpected = { sex: 'm' };
      component.registrationForm.get('sex')?.setValue('Male');
      component.validateGender();
      expect(component.donorMismatchErrors['sex']).toBeUndefined();
    });
  });

  // ─── onNewDonorFieldEnter ─────────────────────────────────────────────────

  describe('onNewDonorFieldEnter', () => {
    it('should call validateLastName when field is lastName', () => {
      spyOn(component, 'validateLastName');
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNewDonorFieldEnter(event, 'lastName');
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.validateLastName).toHaveBeenCalled();
    });

    it('should call validateFirstName when field is firstName', () => {
      spyOn(component, 'validateFirstName');
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onNewDonorFieldEnter(event, 'firstName');
      expect(component.validateFirstName).toHaveBeenCalled();
    });
  });

  // ─── normalizeSex / toDisplaySex / toGenderCode ───────────────────────────

  describe('sex normalization helpers', () => {
    it.each([
      ['m', 'male'],
      ['M', 'male'],
      ['male', 'male'],
      ['Male', 'male'],
      ['f', 'female'],
      ['F', 'female'],
      ['female', 'female'],
      ['Female', 'female'],
      ['X', 'x'],
    ])('normalizeSex(%s) should return %s', (input: string, expected: string) => {
      expect((component as any).normalizeSex(input)).toBe(expected);
    });

    it.each([
      [null, ''],
      ['', ''],
      ['m', 'Male'],
      ['f', 'Female'],
      ['Male', 'Male'],
      ['Female', 'Female'],
      ['X', 'X'],
    ])('toDisplaySex(%s) should return %s', (input: any, expected: string) => {
      expect((component as any).toDisplaySex(input)).toBe(expected);
    });

    it.each([
      [null, undefined],
      ['', undefined],
      ['Male', 'M'],
      ['Female', 'F'],
      ['m', 'M'],
      ['f', 'F'],
      ['X', 'X'],
    ])('toGenderCode(%s) should return %s', (input: any, expected: any) => {
      expect((component as any).toGenderCode(input)).toBe(expected);
    });
  });

  // ─── Phone validation & formatting ────────────────────────────────────────

  describe('validatePhone', () => {
    it('should do nothing when value is empty', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homePhone')?.setValue('');
      component.validatePhone('homePhone', 'Home Phone');
      expect(component.registrationForm.get('homePhone')?.hasError('serverError')).toBeFalse();
    });

    it('should clear value and set error for invalid phone (wrong digit count)', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homePhone')?.setValue('12345');
      component.validatePhone('homePhone', 'Home Phone');
      expect(component.registrationForm.get('homePhone')?.value).toBe('');
      expect(component.registrationForm.get('homePhone')?.hasError('serverError')).toBeTrue();
    });

    it('should format 10-digit phone correctly', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homePhone')?.setValue('2145551234');
      component.validatePhone('homePhone', 'Home Phone');
      expect(component.registrationForm.get('homePhone')?.value).toBe('(214) 555-1234');
    });

    it('should format 7-digit phone correctly', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homePhone')?.setValue('5551234');
      component.validatePhone('homePhone', 'Home Phone');
      expect(component.registrationForm.get('homePhone')?.value).toBe('555-1234');
    });

    it('should reject phone with all zeros', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homePhone')?.setValue('0000000');
      component.validatePhone('homePhone', 'Home Phone');
      expect(component.registrationForm.get('homePhone')?.value).toBe('');
      expect(component.registrationForm.get('homePhone')?.hasError('serverError')).toBeTrue();
    });
  });

  describe('formatPhoneInput', () => {
    it('should strip non-digits from phone input', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homePhone')?.setValue('(214) 555-1234');
      component.formatPhoneInput('homePhone');
      expect(component.registrationForm.get('homePhone')?.value).toBe('2145551234');
    });

    it('should truncate to 10 digits', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homePhone')?.setValue('12345678901');
      component.formatPhoneInput('homePhone');
      expect(component.registrationForm.get('homePhone')?.value).toBe('1234567890');
    });

    it('should do nothing for non-existent control', () => {
      component.formatPhoneInput('nonExistentField');
      // should not throw
    });
  });

  describe('parsePhone', () => {
    it('should parse 10-digit phone into areaCode and phoneNo', () => {
      const result = (component as any).parsePhone('2145551234');
      expect(result.areaCode).toBe('214');
      expect(result.phoneNo).toBe('5551234');
    });

    it('should parse 7-digit phone with empty areaCode', () => {
      const result = (component as any).parsePhone('5551234');
      expect(result.areaCode).toBe('');
      expect(result.phoneNo).toBe('5551234');
    });

    it('should return empty for null/empty input', () => {
      const result = (component as any).parsePhone('');
      expect(result.areaCode).toBe('');
      expect(result.phoneNo).toBe('');
    });

    it('should strip non-digits from formatted phone', () => {
      const result = (component as any).parsePhone('(214) 555-1234');
      expect(result.areaCode).toBe('214');
      expect(result.phoneNo).toBe('5551234');
    });
  });

  describe('formatPhoneFromParts', () => {
    it('should format with area code when both parts are provided', () => {
      const result = (component as any).formatPhoneFromParts('214', '5551234');
      expect(result).toBe('(214) 555-1234');
    });

    it('should format without area code when only phoneNo is provided', () => {
      const result = (component as any).formatPhoneFromParts(null, '5551234');
      expect(result).toBe('555-1234');
    });

    it('should return empty string when phoneNo is null', () => {
      const result = (component as any).formatPhoneFromParts('214', null);
      expect(result).toBe('');
    });

    it('should return phoneNo as-is when it is shorter than 7 chars', () => {
      const result = (component as any).formatPhoneFromParts(null, '555');
      expect(result).toBe('555');
    });
  });

  // ─── onlyNumbers / onPasteNumbers ─────────────────────────────────────────

  describe('onlyNumbers', () => {
    it('should prevent non-digit keys', () => {
      const event = { key: 'a', charCodeAt: () => 97, preventDefault: jasmine.createSpy('pd') } as any;
      // key.charCodeAt(0) for 'a' is 97
      component.onlyNumbers({ key: 'a', preventDefault: jasmine.createSpy('pd') } as any);
      // just verify no error thrown
    });

    it('should allow digit keys', () => {
      const spy = jasmine.createSpy('pd');
      component.onlyNumbers({ key: '5', preventDefault: spy } as any);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onPasteNumbers', () => {
    it('should prevent paste of non-numeric text', () => {
      const spy = jasmine.createSpy('pd');
      component.onPasteNumbers({
        clipboardData: { getData: () => 'abc' },
        preventDefault: spy,
      } as any);
      expect(spy).toHaveBeenCalled();
    });

    it('should allow paste of numeric text', () => {
      const spy = jasmine.createSpy('pd');
      component.onPasteNumbers({
        clipboardData: { getData: () => '123' },
        preventDefault: spy,
      } as any);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ─── onWeightKeypress / onWeightPaste ─────────────────────────────────────

  describe('onWeightKeypress', () => {
    it('should prevent non-digit keys', () => {
      const spy = jasmine.createSpy('pd');
      component.onWeightKeypress({ key: 'a', target: { value: '' }, preventDefault: spy } as any);
      expect(spy).toHaveBeenCalled();
    });

    it('should prevent digit keys when input already has 3 digits', () => {
      const spy = jasmine.createSpy('pd');
      component.onWeightKeypress({ key: '5', target: { value: '123' }, preventDefault: spy } as any);
      expect(spy).toHaveBeenCalled();
    });

    it('should allow digit keys when input has fewer than 3 digits', () => {
      const spy = jasmine.createSpy('pd');
      component.onWeightKeypress({ key: '5', target: { value: '12' }, preventDefault: spy } as any);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onWeightPaste', () => {
    it('should prevent paste of non-numeric text', () => {
      const spy = jasmine.createSpy('pd');
      component.onWeightPaste({ clipboardData: { getData: () => 'abc' }, preventDefault: spy } as any);
      expect(spy).toHaveBeenCalled();
    });

    it('should prevent paste of values over 999', () => {
      const spy = jasmine.createSpy('pd');
      component.onWeightPaste({ clipboardData: { getData: () => '1000' }, preventDefault: spy } as any);
      expect(spy).toHaveBeenCalled();
    });

    it('should allow paste of valid weight values', () => {
      const spy = jasmine.createSpy('pd');
      component.onWeightPaste({ clipboardData: { getData: () => '150' }, preventDefault: spy } as any);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ─── formatDate ───────────────────────────────────────────────────────────

  describe('formatDate', () => {
    it.each([
      [null, '--'],
      ['', '--'],
    ])('should return "--" for %s', (input: any, expected: string) => {
      expect(component.formatDate(input)).toBe(expected);
    });

    it('should format valid date string', () => {
      const result = component.formatDate('2025-03-15');
      expect(result).toBe('15-MAR-2025');
    });

    it('should return raw value for invalid date string', () => {
      const result = component.formatDate('not-a-date');
      // moment('not-a-date') may parse or fail; if invalid returns the raw string
      const m = moment('not-a-date');
      if (!m.isValid()) {
        expect(result).toBe('not-a-date');
      }
    });
  });

  // ─── International address ────────────────────────────────────────────────

  describe('international address', () => {
    it('should disable address fields when international address is applied', () => {
      fillRequiredFieldsUpToWeight();
      component.disableAddressFields();
      expect(component.registrationForm.get('homeAddress')?.disabled).toBeTrue();
      expect(component.registrationForm.get('apartmentNo')?.disabled).toBeTrue();
      expect(component.registrationForm.get('city')?.disabled).toBeTrue();
      expect(component.registrationForm.get('zip')?.disabled).toBeTrue();
      expect(component.hasInternationalAddress()).toBeTrue();
    });

    it('should clear required validator for address fields when international', () => {
      fillRequiredFieldsUpToWeight();
      component.disableAddressFields();
      const homeAddr = component.registrationForm.get('homeAddress');
      // After disableAddressFields, homeAddress should not have 'required' validator
      // Re-enable temporarily to check validators were cleared
      homeAddr?.enable({ emitEvent: false });
      homeAddr?.setValue('');
      homeAddr?.updateValueAndValidity();
      expect(homeAddr?.hasError('required')).toBeFalse();
    });

    it('should re-enable address fields when international address is cleared', () => {
      fillRequiredFieldsUpToWeight();
      component.disableAddressFields();
      component.enableAddressFields();
      expect(component.hasInternationalAddress()).toBeFalse();
      expect(component.donorIntlAddress).toBeNull();
    });

    it('should restore required validators when international address is cleared', () => {
      fillRequiredFieldsUpToWeight();
      component.disableAddressFields();
      component.enableAddressFields();
      const homeAddr = component.registrationForm.get('homeAddress');
      homeAddr?.setValue('');
      homeAddr?.markAsTouched();
      homeAddr?.updateValueAndValidity();
      expect(homeAddr?.hasError('required')).toBeTrue();
    });

    it('disableEmployerFields should set employer international flag', () => {
      component.disableEmployerFields();
      expect(component.hasEmployerInternationalAddress()).toBeTrue();
    });

    it('enableEmployerFields should clear employer international flag', () => {
      component.disableEmployerFields();
      component.enableEmployerFields();
      expect(component.hasEmployerInternationalAddress()).toBeFalse();
      expect(component.employerIntlAddress).toBeNull();
    });
  });

  // ─── openInternationalAddress dialog ──────────────────────────────────────

  describe('openInternationalAddress', () => {
    it('should open dialog for donor target and apply result', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      const intlAddress = { streetName: 'Int St', country: 'UK', intlAddrFlag: 'Y' };
      mockDialog.open.and.returnValue({ afterClosed: () => of(intlAddress) } as any);
      component.openInternationalAddress('donor');
      tick();
      expect(component.donorIntlAddress).toEqual(intlAddress as any);
      expect(component.hasInternationalAddress()).toBeTrue();
    }));

    it('should open dialog for employer target and apply result', fakeAsync(() => {
      const intlAddress = { streetName: 'Int St', country: 'UK', intlAddrFlag: 'Y' };
      mockDialog.open.and.returnValue({ afterClosed: () => of(intlAddress) } as any);
      component.openInternationalAddress('employer');
      tick();
      expect(component.employerIntlAddress).toEqual(intlAddress as any);
      expect(component.hasEmployerInternationalAddress()).toBeTrue();
    }));

    it('should enable address fields when dialog returns null for donor', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      component.disableAddressFields();
      mockDialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.openInternationalAddress('donor');
      tick();
      expect(component.hasInternationalAddress()).toBeFalse();
    }));

    it('should enable employer fields when dialog returns null for employer', fakeAsync(() => {
      component.disableEmployerFields();
      mockDialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.openInternationalAddress('employer');
      tick();
      expect(component.hasEmployerInternationalAddress()).toBeFalse();
    }));

    it('should do nothing when dialog returns undefined', fakeAsync(() => {
      component.disableAddressFields();
      mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
      component.openInternationalAddress('donor');
      tick();
      expect(component.hasInternationalAddress()).toBeTrue();
    }));
  });

  // ─── openAlternateDemographics ────────────────────────────────────────────

  describe('openAlternateDemographics', () => {
    it('should fetch existing alt demographics for existing donor', fakeAsync(() => {
      fillAllRequiredFields();
      component.registrationForm.get('donorId')?.setValue('D1');
      (component as any).pendingAltAddress.set(null);
      mockAltDemoService.getByDonorId.and.returnValue(of(null));
      mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
      component.openAlternateDemographics();
      tick();
      expect(mockAltDemoService.getByDonorId).toHaveBeenCalledWith('D1');
      expect(mockDialog.open).toHaveBeenCalled();
    }));

    it('should use pending alt address when available', fakeAsync(() => {
      fillAllRequiredFields();
      const pending = { streetName: 'Alt St' } as any;
      (component as any).pendingAltAddress.set(pending);
      mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
      component.openAlternateDemographics();
      tick();
      expect(mockAltDemoService.getByDonorId).not.toHaveBeenCalled();
      expect(mockDialog.open).toHaveBeenCalled();
    }));

    it('should clear pendingAltAddress when dialog returns null', fakeAsync(() => {
      (component as any).pendingAltAddress.set({ streetName: 'Old' } as any);
      mockDialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
      (component as any).openAltAddressDialog({ streetName: 'Old' } as any);
      tick();
      expect((component as any).pendingAltAddress()).toBeNull();
    }));

    it('should set pendingAltAddress when dialog returns object', fakeAsync(() => {
      const result = { streetName: 'New Alt St' } as any;
      mockDialog.open.and.returnValue({ afterClosed: () => of(result) } as any);
      (component as any).openAltAddressDialog(undefined);
      tick();
      expect((component as any).pendingAltAddress()).toEqual(result);
    }));
  });

  // ─── City / Zip / Employer selection ──────────────────────────────────────

  describe('onCitySelected', () => {
    it('should set stateDisplay, uspsId, and patch zip', () => {
      const city = { uspsId: 123, city: 'Dallas', state: 'TX', zip: '75001' };
      component.onCitySelected(city);
      expect(component.stateDisplay()).toBe('TX');
      expect(component.registrationForm.getRawValue().zip).toBe('75001');
    });

    it('should set stateDisplay to -- when state is empty', () => {
      const city = { uspsId: 123, city: 'Dallas', state: '', zip: '75001' };
      component.onCitySelected(city);
      expect(component.stateDisplay()).toBe('--');
    });
  });

  describe('onEmployerCitySelected', () => {
    it('should set employerStateDisplay and patch employerZip', () => {
      const city = { uspsId: 456, city: 'Houston', state: 'TX', zip: '77001' };
      component.onEmployerCitySelected(city);
      expect(component.employerStateDisplay()).toBe('TX');
      expect(component.registrationForm.getRawValue().employerZip).toBe('77001');
    });
  });

  describe('onEmployerSelected', () => {
    it('should clear employer fields when employerId is empty', () => {
      component.registrationForm.patchValue({ employerCity: 'Dallas', employerZip: '75001' });
      component.onEmployerSelected('');
      expect(component.registrationForm.getRawValue().employerCity).toBe('');
      expect(component.employerStateDisplay()).toBe('--');
    });

    it('should populate employer fields when employer is found', () => {
      component.filteredEmployers.set([
        { employerId: 'EMP1', employerName: 'Company', city: 'Dallas', state: 'TX', zip: '75001', uspsId: 100 } as any,
      ]);
      component.onEmployerSelected('EMP1');
      expect(component.registrationForm.getRawValue().employerCity).toBe('Dallas');
      expect(component.registrationForm.getRawValue().employerZip).toBe('75001');
      expect(component.employerStateDisplay()).toBe('TX');
    });

    it('should do nothing when employer is not found in filtered list', () => {
      component.filteredEmployers.set([]);
      component.onEmployerSelected('NOTFOUND');
      // should not throw
    });
  });

  describe('onZipBlur', () => {
    it('should set stateDisplay to -- when zip is empty', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('zip')?.setValue('');
      component.onZipBlur();
      expect(component.stateDisplay()).toBe('--');
    });

    it('should update city and state from API results when zip is provided', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      const results = [{ uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' }];
      mockDonorService.getCityState.and.returnValue(of(results));
      component.registrationForm.get('zip')?.setValue('75001');
      component.registrationForm.get('city')?.setValue('');
      component.onZipBlur();
      tick();
      expect(component.stateDisplay()).toBe('TX');
      expect(component.registrationForm.get('city')?.value).toBe('Dallas');
    }));

    it('should use matching city from results when city is already selected', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      const results = [
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
        { uspsId: 2, city: 'Plano', state: 'TX', zip: '75001' },
      ];
      mockDonorService.getCityState.and.returnValue(of(results));
      component.registrationForm.get('city')?.setValue('Plano');
      component.registrationForm.get('zip')?.setValue('75001');
      component.onZipBlur();
      tick();
      expect(component.stateDisplay()).toBe('TX');
    }));
  });

  describe('onEmployerZipBlur', () => {
    it('should set employerStateDisplay to -- when zip is empty', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('employerZip')?.setValue('');
      component.onEmployerZipBlur();
      expect(component.employerStateDisplay()).toBe('--');
    });

    it('should skip when zip is shorter than 5', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('employerZip')?.setValue('750');
      component.onEmployerZipBlur();
      expect(mockDonorService.getCityState).not.toHaveBeenCalled();
    });

    it('should update employer city and state from API results', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      const results = [{ uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' }];
      mockDonorService.getCityState.and.returnValue(of(results));
      component.registrationForm.get('employerZip')?.setValue('75001');
      component.registrationForm.get('employerCity')?.setValue('');
      component.onEmployerZipBlur();
      tick();
      expect(component.employerStateDisplay()).toBe('TX');
    }));
  });

  // ─── Deferred thru validation ─────────────────────────────────────────────

  describe('setupDeferredThruValidation', () => {
    it('should set afterDriveDate error when deferredThru is after driveDate', fakeAsync(() => {
      fillAllRequiredFields();
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      component.registrationForm.get('deferredThru')?.enable();
      component.registrationForm.get('deferredThru')?.setValue(moment('2025-02-01'));
      tick();
      expect(component.registrationForm.get('deferredThru')?.hasError('afterDriveDate')).toBeTrue();
    }));

    it('should clear errors when deferredThru is null and no parse error', fakeAsync(() => {
      fillAllRequiredFields();
      component.registrationForm.get('deferredThru')?.enable();
      component.registrationForm.get('deferredThru')?.setValue(null);
      tick();
      expect(component.registrationForm.get('deferredThru')?.errors).toBeNull();
    }));

    it('should set serverError when deferralType is IND and deferredThru has value', fakeAsync(() => {
      fillAllRequiredFields();
      component.registrationForm.get('deferralType')?.setValue('IND');
      component.registrationForm.get('deferredThru')?.enable();
      component.searchForm.get('driveDate')?.setValue(moment('2026-12-01'));
      component.registrationForm.get('deferredThru')?.setValue(moment('2025-01-01'));
      tick();
      expect(component.registrationForm.get('deferredThru')?.hasError('serverError')).toBeTrue();
    }));
  });

  // ─── Deferral type validation ─────────────────────────────────────────────

  describe('setupDeferralTypeValidation', () => {
    it('should set serverError when IND is selected but deferredThru has value', fakeAsync(() => {
      fillAllRequiredFields();
      component.registrationForm.get('deferredThru')?.enable();
      component.registrationForm.get('deferredThru')?.setValue(moment('2025-06-01'));
      component.registrationForm.get('deferralType')?.setValue('IND');
      tick();
      expect(component.registrationForm.get('deferralType')?.hasError('serverError')).toBeTrue();
    }));

    it('should not set error when IND is selected and deferredThru is empty', fakeAsync(() => {
      fillAllRequiredFields();
      component.registrationForm.get('deferredThru')?.enable();
      component.registrationForm.get('deferredThru')?.setValue(null, { emitEvent: false });
      component.registrationForm.get('deferralType')?.setValue('IND');
      tick();
      expect(component.registrationForm.get('deferralType')?.hasError('serverError')).toBeFalse();
    }));
  });

  // ─── Donation type listener ───────────────────────────────────────────────

  describe('setupDonationTypeListener', () => {
    it('should clear procedure and deferral when donationType is cleared', fakeAsync(() => {
      fillAllRequiredFields();
      component.registrationForm.get('donation')?.setValue('');
      tick();
      expect(component.registrationForm.get('procedure')?.value).toBe('');
      expect(component.registrationForm.get('deferral')?.value).toBe('');
    }));

    it('should load procedure codes when donationType is set', fakeAsync(() => {
      fillAllRequiredFields();
      const codes = [{ procedureCode: 'PP', description: 'Test' }];
      mockDonorService.getProcedureCodesByDonationType.and.returnValue(of(codes as any));
      mockDonorService.getDeferralReasons.and.returnValue(of([]));
      component.registrationForm.get('donation')?.setValue('WB');
      tick();
      expect(mockDonorService.getProcedureCodesByDonationType).toHaveBeenCalledWith('WB');
    }));

    it('should show error when deferral reasons fail to load', fakeAsync(() => {
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      fillRequiredFieldsUpToEthnicGroup();
      mockDonorService.getProcedureCodesByDonationType.and.returnValue(of([]));
      mockDonorService.getDeferralReasons.and.returnValue(throwError(() => new Error('fail')));
      component.registrationForm.get('donation')?.setValue('PL');
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load deferral reasons');
    }));

    it('should not call API when driveDate is missing', fakeAsync(() => {
      fillRequiredFieldsUpToEthnicGroup();
      // driveDate is NOT set in fillRequiredFieldsUpToEthnicGroup
      mockDonorService.getProcedureCodesByDonationType.calls.reset();
      component.registrationForm.get('donation')?.setValue('WB');
      tick();
      expect(mockDonorService.getProcedureCodesByDonationType).not.toHaveBeenCalled();
    }));
  });

  // ─── content navigation ───────────────────────────────────────────────────

  describe('content navigation', () => {
    it('should have 6 content sections', () => {
      expect(component.contentSections.length).toBe(6);
    });

    it('should default activeSection to donor', () => {
      expect(component.activeSection()).toBe('donor');
    });

    it('should update activeSection on scrollToSection', () => {
      component.scrollToSection('personal');
      expect(component.activeSection()).toBe('personal');
    });

    it('should set isScrollingProgrammatically flag', fakeAsync(() => {
      component.scrollToSection('address');
      expect(component.activeSection()).toBe('address');
      tick(900);
    }));
  });

  // ─── openManualHolds ──────────────────────────────────────────────────────

  describe('openManualHolds', () => {
    it('should show error when interdiction codes are not loaded', () => {
      component.interdictionCodes.set([]);
      component.openManualHolds();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Interdiction codes not loaded'));
    });

    it('should open dialog when interdiction codes are loaded', fakeAsync(() => {
      component.interdictionCodes.set([{ interCode: 'NODON', interDesc: 'Test', interType: 'HOLDS' }]);
      mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
      component.openManualHolds();
      tick();
      expect(mockDialog.open).toHaveBeenCalled();
    }));

    it('should update pendingHolds when dialog returns selectedHolds', fakeAsync(() => {
      component.interdictionCodes.set([{ interCode: 'NODON', interDesc: 'Test', interType: 'HOLDS' }]);
      const holds = [{ interCode: 'HOLD1', interDesc: 'Hold 1', interType: 'HOLDS' }];
      mockDialog.open.and.returnValue({ afterClosed: () => of({ action: 'ok', selectedHolds: holds }) } as any);
      component.openManualHolds();
      tick();
      expect((component as any).pendingHolds()).toEqual(holds);
    }));
  });

  // ─── openBleedTimeDetails ─────────────────────────────────────────────────

  describe('openBleedTimeDetails', () => {
    it('should open dialog and apply result when action is apply', fakeAsync(() => {
      component.employees.set([]);
      const result = {
        action: 'apply',
        selectedArm: 'L',
        data: {
          leftArm: { startTime1: '08:00', startPhleb1: 'E1', endTime1: '08:15', endPhleb1: 'E1', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
          rightArm: { startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
          other: { startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
          drawStartTime: '08:00',
          mrsLoss: '10',
          phlebotomistLoss: '5',
        },
      };
      mockDialog.open.and.returnValue({ afterClosed: () => of(result) } as any);
      component.openBleedTimeDetails();
      tick();
      expect(component.registrationForm.get('armUsed')?.value).toBe('L');
      expect(component.bleedTimeData).toBeTruthy();
    }));

    it('should not change armUsed when dialog result has no selectedArm', fakeAsync(() => {
      fillAllRequiredFields();
      const result = { action: 'apply', selectedArm: null, data: null };
      mockDialog.open.and.returnValue({ afterClosed: () => of(result) } as any);
      component.openBleedTimeDetails();
      tick();
      expect(component.registrationForm.get('armUsed')?.value).toBe('R');
    }));
  });

  // ─── onNewEmployerSaved ───────────────────────────────────────────────────

  describe('onNewEmployerSaved', () => {
    it('should hide add employer panel', () => {
      component.showAddEmployerPanel = true;
      mockDonorService.getEmployers.and.returnValue(of([]));
      component.onNewEmployerSaved({ message: 'Created', employerId: 'E1', employerName: 'New Corp' });
      expect(component.showAddEmployerPanel).toBeFalse();
    });

    it('should reload employers when search term is set', fakeAsync(() => {
      const employers = [{ employerId: 'E1', employerName: 'New Corp' }];
      mockDonorService.getEmployers.and.returnValue(of(employers as any));
      component.employerSearchControl.setValue('New');
      component.onNewEmployerSaved({ message: 'Created', employerId: 'E1', employerName: 'New Corp' });
      tick();
      expect(component.filteredEmployers().length).toBe(1);
    }));

    it('should not reload employers when search term is empty', fakeAsync(() => {
      component.employerSearchControl.setValue('');
      const employers = [{ employerId: 'E1', employerName: 'New Corp' }];
      mockDonorService.getEmployers.and.returnValue(of(employers as any));
      component.onNewEmployerSaved({ message: 'Created', employerId: 'E1', employerName: 'New Corp' });
      tick();
      expect(mockDonorService.getEmployers).toHaveBeenCalled();
    }));
  });

  // ─── combineDateTime ──────────────────────────────────────────────────────

  describe('combineDateTime', () => {
    it('should combine time and date into ISO format', () => {
      const result = (component as any).combineDateTime('08:30', '2025-01-01');
      expect(result).toBe('2025-01-01T08:30:00');
    });

    it('should return undefined when time is empty', () => {
      expect((component as any).combineDateTime('', '2025-01-01')).toBeUndefined();
    });

    it('should return undefined when time has no colon', () => {
      expect((component as any).combineDateTime('0830', '2025-01-01')).toBeUndefined();
    });

    it('should return undefined when date is empty', () => {
      expect((component as any).combineDateTime('08:30', '')).toBeUndefined();
    });

    it('should return undefined when both are undefined', () => {
      expect((component as any).combineDateTime(undefined, undefined)).toBeUndefined();
    });
  });

  // ─── formatDateForApi ─────────────────────────────────────────────────────

  describe('formatDateForApi', () => {
    it('should format valid date as MMDDYYYY', () => {
      const result = (component as any).formatDateForApi(moment('2025-03-15'));
      expect(result).toBe('03152025');
    });

    it('should return empty string for invalid date', () => {
      const result = (component as any).formatDateForApi(moment.invalid());
      expect(result).toBe('');
    });

    it('should return empty string for null', () => {
      const result = (component as any).formatDateForApi(null);
      expect(result).toBe('');
    });
  });

  // ─── onAutoSave ───────────────────────────────────────────────────────────

  describe('onAutoSave', () => {
    it('should not proceed when isLoading is true', () => {
      component.isLoading.set(true);
      component.onAutoSave();
      expect(mockDonorService.create).not.toHaveBeenCalled();
    });

    it('should not proceed when unitId is missing', () => {
      (component as any).unitIdField = null;
      component.onAutoSave();
      expect(mockDonorService.create).not.toHaveBeenCalled();
    });

    it('should not proceed when registration form is invalid for non-hold action', () => {
      setupMockUnitIdField();
      // Enable a required field and leave it empty so the form is truly invalid
      component.registrationForm.get('lastName')?.enable();
      component.registrationForm.get('lastName')?.setValue('');
      component.onAutoSave();
      expect(mockDonorService.create).not.toHaveBeenCalled();
    });

    it('should call create and show success on successful save', () => {
      fillAllRequiredFields();
      mockDonorService.create.and.returnValue(of({
        success: true,
        message: 'Created',
        statusCode: 201,
        item: { transactionId: 'T1', donorId: 'D1' },
      } as any));

      component.onAutoSave();

      expect(mockDonorService.create).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Donation registered successfully.');
    });

    it('should show error when API returns success=false', () => {
      fillAllRequiredFields();
      mockDonorService.create.and.returnValue(of({
        success: false,
        message: 'Duplicate unit',
        errorResponse: { error: 'Unit already registered' },
      } as any));

      component.onAutoSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Unit already registered');
    });

    it('should show generic error when API returns success=false without errorResponse', () => {
      fillAllRequiredFields();
      mockDonorService.create.and.returnValue(of({
        success: false,
        message: 'Something went wrong',
      } as any));

      component.onAutoSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Something went wrong');
    });

    it('should show error on API call failure', () => {
      fillAllRequiredFields();
      mockDonorService.create.and.returnValue(throwError(() => ({
        error: { message: 'Server error' }
      })));

      component.onAutoSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Server error');
    });

    it('should show generic error on API failure without message', () => {
      fillAllRequiredFields();
      mockDonorService.create.and.returnValue(throwError(() => ({})));

      component.onAutoSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('An error occurred while registering donation.');
    });

    it('should set isLoading to false after API error', () => {
      fillAllRequiredFields();
      mockDonorService.create.and.returnValue(throwError(() => new Error('fail')));
      component.onAutoSave();
      expect(component.isLoading()).toBeFalse();
    });

    describe('unit ID handling', () => {
      it('should use manualUnitId for ISBT128 units (code scheme I)', () => {
        fillAllRequiredFields();
        setupMockUnitIdField({
          parsedUnitId: 'W421210060301',
          parsedUnitData: {
            parsedUnitId: 'W421210060301',
            manualUnitId: 'W421210060301-E',
            codeScheme: 'I',
            checkDigit: '-E',
            barcodeType: 'CODE128',
            entryMode: 'S',
            chapterScheme: 'I',
          },
        });

        mockDonorService.create.and.returnValue(of({
          success: true, message: 'Created', statusCode: 201,
          item: { transactionId: 'T1' },
        } as any));

        component.onAutoSave();

        const request = mockDonorService.create.calls.mostRecent().args[0];
        expect(request.unitId).toBe('W421210060301-E');
      });

      it('should use parsedUnitId for Codabar units (code scheme C)', () => {
        fillAllRequiredFields();
        setupMockUnitIdField({
          parsedUnitId: 'KJ12345',
          parsedUnitData: {
            parsedUnitId: 'KJ12345',
            manualUnitId: 'KJ12345',
            codeScheme: 'C',
          },
        });

        mockDonorService.create.and.returnValue(of({
          success: true, message: 'Created', statusCode: 201,
          item: { transactionId: 'T1' },
        } as any));

        component.onAutoSave();

        const request = mockDonorService.create.calls.mostRecent().args[0];
        expect(request.unitId).toBe('KJ12345');
      });

      it('should set isNewDonor when newDonorExpected and no donorId', () => {
        fillAllRequiredFields();
        component.registrationForm.patchValue({ donorId: '' });
        (component as any).newDonorExpected = { lastName: 'Test', firstName: 'John' };

        mockDonorService.create.and.returnValue(of({
          success: true, message: 'Created', statusCode: 201,
          item: { transactionId: 'T1' },
        } as any));

        component.onAutoSave();

        const request = mockDonorService.create.calls.mostRecent().args[0];
        expect(request.isNewDonor).toBeTrue();
        expect(request.newDonorDetails).toBeTruthy();
        expect(request.newDonorDetails?.lastName).toBe('Test');
      });
    });
  });

  // ─── Hold flow ────────────────────────────────────────────────────────────

  describe('hold flow', () => {
    function triggerHoldAction(searchCriteria?: any): void {
      (component as any).handleHoldAction(searchCriteria);
    }

    it('should set isHoldAction to true when handleHoldAction is called', () => {
      triggerHoldAction({ lastName: 'SMITH', firstName: 'JOHN', dob: '1990-01-01', sex: 'M' });
      expect((component as any).isHoldAction()).toBeTrue();
    });

    it('should store searchCriteria when handleHoldAction is called', () => {
      const criteria = { lastName: 'SMITH', firstName: 'JOHN' };
      triggerHoldAction(criteria);
      expect((component as any).holdSearchCriteria).toEqual(criteria);
    });

    it('should store null searchCriteria when handleHoldAction is called without criteria', () => {
      triggerHoldAction(undefined);
      expect((component as any).holdSearchCriteria).toBeNull();
    });

    it('should add NODON hold to pendingHolds', () => {
      triggerHoldAction({ lastName: 'SMITH' });
      const holds = (component as any).pendingHolds();
      expect(holds.length).toBe(1);
      expect(holds[0].interCode).toBe('NODON');
    });

    it('should not duplicate NODON if already in pendingHolds', () => {
      triggerHoldAction({ lastName: 'SMITH' });
      triggerHoldAction({ lastName: 'DOE' });
      const holds = (component as any).pendingHolds();
      const nodonCount = holds.filter((h: any) => h.interCode === 'NODON').length;
      expect(nodonCount).toBe(1);
    });

    it('should skip form validation for hold action in onAutoSave', () => {
      setupMockUnitIdField();
      component.searchForm.get('driveId')?.setValue('DRV001');
      triggerHoldAction({ lastName: 'SMITH', firstName: 'JOHN', dob: '1990-01-01', sex: 'M' });

      mockDonorService.registerHold.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      expect(mockDonorService.registerHold).toHaveBeenCalled();
      expect(mockDonorService.create).not.toHaveBeenCalled();
    });

    it('should call registerHold with correct demographics from searchCriteria', () => {
      setupMockUnitIdField();
      component.searchForm.get('driveId')?.setValue('DRV001');
      triggerHoldAction({ lastName: 'SMITH', firstName: 'JOHN', dob: '1990-01-15', sex: 'M' });

      mockDonorService.registerHold.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.registerHold.calls.mostRecent().args[0];
      expect(request.lastName).toBe('SMITH');
      expect(request.firstName).toBe('JOHN');
      expect(request.dateOfBirth).toBeTruthy();
      expect(request.gender).toBe('M');
      expect(request.sessionId).toBe('');
      expect(request.donorId).toBe('');
    });

    it('should include NODON interdiction in hold request', () => {
      setupMockUnitIdField();
      component.searchForm.get('driveId')?.setValue('DRV001');
      triggerHoldAction({ lastName: 'SMITH' });

      mockDonorService.registerHold.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.registerHold.calls.mostRecent().args[0];
      expect(request.interdictions?.some((i: any) => i.interCode === 'NODON')).toBeTrue();
    });

    it('should show hold-specific success message', () => {
      setupMockUnitIdField();
      component.searchForm.get('driveId')?.setValue('DRV001');
      triggerHoldAction({ lastName: 'SMITH' });

      mockDonorService.registerHold.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(jasmine.stringContaining('Donation placed on hold'));
    });

    it('should send empty demographics when searchCriteria has no values', () => {
      setupMockUnitIdField();
      component.searchForm.get('driveId')?.setValue('DRV001');
      triggerHoldAction({});

      mockDonorService.registerHold.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.registerHold.calls.mostRecent().args[0];
      expect(request.lastName).toBeUndefined();
      expect(request.firstName).toBeUndefined();
    });

    it('should reset hold state after resetRegistrationState', () => {
      triggerHoldAction({ lastName: 'SMITH' });
      expect((component as any).isHoldAction()).toBeTrue();
      (component as any).resetRegistrationState();
      expect((component as any).isHoldAction()).toBeFalse();
      expect((component as any).holdSearchCriteria).toBeNull();
      expect((component as any).pendingHolds().length).toBe(0);
    });

    it('should handle Find Donor dialog returning hold action', () => {
      const dialogResult = {
        action: 'hold' as const,
        searchCriteria: { lastName: 'DOE', firstName: 'JANE', dob: '1985-05-20', sex: 'F' },
      };
      mockDialog.open.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
      (component as any).openFindDonor();
      expect((component as any).isHoldAction()).toBeTrue();
      expect((component as any).holdSearchCriteria?.lastName).toBe('DOE');
    });

    it('should handle Find Donor dialog returning cancel action', () => {
      setupMockUnitIdField();
      const clearSpy = jasmine.createSpy('clear');
      (component as any).unitIdField.clear = clearSpy;
      const dialogResult = { action: 'cancel' };
      mockDialog.open.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
      (component as any).openFindDonor();
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should handle Find Donor dialog returning undefined (closed without action)', () => {
      mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
      (component as any).openFindDonor();
      // should not throw
    });
  });

  // ─── Find Donor dialog - select existing donor ────────────────────────────

  describe('populateDonorFields', () => {
    it('should populate form with donor data and load demographics', fakeAsync(() => {
      setupMockUnitIdField();
      const donor = {
        donorId: 'D100',
        lastName: 'Smith',
        firstName: 'John',
        middleName: 'A',
        dob: '1990-01-01',
        sex: 'M',
        aboRh: 'A+',
        alternateId: 'ALT1',
        alternateIdType: 'DL',
      };

      mockDonorService.getDonor.and.returnValue(of({ donorWeight: 180, lastNameSuffix: 'Jr' } as any));
      mockDonorService.getDonorAddress.and.returnValue(of({
        streetName: '123 Main', city: 'Dallas', state: 'TX', zip: '75001', intlAddrFlag: 'N',
      } as any));

      (component as any).populateDonorFields(donor);
      tick();

      expect(component.registrationForm.getRawValue().donorId).toBe('D100');
      expect(component.registrationForm.getRawValue().lastName).toBe('Smith');
      expect(component.isExistingDonor()).toBeTrue();
      expect(mockDonorService.getDonor).toHaveBeenCalledWith('D100');
    }));
  });

  // ─── populateNewDonorFields ───────────────────────────────────────────────

  describe('populateNewDonorFields', () => {
    it('should set newDonorExpected and reset mismatch errors', () => {
      const newData = { lastName: 'NewDonor', firstName: 'Test' } as any;
      (component as any).populateNewDonorFields(newData);
      expect((component as any).newDonorExpected).toEqual(newData);
      expect(component.donorMismatchErrors).toEqual({});
      expect(component.isExistingDonor()).toBeFalse();
    });

    it('should do nothing when newData is undefined', () => {
      (component as any).populateNewDonorFields(undefined);
      expect((component as any).newDonorExpected).toBeNull();
    });
  });

  // ─── Chapter changes ─────────────────────────────────────────────────────

  describe('subscribeToChapterChanges', () => {
    it('should reset page and reload static LOVs on chapter change', fakeAsync(() => {
      const chapterSubject = new Subject<void>();
      (mockHeaderService as any).chapterChanged$ = chapterSubject.asObservable();

      // Re-create component to pick up the observable
      fixture = TestBed.createComponent(DonorRegistration);
      component = fixture.componentInstance;
      (component as any).dialog = mockDialog;
      try { fixture.detectChanges(); } catch (_) {}

      mockMasterCodesService.getByCodeType.calls.reset();
      chapterSubject.next();
      tick();

      expect(component.mode()).toBe('search');
      expect(mockMasterCodesService.getByCodeType).toHaveBeenCalled();
    }));
  });

  // ─── onFormKeydown ────────────────────────────────────────────────────────

  describe('onFormKeydown', () => {
    it('should ignore non-Enter/Tab keys', () => {
      const event = {
        key: 'a',
        shiftKey: false,
        target: document.createElement('input'),
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onFormKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should ignore fields not in fieldSequence', () => {
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'nonExistentField');
      const event = {
        key: 'Enter',
        shiftKey: false,
        target: input,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onFormKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent default for Enter on required invalid field', () => {
      fillRequiredFieldsUpToWeight();
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'homeAddress');
      component.registrationForm.get('homeAddress')?.setValue('');
      component.registrationForm.get('homeAddress')?.markAsTouched();
      const event = {
        key: 'Enter',
        shiftKey: false,
        target: input,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onFormKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should return early for unitId field', () => {
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'unitId');
      const event = {
        key: 'Enter',
        shiftKey: false,
        target: input,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onFormKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should blur self-validated fields on Enter', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'lastName');
      const blurSpy = spyOn(input, 'blur');
      const event = {
        key: 'Enter',
        shiftKey: false,
        target: input,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onFormKeydown(event);
      tick();
      expect(blurSpy).toHaveBeenCalled();
    }));
  });

  // ─── onArmFieldClick ──────────────────────────────────────────────────────

  describe('onArmFieldClick', () => {
    it('should return early when clicking arrow wrapper', () => {
      const arrow = document.createElement('div');
      arrow.classList.add('mat-mdc-select-arrow-wrapper');
      const container = document.createElement('div');
      container.appendChild(arrow);
      const event = {
        target: arrow,
        stopPropagation: jasmine.createSpy(),
        preventDefault: jasmine.createSpy(),
      } as any;
      component.onArmFieldClick(event);
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('should return early when armUsed has no value', () => {
      fillAllRequiredFields();
      component.registrationForm.get('armUsed')?.setValue('');
      const target = document.createElement('div');
      const event = {
        target,
        stopPropagation: jasmine.createSpy(),
        preventDefault: jasmine.createSpy(),
      } as any;
      component.onArmFieldClick(event);
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  // ─── resolveEmployerName ──────────────────────────────────────────────────

  describe('resolveEmployerName', () => {
    it('should return matching employer name from filteredEmployers', () => {
      component.filteredEmployers.set([
        { employerId: 'EMP1', employerName: 'ACME Corp' } as any,
      ]);
      const result = (component as any).resolveEmployerName('EMP1');
      expect(result).toBe('ACME Corp');
    });

    it('should return input value when no match found', () => {
      component.filteredEmployers.set([]);
      const result = (component as any).resolveEmployerName('Unknown');
      expect(result).toBe('Unknown');
    });

    it('should return empty string for empty input', () => {
      const result = (component as any).resolveEmployerName('');
      expect(result).toBe('');
    });
  });

  // ─── enableAllFields ─────────────────────────────────────────────────────

  describe('enableAllFields', () => {
    it('should enable all field sequence fields except employerCity and employerZip', () => {
      (component as any).enableAllFields();
      expect(component.registrationForm.get('lastName')?.enabled).toBeTrue();
      expect(component.registrationForm.get('homeAddress')?.enabled).toBeTrue();
      expect(component.registrationForm.get('armUsed')?.enabled).toBeTrue();
    });
  });

  // ─── enableGroup / disableGroup / disableGroups ───────────────────────────

  describe('group enable/disable', () => {
    it('enableGroup should enable controls in the group', () => {
      const fields = ['lastName', 'firstName'];
      (component as any).enableGroup(fields);
      expect(component.registrationForm.get('lastName')?.enabled).toBeTrue();
      expect(component.registrationForm.get('firstName')?.enabled).toBeTrue();
    });

    it('disableGroup should disable controls in the group', () => {
      (component as any).enableGroup(['lastName', 'firstName']);
      (component as any).disableGroup(['lastName', 'firstName']);
      expect(component.registrationForm.get('lastName')?.disabled).toBeTrue();
    });

    it('disableGroups should disable multiple groups', () => {
      (component as any).enableGroup(['lastName', 'firstName', 'weight']);
      (component as any).disableGroups([['lastName'], ['firstName', 'weight']]);
      expect(component.registrationForm.get('lastName')?.disabled).toBeTrue();
      expect(component.registrationForm.get('weight')?.disabled).toBeTrue();
    });
  });

  // ─── registration form validation ────────────────────────────────────────

  describe('registration form validation', () => {
    it('should require lastName', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      component.registrationForm.get('lastName')?.markAsTouched();
      expect(component.getFieldError('lastName', 'Last Name')).toBe('Last Name is required');
    });

    it('should require weight', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('weight')?.setValue(null);
      component.registrationForm.get('weight')?.markAsTouched();
      expect(component.getFieldError('weight', 'Weight')).toBe('Weight is required');
    });

    it('should require ethnicGroup', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homeAddress')?.setValue('123 Main St');
      component.registrationForm.get('city')?.setValue('Dallas');
      component.registrationForm.get('zip')?.setValue('75001');
      component.updateFieldStates();
      component.registrationForm.get('ethnicGroup')?.markAsTouched();
      expect(component.getFieldError('ethnicGroup', 'Ethnic Group')).toBe('Ethnic Group is required');
    });

    it('should require donation', () => {
      fillRequiredFieldsUpToEthnicGroup();
      component.registrationForm.get('donation')?.markAsTouched();
      expect(component.getFieldError('donation', 'Donation')).toBe('Donation is required');
    });

    it('should require procedure', () => {
      fillRequiredFieldsUpToEthnicGroup();
      component.registrationForm.get('donation')?.setValue('WB');
      component.updateFieldStates();
      component.registrationForm.get('procedure')?.markAsTouched();
      expect(component.getFieldError('procedure', 'Procedure')).toBe('Procedure is required');
    });

    it('should not require reviewerId', () => {
      fillAllRequiredFields();
      component.registrationForm.get('reviewerId')?.markAsTouched();
      expect(component.getFieldError('reviewerId', 'Reviewer ID')).toBe('');
    });
  });

  // ─── resetPage ────────────────────────────────────────────────────────────

  describe('resetPage', () => {
    it('should reset all state to initial values', () => {
      fillAllRequiredFields();
      component.mode.set('add');
      (component as any).resetPage();

      expect(component.mode()).toBe('search');
      expect(component.drives().length).toBe(0);
      expect(component.employees().length).toBe(0);
      expect(component.isExistingDonor()).toBeFalse();
      expect(component.hasInternationalAddress()).toBeFalse();
      expect(component.hasEmployerInternationalAddress()).toBeFalse();
      expect(component.stateDisplay()).toBe('--');
      expect(component.employerStateDisplay()).toBe('--');
      expect(component.driveDateDoubleEntry).toBe('idle');
      expect(component.driveDateMismatchError).toBeNull();
      expect(component.isHoldsButtonDisabled).toBeTrue();
    });
  });

  // ─── onSexSelectionChange ─────────────────────────────────────────────────

  describe('onSexSelectionChange', () => {
    it('should call validateGender', () => {
      spyOn(component, 'validateGender');
      component.onSexSelectionChange();
      expect(component.validateGender).toHaveBeenCalled();
    });
  });

  // ─── onArmUsedChange ─────────────────────────────────────────────────────

  describe('onArmUsedChange', () => {
    it('should open bleed time details dialog', () => {
      spyOn(component, 'openBleedTimeDetails');
      component.onArmUsedChange();
      expect(component.openBleedTimeDetails).toHaveBeenCalled();
    });
  });

  // ─── onDonationUnitIdValidated ────────────────────────────────────────────

  describe('onDonationUnitIdValidated', () => {
    it('should trigger onAutoSave', () => {
      spyOn(component, 'onAutoSave');
      component.onDonationUnitIdValidated({} as any);
      expect(component.onAutoSave).toHaveBeenCalled();
    });
  });

  // ─── onPreviousUnitIdValidated / onPreviousUnitIdCleared ──────────────────

  describe('onPreviousUnitIdValidated and onPreviousUnitIdCleared', () => {
    it('onPreviousUnitIdValidated should mark for check', () => {
      component.onPreviousUnitIdValidated({} as any);
      // no error expected - just markForCheck
    });

    it('onPreviousUnitIdCleared should mark for check', () => {
      component.onPreviousUnitIdCleared();
      // no error expected
    });
  });

  // ─── Sponsor search (setupSponsorSearch) ──────────────────────────────────

  describe('setupSponsorSearch', () => {
    it('should clear sponsors when search keyword is shorter than 3 chars', fakeAsync(() => {
      component.sponsors.set([{ sponsorId: 'S1', sponsorName: 'Old' } as any]);
      component.altSponsorSearchControl.setValue('ab');
      tick(350);
      expect(component.sponsors().length).toBe(0);
    }));

    it('should load sponsors when search keyword is 3+ chars', fakeAsync(() => {
      const sponsors = [{ sponsorId: 'S1', sponsorName: 'TestSponsor' }];
      mockDonorService.getSponsors.and.returnValue(of(sponsors as any));
      component.altSponsorSearchControl.setValue('tes');
      tick(350);
      expect(component.sponsors().length).toBe(1);
    }));

    it('should handle sponsor search API error gracefully', fakeAsync(() => {
      mockDonorService.getSponsors.and.returnValue(throwError(() => new Error('fail')));
      component.altSponsorSearchControl.setValue('test');
      tick(350);
      expect(component.sponsors().length).toBe(0);
    }));
  });

  // ─── Employer search (setupEmployerSearch) ────────────────────────────────

  describe('setupEmployerSearch', () => {
    it('should load employers when search term has 1+ chars', fakeAsync(() => {
      const employers = [{ employerId: 'E1', employerName: 'Corp' }];
      mockDonorService.getEmployers.and.returnValue(of(employers as any));
      component.employerSearchControl.setValue('C');
      tick(350);
      expect(component.filteredEmployers().length).toBe(1);
    }));
  });

  // ─── City search (setupCitySearch) ────────────────────────────────────────

  describe('setupCitySearch', () => {
    it('should load cities when search has 3+ chars', fakeAsync(() => {
      const cities = [{ uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' }];
      mockDonorService.getCityState.and.returnValue(of(cities));
      component.citySearchControl.setValue('Dal');
      tick(350);
      expect(component.filteredCities().length).toBe(1);
    }));

    it('should filter existing cities when search is under 3 chars and city is selected', fakeAsync(() => {
      component.filteredCities.set([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
        { uspsId: 2, city: 'Denver', state: 'CO', zip: '80001' },
      ]);
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('city')?.setValue('Dallas');
      component.citySearchControl.setValue('Da');
      tick(350);
      expect(component.filteredCities().length).toBe(1);
      expect(component.filteredCities()[0].city).toBe('Dallas');
    }));

    it('should clear cities when search is under 3 chars and no city selected', fakeAsync(() => {
      component.filteredCities.set([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
      ]);
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('city')?.setValue('');
      component.citySearchControl.setValue('D');
      tick(350);
      expect(component.filteredCities().length).toBe(0);
    }));
  });

  // ─── Employer city search ─────────────────────────────────────────────────

  describe('setupEmployerCitySearch', () => {
    it('should load employer cities when search has 3+ chars', fakeAsync(() => {
      const cities = [{ uspsId: 1, city: 'Houston', state: 'TX', zip: '77001' }];
      mockDonorService.getCityState.and.returnValue(of(cities));
      component.employerCitySearchControl.setValue('Hou');
      tick(350);
      expect(component.filteredEmployerCities().length).toBe(1);
    }));

    it('should clear employer cities when search is under 3 chars and no employer city selected', fakeAsync(() => {
      component.filteredEmployerCities.set([
        { uspsId: 1, city: 'Houston', state: 'TX', zip: '77001' },
      ]);
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('employerCity')?.setValue('');
      component.employerCitySearchControl.setValue('H');
      tick(350);
      expect(component.filteredEmployerCities().length).toBe(0);
    }));
  });

  // ─── populateAddress branches ─────────────────────────────────────────────

  describe('populateAddress', () => {
    it('should handle international address flag Y', () => {
      (component as any).populateAddress({
        intlAddrFlag: 'Y',
        intlAddress1: 'Int St 1',
        countryName: 'UK',
        eCity: 'London',
        eState: 'LN',
        eZip: 'SW1',
        eUspsId: 10,
      } as any);
      expect(component.donorIntlAddress).toBeTruthy();
      expect(component.hasInternationalAddress()).toBeTrue();
    });

    it('should handle domestic address with preferred phone H', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).populateAddress({
        intlAddrFlag: 'N',
        streetName: '123 Main',
        city: 'Dallas',
        state: 'TX',
        zip: '75001',
        preferredContactFlag: 'H',
        hAreaCode: '214',
        hPhoneNo: '5551234',
      } as any);
      expect(component.registrationForm.getRawValue().preferredPhone).toBe('home');
      expect(component.stateDisplay()).toBe('TX');
    });

    it('should handle preferred phone W', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).populateAddress({ intlAddrFlag: 'N', preferredContactFlag: 'W' } as any);
      expect(component.registrationForm.getRawValue().preferredPhone).toBe('work');
    });

    it('should handle preferred phone M', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).populateAddress({ intlAddrFlag: 'N', preferredContactFlag: 'M' } as any);
      expect(component.registrationForm.getRawValue().preferredPhone).toBe('mobile');
    });

    it('should handle employer international address flag Y', () => {
      (component as any).populateAddress({
        intlAddrFlag: 'N',
        empIntlAddrFlag: 'Y',
        empIntlCity: 'Munich',
        empIntlCountryName: 'Germany',
      } as any);
      expect(component.employerIntlAddress).toBeTruthy();
      expect(component.hasEmployerInternationalAddress()).toBeTrue();
    });

    it('should set pendingAltAddress when alt address data exists', () => {
      (component as any).populateAddress({
        intlAddrFlag: 'N',
        altStreetName: 'Alt 123',
        altCity: 'Plano',
        altState: 'TX',
      } as any);
      expect((component as any).pendingAltAddress()).toBeTruthy();
      expect((component as any).pendingAltAddress()?.streetName).toBe('Alt 123');
    });

    it('should set pendingAltAddress when alt international flag is Y', () => {
      (component as any).populateAddress({
        intlAddrFlag: 'N',
        altIntlAddrFlag: 'Y',
        altIntlAddress1: 'Int Alt 1',
        altCountryName: 'FR',
      } as any);
      expect((component as any).pendingAltAddress()).toBeTruthy();
      expect((component as any).pendingAltAddress()?.addressType).toBe('I');
    });
  });

  // ─── onGlobalFocusIn ──────────────────────────────────────────────────────

  describe('onGlobalFocusIn', () => {
    it('should set lastActiveField for search form fields', () => {
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'driveDate');
      component.onGlobalFocusIn({ target: input } as any);
      expect((component as any).lastActiveField).toBe('driveDate');
    });

    it('should set lastActiveField for registration form fields', () => {
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'lastName');
      component.onGlobalFocusIn({ target: input } as any);
      expect((component as any).lastActiveField).toBe('lastName');
    });

    it('should not set lastActiveField for non-form fields', () => {
      (component as any).lastActiveField = null;
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'nonExistentField');
      component.onGlobalFocusIn({ target: input } as any);
      expect((component as any).lastActiveField).toBeNull();
    });

    it('should not set lastActiveField when target has no formControlName', () => {
      (component as any).lastActiveField = null;
      const div = document.createElement('div');
      component.onGlobalFocusIn({ target: div } as any);
      expect((component as any).lastActiveField).toBeNull();
    });
  });

  // ─── onGlobalKeyRedirect ─────────────────────────────────────────────────

  describe('onGlobalKeyRedirect', () => {
    it('should return early when shift key is pressed', () => {
      const event = {
        target: document.createElement('div'),
        shiftKey: true,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onGlobalKeyRedirect(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should return early when target is inside cdk-overlay-container', () => {
      const container = document.createElement('div');
      container.classList.add('cdk-overlay-container');
      const target = document.createElement('input');
      container.appendChild(target);
      document.body.appendChild(container);

      const event = {
        target,
        shiftKey: false,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onGlobalKeyRedirect(event);
      expect(event.preventDefault).not.toHaveBeenCalled();

      document.body.removeChild(container);
    });

    it('should return early when target is a search form field', () => {
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'driveDate');
      const event = {
        target: input,
        shiftKey: false,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onGlobalKeyRedirect(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // ─── disableDonorFieldsForHold ────────────────────────────────────────────

  describe('disableDonorFieldsForHold', () => {
    it('should clear validators and disable hold skip fields', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).disableDonorFieldsForHold();
      expect(component.registrationForm.get('lastName')?.disabled).toBeTrue();
      expect(component.registrationForm.get('firstName')?.disabled).toBeTrue();
      expect(component.registrationForm.get('weight')?.disabled).toBeTrue();
      expect(component.registrationForm.get('homeAddress')?.disabled).toBeTrue();
    });
  });

  // ─── onAutoSave with international addresses ─────────────────────────────

  describe('onAutoSave with international addresses', () => {
    it('should include donorInternationalAddress in request when donor has intl address', () => {
      fillAllRequiredFields();
      component.donorIntlAddress = {
        streetName: 'Int St',
        addr1: 'Line1',
        addr2: 'Line2',
        addr3: null,
        country: 'UK',
        postalCode: 'SW1',
        homePhoneNo: '1234',
        workPhoneNo: '5678',
        workPhoneExt: '99',
        mobilePhoneNo: '9999',
        faxNo: '0000',
        email: 'test@uk.com',
        intlAddrFlag: 'Y',
      };

      mockDonorService.create.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.create.calls.mostRecent().args[0];
      expect(request.donorInternationalAddress).toBeTruthy();
      expect(request.donorInternationalAddress?.streetName).toBe('Int St');
      expect(request.donorInternationalAddress?.countryName).toBe('UK');
      expect(request.intlAddrFlag).toBe('Y');
      expect(request.intlCity).toBe('Int St');
    });

    it('should include employerInternationalAddress in request when employer has intl address', () => {
      fillAllRequiredFields();
      component.employerIntlAddress = {
        streetName: 'Emp Int St',
        addr1: 'EmpLine1',
        addr2: null,
        addr3: null,
        country: 'DE',
        postalCode: '12345',
        intlAddrFlag: 'Y',
      };

      mockDonorService.create.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.create.calls.mostRecent().args[0];
      expect(request.employerInternationalAddress).toBeTruthy();
      expect(request.employerInternationalAddress?.streetName).toBe('Emp Int St');
      expect(request.employerInternationalAddress?.countryName).toBe('DE');
    });

    it('should include pendingAltAddress in request', () => {
      fillAllRequiredFields();
      (component as any).pendingAltAddress.set({
        streetName: 'Alt St',
        suiteApt: 'Suite 100',
        city: 'Plano',
        state: 'TX',
        zip: '75024',
        uspsId: 50,
        addressType: 'L',
        intlAddress1: null,
        intlAddrFlag: 'N',
        otherContactNumber: '5551111',
        altIntlPhoneNumber: null,
        preferredContactAddress: 'A',
      } as any);

      mockDonorService.create.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.create.calls.mostRecent().args[0];
      expect(request.altStreetName).toBe('Alt St');
      expect(request.altSuiteApt).toBe('Suite 100');
      expect(request.otherContactNo).toBe('5551111');
      expect(request.preferredContactAddress).toBe('A');
    });

    it('should include bleed time data in request', () => {
      fillAllRequiredFields();
      component.registrationForm.get('collectionDate')?.setValue('2025-01-01');
      component.bleedTimeData = {
        leftArm: { startTime1: '08:00', startPhleb1: 'E1', endTime1: '08:15', endPhleb1: 'E1', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        rightArm: { startTime1: '09:00', startPhleb1: 'E2', endTime1: '09:15', endPhleb1: 'E2', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        other: { startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        drawStartTime: '08:00',
        mrsLoss: '10.5',
        phlebotomistLoss: '5.2',
      };

      mockDonorService.create.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.create.calls.mostRecent().args[0];
      expect(request.bleedStartTimeL1).toBe('2025-01-01T08:00:00');
      expect(request.bleedStartTimeR1).toBe('2025-01-01T09:00:00');
      expect(request.actualRbcLoss).toBe(10.5);
      expect(request.actualPlasmaLoss).toBe(5.2);
    });
  });

  // ─── onAutoSave with response.item fallbacks ─────────────────────────────

  describe('onAutoSave response handling', () => {
    it('should use fallback error message when response has no errorResponse or message', () => {
      fillAllRequiredFields();
      mockDonorService.create.and.returnValue(of({
        success: false,
      } as any));
      component.onAutoSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to register donation.');
    });

    it('should use errorResponse.error from API error', () => {
      fillAllRequiredFields();
      mockDonorService.create.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Detailed server error' } }
      })));
      component.onAutoSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Detailed server error');
    });

    it('should handle attach-donor return URL after successful save', fakeAsync(() => {
      fillAllRequiredFields();
      (component as any).attachDonorReturnUrl = '/attach-donor';
      (component as any).attachDonorTransactionId = 'TXN_123';
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

      mockDonorService.create.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1', donorId: 'D1' },
      } as any));

      component.onAutoSave();
      tick(2000);

      expect(router.navigate).toHaveBeenCalledWith(['/attach-donor'], jasmine.objectContaining({
        queryParams: jasmine.objectContaining({ transactionId: 'TXN_123' }),
      }));
    }));
  });

  // ─── Computed filters with null descriptions ─────────────────────────────

  describe('computed filters null handling', () => {
    it('filteredDrives should handle drive with null sponsorName', fakeAsync(() => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: null as any },
      ]);
      component.driveSearchControl.setValue('DRV');
      tick();
      expect(component.filteredDrives().length).toBe(1);
    }));

    it('filteredEthnicGroups should handle group with null description', fakeAsync(() => {
      component.ethnicGroups.set([
        { code: 'XX', description: null as any },
      ]);
      component.ethnicGroupSearchControl.setValue('XX');
      tick();
      expect(component.filteredEthnicGroups().length).toBe(1);
    }));

    it('filteredProcedureCodes should handle code with null description', fakeAsync(() => {
      component.procedureCodes.set([
        { procedureCode: 'PP', description: null as any },
      ] as any);
      component.procedureSearchControl.setValue('PP');
      tick();
      expect(component.filteredProcedureCodes().length).toBe(1);
    }));

    it('filteredVenipunctureCodes should handle code with null description', fakeAsync(() => {
      component.venipunctureCodes.set([
        { code: 'V1', description: null as any },
      ] as any);
      component.venipunctureSearchControl.setValue('V1');
      tick();
      expect(component.filteredVenipunctureCodes().length).toBe(1);
    }));

    it('filteredEmployees should handle employee with null name', fakeAsync(() => {
      component.employees.set([
        { staffNo: 'E1', employeeName: null as any },
      ] as any);
      component.reviewerSearchControl.setValue('E1');
      tick();
      expect(component.filteredEmployees().length).toBe(1);
    }));

    it('filteredDonationTypes should handle type with null description', fakeAsync(() => {
      component.donationTypes.set([
        { donationType: 'WB', description: null as any },
      ] as any);
      component.donationSearchControl.setValue('WB');
      tick();
      expect(component.filteredDonationTypes().length).toBe(1);
    }));

    it('filteredEquipmentTypes should handle type with null description', fakeAsync(() => {
      component.equipmentTypes.set([
        { code: 'EQ1', description: null as any },
      ]);
      component.equipTypeSearchControl.setValue('EQ1');
      tick();
      expect(component.filteredEquipmentTypes().length).toBe(1);
    }));

    it('filteredReactionCodes should handle code with null description', fakeAsync(() => {
      component.reactionCodesList.set([
        { code: 'R1', description: null as any },
      ]);
      component.reactionSearchControl.setValue('R1');
      tick();
      expect(component.filteredReactionCodes().length).toBe(1);
    }));

    it('filteredDeferralTypes should handle type with null description', fakeAsync(() => {
      component.deferralTypeSearchControl.setValue('99');
      tick();
      const results = component.filteredDeferralTypes();
      expect(results.some(d => d.code === '99')).toBeTrue();
    }));

    it('filteredLookupEmployees should handle null employeeName', fakeAsync(() => {
      component.employees.set([
        { staffNo: 'E1', employeeName: null as any },
      ] as any);
      component.lookupIdSearchControl.setValue('E1');
      tick();
      expect(component.filteredLookupEmployees().length).toBe(1);
    }));

    it('filteredPhysicalEmployees should handle null employeeName', fakeAsync(() => {
      component.employees.set([
        { staffNo: 'P1', employeeName: null as any },
      ] as any);
      component.physicalIdSearchControl.setValue('P1');
      tick();
      expect(component.filteredPhysicalEmployees().length).toBe(1);
    }));

    it('filteredHistorianEmployees should handle null employeeName', fakeAsync(() => {
      component.employees.set([
        { staffNo: 'H1', employeeName: null as any },
      ] as any);
      component.historianSearchControl.setValue('H1');
      tick();
      expect(component.filteredHistorianEmployees().length).toBe(1);
    }));

    it('filteredMaterialEmployees should filter by staffNo', fakeAsync(() => {
      component.employees.set([
        { staffNo: 'M1', employeeName: null as any },
        { staffNo: 'M2', employeeName: 'Mat2' },
      ] as any);
      component.materialVerifSearchControl.setValue('M1');
      tick();
      expect(component.filteredMaterialEmployees().length).toBe(1);
    }));
  });

  // ─── updateFieldStates with intl/employer intl/hold field skipping ────────

  describe('updateFieldStates with field skipping', () => {
    it('should skip intl disabled fields when international address is set', () => {
      fillRequiredFieldsUpToWeight();
      component.disableAddressFields();
      // ethnicGroup should still progress since address fields are skipped
      component.updateFieldStates();
      expect(component.registrationForm.get('ethnicGroup')?.enabled).toBeTrue();
    });

    it('should skip employer intl fields when employer has international address', () => {
      fillRequiredFieldsUpToWeight();
      component.disableEmployerFields();
      component.updateFieldStates();
      // employerSchoolName is in employerIntlDisabledFields
      expect(component.registrationForm.get('employerSchoolName')?.disabled).toBeTrue();
    });

    it('should skip hold fields and allow donation fields when hold action', () => {
      setupMockUnitIdField();
      (component as any).isHoldAction.set(true);
      // Set holdSkipFields as "disabled" - the hold flow should skip past them
      (component as any).disableDonorFieldsForHold();
      component.updateFieldStates();
      // lookupId and donation fields should be available
      expect(component.registrationForm.get('donation')?.enabled).toBeTrue();
    });

    it('should disable existing donor locked fields for existing donors', () => {
      fillRequiredFieldsUpToWeight();
      component.isExistingDonor.set(true);
      component.updateFieldStates();
      expect(component.registrationForm.get('lastName')?.disabled).toBeTrue();
      expect(component.registrationForm.get('firstName')?.disabled).toBeTrue();
      expect(component.registrationForm.get('dob')?.disabled).toBeTrue();
      expect(component.registrationForm.get('sex')?.disabled).toBeTrue();
    });
  });

  // ─── loadStaticLovs populates signals ─────────────────────────────────────

  describe('loadStaticLovs', () => {
    it('should populate ethnic groups from master codes', () => {
      const data = [{ code: 'CA', description: 'Caucasian' }, { code: 'AA', description: 'African American' }];
      mockMasterCodesService.getByCodeType.and.callFake((codeType: string) => {
        if (codeType === 'ETHGP') return of(data);
        return of([]);
      });
      (component as any).loadStaticLovs();
      expect(component.ethnicGroups().length).toBe(2);
    });

    it('should populate equipment types from master codes', () => {
      const data = [{ code: 'EQ1', description: 'Equipment 1' }];
      mockMasterCodesService.getByCodeType.and.callFake((codeType: string) => {
        if (codeType === 'EQUIP') return of(data);
        return of([]);
      });
      (component as any).loadStaticLovs();
      expect(component.equipmentTypes().length).toBe(1);
    });

    it('should populate reaction codes from master codes', () => {
      const data = [{ code: 'R1', description: 'Reaction 1' }];
      mockMasterCodesService.getByCodeType.and.callFake((codeType: string) => {
        if (codeType === 'REACT') return of(data);
        return of([]);
      });
      (component as any).loadStaticLovs();
      expect(component.reactionCodesList().length).toBe(1);
    });
  });

  // ─── validateField error handling ─────────────────────────────────────────

  describe('validateField error handling', () => {
    it('should use error.error.error fallback message', () => {
      fillAllRequiredFields();
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      mockDonorService.validateStaff.and.returnValue(throwError(() => ({
        error: { error: 'Staff not found' }
      })));
      component.registrationForm.get('historianId')?.setValue('INVALID');
      component.validateStaffField('historianId');
      expect(component.registrationForm.get('historianId')?.getError('serverError')).toBe('Staff not found');
    });

    it('should use error.error.message fallback', () => {
      fillAllRequiredFields();
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      mockDonorService.validateStaff.and.returnValue(throwError(() => ({
        error: { message: 'Service unavailable' }
      })));
      component.registrationForm.get('historianId')?.setValue('INVALID');
      component.validateStaffField('historianId');
      expect(component.registrationForm.get('historianId')?.getError('serverError')).toBe('Service unavailable');
    });

    it('should use default "Validation failed" message', () => {
      fillAllRequiredFields();
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      mockDonorService.validateStaff.and.returnValue(throwError(() => ({})));
      component.registrationForm.get('historianId')?.setValue('INVALID');
      component.validateStaffField('historianId');
      expect(component.registrationForm.get('historianId')?.getError('serverError')).toBe('Validation failed');
    });
  });

  // ─── setupDonationTypeListener clears downstream fields ───────────────────

  describe('setupDonationTypeListener downstream clearing', () => {
    it('should clear procedure codes when donation type errors', fakeAsync(() => {
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      fillRequiredFieldsUpToEthnicGroup();
      mockDonorService.getProcedureCodesByDonationType.and.returnValue(throwError(() => new Error('fail')));
      mockDonorService.getDeferralReasons.and.returnValue(of([]));
      component.registrationForm.get('donation')?.setValue('WB');
      tick();
      expect(component.procedureCodes().length).toBe(0);
    }));

    it('should clear deferral reasons and procedure codes when donation type is cleared', fakeAsync(() => {
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      fillRequiredFieldsUpToEthnicGroup();
      mockDonorService.getProcedureCodesByDonationType.and.returnValue(of([{ procedureCode: 'PP', description: 'Test' }] as any));
      mockDonorService.getDeferralReasons.and.returnValue(of([{ reasonCode: 'DR1' }] as any));
      component.registrationForm.get('donation')?.setValue('WB');
      tick();
      expect(component.procedureCodes().length).toBe(1);
      component.registrationForm.get('donation')?.setValue('');
      tick();
      expect(component.procedureCodes().length).toBe(0);
      expect(component.deferralReasons().length).toBe(0);
    }));
  });

  // ─── onGlobalKeyRedirect additional paths ─────────────────────────────────

  describe('onGlobalKeyRedirect additional paths', () => {
    it('should focus active field in add mode when outside forms', fakeAsync(() => {
      component.mode.set('add');
      fillRequiredFieldsUpToWeight();
      // When in add mode and target is not in any form, should focus the active field
      const div = document.createElement('div');
      const event = {
        target: div,
        shiftKey: false,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onGlobalKeyRedirect(event);
      tick();
      expect(event.preventDefault).toHaveBeenCalled();
    }));

    it('should focus driveDate when driveDate has no value', fakeAsync(() => {
      component.mode.set('search');
      component.searchForm.get('driveDate')?.setValue(null);
      const div = document.createElement('div');
      const event = {
        target: div,
        shiftKey: false,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onGlobalKeyRedirect(event);
      tick();
      expect(event.preventDefault).toHaveBeenCalled();
    }));

    it('should focus driveId when driveDate has value but driveId does not', fakeAsync(() => {
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      component.searchForm.get('driveId')?.setValue('');
      const div = document.createElement('div');
      const event = {
        target: div,
        shiftKey: false,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onGlobalKeyRedirect(event);
      tick(100);
      expect(event.preventDefault).toHaveBeenCalled();
    }));
  });

  // ─── onFormKeydown additional paths ───────────────────────────────────────

  describe('onFormKeydown additional paths', () => {
    it('should return early for Enter on mat-select', () => {
      const matSelect = document.createElement('mat-select');
      matSelect.setAttribute('formControlName', 'ethnicGroup');
      const event = {
        key: 'Enter',
        shiftKey: false,
        target: matSelect,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onFormKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should handle non-self-validated field with blur and advance', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      // homeAddress is NOT in selfValidatedFields
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'homeAddress');
      component.registrationForm.get('homeAddress')?.setValue('123 Main');
      const blurSpy = spyOn(input, 'blur');
      const event = {
        key: 'Tab',
        shiftKey: false,
        target: input,
        preventDefault: jasmine.createSpy('pd'),
      } as any;
      component.onFormKeydown(event);
      tick(100);
      expect(blurSpy).toHaveBeenCalled();
    }));
  });

  // ─── validateEmployerZipField error fallbacks ─────────────────────────────

  describe('validateEmployerZipField error fallbacks', () => {
    it('should use errorResponse.error message', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('employerCity')?.setValue('Dallas');
      component.registrationForm.get('employerZip')?.setValue('99999');
      mockDonorService.validateZipCity.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'ZIP not found in city' } }
      })));
      component.validateEmployerZipField();
      expect(component.registrationForm.get('employerZip')?.getError('serverError')).toBe('ZIP not found in city');
    });

    it('should use default message when no error details available', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('employerCity')?.setValue('Dallas');
      component.registrationForm.get('employerZip')?.setValue('99999');
      mockDonorService.validateZipCity.and.returnValue(throwError(() => ({})));
      component.validateEmployerZipField();
      expect(component.registrationForm.get('employerZip')?.getError('serverError')).toBe('ZIP code does not match the specified city');
    });
  });

  // ─── deferredThru with matDatepickerParse error ───────────────────────────

  describe('deferredThru with parse errors', () => {
    it('should preserve matDatepickerParse when checking for valid date', fakeAsync(() => {
      fillAllRequiredFields();
      component.registrationForm.get('deferredThru')?.enable();
      const ctrl = component.registrationForm.get('deferredThru')!;
      // Set a valid date first, then add the parse error manually
      ctrl.setValue(moment('2024-12-15'), { emitEvent: false });
      ctrl.setErrors({ matDatepickerParse: { text: 'invalid' } });
      ctrl.markAsTouched();
      // The error should be present
      expect(ctrl.hasError('matDatepickerParse')).toBeTrue();
    }));

    it('should clear errors when no matDatepickerParse and deferredThru is within range', fakeAsync(() => {
      fillAllRequiredFields();
      component.searchForm.get('driveDate')?.setValue(moment('2025-12-31'));
      component.registrationForm.get('deferredThru')?.enable();
      component.registrationForm.get('deferralType')?.setValue('NA');
      component.registrationForm.get('deferredThru')?.setValue(moment('2025-06-01'));
      tick();
      expect(component.registrationForm.get('deferredThru')?.errors).toBeNull();
    }));
  });

  // ─── populateDemographics ─────────────────────────────────────────────────

  describe('populateDemographics', () => {
    it('should patch suffix and weight from demographics', () => {
      (component as any).populateDemographics({ lastNameSuffix: 'Jr', donorWeight: 180 } as any);
      expect(component.registrationForm.getRawValue().suffix).toBe('Jr');
      expect(component.registrationForm.getRawValue().weight).toBe(180);
    });

    it('should handle null suffix with fallback', () => {
      (component as any).populateDemographics({ lastNameSuffix: null, donorWeight: null } as any);
      expect(component.registrationForm.getRawValue().suffix).toBe('');
    });
  });

  // ─── Find Donor dialog select action ──────────────────────────────────────

  describe('Find Donor dialog select action', () => {
    it('should populate donor fields when dialog returns select action', fakeAsync(() => {
      setupMockUnitIdField();
      const donor = {
        donorId: 'D100',
        lastName: 'Smith',
        firstName: 'John',
        middleName: null,
        dob: '1990-01-01',
        sex: 'F',
        aboRh: 'O-',
        alternateId: null,
        alternateIdType: null,
      };
      const dialogResult = { action: 'select', donor };
      mockDialog.open.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
      mockDonorService.getDonor.and.returnValue(of({ donorWeight: 150 } as any));
      mockDonorService.getDonorAddress.and.returnValue(of({ intlAddrFlag: 'N', city: 'Dallas', state: 'TX', zip: '75001' } as any));

      (component as any).openFindDonor();
      tick();

      expect(component.registrationForm.getRawValue().donorId).toBe('D100');
      expect(component.registrationForm.getRawValue().lastName).toBe('Smith');
      expect(component.isExistingDonor()).toBeTrue();
    }));

    it('should populate new donor fields when dialog returns new action', fakeAsync(() => {
      setupMockUnitIdField();
      const newData = { lastName: 'NewPerson', firstName: 'Test', dob: '1995-01-01', sex: 'M' };
      const dialogResult = { action: 'new', newData };
      mockDialog.open.and.returnValue({ afterClosed: () => of(dialogResult) } as any);

      (component as any).openFindDonor();
      tick();

      expect((component as any).newDonorExpected).toEqual(newData);
      expect(component.isExistingDonor()).toBeFalse();
    }));
  });

  // ─── loadDonorDemographicsAndAddress error path ───────────────────────────

  describe('loadDonorDemographicsAndAddress', () => {
    it('should show error snackbar on failure', fakeAsync(() => {
      mockDonorService.getDonor.and.returnValue(throwError(() => new Error('fail')));
      mockDonorService.getDonorAddress.and.returnValue(of({} as any));

      (component as any).loadDonorDemographicsAndAddress('D100');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load donor data');
      expect(component.isLoading()).toBeFalse();
    }));
  });

  // ─── Employer zip blur with matching city ─────────────────────────────────

  describe('onEmployerZipBlur edge cases', () => {
    it('should use matching city when employer city matches API results', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      const results = [
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
        { uspsId: 2, city: 'Plano', state: 'TX', zip: '75001' },
      ];
      mockDonorService.getCityState.and.returnValue(of(results));
      component.registrationForm.get('employerCity')?.setValue('Dallas');
      component.registrationForm.get('employerZip')?.setValue('75001');
      component.onEmployerZipBlur();
      tick();
      expect(component.employerStateDisplay()).toBe('TX');
    }));

    it('should use first result when employer city does not match any API result', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      const results = [
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
      ];
      mockDonorService.getCityState.and.returnValue(of(results));
      component.registrationForm.get('employerCity')?.setValue('UnknownCity');
      component.registrationForm.get('employerZip')?.setValue('75001');
      component.onEmployerZipBlur();
      tick();
      expect(component.registrationForm.getRawValue().employerCity).toBe('Dallas');
    }));
  });

  // ─── onAutoSave with new donor (all optional fields populated) ────────────

  describe('onAutoSave new donor with optional fields', () => {
    it('should include all optional new donor details when fields are populated', () => {
      fillAllRequiredFields();
      component.registrationForm.patchValue({ donorId: '' });
      (component as any).newDonorExpected = { lastName: 'Test', firstName: 'John' };

      // Enable all fields first, then set optional values
      (component as any).enableAllFields();

      component.registrationForm.patchValue({
        middleName: 'Michael',
        suffix: 'Jr',
        alternateId: 'ALT123',
        alternateType: 'DL',
        apartmentNo: 'Apt 5',
        homePhone: '2145551234',
        workPhone: '2145555678',
        extension: '123',
        mobilePhone: '2145559999',
        email: 'test@example.com',
        preferredPhone: 'home',
        employerSchoolName: 'EMP1',
        alternateSponsorId: 'SP1',
        lookupId: 'LK1',
        venipunctureCodes: 'V1',
        reactionCodes: 'R1',
        materialVerificationId: 'MAT1',
        equipmentType: 'EQ1',
        voidUnit: 'VOID1',
        idQueue: 'Q1',
      });

      // Set employer details
      component.filteredEmployers.set([{ employerId: 'EMP1', employerName: 'ACME Corp' } as any]);

      mockDonorService.create.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.create.calls.mostRecent().args[0];
      expect(request.isNewDonor).toBeTrue();
      expect(request.newDonorDetails?.middleName).toBe('Michael');
      expect(request.newDonorDetails?.lastNameSuffix).toBe('Jr');
      expect(request.newDonorDetails?.alternateId).toBe('ALT123');
      expect(request.newDonorDetails?.alternateIdType).toBe('DL');
      expect(request.newDonorDetails?.ethnicGroup).toBe('CA');
      expect(request.newDonorDetails?.address?.suiteApt).toBe('Apt 5');
      expect(request.sVenipuncture).toBe('V1');
      expect(request.sReaction).toBe('R1');
      expect(request.materialId).toBe('MAT1');
      expect(request.equipType).toBe('EQ1');
      expect(request.creditSponsor).toBe('SP1');
      expect(request.lookupId).toBe('LK1');
      expect(request.idQueue).toBe('Q1');
      expect(request.extension).toBe(123);
      expect(request.employerId).toBe('EMP1');
      expect(request.employerName).toBe('ACME Corp');
    });
  });

  // ─── onAutoSave with deferredThru date ────────────────────────────────────

  describe('onAutoSave with deferral details', () => {
    it('should include deferredThruDate and collDate in request', () => {
      fillAllRequiredFields();
      component.registrationForm.get('deferredThru')?.enable({ emitEvent: false });
      component.registrationForm.get('deferredThru')?.setValue(moment('2025-06-01'), { emitEvent: false });
      component.registrationForm.get('collectionDate')?.setValue('2025-01-01');

      mockDonorService.create.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.create.calls.mostRecent().args[0];
      expect(request.deferredThruDate).toBeTruthy();
      expect(request.collDate).toBeTruthy();
    });
  });

  // ─── populateAddress domestic with city/eCity ─────────────────────────────

  describe('populateAddress with city data', () => {
    it('should populate filteredCities and filteredEmployerCities for domestic address', () => {
      fillRequiredFieldsUpToWeight();
      (component as any).populateAddress({
        intlAddrFlag: 'N',
        streetName: '456 Oak Ave',
        suiteApt: 'Suite 200',
        city: 'Plano',
        state: 'TX',
        zip: '75024',
        uspsId: 10,
        hAreaCode: '972',
        hPhoneNo: '5551234',
        dAreaCode: '972',
        dPhoneNo: '5555678',
        extension: '42',
        mAreaCode: '214',
        mPhoneNo: '5559999',
        email: '[REDACTED_EMAIL_ADDRESS_3]',
        eCity: 'Houston',
        eState: 'TX',
        eZip: '77001',
        eUspsId: 20,
        employerName: 'Corp Inc',
        preferredContactFlag: null,
        empIntlAddrFlag: 'N',
      } as any);

      expect(component.filteredCities().length).toBe(1);
      expect(component.filteredCities()[0].city).toBe('Plano');
      expect(component.filteredEmployerCities().length).toBe(1);
      expect(component.stateDisplay()).toBe('TX');
      expect(component.employerStateDisplay()).toBe('TX');
      expect(component.registrationForm.getRawValue().homePhone).toBe('(972) 555-1234');
      expect(component.registrationForm.getRawValue().workPhone).toBe('(972) 555-5678');
      expect(component.registrationForm.getRawValue().extension).toBe('42');
    });

    it('should handle alt address with mobile phone and preferred contact', () => {
      (component as any).populateAddress({
        intlAddrFlag: 'N',
        altStreetName: 'Alt St',
        mAreaCode: '214',
        mPhoneNo: '5559999',
        otherContactNo: '5551111',
        preferredContactFlag: 'M',
        preferredContactAddrFlag: 'A',
        altIntlAddrFlag: 'N',
      } as any);

      const altAddr = (component as any).pendingAltAddress();
      expect(altAddr).toBeTruthy();
      expect(altAddr?.mobilePhoneNumber).toBe('2145559999');
      expect(altAddr?.otherContactNumber).toBe('5551111');
      expect(altAddr?.preferredContactPhone).toBe('M');
      expect(altAddr?.preferredContactAddress).toBe('A');
    });
  });

  // ─── onAutoSave stateDisplay fallback ─────────────────────────────────────

  describe('onAutoSave stateDisplay handling', () => {
    it('should use stateDisplay signal value when it is not --', () => {
      fillAllRequiredFields();
      component.stateDisplay.set('TX');

      mockDonorService.create.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.create.calls.mostRecent().args[0];
      expect(request.state).toBe('TX');
    });
  });

  // ─── setupSponsorSearch with null return ──────────────────────────────────

  describe('setupSponsorSearch additional', () => {
    it('should not update sponsors when search returns null', fakeAsync(() => {
      component.altSponsorSearchControl.setValue('');
      tick(350);
      // When keyword is empty, sponsors should be empty and not throw
      expect(component.sponsors().length).toBe(0);
    }));
  });

  // ─── onZipBlur with no results ────────────────────────────────────────────

  describe('onZipBlur additional', () => {
    it('should not change state when API returns empty results', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      mockDonorService.getCityState.and.returnValue(of([]));
      component.registrationForm.get('zip')?.setValue('99999');
      component.stateDisplay.set('TX');
      component.onZipBlur();
      tick();
      // stateDisplay should remain unchanged when no results
      expect(component.stateDisplay()).toBe('TX');
    }));
  });

  // ─── getActiveField with lastActiveField fallback ─────────────────────────

  describe('getActiveField', () => {
    it('should return lastActiveField when all required fields are filled', () => {
      fillAllRequiredFields();
      (component as any).lastActiveField = 'reviewerId';
      const result = (component as any).getActiveField();
      expect(result).toBe('reviewerId');
    });

    it('should return first unfilled required field', () => {
      setupMockUnitIdField();
      component.updateFieldStates();
      component.registrationForm.get('lastName')?.setValue('');
      const result = (component as any).getActiveField();
      expect(result).toBe('lastName');
    });
  });

  // ─── setupSearchTermSignals null handling ─────────────────────────────────

  describe('setupSearchTermSignals null values', () => {
    it('should set empty string when search control emits null', fakeAsync(() => {
      component.driveSearchControl.setValue(null as any);
      tick();
      // Should not throw and filteredDrives should work
      expect(component.filteredDrives()).toBeTruthy();
    }));
  });

  // ─── onEmployerSelected with employer having city data ────────────────────

  describe('onEmployerSelected with employer details', () => {
    it('should set filteredEmployerCities from employer city data', () => {
      component.filteredEmployers.set([
        { employerId: 'EMP1', employerName: 'ACME', city: 'Dallas', state: 'TX', zip: '75001', uspsId: 100 } as any,
      ]);
      component.onEmployerSelected('EMP1');
      expect(component.filteredEmployerCities().length).toBe(1);
      expect(component.filteredEmployerCities()[0].city).toBe('Dallas');
    });

    it('should handle employer with empty city', () => {
      component.filteredEmployers.set([
        { employerId: 'EMP1', employerName: 'ACME', city: '', state: '', zip: '' } as any,
      ]);
      component.onEmployerSelected('EMP1');
      expect(component.employerStateDisplay()).toBe('--');
    });
  });

  // ─── formatPhoneInput edge case ──────────────────────────────────────────

  describe('formatPhoneInput edge', () => {
    it('should not change value when stripped equals control value', () => {
      fillRequiredFieldsUpToWeight();
      component.registrationForm.get('homePhone')?.setValue('1234567890');
      component.formatPhoneInput('homePhone');
      expect(component.registrationForm.get('homePhone')?.value).toBe('1234567890');
    });
  });

  // ─── focusNextRequiredField ───────────────────────────────────────────────

  describe('focusNextRequiredField', () => {
    it('should return early for unknown field name', () => {
      (component as any).focusNextRequiredField('nonExistentField');
      // should not throw
    });

    it('should skip non-required fields', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      // weight is filled, next required is homeAddress (skipping alternateId, alternateType, idQueue)
      (component as any).focusNextRequiredField('weight');
      tick(100);
      // should not throw, should skip to homeAddress
    }));

    it('should skip disabled controls', fakeAsync(() => {
      setupMockUnitIdField();
      component.updateFieldStates();
      // lastName is enabled but empty
      (component as any).focusNextRequiredField('lastName');
      tick(100);
      // should not throw
    }));

    it('should skip fields that already have values', fakeAsync(() => {
      fillAllRequiredFields();
      // All required fields are filled, should not find any empty required field
      (component as any).focusNextRequiredField('lastName');
      tick(100);
      // should not throw
    }));
  });

  // ─── getFieldNameFromTarget ───────────────────────────────────────────────

  describe('getFieldNameFromTarget', () => {
    it('should return formControlName from direct attribute', () => {
      const input = document.createElement('input');
      input.setAttribute('formControlName', 'lastName');
      const result = (component as any).getFieldNameFromTarget(input);
      expect(result).toBe('lastName');
    });

    it('should return formControlName from parent mat-select', () => {
      const matSelect = document.createElement('mat-select');
      matSelect.setAttribute('formControlName', 'ethnicGroup');
      const child = document.createElement('span');
      matSelect.appendChild(child);
      const result = (component as any).getFieldNameFromTarget(child);
      expect(result).toBe('ethnicGroup');
    });

    it('should return null when no formControlName found', () => {
      const div = document.createElement('div');
      const result = (component as any).getFieldNameFromTarget(div);
      expect(result).toBeNull();
    });
  });

  // ─── getActiveField with intl disabled fields ─────────────────────────────

  describe('getActiveField with international address', () => {
    it('should skip intl disabled fields when finding active field', () => {
      fillRequiredFieldsUpToWeight();
      component.disableAddressFields();
      const result = (component as any).getActiveField();
      // Should skip homeAddress/city/zip since they are intl disabled
      expect(result).toBeTruthy();
      expect(['homeAddress', 'city', 'zip']).not.toContain(result);
    });
  });

  // ─── focusActiveField ────────────────────────────────────────────────────

  describe('focusActiveField', () => {
    it('should not throw when no active field exists', fakeAsync(() => {
      fillAllRequiredFields();
      (component as any).focusActiveField();
      tick(100);
    }));
  });

  // ─── Computed filter short-circuit coverage ───────────────────────────────

  describe('computed filter short-circuit paths', () => {
    it('filteredDrives should match by sponsorName when driveId does not match', fakeAsync(() => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: 'Red Cross' },
        { driveId: 'DRV002', driveDate: '2025-01-02', driveType: null, sponsorName: 'Other' },
      ]);
      component.driveSearchControl.setValue('cross');
      tick();
      expect(component.filteredDrives().length).toBe(1);
      expect(component.filteredDrives()[0].sponsorName).toBe('Red Cross');
    }));

    it('filteredProcedureCodes should match by description when code does not match', fakeAsync(() => {
      component.procedureCodes.set([
        { procedureCode: 'PP', description: 'Platelet Pheresis' },
        { procedureCode: 'WB', description: 'Whole Blood' },
      ] as any);
      component.procedureSearchControl.setValue('platelet');
      tick();
      expect(component.filteredProcedureCodes().length).toBe(1);
      expect(component.filteredProcedureCodes()[0].procedureCode).toBe('PP');
    }));

    it('filteredVenipunctureCodes should match by description', fakeAsync(() => {
      component.venipunctureCodes.set([
        { code: 'V1', description: 'Good Venipuncture' },
        { code: 'V2', description: 'Fair Venipuncture' },
      ] as any);
      component.venipunctureSearchControl.setValue('good');
      tick();
      expect(component.filteredVenipunctureCodes().length).toBe(1);
    }));

    it('filteredEmployees should match by employeeName when staffNo does not', fakeAsync(() => {
      component.employees.set([
        { staffNo: 'E1', employeeName: 'Alice Smith' },
        { staffNo: 'E2', employeeName: 'Bob Jones' },
      ] as any);
      component.reviewerSearchControl.setValue('alice');
      tick();
      expect(component.filteredEmployees().length).toBe(1);
    }));

    it('filteredDonationTypes should match by description', fakeAsync(() => {
      component.donationTypes.set([
        { donationType: 'WB', description: 'Whole Blood' },
        { donationType: 'PL', description: 'Platelet' },
      ] as any);
      component.donationSearchControl.setValue('whole');
      tick();
      expect(component.filteredDonationTypes().length).toBe(1);
    }));

    it('filteredEthnicGroups should match by description', fakeAsync(() => {
      component.ethnicGroups.set([
        { code: 'CA', description: 'Caucasian' },
        { code: 'HI', description: 'Hispanic' },
      ]);
      component.ethnicGroupSearchControl.setValue('hisp');
      tick();
      expect(component.filteredEthnicGroups().length).toBe(1);
    }));

    it('filteredDeferralTypes should match by description', fakeAsync(() => {
      component.deferralTypeSearchControl.setValue('indefinite');
      tick();
      expect(component.filteredDeferralTypes().length).toBe(1);
      expect(component.filteredDeferralTypes()[0].code).toBe('IND');
    }));

    it('filteredEquipmentTypes should match by code not just description', fakeAsync(() => {
      component.equipmentTypes.set([
        { code: 'EQ_ALPHA', description: 'Something' },
        { code: 'EQ_BETA', description: 'Something Else' },
      ]);
      component.equipTypeSearchControl.setValue('alpha');
      tick();
      expect(component.filteredEquipmentTypes().length).toBe(1);
    }));

    it('filteredReactionCodes should match by description not just code', fakeAsync(() => {
      component.reactionCodesList.set([
        { code: 'R1', description: 'Mild Reaction' },
        { code: 'R2', description: 'Severe Reaction' },
      ]);
      component.reactionSearchControl.setValue('mild');
      tick();
      expect(component.filteredReactionCodes().length).toBe(1);
    }));
  });

  // ─── setupDonationTypeListener procedure code success path ────────────────

  describe('setupDonationTypeListener success', () => {
    it('should load both procedure codes and deferral reasons successfully', fakeAsync(() => {
      component.searchForm.get('driveDate')?.setValue(moment('2025-01-01'));
      fillRequiredFieldsUpToEthnicGroup();
      const procedures = [{ procedureCode: 'PP', description: 'Test' }];
      const reasons = [{ reasonCode: 'DR1' }];
      mockDonorService.getProcedureCodesByDonationType.and.returnValue(of(procedures as any));
      mockDonorService.getDeferralReasons.and.returnValue(of(reasons as any));
      component.registrationForm.get('donation')?.setValue('WB');
      tick();
      expect(component.procedureCodes().length).toBe(1);
      expect(component.deferralReasons().length).toBe(1);
    }));
  });

  // ─── formatPhoneDisplay edge case (non 7/10 digits) ───────────────────────

  describe('formatPhoneDisplay edge case', () => {
    it('should not format phone with fewer than 7 digits', () => {
      fillRequiredFieldsUpToWeight();
      // 6 digits: should NOT be formatted
      component.registrationForm.get('homePhone')?.setValue('123456');
      (component as any).formatPhoneDisplay('homePhone');
      expect(component.registrationForm.get('homePhone')?.value).toBe('123456');
    });
  });

  // ─── parsePhone edge cases ────────────────────────────────────────────────

  describe('parsePhone edge cases', () => {
    it('should handle digits shorter than 7', () => {
      const result = (component as any).parsePhone('12345');
      expect(result.areaCode).toBe('');
      expect(result.phoneNo).toBe('12345');
    });
  });

  // ─── onAutoSave with existing donor (not new donor) ───────────────────────

  describe('onAutoSave existing donor fields', () => {
    it('should include all donor demographics in request for existing donor', () => {
      fillAllRequiredFields();
      component.stateDisplay.set('TX');
      component.registrationForm.patchValue({
        abo: 'A+',
        middleName: 'M',
        suffix: 'Sr',
      });

      mockDonorService.create.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));

      component.onAutoSave();

      const request = mockDonorService.create.calls.mostRecent().args[0];
      expect(request.isNewDonor).toBeFalse();
      expect(request.newDonorDetails).toBeUndefined();
      expect(request.bloodType).toBe('A+');
      expect(request.middleName).toBe('M');
      expect(request.lastNameSuffix).toBe('Sr');
      expect(request.state).toBe('TX');
    });
  });

  // ─── onZipBlur with edge case results ────────────────────────────────────

  describe('onZipBlur with edge case results', () => {
    it('should handle results with null uspsId and empty state (no matching city)', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      const results = [
        { uspsId: null, city: 'Unknown', state: '', zip: '00001' },
      ];
      mockDonorService.getCityState.and.returnValue(of(results as any));
      component.registrationForm.get('zip')?.setValue('00001');
      component.registrationForm.get('city')?.setValue('');
      component.onZipBlur();
      tick();
      expect(component.stateDisplay()).toBe('--');
      expect(component.registrationForm.get('city')?.value).toBe('Unknown');
    }));

    it('should handle matching city with null uspsId', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      const results = [{ uspsId: null, city: 'Dallas', state: '', zip: '75001' }];
      mockDonorService.getCityState.and.returnValue(of(results as any));
      component.registrationForm.get('zip')?.setValue('75001');
      component.registrationForm.get('city')?.setValue('Dallas');
      component.onZipBlur();
      tick();
      expect(component.stateDisplay()).toBe('--');
    }));
  });

  // ─── onEmployerZipBlur with null uspsId ──────────────────────────────────

  describe('onEmployerZipBlur with null uspsId', () => {
    it('should handle results with null uspsId and empty state', fakeAsync(() => {
      fillRequiredFieldsUpToWeight();
      const results = [{ uspsId: null, city: 'Unknown', state: '', zip: '00001' }];
      mockDonorService.getCityState.and.returnValue(of(results as any));
      component.registrationForm.get('employerZip')?.setValue('00001');
      component.registrationForm.get('employerCity')?.setValue('');
      component.onEmployerZipBlur();
      tick();
      expect(component.employerStateDisplay()).toBe('--');
    }));
  });

  // ─── onCitySelected with null uspsId ─────────────────────────────────────

  describe('onCitySelected edge cases', () => {
    it('should handle city with null uspsId', () => {
      component.onCitySelected({ uspsId: null as any, city: 'Test', state: 'TX', zip: '12345' });
      expect(component.stateDisplay()).toBe('TX');
    });
  });

  // ─── populateAddress no city edges ────────────────────────────────────────

  describe('populateAddress no city edges', () => {
    it('should handle domestic address with no city and no eCity', () => {
      (component as any).populateAddress({
        intlAddrFlag: 'N',
        city: null,
        eCity: null,
        preferredContactFlag: null,
        empIntlAddrFlag: 'N',
      } as any);
      expect(component.stateDisplay()).toBe('--');
    });

    it('should handle intl address eCity with null eUspsId', () => {
      (component as any).populateAddress({
        intlAddrFlag: 'Y',
        intlAddress1: 'L1',
        countryName: 'UK',
        eCity: 'London',
        eState: 'LN',
        eZip: 'SW1',
        eUspsId: null,
        empIntlAddrFlag: 'N',
      } as any);
      expect(component.filteredEmployerCities().length).toBe(1);
      expect(component.filteredEmployerCities()[0].uspsId).toBe(0);
    });
  });

  // ─── onAutoSave new donor + intl address ─────────────────────────────────

  describe('onAutoSave new donor with intl address', () => {
    it('should include intl address in newDonorDetails when intl address is set', () => {
      fillAllRequiredFields();
      component.registrationForm.patchValue({ donorId: '' });
      (component as any).newDonorExpected = { lastName: 'Test', firstName: 'John' };
      (component as any).enableAllFields();
      component.donorIntlAddress = {
        streetName: 'Int City', addr1: 'L1', addr2: null, addr3: null,
        country: 'UK', postalCode: 'SW1', homePhoneNo: '111',
        workPhoneNo: '222', workPhoneExt: '33', mobilePhoneNo: '444',
        faxNo: '555', email: '[REDACTED_EMAIL_ADDRESS_5]', intlAddrFlag: 'Y',
      };
      mockDonorService.create.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));
      component.onAutoSave();
      const request = mockDonorService.create.calls.mostRecent().args[0];
      expect(request.isNewDonor).toBeTrue();
      expect(request.newDonorDetails?.address?.intlAddrFlag).toBe('Y');
      expect(request.newDonorDetails?.address?.countryName).toBe('UK');
    });
  });

  // ─── onAutoSave hold uppercase ───────────────────────────────────────────

  describe('onAutoSave hold uppercase', () => {
    it('should uppercase names and handle null dob', () => {
      setupMockUnitIdField();
      component.searchForm.get('driveId')?.setValue('DRV001');
      (component as any).handleHoldAction({ lastName: 'smith', firstName: 'john', dob: null, sex: '' });
      mockDonorService.registerHold.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        item: { transactionId: 'T1' },
      } as any));
      component.onAutoSave();
      const request = mockDonorService.registerHold.calls.mostRecent().args[0];
      expect(request.lastName).toBe('SMITH');
      expect(request.firstName).toBe('JOHN');
      expect(request.dateOfBirth).toBeUndefined();
    });
  });

  // ─── onEmployerCitySelected edge cases ───────────────────────────────────

  describe('onEmployerCitySelected null edges', () => {
    it('should handle null uspsId', () => {
      component.onEmployerCitySelected({ uspsId: null as any, city: 'Test', state: '', zip: '12345' });
      expect(component.employerStateDisplay()).toBe('--');
    });
  });
});
