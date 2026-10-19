import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import {
  CommentsDialog,
  CommentsDialogData,
  CommentsDialogResult,
} from './comments-dialog';

describe('CommentsDialog', () => {
  let dialogRef: any;
  let component: CommentsDialog;
  let fixture: ComponentFixture<CommentsDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CommentsDialog>>;

  const defaultData: CommentsDialogData = {
    title: 'Comments',
    maxLength: 240,
    label: 'Comments',
    placeholder: '',
    submitText: 'SUBMIT',
    cancelText: 'CANCEL',
    required: false,
  };

  beforeEach(() => {

    // Reset defaultData to clean state before each test since tests may mutate it
    Object.assign(defaultData, {
      title: 'Comments',
      maxLength: 240,
      label: 'Comments',
      placeholder: '',
      submitText: 'SUBMIT',
      cancelText: 'CANCEL',
      required: false,
      comment: undefined,
    });

    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [CommentsDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: defaultData },
      ],
    });


    


      dialogRef.close.calls.reset();


    dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<
      MatDialogRef<CommentsDialog>
    >;
    fixture = TestBed.createComponent(CommentsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {


    it('should initialize with default data', () => {
      expect(component.data.title).toBe('Comments');
      expect(component.data.maxLength).toBe(240);
      expect(component.data.required).toBe(false);
    });

    it('should initialize form control with empty value', () => {
      expect(component.commentControl.value).toBe('');
    });

    it('should initialize form control with provided comment', () => {
      defaultData.comment = 'Existing comment';

      const newFixture = TestBed.createComponent(CommentsDialog);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.commentControl.value).toBe('Existing comment');
    });


  });

  describe('Template Rendering', () => {




    it('should display character counter', () => {
      const hintElement = fixture.debugElement.query(By.css('mat-hint'));
      expect(hintElement.nativeElement.textContent).toContain(
        'Characters Remaining: 240/240'
      );
    });

    it('should display submit and cancel buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const submitButton = buttons.find((btn) =>
        btn.nativeElement.textContent.includes('SUBMIT')
      );
      const cancelButton = buttons.find((btn) =>
        btn.nativeElement.textContent.includes('CANCEL')
      );

      expect(submitButton).toBeTruthy();
      expect(cancelButton).toBeTruthy();
    });


  });

  describe('Form Validation', () => {








    it('should update remaining characters correctly', () => {
      expect(component.remainingChars).toBe(240);

      component.commentControl.setValue('Test');
      expect(component.remainingChars).toBe(236);

      component.commentControl.setValue('a'.repeat(100));
      expect(component.remainingChars).toBe(140);
    });
  });
  describe('Error Messages', () => {
    it('should show required error when field is empty and required', () => {
      defaultData.required = true;

      const requiredFixture = TestBed.createComponent(CommentsDialog);
      const requiredComponent = requiredFixture.componentInstance;

      requiredComponent.commentControl.markAsTouched();
      requiredFixture.detectChanges();

      const errorElement = requiredFixture.debugElement.query(
        By.css('mat-error')
      );
      expect(errorElement.nativeElement.textContent).toContain('is required');
    });

    it('should show maxlength error when comment exceeds limit', () => {
      const longComment = 'a'.repeat(241);
      component.commentControl.setValue(longComment);
      component.commentControl.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('mat-error'));
      expect(errorElement.nativeElement.textContent).toContain(
        'Maximum 240 characters allowed'
      );
    });
  });

  describe('Unique Instance IDs', () => {
    it('should generate different IDs for multiple instances', () => {
      const fixture2 = TestBed.createComponent(CommentsDialog);
      const component2 = fixture2.componentInstance;

      expect(component.componentId).not.toBe(component2.componentId);
      expect(component.elementId('comment')).not.toBe(
        component2.elementId('comment')
      );
    });
  });
});
