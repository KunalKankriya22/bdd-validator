import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef, ChangeDetectorRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, switchMap, EMPTY } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import moment, { Moment } from 'moment';

import { ReportSubmissionService } from './services/report-submission.service';
import { ScheduleDialogComponent } from './schedule-dialog/schedule-dialog';
import {
  ReportSubmissionDetail,
  ReportSubmissionParameter,
  ScheduleDialogData,
  ScheduleDialogResult,
  ParameterOption,
  DropdownFetchFn,
} from './models/report-submission.model';
import { SmartDropdownComponent, DropdownItem } from '@shared/components/smart-dropdown/smart-dropdown';

@Component({
  selector: 'app-report-submission',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SmartDropdownComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './report-submission.html',
  styleUrls: ['./report-submission.scss'],
})
export class ReportSubmissionComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  private readonly reportNameChange$ = new Subject<string>();
  private readonly service = inject(ReportSubmissionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('parameterValueTemplate', { static: false }) parameterValueTemplate!: TemplateRef<any>;
  @ViewChild('promptTemplate', { static: false }) promptTemplate!: TemplateRef<any>;

  headerConfig: PageHeaderConfig = {
    title: 'Report Generator',
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Report Name', link: null },
    ],
  };

  tableConfig: DataTableConfig<ReportSubmissionParameter> = {
    columns: [],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No parameters available',
    showTableOnEmpty: true,
  };

  // Report Type selection
  reportTypes = signal<{ code: string; description: string }[]>([]);
  filteredReportTypes = signal<{ code: string; description: string }[]>([]);
  reportTypeSearchControl = new FormControl('');
  selectedReportType = signal<string>('');

  // Report Name selection
  reportNames = signal<{ reportName: string; title: string }[]>([]);
  filteredReportNames = signal<{ reportName: string; title: string }[]>([]);
  reportNameSearchControl = new FormControl('');

  selectedReportName = signal<string>('');
  generatedReportId = signal<string>('');
  reportDetail = signal<ReportSubmissionDetail | null>(null);
  isRetrieved = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isLoadingReportNames = signal<boolean>(false);

  // Recent PARM IDs dropdown
  showRecentParmIds = false;
  recentParmIds = signal<{ parmId: string; submitDate: string }[]>([]);
  filteredRecentParmIds = signal<{ parmId: string; submitDate: string }[]>([]);
  recentParmIdSearchControl = new FormControl('');
  selectedRecentParmId = signal<string>('');

  autoPrint = false;
  printHeaderTrailer = false;
  deleteAfterPrint = false;
  noOfCopies = 1;

  // Search controls and filtered options for each parameter
  parameterSearchControls: Map<number, FormControl> = new Map();
  filteredParameterOptions: Map<number, ParameterOption[]> = new Map();

  // Chip input separator keys (comma and enter)
  readonly separatorKeysCodes = [COMMA, ENTER];

  ngOnInit(): void {
    this.service
      .getReportTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          const mapped = types.map((t) => ({
            code: t.reportType,
            description: t.reportType,
          }));
          this.reportTypes.set(mapped);
          this.filteredReportTypes.set(mapped);
        },
        error: () => {
          this.reportTypes.set([]);
          this.filteredReportTypes.set([]);
        },
      });

    // Report Type search with debounce (BUG-016)
    this.reportTypeSearchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredReportTypes.set(
          this.reportTypes().filter(
            (r) =>
              (r.code || '').toLowerCase().includes(search) ||
              (r.description || '').toLowerCase().includes(search),
          ),
        );
      });

    // Report Name search with debounce (BUG-016)
    this.reportNameSearchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredReportNames.set(
          this.reportNames().filter(
            (r) =>
              (r.reportName || '').toLowerCase().includes(search) ||
              (r.title || '').toLowerCase().includes(search),
          ),
        );
      });

    // Recent PARM IDs search with debounce (BUG-016)
    this.recentParmIdSearchControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((term) => {
        const search = (term || '').toLowerCase();
        this.filteredRecentParmIds.set(
          this.recentParmIds().filter(
            (r) =>
              (r.parmId || '').toLowerCase().includes(search) ||
              (r.submitDate || '').toLowerCase().includes(search),
          ),
        );
      });

    // BUG-006: Use switchMap to cancel previous in-flight requests on rapid report name changes
    this.reportNameChange$
      .pipe(
        switchMap((reportName) => {
          this.showRecentParmIds = false;
          this.selectedRecentParmId.set('');
          this.recentParmIds.set([]);
          this.filteredRecentParmIds.set([]);

          if (!reportName) {
            this.generatedReportId.set('');
            return EMPTY;
          }

          return forkJoin({
            recentParmIds: this.service.getRecentParameterSets(reportName),
            parmId: this.service.generateParmId(),
          });
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: ({ recentParmIds, parmId }) => {
          this.generatedReportId.set(parmId);

          const formattedParmIds = recentParmIds.map((item) => ({
            parmId: item.parmId || '',
            submitDate: item.submitDate || '',
          }));
          this.recentParmIds.set(formattedParmIds);
          this.filteredRecentParmIds.set(formattedParmIds);
        },
        error: () => {
          this.snackBar.open('Failed to generate Report ID', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  onReportTypeChange(reportType: string): void {
    this.selectedReportType.set(reportType);

    this.selectedReportName.set('');
    this.generatedReportId.set('');
    this.reportDetail.set(null);
    this.isRetrieved.set(false);

    this.loadReportNames(reportType || undefined);
  }

  // BUG-019: Added error handling
  private loadReportNames(reportType?: string): void {
    this.isLoadingReportNames.set(true);
    this.service
      .getReportNames(reportType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reportNames) => {
          this.reportNames.set(reportNames);
          this.filteredReportNames.set(reportNames);
          this.reportNameSearchControl.setValue('', { emitEvent: false });
          this.isLoadingReportNames.set(false);
        },
        error: () => {
          this.reportNames.set([]);
          this.filteredReportNames.set([]);
          this.isLoadingReportNames.set(false);
          this.snackBar.open('Failed to load report names', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  onReportNameChange(reportName: string): void {
    this.selectedReportName.set(reportName);
    this.reportDetail.set(null);
    this.isRetrieved.set(false);

    // BUG-006: Emit to switchMap-based pipeline instead of direct subscribe
    this.reportNameChange$.next(reportName);
  }

  // BUG-015: Load parameter values on-demand instead of pre-fetching all
  onRecentParmIdChange(parmId: string): void {
    this.selectedRecentParmId.set(parmId);

    if (!parmId) return;

    const currentDetail = this.reportDetail();
    if (!currentDetail) return;

    const reportName = this.selectedReportName();
    this.service
      .getParameterValues(reportName, parmId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedParams) => {
          if (savedParams?.parameters) {
            this.populateParameterValues(savedParams.parameters);
          }
        },
        error: () => {
          this.snackBar.open('Failed to load saved parameter values', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  onUseRecentParmIdToggle(isChecked: boolean): void {
    if (!isChecked) {
      this.selectedRecentParmId.set('');

      const currentDetail = this.reportDetail();
      if (currentDetail) {
        const clearedParameters = currentDetail.parameters.map((param) => ({
          ...param,
          value: null,
        }));

        this.reportDetail.set({
          ...currentDetail,
          parameters: clearedParameters,
        });
      }
    }
  }

  ngAfterViewInit(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'parmNo',
          header: 'Sequence',
          type: 'number',
          width: '100px',
        },
        {
          key: 'parmPrompt',
          header: 'Prompt',
          type: 'custom',
          width: '300px',
          truncate: false,
          cellTemplate: this.promptTemplate,
        },
        {
          key: 'value',
          header: 'Parameter Value',
          type: 'custom',
          cellTemplate: this.parameterValueTemplate,
        },
      ],
      showPagination: false,
      stickyHeader: true,
      emptyMessage: 'No parameters available',
      showTableOnEmpty: true,
    };
    this.cdr.detectChanges();
  }

  onRetrieve(): void {
    const reportName = this.selectedReportName();
    if (!reportName) return;

    this.isLoading.set(true);
    this.service
      .getReportDetails(reportName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.reportDetail.set(detail);
          this.isRetrieved.set(true);
          this.isLoading.set(false);
          this.headerConfig = {
            title: 'Report Generator',
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: detail.reportName, link: null },
            ],
          };
          this.initializeParameterSearchControls(detail.parameters);

          const selectedParmId = this.selectedRecentParmId();
          if (selectedParmId) {
            this.loadSavedParameterValues(reportName, selectedParmId);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.snackBar.open('Failed to load report details', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  private loadSavedParameterValues(reportName: string, parmId: string): void {
    this.service
      .getParameterValues(reportName, parmId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedParams) => {
          if (savedParams?.parameters) {
            this.populateParameterValues(savedParams.parameters);
          }
        },
        error: () => {
          this.snackBar.open('Failed to load saved parameter values', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  private populateParameterValues(
    savedParameters: { parmNo: number; parmSelect?: string | null; parmCode?: string | null }[],
  ): void {
    const currentDetail = this.reportDetail();
    if (!currentDetail) return;

    // BUG FIX: Collect all values for each parmNo (API returns multiple rows for multiselect)
    const savedValuesMap = new Map<number, string[]>();
    savedParameters.forEach((saved) => {
      if (saved.parmSelect) {
        const existing = savedValuesMap.get(saved.parmNo) || [];
        existing.push(saved.parmSelect);
        savedValuesMap.set(saved.parmNo, existing);
      }
    });

    const lovThreshold = 1000;
    const updatedParameters = currentDetail.parameters.map((param) => {
      const savedValues = savedValuesMap.get(param.parmNo);

      if (savedValues && savedValues.length > 0) {
        if (param.isMultiSelect) {
          const totalCount = param.totalLovCount ?? 0;

          // For large LOV sets (> 1000), convert array to comma-separated string
          // because searchable-multiselect uses text input, not dropdown with chips
          if (totalCount > lovThreshold) {
            return { ...param, value: savedValues.join(', ') };
          }

          // For normal multiselect (≤ 1000), use the array of values directly
          // Reset selectionMode so formatParameterValue sends actual values, not 'ALL'
          return { ...param, value: savedValues, selectionMode: undefined };
        } else {
          // For single value, convert based on type
          const savedValue = savedValues[0];
          let convertedValue: string | Date | null = savedValue;

          // Convert date strings to Date objects for datepicker fields
          if (param.codeType === 'DATE') {
            // API returns 'MM-DD-YYYY', convert to Date object
            const dateMoment = moment(savedValue, 'MM-DD-YYYY', true);
            if (dateMoment.isValid()) {
              convertedValue = dateMoment.toDate();
            }
          } else if (param.codeType === 'ODATE') {
            // API returns 'DD-MMM-YYYY', convert to Date object
            const dateMoment = moment(savedValue, 'DD-MMM-YYYY', true);
            if (dateMoment.isValid()) {
              convertedValue = dateMoment.toDate();
            }
          }

          return { ...param, value: convertedValue };
        }
      }
      return param;
    });

    // BUG FIX: Add placeholder options for selected values not in options array (for chips to display)
    // Skip for large LOV sets (> 1000 items) to avoid performance issues
    const parametersWithPlaceholders = updatedParameters.map((param) => {
      const totalCount = param.totalLovCount ?? 0;

      // Skip placeholder creation for large LOV sets
      if (totalCount > lovThreshold) {
        return param;
      }

      if (param.isMultiSelect && Array.isArray(param.value) && param.value.length > 0) {
        const existingCodes = new Set(param.options.map((opt) => opt.code));
        const missingCodes = param.value.filter((code: string) => !existingCodes.has(code));

        if (missingCodes.length > 0) {
          // Add placeholder options with code as description
          const placeholderOptions = missingCodes.map((code: string) => ({
            code,
            description: code,
          }));
          return {
            ...param,
            options: [...param.options, ...placeholderOptions],
          };
        }
      }
      return param;
    });

    // Update the signal with new parameters
    this.reportDetail.set({
      ...currentDetail,
      parameters: parametersWithPlaceholders,
    });

    // Force change detection to ensure UI updates
    this.cdr.detectChanges();
  }

  // BUG-018: Pre-populate all controls, never create ephemeral instances
  private initializeParameterSearchControls(parameters: ReportSubmissionParameter[]): void {
    this.parameterSearchControls.clear();
    this.filteredParameterOptions.clear();

    parameters.forEach((param) => {
      const searchControl = new FormControl('');
      this.parameterSearchControls.set(param.parmNo, searchControl);
      this.filteredParameterOptions.set(param.parmNo, [...param.options]);

      searchControl.valueChanges
        .pipe(debounceTime(200), takeUntil(this.destroy$))
        .subscribe((searchTerm) => {
          this.filterParameterOptions(param.parmNo, searchTerm || '', param.options);
        });
    });
  }

  private filterParameterOptions(parmNo: number, searchTerm: string, allOptions: ParameterOption[]): void {
    const search = searchTerm.toLowerCase().trim();
    if (!search) {
      this.filteredParameterOptions.set(parmNo, [...allOptions]);
      return;
    }

    const filtered = allOptions.filter(
      (opt) =>
        (opt.code || '').toLowerCase().includes(search) ||
        (opt.description || '').toLowerCase().includes(search),
    );
    this.filteredParameterOptions.set(parmNo, filtered);
  }

  getFilteredOptions(param: ReportSubmissionParameter): ParameterOption[] {
    return this.filteredParameterOptions.get(param.parmNo) || param.options;
  }

  getSearchControl(param: ReportSubmissionParameter): FormControl {
    let control = this.parameterSearchControls.get(param.parmNo);
    if (!control) {
      control = new FormControl('');
      this.parameterSearchControls.set(param.parmNo, control);
    }
    return control;
  }

  getInputType(param: ReportSubmissionParameter): string {
    // Check if LOV count exceeds threshold (1000) - render as text input
    const lovThreshold = 1000;
    const totalCount = param.totalLovCount ?? 0;

    if (param.codeType === 'LIST') {
      // If LOV count = 0 OR > 1000, render as searchable text input instead of dropdown
      if (totalCount === 0 || totalCount > lovThreshold) {
        return param.isMultiSelect ? 'searchable-multiselect' : 'searchable-text';
      }
      return param.isMultiSelect ? 'multiselect' : 'select';
    }

    const hasRefLookup = !!(param.refTable || param.refColumn || param.refSql);
    if ((param.codeType === 'CHAR' || param.codeType === 'NUMBER') && hasRefLookup) {
      // If LOV count = 0 OR > 1000, render as searchable text input instead of dropdown
      if (totalCount === 0 || totalCount > lovThreshold) {
        return param.listEntryFlag === 'Y' ? 'searchable-multiselect' : 'searchable-text';
      }
      return param.listEntryFlag === 'Y' ? 'multiselect' : 'select';
    }

    if (param.codeType === 'DATE') {
      return 'date';
    }
    if (param.codeType === 'DATETM') {
      return 'datetime';
    }
    if (param.codeType === 'ODATE') {
      return 'odate';
    }

    return 'text';
  }

  getLovFetchFn(param: ReportSubmissionParameter): DropdownFetchFn | null {
    // Always return null to disable async loading
    // All dropdowns will use static items (client-side mode)
    // Input boxes are already used for LOV count >= 1000
    return null;
  }

  private formatParameterValue(
    value: string | string[] | Date | Moment | null,
    codeType: string,
    param?: ReportSubmissionParameter,
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (Array.isArray(value)) {
      if (param && param.listEntryFlag === 'Y') {
        if (param.selectionMode === 'all') {
          return 'ALL';
        }
        if (!param.selectionMode && this.isAllSelected(param)) {
          return 'ALL';
        }
      }
      return value.join(',');
    }

    if (moment.isMoment(value) || value instanceof Date) {
      const upperCodeType = codeType.toUpperCase();

      switch (upperCodeType) {
        case 'DATE':
          return moment(value).format('MM-DD-YYYY');
        case 'ODATE':
          return moment(value).format('DD-MMM-YYYY').toUpperCase();
        case 'DATETM':
          return moment(value).format('MM-DD-YYYY HH:mm');
        default:
          return moment(value).format('MM-DD-YYYY');
      }
    }

    if (typeof value === 'string') {
      if (codeType.toUpperCase() === 'DATETM') {
        return this.formatDateTimeString(value);
      }
    }

    return String(value);
  }

  private formatDateTimeString(value: string): string {
    const cleaned = value.replace(/[-:\s]/g, '');

    if (cleaned.length === 12 && /^\d{12}$/.test(cleaned)) {
      const mm = cleaned.substring(0, 2);
      const dd = cleaned.substring(2, 4);
      const yyyy = cleaned.substring(4, 8);
      const hh = cleaned.substring(8, 10);
      const mi = cleaned.substring(10, 12);
      return `${mm}-${dd}-${yyyy} ${hh}:${mi}`;
    }

    if (/^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}$/.test(value)) {
      return value;
    }

    return value;
  }

  validateDate(param: ReportSubmissionParameter): void {
    if (!param.value) return;
    if (param.value instanceof Date || moment.isMoment(param.value)) return;

    if (typeof param.value === 'string') {
      const cleaned = param.value.replace(/[-/\s]/g, '');

      if (cleaned.length === 6 && /^\d{6}$/.test(cleaned)) {
        const mm = cleaned.substring(0, 2);
        const dd = cleaned.substring(2, 4);
        const yy = cleaned.substring(4, 6);
        param.value = moment(`${mm}-${dd}-20${yy}`, 'MM-DD-YYYY').toDate();
        return;
      }

      if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
        const mm = cleaned.substring(0, 2);
        const dd = cleaned.substring(2, 4);
        const yyyy = cleaned.substring(4, 8);
        const date = moment(`${mm}-${dd}-${yyyy}`, 'MM-DD-YYYY', true);
        if (date.isValid()) {
          param.value = date.toDate();
          return;
        }
      }

      if (/^\d{2}-\d{2}-\d{4}$/.test(param.value)) {
        const date = moment(param.value, 'MM-DD-YYYY', true);
        if (date.isValid()) {
          param.value = date.toDate();
          return;
        }
      }

      this.snackBar.open('Err: Invalid date format. Must be MM-DD-YYYY', 'DISMISS', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });
    }
  }

  validateODate(param: ReportSubmissionParameter): void {
    if (!param.value) return;
    if (param.value instanceof Date || moment.isMoment(param.value)) return;

    if (typeof param.value === 'string') {
      const cleaned = param.value.replace(/[-/\s]/g, '').toUpperCase();

      if (cleaned.length === 9 && /^\d{2}[A-Z]{3}\d{4}$/.test(cleaned)) {
        const dd = cleaned.substring(0, 2);
        const mon = cleaned.substring(2, 5);
        const yyyy = cleaned.substring(5, 9);
        const date = moment(`${dd}-${mon}-${yyyy}`, 'DD-MMM-YYYY', true);
        if (date.isValid()) {
          param.value = date.toDate();
          return;
        }
      }

      if (/^\d{2}-[A-Z]{3}-\d{4}$/.test(param.value.toUpperCase())) {
        const date = moment(param.value, 'DD-MMM-YYYY', true);
        if (date.isValid()) {
          param.value = date.toDate();
          return;
        }
      }

      this.snackBar.open('Err: Invalid date format. Must be DD-MON-YYYY', 'DISMISS', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });
    }
  }

  validateDateTime(param: ReportSubmissionParameter): void {
    if (!param.value || typeof param.value !== 'string') return;

    const formatted = this.formatDateTimeString(param.value as string);

    const isValid = /^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}$/.test(formatted);

    if (!isValid) {
      this.snackBar.open('Err: Invalid datetime format. Must be MM-DD-YYYY HH:MI', 'DISMISS', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });
      return;
    }

    const datePart = formatted.split(' ')[0];
    const timePart = formatted.split(' ')[1];
    const [mm, dd, yyyy] = datePart.split('-');
    const [hh, mi] = timePart.split(':');

    const dateTime = moment(`${yyyy}-${mm}-${dd} ${hh}:${mi}`, 'YYYY-MM-DD HH:mm', true);
    if (!dateTime.isValid()) {
      this.snackBar.open('Err: Invalid datetime format. Must be MM-DD-YYYY HH:MI', 'DISMISS', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });
      return;
    }

    param.value = formatted;
  }

  getSelectedChipDetails(param: ReportSubmissionParameter): { code: string; description: string }[] {
    if (!Array.isArray(param.value)) return [];
    return param.value.map((code) => {
      const opt = param.options.find((o) => o.code === code);
      return { code, description: opt ? opt.description : code };
    });
  }

  getVisibleChips(param: ReportSubmissionParameter, maxVisible: number = 1): { code: string; description: string }[] {
    const allChips = this.getSelectedChipDetails(param);
    return allChips.slice(0, maxVisible);
  }

  getRemainingChipsCount(param: ReportSubmissionParameter, maxVisible: number = 1): number {
    const allChips = this.getSelectedChipDetails(param);
    return Math.max(0, allChips.length - maxVisible);
  }

  hasMoreChips(param: ReportSubmissionParameter, maxVisible: number = 1): boolean {
    return this.getRemainingChipsCount(param, maxVisible) > 0;
  }

  getHiddenChipsTooltip(param: ReportSubmissionParameter, maxVisible: number = 1): string {
    const allChips = this.getSelectedChipDetails(param);
    const hiddenChips = allChips.slice(maxVisible);
    return hiddenChips.map((c) => c.description).join('\n');
  }

  removeChip(param: ReportSubmissionParameter, code: string, event: MouseEvent): void {
    event.stopPropagation();
    if (!Array.isArray(param.value)) return;
    param.value = param.value.filter((v: string) => v !== code);
  }

  isAllSelected(param: ReportSubmissionParameter): boolean {
    if (!Array.isArray(param.value)) return false;
    const totalCount = param.totalLovCount ?? 0;
    if (totalCount === 0) return false;
    return param.value.length >= totalCount;
  }

  toggleSelectAll(param: ReportSubmissionParameter): void {
    const filteredOptions = this.getFilteredOptions(param);

    if (this.isAllSelected(param)) {
      param.value = [];
    } else {
      param.value = filteredOptions.map((opt) => opt.code);
    }

    this.cdr.detectChanges();
  }

  onSingleSelectChange(param: ReportSubmissionParameter, selectedValue: string | string[] | null): void {
    // For lazy-loaded dropdowns, ensure selected item exists in param.options for chip display
    if (!selectedValue || Array.isArray(selectedValue)) return;

    const existsInOptions = param.options.some(opt => opt.code === selectedValue);
    if (existsInOptions) return;

    // Selected item not in options - fetch from API to get description
    this.service.getParameterLovPaginated(param.parmCode, '', 0, 1, [selectedValue])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const selectedItem = response.items.find((item: DropdownItem) => item.code === selectedValue);
          if (selectedItem) {
            // Add selected item to options for chip display
            param.options = [...param.options, selectedItem];
          }
        },
        error: () => {
          // If fetch fails, create placeholder with code as description
          param.options = [...param.options, { code: selectedValue, description: selectedValue }];
        }
      });
  }

  onMultiSelectChange(param: ReportSubmissionParameter, selectedValues: string | string[] | null): void {
    // For lazy-loaded dropdowns, ensure selected items exist in param.options for chip display
    if (!selectedValues || !Array.isArray(selectedValues)) return;

    const missingCodes = selectedValues.filter(code =>
      !param.options.some(opt => opt.code === code)
    );

    if (missingCodes.length === 0) return;

    // Fetch missing items from API to get descriptions
    this.service.getParameterLovPaginated(param.parmCode, '', 0, missingCodes.length, missingCodes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Add fetched items to options for chip display
          const newItems = response.items.filter((item: DropdownItem) =>
            !param.options.some(opt => opt.code === item.code)
          );
          if (newItems.length > 0) {
            param.options = [...param.options, ...newItems];
          }
        },
        error: () => {
          // If fetch fails, create placeholders with codes as descriptions
          const placeholders = missingCodes
            .filter(code => !param.options.some(opt => opt.code === code))
            .map(code => ({ code, description: code }));
          if (placeholders.length > 0) {
            param.options = [...param.options, ...placeholders];
          }
        }
      });
  }

  /**
   * Check if all parameters have values (all fields are required for now)
   * Returns true only when all fields are filled
   */
  areAllParametersFilled(): boolean {
    const detail = this.reportDetail();
    if (!detail || detail.parameters.length === 0) return false;

    return detail.parameters.every((param) => {
      const value = param.value;

      // For array values (multiselect)
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      // For string values
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }

      // For Date/Moment objects
      if (value instanceof Date || moment.isMoment(value)) {
        return true;
      }

      // Null or undefined = not filled
      return false;
    });
  }

  /**
   * Normalize parameter values before submission
   * Converts comma-separated strings to arrays for searchable-multiselect inputs
   */
  private normalizeParameterValue(param: ReportSubmissionParameter): string | string[] | Date | Moment | null {
    const inputType = this.getInputType(param);

    // For searchable-multiselect, convert comma-separated string to array
    if (inputType === 'searchable-multiselect' && typeof param.value === 'string') {
      const trimmedValue = param.value.trim();

      // If user entered "ALL", keep it as-is (will be handled by formatParameterValue)
      if (trimmedValue.toUpperCase() === 'ALL') {
        return 'ALL';
      }

      // Split by comma and trim each value
      const values = trimmedValue
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);

      return values.length > 0 ? values : null;
    }

    // For searchable-text, trim whitespace
    if (inputType === 'searchable-text' && typeof param.value === 'string') {
      const trimmed = param.value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    return param.value;
  }

  /**
   * Get chip values as array for display
   */
  /**
   * Check if chips should be displayed for this parameter
   * Chips are only shown when:
   * 1. Has reference lookup (refSql/refColumn/refTable)
   * 2. AND is multiselect (listEntryFlag === 'Y')
   * 3. AND LOV count is 0 or > 1000
   */
  shouldShowChips(param: ReportSubmissionParameter): boolean {
    const hasRefLookup = !!(param.refTable || param.refColumn || param.refSql);
    const isMultiselect = param.listEntryFlag === 'Y';
    const totalCount = param.totalLovCount ?? 0;
    const hasLargeOrEmptyLov = totalCount === 0 || totalCount > 1000;

    return hasRefLookup && isMultiselect && hasLargeOrEmptyLov;
  }

  getChipValues(param: ReportSubmissionParameter): string[] {
    if (!param.value) return [];

    // If value is already an array, return it
    if (Array.isArray(param.value)) {
      return param.value;
    }

    // If value is a string, split by comma
    if (typeof param.value === 'string') {
      return param.value
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);
    }

    return [];
  }

  /**
   * Get tooltip text for hidden chips (for +N badge)
   */
  getChipValuesTooltip(param: ReportSubmissionParameter): string {
    const allChips = this.getChipValues(param);
    if (allChips.length <= 1) return '';

    // Skip the first chip (it's visible), show the rest
    const hiddenChips = allChips.slice(1);
    return hiddenChips.join('\n');
  }

  /**
   * Get chip label - returns description if available in options, otherwise returns code
   */
  getChipLabel(param: ReportSubmissionParameter, code: string): string {
    const option = param.options.find(opt => opt.code === code);
    return option ? option.description : code;
  }

  /**
   * Add a new chip value when user types and presses comma/enter
   */
  addChipValue(param: ReportSubmissionParameter, event: any): void {
    const input = event.input;
    const value = (event.value || '').trim();

    // Add the value as a chip
    if (value) {
      const currentValues = this.getChipValues(param);

      // Avoid duplicates
      if (!currentValues.includes(value)) {
        const updatedValues = [...currentValues, value];

        // Update parameter value as array
        const detail = this.reportDetail();
        if (!detail) return;

        const updatedParams = detail.parameters.map(p =>
          p.parmNo === param.parmNo
            ? { ...p, value: updatedValues }
            : p
        );

        this.reportDetail.set({
          ...detail,
          parameters: updatedParams
        });
      }
    }

    // Clear the input
    if (input) {
      input.value = '';
    }
  }

  /**
   * Remove a chip value
   */
  removeChipValue(param: ReportSubmissionParameter, codeToRemove: string): void {
    const currentValues = this.getChipValues(param);
    const updatedValues = currentValues.filter(v => v !== codeToRemove);

    const detail = this.reportDetail();
    if (!detail) return;

    const updatedParams = detail.parameters.map(p =>
      p.parmNo === param.parmNo
        ? { ...p, value: updatedValues.length > 0 ? updatedValues : null }
        : p
    );

    this.reportDetail.set({
      ...detail,
      parameters: updatedParams
    });
  }

  /**
   * Handle blur event to add any remaining text as a chip
   */
  onChipInputBlur(param: ReportSubmissionParameter, event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value?.trim();

    if (value) {
      this.addChipValue(param, { value, input });
    }
  }

  // BUG-021: Add confirmation dialog before submission
  onSubmitNow(): void {
    const detail = this.reportDetail();
    if (!detail || this.isSubmitting()) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Confirm Submission',
        message: `Are you sure you want to submit report "${detail.reportName}"?`,
        confirmText: 'SUBMIT',
        cancelText: 'CANCEL',
      },
      width: '400px',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.executeSubmit(detail);
        }
      });
  }

  private executeSubmit(detail: ReportSubmissionDetail): void {
    const formattedParameters = detail.parameters.map((p) => {
      // Normalize value (convert comma-separated strings to arrays for searchable-multiselect)
      const normalizedValue = this.normalizeParameterValue(p);

      return {
        parmNo: p.parmNo,
        parmSelect: this.formatParameterValue(normalizedValue, p.codeType, p),
        parmCode: p.parmCode,
      };
    });

    this.isSubmitting.set(true);
    this.service
      .submitReport({
        reportName: detail.reportName,
        parmId: this.generatedReportId() || null,
        printId: detail.printId || null,
        formsType: detail.formsType || null,
        parameters: formattedParameters,
        autoPrint: this.autoPrint,
        printHeaderTrailer: this.printHeaderTrailer,
        deleteAfterPrint: this.deleteAfterPrint,
        noOfCopies: this.noOfCopies,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.snackBar.open(
            `Report ${detail.reportName} has been submitted successfully. Job ID: ${response.jobId}`,
            'DISMISS',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['content-snackbar'],
            },
          );
          this.resetToEmptyState();
        },
        error: (error) => {
          this.isSubmitting.set(false);
          const errorMessage = error?.error?.message || 'Failed to submit report';
          this.snackBar.open(errorMessage, 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  onScheduleSubmit(): void {
    const detail = this.reportDetail();
    if (!detail || this.isSubmitting()) return;

    const dialogRef = this.dialog.open(ScheduleDialogComponent, {
      data: { reportTitle: detail.reportName } as ScheduleDialogData,
      width: '464px',
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: ScheduleDialogResult | null) => {
        if (!result) return;

        const formattedParameters = detail.parameters.map((p) => {
          // Normalize value (convert comma-separated strings to arrays for searchable-multiselect)
          const normalizedValue = this.normalizeParameterValue(p);

          return {
            parmNo: p.parmNo,
            parmSelect: this.formatParameterValue(normalizedValue, p.codeType, p),
            parmCode: p.parmCode,
          };
        });

        this.isSubmitting.set(true);
        this.service
          .scheduleReport({
            reportName: detail.reportName,
            parmId: this.generatedReportId() || null,
            printId: detail.printId || null,
            formsType: detail.formsType || null,
            parameters: formattedParameters,
            autoPrint: this.autoPrint,
            printHeaderTrailer: this.printHeaderTrailer,
            deleteAfterPrint: this.deleteAfterPrint,
            noOfCopies: this.noOfCopies,
            startTime: result.scheduledTime,
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.isSubmitting.set(false);
              const scheduledDisplay = moment(result.scheduledTime).format('MM-DD-YYYY HH:mm');
              this.snackBar.open(
                `Report submission scheduled for ${scheduledDisplay} successfully. Job ID: ${response.jobId}`,
                'DISMISS',
                {
                  duration: 3000,
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['content-snackbar'],
                },
              );
              this.resetToEmptyState();
            },
            error: (error) => {
              this.isSubmitting.set(false);
              const errorMessage = error?.error?.message || 'Failed to schedule report';
              this.snackBar.open(errorMessage, 'DISMISS', {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar'],
              });
            },
          });
      });
  }

  private resetToEmptyState(): void {
    this.selectedReportName.set('');
    this.selectedReportType.set('');
    this.generatedReportId.set('');
    this.reportDetail.set(null);
    this.isRetrieved.set(false);

    this.showRecentParmIds = false;
    this.selectedRecentParmId.set('');
    this.recentParmIds.set([]);
    this.filteredRecentParmIds.set([]);

    this.autoPrint = false;
    this.printHeaderTrailer = false;
    this.deleteAfterPrint = false;
    this.noOfCopies = 1;

    this.parameterSearchControls.clear();
    this.filteredParameterOptions.clear();

    this.reportNameSearchControl.setValue('', { emitEvent: false });
    this.reportTypeSearchControl.setValue('', { emitEvent: false });
    this.recentParmIdSearchControl.setValue('', { emitEvent: false });

    this.headerConfig = {
      title: 'Report Generator',
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Report Name', link: null },
      ],
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
