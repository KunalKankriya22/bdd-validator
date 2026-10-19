import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { DataTable } from '@shared/components/data-table/data-table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

import { MatSnackBar } from '@angular/material/snack-bar';
import { DcattrService } from './dcattr.service';
import { ProductAttributeHistoryDialogComponent } from './product-attribute-history-dialog.component';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { DeletableAttributeDto, DeletedEntry, ProductCodeDto } from './dcattr.models';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-dcattr',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    LoadingSpinnerComponent,
    MatDialogModule,
    DataTable,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './dcattr.component.html',
  styleUrl: './dcattr.component.scss'
})
export class DcattrComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `dcattr-${DcattrComponent.nextId++}`;

  readonly elementId = (name: string): string => `${this.componentId}-${name}`;
  readonly errorId = (name: string): string => `${this.componentId}-${name}-error`;
  readonly labelId = (name: string): string => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly dcattrService = inject(DcattrService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly menuService = inject(MenuService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly submitted = signal<boolean>(false);
  readonly collectionDate = signal<string | null>(null);
  readonly productCodes = signal<ProductCodeDto[]>([]);
  readonly attributes = signal<DeletableAttributeDto[]>([]);
  readonly newProductCode = signal<string | null>(null);
  readonly newProductCodeDescription = signal<string | null>(null);
  readonly unitValidated = signal<boolean>(false);
  readonly selectedAttribType = signal<string | null>(null);
  readonly parsedUnitId = signal<string | null>(null);
  readonly codeScheme = signal<string>('I');
  readonly selectedProductCode = signal<string | null>(null);
  readonly verificationStarted = signal<boolean>(false);
  private lastProcessedAttribCode: string | null = null;

  productCodeSearchCtrl = new FormControl('');
  verifySearchCtrl = new FormControl('');
  attribCodeSearchCtrl = new FormControl('');
  readonly filteredProductCodes = signal<ProductCodeDto[]>([]);
  readonly filteredVerifyCodes = signal<ProductCodeDto[]>([]);
  readonly filteredAttributes = signal<DeletableAttributeDto[]>([]);

  readonly isTypeA = computed(() => this.selectedAttribType() === 'A');

  readonly isReprintEnabled = computed(() => {
    const newProdCode = this.newProductCode();
    return !!newProdCode && !this.isTypeA() && !this.verificationStarted();
  });

  form!: FormGroup;

  deletedEntries: DeletedEntry[] = [];

  tableConfig: DataTableConfig<DeletedEntry> = {
    columns: [
      { key: 'unitId', header: 'Unit ID (22)', sortable: true, minWidth: '150px' },
      { key: 'productCode', header: 'Product Code', minWidth: '110px' },
      { key: 'productDescription', header: 'Description', minWidth: '120px' },
      { key: 'attribCode', header: 'Attribute Code', minWidth: '110px' },
      { key: 'attribDescription', header: 'Description', minWidth: '120px' },
      { key: 'newProductCode', header: 'New Product Code', minWidth: '120px' },
      { key: 'newProductDescription', header: 'Description', minWidth: '120px' },
      { key: 'verifyProduct', header: 'Verify Product', minWidth: '110px' },
    ],
    sortConfig: { column: 'unitId', direction: 'D' },
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    showPagination: true,
    stickyHeader: true,
    enableRowHighlight: false,
  };

  get paginatedEntries(): DeletedEntry[] {
    const page = this.tableConfig.pagination;
    if (!page) return this.deletedEntries;
    const start = page.pageIndex * page.pageSize;
    return this.deletedEntries.slice(start, start + page.pageSize);
  }

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.DeleteComponentAttributes]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;
        const label = menuItem?.label || 'Delete Component Attributes';
        const subtitle = menuItem?.remarks || menuItem?.subtitle || 'Manage interdictions on specific components to prevent their processing or release until the restriction is resolved.';
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label, link: null }
          ],
          title: label,
          subtitle,
          actions: [
            {
              label: 'PRODUCT ATTRIBUTE HISTORY',
              matButton: 'stroked',
              color: 'primary',
              disabled: !this.unitValidated() || !this.selectedProductCode(),
              onClick: () => this.onOpenHistory()
            }
          ]
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      productCode: ['', [Validators.required, Validators.maxLength(8)]],
      attribCode: ['', [Validators.required]],
      verifyProdCode: ['', [Validators.maxLength(8)]]
    });

    this.productCodeSearchCtrl.valueChanges.pipe(
      startWith(''),
      map(search => this.filterCodes(search)),
      takeUntil(this.destroy$)
    ).subscribe(filtered => this.filteredProductCodes.set(filtered));

    this.verifySearchCtrl.valueChanges.pipe(
      startWith(''),
      map(search => this.filterCodes(search)),
      takeUntil(this.destroy$)
    ).subscribe(filtered => this.filteredVerifyCodes.set(filtered));

    this.attribCodeSearchCtrl.valueChanges.pipe(
      startWith(''),
      map(search => this.filterAttributes(search)),
      takeUntil(this.destroy$)
    ).subscribe(filtered => this.filteredAttributes.set(filtered));
  }

  private filterCodes(search: string | null): ProductCodeDto[] {
    const all = this.productCodes();
    if (!search) return all;
    const lower = search.toLowerCase();
    return all.filter(pc =>
      pc.productCode.toLowerCase().includes(lower) ||
      pc.productShortName?.toLowerCase().includes(lower)
    );
  }

  private filterAttributes(search: string | null): DeletableAttributeDto[] {
    const all = this.attributes();
    if (!search) return all;
    const lower = search.toLowerCase();
    return all.filter(attr =>
      attr.attribCode.toLowerCase().includes(lower) ||
      attr.attribDesc?.toLowerCase().includes(lower)
    );
  }

  get f() {
    return this.form.controls;
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;

    this.resetDependentFields();

    this.dcattrService.validateUnit({ unitId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validateResponse) => {
          this.collectionDate.set(validateResponse.collectionDate);
          this.parsedUnitId.set(unitId);
          this.codeScheme.set(event.data.codeScheme || 'I');
          this.unitValidated.set(true);

          this.loadProductCodes(unitId, validateResponse.collectionDate, this.codeScheme());
          event.confirm();
        },
        error: (err) => {
          this.unitValidated.set(false);
          this.collectionDate.set(null);
          const msg = err.message || 'Unit not found or not eligible';
          event.reject(msg);
        }
      });
  }

  onUnitIdValidated(_response: UnitValidationResponse): void {
  }

  onUnitIdCleared(): void {
    this.parsedUnitId.set(null);
    this.codeScheme.set('I');
    this.unitValidated.set(false);
    this.collectionDate.set(null);
    this.resetDependentFields();
  }

  private resetDependentFields(): void {
    this.lastProcessedAttribCode = null;
    this.form.get('productCode')?.setValue('');
    this.form.get('attribCode')?.setValue('');
    this.form.get('verifyProdCode')?.setValue('');
    this.selectedProductCode.set(null);
    this.productCodes.set([]);
    this.attributes.set([]);
    this.filteredAttributes.set([]);
    this.newProductCode.set(null);
    this.newProductCodeDescription.set(null);
    this.selectedAttribType.set(null);
    this.verificationStarted.set(false);
  }

  private loadProductCodes(unitId: string, collDate: string, codeScheme: string): void {
    this.dcattrService.getProductCodes(unitId, collDate, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.productCodes.set(codes);
          this.filteredProductCodes.set(codes);
        },
        error: () => {
          this.productCodes.set([]);
        }
      });
  }

  onProductCodeChange(): void {
    this.lastProcessedAttribCode = null;
    const productCode = this.form.get('productCode')?.value;
    this.selectedProductCode.set(productCode || null);
    this.form.get('attribCode')?.setValue('');
    this.form.get('verifyProdCode')?.setValue('');
    this.attributes.set([]);
    this.filteredAttributes.set([]);
    this.newProductCode.set(null);
    this.newProductCodeDescription.set(null);
    this.selectedAttribType.set(null);

    if (productCode) {
      this.loadDeletableAttributes(productCode);
    }
  }

  private loadDeletableAttributes(productCode: string): void {
    const unitId = this.parsedUnitId();
    const collDate = this.collectionDate();

    if (!unitId || !collDate) {
      return;
    }

    this.loading.set(true);
    this.dcattrService.getDeletableAttributes(unitId, collDate, productCode, this.codeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attributes) => {
          this.attributes.set(attributes);
          this.filteredAttributes.set(attributes);
          this.loading.set(false);

          if (attributes.length === 0) {
            this.form.get('productCode')?.setErrors({ serverError: 'No deletable attributes found for this product code' });
            this.form.get('productCode')?.markAsTouched();
            return;
          }

          this.form.get('productCode')?.setErrors(null);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.message || 'Failed to load attributes';
          this.form.get('productCode')?.setErrors({ serverError: msg });
          this.form.get('productCode')?.markAsTouched();
        }
      });
  }

  onAttribCodeChange(): void {
    const attribCtrl = this.form.get('attribCode');
    const attribCode = attribCtrl?.value;
    if (!attribCode) {
      return;
    }

    if (attribCode === this.lastProcessedAttribCode) {
      return;
    }

    const attr = this.attributes().find(a => a.attribCode === attribCode);
    if (!attr) {
      return;
    }

    this.lastProcessedAttribCode = attr.attribCode;
    attribCtrl?.setErrors(null);
    this.selectedAttribType.set(attr.attribType);
    this.verificationStarted.set(false);
    this.newProductCode.set(null);
    this.newProductCodeDescription.set(null);
    this.form.get('verifyProdCode')?.setValue('');
    this.onAttributeSelected(attr.attribType);
  }

  private onAttributeSelected(attribType: string | null): void {
    if (attribType === 'A') {
      this.executeDelete();
    } else {
      this.previewNewProductCode();
    }
  }

  onVerifyProductCode(): void {
    const verifyCtrl = this.form.get('verifyProdCode');
    const verifyProdCode = verifyCtrl?.value;
    const newProdCode = this.newProductCode();

    if (!verifyProdCode || !newProdCode) {
      return;
    }

    if (verifyProdCode !== newProdCode) {
      verifyCtrl?.setErrors({ serverError: 'Verification does not match new product code' });
      verifyCtrl?.markAsTouched();
      return;
    }

    verifyCtrl?.setErrors(null);
    this.executeDelete();
  }

  private previewNewProductCode(): void {
    const unitId = this.parsedUnitId();
    const productCode = this.form.get('productCode')?.value;
    const attribCode = this.form.get('attribCode')?.value;
    const collDate = this.collectionDate();

    if (!unitId || !productCode || !attribCode || !collDate) {
      return;
    }

    // Type A: product code stays the same, no verification needed
    if (this.isTypeA()) {
      this.newProductCode.set(productCode);
      return;
    }

    this.loading.set(true);
    this.dcattrService.previewNewProductCode({
      unitId,
      collDate,
      productCode,
      attribCode,
      codeScheme: this.codeScheme()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.newProductCode.set(response.newProductCode);
          this.newProductCodeDescription.set(response.newProductDescription || null);
          this.loading.set(false);

          this.form.get('verifyProdCode')?.setValue('');

          // Verify dropdown shows only the new product code
          this.filteredVerifyCodes.set([{
            productCode: response.newProductCode,
            productShortName: response.newProductDescription || '',
            productType: ''
          }]);
        },
        error: (err) => {
          this.loading.set(false);
          this.newProductCode.set(null);
          this.newProductCodeDescription.set(null);
          const msg = err.message || 'Failed to preview new product code';
          this.form.get('attribCode')?.setErrors({ serverError: msg });
          this.form.get('attribCode')?.markAsTouched();
        }
      });
  }

  private executeDelete(): void {
    const unitId = this.parsedUnitId();
    const oldProductCode = this.form.get('productCode')?.value;
    const attribCode = this.form.get('attribCode')?.value;
    const collDate = this.collectionDate();

    if (!unitId || !oldProductCode || !attribCode || !collDate) {
      return;
    }

    // Type A: product code stays same, no verification needed
    // Type C/M: new product code from preview, verification from dropdown
    const newProdCode = this.isTypeA() ? oldProductCode : this.newProductCode();
    const verifyProdCode = this.isTypeA() ? oldProductCode : this.form.get('verifyProdCode')?.value;

    if (!newProdCode || !verifyProdCode) {
      return;
    }

    this.loading.set(true);
    this.dcattrService.deleteAttribute({
      unitId,
      collDate,
      oldProductCode,
      attribCode,
      newProdCode,
      verifyProdCode,
      codeScheme: this.codeScheme()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);

          const attr = this.attributes().find(a => a.attribCode === attribCode);
          const isTypeA = this.isTypeA();
          const pc = this.productCodes().find(p => p.productCode === oldProductCode);
          const entry: DeletedEntry = {
            unitId,
            productCode: oldProductCode,
            productDescription: pc?.productShortName ?? '-',
            attribCode,
            attribDescription: attr?.attribDesc ?? '-',
            newProductCode: isTypeA ? '-' : newProdCode,
            newProductDescription: isTypeA ? '-' : (this.newProductCodeDescription() ?? '-'),
            verifyProduct: isTypeA ? '-' : verifyProdCode,
          };
          this.deletedEntries = [entry, ...this.deletedEntries];
          this.updateTableConfig();

          this.showSuccess('Attribute deleted successfully');
          this.resetAfterDelete();
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.message || 'Failed to delete attribute';
          this.form.get('attribCode')?.setErrors({ serverError: msg });
          this.form.get('attribCode')?.markAsTouched();
        }
      });
  }

  private resetAfterDelete(): void {
    this.lastProcessedAttribCode = null;

    // Preserve unit context so the user can delete multiple attributes
    // for the same unit without re-scanning (matches FMB next_record behavior)
    const unitId = this.parsedUnitId();
    const collDate = this.collectionDate();
    const codeScheme = this.codeScheme();

    this.selectedProductCode.set(null);
    this.filteredVerifyCodes.set([]);
    this.attributes.set([]);
    this.filteredAttributes.set([]);
    this.newProductCode.set(null);
    this.newProductCodeDescription.set(null);
    this.selectedAttribType.set(null);
    this.verificationStarted.set(false);

    this.form.get('productCode')?.setValue('');
    this.form.get('attribCode')?.setValue('');
    this.form.get('verifyProdCode')?.setValue('');

    setTimeout(() => {
      this.form.markAsPristine();
      this.form.markAsUntouched();
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.setErrors(null);
        this.form.get(key)?.markAsUntouched();
      });
    });

    if (unitId && collDate) {
      this.loadProductCodes(unitId, collDate, codeScheme);
    }
  }

  onClearAll(): void {
    this.unitIdField?.clear();
    this.parsedUnitId.set(null);
    this.form.reset();
    this.collectionDate.set(null);
    this.unitValidated.set(false);
    this.selectedProductCode.set(null);
    this.productCodes.set([]);
    this.attributes.set([]);
    this.filteredAttributes.set([]);
    this.newProductCode.set(null);
    this.newProductCodeDescription.set(null);
    this.selectedAttribType.set(null);
    this.verificationStarted.set(false);
    this.submitted.set(false);
  }

  onOpenHistory(): void {
    const unitId = this.parsedUnitId();
    const collDate = this.collectionDate();
    const productCode = this.form.get('productCode')?.value;

    if (!unitId || !collDate || !productCode) {
      this.showError('Please validate a unit and select a product code first');
      return;
    }

    this.dialog.open(ProductAttributeHistoryDialogComponent, {
      width: '800px',
      maxWidth: '100vw',
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      hasBackdrop: false,
      data: {
        unitId,
        collDate,
        productCode
      }
    });
  }

  onReprint(): void {
    const unitId = this.parsedUnitId();
    const collDate = this.collectionDate();
    const newProdCode = this.newProductCode();

    if (!unitId || !collDate || !newProdCode) {
      this.showError('New product code must be generated before reprinting');
      return;
    }

    if (this.verificationStarted()) {
      this.showError('Cannot reprint after verification has started');
      return;
    }

    this.loading.set(true);
    this.dcattrService.reprintLabel({
      unitId,
      collDate,
      newProductCode: newProdCode
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.showSuccess('Label reprint request processed successfully');
        },
        error: (err) => {
          this.loading.set(false);
          this.showError(err.message || 'Failed to reprint label');
        }
      });
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: { ...this.tableConfig.pagination, pageIndex: event.pageIndex, pageSize: event.pageSize },
      };
    }
  }

  onSortChange(event: TableSortEvent): void {
    const sorted = [...this.deletedEntries].sort((a, b) => {
      const valA = (a as unknown as Record<string, string>)[event.column] || '';
      const valB = (b as unknown as Record<string, string>)[event.column] || '';
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    });
    this.deletedEntries = sorted;
    this.tableConfig = { ...this.tableConfig, sortConfig: { column: event.column, direction: event.direction } };
  }

  private updateTableConfig(): void {
    const count = this.deletedEntries.length;
    const columns = this.tableConfig.columns.map(col =>
      col.key === 'unitId'
        ? { ...col, header: count > 0 ? `Unit ID (${count})` : 'Unit ID' }
        : col,
    );
    this.tableConfig = {
      ...this.tableConfig,
      columns,
      pagination: this.tableConfig.pagination
        ? { ...this.tableConfig.pagination, totalRecords: count }
        : undefined,
    };
  }

  getProductCodeDescription(): string {
    const productCode = this.form.get('productCode')?.value;
    if (!productCode) return '-';
    const pc = this.productCodes().find(p => p.productCode === productCode);
    return pc?.productShortName || '-';
  }

  getAttributeDescription(attribCode: string | undefined): string {
    if (!attribCode) return '-';
    const attribute = this.attributes().find(attr => attr.attribCode === attribCode);
    return attribute?.attribDesc || '-';
  }

  getAttribTypeDisplay(attribType: string): string {
    switch (attribType) {
      case 'A': return 'Attribute';
      case 'C': return 'Convert';
      case 'M': return 'Modify';
      default: return attribType;
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar', 'content-snackbar'],
    });
  }
}
