import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Subject, forkJoin, lastValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { VerifyTestObservationsTech2ApiService } from './services/verify-test-observations-tech2-api.service';
import {
  WorksheetDto,
  TestDto,
  TestBandDto,
  PendingUnitDto,
  UnitRowViewModel,
  NoteDto,
  NoteResponseDto,
  VerifyResultsRequestDto,
  BandResultDto,
  BandResultLookupDto,
  TestTypeMetadataDto,
  TestTypeDto,
  ApiResponse,
  ControlValueDto,
  CreateNoteRequestDto,
  ClearVerificationRequestDto,
} from './models/verify-test-observations-tech2.model';
import { AdditionalBandsDialogComponent } from './components/additional-bands-dialog/additional-bands-dialog';

@Component({
  selector: 'app-verify-test-observations-tech2',
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
  templateUrl: './verify-test-observations-tech2.html',
  styleUrls: ['./verify-test-observations-tech2.scss']
})
export class VerifyTestObservationsTech2Component implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `verify-test-observations-tech2-${VerifyTestObservationsTech2Component.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(VerifyTestObservationsTech2ApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  private destroy$ = new Subject<void>();

  protected readonly worksheets = signal<WorksheetDto[]>([]);
  protected readonly tests = signal<TestDto[]>([]);
  protected readonly testBands = signal<TestBandDto[]>([]);
  protected readonly pendingUnits = signal<PendingUnitDto[]>([]);
  protected readonly unitRows = signal<UnitRowViewModel[]>([]);
  readonly selectedUnit = signal<UnitRowViewModel | null>(null);
  protected readonly note = signal<NoteDto | null>(null);

  protected readonly bandResultOptions = signal<BandResultLookupDto[]>([]);
  protected readonly controlValues = signal<ControlValueDto[]>([]);
  protected readonly testTypeMetadata = signal<TestTypeMetadataDto | null>(null);

  protected readonly testTypes = signal<TestTypeDto[]>([]);

  protected readonly loadingWorksheets = signal<boolean>(false);
  protected readonly loadingTests = signal<boolean>(false);
  protected readonly loadingTestTypes = signal<boolean>(false);
  protected readonly loadingBands = signal<boolean>(false);
  protected readonly loadingUnits = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal<boolean>(false);

  protected readonly editingNoteId = signal<string | null>(null);

  protected readonly worksheetSearchCtrl = new FormControl('');
  protected readonly testIdSearchCtrl = new FormControl('');
  protected filteredWorksheets: WorksheetDto[] = [];
  protected filteredTests: TestDto[] = [];

  protected readonly selectedTest = computed(() => {
    const testId = this.filterForm.get('testId')?.value;
    return this.tests().find(t => t.testId === testId) || null;
  });

  protected readonly bandColumns = computed(() => {
    return this.testBands().map(band => band.bandName);
  });

  protected readonly displayedColumns = computed(() => {
    return ['unitId', ...this.bandColumns(), 'tempResult2', 'resultInterpretation', 'description'];
  });

  protected readonly isReady = computed(() =>
    !this.loading() &&
    !this.loadingWorksheets() &&
    !this.error()
  );

  protected readonly hasObservationData = computed(() =>
    this.unitRows().length > 0 && this.testBands().length > 0
  );

  private readonly MIN_DISPLAY_ROWS = 9;

  protected readonly displayRows = computed<(UnitRowViewModel | null)[]>(() => {
    const rows = this.unitRows();
    const padCount = Math.max(0, this.MIN_DISPLAY_ROWS - rows.length);
    return [...rows, ...new Array(padCount).fill(null)];
  });

  protected readonly canSave = computed(() => {
    return this.unitRows().length > 0 &&
           this.testBands().length > 0 &&
           this.isReady();
  });

  protected readonly showOtherBandsButton = computed(() => {
    const meta = this.testTypeMetadata();
    return meta?.othBnd === 'Y';
  });

  protected readonly canOverrideResult = computed(() => {
    const meta = this.testTypeMetadata();
    return meta?.resUpdate !== 'N';
  });

  protected readonly controlValueEditable = computed(() => {
    const meta = this.testTypeMetadata();
    return meta != null && meta.defaultControlValue == null;
  });

  filterForm!: FormGroup;
  notesForm!: FormGroup;
  observationForm!: FormGroup;

  headerConfig: PageHeaderConfig = this.getPageHeaderConfig();

  private getPageHeaderConfig(): PageHeaderConfig {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    const title = menuItem?.label || 'Verify Test Observations: Tech 2';
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: title, link: null },
      ],
    };
  }

  ngOnInit(): void {
    this.initForms();
    this.setupFormListeners();
    this.setupSearchFilters();
    this.loadWorksheets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.filterForm = this.fb.group({
      worksheet: ['', [Validators.required]],
      testId: ['', [Validators.required]],
      testDescription: [{ value: '', disabled: true }],
      testType: ['', [Validators.required]],
      testTypeDescription: [{ value: '', disabled: true }],
      controlValue: [{ value: '', disabled: true }]
    });

    this.notesForm = this.fb.group({
      noteText: ['']
    });

    this.observationForm = this.fb.group({
      units: this.fb.array([])
    });
  }

  private setupSearchFilters(): void {
    this.worksheetSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterWorksheets());

    this.testIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.filterTests());
  }

  private filterWorksheets(): void {
    const search = this.worksheetSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredWorksheets = this.worksheets();
      return;
    }
    this.filteredWorksheets = this.worksheets().filter(
      ws => ws.tbId.toLowerCase().includes(search)
    );
  }

  private filterTests(): void {
    const search = this.testIdSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredTests = this.tests();
      return;
    }
    this.filteredTests = this.tests().filter(
      t => t.testId.toLowerCase().includes(search) ||
           t.testDesc?.toLowerCase().includes(search)
    );
  }

  private setupFormListeners(): void {
    this.filterForm.get('worksheet')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tbId => {
        if (tbId) {
          this.loadTests(tbId);
        } else {
          this.tests.set([]);
          this.filteredTests = [];
          this.resetTestFields();
        }
      });

    this.filterForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(testId => {
        const test = this.tests().find(t => t.testId === testId);
        if (test) {
          this.filterForm.patchValue({
            testDescription: test.testDesc,
            testType: '',
            testTypeDescription: ''
          }, { emitEvent: false });

          this.loadTestTypes(test.testId);
        } else {
          this.testTypes.set([]);
          this.resetTestFields();
        }
      });

    this.filterForm.get('testType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(testType => {
        const testId = this.filterForm.get('testId')?.value;
        const tbId = this.filterForm.get('worksheet')?.value;

        if (testId && testType) {
          this.loadTestTypeMetadata(testId, testType);
          this.loadBandResultOptions(testId);
          this.loadControlValues(testId);
          if (tbId) {
            this.loadBandsAndUnits(testId, testType, tbId);
          }
        } else {
          this.testTypeMetadata.set(null);
          this.bandResultOptions.set([]);
          this.controlValues.set([]);
          this.testBands.set([]);
          this.pendingUnits.set([]);
          this.unitRows.set([]);
        }
      });
  }

  private resetTestFields(): void {
    this.filterForm.patchValue({
      testDescription: '',
      testType: '',
      testTypeDescription: '',
      controlValue: ''
    }, { emitEvent: false });

    this.testBands.set([]);
    this.pendingUnits.set([]);
    this.unitRows.set([]);
    this.bandResultOptions.set([]);
    this.controlValues.set([]);
    this.testTypes.set([]);
    this.testTypeMetadata.set(null);
    this.note.set(null);
  }

  private loadBandResultOptions(testId: string): void {
    this.apiService.getBandResults(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.bandResultOptions.set(data),
        error: () => this.bandResultOptions.set([])
      });
  }

  private loadControlValues(testId: string): void {
    this.apiService.getControlValues(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.controlValues.set(data),
        error: () => this.controlValues.set([])
      });
  }

  private loadTestTypeMetadata(testId: string, testType: string): void {
    this.apiService.getTestTypeMetadata(testId, testType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.testTypeMetadata.set(data);
          if (data?.defaultControlValue) {
            this.filterForm.patchValue({ controlValue: data.defaultControlValue }, { emitEvent: false });
            this.filterForm.get('controlValue')?.disable();
          } else if (data) {
            this.filterForm.get('controlValue')?.enable();
          }
        },
        error: () => this.testTypeMetadata.set(null)
      });
  }

  loadWorksheets(): void {
    this.loadingWorksheets.set(true);
    this.error.set(null);

    this.apiService.getWorksheets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.worksheets.set(data);
          this.filteredWorksheets = data;
          this.loadingWorksheets.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load worksheets');
          this.loadingWorksheets.set(false);
          this.snackbarService.showError(this.error()!);
        }
      });
  }

  private loadTests(tbId: string): void {
    this.loadingTests.set(true);
    this.error.set(null);

    this.apiService.getTests(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tests.set(data);
          this.filteredTests = data;
          this.loadingTests.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load tests');
          this.loadingTests.set(false);
          this.snackbarService.showError(this.error()!);
        }
      });
  }

  private loadTestTypes(testId: string): void {
    this.loadingTestTypes.set(true);
    this.testTypes.set([]);

    this.apiService.getTestTypes(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.testTypes.set(data);
          this.loadingTestTypes.set(false);
        },
        error: () => {
          this.testTypes.set([]);
          this.loadingTestTypes.set(false);
        }
      });
  }

  private loadBandsAndUnits(testId: string, testType: string, tbId: string): void {
    this.loadingBands.set(true);
    this.loadingUnits.set(true);
    this.error.set(null);

    forkJoin({
      bands: this.apiService.getTestBands(testId, testType),
      units: this.apiService.getPendingUnits(tbId, testId)
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ bands, units }) => {
          this.testBands.set(bands);
          this.loadingBands.set(false);
          this.selectedUnit.set(null);
          this.pendingUnits.set(units);
          this.buildUnitRows(units);
          this.loadingUnits.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to load data');
          this.loadingBands.set(false);
          this.loadingUnits.set(false);
          this.snackbarService.showError(this.error()!);
        }
      });
  }

  private buildUnitRows(units: PendingUnitDto[]): void {
    const rows: UnitRowViewModel[] = units.map(unit => {
      const row: UnitRowViewModel = { ...unit };

      this.testBands().forEach(band => {
        const existingResult = unit.bandResults.find(br => br.bandSeq === band.bandSeq);
        row[band.bandName] = existingResult?.resultCode || '';
      });

      row.resultInterpretation = unit.resultInterpretation || '';
      row.description = unit.description || '';
      row.tempResult2 = '';
      row._originalBands = {};
      this.testBands().forEach(band => {
        row._originalBands![band.bandName] = row[band.bandName];
      });

      return row;
    });

    this.unitRows.set(rows);
  }

  getBandValue(row: UnitRowViewModel, bandName: string): string {
    return row[bandName] || '';
  }

  setBandValue(row: UnitRowViewModel, bandName: string, value: string): void {
    if (row.tempResult2 || row.resultInterpretation) {
      const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
        data: {
          title: 'Warning',
          message: 'Changing band values will clear the computed result. Continue?',
          confirmText: 'Yes',
          cancelText: 'No'
        }
      });

      dialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed) {
          row[bandName] = value;
          row.tempResult2 = '';
          row.resultInterpretation = '';
          this.updateUnitRows();
        }
      });
    } else {
      row[bandName] = value;
      this.updateUnitRows();
      this.checkAllBandsFilled(row);
    }
  }

  private checkAllBandsFilled(row: UnitRowViewModel): void {
    const allFilled = this.testBands().every(band => {
      const val = row[band.bandName];
      return val && val.trim() !== '';
    });

    if (allFilled) {
      const testId = this.filterForm.get('testId')?.value;
      const testType = this.filterForm.get('testType')?.value;
      const controlValue = this.filterForm.get('controlValue')?.value;

      if (testId && testType) {
        const bandResults: BandResultDto[] = this.testBands().map(band => ({
          bandSeq: band.bandSeq,
          bandName: band.bandName,
          resultCode: row[band.bandName] || ''
        }));

        this.apiService.validateCombination({ testId, testType, bandResults, controlValue })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (result) => {
              if (result.isMatch) {
                row.resultInterpretation = result.sysResult || '';
                row.description = result.sysResultDesc || '';
                if (this.canOverrideResult()) {
                  row.tempResult2 = result.sysResult || '';
                }
              }
              this.updateUnitRows();
            }
          });
      }
    }
  }

  selectUnit(row: UnitRowViewModel): void {
    this.selectedUnit.set(this.selectedUnit() === row ? null : row);
    if (this.selectedUnit()) {
      this.loadNotesForUnit(this.selectedUnit()!);
    }
  }

  private updateUnitRows(): void {
    this.unitRows.set([...this.unitRows()]);
  }

  onAddOtherBandResults(): void {
    const row = this.selectedUnit() || this.unitRows()[0];
    if (row) {
      this.openAdditionalBandsDialog(row);
    }
  }

  openAdditionalBandsDialog(row: UnitRowViewModel): void {
    const tbId = this.filterForm.get('worksheet')?.value;
    const testId = this.filterForm.get('testId')?.value;

    if (tbId && testId) {
      this.apiService.getOtherBands(tbId, testId, row.unitId, row.tbSeqNo)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (existingBands) => this.showAdditionalBandsDialog(row, existingBands),
          error: () => this.showAdditionalBandsDialog(row, row.additionalBands || [])
        });
    } else {
      this.showAdditionalBandsDialog(row, row.additionalBands || []);
    }
  }

  private showAdditionalBandsDialog(row: UnitRowViewModel, additionalBands: any[]): void {
    const tbId = this.filterForm.get('worksheet')?.value;
    const testId = this.filterForm.get('testId')?.value;
    const testType = this.filterForm.get('testType')?.value;

    const dialogRef = this.dialog.open(AdditionalBandsDialogComponent, {
      width: '710px',
      height: '100vh',
      maxWidth: '100vw',
      data: {
        unitId: row.unitId + (row.chkDigit ? '-' + row.chkDigit : ''),
        testBands: this.testBands(),
        additionalBands,
        tbId,
        testId,
        tbSeqNo: row.tbSeqNo,
        testType
      },
      disableClose: true,
      panelClass: 'right-side-panel-dialog',
      position: { right: '0', top: '0' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        row.additionalBands = result;
        this.updateUnitRows();
      }
    });
  }

  async onSave(): Promise<void> {
    if (!this.canSave()) {
      this.snackbarService.showError('Please fill in all required fields and band results.');
      return;
    }

    const tbId = this.filterForm.get('worksheet')?.value;
    const testId = this.filterForm.get('testId')?.value;
    const testType = this.filterForm.get('testType')?.value;
    const controlValue = this.filterForm.get('controlValue')?.value;

    if (!tbId || !testId) {
      this.snackbarService.showError('Worksheet and Test ID are required.');
      return;
    }

    this.saving.set(true);

    try {
      for (const row of this.unitRows()) {
        const bandResults: BandResultDto[] = this.testBands().map(band => ({
          bandSeq: band.bandSeq,
          bandName: band.bandName,
          resultCode: row[band.bandName] || ''
        })).filter(br => br.resultCode);

        if (bandResults.length === 0) continue;

        const request: VerifyResultsRequestDto = {
          tbId,
          testId,
          unitId: row.unitId,
          bandResults,
          tempResult2: row.tempResult2 || undefined,
          otherBands: row.additionalBands?.map((ab: any) => ({ band1: ab.band1, band2: ab.band2 })),
          testType,
          controlValue,
          tbSeqNo: row.tbSeqNo,
          confirmOverride: false
        };

        const existing = await lastValueFrom(this.apiService.checkExisting(tbId, testId, row.unitId, row.tbSeqNo));

        if (existing.hasExistingResult) {
          const confirmed = await this.showConfirmDialog(
            'Re-verify Unit',
            `Unit ${row.unitId} was already verified by ${existing.tempResult2UserId || 'another technician'}. Do you want to clear the existing verification and re-verify?`
          );
          if (!confirmed) {
            this.saving.set(false);
            return;
          }
          await lastValueFrom(this.apiService.clearVerification({
            tbId,
            testId,
            unitId: row.unitId,
            tbSeqNo: row.tbSeqNo,
          }));
        }

        const response = await lastValueFrom(this.apiService.verifyResults(request));

        if (!response.success && response.statusCode === 200 && response.errorCode === '9775') {
          const confirmed = await this.showConfirmDialog(
            'Result Override',
            response.message || 'Result differs from system calculation. Confirm to override.'
          );
          if (confirmed) {
            request.confirmOverride = true;
            await lastValueFrom(this.apiService.verifyResults(request));
          } else {
            this.saving.set(false);
            return;
          }
        } else if (!response.success) {
          this.snackbarService.showError(response.message || 'Failed to verify unit results');
          this.saving.set(false);
          return;
        }

        if (response.errorCode === '8012') {
          this.snackbarService.showSuccess(`Unit ${row.unitId}: Mismatch detected — flagged for supervisor reconciliation.`);
        }
      }

      this.saving.set(false);
      this.snackbarService.showSuccess('All unit results verified successfully.');
      this.refreshPendingUnits(tbId, testId, testType!);
    } catch (err: any) {
      this.saving.set(false);
      this.snackbarService.showError(err.error?.message || 'Failed to verify unit results');
    }
  }

  private showConfirmDialog(title: string, message: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: { title, message, confirmText: 'Confirm', cancelText: 'Cancel' }
    });
    return lastValueFrom(dialogRef.afterClosed());
  }

  private refreshPendingUnits(tbId: string, testId: string, testType: string): void {
    this.note.set(null);
    this.editingNoteId.set(null);
    this.notesForm.reset();
    this.selectedUnit.set(null);

    this.loadingUnits.set(true);
    this.apiService.getPendingUnits(tbId, testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.pendingUnits.set(units);
          this.buildUnitRows(units);
          this.loadingUnits.set(false);
        },
        error: () => {
          this.pendingUnits.set([]);
          this.unitRows.set([]);
          this.loadingUnits.set(false);
        }
      });
  }

  onCancel(): void {
    this.clearForm();
  }

  private clearForm(): void {
    this.filterForm.reset();
    this.notesForm.reset();
    this.tests.set([]);
    this.filteredTests = [];
    this.testBands.set([]);
    this.pendingUnits.set([]);
    this.unitRows.set([]);
    this.note.set(null);
    this.bandResultOptions.set([]);
    this.controlValues.set([]);
    this.testTypes.set([]);
    this.testTypeMetadata.set(null);
    this.editingNoteId.set(null);
  }

  // ── Notes ──

  private loadNotesForUnit(row: UnitRowViewModel): void {
    const tbId = this.filterForm.get('worksheet')?.value;
    const testId = this.filterForm.get('testId')?.value;
    if (!tbId || !testId) return;

    this.apiService.getNotes(tbId, testId, row.unitId, row.tbSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            const n = data[0];
            const currentUser = this.headerService.getCurrentUsername?.() || '';
            this.note.set({
              id: String(n.noteId),
              noteId: n.noteId,
              author: n.insertUser,
              version: '1.0',
              date: n.insertDate,
              content: n.note,
              canEdit: n.insertUser === currentUser,
              canDelete: n.insertUser === currentUser
            });
          } else {
            this.note.set(null);
          }
        },
        error: () => this.note.set(null)
      });
  }

  private getNoteRequestContext(): { tbId: string; testId: string; unitId: string; tbSeqNo: number } | null {
    const row = this.selectedUnit() || this.unitRows()[0];
    const tbId = this.filterForm.get('worksheet')?.value;
    const testId = this.filterForm.get('testId')?.value;
    if (!tbId || !testId || !row) return null;
    return { tbId, testId, unitId: row.unitId, tbSeqNo: row.tbSeqNo };
  }

  onAddNote(): void {
    const noteText = this.notesForm.get('noteText')?.value;
    if (!noteText || noteText.trim() === '') {
      this.snackbarService.showError('Please enter a note.');
      return;
    }

    const ctx = this.getNoteRequestContext();
    if (!ctx) return;

    const request: CreateNoteRequestDto = { ...ctx, note: noteText };

    this.apiService.createNote(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notesForm.get('noteText')?.reset();
          this.snackbarService.showSuccess('Note saved successfully.');
          this.loadNotesForUnit(this.selectedUnit() || this.unitRows()[0]);
        },
        error: (err) => this.snackbarService.showError(err.error?.message || 'Failed to save note')
      });
  }

  onEditNote(): void {
    const existing = this.note();
    if (!existing) return;
    this.editingNoteId.set(existing.id);
    this.notesForm.get('noteText')?.setValue(existing.content);
  }

  onCancelEditNote(): void {
    this.editingNoteId.set(null);
    this.notesForm.get('noteText')?.reset();
  }

  onUpdateNote(): void {
    const noteText = this.notesForm.get('noteText')?.value;
    if (!noteText || noteText.trim() === '') return;

    const ctx = this.getNoteRequestContext();
    if (!ctx) return;

    const request: CreateNoteRequestDto = { ...ctx, note: noteText };

    this.apiService.createNote(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editingNoteId.set(null);
          this.notesForm.get('noteText')?.reset();
          this.snackbarService.showSuccess('Note updated successfully.');
          this.loadNotesForUnit(this.selectedUnit() || this.unitRows()[0]);
        },
        error: (err) => this.snackbarService.showError(err.error?.message || 'Failed to update note')
      });
  }

  onDeleteNote(): void {
    const existing = this.note();
    if (!existing?.noteId) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      data: {
        title: 'Delete Note',
        message: 'Are you sure you want to delete this note?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && existing.noteId) {
        this.apiService.deleteNote(existing.noteId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.note.set(null);
              this.notesForm.get('noteText')?.reset();
              this.snackbarService.showSuccess('Note deleted successfully.');
            },
            error: (err) => this.snackbarService.showError(err.error?.message || 'Failed to delete note')
          });
      }
    });
  }

  get f() {
    return this.filterForm.controls;
  }
}
