import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import moment from 'moment';

import { DonationsFilterPanelComponent } from './donations-filter-panel.component';
import { InterdictionQueryService } from '../../../../../../query-interdictions-holds/services/interdiction-query.service';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT } from 'src/app/core/utils/date-adapter.util';
import { DonationType, LovResponse } from '../../../../../../query-interdictions-holds/models/interdiction-query.model';

describe('DonationsFilterPanelComponent', () => {
  let component: DonationsFilterPanelComponent;
  let fixture: ComponentFixture<DonationsFilterPanelComponent>;
  let interdictionQueryServiceSpy: jasmine.SpyObj<InterdictionQueryService>;

  const mockDonationTypesResponse: LovResponse<DonationType> = {
    success: true,
    message: '',
    data: [
      { code: 'WB', description: 'Whole Blood' },
      { code: 'PL', description: 'Platelets' },
      { code: 'RBC', description: 'Red Blood Cells' }
    ]
  };

  beforeEach(() => {

    interdictionQueryServiceSpy = jasmine.createSpyObj('InterdictionQueryService', [
      'getValidDonationTypes'
    ]);
    interdictionQueryServiceSpy.getValidDonationTypes.and.returnValue(of(mockDonationTypesResponse));



      TestBed.configureTestingModule({
imports: [
        DonationsFilterPanelComponent,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        provideHttpClient(),
        { provide: InterdictionQueryService, useValue: interdictionQueryServiceSpy },
        { provide: DateAdapter, useClass: CustomDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
      ]
    });


    });



  beforeEach(() => {


      interdictionQueryServiceSpy.getValidDonationTypes.calls.reset();


      interdictionQueryServiceSpy.getValidDonationTypes.and.returnValue(of(mockDonationTypesResponse));


    fixture = TestBed.createComponent(DonationsFilterPanelComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should initialize form with provided currentFilters', () => {
      const currentFilters = {
        donationType: 'WB',
        showReleased: false,
        effectivePeriod: 'BEFORE',
        effectiveDate: moment('2026-01-01').toDate(),
        terminationPeriod: 'AFTER',
        terminationDate: moment('2026-12-31').toDate()
      };
      component.currentFilters = currentFilters;

      fixture.detectChanges();

      expect(component.filterForm.get('donationType')?.value).toBe('WB');
      expect(component.filterForm.get('showReleased')?.value).toBe(false);
      expect(component.filterForm.get('effectivePeriod')?.value).toBe('BEFORE');
      expect(component.filterForm.get('terminationPeriod')?.value).toBe('AFTER');
    });


    it('should handle error loading donation types', fakeAsync(() => {
      interdictionQueryServiceSpy.getValidDonationTypes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();
      tick();

      // Component returns fallback types on error (WB, PL, RBC, PLT, GR)
      expect(component.donationTypes().length).toBeGreaterThan(0);
      expect(component.donationTypes()[0].code).toBe('WB');
      expect(component.loadingDonationTypes()).toBeFalse();
    }));

    it('should handle empty donation types response', fakeAsync(() => {
      interdictionQueryServiceSpy.getValidDonationTypes.and.returnValue(
        of({ success: true, message: '', data: [] })
      );

      fixture.detectChanges();
      tick();

      // Component returns empty array when API returns empty data
      expect(component.donationTypes().length).toBe(0);
    }));

    it('should handle unsuccessful response', fakeAsync(() => {
      interdictionQueryServiceSpy.getValidDonationTypes.and.returnValue(
        of({ success: false, message: 'Error', data: [] })
      );

      fixture.detectChanges();
      tick();

      // Component returns empty array when API success is false
      expect(component.donationTypes().length).toBe(0);
    }));
  });

  describe('Period Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when effective date is set without period', fakeAsync(() => {
      component.filterForm.patchValue({
        effectiveDate: moment('2026-01-01'),
        effectivePeriod: null
      });
      tick();

      expect(component.effectiveDatePeriodError).toBe('Period is required');
    }));


    it('should show error when termination date is set without period', fakeAsync(() => {
      component.filterForm.patchValue({
        terminationDate: moment('2026-12-31'),
        terminationPeriod: null
      });
      tick();

      expect(component.terminationDatePeriodError).toBe('Period is required');
    }));


    it('should not show error when no date is set', fakeAsync(() => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectivePeriod: null
      });
      tick();

      expect(component.effectiveDatePeriodError).toBe('');
    }));
  });



  describe('Date Input Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should store raw input on effective date input', () => {
      const event = {
        target: { value: '01-JAN-2026' }
      } as any;

      component.onEffectiveDateInput(event);

      expect(component['effectiveDateRawInput']).toBe('01-JAN-2026');
    });

    it('should store raw input on termination date input', () => {
      const event = {
        target: { value: '31-DEC-2026' }
      } as any;

      component.onTerminationDateInput(event);

      expect(component['terminationDateRawInput']).toBe('31-DEC-2026');
    });



    it('should restore raw input on effective date blur when control has no value', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '';
      component['effectiveDateRawInput'] = 'invalid';
      component.filterForm.patchValue({ effectiveDate: null });

      component.onEffectiveDateBlur(input);
      tick(10);

      // Input should be restored if there was raw input
      expect(input.value).toBe('invalid');
    }));

    it('should restore raw input on termination date blur when control has no value', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '';
      component['terminationDateRawInput'] = 'invalid';
      component.filterForm.patchValue({ terminationDate: null });

      component.onTerminationDateBlur(input);
      tick(10);

      // Input should be restored if there was raw input
      expect(input.value).toBe('invalid');
    }));
  });
  describe('Query Context', () => {
    it('should use query context when loading donation types', fakeAsync(() => {
      const queryContext = {
        interCode: 'INT001',
        showReleased: true,
        fromDate: '2026-01-01',
        toDate: '2026-12-31'
      };
      component.queryContext = queryContext;

      fixture.detectChanges();
      tick();

      expect(interdictionQueryServiceSpy.getValidDonationTypes).toHaveBeenCalledWith(queryContext);
    }));
  });

  describe('Additional Date Validation Coverage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate effective date period when currentFilters provided', fakeAsync(() => {
      const currentFilters = {
        donationType: 'WB',
        showReleased: true,
        effectivePeriod: null,
        effectiveDate: moment('2026-01-01').toDate(),
        terminationPeriod: null,
        terminationDate: null
      };

      const newComponent = TestBed.createComponent(DonationsFilterPanelComponent);
      newComponent.componentInstance.currentFilters = currentFilters;
      newComponent.detectChanges();
      tick();

      expect(newComponent.componentInstance.effectiveDatePeriodError).toBe('Period is required');
    }));

    it('should validate termination date period when currentFilters provided', fakeAsync(() => {
      const currentFilters = {
        donationType: 'WB',
        showReleased: true,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: moment('2026-12-31').toDate()
      };

      const newComponent = TestBed.createComponent(DonationsFilterPanelComponent);
      newComponent.componentInstance.currentFilters = currentFilters;
      newComponent.detectChanges();
      tick();

      expect(newComponent.componentInstance.terminationDatePeriodError).toBe('Period is required');
    }));

    it('should mark effectiveDate as touched when value changes', fakeAsync(() => {
      const control = component.filterForm.get('effectiveDate');

      component.filterForm.patchValue({ effectiveDate: moment('2026-01-01') });
      tick();

      expect(control?.touched).toBeTrue();
    }));

    it('should mark terminationDate as touched when value changes', fakeAsync(() => {
      const control = component.filterForm.get('terminationDate');

      component.filterForm.patchValue({ terminationDate: moment('2026-12-31') });
      tick();

      expect(control?.touched).toBeTrue();
    }));


  });

  describe('Date Blur Advanced Scenarios', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalid date error on effectiveDate blur with invalid input', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = 'invalid-date';
      component['effectiveDateRawInput'] = 'invalid-date';
      component.filterForm.patchValue({ effectiveDate: null });

      component.onEffectiveDateBlur(input);
      tick(10);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDate')).toBeTrue();
    }));

    it('should set invalid date error on terminationDate blur with invalid input', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = 'invalid-date';
      component['terminationDateRawInput'] = 'invalid-date';
      component.filterForm.patchValue({ terminationDate: null });

      component.onTerminationDateBlur(input);
      tick(10);

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDate')).toBeTrue();
    }));

    it('should clear invalidDate error on effectiveDate blur with empty input', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '';
      component.filterForm.patchValue({ effectiveDate: null });

      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });

      component.onEffectiveDateBlur(input);
      tick(10);

      expect(control?.hasError('invalidDate')).toBeFalse();
    }));

    it('should clear invalidDate error on terminationDate blur with empty input', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '';
      component.filterForm.patchValue({ terminationDate: null });

      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDate: true });

      component.onTerminationDateBlur(input);
      tick(10);

      expect(control?.hasError('invalidDate')).toBeFalse();
    }));

    it('should clear invalidDate error when effectiveDate has valid value', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '';
      component.filterForm.patchValue({ effectiveDate: moment('2026-01-01') });

      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });

      component.onEffectiveDateBlur(input);
      tick(10);

      expect(control?.hasError('invalidDate')).toBeFalse();
    }));

    it('should clear invalidDate error when terminationDate has valid value', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '';
      component.filterForm.patchValue({ terminationDate: moment('2026-12-31') });

      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDate: true });

      component.onTerminationDateBlur(input);
      tick(10);

      expect(control?.hasError('invalidDate')).toBeFalse();
    }));
  });



  describe('Apply with Various Filter Values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply with all fields populated', fakeAsync(() => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        donationType: 'PL',
        showReleased: false,
        effectivePeriod: 'BEFORE',
        effectiveDate: moment('2026-01-01'),
        terminationPeriod: 'AFTER',
        terminationDate: moment('2026-12-31')
      });
      tick();

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'PL',
          showReleased: false,
          effectivePeriod: 'BEFORE',
          terminationPeriod: 'AFTER'
        })
      );
    }));

    it('should apply with minimal fields', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        donationType: 'ALL',
        showReleased: true
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'ALL',
          showReleased: true,
          effectivePeriod: null,
          effectiveDate: null,
          terminationPeriod: null,
          terminationDate: null
        })
      );
    });

    it('should handle undefined showReleased in apply', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        donationType: 'WB',
        showReleased: undefined as any
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          showReleased: null // Component uses null, not true
        })
      );
    });

    it('should handle null donationType in apply', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        donationType: null,
        showReleased: true
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: null // Component returns null, not 'ALL'
        })
      );
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to default state', () => {
      component.filterForm.patchValue({
        donationType: 'WB',
        showReleased: true,
        effectivePeriod: 'BEFORE',
        effectiveDate: moment('2026-01-01'),
        terminationPeriod: 'AFTER',
        terminationDate: moment('2026-12-31')
      });

      component.onClear();

      expect(component.filterForm.get('donationType')?.value).toBeNull();
      expect(component.filterForm.get('showReleased')?.value).toBeNull();
      expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should clear period errors', () => {
      component.effectiveDatePeriodError = 'Period is required';
      component.terminationDatePeriodError = 'Period is required';

      component.onClear();

      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should clear control errors on period controls', () => {
      component.filterForm.get('effectivePeriod')?.setErrors({ required: true });
      component.filterForm.get('terminationPeriod')?.setErrors({ required: true });

      component.onClear();

      expect(component.filterForm.get('effectivePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.errors).toBeNull();
    });
  });

  describe('onClose', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when no filters are applied', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when donationType is set', () => {
      component.filterForm.patchValue({ donationType: 'WB' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when showReleased is set to false', () => {
      component.filterForm.patchValue({ showReleased: false });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when effectiveDatePeriodError exists', () => {
      component.filterForm.patchValue({ donationType: 'WB' });
      component.effectiveDatePeriodError = 'Period is required';

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDatePeriodError exists', () => {
      component.filterForm.patchValue({ donationType: 'WB' });
      component.terminationDatePeriodError = 'Period is required';

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDate has invalidDate error', () => {
      component.filterForm.patchValue({ donationType: 'WB' });
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has invalidDate error', () => {
      component.filterForm.patchValue({ donationType: 'WB' });
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.patchValue({ donationType: 'WB' });
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.patchValue({ donationType: 'WB' });
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.patchValue({ donationType: 'WB' });
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has invalidDateFormat error', () => {
      component.filterForm.patchValue({ donationType: 'WB' });
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when effectivePeriod has a value', () => {
      component.filterForm.patchValue({ effectivePeriod: 'BEFORE' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when terminationDate has a value with period', fakeAsync(() => {
      component.filterForm.patchValue({
        terminationPeriod: 'AFTER',
        terminationDate: moment('2026-12-31')
      });
      tick();

      expect(component.isApplyDisabled).toBeFalse();
    }));
  });

  describe('showDonationType', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when queryContext option is not Hold', () => {
      component.queryContext = { option: 'Interdiction' } as any;
      expect(component.showDonationType).toBeTrue();
    });

    it('should return false when queryContext option is Hold', () => {
      component.queryContext = { option: 'Hold' } as any;
      expect(component.showDonationType).toBeFalse();
    });

    it('should return true when queryContext has no option', () => {
      component.queryContext = {} as any;
      expect(component.showDonationType).toBeTrue();
    });
  });

  describe('showReleasedLabel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return Show Terminated when queryContext option is Hold', () => {
      component.queryContext = { option: 'Hold' } as any;
      expect(component.showReleasedLabel).toBe('Show Terminated');
    });

    it('should return Show Released when queryContext option is not Hold', () => {
      component.queryContext = { option: 'Interdiction' } as any;
      expect(component.showReleasedLabel).toBe('Show Released');
    });

    it('should return Show Released when queryContext has no option', () => {
      component.queryContext = {} as any;
      expect(component.showReleasedLabel).toBe('Show Released');
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should complete the destroy subject without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('onApply with period errors', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should NOT emit when effectiveDatePeriodError exists', fakeAsync(() => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: moment('2026-06-15'),
        effectivePeriod: null
      });
      tick();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));

    it('should NOT emit when terminationDatePeriodError exists', fakeAsync(() => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        terminationDate: moment('2026-12-31'),
        terminationPeriod: null
      });
      tick();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));

    it('should emit when both periods are set properly', fakeAsync(() => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: moment('2026-06-15'),
        effectivePeriod: 'BEFORE',
        terminationDate: moment('2026-12-31'),
        terminationPeriod: 'AFTER'
      });
      tick();

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
    }));
  });

  describe('hasAnyFiltersApplied via isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should detect showReleased as a filter when set to true', () => {
      component.filterForm.patchValue({ showReleased: true });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should detect effectiveDate as a filter', fakeAsync(() => {
      component.filterForm.patchValue({
        effectiveDate: moment('2026-01-01'),
        effectivePeriod: 'BEFORE'
      });
      tick();

      expect(component.isApplyDisabled).toBeFalse();
    }));

    it('should detect terminationPeriod as a filter', () => {
      component.filterForm.patchValue({ terminationPeriod: 'AFTER' });
      expect(component.isApplyDisabled).toBeFalse();
    });
  });
});
