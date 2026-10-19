import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ValidFfFlagFilterPanel } from './valid-ff-flag-filter-panel';
import { ValidFfFlagService } from '../services/valid-ff-flag.service';
import { ValidFfFlagFilterValue, DropdownOption } from '../models/valid-ff-flag.model';
import { provideHttpClient } from '@angular/common/http';

describe('ValidFfFlagFilterPanel', () => {
  let component: ValidFfFlagFilterPanel;
  let fixture: ComponentFixture<ValidFfFlagFilterPanel>;
  let mockService: jasmine.SpyObj<ValidFfFlagService>;

  const mockCollectionFacilityOptions: DropdownOption[] = [
    { key: 'U.S. Naval Hospital', value: 'W0352' },
    { key: 'Army Medical Center', value: 'W0353' },
    { key: 'Air Force Base', value: 'W0354' },
    { key: 'VA Hospital', value: 'W0355' }
  ];

  const mockSourceTypeOptions: DropdownOption[] = [
    { key: 'Donor Source', value: 'DONOR' },
    { key: 'Product Source', value: 'PRODUCT' }
  ];

  const mockFfFlagValueOptions: DropdownOption[] = [
    { key: 'No Flag', value: '00' },
    { key: 'Flag Set', value: '01' },
    { key: 'Special', value: '02' },
    { key: 'Review', value: '03' }
  ];

  const mockFilterResponse = {
    success: true,
    message: 'Success',
    error: null,
    statusCode: 200,
    data: [{
      collectionFacilityId: mockCollectionFacilityOptions,
      sourceType: mockSourceTypeOptions,
      ffFlagValue: mockFfFlagValueOptions
    }],
    total: 1
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ValidFfFlagService', ['getValidFfFlagFilters']);
    mockService.getValidFfFlagFilters.and.returnValue(of(mockFilterResponse));



      TestBed.configureTestingModule({
      imports: [
        ValidFfFlagFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        { provide: ValidFfFlagService, useValue: mockService }
      ]
    });


    


      mockService.getValidFfFlagFilters.calls.reset();


      mockService.getValidFfFlagFilters.and.returnValue(of(mockFilterResponse));


    fixture = TestBed.createComponent(ValidFfFlagFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Component Initialization', () => {




    it('should have period options defined', () => {
      expect(component.periodOptions.length).toBe(2);
      expect(component.periodOptions[0].value).toBe('After');
      expect(component.periodOptions[1].value).toBe('Before');
    });
  });

  describe('Load Filter Options', () => {
    it('should load filter dropdown options on init', () => {
      expect(mockService.getValidFfFlagFilters).toHaveBeenCalled();
      expect(component.collectionFacilityIdOptions().length).toBe(4);
      expect(component.sourceTypeOptions().length).toBe(2);
      expect(component.ffFlagValueOptions().length).toBe(4);
    });

    it('should set DropdownOption objects with key and value', () => {
      const facilityOptions = component.collectionFacilityIdOptions();
      expect(facilityOptions[0].key).toBe('U.S. Naval Hospital');
      expect(facilityOptions[0].value).toBe('W0352');

      const sourceOptions = component.sourceTypeOptions();
      expect(sourceOptions[0].key).toBe('Donor Source');
      expect(sourceOptions[0].value).toBe('DONOR');

      const flagOptions = component.ffFlagValueOptions();
      expect(flagOptions[0].key).toBe('No Flag');
      expect(flagOptions[0].value).toBe('00');
    });



    it('should handle filter options loading error', () => {
      mockService.getValidFfFlagFilters.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.ngOnInit();

      expect(component.collectionFacilityIdOptions()).toEqual([]);
      expect(component.sourceTypeOptions()).toEqual([]);
      expect(component.ffFlagValueOptions()).toEqual([]);
      expect(component.isLoadingFilters).toBe(false);
    });

    it('should handle empty filter data response', () => {
      mockService.getValidFfFlagFilters.and.returnValue(of({
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: [{}],
        total: 0
      }));

      component.ngOnInit();

      expect(component.collectionFacilityIdOptions()).toEqual([]);
      expect(component.sourceTypeOptions()).toEqual([]);
      expect(component.ffFlagValueOptions()).toEqual([]);
    });
  });

  describe('Search Filtering', () => {














    it('should update search signal when search control changes', () => {
      component.collectionFacilitySearchControl.setValue('test');
      expect(component.collectionFacilitySearch()).toBe('test');

      component.sourceTypeSearchControl.setValue('source');
      expect(component.sourceTypeSearch()).toBe('source');

      component.ffFlagValueSearchControl.setValue('flag');
      expect(component.ffFlagValueSearch()).toBe('flag');
    });
  });

  describe('Effective Date Period Validation', () => {
    it('should set error on effectivePeriod when effectiveDate is selected without period', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: null
      });

      const periodControl = component.filterForm.get('effectivePeriod');
      expect(periodControl?.errors).toBeTruthy();
      expect(periodControl?.hasError('required')).toBe(true);
    });

    it('should clear error on effectivePeriod when period is selected', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: null
      });

      let periodControl = component.filterForm.get('effectivePeriod');
      expect(periodControl?.errors).toBeTruthy();

      component.filterForm.patchValue({ effectivePeriod: 'After' });

      periodControl = component.filterForm.get('effectivePeriod');
      expect(periodControl?.errors).toBeNull();
    });

    it('should clear error on effectivePeriod when effectiveDate is cleared', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: null
      });

      let periodControl = component.filterForm.get('effectivePeriod');
      expect(periodControl?.errors).toBeTruthy();

      component.filterForm.patchValue({ effectiveDate: null });

      periodControl = component.filterForm.get('effectivePeriod');
      expect(periodControl?.errors).toBeNull();
    });




  });

  describe('Termination Date Period Validation', () => {
    it('should set error on terminationPeriod when terminationDate is selected without period', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationPeriod: null
      });

      const periodControl = component.filterForm.get('terminationPeriod');
      expect(periodControl?.errors).toBeTruthy();
      expect(periodControl?.hasError('required')).toBe(true);
    });

    it('should clear error on terminationPeriod when period is selected', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationPeriod: null
      });

      let periodControl = component.filterForm.get('terminationPeriod');
      expect(periodControl?.errors).toBeTruthy();

      component.filterForm.patchValue({ terminationPeriod: 'Before' });

      periodControl = component.filterForm.get('terminationPeriod');
      expect(periodControl?.errors).toBeNull();
    });

    it('should clear error on terminationPeriod when terminationDate is cleared', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationPeriod: null
      });

      let periodControl = component.filterForm.get('terminationPeriod');
      expect(periodControl?.errors).toBeTruthy();

      component.filterForm.patchValue({ terminationDate: null });

      periodControl = component.filterForm.get('terminationPeriod');
      expect(periodControl?.errors).toBeNull();
    });


  });
  describe('Apply Filters', () => {


    it('should include display labels in emitted filter values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: '00'
      });

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as ValidFfFlagFilterValue;
      expect(emittedFilters.collectionFacilityIdDisplay).toBe('W0352 - U.S. Naval Hospital');
      expect(emittedFilters.sourceTypeDisplay).toBe('DONOR - Donor Source');
      expect(emittedFilters.ffFlagValueDisplay).toBe('No Flag');
    });

    it('should use key-only display for ff flag value', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ ffFlagValue: '01' });

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as ValidFfFlagFilterValue;
      expect(emittedFilters.ffFlagValueDisplay).toBe('Flag Set');
    });

    it('should null out period when date is not set', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        collectionFacilityId: 'W0352',
        effectivePeriod: 'After',
        effectiveDate: null
      });

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as ValidFfFlagFilterValue;
      expect(emittedFilters.effectivePeriod).toBeNull();
      expect(emittedFilters.effectiveDate).toBeNull();
    });




  });
  describe('Clear Form', () => {
    it('should clear all form values on onClear', () => {
      component.filterForm.patchValue({
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: '00',
        effectivePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationPeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      });

      component.onClear();

      expect(component.filterForm.value.collectionFacilityId).toBeNull();
      expect(component.filterForm.value.sourceType).toBeNull();
      expect(component.filterForm.value.ffFlagValue).toBeNull();
      expect(component.filterForm.value.effectivePeriod).toBeNull();
      expect(component.filterForm.value.effectiveDate).toBeNull();
      expect(component.filterForm.value.terminationPeriod).toBeNull();
      expect(component.filterForm.value.terminationDate).toBeNull();
    });

    it('should clear search controls on onClear', () => {
      component.collectionFacilitySearchControl.setValue('test');
      component.sourceTypeSearchControl.setValue('test');
      component.ffFlagValueSearchControl.setValue('test');

      component.onClear();

      expect(component.collectionFacilitySearch()).toBe('');
      expect(component.sourceTypeSearch()).toBe('');
      expect(component.ffFlagValueSearch()).toBe('');
    });

    it('should clear all validation errors when onClear is called', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectivePeriod: null,
        terminationDate: new Date('2024-12-31'),
        terminationPeriod: null
      });

      expect(component.filterForm.get('effectivePeriod')?.errors).toBeTruthy();
      expect(component.filterForm.get('terminationPeriod')?.errors).toBeTruthy();

      component.onClear();

      expect(component.filterForm.get('effectivePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.errors).toBeNull();
    });
  });
  describe('Display Label Helpers', () => {
    it('should return VALUE - KEY format for collection facility display', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ collectionFacilityId: 'W0353' });
      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as ValidFfFlagFilterValue;
      expect(emittedFilters.collectionFacilityIdDisplay).toBe('W0353 - Army Medical Center');
    });

    it('should return VALUE - KEY format for source type display', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ sourceType: 'PRODUCT' });
      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as ValidFfFlagFilterValue;
      expect(emittedFilters.sourceTypeDisplay).toBe('PRODUCT - Product Source');
    });



    it('should return value as fallback when option not found in list', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ collectionFacilityId: 'UNKNOWN' });
      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as ValidFfFlagFilterValue;
      expect(emittedFilters.collectionFacilityIdDisplay).toBe('UNKNOWN');
    });
  });
});
