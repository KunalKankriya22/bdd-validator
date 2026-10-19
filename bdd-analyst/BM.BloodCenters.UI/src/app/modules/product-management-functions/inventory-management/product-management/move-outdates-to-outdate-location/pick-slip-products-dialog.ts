import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

import { PickSlipProductDto } from './move-outdates-to-outdate-location.model';
import { MoveOutdatesToOutdateLocationService } from './move-outdates-to-outdate-location.service';

export interface PickSlipProductsDialogData {
  pickSlipId: string;
}

@Component({
  selector: 'app-pick-slip-products-dialog',
  standalone: true,
  imports: [
    CommonModule,
    SidePanelBase,
    DataTable,
    MatProgressSpinnerModule,
  ],
  template: `
    <app-side-panel-base
      title="Products on Pick Slip"
      width="100%"
      [footerButtons]="footerButtons"
      (closePanel)="onClose()"
      (buttonClick)="onFooterButtonClick($event)">

      <ng-container panelContent>
        <app-data-table
          [config]="tableConfig"
          [data]="products()"
          [loading]="isLoading()">
        </app-data-table>
      </ng-container>
    </app-side-panel-base>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    :host ::ng-deep .side-panel-wrapper {
      height: 100%;
      max-height: 100%;
    }
  `],
})
export class PickSlipProductsDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<PickSlipProductsDialogComponent>);
  private readonly data = inject<PickSlipProductsDialogData>(MAT_DIALOG_DATA);
  private readonly service = inject(MoveOutdatesToOutdateLocationService);
  private readonly destroy$ = new Subject<void>();

  products = signal<PickSlipProductDto[]>([]);
  isLoading = signal(false);

  tableConfig: DataTableConfig<PickSlipProductDto> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false, type: 'text', minWidth: '100px' },
      { key: 'product', header: 'Product', sortable: false, type: 'text', minWidth: '100px' },
      { key: 'checkDigit', header: 'Check Digit', sortable: false, type: 'text', minWidth: '80px' },
      { key: 'status', header: 'Status', sortable: false, type: 'text', minWidth: '80px' },
    ],
    stickyHeader: true,
    enableRowHighlight: false,
    showPagination: false,
    emptyMessage: 'No products found on this pick slip.',
  };

  footerButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary' },
  ];

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    this.service
      .getProductsOnPickSlip(this.data.pickSlipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.isLoading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.isLoading.set(false);
        },
      });
  }

  onFooterButtonClick(action: string): void {
    if (action === 'close') {
      this.onClose();
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
