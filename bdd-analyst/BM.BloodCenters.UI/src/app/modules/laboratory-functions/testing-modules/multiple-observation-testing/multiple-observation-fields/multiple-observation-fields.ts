import { Component, OnInit, OnDestroy, inject, effect, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

import {
  MofTestItem,
  MofTestTypeDto,
  MofBandDto,
  MofBandRow,
  MofBandCreateDto,
} from './models/multiple-observation-fields.model';
import { MofApiService } from './services/multiple-observation-fields-api.service';

@Component({
  selector: 'app-multiple-observation-fields',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DragDropModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './multiple-observation-fields.html',
  styleUrl: './multiple-observation-fields.scss',
})
export class MultipleObservationFieldsComponent implements OnInit, OnDestroy {
  private apiService = inject(MofApiService);
  private snackbarService = inject(SnackbarService);
  private headerService = inject(HeaderService);
  private pageHeaderService = inject(PageHeaderService);
  private liveAnnouncer = inject(LiveAnnouncer);
  private el = inject(ElementRef);
  private destroy$ = new Subject<void>();

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [],
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: [],
        };
      }
    });
  }

  readonly displayedColumns = ['drag', 'sequence', 'bandName', 'effDate', 'termDate', 'modDate'];

  // Left panel
  allTests: MofTestItem[] = [];
  filteredTests: MofTestItem[] = [];
  searchText = '';
  selectedTest: MofTestItem | null = null;
  testsLoading = false;

  // Test Kit dropdown
  testTypes: MofTestTypeDto[] = [];
  selectedTestType: string | null = null;
  testTypesLoading = false;

  // Right panel — bands table
  rows: MofBandRow[] = [];
  originalRows: MofBandRow[] = [];
  isDirty = false;
  bandsLoading = false;
  isSaving = false;

  get hasInvalidRows(): boolean {
    return this.rows.some(r =>
      !r.bandName.trim() || !r.effDate || this.getEffDateError(r) !== null || this.getTermDateError(r) !== null
    );
  }

  get minDate(): moment.Moment {
    return DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());
  }

  getEffDateError(row: MofBandRow): string | null {
    if (!row.effDate) {
      return (row.bandName.trim() && this.touchedEffDates.has(row)) ? 'Effective date is required' : null;
    }
    if (row.isNew) {
      const eff = moment(row.effDate);
      if (eff.isValid() && eff.isBefore(this.minDate, 'day')) {
        return 'Effective date must be today or later';
      }
    }
    return null;
  }

  getTermDateError(row: MofBandRow): string | null {
    if (!row.termDate) return null;
    const term = moment(row.termDate);
    if (!term.isValid()) return null;

    if (row.effDate) {
      const eff = moment(row.effDate);
      if (eff.isValid() && term.isBefore(eff, 'day')) {
        return 'Termination date must be on or after effective date';
      }
    }

    const orig = this.originalRows.find(o => o.bandSeq === row.bandSeq);
    const isChanged = row.isNew || (orig && orig.termDate !== row.termDate);
    if (isChanged && term.isBefore(this.minDate, 'day')) {
      return 'Termination date must be today or later';
    }
    return null;
  }

  private touchedEffDates = new Set<MofBandRow>();
  private effDateMatchers = new Map<MofBandRow, ErrorStateMatcher>();
  private termDateMatchers = new Map<MofBandRow, ErrorStateMatcher>();

  getEffDateMatcher(row: MofBandRow): ErrorStateMatcher {
    if (!this.effDateMatchers.has(row)) {
      this.effDateMatchers.set(row, {
        isErrorState: () => !!this.getEffDateError(row)
      });
    }
    return this.effDateMatchers.get(row)!;
  }

  getTermDateMatcher(row: MofBandRow): ErrorStateMatcher {
    if (!this.termDateMatchers.has(row)) {
      this.termDateMatchers.set(row, {
        isErrorState: () => !!this.getTermDateError(row)
      });
    }
    return this.termDateMatchers.get(row)!;
  }

  onDateInputBlur(row: MofBandRow, event: FocusEvent, field: 'effDate' | 'termDate'): void {
    if (field === 'effDate') this.touchedEffDates.add(row);
    const input = event.target as HTMLInputElement;
    const val = input.value?.trim();
    if (val && !moment(val, ['DD-MMM-YYYY', 'D-MMM-YYYY', 'YYYY-MM-DD'], true).isValid()) {
      if (field === 'effDate') {
        row.effDate = '';
      } else {
        row.termDate = null;
      }
      this.isDirty = true;
    }
    this.rows = [...this.rows];
  }

  // ── Lifecycle ──

  ngOnInit(): void {
    this.loadTests();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchText = '';
        this.selectedTest = null;
        this.selectedTestType = null;
        this.testTypes = [];
        this.rows = [];
        this.originalRows = [];
        this.isDirty = false;
        this.loadTests();
      });
  }

  // ── Left panel ──

  private loadTests(): void {
    this.testsLoading = true;
    this.liveAnnouncer.announce('Loading tests');
    this.apiService.getTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allTests = data.map(d => ({ testId: d.testId, description: d.testDesc }));
          this.filteredTests = [...this.allTests];
          this.testsLoading = false;
          this.liveAnnouncer.announce(`${data.length} tests loaded`);
          if (this.allTests.length > 0) this.selectTest(this.allTests[0]);
        },
        error: () => { this.testsLoading = false; },
      });
  }

  onSearch(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredTests = q
      ? this.allTests.filter(
          t => t.testId.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        )
      : [...this.allTests];
  }

  selectTest(test: MofTestItem): void {
    if (this.selectedTest?.testId === test.testId) return;
    this.selectedTest = test;
    this.selectedTestType = null;
    this.rows = [];
    this.originalRows = [];
    this.isDirty = false;
    this.loadTestTypes(test.testId);
  }

  // ── Test Kit dropdown ──

  private loadTestTypes(testId: string): void {
    this.testTypesLoading = true;
    this.testTypes = [];
    this.apiService.getTestTypes(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.testTypes = data;
          this.testTypesLoading = false;
          if (data.length === 1) {
            this.selectedTestType = data[0].testType;
            this.onTestTypeChange();
          }
        },
        error: () => { this.testTypesLoading = false; },
      });
  }

  onTestTypeChange(): void {
    if (!this.selectedTest || !this.selectedTestType) {
      this.rows = [];
      this.originalRows = [];
      this.isDirty = false;
      return;
    }
    this.loadBands();
  }

  // ── Bands table ──

  private loadBands(): void {
    if (!this.selectedTest || !this.selectedTestType) return;
    this.bandsLoading = true;
    this.liveAnnouncer.announce('Loading bands');
    this.apiService.getBands(this.selectedTest.testId, this.selectedTestType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const mapped = this.mapDtoToRows(data);
          this.originalRows = mapped.map(r => ({ ...r }));
          this.rows = mapped.map(r => ({ ...r }));
          this.bandsLoading = false;
          this.isDirty = false;
          this.liveAnnouncer.announce(`${data.length} bands loaded`);
          this.touchedEffDates.clear();
          this.effDateMatchers.clear();
          this.termDateMatchers.clear();
        },
        error: () => {
          this.bandsLoading = false;
          this.snackbarService.showError('Failed to load bands. Please try again.');
        },
      });
  }

  private mapDtoToRows(data: MofBandDto[]): MofBandRow[] {
    return data
      .slice()
      .sort((a, b) => a.bandSeq - b.bandSeq)
      .map(d => ({
        bandSeq: d.bandSeq,
        bandName: d.bandName,
        effDate: d.effDate,
        termDate: d.termDate,
        lastModifiedDate: d.lastModifiedDate,
        isNew: false,
      }));
  }

  focusNextListItem(event: Event): void {
    const target = event.target as HTMLElement;
    const next = target.nextElementSibling as HTMLElement | null;
    if (next && next.getAttribute('role') === 'option') next.focus();
  }

  focusPreviousListItem(event: Event): void {
    const target = event.target as HTMLElement;
    const prev = target.previousElementSibling as HTMLElement | null;
    if (prev && prev.getAttribute('role') === 'option') prev.focus();
  }

  onRowChange(): void {
    this.isDirty = true;
    this.rows = [...this.rows];
  }

  addNewBand(): void {
    const nextSeq = this.rows.length > 0
      ? Math.max(...this.rows.map(r => r.bandSeq)) + 1
      : 1;
    this.rows = [
      ...this.rows,
      {
        bandSeq: nextSeq,
        bandName: '',
        effDate: '',
        termDate: null,
        lastModifiedDate: null,
        isNew: true,
      },
    ];
    this.isDirty = true;
    setTimeout(() => {
      const rows = this.el.nativeElement.querySelectorAll('.mof-table .mof-col-band .inline-field input');
      if (rows.length) rows[rows.length - 1].focus();
    });
  }

  deleteRow(row: MofBandRow): void {
    this.rows = this.rows.filter(r => r !== row);
    this.resequence();
    this.isDirty = true;
  }

  onDrop(event: CdkDragDrop<MofBandRow[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      const updated = [...this.rows];
      const [moved] = updated.splice(event.previousIndex, 1);
      updated.splice(event.currentIndex, 0, moved);
      this.rows = updated;
      this.resequence();
      this.isDirty = true;
    }
  }

  private resequence(): void {
    this.rows.forEach((r, i) => (r.bandSeq = i + 1));
  }

  // ── Date helpers ──

  parseDateForPicker(dateStr: string | null): moment.Moment | null {
    if (!dateStr) return null;
    const m = moment(dateStr);
    return m.isValid() ? m : null;
  }

  onEffDateChange(row: MofBandRow, value: moment.Moment | null): void {
    row.effDate = value ? DateFieldValidationUtility.serializeDateForApi(value) ?? '' : '';
    this.isDirty = true;
    this.rows = [...this.rows];
  }

  onTermDateChange(row: MofBandRow, value: moment.Moment | null): void {
    row.termDate = value ? DateFieldValidationUtility.serializeDateForApi(value) ?? null : null;
    this.isDirty = true;
    this.rows = [...this.rows];
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  // ── Actions ──

  clearAll(): void {
    this.rows = this.originalRows.map(r => ({ ...r }));
    this.resequence();
    this.isDirty = false;
  }

  cancel(): void {
    this.rows = this.originalRows.map(r => ({ ...r }));
    this.isDirty = false;
  }

  save(): void {
    if (!this.selectedTest || !this.selectedTestType || this.hasInvalidRows || this.isSaving) return;

    this.isSaving = true;
    const testId = this.selectedTest.testId;
    const testType = this.selectedTestType;

    const newRows = this.rows.filter(r => r.isNew);
    const existingRows = this.rows.filter(r => !r.isNew);

    const createPayloads = newRows.map(r => ({
      testId,
      testType,
      bandName: r.bandName.trim(),
      effDate: r.effDate,
      termDate: r.termDate,
    }));

    const changedRows = existingRows.filter(r => {
      const orig = this.originalRows.find(o => o.bandSeq === r.bandSeq);
      return orig && (orig.bandName !== r.bandName || orig.effDate !== r.effDate || orig.termDate !== r.termDate);
    });

    const updatePromises = changedRows.map(r =>
      this.apiService.updateBand(testId, testType, r.bandSeq, {
        bandName: r.bandName.trim(),
        effDate: r.effDate,
        termDate: r.termDate,
      }).toPromise()
    );

    const hasResequenced = existingRows.some((r, i) => {
      const orig = this.originalRows.find(o => o.bandSeq === r.bandSeq);
      return orig && orig.bandSeq !== i + 1;
    });

    const desiredExistingOrder = existingRows.map(r => r.bandSeq);

    this.executeSave(createPayloads, updatePromises, hasResequenced, testId, testType, desiredExistingOrder);
  }

  private async executeSave(
    createPayloads: MofBandCreateDto[],
    updatePromises: (Promise<MofBandDto | undefined> | undefined)[],
    hasResequenced: boolean,
    testId: string,
    testType: string,
    desiredExistingOrder: number[],
  ): Promise<void> {
    try {
      for (const payload of createPayloads) {
        await this.apiService.createBand(payload).toPromise();
      }

      await Promise.all(updatePromises);

      if (hasResequenced) {
        await this.loadBandsAsync(testId, testType);
        const newRowSeqs = this.rows
          .map(r => r.bandSeq)
          .filter(seq => !desiredExistingOrder.includes(seq));
        const allSequences = [...desiredExistingOrder, ...newRowSeqs];
        await this.apiService.resequence({
          testId,
          testType,
          bandSequences: allSequences.map((oldSeq, i) => ({
            oldBandSeq: oldSeq,
            newBandSeq: i + 1,
          })),
        }).toPromise();
      }

      this.isSaving = false;
      this.snackbarService.showSuccess(
        `Multiple observation fields updated successfully for test ${testId}.`
      );
      this.liveAnnouncer.announce('Changes saved successfully');
      this.loadBands();
    } catch (error: any) {
      this.isSaving = false;
      const message = error?.error?.data?.message || error?.message || 'An error occurred while saving. Please try again.';
      this.snackbarService.showError(message);
      this.liveAnnouncer.announce('Save failed');
      this.loadBands();
    }
  }

  private loadBandsAsync(testId: string, testType: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getBands(testId, testType)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            const mapped = this.mapDtoToRows(data);
            this.originalRows = mapped.map(r => ({ ...r }));
            this.rows = mapped.map(r => ({ ...r }));
            resolve();
          },
          error: (err) => reject(err),
        });
    });
  }
}
