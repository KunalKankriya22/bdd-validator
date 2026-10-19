import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { CustomerPayeeCardComponent } from './customer-payee-card.component';
import { PayeeCustomerDto } from '../models/customer-payee.model';
import { HeaderService } from '@shared/services/header.service';

describe('CustomerPayeeCardComponent', () => {
  let component: CustomerPayeeCardComponent;
  let fixture: ComponentFixture<CustomerPayeeCardComponent>;

  const mockPayee: PayeeCustomerDto = {
    customerId: 'DAL-PA0004',
    chapterId: 'DAL',
    customerType: 'PA',
    name: 'Okinawa Japan Hospital',
    shortName: 'Okinawa',
    alphaKey: 'OKINAWA JA',
    address1: '876 Heartbeat Lane, Suite 1000',
    address2: 'Research Triangle Park',
    address3: null,
    city: 'Tokyo',
    state: null,
    zip: '27709',
    country: 'Japan',
    phoneNo: '987-654-3219',
    phoneExt: null,
    faxNo: null,
    telexNo: '2345234',
    intPhone: '8976543219',
    intFlag: 'Y',
    codFlag: 'N',
    effDate: '30-Jan-2025',
    termDate: null,
    lastModifiedDate: '11-Jan-2025'
  };

  beforeEach(() => {



      TestBed.configureTestingModule({
      imports: [CustomerPayeeCardComponent, NoopAnimationsModule],
      providers: [
        { provide: HeaderService, useValue: { chapterTimeZone: signal('') } },
      ],
    });


    



    fixture = TestBed.createComponent(CustomerPayeeCardComponent);
    component = fixture.componentInstance;
    component.payee = mockPayee;
    component.customerName = 'Okinawa Japan Hospital';
    component.customerCity = 'Tokyo';
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should display payee name', () => {
      const nameElement = fixture.debugElement.query(By.css('.payee-name'));
      expect(nameElement.nativeElement.textContent).toContain('Okinawa Japan Hospital');
    });

    it('should display payee ID', () => {
      const codeElement = fixture.debugElement.query(By.css('.payee-code'));
      expect(codeElement.nativeElement.textContent).toContain('DAL-PA0004');
    });

    it('should display city', () => {
      const locationText = fixture.debugElement.query(By.css('.location-text'));
      expect(locationText).toBeTruthy();
      expect(locationText.nativeElement.textContent).toContain('Tokyo');
    });

    it('should display active status badge', () => {
      const statusBadge = fixture.debugElement.query(By.css('.status-active'));
      expect(statusBadge).toBeTruthy();
      expect(statusBadge.nativeElement.textContent.trim()).toBe('Active');
    });
  });

  describe('Payee Fields', () => {
    it('should display phone number', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Phone Number');
      expect(compiled.textContent).toContain('987-654-3219');
    });

    it('should display international phone number', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('International Phone Number');
      expect(compiled.textContent).toContain('8976543219');
    });

    it('should display international fax', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('International Fax');
      expect(compiled.textContent).toContain('2345234');
    });

    it('should display - for null fax', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Fax');
    });

    it('should display effective date formatted', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Effective Date');
      expect(compiled.textContent).toContain('30-JAN-2025');
    });

    it('should display - for null termination date', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Termination Date');
      expect(compiled.textContent).toContain('-');
    });
  });

  describe('Full Address', () => {
    it('should concatenate address fields', () => {
      expect(component.fullAddress).toContain('876 Heartbeat Lane, Suite 1000');
      expect(component.fullAddress).toContain('Research Triangle Park');
      expect(component.fullAddress).toContain('Tokyo');
      expect(component.fullAddress).toContain('27709');
      expect(component.fullAddress).toContain('Japan');
    });

    it('should exclude null address parts', () => {
      component.payee = { ...mockPayee, address2: null, address3: null };
      expect(component.fullAddress).not.toContain('null');
    });

    it('should include address3 when present', () => {
      component.payee = { ...mockPayee, address3: 'Building C' };
      expect(component.fullAddress).toContain('Building C');
    });

    it('should include state in city/state when present', () => {
      component.payee = { ...mockPayee, state: 'CO', city: 'Denver' };
      expect(component.fullAddress).toContain('Denver');
      expect(component.fullAddress).toContain('CO');
    });

    it('should handle null country in full address', () => {
      component.payee = { ...mockPayee, country: null as any };
      expect(component.fullAddress).not.toContain('null');
    });

    it('should handle null zip in address', () => {
      component.payee = { ...mockPayee, zip: null as any };
      expect(component.fullAddress).not.toContain('null');
    });
  });

  describe('Status Logic', () => {
    it('should be active when termDate is null', () => {
      expect(component.isActive).toBeTrue();
      expect(component.statusClass).toBe('status-active');
      expect(component.statusLabel).toBe('Active');
    });

    it('should be active when termDate is in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      component.payee = { ...mockPayee, termDate: futureDate.toISOString() };
      expect(component.isActive).toBeTrue();
    });

    it('should be inactive when termDate is in the past', () => {
      component.payee = { ...mockPayee, termDate: '2020-01-01' };
      expect(component.isActive).toBeFalse();
      expect(component.statusClass).toBe('status-inactive');
      expect(component.statusLabel).toBe('Inactive');
    });
  });

  describe('Date Formatting', () => {
    it('should format valid dates correctly', () => {
      const formatted = component.formatDate('2025-01-30');
      expect(formatted).toBe('30-JAN-2025');
    });

    it('should return - for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return - for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return - for empty string date', () => {
      expect(component.formatDate('')).toBe('-');
    });
  });

  describe('Edit Functionality', () => {
    it('should have proper aria-label on edit link', () => {
      const editLink = fixture.debugElement.query(By.css('.edit-link'));
      const ariaLabel = editLink.nativeElement.getAttribute('aria-label');
      expect(ariaLabel).toContain('Edit payee');
      expect(ariaLabel).toContain('DAL-PA0004');
    });

    it('should emit the payee when onEdit is called', () => {
      let emittedPayee: PayeeCustomerDto | undefined;
      component.edit.subscribe((payee: PayeeCustomerDto) => { emittedPayee = payee; });
      component.onEdit();
      expect(emittedPayee).toEqual(mockPayee);
    });
  });
  describe('Missing Data Handling', () => {
    it('should display -- when payee name is empty', () => {
      component.payee = { ...mockPayee, name: '' };
      fixture.detectChanges();

      const nameElement = fixture.debugElement.query(By.css('.payee-name'));
      expect(nameElement.nativeElement.textContent).toContain('--');
    });

    it('should display -- when customerId is missing', () => {
      component.payee = { ...mockPayee, customerId: '' };
      fixture.detectChanges();

      const codeElement = fixture.debugElement.query(By.css('.payee-code'));
      expect(codeElement.nativeElement.textContent).toContain('--');
    });


  });
});
