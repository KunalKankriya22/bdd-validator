import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { WarningDialogComponent, WarningDialogData } from './warning-dialog.component';

describe('WarningDialogComponent', () => {
  let component: WarningDialogComponent;
  let fixture: ComponentFixture<WarningDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<WarningDialogComponent>>;

  const mockData: WarningDialogData = {
    title: 'Unit Validation Warning',
    warnings: [
      { code: '9320', message: 'Unit is NOT checked-in, results will be UNSCHEDULED!!!' },
      { code: '9307', message: 'Unit has already been entered on the worksheet' },
    ],
    allowOverride: true,
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [WarningDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    });

    fixture = TestBed.createComponent(WarningDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have access to dialog data', () => {
    expect(component.data.title).toBe('Unit Validation Warning');
    expect(component.data.warnings.length).toBe(2);
    expect(component.data.allowOverride).toBe(true);
  });

  describe('onProceed', () => {
    it('should close dialog with override true', () => {
      component.onProceed();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ override: true });
    });
  });

  describe('onCancel', () => {
    it('should close dialog with override false', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ override: false });
    });
  });
});

describe('WarningDialogComponent (non-overridable)', () => {
  let component: WarningDialogComponent;
  let fixture: ComponentFixture<WarningDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<WarningDialogComponent>>;

  const mockData: WarningDialogData = {
    title: 'Error',
    warnings: [{ code: '1067', message: 'Results already entered' }],
    allowOverride: false,
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [WarningDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    });

    fixture = TestBed.createComponent(WarningDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have allowOverride set to false', () => {
    expect(component.data.allowOverride).toBe(false);
  });

  it('should close with override false on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ override: false });
  });
});
