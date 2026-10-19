import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import moment from 'moment';

import { HlaGradingFilterPanel } from './hla-grading-filter-panel';
import { HlaGradingFilterValue } from '../models/hla-grading.model';

describe('HlaGradingFilterPanel', () => {
  let component: HlaGradingFilterPanel;
  let fixture: ComponentFixture<HlaGradingFilterPanel>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        HlaGradingFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatMomentDateModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(HlaGradingFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {

    it('should populate form from currentFilters input', () => {
      component.currentFilters = {
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15',
        terminationPeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      component.ngOnInit();

      expect(component.filterForm.get('effectivePeriod')?.value).toBe('After');
      expect(component.filterForm.get('terminationPeriod')?.value).toBe('Before');
      expect(moment.isMoment(component.filterForm.get('effectiveDate')?.value)).toBeTrue();
      expect(moment.isMoment(component.filterForm.get('terminationDate')?.value)).toBeTrue();
    });

    it('should not populate form when currentFilters is null', () => {
      component.currentFilters = null;
      component.ngOnInit();

      expect(component.filterForm.get('effectivePeriod')?.value).toBe('');
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });

  describe('Period Validation', () => {
    it('should show error when effective date is set without period', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2024-01-15'));

      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });


    it('should show error when termination date is set without period', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2024-12-31'));

      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should clear error when termination period is selected', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2024-12-31'));
      component.filterForm.get('terminationPeriod')?.setValue('Before');

      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('onApply', () => {


    it('should emit undefined for empty optional fields', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: moment('2024-01-15')
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationPeriod).toBeUndefined();
      expect(emittedValue.terminationDate).toBeUndefined();
    });
  });

  describe('onClearAll', () => {

    it('should clear period validation errors', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2024-01-15'));
      expect(component.effectiveDatePeriodError).toBe('Period is required');

      component.onClearAll();

      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });
  describe('Date Input Handlers', () => {
    it('should mark effective date control as touched and dirty on input', () => {
      const mockEvent = { target: { value: '15-Jan-2024' } } as unknown as Event;

      component.onEffectiveDateInput(mockEvent);

      expect(component.filterForm.get('effectiveDate')?.touched).toBeTrue();
      expect(component.filterForm.get('effectiveDate')?.dirty).toBeTrue();
    });

    it('should mark termination date control as touched and dirty on input', () => {
      const mockEvent = { target: { value: '31-Dec-2024' } } as unknown as Event;

      component.onTerminationDateInput(mockEvent);

      expect(component.filterForm.get('terminationDate')?.touched).toBeTrue();
      expect(component.filterForm.get('terminationDate')?.dirty).toBeTrue();
    });
  });

  describe('Date Blur Handlers', () => {
    it('should parse and set valid effective date on blur', fakeAsync(() => {
      const input = { value: '15-Jan-2024' } as HTMLInputElement;
      component['effectiveDateRawInput'] = '15-Jan-2024';

      component.onEffectiveDateBlur(input);
      tick(1);

      const control = component.filterForm.get('effectiveDate');
      if (control?.value) {
        expect(moment.isMoment(control.value)).toBeTrue();
      }
    }));

    it('should set invalidDate error for unparseable effective date on blur', fakeAsync(() => {
      const input = { value: 'invalid-date' } as HTMLInputElement;
      component['effectiveDateRawInput'] = 'invalid-date';

      component.onEffectiveDateBlur(input);
      tick(1);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDate')).toBeTrue();
    }));

    it('should restore raw input if value was cleared on effective date blur', fakeAsync(() => {
      component['effectiveDateRawInput'] = '15-Jan-2024';
      const input = { value: '' } as HTMLInputElement;

      component.onEffectiveDateBlur(input);
      tick(1);

      expect(input.value).toBe('15-Jan-2024');
    }));

    it('should parse and set valid termination date on blur', fakeAsync(() => {
      const input = { value: '31-Dec-2024' } as HTMLInputElement;
      component['terminationDateRawInput'] = '31-Dec-2024';

      component.onTerminationDateBlur(input);
      tick(1);

      const control = component.filterForm.get('terminationDate');
      if (control?.value) {
        expect(moment.isMoment(control.value)).toBeTrue();
      }
    }));

    it('should set invalidDate error for unparseable termination date on blur', fakeAsync(() => {
      const input = { value: 'bad-date' } as HTMLInputElement;
      component['terminationDateRawInput'] = 'bad-date';

      component.onTerminationDateBlur(input);
      tick(1);

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDate')).toBeTrue();
    }));

    it('should clear invalidDate error when effective date has valid value', fakeAsync(() => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.setValue(moment('2024-01-15'));

      const input = { value: '' } as HTMLInputElement;
      component.onEffectiveDateBlur(input);
      tick(1);

      expect(control?.hasError('invalidDate')).toBeFalse();
    }));

    it('should clear invalidDate error when termination date has valid value', fakeAsync(() => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      control?.setValue(moment('2024-12-31'));

      const input = { value: '' } as HTMLInputElement;
      component.onTerminationDateBlur(input);
      tick(1);

      expect(control?.hasError('invalidDate')).toBeFalse();
    }));

    it('should not set error for empty input on effective date blur', fakeAsync(() => {
      const input = { value: '' } as HTMLInputElement;
      component['effectiveDateRawInput'] = '';

      component.onEffectiveDateBlur(input);
      tick(1);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDate')).toBeFalse();
    }));
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('isApplyDisabled', () => {
    it('should be true when no values set', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be true when effectiveDatePeriodError exists', () => {
      component.effectiveDatePeriodError = 'Period is required';
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be true when terminationDatePeriodError exists', () => {
      component.terminationDatePeriodError = 'Period is required';
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be true when effectiveDate has invalidDate error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be true when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: { text: 'x' } });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be true when terminationDate has invalidDate error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be true when terminationDate has invalidDateFormat error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: { text: 'x' } });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be false when valid date and period set', () => {
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: moment('2024-01-15')
      });
      component.effectiveDatePeriodError = '';
      component.terminationDatePeriodError = '';
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('onApply with both dates', () => {
    it('should emit with all date and period values', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: moment('2024-01-15'),
        terminationPeriod: 'Before',
        terminationDate: moment('2024-12-31')
      });
      component.onApply();
      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.effectivePeriod).toBe('After');
      expect(emitted.effectiveDate).toBe('2024-01-15');
      expect(emitted.terminationPeriod).toBe('Before');
      expect(emitted.terminationDate).toBe('2024-12-31');
    });
  });

  describe('onApply with period error', () => {
    it('should not emit when effective period error exists', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDate: moment('2024-01-15')
      });
      component.onApply();
      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should not emit when termination period error exists', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: moment('2024-01-15'),
        terminationDate: moment('2024-12-31')
      });
      component.onApply();
      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should emit undefined for empty period and date', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: moment('2024-01-15'),
        terminationPeriod: '',
        terminationDate: null
      });
      component.onApply();
      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.terminationPeriod).toBeUndefined();
      expect(emitted.terminationDate).toBeUndefined();
    });
  });

  describe('onClearAll comprehensive', () => {
    it('should reset all values, errors, and raw inputs', () => {
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: moment('2024-01-15'),
        terminationPeriod: 'Before',
        terminationDate: moment('2024-12-31')
      });
      component.effectiveDatePeriodError = 'Period is required';
      component.terminationDatePeriodError = 'Period is required';

      component.onClearAll();

      expect(component.filterForm.get('effectivePeriod')?.value).toBe('');
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.value).toBe('');
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
      expect(component.filterForm.get('effectivePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.errors).toBeNull();
    });

    it('should clear raw input state', () => {
      component['effectiveDateRawInput'] = '15-Jan-2024';
      component['terminationDateRawInput'] = '31-Dec-2024';
      component.onClearAll();
      expect(component['effectiveDateRawInput']).toBe('');
      expect(component['terminationDateRawInput']).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('populateFilters with dates without periods', () => {
    it('should set period errors when dates exist without periods', () => {
      component.currentFilters = {
        effectiveDate: '2024-01-15',
        terminationDate: '2024-12-31'
      } as HlaGradingFilterValue;
      component.ngOnInit();
      expect(component.effectiveDatePeriodError).toBe('Period is required');
      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should not set errors when filters have both date and period', () => {
      component.currentFilters = {
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15',
        terminationPeriod: 'Before',
        terminationDate: '2024-12-31'
      };
      component.ngOnInit();
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('onEffectiveDateInput empty', () => {
    it('should not set error when input is empty', () => {
      const event = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component.filterForm.get('effectiveDate')?.hasError('invalidDate')).toBeFalse();
    });

    it('should store raw input value', () => {
      const event = { target: { value: '15-Jan-2024' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component['effectiveDateRawInput']).toBe('15-Jan-2024');
    });
  });

  describe('onTerminationDateInput empty', () => {
    it('should not set error when input is empty', () => {
      const event = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component.filterForm.get('terminationDate')?.hasError('invalidDate')).toBeFalse();
    });

    it('should store raw input value', () => {
      const event = { target: { value: '31-Dec-2024' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component['terminationDateRawInput']).toBe('31-Dec-2024');
    });
  });

  describe('onTerminationDateBlur additional', () => {
    it('should restore raw input if value was cleared on blur', fakeAsync(() => {
      component['terminationDateRawInput'] = '31-Dec-2024';
      const input = { value: '' } as HTMLInputElement;
      component.onTerminationDateBlur(input);
      tick(1);
      expect(input.value).toBe('31-Dec-2024');
    }));

    it('should not set error for empty input on blur', fakeAsync(() => {
      const input = { value: '' } as HTMLInputElement;
      component['terminationDateRawInput'] = '';
      component.onTerminationDateBlur(input);
      tick(1);
      expect(component.filterForm.get('terminationDate')?.hasError('invalidDate')).toBeFalse();
    }));
  });

  describe('setupPeriodValidation', () => {
    it('should validate when effective period changes', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2024-01-15'));
      expect(component.effectiveDatePeriodError).toBe('Period is required');
      component.filterForm.get('effectivePeriod')?.setValue('After');
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should validate when termination period changes', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2024-12-31'));
      expect(component.terminationDatePeriodError).toBe('Period is required');
      component.filterForm.get('terminationPeriod')?.setValue('Before');
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should mark date control as touched on value change', () => {
      const control = component.filterForm.get('effectiveDate');
      expect(control?.touched).toBeFalse();
      control?.setValue(moment('2024-06-01'));
      expect(control?.touched).toBeTrue();
    });

    it('should mark termination date control as touched on value change', () => {
      const control = component.filterForm.get('terminationDate');
      expect(control?.touched).toBeFalse();
      control?.setValue(moment('2024-06-01'));
      expect(control?.touched).toBeTrue();
    });

    it('should clear period error when date is cleared', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2024-01-15'));
      expect(component.effectiveDatePeriodError).toBe('Period is required');
      component.filterForm.get('effectiveDate')?.setValue(null);
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should clear termination period error when date is cleared', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2024-12-31'));
      expect(component.terminationDatePeriodError).toBe('Period is required');
      component.filterForm.get('terminationDate')?.setValue(null);
      expect(component.terminationDatePeriodError).toBe('');
    });
  });
});
