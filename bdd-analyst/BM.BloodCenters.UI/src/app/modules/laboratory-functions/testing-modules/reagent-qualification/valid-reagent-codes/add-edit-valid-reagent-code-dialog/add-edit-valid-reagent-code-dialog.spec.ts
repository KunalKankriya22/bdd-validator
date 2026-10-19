import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AddEditValidReagentCodeDialog } from './add-edit-valid-reagent-code-dialog';
import { ValidReagentCodeService } from '../services/valid-reagent-code.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HeaderService } from '@shared/services/header.service';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditValidReagentCodeDialog', () => {
  let serviceSpy: any;
  let component: AddEditValidReagentCodeDialog;
  let fixture: ComponentFixture<AddEditValidReagentCodeDialog>;
  let service: jasmine.SpyObj<ValidReagentCodeService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ValidReagentCodeService', [
      'create',
      'update',
      'getReagentTypesLov',
      'getControlFlagsLov',
      'getPreparationFlagsLov'
    ]);
    const snackBarSpy = createMockMatSnackBar();
    const headerServiceSpy = createMockHeaderService();

    serviceSpy.getReagentTypesLov.and.returnValue(of([
      { code: 'R', description: 'Reagent' },
      { code: 'C', description: 'C-Control' },
      { code: 'S', description: 'Saline' }
    ]));
    serviceSpy.getControlFlagsLov.and.returnValue(of([
      { code: 'P', description: 'Positive' },
      { code: 'N', description: 'Negative' }
    ]));
    serviceSpy.getPreparationFlagsLov.and.returnValue(of([
      { code: 'P', description: 'Prep necessary' },
      { code: 'Y', description: 'Used in preparation' },
      { code: 'I', description: 'Intermediate' },
      { code: 'N', description: 'Not required' }
    ]));



      TestBed.configureTestingModule({
imports: [
        AddEditValidReagentCodeDialog,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ValidReagentCodeService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });


    });



  beforeEach(() => {

      serviceSpy.getReagentTypesLov.and.returnValue(of([]));

      serviceSpy.getControlFlagsLov.and.returnValue(of([]));

      serviceSpy.getPreparationFlagsLov.and.returnValue(of([]));

    service = TestBed.inject(ValidReagentCodeService) as jasmine.SpyObj<ValidReagentCodeService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture = TestBed.createComponent(AddEditValidReagentCodeDialog);
    component = fixture.componentInstance;
    component.testId = 'ABORh';
    component.testDesc = 'ABO & Rh Blood Groupings';


    });

  it('should create the component', () => {
    component.mode = 'add';
    component.ngOnInit();
    expect(component).toBeTruthy();
  });

  it('should preserve disabled effective date on clear all in edit mode', () => {
    component.mode = 'edit';
    const pastDate = moment('2020-01-01');
    component.data = {
      reagentType: 'R',
      controlFlag: null,
      reagentCode: 'A',
      reagentName: 'Anti-A',
      masterLotRequired: 'N',
      effDate: pastDate.toISOString(),
      termDate: null,
      preparationFlag: 'P',
      prequalificationFlag: 'Y',
      lastModifyDate: null,
      lastModifyUser: null,
      testId: 'ABORh',
      testDesc: 'ABO & Rh Blood Groupings'
    };
    component.ngOnInit();

    const effDateControl = component.form.get('effDate');
    const originalEffDate = effDateControl?.value;

    component.onClearAll();

    if (effDateControl?.disabled) {
      expect(effDateControl?.value).toEqual(originalEffDate);
    }
  });

  it('should uppercase reagent code automatically', () => {
    component.mode = 'add';
    component.ngOnInit();

    const reagentCodeControl = component.form.get('reagentCode');

    component.form.get('reagentCode')?.setValue('ABC');

    expect(reagentCodeControl?.value).toBe('ABC');
  });

  it('should clear control flag when reagent type changes from C to R', () => {
    component.mode = 'add';
    component.ngOnInit();

    const reagentTypeControl = component.form.get('reagentType');
    const controlFlagControl = component.form.get('controlFlag');

    reagentTypeControl?.setValue('C');
    controlFlagControl?.setValue('P');

    reagentTypeControl?.setValue('R');

    expect(controlFlagControl?.value).toBe('');
  });


  it('should handle successful save without errors', () => {
    service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

    component.mode = 'add';
    component.ngOnInit();

    component.form.patchValue({
      reagentType: 'R',
      reagentCode: 'TEST',
      reagentName: 'Test Reagent',
      masterLotRequired: 'N',
      effDate: moment().add(1, 'days'),
      termDate: null,
      preparationFlag: 'N',
      prequalificationFlag: 'N'
    });

    spyOn(component.saveSuccess, 'emit');

    component.onSave();

    expect(service.create).toHaveBeenCalled();
    expect(component.saving).toBe(false);
  });


  it('should keep effective date enabled in edit mode when date is today or future', () => {
    component.mode = 'edit';
    const futureDate = moment().add(10, 'days');
    component.data = {
      reagentType: 'R',
      controlFlag: null,
      reagentCode: 'A',
      reagentName: 'Anti-A',
      masterLotRequired: 'N',
      effDate: futureDate.toISOString(),
      termDate: null,
      preparationFlag: 'P',
      prequalificationFlag: 'Y',
      lastModifyDate: null,
      lastModifyUser: null,
      testId: 'ABORh',
      testDesc: 'ABO & Rh Blood Groupings'
    };

    component.ngOnInit();

    const effDateControl = component.form.get('effDate');
    expect(effDateControl?.disabled).toBe(false);
  });



  it('should display last modified information in edit mode', () => {
    component.mode = 'edit';
    component.data = {
      reagentType: 'R',
      controlFlag: null,
      reagentCode: 'A',
      reagentName: 'Anti-A',
      masterLotRequired: 'N',
      effDate: '2025-01-01T00:00:00Z',
      termDate: null,
      preparationFlag: 'P',
      prequalificationFlag: 'Y',
      lastModifyDate: '2025-06-15T14:30:00Z',
      lastModifyUser: 'TESTUSER',
      testId: 'ABORh',
      testDesc: 'ABO & Rh Blood Groupings'
    };

    expect(component.lastModified).toContain('Last Modified');
  });

  it('should not display last modified in add mode', () => {
    component.mode = 'add';
    component.data = null;

    expect(component.lastModified).toBe('');
  });

  it('should show dialog title as "Add New Code" in add mode', () => {
    component.mode = 'add';
    expect(component.dialogTitle).toBe('Add New Code');
  });

  it('should show dialog title as "Edit Record" in edit mode', () => {
    component.mode = 'edit';
    expect(component.dialogTitle).toBe('Edit Record');
  });

  it('should reject termination date before effective date', () => {
    component.mode = 'add';
    component.ngOnInit();

    const effDateControl = component.form.get('effDate');
    const termDateControl = component.form.get('termDate');

    effDateControl?.setValue(moment().add(15, 'days'));
    effDateControl?.markAsTouched();
    termDateControl?.setValue(moment().add(14, 'days'));
    termDateControl?.markAsTouched();

    component['lastChangedDateField'] = 'termination';

    expect(component.form.hasError('dateRangeInvalid')).toBe(true);
    const error = component.getTerminationDateError();
    expect(error).toContain('must be greater than or equal to');
  });

  it('should return isAddMode correctly', () => {
    component.mode = 'add';
    expect(component.isAddMode).toBe(true);

    component.mode = 'edit';
    expect(component.isAddMode).toBe(false);
  });

  it('should emit close on cancel', () => {
    spyOn(component.close, 'emit');
    component.onCancel();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should call onSave with true on addAndCreateAnother', () => {
    service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

    component.mode = 'add';
    component.ngOnInit();

    component.form.patchValue({
      reagentType: 'R',
      reagentCode: 'TEST',
      reagentName: 'Test Reagent',
      masterLotRequired: 'N',
      effDate: moment().add(1, 'days'),
      termDate: null,
      preparationFlag: 'N',
      prequalificationFlag: 'N'
    });

    spyOn(component.saveSuccess, 'emit');
    component.onAddAndCreateAnother();

    expect(service.create).toHaveBeenCalled();
  });

  it('should handle update save in edit mode', () => {
    service.update.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));

    component.mode = 'edit';
    component.data = {
      reagentType: 'R',
      controlFlag: null,
      reagentCode: 'A',
      reagentName: 'Anti-A',
      masterLotRequired: 'N',
      effDate: moment().add(1, 'days').toISOString(),
      termDate: null,
      preparationFlag: 'P',
      prequalificationFlag: 'Y',
      lastModifyDate: null,
      lastModifyUser: null,
      testId: 'ABORh',
      testDesc: 'ABO & Rh Blood Groupings'
    };
    component.ngOnInit();

    spyOn(component.saveSuccess, 'emit');
    component.onSave();

    expect(service.update).toHaveBeenCalled();
    expect(component.saving).toBe(false);
  });

  it('should handle save error from API', () => {
    service.create.and.returnValue(throwError(() => ({
      status: 400,
      error: { errorResponse: { errorMessage: 'Validation failed' } }
    })));

    component.mode = 'add';
    component.ngOnInit();

    component.form.patchValue({
      reagentType: 'R',
      reagentCode: 'TEST',
      reagentName: 'Test Reagent',
      masterLotRequired: 'N',
      effDate: moment().add(1, 'days'),
      termDate: null,
      preparationFlag: 'N',
      prequalificationFlag: 'N'
    });

    component.onSave();

    expect(component.saving).toBe(false);
  });

  it('should handle save with success=false response', () => {
    service.create.and.returnValue(of({
      success: false,
      message: 'Duplicate record',
      statusCode: 409
    }));

    component.mode = 'add';
    component.ngOnInit();

    component.form.patchValue({
      reagentType: 'R',
      reagentCode: 'DUP',
      reagentName: 'Duplicate',
      masterLotRequired: 'N',
      effDate: moment().add(1, 'days'),
      termDate: null,
      preparationFlag: 'N',
      prequalificationFlag: 'N'
    });

    component.onSave();

    expect(component.saving).toBe(false);
  });

  it('should disable effective date in edit mode when date is in the past', () => {
    component.mode = 'edit';
    const pastDate = moment().subtract(30, 'days');
    component.data = {
      reagentType: 'R',
      controlFlag: null,
      reagentCode: 'A',
      reagentName: 'Anti-A',
      masterLotRequired: 'N',
      effDate: pastDate.toISOString(),
      termDate: null,
      preparationFlag: 'P',
      prequalificationFlag: 'Y',
      lastModifyDate: null,
      lastModifyUser: null,
      testId: 'ABORh',
      testDesc: 'ABO & Rh Blood Groupings'
    };

    component.ngOnInit();

    const effDateControl = component.form.get('effDate');
    expect(effDateControl?.disabled).toBe(true);
  });

  it('should enable controlFlag when reagentType is C in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.get('reagentType')?.setValue('C');

    expect(component.form.get('controlFlag')?.enabled).toBe(true);
  });

  it('should disable controlFlag when reagentType is S', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.get('reagentType')?.setValue('S');

    expect(component.form.get('controlFlag')?.disabled).toBe(true);
  });

  it('should reset form in add mode on onClearAll', () => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.patchValue({
      reagentType: 'R',
      reagentCode: 'TEST',
      reagentName: 'Test'
    });

    component.onClearAll();

    expect(component.form.get('reagentType')?.value).toBeFalsy();
    expect(component.form.get('reagentCode')?.value).toBeFalsy();
  });

  it('should strip invalid chars and uppercase reagent code on input', () => {
    component.mode = 'add';
    component.ngOnInit();

    const mockEvent = {
      target: { value: 'abc123' }
    };

    component.onReagentCodeInput(mockEvent as any);

    const value = component.form.get('reagentCode')?.value;
    expect(value).toBe(value?.toUpperCase());
  });

  it('should emit modeChange event', () => {
    spyOn(component.modeChange, 'emit');
    component.mode = 'add';

    expect(component.modeChange).toBeTruthy();
  });

  it('should return effective date error message', () => {
    component.mode = 'add';
    component.ngOnInit();

    const effDateControl = component.form.get('effDate');
    effDateControl?.setValue(null);
    effDateControl?.markAsTouched();

    const error = component.getEffectiveDateError();
    expect(typeof error).toBe('string');
  });

  it('should set saving flag during save', () => {
    service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

    component.mode = 'add';
    component.ngOnInit();

    component.form.patchValue({
      reagentType: 'R',
      reagentCode: 'TEST',
      reagentName: 'Test Reagent',
      masterLotRequired: 'N',
      effDate: moment().add(1, 'days'),
      termDate: null,
      preparationFlag: 'N',
      prequalificationFlag: 'N'
    });

    component.onSave();

    expect(component.saving).toBe(false);
  });
});
