import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';

import {
  BoxHeaderDto,
  BoxUnitDto,
  BoxUnitTestDto,
  SampleTypeDropdownDto,
  TestIdDropdownDto,
} from '../models/confirmatory-sample-transfer-out.model';
import { ConfirmatorySampleTransferOutApiService } from '../services/confirmatory-sample-transfer-out-api.service';

@Component({
  selector: 'app-edit-units-in-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './edit-units-in-box.component.html',
  styleUrl: './edit-units-in-box.component.scss',
})
export class EditUnitsInBoxComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ConfirmatorySampleTransferOutApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  protected readonly headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      {
        label: 'Confirmatory Sample Transfer Out',
        link: '/laboratory-functions/regional-sample-tracking/confirmatory-sample-transfer-out',
      },
      { label: 'Edit Units in the Box', link: null },
    ],
    title: 'Edit Units in the Box',
    showBackButton: true,
    onBackClick: () => this.onCancel(),
    actions: [
      { label: 'ADD NEW TEST ID', variant: 'outlined', onClick: () => this.onAddNewTestId() },
      { label: 'CANCEL', variant: 'text', onClick: () => this.onCancel() },
      { label: 'SAVE', variant: 'filled', onClick: () => this.onSave() },
    ],
  };

  protected readonly boxHeader = signal<BoxHeaderDto | null>(null);
  protected readonly units = signal<BoxUnitDto[]>([]);
  protected readonly selectedUnit = signal<BoxUnitDto | null>(null);
  protected readonly sampleTypes = signal<SampleTypeDropdownDto[]>([]);
  protected readonly testIds = signal<TestIdDropdownDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly unitCount = computed(() => this.units().length);
  protected readonly showAddTestRow = signal<boolean>(false);
  newTestIdCtrl = new FormControl('');

  private boxId = '';

  sampleTypeSearchCtrl = new FormControl('');
  testIdSearchCtrl = new FormControl('');

  private sampleTypeSearchText = signal('');
  private testIdSearchText = signal('');

  readonly filteredSampleTypes = computed(() => {
    const s = this.sampleTypeSearchText().toLowerCase();
    return !s ? this.sampleTypes() : this.sampleTypes().filter((t) =>
      t.code.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)
    );
  });

  readonly filteredTestIds = computed(() => {
    const s = this.testIdSearchText().toLowerCase();
    return !s ? this.testIds() : this.testIds().filter((t) =>
      t.testId.toLowerCase().includes(s) || t.testDesc.toLowerCase().includes(s)
    );
  });

  ngOnInit(): void {
    this.boxId = this.route.snapshot.queryParams['boxId'] || '';
    this.setupSearchSubscriptions();

    if (this.boxId) {
      this.loadBoxData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscriptions(): void {
    this.sampleTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.sampleTypeSearchText.set(val || ''));
    this.testIdSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.testIdSearchText.set(val || ''));
  }

  private loadBoxData(): void {
    this.loading.set(true);

    forkJoin([
      this.apiService.getBoxDetails(this.boxId),
      this.apiService.getActiveSampleTypes(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([box, sampleTypes]) => {
          this.boxHeader.set(box);
          this.units.set(box.units || []);
          this.sampleTypes.set(sampleTypes);

          if (this.units().length > 0) {
            this.selectedUnit.set(this.units()[0]);
          }

          if (box.externalFacFlag === 'Y') {
            this.apiService.getActiveTestIds(box.facilityCode)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (tests) => this.testIds.set(tests),
                error: () => this.snackbarService.showError('Failed to load test IDs.'),
              });
          }

          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err?.message || 'Failed to load box details.');
        },
      });
  }

  onSelectUnit(unit: BoxUnitDto): void {
    this.selectedUnit.set(unit);
  }

  onUpdateUnit(unit: BoxUnitDto): void {
    this.apiService.updateUnitInBox(this.boxId, unit.sampleSeqNo, {
      unitId: unit.unitId,
      collDate: unit.collDate,
      sampleType: unit.sampleType,
      frozenFlag: unit.frozenFlag || 'N',
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.snackbarService.showSuccess('Unit updated successfully.'),
        error: (err) => {
          const body = err?.error;
          this.snackbarService.showError(
            body?.errorResponse?.error || body?.message || 'Failed to update unit.'
          );
        },
      });
  }

  onDeleteUnit(unit: BoxUnitDto): void {
    this.loading.set(true);
    this.apiService.deleteUnitFromBox(this.boxId, unit.sampleSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.units.update((list) => list.filter((u) => u.sampleSeqNo !== unit.sampleSeqNo));
          if (this.selectedUnit()?.sampleSeqNo === unit.sampleSeqNo) {
            this.selectedUnit.set(this.units()[0] || null);
          }
          this.loading.set(false);
          this.snackbarService.showSuccess('Unit deleted successfully.');
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err?.error?.message || 'Failed to delete unit.');
        },
      });
  }

  onDeleteTest(test: BoxUnitTestDto): void {
    const selected = this.selectedUnit();
    if (!selected) return;

    this.loading.set(true);
    this.apiService.deleteTestFromSample(selected.sampleSeqNo, test.testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.units.update((list) =>
            list.map((u) => {
              if (u.sampleSeqNo === selected.sampleSeqNo) {
                return { ...u, tests: u.tests.filter((t) => t.testId !== test.testId) };
              }
              return u;
            })
          );
          const updated = this.units().find((u) => u.sampleSeqNo === selected.sampleSeqNo);
          if (updated) this.selectedUnit.set(updated);
          this.loading.set(false);
          this.snackbarService.showSuccess('Test deleted successfully.');
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err?.error?.message || 'Failed to delete test.');
        },
      });
  }

  onAddNewTestId(): void {
    if (!this.selectedUnit()) {
      this.snackbarService.showError('Please select a unit first.');
      return;
    }
    this.showAddTestRow.set(true);
    this.newTestIdCtrl.reset();
  }

  onNewTestSelected(testId: string): void {
    const selected = this.selectedUnit();
    if (!selected || !testId) return;

    const box = this.boxHeader();
    if (!box) return;

    this.loading.set(true);
    this.showAddTestRow.set(false);

    this.apiService.addTestToSample(selected.sampleSeqNo, {
      testId,
      facilityCode: box.facilityCode,
      unitId: selected.unitId,
      sampleType: selected.sampleType,
      collDate: selected.collDate,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.newTestIdCtrl.reset();
          this.refreshBoxData();
          this.snackbarService.showSuccess('Test added successfully.');
        },
        error: (err) => {
          this.loading.set(false);
          const body = err?.error;
          this.snackbarService.showError(
            body?.errorResponse?.error || body?.message || 'Failed to add test.'
          );
        },
      });
  }

  private refreshBoxData(): void {
    this.apiService.getBoxDetails(this.boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (box) => {
          this.boxHeader.set(box);
          this.units.set(box.units || []);
          const currentSeqNo = this.selectedUnit()?.sampleSeqNo;
          const updated = this.units().find((u) => u.sampleSeqNo === currentSeqNo);
          this.selectedUnit.set(updated || this.units()[0] || null);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  onSave(): void {
    this.snackbarService.showSuccess(`${this.unitCount()} Entries saved`);
    this.navigateBack();
  }

  onCancel(): void {
    this.navigateBack();
  }

  private navigateBack(): void {
    this.router.navigate([
      '/laboratory-functions/regional-sample-tracking/confirmatory-sample-transfer-out',
    ], { queryParams: { boxId: this.boxId } });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  }
}
