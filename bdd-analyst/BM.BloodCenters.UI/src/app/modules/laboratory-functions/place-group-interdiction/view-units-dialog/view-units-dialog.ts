import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent } from '@shared/interfaces/data-table.interface';
import { GroupInterdictionApiService } from '../services/group-interdiction-api.service';
import { AffectedUnitsDto, ControlMode } from '../models/group-interdiction.model';

/**
 * View Units Panel Component
 * Slide-out panel displaying units affected by interdiction placement
 */
@Component({
  selector: 'app-view-units-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable,
  ],
  templateUrl: './view-units-dialog.html',
  styleUrl: './view-units-dialog.scss',
})
export class ViewUnitsDialog implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `view-units-panel-${ViewUnitsDialog.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly apiService = inject(GroupInterdictionApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  readonly controlMode = input.required<ControlMode>();
  readonly selectionValue = input.required<string>();
  readonly closed = output<void>();

  protected readonly units = signal<AffectedUnitsDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected readonly hasUnits = computed(() => this.units().length > 0);
  protected readonly isEmpty = computed(() => !this.loading() && this.units().length === 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());

  tableConfig: DataTableConfig<AffectedUnitsDto> = {
    columns: [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: false,
        valueFormatter: (value, row) => {
          return row.chkDigit ? `${row.unitId}-${row.chkDigit}` : row.unitId;
        },
      },
      {
        key: 'collDate',
        header: 'Collection Date',
        sortable: false,
        valueFormatter: (value) => this.formatDate(value),
      },
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No units found for this group.',
    loadingMessage: 'Loading units...',
    caption: 'Units in this group',
    rowLabelKey: 'unitId',
  };

  tableData: AffectedUnitsDto[] = [];

  ngOnInit(): void {
    this.loadAffectedUnits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected loadAffectedUnits(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .previewAffectedUnits(this.controlMode(), this.selectionValue())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.units.set(units);
          this.tableData = units;
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading affected units:', err);
          this.error.set('Failed to load affected units.');
          this.loading.set(false);
        },
      });
  }

  protected onClearAll(): void {
    this.units.set([]);
    this.tableData = [];
    this.snackbarService.showInfo('All units have been cleared from the preview.');
  }

  protected onCancel(): void {
    this.closed.emit();
  }

  protected formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateStr;
  }
}
