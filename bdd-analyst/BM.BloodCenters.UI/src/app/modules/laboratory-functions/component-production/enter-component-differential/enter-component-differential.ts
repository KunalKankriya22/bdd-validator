import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, HostListener, inject, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, startWith, takeUntil } from 'rxjs';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { DataTable } from '@shared/components/data-table/data-table';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';
import { EnterComponentDifferentialService } from './services/enter-component-differential.service';
import { AddEditCellCountComponent } from './add-edit-cell-count/add-edit-cell-count';
import type { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import type { DataTableConfig, TableRowActionEvent, TablePageEvent } from '@shared/interfaces/data-table.interface';
import type {
  ProcessCodeItem,
  StageCodeItem,
  ProductCodeItem,
  CellCodeItem,
  CellCountRow,
  ComponentDifferentialHeaderResponse,
  UpdateDifferentialRequest,
} from './models/enter-component-differential.model';

@Component({
  selector: 'app-enter-component-differential',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
    AddEditCellCountComponent,
  ],
  providers: [DatePipe],
  templateUrl: './enter-component-differential.html',
  styleUrls: ['./enter-component-differential.scss'],
})
export class EnterComponentDifferentialComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EnterComponentDifferentialService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly datePipe = inject(DatePipe);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild(AddEditCellCountComponent) addEditCellCount!: AddEditCellCountComponent;

  readonly processCodes = signal<ProcessCodeItem[]>([]);
  readonly stageCodes = signal<StageCodeItem[]>([]);
  readonly productCodes = signal<ProductCodeItem[]>([]);
  readonly cellCodes = signal<CellCodeItem[]>([]);

  readonly cellCountRows = signal<CellCountRow[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly hasSearched = signal(false);
  readonly loadingComponentInfo = signal(false);

  readonly selectedProcessCode = signal('');
  readonly selectedStageCode = signal('');
  readonly selectedUnitId = signal('');
  readonly selectedProductCode = signal('');
  readonly selectedComponentPrefix = signal('');
  readonly collDate = signal('');
  readonly differentialId = signal<number | null>(null);

  readonly currentPageIndex = signal(0);
  readonly currentPageSize = signal(10);

  readonly aboRhValue = signal('--');
  readonly expiryDateValue = signal('--');

  readonly sidePanelOpen = signal(false);
  readonly sidePanelMode = signal<'add' | 'edit'>('add');
  readonly sidePanelData = signal<CellCountRow | null>(null);

  filteredProcessCodes: ProcessCodeItem[] = [];
  filteredStageCodes: StageCodeItem[] = [];
  filteredProductCodes: ProductCodeItem[] = [];

  readonly processCodeSearch = new FormControl('');
  readonly stageCodeSearch = new FormControl('');
  readonly productCodeSearch = new FormControl('');

  readonly expirationDateTime = computed(() => {
    const val = this.expiryDateValue();
    if (!val || val === '--') return '--';
    const formatted = this.datePipe.transform(val, 'dd-MMM-yyyy, hh:mm a');
    return formatted?.toUpperCase() ?? '--';
  });

  readonly paginatedRows = computed(() => {
    const all = this.cellCountRows();
    const start = this.currentPageIndex() * this.currentPageSize();
    return all.slice(start, start + this.currentPageSize());
  });

  readonly retrieveDisabled = computed(() => {
    return this.loading() || !this.selectedProcessCode() || !this.selectedStageCode()
      || !this.selectedUnitId() || !this.selectedProductCode();
  });

  private readonly disableEffect = effect(() => {
    const hasProcess = !!this.selectedProcessCode();
    const hasStage = !!this.selectedStageCode();
    const hasUnit = !!this.selectedUnitId();

    const stageCtrl = this.searchForm.get('stageCode');
    const productCtrl = this.searchForm.get('productCode');
    const unitCtrl = this.unitIdField?.unitIdControl;

    hasProcess ? stageCtrl?.enable({ emitEvent: false }) : stageCtrl?.disable({ emitEvent: false });
    (hasProcess && hasStage) ? unitCtrl?.enable({ emitEvent: false }) : unitCtrl?.disable({ emitEvent: false });
    (hasProcess && hasStage && hasUnit) ? productCtrl?.enable({ emitEvent: false }) : productCtrl?.disable({ emitEvent: false });
  });

  private readonly addNewBtnEffect = effect(() => {
    const searched = this.hasSearched();
    this.pageHeaderConfig = {
      ...this.pageHeaderConfig,
      actions: [
        {
          ...this.pageHeaderConfig.actions![0],
          disabled: !searched,
        },
      ],
    };
    this.cdr.markForCheck();
  });

  readonly searchForm: FormGroup = this.fb.group({
    processCode: [''],
    stageCode: [''],
    productCode: [''],
  });

  readonly tableConfig: DataTableConfig<CellCountRow> = {
    columns: [
      { key: 'cellCode', header: 'Cell Code', sortable: false },
      { key: 'cellCodeDesc', header: 'Cell Description', sortable: false },
      { key: 'cellCount', header: 'Count (%)', sortable: false, type: 'number',
        valueFormatter: (value: number) => value != null ? value.toFixed(2) : '--' },
    ],
    rowActions: [
      { icon: 'edit', action: 'edit', ariaLabel: 'Edit cell count' },
    ],
    showPagination: true,
    pagination: {
      pageSize: 10,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [3, 5, 10, 25],
    },
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    enableRowHighlight: true,
  };

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Enter Component Differential', link: null },
    ],
    actions: [
      {
        label: 'ADD NEW',
        icon: 'add',
        matButton: 'raised',
        ariaLabel: 'Add new cell count',
        disabled: true,
        onClick: () => this.onAddNew(),
      },
    ],
  };

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.sidePanelOpen()) {
      event.stopPropagation();
      this.closeSidePanel();
    }
  }

  ngOnInit(): void {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    if (menuItem?.label) {
      this.pageHeaderConfig = {
        ...this.pageHeaderConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: menuItem.label, link: null },
        ],
        actions: this.pageHeaderConfig.actions,
      };
    }

    this.loadProcessCodes();
    this.loadCellCodes();
    this.setupSearchFilters();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    this.unitIdField?.unitIdControl?.disable({ emitEvent: false });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Dropdown change handlers ---

  onProcessCodeChange(): void {
    const processCode = this.searchForm.get('processCode')?.value ?? '';
    this.selectedProcessCode.set(processCode);
    this.searchForm.patchValue({ stageCode: '', productCode: '' }, { emitEvent: false });
    this.unitIdField?.clear();
    this.resetDownstreamFromProcess();

    if (processCode) {
      this.loadStageCodes(processCode);
    }
  }

  onStageCodeChange(): void {
    const stageCode = this.searchForm.get('stageCode')?.value ?? '';
    this.selectedStageCode.set(stageCode);
    this.searchForm.patchValue({ productCode: '' }, { emitEvent: false });
    this.unitIdField?.clear();
    this.resetDownstreamFromStage();
  }

  onProductCodeChange(): void {
    const productCode = this.searchForm.get('productCode')?.value ?? '';
    this.selectedProductCode.set(productCode);

    const match = this.productCodes().find(p => p.productCode === productCode);
    this.selectedComponentPrefix.set(match?.componentPrefix ?? '');

    this.resetDownstreamFromProduct();

    if (productCode && match) {
      this.loadComponentInfo();
    }
  }

  onDropdownOpenChange(opened: boolean, type: 'process' | 'stage' | 'product'): void {
    if (opened) {
      switch (type) {
        case 'process': this.filteredProcessCodes = [...this.processCodes()]; break;
        case 'stage': this.filteredStageCodes = [...this.stageCodes()]; break;
        case 'product': this.filteredProductCodes = [...this.productCodes()]; break;
      }
    } else {
      switch (type) {
        case 'process': this.processCodeSearch.setValue('', { emitEvent: false }); break;
        case 'stage': this.stageCodeSearch.setValue('', { emitEvent: false }); break;
        case 'product': this.productCodeSearch.setValue('', { emitEvent: false }); break;
      }
    }
  }

  // --- Unit ID handlers ---

  onUnitValidated(data: UnitValidationResponse): void {
    this.selectedUnitId.set(data.parsedUnitId);
    this.searchForm.patchValue({ productCode: '' }, { emitEvent: false });
    this.selectedProductCode.set('');
    this.selectedComponentPrefix.set('');
    this.productCodes.set([]);
    this.filteredProductCodes = [];
    this.resetDownstreamFromProduct();

    this.loadUnitInfo(data.parsedUnitId);
  }

  onUnitCleared(): void {
    this.selectedUnitId.set('');
    this.collDate.set('');
    this.searchForm.patchValue({ productCode: '' }, { emitEvent: false });
    this.selectedProductCode.set('');
    this.selectedComponentPrefix.set('');
    this.productCodes.set([]);
    this.filteredProductCodes = [];
    this.resetDownstreamFromProduct();
  }

  // --- RETRIEVE button ---

  onRetrieve(): void {
    const processCode = this.selectedProcessCode();
    const stageCode = this.selectedStageCode();
    const unitId = this.selectedUnitId();
    const productCode = this.selectedProductCode();
    const componentPrefix = this.selectedComponentPrefix();
    const collDateVal = this.collDate();

    if (!processCode || !stageCode || !unitId || !productCode) return;

    this.loading.set(true);
    this.currentPageIndex.set(0);

    this.service.search(1, 0, {
      unitId,
      collDate: collDateVal || undefined,
      productCode,
      componentPrefix: componentPrefix || undefined,
      processCode,
      stageCode,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.hasSearched.set(true);
          if (result.data.length > 0) {
            const hdr = result.data[0];
            this.differentialId.set(hdr.differentialId);
            this.loadDifferentialDetails(hdr.differentialId);
          } else {
            this.differentialId.set(null);
            this.cellCountRows.set([]);
            this.loading.set(false);
            this.updateTablePagination();
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.differentialId.set(null);
          this.cellCountRows.set([]);
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'An error occurred while retrieving data'));
        },
      });
  }

  onClearAll(): void {
    this.searchForm.reset();
    this.unitIdField?.clear();
    this.cellCountRows.set([]);
    this.hasSearched.set(false);
    this.selectedProcessCode.set('');
    this.selectedStageCode.set('');
    this.selectedUnitId.set('');
    this.selectedProductCode.set('');
    this.selectedComponentPrefix.set('');
    this.collDate.set('');
    this.differentialId.set(null);
    this.currentPageIndex.set(0);
    this.aboRhValue.set('--');
    this.expiryDateValue.set('--');
    this.stageCodes.set([]);
    this.filteredStageCodes = [];
    this.productCodes.set([]);
    this.filteredProductCodes = [];
    this.closeSidePanel();
  }

  // --- Side panel ---

  onAddNew(): void {
    this.sidePanelMode.set('add');
    this.sidePanelData.set(null);
    this.sidePanelOpen.set(true);
  }

  onRowAction(event: TableRowActionEvent<CellCountRow>): void {
    if (event.action === 'edit') {
      this.sidePanelMode.set('edit');
      this.sidePanelData.set(event.row);
      this.sidePanelOpen.set(true);
    }
  }

  onSidePanelSave(payload: { cellCode: string; cellCount: number }): void {
    if (this.sidePanelMode() === 'edit') {
      this.updateCellCount(payload, false);
    } else {
      this.createCellCount(payload, false);
    }
  }

  onSidePanelSaveAndCreateAnother(payload: { cellCode: string; cellCount: number }): void {
    if (this.sidePanelMode() === 'edit') {
      this.updateCellCount(payload, true);
    } else {
      this.createCellCount(payload, true);
    }
  }

  closeSidePanel(): void {
    this.sidePanelOpen.set(false);
    this.sidePanelData.set(null);
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPageIndex.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
    this.updateTablePagination();
  }

  hasAnyFilterValue(): boolean {
    const { processCode, stageCode, productCode } = this.searchForm.getRawValue();
    return !!(processCode || stageCode || this.selectedUnitId() || productCode);
  }

  // --- Private: data loading ---

  private loadProcessCodes(): void {
    this.service.getProcessCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.processCodes.set(codes);
          this.filteredProcessCodes = [...codes];
        },
        error: () => {
          this.snackbarService.showError('Failed to load process codes. Please refresh the page.');
        },
      });
  }

  private loadCellCodes(): void {
    this.service.getCellCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.cellCodes.set(codes),
        error: () => {
          this.snackbarService.showError('Failed to load cell codes. Please refresh the page.');
        },
      });
  }

  private loadStageCodes(processCode: string): void {
    this.service.getStageCodes(processCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.stageCodes.set(codes);
          this.filteredStageCodes = [...codes];
        },
      });
  }

  private loadUnitInfo(unitId: string): void {
    this.service.getUnitInfo(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          if (info?.collDate) {
            this.collDate.set(info.collDate);
            this.loadProductCodes();
          } else {
            this.collDate.set('');
            this.snackbarService.showError('Unit not found.');
          }
        },
        error: () => {
          this.collDate.set('');
          this.snackbarService.showError('Error fetching unit info.');
        },
      });
  }

  private loadProductCodes(): void {
    const unitId = this.selectedUnitId();
    const collDateVal = this.collDate();
    const processCode = this.selectedProcessCode();

    if (!unitId || !collDateVal || !processCode) return;

    this.service.getProductCodes(unitId, collDateVal, processCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.productCodes.set(codes);
          this.filteredProductCodes = [...codes];
        },
        error: () => {
          this.productCodes.set([]);
          this.filteredProductCodes = [];
        },
      });
  }

  private loadComponentInfo(): void {
    const unitId = this.selectedUnitId();
    const collDateVal = this.collDate();
    const productCode = this.selectedProductCode();
    const componentPrefix = this.selectedComponentPrefix();
    const processCode = this.selectedProcessCode();

    if (!unitId || !collDateVal || !productCode || !processCode) return;

    this.loadingComponentInfo.set(true);
    this.aboRhValue.set('--');
    this.expiryDateValue.set('--');

    this.service.getComponentInfo(unitId, collDateVal, productCode, componentPrefix, processCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.loadingComponentInfo.set(false);
          if (info) {
            this.aboRhValue.set(info.aboRh ?? '--');
            this.expiryDateValue.set(info.expiryDate ?? '--');
          }
        },
        error: () => {
          this.loadingComponentInfo.set(false);
        },
      });
  }

  private loadDifferentialDetails(diffId: number): void {
    this.service.getById(diffId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response?.details) {
            this.cellCountRows.set(response.details.map(d => ({
              differentialId: d.differentialId,
              cellCode: d.cellCode,
              cellCodeDesc: d.cellCodeDesc ?? '',
              cellCount: d.cellCount,
              originalCellCode: d.cellCode,
            })));
          } else {
            this.cellCountRows.set([]);
          }
          this.updateTablePagination();
        },
        error: () => {
          this.loading.set(false);
          this.cellCountRows.set([]);
        },
      });
  }

  // --- Private: create / update ---

  private createCellCount(payload: { cellCode: string; cellCount: number }, addAnother: boolean): void {
    this.saving.set(true);

    this.service.create({
      unitId: this.selectedUnitId(),
      collDate: this.collDate(),
      productCode: this.selectedProductCode(),
      componentPrefix: this.selectedComponentPrefix(),
      processCode: this.selectedProcessCode(),
      stageCode: this.selectedStageCode(),
      cellCode: payload.cellCode,
      cellCount: payload.cellCount,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.snackbarService.showSuccess('Differential cell count created successfully.');
          if (response?.data?.differentialId) {
            this.differentialId.set(response.data.differentialId);
          }
          if (addAnother) {
            this.addEditCellCount?.resetForm();
            this.sidePanelMode.set('add');
            this.sidePanelData.set(null);
          } else {
            this.closeSidePanel();
          }
          this.refreshDetails();
        },
        error: (error) => {
          this.saving.set(false);
          this.addEditCellCount?.resetSubmitting();
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'An error occurred while saving'));
        },
      });
  }

  private updateCellCount(payload: { cellCode: string; cellCount: number }, addAnother: boolean): void {
    const diffId = this.differentialId();
    const originalCellCode = this.sidePanelData()?.originalCellCode;
    if (diffId == null || !originalCellCode) return;

    this.saving.set(true);

    const body: UpdateDifferentialRequest = { cellCount: payload.cellCount };
    if (payload.cellCode !== originalCellCode) {
      body.cellCode = payload.cellCode;
    }

    this.service.update(diffId, originalCellCode, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbarService.showSuccess('Differential cell count updated successfully.');
          if (addAnother) {
            this.addEditCellCount?.resetForm();
            this.sidePanelMode.set('add');
            this.sidePanelData.set(null);
          } else {
            this.closeSidePanel();
          }
          this.refreshDetails();
        },
        error: (error) => {
          this.saving.set(false);
          this.addEditCellCount?.resetSubmitting();
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'An error occurred while saving'));
        },
      });
  }

  private refreshDetails(): void {
    const diffId = this.differentialId();
    if (diffId != null) {
      this.loadDifferentialDetails(diffId);
    } else {
      this.onRetrieve();
    }
  }

  // --- Private: reset helpers ---

  private resetDownstreamFromProcess(): void {
    this.selectedStageCode.set('');
    this.selectedUnitId.set('');
    this.selectedProductCode.set('');
    this.selectedComponentPrefix.set('');
    this.collDate.set('');
    this.differentialId.set(null);
    this.stageCodes.set([]);
    this.filteredStageCodes = [];
    this.productCodes.set([]);
    this.filteredProductCodes = [];
    this.aboRhValue.set('--');
    this.expiryDateValue.set('--');
    this.cellCountRows.set([]);
    this.closeSidePanel();
  }

  private resetDownstreamFromStage(): void {
    this.selectedUnitId.set('');
    this.selectedProductCode.set('');
    this.selectedComponentPrefix.set('');
    this.collDate.set('');
    this.differentialId.set(null);
    this.productCodes.set([]);
    this.filteredProductCodes = [];
    this.aboRhValue.set('--');
    this.expiryDateValue.set('--');
    this.cellCountRows.set([]);
    this.closeSidePanel();
  }

  private resetDownstreamFromProduct(): void {
    this.differentialId.set(null);
    this.aboRhValue.set('--');
    this.expiryDateValue.set('--');
    this.cellCountRows.set([]);
    this.closeSidePanel();
  }

  // --- Private: search filter setup ---

  private setupSearchFilters(): void {
    this.processCodeSearch.valueChanges.pipe(startWith(''), takeUntil(this.destroy$)).subscribe(q => {
      const s = (q || '').toLowerCase();
      this.filteredProcessCodes = s
        ? this.processCodes().filter(p => p.processCode.toLowerCase().includes(s))
        : [...this.processCodes()];
    });

    this.stageCodeSearch.valueChanges.pipe(startWith(''), takeUntil(this.destroy$)).subscribe(q => {
      const s = (q || '').toLowerCase();
      this.filteredStageCodes = s
        ? this.stageCodes().filter(c => c.stageCode.toLowerCase().includes(s) || c.description.toLowerCase().includes(s))
        : [...this.stageCodes()];
    });

    this.productCodeSearch.valueChanges.pipe(startWith(''), takeUntil(this.destroy$)).subscribe(q => {
      const s = (q || '').toLowerCase();
      this.filteredProductCodes = s
        ? this.productCodes().filter(p => p.productCode.toLowerCase().includes(s) || (p.productDesc || '').toLowerCase().includes(s))
        : [...this.productCodes()];
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadProcessCodes();
        this.loadCellCodes();
      });
  }

  private updateTablePagination(): void {
    this.tableConfig.pagination = {
      ...this.tableConfig.pagination!,
      totalRecords: this.cellCountRows().length,
      pageIndex: this.currentPageIndex(),
      pageSize: this.currentPageSize(),
    };
  }
}
