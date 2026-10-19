import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import moment from 'moment';
import { HHQuestionsFilterPanel } from './hh-questions-filter-panel';
import { HHQuestionFilterValue } from '../../models/health-history.model';
import { HeaderService } from '@shared/services/header.service';

describe('HHQuestionsFilterPanel', () => {
  let component: HHQuestionsFilterPanel;
  let fixture: ComponentFixture<HHQuestionsFilterPanel>;

  beforeAll(async () => {

    const chapterChanged$ = new Subject<void>();



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [HHQuestionsFilterPanel, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: HeaderService,
          useValue: {
            chapterTimeZone: signal('-06:00'),
            chapterChanged$: chapterChanged$.asObservable()
          } as any
        }
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(HHQuestionsFilterPanel);
    component = fixture.componentInstance;


    });

  describe('form initialization', () => {
    it('should initialize with null values when no currentFilters', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('sex')?.value).toBeNull();
      expect(component.filterForm.get('validateLookBackDate')?.value).toBeNull();
      expect(component.filterForm.get('periodTypeForLookBack')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should populate form from currentFilters', () => {
      component.currentFilters = {
        sex: 'M',
        validateLookBackDate: 'Yes',
        periodTypeForLookBack: 'Days',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01'
      };
      fixture.detectChanges();

      expect(component.filterForm.get('sex')?.value).toBe('M');
      expect(component.filterForm.get('validateLookBackDate')?.value).toBe('Yes');
      expect(component.filterForm.get('periodTypeForLookBack')?.value).toBe('Days');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('effectiveDate')?.value).toBeTruthy();
    });
  });

  describe('period validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set effDatePeriodRequired when date set without period', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2025-01-01'));
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);

      expect(component.effDatePeriodRequired).toBe(true);
    });

    it('should clear effDatePeriodRequired when period is set', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2025-01-01'));
      component.filterForm.get('effectiveDatePeriod')?.setValue('After');

      expect(component.effDatePeriodRequired).toBe(false);
    });

    it('should set termDatePeriodRequired when date set without period', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2025-12-31'));
      component.filterForm.get('terminationDatePeriod')?.setValue(null);

      expect(component.termDatePeriodRequired).toBe(true);
    });

    it('should clear termDatePeriodRequired when period is set', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2025-12-31'));
      component.filterForm.get('terminationDatePeriod')?.setValue('Before');

      expect(component.termDatePeriodRequired).toBe(false);
    });
  });


  describe('date error messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should return error message when date is invalid and touched', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      expect(component.getEffDateError()).toBe('Effective Date is invalid');
    });

  });

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should not include empty fields in emitted filters', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.get('sex')?.setValue('M');

      component.onApply();

      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as HHQuestionFilterValue;
      expect(emitted.sex).toBe('M');
      expect(emitted.validateLookBackDate).toBeUndefined();
      expect(emitted.effectiveDate).toBeUndefined();
    });
  });

  describe('onClear', () => {
    it('should reset form fields and emit clearAll', () => {
      fixture.detectChanges();
      spyOn(component.clearAll, 'emit');

      component.filterForm.get('sex')?.setValue('M');
      component.effDatePeriodRequired = true;
      component.termDatePeriodRequired = true;

      component.onClear();

      expect(component.filterForm.get('sex')?.value).toBeNull();
      expect(component.effDatePeriodRequired).toBe(false);
      expect(component.termDatePeriodRequired).toBe(false);
      expect(component.clearAll.emit).toHaveBeenCalled();
    });
  });
  describe('onEffDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear errors when input is empty', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      component.onEffDateInput({ target: { value: '' } } as unknown as Event);

      expect(control?.errors).toBeNull();
      expect(control?.untouched).toBe(true);
    });

    it('should set invalidDate error when input has text but no valid value', () => {
      component.onEffDateInput({ target: { value: 'abc' } } as unknown as Event);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.touched).toBe(true);
    });
  });

});
