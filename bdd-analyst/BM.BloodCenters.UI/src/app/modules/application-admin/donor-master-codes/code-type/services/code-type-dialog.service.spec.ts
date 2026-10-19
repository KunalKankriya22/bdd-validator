import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { CodeTypeDialogService } from './code-type-dialog.service';
import { AddUpdateCodeType, CodeTypeDialogData, CodeTypeDialogResult } from '../add-update-code-type/add-update-code-type';
import { CodeType } from '../../services/donor-master-codes.service';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('CodeTypeDialogService', () => {
  let service: CodeTypeDialogService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddUpdateCodeType>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialog = createMockMatDialog();

        service = new CodeTypeDialogService(mockDialog as any);
  });

  describe('Observable Behavior', () => {
    it('should not emit when dialog is closed without data', (done) => {
      mockDialog.open.and.returnValue(mockDialogRef);
      mockDialogRef.afterClosed.and.returnValue(of(null));

      let emitted = false;
      service.openAddCodeTypeDialog().subscribe({
        next: () => emitted = true,
        complete: () => {
          expect(emitted).toBe(false);
          done();
        }
      });
    });
  });
});
