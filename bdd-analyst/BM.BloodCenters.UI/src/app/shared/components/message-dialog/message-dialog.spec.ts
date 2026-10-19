import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageDialog } from './message-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { MessageDialogData } from '../../interfaces/auth.interface';

describe('MessageDialog', () => {
  let component: MessageDialog;
  let fixture: ComponentFixture<MessageDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<MessageDialog>>;

  const mockDialogData: MessageDialogData = {
    title: 'TEST.DIALOG.TITLE',
    message: 'TEST.DIALOG.MESSAGE',
    icon: 'warning',
    params: {},
    primaryAction: {
      label: 'PRIMARY',
      action: 'primary-action'
    },
    secondaryAction: {
      label: 'SECONDARY',
      action: 'secondary-action'
    }
  };
  beforeEach(() => {

    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);


      TestBed.configureTestingModule({
      imports: [
        MessageDialog,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    });

    

      dialogRef.close.calls.reset();


    fixture = TestBed.createComponent(MessageDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });


  it('should render dialog title', () => {
    const title = fixture.debugElement.query(
      By.css('.message-dialog__title')
    ).nativeElement as HTMLElement;

    expect(title).toBeTruthy();
    expect(title.textContent).toContain('TEST.DIALOG.TITLE');
  });
  it('should render dialog message when message is provided', () => {
    const message = fixture.debugElement.query(
      By.css('.message-dialog__content p')
    ).nativeElement as HTMLElement;

    expect(message).toBeTruthy();
    expect(message.textContent).toContain('TEST.DIALOG.MESSAGE');
  });

  it('should render both primary and secondary buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));

    expect(buttons.length).toBe(2);
    expect(buttons[0].nativeElement.textContent).toContain('SECONDARY');
    expect(buttons[1].nativeElement.textContent).toContain('PRIMARY');
  });

  it('should render only primary button when no secondary action provided', () => {
    component.data = {
      ...mockDialogData,
      secondaryAction: undefined
    };
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(1);
    expect(buttons[0].nativeElement.textContent).toContain('PRIMARY');
  });




 

  it('should return correct icon for error', () => {
    component.data.icon = 'error';
    expect(component.iconName).toBe('error_outline');
  });
  it('should return correct icon for success', () => {
    component.data.icon = 'success';
    expect(component.iconName).toBe('check_circle_outline');
  });

  it('should return default icon when icon type is unknown', () => {
    component.data.icon = 'info' as any;
    expect(component.iconName).toBe('info_outline');
  });




});
