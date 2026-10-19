import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { ReportMasterTableService } from '../services/report-master-table.service';
import { noWhitespaceOnlyValidator } from '@shared/validators/input.validators';

@Component({
  selector: 'app-add-edit-report-master-table',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-report-master-table.html',
  styleUrls: ['./add-edit-report-master-table.scss'],
})
export class AddEditReportMasterTable implements OnInit, OnDestroy {
  form!: FormGroup;
  mode!: 'add' | 'edit';
  title!: string;
  chapterOptions: string[] = [];
  chapterIdSearchControl = new FormControl('');
  filteredChapterOptions: string[] = [];
  typeOptions: string[] = [];
  filteredTypeOptions: string[] = [];
  typeSearchControl = new FormControl('');
  warehouseOptions: Array<{ code: string; name: string }> = [];
  filteredWarehouseOptions: Array<{ code: string; name: string }> = [];
  warehouseSearchControl = new FormControl('');
  private recordData: any = null;
  private initialFormValues: any = null;
  private destroy$ = new Subject<void>();
  editModeValues = {
    chapterID: '',
    type: '',
    code: ''
  };

  constructor(
    public dialogRef: MatDialogRef<AddEditReportMasterTable>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private reportService: ReportMasterTableService
  ) {}

  ngOnInit(): void {
    this.mode = this.data?.mode || 'add';
    this.title = this.mode === 'add' ? 'Create New Record' : 'Edit Record';

    this.recordData = this.data?.record || {};

    // Populate edit mode display values
    if (this.mode === 'edit' && this.recordData) {
      this.editModeValues = {
        chapterID: this.recordData.chapterID || '',
        type: this.recordData.type || '',
        code: this.recordData.code || ''
      };
    }

    this.form = this.fb.group({
      chapterID: [
        { value: this.recordData.chapterID || '', disabled: this.mode === 'edit' },
        this.mode === 'add' ? Validators.required : null
      ],
      type: [{ value: this.recordData.type || '', disabled: this.mode === 'edit' }, [Validators.required, Validators.maxLength(6)]],
      code: [
        this.recordData.code || '',
        [Validators.required, Validators.maxLength(15)]
      ],
      description: [
        this.recordData.description || '',
        [Validators.required, Validators.maxLength(30), noWhitespaceOnlyValidator()]
      ],
      command: [this.recordData.command || '', Validators.maxLength(50)],
      port: [
        this.recordData.port || '',
        [Validators.pattern(/^\d+$/), Validators.min(1), Validators.max(65535)]  // Valid port range: 1-65535, numeric only
      ],
      sequence: [
        this.recordData.sequence ?? null,
        [Validators.min(0), Validators.max(999)]  // FMB: 0-999 range (API validation confirms)
      ],
      warehouse: ['', Validators.maxLength(1)], // FMB: MaximumLength="1" - LOCATION_ID field
      clientHostName: [this.recordData.clientHostName || '', [Validators.maxLength(100), this.clientHostValidator()]]
    });

    this.loadDropdowns();
    this.setupSearchControls();


    // Initialize change detection baseline for edit mode (will be updated after warehouse loads)
    if (this.mode === 'edit' && this.recordData) {
      this.initialFormValues = {
        code: this.recordData.code || '',
        description: this.recordData.description || '',
        command: this.recordData.command || '',
        port: this.recordData.port || '',
        sequence: this.recordData.sequence ?? null,
        warehouse: this.recordData.warehouse || '',
        clientHostName: this.recordData.clientHostName || ''
      };
    }

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchControls(): void {
    // Chapter ID search
    this.chapterIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        this.filteredChapterOptions = this.chapterOptions.filter(option =>
          option.toLowerCase().includes((search as string || '').toLowerCase())
        );
      });

    // Type search
    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredTypeOptions = this.typeOptions.filter(option =>
          option.toLowerCase().includes(term)
        );
      });

    // Warehouse search
    this.warehouseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredWarehouseOptions = this.warehouseOptions.filter(option =>
          option.code.toLowerCase().includes(term) ||
          option.name.toLowerCase().includes(term)
        );
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Allow only numeric input for sequence field (1-999)
  onSequenceKeyPress(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    const invalidChars = ['e', 'E', '+', '-', '.'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
      return;
    }

    const isDigit = event.key >= '0' && event.key <= '9';
    if (!isDigit) {
      event.preventDefault();
      return;
    }

    // Prevent more than 3 digits
    const input = event.target as HTMLInputElement;
    if (input.value.length >= 3 && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }

  // Handle paste event to prevent invalid characters (allow 0-999)
  onSequencePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    // Only allow digits
    const sanitizedValue = pastedData.replace(/[^0-9]/g, '');
    if (sanitizedValue) {
      const numValue = parseInt(sanitizedValue, 10);
      // Ensure value is within range 0-999 (FMB/API range)
      if (numValue >= 0 && numValue <= 999) {
        const control = this.form.get('sequence');
        control?.setValue(numValue);
        control?.markAsTouched();
      }
    }
  }

  // Allow only numeric input for port field (1-65535)
  onPortKeyPress(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    const invalidChars = ['e', 'E', '+', '-', '.'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
      return;
    }

    const isDigit = event.key >= '0' && event.key <= '9';
    if (!isDigit) {
      event.preventDefault();
      return;
    }

    // Prevent more than 5 digits (max port is 65535)
    const input = event.target as HTMLInputElement;
    if (input.value.length >= 5 && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }

  // Handle paste event for port field to prevent invalid characters (allow 1-65535)
  onPortPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    // Only allow digits
    const sanitizedValue = pastedData.replace(/[^0-9]/g, '');
    if (sanitizedValue) {
      const numValue = parseInt(sanitizedValue, 10);
      // Ensure value is within valid port range 1-65535
      if (numValue >= 1 && numValue <= 65535) {
        const control = this.form.get('port');
        control?.setValue(numValue.toString());
        control?.markAsTouched();
      }
    }
  }

  onTypeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      this.form.patchValue({ type: upper }, { emitEvent: false });
      input.value = upper;
    }
  }

  // Prevent leading space at the start of typing
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const newValue = value.toUpperCase();

    if (value !== newValue) {
      this.form.patchValue({ code: newValue }, { emitEvent: false });
      input.value = newValue;
    }
  }

  preventLeadingSpace(event: KeyboardEvent, controlName: string): void {
    if (event.key === ' ' && !this.form.get(controlName)?.value?.trim()) {
      event.preventDefault();
    }
  }

  /**
   * Custom validator for CLIENT_HOST field - Format validation only
   *
   * Validates hostname format for immediate UX feedback.
   * Backend also validates format + CODE_TYPE dependency as the authoritative source of truth.
   *
   * Note: UI shows/hides this field based on CODE_TYPE = 'OASVR',
   * so the invalidCodeType validation is handled by conditional rendering.
   *
   * FMB Format Rule: alphanumeric, hyphen, underscore only
   * FMB: If LTrim(:client_host,'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ-_') is not null
   */
  private clientHostValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const clientHost = control.value;

      if (!clientHost) {
        return null;  // Optional field
      }

      // Validate hostname format (alphanumeric, hyphen, underscore only)
      const hostnamePattern = /^[a-zA-Z0-9_-]+$/;
      if (!hostnamePattern.test(clientHost)) {
        return { invalidHostname: 'Invalid hostname format (alphanumeric, hyphen, underscore only)' };
      }

      return null;
    };
  }


  /**
   * Map warehouse description to warehouse code by matching against loaded dropdown data
   * This dynamically derives the mapping from the API response instead of using hardcoded values
   */
  private getWarehouseCodeFromDescription(description: string): string {
    if (!description) return '';

    const descriptionLower = description.toLowerCase().trim();

    // Find matching warehouse from the loaded options
    const matchingWarehouse = this.warehouseOptions.find(
      warehouse => warehouse.name.toLowerCase().trim() === descriptionLower
    );

    return matchingWarehouse?.code || '';
  }

  /**
   * Check if form data has changed from initial values (for edit mode)
   */
  private hasFormChanged(): boolean {
    if (this.mode !== 'edit' || !this.initialFormValues) {
      return true; // In add mode, always allow save if valid
    }

    const currentValues = this.form.getRawValue();

    return (
      currentValues.code !== this.initialFormValues.code ||
      currentValues.description !== this.initialFormValues.description ||
      currentValues.command !== this.initialFormValues.command ||
      currentValues.port !== this.initialFormValues.port ||
      currentValues.sequence !== this.initialFormValues.sequence ||
      currentValues.warehouse !== this.initialFormValues.warehouse ||
      currentValues.clientHostName !== this.initialFormValues.clientHostName
    );
  }

  /**
   * Check if save button should be enabled
   */
  get isSaveEnabled(): boolean {
    const isValid = this.form.valid;

    if (this.mode === 'edit') {
      return isValid && this.hasFormChanged();
    }

    return isValid;
  }

 onSave(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.snackBar.open(
      'Please correct the highlighted errors before saving.',
      'DISMISS',
      {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['custom-snackbar-position']
      }
    );
    return; // ✅ STOP here if invalid
  }

  const raw = this.form.getRawValue(); // includes disabled fields

  const payload = {
    chapterId: raw.chapterID,
    codeType: raw.type,
    code: raw.code,
    codeDescription: raw.description,
    codeInfo: raw.command,
    sequence: raw.sequence != null && raw.sequence !== '' ? Number(raw.sequence) : null,
    port: raw.port,
    locationId: raw.warehouse,
    clientHost: raw.clientHostName || null
  };

  if (this.mode === 'add') {
    this.reportService.createReportMaster(payload).subscribe({
      next: () => {
        this.snackBar.open(`New Report with code ${raw.code} has been added to the Master Table successfully`, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['custom-snackbar-position']
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Creation failed:', error);
        // Error is handled globally by authInterceptor
        // It will display formatted error like "Error 0319: Duplicate entry not allowed"
        // Do NOT close the dialog - let user fix the error and try again
      }
    });
  }

  if (this.mode === 'edit') {
    const query = {
      chapterId: raw.chapterID,
      codeType: raw.type,
      code: this.recordData.code
    };

    this.reportService.updateReportMaster(query, payload).subscribe({
      next: () => {
        this.snackBar.open(`Report with code ${raw.code} has been updated successfully`, 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['custom-snackbar-position']
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Update failed:', error);
        // Error is handled globally by authInterceptor
        // It will display formatted error like "Error 0319: Duplicate entry not allowed"
        // Do NOT close the dialog - let user fix the error and try again
      }
    });
  }
}


loadDropdowns(): void {
  this.reportService.getWarehouseChapterDropdowns()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        // Extract chapter IDs
        this.chapterOptions = (res.chapters || []).map(c => c.id);
        this.filteredChapterOptions = [...this.chapterOptions];

        // Map warehouses: id → code, description → name
        this.warehouseOptions = (res.warehouses || []).map(w => ({
          code: w.id,
          name: w.description
        }));
        this.filteredWarehouseOptions = [...this.warehouseOptions];

        // Set warehouse value after options are loaded (for edit mode)
        if (this.mode === 'edit' && this.recordData) {
          let warehouseValue = this.recordData.warehouse || '';

          // If warehouse is empty but description exists, map it to code
          if (!warehouseValue && this.recordData.warehouseDescrription) {
            warehouseValue = this.getWarehouseCodeFromDescription(this.recordData.warehouseDescrription);
          }

          this.form.patchValue({ warehouse: warehouseValue });

          this.initialFormValues = {
            code: this.recordData.code || '',
            description: this.recordData.description || '',
            command: this.recordData.command || '',
            port: this.recordData.port || '',
            sequence: this.recordData.sequence ?? null,
            warehouse: warehouseValue,
            clientHostName: this.recordData.clientHostName || ''
          };
        }
      },
      error: () => {
        this.snackBar.open('Failed to load dropdown values', 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['custom-snackbar-position']
        });
      }
    });
}

}