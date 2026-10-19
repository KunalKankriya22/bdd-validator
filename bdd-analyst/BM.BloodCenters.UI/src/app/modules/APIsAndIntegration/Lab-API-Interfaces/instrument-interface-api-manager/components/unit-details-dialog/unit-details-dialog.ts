import { Component, Inject, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { UnitDetail } from '../../models/instrument-interface.model';

@Component({
  selector: 'app-unit-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './unit-details-dialog.html',
  styleUrls: ['./unit-details-dialog.scss'],
})
export class UnitDetailsDialog implements OnInit {
  private instrumentService = inject(InstrumentInterfaceService);

  unitDetails = signal<UnitDetail[]>([]);
  loading = signal<boolean>(false);
  sortDirection = signal<'ASC' | 'DESC' | ''>('ASC');

  displayedColumns: string[] = [
    'unitId',
    'machineTestId',
    'machineResult',
    'ltTestId',
    'ltResult',
    'uploadStatusDescription',
    'fileId',
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { chapterId: string; machineId: string; fileId?: string },
    private dialogRef: MatDialogRef<UnitDetailsDialog>
  ) {}

  ngOnInit(): void {
    this.loadUnitDetails();
  }

  loadUnitDetails(): void {
    this.loading.set(true);
    const sort = this.sortDirection() || undefined;
    this.instrumentService
      .getUnitDetails(this.data.chapterId, this.data.machineId, this.data.fileId, sort)
      .subscribe({
        next: (response) => {
          this.unitDetails.set(response.data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  toggleSort(): void {
    // Cycle through: '' -> ASC -> DESC -> ''
    if (this.sortDirection() === '') {
      this.sortDirection.set('ASC');
    } else if (this.sortDirection() === 'ASC') {
      this.sortDirection.set('DESC');
    } else {
      this.sortDirection.set('');
    }
    this.loadUnitDetails();
  }

  getSortIcon(): string {
    if (this.sortDirection() === '') {
      return 'unfold_more';
    }
    return this.sortDirection() === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Loaded': 'status-loaded',
      'Error': 'status-error',
      'Aborted': 'status-aborted',
      'Pending': 'status-pending',
    };
    return statusMap[status] || 'status-default';
  }

  close(): void {
    this.dialogRef.close();
  }
}
