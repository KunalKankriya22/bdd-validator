import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import {
  FilterEquipmentMasterCodesComponent,
  FilterEquipmentMasterCodesDialogData,
} from './filter-equipment-master-codes';
import { EquipmentMasterCodeFilter } from '../models/equipment-master-code.model';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockUserGroupOptions = [
  { value: 'GRP1', label: 'Group 1' },
  { value: 'GRP2', label: 'Group 2' },
  { value: 'ADMIN', label: 'Administrators' },
];

const effDate = new Date('2026-01-15');
const termDate = new Date('2026-06-30');

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('FilterEquipmentMasterCodesComponent', () => {
  let component: FilterEquipmentMasterCodesComponent;
  let fixture: ComponentFixture<FilterEquipmentMasterCodesComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<FilterEquipmentMasterCodesComponent>>;

  function setup(data: FilterEquipmentMasterCodesDialogData | null = null): void {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [FilterEquipmentMasterCodesComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(FilterEquipmentMasterCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ── Initialization with no data ────────────────────────────────────────────

  describe('when opened with no existing filters', () => {
    beforeEach(() => setup(null));

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialise all form controls to null', () => {
      expect(component.filterForm.get('userGroup')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });

    it('should have empty userGroupOptions when data is null', () => {
      expect(component.userGroupOptions).toEqual([]);
    });

    it('should have empty filteredUserGroupOptions when data is null', () => {
      expect(component.filteredUserGroupOptions).toEqual([]);
    });

    it('should have empty error messages initially', () => {
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  // ── Initialization with data ───────────────────────────────────────────────

  describe('when opened with existing filter data', () => {
    const existingFilters: EquipmentMasterCodeFilter = {
      userGroup: 'GRP1',
      effectiveDate: effDate,
      effectiveDatePeriod: 'AFTER',
      terminationDate: termDate,
      terminationDatePeriod: 'BEFORE',
    };

    beforeEach(() =>
      setup({ currentFilters: existingFilters, userGroupOptions: mockUserGroupOptions }),
    );

    it('should populate userGroupOptions from dialog data', () => {
      expect(component.userGroupOptions).toEqual(mockUserGroupOptions);
    });

    it('should populate filteredUserGroupOptions from dialog data', () => {
      expect(component.filteredUserGroupOptions).toEqual(mockUserGroupOptions);
    });

    it('should pre-fill userGroup from currentFilters', () => {
      expect(component.filterForm.get('userGroup')?.value).toBe('GRP1');
    });

    it('should pre-fill effectiveDate from currentFilters', () => {
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(effDate);
    });

    it('should pre-fill effectiveDatePeriod from currentFilters', () => {
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('AFTER');
    });

    it('should pre-fill terminationDate from currentFilters', () => {
      expect(component.filterForm.get('terminationDate')?.value).toEqual(termDate);
    });

    it('should pre-fill terminationDatePeriod from currentFilters', () => {
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('BEFORE');
    });

    it('should run validation on init so period errors are clear when both set', () => {
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  // ── Initialization with data that has no currentFilters ────────────────────

  describe('when opened with userGroupOptions but no currentFilters', () => {
    beforeEach(() =>
      setup({ currentFilters: null, userGroupOptions: mockUserGroupOptions }),
    );

    it('should populate userGroupOptions', () => {
      expect(component.userGroupOptions).toEqual(mockUserGroupOptions);
    });

    it('should leave form controls at null', () => {
      expect(component.filterForm.get('userGroup')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });

  // ── User Group Search Filtering ────────────────────────────────────────────

  describe('userGroupSearchCtrl filtering', () => {
    beforeEach(() =>
      setup({ currentFilters: null, userGroupOptions: mockUserGroupOptions }),
    );

    it('should filter user groups by value (case-insensitive)', () => {
      component.userGroupSearchCtrl.setValue('grp1');
      expect(component.filteredUserGroupOptions).toEqual([
        { value: 'GRP1', label: 'Group 1' },
      ]);
    });

    it('should filter user groups by label (case-insensitive)', () => {
      component.userGroupSearchCtrl.setValue('admin');
      expect(component.filteredUserGroupOptions).toEqual([
        { value: 'ADMIN', label: 'Administrators' },
      ]);
    });

    it('should show all options when search term is empty', () => {
      component.userGroupSearchCtrl.setValue('admin');
      component.userGroupSearchCtrl.setValue('');
      expect(component.filteredUserGroupOptions.length).toBe(3);
    });

    it('should handle null search term', () => {
      component.userGroupSearchCtrl.setValue(null);
      expect(component.filteredUserGroupOptions.length).toBe(3);
    });

    it('should return empty when no groups match', () => {
      component.userGroupSearchCtrl.setValue('zzz');
      expect(component.filteredUserGroupOptions).toEqual([]);
    });
  });

  // ── formChanged tracking ───────────────────────────────────────────────────

  describe('formChanged tracking', () => {
    beforeEach(() =>
      setup({ currentFilters: null, userGroupOptions: mockUserGroupOptions }),
    );

    it('should set formChanged when userGroup changes', () => {
      expect(component['formChanged']).toBeFalse();
      component.filterForm.get('userGroup')?.setValue('GRP1');
      expect(component['formChanged']).toBeTrue();
    });

    it('should set formChanged when effectiveDatePeriod changes', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component['formChanged']).toBeTrue();
    });

    it('should set formChanged when terminationDatePeriod changes', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component['formChanged']).toBeTrue();
    });

    it('should set formChanged when effectiveDate changes', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      expect(component['formChanged']).toBeTrue();
    });

    it('should set formChanged when terminationDate changes', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      expect(component['formChanged']).toBeTrue();
    });

    it('should mark effectiveDate as touched when it changes and is not touched', () => {
      const control = component.filterForm.get('effectiveDate');
      expect(control?.touched).toBeFalse();
      control?.setValue(effDate);
      expect(control?.touched).toBeTrue();
    });

    it('should mark terminationDate as touched when it changes and is not touched', () => {
      const control = component.filterForm.get('terminationDate');
      expect(control?.touched).toBeFalse();
      control?.setValue(termDate);
      expect(control?.touched).toBeTrue();
    });
  });

  // ── validateEffectiveDatePeriod ────────────────────────────────────────────

  describe('effective date period validation', () => {
    beforeEach(() => setup(null));

    it('should set error when effectiveDate is set without period', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      expect(component.effectiveDatePeriodError).toBe('Period is required');
      expect(component.filterForm.get('effectiveDatePeriod')?.hasError('required')).toBeTrue();
    });

    it('should clear error when both effectiveDate and period are set', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
    });

    it('should clear error when neither effectiveDate nor period are set', () => {
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should mark effectiveDatePeriod as touched when error is set', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      expect(component.filterForm.get('effectiveDatePeriod')?.touched).toBeTrue();
    });
  });

  // ── validateTerminationDatePeriod ──────────────────────────────────────────

  describe('termination date period validation', () => {
    beforeEach(() => setup(null));

    it('should set error when terminationDate is set without period', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      expect(component.terminationDatePeriodError).toBe('Period is required');
      expect(component.filterForm.get('terminationDatePeriod')?.hasError('required')).toBeTrue();
    });

    it('should clear error when both terminationDate and period are set', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component.terminationDatePeriodError).toBe('');
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });

    it('should clear error when neither terminationDate nor period are set', () => {
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should mark terminationDatePeriod as touched when error is set', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      expect(component.filterForm.get('terminationDatePeriod')?.touched).toBeTrue();
    });
  });

  // ── isApplyDisabled ────────────────────────────────────────────────────────

  describe('isApplyDisabled', () => {
    beforeEach(() => setup(null));

    it('should return true when form is empty (no complete values)', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when form has not changed even if values are set', () => {
      // formChanged is false by default; even with values the button should stay disabled
      // Directly set form values without triggering the valueChanges subscriptions
      component.filterForm.get('userGroup')?.setValue('GRP1', { emitEvent: false });
      component['formChanged'] = false;
      // hasAnyCompleteValue is true but formChanged is false
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDate has invalidDate error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has invalidDateFormat error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has invalidDate error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDatePeriod is set without effectiveDate', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDatePeriod is set without terminationDate', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDate is set without period (validation errors)', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      // effectiveDatePeriod will have required error from validation
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when effectiveDate and period are both set and form changed', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when terminationDate and period are both set and form changed', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when only userGroup is set and form changed', () => {
      component.filterForm.get('userGroup')?.setValue('GRP1');
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  // ── hasValidationErrors ────────────────────────────────────────────────────

  describe('hasValidationErrors', () => {
    beforeEach(() => setup(null));

    it('should return false when no period controls are invalid', () => {
      expect(component.hasValidationErrors).toBeFalse();
    });

    it('should return true when effectiveDatePeriod is invalid', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationDatePeriod is invalid', () => {
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });
      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when both period controls are invalid', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });
      expect(component.hasValidationErrors).toBeTrue();
    });
  });

  // ── onApply() ──────────────────────────────────────────────────────────────

  describe('onApply()', () => {
    beforeEach(() => setup(null));

    it('should not close dialog when isApplyDisabled is true', () => {
      component.onApply();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should close dialog with filter data when form is valid', () => {
      component.filterForm.patchValue({
        userGroup: 'GRP1',
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null,
      });
      component.onApply();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        jasmine.objectContaining({
          userGroup: 'GRP1',
          effectiveDate: effDate,
          effectiveDatePeriod: 'AFTER',
        }),
      );
    });

    it('should close dialog with only userGroup when dates are not set', () => {
      component.filterForm.get('userGroup')?.setValue('GRP2');
      component.onApply();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        jasmine.objectContaining({
          userGroup: 'GRP2',
        }),
      );
    });

    it('should pass Date objects through toLocalDate correctly', () => {
      component.filterForm.patchValue({
        effectiveDate: effDate,
        effectiveDatePeriod: 'BEFORE',
        terminationDate: termDate,
        terminationDatePeriod: 'AFTER',
      });
      component.onApply();
      const passedFilters = dialogRefSpy.close.calls.mostRecent().args[0] as EquipmentMasterCodeFilter;
      expect(passedFilters.effectiveDate).toEqual(effDate);
      expect(passedFilters.terminationDate).toEqual(termDate);
    });

    it('should set effectiveDate to undefined when value is falsy', () => {
      component.filterForm.get('userGroup')?.setValue('GRP1');
      component.onApply();
      const passedFilters = dialogRefSpy.close.calls.mostRecent().args[0] as EquipmentMasterCodeFilter;
      expect(passedFilters.effectiveDate).toBeUndefined();
      expect(passedFilters.terminationDate).toBeUndefined();
    });

    it('should pass both effective and termination dates through onApply', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('BEFORE');
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('terminationDatePeriod')?.setValue('AFTER');
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.onApply();
      const passedFilters = dialogRefSpy.close.calls.mostRecent().args[0] as EquipmentMasterCodeFilter;
      expect(passedFilters.effectiveDate).toEqual(effDate);
      expect(passedFilters.effectiveDatePeriod).toBe('BEFORE');
      expect(passedFilters.terminationDate).toEqual(termDate);
      expect(passedFilters.terminationDatePeriod).toBe('AFTER');
    });

    it('should set userGroup to undefined when value is falsy', () => {
      component.filterForm.patchValue({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
      });
      component.onApply();
      const passedFilters = dialogRefSpy.close.calls.mostRecent().args[0] as EquipmentMasterCodeFilter;
      expect(passedFilters.userGroup).toBeUndefined();
    });
  });

  // ── toLocalDate() ──────────────────────────────────────────────────────────

  describe('toLocalDate() via private access', () => {
    beforeEach(() => setup(null));

    it('should return the Date object directly', () => {
      expect((component as any).toLocalDate(effDate)).toEqual(effDate);
    });

    it('should call toDate() on moment-like objects', () => {
      const momentLike = { toDate: () => termDate };
      expect((component as any).toLocalDate(momentLike)).toEqual(termDate);
    });

    it('should return undefined for null', () => {
      expect((component as any).toLocalDate(null)).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect((component as any).toLocalDate(undefined)).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect((component as any).toLocalDate('')).toBeUndefined();
    });

    it('should return undefined for non-date non-moment objects', () => {
      expect((component as any).toLocalDate('not-a-date')).toBeUndefined();
    });

    it('should return undefined for plain object without toDate', () => {
      expect((component as any).toLocalDate({ foo: 'bar' })).toBeUndefined();
    });

    it('should return undefined for number', () => {
      expect((component as any).toLocalDate(12345)).toBeUndefined();
    });
  });

  // ── onClear() ──────────────────────────────────────────────────────────────

  describe('onClear()', () => {
    beforeEach(() =>
      setup({
        currentFilters: {
          userGroup: 'GRP1',
          effectiveDate: effDate,
          effectiveDatePeriod: 'AFTER',
          terminationDate: termDate,
          terminationDatePeriod: 'BEFORE',
        },
        userGroupOptions: mockUserGroupOptions,
      }),
    );

    it('should reset all form controls to null', () => {
      component.onClear();
      expect(component.filterForm.get('userGroup')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });

    it('should clear effectiveDatePeriodError', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);
      expect(component.effectiveDatePeriodError).toBe('Period is required');
      component.onClear();
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should clear terminationDatePeriodError', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.filterForm.get('terminationDatePeriod')?.setValue(null);
      expect(component.terminationDatePeriodError).toBe('Period is required');
      component.onClear();
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should clear raw input strings', () => {
      component['effectiveDateRawInput'] = 'some-input';
      component['terminationDateRawInput'] = 'another-input';
      component.onClear();
      expect(component['effectiveDateRawInput']).toBe('');
      expect(component['terminationDateRawInput']).toBe('');
    });

    it('should clear period control errors', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });
      component.onClear();
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });

    it('should reset userGroupSearchCtrl', () => {
      component.userGroupSearchCtrl.setValue('search term');
      component.onClear();
      expect(component.userGroupSearchCtrl.value).toBe('');
    });
  });

  // ── closeDialog() ──────────────────────────────────────────────────────────

  describe('closeDialog()', () => {
    beforeEach(() => setup(null));

    it('should call dialogRef.close() without arguments', () => {
      component.closeDialog();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  // ── onEffectiveDateInput() ─────────────────────────────────────────────────

  describe('onEffectiveDateInput()', () => {
    beforeEach(() => setup(null));

    it('should store raw input and set invalidDate error when control has no parsed value', () => {
      const input = document.createElement('input');
      input.value = 'invalid-date';
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component['effectiveDateRawInput']).toBe('invalid-date');
      const ctrl = component.filterForm.get('effectiveDate');
      expect(ctrl?.touched).toBeTrue();
      expect(ctrl?.dirty).toBeTrue();
      expect(ctrl?.hasError('invalidDate')).toBeTrue();
    });

    it('should store raw input but not set errors when input is empty', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component['effectiveDateRawInput']).toBe('');
      const ctrl = component.filterForm.get('effectiveDate');
      expect(ctrl?.hasError('invalidDate')).toBeFalse();
    });

    it('should not set invalidDate when control already has a parsed value', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      const input = document.createElement('input');
      input.value = '15-JAN-2026';
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component['effectiveDateRawInput']).toBe('15-JAN-2026');
      const ctrl = component.filterForm.get('effectiveDate');
      expect(ctrl?.hasError('invalidDate')).toBeFalse();
    });

    it('should store raw input but not mark touched or dirty for whitespace-only input', () => {
      const input = document.createElement('input');
      input.value = '   ';
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component['effectiveDateRawInput']).toBe('   ');
      const ctrl = component.filterForm.get('effectiveDate');
      // '   '.trim() is '' which is falsy, so the if block does not execute
      expect(ctrl?.touched).toBeFalse();
      expect(ctrl?.dirty).toBeFalse();
    });
  });

  // ── onEffectiveDateBlur() ──────────────────────────────────────────────────

  describe('onEffectiveDateBlur()', () => {
    beforeEach(() => setup(null));

    it('should restore raw input on blur when control has no value and input is empty', fakeAsync(() => {
      component['effectiveDateRawInput'] = 'some-raw-input';
      const input = document.createElement('input');
      input.value = '';
      component.onEffectiveDateBlur(input);
      tick(1);
      expect(input.value).toBe('some-raw-input');
    }));

    it('should not restore raw input when control has a value', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component['effectiveDateRawInput'] = 'some-raw-input';
      const input = document.createElement('input');
      input.value = '';
      component.onEffectiveDateBlur(input);
      tick(1);
      expect(input.value).toBe('');
    }));

    it('should not restore when effectiveDateRawInput is empty', fakeAsync(() => {
      component['effectiveDateRawInput'] = '';
      const input = document.createElement('input');
      input.value = '';
      component.onEffectiveDateBlur(input);
      tick(1);
      expect(input.value).toBe('');
    }));

    it('should not restore when input still has a value', fakeAsync(() => {
      component['effectiveDateRawInput'] = 'raw';
      const input = document.createElement('input');
      input.value = 'existing';
      component.onEffectiveDateBlur(input);
      tick(1);
      expect(input.value).toBe('existing');
    }));
  });

  // ── onTerminationDateInput() ───────────────────────────────────────────────

  describe('onTerminationDateInput()', () => {
    beforeEach(() => setup(null));

    it('should store raw input and set invalidDate error when control has no parsed value', () => {
      const input = document.createElement('input');
      input.value = 'bad-date';
      const event = { target: input } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component['terminationDateRawInput']).toBe('bad-date');
      const ctrl = component.filterForm.get('terminationDate');
      expect(ctrl?.touched).toBeTrue();
      expect(ctrl?.dirty).toBeTrue();
      expect(ctrl?.hasError('invalidDate')).toBeTrue();
    });

    it('should store raw input but not set errors when input is empty', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component['terminationDateRawInput']).toBe('');
      const ctrl = component.filterForm.get('terminationDate');
      expect(ctrl?.hasError('invalidDate')).toBeFalse();
    });

    it('should not set invalidDate when control already has a parsed value', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      const input = document.createElement('input');
      input.value = '30-JUN-2026';
      const event = { target: input } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component['terminationDateRawInput']).toBe('30-JUN-2026');
      const ctrl = component.filterForm.get('terminationDate');
      expect(ctrl?.hasError('invalidDate')).toBeFalse();
    });
  });

  // ── onTerminationDateBlur() ────────────────────────────────────────────────

  describe('onTerminationDateBlur()', () => {
    beforeEach(() => setup(null));

    it('should restore raw input on blur when control has no value and input is empty', fakeAsync(() => {
      component['terminationDateRawInput'] = 'raw-term-input';
      const input = document.createElement('input');
      input.value = '';
      component.onTerminationDateBlur(input);
      tick(1);
      expect(input.value).toBe('raw-term-input');
    }));

    it('should not restore raw input when control has a value', fakeAsync(() => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component['terminationDateRawInput'] = 'raw';
      const input = document.createElement('input');
      input.value = '';
      component.onTerminationDateBlur(input);
      tick(1);
      expect(input.value).toBe('');
    }));

    it('should not restore when terminationDateRawInput is empty', fakeAsync(() => {
      component['terminationDateRawInput'] = '';
      const input = document.createElement('input');
      input.value = '';
      component.onTerminationDateBlur(input);
      tick(1);
      expect(input.value).toBe('');
    }));

    it('should not restore when input still has a value', fakeAsync(() => {
      component['terminationDateRawInput'] = 'raw';
      const input = document.createElement('input');
      input.value = 'existing';
      component.onTerminationDateBlur(input);
      tick(1);
      expect(input.value).toBe('existing');
    }));
  });

  // ── Validation runs on init with currentFilters ────────────────────────────

  describe('validation on init with incomplete currentFilters', () => {
    it('should set effectiveDatePeriodError when currentFilters has date but no period', () => {
      setup({
        currentFilters: {
          effectiveDate: effDate,
          // effectiveDatePeriod intentionally missing
        },
        userGroupOptions: [],
      });
      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should set terminationDatePeriodError when currentFilters has date but no period', () => {
      setup({
        currentFilters: {
          terminationDate: termDate,
          // terminationDatePeriod intentionally missing
        },
        userGroupOptions: [],
      });
      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should not set errors when currentFilters has complete date pairs', () => {
      setup({
        currentFilters: {
          effectiveDate: effDate,
          effectiveDatePeriod: 'BEFORE',
          terminationDate: termDate,
          terminationDatePeriod: 'AFTER',
        },
        userGroupOptions: [],
      });
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });
});
