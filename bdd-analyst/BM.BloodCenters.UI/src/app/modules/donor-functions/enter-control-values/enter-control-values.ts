import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ViewChild, HostListener, TemplateRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import moment, { Moment } from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';

import { EnterControlValuesService } from './services/enter-control-values.service';
import { VoidConfirmDialogComponent } from './dialogs/void-confirm-dialog';
import {
  TestBatchOption, TestOption, RunOption, KitOption,
  DeviceOption, ReagentOption, BatchDetail,
  ControlBatchParameter, ControlBatchReagent, ControlBatchUnit,
  BatchInfo, SaveParameterItem, getParameterStatus,
} from './models/enter-control-values.model';

export type ScreenMode = 'TECH1_ENTRY' | 'TECH1_SELF_CONFIRM' | 'TECH2_CONFIRM' | 'FINALIZE' | 'READ_ONLY' | 'NONE';

@Component({
  selector: 'app-enter-control-values',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDialogModule, MatDatepickerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb, DataTable, SearchBar,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './enter-control-values.html',
  styleUrl: './enter-control-values.scss',
})
export class EnterControlValuesComponent implements OnInit, OnDestroy {
  private readonly service = inject(EnterControlValuesService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  // Search card form controls
  testBatchControl = new FormControl<string | null>(null);
  testControl = new FormControl<string | null>(null);
  runControl = new FormControl<string | null>(null);
  kitControl = new FormControl<string | null>(null);

  // Search controls for searchable dropdowns
  tbSearchControl = new FormControl('');
  testSearchControl = new FormControl('');
  runSearchControl = new FormControl('');
  kitSearchControl = new FormControl('');

  // LOV data
  testBatchOptions = signal<TestBatchOption[]>([]);
  testOptions = signal<TestOption[]>([]);
  runOptions = signal<RunOption[]>([]);
  kitOptions = signal<KitOption[]>([]);

  // Filtered LOVs
  filteredTestBatches = computed(() => {
    const search = this.tbSearchControl.value?.toLowerCase() ?? '';
    return search ? this.testBatchOptions().filter(o =>
      o.tbId?.toLowerCase().includes(search) || o.testId?.toLowerCase().includes(search)
    ) : this.testBatchOptions();
  });
  filteredTests = computed(() => {
    const search = this.testSearchControl.value?.toLowerCase() ?? '';
    return search ? this.testOptions().filter(o =>
      o.testId?.toLowerCase().includes(search) || o.testDesc?.toLowerCase().includes(search)
    ) : this.testOptions();
  });
  filteredRuns = computed(() => {
    const search = this.runSearchControl.value?.toLowerCase() ?? '';
    return search ? this.runOptions().filter(o =>
      o.runId?.toLowerCase().includes(search)
    ) : this.runOptions();
  });
  filteredKits = computed(() => {
    const search = this.kitSearchControl.value?.toLowerCase() ?? '';
    return search ? this.kitOptions().filter(o =>
      o.testKitId?.toLowerCase().includes(search)
    ) : this.kitOptions();
  });

  // Batch detail — drives Run and Kit LOV loading
  batchDetail = signal<BatchDetail | null>(null);
  isLoadingBatchDetail = false;

  // Loading states
  isLoadingBatches = false;
  isLoadingTests = false;
  isLoadingRuns = false;
  isLoadingKits = false;

  // Screen state
  isLoading = signal(false);
  hasSearched = signal(false);
  parameters = signal<ControlBatchParameter[]>([]);
  reagents = signal<ControlBatchReagent[]>([]);
  units = signal<ControlBatchUnit[]>([]);
  batchInfo = signal<BatchInfo | null>(null);

  // Side panel state
  reagentPanelOpen = signal(false);
  unitsPanelOpen = signal(false);

  // Device/Reagent LOV for inline dropdowns
  deviceOptions = signal<DeviceOption[]>([]);
  reagentLovOptions = signal<ReagentOption[]>([]);
  isLoadingDeviceLov = false;
  isLoadingReagentLov = false;

  // Date max (no future dates allowed — FMB error 8030). Uses chapter-local date, not client time.
  today = this.chapterTimezoneService.isChapterLocalDateAvailable()
    ? this.chapterTimezoneService.getChapterLocalDate()
    : moment();

  // Kit/reagent expiry void status from retrieve
  expiryVoidCode: string | null = null;

  // Dynamic FormControls per parameter row (keyed by parmCode)
  private dateControls = new Map<string, FormControl>();
  private timeControls = new Map<string, FormControl>();

  getDateControl(parmCode: string, initialValue: string | null): FormControl {
    if (!this.dateControls.has(parmCode)) {
      this.dateControls.set(parmCode, new FormControl(this.parseDateValue(initialValue)));
    }
    return this.dateControls.get(parmCode)!;
  }

  getTimeControl(parmCode: string, initialValue: string | null): FormControl {
    if (!this.timeControls.has(parmCode)) {
      this.timeControls.set(parmCode, new FormControl(this.parseTimePart(initialValue)));
    }
    return this.timeControls.get(parmCode)!;
  }

  // Temp storage for datetime (date part + time part combined on blur)
  private datetimeDateParts = new Map<string, string>();

  // Search within table
  searchText = '';

  // Table configs
  parmsTableConfig!: DataTableConfig<ControlBatchParameter>;
  reagentTableConfig!: DataTableConfig<ControlBatchReagent>;
  unitsTableConfig!: DataTableConfig<ControlBatchUnit>;

  // ViewChild refs
  @ViewChild('tbSelect') tbSelect?: MatSelect;
  @ViewChild('testSelect') testSelect?: MatSelect;
  @ViewChild('runSelect') runSelect?: MatSelect;
  @ViewChild('kitSelect') kitSelect?: MatSelect;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('valueTemplate', { static: true }) valueTemplate!: TemplateRef<any>;
  @ViewChild('reagentPanel') reagentPanel?: ElementRef;
  @ViewChild('unitsPanel') unitsPanel?: ElementRef;

  // Page header
  headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    return {
      title: pageData?.title || 'Enter Control Values for Test Batch',
      subtitle: 'Capture and validate control parameters for this test batch before verification.',
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: pageData?.title || 'Enter Control Values for Test Batch', link: null },
      ],
    };
  });

  // --- SCREEN MODE (derived from parameter data) ---

  screenMode = computed<ScreenMode>(() => {
    const parms = this.parameters();
    if (!parms.length) return 'NONE';

    const allTechNo0 = parms.every(p => p.techNo === 0);
    if (allTechNo0) return 'READ_ONLY';

    const allHaveBothTechs = parms.every(p => p.firstTech && p.secondTech);
    if (allHaveBothTechs) return 'FINALIZE';

    const anyTech2 = parms.some(p => p.techNo === 2);
    if (anyTech2) return 'TECH2_CONFIRM';

    const allTech1SelfConfirm = parms.every(p =>
      p.techNo === 1 && p.tech1Reqd === 'Y' && p.tech2Reqd === 'X'
    );
    if (allTech1SelfConfirm) return 'TECH1_SELF_CONFIRM';

    return 'TECH1_ENTRY';
  });

  techColumnHeader = computed(() => {
    const mode = this.screenMode();
    return (mode === 'TECH2_CONFIRM' || mode === 'FINALIZE') ? 'Confirmed by' : 'First Tech';
  });

  showConfirmBatchBtn = computed(() => {
    const mode = this.screenMode();
    return mode === 'TECH2_CONFIRM' || mode === 'TECH1_SELF_CONFIRM';
  });

  showFinalizeBatchBtn = computed(() => {
    return this.screenMode() === 'FINALIZE';
  });

  isConfirmBatchEnabled = computed(() => {
    const parms = this.parameters();
    if (!parms.length) return false;
    return parms.every(p => p.confirmFlag === 'Y' || p.confirmFlag === 'N');
  });

  isSaveEnabled = computed(() => {
    const parms = this.parameters();
    if (!parms.length) return false;
    const mode = this.screenMode();
    if (mode === 'READ_ONLY') return false;
    if (mode === 'TECH1_ENTRY') return parms.some(p => p.parmValue != null);
    return true;
  });

  isValueEditable = computed(() => {
    const mode = this.screenMode();
    return mode === 'TECH1_ENTRY' || mode === 'TECH1_SELF_CONFIRM';
  });

  isConfirmEditable = computed(() => {
    const mode = this.screenMode();
    return mode === 'TECH2_CONFIRM' || mode === 'TECH1_SELF_CONFIRM';
  });

  // Filtered display
  displayedParameters = computed(() => {
    const text = this.searchText.toLowerCase();
    if (!text) return this.parameters();
    return this.parameters().filter(p =>
      p.parmCode?.toLowerCase().includes(text) ||
      p.description?.toLowerCase().includes(text)
    );
  });

  constructor() {
    effect(() => {
      this.filteredTestBatches();
      this.filteredTests();
      this.filteredRuns();
      this.filteredKits();
      setTimeout(() => {
        [this.tbSelect, this.testSelect, this.runSelect, this.kitSelect]
          .forEach(s => { if (s?.panelOpen) (s as any)._keyManager?.setActiveItem(1); });
      });
    });
  }

  ngOnInit(): void {
    this.initTableConfigs();
    this.loadTestBatchOptions();
    this.subscribeToChapterChanges();

    this.tbSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.testBatchOptions.update(v => [...v]);
    });
    this.testSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.testOptions.update(v => [...v]);
    });
    this.runSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.runOptions.update(v => [...v]);
    });
    this.kitSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.kitOptions.update(v => [...v]);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.altKey && event.key === 's') {
      event.preventDefault();
      if (!this.isRetrieveDisabled()) this.onRetrieve();
    }
    if (event.key === 'Escape') {
      if (this.reagentPanelOpen()) this.closeReagentPanel();
      if (this.unitsPanelOpen()) this.closeUnitsPanel();
    }
  }

  private initTableConfigs(): void {
    this.parmsTableConfig = {
      columns: [
        { key: 'sequence', header: 'Sequence', sortable: true },
        { key: 'parmCode', header: 'Code', sortable: false },
        { key: 'description', header: 'Description', sortable: false },
        { key: 'parmValue', header: 'Value', sortable: false, cellTemplate: this.valueTemplate },
        { key: 'firstTech', header: 'First Tech', sortable: false },
        { key: 'acceptFlag', header: 'Status', sortable: false, cellTemplate: this.statusTemplate },
        { key: 'acceptDisplay', header: 'Acceptable', sortable: false },
        { key: 'confirmFlag', header: 'Confirmed', sortable: false },
      ],
      sortConfig: { column: 'sequence', direction: 'A' },
      enableRowHighlight: false,
      showActionsAsMenu: false,
      emptyMessage: 'No parameters available to display',
      noDataIcon: 'edit',
    };

    this.reagentTableConfig = {
      columns: [
        { key: 'reagentName', header: 'Reagent Name', sortable: true },
        { key: 'manufacturer', header: 'Manufacturer', sortable: false },
        { key: 'channel', header: 'Channel', sortable: false },
        { key: 'expiryDate', header: 'Expiration Date', sortable: false },
        { key: 'lotNumber', header: 'Lot Number', sortable: false },
      ],
      sortConfig: { column: 'reagentName', direction: 'A' },
      enableRowHighlight: false,
      showActionsAsMenu: false,
      emptyMessage: 'No reagent data available',
      noDataIcon: 'edit',
    };

    this.unitsTableConfig = {
      columns: [
        { key: 'sequence', header: 'Sequence', sortable: true },
        { key: 'unitId', header: 'Unit ID', sortable: false },
        { key: 'testId', header: 'Test', sortable: false },
        { key: 'resultStatus', header: 'Result', sortable: false },
        { key: 'absorbance', header: 'Absorbance', sortable: false },
        { key: 'ratio', header: 'Ratio', sortable: false },
      ],
      sortConfig: { column: 'sequence', direction: 'A' },
      enableRowHighlight: false,
      showActionsAsMenu: false,
      emptyMessage: 'No units in this batch',
      noDataIcon: 'edit',
    };
  }

  private rebuildParmsTableConfig(): void {
    const header = this.techColumnHeader();
    this.parmsTableConfig = {
      ...this.parmsTableConfig,
      columns: [
        { key: 'sequence', header: 'Sequence', sortable: true },
        { key: 'parmCode', header: 'Code', sortable: false },
        { key: 'description', header: 'Description', sortable: false },
        { key: 'parmValue', header: 'Value', sortable: false, cellTemplate: this.valueTemplate },
        { key: 'firstTech', header: header, sortable: false },
        { key: 'acceptFlag', header: 'Status', sortable: false, cellTemplate: this.statusTemplate },
        { key: 'acceptDisplay', header: 'Acceptable', sortable: false },
        { key: 'confirmFlag', header: 'Confirmed', sortable: false },
      ],
    };
  }

  // --- LOV Loading ---

  loadTestBatchOptions(): void {
    this.isLoadingBatches = true;
    this.service.getTestBatchOptions().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => { this.testBatchOptions.set(data); this.isLoadingBatches = false; },
      error: () => { this.isLoadingBatches = false; },
    });
  }

  onTestBatchChange(tbId: string): void {
    this.testControl.setValue(null);
    this.runControl.setValue(null);
    this.kitControl.setValue(null);
    this.testOptions.set([]);
    this.runOptions.set([]);
    this.kitOptions.set([]);
    this.batchDetail.set(null);
    this.resetResults();

    if (tbId) {
      this.isLoadingTests = true;
      this.service.getTestOptions(tbId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (data) => { this.testOptions.set(data); this.isLoadingTests = false; },
        error: () => { this.isLoadingTests = false; },
      });
    }
  }

  onTestChange(testId: string): void {
    this.runControl.setValue(null);
    this.kitControl.setValue(null);
    this.runOptions.set([]);
    this.kitOptions.set([]);
    this.batchDetail.set(null);
    this.resetResults();

    const tbId = this.testBatchControl.value;
    if (!testId || !tbId) return;

    this.isLoadingBatchDetail = true;
    this.service.getBatchDetail(tbId, testId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (detail) => {
        this.batchDetail.set(detail);
        this.isLoadingBatchDetail = false;
        this.loadDependentLovs(testId, detail);
      },
      error: () => {
        this.batchDetail.set(null);
        this.isLoadingBatchDetail = false;
      },
    });
  }

  private loadDependentLovs(testId: string, detail: BatchDetail): void {
    if (detail.parmType) {
      this.isLoadingRuns = true;
      this.service.getRunOptions(testId, detail.parmType).pipe(takeUntil(this.destroy$)).subscribe({
        next: (data) => {
          this.runOptions.set(data);
          this.isLoadingRuns = false;
          if (detail.runId) {
            const match = data.find(r => r.runId === detail.runId);
            if (match) this.runControl.setValue(detail.runId, { emitEvent: false });
          }
        },
        error: () => { this.isLoadingRuns = false; },
      });
    }

    this.isLoadingKits = true;
    this.service.getKitOptions(testId, detail.kitLotNumber ?? undefined).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.kitOptions.set(data);
        this.isLoadingKits = false;
        if (detail.testKitId) {
          const match = data.find(k => k.testKitId === detail.testKitId);
          if (match) this.kitControl.setValue(detail.testKitId, { emitEvent: false });
        }
      },
      error: () => { this.isLoadingKits = false; },
    });
  }

  onDropdownOpened(opened: boolean): void {
    if (!opened) return;
  }

  // --- RETRIEVE / CLEAR ---

  isRetrieveDisabled(): boolean {
    return this.isLoading() || !this.testBatchControl.value || !this.testControl.value || !this.kitControl.value;
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled()) return;

    this.isLoading.set(true);
    this.hasSearched.set(true);

    this.service.retrieve({
      tbId: this.testBatchControl.value!,
      testId: this.testControl.value!,
      runId: this.runControl.value || undefined,
      testKitId: this.kitControl.value!,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.parameters.set(result.parameters || []);
        this.reagents.set(result.reagents || []);
        this.rebuildParmsTableConfig();

        const testOpt = this.testOptions().find(t => t.testId === this.testControl.value);
        this.batchInfo.set({
          tbId: this.testBatchControl.value!,
          testId: this.testControl.value!,
          testDesc: testOpt?.testDesc || this.testControl.value!,
          unitCount: result.unitCount,
          configMessage: result.configMessage,
          testKitId: this.kitControl.value!,
        });

        if (result.parmCheckFlag === 'N') {
          this.expiryVoidCode = result.voidCode || 'REAG';
          this.snackbarService.showInfo('Kit/reagent is expired. Batch will be voided.');
        } else {
          this.expiryVoidCode = null;
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.parameters.set([]);
        this.batchInfo.set(null);
        this.isLoading.set(false);
      },
    });
  }

  onClearAll(): void {
    this.testBatchControl.setValue(null);
    this.testControl.setValue(null);
    this.runControl.setValue(null);
    this.kitControl.setValue(null);
    this.testOptions.set([]);
    this.runOptions.set([]);
    this.kitOptions.set([]);
    this.batchDetail.set(null);
    this.resetResults();
  }

  private resetResults(): void {
    this.hasSearched.set(false);
    this.parameters.set([]);
    this.reagents.set([]);
    this.units.set([]);
    this.batchInfo.set(null);
    this.searchText = '';
    this.dateControls.clear();
    this.timeControls.clear();
    this.datetimeDateParts.clear();
    this.expiryVoidCode = null;
    this.closeReagentPanel();
    this.closeUnitsPanel();
  }

  // --- Parameter Table Search ---

  onSearchChange(text: string): void {
    this.searchText = text;
  }

  // --- Value Input Handling ---

  getValuePlaceholder(row: ControlBatchParameter): string {
    switch (row.datatype) {
      case 'DATE': return 'MMDDYY';
      case 'DATETIME': return 'MMDDYYHHMM';
      case 'NUMBER': return 'Enter value';
      case 'DEVICE': return 'Device ID';
      case 'REAGENT': return 'Reagent ID';
      default: return 'Enter value';
    }
  }

  onValueBlur(event: Event, row: ControlBatchParameter): void {
    const input = event.target as HTMLInputElement;
    const newValue = input.value?.trim() || null;

    if (newValue === row.parmValue) return;

    this.parameters.update(parms =>
      parms.map(p => p.parmCode === row.parmCode
        ? { ...p, parmValue: newValue }
        : p
      )
    );

    if (!newValue) {
      this.parameters.update(parms =>
        parms.map(p => p.parmCode === row.parmCode
          ? { ...p, acceptFlag: null, parmValue: null }
          : p
        )
      );
      return;
    }

    const info = this.batchInfo();
    this.service.validateParameter({
      tbId: info?.tbId || '',
      testId: info?.testId || '',
      parmCode: row.parmCode,
      parmValue: newValue,
      datatype: row.datatype,
      relatedCode: row.relatedCode,
      relatedParmValue: this.getRelatedParmValue(row),
      acceptMin: row.acceptMin,
      acceptMax: row.acceptMax,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        const currentUserId = this.headerService.getCurrentUsername() || '';
        this.parameters.update(parms =>
          parms.map(p => p.parmCode === row.parmCode
            ? { ...p, acceptFlag: result.acceptFlag, parmValue: newValue,
                firstTech: p.firstTech || currentUserId,
                parmValueDisplay: newValue }
            : p
          )
        );
      },
      error: () => {
        const currentUserId = this.headerService.getCurrentUsername() || '';
        this.parameters.update(parms =>
          parms.map(p => p.parmCode === row.parmCode
            ? { ...p, acceptFlag: 'N', parmValue: newValue,
                firstTech: p.firstTech || currentUserId,
                parmValueDisplay: newValue }
            : p
          )
        );
      },
    });
  }

  private getRelatedParmValue(row: ControlBatchParameter): string | null {
    if (!row.relatedCode) return null;
    const related = this.parameters().find(p => p.parmCode === row.relatedCode);
    return related?.parmValue || null;
  }

  // --- DATE / DATETIME Handling ---

  parseDateValue(parmValue: string | null): Moment | null {
    if (!parmValue) return null;
    const m = moment(parmValue, ['MM-DD-YY', 'MM-DD-YYYY', 'DD-MMM-YYYY', 'MMDDYY'], true);
    return m.isValid() ? m : null;
  }

  parseDatePart(parmValue: string | null): Moment | null {
    if (!parmValue) return null;
    const datePart = parmValue.includes(' ') ? parmValue.split(' ')[0] : parmValue;
    const m = moment(datePart, ['MM-DD-YY', 'MM-DD-YYYY', 'DD-MMM-YYYY', 'MMDDYY'], true);
    return m.isValid() ? m : null;
  }

  parseTimePart(parmValue: string | null): string {
    if (!parmValue || !parmValue.includes(' ')) return '';
    return parmValue.split(' ')[1] || '';
  }

  onDateInput(event: Event, row: ControlBatchParameter): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value?.trim();
    if (!raw) {
      this.parameters.update(parms =>
        parms.map(p => p.parmCode === row.parmCode ? { ...p, parmValue: null, acceptFlag: null } : p)
      );
    }
  }

  onDateChange(event: any, row: ControlBatchParameter): void {
    const date = event.value as Moment;
    if (!date || !date.isValid()) return;
    const formatted = date.format('MM-DD-YY');
    this.updateParmAndValidate(row.parmCode, formatted, row);
  }

  onDatetimeDateChange(event: any, row: ControlBatchParameter): void {
    const date = event.value as Moment;
    if (!date || !date.isValid()) return;
    this.datetimeDateParts.set(row.parmCode, date.format('MM-DD-YY'));
    const timePart = this.parseTimePart(row.parmValue) || '';
    if (timePart) {
      const combined = date.format('MM-DD-YY') + ' ' + timePart;
      this.updateParmAndValidate(row.parmCode, combined, row);
    }
  }

  onDatetimeTimeBlur(event: Event, row: ControlBatchParameter): void {
    const input = event.target as HTMLInputElement;
    const timePart = input.value?.trim() || '';
    if (!timePart) return;
    const datePart = this.datetimeDateParts.get(row.parmCode) || this.parseDatePart(row.parmValue)?.format('MM-DD-YY') || '';
    if (!datePart) return;
    const combined = datePart + ' ' + timePart;
    this.updateParmAndValidate(row.parmCode, combined, row);
  }

  // --- DEVICE / REAGENT LOV ---

  onDeviceLovOpen(opened: boolean, row: ControlBatchParameter): void {
    if (!opened || !row.relatedCode) return;
    this.isLoadingDeviceLov = true;
    this.service.getDeviceOptions(row.relatedCode).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => { this.deviceOptions.set(data); this.isLoadingDeviceLov = false; },
      error: () => { this.isLoadingDeviceLov = false; },
    });
  }

  onDeviceSelect(value: string, row: ControlBatchParameter): void {
    this.updateParmAndValidate(row.parmCode, value, row);
  }

  onReagentLovOpen(opened: boolean, row: ControlBatchParameter): void {
    if (!opened || !row.relatedCode) return;
    const info = this.batchInfo();
    if (!info) return;
    this.isLoadingReagentLov = true;
    this.service.getReagentLovOptions(info.testId, row.relatedCode).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => { this.reagentLovOptions.set(data); this.isLoadingReagentLov = false; },
      error: () => { this.isLoadingReagentLov = false; },
    });
  }

  onReagentSelect(value: string, row: ControlBatchParameter): void {
    this.updateParmAndValidate(row.parmCode, value, row);
  }

  // --- Shared Validate Helper ---

  private updateParmAndValidate(parmCode: string, newValue: string, row: ControlBatchParameter): void {
    this.parameters.update(parms =>
      parms.map(p => p.parmCode === parmCode ? { ...p, parmValue: newValue } : p)
    );

    const info = this.batchInfo();
    this.service.validateParameter({
      tbId: info?.tbId || '',
      testId: info?.testId || '',
      parmCode: parmCode,
      parmValue: newValue,
      datatype: row.datatype,
      relatedCode: row.relatedCode,
      relatedParmValue: this.getRelatedParmValue(row),
      acceptMin: row.acceptMin,
      acceptMax: row.acceptMax,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        const currentUserId = this.headerService.getCurrentUsername() || '';
        this.parameters.update(parms =>
          parms.map(p => p.parmCode === parmCode
            ? { ...p, acceptFlag: result.acceptFlag, parmValue: newValue,
                firstTech: p.firstTech || currentUserId,
                parmValueDisplay: newValue }
            : p
          )
        );
      },
      error: () => {
        const currentUserId = this.headerService.getCurrentUsername() || '';
        this.parameters.update(parms =>
          parms.map(p => p.parmCode === parmCode
            ? { ...p, acceptFlag: 'N', parmValue: newValue,
                firstTech: p.firstTech || currentUserId,
                parmValueDisplay: newValue }
            : p
          )
        );
      },
    });
  }

  // --- Status Display ---

  getStatus(row: ControlBatchParameter): string {
    return getParameterStatus(row.acceptFlag);
  }

  getAcceptDisplay(row: ControlBatchParameter): string {
    if (row.acceptFlag === 'Y') return 'Yes';
    if (row.acceptFlag === 'N') return 'No';
    return '-';
  }

  // --- Side Panels ---

  private panelTriggerElement: HTMLElement | null = null;

  openReagentPanel(): void {
    this.panelTriggerElement = document.activeElement as HTMLElement;
    this.closeUnitsPanel();
    this.reagentPanelOpen.set(true);
    setTimeout(() => {
      const closeBtn = this.reagentPanel?.nativeElement?.querySelector('button[aria-label="Close reagents panel"]');
      closeBtn?.focus();
    });
  }

  closeReagentPanel(): void {
    this.reagentPanelOpen.set(false);
    this.panelTriggerElement?.focus();
    this.panelTriggerElement = null;
  }

  openUnitsPanel(): void {
    this.panelTriggerElement = document.activeElement as HTMLElement;
    this.closeReagentPanel();
    this.unitsPanelOpen.set(true);
    setTimeout(() => {
      const closeBtn = this.unitsPanel?.nativeElement?.querySelector('button[aria-label="Close units panel"]');
      closeBtn?.focus();
    });

    const info = this.batchInfo();
    if (info) {
      this.service.getUnits(info.tbId, info.testId, this.headerService.getCurrentChapterId()!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => this.units.set(data),
          error: () => this.units.set([]),
        });
    }
  }

  closeUnitsPanel(): void {
    this.unitsPanelOpen.set(false);
    this.panelTriggerElement?.focus();
    this.panelTriggerElement = null;
  }

  // --- PLACE GROUP INTERDICTION/HOLD ---

  onPlaceGroupHold(): void {
    const info = this.batchInfo();
    if (!info) return;

    const mode = info.tbId.length >= 9 && info.tbId.substring(7, 9) === 'TB' ? 'TBID' : 'ITBID';

    this.router.navigate(['/laboratory-functions/place-group-interdiction'], {
      queryParams: { mode, value: info.tbId }
    });
  }

  // --- Save / Confirm / Finalize ---

  onSave(): void {
    const info = this.batchInfo();
    if (!info) return;

    const mode = this.screenMode();
    let parms = this.buildSavePayload();

    // TECH1_SELF_CONFIRM: auto-set confirmFlag='Y' since no tech2 needed
    if (mode === 'TECH1_SELF_CONFIRM') {
      parms = parms.map(p => ({ ...p, confirmFlag: 'Y' }));
    }

    this.isLoading.set(true);
    this.service.save({
      tbId: info.tbId,
      testId: info.testId,
      runId: this.runControl.value || undefined,
      testKitId: info.testKitId,
      saveMode: 'SAVE',
      parameters: parms,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.snackbarService.showSuccess(result.message || 'All entries are saved successfully for verification.');
        this.isLoading.set(false);
        this.onRetrieve();
      },
      error: () => { this.isLoading.set(false); },
    });
  }

  onConfirmBatch(): void {
    const info = this.batchInfo();
    if (!info) return;

    const parms = this.buildSavePayload().map(p => ({ ...p, confirmFlag: 'Y' }));

    this.parameters.update(all => all.map(p => ({ ...p, confirmFlag: 'Y' })));

    this.isLoading.set(true);
    this.service.save({
      tbId: info.tbId,
      testId: info.testId,
      runId: this.runControl.value || undefined,
      testKitId: info.testKitId,
      saveMode: 'CONFIRM',
      parameters: parms,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.snackbarService.showSuccess(result.message || 'All entries confirmed successfully.');
        this.isLoading.set(false);
        this.onRetrieve();
      },
      error: () => { this.isLoading.set(false); },
    });
  }

  onFinalizeBatch(): void {
    const info = this.batchInfo();
    if (!info) return;

    const parms = this.buildSavePayload();

    this.isLoading.set(true);
    this.service.save({
      tbId: info.tbId,
      testId: info.testId,
      runId: this.runControl.value || undefined,
      testKitId: info.testKitId,
      saveMode: 'FINALIZE',
      parameters: parms,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        if (result.status === 'VOID_REQUIRED') {
          this.isLoading.set(false);
          this.showVoidDialog(info, parms);
        } else {
          this.snackbarService.showSuccess(result.message || 'Transaction committed successfully');
          this.isLoading.set(false);
          this.onClearAll();
        }
      },
      error: () => { this.isLoading.set(false); },
    });
  }

  private buildSavePayload(): SaveParameterItem[] {
    return this.parameters().map(p => ({
      parmCode: p.parmCode,
      parmValue: p.parmValue,
      acceptFlag: p.acceptFlag,
      confirmFlag: p.confirmFlag,
      voidCode: p.voidCode,
    }));
  }

  private showVoidDialog(info: BatchInfo, parms: SaveParameterItem[]): void {
    const dialogRef = this.dialog.open(VoidConfirmDialogComponent, {
      width: '480px',
      disableClose: true,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading.set(true);
        this.service.save({
          tbId: info.tbId,
          testId: info.testId,
          runId: this.runControl.value || undefined,
          testKitId: info.testKitId,
          saveMode: 'FINALIZE',
          parameters: parms,
          overrides: ['VOID_CONFIRMED'],
        }).pipe(takeUntil(this.destroy$)).subscribe({
          next: (result) => {
            this.snackbarService.showSuccess(result.message || 'Transaction committed successfully');
            this.isLoading.set(false);
            this.onClearAll();
          },
          error: () => { this.isLoading.set(false); },
        });
      }
    });
  }

  onCancel(): void {
    this.onClearAll();
  }

  // --- Chapter Change ---

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.testBatchControl.setValue(null, { emitEvent: false });
        this.testControl.setValue(null, { emitEvent: false });
        this.runControl.setValue(null, { emitEvent: false });
        this.kitControl.setValue(null, { emitEvent: false });
        this.testBatchOptions.set([]);
        this.testOptions.set([]);
        this.runOptions.set([]);
        this.kitOptions.set([]);
        this.batchDetail.set(null);
        this.resetResults();
        this.loadTestBatchOptions();
      });
  }
}
