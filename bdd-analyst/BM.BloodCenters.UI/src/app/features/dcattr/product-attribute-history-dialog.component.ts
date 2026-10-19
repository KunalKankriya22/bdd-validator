import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DcattrService } from './dcattr.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ProductAttributeLogDto } from './dcattr.models';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { formatTableDate } from '@shared/utils/date-format.util';

export interface ProductAttributeHistoryDialogData {
  unitId: string;
  collDate: string;
  productCode: string;
}

@Component({
  selector: 'app-product-attribute-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './product-attribute-history-dialog.component.html',
  styleUrl: './product-attribute-history-dialog.component.scss'
})
export class ProductAttributeHistoryDialogComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `history-dialog-${ProductAttributeHistoryDialogComponent.nextId++}`;

  readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly dcattrService = inject(DcattrService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialogRef = inject(MatDialogRef<ProductAttributeHistoryDialogComponent>);
  private readonly destroy$ = new Subject<void>();

  readonly data: ProductAttributeHistoryDialogData = inject(MAT_DIALOG_DATA);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  historyData: ProductAttributeLogDto[] = [];

  tableConfig: DataTableConfig<ProductAttributeLogDto> = {
    columns: [
      { key: 'oldProductCode', header: 'Initial Product', minWidth: '120px' },
      { key: 'attribCode', header: 'Attribute Added', minWidth: '120px' },
      { key: 'newProductCode', header: 'Changed Product', minWidth: '120px' },
      {
        key: 'attribDate', header: 'Attribute Added On', minWidth: '160px',
        valueFormatter: (value: string) => formatTableDate(value)
      },
      {
        key: 'insertDate', header: 'Initial Change On', minWidth: '160px',
        valueFormatter: (value: string) => formatTableDate(value)
      }
    ],
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: false,
    showTableOnEmpty: true,
  };

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dcattrService.getAttributeHistory(this.data.unitId, this.data.collDate, this.data.productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.historyData = history;
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load attribute history');
          this.loading.set(false);
          this.snackbarService.showError(err.message || 'Failed to load attribute history');
        }
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
