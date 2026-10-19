import { Component, EventEmitter, HostListener, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { AntigenDto, AntigenSelection } from '../../models/abo-labeling-antigens.model';

type AntigenRow = AntigenDto & { printValue: string };

@Component({
  selector: 'app-antigen-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    DataTable,
  ],
  templateUrl: './antigen-dialog.component.html',
  styleUrls: ['./antigen-dialog.component.scss'],
})
export class AntigenPanelComponent {
  @ViewChild('resultCellTemplate', { static: true }) resultCellTemplate!: TemplateRef<any>;
  @ViewChild('printCellTemplate', { static: true }) printCellTemplate!: TemplateRef<any>;

  @Input() set antigens(value: AntigenDto[]) {
    this.antigenRows = value.map((ag) => ({
      ...ag,
      printValue: 'N',
    }));
    this.buildTableConfig();
  }

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<AntigenSelection[]>();

  antigenRows: AntigenRow[] = [];
  tableConfig!: DataTableConfig<AntigenRow>;

  private buildTableConfig(): void {
    this.tableConfig = {
      columns: [
        { key: 'antigenCode', header: 'Antigen', width: '100px' },
        { key: 'antigenResult', header: 'Antigen Result', width: '140px', cellTemplate: this.resultCellTemplate },
        {
          key: 'confirmed', header: 'Confirmed', width: '120px',
          valueFormatter: (value: any) => value ? 'Yes' : '-',
        },
        {
          key: 'currentDonationTested', header: 'Current Donation Tested', width: '180px',
          valueFormatter: (value: any) => value ? 'Yes' : '-',
        },
        {
          key: 'unlicensedUnapproved', header: 'Unlicensed / Unapproved',
          valueFormatter: (value: any) => value || '-',
        },
        { key: 'printValue', header: 'Print', width: '100px', cellTemplate: this.printCellTemplate },
      ],
      showPagination: false,
      noDataIcon: 'search',
    };
  }

  @HostListener('keydown.escape')
  onEscapeKey(): void {
    this.onClose();
  }

  onClose(): void {
    this.closed.emit();
  }

  onSave(): void {
    const selections: AntigenSelection[] = this.antigenRows
      .filter((ag) => ag.printValue === 'Y')
      .map((ag) => ({ antigenCode: ag.antigenCode, print: true }));
    this.saved.emit(selections);
  }
}
