import { CommonModule } from '@angular/common';
import { Component, computed, Inject, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { noWhitespaceOnlyValidator, codeFieldValidator, urlValidator } from '@shared/validators/input.validators';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { TranslateModule } from '@ngx-translate/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { AddEditAddFunctionsService } from '../add-functions/services/add-edit-add-function.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddFunction } from '../add-functions/services/add-functions.service';

@Component({
  selector: 'app-add-edit-add-functions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
    MatDialogModule,
    TranslateModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-edit-add-functions.html',
  styleUrl: './add-edit-add-functions.scss',
})
export class AddEditAddFunctions implements OnInit {
  mode!: 'add' | 'edit';
  recordData: AddFunction | null = null;

  public iconsList: string[] = [];
  public filteredIconsList: string[] = [];

  selectedIcon: string | null = null;

  // Search control for icon dropdown
  iconSearchControl = new FormControl('');

  isSubmitting = signal(false);
  form!: FormGroup;

  // Edit mode display values
  editModeValues = {
    fcnId: '',
    execName: ''
  };

  // Non-editable fields preserved from existing record (defaults for add mode)
  private preservedFields = {
    applId: 'WEB',
    fcnClass: 'WEBAPP',
    programAuthor: '',
    hostCmd: '',
    applicationType: ''
  };

  // Title and button label
  title = computed(() => (this.mode === 'add' ? 'Add Function' : 'Edit Function'));
  saveButtonText = computed(() => (this.mode === 'add' ? 'ADD' : 'SAVE'));

  constructor(
    public dialogRef: MatDialogRef<AddEditAddFunctions>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private service: AddEditAddFunctionsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.mode = this.data?.mode || 'add';
    this.recordData = this.data?.data || null;

    // Populate edit mode display values
    if (this.mode === 'edit' && this.recordData) {
      this.editModeValues = {
        fcnId: this.recordData.fcnId || '',
        execName: this.recordData.execName || ''
      };
    }

    this.initializeForm();
    this.getIconsList();
    this.setupIconSearch();

    this.form.get('webIcon')?.valueChanges.subscribe(v => {
      console.log('Selected icon:', v);
    });

    if (this.mode === 'edit' && this.recordData) {
      this.patchFormForEdit(this.recordData);
      this.fetchExistingDetail(this.recordData.fcnId);
    }
  }

  private fetchExistingDetail(fcnId: string): void {
    this.service.getDetail(fcnId).subscribe({
      next: (detail) => {
        this.preservedFields = {
          applId: detail.applId?.trim() || 'WEB',
          fcnClass: detail.fcnClass?.trim() || 'WEBAPP',
          programAuthor: detail.programAuthor?.trim() || '',
          hostCmd: detail.hostCmd?.trim() || '',
          applicationType: detail.applicationType?.trim() || ''
        };
      },
      error: () => {}
    });
  }

  getIconsList(): void {
    this.service.getIconsList().subscribe({
      next: (response) => {
        this.iconsList = response;
        this.filteredIconsList = response;
        const defaultIcon = response.find((icon: string) => icon.toLowerCase() === 'language');
        if (this.mode === 'edit' && this.recordData?.fcnIcon?.trim()) {
          this.form.get('webIcon')?.setValue(this.recordData.fcnIcon.trim());
          this.selectedIcon = this.recordData.fcnIcon.trim();
        } else if (defaultIcon) {
          this.form.get('webIcon')?.setValue(defaultIcon);
          this.selectedIcon = defaultIcon;
        }
      },
      error: () => {}
    });
  }

  private setupIconSearch(): void {
    this.iconSearchControl.valueChanges.subscribe(searchTerm => {
      const term = (searchTerm as string || '').toLowerCase();
      this.filteredIconsList = this.iconsList.filter(icon =>
        icon.toLowerCase().includes(term)
      );
    });
  }

  private initializeForm(): void {
    const executableNameValue = this.recordData?.execName || '';

    this.form = this.fb.group({
      executableName: [
        { value: executableNameValue, disabled: this.mode === 'edit' },
        [Validators.required, Validators.maxLength(50), noWhitespaceOnlyValidator(), Validators.pattern(/^[a-zA-Z0-9]+$/)]
      ],
      functionType: ['', [Validators.required, Validators.maxLength(5), noWhitespaceOnlyValidator(), codeFieldValidator()]],
      scope: ['', [Validators.maxLength(50), noWhitespaceOnlyValidator()]],
      webUrl: ['', [Validators.maxLength(200), noWhitespaceOnlyValidator(), urlValidator()]],
      parameter1: ['', [Validators.maxLength(20), noWhitespaceOnlyValidator()]],
      parameter2: ['', [Validators.maxLength(20), noWhitespaceOnlyValidator()]],
      parameter3: ['', [Validators.maxLength(20), noWhitespaceOnlyValidator()]],
      remarks: ['', [Validators.maxLength(120), noWhitespaceOnlyValidator()]],
      webIcon: ['', [Validators.maxLength(30)]],
    });
  }

  /**
   * Optional helper for edit mode
   */
  private patchFormForEdit(data: any): void {
    this.form.patchValue({
      executableName: data.execName?.trim() || '',
      functionType: data.fcnType?.trim() || null,
      scope: data.fcnScope?.trim() || '',
      webUrl: data.fcnUrl?.trim() || '',
      parameter1: data.p1Name?.trim() || '',
      parameter2: data.p2Name?.trim() || '',
      parameter3: data.p3Name?.trim() || '',
      remarks: data.remarks?.trim() || '',
      webIcon: data.fcnIcon?.trim() || null
    });

    // Set selectedIcon for icon preview in edit mode
    this.selectedIcon = data.fcnIcon ?? null;
  }

  onIconChange(event: any) {
    this.selectedIcon = event.value; // sets the preview
  }

  onSubmit(): void {

    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValues = this.form.getRawValue();

    const payload = {
      applId: this.preservedFields.applId,
      fcnClass: this.preservedFields.fcnClass,
      fcnType: formValues.functionType,
      execName: formValues.executableName,
      fcnScope: formValues.scope,
      fcnUrl: formValues.webUrl,
      fcnIcon: formValues.webIcon,
      p1Name: formValues.parameter1,
      p2Name: formValues.parameter2,
      p3Name: formValues.parameter3,
      remarks: formValues.remarks,
      programAuthor: this.preservedFields.programAuthor,
      hostCmd: this.preservedFields.hostCmd,
      applicationType: this.preservedFields.applicationType
    }

    if (this.mode === "add") {
      this.service.add(payload).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.snackBar.open(
            `${formValues.executableName} has been added successfully`,
            'Close',
            {
              duration: 3000,
              panelClass: ['success-snackbar'],
              horizontalPosition: 'end',
              verticalPosition: 'top'
            }
          );
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          const errorMsg = error?.error?.error || error?.error?.message || 'Failed to add function';
        }
      });
    }
    else {
      const fcnId = this.recordData?.fcnId;
      this.service.edit(fcnId, payload).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.snackBar.open(
            `${formValues.executableName} has been updated successfully`,
            'Close',
            {
              duration: 3000,
              panelClass: ['success-snackbar'],
              horizontalPosition: 'end',
              verticalPosition: 'top'
            }
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const errorMsg = err?.error?.error || err?.error?.message || 'Failed to update add function';
        }
      });
    }
  }

  /** Sanitize input on typing: no leading spaces, single space between words */
  sanitizeInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    let sanitized = value.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');

    // Convert executableName to uppercase per FMB CaseRestriction="Upper"
    if (controlName === 'executableName') {
      sanitized = sanitized.toUpperCase();
    }

    if (sanitized !== value) {
      control.setValue(sanitized, { emitEvent: false });
    }
  }

  /** Trim trailing spaces on blur */
  trimInput(controlName: string): void {
    const control = this.form.get(controlName);
    if (!control) return;
    const value = control.value;
    if (typeof value !== 'string') return;

    const trimmed = value.trimEnd();
    if (trimmed !== value) {
      control.setValue(trimmed, { emitEvent: false });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
