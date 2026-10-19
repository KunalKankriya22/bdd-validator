import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';

import { ParentSponsorQueryComponent } from './parent-sponsor-query';
import { ParentSponsorQueryService } from './services/parent-sponsor-query.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  ParentSponsorLookup,
  ParentSponsorInfo,
  ShowDriveDataOption,
  MonthFilter
} from './models/parent-sponsor-query.model';

describe('ParentSponsorQueryComponent', () => {
  let pageHeaderServiceSpy: any;
  let menuServiceSpy: any;
  let headerServiceSpy: any;
  let serviceSpy: any;
  let component: ParentSponsorQueryComponent;
  let fixture: ComponentFixture<ParentSponsorQueryComponent>;
  let service: jasmine.SpyObj<ParentSponsorQueryService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let menuService: jasmine.SpyObj<MenuService>;
  let router: Router;

  const mockParentSponsors: ParentSponsorLookup[] = [
    { sponsorId: 'SPON001', sponsorName: 'Test Sponsor 1' },
    { sponsorId: 'SPON002', sponsorName: 'Test Sponsor 2' },
    { sponsorId: 'SPON003', sponsorName: 'Another Sponsor' }
  ];

  const mockParentSponsorInfo: ParentSponsorInfo = {
    sponsorId: 'SPON001',
    sponsorName: 'Test Sponsor 1',
    address: '123 Main St, Dallas, TX 75001',
    phone: '(214) 555-1234'
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ParentSponsorQueryService', [
      'getParentSponsorsLookup',
      'getParentSponsorInfo',
      'getConstituentSponsors'
    ]);
    headerServiceSpy = createMockHeaderService();
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [
      'getTitle',
      'getSubtitle',
      'getCurrentMenuItem'
    ], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null)
    });

    // Setup default return values
    serviceSpy.getParentSponsorsLookup.and.returnValue(of(mockParentSponsors));
    serviceSpy.getParentSponsorInfo.and.returnValue(of(mockParentSponsorInfo));
    serviceSpy.getConstituentSponsors.and.returnValue(of({ data: [], total: 0 }));
    menuServiceSpy.findMenuItemByPath.and.returnValue({ label: 'Parent Sponsor Query', remarks: 'View Parent Sponsor Query Details.' });



      TestBed.configureTestingModule({
      imports: [ParentSponsorQueryComponent,
        ReactiveFormsModule,
        NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ParentSponsorQueryService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    });


    


      serviceSpy.getParentSponsorsLookup.calls.reset();


      serviceSpy.getParentSponsorInfo.calls.reset();


      serviceSpy.getConstituentSponsors.calls.reset();


      menuServiceSpy.findMenuItemByPath.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      pageHeaderServiceSpy.getCurrentMenuItem.calls.reset();


      serviceSpy.getParentSponsorsLookup.and.returnValue(of(mockParentSponsors));


      serviceSpy.getParentSponsorInfo.and.returnValue(of(mockParentSponsorInfo));


      serviceSpy.getConstituentSponsors.and.returnValue(of({ data: [], total: 0 }));


      menuServiceSpy.findMenuItemByPath.and.returnValue({ label: 'Parent Sponsor Query', remarks: 'View Parent Sponsor Query Details.' });


    fixture = TestBed.createComponent(ParentSponsorQueryComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ParentSponsorQueryService) as jasmine.SpyObj<ParentSponsorQueryService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    menuService = TestBed.inject(MenuService) as jasmine.SpyObj<MenuService>;
    router = TestBed.inject(Router);


    });


  describe('Initialization', () => {
    it('should load parent sponsors on init', () => {
      fixture.detectChanges();
      expect(service.getParentSponsorsLookup).toHaveBeenCalled();
      expect(component.parentSponsors).toEqual(mockParentSponsors);
    });





    it('should initialize table columns', () => {
      fixture.detectChanges();
      expect(component.tableConfig.columns).toBeDefined();
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    });
  });

  describe('Sponsor Search Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter sponsors by name', fakeAsync(() => {
      component.sponsorSearchControl.setValue('Test');
      tick(300); // debounce time

      expect(component.filteredParentSponsors.length).toBe(2);
      expect(component.filteredParentSponsors.every(s => s.sponsorName.includes('Test'))).toBeTrue();
    }));



    it('should show all sponsors when search is cleared', fakeAsync(() => {
      component.sponsorSearchControl.setValue('Test');
      tick(300);
      component.sponsorSearchControl.setValue('');
      tick(300);

      expect(component.filteredParentSponsors.length).toBe(3);
    }));


  });

  describe('Parent Sponsor Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load sponsor info when sponsor is selected', () => {
      component.onParentSponsorChange('SPON001');

      expect(service.getParentSponsorInfo).toHaveBeenCalledWith('SPON001');
      expect(component.parentSponsorInfo).toEqual(mockParentSponsorInfo);
    });




  });

  describe('Sponsor Dropdown Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display sponsor name in read-only field as "--" when no sponsor is selected', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const sponsorNameInput = compiled.querySelector('.sponsor-name-field input') as HTMLInputElement;

      expect(sponsorNameInput.value).toBe('--');
    });

    it('should display sponsor name in read-only field when sponsor is selected', () => {
      component.parentSponsorInfo = mockParentSponsorInfo;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const sponsorNameInput = compiled.querySelector('.sponsor-name-field input') as HTMLInputElement;

      expect(sponsorNameInput.value).toBe('Test Sponsor 1');
    });

    it('should have both sponsorId and sponsorName in filteredParentSponsors for dropdown display', () => {
      expect(component.filteredParentSponsors.length).toBeGreaterThan(0);
      component.filteredParentSponsors.forEach(sponsor => {
        expect(sponsor.sponsorId).toBeDefined();
        expect(sponsor.sponsorName).toBeDefined();
      });
    });

    it('should display only sponsor ID in mat-select-trigger when selected', () => {
      component.filterForm.patchValue({ parentSponsorId: 'SPON001' });
      fixture.detectChanges();

      // The mat-select-trigger should display only the ID value
      expect(component.filterForm.get('parentSponsorId')?.value).toBe('SPON001');
    });

    it('should handle missing sponsor name with fallback "--"', () => {
      const sponsorWithMissingName: ParentSponsorLookup = { sponsorId: 'SPON999', sponsorName: '' };
      component.filteredParentSponsors = [sponsorWithMissingName];
      fixture.detectChanges();

      // Template uses {{ sponsor.sponsorName || '--' }} for fallback
      expect(sponsorWithMissingName.sponsorName || '--').toBe('--');
    });

    it('should handle missing sponsor ID with fallback "--"', () => {
      const sponsorWithMissingId: ParentSponsorLookup = { sponsorId: '', sponsorName: 'Test Sponsor' };
      component.filteredParentSponsors = [sponsorWithMissingId];
      fixture.detectChanges();

      // Template uses {{ sponsor.sponsorId || '--' }} for fallback
      expect(sponsorWithMissingId.sponsorId || '--').toBe('--');
    });
  });

  describe('Month Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set date range when month is selected', fakeAsync(() => {
      const currentYear = new Date().getFullYear();

      component.filterForm.patchValue({ month: MonthFilter.January });
      tick();

      expect(component.filterForm.value.fromDate).toEqual(new Date(currentYear, 0, 1));
      expect(component.filterForm.value.toDate).toEqual(new Date(currentYear, 0, 31));
    }));

    it('should set full year range when Yearly is selected', fakeAsync(() => {
      const currentYear = new Date().getFullYear();

      component.filterForm.patchValue({ month: MonthFilter.Yearly });
      tick();

      expect(component.filterForm.value.fromDate).toEqual(new Date(currentYear, 0, 1));
      expect(component.filterForm.value.toDate).toEqual(new Date(currentYear, 11, 31));
    }));


  });

  describe('Retrieve Data', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should load data when parent sponsor is selected', () => {
      const mockResponse = {
        data: [
          { constituentSponsor: 'Child 1', sponsorId: 'CHILD001', recruiter: 'J.Smith' }
        ],
        total: 1
      };
      service.getConstituentSponsors.and.returnValue(of(mockResponse));

      component.filterForm.patchValue({
        parentSponsorId: 'SPON001',
        showDriveData: ShowDriveDataOption.No
      });
      component.onRetrieve();

      expect(service.getConstituentSponsors).toHaveBeenCalled();
      expect(component.dataSource.length).toBe(1);
      expect(component.hasSearched).toBeTrue();
    });



    it('should send undefined for null dates', () => {
      const mockResponse = { data: [], total: 0 };
      service.getConstituentSponsors.and.returnValue(of(mockResponse));

      component.filterForm.patchValue({
        parentSponsorId: 'SPON001',
        showDriveData: ShowDriveDataOption.No,
        fromDate: null,
        toDate: null
      });
      component.onRetrieve();

      const callArgs = service.getConstituentSponsors.calls.mostRecent().args;
      const requestBody = callArgs[2];

      expect(requestBody.fromDate).toBeUndefined();
      expect(requestBody.toDate).toBeUndefined();
    });

    it('should reset pagination on retrieve', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.filterForm.patchValue({
        parentSponsorId: 'SPON001',
        showDriveData: ShowDriveDataOption.No
      });
      component.onRetrieve();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should update columns based on showDriveData selection', () => {
      component.filterForm.patchValue({
        parentSponsorId: 'SPON001',
        showDriveData: ShowDriveDataOption.Yes
      });
      component.onRetrieve();

      // Detailed mode should have more columns
      expect(component.tableConfig.columns.length).toBeGreaterThan(3);
    });

    it('should load totals in detailed mode', () => {
      // historicalProjDeferrals is DEFRT value from VALID_PARAMETERS (user-configured)
      // Same value displayed for ALL sponsors (e.g., 18% configured in System Parameters)
      const deferralRate = 18;
      const mockResponse = {
        data: [{ constituentSponsor: 'Child 1', sponsorId: 'CHILD001', recruiter: 'J.Smith', donorBase: 100, drives: 5, historicalPenetration: 20, actualDraw: 20, historicalProjDeferrals: deferralRate }],
        total: 1,
        totals: {
          totalSponsors: 1,
          totalDonorBase: 100,
          totalDrives: 5,
          totalHistoricalPenetration: 20,
          totalActualDraw: 20,
          totalHistoricalProjDeferrals: deferralRate // Same DEFRT value for totals
        }
      };
      service.getConstituentSponsors.and.returnValue(of(mockResponse));

      component.filterForm.patchValue({
        parentSponsorId: 'SPON001',
        showDriveData: ShowDriveDataOption.Yes
      });
      component.onRetrieve();

      expect(component.totals).toBeDefined();
      expect(component.totals?.totalDrives).toBe(5);
      expect(component.totals?.totalHistoricalProjDeferrals).toBe(deferralRate);
    });

    it('should handle errors during data load', () => {
      service.getConstituentSponsors.and.returnValue(throwError(() => ({ error: { message: 'Error loading data' } })));

      component.filterForm.patchValue({
        parentSponsorId: 'SPON001',
        showDriveData: ShowDriveDataOption.No
      });
      component.onRetrieve();

      expect(component.hasError).toBeTrue();
      expect(component.errorMessage).toBe('Error loading data');
    });
  });





  describe('isDetailedMode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when showDriveData is Yes', () => {
      component.filterForm.patchValue({ showDriveData: ShowDriveDataOption.Yes });
      expect(component.isDetailedMode).toBeTrue();
    });

    it('should return false when showDriveData is No', () => {
      component.filterForm.patchValue({ showDriveData: ShowDriveDataOption.No });
      expect(component.isDetailedMode).toBeFalse();
    });
  });

  describe('Formatting Functions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format number with locale string', () => {
      const originalToLocaleString = Number.prototype.toLocaleString;
      spyOn(Number.prototype, 'toLocaleString').and.callFake(function (this: number) {
        return originalToLocaleString.call(this, 'en-US');
      });
      expect(component.formatNumber(1234567)).toBe('1,234,567');
    });



    it('should format percent values', () => {
      expect(component.formatPercent(25.5)).toBe('25.5');
    });


  });
  describe('Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when To Date is before From Date', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date(2026, 2, 15), // March 15, 2026
        toDate: new Date(2026, 2, 10)    // March 10, 2026
      });
      tick();

      // Form should have dateRangeInvalid error
      expect(component.filterForm.errors?.['dateRangeInvalid']).toBeTrue();
      // Error message should be shown immediately (without requiring touched/dirty)
      expect(component.getToDateError()).toBe("'To Date' must be greater or equal to 'From Date'");
    }));

    it('should not show error when From Date equals To Date', fakeAsync(() => {
      const sameDate = new Date(2026, 2, 15);
      component.filterForm.patchValue({
        fromDate: sameDate,
        toDate: sameDate
      });
      tick();

      expect(component.filterForm.errors?.['dateRangeInvalid']).toBeFalsy();
      expect(component.getToDateError()).toBe('');
    }));







    it('should auto-populate valid dates when month is selected', fakeAsync(() => {
      const currentYear = new Date().getFullYear();

      component.filterForm.patchValue({ month: MonthFilter.March });
      tick();

      expect(component.filterForm.value.fromDate).toEqual(new Date(currentYear, 2, 1));
      expect(component.filterForm.value.toDate).toEqual(new Date(currentYear, 2, 31));
      expect(component.filterForm.errors?.['dateRangeInvalid']).toBeFalsy();
    }));





    it('should show From Date error immediately for invalid date format', fakeAsync(() => {
      const fromDateControl = component.filterForm.get('fromDate');
      fromDateControl?.setValue(null);
      fromDateControl?.setErrors({ invalidDateFormat: true });
      tick();

      // Error should show immediately without requiring touched
      expect(component.getFromDateError()).toBe('From Date is invalid');
    }));

    it('should show To Date error immediately for matDatepickerParse error', fakeAsync(() => {
      const toDateControl = component.filterForm.get('toDate');
      toDateControl?.setValue(null);
      toDateControl?.setErrors({ matDatepickerParse: true });
      tick();

      // Error should show immediately without requiring touched
      expect(component.getToDateError()).toBe('To Date is invalid');
    }));

    it('should show From Date error immediately for invalidDate error', fakeAsync(() => {
      const fromDateControl = component.filterForm.get('fromDate');
      fromDateControl?.setValue(null);
      fromDateControl?.setErrors({ invalidDate: true });
      tick();

      // Error should show immediately without requiring touched
      expect(component.getFromDateError()).toBe('From Date is invalid');
    }));

    it('should show error and not call service when date validation fails on RETRIEVE', fakeAsync(() => {
      service.getConstituentSponsors.calls.reset();

      // Set valid required fields with invalid date range
      component.filterForm.patchValue({
        parentSponsorId: 'SPON001',
        showDriveData: ShowDriveDataOption.No,
        fromDate: new Date(2026, 2, 15),
        toDate: new Date(2026, 2, 10) // Before From Date - invalid
      });
      tick();

      // Click RETRIEVE
      component.onRetrieve();
      tick();

      // Form should be invalid due to date range error
      expect(component.filterForm.invalid).toBeTrue();
      // Date fields should be marked as touched to show errors
      expect(component.filterForm.get('fromDate')?.touched).toBeTrue();
      expect(component.filterForm.get('toDate')?.touched).toBeTrue();
      // Error message should be shown
      expect(component.getToDateError()).toBe("'To Date' must be greater or equal to 'From Date'");
      // Service should NOT have been called
      expect(service.getConstituentSponsors).not.toHaveBeenCalled();
    }));

    it('should call service when dates are valid on RETRIEVE', fakeAsync(() => {
      const mockResponse = { data: [], total: 0 };
      service.getConstituentSponsors.and.returnValue(of(mockResponse));

      // Set valid required fields with valid date range
      component.filterForm.patchValue({
        parentSponsorId: 'SPON001',
        showDriveData: ShowDriveDataOption.No,
        fromDate: new Date(2026, 2, 10),
        toDate: new Date(2026, 2, 15) // After From Date - valid
      });
      tick();

      // Click RETRIEVE
      component.onRetrieve();
      tick();

      // Form should be valid
      expect(component.filterForm.valid).toBeTrue();
      // Service should have been called
      expect(service.getConstituentSponsors).toHaveBeenCalled();
    }));

    it('should show error immediately when date has parse error (no touch required)', fakeAsync(() => {
      // Set invalid date format error on fromDate
      const fromDateControl = component.filterForm.get('fromDate');
      fromDateControl?.setErrors({ matDatepickerParse: true });

      component.filterForm.patchValue({
        parentSponsorId: 'SPON001',
        showDriveData: ShowDriveDataOption.No
      });
      tick();

      // Error should show immediately without requiring touched
      expect(component.getFromDateError()).toBe('From Date is invalid');

      // Click RETRIEVE should not call service due to invalid form
      component.onRetrieve();
      tick();

      expect(service.getConstituentSponsors).not.toHaveBeenCalled();
    }));
  });
});
