import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { ReasonCodeDto, BatchDetailDto } from '../models/reconcile-lab-warehouse-batch.model';

/**
 * Dialog data interface for Add Reconciliation Reason dialog
 */
export interface AddReconciliationReasonDialogData {
  reasonCodes: ReasonCodeDto[];
  selectedUnits: BatchDetailDto[];
}

/**
 * Dialog result interface
 */
export interface AddReconciliationReasonDialogResult {
  reconReason: string;
  reconDetail: string;
}

/**
 * Add Reconciliation Reason Dialog Component
 * Allows users to add a reconciliation reason and optional details to selected unit IDs
 */
@Component({
  selector: 'app-add-reconciliation-reason-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './add-reconciliation-reason-dialog.html',
  styleUrls: ['./add-reconciliation-reason-dialog.scss'],
})
export class AddReconciliationReasonDialogComponent implements OnInit {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `add-reconciliation-reason-dialog-${AddReconciliationReasonDialogComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  form!: FormGroup;
  submitted = signal<boolean>(false);
  maxDetailLength = 240;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddReconciliationReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddReconciliationReasonDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      reconReason: ['', [Validators.required]],
      reconDetail: ['', [Validators.maxLength(this.maxDetailLength)]],
    });
  }

  get f() {
    return this.form.controls;
  }

  get selectedUnitCount(): number {
    return this.data.selectedUnits.length;
  }

  get detailCharCount(): number {
    return this.f['reconDetail'].value?.length || 0;
  }

  get selectedCodeDescription(): string {
    const selectedCode = this.f['reconReason'].value;
    if (!selectedCode) return '';
    const found = this.data.reasonCodes.find(c => c.code === selectedCode);
    return found?.codeDesc || '';
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onAdd(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = this.dialogRef['_containerInstance']?.['_elementRef']?.nativeElement?.querySelector(
        '.ng-invalid[formControlName]'
      );
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const result: AddReconciliationReasonDialogResult = {
      reconReason: this.f['reconReason'].value,
      reconDetail: this.f['reconDetail'].value || '',
    };

    this.dialogRef.close(result);
  }

  /**
   * Format reason code display with code and description
   */
  formatReasonCode(code: ReasonCodeDto): string {
    return `${code.code} - ${code.codeDesc}`;
  }
}
