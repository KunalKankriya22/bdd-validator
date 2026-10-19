import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { TubesCheckInService } from '../../../modules/laboratory-functions/sample-management/regional-sample-tracking/tubes-check-in/services/tubes-check-in.service';
import { BatchUnitDto } from '../../../modules/laboratory-functions/sample-management/regional-sample-tracking/tubes-check-in/models/tubes-check-in.model';

export interface UnitInBatch {
  sequence: number;
  unitId: string;
  red1: string;
  red2: string;
  purple1: string;
  purple2: string;
}

/**
 * Units in Batch Panel Component
 * Displays all units already checked into a batch
 *
 * API Endpoint:
 * - GET /regional-tubes/batch-units/{batchId} - Get all units in batch
 */
@Component({
  selector: 'app-units-in-batch',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './units-in-batch.html',
  styleUrl: './units-in-batch.scss'
})
export class UnitsInBatchComponent implements OnInit, OnDestroy, OnChanges {
  private readonly tubesService = inject(TubesCheckInService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Input for API call parameter
  @Input() batchId: string | null = null;

  // Legacy input (for backward compatibility if data is passed directly)
  @Input() set units(value: UnitInBatch[]) {
    this._units.set(value || []);
  }

  @Output() closePanel = new EventEmitter<void>();

  // State signals
  _units = signal<UnitInBatch[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    if (this.batchId) {
      this.loadUnits();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload units when batchId changes
    if (changes['batchId'] && !changes['batchId'].firstChange) {
      if (this.batchId) {
        this.loadUnits();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Table configuration (data passed separately as input)
  tableConfig: DataTableConfig<UnitInBatch> = {
    columns: [
      {
        key: 'sequence',
        header: 'Sequence',
        sortable: true,
        width: '80px'
      },
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: false,
        width: 'auto'
        // Tooltip is automatically shown by DataTable when text overflows
      },
      {
        key: 'red1',
        header: 'Red 1',
        sortable: false,
        width: '100px'
      },
      {
        key: 'red2',
        header: 'Red 2',
        sortable: false,
        width: '100px'
      },
      {
        key: 'purple1',
        header: 'Purple 1',
        sortable: false,
        width: '100px'
      },
      {
        key: 'purple2',
        header: 'Purple 2',
        sortable: false,
        width: '100px'
      }
    ],
    showPagination: false,
    noDataIcon: 'inbox',
    emptyMessage: 'No units in this batch',
    loadingMessage: 'Loading units...',
    showTableOnEmpty: true
  };

  onClose(): void {
    this.closePanel.emit();
  }

  /**
   * Load units from API
   * API returns separate records for each tube type (RED1, RED2, PURPLE, SERUM)
   * We need to group them by osUnitId and map tube types to columns
   */
  private loadUnits(): void {
    if (!this.batchId) return;

    this.isLoading.set(true);

    this.tubesService.getBatchUnits(this.batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Group tube records by osUnitId
          const groupedUnits = this.groupTubesByUnit(data || []);

          this._units.set(groupedUnits);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading units:', error);
          this._units.set([]);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Group tube records by osUnitId and map tubeType to column format
   * Input: Array of BatchUnitDto with tubeType (RED1, RED2, PURPLE, SERUM)
   * Output: Array of UnitInBatch with red1, red2, purple1, purple2 columns showing 'Y' or 'N'
   */
  private groupTubesByUnit(tubeRecords: BatchUnitDto[]): UnitInBatch[] {
    // Group by osUnitId
    const unitMap = new Map<string, UnitInBatch>();

    tubeRecords.forEach(tube => {
      const unitId = tube.osUnitId;

      // Get or create unit entry with default 'N' for all tubes
      if (!unitMap.has(unitId)) {
        unitMap.set(unitId, {
          sequence: 0, // Will be assigned later
          unitId: unitId,
          red1: 'N',
          red2: 'N',
          purple1: 'N',
          purple2: 'N'
        });
      }

      const unit = unitMap.get(unitId)!;

      // Map tubeType to appropriate column - set to 'Y' if present
      switch (tube.tubeType) {
        case 'RED1':
          unit.red1 = 'Y';
          break;
        case 'RED2':
          unit.red2 = 'Y';
          break;
        case 'PURPLE':
          unit.purple1 = 'Y';
          break;
        case 'SERUM':
          unit.purple2 = 'Y'; // SERUM maps to purple2 column
          break;
      }
    });

    // Convert map to array and assign sequence numbers
    const unitsArray = Array.from(unitMap.values());
    return unitsArray.map((unit, index) => ({
      ...unit,
      sequence: index + 1
    }));
  }
}
