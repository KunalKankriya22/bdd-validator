import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { PlaceReleaseInterdictionApiService } from '../services/place-release-interdiction-api.service';
import { InterdictionRecord } from '../models/place-release-interdiction.model';

@Component({
  selector: 'app-select-interdictions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  templateUrl: './select-interdictions-dialog.html',
  styleUrl: './select-interdictions-dialog.scss',
})
export class SelectInterdictionsDialog implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<SelectInterdictionsDialog>);
  private apiService = inject(PlaceReleaseInterdictionApiService);
  private destroy$ = new Subject<void>();

  // Form controls
  interTypeControl = new FormControl<string>('');

  // Signals
  protected readonly allInterdictions = signal<InterdictionRecord[]>([]);
  protected readonly selectedInterdictions = signal<Set<string>>(new Set());
  protected readonly selectedFilterType = signal<string>('');
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Computed filtered interdictions
  protected readonly filteredInterdictions = computed(() => {
    const all = this.allInterdictions();
    const filterType = this.selectedFilterType();

    if (!filterType) {
      return all;
    }

    return all.filter(i => i.interType === filterType);
  });

  // Computed values
  protected readonly selectedCount = computed(() => this.selectedInterdictions().size);
  protected readonly hasSelection = computed(() => this.selectedCount() > 0);

  ngOnInit(): void {
    this.loadInterdictions();
    this.setupFilterListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListener(): void {
    this.interTypeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.selectedFilterType.set(value || '');
      });
  }

  private loadInterdictions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getInterdictionCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          this.allInterdictions.set(interdictions);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading interdictions:', err);
          this.error.set('Failed to load interdictions.');
          this.loading.set(false);
        },
      });
  }

  toggleSelection(interCode: string): void {
    const selected = new Set(this.selectedInterdictions());

    if (selected.has(interCode)) {
      selected.delete(interCode);
    } else {
      selected.add(interCode);
    }

    this.selectedInterdictions.set(selected);
  }

  isSelected(interCode: string): boolean {
    return this.selectedInterdictions().has(interCode);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onCommit(): void {
    const selected = this.selectedInterdictions();
    const selectedRecords = this.allInterdictions().filter(i => selected.has(i.interCode));
    this.dialogRef.close(selectedRecords);
  }
}
