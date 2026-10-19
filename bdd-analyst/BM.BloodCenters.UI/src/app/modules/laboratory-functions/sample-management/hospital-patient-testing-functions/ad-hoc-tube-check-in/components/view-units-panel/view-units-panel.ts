import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DataTable } from '@shared/components/data-table/data-table';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { AdhocBatchUnitDto } from '../../models/ad-hoc-tube-check-in.model';
import { AdHocTubeCheckInService } from '../../services/ad-hoc-tube-check-in.service';

@Component({
  selector: 'app-view-units-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    SidePanelBase,
    DataTable,
  ],
  templateUrl: './view-units-panel.html',
  styleUrls: ['./view-units-panel.scss'],
})
export class ViewUnitsPanelComponent implements OnInit, OnDestroy {
  @Input() batchId = '';

  @Output() close = new EventEmitter<void>();

  private readonly destroy$ = new Subject<void>();
  private readonly service = inject(AdHocTubeCheckInService);

  isLoading = signal(false);
  units = signal<AdhocBatchUnitDto[]>([]);

  private readonly tubeValueFormatter = (val: any) => {
    if (!val) return '';
    const map: Record<string, string> = { Y: 'Yes', P: 'Plasma', S: 'Serum' };
    return map[val] ?? val;
  };

  tableConfig: DataTableConfig<AdhocBatchUnitDto> = {
    columns: [
      { key: 'displayUnitId', header: 'Unit ID', sortable: false, width: '40%' },
      { key: 'redTubeFlag', header: 'Red 1', sortable: false, width: '15%', valueFormatter: this.tubeValueFormatter },
      { key: 'redTube2', header: 'Red 2', sortable: false, width: '15%', valueFormatter: this.tubeValueFormatter },
      { key: 'purpleTubeFlag', header: 'Purple 1', sortable: false, width: '15%', valueFormatter: this.tubeValueFormatter },
      { key: 'serumPlasmaInd', header: 'Purple 2', sortable: false, width: '15%', valueFormatter: this.tubeValueFormatter },
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No units in this batch',
    showTableOnEmpty: true,
  };

  footerButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary' },
  ];

  ngOnInit(): void {
    this.loadUnits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUnits(): void {
    if (!this.batchId) return;
    this.isLoading.set(true);
    this.service.getUnitsInBatch(this.batchId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: units => {
          this.units.set(units);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onButtonClick(_action: string): void {
    this.close.emit();
  }

  onClosePanel(): void {
    this.close.emit();
  }
}
