import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { CityStateZipFilterPanel } from './city-state-zip-filter-panel';
import { CityStateZipFilterValue, StateDto } from '../models/city-state-zip-query.model';
import { CityStateZipQueryService } from '../services/city-state-zip-query.service';

describe('CityStateZipFilterPanel', () => {
  let component: CityStateZipFilterPanel;
  let fixture: ComponentFixture<CityStateZipFilterPanel>;
  let mockService: jasmine.SpyObj<CityStateZipQueryService>;

  const mockStates: StateDto[] = [
    { code: 'TX', description: 'Texas' },
    { code: 'CA', description: 'California' },
    { code: 'NY', description: 'New York' }
  ];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('CityStateZipQueryService', ['getStates']);
    mockService.getStates.and.returnValue(of(mockStates));

    await TestBed.configureTestingModule({
      imports: [
        CityStateZipFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CityStateZipQueryService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CityStateZipFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty string defaults', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('city')?.value).toBe('');
      expect(component.filterForm.get('zip')?.value).toBe('');
      expect(component.filterForm.get('county')?.value).toBe('');
      expect(component.filterForm.get('state')?.value).toBe('');
    });

    it('should populate form from currentFilters input', () => {
      const filters: CityStateZipFilterValue = {
        city: 'Dallas',
        zip: '75201',
        county: 'Dallas',
        state: 'TX'
      };
      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('city')?.value).toBe('Dallas');
      expect(component.filterForm.get('zip')?.value).toBe('75201');
      expect(component.filterForm.get('state')?.value).toBe('TX');
    });

    it('should load states from service', () => {
      fixture.detectChanges();

      expect(mockService.getStates).toHaveBeenCalled();
      expect(component.stateOptions).toEqual(mockStates);
      expect(component.filteredStateOptions).toEqual(mockStates);
    });

    it('should handle service error when loading states', () => {
      mockService.getStates.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.stateOptions).toEqual([]);
      expect(component.filteredStateOptions).toEqual([]);
      expect(component.isLoadingStates).toBeFalse();
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit trimmed filter values on apply', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        city: '  Dallas  ',
        zip: '75201',
        county: '',
        state: 'TX'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        city: 'Dallas',
        zip: '75201',
        county: null,
        state: 'TX'
      });
    });

    it('should emit null for empty string values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ city: '', zip: '', county: '', state: '' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        city: null,
        zip: null,
        county: null,
        state: null
      });
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to empty strings on clear', () => {
      component.filterForm.patchValue({
        city: 'Dallas',
        zip: '75201',
        county: 'Dallas',
        state: 'TX'
      });

      component.onClear();

      expect(component.filterForm.get('city')?.value).toBe('');
      expect(component.filterForm.get('zip')?.value).toBe('');
      expect(component.filterForm.get('county')?.value).toBe('');
      expect(component.filterForm.get('state')?.value).toBe('');
    });
  });

  describe('Close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be disabled when all fields are empty', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when city has a value', () => {
      component.filterForm.patchValue({ city: 'Dallas' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when zip has a value', () => {
      component.filterForm.patchValue({ zip: '75201' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when state is selected', () => {
      component.filterForm.patchValue({ state: 'TX' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when only whitespace is entered', () => {
      component.filterForm.patchValue({ city: '   ' });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('State Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter states by search term on code', () => {
      component.stateSearchControl.setValue('TX');

      expect(component.filteredStateOptions.length).toBe(1);
      expect(component.filteredStateOptions[0].code).toBe('TX');
    });

    it('should filter states by search term on description', () => {
      component.stateSearchControl.setValue('california');

      expect(component.filteredStateOptions.length).toBe(1);
      expect(component.filteredStateOptions[0].code).toBe('CA');
    });

    it('should show all states when search is empty', () => {
      component.stateSearchControl.setValue('');

      expect(component.filteredStateOptions.length).toBe(3);
    });
  });
});
