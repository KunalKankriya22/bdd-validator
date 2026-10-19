import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { HttpErrorResponse } from '@angular/common/http';
import moment from 'moment';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ROUTES } from '../../../../core/constants/route.constants';
import { EquipmentMasterCodeService } from './services/equipment-master-code.service';
import {
  AddEditEquipmentMasterCodeComponent,
  EquipmentMasterCodeDialogData,
  EquipmentMasterCodeResult,
  UserGroupOption,
} from './add-edit-equipment-master-code/add-edit-equipment-master-code';
import { EquipmentMasterCodeDto, EquipmentMasterCodeFilter } from './models/equipment-master-code.model';
import { FilterEquipmentMasterCodesComponent, FilterEquipmentMasterCodesDialogData } from './filter-equipment-master-codes/filter-equipment-master-codes';
import { EquipmentMasterCodesFilterChipsUtils } from './utils/filter-chips.utils';

export interface EquipmentMasterCode {
  codeType: string;
  code: string;
  description: string;
  effectiveDate: string | null;
  terminationDate: string | null;
  userGroup: string | null;
  modifiedBy: string | null;
  modificationDate: string | null;
}

export interface MasterCodeType {
  value: string;
  label: string;
}

@Component({
  selector: 'app-enter-equipment-master-codes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    FilterChips,
    AddEditEquipmentMasterCodeComponent,
    FilterEquipmentMasterCodesComponent,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './enter-equipment-master-codes.html',
  styleUrl: './enter-equipment-master-codes.scss',
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      },
    },
  ],
})
export class EnterEquipmentMasterCodesComponent implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME },
      { label: 'Enter Equipment Master Codes', link: null },
    ],
    actions: [],
  };

  filterForm: FormGroup;

  masterCodeTypes: MasterCodeType[] = [];
  filteredMasterCodeTypes: MasterCodeType[] = [];
  masterCodeTypeSearchCtrl = new FormControl('');
  userGroupOptions: UserGroupOption[] = [];

  displayedColumns: string[] = [
    'code',
    'description',
    'effectiveDate',
    'terminationDate',
    'userGroup',
    'modifiedBy',
    'modificationDate',
    'actions',
  ];

  masterCodes: EquipmentMasterCode[] = [];
  selectedRow: EquipmentMasterCode | null = null;

  sidePanelOpen = false;
  sidePanelMode: 'add' | 'edit' = 'add';
  sidePanelData: EquipmentMasterCodeDialogData | null = null;

  isLoading = false;
  isDropdownLoading = false;
  hasRetrieved = false;
  isFilterPanelOpen = false;
  filterChips: FilterChip[] = [];
  searchTerm = '';
  currentFilters: EquipmentMasterCodeFilter = {};

  totalRecords = 0;
  pageSize = 25;
  pageIndex = 0;

  sortDirection: 'A' | 'D' | '' = '';

  descriptionTooltipDisabled = new Map<string, boolean>();

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Code and Description',
    minLength: 3,
    ariaLabel: 'Search by Code and Description',
    searchOnEnterOnly: true,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackbarService: SnackbarService,
    private equipmentMasterCodeService: EquipmentMasterCodeService,
    private headerService: HeaderService,
  ) {
    this.filterForm = this.fb.group({
      masterCodeType: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.subscribeToChapterChanges();
    this.masterCodeTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const search = (term ?? '').toLowerCase();
        this.filteredMasterCodeTypes = this.masterCodeTypes.filter(t =>
          t.value.toLowerCase().includes(search) || t.label.toLowerCase().includes(search),
        );
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.masterCodeTypeSearchCtrl.setValue('');
        this.loadDropdowns();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDropdowns(): void {
    this.isDropdownLoading = true;
    forkJoin({
      codeTypes: this.equipmentMasterCodeService.getCodeTypes(),
      userGroups: this.equipmentMasterCodeService.getUserGroups(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ codeTypes, userGroups }) => {
          this.masterCodeTypes = codeTypes.map(ct => ({ value: ct.code, label: ct.codeDesc }));
          this.filteredMasterCodeTypes = [...this.masterCodeTypes];
          this.userGroupOptions = userGroups.map(ug => ({ value: ug.grpId, label: ug.descrip }));
          this.isDropdownLoading = false;
        },
        error: () => {
          this.isDropdownLoading = false;
          this.snackbarService.showError('Failed to load dropdown data. Please refresh the page.');
        },
      });
  }

  get selectedTypeDescription(): string {
    const val = this.filterForm.get('masterCodeType')?.value;
    if (!val) return '-';
    const found = this.masterCodeTypes.find(t => t.value === val);
    return found ? found.label : '-';
  }

  onRetrieve(): void {
    if (this.filterForm.get('masterCodeType')?.invalid) {
      this.filterForm.get('masterCodeType')?.markAsTouched();
      return;
    }
    this.hasRetrieved = true;
    this.pageIndex = 0;
    this.searchTerm = '';
    this.sortDirection = '';
    this.updateHeaderActions();
    this.loadData();
  }

  private loadData(): void {
    if (!this.hasRetrieved) return;
    const codeType = this.filterForm.get('masterCodeType')!.value as string;
    const skip = this.pageIndex * this.pageSize;
    const sort = this.sortDirection || undefined;

    const activeFilter = EquipmentMasterCodesFilterChipsUtils.hasActiveFilters(this.currentFilters)
      ? this.currentFilters
      : undefined;

    this.isLoading = true;
    this.equipmentMasterCodeService
      .getByCodeType(codeType, this.searchTerm || undefined, this.pageSize, skip, sort, activeFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ data, total }) => {
          this.masterCodes = data.map(dto => this.mapDto(dto));
          this.totalRecords = total;
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          const msg = err.error?.message || 'Failed to retrieve data. Please try again.';
          this.snackbarService.showError(msg);
        },
      });
  }

  private mapDto(dto: EquipmentMasterCodeDto): EquipmentMasterCode {
    return {
      codeType: dto.codeType,
      code: dto.code,
      description: dto.codeDesc,
      effectiveDate: dto.effDate ? moment(dto.effDate).format('DD-MMM-YYYY').toUpperCase() : null,
      terminationDate: dto.termDate ? moment(dto.termDate).format('DD-MMM-YYYY').toUpperCase() : null,
      userGroup: dto.restrictEdit || null,
      modifiedBy: dto.modifiedBy || null,
      modificationDate: dto.lastModifiedDate
        ? moment(dto.lastModifiedDate).format('DD-MMM-YY').toUpperCase()
        : null,
    };
  }

  private updateHeaderActions(): void {
    this.headerConfig = {
      ...this.headerConfig,
      actions: this.hasRetrieved
        ? [{ label: 'ADD NEW CODE', icon: 'add', onClick: () => this.onAddNew() }]
        : [],
    };
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.masterCodes = [];
    this.hasRetrieved = false;
    this.searchTerm = '';
    this.filterChips = [];
    this.currentFilters = {};
    this.totalRecords = 0;
    this.pageIndex = 0;
    this.sortDirection = '';
    this.sidePanelOpen = false;
    this.selectedRow = null;
    this.headerConfig = { ...this.headerConfig, actions: [] };
  }

  openFilter(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    const dialogWidth = 400;
    const spacing = 8;
    const left = Math.min(rect.left, window.innerWidth - dialogWidth - spacing);

    this.isFilterPanelOpen = true;

    const dialogData: FilterEquipmentMasterCodesDialogData = {
      currentFilters: this.currentFilters,
      userGroupOptions: this.userGroupOptions,
    };

    const dialogRef = this.dialog.open(FilterEquipmentMasterCodesComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'error-filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop: true,
      data: dialogData,
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`,
      },
    });

    dialogRef.afterClosed().subscribe((filters: EquipmentMasterCodeFilter) => {
      this.isFilterPanelOpen = false;
      button.blur();
      if (filters) {
        this.currentFilters = filters;
        this.filterChips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(filters);
        this.pageIndex = 0;
        this.loadData();
      }
    });
  }

  removeFilterChip(chipKey: string): void {
    const updatedFilters = EquipmentMasterCodesFilterChipsUtils.removeFilterByChipKey(
      this.currentFilters,
      chipKey,
    );

    if (updatedFilters) {
      this.currentFilters = updatedFilters;
      this.filterChips = EquipmentMasterCodesFilterChipsUtils.convertFiltersToChips(updatedFilters);
      this.pageIndex = 0;
      this.loadData();
    } else {
      this.clearAllFiltersChips();
    }
  }

  clearAllFiltersChips(): void {
    this.currentFilters = {};
    this.filterChips = [];
    this.pageIndex = 0;
    this.loadData();
  }

  onSearch(keyword: string): void {
    this.searchTerm = keyword;
    this.pageIndex = 0;
    this.loadData();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onSort(): void {
    if (this.sortDirection === '') this.sortDirection = 'A';
    else if (this.sortDirection === 'A') this.sortDirection = 'D';
    else this.sortDirection = '';
    this.pageIndex = 0;
    this.loadData();
  }

  getSortIcon(): string {
    if (this.sortDirection === 'A') return 'arrow_upward';
    if (this.sortDirection === 'D') return 'arrow_downward';
    return 'unfold_more';
  }

  isRowHighlighted(row: EquipmentMasterCode): boolean {
    return this.selectedRow?.code === row.code;
  }

  onDescriptionHover(event: MouseEvent, code: string): void {
    const el = event.target as HTMLElement;
    this.descriptionTooltipDisabled.set(code, el.scrollWidth <= el.clientWidth);
  }

  onAddNew(): void {
    const codeType = this.filterForm.get('masterCodeType')!.value as string;
    this.sidePanelMode = 'add';
    this.sidePanelData = { mode: 'add', codeType };
    this.sidePanelOpen = true;
  }

  onEdit(row: EquipmentMasterCode): void {
    this.selectedRow = row;
    this.sidePanelMode = 'edit';
    this.sidePanelData = {
      mode: 'edit',
      codeType: row.codeType,
      code: row.code,
      description: row.description,
      effectiveDate: row.effectiveDate,
      terminationDate: row.terminationDate,
      userGroup: row.userGroup,
      modifiedBy: row.modifiedBy,
      modificationDate: row.modificationDate,
    };
    this.sidePanelOpen = true;
  }

  closeSidePanel(): void {
    this.sidePanelOpen = false;
    this.selectedRow = null;
  }

  onSaveSuccess(result: EquipmentMasterCodeResult): void {
    const message =
      this.sidePanelMode === 'add'
        ? 'New Master code has been added successfully.'
        : 'Changes have been saved successfully.';
    this.closeSidePanel();
    this.snackbarService.showSuccess(message);
    this.loadData();
  }

  onSaveAndAddAnother(result: EquipmentMasterCodeResult): void {
    this.snackbarService.showSuccess('New Master code has been added successfully.');
    this.loadData();
  }
}
