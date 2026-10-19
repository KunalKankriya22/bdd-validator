import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, finalize } from 'rxjs';

import { SnackbarService } from '@shared/services/snackbar.service';
import { AssignReagentsToTestBatchService } from '../services/assign-reagents-to-test-batch.service';
import { TestBatchUnitDto, ViewUnitsDialogData } from '../models/assign-reagents-to-test-batch.model';

@Component({
  selector: 'app-view-units-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './view-units-dialog.html',
  styleUrls: ['./view-units-dialog.scss']
})
export class ViewUnitsDialogComponent implements OnInit, OnDestroy {

  units: TestBatchUnitDto[] = [];
  displayedColumns: string[] = ['tbSeqNo', 'unitId'];
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<ViewUnitsDialogComponent>,
    private service: AssignReagentsToTestBatchService,
    private snackbarService: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: ViewUnitsDialogData
  ) {}

  ngOnInit(): void {
    this.loadUnits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUnits(): void {
    if (!this.data?.testBatchId) {
      return;
    }

    this.isLoading = true;
    this.service.getUnitsInBatch(this.data.testBatchId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.units = response.data;
        },
        error: (err) => {
          this.units = [];
          this.snackbarService.showError(err?.error?.message);
        }
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
