import { Component, OnInit, OnDestroy, inject, signal, computed, Input, Output, EventEmitter, ViewChild, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Subject, takeUntil, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import moment from 'moment';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
// Shared
import { DD_MON_YYYY_FORMATS } from '../../../../../shared/date/date-formats';
import { ChapterAwareDateAdapter } from '../../../../../shared/date/chapter-aware-date-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';

// Local
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { DonorAttributesService } from './services/donor-attributes.service';
import {
  DonorDemographics,
  DonorInterdiction,
  PropertyLookup,
  BulkUpsertRecord,
  BulkUpsertRequest
} from './models/donor-attributes.model';
import {
  getPropertyCodeErrorMessage
} from './validators/donor-attributes.validator';
import {
  TerminatedAttributesDialogComponent,
  TerminatedAttributesDialogData
} from './terminated-attributes-dialog/terminated-attributes-dialog.component';

export interface DonorAttributesDialogData {
  donorId: string;
}

/**
 * Donor Attributes Component (DPWPROPR)
 * Manages donor interdiction properties/attributes
 */
@Component({
  selector: 'app-donor-attributes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    NgxMatSelectSearchModule,
    SidePanelBase
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './donor-attributes.component.html',
  styleUrls: ['./donor-attributes.component.scss']
})
export class DonorAttributesComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly donorAttributesService = inject(DonorAttributesService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<DonorAttributesComponent>, { optional: true });
  private readonly destroy$ = new Subject<void>();

  // Side panel mode inputs
  @Input() inputDonorId?: string;
  @Input() inputDonorName?: string;
  @Input() inputDob?: string;
  @Input() inputSex?: string;
  @Input() inputAbo?: string;
  @Input() inputReadOnly?: boolean;
  @Output() closePanelEvent = new EventEmitter<void>();

  isSidePanelMode = false;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: DonorAttributesDialogData | null
  ) {}
  readonly isEditing = signal<boolean>(false);

  // Side panel footer buttons
  readonly sidePanelButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary' }
  ];

  // Signals
  readonly donorDemographics = signal<DonorDemographics | null>(null);
  readonly activeAttributes = signal<DonorInterdiction[]>([]);
  readonly availableProperties = signal<PropertyLookup[]>([]);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly hasHiddenAttributes = signal<boolean>(false);
  readonly loadingProperties = signal<boolean>(false);
  readonly terminatedAttributes = signal<DonorInterdiction[]>([]);
  readonly loadingTerminated = signal<boolean>(false);
  readonly activeTab = signal<'all' | 'terminated'>('all');

  // Computed
  readonly donorName = computed(() => {
    const demo = this.donorDemographics();
    if (!demo) return '';
    return `${demo.firstName} ${demo.lastName}`;
  });

  readonly donorId = computed(() => {
    if (this.isSidePanelMode) return this.inputDonorId || '';
    return this.donorDemographics()?.donorId || '';
  });

  // Form
  attributesForm!: FormGroup;

  @ViewChild('attributesMatTable') attributesMatTable?: MatTable<any>;

  // Table columns
  protected readonly displayedColumns: string[] = [
    'interCode',
    'interDesc',
    'insertUser',
    'effDate',
    'termDate',
    'actions'
  ];

  // Date utility
  protected readonly minDate = DateFieldValidationUtility.getMinDate();
  protected readonly chapterOffset = this.headerService.chapterTimeZone();

  // Attribute dropdown search (per-row)
  rowSearchControls: Map<number, FormControl> = new Map();
  rowFilteredProperties: Map<number, PropertyLookup[]> = new Map();

  // Cached termination date filters and min dates (per-row) to avoid recreating on every CD cycle
  private termDateFilterCache: Map<number, { effDate: any; filterFn: (date: moment.Moment | null) => boolean }> = new Map();
  private termMinDateCache: Map<number, { effDate: any; minDate: moment.Moment }> = new Map();


  // Error message getters
  protected readonly getPropertyCodeError = getPropertyCodeErrorMessage;

  ngOnInit(): void {
    this.initForm();

    if (this.dialogData?.donorId) {
      this.isSidePanelMode = true;
      this.loadDonorData(this.dialogData.donorId);
    } else if (this.inputDonorId) {
      this.isSidePanelMode = true;
      this.loadDonorData(this.inputDonorId);
    } else {
      this.loadDonorIdFromRoute();
    }
  }

  getSearchControl(index: number): FormControl {
    if (!this.rowSearchControls.has(index)) {
      const ctrl = new FormControl('');
      ctrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        const currentIndex = this.findIndexForSearchControl(ctrl);
        if (currentIndex === -1) return;

        const search = (ctrl.value || '').toLowerCase();
        if (!search) {
          this.rowFilteredProperties.set(currentIndex, this.availableProperties());
        } else {
          this.rowFilteredProperties.set(currentIndex, this.availableProperties().filter(p =>
            p.interCode.toLowerCase().includes(search) ||
            (p.interDesc && p.interDesc.toLowerCase().includes(search))
          ));
        }
      });
      this.rowSearchControls.set(index, ctrl);
    }
    return this.rowSearchControls.get(index)!;
  }

  private findIndexForSearchControl(ctrl: FormControl): number {
    for (const [index, control] of this.rowSearchControls.entries()) {
      if (control === ctrl) return index;
    }
    return -1;
  }

  getFilteredProperties(index: number): PropertyLookup[] {
    if (!this.rowFilteredProperties.has(index)) {
      this.rowFilteredProperties.set(index, this.availableProperties());
    }
    return this.rowFilteredProperties.get(index)!;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form with empty array
   */
  private initForm(): void {
    this.attributesForm = this.fb.group({
      attributes: this.fb.array([])
    });
  }

  /**
   * Get donor ID from route parameter
   */
  private loadDonorIdFromRoute(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const donorId = params.get('donorId');
      if (donorId) {
        this.loadDonorData(donorId);
      } else {
        this.error.set('Donor ID not found in route');
      }
    });
  }

  /**
   * Load donor demographics and attributes
   */
  private loadDonorData(donorId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.donorAttributesService
      .getDonorDemographics(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (demographics) => {
          this.donorDemographics.set(demographics);
          this.loadActiveAttributes(donorId);
          this.loadValidProperties();
        },
        error: (err: any) => {
          if (this.isSidePanelMode) {
            this.loadActiveAttributes(donorId);
            this.loadValidProperties();
          } else {
            this.error.set(err?.message || 'Failed to load donor demographics');
            this.loading.set(false);
          }
        }
      });
  }

  /**
   * Load active attributes
   */
  private loadActiveAttributes(donorId: string): void {
    this.donorAttributesService
      .getActiveAttributes(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.activeAttributes.set(result.attributes);
          this.buildAttributesFormArray(result.attributes);
          this.mergeActiveCodesIntoProperties();
          this.hasHiddenAttributes.set(result.hasOtherAttributes);
          this.loading.set(false);
        },
        error: (err: any) => {
          this.error.set(err?.message || 'Failed to load active attributes');
          this.loading.set(false);
        }
      });
  }

  loadTerminatedAttributes(): void {
    const id = this.donorId();
    if (!id) return;
    this.loadingTerminated.set(true);
    this.donorAttributesService
      .getTerminatedAttributes(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attrs) => {
          this.terminatedAttributes.set(attrs);
          this.loadingTerminated.set(false);
        },
        error: () => {
          this.loadingTerminated.set(false);
        }
      });
  }

  onTabChange(tab: 'all' | 'terminated'): void {
    this.activeTab.set(tab);
    if (tab === 'terminated' && this.terminatedAttributes().length === 0) {
      this.loadTerminatedAttributes();
    }
  }

  /**
   * Load valid property codes
   */
  private loadValidProperties(): void {
    this.loadingProperties.set(true);
    this.donorAttributesService
      .getValidProperties()
      .pipe(
        catchError(() => EMPTY),
        takeUntil(this.destroy$)
      )
      .subscribe((properties) => {
        this.availableProperties.set(properties);
        this.mergeActiveCodesIntoProperties();
        this.loadingProperties.set(false);
      });
  }

  private mergeActiveCodesIntoProperties(): void {
    const props = [...this.availableProperties()];
    const existingCodes = new Set(props.map(p => p.interCode));

    for (const attr of this.activeAttributes()) {
      if (!existingCodes.has(attr.interCode)) {
        props.push({
          interCode: attr.interCode,
          interDesc: attr.interDesc || '',
          interType: attr.interType
        });
        existingCodes.add(attr.interCode);
      }
    }

    this.availableProperties.set(props);
  }

  /**
   * Build form array from attributes
   */
  private buildAttributesFormArray(attributes: DonorInterdiction[]): void {
    const formArray = this.attributesForm.get('attributes') as FormArray;
    formArray.clear();

    attributes.forEach((attr) => {
      formArray.push(this.createAttributeFormGroup(attr));
    });
  }

  /**
   * Create form group for a single attribute
   */
  private createAttributeFormGroup(attribute?: DonorInterdiction): FormGroup {
    const isNew = attribute?.isNew || false;
    const hasInterCode = !!(attribute?.interCode);

    const group = this.fb.group(
      {
        interCode: [
          attribute?.interCode || '',
          [Validators.required, Validators.maxLength(5)]
        ],
        interDesc: [{ value: attribute?.interDesc || '', disabled: true }],
        effDate: [
          attribute?.effDate ? moment(attribute.effDate) : (isNew ? DateFieldValidationUtility.getMinDate(this.chapterOffset) : null)
        ],
        termDate: [
          attribute?.termDate ? moment(attribute.termDate) : null
        ],
        insertUser: [{ value: attribute?.insertUser || '', disabled: true }],
        donorId: [attribute?.donorId || ''],
        chapterId: [attribute?.chapterId || ''],
        interType: [attribute?.interType || ''],
        auditKey: [attribute?.auditKey || null],
        isNew: [isNew],
        originalEffDate: [attribute?.effDate || '']
      },
      {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
      }
    );

    if (isNew) {
      DateFieldValidationUtility.setupAddModeValidators(group, this.chapterOffset);
    } else {
      DateFieldValidationUtility.setupEditModeValidators(group, this.chapterOffset);
      const termControl = group.get('termDate');
      if (termControl) {
        termControl.addValidators(DateFieldValidationUtility.terminationDateNotPastValidator(this.chapterOffset));
        termControl.updateValueAndValidity();
      }
    }

    if (!isNew) {
      group.get('interCode')?.disable();
    }

    // Disable date fields initially if no attribute is selected
    if (!hasInterCode) {
      group.get('effDate')?.disable();
      group.get('termDate')?.disable();
    }

    group
      .get('interCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        if (code) {
          this.updatePropertyDescription(group, code);
          if (isNew) {
            group.get('effDate')?.enable();
          }
          group.get('termDate')?.enable();
        } else {
          group.get('effDate')?.disable();
          group.get('termDate')?.disable();
        }
      });

    group
      .get('effDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        group.get('termDate')?.updateValueAndValidity();
      });

    return group;
  }

  /**
   * Update property description based on selected code
   */
  private updatePropertyDescription(group: FormGroup, code: string): void {
    const property = this.availableProperties().find((p) => p.interCode === code);
    if (property) {
      group.get('interDesc')?.setValue(property.interDesc);
      group.get('interType')?.setValue(property.interType);
    }
  }

  /**
   * Get form array
   */
  get attributesArray(): FormArray {
    return this.attributesForm.get('attributes') as FormArray;
  }

  /**
   * Get form group at index
   */
  getAttributeGroup(index: number): FormGroup {
    return this.attributesArray.at(index) as FormGroup;
  }

  /**
   * Add new attribute row
   */
  onAddAttribute(): void {
    const newGroup = this.createAttributeFormGroup({
      donorId: this.donorId(),
      interCode: '',
      chapterId: '',
      isNew: true
    } as DonorInterdiction);

    this.shiftRowMapsForInsert(0);

    this.attributesArray.insert(0, newGroup);
    this.attributesMatTable?.renderRows();
  }

  private shiftRowMapsForInsert(insertIndex: number): void {
    const shiftMap = <T>(map: Map<number, T>): void => {
      const entries = Array.from(map.entries())
        .filter(([k]) => k >= insertIndex)
        .sort((a, b) => b[0] - a[0]);
      for (const [key, value] of entries) {
        map.set(key + 1, value);
      }
      map.delete(insertIndex);
    };

    shiftMap(this.rowSearchControls);
    shiftMap(this.rowFilteredProperties);
    shiftMap(this.termDateFilterCache);
    shiftMap(this.termMinDateCache);
  }

  /**
   * Save attribute (add or update)
   */
  onSaveAttribute(index: number): void {
    const group = this.getAttributeGroup(index);
    if (group.invalid) {
      group.markAllAsTouched();
      this.snackBar.open('Please fix validation errors before saving', 'DISMISS', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.saving.set(true);
    const formValue = group.getRawValue();
    const isNew = formValue.isNew;

    const attribute: Partial<DonorInterdiction> = {
      interCode: formValue.interCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
      termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
      interType: formValue.interType
    };

    const saveObservable = isNew
      ? this.donorAttributesService.addAttribute(this.donorId(), attribute)
      : this.donorAttributesService.updateAttribute(
          this.donorId(),
          formValue.interCode,
          formValue.originalEffDate,
          attribute
        );

    saveObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Attribute saved successfully', 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        group.patchValue({ isNew: false, originalEffDate: formValue.effDate });
        this.saving.set(false);
      },
      error: (err) => {
        this.snackBar.open(err?.message || 'Failed to save attribute', 'DISMISS', {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.saving.set(false);
      }
    });
  }

  /**
   * Terminate attribute
   */
  onTerminateAttribute(index: number): void {
    const group = this.getAttributeGroup(index);
    const formValue = group.getRawValue();

    if (!formValue.termDate) {
      this.snackBar.open('Please set termination date first', 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (group.get('termDate')?.invalid) {
      this.snackBar.open('Invalid termination date', 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    const dialogData: ConfirmActionDialogData = {
      title: 'Confirm Termination',
      message: 'Are you sure you want to terminate this attribute?',
      confirmText: 'YES',
      cancelText: 'NO'
    };

    this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: dialogData
    }).afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        this.executeTermination(index);
      }
    });
  }

  private executeTermination(index: number): void {
    const group = this.getAttributeGroup(index);
    const formValue = group.getRawValue();

    this.saving.set(true);

    this.donorAttributesService
      .terminateAttribute(
        this.donorId(),
        formValue.interCode,
        formValue.originalEffDate,
        DateFieldValidationUtility.serializeDateForApi(formValue.termDate) || ''
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Attribute terminated successfully', 'DISMISS', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.attributesArray.removeAt(index);
          this.attributesMatTable?.renderRows();
          this.saving.set(false);
        },
        error: (err) => {
          this.snackBar.open(err?.message || 'Failed to terminate attribute', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.saving.set(false);
        }
      });
  }

  /**
   * Delete unsaved attribute row
   */
  onDeleteAttribute(index: number): void {
    const group = this.getAttributeGroup(index);
    if (group.get('isNew')?.value) {
      this.shiftRowMapsForRemove(index);
      this.attributesArray.removeAt(index);
      this.attributesMatTable?.renderRows();
    }
  }

  private shiftRowMapsForRemove(removeIndex: number): void {
    const shiftMap = <T>(map: Map<number, T>): void => {
      map.delete(removeIndex);
      const entries = Array.from(map.entries())
        .filter(([k]) => k > removeIndex)
        .sort((a, b) => a[0] - b[0]);
      for (const [key, value] of entries) {
        map.set(key - 1, value);
        map.delete(key);
      }
    };

    shiftMap(this.rowSearchControls);
    shiftMap(this.rowFilteredProperties);
    shiftMap(this.termDateFilterCache);
    shiftMap(this.termMinDateCache);
  }

  /**
   * Open terminated attributes dialog
   */
  onViewTerminated(): void {
    const dialogData: TerminatedAttributesDialogData = {
      donorId: this.donorId(),
      donorName: this.donorName()
    };

    this.dialog.open(TerminatedAttributesDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: dialogData
    });
  }

  /**
   * Retry loading data
   */
  onRetry(): void {
    this.loadDonorIdFromRoute();
  }

  /**
   * Close/navigate back
   */
  onClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else if (this.isSidePanelMode) {
      this.closePanelEvent.emit();
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  onSidePanelButtonClick(action: string): void {
    if (action === 'close') {
      this.onClose();
    }
  }

  onToggleEdit(): void {
    if (this.inputReadOnly) {
      this.showQueryModeError();
      return;
    }
    this.isEditing.set(true);
  }

  private showQueryModeError(): void {
    this.snackBar.open('Error:1705: Form in query mode, cannot change database fields', 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  onCancelEdit(): void {
    this.isEditing.set(false);
    this.clearAllRowCaches();
    this.buildAttributesFormArray(this.activeAttributes());
    this.attributesMatTable?.renderRows();
  }

  private clearAllRowCaches(): void {
    this.rowSearchControls.clear();
    this.rowFilteredProperties.clear();
    this.termDateFilterCache.clear();
    this.termMinDateCache.clear();
  }

  onSaveAll(): void {
    // Validate all rows
    let hasErrors = false;
    for (let i = 0; i < this.attributesArray.length; i++) {
      const group = this.getAttributeGroup(i);
      group.markAllAsTouched();
      if (group.invalid) {
        hasErrors = true;
      }
    }

    if (hasErrors) {
      this.focusFirstInvalidField();
      this.snackBar.open('Please fix validation errors before saving', 'DISMISS', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Build bulk upsert records from all rows (new + existing dirty)
    const records: BulkUpsertRecord[] = [];
    for (let i = 0; i < this.attributesArray.length; i++) {
      const group = this.getAttributeGroup(i);
      const formValue = group.getRawValue();
      const isNew = formValue.isNew;

      if (isNew || group.dirty) {
        records.push({
          auditKey: isNew ? null : formValue.auditKey,
          interCode: formValue.interCode,
          effDate: DateFieldValidationUtility.serializeDateForApi(formValue.effDate) || '',
          termDate: DateFieldValidationUtility.serializeDateForApi(formValue.termDate),
          interType: formValue.interType || null
        });
      }
    }

    if (records.length === 0) {
      this.snackBar.open('No changes to save', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    this.saving.set(true);
    const request: BulkUpsertRequest = { records };

    this.donorAttributesService.bulkUpsert(this.donorId(), request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success && response.failureCount === 0) {
            this.snackBar.open('Donor attributes saved successfully', 'DISMISS', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.isEditing.set(false);
            this.loadActiveAttributes(this.donorId());
          } else if (response.success && response.failureCount > 0) {
            const errorDetails = response.errors.map(e => `${e.interCode}: ${e.errorMessage}`).join('; ');
            this.snackBar.open(`Partially saved: ${response.successCount} succeeded, ${response.failureCount} failed. ${errorDetails}`, 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            this.loadActiveAttributes(this.donorId());
          } else {
            this.snackBar.open(response.message || 'Failed to save attributes', 'DISMISS', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err?.message || 'Failed to save attributes', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /**
   * Focus the first invalid field in the form array for accessibility (WCAG 3.3.1)
   */
  private focusFirstInvalidField(): void {
    for (let i = 0; i < this.attributesArray.length; i++) {
      const group = this.getAttributeGroup(i);
      if (group.invalid) {
        const invalidControlName = Object.keys(group.controls)
          .find(key => group.get(key)?.invalid);
        if (invalidControlName) {
          const el = document.querySelector(
            `[formControlName="${invalidControlName}"]`
          ) as HTMLElement;
          if (el) {
            el.focus();
            return;
          }
        }
      }
    }
  }

  getMinTermDate(group: FormGroup): moment.Moment {
    if (!group) return this.minDate;
    const effDate = group.get('effDate')?.value;
    if (!effDate) return this.minDate;
    const index = this.attributesArray.controls.indexOf(group);
    const cached = this.termMinDateCache.get(index);
    if (cached && cached.effDate === effDate) {
      return cached.minDate;
    }
    const min = moment(effDate);
    this.termMinDateCache.set(index, { effDate, minDate: min });
    return min;
  }

  getTermDateFilter(group: FormGroup): (date: moment.Moment | null) => boolean {
    if (!group) return () => true;
    const effDate = group.get('effDate')?.value;
    const index = this.attributesArray.controls.indexOf(group);
    const cached = this.termDateFilterCache.get(index);
    if (cached && cached.effDate === effDate) {
      return cached.filterFn;
    }
    const filterFn = DateFieldValidationUtility.createTerminationDateFilter(effDate);
    this.termDateFilterCache.set(index, { effDate, filterFn });
    return filterFn;
  }

  getEffDateError(group: FormGroup): string {
    if (!group) return '';
    return DateFieldValidationUtility.getEffectiveDateError(group);
  }

  getTermDateError(group: FormGroup): string {
    if (!group) return '';
    return DateFieldValidationUtility.getTerminationDateError(group);
  }

  onEffDateInput(event: Event, group: FormGroup): void {
    if (!group) return;
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleStartDateInput(inputValue, group.get('effDate'));
  }

  onTermDateInput(event: Event, group: FormGroup): void {
    if (!group) return;
    const inputValue = (event.target as HTMLInputElement).value;
    DateFieldValidationUtility.handleEndDateInput(inputValue, group.get('termDate'), !group.get('isNew')?.value);
  }

  formatDateForDisplay(date: any): string {
    const formatted = DateFieldValidationUtility.formatDateForUI(date);
    return formatted ? formatted.toUpperCase() : '-';
  }
}
