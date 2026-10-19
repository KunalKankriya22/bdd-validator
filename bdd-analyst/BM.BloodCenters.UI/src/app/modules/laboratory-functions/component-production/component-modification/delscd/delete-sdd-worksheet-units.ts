import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, takeUntil } from 'rxjs';

import { SddWorksheetUnitsApiService } from './services/sdd-worksheet-units-api.service';
import { SddWorksheetLookupDto, SddWorksheetUnitDto } from './models/sdd-worksheet-units.model';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';

/**
 * Delete Units from SDD Worksheet Component
 * Mnemonic: DELSCD
 */
@Component({
  selector: 'app-delete-sdd-worksheet-units',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './delete-sdd-worksheet-units.html',
  styleUrls: ['./delete-sdd-worksheet-units.scss']
})
export class DeleteSddWorksheetUnitsComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(SddWorksheetUnitsApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);

  // ── Searchable dropdown ────────────────────────────────────────
  worksheetIdControl = new FormControl<string>('');
  allWorksheets: SddWorksheetLookupDto[] = [];
  filteredWorksheets: SddWorksheetLookupDto[] = [];

  // ── State signals ──────────────────────────────────────────────
  protected readonly units = signal<SddWorksheetUnitDto[]>([]);
  protected readonly totalCount = signal<number>(0);
  protected readonly loadingWorksheets = signal<boolean>(false);
  protected readonly loadingUnits = signal<boolean>(false);
  protected readonly deleting = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedWorksheet = signal<string | null>(null);
  protected readonly selectedCount = signal<number>(0);

  // ── Sort ───────────────────────────────────────────────────────
  protected readonly unitIdSortDir = signal<'asc' | 'desc'>('asc');

  // ── Computed ───────────────────────────────────────────────────
  protected readonly hasUnits = computed(() => this.units().length > 0);

  // ── Page header ────────────────────────────────────────────────
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Delete Units from SCD Worksheet', link: null }
    ],
    title: 'Delete Units from SCD Worksheet'
  };

  constructor() {
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
          subtitle: pageData.subtitle ?? ''
        };
      }
    });
  }

  // ── Selection ──────────────────────────────────────────────────
  selection = new SelectionModel<SddWorksheetUnitDto>(true, []);

  // ── Pagination ─────────────────────────────────────────────────
  protected readonly pageSize = signal<number>(25);
  protected readonly pageIndex = signal<number>(0);
  protected readonly pageSizeOptions = [10, 25, 50];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadWorksheets();
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetState();
        this.loadWorksheets();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Reset all state ────────────────────────────────────────────
  private resetState(): void {
    this.worksheetIdControl.setValue('', { emitEvent: false });
    this.allWorksheets = [];
    this.filteredWorksheets = [];
    this.units.set([]);
    this.totalCount.set(0);
    this.selectedWorksheet.set(null);
    this.pageIndex.set(0);
    this.error.set(null);
    this.clearSelection();
  }

  // ── Worksheet list ─────────────────────────────────────────────
  protected loadWorksheets(): void {
    this.loadingWorksheets.set(true);
    this.error.set(null);

    this.apiService
      .getWorksheets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allWorksheets = data;
          this.filteredWorksheets = data;
          this.loadingWorksheets.set(false);
        },
        error: () => {
          this.error.set('Failed to load worksheets. Please try again.');
          this.loadingWorksheets.set(false);
        }
      });
  }

  // ── Autocomplete filter on keypress ───────────────────────────
  filterWorksheets(event: Event): void {
    const value = (event.target as HTMLInputElement).value?.toUpperCase() || '';
    this.filteredWorksheets = this.allWorksheets.filter((w) =>
      w.sdcWsNumber.toUpperCase().includes(value)
    );
  }

  // ── Option selected from autocomplete ─────────────────────────
  onWorksheetSelected(event: MatAutocompleteSelectedEvent): void {
    const worksheetId = event.option.value as string;
    this.worksheetIdControl.setValue(worksheetId, { emitEvent: false });
    this.selectedWorksheet.set(worksheetId);
    this.clearSelection();
    this.pageIndex.set(0);
    this.loadUnits(worksheetId, this.pageSize(), 0);
  }

  // ── Load units (server-side pagination) ───────────────────────
  private loadUnits(worksheetId: string, take: number, skip: number): void {
    if (!worksheetId) {
      this.units.set([]);
      this.totalCount.set(0);
      return;
    }

    this.loadingUnits.set(true);
    this.error.set(null);

    this.apiService
      .getUnits(worksheetId, take, skip, this.unitIdSortDir())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ items, totalCount }) => {
          this.units.set(items);
          this.totalCount.set(totalCount);
          this.loadingUnits.set(false);
        },
        error: () => {
          this.error.set('Failed to load units. Please try again.');
          this.loadingUnits.set(false);
        }
      });
  }

  // ── Paginator page change → new server request ─────────────────
  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.clearSelection();

    const worksheetId = this.selectedWorksheet();
    if (worksheetId) {
      this.loadUnits(worksheetId, event.pageSize, event.pageIndex * event.pageSize);
    }
  }

  // ── Checkbox helpers ───────────────────────────────────────────
  isAllSelected(): boolean {
    const numRows = this.units().length;
    return this.selection.selected.length === numRows && numRows > 0;
  }

  isIndeterminate(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.units().length;
    return numSelected > 0 && numSelected < numRows;
  }

  toggleRow(unit: SddWorksheetUnitDto): void {
    this.selection.toggle(unit);
    this.selectedCount.set(this.selection.selected.length);
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.units().forEach((unit) => this.selection.select(unit));
    }
    this.selectedCount.set(this.selection.selected.length);
  }

  private clearSelection(): void {
    this.selection.clear();
    this.selectedCount.set(0);
  }

  // ── Delete ─────────────────────────────────────────────────────
  openDeleteConfirmation(): void {
    const worksheetId = this.selectedWorksheet();
    if (this.selectedCount() === 0 || !worksheetId) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '460px',
      disableClose: false,
      data: {
        title: 'Are you sure you want to delete the selected units?',
        message: 'This action cannot be undone. The record(s) will be permanently removed from the system.',
        confirmText: 'Delete Selection',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed === true) this.deleteSelectedUnits();
    });
  }

  private deleteSelectedUnits(): void {
    const selectedUnits = this.selection.selected;
    const worksheetId = this.selectedWorksheet();
    if (selectedUnits.length === 0 || !worksheetId) return;

    this.deleting.set(true);
    this.error.set(null);

    this.apiService
      .deleteUnits({ sdcWsNumber: worksheetId, unitIds: selectedUnits.map((u) => u.unitId) })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const count = response.deletedCount;
          this.snackbarService.showSuccess(`${count} unit${count !== 1 ? 's' : ''} deleted successfully.`);
          this.clearSelection();
          this.loadUnits(worksheetId, this.pageSize(), this.pageIndex() * this.pageSize());
          this.deleting.set(false);
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Failed to delete units. Please try again.';
          this.snackbarService.showError(errorMessage);
          this.deleting.set(false);
        }
      });
  }

  // ── Sort toggle ────────────────────────────────────────────────
  toggleUnitIdSort(): void {
    this.unitIdSortDir.update(dir => dir === 'asc' ? 'desc' : 'asc');
    const worksheetId = this.selectedWorksheet();
    if (worksheetId) {
      this.pageIndex.set(0);
      this.loadUnits(worksheetId, this.pageSize(), 0);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────
  formatDate(date: string | null): string {
    if (!date) return '';
    return date.toUpperCase();
  }

  parseUnitCount(unitCount: string): string {
    return parseInt(unitCount, 10).toString();
  }

}
