import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { ResetPasswordPreviewComponent } from './reset-password-preview';
import { ResetPasswordService } from './reset-password.service';
import { PasswordResetTimerService } from '@shared/services/password-reset-timer.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ResetPasswordPreviewComponent', () => {
  let component: ResetPasswordPreviewComponent;
  let fixture: ComponentFixture<ResetPasswordPreviewComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ResetPasswordPreviewComponent>>;
  let mockResetPasswordService: jasmine.SpyObj<ResetPasswordService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockPasswordResetTimerService: jasmine.SpyObj<PasswordResetTimerService>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockResetPasswordService = jasmine.createSpyObj('ResetPasswordService', [
      'generateTempPassword',
      'sendTempPassword'
    ]);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockPasswordResetTimerService = jasmine.createSpyObj('PasswordResetTimerService', ['startTimer']);

    // Default mock return value
    mockResetPasswordService.generateTempPassword.and.returnValue(
      of({ success: true, message: 'Success', temporaryPassword: 'TempPass123!' })
    );

    await TestBed.configureTestingModule({
      imports: [ResetPasswordPreviewComponent, BrowserAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { userId: 'testuser', email: 'test@example.com', userFullName: 'Test User' }
        },
        { provide: ResetPasswordService, useValue: mockResetPasswordService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResetPasswordPreviewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize with provided data', () => {
      expect(component.username).toBe('testuser');
      expect(component.userEmail).toBe('test@example.com');
      expect(component.userFullName).toBe('Test User');
    });

    it('should generate password on initialization', () => {
      fixture.detectChanges(); // triggers ngOnInit

      expect(mockResetPasswordService.generateTempPassword).toHaveBeenCalledWith('testuser');
      expect(component.generated).toBe('TempPass123!');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('generatePassword', () => {
    it('should set loading state during password generation', () => {
      fixture.detectChanges();
      expect(component.isLoading()).toBe(false);
    });

    it('should handle successful password generation from server', () => {
      fixture.detectChanges();
      expect(component.generated).toBe('TempPass123!');
      expect(component.isLoading()).toBe(false);
    });

    it('should generate local password with correct character requirements', () => {
      mockResetPasswordService.generateTempPassword.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      const password = component.generated;
      expect(password).toMatch(/[A-Z]/); // has uppercase
      expect(password).toMatch(/[a-z]/); // has lowercase
      expect(password).toMatch(/[0-9]/); // has number
      expect(password).toMatch(/[!@#$%^&*()_+~`|}{[\]:;?><,./-=]/); // has special char
    });
  });

  describe('regenerate', () => {
    it('should call generatePassword when regenerate is clicked', () => {
      mockResetPasswordService.generateTempPassword.and.returnValue(
        of({ success: true, message: 'Success', temporaryPassword: 'NewPass456!' })
      );

      fixture.detectChanges();
      const callCountBefore = mockResetPasswordService.generateTempPassword.calls.count();

      component.regenerate();

      expect(mockResetPasswordService.generateTempPassword.calls.count()).toBe(callCountBefore + 1);
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set isResetting state correctly', () => {
      mockResetPasswordService.sendTempPassword.and.returnValue(
        of({ success: true, message: 'Success' })
      );

      expect(component.isResetting()).toBe(false);
      component.reset();
      expect(component.isResetting()).toBe(false);
    });
  });

  describe('cancel', () => {
    it('should close dialog when cancel is clicked', () => {
      fixture.detectChanges();

      component.cancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should call history.back when not in dialog mode', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ResetPasswordPreviewComponent, BrowserAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: null },
          { provide: MAT_DIALOG_DATA, useValue: { userId: 'testuser', email: 'test@example.com' } },
          { provide: ResetPasswordService, useValue: mockResetPasswordService },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService }
        ]
      }).compileComponents();

      const localFixture = TestBed.createComponent(ResetPasswordPreviewComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      spyOn(history, 'back');
      localComponent.cancel();
      expect(history.back).toHaveBeenCalled();
    });
  });

  describe('onPwdClick', () => {
    it('should set pwdClicked to true and then false after timeout', (done) => {
      fixture.detectChanges();

      expect(component.pwdClicked).toBe(false);
      component.onPwdClick();
      expect(component.pwdClicked).toBe(true);

      setTimeout(() => {
        expect(component.pwdClicked).toBe(false);
        done();
      }, 250);
    });
  });

  describe('Component without dialog data', () => {
    it('should handle missing data gracefully', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ResetPasswordPreviewComponent, BrowserAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: null },
          { provide: ResetPasswordService, useValue: mockResetPasswordService },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService }
        ]
      }).compileComponents();

      const localFixture = TestBed.createComponent(ResetPasswordPreviewComponent);
      const localComponent = localFixture.componentInstance;

      expect(localComponent.username).toBe('');
      expect(localComponent.userEmail).toBe('');
      expect(localComponent.userFullName).toBe('');
    });
  });

  describe('Template bindings', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display username in title', () => {
      const titleElement = fixture.nativeElement.querySelector('.title');
      expect(titleElement.textContent).toContain('Reset Password for testuser');
    });

    it('should display password field with correct value', () => {
      const inputElement = fixture.nativeElement.querySelector('input[type="password"]');
      expect(inputElement.value).toBe('TempPass123!');
    });

    it('should display "Generating..." when loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();
      const inputElement = fixture.nativeElement.querySelector('input[type="password"]');
      expect(inputElement.value).toBe('Generating...');
    });

    it('should display user email', () => {
      const emailElement = fixture.nativeElement.querySelector('.email-title span');
      expect(emailElement.textContent).toContain('Email to: test@example.com');
    });

    it('should display warning when email is missing', () => {
      component.userEmail = '';
      fixture.detectChanges();
      const emailElements = fixture.nativeElement.querySelectorAll('.email-title span');
      expect(emailElements[0].textContent).toContain('No email address on file');
    });

    it('should disable reset button when email is missing', () => {
      component.userEmail = '';
      fixture.detectChanges();
      const resetButton = fixture.nativeElement.querySelector('.btn-reset');
      expect(resetButton.disabled).toBe(true);
    });

    it('should disable reset button when password is not generated', () => {
      component.generated = '';
      fixture.detectChanges();
      const resetButton = fixture.nativeElement.querySelector('.btn-reset');
      expect(resetButton.disabled).toBe(true);
    });

    it('should enable reset button when all conditions are met', () => {
      component.userEmail = 'test@example.com';
      component.generated = 'TempPass123!';
      component.isLoading.set(false);
      component.isResetting.set(false);
      fixture.detectChanges();
      const resetButton = fixture.nativeElement.querySelector('.btn-reset');
      expect(resetButton.disabled).toBe(false);
    });

    it('should show spinner in password field when loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('mat-spinner.loading-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should show regenerate button', () => {
      const regenerateButton = fixture.nativeElement.querySelector('button[aria-label="Regenerate password"]');
      expect(regenerateButton).toBeTruthy();
    });

    it('should disable regenerate button when loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();
      const regenerateButton = fixture.nativeElement.querySelector('button[aria-label="Regenerate password"]');
      expect(regenerateButton.disabled).toBe(true);
    });

    it('should not show visibility toggle button', () => {
      const visibilityButton = fixture.nativeElement.querySelector('button[aria-label="Toggle password visibility"]');
      expect(visibilityButton).toBeFalsy();
    });

    it('should not show copy button', () => {
      const copyButton = fixture.nativeElement.querySelector('button[aria-label="Copy password"]');
      expect(copyButton).toBeFalsy();
    });
  });
});
