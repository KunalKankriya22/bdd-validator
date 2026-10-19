import { Component, OnInit, OnDestroy, inject, signal, effect, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { TablePageEvent } from '@shared/interfaces/data-table.interface';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { DonorCommunicationsComponent } from '@shared/components/donor-communications/donor-communications';
import { DonationDetailsDialogComponent } from '../donor-profile/donation-details/donation-details-dialog/donation-details-dialog';
import { DonationDetailsData } from '../donor-profile/donation-details/models/donation-details.model';
import { DonorEligibilityPanel } from '../donor-eligibility/donor-eligibility-panel';
import { DonorEligibilityInput, DonorEligibilityResult } from '../donor-eligibility/models/donor-eligibility.model';
import { DonorInterdictionsContentComponent } from '../donor-profile/donor-interdictions/donor-interdictions-content.component';
import { DonorAttributesComponent } from '../donor-profile/donor-profile-maintenance/donor-attributes/donor-attributes.component';
import { DonorDemographicsComponent } from '../donor-demographics/donor-demographics';

import {
  SearchTypeOption,
  DonorSearchResultDto,
  DonorSearchRequestDto,
  ValueCodeOption,
  DriveLovOption,
  SEARCH_TYPE_RULES,
  SearchType
} from './models/donors-by-events-query.model';

import { DonorsByEventsQueryService } from './services/donors-by-events-query.service';
import { DonorsByEventsQueryStateService } from './services/donors-by-events-query-state.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';

@Component({
  selector: 'app-donors-by-events-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
    MatSidenavModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
    PageHeaderWithBreadcrumb,
    DonorEligibilityPanel,
    DonorInterdictionsContentComponent,
    DonorAttributesComponent,
    DonorDemographicsComponent,
    DonorCommunicationsComponent,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: MatPaginatorIntl, useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      }
    },
  ],
  templateUrl: './donors-by-events-query.html',
  styleUrls: ['./donors-by-events-query.scss'],
})
export class DonorsByEventsQuery implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly donorSearchService = inject(DonorsByEventsQueryService);
  private readonly stateService = inject(DonorsByEventsQueryStateService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  readonly tableColumns = ['expand', 'donorId', 'donorName', 'dateOfBirth', 'dobDay', 'gender', 'bloodType', 'totalDonations', 'totalCredits', 'totalGallons', 'lastDonationDate', 'lastUnitId', 'actions'];

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donors by Events Query', link: null },
    ],
    title: 'Donors by Events Query',
    subtitle: '',
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

  searchForm!: FormGroup;

  readonly searchTypes = signal<SearchTypeOption[]>([]);
  readonly isLoadingTypes = signal(false);
  readonly isSearching = signal(false);
  readonly hasSearched = signal(false);
  readonly totalCount = signal(0);
  readonly valueCodes = signal<ValueCodeOption[]>([]);
  readonly drivesLov = signal<DriveLovOption[]>([]);
  readonly isLoadingValueCodes = signal(false);
  readonly isLoadingDrives = signal(false);
  readonly codeDescription = signal<string | null>(null);

  readonly searchTypeSearchControl = new FormControl('');
  readonly valueCodeSearchControl = new FormControl('');
  readonly driveSearchControl = new FormControl('');
  private readonly searchTypeSearch = signal('');
  private readonly valueCodeSearch = signal('');
  private readonly driveSearch = signal('');

  readonly filteredSearchTypes = computed(() => {
    const s = this.searchTypeSearch().toLowerCase();
    return s ? this.searchTypes().filter(t => t.description.toLowerCase().includes(s)) : this.searchTypes();
  });
  readonly filteredValueCodes = computed(() => {
    const s = this.valueCodeSearch().toLowerCase();
    return s ? this.valueCodes().filter(v => v.code.toLowerCase().includes(s) || v.description.toLowerCase().includes(s)) : this.valueCodes();
  });
  readonly filteredDrivesLov = computed(() => {
    const s = this.driveSearch().toLowerCase();
    return s ? this.drivesLov().filter(d => d.description.toLowerCase().includes(s) || d.driveId.toLowerCase().includes(s)) : this.drivesLov();
  });

  dataSource: DonorSearchResultDto[] = [];
  expandedRows: { [donorId: string]: boolean } = {};
  pageSize = 25;
  pageIndex = 0;
  donorIdSortDir: 'ASC' | 'DESC' | null = null;
  private lastTouchedDateField: 'startDate' | 'endDate' | null = null;

  // Side panel state
  showEligibilityPanel = false;
  showInterdictionsPanel = false;
  showAttributesPanel = false;
  showDemographicsPanel = false;
  showCommunicationsPanel = false;
  selectedDonorForEligibility: DonorEligibilityInput | null = null;
  selectedDonorIdForInterdictions: string | null = null;
  selectedDonorIdForAttributes: string | null = null;
  selectedDonorIdForDemographics: string | null = null;
  selectedDonorForCommunications: DonorSearchResultDto | null = null;

  get hasValueCodeDropdown(): boolean { return this.valueCodes()?.length > 0; }
  get hasDrivesDropdown(): boolean { return this.searchForm?.get('searchType')?.value === SearchType.FirstTimeFixed; }
  get isRetrieveDisabled(): boolean {
    if (this.isSearching()) return true;
    const f = this.searchForm;
    if (!f) return true;
    if (f.invalid) return true;
    const searchType = f.get('searchType')?.value;
    const startDate = f.get('startDate')?.value;
    const endDate = f.get('endDate')?.value;
    if (!searchType || !startDate || !endDate) return true;
    const rules = SEARCH_TYPE_RULES[searchType];
    if (rules?.requiresCode && !f.get('code')?.value) return true;
    if (rules?.requiresDriveId && !f.get('driveId')?.value) return true;
    return false;
  }
  get showValueField(): boolean {
    const t = this.searchForm?.get('searchType')?.value;
    return t && t !== SearchType.DOBYR && t !== SearchType.FirstTimeFixed;
  }

  get showPinMailedCheckbox(): boolean {
    return this.searchForm?.get('searchType')?.value === SearchType.GallonDonors;
  }
  get valueFieldLabel(): string {
    switch (this.searchForm?.get('searchType')?.value) {
      case SearchType.Action:        return 'Action Code';
      case SearchType.Units:         return 'No. of Donations';
      case SearchType.Credits:       return 'Donation Credits';
      case SearchType.GallonDonors:  return 'Gallon Count';
      case SearchType.Reaction:      return 'Reaction Code';
      case SearchType.Complaint:     return 'Complaint Code';
      case SearchType.DonCorr:       return 'Correspondence Code';
      case SearchType.Request:       return 'Request Code';
      default:                       return 'Value';
    }
  }
  get valuePlaceholder(): string {
    switch (this.searchForm?.get('searchType')?.value) {
      case SearchType.Units:        return 'e.g. 10';
      case SearchType.Credits:      return 'e.g. 3';
      case SearchType.GallonDonors: return 'e.g. 5';
      default:                      return '';
    }
  }
  get valueFieldHint(): string {
    switch (this.searchForm?.get('searchType')?.value) {
      case SearchType.Units:        return 'Enter numeric donation count';
      case SearchType.Credits:      return 'Enter numeric credit count';
      case SearchType.GallonDonors: return 'Enter gallon count (e.g., 5 for 5-gallon donors)';
      case SearchType.Action:       return 'Select action code or leave blank for all';
      case SearchType.Complaint:    return 'Select complaint code or leave blank for all';
      case SearchType.Request:      return 'Select request code from list';
      case SearchType.DonCorr:      return 'Select correspondence code from list';
      case SearchType.Reaction:     return 'Select reaction code from list';
      default:                      return '';
    }
  }

  get maxDate(): Moment {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  get minToDate(): Moment | null {
    const startDate = this.searchForm?.get('startDate')?.value;
    if (!startDate) return null;
    return moment.isMoment(startDate) ? startDate : moment(startDate);
  }

  get f() { return this.searchForm.controls; }

  getFromDateError(): string {
    const control = this.searchForm.get('startDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'From Date is invalid';
    if (control.hasError('required')) return 'From Date is required';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'From Date is invalid';
    if (control.hasError('futureDate')) return 'From Date cannot be a future date';
    if (control.hasError('dateRangeInvalid') || this.searchForm.errors?.['dateRangeInvalid']) return 'From Date must be before or equal to To Date';
    return '';
  }

  getToDateError(): string {
    const control = this.searchForm.get('endDate');
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('matDatepickerParse')) return 'To Date is invalid';
    if (control.hasError('required')) return 'To Date is required';
    if (control.hasError('invalidDateFormat') || control.hasError('invalidDate')) return 'To Date is invalid';
    if (control.hasError('futureDate')) return 'To Date cannot be a future date';
    if (control.hasError('dateRangeInvalid') || this.searchForm.errors?.['dateRangeInvalid']) return 'To Date must be on or after From Date';
    return '';
  }

  onDateInput(controlName: string, inputElement: HTMLInputElement): void {
    this.lastTouchedDateField = controlName as 'startDate' | 'endDate';
    const control = this.searchForm.get(controlName);
    if (!control) return;
    control.markAsTouched();
    const inputValue = inputElement.value?.trim();
    if (inputValue && control.value === null) {
      control.setErrors({ invalidDateFormat: true });
    }
  }

  onDateBlur(controlName: string, inputElement: HTMLInputElement): void {
    this.lastTouchedDateField = controlName as 'startDate' | 'endDate';
    const control = this.searchForm.get(controlName);
    const inputValue = inputElement.value?.trim();
    if (inputValue && control?.value === null) {
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadSearchTypes();
    this.setupSearchTypeChangeListener();

    const restored = this.stateService.restore();
    if (restored) {
      this.restoreState(restored, restored.reopenDonorId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group(
      {
        searchType: [SearchType.Complaint, [Validators.required]],
        startDate: [null, [Validators.required, this.pastOrTodayValidator()]],
        endDate: [null, [Validators.required, this.pastOrTodayValidator()]],
        code: [''],
        driveId: [''],
        includePinMailed: [false],
      },
      { validators: this.dateRangeValidator() }
    );

    this.searchForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      queueMicrotask(() => this.syncDateRangeError());
    });

    // Track datepicker selections (no blur fired when picking from calendar)
    for (const name of ['startDate', 'endDate'] as const) {
      this.searchForm.get(name)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.searchForm.get(name)?.dirty) {
          this.lastTouchedDateField = name;
        }
      });
    }
  }

  private syncDateRangeError(): void {
    const hasRangeError = !!this.searchForm.errors?.['dateRangeInvalid'];
    for (const name of ['startDate', 'endDate']) {
      const ctrl = this.searchForm.get(name);
      if (!ctrl) continue;
      const errs = { ...(ctrl.errors ?? {}) };
      if (hasRangeError && name === this.lastTouchedDateField) {
        errs['dateRangeInvalid'] = true;
      } else {
        delete errs['dateRangeInvalid'];
      }
      ctrl.setErrors(Object.keys(errs).length ? errs : null);
    }
  }

  private pastOrTodayValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const selected = moment.isMoment(value) ? value : moment(value);
      if (!selected.isValid()) return null;
      if (selected.year() < 1000) return { invalidDate: true };
      const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
      if (selected.clone().startOf('day').isAfter(chapterToday)) {
        return { futureDate: true };
      }
      return null;
    };
  }

  private dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDate = group.get('startDate')?.value;
      const endDate = group.get('endDate')?.value;
      if (!startDate || !endDate) return null;
      const start = moment.isMoment(startDate) ? startDate : moment(startDate);
      const end = moment.isMoment(endDate) ? endDate : moment(endDate);
      if (!start.isValid() || !end.isValid()) return null;
      if (end.startOf('day').isBefore(start.startOf('day'))) {
        return { dateRangeInvalid: true };
      }
      return null;
    };
  }

  private loadSearchTypes(): void {
    this.isLoadingTypes.set(true);
    this.donorSearchService.getSearchTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (types) => {
        this.searchTypes.set(types);
        this.isLoadingTypes.set(false);
      },
      error: (error) => {
        this.showError(this.getErrorMessage(error, 'Failed to load search types'));
        this.isLoadingTypes.set(false);
      },
    });
  }

  private setupSearchTypeChangeListener(): void {
    this.searchTypeSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.searchTypeSearch.set(v || ''));
    this.valueCodeSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.valueCodeSearch.set(v || ''));
    this.driveSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.driveSearch.set(v || ''));

    this.searchForm.get('searchType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((searchType) => {
      this.updateFieldValidation(searchType);
      this.loadValueCodesForType(searchType);
      if (searchType === SearchType.FirstTimeFixed) {
        this.loadDrivesLov();
      } else {
        this.drivesLov.set([]);
      }
      // Clear code description when search type changes
      this.codeDescription.set(null);
    });

    // Subscribe to code field changes to update description
    this.searchForm.get('code')?.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateCodeDescription();
      });
  }

  private updateFieldValidation(searchType: string): void {
    const rules = SEARCH_TYPE_RULES[searchType] || { requiresCode: false, codeOptional: false, requiresNumericCode: false, requiresDriveId: false };
    const codeControl = this.searchForm.get('code');
    const driveIdControl = this.searchForm.get('driveId');
    codeControl?.setValue('');
    driveIdControl?.setValue('');

    if (rules.requiresCode) {
      const validators = [Validators.required];
      if (rules.requiresNumericCode) {
        validators.push(Validators.pattern('^[0-9]+$'));
        validators.push(Validators.maxLength(3)); // Max 3 digits for numeric: 0-999
      } else {
        validators.push(Validators.maxLength(20)); // Max 20 chars for code fields
      }
      codeControl?.setValidators(validators);
    } else if (!rules.requiresCode && rules.codeOptional) {
      // Optional code fields still have maxLength but not required
      const validators = [];
      validators.push(Validators.maxLength(20));
      codeControl?.setValidators(validators);
    } else {
      codeControl?.clearValidators();
    }
    codeControl?.updateValueAndValidity();
    driveIdControl?.setValidators(rules.requiresDriveId ? [Validators.required] : []);
    driveIdControl?.updateValueAndValidity();
  }

  private loadValueCodesForType(searchType: string): void {
    const typesWithDropdown = [SearchType.Action, SearchType.Complaint, SearchType.Request, SearchType.DonCorr, SearchType.Reaction];
    if (!typesWithDropdown.includes(searchType as SearchType)) { this.valueCodes.set([]); return; }
    this.isLoadingValueCodes.set(true);
    this.donorSearchService.getValueCodes(searchType).pipe(takeUntil(this.destroy$)).subscribe({
      next: (codes) => { this.valueCodes.set(codes); this.isLoadingValueCodes.set(false); },
      error: () => { this.valueCodes.set([]); this.isLoadingValueCodes.set(false); },
    });
  }

  private loadDrivesLov(): void {
    this.isLoadingDrives.set(true);
    this.donorSearchService.getDrivesLov(this.headerService.getCurrentChapterId())
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (drives) => { this.drivesLov.set(drives); this.isLoadingDrives.set(false); },
        error: () => { this.drivesLov.set([]); this.isLoadingDrives.set(false); },
      });
  }

  private updateCodeDescription(): void {
    const searchType = this.searchForm.get('searchType')?.value;
    const code = this.searchForm.get('code')?.value;

    // Only lookup for types that have value codes dropdown
    const typesWithCodeDescription = [SearchType.Action, SearchType.Complaint, SearchType.Request, SearchType.DonCorr, SearchType.Reaction];
    if (!code || !typesWithCodeDescription.includes(searchType)) {
      this.codeDescription.set(null);
      return;
    }

    // Find description in loaded value codes
    const valueCode = this.valueCodes().find(vc => vc.code === code);
    this.codeDescription.set(valueCode?.description || null);
  }

  getInputMaxLength(): number {
    const searchType = this.searchForm.get('searchType')?.value;
    const rules = SEARCH_TYPE_RULES[searchType];
    if (rules?.requiresNumericCode) {
      return 3;
    }
    return 20;
  }

  getMaxLengthErrorMessage(): string {
    const searchType = this.searchForm.get('searchType')?.value;
    if (searchType === SearchType.Units || searchType === SearchType.Credits || searchType === SearchType.GallonDonors) {
      return 'Maximum 3 digits allowed';
    }
    return 'Maximum 20 characters allowed';
  }

  onNumericKeyPress(event: KeyboardEvent): void {
    const searchType = this.searchForm.get('searchType')?.value;
    const rules = SEARCH_TYPE_RULES[searchType];

    // Only apply numeric restriction if this field requires numeric input
    if (!rules?.requiresNumericCode) return;

    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

    // Allow control keys
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }

    // Allow only digits 0-9
    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
    }
  }

  onNumericInput(event: any): void {
    const searchType = this.searchForm.get('searchType')?.value;
    const rules = SEARCH_TYPE_RULES[searchType];

    // Only apply numeric restriction if this field requires numeric input
    if (!rules?.requiresNumericCode) return;

    const input = event.target as HTMLInputElement;
    const originalValue = input.value;

    // Remove any non-numeric characters
    const cleanedValue = originalValue.replace(/\D/g, '');

    if (originalValue !== cleanedValue) {
      input.value = cleanedValue;
      this.searchForm.get('code')?.setValue(cleanedValue, { emitEvent: true });
    }
  }

  onRetrieve(): void {
    this.searchForm.markAllAsTouched();
    if (this.searchForm.invalid || this.isSearching()) return;
    this.isSearching.set(true);
    this.expandedRows = {};
    this.donorIdSortDir = null;
    this.executeSearch();
  }

  private executeSearch(): void {
    const formValue = this.searchForm.getRawValue();
    const request: DonorSearchRequestDto = {
      searchType: formValue.searchType,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      code: formValue.code || null,
      chapterId: this.headerService.getCurrentChapterId() || null,
      driveId: formValue.driveId || null,
      includePinMailed: formValue.includePinMailed || false,
      take: this.pageSize,
      skip: this.pageIndex * this.pageSize,
      sortColumn: this.donorIdSortDir ? 'DonorId' : 'DonorName',
      sortDirection: this.donorIdSortDir ?? 'ASC',
    };

    this.donorSearchService.searchDonors(request).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.dataSource = response.data || [];
        this.totalCount.set(response.total || 0);
        this.hasSearched.set(true);
        this.isSearching.set(false);
        // Update page title for accessibility
        document.title = `Donors by Events Query - ${response.total} Results | BloodCenter`;
      },
      error: (error) => {
        this.showError(this.getErrorMessage(error, 'Failed to search donors'));
        this.isSearching.set(false);
        this.dataSource = [];
        this.totalCount.set(0);
      },
    });
  }

  onPageChange(event: TablePageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.isSearching.set(true);
    this.executeSearch();
  }

  onDonorIdSort(): void {
    this.donorIdSortDir = this.donorIdSortDir === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 0;
    this.isSearching.set(true);
    const message = `Table sorted by Donor ID ${this.donorIdSortDir === 'ASC' ? 'ascending' : 'descending'}`;
    this.announceToScreenReader(message);
    this.executeSearch();
  }

  getDonorIdSortIcon(): string {
    if (!this.donorIdSortDir) return 'unfold_more';
    return this.donorIdSortDir === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  onRowAction(action: string, row: DonorSearchResultDto): void {
    const donorId = row.donorId;
    const panelConfig = {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      disableClose: false,
    };

    switch (action) {
      case 'viewAlternateAddress':
        this.dialog.open(AlternateDemographicsDialogComponent, {
          ...panelConfig,
          width: '700px',
          data: { donorId },
        });
        break;
      case 'viewCommunicationLog':
        this.selectedDonorForCommunications = row;
        this.showCommunicationsPanel = true;
        this.focusPanel();
        break;
      case 'donorEligibility':
        this.selectedDonorForEligibility = {
          donorId: row.donorId,
          donorName: row.donorName,
          dateOfBirth: row.dateOfBirth ? String(row.dateOfBirth) : '',
          sex: row.gender ?? '',
          bloodType: row.bloodType ?? ''
        };
        this.showEligibilityPanel = true;
        this.focusPanel();
        break;
      case 'viewInterdictions':
        this.selectedDonorIdForInterdictions = donorId;
        this.showInterdictionsPanel = true;
        this.focusPanel();
        break;
      case 'viewAttributes':
        this.selectedDonorIdForAttributes = donorId;
        this.showAttributesPanel = true;
        this.focusPanel();
        break;
      case 'demographics':
        this.selectedDonorIdForDemographics = donorId;
        this.showDemographicsPanel = true;
        this.focusPanel();
        break;
      case 'donorHistory':
        this.openDonationDetailsDialog(donorId);
        break;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(_event: Event): void {
    if (this.showEligibilityPanel) this.closeEligibilityPanel();
    else if (this.showInterdictionsPanel) this.closeInterdictionsPanel();
    else if (this.showAttributesPanel) this.closeAttributesPanel();
    else if (this.showDemographicsPanel) this.closeDemographicsPanel();
    else if (this.showCommunicationsPanel) this.closeCommunicationsPanel();
  }

  closeEligibilityPanel(): void {
    this.showEligibilityPanel = false;
    this.selectedDonorForEligibility = null;
  }

  onEligibilitySelected(_result: DonorEligibilityResult): void {
    this.closeEligibilityPanel();
  }

  closeInterdictionsPanel(): void {
    this.showInterdictionsPanel = false;
    this.selectedDonorIdForInterdictions = null;
  }

  closeAttributesPanel(): void {
    this.showAttributesPanel = false;
    this.selectedDonorIdForAttributes = null;
  }

  closeDemographicsPanel(): void {
    this.showDemographicsPanel = false;
    this.selectedDonorIdForDemographics = null;
  }

  closeCommunicationsPanel(): void {
    this.showCommunicationsPanel = false;
    this.selectedDonorForCommunications = null;
  }

  private focusPanel(): void {
    setTimeout(() => {
      const panel = document.querySelector('.side-panel') as HTMLElement;
      const firstFocusable = panel?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
      firstFocusable?.focus();
    }, 100);
  }

  private announceToScreenReader(message: string): void {
    let liveRegion = document.getElementById('sr-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'sr-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = message;
  }

  toggleExpand(row: DonorSearchResultDto, event: Event): void {
    event.stopPropagation();
    this.expandedRows = {
      ...this.expandedRows,
      [row.donorId]: !this.expandedRows[row.donorId]
    };
  }

  isExpanded(row: DonorSearchResultDto): boolean {
    return !!this.expandedRows[row.donorId];
  }

  get isAllExpanded(): boolean {
    return this.dataSource.length > 0 && this.dataSource.every(r => !!this.expandedRows[r.donorId]);
  }

  toggleExpandAll(): void {
    if (this.isAllExpanded) {
      this.expandedRows = {};
    } else {
      this.expandedRows = Object.fromEntries(this.dataSource.map(r => [r.donorId, true]));
    }
  }

  formatDate(value: Date | string | null): string {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
    } catch { return ''; }
  }

  /**
   * Extract ABO blood group from full blood type
   * Examples: "OPOS" -> "O", "ANEG" -> "A", "ABPOS" -> "AB", "BPOS" -> "B"
   */
  getAboGroup(bloodType: string | null): string {
    if (!bloodType) return '-';
    // Remove POS/NEG suffix to get just the ABO group
    return bloodType.replace(/POS|NEG/gi, '').trim() || '-';
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.errorResponse?.error || error?.error?.message || error?.message || fallback;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'], politeness: 'assertive' });
  }

  private saveState(reopenDonorId: string | null): void {
    this.stateService.save({
      filterFormValues: { ...this.searchForm.getRawValue() },
      dataSource: this.dataSource,
      totalCount: this.totalCount(),
      pageSize: this.pageSize,
      pageIndex: this.pageIndex,
      donorIdSortDir: this.donorIdSortDir,
      expandedRows: { ...this.expandedRows },
      valueCodes: this.valueCodes(),
      drivesLov: this.drivesLov(),
      codeDescription: this.codeDescription(),
      reopenDonorId,
    });
  }

  private restoreState(state: import('./services/donors-by-events-query-state.service').DeqSavedState, openDonorId: string | null): void {
    this.searchForm.patchValue(state.filterFormValues, { emitEvent: false });
    this.updateFieldValidation(state.filterFormValues.searchType || '');
    this.valueCodes.set(state.valueCodes);
    this.drivesLov.set(state.drivesLov);
    this.codeDescription.set(state.codeDescription);
    this.dataSource = state.dataSource;
    this.totalCount.set(state.totalCount);
    this.pageSize = state.pageSize;
    this.pageIndex = state.pageIndex;
    this.donorIdSortDir = state.donorIdSortDir;
    this.expandedRows = state.expandedRows;
    this.hasSearched.set(true);

    if (openDonorId) {
      this.openDonationDetailsDialog(openDonorId);
    }
  }

  private openDonationDetailsDialog(donorId: string): void {
    const panelConfig = {
      width: '1400px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0' as const, top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      disableClose: false,
    };
    this.dialog.open(DonationDetailsDialogComponent, {
      ...panelConfig,
      data: {
        donorId,
        sourceLabel: this.headerConfig.title,
        sourcePath: ROUTE_REGISTRY[RouteKey.DonorsByEventsQuery]?.path,
      } as DonationDetailsData,
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.action === 'consents') {
          this.saveState(result.donorId);
          this.router.navigate(
            ['/donor-functions/registration/consent-history'],
            {
              state: {
                donorId: result.donorId,
                unitId: result.unitId,
                collectionDate: result.collectionDate,
                sourceLabel: result.sourceLabel,
                sourcePath: result.sourcePath,
              },
            }
          );
        }
      });
  }
}
