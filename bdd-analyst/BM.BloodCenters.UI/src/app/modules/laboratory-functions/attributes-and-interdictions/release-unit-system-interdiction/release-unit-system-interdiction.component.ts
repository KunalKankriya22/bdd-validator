import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, filter } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';

import { ReleaseUnitSystemInterdictionService } from './services/release-unit-system-interdiction.service';
import {
  UnitSystemInterdictionDto,
  ReleaseUnitSystemInterdictionsRequestDto,
} from './models/release-unit-system-interdiction.models';

@Component({
  selector: 'app-release-unit-system-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
  ],
  templateUrl: './release-unit-system-interdiction.component.html',
  styleUrls: ['./release-unit-system-interdiction.component.scss'],
})
export class ReleaseUnitSystemInterdictionComponent implements OnInit, OnDestroy {
  private readonly service = inject(ReleaseUnitSystemInterdictionService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
    title: '',
    subtitle: '',
  };

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

  readonly tableConfig: DataTableConfig<UnitSystemInterdictionDto> = {
    columns: [
      { key: 'interCode', header: 'Interdiction Code', width: '20%' },
      { key: 'interDesc', header: 'Description', width: '50%' },
      { key: 'interTypeDesc', header: 'Interdiction Type', width: '30%' },
    ],
    enableSelection: true,
    selectionKey: 'interCode',
    showPagination: false,
    stickyHeader: true,
    emptyMessage: 'No interdictions found',
    emptySubMessage: 'Scan or enter a Unit ID to view interdictions',
  };

  readonly collDateControl = new FormControl<string | null>(null);

  parsedUnitId = signal('');
  codeScheme = signal<string>('I');
  availableCollectionDates = signal<string[]>([]);
  collectionDate = signal<string>('');
  showEntryForm = signal(false);
  isLoadingInterdictions = signal(false);
  isReleasing = signal(false);

  interdictions = signal<UnitSystemInterdictionDto[]>([]);
  hasLoadedInterdictions = signal(false);
  selectedRows = signal<UnitSystemInterdictionDto[]>([]);
  externalSelectedIds = signal<Set<string>>(new Set());

  hasMultipleDates = computed(() => this.availableCollectionDates().length > 1);

  canRelease = computed(() =>
    this.selectedRows().length > 0 && !this.isReleasing()
  );

  ngOnInit(): void {
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.parsedUnitId.set(data.parsedUnitId);
    this.codeScheme.set(data.codeScheme);
    this.showEntryForm.set(true);

    this.service
      .validateUnit(data.parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.isValid) {
            this.snackbarService.showError('No releasable system interdictions found for this unit.');
            this.unitIdField?.clear();
            this.resetState();
            return;
          }

          this.collectionDate.set(response.collDate);
          this.collDateControl.setValue(response.collDate, { emitEvent: false });
          this.loadInterdictions();
        },
        error: (err) => {
          const body = err?.error;
          const message = body?.errorResponse?.error || body?.message || 'Unit validation failed';
          this.snackbarService.showError(message);
          this.unitIdField?.clear();
          this.resetState();
        },
      });
  }

  onUnitCleared(): void {
    this.resetState();
  }

  onCollDateSelected(collDate: string): void {
    this.collectionDate.set(collDate);
    this.interdictions.set([]);
    this.selectedRows.set([]);
    this.externalSelectedIds.set(new Set());
    this.loadInterdictions();
  }

  onSelectionChange(selected: UnitSystemInterdictionDto[]): void {
    this.selectedRows.set(selected);
  }

  onRelease(): void {
    const selected = this.selectedRows();
    if (selected.length === 0) return;

    const collDate = this.collectionDate();
    if (!collDate) return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: {
        title: 'Release Unit System Interdiction',
        message: `Do you want to release ${selected.length} System interdiction${selected.length > 1 ? 's' : ''}`,
        confirmText: 'YES, RELEASE',
        cancelText: 'NO',
      } as ConfirmActionDialogData,
    });

    dialogRef.afterClosed()
      .pipe(
        filter(result => result === true),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.executeRelease(selected, collDate);
      });
  }

  private executeRelease(selected: UnitSystemInterdictionDto[], collDate: string): void {
    this.isReleasing.set(true);

    const request: ReleaseUnitSystemInterdictionsRequestDto = {
      unitId: this.parsedUnitId(),
      collDate,
      interCodes: selected.map(i => i.interCode),
    };

    this.service
      .releaseInterdictions(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isReleasing.set(false);

          if (response.success) {
            this.snackbarService.showSuccess(
              `${selected.length} System interdiction${selected.length > 1 ? 's' : ''} removed successfully`
            );
            this.clearAll();
          }
        },
        error: () => {
          this.isReleasing.set(false);
        },
      });
  }

  clearSelection(): void {
    this.selectedRows.set([]);
    this.externalSelectedIds.set(new Set());
  }

  clearAll(): void {
    this.unitIdField?.clear();
    this.resetState();
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  private loadInterdictions(): void {
    const unitId = this.parsedUnitId();
    const collDate = this.collectionDate();
    if (!unitId || !collDate) return;

    this.isLoadingInterdictions.set(true);
    this.service
      .getInterdictions(unitId, collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          this.interdictions.set(interdictions);
          this.hasLoadedInterdictions.set(true);
          this.selectedRows.set([]);
          this.isLoadingInterdictions.set(false);

          if (interdictions.length === 0) {
            this.snackbarService.showInfo('No releasable system interdictions found for this unit.');
          }
        },
        error: () => {
          this.isLoadingInterdictions.set(false);
          this.interdictions.set([]);
          this.selectedRows.set([]);
        },
      });
  }

  private resetState(): void {
    this.parsedUnitId.set('');
    this.collectionDate.set('');
    this.availableCollectionDates.set([]);
    this.showEntryForm.set(false);
    this.interdictions.set([]);
    this.hasLoadedInterdictions.set(false);
    this.selectedRows.set([]);
    this.externalSelectedIds.set(new Set());
    this.collDateControl.reset(null, { emitEvent: false });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
      });
  }
}
