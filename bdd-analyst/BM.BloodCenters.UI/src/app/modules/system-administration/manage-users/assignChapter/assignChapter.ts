import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { ChapterLookup } from '../models/service.model';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import * as moment from 'moment';

export interface AssignChapterDialogData {
  assignedWarehouse: string;
  editMode?: boolean;
  chapter?: any;
  chapters?: ChapterLookup[];
  existingChapters?: AssignedChapter[];
}

export interface AssignedChapter {
  chapterId: string;
  chapterName: string;
  effectiveDate: string;
  terminationDate?: string;
  isDefault?: boolean;
}

@Component({
  selector: 'app-assign-chapter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatTableModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    {
      provide: DateAdapter,
      useClass: ChapterAwareDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } }
  ],
  templateUrl: './assignChapter.html',
  styleUrls: ['./assignChapter.scss']
})
export class AssignChapterDialogComponent implements OnInit, OnDestroy {
  private readonly headerService = inject(HeaderService);
  private get chapterOffset(): string { return this.headerService.chapterTimeZone(); }

  private getChapterMinDate(): moment.Moment {
    const chapterDate = DateFieldValidationUtility.getMinDate(this.chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }

  form!: FormGroup;
  dataSource = new MatTableDataSource<AssignedChapter>([]);
  displayedColumns: string[] = [
    'chapterId',
    'chapterName',
    'effectiveDate',
    'terminationDate',
    'actions'
  ];

  isEditMode = false;
  editIndex: number | null = null;
  chapters: ChapterLookup[] = [];

  sortDirection: 'asc' | 'desc' = 'desc';

  // Search control and filtered options
  chapterIdSearchControl = new FormControl('');
  filteredChapters: ChapterLookup[] = [];

  // For change detection in edit mode
  private originalFormValue: any = null;

  // Track if user has made changes in add mode
  private hasUserMadeChanges = false;

  minDate: any; // Initialized in constructor with chapter's local date

  // For termination date picker: max(chapterToday, effectiveDate)
  get minTerminationDate(): any {
    const effectiveDate = this.form?.get('effectiveDate')?.value;
    if (!effectiveDate) return this.minDate;
    const chapterToday = this.getChapterMinDate();

    // Use DateFieldUtility to serialize dates for comparison
    const effStr = DateFieldValidationUtility.serializeDateForApi(effectiveDate) || '';
    const todayStr = DateFieldValidationUtility.serializeDateForApi(chapterToday) || '';

    return effStr > todayStr ? effectiveDate : chapterToday;
  }

  private destroy$ = new Subject<void>();
  private isInitializing = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AssignChapterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignChapterDialogData,
    private dateAdapter: DateAdapter<any>
  ) {
    this.minDate = this.getChapterMinDate();
    this.createForm();
    this.chapters = data.chapters || [];
    this.filteredChapters = [...this.chapters];
  }

  ngOnInit(): void {
    // Set date locale for proper formatting
    this.dateAdapter.setLocale('en-US');

    // ChapterAwareDateAdapter automatically uses chapter timezone via HeaderService

    this.setupChapterSearch();
    this.handleTerminationDateValidation();

    // Load existing chapters if provided
    if (this.data.existingChapters && this.data.existingChapters.length > 0) {
      this.dataSource.data = [...this.data.existingChapters];
    }

    if (this.data.editMode && this.data.chapter) {
      this.isInitializing = true;
      this.handleEditMode();
      this.isInitializing = false;
    }

    // Subscribe to chapter changes
    this.subscribeToChapterChanges();
  }

  private setupChapterSearch(): void {
    this.chapterIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredChapters = this.chapters.filter(chapter =>
          chapter.chapterId.toLowerCase().includes(term) ||
          chapter.chapterName.toLowerCase().includes(term)
        );
      });
  }

  private createForm(): void {
    this.form = this.fb.group({
      chapterId: ['', [Validators.required, this.duplicateChapterValidator.bind(this)]],
      chapterName: [{ value: '', disabled: true }],
      effectiveDate: ['', [Validators.required, DateFieldValidationUtility.effectiveDateNotPastValidator(this.chapterOffset)]],
      terminationDate: ['', [DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset)]]
    }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });

    // Watch for chapterId changes to update chapterName
    this.form.get('chapterId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(chapterId => {
        if (chapterId) {
          const chapterName = this.getChapterName(chapterId);
          this.form.get('chapterName')?.setValue(chapterName);
        } else {
          this.form.get('chapterName')?.setValue('');
        }
      });
  }

  private duplicateChapterValidator(control: any): { [key: string]: boolean } | null {
    if (!control.value) {
      return null;
    }

    const chapterId = control.value;
    const isDuplicate = this.dataSource.data.some((a, i) => {
      if (this.isEditMode && i === this.editIndex) {
        return false;
      }
      return a.chapterId === chapterId;
    });

    return isDuplicate ? { duplicateChapter: true } : null;
  }

  private handleTerminationDateValidation(): void {
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.get('terminationDate')?.updateValueAndValidity();
      });
  }

  getChapterName(chapterId: string): string {
    const chapter = this.chapters.find(c => c.chapterId === chapterId);
    return chapter ? chapter.chapterName : chapterId;
  }

  onAdd(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const chapterId = raw.chapterId;

    const assignment: AssignedChapter = {
      chapterId: chapterId,
      chapterName: this.getChapterName(chapterId),
      effectiveDate: this.serializeDateForApi(raw.effectiveDate),
      terminationDate: raw.terminationDate ? this.serializeDateForApi(raw.terminationDate) : undefined
    };

    const data = [...this.dataSource.data];

    if (this.isEditMode && this.editIndex !== null) {
      data[this.editIndex] = assignment;
      this.snackBar.open('Chapter updated successfully', 'DISMISS', {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'right'
      });
    } else {
      data.push(assignment);
      this.hasUserMadeChanges = true; // Mark that user has made changes
      this.snackBar.open('Chapter added successfully', 'DISMISS', {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'right'
      });
    }

    this.dataSource.data = data;
    this.applySorting();
    this.resetForm();

    // Re-validate chapterId after data source changes
    this.form.get('chapterId')?.updateValueAndValidity();
  }

  private resetForm(): void {
    this.form.reset();
    this.isEditMode = false;
    this.editIndex = null;
    // Clear validation errors
    this.form.get('chapterId')?.setErrors(null);
  }

  removeAssignment(index: number): void {
    const data = [...this.dataSource.data];
    data.splice(index, 1);
    this.dataSource.data = data;
    this.hasUserMadeChanges = true; // Mark that user has made changes

    this.snackBar.open('Chapter removed', 'DISMISS', {
      duration: 5000,
      verticalPosition: 'top',
      horizontalPosition: 'right'
    });

    // Re-validate chapterId after data source changes
    this.form.get('chapterId')?.updateValueAndValidity();
  }

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applySorting();
  }

  private applySorting(): void {
    const dir = this.sortDirection;
    const sorted = [...this.dataSource.data].sort((a, b) => {
      const comparison = a.chapterId.toLowerCase().localeCompare(b.chapterId.toLowerCase());
      return dir === 'asc' ? comparison : -comparison;
    });
    this.dataSource.data = sorted;
  }

  onSaveAndAssign(): void {
    if (!this.dataSource.data.length) {
      this.snackBar.open('Please add at least one chapter', 'DISMISS', {
        verticalPosition: 'top',
        horizontalPosition: 'right'
      });
      return;
    }

    this.dialogRef.close(this.dataSource.data);
  }

  private handleEditMode(): void {
    if (!this.data.editMode || !this.data.chapter) {
      return;
    }

    const chapter = this.data.chapter;
    this.isEditMode = true;
    this.editIndex = 0;

    this.dataSource.data = [chapter];

    // Parse dates using moment for proper handling
    const parseDateForForm = (dateStr: string): moment.Moment | null => {
      if (!dateStr) return null;
      return moment.utc(dateStr);
    };

    this.form.patchValue({
      chapterId: chapter.chapterId,
      effectiveDate: parseDateForForm(chapter.effectiveDate),
      terminationDate: chapter.terminationDate ? parseDateForForm(chapter.terminationDate) : null
    });

    // Disable chapter ID and effective date in edit mode (readonly after assigned)
    this.form.get('chapterId')?.disable();
    this.form.get('effectiveDate')?.disable();

    // Store original values for change detection
    this.originalFormValue = {
      terminationDate: chapter.terminationDate ? parseDateForForm(chapter.terminationDate) : null
    };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Serialize date for API using DateFieldUtility
   */
  private serializeDateForApi(value: any): string {
    if (!value) return '';
    const serialized = DateFieldValidationUtility.serializeDateForApi(value);
    // Return as ISO string with time component for compatibility
    const momentDate = moment.utc(serialized);
    return momentDate.isValid() ? momentDate.toISOString() : '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter changes to close dialog
   * Following the pattern from donor-access-class.ts
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Close dialog when chapter changes
        this.dialogRef.close();
      });
  }

  /**
   * Format date for display using DateFieldUtility
   */
  formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    return DateFieldValidationUtility.formatDateForUI(moment.utc(dateStr)).toUpperCase();
  }

  /**
   * Handle effective date input using DateFieldUtility
   */
  onEffectiveDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    DateFieldValidationUtility.handleStartDateInput(
      input.value,
      this.form.get('effectiveDate')
    );
  }

  /**
   * Handle effective date blur
   */
  onEffectiveDateBlur(): void {
    const control = this.form.get('effectiveDate');
    if (control) {
      control.markAsTouched();
    }
  }

  /**
   * Handle termination date input using DateFieldUtility
   */
  onTerminationDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    DateFieldValidationUtility.handleEndDateInput(
      input.value,
      this.form.get('terminationDate'),
      this.isEditMode
    );
  }

  /**
   * Handle termination date blur
   */
  onTerminationDateBlur(): void {
    const control = this.form.get('terminationDate');
    if (control) {
      control.markAsTouched();
    }
  }

  /**
   * Check if form has changed in edit mode
   */
  get hasFormChanged(): boolean {
    if (!this.isEditMode || !this.originalFormValue) {
      return true;
    }

    const currentTermDate = this.form.get('terminationDate')?.value;
    const originalTermDate = this.originalFormValue.terminationDate;

    // Compare dates using serialization
    const currentDateStr = currentTermDate ? DateFieldValidationUtility.serializeDateForApi(currentTermDate) : null;
    const originalDateStr = originalTermDate ? DateFieldValidationUtility.serializeDateForApi(originalTermDate) : null;

    return currentDateStr !== originalDateStr;
  }

  /**
   * Check if save and assign button should be enabled in add mode
   */
  get canSaveAndAssign(): boolean {
    return this.dataSource.data.length > 0 && this.hasUserMadeChanges;
  }

  /**
   * Get error message for Effective Date using DateFieldUtility
   */
  getEffectiveDateError(): string {
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'),
      'Effective Date',
      'Termination Date',
      this.form.errors
    );
  }

  /**
   * Get error message for Termination Date using DateFieldUtility
   */
  getTerminationDateError(): string {
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'),
      'Termination Date',
      'Effective Date',
      this.form.errors
    );
  }
}