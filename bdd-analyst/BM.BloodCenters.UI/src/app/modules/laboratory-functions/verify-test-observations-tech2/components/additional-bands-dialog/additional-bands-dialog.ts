import { Component, Inject, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';

import { TestBandDto, AdditionalBandDto } from '../../models/verify-test-observations-tech2.model';
import { VerifyTestObservationsTech2ApiService } from '../../services/verify-test-observations-tech2-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';

export interface AdditionalBandsDialogData {
  unitId: string;
  testBands: TestBandDto[];
  additionalBands: AdditionalBandDto[];
  tbId: string;
  testId: string;
  tbSeqNo: number;
  testType: string;
}

@Component({
  selector: 'app-additional-bands-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './additional-bands-dialog.html',
  styleUrls: ['./additional-bands-dialog.scss']
})
export class AdditionalBandsDialogComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AdditionalBandsDialogComponent>);
  private readonly apiService = inject(VerifyTestObservationsTech2ApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  protected readonly testBands = signal<TestBandDto[]>([]);
  protected readonly unitId = signal<string>('');
  protected readonly saving = signal<boolean>(false);

  form!: FormGroup;

  private tbId = '';
  private testId = '';
  private tbSeqNo = 0;
  private testType = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdditionalBandsDialogData
  ) {
    this.testBands.set(data.testBands);
    this.unitId.set(data.unitId);
    this.tbId = data.tbId;
    this.testId = data.testId;
    this.tbSeqNo = data.tbSeqNo;
    this.testType = data.testType;
    this.initForm(data.additionalBands);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(initialBands: AdditionalBandDto[]): void {
    this.form = this.fb.group({
      bands: this.fb.array([])
    });

    if (initialBands && initialBands.length > 0) {
      initialBands.forEach(band => this.addBand(band));
    }
    this.addBand();
  }

  get bandsArray(): FormArray {
    return this.form.get('bands') as FormArray;
  }

  private createBandGroup(band?: AdditionalBandDto): FormGroup {
    const group = this.fb.group({
      band1: [band?.band1 || ''],
      band2: [{ value: band?.band2 || '', disabled: true }]
    });

    group.get('band1')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedBand1 => {
        const band2Control = group.get('band2')!;
        if (!selectedBand1) {
          band2Control.setValue('', { emitEvent: false });
          return;
        }
        band2Control.setValue(this.calculateBand2(selectedBand1), { emitEvent: false });
      });

    return group;
  }

  private calculateBand2(band1Name: string): string {
    const bands = this.testBands();
    const band1 = bands.find(b => b.bandName === band1Name);
    if (!band1) return '';

    const nextBand = bands.find(b => b.bandSeq === band1.bandSeq + 1);
    return nextBand ? nextBand.bandName : '';
  }

  addBand(band?: AdditionalBandDto): void {
    this.bandsArray.push(this.createBandGroup(band));
  }

  onAddNew(): void {
    this.addBand();
  }

  onClearAll(): void {
    this.form.setControl('bands', this.fb.array([this.createBandGroup()]));

    this.apiService.deleteOtherBands(this.tbId, this.testId, this.data.unitId, this.tbSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Other test bands cleared successfully.');
        },
        error: () => {}
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    const otherBands: AdditionalBandDto[] = this.bandsArray.getRawValue()
      .filter((band: AdditionalBandDto) => band.band1 || band.band2);

    if (otherBands.length === 0) {
      this.dialogRef.close([]);
      return;
    }

    this.saving.set(true);
    this.apiService.saveOtherBands({
      tbId: this.tbId,
      testId: this.testId,
      unitId: this.data.unitId,
      tbSeqNo: this.tbSeqNo,
      testType: this.testType,
      otherBands
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbarService.showSuccess('Other test bands saved successfully.');
          this.dialogRef.close(otherBands);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackbarService.showError(err.error?.message || 'Failed to save other bands');
        }
      });
  }
}
