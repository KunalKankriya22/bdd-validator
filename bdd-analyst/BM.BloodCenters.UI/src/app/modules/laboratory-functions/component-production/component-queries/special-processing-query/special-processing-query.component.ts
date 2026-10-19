import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { SpecialProcessingQueryApiService } from './services/special-processing-query-api.service';
import {
  SpecialProcessingQueryResultDto,
  ComponentSpDto,
  StageItem
} from './models/special-processing-query.interface';

@Component({
  selector: 'app-special-processing-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './special-processing-query.component.html',
  styleUrl: './special-processing-query.component.scss'
})
export class SpecialProcessingQueryComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(SpecialProcessingQueryApiService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
    title: 'Special Processing Query',
    subtitle: 'Special Processing Query'
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || '', link: null },
          ],
          title: pageData.title || '',
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  searchForm!: FormGroup;

  readonly loading = signal(false);
  readonly hasSearched = signal(false);
  readonly unitData = signal<SpecialProcessingQueryResultDto | null>(null);
  readonly selectedProductIndex = signal<number | null>(null);
  readonly selectedStageIndex = signal(0);
  readonly stageSearchTerm = signal('');

  readonly collectionDate = computed(() => {
    const data = this.unitData();
    if (!data?.collDate) return '';
    return this.formatDate(data.collDate);
  });

  readonly productRecords = computed(() =>
    this.unitData()?.specialProcessingRecords || []
  );

  readonly selectedProduct = computed(() => {
    const idx = this.selectedProductIndex();
    const records = this.productRecords();
    return idx !== null && idx < records.length ? records[idx] : null;
  });

  readonly stages = computed<StageItem[]>(() => {
    const product = this.selectedProduct();
    if (!product) return [];

    const stageMap = new Map<string, StageItem>();

    for (const diff of product.differentials) {
      if (!stageMap.has(diff.stageCode)) {
        stageMap.set(diff.stageCode, {
          stageCode: diff.stageCode,
          insertDate: diff.insertDate,
          insertUserId: diff.insertUserId,
          differentialDetails: [],
          reagentDetails: []
        });
      }
      stageMap.get(diff.stageCode)!.differentialDetails.push(...(diff.details || []));
    }

    for (const reag of product.reagents) {
      if (!stageMap.has(reag.stageCode)) {
        stageMap.set(reag.stageCode, {
          stageCode: reag.stageCode,
          insertDate: reag.insertDate,
          insertUserId: reag.insertUserId,
          differentialDetails: [],
          reagentDetails: []
        });
      }
      stageMap.get(reag.stageCode)!.reagentDetails.push(...(reag.details || []));
    }

    return Array.from(stageMap.values())
      .sort((a, b) => a.stageCode.localeCompare(b.stageCode));
  });

  readonly filteredStages = computed(() => {
    const term = this.stageSearchTerm().toLowerCase();
    const all = this.stages();
    if (!term) return all;
    return all.filter(s =>
      s.stageCode.toLowerCase().includes(term) ||
      s.insertUserId.toLowerCase().includes(term)
    );
  });

  readonly selectedStage = computed(() => {
    const filtered = this.filteredStages();
    const idx = this.selectedStageIndex();
    return idx < filtered.length ? filtered[idx] : null;
  });

  readonly spikingRecords = computed(() =>
    this.selectedProduct()?.spiking || []
  );

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      unitId: ['', [Validators.required, Validators.maxLength(15)]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.unitData.set(null);
      this.hasSearched.set(false);
      this.resetSelections();
      this.snackbarService.showError('Please enter a valid Unit ID');
      return;
    }

    const unitId = this.searchForm.value.unitId?.trim().toUpperCase();
    if (!unitId) {
      this.unitData.set(null);
      this.hasSearched.set(false);
      this.resetSelections();
      this.snackbarService.showError('Unit ID is required');
      return;
    }

    this.loading.set(true);
    this.hasSearched.set(false);
    this.resetSelections();

    this.apiService.search({ unitId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.hasSearched.set(true);

          if (response.success && response.data && response.data.length > 0) {
            const result = response.data[0];
            this.unitData.set(result);

            if (result.specialProcessingRecords?.length > 0) {
              this.selectedProductIndex.set(0);
              this.selectedStageIndex.set(0);
            } else {
              this.snackbarService.showSuccess('No special processing records found for this unit');
            }
          } else {
            this.unitData.set(null);
            this.snackbarService.showSuccess(
              response.message || 'No special processing records found for this unit'
            );
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.hasSearched.set(true);
          this.unitData.set(null);
          const msg = error?.error?.message || 'An error occurred while retrieving special processing data';
          this.snackbarService.showError(msg);
        }
      });
  }

  onClear(): void {
    this.searchForm.reset();
    this.unitData.set(null);
    this.hasSearched.set(false);
    this.resetSelections();
  }

  onProductRowSelect(index: number): void {
    this.selectedProductIndex.set(index);
    this.selectedStageIndex.set(0);
    this.stageSearchTerm.set('');
  }

  onStageSelect(index: number): void {
    this.selectedStageIndex.set(index);
  }

  onStageSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.stageSearchTerm.set(value);
    this.selectedStageIndex.set(0);
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  }

  formatDateTime(dateString: string | null): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  }

  get f() {
    return this.searchForm.controls;
  }

  private resetSelections(): void {
    this.selectedProductIndex.set(null);
    this.selectedStageIndex.set(0);
    this.stageSearchTerm.set('');
  }
}
