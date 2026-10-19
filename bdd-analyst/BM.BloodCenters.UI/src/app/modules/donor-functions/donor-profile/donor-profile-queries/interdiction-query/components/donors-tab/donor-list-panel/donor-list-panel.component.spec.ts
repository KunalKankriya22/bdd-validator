import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DonorListPanelComponent } from './donor-list-panel.component';
import { DonorListItem } from '../../../models/interdiction-query.model';

describe('DonorListPanelComponent', () => {
  let component: DonorListPanelComponent;
  let fixture: ComponentFixture<DonorListPanelComponent>;

  const mockDonors: DonorListItem[] = [
    {
      donorId: 'DN001', lastName: 'Smith', firstName: 'John',
      dateOfBirth: '15-JAN-1990', gender: 'M',
      address: '123 Main St', internationalAddress: '',
      phoneHome: '555-0100', phoneBusiness: '555-0200', email: 'john@test.com',
      interdictions: [
        { interCode: '101A', origin: 'HQ', reason: 'R1', effectiveDate: '2025-01-01', terminationDate: '2025-12-01', mode: '', gpValue: '' }
      ]
    },
    {
      donorId: 'DN002', lastName: 'Doe', firstName: 'Jane',
      dateOfBirth: '20-JUN-1985', gender: 'F',
      address: '456 Oak Ave', internationalAddress: '',
      phoneHome: '555-0300', phoneBusiness: '', email: 'jane@test.com',
      interdictions: []
    },
    {
      donorId: 'DN003', lastName: 'Johnson', firstName: 'Alex',
      dateOfBirth: '10-MAR-1995', gender: 'M',
      address: '', internationalAddress: '',
      phoneHome: '', phoneBusiness: '', email: '',
      interdictions: []
    }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [DonorListPanelComponent, NoopAnimationsModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DonorListPanelComponent);
    component = fixture.componentInstance;


    });

  describe('Signal Inputs', () => {
    it('should default donors to empty array', () => {
      expect(component.donors()).toEqual([]);
    });

    it('should default selectedDonor to null', () => {
      expect(component.selectedDonor()).toBeNull();
    });
  });

  describe('Filtered Donors', () => {
    it('should return all donors when no search text', () => {
      fixture.componentRef.setInput('donors', mockDonors);
      fixture.detectChanges();
      expect(component.filteredDonors()).toEqual(mockDonors);
    });





    it('should return empty for no match', () => {
      fixture.componentRef.setInput('donors', mockDonors);
      fixture.detectChanges();
      component.onSearch('ZZZZZ');
      expect(component.filteredDonors().length).toBe(0);
    });

  });

  describe('Donor Selection', () => {

    it('should identify selected donor', () => {
      fixture.componentRef.setInput('selectedDonor', mockDonors[0]);
      fixture.detectChanges();
      expect(component.isSelected(mockDonors[0])).toBeTrue();
      expect(component.isSelected(mockDonors[1])).toBeFalse();
    });

    it('should handle null selectedDonor', () => {
      fixture.componentRef.setInput('selectedDonor', null);
      fixture.detectChanges();
      expect(component.isSelected(mockDonors[0])).toBeFalse();
    });
  });
  describe('Gender Helpers', () => {
    it('should return male class for M', () => {
      expect(component.getGenderClass('M')).toBe('gender-male');
    });

    it('should return female class for F', () => {
      expect(component.getGenderClass('F')).toBe('gender-female');
    });

    it('should return male icon path for M', () => {
      expect(component.getGenderIcon('M')).toContain('Male.svg');
    });

    it('should return female icon path for F', () => {
      expect(component.getGenderIcon('F')).toContain('Female.svg');
    });

  });
});
