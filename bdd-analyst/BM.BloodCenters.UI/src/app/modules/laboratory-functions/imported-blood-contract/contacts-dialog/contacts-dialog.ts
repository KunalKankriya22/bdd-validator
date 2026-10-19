import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';

import { ImportedBloodContractService } from '../imported-blood-contract.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { ContactModel, EditableContactRow, ContactItem } from '../imported-blood-contract.model';

export interface ContactsDialogData {
  contractId: string;
}

@Component({
  selector: 'app-contacts-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './contacts-dialog.html',
  styleUrls: ['./contacts-dialog.scss'],
})
export class ContactsDialogComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly dialogRef = inject(MatDialogRef<ContactsDialogComponent>);
  readonly data = inject<ContactsDialogData>(MAT_DIALOG_DATA);
  private readonly service = inject(ImportedBloodContractService);
  private readonly snackbarService = inject(SnackbarService);

  editableRows: EditableContactRow[] = [];
  dirtyRowIds = new Set<number>();
  isSaving = false;
  isLoading = true;

  readonly contactTypeOptions = [
    { code: 'C', description: 'Contract' },
    { code: 'I', description: 'Institution' },
  ];

  constructor() {
    this.loadContacts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadContacts(): void {
    this.isLoading = true;
    this.service.getContacts(this.data.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: contacts => {
          this.isLoading = false;
          this.editableRows = contacts.map(c => this.mapToEditableRow(c));
          this.dirtyRowIds.clear();
        },
        error: () => {
          this.isLoading = false;
          this.editableRows = [];
        },
      });
  }

  private mapToEditableRow(contact: ContactModel): EditableContactRow {
    return {
      contactId: contact.contactId,
      contactType: contact.contactType,
      contactLastName: contact.contactLastName,
      contactFirstName: contact.contactFirstName,
      contactTitle: contact.contactTitle ?? '',
      phoneNumber: contact.phoneNumber ?? '',
      faxNumber: contact.faxNumber ?? '',
      isDirty: false,
      errors: {},
    };
  }

  onAddRow(): void {
    const newRow: EditableContactRow = {
      contactId: null,
      contactType: 'C',
      contactLastName: '',
      contactFirstName: '',
      contactTitle: '',
      phoneNumber: '',
      faxNumber: '',
      isDirty: true,
      errors: {},
    };

    this.editableRows.unshift(newRow);

    const newDirtyIds = new Set<number>();
    this.dirtyRowIds.forEach(id => newDirtyIds.add(id + 1));
    this.dirtyRowIds = newDirtyIds;
    this.dirtyRowIds.add(0);
  }

  onDeleteRow(index: number): void {
    const row = this.editableRows[index];

    if (row.contactId && row.contactId > 0) {
      this.service.deleteContact(this.data.contractId, row.contactId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackbarService.showSuccess('Contact deleted');
            this.loadContacts();
          },
        });
      return;
    }

    this.editableRows.splice(index, 1);
    this.dirtyRowIds.delete(index);

    const newDirtyIds = new Set<number>();
    this.dirtyRowIds.forEach(id => {
      if (id > index) newDirtyIds.add(id - 1);
      else if (id < index) newDirtyIds.add(id);
    });
    this.dirtyRowIds = newDirtyIds;
  }

  onFieldChange(rowIndex: number, field: string, value: any): void {
    const row = this.editableRows[rowIndex];
    (row as any)[field] = value;
    row.isDirty = true;
    this.dirtyRowIds.add(rowIndex);
    if (row.errors[field]) {
      delete row.errors[field];
    }
  }

  onSave(): void {
    if (this.dirtyRowIds.size === 0) {
      this.snackbarService.showError('No changes to save');
      return;
    }

    const records: ContactItem[] = this.editableRows
      .filter((_, i) => this.dirtyRowIds.has(i))
      .map(row => ({
        contactId: row.contactId && row.contactId > 0 ? row.contactId : undefined,
        contactType: row.contactType,
        contactLastName: (row.contactLastName || '').trim(),
        contactFirstName: (row.contactFirstName || '').trim(),
        contactTitle: (row.contactTitle || '').trim() || undefined,
        phoneNumber: (row.phoneNumber || '').trim() || undefined,
        faxNumber: (row.faxNumber || '').trim() || undefined,
      }));

    this.isSaving = true;
    this.service.bulkSaveContacts(this.data.contractId, { records })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.isSaving = false;
          if (response.success) {
            this.snackbarService.showSuccess(response.message || 'Contacts saved');
            this.loadContacts();
          }
        },
        error: () => { this.isSaving = false; },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onReset(): void {
    this.loadContacts();
  }

  hasNewRows(): boolean {
    return this.editableRows.some(r => !r.contactId || r.contactId === 0);
  }
}
