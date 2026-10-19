import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LabInterdictionOverrideFilterPanel } from './lab-interdiction-override-filter-panel';
import { LabInterdictionOverrideFilterValue, DropdownOption } from '../models/lab-interdiction-override.model';
import { LabInterdictionOverrideService } from '../services/lab-interdiction-override.service';

describe('LabInterdictionOverrideFilterPanel', () => {
  let component: LabInterdictionOverrideFilterPanel;
  let fixture: ComponentFixture<LabInterdictionOverrideFilterPanel>;
  let mockService: jasmine.SpyObj<LabInterdictionOverrideService>;

  const mockCueOptions: DropdownOption[] = [
    { key: 'Ambiguous', value: 'A' },
    { key: 'Block', value: 'B' },
    { key: 'Clear', value: 'C' }
  ];

  const mockTypeOptions: DropdownOption[] = [
    { key: 'NFT', value: 'N' },
    { key: 'Bio', value: 'B' },
    { key: 'Hold', value: 'H' }
  ];

  const mockFilterDropdownResponse = {
    data: [{
      cueOptions: mockCueOptions,
      typeOptions: mockTypeOptions
    }]
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('LabInterdictionOverrideService', ['getFilterDropdownOptions']);
    mockService.getFilterDropdownOptions.and.returnValue(of(mockFilterDropdownResponse));



      TestBed.configureTestingModule({
      imports: [
        LabInterdictionOverrideFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule
      ],
      providers: [
        provideHttpClient(),
        { provide: LabInterdictionOverrideService, useValue: mockService }
      ]
    });


    


      mockService.getFilterDropdownOptions.calls.reset();


      mockService.getFilterDropdownOptions.and.returnValue(of(mockFilterDropdownResponse));


    fixture = TestBed.createComponent(LabInterdictionOverrideFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should initialize form with null/empty values', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.value).toBeNull();
    });

    it('should load filter dropdown options on init', () => {
      fixture.detectChanges();

      expect(mockService.getFilterDropdownOptions).toHaveBeenCalled();
      expect(component.cueOptions()).toEqual(mockCueOptions);
      expect(component.typeOptions()).toEqual(mockTypeOptions);
    });

    it('should handle service error when loading filter options', () => {
      mockService.getFilterDropdownOptions.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.cueOptions()).toEqual([]);
      expect(component.typeOptions()).toEqual([]);
      expect(component.isLoadingFilters).toBe(false);
    });
  });

  describe('Donor Decision Code (Cue) Filtering', () => {
    it('should populate form with donor decision code filter', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A'
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('A');
    });



    it('should display all cue options from service', () => {
      fixture.detectChanges();
      expect(component.cueOptions().length).toBe(3);
      expect(component.cueOptions()[0].value).toBe('A');
      expect(component.cueOptions()[0].key).toBe('Ambiguous');
    });
  });

  describe('Type Filtering', () => {
    it('should populate form with type filter', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        interType: 'N'
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('interType')?.value).toBe('N');
    });



    it('should display all type options from service', () => {
      fixture.detectChanges();
      expect(component.typeOptions().length).toBe(3);
      expect(component.typeOptions()[0].value).toBe('N');
      expect(component.typeOptions()[0].key).toBe('NFT');
    });
  });

  describe('Date Filtering with Period', () => {




    it('should emit effective date formatted for API on apply', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      const testDate = new Date(2024, 0, 15);
      component.filterForm.patchValue({
        effectiveDate: testDate,
        effectivePeriod: 'After'
      });
      component.filterForm.markAsDirty();
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDate).toBe('2024-01-15');
      expect(emittedValue.effectiveDatePeriod).toBe('After');
    });

    it('should emit termination date formatted for API on apply', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      const testDate = new Date(2024, 11, 31);
      component.filterForm.patchValue({
        terminationDate: testDate,
        terminationPeriod: 'Before'
      });
      component.filterForm.markAsDirty();
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDate).toBe('2024-12-31');
      expect(emittedValue.terminationDatePeriod).toBe('Before');
    });
  });

  describe('Multiple Filters', () => {
    it('should populate form with multiple filters', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A',
        interType: 'B',
        effectiveDate: '2024-01-01T00:00:00.000Z',
        effectiveDatePeriod: 'After'
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('A');
      expect(component.filterForm.get('interType')?.value).toBe('B');
      const effectiveDateValue = component.filterForm.get('effectiveDate')?.value;
      expect(effectiveDateValue instanceof Date).toBe(true);
      expect(component.filterForm.get('effectivePeriod')?.value).toBe('After');
    });


  });

  describe('Clear Functionality', () => {
    it('should clear all filter values', () => {
      fixture.detectChanges();

      component.filterForm.patchValue({
        donorDecisionCode: 'A',
        interType: 'N',
        effectiveDate: new Date(2024, 0, 1),
        effectivePeriod: 'After',
        terminationDate: new Date(2024, 11, 31),
        terminationPeriod: 'Before'
      });

      component.onClear();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.value).toBeNull();
    });
  });
  describe('Current Filters Population', () => {


    it('should handle undefined current filters', () => {
      component.currentFilters = undefined as any;
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();
    });

    it('should populate partial filter values', () => {
      const filters: LabInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A'
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('A');
      expect(component.filterForm.get('interType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });

  describe('Validation Tests', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set period error when effective date is selected without period', fakeAsync(() => {
      component.filterForm.patchValue({
        effectiveDate: new Date(2025, 5, 15),
        effectivePeriod: ''
      });
      tick();
      fixture.detectChanges();

      const periodControl = component.filterForm.get('effectivePeriod');
      expect(periodControl?.hasError('required')).toBe(true);
    }));

    it('should set period error when termination date is selected without period', fakeAsync(() => {
      component.filterForm.patchValue({
        terminationDate: new Date(2025, 11, 31),
        terminationPeriod: ''
      });
      tick();
      fixture.detectChanges();

      const periodControl = component.filterForm.get('terminationPeriod');
      expect(periodControl?.hasError('required')).toBe(true);
    }));

    it('should not set period error when effective date is selected with period', fakeAsync(() => {
      component.filterForm.patchValue({
        effectiveDate: new Date(2025, 5, 15),
        effectivePeriod: 'After'
      });
      tick();

      const periodControl = component.filterForm.get('effectivePeriod');
      expect(periodControl?.invalid).toBe(false);
    }));

    it('should not set period error when termination date is selected with period', fakeAsync(() => {
      component.filterForm.patchValue({
        terminationDate: new Date(2025, 11, 31),
        terminationPeriod: 'Before'
      });
      tick();

      const periodControl = component.filterForm.get('terminationPeriod');
      expect(periodControl?.invalid).toBe(false);
    }));





    it('should mark fields as touched on invalid apply', fakeAsync(() => {
      component.filterForm.patchValue({
        effectiveDate: new Date(2025, 5, 15),
        effectivePeriod: ''
      });
      tick();

      component.onApply();

      expect(component.filterForm.get('effectivePeriod')?.touched).toBe(true);
    }));


  });



  describe('Cue Search Filtering', () => {


    it('should return all cue options when search is empty', () => {
      fixture.detectChanges();

      component.cueSearch.set('');

      expect(component.filteredCueOptions().length).toBe(3);
    });
  });

  describe('Type Search Filtering', () => {


    it('should return all type options when search is empty', () => {
      fixture.detectChanges();

      component.typeSearch.set('');

      expect(component.filteredTypeOptions().length).toBe(3);
    });
  });
});
