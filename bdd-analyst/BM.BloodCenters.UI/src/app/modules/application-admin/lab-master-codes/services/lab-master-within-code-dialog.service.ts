import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { 
  AddEditLabMasterWithinCode, 
  LabMasterCodeDialogData, 
  LabMasterCodeDialogResult 
} from '../add-edit-lab-master-within-code/add-edit-lab-master-within-code';
import { LabMasterWithinCodeApiService } from './lab-master-within-code-api.service';
import { CreateLabMasterCodeDto, UpdateLabMasterCodeDto, LabMasterCode } from '../models/lab-master-within-code.models';

@Injectable({
  providedIn: 'root'
})
export class LabMasterWithinCodeDialogService {

  constructor(
    private dialog: MatDialog,
    private apiService: LabMasterWithinCodeApiService,
    private snackBar: MatSnackBar
  ) {}

  openAddCodeDialog(codeType: string, codeTypeDescription?: string): Observable<LabMasterCodeDialogResult | undefined> {
    const dialogRef = this.dialog.open(AddEditLabMasterWithinCode, {
      width: '745px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        mode: 'add',
        codeType: codeType,
        codeTypeDescription: codeTypeDescription
      } as LabMasterCodeDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '0' },
      hasBackdrop: true,
      autoFocus: false
    });

    return new Observable(observer => {
      dialogRef.afterClosed().subscribe((result: LabMasterCodeDialogResult) => {
        if (result) {
          // Call API to create the code
          const createDto: CreateLabMasterCodeDto = {
            codeType: result.codeType,
            code: result.code,
            description: result.description,
            effectiveDate: result.effectiveDate,
            terminationDate: result.terminationDate,
            sequence1: result.sequence1,
            sequence2: result.sequence2,
            sequence3: result.sequence3,
            numericalValue: result.numericalValue,
          };

          this.apiService.createCode(createDto).subscribe({
            next: () => {
              this.snackBar.open(
                `New Code ${result.code} has been successfully added to ${result.codeType}.`,
                'DISMISS',
                {
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['success-snackbar']
                }
              );
              observer.next(result);
              observer.complete();
            },
            error: (error) => {
              console.error('Error creating code:', error);
              observer.error(error);
            }
          });
        } else {
          observer.complete();
        }
      });
    });
  }

  openEditCodeDialog(codeType: string, code: string, codeTypeDescription?: string): Observable<LabMasterCodeDialogResult | undefined> {
    return new Observable(observer => {
      this.apiService.getCodeForEdit(codeType, code).subscribe({
        next: (editData) => {
          const dialogRef = this.dialog.open(AddEditLabMasterWithinCode, {
            width: '745px',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            data: {
              mode: 'edit',
              codeType: editData.codeType,
              codeTypeDescription: codeTypeDescription,
              code: editData.code,
              description: editData.description,
              effectiveDate: editData.effectiveDate,
              terminationDate: editData.terminationDate,
              modificationDate: editData.modificationDate,
              numericalValue: editData.numericalValue,
              sequence1: editData.sequence1,
              sequence2: editData.sequence2,
              sequence3: editData.sequence3
            } as LabMasterCodeDialogData,
            disableClose: false,
            panelClass: 'code-dialog-panel-right',
            position: { right: '0', top: '0' },
            hasBackdrop: true,
            autoFocus: false
          });

          dialogRef.afterClosed().subscribe((result: LabMasterCodeDialogResult) => {
            if (result) {
              const updateDto: UpdateLabMasterCodeDto = {
                description: result.description,
                effectiveDate: result.effectiveDate,
                terminationDate: result.terminationDate
              };

              this.apiService.updateCode(codeType, code, updateDto).subscribe({
                next: () => {
                  this.snackBar.open(
                    `Code ${result.code} has been successfully updated.`,
                    'DISMISS',
                    {
                      horizontalPosition: 'end',
                      verticalPosition: 'top',
                      panelClass: ['success-snackbar']
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
          console.error('Error loading code for edit:', error);
          observer.error(error);
        }
      });
    });
  }

  openEditCodeDialogWithData(labMasterCode: LabMasterCode): Observable<LabMasterCodeDialogResult | undefined> {
    const dialogRef = this.dialog.open(AddEditLabMasterWithinCode, {
      width: '745px',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        mode: 'edit',
        codeType: labMasterCode.codeType,
        codeTypeDescription: labMasterCode.codeTypeDescription,
        code: labMasterCode.code,
        description: labMasterCode.description,
        effectiveDate: labMasterCode.effectiveDate,
        terminationDate: labMasterCode.terminationDate,
        modificationDate: labMasterCode.modificationDate,
        numericalValue: labMasterCode.numericalValue,
        sequence1: labMasterCode.sequence1,
        sequence2: labMasterCode.sequence2,
        sequence3: labMasterCode.sequence3
      } as LabMasterCodeDialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '0' },
      hasBackdrop: true,
      autoFocus: false
    });

    return new Observable(observer => {
      dialogRef.afterClosed().subscribe((result: LabMasterCodeDialogResult) => {
        if (result) {
          const updateDto: UpdateLabMasterCodeDto = {
            description: result.description,
            effectiveDate: result.effectiveDate,
            terminationDate: result.terminationDate
          };

          this.apiService.updateCode(
            labMasterCode.codeType,
            labMasterCode.code,
            updateDto
          ).subscribe({
            next: () => {
              this.snackBar.open(
                `Code ${result.code} has been successfully updated.`,
                'DISMISS',
                {
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['success-snackbar']
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

}