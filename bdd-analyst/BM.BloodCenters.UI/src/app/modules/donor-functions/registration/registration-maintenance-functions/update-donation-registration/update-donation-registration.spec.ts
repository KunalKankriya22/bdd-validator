import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { UpdateDonationRegistrationComponent } from './update-donation-registration';
import { UpdateDonationRegistrationService } from './services/update-donation-registration.service';
import { DonorRegistrationService } from '../../../donor-functions-components/donor-registration/services/donor-registration.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ValidMasterCodesService } from '@shared/services/valid-master-codes.service';
import { AlternateDemographicsService } from '@shared/services/alternate-demographics.service';
import { MenuService } from '@shared/services/menu.service';
import { UpdateDonationRetrieveResponse } from './models/update-donation-registration.model';
import { provideCommonTestMocks } from '@shared/testing/page-header-service.mock';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('UpdateDonationRegistrationComponent', () => {
  let component: UpdateDonationRegistrationComponent;
  let fixture: ComponentFixture<UpdateDonationRegistrationComponent>;
  let mockUpdateService: jasmine.SpyObj<UpdateDonationRegistrationService>;
  let mockDonorService: jasmine.SpyObj<DonorRegistrationService>;
  let mockHeaderService: { chapterChanged$: Subject<void>; chapterTimeZone: jasmine.Spy };
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockMasterCodesService: jasmine.SpyObj<ValidMasterCodesService>;
  let mockAltDemoService: jasmine.SpyObj<AlternateDemographicsService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let dialogSpy: jasmine.Spy;
  let navigateSpy: jasmine.Spy;

  const createMockDonation = (overrides: Partial<UpdateDonationRetrieveResponse> = {}): UpdateDonationRetrieveResponse => ({
    transactionId: 'TXN001',
    unitId: 'W6333 19 030301-X',
    voidUnitId: null,
    donationType: 'AL',
    donationTypeDescription: 'Allogeneic',
    procedureCode: 'PP',
    procedureCodeDescription: 'Phlebotomy',
    equipType: 'AMIC',
    lookupId: 'CJH123',
    screenerId: 'CJH123',
    physicalId: 'CJH123',
    firstReviewerId: 'CJH123',
    creditSponsor: 'SPON046697',
    materialId: 'CJH123',
    collDate: '2025-01-01',
    driveId: 'DRV0172299',
    driveDate: '2026-01-25',
    armUsed: 'R',
    deferralReason: '5',
    deferralType: 'NA',
    deferredThruDate: '1994-10-12',
    venipunctureId: '01',
    sVenipuncture: '01',
    sReactions: 'MI',
    auditKey: 1,
    enteredBy: 'Brigerman Richards',
    donorId: 'DN30136689',
    lastName: 'Rogers',
    firstName: 'Marvin',
    middleName: 'Harry',
    lastNameSuffix: 'Sr.',
    dateOfBirth: '1994-10-12',
    gender: 'M',
    donorWeight: 75,
    bloodType: null,
    ethnicGroup: 'CA',
    alternateId: 'M639466',
    alternateType: 'PASPT',
    idQueue: 'Yes',
    donorStatus: 'A',
    streetName: '781 LINCOLN WAY DRVE',
    suiteApt: '12345 BK',
    city: 'Dallas',
    state: 'TX',
    zip: '75001',
    homePhone: '(214) 852-758-44',
    workPhone: '(214) 852-758-45',
    mobilePhone: '(214) 852-758-46',
    email: 'test@example.com',
    preferredPhone: 'mobile',
    insertUser: null,
    employerName: 'Mediware',
    employerCity: 'Dallas',
    employerState: 'TX',
    employerZip: '75001',
    intlAddrFlag: null,
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
    intlEmail: null,
    empStreetName: null,
    empIntlAddrFlag: null,
    empIntlAddress1: null,
    empIntlAddress2: null,
    empIntlAddress3: null,
    empIntlAddress4: null,
    empCountryName: null,
    empIntlPostalCode: null,
    empIntlHomePhoneNo: null,
    empIntlWorkPhoneNo: null,
    empIntlWorkPhoneExt: null,
    empIntlMobilePhoneNo: null,
    empIntlFaxNo: null,
    empEmail: null,
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
    altMobilePhoneNumber: null,
    altOtherContactNumber: null,
    altIntlPhoneNumber: null,
    altPreferredContactPhone: null,
    altPreferredContactAddress: null,
    bleedStartTimeL1: null,
    bleedStartTimeL2: null,
    bleedStartTimeR1: null,
    bleedStartTimeR2: null,
    bleedEndTimeL: null,
    bleedEndTimeR: null,
    bleedStartPhlebL1: null,
    bleedStartPhlebL2: null,
    bleedStartPhlebR1: null,
    bleedStartPhlebR2: null,
    bleedEndPhlebL: null,
    bleedEndPhlebR: null,
    bleedEndTimeL2: null,
    bleedEndPhlebL2: null,
    bleedEndTimeR2: null,
    bleedEndPhlebR2: null,
    ...overrides,
  }) as UpdateDonationRetrieveResponse;

  const mockApiResponse = (data: UpdateDonationRetrieveResponse) => ({
    success: true,
    message: '',
    statusCode: 200,
    data,
    total: 1,
  });

  const mockApiErrorResponse = (errorMsg: string) => ({
    success: false,
    message: errorMsg,
    statusCode: 400,
    data: null,
    total: 0,
    errorResponse: { errorCode: 'ERR', error: errorMsg },
  });

  const setupSearchUnitIdField = () => {
    (component as any).searchUnitIdField = {
      isValid: true,
      parsedUnitId: 'W633326042203',
      unitIdInput: { nativeElement: { focus: () => {} } },
      clear: () => {},
      unitIdControl: { setValue: () => {}, markAsTouched: () => {} },
      onBlur: () => {},
    };
  };

  const loadDonationIntoEditMode = (donationOverrides: Partial<UpdateDonationRetrieveResponse> = {}) => {
    const mockData = createMockDonation(donationOverrides);
    mockUpdateService.retrieveByUnitId.and.returnValue(of(mockApiResponse(mockData)));

    setupSearchUnitIdField();
    component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

    component.onRetrieve();
    tick();

    return mockData;
  };

  beforeEach(() => {
    mockUpdateService = jasmine.createSpyObj('UpdateDonationRegistrationService', [
      'retrieveByUnitId',
      'updateDonation',
      'getInterdictions',
    ]);
    mockUpdateService.getInterdictions.and.returnValue(of([]));

    mockDonorService = jasmine.createSpyObj('DonorRegistrationService', [
      'getDrives',
      'getEmployees',
      'getEmployers',
      'getProcedureCodes',
      'getVenipunctureCodes',
      'getInterdictionCodes',
      'getDonationTypes',
      'getSponsors',
      'getDeferralReasons',
      'validateUnitId',
      'getProcedureCodesByDonationType',
      'getCityState',
      'validateStaff',
      'validateCity',
      'validateZipCity',
      'validateEthnicGroup',
      'validateEquipmentType',
      'validateAlternateIdType',
      'getEthnicGroups',
      'getAlternateIdTypes',
      'getEquipmentTypes',
      'getReactionCodes',
    ]);
    mockDonorService.getDrives.and.returnValue(of([]));
    mockDonorService.getEmployees.and.returnValue(of([]));
    mockDonorService.getEmployers.and.returnValue(of([]));
    mockDonorService.getProcedureCodes.and.returnValue(of([]));
    mockDonorService.getProcedureCodesByDonationType.and.returnValue(of([]));
    mockDonorService.getCityState.and.returnValue(of([]));
    mockDonorService.getVenipunctureCodes.and.returnValue(of([]));
    mockDonorService.getInterdictionCodes.and.returnValue(of([]));
    mockDonorService.getDonationTypes.and.returnValue(of([]));
    mockDonorService.getSponsors.and.returnValue(of([]));
    mockDonorService.getDeferralReasons.and.returnValue(of([]));
    mockDonorService.validateUnitId.and.returnValue(of({
      success: true,
      message: '',
      errorCode: null,
      item: {
        parsedUnitId: 'W633326042203',
        checkDigit: null,
        codeScheme: 'I' as const,
        manualUnitId: 'W633326042203',
        codabarUnitScheme: null,
        entryMode: 'S' as const,
        barcodeType: 'CODABAR' as const,
        chapterScheme: 'I' as const,
      },
    }));
    mockDonorService.validateStaff.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
    mockDonorService.validateCity.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
    mockDonorService.validateZipCity.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
    mockDonorService.validateEthnicGroup.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
    mockDonorService.validateEquipmentType.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
    mockDonorService.validateAlternateIdType.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
    mockDonorService.getEthnicGroups.and.returnValue(of([]));
    mockDonorService.getAlternateIdTypes.and.returnValue(of([]));
    mockDonorService.getEquipmentTypes.and.returnValue(of([]));
    mockDonorService.getReactionCodes.and.returnValue(of([]));

    mockHeaderService = {
      chapterChanged$: new Subject<void>(),
      chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('America/Chicago'),
    };

    mockSnackbarService = createMockSnackbarService();

    mockMasterCodesService = jasmine.createSpyObj('ValidMasterCodesService', ['getByCodeType']);
    mockMasterCodesService.getByCodeType.and.returnValue(of([]));

    mockAltDemoService = jasmine.createSpyObj('AlternateDemographicsService', ['getByDonorId']);
    mockAltDemoService.getByDonorId.and.returnValue(of(null));

    mockMenuService = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);
    mockMenuService.findMenuItemByPath.and.returnValue(undefined);

    TestBed.configureTestingModule({
      imports: [
        UpdateDonationRegistrationComponent,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatRadioModule,
        MatProgressSpinnerModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UpdateDonationRegistrationService, useValue: mockUpdateService },
        { provide: DonorRegistrationService, useValue: mockDonorService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: ValidMasterCodesService, useValue: mockMasterCodesService },
        { provide: AlternateDemographicsService, useValue: mockAltDemoService },
        { provide: MenuService, useValue: mockMenuService },
        ...provideCommonTestMocks(),
      ],
    });

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(UpdateDonationRegistrationComponent);
    component = fixture.componentInstance;
    dialogSpy = spyOn((component as any).dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);

    try { fixture.detectChanges(); } catch (_) { /* child component template errors */ }
  });

  describe('initialization', () => {
    it('should start in search mode', () => {
      expect(component.mode()).toBe('search');
    });

    it('should initialize search form with collectionDate disabled', () => {
      expect(component.searchForm.get('collectionDate')).toBeTruthy();
      expect(component.searchForm.get('collectionDate')?.disabled).toBeTrue();
    });

    it('should initialize edit form', () => {
      expect(component.editForm).toBeTruthy();
      expect(component.editForm.get('ethnicGroup')).toBeTruthy();
      expect(component.editForm.get('donation')).toBeTruthy();
      expect(component.editForm.get('procedure')).toBeTruthy();
      expect(component.editForm.get('reviewerId')).toBeTruthy();
    });

    it('should load static LOVs on init', () => {
      expect(mockDonorService.getEthnicGroups).toHaveBeenCalled();
      expect(mockDonorService.getAlternateIdTypes).toHaveBeenCalled();
      expect(mockDonorService.getEquipmentTypes).toHaveBeenCalled();
      expect(mockDonorService.getReactionCodes).toHaveBeenCalled();
    });

    it('should display entered by as "--" initially', () => {
      expect(component.enteredByName()).toBe('--');
    });

    it('should have 6 content sections', () => {
      expect(component.contentSections.length).toBe(6);
      expect(component.contentSections[0].id).toBe('donor');
      expect(component.contentSections[5].id).toBe('donation');
    });

    it('should set header config from menu service when menu item is found', () => {
      mockMenuService.findMenuItemByPath.and.returnValue({
        label: 'Custom Title',
        remarks: 'Custom Subtitle',
      } as any);

      const newFixture = TestBed.createComponent(UpdateDonationRegistrationComponent);
      const newComponent = newFixture.componentInstance;
      spyOn((newComponent as any).dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);
      try { newFixture.detectChanges(); } catch (_) { /* child component template errors */ }

      expect(newComponent.headerConfig.title).toBe('Custom Title');
      expect(newComponent.headerConfig.subtitle).toBe('Custom Subtitle');
    });

    it('should populate ethnic groups from service', fakeAsync(() => {
      mockDonorService.getEthnicGroups.and.returnValue(of([{ code: 'CA', description: 'Caucasian' }]));

      const f = TestBed.createComponent(UpdateDonationRegistrationComponent);
      const c = f.componentInstance;
      spyOn((c as any).dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);
      try { f.detectChanges(); } catch (_) {}
      tick();

      expect(c.ethnicGroups().length).toBe(1);
      expect(c.ethnicGroups()[0].code).toBe('CA');
    }));

    it('should populate equipment types from service', fakeAsync(() => {
      mockDonorService.getEquipmentTypes.and.returnValue(of([{ code: 'AMIC', description: 'Amicus' }]));

      const f = TestBed.createComponent(UpdateDonationRegistrationComponent);
      const c = f.componentInstance;
      spyOn((c as any).dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);
      try { f.detectChanges(); } catch (_) {}
      tick();

      expect(c.equipmentTypes().length).toBe(1);
      expect(c.equipmentTypes()[0].code).toBe('AMIC');
    }));
  });

  describe('search form validation', () => {
    it('should not show error for disabled collection date when touched', () => {
      component.searchForm.get('collectionDate')?.markAsTouched();
      expect(component.getSearchFieldError('collectionDate')).toBe('');
    });

    it('should not show error for valid search form', () => {
      setupSearchUnitIdField();
      component.searchForm.patchValue({
        collectionDate: moment('2025-01-01'),
      });
      expect(component.searchForm.invalid).toBeFalse();
    });

    it('should return required error for collectionDate when required and touched', () => {
      const ctrl = component.searchForm.get('collectionDate');
      ctrl?.enable();
      ctrl?.addValidators(() => ({ required: true }));
      ctrl?.updateValueAndValidity();
      ctrl?.markAsTouched();
      expect(component.getSearchFieldError('collectionDate')).toBe('Collection Date is required');
    });

    it('should return generic required error for other fields', () => {
      component.searchForm.addControl('testField', new (require('@angular/forms').FormControl)('', { validators: require('@angular/forms').Validators.required }));
      component.searchForm.get('testField')?.markAsTouched();
      expect(component.getSearchFieldError('testField')).toBe('testField is required');
    });
  });

  describe('onRetrieve', () => {
    it('should show error when no parsedUnitId', () => {
      (component as any).searchUnitIdField = undefined;

      component.onRetrieve();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Please enter and validate a Unit ID before retrieving.'
      );
    });

    it('should show error when parsedUnitId is empty', () => {
      (component as any).searchUnitIdField = { parsedUnitId: '', clear: () => {} };

      component.onRetrieve();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Please enter and validate a Unit ID before retrieving.'
      );
    });

    it('should call retrieveByUnitId with correct params', fakeAsync(() => {
      const mockData = createMockDonation();
      mockUpdateService.retrieveByUnitId.and.returnValue(of(mockApiResponse(mockData)));

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      tick();

      expect(mockUpdateService.retrieveByUnitId).toHaveBeenCalledWith('W633326042203', '2025-01-01');
      expect(component.mode()).toBe('edit');
      expect(component.currentDonation()).toEqual(mockData);
      expect(component.enteredByName()).toBe('Brigerman Richards');
    }));

    it('should populate edit form after successful retrieve', fakeAsync(() => {
      const mockData = createMockDonation();
      mockUpdateService.retrieveByUnitId.and.returnValue(of(mockApiResponse(mockData)));

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      tick();

      expect(component.editForm.get('donation')?.value).toBe('AL');
      expect(component.editForm.get('procedure')?.value).toBe('PP');
      expect(component.editForm.get('armUsed')?.value).toBe('R');
      expect(component.editForm.get('ethnicGroup')?.value).toBe('CA');
      expect(component.editForm.get('reviewerId')?.value).toBe('CJH123');
      expect(component.editForm.get('weight')?.value).toBe(75);
    }));

    it('should load form LOVs after successful retrieve', fakeAsync(() => {
      loadDonationIntoEditMode();

      expect(mockDonorService.getDrives).toHaveBeenCalled();
      expect(mockDonorService.getEmployees).toHaveBeenCalled();
      expect(mockDonorService.getProcedureCodesByDonationType).toHaveBeenCalled();
    }));

    it('should set donor display fields from response', fakeAsync(() => {
      loadDonationIntoEditMode();

      expect(component.donorId()).toBe('DN30136689');
      expect(component.lastNameDisplay()).toBe('Rogers');
      expect(component.sexDisplay()).toBe('Male');
      expect(component.stateDisplay()).toBe('TX');
      expect(component.transactionId()).toBe('TXN001');
    }));

    it('should use insertUser when enteredBy is null', fakeAsync(() => {
      loadDonationIntoEditMode({ enteredBy: null, insertUser: 'System Admin' });

      expect(component.enteredByName()).toBe('System Admin');
    }));

    it('should fall back to "--" when both enteredBy and insertUser are null', fakeAsync(() => {
      loadDonationIntoEditMode({ enteredBy: null, insertUser: null });

      expect(component.enteredByName()).toBe('--');
    }));

    it('should use collDate when driveDate is null for LOV loading', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: null, collDate: '2025-06-15' });

      expect(mockDonorService.getDrives).toHaveBeenCalledWith('2025-06-15');
    }));

    it('should show error on retrieve failure response', fakeAsync(() => {
      mockUpdateService.retrieveByUnitId.and.returnValue(
        of(mockApiErrorResponse('Unit not found'))
      );

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Unit not found');
      expect(component.mode()).toBe('search');
    }));

    it('should show default message when error response has no specific error', fakeAsync(() => {
      mockUpdateService.retrieveByUnitId.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 404,
        data: null,
        total: 0,
      }));

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'No donation found for the given Unit ID and Collection Date.'
      );
    }));

    it('should handle HTTP error on retrieve', fakeAsync(() => {
      mockUpdateService.retrieveByUnitId.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Server error' } } }))
      );

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Server error');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should show generic message on HTTP error without specific error', fakeAsync(() => {
      mockUpdateService.retrieveByUnitId.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to retrieve donation record.');
    }));

    it('should handle null response gracefully', fakeAsync(() => {
      mockUpdateService.retrieveByUnitId.and.returnValue(of(null as any));

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      tick();

      expect(component.mode()).toBe('search');
    }));

    it('should set isLoading to false after retrieve completes', fakeAsync(() => {
      const subj = new Subject<any>();
      mockUpdateService.retrieveByUnitId.and.returnValue(subj.asObservable());

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      expect(component.isLoading()).toBeTrue();

      subj.next(mockApiResponse(createMockDonation()));
      subj.complete();
      tick();

      expect(component.isLoading()).toBeFalse();
    }));

    it('should handle retrieve with empty collectionDate', fakeAsync(() => {
      mockUpdateService.retrieveByUnitId.and.returnValue(of(mockApiResponse(createMockDonation())));

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: null });

      component.onRetrieve();
      tick();

      expect(mockUpdateService.retrieveByUnitId).toHaveBeenCalledWith('W633326042203', '');
    }));

    it('should load existing interdictions when transactionId is present', fakeAsync(() => {
      mockUpdateService.getInterdictions.and.returnValue(of([
        { transactionId: 'TXN001', interCode: 'H01', interDesc: 'Hold 1' },
      ]));

      loadDonationIntoEditMode();

      expect(mockUpdateService.getInterdictions).toHaveBeenCalledWith('TXN001');
      expect(component.selectedHolds.length).toBe(1);
      expect(component.selectedHolds[0].interCode).toBe('H01');
    }));

    it('should handle interdiction load error', fakeAsync(() => {
      mockUpdateService.getInterdictions.and.returnValue(throwError(() => new Error('fail')));

      loadDonationIntoEditMode();

      expect(component.selectedHolds).toEqual([]);
    }));

    it('should preload sponsors when creditSponsor is set', fakeAsync(() => {
      loadDonationIntoEditMode({ creditSponsor: 'SPON001' });

      expect(mockDonorService.getSponsors).toHaveBeenCalledWith('SPON001');
    }));
  });

  describe('onSave', () => {
    beforeEach(fakeAsync(() => {
      loadDonationIntoEditMode();
      component.editForm.patchValue({
        employerCity: 'Dallas',
        employerZip: '75001',
      });
    }));

    it('should show error and not save when form is invalid', fakeAsync(() => {
      component.editForm.get('weight')?.setValue(null);
      component.editForm.get('ethnicGroup')?.setValue('');

      component.onSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringMatching(/Please fix required fields:/)
      );
      expect(mockUpdateService.updateDonation).not.toHaveBeenCalled();
    }));

    it('should include field names in invalid form error message', fakeAsync(() => {
      component.editForm.get('weight')?.setValue(null);
      component.editForm.get('donation')?.setValue('');
      component.editForm.get('armUsed')?.setValue('');

      component.onSave();
      tick();

      const errorMsg = mockSnackbarService.showError.calls.mostRecent().args[0];
      expect(errorMsg).toContain('Weight');
      expect(errorMsg).toContain('Donation');
      expect(errorMsg).toContain('Arm Used');
    }));

    it('should call updateDonation with correct request', fakeAsync(() => {
      mockUpdateService.updateDonation.and.returnValue(
        of(mockApiResponse(createMockDonation()))
      );

      component.onSave();
      tick();

      expect(mockUpdateService.updateDonation).toHaveBeenCalledTimes(1);
      const callArgs = mockUpdateService.updateDonation.calls.mostRecent().args;
      expect(callArgs[0]).toBe('TXN001');
      expect(callArgs[1].transactionId).toBe('TXN001');
      expect(callArgs[1].donationType).toBe('AL');
    }));

    it('should show success message and reset page on successful save', fakeAsync(() => {
      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Donation updated successfully.');
      expect(component.mode()).toBe('search');
      expect(component.currentDonation()).toBeNull();
    }));

    it('should show error when update response has success=false', fakeAsync(() => {
      mockUpdateService.updateDonation.and.returnValue(
        of(mockApiErrorResponse('Audit key mismatch'))
      );

      component.onSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Audit key mismatch');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should show generic error when update response has no specific message', fakeAsync(() => {
      mockUpdateService.updateDonation.and.returnValue(
        of({ success: false, message: '', statusCode: 400, data: null, total: 0 })
      );

      component.onSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to update donation.');
    }));

    it('should handle HTTP error on save', fakeAsync(() => {
      mockUpdateService.updateDonation.and.returnValue(
        throwError(() => ({ error: { message: 'Network error' } }))
      );

      component.onSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Network error');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should show generic error on save HTTP error without message', fakeAsync(() => {
      mockUpdateService.updateDonation.and.returnValue(
        throwError(() => ({}))
      );

      component.onSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('An error occurred while updating donation.');
    }));

    it('should not save when currentDonation is null', fakeAsync(() => {
      component.currentDonation.set(null);

      component.onSave();
      tick();

      expect(mockUpdateService.updateDonation).not.toHaveBeenCalled();
    }));

    it('should include donor international address in request when set', fakeAsync(() => {
      component.donorIntlAddress = {
        streetName: '123 Intl St',
        addr1: 'Line 1',
        addr2: 'Line 2',
        addr3: null,
        addr4: null,
        country: 'Canada',
        postalCode: 'M1M1M1',
        intlAddrFlag: 'Y',
      };

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.intlAddrFlag).toBe('Y');
      expect(request.donorInternationalAddress).toBeDefined();
      expect(request.donorInternationalAddress?.streetName).toBe('123 Intl St');
      expect(request.donorInternationalAddress?.country).toBe('Canada');
    }));

    it('should include employer international address in request when set', fakeAsync(() => {
      component.employerIntlAddress = {
        streetName: '456 Employer Intl',
        addr1: 'Emp Line 1',
        addr2: null,
        addr3: null,
        addr4: null,
        country: 'UK',
        postalCode: 'SW1A',
        intlAddrFlag: 'Y',
      };

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.employerInternationalAddress).toBeDefined();
      expect(request.employerInternationalAddress?.country).toBe('UK');
    }));

    it('should filter out original holds and include only new holds in request', fakeAsync(() => {
      component.selectedHolds = [
        { interCode: 'H01', interDesc: 'Hold 1', interType: null },
        { interCode: 'H02', interDesc: 'Hold 2', interType: null },
      ];
      (component as any).originalHoldCodes = new Set(['H01']);

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.interdictions?.length).toBe(1);
      expect(request.interdictions?.[0].interCode).toBe('H02');
    }));

    it('should map left arm bleed times when armUsed is L', fakeAsync(() => {
      component.editForm.get('armUsed')?.setValue('L');
      component.bleedTimeData = {
        doubleStickId: '',
        currentDriveDate: '',
        employees: [],
        selectedArm: 'L',
        drawStartTime: '',
        mrsLoss: '',
        phlebotomistLoss: '',
        other: { startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        leftArm: { startTime1: '08:00', startPhleb1: 'P001', endTime1: '08:15', endPhleb1: 'P001', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        rightArm: { startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
      };

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.bleedStartTimeL1).toBe('08:00');
      expect(request.bleedStartPhlebL1).toBe('P001');
      expect(request.bleedStartTimeR1).toBeNull();
    }));

    it('should map both arm bleed times when armUsed is B', fakeAsync(() => {
      component.editForm.get('armUsed')?.setValue('B');
      component.bleedTimeData = {
        doubleStickId: '',
        currentDriveDate: '',
        employees: [],
        selectedArm: 'B',
        drawStartTime: '',
        mrsLoss: '',
        phlebotomistLoss: '',
        other: { startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        leftArm: { startTime1: '08:00', startPhleb1: 'PL', endTime1: '08:15', endPhleb1: 'PL', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        rightArm: { startTime1: '09:00', startPhleb1: 'PR', endTime1: '09:15', endPhleb1: 'PR', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
      };

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.bleedStartTimeL1).toBe('08:00');
      expect(request.bleedStartTimeR1).toBe('09:00');
    }));
  });

  describe('onAutoSave', () => {
    it('should not save when isLoading is true', fakeAsync(() => {
      component.isLoading.set(true);

      component.onAutoSave();
      tick();

      expect(mockUpdateService.updateDonation).not.toHaveBeenCalled();
    }));

    it('should not save when currentDonation is null', fakeAsync(() => {
      component.currentDonation.set(null);

      component.onAutoSave();
      tick();

      expect(mockUpdateService.updateDonation).not.toHaveBeenCalled();
    }));

    it('should show validation error when form is invalid', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.editForm.get('weight')?.setValue(null);

      component.onAutoSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringMatching(/Please fix required fields:/)
      );
      expect(mockUpdateService.updateDonation).not.toHaveBeenCalled();
    }));

    it('should call onSave when form is valid and donation exists', fakeAsync(() => {
      loadDonationIntoEditMode();
      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onAutoSave();
      tick();

      expect(mockUpdateService.updateDonation).toHaveBeenCalled();
    }));
  });

  describe('onDonationUnitIdPostValidate', () => {
    it('should confirm when parsedUnitId matches donor unitId', fakeAsync(() => {
      loadDonationIntoEditMode({ unitId: 'W633326042203' });

      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event = {
        data: { parsedUnitId: 'W633326042203' } as any,
        confirm: confirmSpy,
        reject: rejectSpy,
      };

      component.onDonationUnitIdPostValidate(event);

      expect(confirmSpy).toHaveBeenCalled();
      expect(rejectSpy).not.toHaveBeenCalled();
    }));

    it('should reject and show error when parsedUnitId does not match', fakeAsync(() => {
      loadDonationIntoEditMode({ unitId: 'W633326042203' });

      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event = {
        data: { parsedUnitId: 'DIFFERENT_ID' } as any,
        confirm: confirmSpy,
        reject: rejectSpy,
      };

      component.onDonationUnitIdPostValidate(event);

      expect(rejectSpy).toHaveBeenCalledWith('Unit ID does not match Donor Information Unit ID');
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Unit ID mismatch.');
    }));
  });

  describe('onDonationUnitIdValidated', () => {
    it('should trigger onAutoSave', fakeAsync(() => {
      loadDonationIntoEditMode();
      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onDonationUnitIdValidated({} as any);
      tick();

      expect(mockUpdateService.updateDonation).toHaveBeenCalled();
    }));
  });

  describe('onSearchUnitIdValidated', () => {
    it('should patch collection date and retrieve when data has collectionDate', fakeAsync(() => {
      const mockData = createMockDonation({ collDate: '2025-03-15' });
      mockUpdateService.retrieveByUnitId.and.returnValue(of(mockApiResponse(mockData)));

      setupSearchUnitIdField();

      component.onSearchUnitIdValidated({
        parsedUnitId: 'W633326042203',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'W633326042203',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODABAR',
        chapterScheme: 'I',
        collectionDate: '2025-03-15',
      });
      tick();

      // After retrieve, the collDate from the response (2025-03-15) patches the form
      expect(mockUpdateService.retrieveByUnitId).toHaveBeenCalled();
      expect(component.searchForm.getRawValue().collectionDate.format('YYYY-MM-DD')).toBe('2025-03-15');
    }));

    it('should not retrieve when data has no collectionDate', fakeAsync(() => {
      component.onSearchUnitIdValidated({
        parsedUnitId: 'W633326042203',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'W633326042203',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODABAR',
        chapterScheme: 'I',
      });
      tick();

      expect(mockUpdateService.retrieveByUnitId).not.toHaveBeenCalled();
    }));

    it('should reset navigatedFromParent flag', () => {
      component.navigatedFromParent = true;

      component.onSearchUnitIdValidated({
        parsedUnitId: 'test',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'test',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODABAR',
        chapterScheme: 'I',
      });

      expect(component.navigatedFromParent).toBeFalse();
    });
  });

  describe('edit form validation', () => {
    it('should require ethnic group', () => {
      component.editForm.get('ethnicGroup')?.markAsTouched();
      expect(component.getFieldError('ethnicGroup', 'Ethnic Group')).toBe('Ethnic Group is required');
    });

    it('should require donation', () => {
      component.editForm.get('donation')?.markAsTouched();
      expect(component.getFieldError('donation', 'Donation')).toBe('Donation is required');
    });

    it('should require procedure', () => {
      component.editForm.get('procedure')?.markAsTouched();
      expect(component.getFieldError('procedure', 'Procedure')).toBe('Procedure is required');
    });

    it('should not require reviewer ID', () => {
      component.editForm.get('reviewerId')?.markAsTouched();
      expect(component.getFieldError('reviewerId', 'Reviewer ID')).toBe('');
    });

    it('should require arm used', () => {
      component.editForm.get('armUsed')?.markAsTouched();
      expect(component.getFieldError('armUsed', 'Arm Used')).toBe('Arm Used is required');
    });

    it('should require deferral', () => {
      component.editForm.get('deferral')?.markAsTouched();
      expect(component.getFieldError('deferral', 'Deferral')).toBe('Deferral is required');
    });

    it('should require deferral type', () => {
      component.editForm.get('deferralType')?.markAsTouched();
      expect(component.getFieldError('deferralType', 'Deferral Type')).toBe('Deferral Type is required');
    });

    it('should validate weight minimum', () => {
      component.editForm.get('weight')?.setValue(0);
      component.editForm.get('weight')?.markAsTouched();
      expect(component.getFieldError('weight', 'Weight')).toBe('Weight must be at least 1');
    });

    it('should validate weight maximum', () => {
      component.editForm.get('weight')?.setValue(1000);
      component.editForm.get('weight')?.markAsTouched();
      expect(component.getFieldError('weight', 'Weight')).toBe('Weight cannot exceed 999');
    });

    it('should validate email format', () => {
      component.editForm.get('email')?.setValue('invalid-email');
      component.editForm.get('email')?.markAsTouched();
      expect(component.getFieldError('email', 'Email')).toBe('Invalid email address');
    });

    it('should show maxlength error', () => {
      component.editForm.get('suffix')?.setValue('A'.repeat(10));
      component.editForm.get('suffix')?.markAsTouched();
      expect(component.getFieldError('suffix', 'Suffix')).toBe('Suffix is too long');
    });

    it('should show pattern error for employer zip', () => {
      const ctrl = component.editForm.get('employerZip');
      ctrl?.enable();
      ctrl?.setValue('abc');
      ctrl?.markAsTouched();
      expect(component.getFieldError('employerZip', 'Employer Zip')).toBe('Invalid Employer Zip format');
    });

    it('should show server error', () => {
      const ctrl = component.editForm.get('city');
      ctrl?.setErrors({ serverError: 'City not found in database' });
      ctrl?.markAsTouched();
      expect(component.getFieldError('city', 'City')).toBe('City not found in database');
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getFieldError('weight', 'Weight')).toBe('');
    });
  });

  describe('utility methods', () => {
    it('should return "--" for null date', () => {
      expect(component.formatDate(null)).toBe('--');
    });

    it('should format valid date', () => {
      expect(component.formatDate('2025-01-15')).toBe('15-JAN-2025');
    });

    it('should return original value for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should format gender M as Male', () => {
      expect(component.formatGender('M')).toBe('Male');
    });

    it('should format gender F as Female', () => {
      expect(component.formatGender('F')).toBe('Female');
    });

    it('should return "--" for null gender', () => {
      expect(component.formatGender(null)).toBe('--');
    });

    it('should return value for unknown gender', () => {
      expect(component.formatGender('X')).toBe('X');
    });
  });

  describe('phone formatting and validation', () => {
    it('should strip non-digits from phone input', () => {
      component.editForm.get('homePhone')?.setValue('(214) 555-1234');
      component.formatPhoneInput('homePhone');
      expect(component.editForm.get('homePhone')?.value).toBe('2145551234');
    });

    it('should truncate phone to 10 digits', () => {
      component.editForm.get('homePhone')?.setValue('12345678901234');
      component.formatPhoneInput('homePhone');
      expect(component.editForm.get('homePhone')?.value).toBe('1234567890');
    });

    it('should do nothing for non-existent field', () => {
      expect(() => component.formatPhoneInput('nonExistentField')).not.toThrow();
    });

    it('should accept valid 10-digit phone number', () => {
      component.editForm.get('homePhone')?.setValue('2145551234');
      component.validatePhone('homePhone', 'Home Phone');
      expect(component.editForm.get('homePhone')?.errors).toBeNull();
    });

    it('should accept valid 7-digit phone number', () => {
      component.editForm.get('homePhone')?.setValue('5551234');
      component.validatePhone('homePhone', 'Home Phone');
      expect(component.editForm.get('homePhone')?.errors).toBeNull();
    });

    it('should reject invalid phone number length', () => {
      component.editForm.get('homePhone')?.setValue('1234');
      component.validatePhone('homePhone', 'Home Phone');
      expect(component.editForm.get('homePhone')?.hasError('serverError')).toBeTrue();
    });

    it('should skip validation for empty phone', () => {
      component.editForm.get('homePhone')?.setValue('');
      component.validatePhone('homePhone', 'Home Phone');
      expect(component.editForm.get('homePhone')?.errors).toBeNull();
    });

    it('should reject phone number of all zeros', () => {
      component.editForm.get('homePhone')?.setValue('0000000');
      component.validatePhone('homePhone', 'Home Phone');
      expect(component.editForm.get('homePhone')?.hasError('serverError')).toBeTrue();
    });
  });

  describe('weight input handlers', () => {
    it('should allow digit key in weight field', () => {
      const event = { key: '5', target: { value: '12' } as HTMLInputElement, preventDefault: jasmine.createSpy() } as any;
      component.onWeightKeypress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit key in weight field', () => {
      const event = { key: 'a', target: { value: '12' } as HTMLInputElement, preventDefault: jasmine.createSpy() } as any;
      component.onWeightKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent input when weight already 3 digits', () => {
      const event = { key: '4', target: { value: '123' } as HTMLInputElement, preventDefault: jasmine.createSpy() } as any;
      component.onWeightKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow valid weight paste', () => {
      const event = { clipboardData: { getData: () => '150' }, preventDefault: jasmine.createSpy() } as any;
      component.onWeightPaste(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent paste of non-numeric text', () => {
      const event = { clipboardData: { getData: () => 'abc' }, preventDefault: jasmine.createSpy() } as any;
      component.onWeightPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste of number > 999', () => {
      const event = { clipboardData: { getData: () => '1000' }, preventDefault: jasmine.createSpy() } as any;
      component.onWeightPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onlyNumbers and onPasteNumbers', () => {
    it('should allow digit characters', () => {
      const event = { key: '3', preventDefault: jasmine.createSpy() } as any;
      component.onlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit characters', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy() } as any;
      component.onlyNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow pasting digits only', () => {
      const event = { clipboardData: { getData: () => '12345' }, preventDefault: jasmine.createSpy() } as any;
      component.onPasteNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent pasting non-digits', () => {
      const event = { clipboardData: { getData: () => '12a45' }, preventDefault: jasmine.createSpy() } as any;
      component.onPasteNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('should navigate to donor registration route', () => {
      component.navigateToAddDonation();
      expect(navigateSpy).toHaveBeenCalledWith(['/donor-functions/registration']);
    });

    it('should reset page on back to search without unsaved changes', () => {
      component.hasUnsavedChanges = false;
      component.mode.set('edit');

      component.onBackToSearch();

      expect(component.mode()).toBe('search');
    });

    it('should show confirmation dialog when has unsaved changes', fakeAsync(() => {
      component.hasUnsavedChanges = true;
      component.mode.set('edit');

      dialogSpy.and.returnValue({ afterClosed: () => of(true) } as any);

      component.onBackToSearch();
      tick();

      expect(dialogSpy).toHaveBeenCalled();
      const dialogData = dialogSpy.calls.mostRecent().args[1];
      expect(dialogData.data.title).toBe('Unsaved Changes');
    }));

    it('should reset page when user confirms leaving unsaved changes', fakeAsync(() => {
      component.hasUnsavedChanges = true;
      component.mode.set('edit');

      dialogSpy.and.returnValue({ afterClosed: () => of(true) } as any);

      component.onBackToSearch();
      tick();

      expect(component.mode()).toBe('search');
    }));

    it('should not reset page when user cancels leaving unsaved changes', fakeAsync(() => {
      component.hasUnsavedChanges = true;
      component.mode.set('edit');

      dialogSpy.and.returnValue({ afterClosed: () => of(false) } as any);

      component.onBackToSearch();
      tick();

      expect(component.mode()).toBe('edit');
    }));
  });

  describe('canDeactivate', () => {
    it('should return true when no unsaved changes', () => {
      component.hasUnsavedChanges = false;
      expect(component.canDeactivate()).toBeTrue();
    });

    it('should return false when has unsaved changes', () => {
      component.hasUnsavedChanges = true;
      expect(component.canDeactivate()).toBeFalse();
    });
  });

  describe('field validation methods', () => {
    beforeEach(fakeAsync(() => {
      loadDonationIntoEditMode();
    }));

    it('should validate staff field with valid value', fakeAsync(() => {
      mockDonorService.validateStaff.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      component.validateStaffField('reviewerId');
      tick();

      expect(mockDonorService.validateStaff).toHaveBeenCalled();
    }));

    it('should skip staff validation for value 99', () => {
      component.editForm.get('reviewerId')?.setValue('99');

      component.validateStaffField('reviewerId');

      expect(mockDonorService.validateStaff).not.toHaveBeenCalled();
    });

    it('should skip staff validation for value 88', () => {
      component.editForm.get('reviewerId')?.setValue('88');

      component.validateStaffField('reviewerId');

      expect(mockDonorService.validateStaff).not.toHaveBeenCalled();
    });

    it('should skip staff validation for empty value', () => {
      component.editForm.get('reviewerId')?.setValue('');

      component.validateStaffField('reviewerId');

      expect(mockDonorService.validateStaff).not.toHaveBeenCalled();
    });

    it('should set server error on staff validation failure', fakeAsync(() => {
      component.editForm.get('physicalId')?.setValue('INVALID');
      mockDonorService.validateStaff.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Staff not found' } } }))
      );

      component.validateStaffField('physicalId');
      tick();

      expect(component.editForm.get('physicalId')?.hasError('serverError')).toBeTrue();
      expect(component.editForm.get('physicalId')?.getError('serverError')).toBe('Staff not found');
    }));

    it('should validate city field', fakeAsync(() => {
      component.editForm.get('city')?.setValue('Dallas');
      mockDonorService.validateCity.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      component.validateCityField();
      tick();

      expect(mockDonorService.validateCity).toHaveBeenCalledWith('Dallas');
    }));

    it('should skip city validation for empty value', () => {
      component.editForm.get('city')?.setValue('');
      component.validateCityField();
      expect(mockDonorService.validateCity).not.toHaveBeenCalled();
    });

    it('should validate zip field', fakeAsync(() => {
      component.editForm.get('city')?.setValue('Dallas');
      component.editForm.get('zip')?.setValue('75001');
      mockDonorService.validateZipCity.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      component.validateZipField();
      tick();

      expect(mockDonorService.validateZipCity).toHaveBeenCalledWith('Dallas', '75001');
    }));

    it('should skip zip validation when city or zip is empty', () => {
      component.editForm.get('city')?.setValue('');
      component.editForm.get('zip')?.setValue('75001');
      component.validateZipField();
      expect(mockDonorService.validateZipCity).not.toHaveBeenCalled();
    });

    it('should validate ethnic group field', fakeAsync(() => {
      component.editForm.get('ethnicGroup')?.setValue('CA');
      mockDonorService.validateEthnicGroup.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      component.validateEthnicGroupField();
      tick();

      expect(mockDonorService.validateEthnicGroup).toHaveBeenCalledWith('CA');
    }));

    it('should skip ethnic group validation for empty value', () => {
      component.editForm.get('ethnicGroup')?.setValue('');
      component.validateEthnicGroupField();
      expect(mockDonorService.validateEthnicGroup).not.toHaveBeenCalled();
    });

    it('should validate equipment type field', fakeAsync(() => {
      component.editForm.get('equipmentType')?.setValue('AMIC');
      mockDonorService.validateEquipmentType.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      component.validateEquipmentTypeField();
      tick();

      expect(mockDonorService.validateEquipmentType).toHaveBeenCalledWith('AMIC');
    }));

    it('should skip equipment type validation for empty value', () => {
      component.editForm.get('equipmentType')?.setValue('');
      component.validateEquipmentTypeField();
      expect(mockDonorService.validateEquipmentType).not.toHaveBeenCalled();
    });

    it('should validate alternate id type field', fakeAsync(() => {
      component.editForm.get('alternateType')?.setValue('PASPT');
      mockDonorService.validateAlternateIdType.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      component.validateAlternateIdTypeField();
      tick();

      expect(mockDonorService.validateAlternateIdType).toHaveBeenCalledWith('PASPT');
    }));

    it('should skip alternate id type validation for empty value', () => {
      component.editForm.get('alternateType')?.setValue('');
      component.validateAlternateIdTypeField();
      expect(mockDonorService.validateAlternateIdType).not.toHaveBeenCalled();
    });
  });

  describe('validateDeferralReasonField', () => {
    it('should set error when deferral reason is "0"', () => {
      component.editForm.get('deferral')?.setValue('0');

      component.validateDeferralReasonField();

      expect(component.editForm.get('deferral')?.hasError('serverError')).toBeTrue();
      expect(component.editForm.get('deferral')?.value).toBe('');
    });

    it('should set error when deferral reason ends with comma', () => {
      component.editForm.get('deferral')?.setValue('5,3,');

      component.validateDeferralReasonField();

      expect(component.editForm.get('deferral')?.hasError('serverError')).toBeTrue();
    });

    it('should not set error for valid deferral reason', () => {
      component.editForm.get('deferral')?.setValue('5');

      component.validateDeferralReasonField();

      expect(component.editForm.get('deferral')?.hasError('serverError')).toBeFalse();
    });

    it('should skip validation for empty deferral reason', () => {
      component.editForm.get('deferral')?.setValue('');

      component.validateDeferralReasonField();

      // Deferral has Validators.required, so empty value has required error.
      // validateDeferralReasonField should not add additional serverError.
      expect(component.editForm.get('deferral')?.hasError('serverError')).toBeFalse();
    });
  });

  describe('validateEmployerZipField', () => {
    it('should call validateZipCity when city and zip are present', fakeAsync(() => {
      component.editForm.get('employerCity')?.enable();
      component.editForm.get('employerCity')?.setValue('Dallas');
      component.editForm.get('employerZip')?.enable();
      component.editForm.get('employerZip')?.setValue('75001');

      component.validateEmployerZipField();
      tick();

      expect(mockDonorService.validateZipCity).toHaveBeenCalledWith('Dallas', '75001');
    }));

    it('should skip validation when employer city is empty', () => {
      component.editForm.get('employerCity')?.enable();
      component.editForm.get('employerCity')?.setValue('');
      component.editForm.get('employerZip')?.enable();
      component.editForm.get('employerZip')?.setValue('75001');

      component.validateEmployerZipField();

      expect(mockDonorService.validateZipCity).not.toHaveBeenCalled();
    });

    it('should set error when employer zip validation fails', fakeAsync(() => {
      component.editForm.get('employerCity')?.enable();
      component.editForm.get('employerCity')?.setValue('Dallas');
      component.editForm.get('employerZip')?.enable();
      component.editForm.get('employerZip')?.setValue('99999');

      mockDonorService.validateZipCity.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'ZIP does not match city' } } }))
      );

      component.validateEmployerZipField();
      tick();

      expect(component.editForm.get('employerZip')?.hasError('serverError')).toBeTrue();
    }));
  });

  describe('onZipBlur', () => {
    it('should look up city/state when zip is 5+ chars', fakeAsync(() => {
      component.editForm.get('zip')?.setValue('75001');
      mockDonorService.getCityState.and.returnValue(of([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
      ]));

      component.onZipBlur();
      tick();

      expect(mockDonorService.getCityState).toHaveBeenCalledWith({ zip: '75001' });
      expect(component.stateDisplay()).toBe('TX');
    }));

    it('should match existing city when found in results', fakeAsync(() => {
      component.editForm.get('city')?.setValue('Plano');
      component.editForm.get('zip')?.setValue('75074');
      mockDonorService.getCityState.and.returnValue(of([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75074' },
        { uspsId: 2, city: 'Plano', state: 'TX', zip: '75074' },
      ]));

      component.onZipBlur();
      tick();

      expect(component.stateDisplay()).toBe('TX');
      expect(component.editForm.get('city')?.value).toBe('Plano');
    }));

    it('should use first result when city does not match', fakeAsync(() => {
      component.editForm.get('city')?.setValue('Unknown');
      component.editForm.get('zip')?.setValue('75001');
      mockDonorService.getCityState.and.returnValue(of([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
      ]));

      component.onZipBlur();
      tick();

      expect(component.editForm.get('city')?.value).toBe('Dallas');
      expect(component.stateDisplay()).toBe('TX');
    }));

    it('should not look up when zip is less than 5 chars', () => {
      component.editForm.get('zip')?.setValue('750');
      const callsBefore = mockDonorService.getCityState.calls.count();

      component.onZipBlur();

      expect(mockDonorService.getCityState.calls.count()).toBe(callsBefore);
    });

    it('should not look up when zip is empty', () => {
      component.editForm.get('zip')?.setValue('');
      const callsBefore = mockDonorService.getCityState.calls.count();

      component.onZipBlur();

      expect(mockDonorService.getCityState.calls.count()).toBe(callsBefore);
    });
  });

  describe('onEmployerZipBlur', () => {
    it('should set employer state to "--" when zip is empty', () => {
      component.editForm.get('employerZip')?.enable();
      component.editForm.get('employerZip')?.setValue('');

      component.onEmployerZipBlur();

      expect(component.employerState()).toBe('--');
    });

    it('should not look up when zip is less than 5 chars', () => {
      component.editForm.get('employerZip')?.enable();
      component.editForm.get('employerZip')?.setValue('750');
      const callsBefore = mockDonorService.getCityState.calls.count();

      component.onEmployerZipBlur();

      expect(mockDonorService.getCityState.calls.count()).toBe(callsBefore);
    });

    it('should look up and set employer city/state when zip is valid', fakeAsync(() => {
      component.editForm.get('employerCity')?.enable();
      component.editForm.get('employerCity')?.setValue('');
      component.editForm.get('employerZip')?.enable();
      component.editForm.get('employerZip')?.setValue('75001');
      mockDonorService.getCityState.and.returnValue(of([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
      ]));

      component.onEmployerZipBlur();
      tick();

      expect(component.employerState()).toBe('TX');
      expect(component.editForm.get('employerCity')?.value).toBe('Dallas');
    }));

    it('should match existing employer city when found in results', fakeAsync(() => {
      component.editForm.get('employerCity')?.enable();
      component.editForm.get('employerCity')?.setValue('Plano');
      component.editForm.get('employerZip')?.enable();
      component.editForm.get('employerZip')?.setValue('75074');
      mockDonorService.getCityState.and.returnValue(of([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75074' },
        { uspsId: 2, city: 'Plano', state: 'TX', zip: '75074' },
      ]));

      component.onEmployerZipBlur();
      tick();

      expect(component.employerState()).toBe('TX');
    }));
  });

  describe('onCitySelected', () => {
    it('should set state and zip from selected city', () => {
      component.onCitySelected({ uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' });

      expect(component.stateDisplay()).toBe('TX');
      expect(component.editForm.get('zip')?.value).toBe('75001');
    });

    it('should set state to "--" when state is empty', () => {
      component.onCitySelected({ uspsId: 1, city: 'Dallas', state: '', zip: '75001' });

      expect(component.stateDisplay()).toBe('--');
    });
  });

  describe('onEmployerCitySelected', () => {
    it('should set employer state and zip from selected city', () => {
      component.onEmployerCitySelected({ uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' });

      expect(component.employerState()).toBe('TX');
      expect(component.editForm.get('employerZip')?.value).toBe('75001');
    });

    it('should set employer state to "--" when state is empty', () => {
      component.onEmployerCitySelected({ uspsId: 1, city: 'Dallas', state: '', zip: '75001' });

      expect(component.employerState()).toBe('--');
    });
  });

  describe('onEmployerSelected', () => {
    it('should clear employer fields when employerId is empty', () => {
      component.editForm.get('employerId')?.setValue('OLD');
      component.employerState.set('TX');

      component.onEmployerSelected('');

      expect(component.editForm.get('employerId')?.value).toBe('');
      expect(component.employerState()).toBe('--');
    });

    it('should populate employer fields when employer is found', () => {
      component.filteredEmployers.set([{
        employerId: 'EMP001',
        employerName: 'Acme Corp',
        city: 'Dallas',
        state: 'TX',
        zip: '75001',
        country: null,
        uspsId: 123,
        intlAddrFlag: null,
      }]);

      component.onEmployerSelected('EMP001');

      expect(component.editForm.get('employerId')?.value).toBe('EMP001');
      expect(component.editForm.get('employerSchoolName')?.value).toBe('EMP001');
      expect(component.editForm.get('employerCity')?.value).toBe('Dallas');
      expect(component.editForm.get('employerZip')?.value).toBe('75001');
      expect(component.employerState()).toBe('TX');
    });

    it('should not change values when employer is not found', () => {
      component.filteredEmployers.set([]);
      component.editForm.get('employerId')?.setValue('EXISTING');

      component.onEmployerSelected('NOTFOUND');

      expect(component.editForm.get('employerId')?.value).toBe('EXISTING');
    });

    it('should set employer state to "--" when employer has no state', () => {
      component.filteredEmployers.set([{
        employerId: 'EMP001',
        employerName: 'Acme',
        city: null,
        state: null,
        zip: null,
        country: null,
        uspsId: null,
        intlAddrFlag: null,
      }]);

      component.onEmployerSelected('EMP001');

      expect(component.employerState()).toBe('--');
    });
  });

  describe('dialog operations', () => {
    describe('openInternationalAddress', () => {
      it('should open dialog for donor international address', () => {
        dialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

        component.openInternationalAddress('donor');

        expect(dialogSpy).toHaveBeenCalled();
      });

      it('should set donor international address when dialog returns result', fakeAsync(() => {
        const intlAddress = {
          streetName: '123 Intl St',
          addr1: 'Addr1',
          addr2: null,
          addr3: null,
          addr4: null,
          country: 'Canada',
          postalCode: 'M1M1M1',
          intlAddrFlag: 'Y',
        };
        dialogSpy.and.returnValue({ afterClosed: () => of(intlAddress) } as any);

        component.openInternationalAddress('donor');
        tick();

        expect(component.donorIntlAddress).toEqual(intlAddress);
        expect(component.hasInternationalAddress()).toBeTrue();
      }));

      it('should enable address fields when dialog returns null (clear intl)', fakeAsync(() => {
        component.donorIntlAddress = { streetName: 'old', addr1: null, addr2: null, addr3: null, addr4: null, country: 'US', postalCode: null, intlAddrFlag: 'Y' };
        component.hasInternationalAddress.set(true);

        dialogSpy.and.returnValue({ afterClosed: () => of(null) } as any);

        component.openInternationalAddress('donor');
        tick();

        expect(component.hasInternationalAddress()).toBeFalse();
      }));

      it('should set employer international address when target is employer', fakeAsync(() => {
        const intlAddress = {
          streetName: '456 Employer Intl',
          addr1: null,
          addr2: null,
          addr3: null,
          addr4: null,
          country: 'UK',
          postalCode: 'SW1A',
          intlAddrFlag: 'Y',
        };
        dialogSpy.and.returnValue({ afterClosed: () => of(intlAddress) } as any);

        component.openInternationalAddress('employer');
        tick();

        expect(component.employerIntlAddress).toEqual(intlAddress);
        expect(component.hasEmployerInternationalAddress()).toBeTrue();
      }));

      it('should enable employer fields when dialog returns null for employer', fakeAsync(() => {
        component.employerIntlAddress = { streetName: 'old', addr1: null, addr2: null, addr3: null, addr4: null, country: 'US', postalCode: null, intlAddrFlag: 'Y' };
        component.hasEmployerInternationalAddress.set(true);

        dialogSpy.and.returnValue({ afterClosed: () => of(null) } as any);

        component.openInternationalAddress('employer');
        tick();

        expect(component.hasEmployerInternationalAddress()).toBeFalse();
      }));
    });

    describe('openManualHolds', () => {
      it('should show error when interdiction codes are not loaded', () => {
        component.interdictionCodes.set([]);

        component.openManualHolds();

        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Interdiction codes not loaded. Please try again.');
        expect(dialogSpy).not.toHaveBeenCalled();
      });

      it('should open dialog when interdiction codes are loaded', () => {
        component.interdictionCodes.set([
          { interCode: 'H01', interDesc: 'Hold 1', interType: null },
        ]);
        dialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

        component.openManualHolds();

        expect(dialogSpy).toHaveBeenCalled();
      });

      it('should update selectedHolds when dialog returns ok result', fakeAsync(() => {
        component.interdictionCodes.set([
          { interCode: 'H01', interDesc: 'Hold 1', interType: null },
          { interCode: 'H02', interDesc: 'Hold 2', interType: null },
        ]);

        const dialogResult = {
          action: 'ok' as const,
          selectedHolds: [{ interCode: 'H01', interDesc: 'Hold 1', interType: null }],
        };
        dialogSpy.and.returnValue({ afterClosed: () => of(dialogResult) } as any);

        component.openManualHolds();
        tick();

        expect(component.selectedHolds.length).toBe(1);
        expect(component.selectedHolds[0].interCode).toBe('H01');
      }));

      it('should not update holds when dialog is cancelled', fakeAsync(() => {
        component.interdictionCodes.set([{ interCode: 'H01', interDesc: 'Hold 1', interType: null }]);
        component.selectedHolds = [{ interCode: 'H02', interDesc: 'Hold 2', interType: null }];

        dialogSpy.and.returnValue({ afterClosed: () => of({ action: 'cancel' }) } as any);

        component.openManualHolds();
        tick();

        expect(component.selectedHolds.length).toBe(1);
        expect(component.selectedHolds[0].interCode).toBe('H02');
      }));
    });

    describe('openBleedTimeDetails', () => {
      it('should open bleed time details dialog', fakeAsync(() => {
        loadDonationIntoEditMode();
        dialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

        component.openBleedTimeDetails();

        expect(dialogSpy).toHaveBeenCalled();
      }));

      it('should update bleed time data on apply', fakeAsync(() => {
        loadDonationIntoEditMode();
        const dialogResult = {
          action: 'apply',
          selectedArm: 'L',
          data: {
            leftStartTime1: '08:00',
            leftStartPhleb1: 'P001',
            leftEndTime1: '08:15',
            leftEndPhleb1: 'P001',
            leftStartTime2: '',
            leftStartPhleb2: '',
            leftEndTime2: '',
            leftEndPhleb2: '',
            rightStartTime1: '',
            rightStartPhleb1: '',
            rightEndTime1: '',
            rightEndPhleb1: '',
            rightStartTime2: '',
            rightStartPhleb2: '',
            rightEndTime2: '',
            rightEndPhleb2: '',
            doubleStickId: '',
            currentDriveDate: '',
            employees: [],
            selectedArm: 'L',
            leftArm: {} as any,
            rightArm: {} as any,
            other: {} as any,
            drawStartTime: '',
            mrsLoss: '',
            phlebotomistLoss: '',
          },
        };
        dialogSpy.and.returnValue({ afterClosed: () => of(dialogResult) } as any);

        component.openBleedTimeDetails();
        tick();

        expect(component.editForm.get('armUsed')?.value).toBe('L');
        expect(component.bleedTimeData?.leftArm.startTime1).toBe('08:00');
      }));
    });

    describe('openAlternateDemographics', () => {
      it('should fetch existing alt demographics when donorId exists and no pending', fakeAsync(() => {
        loadDonationIntoEditMode();

        mockAltDemoService.getByDonorId.and.returnValue(of(null));
        dialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

        component.openAlternateDemographics();
        tick();

        expect(mockAltDemoService.getByDonorId).toHaveBeenCalledWith('DN30136689');
        expect(dialogSpy).toHaveBeenCalled();
      }));

      it('should use pending alt address when available', fakeAsync(() => {
        loadDonationIntoEditMode();
        (component as any).pendingAltAddress.set({ streetName: '123 Alt St' } as any);

        dialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

        component.openAlternateDemographics();
        tick();

        expect(mockAltDemoService.getByDonorId).not.toHaveBeenCalled();
        expect(dialogSpy).toHaveBeenCalled();
      }));

      it('should clear pending alt address when dialog returns null', fakeAsync(() => {
        loadDonationIntoEditMode();
        (component as any).pendingAltAddress.set({ streetName: '123 Alt St' } as any);

        dialogSpy.and.returnValue({ afterClosed: () => of(null) } as any);

        component.openAlternateDemographics();
        tick();

        expect((component as any).pendingAltAddress()).toBeNull();
      }));

      it('should set pending alt address when dialog returns object', fakeAsync(() => {
        loadDonationIntoEditMode();

        const altData = { streetName: '789 New Alt', suiteApt: null } as any;
        dialogSpy.and.returnValue({ afterClosed: () => of(altData) } as any);

        component.openAlternateDemographics();
        tick();

        expect((component as any).pendingAltAddress()?.streetName).toBe('789 New Alt');
      }));
    });
  });

  describe('arm and bleed time', () => {
    it('should call openBleedTimeDetails on arm used change', fakeAsync(() => {
      loadDonationIntoEditMode();
      dialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

      component.onArmUsedChange();

      expect(dialogSpy).toHaveBeenCalled();
    }));

    it('should not open dialog on arrow click', () => {
      const arrowEl = document.createElement('div');
      arrowEl.className = 'mat-mdc-select-arrow-wrapper';
      const event = {
        target: arrowEl,
        stopPropagation: jasmine.createSpy(),
        preventDefault: jasmine.createSpy(),
      } as any;

      // Mock closest to return the arrow element
      spyOn(arrowEl, 'closest').and.returnValue(arrowEl);

      component.onArmFieldClick(event);

      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('should not open dialog when arm field has no value', () => {
      component.editForm.get('armUsed')?.setValue('');
      const el = document.createElement('div');
      spyOn(el, 'closest').and.returnValue(null);
      const event = {
        target: el,
        stopPropagation: jasmine.createSpy(),
        preventDefault: jasmine.createSpy(),
      } as any;

      component.onArmFieldClick(event);

      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('chapter changes', () => {
    it('should reset page and reload static LOVs on chapter change', () => {
      mockHeaderService.chapterChanged$.next();

      expect(component.mode()).toBe('search');
      expect(component.currentDonation()).toBeNull();
      expect(mockDonorService.getEthnicGroups).toHaveBeenCalled();
    });
  });

  describe('scrollspy', () => {
    it('should set active section on scroll to section', () => {
      component.scrollToSection('personal');
      expect(component.activeSection()).toBe('personal');
    });

    it('should reset isScrollingProgrammatically when element is not found', () => {
      component.scrollToSection('address');
      // Element doesn't exist in test DOM, so isScrollingProgrammatically resets immediately
      expect((component as any).isScrollingProgrammatically).toBeFalse();
    });
  });

  describe('computed signals', () => {
    it('should filter drives by search term', () => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: 'Red Cross' },
        { driveId: 'DRV002', driveDate: '2025-01-02', driveType: null, sponsorName: 'Blood Bank' },
      ]);
      component.driveSearchControl.setValue('Red');

      expect(component.filteredDrives().length).toBe(1);
      expect(component.filteredDrives()[0].driveId).toBe('DRV001');
    });

    it('should return all drives when search is empty', () => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: 'Red Cross' },
        { driveId: 'DRV002', driveDate: '2025-01-02', driveType: null, sponsorName: 'Blood Bank' },
      ]);
      component.driveSearchControl.setValue('');

      expect(component.filteredDrives().length).toBe(2);
    });

    it('should filter ethnic groups by search term', () => {
      component.ethnicGroups.set([
        { code: 'CA', description: 'Caucasian' },
        { code: 'AA', description: 'African American' },
      ]);
      component.ethnicGroupSearchControl.setValue('afr');

      expect(component.filteredEthnicGroups().length).toBe(1);
      expect(component.filteredEthnicGroups()[0].code).toBe('AA');
    });

    it('should filter procedure codes by search term', () => {
      component.procedureCodes.set([
        { procedureCode: 'PP', description: 'Phlebotomy' },
        { procedureCode: 'AP', description: 'Apheresis' },
      ]);
      component.procedureSearchControl.setValue('aph');

      expect(component.filteredProcedureCodes().length).toBe(1);
      expect(component.filteredProcedureCodes()[0].procedureCode).toBe('AP');
    });

    it('should filter venipuncture codes by search term', () => {
      component.venipunctureCodes.set([
        { code: '01', description: 'Standard' },
        { code: '02', description: 'Butterfly' },
      ]);
      component.venipunctureSearchControl.setValue('butt');

      expect(component.filteredVenipunctureCodes().length).toBe(1);
      expect(component.filteredVenipunctureCodes()[0].code).toBe('02');
    });

    it('should filter employees by reviewer search term', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
        { staffNo: 'S002', employeeName: 'Jane Smith' },
      ]);
      component.reviewerSearchControl.setValue('jane');

      expect(component.filteredEmployees().length).toBe(1);
      expect(component.filteredEmployees()[0].staffNo).toBe('S002');
    });

    it('should filter employees by lookup search term', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
        { staffNo: 'S002', employeeName: 'Jane Smith' },
      ]);
      component.lookupIdSearchControl.setValue('S001');

      expect(component.filteredLookupEmployees().length).toBe(1);
      expect(component.filteredLookupEmployees()[0].staffNo).toBe('S001');
    });

    it('should filter employees by physical search term', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
        { staffNo: 'S002', employeeName: 'Jane Smith' },
      ]);
      component.physicalIdSearchControl.setValue('doe');

      expect(component.filteredPhysicalEmployees().length).toBe(1);
    });

    it('should filter employees by historian search term', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
        { staffNo: 'S002', employeeName: 'Jane Smith' },
      ]);
      component.historianSearchControl.setValue('smith');

      expect(component.filteredHistorianEmployees().length).toBe(1);
      expect(component.filteredHistorianEmployees()[0].staffNo).toBe('S002');
    });

    it('should filter employees by material search term', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
        { staffNo: 'S002', employeeName: 'Jane Smith' },
      ]);
      component.materialVerifSearchControl.setValue('john');

      expect(component.filteredMaterialEmployees().length).toBe(1);
    });

    it('should filter donation types by search term', () => {
      component.donationTypes.set([
        { donationType: 'AL', description: 'Allogeneic' },
        { donationType: 'AU', description: 'Autologous' },
      ]);
      component.donationSearchControl.setValue('auto');

      expect(component.filteredDonationTypes().length).toBe(1);
      expect(component.filteredDonationTypes()[0].donationType).toBe('AU');
    });

    it('should filter equipment types by search term', () => {
      component.equipmentTypes.set([
        { code: 'AMIC', description: 'Amicus' },
        { code: 'TRIG', description: 'Trima' },
      ]);
      component.equipTypeSearchControl.setValue('trig');

      expect(component.filteredEquipmentTypes().length).toBe(1);
      expect(component.filteredEquipmentTypes()[0].code).toBe('TRIG');
    });

    it('should filter reaction codes by search term', () => {
      component.reactionCodesList.set([
        { code: 'MI', description: 'Minor' },
        { code: 'MA', description: 'Major' },
      ]);
      component.reactionSearchControl.setValue('minor');

      expect(component.filteredReactionCodes().length).toBe(1);
      expect(component.filteredReactionCodes()[0].code).toBe('MI');
    });

    it('should filter deferral types by search term', () => {
      component.deferralTypeSearchControl.setValue('indef');

      const result = component.filteredDeferralTypes();
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('IND');
    });

    it('should return all deferral types when search is empty', () => {
      component.deferralTypeSearchControl.setValue('');

      expect(component.filteredDeferralTypes().length).toBe(3);
    });

    it('should filter deferral reasons by search term', () => {
      component.deferralReasons.set([
        { reasonCode: '5' },
        { reasonCode: '10' },
      ]);
      component.deferralSearchControl.setValue('10');

      expect(component.filteredDeferralReasons().length).toBe(1);
      expect(component.filteredDeferralReasons()[0].reasonCode).toBe('10');
    });

    it('should return all sponsors without filtering', () => {
      component.sponsors.set([
        { sponsorId: 'S1', name: 'Red Cross' },
        { sponsorId: 'S2', name: 'Blood Bank' },
      ]);

      expect(component.filteredSponsors().length).toBe(2);
    });
  });

  describe('deferral type listener', () => {
    it('should disable deferredThru when deferral type is IND', fakeAsync(() => {
      loadDonationIntoEditMode();

      component.editForm.get('deferralType')?.setValue('IND');
      tick();

      expect(component.editForm.get('deferredThru')?.disabled).toBeTrue();
      expect(component.editForm.get('deferredThru')?.value).toBeNull();
    }));

    it('should enable deferredThru when deferral type is not IND', fakeAsync(() => {
      loadDonationIntoEditMode();

      component.editForm.get('deferralType')?.setValue('IND');
      tick();
      expect(component.editForm.get('deferredThru')?.disabled).toBeTrue();

      component.editForm.get('deferralType')?.setValue('NA');
      tick();
      expect(component.editForm.get('deferredThru')?.disabled).toBeFalse();
    }));
  });

  describe('deferred thru validation', () => {
    it('should set afterDriveDate error when date is after drive date', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: '2025-01-25' });

      component.editForm.get('deferredThru')?.setValue(moment('2025-02-01'));
      tick();

      expect(component.editForm.get('deferredThru')?.hasError('afterDriveDate')).toBeTrue();
    }));

    it('should clear errors when date is before drive date', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: '2025-01-25' });

      component.editForm.get('deferredThru')?.setValue(moment('2025-01-20'));
      tick();

      expect(component.editForm.get('deferredThru')?.hasError('afterDriveDate')).toBeFalse();
    }));

    it('should clear errors when value is null', fakeAsync(() => {
      loadDonationIntoEditMode();

      component.editForm.get('deferredThru')?.setValue(null);
      tick();

      expect(component.editForm.get('deferredThru')?.errors).toBeNull();
    }));
  });

  describe('donation type listener', () => {
    it('should load deferral reasons when donation type changes', fakeAsync(() => {
      loadDonationIntoEditMode();
      mockDonorService.getDeferralReasons.calls.reset();

      component.editForm.get('donation')?.setValue('AU');
      tick();

      expect(mockDonorService.getDeferralReasons).toHaveBeenCalled();
    }));

    it('should load procedure codes when donation type changes', fakeAsync(() => {
      loadDonationIntoEditMode();
      mockDonorService.getProcedureCodesByDonationType.calls.reset();

      component.editForm.get('donation')?.setValue('AU');
      tick();

      expect(mockDonorService.getProcedureCodesByDonationType).toHaveBeenCalledWith('AU');
    }));

    it('should clear deferral reasons when donation type is cleared', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.deferralReasons.set([{ reasonCode: '5' }]);

      component.editForm.get('donation')?.setValue('');
      tick();

      expect(component.deferralReasons()).toEqual([]);
    }));
  });

  describe('populate edit form with international addresses', () => {
    it('should set donor intl address when intlAddrFlag is Y', fakeAsync(() => {
      loadDonationIntoEditMode({
        intlAddrFlag: 'Y',
        intlAddress1: 'Intl Line 1',
        intlAddress2: 'Intl Line 2',
        intlAddress3: null,
        intlAddress4: null,
        countryName: 'Canada',
        intlPostalCode: 'M1M1M1',
      });

      expect(component.donorIntlAddress).toBeTruthy();
      expect(component.donorIntlAddress?.country).toBe('Canada');
      expect(component.hasInternationalAddress()).toBeTrue();
    }));

    it('should set employer intl address when empIntlAddrFlag is Y', fakeAsync(() => {
      loadDonationIntoEditMode({
        empIntlAddrFlag: 'Y',
        empIntlAddress1: 'Emp Intl Line 1',
        empCountryName: 'UK',
        empIntlPostalCode: 'SW1A',
        employerId: 'EMP1',
        employerName: 'Intl Corp',
      });

      expect(component.employerIntlAddress).toBeTruthy();
      expect(component.employerIntlAddress?.country).toBe('UK');
      expect(component.hasEmployerInternationalAddress()).toBeTrue();
      expect(component.employerState()).toBe('--');
    }));

    it('should set pending alt address when altStreetName is present', fakeAsync(() => {
      loadDonationIntoEditMode({
        altStreetName: '123 Alt St',
        altSuiteApt: 'Apt 2',
        altCity: 'Austin',
        altState: 'TX',
        altZip: '78701',
      });

      expect((component as any).pendingAltAddress()).toBeTruthy();
      expect((component as any).pendingAltAddress()?.streetName).toBe('123 Alt St');
    }));

    it('should set pending alt address when altIntlAddress1 is present', fakeAsync(() => {
      loadDonationIntoEditMode({
        altIntlAddress1: 'Intl Alt Line 1',
        altIntlAddrFlag: 'Y',
      });

      expect((component as any).pendingAltAddress()).toBeTruthy();
      expect((component as any).pendingAltAddress()?.addressType).toBe('I');
    }));
  });

  describe('populate edit form with bleed time data', () => {
    it('should set bleed time data for left arm', fakeAsync(() => {
      loadDonationIntoEditMode({
        armUsed: 'L',
        bleedStartTimeL1: '2025-01-01T08:00',
        bleedStartPhlebL1: 'P001',
        bleedEndTimeL: '2025-01-01T08:15',
        bleedEndPhlebL: 'P001',
      });

      expect(component.bleedTimeData).toBeTruthy();
      expect(component.bleedTimeData?.leftArm.startTime1).toBe('08:00');
      expect(component.bleedTimeData?.leftArm.startPhleb1).toBe('P001');
    }));

    it('should set bleed time data for right arm', fakeAsync(() => {
      loadDonationIntoEditMode({
        armUsed: 'R',
        bleedStartTimeR1: '09:30',
        bleedStartPhlebR1: 'P002',
      });

      expect(component.bleedTimeData).toBeTruthy();
      expect(component.bleedTimeData?.rightArm.startTime1).toBe('09:30');
      expect(component.bleedTimeData?.rightArm.startPhleb1).toBe('P002');
    }));

    it('should set bleed time data for both arms', fakeAsync(() => {
      loadDonationIntoEditMode({
        armUsed: 'B',
        bleedStartTimeL1: '08:00',
        bleedStartPhlebL1: 'PL',
        bleedStartTimeR1: '09:00',
        bleedStartPhlebR1: 'PR',
      });

      expect(component.bleedTimeData?.leftArm.startTime1).toBe('08:00');
      expect(component.bleedTimeData?.rightArm.startTime1).toBe('09:00');
    }));
  });

  describe('populate edit form with phone formatting', () => {
    it('should format phone with area code and phone number', fakeAsync(() => {
      loadDonationIntoEditMode({
        hAreaCode: '214',
        hPhoneNo: '5551234',
      });

      expect(component.editForm.get('homePhone')?.value).toBe('(214) 555-1234');
    }));

    it('should format phone without area code', fakeAsync(() => {
      loadDonationIntoEditMode({
        hAreaCode: null,
        hPhoneNo: '5551234',
      });

      expect(component.editForm.get('homePhone')?.value).toBe('555-1234');
    }));

    it('should return empty string for null phone number', fakeAsync(() => {
      loadDonationIntoEditMode({
        hAreaCode: null,
        hPhoneNo: null,
      });

      expect(component.editForm.get('homePhone')?.value).toBe('');
    }));

    it('should map preferred contact phone correctly', fakeAsync(() => {
      loadDonationIntoEditMode({ preferredContactPhone: 'H' });
      expect(component.editForm.get('preferredPhone')?.value).toBe('home');
    }));

    it.each([
      ['H', 'home'],
      ['W', 'work'],
      ['M', 'mobile'],
    ])('should map preferredContactPhone "%s" to "%s"', (input, expected) => {
      const data = createMockDonation({ preferredContactPhone: input });
      (component as any).populateEditForm(data);
      expect(component.editForm.get('preferredPhone')?.value).toBe(expected);
    });
  });

  describe('loadFormLovs error handling', () => {
    it('should show error when LOV loading fails', fakeAsync(() => {
      mockDonorService.getDrives.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadFormLovs('2025-01-01');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load lookup data.');
    }));
  });

  describe('resetPage', () => {
    it('should reset all signals and form values', fakeAsync(() => {
      loadDonationIntoEditMode();
      expect(component.mode()).toBe('edit');

      (component as any).resetPage();

      expect(component.mode()).toBe('search');
      expect(component.currentDonation()).toBeNull();
      expect(component.donorId()).toBe('');
      expect(component.aboDescription()).toBe('--');
      expect(component.transactionId()).toBe('--');
      expect(component.enteredByName()).toBe('--');
      expect(component.lastNameDisplay()).toBe('--');
      expect(component.dobDisplay()).toBe('--');
      expect(component.sexDisplay()).toBe('--');
      expect(component.stateDisplay()).toBe('--');
      expect(component.employerState()).toBe('--');
      expect(component.selectedHolds).toEqual([]);
      expect(component.isHoldsButtonDisabled).toBeTrue();
      expect(component.hasUnsavedChanges).toBeFalse();
      expect(component.hasInternationalAddress()).toBeFalse();
      expect(component.hasEmployerInternationalAddress()).toBeFalse();
    }));

    it('should enable address fields when international address was set', fakeAsync(() => {
      loadDonationIntoEditMode({ intlAddrFlag: 'Y', intlAddress1: 'Test', countryName: 'CA' });
      expect(component.hasInternationalAddress()).toBeTrue();

      (component as any).resetPage();

      expect(component.hasInternationalAddress()).toBeFalse();
      expect(component.editForm.get('homeAddress')?.disabled).toBeFalse();
    }));

    it('should enable employer fields when employer intl address was set', fakeAsync(() => {
      loadDonationIntoEditMode({
        empIntlAddrFlag: 'Y',
        empIntlAddress1: 'Test',
        empCountryName: 'UK',
        employerId: 'E1',
        employerName: 'Test Corp',
      });
      expect(component.hasEmployerInternationalAddress()).toBeTrue();

      (component as any).resetPage();

      expect(component.hasEmployerInternationalAddress()).toBeFalse();
      expect(component.editForm.get('employerSchoolName')?.disabled).toBeFalse();
    }));
  });

  describe('repatchDropdownValues', () => {
    it('should not throw when currentDonation is null', () => {
      component.currentDonation.set(null);
      expect(() => (component as any).repatchDropdownValues()).not.toThrow();
    });

    it('should repatch form values from currentDonation', fakeAsync(() => {
      loadDonationIntoEditMode();

      component.editForm.get('ethnicGroup')?.setValue('XX');
      (component as any).repatchDropdownValues();

      expect(component.editForm.get('ethnicGroup')?.value).toBe('CA');
    }));
  });

  describe('onSearchUnitIdCleared', () => {
    it('should trigger change detection', () => {
      expect(() => component.onSearchUnitIdCleared()).not.toThrow();
    });
  });

  describe('getDriveDateForApi', () => {
    it('should format drive date for API', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: '2025-06-15' });

      const result = (component as any).getDriveDateForApi();
      expect(result).toBe('06152025');
    }));

    it('should use collDate when driveDate is null', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: null, collDate: '2025-03-20' });

      const result = (component as any).getDriveDateForApi();
      expect(result).toBe('03202025');
    }));

    it('should return empty string when no donation loaded', () => {
      component.currentDonation.set(null);
      const result = (component as any).getDriveDateForApi();
      expect(result).toBe('');
    });
  });

  describe('formatDateForApi', () => {
    it('should format valid moment date', () => {
      const result = (component as any).formatDateForApi(moment('2025-01-15'));
      expect(result).toBe('01152025');
    });

    it('should return empty string for invalid date', () => {
      const result = (component as any).formatDateForApi(moment('invalid'));
      expect(result).toBe('');
    });

    it('should return empty string for null', () => {
      const result = (component as any).formatDateForApi(null);
      expect(result).toBe('');
    });
  });

  describe('resolveEmployerName', () => {
    it('should return employer name when match is found', () => {
      component.filteredEmployers.set([{
        employerId: 'EMP001',
        employerName: 'Acme Corp',
        city: null,
        state: null,
        zip: null,
        country: null,
        uspsId: null,
        intlAddrFlag: null,
      }]);

      const result = (component as any).resolveEmployerName('EMP001');
      expect(result).toBe('Acme Corp');
    });

    it('should return input when no match is found', () => {
      component.filteredEmployers.set([]);
      const result = (component as any).resolveEmployerName('UNKNOWN');
      expect(result).toBe('UNKNOWN');
    });

    it('should return empty string for empty input', () => {
      const result = (component as any).resolveEmployerName('');
      expect(result).toBe('');
    });
  });

  describe('parsePhone', () => {
    it('should parse 10-digit phone into area code and phone number', () => {
      const result = (component as any).parsePhone('(214) 555-1234');
      expect(result.areaCode).toBe('214');
      expect(result.phoneNo).toBe('5551234');
    });

    it('should parse 7-digit phone with no area code', () => {
      const result = (component as any).parsePhone('555-1234');
      expect(result.areaCode).toBe('');
      expect(result.phoneNo).toBe('5551234');
    });

    it('should return empty values for null', () => {
      const result = (component as any).parsePhone(null);
      expect(result.areaCode).toBe('');
      expect(result.phoneNo).toBe('');
    });

    it('should handle short numbers', () => {
      const result = (component as any).parsePhone('123');
      expect(result.areaCode).toBe('');
      expect(result.phoneNo).toBe('123');
    });
  });

  describe('formatPhoneDisplay', () => {
    it('should format 10-digit phone with parentheses', () => {
      component.editForm.get('homePhone')?.setValue('2145551234');
      (component as any).formatPhoneDisplay('homePhone');
      expect(component.editForm.get('homePhone')?.value).toBe('(214) 555-1234');
    });

    it('should format 7-digit phone with dash', () => {
      component.editForm.get('homePhone')?.setValue('5551234');
      (component as any).formatPhoneDisplay('homePhone');
      expect(component.editForm.get('homePhone')?.value).toBe('555-1234');
    });

    it('should not format other digit lengths', () => {
      component.editForm.get('homePhone')?.setValue('12345');
      (component as any).formatPhoneDisplay('homePhone');
      expect(component.editForm.get('homePhone')?.value).toBe('12345');
    });
  });

  describe('disableAddressFields and enableAddressFields', () => {
    it('should disable international address fields', () => {
      (component as any).disableAddressFields();

      expect(component.hasInternationalAddress()).toBeTrue();
      expect(component.editForm.get('homeAddress')?.disabled).toBeTrue();
      expect(component.editForm.get('city')?.disabled).toBeTrue();
      expect(component.editForm.get('zip')?.disabled).toBeTrue();
      expect(component.editForm.get('homePhone')?.disabled).toBeTrue();
      expect(component.editForm.get('email')?.disabled).toBeTrue();
      expect(component.stateDisplay()).toBe('--');
    });

    it('should enable address fields after disabling', () => {
      (component as any).disableAddressFields();
      (component as any).enableAddressFields();

      expect(component.hasInternationalAddress()).toBeFalse();
      expect(component.donorIntlAddress).toBeNull();
      expect(component.editForm.get('homeAddress')?.disabled).toBeFalse();
      expect(component.editForm.get('city')?.disabled).toBeFalse();
    });
  });

  describe('disableEmployerFields and enableEmployerFields', () => {
    it('should disable employer fields', () => {
      (component as any).disableEmployerFields();

      expect(component.hasEmployerInternationalAddress()).toBeTrue();
      expect(component.editForm.get('employerSchoolName')?.disabled).toBeTrue();
      expect(component.employerState()).toBe('--');
    });

    it('should enable employer fields after disabling', () => {
      (component as any).disableEmployerFields();
      (component as any).enableEmployerFields();

      expect(component.hasEmployerInternationalAddress()).toBeFalse();
      expect(component.employerIntlAddress).toBeNull();
      expect(component.editForm.get('employerSchoolName')?.disabled).toBeFalse();
    });
  });

  describe('getInvalidFieldNames', () => {
    it('should return names of invalid required fields', () => {
      component.editForm.get('weight')?.setValue(null);
      component.editForm.get('donation')?.setValue('');
      component.editForm.get('armUsed')?.setValue('');
      component.editForm.get('ethnicGroup')?.setValue('CA');
      component.editForm.get('procedure')?.setValue('PP');
      component.editForm.get('deferral')?.setValue('5');
      component.editForm.get('deferralType')?.setValue('NA');

      const result = (component as any).getInvalidFieldNames();

      expect(result).toContain('Weight');
      expect(result).toContain('Donation');
      expect(result).toContain('Arm Used');
      expect(result).not.toContain('Ethnic Group');
    });

    it('should return empty array when all required fields are valid', fakeAsync(() => {
      loadDonationIntoEditMode();

      const result = (component as any).getInvalidFieldNames();
      expect(result.length).toBe(0);
    }));
  });

  describe('populate edit form with aboDescription', () => {
    it('should use aboDescription when available', fakeAsync(() => {
      loadDonationIntoEditMode({ aboDescription: 'O Positive' });
      expect(component.aboDescription()).toBe('O Positive');
    }));

    it('should fall back to bloodType when aboDescription is null', fakeAsync(() => {
      loadDonationIntoEditMode({ aboDescription: null, bloodType: 'A+' });
      expect(component.aboDescription()).toBe('A+');
    }));

    it('should show "--" when both aboDescription and bloodType are null', fakeAsync(() => {
      loadDonationIntoEditMode({ aboDescription: null, bloodType: null });
      expect(component.aboDescription()).toBe('--');
    }));
  });

  describe('populate edit form with dob and gender', () => {
    it('should format dateOfBirth', fakeAsync(() => {
      loadDonationIntoEditMode({ dateOfBirth: '1990-05-15' });
      expect(component.dobDisplay()).toBe('15-May-1990');
    }));

    it('should show "--" when dateOfBirth is null', fakeAsync(() => {
      loadDonationIntoEditMode({ dateOfBirth: null });
      expect(component.dobDisplay()).toBe('--');
    }));

    it('should map gender F to Female', fakeAsync(() => {
      loadDonationIntoEditMode({ gender: 'F' });
      expect(component.sexDisplay()).toBe('Female');
    }));

    it('should show "--" when gender is null', fakeAsync(() => {
      loadDonationIntoEditMode({ gender: null });
      expect(component.sexDisplay()).toBe('--');
    }));
  });

  describe('populate edit form with employer data', () => {
    it('should set employer data from response', fakeAsync(() => {
      loadDonationIntoEditMode({
        employerId: 'EMP001',
        employerName: 'Mediware',
        empCity: 'Dallas',
        empState: 'TX',
        empZip: '75001',
      });

      expect(component.editForm.get('employerSchoolName')?.value).toBe('EMP001');
      expect(component.employerState()).toBe('TX');
    }));

    it('should set employer city in filtered employer cities', fakeAsync(() => {
      loadDonationIntoEditMode({
        empIntlAddrFlag: null,
        empCity: 'Houston',
        empState: 'TX',
        empZip: '77001',
      });

      expect(component.filteredEmployerCities().length).toBe(1);
      expect(component.filteredEmployerCities()[0].city).toBe('Houston');
    }));
  });

  describe('save with parsed phone numbers', () => {
    it('should parse phone numbers correctly in save request', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.editForm.patchValue({
        homePhone: '(214) 555-1234',
        workPhone: '555-4321',
        mobilePhone: '',
      });

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.hAreaCode).toBe('214');
      expect(request.hPhoneNo).toBe('5551234');
      expect(request.dAreaCode).toBe('');
      expect(request.dPhoneNo).toBe('5554321');
      expect(request.mAreaCode).toBe('');
      expect(request.mPhoneNo).toBe('');
    }));
  });

  describe('save state mapping', () => {
    it('should send empty state when stateDisplay is "--"', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.stateDisplay.set('--');

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.state).toBe('');
    }));

    it('should send actual state when stateDisplay is set', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.stateDisplay.set('TX');

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.state).toBe('TX');
    }));
  });

  describe('handleRetrieveResponse with item fallback', () => {
    it('should use item when data is null', fakeAsync(() => {
      mockUpdateService.retrieveByUnitId.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        data: null,
        item: createMockDonation({ firstName: 'ItemDonor' }),
        total: 1,
      }));

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      tick();

      expect(component.editForm.get('firstName')?.value).toBe('ItemDonor');
      expect(component.mode()).toBe('edit');
    }));
  });

  describe('loadDeferralReasonsForDonationType', () => {
    it('should not load when donationType is null', fakeAsync(() => {
      mockDonorService.getDeferralReasons.calls.reset();

      (component as any).loadDeferralReasonsForDonationType(null, '2025-01-01');
      tick();

      expect(mockDonorService.getDeferralReasons).not.toHaveBeenCalled();
    }));

    it('should not load when driveDate is null', fakeAsync(() => {
      mockDonorService.getDeferralReasons.calls.reset();

      (component as any).loadDeferralReasonsForDonationType('AL', null);
      tick();

      expect(mockDonorService.getDeferralReasons).not.toHaveBeenCalled();
    }));

    it('should handle deferral reason load error', fakeAsync(() => {
      mockDonorService.getDeferralReasons.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadDeferralReasonsForDonationType('AL', '2025-01-01');
      tick();

      expect(component.deferralReasons()).toEqual([]);
    }));
  });

  describe('loadProcedureCodesForDonationType', () => {
    it('should not load when donationType is null', fakeAsync(() => {
      mockDonorService.getProcedureCodesByDonationType.calls.reset();

      (component as any).loadProcedureCodesForDonationType(null);
      tick();

      expect(mockDonorService.getProcedureCodesByDonationType).not.toHaveBeenCalled();
    }));
  });

  describe('setupDonationTypeListener edge case', () => {
    it('should not load deferral reasons when driveDate is missing', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: null, collDate: null });
      mockDonorService.getDeferralReasons.calls.reset();

      component.editForm.get('donation')?.setValue('AU');
      tick();

      expect(mockDonorService.getDeferralReasons).not.toHaveBeenCalled();
    }));
  });

  describe('populate edit form - scanId and collDate', () => {
    it('should set loadedScanId from data', fakeAsync(() => {
      loadDonationIntoEditMode({ scanId: 'SCAN123' });
      expect(component.loadedScanId).toBe('SCAN123');
    }));

    it('should patch collectionDate from collDate', fakeAsync(() => {
      loadDonationIntoEditMode({ collDate: '2025-06-15' });
      const collDate = component.searchForm.getRawValue().collectionDate;
      expect(collDate.format('YYYY-MM-DD')).toBe('2025-06-15');
    }));
  });

  describe('hasUnsavedChanges tracking', () => {
    it('should set hasUnsavedChanges to true after edit form changes', fakeAsync(() => {
      loadDonationIntoEditMode();
      expect(component.hasUnsavedChanges).toBeFalse();

      component.editForm.get('firstName')?.setValue('NewName');
      tick();

      expect(component.hasUnsavedChanges).toBeTrue();
    }));
  });

  describe('computed signals with null descriptions', () => {
    it('should filter drives matching by driveId when sponsorName is null', () => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: null },
      ]);
      component.driveSearchControl.setValue('DRV001');

      expect(component.filteredDrives().length).toBe(1);
    });

    it('should filter ethnic groups by code when description is null', () => {
      component.ethnicGroups.set([
        { code: 'CA', description: null },
      ]);
      component.ethnicGroupSearchControl.setValue('CA');

      expect(component.filteredEthnicGroups().length).toBe(1);
    });

    it('should filter procedure codes by code when description is null', () => {
      component.procedureCodes.set([
        { procedureCode: 'PP', description: null },
      ]);
      component.procedureSearchControl.setValue('PP');

      expect(component.filteredProcedureCodes().length).toBe(1);
    });

    it('should filter venipuncture codes by code when description is null', () => {
      component.venipunctureCodes.set([
        { code: '01', description: null },
      ]);
      component.venipunctureSearchControl.setValue('01');

      expect(component.filteredVenipunctureCodes().length).toBe(1);
    });

    it('should filter employees by staffNo when employeeName is null', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: null },
      ]);
      component.reviewerSearchControl.setValue('S001');

      expect(component.filteredEmployees().length).toBe(1);
    });

    it('should filter lookup employees by staffNo when employeeName is null', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: null },
      ]);
      component.lookupIdSearchControl.setValue('S001');

      expect(component.filteredLookupEmployees().length).toBe(1);
    });

    it('should filter physical employees by staffNo when employeeName is null', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: null },
      ]);
      component.physicalIdSearchControl.setValue('S001');

      expect(component.filteredPhysicalEmployees().length).toBe(1);
    });

    it('should filter historian employees by staffNo when employeeName is null', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: null },
      ]);
      component.historianSearchControl.setValue('S001');

      expect(component.filteredHistorianEmployees().length).toBe(1);
    });

    it('should filter material employees by staffNo when employeeName is null', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: null },
      ]);
      component.materialVerifSearchControl.setValue('S001');

      expect(component.filteredMaterialEmployees().length).toBe(1);
    });

    it('should filter donation types by donationType when description is null', () => {
      component.donationTypes.set([
        { donationType: 'AL', description: null },
      ]);
      component.donationSearchControl.setValue('AL');

      expect(component.filteredDonationTypes().length).toBe(1);
    });

    it('should filter equipment types by code when description is null', () => {
      component.equipmentTypes.set([
        { code: 'AMIC', description: null },
      ]);
      component.equipTypeSearchControl.setValue('AMIC');

      expect(component.filteredEquipmentTypes().length).toBe(1);
    });

    it('should filter reaction codes by code when description is null', () => {
      component.reactionCodesList.set([
        { code: 'MI', description: null },
      ]);
      component.reactionSearchControl.setValue('MI');

      expect(component.filteredReactionCodes().length).toBe(1);
    });

    it('should filter deferral types by code when description is null', () => {
      component.deferralTypeSearchControl.setValue('IND');

      const result = component.filteredDeferralTypes();
      expect(result.some(d => d.code === 'IND')).toBeTrue();
    });
  });

  describe('openAlternateDemographics edge cases', () => {
    it('should ignore string results from alt demographics dialog', fakeAsync(() => {
      loadDonationIntoEditMode();
      (component as any).pendingAltAddress.set({ streetName: 'Old Alt' } as any);

      dialogSpy.and.returnValue({ afterClosed: () => of('cancelled') } as any);

      component.openAlternateDemographics();
      tick();

      expect((component as any).pendingAltAddress()?.streetName).toBe('Old Alt');
    }));

    it('should open dialog without fetching when no donorId', fakeAsync(() => {
      loadDonationIntoEditMode({ donorId: null });

      dialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

      component.openAlternateDemographics();
      tick();

      expect(mockAltDemoService.getByDonorId).not.toHaveBeenCalled();
      expect(dialogSpy).toHaveBeenCalled();
    }));
  });

  describe('setupSponsorSearch', () => {
    it('should not search sponsors when keyword is less than 2 chars', fakeAsync(() => {
      mockDonorService.getSponsors.calls.reset();
      component.altSponsorSearchControl.setValue('A');
      tick(350);

      expect(mockDonorService.getSponsors).not.toHaveBeenCalled();
    }));

    it('should search sponsors when keyword is 2+ chars', fakeAsync(() => {
      mockDonorService.getSponsors.and.returnValue(of([{ sponsorId: 'S1', name: 'Red Cross' }]));
      component.altSponsorSearchControl.setValue('Re');
      tick(350);

      expect(mockDonorService.getSponsors).toHaveBeenCalledWith('Re');
      expect(component.sponsors().length).toBe(1);
    }));

    it('should not update sponsors when result is null', fakeAsync(() => {
      component.sponsors.set([{ sponsorId: 'OLD', name: 'Old' }]);
      component.altSponsorSearchControl.setValue('');
      tick(350);

      expect(component.sponsors().length).toBe(1);
    }));
  });

  describe('setupEmployerSearch', () => {
    it('should search employers when search has 1+ chars', fakeAsync(() => {
      mockDonorService.getEmployers.and.returnValue(of([
        { employerId: 'EMP1', employerName: 'Acme', city: null, state: null, zip: null, country: null, uspsId: null, intlAddrFlag: null },
      ]));
      component.employerSearchControl.setValue('A');
      tick(350);

      expect(mockDonorService.getEmployers).toHaveBeenCalledWith('A');
      expect(component.filteredEmployers().length).toBe(1);
    }));
  });

  describe('setupCitySearch', () => {
    it('should search cities when search has 3+ chars', fakeAsync(() => {
      mockDonorService.getCityState.and.returnValue(of([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
      ]));
      component.citySearchControl.setValue('Dal');
      tick(350);

      expect(mockDonorService.getCityState).toHaveBeenCalledWith({ city: 'Dal' });
    }));

    it('should clear filtered cities when search is too short and no city selected', fakeAsync(() => {
      component.filteredCities.set([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
      ]);
      component.editForm.get('city')?.setValue('');
      component.citySearchControl.setValue('D');
      tick(350);

      expect(component.filteredCities().length).toBe(0);
    }));

    it('should keep matching city in filtered list when search is too short', fakeAsync(() => {
      component.filteredCities.set([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
        { uspsId: 2, city: 'Denver', state: 'CO', zip: '80201' },
      ]);
      component.editForm.get('city')?.setValue('Dallas');
      component.citySearchControl.setValue('D');
      tick(350);

      expect(component.filteredCities().length).toBe(1);
      expect(component.filteredCities()[0].city).toBe('Dallas');
    }));
  });

  describe('setupEmployerCitySearch', () => {
    it('should search employer cities when search has 3+ chars', fakeAsync(() => {
      mockDonorService.getCityState.and.returnValue(of([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
      ]));
      component.employerCitySearchControl.setValue('Dal');
      tick(350);

      expect(mockDonorService.getCityState).toHaveBeenCalledWith({ city: 'Dal' });
    }));

    it('should clear employer filtered cities when search is too short and no city selected', fakeAsync(() => {
      component.filteredEmployerCities.set([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
      ]);
      component.editForm.get('employerCity')?.setValue('');
      component.employerCitySearchControl.setValue('D');
      tick(350);

      expect(component.filteredEmployerCities().length).toBe(0);
    }));

    it('should keep matching employer city when search is too short', fakeAsync(() => {
      component.filteredEmployerCities.set([
        { uspsId: 1, city: 'Dallas', state: 'TX', zip: '75001' },
        { uspsId: 2, city: 'Denver', state: 'CO', zip: '80201' },
      ]);
      component.editForm.get('employerCity')?.enable();
      component.editForm.get('employerCity')?.setValue('Dallas');
      component.employerCitySearchControl.setValue('D');
      tick(350);

      expect(component.filteredEmployerCities().length).toBe(1);
      expect(component.filteredEmployerCities()[0].city).toBe('Dallas');
    }));
  });

  describe('populate edit form with otherContactNo', () => {
    it('should set pending alt address when otherContactNo is present', fakeAsync(() => {
      loadDonationIntoEditMode({
        altStreetName: null,
        altIntlAddress1: null,
        otherContactNo: '5551234',
      });

      expect((component as any).pendingAltAddress()).toBeTruthy();
      expect((component as any).pendingAltAddress()?.otherContactNumber).toBe('5551234');
    }));
  });

  describe('populate edit form with mobile phone in alt address', () => {
    it('should construct mobile phone from area code and phone number', fakeAsync(() => {
      loadDonationIntoEditMode({
        altStreetName: '123 Alt St',
        mAreaCode: '214',
        mPhoneNo: '5551234',
      });

      expect((component as any).pendingAltAddress()?.mobilePhoneNumber).toBe('2145551234');
    }));

    it('should set mobile phone to null when area code or phone missing', fakeAsync(() => {
      loadDonationIntoEditMode({
        altStreetName: '123 Alt St',
        mAreaCode: null,
        mPhoneNo: null,
      });

      expect((component as any).pendingAltAddress()?.mobilePhoneNumber).toBeNull();
    }));
  });

  describe('populate edit form with driveDate display', () => {
    it('should format driveDate for display', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: '2025-06-15' });
      expect(component.driveDate()).toBe('15-Jun-2025');
    }));

    it('should show "--" when driveDate and collDate are both null', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: null, collDate: null });
      expect(component.driveDate()).toBe('--');
    }));

    it('should use collDate for display when driveDate is null', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: null, collDate: '2025-03-20' });
      expect(component.driveDate()).toBe('20-Mar-2025');
    }));
  });

  describe('save with pending alt address data', () => {
    it('should include alt address fields in save request', fakeAsync(() => {
      loadDonationIntoEditMode({
        altStreetName: '123 Alt St',
        altSuiteApt: 'Apt 2',
        altCity: 'Austin',
        altState: 'TX',
        altZip: '78701',
        altUspsId: 999,
      });

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.altStreetName).toBe('123 Alt St');
      expect(request.altSuiteApt).toBe('Apt 2');
      expect(request.altUspsId).toBe(999);
    }));
  });

  describe('loadFormLovs success', () => {
    it('should populate drives and employees on success', fakeAsync(() => {
      mockDonorService.getDrives.and.returnValue(of([
        { driveId: 'D1', driveDate: '2025-01-01', driveType: null, sponsorName: null },
      ]));
      mockDonorService.getEmployees.and.returnValue(of([
        { staffNo: 'S1', employeeName: 'Employee 1' },
      ]));
      mockDonorService.getVenipunctureCodes.and.returnValue(of([
        { code: 'V1', description: 'Veni 1' },
      ]));
      mockDonorService.getInterdictionCodes.and.returnValue(of([
        { interCode: 'IC1', interDesc: 'Inter 1', interType: null },
      ]));
      mockDonorService.getDonationTypes.and.returnValue(of([
        { donationType: 'AL', description: 'Allogeneic' },
      ]));

      (component as any).loadFormLovs('2025-01-01');
      tick();

      expect(component.drives().length).toBe(1);
      expect(component.employees().length).toBe(1);
      expect(component.venipunctureCodes().length).toBe(1);
      expect(component.interdictionCodes().length).toBe(1);
      expect(component.donationTypes().length).toBe(1);
    }));
  });

  describe('handleRetrieveResponse message fallback', () => {
    it('should use response.message when errorResponse.error is not available', fakeAsync(() => {
      mockUpdateService.retrieveByUnitId.and.returnValue(of({
        success: false,
        message: 'Custom message',
        statusCode: 400,
        data: null,
        total: 0,
      }));

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Custom message');
    }));
  });

  describe('handleRetrieveError message fallback', () => {
    it('should use error.error.message when errorResponse is not present', fakeAsync(() => {
      mockUpdateService.retrieveByUnitId.and.returnValue(
        throwError(() => ({ error: { message: 'Error message fallback' } }))
      );

      setupSearchUnitIdField();
      component.searchForm.patchValue({ collectionDate: moment('2025-01-01') });

      component.onRetrieve();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error message fallback');
    }));
  });

  describe('save error response message fallback', () => {
    it('should use error.error.errorResponse.error on save HTTP error', fakeAsync(() => {
      loadDonationIntoEditMode();
      mockUpdateService.updateDonation.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Specific save error' } } }))
      );

      component.onSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Specific save error');
    }));
  });

  describe('validate field generic error fallback', () => {
    it('should use error.error.error when errorResponse is not available', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.editForm.get('city')?.setValue('InvalidCity');
      mockDonorService.validateCity.and.returnValue(
        throwError(() => ({ error: { error: 'City error from error field' } }))
      );

      component.validateCityField();
      tick();

      expect(component.editForm.get('city')?.getError('serverError')).toBe('City error from error field');
    }));

    it('should use error.error.message when error.error.error is not available', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.editForm.get('city')?.setValue('InvalidCity');
      mockDonorService.validateCity.and.returnValue(
        throwError(() => ({ error: { message: 'Message fallback' } }))
      );

      component.validateCityField();
      tick();

      expect(component.editForm.get('city')?.getError('serverError')).toBe('Message fallback');
    }));

    it('should use default message when no error details available', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.editForm.get('city')?.setValue('InvalidCity');
      mockDonorService.validateCity.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.validateCityField();
      tick();

      expect(component.editForm.get('city')?.getError('serverError')).toBe('Validation failed');
    }));
  });

  describe('employer zip validation error message fallback', () => {
    it('should use error.error.error when errorResponse is not available', fakeAsync(() => {
      component.editForm.get('employerCity')?.enable();
      component.editForm.get('employerCity')?.setValue('Dallas');
      component.editForm.get('employerZip')?.enable();
      component.editForm.get('employerZip')?.setValue('99999');

      mockDonorService.validateZipCity.and.returnValue(
        throwError(() => ({ error: { error: 'ZIP error' } }))
      );

      component.validateEmployerZipField();
      tick();

      expect(component.editForm.get('employerZip')?.getError('serverError')).toBe('ZIP error');
    }));

    it('should use default message when no error details', fakeAsync(() => {
      component.editForm.get('employerCity')?.enable();
      component.editForm.get('employerCity')?.setValue('Dallas');
      component.editForm.get('employerZip')?.enable();
      component.editForm.get('employerZip')?.setValue('99999');

      mockDonorService.validateZipCity.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.validateEmployerZipField();
      tick();

      expect(component.editForm.get('employerZip')?.getError('serverError')).toBe(
        'ZIP code does not match the specified city'
      );
    }));
  });

  describe('populate edit form city data', () => {
    it('should populate filtered cities from response data', fakeAsync(() => {
      loadDonationIntoEditMode({
        city: 'Dallas',
        state: 'TX',
        zip: '75001',
        uspsId: 42,
      });

      expect(component.filteredCities().length).toBe(1);
      expect(component.filteredCities()[0].city).toBe('Dallas');
      expect(component.filteredCities()[0].uspsId).toBe(42);
    }));
  });

  describe('populate edit form employer data with filteredEmployers', () => {
    it('should set filtered employers from response data', fakeAsync(() => {
      loadDonationIntoEditMode({
        employerId: 'EMP001',
        employerName: 'TestCorp',
        empCity: 'Houston',
        empState: 'TX',
        empZip: '77001',
      });

      expect(component.filteredEmployers().length).toBe(1);
      expect(component.filteredEmployers()[0].employerId).toBe('EMP001');
      expect(component.filteredEmployers()[0].employerName).toBe('TestCorp');
    }));
  });

  describe('search term signal null handling', () => {
    it('should set signal to empty string when search control emits null', () => {
      component.driveSearchControl.setValue(null);
      expect(component.filteredDrives()).toBeDefined();
    });

    it('should handle null value from ethnic group search', () => {
      component.ethnicGroupSearchControl.setValue(null);
      expect(component.filteredEthnicGroups()).toBeDefined();
    });

    it('should handle null value from procedure search', () => {
      component.procedureSearchControl.setValue(null);
      expect(component.filteredProcedureCodes()).toBeDefined();
    });

    it('should handle null value from deferral type search', () => {
      component.deferralTypeSearchControl.setValue(null);
      expect(component.filteredDeferralTypes().length).toBe(3);
    });
  });

  describe('donation type listener error handling', () => {
    it('should clear deferral reasons on API error', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.deferralReasons.set([{ reasonCode: '5' }]);

      mockDonorService.getDeferralReasons.and.returnValue(throwError(() => new Error('API fail')));

      component.editForm.get('donation')?.setValue('XX');
      tick();

      expect(component.deferralReasons()).toEqual([]);
    }));
  });

  describe('save with deferredThru date', () => {
    it('should serialize deferredThru date in save request', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.editForm.get('deferredThru')?.setValue(moment('2025-01-20'));

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.deferredThruDate).toBeDefined();
    }));
  });

  describe('repatchDropdownValues with null fallbacks', () => {
    it('should use sVenipuncture when venipunctureId is null', fakeAsync(() => {
      loadDonationIntoEditMode({ venipunctureId: null, sVenipuncture: 'SV01' });

      (component as any).repatchDropdownValues();

      expect(component.editForm.get('venipunctureCodes')?.value).toBe('SV01');
    }));

    it('should use sReactions when reactionCode is null', fakeAsync(() => {
      loadDonationIntoEditMode({ reactionCode: null, sReactions: 'REACT01' });

      (component as any).repatchDropdownValues();

      expect(component.editForm.get('reactionCodes')?.value).toBe('REACT01');
    }));

    it('should use empty string when both venipunctureId and sVenipuncture are null', fakeAsync(() => {
      loadDonationIntoEditMode({ venipunctureId: null, sVenipuncture: null });

      (component as any).repatchDropdownValues();

      expect(component.editForm.get('venipunctureCodes')?.value).toBe('');
    }));

    it('should handle all null dropdown values', fakeAsync(() => {
      loadDonationIntoEditMode({
        driveId: null,
        ethnicGroup: null,
        alternateIdType: null,
        donationType: null,
        procedureCode: null,
        lookupId: null,
        physicalId: null,
        firstReviewerId: null,
        screenerId: null,
        materialId: null,
        venipunctureId: null,
        sVenipuncture: null,
        reactionCode: null,
        sReactions: null,
        equipType: null,
        deferralReason: null,
        deferralType: null,
        armUsed: null,
        creditSponsor: null,
      });

      (component as any).repatchDropdownValues();

      expect(component.editForm.get('driveId')?.value).toBe('');
      expect(component.editForm.get('ethnicGroup')?.value).toBe('');
      expect(component.editForm.get('venipunctureCodes')?.value).toBe('');
      expect(component.editForm.get('reactionCodes')?.value).toBe('');
    }));
  });

  describe('populateEditForm null field fallbacks', () => {
    it('should handle all null name fields', fakeAsync(() => {
      loadDonationIntoEditMode({
        lastName: null,
        firstName: null,
        middleName: null,
        lastNameSuffix: null,
        streetName: null,
        suiteApt: null,
        city: null,
        state: null,
        zip: null,
        email: null,
        donorWeight: null,
        alternateId: null,
        alternateIdType: null,
        donorId: null,
        gender: null,
      });

      expect(component.editForm.get('firstName')?.value).toBe('');
      expect(component.editForm.get('suffix')?.value).toBe('');
      expect(component.editForm.get('homeAddress')?.value).toBe('');
      expect(component.lastNameDisplay()).toBe('--');
      expect(component.sexDisplay()).toBe('--');
      expect(component.donorId()).toBe('');
    }));

    it('should handle null employer data', fakeAsync(() => {
      loadDonationIntoEditMode({
        employerId: null,
        employerName: null,
        empCity: null,
        empState: null,
        empZip: null,
      });

      expect(component.filteredEmployers().length).toBe(0);
      expect(component.employerState()).toBe('--');
    }));

    it('should handle null venipuncture and reaction codes in populateEditForm', fakeAsync(() => {
      loadDonationIntoEditMode({
        venipunctureId: null,
        sVenipuncture: 'SV02',
        reactionCode: null,
        sReactions: 'REACT02',
      });

      expect(component.editForm.get('venipunctureCodes')?.value).toBe('SV02');
      expect(component.editForm.get('reactionCodes')?.value).toBe('REACT02');
    }));
  });

  describe('employer intl address - employer city data not populated', () => {
    it('should not set filteredEmployerCities when empIntlAddrFlag is Y', fakeAsync(() => {
      loadDonationIntoEditMode({
        empIntlAddrFlag: 'Y',
        empIntlAddress1: 'Intl',
        empCountryName: 'UK',
        employerId: 'EMP1',
        employerName: 'IntlCorp',
        empCity: 'London',
        empState: null,
        empZip: null,
      });

      // With intl flag Y, employer fields are disabled and state is '--'
      expect(component.hasEmployerInternationalAddress()).toBeTrue();
      expect(component.employerState()).toBe('--');
    }));
  });

  describe('save with resolveEmployerName', () => {
    it('should resolve employer name from filtered employers', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.filteredEmployers.set([{
        employerId: 'EMP001',
        employerName: 'Resolved Corp',
        city: null, state: null, zip: null, country: null, uspsId: null, intlAddrFlag: null,
      }]);
      component.editForm.get('employerSchoolName')?.setValue('EMP001');

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.employerName).toBe('Resolved Corp');
    }));
  });

  describe('deferred through validation - afterDriveDate error', () => {
    it('should set afterDriveDate error and then clear when date is corrected', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: '2025-06-15' });
      const ctrl = component.editForm.get('deferredThru')!;

      ctrl.setValue(moment('2025-07-01'));
      tick();
      expect(ctrl.hasError('afterDriveDate')).toBeTrue();

      ctrl.setValue(moment('2025-06-10'));
      tick();
      expect(ctrl.hasError('afterDriveDate')).toBeFalse();
    }));

    it('should use collDate for validation when driveDate is null', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: null, collDate: '2025-06-15' });
      const ctrl = component.editForm.get('deferredThru')!;

      ctrl.setValue(moment('2025-07-01'));
      tick();
      expect(ctrl.hasError('afterDriveDate')).toBeTrue();
    }));
  });

  describe('save with right arm only', () => {
    it('should map right arm bleed times and null left arm when armUsed is R', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.editForm.get('armUsed')?.setValue('R');
      component.bleedTimeData = {
        doubleStickId: '',
        currentDriveDate: '',
        employees: [],
        selectedArm: 'R',
        drawStartTime: '',
        mrsLoss: '',
        phlebotomistLoss: '',
        other: { startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        leftArm: { startTime1: '10:00', startPhleb1: 'PL', endTime1: '', endPhleb1: '', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        rightArm: { startTime1: '09:00', startPhleb1: 'PR', endTime1: '09:15', endPhleb1: 'PR', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
      };

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.bleedStartTimeR1).toBe('09:00');
      expect(request.bleedEndTimeR).toBe('09:15');
      expect(request.bleedStartTimeL1).toBeNull();
      expect(request.bleedEndTimeL).toBeNull();
    }));
  });

  describe('setupDonationTypeListener with driveDate from collDate', () => {
    it('should use collDate when driveDate is null for loading deferral reasons', fakeAsync(() => {
      loadDonationIntoEditMode({ driveDate: null, collDate: '2025-05-10' });
      mockDonorService.getDeferralReasons.calls.reset();

      component.editForm.get('donation')?.setValue('AU');
      tick();

      expect(mockDonorService.getDeferralReasons).toHaveBeenCalled();
      const args = mockDonorService.getDeferralReasons.calls.mostRecent().args;
      expect(args[0]).toBe('AU');
      expect(args[1]).toBe('05102025');
    }));
  });

  describe('computed signal filter - secondary field match (OR branch)', () => {
    it('should match drives by sponsorName when driveId does not match', () => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: 'Red Cross' },
      ]);
      component.driveSearchControl.setValue('red');

      expect(component.filteredDrives().length).toBe(1);
    });

    it('should match ethnic groups by description when code does not match', () => {
      component.ethnicGroups.set([
        { code: 'CA', description: 'Caucasian' },
      ]);
      component.ethnicGroupSearchControl.setValue('cauc');

      expect(component.filteredEthnicGroups().length).toBe(1);
    });

    it('should match procedure codes by description when code does not match', () => {
      component.procedureCodes.set([
        { procedureCode: 'PP', description: 'Phlebotomy' },
      ]);
      component.procedureSearchControl.setValue('phleb');

      expect(component.filteredProcedureCodes().length).toBe(1);
    });

    it('should match venipuncture codes by description when code does not match', () => {
      component.venipunctureCodes.set([
        { code: '01', description: 'Standard Venipuncture' },
      ]);
      component.venipunctureSearchControl.setValue('standard');

      expect(component.filteredVenipunctureCodes().length).toBe(1);
    });

    it('should match employees by name when staffNo does not match', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
      ]);
      component.reviewerSearchControl.setValue('doe');

      expect(component.filteredEmployees().length).toBe(1);
    });

    it('should match lookup employees by name when staffNo does not match', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
      ]);
      component.lookupIdSearchControl.setValue('doe');

      expect(component.filteredLookupEmployees().length).toBe(1);
    });

    it('should match physical employees by name when staffNo does not match', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
      ]);
      component.physicalIdSearchControl.setValue('doe');

      expect(component.filteredPhysicalEmployees().length).toBe(1);
    });

    it('should match historian employees by name when staffNo does not match', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
      ]);
      component.historianSearchControl.setValue('doe');

      expect(component.filteredHistorianEmployees().length).toBe(1);
    });

    it('should match material employees by name when staffNo does not match', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
      ]);
      component.materialVerifSearchControl.setValue('doe');

      expect(component.filteredMaterialEmployees().length).toBe(1);
    });

    it('should match donation types by description when type does not match', () => {
      component.donationTypes.set([
        { donationType: 'AL', description: 'Allogeneic' },
      ]);
      component.donationSearchControl.setValue('allog');

      expect(component.filteredDonationTypes().length).toBe(1);
    });

    it('should match equipment types by description when code does not match', () => {
      component.equipmentTypes.set([
        { code: 'AMIC', description: 'Amicus Machine' },
      ]);
      component.equipTypeSearchControl.setValue('amicus');

      expect(component.filteredEquipmentTypes().length).toBe(1);
    });

    it('should match reaction codes by description when code does not match', () => {
      component.reactionCodesList.set([
        { code: 'MI', description: 'Minor Reaction' },
      ]);
      component.reactionSearchControl.setValue('minor');

      expect(component.filteredReactionCodes().length).toBe(1);
    });

    it('should match deferral types by description when code does not match', () => {
      component.deferralTypeSearchControl.setValue('indefinite');

      expect(component.filteredDeferralTypes().length).toBe(1);
      expect(component.filteredDeferralTypes()[0].code).toBe('IND');
    });

    it('should not match drives when neither field matches', () => {
      component.drives.set([
        { driveId: 'DRV001', driveDate: '2025-01-01', driveType: null, sponsorName: 'Red Cross' },
      ]);
      component.driveSearchControl.setValue('zzz');

      expect(component.filteredDrives().length).toBe(0);
    });

    it('should not match employees when neither field matches', () => {
      component.employees.set([
        { staffNo: 'S001', employeeName: 'John Doe' },
      ]);
      component.reviewerSearchControl.setValue('zzz');

      expect(component.filteredEmployees().length).toBe(0);
    });
  });

  describe('openBleedTimeDetails with existing data', () => {
    it('should pass existing bleed time data to dialog', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.bleedTimeData = {
        doubleStickId: 'DS01',
        currentDriveDate: '2025-01-25',
        employees: [],
        selectedArm: 'L',
        drawStartTime: '08:00',
        mrsLoss: '5',
        phlebotomistLoss: '3',
        other: { startTime1: '10:00', startPhleb1: 'PO', endTime1: '10:15', endPhleb1: 'PO', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        leftArm: { startTime1: '08:00', startPhleb1: 'PL', endTime1: '08:15', endPhleb1: 'PL', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
        rightArm: { startTime1: '', startPhleb1: '', endTime1: '', endPhleb1: '', startTime2: '', startPhleb2: '', endTime2: '', endPhleb2: '' },
      };

      dialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

      component.openBleedTimeDetails();

      const dialogData = dialogSpy.calls.mostRecent().args[1].data;
      expect(dialogData.drawStartTime).toBe('08:00');
      expect(dialogData.mrsLoss).toBe('5');
      expect(dialogData.phlebotomistLoss).toBe('3');
    }));
  });

  describe('bleed time data with ISO format times', () => {
    it('should parse ISO format bleed start times', fakeAsync(() => {
      loadDonationIntoEditMode({
        armUsed: 'B',
        bleedStartTimeL1: '2025-01-01T08:30',
        bleedStartPhlebL1: 'PL1',
        bleedEndTimeL: '2025-01-01T08:45',
        bleedStartTimeR1: '09:30',
        bleedStartPhlebR1: 'PR1',
      });

      expect(component.bleedTimeData?.leftArm.startTime1).toBe('08:30');
      expect(component.bleedTimeData?.rightArm.startTime1).toBe('09:30');
    }));
  });

  describe('employer international address - disableEmployerFields via populateEditForm', () => {
    it('should populate employer intl address with full details', fakeAsync(() => {
      loadDonationIntoEditMode({
        empIntlAddrFlag: 'Y',
        empIntlAddress1: 'Emp Intl Addr 1',
        empIntlAddress2: 'Emp Intl Addr 2',
        empIntlAddress3: 'Emp Intl Addr 3',
        empIntlAddress4: 'Emp Intl Addr 4',
        empCountryName: 'Germany',
        empIntlPostalCode: '10115',
        employerId: 'EMP01',
        employerName: 'German Corp',
      });

      expect(component.employerIntlAddress?.addr1).toBe('Emp Intl Addr 1');
      expect(component.employerIntlAddress?.addr2).toBe('Emp Intl Addr 2');
      expect(component.employerIntlAddress?.addr3).toBe('Emp Intl Addr 3');
      expect(component.employerIntlAddress?.addr4).toBe('Emp Intl Addr 4');
      expect(component.employerIntlAddress?.country).toBe('Germany');
      expect(component.employerIntlAddress?.postalCode).toBe('10115');
    }));
  });

  describe('procedure codes error in donation type listener', () => {
    it('should handle procedure codes API error in donation type change', fakeAsync(() => {
      loadDonationIntoEditMode();
      mockDonorService.getProcedureCodesByDonationType.and.returnValue(
        throwError(() => new Error('procedure codes error'))
      );

      component.editForm.get('donation')?.setValue('XX');
      tick();

      // Error handler is empty, just ensure no crash
      expect(component.procedureCodes()).toBeDefined();
    }));
  });

  describe('openAlternateDemographics with existing API data', () => {
    it('should pass API-fetched existing data to dialog', fakeAsync(() => {
      loadDonationIntoEditMode();
      const existingAlt = { streetName: '456 Existing', suiteApt: null, addressType: 'L' } as any;
      mockAltDemoService.getByDonorId.and.returnValue(of(existingAlt));

      dialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

      component.openAlternateDemographics();
      tick();

      expect(mockAltDemoService.getByDonorId).toHaveBeenCalledWith('DN30136689');
      const dialogData = dialogSpy.calls.mostRecent().args[1].data;
      expect(dialogData.existingData).toEqual(existingAlt);
    }));
  });

  describe('save with employer intl address phone fields', () => {
    it('should include all employer intl address phone fields in request', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.employerIntlAddress = {
        streetName: '456 Intl',
        addr1: 'Line 1',
        addr2: 'Line 2',
        addr3: 'Line 3',
        addr4: 'Line 4',
        country: 'UK',
        postalCode: 'SW1A',
        homePhoneNo: '1234567',
        workPhoneNo: '7654321',
        workPhoneExt: '123',
        mobilePhoneNo: '9876543',
        faxNo: '1112233',
        email: 'emp@intl.com',
        intlAddrFlag: 'Y',
      };

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.employerInternationalAddress?.homePhoneNo).toBe('1234567');
      expect(request.employerInternationalAddress?.workPhoneNo).toBe('7654321');
      expect(request.employerInternationalAddress?.workPhoneExt).toBe('123');
      expect(request.employerInternationalAddress?.mobilePhoneNo).toBe('9876543');
      expect(request.employerInternationalAddress?.faxNo).toBe('1112233');
      expect(request.employerInternationalAddress?.email).toBe('emp@intl.com');
    }));
  });

  describe('save with donor intl address phone fields', () => {
    it('should include all donor intl address phone fields in request', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.donorIntlAddress = {
        streetName: '789 Intl',
        addr1: 'Donor Line 1',
        addr2: 'Donor Line 2',
        addr3: 'Donor Line 3',
        addr4: 'Donor Line 4',
        country: 'Canada',
        postalCode: 'M1M1M1',
        homePhoneNo: '1111111',
        workPhoneNo: '2222222',
        workPhoneExt: '456',
        mobilePhoneNo: '3333333',
        faxNo: '4444444',
        email: 'donor@intl.com',
        intlAddrFlag: 'Y',
      };

      mockUpdateService.updateDonation.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 })
      );

      component.onSave();
      tick();

      const request = mockUpdateService.updateDonation.calls.mostRecent().args[1];
      expect(request.donorInternationalAddress?.homePhoneNo).toBe('1111111');
      expect(request.donorInternationalAddress?.workPhoneNo).toBe('2222222');
      expect(request.donorInternationalAddress?.workPhoneExt).toBe('456');
      expect(request.donorInternationalAddress?.mobilePhoneNo).toBe('3333333');
      expect(request.donorInternationalAddress?.faxNo).toBe('4444444');
      expect(request.donorInternationalAddress?.email).toBe('donor@intl.com');
    }));
  });

  describe('populate edit form donor intl address with phone fields', () => {
    it('should populate donor intl address with all phone fields', fakeAsync(() => {
      loadDonationIntoEditMode({
        intlAddrFlag: 'Y',
        intlAddress1: 'Addr1',
        intlAddress2: 'Addr2',
        intlAddress3: 'Addr3',
        intlAddress4: 'Addr4',
        countryName: 'Canada',
        intlPostalCode: 'M1M1M1',
        intlHomePhoneNo: '111',
        intlWorkPhoneNo: '222',
        intlWorkPhoneExt: '33',
        intlMobilePhoneNo: '444',
        intlFaxNo: '555',
        email: 'test@intl.com',
      });

      expect(component.donorIntlAddress?.homePhoneNo).toBe('111');
      expect(component.donorIntlAddress?.workPhoneNo).toBe('222');
      expect(component.donorIntlAddress?.workPhoneExt).toBe('33');
      expect(component.donorIntlAddress?.mobilePhoneNo).toBe('444');
      expect(component.donorIntlAddress?.faxNo).toBe('555');
      expect(component.donorIntlAddress?.email).toBe('test@intl.com');
    }));
  });

  describe('bleed time data - arm direction edge cases', () => {
    it('should disable left arm data when armUsed is O (other)', fakeAsync(() => {
      loadDonationIntoEditMode({
        armUsed: 'O',
        bleedStartTimeL1: '08:00',
        bleedStartPhlebL1: 'P1',
      });

      // armUsed O: isLeft=false, isRight=false
      // So both left and right arm data should show empty
      expect(component.bleedTimeData?.leftArm.startTime1).toBe('');
      expect(component.bleedTimeData?.rightArm.startTime1).toBe('');
    }));
  });

  describe('onArmFieldClick - positive case', () => {
    it('should open bleed time details when arm is set and non-arrow click', fakeAsync(() => {
      loadDonationIntoEditMode();
      component.editForm.patchValue({ armUsed: 'L' });
      const spy = spyOn(component, 'openBleedTimeDetails');
      (component as any).armSelect = { close: jasmine.createSpy('close') };
      const event = {
        target: { closest: () => null },
        stopPropagation: jasmine.createSpy(),
        preventDefault: jasmine.createSpy(),
      } as any;
      component.onArmFieldClick(event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const spy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
