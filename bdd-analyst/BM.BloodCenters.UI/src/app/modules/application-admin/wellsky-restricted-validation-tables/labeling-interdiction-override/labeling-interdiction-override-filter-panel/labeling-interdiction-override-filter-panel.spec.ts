import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LabelingInterdictionOverrideFilterPanel } from './labeling-interdiction-override-filter-panel';
import { LabelingInterdictionOverrideService } from '../services/labeling-interdiction-override.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { LabelingInterdictionOverrideFilterValue } from '../models/labeling-interdiction-override.model';

describe('LabelingInterdictionOverrideFilterPanel', () => {
  let component: LabelingInterdictionOverrideFilterPanel;
  let fixture: ComponentFixture<LabelingInterdictionOverrideFilterPanel>;
  let mockService: jasmine.SpyObj<LabelingInterdictionOverrideService>;

  const mockFilterDropdownResponse = {
    cueOptions: [
      { value: 'DDC001', key: 'Decision 1' },
      { value: 'DDC002', key: 'Decision 2' },
      { value: 'DDC003', key: '' }
    ],
    typeOptions: [
      { value: 'N', key: 'NFT' },
      { value: 'B', key: 'Bio' },
      { value: 'H', key: 'Hold' },
      { value: 'I', key: 'Initial' }
    ]
  };

  const mockCurrentFilters: LabelingInterdictionOverrideFilterValue = {
    donorDecisionCode: 'DDC001',
    interType: 'N',
    effectiveDatePeriod: 'After',
    effectiveDate: moment('2025-01-01'),
    terminationDatePeriod: 'Before',
    terminationDate: moment('2025-12-31')
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('LabelingInterdictionOverrideService', [
      'getFilterDropdown'
    ]);
    mockService.getFilterDropdown.and.returnValue(of(mockFilterDropdownResponse));



      TestBed.configureTestingModule({
imports: [
        LabelingInterdictionOverrideFilterPanel],
      providers: [
        provideHttpClient(),
        { provide: LabelingInterdictionOverrideService, useValue: mockService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getFilterDropdown.calls.reset();


      mockService.getFilterDropdown.and.returnValue(of(mockFilterDropdownResponse));


    fixture = TestBed.createComponent(LabelingInterdictionOverrideFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should initialize periodOptions with After and Before', () => {
      expect(component.periodOptions).toEqual([
        { value: 'after', display: 'After' },
        { value: 'before', display: 'Before' }
      ]);
    });
  });

  describe('ngOnInit', () => {


    it('should initialize form with currentFilters values', () => {
      component.currentFilters = mockCurrentFilters;
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('DDC001');
      expect(component.filterForm.get('interType')?.value).toBe('N');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('effectiveDate')?.value).toBeTruthy();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
      expect(component.filterForm.get('terminationDate')?.value).toBeTruthy();
    });

  });

  describe('loadFilterOptions', () => {

    it('should populate cueOptions with code-description combinations', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.allCueOptions.length).toBe(3);
      expect(component.allCueOptions[0].value).toBe('DDC001');
      expect(component.allCueOptions[0].display).toBe('DDC001 - Decision 1');
      expect(component.allCueOptions[1].value).toBe('DDC002');
      expect(component.allCueOptions[1].display).toBe('DDC002 - Decision 2');
    }));


    it('should populate interTypeOptions with display mapping', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.allInterTypeOptions.length).toBe(4);
      expect(component.allInterTypeOptions[0]).toEqual({ value: 'N', display: 'N - NFT' });
      expect(component.allInterTypeOptions[1]).toEqual({ value: 'B', display: 'B - Bio' });
      expect(component.allInterTypeOptions[2]).toEqual({ value: 'H', display: 'H - Hold' });
      expect(component.allInterTypeOptions[3]).toEqual({ value: 'I', display: 'I - Initial' });
    }));



    it('should handle error and set empty arrays', fakeAsync(() => {
      mockService.getFilterDropdown.and.returnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();
      tick();

      expect(component.allCueOptions).toEqual([]);
      expect(component.allInterTypeOptions).toEqual([]);
      expect(component.isLoadingFilters).toBe(false);
    }));

  });

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });




    it('should handle empty string as null for donorDecisionCode', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        donorDecisionCode: '',
        interType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        donorDecisionCode: null
      }));
    });
  });

  describe('Filter Form Values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should get filter form value correctly', () => {
      component.filterForm.patchValue({
        donorDecisionCode: 'DDC001',
        interType: 'B',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-06-15'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      const formValue = component.filterForm.value;

      expect(formValue.donorDecisionCode).toBe('DDC001');
      expect(formValue.interType).toBe('B');
      expect(formValue.effectiveDatePeriod).toBe('After');
    });
  });

  describe('Validation Tests', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error when effective date is selected without period', fakeAsync(() => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-06-15'),
        effectiveDatePeriod: null
      });
      tick();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.touched).toBe(true);
      expect(periodControl?.invalid).toBe(true);
      expect(periodControl?.hasError('required')).toBe(true);
    }));

    it('should show error when termination date is selected without period', fakeAsync(() => {
      component.filterForm.patchValue({
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: null
      });
      tick();

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.touched).toBe(true);
      expect(periodControl?.invalid).toBe(true);
      expect(periodControl?.hasError('required')).toBe(true);
    }));



    it('should return correct error message for effective date period', fakeAsync(() => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-06-15'),
        effectiveDatePeriod: null
      });
      tick();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      periodControl?.markAsTouched();

      expect(periodControl?.hasError('required')).toBe(true);
    }));

    it('should return correct error message for termination date period', fakeAsync(() => {
      component.filterForm.patchValue({
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: null
      });
      tick();

      const periodControl = component.filterForm.get('terminationDatePeriod');
      periodControl?.markAsTouched();

      expect(periodControl?.hasError('required')).toBe(true);
    }));
  });

  describe('Integration Tests', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should allow selecting and applying filters', fakeAsync(() => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        donorDecisionCode: 'DDC001',
        interType: 'N'
      });
      tick();

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        donorDecisionCode: 'DDC001',
        interType: 'N'
      }));
    }));

    it('should allow clearing and reselecting filters', () => {
      component.filterForm.patchValue({
        donorDecisionCode: 'DDC001',
        interType: 'B'
      });

      component.onClearAll();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();

      component.filterForm.patchValue({
        donorDecisionCode: 'DDC002'
      });

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('DDC002');
    });
  });
});
