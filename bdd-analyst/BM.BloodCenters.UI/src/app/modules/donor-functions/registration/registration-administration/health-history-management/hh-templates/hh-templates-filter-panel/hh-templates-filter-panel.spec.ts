import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { HHTemplatesFilterPanel } from './hh-templates-filter-panel';
import { HHTemplateFilterValue, DropdownOption } from '../../models/health-history.model';

describe('HHTemplatesFilterPanel', () => {
  let component: HHTemplatesFilterPanel;
  let fixture: ComponentFixture<HHTemplatesFilterPanel>;

  const mockDonationTypes: DropdownOption[] = [
    { code: 'AL', description: 'Allogeneic' },
    { code: 'AU', description: 'Autologous' },
    { code: 'DI', description: 'Directed' },
  ];

  function createComponent(
    currentFilters: HHTemplateFilterValue | null = null,
    donationTypes: DropdownOption[] = mockDonationTypes
  ): void {
    fixture = TestBed.createComponent(HHTemplatesFilterPanel);
    component = fixture.componentInstance;
    component.currentFilters = currentFilters;
    component.donationTypes = donationTypes;
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HHTemplatesFilterPanel,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Initialization
  // ─────────────────────────────────────────────────────────────
  describe('Initialization', () => {
    it('should create the component', () => {
      createComponent();
      expect(component).toBeTruthy();
    });

    it('should create the filter form with all controls', () => {
      createComponent();
      expect(component.filterForm).toBeTruthy();
      expect(component.filterForm.get('status')).toBeTruthy();
      expect(component.filterForm.get('donationType')).toBeTruthy();
      expect(component.filterForm.get('effectiveDatePeriod')).toBeTruthy();
      expect(component.filterForm.get('effectiveDate')).toBeTruthy();
      expect(component.filterForm.get('terminationDatePeriod')).toBeTruthy();
      expect(component.filterForm.get('terminationDate')).toBeTruthy();
    });

    it('should initialize form with null values when no currentFilters', () => {
      createComponent();
      expect(component.filterForm.get('status')?.value).toBeNull();
      expect(component.filterForm.get('donationType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should initialize filteredDonationTypes from donationTypes input', () => {
      createComponent();
      expect(component.filteredDonationTypes).toEqual(mockDonationTypes);
    });

    it('should initialize effDatePeriodRequired and termDatePeriodRequired as false', () => {
      createComponent();
      expect(component.effDatePeriodRequired).toBe(false);
      expect(component.termDatePeriodRequired).toBe(false);
    });

    it('should initialize donationTypeSearchControl with empty string', () => {
      createComponent();
      expect(component.donationTypeSearchControl.value).toBe('');
    });

    it('should handle empty donationTypes array', () => {
      createComponent(null, []);
      expect(component.filteredDonationTypes).toEqual([]);
    });

    it('should have effDateErrorMatcher and termDateErrorMatcher defined', () => {
      createComponent();
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 1b. Initialization with currentFilters
  // ─────────────────────────────────────────────────────────────
  describe('Initialization with currentFilters', () => {
    it('should restore status and donationType from currentFilters', () => {
      createComponent({ status: 'Active', donationType: 'AL' });
      expect(component.filterForm.get('status')?.value).toBe('Active');
      expect(component.filterForm.get('donationType')?.value).toBe('AL');
    });

    it('should restore dates as moment objects from currentFilters', () => {
      const filters: HHTemplateFilterValue = {
        effectiveDate: '2026-01-15',
        effectiveDatePeriod: 'After',
        terminationDate: '2026-12-31',
        terminationDatePeriod: 'Before',
      };
      createComponent(filters);

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
      expect(moment.isMoment(component.filterForm.get('effectiveDate')?.value)).toBe(true);
      expect(moment.isMoment(component.filterForm.get('terminationDate')?.value)).toBe(true);
    });

    it('should handle currentFilters with only some fields set', () => {
      createComponent({ status: 'Inactive' });
      expect(component.filterForm.get('status')?.value).toBe('Inactive');
      expect(component.filterForm.get('donationType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should handle currentFilters with empty object', () => {
      createComponent({});
      expect(component.filterForm.get('status')?.value).toBeNull();
      expect(component.filterForm.get('donationType')?.value).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. ngOnDestroy
  // ─────────────────────────────────────────────────────────────
  describe('ngOnDestroy', () => {
    it('should call next and complete on destroy$', () => {
      createComponent();
      const destroy$ = (component as any).destroy$;
      const nextSpy = jest.spyOn(destroy$, 'next');
      const completeSpy = jest.spyOn(destroy$, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should stop donationTypeSearchControl subscription after destroy', () => {
      createComponent();
      component.ngOnDestroy();

      // After destroy, changing the search control should NOT update filteredDonationTypes
      component.filteredDonationTypes = [...mockDonationTypes];
      component.donationTypeSearchControl.setValue('ZZZZZ');

      // filteredDonationTypes should remain unchanged because subscription was torn down
      expect(component.filteredDonationTypes).toEqual(mockDonationTypes);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. filterDonationTypesList
  // ─────────────────────────────────────────────────────────────
  describe('filterDonationTypesList', () => {
    beforeEach(() => createComponent());

    it('should show all donation types when search is empty string', () => {
      (component as any).filterDonationTypesList('');
      expect(component.filteredDonationTypes).toEqual(mockDonationTypes);
    });

    it('should filter by code (case-insensitive)', () => {
      (component as any).filterDonationTypesList('al');
      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].code).toBe('AL');
    });

    it('should filter by description (case-insensitive)', () => {
      (component as any).filterDonationTypesList('auto');
      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].code).toBe('AU');
    });

    it('should return empty array when no matches', () => {
      (component as any).filterDonationTypesList('ZZZZZ');
      expect(component.filteredDonationTypes.length).toBe(0);
    });

    it('should return multiple matches when search matches several items', () => {
      // 'l' matches 'AL' (code) and 'Allogeneic'/'Autologous' (description contains 'l')
      (component as any).filterDonationTypesList('l');
      expect(component.filteredDonationTypes.length).toBeGreaterThan(1);
    });

    it('should restore all donation types when search is cleared to empty', () => {
      (component as any).filterDonationTypesList('DI');
      expect(component.filteredDonationTypes.length).toBe(1);

      (component as any).filterDonationTypesList('');
      expect(component.filteredDonationTypes).toEqual(mockDonationTypes);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. onSelectOpenedChange
  // ─────────────────────────────────────────────────────────────
  describe('onSelectOpenedChange', () => {
    beforeEach(() => createComponent());

    it('should reset search control when dropdown is closed', () => {
      component.donationTypeSearchControl.setValue('test');
      component.onSelectOpenedChange(false);
      expect(component.donationTypeSearchControl.value).toBe('');
    });

    it('should not reset search control when dropdown is opened', () => {
      component.donationTypeSearchControl.setValue('test');
      component.onSelectOpenedChange(true);
      expect(component.donationTypeSearchControl.value).toBe('test');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. validateEffDatePeriod / validateTermDatePeriod
  // ─────────────────────────────────────────────────────────────
  describe('validateEffDatePeriod', () => {
    beforeEach(() => createComponent());

    it('should set effDatePeriodRequired true when date is set but period is not', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-01-15'));
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);
      component.validateEffDatePeriod();
      expect(component.effDatePeriodRequired).toBe(true);
    });

    it('should set effDatePeriodRequired false when both date and period are set', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-01-15'));
      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      component.validateEffDatePeriod();
      expect(component.effDatePeriodRequired).toBe(false);
    });

    it('should set effDatePeriodRequired false when date is not set', () => {
      component.filterForm.get('effectiveDate')?.setValue(null);
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);
      component.validateEffDatePeriod();
      expect(component.effDatePeriodRequired).toBe(false);
    });

    it('should set effDatePeriodRequired false when date is null and period is set', () => {
      component.filterForm.get('effectiveDate')?.setValue(null);
      component.filterForm.get('effectiveDatePeriod')?.setValue('Before');
      component.validateEffDatePeriod();
      expect(component.effDatePeriodRequired).toBe(false);
    });
  });

  describe('validateTermDatePeriod', () => {
    beforeEach(() => createComponent());

    it('should set termDatePeriodRequired true when date is set but period is not', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2026-12-31'));
      component.filterForm.get('terminationDatePeriod')?.setValue(null);
      component.validateTermDatePeriod();
      expect(component.termDatePeriodRequired).toBe(true);
    });

    it('should set termDatePeriodRequired false when both date and period are set', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2026-12-31'));
      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      component.validateTermDatePeriod();
      expect(component.termDatePeriodRequired).toBe(false);
    });

    it('should set termDatePeriodRequired false when date is not set', () => {
      component.filterForm.get('terminationDate')?.setValue(null);
      component.validateTermDatePeriod();
      expect(component.termDatePeriodRequired).toBe(false);
    });

    it('should set termDatePeriodRequired false when date is null and period is set', () => {
      component.filterForm.get('terminationDate')?.setValue(null);
      component.filterForm.get('terminationDatePeriod')?.setValue('After');
      component.validateTermDatePeriod();
      expect(component.termDatePeriodRequired).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. isApplyDisabled
  // ─────────────────────────────────────────────────────────────
  describe('isApplyDisabled', () => {
    beforeEach(() => createComponent());

    it('should return true when no filters are set', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when status is set', () => {
      component.filterForm.get('status')?.setValue('Active');
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when donationType is set', () => {
      component.filterForm.get('donationType')?.setValue('AL');
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when effectiveDate is set with period', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-01-15'));
      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when terminationDate is set with period', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2026-12-31'));
      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return true when effDatePeriodRequired is true', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-01-15'));
      component.effDatePeriodRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when termDatePeriodRequired is true', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2026-12-31'));
      component.termDatePeriodRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effective date has validation error', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue('invalid');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when termination date has validation error', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setValue('bad-date');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when both period required flags are true', () => {
      component.effDatePeriodRequired = true;
      component.termDatePeriodRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. getEffDateError / getTermDateError
  // ─────────────────────────────────────────────────────────────
  describe('getEffDateError', () => {
    beforeEach(() => createComponent());

    it('should return empty string when control is untouched and pristine', () => {
      expect(component.getEffDateError()).toBe('');
    });

    it('should return error message when touched with invalidDate error', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getEffDateError()).toBe('Effective Date is invalid');
    });

    it('should return error message when dirty with invalidDateFormat error', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsDirty();
      expect(component.getEffDateError()).toBe('Effective Date is invalid');
    });

    it('should return error message when touched with matDatepickerParse error', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getEffDateError()).toBe('Effective Date is invalid');
    });

    it('should return empty string when touched but valid', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(moment('2026-01-15'));
      control?.markAsTouched();
      expect(component.getEffDateError()).toBe('');
    });

    it('should return empty string when control has errors but is not touched or dirty', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      // control is neither touched nor dirty
      expect(component.getEffDateError()).toBe('');
    });
  });

  describe('getTermDateError', () => {
    beforeEach(() => createComponent());

    it('should return empty string when control is untouched and pristine', () => {
      expect(component.getTermDateError()).toBe('');
    });

    it('should return error message when touched with invalidDate error', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getTermDateError()).toBe('Termination Date is invalid');
    });

    it('should return error message when dirty with invalidDateFormat error', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsDirty();
      expect(component.getTermDateError()).toBe('Termination Date is invalid');
    });

    it('should return error message when touched with matDatepickerParse error', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getTermDateError()).toBe('Termination Date is invalid');
    });

    it('should return empty string when touched but valid', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setValue(moment('2026-12-31'));
      control?.markAsTouched();
      expect(component.getTermDateError()).toBe('');
    });

    it('should return empty string when control has errors but is not touched or dirty', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      expect(component.getTermDateError()).toBe('');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. onEffDateInput / onTermDateInput
  // ─────────────────────────────────────────────────────────────
  describe('onEffDateInput', () => {
    beforeEach(() => createComponent());

    it('should clear control state when input is empty string', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setValue(moment('2026-01-15'));
      control.markAsTouched();
      control.markAsDirty();

      const event = { target: { value: '' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(control.value).toBeNull();
      expect(control.errors).toBeNull();
      expect(control.pristine).toBe(true);
      expect(control.untouched).toBe(true);
    });

    it('should clear control state when input is whitespace only', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setValue(moment('2026-01-15'));
      control.setErrors({ invalidDate: true });
      control.markAsTouched();

      const event = { target: { value: '   ' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(control.value).toBeNull();
      expect(control.errors).toBeNull();
    });

    it('should mark dirty and touched on non-empty input when control has value', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setValue(moment('2026-01-15'));

      const event = { target: { value: '15-JAN-2026' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(control.touched).toBe(true);
      expect(control.dirty).toBe(true);
    });

    it('should set invalidDate error on non-empty input when control has no value', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setValue(null);

      const event = { target: { value: 'invalid' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(control.touched).toBe(true);
      expect(control.dirty).toBe(true);
      expect(control.hasError('invalidDate')).toBe(true);
    });

    it('should not set invalidDate error when control has a valid value', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setValue(moment('2026-03-15'));

      const event = { target: { value: '15-MAR-2026' } } as unknown as Event;
      component.onEffDateInput(event);

      expect(control.hasError('invalidDate')).toBe(false);
    });

    it('should do nothing if effectiveDate control does not exist', () => {
      component.filterForm.removeControl('effectiveDate');
      const event = { target: { value: 'anything' } } as unknown as Event;
      expect(() => component.onEffDateInput(event)).not.toThrow();
    });
  });

  describe('onTermDateInput', () => {
    beforeEach(() => createComponent());

    it('should clear control state when input is empty string', () => {
      const control = component.filterForm.get('terminationDate')!;
      control.setValue(moment('2026-12-31'));
      control.markAsTouched();
      control.markAsDirty();

      const event = { target: { value: '' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(control.value).toBeNull();
      expect(control.errors).toBeNull();
      expect(control.pristine).toBe(true);
      expect(control.untouched).toBe(true);
    });

    it('should clear control state when input is whitespace only', () => {
      const control = component.filterForm.get('terminationDate')!;
      control.setValue(moment('2026-12-31'));

      const event = { target: { value: '   ' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(control.value).toBeNull();
      expect(control.errors).toBeNull();
    });

    it('should mark dirty and touched on non-empty input when control has value', () => {
      const control = component.filterForm.get('terminationDate')!;
      control.setValue(moment('2026-12-31'));

      const event = { target: { value: '31-DEC-2026' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(control.touched).toBe(true);
      expect(control.dirty).toBe(true);
    });

    it('should set invalidDate error on non-empty input when control has no value', () => {
      const control = component.filterForm.get('terminationDate')!;
      control.setValue(null);

      const event = { target: { value: 'bad-date' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(control.touched).toBe(true);
      expect(control.dirty).toBe(true);
      expect(control.hasError('invalidDate')).toBe(true);
    });

    it('should not set invalidDate error when control has a valid value', () => {
      const control = component.filterForm.get('terminationDate')!;
      control.setValue(moment('2026-12-31'));

      const event = { target: { value: '31-DEC-2026' } } as unknown as Event;
      component.onTermDateInput(event);

      expect(control.hasError('invalidDate')).toBe(false);
    });

    it('should do nothing if terminationDate control does not exist', () => {
      component.filterForm.removeControl('terminationDate');
      const event = { target: { value: 'anything' } } as unknown as Event;
      expect(() => component.onTermDateInput(event)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 9. onApply
  // ─────────────────────────────────────────────────────────────
  describe('onApply', () => {
    beforeEach(() => createComponent());

    it('should emit filters with status only', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ status: 'Active' });

      component.onApply();

      expect(applySpy).toHaveBeenCalledWith({ status: 'Active' });
    });

    it('should emit filters with donationType only', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ donationType: 'AL' });

      component.onApply();

      expect(applySpy).toHaveBeenCalledWith({ donationType: 'AL' });
    });

    it('should emit effectiveDate formatted as YYYY-MM-DD with effectiveDatePeriod', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2026-06-15'),
      });

      component.onApply();

      const emitted = applySpy.mock.calls[0][0] as HHTemplateFilterValue;
      expect(emitted.effectiveDatePeriod).toBe('After');
      expect(emitted.effectiveDate).toBe('2026-06-15');
    });

    it('should emit terminationDate formatted as YYYY-MM-DD with terminationDatePeriod', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        terminationDatePeriod: 'Before',
        terminationDate: moment('2026-12-31'),
      });

      component.onApply();

      const emitted = applySpy.mock.calls[0][0] as HHTemplateFilterValue;
      expect(emitted.terminationDatePeriod).toBe('Before');
      expect(emitted.terminationDate).toBe('2026-12-31');
    });

    it('should emit all filters when all fields are set', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        status: 'Inactive',
        donationType: 'AU',
        effectiveDatePeriod: 'Before',
        effectiveDate: moment('2026-03-01'),
        terminationDatePeriod: 'After',
        terminationDate: moment('2026-09-30'),
      });

      component.onApply();

      expect(applySpy).toHaveBeenCalledWith({
        status: 'Inactive',
        donationType: 'AU',
        effectiveDatePeriod: 'Before',
        effectiveDate: '2026-03-01',
        terminationDatePeriod: 'After',
        terminationDate: '2026-09-30',
      });
    });

    it('should emit empty object when no filters are set', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.onApply();
      expect(applySpy).toHaveBeenCalledWith({});
    });

    it('should not include effectiveDatePeriod when effectiveDate is null', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        status: 'Active',
      });

      component.onApply();

      const emitted = applySpy.mock.calls[0][0] as HHTemplateFilterValue;
      expect(emitted.effectiveDatePeriod).toBeUndefined();
      expect(emitted.effectiveDate).toBeUndefined();
      expect(emitted.status).toBe('Active');
    });

    it('should not include terminationDatePeriod when terminationDate is null', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        terminationDatePeriod: 'Before',
        terminationDate: null,
        donationType: 'DI',
      });

      component.onApply();

      const emitted = applySpy.mock.calls[0][0] as HHTemplateFilterValue;
      expect(emitted.terminationDatePeriod).toBeUndefined();
      expect(emitted.terminationDate).toBeUndefined();
      expect(emitted.donationType).toBe('DI');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 10. onClear
  // ─────────────────────────────────────────────────────────────
  describe('onClear', () => {
    beforeEach(() => createComponent());

    it('should reset all form controls to null', () => {
      component.filterForm.patchValue({
        status: 'Active',
        donationType: 'AL',
        effectiveDate: moment('2026-01-15'),
        effectiveDatePeriod: 'After',
        terminationDate: moment('2026-12-31'),
        terminationDatePeriod: 'Before',
      });

      component.onClear();

      expect(component.filterForm.get('status')?.value).toBeNull();
      expect(component.filterForm.get('donationType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });

    it('should reset effDatePeriodRequired to false', () => {
      component.effDatePeriodRequired = true;
      component.onClear();
      expect(component.effDatePeriodRequired).toBe(false);
    });

    it('should reset termDatePeriodRequired to false', () => {
      component.termDatePeriodRequired = true;
      component.onClear();
      expect(component.termDatePeriodRequired).toBe(false);
    });

    it('should reset both period flags when both are true', () => {
      component.effDatePeriodRequired = true;
      component.termDatePeriodRequired = true;

      component.onClear();

      expect(component.effDatePeriodRequired).toBe(false);
      expect(component.termDatePeriodRequired).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 11. onClose
  // ─────────────────────────────────────────────────────────────
  describe('onClose', () => {
    it('should emit close event', () => {
      createComponent();
      const closeSpy = jest.spyOn(component.close, 'emit');

      component.onClose();

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 12. Error State Matchers
  // ─────────────────────────────────────────────────────────────
  describe('Error State Matchers', () => {
    beforeEach(() => createComponent());

    it('effDateErrorMatcher should report error state when date is invalid and touched', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.markAsTouched();
      control.setErrors({ invalidDate: true });

      const result = component.effDateErrorMatcher.isErrorState(control, null);
      expect(result).toBe(true);
    });

    it('effDateErrorMatcher should not report error state when untouched', () => {
      const control = component.filterForm.get('effectiveDate')!;
      const result = component.effDateErrorMatcher.isErrorState(control, null);
      expect(result).toBe(false);
    });

    it('termDateErrorMatcher should report error state when date is invalid and touched', () => {
      const control = component.filterForm.get('terminationDate')!;
      control.markAsTouched();
      control.setErrors({ matDatepickerParse: true });

      const result = component.termDateErrorMatcher.isErrorState(control, null);
      expect(result).toBe(true);
    });

    it('termDateErrorMatcher should not report error state when untouched', () => {
      const control = component.filterForm.get('terminationDate')!;
      const result = component.termDateErrorMatcher.isErrorState(control, null);
      expect(result).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 13. Date period validation integration (via form valueChanges)
  // ─────────────────────────────────────────────────────────────
  describe('Date period validation via form changes', () => {
    beforeEach(() => createComponent());

    it('should auto-set effDatePeriodRequired when effectiveDate changes without period', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-05-01'));
      expect(component.effDatePeriodRequired).toBe(true);
    });

    it('should clear effDatePeriodRequired when effectiveDatePeriod is set', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-05-01'));
      expect(component.effDatePeriodRequired).toBe(true);

      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      expect(component.effDatePeriodRequired).toBe(false);
    });

    it('should auto-set termDatePeriodRequired when terminationDate changes without period', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2026-11-01'));
      expect(component.termDatePeriodRequired).toBe(true);
    });

    it('should clear termDatePeriodRequired when terminationDatePeriod is set', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2026-11-01'));
      expect(component.termDatePeriodRequired).toBe(true);

      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      expect(component.termDatePeriodRequired).toBe(false);
    });

    it('should clear effDatePeriodRequired when effectiveDate is cleared', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-05-01'));
      expect(component.effDatePeriodRequired).toBe(true);

      component.filterForm.get('effectiveDate')?.setValue(null);
      expect(component.effDatePeriodRequired).toBe(false);
    });

    it('should clear termDatePeriodRequired when terminationDate is cleared', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2026-11-01'));
      expect(component.termDatePeriodRequired).toBe(true);

      component.filterForm.get('terminationDate')?.setValue(null);
      expect(component.termDatePeriodRequired).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 14. Donation type search via valueChanges
  // ─────────────────────────────────────────────────────────────
  describe('donationType search via valueChanges', () => {
    beforeEach(() => createComponent());

    it('should filter donation types when search control value changes', () => {
      component.donationTypeSearchControl.setValue('Allo');
      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].code).toBe('AL');
    });

    it('should reset to all when search control is cleared', () => {
      component.donationTypeSearchControl.setValue('Allo');
      component.donationTypeSearchControl.setValue('');
      expect(component.filteredDonationTypes.length).toBe(3);
    });

    it('should handle null search control value', () => {
      component.donationTypeSearchControl.setValue(null);
      expect(component.filteredDonationTypes).toEqual(mockDonationTypes);
    });
  });
});
