import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { CommentsDialogData, CentralNoteItem } from '../models/lookup-donor-card.model';
import { LookupAndPrintDonorCardService } from '../services/lookup-and-print-donor-card.service';
import { formatTableDate } from '@shared/utils/date-format.util';

@Component({
  selector: 'app-enter-comments-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './enter-comments-dialog.html',
  styleUrls: ['./enter-comments-dialog.scss'],
})
export class EnterCommentsDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<EnterCommentsDialog>);
  private readonly data: CommentsDialogData = inject(MAT_DIALOG_DATA);
  private readonly donorCardService = inject(LookupAndPrintDonorCardService);
  private readonly destroy$ = new Subject<void>();

  readonly notesControl = new FormControl('');
  readonly existingNotes = signal<CentralNoteItem[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);

  ngOnInit(): void {
    this.loadNotes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotes(): void {
    this.isLoading.set(true);
    this.donorCardService.getNotes(this.data.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes) => {
          this.existingNotes.set(notes);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const noteText = this.notesControl.value?.trim();
    if (!noteText) return;

    this.isSaving.set(true);
    this.donorCardService.addNote(this.data.donorId, noteText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notesControl.reset();
          this.isSaving.set(false);
          this.loadNotes();
        },
        error: () => this.isSaving.set(false),
      });
  }

  formatDate(dateStr: string): string {
    return formatTableDate(dateStr);
  }
}
