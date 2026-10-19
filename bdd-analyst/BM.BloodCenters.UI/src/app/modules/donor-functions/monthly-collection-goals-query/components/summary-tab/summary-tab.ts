import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  signal,
  computed,
  inject,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { MonthlyCollectionGoalsService } from '../../services/monthly-collection-goals.service';
import {
  MonthlySummaryRow,
  SummaryTabResponse,
  SummaryTabType,
  SUMMARY_TAB_CONFIG,
  MONTH_ABBREVIATIONS
} from '../../models/monthly-collection-goals.model';

@Component({
  selector: 'app-summary-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './summary-tab.html',
  styleUrls: ['./summary-tab.scss']
})
export class SummaryTabComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) tabType!: SummaryTabType;
  @Input() yearOptions: number[] = [];
  @Input() isActive = false;

  private readonly fb = inject(FormBuilder);
  private readonly goalsService = inject(MonthlyCollectionGoalsService);
  private readonly destroy$ = new Subject<void>();

  // Form
  filterForm!: FormGroup;

  // State
  isLoading = signal(false);
  hasSearched = signal(false);

  // Data
  rows = signal<MonthlySummaryRow[]>([]);
  totals = signal<MonthlySummaryRow | null>(null);
  grandTotal = signal(0);

  // Sort state
  sortColumn = signal<string>('goalsFor');
  sortDirection = signal<'asc' | 'desc' | 'default'>('default');

  // Constants
  monthAbbreviations = MONTH_ABBREVIATIONS;

  // Computed
  goalsForHeader = computed(() => SUMMARY_TAB_CONFIG[this.tabType]?.goalsForHeader || 'Goals For');
  hasResults = computed(() => this.rows().length > 0);

  sortedRows = computed(() => {
    const data = [...this.rows()];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (direction === 'default') {
      return data;
    }

    return data.sort((a, b) => {
      const aVal = this.getRowValue(a, column);
      const bVal = this.getRowValue(b, column);

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  });

  private getRowValue(row: MonthlySummaryRow, column: string): string | number {
    switch (column) {
      case 'goalsFor': return row.goalsFor;
      case 'january': return row.january;
      case 'february': return row.february;
      case 'march': return row.march;
      case 'april': return row.april;
      case 'may': return row.may;
      case 'june': return row.june;
      case 'july': return row.july;
      case 'august': return row.august;
      case 'september': return row.september;
      case 'october': return row.october;
      case 'november': return row.november;
      case 'december': return row.december;
      case 'total': return row.total;
      default: return '';
    }
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Auto-load when tab becomes active and hasn't been searched yet
    if (changes['isActive'] && this.isActive && !this.hasSearched()) {
      // Only auto-retrieve if form is valid
      if (this.filterForm?.valid) {
        this.retrieve();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const currentYear = new Date().getFullYear();

    this.filterForm = this.fb.group({
      year: [currentYear, [Validators.required, Validators.pattern(/^\d{4}$/)]]
    });
  }

  retrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.hasSearched.set(true);

    const request = {
      year: this.filterForm.value.year
    };

    const serviceMethod = this.getServiceMethod();

    serviceMethod(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SummaryTabResponse) => {
          if (response) {
            const rows = Array.isArray(response.rows) ? response.rows : [];
            this.rows.set(rows);
            this.totals.set(response.totals || null);
            this.grandTotal.set(response.grandTotal || 0);
          } else {
            this.rows.set([]);
            this.totals.set(null);
            this.grandTotal.set(0);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.totals.set(null);
          this.grandTotal.set(0);
          this.isLoading.set(false);
        }
      });
  }

  private getServiceMethod(): (request: { year: number }) => ReturnType<typeof this.goalsService.getByDonationType> {
    switch (this.tabType) {
      case 'donation-type':
        return (req) => this.goalsService.getByDonationType(req);
      case 'procedure-type':
        return (req) => this.goalsService.getByProcedureType(req);
      case 'territories':
        return (req) => this.goalsService.getTerritories(req);
      case 'fixed-sites':
        return (req) => this.goalsService.getFixedSites(req);
      default:
        return (req) => this.goalsService.getByDonationType(req);
    }
  }

  toggleSort(column: string): void {
    if (this.sortColumn() === column) {
      // Cycle: default -> asc -> desc -> default
      const current = this.sortDirection();
      if (current === 'default') {
        this.sortDirection.set('asc');
      } else if (current === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortDirection.set('default');
      }
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() === column && this.sortDirection() !== 'default') {
      switch (this.sortDirection()) {
        case 'asc':
          return 'arrow_upward';
        case 'desc':
          return 'arrow_downward';
        default:
          return 'unfold_more';
      }
    }
    // Show unfold_more for sortable columns not currently sorted
    return 'unfold_more';
  }

  getSortAriaLabel(column: string): string {
    const header = column === 'goalsFor' ? this.goalsForHeader() : column;

    if (this.sortColumn() !== column) {
      return `Sort by ${header}`;
    }

    switch (this.sortDirection()) {
      case 'asc': return `${header} sorted ascending, click to sort descending`;
      case 'desc': return `${header} sorted descending, click to remove sort`;
      default: return `Sort by ${header}`;
    }
  }

  getMonthValue(row: MonthlySummaryRow, monthIndex: number): number {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ] as const;

    return row[months[monthIndex]];
  }

  trackByGoalsFor(index: number, row: MonthlySummaryRow): string {
    return row.goalsForId || row.goalsFor;
  }
}
