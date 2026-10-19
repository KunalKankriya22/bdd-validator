import { Component, Inject, OnInit, OnDestroy, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { Subject, takeUntil } from 'rxjs';

import { ReleaseProductQuarantineApiService } from '../../services/release-product-quarantine-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { StorageLocation } from '../../models/release-product-quarantine.model';

/**
 * Dialog data interface for Location Selection dialog
 */
export interface LocationSelectionDialogData {
  warehouseId: string;
  productType?: string | null;
  bloodType?: string | null;
}

/**
 * Location Selection Dialog Component
 * Allows users to search and select a storage location for restocking products
 */
@Component({
  selector: 'app-location-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule
  ],
  templateUrl: './location-selection-dialog.html',
  styleUrls: ['./location-selection-dialog.scss']
})
export class LocationSelectionDialog implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `location-selection-dialog-${LocationSelectionDialog.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(MatSort) sort!: MatSort;

  private apiService = inject(ReleaseProductQuarantineApiService);
  private snackbarService = inject(SnackbarService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly locations = signal<StorageLocation[]>([]);
  readonly selectedLocation = signal<StorageLocation | null>(null);

  searchForm!: FormGroup;
  dataSource = new MatTableDataSource<StorageLocation>();
  displayedColumns: string[] = [
    'locationId',
    'warehouseDesc',
    'deviceDesc',
    'trayDesc',
    'capacity',
    'bloodType',
    'productType',
    'actions'
  ];

  constructor(
    public dialogRef: MatDialogRef<LocationSelectionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: LocationSelectionDialogData
  ) {}

  ngOnInit(): void {
    this.initSearchForm();
    this.loadLocations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      searchText: ['']
    });

    // Watch for search input changes
    this.searchForm.get('searchText')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.applyFilter(value);
      });
  }

  private loadLocations(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .getStorageLocations(
        this.data.warehouseId,
        this.data.productType,
        this.data.bloodType
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          this.locations.set(locations);
          this.dataSource.data = locations;
          this.dataSource.sort = this.sort;
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set('Failed to load storage locations. Please try again.');
          this.snackbarService.showError('Failed to load storage locations');
        }
      });
  }

  private applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSelectLocation(location: StorageLocation): void {
    this.selectedLocation.set(location);
  }

  onConfirm(): void {
    const selected = this.selectedLocation();
    if (!selected) {
      this.snackbarService.showError('Please select a storage location');
      return;
    }

    // Validate capacity
    if (selected.trayCapacity !== null && selected.currentCount !== null) {
      if (selected.currentCount >= selected.trayCapacity) {
        this.snackbarService.showError('Selected location is at full capacity');
        return;
      }
    }

    this.dialogRef.close(selected);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onRetry(): void {
    this.loadLocations();
  }

  get hasLocations(): boolean {
    return this.locations().length > 0;
  }

  isSelected(location: StorageLocation): boolean {
    const selected = this.selectedLocation();
    return selected?.locationId === location.locationId;
  }

  isLocationFull(location: StorageLocation): boolean {
    if (location.trayCapacity === null || location.currentCount === null) {
      return false;
    }
    return location.currentCount >= location.trayCapacity;
  }

  formatCapacity(location: StorageLocation): string {
    if (location.trayCapacity === null || location.currentCount === null) {
      return '-';
    }
    return `${location.currentCount} / ${location.trayCapacity}`;
  }

  getCapacityClass(location: StorageLocation): string {
    if (location.trayCapacity === null || location.currentCount === null) {
      return '';
    }

    const percentage = (location.currentCount / location.trayCapacity) * 100;

    if (percentage >= 100) {
      return 'capacity-full';
    } else if (percentage >= 80) {
      return 'capacity-high';
    } else if (percentage >= 50) {
      return 'capacity-medium';
    }
    return 'capacity-low';
  }
}
