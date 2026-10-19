import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  DuplicateReasonDialogComponent,
  DuplicateReasonDialogData,
  DuplicateReasonDialogResult,
} from './duplicate-reason-dialog';
import { DuplicateReasonDto, DuplicateUnitDto } from '../models/tubes-check-in.model';

describe('DuplicateReasonDialogComponent', () => {
  let component: DuplicateReasonDialogComponent;
  let fixture: ComponentFixture<DuplicateReasonDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DuplicateReasonDialogComponent>>;

  const mockReasons: DuplicateReasonDto[] = [
    { code: 'RE', description: 'Retest' },
    { code: 'QC', description: 'Quality Control' },
    { code: 'ER', description: 'Error Correction' },
  ];

  const mockDuplicateHistory: DuplicateUnitDto[] = [
    {
      unitId: 'U12345',
      chkDigit: '5',
      receivedDate: '2026-06-02T10:30:00Z',
      contractId: 'C001',
      redTubeFlag: 'Y',
      purpleTubeFlag: 'N',
      serumPlasmaInd: 'S',
    },
    {
      unitId: 'U12345',
      chkDigit: '5',
      receivedDate: '2026-06-06T14:15:00Z',
      contractId: 'C002',
      redTubeFlag: 'Y',
      purpleTubeFlag: 'Y',
      serumPlasmaInd: 'P',
    },
  ];

  const mockData: DuplicateReasonDialogData = {
    unitId: 'U12345',
    osUnitId: '12345',
    errorMessage: 'Unit already checked in',
    duplicateReasons: mockReasons,
    duplicateHistory: mockDuplicateHistory,
  };

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [DuplicateReasonDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    });


    


      mockDialogRef.close.calls.reset();


    fixture = TestBed.createComponent(DuplicateReasonDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should initialize with dialog data', () => {
      expect(component.data).toEqual(mockData);
      expect(component.data.unitId).toBe('U12345');
      expect(component.data.osUnitId).toBe('12345');
      expect(component.data.errorMessage).toBe('Unit already checked in');
    });

    it('should initialize form with required reasonCode field', () => {
      expect(component.reasonForm).toBeDefined();
      expect(component.reasonForm.get('reasonCode')).toBeDefined();
      expect(component.reasonForm.get('reasonCode')?.hasError('required')).toBe(true);
    });

    it('should initialize with null selected reason description', () => {
      expect(component.selectedReasonDescription()).toBeNull();
    });

    it('should have duplicate reasons available', () => {
      expect(component.data.duplicateReasons).toEqual(mockReasons);
      expect(component.data.duplicateReasons.length).toBe(3);
    });

    it('should have duplicate history if provided', () => {
      expect(component.data.duplicateHistory).toEqual(mockDuplicateHistory);
      expect(component.data.duplicateHistory?.length).toBe(2);
    });
  });

  describe('Form Validation', () => {






    it('should set description to null when invalid reason code is selected', () => {
      component.reasonForm.patchValue({ reasonCode: 'INVALID' });
      fixture.detectChanges();
      expect(component.selectedReasonDescription()).toBeNull();
    });

    it('should clear description when reason code is cleared', () => {
      component.reasonForm.patchValue({ reasonCode: 'RE' });
      fixture.detectChanges();
      expect(component.selectedReasonDescription()).toBe('Retest');

      component.reasonForm.patchValue({ reasonCode: null });
      fixture.detectChanges();
      expect(component.selectedReasonDescription()).toBeNull();
    });
  });

  describe('Reason Selection', () => {
    it('should update description for Retest reason', () => {
      component.reasonForm.patchValue({ reasonCode: 'RE' });
      expect(component.selectedReasonDescription()).toBe('Retest');
    });

    it('should update description for Quality Control reason', () => {
      component.reasonForm.patchValue({ reasonCode: 'QC' });
      expect(component.selectedReasonDescription()).toBe('Quality Control');
    });

    it('should update description for Error Correction reason', () => {
      component.reasonForm.patchValue({ reasonCode: 'ER' });
      expect(component.selectedReasonDescription()).toBe('Error Correction');
    });

    it('should handle multiple reason changes', () => {
      component.reasonForm.patchValue({ reasonCode: 'RE' });
      expect(component.selectedReasonDescription()).toBe('Retest');

      component.reasonForm.patchValue({ reasonCode: 'QC' });
      expect(component.selectedReasonDescription()).toBe('Quality Control');

      component.reasonForm.patchValue({ reasonCode: 'ER' });
      expect(component.selectedReasonDescription()).toBe('Error Correction');
    });
  });

  describe('Cancel Action', () => {


    it('should close dialog without reason when cancel is clicked', () => {
      component.reasonForm.patchValue({ reasonCode: 'RE' });
      component.onCancel();

      const result = mockDialogRef.close.calls.argsFor(0)[0] as DuplicateReasonDialogResult;
      expect(result.proceed).toBe(false);
      expect(result.reasonCode).toBeUndefined();
      expect(result.reasonDescription).toBeUndefined();
    });
  });

  describe('Proceed Action', () => {




    it('should include reason code in result when proceeding', () => {
      component.reasonForm.patchValue({ reasonCode: 'RE' });
      component.onProceed();

      const result = mockDialogRef.close.calls.argsFor(0)[0] as DuplicateReasonDialogResult;
      expect(result.reasonCode).toBe('RE');
    });

    it('should include reason description in result when proceeding', () => {
      component.reasonForm.patchValue({ reasonCode: 'RE' });
      component.onProceed();

      const result = mockDialogRef.close.calls.argsFor(0)[0] as DuplicateReasonDialogResult;
      expect(result.reasonDescription).toBe('Retest');
    });

    it('should close with correct result for Quality Control reason', () => {
      component.reasonForm.patchValue({ reasonCode: 'QC' });
      component.onProceed();

      const result = mockDialogRef.close.calls.argsFor(0)[0] as DuplicateReasonDialogResult;
      expect(result.proceed).toBe(true);
      expect(result.reasonCode).toBe('QC');
      expect(result.reasonDescription).toBe('Quality Control');
    });

    it('should close with correct result for Error Correction reason', () => {
      component.reasonForm.patchValue({ reasonCode: 'ER' });
      component.onProceed();

      const result = mockDialogRef.close.calls.argsFor(0)[0] as DuplicateReasonDialogResult;
      expect(result.proceed).toBe(true);
      expect(result.reasonCode).toBe('ER');
      expect(result.reasonDescription).toBe('Error Correction');
    });
  });

  describe('Date Formatting', () => {


    it('should handle single-digit days', () => {
      const formatted = component.formatDate('2026-01-05T10:30:00Z');
      expect(formatted).toBe('05-JAN-2026');
    });

    it('should handle all months correctly', () => {
      const months = [
        { iso: '2026-01-15T00:00:00Z', expected: '15-JAN-2026' },
        { iso: '2026-02-15T00:00:00Z', expected: '15-FEB-2026' },
        { iso: '2026-03-15T00:00:00Z', expected: '15-MAR-2026' },
        { iso: '2026-04-15T00:00:00Z', expected: '15-APR-2026' },
        { iso: '2026-05-15T00:00:00Z', expected: '15-MAY-2026' },
        { iso: '2026-06-15T00:00:00Z', expected: '15-JUN-2026' },
        { iso: '2026-07-15T00:00:00Z', expected: '15-JUL-2026' },
        { iso: '2026-08-15T00:00:00Z', expected: '15-AUG-2026' },
        { iso: '2026-09-15T00:00:00Z', expected: '15-SEP-2026' },
        { iso: '2026-10-15T00:00:00Z', expected: '15-OCT-2026' },
        { iso: '2026-11-15T00:00:00Z', expected: '15-NOV-2026' },
        { iso: '2026-12-15T00:00:00Z', expected: '15-DEC-2026' },
      ];

      months.forEach(({ iso, expected }) => {
        expect(component.formatDate(iso)).toBe(expected);
      });
    });




  });

  describe('Duplicate History', () => {
    it('should display duplicate history when provided', () => {
      expect(component.data.duplicateHistory).toBeDefined();
      expect(component.data.duplicateHistory?.length).toBe(2);
    });



    it('should handle empty duplicate history array', () => {
      const dataWithEmptyHistory: DuplicateReasonDialogData = {
        unitId: 'U12345',
        osUnitId: '12345',
        errorMessage: 'Unit already checked in',
        duplicateReasons: mockReasons,
        duplicateHistory: [],
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DuplicateReasonDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithEmptyHistory },
        ],
      });

      const newFixture = TestBed.createComponent(DuplicateReasonDialogComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.data.duplicateHistory).toEqual([]);
    });
  });

  describe('Error Message Display', () => {
    it('should display provided error message', () => {
      expect(component.data.errorMessage).toBe('Unit already checked in');
    });

    it('should handle different error messages', () => {
      const customData: DuplicateReasonDialogData = {
        unitId: 'U99999',
        osUnitId: '99999',
        errorMessage: 'Duplicate unit detected in Batch B003',
        duplicateReasons: mockReasons,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DuplicateReasonDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: customData },
        ],
      });

      const newFixture = TestBed.createComponent(DuplicateReasonDialogComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.data.errorMessage).toBe('Duplicate unit detected in Batch B003');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty reason list', () => {
      const dataWithNoReasons: DuplicateReasonDialogData = {
        unitId: 'U12345',
        osUnitId: '12345',
        errorMessage: 'Unit already checked in',
        duplicateReasons: [],
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DuplicateReasonDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithNoReasons },
        ],
      });

      const newFixture = TestBed.createComponent(DuplicateReasonDialogComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.data.duplicateReasons).toEqual([]);
    });

    it('should handle very long unit IDs', () => {
      const longUnitId = 'U' + 'X'.repeat(100);
      const dataWithLongId: DuplicateReasonDialogData = {
        unitId: longUnitId,
        osUnitId: longUnitId.substring(1),
        errorMessage: 'Unit already checked in',
        duplicateReasons: mockReasons,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DuplicateReasonDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithLongId },
        ],
      });

      const newFixture = TestBed.createComponent(DuplicateReasonDialogComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.data.unitId).toBe(longUnitId);
    });

    it('should handle very long error messages', () => {
      const longErrorMessage = 'Error: ' + 'X'.repeat(500);
      const dataWithLongError: DuplicateReasonDialogData = {
        unitId: 'U12345',
        osUnitId: '12345',
        errorMessage: longErrorMessage,
        duplicateReasons: mockReasons,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DuplicateReasonDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithLongError },
        ],
      });

      const newFixture = TestBed.createComponent(DuplicateReasonDialogComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.data.errorMessage).toBe(longErrorMessage);
    });

    it('should handle special characters in reason descriptions', () => {
      const specialReasons: DuplicateReasonDto[] = [
        { code: 'SP', description: 'Special & <Characters> "Test"' },
      ];

      const dataWithSpecialChars: DuplicateReasonDialogData = {
        unitId: 'U12345',
        osUnitId: '12345',
        errorMessage: 'Unit already checked in',
        duplicateReasons: specialReasons,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [DuplicateReasonDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithSpecialChars },
        ],
      });

      const newFixture = TestBed.createComponent(DuplicateReasonDialogComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.reasonForm.patchValue({ reasonCode: 'SP' });
      newFixture.detectChanges();

      expect(newComponent.selectedReasonDescription()).toBe('Special & <Characters> "Test"');
    });
  });

  describe('Form Reset Scenarios', () => {


    it('should handle rapid reason changes', () => {
      component.reasonForm.patchValue({ reasonCode: 'RE' });
      component.reasonForm.patchValue({ reasonCode: 'QC' });
      component.reasonForm.patchValue({ reasonCode: 'ER' });
      component.reasonForm.patchValue({ reasonCode: 'RE' });

      expect(component.selectedReasonDescription()).toBe('Retest');
    });

    it('should maintain form validity after multiple changes', () => {
      component.reasonForm.patchValue({ reasonCode: 'RE' });
      expect(component.reasonForm.valid).toBe(true);

      component.reasonForm.patchValue({ reasonCode: null });
      expect(component.reasonForm.valid).toBe(false);

      component.reasonForm.patchValue({ reasonCode: 'QC' });
      expect(component.reasonForm.valid).toBe(true);
    });
  });
});
