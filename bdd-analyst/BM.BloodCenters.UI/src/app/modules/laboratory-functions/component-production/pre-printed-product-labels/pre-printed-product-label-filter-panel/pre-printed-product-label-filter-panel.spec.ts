import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import moment from 'moment';

import { PrePrintedProductLabelFilterPanel } from './pre-printed-product-label-filter-panel';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { PrePrintedProductLabelsApiService } from '../services/pre-printed-product-labels-api.service';

describe('PrePrintedProductLabelFilterPanel', () => {
  let component: PrePrintedProductLabelFilterPanel;
  let fixture: ComponentFixture<PrePrintedProductLabelFilterPanel>;
  let mockService: jasmine.SpyObj<PrePrintedProductLabelsApiService>;

  const mockFilterDropdown = {
    catalogNumbers: [
      { key: 'TEP540004', value: 'TEP540004' },
      { key: 'FE00NS000', value: 'FE00NS000' }
    ],
    productTypes: [{ key: 'RBC', value: 'RBC' }],
    bagCodes: [{ key: 'P53', value: 'P53' }],
    faceLabels: [
      { key: 'E0385000', value: 'E0385000' },
      { key: 'E2007000', value: 'E2007000' }
    ]
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('PrePrintedProductLabelsApiService', ['getFilterDropdown']);
    mockService.getFilterDropdown.and.returnValue(of(mockFilterDropdown));



      TestBed.configureTestingModule({
imports: [
        PrePrintedProductLabelFilterPanel,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatButtonModule,
        MatIconModule,
        NgxMatSelectSearchModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: PrePrintedProductLabelsApiService, useValue: mockService },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: MomentDateAdapter },
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });


    });



  beforeEach(() => {


      mockService.getFilterDropdown.calls.reset();


      mockService.getFilterDropdown.and.returnValue(of(mockFilterDropdown));


    fixture = TestBed.createComponent(PrePrintedProductLabelFilterPanel);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Initialization', () => {

    it('should initialize the filter form with null values', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('catalogNumber')?.value).toBeNull();
      expect(component.filterForm.get('faceLabel')?.value).toBeNull();
      expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effDate')?.value).toBeNull();
      expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('termDate')?.value).toBeNull();
    });

    it('should load filter dropdown values from API', () => {
      fixture.detectChanges();
      expect(mockService.getFilterDropdown).toHaveBeenCalled();
      expect(component.catalogNumberOptions.length).toBe(2);
      expect(component.faceLabelOptions.length).toBe(2);
    });

  });

  describe('Apply Button Disabled State', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable apply when no filters are selected', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply when a catalog number is selected', () => {
      component.filterForm.get('catalogNumber')?.setValue('TEP540004');
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should enable apply when a face label is selected', () => {
      component.filterForm.get('faceLabel')?.setValue('E0385000');
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should disable apply when date is set without period', fakeAsync(() => {
      component.filterForm.get('effDate')?.setValue(moment('2026-01-15'));
      tick();
      expect(component.effDatePeriodRequired).toBeTrue();
      expect(component.isApplyDisabled).toBeTrue();
    }));

    it('should enable apply when both date and period are set', fakeAsync(() => {
      component.filterForm.get('effDatePeriod')?.setValue('AFTER');
      component.filterForm.get('effDate')?.setValue(moment('2026-01-15'));
      tick();
      expect(component.effDatePeriodRequired).toBeFalse();
      expect(component.isApplyDisabled).toBeFalse();
    }));

    it('should disable apply when termination date is set without period', fakeAsync(() => {
      component.filterForm.get('termDate')?.setValue(moment('2026-12-31'));
      tick();
      expect(component.termDatePeriodRequired).toBeTrue();
      expect(component.isApplyDisabled).toBeTrue();
    }));
  });

  describe('Period Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set period required error when date exists but period does not', fakeAsync(() => {
      component.filterForm.get('effDate')?.setValue(moment('2026-01-15'));
      tick();
      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBeTrue();
    }));

    it('should clear period required error when period is selected', fakeAsync(() => {
      component.filterForm.get('effDate')?.setValue(moment('2026-01-15'));
      tick();
      component.filterForm.get('effDatePeriod')?.setValue('AFTER');
      tick();
      expect(component.filterForm.get('effDatePeriod')?.hasError('required')).toBeFalsy();
    }));

    it('should return error message for effective date period', fakeAsync(() => {
      component.filterForm.get('effDate')?.setValue(moment('2026-01-15'));
      tick();
      component.filterForm.get('effDatePeriod')?.markAsTouched();
      expect(component.getEffDatePeriodError()).toBe('Period is required');
    }));


    it('should validate termination date period', fakeAsync(() => {
      component.filterForm.get('termDate')?.setValue(moment('2026-12-31'));
      tick();
      component.filterForm.get('termDatePeriod')?.markAsTouched();
      expect(component.getTermDatePeriodError()).toBe('Period is required');
    }));
  });

  describe('Apply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should emit apply with date filters when both period and date are set', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effDatePeriod: 'AFTER',
        effDate: moment('2026-01-15')
      });
      tick();

      component.onApply();

      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.effDatePeriod).toBe('AFTER');
      expect(emitted.effDate).toContain('2026-01-15');
    }));

  });

  describe('Clear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form values on clear', () => {
      component.filterForm.patchValue({
        catalogNumber: 'TEP540004',
        faceLabel: 'E0385000',
        effDatePeriod: 'AFTER',
        effDate: moment('2026-01-15')
      });

      component.onClear();

      expect(component.filterForm.get('catalogNumber')?.value).toBeNull();
      expect(component.filterForm.get('faceLabel')?.value).toBeNull();
      expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effDate')?.value).toBeNull();
    });

  });
  describe('Search Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should show all options when search is cleared', fakeAsync(() => {
      component.catalogNumberSearchControl.setValue('TEP');
      tick();
      component.catalogNumberSearchControl.setValue('');
      tick();
      expect(component.filteredCatalogNumberOptions.length).toBe(2);
    }));

  });

  describe('Date Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should return error message for matDatepickerParse error', () => {
      component.filterForm.get('effDate')?.setErrors({ matDatepickerParse: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });



  });
});
