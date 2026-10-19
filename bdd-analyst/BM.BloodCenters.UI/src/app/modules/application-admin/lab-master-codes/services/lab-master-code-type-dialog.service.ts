import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { AddEditLabMasterCodeType, MasterCodeDialogData, CodeDialogResult } from '../add-edit-lab-master-code-type/add-edit-lab-master-code-type';
import { LabMasterCodeTypeApiService } from './lab-master-code-type-api.service';
import {
  CreateLabMasterCodeTypeDto,
  UpdateLabMasterCodeTypeDto,
  LabMasterCodeType
} from '../models/lab-master-code-type.models';

@Injectable({
  providedIn: 'root'
})
export class LabMasterCodeTypeDialogService {

  constructor(
    private dialog: MatDialog,
    private apiService: LabMasterCodeTypeApiService,
    private snackBar: MatSnackBar
  ) { }

  /**
   * Open dialog for adding a new lab master code type
   * Saves to backend when user clicks ADD
   */
  openAddCodeTypeDialog(): Observable<CodeDialogResult | undefined> {
    const dialogRef = this.dialog.open(AddEditLabMasterCodeType, {
      width: '745px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        mode: 'add'
      } as MasterCodeDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '0' },
      hasBackdrop: true
    });

    return new Observable(observer => {
      dialogRef.afterClosed().subscribe((result: CodeDialogResult) => {
        if (result) {
          // Call API to create the code type
          const createDto: CreateLabMasterCodeTypeDto = {
            codeType: result.code,
            description: result.description,
            effectiveDate: result.effectiveDate,
            terminationDate: result.termDate || null
          };

          this.apiService.createCodeType(createDto).subscribe({
            next: () => {
              // Show success message
              this.snackBar.open(
                `New Code ${result.code} has been successfully added.`,
                'DISMISS',
                {
                  duration: 5000,
                  horizontalPosition: 'right',
                  verticalPosition: 'top',
                  panelClass: ['custom-snackbar', 'success-snackbar']
                }
              );
              observer.next(result);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        } else {
          observer.complete();
        }
      });
    });
  }

  /**
   * Open dialog for editing an existing lab master code type
   * Loads data from backend and saves updates
   */
  openEditCodeTypeDialog(codeType: string, code: string): Observable<CodeDialogResult | undefined> {
    // First, fetch the current data from the backend
    return new Observable(observer => {
      this.apiService.getCodeTypeForEdit(codeType).subscribe({
        next: (editData) => {
          const dialogRef = this.dialog.open(AddEditLabMasterCodeType, {
            width: '745px',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            data: {
              mode: 'edit',
              code: editData.code,
              description: editData.description,
              effectiveDate: editData.effectiveDate,
              termDate: editData.terminationDate,
              modificationDate: editData.modificationDate
            } as MasterCodeDialogData,
            disableClose: false,
            panelClass: 'code-dialog-panel-right',
            position: { right: '0', top: '0' },
            hasBackdrop: true
          });

          dialogRef.afterClosed().subscribe((result: CodeDialogResult) => {
            if (result) {
              // Call API to update the code type
              const updateDto: UpdateLabMasterCodeTypeDto = {
                codeType: codeType,
                description: result.description,
                effectiveDate: result.effectiveDate,
                terminationDate: result.termDate || null
              };

              this.apiService.updateCodeType(codeType, updateDto).subscribe({
                next: () => {
                  // Show success message
                  this.snackBar.open(
                    `Code ${result.code} has been successfully updated.`,
                    'DISMISS',
                    {
                      duration: 5000,
                      horizontalPosition: 'right',
                      verticalPosition: 'top',
                      panelClass: ['custom-snackbar', 'success-snackbar']
                    }
                  );
                  observer.next(result);
                  observer.complete();
                },
                error: (error) => {
                  observer.error(error);
                }
              });
            } else {
              observer.complete();
            }
          });
        },
        error: (error) => {
          console.error('Error loading code type for edit:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Alternative method: Open edit dialog with pre-loaded data
   * Useful when editing from a grid where data is already available
   */
  openEditCodeTypeDialogWithData(labMasterCodeType: LabMasterCodeType): Observable<CodeDialogResult | undefined> {
    const dialogRef = this.dialog.open(AddEditLabMasterCodeType, {
      width: '745px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        mode: 'edit',
        code: labMasterCodeType.code,
        description: labMasterCodeType.description,
        effectiveDate: labMasterCodeType.effectiveDate,
        termDate: labMasterCodeType.terminationDate,
        modificationDate: labMasterCodeType.modificationDate
      } as MasterCodeDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '0' },
      hasBackdrop: true
    });

    return new Observable(observer => {
      dialogRef.afterClosed().subscribe((result: CodeDialogResult) => {
        if (result) {
          // Call API to update the code type
          const updateDto: UpdateLabMasterCodeTypeDto = {
            codeType: labMasterCodeType.code,
            description: result.description,
            effectiveDate: result.effectiveDate,
            terminationDate: result.termDate || null
          };

          this.apiService.updateCodeType(
            labMasterCodeType.code,
            updateDto
          ).subscribe({
            next: () => {
              // Show success message
              this.snackBar.open(
                `Code ${result.code} has been successfully updated.`,
                'DISMISS',
                {
                  duration: 5000,
                  horizontalPosition: 'right',
                  verticalPosition: 'top',
                  panelClass: ['custom-snackbar', 'success-snackbar']
                }
              );
              observer.next(result);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        } else {
          observer.complete();
        }
      });
    });
  }

  /**
   * Get user-friendly error message based on error response
   */
  private getErrorMessage(error: any, codeType: string): string {
    // Check for duplicate code (409 status or message containing "already exists")
    if (error.status === 409 || error.message?.toLowerCase().includes('already exists')) {
      return `Code ${codeType} already exists.`;
    }

    // Check for 400 Bad Request
    if (error.status === 400) {
      return error.message || 'Invalid request. Please check your inputs.';
    }

    // Check for 404 Not Found
    if (error.status === 404) {
      return 'Code not found.';
    }

    // Check for 500 Internal Server Error
    if (error.status === 500) {
      return error.message || 'An internal error occurred. Please try again.';
    }

    // For other errors, return custom message or generic message
    return error.message || 'An error occurred. Please try again.';
  }

}