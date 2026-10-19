import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

import { DonationDetailsApiService } from '../services/donation-details-api.service';
import { SponsorDetailsDialogData, SponsorLookup } from '../models/donation-details.model';

@Component({
  selector: 'app-sponsor-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule,
  ],
  templateUrl: './sponsor-details-dialog.html',
  styleUrls: ['./sponsor-details-dialog.scss'],
})
export class SponsorDetailsDialogComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(DonationDetailsApiService);
  private readonly dialogRef = inject(MatDialogRef<SponsorDetailsDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data: SponsorDetailsDialogData = inject(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  sponsors = signal<SponsorLookup[]>([]);
  selectedSponsorId = signal<string | null>(null);
  saving = signal(false);

  selectedSponsorName = computed(() => {
    const id = this.selectedSponsorId();
    if (!id) return '-';
    const sponsor = this.sponsors().find(s => s.sponsorId === id);
    return sponsor?.name ?? '-';
  });

  ngOnInit(): void {
    if (this.data.creditSponsor) {
      this.loadSponsors(this.data.creditSponsor);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSponsorSearch(searchText: string): void {
    if (searchText && searchText.length >= 3) {
      this.loadSponsors(searchText);
    }
  }

  private loadSponsors(searchText: string): void {
    this.apiService.searchSponsors(searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sponsors.set(response.data ?? []);
        },
      });
  }

  onSave(): void {
    const sponsorId = this.selectedSponsorId();
    if (!sponsorId || !this.data.unitId) return;

    this.saving.set(true);
    this.apiService.updateCreditSponsor(this.data.unitId, this.data.collDate, sponsorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Credit sponsor updated successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.saving.set(false);
          this.dialogRef.close('saved');
        },
        error: () => {
          this.snackBar.open('Error updating credit sponsor', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
          this.saving.set(false);
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onBack(): void {
    this.dialogRef.close();
  }

  onClose(): void {
    this.dialogRef.close('closeAll');
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }
}
