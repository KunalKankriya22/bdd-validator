import { Component, ChangeDetectionStrategy, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataTable } from '@shared/components/data-table/data-table';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { DataTableConfig, TableColumn, TableSortEvent, SortConfig } from '@shared/interfaces/data-table.interface';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DonorListItem, DonorInterdictionRow } from '../../../models/interdiction-query.model';

@Component({
  selector: 'app-donor-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    DataTable,
    SearchBar
  ],
  templateUrl: './donor-detail-panel.component.html',
  styleUrls: ['./donor-detail-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonorDetailPanelComponent {
  donor = input<DonorListItem | null>(null);

  codeSearchText = signal<string>('');
  currentSort = signal<SortConfig>({ column: '', direction: 'default' });

  filteredInterdictions = computed((): DonorInterdictionRow[] => {
    const donor = this.donor();
    if (!donor) return [];
    const search = this.codeSearchText().toLowerCase();
    let rows = donor.interdictions;
    if (search) {
      rows = rows.filter(row =>
        row.interCode.toLowerCase().includes(search)
      );
    }
    const sort = this.currentSort();
    if (sort.column === 'interCode' && sort.direction !== 'default') {
      rows = [...rows].sort((a, b) => {
        const cmp = a.interCode.localeCompare(b.interCode);
        return sort.direction === 'A' ? cmp : -cmp;
      });
    }
    return rows;
  });

  interdictionTableConfig: DataTableConfig<DonorInterdictionRow> = {
    columns: this.buildColumns(),
    stickyHeader: true,
    showPagination: false,
    showActionsAsMenu: false,
    emptyMessage: 'No interdiction records found',
    emptySubMessage: 'Select a donor to view interdiction details.',
    noDataIcon: 'search',
    enableRowHighlight: false,
    showTableOnEmpty: true
  };

  onCodeSearch(searchTerm: string): void {
    this.codeSearchText.set(searchTerm);
  }

  onSortChange(event: TableSortEvent): void {
    this.currentSort.set({ column: event.column, direction: event.direction });
    this.interdictionTableConfig = {
      ...this.interdictionTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '';
    return DateFieldValidationUtility.formatDateForUI(new Date(date))?.toUpperCase() || '';
  }

  private emptyIfNull = (value: string): string => value || ' ';

  private buildColumns(): TableColumn<DonorInterdictionRow>[] {
    return [
      {
        key: 'interCode',
        header: 'Code',
        sortable: true,
        valueFormatter: this.emptyIfNull
      },
      {
        key: 'origin',
        header: 'Origin',
        sortable: false,
        valueFormatter: this.emptyIfNull
      },
      {
        key: 'reason',
        header: 'Reason',
        sortable: false,
        valueFormatter: this.emptyIfNull
      },
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        sortable: false,
        valueFormatter: (value: string) => this.formatDate(value) || ' '
      },
      {
        key: 'terminationDate',
        header: 'Termination Date',
        sortable: false,
        valueFormatter: (value: string) => this.formatDate(value) || ' '
      },
      {
        key: 'mode',
        header: 'Mode',
        sortable: false,
        valueFormatter: this.emptyIfNull
      },
      {
        key: 'gpValue',
        header: 'GP Value',
        sortable: false,
        valueFormatter: this.emptyIfNull
      }
    ];
  }
}
