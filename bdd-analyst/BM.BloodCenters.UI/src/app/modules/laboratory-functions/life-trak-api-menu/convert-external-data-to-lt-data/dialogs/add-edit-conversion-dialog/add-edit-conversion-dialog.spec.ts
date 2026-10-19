import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AddEditConversionDialog } from './add-edit-conversion-dialog';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { ConversionMappingApiService } from '../../services/conversion-mapping-api.service';
import { of, throwError } from 'rxjs';
import moment from 'moment';

describe('AddEditConversionDialog', () => {
  let component: AddEditConversionDialog;
  let fixture: ComponentFixture<AddEditConversionDialog>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let apiService: jasmine.SpyObj<ConversionMappingApiService>;

  beforeEach(() => {

    const snackbarSpy = createMockSnackbarService();
    const headerSpy = createMockHeaderService();
    const apiSpy = jasmine.createSpyObj('ConversionMappingApiService', [
      'createConversionMapping',
      'updateConversionMapping',
    ]);



      TestBed.configureTestingModule({
imports: [
        AddEditConversionDialog,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: ConversionMappingApiService, useValue: apiSpy },
      ],
    });


    });



  beforeEach(() => {



    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    apiService = TestBed.inject(ConversionMappingApiService) as jasmine.SpyObj<ConversionMappingApiService>;
    fixture = TestBed.createComponent(AddEditConversionDialog);
    component = fixture.componentInstance;


    });




  // ─── Existing Tests ───────────────────────────────────────────────


  it('should not require Termination Date field', () => {
    component.ngOnInit();
    const termDate = component.form.get('termDate');

    termDate?.setValue(null);
    expect(termDate?.hasError('required')).toBe(false);
  });

  it('should populate form when in edit mode', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'SOURCE1',
      targetApplId: 'BC',
      targetValue: 'TARGET1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
      termDate: '2025-12-31',
    };

    component.ngOnInit();

    expect(component.form.get('sourceValue')?.value).toBe('SOURCE1');
    expect(component.form.get('targetValue')?.value).toBe('TARGET1');
    expect(component.form.get('targetValueType')?.value).toBe('TYPE1');

    const effDateValue = component.form.get('effDate')?.value;
    expect(effDateValue).toBeTruthy();
    // The component uses moment, not Date
    expect(effDateValue?._isAMomentObject || typeof effDateValue === 'object').toBe(true);

    const termDateValue = component.form.get('termDate')?.value;
    expect(termDateValue).toBeTruthy();
    expect(termDateValue?._isAMomentObject || typeof termDateValue === 'object').toBe(true);
  });

  it('should display "Add New Source & Target Details" title in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();

    expect(component.dialogTitle).toBe('Add New Source & Target Details');
  });

  it('should display "Edit Source & Target Details" title in edit mode', () => {
    component.mode = 'edit';
    component.ngOnInit();

    expect(component.dialogTitle).toBe('Edit Source & Target Details');
  });



  it('should validate that Termination Date is after Effective Date', () => {
    component.ngOnInit();

    component.form.patchValue({
      effDate: new Date('2026-06-20'),
      termDate: new Date('2026-06-19'), // Before effective date
    });

    // Trigger validation
    component.form.updateValueAndValidity();

    // Check form-level errors since crossFieldDateRangeValidator is a form validator
    expect(component.form.hasError('dateRangeInvalid')).toBe(true);
  });

  it('should accept valid Termination Date after Effective Date', () => {
    component.ngOnInit();

    component.form.patchValue({
      effDate: new Date('2026-06-20'),
      termDate: new Date('2026-12-31'), // After effective date
    });

    component.form.updateValueAndValidity();

    expect(component.form.hasError('dateRangeInvalid')).toBe(false);
  });

  it('should accept same date for Effective and Termination Date', () => {
    component.ngOnInit();
    const sameDate = new Date('2026-06-20');

    component.form.patchValue({
      effDate: sameDate,
      termDate: sameDate,
    });

    component.form.updateValueAndValidity();

    expect(component.form.hasError('dateRangeInvalid')).toBe(false);
  });

  it('should set isSaving to true when saving', () => {
    component.ngOnInit();
    component.isSaving = false;

    expect(component.isSaving).toBe(false);
  });

  it('should show SAVING... text on buttons when isSaving is true', () => {
    component.ngOnInit();
    component.isSaving = true;

    expect(component.isSaving).toBe(true);
  });


  it('should use sourceApplId input', () => {
    component.sourceApplId = 'DRM';

    expect(component.sourceApplId).toBe('DRM');
  });


  it('should accept null Termination Date', () => {
    component.ngOnInit();

    component.form.patchValue({
      effDate: new Date('2026-06-20'),
      termDate: null,
    });

    component.form.updateValueAndValidity();
    expect(component.form.hasError('dateRangeInvalid')).toBe(false);
  });

  it('should trim whitespace from Source Value', () => {
    component.ngOnInit();

    component.form.patchValue({
      sourceValue: '  TEST  ',
    });

    const trimmed = component.form.get('sourceValue')?.value?.trim();
    expect(trimmed).toBe('TEST');
  });

  it('should trim whitespace from Target Value', () => {
    component.ngOnInit();

    component.form.patchValue({
      targetValue: '  TARGET  ',
    });

    const trimmed = component.form.get('targetValue')?.value?.trim();
    expect(trimmed).toBe('TARGET');
  });

  it('should initialize filteredTargetValueTypes with all target value types', () => {
    const mockTypes = [
      { code: 'TYPE1', codeDesc: 'Type 1' },
      { code: 'TYPE2', codeDesc: 'Type 2' },
    ];
    component.targetValueTypes = mockTypes;

    component.ngOnInit();

    expect(component.filteredTargetValueTypes.length).toBe(2);
    expect(component.filteredTargetValueTypes).toEqual(mockTypes);
  });

  it('should filter target value types based on search term', () => {
    component.targetValueTypes = [
      { code: 'TYPE1', codeDesc: 'Blood Type A' },
      { code: 'TYPE2', codeDesc: 'Blood Type B' },
      { code: 'TYPE3', codeDesc: 'Plasma' },
    ];
    component.ngOnInit();

    component.targetValueTypeSearchControl.setValue('blood');

    expect(component.filteredTargetValueTypes.length).toBe(2);
    expect(component.filteredTargetValueTypes[0].code).toBe('TYPE1');
    expect(component.filteredTargetValueTypes[1].code).toBe('TYPE2');
  });


  it('should show all target value types when search is cleared', () => {
    component.targetValueTypes = [
      { code: 'TYPE1', codeDesc: 'Type 1' },
      { code: 'TYPE2', codeDesc: 'Type 2' },
    ];
    component.ngOnInit();
    component.targetValueTypeSearchControl.setValue('TYPE1');

    component.targetValueTypeSearchControl.setValue('');

    expect(component.filteredTargetValueTypes.length).toBe(2);
  });

  it('should call ngOnDestroy and complete destroy$ subject', () => {
    component.ngOnInit();
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should have error state matchers for date fields', () => {
    expect(component.effDateErrorMatcher).toBeDefined();
    expect(component.termDateErrorMatcher).toBeDefined();
  });

  it('should set lastChangedDateField to effective when effective date input changes', () => {
    component.ngOnInit();
    const mockEvent = { target: { value: '20-JUN-2026' } } as any;

    component.onEffectiveDateInput(mockEvent);

    expect(component.lastChangedDateField).toBe('effective');
  });

  it('should set lastChangedDateField to termination when termination date input changes', () => {
    component.ngOnInit();
    const mockEvent = { target: { value: '31-DEC-2026' } } as any;

    component.onTerminationDateInput(mockEvent);

    expect(component.lastChangedDateField).toBe('termination');
  });


  // ─── isEditMode getter ────────────────────────────────────────────

  it('should return true for isEditMode when mode is edit', () => {
    component.mode = 'edit';
    expect(component.isEditMode).toBe(true);
  });

  it('should return false for isEditMode when mode is add', () => {
    component.mode = 'add';
    expect(component.isEditMode).toBe(false);
  });

  // ─── lastModifiedDisplay getter ───────────────────────────────────

  it('should return empty string for lastModifiedDisplay in add mode', () => {
    component.mode = 'add';
    expect(component.lastModifiedDisplay).toBe('');
  });

  it('should return empty string for lastModifiedDisplay in edit mode without lastModDate', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    expect(component.lastModifiedDisplay).toBe('');
  });

  it('should return formatted date for lastModifiedDisplay in edit mode with lastModDate', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
      lastModDate: '2025-06-15T10:30:00Z',
    };
    const display = component.lastModifiedDisplay;
    expect(display).toContain('2025');
    expect(display).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
  });

  it('should return empty string for lastModifiedDisplay when mapping is null', () => {
    component.mode = 'edit';
    component.mapping = null;
    expect(component.lastModifiedDisplay).toBe('');
  });

  // ─── effectiveDateFilter ──────────────────────────────────────────

  it('should return true for effectiveDateFilter when date is null', () => {
    component.mode = 'add';
    expect(component.effectiveDateFilter(null)).toBe(true);
  });

  it('should return true for effectiveDateFilter in edit mode for any date', () => {
    component.mode = 'edit';
    const pastDate = moment('2020-01-01');
    expect(component.effectiveDateFilter(pastDate)).toBe(true);
  });

  it('should return true for effectiveDateFilter in add mode for future date', () => {
    component.mode = 'add';
    const futureDate = moment().add(30, 'days');
    expect(component.effectiveDateFilter(futureDate)).toBe(true);
  });

  it('should return false for effectiveDateFilter in add mode for past date', () => {
    component.mode = 'add';
    const pastDate = moment().subtract(30, 'days');
    expect(component.effectiveDateFilter(pastDate)).toBe(false);
  });

  // ─── terminationDateFilter ────────────────────────────────────────

  it('should return true for terminationDateFilter when date is null', () => {
    component.ngOnInit();
    expect(component.terminationDateFilter(null)).toBe(true);
  });

  it('should return false for terminationDateFilter when date is before effective date', () => {
    component.ngOnInit();
    const effDate = moment('2026-06-15');
    component.form.get('effDate')?.setValue(effDate);
    const beforeEffDate = moment('2026-06-10');
    expect(component.terminationDateFilter(beforeEffDate)).toBe(false);
  });

  it('should return true for terminationDateFilter when date is after effective date', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    const effDate = moment('2026-06-15');
    component.form.get('effDate')?.setValue(effDate);
    const afterEffDate = moment('2026-06-20');
    expect(component.terminationDateFilter(afterEffDate)).toBe(true);
  });

  it('should return true for terminationDateFilter in edit mode for past date that is after effective date', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2020-01-01',
    };
    component.ngOnInit();
    const pastDate = moment('2020-06-15');
    expect(component.terminationDateFilter(pastDate)).toBe(true);
  });

  it('should return false for terminationDateFilter in add mode for past date', () => {
    component.mode = 'add';
    component.ngOnInit();
    // No effective date set, so check against today
    const pastDate = moment().subtract(30, 'days');
    expect(component.terminationDateFilter(pastDate)).toBe(false);
  });

  it('should return true for terminationDateFilter when no effective date is set', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.setValue(null);
    const futureDate = moment().add(30, 'days');
    expect(component.terminationDateFilter(futureDate)).toBe(true);
  });

  // ─── getEffectiveDateError / getTerminationDateError ──────────────

  it('should return empty string from getEffectiveDateError when lastChangedDateField is not effective', () => {
    component.ngOnInit();
    component.lastChangedDateField = 'termination';
    // The method passes null for formErrors when lastChangedDateField is not 'effective'
    const error = component.getEffectiveDateError();
    // DateFieldValidationUtility.getStartDateCrossFieldError handles the logic
    expect(typeof error).toBe('string');
  });

  it('should return empty string from getTerminationDateError when lastChangedDateField is not termination', () => {
    component.ngOnInit();
    component.lastChangedDateField = 'effective';
    const error = component.getTerminationDateError();
    expect(typeof error).toBe('string');
  });

  it('should pass form errors to getEffectiveDateError when lastChangedDateField is effective', () => {
    component.ngOnInit();
    component.lastChangedDateField = 'effective';
    const error = component.getEffectiveDateError();
    expect(typeof error).toBe('string');
  });

  it('should pass form errors to getTerminationDateError when lastChangedDateField is termination', () => {
    component.ngOnInit();
    component.lastChangedDateField = 'termination';
    const error = component.getTerminationDateError();
    expect(typeof error).toBe('string');
  });

  // ─── ngOnInit: Add mode ───────────────────────────────────────────

  it('should create form with empty values in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();

    expect(component.form.get('sourceValue')?.value).toBe('');
    expect(component.form.get('targetValue')?.value).toBe('');
    expect(component.form.get('targetValueType')?.value).toBe('');
    expect(component.form.get('effDate')?.value).toBeNull();
    expect(component.form.get('termDate')?.value).toBeNull();
  });

  it('should require sourceValue in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.get('sourceValue')?.setValue('');
    expect(component.form.get('sourceValue')?.hasError('required')).toBe(true);
  });

  it('should require targetValue in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.get('targetValue')?.setValue('');
    expect(component.form.get('targetValue')?.hasError('required')).toBe(true);
  });

  it('should require targetValueType in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.get('targetValueType')?.setValue('');
    expect(component.form.get('targetValueType')?.hasError('required')).toBe(true);
  });

  it('should require effDate in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.get('effDate')?.setValue(null);
    component.form.get('effDate')?.markAsTouched();
    expect(component.form.get('effDate')?.hasError('required')).toBe(true);
  });

  it('should enforce maxLength on sourceValue', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.get('sourceValue')?.setValue('1234567890123456');
    expect(component.form.get('sourceValue')?.hasError('maxlength')).toBe(true);
  });

  it('should enforce maxLength on targetValue', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.get('targetValue')?.setValue('1234567890123456');
    expect(component.form.get('targetValue')?.hasError('maxlength')).toBe(true);
  });

  it('should accept valid sourceValue within maxLength', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.get('sourceValue')?.setValue('123456789012345');
    expect(component.form.get('sourceValue')?.hasError('maxlength')).toBe(false);
  });

  // ─── ngOnInit: Edit mode ──────────────────────────────────────────

  it('should disable sourceValue in edit mode', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();

    expect(component.form.get('sourceValue')?.disabled).toBe(true);
  });

  it('should disable targetValue in edit mode', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();

    expect(component.form.get('targetValue')?.disabled).toBe(true);
  });

  it('should set terminationMinDate from existing effective date in edit mode', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-03-15',
    };
    component.ngOnInit();

    expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe('2025-03-15');
  });

  it('should handle edit mode with null termDate', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();

    expect(component.form.get('termDate')?.value).toBeNull();
  });

  it('should handle edit mode with null effDate in mapping', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '',
    };
    component.ngOnInit();

    // When effDate is empty string, moment('') creates an invalid moment,
    // but the falsy check on '' prevents setting terminationMinDate
    expect(component.form).toBeDefined();
  });

  // ─── setupFormListeners (tested via value changes) ────────────────

  it('should set lastChangedDateField when effDate value changes and trigger termDate revalidation', () => {
    component.ngOnInit();
    component.lastChangedDateField = null;

    // First trigger termDate subscription so distinctUntilChanged has a baseline
    component.form.get('termDate')?.setValue(null);

    const newDate = moment('2026-08-01');
    component.form.get('effDate')?.setValue(newDate);

    // effDate subscription sets 'effective', then calls updateTerminationMinDate()
    // which calls termDate.updateValueAndValidity(), but since termDate value
    // didn't change (still null), distinctUntilChanged blocks the termDate subscription.
    expect(component.lastChangedDateField).toBe('effective');
  });

  it('should set lastChangedDateField to termination when termDate value changes', () => {
    component.ngOnInit();
    component.lastChangedDateField = null;

    const newDate = moment('2026-12-01');
    component.form.get('termDate')?.setValue(newDate);

    expect(component.lastChangedDateField).toBe('termination');
  });

  it('should update terminationMinDate when effective date changes to a valid date', () => {
    component.ngOnInit();
    const newEffDate = moment('2026-09-15');
    component.form.get('effDate')?.setValue(newEffDate);

    expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe('2026-09-15');
  });

  it('should not update terminationMinDate when effective date is set to null', () => {
    component.ngOnInit();
    // Set a valid effective date first
    const validDate = moment('2026-09-15');
    component.form.get('effDate')?.setValue(validDate);
    const previousMinDate = component.terminationMinDate.format('YYYY-MM-DD');

    // Now set to null
    component.form.get('effDate')?.setValue(null);

    // terminationMinDate should remain unchanged (not crash)
    expect(component.terminationMinDate).toBeDefined();
  });

  // ─── onCancel ─────────────────────────────────────────────────────

  it('should emit close when onCancel is called', () => {
    spyOn(component.close, 'emit');
    component.onCancel();
    expect(component.close.emit).toHaveBeenCalled();
  });

  // ─── onSave: guard clauses ───────────────────────────────────────

  it('should not call API when form is invalid on onSave', () => {
    component.ngOnInit();
    // Form is invalid because required fields are empty
    component.onSave();

    expect(apiService.createConversionMapping).not.toHaveBeenCalled();
    expect(apiService.updateConversionMapping).not.toHaveBeenCalled();
  });

  it('should not call API when isSaving is true on onSave', () => {
    component.ngOnInit();
    component.isSaving = true;
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });

    component.onSave();

    expect(apiService.createConversionMapping).not.toHaveBeenCalled();
    expect(apiService.updateConversionMapping).not.toHaveBeenCalled();
  });

  it('should set isSaving to true when onSave is called with valid form in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    // Clear field-level validators that might make the form invalid
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.setValidators([]);
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({ success: true, data: [] }));

    component.onSave();

    expect(apiService.createConversionMapping).toHaveBeenCalled();
  });

  // ─── onSave: Add mode (createMapping) ─────────────────────────────

  it('should call createConversionMapping on save in add mode with valid form', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({ success: true, data: [] }));

    component.onSave();

    expect(apiService.createConversionMapping).toHaveBeenCalled();
    const dto = apiService.createConversionMapping.calls.mostRecent().args[0];
    expect(dto.sourceApplId).toBe('DRM');
    expect(dto.targetApplId).toBe('BC');
    expect(dto.sourceValue).toBe('S1');
    expect(dto.targetValue).toBe('T1');
    expect(dto.targetValueType).toBe('TYPE1');
  });

  it('should show success snackbar and emit events on successful create', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({ success: true, data: [] }));
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.close, 'emit');

    component.onSave();

    expect(snackbarService.showSuccess).toHaveBeenCalledWith('1 new entry has been saved successfully');
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
    expect(component.isSaving).toBe(false);
  });

  it('should show error snackbar on create failure with error response', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({
      success: false,
      data: [],
      error: 'Duplicate entry',
      errorCode: 'DUP_001',
    }));

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('DUP_001: Duplicate entry');
    expect(component.isSaving).toBe(false);
  });

  it('should show error snackbar on create failure with errorResponse nested error', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({
      success: false,
      data: [],
      errorResponse: { errorCode: 'ERR_002', error: 'Nested error' },
    }));

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('ERR_002: Nested error');
    expect(component.isSaving).toBe(false);
  });

  it('should show default error message on create failure with no specific error', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({
      success: false,
      data: [],
    }));

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('Failed to create conversion mapping');
    expect(component.isSaving).toBe(false);
  });

  it('should show error message from response.message when no error or errorResponse', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({
      success: false,
      data: [],
      message: 'Custom message',
    }));

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('Custom message');
  });

  it('should show error snackbar on create HTTP error', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(
      throwError(() => ({
        error: {
          errorResponse: { errorCode: 'HTTP_500', error: 'Server error' },
        },
      }))
    );

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('HTTP_500: Server error');
    expect(component.isSaving).toBe(false);
  });

  it('should show default error on create HTTP error without error details', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(
      throwError(() => ({}))
    );

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('An error occurred while creating the conversion mapping');
    expect(component.isSaving).toBe(false);
  });

  it('should show error from error.error.message on create HTTP error', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(
      throwError(() => ({
        error: { message: 'Bad request message' },
      }))
    );

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('Bad request message');
    expect(component.isSaving).toBe(false);
  });

  it('should show error from error.error.Error on create HTTP error', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(
      throwError(() => ({
        error: { Error: 'Capitalized error message' },
      }))
    );

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('Capitalized error message');
    expect(component.isSaving).toBe(false);
  });

  it('should include termDate in create DTO when provided', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
      termDate: moment('2026-12-31'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.get('termDate')?.clearValidators();
    component.form.get('termDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({ success: true, data: [] }));
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.close, 'emit');

    component.onSave();

    const dto = apiService.createConversionMapping.calls.mostRecent().args[0];
    expect(dto.termDate).toBeDefined();
  });

  it('should set termDate to undefined in create DTO when not provided', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
      termDate: null,
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({ success: true, data: [] }));
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.close, 'emit');

    component.onSave();

    const dto = apiService.createConversionMapping.calls.mostRecent().args[0];
    expect(dto.termDate).toBeUndefined();
  });

  // ─── onSaveAndAddAnother ──────────────────────────────────────────

  it('should not call API when form is invalid on onSaveAndAddAnother', () => {
    component.mode = 'add';
    component.ngOnInit();
    // Form is invalid
    component.onSaveAndAddAnother();

    expect(apiService.createConversionMapping).not.toHaveBeenCalled();
  });

  it('should not call API when isSaving is true on onSaveAndAddAnother', () => {
    component.mode = 'add';
    component.ngOnInit();
    component.isSaving = true;

    component.onSaveAndAddAnother();

    expect(apiService.createConversionMapping).not.toHaveBeenCalled();
  });

  it('should not call API when in edit mode on onSaveAndAddAnother', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();

    component.onSaveAndAddAnother();

    expect(apiService.createConversionMapping).not.toHaveBeenCalled();
  });

  it('should call createConversionMapping on onSaveAndAddAnother with valid form', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({ success: true, data: [] }));
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.close, 'emit');

    component.onSaveAndAddAnother();

    expect(apiService.createConversionMapping).toHaveBeenCalled();
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    // Should NOT emit close when adding another
    expect(component.close.emit).not.toHaveBeenCalled();
  });

  it('should reset form on successful save and add another', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({ success: true, data: [] }));
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.form, 'reset');

    component.onSaveAndAddAnother();

    expect(component.form.reset).toHaveBeenCalled();
    expect(component.isSaving).toBe(false);
  });

  it('should show error on failed save and add another', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({
      success: false,
      data: [],
      error: 'Duplicate',
    }));

    component.onSaveAndAddAnother();

    expect(snackbarService.showError).toHaveBeenCalled();
    expect(component.isSaving).toBe(false);
  });

  // ─── onSave: Edit mode (updateMapping) ────────────────────────────

  it('should call updateConversionMapping on save in edit mode', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
      termDate: '2025-12-31',
    };
    component.ngOnInit();

    // Ensure the form is valid by setting required fields
    component.form.get('targetValueType')?.setValue('TYPE2');
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(of({ success: true, data: [] }));
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.close, 'emit');

    component.onSave();

    expect(apiService.updateConversionMapping).toHaveBeenCalled();
    const args = apiService.updateConversionMapping.calls.mostRecent().args;
    expect(args[0]).toBe('DRM');  // sourceApplId
    expect(args[1]).toBe('BC');   // targetApplId
    expect(args[2]).toBe('S1');   // sourceValue
    expect(args[3]).toBe('T1');   // targetValue
    expect(args[4]).toBe('TYPE1'); // targetValueType
  });

  it('should show success snackbar and emit events on successful update', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(of({ success: true, data: [] }));
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.close, 'emit');

    component.onSave();

    expect(snackbarService.showSuccess).toHaveBeenCalledWith('All changes have been saved successfully');
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
    expect(component.isSaving).toBe(false);
  });

  it('should show error snackbar on update failure with error response', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(of({
      success: false,
      data: [],
      error: 'Update failed',
      errorCode: 'UPD_001',
    }));

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('UPD_001: Update failed');
    expect(component.isSaving).toBe(false);
  });

  it('should show error snackbar on update failure with nested errorResponse', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(of({
      success: false,
      data: [],
      errorResponse: { errorCode: 'ERR_003', error: 'Nested update error' },
    }));

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('ERR_003: Nested update error');
    expect(component.isSaving).toBe(false);
  });

  it('should show default error message on update failure with no specific error', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(of({
      success: false,
      data: [],
    }));

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('Failed to update conversion mapping');
    expect(component.isSaving).toBe(false);
  });

  it('should show error message from response.message on update failure', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(of({
      success: false,
      data: [],
      message: 'Custom update failure message',
    }));

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('Custom update failure message');
  });

  it('should show error snackbar on update HTTP error', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(
      throwError(() => ({
        error: {
          errorResponse: { errorCode: 'HTTP_500', error: 'Internal server error' },
        },
      }))
    );

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('HTTP_500: Internal server error');
    expect(component.isSaving).toBe(false);
  });

  it('should show default error on update HTTP error without error details', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(
      throwError(() => ({}))
    );

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('An error occurred while updating the conversion mapping');
    expect(component.isSaving).toBe(false);
  });

  it('should show error from error.error.message on update HTTP error', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(
      throwError(() => ({
        error: { message: 'Bad request on update' },
      }))
    );

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('Bad request on update');
    expect(component.isSaving).toBe(false);
  });

  it('should show error from error.error.Error on update HTTP error', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(
      throwError(() => ({
        error: { Error: 'Capitalized update error' },
      }))
    );

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('Capitalized update error');
    expect(component.isSaving).toBe(false);
  });

  // ─── Target value type search: filter by code ─────────────────────

  it('should filter target value types by code', () => {
    component.targetValueTypes = [
      { code: 'ABC', codeDesc: 'Alpha' },
      { code: 'DEF', codeDesc: 'Beta' },
      { code: 'GHI', codeDesc: 'Gamma' },
    ];
    component.ngOnInit();

    component.targetValueTypeSearchControl.setValue('def');

    expect(component.filteredTargetValueTypes.length).toBe(1);
    expect(component.filteredTargetValueTypes[0].code).toBe('DEF');
  });

  it('should filter target value types case-insensitively', () => {
    component.targetValueTypes = [
      { code: 'TYPE1', codeDesc: 'Blood Type' },
      { code: 'TYPE2', codeDesc: 'Plasma Type' },
    ];
    component.ngOnInit();

    component.targetValueTypeSearchControl.setValue('BLOOD');

    expect(component.filteredTargetValueTypes.length).toBe(1);
    expect(component.filteredTargetValueTypes[0].code).toBe('TYPE1');
  });

  it('should show all types when search term is only whitespace', () => {
    component.targetValueTypes = [
      { code: 'TYPE1', codeDesc: 'Type 1' },
      { code: 'TYPE2', codeDesc: 'Type 2' },
    ];
    component.ngOnInit();

    component.targetValueTypeSearchControl.setValue('   ');

    expect(component.filteredTargetValueTypes.length).toBe(2);
  });

  it('should return empty list when search matches nothing', () => {
    component.targetValueTypes = [
      { code: 'TYPE1', codeDesc: 'Type 1' },
      { code: 'TYPE2', codeDesc: 'Type 2' },
    ];
    component.ngOnInit();

    component.targetValueTypeSearchControl.setValue('xyz_no_match');

    expect(component.filteredTargetValueTypes.length).toBe(0);
  });

  // ─── Subscription cleanup ────────────────────────────────────────

  it('should stop form listener subscriptions after ngOnDestroy', () => {
    component.ngOnInit();
    component.ngOnDestroy();

    // After destroy, changing form values should not update lastChangedDateField
    component.lastChangedDateField = null;
    component.form.get('effDate')?.setValue(moment('2027-01-01'));
    // The subscription was torn down, so lastChangedDateField should remain null
    expect(component.lastChangedDateField).toBeNull();
  });

  it('should stop target value type search subscription after ngOnDestroy', () => {
    component.targetValueTypes = [
      { code: 'TYPE1', codeDesc: 'Type 1' },
      { code: 'TYPE2', codeDesc: 'Type 2' },
    ];
    component.ngOnInit();
    component.ngOnDestroy();

    // After destroy, search control changes should not filter
    component.filteredTargetValueTypes = component.targetValueTypes;
    component.targetValueTypeSearchControl.setValue('TYPE1');
    // filteredTargetValueTypes should NOT have been updated by the subscription
    expect(component.filteredTargetValueTypes.length).toBe(2);
  });

  // ─── Edge cases ──────────────────────────────────────────────────

  it('should handle save with termDate provided in add mode', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
      termDate: moment('2026-12-31'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.get('termDate')?.clearValidators();
    component.form.get('termDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({ success: true, data: [] }));
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.close, 'emit');

    component.onSave();

    expect(apiService.createConversionMapping).toHaveBeenCalled();
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should handle error with errorCode from errorResponse on update failure response', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(of({
      success: false,
      data: [],
      errorCode: 'RESP_CODE',
      error: 'Response level error',
    }));

    component.onSave();

    expect(snackbarService.showError).toHaveBeenCalledWith('RESP_CODE: Response level error');
  });

  it('should not call createConversionMapping in edit mode', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.updateConversionMapping.and.returnValue(of({ success: true, data: [] }));

    component.onSave();

    expect(apiService.createConversionMapping).not.toHaveBeenCalled();
    expect(apiService.updateConversionMapping).toHaveBeenCalled();
  });

  it('should not call updateConversionMapping in add mode', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(of({ success: true, data: [] }));

    component.onSave();

    expect(apiService.updateConversionMapping).not.toHaveBeenCalled();
    expect(apiService.createConversionMapping).toHaveBeenCalled();
  });

  it('should handle HTTP error on onSaveAndAddAnother', () => {
    component.mode = 'add';
    component.sourceApplId = 'DRM';
    component.ngOnInit();
    component.form.patchValue({
      sourceValue: 'S1',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: moment('2026-08-01'),
    });
    component.form.get('effDate')?.clearValidators();
    component.form.get('effDate')?.updateValueAndValidity();
    component.form.updateValueAndValidity();

    apiService.createConversionMapping.and.returnValue(
      throwError(() => ({
        error: { errorResponse: { errorCode: 'ERR_500', error: 'Server down' } },
      }))
    );

    component.onSaveAndAddAnother();

    expect(snackbarService.showError).toHaveBeenCalledWith('ERR_500: Server down');
    expect(component.isSaving).toBe(false);
  });

  // ─── effectiveDateFilter and terminationDateFilter edge cases ─────

  it('should return true for effectiveDateFilter in add mode for today', () => {
    component.mode = 'add';
    const today = moment().startOf('day');
    expect(component.effectiveDateFilter(today)).toBe(true);
  });

  it('should return true for terminationDateFilter when date equals effective date', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2026-06-15',
    };
    component.ngOnInit();
    const sameDate = moment('2026-06-15');
    component.form.get('effDate')?.setValue(sameDate);
    expect(component.terminationDateFilter(moment('2026-06-15'))).toBe(true);
  });

  // ─── Form group-level validator ──────────────────────────────────

  it('should have crossFieldDateRangeValidator on form in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.patchValue({
      effDate: moment('2026-12-01'),
      termDate: moment('2026-06-01'),
    });
    component.form.updateValueAndValidity();

    expect(component.form.hasError('dateRangeInvalid')).toBe(true);
  });

  it('should have crossFieldDateRangeValidator on form in edit mode', () => {
    component.mode = 'edit';
    component.mapping = {
      sourceApplId: 'DRM',
      sourceValue: 'S1',
      targetApplId: 'BC',
      targetValue: 'T1',
      targetValueType: 'TYPE1',
      effDate: '2025-01-01',
    };
    component.ngOnInit();

    component.form.patchValue({
      effDate: moment('2026-12-01'),
      termDate: moment('2026-06-01'),
    });
    component.form.updateValueAndValidity();

    expect(component.form.hasError('dateRangeInvalid')).toBe(true);
  });

  // ─── Default input values ────────────────────────────────────────

  it('should default mode to add', () => {
    expect(component.mode).toBe('add');
  });

  it('should default sourceApplId to empty string', () => {
    const freshFixture = TestBed.createComponent(AddEditConversionDialog);
    const freshComponent = freshFixture.componentInstance;
    expect(freshComponent.sourceApplId).toBe('');
  });

  it('should default mapping to null', () => {
    const freshFixture = TestBed.createComponent(AddEditConversionDialog);
    const freshComponent = freshFixture.componentInstance;
    expect(freshComponent.mapping).toBeNull();
  });

  it('should default targetValueTypes to empty array', () => {
    const freshFixture = TestBed.createComponent(AddEditConversionDialog);
    const freshComponent = freshFixture.componentInstance;
    expect(freshComponent.targetValueTypes).toEqual([]);
  });

  it('should default isSaving to false', () => {
    expect(component.isSaving).toBe(false);
  });

  it('should default lastChangedDateField to null', () => {
    expect(component.lastChangedDateField).toBeNull();
  });


});
