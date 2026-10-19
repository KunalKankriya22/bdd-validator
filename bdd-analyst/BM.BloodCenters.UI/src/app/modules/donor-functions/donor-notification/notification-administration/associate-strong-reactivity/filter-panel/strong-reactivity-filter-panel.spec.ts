import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

import { StrongReactivityFilterPanel } from './strong-reactivity-filter-panel';
import { StrongReactivityFilterValue } from '../models/strong-reactivity.model';

describe('StrongReactivityFilterPanel', () => {
  let component: StrongReactivityFilterPanel;
  let fixture: ComponentFixture<StrongReactivityFilterPanel>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        StrongReactivityFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatInputModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(StrongReactivityFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should set hasActiveFilters to false initially', () => {
      expect(component.hasActiveFilters).toBe(false);
    });

    it('should set hasActiveFilters to true when filters exist', () => {
      component.filterForm.patchValue({ bound: 'S' });
      fixture.detectChanges();

      expect(component.hasActiveFilters).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should require period when effective date is set', fakeAsync(() => {
      // Manually trigger setupValidation since it's called in setTimeout in ngOnInit
      (component as any).setupValidation();
      tick();

      component.filterForm.patchValue({
        effectiveDate: new Date('2026-05-19'),
        effectivePeriod: null
      });

      const periodControl = component.filterForm.get('effectivePeriod');
      periodControl?.markAsTouched();
      periodControl?.updateValueAndValidity();

      expect(periodControl?.hasError('required')).toBe(true);
      expect(component.getEffDatePeriodError()).toBe('Period is required');
    }));

    it('should require period when termination date is set', fakeAsync(() => {
      // Manually trigger setupValidation since it's called in setTimeout in ngOnInit
      (component as any).setupValidation();
      tick();

      component.filterForm.patchValue({
        terminationDate: new Date('2026-05-20'),
        terminationPeriod: null
      });

      const periodControl = component.filterForm.get('terminationPeriod');
      periodControl?.markAsTouched();
      periodControl?.updateValueAndValidity();

      expect(periodControl?.hasError('required')).toBe(true);
      expect(component.getTermDatePeriodError()).toBe('Period is required');
    }));

    it('should not require period when date is not set', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectivePeriod: null
      });

      const periodControl = component.filterForm.get('effectivePeriod');
      periodControl?.updateValueAndValidity();

      expect(periodControl?.hasError('required')).toBeFalsy();
    });

    it('should validate date format', () => {
      const dateControl = component.filterForm.get('effectiveDate');
      const mockEvent = {
        target: { value: 'invalid-date' }
      } as any;

      component.onEffDateInput(mockEvent);

      expect(dateControl?.hasError('invalidDateFormat')).toBe(true);
    });

    it('should detect date errors', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });

      expect(component.hasDateErrors).toBe(true);
    });
  });

  describe('Apply Filters', () => {

    it('should not emit filters when form is invalid', fakeAsync(() => {
      // Manually trigger setupValidation since it's called in setTimeout in ngOnInit
      (component as any).setupValidation();
      tick();
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: new Date('2026-05-19'),
        effectivePeriod: null // Missing required period
      });

      component.filterForm.get('effectivePeriod')?.markAsTouched();
      component.filterForm.get('effectivePeriod')?.updateValueAndValidity();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));

    it('should clear period if date is not set', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effectivePeriod: null
        })
      );
    });

  });
  describe('Date Input Handling', () => {
    it('should preserve invalid date input', () => {
      const mockEvent = {
        target: { value: 'invalid-date' }
      } as any;

      component.onEffDateInput(mockEvent);

      expect((component as any).effDateRawInput).toBe('invalid-date');
    });

    it('should restore raw input on blur if no valid value', (done) => {
      const mockInput = document.createElement('input');
      mockInput.value = '';
      (component as any).effDateRawInput = '19-MAY-2026';

      component.onEffDateBlur(mockInput);

      setTimeout(() => {
        expect(mockInput.value).toBe('19-MAY-2026');
        done();
      }, 10);
    });

    it('should handle termination date input', () => {
      const mockEvent = {
        target: { value: '20-MAY-2026' }
      } as any;

      component.onTermDateInput(mockEvent);

      expect((component as any).termDateRawInput).toBe('20-MAY-2026');
    });
  });

  describe('Error Messages', () => {

    it('should return error message when control touched and invalid', fakeAsync(() => {
      // Manually trigger setupValidation since it's called in setTimeout in ngOnInit
      (component as any).setupValidation();
      tick();

      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectivePeriod: null
      });

      const periodControl = component.filterForm.get('effectivePeriod');
      periodControl?.markAsTouched();
      periodControl?.updateValueAndValidity();

      expect(component.getEffDatePeriodError()).toBe('Period is required');
    }));
  });

  describe('Bound Options', () => {
    it('should have Strong and Cross options', () => {
      expect(component.boundOptions.length).toBe(2);
      expect(component.boundOptions[0].label).toBe('Strong');
      expect(component.boundOptions[0].value).toBe('S');
      expect(component.boundOptions[1].label).toBe('Cross');
      expect(component.boundOptions[1].value).toBe('C');
    });
  });

  describe('Period Options', () => {
    it('should have After and Before options', () => {
      expect(component.periodOptions.length).toBe(2);
      expect(component.periodOptions[0].value).toBe('After');
      expect(component.periodOptions[1].value).toBe('Before');
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup on destroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
