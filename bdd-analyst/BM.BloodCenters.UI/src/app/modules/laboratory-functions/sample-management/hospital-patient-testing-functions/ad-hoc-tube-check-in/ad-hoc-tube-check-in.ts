import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  computed,
  inject,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';

import { AdHocTubeCheckInService } from './services/ad-hoc-tube-check-in.service';
import {
  AdhocContractDto,
  AdhocBatchDto,
  AdhocTestDto,
  AdhocBatchUnitDto,
  AdhocCheckInRequestDto,
  AdhocCheckInResponseDto,
  TubeIndicatorValue,
} from './models/ad-hoc-tube-check-in.model';
import { SelectTestPanelComponent } from './components/select-test-panel/select-test-panel';
import { ViewUnitsPanelComponent } from './components/view-units-panel/view-units-panel';
import moment from 'moment';

@Component({
  selector: 'app-ad-hoc-tube-check-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatMomentDateModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    SearchBar,
    NgxMatSelectSearchModule,
    SelectTestPanelComponent,
    ViewUnitsPanelComponent,
    UnitIdFieldComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './ad-hoc-tube-check-in.html',
  styleUrls: ['./ad-hoc-tube-check-in.scss'],
})
export class AdHocTubeCheckInComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `ad-hoc-tube-check-in-${AdHocTubeCheckInComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  @ViewChild('tsUnitIdField') tsUnitIdField!: UnitIdFieldComponent;
  @ViewChild('red1Field') red1Field?: UnitIdFieldComponent;
  @ViewChild('red2Field') red2Field?: UnitIdFieldComponent;
  @ViewChild('purple1Field') purple1Field?: UnitIdFieldComponent;
  @ViewChild('purple2Field') purple2Field?: UnitIdFieldComponent;
  @ViewChild('collDateInput') collDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('recvDateInput') recvDateInput!: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly service = inject(AdHocTubeCheckInService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly tubeIndicatorOptions: { value: TubeIndicatorValue; label: string }[] = [
    { value: '', label: 'None' },
    { value: 'Y', label: 'Yes' },
    { value: 'P', label: 'Plasma' },
    { value: 'S', label: 'Serum' },
  ];

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
  };

  constructor() {
    effect(() => {
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
  }

  readonly isLoading = signal(false);
  readonly isCheckingIn = signal(false);
  readonly hasRetrieved = signal(false);

  readonly contractOptions = signal<AdhocContractDto[]>([]);
  readonly filteredContractOptions = signal<AdhocContractDto[]>([]);
  readonly contractSearchControl = new FormControl('');

  readonly batchOptions = signal<AdhocBatchDto[]>([]);
  readonly filteredBatchOptions = signal<AdhocBatchDto[]>([]);
  readonly batchSearchControl = new FormControl('');

  readonly contractDescription = signal('');
  readonly selectedTests = signal<AdhocTestDto[]>([]);
  readonly checkedInUnits = signal<AdhocBatchUnitDto[]>([]);

  readonly isSelectTestPanelOpen = signal(false);
  readonly isViewUnitsPanelOpen = signal(false);
  readonly isExistingBatch = signal(false);
  readonly sessionUnits = signal<AdhocBatchUnitDto[]>([]);

  readonly testSearchText = signal('');

  filterForm!: FormGroup;
  maxDate!: moment.Moment;

  readonly validatedTsUnitId = signal<string | null>(null);
  readonly validatedRed1 = signal<string | null>(null);
  readonly validatedRed2 = signal<string | null>(null);
  readonly validatedPurple1 = signal<string | null>(null);
  readonly validatedPurple2 = signal<string | null>(null);

  collDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.collDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  recvDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.recvDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  filteredSelectedTests = computed(() => {
    const tests = this.selectedTests();
    const search = this.testSearchText().toLowerCase();
    if (!search) return tests;
    return tests.filter(
      t => t.testId.toLowerCase().includes(search) || (t.testDesc ?? '').toLowerCase().includes(search)
    );
  });

  private readonly tubeValueFormatter = (val: any) => {
    if (!val) return '';
    const map: Record<string, string> = { Y: 'Yes', P: 'Plasma', S: 'Serum' };
    return map[val] ?? val;
  };

  tableConfig: DataTableConfig<AdhocBatchUnitDto> = {
    columns: [
      { key: 'osUnitId', header: 'TS Unit ID', sortable: false, width: '20%' },
      { key: 'displayUnitId', header: 'Unit ID', sortable: false, width: '20%' },
      { key: 'redTubeFlag', header: 'Red 1', sortable: false, width: '12%', valueFormatter: this.tubeValueFormatter },
      { key: 'redTube2', header: 'Red 2', sortable: false, width: '12%', valueFormatter: this.tubeValueFormatter },
      { key: 'purpleTubeFlag', header: 'Purple 1', sortable: false, width: '12%', valueFormatter: this.tubeValueFormatter },
      { key: 'serumPlasmaInd', header: 'Purple 2', sortable: false, width: '12%', valueFormatter: this.tubeValueFormatter },
    ],
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    emptySubMessage: 'Enter Contract ID or Batch ID to begin.',
    noDataIcon: 'search',
    showTableOnEmpty: true,
    showActionsAsMenu: false,
  };

  ngOnInit(): void {
    this.maxDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.initForms();
    this.setupDateValidation();
    this.loadContracts();
    this.setupSearchFilters();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.filterForm = this.fb.group({
      contractId: [null, [Validators.required]],
      batchId: [null],
      collectionDate: [null, [Validators.required, DateFieldValidationUtility.validDateValidator()]],
      receivedDate: [null, [Validators.required, DateFieldValidationUtility.validDateValidator()]],
      r1: [''],
      r2: [''],
      p1: [''],
      p2: [''],
    });
  }

  private setupDateValidation(): void {
    this.filterForm.get('collectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDateInput('collectionDate', this.collDateInput));

    this.filterForm.get('receivedDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDateInput('receivedDate', this.recvDateInput));
  }

  private validateDateInput(controlName: string, inputRef: ElementRef<HTMLInputElement>): void {
    const control = this.filterForm.get(controlName);
    const inputValue = inputRef?.nativeElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  onCollDateBlur(): void {
    setTimeout(() => {
      const control = this.filterForm.get('collectionDate');
      control?.markAsTouched();
      this.validateDateInput('collectionDate', this.collDateInput);
      control?.updateValueAndValidity();
    }, 0);
  }

  onRecvDateBlur(): void {
    setTimeout(() => {
      const control = this.filterForm.get('receivedDate');
      control?.markAsTouched();
      this.validateDateInput('receivedDate', this.recvDateInput);
      control?.updateValueAndValidity();
    }, 0);
  }

  getCollDateError(): string {
    return this.getDateError('collectionDate', 'Collection Date', this.collDateInput);
  }

  getRecvDateError(): string {
    return this.getDateError('receivedDate', 'Received Date', this.recvDateInput);
  }

  private getDateError(controlName: string, label: string, inputRef: ElementRef<HTMLInputElement>): string {
    const control = this.filterForm.get(controlName);
    if (!control) return '';

    if (control.hasError('matDatepickerMax')) {
      return `${label} cannot be a future date`;
    }
    if (control.hasError('invalidDate') || control.hasError('matDatepickerParse')) {
      return `${label} is invalid`;
    }
    const inputValue = inputRef?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return `${label} is invalid`;
    }
    if (control.hasError('required') && control.touched && (!inputValue || inputValue.trim().length === 0)) {
      return `${label} is required`;
    }
    return '';
  }

  private loadContracts(): void {
    const chapterId = this.headerService.getCurrentChapterId() || '';
    this.service.getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: contracts => {
          this.contractOptions.set(contracts);
          this.filteredContractOptions.set(contracts);
        },
        error: () => { /* handled by global error interceptor */ },
      });
  }

  private setupSearchFilters(): void {
    this.contractSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        const all = this.contractOptions();
        this.filteredContractOptions.set(
          t ? all.filter(c => (c.contractId + ' ' + c.company).toLowerCase().includes(t)) : all
        );
      });

    this.batchSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term ?? '').toLowerCase();
        const all = this.batchOptions();
        this.filteredBatchOptions.set(
          t ? all.filter(b => b.batchId.toLowerCase().includes(t)) : all
        );
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.maxDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
        this.onClearAll();
        this.loadContracts();
      });
  }

  onContractChange(contractId: string): void {
    this.filterForm.patchValue({ batchId: null });
    this.batchSearchControl.setValue('', { emitEvent: false });
    this.selectedTests.set([]);
    this.sessionUnits.set([]);
    this.isExistingBatch.set(false);
    this.hasRetrieved.set(false);

    const contract = this.contractOptions().find(c => c.contractId === contractId);
    if (contract) {
      this.contractDescription.set(contract.company);
      this.filterForm.patchValue({
        r1: (contract.redTubeCount ?? 0) >= 1 ? 'Y' : '',
        r2: (contract.redTubeCount ?? 0) >= 2 ? 'Y' : '',
        p1: (contract.purpleTubeCount ?? 0) >= 1 ? 'Y' : '',
        p2: (contract.purpleTubeCount ?? 0) >= 2 ? 'Y' : '',
      });
      this.loadBatches(contractId);
    } else {
      this.contractDescription.set('');
      this.batchOptions.set([]);
      this.filteredBatchOptions.set([]);
    }
  }

  private loadBatches(contractId: string): void {
    this.service.getBatches(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: batches => {
          this.batchOptions.set(batches);
          this.filteredBatchOptions.set(batches);
        },
        error: () => { /* handled by global error interceptor */ },
      });
  }

  get r1Value(): TubeIndicatorValue {
    return this.filterForm.get('r1')?.value || '';
  }

  get r2Value(): TubeIndicatorValue {
    return this.filterForm.get('r2')?.value || '';
  }

  get p1Value(): TubeIndicatorValue {
    return this.filterForm.get('p1')?.value || '';
  }

  get p2Value(): TubeIndicatorValue {
    return this.filterForm.get('p2')?.value || '';
  }

  get isR2Enabled(): boolean {
    return !!this.r1Value;
  }

  get isP2Enabled(): boolean {
    return !!this.p1Value;
  }

  get showRed1Scan(): boolean {
    return !!this.r1Value;
  }

  get showRed2Scan(): boolean {
    return !!this.r2Value;
  }

  get showPurple1Scan(): boolean {
    return !!this.p1Value;
  }

  get showPurple2Scan(): boolean {
    return !!this.p2Value;
  }

  onR1Change(): void {
    if (!this.filterForm.get('r1')?.value) {
      this.filterForm.patchValue({ r2: '' });
    }
  }

  onP1Change(): void {
    if (!this.filterForm.get('p1')?.value) {
      this.filterForm.patchValue({ p2: '' });
    }
  }

  onRetrieve(): void {
    this.filterForm.markAllAsTouched();
    this.cdr.markForCheck();

    const collDateErr = this.getCollDateError();
    const recvDateErr = this.getRecvDateError();
    if (collDateErr || recvDateErr) return;

    if (!this.filterForm.get('contractId')?.value) return;
    if (!this.filterForm.get('collectionDate')?.value) return;
    if (!this.filterForm.get('receivedDate')?.value) return;

    const collDate = this.filterForm.get('collectionDate')?.value;
    const recvDate = this.filterForm.get('receivedDate')?.value;
    if (collDate && recvDate && moment.isMoment(collDate) && moment.isMoment(recvDate) && recvDate.isBefore(collDate, 'day')) {
      this.showError('Received Date cannot be before Collection Date.');
      return;
    }

    const r1 = this.filterForm.get('r1')?.value;
    const r2 = this.filterForm.get('r2')?.value;
    const p1 = this.filterForm.get('p1')?.value;
    const p2 = this.filterForm.get('p2')?.value;
    if (!r1 && !r2 && !p1 && !p2) {
      this.showError('At least one tube type (R1/R2/P1/P2) must be specified.');
      return;
    }

    this.hasRetrieved.set(true);
    this.isLoading.set(true);

    const contractId = this.filterForm.get('contractId')?.value;
    const batchId = this.filterForm.get('batchId')?.value || '';

    this.sessionUnits.set([]);

    if (batchId) {
      this.isExistingBatch.set(true);
      this.service.getBatchTests(batchId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: tests => {
            const testDtos: AdhocTestDto[] = tests.map(t => ({ testId: t.testId, testGroup: null, testDesc: t.testDesc ?? null }));
            this.selectedTests.set(testDtos);
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          },
        });
    } else {
      this.isExistingBatch.set(false);
      this.selectedTests.set([]);
      this.isLoading.set(false);
    }
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.clearScanFields();
    this.contractSearchControl.setValue('', { emitEvent: false });
    this.batchSearchControl.setValue('', { emitEvent: false });
    this.contractDescription.set('');
    this.selectedTests.set([]);
    this.checkedInUnits.set([]);
    this.sessionUnits.set([]);
    this.isExistingBatch.set(false);
    this.batchOptions.set([]);
    this.filteredBatchOptions.set([]);
    this.hasRetrieved.set(false);
    this.testSearchText.set('');
    this.isSelectTestPanelOpen.set(false);
    this.isViewUnitsPanelOpen.set(false);
  }

  onTestSearch(searchText: string): void {
    this.testSearchText.set(searchText);
  }

  onOpenSelectTestPanel(): void {
    this.isSelectTestPanelOpen.set(true);
  }

  onSelectTestPanelClose(): void {
    this.isSelectTestPanelOpen.set(false);
  }

  onTestsSelected(tests: AdhocTestDto[]): void {
    this.selectedTests.set(tests);
    this.isSelectTestPanelOpen.set(false);
  }

  onRemoveTest(testId: string): void {
    this.selectedTests.update(tests => tests.filter(t => t.testId !== testId));
  }

  onOpenViewUnitsPanel(): void {
    this.isViewUnitsPanelOpen.set(true);
  }

  onViewUnitsPanelClose(): void {
    this.isViewUnitsPanelOpen.set(false);
  }

  onTsUnitValidated(data: UnitValidationResponse): void {
    this.validatedTsUnitId.set(data.parsedUnitId);
    this.tryAutoCommit();
  }

  onTsUnitCleared(): void {
    this.validatedTsUnitId.set(null);
  }

  onRed1Validated(data: UnitValidationResponse): void {
    this.validatedRed1.set(data.parsedUnitId);
    this.tryAutoCommit();
  }

  onRed1Cleared(): void {
    this.validatedRed1.set(null);
  }

  onRed2Validated(data: UnitValidationResponse): void {
    this.validatedRed2.set(data.parsedUnitId);
    this.tryAutoCommit();
  }

  onRed2Cleared(): void {
    this.validatedRed2.set(null);
  }

  onPurple1Validated(data: UnitValidationResponse): void {
    this.validatedPurple1.set(data.parsedUnitId);
    this.tryAutoCommit();
  }

  onPurple1Cleared(): void {
    this.validatedPurple1.set(null);
  }

  onPurple2Validated(data: UnitValidationResponse): void {
    this.validatedPurple2.set(data.parsedUnitId);
    this.tryAutoCommit();
  }

  onPurple2Cleared(): void {
    this.validatedPurple2.set(null);
  }

  private tryAutoCommit(): void {
    if (this.isCheckingIn()) return;
    if (!this.tsUnitIdField?.isValid) return;

    const r1 = this.filterForm.get('r1')?.value;
    const r2 = this.filterForm.get('r2')?.value;
    const p1 = this.filterForm.get('p1')?.value;
    const p2 = this.filterForm.get('p2')?.value;

    if (r1 && !this.red1Field?.isValid) return;
    if (r2 && !this.red2Field?.isValid) return;
    if (p1 && !this.purple1Field?.isValid) return;
    if (p2 && !this.purple2Field?.isValid) return;

    this.onCheckInUnit();
  }

  onCheckInUnit(): void {
    if (!this.selectedTests().length) {
      this.showError('Error 5270: No tests selected.');
      return;
    }

    if (!this.tsUnitIdField?.isValid) {
      this.showError('Please scan or enter a valid TS Unit ID.');
      return;
    }

    const filterValues = this.filterForm.value;

    this.isCheckingIn.set(true);
    const request: AdhocCheckInRequestDto = {
      contractId: filterValues.contractId,
      batchId: filterValues.batchId || null,
      contractSuffix: null,
      collDate: filterValues.collectionDate ? moment(filterValues.collectionDate).format('YYYY-MM-DD') : null,
      receivedDate: filterValues.receivedDate ? moment(filterValues.receivedDate).format('YYYY-MM-DD') : '',
      r1Num: filterValues.r1 || null,
      r2Num: filterValues.r2 || null,
      p1Num: filterValues.p1 || null,
      p2Num: filterValues.p2 || null,
      osUnitId: this.tsUnitIdField.parsedUnitId || null,
      unitId: this.tsUnitIdField.parsedUnitId || null,
      chkDigit: null,
      r1UnitId: this.red1Field?.parsedUnitId || null,
      r2UnitId: this.red2Field?.parsedUnitId || null,
      p1UnitId: this.purple1Field?.parsedUnitId || null,
      p2UnitId: this.purple2Field?.parsedUnitId || null,
      selectedTestIds: this.selectedTests().map(t => t.testId),
    };

    this.service.checkInUnit(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.isCheckingIn.set(false);
          this.showSuccess('Unit checked in successfully.');
          if (response.batchId && !this.filterForm.get('batchId')?.value) {
            const contractId = this.filterForm.get('contractId')?.value;
            if (contractId) {
              this.loadBatches(contractId);
            }
            this.filterForm.patchValue({ batchId: response.batchId });
          }
          this.clearScanFields();
          this.addUnitToSession(request, response);
          if (!this.isExistingBatch()) {
            this.isExistingBatch.set(true);
          }
        },
        error: () => {
          this.isCheckingIn.set(false);
        },
      });
  }

  private clearScanFields(): void {
    this.tsUnitIdField?.clear();
    this.red1Field?.clear();
    this.red2Field?.clear();
    this.purple1Field?.clear();
    this.purple2Field?.clear();
    this.validatedTsUnitId.set(null);
    this.validatedRed1.set(null);
    this.validatedRed2.set(null);
    this.validatedPurple1.set(null);
    this.validatedPurple2.set(null);
  }

  onDeleteUnit(event: TableRowActionEvent<AdhocBatchUnitDto>): void {
    if (event.action !== 'delete') return;
    this.showError('Delete is not supported in the current version.');
  }

  private addUnitToSession(request: AdhocCheckInRequestDto, response: AdhocCheckInResponseDto): void {
    const newUnit: AdhocBatchUnitDto = {
      unitId: response.unitId || request.unitId || '',
      displayUnitId: response.unitId || request.unitId || '',
      osUnitId: response.osUnitId || request.osUnitId || '',
      chkDigit: null,
      redTubeFlag: request.r1Num || null,
      redTube2: request.r2Num || null,
      purpleTubeFlag: request.p1Num || null,
      serumPlasmaInd: request.p2Num || null,
      collDate: request.collDate,
      receivedDate: request.receivedDate,
    };
    this.sessionUnits.update(units => [...units, newUnit]);
  }

  get currentBatchId(): string {
    return this.filterForm.get('batchId')?.value || '';
  }

  get currentChapterId(): string {
    return this.headerService.getCurrentChapterId() || '';
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }
}
