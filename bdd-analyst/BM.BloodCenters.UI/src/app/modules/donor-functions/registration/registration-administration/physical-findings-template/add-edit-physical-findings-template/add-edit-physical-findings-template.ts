import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment from 'moment';

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { PhysicalFindingsTemplateService } from '../services/physical-findings-template.service';
import {
  PhysicalFindingsTemplateModel,
  PhysicalFindingRecord,
  AvailablePhysicalCode,
  DropdownOption,
  CreatePhysicalFindingsTemplateDto,
  UpdatePhysicalFindingsTemplateDto,
  PhysicalCodeEntry,
  TemplateStatus
} from '../models/physical-findings-template.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

@Component({
  selector: 'app-add-edit-physical-findings-template',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTableModule,
    MatCheckboxModule,
    MatTooltipModule,
    DragDropModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './add-edit-physical-findings-template.html',
  styleUrls: ['./add-edit-physical-findings-template.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ]
})
export class AddEditPhysicalFindingsTemplateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private templateService = inject(PhysicalFindingsTemplateService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);
  private cdr = inject(ChangeDetectorRef);

  // Mode and data from route state
  mode: 'add' | 'edit' = 'add';
  editData: PhysicalFindingsTemplateModel | null = null;

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  form!: FormGroup;
  liveAnnouncement = '';

  // Dropdown options
  donationTypeOptions: DropdownOption[] = [];
  filteredDonationTypeOptions: DropdownOption[] = [];
  donationTypeSearchControl = new FormControl('');

  procedureCodeOptions: DropdownOption[] = [];
  filteredProcedureCodeOptions: DropdownOption[] = [];
  procedureCodeSearchControl = new FormControl('');

  // Available physical codes (right panel)
  availablePhysicalCodes: AvailablePhysicalCode[] = [];
  filteredPhysicalCodes: AvailablePhysicalCode[] = [];
  physicalCodeSearchText: string = '';

  // Selected physical finding records (bottom table)
  selectedPhysicalRecords: PhysicalFindingRecord[] = [];
  displayedColumns: string[] = [];

  // Column definitions
  private tableColumns: string[] = ['dragHandle', 'sequence', 'physicalCode', 'codeDescription', 'boxNumber'];

  // State flags
  isSaving = false;
  isLoading = false;
  isTemplateRetrieved = false;
  showCodesRequiredError = false;

  // Date validation
  minDate = DateFieldValidationUtility.getMinDate();

  private lastChangedDateField: 'effective' | 'termination' | null = null;
  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  // Initial state for edit mode change detection
  private initialTerminationDate: number | null = null;
  private initialEffectiveDate: number | null = null;
  private initialPhysicalCodes: string = '[]';

  // Chapter ID
  currentChapterId = signal<string>('');

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.currentChapterId.set(this.headerService.chapterId());
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.initializeForm();
    this.loadRouteState();
    this.loadDropdowns();
    this.setupFormListeners();
    this.setupDropdownSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      donationType: ['', [Validators.required, Validators.maxLength(5)]],
      procedureCode: ['', [Validators.required, Validators.maxLength(5)]],
      templateId: [{ value: '', disabled: true }],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });

    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.cdr.detectChanges();
      });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.cdr.detectChanges();
      });
  }

  private loadRouteState(): void {
    // Get mode and data from route state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.mode) {
      this.mode = state.mode;
    }

    if (state?.data) {
      this.editData = state.data;
    }

    this.setupPage();
  }

  private setupPage(): void {
    const pageData = this.pageHeaderService.pageHeaderData();
    const parentLabel = pageData?.title || 'Physical Findings Template';
    const parentSubtitle = pageData?.subtitle || '';
    const templatePath = '/donor-functions/registration/registration-administration/physical-findings-template';

    if (this.mode === 'add') {
      this.headerConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: parentLabel, link: templatePath },
          { label: 'Add New Template', link: null }
        ],
        title: 'Add New Template',
        subtitle: ''
      };

      this.displayedColumns = this.tableColumns;
      this.form.get('donationType')?.enable();
      this.form.get('procedureCode')?.disable(); // Disabled until donation type is selected
      this.form.get('terminationDate')?.enable();
      this.isTemplateRetrieved = false;

      // Setup validators for add mode (effective date cannot be in past)
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
    } else {
      this.headerConfig = {
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: parentLabel, link: templatePath },
          { label: 'Edit Template', link: null }
        ],
        title: 'Edit Template',
        subtitle: ''
      };

      this.displayedColumns = this.tableColumns;
      // Populate form with edit data
      this.populateFormForEdit();
      // In edit mode, disable key fields
      this.form.get('donationType')?.disable();
      this.form.get('procedureCode')?.disable();

      // Effective date: editable for FUTURE templates, disabled for ACTIVE/INACTIVE
      if (this.editData?.status === 'FUTURE') {
        this.form.get('effectiveDate')?.enable();
        DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());
      } else {
        this.form.get('effectiveDate')?.disable();
        DateFieldValidationUtility.setupEditModeValidators(this.form);
      }
    }
  }

  private populateFormForEdit(): void {
    if (this.editData) {
      // Handle both API field names (effDate/termDate) and component names (effectiveDate/terminationDate)
      const effDate = this.editData.effDate || this.editData.effectiveDate;
      const termDate = this.editData.termDate || this.editData.terminationDate;

      this.form.patchValue({
        donationType: this.editData.donationType,
        procedureCode: this.editData.procedureCode || '',
        templateId: this.editData.templateId,
        effectiveDate: effDate ? new Date(effDate as string) : null,
        terminationDate: termDate ? new Date(termDate as string) : null
      });

      const termDateVal = this.form.get('terminationDate')?.value;
      this.initialTerminationDate = termDateVal && moment.isMoment(termDateVal)
        ? termDateVal.valueOf()
        : termDateVal ? new Date(termDateVal).getTime() : null;

      const effDateVal = this.form.get('effectiveDate')?.value;
      this.initialEffectiveDate = effDateVal && moment.isMoment(effDateVal)
        ? effDateVal.valueOf()
        : effDateVal ? new Date(effDateVal).getTime() : null;

      // Load procedure codes for the donation type so the dropdown is populated
      // This is needed because the form listener isn't set up yet when this runs
      if (this.editData.donationType) {
        this.loadProcedureCodes(this.editData.donationType);
      }

      // Load template details
      this.loadTemplateDetails();
    }
  }

  private loadDropdowns(): void {
    this.isLoading = true;
    this.templateService.getAddDropdowns()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.donationTypeOptions = response.donationTypes || [];
          this.filteredDonationTypeOptions = [...this.donationTypeOptions];
        },
        error: (error) => {
          console.error('Error loading dropdowns:', error);
        }
      });

    if (this.mode === 'add') {
      this.isTemplateRetrieved = true;
    }
  }

  private setupFormListeners(): void {
    // Listen for donation type changes to load procedure codes
    this.form.get('donationType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(donationType => {
        this.form.patchValue({ procedureCode: '' }, { emitEvent: false });
        this.procedureCodeOptions = [];

        if (donationType && this.mode === 'add') {
          this.loadProcedureCodes(donationType);
          this.form.get('procedureCode')?.enable();
        } else if (!donationType && this.mode === 'add') {
          this.form.get('procedureCode')?.disable();
        }

        this.availablePhysicalCodes = [];
        this.filteredPhysicalCodes = [];
      });

    // Reload physical codes when procedure code is selected (both fields required)
    this.form.get('procedureCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(procedureCode => {
        if (this.mode === 'add' && this.form.getRawValue().donationType && procedureCode) {
          this.loadAvailablePhysicalCodes();
        } else if (this.mode === 'add') {
          this.availablePhysicalCodes = [];
          this.filteredPhysicalCodes = [];
        }
      });
  }

  private setupDropdownSearch(): void {
    this.donationTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm || '').toLowerCase();
        this.filteredDonationTypeOptions = this.donationTypeOptions.filter(option =>
          option.value.toLowerCase().includes(term) ||
          option.key.toLowerCase().includes(term)
        );
      });

    this.procedureCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm || '').toLowerCase();
        this.filteredProcedureCodeOptions = this.procedureCodeOptions.filter(option =>
          option.value.toLowerCase().includes(term) ||
          option.key.toLowerCase().includes(term)
        );
      });
  }

  onDonationTypeDropdownOpened(opened: boolean): void {
    if (opened) {
      this.donationTypeSearchControl.setValue('');
      this.filteredDonationTypeOptions = [...this.donationTypeOptions];
    }
  }

  onProcedureCodeDropdownOpened(opened: boolean): void {
    if (opened) {
      this.procedureCodeSearchControl.setValue('');
      this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];
    }
  }

  private loadProcedureCodes(donationType: string): void {
    this.templateService.getProcedureCodes(donationType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Map API response to dropdown options
          this.procedureCodeOptions = (response.data || []).map(item => ({
            key: item.description,
            value: item.code
          }));
          this.filteredProcedureCodeOptions = [...this.procedureCodeOptions];
        },
        error: (error) => {
          console.error('Error loading procedure codes:', error);
        }
      });
  }

  private loadAvailablePhysicalCodes(): void {
    const formValue = this.form.getRawValue();
    const donationType = formValue.donationType || undefined;
    const procedureCode = formValue.procedureCode || undefined;

    this.templateService.getAvailablePhysicalCodes(donationType, procedureCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.availablePhysicalCodes = response.data || [];
          this.filterAvailablePhysicalCodes();
        },
        error: (error) => {
          console.error('Error loading physical codes:', error);
        }
      });
  }

  private loadTemplateDetails(): void {
    if (!this.editData) return;

    this.templateService.getTemplateDetails(
      this.editData.templateId,
      this.editData.donationType,
      this.editData.procedureCode
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Map API response data to PhysicalFindingRecord format
          const records = response.data || [];
          this.selectedPhysicalRecords = records.map(item => ({
            sequence: item.sortSequence,
            physicalCode: item.physicalCode,
            codeDescription: item.physicalCodeDescription,
            boxNumber: item.boxNumber,
            dataType: item.dataType,
            auditKey: item.auditKey
          }));
          this.isTemplateRetrieved = true;
          this.initialPhysicalCodes = JSON.stringify(
            this.selectedPhysicalRecords.map(r => ({ code: r.physicalCode, seq: r.sequence }))
          );
          this.loadAvailablePhysicalCodes();
        },
        error: (error) => {
          console.error('Error loading template details:', error);
        }
      });
  }

  onSearchPhysicalCodes(event: Event): void {
    const searchText = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.physicalCodeSearchText = searchText;
    this.filterAvailablePhysicalCodes();
  }

  private filterAvailablePhysicalCodes(): void {
    let filtered = [...this.availablePhysicalCodes];

    // Apply search filter only (do not filter out selected codes)
    if (this.physicalCodeSearchText) {
      filtered = filtered.filter(code =>
        code.physicalCode.toLowerCase().includes(this.physicalCodeSearchText) ||
        code.description.toLowerCase().includes(this.physicalCodeSearchText)
      );
    }

    this.filteredPhysicalCodes = filtered;
  }

  isCodeSelected(code: AvailablePhysicalCode): boolean {
    return this.selectedPhysicalRecords.some(r => r.physicalCode === code.physicalCode);
  }

  onTogglePhysicalCode(code: AvailablePhysicalCode): void {
    if (this.isCodeSelected(code)) {
      this.onRemovePhysicalCode(code);
    } else {
      this.onAddPhysicalCode(code);
    }
  }

  onAddPhysicalCode(code: AvailablePhysicalCode): void {
    const nextSequence = this.selectedPhysicalRecords.length + 1;

    const newRecord: PhysicalFindingRecord = {
      sequence: nextSequence,
      physicalCode: code.physicalCode,
      codeDescription: code.description,
      boxNumber: code.boxNumber,
      dataType: code.dataType
    };

    this.selectedPhysicalRecords = [...this.selectedPhysicalRecords, newRecord];
    this.showCodesRequiredError = false;
  }

  onRemovePhysicalCode(code: AvailablePhysicalCode | PhysicalFindingRecord): void {
    this.selectedPhysicalRecords = this.selectedPhysicalRecords
      .filter(r => r.physicalCode !== code.physicalCode)
      .map((r, index) => ({ ...r, sequence: index + 1 })); // Re-sequence
  }

  onDropRecord(event: CdkDragDrop<PhysicalFindingRecord[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      const records = [...this.selectedPhysicalRecords];
      moveItemInArray(records, event.previousIndex, event.currentIndex);
      // Re-sequence after reorder
      this.selectedPhysicalRecords = records.map((r, index) => ({ ...r, sequence: index + 1 }));
    }
  }

  onCancel(): void {
    this.router.navigate(['/donor-functions/registration/registration-administration/physical-findings-template']);
  }

  onClearAll(): void {
    this.selectedPhysicalRecords = [];
    this.filterAvailablePhysicalCodes();
  }

  private getTemplateStatus(): TemplateStatus | 'NEW' {
    if (this.mode === 'edit' && this.editData?.status) {
      return this.editData.status;
    }
    const effDate = this.form.getRawValue().effectiveDate;
    if (effDate) {
      const effMoment = moment.isMoment(effDate) ? effDate.clone().startOf('day') : moment(effDate).startOf('day');
      const today = moment().startOf('day');
      if (effMoment.isAfter(today)) {
        return 'FUTURE';
      }
    }
    return this.mode === 'add' ? 'NEW' : 'ACTIVE';
  }

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (this.form.hasError('dateRangeInvalid')) {
      this.form.get('terminationDate')?.markAsTouched();
      return;
    }

    if (this.selectedPhysicalRecords.length === 0) {
      this.showCodesRequiredError = true;
      this.snackBar.open('Please add at least one Physical Code', 'Dismiss', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    const status = this.getTemplateStatus();
    let confirmMessage: string;
    if (status === 'FUTURE') {
      confirmMessage = 'Do you want to make this set of questions a future template?';
    } else {
      confirmMessage = 'Do you want to make this set of questions a current template?';
    }

    const dialogData: ConfirmActionDialogData = {
      title: 'Decision Message',
      message: confirmMessage,
      confirmText: 'YES',
      cancelText: 'NO'
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '460px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.submitSave();
        }
      });
  }

  private submitSave(): void {
    this.isSaving = true;

    const formValue = this.form.getRawValue();
    const physicalCodes: PhysicalCodeEntry[] = this.selectedPhysicalRecords.map(record => ({
      physicalCode: record.physicalCode,
      sortSequence: record.sequence,
      dataType: record.dataType ?? undefined,
      auditKey: record.auditKey ?? undefined
    }));

    if (this.mode === 'add') {
      const createDto: CreatePhysicalFindingsTemplateDto = {
        donationType: formValue.donationType,
        procedureCode: formValue.procedureCode || null,
        effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
        physicalCodes,
        resolveOverlaps: false
      };

      this.submitCreateTemplate(createDto);
    } else {
      const updateDto: UpdatePhysicalFindingsTemplateDto = {
        templateId: formValue.templateId,
        donationType: formValue.donationType,
        procedureCode: formValue.procedureCode || null,
        ...(this.editData?.status === 'FUTURE' && {
          effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || undefined
        }),
        terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
        physicalCodes,
        resolveOverlaps: false
      };

      this.submitUpdateTemplate(updateDto);
    }
  }

  private submitCreateTemplate(createDto: CreatePhysicalFindingsTemplateDto): void {
    this.templateService.createTemplate(createDto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: (response) => {
          const templateId = response.data?.[0]?.templateId;
          const successMessage = templateId
            ? `New Template with ID:${templateId} is added successfully`
            : (response.message || 'Template created successfully');
          this.snackBar.open(successMessage, 'Dismiss', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/donor-functions/registration/registration-administration/physical-findings-template']);
        },
        error: (error) => {
          if (error?.status === 409) {
            const message = error?.error?.message || 'An active template with the same parameters already exists. Continue?';
            this.showOverlapConfirmation(message, () => {
              this.isSaving = true;
              this.submitCreateTemplate({ ...createDto, resolveOverlaps: true });
            });
          }
        }
      });
  }

  private submitUpdateTemplate(updateDto: UpdatePhysicalFindingsTemplateDto): void {
    this.templateService.updateTemplate(updateDto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Template updated successfully', 'Dismiss', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/donor-functions/registration/registration-administration/physical-findings-template']);
        },
        error: (error) => {
          if (error?.status === 409) {
            const message = error?.error?.message || 'An active template with the same parameters already exists. Continue?';
            this.showOverlapConfirmation(message, () => {
              this.isSaving = true;
              this.submitUpdateTemplate({ ...updateDto, resolveOverlaps: true });
            }, 'YES, UPDATE');
          }
        }
      });
  }

  private showOverlapConfirmation(message: string, onConfirm: () => void, confirmText?: string): void {
    const dialogData: ConfirmActionDialogData = {
      title: 'Alert',
      message,
      confirmText
    };

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '460px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          onConfirm();
        }
      });
  }

  // Form control getters
  get donationTypeControl() { return this.form.get('donationType'); }
  get procedureCodeControl() { return this.form.get('procedureCode'); }
  get templateIdControl() { return this.form.get('templateId'); }
  get effectiveDateControl() { return this.form.get('effectiveDate'); }
  get terminationDateControl() { return this.form.get('terminationDate'); }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.mode === 'edit'
    );
  }

  // Error message getters
  getDonationTypeError(): string {
    const control = this.donationTypeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Donation Type is required';
    if (control.hasError('maxlength')) return 'Maximum 5 characters allowed';
    return '';
  }

  getProcedureCodeError(): string {
    const control = this.procedureCodeControl;
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Procedure Code is required';
    if (control.hasError('maxlength')) return 'Maximum 5 characters allowed';
    return '';
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  get donationTypeDisplay(): string {
    const val = this.form.getRawValue().donationType;
    const option = this.donationTypeOptions.find(o => o.value === val);
    return option ? `${option.value} - ${option.key}` : val || '-';
  }

  get procedureCodeDisplay(): string {
    const val = this.form.getRawValue().procedureCode;
    if (!val) return '-';
    const option = this.procedureCodeOptions.find(o => o.value === val);
    return option ? `${option.value} - ${option.key}` : val;
  }

  get effectiveDateDisplay(): string {
    const val = this.form.getRawValue().effectiveDate;
    if (!val) return '-';
    return moment(val).format('DD-MMM-YYYY').toUpperCase();
  }

  get terminationMinDate() {
    const effectiveDate = this.form.get('effectiveDate')?.value;
    if (!effectiveDate) return this.minDate;
    const effMoment = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
    return effMoment.isAfter(this.minDate) ? effMoment : this.minDate;
  }

  private hasFormChanged(): boolean {
    if (this.mode !== 'edit') return true;

    const currentTermDate = this.form.get('terminationDate')?.value;
    const currentTermDateValue = currentTermDate && moment.isMoment(currentTermDate)
      ? currentTermDate.valueOf()
      : currentTermDate ? new Date(currentTermDate).getTime() : null;

    if (currentTermDateValue !== this.initialTerminationDate) return true;

    if (this.editData?.status === 'FUTURE') {
      const currentEffDate = this.form.get('effectiveDate')?.value;
      const currentEffDateValue = currentEffDate && moment.isMoment(currentEffDate)
        ? currentEffDate.valueOf()
        : currentEffDate ? new Date(currentEffDate).getTime() : null;

      if (currentEffDateValue !== this.initialEffectiveDate) return true;
    }

    const currentPhysicalCodes = JSON.stringify(
      this.selectedPhysicalRecords.map(r => ({ code: r.physicalCode, seq: r.sequence }))
    );
    return currentPhysicalCodes !== this.initialPhysicalCodes;
  }

  get isFormValid(): boolean {
    if (this.mode === 'edit') {
      return this.form.valid && this.hasFormChanged();
    }
    return this.form.valid && this.selectedPhysicalRecords.length > 0;
  }

  onDragHandleKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault();
      const records = [...this.selectedPhysicalRecords];
      const movedCode = records[index].physicalCode;
      [records[index - 1], records[index]] = [records[index], records[index - 1]];
      this.selectedPhysicalRecords = records.map((r, i) => ({ ...r, sequence: i + 1 }));
      const newPos = index;
      setTimeout(() => {
        const handles = document.querySelectorAll('.drag-handle[tabindex]');
        (handles[index - 1] as HTMLElement)?.focus();
      });
      this.announce(`${movedCode} moved to position ${newPos} of ${records.length}`);
    } else if (event.key === 'ArrowDown' && index < this.selectedPhysicalRecords.length - 1) {
      event.preventDefault();
      const records = [...this.selectedPhysicalRecords];
      const movedCode = records[index].physicalCode;
      [records[index], records[index + 1]] = [records[index + 1], records[index]];
      this.selectedPhysicalRecords = records.map((r, i) => ({ ...r, sequence: i + 1 }));
      const newPos = index + 2;
      setTimeout(() => {
        const handles = document.querySelectorAll('.drag-handle[tabindex]');
        (handles[index + 1] as HTMLElement)?.focus();
      });
      this.announce(`${movedCode} moved to position ${newPos} of ${records.length}`);
    }
  }

  private announce(message: string): void {
    this.liveAnnouncement = '';
    setTimeout(() => { this.liveAnnouncement = message; });
  }
}
