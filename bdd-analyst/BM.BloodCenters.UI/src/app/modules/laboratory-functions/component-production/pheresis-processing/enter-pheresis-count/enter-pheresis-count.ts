import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectorRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

import { PheresisCountService } from './services/pheresis-count.service';
import {
  PheresisCountRow,
  UpdateComponentCountRequestDto,
} from './models/pheresis-count.model';

@Component({
  selector: 'app-enter-pheresis-count',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './enter-pheresis-count.html',
  styleUrls: ['./enter-pheresis-count.scss'],
})
export class EnterPheresisCountComponent implements OnInit, OnDestroy, AfterViewInit {
  private static nextId = 0;
  protected readonly componentId = `enter-pheresis-count-${EnterPheresisCountComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PheresisCountService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchPerformed = signal<boolean>(false);
  protected readonly editMode = signal<boolean>(false);
  protected readonly totalRecords = signal<number>(0);
  protected readonly today = moment().startOf('day');

  currentSortOrder: 'ASC' | 'DESC' = 'DESC';
  currentSearchKeyword = '';
  collectionDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getCollectionDateError()
  );

  private allRows: PheresisCountRow[] = [];
  private originalSnapshots = new Map<string, number | null>();

  dataSource = new MatTableDataSource<PheresisCountRow>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  protected readonly isEmpty = computed(() => this.totalRecords() === 0);
  protected readonly hasResults = computed(() => this.searchPerformed() && !this.isEmpty());
  protected readonly showEmptyState = computed(() => this.searchPerformed() && this.isEmpty());
  protected readonly allLabeled = signal<boolean>(false);

  form!: FormGroup;

  displayedColumns: string[] = [
    'unitId',
    'productCode',
    'productDescription',
    'labeled',
    'cellCount',
  ];

  pageSize = 25;
  pageSizeOptions = [10, 25, 50, 100];

  searchConfig: SearchBarConfig = {
    placeholder: 'Search',
    minLength: 3,
    ariaLabel: 'Search pheresis components by Unit ID',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    this.dataSource.filterPredicate = (data: PheresisCountRow, filter: string) => {
      const term = filter.trim().toLowerCase();
      return (
        data.unitId.toLowerCase().includes(term) ||
        data.productCode.toLowerCase().includes(term) ||
        data.productDescription.toLowerCase().includes(term)
      );
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      collectionDate: [null, [
        Validators.required,
        dateFormatValidator(),
        DateFieldValidationUtility.validDateValidator(),
      ]],
    });
  }

  get f() {
    return this.form.controls;
  }

  getCollectionDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.form.get('collectionDate'),
      this.form.errors,
      'Collection Date'
    );
  }

  onCollectionDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('collectionDate');
    if (!control) return;

    const inputValue = input.value?.trim();

    if (!inputValue) {
      control.setValue(null, { emitEvent: false });
      control.markAsTouched();
      control.setErrors({ required: true });
    } else {
      control.markAsTouched();
      control.markAsDirty();
      if (!control.value) {
        control.setErrors({ invalidDate: true });
      }
    }
  }

  onCollectionDateChange(): void {
    this.error.set(null);
    const control = this.form.get('collectionDate');
    if (control?.value) {
      control.setErrors(null);
      control.updateValueAndValidity();
    }
  }

  onRetrieve(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const collectionDate = this.form.get('collectionDate')?.value as Moment;
    const formattedDate = collectionDate.format('YYYY-MM-DD');
    const currentSkip = this.paginator ? this.paginator.pageIndex * this.paginator.pageSize : 0;
    const currentTake = this.paginator ? this.paginator.pageSize : this.pageSize;

    this.loading.set(true);
    this.error.set(null);
    this.editMode.set(false);
    this.allRows = [];
    this.dataSource.data = [];

    this.service.getComponentsByCollectionDate(currentTake, currentSkip, formattedDate, this.currentSortOrder, this.currentSearchKeyword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.searchPerformed.set(true);
          this.loading.set(false);
          this.totalRecords.set(result.total);

          if (result.data.length === 0) {
            this.allRows = [];
            this.dataSource.data = [];
            this.cdr.detectChanges();
            return;
          }

          this.allRows = result.data.map(dto => ({
            unitId: dto.unitId,
            collDate: dto.collDate,
            productCode: dto.productCode,
            productDescription: dto.productDescription,
            collectionDateDisplay: this.formatDate(dto.collDate),
            cellCount: dto.componentCount,
            isLabeled: dto.componentLabeled === 'Y',
            originalCount: dto.componentCount,
          }));

          this.allLabeled.set(this.allRows.length > 0 && this.allRows.every(r => r.isLabeled));
          this.dataSource.data = this.allRows;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading.set(false);
          this.searchPerformed.set(true);
          const errorCode = err?.error?.errorCode;
          const apiMessage = err?.error?.message || 'Failed to load components.';
          const message = errorCode ? `Error ${errorCode}: ${apiMessage}` : apiMessage;
          this.error.set(message);
          this.snackbarService.showError(message);
          this.cdr.detectChanges();
        },
      });
  }

  onPageChange(): void {
    if (this.searchPerformed()) {
      this.onRetrieve();
    }
  }

  toggleSort(): void {
    this.currentSortOrder = this.currentSortOrder === 'DESC' ? 'ASC' : 'DESC';
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    if (this.searchPerformed()) {
      this.onRetrieve();
    }
  }

  getSortIcon(): string {
    return this.currentSortOrder === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  onClear(): void {
    this.form.reset();
    this.allRows = [];
    this.dataSource.data = [];
    this.searchPerformed.set(false);
    this.editMode.set(false);
    this.error.set(null);
    this.totalRecords.set(0);
    this.allLabeled.set(false);
    this.originalSnapshots.clear();
    this.cdr.detectChanges();
  }

  enterEditMode(): void {
    this.originalSnapshots.clear();
    for (const row of this.allRows) {
      this.originalSnapshots.set(row.unitId, row.cellCount);
    }
    this.editMode.set(true);
    this.dataSource.data = [...this.allRows];
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    for (const row of this.allRows) {
      if (this.originalSnapshots.has(row.unitId)) {
        row.cellCount = this.originalSnapshots.get(row.unitId)!;
      }
      row.error = undefined;
    }
    this.originalSnapshots.clear();
    this.editMode.set(false);
    this.dataSource.data = [...this.allRows];
    this.cdr.detectChanges();
  }

  saveAll(): void {
    const changedRows = this.allRows.filter(
      row => !row.isLabeled && row.cellCount !== this.originalSnapshots.get(row.unitId)
    );

    if (changedRows.length === 0) {
      this.editMode.set(false);
      return;
    }

    for (const row of changedRows) {
      if (row.cellCount !== null && row.cellCount !== undefined) {
        if (row.cellCount < 0 || row.cellCount > 999) {
          row.error = 'Cell count must be between 0 and 999';
          this.cdr.detectChanges();
          return;
        }
        if (row.cellCount.toString().length > 3) {
          row.error = 'Error 1707: Component count exceeds 3 digits';
          this.snackbarService.showError(row.error);
          this.cdr.detectChanges();
          return;
        }
      }
    }

    this.saving.set(true);

    const requests: UpdateComponentCountRequestDto[] = changedRows.map(row => ({
      unitId: row.unitId,
      collDate: row.collDate,
      productCode: row.productCode,
      componentCount: row.cellCount,
    }));

    this.service.updateComponentCounts(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.saving.set(false);
          if (response.success) {
            this.editMode.set(false);
            for (const row of this.allRows) {
              row.originalCount = row.cellCount;
            }
            this.originalSnapshots.clear();
            this.dataSource.data = [...this.allRows];
            this.snackbarService.showSuccess(response.message || 'All changes has been saved');
          } else if (response.errorCode === '9789') {
            const failedRow = changedRows.find(r => r.unitId === response.unitId);
            this.showCmcoDialog(failedRow?.productCode || '');
          } else {
            const failedUnitId = response.unitId;
            const failedRow = changedRows.find(r => r.unitId === failedUnitId);
            const errorCode = response.errorCode;
            const apiMessage = response.message || 'Failed to update component count.';
            const errorMsg = errorCode ? `Error ${errorCode}: ${apiMessage}` : apiMessage;
            if (failedRow) {
              failedRow.error = errorMsg;
            }
            this.snackbarService.showError(errorMsg);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving.set(false);
          const errorCode = err?.error?.errorCode;
          const apiMessage = err?.error?.message || 'Failed to update component counts.';
          const errorMessage = errorCode ? `Error ${errorCode}: ${apiMessage}` : apiMessage;
          this.snackbarService.showError(errorMessage);
          this.cdr.detectChanges();
        },
      });
  }

  onSearchFilter(searchTerm: string): void {
    this.dataSource.filter = searchTerm.trim().toLowerCase();
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  onSearchCleared(): void {
    this.dataSource.filter = '';
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if ([8, 9, 27, 13, 46].indexOf(charCode) !== -1) {
      return true;
    }
    if ((charCode === 65 || charCode === 67 || charCode === 86 || charCode === 88) &&
        (event.ctrlKey === true || event.metaKey === true)) {
      return true;
    }
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPasteNumbers(event: ClipboardEvent, row: PheresisCountRow): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '');

    if (numericOnly) {
      const numValue = parseInt(numericOnly, 10);
      if (numValue <= 999) {
        row.cellCount = numValue;
      }
    }
    this.cdr.detectChanges();
  }

  private formatDate(dateString: string): string {
    return DateFieldValidationUtility.formatDateForUI(moment(dateString)) || dateString;
  }

  onCellCountBlur(row: PheresisCountRow): void {
    if (row.cellCount === null || row.cellCount === undefined) return;
    if (row.cellCount === this.originalSnapshots.get(row.unitId)) return;
    if (row.cellCount < 0 || row.cellCount > 999) return;

    this.service.validateCount(row.productCode, row.unitId, row.cellCount)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (!response.success && response.errorCode === '9789') {
            this.showCmcoDialog(row.productCode);
          }
        },
      });
  }

  private showCmcoDialog(productCode: string): void {
    this.dialog.open(CmcoInfoDialog, {
      width: '420px',
      data: { productCode },
      autoFocus: false,
      panelClass: 'cmco-dialog',
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
      });
  }
}

@Component({
  selector: 'app-cmco-info-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title class="cmco-title">Cell Count Mismatch</h2>
    <mat-dialog-content class="cmco-content">
      <p><strong>Warning:</strong> The cell count you entered is lower than the standard
      value defined in Product Codes ({{ data.productCode }}).</p>
      <p><strong>Interdiction Code:</strong> CMCO (Cell Minimum Count)</p>
      <p>Would you like to override this requirement and continue?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="cmco-actions">
      <button mat-raised-button class="cmco-close-btn" [mat-dialog-close]="true">CLOSE</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .cmco-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
      padding: 24px 24px 12px;
    }
    .cmco-content {
      padding: 0 24px;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }
    .cmco-content p {
      margin: 0 0 12px;
    }
    .cmco-actions {
      padding: 8px 16px 16px;
    }
    .cmco-close-btn {
      background-color: #228189 !important;
      color: #ffffff !important;
      font-weight: 500;
      font-size: 14px;
      min-width: 64px;
      border-radius: 4px;
    }
  `],
})
export class CmcoInfoDialog {
  data = inject<{ productCode: string }>(MAT_DIALOG_DATA);
}
