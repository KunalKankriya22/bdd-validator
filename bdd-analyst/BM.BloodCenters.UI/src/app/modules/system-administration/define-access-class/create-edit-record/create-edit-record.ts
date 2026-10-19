import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { HeaderService } from '@shared/services/header.service';
import { DefineAccessClassService, CreateAccessClassRequest, UpdateAccessClassRequest, CodeValueApiResponse } from '../services/define-access-class.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { LoginService } from '@shared/services/login.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import moment from 'moment';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

export interface CreateEditRecordData {
  mode?: 'add' | 'edit';
  id?: string;
  classname?: string;
  codeType?: string;
  codeValue?: string;
  type?: string;
  code?: string[];
  description?: string;
  effectiveDate?: Date | string | null;
  terminationDate?: Date | string | null;
  existingRows?: Array<{
    type: string;
    code: string;
    description: string;
  }>;
  // Row data passed directly for edit mode to avoid API call
  rowData?: {
    class: string;
    classDescription: string;
    type: string;
    code: string;
    description: string;
    effectiveDate: string;
    terminationDate: string;
  };
}

interface SelectedCodeRow {
  code: string;
  description: string;
}

@Component({
  selector: 'app-create-edit-record',
  standalone: true,
  templateUrl: './create-edit-record.html',
  styleUrls: ['./create-edit-record.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ]
})
export class CreateEditRecordComponent implements OnInit {

  @ViewChild('effDateInput') effDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('termDateInput') termDateInput!: ElementRef<HTMLInputElement>;

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  recordForm!: FormGroup;
  mode: 'add' | 'edit' = 'add';
  title!: string;
  headerInfo: string = '';

  typeOptions: { type: string; description: string }[] = [];
  codeOptions: CodeValueApiResponse[] = [];
  filteredCodeOptions: CodeValueApiResponse[] = [];
  codeSearchControl = new FormControl('');
  classname: string = '';
  selectedCodeRows: SelectedCodeRow[] = [];
  selectedCodeSortDirection: 'default' | 'asc' | 'desc' = 'default';
  private selectedCodesRequestId = 0;

  // Min date for effective date picker (today)
  minDate!: moment.Moment;

  // Edit mode display values
  displayType: string = '';
  displayCode: string = '';
  displayDescription: string = '';
  displayEffectiveDate: string = '';
  editCodeValue: string = ''; // Store code value for update API

  private openSnackbar(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'DISMISS', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['custom-snackbar']
    });
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateEditRecordComponent>,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
    private defineAccessClassService: DefineAccessClassService,
    private loginService: LoginService,
    private chapterTimezoneService: ChapterTimezoneService,
    @Inject(MAT_DIALOG_DATA) public data: CreateEditRecordData | null
  ) {
    this.minDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
    this.recordForm = this.fb.group({
      type: ['', Validators.required],
      code: [[]],
      description: [''],
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  ngOnInit(): void {
    this.mode = this.data?.mode || 'add';
    this.title = this.mode === 'add' ? 'Create Record' : 'Edit Record';

    if (this.data) {
      // Get classname from data
      this.classname = this.data.classname || this.data.id || '';

      if (this.mode === 'edit') {
        // In edit mode, use row data directly if provided, otherwise fetch from API
        if (this.data.rowData) {
          this.populateEditForm(this.data.rowData);
        } else if (this.data.codeType && this.data.codeValue) {
          this.loadRecordDetails(this.classname, this.data.codeType, this.data.codeValue);
        }
      } else if (this.mode === 'add') {
        DateFieldValidationUtility.setupAddModeValidators(this.recordForm, this.headerService.chapterTimeZone());
        // In add mode, load types from API
        if (this.classname) {
          this.loadTypes();
        }
      }
    }

    // Track which date field was last changed for cross-field error display
    this.recordForm.get('effectiveDate')?.valueChanges.subscribe(() => {
      this.lastChangedDateField = 'effective';
    });
    this.recordForm.get('terminationDate')?.valueChanges.subscribe(() => {
      this.lastChangedDateField = 'termination';
    });

    // Code search filter
    this.codeSearchControl.valueChanges.subscribe((term) => {
      const search = (term || '').toLowerCase();
      this.filteredCodeOptions = this.codeOptions.filter(
        (c) => c.value.toLowerCase().includes(search) ||
               (c.description && c.description.toLowerCase().includes(search))
      );
    });

    // Listen to type changes to populate code options (only in add mode)
    if (this.mode === 'add') {
      this.recordForm.get('type')?.valueChanges.subscribe((type) => {
        this.onTypeChange(type);
      });

      this.recordForm.get('code')?.valueChanges.subscribe(() => {
        this.refreshSelectedCodeRows();
      });
    }
  }

  private populateEditForm(rowData: NonNullable<CreateEditRecordData['rowData']>): void {
    // Set header info
    this.headerInfo = `${rowData.class} | ${rowData.code}`;

    // Store values for display in edit mode
    this.displayType = rowData.type;
    this.displayCode = rowData.code;
    this.displayDescription = rowData.description;

    const effectiveDateObj = rowData.effectiveDate ? moment(rowData.effectiveDate) : null;
    this.displayEffectiveDate = effectiveDateObj ? effectiveDateObj.format('DD-MMM-YYYY').toUpperCase() : '';
    this.editCodeValue = rowData.code;

    // Patch form with row data (dates are already chapter-local from the service)
    this.recordForm.patchValue({
      type: rowData.type,
      code: [rowData.code],
      description: rowData.description,
      effectiveDate: effectiveDateObj,
      terminationDate: rowData.terminationDate && rowData.terminationDate !== '-'
        ? moment(rowData.terminationDate)
        : null
    });

    // Use shared utility to setup date field validators for Edit mode (disables effectiveDate)
    DateFieldValidationUtility.setupEditModeValidators(this.recordForm);
    const termControl = this.recordForm.get('terminationDate');
    if (termControl) {
      termControl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone()));
      termControl.updateValueAndValidity();
      if (termControl.hasError('terminationDatePast')) {
        termControl.markAsTouched();
      }
    }

    // Disable fields in edit mode (only termination date is editable)
    this.recordForm.get('type')?.disable();
    this.recordForm.get('code')?.disable();
    this.recordForm.get('description')?.disable();
  }

  loadTypes(): void {
    this.defineAccessClassService.getTypesByClassname(this.classname).subscribe({
      next: (types) => {
        this.typeOptions = types;
      },
      error: (error) => {
        console.error('Error loading types:', error);
        this.openSnackbar('Failed to load types');
      }
    });
  }

  loadRecordDetails(classname: string, codeType: string, codeValue: string): void {
    this.defineAccessClassService.getAccessClassDetail(classname, codeType, codeValue).subscribe({
      next: (details) => {
        // Set header info
        this.headerInfo = `${details.class} | ${details.code}`;

        // Store values for display in edit mode
        this.displayType = details.type;
        this.displayCode = details.code;
        this.displayDescription = details.description;
        const effMoment = details.effectiveDate
          ? this.chapterTimezoneService.convertGmtToLocal(moment.utc(details.effectiveDate))
          : null;
        const termMoment = details.terminationDate
          ? this.chapterTimezoneService.convertGmtToLocal(moment.utc(details.terminationDate))
          : null;

        this.displayEffectiveDate = effMoment ? effMoment.format('DD-MMM-YYYY').toUpperCase() : '';
        this.editCodeValue = details.code; // Store for update API

        // Patch form with chapter-local moment objects
        this.recordForm.patchValue({
          type: details.type,
          code: [details.code],
          description: details.description,
          effectiveDate: effMoment,
          terminationDate: termMoment
        });

        // Use shared utility to setup date field validators for Edit mode (disables effectiveDate)
        DateFieldValidationUtility.setupEditModeValidators(this.recordForm);
        const termControl = this.recordForm.get('terminationDate');
        if (termControl) {
          termControl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone()));
          termControl.updateValueAndValidity();
          if (termControl.hasError('terminationDatePast')) {
            termControl.markAsTouched();
          }
        }

        // Disable fields in edit mode (only termination date is editable)
        this.recordForm.get('type')?.disable();
        this.recordForm.get('code')?.disable();
        this.recordForm.get('description')?.disable();
      },
      error: (error) => {
        console.error('Error loading record details:', error);
        this.openSnackbar('Failed to load record details');
      }
    });
  }

  onTypeChange(type: string): void {
    // Clear current code selection
    this.recordForm.patchValue({ code: [] });
    this.codeOptions = [];
    this.filteredCodeOptions = [];
    this.codeSearchControl.setValue('');
    this.selectedCodeRows = [];
    this.selectedCodeSortDirection = 'default';
    this.recordForm.patchValue({ description: '' });

    // Load code values for the selected type
    if (type && this.classname) {
      this.loadCodeValues(type);
    }
  }

  private refreshSelectedCodeRows(): void {
    const selectedCodes = this.recordForm.get('code')?.value as string[] | null;
    const selectedType = this.recordForm.get('type')?.value as string | null;

    if (!selectedCodes?.length || !selectedType) {
      this.selectedCodeRows = [];
      this.recordForm.patchValue({ description: '' }, { emitEvent: false });
      return;
    }

    const requestId = ++this.selectedCodesRequestId;

    const matchingRows = (this.data?.existingRows ?? []).filter(
      row => row.type === selectedType
    );

    // Keep already-fetched rows, remove deselected ones
    const existingMap = new Map(this.selectedCodeRows.map(r => [r.code, r]));
    const alreadyFetched: SelectedCodeRow[] = [];
    const newCodes: string[] = [];

    for (const code of selectedCodes) {
      const existing = existingMap.get(code);
      if (existing) {
        alreadyFetched.push(existing);
      } else {
        newCodes.push(code);
      }
    }

    if (!this.classname || newCodes.length === 0) {
      // No new codes to fetch — just reconcile removals
      this.selectedCodeRows = newCodes.length === 0 && alreadyFetched.length > 0
        ? alreadyFetched
        : selectedCodes.map(code => {
            const cached = existingMap.get(code);
            if (cached) return cached;
            const match = matchingRows.find(row => row.code === code);
            return { code, description: match?.description || '' };
          });
      this.sortSelectedCodeRows();
      this.recordForm.patchValue(
        { description: this.selectedCodeRows[0]?.description || '' },
        { emitEvent: false }
      );
      return;
    }

    // Only fetch descriptions for newly added codes
    const requests = newCodes.map(code => {
      const fallbackDescription = matchingRows.find(row => row.code === code)?.description || '';

      return this.defineAccessClassService
        .getAccessClassDetail(this.classname, selectedType, code)
        .pipe(
          map(details => ({
            code,
            description: details.description || fallbackDescription
          })),
          catchError(() =>
            of({
              code,
              description: fallbackDescription
            })
          )
        );
    });

    forkJoin(requests).subscribe(newRows => {
      if (requestId !== this.selectedCodesRequestId) {
        return;
      }

      // Merge already-fetched rows with newly fetched rows, in selection order
      const allMap = new Map([
        ...alreadyFetched.map(r => [r.code, r] as [string, SelectedCodeRow]),
        ...newRows.map(r => [r.code, r] as [string, SelectedCodeRow])
      ]);
      this.selectedCodeRows = selectedCodes
        .map(code => allMap.get(code)!)
        .filter(Boolean);

      this.sortSelectedCodeRows();
      this.recordForm.patchValue(
        { description: this.selectedCodeRows[0]?.description || '' },
        { emitEvent: false }
      );
    });
  }

  removeSelectedCode(code: string): void {
    const selectedCodes = (this.recordForm.get('code')?.value as string[] | null) ?? [];
    const nextCodes = selectedCodes.filter(item => item !== code);
    this.recordForm.patchValue({ code: nextCodes });
  }

  toggleSelectedCodeSort(): void {
    if (this.selectedCodeSortDirection === 'default') {
      this.selectedCodeSortDirection = 'asc';
    } else if (this.selectedCodeSortDirection === 'asc') {
      this.selectedCodeSortDirection = 'desc';
    } else {
      this.selectedCodeSortDirection = 'default';
    }
    this.sortSelectedCodeRows();
  }

  onSelectedCodeSortKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleSelectedCodeSort();
    }
  }

  private sortSelectedCodeRows(): void {
    if (this.selectedCodeSortDirection === 'default') {
      return;
    }
    this.selectedCodeRows = [...this.selectedCodeRows].sort((a, b) => {
      const result = a.code.localeCompare(b.code);
      return this.selectedCodeSortDirection === 'asc' ? result : -result;
    });
  }

  loadCodeValues(type: string): void {
    this.defineAccessClassService.getCodeValuesByType(this.classname, type).subscribe({
      next: (codes) => {
        this.codeOptions = codes;
        this.filteredCodeOptions = codes;
        this.codeSearchControl.setValue('');
      },
      error: (error) => {
        console.error('Error loading code values:', error);
        this.openSnackbar('Failed to load code values');
      }
    });
  }

  onSave(): void {
    this.recordForm.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.recordForm, 'terminationDate');

    if (this.recordForm.invalid) {
      this.openSnackbar('Please correct the highlighted errors before saving.', 5000);
      return;
    }

    if (this.recordForm.hasError('dateRangeInvalid')) {
      this.recordForm.get('terminationDate')?.markAsTouched();
      return;
    }

    if (this.mode === 'add') {
      this.createRecord();
    } else {
      this.updateRecord();
    }
  }

  createRecord(): void {
    const formValue = this.recordForm.getRawValue();
    const username = this.loginService.getStoredUsername() || 'USERID';

    if (!formValue.effectiveDate) {
      this.openSnackbar('Effective Date is required.', 5000);
      return;
    }

    const request: CreateAccessClassRequest = {
      accessCodeValues: formValue.code || [],
      accessClass: this.classname,
      accessCodeType: formValue.type,
      effectiveDate: DateFieldValidationUtility.serializeDateForApi(formValue.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate),
      insertUser: username
    };

    this.defineAccessClassService.createAccessClass(request).subscribe({
      next: (response) => {
        this.openSnackbar(response.message || 'Access Class Codes created successfully');
        this.dialogRef.close({ success: true, data: response });
      },
      error: (error) => {
        console.error('Error creating record:', error);
      }
    });
  }

  updateRecord(): void {
    const formValue = this.recordForm.getRawValue();

    const request: UpdateAccessClassRequest = {
      accessClass: this.classname,
      accessCodeType: this.displayType || formValue.type || '',
      accessCodeValue: this.editCodeValue,
      terminationDate: DateFieldValidationUtility.serializeDateForApi(formValue.terminationDate) || ''
    };

    this.defineAccessClassService.updateAccessClass(request).subscribe({
      next: (response) => {
        this.openSnackbar(response.message || 'Termination date updated successfully');
        this.dialogRef.close({ success: true, data: response });
      },
      error: (error) => {
        console.error('Error updating record:', error);
      }
    });
  }

  get isFormValid(): boolean {
    const valid = this.recordForm.valid && !this.recordForm.hasError('dateRangeInvalid');
    if (this.mode === 'edit') {
      return valid && this.recordForm.dirty;
    }
    return valid;
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.recordForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.recordForm.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.recordForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.recordForm.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.recordForm.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.recordForm.get('terminationDate'), this.mode === 'edit'
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
