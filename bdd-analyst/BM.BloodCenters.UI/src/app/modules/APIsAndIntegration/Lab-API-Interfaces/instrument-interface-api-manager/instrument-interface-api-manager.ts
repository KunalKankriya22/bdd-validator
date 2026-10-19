import { Component, signal, computed, inject, OnInit, ViewChild, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { InstrumentInterfaceService } from './services/instrument-interface.service';
import { Chapter, Instrument } from './models/instrument-interface.model';
import { RawDataTab } from './components/raw-data-tab/raw-data-tab';
import { UploadStatusTab } from './components/upload-status-tab/upload-status-tab';
import { ManualUploadTab } from './components/manual-upload-tab/manual-upload-tab';
import { ViewLogPrintTab } from './components/view-log-print-tab/view-log-print-tab';
import { ManageErrorsTab } from './components/manage-errors-tab/manage-errors-tab';

@Component({
  selector: 'app-instrument-interface-api-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    RawDataTab,
    UploadStatusTab,
    ManualUploadTab,
    ViewLogPrintTab,
    ManageErrorsTab,
  ],
  templateUrl: './instrument-interface-api-manager.html',
  styleUrls: ['./instrument-interface-api-manager.scss'],
})
export class InstrumentInterfaceApiManager implements OnInit, OnDestroy {
  private instrumentService = inject(InstrumentInterfaceService);
  private loginService = inject(LoginService);
  private pageHeaderService = inject(PageHeaderService);
  private headerService = inject(HeaderService);

  @ViewChild(RawDataTab) rawDataTab!: RawDataTab;
  @ViewChild(UploadStatusTab) uploadStatusTab!: UploadStatusTab;
  @ViewChild(ManualUploadTab) manualUploadTab!: ManualUploadTab;
  @ViewChild(ViewLogPrintTab) viewLogPrintTab!: ViewLogPrintTab;
  @ViewChild(ManageErrorsTab) manageErrorsTab!: ManageErrorsTab;

  // Signals
  chapters = signal<Chapter[]>([]);
  instruments = signal<Instrument[]>([]);
  selectedChapterId = signal<string>('');
  selectedInstrumentId = signal<string>('');
  activeTabIndex = signal<number>(0);
  loading = signal<boolean>(false);
  isSuperUser = signal<boolean>(false);

  // Search form controls for dropdowns
  readonly chapterIdSearchControl = new FormControl('');
  readonly instrumentIdSearchControl = new FormControl('');

  // Convert search FormControl values to signals for reactivity
  readonly chapterIdSearch = signal('');
  readonly instrumentIdSearch = signal('');

  // Filtered options based on search
  readonly filteredChapters = computed(() => {
    const search = this.chapterIdSearch().toLowerCase();
    const options = this.chapters();

    if (!search) return options;
    return options.filter(chapter => chapter.id.toLowerCase().includes(search));
  });

  readonly filteredInstruments = computed(() => {
    const search = this.instrumentIdSearch().toLowerCase();
    const options = this.instruments();

    if (!search) return options;
    return options.filter(instrument =>
      instrument.id.toLowerCase().includes(search) ||
      instrument.name.toLowerCase().includes(search)
    );
  });

  readonly selectedInstrumentDesc = computed(() => {
    const id = this.selectedInstrumentId();
    if (!id) return '';
    const instrument = this.instruments().find(i => i.id === id);
    if (!instrument?.name) return '';
    const dashIndex = instrument.name.indexOf(' - ');
    return dashIndex >= 0 ? instrument.name.substring(dashIndex + 3) : instrument.name;
  });

  // Computed
  isRetrieveEnabled = computed(
    () => this.selectedChapterId() && this.selectedInstrumentId()
  );

  private destroy$ = new Subject<void>();

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadChapters();
    this.loadInstruments();
    this.setupSearchControls();
    this.checkUserAccess();
    this.prePopulateChapter();
  }

  private prePopulateChapter(): void {
    const sessionChapterId = this.headerService.chapterId();
    if (sessionChapterId) {
      this.selectedChapterId.set(sessionChapterId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchControls(): void {
    // Subscribe to search control changes and update signals
    this.chapterIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.chapterIdSearch.set(value || '');
      });

    this.instrumentIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.instrumentIdSearch.set(value || '');
      });
  }

  loadChapters(): void {
    this.loading.set(true);
    this.instrumentService.getChapters().subscribe({
      next: (chapters) => {
        this.chapters.set(chapters);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadInstruments(): void {
    this.loading.set(true);
    this.instrumentService.getInstruments().subscribe({
      next: (instruments) => {
        this.instruments.set(instruments);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onChapterChange(chapterId: string): void {
    this.selectedChapterId.set(chapterId);
    this.selectedInstrumentId.set('');
    this.loadInstruments();
  }

  onInstrumentChange(instrumentId: string): void {
    this.selectedInstrumentId.set(instrumentId);
    // Tabs will refresh based on computed signal
  }

  onRetrieve(): void {
    switch (this.activeTabIndex()) {
      case 0:
        if (this.rawDataTab) this.rawDataTab.loadRawData();
        break;
      case 1:
        if (this.uploadStatusTab) this.uploadStatusTab.loadUploadStatus();
        break;
      case 2:
        if (this.manualUploadTab) this.manualUploadTab.loadPendingFileIds();
        break;
      case 3:
        if (this.viewLogPrintTab) this.viewLogPrintTab.loadLogFiles();
        break;
      case 4:
        if (this.manageErrorsTab) this.manageErrorsTab.loadErrorCodes();
        break;
    }
  }

  private checkUserAccess(): void {
    const userId = this.loginService.getStoredUsername() || '';
    if (!userId) {
      this.isSuperUser.set(false);
      return;
    }

    this.instrumentService
      .getUserDetails(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const accessLevel = response.item?.accPriv ?? 0;
          this.isSuperUser.set(accessLevel === 9);
        },
        error: () => {
          this.isSuperUser.set(false);
        },
      });
  }
}
