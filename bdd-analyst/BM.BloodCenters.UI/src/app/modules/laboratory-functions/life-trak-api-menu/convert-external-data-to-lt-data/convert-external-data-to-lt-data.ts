/**
 * Convert External Data to LT Data Component
 *
 * JIRA: MLT-13468
 * Mnemonic: APICONVL
 * FMB File: APILCONV
 *
 * Purpose: View and maintain source-to-target data conversions to ensure
 * accurate integration and standardized system data for LifeTrak API.
 *
 * Business Rules:
 * - Source Application ID is required
 * - Target Application ID defaults to 'BC' (handled by API)
 * - Effective Date cannot be earlier than today
 * - Termination Date must be on or after Effective Date
 * - Dates are stored in GMT (timezone conversion handled by API)
 *
 * Route: /laboratory-functions/lifetrak-api-menu/convert-external-data-to-lt-data
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, catchError, of } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

import { ConversionMappingApiService } from './services/conversion-mapping-api.service';
import {
  ConversionMappingDto,
  SourceApplicationDto,
  TargetValueTypeDto,
  ConversionMappingQueryDto,
} from './models/conversion-mapping.model';
import { AddEditConversionDialog } from './dialogs/add-edit-conversion-dialog/add-edit-conversion-dialog';

@Component({
  selector: 'app-convert-external-data-to-lt-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    AddEditConversionDialog,
  ],
  templateUrl: './convert-external-data-to-lt-data.html',
  styleUrl: './convert-external-data-to-lt-data.scss',
})
export class ConvertExternalDataToLtData implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly apiService = inject(ConversionMappingApiService);
  private readonly snackbarService = inject(SnackbarService);

  headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      return {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || '',
        actions: [
          {
            label: 'ADD NEW',
            icon: 'add',
            onClick: () => this.onAddNew(),
          },
        ],
      };
    }
    return {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      subtitle: '',
      actions: [
        {
          label: 'ADD NEW',
          icon: 'add',
          onClick: () => this.onAddNew(),
        },
      ],
    };
  });

  searchForm!: FormGroup;
  dataSource: ConversionMappingDto[] = [];
  isLoading = false;
  hasSearched = false;

  // Source Applications dropdown state
  readonly sourceApplications = signal<SourceApplicationDto[]>([]);
  readonly sourceAppsLoading = signal<boolean>(false);
  sourceAppSearchControl = new FormControl('');
  filteredSourceApplications: SourceApplicationDto[] = [];

  // Target Value Types for dialogs
  readonly targetValueTypes = signal<TargetValueTypeDto[]>([]);

  // Target ID display (readonly field)
  readonly targetIdDisplay = signal<string>('-');

  // Side Panel State
  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: ConversionMappingDto | null = null;
  sidePanelSourceApplId = '';

  // Row highlighting (for recently updated rows)
  highlightedRow: ConversionMappingDto | null = null;

  tableConfig: DataTableConfig<ConversionMappingDto> = {
    columns: [
      {
        key: 'sourceValue',
        header: 'Source Value',
        sortable: false,
        width: '150px'
      },
      {
        key: 'targetValue',
        header: 'Target Value',
        sortable: false,
        width: '150px'
      },
      {
        key: 'targetValueType',
        header: 'Target Value Type',
        sortable: false,
        width: '180px'
      },
      {
        key: 'effDate',
        header: 'Effective Date',
        sortable: false,
        width: '140px',
        valueFormatter: (v: string) => this.formatDate(v),
      },
      {
        key: 'termDate',
        header: 'Termination Date',
        sortable: false,
        width: '140px',
        valueFormatter: (v: string) => (v ? this.formatDate(v) : '–'),
      },
      {
        key: 'lastModDate',
        header: 'Modification Date',
        sortable: false,
        width: '180px',
        valueFormatter: (v: string) => this.formatDate(v),
      },
    ],
    rowActions: [
      {
        icon: 'edit',
        label: 'Edit',
        action: 'edit',
        ariaLabel: 'Edit conversion mapping',
      },
    ],
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Enter details to begin.',
    noDataIcon: 'search',
    enableRowHighlight: false,
    showActionsAsMenu: false,
  };

  get isRetrieveDisabled(): boolean {
    return this.isLoading || !this.searchForm.valid;
  }

  get isClearAllDisabled(): boolean {
    return (
      !this.searchForm.dirty &&
      !this.searchForm.get('sourceApplId')?.value &&
      !this.hasSearched
    );
  }

  ngOnInit(): void {
    this.initSearchForm();
    this.loadSourceApplications();
    this.loadTargetValueTypes();
    this.setupSourceAppSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      sourceApplId: ['', Validators.required],
    });

    // When Source ID changes, automatically set Target ID to 'BC'
    this.searchForm.get('sourceApplId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((sourceId) => {
        if (sourceId) {
          this.targetIdDisplay.set('BC');
        } else {
          this.targetIdDisplay.set('-');
        }
      });
  }

  private loadSourceApplications(): void {
    this.sourceAppsLoading.set(true);
    this.apiService
      .getSourceApplications()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.sourceAppsLoading.set(false);
          this.snackbarService.showError('Failed to load source applications');
          return of({ success: false, data: [] } as any);
        })
      )
      .subscribe((response) => {
        this.sourceAppsLoading.set(false);
        if (response.success) {
          this.sourceApplications.set(response.data);
          this.filteredSourceApplications = response.data;
        }
      });
  }

  private setupSourceAppSearch(): void {
    this.sourceAppSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterSourceApplications();
      });
  }

  private filterSourceApplications(): void {
    const searchTerm = (this.sourceAppSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredSourceApplications = this.sourceApplications();
    } else {
      this.filteredSourceApplications = this.sourceApplications().filter(source =>
        source.code.toLowerCase().includes(searchTerm) ||
        source.codeDesc.toLowerCase().includes(searchTerm)
      );
    }
  }

  private loadTargetValueTypes(): void {
    this.apiService
      .getTargetValueTypes()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.snackbarService.showError('Failed to load target value types');
          return of({ success: false, data: [] } as any);
        })
      )
      .subscribe((response) => {
        if (response.success) {
          this.targetValueTypes.set(response.data);
        }
      });
  }

  onRetrieve(): void {
    if (!this.searchForm.valid || this.isLoading) return;

    this.isLoading = true;
    this.hasSearched = true;

    const formValues = this.searchForm.getRawValue();
    const queryDto: ConversionMappingQueryDto = {
      sourceApplId: formValues.sourceApplId,
    };

    this.apiService
      .getConversionMappings(100, 0, queryDto) // Max 100 records per API limit
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.isLoading = false;
          const errorMessage =
            error?.error?.message ||
            error?.error?.Error ||
            'Failed to retrieve conversion mappings';
          this.snackbarService.showError(errorMessage);
          return of({ success: false, data: [] } as any);
        })
      )
      .subscribe((response) => {
        this.isLoading = false;
        if (response.success) {
          this.dataSource = response.data || [];

          // Set Target ID from first record if data exists, otherwise keep it as 'BC'
          if (this.dataSource.length > 0 && this.dataSource[0].targetApplId) {
            this.targetIdDisplay.set(this.dataSource[0].targetApplId);
          }
          // If no data found, keep the default 'BC' from the valueChanges subscription
        }
      });
  }

  onClearAll(): void {
    this.closeSidePanel();
    this.searchForm.reset();
    this.dataSource = [];
    this.hasSearched = false;
    this.targetIdDisplay.set('-');
  }

  onAddNew(): void {
    const sourceApplId = this.searchForm.get('sourceApplId')?.value || '';
    this.sidePanelSourceApplId = sourceApplId;
    this.sidePanelMode = 'add';
    this.sidePanelData = null;
    this.sidePanelOpen = true;
  }

  onRowAction(event: any): void {
    if (event.action === 'edit') {
      this.onEdit(event.row);
    }
  }

  private onEdit(mapping: ConversionMappingDto): void {
    this.sidePanelSourceApplId = mapping.sourceApplId;
    this.sidePanelMode = 'edit';
    this.sidePanelData = mapping;
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.sidePanelData = null;
  }

  onSaveSuccess(): void {
    // Save the current row data for highlighting after reload
    const currentRow = this.sidePanelData;

    // Reload data
    if (this.searchForm.get('sourceApplId')?.value) {
      this.onRetrieve();

      // Highlight the updated/created row after reload
      if (currentRow) {
        setTimeout(() => {
          // Find the row in the new data
          const updatedRow = this.dataSource.find(
            row =>
              row.sourceValue === currentRow.sourceValue &&
              row.targetValue === currentRow.targetValue &&
              row.targetValueType === currentRow.targetValueType
          );
          if (updatedRow) {
            this.highlightedRow = updatedRow;
            // Clear highlight after 3 seconds
            setTimeout(() => {
              this.highlightedRow = null;
            }, 3000);
          }
        }, 100);
      }
    }
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '–';
    const date = new Date(dateString);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

}
