import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ValidAdditionalTestsFilterPanelComponent } from './valid-additional-tests-filter-panel.component';
import { ValidAdditionalTestFilterValue } from '../models/valid-additional-tests.model';
import moment from 'moment';

describe('ValidAdditionalTestsFilterPanelComponent', () => {
  let component: ValidAdditionalTestsFilterPanelComponent;
  let fixture: ComponentFixture<ValidAdditionalTestsFilterPanelComponent>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [ValidAdditionalTestsFilterPanelComponent, NoopAnimationsModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ValidAdditionalTestsFilterPanelComponent);
    component = fixture.componentInstance;


    });
  describe('Form Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should clear form when onClear is called', () => {
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: moment('2024-01-01'),
        terminationPeriod: 'Before',
        terminationDate: moment('2024-12-31'),
      });

      component.onClear();

      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.value).toBeNull();
    });

  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when no errors and filters are set', () => {
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: moment('2024-01-01'),
      });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return true when no filters are set', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effective period has error', () => {
      component.filterForm.get('effectivePeriod')?.setErrors({ required: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when termination period has error', () => {
      component.filterForm.get('terminationPeriod')?.setErrors({ required: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when only periods are selected without dates', () => {
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        terminationPeriod: 'Before',
      });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effective date input has unparsed text', () => {
      const effInput = fixture.debugElement.nativeElement.querySelector('input[formControlName="effectiveDate"]');
      effInput.value = 'invalid-date';
      effInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when termination date input has unparsed text', () => {
      const termInput = fixture.debugElement.nativeElement.querySelector('input[formControlName="terminationDate"]');
      termInput.value = 'invalid-date';
      termInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should require effective period when effective date is set', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2024-01-01'));
      component.filterForm.get('effectiveDate')?.markAsTouched();

      const periodControl = component.filterForm.get('effectivePeriod');
      expect(periodControl?.hasError('required')).toBe(true);
    });

    it('should require termination period when termination date is set', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2024-12-31'));
      component.filterForm.get('terminationDate')?.markAsTouched();

      const periodControl = component.filterForm.get('terminationPeriod');
      expect(periodControl?.hasError('required')).toBe(true);
    });

  });
});
