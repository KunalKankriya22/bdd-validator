import { Component, OnInit, OnDestroy, signal, effect, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { A11yModule } from '@angular/cdk/a11y';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';
import { DonorInterdictionsContentComponent } from '../../donor-interdictions/donor-interdictions-content.component';
import { DonorDemographicsComponent } from '../../../donor-demographics/donor-demographics';
import { DonorAttributesComponent } from '../../donor-profile-maintenance/donor-attributes/donor-attributes.component';
import { DonorCommunicationsComponent } from '@shared/components/donor-communications/donor-communications';
import { DonationDetailsDialogComponent } from '../../donation-details/donation-details-dialog/donation-details-dialog';
import { DonationDetailsData } from '../../donation-details/models/donation-details.model';
import { MultipleDonorsQueryService } from './services/multiple-donors-query.service';
import {
  DonorSearchResult,
  MultipleDonorsSearchRequest,
  MDONQ_VALIDATION,
  MDONQ_ERROR_MESSAGES
} from './models/multiple-donors-query.model';

@Component({
  selector: 'app-multiple-donors-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
    A11yModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DonorInterdictionsContentComponent,
    DonorDemographicsComponent,
    DonorAttributesComponent,
    DonorCommunicationsComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: MatPaginatorIntl, useFactory: () => { const intl = new MatPaginatorIntl(); intl.itemsPerPageLabel = 'Rows per page:'; return intl; } }
  ],
  templateUrl: './multiple-donors-query.html',
  styleUrls: ['./multiple-donors-query.scss']
})
export class MultipleDonorsQuery implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MultipleDonorsQueryService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dialog = inject(MatDialog);

  private destroy$ = new Subject<void>();

  @ViewChild('dobInput', { read: ElementRef }) dobInput!: ElementRef<HTMLInputElement>;
  @ViewChild('collDateInput', { read: ElementRef }) collDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' }
    ],
    title: '',
    subtitle: ''
  };

  searchForm!: FormGroup;

  dataSource: DonorSearchResult[] = [];
  isLoading = signal<boolean>(false);
  hasSearched = signal<boolean>(false);

  expandedRows = new Set<string>();
  activeMenuRowId = signal<string | null>(null);
  selectedRowId = signal<string | null>(null);

  sidePanelOpen = signal<boolean>(false);
  sidePanelWidth = signal<string>('70vw');
  sidePanelRow = signal<DonorSearchResult | null>(null);
  currentSection = signal<'interdictions' | 'demographics' | 'attributes' | 'communications' | null>(null);

  pageSize = 25;
  pageIndex = 0;
  totalRecords = 0;
  pageSizeOptions = [10, 25, 50, 100];

  currentSortColumn = 'DonorName';
  currentSortDirection: 'ASC' | 'DESC' = 'DESC';

  displayedColumns: string[] = [
    'expand', 'donorName', 'dateOfBirth', 'sex', 'abo',
    'units', 'credits', 'gallons', 'lastDonationDate',
    'lastDonationUnitId', 'actions'
  ];

  rowMenuActions = [
    { action: 'alternateAddress', label: 'Alternate Address' },
    { action: 'communicationLog', label: 'Communication Log' },
    { action: 'attributes', label: 'Attributes' },
    { action: 'interdictions', label: 'Interdictions' },
    { action: 'donations', label: 'Donations' },
    { action: 'demographics', label: 'Demographics' }
  ];

  lastNameOptions = [
    { value: 'Like', label: 'Like' },
    { value: 'Soundex', label: 'Soundex' },
    { value: 'Exact', label: 'Exact' }
  ];

  sexOptions = [
    { value: 'Either', label: 'Either' },
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' }
  ];

  maxDate!: Moment;

  dobErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.dobInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  collDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.collDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  constructor() {
    this.initForm();

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
          subtitle: pageData.subtitle || 'View Multiple Donors Query'
        };
      }
    });

    effect(() => {
      const chapterDate = this.chapterTimezoneService.chapterLocalDate();
      if (chapterDate && chapterDate.isValid()) {
        this.maxDate = chapterDate.clone().startOf('day');
      }
    });
  }

  ngOnInit(): void {
    this.maxDate = this.chapterTimezoneService.getChapterLocalDate();
    this.subscribeToChapterChanges();
    this.setupDateValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      lastName: [''],
      lastNameOption: ['Like'],
      dob: [null, [DateFieldValidationUtility.validDateValidator()]],
      sex: ['Either'],
      firstName: [''],
      phoneNumber: [''],
      donorId: [''],
      previousDonorId: [''],
      collectionDate: [null, [DateFieldValidationUtility.validDateValidator()]]
    });
  }

  private setupDateValidation(): void {
    this.searchForm.get('dob')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDateInput('dob', this.dobInput));

    this.searchForm.get('collectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDateInput('collectionDate', this.collDateInput));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetComponent();
      });
  }

  onDobBlur(): void {
    setTimeout(() => {
      const control = this.searchForm.get('dob');
      control?.markAsTouched();
      this.validateDateInput('dob', this.dobInput);
      control?.updateValueAndValidity();
    }, 0);
  }

  onCollDateBlur(): void {
    setTimeout(() => {
      const control = this.searchForm.get('collectionDate');
      control?.markAsTouched();
      this.validateDateInput('collectionDate', this.collDateInput);
      control?.updateValueAndValidity();
    }, 0);
  }

  getDobError(): string {
    return this.getDateError('dob', 'Date of Birth', this.dobInput);
  }

  getCollDateError(): string {
    return this.getDateError('collectionDate', 'Collection Date', this.collDateInput);
  }

  private getDateError(controlName: string, label: string, inputRef: ElementRef<HTMLInputElement>): string {
    const control = this.searchForm.get(controlName);
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
    return '';
  }

  private validateDateInput(controlName: string, inputRef: ElementRef<HTMLInputElement>): void {
    const control = this.searchForm.get(controlName);
    const inputValue = inputRef?.nativeElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  onRetrieve(): void {
    if (this.getDobError() || this.getCollDateError() || this.getPhoneError()) {
      return;
    }

    const error = this.validateForm();
    if (error) {
      this.snackbarService.showError(error);
      return;
    }

    this.pageIndex = 0;
    this.expandedRows.clear();
    this.executeSearch();
  }

  private executeSearch(): void {
    const params = this.buildSearchRequest();

    this.isLoading.set(true);
    this.hasSearched.set(true);

    this.service.searchDonors(params, this.pageSize, this.pageIndex * this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalRecords = response.totalRecords;
          this.isLoading.set(false);

          if (response.data.length === 0) {
            this.snackbarService.showError(MDONQ_ERROR_MESSAGES.NO_RESULTS);
          }
        },
        error: (err) => {
          this.dataSource = [];
          this.totalRecords = 0;
          this.isLoading.set(false);

          const msg = err?.displayMessage || '';
          if (msg) {
            this.snackbarService.showError(msg);
          } else if (err?.status === 400) {
            this.snackbarService.showError(MDONQ_ERROR_MESSAGES.TOO_MANY_RESULTS);
          } else if (err?.status === 404) {
            this.snackbarService.showError(MDONQ_ERROR_MESSAGES.NO_RESULTS);
          } else {
            this.snackbarService.showError(MDONQ_ERROR_MESSAGES.LOAD_ERROR);
          }
        }
      });
  }

  private buildSearchRequest(): MultipleDonorsSearchRequest {
    const form = this.searchForm.getRawValue();

    const searchModeMap: Record<string, 'LIKE' | 'SOUNDEX' | 'EXACT'> = {
      'Like': 'LIKE', 'Soundex': 'SOUNDEX', 'Exact': 'EXACT'
    };
    const genderMap: Record<string, 'M' | 'F' | 'E'> = {
      'Either': 'E', 'Male': 'M', 'Female': 'F'
    };

    const request: MultipleDonorsSearchRequest = {};

    if (form.lastName?.trim()) {
      request.lastName = form.lastName.trim().toUpperCase();
      request.searchMode = searchModeMap[form.lastNameOption] || 'LIKE';
    }
    if (form.firstName?.trim()) {
      request.firstName = form.firstName.trim().toUpperCase();
    }
    if (form.dob) {
      request.dateOfBirth = DateFieldValidationUtility.serializeDateForApi(form.dob) || undefined;
    }
    request.gender = genderMap[form.sex] || 'E';
    if (form.phoneNumber?.trim()) {
      request.phone = form.phoneNumber.trim().replace(/-/g, '');
    }
    if (form.donorId?.trim()) {
      request.donorId = form.donorId.trim();
    }
    if (form.previousDonorId?.trim()) {
      request.previousDonorId = form.previousDonorId.trim();
    }
    if (form.collectionDate) {
      request.collectionDate = DateFieldValidationUtility.serializeDateForApi(form.collectionDate) || undefined;
    }
    if (this.unitIdField?.parsedUnitId) {
      request.unitId = this.unitIdField.parsedUnitId;
    }

    request.sortColumn = this.currentSortColumn;
    request.sortDirection = this.currentSortDirection;

    return request;
  }

  private validateForm(): string | null {
    const form = this.searchForm.getRawValue();

    const hasAnyCriteria = form.lastName?.trim() || form.firstName?.trim() ||
      form.dob || form.phoneNumber?.trim() || form.donorId?.trim() ||
      form.previousDonorId?.trim() || form.collectionDate || this.unitIdField?.parsedUnitId;

    if (!hasAnyCriteria) {
      return null;
    }

    if (form.donorId?.trim() && form.donorId.trim().length > MDONQ_VALIDATION.MAX_DONOR_ID) {
      return MDONQ_ERROR_MESSAGES.DONOR_ID_MAX;
    }

    return null;
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.expandedRows.clear();
    this.loadData();
  }

  onSortChange(): void {
    this.currentSortDirection = this.currentSortDirection === 'DESC' ? 'ASC' : 'DESC';
    this.pageIndex = 0;
    this.loadData();
  }

  getSortIcon(): string {
    return this.currentSortDirection === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  private loadData(): void {
    const params = this.buildSearchRequest();

    this.isLoading.set(true);

    this.service.searchDonors(params, this.pageSize, this.pageIndex * this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalRecords = response.totalRecords;
          this.isLoading.set(false);
        },
        error: () => {
          this.dataSource = [];
          this.totalRecords = 0;
          this.isLoading.set(false);
          this.snackbarService.showError(MDONQ_ERROR_MESSAGES.LOAD_ERROR);
        }
      });
  }

  toggleRow(donorId: string): void {
    if (this.expandedRows.has(donorId)) {
      this.expandedRows.delete(donorId);
    } else {
      this.expandedRows.add(donorId);
    }
  }

  isRowExpanded(donorId: string): boolean {
    return this.expandedRows.has(donorId);
  }

  toggleAllRows(): void {
    if (this.isAllExpanded()) {
      this.expandedRows.clear();
    } else {
      this.dataSource.forEach(row => this.expandedRows.add(row.donorId));
    }
  }

  isAllExpanded(): boolean {
    return this.dataSource.length > 0 && this.expandedRows.size === this.dataSource.length;
  }

  onRowAction(action: string, row: DonorSearchResult): void {
    this.selectedRowId.set(row.donorId);
    switch (action) {
      case 'alternateAddress':
        this.openAlternateAddress(row);
        break;
      case 'communicationLog':
        this.openSidePanel('communications', row);
        break;
      case 'interdictions':
      case 'demographics':
      case 'attributes':
        this.openSidePanel(action as 'interdictions' | 'demographics' | 'attributes', row);
        break;
      case 'donations':
        this.openDonationDetailsDialog(row.donorId);
        break;
    }
  }

  private openAlternateAddress(row: DonorSearchResult): void {
    const dialogData: AlternateDemographicsDialogData = {
      donorId: row.donorId,
      readOnly: false,
    };

    this.dialog.open(AlternateDemographicsDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: dialogData,
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private openSidePanel(section: 'interdictions' | 'demographics' | 'attributes' | 'communications', row: DonorSearchResult): void {
    this.sidePanelRow.set(row);
    this.currentSection.set(section);
    this.sidePanelWidth.set('70vw');
    this.sidePanelOpen.set(true);
  }

  private openDonationDetailsDialog(donorId: string): void {
    this.dialog.open(DonationDetailsDialogComponent, {
      width: '1400px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      disableClose: false,
      data: {
        donorId,
        sourceLabel: this.headerConfig.title,
      } as DonationDetailsData,
    });
  }

  getSidePanelLabel(): string {
    const section = this.currentSection();
    const labels: Record<string, string> = {
      interdictions: 'Donor Interdictions',
      demographics: 'Donor Demographics',
      attributes: 'Donor Attributes',
      communications: 'Communication Log'
    };
    return labels[section ?? ''] ?? 'Donor details';
  }

  onPanelClose(): void {
    this.sidePanelOpen.set(false);
    this.sidePanelWidth.set('70vw');
    this.sidePanelRow.set(null);
    this.currentSection.set(null);
  }

  onPanelWidthChange(width: string): void {
    this.sidePanelWidth.set(width);
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.searchForm.get('phoneNumber')?.setValue(input.value, { emitEvent: false });
    this.searchForm.get('phoneNumber')?.markAsTouched();
    this.validatePhoneInput();
  }

  getPhoneError(): string {
    const control = this.searchForm.get('phoneNumber');
    if (!control) return '';
    if (control.hasError('phoneNumeric')) return MDONQ_ERROR_MESSAGES.PHONE_NUMERIC;
    if (control.hasError('phoneMin')) return MDONQ_ERROR_MESSAGES.PHONE_MIN;
    if (control.hasError('phoneMax')) return MDONQ_ERROR_MESSAGES.PHONE_MAX;
    return '';
  }

  validatePhoneInput(): void {
    const control = this.searchForm.get('phoneNumber');
    if (!control) return;
    const value = control.value?.trim() || '';

    if (!value) {
      control.setErrors(null);
      return;
    }

    const phone = value.replace(/-/g, '');
    if (!/^\d*$/.test(phone)) {
      control.setErrors({ phoneNumeric: true });
    } else if (phone.length > 0 && phone.length < MDONQ_VALIDATION.MIN_PHONE) {
      control.setErrors({ phoneMin: true });
    } else if (phone.length > MDONQ_VALIDATION.MAX_PHONE) {
      control.setErrors({ phoneMax: true });
    } else {
      control.setErrors(null);
    }
  }

  onUnitValidated(_data: UnitValidationResponse): void {}

  onUnitCleared(): void {}

  formatDate(value: string): string {
    if (!value) return '--';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  displayValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '--';
    return String(value);
  }

  onClearAll(): void {
    this.resetComponent();
  }

  private resetComponent(): void {
    this.searchForm.reset({
      lastName: '',
      lastNameOption: 'Like',
      dob: null,
      sex: 'Either',
      firstName: '',
      phoneNumber: '',
      donorId: '',
      previousDonorId: '',
      collectionDate: null
    });
    this.unitIdField?.clear();
    this.dataSource = [];
    this.totalRecords = 0;
    this.pageIndex = 0;
    this.expandedRows.clear();
    this.hasSearched.set(false);
    this.isLoading.set(false);
    this.currentSortDirection = 'DESC';
    this.sidePanelOpen.set(false);
    this.sidePanelRow.set(null);
    this.currentSection.set(null);
    this.selectedRowId.set(null);
  }

  get isRetrieveDisabled(): boolean {
    const unitState = this.unitIdField?.validationState;
    if (this.isLoading() || unitState === 'validating' || unitState === 'invalid' || !!this.getDobError() || !!this.getCollDateError() || !!this.getPhoneError()) {
      return true;
    }
    const form = this.searchForm.getRawValue();
    const hasAnyCriteria = form.lastName?.trim() || form.firstName?.trim() ||
      form.dob || form.phoneNumber?.trim() || form.donorId?.trim() ||
      form.previousDonorId?.trim() || form.collectionDate || this.unitIdField?.parsedUnitId;
    return !hasAnyCriteria;
  }

  get f() {
    return this.searchForm.controls;
  }
}
