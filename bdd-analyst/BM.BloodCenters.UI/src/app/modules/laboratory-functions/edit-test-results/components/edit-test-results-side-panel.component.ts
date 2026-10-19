import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { A11yModule } from '@angular/cdk/a11y';
import { Subject, takeUntil } from 'rxjs';

import { UnitTestResultDto, EditTestResultFormValue } from '../models/edit-test-results.model';

/**
 * Dropdown option interface
 */
export interface DropdownOption {
  code: string;
  description?: string;
}

/**
 * Side Panel Component for Editing Test Results
 * JIRA Ticket: MLT-12750
 */
@Component({
  selector: 'app-edit-test-results-side-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  templateUrl: './edit-test-results-side-panel.component.html',
  styleUrl: './edit-test-results-side-panel.component.scss'
})
export class EditTestResultsSidePanelComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  private static nextId = 0;
  protected readonly componentId = `edit-test-side-panel-${EditTestResultsSidePanelComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  @ViewChild('closeButton') closeButton!: ElementRef<HTMLButtonElement>;
  private previousActiveElement: Element | null = null;

  // Inputs
  @Input() isOpen = false;
  @Input() testData: UnitTestResultDto | null = null;
  @Input() resultOptions: DropdownOption[] = [];
  @Input() editReasonOptions: DropdownOption[] = [];

  // Outputs
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EditTestResultFormValue>();

  // Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // Search controls for dropdowns
  resultSearchCtrl = new FormControl('');
  editReasonSearchCtrl = new FormControl('');

  // Filtered options
  filteredResultOptions: DropdownOption[] = [];
  filteredEditReasonOptions: DropdownOption[] = [];

  // Form
  form!: FormGroup;

  // Check if form is valid for save button
  get isFormValid(): boolean {
    if (!this.form) return false;
    return this.form.valid &&
           !!this.form.get('resultStatus1')?.value &&
           !!this.form.get('voidReason')?.value;
  }

  // Check if absorbance field should be editable (has existing value)
  get isAbsorbanceEditable(): boolean {
    if (!this.testData) return false;
    const value = this.testData.absorbance;
    return value !== null && value !== undefined && value !== '';
  }

  // Check if ratio field should be editable (has existing value)
  get isRatioEditable(): boolean {
    if (!this.testData) return false;
    const value = this.testData.ratio;
    return value !== null && value !== undefined && value !== '';
  }

  ngOnInit(): void {
    this.initForm();
    this.setupSearchFilters();
  }

  ngAfterViewInit(): void {
    // Focus management handled in ngOnChanges when isOpen changes
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['testData'] && this.testData && this.form) {
      this.populateForm(this.testData);
    }
    if (changes['resultOptions']) {
      this.filteredResultOptions = [...this.resultOptions];
    }
    if (changes['editReasonOptions']) {
      this.filteredEditReasonOptions = [...this.editReasonOptions];
    }

    // Handle focus management when panel opens/closes
    if (changes['isOpen']) {
      if (this.isOpen) {
        // Store currently focused element before opening
        this.previousActiveElement = document.activeElement;
        // Focus the close button after a brief delay to allow animation
        setTimeout(() => {
          if (this.closeButton?.nativeElement) {
            this.closeButton.nativeElement.focus();
          }
        }, 100);
      } else if (changes['isOpen'].previousValue === true) {
        // Restore focus when panel closes
        setTimeout(() => {
          if (this.previousActiveElement instanceof HTMLElement) {
            this.previousActiveElement.focus();
          }
        }, 100);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      resultStatus1: ['', [Validators.required, Validators.maxLength(10)]],
      voidReason: ['', [Validators.required]],
      absorbance: ['', [Validators.pattern(/^-?\d*\.?\d*$/)]],
      ratio: ['', [Validators.pattern(/^-?\d*\.?\d*$/)]],
      testSeqNo: [{ value: null, disabled: true }],
      collDate: [{ value: null, disabled: true }]
    });
  }

  private setupSearchFilters(): void {
    // Filter result options on search
    this.resultSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        this.filterResultOptions(search || '');
      });

    // Filter edit reason options on search
    this.editReasonSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        this.filterEditReasonOptions(search || '');
      });
  }

  private filterResultOptions(search: string): void {
    if (!search) {
      this.filteredResultOptions = [...this.resultOptions];
      return;
    }
    const term = search.toLowerCase();
    this.filteredResultOptions = this.resultOptions.filter(opt =>
      opt.code.toLowerCase().includes(term) ||
      (opt.description && opt.description.toLowerCase().includes(term))
    );
  }

  private filterEditReasonOptions(search: string): void {
    if (!search) {
      this.filteredEditReasonOptions = [...this.editReasonOptions];
      return;
    }
    const term = search.toLowerCase();
    this.filteredEditReasonOptions = this.editReasonOptions.filter(opt =>
      opt.code.toLowerCase().includes(term) ||
      (opt.description && opt.description.toLowerCase().includes(term))
    );
  }

  private populateForm(data: UnitTestResultDto): void {
    this.form.patchValue({
      resultStatus1: data.resultStatus1 || '',
      voidReason: data.voidReason || '',
      absorbance: data.absorbance || '',
      ratio: data.ratio || '',
      testSeqNo: data.testSeqNo,
      collDate: data.collDate
    });

    // Disable absorbance field if no existing value
    const absorbanceCtrl = this.form.get('absorbance');
    if (absorbanceCtrl) {
      if (data.absorbance === null || data.absorbance === undefined || data.absorbance === '') {
        absorbanceCtrl.disable();
      } else {
        absorbanceCtrl.enable();
      }
    }

    // Disable ratio field if no existing value
    const ratioCtrl = this.form.get('ratio');
    if (ratioCtrl) {
      if (data.ratio === null || data.ratio === undefined || data.ratio === '') {
        ratioCtrl.disable();
      } else {
        ratioCtrl.enable();
      }
    }

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  get f() {
    return this.form.controls;
  }

  onClearAll(): void {
    this.form.reset({
      resultStatus1: '',
      voidReason: '',
      absorbance: this.testData?.absorbance || '',
      ratio: this.testData?.ratio || '',
      testSeqNo: this.testData?.testSeqNo || null,
      collDate: this.testData?.collDate || null
    });

    // Reset search controls
    this.resultSearchCtrl.setValue('');
    this.editReasonSearchCtrl.setValue('');

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    this.isSubmitting.set(true);

    const absorbanceValue = this.f['absorbance']?.value;
    const ratioValue = this.f['ratio']?.value;

    const formValue: EditTestResultFormValue = {
      resultStatus1: this.f['resultStatus1'].value,
      voidReason: this.f['voidReason'].value,
      absorbance: absorbanceValue && absorbanceValue.toString().trim() !== '' ? parseFloat(absorbanceValue) : null,
      ratio: ratioValue && ratioValue.toString().trim() !== '' ? parseFloat(ratioValue) : null,
      testSeqNo: this.testData?.testSeqNo,
      collDate: this.testData?.collDate
    };

    this.saved.emit(formValue);
  }

  onCancel(): void {
    this.closed.emit();
  }

  resetFormAfterSave(): void {
    this.isSubmitting.set(false);
    if (this.testData) {
      this.populateForm(this.testData);
    }
  }

  resetFormAfterError(): void {
    this.isSubmitting.set(false);
  }
}
