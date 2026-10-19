import { Component, OnInit, OnDestroy, Inject, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, timer, switchMap } from 'rxjs';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment, { Moment } from 'moment';

import { RegisterSpecialDonationRequestService } from '../register-special-donation-request.service';
import { LookupItem, SpecialSurgeryDetail } from '../register-special-donation-request.models';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

export interface SurgeryDialogData {
  mode: 'add' | 'edit';
  patId: string;
  surgery?: SpecialSurgeryDetail;
  newPhysicianId?: string;
}

@Component({
  selector: 'app-surgery-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatIconModule, MatSnackBarModule, NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './surgery-dialog.html',
  styleUrls: ['../add-request-dialog/add-request-dialog.scss', './surgery-dialog.scss'],
})
export class SurgeryDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private service = inject(RegisterSpecialDonationRequestService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();
  private chapterTimezoneService = inject(ChapterTimezoneService);

  readonly today = computed<Moment>(() => {
    const chapterDate = this.chapterTimezoneService.chapterLocalDate();
    if (chapterDate && chapterDate.isValid()) {
      return chapterDate.clone().startOf('day');
    }
    return moment().startOf('day');
  });
  form!: FormGroup;
  isSaving = false;
  mode: 'add' | 'edit' = 'add';
  patId = '';
  surgId = '';

  surgeryTypes: LookupItem[] = [];
  hospitals: LookupItem[] = [];
  consignees: LookupItem[] = [];
  physicians: LookupItem[] = [];
  hospitalConsigneeMismatch = false;
  dateNeededByWarning: string | null = null;
  hospitalTypeWarning: string | null = null;

  // Search controls
  readonly phySearchControl = new FormControl('');
  readonly hospitalSearchControl = new FormControl('');
  readonly shipSearchControl = new FormControl('');
  readonly surgTypeSearchControl = new FormControl('');

  // Search signals
  private readonly phySearch = signal('');
  private readonly hospitalSearch = signal('');
  private readonly shipSearch = signal('');
  private readonly surgTypeSearch = signal('');

  // Source signals
  private readonly physiciansSource = signal<LookupItem[]>([]);
  private readonly hospitalsSource = signal<LookupItem[]>([]);
  private readonly consigneesSource = signal<LookupItem[]>([]);
  private readonly surgeryTypesSource = signal<LookupItem[]>([]);

  // Filtered computeds
  readonly filteredPhysicians = computed(() => {
    const search = this.phySearch().toLowerCase();
    const items = this.physiciansSource();
    if (!search) return items;
    return items.filter(p => (p.code || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search));
  });

  readonly filteredHospitals = computed(() => {
    const search = this.hospitalSearch().toLowerCase();
    const items = this.hospitalsSource();
    if (!search) return items;
    return items.filter(h => (h.code || '').toLowerCase().includes(search) || (h.description || '').toLowerCase().includes(search));
  });

  readonly filteredConsignees = computed(() => {
    const search = this.shipSearch().toLowerCase();
    const items = this.consigneesSource();
    if (!search) return items;
    return items.filter(c => (c.code || '').toLowerCase().includes(search) || (c.description || '').toLowerCase().includes(search));
  });

  readonly filteredSurgeryTypes = computed(() => {
    const search = this.surgTypeSearch().toLowerCase();
    const items = this.surgeryTypesSource();
    if (!search) return items;
    return items.filter(s => (s.code || '').toLowerCase().includes(search) || (s.description || '').toLowerCase().includes(search));
  });

  constructor(
    private dialogRef: MatDialogRef<SurgeryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SurgeryDialogData,
  ) {
    this.mode = data.mode;
    this.patId = data.patId;
    if (data.surgery) this.surgId = data.surgery.surgId;
  }

  get dialogTitle(): string {
    return this.mode === 'edit' ? `Surgery Details of ${this.surgId}` : 'Add New Surgery Details';
  }

  get saveLabel(): string {
    return this.mode === 'edit' ? 'SAVE' : 'ADD';
  }

  get surgeryDay(): string {
    const date = this.form?.get('surgDate')?.value;
    if (!date) return '';
    const m = moment.isMoment(date) ? date : moment(date);
    return m.isValid() ? m.format('dddd') : '';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      surgDate: [null, Validators.required],
      phyId: ['', Validators.required],
      phyAuthDate: [null],
      hospitalId: [''],
      shipId: ['', Validators.required],
      unitsRequired: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      surgType: [''],
      dateNeededBy: [null],
      closedDate: [null],
      comments: ['', [Validators.maxLength(240)]],
    });

    // Wire up search controls to signals
    this.phySearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.phySearch.set(v || ''));
    this.hospitalSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.hospitalSearch.set(v || ''));
    this.shipSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.shipSearch.set(v || ''));
    this.surgTypeSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.surgTypeSearch.set(v || ''));

    this.form.get('dateNeededBy')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.validateDateNeededBy();
      this.checkDateNeededByWarning();
    });
    this.form.get('surgDate')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const surgDate = this.form.get('surgDate')?.value;
      const dateNeededByCtrl = this.form.get('dateNeededBy')!;
      if (surgDate) {
        dateNeededByCtrl.enable({ emitEvent: false });
      } else {
        dateNeededByCtrl.disable({ emitEvent: false });
        dateNeededByCtrl.setValue(null, { emitEvent: false });
      }
      this.validateDateNeededBy();
      this.checkDateNeededByWarning();
    });

    this.form.get('dateNeededBy')!.disable({ emitEvent: false });

    this.service.getSurgeryTypes().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      this.surgeryTypes = r?.data || [];
      this.surgeryTypesSource.set(this.surgeryTypes);
    });
    this.service.getHospitals().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      this.hospitals = r?.data || [];
      this.hospitalsSource.set(this.hospitals);
    });
    this.service.getShipLocations().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      const items = (r?.data || r || []);
      this.consignees = items.map((item: any) => ({
        code: item.shipId || item.consigneeId || item.code || item.value,
        description: item.shipLocnName || item.name || item.description || item.label,
      }));
      this.consigneesSource.set(this.consignees);
    });
    this.refreshPhysicians(this.data.newPhysicianId);

    if (this.mode === 'add' && !this.surgId) {
      this.service.generateSurgeryId().pipe(takeUntil(this.destroy$)).subscribe((res) => {
        this.surgId = res?.data?.[0] || '';
      });
    } else if (this.mode === 'edit') {
      if (this.data.surgery) {
        this.populateForm(this.data.surgery);
      } else {
        this.loadSurgeryFromPatient();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private populateForm(s: SpecialSurgeryDetail): void {
    this.surgId = s.surgId;
    this.form.patchValue({
      surgDate: s.surgDate ? new Date(s.surgDate) : null,
      phyId: s.phyId,
      phyAuthDate: s.phyAuthDate ? new Date(s.phyAuthDate) : null,
      hospitalId: s.hospitalId,
      shipId: s.shipId,
      unitsRequired: s.unitsRequired,
      surgType: s.surgType,
      dateNeededBy: s.dateNeededBy ? new Date(s.dateNeededBy) : null,
      closedDate: s.closedDate ? new Date(s.closedDate) : null,
      comments: s.comments,
    });
    if (s.hospitalId && s.shipId) this.checkConsigneeHospitalMatch();
  }

  private loadSurgeryFromPatient(): void {
    this.service.getPatientDetail(this.patId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      const detail = res?.item || res?.data?.[0];
      const surgery = detail?.surgeries?.[0];
      if (surgery) this.populateForm(surgery);
    });
  }

  onHospitalChange(): void {
    const hospitalId = this.form.get('hospitalId')?.value;
    // Hospital ID format: [3-char chapter]-[2-char type][...] e.g. DAL-RG0001 → type at indices 4-5
    if (hospitalId && hospitalId.length >= 6 && hospitalId.substring(4, 6).toUpperCase() !== 'RG') {
      this.hospitalTypeWarning = 'Selected hospital is not a Regular (RG) type customer.';
    } else {
      this.hospitalTypeWarning = null;
    }
    this.checkConsigneeHospitalMatch();
  }

  onShipIdChange(): void {
    this.checkConsigneeHospitalMatch();
  }

  onDropdownClosed(control: FormControl): void {
    control.setValue('');
  }

  private validateDateNeededBy(): void {
    const dateNeededByCtrl = this.form.get('dateNeededBy');
    const surgDate = this.form.get('surgDate')?.value;
    const dateNeededBy = dateNeededByCtrl?.value;
    if (dateNeededBy && surgDate) {
      const surgMoment = moment.isMoment(surgDate) ? surgDate : moment(surgDate);
      const neededMoment = moment.isMoment(dateNeededBy) ? dateNeededBy : moment(dateNeededBy);
      if (neededMoment.clone().startOf('day').isAfter(surgMoment.clone().startOf('day'))) {
        dateNeededByCtrl?.setErrors({ ...dateNeededByCtrl.errors, dateNeededByAfterSurgDate: true });
      } else {
        const errors = { ...dateNeededByCtrl?.errors };
        delete errors['dateNeededByAfterSurgDate'];
        dateNeededByCtrl?.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
  }

  checkDateNeededByWarning(): void {
    const dateNeededBy = this.form.get('dateNeededBy')?.value;
    const surgDate = this.form.get('surgDate')?.value;
    if (dateNeededBy && surgDate) {
      const surgMoment = moment.isMoment(surgDate) ? surgDate : moment(surgDate);
      const neededMoment = moment.isMoment(dateNeededBy) ? dateNeededBy : moment(dateNeededBy);
      const diffDays = surgMoment.clone().startOf('day').diff(neededMoment.clone().startOf('day'), 'days');
      if (diffDays > 42) {
        this.dialog.open(ConfirmActionDialogComponent, {
          data: {
            title: 'Warning',
            message: 'Date Needed by is more than 42 days old from Surgery Date.',
            confirmText: 'OK',
          } as ConfirmActionDialogData,
          width: '400px',
        });
      }
    }
    this.dateNeededByWarning = null;
  }

  private checkConsigneeHospitalMatch(): void {
    const hospitalId = this.form.get('hospitalId')?.value;
    const shipId = this.form.get('shipId')?.value;
    if (!shipId) {
      this.hospitalConsigneeMismatch = false;
      return;
    }
    if (!hospitalId) {
      this.hospitalConsigneeMismatch = true;
      this.showConsigneeMismatchWarning();
      return;
    }
    this.service.getConsignees(hospitalId).pipe(takeUntil(this.destroy$)).subscribe((r) => {
      const hospitalConsignees = r?.data || [];
      this.hospitalConsigneeMismatch = !hospitalConsignees.some(
        (c: any) => (c.shipId || c.consigneeId || c.code) === shipId
      );
      if (this.hospitalConsigneeMismatch) {
        this.showConsigneeMismatchWarning();
      }
    });
  }

  private showConsigneeMismatchWarning(): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Consignee Mismatch',
        message: 'This consignee does not belong to this hospital. Do you want to proceed?',
        confirmText: 'Yes',
        cancelText: 'No',
      } as ConfirmActionDialogData,
      width: '400px',
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (!confirmed) {
        this.form.get('shipId')?.setValue('', { emitEvent: false });
        this.hospitalConsigneeMismatch = false;
      }
    });
  }

  getPhysicianName(): string {
    const phyId = this.form.get('phyId')?.value;
    if (!phyId) return '-';
    const physician = this.physicians.find((p) => p.code === phyId);
    return physician?.description || '-';
  }

  getHospitalName(): string {
    const hospitalId = this.form.get('hospitalId')?.value;
    if (!hospitalId) return '-';
    const hospital = this.hospitals.find((h) => h.code === hospitalId);
    return hospital?.description || '-';
  }

  getShipLocationName(): string {
    const shipId = this.form.get('shipId')?.value;
    if (!shipId) return '-';
    const consignee = this.consignees.find((c) => c.code === shipId);
    return consignee?.description || '-';
  }

  getSurgeryTypeDescription(): string {
    const surgType = this.form.get('surgType')?.value;
    if (!surgType) return '-';
    const type = this.surgeryTypes.find((t) => t.code === surgType);
    return type?.description || '-';
  }

  openNewPhysician(): void {
    const formValues = this.serializeFormValues(this.form.getRawValue());
    const returnUrl = `/donor-functions/special-donations/register-special-donation-request/${this.patId}`;
    this.router.navigate(['/donor-functions/maintain-physician-list'], {
      state: {
        returnUrl,
        returnAction: 'reopen-surgery-dialog',
        surgeryDialogData: {
          mode: this.mode,
          patId: this.patId,
          surgId: this.surgId,
          formValues,
        }
      }
    });
    this.dialogRef.close(false);
  }

  private serializeFormValues(values: any): any {
    const result: any = {};
    for (const key of Object.keys(values)) {
      const v = values[key];
      result[key] = moment.isMoment(v) ? v.toISOString() : v;
    }
    return result;
  }

  refreshPhysicians(newPhyId?: string, retryCount = 0): void {
    this.service.getPhysicians().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      const items = r?.data || [];
      this.physicians = items.map((p: any) => ({
        code: p.phyId,
        description: `${p.lastName || ''}${p.firstName ? ', ' + p.firstName : ''}`
      }));
      this.physiciansSource.set(this.physicians);
      if (newPhyId) {
        const found = this.physicians.some((p: any) => p.code === newPhyId);
        if (found) {
          this.form.patchValue({ phyId: newPhyId });
        } else if (retryCount < 2) {
          timer(800).pipe(takeUntil(this.destroy$), switchMap(() => {
            this.refreshPhysicians(newPhyId, retryCount + 1);
            return [];
          })).subscribe();
        }
      }
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitSave();
  }

  private submitSave(): void {
    this.isSaving = true;

    const data = { ...this.form.value };
    if (data.surgDate) {
      const m = moment.isMoment(data.surgDate) ? data.surgDate : moment(data.surgDate);
      data.surgDate = m.format('YYYY-MM-DD');
    }
    if (data.phyAuthDate) {
      const m = moment.isMoment(data.phyAuthDate) ? data.phyAuthDate : moment(data.phyAuthDate);
      data.phyAuthDate = m.format('YYYY-MM-DD');
    }
    if (data.dateNeededBy) {
      const m = moment.isMoment(data.dateNeededBy) ? data.dateNeededBy : moment(data.dateNeededBy);
      data.dateNeededBy = m.format('YYYY-MM-DD');
    }
    if (data.closedDate) {
      const m = moment.isMoment(data.closedDate) ? data.closedDate : moment(data.closedDate);
      data.closedDate = m.format('YYYY-MM-DD');
    }

    const request$ = this.mode === 'edit'
      ? this.service.updateSurgery(this.surgId, data)
      : this.service.createSurgery({ ...data, patId: this.patId });

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSnackbar(`Surgery ${this.mode === 'edit' ? 'updated' : 'created'} successfully`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        this.showSnackbar(HttpErrorHandler.extractErrorMessage(err, `Failed to ${this.mode === 'edit' ? 'update' : 'create'} surgery`));
      },
    });
  }

  onDateInput(event: Event, controlName: string): void {
    const input = (event.target as HTMLInputElement).value;
    const control = this.form.get(controlName);
    if (!control) return;
    control.markAsTouched();
    control.markAsDirty();
    if (input?.trim() && !control.value) {
      control.setErrors({ ...control.errors, invalidDate: true });
    }
  }

  onCancel(): void { this.dialogRef.close(false); }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }
}
