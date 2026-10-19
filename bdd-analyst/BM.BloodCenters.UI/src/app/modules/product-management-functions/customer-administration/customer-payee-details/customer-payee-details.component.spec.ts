import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';

import { CustomerPayeeDetailsComponent } from './customer-payee-details.component';
import { CustomerPayeeApiService } from './services/customer-payee-api.service';
import { CustomerProfileApiService } from '../customer-profile/services/customer-profile-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PayeeCustomerDto } from './models/customer-payee.model';
import { CustomerProfileDto } from '../customer-profile/models/customer-profile.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CustomerPayeeDetailsComponent', () => {
  let component: CustomerPayeeDetailsComponent;
  let fixture: ComponentFixture<CustomerPayeeDetailsComponent>;
  let apiServiceSpy: jasmine.SpyObj<CustomerPayeeApiService>;
  let customerProfileApiSpy: jasmine.SpyObj<CustomerProfileApiService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockPayees: PayeeCustomerDto[] = [
    {
      customerId: 'DAL-PA0004',
      chapterId: 'DAL',
      customerType: 'PA',
      name: 'Okinawa Japan Hospital',
      shortName: 'Okinawa',
      alphaKey: 'OKINAWA JA',
      address1: '876 Heartbeat Lane',
      city: 'Tokyo',
      zip: '27709',
      country: 'Japan',
      phoneNo: '987-654-3219',
      intFlag: 'Y',
      codFlag: 'N',
      effDate: '30-Jan-2025',
      termDate: null,
      lastModifiedDate: '11-Jan-2025'
    },
    {
      customerId: 'DAL-PA0005',
      chapterId: 'DAL',
      customerType: 'PA',
      name: 'Dallas Medical Center',
      shortName: 'Dallas Med',
      alphaKey: 'DALLAS MED',
      address1: '950 Heartbeat Lane',
      city: 'Tokyo',
      zip: '27709',
      country: 'Japan',
      phoneNo: '987-654-3219',
      intFlag: 'N',
      codFlag: 'N',
      effDate: '30-Jan-2025',
      termDate: '30-Jan-2026',
      lastModifiedDate: '11-Jan-2025'
    },
    {
      customerId: 'DAL-PA0001',
      chapterId: 'DAL',
      customerType: 'PA',
      name: 'Inactive Payee',
      shortName: 'Inactive',
      alphaKey: 'INACTIVE',
      address1: '100 Old St',
      city: 'Dallas',
      zip: '75201',
      country: 'USA',
      intFlag: 'N',
      codFlag: 'N',
      effDate: '30-Jan-2020',
      termDate: '30-Jan-2021',
      lastModifiedDate: '30-Jan-2021'
    }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();
    apiServiceSpy = jasmine.createSpyObj('CustomerPayeeApiService', ['getPayeeCustomers', 'getStateCodes', 'getZones', 'createPayee', 'updatePayee']);
    apiServiceSpy.getStateCodes.and.returnValue(of([]));
    apiServiceSpy.getZones.and.returnValue(of([]));
    customerProfileApiSpy = jasmine.createSpyObj('CustomerProfileApiService', ['updateCustomerProfile']);
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    apiServiceSpy.getPayeeCustomers.and.returnValue(of({ data: mockPayees, total: 3 }));



      TestBed.configureTestingModule({
      imports: [CustomerPayeeDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: CustomerPayeeApiService, useValue: apiServiceSpy },
        { provide: CustomerProfileApiService, useValue: customerProfileApiSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });


    


      apiServiceSpy.getPayeeCustomers.calls.reset();


      apiServiceSpy.getStateCodes.calls.reset();


      apiServiceSpy.getZones.calls.reset();


      apiServiceSpy.createPayee.calls.reset();


      apiServiceSpy.updatePayee.calls.reset();


      customerProfileApiSpy.updateCustomerProfile.calls.reset();


      loggingServiceSpy.error.calls.reset();


      apiServiceSpy.getStateCodes.and.returnValue(of([]));


      apiServiceSpy.getZones.and.returnValue(of([]));


      apiServiceSpy.getPayeeCustomers.and.returnValue(of({ data: mockPayees, total: 3 }));


    fixture = TestBed.createComponent(CustomerPayeeDetailsComponent);
    component = fixture.componentInstance;
    component.customerId = 'WAD-DI0121';
    component.customerName = 'Okinawa Japan Hospital';
    component.customerCity = 'Tokyo';
    component.customerProfile = { payeeId: 'WAD-DI0121' } as CustomerProfileDto;


    });

  describe('Initialization', () => {


    it('should load payees on init when customerId is provided', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getPayeeCustomers).toHaveBeenCalledWith(
        100,
        0,
        jasmine.objectContaining({ customerId: 'WAD-DI0121', includeTerminated: true })
      );
    });




  });
  describe('Error State', () => {
    it('should show error message on load failure', () => {
      const error = { error: { message: 'Test error' } };
      apiServiceSpy.getPayeeCustomers.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(component.hasError()).toBeTrue();
      expect(component.errorMessage()).toContain('Test error');
    });







    it('should display error code when provided', () => {
      const error = { error: { errorCode: '500', message: 'Server error' } };
      apiServiceSpy.getPayeeCustomers.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(component.errorMessage()).toContain('500');
      expect(component.errorMessage()).toContain('Server error');
    });
  });
  describe('Payees Display', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(() => {
        fixture.detectChanges();
        done();
      }, 100);
    });

    it('should display payee cards', () => {
      const cards = fixture.debugElement.queryAll(By.css('app-customer-payee-card'));
      expect(cards.length).toBe(3);
    });

    it('should pass payee data to card components', () => {
      const firstCard = fixture.debugElement.query(By.css('app-customer-payee-card'));
      expect(firstCard.componentInstance.payee).toEqual(mockPayees[0]);
    });

    it('should have proper aria-label on payees grid', () => {
      const grid = fixture.debugElement.query(By.css('.payees-grid'));
      const ariaLabel = grid.attributes['aria-label'];
      expect(ariaLabel).toContain('Customer payees');
      expect(ariaLabel).toContain('3 total');
    });
  });

  describe('Add New Payee', () => {
    it('should open side panel on add new click', () => {
      fixture.detectChanges();
      const addButton = fixture.debugElement.query(By.css('[aria-label="Add new payee"]'));
      addButton.nativeElement.click();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should set empty data in sidePanelData when adding', () => {
      component.onAddNew();
      expect(component.sidePanelData).toBeTruthy();
      expect(component.sidePanelData!.customerId).toBe('');
    });



    it('should close side panel when overlay clicked', () => {
      component.onAddNew();
      fixture.detectChanges();

      const overlay = fixture.debugElement.query(By.css('.side-panel-overlay'));
      overlay.nativeElement.click();

      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  describe('Edit Payee', () => {
    it('should open side panel on edit', () => {
      component.onEditPayee(mockPayees[0]);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockPayees[0]);
    });
  });

  describe('isEmpty getter', () => {
    it('should be true when no payees, not loading, no error', () => {
      fixture.detectChanges();
      component.payees.set([]);
      component.isLoading.set(false);
      component.hasError.set(false);
      expect(component.isEmpty).toBeTrue();
    });

    it('should be false when loading', () => {
      component.payees.set([]);
      component.isLoading.set(true);
      expect(component.isEmpty).toBeFalse();
    });

    it('should be false when has error', () => {
      component.payees.set([]);
      component.hasError.set(true);
      expect(component.isEmpty).toBeFalse();
    });
  });

  describe('closeSidePanel', () => {
    it('should close the side panel and clear data', () => {
      component.onAddNew();
      expect(component.sidePanelOpen).toBeTrue();
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete without errors', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('loadPayees with no payeeId', () => {
    it('should emit 0 and not call API when customerProfile has no payeeId', () => {
      component.customerProfile = { payeeId: '' } as CustomerProfileDto;
      apiServiceSpy.getPayeeCustomers.calls.reset();
      let emittedCount = -1;
      component.activePayeeCount.subscribe(count => { emittedCount = count; });
      component.loadPayees();
      expect(apiServiceSpy.getPayeeCustomers).not.toHaveBeenCalled();
      expect(emittedCount).toBe(0);
    });

    it('should emit 0 and not call API when customerProfile is null', () => {
      component.customerProfile = null;
      apiServiceSpy.getPayeeCustomers.calls.reset();
      let emittedCount = -1;
      component.activePayeeCount.subscribe(count => { emittedCount = count; });
      component.loadPayees();
      expect(apiServiceSpy.getPayeeCustomers).not.toHaveBeenCalled();
      expect(emittedCount).toBe(0);
    });
  });

  describe('onSaveSuccess', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call loadPayees when newPayeeId is empty string', () => {
      apiServiceSpy.getPayeeCustomers.calls.reset();
      component.onSaveSuccess('');
      expect(apiServiceSpy.getPayeeCustomers).toHaveBeenCalled();
    });

    it('should call linkPayeeToCustomer when newPayeeId is provided', () => {
      customerProfileApiSpy.updateCustomerProfile.and.returnValue(of({}));
      const profile = {
        payeeId: '',
        name: 'Test', shortName: 'T', alphaKey: 'T',
        address1: '123 Main', city: 'Dallas', zip: '75201', country: 'USA',
        codFlag: 'N', returnAcceptedFlag: 'N', intFlag: 'N', arAccount: null,
        effDate: '2024-01-01', termDate: null
      } as CustomerProfileDto;
      component.customerProfile = profile;
      component.onSaveSuccess('NEW-PA0001');
      expect(customerProfileApiSpy.updateCustomerProfile).toHaveBeenCalledWith(
        component.customerId,
        jasmine.objectContaining({ payeeId: 'NEW-PA0001' })
      );
    });
  });

  describe('linkPayeeToCustomer', () => {
    const mockProfile: CustomerProfileDto = {
      payeeId: 'OLD-PA0001',
      name: 'Test Customer', shortName: 'TEST', alphaKey: 'TEST',
      address1: '123 Main St', city: 'Dallas', zip: '75201', country: 'USA',
      codFlag: 'N', returnAcceptedFlag: 'N', intFlag: 'N', arAccount: null,
      effDate: '2024-01-01', termDate: null
    } as CustomerProfileDto;

    const mockProfileWithNullFields: CustomerProfileDto = {
      payeeId: '',
      name: 'Null Fields Customer', shortName: 'NULL', alphaKey: null as any,
      address1: '456 Oak St', address2: 'Suite 100', address3: 'Floor 2',
      city: 'Austin', state: 'TX', zip: '78701', country: 'USA',
      codFlag: 'N', returnAcceptedFlag: 'Y', intFlag: null as any, arAccount: null,
      effDate: null as any, termDate: '2026-01-01',
      phoneNo: '512-555-0001', faxNo: '512-555-0002', intPhone: '1512555', telexNo: 'TLEX01',
      fiPriceSchNo: null as any, priceChangeFlag: null as any, ednGenFlag: null as any,
      plasmaFileType: null as any, phApprFlag: null as any, insApprFlag: null as any
    } as CustomerProfileDto;

    beforeEach(() => {
      component.customerProfile = { ...mockProfile };
      fixture.detectChanges();
    });

    it('should emit payeeLinked and reload payees on success', () => {
      customerProfileApiSpy.updateCustomerProfile.and.returnValue(of({}));
      apiServiceSpy.getPayeeCustomers.calls.reset();
      let emittedId = '';
      component.payeeLinked.subscribe(id => { emittedId = id; });

      component.onSaveSuccess('NEW-PA0001');

      expect(emittedId).toBe('NEW-PA0001');
      expect(apiServiceSpy.getPayeeCustomers).toHaveBeenCalled();
    });

    it('should show error snackbar when link fails', () => {
      customerProfileApiSpy.updateCustomerProfile.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to link' } }))
      );
      component.onSaveSuccess('NEW-PA0001');
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should build payload with null-field profile (covers || null falsy branches)', () => {
      component.customerProfile = { ...mockProfileWithNullFields };
      customerProfileApiSpy.updateCustomerProfile.and.returnValue(of({}));
      component.onSaveSuccess('NEW-PA0002');
      expect(customerProfileApiSpy.updateCustomerProfile).toHaveBeenCalledWith(
        component.customerId,
        jasmine.objectContaining({ payeeId: 'NEW-PA0002' })
      );
    });
  });

  describe('Chapter Changes', () => {
    it('should reload payees when chapter changes', () => {
      fixture.detectChanges();
      apiServiceSpy.getPayeeCustomers.calls.reset();
      chapterChanged$.next();
      expect(apiServiceSpy.getPayeeCustomers).toHaveBeenCalled();
    });

    it('should handle undefined chapterTimeZone in emitActiveCount', () => {
      (headerServiceSpy as any).chapterTimeZone = null;
      fixture.detectChanges();
      expect(apiServiceSpy.getPayeeCustomers).toHaveBeenCalled();
    });
  });

  describe('Error message parsing', () => {
    it('should parse errorResponse.errorCode and error', () => {
      const error = { error: { errorResponse: { errorCode: '1001', error: 'Custom error message' } } };
      apiServiceSpy.getPayeeCustomers.and.returnValue(throwError(() => error));
      fixture.detectChanges();
      expect(component.errorMessage()).toContain('1001');
      expect(component.errorMessage()).toContain('Custom error message');
    });

    it('should use fallback message when no error details', () => {
      apiServiceSpy.getPayeeCustomers.and.returnValue(throwError(() => ({})));
      fixture.detectChanges();
      expect(component.errorMessage()).toContain('Failed to load');
    });
  });

});
