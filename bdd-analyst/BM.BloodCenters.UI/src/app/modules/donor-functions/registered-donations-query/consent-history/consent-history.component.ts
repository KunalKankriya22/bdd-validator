import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  inject,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { UnitIdFormatUtility } from '@shared/components/unit-id-field/unit-id-format.utility';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';

import { ConsentHistoryService } from './services/consent-history.service';
import { ConsentDetailDialogComponent } from './components/consent-detail-dialog/consent-detail-dialog.component';
import {
  ConsentHistoryDto,
  ConsentHistoryQueryDto,
  ConsentDetailDialogData,
} from './models/consent-history.model';

@Component({
  selector: 'app-consent-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatButtonModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './consent-history.component.html',
  styleUrls: ['./consent-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE, ChapterTimezoneService] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class ConsentHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(DataTable) dataTableComponent!: DataTable<ConsentHistoryDto>;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private destroy$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ConsentHistoryService);
  private readonly headerService = inject(HeaderService);
  private readonly menuService = inject(MenuService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    showBackButton: true,
    onBackClick: () => this.onBack(),
  };

  tableConfig: DataTableConfig<ConsentHistoryDto> = {
    columns: [
      { key: 'chapterId', header: 'Chp', sortable: false, type: 'text', minWidth: '60px', valueFormatter: (v: string) => v || '--' },
      { key: 'unitId', header: 'Unit ID', sortable: false, type: 'text', minWidth: '200px', valueFormatter: (v: string | null) => this.formatUnitIdForDisplay(v) },
      { key: 'deferralId', header: 'Deferrals ID', sortable: false, type: 'text', minWidth: '110px', valueFormatter: (v: string | null) => v || '--' },
      { key: 'collDate', header: 'Collection Date', sortable: false, type: 'text', minWidth: '130px', valueFormatter: (v: string | null) => this.formatDate(v) },
      { key: 'letterCode', header: 'Letter Code', sortable: false, type: 'text', minWidth: '110px', valueFormatter: (v: string | null) => v || '--' },
      { key: 'signatureDate', header: 'Signature Date', sortable: false, type: 'text', minWidth: '130px', valueFormatter: (v: string | null) => this.formatDate(v) },
      { key: 'witness', header: 'Witness', sortable: false, type: 'text', minWidth: '90px', valueFormatter: (v: string | null) => v || '--' },
      { key: 'manualSignatureDate', header: 'Manual Signature Date', sortable: false, type: 'text', minWidth: '160px', valueFormatter: (v: string | null) => this.formatDate(v) },
      { key: 'status', header: 'Status', sortable: false, type: 'text', minWidth: '90px', valueFormatter: (v: string | null) => v || '--' },
    ],
    rowActions: [
      { icon: 'visibility', action: 'viewDetail', ariaLabel: 'View consent detail' },
    ],
    showActionsAsMenu: false,
    enableRowHighlight: false,
    stickyHeader: true,
    emptyMessage: 'No consent history records available to display',
    loadingMessage: 'Loading consent history...',
  };

  filterForm!: FormGroup;
  dataSource: ConsentHistoryDto[] = [];
  isLoading = false;
  hasRetrievedData = false;
  isDialogOpen = false;
  donorId = '';
  donorName = '';
  donorAddress = '';
  isAutoLoaded = false;
  filtersChanged = false;
  private initialUnitId: string | null = null;
  private initialCollectionDate: string | null = null;
  private sourceLabel: string | null = null;
  private sourcePath: string | null = null;
  private sourceDonorId: string | null = null;
  private fromDonorDetailQuery = false;

  constructor() {
    this.initializeForm();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        if (this.fromDonorDetailQuery) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: 'Donor Detail Query', link: ROUTE_REGISTRY[RouteKey.DonorDetailQuery].path },
              { label: this.donorId || '', link: null },
            ],
          };
        } else {
          const label = this.sourceLabel;
          const path = this.sourcePath;
          if (label && path) {
            this.headerConfig = {
              ...this.headerConfig,
              breadcrumbs: [
                { label: 'Home', link: '/home' },
                { label, link: path },
                { label: 'Donations', link: path },
                { label: this.donorId || '', link: null },
              ],
            };
          } else {
            const basePath = ROUTE_REGISTRY[RouteKey.RegisteredDonationsQuery]?.path;
            const menuItem = basePath ? this.menuService.findMenuItemByPath(basePath) : null;
            if (menuItem) {
              this.headerConfig = {
                ...this.headerConfig,
                breadcrumbs: [
                  { label: 'Home', link: '/home' },
                  { label: menuItem.label, link: basePath },
                  { label: this.donorId || '', link: null },
                ],
              };
            }
          }
        }
      }
    });
  }

  ngOnInit(): void {
    const state = window.history.state;
    if (!state?.donorId) {
      this.router.navigate([ROUTE_REGISTRY[RouteKey.RegisteredDonationsQuery].path]);
      return;
    }

    this.donorId = state.donorId;
    this.initialUnitId = state.unitId || null;
    this.initialCollectionDate = state.collectionDate || null;
    this.sourceLabel = state.sourceLabel || null;
    this.sourcePath = state.sourcePath || null;
    this.sourceDonorId = state.donorId || null;
    this.fromDonorDetailQuery = !!state.fromDonorDetailQuery;
    if (this.fromDonorDetailQuery) {
      this.sourcePath = ROUTE_REGISTRY[RouteKey.DonorDetailQuery].path;
    }
    this.loadDonorInfo();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    if (this.fromDonorDetailQuery && !this.initialUnitId && !this.initialCollectionDate) {
      this.loadData();
      this.subscribeToFilterChanges();
      this.cdr.markForCheck();
      return;
    }

    if (!this.initialUnitId && !this.initialCollectionDate) return;

    if (this.initialCollectionDate) {
      const collDate = moment(this.initialCollectionDate);
      if (collDate.isValid()) {
        this.filterForm.patchValue(
          { collDateFrom: collDate, collDateTo: collDate.clone() },
          { emitEvent: false }
        );
      }
    }

    if (this.initialUnitId && this.unitIdField) {
      const trimmed = this.initialUnitId.trim();
      let displayValue = trimmed;
      if (trimmed.length === 13) {
        const checkDigit = UnitIdFormatUtility.calculateISBTCheckDigit(trimmed);
        displayValue = UnitIdFormatUtility.formatCode128(trimmed + checkDigit);
      }
      this.unitIdField.unitIdControl.setValue(displayValue, { emitEvent: false });
    }

    this.loadData();
    this.subscribeToFilterChanges();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isRetrieveDisabled(): boolean {
    return this.isLoading ||
      this.filterForm.invalid ||
      this.unitIdField?.validationState === 'validating' ||
      this.unitIdField?.validationState === 'invalid' ||
      (this.isAutoLoaded && !this.filtersChanged);
  }

  get isClearAllDisabled(): boolean {
    const form = this.filterForm.value;
    const hasFormValues = !!(form.collDateFrom || form.collDateTo || form.deferralId);
    const hasUnitId = !!(this.unitIdField?.parsedUnitId || this.unitIdField?.unitIdControl?.value);
    return !hasFormValues && !hasUnitId;
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;

    const fromControl = this.filterForm.get('collDateFrom');
    const toControl = this.filterForm.get('collDateTo');
    const from = fromControl?.value;
    const to = toControl?.value;

    if (from && !to) {
      this.addDateError(toControl, 'requiredWithPair');
      return;
    }
    if (!from && to) {
      this.addDateError(fromControl, 'requiredWithPair');
      return;
    }

    this.loadData();
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.unitIdField?.clear();
    this.dataSource = [];
    this.hasRetrievedData = false;
    this.isAutoLoaded = false;
    this.filtersChanged = false;
    this.initialUnitId = null;
    this.cdr.markForCheck();
  }

  onFromDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.filterForm.get('collDateFrom')
    );
  }

  onToDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.filterForm.get('collDateTo')
    );
  }

  onUnitValidated(_data: UnitValidationResponse): void {
    if (this.isAutoLoaded) {
      this.filtersChanged = true;
      this.initialUnitId = null;
    }
  }

  onUnitCleared(): void {
    if (this.isAutoLoaded) {
      this.filtersChanged = true;
      this.initialUnitId = null;
    }
  }

  onRowAction(event: TableRowActionEvent<ConsentHistoryDto>): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.activeRow = event.row;
    }
    if (event.action === 'viewDetail') {
      this.isDialogOpen = true;
      this.cdr.markForCheck();

      const dialogRef = this.dialog.open(ConsentDetailDialogComponent, {
        panelClass: 'consent-detail-right-dialog',
        width: '740px',
        maxWidth: '100vw',
        height: '100vh',
        position: { right: '0' },
        data: {
          donorId: event.row.donorId,
          transactionId: event.row.transactionId,
          letterId: event.row.letterId,
        } as ConsentDetailDialogData,
        disableClose: true,
        autoFocus: false,
      });

      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.isDialogOpen = false;
        if (this.dataTableComponent) {
          this.dataTableComponent.activeRow = null;
        }
        (document.activeElement as HTMLElement)?.blur();
        this.cdr.markForCheck();
      });
    }
  }

  onBack(): void {
    const path = this.sourcePath || ROUTE_REGISTRY[RouteKey.RegisteredDonationsQuery].path;
    if (this.sourceDonorId && this.sourcePath) {
      this.router.navigate([path], { state: { reopenDonorId: this.sourceDonorId } });
    } else {
      this.router.navigate([path]);
    }
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      collDateFrom: [null],
      collDateTo: [null],
      deferralId: [null],
    });

    this.filterForm.get('collDateFrom')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDates());

    this.filterForm.get('collDateTo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDates());
  }

  private validateDates(): void {
    const fromControl = this.filterForm.get('collDateFrom');
    const toControl = this.filterForm.get('collDateTo');

    this.clearCustomDateErrors(fromControl);
    this.clearCustomDateErrors(toControl);

    if (fromControl?.hasError('matDatepickerParse') || toControl?.hasError('matDatepickerParse')) return;

    const from = fromControl?.value;
    const to = toControl?.value;
    const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
    const todayStr = chapterToday.format('YYYY-MM-DD');

    if (from) {
      const fromStr = DateFieldValidationUtility.serializeDateForApi(from);
      if (fromStr && fromStr > todayStr) {
        this.addDateError(fromControl, 'futureDate');
      }
    }

    if (to) {
      const toStr = DateFieldValidationUtility.serializeDateForApi(to);
      if (toStr && toStr > todayStr) {
        this.addDateError(toControl, 'futureDate');
      }
    }

    if (from && to && !fromControl?.hasError('futureDate') && !toControl?.hasError('futureDate')) {
      const fromStr = DateFieldValidationUtility.serializeDateForApi(from);
      const toStr = DateFieldValidationUtility.serializeDateForApi(to);
      if (fromStr && toStr && fromStr > toStr) {
        this.addDateError(fromControl, 'fromAfterTo');
      }
    }
  }

  private clearCustomDateErrors(control: AbstractControl | null): void {
    if (!control?.errors) return;
    const errors = { ...control.errors };
    delete errors['futureDate'];
    delete errors['fromAfterTo'];
    delete errors['requiredWithPair'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  private addDateError(control: AbstractControl | null, errorKey: string): void {
    if (!control) return;
    control.setErrors({ ...control.errors, [errorKey]: true });
    control.markAsTouched();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dataSource = [];
        this.hasRetrievedData = false;
        this.cdr.markForCheck();
      });
  }

  private loadDonorInfo(): void {
    this.service
      .getDonorInfo(this.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          if (info) {
            this.donorName = info.donorName;
            this.donorAddress = info.address || '';
            this.headerConfig = {
              ...this.headerConfig,
              title: this.donorName.toUpperCase(),
              subtitle: '',
            };
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.headerConfig = {
            ...this.headerConfig,
            title: this.donorId,
            subtitle: '',
          };
          this.cdr.markForCheck();
        },
      });
  }

  private loadData(): void {
    this.isLoading = true;
    this.hasRetrievedData = false;
    this.cdr.markForCheck();

    const form = this.filterForm.value;

    const query: ConsentHistoryQueryDto = {
      donorId: this.donorId,
      fromDate: form.collDateFrom ? DateFieldValidationUtility.serializeDateForApi(form.collDateFrom) : null,
      toDate: form.collDateTo ? DateFieldValidationUtility.serializeDateForApi(form.collDateTo) : null,
      unitId: this.unitIdField?.parsedUnitId || this.initialUnitId || null,
      deferralId: form.deferralId?.trim() || null,
    };

    this.service
      .queryConsentHistory(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.dataSource = result.data;
          this.isLoading = false;
          this.hasRetrievedData = true;
          if (!this.isAutoLoaded && (this.initialUnitId || this.initialCollectionDate)) {
            this.isAutoLoaded = true;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.dataSource = [];
          this.isLoading = false;
          this.hasRetrievedData = true;
          if (!this.isAutoLoaded && (this.initialUnitId || this.initialCollectionDate)) {
            this.isAutoLoaded = true;
          }
          this.cdr.markForCheck();
        },
      });
  }

  private subscribeToFilterChanges(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isAutoLoaded) {
          this.filtersChanged = true;
        }
      });
  }

  private formatDate(dateStr: string | null): string {
    if (!dateStr) return '--';
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '--';
  }

  private formatUnitIdForDisplay(unitId: string | null): string {
    if (!unitId) return '--';
    let id = unitId.trim();
    if (id.length === 13) {
      const checkDigit = UnitIdFormatUtility.calculateISBTCheckDigit(id);
      id = id + checkDigit;
    }
    return UnitIdFormatUtility.formatCode128(id);
  }
}
