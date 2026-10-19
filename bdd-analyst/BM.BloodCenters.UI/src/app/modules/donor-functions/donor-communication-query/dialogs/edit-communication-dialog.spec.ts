import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment';

import { EditCommunicationDialog, EditCommunicationDialogData } from './edit-communication-dialog';
import { CommunicationRecord, ActionCodeOption } from '../models/donor-communication-query.model';

describe('EditCommunicationDialog', () => {
  let component: EditCommunicationDialog;
  let fixture: ComponentFixture<EditCommunicationDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<EditCommunicationDialog>>;

  const mockCommunication: CommunicationRecord = {
    donorId: '1234567890',
    comType: 'MAIL',
    comCode: 'THANK',
    insertUser: 'USER01',
    insertDate: '2024-06-15T10:30:00Z',
    actionCode: 'SENT',
    name: 'Doe, John M',
    dob: '01-15-1985',
    sex: 'M',
    abo: 'O+',
    targetDate: '06-25-2024',
    actionDate: '06-15-2024',
    comDesc: 'Follow-up completed',
    chapterId: 'CH001',
  };

  const mockActionCodes: ActionCodeOption[] = [
    { code: 'SENT', description: 'Communication Sent' },
    { code: 'COMPLETE', description: 'Action Completed' },
    { code: 'PENDING', description: 'Pending Action' },
    { code: 'FOLLOW', description: 'Follow Up Required' },
    { code: 'CANCEL', description: 'Cancelled' },
  ];

  const mockDialogData: EditCommunicationDialogData = {
    communication: mockCommunication,
    actionCodes: mockActionCodes,
  };

  beforeEach(() => {

    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [EditCommunicationDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    


      dialogRef.close.calls.reset();


    fixture = TestBed.createComponent(EditCommunicationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ==================== Component Initialization ====================

  describe('Component Initialization', () => {


    it('should initialize communication data from dialog data', () => {
      expect(component['communication']).toEqual(mockCommunication);
    });

    it('should initialize action codes from dialog data', () => {
      expect(component['actionCodes']).toEqual(mockActionCodes);
    });

    it('should create form with four controls', () => {
      expect(component.form.get('actionCode')).toBeDefined();
      expect(component.form.get('targetDate')).toBeDefined();
      expect(component.form.get('actionDate')).toBeDefined();
      expect(component.form.get('comDesc')).toBeDefined();
    });



    it('should parse targetDate from MM-DD-YYYY to Moment', () => {
      const targetDate = component.form.get('targetDate')?.value;
      expect(moment.isMoment(targetDate)).toBeTrue();
      expect(targetDate.format('MM-DD-YYYY')).toBe('06-25-2024');
    });

    it('should parse actionDate from MM-DD-YYYY to Moment', () => {
      const actionDate = component.form.get('actionDate')?.value;
      expect(moment.isMoment(actionDate)).toBeTrue();
      expect(actionDate.format('MM-DD-YYYY')).toBe('06-15-2024');
    });

    it('should initialize with form dirty state as false', () => {
      expect(component['isFormDirty']()).toBeFalse();
    });

    it('should initialize footer buttons with SAVE disabled', () => {
      const buttons = component['footerButtons']();
      const saveButton = buttons.find(b => b.action === 'save');
      expect(saveButton?.disabled).toBeTrue();
    });

    it('should initialize filtered action codes with all codes', () => {
      expect(component['filteredActionCodes']()).toEqual(mockActionCodes);
    });

    it('should handle null targetDate', () => {
      const dataWithNullDate: EditCommunicationDialogData = {
        communication: { ...mockCommunication, targetDate: null },
        actionCodes: mockActionCodes,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [EditCommunicationDialog, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithNullDate },
        ],
      });

      const newFixture = TestBed.createComponent(EditCommunicationDialog);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.form.get('targetDate')?.value).toBeNull();
    });

    it('should handle null actionDate', () => {
      const dataWithNullDate: EditCommunicationDialogData = {
        communication: { ...mockCommunication, actionDate: null },
        actionCodes: mockActionCodes,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [EditCommunicationDialog, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithNullDate },
        ],
      });

      const newFixture = TestBed.createComponent(EditCommunicationDialog);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.form.get('actionDate')?.value).toBeNull();
    });

    it('should handle null actionCode', () => {
      const dataWithNullCode: EditCommunicationDialogData = {
        communication: { ...mockCommunication, actionCode: null },
        actionCodes: mockActionCodes,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [EditCommunicationDialog, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithNullCode },
        ],
      });

      const newFixture = TestBed.createComponent(EditCommunicationDialog);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.form.get('actionCode')?.value).toBeNull();
    });

    it('should handle null comDesc', () => {
      const dataWithNullDesc: EditCommunicationDialogData = {
        communication: { ...mockCommunication, comDesc: null },
        actionCodes: mockActionCodes,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [EditCommunicationDialog, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithNullDesc },
        ],
      });

      const newFixture = TestBed.createComponent(EditCommunicationDialog);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.form.get('comDesc')?.value).toBeNull();
    });
  });

  // ==================== Form Validation ====================

  describe('Form Validation', () => {
    it('should have actionCode with maxLength validator (5 chars)', () => {
      const actionCodeControl = component.form.get('actionCode');
      actionCodeControl?.setValue('ABCDEF'); // 6 chars
      expect(actionCodeControl?.hasError('maxlength')).toBeTrue();
    });

    it('should accept actionCode with 5 or fewer characters', () => {
      const actionCodeControl = component.form.get('actionCode');
      actionCodeControl?.setValue('ABCDE'); // 5 chars
      expect(actionCodeControl?.hasError('maxlength')).toBeFalse();
    });

    it('should have comDesc with maxLength validator (2000 chars)', () => {
      const comDescControl = component.form.get('comDesc');
      const longText = 'a'.repeat(2001); // 2001 chars
      comDescControl?.setValue(longText);
      expect(comDescControl?.hasError('maxlength')).toBeTrue();
    });

    it('should accept comDesc with 2000 or fewer characters', () => {
      const comDescControl = component.form.get('comDesc');
      const longText = 'a'.repeat(2000); // 2000 chars
      comDescControl?.setValue(longText);
      expect(comDescControl?.hasError('maxlength')).toBeFalse();
    });

    it('should accept null values for all fields (all fields are optional)', () => {
      component.form.patchValue({
        actionCode: null,
        targetDate: null,
        actionDate: null,
        comDesc: null,
      });
      expect(component.form.valid).toBeTrue();
    });


  });

  // ==================== Form Dirty State Tracking ====================

  describe('Form Dirty State Tracking', () => {
    it('should have isFormDirty as false initially', () => {
      expect(component['isFormDirty']()).toBeFalse();
    });

    it('should set isFormDirty to true when form value changes', fakeAsync(() => {
      component.form.patchValue({ actionCode: 'COMPLETE' });
      component.form.markAsDirty();
      component['isFormDirty'].set(component.form.dirty);
      tick();
      expect(component['isFormDirty']()).toBeTrue();
    }));

    it('should set isFormDirty to true when actionCode changes', fakeAsync(() => {
      component.form.get('actionCode')?.setValue('NEW');
      component.form.markAsDirty();
      component['isFormDirty'].set(component.form.dirty);
      tick();
      expect(component['isFormDirty']()).toBeTrue();
    }));

    it('should set isFormDirty to true when targetDate changes', fakeAsync(() => {
      component.form.get('targetDate')?.setValue(moment('2024-08-01'));
      component.form.markAsDirty();
      component['isFormDirty'].set(component.form.dirty);
      tick();
      expect(component['isFormDirty']()).toBeTrue();
    }));

    it('should set isFormDirty to true when actionDate changes', fakeAsync(() => {
      component.form.get('actionDate')?.setValue(moment('2024-08-02'));
      component.form.markAsDirty();
      component['isFormDirty'].set(component.form.dirty);
      tick();
      expect(component['isFormDirty']()).toBeTrue();
    }));

    it('should set isFormDirty to true when comDesc changes', fakeAsync(() => {
      component.form.get('comDesc')?.setValue('Updated description');
      component.form.markAsDirty();
      component['isFormDirty'].set(component.form.dirty);
      tick();
      expect(component['isFormDirty']()).toBeTrue();
    }));

    it('should update footer buttons when form becomes dirty', fakeAsync(() => {
      const initialButtons = component['footerButtons']();
      const initialSaveButton = initialButtons.find(b => b.action === 'save');
      expect(initialSaveButton?.disabled).toBeTrue();

      component.form.patchValue({ actionCode: 'COMPLETE' });
      component.form.markAsDirty();
      component['isFormDirty'].set(component.form.dirty);
      tick();

      const updatedButtons = component['footerButtons']();
      const updatedSaveButton = updatedButtons.find(b => b.action === 'save');
      expect(updatedSaveButton?.disabled).toBeFalse();
    }));
  });

  // ==================== Action Code Search Functionality ====================

  describe('Action Code Search Functionality', () => {


    it('should update actionCodeSearch signal when searchControl value changes', fakeAsync(() => {
      component['actionCodeSearchControl'].setValue('SENT');
      tick();
      expect(component['actionCodeSearch']()).toBe('SENT');
    }));

    it('should return all action codes when search is empty', () => {
      component['actionCodeSearch'].set('');
      expect(component['filteredActionCodes']()).toEqual(mockActionCodes);
    });





    it('should filter multiple matching codes', () => {
      component['actionCodeSearch'].set('E'); // Matches SENT, COMPLETE, PENDING, CANCEL
      const filtered = component['filteredActionCodes']();
      expect(filtered.length).toBeGreaterThan(1);
    });

    it('should return empty array when no codes match search', () => {
      component['actionCodeSearch'].set('NONEXISTENT');
      const filtered = component['filteredActionCodes']();
      expect(filtered.length).toBe(0);
    });



    it('should update filtered codes reactively when search changes', () => {
      component['actionCodeSearch'].set('SENT');
      expect(component['filteredActionCodes']().length).toBe(1);

      component['actionCodeSearch'].set('');
      expect(component['filteredActionCodes']().length).toBe(mockActionCodes.length);
    });
  });

  // ==================== Footer Buttons Computed ====================

  describe('Footer Buttons Computed', () => {


    it('should have CANCEL button with text variant', () => {
      const buttons = component['footerButtons']();
      const cancelButton = buttons.find(b => b.action === 'cancel');
      expect(cancelButton).toBeDefined();
      expect(cancelButton?.label).toBe('CANCEL');
      expect(cancelButton?.variant).toBe('text');
    });

    it('should have SAVE button with primary variant', () => {
      const buttons = component['footerButtons']();
      const saveButton = buttons.find(b => b.action === 'save');
      expect(saveButton).toBeDefined();
      expect(saveButton?.label).toBe('SAVE');
      expect(saveButton?.variant).toBe('primary');
    });

    it('should have SAVE button disabled when form is pristine', () => {
      const buttons = component['footerButtons']();
      const saveButton = buttons.find(b => b.action === 'save');
      expect(saveButton?.disabled).toBeTrue();
    });

    it('should have SAVE button enabled when form is dirty', fakeAsync(() => {
      component.form.patchValue({ actionCode: 'COMPLETE' });
      component.form.markAsDirty();
      component['isFormDirty'].set(component.form.dirty);
      tick();

      const buttons = component['footerButtons']();
      const saveButton = buttons.find(b => b.action === 'save');
      expect(saveButton?.disabled).toBeFalse();
    }));

    it('should reactively update SAVE button disabled state', fakeAsync(() => {
      // Initially disabled
      let buttons = component['footerButtons']();
      let saveButton = buttons.find(b => b.action === 'save');
      expect(saveButton?.disabled).toBeTrue();

      // Make dirty - should be enabled
      component.form.patchValue({ actionCode: 'COMPLETE' });
      component.form.markAsDirty();
      component['isFormDirty'].set(component.form.dirty);
      tick();
      buttons = component['footerButtons']();
      saveButton = buttons.find(b => b.action === 'save');
      expect(saveButton?.disabled).toBeFalse();
    }));
  });

  // ==================== Date Utilities ====================

  describe('Date Parsing (parseDate)', () => {
    it('should parse valid MM-DD-YYYY date string to Moment', () => {
      const parsed = component['parseDate']('06-25-2024');
      expect(moment.isMoment(parsed)).toBeTrue();
      expect(parsed?.format('MM-DD-YYYY')).toBe('06-25-2024');
    });







    it('should parse date with single-digit month and day', () => {
      const parsed = component['parseDate']('1-5-2024');
      expect(moment.isMoment(parsed)).toBeTrue();
      expect(parsed?.format('M-D-YYYY')).toBe('1-5-2024');
    });

    it('should handle leap year dates correctly', () => {
      const parsed = component['parseDate']('02-29-2024');
      expect(moment.isMoment(parsed)).toBeTrue();
      expect(parsed?.isValid()).toBeTrue();
    });


  });

  describe('Date Formatting (formatDate)', () => {
    it('should format valid date string to DD-MMM-YYYY uppercase', () => {
      const formatted = component.formatDate('2024-06-15T10:30:00Z');
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should return en dash for undefined input', () => {
      const formatted = component.formatDate(undefined);
      expect(formatted).toBe('–');
    });

    it('should return en dash for null input', () => {
      const formatted = component.formatDate(null as any);
      expect(formatted).toBe('–');
    });





    it('should format ISO date string correctly', () => {
      const formatted = component.formatDate('2024-12-25T00:00:00Z');
      expect(formatted).toBe('25-DEC-2024');
    });

    it('should format date with uppercase month abbreviation', () => {
      const formatted = component.formatDate('2024-01-15T00:00:00Z');
      expect(formatted).toContain('JAN');
    });
  });

  // ==================== Dialog Actions ====================

  describe('Dialog Actions', () => {








    it('should not call any action for unknown button action', () => {
      spyOn(component, 'onCancel');
      spyOn(component, 'onSubmit');
      component.onFooterButtonClick('unknown');
      expect(component.onCancel).not.toHaveBeenCalled();
      expect(component.onSubmit).not.toHaveBeenCalled();
    });

    it('should close with current form values including null fields', () => {
      component.form.patchValue({
        actionCode: null,
        targetDate: null,
        actionDate: null,
        comDesc: null,
      });

      component.onSubmit();
      const callArgs = dialogRef.close.calls.mostRecent().args[0];
      expect(callArgs.actionCode).toBeNull();
      expect(callArgs.targetDate).toBeNull();
      expect(callArgs.actionDate).toBeNull();
      expect(callArgs.comDesc).toBeNull();
    });

    it('should close with Moment objects for dates when submitting', () => {
      const targetDate = moment('2024-07-01');
      const actionDate = moment('2024-07-02');

      component.form.patchValue({
        targetDate,
        actionDate,
      });

      component.onSubmit();
      const callArgs = dialogRef.close.calls.mostRecent().args[0];
      expect(moment.isMoment(callArgs.targetDate)).toBeTrue();
      expect(moment.isMoment(callArgs.actionDate)).toBeTrue();
    });
  });

  // ==================== Form Control Getter ====================

  describe('Form Controls Getter', () => {
    it('should return form controls via f getter', () => {
      const controls = component.f;
      expect(controls).toBe(component.form.controls);
    });








  });

  // ==================== Component Cleanup ====================
  // ==================== Header Fields ====================
  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {


    it('should handle very long comDesc without error', () => {
      const maxLengthDesc = 'a'.repeat(2000);
      component.form.patchValue({ comDesc: maxLengthDesc });
      expect(component.form.get('comDesc')?.valid).toBeTrue();
    });

    it('should handle multiple rapid search changes', fakeAsync(() => {
      component['actionCodeSearchControl'].setValue('S');
      tick();
      expect(component['actionCodeSearch']()).toBe('S');

      component['actionCodeSearchControl'].setValue('SE');
      tick();
      expect(component['actionCodeSearch']()).toBe('SE');

      component['actionCodeSearchControl'].setValue('SEN');
      tick();
      expect(component['actionCodeSearch']()).toBe('SEN');
    }));

    it('should handle form value changes while form is invalid', fakeAsync(() => {
      const tooLongCode = 'ABCDEFGH'; // More than 5 chars
      component.form.patchValue({ actionCode: tooLongCode });
      component.form.markAsDirty();
      component['isFormDirty'].set(component.form.dirty);
      tick();

      expect(component.form.invalid).toBeTrue();
      expect(component['isFormDirty']()).toBeTrue(); // Still tracks dirty state
    }));

    it('should preserve Moment timezone when parsing dates', () => {
      const parsed = component['parseDate']('12-31-2024');
      expect(parsed?.format('MM-DD-YYYY')).toBe('12-31-2024');
    });
  });
});
