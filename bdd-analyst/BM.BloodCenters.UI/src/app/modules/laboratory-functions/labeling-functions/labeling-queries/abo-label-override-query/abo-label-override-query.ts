import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import {
  UnitIdFieldComponent,
  UnitValidationResponse,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';

import { AboLabelOverrideQueryService } from './abo-label-override-query.service';
import { AboLabelOverrideRecord } from './abo-label-override-query.model';

@Component({
  selector: 'app-abo-label-override-query',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './abo-label-override-query.html',
  styleUrls: ['./abo-label-override-query.scss'],
})
export class AboLabelOverrideQueryComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly service = inject(AboLabelOverrideQueryService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  isLoadingRecords = signal(false);
  collectionDate = signal<string>('');
  records = signal<AboLabelOverrideRecord[]>([]);
  hasSearched = signal(false);
  selectedIndex = signal<number>(0);

  selectedRecord = computed(() => this.records()[this.selectedIndex()] ?? null);

  optionLabel(rec: AboLabelOverrideRecord): string {
    return rec.productCode;
  }

  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
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
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.unitIdField?.clear();
        this.onUnitCleared();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Unit ID field events ─────────────────────────────────────────────────

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;

    // Step 1: validate unit against the chapter via backend — same pattern as check-in-from-lab
    this.service
      .validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data || res.data.length === 0) {
            this.onUnitCleared();
            event.reject(res.message ?? 'Unit ID not found.');
            return;
          }

          const unit = res.data[0];

          if (!unit.isValid) {
            this.onUnitCleared();
            event.reject(res.message ?? 'Unit ID is not valid for this chapter.');
            return;
          }

          // Set collection date from validate-unit response
          if (!unit.collDate) {
            this.onUnitCleared();
            event.reject('Collection date not found for this unit.');
            return;
          }

          const m = moment(unit.collDate);
          this.collectionDate.set(m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : unit.collDate);

          // Unit is valid — confirm the field so it shows the green valid state
          event.confirm();

          // Step 2: load override records (independent of event lifecycle)
          this.loadOverrideRecords(unitId);
        },
        error: () => {
          this.onUnitCleared();
          event.reject('Failed to validate unit. Please try again.');
        },
      });
  }

  onUnitValidated(_data: UnitValidationResponse): void {}

  onUnitCleared(): void {
    this.records.set([]);
    this.collectionDate.set('');
    this.hasSearched.set(false);
    this.isLoadingRecords.set(false);
    this.selectedIndex.set(0);
  }

  onIndexChange(index: number): void {
    this.selectedIndex.set(index);
  }

  // ─── Load override records ────────────────────────────────────────────────

  private loadOverrideRecords(unitId: string): void {
    this.isLoadingRecords.set(true);
    this.records.set([]);
    this.hasSearched.set(false);

    this.service
      .getOverrideRecords(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoadingRecords.set(false);
          this.hasSearched.set(true);

          if (!res.success) {
            this.showError(res.message ?? 'Failed to retrieve override records.');
            return;
          }

          const records = res.data ?? [];
          this.records.set(records);
          this.selectedIndex.set(0);

          if (records.length === 0) {
            this.showError('No ABO label override records found for this unit.');
          }
        },
        error: () => {
          this.isLoadingRecords.set(false);
          this.hasSearched.set(true);
          this.showError('Failed to retrieve override records. Please try again.');
        },
      });
  }

  // ─── Display helpers ──────────────────────────────────────────────────────

  formatLocalDateTime(value: string | null | undefined): string {
    if (!value) return '-';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm').toUpperCase() : value;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 6000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
