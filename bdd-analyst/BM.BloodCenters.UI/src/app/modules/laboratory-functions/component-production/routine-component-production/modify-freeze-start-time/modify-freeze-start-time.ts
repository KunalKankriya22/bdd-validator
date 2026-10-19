import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ModifyFreezeStartTimeApiService } from './services/modify-freeze-start-time-api.service';
import {
  FreezeStartTimeEntry,
  ProductForUnitDto,
  ComponentFreezeDetailsDto,
  UpdateFreezeStartTimeRequestDto,
  FREEZE_ERROR_MESSAGES,
} from './models/modify-freeze-start-time.model';

@Component({
  selector: 'app-modify-freeze-start-time',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './modify-freeze-start-time.html',
  styleUrls: ['./modify-freeze-start-time.scss'],
})
export class ModifyFreezeStartTimeComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `modify-freeze-start-time-${ModifyFreezeStartTimeComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private destroy$ = new Subject<void>();
  private apiService = inject(ModifyFreezeStartTimeApiService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);
  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);

  private readonly defaultTitle = 'Modify Freeze Start Time';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  protected productControl = new FormControl<string>('', Validators.required);
  protected productSearchCtrl = new FormControl<string>('');
  protected freezeDateControl = new FormControl<Date | null>(null);
  protected freezeTimeControl = new FormControl<string>('');

  protected unitData = signal<UnitValidationResponse | null>(null);
  protected collectionDate = signal<string>('');
  protected productDescription = signal<string>('');
  protected products = signal<ProductForUnitDto[]>([]);
  protected filteredProducts = signal<ProductForUnitDto[]>([]);
  protected isLoading = signal(false);
  protected codeScheme = signal<'I' | 'C'>('I');

  protected aliquot = signal<string>('');
  protected componentDetails = signal<ComponentFreezeDetailsDto | null>(null);
  protected savedEntries = signal<FreezeStartTimeEntry[]>([]);
  protected unitAlreadyScanned = signal(false);
  protected dateTimeError = signal<string | null>(null);

  protected hasSavedEntries = computed(() => this.savedEntries().length > 0);

  protected displayedColumns: string[] = [
    'unitId',
    'collectionDate',
    'productCode',
    'productDescription',
    'freezeStartDateTime',
  ];

  protected pageSize = signal(10);
  protected pageSizeOptions = [10, 25, 50, 100];
  protected pageIndex = signal(0);

  protected sortDirection = signal<'asc' | 'desc' | ''>('');
  protected sortActive = signal('');

  protected paginatedEntries = computed(() => {
    const sortedEntries = this.getSortedEntries();
    return this.getPaginatedData(sortedEntries);
  });

  protected getTotalCount = computed(() => this.savedEntries().length);

  private getSortedEntries(): FreezeStartTimeEntry[] {
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

  private getPaginatedData(data: FreezeStartTimeEntry[]): FreezeStartTimeEntry[] {
    const startIndex = this.pageIndex() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return data.slice(startIndex, endIndex);
  }

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
  }

  private initializeHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: this.defaultTitle, link: null }
      ],
      title: this.defaultTitle,
      subtitle: 'Modify freeze start times for components.'
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onUnitValidated(unitValidation: UnitValidationResponse): void {
    const parsedId = unitValidation.parsedUnitId;

    const alreadyExists = this.savedEntries().some((e) => e.unitId === parsedId);
    this.unitAlreadyScanned.set(alreadyExists);

    this.unitData.set(unitValidation);
    this.loadUnitMetadata(parsedId);
  }

  protected onUnitCleared(): void {
    this.clearForm();
  }

  private loadUnitMetadata(unitId: string): void {
    this.isLoading.set(true);

    this.apiService.validateUnit(unitId).subscribe({
      next: (response) => {
        this.collectionDate.set(response.collDate);
        this.codeScheme.set(response.codeScheme);
        this.isLoading.set(false);
        this.loadProducts(unitId, response.collDate, response.codeScheme);
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorMessage = this.extractErrorMessage(error);
        this.showError(errorMessage);
      },
    });
  }

  private loadProducts(unitId: string, collDate: string, codeScheme: string): void {
    this.apiService.getProducts(unitId, collDate, codeScheme).subscribe({
      next: (products) => {
        this.products.set(products);
        this.filteredProducts.set(products);
      },
      error: () => {
        this.products.set([]);
        this.filteredProducts.set([]);
      },
    });
  }

  private subscribeToProductChanges(): void {
    this.productControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((productCode) => {
      if (productCode) {
        const product = this.products().find((p) => p.productCode === productCode);
        if (product) {
          this.productDescription.set(this.extractShortDescription(product.productDescription));
          this.loadAliquots(productCode);
        }
      } else {
        this.productDescription.set('');
        this.aliquot.set('');
        this.componentDetails.set(null);
      }
    });

    this.productSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((searchText) => {
      this.filterProducts(searchText || '');
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
        product.productDescription.toLowerCase().includes(filterValue)
    );
    this.filteredProducts.set(filtered);
  }

  private loadAliquots(productCode: string): void {
    const unitId = this.unitData()?.parsedUnitId;
    const collDate = this.collectionDate();
    if (!unitId || !collDate) return;

    this.apiService.getAliquots(unitId, productCode, collDate).subscribe({
      next: (aliquots) => {
        if (aliquots.length === 0) {
          this.showError('No available aliquots for this product');
        } else if (aliquots.length === 1) {
          this.aliquot.set(aliquots[0].aliquot);
          this.loadComponentDetails(productCode, aliquots[0].aliquot);
        } else {
          const defaultAliquot = aliquots.find(a => a.aliquot === '00') || aliquots[0];
          this.aliquot.set(defaultAliquot.aliquot);
          this.loadComponentDetails(productCode, defaultAliquot.aliquot);
        }
      },
      error: () => {
        this.showError('Failed to load aliquots');
      },
    });
  }

  private loadComponentDetails(productCode: string, aliquot: string): void {
    const unitId = this.unitData()?.parsedUnitId;
    const collDate = this.collectionDate();
    if (!unitId || !collDate) return;

    this.apiService.getComponentDetails(unitId, productCode, aliquot, collDate).subscribe({
      next: (details) => {
        this.componentDetails.set(details);
        if (details.freezeStartTime) {
          const existingDate = new Date(details.freezeStartTime);
          this.freezeDateControl.setValue(existingDate);
          const hours = existingDate.getHours().toString().padStart(2, '0');
          const minutes = existingDate.getMinutes().toString().padStart(2, '0');
          this.freezeTimeControl.setValue(`${hours}:${minutes}`);
        }
      },
      error: (error) => {
        this.componentDetails.set(null);
        const errorMessage = this.extractErrorMessage(error);
        this.showError(errorMessage);
      },
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearForm();
      this.clearFilters();
    });
  }

  protected saveCurrentEntry(): void {
    const unitId = this.unitData()?.parsedUnitId;
    const productCode = this.productControl.value;
    const freezeDate = this.freezeDateControl.value;
    const freezeTime = this.freezeTimeControl.value;
    const aliquotVal = this.aliquot();

    if (!unitId) {
      this.showError('Please enter a valid Unit ID');
      return;
    }

    if (!productCode) {
      this.showError('Please select a product');
      return;
    }

    if (!freezeDate || !freezeTime) {
      this.dateTimeError.set('Date and Time are mandatory.');
      return;
    }

    if (!aliquotVal) {
      this.showError('Aliquot could not be resolved');
      return;
    }

    this.dateTimeError.set(null);

    // Build chapter-local ISO datetime (NOT toISOString which converts to UTC)
    const freezeStartTimeISO = `${this.formatDateForApi(freezeDate)}T${freezeTime}:00`;

    const request: UpdateFreezeStartTimeRequestDto = {
      unitId,
      productCode,
      aliquot: aliquotVal,
      collDate: this.collectionDate().split('T')[0],
      freezeStartTime: freezeStartTimeISO,
    };

    this.isLoading.set(true);

    this.apiService.updateFreezeStartTime(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        const newEntry: FreezeStartTimeEntry = {
          unitId: response.unitId,
          collectionDate: response.collDate,
          productCode: response.productCode,
          productDescription: response.productDescription,
          freezeStartDateTime: this.formatDateTime(response.freezeStartTime),
          aliquot: response.aliquot,
        };

        this.savedEntries.update((entries) => [...entries, newEntry]);

        const entryCount = this.savedEntries().length;
        this.showSuccess(`${entryCount} ${entryCount === 1 ? 'Entry' : 'Entries'} modified`);

        if (response.cmtiGenerated && response.warning) {
          this.showCmtiWarningDialog(response.warning);
        }

        this.clearInputFields();
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorMessage = this.extractErrorMessage(error);
        this.showError(errorMessage);
      },
    });
  }

  protected onTimeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9:]/g, '');
    if (value.length === 2 && !value.includes(':')) {
      value += ':';
    }
    if (value !== input.value) {
      input.value = value;
      this.freezeTimeControl.setValue(value, { emitEvent: false });
    }
  }

  protected handleEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveCurrentEntry();
    }
  }

  private showCmtiWarningDialog(warningMessage: string): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      disableClose: false,
      data: {
        title: 'CMTI Interdiction Warning',
        message: warningMessage,
        confirmText: 'OK',
        cancelText: undefined,
      },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => this.unitIdField?.focus(), 100);
    });
  }

  private clearInputFields(): void {
    this.freezeDateControl.setValue(null);
    this.freezeTimeControl.setValue('');
    this.dateTimeError.set(null);
    this.unitAlreadyScanned.set(false);
    this.aliquot.set('');
    this.componentDetails.set(null);
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
    this.unitData.set(null);
    this.collectionDate.set('');
    this.productDescription.set('');
    this.products.set([]);
    this.savedEntries.set([]);
    this.aliquot.set('');
    this.componentDetails.set(null);
    this.clearInputFields();
    this.pageIndex.set(0);
  }

  private clearFilters(): void {
    this.productControl.setValue('');
  }

  private extractErrorMessage(error: any): string {
    if (error?.error?.errorResponse?.error) {
      return error.error.errorResponse.error;
    }
    if (error?.error?.errorResponse?.errorCode) {
      const errorCode = error.error.errorResponse.errorCode;
      return FREEZE_ERROR_MESSAGES[errorCode] || error.error.message || 'An error occurred';
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

  protected formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatDateForApi(date: any): string {
    if (date?.format) {
      return date.format('YYYY-MM-DD');
    }
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private extractShortDescription(fullDescription: string): string {
    if (!fullDescription) return '';
    const pipeIndex = fullDescription.indexOf('|');
    return pipeIndex > -1 ? fullDescription.substring(0, pipeIndex).trim() : fullDescription;
  }

  private formatDateTime(dateTime: string): string {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year}  ${hours}:${minutes}`;
  }
}
