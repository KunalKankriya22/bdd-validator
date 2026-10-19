import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { ValidFiltersFilterPanel } from './valid-filters-filter-panel';
import { ValidFilterFilterValue } from '../models/valid-filters.model';

describe('ValidFiltersFilterPanel', () => {
  let component: ValidFiltersFilterPanel;
  let fixture: ComponentFixture<ValidFiltersFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ValidFiltersFilterPanel,
        NoopAnimationsModule,
        ReactiveFormsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ValidFiltersFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  describe('isApplyDisabled', () => {



    it('should be enabled when days is set', () => {
      component.filterForm.patchValue({ days: 56 });
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('onApply', () => {
    it('should emit apply with filter values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        catalogNumber: 'PA0000003',
        productType: 'RBC',
        days: 56
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        catalogNumber: 'PA0000003',
        productType: 'RBC',
        days: 56
      });
    });

    it('should only emit non-empty filter values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        catalogNumber: 'PA0000003',
        productType: null,
        days: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        catalogNumber: 'PA0000003'
      });
    });
  });

  describe('onClear', () => {
    it('should reset all form values', () => {
      component.filterForm.patchValue({
        catalogNumber: 'PA0000003',
        productType: 'RBC',
        days: 56
      });

      component.onClear();

      expect(component.filterForm.get('catalogNumber')?.value).toBeNull();
      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('days')?.value).toBeNull();
    });
  });
});
