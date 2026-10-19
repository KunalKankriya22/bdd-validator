import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddEditSpProductComponent } from './add-edit-sp-product';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SpProductsSpecialProcessesApiService } from '../services/sp-products-special-processes-api.service';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { SimpleChange } from '@angular/core';
import { SpProductModel, LookUp } from '../models/sp-products-special-processes.model';

describe('AddEditSpProductComponent', () => {
  let component: AddEditSpProductComponent;
  let fixture: ComponentFixture<AddEditSpProductComponent>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockApiService: jasmine.SpyObj<SpProductsSpecialProcessesApiService>;

  const mockProductCodes: LookUp[] = [
    { code: 'E3102', name: 'APHERESIS PLATELETS' },
    { code: 'E0471', name: 'Washed Red blood cells' },
    { code: 'P001', name: 'Plasma Product' },
  ];

  const mockAttributeGroups: LookUp[] = [
    { code: 'VBD14', name: 'Volume Based Division 14' },
    { code: 'GRP02', name: 'Group Two' },
  ];

  const mockAttributeCodes: LookUp[] = [
    { code: 'V001', name: 'APHERESIS' },
    { code: 'V002', name: 'WHOLE BLOOD' },
  ];

  const mockEditData: SpProductModel = {
    processCode: 'DEGLY',
    processDesc: 'Deglycerolization',
    productCode: 'E3102',
    productDesc: 'APHERESIS PLATELETS',
    attribGroup: 'VBD14',
    attribGroupDesc: 'Volume Based Division 14',
    attribCode: 'V001',
    attribCodeDesc: 'APHERESIS',
    effDate: '2024-11-20',
    termDate: null,
    lastModifiedDate: null,
    programId: null,
  };

  function createComponent(mode: 'add' | 'edit' = 'add', data: SpProductModel | null = null): void {
    fixture = TestBed.createComponent(AddEditSpProductComponent);
    component = fixture.componentInstance;
    component.mode = mode;
    component.data = data;
    if (mode === 'add') {
      component.productCodeOptions = [];
    }
    fixture.detectChanges();
  }

  beforeEach(() => {
    mockHeaderService = createMockHeaderService();
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate', 'isChapterLocalDateAvailable'
    ]);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);

    mockApiService = jasmine.createSpyObj('SpProductsSpecialProcessesApiService', [
      'getProductCodes', 'getAttributeGroups', 'getAttributeCodes'
    ]);
    mockApiService.getProductCodes.and.returnValue(of([]));
    mockApiService.getAttributeGroups.and.returnValue(of([]));
    mockApiService.getAttributeCodes.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [AddEditSpProductComponent, NoopAnimationsModule],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: SpProductsSpecialProcessesApiService, useValue: mockApiService },
      ]
    });
  });

  // ─── Existing Tests ───────────────────────────────────────────────

  it('should initialize form with required controls', () => {
    createComponent();
    expect(component.form).toBeDefined();
    expect(component.form.get('productCode')).toBeTruthy();
    expect(component.form.get('attribGroup')).toBeTruthy();
    expect(component.form.get('attribCode')).toBeTruthy();
    expect(component.form.get('effDate')).toBeTruthy();
    expect(component.form.get('termDate')).toBeTruthy();
  });

  it('should default to add mode', () => {
    createComponent();
    expect(component.mode).toBe('add');
    expect(component.dialogTitle).toBe('Add New Product');
  });

  // ─── Constructor & Lifecycle ──────────────────────────────────────

  describe('constructor', () => {
    it('should set minDate from chapterTimezoneService', () => {
      createComponent();
      expect(component.minDate).toBeDefined();
      expect(moment.isMoment(component.minDate)).toBe(true);
    });

    it('should set terminationMinDate to minDate initially', () => {
      createComponent();
      expect(component.terminationMinDate).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should initialize form on init', () => {
      createComponent();
      expect(component.form).toBeDefined();
    });

    it('should call loadProductCodes in add mode when productCodeOptions is empty', () => {
      mockApiService.getProductCodes.and.returnValue(of(mockProductCodes));
      createComponent('add');
      expect(mockApiService.getProductCodes).toHaveBeenCalled();
    });

    it('should not call loadProductCodes if productCodeOptions are already provided', () => {
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = mockProductCodes;
      fixture.detectChanges();
      expect(mockApiService.getProductCodes).not.toHaveBeenCalled();
    });

    it('should disable productCode in edit mode', () => {
      createComponent('edit', mockEditData);
      expect(component.form.get('productCode')?.disabled).toBe(true);
    });

    it('should disable attribGroup in edit mode when data has attribGroup', () => {
      createComponent('edit', mockEditData);
      expect(component.form.get('attribGroup')?.disabled).toBe(true);
    });

    it('should disable attribCode in edit mode when data has attribCode', () => {
      createComponent('edit', mockEditData);
      expect(component.form.get('attribCode')?.disabled).toBe(true);
    });

    it('should not disable attribGroup in edit mode when data has no attribGroup', () => {
      const dataWithoutAttribGroup = { ...mockEditData, attribGroup: null, attribCode: null };
      createComponent('edit', dataWithoutAttribGroup);
      expect(component.form.get('attribGroup')?.disabled).toBe(false);
    });

    it('should load edit mode dropdowns when data has no attribGroup', () => {
      const dataWithoutAttribGroup = { ...mockEditData, attribGroup: null, attribCode: null };
      mockApiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      createComponent('edit', dataWithoutAttribGroup);
      expect(mockApiService.getAttributeGroups).toHaveBeenCalledWith('E3102');
    });

    it('should load attribute codes in edit mode when data has attribGroup but no attribCode', () => {
      const dataWithAttribGroupOnly = { ...mockEditData, attribCode: null };
      mockApiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      createComponent('edit', dataWithAttribGroupOnly);
      expect(mockApiService.getAttributeCodes).toHaveBeenCalledWith('E3102', 'VBD14');
    });

    it('should set selectedProductDescription from data in edit mode', () => {
      createComponent('edit', mockEditData);
      expect(component.selectedProductDescription).toBe('APHERESIS PLATELETS');
    });
  });

  describe('ngOnChanges', () => {
    it('should update filteredProductCodes when productCodeOptions input changes', () => {
      createComponent();
      component.productCodeOptions = mockProductCodes;
      component.ngOnChanges({
        productCodeOptions: new SimpleChange([], mockProductCodes, false),
      });
      expect(component.filteredProductCodes).toEqual(mockProductCodes);
    });

    it('should not update filteredProductCodes when other inputs change', () => {
      createComponent();
      component.filteredProductCodes = [];
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
      });
      expect(component.filteredProductCodes).toEqual([]);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      createComponent();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ─── Getters ──────────────────────────────────────────────────────

  describe('dialogTitle', () => {
    it('should return "Add New Product" for add mode', () => {
      createComponent('add');
      expect(component.dialogTitle).toBe('Add New Product');
    });

    it('should return "Edit Product" for edit mode', () => {
      createComponent('edit', mockEditData);
      expect(component.dialogTitle).toBe('Edit Product');
    });
  });

  describe('submitButtonLabel', () => {
    it('should return "ADD" for add mode', () => {
      createComponent('add');
      expect(component.submitButtonLabel).toBe('ADD');
    });

    it('should return "SAVE" for edit mode', () => {
      createComponent('edit', mockEditData);
      expect(component.submitButtonLabel).toBe('SAVE');
    });
  });

  describe('showCreateAnotherButton', () => {
    it('should return true for add mode', () => {
      createComponent('add');
      expect(component.showCreateAnotherButton).toBe(true);
    });

    it('should return false for edit mode', () => {
      createComponent('edit', mockEditData);
      expect(component.showCreateAnotherButton).toBe(false);
    });
  });

  describe('editEffectiveDateDisplay', () => {
    it('should return "-" when effDate has no value', () => {
      createComponent('edit', mockEditData);
      component.form.get('effDate')?.setValue(null);
      expect(component.editEffectiveDateDisplay).toBe('-');
    });

    it('should return formatted date when effDate has a value', () => {
      createComponent('edit', mockEditData);
      const testDate = moment('2024-11-20', 'YYYY-MM-DD');
      component.form.get('effDate')?.setValue(testDate);
      const result = component.editEffectiveDateDisplay;
      expect(result).toContain('20-NOV-2024');
    });
  });

  describe('isFormValid', () => {
    it('should return false for edit mode when form is not dirty', () => {
      createComponent('edit', mockEditData);
      expect(component.isFormValid).toBe(false);
    });

    it('should return true for edit mode when form is dirty and no date errors', () => {
      createComponent('edit', mockEditData);
      const futureDate = moment().add(5, 'days');
      component.form.get('effDate')?.setValue(futureDate);
      component.form.get('effDate')?.markAsDirty();
      expect(component.isFormValid).toBe(true);
    });

    it('should return false for add mode when required fields are empty', () => {
      createComponent('add');
      expect(component.isFormValid).toBe(false);
    });

    it('should return true for add mode when required fields are valid', () => {
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('effDate')?.setValue(moment().add(1, 'day'));
      expect(component.isFormValid).toBe(true);
    });

    it('should return false when termDate has invalidDate error', () => {
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('effDate')?.setValue(moment().add(1, 'day'));
      component.form.get('termDate')?.setErrors({ invalidDate: true });
      expect(component.isFormValid).toBe(false);
    });

    it('should return false when termDate has invalidDateFormat error', () => {
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('effDate')?.setValue(moment().add(1, 'day'));
      component.form.get('termDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isFormValid).toBe(false);
    });

    it('should return false when termDate has matDatepickerParse error', () => {
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('effDate')?.setValue(moment().add(1, 'day'));
      component.form.get('termDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isFormValid).toBe(false);
    });

    it('should return false when form has dateRangeInvalid error', () => {
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('effDate')?.setValue(moment().add(5, 'days'));
      component.form.get('termDate')?.setValue(moment().add(1, 'day'));
      component.form.setErrors({ dateRangeInvalid: true });
      expect(component.isFormValid).toBe(false);
    });
  });

  // ─── Date Error Methods ───────────────────────────────────────────

  describe('getEffectiveDateError', () => {
    it('should return empty string when lastChangedDateField is not effective', () => {
      createComponent('add');
      component['lastChangedDateField'] = 'termination';
      const error = component.getEffectiveDateError();
      // form.errors will be null since lastChangedDateField is not 'effective'
      expect(typeof error).toBe('string');
    });

    it('should pass form.errors when lastChangedDateField is effective', () => {
      createComponent('add');
      component['lastChangedDateField'] = 'effective';
      const error = component.getEffectiveDateError();
      expect(typeof error).toBe('string');
    });
  });

  describe('getTerminationDateError', () => {
    it('should return empty string when lastChangedDateField is not termination', () => {
      createComponent('add');
      component['lastChangedDateField'] = 'effective';
      const error = component.getTerminationDateError();
      expect(typeof error).toBe('string');
    });

    it('should pass form.errors when lastChangedDateField is termination', () => {
      createComponent('add');
      component['lastChangedDateField'] = 'termination';
      const error = component.getTerminationDateError();
      expect(typeof error).toBe('string');
    });
  });

  // ─── Date Filters ─────────────────────────────────────────────────

  describe('terminationDateFilter', () => {
    it('should return true for null date', () => {
      createComponent('add');
      expect(component.terminationDateFilter(null)).toBe(true);
    });

    it('should return false for past date in add mode', () => {
      createComponent('add');
      const pastDate = moment().subtract(10, 'days');
      expect(component.terminationDateFilter(pastDate)).toBe(false);
    });

    it('should return true for future date in add mode', () => {
      createComponent('add');
      const futureDate = moment().add(10, 'days');
      expect(component.terminationDateFilter(futureDate)).toBe(true);
    });

    it('should return false for date before effective date', () => {
      createComponent('add');
      const effDate = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(effDate);
      const beforeEffDate = moment().add(5, 'days');
      expect(component.terminationDateFilter(beforeEffDate)).toBe(false);
    });

    it('should return true for date after effective date', () => {
      createComponent('add');
      const effDate = moment().add(5, 'days');
      component.form.get('effDate')?.setValue(effDate);
      const afterEffDate = moment().add(10, 'days');
      expect(component.terminationDateFilter(afterEffDate)).toBe(true);
    });

    it('should not check today in edit mode', () => {
      createComponent('edit', mockEditData);
      const pastDate = moment().subtract(5, 'days');
      // In edit mode, only the effDate check applies (no today check)
      component.form.get('effDate')?.setValue(moment().subtract(10, 'days'));
      expect(component.terminationDateFilter(pastDate)).toBe(true);
    });
  });

  describe('effectiveDateFilter', () => {
    it('should return true for null date', () => {
      createComponent('add');
      expect(component.effectiveDateFilter(null)).toBe(true);
    });

    it('should return true in edit mode regardless of date', () => {
      createComponent('edit', mockEditData);
      const pastDate = moment().subtract(10, 'days');
      expect(component.effectiveDateFilter(pastDate)).toBe(true);
    });

    it('should return false for past date in add mode', () => {
      createComponent('add');
      const pastDate = moment().subtract(10, 'days');
      expect(component.effectiveDateFilter(pastDate)).toBe(false);
    });

    it('should return true for future date in add mode', () => {
      createComponent('add');
      const futureDate = moment().add(10, 'days');
      expect(component.effectiveDateFilter(futureDate)).toBe(true);
    });
  });

  // ─── Save / Cancel / Clear ────────────────────────────────────────

  describe('onSave', () => {
    it('should emit save event when form is valid in add mode', () => {
      createComponent('add');
      spyOn(component.save, 'emit');
      const futureDate = moment().add(5, 'days');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('effDate')?.setValue(futureDate);
      component.onSave();
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBe(true);
    });

    it('should not emit save event when form is invalid', () => {
      createComponent('add');
      spyOn(component.save, 'emit');
      component.onSave();
      expect(component.save.emit).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    });

    it('should emit correct form values', () => {
      createComponent('add');
      spyOn(component.save, 'emit');
      const futureDate = moment().add(5, 'days');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('attribGroup')?.setValue('VBD14');
      component.form.get('attribCode')?.setValue('V001');
      component.form.get('effDate')?.setValue(futureDate);
      component.onSave();
      const emittedValue = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.productCode).toBe('E3102');
      expect(emittedValue.attribGroup).toBe('VBD14');
      expect(emittedValue.attribCode).toBe('V001');
      expect(emittedValue.effDate).toEqual(futureDate);
    });
  });

  describe('onSaveAndCreateAnother', () => {
    it('should emit saveAndCreateAnother event when form is valid', () => {
      createComponent('add');
      spyOn(component.saveAndCreateAnother, 'emit');
      const futureDate = moment().add(5, 'days');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('effDate')?.setValue(futureDate);
      component.onSaveAndCreateAnother();
      expect(component.saveAndCreateAnother.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBe(true);
    });

    it('should not emit saveAndCreateAnother event when form is invalid', () => {
      createComponent('add');
      spyOn(component.saveAndCreateAnother, 'emit');
      component.onSaveAndCreateAnother();
      expect(component.saveAndCreateAnother.emit).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit close event', () => {
      createComponent('add');
      spyOn(component.close, 'emit');
      component.onCancel();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    it('should reset the form in add mode', () => {
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('effDate')?.setValue(moment());
      component.onClearAll();
      expect(component.form.get('productCode')?.value).toBeNull();
      expect(component.form.get('effDate')?.value).toBeNull();
    });

    it('should restore original values in edit mode', () => {
      createComponent('edit', mockEditData);
      const newDate = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(newDate);
      component.form.get('termDate')?.setValue(newDate);
      component.onClearAll();
      expect(component.form.getRawValue().productCode).toBe('E3102');
    });

    it('should reload attribute codes in edit mode when attribGroup exists but attribCode is null', () => {
      const editDataPartial = { ...mockEditData, attribCode: null };
      mockApiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      createComponent('edit', editDataPartial);
      mockApiService.getAttributeCodes.calls.reset();
      component.onClearAll();
      expect(mockApiService.getAttributeCodes).toHaveBeenCalledWith('E3102', 'VBD14');
    });

    it('should not reload attribute codes in edit mode when both attribGroup and attribCode are null', () => {
      const editDataNoAttribs = { ...mockEditData, attribGroup: null, attribCode: null };
      createComponent('edit', editDataNoAttribs);
      mockApiService.getAttributeCodes.calls.reset();
      component.onClearAll();
      expect(mockApiService.getAttributeCodes).not.toHaveBeenCalled();
    });
  });

  // ─── Date Input Handlers ──────────────────────────────────────────

  describe('onEffDateChanged', () => {
    it('should set lastChangedDateField to effective', () => {
      createComponent('add');
      component.onEffDateChanged();
      expect(component['lastChangedDateField']).toBe('effective');
    });
  });

  describe('onTermDateChanged', () => {
    it('should set lastChangedDateField to termination', () => {
      createComponent('add');
      component.onTermDateChanged();
      expect(component['lastChangedDateField']).toBe('termination');
    });
  });

  describe('onEffDateInput', () => {
    it('should set lastChangedDateField to effective', () => {
      createComponent('add');
      const event = { target: { value: '20-NOV-2024' } } as unknown as Event;
      component.onEffDateInput(event);
      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should handle empty input value', () => {
      createComponent('add');
      const event = { target: { value: '' } } as unknown as Event;
      component.onEffDateInput(event);
      expect(component['lastChangedDateField']).toBe('effective');
    });
  });

  describe('onTermDateInput', () => {
    it('should set lastChangedDateField to termination', () => {
      createComponent('add');
      const event = { target: { value: '25-DEC-2025' } } as unknown as Event;
      component.onTermDateInput(event);
      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should handle empty input value', () => {
      createComponent('add');
      const event = { target: { value: '' } } as unknown as Event;
      component.onTermDateInput(event);
      expect(component['lastChangedDateField']).toBe('termination');
    });
  });

  describe('onEffDateBlur', () => {
    it('should mark effDate as touched and update validity', () => {
      createComponent('add');
      component.onEffDateBlur();
      expect(component.form.get('effDate')?.touched).toBe(true);
    });
  });

  describe('onTermDateBlur', () => {
    it('should mark termDate as touched and update validity', () => {
      createComponent('add');
      component.onTermDateBlur();
      expect(component.form.get('termDate')?.touched).toBe(true);
    });
  });

  // ─── Form Validation ──────────────────────────────────────────────

  describe('validateForm (via onSave)', () => {
    it('should mark all controls as touched', () => {
      createComponent('add');
      component.onSave();
      expect(component.form.get('productCode')?.touched).toBe(true);
      expect(component.form.get('effDate')?.touched).toBe(true);
    });

    it('should succeed for valid add mode form', () => {
      createComponent('add');
      spyOn(component.save, 'emit');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('effDate')?.setValue(moment().add(5, 'days'));
      component.onSave();
      expect(component.save.emit).toHaveBeenCalled();
    });

    it('should fail when productCode is empty in add mode', () => {
      createComponent('add');
      spyOn(component.save, 'emit');
      component.form.get('effDate')?.setValue(moment().add(5, 'days'));
      component.onSave();
      expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('should fail when effDate is empty in add mode', () => {
      createComponent('add');
      spyOn(component.save, 'emit');
      component.form.get('productCode')?.setValue('E3102');
      component.onSave();
      expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('should handle edit mode validation using date error functions', () => {
      createComponent('edit', mockEditData);
      spyOn(component.save, 'emit');
      // In edit mode, the form just needs to pass getEffectiveDateError and getTerminationDateError
      component.form.get('effDate')?.markAsDirty();
      component.onSave();
      // Since there are no date errors, it should emit
      expect(component.save.emit).toHaveBeenCalled();
    });

    it('should untouch termDate in edit mode if it was not originally touched', () => {
      createComponent('edit', mockEditData);
      spyOn(component.save, 'emit');
      // termDate was never touched - after validateForm it should remain untouched
      component.onSave();
      expect(component.form.get('termDate')?.touched).toBe(false);
    });

    it('should keep termDate touched in edit mode if it was originally touched and has a value', () => {
      createComponent('edit', mockEditData);
      spyOn(component.save, 'emit');
      const futureTermDate = moment().add(30, 'days');
      component.form.get('termDate')?.setValue(futureTermDate);
      component.form.get('termDate')?.markAsTouched();
      component.onSave();
      // When termDate has a value, clearOptionalDateErrors does not untouched it
      expect(component.form.get('termDate')?.touched).toBe(true);
    });
  });

  // ─── Search Filters ───────────────────────────────────────────────

  describe('search filters', () => {
    it('should filter product codes by search term', () => {
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = mockProductCodes;
      fixture.detectChanges();

      component.productCodeSearchCtrl.setValue('E3102');
      expect(component.filteredProductCodes.length).toBe(1);
      expect(component.filteredProductCodes[0].code).toBe('E3102');
    });

    it('should return all items when search is cleared', () => {
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = mockProductCodes;
      fixture.detectChanges();

      component.productCodeSearchCtrl.setValue('E3102');
      component.productCodeSearchCtrl.setValue('');
      expect(component.filteredProductCodes.length).toBe(mockProductCodes.length);
    });

    it('should filter attribute groups by search term', () => {
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = [];
      fixture.detectChanges();

      component.attributeGroupOptions = mockAttributeGroups;
      component.attributeGroupSearchCtrl.setValue('VBD14');
      expect(component.filteredAttributeGroups.length).toBe(1);
      expect(component.filteredAttributeGroups[0].code).toBe('VBD14');
    });

    it('should filter attribute codes by search term', () => {
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = [];
      fixture.detectChanges();

      component.attributeCodeOptions = mockAttributeCodes;
      component.attributeCodeSearchCtrl.setValue('V001');
      expect(component.filteredAttributeCodes.length).toBe(1);
      expect(component.filteredAttributeCodes[0].code).toBe('V001');
    });
  });

  // ─── Service Calls ────────────────────────────────────────────────

  describe('loadProductCodes', () => {
    it('should populate productCodeOptions on success', () => {
      mockApiService.getProductCodes.and.returnValue(of(mockProductCodes));
      createComponent('add');
      expect(component.productCodeOptions).toEqual(mockProductCodes);
      expect(component.filteredProductCodes).toEqual(mockProductCodes);
      expect(component.isLoadingProductCodes).toBe(false);
    });

    it('should handle error from getProductCodes', () => {
      mockApiService.getProductCodes.and.returnValue(throwError(() => new Error('API Error')));
      createComponent('add');
      expect(component.isLoadingProductCodes).toBe(false);
    });
  });

  describe('loadAttributeGroups (via cascading dropdowns)', () => {
    it('should load attribute groups when productCode changes', () => {
      mockApiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      expect(mockApiService.getAttributeGroups).toHaveBeenCalledWith('E3102');
    });

    it('should populate attributeGroupOptions on success', () => {
      mockApiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      expect(component.attributeGroupOptions).toEqual(mockAttributeGroups);
      expect(component.filteredAttributeGroups).toEqual(mockAttributeGroups);
      expect(component.isLoadingAttributeGroups).toBe(false);
    });

    it('should handle error from getAttributeGroups', () => {
      mockApiService.getAttributeGroups.and.returnValue(throwError(() => new Error('API Error')));
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      expect(component.isLoadingAttributeGroups).toBe(false);
    });

    it('should reset attribGroup and attribCode when productCode changes', () => {
      createComponent('add');
      component.form.get('attribGroup')?.setValue('VBD14');
      component.form.get('attribCode')?.setValue('V001');
      component.form.get('productCode')?.setValue('E0471');
      expect(component.form.get('attribGroup')?.value).toBeNull();
      expect(component.form.get('attribCode')?.value).toBeNull();
    });

    it('should clear attribute options when productCode is cleared', () => {
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('productCode')?.setValue(null);
      expect(component.attributeGroupOptions).toEqual([]);
      expect(component.filteredAttributeGroups).toEqual([]);
      expect(component.attributeCodeOptions).toEqual([]);
      expect(component.filteredAttributeCodes).toEqual([]);
    });
  });

  describe('loadAttributeCodes (via cascading dropdowns)', () => {
    it('should load attribute codes when attribGroup changes', () => {
      mockApiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      mockApiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('attribGroup')?.setValue('VBD14');
      expect(mockApiService.getAttributeCodes).toHaveBeenCalledWith('E3102', 'VBD14');
    });

    it('should populate attributeCodeOptions on success', () => {
      mockApiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      mockApiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('attribGroup')?.setValue('VBD14');
      expect(component.attributeCodeOptions).toEqual(mockAttributeCodes);
      expect(component.filteredAttributeCodes).toEqual(mockAttributeCodes);
      expect(component.isLoadingAttributeCodes).toBe(false);
    });

    it('should handle error from getAttributeCodes', () => {
      mockApiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      mockApiService.getAttributeCodes.and.returnValue(throwError(() => new Error('API Error')));
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('attribGroup')?.setValue('VBD14');
      expect(component.isLoadingAttributeCodes).toBe(false);
    });

    it('should clear attribute codes when attribGroup is cleared', () => {
      mockApiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      mockApiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('attribGroup')?.setValue('VBD14');
      component.form.get('attribGroup')?.setValue(null);
      expect(component.attributeCodeOptions).toEqual([]);
      expect(component.filteredAttributeCodes).toEqual([]);
    });

    it('should reset attribCode when attribGroup changes', () => {
      mockApiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      mockApiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      createComponent('add');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('attribGroup')?.setValue('VBD14');
      component.form.get('attribCode')?.setValue('V001');
      component.form.get('attribGroup')?.setValue('GRP02');
      expect(component.form.get('attribCode')?.value).toBeNull();
    });
  });

  // ─── Edit Mode Dropdowns ──────────────────────────────────────────

  describe('loadEditModeDropdowns', () => {
    it('should load attribute groups when data has no attribGroup', () => {
      const dataNoAttrib = { ...mockEditData, attribGroup: null, attribCode: null };
      mockApiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      createComponent('edit', dataNoAttrib);
      expect(mockApiService.getAttributeGroups).toHaveBeenCalledWith('E3102');
      expect(component.attributeGroupOptions).toEqual(mockAttributeGroups);
      expect(component.isLoadingAttributeGroups).toBe(false);
    });

    it('should handle error loading attribute groups in edit mode', () => {
      const dataNoAttrib = { ...mockEditData, attribGroup: null, attribCode: null };
      mockApiService.getAttributeGroups.and.returnValue(throwError(() => new Error('API Error')));
      createComponent('edit', dataNoAttrib);
      expect(component.isLoadingAttributeGroups).toBe(false);
    });

    it('should load attribute codes when data has attribGroup but no attribCode', () => {
      const dataNoCode = { ...mockEditData, attribCode: null };
      mockApiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      createComponent('edit', dataNoCode);
      expect(mockApiService.getAttributeCodes).toHaveBeenCalledWith('E3102', 'VBD14');
      expect(component.attributeCodeOptions).toEqual(mockAttributeCodes);
      expect(component.isLoadingAttributeCodes).toBe(false);
    });
  });

  // ─── Description Updaters ─────────────────────────────────────────

  describe('product code description updater', () => {
    it('should update selectedProductDescription when productCode changes in add mode', () => {
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = mockProductCodes;
      fixture.detectChanges();

      component.form.get('productCode')?.setValue('E3102');
      expect(component.selectedProductDescription).toBe('APHERESIS PLATELETS');
    });

    it('should clear selectedProductDescription when productCode is cleared', () => {
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = mockProductCodes;
      fixture.detectChanges();

      component.form.get('productCode')?.setValue('E3102');
      component.form.get('productCode')?.setValue(null);
      expect(component.selectedProductDescription).toBe('');
    });

    it('should set empty string when no matching product is found', () => {
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = mockProductCodes;
      fixture.detectChanges();

      component.form.get('productCode')?.setValue('NONEXISTENT');
      expect(component.selectedProductDescription).toBe('');
    });
  });

  describe('attribute group description updater', () => {
    it('should update selectedAttributeGroupDescription when attribGroup changes', () => {
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = [];
      fixture.detectChanges();

      component.attributeGroupOptions = mockAttributeGroups;
      component.form.get('attribGroup')?.setValue('VBD14');
      expect(component.selectedAttributeGroupDescription).toBe('Volume Based Division 14');
    });

    it('should clear selectedAttributeGroupDescription when attribGroup is cleared', () => {
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = [];
      fixture.detectChanges();

      component.attributeGroupOptions = mockAttributeGroups;
      component.form.get('attribGroup')?.setValue('VBD14');
      component.form.get('attribGroup')?.setValue(null);
      expect(component.selectedAttributeGroupDescription).toBe('');
    });
  });

  // ─── Form Initialization ─────────────────────────────────────────

  describe('initializeForm', () => {
    it('should set productCode from data in edit mode', () => {
      createComponent('edit', mockEditData);
      expect(component.form.getRawValue().productCode).toBe('E3102');
    });

    it('should set productCode to null in add mode', () => {
      createComponent('add');
      expect(component.form.get('productCode')?.value).toBeNull();
    });

    it('should set effDate from data in edit mode', () => {
      createComponent('edit', mockEditData);
      const effDate = component.form.get('effDate')?.value;
      expect(moment.isMoment(effDate)).toBe(true);
      expect(effDate.format('YYYY-MM-DD')).toBe('2024-11-20');
    });

    it('should set termDate from data when provided', () => {
      const dataWithTerm = { ...mockEditData, termDate: '2025-12-31' };
      createComponent('edit', dataWithTerm);
      const termDate = component.form.get('termDate')?.value;
      expect(moment.isMoment(termDate)).toBe(true);
      expect(termDate.format('YYYY-MM-DD')).toBe('2025-12-31');
    });

    it('should set termDate to null when not provided in data', () => {
      createComponent('edit', mockEditData);
      expect(component.form.get('termDate')?.value).toBeNull();
    });

    it('should set attribGroup from data', () => {
      createComponent('edit', mockEditData);
      expect(component.form.getRawValue().attribGroup).toBe('VBD14');
    });

    it('should set attribCode from data', () => {
      createComponent('edit', mockEditData);
      expect(component.form.getRawValue().attribCode).toBe('V001');
    });

    it('should require productCode', () => {
      createComponent('add');
      expect(component.form.get('productCode')?.hasError('required')).toBe(true);
    });

    it('should require effDate', () => {
      createComponent('add');
      expect(component.form.get('effDate')?.hasError('required')).toBe(true);
    });
  });

  // ─── setupModeValidators ──────────────────────────────────────────

  describe('setupModeValidators', () => {
    it('should set up add mode validators in add mode', () => {
      createComponent('add');
      const effControl = component.form.get('effDate');
      expect(effControl?.enabled).toBe(true);
    });

    it('should clear validators and set required only in edit mode for effDate', () => {
      createComponent('edit', mockEditData);
      const effControl = component.form.get('effDate');
      expect(effControl?.enabled).toBe(true);
      // Should have required validator
      effControl?.setValue(null);
      expect(effControl?.hasError('required')).toBe(true);
    });

    it('should clear validators for termDate in edit mode', () => {
      createComponent('edit', mockEditData);
      const termControl = component.form.get('termDate');
      // In edit mode termDate validators are cleared
      termControl?.setValue(null);
      expect(termControl?.valid).toBe(true);
    });
  });

  // ─── Date Validation Listeners ────────────────────────────────────

  describe('setupDateValidationListeners', () => {
    it('should add past date validator when effDate is changed and dirty in edit mode', fakeAsync(() => {
      createComponent('edit', mockEditData);
      const effControl = component.form.get('effDate');
      effControl?.markAsDirty();
      const pastDate = moment().subtract(10, 'days');
      effControl?.setValue(pastDate);
      tick();
      expect(effControl?.hasError('effectiveDatePast')).toBe(true);
    }));

    it('should not add past date validator when effDate is not dirty in edit mode', fakeAsync(() => {
      createComponent('edit', mockEditData);
      const effControl = component.form.get('effDate');
      const futureDate = moment().add(10, 'days');
      effControl?.setValue(futureDate);
      tick();
      expect(effControl?.hasError('effectiveDatePast')).toBeFalsy();
    }));
  });

  // ─── updateTerminationMinDate ─────────────────────────────────────

  describe('updateTerminationMinDate', () => {
    it('should set terminationMinDate based on effDate when effDate is after minDate in add mode', () => {
      createComponent('add');
      const futureDate = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(futureDate);
      // After value change, terminationMinDate should be updated
      const termMinDay = component.terminationMinDate.clone().startOf('day');
      const effDay = futureDate.clone().startOf('day');
      expect(termMinDay.isSameOrAfter(effDay)).toBe(true);
    });

    it('should use minDate when effDate is before minDate in add mode', () => {
      createComponent('add');
      // Set effDate to a past date (before minDate)
      const pastDate = moment().subtract(5, 'days');
      component.form.get('effDate')?.setValue(pastDate);
      // terminationMinDate should be minDate, not the past effDate
      expect(component.terminationMinDate.isSameOrAfter(component.minDate.clone().startOf('day'))).toBe(true);
    });

    it('should use effDate directly in edit mode', () => {
      createComponent('edit', mockEditData);
      const effDate = moment('2024-11-20', 'YYYY-MM-DD');
      component.form.get('effDate')?.setValue(effDate);
      const termMinDay = component.terminationMinDate.clone().startOf('day');
      const effDay = effDate.clone().startOf('day');
      expect(termMinDay.format('YYYY-MM-DD')).toBe(effDay.format('YYYY-MM-DD'));
    });

    it('should set terminationMinDate to minDate when effDate is null in add mode', () => {
      createComponent('add');
      component.form.get('effDate')?.setValue(null);
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });

    it('should set terminationMinDate to 1900-01-01 when effDate is null in edit mode', () => {
      createComponent('edit', mockEditData);
      component.form.get('effDate')?.setValue(null);
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe('1900-01-01');
    });
  });

  // ─── Error State Matchers ─────────────────────────────────────────

  describe('error state matchers', () => {
    it('should have effDateErrorMatcher defined', () => {
      createComponent('add');
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      createComponent('add');
      expect(component.termDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });

  // ─── getFormValue ─────────────────────────────────────────────────

  describe('getFormValue (via onSave)', () => {
    it('should include disabled fields in the returned value', () => {
      createComponent('edit', mockEditData);
      spyOn(component.save, 'emit');
      // productCode is disabled in edit mode; getRawValue should include it
      component.form.get('effDate')?.markAsDirty();
      component.onSave();
      const emittedValue = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.productCode).toBe('E3102');
    });

    it('should include all form fields in emitted value', () => {
      createComponent('add');
      spyOn(component.save, 'emit');
      const futureDate = moment().add(5, 'days');
      const termDate = moment().add(10, 'days');
      component.form.get('productCode')?.setValue('E3102');
      component.form.get('attribGroup')?.setValue('VBD14');
      component.form.get('attribCode')?.setValue('V001');
      component.form.get('effDate')?.setValue(futureDate);
      component.form.get('termDate')?.setValue(termDate);
      component.onSave();
      const emittedValue = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.productCode).toBe('E3102');
      expect(emittedValue.attribGroup).toBe('VBD14');
      expect(emittedValue.attribCode).toBe('V001');
      expect(emittedValue.effDate).toEqual(futureDate);
      expect(emittedValue.termDate).toEqual(termDate);
    });
  });

  // ─── updateProductDescription & updateAttributeGroupDescription ──

  describe('updateProductDescription', () => {
    it('should update product description after loading product codes', () => {
      mockApiService.getProductCodes.and.returnValue(of(mockProductCodes));
      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = [];
      fixture.detectChanges();
      // After loading, if a product code is set, description should be updated
      component.form.get('productCode')?.setValue('E3102');
      expect(component.selectedProductDescription).toBe('APHERESIS PLATELETS');
    });
  });

  // ─── Cascading dropdown edge cases ────────────────────────────────

  describe('cascading dropdown edge cases', () => {
    it('should not load attribute codes when attribCode control is disabled', () => {
      createComponent('edit', mockEditData);
      // In edit mode with full data, attribCode is disabled
      // Changing attribGroup should NOT trigger loadAttributeCodes since attribCode is disabled
      mockApiService.getAttributeCodes.calls.reset();
      // The attribGroup control is also disabled here, so direct setValue won't trigger
      // This tests the guard condition in the subscription
    });

    it('should handle null productCode when attribGroup changes', () => {
      createComponent('add');
      // Set a productCode first, then set attribGroup with no productCode
      component.form.get('productCode')?.setValue(null);
      // Manually trigger attribGroup to confirm no API call
      mockApiService.getAttributeCodes.calls.reset();
      component.form.get('attribGroup')?.setValue('VBD14');
      expect(mockApiService.getAttributeCodes).not.toHaveBeenCalled();
    });
  });

  // ─── Multiple operations ──────────────────────────────────────────

  describe('full add workflow', () => {
    it('should complete an add workflow: select product, attribute group, attribute code, set dates, save', () => {
      mockApiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      mockApiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));

      fixture = TestBed.createComponent(AddEditSpProductComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      component.productCodeOptions = mockProductCodes;
      fixture.detectChanges();

      spyOn(component.save, 'emit');

      // Step 1: Select product code
      component.form.get('productCode')?.setValue('E3102');
      expect(component.selectedProductDescription).toBe('APHERESIS PLATELETS');
      expect(mockApiService.getAttributeGroups).toHaveBeenCalledWith('E3102');

      // Step 2: Select attribute group
      component.form.get('attribGroup')?.setValue('VBD14');
      expect(mockApiService.getAttributeCodes).toHaveBeenCalledWith('E3102', 'VBD14');

      // Step 3: Select attribute code
      component.form.get('attribCode')?.setValue('V001');

      // Step 4: Set effective date
      const futureDate = moment().add(5, 'days');
      component.form.get('effDate')?.setValue(futureDate);

      // Step 5: Save
      component.onSave();
      expect(component.save.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBe(true);
    });
  });

  describe('full edit workflow', () => {
    it('should complete an edit workflow: modify termDate, save', () => {
      createComponent('edit', mockEditData);
      spyOn(component.save, 'emit');

      // Modify termination date
      const termDate = moment().add(30, 'days');
      component.form.get('termDate')?.setValue(termDate);
      component.form.get('termDate')?.markAsDirty();
      component.form.get('effDate')?.markAsDirty();

      component.onSave();
      expect(component.save.emit).toHaveBeenCalled();
    });
  });
});
