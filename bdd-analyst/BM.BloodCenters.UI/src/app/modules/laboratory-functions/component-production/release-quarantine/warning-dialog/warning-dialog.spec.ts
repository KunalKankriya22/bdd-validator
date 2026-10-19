import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { WarningDialogComponent, WarningDialogData } from './warning-dialog';
import { Warning } from '../models/release-quarantine.model';

describe('WarningDialogComponent', () => {
  let component: WarningDialogComponent;
  let fixture: ComponentFixture<WarningDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<WarningDialogComponent>>;

  const mockWarnings: Warning[] = [
    { code: '3722', message: 'Product has active interdiction' },
    { code: 'TRAY_FULL', message: 'Selected tray is full' },
  ];

  const mockDialogData: WarningDialogData = {
    warnings: mockWarnings,
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [WarningDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WarningDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Data Binding', () => {
    it('should receive warnings from injected data', () => {
      expect(component.data.warnings).toEqual(mockWarnings);
      expect(component.data.warnings.length).toBe(2);
    });


  });

  describe('Element ID Generation', () => {
    it('should generate unique component ID', () => {
      expect(component['componentId']).toMatch(/^warning-dialog-\d+$/);
    });

    it('should generate element IDs with component prefix', () => {
      const id = component['elementId']('test');
      expect(id).toContain('warning-dialog-');
      expect(id).toContain('-test');
    });
  });
  describe('onOverride', () => {

    it('should close dialog exactly once', () => {
      component.onOverride();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dialog with single warning', () => {
    beforeEach(async () => {
      const singleWarningData: WarningDialogData = {
        warnings: [{ code: '9930', message: 'Special processing inventory' }],
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [WarningDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: singleWarningData },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(WarningDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should handle single warning', () => {
      expect(component.data.warnings.length).toBe(1);
      expect(component.data.warnings[0].code).toBe('9930');
    });
  });

  describe('onCancel', () => {
    it('should close dialog with cancel result when onCancel is called', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('cancel');
    });
  });

  describe('onOverride result', () => {
    it('should close dialog with override result when onOverride is called', () => {
      component.onOverride();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('override');
    });
  });

  describe('Dialog with multiple warnings', () => {
    beforeEach(async () => {
      const multipleWarningData: WarningDialogData = {
        warnings: [
          { code: '3722', message: 'Product has active interdiction' },
          { code: 'TRAY_FULL', message: 'Selected tray is full' },
          { code: '9930', message: 'Special processing inventory' },
        ],
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [WarningDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: multipleWarningData },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(WarningDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should handle multiple warnings in data', () => {
      expect(component.data.warnings.length).toBe(3);
    });
  });

});
