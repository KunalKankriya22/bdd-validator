import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddEditInterdictionUpgrade } from './add-edit-interdiction-upgrade';
import { InterdictionUpgradeMatrixService } from '../services/interdiction-upgrade-matrix.service';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { FormControl } from '@angular/forms';
import { InterdictionUpgradeMatrixModel, InterdictionCodeOption } from '../models/interdiction-upgrade-matrix.model';
import moment from 'moment';

describe('AddEditInterdictionUpgrade', () => {
  let component: AddEditInterdictionUpgrade;
  let fixture: ComponentFixture<AddEditInterdictionUpgrade>;
  let mockService: jasmine.SpyObj<InterdictionUpgradeMatrixService>;

  const toCodeOptions = (codes: string[]): InterdictionCodeOption[] =>
    codes.map(interCode => ({ interCode, interDesc: `${interCode} Desc` }));

  const mockInterdictionCodes = {
    data: ['CODE001', 'CODE002', 'CODE003', 'SRC001', 'EXT001', 'ACT001']
  };
  const mockInterdictionCodeOptions = toCodeOptions(mockInterdictionCodes.data);

  // Use dynamic dates to avoid test failures when hardcoded dates become past dates
  const futureDate = moment().add(1, 'month').toDate();
  const futureTerminationDate = moment().add(6, 'months').toDate();

  const mockEditData: InterdictionUpgradeMatrixModel = {
    sourceInterdiction: 'SRC001',
    existingInterdiction: 'EXT001',
    actionInterdiction: 'ACT001',
    action: 'P',
    effectiveDate: futureDate,
    terminationDate: futureTerminationDate
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('InterdictionUpgradeMatrixService', [
      'getInterdictionCodes',
      'addInterdictionUpgrade',
      'updateInterdictionUpgrade'
    ]);
    mockService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));
    mockService.addInterdictionUpgrade.and.returnValue(of({ success: true, message: 'Added successfully' }));
    mockService.updateInterdictionUpgrade.and.returnValue(of({ success: true, message: 'Updated successfully' }));



      TestBed.configureTestingModule({
imports: [
        AddEditInterdictionUpgrade
      ],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        { provide: InterdictionUpgradeMatrixService, useValue: mockService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getInterdictionCodes.calls.reset();


      mockService.addInterdictionUpgrade.calls.reset();


      mockService.updateInterdictionUpgrade.calls.reset();


      mockService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));


      mockService.addInterdictionUpgrade.and.returnValue(of({ success: true, message: 'Added successfully' }));


      mockService.updateInterdictionUpgrade.and.returnValue(of({ success: true, message: 'Updated successfully' }));


    fixture = TestBed.createComponent(AddEditInterdictionUpgrade);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {



    it('should initialize action options', () => {
      expect(component.actionOptions).toEqual(['Place', 'Release']);
    });




    it('should initialize filtered options arrays as empty', () => {
      expect(component.filteredSourceOptions).toEqual([]);
      expect(component.filteredExistingOptions).toEqual([]);
      expect(component.filteredActionInterdictionOptions).toEqual([]);
    });
  });

  describe('ngOnInit', () => {

    it('should populate interdiction options from @Input on init', fakeAsync(() => {
      component.interdictionCodes = mockInterdictionCodeOptions;
      component.ngOnInit();
      tick();

      expect(mockService.getInterdictionCodes).not.toHaveBeenCalled();
      expect(component.sourceInterdictionOptions).toEqual(mockInterdictionCodeOptions);
      expect(component.existingInterdictionOptions).toEqual(mockInterdictionCodeOptions);
      expect(component.actionInterdictionOptions).toEqual(mockInterdictionCodeOptions);
    }));

    it('should initialize filtered options with all options after loading', fakeAsync(() => {
      component.interdictionCodes = mockInterdictionCodeOptions;
      component.ngOnInit();
      tick();

      expect(component.filteredSourceOptions).toEqual(mockInterdictionCodeOptions);
      expect(component.filteredExistingOptions).toEqual(mockInterdictionCodeOptions);
      expect(component.filteredActionInterdictionOptions).toEqual(mockInterdictionCodeOptions);
    }));


    it('should leave options empty when interdictionCodes input is empty', fakeAsync(() => {
      component.interdictionCodes = [];
      component.ngOnInit();
      tick();

      expect(component.sourceInterdictionOptions).toEqual([]);
      expect(component.isLoadingOptions).toBe(false);
    }));

  });


  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });





    it('should store original values for update API', () => {
      expect(component['originalValues'].sourceInterdiction).toBe('SRC001');
      expect(component['originalValues'].existingInterdiction).toBe('EXT001');
      expect(component['originalValues'].actionInterdiction).toBe('ACT001');
    });

    it('should populate editModeValues correctly', () => {
      expect(component.editModeValues.sourceInterdiction).toBe('SRC001');
    });
  });

  describe('Action Mapping', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should map backend P to frontend Place', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, action: 'P' };
      component['setupPanel']();

      expect(component.form.get('action')?.value).toBe('Place');
    });

    it('should map backend R to frontend Release', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, action: 'R' };
      component['setupPanel']();

      expect(component.form.get('action')?.value).toBe('Release');
    });

    it('should return original value for unknown action', () => {
      const result = component['mapBackendActionToFrontend']('X');
      expect(result).toBe('X');
    });

    it('should map frontend Place to backend P', () => {
      const result = component['mapFrontendActionToBackend']('Place');
      expect(result).toBe('P');
    });

    it('should map frontend Release to backend R', () => {
      const result = component['mapFrontendActionToBackend']('Release');
      expect(result).toBe('R');
    });
  });
  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'add';
    });



    it('should call addInterdictionUpgrade when form is valid in add mode', fakeAsync(() => {
      component.form.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: 'ACT001',
        action: 'Place',
        effectiveDate: moment('2027-01-15'),
        terminationDate: null
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(mockService.addInterdictionUpgrade).toHaveBeenCalledWith(jasmine.objectContaining({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: 'ACT001',
        action: 'P',
        effectiveDate: jasmine.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        terminationDate: null
      }));
    }));

    it('should emit saveSuccess and closePanel on successful save', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: '',
        action: '',
        effectiveDate: moment('2027-01-15'),
        terminationDate: null
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should set isSaving to false after save completes successfully', fakeAsync(() => {
      component.form.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        effectiveDate: moment('2027-01-15')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should set isSaving to false after save error', fakeAsync(() => {
      mockService.addInterdictionUpgrade.and.returnValue(throwError(() => ({ status: 400, error: {} })));

      component.form.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        effectiveDate: moment('2027-01-15')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });

    it('should call updateInterdictionUpgrade in edit mode', fakeAsync(() => {
      component.form.patchValue({
        existingInterdiction: 'EXT002',
        actionInterdiction: 'ACT002',
        action: 'Release',
        terminationDate: moment().add(6, 'months')
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(mockService.updateInterdictionUpgrade).toHaveBeenCalledWith(jasmine.objectContaining({
        currentSourceInterdiction: 'SRC001',
        currentExistingInterdiction: 'EXT001',
        currentActionInterdiction: 'ACT001',
        existingInterdiction: 'EXT002',
        actionInterdiction: 'ACT002',
        action: 'R'
      }));
    }));

    it('should include effectiveDate in update payload as YYYY-MM-DD string', fakeAsync(() => {
      component.form.patchValue({
        existingInterdiction: 'EXT002'
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(mockService.updateInterdictionUpgrade).toHaveBeenCalledWith(jasmine.objectContaining({
        effectiveDate: jasmine.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      }));
    }));
  });

  describe('onSaveAndCreateAnother', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should call addInterdictionUpgrade and reset form in add mode', fakeAsync(() => {
      spyOn<any>(component, 'resetFormForAddMode');
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: '',
        action: '',
        effectiveDate: moment('2027-01-15'),
        terminationDate: null
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      expect(mockService.addInterdictionUpgrade).toHaveBeenCalled();
      expect(component['resetFormForAddMode']).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));

    it('should switch to add mode from edit mode after save', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component['setupPanel']();

      spyOn(component.modeChange, 'emit');

      component.form.patchValue({
        existingInterdiction: 'EXT002'
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    }));

    it('should call updateInterdictionUpgrade in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component['setupPanel']();

      component.form.patchValue({
        existingInterdiction: 'EXT002',
        actionInterdiction: 'ACT002',
        action: 'Release'
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      expect(mockService.updateInterdictionUpgrade).toHaveBeenCalledWith(jasmine.objectContaining({
        currentSourceInterdiction: 'SRC001',
        currentExistingInterdiction: 'EXT001',
        currentActionInterdiction: 'ACT001',
        existingInterdiction: 'EXT002',
        actionInterdiction: 'ACT002',
        action: 'R'
      }));
    }));

    it('should set isSaving to false after error', fakeAsync(() => {
      mockService.addInterdictionUpgrade.and.returnValue(throwError(() => ({
        status: 409,
        error: {}
      })));

      component.form.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        effectiveDate: moment('2027-01-15')
      });
      fixture.detectChanges();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.isSaving).toBe(false);
    }));
  });

  describe('Search Controls', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter sourceInterdictionOptions when sourceSearchControl value changes', fakeAsync(() => {
      const allOptions: InterdictionCodeOption[] = [
        { interCode: 'CODE001', interDesc: 'Code One' },
        { interCode: 'CODE002', interDesc: 'Code Two' },
        { interCode: 'TEST001', interDesc: 'Test One' },
      ];
      component.sourceInterdictionOptions = allOptions;
      component['setupSearchControls']();

      component.sourceSearchControl.setValue('CODE');
      tick();

      expect(component.filteredSourceOptions).toEqual([
        { interCode: 'CODE001', interDesc: 'Code One' },
        { interCode: 'CODE002', interDesc: 'Code Two' },
      ]);
    }));

    it('should filter case-insensitively', fakeAsync(() => {
      const allOptions: InterdictionCodeOption[] = [
        { interCode: 'CODE001', interDesc: 'Code One' },
        { interCode: 'code002', interDesc: 'Code Two' },
        { interCode: 'TEST001', interDesc: 'Test One' },
      ];
      component.sourceInterdictionOptions = allOptions;
      component['setupSearchControls']();

      component.sourceSearchControl.setValue('code');
      tick();

      expect(component.filteredSourceOptions).toEqual([
        { interCode: 'CODE001', interDesc: 'Code One' },
        { interCode: 'code002', interDesc: 'Code Two' },
      ]);
    }));


    it('should filter existingInterdictionOptions independently', fakeAsync(() => {
      component.existingInterdictionOptions = [
        { interCode: 'EXT001', interDesc: 'Ext One' },
        { interCode: 'EXT002', interDesc: 'Ext Two' },
        { interCode: 'ACT001', interDesc: 'Act One' },
      ];
      component['setupSearchControls']();

      component.existingSearchControl.setValue('EXT');
      tick();

      expect(component.filteredExistingOptions).toEqual([
        { interCode: 'EXT001', interDesc: 'Ext One' },
        { interCode: 'EXT002', interDesc: 'Ext Two' },
      ]);
    }));

    it('should filter actionInterdictionOptions independently', fakeAsync(() => {
      component.actionInterdictionOptions = [
        { interCode: 'ACT001', interDesc: 'Act One' },
        { interCode: 'ACT002', interDesc: 'Act Two' },
        { interCode: 'SRC001', interDesc: 'Src One' },
      ];
      component['setupSearchControls']();

      component.actionInterdictionSearchControl.setValue('ACT');
      tick();

      expect(component.filteredActionInterdictionOptions).toEqual([
        { interCode: 'ACT001', interDesc: 'Act One' },
        { interCode: 'ACT002', interDesc: 'Act Two' },
      ]);
    }));
  });


  describe('Error Message Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should return required error for sourceInterdiction', () => {
      component.form.get('sourceInterdiction')?.markAsTouched();
      expect(component.getSourceInterdictionError()).toBe('Source Interdiction is required');
    });

    it('should return invalidOption error for sourceInterdiction', () => {
      component.form.get('sourceInterdiction')?.setErrors({ invalidOption: true });
      component.form.get('sourceInterdiction')?.markAsTouched();
      expect(component.getSourceInterdictionError()).toBe('Please select a valid Source Interdiction');
    });


    it('should return required error for existingInterdiction', () => {
      component.form.get('existingInterdiction')?.markAsTouched();
      expect(component.getExistingInterdictionError()).toBe('Existing Interdiction is required');
    });

    it('should return invalidOption error for existingInterdiction', () => {
      component.form.get('existingInterdiction')?.setErrors({ invalidOption: true });
      component.form.get('existingInterdiction')?.markAsTouched();
      expect(component.getExistingInterdictionError()).toBe('Please select a valid Existing Interdiction');
    });


    it('should return invalidOption error for actionInterdiction', () => {
      component.form.get('actionInterdiction')?.setErrors({ invalidOption: true });
      component.form.get('actionInterdiction')?.markAsTouched();
      expect(component.getActionInterdictionError()).toBe('Please select a valid Action Interdiction');
    });




    it('should return past date error for effectiveDate', () => {
      const today = moment();
      const pastDate = moment(today).subtract(1, 'day');
      component.form.get('effectiveDate')?.setValue(pastDate);
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
    });

  });

  describe('Cross-Field Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should not show error when Effective Date equals Termination Date', () => {
      const sameDate = moment('2027-06-15');

      component.form.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        effectiveDate: sameDate.clone(),
        terminationDate: sameDate.clone()
      });

      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsTouched();

      expect(component.form.hasError('dateRangeInvalid')).toBe(false);
      expect(component.getEffectiveDateError()).toBe('');
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should not show error when Effective Date is before Termination Date', () => {
      const effectiveDate = moment('2027-06-10');
      const terminationDate = moment('2027-06-15');

      component.form.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });

      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsTouched();

      expect(component.form.hasError('dateRangeInvalid')).toBe(false);
      expect(component.getEffectiveDateError()).toBe('');
      expect(component.getTerminationDateError()).toBe('');
    });


    it('should only show cross-field error on the field that was last changed', () => {
      const effectiveDate = moment('2027-06-15');
      const terminationDate = moment('2027-06-10');

      component.form.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });

      // Mark both as touched
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsTouched();

      // Error should only show on effective date when it was last changed
      component['lastChangedDateField'] = 'effective';
      expect(component.getEffectiveDateError()).toBe('Effective Date must be less than or equal to Termination Date');
      expect(component.getTerminationDateError()).toBe('');

      // Error should only show on termination date when it was last changed
      component['lastChangedDateField'] = 'termination';
      expect(component.getEffectiveDateError()).toBe('');
      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });
  });


  describe('resetFormForAddMode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should restore required validators for add mode', () => {
      component['resetFormForAddMode']();

      component.form.get('sourceInterdiction')?.setValue('');
      component.form.get('sourceInterdiction')?.updateValueAndValidity();

      expect(component.form.get('sourceInterdiction')?.hasError('required')).toBe(true);
    });
  });
  describe('Trim Consistency', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trim all string fields in add payload', fakeAsync(() => {
      component.mode = 'add';
      component.form.patchValue({
        sourceInterdiction: '  SRC001  ',
        existingInterdiction: '  EXT001  ',
        actionInterdiction: '  ACT001  ',
        action: 'Place',
        effectiveDate: moment('2027-01-15'),
        terminationDate: null
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(mockService.addInterdictionUpgrade).toHaveBeenCalledWith(jasmine.objectContaining({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: 'ACT001',
        action: 'P',
        effectiveDate: jasmine.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        terminationDate: null
      }));
    }));

    it('should trim existingInterdiction and actionInterdiction in update payload', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component['setupPanel']();

      component.form.patchValue({
        existingInterdiction: '  EXT002  ',
        actionInterdiction: '  ACT002  '
      });
      fixture.detectChanges();

      component.onSave();
      tick();

      expect(mockService.updateInterdictionUpgrade).toHaveBeenCalledWith(jasmine.objectContaining({
        existingInterdiction: 'EXT002',
        actionInterdiction: 'ACT002'
      }));
    }));
  });

  describe('Template Rendering - ngx-mat-select-search', () => {
    it('should render mat-select with ngx-mat-select-search', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const matSelects = compiled.querySelectorAll('mat-select');
      expect(matSelects.length).toBeGreaterThan(0);
    }));
  });
  describe('resetFormForAddMode - effectiveDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should restore effectiveDate required validator after reset', () => {
      component['resetFormForAddMode']();

      component.form.get('effectiveDate')?.setValue(null);
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.updateValueAndValidity();

      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(true);
    });
  });
});
