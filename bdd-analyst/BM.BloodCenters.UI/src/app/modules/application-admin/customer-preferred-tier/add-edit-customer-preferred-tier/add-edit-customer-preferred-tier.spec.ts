import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { SimpleChange, ChangeDetectorRef, signal } from '@angular/core';
import moment from 'moment';
import { AddEditCustomerPreferredTierComponent } from './add-edit-customer-preferred-tier';
import { CustomerPreferredTierService } from '../services/customer-preferred-tier.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { CustomerPreferredTierModel } from '../models/customer-preferred-tier.model';

describe('AddEditCustomerPreferredTierComponent', () => {
  let component: AddEditCustomerPreferredTierComponent;
  let fixture: ComponentFixture<AddEditCustomerPreferredTierComponent>;
  let service: jasmine.SpyObj<CustomerPreferredTierService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockProductTypes = [
    { productType: 'WB', productTypeDesc: 'Whole Blood' },
    { productType: 'RBC', productTypeDesc: 'Red Blood Cells' }
  ];

  const mockPricingTiers = [
    { tier: 1, fromDay: 0, toDay: 7, unitPrice: 150.00, lifeSpan: 42, lifeSpanInd: 'D' },
    { tier: 2, fromDay: 8, toDay: 14, unitPrice: 120.00, lifeSpan: 42, lifeSpanInd: 'D' }
  ];

  const mockEditData: CustomerPreferredTierModel = {
    productType: 'WB',
    chapterId: 'CH001',
    customerId: 'CUST001',
    tier: 1,
    effDate: new Date('2024-06-01'),
    termDate: new Date('2025-12-31'),
    productTypeDesc: 'Whole Blood',
    customerName: 'ABC Hospital',
    fromDay: 0,
    toDay: 7,
    unitPrice: 150.00,
    lifeSpan: 42,
    lifeSpanInd: 'D',
    lastModifiedDate: new Date('2024-06-01T10:30:00Z')
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('CustomerPreferredTierService', [
      'getProductTypesDropdown',
      'getPricingTiersDropdown',
      'create',
      'update'
    ]);
    snackbarService = jasmine.createSpyObj('SnackbarService', ['showSuccess']);
    headerService = jasmine.createSpyObj('HeaderService', ['getCurrentChapterTimezone'], {
      chapterTimeZone: signal('America/Chicago')
    });
    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);

    service.getProductTypesDropdown.and.returnValue(of(mockProductTypes));
    service.getPricingTiersDropdown.and.returnValue(of(mockPricingTiers));
    service.create.and.returnValue(of({ success: true, message: 'Created' }));
    service.update.and.returnValue(of({ success: true, message: 'Updated' }));

    await TestBed.configureTestingModule({
      imports: [AddEditCustomerPreferredTierComponent, NoopAnimationsModule],
      providers: [
        { provide: CustomerPreferredTierService, useValue: service },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: HeaderService, useValue: headerService },
        { provide: ChangeDetectorRef, useValue: cdr }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditCustomerPreferredTierComponent);
    component = fixture.componentInstance;
  });

  // ─── Initialization ────────────────────────────────────────────────

  describe('Initialization', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with 4 controls', () => {
      expect(component.form.contains('productType')).toBeTrue();
      expect(component.form.contains('tier')).toBeTrue();
      expect(component.form.contains('effectiveDate')).toBeTrue();
      expect(component.form.contains('terminationDate')).toBeTrue();
    });

    it('should have cross-field dateRangeInvalid validator on form', () => {
      const effDate = moment().add(30, 'days');
      const termDate = moment().add(5, 'days');
      component.form.patchValue({
        effectiveDate: effDate,
        terminationDate: termDate
      });
      component.form.updateValueAndValidity();
      expect(component.form.errors?.['dateRangeInvalid']).toBeTrue();
    });

    it('should load product type dropdown options on init', () => {
      expect(service.getProductTypesDropdown).toHaveBeenCalled();
      expect(component.productTypeOptions).toEqual(mockProductTypes);
    });
  });

  // ─── Add Mode ──────────────────────────────────────────────────────

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.customerId = 'CUST001';
      fixture.detectChanges();
    });

    it('should set panel title to "Add Product"', () => {
      expect(component.panelTitle).toBe('Add Product');
    });

    it('should have all form controls enabled', () => {
      expect(component.form.get('productType')?.enabled).toBeTrue();
      expect(component.form.get('tier')?.enabled).toBeTrue();
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
      expect(component.form.get('terminationDate')?.enabled).toBeTrue();
    });

    it('should return isFormDirty as true in add mode', () => {
      expect(component.isFormDirty).toBeTrue();
    });

    it('should call service.create on save with valid form', fakeAsync(() => {
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'WB',
        tier: 1,
        effectiveDate: futureDate
      });
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(service.create).toHaveBeenCalledWith('CUST001', jasmine.objectContaining({
        productType: 'WB',
        tier: 1
      }));
    }));

    it('should emit saveSuccess and closePanel on successful save', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'WB',
        tier: 1,
        effectiveDate: futureDate
      });
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should not call service when form is invalid', () => {
      component.onSave();
      expect(service.create).not.toHaveBeenCalled();
    });

    it('should reset form on save and create another', fakeAsync(() => {
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'WB',
        tier: 1,
        effectiveDate: futureDate
      });
      component.form.updateValueAndValidity();

      component.onSaveAndCreateAnother();
      tick();

      expect(service.create).toHaveBeenCalled();
      expect(component.form.get('productType')?.value).toBeFalsy();
    }));

    it('should set isSaving and savingAction during save', fakeAsync(() => {
      const saveSubject = new Subject();
      service.create.and.returnValue(saveSubject.asObservable() as any);

      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'WB',
        tier: 1,
        effectiveDate: futureDate
      });
      component.form.updateValueAndValidity();

      component.onSave();
      expect(component.isSaving).toBeTrue();
      expect(component.savingAction).toBe('add');

      saveSubject.next({ success: true });
      saveSubject.complete();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(component.savingAction).toBeNull();
    }));

    it('should use default success message when response has no message', fakeAsync(() => {
      service.create.and.returnValue(of({ success: true }));

      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'WB',
        tier: 1,
        effectiveDate: futureDate
      });
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(snackbarService.showSuccess).toHaveBeenCalledWith('New record has been added successfully');
    }));
  });

  // ─── Edit Mode ─────────────────────────────────────────────────────

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.customerId = 'CUST001';
      fixture.detectChanges();
    });

    it('should set panel title to "Edit Product Details"', () => {
      expect(component.panelTitle).toBe('Edit Product Details');
    });

    it('should disable productType control', () => {
      expect(component.form.get('productType')?.disabled).toBeTrue();
    });

    it('should populate editModeValues with formatted display strings', () => {
      expect(component.editModeValues.productType).toBe('WB - Whole Blood');
      expect(component.editModeValues.tier).toBe('1');
      expect(component.editModeValues.effectiveDate).toBeTruthy();
      expect(component.editModeValues.terminationDate).toBeTruthy();
    });

    it('should set lastUpdated from lastModifiedDate', () => {
      expect(component.lastUpdated).toContain('Last Modified:');
    });

    it('should populate selectedTierInfo from data', () => {
      expect(component.selectedTierInfo.fromDay).toBe(0);
      expect(component.selectedTierInfo.toDay).toBe(7);
      expect(component.selectedTierInfo.unitPrice).toBe(150.00);
    });

    it('should load pricing tiers for product type', () => {
      expect(service.getPricingTiersDropdown).toHaveBeenCalledWith('WB', 'CUST001');
    });

    it('should auto-select tier if found in loaded pricing tiers', () => {
      expect(component.form.get('tier')?.value).toBe(1);
    });

    it('should call service.update on save in edit mode', fakeAsync(() => {
      component.form.get('tier')?.setValue(2);
      component.form.get('effectiveDate')?.setErrors(null);
      component.form.get('terminationDate')?.setErrors(null);
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(service.update).toHaveBeenCalledWith(
        'CUST001',
        'WB',
        jasmine.objectContaining({ tier: 2 })
      );
    }));

    it('should return isFormDirty as false when no changes', () => {
      expect(component.isFormDirty).toBeFalse();
    });

    it('should return isFormDirty as true when tier changes', () => {
      component.form.get('tier')?.setValue(2);
      expect(component.isFormDirty).toBeTrue();
    });

    it('should return isFormDirty as true when terminationDate changes', () => {
      component.form.get('terminationDate')?.setValue(moment('2026-06-15'));
      expect(component.isFormDirty).toBeTrue();
    });

    it('should handle edit data without termDate', () => {
      const dataNoTerm: CustomerPreferredTierModel = { ...mockEditData, termDate: null };
      component.data = dataNoTerm;
      component.mode = 'edit';

      // Re-create by triggering ngOnChanges manually
      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', false),
        data: new SimpleChange(null, dataNoTerm, false)
      });

      expect(component.editModeValues.terminationDate).toBe('');
    });

    it('should handle edit data without lastModifiedDate', () => {
      const dataNoLastMod: CustomerPreferredTierModel = { ...mockEditData, lastModifiedDate: null };
      component.data = dataNoLastMod;
      component.mode = 'edit';

      component.ngOnChanges({
        mode: new SimpleChange(null, 'edit', false),
        data: new SimpleChange(null, dataNoLastMod, false)
      });

      expect(component.lastUpdated).toBe('');
    });
  });

  // ─── Form Validation Errors ────────────────────────────────────────

  describe('Form Validation Errors', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    // --- Product Type ---
    it('getProductTypeError: empty when untouched', () => {
      expect(component.getProductTypeError()).toBe('');
    });

    it('getProductTypeError: "Product is required" when touched and empty', () => {
      const control = component.form.get('productType');
      control?.markAsTouched();
      control?.setValue('');
      expect(component.getProductTypeError()).toBe('Product is required');
    });

    it('getProductTypeError: maxlength error message', () => {
      const control = component.form.get('productType');
      control?.markAsTouched();
      control?.setValue('ABCDEFGHIJKLMNOP'); // 16 chars > 15 max
      expect(component.getProductTypeError()).toBe('Product Type cannot exceed 15 characters');
    });

    // --- Tier ---
    it('getTierError: empty when untouched', () => {
      expect(component.getTierError()).toBe('');
    });

    it('getTierError: "Tier is required" when touched and empty', () => {
      const control = component.form.get('tier');
      control?.markAsTouched();
      control?.setValue(null);
      expect(component.getTierError()).toBe('Tier is required');
    });

    // --- Effective Date ---
    it('getEffectiveDateError: empty when untouched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('getEffectiveDateError: "Effective Date is invalid" for matDatepickerParse', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('getEffectiveDateError: "Effective Date is invalid" for invalidDate', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('getEffectiveDateError: "Effective Date is required" when touched and null', () => {
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      control?.setValue(null);
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('getEffectiveDateError: "Effective Date cannot be past date" for effectiveDatePast', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ effectiveDatePast: true });
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
    });

    it('getEffectiveDateError: cross-field error only when lastChangedDateField is "effective"', () => {
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      control?.setValue(moment().add(30, 'days'));
      control?.setErrors(null);
      component.form.setErrors({ dateRangeInvalid: true });
      (component as any).lastChangedDateField = 'effective';
      expect(component.getEffectiveDateError()).toBe('Effective Date must be less than or equal to Termination Date');
    });

    it('getEffectiveDateError: no cross-field error when lastChangedDateField is not "effective"', () => {
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      control?.setValue(moment().add(30, 'days'));
      control?.setErrors(null);
      component.form.setErrors({ dateRangeInvalid: true });
      (component as any).lastChangedDateField = 'termination';
      expect(component.getEffectiveDateError()).toBe('');
    });

    // --- Termination Date ---
    it('getTerminationDateError: empty when untouched', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('getTerminationDateError: "Termination Date is invalid" for matDatepickerParse', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('getTerminationDateError: "Termination Date is required" when required error set', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is required');
    });

    it('getTerminationDateError: "Termination Date is invalid" for invalidDate', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('getTerminationDateError: "Termination Date cannot be past date"', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ terminationDatePast: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be past date');
    });

    it('getTerminationDateError: matDatepickerMin error shows past date message', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ matDatepickerMin: true });
      control?.markAsTouched();
      (component as any).lastChangedDateField = 'termination';
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be past date');
    });

    it('getTerminationDateError: dateRangeInvalid error when lastChangedDateField is not "effective"', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(moment().add(5, 'days'));
      control?.setErrors(null);
      control?.markAsTouched();
      component.form.setErrors({ dateRangeInvalid: true });
      (component as any).lastChangedDateField = 'termination';
      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('getTerminationDateError: suppresses cross-field errors when lastChangedDateField is "effective"', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(moment().add(5, 'days'));
      control?.setErrors(null);
      control?.markAsTouched();
      component.form.setErrors({ dateRangeInvalid: true });
      (component as any).lastChangedDateField = 'effective';
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  // ─── Date Cross-Field Validation ───────────────────────────────────

  describe('Date Cross-Field Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to effective when effective date changes', fakeAsync(() => {
      component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));
      tick();
      expect((component as any).lastChangedDateField).toBe('effective');
    }));

    it('should set lastChangedDateField to termination when termination date changes', fakeAsync(() => {
      component.form.get('terminationDate')?.setValue(moment().add(20, 'days'));
      tick();
      expect((component as any).lastChangedDateField).toBe('termination');
    }));
  });

  // ─── Tier Change Listener ──────────────────────────────────────────

  describe('Tier Change Listener', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      // Set product type so pricing tiers load
      component.form.get('productType')?.setValue('WB');
      tick(300);
    }));

    it('should update selectedTierInfo when tier is selected', fakeAsync(() => {
      component.form.get('tier')?.setValue(1);
      tick();
      expect(component.selectedTierInfo.fromDay).toBe(0);
      expect(component.selectedTierInfo.toDay).toBe(7);
      expect(component.selectedTierInfo.unitPrice).toBe(150.00);
    }));

    it('should clear selectedTierInfo when tier is null', fakeAsync(() => {
      component.form.get('tier')?.setValue(null);
      tick();
      expect(component.selectedTierInfo.fromDay).toBeNull();
      expect(component.selectedTierInfo.toDay).toBeNull();
      expect(component.selectedTierInfo.unitPrice).toBeNull();
    }));

    it('should clear selectedTierInfo when tier not found in options', fakeAsync(() => {
      component.form.get('tier')?.setValue(999);
      tick();
      expect(component.selectedTierInfo.fromDay).toBeNull();
      expect(component.selectedTierInfo.toDay).toBeNull();
      expect(component.selectedTierInfo.unitPrice).toBeNull();
    }));
  });

  // ─── Formatting & Display ──────────────────────────────────────────

  describe('Formatting & Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('formatDateTime: should return empty string for null', () => {
      expect(component.formatDateTime(null)).toBe('');
    });

    it('formatDateTime: should return formatted string for valid date', () => {
      const result = component.formatDateTime(new Date('2024-06-01T10:30:00Z'));
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('formatCurrency: should return "-" for null', () => {
      expect(component.formatCurrency(null)).toBe('-');
    });

    it('formatCurrency: should return formatted number', () => {
      expect(component.formatCurrency(150)).toBe('150.00');
    });

    it('getProductTypeLabel: should return "TYPE - Description"', () => {
      const result = component.getProductTypeLabel({ productType: 'WB', productTypeDesc: 'Whole Blood' });
      expect(result).toBe('WB - Whole Blood');
    });
  });

  // ─── Cancel & Clear ────────────────────────────────────────────────

  describe('Cancel & Clear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('onCancel should emit closePanel', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('onClearAll should clear terminationDate and mark untouched', () => {
      component.form.get('terminationDate')?.setValue(moment());
      component.form.get('terminationDate')?.markAsTouched();

      component.onClearAll();

      expect(component.form.get('terminationDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.touched).toBeFalse();
    });
  });

  // ─── Error Handling ────────────────────────────────────────────────

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle save API error', fakeAsync(() => {
      service.create.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');

      const futureDate = moment().add(30, 'days');
      component.form.patchValue({
        productType: 'WB',
        tier: 1,
        effectiveDate: futureDate
      });
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    }));

    it('should handle dropdown load error', fakeAsync(() => {
      service.getProductTypesDropdown.and.returnValue(throwError(() => new Error('Load Error')));

      // Create a new component to trigger ngOnInit with the errored service
      const newFixture = TestBed.createComponent(AddEditCustomerPreferredTierComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.isLoadingOptions).toBeFalse();
    }));

    it('should handle pricing tiers load error', fakeAsync(() => {
      service.getPricingTiersDropdown.and.returnValue(throwError(() => new Error('Tiers Error')));

      component.form.get('productType')?.setValue('WB');
      tick(300);

      expect(component.pricingTierOptions).toEqual([]);
    }));

    it('should handle pricing tiers load when productType is empty', fakeAsync(() => {
      service.getPricingTiersDropdown.calls.reset();
      component.form.get('productType')?.setValue('');
      tick(300);

      expect(component.pricingTierOptions).toEqual([]);
      // Should NOT call the API when productType is empty
      expect(service.getPricingTiersDropdown).not.toHaveBeenCalled();
    }));
  });

  // ─── ngOnChanges ───────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should re-setup panel when mode changes (not firstChange)', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false)
      });
      expect(component.panelTitle).toBe('Edit Product Details');
    });

    it('should reset form when switching to add mode', () => {
      // First enter edit mode
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false)
      });

      // Now switch back to add mode
      component.mode = 'add';
      component.data = null;
      component.ngOnChanges({
        mode: new SimpleChange('edit', 'add', false)
      });

      expect(component.panelTitle).toBe('Add Product');
      expect(component.form.get('productType')?.enabled).toBeTrue();
    });

    it('should not re-setup on firstChange', () => {
      const originalTitle = component.panelTitle;
      component.ngOnChanges({
        mode: new SimpleChange(null, 'add', true)
      });
      // panelTitle should remain unchanged because firstChange is skipped
      expect(component.panelTitle).toBe(originalTitle);
    });
  });

  // ─── Date Input Handlers ───────────────────────────────────────────

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('onEffectiveDateInput should call DateFieldValidationUtility.handleStartDateInput', () => {
      spyOn(DateFieldValidationUtility, 'handleStartDateInput');

      const mockEvent = { target: { value: '01-JAN-2026' } } as unknown as Event;
      component.onEffectiveDateInput(mockEvent);

      expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
        '01-JAN-2026',
        component.form.get('effectiveDate')
      );
    });

    it('onTerminationDateInput should call DateFieldValidationUtility.handleEndDateInput', () => {
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');

      const mockEvent = { target: { value: '31-DEC-2026' } } as unknown as Event;
      component.onTerminationDateInput(mockEvent);

      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '31-DEC-2026',
        component.form.get('terminationDate'),
        false // mode is 'add', so isEditMode = false
      );
    });
  });
});
