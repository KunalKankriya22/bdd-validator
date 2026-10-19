import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { AboValuesFilterPanel } from './abo-values-filter-panel';
import { AboValuesService } from '../services/abo-values.service';
import { AboValuesFilterValue } from '../models/abo-values.model';

describe('AboValuesFilterPanel', () => {
  let aboValuesServiceSpy: any;
  let component: AboValuesFilterPanel;
  let fixture: ComponentFixture<AboValuesFilterPanel>;
  let aboValuesService: jasmine.SpyObj<AboValuesService>;

  const mockFilterResponse = {
    success: true,
    data: [
      {
        intendedUse: [
          { key: 'Transfusion', value: 'T' },
          { key: 'Research', value: 'R' }
        ],
        unitScheme: [
          { key: 'Component', value: 'C' },
          { key: 'Whole Blood', value: 'W' }
        ],
        transfusionStatus: [
          { key: 'Eligible', value: 'E' },
          { key: 'Deferred', value: 'D' }
        ]
      }
    ]
  };

  beforeEach(() => {

    aboValuesServiceSpy = jasmine.createSpyObj('AboValuesService', ['getAboValuesFilters']);



      TestBed.configureTestingModule({
      imports: [
        AboValuesFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AboValuesService, useValue: aboValuesServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });


    


      aboValuesServiceSpy.getAboValuesFilters.calls.reset();


    aboValuesService = TestBed.inject(AboValuesService) as jasmine.SpyObj<AboValuesService>;
    aboValuesService.getAboValuesFilters.and.returnValue(of(mockFilterResponse));

    fixture = TestBed.createComponent(AboValuesFilterPanel);
    component = fixture.componentInstance;


    });


  describe('ngOnInit', () => {
    it('should initialize filter form with empty values', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeTruthy();
      expect(component.filterForm.get('intendedUse')?.value).toBeNull();
      expect(component.filterForm.get('unitScheme')?.value).toBeNull();
      expect(component.filterForm.get('transfusionStatus')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should initialize filter form with current filters', () => {
      const currentFilters: AboValuesFilterValue = {
        intendedUse: 'T',
        unitScheme: 'C',
        transfusionStatus: 'E',
        effectiveDatePeriod: 'After',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2024-12-31'
      };

      component.currentFilters = currentFilters;
      fixture.detectChanges();

      expect(component.filterForm.get('intendedUse')?.value).toBe('T');
      expect(component.filterForm.get('unitScheme')?.value).toBe('C');
      expect(component.filterForm.get('transfusionStatus')?.value).toBe('E');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
    });




  });



  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filters with null values when form is empty', (done) => {
      component.apply.subscribe((filters: AboValuesFilterValue) => {
        expect(filters.intendedUse).toBeNull();
        expect(filters.unitScheme).toBeNull();
        expect(filters.transfusionStatus).toBeNull();
        expect(filters.effectiveDatePeriod).toBeNull();
        expect(filters.effectiveDate).toBeNull();
        expect(filters.terminationDatePeriod).toBeNull();
        expect(filters.terminationDate).toBeNull();
        done();
      });

      component.onApply();
    });

    it('should emit filters with form values', (done) => {
      component.filterForm.patchValue({
        intendedUse: 'T',
        unitScheme: 'C',
        transfusionStatus: 'E'
      });

      component.apply.subscribe((filters: AboValuesFilterValue) => {
        expect(filters.intendedUse).toBe('T');
        expect(filters.unitScheme).toBe('C');
        expect(filters.transfusionStatus).toBe('E');
        done();
      });

      component.onApply();
    });

    it('should format effective date to ISO string', (done) => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2024-01-15')
      });

      component.apply.subscribe((filters: AboValuesFilterValue) => {
        expect(filters.effectiveDate).toContain('2024-01-15');
        expect(filters.effectiveDatePeriod).toBe('After');
        done();
      });

      component.onApply();
    });

    it('should format termination date to ISO string', (done) => {
      component.filterForm.patchValue({
        terminationDatePeriod: 'Before',
        terminationDate: moment('2024-12-31')
      });

      component.apply.subscribe((filters: AboValuesFilterValue) => {
        expect(filters.terminationDate).toContain('2024-12-31');
        expect(filters.terminationDatePeriod).toBe('Before');
        done();
      });

      component.onApply();
    });

    it('should emit all filters together', (done) => {
      component.filterForm.patchValue({
        intendedUse: 'T',
        unitScheme: 'C',
        transfusionStatus: 'E',
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2024-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: moment('2024-12-31')
      });

      component.apply.subscribe((filters: AboValuesFilterValue) => {
        expect(filters.intendedUse).toBe('T');
        expect(filters.unitScheme).toBe('C');
        expect(filters.transfusionStatus).toBe('E');
        expect(filters.effectiveDatePeriod).toBe('After');
        expect(filters.effectiveDate).toContain('2024-01-01');
        expect(filters.terminationDatePeriod).toBe('Before');
        expect(filters.terminationDate).toContain('2024-12-31');
        done();
      });

      component.onApply();
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset filter form', () => {
      component.filterForm.patchValue({
        intendedUse: 'T',
        unitScheme: 'C',
        transfusionStatus: 'E'
      });

      component.onClear();

      expect(component.filterForm.get('intendedUse')?.value).toBeNull();
      expect(component.filterForm.get('unitScheme')?.value).toBeNull();
      expect(component.filterForm.get('transfusionStatus')?.value).toBeNull();
    });
  });
  describe('Date Field Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require period when effective date is set', () => {
      component.filterForm.patchValue({
        effectiveDate: moment('2024-01-01'),
        effectiveDatePeriod: null
      });

      component['validateEffectivePeriod']();

      expect(component.effectivePeriodRequired).toBeTrue();
    });

    it('should require date when effective period is set', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectiveDatePeriod: 'After'
      });

      component['validateEffectivePeriod']();

      expect(component.effectiveDateRequired).toBeTrue();
    });

    it('should not require period when effective date is null', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectiveDatePeriod: null
      });

      component['validateEffectivePeriod']();

      expect(component.effectivePeriodRequired).toBeFalse();
    });

    it('should require period when termination date is set', () => {
      component.filterForm.patchValue({
        terminationDate: moment('2024-12-31'),
        terminationDatePeriod: null
      });

      component['validateTerminationPeriod']();

      expect(component.terminationPeriodRequired).toBeTrue();
    });

    it('should require date when termination period is set', () => {
      component.filterForm.patchValue({
        terminationDate: null,
        terminationDatePeriod: 'Before'
      });

      component['validateTerminationPeriod']();

      expect(component.terminationDateRequired).toBeTrue();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable apply when no fields are filled', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply when at least one field is filled', () => {
      component.filterForm.patchValue({
        intendedUse: 'T'
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should disable apply when effective period is required but missing', () => {
      component.filterForm.patchValue({
        effectiveDate: moment('2024-01-01')
      });
      component['validateEffectivePeriod']();

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should disable apply when termination period is required but missing', () => {
      component.filterForm.patchValue({
        terminationDate: moment('2024-12-31')
      });
      component['validateTerminationPeriod']();

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should disable apply when date has invalid format', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      effectiveDateControl?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply when both effective date and period are filled', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2024-01-01')
      });
      component['validateEffectivePeriod']();
      fixture.detectChanges();

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should enable apply when both termination date and period are filled', () => {
      component.filterForm.patchValue({
        terminationDatePeriod: 'Before',
        terminationDate: moment('2024-12-31')
      });
      component['validateTerminationPeriod']();
      fixture.detectChanges();

      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle effective date input', () => {
      const input = { value: 'invalid-date' } as HTMLInputElement;
      const event = { target: input } as any;

      component.onEffectiveDateInput(event);

      expect(component['effectiveDateRawInput']).toBe('invalid-date');
    });

    it('should handle termination date input', () => {
      const input = { value: 'invalid-date' } as HTMLInputElement;
      const event = { target: input } as any;

      component.onTerminationDateInput(event);

      expect(component['terminationDateRawInput']).toBe('invalid-date');
    });

    it('should set error for invalid effective date format', (done) => {
      const input = { value: 'invalid' } as HTMLInputElement;
      component.onEffectiveDateInput({ target: input } as any);

      setTimeout(() => {
        const control = component.filterForm.get('effectiveDate');
        expect(control?.hasError('invalidDateFormat')).toBeTrue();
        done();
      }, 10);
    });

    it('should set error for invalid termination date format', (done) => {
      const input = { value: 'invalid' } as HTMLInputElement;
      component.onTerminationDateInput({ target: input } as any);

      setTimeout(() => {
        const control = component.filterForm.get('terminationDate');
        expect(control?.hasError('invalidDateFormat')).toBeTrue();
        done();
      }, 10);
    });
  });
});
