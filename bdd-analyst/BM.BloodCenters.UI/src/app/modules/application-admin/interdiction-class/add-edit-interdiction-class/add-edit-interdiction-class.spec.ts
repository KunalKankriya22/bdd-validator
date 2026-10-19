import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditInterdictionClass } from './add-edit-interdiction-class';
import { AssignInterdictionClassService } from '../services/assign-interdiction-class.service';
import { InterdictionDetailDto } from '../models/assign-interdiction-class.model';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditInterdictionClass', () => {
  let component: AddEditInterdictionClass;
  let fixture: ComponentFixture<AddEditInterdictionClass>;
  let mockAssignInterdictionClassService: jasmine.SpyObj<AssignInterdictionClassService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  // Compute dynamic dates once per suite to avoid timezone-sensitive hardcoding
  const pastEffDate = moment().subtract(90, 'days').startOf('day');
  const pastModifiedDate = moment().subtract(75, 'days').startOf('day');

  const mockFilterResponse = {
    success: true,
    data: [
      {
        interdictionCode: ['CODE1', 'CODE2', 'CODE3'],
        class: ['ALL', 'BIO', 'CHEM']
      }
    ]
  };

  const mockInterdictionDetail: InterdictionDetailDto = {
    interCode: 'CODE1',
    interType: 'H',
    interDesc: 'Test Description',
    systemInterCode: 'SYS001',
    systemInterFlag: 'Y',
    effDate: pastEffDate.format('YYYY-MM-DD'),
    termDate: null,
    lastModifiedDate: pastModifiedDate.format('YYYY-MM-DD'),
    auditKey: 123,
    programId: 'TEST',
    changeControlFlag: 'N'
  };

  const mockEditData = {
    interdictionCode: 'CODE1',
    description: 'Test Description',
    type: 'H',
    class: 'ALL',
    effectiveDate: new Date('2099-01-01'),
    terminationDate: new Date('2099-12-31'),
    modificationDate: new Date('2099-01-15')
  };

  // Fixed future date for deterministic tests (avoids flaky failures around midnight/timezone)
  const futureDate = moment('2099-06-15');

  beforeEach(() => {

    mockAssignInterdictionClassService = jasmine.createSpyObj('AssignInterdictionClassService', [
      'getAssignInterdictionClassFilters',
      'getInterdictionByCode',
      'addInterdictionClass',
      'updateInterdictionClass'
    ]);

    mockSnackBar = createMockMatSnackBar();

    mockAssignInterdictionClassService.getAssignInterdictionClassFilters.and.returnValue(
      of(mockFilterResponse)
    );
    mockAssignInterdictionClassService.getInterdictionByCode.and.returnValue(
      of(mockInterdictionDetail)
    );
    mockAssignInterdictionClassService.addInterdictionClass.and.returnValue(
      of({ success: true, message: 'Added successfully' })
    );
    mockAssignInterdictionClassService.updateInterdictionClass.and.returnValue(
      of({ success: true, message: 'Updated successfully' })
    );



      TestBed.configureTestingModule({
      imports: [
        AddEditInterdictionClass,
        ReactiveFormsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatIconModule,
        MatSnackBarModule],
      providers: [
        { provide: AssignInterdictionClassService, useValue: mockAssignInterdictionClassService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: MomentDateAdapter },
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
      ]
    });


    


      mockAssignInterdictionClassService.getAssignInterdictionClassFilters.calls.reset();


      mockAssignInterdictionClassService.getInterdictionByCode.calls.reset();


      mockAssignInterdictionClassService.addInterdictionClass.calls.reset();


      mockAssignInterdictionClassService.updateInterdictionClass.calls.reset();


    fixture = TestBed.createComponent(AddEditInterdictionClass);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {








    it('should set DESCRIPTION_MAX_LENGTH to 50', () => {
      expect(component.DESCRIPTION_MAX_LENGTH).toBe(50);
    });
  });

  /*  ADD MODE TESTS */

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should load filters on init', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClassFilters).toHaveBeenCalled();
      expect(component.interdictionCodeOptions.length).toBe(3);
      expect(component.classOptions.length).toBe(3);
    }));

    it('should populate interdictionCodeOptions correctly', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.interdictionCodeOptions).toEqual([
        { code: 'CODE1', description: '' },
        { code: 'CODE2', description: '' },
        { code: 'CODE3', description: '' }
      ]);
    }));

    it('should populate classOptions correctly', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.classOptions).toEqual([
        { value: 'ALL', label: 'ALL' },
        { value: 'BIO', label: 'BIO' },
        { value: 'CHEM', label: 'CHEM' }
      ]);
    }));




  });

  /* EDIT MODE TESTS */

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
    });







    it('should populate editModeValues for display', () => {
      component.ngOnInit();

      expect(component.editModeValues.interdictionCode).toBe('CODE1');
      expect(component.editModeValues.description).toBe('Test Description');
      expect(component.editModeValues.class).toBe('ALL');
      expect(component.editModeValues.type).toBe('Hold'); // 'H' is formatted to 'Hold'
    });

    it('should set lastUpdated with modification date', () => {
      component.ngOnInit();
      expect(component.lastUpdated).toContain('Last Updated:');
    });

    it('should convert dates to moment objects', () => {
      component.ngOnInit();

      const effectiveDate = component.form.get('effectiveDate')?.value;
      const terminationDate = component.form.get('terminationDate')?.value;

      expect(moment.isMoment(effectiveDate)).toBe(true);
      expect(moment.isMoment(terminationDate)).toBe(true);
    });
  });

  /* INTERDICTION CODE SELECTION TESTS */

  describe('Interdiction Code Selection (Add Mode)', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should fetch interdiction details when code is selected', fakeAsync(() => {
      component.form.get('interdictionCode')?.setValue('CODE1');
      tick();

      expect(mockAssignInterdictionClassService.getInterdictionByCode).toHaveBeenCalledWith('CODE1');
    }));










  });

  /* FORM VALIDATION TESTS */

  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });













    it('should allow termination date equal to effective date', () => {
      const date = futureDate.clone();
      component.form.get('effectiveDate')?.setValue(date);
      component.form.get('terminationDate')?.setValue(date);

      const terminationControl = component.form.get('terminationDate');
      expect(terminationControl?.hasError('terminationBeforeEffective')).toBeFalsy();
    });



    it('should trim whitespace for interdiction code validation', () => {
      const control = component.form.get('interdictionCode');
      control?.setValue('   ');
      control?.markAsTouched();

      expect(control?.hasError('trimmedRequired')).toBe(true);
    });
  });

  /* SAVE FUNCTIONALITY TESTS */

  describe('Save Functionality (Add Mode)', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      tick();

      component.form.get('interdictionCode')?.setValue('CODE1');
      tick();
      component.form.get('class')?.setValue('ALL');
      component.form.get('effectiveDate')?.setValue(futureDate.clone());
    }));



    it('should send correct DTO to API', fakeAsync(() => {
      component.onSave();
      tick();

      const callArgs = mockAssignInterdictionClassService.addInterdictionClass.calls.argsFor(0)[0];

      expect(callArgs.InterdictionCode).toBe('CODE1');
      expect(callArgs.Class).toBe('ALL');
      expect(callArgs.EffectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(callArgs.TerminationDate).toBeNull();
    }));








  });

  /* UPDATE FUNCTIONALITY TESTS */

  describe('Save Functionality (Edit Mode)', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      tick();
    }));



    it('should include disabled field values in DTO', fakeAsync(() => {
      component.onSave();
      tick();

      const callArgs = mockAssignInterdictionClassService.updateInterdictionClass.calls.argsFor(0)[0];
      expect(callArgs.InterdictionCode).toBe('CODE1');
    }));
  });

  /* SAVE AND CREATE ANOTHER TESTS */

  describe('Save and Create Another (Add Mode)', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      tick();

      component.form.get('interdictionCode')?.setValue('CODE1');
      tick();
      component.form.get('class')?.setValue('ALL');
      component.form.get('effectiveDate')?.setValue(futureDate.clone());
    }));

    it('should save and reset form', fakeAsync(() => {
      component.onSaveAndCreateAnother();
      tick();

      expect(mockAssignInterdictionClassService.addInterdictionClass).toHaveBeenCalled();
      expect(component.form.get('interdictionCode')?.value).toBeNull();
      expect(component.form.pristine).toBe(true);
    }));



    it('should emit saveSuccess but not closePanel', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSaveAndCreateAnother();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));
  });

  describe('Save and Create Another (Edit Mode)', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      tick();
    }));

    it('should save and switch to add mode', fakeAsync(() => {
      component.onSaveAndCreateAnother();
      tick();

      expect(mockAssignInterdictionClassService.updateInterdictionClass).toHaveBeenCalled();
      expect(component.mode).toBe('add');
      expect(component.panelTitle).toBe('Add Interdiction Class');
    }));

    it('should re-enable interdiction code after switching to add mode', fakeAsync(() => {
      component.onSaveAndCreateAnother();
      tick();

      expect(component.form.get('interdictionCode')?.disabled).toBe(false);
    }));
  });

  /* CANCEL FUNCTIONALITY TESTS */
  /* HELPER METHODS TESTS */

  describe('Helper Methods', () => {




    it('should format date time for today', () => {
      const today = new Date();
      const formatted = component.formatDateTime(today);

      expect(formatted).toContain('Today');
      expect(formatted).toContain('PST');
    });

    it('should format date time for past date', () => {
      const pastDate = pastModifiedDate.toDate();
      const formatted = component.formatDateTime(pastDate);

      expect(formatted.toUpperCase()).toContain(pastModifiedDate.format('DD-MMM-YYYY').toUpperCase());
      expect(formatted).toContain('PST');
    });

    it('should calculate remaining characters correctly', () => {
      component.form.get('description')?.setValue('Test');

      const remaining = component.getDescriptionRemainingCharacters();
      expect(remaining).toBe('46/50');
    });

    it('should return correct interdiction code display', () => {
      const display = component.getInterdictionCodeDisplay('CODE1');
      expect(display).toBe('CODE1');
    });



    it('should check if description and type are disabled in edit mode', () => {
      component.mode = 'edit';
      expect(component.areDescriptionAndTypeDisabled).toBe(true);
    });

    it('should check if description and type are disabled when no code selected', () => {
      component.mode = 'add';
      component.form.get('interdictionCode')?.setValue('');

      expect(component.areDescriptionAndTypeDisabled).toBe(true);
    });

    it('should check if description and type are disabled when code selected', () => {
      component.mode = 'add';
      component.form.get('interdictionCode')?.setValue('CODE1');

      expect(component.areDescriptionAndTypeDisabled).toBe(false);
    });
  });

  /*  LOADING STATES TESTS */

  describe('Loading States', () => {
    it('should handle filter loading error', fakeAsync(() => {
      mockAssignInterdictionClassService.getAssignInterdictionClassFilters.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      spyOn(console, 'error');

      component.mode = 'add';
      component.ngOnInit();
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(component.loadingInterdictionCodes).toBe(false);
      expect(component.loadingClasses).toBe(false);
    }));
  });

  /* LIFECYCLE HOOKS TESTS */

  describe('Lifecycle Hooks', () => {
    it('should handle ngOnChanges when mode changes', () => {
      component.mode = 'add';
      component.ngOnInit();
      fixture.detectChanges();

      const changes = {
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      };

      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges(changes);
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Edit Code');
    });






  });

  /* ERROR MESSAGES TESTS */

  describe('Error Message Methods', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should return empty string if control not touched', () => {
      expect(component.getInterdictionCodeError()).toBe('');
      expect(component.getClassError()).toBe('');
      expect(component.getEffectiveDateError()).toBe('');
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return error message for interdiction code', () => {
      const control = component.form.get('interdictionCode');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.getInterdictionCodeError()).toBe('Interdiction Code is required');
    });

    it('should return error message for class', () => {
      const control = component.form.get('class');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.getClassError()).toBe('Class is required');
    });

    it('should return error message for effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });



    it('should return pastDate error for past effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(moment('2020-01-01'));
      control?.setErrors({ effectiveDatePast: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
    });



    it('should return error message for termination date', () => {
      component.form.get('effectiveDate')?.setValue(futureDate.clone().add(365, 'days'));
      component.form.get('terminationDate')?.setValue(futureDate.clone());
      component.form.get('terminationDate')?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });
  });

  /* EDGE CASES TESTS */

  describe('Edge Cases', () => {
    it('should handle null data in edit mode', () => {
      component.mode = 'edit';
      component.data = null;

      expect(() => component.ngOnInit()).not.toThrow();
    });





    it('should handle interdiction code with whitespace', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      tick();

      component.form.get('interdictionCode')?.setValue('  CODE1  ');
      tick();

      expect(mockAssignInterdictionClassService.getInterdictionByCode).toHaveBeenCalledWith('CODE1');
    }));

    it('should handle termination date same as effective date', () => {
      const date = futureDate.clone();
      component.form.get('effectiveDate')?.setValue(date);
      component.form.get('terminationDate')?.setValue(date.clone());

      expect(component['hasDateValidationError']()).toBe(false);
    });

    it('should mark form as touched before save', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      tick();

      component.onSave();

      expect(component.form.get('interdictionCode')?.touched).toBe(true);
      expect(component.form.get('class')?.touched).toBe(true);
      expect(component.form.get('effectiveDate')?.touched).toBe(true);
    }));
  });

  /*  INTEGRATION TESTS  */

  describe('Integration Tests', () => {
    it('should complete full edit workflow', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      tick();

      component.form.get('effectiveDate')?.setValue(futureDate.clone().add(1, 'day'));
      component.form.get('terminationDate')?.setValue(futureDate.clone().add(365, 'days'));

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      tick();

      expect(mockAssignInterdictionClassService.updateInterdictionClass).toHaveBeenCalled();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));
  });
});