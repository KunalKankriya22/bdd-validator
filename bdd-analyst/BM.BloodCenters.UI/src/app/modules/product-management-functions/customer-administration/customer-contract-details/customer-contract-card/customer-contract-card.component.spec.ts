import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CustomerContractCardComponent } from './customer-contract-card.component';
import { CustomerContractDto } from '../models/customer-contract.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('CustomerContractCardComponent', () => {
  let component: CustomerContractCardComponent;
  let fixture: ComponentFixture<CustomerContractCardComponent>;

  const mockContract: CustomerContractDto = {
    contractId: 'DI0121-001',
    customerId: 'WAD-DI0121',
    rotationFlag: 'Y',
    poNumber: 'PO-12345',
    creditLimit: 5000.00,
    startTerm: '01-Jan-2026',
    endTerm: '31-Dec-2026',
    effDate: '01-Jan-2026',
    termDate: null,
    lastModifiedDate: '06-Jun-2026'
  };

  beforeEach(() => {
    const headerServiceSpy = createMockHeaderService();
    TestBed.configureTestingModule({
      imports: [CustomerContractCardComponent, NoopAnimationsModule],
      providers: [
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerContractCardComponent);
    component = fixture.componentInstance;
    component.contract = mockContract;
    component.customerName = 'BAYLOR SPECIAL HEMATOLOGY';
    component.customerCity = 'DALLAS';
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should display contract ID', () => {
      const codeElement = fixture.debugElement.query(By.css('.contract-code'));
      expect(codeElement.nativeElement.textContent).toContain('DI0121-001');
    });

    it('should display customer name', () => {
      const nameElement = fixture.debugElement.query(By.css('.customer-name'));
      expect(nameElement.nativeElement.textContent).toContain('BAYLOR SPECIAL HEMATOLOGY');
    });

    it('should display customer city', () => {
      const locationText = fixture.debugElement.query(By.css('.location-text'));
      expect(locationText).toBeTruthy();
      expect(locationText.nativeElement.textContent).toContain('DALLAS');
    });

    it('should display active status badge', () => {
      const statusBadge = fixture.debugElement.query(By.css('.status-active'));
      expect(statusBadge).toBeTruthy();
      expect(statusBadge.nativeElement.textContent.trim()).toBe('Active');
    });

    it('should display -- when customerName is empty', () => {
      component.customerName = '';
      fixture.detectChanges();
      const nameElement = fixture.debugElement.query(By.css('.customer-name'));
      expect(nameElement.nativeElement.textContent.trim()).toBe('--');
    });

    it('should not show city when customerCity is empty', () => {
      component.customerCity = '';
      fixture.detectChanges();
      const locationText = fixture.debugElement.query(By.css('.location-text'));
      expect(locationText).toBeFalsy();
    });
  });

  describe('Contract Fields', () => {
    it('should display rotation as Yes', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Rotation');
      expect(compiled.textContent).toContain('Yes');
    });

    it('should display PO Number', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('PO Number');
      expect(compiled.textContent).toContain('PO-12345');
    });

    it('should display Credit Limit formatted', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Credit Limit');
      expect(compiled.textContent).toContain('5000.00');
    });

    it('should display -- for null termination date', () => {
      const fieldValues = fixture.debugElement.queryAll(By.css('.field-value'));
      const terminationDateValue = fieldValues[fieldValues.length - 1];
      expect(terminationDateValue.nativeElement.textContent.trim()).toBe('--');
    });

    it('should display -- for null PO Number', () => {
      component.contract = { ...mockContract, poNumber: undefined };
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('--');
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
      component.contract = { ...mockContract, termDate: futureDate.toISOString() };
      expect(component.isActive).toBeTrue();
    });

    it('should be inactive when termDate is in the past', () => {
      component.contract = { ...mockContract, termDate: '2020-01-01' };
      expect(component.isActive).toBeFalse();
      expect(component.statusClass).toBe('status-inactive');
      expect(component.statusLabel).toBe('Inactive');
    });

    it('should have aria-label on status badge', () => {
      fixture.detectChanges();
      const badge = fixture.debugElement.query(By.css('.status-badge'));
      expect(badge.attributes['aria-label']).toContain('Status:');
    });
  });

  describe('Rotation Display', () => {
    it('should display Yes for rotationFlag Y', () => {
      expect(component.rotationDisplay).toBe('Yes');
    });

    it('should display No for rotationFlag N', () => {
      component.contract = { ...mockContract, rotationFlag: 'N' };
      expect(component.rotationDisplay).toBe('No');
    });

    it('should display -- for null rotationFlag', () => {
      component.contract = { ...mockContract, rotationFlag: undefined };
      expect(component.rotationDisplay).toBe('--');
    });

    it('should display -- for empty rotationFlag', () => {
      component.contract = { ...mockContract, rotationFlag: '' };
      expect(component.rotationDisplay).toBe('--');
    });
  });

  describe('Date Formatting', () => {
    it('should format valid dates correctly', () => {
      const formatted = component.formatDate('2025-01-30');
      expect(formatted).toBe('30-JAN-2025');
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

    it('should return raw string for invalid date', () => {
      const result = component.formatDate('not-a-date');
      expect(result).toBe('not-a-date');
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency with 2 decimal places', () => {
      expect(component.formatCurrency(50)).toBe('50.00');
    });

    it('should format zero correctly', () => {
      expect(component.formatCurrency(0)).toBe('0.00');
    });

    it('should format large numbers correctly', () => {
      expect(component.formatCurrency(9999999.99)).toBe('9999999.99');
    });

    it('should return -- for null currency', () => {
      expect(component.formatCurrency(null)).toBe('--');
    });

    it('should return -- for undefined currency', () => {
      expect(component.formatCurrency(undefined)).toBe('--');
    });
  });

  describe('Edit Functionality', () => {
    it('should emit edit event with contract on onEdit()', () => {
      const editSpy = spyOn(component.edit, 'emit');
      component.onEdit();
      expect(editSpy).toHaveBeenCalledWith(mockContract);
    });

    it('should have proper aria-label on edit link', () => {
      const editLink = fixture.debugElement.query(By.css('.edit-link'));
      const ariaLabel = editLink.nativeElement.getAttribute('aria-label');
      expect(ariaLabel).toContain('Edit contract');
      expect(ariaLabel).toContain('DI0121-001');
    });

    it('should trigger edit on Enter keypress', () => {
      const editSpy = spyOn(component.edit, 'emit');
      const editLink = fixture.debugElement.query(By.css('.edit-link'));
      editLink.triggerEventHandler('keydown.enter', {});
      expect(editSpy).toHaveBeenCalledWith(mockContract);
    });

    it('should trigger edit on click', () => {
      const editSpy = spyOn(component.edit, 'emit');
      const editLink = fixture.debugElement.query(By.css('.edit-link'));
      editLink.nativeElement.click();
      expect(editSpy).toHaveBeenCalledWith(mockContract);
    });

    it('should have tabindex 0 for keyboard accessibility', () => {
      const editLink = fixture.debugElement.query(By.css('.edit-link'));
      expect(editLink.nativeElement.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('Missing Data Handling', () => {
    it('should display -- when contractId is missing', () => {
      component.contract = { ...mockContract, contractId: '' };
      fixture.detectChanges();

      const codeElement = fixture.debugElement.query(By.css('.contract-code'));
      expect(codeElement.nativeElement.textContent).toContain('--');
    });
  });

  describe('isActive edge cases', () => {
    it('should handle when chapterTimeZone is falsy', () => {
      const headerSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
      headerSpy.chapterTimeZone = undefined as any;

      component.contract = { ...mockContract, termDate: '2020-01-01' };
      expect(component.isActive).toBeFalse();
    });
  });

  describe('elementId', () => {
    it('should generate unique element IDs', () => {
      const id = component['elementId']('title');
      expect(id).toContain('customer-contract-card');
      expect(id).toContain('title');
    });
  });
});
