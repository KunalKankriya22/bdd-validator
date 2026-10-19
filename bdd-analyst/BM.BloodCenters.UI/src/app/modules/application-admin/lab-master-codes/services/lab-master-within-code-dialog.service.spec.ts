import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { LabMasterWithinCodeDialogService } from './lab-master-within-code-dialog.service';
import { LabMasterWithinCodeApiService } from './lab-master-within-code-api.service';
import { AddEditLabMasterWithinCode, LabMasterCodeDialogResult } from '../add-edit-lab-master-within-code/add-edit-lab-master-within-code';
import { LabMasterCode } from '../models/lab-master-within-code.models';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('LabMasterWithinCodeDialogService', () => {
    let service: LabMasterWithinCodeDialogService;
    let mockDialog: jasmine.SpyObj<MatDialog>;
    let mockApiService: jasmine.SpyObj<LabMasterWithinCodeApiService>;
    let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditLabMasterWithinCode>>;

    beforeEach(() => {
        mockDialog = createMockMatDialog();
        mockApiService = jasmine.createSpyObj('LabMasterWithinCodeApiService', [
            'createCode',
            'updateCode',
            'getCodeForEdit'
        ]);
        mockSnackBar = createMockMatSnackBar();
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);

                service = new LabMasterWithinCodeDialogService(mockDialog as any, mockApiService as any, mockSnackBar as any);
    });

    describe('openAddCodeDialog()', () => {
        const mockDialogResult: LabMasterCodeDialogResult = {
            codeType: 'TEST',
            code: 'CODE1',
            description: 'Test Description',
            effectiveDate: new Date('2025-01-01'),
            terminationDate: null,
            sequence1: 1,
            sequence2: 2,
            sequence3: 3,
            numericalValue: 100
        };

        beforeEach(() => {
            mockDialog.open.and.returnValue(mockDialogRef);
        });


        it('should call API to create code when user saves', (done) => {
            mockDialogRef.afterClosed.and.returnValue(of(mockDialogResult));
            mockApiService.createCode.and.returnValue(of(undefined));

            service.openAddCodeDialog('TEST').subscribe({
                next: (result) => {
                    expect(mockApiService.createCode).toHaveBeenCalledWith(
                        jasmine.objectContaining({
                            codeType: 'TEST',
                            code: 'CODE1',
                            description: 'Test Description',
                            effectiveDate: jasmine.any(Date),
                            terminationDate: null,
                            sequence1: 1,
                            sequence2: 2,
                            sequence3: 3,
                            numericalValue: 100
                        })
                    );
                    expect(result).toEqual(mockDialogResult);
                    done();
                }
            });
        });


        it('should not call API when user cancels dialog', (done) => {
            mockDialogRef.afterClosed.and.returnValue(of(undefined));

            service.openAddCodeDialog('TEST').subscribe({
                complete: () => {
                    expect(mockApiService.createCode).not.toHaveBeenCalled();
                    expect(mockSnackBar.open).not.toHaveBeenCalled();
                    done();
                }
            });
        });
    });

    describe('openEditCodeDialog()', () => {
        const mockEditResponse = {
            codeType: 'TEST',
            code: 'CODE1',
            description: 'Test Description',
            effectiveDate: new Date('2025-01-01'),
            terminationDate: null,
            sequence1: 1,
            sequence2: 2,
            sequence3: 3,
            numericalValue: 100,
            modificationDate: new Date('2025-01-20')
        };

        const mockDialogResult: LabMasterCodeDialogResult = {
            codeType: 'TEST',
            code: 'CODE1',
            description: 'Updated Description',
            effectiveDate: new Date('2025-02-01'),
            terminationDate: new Date('2025-12-31'),
            sequence1: 1,
            sequence2: 2,
            sequence3: 3,
            numericalValue: 100
        };

        beforeEach(() => {
            mockDialog.open.and.returnValue(mockDialogRef);
        });

        it('should fetch code details from API before opening dialog', (done) => {
            mockApiService.getCodeForEdit.and.returnValue(of(mockEditResponse));
            mockDialogRef.afterClosed.and.returnValue(of(undefined));

            service.openEditCodeDialog('TEST', 'CODE1').subscribe({
                complete: () => {
                    expect(mockApiService.getCodeForEdit).toHaveBeenCalledWith('TEST', 'CODE1');
                    done();
                }
            });
        });


        it('should call API to update code when user saves', (done) => {
            mockApiService.getCodeForEdit.and.returnValue(of(mockEditResponse));
            mockDialogRef.afterClosed.and.returnValue(of(mockDialogResult));
            mockApiService.updateCode.and.returnValue(of(undefined));

            service.openEditCodeDialog('TEST', 'CODE1').subscribe({
                next: (result) => {
                    expect(mockApiService.updateCode).toHaveBeenCalledWith(
                        'TEST',
                        'CODE1',
                        jasmine.objectContaining({
                            description: 'Updated Description',
                            effectiveDate: jasmine.any(Date),
                            terminationDate: jasmine.any(Date)
                        })
                    );
                    expect(result).toEqual(mockDialogResult);
                    done();
                }
            });
        });


    });

    describe('openEditCodeDialogWithData()', () => {
        const mockLabMasterCode: LabMasterCode = {
            codeType: 'TEST',
            codeTypeDescription: 'ABO/Rh Values',
            code: 'CODE1',
            description: 'Test Description',
            effectiveDate: new Date('2025-01-01'),
            terminationDate: null,
            sequence1: 1,
            sequence2: 2,
            sequence3: 3,
            numericalValue: 100,
            modificationDate: new Date('2025-01-20')
        };

        const mockDialogResult: LabMasterCodeDialogResult = {
            codeType: 'TEST',
            code: 'CODE1',
            description: 'Updated Description',
            effectiveDate: new Date('2025-02-01'),
            terminationDate: new Date('2025-12-31'),
            sequence1: 1,
            sequence2: 2,
            sequence3: 3,
            numericalValue: 100
        };

        beforeEach(() => {
            mockDialog.open.and.returnValue(mockDialogRef);
        });


        it('should call API to update code when user saves', (done) => {
            mockDialogRef.afterClosed.and.returnValue(of(mockDialogResult));
            mockApiService.updateCode.and.returnValue(of(undefined));

            service.openEditCodeDialogWithData(mockLabMasterCode).subscribe({
                next: (result) => {
                    expect(mockApiService.updateCode).toHaveBeenCalledWith(
                        'TEST',
                        'CODE1',
                        jasmine.objectContaining({
                            description: 'Updated Description',
                            effectiveDate: jasmine.any(Date),
                            terminationDate: jasmine.any(Date)
                        })
                    );
                    expect(result).toEqual(mockDialogResult);
                    done();
                }
            });
        });



    });

    describe('Dialog Configuration', () => {
        beforeEach(() => {
            mockDialog.open.and.returnValue(mockDialogRef);
        });

        it('should configure dialog with correct dimensions', () => {
            mockDialogRef.afterClosed.and.returnValue(of(undefined));

            service.openAddCodeDialog('TEST').subscribe();

            const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
            expect(dialogConfig?.width).toBe('745px');
            expect(dialogConfig?.height).toBe('100vh');
            expect(dialogConfig?.maxWidth).toBe('100vw');
            expect(dialogConfig?.maxHeight).toBe('100vh');
        });

        it('should position dialog on the right side', () => {
            mockDialogRef.afterClosed.and.returnValue(of(undefined));

            service.openAddCodeDialog('TEST').subscribe();

            const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
            expect(dialogConfig?.position).toEqual({ right: '0', top: '0' });
        });

        it('should apply custom panel class', () => {
            mockDialogRef.afterClosed.and.returnValue(of(undefined));

            service.openAddCodeDialog('TEST').subscribe();

            const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
            expect(dialogConfig?.panelClass).toBe('code-dialog-panel-right');
        });


    });
});