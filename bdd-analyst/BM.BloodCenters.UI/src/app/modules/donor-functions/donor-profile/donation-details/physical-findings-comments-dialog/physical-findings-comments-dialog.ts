import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { DonationDetailsApiService } from '../services/donation-details-api.service';
import { PhysicalFindingsCommentsDialogData } from '../models/donation-details.model';

interface PhysicalFindingRow {
  physicalCode: string;
  description: string;
  physicalValue: string;
  interCode: string;
  comments: string;
}

@Component({
  selector: 'app-physical-findings-comments-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './physical-findings-comments-dialog.html',
  styleUrls: ['./physical-findings-comments-dialog.scss'],
})
export class PhysicalFindingsCommentsDialogComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(DonationDetailsApiService);
  private readonly dialogRef = inject(MatDialogRef<PhysicalFindingsCommentsDialogComponent>);
  private readonly data: PhysicalFindingsCommentsDialogData = inject(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  loading = signal(true);
  mergedFindings = signal<PhysicalFindingRow[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    if (!this.data.unitId) {
      this.buildFromExistingFindings();
      return;
    }

    this.apiService.getPhysicalFindingsWithDetails(this.data.unitId, this.data.collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const rows: PhysicalFindingRow[] = (response.data ?? []).map((item: any) => ({
            physicalCode: item.physicalCode ?? '',
            description: item.codeDescription ?? item.physicalDescription ?? item.description ?? '',
            physicalValue: item.physicalValue ?? item.value ?? '',
            interCode: item.interCode ?? item.interdiction ?? '',
            comments: item.comments ?? '',
          }));
          this.mergedFindings.set(rows);
          this.loading.set(false);
        },
        error: () => {
          this.buildFromExistingFindings();
        },
      });
  }

  private buildFromExistingFindings(): void {
    const rows: PhysicalFindingRow[] = (this.data.physicalFindings ?? []).map(pf => ({
      physicalCode: pf.physicalCode,
      description: '',
      physicalValue: pf.physicalValue ?? '',
      interCode: pf.interCode ?? '',
      comments: '',
    }));
    this.mergedFindings.set(rows);
    this.loading.set(false);
  }

  onBack(): void {
    this.dialogRef.close();
  }

  onClose(): void {
    this.dialogRef.close('closeAll');
  }
}
