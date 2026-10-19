import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';

import { EditTestObservationResultsApiService } from './services/edit-test-observation-results-api.service';
import {
  TestObservationDto,
  BandRow,
  NoteItem,
  DropdownOption,
  TestIdLookupDto,
  TestBatchLookupDto,
  SaveAllRequestDto,
  OtherTestBandDto,
} from './models/edit-test-observation-results.model';

@Component({
  selector: 'app-edit-test-observation-results',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './edit-test-observation-results.html',
  styleUrls: ['./edit-test-observation-results.scss'],
})
export class EditTestObservationResultsComponent implements OnInit, OnDestroy {
  @ViewChild('unitIdField') unitIdField?: UnitIdFieldComponent;

  private static nextId = 0;
  protected readonly componentId = `edit-test-obs-${EditTestObservationResultsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(EditTestObservationResultsApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

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
          subtitle: pageData.subtitle || 'Edit multiple test result observations',
        };
      }
    });
  }

  protected readonly loading = signal(false);
  protected readonly testData = signal<TestObservationDto | null>(null);
  protected readonly bandRows = signal<BandRow[]>([]);
  protected readonly notes = signal<NoteItem[]>([]);
  protected readonly systemMessage = signal<string | null>(null);
  protected readonly editingNoteId = signal<string | number | null>(null);

  // Additional Bands side panel
  protected readonly showAdditionalBands = signal(false);
  protected readonly otherBandsEnabled = signal(false);
  protected readonly hasSupervisorBands = signal(false);
  protected readonly canDeleteSupervisorBand = computed(() => this.otherBandsEnabled() && this.hasSupervisorBands());
  protected readonly otherBandRows = signal<{
    tech1Band1: string; tech1Band2: string;
    tech2Band1: string; tech2Band2: string;
    supBand1: string; supBand2: string;
  }[]>([]);

  protected readonly testIdOptions = signal<DropdownOption[]>([]);
  protected readonly testBatchIdOptions = signal<DropdownOption[]>([]);
  protected readonly sequenceNumberOptions = signal<DropdownOption[]>([]);
  protected readonly bandValueOptions = signal<DropdownOption[]>([]);
  protected readonly resultCodeOptions = signal<DropdownOption[]>([]);
  protected readonly editReasonOptions = signal<DropdownOption[]>([]);
  protected readonly resultDescription = signal('');
  protected readonly editReasonDescription = signal('');

  // Search controls for searchable dropdowns
  testIdSearchCtrl = new FormControl('');
  testBatchSearchCtrl = new FormControl('');
  resultCodeSearchCtrl = new FormControl('');
  editReasonSearchCtrl = new FormControl('');
  bandValueSearchCtrl = new FormControl('');

  private testIdSearch = signal('');
  private testBatchSearch = signal('');
  private resultCodeSearch = signal('');
  private editReasonSearch = signal('');
  private bandValueSearch = signal('');

  protected filteredTestIds = computed(() => {
    const options = this.testIdOptions();
    const q = this.testIdSearch().toLowerCase();
    return q ? options.filter(o => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)) : options;
  });

  protected filteredTestBatches = computed(() => {
    const options = this.testBatchIdOptions();
    const q = this.testBatchSearch().toLowerCase();
    return q ? options.filter(o => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)) : options;
  });

  protected filteredResultCodes = computed(() => {
    const options = this.resultCodeOptions();
    const q = this.resultCodeSearch().toLowerCase();
    return q ? options.filter(o => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)) : options;
  });

  protected filteredEditReasons = computed(() => {
    const options = this.editReasonOptions();
    const q = this.editReasonSearch().toLowerCase();
    return q ? options.filter(o => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)) : options;
  });

  protected filteredBandValues = computed(() => {
    const options = this.bandValueOptions();
    const q = this.bandValueSearch().toLowerCase();
    return q ? options.filter(o => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)) : options;
  });

  headerForm!: FormGroup;
  bandForm!: FormGroup;
  resultForm!: FormGroup;
  editReasonForm!: FormGroup;
  noteForm!: FormGroup;

  protected readonly hasData = computed(() => this.testData() !== null);

  private rawTestData: TestIdLookupDto[] = [];
  private rawBatchData: TestBatchLookupDto[] = [];
  private rawResultCodes: { resultCode: string; resultDesc: string | null }[] = [];
  private rawEditReasons: { code: string; codeDesc: string | null }[] = [];
  private currentUnitId = '';

  ngOnInit(): void {
    this.initForms();
    this.subscribeToChapterChanges();
    this.loadEditReasons();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.headerForm = this.fb.group({
      unitId: ['', [Validators.required, Validators.maxLength(15)]],
      testId: ['', Validators.required],
      description: [{ value: '', disabled: true }],
      testBatchId: [''],
      sequenceNumber: [{ value: '', disabled: true }],
      type: [{ value: '', disabled: true }],
      typeDescription: [{ value: '', disabled: true }],
    });

    this.bandForm = this.fb.group({});

    this.resultForm = this.fb.group({
      resultCode: [''],
      description: [{ value: '', disabled: true }],
    });

    this.editReasonForm = this.fb.group({
      editReasonCode: [''],
      description: [{ value: '', disabled: true }],
    });

    this.noteForm = this.fb.group({
      noteText: ['', Validators.maxLength(240)],
    });

    this.headerForm.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((testId: string) => {
        if (testId) {
          const unitId = this.headerForm.get('unitId')?.value;
          if (unitId) {
            const selectedTest = this.rawTestData.find(t => t.testId === testId);
            this.headerForm.patchValue({
              description: selectedTest?.testDesc ?? '',
            });
            this.loadTestBatches(unitId, testId);
            this.loadBandValues(testId);
            this.loadResultCodes(testId);
          }
        } else {
          this.testBatchIdOptions.set([]);
          this.bandValueOptions.set([]);
          this.resultCodeOptions.set([]);
        }
        this.headerForm.patchValue({
          testBatchId: '',
          sequenceNumber: '',
          type: '',
          typeDescription: '',
        });
        this.clearDataSection();
      });

    this.headerForm.get('testBatchId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tbId: string) => {
        if (tbId) {
          const batchData = this.rawBatchData.find(b => b.tbId === tbId);
          if (batchData) {
            this.sequenceNumberOptions.set([
              { value: batchData.tbSeqNo.toString(), label: batchData.tbSeqNo.toString() },
            ]);
            this.headerForm.patchValue({
              sequenceNumber: batchData.tbSeqNo.toString(),
            });
            this.loadTestObservation(
              this.headerForm.get('unitId')?.value,
              this.headerForm.get('testId')?.value,
              tbId,
              batchData.tbSeqNo
            );
          }
        }
      });

    this.resultForm.get('resultCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        const raw = code ? this.rawResultCodes.find(r => r.resultCode === code) : null;
        this.resultDescription.set(raw?.resultDesc ?? '');
      });

    this.editReasonForm.get('editReasonCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        const raw = code ? this.rawEditReasons.find(r => r.code === code) : null;
        this.editReasonDescription.set(raw?.codeDesc ?? '');
      });

    // Search control subscriptions
    this.testIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200), distinctUntilChanged())
      .subscribe(v => this.testIdSearch.set(v || ''));

    this.testBatchSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200), distinctUntilChanged())
      .subscribe(v => this.testBatchSearch.set(v || ''));

    this.resultCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200), distinctUntilChanged())
      .subscribe(v => this.resultCodeSearch.set(v || ''));

    this.editReasonSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200), distinctUntilChanged())
      .subscribe(v => this.editReasonSearch.set(v || ''));

    this.bandValueSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200), distinctUntilChanged())
      .subscribe(v => this.bandValueSearch.set(v || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.clear());
  }

  onUnitIdValidated(event: any): void {
    const unitId = event.parsedUnitId;
    if (unitId) {
      this.currentUnitId = unitId;
      this.headerForm.patchValue({ unitId });
      this.loadTestIds(unitId);
    }
  }

  get hf() { return this.headerForm.controls; }
  get ef() { return this.editReasonForm.controls; }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // --- Data Loading ---

  private loadTestIds(unitId: string): void {
    this.apiService.getTestIds(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.rawTestData = data;
          this.testIdOptions.set(
            data.map((d) => ({
              value: d.testId,
              label: d.testDesc ? `${d.testId} - ${d.testDesc}` : d.testId,
            }))
          );
        },
        error: () => {
          this.snackbarService.showError('Failed to load test IDs.');
          this.testIdOptions.set([]);
        },
      });
  }

  private loadTestBatches(unitId: string, testId: string): void {
    this.apiService.getTestBatches(unitId, testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.rawBatchData = data;
          this.testBatchIdOptions.set(
            data.map((d) => ({ value: d.tbId, label: d.tbId }))
          );
          if (data.length === 1) {
            this.headerForm.patchValue({ testBatchId: data[0].tbId });
          }
        },
        error: () => {
          this.snackbarService.showError('Failed to load test batches.');
          this.testBatchIdOptions.set([]);
        },
      });
  }

  private loadBandValues(testId: string): void {
    this.apiService.getBandValues(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.bandValueOptions.set(
            data.map((d) => ({ value: d.result, label: d.result }))
          );
        },
        error: () => this.bandValueOptions.set([]),
      });
  }

  private loadResultCodes(testId: string): void {
    this.apiService.getResultCodes(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.rawResultCodes = data;
          this.resultCodeOptions.set(
            data.map((d) => ({ value: d.resultCode, label: d.resultDesc ? `${d.resultCode} - ${d.resultDesc}` : d.resultCode }))
          );
        },
        error: () => this.resultCodeOptions.set([]),
      });
  }

  private loadEditReasons(): void {
    this.apiService.getEditReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.rawEditReasons = data;
          this.editReasonOptions.set(
            data.map((d) => ({ value: d.code, label: d.codeDesc ? `${d.code} - ${d.codeDesc}` : d.code }))
          );
        },
        error: () => this.editReasonOptions.set([]),
      });
  }

  private loadTestObservation(unitId: string, testId: string, tbId: string, tbSeqNo: number): void {
    this.loading.set(true);
    const testChapterId = this.headerService.getCurrentChapterId?.() ?? '';

    this.apiService.getTestObservation(unitId, { testChapterId, testId, tbId, tbSeqNo })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.testData.set(data);

          this.headerForm.patchValue({
            type: data.header.testType ?? '',
            typeDescription: data.header.testTypeDesc ?? '',
          });

          const bands: BandRow[] = data.details.map((d) => ({
            bandSeq: d.bandSeq,
            bandName: d.bandName,
            bandLabel: d.bandName ?? `Band ${d.bandSeq}`,
            value: d.superBandVal,
            tech1BandVal: d.tech1BandVal,
            tech2BandVal: d.tech2BandVal,
            superBandVal: d.superBandVal,
          }));
          this.bandRows.set(bands);

          this.bandForm = this.fb.group({});
          bands.forEach((band) => {
            this.bandForm.addControl(`band_${band.bandSeq}`, this.fb.control(band.value));
          });

          if (data.header.superIntp) {
            this.resultForm.patchValue({ resultCode: data.header.superIntp });
          } else if (data.header.tech1Intp) {
            this.resultForm.patchValue({ resultCode: data.header.tech1Intp });
          }

          this.systemMessage.set(data.header.systemMessage ?? null);
          this.otherBandsEnabled.set(data.header.otherBandsEnabled === 'Y');
          this.hasSupervisorBands.set((data.otherBands ?? []).some(b => b.tech === 'S'));
          this.loadNotes(unitId, testChapterId, testId, tbId, tbSeqNo);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackbarService.showError('Failed to load test observation data.');
        },
      });
  }

  private loadNotes(unitId: string, testChapterId: string, testId: string, tbId: string, tbSeqNo: number): void {
    this.apiService.getNotes(unitId, testChapterId, testId, tbId, tbSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (noteData) => {
          if (noteData) {
            const noteItem: NoteItem = {
              id: noteData.noteId,
              author: noteData.insertUser ?? 'Unknown',
              date: noteData.insertDate ? this.formatDate(noteData.insertDate) : '',
              version: '1.0',
              content: noteData.note,
            };
            this.notes.set([noteItem]);
          } else {
            this.notes.set([]);
          }
        },
        error: () => this.notes.set([]),
      });
  }

  private formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // --- Additional Bands Side Panel ---

  onAddOtherBandResults(): void {
    const data = this.testData();
    if (!data) return;

    const otherBands = data.otherBands ?? [];
    const tech1 = otherBands.filter(b => b.tech === '1');
    const tech2 = otherBands.filter(b => b.tech === '2');
    const sup = otherBands.filter(b => b.tech === 'S');
    const maxRows = Math.max(tech1.length, tech2.length, sup.length, 1);

    const rows: { tech1Band1: string; tech1Band2: string; tech2Band1: string; tech2Band2: string; supBand1: string; supBand2: string }[] = [];
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
    this.otherBandRows.set(rows);
    this.showAdditionalBands.set(true);
  }

  onDeleteSupervisorBand(): void {
    const data = this.testData();
    if (!data) return;

    this.apiService.deleteOtherBand(
      data.header.unitId, data.header.testChapterId, data.header.testId,
      data.header.tbId, data.header.tbSeqNo, 'S'
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.otherBandRows.update(rows =>
            rows.map(r => ({ ...r, supBand1: '', supBand2: '' }))
          );
          this.hasSupervisorBands.set(false);
          this.snackbarService.showSuccess('Supervisor band deleted successfully.');
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to delete supervisor band.';
          this.snackbarService.showError(msg);
        },
      });
  }

  onCloseAdditionalBands(): void {
    this.showAdditionalBands.set(false);
  }

  // --- Notes ---

  onAddNote(): void {
    const text = this.noteForm.get('noteText')?.value?.trim();
    if (!text) return;

    const data = this.testData();
    if (!data) return;

    const testChapterId = data.header.testChapterId;
    this.apiService.createNote(
      data.header.unitId, testChapterId, data.header.testId, data.header.tbId, data.header.tbSeqNo,
      { noteText: text }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const noteData = response?.data;
          if (noteData) {
            const newNote: NoteItem = {
              id: noteData.noteId,
              author: noteData.insertUser ?? 'Current User',
              date: this.formatDate(new Date().toISOString()),
              version: '1.0',
              content: noteData.note,
            };
            this.notes.update((notes) => [...notes, newNote]);
          }
          this.noteForm.reset();
          this.snackbarService.showSuccess('Note added successfully.');
        },
        error: () => this.snackbarService.showError('Failed to add note.'),
      });
  }

  onEditNote(note: NoteItem): void {
    this.editingNoteId.set(note.id);
    this.noteForm.patchValue({ noteText: note.content });
  }

  onUpdateNote(): void {
    const text = this.noteForm.get('noteText')?.value?.trim();
    if (!text) return;

    const noteId = this.editingNoteId();
    if (!noteId) return;

    const numericId = typeof noteId === 'number' ? noteId : parseInt(noteId as string, 10);
    if (isNaN(numericId)) return;

    this.apiService.updateNote(numericId, { noteText: text })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notes.update((notes) =>
            notes.map((n) => n.id === noteId ? { ...n, content: text } : n)
          );
          this.editingNoteId.set(null);
          this.noteForm.reset();
          this.snackbarService.showSuccess('Note updated successfully.');
        },
        error: () => this.snackbarService.showError('Failed to update note.'),
      });
  }

  onDeleteNote(note: NoteItem): void {
    const noteId = typeof note.id === 'number' ? note.id : parseInt(note.id as string, 10);
    if (isNaN(noteId)) return;

    this.apiService.deleteNote(noteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notes.update((notes) => notes.filter((n) => n.id !== note.id));
          this.snackbarService.showSuccess('Note deleted successfully.');
        },
        error: () => this.snackbarService.showError('Failed to delete note.'),
      });
  }

  // --- Save / Cancel ---

  onSave(): void {
    if (this.headerForm.invalid) {
      this.headerForm.markAllAsTouched();
      return;
    }

    const data = this.testData();
    if (!data) {
      this.snackbarService.showError('No test observation data loaded.');
      return;
    }

    this.loading.set(true);

    const bandDetails = this.bandRows().map((band) => ({
      bandSeq: band.bandSeq,
      bandName: band.bandName ?? '',
      superBandVal: this.bandForm.get(`band_${band.bandSeq}`)?.value ?? null,
    }));

    const request: SaveAllRequestDto = {
      superIntp: this.resultForm.get('resultCode')?.value || null,
      voidCode: this.editReasonForm.get('editReasonCode')?.value,
      bandDetails,
    };

    this.apiService.saveAll(
      data.header.unitId, data.header.testChapterId, data.header.testId, data.header.tbId, data.header.tbSeqNo,
      request
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('All changes saved successfully.');
          this.clear();
        },
        error: (err) => {
          this.loading.set(false);
          const errorMsg = err?.error?.errorResponse?.error || err?.error?.message || 'Failed to save.';
          this.snackbarService.showError(errorMsg);
        },
      });
  }

  onCancel(): void {
    this.clear();
  }

  private clearDataSection(): void {
    this.bandForm = this.fb.group({});
    this.bandRows.set([]);
    this.resultForm.patchValue({ resultCode: '' });
    this.resultDescription.set('');
    this.editReasonDescription.set('');
    this.testData.set(null);
    this.systemMessage.set(null);
    this.notes.set([]);
    this.editingNoteId.set(null);
    this.showAdditionalBands.set(false);
    this.otherBandsEnabled.set(false);
    this.hasSupervisorBands.set(false);
  }

  onClear(): void {
    this.clear();
  }

  onUnitCleared(): void {
    if (!this.isClearing) {
      this.clear();
    }
  }

  private isClearing = false;

  private clear(): void {
    this.isClearing = true;
    this.unitIdField?.clear();
    this.isClearing = false;
    this.headerForm.reset();
    this.clearDataSection();
    this.editReasonForm.reset();
    this.noteForm.reset();
    this.testIdOptions.set([]);
    this.testBatchIdOptions.set([]);
    this.sequenceNumberOptions.set([]);
    this.bandValueOptions.set([]);
    this.resultCodeOptions.set([]);
    this.rawTestData = [];
    this.rawBatchData = [];
    this.rawResultCodes = [];
    this.rawEditReasons = [];
    this.currentUnitId = '';
    this.unitIdField?.focus();
  }
}
