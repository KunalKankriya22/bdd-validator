import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import moment from 'moment';

import { DefineDonationProceduresFilterPanel } from './define-donation-procedures-filter-panel';

describe('DefineDonationProceduresFilterPanel', () => {
  let component: DefineDonationProceduresFilterPanel;
  let fixture: ComponentFixture<DefineDonationProceduresFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DefineDonationProceduresFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatNativeDateModule],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(DefineDonationProceduresFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have only After and Before period options', () => {
    expect(component.periodOptions.length).toBe(2);
    expect(component.periodOptions.map(p => p.value)).toEqual(['After', 'Before']);
  });

  it('should require period when date is selected', () => {
    const effectiveDate = moment().add(10, 'days').toDate();
    component.filterForm.get('effectiveDate')?.setValue(effectiveDate);
    component.filterForm.get('effectiveDatePeriod')?.markAsTouched();
    component.filterForm.get('effectiveDatePeriod')?.updateValueAndValidity();
    expect(component.filterForm.get('effectiveDatePeriod')?.valid).toBe(false);
  });

  describe('isApplyDisabled', () => {
    it('should be disabled when form is empty and unchanged', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when only effective date period is selected without a date', () => {
      component.filterForm.patchValue({ effectiveDatePeriod: 'After' });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when only termination date period is selected without a date', () => {
      component.filterForm.patchValue({ terminationDatePeriod: 'Before' });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when effective date is complete but termination period has no date', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2026-08-01'),
        terminationDatePeriod: 'Before'
      });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when donation type is selected and form changed', fakeAsync(() => {
      tick();
      component.filterForm.patchValue({ donationType: 'AL' });
      tick();
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeFalse();
    }));

    it('should be enabled when procedure code is selected and form changed', fakeAsync(() => {
      tick();
      component.filterForm.patchValue({ procedureCode: 'PP' });
      tick();
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeFalse();
    }));

    it('should be enabled when effective date with period is set and form changed', fakeAsync(() => {
      tick();
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2026-08-01')
      });
      tick();
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeFalse();
    }));

    it('should be enabled when termination date with period is set and form changed', fakeAsync(() => {
      tick();
      component.filterForm.patchValue({
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2026-12-31')
      });
      tick();
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeFalse();
    }));

    it('should be disabled when effective date is set without period (form invalid)', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2026-08-01')
      });
      component.filterForm.get('effectiveDatePeriod')?.updateValueAndValidity();
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should not count period alone as a complete filter value', () => {
      component.filterForm.patchValue({ effectiveDatePeriod: 'After' });
      fixture.detectChanges();
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('formChanged tracking', () => {
    it('should start with formChanged as false', () => {
      expect((component as any).formChanged).toBeFalse();
    });

    it('should set formChanged to true when a form value changes', () => {
      component.filterForm.patchValue({ donationType: 'AL' });
      expect((component as any).formChanged).toBeTrue();
    });

    it('should set formChanged to true after onClear resets the form', () => {
      component.onClear();
      expect((component as any).formChanged).toBeTrue();
    });
  });
});
