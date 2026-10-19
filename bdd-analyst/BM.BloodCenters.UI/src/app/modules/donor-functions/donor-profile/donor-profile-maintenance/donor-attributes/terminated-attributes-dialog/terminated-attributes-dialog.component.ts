import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DonorInterdiction } from '../models/donor-attributes.model';
import { DonorAttributesService } from '../services/donor-attributes.service';

export interface TerminatedAttributesDialogData {
  donorId: string;
  donorName: string;
}

/**
 * Terminated Attributes Dialog Component
 * Displays read-only table of terminated donor properties/attributes
 */
@Component({
  selector: 'app-terminated-attributes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './terminated-attributes-dialog.component.html',
  styleUrls: ['./terminated-attributes-dialog.component.scss']
})
export class TerminatedAttributesDialogComponent implements OnInit {
  private readonly data = inject<TerminatedAttributesDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TerminatedAttributesDialogComponent>);
  private readonly donorAttributesService = inject(DonorAttributesService);

  // Signals
  readonly terminatedAttributes = signal<DonorInterdiction[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Table configuration
  protected readonly displayedColumns: string[] = [
    'interCode',
    'interDesc',
    'effDate',
    'termDate',
    'insertUser'
  ];

  protected get donorId(): string {
    return this.data.donorId;
  }

  protected get donorName(): string {
    return this.data.donorName;
  }

  ngOnInit(): void {
    this.loadTerminatedAttributes();
  }

  /**
   * Load terminated attributes from API
   */
  private loadTerminatedAttributes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.donorAttributesService.getTerminatedAttributes(this.donorId).subscribe({
      next: (attributes) => {
        this.terminatedAttributes.set(attributes);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load terminated attributes');
        this.loading.set(false);
      }
    });
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }
}
