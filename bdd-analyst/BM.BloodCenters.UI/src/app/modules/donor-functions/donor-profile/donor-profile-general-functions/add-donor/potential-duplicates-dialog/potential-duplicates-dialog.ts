import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { FindDonorResult } from '@shared/components/find-donor/find-donor.model';
import moment from 'moment';

export interface PotentialDuplicatesDialogData {
  duplicates: FindDonorResult[];
  donorId: string;
  currentDonor: {
    donorId: string;
    lastName: string;
    firstName: string;
    middleName: string;
    dob: string;
    sex: string;
    aboRh: string;
    address: string;
    phone: string;
  };
}

interface TableRow {
  grade: number | null;
  donorId: string;
  lastName: string;
  firstName: string;
  middleName: string;
  dob: string;
  sex: string;
  aboRh: string;
}

@Component({
  selector: 'app-potential-duplicates-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule],
  templateUrl: './potential-duplicates-dialog.html',
  styleUrls: ['./potential-duplicates-dialog.scss'],
})
export class PotentialDuplicatesDialogComponent {
  readonly data = inject<PotentialDuplicatesDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PotentialDuplicatesDialogComponent>);

  displayedColumns = ['grade', 'donorId', 'lastName', 'firstName', 'middleName', 'dob', 'sex', 'aboRh'];

  get allRows(): TableRow[] {
    const apiRows: TableRow[] = this.data.duplicates.map(d => ({
      grade: d.grade ?? null,
      donorId: d.donorId,
      lastName: d.lastName || '',
      firstName: d.firstName || '',
      middleName: (d.middleName as string) || '',
      dob: d.dob ? moment(d.dob).format('MM-DD-YYYY') : '',
      sex: d.sex || '',
      aboRh: d.aboRh || 'No ABO',
    }));

    const currentRow: TableRow = {
      grade: null,
      donorId: this.data.currentDonor.donorId,
      lastName: this.data.currentDonor.lastName,
      firstName: this.data.currentDonor.firstName,
      middleName: this.data.currentDonor.middleName,
      dob: this.data.currentDonor.dob,
      sex: this.data.currentDonor.sex,
      aboRh: this.data.currentDonor.aboRh || 'No ABO',
    };

    return [...apiRows, currentRow];
  }

  onClose(): void {
    this.dialogRef.close(true);
  }
}
