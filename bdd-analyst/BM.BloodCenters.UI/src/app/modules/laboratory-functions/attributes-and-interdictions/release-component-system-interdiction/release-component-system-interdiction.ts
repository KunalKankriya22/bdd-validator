import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, filter } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';

import { ReleaseComponentSystemInterdictionService } from './services/release-component-system-interdiction.service';
import {
  ComponentSystemInterdictionDto,
  ReleaseSystemInterdictionsRequestDto,
} from './models/release-component-system-interdiction.models';

@Component({
  selector: 'app-release-component-system-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
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
  templateUrl: './release-component-system-interdiction.html',
  styleUrls: ['./release-component-system-interdiction.scss'],
})
export class ReleaseComponentSystemInterdictionComponent implements OnInit, OnDestroy {
  private readonly service = inject(ReleaseComponentSystemInterdictionService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  readonly tableConfig: DataTableConfig<ComponentSystemInterdictionDto> = {
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

  readonly productCodeControl = new FormControl<string | null>(null, [Validators.required]);
  readonly productCodeSearchControl = new FormControl<string>('');
  readonly collDateControl = new FormControl<string | null>(null);

  readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction Code',
    minLength: 1,
    ariaLabel: 'Search interdictions by code',
    searchOnEnterOnly: true,
  };

  parsedUnitId = signal('');
  codeScheme = signal<string>('I');
  availableCollectionDates = signal<string[]>([]);
  collectionDate = signal<string>('');
  showEntryForm = signal(false);
  isLoadingProducts = signal(false);
  isLoadingInterdictions = signal(false);
  isReleasing = signal(false);

  productCodes = signal<{ productCode: string; productDesc: string | null }[]>([]);
  filteredProductCodes = signal<{ productCode: string; productDesc: string | null }[]>([]);
  selectedProductCode = signal<string | null>(null);
  interdictions = signal<ComponentSystemInterdictionDto[]>([]);
  hasLoadedInterdictions = signal(false);
  selectedRows = signal<ComponentSystemInterdictionDto[]>([]);
  externalSelectedIds = signal<Set<string>>(new Set());
  searchTerm = signal('');

  hasMultipleDates = computed(() => this.availableCollectionDates().length > 1);

  selectedProductDescription = computed(() => {
    const code = this.selectedProductCode();
    if (!code) return '-';
    const product = this.productCodes().find(p => p.productCode === code);
    return product?.productDesc ?? '-';
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
            this.snackbarService.showError('No releasable system interdictions found for this unit.');
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

  onSelectionChange(selected: ComponentSystemInterdictionDto[]): void {
    this.selectedRows.set(selected);
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    const productCode = this.selectedProductCode();
    if (productCode) {
      this.loadInterdictions(productCode);
    }
  }

  onRelease(): void {
    const selected = this.selectedRows();
    if (selected.length === 0) return;

    const productCode = this.selectedProductCode();
    const collDate = this.collectionDate();
    if (!productCode || !collDate) return;

    const interTypeDesc = selected[0].interTypeDesc ?? '';
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: {
        title: 'Release Component System Interdiction',
        message: `Do you want to release ${interTypeDesc} Release Component System Interdiction`,
        confirmText: 'YES, RELEASE',
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

  private executeRelease(selected: ComponentSystemInterdictionDto[], productCode: string, collDate: string): void {
    this.isReleasing.set(true);

    const request: ReleaseSystemInterdictionsRequestDto = {
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
            this.snackbarService.showInfo(
              `${selected.length} component has been released`
            );
            this.clearAll();
          }
        },
        error: () => {
          this.isReleasing.set(false);
        },
      });
  }

  clearSelection(): void {
    this.selectedRows.set([]);
    this.externalSelectedIds.set(new Set());
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
        this.externalSelectedIds.set(new Set());
        this.searchTerm.set('');

        if (productCode) {
          this.loadInterdictions(productCode);
        }
      });

    this.productCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search ?? '').toLowerCase();
        this.filteredProductCodes.set(
          this.productCodes().filter(
            p => p.productCode.toLowerCase().includes(term) ||
                 (p.productDesc ?? '').toLowerCase().includes(term)
          )
        );
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
          this.filteredProductCodes.set([...products]);
          this.productCodeSearchControl.setValue('', { emitEvent: false });
          this.isLoadingProducts.set(false);

          if (products.length === 0) {
            this.snackbarService.showError('No product codes with releasable system interdictions found.');
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
    const interCode = this.searchTerm().trim() || undefined;
    this.service
      .getInterdictions(unitId, collDate, productCode, this.codeScheme(), interCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          this.interdictions.set(interdictions);
          this.hasLoadedInterdictions.set(true);
          this.selectedRows.set([]);
          this.isLoadingInterdictions.set(false);

          if (interdictions.length === 0 && !this.searchTerm().trim()) {
            this.selectedProductCode.set(null);
            this.productCodeControl.reset(null, { emitEvent: false });
            this.snackbarService.showInfo('All system interdictions for this product have been released.');
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
    this.filteredProductCodes.set([]);
    this.selectedProductCode.set(null);
    this.productCodeControl.reset(null, { emitEvent: false });
    this.productCodeSearchControl.setValue('', { emitEvent: false });
    this.collDateControl.reset(null, { emitEvent: false });
    this.interdictions.set([]);
    this.hasLoadedInterdictions.set(false);
    this.selectedRows.set([]);
    this.externalSelectedIds.set(new Set());
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
