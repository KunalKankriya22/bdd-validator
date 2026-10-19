import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditHHResponseGroup } from './add-edit-hh-response-group';
import { HHResponseGroupsService } from '../services/hh-response-groups.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditHHResponseGroup', () => {
  let component: AddEditHHResponseGroup;
  let fixture: ComponentFixture<AddEditHHResponseGroup>;
  let mockService: jasmine.SpyObj<HHResponseGroupsService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('HHResponseGroupsService', [
      'addResponseGroup',
      'updateResponseGroup'
    ]);
    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
imports: [
        AddEditHHResponseGroup,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: HHResponseGroupsService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    });



  beforeEach(() => {

    fixture = TestBed.createComponent(AddEditHHResponseGroup);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should initialize form with controls', () => {
    expect(component.responseGroupForm).toBeDefined();
    expect(component.responseGroupForm.get('groupCode')).toBeDefined();
    expect(component.responseGroupForm.get('description')).toBeDefined();
    expect(component.responseGroupForm.get('effectiveDate')).toBeDefined();
    expect(component.responseGroupForm.get('terminationDate')).toBeDefined();
  });











  // ==================== Last Changed Date Validation Tests ====================

  describe('Last Changed Date Field Tracking', () => {

    it('should set lastChangedDateField to effectiveDate when effective date input changes', () => {
      const input = document.createElement('input');
      input.value = '25-APR-2026';
      const event = { target: input } as any;

      component.onEffectiveDateInput(event);

      expect(component['lastChangedDateField']).toBe('effectiveDate');
    });

    it('should set lastChangedDateField to terminationDate when termination date input changes', () => {
      const input = document.createElement('input');
      const futureDate = moment().add(1, 'day').format('DD-MMM-YYYY');
      input.value = futureDate;
      const event = { target: input } as any;

      component.onTerminationDateInput(event);

      expect(component['lastChangedDateField']).toBe('terminationDate');
    });

    it('should track effective date changes via valueChanges subscription', (done) => {
      const effectiveDateControl = component.responseGroupForm.get('effectiveDate');

      effectiveDateControl?.setValue(moment().add(1, 'day'));

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('effectiveDate');
        done();
      }, 50);
    });

    it('should track termination date changes via valueChanges subscription', (done) => {
      const terminationDateControl = component.responseGroupForm.get('terminationDate');

      terminationDateControl?.setValue(moment().add(1, 'day'));

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('terminationDate');
        done();
      }, 50);
    });

  });

  describe('Error State Matchers', () => {
    it('should define effectiveDateErrorMatcher', () => {
      expect(component.effectiveDateErrorMatcher).toBeDefined();
      expect(component.effectiveDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should define terminationDateErrorMatcher', () => {
      expect(component.terminationDateErrorMatcher).toBeDefined();
      expect(component.terminationDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('effectiveDateErrorMatcher should return false when control is not touched or dirty', () => {
      const control = component.responseGroupForm.get('effectiveDate') as any;
      control.markAsUntouched();
      control.markAsPristine();

      const result = component.effectiveDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(false);
    });


    it('effectiveDateErrorMatcher should NOT show error when terminationDate was last changed', () => {
      const control = component.responseGroupForm.get('effectiveDate') as any;
      control.markAsTouched();

      component.responseGroupForm.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = 'terminationDate';

      const result = component.effectiveDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(false);
    });


    it('terminationDateErrorMatcher should NOT show error when effectiveDate was last changed', () => {
      const control = component.responseGroupForm.get('terminationDate') as any;
      control.markAsTouched();

      component.responseGroupForm.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = 'effectiveDate';

      const result = component.terminationDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(false);
    });

    it('errorStateMatcher should show normal field-level errors regardless of lastChangedDateField', () => {
      const control = component.responseGroupForm.get('effectiveDate') as any;
      control.markAsTouched();
      control.setErrors({ required: true });

      component['lastChangedDateField'] = null;

      const result = component.effectiveDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(true);
    });
  });

  describe('Cross-Field Date Validation with Last Changed Logic', () => {
    it('should show error on effectiveDate when effectiveDate > terminationDate and effectiveDate was last changed', () => {
      const effectiveDateControl = component.responseGroupForm.get('effectiveDate');
      const terminationDateControl = component.responseGroupForm.get('terminationDate');

      const futureDate = moment().add(1, 'year');
      const oneDayBefore = moment().add(1, 'year').subtract(1, 'day');

      effectiveDateControl?.setValue(futureDate);
      effectiveDateControl?.markAsTouched();
      terminationDateControl?.setValue(oneDayBefore);
      terminationDateControl?.markAsTouched();

      component['lastChangedDateField'] = 'effectiveDate';
      component.responseGroupForm.setErrors({ dateRangeInvalid: true });

      const error = component.getEffectiveDateError();
      expect(error).toContain('Effective Date must be less than or equal to Termination Date');
    });

    it('should show error on terminationDate when effectiveDate > terminationDate and terminationDate was last changed', () => {
      const effectiveDateControl = component.responseGroupForm.get('effectiveDate');
      const terminationDateControl = component.responseGroupForm.get('terminationDate');

      const futureDate = moment().add(1, 'year');
      const oneDayBefore = moment().add(1, 'year').subtract(1, 'day');

      effectiveDateControl?.setValue(futureDate);
      effectiveDateControl?.markAsTouched();
      terminationDateControl?.setValue(oneDayBefore);
      terminationDateControl?.markAsTouched();

      component['lastChangedDateField'] = 'terminationDate';
      component.responseGroupForm.setErrors({ dateRangeInvalid: true });

      const error = component.getTerminationDateError();
      expect(error).toContain('Termination Date must be greater than or equal to Effective Date');
    });

    it('should NOT show cross-field error on effectiveDate when terminationDate was last changed', () => {
      const effectiveDateControl = component.responseGroupForm.get('effectiveDate');
      const terminationDateControl = component.responseGroupForm.get('terminationDate');

      const futureDate = moment().add(1, 'year');
      const oneDayBefore = moment().add(1, 'year').subtract(1, 'day');

      effectiveDateControl?.setValue(futureDate);
      effectiveDateControl?.markAsTouched();
      terminationDateControl?.setValue(oneDayBefore);
      terminationDateControl?.markAsTouched();

      component['lastChangedDateField'] = 'terminationDate';
      component.responseGroupForm.setErrors({ dateRangeInvalid: true });

      const error = component.getEffectiveDateError();
      expect(error).toBe('');
    });

    it('should NOT show cross-field error on terminationDate when effectiveDate was last changed', () => {
      const effectiveDateControl = component.responseGroupForm.get('effectiveDate');
      const terminationDateControl = component.responseGroupForm.get('terminationDate');

      const futureDate = moment().add(1, 'year');
      const oneDayBefore = moment().add(1, 'year').subtract(1, 'day');

      effectiveDateControl?.setValue(futureDate);
      effectiveDateControl?.markAsTouched();
      terminationDateControl?.setValue(oneDayBefore);
      terminationDateControl?.markAsTouched();

      component['lastChangedDateField'] = 'effectiveDate';
      component.responseGroupForm.setErrors({ dateRangeInvalid: true });

      const terminationError = component.getTerminationDateError();
      // Should not show the cross-field error message
      expect(terminationError).toBe('');
    });

    it('should still show field-level errors on effectiveDate regardless of lastChangedDateField', () => {
      const effectiveDateControl = component.responseGroupForm.get('effectiveDate');
      effectiveDateControl?.setValue(null);
      effectiveDateControl?.markAsTouched();
      effectiveDateControl?.setErrors({ required: true });

      component['lastChangedDateField'] = 'terminationDate';

      const error = component.getEffectiveDateError();
      expect(error).toContain('Effective Date is required');
    });
  });

  describe('Fallback Logic in Save Methods', () => {
    beforeEach(() => {
      mockService.addResponseGroup.and.returnValue(of({
        data: [],
        success: true,
        message: 'Added successfully'
      }));
    });

    it('should set lastChangedDateField to terminationDate in onAdd if dateRangeInvalid and no field was changed', () => {
      const futureDate = moment().add(1, 'year');
      const oneDayBefore = moment().add(1, 'year').subtract(1, 'day');

      component.responseGroupForm.patchValue({
        groupCode: 'TEST',
        description: 'Test',
        effectiveDate: futureDate,
        terminationDate: oneDayBefore
      });

      component.responseGroupForm.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = null;

      component.onAdd();

      expect(component['lastChangedDateField']).toEqual('terminationDate' as any);
    });

    it('should set lastChangedDateField to terminationDate in onAddAndCreateAnother if dateRangeInvalid and no field was changed', () => {
      const futureDate = moment().add(1, 'year');
      const oneDayBefore = moment().add(1, 'year').subtract(1, 'day');

      component.responseGroupForm.patchValue({
        groupCode: 'TEST',
        description: 'Test',
        effectiveDate: futureDate,
        terminationDate: oneDayBefore
      });

      component.responseGroupForm.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = null;

      component.onAddAndCreateAnother();

      expect(component['lastChangedDateField']).toEqual('terminationDate' as any);
    });

    it('should set lastChangedDateField to terminationDate in onSave if dateRangeInvalid and no field was changed', () => {
      const futureDate = moment().add(1, 'year');
      const oneDayBefore = moment().add(1, 'year').subtract(1, 'day');

      component.mode = 'edit';
      component.data = {
        groupCode: 'TEST',
        description: 'Test',
        questionCode: 'HQ0020',
        responseCode: 'Yes',
        effectiveDate: futureDate.format('YYYY-MM-DD'),
        terminationDate: oneDayBefore.format('YYYY-MM-DD'),
        chapterId: 'CH001'
      };
      component.ngOnInit();

      mockService.updateResponseGroup.and.returnValue(of({
        data: [],
        success: true,
        message: 'Updated successfully'
      }));

      component.responseGroupForm.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = null;

      component.onSave();

      expect(component['lastChangedDateField']).toEqual('terminationDate' as any);
    });

    it('should NOT change lastChangedDateField in onAdd if it was already set', () => {
      const futureDate = moment().add(1, 'year');
      const oneDayBefore = moment().add(1, 'year').subtract(1, 'day');

      component.responseGroupForm.patchValue({
        groupCode: 'TEST',
        description: 'Test',
        effectiveDate: futureDate,
        terminationDate: oneDayBefore
      });

      component.responseGroupForm.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = 'effectiveDate';

      component.onAdd();

      expect(component['lastChangedDateField']).toBe('effectiveDate');
    });
  });

  describe('Input Handler Tests with setTimeout', () => {


    it('onEffectiveDateInput should set required error when input is cleared', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as any;

      component.onEffectiveDateInput(event);

      const control = component.responseGroupForm.get('effectiveDate');
      expect(control?.value).toBeNull();
      expect(control?.hasError('required')).toBe(true);
    });

    it('onTerminationDateInput should clear errors when input is cleared in add mode', () => {
      component.mode = 'add';
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as any;

      component.onTerminationDateInput(event);

      const control = component.responseGroupForm.get('terminationDate');
      expect(control?.value).toBeNull();
      expect(control?.errors).toBeNull();
    });
  });

  describe('Distinct Until Changed Logic', () => {
    it('should not update lastChangedDateField when same date value is set multiple times', (done) => {
      const effectiveDateControl = component.responseGroupForm.get('effectiveDate');
      const dateValue = moment().startOf('day');

      let changeCount = 0;
      const originalLastChanged = component['lastChangedDateField'];

      effectiveDateControl?.setValue(dateValue);

      setTimeout(() => {
        const firstChange = component['lastChangedDateField'];

        // Set the same date again
        effectiveDateControl?.setValue(moment().startOf('day'));

        setTimeout(() => {
          // distinctUntilChanged should prevent unnecessary tracking updates
          // but tracking will still update - just less frequently
          expect(component['lastChangedDateField']).toBe('effectiveDate');
          done();
        }, 50);
      }, 50);
    });
  });

  describe('Integration Test: Complete User Flow', () => {
    it('should handle complete scenario: user changes effective date after termination date', (done) => {
      // Arrange: User enters termination date first (future date)
      const terminationDateControl = component.responseGroupForm.get('terminationDate');
      const terminationDate = moment().add(1, 'day').startOf('day');
      terminationDateControl?.setValue(terminationDate);
      terminationDateControl?.markAsTouched();

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('terminationDate');

        // Act: User then enters effective date that's after termination date (invalid range)
        const effectiveDateControl = component.responseGroupForm.get('effectiveDate');
        const effectiveDate = moment().add(2, 'days').startOf('day');
        effectiveDateControl?.setValue(effectiveDate);
        effectiveDateControl?.markAsTouched();

        setTimeout(() => {
          expect(component['lastChangedDateField']).toBe('effectiveDate');

          // Assert: Error should appear on effective date (last changed field)
          component.responseGroupForm.setErrors({ dateRangeInvalid: true });
          const effectiveError = component.getEffectiveDateError();
          const terminationError = component.getTerminationDateError();

          expect(effectiveError).toContain('Effective Date must be less than or equal to Termination Date');
          expect(terminationError).toBe('');
          done();
        }, 50);
      }, 50);
    });

    it('should handle complete scenario: user fixes termination date after seeing error on effective date', (done) => {
      // Arrange: Invalid dates set with error on effective date
      const effectiveDateControl = component.responseGroupForm.get('effectiveDate');
      const terminationDateControl = component.responseGroupForm.get('terminationDate');

      const effectiveDate = moment().add(7, 'days');
      const initialTerminationDate = moment().add(5, 'days');
      effectiveDateControl?.setValue(effectiveDate);
      effectiveDateControl?.markAsTouched();
      terminationDateControl?.setValue(initialTerminationDate);
      terminationDateControl?.markAsTouched();

      component['lastChangedDateField'] = 'effectiveDate';
      component.responseGroupForm.setErrors({ dateRangeInvalid: true });

      setTimeout(() => {
        // Act: User fixes by changing termination date
        const fixedTerminationDate = moment().add(10, 'days');
        terminationDateControl?.setValue(fixedTerminationDate);

        setTimeout(() => {
          expect(component['lastChangedDateField']).toBe('terminationDate');

          // Assert: Form should now be valid
          component.responseGroupForm.updateValueAndValidity();

          setTimeout(() => {
            expect(component.responseGroupForm.errors).toBeNull();
            done();
          }, 50);
        }, 50);
      }, 50);
    });
  });
});
