import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  DoubleEntryDialogComponent,
  DoubleEntryDialogData,
} from './double-entry-dialog';
import moment from 'moment';

describe('DoubleEntryDialogComponent', () => {
  let component: DoubleEntryDialogComponent;
  let fixture: ComponentFixture<DoubleEntryDialogComponent>;

  const mockDialogRef = { close: jest.fn() };

  function setupTestBed(data: DoubleEntryDialogData): void {
    TestBed.configureTestingModule({
      imports: [DoubleEntryDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(DoubleEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => jest.clearAllMocks());
  afterEach(() => TestBed.resetTestingModule());

  describe('Initialization', () => {
    it('should create with both requirements', () => {
      setupTestBed({
        requireLastName: true,
        requireDob: true,
        originalLastName: 'DOE',
        originalDob: '1990-01-15',
      });
      expect(component).toBeTruthy();
    });

    it('should require lastName when requireLastName is true', () => {
      setupTestBed({
        requireLastName: true,
        requireDob: false,
        originalLastName: 'DOE',
        originalDob: '',
      });
      expect(component.verifyForm.get('lastName')?.hasError('required')).toBe(true);
    });

    it('should not require lastName when requireLastName is false', () => {
      setupTestBed({
        requireLastName: false,
        requireDob: true,
        originalLastName: '',
        originalDob: '1990-01-15',
      });
      component.verifyForm.get('lastName')?.setValue('');
      expect(component.verifyForm.get('lastName')?.valid).toBe(true);
    });

    it('should require dateOfBirth when requireDob is true', () => {
      setupTestBed({
        requireLastName: false,
        requireDob: true,
        originalLastName: '',
        originalDob: '1990-01-15',
      });
      expect(component.verifyForm.get('dateOfBirth')?.hasError('required')).toBe(true);
    });

    it('should not require dateOfBirth when requireDob is false', () => {
      setupTestBed({
        requireLastName: true,
        requireDob: false,
        originalLastName: 'DOE',
        originalDob: '',
      });
      expect(component.verifyForm.get('dateOfBirth')?.valid).toBe(true);
    });

    it('should initialize errorMessage as empty', () => {
      setupTestBed({
        requireLastName: true,
        requireDob: true,
        originalLastName: 'DOE',
        originalDob: '1990-01-15',
      });
      expect(component.errorMessage).toBe('');
    });
  });

  describe('onVerify - lastName only', () => {
    const data: DoubleEntryDialogData = {
      requireLastName: true,
      requireDob: false,
      originalLastName: 'DOE',
      originalDob: '',
    };

    it('should close with true when lastName matches (case insensitive)', () => {
      setupTestBed(data);
      component.verifyForm.patchValue({ lastName: 'doe' });
      component.onVerify();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should close with true when lastName matches with extra spaces', () => {
      setupTestBed(data);
      component.verifyForm.patchValue({ lastName: '  DOE  ' });
      component.onVerify();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should show error when lastName does not match', () => {
      setupTestBed(data);
      component.verifyForm.patchValue({ lastName: 'SMITH' });
      component.onVerify();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('Entered values do not match. Please re-enter.');
    });

    it('should not verify when form is invalid (empty lastName)', () => {
      setupTestBed(data);
      component.onVerify();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('');
    });
  });

  describe('onVerify - DOB only', () => {
    const data: DoubleEntryDialogData = {
      requireLastName: false,
      requireDob: true,
      originalLastName: '',
      originalDob: '1990-01-15',
    };

    it('should close with true when DOB matches', () => {
      setupTestBed(data);
      component.verifyForm.patchValue({ dateOfBirth: moment('1990-01-15') });
      component.onVerify();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should show error when DOB does not match', () => {
      setupTestBed(data);
      component.verifyForm.patchValue({ dateOfBirth: moment('2000-06-20') });
      component.onVerify();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('Entered values do not match. Please re-enter.');
    });
  });

  describe('onVerify - both lastName and DOB', () => {
    const data: DoubleEntryDialogData = {
      requireLastName: true,
      requireDob: true,
      originalLastName: 'DOE',
      originalDob: '1990-01-15',
    };

    it('should close with true when both match', () => {
      setupTestBed(data);
      component.verifyForm.patchValue({
        lastName: 'DOE',
        dateOfBirth: moment('1990-01-15'),
      });
      component.onVerify();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should show error when lastName matches but DOB does not', () => {
      setupTestBed(data);
      component.verifyForm.patchValue({
        lastName: 'DOE',
        dateOfBirth: moment('2000-01-01'),
      });
      component.onVerify();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.errorMessage).toContain('do not match');
    });

    it('should show error when DOB matches but lastName does not', () => {
      setupTestBed(data);
      component.verifyForm.patchValue({
        lastName: 'SMITH',
        dateOfBirth: moment('1990-01-15'),
      });
      component.onVerify();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.errorMessage).toContain('do not match');
    });

    it('should show error when neither matches', () => {
      setupTestBed(data);
      component.verifyForm.patchValue({
        lastName: 'SMITH',
        dateOfBirth: moment('2000-01-01'),
      });
      component.onVerify();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('onVerify - edge cases', () => {
    it('should handle null lastName gracefully', () => {
      setupTestBed({
        requireLastName: true,
        requireDob: false,
        originalLastName: 'DOE',
        originalDob: '',
      });
      component.verifyForm.patchValue({ lastName: null });
      component.verifyForm.get('lastName')?.setErrors(null);
      component.onVerify();
      expect(component.errorMessage).toBe('Entered values do not match. Please re-enter.');
    });
  });

  describe('onCancel', () => {
    it('should close dialog with false', () => {
      setupTestBed({
        requireLastName: true,
        requireDob: true,
        originalLastName: 'DOE',
        originalDob: '1990-01-15',
      });
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
