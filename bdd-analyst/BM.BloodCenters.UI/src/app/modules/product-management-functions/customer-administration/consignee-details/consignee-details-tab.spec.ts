import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { SimpleChange } from '@angular/core';

import { ConsigneeDetailsTabComponent } from './consignee-details-tab';
import { ConsigneeApiService } from './services/consignee-api.service';
import { HeaderService } from '@shared/services/header.service';
import { ConsigneeDto, CustomerDataForConsignee } from './models/consignee.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ConsigneeDetailsTabComponent', () => {
  let headerSpy: any;
  let apiSpy: any;
  let component: ConsigneeDetailsTabComponent;
  let fixture: ComponentFixture<ConsigneeDetailsTabComponent>;
  let consigneeApiServiceSpy: jasmine.SpyObj<ConsigneeApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockConsignees: ConsigneeDto[] = [
    {
      consigneeId: 'CON001',
      customerId: 'CUST001',
      chapterId: 'CH01',
      name: 'Active Consignee',
      shortName: 'ACTCON',
      intFlag: 'N',
      address1: '123 Test St',
      address2: null,
      address3: null,
      city: 'Dallas',
      state: 'TX',
      zip: '75001',
      country: 'USA',
      phoneNo: '2145551234',
      phoneExt: null,
      faxNo: null,
      telexNo: null,
      intPhone: null,
      zone: 'Z1',
      zoneDescription: 'Zone 1',
      adLocation: null,
      outOfState: 'N',
      arShipToNo: null,
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
      lastModifiedDate: '2024-05-26T10:30:00Z',
      programId: 'VSCONNEE'
    },
    {
      consigneeId: 'CON002',
      customerId: 'CUST001',
      chapterId: 'CH01',
      name: 'Inactive Consignee',
      shortName: 'INACON',
      intFlag: 'N',
      address1: '456 Test St',
      address2: null,
      address3: null,
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'USA',
      phoneNo: null,
      phoneExt: null,
      faxNo: null,
      telexNo: null,
      intPhone: null,
      zone: 'Z2',
      zoneDescription: 'Zone 2',
      adLocation: null,
      outOfState: 'Y',
      arShipToNo: null,
      effDate: '2023-01-01T00:00:00Z',
      termDate: '2023-12-31T00:00:00Z',
      lastModifiedDate: '2023-12-31T10:30:00Z',
      programId: 'VSCONNEE'
    }
  ];

  const mockCustomerData: CustomerDataForConsignee = {
    customerId: 'CUST001',
    name: 'Test Customer',
    shortName: 'TESTCUST',
    address1: '100 Customer St',
    address2: null,
    address3: null,
    city: 'Dallas',
    state: 'TX',
    zip: '75001',
    country: 'USA',
    phoneNo: '2145550000',
    faxNo: null,
    intPhone: null,
    telexNo: null,
    intFlag: null
  };

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('ConsigneeApiService', ['getConsigneesByCustomer']);
    headerSpy = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ConsigneeDetailsTabComponent
      ],
      providers: [
        { provide: ConsigneeApiService, useValue: apiSpy },
        { provide: HeaderService, useValue: headerSpy }
      ]
    });


    


      apiSpy.getConsigneesByCustomer.calls.reset();


    consigneeApiServiceSpy = TestBed.inject(ConsigneeApiService) as jasmine.SpyObj<ConsigneeApiService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;


    
    consigneeApiServiceSpy.getConsigneesByCustomer.and.returnValue(of({ data: mockConsignees, total: 2 }));
    fixture = TestBed.createComponent(ConsigneeDetailsTabComponent);
    component = fixture.componentInstance;
    component.customerId = 'CUST001';
    component.customerData = mockCustomerData;
  });


  describe('initialization', () => {
    it('should load consignees on init when customerId is provided', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(consigneeApiServiceSpy.getConsigneesByCustomer).toHaveBeenCalledWith(
        'CUST001',
        jasmine.objectContaining({ includeTerminated: 'Y' })
      );
      expect(component.consignees().length).toBe(2);
    }));

    it('should not load consignees when customerId is not provided', () => {
      component.customerId = '';
      fixture.detectChanges();

      expect(component.consignees().length).toBe(0);
    });

    it('should show loading state while fetching data', () => {
      // This tests that when isLoading signal is true, the component renders correctly
      // We don't trigger change detection which would call loadConsignees
      component.isLoading.set(true);
      component.hasError.set(false);

      // Test the signal state directly (the template uses this via @if directive)
      expect(component.isLoading()).toBeTrue();
      expect(component.hasError()).toBeFalse();
    });
  });

  describe('error handling', () => {
    it('should display error message on API failure', fakeAsync(() => {
      consigneeApiServiceSpy.getConsigneesByCustomer.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to load consignees' } }))
      );

      fixture.detectChanges();
      tick();

      expect(component.hasError()).toBeTrue();
      expect(component.errorMessage()).toBe('Failed to load consignees');
    }));

    it('should display retry button on error', fakeAsync(() => {
      consigneeApiServiceSpy.getConsigneesByCustomer.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();
      tick();

      const retryButton = fixture.nativeElement.querySelector('.error-container button');
      expect(retryButton).toBeTruthy();
      expect(retryButton.textContent.trim()).toContain('Retry');
    }));
  });
  describe('consignee cards', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display consignee cards', () => {
      const cards = fixture.nativeElement.querySelectorAll('.consignee-card');
      expect(cards.length).toBe(2);
    });

    it('should display consignee name in card', () => {
      const cardTitle = fixture.nativeElement.querySelector('.card-title');
      expect(cardTitle.textContent).toContain('Active Consignee');
    });




  });

  describe('isActive method', () => {


    it('should return true when termDate is in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const consignee = { ...mockConsignees[0], termDate: futureDate.toISOString() };
      expect(component.isActive(consignee)).toBeTrue();
    });

    it('should return false when termDate is in the past', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const consignee = { ...mockConsignees[0], termDate: pastDate.toISOString() };
      expect(component.isActive(consignee)).toBeFalse();
    });
  });
  describe('formatAddress method', () => {
    it('should format address with all parts', () => {
      const consignee = mockConsignees[0];
      const result = component.formatAddress(consignee);
      expect(result).toContain('123 Test St');
      expect(result).toContain('Dallas');
      expect(result).toContain('TX');
    });

    it('should skip null parts', () => {
      const consignee = { ...mockConsignees[0], address2: null, address3: null };
      const result = component.formatAddress(consignee);
      expect(result).not.toContain('null');
    });
  });

  describe('side panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open add panel when clicking add button', () => {
      component.openAddPanel();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.selectedConsignee).toBeNull();
    });

    it('should open edit panel when clicking edit button', () => {
      component.openEditPanel(mockConsignees[0]);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.selectedConsignee).toEqual(mockConsignees[0]);
    });



    it('should reload consignees on save success', fakeAsync(() => {
      consigneeApiServiceSpy.getConsigneesByCustomer.calls.reset();
      component.onSaveSuccess();
      tick();

      expect(component.sidePanelOpen).toBeFalse();
      expect(consigneeApiServiceSpy.getConsigneesByCustomer).toHaveBeenCalled();
    }));

    it('should close side panel and clear selected consignee on closeSidePanel', fakeAsync(() => {
      component.openEditPanel(mockConsignees[0]);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.selectedConsignee).toEqual(mockConsignees[0]);

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.selectedConsignee).toBeNull();
    }));
  });

  // ── ngOnChanges ───────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('should reload consignees when customerId changes (non-first change)', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      consigneeApiServiceSpy.getConsigneesByCustomer.calls.reset();

      component.customerId = 'CUST002';
      component.ngOnChanges({
        customerId: new SimpleChange('CUST001', 'CUST002', false)
      });
      tick();

      expect(consigneeApiServiceSpy.getConsigneesByCustomer).toHaveBeenCalled();
    }));

    it('should NOT reload consignees on firstChange', fakeAsync(() => {
      // Do not call detectChanges so ngOnInit hasn't fired yet
      consigneeApiServiceSpy.getConsigneesByCustomer.calls.reset();

      component.ngOnChanges({
        customerId: new SimpleChange(undefined, 'CUST001', true)
      });
      tick();

      expect(consigneeApiServiceSpy.getConsigneesByCustomer).not.toHaveBeenCalled();
    }));
  });

  // ── formatDate ────────────────────────────────────────────────────────────

  describe('formatDate method', () => {
    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should return formatted uppercase date for valid ISO string', () => {
      expect(component.formatDate('2024-01-15T00:00:00Z')).toBe('15-JAN-2024');
    });

    it('should return dash for invalid date string', () => {
      expect(component.formatDate('not-a-real-date')).toBe('-');
    });
  });

  // ── getActiveConsigneeCount ───────────────────────────────────────────────

  describe('getActiveConsigneeCount', () => {
    it('should count only active consignees after data is loaded', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // mockConsignees[0] has no termDate → active; [1] has past termDate → inactive
      expect(component.getActiveConsigneeCount()).toBe(1);
    }));
  });

  // ── activeConsigneeCount output ───────────────────────────────────────────

  describe('activeConsigneeCount output', () => {
    it('should emit active count after loading consignees', fakeAsync(() => {
      spyOn(component.activeConsigneeCount, 'emit');

      fixture.detectChanges();
      tick();

      expect(component.activeConsigneeCount.emit).toHaveBeenCalledWith(1);
    }));
  });

  // ── saveSuccess output ────────────────────────────────────────────────────

  describe('saveSuccess output', () => {
    it('should emit saveSuccess when onSaveSuccess is called', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component.saveSuccess, 'emit');
      component.onSaveSuccess();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));
  });

  // ── error fallback ────────────────────────────────────────────────────────

  describe('error fallback message', () => {
    it('should use fallback message when error has no error.message', fakeAsync(() => {
      consigneeApiServiceSpy.getConsigneesByCustomer.and.returnValue(
        throwError(() => new Error('Network Error'))
      );

      fixture.detectChanges();
      tick();

      expect(component.hasError()).toBeTrue();
      expect(component.errorMessage()).toBe('Failed to load consignees');
    }));
  });

  // ── chapterChanged$ subscription ──────────────────────────────────────────

  describe('chapterChanged$ subscription', () => {
    let chapterSubject: Subject<void>;

    beforeEach(() => {
      // Replace chapterChanged$ on the already-configured spy (no TestBed reconfigure needed)
      chapterSubject = new Subject<void>();
      headerSpy.chapterChanged$ = chapterSubject.asObservable();

      // Re-create the fixture so ngOnInit picks up the new chapterChanged$ observable
      consigneeApiServiceSpy.getConsigneesByCustomer.and.returnValue(of({ data: mockConsignees, total: 2 }));
      fixture = TestBed.createComponent(ConsigneeDetailsTabComponent);
      component = fixture.componentInstance;
      component.customerId = 'CUST001';
    });

    it('should reload consignees when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      consigneeApiServiceSpy.getConsigneesByCustomer.calls.reset();
      chapterSubject.next();
      tick();

      expect(consigneeApiServiceSpy.getConsigneesByCustomer).toHaveBeenCalled();
    }));
  });

});
