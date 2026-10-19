import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil, finalize, startWith } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment, { Moment } from 'moment';

import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';

import { UnitIdFieldComponent, UnitIdPostValidateEvent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { CommitReagentsForComponentService } from './services/commit-reagents-for-component.service';
import {
  CodeScheme,
  ProcessCodeDropdownDto,
  StageCodeDropdownDto,
  UnitProductDto,
  ReagentRowDto,
  ReagentFilterValue,
  CreateKitDto,
  UpdateKitDto,
} from './models/commit-reagents-for-component.model';
import { TableSortEvent } from '@shared/interfaces/data-table.interface';
import { ReagentFilterPanel } from './reagent-filter-panel/reagent-filter-panel';

type SaveMode = 'INSERT' | 'EDIT' | null;

function makeFutureDateValidator(getChapterDate: () => moment.Moment) {
  return (control: AbstractControl) => {
    if (!control.value) return null;
    const val = moment.isMoment(control.value) ? control.value : moment(control.value);
    if (!val.isValid()) return { invalidDate: true };
    const today = getChapterDate().clone().startOf('day');
    return val.isBefore(today) ? { pastDate: true } : null;
  };
}

@Component({
  selector: 'app-commit-reagents-for-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatMomentDateModule,
    OverlayModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    FilterChips,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './commit-reagents-for-component.html',
  styleUrls: ['./commit-reagents-for-component.scss'],
})
export class CommitReagentsForComponentComponent implements OnInit, OnDestroy {
  private readonly service = inject(CommitReagentsForComponentService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly overlay = inject(Overlay);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('filterButton', { read: ElementRef }) filterButtonRef!: ElementRef;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          breadcrumbs: [{ label: 'Home', link: '/home' }, { label: pageData.title, link: null }],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  // ── Loading flags ───────────────────────────────────────────────────────────
  isLoadingStages = false;
  isLoadingUnitInfo = false;
  isLoadingProducts = false;
  isLoadingComponentInfo = false;
  isLoadingKit = false;
  isSaving = false;

  // ── Form state ─────────────────────────────────────────────────────────────
  headerForm!: FormGroup;
  editForm!: FormGroup;

  // ── Dropdown data ──────────────────────────────────────────────────────────
  processCodes: ProcessCodeDropdownDto[] = [];
  stageCodes: StageCodeDropdownDto[] = [];
  unitProducts: UnitProductDto[] = [];

  // Filtered lists for searchable dropdowns
  filteredProcessCodes: ProcessCodeDropdownDto[] = [];
  filteredStageCodes: StageCodeDropdownDto[] = [];
  filteredUnitProducts: UnitProductDto[] = [];

  // Search controls
  readonly processCodeSearch = new FormControl('');
  readonly stageCodeSearch = new FormControl('');
  readonly productCodeSearch = new FormControl('');

  // ── Edit table sort ────────────────────────────────────────────────────────
  sortColumn = 'reagentName';
  sortDirection: 'asc' | 'desc' = 'asc';
  sortedRowIndices: number[] = [];

  // ── Resolved state (not user input) ───────────────────────────────────────
  collDate: string | null = null;
  componentPrefix: string | null = null;
  kitId: string | null = null;
  saveMode: SaveMode = null;

  // ── Code scheme (chapter-level: 'I' = ISBT, 'C' = Codabar) ──────────────
  codeScheme: CodeScheme = 'I';

  // ── Read-only display ──────────────────────────────────────────────────────
  aboRh = '-';
  expiryDate = '-';
  isComponentExpired = false;

  // ── Datepicker constraints ─────────────────────────────────────────────────
  get minExpDate(): Moment {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  readonly expDateFilter = (date: Moment | null): boolean => {
    if (!date) return true;
    const today = this.chapterTimezoneService.getChapterLocalDate();
    return date.format('YYYY-MM-DD') >= today.format('YYYY-MM-DD');
  };

  // ── Results / edit grid ────────────────────────────────────────────────────
  hasData = false;
  isEditMode = false;

  viewReagents: ReagentRowDto[] = [];
  filteredReagents: ReagentRowDto[] = [];
  searchText = '';
  appliedFilters: ReagentFilterValue | null = null;
  filterOverlayRef: OverlayRef | null = null;

  tableConfig: DataTableConfig<ReagentRowDto> = {
    columns: [
      { key: 'reagentName', header: 'Reagent', sortable: true },
      { key: 'manufacturer', header: 'Manufacturer' },
      { key: 'lotNumber', header: 'Lot Number' },
      { key: 'expDate', header: 'Expiration Date', valueFormatter: (v: string) => v ? moment(v).format('DD-MMM-YYYY') : '-' },
    ],
    showPagination: false,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter search criteria to view results',
    noDataIcon: 'search',
  };

  // ── Error messages ─────────────────────────────────────────────────────────
  private readonly ERROR_CODES: Record<string, string> = {
    '0063': 'Unit ID not found',
    '0124': 'Component not found for the selected process',
    '1207': 'Invalid process code',
    '1212': 'Invalid stage code for the selected process',
    '0010': 'All fields are required in each reagent row',
    '4007': 'Expiration date must be today or a future date',
    '0016': 'Expiration date cannot be earlier than the last time this kit was used',
    '0230': 'Save failed — please try again',
  };

  ngOnInit(): void {
    this.initForms();
    this.setupSearchFilters();
    this.loadProcessCodes();
    this.loadCodeScheme();
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.resetAll();
      this.loadProcessCodes();
      this.loadCodeScheme();
    });
  }

  private setupSearchFilters(): void {
    this.processCodeSearch.valueChanges.pipe(startWith(''), takeUntil(this.destroy$)).subscribe(q => {
      const s = (q || '').toLowerCase();
      this.filteredProcessCodes = s
        ? this.processCodes.filter(p => p.code.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s))
        : [...this.processCodes];
    });

    this.stageCodeSearch.valueChanges.pipe(startWith(''), takeUntil(this.destroy$)).subscribe(q => {
      const s = (q || '').toLowerCase();
      this.filteredStageCodes = s
        ? this.stageCodes.filter(c => c.code.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s))
        : [...this.stageCodes];
    });

    this.productCodeSearch.valueChanges.pipe(startWith(''), takeUntil(this.destroy$)).subscribe(q => {
      const s = (q || '').toLowerCase();
      this.filteredUnitProducts = s
        ? this.unitProducts.filter(p => p.productCode.toLowerCase().includes(s) || p.productDesc?.toLowerCase().includes(s))
        : [...this.unitProducts];
    });
  }

  clearDropdownSearch(ctrl: FormControl): void {
    ctrl.setValue('', { emitEvent: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeFilterPanel();
  }

  private initForms(): void {
    this.headerForm = this.fb.group({
      processCode: ['', Validators.required],
      stageCode: ['', Validators.required],
      productCode: ['', Validators.required],
    });
    this.editForm = this.fb.group({ rows: this.fb.array([]) });
  }

  // ── Accessors ───────────────────────────────────────────────────────────────
  get rowsArray(): FormArray { return this.editForm.get('rows') as FormArray; }
  getRowGroup(i: number): FormGroup { return this.rowsArray.at(i) as FormGroup; }

  isRowFieldInvalid(rowIndex: number, field: string): boolean {
    const ctrl = this.getRowGroup(rowIndex).get(field);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  onExpDateInput(event: Event, rowIndex: number): void {
    const inputValue = (event.target as HTMLInputElement).value ?? '';
    DateFieldValidationUtility.handleStartDateInput(inputValue, this.getRowGroup(rowIndex).get('expDate'));
  }

  get filterChips(): FilterChip[] {
    if (!this.appliedFilters?.expirationDate) return [];
    const dateLabel = moment(this.appliedFilters.expirationDate).format('DD-MMM-YYYY').toUpperCase();
    const periodLabel = this.appliedFilters.period.charAt(0).toUpperCase() + this.appliedFilters.period.slice(1);
    return [{
      key: 'expirationDate',
      label: `Expiration Date: ${periodLabel} ${dateLabel}`,
      value: this.appliedFilters,
    }];
  }

  removeFilterChip(key: string): void {
    if (key === 'expirationDate') {
      this.appliedFilters = null;
      this.applyFilter();
    }
  }

  clearAllFilters(): void {
    this.appliedFilters = null;
    this.applyFilter();
  }

  get isStageDisabled(): boolean { return !this.headerForm.get('processCode')?.value; }
  get isProductDisabled(): boolean { return !this.collDate; }

  get isRetrieveEnabled(): boolean {
    if (this.isLoadingUnitInfo || this.isLoadingProducts || this.isLoadingComponentInfo || this.isLoadingKit) return false;
    if (!this.unitIdField?.isValid) return false;
    if (this.headerForm.invalid) return false;
    return !!(this.collDate && this.componentPrefix != null);
  }

  get showComponentPrefix(): boolean {
    return this.codeScheme === 'C' && !!this.componentPrefix;
  }

  get isSaveDisabled(): boolean {
    if (this.isSaving) return true;
    if (!this.rowsArray.length) return true;
    if (this.saveMode === 'EDIT' && this.editForm.pristine) return true;
    return false;
  }

  getProcessDescription(): string {
    const code = this.headerForm?.get('processCode')?.value;
    return this.processCodes.find(p => p.code === code)?.description || '-';
  }

  getStageDescription(): string {
    const code = this.headerForm?.get('stageCode')?.value;
    return this.stageCodes.find(s => s.code === code)?.description || '-';
  }

  getProductLabel(product: UnitProductDto): string {
    return product.productDesc ? `${product.productCode} - ${product.productDesc}` : product.productCode;
  }

  // ── Step 1: Load Process Codes ──────────────────────────────────────────────
  private loadProcessCodes(): void {
    this.service.getProcessCodes().pipe(takeUntil(this.destroy$)).subscribe({
      next: codes => {
        this.processCodes = codes;
        this.filteredProcessCodes = [...codes];
      },
    });
  }

  private loadCodeScheme(): void {
    this.service.getCodeScheme().pipe(takeUntil(this.destroy$)).subscribe({
      next: scheme => { this.codeScheme = scheme; },
    });
  }

  // ── Step 2: Load Stage Codes on Process Code change ─────────────────────────
  onProcessCodeChange(): void {
    this.stageCodes = [];
    this.filteredStageCodes = [];
    this.headerForm.patchValue({ stageCode: '', productCode: '' });
    this.resetDownstreamFromStage();

    const processCode = this.headerForm.get('processCode')?.value;
    if (!processCode) return;

    this.isLoadingStages = true;
    this.service.getStageCodes(processCode)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isLoadingStages = false; }))
      .subscribe({
        next: codes => {
          this.stageCodes = codes;
          this.filteredStageCodes = [...codes];
        },
      });
  }

  onStageCodeChange(): void {
    this.resetResults();
  }

  // ── Step 3: Unit ID — shared component events ──────────────────────────────
  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    this.clearUnitResolved();
    const parsedUnitId = event.data.parsedUnitId;

    this.isLoadingUnitInfo = true;
    this.service.getUnitInfo(parsedUnitId)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isLoadingUnitInfo = false; }))
      .subscribe({
        next: info => {
          if (!info?.collDate) {
            event.reject('Unit ID not found');
            return;
          }
          this.collDate = info.collDate;
          this.headerForm.patchValue({ productCode: '' });
          this.unitProducts = [];
          this.resetResults();
          this.loadUnitProducts(parsedUnitId);
          event.confirm();
        },
        error: () => {
          event.reject('Unit ID not found');
        },
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {
    // collDate and products already set in onUnitPostValidate
  }

  onUnitCleared(): void {
    this.clearUnitResolved();
  }

  private clearUnitResolved(): void {
    this.collDate = null;
    this.unitProducts = [];
    this.filteredUnitProducts = [];
    this.componentPrefix = null;
    this.headerForm.patchValue({ productCode: '' });
    this.aboRh = '-';
    this.expiryDate = '-';
    this.isComponentExpired = false;
    this.resetResults();
  }

  // ── Step 4: Load Products after Unit resolved ───────────────────────────────
  private loadUnitProducts(parsedUnitId: string): void {
    const { processCode } = this.headerForm.value;
    if (!processCode || !this.collDate || !parsedUnitId) return;

    this.isLoadingProducts = true;
    this.service.getUnitProducts(parsedUnitId, this.collDate, processCode)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isLoadingProducts = false; }))
      .subscribe({
        next: products => {
          this.unitProducts = products;
          this.filteredUnitProducts = [...products];
          if (!products.length) {
            this.showError(this.ERROR_CODES['0124']);
            this.unitIdField?.clear();
          }
        },
      });
  }

  // ── Step 5: Load Component Info on Product selection ───────────────────────
  onProductCodeChange(): void {
    const productCode = this.headerForm.get('productCode')?.value;
    const selected = this.unitProducts.find(p => p.productCode === productCode);
    this.componentPrefix = selected?.componentPrefix || null;
    this.aboRh = '-';
    this.expiryDate = '-';
    this.isComponentExpired = false;
    this.resetResults();

    if (!productCode || !this.collDate || !this.componentPrefix) return;

    const { processCode } = this.headerForm.value;
    const unitId = this.unitIdField?.parsedUnitId ?? '';
    this.isLoadingComponentInfo = true;
    this.service.getComponentInfo(unitId, this.collDate, productCode, this.componentPrefix, processCode)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isLoadingComponentInfo = false; }))
      .subscribe({
        next: info => {
          if (!info) { this.showError('Component not found for this process'); return; }
          this.aboRh = info.aboRh || '-';
          this.expiryDate = info.expiryDate
            ? moment(info.expiryDate).format('DD-MMM-YYYY HH:mm').toUpperCase()
            : '-';
          const expDate = info.expiryDate ? new Date(info.expiryDate) : null;
          if (expDate) {
            const today = this.chapterTimezoneService.getChapterLocalDate().toDate();
            this.isComponentExpired = expDate < today;
          }
        },
      });
  }

  // ── Step 6: Retrieve / check kit ───────────────────────────────────────────
  onRetrieve(): void {
    if (!this.isRetrieveEnabled) {
      this.headerForm.markAllAsTouched();
      this.showError('Please fill all required fields.');
      return;
    }
    const { processCode, stageCode, productCode } = this.headerForm.value;
    const unitId = this.unitIdField?.parsedUnitId ?? '';
    this.isLoadingKit = true;
    this.hasData = false;
    this.isEditMode = false;

    this.service.checkKit(unitId, this.collDate!, productCode, this.componentPrefix!, processCode, stageCode)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.isLoadingKit = false; }))
      .subscribe({
        next: kit => {
          if (kit) {
            // Existing kit — show in VIEW mode first; user clicks ADD/EDIT to enter edit
            this.kitId = kit.kitId;
            this.saveMode = 'EDIT';
            this.viewReagents = kit.reagents || [];
            this.filteredReagents = [...this.viewReagents];
            this.hasData = true;
            this.isEditMode = false;
          } else {
            // No kit yet — go straight to edit mode so user can add reagents
            this.kitId = null;
            this.saveMode = 'INSERT';
            this.loadLatestKitTemplate(processCode, stageCode);
          }
        },
        error: err => { this.showError(this.resolveError(err)); },
      });
  }

  // ── Step 7: Load latest kit template (INSERT mode) ─────────────────────────
  private loadLatestKitTemplate(processCode: string, stageCode: string): void {
    if (this.isComponentExpired) {
      this.hasData = true;
      this.enterEditMode([]);
      return;
    }
    this.service.getLatestKit(processCode, stageCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: kit => {
          const rows = kit?.reagents || [];
          this.viewReagents = rows;
          this.filteredReagents = [...rows];
          this.hasData = true;
          this.enterEditMode(rows);
        },
      });
  }

  // ── Edit table sort ────────────────────────────────────────────────────────
  onSortColumn(col: string): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.updateSortedIndices();
  }

  getSortIcon(col: string): string {
    if (this.sortColumn !== col) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  private updateSortedIndices(): void {
    const n = this.rowsArray.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    indices.sort((a, b) => {
      const aVal = (this.getRowGroup(a).get(this.sortColumn)?.value || '').toLowerCase();
      const bVal = (this.getRowGroup(b).get(this.sortColumn)?.value || '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });
    this.sortedRowIndices = indices;
  }

  // ── Edit grid helpers ───────────────────────────────────────────────────────
  private enterEditMode(rows: ReagentRowDto[]): void {
    this.isEditMode = true;
    this.sortColumn = 'reagentName';
    this.sortDirection = 'asc';
    this.rowsArray.clear();
    for (const r of rows) {
      this.rowsArray.push(this.buildRow(r));
    }
    if (!rows.length) {
      this.rowsArray.push(this.buildRow());
    }
    this.updateSortedIndices();
  }

  private buildRow(r?: ReagentRowDto): FormGroup {
    return this.fb.group({
      reagentName: [r?.reagentName || '', [Validators.required, Validators.maxLength(50)]],
      manufacturer: [r?.manufacturer || '', [Validators.required, Validators.maxLength(50)]],
      lotNumber: [r?.lotNumber || '', [Validators.required, Validators.maxLength(50)]],
      expDate: [r?.expDate || '', [Validators.required, makeFutureDateValidator(() => this.chapterTimezoneService.getChapterLocalDate())]],
    });
  }

  onAddNewReagent(): void {
    this.rowsArray.push(this.buildRow());
    this.editForm.markAsDirty();
    this.updateSortedIndices();
  }

  onDeleteRow(actualIndex: number): void {
    this.rowsArray.removeAt(actualIndex);
    this.editForm.markAsDirty();
    this.updateSortedIndices();
  }

  onCancel(): void {
    this.isEditMode = false;
    this.rowsArray.clear();
    this.sortedRowIndices = [];
    if (!this.viewReagents.length) {
      this.hasData = false;
    }
    this.filteredReagents = [...this.viewReagents];
  }

  // ── Step 8: Save ────────────────────────────────────────────────────────────
  onSave(): void {
    this.editForm.markAllAsTouched();

    if (!this.rowsArray.length) { this.showError('At least 1 reagent row must exist.'); return; }
    if (this.editForm.invalid) { this.showError('Please fix validation errors before saving.'); return; }

    const reagents: ReagentRowDto[] = this.rowsArray.controls.map(c => ({
      reagentName: c.get('reagentName')?.value,
      manufacturer: c.get('manufacturer')?.value,
      lotNumber: c.get('lotNumber')?.value,
      expDate: moment(c.get('expDate')?.value).format('YYYY-MM-DD'),
    }));

    this.isSaving = true;

    if (this.saveMode === 'EDIT' && this.kitId) {
      const payload: UpdateKitDto = { reagents };
      this.service.updateKit(this.kitId, payload)
        .pipe(takeUntil(this.destroy$), finalize(() => { this.isSaving = false; }))
        .subscribe({
          next: () => {
            this.showSuccess('Reagent kit updated successfully');
            this.exitEditModeAfterSave(reagents);
          },
          error: err => { this.showError(this.resolveError(err)); },
        });
    } else {
      const { processCode, stageCode, productCode } = this.headerForm.value;
      const unitId = this.unitIdField?.parsedUnitId ?? '';
      const payload: CreateKitDto = {
        unitId, collDate: this.collDate!, productCode,
        componentPrefix: this.componentPrefix!, processCode, stageCode, reagents,
      };
      this.service.createKit(payload)
        .pipe(takeUntil(this.destroy$), finalize(() => { this.isSaving = false; }))
        .subscribe({
          next: result => {
            this.kitId = result?.kitId != null ? String(result.kitId) : null;
            this.saveMode = this.kitId ? 'EDIT' : 'INSERT';
            this.showSuccess('Reagent kit created successfully');
            this.exitEditModeAfterSave(reagents);
          },
          error: err => { this.showError(this.resolveError(err)); },
        });
    }
  }

  private exitEditModeAfterSave(savedReagents: ReagentRowDto[]): void {
    this.viewReagents = savedReagents;
    this.filteredReagents = [...savedReagents];
    this.hasData = true;
    this.isEditMode = false;
    this.rowsArray.clear();
    this.searchText = '';
    this.appliedFilters = null;
  }

  // ── View mode: search ───────────────────────────────────────────────────────
  onSearch(text: string): void {
    this.searchText = text?.trim() || '';
    this.applyFilter();
  }

  // ── View mode: sort ─────────────────────────────────────────────────────────
  onViewSort(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.filteredReagents = [...this.filteredReagents].sort((a, b) => {
      const aVal = ((a as any)[event.column] || '').toLowerCase();
      const bVal = ((b as any)[event.column] || '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return event.direction === 'A' ? cmp : -cmp;
    });
  }

  applyFilter(): void {
    let result = [...this.viewReagents];

    if (this.searchText) {
      const lower = this.searchText.toLowerCase();
      result = result.filter(r =>
        r.reagentName?.toLowerCase().includes(lower) ||
        r.manufacturer?.toLowerCase().includes(lower)
      );
    }

    if (this.appliedFilters?.expirationDate && this.appliedFilters.period) {
      const filterDate = moment(this.appliedFilters.expirationDate).startOf('day');
      const period = this.appliedFilters.period.toLowerCase();
      result = result.filter(r => {
        if (!r.expDate) return false;
        const reagentDate = moment(r.expDate, ['DD-MMM-YYYY', 'DD-MON-YYYY', 'YYYY-MM-DD']).startOf('day');
        if (!reagentDate.isValid()) return true;
        if (period === 'after') return reagentDate.isAfter(filterDate);
        if (period === 'before') return reagentDate.isBefore(filterDate);
        if (period === 'on') return reagentDate.isSame(filterDate);
        return true;
      });
    }

    this.filteredReagents = result;
  }

  onAddEditReagent(): void {
    this.enterEditMode(this.viewReagents);
  }

  // ── Filter panel ────────────────────────────────────────────────────────────
  openFilterPanel(): void {
    if (this.filterOverlayRef) { this.closeFilterPanel(); return; }
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.filterButtonRef)
      .withPositions([{ originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 }]);
    this.filterOverlayRef = this.overlay.create({
      positionStrategy, hasBackdrop: true, backdropClass: 'cdk-overlay-transparent-backdrop',
    });
    const ref = this.filterOverlayRef.attach(new ComponentPortal(ReagentFilterPanel));
    ref.instance.currentFilters = this.appliedFilters;
    ref.instance.apply.pipe(takeUntil(this.destroy$)).subscribe(f => {
      this.appliedFilters = f; this.applyFilter(); this.closeFilterPanel();
      this.filterButtonRef.nativeElement.focus();
    });
    ref.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
      this.filterButtonRef.nativeElement.focus();
    });
    this.filterOverlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
      this.filterButtonRef.nativeElement.focus();
    });
    // Move focus into the overlay panel so keyboard users can interact with it
    setTimeout(() => {
      const panelEl = this.filterOverlayRef?.overlayElement?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      panelEl?.focus();
    }, 50);
  }

  closeFilterPanel(): void { this.filterOverlayRef?.dispose(); this.filterOverlayRef = null; }

  // ── Reset helpers ───────────────────────────────────────────────────────────
  resetAll(): void {
    this.unitIdField?.clear();
    this.headerForm.reset();
    this.stageCodes = [];
    this.unitProducts = [];
    this.collDate = null;
    this.componentPrefix = null;
    this.kitId = null;
    this.saveMode = null;
    this.aboRh = '-';
    this.expiryDate = '-';
    this.isComponentExpired = false;
    this.codeScheme = 'I';
    this.searchText = '';
    this.appliedFilters = null;
    this.closeFilterPanel();
    this.resetResults();
  }

  private resetResults(): void {
    this.viewReagents = [];
    this.filteredReagents = [];
    this.hasData = false;
    this.isEditMode = false;
    this.rowsArray.clear();
    this.sortedRowIndices = [];
  }

  private resetDownstreamFromStage(): void {
    this.collDate = null;
    this.unitProducts = [];
    this.componentPrefix = null;
    this.aboRh = '-';
    this.expiryDate = '-';
    this.isComponentExpired = false;
    this.resetResults();
  }

  private resolveError(err: any): string {
    const code = err?.error?.errorCode || err?.error?.code;
    if (code && this.ERROR_CODES[code]) return this.ERROR_CODES[code];
    return err?.error?.message || 'An unexpected error occurred.';
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'DISMISS', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'DISMISS', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] });
  }
}
