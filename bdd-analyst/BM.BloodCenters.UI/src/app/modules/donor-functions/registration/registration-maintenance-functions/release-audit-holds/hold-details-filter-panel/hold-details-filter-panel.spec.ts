import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import moment from 'moment';

import { HoldDetailsFilterPanel } from './hold-details-filter-panel';
import { HeaderService } from '@shared/services/header.service';

describe('HoldDetailsFilterPanel', () => {
  let component: HoldDetailsFilterPanel;
  let fixture: ComponentFixture<HoldDetailsFilterPanel>;
  let mockHeaderService: { chapterChanged$: Subject<void> };

  const today = moment();
  const yesterday = moment().subtract(1, 'days');
  const lastWeek = moment().subtract(7, 'days');
  const nextWeek = moment().add(7, 'days');

  beforeEach(() => {

    mockHeaderService = {
      chapterChanged$: new Subject<void>()
    };



      TestBed.configureTestingModule({
imports: [
        HoldDetailsFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(HoldDetailsFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  /* -------------------------------- INITIALIZATION -------------------------------- */

  describe('Initialization', () => {

    it('should initialize unit hold options by default', () => {
      expect(component.holdOptions.length).toBe(2);
      expect(component.holdOptions[0].value).toBe('Active');
      expect(component.holdOptions[1].value).toBe('All');
    });

    it('should initialize donor hold options when section is donor', () => {
      const panel = TestBed.createComponent(HoldDetailsFilterPanel);
      const comp = panel.componentInstance;
      comp.section = 'donor';
      panel.detectChanges();

      expect(comp.holdOptions.length).toBe(3);
      expect(comp.holdOptions[0].value).toBe('All');
      expect(comp.holdOptions[1].value).toBe('ActiveDonation');
      expect(comp.holdOptions[2].value).toBe('AllDonation');
    });

    it('should initialize period options', () => {
      expect(component.periodOptions.length).toBe(2);
      expect(component.periodOptions[0].value).toBe('before');
      expect(component.periodOptions[1].value).toBe('after');
    });

    it('should initialize with current filters when provided', () => {
      const panel = TestBed.createComponent(HoldDetailsFilterPanel);
      const comp = panel.componentInstance;
      comp.currentFilters = { holds: 'Active', entryDatePeriod: 'after', entryDate: today.toDate() };
      panel.detectChanges();

      expect(comp.filterForm.get('holds')?.value).toBe('Active');
      expect(comp.filterForm.get('entryDatePeriod')?.value).toBe('after');
      expect(comp.filterForm.get('entryDate')?.value).toBeTruthy();
    });

  });

  /* -------------------------------- VALIDATION -------------------------------- */

  describe('Validation', () => {
    it('should set entry date period error when date is set without period', () => {
      component.filterForm.get('entryDate')?.setValue(today.clone());
      expect(component.entryDatePeriodError).toBe('Period is required');
    });


    it('should set termination date period error when date is set without period', () => {
      component.filterForm.get('terminationDate')?.setValue(today.clone());
      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should clear termination date period error when period is set', () => {
      component.filterForm.get('terminationDate')?.setValue(today.clone());
      component.filterForm.get('terminationDatePeriod')?.setValue('before');
      expect(component.terminationDatePeriodError).toBe('');
    });





  });

  /* -------------------------------- MIN TERMINATION DATE -------------------------------- */

  describe('Min Termination Date', () => {
    it('should update minimum termination date when entry date changes', () => {
      const entryDate = today.clone();
      component.filterForm.get('entryDate')?.setValue(entryDate);

      expect(component.minTerminationDate).toBeTruthy();
      expect(moment(component.minTerminationDate).isSame(entryDate, 'day')).toBe(true);
    });

    it('should clear minimum termination date when entry date is cleared', () => {
      component.filterForm.get('entryDate')?.setValue(today.clone());
      expect(component.minTerminationDate).toBeTruthy();

      component.filterForm.get('entryDate')?.setValue(null);
      expect(component.minTerminationDate).toBeNull();
    });
  });

  /* -------------------------------- DATE ERROR MESSAGES -------------------------------- */
  /* -------------------------------- ACTIONS -------------------------------- */

  describe('Actions', () => {



    it('should clear error messages on clear', () => {
      component.filterForm.get('entryDate')?.setValue(today.clone());
      expect(component.entryDatePeriodError).toBe('Period is required');

      component.onClear();
      expect(component.entryDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should clear minTerminationDate on clear', () => {
      component.filterForm.get('entryDate')?.setValue(today.clone());
      expect(component.minTerminationDate).toBeTruthy();

      component.onClear();
      expect(component.minTerminationDate).toBeNull();
    });
  });

  /* -------------------------------- DATE INPUT -------------------------------- */

  describe('Date Input', () => {
    it('should handle entry date input without error', () => {
      const mockEvent = { target: { value: today.format('DD-MMM-YYYY') } } as unknown as Event;
      expect(() => component.onEntryDateInput(mockEvent)).not.toThrow();
    });

    it('should handle termination date input without error', () => {
      const mockEvent = { target: { value: today.format('DD-MMM-YYYY') } } as unknown as Event;
      expect(() => component.onTerminationDateInput(mockEvent)).not.toThrow();
    });

    it('should handle entry date blur without error', () => {
      component.filterForm.get('entryDate')?.setValue(today.clone());
      expect(() => component.onEntryDateBlur()).not.toThrow();
    });

    it('should handle termination date blur without error', () => {
      component.filterForm.get('terminationDate')?.setValue(today.clone());
      expect(() => component.onTerminationDateBlur()).not.toThrow();
    });

  });

  /* -------------------------------- CHAPTER CHANGES -------------------------------- */
  /* -------------------------------- DESTROY -------------------------------- */

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
