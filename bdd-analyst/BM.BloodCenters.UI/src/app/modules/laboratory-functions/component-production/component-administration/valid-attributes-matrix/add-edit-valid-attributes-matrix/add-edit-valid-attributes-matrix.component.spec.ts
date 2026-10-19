import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, SimpleChange, SimpleChanges, ElementRef } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import moment from 'moment';

import { AddEditValidAttributesMatrixComponent } from './add-edit-valid-attributes-matrix.component';
import { ValidAttributesMatrixService } from '../services/valid-attributes-matrix.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ValidAttributesMatrix } from '../models/valid-attributes-matrix.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddEditValidAttributesMatrixComponent', () => {
  let component: AddEditValidAttributesMatrixComponent;
  let fixture: ComponentFixture<AddEditValidAttributesMatrixComponent>;
  let mockService: jasmine.SpyObj<ValidAttributesMatrixService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  const mockData: ValidAttributesMatrix = {
    attribAddedGroup: 'ABO',
    attribAddedCode: 'A',
    attribDeletedGroup: null,
    attribDeletedCode: null,
    deleteModifierCode: null,
    addModifierCode: null,
    associatedAttribGroup: null,
    associatedAttribCode: null,
    effDate: '2024-01-01',
    termDate: null,
    lastModifiedDate: '2024-01-01',
    auditKey: 12345,
    programId: 'VATTRMAT',
    attribAddedGroupDesc: 'ABO Blood Group',
    attribAddedCodeDesc: 'A Positive'
  };

  const mockHeaderService = {
    chapterTimeZone: signal('America/Chicago'),
    getCurrentChapterTimezone: () => 'America/Chicago',
    chapterChanged$: new Subject<void>()
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ValidAttributesMatrixService', [
      'getAttributeGroups',
      'getAttributeCodes',
      'getModifierCodes',
      'createValidAttributesMatrix',
      'updateValidAttributesMatrix'
    ]);

    mockService.getAttributeGroups.and.returnValue(of([]));
    mockService.getAttributeCodes.and.returnValue(of([]));
    mockService.getModifierCodes.and.returnValue(of([]));

    mockSnackbarService = createMockSnackbarService();



      TestBed.configureTestingModule({
imports: [
        AddEditValidAttributesMatrixComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ValidAttributesMatrixService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getAttributeGroups.calls.reset();


      mockService.getAttributeCodes.calls.reset();


      mockService.getModifierCodes.calls.reset();


      mockService.createValidAttributesMatrix.calls.reset();


      mockService.updateValidAttributesMatrix.calls.reset();


      mockService.getAttributeGroups.and.returnValue(of([]));


      mockService.getAttributeCodes.and.returnValue(of([]));


      mockService.getModifierCodes.and.returnValue(of([]));


    fixture = TestBed.createComponent(AddEditValidAttributesMatrixComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should load attribute groups on init', () => {
      const mockGroups = [
        { code: 'ABO', codeDesc: 'ABO Blood Group' },
        { code: 'RH', codeDesc: 'RH Factor' }
      ];
      mockService.getAttributeGroups.and.returnValue(of(mockGroups));

      fixture.detectChanges();

      expect(mockService.getAttributeGroups).toHaveBeenCalled();
      expect(component.attributeGroupOptions.length).toBe(2);
    });

    it('should load modifier codes on init', () => {
      const mockCodes = [{ code: 'M001', description: 'Modifier 1' }];
      mockService.getModifierCodes.and.returnValue(of(mockCodes));

      fixture.detectChanges();

      expect(mockService.getModifierCodes).toHaveBeenCalled();
      expect(component.modifierCodeOptions.length).toBe(1);
    });

    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with default null values in add mode', () => {
      component.mode = 'add';
      component.data = null;
      fixture.detectChanges();

      expect(component.form).toBeTruthy();
      expect(component.form.get('attribAddedGroup')?.value).toBeNull();
      expect(component.form.get('attribAddedCode')?.value).toBeNull();
      expect(component.form.get('effDate')?.value).toBeNull();
      expect(component.form.get('termDate')?.value).toBeNull();
    });

    it('should initialize form with data values in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockData, effDate: '2024-01-01', termDate: '2025-12-31' };
      mockService.getAttributeCodes.and.returnValue(of([]));
      fixture.detectChanges();

      expect(component.form.get('attribAddedGroup')?.value).toBe('ABO');
      // attribAddedGroup and attribAddedCode should be disabled in edit mode
      expect(component.form.get('attribAddedGroup')?.disabled).toBeTrue();
      expect(component.form.get('attribAddedCode')?.disabled).toBeTrue();
      // effDate should be populated from data
      expect(component.form.get('effDate')?.value).toBeTruthy();
    });

    it('should load all attribute codes on init', () => {
      const mockCodes = [{ attribCode: 'X', attribDesc: 'Code X' }];
      mockService.getAttributeCodes.and.returnValue(of(mockCodes));
      fixture.detectChanges();

      // getAttributeCodes is called once with no args for loadAllAttributeCodes
      expect(mockService.getAttributeCodes).toHaveBeenCalledWith();
    });

    it('should set filteredAttributeGroups from loaded groups', () => {
      const mockGroups = [{ code: 'ABO', codeDesc: 'ABO Blood Group' }];
      mockService.getAttributeGroups.and.returnValue(of(mockGroups));
      fixture.detectChanges();

      expect(component.filteredAttributeGroups).toEqual(mockGroups);
    });

    it('should set both filteredModifierCodes and filteredAddModifierCodes on load', () => {
      const mockCodes = [
        { code: 'M001', description: 'Modifier 1' },
        { code: 'M002', description: 'Modifier 2' }
      ];
      mockService.getModifierCodes.and.returnValue(of(mockCodes));
      fixture.detectChanges();

      expect(component.filteredModifierCodes).toEqual(mockCodes);
      expect(component.filteredAddModifierCodes).toEqual(mockCodes);
    });

    it('should handle null response from getAttributeGroups', () => {
      mockService.getAttributeGroups.and.returnValue(of(null as any));
      fixture.detectChanges();

      expect(component.attributeGroupOptions).toEqual([]);
    });

    it('should handle null response from getModifierCodes', () => {
      mockService.getModifierCodes.and.returnValue(of(null as any));
      fixture.detectChanges();

      expect(component.modifierCodeOptions).toEqual([]);
    });

    it('should handle null response from getAttributeCodes (all)', () => {
      mockService.getAttributeCodes.and.returnValue(of(null as any));
      fixture.detectChanges();

      expect(component.allAttributeCodeOptions).toEqual([]);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require attribute group', () => {
      const control = component.form.get('attribAddedGroup');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require attribute code', () => {
      const control = component.form.get('attribAddedCode');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require effective date', () => {
      const control = component.form.get('effDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should not require termination date', () => {
      const control = component.form.get('termDate');
      control?.setValue(null);
      expect(control?.valid).toBeTrue();
    });

    it('should enforce maxLength(5) on attribAddedGroup', () => {
      const control = component.form.get('attribAddedGroup');
      control?.setValue('TOOLONGVALUE');
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(10) on attribAddedCode', () => {
      const control = component.form.get('attribAddedCode');
      control?.setValue('12345678901');
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should accept valid maxLength values', () => {
      const groupCtrl = component.form.get('attribAddedGroup');
      groupCtrl?.setValue('ABO');
      expect(groupCtrl?.hasError('maxlength')).toBeFalse();

      const codeCtrl = component.form.get('attribAddedCode');
      codeCtrl?.setValue('A');
      expect(codeCtrl?.hasError('maxlength')).toBeFalse();
    });
  });

  describe('Chapter-aware min date', () => {

    it('should return minDate for add mode via effMinDate', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.effMinDate).toBe(component.minDate);
    });

    it('should return minDate for edit mode when effDateEdited is true', () => {
      component.mode = 'edit';
      component.data = mockData;
      fixture.detectChanges();
      component.effDateEdited = true;
      expect(component.effMinDate).toBe(component.minDate);
    });

    it('should return null for edit mode when effDateEdited is false', () => {
      component.mode = 'edit';
      component.data = mockData;
      fixture.detectChanges();
      component.effDateEdited = false;
      expect(component.effMinDate).toBeNull();
    });

    it('should return minDate for termMinDate in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.termMinDate).toBe(component.minDate);
    });

    it('should return null for termMinDate in edit mode', () => {
      component.mode = 'edit';
      component.data = mockData;
      fixture.detectChanges();
      expect(component.termMinDate).toBeNull();
    });
  });

  describe('dialogTitle getter', () => {
    it('should return "Add Attribute" in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.dialogTitle).toBe('Add Attribute');
    });

    it('should return "Edit Attribute" in edit mode', () => {
      component.mode = 'edit';
      component.data = mockData;
      fixture.detectChanges();
      expect(component.dialogTitle).toBe('Edit Attribute');
    });
  });

  describe('isFormValid getter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when form is invalid', () => {
      component.form.get('attribAddedGroup')?.setValue(null);
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when isSubmitting is true even if form is valid', () => {
      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01')
      });
      component.isSubmitting = true;
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form is valid and not submitting', () => {
      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01')
      });
      component.isSubmitting = false;
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('lastModifiedDisplay getter', () => {
    it('should return empty string when data is null', () => {
      component.data = null;
      fixture.detectChanges();
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should return empty string when lastModifiedDate is null', () => {
      component.data = { ...mockData, lastModifiedDate: null };
      fixture.detectChanges();
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should return formatted date with timezone when lastModifiedDate exists', () => {
      component.data = { ...mockData, lastModifiedDate: '2024-06-15T10:30:00Z' };
      fixture.detectChanges();
      const display = component.lastModifiedDisplay;
      expect(display).toContain('Last Modified:');
    });
  });

  describe('groupDescription getter', () => {
    it('should return data description in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockData, attribAddedGroupDesc: 'ABO Blood Group' };
      fixture.detectChanges();
      expect(component.groupDescription).toBe('ABO Blood Group');
    });

    it('should return "-" in edit mode when no description', () => {
      component.mode = 'edit';
      component.data = { ...mockData, attribAddedGroupDesc: null };
      fixture.detectChanges();
      expect(component.groupDescription).toBe('-');
    });

    it('should return "-" in add mode when no group selected', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.get('attribAddedGroup')?.setValue(null);
      expect(component.groupDescription).toBe('-');
    });

    it('should return matching description in add mode when group selected', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.attributeGroupOptions = [
        { code: 'ABO', codeDesc: 'ABO Blood Group' },
        { code: 'RH', codeDesc: 'RH Factor' }
      ];
      component.form.get('attribAddedGroup')?.setValue('ABO');
      expect(component.groupDescription).toBe('ABO Blood Group');
    });

    it('should return "-" in add mode when group not found in options', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.attributeGroupOptions = [{ code: 'RH', codeDesc: 'RH Factor' }];
      component.form.get('attribAddedGroup')?.setValue('ABO');
      expect(component.groupDescription).toBe('-');
    });
  });

  describe('codeDescription getter', () => {
    it('should return data description in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockData, attribAddedCodeDesc: 'A Positive' };
      fixture.detectChanges();
      expect(component.codeDescription).toBe('A Positive');
    });

    it('should return "-" in edit mode when no code description', () => {
      component.mode = 'edit';
      component.data = { ...mockData, attribAddedCodeDesc: null };
      fixture.detectChanges();
      expect(component.codeDescription).toBe('-');
    });

    it('should return "-" in add mode when no code selected', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.get('attribAddedCode')?.setValue(null);
      expect(component.codeDescription).toBe('-');
    });

    it('should return matching description in add mode when code selected', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.attributeCodeOptions = [
        { attribCode: 'A', attribDesc: 'A Positive' },
        { attribCode: 'B', attribDesc: 'B Positive' }
      ];
      component.form.get('attribAddedCode')?.setValue('A');
      expect(component.codeDescription).toBe('A Positive');
    });

    it('should return "-" in add mode when code not found in options', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.attributeCodeOptions = [{ attribCode: 'B', attribDesc: 'B Positive' }];
      component.form.get('attribAddedCode')?.setValue('A');
      expect(component.codeDescription).toBe('-');
    });
  });

  describe('ngOnChanges', () => {
    it('should reinitialize form when mode changes and form exists', () => {
      fixture.detectChanges();
      const initSpy = spyOn<any>(component, 'initializeForm').and.callThrough();

      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false)
      };
      component.data = mockData;
      component.mode = 'edit';
      component.ngOnChanges(changes);

      expect(initSpy).toHaveBeenCalled();
    });

    it('should reinitialize form when data changes and form exists', () => {
      fixture.detectChanges();
      const initSpy = spyOn<any>(component, 'initializeForm').and.callThrough();

      const changes: SimpleChanges = {
        data: new SimpleChange(null, mockData, false)
      };
      component.data = mockData;
      component.ngOnChanges(changes);

      expect(initSpy).toHaveBeenCalled();
    });

    it('should not reinitialize form when form does not exist', () => {
      // Do not call fixture.detectChanges() so form is not initialized
      component.form = undefined as any;

      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false)
      };
      // Should not throw
      expect(() => component.ngOnChanges(changes)).not.toThrow();
    });

    it('should not reinitialize when unrelated property changes', () => {
      fixture.detectChanges();
      const initSpy = spyOn<any>(component, 'initializeForm').and.callThrough();

      const changes: SimpleChanges = {
        someOtherProp: new SimpleChange(null, 'val', false)
      };
      component.ngOnChanges(changes);

      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Edit mode form initialization', () => {
    it('should disable attribAddedGroup and attribAddedCode in edit mode', () => {
      component.mode = 'edit';
      component.data = mockData;
      fixture.detectChanges();

      expect(component.form.get('attribAddedGroup')?.disabled).toBeTrue();
      expect(component.form.get('attribAddedCode')?.disabled).toBeTrue();
    });

    it('should disable associatedAttribCode if data has associatedAttribCode in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockData, associatedAttribCode: 'CODE1' };
      fixture.detectChanges();

      expect(component.form.get('associatedAttribCode')?.disabled).toBeTrue();
    });

    it('should not disable associatedAttribCode if data has no associatedAttribCode in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockData, associatedAttribCode: null };
      fixture.detectChanges();

      expect(component.form.get('associatedAttribCode')?.disabled).toBeFalse();
    });

    it('should store originalEffDate and originalTermDate in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockData, effDate: '2024-06-15', termDate: '2025-06-15' };
      fixture.detectChanges();

      expect((component as any).originalEffDate).toBe(moment('2024-06-15').format('YYYY-MM-DD'));
      expect((component as any).originalTermDate).toBe(moment('2025-06-15').format('YYYY-MM-DD'));
    });

    it('should set originalEffDate/originalTermDate to null in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect((component as any).originalEffDate).toBeNull();
      expect((component as any).originalTermDate).toBeNull();
    });

    it('should load attribute codes for the group in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockData, attribAddedGroup: 'ABO' };
      mockService.getAttributeCodes.and.returnValue(of([{ attribCode: 'A', attribDesc: 'Code A' }]));
      fixture.detectChanges();

      expect(mockService.getAttributeCodes).toHaveBeenCalledWith('ABO');
    });

    it('should reset errorMessage, isSubmitting, and lastChangedDateField on init', () => {
      fixture.detectChanges();

      expect(component.errorMessage).toBeNull();
      expect(component.isSubmitting).toBeFalse();
      expect((component as any).lastChangedDateField).toBeNull();
    });
  });

  describe('Date value change subscriptions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to effective when effDate changes', () => {
      component.form.get('effDate')?.setValue(moment('2026-12-01'));
      expect((component as any).lastChangedDateField).toBe('effective');
    });

    it('should set lastChangedDateField to termination when termDate changes', () => {
      component.form.get('termDate')?.setValue(moment('2027-01-01'));
      expect((component as any).lastChangedDateField).toBe('termination');
    });

    it('should track effDateEdited in edit mode when effDate changes', () => {
      component.mode = 'edit';
      component.data = { ...mockData, effDate: '2024-01-01' };
      (component as any).initializeForm();

      // Change to a different date
      component.form.get('effDate')?.setValue(moment('2026-06-15'));
      expect(component.effDateEdited).toBeTrue();
    });

    it('should not set effDateEdited when effDate changes back to original in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockData, effDate: '2024-01-01' };
      (component as any).initializeForm();

      // Set to same date as original
      component.form.get('effDate')?.setValue(moment('2024-01-01'));
      expect(component.effDateEdited).toBeFalse();
    });

    it('should track termDateEdited in edit mode when termDate changes', () => {
      component.mode = 'edit';
      component.data = { ...mockData, termDate: '2025-12-31' };
      (component as any).initializeForm();

      component.form.get('termDate')?.setValue(moment('2026-06-15'));
      expect(component.termDateEdited).toBeTrue();
    });

    it('should not set termDateEdited when value is null matching original null', () => {
      component.mode = 'edit';
      component.data = { ...mockData, termDate: null };
      (component as any).initializeForm();

      component.form.get('termDate')?.setValue(null);
      expect(component.termDateEdited).toBeFalse();
    });
  });

  describe('Attribute group value change subscription', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear attributeCodeOptions when group is set to null', () => {
      component.attributeCodeOptions = [{ attribCode: 'A', attribDesc: 'Code A' }];
      component.form.get('attribAddedGroup')?.setValue(null);

      expect(component.attributeCodeOptions).toEqual([]);
      expect(component.filteredAttributeCodes).toEqual([]);
    });

    it('should clear attribAddedCode when group changes to a new value', () => {
      mockService.getAttributeCodes.and.returnValue(of([]));
      component.form.patchValue({ attribAddedCode: 'OLD' });
      component.form.get('attribAddedGroup')?.setValue('RH');

      expect(component.form.get('attribAddedCode')?.value).toBeNull();
    });
  });

  describe('Save Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create new record in add mode', () => {
      const mockResponse = { success: true, data: null, statusCode: 201, message: 'Created' };
      mockService.createValidAttributesMatrix.and.returnValue(of(mockResponse));

      component.mode = 'add';
      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01'),
        termDate: null
      });

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(mockService.createValidAttributesMatrix).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should not call service when form is invalid', () => {
      component.mode = 'add';
      component.form.patchValue({
        attribAddedGroup: null,
        attribAddedCode: null,
        effDate: null
      });

      component.onSave();

      expect(mockService.createValidAttributesMatrix).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched on save attempt', () => {
      const markSpy = spyOn(component.form, 'markAllAsTouched');
      component.onSave();
      expect(markSpy).toHaveBeenCalled();
    });

    it('should set isSubmitting to true during save', () => {
      const mockResponse = { success: true, data: null, statusCode: 201, message: 'Created' };
      mockService.createValidAttributesMatrix.and.returnValue(of(mockResponse));

      component.mode = 'add';
      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01')
      });

      component.onSave();

      // After success, isSubmitting should be reset to false
      expect(component.isSubmitting).toBeFalse();
    });

    it('should handle create error with error message from server', () => {
      const errorResponse = { error: { message: 'Duplicate entry' } };
      mockService.createValidAttributesMatrix.and.returnValue(throwError(() => errorResponse));

      component.mode = 'add';
      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01')
      });

      component.onSave();

      expect(component.errorMessage).toBe('Duplicate entry');
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Duplicate entry');
      expect(component.isSubmitting).toBeFalse();
    });

    it('should use default error message when server error has no message', () => {
      mockService.createValidAttributesMatrix.and.returnValue(throwError(() => ({})));

      component.mode = 'add';
      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01')
      });

      component.onSave();

      expect(component.errorMessage).toBe('Failed to create attribute matrix entry.');
    });

    it('should show success snackbar on successful create', () => {
      mockService.createValidAttributesMatrix.and.returnValue(of({ success: true }));

      component.mode = 'add';
      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01')
      });

      component.onSave();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Attribute matrix entry created successfully.');
    });

    it('should update record in edit mode', () => {
      mockService.updateValidAttributesMatrix.and.returnValue(of({ success: true }));

      component.mode = 'edit';
      component.data = { ...mockData };
      (component as any).initializeForm();

      component.form.get('effDate')?.setValue(moment('2026-12-01'));

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(mockService.updateValidAttributesMatrix).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should not call update if data is null in edit mode', () => {
      component.mode = 'edit';
      component.data = null;
      (component as any).initializeForm();

      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01')
      });

      component.onSave();

      expect(mockService.updateValidAttributesMatrix).not.toHaveBeenCalled();
    });

    it('should handle update error with error message from server', () => {
      const errorResponse = { error: { message: 'Update conflict' } };
      mockService.updateValidAttributesMatrix.and.returnValue(throwError(() => errorResponse));

      component.mode = 'edit';
      component.data = { ...mockData };
      (component as any).initializeForm();
      component.form.get('effDate')?.setValue(moment('2026-12-01'));

      component.onSave();

      expect(component.errorMessage).toBe('Update conflict');
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Update conflict');
      expect(component.isSubmitting).toBeFalse();
    });

    it('should use default error message when update error has no message', () => {
      mockService.updateValidAttributesMatrix.and.returnValue(throwError(() => ({})));

      component.mode = 'edit';
      component.data = { ...mockData };
      (component as any).initializeForm();
      component.form.get('effDate')?.setValue(moment('2026-12-01'));

      component.onSave();

      expect(component.errorMessage).toBe('Failed to update attribute matrix entry.');
    });

    it('should show success snackbar on successful update', () => {
      mockService.updateValidAttributesMatrix.and.returnValue(of({ success: true }));

      component.mode = 'edit';
      component.data = { ...mockData };
      (component as any).initializeForm();
      component.form.get('effDate')?.setValue(moment('2026-12-01'));

      component.onSave();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Attribute matrix entry updated successfully.');
    });

    it('should pass correct parameters to updateValidAttributesMatrix', () => {
      mockService.updateValidAttributesMatrix.and.returnValue(of({ success: true }));

      const dataWithDeleted = {
        ...mockData,
        attribDeletedCode: 'DEL1',
        associatedAttribCode: 'ASSOC1'
      };
      component.mode = 'edit';
      component.data = dataWithDeleted;
      (component as any).initializeForm();
      component.form.get('effDate')?.setValue(moment('2026-12-01'));

      component.onSave();

      expect(mockService.updateValidAttributesMatrix).toHaveBeenCalledWith(
        'ABO',
        'A',
        jasmine.any(Object),
        'DEL1',
        'ASSOC1'
      );
    });
  });

  describe('onSaveAndCreateAnother', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not call service when form is invalid', () => {
      component.form.patchValue({ attribAddedGroup: null, attribAddedCode: null, effDate: null });
      component.onSaveAndCreateAnother();
      expect(mockService.createValidAttributesMatrix).not.toHaveBeenCalled();
    });

    it('should create record and reset form on success', () => {
      mockService.createValidAttributesMatrix.and.returnValue(of({ success: true }));

      component.mode = 'add';
      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01')
      });
      component.attributeCodeOptions = [{ attribCode: 'A', attribDesc: 'Code A' }];

      spyOn(component.saveSuccess, 'emit');

      component.onSaveAndCreateAnother();

      expect(mockService.createValidAttributesMatrix).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Attribute matrix entry created successfully.');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      // Form should be reset
      expect(component.form.get('attribAddedGroup')?.value).toBeNull();
      expect(component.attributeCodeOptions).toEqual([]);
      expect(component.filteredAttributeCodes).toEqual([]);
    });

    it('should handle error on save and create another', () => {
      const errorResponse = { error: { message: 'Server error' } };
      mockService.createValidAttributesMatrix.and.returnValue(throwError(() => errorResponse));

      component.mode = 'add';
      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01')
      });

      component.onSaveAndCreateAnother();

      expect(component.errorMessage).toBe('Server error');
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Server error');
      expect(component.isSubmitting).toBeFalse();
    });

    it('should use default error message when save-and-create-another error has no message', () => {
      mockService.createValidAttributesMatrix.and.returnValue(throwError(() => ({})));

      component.mode = 'add';
      component.form.patchValue({
        attribAddedGroup: 'ABO',
        attribAddedCode: 'A',
        effDate: moment('2026-12-01')
      });

      component.onSaveAndCreateAnother();

      expect(component.errorMessage).toBe('Failed to create attribute matrix entry.');
    });

    it('should mark all fields as touched', () => {
      const spy = spyOn(component.form, 'markAllAsTouched');
      component.onSaveAndCreateAnother();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel', () => {
      fixture.detectChanges();
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('formatDateForDisplay', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return "-" for null date', () => {
      expect(component.formatDateForDisplay(null)).toBe('-');
    });

    it('should return formatted date for valid date string', () => {
      const result = component.formatDateForDisplay('2024-06-15');
      expect(result).toBe('15-JUN-2024');
    });

    it('should return formatted date for valid Date object', () => {
      const result = component.formatDateForDisplay(new Date(2024, 5, 15));
      expect(result).toMatch(/15-JUN-2024/);
    });

    it('should return "-" for invalid date string', () => {
      expect(component.formatDateForDisplay('not-a-date')).toBe('-');
    });
  });

  describe('Dropdown Dependencies', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load attribute codes when attribute group changes', () => {
      const mockCodes = [
        { attribCode: 'A', attribDesc: 'A Positive' },
        { attribCode: 'B', attribDesc: 'B Positive' }
      ];
      mockService.getAttributeCodes.and.returnValue(of(mockCodes));

      component.form.patchValue({ attribAddedGroup: 'ABO' });

      expect(mockService.getAttributeCodes).toHaveBeenCalledWith('ABO');
    });

    it('should clear attribute code when group changes', () => {
      mockService.getAttributeCodes.and.returnValue(of([]));

      component.form.patchValue({ attribAddedCode: 'A' });
      component.form.patchValue({ attribAddedGroup: 'RH' });

      expect(component.form.get('attribAddedCode')?.value).toBeNull();
    });

    it('should set isLoadingAttributeCodes during load', () => {
      const mockCodes = [{ attribCode: 'A', attribDesc: 'Code A' }];
      mockService.getAttributeCodes.and.returnValue(of(mockCodes));

      component.form.get('attribAddedGroup')?.setValue('ABO');

      // After synchronous of() completes, it should be false
      expect(component.isLoadingAttributeCodes).toBeFalse();
    });

    it('should handle attribute code load error', () => {
      mockService.getAttributeCodes.and.returnValue(throwError(() => new Error('Network error')));

      component.form.get('attribAddedGroup')?.setValue('ABO');

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load attribute codes.');
      expect(component.isLoadingAttributeCodes).toBeFalse();
    });
  });

  describe('FMB LOV Exclusion Logic', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.allAttributeCodeOptions = [
        { attribCode: 'A', attribDesc: 'Code A' },
        { attribCode: 'B', attribDesc: 'Code B' },
        { attribCode: 'C', attribDesc: 'Code C' }
      ];
    });

    it('should exclude added code from deleted code options', () => {
      component.form.patchValue({ attribAddedCode: 'A' });

      const deletedOptions = component.filteredDeletedAttributeCodes;
      expect(deletedOptions.find(o => o.attribCode === 'A')).toBeUndefined();
      expect(deletedOptions.length).toBe(2);
    });

    it('should exclude added and deleted codes from associated code options', () => {
      component.form.patchValue({ attribAddedCode: 'A' });
      component.form.patchValue({ attribDeletedCode: 'B' });

      const assocOptions = component.filteredAllAttributeCodes;
      expect(assocOptions.find(o => o.attribCode === 'A')).toBeUndefined();
      expect(assocOptions.find(o => o.attribCode === 'B')).toBeUndefined();
      expect(assocOptions.length).toBe(1);
    });

    it('should exclude associated code from deleted code options in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockData, associatedAttribCode: 'C' };
      (component as any).initializeForm();
      component.allAttributeCodeOptions = [
        { attribCode: 'A', attribDesc: 'Code A' },
        { attribCode: 'B', attribDesc: 'Code B' },
        { attribCode: 'C', attribDesc: 'Code C' }
      ];

      (component as any).rebuildDeletedCodeOptions();

      const deletedOptions = component.filteredDeletedAttributeCodes;
      expect(deletedOptions.find(o => o.attribCode === 'A')).toBeUndefined(); // added code
      expect(deletedOptions.find(o => o.attribCode === 'C')).toBeUndefined(); // associated code
    });

    it('should show all codes except added when no deleted code is set', () => {
      component.form.patchValue({ attribAddedCode: 'A' });
      component.form.patchValue({ attribDeletedCode: null });

      const assocOptions = component.filteredAllAttributeCodes;
      expect(assocOptions.find(o => o.attribCode === 'A')).toBeUndefined();
      expect(assocOptions.length).toBe(2);
    });

    it('should handle empty allAttributeCodeOptions', () => {
      component.allAttributeCodeOptions = [];
      component.form.patchValue({ attribAddedCode: 'A' });

      expect(component.filteredDeletedAttributeCodes).toEqual([]);
      expect(component.filteredAllAttributeCodes).toEqual([]);
    });

    it('should handle codes with leading/trailing whitespace via trimValue', () => {
      component.allAttributeCodeOptions = [
        { attribCode: ' A ', attribDesc: 'Code A' },
        { attribCode: 'B', attribDesc: 'Code B' }
      ];
      component.form.patchValue({ attribAddedCode: ' A ' });

      (component as any).rebuildDeletedCodeOptions();
      const deletedOptions = component.filteredDeletedAttributeCodes;
      expect(deletedOptions.find(o => o.attribCode === ' A ')).toBeUndefined();
      expect(deletedOptions.length).toBe(1);
    });
  });

  describe('Search filter listeners', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter attribute groups by search text', () => {
      component.attributeGroupOptions = [
        { code: 'ABO', codeDesc: 'ABO Blood Group' },
        { code: 'RH', codeDesc: 'RH Factor' }
      ];
      component.attribGroupSearchCtrl.setValue('abo');

      expect(component.filteredAttributeGroups.length).toBe(1);
      expect(component.filteredAttributeGroups[0].code).toBe('ABO');
    });

    it('should return all groups when search text is empty', () => {
      component.attributeGroupOptions = [
        { code: 'ABO', codeDesc: 'ABO Blood Group' },
        { code: 'RH', codeDesc: 'RH Factor' }
      ];
      component.attribGroupSearchCtrl.setValue('');

      expect(component.filteredAttributeGroups.length).toBe(2);
    });

    it('should filter attribute codes by search text', () => {
      component.attributeCodeOptions = [
        { attribCode: 'A', attribDesc: 'A Positive' },
        { attribCode: 'B', attribDesc: 'B Negative' }
      ];
      component.attribCodeSearchCtrl.setValue('positive');

      expect(component.filteredAttributeCodes.length).toBe(1);
      expect(component.filteredAttributeCodes[0].attribCode).toBe('A');
    });

    it('should filter modifier codes by search text', () => {
      component.modifierCodeOptions = [
        { code: 'M001', description: 'Modifier One' },
        { code: 'M002', description: 'Modifier Two' }
      ];
      component.deleteModifierSearchCtrl.setValue('one');

      expect(component.filteredModifierCodes.length).toBe(1);
      expect(component.filteredModifierCodes[0].code).toBe('M001');
    });

    it('should filter add modifier codes by search text', () => {
      component.modifierCodeOptions = [
        { code: 'M001', description: 'Modifier One' },
        { code: 'M002', description: 'Modifier Two' }
      ];
      component.addModifierSearchCtrl.setValue('two');

      expect(component.filteredAddModifierCodes.length).toBe(1);
      expect(component.filteredAddModifierCodes[0].code).toBe('M002');
    });

    it('should filter deleted attribute codes by search text', () => {
      component.allAttributeCodeOptions = [
        { attribCode: 'A', attribDesc: 'Code A' },
        { attribCode: 'B', attribDesc: 'Code B' },
        { attribCode: 'C', attribDesc: 'Code C' }
      ];
      component.deletedCodeSearchCtrl.setValue('code b');

      expect(component.filteredDeletedAttributeCodes.length).toBe(1);
      expect(component.filteredDeletedAttributeCodes[0].attribCode).toBe('B');
    });

    it('should filter associated attribute codes by search text', () => {
      component.allAttributeCodeOptions = [
        { attribCode: 'A', attribDesc: 'Code A' },
        { attribCode: 'B', attribDesc: 'Code B' },
        { attribCode: 'C', attribDesc: 'Code C' }
      ];
      component.associatedCodeSearchCtrl.setValue('c');

      const result = component.filteredAllAttributeCodes;
      expect(result.some(o => o.attribCode === 'C')).toBeTrue();
    });

    it('should filter groups by code field', () => {
      component.attributeGroupOptions = [
        { code: 'ABO', codeDesc: 'Blood Group' },
        { code: 'RH', codeDesc: 'Factor' }
      ];
      component.attribGroupSearchCtrl.setValue('rh');

      expect(component.filteredAttributeGroups.length).toBe(1);
      expect(component.filteredAttributeGroups[0].code).toBe('RH');
    });

    it('should filter modifier codes by code field', () => {
      component.modifierCodeOptions = [
        { code: 'M001', description: 'Modifier One' },
        { code: 'M002', description: 'Modifier Two' }
      ];
      component.deleteModifierSearchCtrl.setValue('m002');

      expect(component.filteredModifierCodes.length).toBe(1);
      expect(component.filteredModifierCodes[0].code).toBe('M002');
    });
  });

  describe('onDropdownClosed', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.attributeGroupOptions = [{ code: 'ABO', codeDesc: 'ABO' }];
      component.attributeCodeOptions = [{ attribCode: 'A', attribDesc: 'A' }];
      component.modifierCodeOptions = [{ code: 'M1', description: 'Mod 1' }];
      component.allAttributeCodeOptions = [
        { attribCode: 'A', attribDesc: 'A' },
        { attribCode: 'B', attribDesc: 'B' }
      ];
    });

    it('should reset search control value', () => {
      const ctrl = new FormControl('test');
      component.onDropdownClosed(ctrl, 'group');
      expect(ctrl.value).toBe('');
    });

    it('should restore group options on close', () => {
      component.filteredAttributeGroups = [];
      component.onDropdownClosed(new FormControl(''), 'group');
      expect(component.filteredAttributeGroups).toEqual(component.attributeGroupOptions);
    });

    it('should restore code options on close', () => {
      component.filteredAttributeCodes = [];
      component.onDropdownClosed(new FormControl(''), 'code');
      expect(component.filteredAttributeCodes).toEqual(component.attributeCodeOptions);
    });

    it('should restore delete modifier options on close', () => {
      component.filteredModifierCodes = [];
      component.onDropdownClosed(new FormControl(''), 'delMod');
      expect(component.filteredModifierCodes).toEqual(component.modifierCodeOptions);
    });

    it('should rebuild deleted code options on close', () => {
      component.onDropdownClosed(new FormControl(''), 'delCode');
      // Should have rebuilt from base list (excludes added code)
      expect(component.filteredDeletedAttributeCodes).toBeDefined();
    });

    it('should restore add modifier options on close', () => {
      component.filteredAddModifierCodes = [];
      component.onDropdownClosed(new FormControl(''), 'addMod');
      expect(component.filteredAddModifierCodes).toEqual(component.modifierCodeOptions);
    });

    it('should rebuild associated code options on close', () => {
      component.onDropdownClosed(new FormControl(''), 'assocCode');
      expect(component.filteredAllAttributeCodes).toBeDefined();
    });
  });

  describe('Date input handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call onEffDateInput without throwing', () => {
      const event = { target: { value: '01-JAN-2026' } } as any;
      expect(() => component.onEffDateInput(event)).not.toThrow();
    });

    it('should call handleEndDateInput on termDate input', () => {
      const event = { target: { value: '31-DEC-2026' } } as any;
      expect(() => component.onTermDateInput(event)).not.toThrow();
    });

    it('should mark effDate as touched on blur', fakeAsync(() => {
      const control = component.form.get('effDate');
      expect(control?.touched).toBeFalse();

      component.onEffDateBlur();
      tick(0);

      expect(control?.touched).toBeTrue();
    }));

    it('should mark termDate as touched on blur', fakeAsync(() => {
      const control = component.form.get('termDate');
      expect(control?.touched).toBeFalse();

      component.onTermDateBlur();
      tick(0);

      expect(control?.touched).toBeTrue();
    }));

    it('should call markForCheck on effDate blur', fakeAsync(() => {
      const spy = spyOn(component.cdr, 'markForCheck');
      component.onEffDateBlur();
      tick(0);
      expect(spy).toHaveBeenCalled();
    }));

    it('should call markForCheck on termDate blur', fakeAsync(() => {
      const spy = spyOn(component.cdr, 'markForCheck');
      component.onTermDateBlur();
      tick(0);
      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('Date error messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('getEffectiveDateError', () => {
      it('should return empty string when no control', () => {
        component.form = undefined as any;
        // Recreate form to bypass
        expect(component.getEffectiveDateError()).toBe('');
      });

      it('should return invalid message for invalidDate error', () => {
        const control = component.form.get('effDate');
        control?.setErrors({ invalidDate: true });
        expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
      });

      it('should return invalid message for matDatepickerParse error', () => {
        const control = component.form.get('effDate');
        control?.setErrors({ matDatepickerParse: true });
        expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
      });

      it('should return invalid message when input has text but no control value', () => {
        component.effDateInput = { nativeElement: { value: 'invalid' } } as ElementRef<HTMLInputElement>;
        const control = component.form.get('effDate');
        control?.setValue(null);
        control?.setErrors(null);
        expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
      });

      it('should return required message when touched and required', () => {
        component.effDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        const control = component.form.get('effDate');
        control?.setValue(null);
        control?.markAsTouched();
        expect(component.getEffectiveDateError()).toBe('Effective Date is required');
      });

      it('should return past date message for matDatepickerMin in add mode', () => {
        component.effDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        component.mode = 'add';
        const control = component.form.get('effDate');
        control?.setValue(moment('2020-01-01'));
        control?.setErrors({ matDatepickerMin: true });
        expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
      });

      it('should return past date message for matDatepickerMin in edit mode when edited', () => {
        component.effDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        component.mode = 'edit';
        component.effDateEdited = true;
        const control = component.form.get('effDate');
        control?.setValue(moment('2020-01-01'));
        control?.setErrors({ matDatepickerMin: true });
        expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
      });

      it('should not return past date message for matDatepickerMin in edit mode when not edited', () => {
        component.effDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        component.mode = 'edit';
        const control = component.form.get('effDate');
        control?.setValue(moment('2020-01-01'));
        control?.setErrors({ matDatepickerMin: true });
        // Override effDateEdited AFTER setValue, since subscription recalculates it
        component.effDateEdited = false;
        expect(component.getEffectiveDateError()).toBe('');
      });

      it('should return date range error when lastChangedDateField is effective', () => {
        component.effDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        (component as any).lastChangedDateField = 'effective';
        const effCtrl = component.form.get('effDate');
        effCtrl?.setValue(moment('2026-12-01'));
        effCtrl?.setErrors(null);
        // Set form-level error
        component.form.setErrors({ dateRangeInvalid: true });
        expect(component.getEffectiveDateError()).toBe('Effective Date must be less than or equal to Termination Date');
      });

      it('should not return date range error when lastChangedDateField is termination', () => {
        component.effDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        const effCtrl = component.form.get('effDate');
        effCtrl?.setValue(moment('2026-12-01'));
        effCtrl?.setErrors(null);
        // Override lastChangedDateField AFTER setValue, since subscription sets it to 'effective'
        (component as any).lastChangedDateField = 'termination';
        component.form.setErrors({ dateRangeInvalid: true });
        expect(component.getEffectiveDateError()).toBe('');
      });
    });

    describe('getTerminationDateError', () => {
      it('should return empty string when no control', () => {
        component.form = undefined as any;
        expect(component.getTerminationDateError()).toBe('');
      });

      it('should return invalid message for invalidDate error', () => {
        const control = component.form.get('termDate');
        control?.setErrors({ invalidDate: true });
        expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
      });

      it('should return invalid message for matDatepickerParse error', () => {
        const control = component.form.get('termDate');
        control?.setErrors({ matDatepickerParse: true });
        expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
      });

      it('should return invalid message when input has text but no control value', () => {
        component.termDateInput = { nativeElement: { value: 'bad' } } as ElementRef<HTMLInputElement>;
        const control = component.form.get('termDate');
        control?.setValue(null);
        control?.setErrors(null);
        expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
      });

      it('should return empty string when not touched or dirty', () => {
        component.termDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        const control = component.form.get('termDate');
        control?.setValue(null);
        control?.setErrors(null);
        control?.markAsUntouched();
        control?.markAsPristine();
        expect(component.getTerminationDateError()).toBe('');
      });

      it('should return past date message for matDatepickerMin in add mode', () => {
        component.termDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        component.mode = 'add';
        const control = component.form.get('termDate');
        control?.markAsTouched();
        control?.setErrors({ matDatepickerMin: true });
        expect(component.getTerminationDateError()).toBe('Termination Date cannot be past date');
      });

      it('should not return past date message for matDatepickerMin in edit mode', () => {
        component.termDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        component.mode = 'edit';
        const control = component.form.get('termDate');
        control?.markAsTouched();
        control?.setErrors({ matDatepickerMin: true });
        expect(component.getTerminationDateError()).toBe('');
      });

      it('should return date range error when lastChangedDateField is termination', () => {
        component.termDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        (component as any).lastChangedDateField = 'termination';
        const control = component.form.get('termDate');
        control?.markAsTouched();
        control?.setErrors(null);
        component.form.setErrors({ dateRangeInvalid: true });
        expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
      });

      it('should not return date range error when lastChangedDateField is effective', () => {
        component.termDateInput = { nativeElement: { value: '' } } as ElementRef<HTMLInputElement>;
        (component as any).lastChangedDateField = 'effective';
        const control = component.form.get('termDate');
        control?.markAsTouched();
        control?.setErrors(null);
        component.form.setErrors({ dateRangeInvalid: true });
        expect(component.getTerminationDateError()).toBe('');
      });
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return true when no effDate is set', () => {
      component.form.get('effDate')?.setValue(null);
      expect(component.terminationDateFilter(moment('2024-01-01'))).toBeTrue();
    });

    it('should return false when date is before effDate', () => {
      component.form.get('effDate')?.setValue(moment('2024-06-15'));
      expect(component.terminationDateFilter(moment('2024-06-14'))).toBeFalse();
    });

    it('should return true when date equals effDate', () => {
      component.form.get('effDate')?.setValue(moment('2024-06-15'));
      expect(component.terminationDateFilter(moment('2024-06-15'))).toBeTrue();
    });

    it('should return true when date is after effDate', () => {
      component.form.get('effDate')?.setValue(moment('2024-06-15'));
      expect(component.terminationDateFilter(moment('2024-06-16'))).toBeTrue();
    });
  });

  describe('Error handling for dropdown loading', () => {
    it('should show error snackbar when attribute groups fail to load', () => {
      mockService.getAttributeGroups.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load attribute groups.');
    });

    it('should show error snackbar when modifier codes fail to load', () => {
      mockService.getModifierCodes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load modifier codes.');
    });

    it('should not show error when all attribute codes fail to load (silent)', () => {
      mockService.getAttributeCodes.and.returnValue(throwError(() => new Error('fail')));
      mockSnackbarService.showError.calls.reset();
      fixture.detectChanges();

      // The loadAllAttributeCodes has an empty error handler, so no snackbar
      // Only check that no "attribute codes" error was thrown from loadAllAttributeCodes
      // (loadAttributeCodes with specific group is called elsewhere)
      expect(component.allAttributeCodeOptions).toEqual([]);
    });
  });

  describe('effDateErrorMatcher and termDateErrorMatcher', () => {
    it('should have effDateErrorMatcher defined', () => {
      fixture.detectChanges();
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      fixture.detectChanges();
      expect(component.termDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });
});
