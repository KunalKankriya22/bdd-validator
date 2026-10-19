import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, catchError, of, filter, switchMap } from 'rxjs';

import { DonationNotesService } from './donation-notes.service';
import {
  DonationNotesDialogData,
  DonationNotesDialogResult,
  DonationNoteDto,
  DonationNotesAccessItem,
} from './donation-notes.model';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

class InstantErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && control.dirty);
  }
}

@Component({
  selector: 'app-donation-notes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './donation-notes.html',
  styleUrls: ['./donation-notes.scss']
})
export class DonationNotesDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly donationNotesService = inject(DonationNotesService);
  private readonly destroy$ = new Subject<void>();
  readonly instantMatcher = new InstantErrorStateMatcher();

  notes: DonationNoteDto[] = [];
  dialogTitle = 'Donation Notes';
  headerInfo = {
    label1: 'UNIT ID / DEFERRAL ID',
    value1: '',
    label2: 'DRAW DATE',
    value2: '',
  };
  access: DonationNotesAccessItem = {
    canAdd: false,
    canEdit: false,
    canDelete: false
  };

  loading = false;
  savingAuditKey: number | null = null;
  savingNewNote = false;
  errorMessage: string | null = null;
  errorCode: string | null = null;
  warningDismissed = false;

  editingAuditKey: number | null = null;
  noteForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DonationNotesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DonationNotesDialogData
  ) {}

  get isSaving(): boolean {
    return this.savingAuditKey !== null || this.savingNewNote;
  }

  get isEditing(): boolean {
    return this.editingAuditKey !== null;
  }

  ngOnInit(): void {
    this.noteForm = this.fb.group({
      noteText: ['', [Validators.maxLength(240)]]
    });
    this.dialogTitle = this.data.title || 'Donation Notes';
    this.headerInfo = {
      label1: this.data.contextLabel || 'UNIT ID / DEFERRAL ID',
      value1: this.data.contextValue || this.data.unitId || this.data.deferralId || '',
      label2: this.data.valueLabel || 'DRAW DATE',
      value2: this.data.valueDisplay || this.formatNoteDate(this.data.collectionDate || ''),
    };
    this.loadNotes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private get resolvedUnitId(): string | undefined {
    return this.data.unitId || this.data.deferralId;
  }

  private get hasMutationContext(): boolean {
    return !!(this.resolvedUnitId && this.data.collectionDate);
  }

  private loadNotes(): void {
    this.loading = true;
    this.errorMessage = null;

    this.donationNotesService
      .loadNotesAndAccess(
        this.resolvedUnitId,
        this.data.transactionId,
        this.data.collectionDate,
        this.data.context,
      )
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.loading = false;
          this.handleError(error);
          return of(null);
        })
      )
      .subscribe({
        next: (result) => {
          if (result) {
            this.notes = this.sortNotesDesc(result.notes);
            this.access = result.access;
            if (!this.hasMutationContext) {
              this.access = { ...this.access, canAdd: false, canEdit: false, canDelete: false };
            }
          }
          this.loading = false;
        }
      });
  }

  get accessLevelMessage(): string {
    if (this.warningDismissed) {
      return '';
    }
    if (this.access.message) {
      return this.access.message;
    }
    if (this.access.canAdd && this.access.canEdit && this.access.canDelete) {
      return '';
    }
    if ((this.access.canAdd || this.access.canEdit) && !this.access.canDelete) {
      return 'Your access level is for viewing and adding notes. Deletion of notes is denied!';
    }
    if (!this.access.canAdd && !this.access.canEdit && this.access.canDelete) {
      return 'Your access level is for viewing and deleting notes. Adding notes is denied!';
    }
    if (!this.access.canAdd && !this.access.canEdit && !this.access.canDelete) {
      return 'Your access level is for viewing notes only. Addition and deletion of notes is denied!';
    }
    return '';
  }

  onAddOrUpdate(): void {
    const noteText = this.noteForm.get('noteText')?.value?.trim();
    if (!noteText) return;

    if (this.editingAuditKey !== null) {
      this.savingAuditKey = this.editingAuditKey;
      this.donationNotesService
        .updateNote(
          this.editingAuditKey,
          noteText,
          this.resolvedUnitId!,
          this.data.collectionDate!,
          this.data.context,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedNotes) => {
            this.notes = this.sortNotesDesc(updatedNotes);
            this.editingAuditKey = null;
            this.savingAuditKey = null;
            this.noteForm.reset();
          },
          error: (error) => {
            this.handleError(error);
            this.savingAuditKey = null;
          }
        });
    } else {
      this.savingNewNote = true;
      this.donationNotesService
        .addNote(
          noteText,
          this.resolvedUnitId,
          this.data.transactionId,
          this.data.collectionDate,
          this.data.context,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedNotes) => {
            this.notes = this.sortNotesDesc(updatedNotes);
            this.noteForm.reset();
            this.savingNewNote = false;
          },
          error: (error) => {
            this.handleError(error);
            this.savingNewNote = false;
          }
        });
    }
  }

  onEditNote(note: DonationNoteDto): void {
    this.editingAuditKey = note.auditKey;
    this.noteForm.patchValue({ noteText: note.note });
  }

  cancelEdit(): void {
    this.editingAuditKey = null;
    this.noteForm.reset();
  }

  deleteNote(auditKey: number): void {
    if (!this.hasMutationContext) return;

    const confirmData: ConfirmActionDialogData = {
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      confirmText: 'YES',
      cancelText: 'NO, CANCEL',
    };

    const confirmDialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '380px',
      maxWidth: '90vw',
      data: confirmData,
      autoFocus: false,
      restoreFocus: false,
      disableClose: true,
      panelClass: 'centered-dialog',
    });

    confirmDialogRef
      .afterClosed()
      .pipe(
        takeUntil(this.destroy$),
        filter((result) => result === true),
        switchMap(() => {
          this.savingAuditKey = auditKey;
          return this.donationNotesService.deleteNote(
            auditKey,
            this.resolvedUnitId!,
            this.data.collectionDate!,
            this.data.context,
          );
        }),
      )
      .subscribe({
        next: () => {
          this.refreshNotesAfterDelete();
        },
        error: (error) => {
          this.handleError(error);
          this.savingAuditKey = null;
        },
      });
  }

  private refreshNotesAfterDelete(): void {
    this.donationNotesService
      .fetchNotes(
        this.resolvedUnitId,
        this.data.transactionId,
        this.data.collectionDate,
        this.data.context,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes) => {
          this.notes = this.sortNotesDesc(notes);
          this.savingAuditKey = null;
        },
        error: (error) => {
          this.handleError(error);
          this.savingAuditKey = null;
        },
      });
  }

  isLatestNote(note: DonationNoteDto): boolean {
    if (this.notes.length === 0) return false;
    return note.noteSequence === this.notes[0].noteSequence;
  }

  private sortNotesDesc(notes: DonationNoteDto[]): DonationNoteDto[] {
    return [...notes].sort((a, b) => b.noteSequence - a.noteSequence);
  }

  isSavingNote(auditKey: number): boolean {
    return this.savingAuditKey === auditKey;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }

  formatNoteDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  private handleError(error: any): void {
    if (error?.error?.errorResponse) {
      this.errorCode = error.error.errorResponse.errorCode;
      this.errorMessage = error.error.errorResponse.error;
    } else if (error?.error?.message) {
      this.errorMessage = error.error.message;
    } else if (error?.message) {
      this.errorMessage = error.message;
    } else {
      this.errorMessage = 'An error occurred while processing donation notes';
    }
  }

  closeError(): void {
    this.errorMessage = null;
    this.errorCode = null;
  }

  dismissWarning(): void {
    this.warningDismissed = true;
  }

  onBack(): void {
    this.dialogRef.close();
  }

  onClose(): void {
    this.dialogRef.close('closeAll');
  }
}
