import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { AnyLotNumberQueryService } from './services/any-lot-number-query.service';
import {
  LotTypeLov,
  LotNumberLov,
  LotUnitRow,
  LotComponentRow
} from './models/any-lot-number-query.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn } from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-any-lot-number-query',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable
  ],
  templateUrl: './any-lot-number-query.html',
  styleUrls: ['./any-lot-number-query.scss']
})
export class AnyLotNumberQueryComponent implements OnInit, OnDestroy {
  @ViewChild('unitsTable') unitsTable!: DataTable<LotUnitRow>;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  unitsTableConfig: DataTableConfig<LotUnitRow> = {
    columns: [],
    rowActions: [],
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: true,
    emptyMessage: 'No Results to Display',
    noDataIcon: 'edit',
    loadingMessage: 'Loading...'
  };

  componentsTableConfig: DataTableConfig<LotComponentRow> = {
    columns: [],
    rowActions: [],
    stickyHeader: true,
    showPagination: false,
    enableRowHighlight: false,
    emptyMessage: '',
    noDataIcon: 'edit',
    showTableOnEmpty: true
  };

  lotTypes: LotTypeLov[] = [];
  lotNumbers: LotNumberLov[] = [];
  filteredLotTypes: LotTypeLov[] = [];
  filteredLotNumbers: LotNumberLov[] = [];
  selectedLotType: string | null = null;
  selectedLotNumber: string | null = null;
  recordCount: number | null = null;

  lotTypeSearchControl = new FormControl<string>('');
  lotNumberSearchControl = new FormControl<string>('');

  units: LotUnitRow[] = [];
  components: LotComponentRow[] = [];
  isLoading = false;
  hasSearched = false;

  private destroy$ = new Subject<void>();

  constructor(
    private queryService: AnyLotNumberQueryService,
    private pageHeaderService: PageHeaderService,
    private headerService: HeaderService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
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

  ngOnInit(): void {
    this.loadLotTypes();
    this.subscribeToChapterChanges();
    this.setupDropdownSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetForm();
        this.loadLotTypes();
      });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [{ label: 'Home', link: '/home' }],
      title: '',
      subtitle: '',
      actions: []
    };

    this.unitsTableConfig = {
      columns: this.getUnitColumns(),
      rowActions: [],
      stickyHeader: true,
      showPagination: false,
      enableRowHighlight: true,
      emptyMessage: 'No Results to Display',
      noDataIcon: 'edit',
      loadingMessage: 'Loading...'
    };

    this.componentsTableConfig = {
      columns: this.getComponentColumns(),
      rowActions: [],
      stickyHeader: true,
      showPagination: false,
      enableRowHighlight: false,
      emptyMessage: '',
      noDataIcon: 'edit',
      showTableOnEmpty: true
    };
  }

  private getUnitColumns(): TableColumn<LotUnitRow>[] {
    return [
      { key: 'unitId', header: 'Unit ID', width: '180px' },
      {
        key: 'collDate',
        header: 'Collection Date',
        width: '150px',
        valueFormatter: (value) => this.formatDateDisplay(value)
      },
      { key: 'sourceTable', header: 'Table Name', width: '140px' }
    ];
  }

  private getComponentColumns(): TableColumn<LotComponentRow>[] {
    return [
      { key: 'productCode', header: 'Product Code', width: '160px', valueFormatter: (v) => v || '-' },
      { key: 'componentStatus', header: 'Custody', width: '140px', valueFormatter: (v) => v || '-' },
      { key: 'aboLabel', header: 'ABORh', width: '160px', valueFormatter: (v) => v || '-' },
      { key: 'destination', header: 'Destination', width: '160px', valueFormatter: (v) => v || '-' }
    ];
  }

  private setupDropdownSearch(): void {
    this.lotTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredLotTypes = this.lotTypes.filter(
          (lt) => lt.bagCode.toLowerCase().includes(term) || lt.codeDesc.toLowerCase().includes(term)
        );
      });

    this.lotNumberSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredLotNumbers = this.lotNumbers.filter(
          (ln) => ln.lotNumber.toLowerCase().includes(term)
        );
      });
  }

  private loadLotTypes(): void {
    this.queryService.getLotTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.lotTypes = types;
          this.filteredLotTypes = [...types];
          this.lotTypeSearchControl.setValue('', { emitEvent: false });
        },
        error: (err) => {
          this.lotTypes = [];
          this.filteredLotTypes = [];
          this.showErrorMessage(err?.error?.message || 'An error occurred while retrieving lot types.');
        }
      });
  }

  onLotTypeChange(): void {
    this.selectedLotNumber = null;
    this.lotNumbers = [];
    this.filteredLotNumbers = [];
    this.units = [];
    this.components = [];
    this.recordCount = null;
    this.hasSearched = false;
    this.lotNumberSearchControl.setValue('', { emitEvent: false });

    if (this.selectedLotType) {
      this.queryService.getLotNumbers(this.selectedLotType)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (numbers) => {
            this.lotNumbers = numbers;
            this.filteredLotNumbers = [...numbers];
            this.lotNumberSearchControl.setValue('', { emitEvent: false });
          },
          error: (err) => {
            this.lotNumbers = [];
            this.filteredLotNumbers = [];
            this.showErrorMessage(err?.error?.message || 'An error occurred while retrieving lot numbers.');
          }
        });
    }
  }

  onLotNumberChange(): void {
    if (this.selectedLotType && this.selectedLotNumber) {
      this.executeQuery();
    }
  }

  private executeQuery(): void {
    if (!this.selectedLotType || !this.selectedLotNumber) {
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;
    this.components = [];

    this.queryService.queryByLotNumber({
      lotType: this.selectedLotType,
      lotNumber: this.selectedLotNumber
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.units = response.units;
          this.recordCount = response.totalUnits;
          this.isLoading = false;
          if (this.units.length > 0) {
            this.components = this.units[0].components || [];
            this.cdr.detectChanges();
            if (this.unitsTable) {
              this.unitsTable.activeRow = this.units[0];
            }
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.units = [];
          this.recordCount = 0;
          this.showErrorMessage(err?.error?.message || 'An error occurred while querying lot number.');
        }
      });
  }

  onUnitRowClick(unit: LotUnitRow): void {
    if (this.unitsTable) {
      this.unitsTable.activeRow = unit;
    }
    this.components = unit.components || [];
  }

  private resetForm(): void {
    this.selectedLotType = null;
    this.selectedLotNumber = null;
    this.lotTypes = [];
    this.lotNumbers = [];
    this.filteredLotTypes = [];
    this.filteredLotNumbers = [];
    this.units = [];
    this.components = [];
    this.recordCount = null;
    this.hasSearched = false;
    this.lotTypeSearchControl.setValue('', { emitEvent: false });
    this.lotNumberSearchControl.setValue('', { emitEvent: false });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 6000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private formatDateDisplay(value: string | null): string {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
  }
}
