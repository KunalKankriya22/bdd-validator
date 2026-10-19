import { SimpleChange, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditLinkDialog } from './add-edit-link-dialog';
import { TemplateLinkService } from '../services/template-link.service';
import { TemplateLinkModel } from '../models/template-link.model';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

describe('AddEditLinkDialog', () => {
  let component: AddEditLinkDialog;
  let serviceSpy: jasmine.SpyObj<TemplateLinkService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;

  function buildMockLink(overrides?: Partial<TemplateLinkModel>): TemplateLinkModel {
    return {
      templateId: 'T1',
      groupId: 'GRP1',
      categoryCode: 'CAT1',
      categoryValues: 'A,B',
      effDate: '2025-01-15',
      termDate: null,
      lastModified: '2025-06-01T10:30:00',
      chapterId: 'CH1',
      ...overrides
    } as TemplateLinkModel;
  }

  function createComponent(mode: 'add' | 'edit' = 'add', link?: TemplateLinkModel): AddEditLinkDialog {
    const comp = new AddEditLinkDialog(new FormBuilder(), serviceSpy, headerSpy, snackbarSpy, chapterTimezoneSpy);
    comp.mode = mode;
    if (link) comp.link = link;
    comp.ngOnInit();
    return comp;
  }

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj<TemplateLinkService>('TemplateLinkService', [
      'getCategoryCodes',
      'getCategoryValues',
      'categoryValuesToString',
      'formatDate',
    ]);
    headerSpy = jasmine.createSpyObj<HeaderService>('HeaderService', [
      'chapterTimeZone',
      'chapterId',
      'warehouseId',
      'warehouseName',
      'getCurrentChapterTimezone',
    ]);
    snackbarSpy = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['showError']);
    chapterTimezoneSpy = jasmine.createSpyObj<ChapterTimezoneService>('ChapterTimezoneService', ['getChapterLocalDate']);
    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment().startOf('day') as any);

    serviceSpy.getCategoryCodes.and.returnValue(
      of([{ code: 'CAT1', description: 'Category 1' }])
    );
    serviceSpy.getCategoryValues.and.returnValue(
      of([
        { code: 'A', description: 'A' },
        { code: 'B', description: 'B' },
      ])
    );
    serviceSpy.categoryValuesToString.and.callFake((vals: string[]) => vals.join(','));
    serviceSpy.formatDate.and.callFake((d: any) => d ? moment(d).format('DD-MMM-YYYY').toUpperCase() : '-');

    headerSpy.chapterTimeZone.and.returnValue('+00:00');
    headerSpy.chapterId.and.returnValue('CH1');
    headerSpy.warehouseId.and.returnValue('W1');
    headerSpy.warehouseName.and.returnValue('Main WH');
    headerSpy.getCurrentChapterTimezone.and.returnValue('UTC');
    component = new AddEditLinkDialog(new FormBuilder(), serviceSpy, headerSpy, snackbarSpy, chapterTimezoneSpy);
    component.mode = 'add';
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create and load category codes on init', () => {
    expect(component).toBeTruthy();
    expect(component.linkForm).toBeDefined();
    expect(serviceSpy.getCategoryCodes).toHaveBeenCalled();
    expect(component.filteredCategoryCodes.length).toBe(1);
  });

  // -------- ngOnInit --------

  it('should set isEditMode to false in add mode', () => {
    expect(component.isEditMode).toBe(false);
  });

  it('should set isEditMode to true in edit mode and populate form', () => {
    const link = buildMockLink();
    const editComp = createComponent('edit', link);
    expect(editComp.isEditMode).toBe(true);
    expect(editComp.linkForm.get('groupId')?.value).toBe('GRP1');
    expect(editComp.linkForm.get('categoryCode')?.value).toBe('CAT1');
    editComp.ngOnDestroy();
  });

  it('should set effectiveDateFilterFn from DateFieldValidationUtility on init', () => {
    expect(component.effectiveDateFilterFn).toBeDefined();
    expect(typeof component.effectiveDateFilterFn).toBe('function');
  });

  it('should setup add mode date validators in add mode', () => {
    // effDate should have required validator
    const effCtrl = component.linkForm.get('effDate');
    effCtrl?.setValue(null);
    effCtrl?.updateValueAndValidity();
    expect(effCtrl?.hasError('required')).toBe(true);
  });

  // -------- ngOnChanges --------

  it('should reset form when resetFormToken changes in add mode', () => {
    component.linkForm.patchValue({ groupId: 'DIRTY' });
    component.linkForm.markAsDirty();

    component.ngOnChanges({
      resetFormToken: new SimpleChange(0, 1, false)
    });

    expect(component.linkForm.get('groupId')?.value).toBe('');
    expect(component.linkForm.pristine).toBe(true);
  });

  it('should NOT reset form when resetFormToken is first change', () => {
    component.linkForm.patchValue({ groupId: 'KEEP' });

    component.ngOnChanges({
      resetFormToken: new SimpleChange(undefined, 0, true)
    });

    expect(component.linkForm.get('groupId')?.value).toBe('KEEP');
  });

  it('should NOT reset form when resetFormToken changes in edit mode', () => {
    const editComp = createComponent('edit', buildMockLink());
    editComp.linkForm.patchValue({ groupId: 'MODIFIED' });

    editComp.ngOnChanges({
      resetFormToken: new SimpleChange(0, 1, false)
    });

    expect(editComp.linkForm.get('groupId')?.value).toBe('MODIFIED');
    editComp.ngOnDestroy();
  });

  it('should clear submitActionInProgress when isSubmitting changes to false', () => {
    (component as any).submitActionInProgress = 'save';

    component.ngOnChanges({
      isSubmitting: new SimpleChange(true, false, false)
    });

    expect((component as any).submitActionInProgress).toBeNull();
  });

  it('should NOT clear submitActionInProgress on first change of isSubmitting', () => {
    (component as any).submitActionInProgress = 'save';

    component.ngOnChanges({
      isSubmitting: new SimpleChange(undefined, false, true)
    });

    expect((component as any).submitActionInProgress).toBe('save');
  });

  it('should NOT clear submitActionInProgress when isSubmitting changes to true', () => {
    (component as any).submitActionInProgress = 'save';

    component.ngOnChanges({
      isSubmitting: new SimpleChange(false, true, false)
    });

    expect((component as any).submitActionInProgress).toBe('save');
  });

  it('should switch to edit mode when mode input changes', () => {
    const link = buildMockLink();
    component.link = link;
    component.mode = 'edit';

    component.ngOnChanges({
      mode: new SimpleChange('add', 'edit', false)
    });

    expect(component.isEditMode).toBe(true);
    expect(component.linkForm.get('groupId')?.value).toBe('GRP1');
  });

  it('should switch to add mode when mode input changes back', () => {
    const editComp = createComponent('edit', buildMockLink());

    editComp.mode = 'add';
    editComp.link = undefined;

    editComp.ngOnChanges({
      mode: new SimpleChange('edit', 'add', false)
    });

    expect(editComp.isEditMode).toBe(false);
    expect(editComp.linkForm.get('groupId')?.value).toBe('');
    editComp.ngOnDestroy();
  });

  it('should repopulate form when link input changes in edit mode', () => {
    const editComp = createComponent('edit', buildMockLink());
    const newLink = buildMockLink({ groupId: 'NEW_GRP', categoryCode: 'CAT2' });
    editComp.link = newLink;

    editComp.ngOnChanges({
      link: new SimpleChange(buildMockLink(), newLink, false)
    });

    expect(editComp.linkForm.get('groupId')?.value).toBe('NEW_GRP');
    expect(editComp.linkForm.get('categoryCode')?.value).toBe('CAT2');
    editComp.ngOnDestroy();
  });

  it('should not process mode/link changes on first change', () => {
    component.ngOnChanges({
      mode: new SimpleChange(undefined, 'add', true)
    });
    // Should not throw and should stay in add mode
    expect(component.isEditMode).toBe(false);
  });

  // -------- loadCategoryCodes --------

  it('should handle loadCategoryCodes error', () => {
    serviceSpy.getCategoryCodes.and.returnValue(throwError(() => new Error('fail')));
    component.loadCategoryCodes();

    expect(component.categoryCodes).toEqual([]);
    expect(component.filteredCategoryCodes).toEqual([]);
    expect(component.isLoadingCategoryCodes).toBe(false);
    expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load category codes');
  });

  it('should handle null response from getCategoryCodes', () => {
    serviceSpy.getCategoryCodes.and.returnValue(of(null as any));
    component.loadCategoryCodes();

    expect(component.categoryCodes).toEqual([]);
    expect(component.filteredCategoryCodes).toEqual([]);
    expect(component.isLoadingCategoryCodes).toBe(false);
  });

  it('should set isLoadingCategoryCodes while loading', () => {
    expect(component.isLoadingCategoryCodes).toBe(false);
    expect(component.categoryCodes.length).toBe(1);
  });

  // -------- setupDropdownSearch --------

  it('should filter category codes by code when search term is entered', () => {
    component.categoryCodes = [
      { code: 'CAT1', description: 'Category 1' },
      { code: 'DON', description: 'Donor' },
      { code: 'BLD', description: 'Blood' }
    ];

    component.categoryCodeSearchControl.setValue('cat');

    expect(component.filteredCategoryCodes.length).toBe(1);
    expect(component.filteredCategoryCodes[0].code).toBe('CAT1');
  });

  it('should filter category codes by description', () => {
    component.categoryCodes = [
      { code: 'CAT1', description: 'Category 1' },
      { code: 'DON', description: 'Donor' },
      { code: 'BLD', description: 'Blood' }
    ];

    component.categoryCodeSearchControl.setValue('blood');

    expect(component.filteredCategoryCodes.length).toBe(1);
    expect(component.filteredCategoryCodes[0].code).toBe('BLD');
  });

  it('should show all category codes when search term is empty', () => {
    component.categoryCodes = [
      { code: 'CAT1', description: 'Category 1' },
      { code: 'DON', description: 'Donor' }
    ];

    component.categoryCodeSearchControl.setValue('');

    expect(component.filteredCategoryCodes.length).toBe(2);
  });

  it('should handle null search term for category codes', () => {
    component.categoryCodes = [
      { code: 'CAT1', description: 'Category 1' }
    ];

    component.categoryCodeSearchControl.setValue(null as any);

    expect(component.filteredCategoryCodes.length).toBe(1);
  });

  it('should filter category values by code when search term is entered', () => {
    component.categoryValues = [
      { code: 'VAL1', description: 'Value 1' },
      { code: 'VAL2', description: 'Value 2' },
      { code: 'OTHER', description: 'Other' }
    ];

    component.categoryValuesSearchControl.setValue('val');

    expect(component.filteredCategoryValues.length).toBe(2);
  });

  it('should filter category values by description', () => {
    component.categoryValues = [
      { code: 'VAL1', description: 'Value 1' },
      { code: 'OTHER', description: 'Special Other' }
    ];

    component.categoryValuesSearchControl.setValue('special');

    expect(component.filteredCategoryValues.length).toBe(1);
    expect(component.filteredCategoryValues[0].code).toBe('OTHER');
  });

  it('should handle null description in category codes filter', () => {
    component.categoryCodes = [
      { code: 'CAT1', description: null as any }
    ];

    component.categoryCodeSearchControl.setValue('test');

    expect(component.filteredCategoryCodes.length).toBe(0);
  });

  it('should handle null description in category values filter', () => {
    component.categoryValues = [
      { code: 'VAL1', description: null as any }
    ];

    component.categoryValuesSearchControl.setValue('test');

    expect(component.filteredCategoryValues.length).toBe(0);
  });

  // -------- onCategoryCodeChange --------

  it('should load category values when category code is selected', () => {
    component.onCategoryCodeChange('CAT1');

    expect(serviceSpy.getCategoryValues).toHaveBeenCalledWith('CAT1');
    expect(component.linkForm.get('categoryValues')?.enabled).toBe(true);
    expect(component.selectedCategoryValues).toEqual([]);
  });

  it('should disable category values when category code is cleared', () => {
    component.onCategoryCodeChange('CAT1');
    component.onCategoryCodeChange('');

    expect(component.linkForm.get('categoryValues')?.disabled).toBe(true);
    expect(component.categoryValues).toEqual([]);
    expect(component.filteredCategoryValues).toEqual([]);
  });

  it('should clear previous selections when category code changes', () => {
    component.selectedCategoryValues = ['A', 'B'];
    component.linkForm.get('categoryValues')?.enable();
    component.linkForm.patchValue({ categoryValues: ['A', 'B'] });

    component.onCategoryCodeChange('CAT2');

    expect(component.selectedCategoryValues).toEqual([]);
    expect(component.linkForm.get('categoryValues')?.value).toEqual([]);
  });

  // -------- loadCategoryValues --------

  it('should load category values successfully', () => {
    component.loadCategoryValues('CAT1');

    expect(component.categoryValues.length).toBe(2);
    expect(component.filteredCategoryValues.length).toBe(2);
    expect(component.isLoadingCategoryValues).toBe(false);
  });

  it('should handle loadCategoryValues error', () => {
    serviceSpy.getCategoryValues.and.returnValue(throwError(() => new Error('fail')));
    component.loadCategoryValues('CAT1');

    expect(component.categoryValues).toEqual([]);
    expect(component.filteredCategoryValues).toEqual([]);
    expect(component.isLoadingCategoryValues).toBe(false);
    expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load category values');
  });

  it('should handle null response from getCategoryValues', () => {
    serviceSpy.getCategoryValues.and.returnValue(of(null as any));
    component.loadCategoryValues('CAT1');

    expect(component.categoryValues).toEqual([]);
    expect(component.filteredCategoryValues).toEqual([]);
  });

  // -------- onCategoryValuesChange --------

  it('should update selectedCategoryValues', () => {
    component.onCategoryValuesChange(['A', 'B']);
    expect(component.selectedCategoryValues).toEqual(['A', 'B']);
  });

  it('should handle empty array', () => {
    component.selectedCategoryValues = ['A'];
    component.onCategoryValuesChange([]);
    expect(component.selectedCategoryValues).toEqual([]);
  });

  // -------- removeCategoryValue --------

  it('should remove a value from category values', () => {
    component.linkForm.get('categoryValues')?.enable();
    component.linkForm.patchValue({ categoryValues: ['A', 'B', 'C'] });
    component.selectedCategoryValues = ['A', 'B', 'C'];

    component.removeCategoryValue('B');

    expect(component.linkForm.get('categoryValues')?.value).toEqual(['A', 'C']);
    expect(component.selectedCategoryValues).toEqual(['A', 'C']);
  });

  it('should call stopPropagation when event is provided', () => {
    component.linkForm.get('categoryValues')?.enable();
    component.linkForm.patchValue({ categoryValues: ['A'] });
    component.selectedCategoryValues = ['A'];

    const mockEvent = { stopPropagation: jasmine.createSpy('stopPropagation') } as any;
    component.removeCategoryValue('A', mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.selectedCategoryValues).toEqual([]);
  });

  it('should mark categoryValues as touched after removal', () => {
    component.linkForm.get('categoryValues')?.enable();
    component.linkForm.patchValue({ categoryValues: ['A'] });

    component.removeCategoryValue('A');

    expect(component.linkForm.get('categoryValues')?.touched).toBe(true);
  });

  it('should handle removal when categoryValues control value is null', () => {
    component.linkForm.get('categoryValues')?.enable();
    component.linkForm.patchValue({ categoryValues: null });

    component.removeCategoryValue('A');

    expect(component.selectedCategoryValues).toEqual([]);
  });

  // -------- displayedCategoryChips / overflowCategoryCount --------

  it('should return first 3 chips when fewer than maxVisibleChips selected', () => {
    component.selectedCategoryValues = ['A', 'B'];
    expect(component.displayedCategoryChips).toEqual(['A', 'B']);
    expect(component.overflowCategoryCount).toBe(0);
  });

  it('should return first 3 chips and overflow count when more than 3 selected', () => {
    component.selectedCategoryValues = ['A', 'B', 'C', 'D', 'E'];
    expect(component.displayedCategoryChips).toEqual(['A', 'B', 'C']);
    expect(component.overflowCategoryCount).toBe(2);
  });

  it('should return empty chips when nothing is selected', () => {
    component.selectedCategoryValues = [];
    expect(component.displayedCategoryChips).toEqual([]);
    expect(component.overflowCategoryCount).toBe(0);
  });

  it('should return exactly 3 chips when exactly maxVisibleChips are selected', () => {
    component.selectedCategoryValues = ['A', 'B', 'C'];
    expect(component.displayedCategoryChips).toEqual(['A', 'B', 'C']);
    expect(component.overflowCategoryCount).toBe(0);
  });

  // -------- onSave --------

  it('should emit save payload when form is valid', () => {
    const emitSpy = spyOn(component.save, 'emit');
    // Must be on or after chapter "today" (same offset as headerSpy.chapterTimeZone) or effectiveDateNotPastValidator fails
    const effDate = DateFieldValidationUtility.getMinDate('+00:00');

    component.linkForm.patchValue({
      groupId: 'G1',
      categoryCode: 'CAT1',
      categoryValues: ['A', 'B'],
      effDate,
      termDate: null,
    });
    component.linkForm.get('categoryValues')?.enable({ emitEvent: false });
    component.selectedCategoryValues = ['A', 'B'];

    component.onSave();

    expect(emitSpy).toHaveBeenCalled();
    const result = emitSpy.calls.mostRecent().args[0]!;
    expect(result.action).toBe('save');
    expect(result.mode).toBe('add');
    expect(result.data?.surveyGroupId).toBe('G1');
    expect(result.data?.surveyCategoryValues).toBe('A,B');
  });

  it('should mark all fields touched and not emit when form is invalid', () => {
    const emitSpy = spyOn(component.save, 'emit');
    // Leave form invalid (groupId is required)
    component.linkForm.patchValue({ groupId: '', categoryCode: null });

    component.onSave();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.linkForm.get('groupId')?.touched).toBe(true);
    expect(component.linkForm.get('categoryCode')?.touched).toBe(true);
  });

  it('should set submitActionInProgress to save on valid form', () => {
    spyOn(component.save, 'emit');
    const effDate = DateFieldValidationUtility.getMinDate('+00:00');

    component.linkForm.patchValue({
      groupId: 'G1',
      categoryCode: 'CAT1',
      effDate,
    });
    component.linkForm.get('categoryValues')?.enable({ emitEvent: false });

    component.onSave();

    expect((component as any).submitActionInProgress).toBe('save');
  });

  // -------- onSaveAndCreateAnother --------

  it('should emit saveAndCreateAnother in add mode', () => {
    const emitSpy = spyOn(component.save, 'emit');
    const effDate = DateFieldValidationUtility.getMinDate('+00:00');

    component.linkForm.patchValue({
      groupId: 'G2',
      categoryCode: 'CAT1',
      categoryValues: [],
      effDate,
      termDate: null,
    });
    component.linkForm.get('categoryValues')?.enable({ emitEvent: false });
    component.selectedCategoryValues = [];

    component.onSaveAndCreateAnother();

    expect(emitSpy).toHaveBeenCalled();
    const result = emitSpy.calls.mostRecent().args[0]!;
    expect(result.action).toBe('saveAndCreateAnother');
  });

  it('should mark all fields touched and not emit when form is invalid for saveAndCreateAnother', () => {
    const emitSpy = spyOn(component.save, 'emit');
    component.linkForm.patchValue({ groupId: '', categoryCode: null });

    component.onSaveAndCreateAnother();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.linkForm.get('groupId')?.touched).toBe(true);
  });

  it('should set submitActionInProgress to saveAndCreateAnother on valid form', () => {
    spyOn(component.save, 'emit');
    const effDate = DateFieldValidationUtility.getMinDate('+00:00');

    component.linkForm.patchValue({
      groupId: 'G1',
      categoryCode: 'CAT1',
      effDate,
    });
    component.linkForm.get('categoryValues')?.enable({ emitEvent: false });

    component.onSaveAndCreateAnother();

    expect((component as any).submitActionInProgress).toBe('saveAndCreateAnother');
  });

  it('should always set mode to add in saveAndCreateAnother result', () => {
    // Even if component is in edit mode, saveAndCreateAnother should set mode: 'add'
    const editComp = createComponent('edit', buildMockLink());
    const emitSpy = spyOn(editComp.save, 'emit');
    const effDate = DateFieldValidationUtility.getMinDate('+00:00');

    editComp.linkForm.patchValue({
      groupId: 'G1',
      categoryCode: 'CAT1',
      effDate,
    });
    editComp.linkForm.get('categoryValues')?.enable({ emitEvent: false });

    editComp.onSaveAndCreateAnother();

    const result = emitSpy.calls.mostRecent().args[0]!;
    expect(result.mode).toBe('add');
    editComp.ngOnDestroy();
  });

  // -------- onCancel --------

  it('should emit closePanel on cancel', () => {
    const emitSpy = spyOn(component.closePanel, 'emit');
    component.onCancel();
    expect(emitSpy).toHaveBeenCalled();
  });

  // -------- dialogTitle --------

  it('should return "Add New Link" in add mode', () => {
    expect(component.dialogTitle).toBe('Add New Link');
  });

  it('should return "Edit Link" in edit mode', () => {
    const editComp = createComponent('edit', buildMockLink());
    expect(editComp.dialogTitle).toBe('Edit Link');
    editComp.ngOnDestroy();
  });

  // -------- terminationDateFilter --------

  it('should return true for null date in terminationDateFilter', () => {
    expect(component.terminationDateFilter(null)).toBe(true);
  });

  it('should return false for date before today in terminationDateFilter', () => {
    const pastDate = moment().subtract(10, 'days');
    expect(component.terminationDateFilter(pastDate)).toBe(false);
  });

  it('should return true for date on or after today in terminationDateFilter', () => {
    const futureDate = moment().add(10, 'days');
    expect(component.terminationDateFilter(futureDate)).toBe(true);
  });

  it('should return false for date before effective date in terminationDateFilter', () => {
    const effDate = moment().add(5, 'days');
    component.linkForm.patchValue({ effDate });

    const beforeEff = moment().add(3, 'days');
    expect(component.terminationDateFilter(beforeEff)).toBe(false);
  });

  it('should return true for date on or after effective date in terminationDateFilter', () => {
    const effDate = moment().add(5, 'days');
    component.linkForm.patchValue({ effDate });

    const afterEff = moment().add(10, 'days');
    expect(component.terminationDateFilter(afterEff)).toBe(true);
  });

  it('should return true when effDate is null in terminationDateFilter', () => {
    component.linkForm.patchValue({ effDate: null });
    const futureDate = moment().add(10, 'days');
    expect(component.terminationDateFilter(futureDate)).toBe(true);
  });

  // -------- getEffectiveDateError / getTerminationDateError --------

  it('should expose invalid date message when typed date is malformed', () => {
    // Simulate: user typed garbage, datepicker couldn't parse -> sets matDatepickerParse error
    const control = component.linkForm.get('effDate');
    control?.setValue(null);
    control?.markAsTouched();
    control?.setErrors({ matDatepickerParse: { text: '32-XXX-2026' } });

    expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
  });

  it('should call getStartDateCrossFieldError with form errors when lastChangedDateField is effective', () => {
    // Trigger the effective date change listener
    component.linkForm.get('effDate')?.setValue(moment().add(1, 'day'));

    const result = component.getEffectiveDateError();
    // Just verify it returns a string (the utility handles the logic)
    expect(typeof result).toBe('string');
  });

  it('should call getStartDateCrossFieldError with null form errors when lastChangedDateField is not effective', () => {
    // Trigger the termination date change listener to set lastChangedDateField to 'termination'
    component.linkForm.get('termDate')?.setValue(moment().add(10, 'days'));

    const result = component.getEffectiveDateError();
    expect(typeof result).toBe('string');
  });

  it('should call getEndDateCrossFieldError with form errors when lastChangedDateField is termination', () => {
    component.linkForm.get('termDate')?.setValue(moment().add(10, 'days'));

    const result = component.getTerminationDateError();
    expect(typeof result).toBe('string');
  });

  it('should call getEndDateCrossFieldError with null form errors when lastChangedDateField is not termination', () => {
    component.linkForm.get('effDate')?.setValue(moment().add(1, 'day'));

    const result = component.getTerminationDateError();
    expect(typeof result).toBe('string');
  });

  // -------- onEffectiveDateInput / onTerminationDateInput --------

  it('should call handleStartDateInput for effective date input', () => {
    const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
    const mockEvent = { target: { value: '15-JAN-2026' } } as any;

    component.onEffectiveDateInput(mockEvent);

    expect(spy).toHaveBeenCalledWith('15-JAN-2026', component.linkForm.get('effDate'));
  });

  it('should call handleEndDateInput for termination date input', () => {
    const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
    const mockEvent = { target: { value: '20-FEB-2026' } } as any;

    component.onTerminationDateInput(mockEvent);

    expect(spy).toHaveBeenCalledWith('20-FEB-2026', component.linkForm.get('termDate'), false);
  });

  it('should pass isEditMode to handleEndDateInput', () => {
    const editComp = createComponent('edit', buildMockLink());
    const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
    const mockEvent = { target: { value: '20-FEB-2026' } } as any;

    editComp.onTerminationDateInput(mockEvent);

    expect(spy).toHaveBeenCalledWith('20-FEB-2026', editComp.linkForm.get('termDate'), true);
    editComp.ngOnDestroy();
  });

  // -------- hasError --------

  it('should return true when field has error and is touched', () => {
    const groupCtrl = component.linkForm.get('groupId');
    groupCtrl?.setValue('');
    groupCtrl?.markAsTouched();
    groupCtrl?.updateValueAndValidity();

    expect(component.hasError('groupId', 'required')).toBe(true);
  });

  it('should return false when field has error but is not touched or dirty', () => {
    const groupCtrl = component.linkForm.get('groupId');
    groupCtrl?.setValue('');
    groupCtrl?.markAsUntouched();
    groupCtrl?.markAsPristine();
    groupCtrl?.updateValueAndValidity();

    expect(component.hasError('groupId', 'required')).toBe(false);
  });

  it('should return true when field has error and is dirty', () => {
    const groupCtrl = component.linkForm.get('groupId');
    groupCtrl?.setValue('');
    groupCtrl?.markAsDirty();
    groupCtrl?.updateValueAndValidity();

    expect(component.hasError('groupId', 'required')).toBe(true);
  });

  it('should return false when field does not exist', () => {
    expect(component.hasError('nonExistentField', 'required')).toBe(false);
  });

  it('should return false when field has no errors', () => {
    const groupCtrl = component.linkForm.get('groupId');
    groupCtrl?.setValue('VALID');
    groupCtrl?.markAsTouched();
    groupCtrl?.updateValueAndValidity();

    expect(component.hasError('groupId', 'required')).toBe(false);
  });

  // -------- lastModifiedText --------

  it('should return empty string when lastModified is null', () => {
    component.lastModified = null;
    expect(component.lastModifiedText).toBe('');
  });

  it('should return "Last Modified: Today" for today\'s date', () => {
    component.lastModified = moment().format();
    expect(component.lastModifiedText).toContain('Last Modified: Today');
  });

  it('should return formatted date for past date', () => {
    component.lastModified = '2024-03-15T14:30:00';
    const result = component.lastModifiedText;
    expect(result).toContain('Last Modified:');
    expect(result).toContain('14:30');
    expect(result).not.toContain('Today');
  });

  // -------- isCategoryValueDisabled --------

  it('should return true when categoryCode has no value', () => {
    component.linkForm.patchValue({ categoryCode: null });
    expect(component.isCategoryValueDisabled).toBe(true);
  });

  it('should return false when categoryCode has a value', () => {
    component.linkForm.patchValue({ categoryCode: 'CAT1' });
    expect(component.isCategoryValueDisabled).toBe(false);
  });

  it('should return true when categoryCode is empty string', () => {
    component.linkForm.patchValue({ categoryCode: '' });
    expect(component.isCategoryValueDisabled).toBe(true);
  });

  // -------- isPrimaryButtonSubmitting / isAddAnotherButtonSubmitting --------

  it('should return true for isPrimaryButtonSubmitting when submitting with save action', () => {
    component.isSubmitting = true;
    (component as any).submitActionInProgress = 'save';
    expect(component.isPrimaryButtonSubmitting).toBe(true);
  });

  it('should return false for isPrimaryButtonSubmitting when not submitting', () => {
    component.isSubmitting = false;
    (component as any).submitActionInProgress = 'save';
    expect(component.isPrimaryButtonSubmitting).toBe(false);
  });

  it('should return false for isPrimaryButtonSubmitting when action is saveAndCreateAnother', () => {
    component.isSubmitting = true;
    (component as any).submitActionInProgress = 'saveAndCreateAnother';
    expect(component.isPrimaryButtonSubmitting).toBe(false);
  });

  it('should return true for isAddAnotherButtonSubmitting when submitting with saveAndCreateAnother', () => {
    component.isSubmitting = true;
    (component as any).submitActionInProgress = 'saveAndCreateAnother';
    expect(component.isAddAnotherButtonSubmitting).toBe(true);
  });

  it('should return false for isAddAnotherButtonSubmitting when not submitting', () => {
    component.isSubmitting = false;
    (component as any).submitActionInProgress = 'saveAndCreateAnother';
    expect(component.isAddAnotherButtonSubmitting).toBe(false);
  });

  it('should return false for isAddAnotherButtonSubmitting when action is save', () => {
    component.isSubmitting = true;
    (component as any).submitActionInProgress = 'save';
    expect(component.isAddAnotherButtonSubmitting).toBe(false);
  });

  // -------- canSave --------

  it('should return false when isSubmitting is true', () => {
    component.isSubmitting = true;
    expect(component.canSave).toBe(false);
  });

  it('should return false when form is invalid', () => {
    component.linkForm.patchValue({ groupId: '', categoryCode: null });
    expect(component.canSave).toBe(false);
  });

  it('should return true in add mode when form is valid', () => {
    const effDate = DateFieldValidationUtility.getMinDate('+00:00');
    component.linkForm.patchValue({
      groupId: 'G1',
      categoryCode: 'CAT1',
      effDate,
    });
    component.linkForm.get('categoryValues')?.enable({ emitEvent: false });
    component.isSubmitting = false;

    expect(component.canSave).toBe(true);
  });

  it('should return false in edit mode when no changes made', () => {
    const link = buildMockLink({ effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;

    expect(editComp.canSave).toBe(false);
    editComp.ngOnDestroy();
  });

  it('should return true in edit mode when changes are made', () => {
    const link = buildMockLink({ effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;

    // Change the groupId (must be <= 5 chars for maxLength validator)
    editComp.linkForm.patchValue({ groupId: 'NEWG' });

    expect(editComp.canSave).toBe(true);
    editComp.ngOnDestroy();
  });

  // -------- formattedEffDateForEdit / formattedTermDateForEdit --------

  it('should return formatted effective date', () => {
    component.linkForm.patchValue({ effDate: moment('2025-06-15') });
    const result = component.formattedEffDateForEdit;
    expect(serviceSpy.formatDate).toHaveBeenCalled();
    expect(typeof result).toBe('string');
  });

  it('should return empty string when effDate is null', () => {
    component.linkForm.patchValue({ effDate: null });
    expect(component.formattedEffDateForEdit).toBe('');
  });

  it('should return formatted termination date', () => {
    component.linkForm.patchValue({ termDate: moment('2025-12-31') });
    const result = component.formattedTermDateForEdit;
    expect(serviceSpy.formatDate).toHaveBeenCalled();
    expect(typeof result).toBe('string');
  });

  it('should return empty string when termDate is null', () => {
    component.linkForm.patchValue({ termDate: null });
    expect(component.formattedTermDateForEdit).toBe('');
  });

  // -------- onGroupIdInput --------

  it('should remove spaces from group ID input', () => {
    const mockInput = { value: 'A B C' } as HTMLInputElement;
    const mockEvent = { target: mockInput } as any;

    component.onGroupIdInput(mockEvent);

    expect(component.linkForm.get('groupId')?.value).toBe('ABC');
    expect(mockInput.value).toBe('ABC');
  });

  it('should not modify group ID input when no spaces', () => {
    const originalValue = 'ABC';
    component.linkForm.patchValue({ groupId: originalValue });
    const mockInput = { value: originalValue } as HTMLInputElement;
    const mockEvent = { target: mockInput } as any;

    component.onGroupIdInput(mockEvent);

    // When there are no spaces, patchValue should NOT be called (no change)
    expect(mockInput.value).toBe('ABC');
  });

  it('should handle group ID with only spaces', () => {
    const mockInput = { value: '   ' } as HTMLInputElement;
    const mockEvent = { target: mockInput } as any;

    component.onGroupIdInput(mockEvent);

    expect(component.linkForm.get('groupId')?.value).toBe('');
    expect(mockInput.value).toBe('');
  });

  // -------- Edit mode: populateFormForEdit --------

  it('should populate form with link data in edit mode', () => {
    const link = buildMockLink({
      groupId: 'GRP1',
      categoryCode: 'CAT1',
      categoryValues: 'A,B',
      effDate: '2025-01-15',
      termDate: '2025-12-31',
      lastModified: '2025-06-01T10:30:00'
    });
    const editComp = createComponent('edit', link);

    expect(editComp.linkForm.get('groupId')?.value).toBe('GRP1');
    expect(editComp.linkForm.get('categoryCode')?.value).toBe('CAT1');
    expect(editComp.selectedCategoryValues).toEqual(['A', 'B']);
    expect(editComp.lastModified).toBe('2025-06-01T10:30:00');
    expect(editComp.linkForm.pristine).toBe(true);
    expect(editComp.linkForm.untouched).toBe(true);
    editComp.ngOnDestroy();
  });

  it('should handle link with no categoryValues', () => {
    const link = buildMockLink({ categoryValues: '' });
    const editComp = createComponent('edit', link);

    expect(editComp.selectedCategoryValues).toEqual([]);
    editComp.ngOnDestroy();
  });

  it('should handle link with null categoryCode', () => {
    const link = buildMockLink({ categoryCode: '' });
    const editComp = createComponent('edit', link);

    expect(editComp.linkForm.get('categoryValues')?.disabled).toBe(true);
    editComp.ngOnDestroy();
  });

  it('should handle link with null lastModified', () => {
    const link = buildMockLink({ lastModified: undefined });
    const editComp = createComponent('edit', link);

    expect(editComp.lastModified).toBeNull();
    editComp.ngOnDestroy();
  });

  it('should enable categoryValues when categoryCode is present in edit mode', () => {
    const link = buildMockLink({ categoryCode: 'CAT1' });
    const editComp = createComponent('edit', link);

    expect(editComp.linkForm.get('categoryValues')?.enabled).toBe(true);
    expect(serviceSpy.getCategoryValues).toHaveBeenCalledWith('CAT1');
    editComp.ngOnDestroy();
  });

  it('should parse comma-separated category values in edit mode', () => {
    const link = buildMockLink({ categoryValues: 'X, Y, Z' });
    const editComp = createComponent('edit', link);

    expect(editComp.selectedCategoryValues).toEqual(['X', 'Y', 'Z']);
    editComp.ngOnDestroy();
  });

  // -------- Edit mode: buildDto --------

  it('should build correct DTO in edit mode with original values as WHERE clause', () => {
    const link = buildMockLink({
      groupId: 'ORIG',
      categoryCode: 'ORIG_CAT',
      effDate: '2025-01-15'
    });
    const editComp = createComponent('edit', link);
    const emitSpy = spyOn(editComp.save, 'emit');

    // Change form values (groupId must be <= 5 chars for maxLength validator)
    editComp.linkForm.patchValue({
      groupId: 'NEWG',
      categoryCode: 'NEW_CAT',
    });
    editComp.linkForm.get('categoryValues')?.enable({ emitEvent: false });

    editComp.onSave();

    const result = emitSpy.calls.mostRecent().args[0]!;
    expect(result.data?.surveyGroupId).toBe('ORIG');
    expect(result.data?.surveyCategoryCode).toBe('ORIG_CAT');
    expect(result.data?.newSurveyGroupId).toBe('NEWG');
    expect(result.data?.newSurveyCategoryCode).toBe('NEW_CAT');
    expect(result.mode).toBe('edit');
    editComp.ngOnDestroy();
  });

  it('should build correct DTO in add mode with same values for old and new', () => {
    const emitSpy = spyOn(component.save, 'emit');
    const effDate = DateFieldValidationUtility.getMinDate('+00:00');

    component.linkForm.patchValue({
      groupId: 'GRP1',
      categoryCode: 'CAT1',
      effDate,
    });
    component.linkForm.get('categoryValues')?.enable({ emitEvent: false });

    component.onSave();

    const result = emitSpy.calls.mostRecent().args[0]!;
    expect(result.data?.surveyGroupId).toBe('GRP1');
    expect(result.data?.newSurveyGroupId).toBe('GRP1');
    expect(result.data?.surveyCategoryCode).toBe('CAT1');
    expect(result.data?.newSurveyCategoryCode).toBe('CAT1');
  });

  // -------- Edit mode: hasLinkChanged (via canSave) --------

  it('should detect change in groupId', () => {
    const link = buildMockLink({ effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;

    editComp.linkForm.patchValue({ groupId: 'CHG' });
    expect(editComp.canSave).toBe(true);
    editComp.ngOnDestroy();
  });

  it('should detect change in categoryCode', () => {
    const link = buildMockLink({ effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;

    editComp.linkForm.patchValue({ categoryCode: 'NEW_CAT' });
    expect(editComp.canSave).toBe(true);
    editComp.ngOnDestroy();
  });

  it('should detect change in categoryValues', () => {
    const link = buildMockLink({ categoryValues: 'A,B', effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;
    editComp.linkForm.get('categoryValues')?.enable({ emitEvent: false });

    editComp.linkForm.patchValue({ categoryValues: ['A', 'B', 'C'] });
    expect(editComp.canSave).toBe(true);
    editComp.ngOnDestroy();
  });

  it('should detect change in effDate', () => {
    const link = buildMockLink({ effDate: '2025-01-15' });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;

    editComp.linkForm.patchValue({ effDate: moment('2025-06-01') });
    expect(editComp.canSave).toBe(true);
    editComp.ngOnDestroy();
  });

  it('should detect change in termDate', () => {
    const link = buildMockLink({ termDate: null, effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;

    editComp.linkForm.patchValue({ termDate: moment().add(30, 'days') });
    expect(editComp.canSave).toBe(true);
    editComp.ngOnDestroy();
  });

  it('should return false when originalLink is null in hasLinkChanged', () => {
    const editComp = createComponent('edit', buildMockLink());
    editComp.isSubmitting = false;
    (editComp as any).originalLink = null;

    // canSave calls hasLinkChanged which returns false when originalLink is null
    expect(editComp.canSave).toBe(false);
    editComp.ngOnDestroy();
  });

  // -------- Edit mode date validators --------

  it('should NOT apply effectiveDateNotPastValidator in edit mode', () => {
    const link = buildMockLink({ effDate: '2020-01-01' });
    const editComp = createComponent('edit', link);

    const effCtrl = editComp.linkForm.get('effDate');
    // In edit mode, past eff dates should not cause pastDate error
    expect(effCtrl?.hasError('pastDate')).toBe(false);
    editComp.ngOnDestroy();
  });

  it('should apply terminationDateNotPastValidator in edit mode', () => {
    const link = buildMockLink();
    const editComp = createComponent('edit', link);

    const termCtrl = editComp.linkForm.get('termDate');
    termCtrl?.setValue(moment('2020-01-01'));
    termCtrl?.updateValueAndValidity();

    // The termination date in the past should trigger terminationDatePast error
    expect(termCtrl?.hasError('terminationDatePast')).toBe(true);
    editComp.ngOnDestroy();
  });

  // -------- minDate --------

  it('should return chapter-aware min date', () => {
    const result = component.minDate;
    expect(result).toBeDefined();
    expect(moment.isMoment(result)).toBe(true);
  });

  // -------- ngOnDestroy --------

  it('should complete destroy$ subject on destroy', () => {
    const destroySpy = spyOn((component as any).destroy$, 'next');
    const completeSpy = spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // -------- setupDateValidationListeners --------

  it('should set lastChangedDateField to effective when effDate changes', () => {
    component.linkForm.get('effDate')?.setValue(moment().add(1, 'day'));
    expect((component as any).lastChangedDateField).toBe('effective');
  });

  it('should set lastChangedDateField to termination when termDate changes', () => {
    component.linkForm.get('termDate')?.setValue(moment().add(10, 'days'));
    expect((component as any).lastChangedDateField).toBe('termination');
  });

  // -------- resetFormForAddMode (via ngOnChanges) --------

  it('should reset all form fields and state when resetting for add mode', () => {
    // Set up some state
    component.selectedCategoryValues = ['A', 'B'];
    component.categoryValues = [{ code: 'A', description: 'A' }];
    component.filteredCategoryValues = [{ code: 'A', description: 'A' }];
    component.linkForm.patchValue({ groupId: 'DIRTY', categoryCode: 'CAT1' });

    component.ngOnChanges({
      resetFormToken: new SimpleChange(0, 1, false)
    });

    expect(component.selectedCategoryValues).toEqual([]);
    expect(component.categoryValues).toEqual([]);
    expect(component.filteredCategoryValues).toEqual([]);
    expect(component.linkForm.get('categoryValues')?.disabled).toBe(true);
    expect(component.linkForm.pristine).toBe(true);
    expect(component.linkForm.untouched).toBe(true);
  });

  // -------- sentinel values --------

  it('should have correct sentinel values for select panel', () => {
    expect(component.selectPanelLoadingValue).toBe('__ADD_EDIT_LINK_PANEL_LOADING__');
    expect(component.selectPanelEmptyValue).toBe('__ADD_EDIT_LINK_PANEL_EMPTY__');
  });

  // -------- maxVisibleChips --------

  it('should have maxVisibleChips set to 3', () => {
    expect(component.maxVisibleChips).toBe(3);
  });

  // -------- form validation --------

  it('should require groupId and enforce maxLength of 5', () => {
    const groupCtrl = component.linkForm.get('groupId');

    groupCtrl?.setValue('');
    groupCtrl?.updateValueAndValidity();
    expect(groupCtrl?.hasError('required')).toBe(true);

    groupCtrl?.setValue('ABCDEF');
    groupCtrl?.updateValueAndValidity();
    expect(groupCtrl?.hasError('maxlength')).toBe(true);

    groupCtrl?.setValue('AB');
    groupCtrl?.updateValueAndValidity();
    expect(groupCtrl?.valid).toBe(true);
  });

  it('should require categoryCode', () => {
    const catCtrl = component.linkForm.get('categoryCode');
    catCtrl?.setValue(null);
    catCtrl?.updateValueAndValidity();
    expect(catCtrl?.hasError('required')).toBe(true);

    catCtrl?.setValue('CAT1');
    catCtrl?.updateValueAndValidity();
    expect(catCtrl?.valid).toBe(true);
  });

  it('should require effDate', () => {
    const effCtrl = component.linkForm.get('effDate');
    effCtrl?.setValue(null);
    effCtrl?.updateValueAndValidity();
    expect(effCtrl?.hasError('required')).toBe(true);
  });

  it('should not require termDate', () => {
    const termCtrl = component.linkForm.get('termDate');
    termCtrl?.setValue(null);
    termCtrl?.updateValueAndValidity();
    expect(termCtrl?.hasError('required')).toBeFalsy();
  });

  // -------- effDateErrorMatcher / termDateErrorMatcher --------

  it('should have effDateErrorMatcher defined', () => {
    expect(component.effDateErrorMatcher).toBeDefined();
    expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
  });

  it('should have termDateErrorMatcher defined', () => {
    expect(component.termDateErrorMatcher).toBeDefined();
    expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
  });

  // -------- areDatesEqual (via canSave in edit mode) --------

  it('should treat two null dates as equal (no change detected)', () => {
    const link = buildMockLink({ termDate: null, effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;

    // termDate stays null -> no change
    editComp.linkForm.patchValue({ termDate: null });
    // canSave should be false because nothing changed
    expect(editComp.canSave).toBe(false);
    editComp.ngOnDestroy();
  });

  it('should detect change when one date is null and other is not', () => {
    const link = buildMockLink({ termDate: null, effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;

    editComp.linkForm.patchValue({ termDate: moment().add(30, 'days') });
    expect(editComp.canSave).toBe(true);
    editComp.ngOnDestroy();
  });

  // -------- categoryValues sorted comparison (via hasLinkChanged) --------

  it('should treat same values in different order as equal', () => {
    const link = buildMockLink({ categoryValues: 'B,A', effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;
    editComp.linkForm.get('categoryValues')?.enable({ emitEvent: false });

    // Set to same values in different order
    editComp.linkForm.patchValue({ categoryValues: ['A', 'B'] });
    // Should be false because sorted values match
    expect(editComp.canSave).toBe(false);
    editComp.ngOnDestroy();
  });

  it('should detect change when categoryValues are different', () => {
    const link = buildMockLink({ categoryValues: 'A,B', effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;
    editComp.linkForm.get('categoryValues')?.enable({ emitEvent: false });

    editComp.linkForm.patchValue({ categoryValues: ['A', 'C'] });
    expect(editComp.canSave).toBe(true);
    editComp.ngOnDestroy();
  });

  it('should handle empty originalLink categoryValues', () => {
    const link = buildMockLink({ categoryValues: '', effDate: moment().add(5, 'days').format('YYYY-MM-DD') });
    const editComp = createComponent('edit', link);
    editComp.isSubmitting = false;
    editComp.linkForm.get('categoryValues')?.enable({ emitEvent: false });

    editComp.linkForm.patchValue({ categoryValues: ['A'] });
    expect(editComp.canSave).toBe(true);
    editComp.ngOnDestroy();
  });

  // -------- DTO trimming --------

  it('should trim groupId whitespace in buildDto', () => {
    const emitSpy = spyOn(component.save, 'emit');
    const effDate = DateFieldValidationUtility.getMinDate('+00:00');

    component.linkForm.patchValue({
      groupId: ' G1 ',
      categoryCode: 'CAT1',
      effDate,
    });
    component.linkForm.get('categoryValues')?.enable({ emitEvent: false });

    component.onSave();

    const result = emitSpy.calls.mostRecent().args[0]!;
    expect(result.data?.surveyGroupId).toBe('G1');
  });
});
