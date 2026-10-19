import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import moment from 'moment';
import {
  WEEK_DAYS,
  TIME_OPTIONS,
  CONFIRMATION_OPTIONS,
  CreateStandingOrderDto,
  UpdateStandingOrderDto
} from '../../models/standing-order.model';
import { StandingOrderService } from '../../services/standing-order.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

export interface AddEditStandingOrderDialogData {
  mode: 'create' | 'edit';
  contractId: string;
  consigneeId: string;
  weekDay?: string;
}

@Component({
  selector: 'app-add-edit-standing-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './add-edit-standing-order-dialog.html',
  styleUrl: './add-edit-standing-order-dialog.scss'
})
export class AddEditStandingOrderDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `add-edit-standing-order-${AddEditStandingOrderDialogComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddEditStandingOrderDialogComponent>);
  private readonly data = inject<AddEditStandingOrderDialogData>(MAT_DIALOG_DATA);
  private readonly standingOrderService = inject(StandingOrderService);

  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);

  protected readonly today = moment().startOf('day');
  protected readonly weekDays = WEEK_DAYS;
  protected readonly timeOptions = TIME_OPTIONS;
  protected readonly confirmationOptions = CONFIRMATION_OPTIONS;

  form!: FormGroup;
  isEditMode = false;
  dialogTitle = '';

  ngOnInit(): void {
    this.isEditMode = this.data.mode === 'edit';
    this.dialogTitle = this.isEditMode ? 'Edit Standing Order' : 'Add New Day';
    this.initForm();

    if (this.isEditMode) {
      this.loadExistingData();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      weekDay: [{ value: this.data.weekDay || null, disabled: this.isEditMode }, [Validators.required]],
      confirmFlag: ['Y', [Validators.required]],
      requiredTime: [null],
      effDate: [null, [Validators.required]],
      termDate: [null]
    });
  }

  private loadExistingData(): void {
    if (!this.data.weekDay) return;

    this.loading.set(true);
    this.standingOrderService.getStandingOrderById(
      this.data.contractId,
      this.data.consigneeId,
      this.data.weekDay
    ).subscribe({
      next: (order) => {
        if (order) {
          this.form.patchValue({
            weekDay: order.weekDay,
            confirmFlag: order.confirmFlag,
            requiredTime: order.requiredTime,
            effDate: order.effDate ? moment(order.effDate) : null,
            termDate: order.termDate ? moment(order.termDate) : null
          });
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load standing order details');
        this.loading.set(false);
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.getRawValue();

    if (this.isEditMode) {
      this.updateStandingOrder(formValue);
    } else {
      this.createStandingOrder(formValue);
    }
  }

  private createStandingOrder(formValue: any): void {
    const dto: CreateStandingOrderDto = {
      contractId: this.data.contractId,
      consigneeId: this.data.consigneeId,
      weekDay: formValue.weekDay,
      confirmFlag: formValue.confirmFlag,
      requiredTime: formValue.requiredTime,
      effDate: this.standingOrderService.serializeDateForApi(formValue.effDate)!,
      termDate: this.standingOrderService.serializeDateForApi(formValue.termDate)
    };

    this.standingOrderService.createStandingOrder(dto).subscribe({
      next: () => {
        this.loading.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.errorResponse?.error || 'Failed to create standing order');
      }
    });
  }

  private updateStandingOrder(formValue: any): void {
    const dto: UpdateStandingOrderDto = {
      confirmFlag: formValue.confirmFlag,
      requiredTime: formValue.requiredTime,
      effDate: this.standingOrderService.serializeDateForApi(formValue.effDate)!,
      termDate: this.standingOrderService.serializeDateForApi(formValue.termDate)
    };

    this.standingOrderService.updateStandingOrder(
      this.data.contractId,
      this.data.consigneeId,
      this.data.weekDay!,
      dto
    ).subscribe({
      next: () => {
        this.loading.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.errorResponse?.error || 'Failed to update standing order');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
