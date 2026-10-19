import { Component, OnInit, OnDestroy, signal, computed, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { LinkUnitService } from '../../services/link-unit.service';
import { ErrorCodeService } from '../../services/error-code.service';
import { PatientModel, PatientDetail } from '../../models/patient.model';
import {
  SpecialDonorModel,
  LinkedUnitModel,
  LinkUnitWarning,
  DonorDemographicsDto,
  ValidateScanUnitResponseDto,
  CreateDonorRequest
} from '../../models/special-donor.model';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

/**
 * Patient Detail Component
 * Shows patient details and allows linking/unlinking units
 */
@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatMomentDateModule,
    DataTable,
    UnitIdFieldComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.scss']
})
export class PatientDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  private static nextId = 0;
  protected readonly componentId = `patient-detail-${PatientDetailComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  patient = signal<PatientModel | null>(null);
  patientDetail = signal<PatientDetail | null>(null);
  specialDonors = signal<SpecialDonorModel[]>([]);
  linkedUnits = signal<LinkedUnitModel[]>([]);
  isLoading = signal<boolean>(false);
  isLinking = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');
  isDonorsLoading = signal<boolean>(false);
  donorsError = signal<string>('');
  isLinkedUnitsLoading = signal<boolean>(false);
  linkedUnitsError = signal<string>('');
  donorDemographics = signal<DonorDemographicsDto | null>(null);

  linkForm!: FormGroup;
  selectedDonor: SpecialDonorModel | null = null;

  // Unit registration info (for warning if unit not registered)
  unitRegistrationInfo = signal<{ isRegistered: boolean; collectionDate?: string } | null>(null);

  // Signal for donor last name search text
  private readonly donorSearchText = signal('');

  readonly filteredDonors = computed(() => {
    const search = this.donorSearchText().toLowerCase();
    const donors = this.specialDonors();
    if (!search) return donors;
    return donors.filter(d =>
      d.lastName.toLowerCase().includes(search) ||
      d.firstName.toLowerCase().includes(search)
    );
  });

  // Special Donors Table Configuration
  donorTableConfig: DataTableConfig<SpecialDonorModel> = {
    columns: [
      {
        key: 'donorNumber',
        header: 'Donor Number',
        sortable: true,
        type: 'text',
        minWidth: '110px',
        width: '153px'
      },
      {
        key: 'firstName',
        header: 'First Name',
        sortable: false,
        type: 'text',
        minWidth: '211px'
      },
      {
        key: 'lastName',
        header: 'Last Name',
        sortable: false,
        type: 'text',
        minWidth: '211px'
      },
      {
        key: 'phoneNumber',
        header: 'Phone Number',
        sortable: false,
        type: 'text',
        minWidth: '200px',
        valueFormatter: (value: string | undefined) => value || '-'
      }
    ],
    stickyHeader: true,
    showPagination: false,
    sortConfig: {
      column: 'donorNumber',
      direction: 'A'
    }
  };

  private destroy$ = new Subject<void>();
  private patientId: string = '';
  private surgId: string = '';
  private chapterId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private linkUnitService: LinkUnitService,
    private errorCodeService: ErrorCodeService,
    private headerService: HeaderService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check for patient data passed via router state
    const navigation = this.router.getCurrentNavigation();
    const statePatient = navigation?.extras?.state?.['patient'] || history.state?.['patient'];
    if (statePatient) {
      this.patient.set({
        ...statePatient,
        patientName: this.formatPatientName(statePatient.patientName)
      });
    }

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.patientId = params['patientId'];
      this.surgId = params['surgId'];
      this.chapterId = this.headerService.getCurrentChapterId();

      if (this.patientId && this.surgId && this.chapterId) {
        this.loadPatientData();
      }
    });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onBack();
      });
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.linkForm = this.fb.group({
      donorLastName: ['', Validators.required],
      donorFirstName: ['', Validators.required],
      phone: [''],
      internationalPhone: [''],
      collectionDate: [null, Validators.required]
    });

    // Gap V.19: Mutual exclusion — phone clears international, international clears phone
    this.linkForm.get('phone')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        if (val && this.linkForm.get('internationalPhone')!.value) {
          this.linkForm.get('internationalPhone')!.setValue('', { emitEvent: false });
        }
      });

    this.linkForm.get('internationalPhone')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        if (val && this.linkForm.get('phone')!.value) {
          this.linkForm.get('phone')!.setValue('', { emitEvent: false });
        }
      });
  }

  /**
   * Handle post-validation for Unit ID field
   * Check for duplicates before allowing the unit to be added
   */
  onPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;

    const seqNo = this.selectedDonor?.donorNumber || 0;

    this.linkUnitService.validateScanUnit(parsedUnitId, this.patientId, this.surgId, seqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const result = response.item!;

          this.unitRegistrationInfo.set({
            isRegistered: result.isRegistered,
            collectionDate: result.collectionDate ?? undefined
          });

          // Gap 3.8: Auto-populate collection date for registered units
          if (result.isRegistered && result.collectionDate) {
            this.linkForm.get('collectionDate')!.setValue(moment(result.collectionDate));
          } else {
            this.linkForm.get('collectionDate')!.setValue(null);
          }

          if (result.donorId || result.donorName) {
            this.donorDemographics.set({
              donorId: result.donorId || '',
              donorName: result.donorName || '',
              lastName: '',
              firstName: '',
              dateOfBirth: result.dateOfBirth || '',
              gender: result.gender || ''
            });
          } else {
            this.donorDemographics.set(null);
          }

          if (result.hasWarnings && result.warnings?.length > 0) {
            this.handleSequentialWarnings(result.warnings, event);
          } else {
            event.confirm();
          }
        },
        error: (error) => {
          this.clearUnitFields();
          const errorResponse = error.error?.errorResponse;
          const errorCode = errorResponse?.errorCode || error.error?.errorCode;
          const errorMsg = errorResponse?.error || error.error?.message || 'Validation failed';
          const displayMessage = errorCode
            ? `Error ${errorCode}: ${errorMsg}`
            : errorMsg;
          this.snackbarService.showError(displayMessage);
          event.reject('');
          if (this.unitIdField) {
            this.unitIdField.clear();
          }
        }
      });
  }

  /**
   * Handle unit validated event
   */
  onUnitValidated(response: UnitValidationResponse): void {
    // Unit is validated and ready to be linked
  }

  /**
   * Handle unit cleared event
   */
  onUnitCleared(): void {
    this.unitRegistrationInfo.set(null);
    this.donorDemographics.set(null);
    this.linkForm.get('collectionDate')!.setValue(null);
  }

  private async handleSequentialWarnings(warnings: LinkUnitWarning[], event: UnitIdPostValidateEvent): Promise<void> {
    for (const warning of warnings) {
      const confirmed = await this.showSingleWarningDialog(warning);
      if (!confirmed) {
        this.clearUnitFields();
        if (this.unitIdField) {
          this.unitIdField.clear();
        }
        event.reject('');
        return;
      }
    }
    event.confirm();
  }

  private showSingleWarningDialog(warning: LinkUnitWarning): Promise<boolean> {
    return new Promise(resolve => {
      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        width: '508px',
        disableClose: true,
        panelClass: 'confirm-action-dialog-no-border',
        data: {
          title: 'Warning',
          message: warning.message,
          confirmText: 'Yes',
          cancelText: 'No'
        } as ConfirmActionDialogData
      });
      dialogRef.afterClosed().subscribe(result => resolve(result === true));
    });
  }

  private clearUnitFields(): void {
    this.unitRegistrationInfo.set(null);
    this.donorDemographics.set(null);
    this.linkForm.get('collectionDate')!.setValue(null);
  }

  loadPatientData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.donorsError.set('');
    this.linkedUnitsError.set('');

    this.loadPatientDetail();
    this.loadDonors();
    this.loadLinkedUnits();
  }

  private loadPatientDetail(): void {
    this.linkUnitService.getPatientById(this.patientId, this.surgId, this.chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result) {
            this.patientDetail.set(result);
            this.patient.set({
              patientId: result.patId,
              patientName: `${result.patFirstName} ${result.patLastName}`,
              dateOfBirth: result.dateOfBirth || '',
              sex: result.sex,
              surgeryDate: result.surgDate,
              neededBy: '',
              shipTo: '',
              status: 'Active',
              surgId: result.surgId,
              phoneNumber: result.phoneNumber
            });
            this.cdr.detectChanges();
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
        }
      });
  }

  loadDonors(): void {
    this.isDonorsLoading.set(true);
    this.donorsError.set('');

    this.linkUnitService.getSpecialDonors(this.patientId, this.surgId, this.chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.specialDonors.set(result);
          this.isDonorsLoading.set(false);
        },
        error: (error) => {
          this.specialDonors.set([]);
          this.isDonorsLoading.set(false);
        }
      });
  }

  loadLinkedUnits(): void {
    this.isLinkedUnitsLoading.set(true);
    this.linkedUnitsError.set('');

    this.linkUnitService.getLinkedUnits(this.patientId, this.surgId, this.chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.linkedUnits.set(result);
          this.isLinkedUnitsLoading.set(false);
        },
        error: (error) => {
          this.linkedUnits.set([]);
          this.isLinkedUnitsLoading.set(false);
          this.linkedUnitsError.set('Failed to load linked units');
        }
      });

  }

  private formatPatientName(name: string | undefined): string {
    if (!name) return '';
    if (name.includes(', ')) {
      const parts = name.split(', ');
      return `${parts[1]} ${parts[0]}`;
    }
    return name;
  }

  getPatientFirstName(): string {
    const name = this.patient()?.patientName;
    if (!name) return '';
    const parts = name.split(' ');
    return parts[0];
  }

  get isLinkDisabled(): boolean {
    const donorLastNameValue = this.linkForm.get('donorLastName')!.value;
    const hasDonorName = typeof donorLastNameValue === 'string'
      ? !!donorLastNameValue.trim()
      : !!donorLastNameValue;

    return !hasDonorName ||
           this.isLinking() ||
           !this.unitIdField?.isValid ||
           !this.linkForm.get('collectionDate')?.value;
  }


  /** Display function for donor autocomplete */
  displayDonorLastName = (donor: SpecialDonorModel | string): string => {
    if (!donor) return '';
    if (typeof donor === 'string') return donor;
    return donor.lastName;
  };

  /** Fired when user types in Donor Last Name field */
  onDonorLastNameInput(): void {
    const value = this.linkForm.get('donorLastName')!.value;
    const searchText = typeof value === 'string' ? value : '';
    this.donorSearchText.set(searchText);
    this.selectedDonor = null;
  }

  /** Fired when user picks a donor from the autocomplete dropdown */
  onDonorAutoSelected(event: any): void {
    const donor: SpecialDonorModel = event.option.value;
    if (!donor) return;

    this.selectedDonor = { ...donor };
    this.linkForm.patchValue({
      donorFirstName: donor.firstName,
      phone: donor.phoneNumber || '',
      internationalPhone: donor.internationalPhone || ''
    }, { emitEvent: false });

    this.clearUnitFields();
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
  }

  onLinkUnit(): void {
    this.linkForm.markAllAsTouched();

    const donorLastNameValue = this.linkForm.get('donorLastName')!.value;
    const donorLastName = typeof donorLastNameValue === 'string'
      ? donorLastNameValue
      : donorLastNameValue?.lastName || '';

    if (!donorLastName || !this.unitIdField?.isValid) {
      return;
    }

    const unitId = this.unitIdField.parsedUnitId;
    if (!unitId) {
      return;
    }

    // Get collection date from form control
    const collDateValue = this.linkForm.get('collectionDate')!.value;
    const formattedCollectionDate = collDateValue
      ? moment(collDateValue).format('YYYY-MM-DD')
      : '';

    this.isLinking.set(true);

    if (this.selectedDonor) {
      // Existing donor — link directly
      this.executeLinkUnit(this.selectedDonor.donorNumber, unitId, formattedCollectionDate);
    } else {
      // New donor — create first, then link
      const phone = this.linkForm.get('phone')!.value || '';
      const intlPhone = this.linkForm.get('internationalPhone')!.value || '';
      const areaCode = phone.length > 3 ? phone.substring(0, 3) : '';
      const phoneNo = phone.length > 3 ? phone.substring(3) : phone;

      const createRequest: CreateDonorRequest = {
        patId: this.patientId,
        surgId: this.surgId,
        firstName: this.linkForm.get('donorFirstName')!.value || '',
        lastName: donorLastName,
        contactAreaCode: areaCode || null,
        contactPhoneNo: phoneNo || null,
        intlContactPhoneNo: intlPhone || null
      };

      this.linkUnitService.createDonor(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadDonors();
              const seqNo = response.item?.seqNo || response.data?.[0]?.seqNo;
              if (seqNo) {
                this.executeLinkUnit(seqNo, unitId, formattedCollectionDate);
              } else {
                this.isLinking.set(false);
                this.snackbarService.showSuccess('Donor created successfully');
                this.loadDonors();
              }
            } else {
              this.isLinking.set(false);
              this.snackbarService.showError(response.message || 'Failed to create donor');
            }
          },
          error: (error) => {
            this.isLinking.set(false);
            const errorResponse = error.error?.errorResponse;
            const errorMessage = errorResponse?.errorCode
              ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
              : error.error?.message || 'Failed to create donor';
            this.snackbarService.showError(errorMessage);
          }
        });
    }
  }

  private executeLinkUnit(seqNo: number, unitId: string, collectionDate: string): void {
    const request = {
      patientId: this.patientId,
      surgId: this.surgId,
      seqNo: seqNo,
      unitId: unitId,
      collectionDate: collectionDate,
      consigneeId: null,
      shipDate: null,
      overrideWarnings: true
    };

    this.linkUnitService.linkUnit(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLinking.set(false);

          if (response.success) {
            this.snackbarService.showSuccess(response.message);
            this.loadLinkedUnits();
            this.loadDonors();
            this.resetForm();
          } else {
            this.snackbarService.showError(response.message);
          }
        },
        error: (error) => {
          this.isLinking.set(false);
          const errorResponse = error.error?.errorResponse;
          const errorMessage = errorResponse?.errorCode
            ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
            : error.error?.message;
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  onUnlinkUnit(unit: LinkedUnitModel): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '508px',
      panelClass: 'confirm-action-dialog-no-border',
      data: {
        title: 'Are you sure you want to unlink unit?',
        message: 'This action will unlink the selected unit for this patient.',
        confirmText: 'UNLINK UNIT',
        cancelText: 'CANCEL'
      } as ConfirmActionDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const request = {
          patientId: this.patientId,
          surgId: this.surgId,
          seqNo: unit.seqNo,
          unitId: unit.unitId,
          collectionDate: unit.collectionDate
        };

        this.linkUnitService.unlinkUnit(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.snackbarService.showSuccess(response.message);
              this.loadPatientData();
            },
            error: (error) => {
              const errorResponse = error.error?.errorResponse;
              const errorMessage = errorResponse?.errorCode
                ? `Error ${errorResponse.errorCode}: ${errorResponse.error}`
                : error.error?.message;
              this.snackbarService.showError(errorMessage);
            }
          });
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/donor-functions/special-donations/link-unit-to-special-donation']);
  }

  private resetForm(): void {
    this.linkForm.reset();
    this.selectedDonor = null;
    this.donorDemographics.set(null);
    this.unitRegistrationInfo.set(null);
    this.donorSearchText.set('');
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
  }

  onDonorSortChange(event: TableSortEvent): void {
    this.donorTableConfig = {
      ...this.donorTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    this.sortDonors(event.column, event.direction);
  }

  private sortDonors(column: string, direction: 'A' | 'D' | 'default'): void {
    if (direction === 'default') {
      // Reset to default order (by donorNumber ascending)
      const sorted = [...this.specialDonors()].sort((a, b) => a.donorNumber - b.donorNumber);
      this.specialDonors.set(sorted);
      return;
    }

    const sortedDonors = [...this.specialDonors()].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (column) {
        case 'donorNumber':
          valueA = a.donorNumber;
          valueB = b.donorNumber;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return direction === 'A' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'A' ? 1 : -1;
      }
      return 0;
    });

    this.specialDonors.set(sortedDonors);
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatSex(sex: string | null | undefined): string {
    if (!sex) return '-';
    return sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : sex;
  }

  formatDayOfWeek(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { weekday: 'long' });
  }

}
