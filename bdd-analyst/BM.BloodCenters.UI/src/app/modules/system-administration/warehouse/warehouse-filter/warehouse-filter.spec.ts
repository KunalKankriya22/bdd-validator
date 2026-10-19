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
import { provideHttpClient } from '@angular/common/http';
import { WarehouseFilterComponent, WarehouseFilters } from './warehouse-filter';

describe('WarehouseFilterComponent', () => {
  let component: WarehouseFilterComponent;
  let fixture: ComponentFixture<WarehouseFilterComponent>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        WarehouseFilterComponent,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatNativeDateModule
      ],
      providers: [
        provideHttpClient()
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(WarehouseFilterComponent);
    component = fixture.componentInstance;
    component.warehouses = [
      { value: 'WH1', display: 'WH1 - Warehouse 1' },
      { value: 'WH2', display: 'WH2 - Warehouse 2' }
    ];
    component.chapters = [
      { value: 'CH1', display: 'CH1 - Chapter 1' },
      { value: 'CH2', display: 'CH2 - Chapter 2' }
    ];
    fixture.detectChanges();


    });
  describe('onApply', () => {


    it('should emit filters with effective date and period', () => {
      spyOn(component.apply, 'emit');

      const testDate = new Date();
      testDate.setMonth(0, 15); // January 15th of current year
      component.filterForm.patchValue({
        warehouse: null,
        chapter: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: testDate,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDatePeriod).toBe('AFTER');
      expect(emittedValue.effectiveDate).toBeDefined();
    });


  });
  describe('Period Validation', () => {
    it('should not emit apply when effective date is set without period', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: new Date(new Date().getFullYear(), 0, 1),
        effectiveDatePeriod: null
      });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
      expect(component.filterForm.get('effectiveDatePeriod')?.hasError('required')).toBeTrue();
    });

    it('should not emit apply when termination date is set without period', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        terminationDate: new Date(new Date().getFullYear(), 11, 31),
        terminationDatePeriod: null
      });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
      expect(component.filterForm.get('terminationDatePeriod')?.hasError('required')).toBeTrue();
    });

    it('should clear all fields including validation errors after onClear', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(new Date().getFullYear(), 0, 1),
        effectiveDatePeriod: null,
        terminationDate: new Date(new Date().getFullYear(), 11, 31),
        terminationDatePeriod: null
      });

      component.onApply();
      expect(component.filterForm.get('effectiveDatePeriod')?.hasError('required')).toBeTrue();
      expect(component.filterForm.get('terminationDatePeriod')?.hasError('required')).toBeTrue();

      component.onClear();

      // All fields should be null after clear
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });
  });

  describe('Clear Button Behavior', () => {
    it('should only clear form fields without emitting apply event', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        warehouse: 'WH1',
        chapter: 'CH1',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date()
      });

      component.onClear();

      // Form should be cleared
      expect(component.filterForm.get('warehouse')?.value).toBeNull();
      expect(component.filterForm.get('chapter')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();

      // Apply should NOT be emitted on clear
      expect(component.apply.emit).not.toHaveBeenCalled();
    });

  });

  describe('isApplyDisabled', () => {







    it('should be disabled when date has parse error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: { text: 'invalid' } });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled after clear when no filters selected', () => {
      component.filterForm.patchValue({
        warehouse: 'WH1',
        chapter: 'CH1'
      });
      expect(component.isApplyDisabled).toBeFalse();

      component.onClear();
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

});
