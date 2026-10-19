import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { PageEvent } from '@angular/material/paginator';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin, of, takeUntil, catchError } from 'rxjs';
import moment from 'moment';

import { EquipmentQcFilterPanelComponent } from './components/equipment-qc-filter-panel/equipment-qc-filter-panel.component';
import { EquipmentQcTableComponent } from './components/equipment-qc-table/equipment-qc-table.component';
import { EquipmentQcDataService } from './services/equipment-qc-data.service';
import {
  EquipmentQcFilterCriteria,
  EquipmentQcRow,
  EquipmentQcDataRequest,
  EquipmentQcMasterData,
  SaveEquipmentQcDataRequest,
  ReviewRequired,
  QcPeriodOption,
  YesNoOption,
  YES_NO_OPTIONS
} from './models/equipment-qc-data.model';
import { headerDateRangeValidator, termDateNotInPastValidator } from './validators/min-target-max.validator';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PaginationConfig } from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-maintain-valid-equipment-qc-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    EquipmentQcFilterPanelComponent,
    EquipmentQcTableComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './maintain-valid-equipment-qc-data.component.html',
  styleUrl: './maintain-valid-equipment-qc-data.component.scss'
})
export class MaintainValidEquipmentQcDataComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `maintain-valid-equipment-qc-data-${MaintainValidEquipmentQcDataComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly equipmentQcDataService = inject(EquipmentQcDataService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(EquipmentQcTableComponent) tableComponent?: EquipmentQcTableComponent;

  protected readonly equipmentQcData = signal<EquipmentQcRow[]>([]);
  protected readonly totalRecords = signal<number>(0);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dataLoaded = signal<boolean>(false);
  protected readonly currentFilter = signal<EquipmentQcFilterCriteria | null>(null);
  protected readonly currentQcId = signal<string | null>(null);
  protected readonly reviewRequiredOptions = signal<ReviewRequired[]>([]);
  protected readonly qcPeriodOptions = signal<QcPeriodOption[]>([]);
  protected readonly yesNoOptions = signal<YesNoOption[]>(YES_NO_OPTIONS);

  protected readonly reviewRequiredSearchCtrl = new FormControl('');
  protected readonly qcPeriodSearchCtrl = new FormControl('');
  private readonly reviewRequiredSearch = signal('');
  private readonly qcPeriodSearch = signal('');
  private readonly selectedReviewRequiredCode = signal<string | null>(null);
  private readonly selectedQcPeriodCode = signal<string | null>(null);

  protected readonly filteredReviewRequiredOptions = computed(() => {
    const search = this.reviewRequiredSearch().toLowerCase();
    const options = this.reviewRequiredOptions();
    return search ? options.filter(o => o.code.toLowerCase().includes(search)) : options;
  });

  protected readonly filteredQcPeriodOptions = computed(() => {
    const search = this.qcPeriodSearch().toLowerCase();
    const options = this.qcPeriodOptions();
    return search ? options.filter(o => o.code.toLowerCase().includes(search)) : options;
  });

  protected readonly selectedReviewRequiredDesc = computed(() => {
    const code = this.selectedReviewRequiredCode();
    if (!code) return '-';
    const option = this.reviewRequiredOptions().find(o => o.code === code);
    return option?.codeDesc || '-';
  });

  protected readonly selectedQcPeriodDesc = computed(() => {
    const code = this.selectedQcPeriodCode();
    if (!code) return '-';
    const option = this.qcPeriodOptions().find(o => o.code === code);
    return option?.codeDesc || '-';
  });

  masterForm!: FormGroup;

  protected paginationConfig: PaginationConfig = {
    pageSize: 10,
    pageIndex: 0,
    totalRecords: 0,
    pageSizeOptions: [10, 25, 50, 100],
    showFirstLastButtons: true
  };
  private savedPagination = { pageSize: 10, pageIndex: 0 };

  canDeactivate(): boolean {
    if (!this.tableComponent) return true;
    return !this.tableComponent.hasUnsavedChanges() && !this.masterForm?.dirty;
  }

  ngOnInit(): void {
    this.initMasterForm();
    this.loadLookups();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected readonly headerMinTermDate = () => this.chapterTimezoneService.getChapterLocalDate();

  protected getHeaderMinEffDate(): moment.Moment | null {
    return this.currentQcId() ? null : this.chapterTimezoneService.getChapterLocalDate();
  }

  private initMasterForm(): void {
    const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    this.masterForm = this.fb.group({
      reviewRequired: [null, [Validators.required]],
      qcPeriod: [null, [Validators.required]],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null, [termDateNotInPastValidator(chapterDate)]],
      requiredForClarification: [null, [Validators.required]],
      createWorksheet: [null, [Validators.required]]
    }, {
      validators: [headerDateRangeValidator()]
    });
  }

  private setupSearchSubscriptions(): void {
    this.reviewRequiredSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.reviewRequiredSearch.set(value ?? ''));

    this.qcPeriodSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.qcPeriodSearch.set(value ?? ''));

    this.masterForm.get('reviewRequired')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.selectedReviewRequiredCode.set(value));

    this.masterForm.get('qcPeriod')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.selectedQcPeriodCode.set(value));

  }

  private loadLookups(): void {
    forkJoin({
      reviewRequired: this.equipmentQcDataService.getReviewRequired().pipe(
        catchError(() => { this.error.set('Failed to load review required options'); return of([] as ReviewRequired[]); })
      ),
      qcPeriod: this.equipmentQcDataService.getQcPerformedEvery().pipe(
        catchError(() => { this.error.set('Failed to load QC period options'); return of([] as QcPeriodOption[]); })
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.reviewRequiredOptions.set(results.reviewRequired);
      this.qcPeriodOptions.set(results.qcPeriod);
    });
  }

  onRetrieve(criteria: EquipmentQcFilterCriteria): void {
    if (!this.canDeactivate()) {
      this.dialog.open(ConfirmActionDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to retrieve new data?',
          confirmText: 'RETRIEVE',
          cancelText: 'STAY',
        },
      }).afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
        if (confirmed) {
          this.performRetrieve(criteria);
        }
      });
      return;
    }
    this.performRetrieve(criteria);
  }

  private performRetrieve(criteria: EquipmentQcFilterCriteria): void {
    this.currentFilter.set(criteria);
    this.paginationConfig.pageIndex = 0;
    this.loadData(criteria, this.paginationConfig.pageIndex, this.paginationConfig.pageSize);
  }

  onCleared(): void {
    if (!this.canDeactivate()) {
      this.dialog.open(ConfirmActionDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to clear?',
          confirmText: 'CLEAR',
          cancelText: 'STAY',
        },
      }).afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
        if (confirmed) {
          this.performClear();
        }
      });
      return;
    }
    this.performClear();
  }

  private performClear(): void {
    this.dataLoaded.set(false);
    this.equipmentQcData.set([]);
    this.totalRecords.set(0);
    this.masterForm.reset();
    this.currentQcId.set(null);
    this.error.set(null);
  }

  private loadData(criteria: EquipmentQcFilterCriteria, page: number, pageSize: number): void {
    this.loading.set(true);
    this.error.set(null);

    const request: EquipmentQcDataRequest = {
      equipmentType: criteria.equipmentType,
      qcType: criteria.qcType,
      pageNumber: page + 1,
      pageSize: pageSize
    };

    this.equipmentQcDataService.retrieveEquipmentQcData(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response) {
            this.equipmentQcData.set([]);
            this.totalRecords.set(0);
            this.currentQcId.set(null);
            this.populateMasterForm(null as any);
            this.dataLoaded.set(true);
            this.loading.set(false);
            return;
          }
          this.equipmentQcData.set(response.rows);
          this.totalRecords.set(response.totalRecords);
          this.currentQcId.set(response.masterData?.qcId ?? null);
          this.populateMasterForm(response.masterData);
          this.dataLoaded.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          this.handleError('Failed to retrieve equipment QC data', err);
          this.loading.set(false);
        }
      });
  }

  private loadTableRows(criteria: EquipmentQcFilterCriteria, page: number, pageSize: number): void {
    this.loading.set(true);

    const request: EquipmentQcDataRequest = {
      equipmentType: criteria.equipmentType,
      qcType: criteria.qcType,
      pageNumber: page + 1,
      pageSize: pageSize
    };

    this.equipmentQcDataService.retrieveEquipmentQcData(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.equipmentQcData.set(response?.rows ?? []);
          this.totalRecords.set(response?.totalRecords ?? 0);
          this.loading.set(false);
        },
        error: (err) => {
          this.handleError('Failed to retrieve equipment QC data', err);
          this.loading.set(false);
        }
      });
  }

  private populateMasterForm(masterData: EquipmentQcMasterData): void {
    if (!masterData) {
      this.masterForm.patchValue({
        effectiveDate: this.chapterTimezoneService.getChapterLocalDate()
      });
      return;
    }
    this.masterForm.patchValue({
      reviewRequired: masterData.reviewRequired,
      qcPeriod: masterData.qcPeriod,
      effectiveDate: masterData.effectiveDate ? moment(masterData.effectiveDate) : this.chapterTimezoneService.getChapterLocalDate(),
      terminationDate: masterData.terminationDate ? moment(masterData.terminationDate) : null,
      requiredForClarification: masterData.requiredForClarification,
      createWorksheet: masterData.createWorksheet
    });
    this.masterForm.markAsPristine();
    this.masterForm.markAsUntouched();
  }

  onEditModeChanged(isEditMode: boolean): void {
    const criteria = this.currentFilter();
    if (!criteria) return;

    if (isEditMode) {
      this.savedPagination = { pageSize: this.paginationConfig.pageSize, pageIndex: this.paginationConfig.pageIndex };
      this.loadTableRows(criteria, 0, 9999);
    } else {
      this.paginationConfig.pageIndex = this.savedPagination.pageIndex;
      this.paginationConfig.pageSize = this.savedPagination.pageSize;
      this.loadTableRows(criteria, this.paginationConfig.pageIndex, this.paginationConfig.pageSize);
    }
  }

  onPageChange(event: PageEvent): void {
    this.paginationConfig.pageIndex = event.pageIndex;
    this.paginationConfig.pageSize = event.pageSize;

    const criteria = this.currentFilter();
    if (criteria) {
      this.loadData(criteria, this.paginationConfig.pageIndex, this.paginationConfig.pageSize);
    }
  }

  onTableSave(rows: EquipmentQcRow[]): void {
    this.saveAll(rows);
  }

  onCancel(): void {
    const criteria = this.currentFilter();
    if (criteria) {
      this.loadData(criteria, this.paginationConfig.pageIndex, this.paginationConfig.pageSize);
    }
  }

  onSave(): void {
    if (this.masterForm.invalid) {
      this.masterForm.markAllAsTouched();
      return;
    }

    const hasTableChanges = this.tableComponent?.hasUnsavedChanges() ?? false;
    if (!this.masterForm.dirty && !hasTableChanges) {
      this.showError('No changes to save');
      return;
    }

    const tableRows = this.tableComponent
      ? this.tableComponent.rows.controls.map(control => {
          const value = control.value;
          return {
            seqNo: control.get('seqNo')?.value,
            description: value.description,
            units: value.units,
            targetValue: value.targetValue,
            minAccept: value.minAccept,
            maxAccept: value.maxAccept,
            effectiveDate: value.effectiveDate,
            terminationDate: value.terminationDate,
            isNew: value.isNew,
            isModified: control.dirty
          } as EquipmentQcRow;
        })
      : [];

    this.saveAll(tableRows);
  }

  private saveAll(rows: EquipmentQcRow[]): void {
    const criteria = this.currentFilter();
    if (!criteria) {
      this.showError('Cannot save: Equipment Type and QC Type are required');
      return;
    }

    this.loading.set(true);
    const masterValues = this.masterForm.value;

    const request: SaveEquipmentQcDataRequest = {
      equipmentType: criteria.equipmentType,
      qcType: criteria.qcType,
      qcId: this.currentQcId(),
      isNew: !this.currentQcId(),
      reviewRequired: masterValues.reviewRequired,
      frequency: null,
      qcPeriod: masterValues.qcPeriod,
      effectiveDate: masterValues.effectiveDate ? this.formatDateForApi(masterValues.effectiveDate) : null,
      terminationDate: masterValues.terminationDate ? this.formatDateForApi(masterValues.terminationDate) : null,
      requiredForClarification: masterValues.requiredForClarification,
      createWorksheet: masterValues.createWorksheet,
      rows: rows.map(row => ({
        ...row,
        effectiveDate: this.formatDateForApi(row.effectiveDate),
        terminationDate: row.terminationDate ? this.formatDateForApi(row.terminationDate) : null
      }))
    };

    this.equipmentQcDataService.saveEquipmentQcData(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.showSuccess('Equipment QC data saved successfully');
          this.paginationConfig.pageIndex = this.savedPagination.pageIndex;
          this.paginationConfig.pageSize = this.savedPagination.pageSize;
          this.loadData(criteria, this.paginationConfig.pageIndex, this.paginationConfig.pageSize);
        },
        error: (err) => {
          this.handleError('Failed to save equipment QC data', err);
          this.loading.set(false);
        }
      });
  }

  private formatDateForApi(date: string | Date | moment.Moment): string {
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    if (typeof date === 'string') {
      const m = moment(date);
      return m.isValid() ? m.format('YYYY-MM-DD') : date;
    }
    return moment(date).format('YYYY-MM-DD');
  }

  private handleError(message: string, err: unknown): void {
    const errorObj = err as { error?: { message?: string }; message?: string };
    this.error.set(errorObj.error?.message || errorObj.message || message);
    this.showError(message);
  }

  private showSuccess(message: string): void {
    this.snackbarService.showSuccess(message);
  }

  private showError(message: string): void {
    this.snackbarService.showError(message);
  }
}
