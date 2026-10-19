import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MarkNoLetterDialog, MarkNoLetterDialogData } from './mark-no-letter-dialog';

describe('MarkNoLetterDialog', () => {
  let component: MarkNoLetterDialog;
  let fixture: ComponentFixture<MarkNoLetterDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<MarkNoLetterDialog>>;

  const userModeData: MarkNoLetterDialogData = {
    donor: { donorId: 'DN001', donorName: 'Test Donor' },
    mode: 'USER'
  };

  const superModeData: MarkNoLetterDialogData = {
    donor: { donorId: 'DN001', donorName: 'Test Donor' },
    mode: 'SUPER',
    existingUserComment: 'User reason text'
  };

  function createComponent(data: MarkNoLetterDialogData) {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [MarkNoLetterDialog, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarkNoLetterDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('USER mode', () => {
    beforeEach(() => createComponent(userModeData));

    it('should initialize form with user reasons enabled', () => {
      expect(component.form.get('userReasons')?.enabled).toBeTrue();
    });

    it('should initialize form with supervisor comments disabled', () => {
      expect(component.form.get('supervisorComments')?.disabled).toBeTrue();
    });

    it('should have max length 120 for user comments', () => {
      expect(component.userCommentMaxLength).toBe(120);
    });

    it('should have max length 100 for supervisor comments', () => {
      expect(component.supervisorCommentMaxLength).toBe(100);
    });




    it('should be in user mode', () => {
      expect(component.isUserMode).toBeTrue();
      expect(component.isSupervisorMode).toBeFalse();
    });
  });

  describe('SUPER mode', () => {
    beforeEach(() => createComponent(superModeData));

    it('should initialize form with user reasons disabled and pre-filled', () => {
      const ctrl = component.form.get('userReasons');
      expect(ctrl?.disabled).toBeTrue();
      expect(ctrl?.value).toBe('User reason text');
    });

    it('should initialize form with supervisor comments enabled', () => {
      expect(component.form.get('supervisorComments')?.enabled).toBeTrue();
    });


    it('should be in supervisor mode', () => {
      expect(component.isUserMode).toBeFalse();
      expect(component.isSupervisorMode).toBeTrue();
    });
  });
});
