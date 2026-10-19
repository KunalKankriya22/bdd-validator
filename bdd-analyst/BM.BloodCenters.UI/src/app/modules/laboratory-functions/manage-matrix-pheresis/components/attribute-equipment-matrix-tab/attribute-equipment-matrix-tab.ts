/**
 * Tab Component: Procedure Attribute/Equipment Matrix - Pheresis
 * JIRA: MLT-12856
 * Oracle Forms: VATTREQU.fmb
 * Pattern: Follows manage-matrix-pheresis structure
 */

import { Component, OnInit, OnDestroy, inject, signal, computed, effect, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TablePageEvent, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { MatrixPheresisService } from '../../services/matrix-pheresis.service';
import { AddEditAttributeEquipmentPanelComponent } from '../add-edit-attribute-equipment-panel/add-edit-attribute-equipment-panel';
import {
  ProcedureAttributeEquipment,
  AttributeGroupDropdown,
  AttributeCodeDropdown,
  EquipmentTypeDropdown,
  ParameterCodeDropdown
} from '../../models/matrix-pheresis.model';

@Component({
  selector: 'app-attribute-equipment-matrix-tab',
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
    MatSnackBarModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    DataTable,
    AddEditAttributeEquipmentPanelComponent
  ],
  templateUrl: './attribute-equipment-matrix-tab.html',
  styleUrls: ['./attribute-equipment-matrix-tab.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttributeEquipmentMatrixTabComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly service = inject(MatrixPheresisService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // Filter form
  filterForm!: FormGroup;

  // Search control for dropdown
  attributeGroupSearchControl = new FormControl('');

  // Filtered list
  filteredAttributeGroups = signal<AttributeGroupDropdown[]>([]);

  // Loading states
  isLoading = signal<boolean>(false);
  isLoadingFilters = signal<boolean>(false);

  // CRIT-2: stores the element that triggered the panel so focus can be restored on close
  private panelTrigger: HTMLElement | null = null;

  // Data
  records = signal<ProcedureAttributeEquipment[]>([]);
  totalRecords = signal<number>(0);

  // Dropdowns
  attributeGroups = signal<AttributeGroupDropdown[]>([]);
  attributeCodes = signal<AttributeCodeDropdown[]>([]);
  equipmentTypes = signal<EquipmentTypeDropdown[]>([]);
  parameterCodes = signal<ParameterCodeDropdown[]>([]);

  // Pagination
  currentPage = signal<number>(0);
  pageSize = signal<number>(25);
  pageSizeOptions = [10, 25, 50, 100];

  // Error
  errorMessage = signal<string | null>(null);

  // Panel state
  showPanel = signal<boolean>(false);
  panelMode = signal<'add' | 'edit'>('add');
  selectedRecord = signal<ProcedureAttributeEquipment | null>(null);
  panelToggled = output<boolean>();

  // Selected description for display
  selectedAttributeGroupDescription = signal<string>('');

  // Track if attribute group is selected
  hasAttributeGroupSelected = signal<boolean>(false);

  // Data table configuration
  tableConfig = signal<DataTableConfig<ProcedureAttributeEquipment>>({
    columns: [
      {
        key: 'attributeCode',
        header: 'Procedure',
        sortable: true,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'attributeDesc',
        header: 'Procedure Description',
        sortable: false,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'equipmentType',
        header: 'Equipment Type',
        sortable: false,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'equipmentDesc',
        header: 'Equipment Description',
        sortable: false,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'parameterCode',
        header: 'Parameter Code',
        sortable: false,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'parameterDesc',
        header: 'Parameter Description',
        sortable: false,
        valueFormatter: (value) => this.formatValue(value)
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        valueFormatter: (value) => this.formatDate(value)
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        valueFormatter: (value) => this.formatDate(value)
      }
    ],
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit',
        ariaLabel: 'Edit attribute equipment entry for {{attributeCode}} - {{equipmentType}} - {{parameterCode}}',
        action: 'edit',
        color: 'primary'
      }
    ],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true
    },
    sortConfig: {
      column: 'attributeCode',
      direction: 'A'
    },
    showPagination: true,
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Please enter Search criteria to view Results.',
    noDataIcon: 'search'
  });

  // Computed
  hasData = computed(() => this.records().length > 0);

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadDropdowns();
    this.setupSearchFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize filter form
   */
  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      attributeGroup: [null, [Validators.required]]
    });
  }

  /**
   * Setup search filter for attribute group dropdown
   */
  private setupSearchFilter(): void {
    this.attributeGroupSearchControl.valueChanges
      .pipe(
        startWith(''),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        const search = (searchValue || '').toLowerCase();
        if (!search) {
          this.filteredAttributeGroups.set(this.attributeGroups());
        } else {
          const filtered = this.attributeGroups().filter(g =>
            g.attributeGroup.toLowerCase().includes(search) ||
            g.description.toLowerCase().includes(search)
          );
          this.filteredAttributeGroups.set(filtered);
        }
      });
  }

  /**
   * Load dropdown data (lazy loading - only when tab is activated)
   */
  private loadDropdowns(): void {
    this.isLoadingFilters.set(true);

    // Load attribute groups
    this.service
      .getAttributeGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.attributeGroups.set(groups);
          this.filteredAttributeGroups.set(groups); // Set immediately
          this.checkDropdownsLoaded();
        },
        error: (error) => {
          console.error('Error loading attribute groups:', error);
          this.handleError('Failed to load attribute groups');
          this.checkDropdownsLoaded();
        }
      });

    // Load equipment types
    this.service
      .getEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.equipmentTypes.set(types);
          this.checkDropdownsLoaded();
        },
        error: (error) => {
          console.error('Error loading equipment types:', error);
          this.handleError('Failed to load equipment types');
          this.checkDropdownsLoaded();
        }
      });

    // Load parameter codes
    this.service
      .getParameterCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.parameterCodes.set(codes);
          this.checkDropdownsLoaded();
        },
        error: (error) => {
          console.error('Error loading parameter codes:', error);
          this.handleError('Failed to load parameter codes');
          this.checkDropdownsLoaded();
        }
      });
  }

  /**
   * Check if all dropdowns are loaded
   */
  private checkDropdownsLoaded(): void {
    // Turn off loading spinner when all dropdowns have been attempted (success or error)
    const allAttempted =
      (this.attributeGroups().length > 0 || this.filteredAttributeGroups().length > 0) &&
      (this.equipmentTypes().length >= 0) &&
      (this.parameterCodes().length >= 0);

    if (allAttempted) {
      this.isLoadingFilters.set(false);
    }
  }

  /**
   * Execute search with filters
   */
  onRetrieve(): void {
    this.filterForm.markAllAsTouched();

    if (this.filterForm.invalid) {
      if (!this.filterForm.get('attributeGroup')?.value) {
        this.handleError('Please select an attribute group');
      }
      return;
    }

    this.currentPage.set(0);
    this.loadRecords();
  }

  /**
   * Reset filters and clear data
   */
  onClearAll(): void {
    this.filterForm.reset();
    this.selectedAttributeGroupDescription.set('');
    this.hasAttributeGroupSelected.set(false);
    this.currentPage.set(0);
    this.records.set([]);
    this.totalRecords.set(0);

    // Update table config
    this.tableConfig.update(config => ({
      ...config,
      pagination: {
        ...config.pagination!,
        totalRecords: 0,
        pageIndex: 0
      }
    }));
  }

  /**
   * Handle attribute group selection change
   */
  onAttributeGroupChange(): void {
    const selectedValue = this.filterForm.get('attributeGroup')?.value;
    if (selectedValue) {
      const selected = this.attributeGroups().find(g => g.attributeGroup === selectedValue);
      this.selectedAttributeGroupDescription.set(selected?.description || '');
      this.hasAttributeGroupSelected.set(true);
    } else {
      this.selectedAttributeGroupDescription.set('');
      this.hasAttributeGroupSelected.set(false);
    }
  }

  /**
   * Load attribute equipment records
   */
  private loadRecords(): void {
    const attributeGroup = this.filterForm.get('attributeGroup')?.value;
    if (!attributeGroup) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const take = this.pageSize();
    const skip = this.currentPage() * this.pageSize();

    const sortDir = this.tableConfig().sortConfig?.direction;
    const sortColumn = sortDir && sortDir !== 'default' ? 'AttribCode' : undefined;
    const sortOrder = sortDir === 'A' ? 'ASC' as const : sortDir === 'D' ? 'DESC' as const : undefined;

    this.service
      .getAttributeEquipmentRecords(take, skip, attributeGroup, sortColumn, sortOrder)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.records.set(response.data);
          this.totalRecords.set(response.totalCount);

          // Update table config with new total
          this.tableConfig.update(config => ({
            ...config,
            pagination: {
              ...config.pagination!,
              totalRecords: response.totalCount,
              pageIndex: this.currentPage(),
              pageSize: this.pageSize()
            }
          }));

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading records:', error);
          this.handleError('Failed to load attribute equipment records');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Handle pagination change
   */
  onSortChange(event: TableSortEvent): void {
    this.tableConfig.update(config => ({
      ...config,
      sortConfig: {
        column: event.column,
        direction: event.direction
      }
    }));
    this.currentPage.set(0);
    this.loadRecords();
  }

  onPageChange(event: TablePageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadRecords();
  }

  /**
   * Handle table row actions
   */
  onRowAction(event: TableRowActionEvent<ProcedureAttributeEquipment>): void {
    this.panelTrigger = document.activeElement as HTMLElement;
    if (event.action === 'edit') {
      this.onEdit(event.row);
    }
  }

  /**
   * Open add panel
   */
  onAddNew(): void {
    // Validate that attribute group is selected
    const attributeGroup = this.filterForm.get('attributeGroup')?.value;
    if (!attributeGroup) {
      this.handleError('Please select an attribute group before adding a new record');
      return;
    }

    this.panelTrigger = document.activeElement as HTMLElement;
    this.panelMode.set('add');
    this.selectedRecord.set(null);
    this.showPanel.set(true);
    this.panelToggled.emit(true);
    this.focusPanelCloseButton();
  }

  /**
   * Get the currently selected attribute group from filter
   */
  getSelectedAttributeGroup(): string {
    return this.filterForm.get('attributeGroup')?.value || '';
  }

  /**
   * Open edit panel with selected record
   */
  onEdit(record: ProcedureAttributeEquipment): void {
    this.panelMode.set('edit');
    this.selectedRecord.set(record);
    this.showPanel.set(true);
    this.panelToggled.emit(true);
    this.focusPanelCloseButton();
  }

  /**
   * Handle panel close event
   */
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

  /**
   * Handle panel save success event
   */
  onPanelSaveSuccess(): void {
    this.showPanel.set(false);
    this.selectedRecord.set(null);
    this.panelToggled.emit(false);
    this.loadRecords();
  }

  onRecordAdded(): void {
    this.loadRecords();
  }

  /**
   * Load attribute codes for panel (cascading dropdown)
   */
  loadAttributeCodesForPanel(attributeGroup: string): void {
    this.service
      .getAttributeCodes(attributeGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.attributeCodes.set(codes);
        },
        error: (error) => {
          console.error('Error loading attribute codes:', error);
          this.handleError('Failed to load attribute codes');
        }
      });
  }

  /**
   * Format value for display (show '-' for blank/null/undefined)
   */
  formatValue(value?: any): string {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Show success snackbar
   */
  private handleSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error snackbar
   */
  private handleError(message: string): void {
    this.errorMessage.set(message);
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
