import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { AddUpdateAssociateNicknameComponent } from './add-update-associate-nickname';
import { AssociateNicknameToNameApiService } from '../services/associate-nickname-to-name-api.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddUpdateAssociateNicknameComponent', () => {
  let component: AddUpdateAssociateNicknameComponent;
  let fixture: ComponentFixture<AddUpdateAssociateNicknameComponent>;
  let mockApiService: jasmine.SpyObj<AssociateNicknameToNameApiService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {

    mockApiService = jasmine.createSpyObj('AssociateNicknameToNameApiService', [
      'createAssociateNickname',
      'updateAssociateNickname'
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockSnackBar.open.and.returnValue({ onAction: () => of(undefined), dismiss: () => {} } as any);



      TestBed.configureTestingModule({
imports: [
        AddUpdateAssociateNicknameComponent,
        HttpClientTestingModule],
      providers: [
        { provide: AssociateNicknameToNameApiService, useValue: mockApiService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });


    });



  beforeEach(() => {


      mockApiService.createAssociateNickname.calls.reset();


      mockApiService.updateAssociateNickname.calls.reset();


      mockSnackBar.open.and.returnValue({ onAction: () => of(undefined), dismiss: () => {} } as any);


    fixture = TestBed.createComponent(AddUpdateAssociateNicknameComponent);
    component = fixture.componentInstance;


    });


  it('should initialize form in edit mode', () => {
    component.mode = 'edit';
    const futureDate = moment().add(10, 'days').toISOString();
    component.data = {
      nickName: 'BOB',
      firstName: 'ROBERT',
      effDate: futureDate,
      termDate: null,
      programId: 'TEST',
      insertDate: '2026-04-01',
      insertUser: 'admin',
      auditKey: 1
    };

    component.ngOnInit();

    expect(component.panelTitle).toBe('Edit Nickname');
    expect(component.form.get('nickName')?.value).toBe('BOB');
    expect(component.form.get('firstName')?.value).toBe('ROBERT');
    expect(component.editModeValues.nickName).toBe('BOB');
    expect(component.editModeValues.firstName).toBe('ROBERT');
  });









  it('should allow special characters in nickname field', () => {
    component.ngOnInit();
    const nickNameControl = component.form.get('nickName');

    nickNameControl?.setValue("Bob-O'Neil");
    nickNameControl?.markAsTouched();

    expect(nickNameControl?.hasError('invalidNameCharacters')).toBeFalsy();
  });

  it('should validate effective date as required', () => {
    component.ngOnInit();
    const effDateControl = component.form.get('effectiveDate');

    effDateControl?.setValue(null);
    effDateControl?.markAsTouched();

    expect(effDateControl?.hasError('required')).toBe(true);
  });

  it('should validate termination date must be after effective date in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();

    // Use future dates to avoid past date validation
    const futureEffectiveDate = moment().add(10, 'days');
    const futureTerminationDate = moment().add(5, 'days'); // Before effective date

    component.form.patchValue({
      effectiveDate: futureEffectiveDate,
      terminationDate: futureTerminationDate
    });

    expect(component.form.hasError('dateRangeInvalid')).toBe(true);
  });

  it('should validate termination date range in edit mode', () => {
    component.mode = 'edit';
    const futureDate = moment().add(10, 'days').toISOString();
    component.data = {
      nickName: 'BOB',
      firstName: 'ROBERT',
      effDate: futureDate,
      termDate: null,
      programId: 'TEST',
      insertDate: '2026-04-01',
      insertUser: 'admin',
      auditKey: 1
    };
    component.ngOnInit();

    const termDateControl = component.form.get('terminationDate');
    termDateControl?.setValue(moment().add(5, 'days')); // Before effective date
    termDateControl?.markAsTouched();

    const error = component.getTermDateError();
    expect(error).toBe('Termination Date must be greater than or equal to Effective Date');
    expect(component.isFormValidGetter).toBeFalsy();
  });

  it('should save in add mode with correct UTC date conversion', fakeAsync(() => {
    component.mode = 'add';
    component.ngOnInit();

    const effectiveDate = moment().add(10, 'days');
    const terminationDate = moment().add(30, 'days');

    component.form.patchValue({
      nickName: 'BOB',
      firstName: 'ROBERT',
      effectiveDate: effectiveDate,
      terminationDate: terminationDate
    });

    const mockResponse = {
      success: true,
      message: 'Created successfully',
      statusCode: 201,
      total: 1
    };

    mockApiService.createAssociateNickname.and.returnValue(of(mockResponse));

    spyOn(component.saveSuccess, 'emit');
    spyOn(component.closePanel, 'emit');

    component.onSave();
    tick();

    expect(mockApiService.createAssociateNickname).toHaveBeenCalledWith(
      jasmine.objectContaining({
        nickName: 'BOB',
        firstName: 'ROBERT',
        effDate: jasmine.any(String),
        termDate: jasmine.any(String)
      })
    );
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.closePanel.emit).toHaveBeenCalled();
  }));

  it('should save in edit mode', fakeAsync(() => {
    component.mode = 'edit';
    const futureEffDate = moment().add(10, 'days').toISOString();
    component.data = {
      nickName: 'BOB',
      firstName: 'ROBERT',
      effDate: futureEffDate,
      termDate: null,
      programId: 'TEST',
      insertDate: '2026-04-01',
      insertUser: 'admin',
      auditKey: 1
    };

    component.ngOnInit();

    component.form.patchValue({
      terminationDate: moment().add(30, 'days')
    });

    const mockResponse = {
      success: true,
      message: 'Updated successfully',
      statusCode: 200,
      total: 1
    };

    mockApiService.updateAssociateNickname.and.returnValue(of(mockResponse));

    spyOn(component.saveSuccess, 'emit');
    spyOn(component.closePanel, 'emit');

    component.onSave();
    tick();

    expect(mockApiService.updateAssociateNickname).toHaveBeenCalledWith(
      'BOB',
      'ROBERT',
      jasmine.objectContaining({
        nickName: 'BOB',
        firstName: 'ROBERT'
      })
    );
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.closePanel.emit).toHaveBeenCalled();
  }));


  it('should block save in edit mode when termination date is before effective date', fakeAsync(() => {
    component.mode = 'edit';
    const futureEffDate = moment().add(10, 'days').toISOString();
    component.data = {
      nickName: 'BOB',
      firstName: 'ROBERT',
      effDate: futureEffDate,
      termDate: null,
      programId: 'TEST',
      insertDate: '2026-04-01',
      insertUser: 'admin',
      auditKey: 1
    };
    component.ngOnInit();

    component.form.patchValue({
      terminationDate: moment().add(5, 'days') // Before effective date
    });
    component.form.markAsDirty();

    expect(component.isFormValidGetter).toBeFalsy();
    expect(mockApiService.updateAssociateNickname).not.toHaveBeenCalled();
  }));


  it('should format date for display correctly', () => {
    const testDate = moment().add(10, 'days');
    const formatted = component['formatDateForDisplay'](testDate.toISOString());

    const expectedFormatted = testDate.format('DD-MMM-YYYY').toUpperCase();
    expect(formatted).toBe(expectedFormatted);
  });


  it('should return isFormValidGetter as true in edit mode only when form is dirty and valid', () => {
    component.mode = 'edit';
    const futureDate = moment().add(10, 'days').toISOString();
    component.data = {
      nickName: 'BOB',
      firstName: 'ROBERT',
      effDate: futureDate,
      termDate: null,
      programId: 'TEST',
      insertDate: '2026-04-01',
      insertUser: 'admin',
      auditKey: 1
    };
    component.ngOnInit();

    // Form is not dirty initially, save should be disabled
    expect(component.isFormValidGetter).toBe(false);

    // Mark form dirty and valid
    component.form.markAsDirty();
    expect(component.isFormValidGetter).toBe(true);

    component.isSaving = true;
    expect(component.isFormValidGetter).toBe(false);
  });

  it('should reset form for add mode correctly', () => {
    component.mode = 'edit';
    const futureDate = moment().add(10, 'days').toISOString();
    component.data = {
      nickName: 'BOB',
      firstName: 'ROBERT',
      effDate: futureDate,
      termDate: null,
      programId: 'TEST',
      insertDate: '2026-04-01',
      insertUser: 'admin',
      auditKey: 1
    };
    component.ngOnInit();

    component['resetFormForAddMode']();

    expect(component.form.get('nickName')?.value).toBe('');
    expect(component.form.get('firstName')?.value).toBe('');
    expect(component.form.get('effectiveDate')?.value).toBeNull();
    expect(component.form.get('terminationDate')?.value).toBeNull();
  });

  it('should return termination date error in add mode', () => {
    component.mode = 'add';
    component.ngOnInit();

    // Use future dates to ensure only date range validation triggers, not past date validation
    const futureEffectiveDate = moment().add(10, 'days');
    const futureTerminationDate = moment().add(5, 'days'); // Before effective date

    component.form.patchValue({
      effectiveDate: futureEffectiveDate,
      terminationDate: futureTerminationDate
    });

    const termDateControl = component.form.get('terminationDate');
    termDateControl?.markAsTouched();
    component.form.updateValueAndValidity(); // Trigger form-level validation

    const error = component.getTermDateError();
    expect(error).toBe('Termination Date must be greater than or equal to Effective Date');
  });

  it('should handle save and create another in add mode', fakeAsync(() => {
    component.mode = 'add';
    component.ngOnInit();

    component.form.patchValue({
      nickName: 'BOB',
      firstName: 'ROBERT',
      effectiveDate: moment().add(10, 'days')
    });

    const mockResponse = {
      success: true,
      message: 'Created successfully',
      statusCode: 201,
      total: 1
    };

    mockApiService.createAssociateNickname.and.returnValue(of(mockResponse));

    spyOn(component.saveSuccess, 'emit');
    spyOn(component['resetFormForAddMode'] as any, 'call');

    component.onSaveAndCreateAnother();
    tick();

    expect(mockApiService.createAssociateNickname).toHaveBeenCalled();
    expect(component.saveSuccess.emit).toHaveBeenCalled();
  }));
});
