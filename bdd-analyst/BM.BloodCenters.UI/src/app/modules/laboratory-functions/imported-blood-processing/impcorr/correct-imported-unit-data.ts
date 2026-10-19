import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin, of, takeUntil } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { CorrectImportedUnitDataApiService } from './services/correct-imported-unit-data-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import {
  UnitIdFieldComponent,
  UnitValidationResponse
} from '@shared/components/unit-id-field';
import {
  AttributeRow,
  AttributeGroupLov,
  AttributeCodeLov,
  ProductCodeLov,
  AboLabelLov,
  ComponentAttributeModel,
  SaveComponentAttributeRequestDto
} from './models/correct-imported-unit-data.model';


/**
 * Correct Imported Unit Data Component
 * JIRA: MLT-12628 | Mnemonic: IMPCORR | Form: IMUUNITS
 */
@Component({
  selector: 'app-correct-imported-unit-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    DataTable,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent
  ],
  providers: [],
  templateUrl: './correct-imported-unit-data.html',
  styleUrl: './correct-imported-unit-data.scss'
})
export class CorrectImportedUnitDataComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('attributeGroupTmpl') attributeGroupTmpl!: TemplateRef<any>;
  @ViewChild('attributeCodeTmpl') attributeCodeTmpl!: TemplateRef<any>;

  private static nextId = 0;
  readonly componentId = `correct-imported-unit-data-${CorrectImportedUnitDataComponent.nextId++}`;
  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  private readonly fb = inject(FormBuilder);
  protected readonly apiService = inject(CorrectImportedUnitDataApiService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // ── Unit ID state ─────────────────────────────────────────────────────────
  readonly unitIdValidated = signal<boolean>(false);
  readonly validatedUnitId = signal<string | null>(null);

  // ── Page state ────────────────────────────────────────────────────────────
  readonly loading = signal<boolean>(false);
  readonly productCodesLoading = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);
  readonly unitRetrieved = signal<boolean>(false);

  // ── Data signals ──────────────────────────────────────────────────────────
  readonly attributeRows = signal<AttributeRow[]>([]);
  readonly attributeGroups = signal<AttributeGroupLov[]>([]);
  readonly productCodes = signal<ProductCodeLov[]>([]);
  readonly aboLabels = signal<AboLabelLov[]>([]);
  readonly validProductCodes = signal<ProductCodeLov[]>([]);

  private unitCodeScheme: string | null = null;

  // Per-row attribute code cache: rowId → AttributeCodeLov[]
  readonly rowAttributeCodes = new Map<string, AttributeCodeLov[]>();

  // ── Search controls (ngx-mat-select-search) ───────────────────────────────
  readonly productCodeSearch = new FormControl('');
  readonly attribGroupSearch = new FormControl('');
  readonly attribCodeSearch = new FormControl('');
  readonly aboLabelSearch = new FormControl('');
  readonly validProductCodeSearch = new FormControl('');

  filteredProductCodes: ProductCodeLov[] = [];
  filteredAttributeGroups: AttributeGroupLov[] = [];
  filteredCodesByRow: Record<string, AttributeCodeLov[]> = {};
  filteredAboLabels: AboLabelLov[] = [];
  filteredValidProductCodes: ProductCodeLov[] = [];

  private currentOpenCodeRow: AttributeRow | null = null;
  private retrievedComponentPrefix: string | null = null;

  protected readonly canSave = computed(() =>
    this.unitRetrieved() &&
    this.attributeRows().length > 0 &&
    this.attributeRows().every(r => r.attributeGroup && r.attributeCode)
  );

  protected readonly rowIndices = computed(() => {
    const map: Record<string, number> = {};
    this.attributeRows().forEach((r, i) => { map[r.id] = i + 1; });
    return map;
  });

  searchForm!: FormGroup;
  unitDetailsForm!: FormGroup;

  attributeTableConfig: DataTableConfig<AttributeRow> = {
    columns: [
      { key: 'attributeGroup', header: 'Attribute Group' },
      { key: 'attributeGroupDescription', header: 'Attribute Description', valueFormatter: (v) => v || '-' },
      { key: 'attributeCode', header: 'Attribute Code' },
      { key: 'attributeCodeDescription', header: 'Attribute Code Description', valueFormatter: (v) => v || '-' },
    ],
    rowActions: [
      { icon: 'delete', action: 'delete', ariaLabel: 'Delete attribute row' }
    ],
    stickyHeader: true,
    showTableOnEmpty: true,
    emptyMessage: 'No attributes added'
  };

  private attributeRowCounter = 0;

  protected pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: '', link: null }
    ],
    title: '',
    subtitle: ''
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.initForms();
    this.setupSearchControls();
    this.loadAttributeGroups();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    this.attributeTableConfig = {
      ...this.attributeTableConfig,
      columns: this.attributeTableConfig.columns.map(col => {
        if (col.key === 'attributeGroup') return { ...col, cellTemplate: this.attributeGroupTmpl };
        if (col.key === 'attributeCode') return { ...col, cellTemplate: this.attributeCodeTmpl };
        return col;
      })
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Unit ID field callbacks ───────────────────────────────────────────────

  onUnitValidated(response: UnitValidationResponse): void {
    const unitId = response.parsedUnitId ?? response.manualUnitId ?? null;
    this.validatedUnitId.set(unitId);
    this.unitIdValidated.set(true);

    if (unitId) {
      this.productCodes.set([]);
      this.searchForm.get('productCode')?.reset();
      this.unitDetailsForm.reset();
      this.attributeRows.set([]);
      this.unitRetrieved.set(false);
      this.productCodesLoading.set(true);
      this.unitCodeScheme = null;

      this.apiService.getUnitCodeScheme(unitId)
        .pipe(
          catchError(() => of('I')),
          switchMap(scheme => {
            this.unitCodeScheme = scheme;
            this.loadAboLabels(scheme);
            return this.apiService.getProductCodes(unitId, scheme)
              .pipe(catchError(() => of([])));
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: codes => {
            this.productCodes.set(codes);
            this.filteredProductCodes = [...codes];
            this.productCodeSearch.setValue('', { emitEvent: false });
            this.productCodesLoading.set(false);
          },
          error: () => this.productCodesLoading.set(false)
        });
    }
  }

  onUnitCleared(): void {
    this.validatedUnitId.set(null);
    this.unitIdValidated.set(false);
    this.unitCodeScheme = null;
    this.productCodes.set([]);
    this.aboLabels.set([]);
    this.filteredAboLabels = [];
    this.searchForm.get('productCode')?.reset();
    this.unitDetailsForm.reset();
    this.attributeRows.set([]);
    this.rowAttributeCodes.clear();
    this.unitRetrieved.set(false);
  }

  // ── Form init ─────────────────────────────────────────────────────────────

  private initForms(): void {
    this.searchForm = this.fb.group({
      productCode: ['', [Validators.required]]
    });

    this.unitDetailsForm = this.fb.group({
      contractId: [''],
      externalUnitId: [''],
      receiptDate: [''],
      batchId: [''],
      checkInUser: [''],
      checkInDate: [''],
      productCode: [''],
      aboLabel: [''],
      expirationDate: [''],
      licenseFlag: ['']
    });
  }

  // ── LOV loading ───────────────────────────────────────────────────────────

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadAttributeGroups();
      });
  }

  private setupSearchControls(): void {
    this.productCodeSearch.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredProductCodes = this.productCodes().filter(p =>
          p.code.toLowerCase().includes(t) || (p.description || '').toLowerCase().includes(t)
        );
      });

    this.attribGroupSearch.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredAttributeGroups = this.attributeGroups().filter(g =>
          g.code.toLowerCase().includes(t) || g.description.toLowerCase().includes(t)
        );
      });

    this.attribCodeSearch.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        if (!this.currentOpenCodeRow) return;
        const t = (term || '').toLowerCase();
        const all = this.rowAttributeCodes.get(this.currentOpenCodeRow.id) || [];
        const filtered = all.filter(c =>
          c.code.toLowerCase().includes(t) || c.description.toLowerCase().includes(t)
        );
        this.filteredCodesByRow = { ...this.filteredCodesByRow, [this.currentOpenCodeRow.id]: filtered };
      });

    this.aboLabelSearch.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredAboLabels = this.aboLabels().filter(a =>
          a.code.toLowerCase().includes(t) || a.description.toLowerCase().includes(t)
        );
      });

    this.validProductCodeSearch.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase();
        this.filteredValidProductCodes = this.validProductCodes().filter(p =>
          p.code.toLowerCase().includes(t) || (p.description || '').toLowerCase().includes(t)
        );
      });

    this.searchForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedCode => {
        if (!selectedCode) {
          this.validProductCodes.set([]);
          this.filteredValidProductCodes = [];
          return;
        }
        const selected = this.productCodes().find(p => p.code === selectedCode);
        if (selected?.productType) {
          this.loadValidProductCodes(selected.productType);
        }
      });
  }

  private loadAttributeGroups(): void {
    this.apiService
      .getAttributeGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: groups => {
          this.attributeGroups.set(groups);
          this.filteredAttributeGroups = [...groups];
        },
        error: () => {}
      });
  }

  private loadAboLabels(codeScheme: string): void {
    this.apiService
      .getAboLabels(codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: labels => {
          this.aboLabels.set(labels);
          this.filteredAboLabels = [...labels];
        },
        error: () => {}
      });
  }

  private loadValidProductCodes(productType: string): void {
    if (!this.unitCodeScheme) return;
    this.apiService
      .getValidProductCodes(this.unitCodeScheme, productType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: codes => {
          this.validProductCodes.set(codes);
          this.filteredValidProductCodes = [...codes];
        },
        error: () => {}
      });
  }

  // ── Attribute-code cache (per row) ────────────────────────────────────────

  getAttributeCodesForGroup(rowId: string): AttributeCodeLov[] {
    return this.rowAttributeCodes.get(rowId) || [];
  }

  loadAttributeCodesForRow(row: AttributeRow): void {
    if (!row.attributeGroup || this.rowAttributeCodes.has(row.id) || !this.unitCodeScheme) return;

    this.apiService
      .getAttributeCodes(row.attributeGroup, this.unitCodeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: codes => {
          // If the row already has a code that the API didn't return (historical/inactive),
          // inject it so the mat-select can display it.
          if (row.attributeCode && !codes.some(c => c.code === row.attributeCode)) {
            codes = [
              ...codes,
              { code: row.attributeCode, description: row.attributeCodeDescription || row.attributeCode }
            ];
          }
          this.rowAttributeCodes.set(row.id, codes);
          this.filteredCodesByRow = { ...this.filteredCodesByRow, [row.id]: codes };
          if (codes.length === 1 && !row.attributeCode) {
            row.attributeCode = codes[0].code;
            row.attributeCodeDescription = codes[0].description;
            row.isDirty = true;
          }
        },
        error: () => {
          if (row.attributeCode) {
            const fallback: AttributeCodeLov[] = [
              { code: row.attributeCode, description: row.attributeCodeDescription || row.attributeCode }
            ];
            this.rowAttributeCodes.set(row.id, fallback);
            this.filteredCodesByRow = { ...this.filteredCodesByRow, [row.id]: fallback };
          }
        }
      });
  }

  onGroupSelectOpened(): void {
    this.attribGroupSearch.setValue('', { emitEvent: false });
    this.filteredAttributeGroups = [...this.attributeGroups()];
  }

  onExpiryDateBlur(): void {
    const ctrl = this.unitDetailsForm.get('expirationDate');
    const value = ctrl?.value?.trim();
    if (!value) { ctrl?.setErrors(null); return; }

    const regex = /^(\d{2})-([A-Za-z]{3})-(\d{4})\s(\d{2}):(\d{2})$/;
    if (!value.match(regex)) {
      ctrl?.setErrors({ invalidFormat: true });
      ctrl?.markAsTouched();
      return;
    }

    const parsed = moment(value, 'DD-MMM-YYYY HH:mm', true);
    if (!parsed.isValid()) {
      ctrl?.setErrors({ invalidDateTime: true });
      ctrl?.markAsTouched();
    } else if (parsed.isBefore(moment())) {
      ctrl?.setErrors({ pastDate: true });
      ctrl?.markAsTouched();
    } else {
      ctrl?.setErrors(null);
    }
  }

  onAttributeCodeSelectOpened(row: AttributeRow): void {
    this.currentOpenCodeRow = row;
    this.attribCodeSearch.setValue('', { emitEvent: false });
    const codes = this.rowAttributeCodes.get(row.id) || [];
    this.filteredCodesByRow = { ...this.filteredCodesByRow, [row.id]: codes };
    this.loadAttributeCodesForRow(row);
  }

  // ── Table row callbacks ───────────────────────────────────────────────────

  onAttributeGroupChange(row: AttributeRow, groupCode: string): void {
    row.attributeGroup = groupCode;
    row.attributeCode = '';
    row.attributeCodeDescription = '';
    row.isDirty = true;
    this.rowAttributeCodes.delete(row.id);
    this.filteredCodesByRow = { ...this.filteredCodesByRow, [row.id]: [] };
    const group = this.attributeGroups().find(g => g.code === groupCode);
    if (group) row.attributeGroupDescription = group.description;
    this.loadAttributeCodesForRow(row);
  }

  onAttributeCodeChange(row: AttributeRow, codeValue: string): void {
    row.attributeCode = codeValue;
    row.isDirty = true;
    const codes = this.rowAttributeCodes.get(row.id) ?? [];
    const code = codes.find(c => c.code === codeValue);
    if (code) row.attributeCodeDescription = code.description;
  }

  onRowAction(event: TableRowActionEvent<AttributeRow>): void {
    if (event.action === 'delete') {
      this.onDeleteRow(event.row);
    }
  }

  // ── Form accessors ────────────────────────────────────────────────────────

  get searchFormControls() { return this.searchForm.controls; }
  get unitDetailsFormControls() { return this.unitDetailsForm.controls; }

  // ── Retrieve ──────────────────────────────────────────────────────────────

  onRetrieve(): void {
    this.submitted.set(true);

    if (!this.unitIdValidated()) {
      this.unitIdField?.unitIdControl.markAsTouched();
      this.unitIdField?.unitIdControl.updateValueAndValidity();
      return;
    }

    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const unitId = this.validatedUnitId()!;
    const { productCode } = this.searchForm.value;

    this.loading.set(true);
    this.unitRetrieved.set(false);
    this.rowAttributeCodes.clear();
    this.filteredCodesByRow = {};
    this.currentOpenCodeRow = null;

    const groups$ = this.attributeGroups().length
      ? of(this.attributeGroups())
      : this.apiService.getAttributeGroups().pipe(catchError(() => of([])));

    forkJoin({
      attributes: this.apiService.getComponentAttributes(100, 0, { unitId, productCode }),
      groups: groups$
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ attributes: { data }, groups }) => {
        if (groups.length) {
          this.attributeGroups.set(groups);
          this.filteredAttributeGroups = [...groups];
        }
        const attributeGroupList = this.attributeGroups();

        // Populate unit details card from the first record
        if (data.length > 0) {
          const first = data[0];
          this.unitDetailsForm.patchValue({
            contractId: first.contractId,
            externalUnitId: first.externalUnitId,
            receiptDate: first.receivedDate,
            batchId: first.batchId,
            checkInUser: first.checkInUser,
            checkInDate: first.checkInDate,
            productCode: first.productCode,
            aboLabel: first.aboLabel,
            expirationDate: first.expirationDate
              ? moment(first.expirationDate).format('DD-MMM-YYYY HH:mm').replace(/-([a-z]{3})-/i, (_, m: string) => `-${m.toUpperCase()}-`)
              : '',
            licenseFlag: first.licenseFlag
          });
          this.retrievedComponentPrefix = first.componentPrefix ?? null;
          this.unitDetailsForm.markAsPristine();
        }

        // Build attribute rows
        const rows: AttributeRow[] = data.map((attr: ComponentAttributeModel) => {
          const groupEntry = attributeGroupList.find(g => g.code === attr.attributeGroup);
          return {
            id: `existing-${this.attributeRowCounter++}`,
            attributeGroup: attr.attributeGroup,
            attributeCode: attr.attributeCode,
            attributeGroupDescription: groupEntry?.description ?? attr.attributeGroupDescription ?? '',
            attributeCodeDescription: attr.attributeCodeDescription ?? '',
            isNew: false,
            isDirty: false,
            unitId: attr.unitId,
            chapterId: attr.chapterId,
            productCode: attr.productCode,
            originalAttribGroup: attr.attributeGroup,
            originalAttribCode: attr.attributeCode,
            originalImportedProduct: attr.originalImportedProduct
          } as AttributeRow;
        });

        // Ensure historical/inactive groups from existing rows appear in the dropdown.
        // getAttributeGroups() returns only active groups, but retrieved rows may reference old ones.
        const currentGroups = this.attributeGroups();
        const seenCodes = new Set(currentGroups.map(g => g.code));
        const extraGroups: AttributeGroupLov[] = [];
        rows.forEach(r => {
          if (r.attributeGroup && !seenCodes.has(r.attributeGroup)) {
            seenCodes.add(r.attributeGroup);
            extraGroups.push({ code: r.attributeGroup, description: r.attributeGroupDescription || r.attributeGroup });
          }
        });
        if (extraGroups.length) {
          const merged = [...currentGroups, ...extraGroups];
          this.attributeGroups.set(merged);
          this.filteredAttributeGroups = [...merged];
        }

        this.attributeRows.set(rows);
        rows.forEach(row => this.loadAttributeCodesForRow(row));
        this.unitRetrieved.set(true);
        this.loading.set(false);
        this.snackbarService.showSuccess(`Unit retrieved. Found ${data.length} attribute(s).`);
        this.cdr.detectChanges();
        document.getElementById(this.elementId('externalUnitId'))?.focus();
      },
      error: err => {
        this.loading.set(false);
        this.snackbarService.showError(
          err?.error?.message ?? err?.message ?? 'Failed to retrieve unit data. Please try again.'
        );
      }
    });
  }

  // ── Clear ─────────────────────────────────────────────────────────────────

  onClearAll(): void {
    this.unitIdField?.clear();
    this.validatedUnitId.set(null);
    this.unitIdValidated.set(false);
    this.searchForm.reset();
    this.unitDetailsForm.reset();
    this.attributeRows.set([]);
    this.rowAttributeCodes.clear();
    this.filteredCodesByRow = {};
    this.productCodes.set([]);
    this.filteredProductCodes = [];
    this.productCodeSearch.setValue('', { emitEvent: false });
    this.currentOpenCodeRow = null;
    this.retrievedComponentPrefix = null;
    this.unitRetrieved.set(false);
    this.submitted.set(false);
  }

  // ── Add / Delete rows ─────────────────────────────────────────────────────

  onAddRow(): void {
    const newRow: AttributeRow = {
      id: `new-${this.attributeRowCounter++}`,
      attributeGroup: '',
      attributeCode: '',
      attributeGroupDescription: '',
      attributeCodeDescription: '',
      isNew: true,
      isDirty: false
    };
    this.attributeRows.update(rows => [...rows, newRow]);
  }

  onDeleteRow(row: AttributeRow): void {
    this.removeRowFromState(row);
  }

  private removeRowFromState(row: AttributeRow): void {
    this.attributeRows.update(rows => rows.filter(r => r.id !== row.id));
    this.rowAttributeCodes.delete(row.id);
    const { [row.id]: _removed, ...rest } = this.filteredCodesByRow;
    this.filteredCodesByRow = rest;
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  onSave(): void {
    if (!this.canSave()) return;

    const unitId      = this.validatedUnitId()!;
    const productCode = this.searchForm.value.productCode as string;
    const details     = this.unitDetailsForm.value;

    const expDateRaw = (details['expirationDate'] as string)?.trim();
    let expiryDate: string | null = null;
    if (expDateRaw) {
      const parsed = moment(expDateRaw, 'DD-MMM-YYYY HH:mm', true);
      if (parsed.isValid()) {
        expiryDate = parsed.format('YYYY-MM-DDTHH:mm:ss');
      }
    }

    const aboLabelRaw = details['aboLabel'] as string;
    const systemLabelDecision = (aboLabelRaw && this.aboLabels().some(l => l.code === aboLabelRaw))
      ? aboLabelRaw
      : null;

    const detailsProductCode = details['productCode'] as string;
    const newProductCode = (detailsProductCode && detailsProductCode !== productCode)
      ? detailsProductCode
      : null;

    const payload: SaveComponentAttributeRequestDto = {
      unitId,
      productCode,
      newProductCode,
      systemLabelDecision,
      expiryDate,
      impLicenseFlag:       (details['licenseFlag'] as string) || null,
      componentPrefix:      this.retrievedComponentPrefix,
      attributes: this.attributeRows()
        .filter(r => r.attributeGroup && r.attributeCode)
        .map(r => ({ attribGroup: r.attributeGroup, attribCode: r.attributeCode }))
    };

    this.loading.set(true);
    this.apiService.saveComponentAttribute(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess(`Imported units for Unit ID ${unitId} has been saved.`);
          this.onClearAll();
        },
        error: err => {
          this.loading.set(false);
          this.snackbarService.showError(
            err?.error?.message ?? err?.message ?? 'Failed to save changes. Please try again.'
          );
        }
      });
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  onCancel(): void {
    if (this.unitRetrieved()) {
      this.submitted.set(false);
      this.onRetrieve();
    } else {
      this.onClearAll();
    }
  }
}
