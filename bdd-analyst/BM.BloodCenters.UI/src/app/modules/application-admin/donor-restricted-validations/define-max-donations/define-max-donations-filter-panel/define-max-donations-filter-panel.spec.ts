import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DefineMaxDonationsFilterPanel } from './define-max-donations-filter-panel';
import { DefineMaxDonationsService } from '../services/define-max-donations.service';

describe('DefineMaxDonationsFilterPanel', () => {
  let serviceSpy: any;
  let component: DefineMaxDonationsFilterPanel;
  let fixture: ComponentFixture<DefineMaxDonationsFilterPanel>;
  let service: jasmine.SpyObj<DefineMaxDonationsService>;

  const mockDonationTypes = [
    { donationType: 'AL', donationTypeDescription: 'Allogeneic' },
    { donationType: 'AU', donationTypeDescription: 'Autologous' },
    { donationType: 'DI', donationTypeDescription: 'Directed' }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DefineMaxDonationsService', [
      'getDonationTypesFilter'
    ]);



      TestBed.configureTestingModule({
imports: [
        DefineMaxDonationsFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DefineMaxDonationsService, useValue: serviceSpy }
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.getDonationTypesFilter.calls.reset();


    service = TestBed.inject(DefineMaxDonationsService) as jasmine.SpyObj<DefineMaxDonationsService>;
    service.getDonationTypesFilter.and.returnValue(of(mockDonationTypes));

    fixture = TestBed.createComponent(DefineMaxDonationsFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('ngOnInit', () => {


    it('should initialize period type values as null by default', () => {
      expect(component.filterForm.get('periodType1')?.value).toBeNull();
      expect(component.filterForm.get('periodType2')?.value).toBeNull();
    });
  });
  describe('Current Filters', () => {
    it('should populate form with current filters', () => {
      const currentFilters = {
        donationType: 'AL',
        effectiveDate: new Date('2024-01-01'),
        periodType1: 'After',
        terminationDate: new Date('2024-12-31'),
        periodType2: 'Before'
      };

      component.currentFilters = currentFilters;
      component.ngOnInit();

      expect(component.filterForm.get('donationType')?.value).toBe('AL');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(new Date('2024-01-01'));
      expect(component.filterForm.get('periodType1')?.value).toBe('After');
      expect(component.filterForm.get('terminationDate')?.value).toEqual(new Date('2024-12-31'));
      expect(component.filterForm.get('periodType2')?.value).toBe('Before');
    });

  });

  describe('Period Type Defaults', () => {
    it('should initialize period type 1 as null', () => {
      expect(component.filterForm.get('periodType1')?.value).toBeNull();
    });

    it('should initialize period type 2 as null', () => {
      expect(component.filterForm.get('periodType2')?.value).toBeNull();
    });

    it('should allow changing period type 1', () => {
      component.filterForm.patchValue({ periodType1: 'Before' });

      expect(component.filterForm.get('periodType1')?.value).toBe('Before');
    });

    it('should allow changing period type 2', () => {
      component.filterForm.patchValue({ periodType2: 'After' });

      expect(component.filterForm.get('periodType2')?.value).toBe('After');
    });
  });

  describe('Date Filters', () => {
    it('should handle effective date filter', () => {
      const effectiveDate = new Date('2024-01-15');

      component.filterForm.patchValue({
        effectiveDate: effectiveDate,
        periodType1: 'After'
      });

      expect(component.filterForm.get('effectiveDate')?.value).toEqual(effectiveDate);
      expect(component.filterForm.get('periodType1')?.value).toBe('After');
    });

    it('should handle termination date filter', () => {
      const terminationDate = new Date('2024-12-31');

      component.filterForm.patchValue({
        terminationDate: terminationDate,
        periodType2: 'Before'
      });

      expect(component.filterForm.get('terminationDate')?.value).toEqual(terminationDate);
      expect(component.filterForm.get('periodType2')?.value).toBe('Before');
    });

    it('should handle both date filters simultaneously', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        periodType1: 'After',
        terminationDate: new Date('2024-12-31'),
        periodType2: 'Before'
      });

      expect(component.filterForm.get('effectiveDate')?.value).toBeDefined();
      expect(component.filterForm.get('terminationDate')?.value).toBeDefined();
    });
  });

  describe('Donation Type Dropdown', () => {
    it('should display donation types in dropdown', () => {
      expect(component.donationTypes.length).toBe(3);
      expect(component.donationTypes[0].donationType).toBe('AL');
      expect(component.donationTypes[1].donationType).toBe('AU');
      expect(component.donationTypes[2].donationType).toBe('DI');
    });

    it('should filter by selected donation type', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ donationType: 'AL' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'AL'
        })
      );
    });

    it('should handle empty donation type selection', () => {
      component.filterForm.patchValue({ donationType: null });

      expect(component.filterForm.get('donationType')?.value).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should allow form submission with no filters', () => {
      component.filterForm.reset({
        donationType: null,
        effectiveDate: null,
        periodType1: 'After',
        terminationDate: null,
        periodType2: 'Before'
      });

      expect(component.filterForm.valid).toBe(true);
    });

    it('should allow form submission with partial filters', () => {
      component.filterForm.patchValue({
        donationType: 'AL',
        effectiveDate: null,
        terminationDate: null
      });

      expect(component.filterForm.valid).toBe(true);
    });

    it('should allow form submission with all filters', () => {
      component.filterForm.patchValue({
        donationType: 'AL',
        effectiveDate: new Date('2024-01-01'),
        periodType1: 'After',
        terminationDate: new Date('2024-12-31'),
        periodType2: 'Before'
      });

      expect(component.filterForm.valid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading donation types', () => {
      service.getDonationTypesFilter.and.returnValue(
        of([]) // Return empty array on error
      );

      component.ngOnInit();

      expect(component.donationTypes.length).toBe(0);
    });
  });

  describe('Component Inputs', () => {
    it('should accept current filters input', () => {
      const filters = {
        donationType: 'AL',
        effectiveDate: new Date('2024-01-01'),
        periodType1: 'After',
        terminationDate: null,
        periodType2: 'Before'
      };

      component.currentFilters = filters;

      expect(component.currentFilters).toEqual(filters);
    });
  });
  describe('Filter Combinations', () => {
    it('should handle donation type only filter', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        donationType: 'AL',
        effectiveDate: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'AL',
          effectiveDate: null,
          terminationDate: null
        })
      );
    });

    it('should handle date filters only', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        donationType: null,
        effectiveDate: new Date('2024-01-01'),
        periodType1: 'After',
        terminationDate: new Date('2024-12-31'),
        periodType2: 'Before'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: null,
          effectiveDate: jasmine.any(Date),
          terminationDate: jasmine.any(Date)
        })
      );
    });

    it('should handle all filters combined', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        donationType: 'AL',
        effectiveDate: new Date('2024-01-01'),
        periodType1: 'After',
        terminationDate: new Date('2024-12-31'),
        periodType2: 'Before'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'AL',
          effectiveDate: jasmine.any(Date),
          periodType1: 'After',
          terminationDate: jasmine.any(Date),
          periodType2: 'Before'
        })
      );
    });
  });
});
