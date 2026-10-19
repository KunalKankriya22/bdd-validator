import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';

import { SpProductsSpecialProcessesApiService } from './services/sp-products-special-processes-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  ProductType,
  SpProductModel,
  SpProductQueryParamsDto,
  SpProductCreateDto,
  SpProductUpdateDto,
  SpProductFormValue,
  LookUp,
} from './models/sp-products-special-processes.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import {
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';
import { HeaderService } from '@shared/services/header.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';

import { SpProductsTableComponent } from './components/sp-products-table/sp-products-table.component';
import { SpProductListComponent } from './components/sp-product-list/sp-product-list.component';
import { AddEditSpProductComponent } from './add-edit-sp-product/add-edit-sp-product';

@Component({
  selector: 'app-sp-products-special-processes',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    SearchBar,
    SpProductsTableComponent,
    SpProductListComponent
  ],
  templateUrl: './sp-products-special-processes.component.html',
  styleUrls: ['./sp-products-special-processes.component.scss']
})
export class SpProductsSpecialProcessesComponent implements OnInit, OnDestroy {
  searchConfig: SearchBarConfig = {
    placeholder: 'Search by process code or description',
    minLength: 1,
    ariaLabel: 'Search product types',
    searchOnEnterOnly: true
  };

  allProductTypes: ProductType[] = [];
  productTypes: ProductType[] = [];
  selectedProductType: ProductType | null = null;
  filteredProducts: SpProductModel[] = [];
  requestState: SpProductQueryParamsDto = {};

  productCodeOptions: LookUp[] = [];

  isLoadingProducts = false;
  isLoadingProcessCodes = false;
  hasError = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private service: SpProductsSpecialProcessesApiService,
    private loggingService: LoggingService,
    private snackbarService: SnackbarService,
    private headerService: HeaderService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProcessCodes();
    this.loadProductCodeOptions();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedProductType = null;
        this.filteredProducts = [];
        this.loadProcessCodes();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProcessCodes(): void {
    this.isLoadingProcessCodes = true;
    this.service.getProcessCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (processCodes) => {
          this.allProductTypes = processCodes.map(pc => ({
            code: pc.code,
            description: pc.name,
          }));
          this.productTypes = [...this.allProductTypes];
          this.isLoadingProcessCodes = false;

          if (this.productTypes.length > 0 && !this.selectedProductType) {
            this.onProductTypeSelected(this.productTypes[0]);
          }
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading process codes', error);
          this.isLoadingProcessCodes = false;
        }
      });
  }

  private loadProductCodeOptions(): void {
    this.service.getProductCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.productCodeOptions = codes;
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading product code options', error);
        }
      });
  }

  onProductTypeSelected(productType: ProductType): void {
    this.selectedProductType = productType;
    this.loadProducts();
  }

  loadProducts(): void {
    if (!this.selectedProductType) return;

    this.isLoadingProducts = true;
    this.hasError = false;

    const params: SpProductQueryParamsDto = {
      processCode: this.selectedProductType.code,
      searchKeyword: this.requestState.searchKeyword || null,
      sortColumn: this.requestState.sortColumn || null,
      sortOrder: this.requestState.sortOrder || null,
    };

    this.service
      .getProducts(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.filteredProducts = response.data;
          this.isLoadingProducts = false;
        },
        error: (error: unknown) => {
          this.loggingService.error('Error loading products', error);
          this.hasError = true;
          this.isLoadingProducts = false;
          this.errorMessage = 'Failed to load data. Please try again.';
        }
      });
  }

  onProductTypeSearch(searchText: string): void {
    if (!searchText) {
      this.productTypes = [...this.allProductTypes];
      return;
    }

    const searchLower = searchText.toLowerCase();
    this.productTypes = this.allProductTypes.filter(type =>
      type.code.toLowerCase().includes(searchLower) ||
      type.description.toLowerCase().includes(searchLower)
    );
  }

  onProductSearch(searchText: string): void {
    this.requestState.searchKeyword = searchText || null;
    this.loadProducts();
  }

  onSortChange(event: TableSortEvent): void {
    this.requestState.sortColumn = event.column;
    this.requestState.sortOrder =
      event.direction === 'default' ? undefined : (event.direction === 'A' ? 'ASC' : 'DESC');
    this.loadProducts();
  }

  onRowAction(event: TableRowActionEvent<SpProductModel>): void {
    if (event.action === 'edit') {
      this.onEditProduct(event.row);
    }
  }

  onAddProduct(): void {
    (document.activeElement as HTMLElement)?.blur();

    const dialogRef = this.dialog.open(AddEditSpProductComponent, {
      width: '745px',
      height: '100vh',
      maxWidth: '100vw',
      position: { right: '0' },
      disableClose: true,
      panelClass: 'side-panel-dialog',
      hasBackdrop: true,
      data: null,
      autoFocus: false
    });

    const instance = dialogRef.componentInstance;
    instance.mode = 'add';
    instance.productCodeOptions = this.productCodeOptions;

    instance.save
      .pipe(takeUntil(this.destroy$))
      .subscribe((formValue: SpProductFormValue) => {
        this.handleSave(formValue, dialogRef, false);
      });

    instance.saveAndCreateAnother
      .pipe(takeUntil(this.destroy$))
      .subscribe((formValue: SpProductFormValue) => {
        this.handleSave(formValue, dialogRef, true);
      });

    instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => dialogRef.close());
  }

  onEditProduct(row: SpProductModel): void {
    (document.activeElement as HTMLElement)?.blur();

    const dialogRef = this.dialog.open(AddEditSpProductComponent, {
      width: '745px',
      height: '100vh',
      maxWidth: '100vw',
      position: { right: '0' },
      disableClose: true,
      panelClass: 'side-panel-dialog',
      hasBackdrop: true,
      data: null,
      autoFocus: false
    });

    const instance = dialogRef.componentInstance;
    instance.mode = 'edit';
    instance.data = row;
    instance.productCodeOptions = this.productCodeOptions;

    instance.save
      .pipe(takeUntil(this.destroy$))
      .subscribe((formValue: SpProductFormValue) => {
        this.handleUpdate(row, formValue, dialogRef);
      });

    instance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => dialogRef.close());
  }

  private handleSave(formValue: SpProductFormValue, dialogRef: any, createAnother: boolean): void {
    const payload: SpProductCreateDto = {
      processCode: this.selectedProductType?.code || '',
      productCode: formValue.productCode,
      attribGroup: formValue.attribGroup || null,
      attribCode: formValue.attribCode || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate)!,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? null
    };

    this.service.createProduct(payload).subscribe({
      next: () => {
        this.snackbarService.showSuccess('Product has been successfully added.');
        this.loadProducts();

        if (createAnother) {
          dialogRef.componentInstance.form.reset();
          dialogRef.componentInstance.isSubmitting = false;
        } else {
          dialogRef.close();
        }
      },
      error: (error: any) => {
        dialogRef.componentInstance.isSubmitting = false;
        const errorMessage = error.error?.message || error.message || 'Failed to add product. Please try again.';
        dialogRef.componentInstance.errorMessage = errorMessage;
        dialogRef.componentInstance.cdr.markForCheck();
      }
    });
  }

  private handleUpdate(row: SpProductModel, formValue: SpProductFormValue, dialogRef: any): void {
    const payload: SpProductUpdateDto = {
      attribGroup: formValue.attribGroup || null,
      attribCode: formValue.attribCode || null,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate)!,
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate) ?? null
    };

    this.service.updateProduct(
      row.processCode,
      row.productCode,
      payload,
      row.attribGroup,
      row.attribCode
    ).subscribe({
      next: () => {
        dialogRef.close();
        this.snackbarService.showSuccess('Product has been successfully updated.');
        this.loadProducts();
      },
      error: (error: any) => {
        dialogRef.componentInstance.isSubmitting = false;
        const errorMessage = error.error?.message || error.message || 'Failed to update product. Please try again.';
        dialogRef.componentInstance.errorMessage = errorMessage;
        dialogRef.componentInstance.cdr.markForCheck();
      }
    });
  }
}
