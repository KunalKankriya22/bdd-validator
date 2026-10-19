import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CustomerContactCardComponent } from './customer-contact-card.component';
import { CustomerContactDto } from '../models/customer-contact.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('CustomerContactCardComponent', () => {
  let component: CustomerContactCardComponent;
  let fixture: ComponentFixture<CustomerContactCardComponent>;

  const activeContact: CustomerContactDto = {
    customerId: 'CUST001',
    instId: '0001',
    contactType: 'D',
    contactTypeDesc: 'Director',
    firstName: 'John',
    lastName: 'Smith',
    salutation: 'Mr.',
    title: 'Dr.',
    dayPhoneNo: '555-1234',
    nightPhoneNo: '555-5678',
    faxNo: '555-9999',
    effDate: '2024-01-01T00:00:00',
    termDate: null
  };

  const terminatedContact: CustomerContactDto = {
    ...activeContact,
    instId: '0002',
    termDate: '2020-01-01T00:00:00'
  };

  const futureTermContact: CustomerContactDto = {
    ...activeContact,
    instId: '0003',
    termDate: '2099-12-31T00:00:00'
  };

  beforeEach(async () => {
    const headerServiceSpy = createMockHeaderService({
      chapterTimeZone: signal('America/Chicago')
    });

    await TestBed.configureTestingModule({
      imports: [CustomerContactCardComponent, NoopAnimationsModule],
      providers: [
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerContactCardComponent);
    component = fixture.componentInstance;
    component.contact = activeContact;
    component.customerName = 'Okinawa Japan Hospital';
    fixture.detectChanges();
  });

  describe('Status', () => {
    it('should be active when termDate is null', () => {
      expect(component.isActive).toBeTrue();
      expect(component.statusLabel).toBe('Active');
      expect(component.statusClass).toBe('status-active');
    });

    it('should be inactive when termDate is in the past', () => {
      component.contact = terminatedContact;
      expect(component.isActive).toBeFalse();
      expect(component.statusLabel).toBe('Inactive');
      expect(component.statusClass).toBe('status-inactive');
    });

    it('should be active when termDate is in the future', () => {
      component.contact = futureTermContact;
      expect(component.isActive).toBeTrue();
      expect(component.statusLabel).toBe('Active');
      expect(component.statusClass).toBe('status-active');
    });

    it('should show status badge with correct class', () => {
      const badge = fixture.debugElement.query(By.css('.status-badge'));
      expect(badge.classes['status-active']).toBeTrue();
    });

    it('should show inactive badge class for terminated contact', () => {
      component.contact = terminatedContact;
      fixture.detectChanges();
      const badge = fixture.debugElement.query(By.css('.status-badge'));
      expect(badge.classes['status-inactive']).toBeTrue();
    });
  });

  describe('Field Display', () => {
    it('should display customer name', () => {
      const name = fixture.debugElement.query(By.css('.customer-name'));
      expect(name.nativeElement.textContent).toContain('Okinawa Japan Hospital');
    });

    it('should display -- when customerName is empty', () => {
      component.customerName = '';
      fixture.detectChanges();
      const name = fixture.debugElement.query(By.css('.customer-name'));
      expect(name.nativeElement.textContent).toContain('--');
    });

    it('should display contactTypeDesc', () => {
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      expect(values[0].nativeElement.textContent.trim()).toBe('Director');
    });

    it('should display contactType when contactTypeDesc is missing', () => {
      component.contact = { ...activeContact, contactTypeDesc: undefined };
      fixture.detectChanges();
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      expect(values[0].nativeElement.textContent.trim()).toBe('D');
    });

    it('should display firstName', () => {
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      expect(values[1].nativeElement.textContent.trim()).toBe('John');
    });

    it('should display lastName', () => {
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      expect(values[2].nativeElement.textContent.trim()).toBe('Smith');
    });

    it('should display salutation', () => {
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      expect(values[3].nativeElement.textContent.trim()).toBe('Mr.');
    });

    it('should display title', () => {
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      expect(values[4].nativeElement.textContent.trim()).toBe('Dr.');
    });

    it('should display dayPhoneNo', () => {
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      expect(values[5].nativeElement.textContent.trim()).toBe('555-1234');
    });

    it('should display nightPhoneNo', () => {
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      expect(values[6].nativeElement.textContent.trim()).toBe('555-5678');
    });

    it('should display faxNo', () => {
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      expect(values[7].nativeElement.textContent.trim()).toBe('555-9999');
    });

    it('should display - for missing optional fields', () => {
      component.contact = {
        ...activeContact,
        salutation: undefined,
        title: undefined,
        nightPhoneNo: undefined,
        faxNo: undefined
      };
      fixture.detectChanges();
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      expect(values[3].nativeElement.textContent.trim()).toBe('-');
      expect(values[4].nativeElement.textContent.trim()).toBe('-');
      expect(values[6].nativeElement.textContent.trim()).toBe('-');
      expect(values[7].nativeElement.textContent.trim()).toBe('-');
    });

    it('should display - for null termDate', () => {
      const values = fixture.debugElement.queryAll(By.css('.field-value'));
      const termValue = values[values.length - 1].nativeElement.textContent.trim();
      expect(termValue).toBe('--');
    });
  });

  describe('Date Formatting', () => {
    it('should format a valid ISO date as DD-MMM-YYYY', () => {
      const formatted = component.formatDate('2024-01-15T00:00:00');
      expect(formatted).toBe('15-JAN-2024');
    });

    it('should return -- for null date', () => {
      expect(component.formatDate(null)).toBe('--');
    });

    it('should return -- for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('--');
    });

    it('should return -- for empty string', () => {
      expect(component.formatDate('')).toBe('--');
    });

    it('should return the original value for an invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should format different months correctly', () => {
      expect(component.formatDate('2024-06-20T00:00:00')).toBe('20-JUN-2024');
      expect(component.formatDate('2024-12-25T00:00:00')).toBe('25-DEC-2024');
    });
  });

  describe('Edit Action', () => {
    it('should emit edit event with contact data', () => {
      spyOn(component.edit, 'emit');
      component.onEdit();
      expect(component.edit.emit).toHaveBeenCalledWith(activeContact);
    });

    it('should emit on EDIT link click', () => {
      spyOn(component.edit, 'emit');
      const editLink = fixture.debugElement.query(By.css('.edit-link'));
      editLink.nativeElement.click();
      expect(component.edit.emit).toHaveBeenCalledWith(activeContact);
    });

    it('should emit on Enter keydown', () => {
      spyOn(component.edit, 'emit');
      const editLink = fixture.debugElement.query(By.css('.edit-link'));
      editLink.triggerEventHandler('keydown.enter', {});
      expect(component.edit.emit).toHaveBeenCalledWith(activeContact);
    });

    it('should emit on Space keydown and prevent default', () => {
      spyOn(component.edit, 'emit');
      const editLink = fixture.debugElement.query(By.css('.edit-link'));
      const event = { preventDefault: jasmine.createSpy('preventDefault') };
      editLink.triggerEventHandler('keydown.space', event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.edit.emit).toHaveBeenCalledWith(activeContact);
    });

    it('should have proper aria-label on edit link', () => {
      const editLink = fixture.debugElement.query(By.css('.edit-link'));
      expect(editLink.nativeElement.getAttribute('aria-label')).toContain('Edit contact John Smith');
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique componentId', () => {
      expect((component as any).componentId).toMatch(/^customer-contact-card-\d+$/);
    });

    it('should generate element IDs using componentId prefix', () => {
      const id = (component as any).elementId('title');
      expect(id).toMatch(/^customer-contact-card-\d+-title$/);
    });

    it('should generate unique IDs across instances', () => {
      const f2 = TestBed.createComponent(CustomerContactCardComponent);
      f2.componentInstance.contact = activeContact;
      f2.componentInstance.customerName = 'Test';
      expect((component as any).componentId).not.toBe((f2.componentInstance as any).componentId);
    });
  });
});
