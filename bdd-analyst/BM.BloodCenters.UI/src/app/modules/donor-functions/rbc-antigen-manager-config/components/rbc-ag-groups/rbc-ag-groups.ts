import {
  Component,
  signal,
  computed,
  HostListener,
  OnInit,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import {
  AntigenGroupOption,
  AntigenGroupRow,
  PanelMode,
  DISPLAY_ORDER_OPTIONS,
} from './models/rbc-ag-groups.model';
import { AddEditPanelComponent } from './add-edit-panel/add-edit-panel';
import {
  FilterPanelComponent,
  RbcAgGroupsFilter,
} from './filter-panel/filter-panel';
import { RbcAgGroupsService } from './services/rbc-ag-groups.service';

function buildPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Rows per page:';
  return intl;
}

@Component({
  selector: 'app-rbc-ag-groups',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    SearchBar,
    FilterChips,
    AddEditPanelComponent,
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: buildPaginatorIntl },
  ],
  templateUrl: './rbc-ag-groups.html',
  styleUrls: ['./rbc-ag-groups.scss'],
})
export class RbcAgGroupsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(RbcAgGroupsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  /* ── Filter Card controls ── */
  readonly antigenGroupControl    = new FormControl<AntigenGroupOption | null>(null);
  readonly displayOrderControl    = new FormControl<number | null>(null, [Validators.min(1), Validators.max(10)]);
  readonly antigenGroupSearchCtrl = new FormControl('');

  readonly antigenGroupOptions = signal<AntigenGroupOption[]>([]);
  readonly displayOrderOptions = DISPLAY_ORDER_OPTIONS;

  private readonly searchTerm = toSignal(this.antigenGroupSearchCtrl.valueChanges, { initialValue: '' });

  readonly filteredAntigenGroups = computed(() => {
    const term = (this.searchTerm() ?? '').toLowerCase();
    return this.antigenGroupOptions().filter(g => g.name.toLowerCase().includes(term));
  });

  get isRetrieveDisabled(): boolean {
    return !this.antigenGroupControl.value || !this.displayOrderControl.value || this.displayOrderControl.invalid;
  }

  get isClearAllDisabled(): boolean {
    return !this.antigenGroupControl.value && !this.displayOrderControl.value;
  }

  onClearAll(): void {
    this.antigenGroupControl.setValue(null);
    this.displayOrderControl.setValue(null);
    this.antigenGroupSearchCtrl.setValue('');
    this.allRows.set([]);
    this.totalRows.set(0);
    this.hasRetrieved.set(false);
    this.searchQuery = '';
    this.filterChips = [];
    this.currentFilters = {};
    this.pageIndex = 0;
    this.retrievedGroup = null;
    this.selectedGroup = null;
  }

  onDisplayOrderInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 2) {
      input.value = input.value.slice(0, 2);
      this.displayOrderControl.setValue(Number(input.value), { emitEvent: false });
    }
  }

  /* ── State ── */
  readonly hasRetrieved  = signal(false);
  readonly isLoading     = signal(false);
  readonly allRows       = signal<AntigenGroupRow[]>([]);
  readonly totalRows     = signal(0);
  readonly isFilterPanelOpen = signal(false);

  /* ── Search ── */
  searchQuery = '';
  readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by serological or Molecular Test',
    ariaLabel:   'Search by serological or Molecular Test',
    searchOnEnterOnly: true,
    minLength: 1,
  };

  /* ── Filter chips ── */
  filterChips: FilterChip[] = [];
  currentFilters: RbcAgGroupsFilter = {};

  /* ── Sort ── */
  sortColumn: keyof AntigenGroupRow | '' = 'serologicalTest';
  sortDirection: 'A' | 'D' | '' = '';

  private readonly sortColumnApiMap: Partial<Record<keyof AntigenGroupRow, string>> = {
    serologicalTest: 'serAgTestId',
    serologicalSeq:  'serTestDispOrder',
    molecularTest:   'molAgTestId',
    molecularSeq:    'molTestDispOrder',
    effectiveDate:   'effDate',
    terminationDate: 'termDate',
  };

  /* ── Pagination ── */
  pageSize  = 25;
  pageIndex = 0;

  /* ── Table columns ── */
  readonly displayedColumns = [
    'serologicalTest',
    'serologicalSeq',
    'molecularTest',
    'molecularSeq',
    'effectiveDate',
    'terminationDate',
    'action',
  ];

  /* ── Filtered data source (client-side search) ── */
  get filteredRows(): AntigenGroupRow[] {
    const q = this.searchQuery.toLowerCase();
    return this.allRows().filter(r =>
      !q ||
      r.serologicalTest?.toLowerCase().includes(q) ||
      r.molecularTest?.toLowerCase().includes(q),
    );
  }

  get paginatedRows(): AntigenGroupRow[] {
    return this.filteredRows;
  }

  /* ── Side Panel ── */
  panelOpen  = false;
  panelMode: PanelMode = 'add';
  selectedGroup: AntigenGroupOption | null = null;
  editRow: AntigenGroupRow | null = null;

  private retrievedGroup: AntigenGroupOption | null = null;

  ngOnInit(): void {
    this.loadFilterOptions();
  }

  private loadFilterOptions(): void {
    this.service.getFilterOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: options => this.antigenGroupOptions.set(options),
        error: () => {},
      });
  }

  /* ── Retrieve ── */
  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;
    const group = this.antigenGroupControl.value!;
    this.retrievedGroup = { name: group.name, displayOrder: this.displayOrderControl.value ?? group.displayOrder };
    this.selectedGroup  = this.retrievedGroup;
    this.pageIndex = 0;
    this.searchQuery = '';
    this.filterChips = [];
    this.currentFilters = {};
    this.fetchPage();
  }

  private fetchPage(onComplete?: () => void): void {
    const group = this.antigenGroupControl.value;
    if (!group) return;

    this.isLoading.set(true);
    this.hasRetrieved.set(true);

    const request = {
      antigenGroup: group.name,
      displayOrder: this.displayOrderControl.value,
      showTerminated: 'N',
      chapterLocalDate: this.chapterTimezoneService.getChapterLocalDate().format('YYYY-MM-DD'),
      effectiveDate: this.currentFilters.effectiveDate
        ? this.toApiDateString(this.currentFilters.effectiveDate)
        : null,
      effectiveDatePeriod: this.currentFilters.effectiveDate
        ? (this.currentFilters.effectiveDatePeriod ?? null)
        : null,
      terminationDate: this.currentFilters.terminationDate
        ? this.toApiDateString(this.currentFilters.terminationDate)
        : null,
      terminationDatePeriod: this.currentFilters.terminationDate
        ? (this.currentFilters.terminationDatePeriod ?? null)
        : null,
      sortColumn:    this.sortColumn ? (this.sortColumnApiMap[this.sortColumn] ?? null) : null,
      sortDirection: this.sortDirection === 'A' ? 'ASC' : this.sortDirection === 'D' ? 'DESC' : null,
    };

    const skip = this.pageIndex * this.pageSize;

    this.service.search(this.pageSize, skip, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data, total }) => {
          this.allRows.set(data);
          this.totalRows.set(total);
          this.isLoading.set(false);
          onComplete?.();
        },
        error: () => this.isLoading.set(false),
      });
  }

  onAddNewGroup(): void {
    this.antigenGroupControl.setValue(null);
    this.openPanel('add', null, null);
  }

  /* ── Sort ── */
  onSort(col: keyof AntigenGroupRow): void {
    if (this.sortColumn === col) {
      if (this.sortDirection === '')       { this.sortDirection = 'A'; }
      else if (this.sortDirection === 'A') { this.sortDirection = 'D'; }
      else                                 { this.sortDirection = ''; this.sortColumn = ''; }
    } else {
      this.sortColumn    = col;
      this.sortDirection = 'A';
    }
    this.pageIndex = 0;
    this.fetchPage();
  }

  getSortIcon(col: keyof AntigenGroupRow): string {
    if (this.sortColumn !== col || this.sortDirection === '') return 'unfold_more';
    return this.sortDirection === 'A' ? 'arrow_upward' : 'arrow_downward';
  }

  isSortActive(col: keyof AntigenGroupRow): boolean {
    return this.sortColumn === col && this.sortDirection !== '';
  }

  /* ── Search ── */
  onSearch(term: string): void {
    this.searchQuery = term;
    this.pageIndex   = 0;
  }

  /* ── Pagination ── */
  onPageChange(event: PageEvent): void {
    this.pageSize  = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.fetchPage();
  }

  /* ── Filter dialog ── */
  openFilter(event: MouseEvent): void {
    const btn  = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const dialogWidth = 400;
    const spacing     = 8;
    const left = Math.min(rect.left, window.innerWidth - dialogWidth - spacing);

    this.isFilterPanelOpen.set(true);

    const ref = this.dialog.open(FilterPanelComponent, {
      width:         `${dialogWidth}px`,
      maxWidth:      '90vw',
      panelClass:    'error-filter-dialog',
      backdropClass: 'transparent-backdrop',
      hasBackdrop:   true,
      data:          this.currentFilters,
      position: {
        top:  `${rect.bottom + spacing}px`,
        left: `${left}px`,
      },
    });

    ref.afterClosed().subscribe((filters: RbcAgGroupsFilter | undefined) => {
      this.isFilterPanelOpen.set(false);
      btn.blur();
      if (filters) {
        this.currentFilters = filters;
        this.filterChips    = this.buildFilterChips(filters);
        this.pageIndex      = 0;
        if (this.hasRetrieved()) this.fetchPage();
      }
    });
  }

  removeFilterChip(key: string): void {
    const updated: RbcAgGroupsFilter = { ...this.currentFilters };
    if (key === 'effectiveDate')    { updated.effectiveDate = null; updated.effectiveDatePeriod = undefined; }
    if (key === 'terminationDate')  { updated.terminationDate = null; updated.terminationDatePeriod = undefined; }
    this.currentFilters = updated;
    this.filterChips    = this.buildFilterChips(updated);
    this.pageIndex      = 0;
    if (this.hasRetrieved()) this.fetchPage();
  }

  clearAllFilters(): void {
    this.currentFilters = {};
    this.filterChips    = [];
    this.pageIndex      = 0;
    if (this.hasRetrieved()) this.fetchPage();
  }

  private toApiDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private buildFilterChips(filters: RbcAgGroupsFilter): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters.effectiveDate) {
      chips.push({
        key:   'effectiveDate',
        label: `Eff Date: ${filters.effectiveDatePeriod ?? ''} ${this.formatDate(filters.effectiveDate)}`,
        value: filters.effectiveDate,
        removable: true,
      });
    }
    if (filters.terminationDate) {
      chips.push({
        key:   'terminationDate',
        label: `Term Date: ${filters.terminationDatePeriod ?? ''} ${this.formatDate(filters.terminationDate)}`,
        value: filters.terminationDate,
        removable: true,
      });
    }
    return chips;
  }

  private formatDate(d: Date | null | undefined): string {
    if (!d) return '';
    const date = new Date(d);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${String(date.getDate()).padStart(2,'0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  /* ── Panel ── */
  openPanel(mode: PanelMode, group: AntigenGroupOption | null, row: AntigenGroupRow | null): void {
    this.panelMode     = mode;
    this.selectedGroup = group;
    this.editRow       = row;
    this.panelOpen     = true;
  }

  onEditGroup(): void {
    if (!this.retrievedGroup) return;
    if (this.pageIndex === 0) {
      this.openPanel('editGroup', this.retrievedGroup, null);
      return;
    }
    this.pageIndex = 0;
    this.fetchPage(() => this.openPanel('editGroup', this.retrievedGroup!, null));
  }

  onEditRow(row: AntigenGroupRow): void {
    this.openPanel('editRow', this.retrievedGroup, row);
  }

  closePanel(): void {
    this.panelOpen    = false;
    this.editRow      = null;
    this.selectedGroup = this.retrievedGroup;
  }

  onSaveSuccess(): void {
    this.loadFilterOptions();
    if (this.hasRetrieved()) {
      this.fetchPage();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.panelOpen) this.closePanel();
  }
}
