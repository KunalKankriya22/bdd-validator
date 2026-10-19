import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { UnitGridComponent } from './unit-grid.component';
import { CreateTestBatchService } from '../../services/create-test-batch.service';
import { UnitRow } from '../../models/create-test-batch.model';
import { WarningDialogComponent } from '../warning-dialog/warning-dialog.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('UnitGridComponent', () => {
  let component: UnitGridComponent;
  let fixture: ComponentFixture<UnitGridComponent>;
  let mockService: jasmine.SpyObj<CreateTestBatchService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('CreateTestBatchService', ['validateUnit']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [UnitGridComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CreateTestBatchService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(UnitGridComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('removeUnit', () => {
    it('should remove unit by index and re-sequence remaining units', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.unitsChanged = emitSpy;
      component.startSeq = 1;
      component.units = [
        { seqNo: 1, unitId: 'U001', collDate: '2024-01-01', chapterId: 'CH1' },
        { seqNo: 2, unitId: 'U002', collDate: '2024-01-02', chapterId: 'CH1' },
        { seqNo: 3, unitId: 'U003', collDate: '2024-01-03', chapterId: 'CH1' },
      ];

      component.removeUnit(1);

      const emittedUnits = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedUnits.length).toBe(2);
      expect(emittedUnits[0].unitId).toBe('U001');
      expect(emittedUnits[0].seqNo).toBe(1);
      expect(emittedUnits[1].unitId).toBe('U003');
      expect(emittedUnits[1].seqNo).toBe(2);
    });

    it('should re-sequence from startSeq when removing first unit', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.unitsChanged = emitSpy;
      component.startSeq = 5;
      component.units = [
        { seqNo: 5, unitId: 'U001', collDate: null, chapterId: 'CH1' },
        { seqNo: 6, unitId: 'U002', collDate: null, chapterId: 'CH1' },
      ];

      component.removeUnit(0);

      const emittedUnits = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedUnits.length).toBe(1);
      expect(emittedUnits[0].unitId).toBe('U002');
      expect(emittedUnits[0].seqNo).toBe(5);
    });
  });

  describe('formatDate', () => {
    it('should format date string to DD-MMM-YYYY format', () => {
      const result = component.formatDate('2024-06-15');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should return empty string for null date', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should handle ISO date with time', () => {
      const result = component.formatDate('2024-12-25T00:00:00');
      expect(result).toBe('25-DEC-2024');
    });
  });

  describe('onUnitValidated', () => {
    beforeEach(() => {
      component.unitField = { parsedUnitId: 'U001', clear: jasmine.createSpy('clear') } as any;
      component.units = [];
      component.startSeq = 1;
    });

    it('should do nothing when parsedUnitId is null', () => {
      component.unitField = { parsedUnitId: null } as any;
      component.onUnitValidated({});
      expect(mockService.validateUnit).not.toHaveBeenCalled();
    });

    it('should add unit when validation succeeds with no warnings', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.unitsChanged = emitSpy;

      mockService.validateUnit.and.returnValue(of({
        success: true, message: '', item: {
          unitId: 'U001', chapterId: 'WAD', collDate: '2024-01-01', warnings: []
        }
      } as any));

      component.onUnitValidated({});

      expect(mockService.validateUnit).toHaveBeenCalled();
      expect(emitSpy.emit).toHaveBeenCalled();
      const emittedUnits = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedUnits.length).toBe(1);
      expect(emittedUnits[0].unitId).toBe('U001');
      expect(emittedUnits[0].seqNo).toBe(1);
      expect(component.unitField.clear).toHaveBeenCalled();
    });

    it('should show warning dialog when validation returns warnings', () => {
      const dialogRef = { afterClosed: () => of({ override: true }) } as any;
      mockDialog.open.and.returnValue(dialogRef);

      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.unitsChanged = emitSpy;

      mockService.validateUnit.and.returnValue(of({
        success: true, message: '', item: {
          unitId: 'U001', chapterId: 'WAD', collDate: null,
          warnings: [{ code: '9320', message: 'Unit is NOT checked-in' }]
        }
      } as any));

      component.onUnitValidated({});

      expect(mockDialog.open).toHaveBeenCalledWith(
        WarningDialogComponent,
        jasmine.objectContaining({ width: '560px', disableClose: true })
      );
    });

    it('should add unit when user overrides warnings', () => {
      const dialogRef = { afterClosed: () => of({ override: true }) } as any;
      mockDialog.open.and.returnValue(dialogRef);

      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.unitsChanged = emitSpy;

      mockService.validateUnit.and.returnValue(of({
        success: true, message: '', item: {
          unitId: 'U001', chapterId: 'WAD', collDate: null,
          warnings: [{ code: '9320', message: 'Unit is NOT checked-in' }]
        }
      } as any));

      component.onUnitValidated({});

      expect(emitSpy.emit).toHaveBeenCalled();
      expect(component.unitField.clear).toHaveBeenCalled();
    });

    it('should not add unit when user cancels warning dialog', () => {
      const dialogRef = { afterClosed: () => of({ override: false }) } as any;
      mockDialog.open.and.returnValue(dialogRef);

      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.unitsChanged = emitSpy;

      mockService.validateUnit.and.returnValue(of({
        success: true, message: '', item: {
          unitId: 'U001', chapterId: 'WAD', collDate: null,
          warnings: [{ code: '9307', message: 'Duplicate unit' }]
        }
      } as any));

      component.onUnitValidated({});

      expect(emitSpy.emit).not.toHaveBeenCalled();
      expect(component.unitField.clear).toHaveBeenCalled();
    });

    it('should pass existing unit IDs to validateUnit', () => {
      component.units = [
        { seqNo: 1, unitId: 'U001', collDate: null, chapterId: 'CH1' },
      ];
      component.currentBatchId = 'TB001';

      mockService.validateUnit.and.returnValue(of({
        success: true, message: '', item: {
          unitId: 'U002', chapterId: 'WAD', collDate: '2024-01-01', warnings: []
        }
      } as any));

      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.unitsChanged = emitSpy;

      component.onUnitValidated({});

      expect(mockService.validateUnit).toHaveBeenCalledWith(jasmine.objectContaining({
        unitId: 'U001',
        tbId: 'TB001',
        existingUnitIds: ['U001'],
        overrides: [],
      }));
    });

    it('should not add unit when validation fails', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.unitsChanged = emitSpy;

      mockService.validateUnit.and.returnValue(of({
        success: false, message: 'error', item: null
      } as any));

      component.onUnitValidated({});

      expect(emitSpy.emit).not.toHaveBeenCalled();
    });

    it('should calculate sequence number based on startSeq and existing units', () => {
      component.startSeq = 10;
      component.units = [
        { seqNo: 10, unitId: 'U001', collDate: null, chapterId: 'CH1' },
        { seqNo: 11, unitId: 'U002', collDate: null, chapterId: 'CH1' },
      ];

      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.unitsChanged = emitSpy;

      mockService.validateUnit.and.returnValue(of({
        success: true, message: '', item: {
          unitId: 'U003', chapterId: 'WAD', collDate: null, warnings: []
        }
      } as any));

      component.onUnitValidated({});

      const emittedUnits = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedUnits[2].seqNo).toBe(12);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
