import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

import { MultipleObservationReconciliationApiService } from './services/multiple-observation-reconciliation-api.service';
import {
  TestDropdownDto,
  WorksheetDropdownDto,
  PendingTestDto,
  TestBandResponseDto,
  BandDetailDto,
  OtherBandDto,
  OtherBandCompositeRow,
  ValidResultDto,
  ValidInterpretationDto,
  ValidTestBandDto,
  NoteDto,
} from './models/multiple-observation-reconciliation.model';

@Component({
  selector: 'app-multiple-observation-reconciliation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './multiple-observation-reconciliation.html',
  styleUrl: './multiple-observation-reconciliation.scss',
})
export class MultipleObservationReconciliationComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(MultipleObservationReconciliationApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = { breadcrumbs: [], title: '', subtitle: '' };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'Use this screen to reconcile discrepancies in manually entered multiple observation results by accessing records through the worksheet ID.',
        };
      }
    });
  }

  // Filter form — Worksheet-first flow
  filterForm: FormGroup = this.fb.group({
    worksheetId: ['', Validators.required],
    testId: ['', Validators.required],
  });

  worksheetSearchCtrl = new FormControl('');
  testIdSearchCtrl = new FormControl('');

  worksheets = signal<WorksheetDropdownDto[]>([]);
  tests = signal<TestDropdownDto[]>([]);
  worksheetSearch = signal('');
  testIdSearch = signal('');
  isLoadingWorksheets = false;
  isLoadingTests = false;

  filteredWorksheets = computed(() => {
    const options = this.worksheets();
    const q = this.worksheetSearch().toLowerCase();
    return q ? options.filter(o => o.tbId?.toLowerCase().includes(q)) : options;
  });

  filteredTests = computed(() => {
    const options = this.tests();
    const q = this.testIdSearch().toLowerCase();
    return q ? options.filter(o => o.testId?.toLowerCase().includes(q) || o.testDesc?.toLowerCase().includes(q)) : options;
  });

  // Pending tests (units list)
  isLoading = false;
  hasSearched = false;
  pendingTests = signal<PendingTestDto[]>([]);
  selectedUnit = signal<PendingTestDto | null>(null);
  reconciledUnits = signal<Set<string>>(new Set());

  // Test details for selected unit
  testDetails = signal<TestBandResponseDto | null>(null);
  isLoadingDetails = false;

  // Observation bands
  isObservationEditMode = signal(false);
  observationEditRows: BandDetailDto[] = [];
  observationSearch = new FormControl('');
  filteredBandDetails = signal<BandDetailDto[]>([]);
  savingObservations = signal(false);

  // Other bands
  isOtherBandsEditMode = signal(false);
  otherBandCompositeRows = signal<OtherBandCompositeRow[]>([]);
  otherBandsEditRows: OtherBandCompositeRow[] = [];
  otherBandsSearch = new FormControl('');
  filteredOtherBands = signal<OtherBandCompositeRow[]>([]);
  savingOtherBands = signal(false);
  validTestBands = signal<ValidTestBandDto[]>([]);

  // Result — band values dropdown (for Sup column)
  validResults = signal<ValidResultDto[]>([]);
  // Result — interpretations dropdown (for Result selector)
  validInterpretations = signal<ValidInterpretationDto[]>([]);
  resultCodeCtrl = new FormControl('');
  selectedResultCode = signal('');
  resultDescription = computed(() => {
    const code = this.selectedResultCode();
    return this.validInterpretations().find(r => r.result === code)?.resultDesc ?? '';
  });

  // Notes
  notesText = '';
  noteData = signal<NoteDto | null>(null);
  editingNoteId = signal<number | null>(null);

  // Commit
  savingCommit = signal(false);
  private suppressAutoReconcile = false;

  ngOnInit(): void {
    this.loadWorksheets();

    this.worksheetSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe(v => this.worksheetSearch.set(v || ''));

    this.testIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe(v => this.testIdSearch.set(v || ''));

    // Worksheet selected → load tests for this worksheet
    this.filterForm.get('worksheetId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((worksheetId: string) => {
        this.filterForm.patchValue({ testId: '' }, { emitEvent: false });
        this.tests.set([]);
        this.clearResults();
        if (worksheetId) {
          this.loadTests(worksheetId);
        }
      });

    // Test selected → load pending tests + valid results + valid interpretations
    this.filterForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((testId: string) => {
        this.clearResults();
        const worksheetId = this.filterForm.get('worksheetId')?.value;
        if (testId && worksheetId) {
          this.loadPendingTests(testId, worksheetId);
          this.loadValidResults(testId);
          this.loadValidInterpretations(testId);
        }
      });

    this.observationSearch.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => this.applyObservationFilter());

    this.otherBandsSearch.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => this.applyOtherBandsFilter());

    this.resultCodeCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.selectedResultCode.set(v || '');
        if (v && this.selectedUnit() && !this.suppressAutoReconcile) {
          this.autoReconcile(v);
        }
      });

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.reset({ worksheetId: '', testId: '' });
        this.clearResults();
        this.loadWorksheets();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSelectUnit(unit: PendingTestDto): void {
    this.selectedUnit.set(unit);
    this.loadTestDetails(unit);
  }

  // --- Observation bands edit ---
  onObservationEditMode(): void {
    const bands = this.filteredBandDetails();
    if (!bands.length) return;
    this.observationEditRows = bands.map(r => ({ ...r }));
    this.observationEditRows.forEach(row => {
      if (row.tech1BandVal && row.tech1BandVal === row.tech2BandVal && !row.superBandVal) {
        row.superBandVal = row.tech1BandVal;
      }
    });
    this.isObservationEditMode.set(true);
  }

  onObservationCancel(): void {
    this.isObservationEditMode.set(false);
    this.observationEditRows = [];
  }

  onObservationSave(): void {
    const unit = this.selectedUnit();
    const details = this.testDetails();
    if (!unit || !details) return;

    this.savingObservations.set(true);

    // Step 1: Save band values
    this.apiService.updateBandValues(unit.unitId, unit.tbId, unit.testId, unit.tbSeqNo, {
      bandValues: this.observationEditRows.map(r => ({
        bandName: r.bandName,
        superBandVal: r.superBandVal ?? null,
      })),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Step 2: Validate combination
          this.apiService.validateCombination({
            unitId: unit.unitId,
            tbId: unit.tbId,
            testId: unit.testId,
            tbSeqNo: unit.tbSeqNo,
            testType: details.testType ?? '',
            ctrlVal: details.ctrlVal ?? null,
          })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (valResponse) => {
                const valData = valResponse.item ?? (valResponse.data as any);
                if (valData?.isMatch) {
                  this.suppressAutoReconcile = true;
                  this.resultCodeCtrl.setValue(valData.calculatedInterpretation);
                  this.suppressAutoReconcile = false;
                } else {
                  this.snackbarService.showError('No matching band combination found.');
                }
                this.savingObservations.set(false);
                this.isObservationEditMode.set(false);
                this.snackbarService.showSuccess('Band values updated successfully.');
                this.loadTestDetails(unit);
              },
              error: () => {
                this.savingObservations.set(false);
                this.snackbarService.showError('Validation failed.');
              },
            });
        },
        error: (error) => {
          this.savingObservations.set(false);
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'Failed to save band values.'));
        },
      });
  }

  // --- Other detected bands edit ---
  onOtherBandsEditMode(): void {
    this.otherBandsEditRows = this.otherBandCompositeRows().map(r => ({ ...r }));
    this.isOtherBandsEditMode.set(true);
  }

  onOtherBandsCancel(): void {
    this.isOtherBandsEditMode.set(false);
    this.otherBandsEditRows = [];
  }

  onOtherBandsSave(): void {
    const unit = this.selectedUnit();
    const details = this.testDetails();
    if (!unit || !details) return;

    this.savingOtherBands.set(true);
    const supBands = this.otherBandsEditRows
      .filter(r => r.supBand1 || r.supBand2)
      .map(r => ({ band1: r.supBand1 || null, band2: r.supBand2 || null }));

    this.apiService.saveOtherBands({
      unitId: unit.unitId,
      tbId: unit.tbId,
      testId: unit.testId,
      tbSeqNo: unit.tbSeqNo,
      collDate: (details as any).collDate ?? undefined,
      otherBands: supBands,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.savingOtherBands.set(false);
          this.isOtherBandsEditMode.set(false);
          this.snackbarService.showSuccess('Other bands saved successfully.');
          this.loadOtherBands(unit);
        },
        error: (error) => {
          this.savingOtherBands.set(false);
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'Failed to save other bands.'));
        },
      });
  }

  onAddOtherBandRow(): void {
    this.otherBandsEditRows = [...this.otherBandsEditRows, {
      tech1Band1: '', tech1Band2: '', tech2Band1: '', tech2Band2: '', supBand1: '', supBand2: '',
    }];
  }

  // --- Reconcile per unit (auto-save on dropdown selection) ---
  private autoReconcile(superIntp: string): void {
    const unit = this.selectedUnit();
    if (!unit || !superIntp) return;

    this.apiService.reconcileTest(unit.unitId, unit.tbId, unit.testId, unit.tbSeqNo, { superIntp })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.reconciledUnits.update(set => {
            const newSet = new Set(set);
            newSet.add(unit.unitId);
            return newSet;
          });
          this.snackbarService.showSuccess('Test reconciled successfully.');
        },
        error: (error) => {
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'Failed to reconcile.'));
        },
      });
  }

  // --- Commit all ---
  onCommitAll(): void {
    const worksheetId = this.filterForm.get('worksheetId')?.value;
    const testId = this.filterForm.get('testId')?.value;
    if (!worksheetId || !testId) return;

    const units = this.pendingTests()
      .filter(u => this.reconciledUnits().has(u.unitId))
      .map(u => ({ tbSeqNo: u.tbSeqNo, unitId: u.unitId, supervisorResult: '' }));

    if (units.length === 0) {
      this.snackbarService.showError('No units have been reconciled yet.');
      return;
    }

    this.savingCommit.set(true);
    this.apiService.commitReconciliation({
      tbId: worksheetId,
      testId,
      antigenFlag: 'N',
      units,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.savingCommit.set(false);
          this.snackbarService.showSuccess('Reconciliation committed successfully.');
          this.clearResults();
          this.filterForm.reset({ worksheetId: '', testId: '' });
          this.loadWorksheets();
        },
        error: (error) => {
          this.savingCommit.set(false);
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'Failed to commit reconciliation.'));
        },
      });
  }

  // --- Notes ---
  onAddNote(): void {
    const unit = this.selectedUnit();
    if (!unit || !this.notesText.trim()) return;

    this.apiService.saveNote({
      tbId: unit.tbId,
      testId: unit.testId,
      unitId: unit.unitId,
      tbSeqNo: unit.tbSeqNo,
      noteId: null,
      note: this.notesText.trim(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notesText = '';
          this.snackbarService.showSuccess('Note added successfully.');
          this.loadNote(unit);
        },
        error: () => this.snackbarService.showError('Failed to add note.'),
      });
  }

  onEditNote(): void {
    const note = this.noteData();
    if (!note) return;
    this.editingNoteId.set(note.noteId ?? null);
    this.notesText = note.note ?? '';
  }

  onUpdateNote(): void {
    const unit = this.selectedUnit();
    const noteId = this.editingNoteId();
    if (!unit || !this.notesText.trim()) return;

    this.apiService.saveNote({
      tbId: unit.tbId,
      testId: unit.testId,
      unitId: unit.unitId,
      tbSeqNo: unit.tbSeqNo,
      noteId: noteId,
      note: this.notesText.trim(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editingNoteId.set(null);
          this.notesText = '';
          this.snackbarService.showSuccess('Note updated successfully.');
          this.loadNote(unit);
        },
        error: () => this.snackbarService.showError('Failed to update note.'),
      });
  }

  onDeleteNote(): void {
    const note = this.noteData();
    if (!note?.noteId) return;

    this.apiService.deleteNote(note.noteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.noteData.set(null);
          this.notesText = '';
          this.snackbarService.showSuccess('Note deleted successfully.');
        },
        error: () => this.snackbarService.showError('Failed to delete note.'),
      });
  }

  displayValue(value: string | number | null | undefined): string {
    if (value == null || value === '') return '-';
    return String(value);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  formatDate(isoDate: string | undefined): string {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }

  // --- Private ---
  private loadWorksheets(): void {
    this.isLoadingWorksheets = true;
    this.apiService.getWorksheetsDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingWorksheets = false;
          if (response.success) this.worksheets.set(response.data ?? []);
        },
        error: () => { this.isLoadingWorksheets = false; },
      });
  }

  private loadTests(tbId: string): void {
    this.isLoadingTests = true;
    this.apiService.getTestsDropdown(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingTests = false;
          if (response.success) this.tests.set(response.data ?? []);
        },
        error: () => { this.isLoadingTests = false; },
      });
  }

  private loadValidResults(testId: string): void {
    this.apiService.getValidResults(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) this.validResults.set(response.data ?? []);
        },
        error: () => {},
      });
  }

  private loadValidInterpretations(testId: string): void {
    this.apiService.getValidInterpretations(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) this.validInterpretations.set(response.data ?? []);
        },
        error: () => {},
      });
  }

  private loadPendingTests(testId: string, tbId: string): void {
    this.isLoading = true;
    this.hasSearched = true;
    this.apiService.getPendingTests(testId, tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            const units = response.data ?? [];
            this.pendingTests.set(units);
            if (units.length > 0) this.onSelectUnit(units[0]);
          } else {
            this.pendingTests.set([]);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.pendingTests.set([]);
          this.snackbarService.showError(HttpErrorHandler.extractErrorMessage(error, 'Failed to load pending tests.'));
        },
      });
  }

  private loadTestDetails(unit: PendingTestDto): void {
    this.isLoadingDetails = true;
    this.apiService.getTestDetails(unit.unitId, unit.tbId, unit.testId, unit.tbSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingDetails = false;
          if (response.success && (response.item || response.data)) {
            const details = response.item ?? (response.data as unknown as TestBandResponseDto);
            this.testDetails.set(details);
            this.filteredBandDetails.set(details.bandDetails ?? []);
            this.suppressAutoReconcile = true;
            this.resultCodeCtrl.setValue(details.superIntp ?? '');
            this.suppressAutoReconcile = false;
            this.notesText = '';
            this.editingNoteId.set(null);
            this.loadNote(unit);
            if (details.otherBandsEnabled === 'Y' || details.otherBandsEnabled === true) {
              this.loadOtherBands(unit);
              if (details.testType) {
                this.loadValidTestBands(details.testId, details.testType);
              }
            } else {
              this.otherBandCompositeRows.set([]);
              this.filteredOtherBands.set([]);
              this.validTestBands.set([]);
            }
          } else {
            this.testDetails.set(null);
          }
        },
        error: () => {
          this.isLoadingDetails = false;
          this.testDetails.set(null);
        },
      });
  }

  private loadNote(unit: PendingTestDto): void {
    this.noteData.set(null);
    this.apiService.getNote(unit.tbId, unit.testId, unit.unitId, unit.tbSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const raw = response.item ?? response.data;
          const note: NoteDto | null = Array.isArray(raw) ? (raw[0] ?? null) : (raw as NoteDto) ?? null;
          this.noteData.set(note);
        },
        error: () => this.noteData.set(null),
      });
  }

  private loadOtherBands(unit: PendingTestDto): void {
    this.apiService.getOtherBands(unit.unitId, unit.tbId, unit.testId, unit.tbSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const bands = response.data ?? [];
          this.buildOtherBandCompositeRows(Array.isArray(bands) ? bands : [bands as unknown as OtherBandDto]);
        },
        error: () => {
          this.otherBandCompositeRows.set([]);
          this.filteredOtherBands.set([]);
        },
      });
  }

  private loadValidTestBands(testId: string, testType: string): void {
    this.apiService.getValidTestBands(testId, testType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.data ?? [];
          this.validTestBands.set(Array.isArray(data) ? data : []);
        },
        error: () => this.validTestBands.set([]),
      });
  }

  private buildOtherBandCompositeRows(otherBands: OtherBandDto[]): void {
    const tech1 = otherBands.filter(b => b.tech === '1');
    const tech2 = otherBands.filter(b => b.tech === '2');
    const sup = otherBands.filter(b => b.tech === 'S');
    const maxRows = Math.max(tech1.length, tech2.length, sup.length);

    const rows: OtherBandCompositeRow[] = [];
    for (let i = 0; i < maxRows; i++) {
      rows.push({
        tech1Band1: tech1[i]?.band1 ?? '',
        tech1Band2: tech1[i]?.band2 ?? '',
        tech2Band1: tech2[i]?.band1 ?? '',
        tech2Band2: tech2[i]?.band2 ?? '',
        supBand1: sup[i]?.band1 ?? '',
        supBand2: sup[i]?.band2 ?? '',
      });
    }
    this.otherBandCompositeRows.set(rows);
    this.filteredOtherBands.set(rows);
  }

  private clearResults(): void {
    this.pendingTests.set([]);
    this.selectedUnit.set(null);
    this.testDetails.set(null);
    this.filteredBandDetails.set([]);
    this.filteredOtherBands.set([]);
    this.otherBandCompositeRows.set([]);
    this.isObservationEditMode.set(false);
    this.isOtherBandsEditMode.set(false);
    this.validTestBands.set([]);
    this.notesText = '';
    this.noteData.set(null);
    this.editingNoteId.set(null);
    this.reconciledUnits.set(new Set());
    this.hasSearched = false;
  }

  private applyObservationFilter(): void {
    const search = (this.observationSearch.value || '').toLowerCase();
    const rows = this.testDetails()?.bandDetails ?? [];
    this.filteredBandDetails.set(!search ? rows : rows.filter(r => r.bandName?.toLowerCase().includes(search)));
  }

  private applyOtherBandsFilter(): void {
    const search = (this.otherBandsSearch.value || '').toLowerCase();
    const rows = this.otherBandCompositeRows();
    this.filteredOtherBands.set(!search ? rows : rows.filter(r =>
      r.tech1Band1?.toLowerCase().includes(search) || r.tech1Band2?.toLowerCase().includes(search) ||
      r.tech2Band1?.toLowerCase().includes(search) || r.tech2Band2?.toLowerCase().includes(search) ||
      r.supBand1?.toLowerCase().includes(search) || r.supBand2?.toLowerCase().includes(search),
    ));
  }
}
