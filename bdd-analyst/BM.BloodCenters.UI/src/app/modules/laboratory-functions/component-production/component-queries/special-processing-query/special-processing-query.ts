import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit, signal, computed, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule } from '@angular/forms';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

import { SpecialProcessingQueryService } from './services/special-processing-query.service';
import {
  SpecialProcessingQueryResultDto,
  SpecialProcessingRecordDto,
  DifferentialHdrDto,
  ReagentHdrDto,
  SpikingDto,
} from './models/special-processing-query.model';

@Component({
  selector: 'app-special-processing-query',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    SearchBar,
  ],
  templateUrl: './special-processing-query.html',
  styleUrl: './special-processing-query.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialProcessingQueryComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly apiService = inject(SpecialProcessingQueryService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
  };

  readonly isLoading = signal(false);
  readonly hasResults = signal(false);
  readonly collectionDateDisplay = signal('');

  readonly productRecords = signal<SpecialProcessingRecordDto[]>([]);
  readonly selectedProductIndex = signal<number>(-1);

  readonly selectedRecord = computed(() => {
    const idx = this.selectedProductIndex();
    const records = this.productRecords();
    return idx >= 0 && idx < records.length ? records[idx] : null;
  });

  readonly stages = computed<DifferentialHdrDto[]>(() => {
    const record = this.selectedRecord();
    if (!record) return [];

    const differentials = record.differentials ?? [];
    const reagents = record.reagents ?? [];

    const stageMap = new Map<string, DifferentialHdrDto>();
    differentials.forEach(d => stageMap.set(d.stageCode, d));

    reagents.forEach(r => {
      if (!stageMap.has(r.stageCode)) {
        stageMap.set(r.stageCode, {
          differentialId: 0,
          stageCode: r.stageCode,
          insertDate: r.insertDate,
          insertUserId: r.insertUserId,
          details: [],
        });
      }
    });

    let all = Array.from(stageMap.values()).sort((a, b) => a.stageCode.localeCompare(b.stageCode));
    const search = this.stageSearchText().toLowerCase();
    if (search) {
      all = all.filter(s => s.stageCode.toLowerCase().includes(search));
    }
    return all;
  });
  readonly selectedStageIndex = signal<number>(0);

  readonly selectedStage = computed(() => {
    const stgs = this.stages();
    const idx = this.selectedStageIndex();
    return idx >= 0 && idx < stgs.length ? stgs[idx] : null;
  });

  readonly selectedReagentHeader = computed(() => {
    const stage = this.selectedStage();
    if (!stage) return null;
    const reagents = this.selectedRecord()?.reagents ?? [];
    return reagents.find(r => r.stageCode === stage.stageCode) ?? null;
  });

  readonly spikingRecords = computed<SpikingDto[]>(() => this.selectedRecord()?.spiking ?? []);

  stageSearchConfig: SearchBarConfig = {
    placeholder: 'Search by stage',
    minLength: 0,
    ariaLabel: 'Search differential stages',
    debounceTime: 300,
    searchOnEnterOnly: true,
  };

  readonly stageSearchText = signal('');

  ngOnInit(): void {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    if (menuItem?.label) {
      this.pageHeaderConfig = {
        ...this.pageHeaderConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: menuItem.label, link: null },
        ],
      };
    }

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearResults();
        this.unitIdField?.clear();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUnitValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    if (!unitId) return;

    this.isLoading.set(true);

    this.apiService.search(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);

          if (response.success && response.data && response.data.length > 0) {
            const result = response.data[0];
            this.collectionDateDisplay.set(result.collDate || '');
            this.productRecords.set(result.specialProcessingRecords || []);
            this.hasResults.set(true);

            if ((result.specialProcessingRecords?.length ?? 0) > 0) {
              this.selectProduct(0);
            }
          } else {
            const code = response.errorCode || response.errorResponse?.errorCode;
            const msg = response.error || response.message || response.errorResponse?.error || 'No special processing records found';
            this.snackbarService.showError(code ? `Error ${code}: ${msg}` : msg);
            this.clearResults();
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          const errorMsg = HttpErrorHandler.extractErrorMessage(error, 'Failed to load special processing data');
          this.snackbarService.showError(errorMsg);
          this.clearResults();
        },
      });
  }

  onUnitCleared(): void {
    this.clearResults();
  }

  selectProduct(index: number): void {
    this.selectedProductIndex.set(index);
    this.selectedStageIndex.set(0);
  }

  selectStage(index: number): void {
    this.selectedStageIndex.set(index);
  }

  onStageSearch(searchText: string): void {
    this.stageSearchText.set(searchText);
    this.selectedStageIndex.set(0);
  }

  isProductSelected(index: number): boolean {
    return this.selectedProductIndex() === index;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : '-';
  }

  private clearResults(): void {
    this.collectionDateDisplay.set('');
    this.productRecords.set([]);
    this.selectedProductIndex.set(-1);
    this.selectedStageIndex.set(0);
    this.hasResults.set(false);
  }
}
