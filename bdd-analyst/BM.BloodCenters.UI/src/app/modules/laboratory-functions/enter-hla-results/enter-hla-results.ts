import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SnackbarService } from '@shared/services/snackbar.service';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { HlaResultsService } from './services/hla-results.service';
import { DonorHlaInfo, ValidHlaAntigen } from './models/hla-results.model';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { FindDonorDialog } from '@shared/components/find-donor/find-donor';
import { FindDonorDialogResult } from '@shared/components/find-donor/find-donor.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-enter-hla-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent
  ],
  templateUrl: './enter-hla-results.html',
  styleUrl: './enter-hla-results.scss',
  encapsulation: ViewEncapsulation.None
})
export class EnterHlaResults implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `enter-hla-results-${EnterHlaResults.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly hlaResultsService = inject(HlaResultsService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: ''
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  protected readonly searchLoading = signal<boolean>(false);
  protected readonly saveLoading = signal<boolean>(false);
  protected readonly donorInfo = signal<DonorHlaInfo | null>(null);
  protected readonly formSubmitted = signal<boolean>(false);
  protected readonly isExistingRecord = signal<boolean>(false);
  protected readonly needsCollDate = signal<boolean>(false);

  protected readonly validAAntigens = signal<ValidHlaAntigen[]>([]);
  protected readonly validBAntigens = signal<ValidHlaAntigen[]>([]);
  protected readonly antigensLoading = signal<boolean>(false);

  protected readonly filteredA1Antigens = signal<ValidHlaAntigen[]>([]);
  protected readonly filteredA2Antigens = signal<ValidHlaAntigen[]>([]);
  protected readonly filteredB1Antigens = signal<ValidHlaAntigen[]>([]);
  protected readonly filteredB2Antigens = signal<ValidHlaAntigen[]>([]);
  protected readonly hlaFormDirty = signal<boolean>(false);
  protected readonly mandatoryFilled = signal<boolean>(false);
  protected readonly hlaFormValid = signal<boolean>(false);

  protected readonly hasDonorInfo = computed(() => this.donorInfo() !== null);
  protected readonly isEmpty = computed(() => !this.hasDonorInfo() && !this.searchLoading() && !this.needsCollDate());
  protected readonly canSave = computed(() =>
    this.hasDonorInfo() && this.hlaFormDirty() && this.mandatoryFilled() && !this.saveLoading() && this.hlaFormValid()
  );

  hlaForm!: FormGroup;
  collDateControl = new FormControl('');

  a1SearchCtrl = new FormControl('');
  a2SearchCtrl = new FormControl('');
  b1SearchCtrl = new FormControl('');
  b2SearchCtrl = new FormControl('');

  private pendingUnitId: string | null = null;

  // Double-entry validation state
  private doubleEntryState = {
    a1: { firstEntry: null as string | null, needsSecondEntry: false },
    a2: { firstEntry: null as string | null, needsSecondEntry: false },
    b1: { firstEntry: null as string | null, needsSecondEntry: false },
    b2: { firstEntry: null as string | null, needsSecondEntry: false }
  };

  ngOnInit(): void {
    this.subscribeToChapterChanges();
    this.initForms();
    this.trackHlaFormDirty();
    this.setupAntigenSearchFilters();
    this.setupCollectionDateFormatting();

    // Auto-invoke donor search if no unit ID or donor ID provided
    // This matches Oracle Forms WHEN-NEW-ITEM-INSTANCE behavior
    setTimeout(() => {
      if (!this.donorInfo() && !this.searchLoading()) {
        // Check if we should auto-open donor search
        // Only do this if user hasn't started entering unit ID
        const unitIdValue = this.unitIdField?.unitIdControl?.value;
        if (!unitIdValue || unitIdValue.trim() === '') {
          // Don't auto-open - let user choose to scan/type or click search
          // This is a UX improvement over Oracle's forced search
          // To enable forced search, uncomment: this.openDonorSearch();
        }
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.hlaForm = this.fb.group({
      a1: ['', [Validators.required, Validators.maxLength(6)]],
      a2: ['', [Validators.maxLength(6)]],
      b1: ['', [Validators.required, Validators.maxLength(6)]],
      b2: ['', [Validators.maxLength(6)]]
    }, {
      validators: [this.crossValidateHla()]
    });

    // Setup double-entry validation listeners
    this.setupDoubleEntryValidation();
  }

  private setupDoubleEntryValidation(): void {
    // A1 double-entry (required field)
    this.hlaForm.get('a1')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.handleDoubleEntry('a1', value, true));

    // A2 double-entry (optional - only if user enters a value)
    this.hlaForm.get('a2')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.handleDoubleEntry('a2', value, false));

    // B1 double-entry (required field)
    this.hlaForm.get('b1')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.handleDoubleEntry('b1', value, true));

    // B2 double-entry (optional - only if user enters a value)
    this.hlaForm.get('b2')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.handleDoubleEntry('b2', value, false));
  }

  private handleDoubleEntry(field: 'a1' | 'a2' | 'b1' | 'b2', value: string | null, isRequired: boolean): void {
    const state = this.doubleEntryState[field];
    const control = this.hlaForm.get(field);

    if (!control) return;

    // Skip if value is empty/null
    if (!value || value.trim() === '') {
      // Reset double-entry state for this field
      state.firstEntry = null;
      state.needsSecondEntry = false;
      return;
    }

    // First entry
    if (!state.needsSecondEntry && state.firstEntry === null) {
      state.firstEntry = value;
      state.needsSecondEntry = true;

      // Clear the field and prompt for re-entry
      setTimeout(() => {
        control.setValue('', { emitEvent: false });
        control.markAsUntouched();

        // Show message
        const fieldLabel = field.toUpperCase();
        this.snackbarService.showInfo(`Please re-enter ${fieldLabel} for confirmation`);
      }, 100);

      return;
    }

    // Second entry - validate match
    if (state.needsSecondEntry && state.firstEntry !== null) {
      if (value !== state.firstEntry) {
        // Mismatch - show error code 0045
        control.setErrors({ ...control.errors, doubleEntryMismatch: true });
        control.markAsTouched();

        // Reset state
        state.firstEntry = null;
        state.needsSecondEntry = false;

        // Clear field
        setTimeout(() => {
          control.setValue('', { emitEvent: false });
          this.snackbarService.showError('Values do not match. Please re-enter.');
        }, 100);
      } else {
        // Match - clear double-entry error if present
        if (control.hasError('doubleEntryMismatch')) {
          const { doubleEntryMismatch, ...rest } = control.errors!;
          control.setErrors(Object.keys(rest).length ? rest : null);
        }

        // Reset state - double-entry complete
        state.firstEntry = null;
        state.needsSecondEntry = false;
      }
    }
  }

  private trackHlaFormDirty(): void {
    this.hlaForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const { a1, a2, b1, b2 } = this.hlaForm.value;
        this.hlaFormDirty.set(!!(a1 || a2 || b1 || b2));
        this.mandatoryFilled.set(!!(a1 && b1));
        this.hlaFormValid.set(this.hlaForm.valid);
      });
  }

  private crossValidateHla() {
    return (formGroup: FormGroup) => {
      const a1 = formGroup.get('a1')?.value;
      const a2 = formGroup.get('a2')?.value;
      const b1 = formGroup.get('b1')?.value;
      const b2 = formGroup.get('b2')?.value;
      const a2Ctrl = formGroup.get('a2');
      const b2Ctrl = formGroup.get('b2');

      if (a1 && a2 && a2.padStart(10, '0') <= a1.padStart(10, '0')) {
        a2Ctrl?.setErrors({ ...a2Ctrl?.errors, a2NotGreaterThanA1: true });
        a2Ctrl?.markAsTouched();
      } else if (a2Ctrl?.hasError('a2NotGreaterThanA1')) {
        const { a2NotGreaterThanA1, ...rest } = a2Ctrl.errors!;
        a2Ctrl.setErrors(Object.keys(rest).length ? rest : null);
      }

      if (b1 && b2 && b2.padStart(10, '0') <= b1.padStart(10, '0')) {
        b2Ctrl?.setErrors({ ...b2Ctrl?.errors, b2NotGreaterThanB1: true });
        b2Ctrl?.markAsTouched();
      } else if (b2Ctrl?.hasError('b2NotGreaterThanB1')) {
        const { b2NotGreaterThanB1, ...rest } = b2Ctrl.errors!;
        b2Ctrl.setErrors(Object.keys(rest).length ? rest : null);
      }

      return null;
    };
  }

  private loadValidAntigens(): void {
    this.antigensLoading.set(true);

    this.hlaResultsService.getValidAntigens('A')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (antigens) => {
          this.validAAntigens.set(antigens);
          this.filteredA1Antigens.set(antigens);
          this.filteredA2Antigens.set(antigens);
        },
        error: () => this.antigensLoading.set(false)
      });

    this.hlaResultsService.getValidAntigens('B')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (antigens) => {
          this.validBAntigens.set(antigens);
          this.filteredB1Antigens.set(antigens);
          this.filteredB2Antigens.set(antigens);
          this.antigensLoading.set(false);
        },
        error: () => this.antigensLoading.set(false)
      });
  }

  // --- Collection date input formatting ---

  private setupCollectionDateFormatting(): void {
    this.collDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (!value) return;

        // Auto-format as MM/DD/YYYY while user types MMDDYYYY
        const cleaned = value.replace(/\D/g, ''); // Remove non-digits

        if (cleaned.length <= 2) {
          // Just MM
          this.collDateControl.setValue(cleaned, { emitEvent: false });
        } else if (cleaned.length <= 4) {
          // MM/DD
          const formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
          this.collDateControl.setValue(formatted, { emitEvent: false });
        } else if (cleaned.length <= 8) {
          // MM/DD/YYYY
          const formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
          this.collDateControl.setValue(formatted, { emitEvent: false });
        }
      });
  }

  // --- Select-search filtering (independent per dropdown) ---

  private setupAntigenSearchFilters(): void {
    this.a1SearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      const s = (search || '').toLowerCase();
      const source = this.validAAntigens();
      this.filteredA1Antigens.set(s ? source.filter(a => a.epitopeId.toLowerCase().startsWith(s)) : source);
    });

    this.a2SearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      const s = (search || '').toLowerCase();
      const source = this.validAAntigens();
      this.filteredA2Antigens.set(s ? source.filter(a => a.epitopeId.toLowerCase().startsWith(s)) : source);
    });

    this.b1SearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      const s = (search || '').toLowerCase();
      const source = this.validBAntigens();
      this.filteredB1Antigens.set(s ? source.filter(a => a.epitopeId.toLowerCase().startsWith(s)) : source);
    });

    this.b2SearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(search => {
      const s = (search || '').toLowerCase();
      const source = this.validBAntigens();
      this.filteredB2Antigens.set(s ? source.filter(a => a.epitopeId.toLowerCase().startsWith(s)) : source);
    });
  }

  // --- Unit ID shared component handlers ---

  onUnitValidated(data: UnitValidationResponse): void {
    if (!data.parsedUnitId) return;
    this.retrieveDonor(data.parsedUnitId);
  }

  onUnitCleared(): void {
    this.donorInfo.set(null);
    this.needsCollDate.set(false);
    this.pendingUnitId = null;
  }

  onEmptyEnter(): void {
    this.openDonorSearch();
  }

  // --- Donor search fallback ---

  openDonorSearch(): void {
    const dialogRef = this.dialog.open(FindDonorDialog, {
      width: '900px',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: FindDonorDialogResult) => {
        if (result?.action === 'select' && result.donor?.donorId) {
          this.retrieveDonorByDonorId(result.donor.donorId);
        }
      });
  }

  // --- Retrieve ---

  private retrieveDonor(unitId: string): void {
    this.resetFormState();
    this.searchLoading.set(true);

    this.hlaResultsService.retrieveDonorByUnitId({ unitId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donorInfo) => {
          this.searchLoading.set(false);
          if (donorInfo) {
            this.onDonorRetrieved(donorInfo);
            this.pendingUnitId = null; // Clear on success
          }
        },
        error: (error) => {
          this.searchLoading.set(false);
          const errorCode = error?.error?.errorCode;
          const errorMsg = error?.error?.errorResponse?.error || error?.error?.message;
          if (errorCode === '9715') {
            // Set pendingUnitId ONLY when we need collection date disambiguation
            this.pendingUnitId = unitId;
            this.needsCollDate.set(true);
            this.snackbarService.showError(errorMsg || 'Multiple donations found. Please enter a collection date.');
          } else {
            this.pendingUnitId = null; // Clear on other errors
            this.snackbarService.showError(errorMsg || 'Failed to retrieve donor information');
          }
        }
      });
  }

  onCollDateSubmit(): void {
    const collDate = this.collDateControl.value?.trim();
    if (!collDate || !this.pendingUnitId) return;

    // Verify pendingUnitId matches current unit ID field (staleness check)
    const currentUnitId = this.unitIdField?.parsedUnitId;
    if (currentUnitId && this.pendingUnitId !== currentUnitId) {
      this.snackbarService.showError('Unit ID has changed. Please re-enter the collection date.');
      this.needsCollDate.set(false);
      this.pendingUnitId = null;
      return;
    }

    // Parse date - accept both MMDDYYYY and MM/DD/YYYY formats
    const cleaned = collDate.replace(/\D/g, ''); // Remove non-digits
    const parsed = moment(cleaned, 'MMDDYYYY', true);
    if (!parsed.isValid()) {
      this.snackbarService.showError('Invalid date. Enter collection date as MMDDYYYY.');
      return;
    }

    this.needsCollDate.set(false);
    this.searchLoading.set(true);

    const unitIdToUse = this.pendingUnitId;

    this.hlaResultsService.retrieveDonorByUnitId({
      unitId: unitIdToUse,
      collDate: parsed.format('YYYY-MM-DD')
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donorInfo) => {
          this.searchLoading.set(false);
          if (donorInfo) {
            this.onDonorRetrieved(donorInfo);
            this.pendingUnitId = null; // Clear on success
          }
        },
        error: (error) => {
          this.searchLoading.set(false);
          this.pendingUnitId = null; // Clear on error
          const errorMsg = error?.error?.errorResponse?.error || error?.error?.message;
          this.snackbarService.showError(errorMsg || 'No donation found for this unit and collection date');
        }
      });
  }

  private retrieveDonorByDonorId(donorId: string): void {
    this.resetFormState();
    this.searchLoading.set(true);

    this.hlaResultsService.retrieveDonorByDonorId(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donorInfo) => {
          this.searchLoading.set(false);
          if (donorInfo) {
            this.onDonorRetrieved(donorInfo);
          }
        },
        error: (error) => {
          this.searchLoading.set(false);
          const errorMsg = error?.error?.errorResponse?.error || error?.error?.message;
          this.snackbarService.showError(errorMsg || 'Failed to retrieve donor HLA information');
        }
      });
  }

  private onDonorRetrieved(donorInfo: DonorHlaInfo): void {
    this.donorInfo.set(donorInfo);
    this.isExistingRecord.set(!!(donorInfo.insertUser || donorInfo.prevA1 || donorInfo.prevA2 || donorInfo.prevB1 || donorInfo.prevB2));
    this.hlaForm.reset(undefined, { emitEvent: false });
    this.loadValidAntigens();
  }

  // --- Save ---

  onSave(): void {
    this.formSubmitted.set(true);

    if (this.hlaForm.invalid || !this.donorInfo()) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const donor = this.donorInfo();
    if (!donor) {
      return;
    }

    this.saveLoading.set(true);

    const request = {
      donorId: donor.donorId,
      unitId: this.unitIdField?.parsedUnitId ?? null,
      collDate: donor.collectionDate,
      a1: this.hlaForm.get('a1')?.value,
      a2: this.hlaForm.get('a2')?.value || null,
      b1: this.hlaForm.get('b1')?.value,
      b2: this.hlaForm.get('b2')?.value || null
    };

    const save$ = this.isExistingRecord()
      ? this.hlaResultsService.updateHlaResults(donor.donorId, request)
      : this.hlaResultsService.saveHlaResults(request);

    save$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.saveLoading.set(false);
          this.snackbarService.showSuccess('New HLA results saved successfully');
          this.clearForm();
        },
        error: (error) => {
          this.saveLoading.set(false);
          const errorMsg = error?.error?.errorResponse?.error || error?.error?.message;
          this.snackbarService.showError(errorMsg || 'Failed to save HLA results');
        }
      });
  }

  onCancel(): void {
    this.clearForm();
  }

  private resetFormState(): void {
    this.donorInfo.set(null);
    this.hlaForm.reset(undefined, { emitEvent: false });
    this.hlaFormDirty.set(false);
    this.mandatoryFilled.set(false);
    this.hlaFormValid.set(false);
    this.formSubmitted.set(false);
    this.isExistingRecord.set(false);
    this.needsCollDate.set(false);
    this.collDateControl.setValue('', { emitEvent: false });
  }

  private clearForm(): void {
    this.unitIdField?.clear();
    this.resetFormState();
    this.pendingUnitId = null;
    // Return focus to unit ID input for keyboard accessibility
    setTimeout(() => {
      this.unitIdField?.focus();
    }, 100);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearForm();
      });
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY') : value;
  }

  get hf() {
    return this.hlaForm.controls;
  }
}
