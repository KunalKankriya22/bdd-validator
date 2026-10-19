import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MaintainSponsorContactsService } from '../services/maintain-sponsor-contacts.service';
import { SponsorContactModel, ContactNoteModel } from '../models/maintain-sponsor-contacts.model';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-contact-notes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './contact-notes.html',
  styleUrls: ['./contact-notes.scss']
})
export class ContactNotesComponent implements OnInit {
  @Input() data: SponsorContactModel | null = null;
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  noteForm!: FormGroup;
  notes: ContactNoteModel[] = [];
  isLoading = true;
  isSaving = false;
  editingNoteId: string | null = null;
  editingAuditKey: number | null = null;
  hasChanges = false;

  constructor(
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private sponsorContactsService: MaintainSponsorContactsService,
    private loginService: LoginService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.noteForm = this.fb.group({
      notes: ['', [Validators.maxLength(240)]]
    });
    this.loadNotes();
  }

  private loadNotes(): void {
    if (!this.data?.sponsorId || !this.data?.addressId) {
      this.isLoading = false;
      return;
    }

    this.sponsorContactsService.getContactDetail(this.data.sponsorId, this.data.addressId).subscribe({
      next: (detail) => {
        // Trim leading spaces from notes and user names when retrieving
        this.notes = (detail.notes || []).map((n: any) => ({
          noteId: String(n.noteId),
          contactId: detail.contactId,
          notes: (n.noteText || n.notes || '')?.trimStart(),
          createdBy: (n.createdBy || n.insertUser || '')?.trimStart(),
          createdDate: n.createdDate || n.insertDate || '',
          version: n.version || '',
          auditKey: n.auditKey || 0
        }));
        this.isLoading = false;
      },
      error: () => {
        this.notes = [];
        this.isLoading = false;
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }

  onAddNote(): void {
    const noteText = this.noteForm.get('notes')?.value?.trimStart()?.trim();
    if (!noteText || !this.data?.sponsorId || !this.data?.addressId) return;

    this.isSaving = true;

    if (this.editingNoteId && this.editingAuditKey != null) {
      this.sponsorContactsService.updateContactNote(this.editingNoteId, this.editingAuditKey, {
        noteText,
        insertUser: this.loginService.getStoredUsername()
      }).subscribe({
        next: () => {
          this.isSaving = false;
          this.editingNoteId = null;
          this.editingAuditKey = null;
          this.noteForm.reset();
          this.hasChanges = true;
          this.loadNotes();
        },
        error: (error) => {
          this.isSaving = false;
          this.snackBar.open(this.getErrorMessage(error), 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      const chapterId = this.headerService.getCurrentChapterId();
      this.sponsorContactsService.addContactNote(this.data.sponsorId, this.data.addressId, chapterId, {
        noteText,
        insertUser: this.loginService.getStoredUsername()
      }).subscribe({
        next: () => {
          this.isSaving = false;
          this.noteForm.reset();
          this.hasChanges = true;
          this.loadNotes();
        },
        error: (error) => {
          this.isSaving = false;
          this.snackBar.open(this.getErrorMessage(error), 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  onEditNote(note: any): void {
    this.editingNoteId = note.noteId;
    this.editingAuditKey = note.auditKey || null;
    this.noteForm.patchValue({ notes: note.notes });
  }

  onDeleteNote(note: any): void {
    if (!this.data?.sponsorId || !this.data?.addressId) return;

    this.sponsorContactsService.deleteContactNote(this.data.sponsorId, this.data.addressId, note.auditKey).subscribe({
      next: () => {
        this.hasChanges = true;
        this.loadNotes();
        this.snackBar.open('Note deleted successfully.', 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.snackBar.open(this.getErrorMessage(error), 'DISMISS', {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onCancel(): void {
    this.closePanel.emit();
  }

  onSave(): void {
    this.saveSuccess.emit();
  }

  /**
   * Prevents leading spaces in input fields.
   * Call this on keydown event for text inputs.
   */
  preventLeadingSpace(event: KeyboardEvent, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const control = this.noteForm.get(controlName);

    // If the input is empty or only contains spaces, prevent space key
    if (event.key === ' ' && (!input.value || input.value.trim() === '')) {
      event.preventDefault();
    }
  }

  /**
   * Removes leading spaces from input value.
   * Call this on input event for text inputs.
   */
  trimLeadingSpace(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // If the input starts with a space, remove all leading spaces
    if (value && value.charAt(0) === ' ') {
      const trimmedValue = value.trimStart();
      input.value = trimmedValue;
      this.noteForm.get(controlName)?.setValue(trimmedValue, { emitEvent: false });
    }
  }

  /**
   * Handles paste events to prevent leading spaces.
   * Call this on paste event for text inputs.
   */
  onPaste(event: ClipboardEvent, controlName: string): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const trimmedText = pastedText.trimStart();

    const input = event.target as HTMLTextAreaElement;
    const control = this.noteForm.get(controlName);

    if (control) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = input.value || '';

      const newValue = currentValue.substring(0, start) + trimmedText + currentValue.substring(end);
      control.setValue(newValue);

      setTimeout(() => {
        const newPosition = start + trimmedText.length;
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private getErrorMessage(error: any): string {
    let errorMessage = error?.error?.errorResponse?.error ||
                      error?.error?.message ||
                      error?.message ||
                      'An unexpected error occurred';
    const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;

    if (errorCode) {
      errorMessage = `Error: ${errorCode}: ${errorMessage}`;
    }

    return errorMessage;
  }
}
