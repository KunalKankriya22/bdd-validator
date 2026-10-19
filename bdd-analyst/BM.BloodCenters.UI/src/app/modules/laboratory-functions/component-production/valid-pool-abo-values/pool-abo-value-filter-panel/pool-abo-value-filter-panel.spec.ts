import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import moment from 'moment';

import { PoolAboValueFilterPanel } from './pool-abo-value-filter-panel';

describe('PoolAboValueFilterPanel', () => {
  let component: PoolAboValueFilterPanel;
  let fixture: ComponentFixture<PoolAboValueFilterPanel>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        PoolAboValueFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatCheckboxModule,
        NgxMatSelectSearchModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(PoolAboValueFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });






  it('should not emit apply event when clear is clicked', () => {
    let emitted = false;
    component.apply.subscribe(() => {
      emitted = true;
    });

    component.filterForm.patchValue({
      opos: 'Y',
      unitSchemeType: 'C',
      rhLabelFlag: 'Y',
      poolSld: '17'
    });

    component.onClear();

    expect(emitted).toBeFalse();
  });






  it('should not require period when effective date is selected and period is provided', () => {
    component.filterForm.patchValue({
      effDate: new Date('2026-05-08'),
      effDatePeriod: 'after'
    });

    component.validateEffPeriod();

    expect(component.effPeriodRequired).toBe(false);
  });


  it('should not require period when termination date is selected and period is provided', () => {
    component.filterForm.patchValue({
      termDate: new Date('2026-12-31'),
      termDatePeriod: 'before'
    });

    component.validateTermPeriod();

    expect(component.termPeriodRequired).toBe(false);
  });

  it('should validate eff period on effDate value change', (done) => {
    component.filterForm.patchValue({
      effDate: new Date('2026-05-08')
    });

    setTimeout(() => {
      expect(component.effPeriodRequired).toBe(true);
      done();
    }, 50);
  });

  it('should validate term period on termDate value change', (done) => {
    component.filterForm.patchValue({
      termDate: new Date('2026-12-31')
    });

    setTimeout(() => {
      expect(component.termPeriodRequired).toBe(true);
      done();
    }, 50);
  });

  it('should validate eff period on effDatePeriod value change', () => {
    component.filterForm.patchValue({
      effDate: new Date('2026-05-08'),
      effDatePeriod: 'after'
    });

    expect(component.effPeriodRequired).toBe(false);
  });

  it('should validate term period on termDatePeriod value change', () => {
    component.filterForm.patchValue({
      termDate: new Date('2026-12-31'),
      termDatePeriod: 'before'
    });

    expect(component.termPeriodRequired).toBe(false);
  });




  it('should emit apply with all ABO filter values', () => {
    spyOn(component.apply, 'emit');
    component.filterForm.patchValue({
      opos: 'Y',
      oneg: 'N',
      apos: 'Y',
      aneg: 'N',
      bpos: 'Y',
      bneg: 'N',
      abpos: 'Y',
      abneg: 'N'
    });

    component.onApply();

    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.opos).toBe('Y');
    expect(emittedValue.oneg).toBe('N');
    expect(emittedValue.apos).toBe('Y');
    expect(emittedValue.aneg).toBe('N');
    expect(emittedValue.bpos).toBe('Y');
    expect(emittedValue.bneg).toBe('N');
    expect(emittedValue.abpos).toBe('Y');
    expect(emittedValue.abneg).toBe('N');
  });

  it('should emit apply with date filters including periods', () => {
    spyOn(component.apply, 'emit');
    component.filterForm.patchValue({
      effDate: new Date('2026-05-08'),
      effDatePeriod: 'after',
      termDate: new Date('2026-12-31'),
      termDatePeriod: 'before'
    });

    component.onApply();

    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.effDatePeriod).toBe('after');
    expect(emittedValue.termDatePeriod).toBe('before');
    expect(emittedValue.effDate).toBeDefined();
    expect(emittedValue.termDate).toBeDefined();
  });

  it('should not include filters with null or undefined values in apply', () => {
    spyOn(component.apply, 'emit');
    component.filterForm.patchValue({
      opos: 'Y',
      aneg: null,
      bpos: undefined
    });

    component.onApply();

    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.opos).toBe('Y');
    expect(emittedValue.aneg).toBeUndefined();
    expect(emittedValue.bpos).toBeUndefined();
  });


  it('should handle effDate input and store raw input', () => {
    const event = {
      target: { value: '08-MAY-2026' }
    } as any;

    component.onEffDateInput(event);

    expect(component['effDateRawInput']).toBe('08-MAY-2026');
  });

  it('should mark effDate control as touched on input', () => {
    const event = {
      target: { value: '08-MAY-2026' }
    } as any;

    component.onEffDateInput(event);

    expect(component.filterForm.get('effDate')?.touched).toBe(true);
  });

  it('should set invalidDate error when input has value but control value is null', () => {
    const event = {
      target: { value: 'invalid-date' }
    } as any;
    component.filterForm.get('effDate')?.setValue(null);

    component.onEffDateInput(event);

    expect(component.filterForm.get('effDate')?.hasError('invalidDate')).toBe(true);
  });

  it('should handle termDate input and store raw input', () => {
    const event = {
      target: { value: '31-DEC-2026' }
    } as any;

    component.onTermDateInput(event);

    expect(component['termDateRawInput']).toBe('31-DEC-2026');
  });

  it('should handle effDate blur and preserve raw input', (done) => {
    component['effDateRawInput'] = '08-MAY-2026';
    const input = document.createElement('input');
    input.value = '';
    component.filterForm.get('effDate')?.setValue(null);

    component.onEffDateBlur(input);

    setTimeout(() => {
      expect(input.value).toBe('08-MAY-2026');
      done();
    }, 50);
  });

  it('should handle termDate blur and preserve raw input', (done) => {
    component['termDateRawInput'] = '31-DEC-2026';
    const input = document.createElement('input');
    input.value = '';
    component.filterForm.get('termDate')?.setValue(null);

    component.onTermDateBlur(input);

    setTimeout(() => {
      expect(input.value).toBe('31-DEC-2026');
      done();
    }, 50);
  });


  it('should convert Date objects to UTC for effDate', () => {
    spyOn(component.apply, 'emit');
    const testDate = new Date(2026, 4, 8); // May 8, 2026 in local time
    component.filterForm.patchValue({
      effDate: testDate,
      effDatePeriod: 'after'
    });

    component.onApply();

    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.effDate).toContain('2026-05-08');
  });

  it('should convert moment objects to UTC for termDate', () => {
    spyOn(component.apply, 'emit');
    const testDate = new Date(2026, 11, 31); // Dec 31, 2026 in local time
    component.filterForm.patchValue({
      termDate: testDate,
      termDatePeriod: 'before'
    });

    component.onApply();

    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.termDate).toContain('2026-12-31');
  });



  it('should handle moment objects in convertToUTCDate', () => {
    spyOn(component.apply, 'emit');
    const momentDate = moment('2026-05-08');
    component.filterForm.patchValue({
      effDate: momentDate,
      effDatePeriod: 'after'
    });

    component.onApply();

    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.effDate).toContain('2026-05-08');
  });

  it('should handle null date in convertToUTCDate', () => {
    spyOn(component.apply, 'emit');
    component.filterForm.patchValue({
      effDate: null,
      effDatePeriod: 'after',
      opos: 'Y'
    });

    component.onApply();

    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.effDate).toBeUndefined();
    expect(emittedValue.opos).toBe('Y');
  });

  it('should not set invalidDate error when input has value and control has value', () => {
    const event = {
      target: { value: '08-MAY-2026' }
    } as any;
    component.filterForm.get('effDate')?.setValue(new Date('2026-05-08'));

    component.onEffDateInput(event);

    expect(component.filterForm.get('effDate')?.hasError('invalidDate')).toBeFalsy();
  });

  it('should not restore raw input on blur when control has value', (done) => {
    component['effDateRawInput'] = '08-MAY-2026';
    const input = document.createElement('input');
    input.value = '08-MAY-2026';
    component.filterForm.get('effDate')?.setValue(new Date('2026-05-08'));

    component.onEffDateBlur(input);

    setTimeout(() => {
      expect(input.value).toBe('08-MAY-2026'); // Should remain unchanged
      done();
    }, 50);
  });

  it('should not restore raw input on blur when input already has value', (done) => {
    component['effDateRawInput'] = '08-MAY-2026';
    const input = document.createElement('input');
    input.value = '08-MAY-2026';
    component.filterForm.get('effDate')?.setValue(null);

    component.onEffDateBlur(input);

    setTimeout(() => {
      expect(input.value).toBe('08-MAY-2026'); // Should remain unchanged
      done();
    }, 50);
  });

  it('should not restore raw input on blur when no raw input stored', (done) => {
    component['effDateRawInput'] = '';
    const input = document.createElement('input');
    input.value = '';
    component.filterForm.get('effDate')?.setValue(null);

    component.onEffDateBlur(input);

    setTimeout(() => {
      expect(input.value).toBe(''); // Should remain empty
      done();
    }, 50);
  });

  it('should handle input with empty trimmed value', () => {
    const event = {
      target: { value: '   ' }
    } as any;

    component.onEffDateInput(event);

    // Should not mark as touched or set errors
    expect(component['effDateRawInput']).toBe('   ');
  });


  it('should set invalidDate error for termDate when input has value but control value is null', () => {
    const event = {
      target: { value: 'invalid-date' }
    } as any;
    component.filterForm.get('termDate')?.setValue(null);

    component.onTermDateInput(event);

    expect(component.filterForm.get('termDate')?.hasError('invalidDate')).toBe(true);
  });


  it('should clear control errors on clear', () => {
    component.filterForm.get('effDatePeriod')?.setErrors({ required: true });
    component.filterForm.get('termDatePeriod')?.setErrors({ required: true });

    component.onClear();

    expect(component.filterForm.get('effDatePeriod')?.errors).toBeNull();
    expect(component.filterForm.get('termDatePeriod')?.errors).toBeNull();
  });

  it('should mark effDate control as touched when it does not have touched flag', (done) => {
    component.filterForm.get('effDate')?.markAsUntouched();
    component.filterForm.patchValue({
      effDate: new Date('2026-05-08')
    });

    setTimeout(() => {
      expect(component.filterForm.get('effDate')?.touched).toBe(true);
      done();
    }, 50);
  });

  it('should mark termDate control as touched when it does not have touched flag', (done) => {
    component.filterForm.get('termDate')?.markAsUntouched();
    component.filterForm.patchValue({
      termDate: new Date('2026-12-31')
    });

    setTimeout(() => {
      expect(component.filterForm.get('termDate')?.touched).toBe(true);
      done();
    }, 50);
  });
});
