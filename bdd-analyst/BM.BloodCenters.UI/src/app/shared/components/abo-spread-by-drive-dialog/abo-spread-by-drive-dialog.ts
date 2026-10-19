import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { AboSpreadService, AboSpreadRow, AboSpreadTotals, AboSpreadPercentages } from '@shared/services/abo-spread.service';

export interface AboSpreadByDriveData {
  driveId: string;
  chapterId: string;
}

@Component({
  selector: 'app-abo-spread-by-drive-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './abo-spread-by-drive-dialog.html',
  styleUrls: ['./abo-spread-by-drive-dialog.scss'],
})
export class AboSpreadByDriveDialogComponent implements OnInit, OnDestroy {
  private readonly aboSpreadService = inject(AboSpreadService);
  private destroy$ = new Subject<void>();

  selectedDonationType = 'AL';
  sortDirection: 'asc' | 'desc' = 'desc';
  loading = false;

  donationTypes: { value: string; label: string }[] = [
    { value: 'AL', label: 'All Donation Types' },
  ];

  donationTypeSearchControl = new FormControl('');
  filteredDonationTypes: { value: string; label: string }[] = [];

  dataSource: AboSpreadRow[] = [];

  totals: AboSpreadTotals = {
    total: 0, oPos: 0, oNeg: 0, aPos: 0, aNeg: 0, bPos: 0, bNeg: 0, abPos: 0, abNeg: 0, unknown: 0,
  };

  percentages: AboSpreadPercentages = {
    total: 0, oPos: 0, oNeg: 0, aPos: 0, aNeg: 0, bPos: 0, bNeg: 0, abPos: 0, abNeg: 0, unknown: 0,
  };

  unknownAbo = 0;

  constructor(
    public dialogRef: MatDialogRef<AboSpreadByDriveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AboSpreadByDriveData,
  ) {}

  ngOnInit(): void {
    this.setupDonationTypeSearch();
    this.loadDonationTypes();
    this.loadSpreadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDonationTypeChange(): void {
    setTimeout(() => (document.activeElement as HTMLElement)?.blur());
    this.loadSpreadData();
  }

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
    this.sortDataSource();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private setupDonationTypeSearch(): void {
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        if (!term) {
          this.filteredDonationTypes = [...this.donationTypes];
        } else {
          this.filteredDonationTypes = this.donationTypes.filter(type =>
            type.label.toLowerCase().includes(term) ||
            type.value.toLowerCase().includes(term)
          );
        }
      });
  }

  private loadDonationTypes(): void {
    this.aboSpreadService.getDonationTypesByDrive(this.data.driveId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (types) => {
        this.donationTypes = [
          { value: 'AL', label: 'All Donation Types' },
          ...types.map(t => ({ value: t.donationType, label: t.description ? `${t.donationType} - ${t.description}` : t.donationType })),
        ];
        this.filteredDonationTypes = [...this.donationTypes];
      },
    });
  }

  private loadSpreadData(): void {
    this.loading = true;
    this.aboSpreadService.getAboSpreadByDrive(this.data.driveId, this.selectedDonationType).subscribe({
      next: (response) => {
        this.dataSource = response.rows;
        this.sortDataSource();
        this.totals = response.totals;
        this.percentages = response.percentages;
        this.unknownAbo = response.unknownAbo;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private sortDataSource(): void {
    this.dataSource = [...this.dataSource].sort((a, b) => {
      const nameA = (a.procedureCodeDescription || a.procedureCode || '').toLowerCase();
      const nameB = (b.procedureCodeDescription || b.procedureCode || '').toLowerCase();
      const comparison = nameA.localeCompare(nameB);
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
}
