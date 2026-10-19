import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { AntigenTestFilterPanel } from './antigen-test-filter-panel';

describe('AntigenTestFilterPanel', () => {
  let component: AntigenTestFilterPanel;
  let fixture: ComponentFixture<AntigenTestFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AntigenTestFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatNativeDateModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AntigenTestFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });






  describe('period validation', () => {
    it('should show error when effective date is selected without period', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: null
      });

      component['validateEffectiveDatePeriod']();

      expect(component.filterForm.get('effectiveDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should clear error when period is selected', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: 'After'
      });

      component['validateEffectiveDatePeriod']();

      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
    });

    it('should show error when termination date is selected without period', () => {
      component.filterForm.patchValue({
        terminationDate: new Date(),
        terminationDatePeriod: null
      });

      component['validateTerminationDatePeriod']();

      expect(component.filterForm.get('terminationDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should clear error when termination period is selected', () => {
      component.filterForm.patchValue({
        terminationDate: new Date(),
        terminationDatePeriod: 'Before'
      });

      component['validateTerminationDatePeriod']();

      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });



  });
});
