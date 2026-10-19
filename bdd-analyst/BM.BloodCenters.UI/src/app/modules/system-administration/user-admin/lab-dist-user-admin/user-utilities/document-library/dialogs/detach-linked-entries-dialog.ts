import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DetachEntry {
  linkTable: string;
  linkColumn: string;
  linkedValue: string;
}

export interface DetachLinkedEntriesDialogData {
  documentName: string;
  entries: DetachEntry[];
}

/**
 * Detach Linked Entries Dialog Component
 * Shows confirmation before detaching selected linked values from a document
 */
@Component({
  selector: 'app-detach-linked-entries-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './detach-linked-entries-dialog.html',
  styleUrl: './detach-linked-entries-dialog.scss'
})
export class DetachLinkedEntriesDialogComponent {
  public dialogRef = inject(MatDialogRef<DetachLinkedEntriesDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DetachLinkedEntriesDialogData) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
