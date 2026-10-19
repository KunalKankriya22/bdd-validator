import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin, of, takeUntil, switchMap, catchError, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableColumn, TableSortEvent } from '@shared/interfaces/data-table.interface';

import { DonorEligibilityService } from './services/donor-eligibility.service';
import {
  DonorEligibilityInput,
  DonorEligibilityResult,
  DonationType,
  ProcedureCodeEligibility,
  DonorInterdiction
} from './models/donor-eligibility.model';

@Component({
  selector: 'app-donor-eligibility-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    SidePanelBase,
    DataTable
  ],
  templateUrl: './donor-eligibility-panel.html',
  styleUrls: ['./donor-eligibility-panel.scss']
})
export class DonorEligibilityPanel implements OnInit, OnDestroy, AfterViewInit {
  @Input() donor!: DonorEligibilityInput;
  @Output() closePanel = new EventEmitter<void>();
  @Output() select = new EventEmitter<DonorEligibilityResult>();

  @ViewChild('statusCellTemplate', { static: true }) statusCellTemplate!: TemplateRef<any>;
  @ViewChild('procedureCellTemplate', { static: true }) procedureCellTemplate!: TemplateRef<any>;
  @ViewChild('donationTypeSelect') donationTypeSelect!: MatSelect;

  private readonly fb = inject(FormBuilder);
  private readonly eligibilityService = inject(DonorEligibilityService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly confirmDialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<DonorEligibilityPanel>, { optional: true });
  private readonly dialogData = inject<DonorEligibilityInput>(MAT_DIALOG_DATA, { optional: true });
  private destroy$ = new Subject<void>();

  filterForm!: FormGroup;
  donationTypeSearchControl = new FormControl<string>('');
  filteredDonationTypes = signal<DonationType[]>([]);

  donationTypes = signal<DonationType[]>([]);
  procedureCodesData = signal<ProcedureCodeEligibility[]>([]);
  interdictionsData = signal<DonorInterdiction[]>([]);
  isLoading = signal<boolean>(false);
  hasRetrieved = signal<boolean>(false);
  selectedProcedure = signal<ProcedureCodeEligibility | null>(null);
  donationTypeDescription = signal<string>('');
  lastSuccessfulDonationType = signal<string | null>(null);

  eligibilityTableConfig!: DataTableConfig<ProcedureCodeEligibility>;
  interdictionsTableConfig!: DataTableConfig<DonorInterdiction>;

  footerButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary', ariaLabel: 'Close panel' },
    { label: 'SELECT', action: 'select', variant: 'secondary', disabled: true, ariaLabel: 'Select procedure code' }
  ];

  ngOnInit(): void {
    if (this.dialogData) {
      this.donor = this.dialogData;
    }

    this.initForm();
    this.initTableConfigs();
    this.loadDonationTypes();
    this.setupDonationTypeSearch();
    this.setupAutoRetrieveListeners();

    this.prePopulateFormFromParent();
  }

  ngAfterViewInit(): void {
    const statusCol = this.eligibilityTableConfig.columns.find(c => c.key === 'eligStatus');
    if (statusCol && this.statusCellTemplate) {
      statusCol.cellTemplate = this.statusCellTemplate;
    }
    const procCol = this.eligibilityTableConfig.columns.find(c => c.key === 'procedure');
    if (procCol && this.procedureCellTemplate) {
      procCol.cellTemplate = this.procedureCellTemplate;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      donationType: [null, [Validators.required]],
      donorWeight: [null, [Validators.required, Validators.min(1)]]
    });
  }

  private initTableConfigs(): void {
    this.eligibilityTableConfig = {
      columns: this.getEligibilityColumns(),
      stickyHeader: true,
      showPagination: false,
      sortConfig: { column: 'procedure', direction: 'D' },
      emptyMessage: 'No procedure codes available',
      noDataIcon: 'edit',
      enableRowHighlight: true
    };

    this.interdictionsTableConfig = {
      columns: this.getInterdictionsColumns(),
      stickyHeader: true,
      showPagination: false,
      sortConfig: { column: 'interCode', direction: 'D' },
      emptyMessage: 'No interdictions available',
      noDataIcon: 'edit'
    };
  }

  private getEligibilityColumns(): TableColumn<ProcedureCodeEligibility>[] {
    return [
      { key: 'procedure', header: 'Procedure', sortable: true, width: '200px' },
      { key: 'eligStatus', header: 'Status', width: '100px' },
      { key: 'eligibilityDate', header: 'Eligibility Date' },
      { key: 'reason', header: 'Reason' }
    ];
  }

  private getInterdictionsColumns(): TableColumn<DonorInterdiction>[] {
    return [
      { key: 'interCode', header: 'Code', sortable: true },
      { key: 'interDesc', header: 'Description' }
    ];
  }

  private loadDonationTypes(): void {
    this.eligibilityService.getDonationTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.donationTypes.set(types);
          this.filteredDonationTypes.set(types);

          this.prePopulateDonationTypeIfProvided(types);
        },
        error: (err) => {
          this.snackbarService.showError(err?.message || 'Failed to load donation types');
        }
      });
  }

  private setupDonationTypeSearch(): void {
    this.donationTypeSearchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(search => {
        this.filteredDonationTypes.set(this.filterDonationTypes(search));
      });
  }

  private setupAutoRetrieveListeners(): void {
    this.filterForm.get('donationType')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (!this.isRetrieveDisabled) {
          this.onRetrieve();
        }
      });

    this.filterForm.get('donorWeight')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (!this.hasRetrieved() && !this.isRetrieveDisabled) {
          this.onRetrieve();
        }
      });
  }

  private filterDonationTypes(search: string | null): DonationType[] {
    const allTypes = this.donationTypes();
    if (!search || search.trim().length === 0) {
      return allTypes;
    }
    const searchLower = (search || '').toLowerCase().trim();
    return allTypes.filter(dt =>
      (dt.code || '').toLowerCase().indexOf(searchLower) !== -1 ||
      (dt.description || '').toLowerCase().indexOf(searchLower) !== -1
    );
  }

  private prePopulateFormFromParent(): void {
    if (!this.donor) return;

    if (this.donor.donorWeight != null) {
      this.filterForm.patchValue({ donorWeight: this.donor.donorWeight }, { emitEvent: false });
    } else if (this.donor.donorId) {
      this.eligibilityService.getDonorInfo(this.donor.donorId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (info) => {
            if (info.donorWeight != null) {
              this.filterForm.patchValue({ donorWeight: info.donorWeight }, { emitEvent: false });
              setTimeout(() => {
                if (!this.hasRetrieved() && !this.isRetrieveDisabled) {
                  this.onRetrieve();
                }
              });
            }
          },
          error: () => {}
        });
    }
  }

  private prePopulateDonationTypeIfProvided(types: DonationType[]): void {
    const targetType = this.donor?.donationType || 'AL';
    const matchingType = types.find(t => t.code === targetType);

    if (matchingType) {
      this.filterForm.patchValue({ donationType: matchingType.code });
    }

    if (this.donor?.lockDonationType === true) {
      this.filterForm.get('donationType')?.disable();
    }

    setTimeout(() => {
      if (!this.hasRetrieved() && !this.isRetrieveDisabled) {
        this.onRetrieve();
      }
    });
  }

  get isRetrieveDisabled(): boolean {
    const weight = this.filterForm.get('donorWeight')?.value;
    const donationType = this.filterForm.get('donationType')?.value;
    return this.isLoading() || !donationType || !weight || weight < 1;
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;

    const donorId = this.donor?.donorId;
    if (!donorId) {
      this.snackbarService.showError('Donor ID is required');
      return;
    }

    const donationType = this.filterForm.get('donationType')?.value || 'ALL';
    const donorWeight = this.filterForm.get('donorWeight')?.value;

    this.isLoading.set(true);
    this.selectedProcedure.set(null);
    this.updateSelectButtonState();

    const donationTypeObj = this.donationTypes().find(dt => dt.code === donationType);
    const newDescription = donationTypeObj?.description || donationType;

    forkJoin({
      procedureCodes: this.eligibilityService.getProcedureCodes(donationType),
      interdictions: this.eligibilityService.getInterdictions(donorId).pipe(
        catchError(() => of([] as DonorInterdiction[]))
      )
    }).pipe(
      switchMap(({ procedureCodes, interdictions }) => {
        this.interdictionsData.set(interdictions);

        if (procedureCodes.length === 0) {
          return of([] as ProcedureCodeEligibility[]);
        }

        const chapterOffset = this.headerService.chapterTimeZone();
        const chapterToday = DateFieldValidationUtility.getMinDate(chapterOffset);
        const collectionDate = DateFieldValidationUtility.serializeDateForApi(chapterToday) || '';

        const eligibilityChecks = procedureCodes.map(pc =>
          this.eligibilityService.checkEligibility({
            donorId,
            procedureCode: pc.procedureCode,
            donationType,
            collectionDate,
            donorWeight
          }).pipe(
            catchError(() => of({
              eligStatus: 'N',
              deferralDate: null,
              interType: null,
              deferralReason: 'Error checking eligibility'
            })),
            switchMap(result => of({
              procedureCode: pc.procedureCode,
              description: pc.description,
              eligStatus: (result.eligStatus === 'Y' ? 'Yes' : 'No') as 'Yes' | 'No',
              eligibilityDate: result.deferralDate ? DateFieldValidationUtility.formatDateForUI(moment(result.deferralDate)).toUpperCase() : null,
              reason: result.deferralReason,
              interType: result.interType
            }))
          )
        );

        return forkJoin(eligibilityChecks);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (eligibilityResults) => {
        this.procedureCodesData.set(eligibilityResults);
        this.donationTypeDescription.set(newDescription);
        this.lastSuccessfulDonationType.set(donationType);
        this.hasRetrieved.set(true);
        this.isLoading.set(false);
        (document.activeElement as HTMLElement)?.blur();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackbarService.showError(error?.message || 'Failed to retrieve eligibility data');
      }
    });
  }

  onClearAll(): void {
    this.filterForm.reset({ donationType: null, donorWeight: null });
    this.donationTypeSearchControl.reset('');
    this.filteredDonationTypes.set(this.donationTypes());
    this.procedureCodesData.set([]);
    this.interdictionsData.set([]);
    this.selectedProcedure.set(null);
    this.donationTypeDescription.set('');
    this.lastSuccessfulDonationType.set(null);
    this.hasRetrieved.set(false);
    this.updateSelectButtonState();
  }

  onEligibilitySortChange(event: TableSortEvent): void {
    this.eligibilityTableConfig = {
      ...this.eligibilityTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    if (event.direction === 'default') return;
    const data = [...this.procedureCodesData()];
    data.sort((a, b) => {
      const valA = `${a.procedureCode} - ${a.description}`;
      const valB = `${b.procedureCode} - ${b.description}`;
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    });
    this.procedureCodesData.set(data);
  }

  onInterdictionsSortChange(event: TableSortEvent): void {
    this.interdictionsTableConfig = {
      ...this.interdictionsTableConfig,
      sortConfig: { column: event.column, direction: event.direction }
    };
    if (event.direction === 'default') return;
    const data = [...this.interdictionsData()];
    data.sort((a, b) => {
      const cmp = a.interCode.localeCompare(b.interCode);
      return event.direction === 'A' ? cmp : -cmp;
    });
    this.interdictionsData.set(data);
  }

  onEligibilityRowClick(row: ProcedureCodeEligibility): void {
    this.selectedProcedure.set(row);
    this.updateSelectButtonState();
  }

  onButtonClick(action: string): void {
    if (action === 'close') {
      this.onClose();
    } else if (action === 'select') {
      this.onSelect();
    }
  }

  onClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.closePanel.emit();
    }
  }

  onSelect(): void {
    const selected = this.selectedProcedure();
    if (!selected) return;

    const donationType = this.lastSuccessfulDonationType() || 'ALL';

    const result: DonorEligibilityResult = selected.eligStatus === 'No'
      ? { donationType, procedureCode: selected.procedureCode, overrideFlag: true, eligibilityStatus: 'N' }
      : { donationType, procedureCode: selected.procedureCode, overrideFlag: false, eligibilityStatus: 'Y' };

    if (selected.eligStatus === 'No') {
      const dialogData: ConfirmActionDialogData = {
        title: 'Donor Not Eligible',
        message: 'Donor is not eligible for this procedure.',
        detail: 'Choose "Override" to proceed anyway, "Change" to select a different donation type, or "Cancel" to go back.',
        threeButton: true,
        confirmText: 'Override',
        noButtonText: 'Change',
        cancelText: 'Cancel'
      };

      this.confirmDialog.open(ConfirmActionDialogComponent, {
        width: '500px',
        data: dialogData,
        disableClose: true
      }).afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(dialogResult => {
          if (dialogResult === 'yes') {
            this.emitResult(result);
          } else if (dialogResult === 'no') {
            setTimeout(() => this.donationTypeSelect?.open(), 100);
          }
        });

      return;
    }

    this.emitResult(result);
  }

  private emitResult(result: DonorEligibilityResult): void {
    if (this.dialogRef) {
      this.dialogRef.close(result);
    } else {
      this.select.emit(result);
    }
  }

  onWeightInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.filterForm.get('donorWeight')?.setValue(
      input.value ? Number(input.value) : null,
      { emitEvent: false }
    );
  }

  getWeightError(): string {
    const control = this.filterForm.get('donorWeight');
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Weight is required';
    if (control.hasError('min')) return 'Weight must be greater than 0';
    return '';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '--';
    return DateFieldValidationUtility.formatDateForUI(moment(value)).toUpperCase() || '--';
  }

  get selectedProcedureDesc(): string {
    const proc = this.selectedProcedure();
    return proc ? `${proc.procedureCode} - ${proc.description}` : '-';
  }

  get selectedDonationTypeDisplay(): string {
    const code = this.lastSuccessfulDonationType();
    if (!code) return '';
    const dt = this.donationTypes().find(t => t.code === code);
    return dt ? `${dt.code}${dt.description ? ' - ' + dt.description : ''}` : '';
  }

  private updateSelectButtonState(): void {
    this.footerButtons = this.footerButtons.map(btn =>
      btn.action === 'select' ? { ...btn, disabled: !this.selectedProcedure() } : btn
    );
  }
}
