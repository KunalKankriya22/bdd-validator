import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, finalize } from 'rxjs';

import { SnackbarService } from '@shared/services/snackbar.service';
import { AssignReagentsToTestBatchService } from '../services/assign-reagents-to-test-batch.service';
import {
  GenerateWorksheetDialogData,
  GenerateWorksheetDialogResult,
  PrintableTestDto,
  PrinterOption
} from '../models/assign-reagents-to-test-batch.model';

@Component({
  selector: 'app-generate-worksheet-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './generate-worksheet-dialog.html',
  styleUrls: ['./generate-worksheet-dialog.scss']
})
export class GenerateWorksheetDialogComponent implements OnInit, OnDestroy {

  tests: (PrintableTestDto & { selected: boolean })[] = [];
  printers: PrinterOption[] = [];
  printerControl = new FormControl<string | null>(null);
  isSubmitting = false;
  selectAll = false;

  private destroy$ = new Subject<void>();

  constructor(
    private service: AssignReagentsToTestBatchService,
    private snackbarService: SnackbarService,
    private dialogRef: MatDialogRef<GenerateWorksheetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GenerateWorksheetDialogData
  ) {}

  ngOnInit(): void {
    this.tests = (this.data?.printableTests || []).map((t) => ({
      ...t,
      selected: false
    }));
    this.printers = this.data?.printers || [];
    if (this.printers.length > 0) {
      this.printerControl.setValue(this.printers[0].printerId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hasSelection(): boolean {
    return this.tests.some((t) => t.selected);
  }

  get selectedCount(): number {
    return this.tests.filter((t) => t.selected).length;
  }

  get canGenerate(): boolean {
    return this.hasSelection && !!this.printerControl.value;
  }

  onSelectAllChange(): void {
    this.tests.forEach((t) => t.selected = this.selectAll);
  }

  onItemSelectionChange(): void {
    this.selectAll = this.tests.length > 0 && this.tests.every((t) => t.selected);
  }

  onGenerate(): void {
    const selectedTestIds = this.tests
      .filter((t) => t.selected)
      .map((t) => t.testId);

    if (selectedTestIds.length === 0 || !this.printerControl.value) {
      return;
    }

    this.isSubmitting = true;

    this.service.generateWorksheet(this.data.testBatchId, {
      testIds: selectedTestIds,
      printerId: this.printerControl.value
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            const item = response.item;
            this.snackbarService.showSuccess(
              item?.message || `${selectedTestIds.length} worksheet(s) queued for generation`
            );
            const result: GenerateWorksheetDialogResult = { success: true };
            this.dialogRef.close(result);
          } else {
            this.snackbarService.showError(response.message || 'Failed to generate worksheets');
          }
        },
        error: (err) => {
          this.snackbarService.showError(
            err?.error?.message || 'An error occurred while generating worksheets'
          );
        }
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
