import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSortModule, Sort } from '@angular/material/sort';
import { Subject, takeUntil } from 'rxjs';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { ProductsAvailableDialogData, ProductAvailableDto } from '../../models/initiate-hospital-transfer.model';
import { InitiateHospitalTransferApiService } from '../../services/initiate-hospital-transfer-api.service';
import { PrintTransferSlipDialogComponent } from '../print-transfer-slip-dialog/print-transfer-slip-dialog';

@Component({
  selector: 'app-products-available-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatSortModule],
  templateUrl: './products-available-dialog.html',
  styleUrls: ['./products-available-dialog.scss'],
})
export class ProductsAvailableDialogComponent {
  readonly data = inject<ProductsAvailableDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ProductsAvailableDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly apiService = inject(InitiateHospitalTransferApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  selection = new SelectionModel<ProductAvailableDto>(true, []);
  sortedProducts: ProductAvailableDto[] = [];

  constructor() {
    this.sortedProducts = [...(this.data.header.products ?? [])];
  }

  get maxSelectable(): number {
    return Math.min(this.data.header.quantityNeed, this.sortedProducts.length);
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.maxSelectable && this.maxSelectable > 0;
  }

  toggleProduct(product: ProductAvailableDto): void {
    if (this.selection.isSelected(product)) {
      this.selection.toggle(product);
      return;
    }
    if (this.selection.selected.length >= this.data.header.quantityNeed) {
      this.snackbarService.showError(
        `Error 0248: The number of selected products cannot exceed the remaining quantity (${this.data.header.quantityNeed}).`,
      );
      return;
    }
    this.selection.toggle(product);
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.clear();
      const toSelect = this.sortedProducts.slice(0, this.data.header.quantityNeed);
      this.selection.select(...toSelect);
      if (this.sortedProducts.length > this.data.header.quantityNeed) {
        this.snackbarService.showError(
          `Error 0248: The number of selected products cannot exceed the remaining quantity (${this.data.header.quantityNeed}).`,
        );
      }
    }
  }

  onSort(sort: Sort): void {
    const data = [...(this.data.header.products ?? [])];
    if (!sort.active || sort.direction === '') {
      this.sortedProducts = data;
    } else {
      this.sortedProducts = data.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        const valA = (a as unknown as Record<string, unknown>)[sort.active];
        const valB = (b as unknown as Record<string, unknown>)[sort.active];
        if (valA == null && valB == null) return 0;
        if (valA == null) return isAsc ? -1 : 1;
        if (valB == null) return isAsc ? 1 : -1;
        return (valA < valB ? -1 : valA > valB ? 1 : 0) * (isAsc ? 1 : -1);
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onPrintTransferSlip(): void {
    const confirmRef = this.dialog.open(PrintTransferSlipDialogComponent, {
      width: '420px',
      disableClose: true,
    });

    confirmRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.executePrintTransferSlip();
      }
    });
  }

  private executePrintTransferSlip(): void {
    const selectedUnitIds = this.selection.selected.map(p => p.unitId);
    this.apiService.printTransferSlip({
      orderNo: this.data.orderNo,
      itemNo: this.data.header.itemNo,
      unitIds: selectedUnitIds,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackbarService.showSuccess(
            `Transfer slip ${response.item?.transferSlipNumber ?? ''} generated successfully.`,
          );
          this.dialogRef.close(true);
        } else {
          const msg = response.errorResponse?.error || response.message || 'Failed to print transfer slip.';
          this.snackbarService.showError(msg);
        }
      },
      error: (error) => {
        this.snackbarService.showError(
          HttpErrorHandler.extractErrorMessage(error, 'Failed to print transfer slip.'),
        );
      },
    });
  }
}
