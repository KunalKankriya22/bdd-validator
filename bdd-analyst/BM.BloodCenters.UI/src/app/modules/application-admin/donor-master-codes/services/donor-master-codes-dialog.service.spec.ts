import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DonorMasterCodesDialogService } from './donor-master-codes-dialog.service';
import { AddUpdateDonorMasterCodes, MasterCodeDialogData, CodeDialogResult } from '../add-update-donor-master-codes/add-update-donor-master-codes';
import { MasterCode } from './donor-master-codes.service';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('DonorMasterCodesDialogService', () => {
  let service: DonorMasterCodesDialogService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddUpdateDonorMasterCodes>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialog = createMockMatDialog();

        service = new DonorMasterCodesDialogService(mockDialog as any);
  });

  describe('openAddCodeDialog', () => {
    it('should open dialog with mode set to add', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openAddCodeDialog().subscribe();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as MasterCodeDialogData;

      expect(dialogData.mode).toBe('add');
    });

    it('should not pass codeType, code, description, effDate, termDate, or status in add mode', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openAddCodeDialog().subscribe();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as MasterCodeDialogData;

      expect(dialogData.codeType).toBeUndefined();
      expect(dialogData.code).toBeUndefined();
      expect(dialogData.description).toBeUndefined();
      expect(dialogData.effDate).toBeUndefined();
      expect(dialogData.termDate).toBeUndefined();
      expect(dialogData.status).toBeUndefined();
    });

    it('should open dialog with correct dimensions and positioning', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openAddCodeDialog().subscribe();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];

      expect(dialogConfig?.width).toBe('745px');
      expect(dialogConfig?.height).toBe('100vh');
      expect(dialogConfig?.maxWidth).toBe('100vw');
      expect(dialogConfig?.maxHeight).toBe('100vh');
      expect(dialogConfig?.position).toEqual({ right: '0', top: '0' });
    });

    it('should open dialog with backdrop and correct panel class', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openAddCodeDialog().subscribe();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];

      expect(dialogConfig?.hasBackdrop).toBe(true);
      expect(dialogConfig?.disableClose).toBe(false);
      expect(dialogConfig?.panelClass).toBe('code-dialog-panel-right');
    });

    it('should open AddUpdateDonorMasterCodes component', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openAddCodeDialog().subscribe();

      expect(mockDialog.open).toHaveBeenCalledWith(AddUpdateDonorMasterCodes, jasmine.any(Object));
    });

    it('should return dialog result when user saves', (done) => {
      const mockResult: CodeDialogResult = {
        codeType: 'NEWTYPE',
        code: 'NEW001',
        description: 'New Code',
        effDate: '2025-06-01',
        terminationDate: null
      };

      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(mockResult));

      service.openAddCodeDialog().subscribe(result => {
        expect(result).toEqual(mockResult);
        done();
      });
    });

    it('should complete observable without emitting when dialog is cancelled', (done) => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openAddCodeDialog().subscribe({
        next: () => fail('Should not emit when cancelled'),
        complete: () => {
          expect(true).toBe(true);
          done();
        }
      });
    });

    it('should complete observable without emitting when dialog returns undefined', (done) => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeDialog().subscribe({
        next: () => fail('Should not emit when undefined'),
        complete: () => {
          expect(true).toBe(true);
          done();
        }
      });
    });
  });

  describe('openEditCodeDialog', () => {
    const mockMasterCode: MasterCode = {
      id: '1',
      codeType: 'APITY',
      code: 'APITY001',
      description: 'Equipment malfunction',
      effDate: new Date('2025-01-11'),
      termDate: new Date('2025-12-31'),
      status: 'Active',
      isActive: true,
      changeControlFlag: 'N'
    };


    it('should pass master code data to dialog', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openEditCodeDialog(mockMasterCode).subscribe();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as MasterCodeDialogData;

      expect(dialogData.mode).toBe('edit');
      expect(dialogData.codeType).toBe('APITY');
      expect(dialogData.code).toBe('APITY001');
      expect(dialogData.description).toBe('Equipment malfunction');
      expect(dialogData.effDate).toEqual(mockMasterCode.effDate);
      expect(dialogData.termDate).toEqual(mockMasterCode.termDate);
      expect(dialogData.status).toBe('Active');
    });

    it('should return dialog result when user saves edits', (done) => {
      const mockResult: CodeDialogResult = {
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Updated Description',
        effDate: '2025-01-11',
        terminationDate: '2025-12-31'
      };

      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(mockResult));

      service.openEditCodeDialog(mockMasterCode).subscribe(result => {
        expect(result).toEqual(mockResult);
        expect(result.description).toBe('Updated Description');
        done();
      });
    });

    it('should complete observable when edit dialog is cancelled', (done) => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openEditCodeDialog(mockMasterCode).subscribe({
        next: () => fail('Should not emit when cancelled'),
        complete: () => {
          expect(true).toBe(true);
          done();
        }
      });
    });

    it('should position dialog on the right side', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openEditCodeDialog(mockMasterCode).subscribe();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect(dialogConfig?.position).toEqual({ right: '0', top: '0' });
    });

    it('should open AddUpdateDonorMasterCodes component for edit', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openEditCodeDialog(mockMasterCode).subscribe();

      expect(mockDialog.open).toHaveBeenCalledWith(AddUpdateDonorMasterCodes, jasmine.any(Object));
    });

    it('should handle master code with null termDate', () => {
      const codeWithNullTerm: MasterCode = {
        ...mockMasterCode,
        termDate: null
      };

      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openEditCodeDialog(codeWithNullTerm).subscribe();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      const dialogData = dialogConfig?.data as MasterCodeDialogData;

      expect(dialogData.termDate).toBeNull();
    });

  });

  describe('Dialog Configuration', () => {
    it('should use consistent width for both add and edit dialogs', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openAddCodeDialog().subscribe();
      const addConfig = mockDialog.open.calls.mostRecent().args[1];

      const mockMasterCode: MasterCode = {
        id: '1',
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Test',
        effDate: new Date(),
        termDate: null,
        status: 'Active',
        isActive: true,
        changeControlFlag: 'N'
      };

      service.openEditCodeDialog(mockMasterCode).subscribe();
      const editConfig = mockDialog.open.calls.mostRecent().args[1];

      expect(addConfig?.width).toBe(editConfig?.width);
      expect(addConfig?.width).toBe('745px');
    });

    it('should use same panel class for both dialogs', () => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      service.openAddCodeDialog().subscribe();
      const addConfig = mockDialog.open.calls.mostRecent().args[1];

      const mockMasterCode: MasterCode = {
        id: '1',
        codeType: 'APITY',
        code: 'APITY001',
        description: 'Test',
        effDate: new Date(),
        termDate: null,
        status: 'Active',
        isActive: true,
        changeControlFlag: 'N'
      };

      service.openEditCodeDialog(mockMasterCode).subscribe();
      const editConfig = mockDialog.open.calls.mostRecent().args[1];

      expect(addConfig?.panelClass).toBe(editConfig?.panelClass);
      expect(addConfig?.panelClass).toBe('code-dialog-panel-right');
    });
  });
});
