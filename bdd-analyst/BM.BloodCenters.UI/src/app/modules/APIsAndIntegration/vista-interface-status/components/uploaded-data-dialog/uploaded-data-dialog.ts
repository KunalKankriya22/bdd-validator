import { Component, Inject, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VistaInterfaceStatusService } from '../../services/vista-interface-status.service';
import { IdpTargetChangeDto, UploadedDataField } from '../../models/vista-interface-status.model';

/**
 * Dialog component to display uploaded data details for a Vista Interface Status transaction
 *
 * Shows detailed field/value pairs from the Vista interface upload
 */
@Component({
  selector: 'app-uploaded-data-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './uploaded-data-dialog.html',
  styleUrls: ['./uploaded-data-dialog.scss'],
})
export class UploadedDataDialog implements OnInit {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `uploaded-data-dialog-${UploadedDataDialog.nextId++}`;

  private readonly vistaService = inject(VistaInterfaceStatusService);

  // Signals
  uploadedDataFields = signal<UploadedDataField[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  displayedColumns: string[] = ['label', 'value'];
  sortDirection = signal<'default' | 'A' | 'D'>('A');

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: { transactionId: string },
    private dialogRef: MatDialogRef<UploadedDataDialog>
  ) {}

  ngOnInit(): void {
    this.loadUploadedData();
  }

  private loadUploadedData(): void {
    if (!this.dialogData?.transactionId) {
      this.error.set('Transaction ID is required');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.vistaService.getUploadedData(this.dialogData.transactionId).subscribe({
      next: (records: IdpTargetChangeDto[]) => {
        const fields: UploadedDataField[] = records.map(r => ({
          label: r.targetField,
          value: r.targetValue
        }));
        this.uploadedDataFields.set(fields);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load uploaded data');
        this.loading.set(false);
      },
    });
  }

  toggleSort(): void {
    const current = this.sortDirection();
    const next = current === 'default' ? 'D' : current === 'D' ? 'A' : 'D';
    this.sortDirection.set(next);

    const fields = [...this.uploadedDataFields()];
    fields.sort((a, b) => {
      const valA = (a.label || '').toLowerCase();
      const valB = (b.label || '').toLowerCase();
      const cmp = valA.localeCompare(valB);
      return next === 'A' ? cmp : -cmp;
    });
    this.uploadedDataFields.set(fields);
  }

  getSortIcon(): string {
    const dir = this.sortDirection();
    if (dir === 'A') return 'arrow_upward';
    if (dir === 'D') return 'arrow_downward';
    return 'unfold_more';
  }

  close(): void {
    this.dialogRef.close();
  }

  /**
   * Handle ESC key
   */
  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}
