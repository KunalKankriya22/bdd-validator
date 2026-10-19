import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { LabMasterCodeTypeDialogService } from './lab-master-code-type-dialog.service';
import { LabMasterCodeTypeApiService } from './lab-master-code-type-api.service';
import { AddEditLabMasterCodeType, CodeDialogResult } from '../add-edit-lab-master-code-type/add-edit-lab-master-code-type';
import { createMockMatDialog, createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  LabMasterCodeType,
  LabMasterCodeTypeEditResponse
} from '../models/lab-master-code-type.models';

describe('LabMasterCodeTypeDialogService - Unit Tests', () => {
  let dialogRefSpy: any;
  let snackBarSpy: any;
  let apiServiceSpy: any;
  let service: LabMasterCodeTypeDialogService;
  let dialog: jasmine.SpyObj<MatDialog>;
  let apiService: jasmine.SpyObj<LabMasterCodeTypeApiService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AddEditLabMasterCodeType>>;

  beforeEach(() => {
    const dialogSpy = createMockMatDialog();
    apiServiceSpy = jasmine.createSpyObj('LabMasterCodeTypeApiService', [
      'createCodeType',
      'updateCodeType',
      'getCodeTypeForEdit'
    ]);
    snackBarSpy = createMockMatSnackBar();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);

    service = new LabMasterCodeTypeDialogService(dialogSpy as any, apiServiceSpy as any, snackBarSpy as any);
    dialog = dialogSpy;
    apiService = apiServiceSpy;
    snackBar = snackBarSpy;
    dialogRef = dialogRefSpy;
  });


  describe('openAddCodeTypeDialog()', () => {
    const dialogResult: CodeDialogResult = {
      code: 'TEST1',
      description: 'Test Description',
      effectiveDate: new Date('2024-01-15'),
      termDate: new Date('2024-12-31')
    };

    beforeEach(() => {
      dialog.open.and.returnValue(dialogRef);
    });

    it('should call API to create code type when dialog returns result', (done) => {
      dialogRef.afterClosed.and.returnValue(of(dialogResult));
      apiService.createCodeType.and.returnValue(of(undefined));

      service.openAddCodeTypeDialog().subscribe(() => {
        expect(apiService.createCodeType).toHaveBeenCalledWith(
          jasmine.objectContaining({
            codeType: 'TEST1',
            description: 'Test Description',
            effectiveDate: dialogResult.effectiveDate,
            terminationDate: dialogResult.termDate
          })
        );
        done();
      });
    });



    it('should complete observable with result after success', (done) => {
      dialogRef.afterClosed.and.returnValue(of(dialogResult));
      apiService.createCodeType.and.returnValue(of(undefined));

      service.openAddCodeTypeDialog().subscribe({
        next: (result) => {
          expect(result).toEqual(dialogResult);
          done();
        }
      });
    });

    it('should not call API when dialog is cancelled', (done) => {
      dialogRef.afterClosed.and.returnValue(of(undefined));

      service.openAddCodeTypeDialog().subscribe({
        complete: () => {
          expect(apiService.createCodeType).not.toHaveBeenCalled();
          expect(snackBar.open).not.toHaveBeenCalled();
          done();
        }
      });
    });

  });

  describe('openEditCodeTypeDialog()', () => {
    const codeType = 'TEST1';
    const code = 'CODE1';
    const editResponse: LabMasterCodeTypeEditResponse = {
      code: 'CODE1',
      description: 'Test Description',
      effectiveDate: new Date('2024-01-15'),
      terminationDate: new Date('2024-12-31'),
      modificationDate: new Date('2024-01-20')
    };

    const dialogResult: CodeDialogResult = {
      code: 'TEST1',
      description: 'Updated Description',
      effectiveDate: new Date('2024-02-15'),
      termDate: new Date('2024-12-31')
    };

    beforeEach(() => {
      dialog.open.and.returnValue(dialogRef);
    });

    it('should call API to update code type when dialog returns result', (done) => {
      apiService.getCodeTypeForEdit.and.returnValue(of(editResponse));
      dialogRef.afterClosed.and.returnValue(of(dialogResult));
      apiService.updateCodeType.and.returnValue(of(undefined));

      service.openEditCodeTypeDialog(codeType, code).subscribe(() => {
        expect(apiService.updateCodeType).toHaveBeenCalledWith(
          codeType,
          jasmine.objectContaining({
            codeType: codeType,
            description: 'Updated Description',
            effectiveDate: dialogResult.effectiveDate,
            terminationDate: dialogResult.termDate
          })
        );
        done();
      });
    });







  });

  describe('openEditCodeTypeDialogWithData()', () => {
    const labMasterCodeType: LabMasterCodeType = {
      code: 'CODE1',
      description: 'Test Description',
      effectiveDate: new Date('2024-01-15'),
      terminationDate: new Date('2024-12-31'),
      status: 'Active',
      modificationDate: new Date('2024-01-20')
    };

    const dialogResult: CodeDialogResult = {
      code: 'CODE1',
      description: 'Updated Description',
      effectiveDate: new Date('2024-02-15'),
      termDate: new Date('2024-12-31')
    };

    beforeEach(() => {
      dialog.open.and.returnValue(dialogRef);
    });

    it('should call update API with correct parameters', (done) => {
      dialogRef.afterClosed.and.returnValue(of(dialogResult));
      apiService.updateCodeType.and.returnValue(of(undefined));

      service.openEditCodeTypeDialogWithData(labMasterCodeType).subscribe(() => {
        expect(apiService.updateCodeType).toHaveBeenCalledWith(
          'CODE1',
          jasmine.objectContaining({
            codeType: 'CODE1',
            description: 'Updated Description',
            effectiveDate: dialogResult.effectiveDate,
            terminationDate: dialogResult.termDate
          })
        );
        done();
      });
    });

    it('should show success message after update', (done) => {
      dialogRef.afterClosed.and.returnValue(of(dialogResult));
      apiService.updateCodeType.and.returnValue(of(undefined));

      service.openEditCodeTypeDialogWithData(labMasterCodeType).subscribe(() => {
        expect(snackBar.open).toHaveBeenCalledWith(
          'Code CODE1 has been successfully updated.',
          'DISMISS',
          jasmine.any(Object)
        );
        done();
      });
    });

  });

  describe('getErrorMessage() - Private Method', () => {
    it('should return duplicate error message for 409 status', () => {
      const error = { status: 409 };
      const errorMessage = (service as any).getErrorMessage(error, 'TEST1');
      expect(errorMessage).toBe('Code TEST1 already exists.');
    });

    it('should return duplicate error for message containing "already exists"', () => {
      const error = { message: 'Code already exists in database' };
      const errorMessage = (service as any).getErrorMessage(error, 'TEST1');
      expect(errorMessage).toBe('Code TEST1 already exists.');
    });

    it('should return custom message for 400 error with message', () => {
      const error = { status: 400, message: 'Invalid date range' };
      const errorMessage = (service as any).getErrorMessage(error, 'TEST1');
      expect(errorMessage).toBe('Invalid date range');
    });

    it('should return default message for 400 error without message', () => {
      const error = { status: 400 };
      const errorMessage = (service as any).getErrorMessage(error, 'TEST1');
      expect(errorMessage).toBe('Invalid request. Please check your inputs.');
    });

    it('should return not found message for 404 error', () => {
      const error = { status: 404 };
      const errorMessage = (service as any).getErrorMessage(error, 'TEST1');
      expect(errorMessage).toBe('Code not found.');
    });

    it('should return custom message for 500 error with message', () => {
      const error = { status: 500, message: 'Database connection failed' };
      const errorMessage = (service as any).getErrorMessage(error, 'TEST1');
      expect(errorMessage).toBe('Database connection failed');
    });

    it('should return default message for 500 error without message', () => {
      const error = { status: 500 };
      const errorMessage = (service as any).getErrorMessage(error, 'TEST1');
      expect(errorMessage).toBe('An internal error occurred. Please try again.');
    });

    it('should return generic error message for unknown status', () => {
      const error = { status: 418, message: 'Teapot error' };
      const errorMessage = (service as any).getErrorMessage(error, 'TEST1');
      expect(errorMessage).toBe('Teapot error');
    });

    it('should return generic message when no error message is provided', () => {
      const error = {};
      const errorMessage = (service as any).getErrorMessage(error, 'TEST1');
      expect(errorMessage).toBe('An error occurred. Please try again.');
    });
  });
});