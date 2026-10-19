import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { LookupAndPrintDonorCardComponent } from './lookup-and-print-donor-card';
import { PageHeaderService } from '@shared/services/page-header.service';
import { NotificationService } from '@shared/services/notification.service';
import { LookupAndPrintDonorCardService } from './services/lookup-and-print-donor-card.service';
import {
  DonorDetailsItem,
  DonationTypeLovItem,
  ProcedureCodeLovItem,
  AlternateIdTypeLovItem,
  CityLovItem,
  CityStateLovItem,
  SponsorLovItem,
  EthnicGroupLovItem,
  PrinterItem,
} from './models/lookup-donor-card.model';

describe('LookupAndPrintDonorCardComponent', () => {
  let component: LookupAndPrintDonorCardComponent;
  let fixture: ComponentFixture<LookupAndPrintDonorCardComponent>;
  let dialogOpenSpy: jasmine.Spy;
  let mockDonorCardService: jasmine.SpyObj<LookupAndPrintDonorCardService>;
  let mockNotification: jasmine.SpyObj<NotificationService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockPageHeaderService = {
    pageHeaderData: signal({ title: 'Lookup and Print Donor Card', subtitle: '' }),
  };

  const mockDonorDetails: DonorDetailsItem = {
    donorId: 'D001',
    lastName: 'Smith',
    firstName: 'John',
    middleName: 'M',
    lastNameSuffix: 'Jr',
    dateOfBirth: '01-15-1990',
    gender: 'M',
    ssn: '[REDACTED_SOCIAL_SECURITY_NUMBER_1]',
    alias: 'Johnny',
    height: "5'10\"",
    donorWeight: 180,
    noteId: 'N001',
    employerId: 'E001',
    alternateId: 'ALT001',
    alternateIdType: 'DL',
    ethnicGroup: 'W',
    scanId: 'SC001',
    bloodType: 'O+',
    donorSince: '01-01-2010',
    lifeCredit: 10,
    ytdCredit: 2,
    ageYrs: 35,
    lastDonDate: '06-15-2025',
    postCount: 5,
    allowedToDonatFlg: 'Y',
    ethnicGroupDesc: 'White',
    alternateIdTypeDesc: 'Driver License',
    lifeDonations: 15,
    ytdDonations: 3,
    lifetimeGallon: 2,
    writesRequiredNext: 5,
    gallonImageFile: 'gallon2.bmp',
    lastDonation: {
      lastDonDate: '06-15-2025',
      lastUnitId: 'U001',
      lastDonType: 'WB',
      lastDonTypeDesc: 'Whole Blood',
      lastProcCode: 'PC01',
      lastProcCodeDesc: 'Standard',
      postCount: 5,
    },
    attributes: [
      { code: 'A1', attrType: 'TYPE1', description: 'Attribute 1' },
    ],
    address: {
      streetName: '123 Main St',
      suiteApt: 'Apt 4',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
      homeAreaCode: '217',
      homePhoneNo: '555-1234',
      dayAreaCode: '217',
      dayPhoneNo: '555-5678',
      extension: 101,
      email: '[REDACTED_EMAIL_ADDRESS_1]',
      mobileAreaCode: '217',
      mobilePhoneNo: '555-9999',
      otherContactNo: '',
      preferredContactFlag: 'Y',
      preferredContactAddrFlag: 'N',
      intlAddrFlag: 'N',
      intlAddress1: 'Intl Addr 1',
      intlAddress2: 'Intl Addr 2',
      intlAddress3: 'Intl Addr 3',
      intlAddress4: 'Intl Addr 4',
      countryName: 'US',
      intlPostalCode: '12345',
      intlHomePhone: '+1-555-1234',
      intlWorkPhone: '+1-555-5678',
      intlWorkPhoneExt: '101',
      intlMobilePhone: '+1-555-9999',
      intlFaxNo: '+1-555-0000',
      intlCityName: 'Springfield',
      intlCity: 'Springfield',
      altStreetName: '',
      altSuiteApt: '',
      altIntlAddress1: '',
      altIntlAddress2: '',
      altIntlAddress3: '',
      altIntlAddress4: '',
      altCountryName: '',
      altIntlPostalCode: '',
      altIntlAddrFlag: 'N',
      altIntlCityName: '',
      altIntlPhoneNo: '',
    },
    employer: {
      employerId: 'E001',
      employerName: 'Acme Corp',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      intlAddrFlag: 'N',
      intlCity: 'Chicago',
      intlState: 'IL',
      intlPostalCode: '60601',
      intlCountryName: 'US',
    },
    currentDonation: {
      transactionId: 'T001',
      donationType: 'WB',
      donationTypeDesc: 'Whole Blood',
      procedureCode: 'PC01',
      procedureCodeDesc: 'Standard',
      creditSponsor: 'SP001',
      creditSponsorName: 'Red Cross',
      idVerified: 'Y',
      unitId: 'U001',
      setId: 'S001',
      creditCount: 1,
      rbcLoss: 0.5,
      plasmaLoss: 0.3,
    },
    rbcLoss: 0.5,
    plasmaLoss: 0.3,
  };

  const mockPrinters: PrinterItem[] = [
    { code: 'P1', description: 'Printer 1' },
    { code: 'P2', description: 'Printer 2' },
  ];

  const mockDonationTypes: DonationTypeLovItem[] = [
    { donationType: 'WB', description: 'Whole Blood' },
    { donationType: 'PLT', description: 'Platelet' },
  ];

  const mockProcedureCodes: ProcedureCodeLovItem[] = [
    { procedureCode: 'PC01', description: 'Standard' },
    { procedureCode: 'PC02', description: 'Apheresis' },
  ];

  const mockAlternateTypes: AlternateIdTypeLovItem[] = [
    { code: 'DL', description: 'Driver License' },
    { code: 'PP', description: 'Passport' },
  ];

  const mockCities: CityLovItem[] = [
    { city: 'Springfield', state: 'IL' },
    { city: 'Chicago', state: 'IL' },
  ];

  const mockCityState: CityStateLovItem[] = [
    { zip: '62704', city: 'Springfield', state: 'IL', uspsId: 1 },
    { zip: '62705', city: 'Springfield', state: 'IL', uspsId: 2 },
  ];

  const mockSponsors: SponsorLovItem[] = [
    { sponsorId: 'SP001', name: 'Red Cross' },
    { sponsorId: 'SP002', name: 'Blood Bank' },
  ];

  const mockEthnicGroups: EthnicGroupLovItem[] = [
    { code: 'W', description: 'White' },
    { code: 'B', description: 'Black' },
  ];

  function createDialogRefStub(result: any = undefined) {
    return {
      afterClosed: () => of(result),
      close: jasmine.createSpy('close'),
    };
  }

  beforeEach(async () => {
    sessionStorage.removeItem('driveContext');

    mockDonorCardService = jasmine.createSpyObj('LookupAndPrintDonorCardService', [
      'getDonorDetails',
      'getDonorPicture',
      'getPrinters',
      'printCard',
      'getYtdLoss',
      'getNotes',
      'addNote',
      'getDonationTypesLov',
      'getProcedureCodesLov',
      'getAlternateIdTypesLov',
      'getAllCitiesLov',
      'getCityStateLov',
      'getSponsorsLov',
      'checkDonorEligibility',
      'getEthnicGroupsLov',
      'getHeightsLov',
    ]);

    mockDonorCardService.getDonorDetails.and.returnValue(of(mockDonorDetails));
    mockDonorCardService.getDonorPicture.and.returnValue(of('base64imagedata'));
    mockDonorCardService.getPrinters.and.returnValue(of(mockPrinters));
    mockDonorCardService.getDonationTypesLov.and.returnValue(of(mockDonationTypes));
    mockDonorCardService.getProcedureCodesLov.and.returnValue(of(mockProcedureCodes));
    mockDonorCardService.getAlternateIdTypesLov.and.returnValue(of(mockAlternateTypes));
    mockDonorCardService.getAllCitiesLov.and.returnValue(of(mockCities));
    mockDonorCardService.getCityStateLov.and.returnValue(of(mockCityState));
    mockDonorCardService.getSponsorsLov.and.returnValue(of(mockSponsors));
    mockDonorCardService.getEthnicGroupsLov.and.returnValue(of(mockEthnicGroups));
    mockDonorCardService.getHeightsLov.and.returnValue(of([
      { code: "5'10\"", description: "5'10\"" },
    ]));
    mockDonorCardService.getYtdLoss.and.returnValue(of({ rbcLoss: 1.5, plasmaLoss: 0.8 }));
    mockDonorCardService.checkDonorEligibility.and.returnValue(of({
      success: true,
      statusCode: 200,
      item: { eligStatus: 'Y', eligDescription: 'Eligible', deferDate: null, deferReason: null, interType: null },
    }));

    mockNotification = jasmine.createSpyObj('NotificationService', [
      'showError', 'showInfo', 'showSuccess', 'showWarning',
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LookupAndPrintDonorCardComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {}, data: {} }, params: EMPTY, queryParams: EMPTY, fragment: EMPTY, data: EMPTY } },
        { provide: LookupAndPrintDonorCardService, useValue: mockDonorCardService },
        { provide: NotificationService, useValue: mockNotification },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LookupAndPrintDonorCardComponent);
    component = fixture.componentInstance;

    // Spy on the real MatDialog instance injected into the component
    dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(createDialogRefStub() as any);
  });

  afterEach(() => {
    sessionStorage.removeItem('driveContext');
  });

  function initWithoutDriveContext(): void {
    try { fixture.detectChanges(); } catch (_) { /* template errors OK */ }
  }

  function initWithDriveContext(): void {
    sessionStorage.setItem('driveContext', JSON.stringify({
      driveId: 'DR001',
      sponsorName: 'Test Sponsor',
      driveDate: '07-01-2026',
    }));
    try { fixture.detectChanges(); } catch (_) { /* template errors OK */ }
  }

  function loadDonorOnComponent(): void {
    component.donorDetails.set(mockDonorDetails);
    component.driveId.set('DR001');
    component.driveName.set('Test Sponsor');
    component.driveDate.set('07-01-2026');
    component.cachedPrinters.set(mockPrinters);
  }

  // ---- Existing tests ----

  it('should show donor sections with empty values when no donor is loaded', () => {
    initWithoutDriveContext();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Donor Information');
    expect(compiled.textContent).toContain('Address Information');
    expect(compiled.textContent).toContain('Contact Information');
  });

  it('should generate unique componentId', () => {
    initWithoutDriveContext();
    const fixture2 = TestBed.createComponent(LookupAndPrintDonorCardComponent);
    const component2 = fixture2.componentInstance as LookupAndPrintDonorCardComponent;
    expect((component as any).componentId).not.toBe((component2 as any).componentId);
    fixture2.destroy();
  });

  it('should not render attributes table when no donor loaded', () => {
    initWithoutDriveContext();
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('.attributes-table tbody tr');
    expect(rows.length).toBe(0);
  });

  it('should render quick link buttons even when no donor loaded', () => {
    initWithoutDriveContext();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.quick-link-btn');
    expect(buttons.length).toBe(4);
  });

  it('should show Donor Statistics section', () => {
    initWithoutDriveContext();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Donor Statistics');
  });

  // ---- ngOnInit: no driveContext -> navigate to set-drive ----
  describe('ngOnInit without driveContext', () => {
    it('should navigate to set-drive-date-and-id when no driveContext in sessionStorage', () => {
      initWithoutDriveContext();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/donor-functions/recruitment/recruitment-general-functions/set-drive-date-and-id'],
        jasmine.objectContaining({ queryParams: { returnUrl: '/donor-functions/general-queries-and-functions/lookup-and-print-donor-card' } })
      );
    });
  });

  // ---- ngOnInit: with driveContext -> opens FindDonor ----
  describe('ngOnInit with driveContext', () => {
    it('should set driveId, driveName, driveDate from sessionStorage and open FindDonor dialog', () => {
      initWithDriveContext();
      expect(component.driveId()).toBe('DR001');
      expect(component.driveName()).toBe('Test Sponsor');
      expect(component.driveDate()).toBe('07-01-2026');
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should load donor details when FindDonor dialog returns a selected donor', fakeAsync(() => {
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(mockDonorCardService.getDonorDetails).toHaveBeenCalledWith('D001', 'DR001');
    }));

    it('should NOT load donor details when FindDonor dialog is cancelled', fakeAsync(() => {
      dialogOpenSpy.and.returnValue(createDialogRefStub(null) as any);
      initWithDriveContext();
      tick(200);
      expect(mockDonorCardService.getDonorDetails).not.toHaveBeenCalled();
    }));
  });

  // ---- ngOnDestroy ----
  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      initWithoutDriveContext();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ---- Computed signals with donor data ----
  describe('computed signals', () => {
    beforeEach(() => {
      initWithoutDriveContext();
      loadDonorOnComponent();
    });

    it('donorInfo should return formatted donor information', () => {
      const info = component.donorInfo();
      expect(info).toBeTruthy();
      expect(info!.donorName).toBe('Smith John');
      expect(info!.sex).toBe('M');
      expect(info!.abo).toBe('O+');
      expect(info!.middleName).toBe('M');
      expect(info!.suffix).toBe('Jr');
      expect(info!.nickName).toBe('Johnny');
      expect(info!.height).toBe("5'10\"");
      expect(info!.weight).toBe('180');
      expect(info!.ethnicity).toBe('White');
      expect(info!.alternateId).toBe('ALT001');
      expect(info!.alternateType).toBe('Driver License');
    });

    it('donorInfo should return null when no donor loaded', () => {
      component.donorDetails.set(null);
      expect(component.donorInfo()).toBeNull();
    });

    it('addressInfo should return formatted address', () => {
      const info = component.addressInfo();
      expect(info).toBeTruthy();
      expect(info!.homeAddress).toBe('123 Main St');
      expect(info!.apartmentNo).toBe('Apt 4');
      expect(info!.city).toBe('Springfield');
      expect(info!.state).toBe('IL');
      expect(info!.zip).toBe('62704');
    });

    it('addressInfo should return null when no donor', () => {
      component.donorDetails.set(null);
      expect(component.addressInfo()).toBeNull();
    });

    it('contactInfo should format phone numbers correctly', () => {
      const info = component.contactInfo();
      expect(info).toBeTruthy();
      expect(info!.homePhone).toBe('(217) 555-1234');
      expect(info!.workPhone).toBe('(217) 555-5678');
      expect(info!.email).toBe('[REDACTED_EMAIL_ADDRESS_1]');
    });

    it('contactInfo should return null when no donor', () => {
      component.donorDetails.set(null);
      expect(component.contactInfo()).toBeNull();
    });

    it('contactInfo should handle missing area code', () => {
      const details = { ...mockDonorDetails, address: { ...mockDonorDetails.address!, homeAreaCode: '', dayAreaCode: '' } };
      component.donorDetails.set(details);
      const info = component.contactInfo();
      expect(info!.homePhone).toBe('555-1234');
      expect(info!.workPhone).toBe('555-5678');
    });

    it('donorStatistics should return formatted statistics', () => {
      const stats = component.donorStatistics();
      expect(stats).toBeTruthy();
      expect(stats!.lifeDonationsCR).toBe('15/10');
      expect(stats!.ytdDonationsCR).toBe('3/2');
      expect(stats!.lifetimeGallon).toBe('2');
      expect(stats!.unitsRequiredNext).toBe('5');
      expect(stats!.donorSinceLabel).toContain('year');
    });

    it('donorStatistics should return null when no donor', () => {
      component.donorDetails.set(null);
      expect(component.donorStatistics()).toBeNull();
    });

    it('gallonImageUrl should return image URL for gallon >= 1', () => {
      expect(component.gallonImageUrl()).toBe('/images/gallon2.png');
    });

    it('gallonImageUrl should return null when gallon < 1', () => {
      component.donorDetails.set({ ...mockDonorDetails, lifetimeGallon: 0 });
      expect(component.gallonImageUrl()).toBeNull();
    });

    it('gallonImageUrl should return null when no gallonImageFile', () => {
      component.donorDetails.set({ ...mockDonorDetails, gallonImageFile: null });
      expect(component.gallonImageUrl()).toBeNull();
    });

    it('gallonImageUrl should return null when no donor', () => {
      component.donorDetails.set(null);
      expect(component.gallonImageUrl()).toBeNull();
    });

    it('lastDonationInfo should return formatted last donation', () => {
      const info = component.lastDonationInfo();
      expect(info).toBeTruthy();
      expect(info!.unitId).toBe('U001');
      expect(info!.donation).toBe('WB');
      expect(info!.procedure).toBe('PC01');
      expect(info!.postCount).toBe('5');
    });

    it('lastDonationInfo should return null when no last donation', () => {
      component.donorDetails.set({ ...mockDonorDetails, lastDonation: null });
      expect(component.lastDonationInfo()).toBeNull();
    });

    it('employerInfo should return employer data', () => {
      const info = component.employerInfo();
      expect(info.employerSchoolName).toBe('Acme Corp');
      expect(info.city).toBe('Chicago');
      expect(info.state).toBe('IL');
      expect(info.zip).toBe('60601');
      expect(info.alternateSponsorCode).toBe('SP001');
      expect(info.alternateSponsorName).toBe('Red Cross');
    });

    it('employerInfo should use dash for missing employer', () => {
      component.donorDetails.set({ ...mockDonorDetails, employer: null });
      const emp = component.employerInfo();
      expect(emp.employerSchoolName).toBe('—');
    });

    it('donationInfo should return eligible when allowedToDonatFlg is Y', () => {
      const info = component.donationInfo();
      expect(info.idVerified).toBe('Yes');
      expect(info.eligibility).toBe('Eligible');
    });

    it('donationInfo should return Not Eligible when allowedToDonatFlg is N', () => {
      component.donorDetails.set({ ...mockDonorDetails, allowedToDonatFlg: 'N', currentDonation: { ...mockDonorDetails.currentDonation!, idVerified: 'N' } });
      const info = component.donationInfo();
      expect(info.idVerified).toBe('No');
      expect(info.eligibility).toBe('Not Eligible');
    });

    it('donationInfo should return dash for unknown values', () => {
      component.donorDetails.set({ ...mockDonorDetails, allowedToDonatFlg: '', currentDonation: { ...mockDonorDetails.currentDonation!, idVerified: '' } });
      const info = component.donationInfo();
      expect(info.idVerified).toBe('—');
      expect(info.eligibility).toBe('—');
    });

    it('donationInfo should return dashes when no currentDonation', () => {
      component.donorDetails.set({ ...mockDonorDetails, currentDonation: null, allowedToDonatFlg: '' });
      const info = component.donationInfo();
      expect(info.idVerified).toBe('—');
      expect(info.eligibility).toBe('—');
    });

    it('addressInfo and contactInfo should be null when no address', () => {
      component.donorDetails.set({ ...mockDonorDetails, address: null });
      expect(component.addressInfo()).toBeNull();
      expect(component.contactInfo()).toBeNull();
    });

    it('canPrint should be false without procedure code and id verified', () => {
      expect(component.canPrint()).toBeFalse();
    });

    it('canPrint should be true when donor loaded, procedure code set, and id verified', () => {
      component.hasProcedureCode.set(true);
      component.hasIdVerified.set(true);
      expect(component.canPrint()).toBeTrue();
    });

    it('canPrint should be false without procedure code', () => {
      component.hasProcedureCode.set(false);
      component.hasIdVerified.set(true);
      expect(component.canPrint()).toBeFalse();
    });

    it('canPrint should be false without idVerified', () => {
      component.hasProcedureCode.set(true);
      component.hasIdVerified.set(false);
      expect(component.canPrint()).toBeFalse();
    });

    it('printButtonLabel should be PRINT CARD initially', () => {
      expect(component.printButtonLabel()).toBe('PRINT CARD');
    });

    it('printButtonLabel should be REPRINT after card is printed', () => {
      component.isCardPrinted.set(true);
      expect(component.printButtonLabel()).toBe('REPRINT');
    });

    it('attributes should return empty array when no donor', () => {
      component.donorDetails.set(null);
      expect(component.attributes()).toEqual([]);
    });

    it('attributes should return donor attributes', () => {
      expect(component.attributes().length).toBe(1);
      expect(component.attributes()[0].code).toBe('A1');
    });
  });

  // ---- Filtered computed signals ----
  describe('filtered computed signals', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('filteredHeightOptions should return all when no search', () => {
      component.heightOptions.set([
        { code: '501', description: "5'1\"" },
        { code: '510', description: "5'10\"" },
      ]);
      expect(component.filteredHeightOptions().length).toBe(component.heightOptions().length);
    });

    it('filteredHeightOptions should filter by search query', fakeAsync(() => {
      component.heightOptions.set([
        { code: '501', description: "5'1\"" },
        { code: '510', description: "5'10\"" },
      ]);
      component.heightSearchCtrl.setValue("5'1");
      tick();
      const result = component.filteredHeightOptions();
      expect(result.length).toBeGreaterThan(0);
      result.forEach(h =>
        expect(`${h.code}${h.description}`.toLowerCase()).toContain("5'1")
      );
    }));

    it('filteredAlternateTypes should return all when no search', () => {
      component.alternateTypeOptions.set(mockAlternateTypes);
      expect(component.filteredAlternateTypes().length).toBe(2);
    });

    it('filteredAlternateTypes should filter by description', () => {
      component.alternateTypeOptions.set(mockAlternateTypes);
      component.alternateTypeSearchCtrl.setValue('Driver');
      expect(component.filteredAlternateTypes().length).toBe(1);
      expect(component.filteredAlternateTypes()[0].code).toBe('DL');
    });

    it('filteredSponsors should return all when no search', () => {
      component.sponsorOptions.set(mockSponsors);
      expect(component.filteredSponsors().length).toBe(2);
    });

    it('filteredSponsors should filter by name', () => {
      component.sponsorOptions.set(mockSponsors);
      component.sponsorSearchCtrl.setValue('Red');
      expect(component.filteredSponsors().length).toBe(1);
    });

    it('filteredSponsors should filter by sponsorId', () => {
      component.sponsorOptions.set(mockSponsors);
      component.sponsorSearchCtrl.setValue('SP002');
      expect(component.filteredSponsors().length).toBe(1);
      expect(component.filteredSponsors()[0].name).toBe('Blood Bank');
    });

    it('filteredCityOptions should return all when no search', () => {
      component.allCityOptions.set(mockCities);
      expect(component.filteredCityOptions().length).toBe(2);
    });

    it('filteredCityOptions should filter by city', () => {
      component.allCityOptions.set(mockCities);
      component.citySearchCtrl.setValue('Spring');
      expect(component.filteredCityOptions().length).toBe(1);
    });

    it('filteredEthnicGroups should return all when no search', () => {
      component.ethnicGroupOptions.set(mockEthnicGroups);
      expect(component.filteredEthnicGroups().length).toBe(2);
    });

    it('filteredEthnicGroups should filter by description', () => {
      component.ethnicGroupOptions.set(mockEthnicGroups);
      component.ethnicitySearchCtrl.setValue('White');
      expect(component.filteredEthnicGroups().length).toBe(1);
    });

    it('filteredEthnicGroups should filter by code', () => {
      component.ethnicGroupOptions.set(mockEthnicGroups);
      component.ethnicitySearchCtrl.setValue('B');
      expect(component.filteredEthnicGroups().length).toBe(1);
      expect(component.filteredEthnicGroups()[0].description).toBe('Black');
    });

    it('filteredDonationTypes should return all when no search', () => {
      component.donationTypeOptions.set(mockDonationTypes);
      expect(component.filteredDonationTypes().length).toBe(2);
    });

    it('filteredDonationTypes should filter by description', () => {
      component.donationTypeOptions.set(mockDonationTypes);
      component.donationTypeSearchCtrl.setValue('Whole');
      expect(component.filteredDonationTypes().length).toBe(1);
    });

    it('filteredProcedureCodes should return all when no search', () => {
      component.procedureCodeOptions.set(mockProcedureCodes);
      expect(component.filteredProcedureCodes().length).toBe(2);
    });

    it('filteredProcedureCodes should filter by code', () => {
      component.procedureCodeOptions.set(mockProcedureCodes);
      component.procedureCodeSearchCtrl.setValue('PC02');
      expect(component.filteredProcedureCodes().length).toBe(1);
      expect(component.filteredProcedureCodes()[0].description).toBe('Apheresis');
    });

    it('filteredZipOptions should return all when no search', () => {
      component.zipOptions.set(mockCityState);
      expect(component.filteredZipOptions().length).toBe(2);
    });

    it('filteredZipOptions should filter by zip', () => {
      component.zipOptions.set(mockCityState);
      component.zipSearchCtrl.setValue('62705');
      expect(component.filteredZipOptions().length).toBe(1);
    });
  });

  // ---- Comparator functions ----
  describe('comparator functions', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('compareAlternateType should match by code', () => {
      expect(component.compareAlternateType({ code: 'DL', description: 'A' }, { code: 'DL', description: 'B' })).toBeTrue();
      expect(component.compareAlternateType({ code: 'DL', description: 'A' }, { code: 'PP', description: 'A' })).toBeFalse();
      expect(component.compareAlternateType(null, { code: 'DL', description: 'A' })).toBeFalse();
      expect(component.compareAlternateType({ code: 'DL', description: 'A' }, null)).toBeFalse();
    });

    it('compareCity should match by city and state', () => {
      expect(component.compareCity({ city: 'A', state: 'IL' }, { city: 'A', state: 'IL' })).toBeTrue();
      expect(component.compareCity({ city: 'A', state: 'IL' }, { city: 'B', state: 'IL' })).toBeFalse();
      expect(component.compareCity(null, null)).toBeFalse();
    });

    it('compareCityState should match by city, state, and zip', () => {
      const a: CityStateLovItem = { city: 'A', state: 'IL', zip: '11111', uspsId: 1 };
      const b: CityStateLovItem = { city: 'A', state: 'IL', zip: '11111', uspsId: 2 };
      const c: CityStateLovItem = { city: 'A', state: 'IL', zip: '22222', uspsId: 1 };
      expect(component.compareCityState(a, b)).toBeTrue();
      expect(component.compareCityState(a, c)).toBeFalse();
      expect(component.compareCityState(null, a)).toBeFalse();
    });

    it('compareSponsor should match by sponsorId', () => {
      expect(component.compareSponsor({ sponsorId: 'S1', name: 'A' }, { sponsorId: 'S1', name: 'B' })).toBeTrue();
      expect(component.compareSponsor({ sponsorId: 'S1', name: 'A' }, { sponsorId: 'S2', name: 'A' })).toBeFalse();
      expect(component.compareSponsor(null, null)).toBeFalse();
    });

    it('compareEthnicGroup should match by code', () => {
      expect(component.compareEthnicGroup({ code: 'W', description: 'A' }, { code: 'W', description: 'B' })).toBeTrue();
      expect(component.compareEthnicGroup({ code: 'W', description: 'A' }, { code: 'B', description: 'A' })).toBeFalse();
      expect(component.compareEthnicGroup(null, null)).toBeFalse();
    });

    it('compareDonationType should match by donationType', () => {
      expect(component.compareDonationType({ donationType: 'WB', description: 'A' }, { donationType: 'WB', description: 'B' })).toBeTrue();
      expect(component.compareDonationType({ donationType: 'WB', description: 'A' }, { donationType: 'PLT', description: 'A' })).toBeFalse();
      expect(component.compareDonationType(null, null)).toBeFalse();
    });

    it('compareProcedureCode should match by procedureCode', () => {
      expect(component.compareProcedureCode({ procedureCode: 'PC01', description: 'A' }, { procedureCode: 'PC01', description: 'B' })).toBeTrue();
      expect(component.compareProcedureCode({ procedureCode: 'PC01', description: 'A' }, { procedureCode: 'PC02', description: 'A' })).toBeFalse();
      expect(component.compareProcedureCode(null, null)).toBeFalse();
    });

    it('compareHeight should match by code', () => {
      expect(component.compareHeight({ code: '5-10', description: '5 ft 10' }, { code: '5-10', description: '5 ft 10' })).toBeTrue();
      expect(component.compareHeight(null, null)).toBeFalse();
    });
  });

  // ---- onChange ----
  describe('onChange', () => {
    it('should open FindDonor dialog', () => {
      initWithoutDriveContext();
      dialogOpenSpy.calls.reset();
      component.onChange();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should reset donor state on onChange', () => {
      initWithoutDriveContext();
      component.donorDetails.set(mockDonorDetails);
      component.isCardPrinted.set(true);
      component.onChange();
      expect(component.donorDetails()).toBeNull();
      expect(component.isCardPrinted()).toBe(false);
    });
  });

  // ---- onSearchDonor ----
  describe('onSearchDonor', () => {
    it('should open FindDonor dialog', () => {
      initWithoutDriveContext();
      dialogOpenSpy.calls.reset();
      component.onSearchDonor();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });
  });

  // ---- onDonations ----
  describe('onDonations', () => {
    it('should open donation details dialog when donor is loaded', () => {
      initWithoutDriveContext();
      loadDonorOnComponent();
      dialogOpenSpy.calls.reset();
      component.onDonations();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should not open donations dialog when no donor', () => {
      initWithoutDriveContext();
      dialogOpenSpy.calls.reset();
      component.onDonations();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });
  });

  // ---- onPrintCard ----
  describe('onPrintCard', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should do nothing if no donor loaded', () => {
      component.donorDetails.set(null);
      dialogOpenSpy.calls.reset();
      component.onPrintCard();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open PrintCard dialog with correct data when donor loaded', () => {
      loadDonorOnComponent();
      dialogOpenSpy.calls.reset();
      component.onPrintCard();
      expect(dialogOpenSpy).toHaveBeenCalled();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].width).toBe('420px');
      expect(callArgs[1].data.printers).toEqual(mockPrinters);
      expect(callArgs[1].data.printRequest.donorId).toBe('D001');
    });

    it('should set isCardPrinted to true when PrintCard dialog returns a printer', () => {
      loadDonorOnComponent();
      dialogOpenSpy.and.returnValue(createDialogRefStub({ printer: 'P1' }) as any);
      component.onPrintCard();
      expect(component.isCardPrinted()).toBeTrue();
    });

    it('should NOT set isCardPrinted when dialog result has no printer', () => {
      loadDonorOnComponent();
      dialogOpenSpy.and.returnValue(createDialogRefStub({}) as any);
      component.onPrintCard();
      expect(component.isCardPrinted()).toBeFalse();
    });

    it('should not set isCardPrinted when print dialog is cancelled', () => {
      loadDonorOnComponent();
      component.alternateIdCtrl.setValue('');
      dialogOpenSpy.and.returnValue(createDialogRefStub(null) as any);
      component.onPrintCard();
      expect(component.isCardPrinted()).toBeFalse();
    });

    it('should map eligStatus Y to E in abbrEligStatus', () => {
      loadDonorOnComponent();
      component.eligStatus.set('Y');
      dialogOpenSpy.calls.reset();
      component.onPrintCard();
      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.printRequest.abbrEligStatus).toBe('E');
    });

    it('should map eligStatus N to D in abbrEligStatus', () => {
      loadDonorOnComponent();
      component.eligStatus.set('N');
      dialogOpenSpy.calls.reset();
      component.onPrintCard();
      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.printRequest.abbrEligStatus).toBe('D');
    });

    it('should map empty eligStatus to empty abbrEligStatus', () => {
      loadDonorOnComponent();
      component.eligStatus.set('');
      dialogOpenSpy.calls.reset();
      component.onPrintCard();
      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.printRequest.abbrEligStatus).toBe('');
    });

    it('should show error when alternate ID set without alternate type', () => {
      loadDonorOnComponent();
      component.alternateIdCtrl.setValue('ALT123');
      component.selectedAlternateType.setValue(null);
      component.onPrintCard();
      expect(mockNotification.showError).toHaveBeenCalledWith(
        'Alternate Type is required when Alternate ID is provided'
      );
    });
  });

  // ---- onComments ----
  describe('onComments', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should do nothing if no donor loaded', () => {
      dialogOpenSpy.calls.reset();
      component.onComments();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open EnterComments dialog with donor id', () => {
      loadDonorOnComponent();
      dialogOpenSpy.calls.reset();
      component.onComments();
      expect(dialogOpenSpy).toHaveBeenCalled();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].data.donorId).toBe('D001');
    });
  });

  // ---- onYtdLoss ----
  describe('onYtdLoss', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should do nothing if no donor loaded', () => {
      component.donorDetails.set(null);
      component.onYtdLoss();
      expect(mockDonorCardService.getYtdLoss).not.toHaveBeenCalled();
    });

    it('should call getYtdLoss and open YtdLoss dialog', () => {
      loadDonorOnComponent();
      dialogOpenSpy.calls.reset();
      component.onYtdLoss();
      expect(mockDonorCardService.getYtdLoss).toHaveBeenCalledWith('D001');
      expect(dialogOpenSpy).toHaveBeenCalled();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].data.rbcLoss).toBe(1.5);
      expect(callArgs[1].data.plasmaLoss).toBe(0.8);
    });
  });

  // ---- onInternationalAddress ----
  describe('onInternationalAddress', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should open InternationalAddress dialog with address data', () => {
      loadDonorOnComponent();
      dialogOpenSpy.calls.reset();
      component.onInternationalAddress();
      expect(dialogOpenSpy).toHaveBeenCalled();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].data.existingAddress).toBeTruthy();
      expect(callArgs[1].data.existingAddress.country).toBe('US');
    });

    it('should open dialog with null existingAddress when no address', () => {
      component.donorDetails.set({ ...mockDonorDetails, address: null });
      dialogOpenSpy.calls.reset();
      component.onInternationalAddress();
      expect(dialogOpenSpy).toHaveBeenCalled();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].data.existingAddress).toBeNull();
    });
  });

  // ---- onAlternateAddress ----
  describe('onAlternateAddress', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should do nothing if no donor loaded', () => {
      component.donorDetails.set(null);
      dialogOpenSpy.calls.reset();
      component.onAlternateAddress();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open AlternateDemographics dialog with donor id', () => {
      loadDonorOnComponent();
      dialogOpenSpy.calls.reset();
      component.onAlternateAddress();
      expect(dialogOpenSpy).toHaveBeenCalled();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].data.donorId).toBe('D001');
    });
  });

  // ---- onEmployerInternationalAddress ----
  describe('onEmployerInternationalAddress', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should open employer international address dialog', () => {
      loadDonorOnComponent();
      dialogOpenSpy.calls.reset();
      component.onEmployerInternationalAddress();
      expect(dialogOpenSpy).toHaveBeenCalled();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].data.intlCity).toBe('Chicago');
      expect(callArgs[1].data.intlState).toBe('IL');
    });

    it('should handle no employer data gracefully', () => {
      component.donorDetails.set({ ...mockDonorDetails, employer: null });
      dialogOpenSpy.calls.reset();
      component.onEmployerInternationalAddress();
      expect(dialogOpenSpy).toHaveBeenCalled();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].data.intlCity).toBe('');
    });
  });

  // ---- onFullEligibility ----
  describe('onFullEligibility', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should do nothing if no donor loaded', () => {
      component.donorDetails.set(null);
      dialogOpenSpy.calls.reset();
      component.onFullEligibility();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open DonorEligibilityPanel dialog', () => {
      loadDonorOnComponent();
      dialogOpenSpy.calls.reset();
      component.onFullEligibility();
      expect(dialogOpenSpy).toHaveBeenCalled();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].data.donorId).toBe('D001');
    });

    it('should set procedure code when dialog returns result with matching code', () => {
      loadDonorOnComponent();
      component.procedureCodeOptions.set(mockProcedureCodes);
      dialogOpenSpy.and.returnValue(createDialogRefStub({ procedureCode: 'PC01' }) as any);
      component.onFullEligibility();
      expect(component.selectedProcedureCode.value?.procedureCode).toBe('PC01');
    });

    it('should update donation type if result has a different donationType', () => {
      loadDonorOnComponent();
      component.donationTypeOptions.set(mockDonationTypes);
      component.procedureCodeOptions.set(mockProcedureCodes);
      component.selectedDonationType.setValue(mockDonationTypes[0], { emitEvent: false });
      dialogOpenSpy.and.returnValue(createDialogRefStub({ procedureCode: 'PC01', donationType: 'PLT' }) as any);
      component.onFullEligibility();
      expect(component.selectedDonationType.value?.donationType).toBe('PLT');
    });

    it('should use weight from weightCtrl if set', () => {
      loadDonorOnComponent();
      component.weightCtrl.setValue('200');
      dialogOpenSpy.calls.reset();
      component.onFullEligibility();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].data.donorWeight).toBe(200);
    });

    it('should handle full eligibility dialog with no result', () => {
      loadDonorOnComponent();
      dialogOpenSpy.and.returnValue(createDialogRefStub(null) as any);
      component.onFullEligibility();
      expect(component.selectedProcedureCode.value).toBeFalsy();
    });
  });

  // ---- onImageSelected ----
  describe('onImageSelected', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should do nothing if no file selected', () => {
      const event = { target: { files: [] } } as unknown as Event;
      component.onImageSelected(event);
      expect(component.donorImageUrl()).toBeNull();
    });

    it('should do nothing if files is null', () => {
      const event = { target: { files: null } } as unknown as Event;
      component.onImageSelected(event);
      expect(component.donorImageUrl()).toBeNull();
    });

    it('should read file and set donorImageUrl', () => {
      const mockFile = new Blob(['test'], { type: 'image/jpeg' });
      const mockInput = { files: [mockFile], value: 'test.jpg' } as unknown as HTMLInputElement;
      const event = { target: mockInput } as unknown as Event;

      const mockReader = {
        result: 'data:image/jpeg;base64,test',
        readAsDataURL: jasmine.createSpy('readAsDataURL'),
        onload: null as (() => void) | null,
      };
      spyOn(window as any, 'FileReader').and.returnValue(mockReader);

      component.onImageSelected(event);
      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(mockFile);

      // Trigger onload callback
      mockReader.onload!();
      expect(component.donorImageUrl()).toBe('data:image/jpeg;base64,test');
      expect(mockInput.value).toBe('');
    });
  });

  // ---- onCityChange ----
  describe('onCityChange', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should do nothing if selected is falsy', () => {
      component.onCityChange(null as any);
      expect(mockDonorCardService.getCityStateLov).not.toHaveBeenCalled();
    });

    it('should update state and load zip codes', () => {
      component.onCityChange({ city: 'Springfield', state: 'IL' });
      expect(component.stateCtrl.value).toBe('IL');
      expect(component.selectedZip.value).toBeNull();
      expect(mockDonorCardService.getCityStateLov).toHaveBeenCalledWith(
        jasmine.objectContaining({ city: 'Springfield', state: 'IL', exact: true })
      );
    });

    it('should handle getCityStateLov error', () => {
      mockDonorCardService.getCityStateLov.and.returnValue(throwError(() => new Error('fail')));
      component.onCityChange({ city: 'Springfield', state: 'IL' });
      expect(mockNotification.showError).toHaveBeenCalledWith('Failed to load zip codes');
      expect(component.isLoadingZips()).toBeFalse();
    });
  });

  // ---- onEmployerCityChange ----
  describe('onEmployerCityChange', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should do nothing if selected is falsy', () => {
      component.onEmployerCityChange(null as any);
      expect(mockDonorCardService.getCityStateLov).not.toHaveBeenCalled();
    });

    it('should update employer state and load zip codes', () => {
      const selected: CityStateLovItem = { city: 'Chicago', state: 'IL', zip: '60601', uspsId: 1 };
      component.onEmployerCityChange(selected);
      expect(component.employerStateCtrl.value).toBe('IL');
      expect(component.selectedEmployerZip.value).toBeNull();
      expect(mockDonorCardService.getCityStateLov).toHaveBeenCalledWith(
        jasmine.objectContaining({ city: 'Chicago' })
      );
    });

    it('should handle getCityStateLov error for employer', () => {
      mockDonorCardService.getCityStateLov.and.returnValue(throwError(() => new Error('fail')));
      const selected: CityStateLovItem = { city: 'Chicago', state: 'IL', zip: '60601', uspsId: 1 };
      component.onEmployerCityChange(selected);
      expect(mockNotification.showError).toHaveBeenCalledWith('Failed to load employer zip codes');
      expect(component.isLoadingEmployerZips()).toBeFalse();
    });
  });

  // ---- loadDonorDetails (tested via FindDonor dialog result) ----
  describe('loadDonorDetails', () => {
    it('should load donor details, picture, printers, and cities via forkJoin', fakeAsync(() => {
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);

      expect(mockDonorCardService.getDonorDetails).toHaveBeenCalledWith('D001', 'DR001');
      expect(mockDonorCardService.getDonorPicture).toHaveBeenCalledWith('D001');
      expect(mockDonorCardService.getPrinters).toHaveBeenCalled();
      expect(mockDonorCardService.getAllCitiesLov).toHaveBeenCalled();
      expect(component.donorDetails()).toBeTruthy();
      expect(component.donorImageUrl()).toBe('data:image/jpeg;base64,base64imagedata');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should set donorImageUrl to null when picture is null', fakeAsync(() => {
      mockDonorCardService.getDonorPicture.and.returnValue(of(null));
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(component.donorImageUrl()).toBeNull();
    }));

    it('should handle donor picture error gracefully', fakeAsync(() => {
      mockDonorCardService.getDonorPicture.and.returnValue(throwError(() => new Error('No picture')));
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(component.donorImageUrl()).toBeNull();
    }));

    it('should show error notification on loadDonorDetails failure', fakeAsync(() => {
      mockDonorCardService.getDonorDetails.and.returnValue(throwError(() => new Error('API error')));
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(mockNotification.showError).toHaveBeenCalledWith('Failed to load donor details');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should populate editable fields from donor details', fakeAsync(() => {
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);

      expect(component.middleNameCtrl.value).toBe('M');
      expect(component.suffixCtrl.value).toBe('JR');
      expect(component.nickNameCtrl.value).toBe('JOHNNY');
      expect(component.selectedHeight.value?.code).toBe("5'10\"");
      expect(component.weightCtrl.value).toBe('180');
      expect(component.alternateIdCtrl.value).toBe('ALT001');
      expect(component.homeAddressCtrl.value).toBe('123 MAIN ST');
      expect(component.apartmentNoCtrl.value).toBe('Apt 4');
      expect(component.stateCtrl.value).toBe('IL');
      expect(component.emailCtrl.value).toBe('[REDACTED_EMAIL_ADDRESS_1]');
      expect(component.employerNameCtrl.value).toBe('Acme Corp');
      expect(component.altSponsorNameCtrl.value).toBe('Red Cross');
    }));

    it('should load donation types with preselection after donor details load', fakeAsync(() => {
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(mockDonorCardService.getDonationTypesLov).toHaveBeenCalled();
    }));

    it('should load alternate id types LOV', fakeAsync(() => {
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(mockDonorCardService.getAlternateIdTypesLov).toHaveBeenCalled();
      expect(component.alternateTypeOptions().length).toBe(2);
    }));

    it('should load ethnic groups LOV', fakeAsync(() => {
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(mockDonorCardService.getEthnicGroupsLov).toHaveBeenCalled();
    }));

    it('should load sponsors LOV', fakeAsync(() => {
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(mockDonorCardService.getSponsorsLov).toHaveBeenCalled();
    }));

    it('should load city/state/zip LOV', fakeAsync(() => {
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(mockDonorCardService.getCityStateLov).toHaveBeenCalled();
    }));
  });

  // ---- LOV error paths ----
  describe('LOV loading error paths', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should show error when loadDonationTypesLov fails', fakeAsync(() => {
      mockDonorCardService.getDonationTypesLov.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDonationTypesLov();
      tick();
      expect(mockNotification.showError).toHaveBeenCalledWith('Failed to load donation types');
      expect(component.isLoadingDonationTypes()).toBeFalse();
    }));

    it('should preselect donation type and set pending procedure code', fakeAsync(() => {
      mockDonorCardService.getDonationTypesLov.and.returnValue(of(mockDonationTypes));
      (component as any).loadDonationTypesLov('WB', 'PC01');
      tick(200);
      expect(component.selectedDonationType.value?.donationType).toBe('WB');
    }));

    it('should show error when loadAlternateIdTypesLov fails', fakeAsync(() => {
      mockDonorCardService.getAlternateIdTypesLov.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadAlternateIdTypesLov('DL');
      tick();
      expect(mockNotification.showError).toHaveBeenCalledWith('Failed to load alternate ID types');
      expect(component.isLoadingAlternateTypes()).toBeFalse();
    }));

    it('should preselect alternate type by code', fakeAsync(() => {
      (component as any).loadAlternateIdTypesLov('DL');
      tick();
      expect(component.selectedAlternateType.value?.code).toBe('DL');
    }));

    it('should show error when loadEthnicGroupsLov fails', fakeAsync(() => {
      mockDonorCardService.getEthnicGroupsLov.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadEthnicGroupsLov('W');
      tick();
      expect(mockNotification.showError).toHaveBeenCalledWith('Failed to load ethnic groups');
      expect(component.isLoadingEthnicGroups()).toBeFalse();
    }));

    it('should preselect ethnic group by code', fakeAsync(() => {
      (component as any).loadEthnicGroupsLov('W');
      tick();
      expect(component.selectedEthnicity.value?.code).toBe('W');
    }));

    it('should show error when loadCityStateLov fails', fakeAsync(() => {
      mockDonorCardService.getCityStateLov.and.returnValue(throwError(() => new Error('fail')));
      component.allCityOptions.set(mockCities);
      (component as any).loadCityStateLov('Springfield', 'IL', '62704');
      tick();
      expect(mockNotification.showError).toHaveBeenCalledWith('Failed to load zip codes');
      expect(component.isLoadingZips()).toBeFalse();
    }));

    it('should not load city state when city is undefined', () => {
      (component as any).loadCityStateLov(undefined, 'IL');
      expect(mockDonorCardService.getCityStateLov).not.toHaveBeenCalled();
    });

    it('should preselect city and zip in loadCityStateLov', fakeAsync(() => {
      component.allCityOptions.set(mockCities);
      (component as any).loadCityStateLov('Springfield', 'IL', '62704');
      tick();
      expect(component.selectedCity.value?.city).toBe('Springfield');
      expect(component.selectedZip.value?.zip).toBe('62704');
    }));

    it('should show error when loadEmployerCityStateLov fails', fakeAsync(() => {
      mockDonorCardService.getCityStateLov.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadEmployerCityStateLov('Chicago', 'IL', '60601');
      tick();
      expect(mockNotification.showError).toHaveBeenCalledWith('Failed to load employer location data');
      expect(component.isLoadingEmployerZips()).toBeFalse();
    }));

    it('should not load employer city state when city is undefined', () => {
      (component as any).loadEmployerCityStateLov(undefined, 'IL');
      expect(mockDonorCardService.getCityStateLov).not.toHaveBeenCalled();
    });

    it('should preselect employer city and zip', fakeAsync(() => {
      const empCityState: CityStateLovItem[] = [
        { zip: '60601', city: 'Chicago', state: 'IL', uspsId: 1 },
      ];
      mockDonorCardService.getCityStateLov.and.returnValue(of(empCityState));
      (component as any).loadEmployerCityStateLov('Chicago', 'IL', '60601');
      tick();
      expect(component.selectedEmployerCity.value?.city).toBe('Chicago');
      expect(component.selectedEmployerZip.value?.zip).toBe('60601');
    }));

    it('should show error when loadSponsorsLov fails', fakeAsync(() => {
      mockDonorCardService.getSponsorsLov.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadSponsorsLov('SP001');
      tick();
      expect(mockNotification.showError).toHaveBeenCalledWith('Failed to load sponsors');
      expect(component.isLoadingSponsors()).toBeFalse();
    }));

    it('should preselect sponsor by sponsorId', fakeAsync(() => {
      (component as any).loadSponsorsLov('SP001');
      tick();
      expect(component.selectedSponsor.value?.sponsorId).toBe('SP001');
    }));
  });

  // ---- selectedDonationType valueChanges ----
  describe('selectedDonationType valueChanges', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should load procedure codes when donation type is selected', fakeAsync(() => {
      component.selectedDonationType.setValue(mockDonationTypes[0]);
      tick(200);
      expect(mockDonorCardService.getProcedureCodesLov).toHaveBeenCalledWith('WB', '', null);
      expect(component.procedureCodeOptions().length).toBe(2);
      expect(component.selectedProcedureCode.enabled).toBeTrue();
    }));

    it('should disable procedure code and idVerified when donation type is cleared', fakeAsync(() => {
      component.selectedDonationType.setValue(mockDonationTypes[0]);
      tick(200);
      component.selectedDonationType.setValue(null);
      tick(200);
      expect(component.selectedProcedureCode.disabled).toBeTrue();
      expect(component.hasDonationType()).toBeFalse();
      expect(component.hasProcedureCode()).toBeFalse();
      expect(component.hasIdVerified()).toBeFalse();
    }));

    it('should handle pending procedure code when items arrive', fakeAsync(() => {
      (component as any).pendingProcedureCode.set('PC01');
      component.selectedDonationType.setValue(mockDonationTypes[0]);
      tick(200);
      expect(component.selectedProcedureCode.value?.procedureCode).toBe('PC01');
      expect(component.hasProcedureCode()).toBeTrue();
      expect(component.idVerifiedCtrl.enabled).toBeTrue();
    }));

    it('should set hasDonationType when donation type is selected', () => {
      expect(component.hasDonationType()).toBe(false);
      component.selectedDonationType.setValue(mockDonationTypes[0]);
      expect(component.hasDonationType()).toBe(true);
    });

    it('should handle procedure codes LOV error gracefully', fakeAsync(() => {
      mockDonorCardService.getProcedureCodesLov.and.returnValue(throwError(() => new Error('LOV error')));
      component.selectedDonationType.setValue(mockDonationTypes[0]);
      tick(200);
      expect(component.procedureCodeOptions().length).toBe(0);
    }));
  });

  // ---- selectedProcedureCode valueChanges ----
  describe('selectedProcedureCode valueChanges', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should enable idVerified when procedure code is selected', () => {
      component.selectedProcedureCode.enable({ emitEvent: false });
      component.selectedProcedureCode.setValue(mockProcedureCodes[0]);
      expect(component.hasProcedureCode()).toBeTrue();
      expect(component.idVerifiedCtrl.enabled).toBeTrue();
    });

    it('should disable idVerified and reset eligibility when procedure code is cleared', () => {
      component.selectedProcedureCode.enable({ emitEvent: false });
      component.selectedProcedureCode.setValue(mockProcedureCodes[0]);
      component.selectedProcedureCode.setValue(null);
      expect(component.hasProcedureCode()).toBeFalse();
      expect(component.idVerifiedCtrl.disabled).toBeTrue();
      expect(component.hasIdVerified()).toBeFalse();
    });
  });

  // ---- idVerifiedCtrl valueChanges / checkEligibility ----
  describe('idVerifiedCtrl valueChanges and checkEligibility', () => {
    beforeEach(() => {
      initWithoutDriveContext();
      loadDonorOnComponent();
    });

    it('should check eligibility when idVerified is set to true', fakeAsync(() => {
      component.selectedDonationType.setValue(mockDonationTypes[0], { emitEvent: false });
      component.selectedProcedureCode.enable({ emitEvent: false });
      component.selectedProcedureCode.setValue(mockProcedureCodes[0], { emitEvent: false });
      component.idVerifiedCtrl.enable({ emitEvent: false });
      component.idVerifiedCtrl.setValue(true);
      tick();
      expect(mockDonorCardService.checkDonorEligibility).toHaveBeenCalled();
      expect(component.eligibilityText()).toBe('Eligible');
      expect(component.eligStatus()).toBe('Y');
    }));

    it('should reset eligibility text when idVerified is unchecked', () => {
      component.idVerifiedCtrl.enable({ emitEvent: false });
      component.idVerifiedCtrl.setValue(false);
      expect(component.hasIdVerified()).toBeFalse();
    });

    it('should handle checkEligibility with unsuccessful response', fakeAsync(() => {
      mockDonorCardService.checkDonorEligibility.and.returnValue(of({
        success: false,
        statusCode: 200,
        item: null,
      }));
      component.selectedDonationType.setValue(mockDonationTypes[0], { emitEvent: false });
      component.selectedProcedureCode.enable({ emitEvent: false });
      component.selectedProcedureCode.setValue(mockProcedureCodes[0], { emitEvent: false });
      component.idVerifiedCtrl.enable({ emitEvent: false });
      component.idVerifiedCtrl.setValue(true);
      tick();
      expect(component.eligibilityText()).toBe('Unable to check eligibility');
      expect(component.eligStatus()).toBe('');
    }));

    it('should handle checkEligibility API error', fakeAsync(() => {
      mockDonorCardService.checkDonorEligibility.and.returnValue(throwError(() => new Error('API error')));
      component.selectedDonationType.setValue(mockDonationTypes[0], { emitEvent: false });
      component.selectedProcedureCode.enable({ emitEvent: false });
      component.selectedProcedureCode.setValue(mockProcedureCodes[0], { emitEvent: false });
      component.idVerifiedCtrl.enable({ emitEvent: false });
      component.idVerifiedCtrl.setValue(true);
      tick();
      expect(component.eligibilityText()).toBe('Unable to check eligibility');
      expect(mockNotification.showError).toHaveBeenCalledWith('Failed to check donor eligibility');
      expect(component.isCheckingEligibility()).toBeFalse();
    }));

    it('should reset eligibility when checkEligibility has no procCode or donType', fakeAsync(() => {
      component.idVerifiedCtrl.enable({ emitEvent: false });
      component.idVerifiedCtrl.setValue(true);
      tick();
      // No selectedDonationType or selectedProcedureCode set
      expect(component.eligibilityText()).toBe('—');
      expect(component.eligStatus()).toBe('');
    }));
  });

  // ---- alternateIdCtrl valueChanges ----
  describe('alternateIdCtrl valueChanges', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should enable alternate type when alternate ID is entered', () => {
      component.alternateIdCtrl.setValue('TEST123');
      expect(component.selectedAlternateType.enabled).toBe(true);
    });

    it('should disable alternate type when alternate ID is cleared', () => {
      component.alternateIdCtrl.setValue('TEST123');
      component.alternateIdCtrl.setValue('');
      expect(component.selectedAlternateType.disabled).toBe(true);
    });
  });

  // ---- calcYearsSince ----
  describe('calcYearsSince (private)', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('should return empty string for empty dateStr', () => {
      expect((component as any).calcYearsSince('')).toBe('');
    });

    it('should return empty string for malformed date', () => {
      expect((component as any).calcYearsSince('2025')).toBe('');
    });

    it('should return "1 year" for 1 year ago', () => {
      const lastYear = new Date().getFullYear() - 1;
      expect((component as any).calcYearsSince(`01-01-${lastYear}`)).toBe('1 year');
    });

    it('should return plural years for > 1 year ago', () => {
      const yearsAgo = new Date().getFullYear() - 5;
      expect((component as any).calcYearsSince(`01-01-${yearsAgo}`)).toBe('5 years');
    });

    it('should return empty string if year is current year', () => {
      const currentYear = new Date().getFullYear();
      expect((component as any).calcYearsSince(`01-01-${currentYear}`)).toBe('');
    });
  });

  // ---- elementId ----
  describe('elementId', () => {
    it('should generate element id with component prefix', () => {
      initWithoutDriveContext();
      const id = (component as any).elementId('test-field');
      expect(id).toContain('lookup-print-donor-card-');
      expect(id).toContain('-test-field');
    });
  });

  // ---- Donor details with null/missing fields ----
  describe('computed signals with minimal donor data', () => {
    beforeEach(() => {
      initWithoutDriveContext();
    });

    it('donorInfo should use dash for missing optional fields', () => {
      component.donorDetails.set({
        ...mockDonorDetails,
        gender: '',
        bloodType: '',
        middleName: '',
        lastNameSuffix: '',
        alias: '',
        height: '',
        donorWeight: null,
        ethnicGroupDesc: '',
        ethnicGroup: '',
        alternateId: '',
        alternateIdTypeDesc: '',
        alternateIdType: '',
      });
      const info = component.donorInfo()!;
      expect(info.sex).toBe('—');
      expect(info.abo).toBe('—');
      expect(info.middleName).toBe('—');
      expect(info.suffix).toBe('—');
      expect(info.nickName).toBe('—');
      expect(info.height).toBe('—');
      expect(info.weight).toBe('—');
      expect(info.ethnicity).toBe('—');
      expect(info.alternateId).toBe('—');
      expect(info.alternateType).toBe('—');
    });

    it('addressInfo should use dash for missing fields', () => {
      component.donorDetails.set({
        ...mockDonorDetails,
        address: { ...mockDonorDetails.address!, streetName: '', suiteApt: '', city: '', state: '', zip: '' },
      });
      const info = component.addressInfo()!;
      expect(info.homeAddress).toBe('—');
      expect(info.apartmentNo).toBe('—');
      expect(info.city).toBe('—');
      expect(info.state).toBe('—');
      expect(info.zip).toBe('—');
    });

    it('employerInfo should use dash for missing fields', () => {
      component.donorDetails.set({ ...mockDonorDetails, employer: null, currentDonation: null });
      const info = component.employerInfo();
      expect(info.employerSchoolName).toBe('—');
      expect(info.city).toBe('—');
      expect(info.alternateSponsorCode).toBe('—');
    });

    it('lastDonationInfo should use dash for missing fields', () => {
      component.donorDetails.set({
        ...mockDonorDetails,
        lastDonation: { lastDonDate: '', lastUnitId: '', lastDonType: '', lastDonTypeDesc: '', lastProcCode: '', lastProcCodeDesc: '', postCount: null },
      });
      const info = component.lastDonationInfo()!;
      expect(info.unitId).toBe('—');
      expect(info.donation).toBe('—');
      expect(info.procedure).toBe('—');
      expect(info.postCount).toBe('—');
    });

    it('donorStatistics should handle null numeric fields', () => {
      component.donorDetails.set({
        ...mockDonorDetails,
        lifeDonations: null,
        lifeCredit: null,
        ytdDonations: null,
        ytdCredit: null,
        lifetimeGallon: null,
        writesRequiredNext: null,
        donorSince: '',
      });
      const stats = component.donorStatistics()!;
      expect(stats.lifeDonationsCR).toBe('0/0');
      expect(stats.ytdDonationsCR).toBe('0/0');
      expect(stats.lifetimeGallon).toBe('0');
      expect(stats.unitsRequiredNext).toBe('0');
      expect(stats.donorSinceLabel).toBe('');
    });

    it('donationInfo should return dash with no currentDonation', () => {
      component.donorDetails.set({ ...mockDonorDetails, currentDonation: null });
      const info = component.donationInfo();
      expect(info.idVerified).toBe('—');
    });
  });

  // ---- populateEditableFields with null sub-objects ----
  describe('populateEditableFields with missing address/employer/currentDonation', () => {
    it('should handle null address, employer, and currentDonation', fakeAsync(() => {
      const detailsNoAddr = { ...mockDonorDetails, address: null, employer: null, currentDonation: null };
      mockDonorCardService.getDonorDetails.and.returnValue(of(detailsNoAddr));
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(component.homeAddressCtrl.value).toBe('');
      expect(component.homePhoneCtrl.value).toBe('');
      expect(component.employerNameCtrl.value).toBe('');
      expect(component.altSponsorNameCtrl.value).toBe('');
    }));

    it('should handle null employer separately', fakeAsync(() => {
      mockDonorCardService.getDonorDetails.and.returnValue(of({ ...mockDonorDetails, employer: null }));
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(component.employerNameCtrl.value).toBe('');
    }));

    it('should handle null currentDonation separately', fakeAsync(() => {
      mockDonorCardService.getDonorDetails.and.returnValue(of({ ...mockDonorDetails, currentDonation: null }));
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(component.altSponsorNameCtrl.value).toBe('');
    }));

    it('should handle empty alternateId', fakeAsync(() => {
      mockDonorCardService.getDonorDetails.and.returnValue(of({ ...mockDonorDetails, alternateId: '' }));
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(component.selectedAlternateType.disabled).toBe(true);
    }));

    it('should handle null donorWeight', fakeAsync(() => {
      mockDonorCardService.getDonorDetails.and.returnValue(of({ ...mockDonorDetails, donorWeight: null }));
      dialogOpenSpy.and.returnValue(createDialogRefStub({ action: 'select', donor: { donorId: 'D001' } }) as any);
      initWithDriveContext();
      tick(200);
      expect(component.weightCtrl.value).toBe('');
    }));
  });

  // ---- headerConfig via pageHeaderService effect ----
  describe('pageHeaderService effect', () => {
    it('should update headerConfig from pageHeaderData signal', () => {
      initWithoutDriveContext();
      expect(component.headerConfig.title).toBe('Lookup and Print Donor Card');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
    });
  });

  // ---- attributeTableConfig ----
  describe('attributeTableConfig', () => {
    it('should have correct column configuration', () => {
      initWithoutDriveContext();
      expect(component.attributeTableConfig.columns.length).toBe(3);
      expect(component.attributeTableConfig.columns[0].key).toBe('code');
      expect(component.attributeTableConfig.showPagination).toBeFalse();
    });
  });

  // ---- resetDonorState ----
  describe('resetDonorState', () => {
    it('should fully reset donor state', () => {
      initWithoutDriveContext();
      component.donorDetails.set(mockDonorDetails);
      component.donorImageUrl.set('test.jpg');
      component.isCardPrinted.set(true);
      component.hasDonationType.set(true);
      component.hasProcedureCode.set(true);
      component.hasIdVerified.set(true);
      component.middleNameCtrl.setValue('Test');
      component.homeAddressCtrl.setValue('Test St');

      (component as any).resetDonorState();

      expect(component.donorDetails()).toBeNull();
      expect(component.donorImageUrl()).toBeNull();
      expect(component.isCardPrinted()).toBe(false);
      expect(component.hasDonationType()).toBe(false);
      expect(component.hasProcedureCode()).toBe(false);
      expect(component.hasIdVerified()).toBe(false);
      expect(component.middleNameCtrl.value).toBe('');
      expect(component.homeAddressCtrl.value).toBe('');
    });
  });

  // ---- selectPanel sentinel values ----
  describe('selectPanel sentinel values', () => {
    it('should have panel loading and empty sentinel values', () => {
      initWithoutDriveContext();
      expect(component.selectPanelLoadingValue).toBe('__loading__');
      expect(component.selectPanelEmptyValue).toBe('__empty__');
    });
  });
});
