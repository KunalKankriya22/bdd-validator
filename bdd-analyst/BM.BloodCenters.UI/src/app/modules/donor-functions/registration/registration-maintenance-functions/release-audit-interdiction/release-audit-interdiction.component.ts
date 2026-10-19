import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MAT_DATE_FORMATS, DateAdapter, ErrorStateMatcher, MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { ReleaseAuditInterdictionService } from './release-audit-interdiction.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { ReleaseInterdictionConfirmationDialogComponent } from './release-interdiction-confirmation-dialog.component';
import { RemoveInterdictionDialogComponent } from './remove-interdiction-dialog.component';
import { TerminatedInterdictionsDialogComponent } from './terminated-interdictions-dialog.component';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import {
  SearchOption,
  SearchRequest,
  SearchResponseData,
  Interdiction,
  ReleaseRequest,
  RemoveRequest
} from './release-audit-interdiction.models';

@Component({
  selector: 'app-release-audit-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatOptionModule,
    MatDatepickerModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] }
  ],
  templateUrl: './release-audit-interdiction.component.html',
  styleUrl: './release-audit-interdiction.component.scss'
})
export class ReleaseAuditInterdictionComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('collDateInput', { read: ElementRef }) collDateInputRef!: ElementRef<HTMLInputElement>;

  collDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.collDateInputRef?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ReleaseAuditInterdictionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: ''
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
          subtitle: pageData.subtitle
        };
      }
    });
  }

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly searchResults = signal<SearchResponseData | null>(null);
  readonly selectedOption = signal<SearchOption | ''>('');
  readonly collectionDate = signal<string>('');

  private static readonly UNIT_ID_MAX_LENGTH = 15;
  private static readonly DEFERRAL_ID_MAX_LENGTH = 10;

  readonly hasResults = computed(() => this.searchResults() !== null);
  readonly isDonationOption = computed(() => this.selectedOption() === 'donation');
  readonly isDeferralOption = computed(() => this.selectedOption() === 'deferral');
  readonly idMaxLength = computed(() =>
    this.isDeferralOption()
      ? ReleaseAuditInterdictionComponent.DEFERRAL_ID_MAX_LENGTH
      : ReleaseAuditInterdictionComponent.UNIT_ID_MAX_LENGTH
  );
  readonly formattedCollectionDate = computed(() => {
    const d = this.collectionDate();
    if (!d) return '';
    const m = moment(d, 'YYYY-MM-DD');
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : d;
  });

  searchForm!: FormGroup;

  interdictionTableConfig: DataTableConfig<Interdiction> = {
    columns: [
      { key: 'interCode', header: 'Code', sortable: true },
      { key: 'interType', header: 'Type' },
      { key: 'effectiveDate', header: 'Effective Date', valueFormatter: (v: string) => this.formatDate(v) },
      { key: 'terminationDate', header: 'Termination Date', valueFormatter: (v: string) => v ? this.formatDate(v) : '' },
      { key: 'releaseDate', header: 'Release Date', valueFormatter: (v: string) => v ? this.formatDate(v) : '' },
      { key: 'releasedUser', header: 'Released User' },
      { key: 'insertedUser', header: 'Inserted User' },
      { key: 'originated', header: 'Originated' },
      { key: 'reason', header: 'Reason' },
      { key: 'groupMode', header: 'Group Mode' },
      { key: 'groupId', header: 'Group ID' },
      { key: 'interDescription', header: 'Description' }
    ],
    rowActions: [
      {
        action: 'release',
        label: 'RELEASE',
        icon: 'lock_open',
        color: 'primary',
        visible: (row: Interdiction) => row.canRelease
      }
    ],
    sortConfig: { column: '', direction: 'default' as const },
    showPagination: false,
    stickyHeader: true,
    stickyActionsColumn: true,
    emptyMessage: 'No interdictions found.',
    enableRowHighlight: false
  };

  readonly sortedInterdictions = signal<Interdiction[]>([]);

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
    this.searchForm.get('id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val: string) => {
        if (this.deferralMismatch() && val) {
          this.deferralMismatch.set(false);
        }
      });
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onClear());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  readonly deferralMismatch = signal<boolean>(false);
  readonly deferralStep = signal<'enter' | 'confirm'>('enter');
  private firstDeferralEntry = '';

  private initForm(): void {
    this.searchForm = this.fb.group({
      option: ['', [Validators.required]],
      id: ['', [Validators.required, Validators.maxLength(ReleaseAuditInterdictionComponent.UNIT_ID_MAX_LENGTH)]],
      collDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]]
    });
  }

  private setupFormListeners(): void {
    this.searchForm.get('option')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((option: SearchOption) => {
        this.selectedOption.set(option);
        const idControl = this.searchForm.get('id') as AbstractControl;

        if (option === 'donation') {
          idControl.clearValidators();
        } else {
          idControl.setValidators([
            Validators.required,
            Validators.maxLength(ReleaseAuditInterdictionComponent.DEFERRAL_ID_MAX_LENGTH)
          ]);
        }

        idControl.setValue('', { emitEvent: false });
        idControl.updateValueAndValidity();
        this.resetDeferralState();
        this.unitIdField?.clear();
        this.clearResults();
      });
  }

  private resetDeferralState(): void {
    this.deferralStep.set('enter');
    this.deferralMismatch.set(false);
    this.firstDeferralEntry = '';
  }

  get f() {
    return this.searchForm.controls;
  }

  onDateInputBlur(controlName: string): void {
    const control = this.searchForm.get(controlName);
    if (!control) return;
    if (control.value && control.valid) {
      const currentValue = control.value;
      control.setValue(currentValue, { emitEvent: false });
      control.updateValueAndValidity();
    }
  }

  getCollDateError(): string {
    const control = this.searchForm.get('collDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'Collection Date is invalid';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate'))
      return 'Collection Date is invalid';
    const inputValue = this.collDateInputRef?.nativeElement?.value;
    if (!control.value && inputValue && inputValue.trim().length > 0)
      return 'Collection Date is invalid';
    return '';
  }

  onUnitValidated(_data: UnitValidationResponse): void {
    // Unit ID validated — retrieve button enables via unitIdField.isValid
  }

  deferralFocusHack(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const formValue = this.searchForm.get('id')?.value || '';
    if (input.value && input.value !== formValue) {
      input.value = formValue;
    }
  }

  onUnitCleared(): void {
    this.clearResults();
  }

  private stripBarcodeCodes(value: string): string {
    if (!value) return value;
    return value.replace(/[\x00-\x1F\x7F]/g, '').trim();
  }

  onRetrieve(): void {
    const option = this.searchForm.get('option')?.value as SearchOption;

    if (option === 'donation') {
      if (!this.unitIdField?.isValid) return;
    } else {
      if (this.searchForm.invalid) {
        this.searchForm.markAllAsTouched();
        return;
      }

      const currentValue = this.stripBarcodeCodes(this.searchForm.get('id')?.value as string || '');

      const idControl = this.searchForm.get('id');

      if (this.deferralStep() === 'enter') {
        this.firstDeferralEntry = currentValue;
        this.deferralStep.set('confirm');
        this.deferralMismatch.set(false);
        idControl?.setValue('', { emitEvent: false });
        idControl?.markAsUntouched();
        return;
      }

      if (currentValue !== this.firstDeferralEntry) {
        this.deferralMismatch.set(true);
        idControl?.setValue('', { emitEvent: false });
        idControl?.markAsUntouched();
        return;
      }
      this.deferralMismatch.set(false);
    }

    const request: SearchRequest = { option };

    if (option === 'donation') {
      request.unitId = this.unitIdField.parsedUnitId!;
      const collDateVal = this.searchForm.get('collDate')?.value;
      if (collDateVal) {
        request.collDate = DateFieldValidationUtility.serializeDateForApi(collDateVal) ?? undefined;
      }
    } else {
      request.deferralId = this.firstDeferralEntry;
    }

    this.loading.set(true);
    this.error.set(null);

    this.service.search(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.searchResults.set(data);
          this.sortedInterdictions.set(data.interdictions || []);
          this.collectionDate.set(data.donationInfo?.collectionDate || '');
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.formatErrorMessage(err, 'Failed to retrieve data'));
          this.searchResults.set(null);
          this.loading.set(false);
        }
      });
  }

  onInterdictionSort(event: TableSortEvent): void {
    this.interdictionTableConfig = {
      ...this.interdictionTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };

    if (event.direction === 'default') {
      this.sortedInterdictions.set(this.searchResults()?.interdictions ?? []);
      return;
    }

    const dir = event.direction === 'D' ? -1 : 1;
    const sorted = [...this.sortedInterdictions()].sort((a, b) => {
      const valA = (a[event.column as keyof Interdiction] ?? '').toString().toLowerCase();
      const valB = (b[event.column as keyof Interdiction] ?? '').toString().toLowerCase();
      return valA.localeCompare(valB, undefined, { numeric: true }) * dir;
    });
    this.sortedInterdictions.set(sorted);
  }

  onInterdictionAction(event: TableRowActionEvent<Interdiction>): void {
    if (event.action === 'release') {
      this.onRelease(event.row);
    } else if (event.action === 'remove') {
      this.onRemove(event.row);
    }
  }

  onRelease(interdiction: Interdiction): void {
    const dialogRef = this.dialog.open(ReleaseInterdictionConfirmationDialogComponent, {
      width: '490px',
      maxWidth: '90vw',
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'release-interdiction-confirm-dialog',
      data: { interdiction }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result === true) {
          this.performRelease(interdiction);
        }
      });
  }

  private performRelease(interdiction: Interdiction): void {
    const results = this.searchResults();
    if (!results) return;

    const request: ReleaseRequest = {
      transactionId: results.transactionId,
      interCode: interdiction.interCode,
      interType: interdiction.interType,
      terminationDate: interdiction.terminationDate || null,
      originatedFrom: interdiction.originated || null,
      reasonCode: interdiction.reason || null,
      groupId: interdiction.groupId || null,
      groupMode: interdiction.groupMode || null
    };

    this.loading.set(true);

    this.service.release(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.open('Released successfully', 'DISMISS', {
            duration: 0,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.onRetrieve();
        },
        error: (err) => {
          this.loading.set(false);
          this.snackBar.open(
            this.formatErrorMessage(err, 'Failed to release interdiction'),
            'Close',
            {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            }
          );
        }
      });
  }

  onRemove(interdiction: Interdiction): void {
    const dialogRef = this.dialog.open(RemoveInterdictionDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      hasBackdrop: true,
      disableClose: true,
      data: { interdiction, reasonRequired: interdiction.reasonRequired }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.confirmed) {
          this.performRemove(interdiction, result.reasonCode, result.termDate);
        }
      });
  }

  private performRemove(interdiction: Interdiction, removalReasonCode: string | null, termDate: string): void {
    const results = this.searchResults();
    if (!results) return;

    const request: RemoveRequest = {
      transactionId: results.transactionId,
      interCode: interdiction.interCode,
      originatedFrom: interdiction.originated || null,
      reasonCode: interdiction.reason || null,
      groupMode: interdiction.groupMode || null,
      groupId: interdiction.groupId || null,
      unitId: results.donationInfo?.driveId ? null : null,
      deferralId: null,
      collDate: results.donationInfo?.collectionDate || null,
      termDate,
      removalReasonCode
    };

    this.loading.set(true);

    this.service.remove(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.open('Interdiction removed successfully', 'DISMISS', {
            duration: 0,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.onRetrieve();
        },
        error: (err) => {
          this.loading.set(false);
          this.snackBar.open(
            this.formatErrorMessage(err, 'Failed to remove interdiction'),
            'Close',
            { horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] }
          );
        }
      });
  }

  onShowTerminated(): void {
    const results = this.searchResults();
    if (!results) return;

    const dialogRef = this.dialog.open(TerminatedInterdictionsDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      hasBackdrop: true,
      data: { transactionId: results.transactionId }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.action === 'release') {
          this.performRelease(result.interdiction);
        }
      });
  }

  onClear(): void {
    this.searchForm.reset({
      option: '',
      id: ''
    });
    this.selectedOption.set('');
    this.resetDeferralState();
    this.unitIdField?.clear();
    this.clearResults();
  }

  private clearResults(): void {
    this.searchResults.set(null);
    this.collectionDate.set('');
    this.searchForm.get('collDate')?.reset(null);
    this.error.set(null);
  }

  formatDate(dateString: string): string {
    const m = moment(dateString, 'YYYY-MM-DD');
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  private formatErrorMessage(err: { error?: { errorCode?: string; message?: string; errorResponse?: { error?: string } }; message?: string }, fallback: string): string {
    const errorCode = err?.error?.errorCode;
    const message = err?.error?.message || err?.error?.errorResponse?.error || err?.message || fallback;
    return errorCode ? `Err:${errorCode} - ${message}` : message;
  }
}
