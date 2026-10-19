import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from './error-dialog.component';

describe('ErrorDialogComponent', () => {
  let component: ErrorDialogComponent;
  let fixture: ComponentFixture<ErrorDialogComponent>;
  let dialogRefSpy: jest.Mocked<MatDialogRef<ErrorDialogComponent>>;

  function createComponent(data: ErrorDialogData) {
    dialogRefSpy = { close: jest.fn() } as any;

    TestBed.configureTestingModule({
      imports: [ErrorDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent({ message: 'Test error' });
    expect(component).toBeTruthy();
  });

  describe('title', () => {
    it('should display default title "Error" when no title provided', () => {
      createComponent({ message: 'Something went wrong' });
      const titleEl = fixture.nativeElement.querySelector('.error-dialog__title');
      expect(titleEl.textContent).toContain('Error');
    });

    it('should display custom title when provided', () => {
      createComponent({ message: 'Msg', title: 'Custom Title' });
      const titleEl = fixture.nativeElement.querySelector('.error-dialog__title');
      expect(titleEl.textContent).toContain('Custom Title');
    });
  });

  describe('message', () => {
    it('should display the error message', () => {
      createComponent({ message: 'Something went wrong' });
      const content = fixture.nativeElement.querySelector('.error-dialog__message');
      expect(content.textContent).toContain('Something went wrong');
    });
  });

  describe('close button', () => {
    it('should have a CLOSE button', () => {
      createComponent({ message: 'Test' });
      const button = fixture.nativeElement.querySelector('button');
      expect(button.textContent).toContain('CLOSE');
    });

    it('should close the dialog on button click', () => {
      createComponent({ message: 'Test' });
      const button = fixture.nativeElement.querySelector('button');
      button.click();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should close the dialog via onClose method', () => {
      createComponent({ message: 'Test' });
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });
});
