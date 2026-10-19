import { Component, Inject, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil, filter, switchMap } from 'rxjs/operators';

import { TestBatchDetailsApiService } from '../../services/test-batch-details-api.service';
import { BatchNoteDto } from '../../models/test-batch-details.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { LoggingService } from '@shared/services/logging.service';

export interface BatchNotesDialogData {
  worksheetId: string;
  testId: string;
}

@Component({
  selector: 'app-batch-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './batch-notes-dialog.html',
  styleUrl: './batch-notes-dialog.scss'
})
export class BatchNotesDialog implements OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `batch-notes-dialog-${BatchNotesDialog.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly dialogRef = inject(MatDialogRef<BatchNotesDialog>);
  private readonly apiService = inject(TestBatchDetailsApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly loggingService = inject(LoggingService);
  private readonly destroy$ = new Subject<void>();

  worksheetId: string;
  testId: string;

  loading = signal(false);
  submitting = signal(false);
  notes = signal<BatchNoteDto[]>([]);
  editingAuditKey = signal<number | null>(null);

  addControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  editControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  private readonly monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: BatchNotesDialogData) {
    this.worksheetId = data.worksheetId;
    this.testId = data.testId;
    this.loadNotes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotes(): void {
    this.loading.set(true);
    this.apiService.getNotes(this.worksheetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notes.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.loggingService.error('Error loading batch notes', err);
          this.snackbar.showError('Failed to load notes. Please try again.');
          this.loading.set(false);
        }
      });
  }

  onAddNote(): void {
    this.addControl.markAsTouched();
    if (this.addControl.invalid || this.submitting()) return;

    const noteText = this.addControl.value.trim();
    if (!noteText) {
      this.addControl.setErrors({ required: true });
      return;
    }

    this.submitting.set(true);
    this.apiService.addNote(this.worksheetId, noteText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notes.set(data);
          this.addControl.reset('');
          this.submitting.set(false);
        },
        error: (err) => {
          this.loggingService.error('Error adding batch note', err);
          const message = err?.error?.message || 'Failed to add note. Please try again.';
          this.snackbar.showError(message);
          this.submitting.set(false);
        }
      });
  }

  onStartEdit(note: BatchNoteDto): void {
    this.editingAuditKey.set(note.auditKey);
    this.editControl.reset(note.note);
  }

  onCancelEdit(): void {
    this.editingAuditKey.set(null);
    this.editControl.reset('');
  }

  onSaveEdit(note: BatchNoteDto): void {
    this.editControl.markAsTouched();
    if (this.editControl.invalid || this.submitting()) return;

    const noteText = this.editControl.value.trim();
    if (!noteText) {
      this.editControl.setErrors({ required: true });
      return;
    }

    this.submitting.set(true);
    this.apiService.updateNote(this.worksheetId, note.auditKey, noteText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notes.set(data);
          this.editingAuditKey.set(null);
          this.editControl.reset('');
          this.submitting.set(false);
        },
        error: (err) => {
          this.loggingService.error('Error updating batch note', err);
          const message = err?.error?.message || 'Failed to update note. Please try again.';
          this.snackbar.showError(message);
          this.submitting.set(false);
        }
      });
  }

  onDelete(note: BatchNoteDto): void {
    const confirmData: ConfirmActionDialogData = {
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      detail: 'This action cannot be undone.',
      confirmText: 'DELETE',
      cancelText: 'CANCEL'
    };

    this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: confirmData
    }).afterClosed()
      .pipe(
        takeUntil(this.destroy$),
        filter(confirmed => confirmed === true),
        switchMap(() => {
          this.submitting.set(true);
          return this.apiService.deleteNote(this.worksheetId, note.auditKey);
        })
      )
      .subscribe({
        next: () => {
          this.notes.update(current => current.filter(n => n.auditKey !== note.auditKey));
          this.submitting.set(false);
        },
        error: (err) => {
          this.loggingService.error('Error deleting batch note', err);
          const message = err?.error?.message || 'Failed to delete note. Please try again.';
          this.snackbar.showError(message);
          this.submitting.set(false);
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  // Parse ISO string parts directly — API returns dates in chapter local time,
  // so using new Date() would re-apply browser timezone and produce a wrong result.
  formatDate(date: string | null): string {
    if (!date) return '-';
    const [datePart, timePart] = date.split('T');
    const parts = datePart?.split('-');
    if (!parts || parts.length !== 3) return date;
    const month = this.monthNames[parseInt(parts[1], 10) - 1];
    const dateStr = `${parts[2]}-${month}-${parts[0]}`;
    if (timePart) {
      const time = timePart.substring(0, 5);
      return `${dateStr} ${time}`;
    }
    return dateStr;
  }
}
