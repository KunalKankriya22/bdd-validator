/**
 * Equipment/Product cGMP Matrix Tab Component
 * JIRA: MLT-12865
 * Tab 3 in Manage Matrix - Pheresis
 */

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Third-party
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

// Shared Components
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';

// Panel Component
import { AddEditEquipmentCgmpPanelComponent } from '../add-edit-equipment-cgmp-panel/add-edit-equipment-cgmp-panel';

// Service and Models
import { MatrixPheresisService } from '../../services/matrix-pheresis.service';
import {
  EquipmentProductCgmpMatrix,
  EquipmentCgmpMatrixQueryDto,
  EquipmentTypeDropdownCgmp,
  ParameterCodeDropdownCgmp,
  ProcedureDropdown,
  ProductTypeDropdown
} from '../../models/matrix-pheresis.model';

// Date utility
import moment from 'moment';

@Component({
  selector: 'app-equipment-product-cgmp-matrix-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    DataTable,
    AddEditEquipmentCgmpPanelComponent
  ],
  templateUrl: './equipment-product-cgmp-matrix-tab.html',
  styleUrls: ['./equipment-product-cgmp-matrix-tab.scss']
})
export class EquipmentProductCgmpMatrixTabComponent implements OnInit, OnDestroy {
  private readonly service = inject(MatrixPheresisService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // Panel state
  showPanel = signal<boolean>(false);

  // CRIT-2: stores the element that triggered the panel so focus can be restored on close
  private panelTrigger: HTMLElement | null = null;
  panelMode = signal<'add' | 'edit'>('add');
  selectedRecord = signal<EquipmentProductCgmpMatrix | null>(null);
  panelToggled = output<boolean>();

  // Form
  filterForm!: FormGroup;

  // Signals - Filter Data
  equipmentTypes = signal<EquipmentTypeDropdownCgmp[]>([]);
  procedures = signal<ProcedureDropdown[]>([]);
  productTypes = signal<ProductTypeDropdown[]>([]);
  parameterCodes = signal<ParameterCodeDropdownCgmp[]>([]);

  // Search controls for dropdowns
  equipTypeSearchControl = new FormControl('');
  productCodeSearchControl = new FormControl('');
  procSearchControl = new FormControl('');
  parmCodeSearchControl = new FormControl('');

  // Filtered lists for searchable dropdowns
  filteredEquipmentTypes = signal<EquipmentTypeDropdownCgmp[]>([]);
  filteredProductTypes = signal<ProductTypeDropdown[]>([]);
  filteredProcedures = signal<ProcedureDropdown[]>([]);
  filteredParameterCodes = signal<ParameterCodeDropdownCgmp[]>([]);

  // Signals - Table Data
  matrixRecords = signal<EquipmentProductCgmpMatrix[]>([]);
  totalRecords = signal<number>(0);
  isLoading = signal<boolean>(false);
  isLoadingFilters = signal<boolean>(true);

  // Signals - Pagination
  currentPage = signal<number>(0);
  pageSize = signal<number>(25);
  pageSizeOptions = [10, 25, 50, 100];

  // Sort state
  sortColumn = signal<string>('proc');
  sortDirection = signal<'A' | 'D' | 'default'>('A');

  // Computed Signals
  hasData = computed(() => this.matrixRecords().length > 0);
  hasFilters = computed(() => {
    const values = this.filterForm?.value || {};
    return !!(values.equipType || values.proc || values.productCode || values.parmCode);
  });

  // Table Configuration
  tableConfig = computed<DataTableConfig<EquipmentProductCgmpMatrix>>(() => ({
    columns: [
      { key: 'equipType', header: 'Equipment Type', sortable: false },
      { key: 'proc', header: 'Procedure', sortable: true },
      { key: 'productCode', header: 'Product Code', sortable: false },
      { key: 'parmCode', header: 'Parameter', sortable: false },
      {
        key: 'acceptMin',
        header: 'Minimum Value',
        sortable: false,
        valueFormatter: (value, row) => row.acceptMin !== null && row.acceptMin !== undefined ? String(row.acceptMin) : '--'
      },
      {
        key: 'acceptMax',
        header: 'Maximum Value',
        sortable: false,
        valueFormatter: (value, row) => row.acceptMax !== null && row.acceptMax !== undefined ? String(row.acceptMax) : '--'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        valueFormatter: (value, row) => this.formatDate(row.effDate)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        valueFormatter: (value, row) => this.formatDate(row.termDate)
      },
      {
        key: 'lastModifyDate',
        header: 'Modification Date',
        sortable: false,
        valueFormatter: (value, row) => this.formatDate(row.lastModifyDate)
      }
    ],
    rowActions: [
      { icon: 'edit', label: 'Edit', action: 'edit', ariaLabel: 'Edit cGMP matrix entry for {{equipType}} - {{proc}} - {{productCode}} - {{parmCode}}', color: 'primary' }
    ],
    pagination: {
      pageSize: this.pageSize(),
      pageIndex: this.currentPage(),
      totalRecords: this.totalRecords(),
      pageSizeOptions: this.pageSizeOptions,
      showFirstLastButtons: true
    },
    sortConfig: {
      column: this.sortColumn(),
      direction: this.sortDirection()
    },
    showPagination: true,
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: this.hasFilters()
      ? 'No records match your search criteria. Try adjusting your filters.'
      : 'Please enter Search criteria to view Results.',
    noDataIcon: 'search'
  }));

  ngOnInit(): void {
    this.initializeForm();
    this.loadDropdowns();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      equipType: [null],
      proc: [null],
      productCode: [null],
      parmCode: [null]
    });
  }

  private setupSearchFilters(): void {
    this.equipTypeSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredEquipmentTypes.set(this.equipmentTypes());
        } else {
          this.filteredEquipmentTypes.set(
            this.equipmentTypes().filter(e =>
              e.code.toLowerCase().includes(search) ||
              e.codeDesc.toLowerCase().includes(search)
            )
          );
        }
      });

    this.productCodeSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredProductTypes.set(this.productTypes());
        } else {
          this.filteredProductTypes.set(
            this.productTypes().filter(pt =>
              pt.productCode.toLowerCase().includes(search) ||
              pt.productDesc.toLowerCase().includes(search)
            )
          );
        }
      });

    this.procSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredProcedures.set(this.procedures());
        } else {
          this.filteredProcedures.set(
            this.procedures().filter(p =>
              p.code.toLowerCase().includes(search) ||
              p.codeDesc.toLowerCase().includes(search)
            )
          );
        }
      });

    this.parmCodeSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredParameterCodes.set(this.parameterCodes());
        } else {
          this.filteredParameterCodes.set(
            this.parameterCodes().filter(pc =>
              pc.code.toLowerCase().includes(search) ||
              pc.codeDesc.toLowerCase().includes(search)
            )
          );
        }
      });
  }

  private loadDropdowns(): void {
    this.isLoadingFilters.set(true);

    // Load Equipment Types
    this.service.getEquipmentTypesCgmp()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: EquipmentTypeDropdownCgmp[]) => {
          this.equipmentTypes.set(data);
          this.filteredEquipmentTypes.set(data);
        },
        error: (err: any) => this.handleError('Failed to load equipment types', err)
      });

    // Load Procedures
    this.service.getProceduresCgmp()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ProcedureDropdown[]) => {
          const mapped = data.map(p => ({ code: p.code, codeDesc: p.codeDesc }));
          this.procedures.set(mapped);
          this.filteredProcedures.set(mapped);
        },
        error: (err: any) => this.handleError('Failed to load procedures', err)
      });

    // Load Product Types
    this.service.getProductTypesCgmp()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ProductTypeDropdown[]) => {
          const mapped = data.map(p => ({ productCode: p.productCode, productDesc: p.productDesc }));
          this.productTypes.set(mapped);
          this.filteredProductTypes.set(mapped);
        },
        error: (err: any) => this.handleError('Failed to load product types', err)
      });

    // Load Parameter Codes
    this.service.getParameterCodesCgmp()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: ParameterCodeDropdownCgmp[]) => {
          this.parameterCodes.set(data);
          this.filteredParameterCodes.set(data);
          this.isLoadingFilters.set(false);
        },
        error: (err: any) => {
          this.handleError('Failed to load parameter codes', err);
          this.isLoadingFilters.set(false);
        }
      });
  }

  onRetrieve(): void {
    this.currentPage.set(0);
    this.loadMatrixRecords();
  }

  onClearAll(): void {
    this.filterForm.reset({
      equipType: null,
      proc: null,
      productCode: null,
      parmCode: null
    });
    this.currentPage.set(0);
    this.matrixRecords.set([]);
    this.totalRecords.set(0);
  }

  onSortChange(event: TableSortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(0);
    this.loadMatrixRecords();
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadMatrixRecords();
  }

  onRowAction(event: TableRowActionEvent<EquipmentProductCgmpMatrix>): void {
    this.panelTrigger = document.activeElement as HTMLElement;
    if (event.action === 'edit') {
      this.onEdit(event.row);
    }
  }

  onAddNew(): void {
    this.panelTrigger = document.activeElement as HTMLElement;
    this.panelMode.set('add');
    this.selectedRecord.set(null);
    this.showPanel.set(true);
    this.panelToggled.emit(true);
    this.focusPanelCloseButton();
  }

  private onEdit(record: EquipmentProductCgmpMatrix): void {
    this.panelMode.set('edit');
    this.selectedRecord.set(record);
    this.showPanel.set(true);
    this.panelToggled.emit(true);
    this.focusPanelCloseButton();
  }

  onPanelClose(): void {
    this.showPanel.set(false);
    this.selectedRecord.set(null);
    this.panelToggled.emit(false);
    const trigger = this.panelTrigger;
    this.panelTrigger = null;
    setTimeout(() => trigger?.focus());
  }

  private focusPanelCloseButton(): void {
    setTimeout(() => {
      const closeBtn = document.querySelector<HTMLElement>(
        '.side-panel-container button[aria-label="Close panel"]'
      );
      closeBtn?.focus();
    }, 50);
  }

  onPanelSaveSuccess(): void {
    this.showPanel.set(false);
    this.selectedRecord.set(null);
    this.panelToggled.emit(false);
    this.loadMatrixRecords();
  }

  onRecordAdded(): void {
    this.loadMatrixRecords();
  }

  private loadMatrixRecords(): void {
    this.isLoading.set(true);

    const sortDir = this.sortDirection();
    const sortColumn = sortDir && sortDir !== 'default' ? 'Proc' : undefined;
    const sortOrder = sortDir === 'A' ? 'ASC' as const : sortDir === 'D' ? 'DESC' as const : undefined;

    const filters: EquipmentCgmpMatrixQueryDto = {
      equipType: this.filterForm.value.equipType || undefined,
      proc: this.filterForm.value.proc || undefined,
      productCode: this.filterForm.value.productCode || undefined,
      parmCode: this.filterForm.value.parmCode || undefined,
      sortColumn,
      sortOrder
    };

    const take = this.pageSize();
    const skip = this.currentPage() * this.pageSize();

    this.service.getEquipmentCgmpMatrixRecords(take, skip, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: EquipmentProductCgmpMatrix[]; totalCount: number }) => {
          this.matrixRecords.set(response.data);
          this.totalRecords.set(response.totalCount);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.handleError('Failed to load matrix records', err);
          this.isLoading.set(false);
        }
      });
  }

  formatDate(date: string | undefined): string {
    if (!date) return '--';
    const parsed = moment(date);
    return parsed.isValid() ? parsed.format('DD-MMM-YYYY') : date;
  }

  reloadData(): void {
    this.loadMatrixRecords();
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    const errorMsg = error?.error?.message || error?.message || message;
    this.snackBar.open(errorMsg, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
