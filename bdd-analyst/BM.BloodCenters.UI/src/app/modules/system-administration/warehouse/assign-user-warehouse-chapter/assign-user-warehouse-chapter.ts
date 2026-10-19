import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  Inject,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE
} from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { UppercaseMomentDateAdapter } from '../../../../shared/date/uppercase-date-adapter';
import { Subject, takeUntil } from 'rxjs';

import { AssignUserWarehouseChapterService } from '../service/assign-user-warehouse-chapter.service';
import {
  AssignedWarehouse,
  Warehouse,
  Chapter,
  Printer,
  ValidWarehouseUserDto,
  UpdateValidWarehouseUserDto
} from '../interfaces/assign-user-warehouse-chapter.interface';
import { DD_MON_YYYY_FORMATS } from '../../../../shared/date/date-formats';
import { VALIDATION } from '../../../../core/constants/validation.constants';
import { DateFieldValidationUtility } from '../../../../shared/components/DateFieldUtility';
import { dateFormatValidator } from '../../../../core/utils/date-adapter.util';
import moment from 'moment';

@Component({
  selector: 'app-assign-user-warehouse-chapter',
  standalone: true,
  templateUrl: './assign-user-warehouse-chapter.html',
  styleUrls: ['./assign-user-warehouse-chapter.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    NgxMatSelectSearchModule
  ]
})
export class AssignUserWarehouseChapterComponent
  implements OnInit, AfterViewInit, OnDestroy {

  VALIDATION = VALIDATION;

  assignedUserId!: string;
  assignedUserName!: string;
  assignedUserDepartment = '';
  assignedUserDisplay = '';

  form!: FormGroup;


  warehouses: Warehouse[] = [];
  filteredWarehouses: Warehouse[] = [];
  warehouseSearchControl = new FormControl('');

  chapters: Chapter[] = [];
  filteredChapters: Chapter[] = [];
  chapterSearchControl = new FormControl('');

  printers: Printer[] = [];
  filteredPrinters: Printer[] = [];
  printerSearchControl = new FormControl('');

  dataSource = new MatTableDataSource<AssignedWarehouse>([]);
  displayedColumns: string[] = [
    'warehouse',
    'chapter',
    'printer',
    'effectiveDate',
    'terminationDate',
    'actions'
  ];

  minDate = DateFieldValidationUtility.getMinDate();

  /** Tracks which date field was last changed — cross-field error shows only on that field */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  /** Termination date filter: not before today and not before Effective Date */
  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;

    const checkDate = moment(date).startOf('day');
    const today = this.minDate.startOf('day');

    // Prevent dates before today
    if (checkDate.isBefore(today)) {
      return false;
    }

    // Prevent dates before effective date
    const eff = this.form?.get('effectiveDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) {
        return false;
      }
    }

    return true;
  };

  isEditMode = false;
  isSubmitting = false;
  editIndex: number | null = null;

  // Original values for update (to identify record when chapter changes)
  originalChapterId: string | null = null;
  originalEffDate: string | null = null;

  // Store original form values to detect actual changes
  originalFormValues: any = null;

  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();

  private isInitializing = false;


  constructor(
    private fb: FormBuilder,
    private service: AssignUserWarehouseChapterService,
    private dialogRef: MatDialogRef<AssignUserWarehouseChapterComponent>,
    private snackbarService: SnackbarService,
    @Inject(MAT_DIALOG_DATA)
    public dialogData: {
      mode: 'add' | 'edit';
      assignment?: AssignedWarehouse;
      index?: number;

      user: {
        userId: string;
        userName: string;
        department: string;
      };
    }
  ) { }

  ngOnInit(): void {
    if (!this.dialogData) {
      this.dialogRef.close();
      return;
    }

    if (!this.dialogData.user) {
      this.dialogRef.close();
      return;
    }

    this.assignedUserId = this.dialogData.user.userId?.toUpperCase();
    this.assignedUserName = this.dialogData.user.userName;
    this.assignedUserDepartment = this.dialogData.user.department;
    this.assignedUserDisplay = `${this.assignedUserId} - ${this.assignedUserName}`;

    this.isEditMode = this.dialogData.mode === 'edit';
    this.editIndex = this.dialogData.index ?? null;

    this.createForm();
    this.setupModeValidators();
    this.handleWarehouseChange();
    this.setupDateValidationListeners();
    this.setupSearchFunctionality();

    // Load dropdowns from master tables (single API call)
    this.service.getDropdowns()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Map BE DTOs to FE interfaces
            this.warehouses = response.data.warehouses.map(w => ({
              id: w.id,
              name: w.description
            }));
            this.filteredWarehouses = [...this.warehouses];

            // Chapters are independent (not filtered by warehouse) per Oracle Forms XML
            this.chapters = response.data.chapters.map(c => ({
              id: c.id,
              name: c.name
            }));
            this.filteredChapters = [...this.chapters];

            // Enable chapter dropdown since it's independent
            this.form.get('chapter')?.enable();
          }

          if (this.isEditMode) {
            this.handleEditMode();
          }
        },
        error: () => {
          if (this.isEditMode) {
            this.populateFormFromAssignment();
          }
        }
      });
  }

  private setupSearchFunctionality(): void {
    // Warehouse search
    this.warehouseSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredWarehouses = this.warehouses.filter(w =>
          w.id.toLowerCase().includes(term) ||
          (w.name && w.name.toLowerCase().includes(term))
        );
      });

    // Chapter search
    this.chapterSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredChapters = this.chapters.filter(c =>
          c.id.toLowerCase().includes(term) ||
          (c.name && c.name.toLowerCase().includes(term))
        );
      });

    // Printer search
    this.printerSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredPrinters = this.printers.filter(p =>
          p.id.toLowerCase().includes(term) ||
          (p.name && p.name.toLowerCase().includes(term))
        );
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  private createForm(): void {
    // Same form structure for both add and edit modes
    // Chapter is independent (not filtered by warehouse) per Oracle Forms XML
    // Chapter is editable in edit mode (UpdateAllowed="true" in XML)
    this.form = this.fb.group({
      warehouse: [null, Validators.required],
      chapter: [null, Validators.required],  // Enabled by default - independent dropdown
      printer: [{ value: null, disabled: true }],  // Enabled when warehouse selected
      effectiveDate: [null, [Validators.required]],
      terminationDate: [null]
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')]
    });
  }

  private setupModeValidators(): void {
    if (this.isEditMode) {
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      // Override termination date validators to include past date validation in edit mode
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.setValidators([
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    } else {
      DateFieldValidationUtility.setupAddModeValidators(this.form);
    }
  }

  private setupDateValidationListeners(): void {
    // Track which date field was last changed for cross-field error display
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  /** Format effective date for display in edit mode */
  get editEffectiveDateDisplay(): string {
    const effDate = this.form?.get('effectiveDate')?.value;
    if (!effDate) return '-';
    return moment(effDate).format('DD-MMM-YYYY').toUpperCase();
  }

  /** Format warehouse for display in edit mode (read-only) */
  get editWarehouseDisplay(): string {
    const warehouse = this.form?.get('warehouse')?.value;
    if (!warehouse) return '-';
    return warehouse.name ? `${warehouse.id} - ${warehouse.name}` : warehouse.id;
  }

  /** Format chapter for display in edit mode (read-only) */
  get editChapterDisplay(): string {
    const chapter = this.form?.get('chapter')?.value;
    if (!chapter) return '-';
    return chapter.name ? `${chapter.id} - ${chapter.name}` : chapter.id;
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.form.get('effectiveDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.form.get('terminationDate'), this.isEditMode
    );
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }


  private handleWarehouseChange(): void {
    this.form.get('warehouse')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(warehouse => {
        if (this.isInitializing) {
          return;
        }

        // Reset printers when warehouse changes
        this.printers = [];
        this.filteredPrinters = [];
        this.form.get('printer')?.reset();
        this.form.get('printer')?.disable();

        if (!warehouse) return;

        // Load printers for selected warehouse from BE
        // Source: RPT_MASTER_CODES (appl_id = 'DON', code_type = 'LP', location_id = warehouseId)
        this.service.getPrinters(warehouse.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success && response.data) {
                this.printers = response.data.map(p => ({
                  id: p.id,
                  name: p.description
                }));
                this.filteredPrinters = [...this.printers];
              }
              this.form.get('printer')?.enable();
            },
            error: () => {
              this.form.get('printer')?.enable();
            }
          });
      });
  }

  compareById(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }

  /**
   * Check for duplicate warehouse + chapter combination (per Oracle Forms DUP_CHECK logic)
   * Note: PrinterId is NOT part of the duplicate check - same warehouse/chapter can have different printers
   */
  private isDuplicate(
    warehouseId: string,
    chapterId: string,
    ignoreIndex?: number
  ): boolean {
    return this.dataSource.data.some((a, i) => {
      if (ignoreIndex !== undefined && i === ignoreIndex) {
        return false;
      }
      return (
        a.warehouseId === warehouseId &&
        a.chapterId === chapterId
      );
    });
  }

  addAssignment(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();

    if (
      this.isDuplicate(
        raw.warehouse.id,
        raw.chapter.id,
        this.isEditMode ? this.editIndex ?? undefined : undefined
      )
    ) {
      this.snackbarService.showSuccess('This warehouse/chapter combination already exists');
      return;
    }

    const assignment: AssignedWarehouse = {
      warehouseId: raw.warehouse.id,
      warehouseName: raw.warehouse.name || raw.warehouse.id,

      chapterId: raw.chapter.id,
      chapterName: raw.chapter.name || raw.chapter.id,

      printerId: raw.printer?.id,
      printer: raw.printer?.name || raw.printer?.id,

      effectiveDate: DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate) || '',
      terminationDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate) || undefined
    };

    const data = [...this.dataSource.data];

    if (this.isEditMode && this.editIndex !== null) {
      data[this.editIndex] = assignment;
    } else {
      data.push(assignment);
    }

    this.dataSource.data = data;
    this.resetForm();
  }

  private resetForm(): void {
    this.form.reset();
    // Chapter stays enabled (independent dropdown per Oracle Forms XML)
    // Printer disabled until warehouse selected
    this.form.get('printer')?.disable();
    this.isEditMode = false;
    this.editIndex = null;
    this.originalChapterId = null;
    this.originalEffDate = null;
  }

  removeAssignment(index: number): void {
    const data = [...this.dataSource.data];
    data.splice(index, 1);
    this.dataSource.data = data;

    this.snackbarService.showSuccess('Assignment removed');
  }

  saveAndAssign(): void {
    if (!this.dataSource.data.length) return;

    this.isSubmitting = true;

    // Dates are already ISO strings (formatted via formatDateForApi in addAssignment)
    const payload: ValidWarehouseUserDto[] =
      this.dataSource.data.map(a => ({
        UserId: this.assignedUserId?.toUpperCase(),
        WarehouseId: a.warehouseId,
        WarehouseDescription: a.warehouseName || a.warehouseId,
        ChapterId: a.chapterId,
        ChapterDescription: a.chapterName || a.chapterId,
        PrinterId: a.printerId ?? null,
        PrinterDescription: a.printer || a.printerId || '',
        EffDate: a.effectiveDate,
        TermDate: a.terminationDate ?? null
      }));

    this.service.createAssignments(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (!response || response.success) {
            this.snackbarService.showSuccess(response?.message);
            this.dialogRef.close(true);
          } else {
            this.snackbarService.showSuccess(response.message);
          }
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
  }


  private handleEditMode(): void {
    if (this.dialogData?.mode !== 'edit' || !this.dialogData.assignment) {
      return;
    }

    const a = this.dialogData.assignment;

    // Store original values for update (to identify record when chapter changes)
    // Per Oracle Forms XML: CHAPTER_ID has UpdateAllowed="true" so it can be changed
    this.originalChapterId = a.chapterId;
    this.originalEffDate = a.effectiveDate;

    // Ensure assignment's warehouse is in the dropdown
    if (!this.warehouses.some(w => w.id === a.warehouseId)) {
      this.warehouses = [...this.warehouses, { id: a.warehouseId, name: a.warehouseName }];
    }

    // Ensure assignment's chapter is in the dropdown (for edit mode - show current value even if inactive)
    if (!this.chapters.some(c => c.id === a.chapterId)) {
      this.chapters = [...this.chapters, { id: a.chapterId, name: a.chapterName }];
    }

    // Load printers for the warehouse
    this.service.getPrinters(a.warehouseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.printers = response.data.map(p => ({
              id: p.id,
              name: p.description
            }));
          }
          // Ensure assignment's printer is in the dropdown
          if (a.printerId && !this.printers.some(p => p.id === a.printerId)) {
            this.printers = [...this.printers, { id: a.printerId, name: a.printer }];
          }
          this.populateFormFromAssignment();
        },
        error: () => {
          // Ensure assignment's printer is in the dropdown even on error
          if (a.printerId) {
            this.printers = [{ id: a.printerId, name: a.printer }];
          }
          this.populateFormFromAssignment();
        }
      });
  }

  private populateFormFromAssignment(): void {
    const a = this.dialogData?.assignment;
    if (!a) return;

    // Ensure dropdowns have at least the assignment's values
    if (!this.warehouses.some(w => w.id === a.warehouseId)) {
      this.warehouses = [...this.warehouses, { id: a.warehouseId, name: a.warehouseName }];
    }
    if (!this.chapters.some(c => c.id === a.chapterId)) {
      this.chapters = [...this.chapters, { id: a.chapterId, name: a.chapterName }];
    }
    if (a.printerId && !this.printers.some(p => p.id === a.printerId)) {
      this.printers = [...this.printers, { id: a.printerId, name: a.printer }];
    }

    // Enable printer and chapter for editing
    // Per Oracle Forms XML: CHAPTER_ID has UpdateAllowed="true"
    this.form.get('printer')?.enable({ emitEvent: false });
    this.form.get('chapter')?.enable({ emitEvent: false });

    // Use isInitializing to block cascade handlers, let patchValue emit normally
    // so mat-select detects the value change
    this.isInitializing = true;

    this.form.patchValue({
      warehouse: { id: a.warehouseId, name: a.warehouseName },
      chapter: { id: a.chapterId, name: a.chapterName },
      printer: a.printerId ? { id: a.printerId, name: a.printer } : null,
      effectiveDate: a.effectiveDate ? moment(a.effectiveDate) : null,
      terminationDate: a.terminationDate ? moment(a.terminationDate) : null
    });

    this.isInitializing = false;
    this.form.markAsPristine();

    // Store original values for comparison
    this.originalFormValues = this.form.getRawValue();

    // In edit mode per Oracle Forms XML:
    // - WAREHOUSE_ID: UpdateAllowed="false" (disabled)
    // - EFF_DATE: UpdateAllowed="false" (disabled)
    // - CHAPTER_ID: UpdateAllowed="true" (enabled - can be changed)
    // - PRINTER_ID: UpdateAllowed="true" (enabled)
    // - TERM_DATE: UpdateAllowed="true" (enabled)
    if (this.isEditMode) {
      this.form.get('warehouse')?.disable({ emitEvent: false });
      DateFieldValidationUtility.setupEditModeValidators(this.form);
      // Override termination date validators to include past date validation in edit mode
      const termDateControl = this.form.get('terminationDate');
      if (termDateControl) {
        termDateControl.setValidators([
          dateFormatValidator(),
          DateFieldValidationUtility.validDateValidator(),
          DateFieldValidationUtility.terminationDateNotPastValidator()
        ]);
        termDateControl.updateValueAndValidity();
      }
    }
  }

  hasValidationErrors(): boolean {
    return this.form.invalid || this.form.hasError('dateRangeInvalid');
  }

  get isFormValid(): boolean {
    if (!this.isEditMode) {
      return !this.hasValidationErrors();
    }
    if (!this.hasActualChanges()) return false;
    const hasVisibleErrors =
      this.getEffectiveDateError() !== '' ||
      this.getTerminationDateError() !== '';
    return !hasVisibleErrors;
  }

  hasActualChanges(): boolean {
    if (!this.isEditMode || !this.originalFormValues) {
      return true; // In add mode, always allow if valid
    }

    const current = this.form.getRawValue();

    // Compare chapter
    const currentChapterId = current.chapter?.id;
    const originalChapterId = this.originalFormValues.chapter?.id;
    if (currentChapterId !== originalChapterId) {
      return true;
    }

    // Compare printer
    const currentPrinterId = current.printer?.id;
    const originalPrinterId = this.originalFormValues.printer?.id;
    if (currentPrinterId !== originalPrinterId) {
      return true;
    }

    // Compare termination date (compare ISO strings or null)
    const currentTermDate = current.terminationDate ? moment(current.terminationDate).format('YYYY-MM-DD') : null;
    const originalTermDate = this.originalFormValues.terminationDate ? moment(this.originalFormValues.terminationDate).format('YYYY-MM-DD') : null;
    if (currentTermDate !== originalTermDate) {
      return true;
    }

    return false; // No actual changes detected
  }

  updateAssignment(): void {
    this.form.markAllAsTouched();
    this.form.get('terminationDate')?.updateValueAndValidity();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid) {
      return;
    }

    if (!this.dialogData.assignment) {
      return;
    }

    this.isSubmitting = true;
    const raw = this.form.getRawValue();

    // Use UpdateValidWarehouseUserDto with original values for identifying the record
    // Per Oracle Forms XML: CHAPTER_ID can be changed (UpdateAllowed="true")
    const payload: UpdateValidWarehouseUserDto = {
      userId: this.assignedUserId?.toUpperCase(),
      warehouseId: raw.warehouse.id,
      // Original values for WHERE clause (to identify the record)
      originalChapterId: this.originalChapterId,
      originalEffDate: this.originalEffDate!,
      // New values for SET clause
      chapterId: raw.chapter?.id ?? null,
      printerId: raw.printer?.id ?? null,
      termDate: DateFieldValidationUtility.serializeDateForApi(raw.terminationDate)
    };

    this.service.updateAssignment(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (!response || response.success) {
            const warehouseName = raw.warehouse.name || raw.warehouse.id;
            const successMessage = `Warehouse user record '${warehouseName}' updated successfully`;
            this.snackbarService.showSuccess(successMessage);
            this.dialogRef.close(true);
          } else {
            this.snackbarService.showSuccess(response.message);
          }
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}