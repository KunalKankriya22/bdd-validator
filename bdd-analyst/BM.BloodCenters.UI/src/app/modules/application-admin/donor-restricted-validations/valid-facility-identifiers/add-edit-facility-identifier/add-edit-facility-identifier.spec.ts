import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { of, throwError } from 'rxjs';
import moment, { Moment } from 'moment';

import { AddEditFacilityIdentifier, AddEditFacilityIdentifierDialogData } from './add-edit-facility-identifier';
import { ValidFacilityIdentifiersService, ChapterLookup } from '../services/valid-facility-identifiers.service';
import { ValidFacilityIdentifiersModel } from '../models/valid-facility-identifiers.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditFacilityIdentifier', () => {
  let terminationDateControl: any;
  let effectiveDateControl: any;
  let payload: any;
  let parsed: any;
  let component: AddEditFacilityIdentifier;
  let fixture: ComponentFixture<AddEditFacilityIdentifier>;
  let mockService: jasmine.SpyObj<ValidFacilityIdentifiersService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditFacilityIdentifier>>;
  let mockDateAdapter: jasmine.SpyObj<DateAdapter<Moment>>;

  const mockChapters: ChapterLookup[] = [
    { chapterId: 'AB12', chapterName: 'Chapter AB12' },
    { chapterId: 'CD34', chapterName: 'Chapter CD34' },
    { chapterId: 'EF56', chapterName: 'Chapter EF56' },
  ];

  function createComponent(dialogData: AddEditFacilityIdentifierDialogData) {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: dialogData });
    TestBed.compileComponents();

    fixture = TestBed.createComponent(AddEditFacilityIdentifier);
    component = fixture.componentInstance;
  }

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ValidFacilityIdentifiersService', [
      'addFacilityIdentifier',
      'updateFacilityIdentifier',
      'getChapters',
      'getActiveChapters'
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDateAdapter = jasmine.createSpyObj('DateAdapter', ['parse', 'format']);

    mockService.getChapters.and.returnValue(of(mockChapters));
    mockService.getActiveChapters.and.returnValue(of(mockChapters));

    // Setup DateAdapter mock default behavior
    mockDateAdapter.parse.and.callFake((value: any) => {
      if (value && typeof value === 'string') {
        parsed = moment(value, ['DD-MMM-YYYY', 'DDMMYYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
        return parsed.isValid() ? parsed : null;
      }
      return null;
    });
    mockDateAdapter.format.and.callFake((date: Moment) => {
      return date ? date.format('DD-MMM-YYYY').toUpperCase() : '';
    });



      TestBed.configureTestingModule({
imports: [
        AddEditFacilityIdentifier,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: ValidFacilityIdentifiersService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DateAdapter, useValue: mockDateAdapter },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } }
      ]
    });


    });



  beforeEach(() => {

      mockService.getChapters.and.returnValue(of(mockChapters));


      mockService.getActiveChapters.and.returnValue(of(mockChapters));


      mockDateAdapter.parse.and.callFake((value: any) => {
        if (value && typeof value === 'string') {
          parsed = moment(value, ['DD-MMM-YYYY', 'DDMMYYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
          return parsed.isValid() ? parsed : null;
        }
        return null;
      });
      mockDateAdapter.format.and.callFake((date: Moment) => {
        return date ? date.format('DD-MMM-YYYY').toUpperCase() : '';
      });
    });

  describe('Component Initialization', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
    });


    it('should load chapter IDs on init', () => {
      component.ngOnInit();
      expect(mockService.getActiveChapters).toHaveBeenCalled();
      expect(component.chapters).toEqual(mockChapters);
    });

  });

  describe('Add Mode', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });


    it('should have all form controls enabled in add mode', () => {
      expect(component.form.get('chapterId')?.enabled).toBe(true);
      expect(component.form.get('facilityIdentifier')?.enabled).toBe(true);
      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
      expect(component.form.get('terminationDate')?.enabled).toBe(true);
    });


    it('should validate facility identifier max length', () => {
      const control = component.form.get('facilityIdentifier');
      control?.setValue('123456'); // 6 characters, max is 5

      expect(control?.hasError('maxlength')).toBe(true);
    });




    it('should auto-uppercase facility identifier', () => {
      const control = component.form.get('facilityIdentifier');
      control?.setValue('a1234');

      expect(control?.value).toBe('A1234');
    });


  });

  describe('Edit Mode', () => {
    const mockData: ValidFacilityIdentifiersModel = {
      chapterId: 'AB12',
      facilityIdentifier: 'A1234',
      effDate: new Date('2026-06-01'),
      termDate: new Date('2026-12-31')
    };

    beforeEach(() => {
      createComponent({ mode: 'edit', data: mockData });
      component.ngOnInit();
    });





    it('should keep Facility Identifier enabled in edit mode', () => {
      expect(component.form.get('facilityIdentifier')?.enabled).toBe(true);
    });

    it('should keep Termination Date enabled in edit mode', () => {
      expect(component.form.get('terminationDate')?.enabled).toBe(true);
    });

    it('should store original Chapter ID for API call', () => {
      expect(component['originalChapterId']).toBe('AB12');
    });

    it('should store original Facility Identifier for API call', () => {
      expect(component['originalFacilityIdentifier']).toBe('A1234');
    });

    it('should store original Effective Date for API call', () => {
      expect(component['originalEffectiveDate']).toBeTruthy();
      expect(component['originalEffectiveDate']).toContain('2026-06-01');
    });

    it('should store display values for read-only cards', () => {
      expect(component.editModeValues.chapterId).toBe('AB12');
      expect(component.editModeValues.effectiveDate).toContain('01');
      expect(component.editModeValues.effectiveDate).toContain('JUN');
      expect(component.editModeValues.effectiveDate).toContain('2026');
    });


    it('should store initial form values for change detection', () => {
      expect(component['initialFormValues']).toBeTruthy();
      expect(component['initialFormValues'].facilityIdentifier).toBe('A1234');
      expect(component['initialFormValues'].terminationDate).toBeTruthy();
    });




  });

  describe('Form Validation', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should return Chapter ID error message when field is required', () => {
      const control = component.form.get('chapterId');
      control?.markAsTouched();
      control?.setValue('');

      expect(component.getChapterIdError()).toBe('Chapter ID is required');
    });

    it('should return Facility Identifier required error message', () => {
      const control = component.form.get('facilityIdentifier');
      control?.markAsTouched();
      control?.setValue('');

      expect(component.getFacilityIdentifierError()).toBe('FIN Code is required');
    });

    it('should return Facility Identifier max length error message', () => {
      const control = component.form.get('facilityIdentifier');
      control?.markAsTouched();
      control?.setValue('123456');

      expect(component.getFacilityIdentifierError()).toBe('FIN Code cannot exceed 5 characters');
    });

    it('should return ISBT 128 error message for invalid format', () => {
      const control = component.form.get('facilityIdentifier');
      control?.markAsTouched();
      control?.setValue('12345');

      expect(component.getFacilityIdentifierError()).toBe('Invalid ISBT 128 prefix (format: 1 letter + 4 digits, e.g. A1234)');
    });

    it('should return Effective Date error message when field is required', () => {
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      control?.setValue(null);

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should not show error messages for untouched fields', () => {
      const control = component.form.get('chapterId');
      control?.setValue('');

      expect(component.getChapterIdError()).toBe('');
    });
  });

  describe('Save - Add Mode', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should call addFacilityIdentifier service method', () => {
      mockService.addFacilityIdentifier.and.returnValue(of({ success: true }));

      component.form.patchValue({
        chapterId: 'AB12',
        facilityIdentifier: 'A1234',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: new Date('2026-12-31')
      });

      component.onSave();

      expect(mockService.addFacilityIdentifier).toHaveBeenCalled();
      payload = mockService.addFacilityIdentifier.calls.mostRecent().args[0];
      expect(payload.chapterId).toBe('AB12');
      expect(payload.facilityIdentifier).toBe('A1234');
      expect(payload.effDate).toContain(moment().add(10, 'days').format('YYYY-MM-DD'));
    });


  });

  describe('Save - Edit Mode', () => {
    const mockData: ValidFacilityIdentifiersModel = {
      chapterId: 'AB12',
      facilityIdentifier: 'A1234',
      effDate: new Date('2026-06-01'),
      termDate: new Date('2026-12-31')
    };

    beforeEach(() => {
      createComponent({ mode: 'edit', data: mockData });
      component.ngOnInit();
    });

    it('should call updateFacilityIdentifier service method', () => {
      mockService.updateFacilityIdentifier.and.returnValue(of({ success: true }));

      component.form.patchValue({
        facilityIdentifier: 'B9999',
        terminationDate: new Date('2026-12-31')
      });

      component.onSave();

      expect(mockService.updateFacilityIdentifier).toHaveBeenCalled();
      payload = mockService.updateFacilityIdentifier.calls.mostRecent().args[0];
      expect(payload.chapterId).toBe('AB12');
      expect(payload.originalFacilityIdentifier).toBe('A1234');
      expect(payload.facilityIdentifier).toBe('B9999');
    });

    it('should use original effective date in update payload', () => {
      mockService.updateFacilityIdentifier.and.returnValue(of({ success: true }));

      component.form.patchValue({
        facilityIdentifier: 'B9999'
      });

      component.onSave();

      payload = mockService.updateFacilityIdentifier.calls.mostRecent().args[0];
      expect(payload.effDate).toBeTruthy();
      expect(payload.effDate).toContain('2026-06-01');
    });

  });


  describe('Date Formatting', () => {
    it('should format date for display as DD-MMM-YYYY', () => {
      createComponent({
        mode: 'edit',
        data: {
          chapterId: 'AB12',
          facilityIdentifier: 'A1234',
          effDate: new Date('2026-06-15'),
          termDate: null
        }
      });
      component.ngOnInit();

      expect(component.editModeValues.effectiveDate).toBe('15-JUN-2026');
    });

    it('should display dash for null date', () => {
      createComponent({
        mode: 'edit',
        data: {
          chapterId: 'AB12',
          facilityIdentifier: 'A1234',
          effDate: null,
          termDate: null
        }
      });
      component.ngOnInit();

      expect(component.editModeValues.effectiveDate).toBe('-');
    });
  });

  describe('Chapter Search Filtering', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should filter chapter IDs based on search term', () => {
      expect(component.filteredChapters).toEqual(mockChapters);

      component.chapterSearchControl.setValue('AB');

      expect(component.filteredChapters).toEqual([{ chapterId: 'AB12', chapterName: 'Chapter AB12' }]);
    });

    it('should be case-insensitive when filtering', () => {
      component.chapterSearchControl.setValue('cd');

      expect(component.filteredChapters).toEqual([{ chapterId: 'CD34', chapterName: 'Chapter CD34' }]);
    });

    it('should show all chapters when search is empty', () => {
      component.chapterSearchControl.setValue('');

      expect(component.filteredChapters).toEqual(mockChapters);
    });

    it('should return empty array when no chapters match search', () => {
      component.chapterSearchControl.setValue('XYZ');

      expect(component.filteredChapters).toEqual([]);
    });
  });

  describe('Date Validation and Cross-Field Errors', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should update last changed field when effective date changes', () => {
      effectiveDateControl = component.form.get('effectiveDate');

      effectiveDateControl?.setValue(new Date(moment().add(10, 'days').format('YYYY-MM-DD')));

      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should update last changed field when termination date changes', () => {
      terminationDateControl = component.form.get('terminationDate');

      terminationDateControl?.setValue(new Date('2026-12-31'));

      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should show cross-field error on effective date when it was last changed', fakeAsync(() => {
      effectiveDateControl = component.form.get('effectiveDate');
      terminationDateControl = component.form.get('terminationDate');

      // Set termination date first
      terminationDateControl?.setValue(new Date(moment().add(10, 'days').format('YYYY-MM-DD')));
      tick();

      // Set effective date after (so it's the last changed)
      effectiveDateControl?.setValue(new Date('2026-12-31'));
      tick();

      effectiveDateControl?.markAsTouched();
      component.form.updateValueAndValidity();
      tick();

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date must be less than or equal to Termination Date');
    }));

    it('should show cross-field error on termination date when effective date was not last changed', () => {
      component['lastChangedDateField'] = 'termination';
      component.form.setErrors({ dateRangeInvalid: true });

      terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.markAsTouched();

      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should show invalid date error for termination date', () => {
      terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.setErrors({ invalidDate: true });

      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date is invalid');
    });

    it('should show parse error for termination date', () => {
      terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.setErrors({ matDatepickerParse: true });

      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date is invalid');
    });

    it('should show past date error for termination date when date is in the past', () => {
      terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.markAsTouched();
      terminationDateControl?.setErrors({ terminationDatePast: true });

      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date cannot be in the past');
    });

    it('should show matDatepickerMin error for termination date', () => {
      component['lastChangedDateField'] = 'termination';
      terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.markAsTouched();
      terminationDateControl?.setErrors({ matDatepickerMin: true });

      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date must be greater than or equal to Effective Date');
    });
  });

  describe('Termination Date Filter', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should allow termination date on or after effective date', () => {
      effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setValue(new Date(moment().add(10, 'days').format('YYYY-MM-DD')));

      // Termination date must be AFTER effective date (10 days), so use 20 days
      const result = component.terminationDateFilter(new Date(moment().add(20, 'days').format('YYYY-MM-DD')) as any);
      expect(result).toBe(true);
    });

    it('should block termination date before effective date', () => {
      effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setValue(new Date(moment().add(10, 'days').format('YYYY-MM-DD')));

      // Termination date BEFORE effective date (10 days), so use 5 days
      const result = component.terminationDateFilter(new Date(moment().add(5, 'days').format('YYYY-MM-DD')) as any);
      expect(result).toBe(false);
    });

    it('should allow null termination date', () => {
      const result = component.terminationDateFilter(null);
      expect(result).toBe(true);
    });

    it('should allow any date when effective date is not set', () => {
      effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setValue(null);

      const result = component.terminationDateFilter(new Date('2026-01-01') as any);
      expect(result).toBe(true);
    });
  });

  describe('Save Button Label', () => {
    it('should show ADD label in add mode', () => {
      createComponent({ mode: 'add' });
      component.ngOnInit();

      expect(component.saveButtonLabel).toBe('ADD');
    });

    it('should show SAVE label in edit mode', () => {
      createComponent({
        mode: 'edit',
        data: {
          chapterId: 'AB12',
          facilityIdentifier: 'A1234',
          effDate: new Date('2026-06-01'),
          termDate: null
        }
      });
      component.ngOnInit();

      expect(component.saveButtonLabel).toBe('SAVE');
    });
  });

  describe('Success Messages - Add Mode', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should call service and close dialog after successful add', fakeAsync(() => {
      mockService.addFacilityIdentifier.and.returnValue(of({ success: true }));

      component.form.patchValue({
        chapterId: 'AB12',
        facilityIdentifier: 'A1234',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });

      component.form.updateValueAndValidity();
      expect(component.form.valid).toBe(true);

      component.onSave();
      tick();
      flushMicrotasks();

      expect(mockService.addFacilityIdentifier).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    }));
  });

  describe('Success Messages - Edit Mode', () => {
    const mockData: ValidFacilityIdentifiersModel = {
      chapterId: 'CD34',
      facilityIdentifier: 'C5678',
      effDate: new Date('2026-06-01'),
      termDate: null
    };

    beforeEach(() => {
      createComponent({ mode: 'edit', data: mockData });
      component.ngOnInit();
    });

    it('should call service and close dialog after successful update', fakeAsync(() => {
      mockService.updateFacilityIdentifier.and.returnValue(of({ success: true }));

      component.form.patchValue({
        facilityIdentifier: 'C9999'
      });

      component.form.updateValueAndValidity();
      expect(component.form.valid).toBe(true);

      component.onSave();
      tick();
      flushMicrotasks();

      expect(mockService.updateFacilityIdentifier).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    }));
  });

  describe('Error State Matchers', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should show error state for effective date when touched and has error', () => {
      effectiveDateControl = component.form.get('effectiveDate') as any;
      component['lastChangedDateField'] = 'effective';
      component.form.setErrors({ dateRangeInvalid: true });
      effectiveDateControl.markAsTouched();

      const hasError = component.effDateErrorMatcher.isErrorState(effectiveDateControl, null);
      expect(hasError).toBe(true);
    });

    it('should show error state for termination date when touched and has error', () => {
      terminationDateControl = component.form.get('terminationDate') as any;
      component['lastChangedDateField'] = 'termination';
      component.form.setErrors({ dateRangeInvalid: true });
      terminationDateControl.markAsTouched();

      const hasError = component.termDateErrorMatcher.isErrorState(terminationDateControl, null);
      expect(hasError).toBe(true);
    });

    it('should not show error state when control is null', () => {
      const hasError = component.effDateErrorMatcher.isErrorState(null, null);
      expect(hasError).toBe(false);
    });
  });

  describe('Termination Date Input Validation', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should set invalidDate error when input has text but value is null', () => {
      const terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.setValue(null);

      // Mock the input element
      component['terminationDateInput'] = {
        nativeElement: { value: 'invalid date text' }
      } as any;

      component['validateTerminationDateInput']();

      expect(terminationDateControl?.hasError('invalidDate')).toBe(true);
    });

    it('should clear invalidDate error when input is empty', () => {
      const terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.setErrors({ invalidDate: true });

      // Mock the input element
      component['terminationDateInput'] = {
        nativeElement: { value: '' }
      } as any;

      component['validateTerminationDateInput']();

      expect(terminationDateControl?.hasError('invalidDate')).toBe(false);
    });

  });

  describe('Effective Date Error Messages', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should show invalid date error immediately when input has text but value is null', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setValue(null);
      effectiveDateControl?.setErrors({ required: true });

      // Mock the input element
      component['effectiveDateInput'] = {
        nativeElement: { value: 'invalid text' }
      } as any;

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date is invalid');
    });

    it('should show parse error for effective date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setErrors({ matDatepickerParse: true });

      // Mock the input element
      component['effectiveDateInput'] = {
        nativeElement: { value: 'bad date' }
      } as any;

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date is invalid');
    });

    it('should show past date error for effective date in add mode', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.markAsTouched();
      effectiveDateControl?.setErrors({ effectiveDatePast: true });

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date cannot be past date');
    });

    it('should show invalidDate error for effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDate: true });

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date is invalid');
    });
  });

  describe('onCancel', () => {
    it('should close the dialog', () => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('panelTitle', () => {
    it('should return add title in add mode', () => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
      expect(component.panelTitle).toBe('Add Facility Identification Code');
    });

    it('should return edit title in edit mode', () => {
      createComponent({ mode: 'edit', data: { chapterId: 'AB12', facilityIdentifier: 'A1234', effDate: new Date('2026-06-01'), termDate: null } });
      component.ngOnInit();
      expect(component.panelTitle).toBe('Edit Facility Identification Code');
    });
  });

  describe('isFormValid getter', () => {
    it('should return false in edit mode when form has not changed', () => {
      const mockData: ValidFacilityIdentifiersModel = {
        chapterId: 'AB12',
        facilityIdentifier: 'A1234',
        effDate: new Date('2026-06-01'),
        termDate: new Date('2026-12-31')
      };
      createComponent({ mode: 'edit', data: mockData });
      component.ngOnInit();
      // No changes made, so isFormValid should be false
      expect(component.isFormValid).toBe(false);
    });

    it('should return true in edit mode when form has changed', () => {
      const mockData: ValidFacilityIdentifiersModel = {
        chapterId: 'AB12',
        facilityIdentifier: 'A1234',
        effDate: new Date('2026-06-01'),
        termDate: new Date('2026-12-31')
      };
      createComponent({ mode: 'edit', data: mockData });
      component.ngOnInit();
      component.form.get('facilityIdentifier')?.setValue('B9999');
      expect(component.isFormValid).toBe(true);
    });

    it('should return form.valid in add mode', () => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
      component.form.patchValue({
        chapterId: 'AB12',
        facilityIdentifier: 'A1234',
        effectiveDate: moment().add(10, 'days')
      });
      expect(component.isFormValid).toBe(true);
    });
  });

  describe('loadChapterIds error handling', () => {
    it('should clear chapters and set loading false on error', () => {
      createComponent({ mode: 'add' });
      component.ngOnInit();

      // Now override the service to return error and call loadChapterIds directly
      mockService.getActiveChapters.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadChapterIds();

      expect(component.chapters).toEqual([]);
      expect(component.filteredChapters).toEqual([]);
      expect(component.isLoadingChapters).toBe(false);
    });
  });

  describe('onSave with invalid form', () => {
    it('should not call service when form is invalid', () => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
      // Leave required fields empty
      component.onSave();
      expect(mockService.addFacilityIdentifier).not.toHaveBeenCalled();
    });
  });

  describe('onSave API error', () => {
    it('should set isSaving to false on API error in add mode', fakeAsync(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();

      mockService.addFacilityIdentifier.and.returnValue(throwError(() => new Error('API Error')));

      component.form.patchValue({
        chapterId: 'AB12',
        facilityIdentifier: 'A1234',
        effectiveDate: moment().add(10, 'days')
      });

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));
  });

  describe('validateEffectiveDateInput', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should set invalidDate error when input has text but control value is null', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      component['effectiveDateInput'] = { nativeElement: { value: 'bad text' } } as any;
      component['validateEffectiveDateInput']();
      expect(control?.hasError('invalidDate')).toBe(true);
    });

    it('should clear invalidDate error when input is empty', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      component['effectiveDateInput'] = { nativeElement: { value: '' } } as any;
      component['validateEffectiveDateInput']();
      expect(control?.hasError('invalidDate')).toBe(false);
    });

    it('should clear invalidDate error when control has valid value', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(moment().add(5, 'days'));
      control?.setErrors({ invalidDate: true });
      component['effectiveDateInput'] = { nativeElement: { value: '20-JAN-2027' } } as any;
      component['validateEffectiveDateInput']();
      expect(control?.hasError('invalidDate')).toBe(false);
    });
  });

  describe('validateTerminationDateInput clear with remaining errors', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should keep other errors when clearing invalidDate', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true, someOtherError: true });
      component['terminationDateInput'] = { nativeElement: { value: '' } } as any;
      component['validateTerminationDateInput']();
      expect(control?.hasError('invalidDate')).toBe(false);
      expect(control?.hasError('someOtherError')).toBe(true);
    });
  });

  describe('getTerminationDateError with native input', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should show invalid error when native input has value but control is null', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      control?.setErrors(null);
      component['terminationDateInput'] = { nativeElement: { value: 'bad text' } } as any;
      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date is invalid');
    });
  });

  describe('onEffectiveDateBlur', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should mark effective date as touched and validate', fakeAsync(() => {
      component['effectiveDateInput'] = { nativeElement: { value: '' } } as any;
      component.onEffectiveDateBlur();
      tick(10);
      const control = component.form.get('effectiveDate');
      expect(control?.touched).toBe(true);
    }));

    it('should parse valid input text when control value is null', fakeAsync(() => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      component['effectiveDateInput'] = { nativeElement: { value: '20-JAN-2027' } } as any;
      mockDateAdapter.parse.and.returnValue(moment('2027-01-20'));
      component.onEffectiveDateBlur();
      tick(10);
      expect(control?.value).toBeTruthy();
    }));
  });

  describe('onTerminationDateBlur', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should mark termination date as touched and validate', fakeAsync(() => {
      component['terminationDateInput'] = { nativeElement: { value: '' } } as any;
      component.onTerminationDateBlur();
      tick(10);
      const control = component.form.get('terminationDate');
      expect(control?.touched).toBe(true);
    }));

    it('should parse valid input text when control value is null', fakeAsync(() => {
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      component['terminationDateInput'] = { nativeElement: { value: '20-JAN-2027' } } as any;
      mockDateAdapter.parse.and.returnValue(moment('2027-01-20'));
      component.onTerminationDateBlur();
      tick(10);
      expect(control?.value).toBeTruthy();
    }));
  });

  describe('isbt128Validator', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
      component.ngOnInit();
    });

    it('should accept valid ISBT 128 format', () => {
      const control = component.form.get('facilityIdentifier');
      control?.setValue('A1234');
      expect(control?.hasError('invalidIsbt128')).toBe(false);
    });

    it('should reject invalid ISBT 128 format', () => {
      const control = component.form.get('facilityIdentifier');
      control?.setValue('1234A');
      expect(control?.hasError('invalidIsbt128')).toBe(true);
    });

    it('should allow empty value (handled by required)', () => {
      const control = component.form.get('facilityIdentifier');
      control?.setValue('');
      expect(control?.hasError('invalidIsbt128')).toBe(false);
    });
  });

  describe('Edit mode without data', () => {
    it('should handle edit mode when data is undefined', () => {
      createComponent({ mode: 'edit' });
      component.ngOnInit();
      expect(component.form.get('effectiveDate')?.disabled).toBe(true);
    });
  });

});
