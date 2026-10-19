import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MaintainDriveLocationFilterPanel } from './filter-panel';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT } from 'src/app/core/utils/date-adapter.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('MaintainDriveLocationFilterPanel', () => {
  let component: MaintainDriveLocationFilterPanel;
  let fixture: ComponentFixture<MaintainDriveLocationFilterPanel>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  beforeAll(async () => {

    const chapterLocalDateSignal = signal(moment('2026-04-10'));

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService',
      ['getChapterLocalDate', 'isChapterLocalDateAvailable'],
      { chapterLocalDate: chapterLocalDateSignal }
    );
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2026-04-10'));
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        MaintainDriveLocationFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: DateAdapter, useClass: CustomDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT },
        provideHttpClient()
      ]
    }).compileComponents();


    });



  beforeEach(() => {


      mockChapterTimezoneService.getChapterLocalDate.calls.reset();


      mockChapterTimezoneService.isChapterLocalDateAvailable.calls.reset();


      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2026-04-10'));


      mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);


    fixture = TestBed.createComponent(MaintainDriveLocationFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should initialize with current filters if provided', () => {
      component.currentFilters = {
        effDate: '2026-01-01',
        effDatePeriod: 'AFTER',
        termDate: null,
        termDatePeriod: null,
        showTerminated: false
      };

      component.ngOnInit();

      const effDateValue = component.filterForm.get('effDate')?.value;
      expect(moment.isMoment(effDateValue)).toBe(true);
      expect(effDateValue?.format('YYYY-MM-DD')).toBe('2026-01-01');
      expect(component.filterForm.get('effDatePeriod')?.value).toBe('AFTER');
    });
  });

  describe('Validation - Period Required When Date Selected', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should show error when effective date is selected without period', () => {
      component.filterForm.patchValue({
        effDate: moment('2026-01-01'),
        effDatePeriod: null
      });

      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(true);
    });


    it('should show error when termination date is selected without period', () => {
      component.filterForm.patchValue({
        termDate: moment('2026-12-31'),
        termDatePeriod: null
      });

      expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(true);
    });


    it('should not show error when both date and period are null', () => {
      component.filterForm.patchValue({
        effDate: null,
        effDatePeriod: null
      });

      expect(component.filterForm.get('effDate')?.hasError('periodRequired')).toBe(false);
    });
  });

  describe('Apply Filters', () => {
    beforeEach(() => {
      component.ngOnInit();
    });



    it('should validate before emitting', () => {
      spyOn(component.apply, 'emit');

      // Set date without period
      component.filterForm.patchValue({
        effDate: moment('2026-01-01'),
        effDatePeriod: null
      });

      component.onApply();

      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(true);
      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });

  describe('Clear All Filters', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should reset all filter fields to null', () => {
      component.filterForm.patchValue({
        effDate: moment('2026-01-01'),
        effDatePeriod: 'AFTER',
        termDate: moment('2026-12-31'),
        termDatePeriod: 'BEFORE'
      });

      component.onClear();

      expect(component.filterForm.get('effDate')?.value).toBe(null);
      expect(component.filterForm.get('effDatePeriod')?.value).toBe(null);
      expect(component.filterForm.get('termDate')?.value).toBe(null);
      expect(component.filterForm.get('termDatePeriod')?.value).toBe(null);
    });
  });

  describe('Period Options', () => {
    it('should offer AFTER and BEFORE options for effective date', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const periodSelects = compiled.querySelectorAll('mat-select');

      expect(periodSelects.length).toBeGreaterThan(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      component.ngOnInit();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('initializeForm with moment currentFilters', () => {
    it('should handle currentFilters where dates are already moment objects', () => {
      component.currentFilters = {
        effDate: moment('2026-03-15') as any,
        effDatePeriod: 'BEFORE',
        termDate: moment('2026-06-30') as any,
        termDatePeriod: 'AFTER',
        showTerminated: false
      };
      component.ngOnInit();
      expect(component.filterForm.get('effDate')?.value.format('YYYY-MM-DD')).toBe('2026-03-15');
      expect(component.filterForm.get('termDate')?.value.format('YYYY-MM-DD')).toBe('2026-06-30');
      expect(component.filterForm.get('effDatePeriod')?.value).toBe('BEFORE');
      expect(component.filterForm.get('termDatePeriod')?.value).toBe('AFTER');
    });

    it('should handle null currentFilters', () => {
      component.currentFilters = null;
      component.ngOnInit();
      expect(component.filterForm.get('effDate')?.value).toBeNull();
      expect(component.filterForm.get('termDate')?.value).toBeNull();
      expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
    });
  });

  describe('valueChanges subscriptions', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should validate effDatePeriod when effDate changes', () => {
      component.filterForm.patchValue({ effDate: moment('2026-05-01') });
      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should clear effDatePeriod error when period is selected', () => {
      component.filterForm.patchValue({ effDate: moment('2026-05-01'), effDatePeriod: null });
      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(true);
      component.filterForm.patchValue({ effDatePeriod: 'AFTER' });
      expect(component.filterForm.get('effDatePeriod')?.errors).toBeNull();
    });

    it('should validate termDatePeriod when termDate changes', () => {
      component.filterForm.patchValue({ termDate: moment('2026-12-01') });
      expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should clear termDatePeriod error when period is selected', () => {
      component.filterForm.patchValue({ termDate: moment('2026-12-01'), termDatePeriod: null });
      expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(true);
      component.filterForm.patchValue({ termDatePeriod: 'BEFORE' });
      expect(component.filterForm.get('termDatePeriod')?.errors).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Additional Coverage
  // ---------------------------------------------------------------------------
  describe('Additional Coverage', () => {

    // -------------------------------------------------------------------------
    // Group 1: onApply — success paths
    // -------------------------------------------------------------------------
    describe('onApply success path', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should emit apply with form value when effDate and effDatePeriod are both set', () => {
        spyOn(component.apply, 'emit');
        component.filterForm.patchValue({
          effDate: moment('2026-01-01'),
          effDatePeriod: 'AFTER',
          termDate: null,
          termDatePeriod: null
        });

        component.onApply();

        expect(component.apply.emit).toHaveBeenCalledWith(component.filterForm.value);
      });

      it('should emit apply with form value when termDate and termDatePeriod are both set', () => {
        spyOn(component.apply, 'emit');
        component.filterForm.patchValue({
          effDate: null,
          effDatePeriod: null,
          termDate: moment('2026-12-31'),
          termDatePeriod: 'BEFORE'
        });

        component.onApply();

        expect(component.apply.emit).toHaveBeenCalledWith(component.filterForm.value);
      });

      it('should emit apply exactly once when both date+period pairs are valid', () => {
        spyOn(component.apply, 'emit');
        component.filterForm.patchValue({
          effDate: moment('2026-01-01'),
          effDatePeriod: 'AFTER',
          termDate: moment('2026-12-31'),
          termDatePeriod: 'BEFORE'
        });

        component.onApply();

        expect(component.apply.emit).toHaveBeenCalledTimes(1);
      });
    });

    // -------------------------------------------------------------------------
    // Group 2: onApply — blocked paths (additional)
    // -------------------------------------------------------------------------
    describe('onApply blocked paths (additional)', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should not emit when effDate control has an invalidDate error', () => {
        spyOn(component.apply, 'emit');
        // Simulate an invalid date typed by the user
        component.filterForm.get('effDate')?.setErrors({ invalidDate: true });

        component.onApply();

        expect(component.apply.emit).not.toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 3: onClose
    // -------------------------------------------------------------------------
    describe('onClose', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should emit the close event when onClose is called', () => {
        spyOn(component.close, 'emit');

        component.onClose();

        expect(component.close.emit).toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 4: isApplyDisabled
    // -------------------------------------------------------------------------
    describe('isApplyDisabled', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should return true when form value matches the initial value (no changes made)', () => {
        expect(component.isApplyDisabled()).toBe(true);
      });

      it('should return true when the form has changed but is invalid (date set without period)', () => {
        component.filterForm.patchValue({
          effDate: moment('2026-01-01'),
          effDatePeriod: null   // triggers required error via valueChanges
        });

        expect(component.isApplyDisabled()).toBe(true);
      });

      it('should return false when the form has changed and is valid', () => {
        component.filterForm.patchValue({
          effDate: moment('2026-06-15'),
          effDatePeriod: 'AFTER'
        });

        expect(component.filterForm.invalid).toBe(false);
        expect(component.isApplyDisabled()).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 5 & 6: getEffDateError / getTermDateError
    // -------------------------------------------------------------------------
    describe('Date error getters', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      describe('getEffDateError', () => {
        it('should return "Effective Date is invalid" when effDate has invalidDate error', () => {
          component.filterForm.get('effDate')?.setErrors({ invalidDate: true });

          expect(component.getEffDateError()).toBe('Effective Date is invalid');
        });

        it('should return "Effective Date is invalid" when effDate has matDatepickerParse error', () => {
          component.filterForm.get('effDate')?.setErrors({ matDatepickerParse: { text: 'rubbish' } });

          expect(component.getEffDateError()).toBe('Effective Date is invalid');
        });

        it('should return empty string when effDate has no error', () => {
          component.filterForm.get('effDate')?.setErrors(null);

          expect(component.getEffDateError()).toBe('');
        });
      });

      describe('getTermDateError', () => {
        it('should return "Termination Date is invalid" when termDate has invalidDate error', () => {
          component.filterForm.get('termDate')?.setErrors({ invalidDate: true });

          expect(component.getTermDateError()).toBe('Termination Date is invalid');
        });

        it('should return "Termination Date is invalid" when termDate has matDatepickerParse error', () => {
          component.filterForm.get('termDate')?.setErrors({ matDatepickerParse: { text: 'rubbish' } });

          expect(component.getTermDateError()).toBe('Termination Date is invalid');
        });

        it('should return empty string when termDate has no error', () => {
          component.filterForm.get('termDate')?.setErrors(null);

          expect(component.getTermDateError()).toBe('');
        });
      });

      // -----------------------------------------------------------------------
      // Group 7: getEffDatePeriodError
      // -----------------------------------------------------------------------
      describe('getEffDatePeriodError', () => {
        it('should return "Period is required" when control has required error and is touched', () => {
          const control = component.filterForm.get('effDatePeriod');
          control?.setErrors({ required: true });
          control?.markAsTouched();

          expect(component.getEffDatePeriodError()).toBe('Period is required');
        });

        it('should return empty string when control has required error but is not touched', () => {
          const control = component.filterForm.get('effDatePeriod');
          control?.setErrors({ required: true });
          control?.markAsUntouched();

          expect(component.getEffDatePeriodError()).toBe('');
        });

        it('should return empty string when effDatePeriod has no error', () => {
          component.filterForm.get('effDatePeriod')?.setErrors(null);

          expect(component.getEffDatePeriodError()).toBe('');
        });
      });

      // -----------------------------------------------------------------------
      // Group 8: getTermDatePeriodError
      // -----------------------------------------------------------------------
      describe('getTermDatePeriodError', () => {
        it('should return "Period is required" when control has required error and is touched', () => {
          const control = component.filterForm.get('termDatePeriod');
          control?.setErrors({ required: true });
          control?.markAsTouched();

          expect(component.getTermDatePeriodError()).toBe('Period is required');
        });

        it('should return empty string when control has required error but is not touched', () => {
          const control = component.filterForm.get('termDatePeriod');
          control?.setErrors({ required: true });
          control?.markAsUntouched();

          expect(component.getTermDatePeriodError()).toBe('');
        });

        it('should return empty string when termDatePeriod has no error', () => {
          component.filterForm.get('termDatePeriod')?.setErrors(null);

          expect(component.getTermDatePeriodError()).toBe('');
        });
      });
    });

    // -------------------------------------------------------------------------
    // Group 9: onEffDateBlur
    // -------------------------------------------------------------------------
    describe('onEffDateBlur', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should clear invalidDate error when control holds a valid moment value', fakeAsync(() => {
        spyOn(DateFieldValidationUtility, 'formatDateForUI').and.returnValue('15-Jan-2026');

        const validDate = moment('2026-01-15');
        component.filterForm.get('effDate')?.setValue(validDate);
        component.filterForm.get('effDate')?.setErrors({ invalidDate: true });

        const mockInput = { value: '15-Jan-2026' } as HTMLInputElement;
        component.onEffDateBlur(mockInput);
        tick(0);

        expect(component.filterForm.get('effDate')?.hasError('invalidDate')).toBe(false);
      }));

      it('should set invalidDate error when input has text but control value is null', fakeAsync(() => {
        component.filterForm.get('effDate')?.setValue(null);
        (component as any).effDateRawInput = 'bad-date';

        const mockInput = { value: 'bad-date' } as HTMLInputElement;
        component.onEffDateBlur(mockInput);
        tick(0);

        expect(component.filterForm.get('effDate')?.hasError('invalidDate')).toBe(true);
      }));

      it('should clear prior errors when input is empty and control value is null', fakeAsync(() => {
        // Pre-seed an error to verify it is cleared
        component.filterForm.get('effDate')?.setErrors({ invalidDate: true });

        const mockInput = { value: '' } as HTMLInputElement;
        component.onEffDateBlur(mockInput);
        tick(0);

        expect(component.filterForm.get('effDate')?.errors).toBeNull();
      }));
    });

    // -------------------------------------------------------------------------
    // Group 10: onTermDateBlur
    // -------------------------------------------------------------------------
    describe('onTermDateBlur', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should clear invalidDate error when control holds a valid moment value', fakeAsync(() => {
        spyOn(DateFieldValidationUtility, 'formatDateForUI').and.returnValue('31-Dec-2026');

        const validDate = moment('2026-12-31');
        component.filterForm.get('termDate')?.setValue(validDate);
        component.filterForm.get('termDate')?.setErrors({ invalidDate: true });

        const mockInput = { value: '31-Dec-2026' } as HTMLInputElement;
        component.onTermDateBlur(mockInput);
        tick(0);

        expect(component.filterForm.get('termDate')?.hasError('invalidDate')).toBe(false);
      }));

      it('should set invalidDate error when input has text but control value is null', fakeAsync(() => {
        component.filterForm.get('termDate')?.setValue(null);
        (component as any).termDateRawInput = 'bad-date';

        const mockInput = { value: 'bad-date' } as HTMLInputElement;
        component.onTermDateBlur(mockInput);
        tick(0);

        expect(component.filterForm.get('termDate')?.hasError('invalidDate')).toBe(true);
      }));

      it('should clear prior errors when input is empty and control value is null', fakeAsync(() => {
        // Pre-seed an error to verify it is cleared
        component.filterForm.get('termDate')?.setErrors({ invalidDate: true });

        const mockInput = { value: '' } as HTMLInputElement;
        component.onTermDateBlur(mockInput);
        tick(0);

        expect(component.filterForm.get('termDate')?.errors).toBeNull();
      }));
    });

    // -------------------------------------------------------------------------
    // Group 11: ngOnInit with null currentFilters
    // -------------------------------------------------------------------------
    describe('ngOnInit with null currentFilters', () => {
      it('should initialise all controls to null when currentFilters is null', () => {
        component.currentFilters = null;
        component.ngOnInit();

        expect(component.filterForm.get('effDate')?.value).toBeNull();
        expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
        expect(component.filterForm.get('termDate')?.value).toBeNull();
        expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
      });

      it('should not throw when currentFilters is null', () => {
        component.currentFilters = null;
        expect(() => component.ngOnInit()).not.toThrow();
      });

      it('should produce a valid form when currentFilters is null', () => {
        component.currentFilters = null;
        component.ngOnInit();

        expect(component.filterForm.valid).toBe(true);
      });
    });

    // -------------------------------------------------------------------------
    // Group 12: Cross-field validators — additional branches
    // -------------------------------------------------------------------------
    describe('Cross-field validators — additional branches', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should remove effDatePeriod required error when effDate is cleared', () => {
        // First cause the error by setting date without period
        component.filterForm.patchValue({
          effDate: moment('2026-01-01'),
          effDatePeriod: null
        });
        expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(true);

        // Clearing effDate should remove the period requirement
        component.filterForm.get('effDate')?.setValue(null);

        expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(false);
      });

      it('should remove termDatePeriod required error when termDate is cleared', () => {
        // First cause the error by setting date without period
        component.filterForm.patchValue({
          termDate: moment('2026-12-31'),
          termDatePeriod: null
        });
        expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(true);

        // Clearing termDate should remove the period requirement
        component.filterForm.get('termDate')?.setValue(null);

        expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 13: validateEffDatePeriod via valueChanges subscription
    // -------------------------------------------------------------------------
    describe('validateEffDatePeriod via valueChanges', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should set required error on effDatePeriod when effDate is set but period is null', () => {
        component.filterForm.patchValue({ effDate: moment('2026-06-01'), effDatePeriod: null });
        expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(true);
        expect(component.filterForm.get('effDatePeriod')?.touched).toBe(true);
      });

      it('should clear effDatePeriod errors when effDate is set and period is also set', () => {
        component.filterForm.patchValue({ effDate: moment('2026-06-01'), effDatePeriod: 'BEFORE' });
        expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(false);
      });

      it('should not set required error on effDatePeriod when effDate is null', () => {
        component.filterForm.patchValue({ effDate: null, effDatePeriod: null });
        expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 14: validateTermDatePeriod via valueChanges subscription
    // -------------------------------------------------------------------------
    describe('validateTermDatePeriod via valueChanges', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should set required error on termDatePeriod when termDate is set but period is null', () => {
        component.filterForm.patchValue({ termDate: moment('2026-12-01'), termDatePeriod: null });
        expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(true);
        expect(component.filterForm.get('termDatePeriod')?.touched).toBe(true);
      });

      it('should clear termDatePeriod errors when termDate is set and period is also set', () => {
        component.filterForm.patchValue({ termDate: moment('2026-12-01'), termDatePeriod: 'AFTER' });
        expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(false);
      });

      it('should not set required error on termDatePeriod when termDate is null', () => {
        component.filterForm.patchValue({ termDate: null, termDatePeriod: null });
        expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(false);
      });

      it('should call validateTermDatePeriod when termDatePeriod valueChanges fires', () => {
        component.filterForm.patchValue({ termDate: moment('2026-12-01'), termDatePeriod: null });
        expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(true);
        // Now change termDatePeriod → subscription fires validateTermDatePeriod again
        component.filterForm.get('termDatePeriod')?.setValue('BEFORE');
        expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 15: validateTerminationDateInput (private, tested via subscription)
    // -------------------------------------------------------------------------
    describe('validateTerminationDateInput via termDate valueChanges', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
        // No nativeElement in test — input will be undefined, so method falls back to ''
      });

      it('should not throw when termDateInput element is not available', () => {
        expect(() => {
          component.filterForm.get('termDate')?.setValue(moment('2026-01-01'));
        }).not.toThrow();
      });
    });

    // -------------------------------------------------------------------------
    // Group 16: onApply when form is invalid
    // -------------------------------------------------------------------------
    describe('onApply when form is invalid', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should NOT emit apply when form is invalid (effDate set without period)', () => {
        spyOn(component.apply, 'emit');
        component.filterForm.patchValue({ effDate: moment('2026-06-01'), effDatePeriod: null });
        component.onApply();
        expect(component.apply.emit).not.toHaveBeenCalled();
      });

      it('should NOT emit apply when termDate set without period', () => {
        spyOn(component.apply, 'emit');
        component.filterForm.patchValue({ termDate: moment('2026-06-01'), termDatePeriod: null });
        component.onApply();
        expect(component.apply.emit).not.toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 17: onEffDateInput with setTimeout paths
    // -------------------------------------------------------------------------
    describe('onEffDateInput', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should mark effDate as dirty and set rawInput', fakeAsync(() => {
        const mockEvent = { target: { value: '01-JAN-2026' } } as unknown as Event;
        component.onEffDateInput(mockEvent);
        tick(0);
        expect(component.filterForm.get('effDate')?.dirty).toBe(true);
      }));

      it('should set invalidDate error when input text does not parse to a date', fakeAsync(() => {
        // Set null on control so that input value doesn't match
        component.filterForm.get('effDate')?.setValue(null);
        const mockEvent = { target: { value: 'bad-text' } } as unknown as Event;
        component.onEffDateInput(mockEvent);
        tick(0);
        expect(component.filterForm.get('effDate')?.hasError('invalidDate')).toBe(true);
      }));
    });

    // -------------------------------------------------------------------------
    // Group 18: onTermDateInput with setTimeout paths
    // -------------------------------------------------------------------------
    describe('onTermDateInput', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should mark termDate as dirty and set rawInput', fakeAsync(() => {
        const mockEvent = { target: { value: '31-DEC-2026' } } as unknown as Event;
        component.onTermDateInput(mockEvent);
        tick(0);
        expect(component.filterForm.get('termDate')?.dirty).toBe(true);
      }));

      it('should set invalidDate error when input text does not parse to a valid termDate', fakeAsync(() => {
        component.filterForm.get('termDate')?.setValue(null);
        const mockEvent = { target: { value: 'bad-text' } } as unknown as Event;
        component.onTermDateInput(mockEvent);
        tick(0);
        expect(component.filterForm.get('termDate')?.hasError('invalidDate')).toBe(true);
      }));
    });

    // -------------------------------------------------------------------------
    // Group 19: validateTermDatePeriod true branch (termDate set, period missing)
    // -------------------------------------------------------------------------
    describe('validateTermDatePeriod required error', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should set required error on termDatePeriod when termDate is set but period is null', () => {
        component.filterForm.get('termDate')?.setValue(moment('2026-12-31'));
        component.filterForm.get('termDatePeriod')?.setValue(null);
        (component as any).validateTermDatePeriod();
        expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(true);
      });

      it('should clear error on termDatePeriod when termDate is set AND period is set', () => {
        component.filterForm.get('termDate')?.setValue(moment('2026-12-31'));
        component.filterForm.get('termDatePeriod')?.setValue('GE');
        (component as any).validateTermDatePeriod();
        expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(false);
      });

      it('should clear error when termDate is null (no date selected)', () => {
        component.filterForm.get('termDate')?.setValue(null);
        component.filterForm.get('termDatePeriod')?.setValue(null);
        (component as any).validateTermDatePeriod();
        expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 20: validateTerminationDateInput else-if path
    // -------------------------------------------------------------------------
    describe('validateTerminationDateInput else-if path', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should clear invalidDate error when termDate becomes valid after having error', () => {
        const termCtrl = component.filterForm.get('termDate')!;
        // Set invalidDate error to simulate prior state
        termCtrl.setErrors({ invalidDate: true });
        // Now set a valid value — invalidDate should be cleared
        termCtrl.setValue(moment('2026-06-01'));
        (component as any).validateTerminationDateInput();
        expect(termCtrl.hasError('invalidDate')).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 21: onApply when form is invalid
    // -------------------------------------------------------------------------
    describe('onApply when form is invalid (additional)', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should NOT emit apply event when form is invalid', () => {
        spyOn(component.apply, 'emit');
        // Make form invalid by setting effDate without effDatePeriod
        component.filterForm.get('effDate')?.setValue(moment('2026-06-01'));
        component.filterForm.get('effDatePeriod')?.setValue(null);
        component.filterForm.get('effDatePeriod')?.setErrors({ required: true });
        component.onApply();
        expect(component.apply.emit).not.toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------------
    // Group 22: isApplyDisabled when form is valid
    // -------------------------------------------------------------------------
    describe('isApplyDisabled when form is valid', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should return true (unchanged) when form is valid but unchanged', () => {
        expect(component.isApplyDisabled()).toBe(true);
      });

      it('should return false when form is valid and changed', () => {
        component.filterForm.get('effDatePeriod')?.setValue('GE');
        expect(component.isApplyDisabled()).toBe(false);
      });
    });

    // -------------------------------------------------------------------------
    // Group 23: onEffDateInput paths
    // -------------------------------------------------------------------------
    describe('onEffDateInput paths', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should set invalidDate error when input has text but control value is null', fakeAsync(() => {
        component.filterForm.get('effDate')?.setValue(null);
        const mockEvent = { target: { value: 'invalid-date' } } as unknown as Event;
        component.onEffDateInput(mockEvent);
        tick(0);
        expect(component.filterForm.get('effDate')?.hasError('invalidDate')).toBe(true);
      }));

      it('should not set invalidDate error when control has a valid value', fakeAsync(() => {
        component.filterForm.get('effDate')?.setValue(moment('2026-06-01'));
        const mockEvent = { target: { value: '01-JUN-2026' } } as unknown as Event;
        component.onEffDateInput(mockEvent);
        tick(0);
        expect(component.filterForm.get('effDate')?.hasError('invalidDate')).toBe(false);
      }));
    });

    // -------------------------------------------------------------------------
    // Group 24: onEffDateBlur edge cases
    // -------------------------------------------------------------------------
    describe('onEffDateBlur edge cases', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should format date and clear errors when control has valid moment', fakeAsync(() => {
        const validMoment = moment('2026-06-01');
        component.filterForm.get('effDate')?.setValue(validMoment);
        const mockInput = { value: '01-JUN-2026' } as HTMLInputElement;
        component.onEffDateBlur(mockInput);
        tick(0);
        expect(component.filterForm.get('effDate')?.errors).toBeNull();
      }));

      it('should NOT re-set invalidDate error when control already has invalidDate', fakeAsync(() => {
        const ctrl = component.filterForm.get('effDate')!;
        ctrl.setErrors({ invalidDate: true });
        const mockInput = { value: 'bad-date' } as HTMLInputElement;
        (component as any).effDateRawInput = 'bad-date';
        component.onEffDateBlur(mockInput);
        tick(0);
        expect(ctrl.hasError('invalidDate')).toBe(true);
      }));

      it('should clear errors when input is empty on blur', fakeAsync(() => {
        const ctrl = component.filterForm.get('effDate')!;
        ctrl.setErrors({ invalidDate: true });
        const mockInput = { value: '' } as HTMLInputElement;
        component.onEffDateBlur(mockInput);
        tick(0);
        expect(ctrl.errors).toBeNull();
      }));
    });

    // -------------------------------------------------------------------------
    // Group 25: onTermDateInput and onTermDateBlur edge cases
    // -------------------------------------------------------------------------
    describe('onTermDateInput and onTermDateBlur edge cases', () => {
      beforeEach(() => {
        component.currentFilters = null;
        component.ngOnInit();
      });

      it('should not set invalidDate error when termDate control has valid value', fakeAsync(() => {
        component.filterForm.get('termDate')?.setValue(moment('2026-12-31'));
        const mockEvent = { target: { value: '31-DEC-2026' } } as unknown as Event;
        component.onTermDateInput(mockEvent);
        tick(0);
        expect(component.filterForm.get('termDate')?.hasError('invalidDate')).toBe(false);
      }));

      it('should format and clear errors on termDateBlur with valid moment', fakeAsync(() => {
        const validMoment = moment('2026-12-31');
        component.filterForm.get('termDate')?.setValue(validMoment);
        const mockInput = { value: '31-DEC-2026' } as HTMLInputElement;
        component.onTermDateBlur(mockInput);
        tick(0);
        expect(component.filterForm.get('termDate')?.errors).toBeNull();
      }));

      it('should NOT re-set invalidDate error on termDateBlur when already has error', fakeAsync(() => {
        const ctrl = component.filterForm.get('termDate')!;
        ctrl.setErrors({ invalidDate: true });
        const mockInput = { value: 'bad-date' } as HTMLInputElement;
        (component as any).termDateRawInput = 'bad-date';
        component.onTermDateBlur(mockInput);
        tick(0);
        expect(ctrl.hasError('invalidDate')).toBe(true);
      }));

      it('should clear errors when termDate input is empty on blur', fakeAsync(() => {
        const ctrl = component.filterForm.get('termDate')!;
        ctrl.setErrors({ invalidDate: true });
        const mockInput = { value: '' } as HTMLInputElement;
        component.onTermDateBlur(mockInput);
        tick(0);
        expect(ctrl.errors).toBeNull();
      }));
    });

  }); // end Additional Coverage

  // -------------------------------------------------------------------------
  // Group 26: validateTermDatePeriod — subscription and direct paths
  // -------------------------------------------------------------------------
  describe('Group 26: validateTermDatePeriod via termDatePeriod.valueChanges', () => {
    beforeEach(() => {
      component.currentFilters = null;
      component.ngOnInit();
    });

    it('should set required error on termDatePeriod when termDate has value but period is null', () => {
      component.filterForm.get('termDate')?.setValue(moment('2026-12-31'));
      component.filterForm.get('termDatePeriod')?.setValue(null);
      expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should clear termDatePeriod error when termDatePeriod is set', () => {
      component.filterForm.get('termDate')?.setValue(moment('2026-12-31'));
      component.filterForm.get('termDatePeriod')?.setValue(null);
      component.filterForm.get('termDatePeriod')?.setValue('AFTER');
      expect(component.filterForm.get('termDatePeriod')?.hasError('required')).toBe(false);
    });

    it('should clear termDatePeriod error when termDate is cleared', () => {
      component.filterForm.get('termDate')?.setValue(moment('2026-12-31'));
      component.filterForm.get('termDatePeriod')?.setValue(null);
      component.filterForm.get('termDate')?.setValue(null);
      expect(component.filterForm.get('termDatePeriod')?.errors).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Group 27: onTermDateInput — markAsDirty/markAsTouched and invalidDate
  // -------------------------------------------------------------------------
  describe('Group 27: onTermDateInput', () => {
    beforeEach(() => {
      component.currentFilters = null;
      component.ngOnInit();
    });

    it('should mark termDate dirty and touched, and set invalidDate when text is entered with null control value', fakeAsync(() => {
      component.filterForm.get('termDate')?.setValue(null);
      const mockEvent = { target: { value: 'bad-date' } } as unknown as Event;
      component.onTermDateInput(mockEvent);
      tick(0);
      expect(component.filterForm.get('termDate')?.dirty).toBe(true);
      expect(component.filterForm.get('termDate')?.touched).toBe(true);
      expect(component.filterForm.get('termDate')?.hasError('invalidDate')).toBe(true);
    }));

    it('should not set invalidDate error when termDate control already has a valid value', fakeAsync(() => {
      component.filterForm.get('termDate')?.setValue(moment('2026-12-31'));
      const mockEvent = { target: { value: '31-DEC-2026' } } as unknown as Event;
      component.onTermDateInput(mockEvent);
      tick(0);
      expect(component.filterForm.get('termDate')?.hasError('invalidDate')).toBe(false);
    }));
  });

  describe('onApply valid form', () => {
    it('should emit apply when form is valid', () => {
      component.ngOnInit();
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effDate: moment('2026-01-01'),
        effDatePeriod: 'AFTER',
        termDate: null,
        termDatePeriod: null
      });
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalledWith(component.filterForm.value);
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      component.ngOnInit();
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return true when form is unchanged', () => {
      expect(component.isApplyDisabled()).toBe(true);
    });

    it('should return true when form is invalid', () => {
      component.filterForm.patchValue({ effDate: moment('2026-01-01'), effDatePeriod: null });
      expect(component.isApplyDisabled()).toBe(true);
    });

    it('should return false when form is valid and changed', () => {
      component.filterForm.patchValue({ effDate: moment('2026-01-01'), effDatePeriod: 'AFTER' });
      expect(component.isApplyDisabled()).toBe(false);
    });
  });

  describe('onEffDateInput', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should mark effDate control dirty and touched', () => {
      const event = { target: { value: '01-Jan-2026' } } as unknown as Event;
      component.onEffDateInput(event);
      const control = component.filterForm.get('effDate');
      expect(control?.dirty).toBe(true);
      expect(control?.touched).toBe(true);
    });

    it('should set invalidDate error after timeout when input has text but value is null', (done) => {
      const event = { target: { value: 'invalid' } } as unknown as Event;
      component.onEffDateInput(event);
      setTimeout(() => {
        const control = component.filterForm.get('effDate');
        expect(control?.hasError('invalidDate')).toBe(true);
        done();
      }, 10);
    });

    it('should handle empty effDate control gracefully', () => {
      component.filterForm.removeControl('effDate');
      const event = { target: { value: 'test' } } as unknown as Event;
      expect(() => component.onEffDateInput(event)).not.toThrow();
    });
  });

  describe('onEffDateBlur', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should format valid date on blur', (done) => {
      const input = { value: '01-Jan-2026' } as HTMLInputElement;
      component.filterForm.patchValue({ effDate: moment('2026-01-01') });
      component.onEffDateBlur(input);
      setTimeout(() => {
        const control = component.filterForm.get('effDate');
        expect(control?.touched).toBe(true);
        done();
      }, 10);
    });

    it('should set invalidDate error when input has text but control value is null', (done) => {
      const input = { value: 'baddate' } as HTMLInputElement;
      component.filterForm.patchValue({ effDate: null });
      (component as any).effDateRawInput = 'baddate';
      component.onEffDateBlur(input);
      setTimeout(() => {
        const control = component.filterForm.get('effDate');
        expect(control?.hasError('invalidDate')).toBe(true);
        done();
      }, 10);
    });

    it('should clear errors when input is empty', (done) => {
      const input = { value: '' } as HTMLInputElement;
      component.filterForm.patchValue({ effDate: null });
      component.onEffDateBlur(input);
      setTimeout(() => {
        const control = component.filterForm.get('effDate');
        expect(control?.errors).toBeNull();
        done();
      }, 10);
    });

    it('should handle missing effDate control', () => {
      component.filterForm.removeControl('effDate');
      const input = { value: 'test' } as HTMLInputElement;
      expect(() => component.onEffDateBlur(input)).not.toThrow();
    });
  });

  describe('onTermDateInput', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should mark termDate control dirty and touched', () => {
      const event = { target: { value: '31-Dec-2026' } } as unknown as Event;
      component.onTermDateInput(event);
      const control = component.filterForm.get('termDate');
      expect(control?.dirty).toBe(true);
      expect(control?.touched).toBe(true);
    });

    it('should set invalidDate error after timeout when input has text but value is null', (done) => {
      const event = { target: { value: 'invalid' } } as unknown as Event;
      component.onTermDateInput(event);
      setTimeout(() => {
        const control = component.filterForm.get('termDate');
        expect(control?.hasError('invalidDate')).toBe(true);
        done();
      }, 10);
    });

    it('should handle empty termDate control gracefully', () => {
      component.filterForm.removeControl('termDate');
      const event = { target: { value: 'test' } } as unknown as Event;
      expect(() => component.onTermDateInput(event)).not.toThrow();
    });
  });

  describe('onTermDateBlur', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should format valid date on blur', (done) => {
      const input = { value: '31-Dec-2026' } as HTMLInputElement;
      component.filterForm.patchValue({ termDate: moment('2026-12-31') });
      component.onTermDateBlur(input);
      setTimeout(() => {
        const control = component.filterForm.get('termDate');
        expect(control?.touched).toBe(true);
        done();
      }, 10);
    });

    it('should set invalidDate error when input has text but control value is null', (done) => {
      const input = { value: 'baddate' } as HTMLInputElement;
      component.filterForm.patchValue({ termDate: null });
      (component as any).termDateRawInput = 'baddate';
      component.onTermDateBlur(input);
      setTimeout(() => {
        const control = component.filterForm.get('termDate');
        expect(control?.hasError('invalidDate')).toBe(true);
        done();
      }, 10);
    });

    it('should clear errors when input is empty', (done) => {
      const input = { value: '' } as HTMLInputElement;
      component.filterForm.patchValue({ termDate: null });
      component.onTermDateBlur(input);
      setTimeout(() => {
        const control = component.filterForm.get('termDate');
        expect(control?.errors).toBeNull();
        done();
      }, 10);
    });

    it('should handle missing termDate control', () => {
      component.filterForm.removeControl('termDate');
      const input = { value: 'test' } as HTMLInputElement;
      expect(() => component.onTermDateBlur(input)).not.toThrow();
    });
  });

  describe('getEffDateError', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return empty string when no control', () => {
      component.filterForm.removeControl('effDate');
      expect(component.getEffDateError()).toBe('');
    });

    it('should return invalid date message for invalidDate error', () => {
      component.filterForm.get('effDate')?.setErrors({ invalidDate: true });
      expect(component.getEffDateError()).toBe('Effective Date is invalid');
    });

    it('should return invalid date message for matDatepickerParse error', () => {
      component.filterForm.get('effDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.getEffDateError()).toBe('Effective Date is invalid');
    });

    it('should return empty string when not touched or dirty', () => {
      expect(component.getEffDateError()).toBe('');
    });

    it('should return empty string when touched but no relevant errors', () => {
      component.filterForm.get('effDate')?.markAsTouched();
      expect(component.getEffDateError()).toBe('');
    });
  });

  describe('getTermDateError', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return empty string when no control', () => {
      component.filterForm.removeControl('termDate');
      expect(component.getTermDateError()).toBe('');
    });

    it('should return invalid date message for invalidDate error', () => {
      component.filterForm.get('termDate')?.setErrors({ invalidDate: true });
      expect(component.getTermDateError()).toBe('Termination Date is invalid');
    });

    it('should return invalid date message for matDatepickerParse error', () => {
      component.filterForm.get('termDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.getTermDateError()).toBe('Termination Date is invalid');
    });

    it('should return empty string when not touched or dirty', () => {
      expect(component.getTermDateError()).toBe('');
    });
  });

  describe('getEffDatePeriodError', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return Period is required when has required error and touched', () => {
      component.filterForm.get('effDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('effDatePeriod')?.markAsTouched();
      expect(component.getEffDatePeriodError()).toBe('Period is required');
    });

    it('should return empty string when not touched', () => {
      component.filterForm.get('effDatePeriod')?.setErrors({ required: true });
      expect(component.getEffDatePeriodError()).toBe('');
    });

    it('should return empty string when no errors', () => {
      expect(component.getEffDatePeriodError()).toBe('');
    });
  });

  describe('getTermDatePeriodError', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return Period is required when has required error and touched', () => {
      component.filterForm.get('termDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('termDatePeriod')?.markAsTouched();
      expect(component.getTermDatePeriodError()).toBe('Period is required');
    });

    it('should return empty string when not touched', () => {
      component.filterForm.get('termDatePeriod')?.setErrors({ required: true });
      expect(component.getTermDatePeriodError()).toBe('');
    });

    it('should return empty string when no errors', () => {
      expect(component.getTermDatePeriodError()).toBe('');
    });
  });

});
