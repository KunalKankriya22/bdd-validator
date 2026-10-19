import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { CodeTypeDialogService } from './code-type-dialog.service';
import { AddEditCodeType, CodeTypeDialogData, CodeTypeDialogResult } from '../add-edit-code-type/add-edit-code-type';
import { MasterCodeDetail } from '../../services/distribution-master-codes.service';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('CodeTypeDialogService', () => {
  let service: CodeTypeDialogService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditCodeType>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialog = createMockMatDialog();

        service = new CodeTypeDialogService(mockDialog as any);
  });

  describe('openAddCodeDialog', () => {
    const mockCodeType = 'APITY';
    const mockCodeTypeDescription = 'Apheresis Incident Type';


    it('should pass correct code type to dialog', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as CodeTypeDialogData;

      expect(dialogData.mode).toBe('add');
      expect(dialogData.codeType).toBe(mockCodeType);
      expect(dialogData.codeTypeDescription).toBe(mockCodeTypeDescription);
    });

    it('should return dialog result when user saves', (done) => {
      const mockResult: CodeTypeDialogResult = {
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Equipment malfunction',
        effectiveDate: '2025-01-11',
        termDate: null,
        numericalValue: 100,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3,
        codeBehavior: 'D'
      };

      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(mockResult));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription).afterClosed().subscribe((result: any) => {
        expect(result).toEqual(mockResult);
        expect(result?.code).toBe('APITY001');
        expect(result?.description).toBe('Equipment malfunction');
        done();
      });
    });


    it('should complete observable when dialog is closed', (done) => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription).afterClosed().subscribe({
        next: () => {},
        complete: () => {
          expect(true).toBe(true);
          done();
        }
      });
    });

    it('should have disableClose set to false', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect(dialogConfig?.disableClose).toBe(false);
    });

    it('should position dialog on the right side', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect(dialogConfig?.position).toEqual({ right: '0', top: '64px' });
    });

    it('should set full viewport height', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect(dialogConfig?.height).toBe('calc(100vh - 64px)');
    });

    it('should set maximum width to 90vw', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect(dialogConfig?.maxWidth).toBe('90vw');
    });

    it('should handle different code types', () => {
      const differentCodeType = 'DONOR';
      const differentDescription = 'Donor Type';
      
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(differentCodeType, differentDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as CodeTypeDialogData;

      expect(dialogData.codeType).toBe(differentCodeType);
      expect(dialogData.codeTypeDescription).toBe(differentDescription);
    });

    it('should handle empty code type description', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, '');
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as CodeTypeDialogData;

      expect(dialogData.codeTypeDescription).toBe('');
    });
  });

  describe('openEditCodeDialog', () => {
    const mockCodeTypeDescription = 'Apheresis Incident Type';
    const mockMasterCodeDetail: MasterCodeDetail = {
      codeType: 'APITY',
      code: 'APITY001',
      description: 'Equipment malfunction',
      effDate: new Date('2025-01-11'),
      termDate: new Date('2025-12-31'),
      lastModifiedDate: new Date('2025-01-15'),
      numberalValue: 100,
      numericalValue: 100,
      sequence1: 1,
      sequence2: 2,
      sequence3: 3,
      changeControlFlag: 'Y',
      auditKey: 12345,
      status: 'Active',
      isActive: true
    };


    it('should pass complete code detail data to dialog', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as CodeTypeDialogData;

      expect(dialogData.mode).toBe('edit');
      expect(dialogData.codeType).toBe('APITY');
      expect(dialogData.code).toBe('APITY001');
      expect(dialogData.description).toBe('Equipment malfunction');
      expect(dialogData.termDate).toEqual(mockMasterCodeDetail.termDate);
      expect(dialogData.modificationDate).toEqual(mockMasterCodeDetail.lastModifiedDate);
      expect(dialogData.numericalValue).toBe(100);
      expect(dialogData.sequence1).toBe(1);
      expect(dialogData.sequence2).toBe(2);
      expect(dialogData.sequence3).toBe(3);
    });

    it('should return dialog result when user saves edits', (done) => {
      const mockResult: CodeTypeDialogResult = {
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Updated Equipment malfunction',
        effectiveDate: '2025-01-11',
        termDate: '2025-12-31',
        numericalValue: 200,
        sequence1: 10,
        sequence2: 20,
        sequence3: 30,
        codeBehavior: 'D'
      };

      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(mockResult));

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription).afterClosed().subscribe((result: any) => {
        expect(result).toEqual(mockResult);
        expect(result?.description).toBe('Updated Equipment malfunction');
        expect(result?.numericalValue).toBe(200);
        done();
      });
    });


    it('should complete observable when edit dialog is closed', (done) => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription).afterClosed().subscribe({
        next: () => {},
        complete: () => {
          expect(true).toBe(true);
          done();
        }
      });
    });



    it('should handle code detail with zero numerical value', () => {
      const codeWithZeroNumValue = { ...mockMasterCodeDetail, numericalValue: 0 };
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openEditCodeDialog(codeWithZeroNumValue, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as CodeTypeDialogData;

      expect(dialogData.numericalValue).toBe(0);
    });

    it('should handle code detail with zero sequence values', () => {
      const codeWithZeroSequences = {
        ...mockMasterCodeDetail,
        sequence1: 0,
        sequence2: 0,
        sequence3: 0
      };
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openEditCodeDialog(codeWithZeroSequences, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as CodeTypeDialogData;

      expect(dialogData.sequence1).toBe(0);
      expect(dialogData.sequence2).toBe(0);
      expect(dialogData.sequence3).toBe(0);
    });


    it('should handle code detail with negative numerical value', () => {
      const codeWithNegativeValue = { ...mockMasterCodeDetail, numericalValue: -50 };
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openEditCodeDialog(codeWithNegativeValue, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as CodeTypeDialogData;

      expect(dialogData.numericalValue).toBe(-50);
    });

    it('should position dialog on the right side', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect(dialogConfig?.position).toEqual({ right: '0', top: '64px' });
    });

    it('should allow dialog to be dismissed', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription);
      mockDialogRef.afterClosed();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect(dialogConfig?.disableClose).toBe(false);
    });
  });

  describe('Dialog Configuration', () => {
    const mockCodeType = 'APITY';
    const mockCodeTypeDescription = 'Apheresis Incident Type';
    const mockMasterCodeDetail: MasterCodeDetail = {
      codeType: 'APITY',
      code: 'APITY001',
      description: 'Equipment malfunction',
      effDate: new Date('2025-01-11'),
      termDate: null,
      lastModifiedDate: new Date('2025-01-15'),
      numberalValue: 0,
      numericalValue: 0,
      sequence1: 0,
      sequence2: 0,
      sequence3: 0,
      changeControlFlag: 'Y',
      auditKey: 12345,
      status: 'Active',
      isActive: true
    };

    it('should use consistent width for both add and edit dialogs', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const addConfig = mockDialog.open.calls.mostRecent().args[1];

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const editConfig = mockDialog.open.calls.mostRecent().args[1];

      expect(addConfig?.width).toBe(editConfig?.width);
      expect(addConfig?.width).toBe('745px');
    });

    it('should use consistent height for both add and edit dialogs', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const addConfig = mockDialog.open.calls.mostRecent().args[1];

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const editConfig = mockDialog.open.calls.mostRecent().args[1];

      expect(addConfig?.height).toBe(editConfig?.height);
      expect(addConfig?.height).toBe('calc(100vh - 64px)');
    });

    it('should use same panel class for both dialogs', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const addConfig = mockDialog.open.calls.mostRecent().args[1];

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const editConfig = mockDialog.open.calls.mostRecent().args[1];

      expect(addConfig?.panelClass).toBe(editConfig?.panelClass);
      expect(addConfig?.panelClass).toBe('right-side-dialog');
    });

    it('should use same position for both dialogs', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const addConfig = mockDialog.open.calls.mostRecent().args[1];

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const editConfig = mockDialog.open.calls.mostRecent().args[1];

      expect(addConfig?.position).toEqual(editConfig?.position);
      expect(addConfig?.position).toEqual({ right: '0', top: '64px' });
    });

    it('should use same maxWidth for both dialogs', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const addConfig = mockDialog.open.calls.mostRecent().args[1];

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const editConfig = mockDialog.open.calls.mostRecent().args[1];

      expect(addConfig?.maxWidth).toBe(editConfig?.maxWidth);
      expect(addConfig?.maxWidth).toBe('90vw');
    });

    it('should use same disableClose setting for both dialogs', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const addConfig = mockDialog.open.calls.mostRecent().args[1];

      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription);
      mockDialogRef.afterClosed();
      const editConfig = mockDialog.open.calls.mostRecent().args[1];

      expect(addConfig?.disableClose).toBe(editConfig?.disableClose);
      expect(addConfig?.disableClose).toBe(false);
    });
  });

  describe('Observable Behavior', () => {
    const mockCodeType = 'APITY';
    const mockCodeTypeDescription = 'Apheresis Incident Type';

    it('should emit result exactly once when add dialog is closed with data', (done) => {
      const mockResult: CodeTypeDialogResult = {
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Test',
        effectiveDate: '2025-01-11',
        termDate: null,
        codeBehavior: 'D'
      };

      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(mockResult));

      let emitCount = 0;
      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription).afterClosed().subscribe({
        next: () => emitCount++,
        complete: () => {
          expect(emitCount).toBe(1);
          done();
        }
      });
    });


    it('should emit result exactly once when edit dialog is closed with data', (done) => {
      const mockMasterCodeDetail: MasterCodeDetail = {
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Equipment malfunction',
        effDate: new Date('2025-01-11'),
        termDate: null,
        lastModifiedDate: new Date('2025-01-15'),
        numberalValue: 100,
        numericalValue: 100,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3,
        changeControlFlag: 'Y',
        auditKey: 12345,
        status: 'Active',
        isActive: true
      };

      const mockResult: CodeTypeDialogResult = {
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Updated',
        effectiveDate: '2025-01-11',
        termDate: null,
        codeBehavior: 'D'
      };

      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(mockResult));

      let emitCount = 0;
      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription).afterClosed().subscribe({
        next: () => emitCount++,
        complete: () => {
          expect(emitCount).toBe(1);
          done();
        }
      });
    });

    it('should complete observable after emitting for add dialog', (done) => {
      const mockResult: CodeTypeDialogResult = {
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Test',
        effectiveDate: '2025-01-11',
        termDate: null,
        codeBehavior: 'D'
      };

      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(mockResult));

      let completed = false;
      service.openAddCodeDialog(mockCodeType, mockCodeTypeDescription).afterClosed().subscribe({
        next: () => {},
        complete: () => {
          completed = true;
          expect(completed).toBe(true);
          done();
        }
      });
    });

    it('should complete observable after emitting for edit dialog', (done) => {
      const mockMasterCodeDetail: MasterCodeDetail = {
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Equipment malfunction',
        effDate: new Date('2025-01-11'),
        termDate: null,
        lastModifiedDate: new Date('2025-01-15'),
        numberalValue: 100,
        numericalValue: 100,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3,
        changeControlFlag: 'Y',
        auditKey: 12345,
        status: 'Active',
        isActive: true
      };

      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      let completed = false;
      service.openEditCodeDialog(mockMasterCodeDetail, mockCodeTypeDescription).afterClosed().subscribe({
        next: () => {},
        complete: () => {
          completed = true;
          expect(completed).toBe(true);
          done();
        }
      });
    });
  });
});