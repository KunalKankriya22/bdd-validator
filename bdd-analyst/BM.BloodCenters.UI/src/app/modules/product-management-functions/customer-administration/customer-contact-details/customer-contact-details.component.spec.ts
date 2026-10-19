import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CustomerContactDetailsComponent } from './customer-contact-details.component';
import { CustomerContactApiService } from './services/customer-contact-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { CustomerContactDto, ContactTypeDto } from './models/customer-contact.model';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';

describe('CustomerContactDetailsComponent', () => {
  let component: CustomerContactDetailsComponent;
  let fixture: ComponentFixture<CustomerContactDetailsComponent>;
  let apiServiceSpy: jasmine.SpyObj<CustomerContactApiService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockContacts: CustomerContactDto[] = [
    {
      customerId: 'CUST001',
      instId: '0001',
      contactType: 'D',
      contactTypeDesc: 'Director',
      firstName: 'John',
      lastName: 'Smith',
      dayPhoneNo: '555-1234',
      effDate: '2024-01-01T00:00:00',
      termDate: null
    },
    {
      customerId: 'CUST001',
      instId: '0002',
      contactType: 'F',
      contactTypeDesc: 'Financial',
      firstName: 'Jane',
      lastName: 'Doe',
      dayPhoneNo: '555-4321',
      effDate: '2024-03-01T00:00:00',
      termDate: null
    }
  ];

  beforeEach(async () => {
    chapterChanged$ = new Subject<void>();
    apiServiceSpy = jasmine.createSpyObj('CustomerContactApiService', ['getCustomerContacts', 'getContactTypes']);
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChanged$.asObservable()
    });

    const mockContactTypes: ContactTypeDto[] = [
      { code: 'D', description: 'Director' },
      { code: 'F', description: 'Financial' }
    ];
    apiServiceSpy.getCustomerContacts.and.returnValue(of({ data: mockContacts, total: 2 }));
    apiServiceSpy.getContactTypes.and.returnValue(of(mockContactTypes));

    await TestBed.configureTestingModule({
      imports: [CustomerContactDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: CustomerContactApiService, useValue: apiServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerContactDetailsComponent);
    component = fixture.componentInstance;
    component.customerId = 'CUST001';
    component.customerName = 'Okinawa Japan Hospital';
  });

  describe('Initialization', () => {
    it('should load contacts on init when customerId is provided', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getCustomerContacts).toHaveBeenCalledWith('CUST001', true);
    });

    it('should not load contacts when customerId is empty', () => {
      component.customerId = '';
      fixture.detectChanges();
      expect(apiServiceSpy.getCustomerContacts).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should clear loading after success', () => {
      fixture.detectChanges();
      expect(component.isLoading()).toBeFalse();
    });

    it('should show spinner while loading', () => {
      apiServiceSpy.getCustomerContacts.and.returnValue(new Subject<any>().asObservable());
      component.loadContacts();
      fixture.detectChanges();
      expect(component.isLoading()).toBeTrue();
      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should disable add button while loading', () => {
      apiServiceSpy.getCustomerContacts.and.returnValue(new Subject<any>().asObservable());
      component.loadContacts();
      fixture.detectChanges();
      const addBtn = fixture.debugElement.query(By.css('button[aria-label="Add new customer contact"]'));
      expect(addBtn.nativeElement.disabled).toBeTrue();
    });
  });

  describe('Error State', () => {
    it('should set hasError and errorMessage on failure', () => {
      const error = { error: { message: 'Server error' } };
      apiServiceSpy.getCustomerContacts.and.returnValue(throwError(() => error));
      fixture.detectChanges();

      expect(component.hasError()).toBeTrue();
      expect(component.errorMessage()).toContain('Server error');
    });

    it('should display error with errorCode from errorResponse', () => {
      const error = { error: { errorResponse: { errorCode: '0201', error: 'Field required' } } };
      apiServiceSpy.getCustomerContacts.and.returnValue(throwError(() => error));
      fixture.detectChanges();

      expect(component.errorMessage()).toBe('Error 0201: Field required');
    });

    it('should display error with errorCode from body', () => {
      const error = { error: { errorCode: '0302', error: 'Invalid customer' } };
      apiServiceSpy.getCustomerContacts.and.returnValue(throwError(() => error));
      fixture.detectChanges();

      expect(component.errorMessage()).toBe('Error 0302: Invalid customer');
    });

    it('should use fallback message when no specific error', () => {
      apiServiceSpy.getCustomerContacts.and.returnValue(throwError(() => ({ error: {} })));
      fixture.detectChanges();

      expect(component.errorMessage()).toBe('Failed to load customer contacts. Please try again.');
    });

    it('should log error via LoggingService', () => {
      const error = { error: { message: 'test' } };
      apiServiceSpy.getCustomerContacts.and.returnValue(throwError(() => error));
      fixture.detectChanges();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith('Failed to load customer contacts', error);
    });

    it('should show snackbar on error', () => {
      const error = { error: { message: 'test error' } };
      apiServiceSpy.getCustomerContacts.and.returnValue(throwError(() => error));
      fixture.detectChanges();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should render error container with retry button', () => {
      apiServiceSpy.getCustomerContacts.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      const retryBtn = errorContainer.query(By.css('button'));
      expect(retryBtn.nativeElement.textContent.trim()).toContain('Retry');
    });

    it('should reload contacts when retry is clicked', () => {
      apiServiceSpy.getCustomerContacts.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
      fixture.detectChanges();

      apiServiceSpy.getCustomerContacts.and.returnValue(of({ data: mockContacts, total: 2 }));
      const retryBtn = fixture.debugElement.query(By.css('.error-container button'));
      retryBtn.nativeElement.click();

      expect(apiServiceSpy.getCustomerContacts).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadContacts with no customerId', () => {
    it('should set error when customerId is empty', () => {
      component.customerId = '';
      component.loadContacts();

      expect(component.hasError()).toBeTrue();
      expect(component.errorMessage()).toBe('Customer ID is required');
    });
  });

  describe('Empty State', () => {
    it('isEmpty should be true when contacts array is empty and not loading', () => {
      apiServiceSpy.getCustomerContacts.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();
      expect(component.isEmpty).toBeTrue();
    });

    it('isEmpty should be false when loading', () => {
      apiServiceSpy.getCustomerContacts.and.returnValue(new Subject<any>().asObservable());
      component.loadContacts();
      expect(component.isEmpty).toBeFalse();
    });

    it('isEmpty should be false when hasError', () => {
      apiServiceSpy.getCustomerContacts.and.returnValue(throwError(() => ({ error: {} })));
      fixture.detectChanges();
      expect(component.isEmpty).toBeFalse();
    });

    it('should render empty state container', () => {
      apiServiceSpy.getCustomerContacts.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();
      const empty = fixture.debugElement.query(By.css('.empty-container'));
      expect(empty).toBeTruthy();
      expect(empty.nativeElement.textContent).toContain('No contacts have been added');
    });
  });

  describe('Contacts Display', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(() => { fixture.detectChanges(); done(); }, 100);
    });

    it('should render a card per contact', () => {
      expect(fixture.debugElement.queryAll(By.css('app-customer-contact-card')).length).toBe(2);
    });

    it('should pass contact data to card', () => {
      const card = fixture.debugElement.query(By.css('app-customer-contact-card'));
      expect(card.componentInstance.contact).toEqual(mockContacts[0]);
    });

    it('should pass customerName to card', () => {
      const card = fixture.debugElement.query(By.css('app-customer-contact-card'));
      expect(card.componentInstance.customerName).toBe('Okinawa Japan Hospital');
    });

    it('should show contacts grid with aria-label', () => {
      const grid = fixture.debugElement.query(By.css('.contacts-grid'));
      expect(grid).toBeTruthy();
      expect(grid.nativeElement.getAttribute('aria-label')).toContain('2 total');
    });
  });

  describe('Contact Sorting', () => {
    it('should sort active contacts before inactive', () => {
      const mixedContacts: CustomerContactDto[] = [
        { customerId: 'CUST001', instId: '0003', firstName: 'Inactive', lastName: 'Contact', effDate: '2020-01-01', termDate: '2020-06-01', dayPhoneNo: '555-0000' },
        { customerId: 'CUST001', instId: '0004', firstName: 'Active', lastName: 'Contact', effDate: '2024-01-01', termDate: null, dayPhoneNo: '555-1111' }
      ];
      apiServiceSpy.getCustomerContacts.and.returnValue(of({ data: mixedContacts, total: 2 }));
      fixture.detectChanges();

      const contacts = component.contacts();
      expect(contacts[0].firstName).toBe('Active');
      expect(contacts[1].firstName).toBe('Inactive');
    });
  });

  describe('Active Contact Count', () => {
    it('should emit activeContactCount with number of active contacts', () => {
      spyOn(component.activeContactCount, 'emit');
      fixture.detectChanges();

      expect(component.activeContactCount.emit).toHaveBeenCalledWith(2);
    });

    it('should emit 0 when all contacts are terminated', () => {
      const terminated: CustomerContactDto[] = [
        { customerId: 'CUST001', instId: '0001', firstName: 'A', lastName: 'B', effDate: '2020-01-01', termDate: '2020-06-01', dayPhoneNo: '555-0000' }
      ];
      apiServiceSpy.getCustomerContacts.and.returnValue(of({ data: terminated, total: 1 }));
      spyOn(component.activeContactCount, 'emit');
      fixture.detectChanges();

      expect(component.activeContactCount.emit).toHaveBeenCalledWith(0);
    });
  });

  describe('Add New Contact', () => {
    it('should set customerId in sidePanelData', () => {
      component.onAddNew();
      expect(component.sidePanelData?.customerId).toBe('CUST001');
    });

    it('should set mode to add', () => {
      component.onAddNew();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should set sidePanelOpen to true', () => {
      component.onAddNew();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should render side panel when open', () => {
      component.onAddNew();
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.side-panel-container'))).toBeTruthy();
    });

    it('should close panel when overlay is clicked', () => {
      component.onAddNew();
      fixture.detectChanges();
      fixture.debugElement.query(By.css('.side-panel-overlay')).nativeElement.click();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should close panel on Escape key', () => {
      component.onAddNew();
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('.side-panel-container'));
      container.triggerEventHandler('keydown.escape', {});
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should have cdkTrapFocus on side panel container', () => {
      component.onAddNew();
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('.side-panel-container'));
      expect(container.attributes['cdkTrapFocus']).toBeDefined();
    });
  });

  describe('Edit Contact', () => {
    it('should open side panel in edit mode with correct data', () => {
      component.onEditContact(mockContacts[0]);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockContacts[0]);
    });
  });

  describe('Close Side Panel', () => {
    it('should set sidePanelOpen to false', () => {
      component.onAddNew();
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should clear sidePanelData', () => {
      component.onAddNew();
      component.closeSidePanel();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Save Success', () => {
    it('should reload contacts on save success', () => {
      fixture.detectChanges();
      apiServiceSpy.getCustomerContacts.calls.reset();

      component.onSaveSuccess();
      expect(apiServiceSpy.getCustomerContacts).toHaveBeenCalledWith('CUST001', true);
    });
  });

  describe('Chapter Changes', () => {
    it('should reload contacts when chapter changes', () => {
      fixture.detectChanges();
      apiServiceSpy.getCustomerContacts.calls.reset();

      chapterChanged$.next();
      expect(apiServiceSpy.getCustomerContacts).toHaveBeenCalledWith('CUST001', true);
    });
  });

  describe('Total Records', () => {
    it('should set totalRecords from response', () => {
      apiServiceSpy.getCustomerContacts.and.returnValue(of({ data: mockContacts, total: 5 }));
      fixture.detectChanges();
      expect(component.totalRecords()).toBe(5);
    });
  });

  describe('Unique ID Generation', () => {
    it('should have unique componentId', () => {
      expect((component as any).componentId).toMatch(/^customer-contact-details-\d+$/);
    });

    it('should generate unique IDs across instances', () => {
      const f2 = TestBed.createComponent(CustomerContactDetailsComponent);
      expect((component as any).componentId).not.toBe((f2.componentInstance as any).componentId);
    });

    it('should generate element IDs using componentId prefix', () => {
      const id = (component as any).elementId('heading');
      expect(id).toMatch(/^customer-contact-details-\d+-heading$/);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
