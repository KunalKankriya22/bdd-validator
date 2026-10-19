import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import moment, { Moment } from 'moment';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';

// Shared Components
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { UnitIdFormatUtility } from '@shared/components/unit-id-field/unit-id-format.utility';

// Services & Models
import { UnitCollectionDateService } from './services/unit-collection-date.service';
import { ValidateUnitResponse } from './models/unit-collection-date.model';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ConfirmDateDialogComponent, ConfirmDialogData } from './confirm-date-dialog.component';

// Date Format
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-change-unit-collection-date',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSnackBarModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './change-unit-collection-date.component.html',
  styleUrl: './change-unit-collection-date.component.scss'
})
export class ChangeUnitCollectionDateComponent implements OnInit, OnDestroy {
  // ViewChild for shared component
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly unitService = inject(UnitCollectionDateService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dateAdapter = inject(DateAdapter<Moment>);

  // Header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Change Unit Collection Date', link: null }
    ],
    title: 'Change Unit Collection Date',
    subtitle: 'This screen allows to change collection date and it effects separation times, components suitability, etc. Use caution.',
    actions: []
  };

  // Unit ID label
  unitIdLabel = 'Unit ID';

  // Signals for state
  readonly loading = signal<boolean>(false);
  readonly searching = signal<boolean>(false);
  readonly unitFound = signal<boolean>(false);
  readonly unitData = signal<ValidateUnitResponse | null>(null);
  readonly submitted = signal<boolean>(false);

  // Computed
  readonly canUpdate = computed(() =>
    this.unitFound() && !this.loading()
  );

  // Form
  searchForm!: FormGroup;
  updateForm!: FormGroup;

  // Date constraints - use chapter's local date (not browser's local date)
  get today() {
    return this.chapterTimezoneService.getChapterLocalDate();
  }

  // Date validation (following Define HLA Antigens pattern)
  collectionDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getCollectionDateError());

  // Date filter - disable dates after insert date
  newCollectionDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const unit = this.unitData();

    if (!unit?.insertDate) return true; // No unit data yet, allow all dates

    const insertDate = moment(unit.insertDate).startOf('day');

    // Disable dates that are after the insert date
    if (checkDate.isAfter(insertDate)) {
      return false;
    }

    return true;
  };

  // Cleanup
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    // Update form
    // FMB VALIDATION: New collection date (NEW_COLL_DATE field)
    // - FormatMask: "FXDD-MON-YYYY"
    // - Cannot be after unit insert date (VR-004, Error 0092)
    this.updateForm = this.fb.group({
      newCollectionDate: [null, [
        Validators.required,
        dateFormatValidator(),
        this.dateNotAfterInsertValidator.bind(this)
      ]]
    });

    // Trigger validation when date changes (dynamic validation)
    this.updateForm.get('newCollectionDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateForm.get('newCollectionDate')?.updateValueAndValidity({ emitEvent: false });
      });
  }

  /**
   * Custom validator: Date cannot be after unit insert date
   * FMB VR-004 (Error 0092): New coll date cannot be after the unit was physically checked in
   */
  private dateNotAfterInsertValidator(control: any) {
    if (!control.value) return null;

    const unit = this.unitData();
    if (!unit?.insertDate) return null; // No unit data yet, skip validation

    const selectedDate = moment(control.value);
    const insertDate = moment(unit.insertDate);

    if (selectedDate.isAfter(insertDate, 'day')) {
      return {
        afterInsertDate: {
          message: `Collection date cannot be after unit insert date (${insertDate.format('DD-MMM-YYYY')})`
        }
      };
    }
    return null;
  }

  get updateF() {
    return this.updateForm.controls;
  }

  /**
   * Handle unit validation from shared component
   * Automatically triggers search when unit is validated
   */
  onUnitValidated(_data: UnitValidationResponse): void {
    // Unit validated - trigger search automatically
    this.onSearch();
  }

  /**
   * Handle unit cleared event from shared component
   */
  onUnitCleared(): void {
    this.unitFound.set(false);
    this.unitData.set(null);
    this.updateForm.reset();
  }

  /**
   * Search for unit by DIN number
   * Called when user enters Unit ID in shared component
   */
  onSearch(): void {
    if (!this.unitIdField?.isValid) {
      return;
    }

    const unitId = this.unitIdField.parsedUnitId;
    if (!unitId) {
      return;
    }

    this.searching.set(true);
    this.unitFound.set(false);
    this.unitData.set(null);
    this.updateForm.reset();

    // FMB: NEW_COLL_DATE has Required="false"
    // For initial search, only send unitId - backend will return unit details
    // User will select new date in UI, then we'll validate with that date
    const request = {
      unitId,
      confirmed: false
      // newCollectionDate not sent - user hasn't selected a date yet
    };

    this.unitService.validateUnit(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isValid) {
            this.unitData.set(response);
            this.unitFound.set(true);
          } else {
            // Response validation failed - use message from response
            this.showError({ error: { message: response.message } }, 'Unit validation failed');
          }
          this.searching.set(false);
        },
        error: (err) => {
          this.searching.set(false);
          this.showError(err, 'Unit not found. Please verify the Unit ID.');
        }
      });
  }

  /**
   * Format Unit ID with spaces for display (e.g., "W6333 12 070523 -X")
   * Matches the format shown in the Unit ID field
   */
  formatUnitIdForDisplay(unitId: string | undefined): string {
    if (!unitId) return '';

    // Remove any existing spaces/formatting
    const cleanId = unitId.replace(/\s+/g, '');

    // ISBT format: W#### ## ###### -X (5 digits, space, 2 digits, space, 6 digits, space, -X)
    // Example: W6333 12 070523 -X
    if (cleanId.length >= 14 && cleanId.startsWith('W')) {
      const part1 = cleanId.substring(0, 5);    // W6333
      const part2 = cleanId.substring(5, 7);    // 12
      const part3 = cleanId.substring(7, 13);   // 070523
      const part4 = cleanId.substring(13);      // -X or X

      // Add space before hyphen if not present
      const checkDigit = part4.startsWith('-') ? part4 : `-${part4}`;

      return `${part1} ${part2} ${part3} ${checkDigit}`;
    }

    // Return original if it doesn't match expected format
    return unitId;
  }

  /**
   * Format date with uppercase month abbreviation (e.g., "15-APR-2009")
   */
  formatDateUppercase(dateString: string | undefined): string {
    if (!dateString) return '';
    return moment(dateString).format('DD-MMM-YYYY').toUpperCase();
  }

  /**
   * Get day of week for a given date string
   */
  getDayOfWeek(dateString: string | undefined): string {
    if (!dateString) return '';
    return moment(dateString).format('dddd'); // Full day name (e.g., "Monday")
  }

  /**
   * Get day of week for the new collection date from form
   */
  getNewDayOfWeek(): string {
    const newDate = this.updateF['newCollectionDate'].value;
    if (!newDate) return '';
    return moment(newDate).format('dddd');
  }

  /**
   * Get formatted Unit ID for display in title
   * Returns properly formatted Unit ID with spaces (e.g., "W6333 12 070523 -X")
   */
  getFormattedUnitId(): string {
    // Get the data from the unit ID field component
    const parsedData = this.unitIdField?.parsedUnitData;

    if (parsedData?.manualUnitId) {
      // Apply the same formatting the shared component uses for display
      if (parsedData.barcodeType === 'CODE128') {
        return UnitIdFormatUtility.formatCode128(parsedData.manualUnitId);
      }
      return parsedData.manualUnitId;
    }

    // Fallback: use unitData if available
    return this.unitData()?.unitId || '';
  }

  /**
   * Get comprehensive error message for collection date field
   * Following Define HLA Antigens pattern
   */
  getCollectionDateError(): string {
    const control = this.updateForm.get('newCollectionDate');
    if (!control) return '';

    // Invalid date format (user typed invalid text) - matches Define HLA Antigens pattern
    if (control.hasError('invalidDate') || control.hasError('invalidDateFormat') || control.hasError('matDatepickerParse')) {
      return 'New Collection Date is invalid';
    }

    // After insert date validation
    if (control.hasError('afterInsertDate')) {
      return control.errors?.['afterInsertDate'].message || 'Collection date cannot be after unit insert date';
    }

    // Required error
    if (control.hasError('required')) {
      return 'New Collection Date is required';
    }

    return '';
  }

  /**
   * Handle Enter or Tab key press on date field
   * Works for both: typing date + Enter/Tab, and selecting from datepicker + Enter/Tab
   */
  onEnterOrTabKey(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.onUpdate();
  }

  /**
   * Handle datepicker closed event (when user selects date from calendar)
   * Always refocus the input so the user can press Tab to trigger the dialog
   */
  onDatePickerClosed(): void {
    // Always refocus the input field after datepicker closes
    // This allows the user to press Tab to trigger the dialog
    // Works for both first selection and subsequent changes
    setTimeout(() => {
      if (this.dateInput?.nativeElement) {
        this.dateInput.nativeElement.focus();
        // Keep cursor at the end of the input
        const length = this.dateInput.nativeElement.value.length;
        this.dateInput.nativeElement.setSelectionRange(length, length);
      }
    }, 150);
  }

  /**
   * Update unit collection date
   * Shows confirmation dialog before proceeding (per Figma)
   */
  onUpdate(event?: Event): void {
    // Prevent default form submission
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.submitted.set(true);

    if (this.updateForm.invalid) {
      const firstInvalid = document.querySelector('.date-change-grid .ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const unit = this.unitData();
    if (!unit) return;

    const newDate = this.updateF['newCollectionDate'].value;
    const formattedDate = moment(newDate).format('YYYY-MM-DD');

    // Show confirmation dialog (per Figma design)
    this.showConfirmationDialog(formattedDate, unit);
  }

  /**
   * Show confirmation dialog before updating collection date
   * Matches Figma dialog: "Confirm Date"
   */
  private showConfirmationDialog(newDate: string, unit: any): void {
    const dialogRef = this.dialog.open<ConfirmDateDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDateDialogComponent,
      {
        width: '490px',
        maxWidth: '90vw',
        hasBackdrop: true,
        disableClose: true,
        panelClass: 'confirm-date-dialog',
        data: {
          message: 'Please confirm that the selected date is correct before proceeding. This action will proceed with the chosen date.'
        }
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // User confirmed - proceed with update
        this.performUpdate(newDate, unit);
      }
      // If user cancels (result === false), do nothing - keep form as-is
    });
  }

  /**
   * Perform the actual collection date update
   */
  private performUpdate(newDate: string, unit: any): void {
    this.loading.set(true);

    const request = {
      unitId: unit.unitId,
      newCollectionDate: newDate,
      currentCollectionDate: moment(unit.currentCollectionDate).format('YYYY-MM-DD'),
      confirmed: true
    };

    this.unitService.changeCollectionDate(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Check for API-level failure even with 200 status
          if (response?.success === false) {
            const errorCode = response?.errorCode || response?.errorResponse?.errorCode;
            const errorMessage = response?.error || response?.errorResponse?.error || response?.message || 'Failed to update collection date';
            const displayMessage = errorCode ? `Error ${errorCode}: ${errorMessage}` : errorMessage;
            this.snackBar.open(displayMessage, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            this.loading.set(false);
            return;
          }

          // Success - show success message and reset form
          this.showSuccess('Unit collection date changed successfully.');
          this.loading.set(false);
          this.resetForm();
        },
        error: (err) => {
          this.loading.set(false);
          this.showError(err, 'Failed to update collection date');
        }
      });
  }

  /**
   * Reset form to initial state
   */
  onReset(): void {
    this.resetForm();
  }

  /**
   * Navigate back
   */
  onCancel(): void {
    this.router.navigate(['/laboratory-functions']);
  }

  /**
   * Reset all forms and state
   */
  private resetForm(): void {
    this.unitIdField?.clear();
    this.updateForm.reset();
    this.submitted.set(false);
    this.unitFound.set(false);
    this.unitData.set(null);
    this.searching.set(false);
  }

  /**
   * Handle keyboard input for collection date field
   * Exact pattern from Add New Antigen dialog
   */
  onCollectionDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.updateForm.get('newCollectionDate')
    );
  }

  /**
   * Show success message in top right corner
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 8000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message in top right corner
   * Extracts error code and description from error response
   * Stays on screen until user dismisses (no duration)
   */
  private showError(error: any, defaultMessage: string = 'An error occurred'): void {
    const errorMessage = this.extractErrorMessage(error, defaultMessage);
    this.snackBar.open(errorMessage, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Extract error message from error response
   * Checks multiple error formats returned by backend API
   */
  private extractErrorMessage(error: any, defaultMessage: string): string {
    // Pattern 1: error.error.error.errorCode and errorDescription
    if (error?.error?.error?.errorCode && error?.error?.error?.errorDescription) {
      return `Error: ${error.error.error.errorCode} : ${error.error.error.errorDescription}`;
    }

    // Pattern 2: error.error.errorResponse.errorCode and error
    if (error?.error?.errorResponse?.errorCode && error?.error?.errorResponse?.error) {
      return `Error: ${error.error.errorResponse.errorCode} : ${error.error.errorResponse.error}`;
    }

    // Pattern 3: error.error.errorCode and error.error.message
    if (error?.error?.errorCode && error?.error?.message) {
      return `Error: ${error.error.errorCode} : ${error.error.message}`;
    }

    // Pattern 4: Just error.error.message
    if (error?.error?.message) {
      return error.error.message;
    }

    // Pattern 5: Just error.message
    if (error?.message) {
      return error.message;
    }

    // Fallback
    return defaultMessage;
  }
}
