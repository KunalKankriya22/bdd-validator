import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ModifyComponentWeightApiService } from './services/modify-component-weight-api.service';
import {
  ComponentPrefixItem,
  SavedComponentEntry,
  ProductOption,
  UpdateComponentWeightRequestDto,
  ERROR_MESSAGES,
  ComponentWeightErrorCode,
} from './models/modify-component-weight.model';

@Component({
  selector: 'app-modify-component-weight',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './modify-component-weight.html',
  styleUrls: ['./modify-component-weight.scss'],
})
export class ModifyComponentWeightComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `modify-component-weight-${ModifyComponentWeightComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-error-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-label-${name}`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private destroy$ = new Subject<void>();
  private apiService = inject(ModifyComponentWeightApiService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);
  private snackbarService = inject(SnackbarService);
  private cdr = inject(ChangeDetectorRef);

  // Default title (fallback if API doesn't return it)
  private readonly defaultTitle = 'Modify Component Weight';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  protected productControl = new FormControl<string>('', Validators.required);
  protected productSearchCtrl = new FormControl<string>('');

  protected unitData = signal<UnitValidationResponse | null>(null);
  protected collectionDate = signal<string>('');
  protected productDescription = signal<string>('');
  protected products = signal<ProductOption[]>([]);
  protected filteredProducts = signal<ProductOption[]>([]);
  protected isLoading = signal(false);
  protected codeScheme = signal<'I' | 'C'>('I');

  protected currentWeight = signal<number | null>(null);
  protected currentVolume = signal<number | null>(null);
  protected currentAnticoagulantVolume = signal<number | null>(null);
  protected savedEntries = signal<SavedComponentEntry[]>([]);

  protected hasSavedEntries = computed(() => this.savedEntries().length > 0);

  protected displayedColumns: string[] = [
    'unitId',
    'product',
    'productDescription',
    'componentPrefix',
    'collectionDate',
    'weight',
    'volume',
    'anticoagulantVolume',
  ];

  protected pageSize = signal(10);
  protected pageSizeOptions = [10, 25, 50, 100];
  protected pageIndex = signal(0);

  protected sortDirection = signal<'asc' | 'desc' | ''>('');
  protected sortActive = signal('');

  protected paginatedEntries = computed(() => this.getPaginatedData(this.getSortedEntries()));

  protected totalCount = computed(() => this.savedEntries().length);

  private getSortedEntries(): SavedComponentEntry[] {
    let entries = [...this.savedEntries()];

    if (this.sortActive() && this.sortDirection()) {
      entries = entries.sort((a, b) => {
        const isAsc = this.sortDirection() === 'asc';
        switch (this.sortActive()) {
          case 'unitId':
            return this.compare(a.unitId, b.unitId, isAsc);
          default:
            return 0;
        }
      });
    }

    return entries;
  }

  private getPaginatedData(data: SavedComponentEntry[]): SavedComponentEntry[] {
    const startIndex = this.pageIndex() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return data.slice(startIndex, endIndex);
  }

  protected weightError = signal<string | null>(null);
  protected anticoagulantVolumeError = signal<string | null>(null);

  private selectedProductSpecificGravity = signal<number | null>(null);

  // Component prefix — ISBT: auto-derived from product code; Codabar: LOV dropdown
  protected isbtPrefix = signal<string>('');
  protected isISBT = computed(() => this.codeScheme() === 'I');
  protected componentPrefixControl = new FormControl<string>('');
  protected componentPrefixSearchCtrl = new FormControl<string>('');
  protected componentPrefixes = signal<ComponentPrefixItem[]>([]);
  protected filteredComponentPrefixes = signal<ComponentPrefixItem[]>([]);

  constructor() {
    this.initializeHeaderConfig();

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
    this.subscribeToChapterChanges();
    this.subscribeToProductChanges();
    this.subscribeToComponentPrefixSearch();
  }

  private initializeHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: this.defaultTitle, link: null }
      ],
      title: this.defaultTitle,
      subtitle: 'Record and save component weight manually or directly from the scale.'
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onUnitValidated(unitValidation: UnitValidationResponse): void {
    this.clearInputFields();
    this.productControl.setValue('');
    this.productSearchCtrl.setValue('', { emitEvent: false });
    this.products.set([]);
    this.filteredProducts.set([]);
    this.pageIndex.set(0);
    this.unitData.set(unitValidation);
    this.codeScheme.set(unitValidation.codeScheme);
    this.loadUnitMetadata(unitValidation.parsedUnitId);
  }

  protected onUnitCleared(): void {
    this.clearForm();
  }

  private loadUnitMetadata(unitId: string): void {
    const chapterId = this.headerService.getCurrentChapterId();
    if (!chapterId) {
      this.showError('Chapter ID not found');
      return;
    }

    this.isLoading.set(true);

    this.apiService.getUnitDetails(unitId, chapterId).subscribe({
      next: (response) => {
        this.collectionDate.set(response.collDate);
        this.savedEntries.set([]);

        if (response.components && response.components.length > 0) {
          const existingEntries: SavedComponentEntry[] = response.components
            .filter(c => c.weight !== null)
            .map(c => ({
              unitId: c.unitId,
              productCode: c.productCode,
              productDesc: c.productDesc,
              componentPrefix: c.componentPrefix,
              collectionDate: c.collectionDate || response.collDate,
              weight: c.weight ?? 0,
              volume: c.volume ?? 0,
              anticoagulantVolume: c.anticoagulantVolume,
              specificGravity: c.specificGravity,
              savedAt: new Date(0),
            }));
          this.savedEntries.set(existingEntries);
        }

        this.loadProducts(unitId, response.collDate, chapterId);
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorMessage = this.extractErrorMessage(error);
        this.showError(errorMessage);
      },
    });
  }

  private loadProducts(unitId: string, collDate: string, chapterId: string): void {
    this.apiService.getValidProducts(unitId, collDate, chapterId, this.codeScheme()).subscribe({
      next: (products) => {
        this.products.set(products);
        this.filteredProducts.set(products);
        this.isLoading.set(false);
      },
      error: () => {
        this.showError('Failed to load valid products for this unit');
        this.products.set([]);
        this.filteredProducts.set([]);
        this.isLoading.set(false);
      },
    });
  }

  private subscribeToProductChanges(): void {
    this.productControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((productCode) => {
      if (productCode) {
        const product = this.products().find((p) => p.productCode === productCode);
        if (product) {
          this.productDescription.set(this.extractShortDescription(product.productDesc));
          this.selectedProductSpecificGravity.set(product.specificGravity);
          const weight = this.currentWeight();
          if (weight !== null) {
            this.currentVolume.set(parseFloat((weight / product.specificGravity).toFixed(2)));
          }
        }

        if (this.codeScheme() === 'I') {
          this.isbtPrefix.set(productCode.length >= 8 ? productCode.substring(6, 8) : '');
        } else {
          this.componentPrefixControl.setValue('', { emitEvent: false });
          this.componentPrefixes.set([]);
          this.filteredComponentPrefixes.set([]);
          this.loadComponentPrefixes(productCode);
        }
      } else {
        this.productDescription.set('');
        this.selectedProductSpecificGravity.set(null);
        this.currentVolume.set(null);
        this.isbtPrefix.set('');
        this.componentPrefixControl.setValue('', { emitEvent: false });
        this.componentPrefixes.set([]);
        this.filteredComponentPrefixes.set([]);
      }
    });

    this.productSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((searchText) => {
      this.filterProducts(searchText || '');
    });
  }

  private subscribeToComponentPrefixSearch(): void {
    this.componentPrefixSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((search) => {
      if (!search) {
        this.filteredComponentPrefixes.set(this.componentPrefixes());
        return;
      }
      const lower = search.toLowerCase();
      this.filteredComponentPrefixes.set(
        this.componentPrefixes().filter(p => p.componentPrefix.toLowerCase().includes(lower))
      );
    });
  }

  private loadComponentPrefixes(productCode: string): void {
    const unitId = this.unitData()?.parsedUnitId;
    const collDate = this.collectionDate();
    if (!unitId || !collDate) return;

    this.apiService.getComponentPrefixes(unitId, collDate, productCode, 'C')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prefixes) => {
          this.componentPrefixes.set(prefixes);
          this.filteredComponentPrefixes.set(prefixes);
          if (prefixes.length === 1) {
            this.componentPrefixControl.setValue(prefixes[0].componentPrefix);
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.componentPrefixes.set([]);
          this.filteredComponentPrefixes.set([]);
          this.showError('Failed to load component prefixes');
        },
      });
  }

  private filterProducts(searchText: string): void {
    if (!searchText) {
      this.filteredProducts.set(this.products());
      return;
    }

    const filterValue = searchText.toLowerCase();
    const filtered = this.products().filter(
      (product) =>
        product.productCode.toLowerCase().includes(filterValue) ||
        product.productDesc.toLowerCase().includes(filterValue)
    );
    this.filteredProducts.set(filtered);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearForm();
    });
  }

  protected onWeightChange(value: string): void {
    if (!value) {
      this.currentWeight.set(null);
      this.currentVolume.set(null);
      this.weightError.set(null);
      return;
    }

    const weight = parseFloat(value);

    if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) {
      this.weightError.set('Weight must have at most 2 decimal places');
      this.currentWeight.set(null);
      this.currentVolume.set(null);
      return;
    }

    if (isNaN(weight) || weight <= 0 || weight > 999.99) {
      this.weightError.set('Weight must be greater than 0 and no more than 999.99 gms');
      this.currentWeight.set(null);
      this.currentVolume.set(null);
      return;
    }

    this.currentWeight.set(weight);
    this.weightError.set(null);

    const specificGravity = this.selectedProductSpecificGravity();
    if (specificGravity) {
      const calculatedVolume = parseFloat((weight / specificGravity).toFixed(2));
      this.currentVolume.set(calculatedVolume);
    } else {
      this.currentVolume.set(null);
    }
  }

  protected onAnticoagulantVolumeChange(value: string): void {
    if (!value || value.trim() === '') {
      this.currentAnticoagulantVolume.set(null);
      this.anticoagulantVolumeError.set(null);
      return;
    }

    const volume = parseInt(value, 10);

    if (isNaN(volume) || volume <= 0) {
      this.anticoagulantVolumeError.set(ERROR_MESSAGES[ComponentWeightErrorCode.ANTICOAG_VOLUME_ZERO]);
      this.currentAnticoagulantVolume.set(null);
      return;
    }

    if (volume > 999) {
      this.anticoagulantVolumeError.set(ERROR_MESSAGES[ComponentWeightErrorCode.ANTICOAG_NOT_THREE_DIGITS]);
      this.currentAnticoagulantVolume.set(null);
      return;
    }

    if (value.includes('.') || value.includes(',')) {
      this.anticoagulantVolumeError.set(ERROR_MESSAGES[ComponentWeightErrorCode.ANTICOAG_NOT_WHOLE_NUMBER]);
      this.currentAnticoagulantVolume.set(null);
      return;
    }

    this.currentAnticoagulantVolume.set(volume);
    this.anticoagulantVolumeError.set(null);
  }

  protected goToNextPage(): void {
    if (this.hasNextPage()) {
      this.pageIndex.update(i => i + 1);
    }
  }

  protected goToPreviousPage(): void {
    if (this.hasPreviousPage()) {
      this.pageIndex.update(i => i - 1);
    }
  }

  protected goToFirstPage(): void {
    this.pageIndex.set(0);
  }

  protected goToLastPage(): void {
    const lastPage = Math.max(0, Math.ceil(this.savedEntries().length / this.pageSize()) - 1);
    this.pageIndex.set(lastPage);
  }

  protected hasNextPage(): boolean {
    return (this.pageIndex() + 1) * this.pageSize() < this.savedEntries().length;
  }

  protected hasPreviousPage(): boolean {
    return this.pageIndex() > 0;
  }

  protected getTotalCount(): number {
    return this.savedEntries().length;
  }

  protected getShortDescription(fullDescription: string): string {
    return this.extractShortDescription(fullDescription);
  }

  protected preventDecimalInput(event: KeyboardEvent): boolean {
    const key = event.key;
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return true;
    }
    if (['.', ',', '-', '+', 'e', 'E'].includes(key)) {
      event.preventDefault();
      return false;
    }
    if (/^\d$/.test(key)) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  protected handleEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveCurrentEntry();
    }
  }

  /** Enter triggers save; blocks non-integer keys (decimals, negatives). */
  protected handleAnticoagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveCurrentEntry();
      return;
    }

    const key = event.key;
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }
    if (['.', ',', '-', '+', 'e', 'E'].includes(key)) {
      event.preventDefault();
      return;
    }
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  protected saveCurrentEntry(): void {
    const unitId = this.unitData()?.parsedUnitId;
    const productCode = this.productControl.value;
    const weight = this.currentWeight();
    const collDate = this.collectionDate();

    if (!unitId) {
      this.showError('Please enter a valid Unit ID');
      return;
    }
    if (!productCode) {
      this.showError('Please select a product');
      return;
    }
    if (!weight) {
      this.showError('Please enter a valid weight');
      return;
    }
    if (this.weightError() || this.anticoagulantVolumeError()) {
      this.showError('Please fix validation errors before saving');
      return;
    }

    const chapterId = this.headerService.getCurrentChapterId();
    if (!chapterId) {
      this.showError('Chapter ID not found');
      return;
    }

    const selectedProduct = this.products().find((p) => p.productCode === productCode);
    if (!selectedProduct) {
      this.showError('Selected product not found');
      return;
    }

    const componentPrefix = this.codeScheme() === 'I'
      ? (productCode.length >= 8 ? productCode.substring(6, 8) : '')
      : (this.componentPrefixControl.value || '');

    if (!componentPrefix) {
      this.showError(
        this.codeScheme() === 'I'
          ? 'Could not derive component prefix from product code'
          : 'Please select a component prefix',
      );
      return;
    }

    const request: UpdateComponentWeightRequestDto = {
      unitId,
      collDate,
      chapterId,
      productCode,
      componentPrefix,
      componentWeight: weight,
      anticoagulantVolume: this.currentAnticoagulantVolume() ?? undefined,
      codeScheme: this.codeScheme(),
    };

    this.isLoading.set(true);

    this.apiService.updateComponentWeight(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        if (response.success) {
          const newEntry: SavedComponentEntry = {
            unitId,
            productCode,
            productDesc: this.productDescription(),
            componentPrefix,
            collectionDate: collDate,
            weight,
            volume: this.currentVolume() || response.calculatedVolume || 0,
            anticoagulantVolume: this.currentAnticoagulantVolume(),
            specificGravity: selectedProduct.specificGravity,
            savedAt: new Date(),
          };

          this.savedEntries.update((entries) => [...entries, newEntry]);

          const entryCount = this.savedEntries().length;
          this.showSuccess(`${entryCount} ${entryCount === 1 ? 'Entry' : 'Entries'} saved`);

          this.clearInputFields();

          if (response.interdictionApplied) {
            this.showWarning(`Component has volume interdiction applied`);
          }
        } else {
          this.showError(response.message || 'Save failed');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorMessage = this.extractErrorMessage(error);
        this.showError(errorMessage);
      },
    });
  }

  private clearInputFields(): void {
    this.currentWeight.set(null);
    this.currentVolume.set(null);
    this.currentAnticoagulantVolume.set(null);
    this.weightError.set(null);
    this.anticoagulantVolumeError.set(null);
    // product intentionally kept so user can enter multiple entries for the same unit
  }

  protected onPageChange(event: PageEvent): void {
    if (event.pageSize !== this.pageSize()) {
      this.pageSize.set(event.pageSize);
      this.pageIndex.set(0);
    } else {
      this.pageIndex.set(event.pageIndex);
    }
  }

  protected onSortChange(sort: Sort): void {
    this.sortActive.set(sort.active);
    this.sortDirection.set(sort.direction);
    this.pageIndex.set(0);
  }

  private compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  protected clearForm(): void {
    this.unitIdField?.clear();
    this.productControl.setValue('');
    this.productSearchCtrl.setValue('', { emitEvent: false });
    this.unitData.set(null);
    this.collectionDate.set('');
    this.productDescription.set('');
    this.products.set([]);
    this.filteredProducts.set([]);
    this.savedEntries.set([]);
    this.clearInputFields();
    this.selectedProductSpecificGravity.set(null);
    this.isbtPrefix.set('');
    this.componentPrefixControl.setValue('', { emitEvent: false });
    this.componentPrefixSearchCtrl.setValue('', { emitEvent: false });
    this.componentPrefixes.set([]);
    this.filteredComponentPrefixes.set([]);
    this.pageIndex.set(0);
  }

  private extractErrorMessage(error: any): string {
    if (error?.error?.errorResponse?.error) {
      return error.error.errorResponse.error;
    }
    if (error?.error?.errorResponse?.errorCode) {
      const errorCode = error.error.errorResponse.errorCode;
      return ERROR_MESSAGES[errorCode] || error.error.message || 'An error occurred';
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }

  private showSuccess(message: string): void {
    this.snackbarService.showSuccess(message);
  }

  private showError(message: string): void {
    this.snackbarService.showError(message);
  }

  private showWarning(message: string): void {
    this.snackbarService.showInfo(message);
  }

  protected formatNumber(value: number | null): string {
    return value !== null ? value.toFixed(2) : '';
  }

  /** Formats an ISO date string as DD-MON-YYYY, bypassing browser-timezone offset. */
  protected formatDate(dateString: string): string {
    if (!dateString) return '';
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return '';
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${day.toString().padStart(2, '0')}-${monthNames[month - 1]}-${year}`;
  }

  /** Extracts text before the pipe separator: "RED BLOOD CELLS|AS5/450mL/..." → "RED BLOOD CELLS" */
  protected extractShortDescription(fullDescription: string): string {
    if (!fullDescription) return '';
    const pipeIndex = fullDescription.indexOf('|');
    return pipeIndex > -1 ? fullDescription.substring(0, pipeIndex).trim() : fullDescription;
  }
}
