import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { EnterTestObservationsTech1Service } from './enter-test-observations-tech1.service';
import { AdditionalBandsDialogComponent } from './additional-bands-dialog/additional-bands-dialog';
import { BandValuesWarningDialogComponent } from './band-values-warning-dialog/band-values-warning-dialog';
import {
  TestBatchWorksheet,
  TestIdOption,
  TestTypeOption,
  ResultInterpretation,
  ObservationColumn,
  UnitObservationData,
  BandRow,
  TestObservationNote,
  AdditionalBandsDialogData,
  AdditionalBandsDialogResult,
  ObservationTableRow,
  SaveNoteRequest,
} from './enter-test-observations-tech1.model';

/**
 * Enter Test Observations: Tech 1 Component
 * Allows technicians to enter and record test observation results for units
 */
@Component({
  selector: 'app-enter-test-observations-tech1',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './enter-test-observations-tech1.html',
  styleUrl: './enter-test-observations-tech1.scss',
})
export class EnterTestObservationsTech1Component implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `enter-test-observations-tech1-${EnterTestObservationsTech1Component.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly service = inject(EnterTestObservationsTech1Service);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingObservations = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Dropdown options
  protected readonly testBatchWorksheets = signal<TestBatchWorksheet[]>([]);
  protected readonly testIds = signal<TestIdOption[]>([]);
  protected readonly testTypes = signal<TestTypeOption[]>([]);
  protected readonly resultInterpretations = signal<ResultInterpretation[]>([]);
  protected readonly bandValues = signal<{ result: string; resultDesc: string }[]>([]);

  // Search controls for dropdowns
  protected readonly testBatchSearchControl = new FormControl('');
  protected readonly testIdSearchControl = new FormControl('');
  protected readonly testTypeSearchControl = new FormControl('');
  protected filteredTestBatchWorksheets: TestBatchWorksheet[] = [];
  protected filteredTestIds: TestIdOption[] = [];
  protected filteredTestTypes: TestTypeOption[] = [];

  // Observation data
  protected readonly observationColumns = signal<ObservationColumn[]>([]);
  protected readonly units = signal<UnitObservationData[]>([]);
  protected readonly selectedDescription = signal<string>('');
  protected readonly selectedTestTypeDescription = signal<string>('');
  protected readonly selectedControlValue = signal<string>('');

  // Notes
  protected readonly selectedUnitId = signal<string | null>(null);
  protected readonly notes = signal<TestObservationNote | null>(null);
  protected readonly loadingNotes = signal<boolean>(false);
  protected readonly savingNote = signal<boolean>(false);
  protected readonly deletingNote = signal<boolean>(false);
  protected readonly editingNote = signal<boolean>(false);
  protected readonly noteText = signal<string>('');
  protected readonly editNoteText = signal<string>('');

  // Table data - one row per unit
  protected readonly tableData = computed<ObservationTableRow[]>(() => {
    const units = this.units();
    const columns = this.observationColumns();

    return units.map(unit => {
      const row: ObservationTableRow = { unitId: unit.unitId };

      if (unit.bands.length > 0) {
        const band = unit.bands[0];
        columns.forEach(col => {
          row[col.columnId] = band.observations[col.columnId] ?? null;
        });
      }

      return row;
    });
  });

  // Computed values
  protected readonly hasObservationData = computed(() => this.units().length > 0);
  protected readonly isFormValid = computed(() => {
    const formValid = this.filterForm.valid;
    const hasData = this.hasObservationData();
    return formValid && hasData;
  });
  protected readonly selectedTestBatchWorksheet = signal<TestBatchWorksheet | undefined>(undefined);
  protected readonly selectedTestId = signal<TestIdOption | undefined>(undefined);
  protected readonly selectedTestType = signal<TestTypeOption | undefined>(undefined);
  protected readonly selectedResultInterpretation = signal<ResultInterpretation | undefined>(undefined);

  // Forms
  filterForm!: FormGroup;
  get resultInterpretationControl(): FormControl {
    return this.filterForm.get('resultInterpretationCode') as FormControl;
  }
  observationForms: Map<string, FormGroup> = new Map();

  // Page header configuration
  pageHeaderConfig: PageHeaderConfig = this.getPageHeaderConfig();

  private getPageHeaderConfig(): PageHeaderConfig {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const title = menuItem?.label || 'Enter Test Observations: Tech 1';
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null },
      ],
    };
  }

  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();
    this.setupFormListeners();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      testBatchWorksheetId: ['', Validators.required],
      testId: ['', Validators.required],
      description: [{ value: '', disabled: true }],
      testTypeId: ['', Validators.required],
      testTypeDescription: [{ value: '', disabled: true }],
      controlValue: [{ value: '', disabled: true }],
      resultInterpretationCode: [''],
    });
  }

  private setupFormListeners(): void {
    // Load tests when test batch worksheet changes
    this.filterForm.get('testBatchWorksheetId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tbId) => {
        const selected = this.testBatchWorksheets().find((item) => item.id === tbId);
        this.selectedTestBatchWorksheet.set(selected);
        if (tbId) {
          this.loadTestsForBatch(tbId);
        } else {
          this.testIds.set([]);
          this.filteredTestIds = [];
        }
        this.filterForm.patchValue({ testId: '', testTypeId: '', resultInterpretationCode: '' }, { emitEvent: false });
        this.selectedTestId.set(undefined);
        this.selectedTestType.set(undefined);
        this.selectedResultInterpretation.set(undefined);
      });

    // Load test types when test ID changes
    this.filterForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((testId) => {
        const selected = this.testIds().find((item) => item.id === testId);
        this.selectedTestId.set(selected);
        if (testId) {
          this.loadTestTypes(testId);
          this.loadResultCodes(testId);
          this.loadBandValues(testId);
        } else {
          this.testTypes.set([]);
          this.filteredTestTypes = [];
          this.resultInterpretations.set([]);
          this.bandValues.set([]);
        }
        this.filterForm.patchValue({ testTypeId: '', resultInterpretationCode: '' }, { emitEvent: false });
        this.selectedTestType.set(undefined);
        this.selectedResultInterpretation.set(undefined);
      });

    // Update selected test type
    this.filterForm.get('testTypeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        const selected = this.testTypes().find((item) => item.id === id);
        this.selectedTestType.set(selected);
      });

    // Update selected result interpretation
    this.filterForm.get('resultInterpretationCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        const selected = this.resultInterpretations().find((item) => item.code === code);
        this.selectedResultInterpretation.set(selected);
      });

    // Load observation data when all required filters are selected
    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const { testBatchWorksheetId, testId, testTypeId } = this.filterForm.value;
      if (testBatchWorksheetId && testId && testTypeId) {
        this.loadObservationData();
      }
    });
  }

  private setupSearchFilters(): void {
    // Filter test batch worksheets based on search input
    this.testBatchSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTestBatchWorksheets();
      });

    // Filter test IDs based on search input
    this.testIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTestIds();
      });

    // Filter test types based on search input
    this.testTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterTestTypes();
      });
  }

  private filterTestBatchWorksheets(): void {
    const searchValue = this.testBatchSearchControl.value?.toLowerCase() || '';
    if (!searchValue) {
      this.filteredTestBatchWorksheets = this.testBatchWorksheets();
      return;
    }

    this.filteredTestBatchWorksheets = this.testBatchWorksheets().filter(
      (tb) => tb.displayName?.toLowerCase().includes(searchValue)
    );
  }

  private filterTestIds(): void {
    const searchValue = this.testIdSearchControl.value?.toLowerCase() || '';
    if (!searchValue) {
      this.filteredTestIds = this.testIds();
      return;
    }

    this.filteredTestIds = this.testIds().filter(
      (test) =>
        test.code.toLowerCase().includes(searchValue) ||
        test.description?.toLowerCase().includes(searchValue)
    );
  }

  private filterTestTypes(): void {
    const searchValue = this.testTypeSearchControl.value?.toLowerCase() || '';
    if (!searchValue) {
      this.filteredTestTypes = this.testTypes();
      return;
    }

    this.filteredTestTypes = this.testTypes().filter(
      (type) =>
        type.code.toLowerCase().includes(searchValue) ||
        type.description?.toLowerCase().includes(searchValue)
    );
  }

  loadInitialData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .loadInitialOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.testBatchWorksheets.set(response.testBatchWorksheets);
          this.filteredTestBatchWorksheets = response.testBatchWorksheets;
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading initial data:', error);
          this.error.set('Failed to load initial data. Please try again.');
          this.loading.set(false);
          this.snackbarService.showError('Failed to load initial data. Please try again.');
        },
      });
  }

  private loadTestsForBatch(tbId: string): void {
    this.service
      .loadTestsForBatch(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.testIds.set(tests);
          this.filteredTestIds = tests;
        },
        error: (error) => {
          console.error('Error loading tests:', error);
          this.testIds.set([]);
          this.filteredTestIds = [];
          this.snackbarService.showError('Failed to load tests. Please try again.');
        },
      });
  }


  private loadTestTypes(testId: string): void {
    this.service
      .loadTestTypes(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (testTypes) => {
          this.testTypes.set(testTypes);
          this.filteredTestTypes = testTypes;
        },
        error: (error) => {
          console.error('Error loading test types:', error);
          this.testTypes.set([]);
          this.filteredTestTypes = [];
          this.snackbarService.showError('Failed to load test types. Please try again.');
        },
      });
  }

  private loadResultCodes(testId: string): void {
    console.log('Loading result codes for testId:', testId);
    this.service
      .loadResultCodes(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          console.log('Result codes loaded:', results);
          this.resultInterpretations.set(results);
        },
        error: (error) => {
          console.error('Error loading result codes:', error);
        },
      });
  }

  private loadBandValues(testId: string): void {
    this.service
      .loadBandValues(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (values) => {
          this.bandValues.set(values);
        },
        error: (error) => {
          console.error('Error loading band values:', error);
          this.bandValues.set([]);
        },
      });
  }

  private loadObservationData(): void {
    const { testBatchWorksheetId, testId, testTypeId } = this.filterForm.value;

    this.loadingObservations.set(true);
    this.error.set(null);

    this.service
      .loadObservationData(testBatchWorksheetId, testId, testTypeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.observationColumns.set(response.columns);
          this.units.set(response.units);
          this.selectedDescription.set(response.description || '');
          this.selectedTestTypeDescription.set(response.testTypeDescription || '');
          this.selectedControlValue.set(response.controlValue || '');

          // Initialize observation forms for each unit
          this.initObservationForms();

          this.loadingObservations.set(false);

          // Auto-select first unit and load its note
          if (response.units.length > 0) {
            this.selectedUnitId.set(response.units[0].unitId);
            this.loadNotes();
          }
        },
        error: (error) => {
          console.error('Error loading observation data:', error);
          this.error.set('Failed to load observation data. Please try again.');
          this.loadingObservations.set(false);
          this.snackbarService.showError('Failed to load observation data. Please try again.');
        },
      });
  }

  private initObservationForms(): void {
    this.observationForms.clear();

    this.units().forEach((unit) => {
      const formArray = this.fb.array(
        unit.bands.map((band) => this.createBandFormGroup(band))
      );
      const unitForm = this.fb.group({
        unitId: [unit.unitId],
        bands: formArray,
        resultInterpretation: [unit.tempResult1 || ''],
      });
      this.observationForms.set(unit.unitId, unitForm);

      // Debug logging
      console.log(`Unit ${unit.unitId} - tempResult1:`, unit.tempResult1);
      console.log('Available result interpretations:', this.resultInterpretations());
    });
  }

  private createBandFormGroup(band: BandRow): FormGroup {
    const observationControls: { [key: string]: FormControl } = {};

    this.observationColumns().forEach((column) => {
      const value = band.observations[column.columnId] || '';
      observationControls[column.columnId] = this.fb.control(value || null);
    });

    return this.fb.group({
      bandId: [band.bandId],
      bandName: [band.bandName],
      isOtherBand: [band.isOtherBand || false],
      observations: this.fb.group(observationControls),
    });
  }

  getBandsFormArray(unitId: string): FormArray {
    const form = this.observationForms.get(unitId);
    return form?.get('bands') as FormArray;
  }

  getObservationControl(
    unitId: string,
    bandIndex: number,
    columnId: string
  ): FormControl {
    const bandsArray = this.getBandsFormArray(unitId);
    const bandGroup = bandsArray.at(bandIndex) as FormGroup;
    const observationsGroup = bandGroup.get('observations') as FormGroup;
    return observationsGroup.get(columnId) as FormControl;
  }

  getResultInterpretationControl(unitId: string): FormControl {
    const form = this.observationForms.get(unitId);
    return form?.get('resultInterpretation') as FormControl;
  }

  getResultInterpretationDescription(unitId: string): string {
    const control = this.getResultInterpretationControl(unitId);
    if (!control) return '';
    const code = control.value;
    if (!code) return '';
    const result = this.resultInterpretations().find(r => r.code === code);
    return result?.description || '';
  }

  // Helper to get result interpretation display for template
  getResultInterpretationDisplay(unitId: string): { code: string; description: string } {
    const control = this.getResultInterpretationControl(unitId);
    const code = control?.value || '';
    const description = this.getResultInterpretationDescription(unitId);
    return { code, description };
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPasteNumbers(event: ClipboardEvent, control: FormControl): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '');
    control.setValue(numericOnly.substring(0, 10)); // Respect maxLength
  }

  openAdditionalBandsDialog(unitId: string): void {
    const unit = this.units().find((u) => u.unitId === unitId);
    if (!unit) return;

    const { testBatchWorksheetId, testId } = this.filterForm.value;

    const dialogData: AdditionalBandsDialogData = {
      unitId,
      columns: this.observationColumns(),
      existingBands: unit.bands.filter((b) => b.isOtherBand),
      tbId: testBatchWorksheetId,
      testId,
      tbSeqNo: '1',
    };

    const dialogRef = this.dialog.open(AdditionalBandsDialogComponent, {
      width: '710px',
      height: '100vh',
      maxWidth: '100vw',
      data: dialogData,
      disableClose: true,
      panelClass: 'right-side-panel-dialog',
      position: { right: '0', top: '0' },
    });

    dialogRef.afterClosed().subscribe((result: AdditionalBandsDialogResult) => {
      if (result && result.action === 'save' && result.bands) {
        this.addAdditionalBands(unitId, result.bands);
      }
    });
  }

  private addAdditionalBands(unitId: string, newBands: BandRow[]): void {
    // Update units signal
    const updatedUnits = this.units().map((unit) => {
      if (unit.unitId === unitId) {
        // Remove old "other bands" and add new ones
        const baseBands = unit.bands.filter((b) => !b.isOtherBand);
        return {
          ...unit,
          bands: [...baseBands, ...newBands],
        };
      }
      return unit;
    });
    this.units.set(updatedUnits);

    // Update form array
    const bandsArray = this.getBandsFormArray(unitId);
    // Remove old "other bands" from form
    for (let i = bandsArray.length - 1; i >= 0; i--) {
      const bandGroup = bandsArray.at(i) as FormGroup;
      if (bandGroup.get('isOtherBand')?.value) {
        bandsArray.removeAt(i);
      }
    }
    // Add new bands to form
    newBands.forEach((band) => {
      bandsArray.push(this.createBandFormGroup(band));
    });
  }

  onSave(): void {
    if (!this.isFormValid()) {
      this.snackbarService.showError('Please fill in all required fields.');
      return;
    }

    this.performSave([]);
  }

  private showWarningDialog(
    title: string,
    warnings: { code: string; message: string }[],
    callback: (override: boolean, codes: string[]) => void
  ): void {
    const dialogRef = this.dialog.open(BandValuesWarningDialogComponent, {
      width: '560px',
      disableClose: true,
      autoFocus: true,
      data: {
        title,
        warnings,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: any) => {
        if (result) {
          callback(result.override, result.codes);
        } else {
          callback(false, []);
        }
      });
  }

  private performSave(overrideCodes: string[]): void {
    this.saving.set(true);

    const unitObservations: UnitObservationData[] = [];
    this.observationForms.forEach((form, unitId) => {
      const bandsArray = form.get('bands') as FormArray;
      const resultInterpretation = form.get('resultInterpretation')?.value || '';
      const bands: BandRow[] = bandsArray.controls.map((control) => {
        const bandGroup = control as FormGroup;
        const observationsGroup = bandGroup.get('observations') as FormGroup;
        return {
          bandId: bandGroup.get('bandId')?.value,
          bandName: bandGroup.get('bandName')?.value,
          unitId,
          observations: observationsGroup.value,
          isOtherBand: bandGroup.get('isOtherBand')?.value,
        };
      });
      unitObservations.push({
        unitId,
        bands,
        tempResult1: resultInterpretation,
      });
    });

    const saveRequest = {
      testBatchWorksheetId: this.filterForm.value.testBatchWorksheetId,
      testId: this.filterForm.value.testId,
      testTypeId: this.filterForm.value.testTypeId,
      overrideCodes,
      unitObservations,
    };

    this.service
      .saveObservations(saveRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const saveResult = response.data?.[0];
          if (saveResult?.status === 'WARNING' && saveResult.warnings?.length > 0) {
            this.saving.set(false);
            this.showWarningDialog('Save Validation Warnings', saveResult.warnings, (override, codes) => {
              if (override) {
                const newOverrides = [...new Set([...overrideCodes, ...codes])];
                this.performSave(newOverrides);
              }
            });
            return;
          }
          this.snackbarService.showSuccess('Observations saved successfully.');
          this.saving.set(false);
          this.loadObservationData();
        },
        error: (error) => {
          console.error('Error saving observations:', error);
          this.saving.set(false);
          this.snackbarService.showError('Failed to save observations. Please try again.');
        },
      });
  }

  onCancel(): void {
    this.filterForm.reset();
    this.observationForms.clear();
    this.units.set([]);
    this.observationColumns.set([]);
    this.selectedDescription.set('');
    this.selectedTestTypeDescription.set('');
    this.selectedControlValue.set('');
    this.notes.set(null);
    this.noteText.set('');
    this.editingNote.set(false);
  }

  // ── Notes methods ──

  onSelectUnit(unitId: string): void {
    this.selectedUnitId.set(unitId);
    this.editingNote.set(false);
    this.editNoteText.set('');
    this.noteText.set('');
    this.loadNotes();
  }

  loadNotes(): void {
    const { testBatchWorksheetId, testId } = this.filterForm.value;
    const unitId = this.selectedUnitId();
    if (!testBatchWorksheetId || !testId || !unitId) return;

    this.loadingNotes.set(true);
    this.service
      .loadNote(testBatchWorksheetId, testId, unitId, '1')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (note) => {
          this.notes.set(note);
          this.loadingNotes.set(false);
        },
        error: () => {
          this.notes.set(null);
          this.loadingNotes.set(false);
        },
      });
  }

  onAddNote(): void {
    const text = this.noteText().trim();
    if (!text) return;

    const { testBatchWorksheetId, testId } = this.filterForm.value;
    const unitId = this.selectedUnitId();
    if (!testBatchWorksheetId || !testId || !unitId) return;

    this.savingNote.set(true);
    const request: SaveNoteRequest = {
      tbId: testBatchWorksheetId,
      testId,
      unitId,
      tbSeqNo: 1,
      note: text,
    };

    this.service
      .saveNote(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.noteText.set('');
          this.savingNote.set(false);
          this.loadNotes();
        },
        error: () => {
          this.savingNote.set(false);
        },
      });
  }

  onEditNote(): void {
    this.editingNote.set(true);
    this.editNoteText.set(this.notes()?.note || '');
  }

  onCancelEditNote(): void {
    this.editingNote.set(false);
    this.editNoteText.set('');
  }

  onSaveEditNote(): void {
    const text = this.editNoteText().trim();
    if (!text) return;

    const { testBatchWorksheetId, testId } = this.filterForm.value;
    const unitId = this.selectedUnitId();
    const currentNote = this.notes();
    if (!testBatchWorksheetId || !testId || !unitId) return;

    this.savingNote.set(true);
    const request: SaveNoteRequest = {
      tbId: testBatchWorksheetId,
      testId,
      unitId,
      tbSeqNo: 1,
      noteId: currentNote?.noteId,
      note: text,
    };

    this.service
      .saveNote(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.editingNote.set(false);
          this.editNoteText.set('');
          this.savingNote.set(false);
          this.loadNotes();
        },
        error: () => {
          this.savingNote.set(false);
        },
      });
  }

  onDeleteNote(): void {
    const currentNote = this.notes();
    if (!currentNote?.noteId) return;

    this.deletingNote.set(true);
    this.service
      .deleteNote(String(currentNote.noteId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notes.set(null);
          this.deletingNote.set(false);
        },
        error: () => {
          this.deletingNote.set(false);
        },
      });
  }

  onNoteTextChange(event: Event): void {
    this.noteText.set((event.target as HTMLTextAreaElement).value);
  }

  onEditNoteTextChange(event: Event): void {
    this.editNoteText.set((event.target as HTMLTextAreaElement).value);
  }

  get f() {
    return this.filterForm.controls;
  }
}
