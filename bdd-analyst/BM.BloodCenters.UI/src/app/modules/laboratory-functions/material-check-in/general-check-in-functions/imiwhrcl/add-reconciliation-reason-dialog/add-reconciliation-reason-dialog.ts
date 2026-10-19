import { Component, Inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { ReasonCodeDto, TransportDetailDto } from '../models/reconcile-transport-batch.model';

/**
 * Dialog data interface for Add Reconciliation Reason dialog
 */
export interface AddReconciliationReasonDialogData {
  reasonCodes: ReasonCodeDto[];
  selectedUnits: TransportDetailDto[];
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
    NgxMatSelectSearchModule,
  ],
  templateUrl: './add-reconciliation-reason-dialog.html',
  styleUrls: ['./add-reconciliation-reason-dialog.scss'],
})
export class AddReconciliationReasonDialogComponent implements OnInit, OnDestroy {
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

  // Search control for reason code dropdown
  reasonCodeSearchControl = new FormControl('');
  filteredReasonCodes = signal<ReasonCodeDto[]>([]);

  // Signals for reactive updates
  selectedCodeDescription = signal<string>('');
  detailCharCount = signal<number>(0);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddReconciliationReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddReconciliationReasonDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.filteredReasonCodes.set(this.data.reasonCodes);
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      reconReason: ['', [Validators.required]],
      reconDetail: ['', [Validators.maxLength(this.maxDetailLength)]],
    });
  }

  private setupFormSubscriptions(): void {
    // Subscribe to reconReason changes to update description
    this.form.get('reconReason')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedCode) => {
        if (!selectedCode) {
          this.selectedCodeDescription.set('');
          return;
        }
        const found = this.data.reasonCodes.find((c) => c.code === selectedCode);
        this.selectedCodeDescription.set(found?.description || '');
      });

    // Subscribe to search control for filtering reason codes
    this.reasonCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterReasonCodes(searchTerm || '');
      });

    // Subscribe to reconDetail changes to update char count
    this.form.get('reconDetail')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.detailCharCount.set(value?.length || 0);
      });
  }

  private filterReasonCodes(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredReasonCodes.set(this.data.reasonCodes);
      return;
    }
    const term = searchTerm.toUpperCase();
    this.filteredReasonCodes.set(
      this.data.reasonCodes.filter(
        (code) =>
          code.code.toUpperCase().includes(term) ||
          code.description.toUpperCase().includes(term)
      )
    );
  }

  get f() {
    return this.form.controls;
  }

  get selectedUnitCount(): number {
    return this.data.selectedUnits.length;
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onAdd(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      return;
    }

    const result: AddReconciliationReasonDialogResult = {
      reconReason: this.f['reconReason'].value,
      reconDetail: this.f['reconDetail'].value || '',
    };

    this.dialogRef.close(result);
  }
}
