import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { HlaGradingDialogService } from './hla-grading-dialog.service';
import { AddEditHlaGrade } from '../add-edit-hla-grade/add-edit-hla-grade';
import { DropdownOption, HlaGradingModel, HlaGradingDialogData, HlaGradingDialogResult } from '../models/hla-grading.model';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('HlaGradingDialogService', () => {
  let service: HlaGradingDialogService;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditHlaGrade>>;

  const mockGradeOptions: DropdownOption[] = [
    { key: 'C3X', value: 'Grade C3X' }
  ];

  const mockHlaCodeOptions: DropdownOption[] = [
    { key: 'I', value: 'Code I' },
    { key: 'U', value: 'Code U' }
  ];

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of({ success: true } as HlaGradingDialogResult));

    dialogSpy = createMockMatDialog();
    dialogSpy.open.and.returnValue(dialogRefSpy);

        service = new HlaGradingDialogService(dialogSpy as any);
  });

  describe('openAddDialog', () => {

    it('should pass correct dialog data for add mode', () => {
      service.openAddDialog(mockGradeOptions, mockHlaCodeOptions, 10).subscribe();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data as HlaGradingDialogData;
      expect(dialogData.mode).toBe('add');
      expect(dialogData.gradeOptions).toEqual(mockGradeOptions);
      expect(dialogData.hlaCodeOptions).toEqual(mockHlaCodeOptions);
      expect(dialogData.nextGradeId).toBe(10);
    });

    it('should return true when dialog closes with success', () => {
      dialogRefSpy.afterClosed.and.returnValue(of({ success: true }));

      service.openAddDialog(mockGradeOptions, mockHlaCodeOptions, 10).subscribe(result => {
        expect(result).toBeTrue();
      });
    });

    it('should return false when dialog closes without success', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));

      service.openAddDialog(mockGradeOptions, mockHlaCodeOptions, 10).subscribe(result => {
        expect(result).toBeFalse();
      });
    });

    it('should return false when dialog closes with success false', () => {
      dialogRefSpy.afterClosed.and.returnValue(of({ success: false }));

      service.openAddDialog(mockGradeOptions, mockHlaCodeOptions, 10).subscribe(result => {
        expect(result).toBeFalse();
      });
    });
  });

  describe('openEditDialog', () => {
    const mockRecord: HlaGradingModel = {
      gradeId: 5,
      grade: 'C3X',
      a1: 'I',
      a2: 'I',
      b1: 'I',
      b2: 'I',
      gradeLevel: 1,
      effectiveDate: '2024-01-01',
      terminationDate: null,
      totalCount: 10,
      maxGradeId: 5
    };


    it('should pass correct dialog data for edit mode', () => {
      service.openEditDialog(mockRecord, mockGradeOptions, mockHlaCodeOptions).subscribe();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data as HlaGradingDialogData;
      expect(dialogData.mode).toBe('edit');
      expect(dialogData.record).toEqual(mockRecord);
      expect(dialogData.nextGradeId).toBe(mockRecord.gradeId);
      expect(dialogData.gradeOptions).toEqual(mockGradeOptions);
      expect(dialogData.hlaCodeOptions).toEqual(mockHlaCodeOptions);
    });

    it('should return true when dialog closes with success', () => {
      dialogRefSpy.afterClosed.and.returnValue(of({ success: true }));

      service.openEditDialog(mockRecord, mockGradeOptions, mockHlaCodeOptions).subscribe(result => {
        expect(result).toBeTrue();
      });
    });

    it('should return false when dialog is cancelled', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));

      service.openEditDialog(mockRecord, mockGradeOptions, mockHlaCodeOptions).subscribe(result => {
        expect(result).toBeFalse();
      });
    });
  });
});
