import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import moment from 'moment';

import { InterdictionPlacementFilterComponent } from './interdiction-placement-filter.component';
import { ProductCodeLookup, ActionCodeLookup } from '../configure-interdiction-placement.model';

describe('InterdictionPlacementFilterComponent', () => {
  let component: InterdictionPlacementFilterComponent;
  let fixture: ComponentFixture<InterdictionPlacementFilterComponent>;

  const mockProductCodes: ProductCodeLookup[] = [
    { productCode: 'E0009', productDesc: 'Product 9' },
    { productCode: 'FFP', productDesc: 'Fresh Frozen Plasma' },
    { productCode: 'CRYO', productDesc: 'Cryoprecipitate' },
  ];

  const mockActionCodes: ActionCodeLookup[] = [
    { code: 'R01', codeDesc: 'Reject Code 1' },
    { code: 'R02', codeDesc: 'Reject Code 2' },
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [InterdictionPlacementFilterComponent, NoopAnimationsModule, ReactiveFormsModule],
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(InterdictionPlacementFilterComponent);
    component = fixture.componentInstance;
    component.otherProductCodes = mockProductCodes;
    component.actionCodes = mockActionCodes;


    });

  describe('Form initialization', () => {
    it('should initialize with current filters', () => {
      component.currentFilters = {
        currentProduct: 'E0009',
        rejectCode: 'R01',
        effectivePeriod: 'After',
        effectiveDate: '2025-01-01',
      };
      component.ngOnInit();

      expect(component.filterForm.get('currentProduct')?.value).toBe('E0009');
      expect(component.filterForm.get('rejectCode')?.value).toBe('R01');
      expect(component.filterForm.get('effectivePeriod')?.value).toBe('After');
    });

    it('should initialize with empty values when no filters provided', () => {
      component.currentFilters = null;
      component.ngOnInit();

      expect(component.filterForm.get('currentProduct')?.value).toBe('');
      expect(component.filterForm.get('otherProduct')?.value).toBe('');
      expect(component.filterForm.get('rejectCode')?.value).toBe('');
    });
  });

  describe('Searchable dropdowns', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should have Yes/No options for current product', () => {
      expect(component.currentProductOptions.length).toBe(2);
      expect(component.currentProductOptions[0].value).toBe('Y');
      expect(component.currentProductOptions[1].value).toBe('N');
    });



    it('should return all other products when search is empty', fakeAsync(() => {
      component.otherProductSearchCtrl.setValue('');
      tick();

      const filtered = component.filteredOtherProducts();
      expect(filtered.length).toBe(3);
    }));
  });

  describe('Effective Date validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should show error for invalid effective date', fakeAsync(() => {
      const dateControl = component.filterForm.get('effectiveDate');
      dateControl?.setValue('invalid');
      dateControl?.markAsTouched();
      tick();

      expect(component.getEffectiveDateError()).toBeTruthy();
    }));

    it('should not show error for valid effective date', fakeAsync(() => {
      const dateControl = component.filterForm.get('effectiveDate');
      dateControl?.setValue(moment());
      dateControl?.markAsTouched();
      tick();

      expect(component.getEffectiveDateError()).toBe('');
    }));
  });

  describe('Termination Date validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should show error for invalid termination date', fakeAsync(() => {
      const dateControl = component.filterForm.get('terminationDate');
      dateControl?.setValue('invalid');
      dateControl?.markAsTouched();
      tick();

      expect(component.getTerminationDateError()).toBeTruthy();
    }));

    it('should not show error for valid termination date', fakeAsync(() => {
      const dateControl = component.filterForm.get('terminationDate');
      dateControl?.setValue(moment());
      dateControl?.markAsTouched();
      tick();

      expect(component.getTerminationDateError()).toBe('');
    }));
  });

  describe('Period required validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should require period when valid effective date is entered', fakeAsync(() => {
      const dateControl = component.filterForm.get('effectiveDate');
      dateControl?.setValue(moment());
      tick();

      expect(component.effectivePeriodRequired).toBe(true);
    }));

    it('should not require period when effective date is empty', fakeAsync(() => {
      const dateControl = component.filterForm.get('effectiveDate');
      dateControl?.setValue(null);
      tick();

      expect(component.effectivePeriodRequired).toBe(false);
    }));

    it('should not require period when period is selected', fakeAsync(() => {
      const dateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectivePeriod');

      dateControl?.setValue(moment());
      periodControl?.setValue('After');
      tick();

      expect(component.effectivePeriodRequired).toBe(false);
    }));

    it('should require termination period when valid termination date is entered', fakeAsync(() => {
      const dateControl = component.filterForm.get('terminationDate');
      dateControl?.setValue(moment());
      tick();

      expect(component.terminationPeriodRequired).toBe(true);
    }));
  });


  describe('Clear All', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should reset form on clear all', fakeAsync(() => {
      component.filterForm.patchValue({
        currentProduct: 'E0009',
        rejectCode: 'R01',
        effectiveDate: moment(),
        effectivePeriod: 'After',
      });

      component['onClearAll']();
      tick();

      expect(component.filterForm.get('currentProduct')?.value).toBe('');
      expect(component.filterForm.get('rejectCode')?.value).toBe('');
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
    }));



    it('should reset period required flags on clear all', fakeAsync(() => {
      const dateControl = component.filterForm.get('effectiveDate');
      dateControl?.setValue(moment());
      tick();
      expect(component.effectivePeriodRequired).toBe(true);

      component['onClearAll']();
      tick();

      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
    }));
  });
  describe('hasChanges tracking', () => {
    beforeEach(() => {
      component.currentFilters = {
        currentProduct: 'E0009',
        rejectCode: 'R01',
      };
      component.ngOnInit();
    });

    it('should return false when form matches applied snapshot', fakeAsync(() => {
      tick();
      expect(component.hasChanges).toBe(false);
    }));

    it('should return true when user changes a value', fakeAsync(() => {
      component.filterForm.patchValue({
        currentProduct: 'FFP',
      });
      tick();

      expect(component.hasChanges).toBe(true);
    }));

    it('should return true when user adds a filter', fakeAsync(() => {
      component.filterForm.patchValue({
        otherProduct: 'CRYO',
      });
      tick();

      expect(component.hasChanges).toBe(true);
    }));

    it('should return true when user removes a filter', fakeAsync(() => {
      component.filterForm.patchValue({
        currentProduct: '',
      });
      tick();

      expect(component.hasChanges).toBe(true);
    }));
  });

  describe('serializeFormValue', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should normalize dates to YYYY-MM-DD format', fakeAsync(() => {
      component.filterForm.patchValue({
        effectiveDate: moment('2025-01-15'),
      });
      tick();

      const serialized = component['serializeFormValue']();
      const parsed = JSON.parse(serialized);
      expect(parsed.effectiveDate).toBe('2025-01-15');
    }));

    it('should convert empty strings to empty strings in serialization', fakeAsync(() => {
      component.filterForm.patchValue({
        currentProduct: '',
        otherProduct: '',
      });
      tick();

      const serialized = component['serializeFormValue']();
      const parsed = JSON.parse(serialized);
      expect(parsed.currentProduct).toBe('');
      expect(parsed.otherProduct).toBe('');
    }));

    it('should handle null values correctly', fakeAsync(() => {
      component.filterForm.patchValue({
        effectivePeriod: null,
        effectiveDate: null,
      });
      tick();

      const serialized = component['serializeFormValue']();
      const parsed = JSON.parse(serialized);
      expect(parsed.effectivePeriod).toBeNull();
      expect(parsed.effectiveDate).toBeNull();
    }));
  });


  describe('Date input handlers', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should mark effective date control as touched on input', () => {
      const control = component.filterForm.get('effectiveDate');
      const event = { target: { value: '01-JAN-2025' } } as any;

      component.onEffectiveDateInput(event);

      expect(control?.touched).toBe(true);
    });

    it('should mark termination date control as touched on input', () => {
      const control = component.filterForm.get('terminationDate');
      const event = { target: { value: '31-DEC-2025' } } as any;

      component.onTerminationDateInput(event);

      expect(control?.touched).toBe(true);
    });
  });

  describe('onApply', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should emit filters when form is valid and period not required', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        currentProduct: 'Y',
        rejectCode: 'R01',
        effectiveDate: moment('2025-03-15'),
        effectivePeriod: 'After',
      });
      tick();

      component['onApply']();
      tick();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        currentProduct: 'Y',
        rejectCode: 'R01',
        effectivePeriod: 'After',
      }));
    }));

    it('should NOT emit when effectivePeriodRequired is true', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDate: moment('2025-03-15'),
        effectivePeriod: null,
      });
      tick();

      component['onApply']();
      tick();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));

    it('should NOT emit when terminationPeriodRequired is true', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        terminationDate: moment('2025-12-31'),
        terminationPeriod: null,
      });
      tick();

      component['onApply']();
      tick();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));

    it('should reset search controls on apply', fakeAsync(() => {
      component.otherProductSearchCtrl.setValue('test');
      component.rejectCodeSearchCtrl.setValue('test');
      component.filterForm.patchValue({ currentProduct: 'Y' });
      tick();

      component['onApply']();
      tick();

      expect(component.otherProductSearchCtrl.value).toBe('');
      expect(component.rejectCodeSearchCtrl.value).toBe('');
    }));

    it('should update appliedFilterSnapshot so hasChanges becomes false', fakeAsync(() => {
      component.filterForm.patchValue({ currentProduct: 'Y' });
      tick();
      expect(component.hasChanges).toBe(true);

      component['onApply']();
      tick();

      expect(component.hasChanges).toBe(false);
    }));

    it('should NOT emit when form is invalid', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      const ctrl = component.filterForm.get('effectiveDate');
      ctrl?.setValue('invalid');
      ctrl?.setErrors({ invalidDateFormat: true });
      tick();

      component['onApply']();
      tick();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));
  });

  describe('onClose', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      component['onClose']();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return true when form is invalid', fakeAsync(() => {
      const ctrl = component.filterForm.get('effectiveDate');
      ctrl?.setErrors({ invalidDateFormat: true });
      tick();
      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should return true when effective date has error', fakeAsync(() => {
      const ctrl = component.filterForm.get('effectiveDate');
      ctrl?.setValue('bad');
      ctrl?.setErrors({ matDatepickerParse: true });
      ctrl?.markAsTouched();
      tick();
      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should return true when effectivePeriodRequired', fakeAsync(() => {
      component.filterForm.patchValue({
        effectiveDate: moment('2025-06-01'),
        effectivePeriod: null,
      });
      component.effectivePeriodRequired = true;
      tick();
      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should return true when terminationPeriodRequired', fakeAsync(() => {
      component.filterForm.patchValue({
        terminationDate: moment('2025-06-01'),
        terminationPeriod: null,
      });
      component.terminationPeriodRequired = true;
      tick();
      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should return true when no changes from snapshot', fakeAsync(() => {
      tick();
      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should return false when valid form has changes', fakeAsync(() => {
      component.filterForm.patchValue({ currentProduct: 'Y' });
      tick();
      expect(component.isApplyDisabled).toBe(false);
    }));
  });

  describe('isClearAllDisabled', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return true when all values are empty', fakeAsync(() => {
      tick();
      expect(component.isClearAllDisabled).toBe(true);
    }));

    it('should return false when currentProduct has value', fakeAsync(() => {
      component.filterForm.patchValue({ currentProduct: 'Y' });
      tick();
      expect(component.isClearAllDisabled).toBe(false);
    }));

    it('should return false when otherProduct has value', fakeAsync(() => {
      component.filterForm.patchValue({ otherProduct: 'FFP' });
      tick();
      expect(component.isClearAllDisabled).toBe(false);
    }));

    it('should return false when rejectCode has value', fakeAsync(() => {
      component.filterForm.patchValue({ rejectCode: 'R01' });
      tick();
      expect(component.isClearAllDisabled).toBe(false);
    }));

    it('should return false when effectiveDate has value', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: moment() });
      tick();
      expect(component.isClearAllDisabled).toBe(false);
    }));

    it('should return false when terminationDate has value', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: moment() });
      tick();
      expect(component.isClearAllDisabled).toBe(false);
    }));

    it('should return false when effectivePeriod has value', fakeAsync(() => {
      component.filterForm.patchValue({ effectivePeriod: 'After' });
      tick();
      expect(component.isClearAllDisabled).toBe(false);
    }));

    it('should return false when terminationPeriod has value', fakeAsync(() => {
      component.filterForm.patchValue({ terminationPeriod: 'Before' });
      tick();
      expect(component.isClearAllDisabled).toBe(false);
    }));
  });

  describe('filteredRejectCodes', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return all reject codes when search is empty', fakeAsync(() => {
      component.rejectCodeSearchCtrl.setValue('');
      tick();
      expect(component.filteredRejectCodes().length).toBe(2);
    }));

    it('should filter by code', fakeAsync(() => {
      component.rejectCodeSearchCtrl.setValue('R01');
      tick();
      expect(component.filteredRejectCodes().length).toBe(1);
      expect(component.filteredRejectCodes()[0].code).toBe('R01');
    }));

    it('should filter by description', fakeAsync(() => {
      component.rejectCodeSearchCtrl.setValue('Reject Code 2');
      tick();
      expect(component.filteredRejectCodes().length).toBe(1);
      expect(component.filteredRejectCodes()[0].code).toBe('R02');
    }));

    it('should return empty when no match', fakeAsync(() => {
      component.rejectCodeSearchCtrl.setValue('ZZZZ');
      tick();
      expect(component.filteredRejectCodes().length).toBe(0);
    }));
  });

  describe('effDateErrorMatcher', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return false when control is null', () => {
      expect(component.effDateErrorMatcher.isErrorState(null as any, null as any)).toBe(false);
    });

    it('should return false when control is pristine and untouched', () => {
      const control = component.filterForm.get('effectiveDate');
      expect(component.effDateErrorMatcher.isErrorState(control as any, null as any)).toBe(false);
    });

    it('should return true when control is dirty and invalid', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue('bad');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsDirty();
      expect(component.effDateErrorMatcher.isErrorState(control as any, null as any)).toBe(true);
    });

    it('should return true when control is touched and invalid', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue('bad');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      expect(component.effDateErrorMatcher.isErrorState(control as any, null as any)).toBe(true);
    });
  });

  describe('termDateErrorMatcher', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return false when control is null', () => {
      expect(component.termDateErrorMatcher.isErrorState(null as any, null as any)).toBe(false);
    });

    it('should return false when control is pristine and untouched', () => {
      const control = component.filterForm.get('terminationDate');
      expect(component.termDateErrorMatcher.isErrorState(control as any, null as any)).toBe(false);
    });

    it('should return true when control is dirty and invalid', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setValue('bad');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsDirty();
      expect(component.termDateErrorMatcher.isErrorState(control as any, null as any)).toBe(true);
    });
  });

  describe('onEffectiveDateBlur', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should restore raw input when control value is null and input was cleared', fakeAsync(() => {
      const fakeInput = { value: '' } as HTMLInputElement;
      component.onEffectiveDateInput({ target: { value: '01-JAN-2025' } } as any);
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(null);

      component.onEffectiveDateBlur(fakeInput);
      tick(10);

      expect(fakeInput.value).toBe('01-JAN-2025');
    }));

    it('should not restore if control has a value', fakeAsync(() => {
      const fakeInput = { value: '' } as HTMLInputElement;
      component.onEffectiveDateInput({ target: { value: '01-JAN-2025' } } as any);
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(moment('2025-01-01'));

      component.onEffectiveDateBlur(fakeInput);
      tick(10);

      expect(fakeInput.value).toBe('');
    }));
  });

  describe('onTerminationDateBlur', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should restore raw input when control value is null and input was cleared', fakeAsync(() => {
      const fakeInput = { value: '' } as HTMLInputElement;
      component.onTerminationDateInput({ target: { value: '31-DEC-2025' } } as any);
      const control = component.filterForm.get('terminationDate');
      control?.setValue(null);

      component.onTerminationDateBlur(fakeInput);
      tick(10);

      expect(fakeInput.value).toBe('31-DEC-2025');
    }));

    it('should not restore if control has a value', fakeAsync(() => {
      const fakeInput = { value: '' } as HTMLInputElement;
      component.onTerminationDateInput({ target: { value: '31-DEC-2025' } } as any);
      const control = component.filterForm.get('terminationDate');
      control?.setValue(moment('2025-12-31'));

      component.onTerminationDateBlur(fakeInput);
      tick(10);

      expect(fakeInput.value).toBe('');
    }));
  });

  describe('hasChanges with date changes after applying', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should detect date change after apply', fakeAsync(() => {
      component.filterForm.patchValue({
        currentProduct: 'Y',
        effectiveDate: moment('2025-01-15'),
        effectivePeriod: 'After',
      });
      tick();
      component['onApply']();
      tick();
      expect(component.hasChanges).toBe(false);

      component.filterForm.patchValue({
        effectiveDate: moment('2025-06-01'),
      });
      tick();
      expect(component.hasChanges).toBe(true);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      component.ngOnInit();
      const spy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
