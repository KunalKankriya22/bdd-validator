import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DonorTestsFilterPanel } from './donor-tests-filter-panel';
import { DonorTestsApiService } from '../services/donor-tests-api.service';
import { DonorTestResultFilterValue, FilterDropdownOptions } from '../models/donor-tests.model';

describe('DonorTestsFilterPanel', () => {
  let component: DonorTestsFilterPanel;
  let fixture: ComponentFixture<DonorTestsFilterPanel>;
  let mockService: jasmine.SpyObj<DonorTestsApiService>;

  const mockFilterOptions: FilterDropdownOptions = {
    interdictions: [
      { value: 'D01', display: 'D01' },
      { value: 'D02', display: 'D02' },
      { value: 'D03', display: 'D03' }
    ]
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonorTestsApiService', ['getFilterValues']);
    mockService.getFilterValues.and.returnValue(of(mockFilterOptions));



      TestBed.configureTestingModule({
imports: [DonorTestsFilterPanel],
      providers: [
        provideHttpClient(),
        { provide: DonorTestsApiService, useValue: mockService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getFilterValues.calls.reset();


      mockService.getFilterValues.and.returnValue(of(mockFilterOptions));


    fixture = TestBed.createComponent(DonorTestsFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {

    it('should load filter values on init', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(mockService.getFilterValues).toHaveBeenCalled();
      expect(component.interdictionOptions.length).toBe(3);
      expect(component.interdictionOptions[0]).toEqual({ value: 'D01', display: 'D01' });
    }));



  });

  describe('Restore Current Filters', () => {
    it('should patch form with current filters when provided', fakeAsync(() => {
      const currentFilters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.currentFilters = currentFilters;
      component.ngOnInit();
      tick();

      expect(component.filterForm.get('interdiction')?.value).toBe('D01');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(new Date('2024-06-15'));
    }));

    it('should not patch form when currentFilters is null', fakeAsync(() => {
      component.currentFilters = null;
      component.ngOnInit();
      tick();

      expect(component.filterForm.get('interdiction')?.value).toBeNull();
    }));
  });

  describe('onApply', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));


    it('should disable apply button when form is empty', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply button when at least one filter is selected', () => {
      component.filterForm.patchValue({
        interdiction: 'D01'
      });

      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('onClear', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('should reset all form fields to null', () => {
      component.filterForm.patchValue({
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-06-15'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      });

      component.onClear();

      expect(component.filterForm.get('interdiction')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });
  });
});
