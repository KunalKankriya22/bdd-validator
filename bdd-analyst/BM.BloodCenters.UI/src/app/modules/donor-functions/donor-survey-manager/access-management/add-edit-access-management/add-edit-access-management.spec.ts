import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditAccessManagement } from './add-edit-access-management';
import { AccessManagementService } from '../services/access-management.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { AccessManagementModel } from '../models/access-management.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditAccessManagement', () => {
  let mockSnackBarRef: any;
  let component: AddEditAccessManagement;
  let fixture: ComponentFixture<AddEditAccessManagement>;
  let mockService: jasmine.SpyObj<AccessManagementService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: any;

  const mockFormOptions = {
    chapterIds: ['CH001', 'CH002', 'CH003'],
    types: ['Regular donor', 'FastTrak donor'],
    functionNames: ['ONPDNCON', 'ONPDNREG', 'ONPDNHIS'],
    alertRequiredOptions: ['Yes', 'No']
  };

  let mockEditData: AccessManagementModel;

  beforeEach(() => {

    // Initialize mock edit data with dynamic dates to avoid test failures
    mockEditData = {
      chapterId: 'CH001',
      type: 'Regular donor',
      functionName: 'ONPDNCON',
      alertRequired: 'Yes',
      effectiveDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
      terminationDate: moment().add(180, 'days').format('YYYY-MM-DD')
    };

    mockService = jasmine.createSpyObj('AccessManagementService', [
      'getFormOptions',
      'addAccessManagement',
      'updateAccessManagement'
    ]);

    mockSnackBar = createMockMatSnackBar();

    // Setup MatSnackBar mock to return a proper MatSnackBarRef
    mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
    mockSnackBarRef.onAction.and.returnValue(of(undefined));
    mockSnackBar.open.and.returnValue(mockSnackBarRef);

    mockHeaderService = {
      chapterId: signal('CH001'),
      warehouseId: signal('WH001'),
      chapterName: signal('Test Chapter'),
      warehouseName: signal('Test Warehouse'),
      chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('+05:30')
    };

    mockService.getFormOptions.and.returnValue(of(mockFormOptions));
    mockService.addAccessManagement.and.returnValue(of({ success: true }));
    mockService.updateAccessManagement.and.returnValue(of({ success: true }));



      TestBed.configureTestingModule({
      imports: [AddEditAccessManagement],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        { provide: AccessManagementService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: { getChapterLocalDate: () => new Date() } }
      ]
    });


    


      mockService.getFormOptions.calls.reset();


      mockService.addAccessManagement.calls.reset();


      mockService.updateAccessManagement.calls.reset();


      mockSnackBarRef.onAction.calls.reset();


      mockSnackBarRef.dismiss.calls.reset();


      mockSnackBarRef.onAction.and.returnValue(of(undefined));


      mockSnackBar.open.and.returnValue(mockSnackBarRef);


      mockService.getFormOptions.and.returnValue(of(mockFormOptions));


      mockService.addAccessManagement.and.returnValue(of({ success: true }));


      mockService.updateAccessManagement.and.returnValue(of({ success: true }));


    fixture = TestBed.createComponent(AddEditAccessManagement);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should initialize form with all controls', () => {
      expect(component.form.get('chapterId')).toBeDefined();
      expect(component.form.get('type')).toBeDefined();
      expect(component.form.get('functionName')).toBeDefined();
      expect(component.form.get('alertRequired')).toBeDefined();
      expect(component.form.get('effectiveDate')).toBeDefined();
      expect(component.form.get('terminationDate')).toBeDefined();
    });

    it('should load form options on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getFormOptions).toHaveBeenCalled();
      expect(component.allChapterIdOptions).toEqual(mockFormOptions.chapterIds);
      expect(component.typeOptions).toEqual(mockFormOptions.types);
      expect(component.allFunctionNameOptions).toEqual(mockFormOptions.functionNames);
      expect(component.alertRequiredOptions).toEqual(mockFormOptions.alertRequiredOptions);
    }));




  });

  describe('Form Validation - Add Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should require chapterId', () => {
      const control = component.form.get('chapterId');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require type', () => {
      const control = component.form.get('type');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require functionName', () => {
      const control = component.form.get('functionName');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require alertRequired', () => {
      const control = component.form.get('alertRequired');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require effectiveDate', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should not require terminationDate', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeFalse();
    });




  });

  describe('Form Validation - Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();
    }));





    it('should keep type enabled in edit mode', () => {
      const control = component.form.get('type');
      expect(control?.disabled).toBeFalse();
    });

    it('should keep terminationDate optional in edit mode', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBeFalse();
    });
  });

  describe('Edit Mode - Data Population', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();
    }));



    it('should store original values', () => {
      expect(component['originalValues'].chapterId).toBe('CH001');
      expect(component['originalValues'].type).toBe('Regular donor');
      expect(component['originalValues'].functionName).toBe('ONPDNCON');
      expect(component['originalValues'].alertRequired).toBe('Yes');
    });

    it('should detect form changes', () => {
      component.form.get('type')?.setValue('FastTrak donor');
      expect(component['hasFormChanged']()).toBeTrue();
    });

    it('should not detect changes when values are same', () => {
      expect(component['hasFormChanged']()).toBeFalse();
    });

    it('should enable form validity when changes are made', () => {
      component.form.get('type')?.setValue('FastTrak donor');
      component.form.get('type')?.markAsTouched();
      component.form.updateValueAndValidity();
      // Form should be valid and changed
      expect(component.form.valid).toBeTrue();
      expect(component['hasFormChanged']()).toBeTrue();
      expect(component.isFormValid).toBeTrue();
    });


  });





  describe('Save and Create Another', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should call service when saving and creating another', fakeAsync(() => {
      component.form.patchValue({
        chapterId: 'CH001',
        type: 'Regular donor',
        functionName: 'ONPDNCON',
        alertRequired: 'Yes',
        effectiveDate: moment().add(30, 'days')
      });

      // Mark all fields as touched and update validity
      Object.keys(component.form.controls).forEach(key => {
        component.form.get(key)?.markAsTouched();
      });
      component.form.updateValueAndValidity();

      // Verify form is valid
      expect(component.form.valid).toBeTrue();

      mockService.addAccessManagement.calls.reset();

      component.onSaveAndCreateAnother();
      tick();

      expect(mockService.addAccessManagement).toHaveBeenCalled();
    }));

    it('should emit saveSuccess but not closePanel', fakeAsync(() => {
      // Reset component state and mocks
      component.isSaving = false;
      mockService.addAccessManagement.calls.reset();

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        chapterId: 'CH001',
        type: 'Regular donor',
        functionName: 'ONPDNCON',
        alertRequired: 'Yes',
        effectiveDate: moment().add(30, 'days')
      });

      // Mark all fields as touched and update validity
      Object.keys(component.form.controls).forEach(key => {
        component.form.get(key)?.markAsTouched();
      });
      component.form.updateValueAndValidity();

      // Verify form is valid
      expect(component.form.valid).toBeTrue();

      component.onSaveAndCreateAnother();
      tick();
      fixture.detectChanges();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));


  });
  describe('Searchable Dropdowns', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter chapterIdOptions based on search', fakeAsync(() => {
      component.chapterIdSearchControl.setValue('CH001');
      tick(300);

      expect(component.chapterIdOptions).toContain('CH001');
      expect(component.chapterIdOptions.length).toBeLessThanOrEqual(mockFormOptions.chapterIds.length);
    }));



    it('should filter functionNameOptions based on search', fakeAsync(() => {
      component.functionNameSearchControl.setValue('CON');
      tick(300);

      expect(component.functionNameOptions.length).toBeGreaterThan(0);
    }));


  });

  describe('Error Messages', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should return error message for chapterId', () => {
      const control = component.form.get('chapterId');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getChapterIdError()).toBe('Chapter ID is required');
    });

    it('should return error message for type', () => {
      const control = component.form.get('type');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getTypeError()).toBe('Type is required');
    });

    it('should return error message for functionName', () => {
      const control = component.form.get('functionName');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getFunctionNameError()).toBe('Function Name is required');
    });

    it('should return error message for alertRequired', () => {
      const control = component.form.get('alertRequired');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getAlertRequiredError()).toBe('Alert Required is required');
    });
  });

  describe('Date Validation', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should detect invalid date via native input text when control value is null', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: { text: '31-APR-2025' } });

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return required error when native input is empty and control is null', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();
      control?.setErrors({ required: true });

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should show error for matDatepickerParse on effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should trigger termination date revalidation when effective date changes', fakeAsync(() => {
      const effectiveDate = moment().add(30, 'days');
      const terminationDate = moment().add(10, 'days'); // Earlier than effective date

      // Set termination date first
      component.form.patchValue({
        terminationDate: terminationDate
      });
      tick();

      // Now set effective date to be after termination date
      component.form.patchValue({
        effectiveDate: effectiveDate
      });
      tick();

      // The form should have dateRangeInvalid error
      expect(component.form.errors?.['dateRangeInvalid']).toBeTrue();
    }));

    it('should show termination date error when effective date is greater than termination date', fakeAsync(() => {
      const effectiveDate = moment().add(60, 'days');
      const terminationDate = moment().add(30, 'days'); // Earlier than effective date

      // Patch effective date first so it does not win the lastChangedDateField race
      component.form.patchValue({
        chapterId: 'CH001',
        type: 'Regular donor',
        functionName: 'ONPDNCON',
        alertRequired: 'Yes',
        effectiveDate: effectiveDate
      });
      tick();

      // Patch termination date LAST so lastChangedDateField = 'termination'
      component.form.patchValue({ terminationDate: terminationDate });
      tick();

      // Mark fields as touched
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsTouched();
      component.form.updateValueAndValidity();

      // Should show date range error (message from getEndDateCrossFieldError)
      expect(component.getTerminationDateError()).toContain('must be greater than or equal to Effective Date');
    }));



    it('should revalidate termination date when effective date is changed after initial selection', fakeAsync(() => {
      // Set initial dates that are valid
      const initialEffectiveDate = moment().add(10, 'days');
      const terminationDate = moment().add(30, 'days');

      component.form.patchValue({
        chapterId: 'CH001',
        type: 'Regular donor',
        functionName: 'ONPDNCON',
        alertRequired: 'Yes',
        effectiveDate: initialEffectiveDate,
        terminationDate: terminationDate
      });
      tick();

      // No errors initially
      expect(component.form.errors?.['dateRangeInvalid']).toBeFalsy();

      // Change effective date to be after termination date
      component.form.patchValue({
        effectiveDate: moment().add(60, 'days')
      });
      tick();

      // Should now have date range error
      expect(component.form.errors?.['dateRangeInvalid']).toBeTrue();
    }));
  });

  describe('Date Formatting', () => {




    it('should format Date object correctly', () => {
      const date = new Date('2025-04-15');
      const formatted = component.formatDate(date);
      expect(formatted).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
      expect(formatted).toContain('2025');
    });

    it('should format date string correctly', () => {
      const dateString = '2025-04-15';
      const formatted = component.formatDate(dateString);
      expect(formatted).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
      expect(formatted).toContain('2025');
    });

    it('should pad single-digit days with leading zero', () => {
      const date = new Date('2025-04-05'); // 5th day
      const formatted = component.formatDate(date);
      expect(formatted).toMatch(/^05-/);
    });

    it('should format date with correct month abbreviation', () => {
      const date = new Date('2025-01-15');
      const formatted = component.formatDate(date);
      expect(formatted).toContain('JAN');
    });

    it('should uppercase month abbreviation', () => {
      const date = new Date('2025-04-15');
      const formatted = component.formatDate(date);
      // Check that the month part is all uppercase
      const monthPart = formatted.split('-')[1];
      expect(monthPart).toBe(monthPart.toUpperCase());
    });

    it('should format date in DD-MMM-YYYY format', () => {
      const date = new Date('2025-12-25');
      const formatted = component.formatDate(date);
      expect(formatted).toBe('25-DEC-2025');
    });

    it('should handle various date formats consistently', () => {
      const testDates = [
        { input: new Date('2025-04-01'), expected: '01-APR-2025' },
        { input: '2025-04-01', expected: '01-APR-2025' },
        { input: new Date('2025-12-31'), expected: '31-DEC-2025' }
      ];

      testDates.forEach(test => {
        expect(component.formatDate(test.input)).toBe(test.expected);
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle ngOnChanges for mode change', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();

      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: {
          previousValue: 'add',
          currentValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.panelTitle).toBe('Edit Survey Access');
    }));


  });

  describe('Form Options Loading Error', () => {
    it('should handle error when loading form options', fakeAsync(() => {
      mockService.getFormOptions.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.ngOnInit();
      tick();

      expect(component.isLoadingOptions).toBeFalse();
    }));
  });
});
