import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PatientFilterPanel } from './patient-filter-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PatientFilterPanel', () => {
  let component: PatientFilterPanel;
  let fixture: ComponentFixture<PatientFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientFilterPanel, NoopAnimationsModule, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  describe('onApply', () => {
    it('should emit filters when form is valid', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        status: 'Active',
        surgeryDate: new Date('2025-10-15'),
        surgeryDatePeriod: 'BEFORE'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.status).toBe('Active');
    });

    it('should emit null values when no filters are set', () => {
      spyOn(component.apply, 'emit');

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.status).toBeNull();
      expect(emittedValue.surgeryDate).toBeNull();
      expect(emittedValue.neededBy).toBeNull();
    });
  });

  describe('onClearAll', () => {
    it('should reset form without emitting apply', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        status: 'Active',
        surgeryDate: new Date('2025-10-15'),
        surgeryDatePeriod: 'BEFORE'
      });

      component.onClearAll();

      expect(component.filterForm.get('status')?.value).toBeNull();
      expect(component.filterForm.get('surgeryDate')?.value).toBeNull();
      expect(component.filterForm.get('surgeryDatePeriod')?.value).toBeNull();
      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });
  describe('period validation', () => {
    it('should require period when surgery date is set', () => {
      component.filterForm.patchValue({
        surgeryDate: new Date('2025-10-15'),
        surgeryDatePeriod: null
      });

      expect(component.filterForm.get('surgeryDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should require period when needed by date is set', () => {
      component.filterForm.patchValue({
        neededBy: new Date('2025-10-20'),
        neededByPeriod: null
      });

      expect(component.filterForm.get('neededByPeriod')?.hasError('required')).toBe(true);
    });
  });
});
