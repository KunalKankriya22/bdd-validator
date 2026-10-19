import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import { DonorStateService } from '../../shared/services/donor-state.service';
import {
  MergedDonor,
  MergedDonorInterdiction,
  MergeHoldUnit,
  PotentialDuplicate,
} from '../models/donor-detail-query.model';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

@Component({
  selector: 'app-merged-donors-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './merged-donors-page.html',
  styleUrl: './merged-donors-page.scss',
})
export class MergedDonorsPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly donorService = inject(DonorDetailQueryService);
  private readonly donorStateService = inject(DonorStateService);
  private readonly destroy$ = new Subject<void>();

  readonly donorId = signal<string>('');
  readonly donorName = signal<string>('');
  readonly mergedDonors = signal<MergedDonor[]>([]);
  readonly holdUnits = signal<MergeHoldUnit[]>([]);
  readonly mergedInterdictions = signal<MergedDonorInterdiction[]>([]);
  readonly duplicates = signal<PotentialDuplicate[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly hasMergedDonors = computed(() => this.mergedDonors().length > 0);
  readonly hasHoldUnits = computed(() => this.holdUnits().length > 0);
  readonly hasMergedInterdictions = computed(() => this.mergedInterdictions().length > 0);
  readonly hasDuplicates = computed(() => this.duplicates().length > 0);
  readonly interMessage = signal<string>('');

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor Detail Query', link: ROUTE_REGISTRY[RouteKey.DonorDetailQuery].path },
      { label: 'Merged Donor', link: null },
    ],
    title: '',
    showBackButton: true,
    onBackClick: () => this.navigateBack(),
    actions: [],
  };

  mergedDonorsConfig: DataTableConfig<MergedDonor> = {
    columns: [
      { key: 'secondaryDonorId', header: 'Second ID', sortable: false },
      { key: 'gender', header: 'Sex', width: '80px', sortable: false },
      { key: 'dateOfBirth', header: 'Date of Birth', width: '130px', sortable: false,
        valueFormatter: (v: string) => this.donorService.formatDate(v) },
      { key: 'lastName', header: 'Last Name', sortable: false },
      { key: 'firstName', header: 'First Name', sortable: false },
      { key: 'middleName', header: 'Middle Name', width: '120px', sortable: false,
        valueFormatter: (v: string) => v || '--' },
    ],
    stickyHeader: true,
    showTableOnEmpty: false,
  };

  holdUnitsConfig: DataTableConfig<MergeHoldUnit> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'collDate', header: 'Collection Date', width: '140px', sortable: false,
        valueFormatter: (v: string) => this.donorService.formatDate(v) },
      { key: 'donorId', header: 'Donor ID', width: '120px', sortable: false },
    ],
    stickyHeader: true,
    showTableOnEmpty: false,
  };

  interdictionsConfig: DataTableConfig<MergedDonorInterdiction> = {
    columns: [
      { key: 'donorId', header: 'Donor ID', sortable: false },
      { key: 'interCode', header: 'Inter', width: '80px', sortable: false },
      { key: 'unitId', header: 'Unit ID', sortable: false,
        valueFormatter: (v: string) => v || '--' },
      { key: 'effDate', header: 'Effective Date', width: '130px', sortable: false,
        valueFormatter: (v: string) => this.donorService.formatDate(v) },
      { key: 'termDate', header: 'Termination Date', width: '140px', sortable: false,
        valueFormatter: (v: string) => v ? this.donorService.formatDate(v) : '--' },
    ],
    stickyHeader: true,
    showTableOnEmpty: false,
  };

  duplicatesConfig: DataTableConfig<PotentialDuplicate> = {
    columns: [
      { key: 'setId', header: 'Batch', width: '100px', sortable: false },
      { key: 'donorId', header: 'Donor ID', width: '100px', sortable: false },
      { key: 'mergeFlag', header: 'F', width: '40px', sortable: false },
      { key: 'resolveUser', header: 'Resolve User', width: '90px', sortable: false },
      { key: 'resolveDate', header: 'Date', width: '90px', sortable: false,
        valueFormatter: (v: string) => v ? this.donorService.formatDate(v) : '--' },
      { key: 'demographicsCheck', header: 'Dm', width: '40px', sortable: false },
      { key: 'demographicsUser', header: 'User', width: '80px', sortable: false },
      { key: 'demographicsDate', header: 'Date', width: '90px', sortable: false,
        valueFormatter: (v: string) => v ? this.donorService.formatDate(v) : '--' },
      { key: 'interdictionsCheck', header: 'In', width: '40px', sortable: false },
      { key: 'interdictionsUser', header: 'User', width: '80px', sortable: false },
      { key: 'interdictionsDate', header: 'Date', width: '90px', sortable: false,
        valueFormatter: (v: string) => v ? this.donorService.formatDate(v) : '--' },
      { key: 'donationsCheck', header: 'Dn', width: '40px', sortable: false },
      { key: 'donationsUser', header: 'User', width: '80px', sortable: false },
      { key: 'donationsDate', header: 'Date', width: '90px', sortable: false,
        valueFormatter: (v: string) => v ? this.donorService.formatDate(v) : '--' },
      { key: 'keydataCheck', header: 'Ky', width: '40px', sortable: false },
      { key: 'keydataUser', header: 'User', width: '80px', sortable: false },
      { key: 'keydataDate', header: 'Date', width: '90px', sortable: false,
        valueFormatter: (v: string) => v ? this.donorService.formatDate(v) : '--' },
    ],
    stickyHeader: true,
    showTableOnEmpty: false,
  };

  ngOnInit(): void {
    const queryDonorId = this.route.snapshot.queryParams['donorId'];
    const selectedDonor = this.donorStateService.getSelectedDonor();

    const resolvedDonorId = queryDonorId || selectedDonor?.donorId;

    if (!resolvedDonorId) {
      this.router.navigate([ROUTE_REGISTRY[RouteKey.DonorDetailQuery].path]);
      return;
    }

    this.donorId.set(resolvedDonorId);
    this.donorName.set(selectedDonor?.donorName || '');
    this.pageHeaderConfig = {
      ...this.pageHeaderConfig,
      title: `${resolvedDonorId} | ${selectedDonor?.donorName || ''}`,
    };
    this.loadData(resolvedDonorId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateBack(): void {
    this.router.navigate(
      [ROUTE_REGISTRY[RouteKey.DonorDetailQuery].path],
      { queryParams: { donorId: this.donorId() } }
    );
  }

  loadData(donorId: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      donors: this.donorService.getMergedDonors(donorId),
      holdUnits: this.donorService.getMergeHoldUnits(donorId),
      interdictions: this.donorService.getMergedInterdictions(donorId),
      duplicates: this.donorService.getPotentialDuplicates(donorId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.mergedDonors.set(result.donors);
          this.holdUnits.set(result.holdUnits);
          this.mergedInterdictions.set(result.interdictions);
          this.duplicates.set(result.duplicates);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load merged donor information. Please try again.');
          this.loading.set(false);
        },
      });
  }
}
