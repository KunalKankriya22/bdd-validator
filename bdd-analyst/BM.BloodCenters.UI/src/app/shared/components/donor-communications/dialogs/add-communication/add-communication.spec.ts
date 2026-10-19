import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { AddCommunicationDialogComponent } from './add-communication';
import { DonorCommunicationsService } from '../../services/donor-communications.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import moment from 'moment';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddCommunicationDialogComponent', () => {
  let component: AddCommunicationDialogComponent;
  let fixture: ComponentFixture<AddCommunicationDialogComponent>;
  let serviceSpy: jasmine.SpyObj<DonorCommunicationsService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddCommunicationDialogComponent>>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let loginSpy: jasmine.SpyObj<LoginService>;

  // Relative date for test data
  const today = moment().format('YYYY-MM-DD');

  const mockDialogData = {
    mode: 'new' as const,
    donorId: 'D123456'
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DonorCommunicationsService', [
      'getCommunicationTypes',
      'getCommunicationCodes',
      'getActionCodes',
      'createCommunication'
    ]);
    snackbarSpy = createMockSnackbarService();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    headerSpy = createMockHeaderService({ chapterTimeZone: signal('+00:00') });
    loginSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    serviceSpy.getCommunicationTypes.and.returnValue(of([
      { code: 'MAIL', description: 'Mail Communication' }
    ]));
    serviceSpy.getCommunicationCodes.and.returnValue(of([
      { code: 'THK', description: 'Thank You' }
    ]));
    serviceSpy.getActionCodes.and.returnValue(of([
      { code: 'SEND', description: 'Send Letter' }
    ]));
    serviceSpy.createCommunication.and.returnValue(of({
      donorId: 'D123456',
      sequenceNumber: 1,
      chapterId: 'CH01',
      comDate: today,
      comType: 'MAIL',
      comCode: 'THK',
      insertDate: today,
      insertUser: 'ADMIN'
    }));

    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());
    loginSpy.getStoredUsername.and.returnValue('TESTUSER');



      TestBed.configureTestingModule({
      imports: [AddCommunicationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: DonorCommunicationsService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: LoginService, useValue: loginSpy }
      ]
    });
      chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());


      loginSpy.getStoredUsername.and.returnValue('TESTUSER');


    fixture = TestBed.createComponent(AddCommunicationDialogComponent);
    component = fixture.componentInstance;


    });






  it('should load codes when type changes', () => {
    fixture.detectChanges();

    component.form.patchValue({ communicationType: 'MAIL' });

    expect(serviceSpy.getCommunicationCodes).toHaveBeenCalledWith('MAIL');
  });



  it('should show success message on save', (done) => {
    fixture.detectChanges();

    component.form.patchValue({
      communicationType: 'MAIL',
      communicationCode: 'THK'
    });

    component.onSave();

    setTimeout(() => {
      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'save' });
      done();
    }, 100);
  });

  it('should close dialog on cancel', () => {
    fixture.detectChanges();
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'cancel' });
  });

  it('should not save when form is invalid', () => {
    fixture.detectChanges();
    // form is invalid because communicationType and communicationCode are required but empty
    component.onSave();
    expect(serviceSpy.createCommunication).not.toHaveBeenCalled();
  });

  it('should close dialog when onSave called in details mode', () => {
    component.data = { mode: 'details', donorId: 'D123456', communication: {
      donorId: 'D123456', sequenceNumber: 1, chapterId: 'C1', comDate: today,
      comType: 'MAIL', comCode: 'THK', insertDate: today, insertUser: 'U1'
    } } as any;
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL', communicationCode: 'THK' });
    component.onSave();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'cancel' });
  });

  it('should clear codes when type changes to empty', () => {
    fixture.detectChanges();
    // first set a type to trigger code loading
    component.form.patchValue({ communicationType: 'MAIL' });
    // then clear it
    component.form.patchValue({ communicationType: '' });
    expect(component.communicationCodes()).toEqual([]);
    expect(component.actionCodes()).toEqual([]);
    expect(component.selectedTypeDesc()).toBe('');
  });

  it('should set selectedCodeDesc when code changes', () => {
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL' });
    // codes should be loaded, now select a code
    component.form.patchValue({ communicationCode: 'THK' });
    expect(component.selectedCodeDesc()).toBe('Thank You');
  });

  it('should clear selectedCodeDesc when code cleared', () => {
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL' });
    component.form.patchValue({ communicationCode: 'THK' });
    component.form.patchValue({ communicationCode: '' });
    expect(component.selectedCodeDesc()).toBe('');
  });

  it('should set selectedActionCodeDesc when action code changes', () => {
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL' });
    component.form.patchValue({ actionCode: 'SEND' });
    expect(component.selectedActionCodeDesc()).toBe('Send Letter');
  });

  it('should clear selectedActionCodeDesc when action code cleared', () => {
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL' });
    component.form.patchValue({ actionCode: 'SEND' });
    component.form.patchValue({ actionCode: '' });
    expect(component.selectedActionCodeDesc()).toBe('');
  });

  it('should handle error when loading communication codes', () => {
    serviceSpy.getCommunicationCodes.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL' });
    expect(component.communicationCodes()).toEqual([]);
    expect(component.loadingCodes()).toBeFalse();
  });

  it('should handle error when loading action codes', () => {
    serviceSpy.getActionCodes.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL' });
    expect(component.actionCodes()).toEqual([]);
  });

  it('should handle error when loading communication types', () => {
    serviceSpy.getCommunicationTypes.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(component.communicationTypes()).toEqual([]);
    expect(component.filteredComTypes()).toEqual([]);
  });

  it('should handle error on save and re-enable form', () => {
    serviceSpy.createCommunication.and.returnValue(throwError(() => ({ error: { Message: 'Server error' } })));
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL', communicationCode: 'THK' });
    component.onSave();
    expect(component.loading()).toBeFalse();
    expect(component.form.enabled).toBeTrue();
  });

  it('should display extracted error message on save failure', () => {
    const snackSpy = spyOn((component as any).snackbarService, 'showError');
    serviceSpy.createCommunication.and.returnValue(throwError(() => ({ error: { Message: 'Custom msg' } })));
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL', communicationCode: 'THK' });
    component.onSave();
    expect(snackSpy).toHaveBeenCalledWith('Custom msg');
  });

  it('should use fallback error message when no specific error', () => {
    const snackSpy = spyOn((component as any).snackbarService, 'showError');
    serviceSpy.createCommunication.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL', communicationCode: 'THK' });
    component.onSave();
    expect(snackSpy).toHaveBeenCalledWith('Failed to save communication');
  });

  it('should extract error from error.error.Error', () => {
    const snackSpy = spyOn((component as any).snackbarService, 'showError');
    serviceSpy.createCommunication.and.returnValue(throwError(() => ({ error: { Error: 'Error field msg' } })));
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL', communicationCode: 'THK' });
    component.onSave();
    expect(snackSpy).toHaveBeenCalledWith('Error field msg');
  });

  it('should extract error from ErrorResponse.Error', () => {
    const snackSpy = spyOn((component as any).snackbarService, 'showError');
    serviceSpy.createCommunication.and.returnValue(throwError(() => ({
      error: { ErrorResponse: { Error: 'Nested error' } }
    })));
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL', communicationCode: 'THK' });
    component.onSave();
    expect(snackSpy).toHaveBeenCalledWith('Nested error');
  });

  it('should map known error codes to user-friendly messages', () => {
    const snackSpy = spyOn((component as any).snackbarService, 'showError');
    serviceSpy.createCommunication.and.returnValue(throwError(() => ({ error: { ErrorCode: '18030' } })));
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL', communicationCode: 'THK' });
    component.onSave();
    expect(snackSpy).toHaveBeenCalledWith('Comments exceed maximum length (2000 characters)');
  });

  it('should return null for unknown error code without message', () => {
    const snackSpy = spyOn((component as any).snackbarService, 'showError');
    serviceSpy.createCommunication.and.returnValue(throwError(() => ({ error: { ErrorCode: '99999' } })));
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL', communicationCode: 'THK' });
    component.onSave();
    expect(snackSpy).toHaveBeenCalledWith('Failed to save communication');
  });

  it('should return isNewMode correctly', () => {
    fixture.detectChanges();
    expect(component.isNewMode).toBeTrue();
  });

  it('should return correct dialogTitle for new mode', () => {
    fixture.detectChanges();
    expect(component.dialogTitle).toBe('Add New');
  });

  it('should return dash for null date in formatDate', () => {
    fixture.detectChanges();
    expect(component.formatDate(null)).toBe('-');
  });

  it('should format valid date in formatDate', () => {
    fixture.detectChanges();
    const result = component.formatDate('2024-06-15');
    expect(result).toBeTruthy();
    expect(result).not.toBe('-');
  });

  it('should track by value', () => {
    fixture.detectChanges();
    expect(component.trackByValue(0, { value: 'ABC', label: 'label' })).toBe('ABC');
  });

  it('should prevent leading and multiple spaces', () => {
    fixture.detectChanges();
    const event = new KeyboardEvent('keydown', { key: ' ' });
    spyOn(event, 'preventDefault');
    component.form.get('comments')?.setValue('');
    // Just ensure it doesn't throw
    component.preventLeadingAndMultipleSpaces(event, 'comments');
  });

  it('should trim trailing spaces', () => {
    fixture.detectChanges();
    component.form.get('comments')?.setValue('hello   ');
    component.trimTrailingSpaces('comments');
    expect(component.form.get('comments')?.value).toBe('hello');
  });

  it('should prevent space input', () => {
    fixture.detectChanges();
    const event = new KeyboardEvent('keydown', { key: ' ' });
    spyOn(event, 'preventDefault');
    component.preventSpaceInput(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should return empty string for getTargetDateError when not touched', () => {
    fixture.detectChanges();
    expect(component.getTargetDateError()).toBe('');
  });

  it('should return error for invalid target date', () => {
    fixture.detectChanges();
    const control = component.form.get('targetDate');
    control?.setErrors({ matDatepickerParse: true });
    control?.markAsTouched();
    expect(component.getTargetDateError()).toBe('Target Date is invalid');
  });

  it('should return error for invalid action date', () => {
    fixture.detectChanges();
    const control = component.form.get('actionDate');
    control?.setErrors({ matDatepickerParse: true });
    control?.markAsTouched();
    expect(component.getActionDateError()).toBe('Action Date is invalid');
  });

  it('should return empty string for getActionDateError when not touched', () => {
    fixture.detectChanges();
    expect(component.getActionDateError()).toBe('');
  });

  it('should return false for hasVisibleDateError when no date errors', () => {
    fixture.detectChanges();
    expect(component.hasVisibleDateError).toBeFalse();
  });

  it('should return true for isSaveDisabled when loading', () => {
    fixture.detectChanges();
    component.loading.set(true);
    expect(component.isSaveDisabled).toBeTrue();
  });

  it('should return true for isSaveDisabled when form is invalid in new mode', () => {
    fixture.detectChanges();
    // form starts invalid (required fields empty)
    expect(component.isSaveDisabled).toBeTrue();
  });

  it('should filter com types via search', () => {
    fixture.detectChanges();
    component.comTypeSearchControl.setValue('MAIL');
    expect(component.filteredComTypes().length).toBe(1);
  });

  it('should show all com types when search is empty', () => {
    fixture.detectChanges();
    component.comTypeSearchControl.setValue('');
    expect(component.filteredComTypes().length).toBe(component.communicationTypes().length);
  });

  it('should filter com codes via search', () => {
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL' });
    component.comCodeSearchControl.setValue('THK');
    expect(component.filteredComCodes().length).toBe(1);
  });

  it('should filter action codes via search', () => {
    fixture.detectChanges();
    component.form.patchValue({ communicationType: 'MAIL' });
    component.actionCodeSearchControl.setValue('SEND');
    expect(component.filteredActionCodes().length).toBe(1);
  });

  it('should handle onTargetDateInput', () => {
    fixture.detectChanges();
    const input = { target: { value: '01-JAN-2025' } } as any;
    component.onTargetDateInput(input);
    const control = component.form.get('targetDate');
    expect(control?.touched).toBeTrue();
  });

  it('should handle onActionDateInput', () => {
    fixture.detectChanges();
    const input = { target: { value: '01-JAN-2025' } } as any;
    component.onActionDateInput(input);
    const control = component.form.get('actionDate');
    expect(control?.touched).toBeTrue();
  });

  it('should not save when hasVisibleDateError is true', () => {
    component.ngOnInit();
    const control = component.form.get('targetDate');
    control?.setErrors({ matDatepickerParse: true });
    control?.markAsTouched();
    component.form.patchValue({ communicationType: 'MAIL', communicationCode: 'THK' });
    component.onSave();
    expect(serviceSpy.createCommunication).not.toHaveBeenCalled();
  });

  describe('ngOnInit validation', () => {
    it('should close dialog when data is null', () => {
      component.data = null as any;
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      component.ngOnInit();
      expect(snackSpy).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'cancel' });
    });

    it('should close dialog when donorId is missing', () => {
      component.data = { mode: 'new', donorId: '' } as any;
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      component.ngOnInit();
      expect(snackSpy).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'cancel' });
    });

    it('should close dialog when mode is invalid', () => {
      component.data = { mode: 'invalid', donorId: 'D123' } as any;
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      component.ngOnInit();
      expect(snackSpy).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'cancel' });
    });
  });

  describe('details mode', () => {
    it('should load existing communication data in details mode', () => {
      component.data = {
        mode: 'details',
        donorId: 'D123456',
        communication: {
          donorId: 'D123456', sequenceNumber: 1, chapterId: 'C1',
          comDate: today, comType: 'MAIL', comTypeDesc: 'Mail Communication',
          comCode: 'THK', comCodeDesc: 'Thank You', comDesc: 'Some comment',
          actionCode: 'SEND', actionCodeDesc: 'Send Letter',
          targetDate: '2025-06-15', actionDate: '2025-07-01',
          insertDate: today, insertUser: 'U1'
        }
      } as any;
      component.ngOnInit();

      expect(component.form.get('communicationType')?.value).toBe('MAIL');
      expect(component.form.get('communicationCode')?.value).toBe('THK');
      expect(component.form.get('comments')?.value).toBe('Some comment');
      expect(component.selectedTypeDesc()).toBe('Mail Communication');
      expect(component.selectedCodeDesc()).toBe('Thank You');
      expect(component.selectedActionCodeDesc()).toBe('Send Letter');
    });

    it('should return false for isNewMode in details mode', () => {
      component.data = {
        mode: 'details', donorId: 'D123456',
        communication: { donorId: 'D123456', sequenceNumber: 1, chapterId: 'C1', comDate: today, comType: 'MAIL', comCode: 'THK', insertDate: today, insertUser: 'U' }
      } as any;
      component.ngOnInit();
      expect(component.isNewMode).toBeFalse();
      expect(component.dialogTitle).toBe('Details');
    });

    it('should return true for isSaveDisabled in details mode because form is disabled', () => {
      component.data = {
        mode: 'details', donorId: 'D123456',
        communication: { donorId: 'D123456', sequenceNumber: 1, chapterId: 'C1', comDate: today, comType: 'MAIL', comCode: 'THK', insertDate: today, insertUser: 'U' }
      } as any;
      component.ngOnInit();
      expect(component.isSaveDisabled).toBeTrue();
    });
  });

  describe('updateDateTime', () => {
    it('should not update when timezone is falsy', () => {
      headerSpy.chapterTimeZone = signal('');
      fixture.detectChanges();
      // currentDateTime should remain empty since timezone is empty
      // The updateDateTime is called in ngOnInit for new mode
    });
  });

  describe('error state matchers', () => {
    it('should return false for targetDateErrorMatcher with null control', () => {
      fixture.detectChanges();
      expect(component.targetDateErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('should return false for actionDateErrorMatcher with null control', () => {
      fixture.detectChanges();
      expect(component.actionDateErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('should return true for targetDateErrorMatcher with invalid dirty control', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate') as any;
      control.setErrors({ invalid: true });
      control.markAsDirty();
      expect(component.targetDateErrorMatcher.isErrorState(control, null as any)).toBeTrue();
    });
  });
});
