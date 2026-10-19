import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  effect,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { DataTable } from '@shared/components/data-table/data-table';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { DataTableConfig, TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';

import { DeleteUnitAttributeApiService } from './services/delete-unit-attribute-api.service';
import { UnitAttributeRow } from './models/delete-unit-attribute.model';

@Component({
  selector: 'app-delete-unit-attributes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
    DataTable,
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './delete-unit-attributes.html',
  styleUrl: './delete-unit-attributes.scss'
})
export class DeleteUnitAttributesComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  readonly componentId = `delete-unit-attributes-${DeleteUnitAttributesComponent.nextId++}`;

  @ViewChild(UnitIdFieldComponent) unitIdField?: UnitIdFieldComponent;

  private readonly deleteUnitAttrService = inject(DeleteUnitAttributeApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly menuService = inject(MenuService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  readonly loading = signal<boolean>(false);
  readonly collectionDate = signal<string | null>(null);
  readonly unitValidated = signal<boolean>(false);
  readonly parsedUnitId = signal<string | null>(null);
  readonly codeScheme = signal<string>('I');

  attributes: UnitAttributeRow[] = [];
  selectedAttributes: UnitAttributeRow[] = [];
  totalRecords = 0;

  tableConfig: DataTableConfig<UnitAttributeRow> = {
    columns: [
      { key: 'attribGroup', header: 'Attribute', width: '160px' },
      { key: 'attribCode', header: 'Code', width: '140px' },
      { key: 'attribDesc', header: 'Description', minWidth: '200px' },
    ],
    enableSelection: true,
    selectionPosition: 'first',
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

  get paginatedAttributes(): UnitAttributeRow[] {
    const page = this.tableConfig.pagination;
    if (!page) return this.attributes;
    const start = page.pageIndex * page.pageSize;
    return this.attributes.slice(start, start + page.pageSize);
  }

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.DeleteUnitAttributes]?.path;
        const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;
        const label = menuItem?.label || 'Delete Unit Attributes';
        const subtitle = menuItem?.remarks || menuItem?.subtitle ||
          'Update batch-level information captured during bag check-in and imported blood product check-in.';
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label, link: null }
          ],
          title: label,
          subtitle
        };
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    const scheme = event.data.codeScheme || 'I';

    this.resetState();

    this.deleteUnitAttrService.validateUnit(unitId, scheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.collectionDate.set(response.collectionDate);
          this.parsedUnitId.set(unitId);
          this.codeScheme.set(scheme);
          this.unitValidated.set(true);

          this.loadAttributes(unitId, response.collectionDate, scheme);
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

  onUnitIdValidated(_response: UnitValidationResponse): void {}

  onUnitIdCleared(): void {
    this.parsedUnitId.set(null);
    this.codeScheme.set('I');
    this.unitValidated.set(false);
    this.collectionDate.set(null);
    this.resetState();
  }

  onSelectionChange(selected: UnitAttributeRow[]): void {
    this.selectedAttributes = selected;
  }

  onDelete(): void {
    if (this.selectedAttributes.length === 0) return;

    const unitId = this.parsedUnitId();
    const collDate = this.collectionDate();
    if (!unitId || !collDate) return;

    const attributesToDelete = this.selectedAttributes.map(attr => ({
      attribGroup: attr.attribGroup,
      attribCode: attr.attribCode
    }));

    this.loading.set(true);
    this.deleteUnitAttrService.deleteAttributes(unitId, collDate, attributesToDelete, this.codeScheme())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          const count = this.selectedAttributes.length;
          this.showSuccess(`${count} attribute${count > 1 ? 's' : ''} deleted successfully`);
          this.selectedAttributes = [];
          this.loadAttributes(unitId, collDate, this.codeScheme());
          this.unitIdField?.focus();
        },
        error: (err) => {
          this.loading.set(false);
          this.showError(err.message || 'Failed to delete attributes');
        }
      });
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig = {
        ...this.tableConfig,
        pagination: {
          ...this.tableConfig.pagination,
          pageIndex: event.pageIndex,
          pageSize: event.pageSize
        },
      };
    }
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
  }

  private loadAttributes(unitId: string, collDate: string, codeScheme: string): void {
    this.loading.set(true);
    this.deleteUnitAttrService.getAttributes(unitId, collDate, codeScheme)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.attributes = result.data;
          this.totalRecords = result.totalRecords;
          this.selectedAttributes = [];

          this.tableConfig = {
            ...this.tableConfig,
            pagination: this.tableConfig.pagination
              ? { ...this.tableConfig.pagination, pageIndex: 0, totalRecords: result.totalRecords }
              : undefined,
          };

          this.loading.set(false);

          const missingDescCount = result.data.filter(a => !a.attribDesc).length;
          if (missingDescCount > 0) {
            this.showWarning(`Attribute description not found for ${missingDescCount} attribute(s)`);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.attributes = [];
          this.totalRecords = 0;
          this.showError(err.message || 'Failed to load attributes');
        }
      });
  }

  private resetState(): void {
    this.attributes = [];
    this.selectedAttributes = [];
    this.totalRecords = 0;

    this.tableConfig = {
      ...this.tableConfig,
      pagination: this.tableConfig.pagination
        ? { ...this.tableConfig.pagination, pageIndex: 0, totalRecords: 0 }
        : undefined,
    };
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showWarning(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['warning-snackbar'],
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
