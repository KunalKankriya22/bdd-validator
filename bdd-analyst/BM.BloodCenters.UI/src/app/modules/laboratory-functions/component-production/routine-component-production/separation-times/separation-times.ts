import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';

import { formatTableDate, formatTableDateTime } from '@shared/utils/date-format.util';
import { SeparationTimesService } from './services/separation-times.service';
import {
  CentrifugeDto,
  RecordSeparationRequestDto,
  SeparationTimeDisplay
} from './models/separation-times.model';

@Component({
  selector: 'app-separation-times',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NgxMatSelectSearchModule,
    UnitIdFieldComponent,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './separation-times.html',
  styleUrl: './separation-times.scss'
})
export class SeparationTimesComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `separation-times-${SeparationTimesComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly separationService = inject(SeparationTimesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly pageHeaderService = inject(PageHeaderService);
  protected readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly defaultTitle = 'Separation Times';

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  protected readonly centrifugeControl = new FormControl<string | null>(null);
  protected readonly rowCentrifugeControl = new FormControl<string | null>(null);
  protected readonly centrifugeSearchCtrl = new FormControl('');
  protected readonly rowCentrifugeSearchCtrl = new FormControl('');

  protected readonly centrifuges = signal<CentrifugeDto[]>([]);
  private readonly centrifugeSearch = signal('');
  private readonly rowCentrifugeSearch = signal('');

  protected readonly filteredCentrifuges = computed(() => {
    const search = this.centrifugeSearch();
    const centrifuges = this.centrifuges();
    if (!search) return centrifuges;
    const lower = search.toLowerCase();
    return centrifuges.filter(c => {
      const id = (c.equipId || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      return id.includes(lower) || desc.includes(lower);
    });
  });
  protected readonly selectedCentrifuge = signal<string | null>(null);
  protected readonly scanEntryVisible = computed(() => this.selectedCentrifuge() !== null);
  protected readonly scannedEntries = signal<SeparationTimeDisplay[]>([]);
  protected readonly currentScanEntry = signal<SeparationTimeDisplay | null>(null);
  protected readonly duplicateError = signal<string | null>(null);
  protected readonly isProcessing = signal(false);
  protected readonly savedCount = signal(0);
  protected readonly chapterTimezone = signal<string>('');

  protected readonly displayedColumns = [
    'unitId', 'collectionDate', 'centrifugeId',
    'bleedStartTime', 'firstSeparationTime', 'secondSeparationTime'
  ];
  protected currentPageSize = 10;
  protected readonly pageSizeOptions = [10, 25, 50, 100];
  protected currentPage = 0;

  protected readonly sortState = signal<{ active: string; direction: 'asc' | 'desc' | '' }>({
    active: '',
    direction: ''
  });

  protected readonly sortedData = computed(() => {
    const entries = this.scannedEntries();
    const sort = this.sortState();

    if (!sort.active || sort.direction === '') {
      return entries;
    }

    const data = entries.slice();
    return data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const key = sort.active as keyof SeparationTimeDisplay;
      return this.compare(a[key], b[key], isAsc);
    });
  });

  constructor() {
    this.initializeHeaderConfig();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || this.defaultTitle, link: null }
          ],
          title: pageData.title || this.defaultTitle,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadCentrifuges();
    this.subscribeToChapterChanges();
    this.updateTimezone();

    // Subscribe to centrifuge search controls
    this.centrifugeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.centrifugeSearch.set(v || ''));

    this.rowCentrifugeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.rowCentrifugeSearch.set(v || ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeHeaderConfig(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: this.defaultTitle, link: null }
      ],
      title: this.defaultTitle,
      subtitle: '',
      actions: []
    };
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleChapterChange();
      });
  }

  private updateTimezone(): void {
    const tz = this.headerService.getCurrentChapterTimezone?.() || '';
    this.chapterTimezone.set(tz);
  }

  private handleChapterChange(): void {
    if (this.unitIdField) {
      this.unitIdField.clear();
    }

    this.centrifugeControl.setValue(null);
    this.rowCentrifugeControl.setValue(null);
    this.selectedCentrifuge.set(null);
    this.scannedEntries.set([]);
    this.currentScanEntry.set(null);
    this.duplicateError.set(null);
    this.savedCount.set(0);
    this.isProcessing.set(false);
    this.currentPage = 0;
    this.sortState.set({ active: '', direction: '' });

    this.centrifuges.set([]);
    this.loadCentrifuges();
    this.updateTimezone();
  }

  private loadCentrifuges(): void {
    this.separationService.getCentrifuges()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.centrifuges.set(data);
        },
        error: () => {
          this.showError('Failed to load centrifuges');
        }
      });
  }

  protected onCentrifugeSelectOpenedChange(opened: boolean): void {
    if (opened) {
      this.centrifugeSearchCtrl.setValue('');
    }
  }

  protected onRowCentrifugeSelectOpenedChange(opened: boolean): void {
    if (opened) {
      this.rowCentrifugeSearchCtrl.setValue('');
    }
  }

  protected onCentrifugeSelected(centrifugeId: string): void {
    this.selectedCentrifuge.set(centrifugeId);
    this.rowCentrifugeControl.setValue(centrifugeId);
    this.scannedEntries.set([]);
    this.currentScanEntry.set(null);
    this.duplicateError.set(null);
    this.savedCount.set(0);
    this.currentPage = 0;
    this.sortState.set({ active: '', direction: '' });
  }

  protected onUnitValidated(data: UnitValidationResponse): void {
    const parsedId = data.parsedUnitId;

    const alreadyScanned = this.scannedEntries().some(
      entry => entry.unitId === parsedId
    );

    if (alreadyScanned) {
      this.duplicateError.set('This Unit ID has already scanned');
      return;
    }

    this.duplicateError.set(null);
    this.isProcessing.set(true);

    const centrifugeId = this.rowCentrifugeControl.value || this.selectedCentrifuge()!;

    const request: RecordSeparationRequestDto = {
      unitId: parsedId,
      centrifugeId: centrifugeId
    };

    this.separationService.recordSeparation(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const entry: SeparationTimeDisplay = {
            unitId: response.unitId,
            collectionDate: formatTableDate(response.collDate),
            centrifugeId: centrifugeId,
            bleedStartTime: formatTableDateTime(response.bleedStartTime),
            firstSeparationTime: response.firstSepDuration || formatTableDateTime(response.firstSepTime) || '-',
            secondSeparationTime: response.secondSepDuration || formatTableDateTime(response.secondSepTime) || '-',
            firstSepDuration: response.firstSepDuration || '',
            secondSepDuration: response.secondSepDuration || '',
            separationRecorded: response.firstSepTime && response.secondSepTime
              ? 'SECOND'
              : response.firstSepTime
                ? 'FIRST'
                : undefined
          };

          this.currentScanEntry.set(entry);
          this.scannedEntries.update(entries => [entry, ...entries]);

          const newCount = this.savedCount() + 1;
          this.savedCount.set(newCount);
          this.showSuccess(`${newCount} ${newCount === 1 ? 'Entry' : 'Entries'} saved`);

          this.isProcessing.set(false);
          this.resetForNextScan();
        },
        error: (error) => {
          this.isProcessing.set(false);

          const errorMessage = error?.error?.message
            || error?.message
            || 'Failed to record separation time';

          if (errorMessage.toLowerCase().includes('all separations')) {
            this.showInfo(errorMessage);
          } else {
            this.showError(errorMessage);
          }

          if (this.unitIdField) {
            this.unitIdField.clear();
          }
        }
      });
  }

  protected onUnitCleared(): void {
    this.currentScanEntry.set(null);
    this.duplicateError.set(null);
  }

  protected onClearAll(): void {
    this.scannedEntries.set([]);
    this.currentScanEntry.set(null);
    this.duplicateError.set(null);
    this.savedCount.set(0);
    this.currentPage = 0;
    this.sortState.set({ active: '', direction: '' });
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
  }

  private resetForNextScan(): void {
    if (this.unitIdField) {
      this.unitIdField.clear();
    }
    // Keep currentScanEntry to show the last scanned item's details
    this.currentScanEntry.set(null);
    this.duplicateError.set(null);
    this.rowCentrifugeControl.setValue(this.selectedCentrifuge());
  }

  protected onSortChange(sort: Sort): void {
    this.sortState.set({
      active: sort.active,
      direction: sort.direction as 'asc' | 'desc' | ''
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.currentPageSize = event.pageSize;
  }

  private compare(a: string | number | undefined, b: string | number | undefined, isAsc: boolean): number {
    const valA = a ?? '';
    const valB = b ?? '';
    return (valA < valB ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'CLOSE', {
      duration: 7000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }

  protected getPaginatedData(): SeparationTimeDisplay[] {
    const data = this.sortedData();
    const startIndex = this.currentPage * this.currentPageSize;
    return data.slice(startIndex, startIndex + this.currentPageSize);
  }
}
