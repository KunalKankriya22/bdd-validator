import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  EquipmentStatusItem,
  EquipmentStatisticsDto,
  DowntimePeriodDto,
} from '../models/status-and-history-query.model';
import { EquipmentStatusQueryApiService } from '../services/equipment-status-query-api.service';

@Component({
  selector: 'app-equipment-statistics-panel',
  standalone: true,
  imports: [CommonModule, A11yModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './equipment-statistics-panel.html',
  styleUrls: ['./equipment-statistics-panel.scss'],
})
export class EquipmentStatisticsPanel implements OnChanges {
  @Input() row: EquipmentStatusItem | null = null;
  @Input() isOpen = false;
  @Output() closePanel = new EventEmitter<void>();

  private readonly apiService = inject(EquipmentStatusQueryApiService);

  statistics: EquipmentStatisticsDto | null = null;
  isLoading = false;

  private readonly emptyPeriod: DowntimePeriodDto = {
    daysInService: 0, eventCount: 0, totalDowntimeHours: 0, percentAvailable: 0,
  };

  ngOnChanges(): void {
    if (this.row && this.isOpen) {
      this.loadStatistics(this.row);
    }
  }

  private loadStatistics(row: EquipmentStatusItem): void {
    this.isLoading = true;
    this.apiService.getStatistics(row.equipType, row.equipId, row.equipReference)
      .subscribe({
        next: (res) => {
          this.statistics = res.data?.[0] ?? null;
          this.isLoading = false;
        },
        error: () => {
          this.statistics = {
            equipType: row.equipType, equipTypeDescription: null,
            equipId: row.equipId, equipReference: row.equipReference,
            firstProductionDate: null,
            monthToDate: this.emptyPeriod, previousMonth: this.emptyPeriod,
            yearToDate: this.emptyPeriod, previousYear: this.emptyPeriod,
          };
          this.isLoading = false;
        },
      });
  }

  close(): void {
    this.closePanel.emit();
  }
}
