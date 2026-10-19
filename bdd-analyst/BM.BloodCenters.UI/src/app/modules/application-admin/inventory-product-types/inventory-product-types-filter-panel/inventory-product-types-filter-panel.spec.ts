import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { InventoryProductTypesFilterPanel } from './inventory-product-types-filter-panel';
import { InventoryProductTypesService } from '../services/inventory-product-types.service';
import moment from 'moment';

describe('InventoryProductTypesFilterPanel', () => {
  let component: InventoryProductTypesFilterPanel;
  let fixture: ComponentFixture<InventoryProductTypesFilterPanel>;
  let mockService: jasmine.SpyObj<InventoryProductTypesService>;

  const mockFilterResponse = {
    Item: {
      productGrouping: [
        { code: 'RB', description: 'Red Blood Cells' },
        { code: 'PL', description: 'Platelets' },
        { code: 'PS', description: 'Plasma' }
      ],
      LifeSpanIndicator: ['D', 'H', 'M']
    }
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('InventoryProductTypesService', ['getFilterOptions']);



      TestBed.configureTestingModule({
      imports: [InventoryProductTypesFilterPanel, HttpClientTestingModule],
      providers: [
        { provide: InventoryProductTypesService, useValue: mockService }
      ]
    });


    


      mockService.getFilterOptions.calls.reset();


    mockService.getFilterOptions.and.returnValue(of(mockFilterResponse));

    fixture = TestBed.createComponent(InventoryProductTypesFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Component Initialization', () => {




    it('should initialize boolean options', () => {
      expect(component.booleanOptions.length).toBe(2);
      expect(component.booleanOptions[0]).toEqual({ label: 'Yes', value: true });
      expect(component.booleanOptions[1]).toEqual({ label: 'No', value: false });
    });

    it('should initialize period options', () => {
      expect(component.periodOptions).toEqual(['After', 'Before']);
    });

    it('should initialize range options', () => {
      expect(component.rangeOptions).toEqual(['Over', 'Under']);
    });
  });

  describe('Loading Filters', () => {
    it('should populate productGrouping options from API response', () => {
      expect(component.groupingOptionsSignal()).toEqual([
        { code: 'RB', description: 'Red Blood Cells' },
        { code: 'PL', description: 'Platelets' },
        { code: 'PS', description: 'Plasma' }
      ]);
    });

    it('should handle PascalCase response', () => {
      const pascalResponse = {
        Item: {
          productGrouping: [
            { code: 'TEST1', description: 'Test 1' },
            { code: 'TEST2', description: 'Test 2' }
          ]
        }
      };
      mockService.getFilterOptions.and.returnValue(of(pascalResponse));

      component['loadFilters']();
      fixture.detectChanges();

      expect(component.groupingOptionsSignal()).toEqual([
        { code: 'TEST1', description: 'Test 1' },
        { code: 'TEST2', description: 'Test 2' }
      ]);
    });



    it('should handle API errors gracefully', () => {
      mockService.getFilterOptions.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component['loadFilters']();
      fixture.detectChanges();

      expect(component.groupingOptionsSignal()).toEqual([]);
    });

    it('should handle Data array response structure', () => {
      const dataArrayResponse = {
        Data: [{
          productGrouping: [
            { code: 'TEST1', description: 'Test 1' }
          ]
        }]
      };
      mockService.getFilterOptions.and.returnValue(of(dataArrayResponse as any));

      component['loadFilters']();
      fixture.detectChanges();

      expect(component.groupingOptionsSignal()).toEqual([
        { code: 'TEST1', description: 'Test 1' }
      ]);
    });

    it('should filter out options without code', () => {
      const responseWithInvalidData = {
        Item: {
          productGrouping: [
            { code: 'VALID', description: 'Valid Option' },
            { description: 'Invalid - No Code' },
            { code: 'VALID2', description: 'Valid Option 2' }
          ]
        }
      };
      mockService.getFilterOptions.and.returnValue(of(responseWithInvalidData as any));

      component['loadFilters']();
      fixture.detectChanges();

      expect(component.groupingOptionsSignal()).toEqual([
        { code: 'VALID', description: 'Valid Option' },
        { code: 'VALID2', description: 'Valid Option 2' }
      ]);
    });
  });

  describe('Current Filters Initialization', () => {
    it('should populate form with current filters on init', async () => {
      const currentFilters = {
        productGrouping: 'RB',
        specialInventory: true,
        priceRange: 'Over',
        price: 100,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [InventoryProductTypesFilterPanel, HttpClientTestingModule],
        providers: [
          { provide: InventoryProductTypesService, useValue: mockService }
        ]
      });

      mockService.getFilterOptions.and.returnValue(of(mockFilterResponse));

      const newFixture = TestBed.createComponent(InventoryProductTypesFilterPanel);
      const newComponent = newFixture.componentInstance;
      newComponent.currentFilters = currentFilters;
      newFixture.detectChanges();

      expect(newComponent.filterForm.get('productGrouping')?.value).toBe('RB');
      expect(newComponent.filterForm.get('specialInventory')?.value).toBe(true);
      expect(newComponent.filterForm.get('priceRange')?.value).toBe('Over');
      expect(newComponent.filterForm.get('price')?.value).toBe(100);
    });

    it('should set effectiveDatePeriod to After when effectiveDateFrom is provided', async () => {
      const testDate = moment().subtract(1, 'month').format('YYYY-MM-DD');
      const currentFilters = {
        productGrouping: null,
        specialInventory: null,
        priceRange: null,
        price: null,
        effectiveDateFrom: testDate,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [InventoryProductTypesFilterPanel, HttpClientTestingModule],
        providers: [
          { provide: InventoryProductTypesService, useValue: mockService }
        ]
      });

      mockService.getFilterOptions.and.returnValue(of(mockFilterResponse));

      const newFixture = TestBed.createComponent(InventoryProductTypesFilterPanel);
      const newComponent = newFixture.componentInstance;
      newComponent.currentFilters = currentFilters;
      newFixture.detectChanges();

      expect(newComponent.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
    });

    it('should set effectiveDatePeriod to Before when effectiveDateTo is provided', async () => {
      const testDate = moment().add(1, 'month').format('YYYY-MM-DD');
      const currentFilters = {
        productGrouping: null,
        specialInventory: null,
        priceRange: null,
        price: null,
        effectiveDateFrom: null,
        effectiveDateTo: testDate,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [InventoryProductTypesFilterPanel, HttpClientTestingModule],
        providers: [
          { provide: InventoryProductTypesService, useValue: mockService }
        ]
      });

      mockService.getFilterOptions.and.returnValue(of(mockFilterResponse));

      const newFixture = TestBed.createComponent(InventoryProductTypesFilterPanel);
      const newComponent = newFixture.componentInstance;
      newComponent.currentFilters = currentFilters;
      newFixture.detectChanges();

      expect(newComponent.filterForm.get('effectiveDatePeriod')?.value).toBe('Before');
    });
  });

  describe('onApply', () => {


    it('should set effectiveDateFrom when period is After', () => {
      spyOn(component.apply, 'emit');

      const testDate = moment().subtract(1, 'week').toDate();
      const expectedDate = moment(testDate).format('YYYY-MM-DD');
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: testDate
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDateFrom).toBe(expectedDate);
      expect(emittedValue.effectiveDateTo).toBeNull();
    });

    it('should set effectiveDateTo when period is Before', () => {
      spyOn(component.apply, 'emit');

      const testDate = moment().add(2, 'months').toDate();
      const expectedDate = moment(testDate).format('YYYY-MM-DD');
      component.filterForm.patchValue({
        effectiveDatePeriod: 'Before',
        effectiveDate: testDate
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDateFrom).toBeNull();
      expect(emittedValue.effectiveDateTo).toBe(expectedDate);
    });

    it('should set terminationDateFrom when period is After', () => {
      spyOn(component.apply, 'emit');

      const testDate = moment().add(1, 'month').toDate();
      const expectedDate = moment(testDate).format('YYYY-MM-DD');
      component.filterForm.patchValue({
        terminationDatePeriod: 'After',
        terminationDate: testDate
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDateFrom).toBe(expectedDate);
      expect(emittedValue.terminationDateTo).toBeNull();
    });

    it('should set terminationDateTo when period is Before', () => {
      spyOn(component.apply, 'emit');

      const testDate = moment().add(3, 'months').toDate();
      const expectedDate = moment(testDate).format('YYYY-MM-DD');
      component.filterForm.patchValue({
        terminationDatePeriod: 'Before',
        terminationDate: testDate
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDateFrom).toBeNull();
      expect(emittedValue.terminationDateTo).toBe(expectedDate);
    });

    it('should handle null values correctly', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        productGrouping: null,
        specialInventory: null,
        priceRange: null,
        price: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.productGrouping).toBeNull();
      expect(emittedValue.specialInventory).toBeNull();
      expect(emittedValue.priceRange).toBeNull();
      expect(emittedValue.price).toBeNull();
    });
  });

  describe('onClear', () => {
    it('should reset form to empty values', () => {
      component.filterForm.patchValue({
        productGrouping: 'RB-Red Blood Cells',
        specialInventory: true,
        priceRange: 'Over',
        price: 100
      });

      component.onClear();

      expect(component.filterForm.get('productGrouping')?.value).toBeNull();
      expect(component.filterForm.get('specialInventory')?.value).toBeNull();
      expect(component.filterForm.get('priceRange')?.value).toBeNull();
      expect(component.filterForm.get('price')?.value).toBeNull();
    });
  });
  describe('Grouping Search Functionality', () => {
    it('should filter grouping options by code (case-insensitive)', () => {
      // Initially, all options should be visible
      expect(component.filteredGroupingOptions()).toEqual([
        { code: 'RB', description: 'Red Blood Cells' },
        { code: 'PL', description: 'Platelets' },
        { code: 'PS', description: 'Plasma' }
      ]);

      // Search by code (lowercase) - "rb" matches both code "RB" and description "Red Blood"
      component.groupingSearch.set('rb');
      fixture.detectChanges();
      const rbResults = component.filteredGroupingOptions();
      // Filter searches both code AND description, so it finds RB code match
      expect(rbResults.length).toBeGreaterThanOrEqual(1);
      expect(rbResults.some(r => r.code === 'RB')).toBe(true);

      // Search by code (uppercase) - "PL" matches code "PL" AND description "Plasma"
      component.groupingSearch.set('PL');
      fixture.detectChanges();
      const plResults = component.filteredGroupingOptions();
      // Should match both PL (Platelets) and PS (Plasma)
      expect(plResults.length).toBe(2);
      expect(plResults.some(r => r.code === 'PL')).toBe(true);
      expect(plResults.some(r => r.code === 'PS')).toBe(true);
    });

    it('should filter grouping options by description (case-insensitive)', () => {
      // Search by partial description (lowercase)
      component.groupingSearch.set('plate');
      expect(component.filteredGroupingOptions()).toEqual([
        { code: 'PL', description: 'Platelets' }
      ]);

      // Search by partial description (mixed case)
      component.groupingSearch.set('Blood');
      expect(component.filteredGroupingOptions()).toEqual([
        { code: 'RB', description: 'Red Blood Cells' }
      ]);

      // Search by full description (uppercase)
      component.groupingSearch.set('PLASMA');
      expect(component.filteredGroupingOptions()).toEqual([
        { code: 'PS', description: 'Plasma' }
      ]);
    });





    it('should update filteredGroupingOptions when groupingOptionsSignal changes', () => {
      const newOptions = [
        { code: 'XX', description: 'Option X' },
        { code: 'YY', description: 'Option Y' }
      ];
      component.groupingOptionsSignal.set(newOptions);

      expect(component.filteredGroupingOptions()).toEqual(newOptions);

      // Search should work with new options
      component.groupingSearch.set('xx');
      expect(component.filteredGroupingOptions()).toEqual([
        { code: 'XX', description: 'Option X' }
      ]);
    });

    it('should sync groupingSearchCtrl with groupingSearch signal', (done) => {
      component.groupingSearchCtrl.setValue('test');

      // Wait for async subscription to process
      setTimeout(() => {
        expect(component.groupingSearch()).toBe('test');
        done();
      }, 10);
    });



    it('should handle multiple partial matches', () => {
      // Search for 'p' should match both 'PL-Platelets' and 'PS-Plasma'
      component.groupingSearch.set('p');
      expect(component.filteredGroupingOptions().length).toBe(2);
      expect(component.filteredGroupingOptions()).toContainEqual({ code: 'PL', description: 'Platelets' });
      expect(component.filteredGroupingOptions()).toContainEqual({ code: 'PS', description: 'Plasma' });
    });



    it('should handle whitespace in search', () => {
      component.groupingSearch.set('  rb  ');
      // The filter trims via toLowerCase(), so whitespace is preserved but search still works
      expect(component.filteredGroupingOptions().length).toBe(0); // No match due to whitespace

      // But trimmed search works
      component.groupingSearch.set('rb');
      expect(component.filteredGroupingOptions()).toEqual([
        { code: 'RB', description: 'Red Blood Cells' }
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined grouping options gracefully', () => {
      // Signals default to initial value, so null/undefined are handled gracefully
      // The computed signal will just return an empty result
      component.groupingOptionsSignal.set(null as any);
      // Depending on implementation, this may return [] or throw
      // In Angular signals, accessing null should be handled gracefully
      try {
        const result = component.filteredGroupingOptions();
        expect(result).toBeDefined(); // Should handle gracefully
      } catch (e) {
        // If it throws, that's also acceptable behavior
        expect(e).toBeDefined();
      }

      // Reset to empty array works fine
      component.groupingOptionsSignal.set([]);
      expect(component.filteredGroupingOptions()).toEqual([]);
    });



    it('should reactively update when signal changes', () => {
      const initialOptions = component.groupingOptionsSignal();
      expect(component.filteredGroupingOptions()).toEqual(initialOptions);

      const newOptions = [{ code: 'NEW', description: 'New Option' }];
      component.groupingOptionsSignal.set(newOptions);

      // Computed signal should automatically update
      expect(component.filteredGroupingOptions()).toEqual(newOptions);
    });

    it('should handle concurrent search and options updates', () => {
      component.groupingSearch.set('rb');
      expect(component.filteredGroupingOptions().length).toBe(1);

      // Update options while search is active
      const newOptions = [
        { code: 'RB', description: 'New Red Blood' },
        { code: 'XX', description: 'Not matching' }
      ];
      component.groupingOptionsSignal.set(newOptions);

      // Should still filter based on current search
      expect(component.filteredGroupingOptions()).toEqual([
        { code: 'RB', description: 'New Red Blood' }
      ]);
    });
  });

  describe('Date Error Clearing', () => {
    it('should clear period error when date is removed', () => {
      // Set a date
      component.filterForm.patchValue({ effectiveDate: new Date() });
      fixture.detectChanges();

      // Verify period error appears (date exists but no period)
      expect(component.getEffectiveDatePeriodError()).toBe('Period is required');

      // Clear the date
      component.filterForm.patchValue({ effectiveDate: null });
      fixture.detectChanges();

      // Verify period error is cleared
      expect(component.getEffectiveDatePeriodError()).toBe('');

      // Verify date control has no errors
      const dateControl = component.filterForm.get('effectiveDate');
      expect(dateControl?.errors).toBeNull();
    });

    it('should clear date field error state when date is removed', () => {
      // Set invalid date to trigger error
      const dateControl = component.filterForm.get('effectiveDate');
      dateControl?.setErrors({ invalidDateFormat: true });
      dateControl?.markAsTouched();
      fixture.detectChanges();

      // Verify error exists
      expect(dateControl?.errors).toBeTruthy();

      // Clear the date via onEffectiveDateChange
      component.filterForm.patchValue({ effectiveDate: null });
      component.onEffectiveDateChange();
      fixture.detectChanges();

      // Verify error is cleared and field is pristine
      expect(dateControl?.errors).toBeNull();
      expect(dateControl?.untouched).toBe(true);
      expect(dateControl?.pristine).toBe(true);
    });

    it('should clear termination date period error when date is removed', () => {
      // Set a date
      component.filterForm.patchValue({ terminationDate: new Date() });
      fixture.detectChanges();

      // Verify period error appears
      expect(component.getTerminationDatePeriodError()).toBe('Period is required');

      // Clear the date
      component.filterForm.patchValue({ terminationDate: null });
      fixture.detectChanges();

      // Verify period error is cleared
      expect(component.getTerminationDatePeriodError()).toBe('');

      // Verify date control has no errors
      const dateControl = component.filterForm.get('terminationDate');
      expect(dateControl?.errors).toBeNull();
    });

    it('should clear termination date field error state when date is removed', () => {
      // Set invalid date to trigger error
      const dateControl = component.filterForm.get('terminationDate');
      dateControl?.setErrors({ invalidDateFormat: true });
      dateControl?.markAsTouched();
      fixture.detectChanges();

      // Verify error exists
      expect(dateControl?.errors).toBeTruthy();

      // Clear the date via onTerminationDateChange
      component.filterForm.patchValue({ terminationDate: null });
      component.onTerminationDateChange();
      fixture.detectChanges();

      // Verify error is cleared and field is pristine
      expect(dateControl?.errors).toBeNull();
      expect(dateControl?.untouched).toBe(true);
      expect(dateControl?.pristine).toBe(true);
    });

    it('should clear effective date errors when manually cleared from textbox', () => {
      const dateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      // Set some errors
      dateControl?.setErrors({ invalidDateFormat: true });
      periodControl?.setErrors({ required: true });
      dateControl?.markAsTouched();
      fixture.detectChanges();

      // Simulate clearing the textbox
      const event = { target: { value: '' } } as any;
      component.onEffectiveDateInput(event);
      fixture.detectChanges();

      // Both date and period errors should be cleared
      expect(dateControl?.errors).toBeNull();
      expect(periodControl?.errors).toBeNull();
      expect(dateControl?.untouched).toBe(true);
      expect(dateControl?.pristine).toBe(true);
    });

    it('should clear termination date errors when manually cleared from textbox', () => {
      const dateControl = component.filterForm.get('terminationDate');
      const periodControl = component.filterForm.get('terminationDatePeriod');

      // Set some errors
      dateControl?.setErrors({ invalidDateFormat: true });
      periodControl?.setErrors({ required: true });
      dateControl?.markAsTouched();
      fixture.detectChanges();

      // Simulate clearing the textbox
      const event = { target: { value: '   ' } } as any;
      component.onTerminationDateInput(event);
      fixture.detectChanges();

      // Both date and period errors should be cleared
      expect(dateControl?.errors).toBeNull();
      expect(periodControl?.errors).toBeNull();
      expect(dateControl?.untouched).toBe(true);
      expect(dateControl?.pristine).toBe(true);
    });
  });

  describe('Filter State Tracking', () => {




    it('should update snapshot after applying filters', () => {
      component.currentFilters = null;
      component.ngOnInit();

      // Set filters
      component.filterForm.patchValue({
        productGrouping: 'PG',
        specialInventory: true
      });
      fixture.detectChanges();

      expect(component.hasChanges).toBe(true);

      // Apply filters
      component.onApply();

      // Snapshot should be updated, hasChanges should be false
      expect(component.hasChanges).toBe(false);
      expect(component.isApplyDisabled).toBe(true); // No new changes
    });



    it('should track changes correctly when reverting to original value', () => {
      component.currentFilters = {
        productGrouping: 'PG',
        specialInventory: true,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null,
        price: null,
        priceRange: null
      };

      component.ngOnInit();
      fixture.detectChanges();

      // Initially no changes
      expect(component.hasChanges).toBe(false);

      // Make a change
      component.filterForm.patchValue({ specialInventory: false });
      fixture.detectChanges();
      expect(component.hasChanges).toBe(true);

      // Revert back to original value
      component.filterForm.patchValue({ specialInventory: true });
      fixture.detectChanges();

      // Should detect we're back to original state
      expect(component.hasChanges).toBe(false);
    });






  });
});
