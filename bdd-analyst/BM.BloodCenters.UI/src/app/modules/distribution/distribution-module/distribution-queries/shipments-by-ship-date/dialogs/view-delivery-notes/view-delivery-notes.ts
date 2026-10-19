import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { ShipmentsByShipDateService } from '../../services/shipments-by-ship-date.service';

export interface ViewDeliveryNotesDialogData {
  noteId: number;
}

@Component({
  selector: 'app-view-delivery-notes',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, LoadingSpinnerComponent],
  templateUrl: './view-delivery-notes.html',
  styleUrl: './view-delivery-notes.scss',
})
export class ViewDeliveryNotesDialog implements OnInit, OnDestroy {
  readonly data = inject<ViewDeliveryNotesDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ViewDeliveryNotesDialog>);
  private readonly apiService = inject(ShipmentsByShipDateService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  protected readonly note = signal<string | null>(null);
  protected readonly loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading.set(true);
    this.apiService
      .getDeliveryNotes(this.data.noteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes) => {
          this.note.set(notes?.note || null);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'Failed to load delivery notes.')
          );
        },
      });
  }

  protected onClose(): void {
    this.dialogRef.close();
  }
}
