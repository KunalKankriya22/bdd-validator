import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { DonorDetailPanelComponent } from './donor-detail-panel.component';
import { DonorListItem } from '../../../models/interdiction-query.model';

describe('DonorDetailPanelComponent', () => {
  let component: DonorDetailPanelComponent;
  let fixture: ComponentFixture<DonorDetailPanelComponent>;

  const mockDonor: DonorListItem = {
    donorId: 'DN001',
    lastName: 'Smith',
    firstName: 'John',
    dateOfBirth: '15-JAN-1990',
    gender: 'M',
    address: '123 Main St, Denver, CO, 80205',
    internationalAddress: '',
    phoneHome: '303-555-0100',
    phoneBusiness: '303-555-0200',
    email: 'john.smith@test.com',
    interdictions: [
      {
        interCode: '101A',
        origin: 'HQ001',
        reason: 'R001',
        effectiveDate: '2025-01-01T00:00:00',
        terminationDate: '2025-12-01T00:00:00',
        mode: 'A',
        gpValue: 'G1'
      },
      {
        interCode: '201B',
        origin: '',
        reason: '',
        effectiveDate: '2025-03-01T00:00:00',
        terminationDate: '',
        mode: '',
        gpValue: ''
      }
    ]
  };

  beforeEach(() => {



      TestBed.configureTestingModule({
imports: [DonorDetailPanelComponent, NoopAnimationsModule, TranslateModule.forRoot()]
    });


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DonorDetailPanelComponent);
    component = fixture.componentInstance;


    });

  describe('Signal Input', () => {
    it('should default donor to null', () => {
      expect(component.donor()).toBeNull();
    });

    it('should accept donor input via signal', () => {
      fixture.componentRef.setInput('donor', mockDonor);
      fixture.detectChanges();
      expect(component.donor()?.donorId).toBe('DN001');
    });
  });

  describe('Filtered Interdictions', () => {
    it('should return empty array when no donor', () => {
      expect(component.filteredInterdictions()).toEqual([]);
    });

    it('should return all interdictions when no search', () => {
      fixture.componentRef.setInput('donor', mockDonor);
      fixture.detectChanges();
      expect(component.filteredInterdictions().length).toBe(2);
    });


    it('should be case-insensitive when filtering', () => {
      fixture.componentRef.setInput('donor', mockDonor);
      fixture.detectChanges();
      component.onCodeSearch('101a');
      expect(component.filteredInterdictions().length).toBe(1);
    });

    it('should return empty for no match', () => {
      fixture.componentRef.setInput('donor', mockDonor);
      fixture.detectChanges();
      component.onCodeSearch('ZZZZZ');
      expect(component.filteredInterdictions().length).toBe(0);
    });

  });
  describe('Date Formatting', () => {
    it('should format valid ISO date', () => {
      const result = component.formatDate('2025-12-01T00:00:00');
      expect(result).toMatch(/01-DEC-2025/i);
    });

    it('should return empty for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });

  });

  describe('Code Search', () => {
    it('should update codeSearchText signal', () => {
      component.onCodeSearch('101A');
      expect(component.codeSearchText()).toBe('101A');
    });

  });
});
