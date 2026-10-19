import { of } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ErrorCodeDialogService } from './error-code-dialog.service';
import { AddNewCode } from '../addNewcode/addNewcode';
import { ErrorCode, ErrorType, AuditFlag, TabType } from '../models/error-code.model';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('ErrorCodeDialogService', () => {
  let service: ErrorCodeDialogService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddNewCode>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialog = createMockMatDialog();

    service = new ErrorCodeDialogService(mockDialog as any);
  });

  describe('openEditCodeDialog', () => {
    it('should open dialog in edit mode with error code data', (done) => {
      const element: ErrorCode = {
        errorCode: 'ERR001',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        error: 'Test error',
        auditFlag: AuditFlag.YES
      };

      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openEditCodeDialog(element).subscribe(() => {
        const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
        expect(dialogConfig?.data.mode).toBe('edit');
        expect(dialogConfig?.data.errorCode).toBe('ERR001');
        done();
      });
    });
  });

  describe('openNewCodeDialog', () => {
    it('should open dialog in add mode with tab type', (done) => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));

      service.openNewCodeDialog(TabType.DONOR).subscribe(() => {
        const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
        expect(dialogConfig?.data.mode).toBe('add');
        expect(dialogConfig?.data.tabType).toBe(TabType.DONOR);
        done();
      });
    });
  });
});
