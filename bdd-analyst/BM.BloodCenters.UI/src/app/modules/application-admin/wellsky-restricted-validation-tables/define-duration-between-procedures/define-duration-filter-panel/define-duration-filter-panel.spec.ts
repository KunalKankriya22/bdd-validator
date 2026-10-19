import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { DefineDurationFilterPanel } from './define-duration-filter-panel';
import { DefineDurationBetweenProceduresService } from '../services/define-duration-between-procedures.service';

describe('DefineDurationFilterPanel', () => {
  let component: DefineDurationFilterPanel;
  let fixture: ComponentFixture<DefineDurationFilterPanel>;
  let mockService: jasmine.SpyObj<DefineDurationBetweenProceduresService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('DefineDurationBetweenProceduresService', [
      'getDefineDurationFilters'
    ]);
    mockService.getDefineDurationFilters.and.returnValue(of({
      item: {
        currDonationType: ['WB', 'PLT'],
        procedureCode: ['PROC1', 'PROC2']
      }
    }));

    TestBed.configureTestingModule({
      imports: [DefineDurationFilterPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: DefineDurationBetweenProceduresService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(DefineDurationFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with null defaults', () => {
    expect(component.filterForm.value).toEqual({
      currDonationType: null,
      procedureCode: null,
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
  });

  it('should load filter options on init', () => {
    expect(mockService.getDefineDurationFilters).toHaveBeenCalled();
    expect(component.currDonationTypeOptions).toEqual(['WB', 'PLT']);
    expect(component.procedureCodeOptions).toEqual(['PROC1', 'PROC2']);
  });

  describe('isApplyDisabled', () => {
    it('should return true when no fields are populated', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when currDonationType is selected', () => {
      component.filterForm.patchValue({ currDonationType: 'WB' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when procedureCode is selected', () => {
      component.filterForm.patchValue({ procedureCode: 'PROC1' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when effectivePeriodRequired is set', () => {
      component.effectivePeriodRequired = true;
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationPeriodRequired is set', () => {
      component.terminationPeriodRequired = true;
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when effective date and period are both set', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: new Date()
      });
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('onApply', () => {
    it('should emit apply with filter values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        currDonationType: 'WB',
        procedureCode: 'PROC1'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          currDonationType: 'WB',
          procedureCode: 'PROC1',
          activeOnly: true
        })
      );
    });

    it('should not emit when validation errors exist', fakeAsync(() => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: null
      });
      tick();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));
  });

  describe('onClear', () => {
    it('should reset form and clear validation flags', () => {
      component.filterForm.patchValue({
        currDonationType: 'WB',
        procedureCode: 'PROC1'
      });
      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;

      component.onClear();

      expect(component.filterForm.value.currDonationType).toBeNull();
      expect(component.filterForm.value.procedureCode).toBeNull();
      expect(component.effectivePeriodRequired).toBeFalse();
      expect(component.terminationPeriodRequired).toBeFalse();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('date period validation', () => {
    it('should set effectivePeriodRequired when date is set without period', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: null });
      tick();

      expect(component.effectivePeriodRequired).toBeTrue();
    }));

    it('should clear effectivePeriodRequired when period is selected', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: 'after' });
      tick();

      expect(component.effectivePeriodRequired).toBeFalse();
    }));

    it('should set terminationPeriodRequired when date is set without period', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date(), terminationDatePeriod: null });
      tick();

      expect(component.terminationPeriodRequired).toBeTrue();
    }));
  });

  describe('error handling', () => {
    it('should handle service error and set empty options', () => {
      mockService.getDefineDurationFilters.and.returnValue(throwError(() => new Error('API error')));

      component.ngOnInit();

      expect(component.currDonationTypeOptions).toEqual([]);
      expect(component.procedureCodeOptions).toEqual([]);
      expect(component.isLoadingFilters).toBeFalse();
    });
  });
});
