import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { AntqlQueryFilterComponent, AntqlFilterData } from './components/antql-query-filter/antql-query-filter';
import { Subject, takeUntil } from 'rxjs';
import { AntqlQueryService } from './services/antql-query.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  UnitDonorTestedAntigenResponse,
  ScheduledTest,
  UnscheduledTest,
  DonorTest
} from './models/antql-query.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';

@Component({
  selector: 'app-antql-query',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent
  ],
  templateUrl: './antql-query.html',
  styleUrl: './antql-query.scss'
})
export class AntqlQuery implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `antql-query-${AntqlQuery.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(AntqlQueryService);
  private loggingService = inject(LoggingService);
  private snackbarService = inject(SnackbarService);
  private pageHeaderService = inject(PageHeaderService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        const breadcrumbs = [
          { label: 'Home', link: '/home' },
          { label: pageData.title, link: null }
        ];

        this.headerConfig = {
          breadcrumbs,
          title: pageData.title,
          subtitle: pageData.subtitle || 'View unit and donor antigen test history, including prior donor results and ABO/RH or CMV findings.',
          actions: []
        };
      }
    });
  }

  protected readonly unitId = signal<string | null>(null);
  protected readonly collectionDate = signal<string | null>(null);
  protected readonly scheduledTests = signal<ScheduledTest[]>([]);
  protected readonly unscheduledTests = signal<UnscheduledTest[]>([]);
  protected readonly donorTests = signal<DonorTest[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasSearched = signal<boolean>(false);

  protected readonly selectedTestId = signal<string | null>(null);

  protected readonly availableTestIds = computed(() => {
    const ids = new Set<string>();
    this.scheduledTests().forEach(r => ids.add(r.testId));
    this.unscheduledTests().forEach(r => ids.add(r.testId));
    this.donorTests().forEach(r => ids.add(r.testId));
    return Array.from(ids).sort();
  });

  protected readonly filteredScheduledTests = computed(() => {
    const f = this.selectedTestId();
    return f ? this.scheduledTests().filter(r => r.testId === f) : this.scheduledTests();
  });
  protected readonly filteredUnscheduledTests = computed(() => {
    const f = this.selectedTestId();
    return f ? this.unscheduledTests().filter(r => r.testId === f) : this.unscheduledTests();
  });
  protected readonly filteredDonorTests = computed(() => {
    const f = this.selectedTestId();
    return f ? this.donorTests().filter(r => r.testId === f) : this.donorTests();
  });

  protected readonly hasResults = computed(() =>
    this.scheduledTests().length > 0 ||
    this.unscheduledTests().length > 0 ||
    this.donorTests().length > 0
  );
  protected readonly isEmpty = computed(() =>
    !this.loading() && this.hasSearched() && !this.hasResults() && !this.error()
  );
  protected readonly isReady = computed(() => !this.loading() && !this.error());

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params['unitId'];
        if (id) {
          this.unitId.set(id);
          this.loadTestedAntigens(id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUnitIdValidated(data: UnitValidationResponse): void {
    if (data.parsedUnitId) {
      this.unitId.set(data.parsedUnitId);
      this.loadTestedAntigens(data.parsedUnitId);
    }
  }

  private loadTestedAntigens(unitId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    this.service.queryTestedAntigens(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: UnitDonorTestedAntigenResponse) => {
          this.collectionDate.set(data.collectionDate);
          this.scheduledTests.set(data.scheduledTests || []);
          this.unscheduledTests.set(data.unscheduledTests || []);
          this.donorTests.set(data.donorTests || []);
          this.loading.set(false);

          if (!this.hasResults()) {
            this.loggingService.log('No test results found for unit', { unitId });
          }
        },
        error: (err) => {
          this.loggingService.error('Error loading tested antigens', err);
          const errorMessage = this.getErrorMessage(err);
          this.error.set(errorMessage);
          this.loading.set(false);
          this.clearResults();
        }
      });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 404) {
      if (err.message?.includes('No test data found')) {
        return 'No test results found for this unit';
      }
      return 'Unit not found. Please verify the unit ID.';
    }
    return err.message || 'Failed to load tested antigens. Please try again.';
  }

  private clearResults(): void {
    this.collectionDate.set(null);
    this.scheduledTests.set([]);
    this.unscheduledTests.set([]);
    this.donorTests.set([]);
  }

  onClear(): void {
    this.unitId.set(null);
    this.clearResults();
    this.error.set(null);
    this.hasSearched.set(false);
    this.selectedTestId.set(null);

    if (this.unitIdField) {
      this.unitIdField.clear();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'merge'
    });
  }

  onRetry(): void {
    const id = this.unitId();
    if (id) {
      this.loadTestedAntigens(id);
    }
  }

  private readonly monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const parts = dateString.split('T')[0]?.split('-');
    if (!parts || parts.length !== 3) return dateString;
    const month = this.monthNames[parseInt(parts[1], 10) - 1];
    return `${parts[2]}-${month}-${parts[0]}`;
  }

  formatDateTime(dateString: string | null): string {
    if (!dateString) return '-';
    const [datePart, timePart] = dateString.split('T');
    const parts = datePart?.split('-');
    if (!parts || parts.length !== 3) return dateString;
    const month = this.monthNames[parseInt(parts[1], 10) - 1];
    const time = timePart ? timePart.substring(0, 8) : '00:00:00';
    return `${parts[2]}-${month}-${parts[0]} ${time}`;
  }

  openFilter(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const dialogWidth = 400;
    const spacing = 8;
    const left = Math.min(rect.left, window.innerWidth - dialogWidth - spacing);

    const data: AntqlFilterData = {
      testIds: this.availableTestIds(),
      selectedTestId: this.selectedTestId()
    };

    const dialogRef = this.dialog.open(AntqlQueryFilterComponent, {
      width: `${dialogWidth}px`,
      maxWidth: '90vw',
      panelClass: 'filter-dialog',
      backdropClass: 'cdk-overlay-transparent-backdrop',
      hasBackdrop: true,
      data,
      position: {
        top: `${rect.bottom + spacing}px`,
        left: `${left}px`,
      },
    });

    dialogRef.afterClosed().subscribe((result: string | null | undefined) => {
      if (result !== undefined) {
        this.selectedTestId.set(result);
      }
    });
  }
}
