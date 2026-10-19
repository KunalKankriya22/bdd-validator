import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AddEmployerDialog } from '../../../registration/registration-maintenance/maintain-donor-employer/add-employer-dialog/add-employer-dialog';

@Component({
  selector: 'app-add-employer-wrapper-dialog',
  standalone: true,
  imports: [MatDialogModule, AddEmployerDialog],
  template: `<app-add-employer-dialog (save)="onSave($event)" (close)="onClose()"></app-add-employer-dialog>`,
})
export class AddEmployerWrapperDialog {
  private readonly dialogRef = inject(MatDialogRef<AddEmployerWrapperDialog>);

  onSave(result: { message: string; employerId: string; employerName: string }): void {
    this.dialogRef.close(result);
  }

  onClose(): void {
    this.dialogRef.close(null);
  }
}
