import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Subject, takeUntil, timeout, TimeoutError } from 'rxjs';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { DonorInterdictionsContentComponent } from '../../donor-interdictions/donor-interdictions-content.component';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import {
  UnitTestResultResponseDto,
  TestResultDto,
  RbcAntigenGroupDto,
  UNIT_TEST_RESULTS_VALIDATION_MESSAGES,
  EMPTY_STATE_MESSAGES
} from './models/unit-test-results-query.model';
import { UnitTestResultsQueryService } from './services/unit-test-results-query.service';

@Component({
  selector: 'app-unit-test-results-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    CdkTrapFocus,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DonorInterdictionsContentComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './unit-test-results-query.html',
  styleUrls: ['./unit-test-results-query.scss']
})
export class UnitTestResultsQueryComponent implements OnInit, AfterViewInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `unit-test-results-query-${UnitTestResultsQueryComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private destroy$ = new Subject<void>();
  private pendingUnitId: string | null = null;
  private shouldAutoRetrieve = false;

  private readonly unitTestResultsQueryService = inject(UnitTestResultsQueryService);
  private readonly menuService = inject(MenuService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly route = inject(ActivatedRoute);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  protected readonly unitTestResults = signal<UnitTestResultResponseDto | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasQueried = signal<boolean>(false);

  protected readonly hasResults = computed(() => this.hasQueried() && this.unitTestResults() !== null);

  protected readonly isInterdictionsPanelOpen = signal<boolean>(false);
  protected readonly interdictionsPanelDonorId = signal<string | null>(null);

  protected readonly showCollDatePicker = signal<boolean>(false);
  protected readonly displayCollDate = signal<string | null>(null);
  protected readonly collDateControl = new FormControl<Moment | null>(null, [
    DateFieldValidationUtility.validDateValidator()
  ]);

  protected readonly maxCollDate = computed(() => this.chapterTimezoneService.chapterLocalDate());

  readonly EMPTY_MESSAGES = EMPTY_STATE_MESSAGES;

  constructor() {
    // Defer menu lookup to avoid blocking constructor
    setTimeout(() => {
      const menuItem = this.menuService.findMenuItemByPath(
        ROUTE_REGISTRY[RouteKey.UnitTestResultsQuery].path
      );
      if (menuItem) {
        const navigationState = history.state;
        const fromBIPQ = !!navigationState?.fromBatchInProgressQuery;

        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: fromBIPQ
            ? [
                { label: 'Home', link: '/home' },
                {
                  label: 'Batch In-Progress Query',
                  link: '/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/batch-in-progress-query'
                },
                { label: menuItem.label, link: null }
              ]
            : [
                { label: 'Home', link: '/home' },
                { label: menuItem.label, link: null }
              ],
          title: menuItem.label,
          subtitle: menuItem.remarks || ''
        };
      }
    }, 0);
  }

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.pendingUnitId = this.route.snapshot.queryParamMap.get('unitId');
  }

  // Auto-retrieve is driven by onUnitValidated() after collection dates resolve,
  // not by a hardcoded timing delay.
  ngAfterViewInit(): void {
    if (this.pendingUnitId && this.unitIdField) {
      const unitId = this.pendingUnitId;
      this.pendingUnitId = null;
      this.shouldAutoRetrieve = true;
      this.loading.set(false);

      setTimeout(() => {
        this.unitIdField.unitIdControl.setValue(unitId);
        this.unitIdField.onBlur();
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetComponent();
      });
  }

  private resetComponent(): void {
    this.unitIdField?.unitIdControl.enable({ emitEvent: false });
    this.unitIdField?.clear();
    this.unitTestResults.set(null);
    this.hasQueried.set(false);
    this.error.set(null);
    this.shouldAutoRetrieve = false;
    this.resetCollDateState();
  }

  private resetCollDateState(): void {
    this.showCollDatePicker.set(false);
    this.displayCollDate.set(null);
    this.collDateControl.clearValidators();
    this.collDateControl.addValidators(DateFieldValidationUtility.validDateValidator());
    this.collDateControl.reset(null);
  }

  // Triggers auto-retrieve after collection dates resolve (single or no date)
  // instead of relying on a hardcoded 300ms delay.
  onUnitValidated(_data: UnitValidationResponse): void {
    const unitId = this.unitIdField?.parsedUnitId;
    if (!unitId) return;

    this.unitTestResultsQueryService.getCollectionDates(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.length > 1) {
            this.showCollDatePicker.set(true);
            this.collDateControl.reset(null);
            this.collDateControl.addValidators(Validators.required);
            this.collDateControl.updateValueAndValidity();
            this.displayCollDate.set(null);
            this.shouldAutoRetrieve = false; // user must pick a date first
          } else if (response.success && response.data?.length === 1) {
            this.showCollDatePicker.set(false);
            this.displayCollDate.set(response.data[0].collDate);
            if (this.shouldAutoRetrieve) {
              this.shouldAutoRetrieve = false;
              this.onRetrieve();
            }
          } else {
            this.showCollDatePicker.set(false);
            this.displayCollDate.set(null);
            if (this.shouldAutoRetrieve) {
              this.shouldAutoRetrieve = false;
              this.onRetrieve();
            }
          }
        },
        error: () => {
          this.showCollDatePicker.set(false);
          this.displayCollDate.set(null);
          this.shouldAutoRetrieve = false;
        }
      });
  }

  onUnitCleared(): void {
    this.unitTestResults.set(null);
    this.hasQueried.set(false);
    this.error.set(null);
    this.shouldAutoRetrieve = false;
    this.resetCollDateState();
  }

  onRetrieve(): void {
    if (this.loading()) {
      return;
    }

    if (!this.unitIdField?.isValid) {
      this.snackbarService.showError(UNIT_TEST_RESULTS_VALIDATION_MESSAGES.UNIT_ID_REQUIRED);
      return;
    }

    if (this.showCollDatePicker()) {
      this.collDateControl.markAsTouched();
      if (this.collDateControl.invalid) {
        this.snackbarService.showError(UNIT_TEST_RESULTS_VALIDATION_MESSAGES.COLL_DATE_REQUIRED);
        return;
      }
    }

    const unitId = this.unitIdField.parsedUnitId!;
    const collDateValue = this.collDateControl.value;
    // Pass the Moment directly — avoids a Moment→Date→Moment round-trip
    // that would re-interpret dates in the browser's local timezone.
    const collDate = collDateValue && moment.isMoment(collDateValue) && collDateValue.isValid()
      ? collDateValue
      : undefined;

    this.loading.set(true);
    this.error.set(null);

    const request$ = collDate
      ? this.unitTestResultsQueryService.queryUnitTestResults(unitId, collDate)
      : this.unitTestResultsQueryService.getUnitTestResultsByUnitId(unitId);

    request$
      .pipe(timeout(30000), takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          if (response.success && response.data && response.data.length > 0) {
            if (response.data.length > 1) {
              console.warn(`UnitTestResultsQueryComponent: expected 1 result for unit "${unitId}", received ${response.data.length}. Using first record.`);
            }
            this.unitTestResults.set(response.data[0]);
            this.hasQueried.set(true);
            this.unitIdField?.unitIdControl.disable({ emitEvent: false });
          } else {
            const noResultsMsg = UNIT_TEST_RESULTS_VALIDATION_MESSAGES.ERROR_9188;
            this.error.set(noResultsMsg);
            this.unitTestResults.set(null);
            this.hasQueried.set(true);
            this.snackbarService.showError(noResultsMsg);
          }
        },
        error: (err) => {
          this.loading.set(false);
          if (err instanceof TimeoutError) {
            const timeoutMsg = 'Request timed out. Please try again.';
            this.error.set(timeoutMsg);
            this.unitTestResults.set(null);
            this.hasQueried.set(true);
            this.snackbarService.showError(timeoutMsg);
            return;
          }
          this.handleApiError(err);
        }
      });
  }

  onClear(): void {
    this.unitIdField?.unitIdControl.enable({ emitEvent: false });
    this.unitIdField?.clear();
    this.unitTestResults.set(null);
    this.hasQueried.set(false);
    this.error.set(null);
    this.shouldAutoRetrieve = false;
    this.resetCollDateState();
  }

  openDonorInterdictionsPanel(): void {
    const result = this.unitTestResults();
    if (!result?.donorId) return;

    this.interdictionsPanelDonorId.set(result.donorId);
    this.isInterdictionsPanelOpen.set(true);
  }

  closeDonorInterdictionsPanel(): void {
    this.isInterdictionsPanelOpen.set(false);
    this.interdictionsPanelDonorId.set(null);
  }

  protected getGenderDisplay(gender: string | null): string {
    if (gender === 'M') return 'Male';
    if (gender === 'F') return 'Female';
    return gender || '-';
  }

  private handleApiError(err: any): void {
    const errorMessage = err?.error?.errorResponse?.error
      || err?.error?.message
      || err?.error?.error
      || UNIT_TEST_RESULTS_VALIDATION_MESSAGES.API_ERROR;

    this.error.set(errorMessage);
    this.unitTestResults.set(null);
    this.hasQueried.set(true);
    this.snackbarService.showError(errorMessage);
  }

  private static readonly RBC_ROWS = 5;
  private static readonly TEST_RESULTS_MIN_ROWS = 11;

  protected readonly rbcAntigensByGroup = computed<RbcAntigenGroupDto[]>(
    () => this.unitTestResults()?.rbcAntigens || []
  );

  protected readonly testResultRows = computed<TestResultDto[]>(() => {
    const results = this.unitTestResults()?.testResults || [];
    const padded = [...results];
    const emptyRow: TestResultDto = {
      testId: '-', resultCode: '-', formattedResult: '-',
      absorbance: null, cutOff: null, bandDetails: null
    };
    while (padded.length < UnitTestResultsQueryComponent.TEST_RESULTS_MIN_ROWS) {
      padded.push(emptyRow);
    }
    return padded;
  });

  protected readonly bandDetailRows = computed<{ bandName: string; bandValue: string; intensity: string }[]>(() => {
    const results = this.unitTestResults()?.testResults || [];
    const allBands: { bandName: string; bandValue: string; intensity: string }[] = [];

    for (const test of results) {
      if (test.bandDetails && test.bandDetails.length > 0) {
        for (const bd of test.bandDetails) {
          allBands.push({
            bandName: bd.bandName || '-',
            bandValue: bd.bandValue || '-',
            intensity: bd.intensity || '-'
          });
        }
      }
    }

    const testRowCount = this.testResultRows().length;
    while (allBands.length < testRowCount) {
      allBands.push({ bandName: '-', bandValue: '-', intensity: '-' });
    }

    return allBands;
  });

  protected readonly hlaRows = computed<{ testId: string | null; result: string | null }[]>(() => {
    const hla = this.unitTestResults()?.hlaAntigens;
    return [
      { testId: hla?.a1TestId || null, result: hla?.a1Result || null },
      { testId: hla?.a2TestId || null, result: hla?.a2Result || null },
      { testId: hla?.b1TestId || null, result: hla?.b1Result || null },
      { testId: hla?.b2TestId || null, result: hla?.b2Result || null },
    ];
  });

  // Column count comes from API response so extra/missing groups render correctly.
  protected readonly rbcGridRows = computed<{ testId: string | null; result: string | null }[][]>(() => {
    const groups = this.rbcAntigensByGroup();
    if (groups.length === 0) return [];

    const maxRows = groups.reduce(
      (max, g) => Math.max(max, g.tests.length),
      UnitTestResultsQueryComponent.RBC_ROWS
    );

    const rows: { testId: string | null; result: string | null }[][] = [];
    for (let r = 0; r < maxRows; r++) {
      rows.push(
        groups.map(g => {
          const test = g.tests[r] || null;
          return { testId: test?.testId || null, result: test?.result || null };
        })
      );
    }
    return rows;
  });
}
