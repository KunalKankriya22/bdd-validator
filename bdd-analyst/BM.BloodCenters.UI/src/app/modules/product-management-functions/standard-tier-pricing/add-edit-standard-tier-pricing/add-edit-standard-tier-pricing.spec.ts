import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { AddEditStandardTierPricingPanel } from './add-edit-standard-tier-pricing';
import { StandardTierPricingApiService } from '../services/standard-tier-pricing-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoggingService } from '@shared/services/logging.service';
import { StandardTierPricingDto } from '../models/standard-tier-pricing.model';

describe('AddEditStandardTierPricingPanel', () => {
  let component: AddEditStandardTierPricingPanel;
  let fixture: ComponentFixture<AddEditStandardTierPricingPanel>;
  let mockApiService: jasmine.SpyObj<StandardTierPricingApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let chapterChanged$: Subject<void>;

  const mockTierData: StandardTierPricingDto = {
    productType: 'RBC01',
    tier: 1,
    fromDay: 1,
    toDay: 7,
    unitPrice: 200.00,
    effDate: '2024-01-01T00:00:00Z',
    termDate: '2025-12-31T00:00:00Z',
    lastModifiedDate: '2024-06-15T10:30:00Z',
    chapterId: '0001',
    customerId: 'STANDARD'
  };

  const mockTierNoTermDate: StandardTierPricingDto = {
    ...mockTierData,
    termDate: null,
    lastModifiedDate: null
  };

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('StandardTierPricingApiService', [
      'getActiveProducts', 'searchTiers', 'getTierById', 'createTier', 'updateTier', 'deleteTier'
    ]);
    mockSnackbarService = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['error']);
    chapterChanged$ = new Subject<void>();

    const mockHeaderService = {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: () => '+00:00'
    };

    mockApiService.createTier.and.returnValue(of({}));
    mockApiService.updateTier.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [AddEditStandardTierPricingPanel, NoopAnimationsModule],
    })
    .overrideComponent(AddEditStandardTierPricingPanel, {
      set: {
        providers: [
          { provide: StandardTierPricingApiService, useValue: mockApiService },
          { provide: SnackbarService, useValue: mockSnackbarService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: LoggingService, useValue: mockLoggingService }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditStandardTierPricingPanel);
    component = fixture.componentInstance;
    component.productType = 'RBC01';
    component.productLifeSpan = '42 Days';
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize form with correct controls', () => {
      fixture.detectChanges();
      expect(component.editForm.get('tier')).toBeTruthy();
      expect(component.editForm.get('fromDay')).toBeTruthy();
      expect(component.editForm.get('toDay')).toBeTruthy();
      expect(component.editForm.get('unitPrice')).toBeTruthy();
      expect(component.editForm.get('effectiveDate')).toBeTruthy();
      expect(component.editForm.get('terminationDate')).toBeTruthy();
    });

    it('should validate tier range 0-999', () => {
      const tierCtrl = component.editForm.get('tier')!;
      tierCtrl.setValue(-1);
      expect(tierCtrl.hasError('min')).toBeTruthy();
      tierCtrl.setValue(0);
      expect(tierCtrl.valid).toBeTruthy();
      tierCtrl.setValue(999);
      expect(tierCtrl.valid).toBeTruthy();
      tierCtrl.setValue(1000);
      expect(tierCtrl.hasError('max')).toBeTruthy();
    });

    it('should set minDate on init', () => {
      fixture.detectChanges();
      expect(component.minDate).toBeTruthy();
    });

    it('should set error state matchers', () => {
      fixture.detectChanges();
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher).toBeTruthy();
      expect(component.fromDayErrorMatcher).toBeTruthy();
      expect(component.toDayErrorMatcher).toBeTruthy();
    });

    it('should default to add mode', () => {
      expect(component.mode).toBe('add');
    });

    it('should default isSaving to false', () => {
      expect(component.isSaving).toBe(false);
    });
  });

  describe('panelTitle', () => {
    it('should return "Add New Tier" in add mode', () => {
      component.mode = 'add';
      expect(component.panelTitle).toBe('Add New Tier');
    });

    it('should return "Edit Tier Details" in edit mode', () => {
      component.mode = 'edit';
      expect(component.panelTitle).toBe('Edit Tier Details');
    });
  });

  describe('effectiveDateDisplay', () => {
    it('should return chapter today in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({ mode: new SimpleChange(null, 'add', true), data: new SimpleChange(null, null, true) });
      expect(component.effectiveDateDisplay).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should return formatted date in edit mode', () => {
      component.mode = 'edit';
      component.data = mockTierData;
      fixture.detectChanges();
      component.ngOnChanges({ mode: new SimpleChange(null, 'edit', true), data: new SimpleChange(null, mockTierData, true) });
      expect(component.effectiveDateDisplay).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should disable effectiveDate control in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnChanges({ mode: new SimpleChange(null, 'add', true), data: new SimpleChange(null, null, true) });
      expect(component.editForm.get('effectiveDate')?.disabled).toBe(true);
    });
  });

  describe('terminationDateDisplay', () => {
    it('should return "-" when no termination date', () => {
      component.mode = 'edit';
      component.data = mockTierNoTermDate;
      fixture.detectChanges();
      component.ngOnChanges({ mode: new SimpleChange(null, 'edit', true), data: new SimpleChange(null, mockTierNoTermDate, true) });
      expect(component.terminationDateDisplay).toBe('-');
    });

    it('should return formatted date when termination date exists', () => {
      component.mode = 'edit';
      component.data = mockTierData;
      fixture.detectChanges();
      component.ngOnChanges({ mode: new SimpleChange(null, 'edit', true), data: new SimpleChange(null, mockTierData, true) });
      expect(component.terminationDateDisplay).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });
  });

  describe('hasPreExistingTermDate', () => {
    it('should return false in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.hasPreExistingTermDate).toBe(false);
    });

    it('should return true in edit mode with termDate', () => {
      component.mode = 'edit';
      component.data = mockTierData;
      fixture.detectChanges();
      component.ngOnChanges({ mode: new SimpleChange(null, 'edit', true), data: new SimpleChange(null, mockTierData, true) });
      expect(component.hasPreExistingTermDate).toBe(true);
    });

    it('should return false in edit mode without termDate', () => {
      component.mode = 'edit';
      component.data = mockTierNoTermDate;
      fixture.detectChanges();
      component.ngOnChanges({ mode: new SimpleChange(null, 'edit', true), data: new SimpleChange(null, mockTierNoTermDate, true) });
      expect(component.hasPreExistingTermDate).toBe(false);
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should require tier field', () => {
      component.editForm.get('tier')?.setValue(null);
      component.editForm.get('tier')?.markAsTouched();
      expect(component.editForm.get('tier')?.hasError('required')).toBe(true);
    });

    it('should validate tier min value', () => {
      component.editForm.get('tier')?.setValue(-1);
      component.editForm.get('tier')?.markAsTouched();
      expect(component.editForm.get('tier')?.hasError('min')).toBe(true);
    });

    it('should require fromDay field', () => {
      component.editForm.get('fromDay')?.setValue(null);
      component.editForm.get('fromDay')?.markAsTouched();
      expect(component.editForm.get('fromDay')?.hasError('required')).toBe(true);
    });

    it('should require toDay field', () => {
      component.editForm.get('toDay')?.setValue(null);
      component.editForm.get('toDay')?.markAsTouched();
      expect(component.editForm.get('toDay')?.hasError('required')).toBe(true);
    });

    it('should validate unitPrice min value', () => {
      component.editForm.get('unitPrice')?.setValue(0);
      component.editForm.get('unitPrice')?.markAsTouched();
      expect(component.editForm.get('unitPrice')?.hasError('min')).toBe(true);
    });

    it('should validate unitPrice max value', () => {
      component.editForm.get('unitPrice')?.setValue(1000000);
      component.editForm.get('unitPrice')?.markAsTouched();
      expect(component.editForm.get('unitPrice')?.hasError('max')).toBe(true);
    });

    it('should require effectiveDate field', () => {
      component.editForm.get('effectiveDate')?.setValue(null);
      component.editForm.get('effectiveDate')?.markAsTouched();
      expect(component.editForm.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('should not require terminationDate field', () => {
      component.editForm.get('terminationDate')?.setValue(null);
      expect(component.editForm.get('terminationDate')?.hasError('required')).toBeFalsy();
    });
  });

  describe('fromDayLessThanToDayValidator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return error when fromDay > toDay', () => {
      component.editForm.patchValue({ fromDay: 10, toDay: 5 });
      expect(component.editForm.hasError('fromDayExceedsToDay')).toBe(true);
    });

    it('should return null when fromDay < toDay', () => {
      component.editForm.patchValue({ fromDay: 1, toDay: 7 });
      expect(component.editForm.hasError('fromDayExceedsToDay')).toBe(false);
    });

    it('should return null when fromDay equals toDay', () => {
      component.editForm.patchValue({ fromDay: 5, toDay: 5 });
      expect(component.editForm.hasError('fromDayExceedsToDay')).toBe(false);
    });

    it('should return null when values are null', () => {
      component.editForm.patchValue({ fromDay: null, toDay: null });
      expect(component.editForm.hasError('fromDayExceedsToDay')).toBe(false);
    });
  });

  describe('error message getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('getTierError', () => {
      it('should return empty string when not touched', () => {
        expect(component.getTierError()).toBe('');
      });

      it('should return required error when empty and touched', () => {
        component.editForm.get('tier')?.markAsTouched();
        component.editForm.get('tier')?.setValue(null);
        expect(component.getTierError()).toBe('Tier is required');
      });

      it('should return min error', () => {
        component.editForm.get('tier')?.markAsTouched();
        component.editForm.get('tier')?.setValue(-1);
        expect(component.getTierError()).toBe('Tier must be at least 0');
      });
    });

    describe('getFromDayError', () => {
      it('should return empty string when not touched', () => {
        expect(component.getFromDayError()).toBe('');
      });

      it('should return required error when empty and touched', () => {
        component.editForm.get('fromDay')?.markAsTouched();
        component.editForm.get('fromDay')?.setValue(null);
        expect(component.getFromDayError()).toBe('Minimum Days to Expiration is required');
      });

      it('should return cross-field error when fromDay > toDay', () => {
        component.editForm.patchValue({ fromDay: 10, toDay: 5 });
        component.editForm.get('fromDay')?.markAsTouched();
        expect(component.getFromDayError()).toBe('Minimum days cannot exceed maximum days');
      });
    });

    describe('getToDayError', () => {
      it('should return empty string when not touched', () => {
        expect(component.getToDayError()).toBe('');
      });

      it('should return required error when empty and touched', () => {
        component.editForm.get('toDay')?.markAsTouched();
        component.editForm.get('toDay')?.setValue(null);
        expect(component.getToDayError()).toBe('Maximum Days till Expiration is required');
      });

      it('should return cross-field error when fromDay > toDay', () => {
        component.editForm.patchValue({ fromDay: 10, toDay: 5 });
        component.editForm.get('toDay')?.markAsTouched();
        expect(component.getToDayError()).toBe('Maximum days cannot be less than minimum days');
      });
    });

    describe('getUnitPriceError', () => {
      it('should return empty string when not touched', () => {
        expect(component.getUnitPriceError()).toBe('');
      });

      it('should return min error', () => {
        component.editForm.get('unitPrice')?.markAsTouched();
        component.editForm.get('unitPrice')?.setValue(0);
        expect(component.getUnitPriceError()).toBe('Unit Price must be greater than 0');
      });

      it('should return max error', () => {
        component.editForm.get('unitPrice')?.markAsTouched();
        component.editForm.get('unitPrice')?.setValue(1000000);
        expect(component.getUnitPriceError()).toBe('Maximum price 999999.99');
      });
    });
  });

  describe('isFormValid', () => {
    describe('add mode', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should return false when form is invalid', () => {
        expect(component.isFormValid).toBe(false);
      });

      it('should return true when form is valid', () => {
        component.editForm.patchValue({
          tier: 1,
          fromDay: 1,
          toDay: 7,
          unitPrice: 200,
          effectiveDate: moment().add(1, 'day')
        });
        if (component.editForm.valid) {
          expect(component.isFormValid).toBe(true);
        }
      });
    });

    describe('edit mode', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = mockTierData;
        fixture.detectChanges();
        component.ngOnChanges({
          mode: new SimpleChange(null, 'edit', true),
          data: new SimpleChange(null, mockTierData, true)
        });
      });

      it('should return false when no fields changed', () => {
        expect(component.isFormValid).toBe(false);
      });

      it('should return true when fromDay changed', () => {
        component.editForm.patchValue({ fromDay: 2 });
        if (component.editForm.valid) {
          expect(component.isFormValid).toBe(true);
        }
      });

      it('should return true when toDay changed', () => {
        component.editForm.patchValue({ toDay: 14 });
        if (component.editForm.valid) {
          expect(component.isFormValid).toBe(true);
        }
      });

      it('should return true when unitPrice changed', () => {
        component.editForm.patchValue({ unitPrice: 300 });
        if (component.editForm.valid) {
          expect(component.isFormValid).toBe(true);
        }
      });

      it('should return true when terminationDate changed', () => {
        component.editForm.patchValue({ terminationDate: moment('2026-06-30') });
        if (component.editForm.valid) {
          expect(component.isFormValid).toBe(true);
        }
      });
    });
  });

  describe('populateForm via ngOnChanges', () => {
    describe('edit mode', () => {
      it('should populate form fields from data', () => {
        component.mode = 'edit';
        component.data = mockTierData;
        fixture.detectChanges();
        component.ngOnChanges({
          mode: new SimpleChange(null, 'edit', true),
          data: new SimpleChange(null, mockTierData, true)
        });

        const formValue = component.editForm.getRawValue();
        expect(formValue.tier).toBe(1);
        expect(formValue.fromDay).toBe(1);
        expect(formValue.toDay).toBe(7);
        expect(formValue.unitPrice).toBe(200);
      });

      it('should disable tier control in edit mode', () => {
        component.mode = 'edit';
        component.data = mockTierData;
        fixture.detectChanges();
        component.ngOnChanges({
          mode: new SimpleChange(null, 'edit', true),
          data: new SimpleChange(null, mockTierData, true)
        });

        expect(component.editForm.get('tier')?.disabled).toBe(true);
      });

      it('should set lastModifiedDisplay when lastModifiedDate present', () => {
        component.mode = 'edit';
        component.data = mockTierData;
        fixture.detectChanges();
        component.ngOnChanges({
          mode: new SimpleChange(null, 'edit', true),
          data: new SimpleChange(null, mockTierData, true)
        });

        expect(component.lastModifiedDisplay).toContain('Last Modified');
      });

      it('should handle null termination date', () => {
        component.mode = 'edit';
        component.data = mockTierNoTermDate;
        fixture.detectChanges();
        component.ngOnChanges({
          mode: new SimpleChange(null, 'edit', true),
          data: new SimpleChange(null, mockTierNoTermDate, true)
        });

        expect(component.editForm.get('terminationDate')?.value).toBeNull();
      });

      it('should disable terminationDate when pre-existing in edit mode', () => {
        component.mode = 'edit';
        component.data = mockTierData;
        fixture.detectChanges();
        component.ngOnChanges({
          mode: new SimpleChange(null, 'edit', true),
          data: new SimpleChange(null, mockTierData, true)
        });

        expect(component.editForm.get('terminationDate')?.disabled).toBe(true);
      });

      it('should keep terminationDate enabled when null in edit mode', () => {
        component.mode = 'edit';
        component.data = mockTierNoTermDate;
        fixture.detectChanges();
        component.ngOnChanges({
          mode: new SimpleChange(null, 'edit', true),
          data: new SimpleChange(null, mockTierNoTermDate, true)
        });

        expect(component.editForm.get('terminationDate')?.enabled).toBe(true);
      });

      it('should mark form as pristine and untouched', () => {
        component.mode = 'edit';
        component.data = mockTierData;
        fixture.detectChanges();
        component.ngOnChanges({
          mode: new SimpleChange(null, 'edit', true),
          data: new SimpleChange(null, mockTierData, true)
        });

        expect(component.editForm.pristine).toBe(true);
        expect(component.editForm.untouched).toBe(true);
      });
    });

    describe('add mode', () => {
      it('should reset form in add mode', () => {
        component.mode = 'edit';
        component.data = mockTierData;
        fixture.detectChanges();
        component.ngOnChanges({
          mode: new SimpleChange(null, 'edit', true),
          data: new SimpleChange(null, mockTierData, true)
        });

        component.mode = 'add';
        component.data = null;
        component.ngOnChanges({
          mode: new SimpleChange('edit', 'add', false),
          data: new SimpleChange(mockTierData, null, false)
        });

        expect(component.editForm.get('tier')?.value).toBeNull();
        expect(component.editForm.get('fromDay')?.value).toBeNull();
        expect(component.editForm.get('tier')?.enabled).toBe(true);
        expect(component.editForm.get('terminationDate')?.enabled).toBe(true);
      });

      it('should clear lastModifiedDisplay', () => {
        component.mode = 'add';
        component.data = null;
        fixture.detectChanges();
        component.ngOnChanges({
          mode: new SimpleChange(null, 'add', true),
          data: new SimpleChange(null, null, true)
        });

        expect(component.lastModifiedDisplay).toBe('');
      });
    });

    it('should not trigger form reset on unrelated input changes', () => {
      fixture.detectChanges();
      const formSpy = spyOn(component.editForm, 'reset');
      component.ngOnChanges({
        productLifeSpan: new SimpleChange(null, '42 Days', true)
      });
      expect(formSpy).not.toHaveBeenCalled();
    });
  });

  describe('onSave - add mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.productType = 'RBC01';
      fixture.detectChanges();
    });

    it('should mark form as touched', () => {
      component.onSave(false);
      expect(component.editForm.touched).toBe(true);
    });

    it('should not call API when form is invalid', () => {
      component.onSave(false);
      expect(mockApiService.createTier).not.toHaveBeenCalled();
    });

    it('should call createTier with correct DTO', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      component.editForm.patchValue({
        tier: 2,
        fromDay: 8,
        toDay: 14,
        unitPrice: 150,
        effectiveDate: futureDate,
        terminationDate: null
      });

      if (component.editForm.valid) {
        component.onSave(false);
        tick();

        expect(mockApiService.createTier).toHaveBeenCalledWith(
          jasmine.objectContaining({
            productType: 'RBC01',
            tier: 2,
            fromDay: 8,
            toDay: 14,
            unitPrice: 150,
            termDate: null
          })
        );
      }
    }));

    it('should emit save on success', fakeAsync(() => {
      const saveSpy = spyOn(component.save, 'emit');
      const futureDate = moment().add(1, 'day');
      component.editForm.patchValue({
        tier: 2,
        fromDay: 8,
        toDay: 14,
        effectiveDate: futureDate
      });

      if (component.editForm.valid) {
        component.onSave(false);
        tick();
        expect(saveSpy).toHaveBeenCalled();
      }
    }));

    it('should show error snackbar on failure', fakeAsync(() => {
      mockApiService.createTier.and.returnValue(throwError(() => new Error('Creation failed')));
      const futureDate = moment().add(1, 'day');
      component.editForm.patchValue({
        tier: 2,
        fromDay: 8,
        toDay: 14,
        effectiveDate: futureDate
      });

      if (component.editForm.valid) {
        component.onSave(false);
        tick();
        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Creation failed');
        expect(mockLoggingService.error).toHaveBeenCalled();
      }
    }));

    it('should reset isSaving on success', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      component.editForm.patchValue({
        tier: 2,
        fromDay: 8,
        toDay: 14,
        effectiveDate: futureDate
      });

      if (component.editForm.valid) {
        component.onSave(false);
        tick();
        expect(component.isSaving).toBe(false);
      }
    }));

    it('should reset isSaving on failure', fakeAsync(() => {
      mockApiService.createTier.and.returnValue(throwError(() => new Error('Failed')));
      const futureDate = moment().add(1, 'day');
      component.editForm.patchValue({
        tier: 2,
        fromDay: 8,
        toDay: 14,
        effectiveDate: futureDate
      });

      if (component.editForm.valid) {
        component.onSave(false);
        tick();
        expect(component.isSaving).toBe(false);
      }
    }));

    it('should show error when productType is null', () => {
      component.productType = null;
      const futureDate = moment().add(1, 'day');
      component.editForm.patchValue({
        tier: 2,
        fromDay: 8,
        toDay: 14,
        effectiveDate: futureDate
      });

      if (component.editForm.valid) {
        component.onSave(false);
        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Product type is missing');
      }
    });
  });

  describe('onSave - createAnother', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.productType = 'RBC01';
      fixture.detectChanges();
    });

    it('should reset form and emit dataChanged on success', fakeAsync(() => {
      const dataChangedSpy = spyOn(component.dataChanged, 'emit');
      const saveSpy = spyOn(component.save, 'emit');
      const futureDate = moment().add(1, 'day');
      component.editForm.patchValue({
        tier: 2,
        fromDay: 8,
        toDay: 14,
        effectiveDate: futureDate
      });

      if (component.editForm.valid) {
        component.onSave(true);
        tick();
        expect(dataChangedSpy).toHaveBeenCalled();
        expect(saveSpy).not.toHaveBeenCalled();
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Tier created successfully. Add another tier.');
      }
    }));
  });

  describe('onSave - edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockTierData;
      component.productType = 'RBC01';
      fixture.detectChanges();
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockTierData, true)
      });
    });

    it('should not call API when no fields changed', () => {
      component.onSave(false);
      expect(mockApiService.updateTier).not.toHaveBeenCalled();
    });

    it('should call updateTier when fields changed', fakeAsync(() => {
      component.editForm.patchValue({ fromDay: 2 });

      if (component.isFormValid) {
        component.onSave(false);
        tick();
        expect(mockApiService.updateTier).toHaveBeenCalledWith(
          'RBC01', 1,
          jasmine.objectContaining({ fromDay: 2 })
        );
      }
    }));

    it('should emit save on success', fakeAsync(() => {
      const saveSpy = spyOn(component.save, 'emit');
      component.editForm.patchValue({ toDay: 14 });

      if (component.isFormValid) {
        component.onSave(false);
        tick();
        expect(saveSpy).toHaveBeenCalled();
      }
    }));

    it('should show error snackbar on failure', fakeAsync(() => {
      mockApiService.updateTier.and.returnValue(throwError(() => new Error('Update failed')));
      component.editForm.patchValue({ fromDay: 2 });

      if (component.isFormValid) {
        component.onSave(false);
        tick();
        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Update failed');
        expect(mockLoggingService.error).toHaveBeenCalled();
      }
    }));
  });

  describe('onClearAll', () => {
    it('should reset form in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.editForm.patchValue({ tier: 5, fromDay: 10, toDay: 20 });
      component.onClearAll();

      expect(component.editForm.get('tier')?.value).toBeNull();
      expect(component.editForm.get('fromDay')?.value).toBeNull();
    });

    it('should repopulate form from original data in edit mode', () => {
      component.mode = 'edit';
      component.data = mockTierData;
      fixture.detectChanges();
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', true),
        data: new SimpleChange(null, mockTierData, true)
      });

      component.editForm.patchValue({ fromDay: 99, toDay: 100 });
      component.onClearAll();

      const formValue = component.editForm.getRawValue();
      expect(formValue.fromDay).toBe(mockTierData.fromDay);
      expect(formValue.toDay).toBe(mockTierData.toDay);
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      fixture.detectChanges();
      const cancelSpy = spyOn(component.cancel, 'emit');
      component.onCancel();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('onlyNumbers', () => {
    it('should allow digit keys', () => {
      const event = new KeyboardEvent('keypress', { which: 50, keyCode: 50 });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow control keys (backspace, tab, escape, enter)', () => {
      [8, 9, 27, 13].forEach(code => {
        const event = new KeyboardEvent('keypress', { which: code, keyCode: code });
        expect(component.onlyNumbers(event)).toBe(true);
      });
    });

    it('should prevent non-numeric keys', () => {
      const event = new KeyboardEvent('keypress', { which: 65, keyCode: 65 });
      spyOn(event, 'preventDefault');
      const result = component.onlyNumbers(event);
      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = moment().subtract(10, 'days');
      expect(component.terminationDateFilter(pastDate)).toBe(false);
    });

    it('should return false for dates before effective date', () => {
      const futureDate = moment().add(30, 'days');
      component.editForm.patchValue({ effectiveDate: futureDate });
      const beforeEff = moment().add(20, 'days');
      expect(component.terminationDateFilter(beforeEff)).toBe(false);
    });

    it('should return true for future dates after effective date', () => {
      const effDate = moment().add(5, 'days');
      component.editForm.patchValue({ effectiveDate: effDate });
      const afterEff = moment().add(30, 'days');
      expect(component.terminationDateFilter(afterEff)).toBe(true);
    });
  });

  describe('tier validation errors', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return max error for tier > 999', () => {
      component.editForm.get('tier')!.setValue(1000);
      component.editForm.get('tier')!.markAsTouched();
      expect(component.getTierError()).toBe('Tier cannot exceed 999');
    });

    it('should return min error for negative tier', () => {
      component.editForm.get('tier')!.setValue(-1);
      component.editForm.get('tier')!.markAsTouched();
      expect(component.getTierError()).toBe('Tier must be at least 0');
    });
  });

  describe('chapter changes', () => {
    it('should recalculate minDate on chapter change', () => {
      fixture.detectChanges();
      const initialMinDate = component.minDate;
      chapterChanged$.next();
      expect(component.minDate).toBeTruthy();
    });
  });

  describe('lifespan validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should validate fromDay min(0) - reject negative', () => {
      component.editForm.get('fromDay')?.setValue(-1);
      component.editForm.get('fromDay')?.markAsTouched();
      expect(component.editForm.get('fromDay')?.hasError('min')).toBe(true);
      expect(component.getFromDayError()).toBe('Minimum days cannot be negative');
    });

    it('should allow fromDay of 0', () => {
      component.editForm.get('fromDay')?.setValue(0);
      component.editForm.get('fromDay')?.markAsTouched();
      expect(component.editForm.get('fromDay')?.hasError('min')).toBe(false);
    });

    it('should validate toDay min(1) - reject 0', () => {
      component.editForm.get('toDay')?.setValue(0);
      component.editForm.get('toDay')?.markAsTouched();
      expect(component.editForm.get('toDay')?.hasError('min')).toBe(true);
      expect(component.getToDayError()).toBe('Maximum days must be greater than 0');
    });

    it('should set max validator on fromDay when lifespan provided', () => {
      component.productLifeSpanValue = 42;
      component.ngOnChanges({
        productLifeSpanValue: new SimpleChange(null, 42, true)
      });

      component.editForm.get('fromDay')?.setValue(42);
      component.editForm.get('fromDay')?.markAsTouched();
      expect(component.editForm.get('fromDay')?.hasError('max')).toBe(true);
      expect(component.getFromDayError()).toBe('Minimum days must be less than life span of the product');
    });

    it('should allow fromDay up to lifespan - 1', () => {
      component.productLifeSpanValue = 42;
      component.ngOnChanges({
        productLifeSpanValue: new SimpleChange(null, 42, true)
      });

      component.editForm.get('fromDay')?.setValue(41);
      component.editForm.get('fromDay')?.markAsTouched();
      expect(component.editForm.get('fromDay')?.hasError('max')).toBe(false);
    });

    it('should set max validator on toDay when lifespan provided', () => {
      component.productLifeSpanValue = 42;
      component.ngOnChanges({
        productLifeSpanValue: new SimpleChange(null, 42, true)
      });

      component.editForm.get('toDay')?.setValue(43);
      component.editForm.get('toDay')?.markAsTouched();
      expect(component.editForm.get('toDay')?.hasError('max')).toBe(true);
      expect(component.getToDayError()).toBe('Maximum days cannot be greater than life span of the product');
    });

    it('should allow toDay up to lifespan', () => {
      component.productLifeSpanValue = 42;
      component.ngOnChanges({
        productLifeSpanValue: new SimpleChange(null, 42, true)
      });

      component.editForm.get('toDay')?.setValue(42);
      component.editForm.get('toDay')?.markAsTouched();
      expect(component.editForm.get('toDay')?.hasError('max')).toBe(false);
    });

    it('should remove max validators when lifespan is null', () => {
      component.productLifeSpanValue = 42;
      component.ngOnChanges({
        productLifeSpanValue: new SimpleChange(null, 42, true)
      });

      component.productLifeSpanValue = null;
      component.ngOnChanges({
        productLifeSpanValue: new SimpleChange(42, null, false)
      });

      component.editForm.get('fromDay')?.setValue(100);
      component.editForm.get('fromDay')?.markAsTouched();
      expect(component.editForm.get('fromDay')?.hasError('max')).toBe(false);
    });
  });

  describe('tier overlap validation', () => {
    const existingTiers: StandardTierPricingDto[] = [
      {
        productType: 'RBC01', tier: 1, fromDay: 1, toDay: 7,
        unitPrice: 200, effDate: '2024-01-01', termDate: null,
        lastModifiedDate: null, chapterId: '0001', customerId: 'STANDARD'
      },
      {
        productType: 'RBC01', tier: 2, fromDay: 10, toDay: 20,
        unitPrice: 150, effDate: '2024-01-01', termDate: null,
        lastModifiedDate: null, chapterId: '0001', customerId: 'STANDARD'
      }
    ];

    beforeEach(() => {
      component.mode = 'add';
      component.existingTiers = existingTiers;
      fixture.detectChanges();
      component.ngOnChanges({
        existingTiers: new SimpleChange(null, existingTiers, true)
      });
    });

    it('should detect fromDay overlap (7315) when new fromDay falls within existing range', () => {
      component.editForm.patchValue({ fromDay: 3, toDay: 9 });
      component.editForm.get('fromDay')?.markAsTouched();
      expect(component.editForm.hasError('tierOverlap')).toBe(true);
      expect(component.editForm.errors?.['tierOverlap'].errorCode).toBe('7315');
      expect(component.getFromDayError()).toBe('Minimum days overlap another defined tier');
    });

    it('should detect toDay overlap (7316) when new toDay falls within existing range', () => {
      component.editForm.patchValue({ fromDay: 8, toDay: 12 });
      component.editForm.get('toDay')?.markAsTouched();
      expect(component.editForm.hasError('tierOverlap')).toBe(true);
      expect(component.editForm.errors?.['tierOverlap'].errorCode).toBe('7316');
      expect(component.getToDayError()).toBe('Maximum days overlap another defined tier');
    });

    it('should detect encompassing overlap (7317) when new range fully contains existing', () => {
      component.editForm.patchValue({ fromDay: 0, toDay: 25 });
      component.editForm.get('fromDay')?.markAsTouched();
      component.editForm.get('toDay')?.markAsTouched();
      expect(component.editForm.hasError('tierOverlap')).toBe(true);
      const errorCode = component.editForm.errors?.['tierOverlap'].errorCode;
      expect(['7315', '7317']).toContain(errorCode);
    });

    it('should allow non-overlapping range', () => {
      component.editForm.patchValue({ fromDay: 8, toDay: 9 });
      expect(component.editForm.hasError('tierOverlap')).toBe(false);
    });

    it('should exclude self in edit mode', () => {
      component.mode = 'edit';
      component.data = existingTiers[0];
      component.existingTiers = existingTiers;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, existingTiers[0], false),
        existingTiers: new SimpleChange(null, existingTiers, false)
      });

      component.editForm.patchValue({ fromDay: 1, toDay: 7 });
      expect(component.editForm.hasError('tierOverlap')).toBe(false);
    });

    it('should ignore terminated tiers', () => {
      const tiersWithTerminated: StandardTierPricingDto[] = [
        {
          productType: 'RBC01', tier: 1, fromDay: 1, toDay: 7,
          unitPrice: 200, effDate: '2024-01-01', termDate: '2020-01-01',
          lastModifiedDate: null, chapterId: '0001', customerId: 'STANDARD'
        }
      ];
      component.existingTiers = tiersWithTerminated;
      component.ngOnChanges({
        existingTiers: new SimpleChange(existingTiers, tiersWithTerminated, false)
      });

      component.editForm.patchValue({ fromDay: 3, toDay: 5 });
      expect(component.editForm.hasError('tierOverlap')).toBe(false);
    });

    it('should show 7317 error in getToDayError for encompassing overlap', () => {
      component.editForm.patchValue({ fromDay: 9, toDay: 21 });
      component.editForm.get('toDay')?.markAsTouched();

      const overlap = component.editForm.errors?.['tierOverlap'];
      if (overlap && overlap.errorCode === '7317') {
        expect(component.getToDayError()).toBe("Tier encompasses another tier's definition");
      } else if (overlap && overlap.errorCode === '7316') {
        expect(component.getToDayError()).toBe('Maximum days overlap another defined tier');
      }
    });

    it('should update overlap validator when existingTiers changes', () => {
      component.editForm.patchValue({ fromDay: 25, toDay: 30 });
      expect(component.editForm.hasError('tierOverlap')).toBe(false);

      const newTiers: StandardTierPricingDto[] = [
        ...existingTiers,
        {
          productType: 'RBC01', tier: 3, fromDay: 25, toDay: 35,
          unitPrice: 100, effDate: '2024-01-01', termDate: null,
          lastModifiedDate: null, chapterId: '0001', customerId: 'STANDARD'
        }
      ];
      component.existingTiers = newTiers;
      component.ngOnChanges({
        existingTiers: new SimpleChange(existingTiers, newTiers, false)
      });

      expect(component.editForm.hasError('tierOverlap')).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
