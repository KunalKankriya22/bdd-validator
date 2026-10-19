import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  inject,
  ChangeDetectorRef,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import { DeletePooledComponentsService } from './services/delete-pooled-components.service';
import {
  PoolDetails,
  PooledComponentUnit,
} from './models/delete-pooled-components.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import {
  UnitIdFieldComponent,
  UnitValidationResponse as UnitIdValidationData,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';

@Component({
  selector: 'app-delete-pooled-components',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './delete-pooled-components.html',
  styleUrls: ['./delete-pooled-components.scss'],
})
export class DeletePooledComponentsComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly service = inject(DeletePooledComponentsService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;

  private readonly defaultTitle = 'Delete Pooled Components';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: this.defaultTitle, link: null }
    ],
    title: this.defaultTitle,
    subtitle: '',
    actions: []
  };

  searchForm!: FormGroup;

  poolDetails = signal<PoolDetails | null>(null);
  hasPoolDetails = computed(() => this.poolDetails() !== null);

  dataTableConfig: DataTableConfig<PooledComponentUnit> = {
    columns: [
      { key: 'unitId', header: 'Unit ID in Pool', sortable: false, width: '180px' },
      { key: 'productCode', header: 'Product Code', sortable: false, width: '140px' },
      { key: 'productDescription', header: 'Description', sortable: false, width: 'auto' },
    ],
    stickyHeader: true,
    showPagination: false,
    enableSelection: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    loadingMessage: 'Loading pooled units...',
  };

  dataSource: PooledComponentUnit[] = [];
  isLoading = false;
  searchPerformed = false;
  private resettingForm = false;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null }
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    const poolId = this.route.snapshot.queryParams['poolId'];
    if (poolId) {
      setTimeout(() => this.prefillAndSearch(poolId));
    }
  }

  private prefillAndSearch(poolId: string): void {
    this.searchForm.patchValue({ unitId: poolId }, { emitEvent: false });
    if (this.unitIdField) {
      this.unitIdField.unitIdControl.setValue(poolId, { emitEvent: false });
    }
    this.searchPerformed = true;

    this.service
      .getPoolDetails(poolId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (poolDetails) => {
          this.poolDetails.set(poolDetails);
          this.searchForm.patchValue({
            productCode: poolDetails.productCode,
            description: poolDetails.productDescription,
          });
          this.loadPooledUnits();
        },
        error: () => {
          this.poolDetails.set(null);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetForm();
      });
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      unitId: [''],
      productCode: [{ value: '', disabled: true }],
      description: [{ value: '', disabled: true }],
    });
  }

  onUnitIdPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    this.searchForm.patchValue({ unitId }, { emitEvent: false });
    this.searchPerformed = true;

    this.service
      .getPoolDetails(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (poolDetails) => {
          this.poolDetails.set(poolDetails);
          this.searchForm.patchValue({
            productCode: poolDetails.productCode,
            description: poolDetails.productDescription,
          });
          this.loadPooledUnits();
          event.confirm();
        },
        error: (error) => {
          this.isLoading = false;
          this.searchForm.patchValue({
            productCode: '',
            description: '',
          });
          this.poolDetails.set(null);
          this.dataSource = [];
          this.cdr.detectChanges();
          const body = (error as any)?.error;
          event.reject(body?.message || body?.errorResponse?.error || 'Pool not found');
        },
      });
  }

  onUnitIdValidated(data: UnitIdValidationData): void {}

  onUnitIdCleared(): void {
    this.resetForm();
  }

  private loadPooledUnits(): void {
    const unitId = this.searchForm.get('unitId')?.value?.trim();
    if (!unitId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    this.service
      .getPooledUnits(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.dataSource = units;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error, 'Error loading pooled units');
          this.dataSource = [];
          this.cdr.detectChanges();
        },
      });
  }

  onDelete(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: {
        title: 'Warning',
        message: 'Pooled Unit will be deleted. Do you want to continue?',
        confirmText: 'YES',
        cancelText: 'NO',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.performDelete();
      }
    });
  }

  private performDelete(): void {
    const poolId = this.poolDetails()?.poolId;
    if (!poolId) {
      return;
    }

    this.isLoading = true;

    this.service
      .deletePool(poolId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const message = response?.message || 'Pool deleted successfully';

          this.snackBar.open(message, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });

          this.resetForm();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error, 'Error deleting pool');
        },
      });
  }

  private resetForm(): void {
    if (this.resettingForm) return;
    this.resettingForm = true;
    this.unitIdField?.clear();
    this.searchForm?.reset();
    this.poolDetails.set(null);
    this.dataSource = [];
    this.searchPerformed = false;
    this.cdr.detectChanges();
    this.resettingForm = false;
  }

  get isDeleteEnabled(): boolean {
    return this.hasPoolDetails() && !this.isLoading;
  }

  private handleError(error: unknown, defaultMessage: string): void {
    let errorMessage = defaultMessage;

    if (error && typeof error === 'object') {
      const err = error as { error?: { message?: string; errorResponse?: { error?: string } } };
      if (err.error?.message) {
        errorMessage = err.error.message;
      } else if (err.error?.errorResponse?.error) {
        errorMessage = err.error.errorResponse.error;
      }
    }

    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
