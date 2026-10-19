import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';

import { ConfirmatorySampleTransferOutApiService } from '../../services/confirmatory-sample-transfer-out-api.service';
import {
  BoxHeaderDto,
  BoxUnitDto,
  BoxUnitTestDto,
  FacilityDropdownDto,
  SampleTypeDropdownDto,
  TestIdDropdownDto,
  AddUnitToBoxDto,
  UpdateUnitInBoxDto,
  AddTestToSampleDto,
} from '../../models/confirmatory-sample-transfer-out.model';

export interface EditUnitsDialogData {
  boxHeader: BoxHeaderDto;
  units: BoxUnitDto[];
  facilities: FacilityDropdownDto[];
  selectedUnit?: BoxUnitDto;
}

@Component({
  selector: 'app-edit-units-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './edit-units-dialog.component.html',
  styleUrl: './edit-units-dialog.component.scss'
})
export class EditUnitsDialogComponent implements OnInit, OnDestroy {
  readonly data = inject<EditUnitsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EditUnitsDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ConfirmatorySampleTransferOutApiService);
  private readonly snackbarService = inject(SnackbarService);

  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly sampleTypes = signal<SampleTypeDropdownDto[]>([]);
  protected readonly testIds = signal<TestIdDropdownDto[]>([]);
  protected readonly currentUnit = signal<BoxUnitDto | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  // Forms
  unitForm!: FormGroup;
  testForm!: FormGroup;

  // Date constraints
  protected readonly today = moment().startOf('day');
  protected readonly maxDate = moment().startOf('day');

  ngOnInit(): void {
    this.initForms();
    this.loadSampleTypes();
    this.loadTestIds();

    if (this.data.selectedUnit) {
      this.loadUnitForEdit(this.data.selectedUnit);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize forms
   */
  private initForms(): void {
    this.unitForm = this.fb.group({
      unitId: ['', [Validators.required, Validators.maxLength(10)]],
      collDate: [null, [Validators.required]],
      contractId: ['', [Validators.maxLength(10)]],
      sampleType: ['', [Validators.required, Validators.maxLength(3)]],
      frozenFlag: ['N']
    });

    this.testForm = this.fb.group({
      testId: ['', [Validators.required]]
    });
  }

  /**
   * Load sample types dropdown
   */
  private loadSampleTypes(): void {
    this.apiService
      .getActiveSampleTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sampleTypes.set(data);
        },
        error: (err) => {
          this.snackbarService.showError('Failed to load sample types.');
          console.error('Failed to load sample types:', err);
        }
      });
  }

  /**
   * Load test IDs for the current facility
   */
  private loadTestIds(): void {
    const facilityCode = this.data.boxHeader.facilityCode;

    this.apiService
      .getActiveTestIds(facilityCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.testIds.set(data);
        },
        error: (err) => {
          this.snackbarService.showError('Failed to load test IDs.');
          console.error('Failed to load test IDs:', err);
        }
      });
  }

  /**
   * Load unit data for editing
   */
  private loadUnitForEdit(unit: BoxUnitDto): void {
    this.currentUnit.set(unit);

    this.unitForm.patchValue({
      unitId: unit.unitId,
      collDate: moment(unit.collDate),
      contractId: unit.contractId || '',
      sampleType: unit.sampleType,
      frozenFlag: unit.frozenFlag || 'N'
    });

    // Disable unit ID and collection date when editing
    this.unitForm.get('unitId')?.disable();
    this.unitForm.get('collDate')?.disable();
    this.unitForm.get('contractId')?.disable();
  }

  /**
   * Add unit to box
   */
  onAddUnit(): void {
    this.submitted.set(true);

    if (this.unitForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const formValue = this.unitForm.getRawValue();
    const dto: AddUnitToBoxDto = {
      unitId: formValue.unitId.trim(),
      collDate: formValue.collDate.format('YYYY-MM-DDTHH:mm:ss'),
      sampleType: formValue.sampleType,
      frozenFlag: formValue.frozenFlag || 'N'
    };

    this.loading.set(true);

    this.apiService
      .addUnitToBox(this.data.boxHeader.boxId, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sampleSeqNo) => {
          this.loading.set(false);
          this.snackbarService.showSuccess(`Unit added successfully. Sample Seq No: ${sampleSeqNo}`);
          this.unitForm.reset({ frozenFlag: 'N' });
          this.submitted.set(false);
          this.dialogRef.close({ updated: true });
        },
        error: (err) => {
          this.loading.set(false);
          const errorMessage = err?.error?.message || err?.message || 'Failed to add unit.';
          this.snackbarService.showError(errorMessage);
          console.error('Failed to add unit:', err);
        }
      });
  }

  /**
   * Update unit in box
   */
  onUpdateUnit(): void {
    if (!this.currentUnit()) {
      return;
    }

    this.submitted.set(true);

    if (this.unitForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const formValue = this.unitForm.getRawValue();
    const dto: UpdateUnitInBoxDto = {
      unitId: this.currentUnit()!.unitId,
      collDate: this.currentUnit()!.collDate,
      sampleType: formValue.sampleType,
      frozenFlag: formValue.frozenFlag || 'N'
    };

    this.loading.set(true);

    this.apiService
      .updateUnitInBox(this.data.boxHeader.boxId, this.currentUnit()!.sampleSeqNo, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Unit updated successfully.');
          this.dialogRef.close({ updated: true });
        },
        error: (err) => {
          this.loading.set(false);
          const errorMessage = err?.error?.message || err?.message || 'Failed to update unit.';
          this.snackbarService.showError(errorMessage);
          console.error('Failed to update unit:', err);
        }
      });
  }

  /**
   * Delete unit from box
   */
  onDeleteUnit(): void {
    if (!this.currentUnit()) {
      return;
    }

    if (!confirm(`Are you sure you want to delete unit ${this.currentUnit()!.unitId}?`)) {
      return;
    }

    this.loading.set(true);

    this.apiService
      .deleteUnitFromBox(this.data.boxHeader.boxId, this.currentUnit()!.sampleSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Unit deleted successfully.');
          this.dialogRef.close({ updated: true });
        },
        error: (err) => {
          this.loading.set(false);
          const errorMessage = err?.error?.message || err?.message || 'Failed to delete unit.';
          this.snackbarService.showError(errorMessage);
          console.error('Failed to delete unit:', err);
        }
      });
  }

  /**
   * Add test to current unit
   */
  onAddTest(): void {
    if (!this.currentUnit()) {
      this.snackbarService.showError('Please save the unit first before adding tests.');
      return;
    }

    if (this.testForm.invalid) {
      return;
    }

    const unit = this.currentUnit()!;
    const dto: AddTestToSampleDto = {
      testId: this.testForm.get('testId')?.value,
      facilityCode: this.data.boxHeader.facilityCode,
      unitId: unit.unitId,
      sampleType: unit.sampleType,
      collDate: unit.collDate,
    };

    this.loading.set(true);

    this.apiService
      .addTestToSample(this.currentUnit()!.sampleSeqNo, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Test added successfully.');
          this.testForm.reset();
          this.dialogRef.close({ updated: true });
        },
        error: (err) => {
          this.loading.set(false);
          const errorMessage = err?.error?.message || err?.message || 'Failed to add test.';
          this.snackbarService.showError(errorMessage);
          console.error('Failed to add test:', err);
        }
      });
  }

  /**
   * Delete test from current unit
   */
  onDeleteTest(test: BoxUnitTestDto): void {
    if (!this.currentUnit()) {
      return;
    }

    if (!confirm(`Are you sure you want to delete test ${test.testId}?`)) {
      return;
    }

    this.loading.set(true);

    this.apiService
      .deleteTestFromSample(this.currentUnit()!.sampleSeqNo, test.testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Test deleted successfully.');
          this.dialogRef.close({ updated: true });
        },
        error: (err) => {
          this.loading.set(false);
          const errorMessage = err?.error?.message || err?.message || 'Failed to delete test.';
          this.snackbarService.showError(errorMessage);
          console.error('Failed to delete test:', err);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close({ updated: false });
  }

  get f() {
    return this.unitForm.controls;
  }

  get tf() {
    return this.testForm.controls;
  }
}
