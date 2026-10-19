import { Component, Input, Output, EventEmitter, computed, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { DeliveredShipmentDto, PickSlipItem } from '../../models/delivered-shipments.model';

@Component({
  selector: 'app-view-additional-shipment-details',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, DataTable],
  templateUrl: './view-additional-shipment-details.html',
  styleUrl: './view-additional-shipment-details.scss',
})
export class ViewAdditionalShipmentDetailsComponent implements OnChanges {
  @Input() shipment: DeliveredShipmentDto | null = null;
  @Output() closePanel = new EventEmitter<void>();

  readonly pickSlipData = signal<PickSlipItem[]>([]);

  readonly pickSlipTableConfig = computed<DataTableConfig<PickSlipItem>>(() => {
    const count = this.pickSlipData().length;
    return {
      columns: [
        {
          key: 'pickSlipId',
          header: `Pick Slip ID (${count})`,
          sortable: false,
        },
      ],
      showPagination: false,
      stickyHeader: false,
      emptyMessage: 'No pick slip IDs available',
    };
  });

  ngOnChanges(): void {
    if (this.shipment?.products) {
      const ids = Array.from(new Set(this.shipment.products.map((p) => p.pickSlipId)))
        .filter((id) => id && id.trim() !== '');
      this.pickSlipData.set(ids.map((id) => ({ pickSlipId: id })));
    } else {
      this.pickSlipData.set([]);
    }
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }

  onClose(): void {
    this.closePanel.emit();
  }
}
