import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  TemplateRef,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { of, Subject } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { AntigenResultEntryService } from './services/antigen-result-entry.service';
import {
  PendingUnitDto,
  ValidResultDto,
  WorksheetOptionDto,
  TestResultRow,
  UnitDisplayModel,
  UnitTestDto,
  SubmitResultsRequestDto,
  SubmitResultsResponseDto,
  AntigenResultEntryDto,
} from './models/antigen-result-entry.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn, TableSortEvent } from '@shared/interfaces/data-table.interface';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

@Component({
  selector: 'app-ag',
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
    MatDialogModule,
    MatListModule,
    MatSnackBarModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    DataTable,
  ],
  templateUrl: './ag.component.html',
  styleUrls: ['./ag.component.scss'],
})
export class AgComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('resultTemplate') resultTemplate!: TemplateRef<any>;

  private static nextId = 0;
  protected readonly componentId = `ag-${AgComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  protected headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  private readonly fb = inject(FormBuilder);
  private readonly agService = inject(AntigenResultEntryService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);

  private readonly headerEffect = effect(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    if (pageData) {
      this.headerConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null },
        ],
        title: pageData.title,
        subtitle: pageData.subtitle || '',
      };
    }
  });

  private readonly destroy$ = new Subject<void>();

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by unit ID',
    minLength: 1,
    ariaLabel: 'Search units by ID',
    debounceTime: 300,
    searchOnEnterOnly: false,
  };

  tableConfig!: DataTableConfig<TestResultRow>;

  // Worksheet dropdown
  protected readonly worksheetOptions = signal<WorksheetOptionDto[]>([]);
  protected readonly worksheetSearchControl = new FormControl('');
  protected readonly worksheetSearch = signal('');
  protected isLoadingWorksheets = false;
  protected isWorksheetTruncated = false;

  // Result dropdown search
  protected readonly resultSearchControl = new FormControl('');
  protected readonly resultSearch = signal('');

  protected filterResults(results: ValidResultDto[]): ValidResultDto[] {
    if (!results || results.length === 0) return [];
    const search = this.resultSearch().toLowerCase();
    if (!search) return results;
    return results.filter(r =>
      r.code.toLowerCase().includes(search) ||
      r.description.toLowerCase().includes(search)
    );
  }

  protected readonly filteredWorksheets = computed(() => {
    const search = this.worksheetSearch().toLowerCase();
    const options = this.worksheetOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.tbId || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  private readonly worksheetIdValue = signal<string | null>(null);

  protected readonly selectedWorksheetDisplay = computed(() => {
    const id = this.worksheetIdValue();
    if (!id) return '';
    const opt = this.worksheetOptions().find(o => o.tbId === id);
    return opt?.description ? `${opt.tbId} - ${opt.description}` : id;
  });

  // Signal-based state
  protected readonly worksheetId = signal<string | null>(null);
  protected readonly pendingUnits = signal<PendingUnitDto[]>([]);
  protected readonly selectedUnit = signal<UnitDisplayModel | null>(null);
  protected readonly testResults = signal<TestResultRow[]>([]);
  protected readonly validResults = signal<ValidResultDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingUnits = signal<boolean>(false);
  protected readonly loadingTests = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly searchTerm = signal<string>('');
  protected readonly hasChanges = signal<boolean>(false);
  protected readonly saved = signal<boolean>(false);
  protected readonly worksheetError = signal<string | null>(null);
  protected readonly reagentLot = signal<string>('');

  protected readonly units = computed<UnitDisplayModel[]>(() => {
    const pending = this.pendingUnits();
    return pending.map((unit) => ({
      unitId: unit.unitId,
      displayText: unit.unitId,
      collectionDate: this.formatDate(unit.collDate),
      tests: [],
      isSelected: this.selectedUnit()?.unitId === unit.unitId,
    }));
  });

  protected readonly filteredUnits = computed<UnitDisplayModel[]>(() => {
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) {
      return this.units();
    }
    return this.units().filter((unit) =>
      unit.displayText.toLowerCase().includes(search)
    );
  });

  protected readonly isEmpty = computed(() => this.units().length === 0);

  protected readonly canSave = computed(() => {
    return (
      !this.saving() &&
      !this.saved() &&
      this.testResults().some((row) => row.resultStatus1 !== null)
    );
  });

  protected readonly canCloseWorksheet = computed(() => {
    return this.worksheetId() !== null && !this.saving();
  });

  worksheetForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadWorksheets();

    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.onClearWorksheet();
      this.loadWorksheets();
    });

    this.worksheetSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.worksheetSearch.set(val || ''));

    this.resultSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.resultSearch.set(val || ''));
  }

  ngAfterViewInit(): void {
    this.initTableConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.worksheetForm = this.fb.group({
      worksheetId: ['', [Validators.required]],
    });
  }

  private initTableConfig(): void {
    const columns: TableColumn<TestResultRow>[] = [
      {
        key: 'testId',
        header: 'Test ID',
        sortable: true,
        type: 'text',
        width: '100px',
      },
      {
        key: 'resultStatus1',
        header: 'Result',
        sortable: false,
        type: 'custom',
        width: '220px',
        cellTemplate: this.resultTemplate,
      },
      {
        key: 'resultDescription',
        header: 'Result Description',
        sortable: false,
        type: 'text',
        minWidth: '200px',
      },
    ];

    this.tableConfig = {
      columns,
      stickyHeader: true,
      emptyMessage: 'No test results available',
      showPagination: false,
      enableRowHighlight: false,
      sortConfig: {
        column: 'testId',
        direction: 'A',
      },
    };
  }

  private loadWorksheets(): void {
    this.isLoadingWorksheets = true;
    this.agService
      .getWorksheets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (worksheets) => {
          this.worksheetOptions.set(worksheets ?? []);
          this.isLoadingWorksheets = false;
        },
        error: (err) => {
          this.snackbarService.showError(
            err.error?.errorResponse?.error || 'Failed to load worksheets.'
          );
          this.worksheetOptions.set([]);
          this.isLoadingWorksheets = false;
        },
      });
  }

  onDropdownOpened(opened: boolean): void {
    if (!opened) {
      this.worksheetSearchControl.setValue('');
    }
  }

  checkWorksheetTruncation(el: HTMLElement): void {
    this.isWorksheetTruncated = el.scrollWidth > el.clientWidth;
  }

  onWorksheetSelect(tbId: string): void {
    this.worksheetIdValue.set(tbId);
    if (!tbId) {
      return;
    }

    this.worksheetError.set(null);
    this.loading.set(true);

    this.agService
      .validateWorksheet(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.worksheetId.set(tbId);
          this.loadPendingUnits(tbId);
        },
        error: (err) => {
          this.loading.set(false);
          const errorMsg =
            err.error?.errorResponse?.error ||
            'Invalid worksheet or no pending antigen tests.';
          this.worksheetError.set(errorMsg);
        },
      });
  }

  onWorksheetChange(): void {
    const worksheetId = this.worksheetForm.get('worksheetId')?.value?.trim();
    if (!worksheetId) {
      return;
    }
    this.onWorksheetSelect(worksheetId);
  }

  private loadPendingUnits(tbId: string): void {
    this.loadingUnits.set(true);

    this.agService
      .getPendingUnits(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.pendingUnits.set(units);
          this.loading.set(false);
          this.loadingUnits.set(false);

          if (this.units().length > 0) {
            this.onUnitSelect(this.units()[0]);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.loadingUnits.set(false);
          this.snackbarService.showError(
            err.error?.errorResponse?.error || 'Failed to load pending units.'
          );
        },
      });
  }

  onUnitSelect(unit: UnitDisplayModel): void {
    this.selectedUnit.set(unit);
    this.testResults.set([]);
    this.hasChanges.set(false);
    this.saved.set(false);

    const tbId = this.worksheetId();
    if (!tbId) return;

    this.loadingTests.set(true);

    this.agService
      .getUnitTests(tbId, unit.unitId)
      .pipe(
        switchMap((tests) => {
          if (tests.length > 0 && this.validResults().length === 0) {
            return this.agService.getValidResults(tests[0].testId).pipe(
              tap((validResults) => {
                this.validResults.set(Array.isArray(validResults) ? validResults : []);
              }),
              map(() => tests),
              catchError((err) => {
                this.snackbarService.showError(
                  err.error?.errorResponse?.error || 'Failed to load valid results.'
                );
                return of(tests);
              })
            );
          }
          return of(tests);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (tests) => {
          const currentValidResults = this.validResults() ?? [];
          const results: TestResultRow[] = tests.map((test) => ({
            unitId: unit.unitId,
            testId: test.testId,
            testSeqNo: test.testSeqNo,
            resultStatus1: test.resultStatus1,
            resultDescription: this.getResultDescription(test.resultStatus1),
            reagentLot1: test.reagentLot1 || '',
            isModified: false,
            hasExistingResult: test.resultDats != null,
            validResults: currentValidResults,
          }));

          this.testResults.set(results);
          this.loadingTests.set(false);
          setTimeout(() => {
            document.getElementById(this.elementId('results-heading'))?.focus();
          });
        },
        error: (err) => {
          this.loadingTests.set(false);
          this.snackbarService.showError(
            err.error?.errorResponse?.error || 'Failed to load tests for unit.'
          );
        },
      });
  }

  onResultChange(row: TestResultRow, resultCode: string): void {
    const updated = this.testResults().map((r) =>
      r.testId === row.testId
        ? {
            ...r,
            resultStatus1: resultCode,
            resultDescription: this.getResultDescription(resultCode),
            isModified: true,
          }
        : r
    );

    this.testResults.set(updated);
    this.hasChanges.set(true);
    this.saved.set(false);
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onUnitKeyNav(event: Event, currentIndex: number, delta: number): void {
    const units = this.filteredUnits();
    const targetIndex = Math.max(0, Math.min(units.length - 1, currentIndex + delta));
    if (targetIndex === currentIndex) return;
    const items = (event.target as HTMLElement)
      .closest('.unit-list')
      ?.querySelectorAll<HTMLElement>('.unit-item');
    items?.[targetIndex]?.focus();
  }

  onResultDropdownOpened(opened: boolean): void {
    if (!opened) {
      this.resultSearchControl.setValue('');
    }
  }

  onSortChange(event: TableSortEvent): void {
    if (!event.column || !event.direction) return;

    const sorted = [...this.testResults()].sort((a, b) => {
      const valA = (a[event.column as keyof TestResultRow] ?? '').toString().toLowerCase();
      const valB = (b[event.column as keyof TestResultRow] ?? '').toString().toLowerCase();
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    });

    this.testResults.set(sorted);
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
  }

  private getResultDescription(code: string | null): string {
    if (!code) return '';
    const result = this.validResults().find((r) => r.code === code);
    return result?.description || '';
  }

  onClearWorksheet(): void {
    this.worksheetForm.reset();
    this.worksheetId.set(null);
    this.worksheetIdValue.set(null);
    this.pendingUnits.set([]);
    this.selectedUnit.set(null);
    this.testResults.set([]);
    this.hasChanges.set(false);
    this.saved.set(false);
    this.worksheetError.set(null);
    this.reagentLot.set('');
    this.searchTerm.set('');
    this.worksheetSearchControl.setValue('');
  }

  onClearAll(): void {
    const cleared = this.testResults().map((r) =>
      r.hasExistingResult
        ? r
        : { ...r, resultStatus1: null, resultDescription: '', isModified: false }
    );

    this.testResults.set(cleared);
    this.hasChanges.set(false);
    this.saved.set(false);
  }

  onCancel(): void {
    this.onClearWorksheet();
  }

  onSave(): void {
    if (!this.canSave()) {
      return;
    }

    const tbId = this.worksheetId();
    if (!tbId) {
      return;
    }

    const results: AntigenResultEntryDto[] = this.testResults()
      .filter((r) => r.resultStatus1 !== null && r.isModified)
      .map((r) => ({
        unitId: r.unitId,
        testId: r.testId,
        resultStatus1: r.resultStatus1!,
        reagentLot1: r.reagentLot1,
      }));

    if (results.length === 0) {
      this.snackbarService.showError(
        'No test results to save. Please enter at least one result.'
      );
      return;
    }

    const request: SubmitResultsRequestDto = {
      tbId,
      results,
    };

    this.saving.set(true);

    this.agService
      .submitResults(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SubmitResultsResponseDto) => {
          this.saving.set(false);
          this.hasChanges.set(false);
          this.saved.set(true);

          if (response.moveWarnings?.length) {
            this.showWarning(response.moveWarnings.join('; '));
          } else if (response.resultsSkipped > 0) {
            this.snackbarService.showInfo(
              `Worksheet ${tbId} saved successfully. ${response.resultsSkipped} result(s) were skipped (already entered).`
            );
          } else {
            this.snackbarService.showSuccess(
              `Worksheet ${tbId} saved successfully.`
            );
          }

          this.loadPendingUnits(tbId);
        },
        error: (err) => {
          this.saving.set(false);
          const errorMsg =
            err.error?.errorResponse?.error ||
            'Failed to save results. Please try again.';
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  onSaveAndCloseWorksheet(): void {
    if (!this.canCloseWorksheet()) {
      return;
    }

    const tbId = this.worksheetId()!;

    this.agService
      .getPendingCount(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (countInfo) => {
          const pendingCount = countInfo?.pendingCount ?? 0;
          const message = pendingCount > 0
            ? `${pendingCount} unit(s) without results will be automatically marked as 'NT'. You can keep the worksheet open and complete the remaining entries later.`
            : "Units without results will be automatically marked as 'NT'. You can keep the worksheet open and complete the remaining entries later.";

          this.openCloseConfirmationDialog(message);
        },
        error: () => {
          this.openCloseConfirmationDialog(
            "Units without results will be automatically marked as 'NT'. You can keep the worksheet open and complete the remaining entries later."
          );
        },
      });
  }

  private openCloseConfirmationDialog(message: string): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Are you sure you want to close the worksheet?',
      message,
      confirmText: 'CLOSE WORKSHEET',
      cancelText: 'KEEP WORKSHEET OPEN',
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      panelClass: 'ag-confirm-dialog',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.closeWorksheet();
      }
    });
  }

  private closeWorksheet(): void {
    const tbId = this.worksheetId();
    if (!tbId) {
      return;
    }

    this.saving.set(true);

    this.agService
      .closeWorksheet(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving.set(false);

          if (response.moveWarnings?.length) {
            this.showWarning(
              `Worksheet ${tbId} closed. ${response.moveWarnings.join('; ')}`
            );
          } else {
            this.snackbarService.showSuccess(
              `Worksheet ${tbId} closed successfully.`
            );
          }

          this.onClearWorksheet();
          this.loadWorksheets();
        },
        error: (err) => {
          this.saving.set(false);
          const errorMsg =
            err.error?.errorResponse?.error ||
            'Failed to close worksheet. Please try again.';
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  private formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private showWarning(message: string): void {
    this.snackBar.dismiss();
    const ref = this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: 10000,
      panelClass: ['warning-snackbar'],
    });
    ref.onAction().subscribe(() => ref.dismiss());
  }

  get f() {
    return this.worksheetForm.controls;
  }
}
