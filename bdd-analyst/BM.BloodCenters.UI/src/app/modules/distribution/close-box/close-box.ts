import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { CloseBoxService } from './services/close-box.service';
import { CloseBoxDto, BoxProductTableRow, AvailableBoxDto } from './models/close-box.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { CreateNewBoxDialogComponent, CreateNewBoxDialogData, CreateNewBoxDialogResult } from '../offline-product-packing/create-new-box-dialog/create-new-box-dialog';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-close-box',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule,
    MatAutocompleteModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './close-box.html',
  styleUrls: ['./close-box.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      }
    }
  ]
})
export class CloseBoxComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `close-box-${CloseBoxComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly closeBoxService = inject(CloseBoxService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly boxDetails = signal<CloseBoxDto | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);
  protected readonly availableBoxes = signal<AvailableBoxDto[]>([]);
  protected readonly loadingAvailableBoxes = signal<boolean>(false);

  // Barcode scan detection
  private scanBuffer = '';
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  // Form control
  boxIdControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(10)
  ]);

  // Computed values
  protected readonly hasBoxDetails = computed(() => this.boxDetails() !== null);
  protected readonly canCloseBox = computed(() => {
    const box = this.boxDetails();
    return box && box.boxStatus === 'OP' && box.productCount > 0;
  });

  protected readonly filteredBoxes = computed(() => {
    const boxes = this.availableBoxes();
    const filterValue = (this.boxIdControl.value || '').toUpperCase();
    if (!filterValue) return boxes;
    return boxes.filter(b => b.boxId.toUpperCase().includes(filterValue));
  });

  // Table configuration
  displayedColumns: string[] = [
    'pickSlipId',
    'itemNo',
    'unitId',
    'productType',
    'product',
    'orderedAboRh',
    'expirationDate'
  ];

  // Pagination
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];
  pageIndex = 0;

  protected readonly tableData = computed<BoxProductTableRow[]>(() => {
    const box = this.boxDetails();
    if (!box || !box.products) {
      return [];
    }

    return box.products.map(product => ({
      pickSlipId: product.pickSlipId,
      itemNo: product.itemNo,
      unitId: product.unitId,
      productType: product.productType || '',
      product: product.productCode,
      orderedAboRh: product.aboDescription || product.bloodType,
      expirationDate: product.expirationDate
    }));
  });

  protected readonly paginatedData = computed<BoxProductTableRow[]>(() => {
    const data = this.tableData();
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return data.slice(startIndex, endIndex);
  });

  protected readonly totalProducts = computed(() => this.tableData().length);

  headerConfig: PageHeaderConfig = {
    title: 'Close Box',
    subtitle: 'Close an open box after it has been packed and is ready to ship.',
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Close Box', link: '/distribution/close-box' }
    ]
  };

  ngOnInit(): void {
    this.boxIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.boxDetails()) {
          this.boxDetails.set(null);
          this.pageIndex = 0;
        }
      });

    this.loadAvailableBoxes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
  }

  loadAvailableBoxes(): void {
    this.loadingAvailableBoxes.set(true);
    this.closeBoxService.getAvailableBoxes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (boxes) => {
          this.availableBoxes.set(boxes);
          this.loadingAvailableBoxes.set(false);
        },
        error: () => {
          this.loadingAvailableBoxes.set(false);
        }
      });
  }

  onAutocompleteSelected(event: MatAutocompleteSelectedEvent): void {
    const boxId = event.option.value;
    this.boxIdControl.setValue(boxId);
    this.onSearchBox();
  }

  displayBoxId(boxId: string): string {
    return boxId || '';
  }

  onBoxIdInput(event: Event): void {
    const inputEvent = event as InputEvent;
    const value = (event.target as HTMLInputElement).value;

    if (inputEvent.inputType === 'insertText' || inputEvent.inputType === 'insertFromPaste') {
      this.scanBuffer += inputEvent.data || '';

      if (this.scanTimeout) {
        clearTimeout(this.scanTimeout);
      }

      this.scanTimeout = setTimeout(() => {
        if (this.scanBuffer.length >= 14) {
          this.handleBarcodeScan(value);
        }
        this.scanBuffer = '';
      }, 100);
    }
  }

  private handleBarcodeScan(scanValue: string): void {
    this.loading.set(true);
    this.closeBoxService.validateBoxScan(scanValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.isValid) {
            this.boxIdControl.setValue(result.boxId);
            this.onSearchBox();
          } else {
            this.loading.set(false);
            this.snackbarService.showError('Scanned box is not in open status');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err.message || 'Failed to validate scan');
        }
      });
  }

  onSearchBox(): void {
    if (this.boxIdControl.invalid || !this.boxIdControl.value) {
      this.boxIdControl.markAsTouched();
      return;
    }

    const boxId = this.boxIdControl.value.trim();
    this.loading.set(true);

    this.boxDetails.set(null);
    this.pageIndex = 0;

    this.closeBoxService.getBoxDetails(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.boxDetails.set(data);
          this.loading.set(false);

          if (data.boxStatus === 'CL') {
            this.snackbarService.showError('Box has already been closed');
          } else if (data.boxStatus !== 'OP') {
            this.snackbarService.showError('Box is not in open status');
          } else if (data.productCount === 0) {
            this.snackbarService.showError('No products found in box');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err.message || 'Failed to retrieve box details');
        }
      });
  }

  onBoxIdKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSearchBox();
    }
  }

  onCloseBox(): void {
    if (!this.canCloseBox()) {
      return;
    }

    const dialogData: CreateNewBoxDialogData = {
      currentBoxId: this.boxIdControl.value,
      hasPackedProducts: (this.boxDetails()?.productCount ?? 0) > 0,
      dialogTitle: 'Close Box',
      showCurrentBoxInfo: false,
      validationMessage: 'Current box cannot be closed if it is not packed properly.',
      confirmButtonText: 'CLOSE BOX'
    };

    const dialogRef = this.dialog.open(CreateNewBoxDialogComponent, {
      width: '480px',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: CreateNewBoxDialogResult | null) => {
        if (result?.closeCurrentBox) {
          this.executeCloseBox();
        } else {
          this.resetForm();
        }
      });
  }

  private executeCloseBox(): void {
    const boxId = this.boxIdControl.value?.trim();
    if (!boxId) {
      return;
    }

    this.submitting.set(true);

    this.closeBoxService.closeBox(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          this.snackbarService.showSuccess(
            result.message || `Box ${result.boxId} closed successfully with ${result.productsProcessed} products`
          );
          this.resetForm();
          this.loadAvailableBoxes();
        },
        error: (err) => {
          this.submitting.set(false);
          this.snackbarService.showError(err.message || 'Failed to close box');
        }
      });
  }

  onCancel(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.boxIdControl.reset();
    this.boxDetails.set(null);

    this.loading.set(false);
    this.submitting.set(false);
    this.pageIndex = 0;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }
    const m = moment(value);
    return m.isValid() ? m.format('DD MMM YYYY').toUpperCase() : value;
  }

  formatDateTime(value: string | null): string {
    if (!value) {
      return '-';
    }
    const m = moment(value);
    return m.isValid() ? m.format('DD MMM YYYY HH:mm').toUpperCase() : value;
  }
}
