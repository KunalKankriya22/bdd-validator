import {
  Component,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import {
  BleedTimeDetailsDialogData,
  BleedTimeDetailsDialogResult,
  EmployeeLookupDto,
  ArmUsedValue,
} from '../../../modules/donor-functions/donor-functions-components/donor-registration/models/donor-registration.model';

@Component({
  selector: 'app-bleed-time-details-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    UpperCasePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './bleed-time-details-dialog.html',
  styleUrl: './bleed-time-details-dialog.scss',
})
export class BleedTimeDetailsDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<BleedTimeDetailsDialog>);
  readonly data: BleedTimeDetailsDialogData = inject(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  employees: EmployeeLookupDto[] = [];
  filteredEmployees: EmployeeLookupDto[] = [];
  phlebSearchCtrl = new FormControl('');
  form!: FormGroup;
  selectedArm: ArmUsedValue = '';

  isLeftEnabled = false;
  isRightEnabled = false;
  isOtherEnabled = false;

  private readonly leftFields = [
    'leftStartTime1', 'leftStartPhleb1', 'leftEndTime1', 'leftEndPhleb1',
    'leftStartTime2', 'leftStartPhleb2', 'leftEndTime2', 'leftEndPhleb2',
  ];
  private readonly rightFields = [
    'rightStartTime1', 'rightStartPhleb1', 'rightEndTime1', 'rightEndPhleb1',
    'rightStartTime2', 'rightStartPhleb2', 'rightEndTime2', 'rightEndPhleb2',
  ];
  private readonly otherFields = [
    'otherTime', 'otherPhleb', 'otherEndTime', 'otherEndPhleb',
  ];

  constructor() {
    this.employees = this.data.employees ?? [];
    this.filteredEmployees = [...this.employees];
    this.selectedArm = this.data.selectedArm ?? '';
    this.initForm();
    this.applyArmSelection(this.selectedArm);
  }

  ngOnInit(): void {
    this.phlebSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredEmployees = this.employees.filter(emp =>
          emp.staffNo.toLowerCase().includes(term)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPhlebDropdownOpened(): void {
    this.phlebSearchCtrl.setValue('');
    this.filteredEmployees = [...this.employees];
  }

  private readonly timePattern = Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/);

  formatTimeOnBlur(controlName: string): void {
    const ctrl = this.form.get(controlName);
    if (!ctrl) return;
    const raw = ctrl.value || '';
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) return;
    let val = raw.replace(/[^0-9]/g, '');
    if (val.length === 3) val = '0' + val;
    if (val.length === 4) {
      ctrl.setValue(val.substring(0, 2) + ':' + val.substring(2), { emitEvent: false });
    }
  }

  onPhlebBlur(controlName: string): void {
    const ctrl = this.form.get(controlName);
    if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  onDoubleStickChange(): void {
    const val = this.form.get('doubleStickId')?.value;
    const isDouble = val === 'Y';
    const arm = this.selectedArm;
    const l2Fields = ['leftStartTime2', 'leftStartPhleb2', 'leftEndTime2', 'leftEndPhleb2'];
    const r2Fields = ['rightStartTime2', 'rightStartPhleb2', 'rightEndTime2', 'rightEndPhleb2'];

    if (isDouble) {
      if (arm === 'L' || arm === 'B') this.toggleFields(l2Fields, true);
      if (arm === 'R' || arm === 'B') this.toggleFields(r2Fields, true);
    } else {
      l2Fields.forEach(f => { this.form.get(f)?.setValue('', { emitEvent: false }); });
      r2Fields.forEach(f => { this.form.get(f)?.setValue('', { emitEvent: false }); });
      this.toggleFields(l2Fields, false);
      this.toggleFields(r2Fields, false);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      doubleStickId: [this.data.doubleStickId ?? 'N'],
      currentDriveDate: [{ value: this.data.currentDriveDate ?? '', disabled: true }],

      leftStartTime1: [this.data.leftArm?.startTime1 ?? '', [this.timePattern]],
      leftStartPhleb1: [this.data.leftArm?.startPhleb1 ?? ''],
      leftEndTime1: [this.data.leftArm?.endTime1 ?? '', [this.timePattern]],
      leftEndPhleb1: [this.data.leftArm?.endPhleb1 ?? ''],
      leftStartTime2: [this.data.leftArm?.startTime2 ?? '', [this.timePattern]],
      leftStartPhleb2: [this.data.leftArm?.startPhleb2 ?? ''],
      leftEndTime2: [this.data.leftArm?.endTime2 ?? '', [this.timePattern]],
      leftEndPhleb2: [this.data.leftArm?.endPhleb2 ?? ''],

      rightStartTime1: [this.data.rightArm?.startTime1 ?? '', [this.timePattern]],
      rightStartPhleb1: [this.data.rightArm?.startPhleb1 ?? ''],
      rightEndTime1: [this.data.rightArm?.endTime1 ?? '', [this.timePattern]],
      rightEndPhleb1: [this.data.rightArm?.endPhleb1 ?? ''],
      rightStartTime2: [this.data.rightArm?.startTime2 ?? '', [this.timePattern]],
      rightStartPhleb2: [this.data.rightArm?.startPhleb2 ?? ''],
      rightEndTime2: [this.data.rightArm?.endTime2 ?? '', [this.timePattern]],
      rightEndPhleb2: [this.data.rightArm?.endPhleb2 ?? ''],

      otherTime: [this.data.other?.startTime1 ?? '', [this.timePattern]],
      otherPhleb: [this.data.other?.startPhleb1 ?? ''],
      otherEndTime: [this.data.other?.endTime1 ?? '', [this.timePattern]],
      otherEndPhleb: [''],

      drawStartTime: [this.data.drawStartTime ?? '', [this.timePattern]],
      mrsLoss: [this.data.mrsLoss ?? ''],
      phlebotomistLoss: [this.data.phlebotomistLoss ?? ''],
    });
  }

  onArmSelectionChange(arm: ArmUsedValue): void {
    this.selectedArm = arm;
    this.applyArmSelection(arm);
  }

  private applyArmSelection(arm: ArmUsedValue): void {
    this.isLeftEnabled = arm === 'L' || arm === 'B';
    this.isRightEnabled = arm === 'R' || arm === 'B';
    this.isOtherEnabled = arm === 'O';

    this.toggleFields(this.leftFields, this.isLeftEnabled);
    this.toggleFields(this.rightFields, this.isRightEnabled);
    this.toggleFields(this.otherFields, this.isOtherEnabled);

    const isDouble = this.form.get('doubleStickId')?.value === 'Y';
    if (!isDouble) {
      const l2 = ['leftStartTime2', 'leftStartPhleb2', 'leftEndTime2', 'leftEndPhleb2'];
      const r2 = ['rightStartTime2', 'rightStartPhleb2', 'rightEndTime2', 'rightEndPhleb2'];
      this.toggleFields(l2, false);
      this.toggleFields(r2, false);
    }
  }

  private toggleFields(fields: string[], enable: boolean): void {
    fields.forEach((field) => {
      const control = this.form.get(field);
      if (enable) {
        control?.enable({ emitEvent: false });
      } else {
        control?.disable({ emitEvent: false });
      }
    });
  }

  private readonly timeFields = [
    'leftStartTime1', 'leftEndTime1', 'leftStartTime2', 'leftEndTime2',
    'rightStartTime1', 'rightEndTime1', 'rightStartTime2', 'rightEndTime2',
    'otherTime', 'otherEndTime', 'drawStartTime',
  ];

  hasTimeErrors(): boolean {
    return this.timeFields.some((f) => {
      const ctrl = this.form.get(f);
      return ctrl?.enabled && ctrl?.hasError('pattern') && ctrl?.touched;
    });
  }

  onApply(): void {
    this.timeFields.forEach((f) => {
      this.formatTimeOnBlur(f);
      this.form.get(f)?.markAsTouched();
    });
    if (this.hasTimeErrors()) return;

    this.dialogRef.close({
      action: 'apply',
      selectedArm: this.selectedArm,
      data: {
        ...this.data,
        ...this.form.getRawValue(),
        selectedArm: this.selectedArm,
      },
    } as BleedTimeDetailsDialogResult);
  }

  onClearAll(): void {
    const currentArm = this.selectedArm;
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.form.get('currentDriveDate')?.setValue(this.data.currentDriveDate ?? '');
    this.selectedArm = currentArm;
    this.applyArmSelection(currentArm);
  }

  onClose(): void {
    this.dialogRef.close({ action: 'cancel' } as BleedTimeDetailsDialogResult);
  }
}
