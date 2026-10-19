import { Component, OnInit, OnDestroy, Inject, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, isObservable } from 'rxjs';

import { LookupDialogConfig, LookupDialogResult } from './generic-lookup-dialog.model';

@Component({
  selector: 'app-generic-lookup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './generic-lookup-dialog.html',
  styleUrls: ['./generic-lookup-dialog.scss']
})
export class GenericLookupDialog<T = any> implements OnInit, OnDestroy {
  private static nextId = 0;
  public readonly componentId = `generic-lookup-dialog-${GenericLookupDialog.nextId++}`;

  public readonly elementId = (name: string) => `${this.componentId}-${name}`;
  public readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  public readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private dialogRef = inject(MatDialogRef<GenericLookupDialog<T>>);
  private destroy$ = new Subject<void>();

  public config: LookupDialogConfig<T>;

  allData = signal<T[]>([]);
  filteredData = signal<T[]>([]);
  selectedItem = signal<T | null>(null);
  isLoading = signal(false);

  hasSelection = computed(() => this.selectedItem() !== null);
  isSingleSelection = computed(() => this.config.selectionMode === 'single');
  enableSearch = computed(() => !!this.config.searchFields && this.config.searchFields.length > 0);

  displayedColumns: string[] = [];

  searchControl = new FormControl('');
  searchConfig: { placeholder?: string; minLength?: number; ariaLabel?: string } = {};

  constructor(@Inject(MAT_DIALOG_DATA) data: LookupDialogConfig<T>) {
    this.config = {
      ...data,
      emptyMessage: data.emptyMessage || 'No data found',
      loadingMessage: data.loadingMessage || 'Loading...'
    };

    if (this.config.searchConfig) {
      this.searchConfig = { ...this.searchConfig, ...this.config.searchConfig };
    }

    this.searchControl.valueChanges.subscribe(value => {
      if (!value) {
        this.onSearch('');
      }
    });

    const columnKeys = this.config.columns.map(c => c.key as string);
    this.displayedColumns = this.config.selectionMode === 'single'
      ? ['select', ...columnKeys]
      : columnKeys;

  }

  ngOnInit(): void {
    this.loadData();
    if (this.config.initialSearchTerm) {
      this.searchControl.setValue(this.config.initialSearchTerm);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    if (isObservable(this.config.data)) {
      this.isLoading.set(true);
      this.config.data
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.allData.set(data);
            this.applyInitialFilter(data);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Failed to load lookup data:', error);
            this.isLoading.set(false);
          }
        });
    } else {
      this.allData.set(this.config.data);
      this.applyInitialFilter(this.config.data);
    }
  }

  private applyInitialFilter(data: T[]): void {
    const term = this.config.initialSearchTerm;
    if (term && this.config.searchFields) {
      this.onSearch(term);
    } else {
      this.filteredData.set(data);
    }
  }

  onSearch(searchText: string): void {
    if (!this.config.searchFields || !searchText) {
      this.filteredData.set(this.allData());
      return;
    }

    const search = searchText.toLowerCase();
    const filtered = this.allData().filter(item => {
      return this.config.searchFields!.some(field => {
        const value = (item as any)[field];
        return value && String(value).toLowerCase().includes(search);
      });
    });

    this.filteredData.set(filtered);
  }

  getDisplayValue(row: T, col: any): string {
    const value = (row as any)[col.key];
    if (this.config.formatters && this.config.formatters[col.key as string]) {
      return this.config.formatters[col.key as string](value);
    }
    return value ?? '–';
  }

  onSelectItem(item: T): void {
    this.selectedItem.set(item);
  }

  isSelected(item: T): boolean {
    const selected = this.selectedItem();
    if (!selected) return false;
    return (selected as any)[this.config.selectionKey] === (item as any)[this.config.selectionKey];
  }

  onRowDoubleClick(item: T): void {
    if (this.config.selectionMode === 'single') {
      this.selectedItem.set(item);
      this.onContinue();
    }
  }

  onContinue(): void {
    const selected = this.selectedItem();
    if (!selected) return;

    const result: LookupDialogResult<T> = {
      cancelled: false,
      selectedItem: selected
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    const result: LookupDialogResult<T> = { cancelled: true };
    this.dialogRef.close(result);
  }
}
