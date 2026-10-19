import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import moment from 'moment';

import { TranslateModule } from '@ngx-translate/core';

import { TestTypesGridComponent } from './test-types-grid';
import { TestTypesApiService } from '../services/test-types-api.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MultipleObservationTestTypeDto, DefaultControlValueLookupDto } from '../models/test-types.model';

describe('TestTypesGridComponent', () => {
  let component: TestTypesGridComponent;
  let fixture: ComponentFixture<TestTypesGridComponent>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockTestType: MultipleObservationTestTypeDto = {
    testId: 'ABORH',
    testType: 'GAMMA',
    testTypeDesc: 'Gamma',
    defaultControlValue: 'Yes',
    resUpdate: 'N',
    othBnd: 'N',
    fullTechTwo: 'N',
    effDate: '2025-01-11T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2025-01-11T10:30:00Z'
  };

  const mockControlValues: DefaultControlValueLookupDto[] = [
    { result: 'POS', resultDesc: 'Positive' },
    { result: 'NEG', resultDesc: 'Negative' }
  ];

  beforeEach(() => {

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate', 'getChapterLocalDateTime'
    ]);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());
    chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(moment());

      TestBed.configureTestingModule({
imports: [TestTypesGridComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy }
      ]
    });

    });

  beforeEach(() => {

      chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();

      chapterTimezoneServiceSpy.getChapterLocalDateTime.calls.reset();

      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());

      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(moment());

    fixture = TestBed.createComponent(TestTypesGridComponent);
    component = fixture.componentInstance;

    });
  describe('Form Initialization with Data', () => {
    it('should rebuild form when test types input changes', () => {
      fixture.componentRef.setInput('testTypes', [mockTestType]);
      fixture.detectChanges();

      expect(component.testTypesFormArray.length).toBe(1);
    });

    it('should create form controls with correct values', () => {
      fixture.componentRef.setInput('testTypes', [mockTestType]);
      fixture.detectChanges();

      const formGroup = component.testTypesFormArray.at(0);
      expect(formGroup.get('testId')?.value).toBe('ABORH');
      expect(formGroup.get('testType')?.value).toBe('GAMMA');
      expect(formGroup.get('testTypeDesc')?.value).toBe('Gamma');
    });

    it('should mark form as pristine after initialization', () => {
      fixture.componentRef.setInput('testTypes', [mockTestType]);
      fixture.detectChanges();

      expect(component.gridForm.pristine).toBeTrue();
      expect(component.hasUnsavedChanges()).toBeFalse();
    });
  });

  describe('Add New Test Type', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('testId', 'ABORH');
      fixture.componentRef.setInput('testTypes', []);
      fixture.detectChanges();
    });

    it('should mark form as dirty after adding row', () => {
      component.onAddNewTestType();
      expect(component.gridForm.dirty).toBeTrue();
      expect(component.hasUnsavedChanges()).toBeTrue();
    });

    it('should set isNew flag for new rows', () => {
      component.onAddNewTestType();
      const formGroup = component.testTypesFormArray.at(0);
      expect(formGroup.get('isNew')?.value).toBeTrue();
    });

    it('should not add row when testId is not set', () => {
      fixture.componentRef.setInput('testId', null);
      fixture.detectChanges();

      component.onAddNewTestType();
      expect(component.testTypesFormArray.length).toBe(0);
    });

    it('should set effective date to chapter today for new rows', () => {
      const chapterToday = moment('2026-08-04');
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(chapterToday);

      component.onAddNewTestType();
      const formGroup = component.testTypesFormArray.at(0);
      const effDate = formGroup.get('effDate')?.value;
      expect(moment.isMoment(effDate)).toBeTrue();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('testId', 'ABORH');
      fixture.componentRef.setInput('testTypes', []);
      fixture.detectChanges();
      component.onAddNewTestType();
    });

    it('should require test type code', () => {
      const formGroup = component.testTypesFormArray.at(0);
      const testTypeControl = formGroup.get('testType');

      testTypeControl?.setValue('');
      expect(testTypeControl?.hasError('required')).toBeTrue();
    });

    it('should require test type description', () => {
      const formGroup = component.testTypesFormArray.at(0);
      const testTypeDescControl = formGroup.get('testTypeDesc');

      testTypeDescControl?.setValue('');
      expect(testTypeDescControl?.hasError('required')).toBeTrue();
    });

    it('should require effective date', () => {
      const formGroup = component.testTypesFormArray.at(0);
      const effDateControl = formGroup.get('effDate');

      effDateControl?.setValue(null);
      expect(effDateControl?.hasError('required')).toBeTrue();
    });

    it('should validate test type code max length', () => {
      const formGroup = component.testTypesFormArray.at(0);
      const testTypeControl = formGroup.get('testType');

      testTypeControl?.setValue('TOOLONGGG');
      expect(testTypeControl?.hasError('maxlength')).toBeTrue();
    });

    it('should validate test type description max length', () => {
      const formGroup = component.testTypesFormArray.at(0);
      const testTypeDescControl = formGroup.get('testTypeDesc');

      testTypeDescControl?.setValue('A'.repeat(31));
      expect(testTypeDescControl?.hasError('maxlength')).toBeTrue();
    });

    it('should validate Y/N fields', () => {
      const formGroup = component.testTypesFormArray.at(0);
      const resUpdateControl = formGroup.get('resUpdate');

      resUpdateControl?.setValue('INVALID');
      expect(resUpdateControl?.hasError('invalidYesNo')).toBeTrue();

      resUpdateControl?.setValue('Y');
      expect(resUpdateControl?.valid).toBeTrue();
    });

    it('should validate effective date not in past for new records', () => {
      const formGroup = component.testTypesFormArray.at(0);
      const effDateControl = formGroup.get('effDate');

      effDateControl?.setValue(moment().subtract(1, 'day'));
      expect(effDateControl?.hasError('dateInPast')).toBeTrue();
    });

    it('should validate termination date after effective date', () => {
      const formGroup = component.testTypesFormArray.at(0);
      const effDateControl = formGroup.get('effDate');
      const termDateControl = formGroup.get('termDate');

      effDateControl?.setValue(moment().add(10, 'days'));
      termDateControl?.setValue(moment().add(5, 'days'));

      expect(formGroup.hasError('terminationBeforeEffective')).toBeTrue();
    });

    it('should require Y/N fields (resUpdate, othBnd, fullTechTwo)', () => {
      const formGroup = component.testTypesFormArray.at(0);

      formGroup.get('resUpdate')?.setValue(null);
      formGroup.get('othBnd')?.setValue(null);
      formGroup.get('fullTechTwo')?.setValue(null);

      expect(formGroup.get('resUpdate')?.hasError('required')).toBeTrue();
      expect(formGroup.get('othBnd')?.hasError('required')).toBeTrue();
      expect(formGroup.get('fullTechTwo')?.hasError('required')).toBeTrue();
    });

    it('should be valid when Y/N fields have Y or N value', () => {
      const formGroup = component.testTypesFormArray.at(0);

      formGroup.get('resUpdate')?.setValue('Y');
      formGroup.get('othBnd')?.setValue('N');
      formGroup.get('fullTechTwo')?.setValue('Y');

      expect(formGroup.get('resUpdate')?.valid).toBeTrue();
      expect(formGroup.get('othBnd')?.valid).toBeTrue();
      expect(formGroup.get('fullTechTwo')?.valid).toBeTrue();
    });

    it('should validate defaultControlValue max length of 30', () => {
      const formGroup = component.testTypesFormArray.at(0);
      const controlValueControl = formGroup.get('defaultControlValue');

      controlValueControl?.setValue('A'.repeat(31));
      expect(controlValueControl?.hasError('maxlength')).toBeTrue();

      controlValueControl?.setValue('A'.repeat(30));
      expect(controlValueControl?.hasError('maxlength')).toBeFalsy();
    });
  });

  describe('Gap 3.5 - Termination Date Validation for Existing Records', () => {
    it('should apply terminationDateNotInPastValidator for existing records', () => {
      const existingTestType: MultipleObservationTestTypeDto = {
        ...mockTestType,
        effDate: '2025-01-11T00:00:00Z',
        termDate: null
      };

      fixture.componentRef.setInput('testTypes', [existingTestType]);
      fixture.detectChanges();

      const formGroup = component.testTypesFormArray.at(0);
      const termDateControl = formGroup.get('termDate');

      termDateControl?.setValue(moment().subtract(1, 'day'));

      expect(termDateControl?.hasError('terminationDateInPast')).toBeTrue();
    });

    it('should allow future termination date for existing records', () => {
      fixture.componentRef.setInput('testTypes', [mockTestType]);
      fixture.detectChanges();

      const formGroup = component.testTypesFormArray.at(0);
      const termDateControl = formGroup.get('termDate');

      termDateControl?.setValue(moment().add(30, 'days'));
      expect(termDateControl?.valid).toBeTrue();
    });
  });

  describe('Gap 3.7 - Effective Date Validation for Editable Existing Records', () => {
    it('should apply effectiveDateNotInPastValidator for existing records with future effDate', () => {
      const futureTestType: MultipleObservationTestTypeDto = {
        ...mockTestType,
        effDate: moment().add(10, 'days').format('YYYY-MM-DD')
      };

      fixture.componentRef.setInput('testTypes', [futureTestType]);
      fixture.detectChanges();

      const formGroup = component.testTypesFormArray.at(0);
      const effDateControl = formGroup.get('effDate');

      expect(effDateControl?.disabled).toBeFalse();
      effDateControl?.setValue(moment().subtract(1, 'day'));
      expect(effDateControl?.hasError('dateInPast')).toBeTrue();
    });

    it('should disable effDate for existing records with past effDate', () => {
      const pastTestType: MultipleObservationTestTypeDto = {
        ...mockTestType,
        effDate: '2020-01-01'
      };

      fixture.componentRef.setInput('testTypes', [pastTestType]);
      fixture.detectChanges();

      const formGroup = component.testTypesFormArray.at(0);
      const effDateControl = formGroup.get('effDate');

      expect(effDateControl?.disabled).toBeTrue();
    });
  });

  describe('Timezone Fix - today getter uses ChapterTimezoneService', () => {
    it('should call getChapterLocalDate when today is accessed', () => {
      const chapterDate = moment('2026-08-04');
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(chapterDate);

      fixture.detectChanges();
      const today = (component as any).today;

      expect(chapterTimezoneServiceSpy.getChapterLocalDate).toHaveBeenCalled();
      expect(today.format('YYYY-MM-DD')).toBe('2026-08-04');
    });

    it('should return fresh chapter date on each access (getter, not cached)', () => {
      const date1 = moment('2026-08-04');
      const date2 = moment('2026-08-05');
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(date1);

      fixture.detectChanges();
      const today1 = (component as any).today;
      expect(today1.format('YYYY-MM-DD')).toBe('2026-08-04');

      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(date2);
      const today2 = (component as any).today;
      expect(today2.format('YYYY-MM-DD')).toBe('2026-08-05');
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('testId', 'ABORH');
      fixture.componentRef.setInput('testTypes', [mockTestType]);
      fixture.detectChanges();
    });

    it('should emit save event with form values', () => {
      spyOn(component.save, 'emit');

      component.gridForm.markAsDirty();
      component.hasUnsavedChanges.set(true);
      component.onSave();

      expect(component.save.emit).toHaveBeenCalled();
      const emittedData = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.modified).toBeDefined();
      expect(emittedData.deleted).toBeDefined();
    });

    it('should always emit empty deleted array (Gap 3.6 - no delete)', () => {
      spyOn(component.save, 'emit');

      component.gridForm.markAsDirty();
      component.hasUnsavedChanges.set(true);
      component.onSave();

      const emittedData = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.deleted).toEqual([]);
    });

    it('should mark all controls as touched on invalid save attempt', () => {
      const formGroup = component.testTypesFormArray.at(0);
      formGroup.get('testTypeDesc')?.setValue('');

      component.onSave();

      expect(formGroup.get('testTypeDesc')?.touched).toBeTrue();
    });

    it('should format dates to YYYY-MM-DD on save', () => {
      spyOn(component.save, 'emit');

      const formGroup = component.testTypesFormArray.at(0);
      formGroup.get('effDate')?.setValue(moment('2026-06-15'));
      formGroup.markAsDirty();
      component.gridForm.markAsDirty();
      component.hasUnsavedChanges.set(true);

      component.onSave();

      const emittedData = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      const modifiedItem = emittedData.modified.find((m: any) => m.testType === 'GAMMA');
      expect(modifiedItem?.effDate).toBe('2026-06-15');
    });

    it('should not emit save for unmodified rows', () => {
      spyOn(component.save, 'emit');

      component.gridForm.markAsDirty();
      component.hasUnsavedChanges.set(true);
      component.onSave();

      const emittedData = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.modified.length).toBe(0);
    });
  });

  describe('Clear All', () => {
    it('should reset form to original test types', () => {
      fixture.componentRef.setInput('testTypes', [mockTestType]);
      fixture.detectChanges();

      fixture.componentRef.setInput('testId', 'ABORH');
      fixture.detectChanges();
      component.onAddNewTestType();
      expect(component.testTypesFormArray.length).toBe(2);

      component.onClearAll();
      expect(component.testTypesFormArray.length).toBe(1);
      expect(component.hasUnsavedChanges()).toBeFalse();
    });
  });

  describe('Cancel', () => {
    it('should emit cancel event', () => {
      spyOn(component.cancel, 'emit');
      component.onCancel();
      expect(component.cancel.emit).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should compute isEmpty correctly when no rows', () => {
      fixture.componentRef.setInput('testTypes', []);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      expect((component as any).isEmpty()).toBeTrue();
    });

    it('should not be empty when loading', () => {
      fixture.componentRef.setInput('testTypes', []);
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      expect((component as any).isEmpty()).toBeFalse();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates to DD-MMM-YYYY', () => {
      const formatted = component.formatDate('2026-06-15T00:00:00Z');
      expect(formatted).toBe('15-JUN-2026');
    });

    it('should return empty string for null date', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return original value for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('testTypes', [mockTestType]);
      fixture.detectChanges();
    });

    it('should get control from row', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      const control = component.getControl(formGroup, 'testType');

      expect(control).toBeTruthy();
      expect(control?.value).toBe('GAMMA');
    });

    it('should identify new rows', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      expect(component.isRowNew(formGroup)).toBeFalse();
    });

    it('should generate unique element IDs', () => {
      const id = (component as any).elementId('test');
      expect(id).toContain('test-types-grid-');
      expect(id).toContain('-test');
    });

    it('should generate unique error IDs', () => {
      const id = (component as any).errorId(0, 'testType');
      expect(id).toContain('test-types-grid-');
      expect(id).toContain('-row0-testType-error');
    });

    it('should get row index', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      const index = (component as any).getRowIndex(formGroup);
      expect(index).toBe(0);
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('testId', 'ABORH');
      fixture.componentRef.setInput('testTypes', []);
      fixture.detectChanges();
      component.onAddNewTestType();
    });

    it('should return error message for required test type', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      const control = formGroup.get('testType');
      control.setValue('');
      control.markAsTouched();

      expect(component.getErrorMessage(formGroup, 'testType')).toBe('Test Type Code is required');
    });

    it('should return error message for required Y/N field', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      const control = formGroup.get('resUpdate');
      control.setValue(null);
      control.markAsTouched();

      expect(component.getErrorMessage(formGroup, 'resUpdate')).toBe('Update Result is required');
    });

    it('should return error message for invalid Y/N value', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      const control = formGroup.get('resUpdate');
      control.setValue('INVALID');
      control.markAsTouched();

      expect(component.getErrorMessage(formGroup, 'resUpdate')).toBe('Value must be Y or N');
    });

    it('should return error message for past effective date', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      const control = formGroup.get('effDate');
      control.setValue(moment().subtract(5, 'days'));
      control.markAsTouched();

      expect(component.getErrorMessage(formGroup, 'effDate')).toBe('Effective date cannot be in the past');
    });

    it('should return error message for past termination date', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      const control = formGroup.get('termDate');
      control.setValue(moment().subtract(5, 'days'));
      control.markAsTouched();

      expect(component.getErrorMessage(formGroup, 'termDate')).toBe('Termination date has passed');
    });

    it('should return empty string for untouched controls', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      expect(component.getErrorMessage(formGroup, 'testType')).toBe('');
    });

    it('should return empty string for valid controls', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      const control = formGroup.get('testType');
      control.setValue('VALID');
      control.markAsTouched();

      expect(component.getErrorMessage(formGroup, 'testType')).toBe('');
    });
  });

  describe('Field Error Detection', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('testId', 'ABORH');
      fixture.componentRef.setInput('testTypes', []);
      fixture.detectChanges();
      component.onAddNewTestType();
    });

    it('should detect field errors for invalid touched controls', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      const control = formGroup.get('testType');
      control.setValue('');
      control.markAsTouched();

      expect(component.hasFieldError(formGroup, 'testType')).toBeTrue();
    });

    it('should not detect field errors for untouched controls', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      expect(component.hasFieldError(formGroup, 'testType')).toBeFalse();
    });

    it('should detect term date cross-field validation errors', () => {
      const formGroup = component.testTypesFormArray.at(0) as any;
      formGroup.get('effDate')?.setValue(moment().add(10, 'days'));
      formGroup.get('termDate')?.setValue(moment().add(5, 'days'));
      formGroup.get('termDate')?.markAsTouched();

      expect(component.hasFieldError(formGroup, 'termDate')).toBeTrue();
    });
  });

  describe('Test Type Input', () => {
    it('should convert test type to uppercase', () => {
      fixture.componentRef.setInput('testId', 'ABORH');
      fixture.componentRef.setInput('testTypes', []);
      fixture.detectChanges();
      component.onAddNewTestType();

      const formGroup = component.testTypesFormArray.at(0) as any;
      const control = component.getControl(formGroup, 'testType');

      control.setValue('abc');
      component.onTestTypeInput(control);
      expect(control.value).toBe('ABC');
    });
  });
});
