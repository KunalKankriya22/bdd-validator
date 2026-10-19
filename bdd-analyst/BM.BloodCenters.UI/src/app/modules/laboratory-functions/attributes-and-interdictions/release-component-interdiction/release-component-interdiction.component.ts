import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, filter, switchMap } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';

import { ReleaseComponentInterdictionService } from './services/release-component-interdiction.service';
import {
  ComponentInterdictionDto,
  ReleaseInterdictionsRequestDto,
} from './models/release-component-interdiction.models';

@Component({
  selector: 'app-release-component-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
    SearchBar,
  ],
  templateUrl: './release-component-interdiction.component.html',
  styleUrls: ['./release-component-interdiction.component.scss'],
})
export class ReleaseComponentInterdictionComponent implements OnInit, OnDestroy {
  private readonly service = inject(ReleaseComponentInterdictionService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Release Component Interdiction' },
    ],
    title: 'Release Component Interdiction',
    subtitle: 'Releases an interdicted blood component after required validation and authorisation.',
  };

  readonly tableConfig: DataTableConfig<ComponentInterdictionDto> = {
    columns: [
      { key: 'interCode', header: 'Interdiction Code', width: '20%' },
      { key: 'interDesc', header: 'Description', width: '50%' },
      { key: 'interTypeDesc', header: 'Interdiction Type', width: '30%' },
    ],
    enableSelection: true,
    selectionKey: 'interCode',
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No interdictions found',
    emptySubMessage: 'Select a product code to view interdictions',
  };

  readonly productCodeControl = new FormControl<string | null>(null);
  readonly collDateControl = new FormControl<string | null>(null);

  readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction Code',
    minLength: 1,
    ariaLabel: 'Search interdictions by code',
    searchOnEnterOnly: true,
  };

  // State
  parsedUnitId = signal('');
  codeScheme = signal<string>('I');
  availableCollectionDates = signal<string[]>([]);
  collectionDate = signal<string>('');
  showEntryForm = signal(false);
  isLoadingProducts = signal(false);
  isLoadingInterdictions = signal(false);
  isReleasing = signal(false);

  productCodes = signal<{ productCode: string; productDesc: string | null }[]>([]);
  selectedProductCode = signal<string | null>(null);
  interdictions = signal<ComponentInterdictionDto[]>([]);
  selectedRows = signal<ComponentInterdictionDto[]>([]);
  searchTerm = signal('');

  hasMultipleDates = computed(() => this.availableCollectionDates().length > 1);

  selectedProductDescription = computed(() => {
    const code = this.selectedProductCode();
    if (!code) return '-';
    const product = this.productCodes().find(p => p.productCode === code);
    return product?.productDesc ?? '-';
  });

  filteredInterdictions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const rows = this.interdictions();
    if (!term) return rows;
    return rows.filter(r => r.interCode?.toLowerCase().includes(term));
  });

  canRelease = computed(() =>
    this.selectedRows().length > 0 && !this.isReleasing()
  );

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.parsedUnitId.set(data.parsedUnitId);
    this.codeScheme.set(data.codeScheme);
    this.showEntryForm.set(true);

    this.service
      .validateUnit(data.parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.isValid || response.availableCollectionDates.length === 0) {
            this.snackbarService.showError('No releasable interdictions found for this unit.');
            this.unitIdField?.clear();
            return;
          }

          this.availableCollectionDates.set(response.availableCollectionDates);

          if (response.availableCollectionDates.length === 1) {
            const collDate = response.availableCollectionDates[0];
            this.collectionDate.set(collDate);
            this.collDateControl.setValue(collDate, { emitEvent: false });
            this.loadValidProducts(response.unitId, collDate);
          }
        },
        error: () => {
          this.unitIdField?.clear();
        },
      });
  }

  onUnitCleared(): void {
    this.resetState();
  }

  onCollDateSelected(collDate: string): void {
    this.collectionDate.set(collDate);
    this.productCodes.set([]);
    this.selectedProductCode.set(null);
    this.productCodeControl.setValue(null, { emitEvent: false });
    this.interdictions.set([]);
    this.selectedRows.set([]);
    this.loadValidProducts(this.parsedUnitId(), collDate);
  }

  onSelectionChange(selected: ComponentInterdictionDto[]): void {
    this.selectedRows.set(selected);
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onRelease(): void {
    const selected = this.selectedRows();
    if (selected.length === 0) return;

    const productCode = this.selectedProductCode();
    const collDate = this.collectionDate();
    if (!productCode || !collDate) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: {
        title: 'Release Component Interdiction',
        message: 'Do you want to delete Component Interdiction',
        confirmText: 'YES',
        cancelText: 'NO',
      } as ConfirmActionDialogData,
    });

    dialogRef.afterClosed()
      .pipe(
        filter(result => result === true),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.executeRelease(selected, productCode, collDate);
      });
  }

  private executeRelease(selected: ComponentInterdictionDto[], productCode: string, collDate: string): void {
    this.isReleasing.set(true);

    const request: ReleaseInterdictionsRequestDto = {
      unitId: this.parsedUnitId(),
      collDate,
      productCode,
      interCodes: selected.map(i => i.interCode),
    };

    this.service
      .releaseInterdictions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isReleasing.set(false);

          if (response.success) {
            const count = response.item?.deletedCount ?? selected.length;
            this.snackbarService.showSuccess(
              `${count} interdiction(s) released successfully`
            );
            this.selectedRows.set([]);
            this.loadInterdictions(productCode);
          }
        },
        error: () => {
          this.isReleasing.set(false);
        },
      });
  }

  clearAll(): void {
    this.unitIdField?.clear();
    this.resetState();
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  private setupFormSubscriptions(): void {
    this.productCodeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(productCode => {
        this.selectedProductCode.set(productCode);
        this.interdictions.set([]);
        this.selectedRows.set([]);
        this.searchTerm.set('');

        if (productCode) {
          this.loadInterdictions(productCode);
        }
      });
  }

  private loadValidProducts(unitId: string, collDate: string): void {
    this.isLoadingProducts.set(true);
    this.service
      .getValidProducts(unitId, collDate, this.codeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.productCodes.set(products);
          this.isLoadingProducts.set(false);

          if (products.length === 0) {
            this.snackbarService.showError('No product codes with releasable interdictions found.');
          }
        },
        error: () => {
          this.isLoadingProducts.set(false);
        },
      });
  }

  private loadInterdictions(productCode: string): void {
    const unitId = this.parsedUnitId();
    const collDate = this.collectionDate();
    if (!unitId || !collDate) return;

    this.isLoadingInterdictions.set(true);
    this.service
      .getInterdictions(unitId, collDate, productCode, this.codeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          this.interdictions.set(interdictions);
          this.selectedRows.set([]);
          this.isLoadingInterdictions.set(false);

          if (interdictions.length === 0) {
            this.selectedProductCode.set(null);
            this.productCodeControl.setValue(null, { emitEvent: false });
            this.snackbarService.showSuccess('All interdictions for this product have been released.');
          }
        },
        error: () => {
          this.isLoadingInterdictions.set(false);
          this.interdictions.set([]);
          this.selectedRows.set([]);
        },
      });
  }

  private resetState(): void {
    this.parsedUnitId.set('');
    this.collectionDate.set('');
    this.availableCollectionDates.set([]);
    this.showEntryForm.set(false);
    this.productCodes.set([]);
    this.selectedProductCode.set(null);
    this.productCodeControl.setValue(null, { emitEvent: false });
    this.collDateControl.setValue(null, { emitEvent: false });
    this.interdictions.set([]);
    this.selectedRows.set([]);
    this.searchTerm.set('');
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
      });
  }
}
