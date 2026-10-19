import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { DonationDetailsApiService } from '../services/donation-details-api.service';
import { EquipSupplyItem, EquipSupplyDialogData } from '../models/donation-details.model';

@Component({
  selector: 'app-equip-supply-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './equip-supply-dialog.html',
  styleUrls: ['./equip-supply-dialog.scss'],
})
export class EquipSupplyDialogComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(DonationDetailsApiService);
  private readonly dialogRef = inject(MatDialogRef<EquipSupplyDialogComponent>);
  private readonly data: EquipSupplyDialogData = inject(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  loading = signal(true);
  items = signal<EquipSupplyItem[]>([]);
  selectedItem = signal<EquipSupplyItem | null>(null);

  displayedColumns = ['equipOrSupply', 'equipSupplyCode', 'equipReference', 'catalogNo', 'lotNo', 'tempQcStatus'];

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.apiService.getEquipSupply(this.data.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.items.set(response.data ?? []);
          if (response.data?.length) {
            this.selectedItem.set(response.data[0]);
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  selectRow(item: EquipSupplyItem): void {
    this.selectedItem.set(item);
  }

  onBack(): void {
    this.dialogRef.close();
  }

  onClose(): void {
    this.dialogRef.close('closeAll');
  }
}
