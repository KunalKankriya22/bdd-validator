import { Component, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { ErrorStateMatcher } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DonorListItem, DonorsFilterValue, MultiSelectInterdictionsDialogData, MultiSelectInterdictionsDialogResult } from '../../models/interdiction-query.model';
import { InterdictionQueryService } from '../../../../../query-interdictions-holds/services/interdiction-query.service';
import { InterdictionCode, InterdictionQueryResponse, InterdictionResult, DonorAddressResult } from '../../../../../query-interdictions-holds/models/interdiction-query.model';
import { MultiSelectInterdictionsDialogComponent } from '../../multi-select-interdictions-dialog/multi-select-interdictions-dialog.component';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { DonorListPanelComponent } from './donor-list-panel/donor-list-panel.component';
import { DonorDetailPanelComponent } from './donor-detail-panel/donor-detail-panel.component';
import { DonorsFilterPanelComponent } from './donors-filter-panel/donors-filter-panel.component';
import { DonorDemographicsComponent } from '../../../../../donor-demographics/donor-demographics';
import { DonorAttributesComponent } from '../../../../donor-profile-maintenance/donor-attributes/donor-attributes.component';
import { DonorInterdictionsContentComponent } from '../../../../donor-interdictions/donor-interdictions-content.component';
import { DonationDetailsDialogComponent } from '../../../../donation-details/donation-details-dialog/donation-details-dialog';
import { DonationDetailsData } from '../../../../donation-details/models/donation-details.model';

@Component({
  selector: 'app-donors-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule,
    MatTooltipModule,
    DonorListPanelComponent,
    DonorDetailPanelComponent,
    DonorDemographicsComponent,
    DonorAttributesComponent,
    DonorInterdictionsContentComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] }
  ],
  templateUrl: './donors-tab.component.html',
  styleUrls: ['./donors-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonorsTabComponent implements OnInit, OnDestroy {
  @ViewChild('fromDateInput') fromDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private interdictionQueryService = inject(InterdictionQueryService);
  private cdr = inject(ChangeDetectorRef);
  private chapterTimezoneService = inject(ChapterTimezoneService);
  private headerService = inject(HeaderService);

  queryForm!: FormGroup;
  availableCodes: InterdictionCode[] = [];
  codeSearchControl = new FormControl('');
  filteredCodes = signal<InterdictionCode[]>([]);
  selectedCodeDescription = '';
  selectedInterType: { code: string; description: string } | undefined;
  selectedCodesTooltip = '';
  minToDate: Date | null = null;
  maxDate = computed(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    if (chapterDate && chapterDate.isValid()) {
      return chapterDate.clone().startOf('day');
    }
    return moment().startOf('day');
  });

  fromDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.fromDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  toDateErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control: FormControl | null): boolean => {
      if (!control) return false;
      if (control.invalid && (control.touched || control.dirty)) return true;
      const inputValue = this.toDateInput?.nativeElement?.value;
      return !!(control.touched || control.dirty) && !control.value && !!inputValue && inputValue.trim().length > 0;
    }
  };

  isLoading = signal<boolean>(false);
  hasQueried = signal<boolean>(false);
  donorList = signal<DonorListItem[]>([]);
  selectedDonor = signal<DonorListItem | null>(null);

  sidePanelOpen = signal<boolean>(false);
  sidePanelWidth = signal<string>('70vw');
  sidePanelDonor = signal<DonorListItem | null>(null);
  currentSection = signal<'demographics' | 'attributes' | 'interdictions' | null>(null);

  donorsFilter = signal<DonorsFilterValue | null>(null);

  filteredDonorList = computed(() => this.donorList());

  ngOnInit(): void {
    this.initQueryForm();
    this.subscribeToCodeChanges();
    this.setupCodeSearch();
    this.setupDateValidation();
    this.loadCodes();
    this.subscribeToChapterChanges();
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
        this.loadCodes();
      });
  }

  private initQueryForm(): void {
    this.queryForm = this.fb.group({
      code: [null, [Validators.required]],
      operation: ['-'],
      lastName: [''],
      fromCollectionDate: [null],
      toCollectionDate: [null],
      multipleCodes: [[]],
      multipleOperation: ['OR']
    }, {
      validators: [
        DateFieldValidationUtility.fromToDateRangeValidator('fromCollectionDate', 'toCollectionDate')
      ]
    });
  }

  private setupDateValidation(): void {
    this.queryForm.get('fromCollectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((fromDate) => {
        const toDateControl = this.queryForm.get('toCollectionDate');

        if (fromDate) {
          this.minToDate = fromDate instanceof Date
            ? fromDate
            : (fromDate.toDate ? fromDate.toDate() : new Date(fromDate));
        } else {
          this.minToDate = null;
        }

        toDateControl?.updateValueAndValidity({ emitEvent: false });
        this.validateFromDateInput();
      });

    this.queryForm.get('toCollectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateToDateInput();
      });

    this.queryForm.get('toCollectionDate')?.addValidators((control) => {
      const fromDateControl = this.queryForm.get('fromCollectionDate');
      const fromDate = fromDateControl?.value;
      const toDate = control.value;

      if (fromDate && toDate) {
        const fromDateValue = fromDate instanceof Date
          ? fromDate
          : (fromDate.toDate ? fromDate.toDate() : new Date(fromDate));
        const toDateValue = toDate instanceof Date
          ? toDate
          : (toDate.toDate ? toDate.toDate() : new Date(toDate));

        const from = new Date(fromDateValue.getFullYear(), fromDateValue.getMonth(), fromDateValue.getDate());
        const to = new Date(toDateValue.getFullYear(), toDateValue.getMonth(), toDateValue.getDate());

        if (to < from) {
          return { dateBefore: true };
        }
      }

      return null;
    });
  }

  private setupCodeSearch(): void {
    this.codeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => {
        this.filteredCodes.set(this.filterCodes(search));
      });
  }

  private filterCodes(search: string | null): InterdictionCode[] {
    if (!search || search.length === 0) {
      return this.availableCodes;
    }
    const searchLower = search.toLowerCase();
    return this.availableCodes.filter(c =>
      c.code.toLowerCase().includes(searchLower) ||
      (c.description || '').toLowerCase().includes(searchLower)
    );
  }

  private loadCodes(): void {
    this.interdictionQueryService.getInterdictionCodes('Interdiction')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes: InterdictionCode[]) => {
          this.availableCodes = codes;
          this.filteredCodes.set(codes);
          if (codes.length === 0) {
            this.showInfoMessage('No interdiction codes available');
          }
        },
        error: (error: unknown) => {
          console.error('[DonorsTab] Error loading codes:', error);
          this.availableCodes = [];
          this.filteredCodes.set([]);
          this.showErrorMessage('Failed to load interdiction codes');
        }
      });
  }

  private subscribeToCodeChanges(): void {
    this.queryForm.get('code')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        const operation = this.queryForm.get('operation')?.value;
        if (operation !== 'ADD') {
          const selected = this.availableCodes.find(c => c.code === code);
          this.selectedCodeDescription = selected?.description || '';
          this.selectedCodesTooltip = '';
        }
      });
  }

  onFromDateBlur(): void {
    setTimeout(() => {
      const control = this.queryForm.get('fromCollectionDate');
      control?.markAsTouched();
      this.validateFromDateInput();
      control?.updateValueAndValidity();
    }, 0);
  }

  onToDateBlur(): void {
    setTimeout(() => {
      const control = this.queryForm.get('toCollectionDate');
      control?.markAsTouched();
      this.validateToDateInput();
      control?.updateValueAndValidity();
    }, 0);
  }

  getFromDateError(): string {
    const control = this.queryForm.get('fromCollectionDate');
    if (!control) return '';

    if (control.hasError('matDatepickerMax')) {
      return 'From Collection Date cannot be a future date';
    }
    if (control.hasError('invalidDate')) {
      return 'From Collection Date is invalid';
    }
    if (control.hasError('matDatepickerParse')) {
      return 'From Collection Date is invalid';
    }
    const inputValue = this.fromDateInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'From Collection Date is invalid';
    }
    if (this.queryForm.hasError('dateRangeInvalid')) {
      return 'From Collection Date must be on or before To Collection Date';
    }
    return '';
  }

  getToDateError(): string {
    const control = this.queryForm.get('toCollectionDate');
    if (!control) return '';

    if (control.hasError('matDatepickerMax')) {
      return 'To Collection Date cannot be a future date';
    }
    if (control.hasError('invalidDate')) {
      return 'To Collection Date is invalid';
    }
    if (control.hasError('matDatepickerParse')) {
      return 'To Collection Date is invalid';
    }
    const inputValue = this.toDateInput?.nativeElement?.value;
    if (inputValue && inputValue.trim().length > 0 && !control.value) {
      return 'To Collection Date is invalid';
    }
    if (control.hasError('dateBefore') || control.hasError('matDatepickerMin')) {
      return 'To Collection Date must be on or after From Collection Date';
    }
    if (this.queryForm.hasError('dateRangeInvalid')) {
      return 'To Collection Date must be on or after From Collection Date';
    }
    return '';
  }

  private validateFromDateInput(): void {
    const control = this.queryForm.get('fromCollectionDate');
    const inputValue = this.fromDateInput?.nativeElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private validateToDateInput(): void {
    const control = this.queryForm.get('toCollectionDate');
    const inputValue = this.toDateInput?.nativeElement?.value?.trim() || '';

    if (inputValue && !control?.value && control) {
      control.setErrors({ ...control.errors, invalidDate: true });
    } else if (control?.hasError('invalidDate') && (!inputValue || control?.value)) {
      const errors = { ...control.errors };
      delete errors['invalidDate'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  get isRetrieveDisabled(): boolean {
    const operation = this.queryForm.get('operation')?.value;
    const multipleCodes = this.queryForm.get('multipleCodes')?.value || [];

    const hasMultipleCodes = operation === 'ADD' && multipleCodes.length > 0;
    const hasCode = !!this.queryForm.get('code')?.value || hasMultipleCodes;

    return this.isLoading() ||
      !hasCode ||
      this.queryForm.invalid ||
      !!this.getFromDateError() ||
      !!this.getToDateError();
  }

  onAddInterdictions(): void {
    const currentMultipleOperation = this.queryForm.get('multipleOperation')?.value || 'OR';
    const currentCodes = this.queryForm.get('multipleCodes')?.value || [];

    const dialogData: MultiSelectInterdictionsDialogData = {
      mode: currentMultipleOperation,
      selectedCodes: currentCodes,
      selectedInterType: this.selectedInterType
    };

    const dialogRef = this.dialog.open(MultiSelectInterdictionsDialogComponent, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'multi-select-interdictions-drawer',
      hasBackdrop: true,
      backdropClass: 'multi-select-interdictions-backdrop',
      autoFocus: false,
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result: MultiSelectInterdictionsDialogResult) => {
      if (result && result.success && result.selectedCodes) {
        const codeControl = this.queryForm.get('code');
        codeControl?.clearValidators();
        codeControl?.updateValueAndValidity({ emitEvent: false });

        this.queryForm.patchValue({
          operation: 'ADD'
        });

        this.selectedInterType = result.selectedInterType;
        this.selectedCodeDescription = `${result.selectedCodes.length} codes selected (${result.logicalOperation}): ${result.displayString}`;
        this.selectedCodesTooltip = result.selectedCodes.join(', ');

        this.queryForm.patchValue({
          code: null,
          multipleCodes: result.selectedCodes,
          multipleOperation: result.logicalOperation
        });

      }
    });
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) {
      this.queryForm.markAllAsTouched();
      return;
    }

    const formValue = this.queryForm.value;
    this.isLoading.set(true);

    const hasMultipleCodes = formValue.operation === 'ADD' &&
      formValue.multipleCodes &&
      formValue.multipleCodes.length > 0;

    const fromDate = formValue.fromCollectionDate;
    const toDate = formValue.toCollectionDate;
    const filter = this.donorsFilter();

    const params = {
      interCode: hasMultipleCodes ? undefined : formValue.code,
      interCodes: hasMultipleCodes ? formValue.multipleCodes : undefined,
      interCodesOperator: hasMultipleCodes ? formValue.multipleOperation : undefined,
      fromDate: DateFieldValidationUtility.serializeDateForApi(fromDate) || undefined,
      toDate: DateFieldValidationUtility.serializeDateForApi(toDate) || undefined,
      lastName: formValue.lastName?.trim() || undefined,
      showTerminated: filter?.showTerminated === true ? true : undefined,
      gender: filter?.sex || undefined
    };

    this.interdictionQueryService.queryDonorInterdictions(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: InterdictionQueryResponse) => {
          const results = response.results || [];
          const grouped = this.groupByDonor(results);
          this.donorList.set(grouped);
          this.hasQueried.set(true);

          if (grouped.length > 0) {
            this.selectedDonor.set(grouped[0]);
            this.fetchDonorAddress(grouped[0]);
            //this.showInfoMessage(`Found ${grouped.length} donor(s)`);
          } else {
            this.selectedDonor.set(null);
            //this.showInfoMessage('No donors found matching the criteria');
          }

          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          console.error('[DonorsTab] Error retrieving donor data:', error);
          this.isLoading.set(false);
          this.showErrorMessage('Failed to retrieve donor data');
        }
      });
  }

  onDonorSelected(donor: DonorListItem): void {
    if (this.selectedDonor()?.donorId === donor.donorId) return;
    this.selectedDonor.set(donor);
    this.fetchDonorAddress(donor);
  }

  private fetchDonorAddress(donor: DonorListItem): void {
    if (!donor.donorId) return;

    this.interdictionQueryService.getDonorAddress(donor.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (address: DonorAddressResult | null) => {
          if (address) {
            const updated: DonorListItem = {
              ...donor,
              address: address.streetName || '',
              phoneHome: address.homePhone || '',
              phoneBusiness: address.businessPhone || '',
              email: address.email || '',
              internationalAddress: address.intlAddr || '',
              intlHomePhone: address.intlHomePhone || '',
              intlWorkPhone: address.intlWorkPhone || ''
            };
            this.selectedDonor.set(updated);
          }
        },
        error: (error: unknown) => {
          console.error('[DonorsTab] Error fetching donor address:', error);
        }
      });
  }

  onDemographics(donorId: string): void {
    this.openSidePanel('demographics', donorId);
  }

  onDonations(donorId: string): void {
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
        sourceLabel: 'Interdiction Query',
      } as DonationDetailsData,
    });
  }

  onAttributes(donorId: string): void {
    this.openSidePanel('attributes', donorId);
  }

  onOtherInterdictions(donorId: string): void {
    this.openSidePanel('interdictions', donorId);
  }

  private openSidePanel(section: 'demographics' | 'attributes' | 'interdictions', donorId: string): void {
    const donor = this.donorList().find(d => d.donorId === donorId);
    if (!donor) return;
    this.sidePanelDonor.set(donor);
    this.sidePanelWidth.set('70vw');
    this.currentSection.set(section);
    this.sidePanelOpen.set(true);
  }

  onPanelClose(): void {
    this.sidePanelOpen.set(false);
    this.sidePanelDonor.set(null);
    this.currentSection.set(null);
    this.sidePanelWidth.set('70vw');
  }

  onPanelWidthChange(width: string): void {
    this.sidePanelWidth.set(width);
  }

  applyDonorsFilters(filters: DonorsFilterValue): void {
    this.donorsFilter.set(filters);
    this.onRetrieve();
  }

  private groupByDonor(results: InterdictionResult[]): DonorListItem[] {
    const donorMap = new Map<string, DonorListItem>();

    for (const item of results) {
      const donorId = item.donorId || '';
      if (!donorMap.has(donorId)) {
        const nameParts = (item.donorName || '').split(',').map(s => s.trim());
        donorMap.set(donorId, {
          donorId,
          lastName: nameParts[0] || '',
          firstName: nameParts[1] || '',
          dateOfBirth: item.dateOfBirth
            ? DateFieldValidationUtility.formatDateForUI(new Date(item.dateOfBirth as string))?.toUpperCase() || ''
            : '',
          gender: item.gender || '',
          address: '',
          internationalAddress: '',
          phoneHome: '',
          phoneBusiness: '',
          email: '',
          intlHomePhone: '',
          intlWorkPhone: '',
          interdictions: []
        });
      }

      const donor = donorMap.get(donorId)!;
      donor.interdictions.push({
        interCode: item.interCode || '',
        origin: item.originatedFrom || '',
        reason: item.reasonCode || '',
        effectiveDate: item.effDate ? String(item.effDate) : '',
        terminationDate: item.termDate ? String(item.termDate) : '',
        mode: item.groupMode || '',
        gpValue: item.groupId || ''
      });
    }

    return Array.from(donorMap.values());
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private resetComponent(): void {
    this.queryForm.reset({
      code: null,
      operation: '-',
      lastName: '',
      fromCollectionDate: null,
      toCollectionDate: null,
      multipleCodes: [],
      multipleOperation: 'OR'
    });
    this.selectedCodeDescription = '';
    this.selectedInterType = undefined;
    this.selectedCodesTooltip = '';
    this.minToDate = null;
    this.donorList.set([]);
    this.selectedDonor.set(null);
    this.hasQueried.set(false);
    this.isLoading.set(false);
    this.donorsFilter.set(null);
    this.sidePanelOpen.set(false);
    this.sidePanelDonor.set(null);
    this.currentSection.set(null);
  }

  get f() {
    return this.queryForm.controls;
  }
}
