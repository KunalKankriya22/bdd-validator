import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { A11yModule } from '@angular/cdk/a11y';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import {
  AttributeServiceCodeModel,
  UpdateAttributeServiceCodeDto
} from '../models/attribute-service-code.model';
import { AttributeServiceCodeApiService } from '../services/attribute-service-code-api.service';

@Component({
  selector: 'app-edit-attribute-service-code',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    A11yModule
  ],
  templateUrl: './edit-attribute-service-code.html',
  styleUrl: './edit-attribute-service-code.scss'
})
export class EditAttributeServiceCodeComponent implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `edit-attr-svc-${EditAttributeServiceCodeComponent.nextId++}`;

  // Generate unique IDs for form elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @Input() isOpen = false;
  @Input() data: AttributeServiceCodeModel | null = null;

  @Output() closePanel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  @ViewChild('sidePanelContent') sidePanelContent?: ElementRef;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(AttributeServiceCodeApiService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly priceExceedsMax = signal<boolean>(false);

  form!: FormGroup;

  creditFlagOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      // Read-only fields (displayed as labels in template)
      attribGroup: [{ value: '', disabled: true }],
      attribCode: [{ value: '', disabled: true }],
      attribDesc: [{ value: '', disabled: true }],

      // Editable fields
      price: [
        null,
        [
          Validators.min(0),
          Validators.max(9999999999.99),
          Validators.pattern(/^\d{1,10}(\.\d{1,2})?$/)
        ]
      ],
      serviceCode: [
        '',
        [Validators.maxLength(8)]
      ],
      creditFlag: ['']
    });

    this.setupFieldSubscriptions();

    if (this.data) {
      this.patchFormWithData(this.data);
    }
  }

  private setupFieldSubscriptions(): void {
    this.form.get('price')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const priceControl = this.form.get('price')!;
        const hasMaxError = !!(priceControl.errors?.['max'] || priceControl.errors?.['pattern']);
        this.priceExceedsMax.set(hasMaxError);
      });

    this.form.get('serviceCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        if (value && value !== value.toUpperCase()) {
          this.form.get('serviceCode')!.setValue(value.toUpperCase(), { emitEvent: false });
        }
      });

    this.form.get('creditFlag')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('creditFlag')!.markAsTouched();
      });
  }

  /**
   * Populate form when data is provided
   */
  ngOnChanges(): void {
    if (this.data && this.form) {
      this.patchFormWithData(this.data);
      this.submitted.set(false);
    }
  }

  private patchFormWithData(data: AttributeServiceCodeModel): void {
    this.form.patchValue({
      attribGroup: data.attribGroup,
      attribCode: data.attribCode,
      attribDesc: data.attribDesc,
      price: data.price,
      serviceCode: data.serviceCode,
      creditFlag: data.creditFlag
    });
  }

  get f() {
    return this.form.controls;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      // Focus first invalid field
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    if (!this.data) {
      return;
    }

    this.loading.set(true);

    const updateDto: UpdateAttributeServiceCodeDto = {
      price: this.form.value.price,
      serviceCode: this.form.value.serviceCode,
      creditFlag: this.form.value.creditFlag
    };

    this.apiService
      .updateAttributeServiceCode(
        this.data.attribGroup,
        this.data.attribCode,
        updateDto
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.showSuccessMessage();
          this.saved.emit();
          this.close();
        },
        error: (error) => {
          this.loading.set(false);
          this.showErrorMessage(error);
        }
      });
  }

  /**
   * Clear all editable fields
   */
  onClearAll(): void {
    this.form.patchValue({
      price: null,
      serviceCode: '',
      creditFlag: ''
    });
    this.submitted.set(false);
  }

  /**
   * Close side panel
   */
  close(): void {
    this.form.reset();
    this.submitted.set(false);
    this.closePanel.emit();
  }

  /**
   * Show success notification
   */
  private showSuccessMessage(): void {
    const code = this.data?.attribCode || '';
    this.snackBar.open(
      `Changes in master code ${code} have been saved.`,
      'DISMISS',
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      }
    );
  }

  /**
   * Show error notification
   */
  private showErrorMessage(error: any): void {
    const message = error?.error?.message || error?.message || 'Failed to save changes';
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Handle numeric input - only allow numbers
   */
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if (
      charCode === 8 ||
      charCode === 46 ||
      charCode === 9 ||
      charCode === 27 ||
      charCode === 13 ||
      charCode === 110 ||
      charCode === 190
    ) {
      return true;
    }
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((event.ctrlKey || event.metaKey) && [65, 67, 86, 88].includes(charCode)) {
      return true;
    }
    // Ensure that it is a number and stop the keypress
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Handle paste in price field - strip non-numeric characters
   */
  onPastePrice(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    // Allow numbers and decimal point only
    const numericOnly = pastedText.replace(/[^0-9.]/g, '');
    document.execCommand('insertText', false, numericOnly);
  }
}
