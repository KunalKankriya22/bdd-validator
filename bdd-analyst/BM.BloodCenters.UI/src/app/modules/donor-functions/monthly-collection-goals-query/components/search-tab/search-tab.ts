import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { MonthlyCollectionGoalsService } from '../../services/monthly-collection-goals.service';
import {
  GoalTypeLookup,
  CustodianLookup,
  MonthlyGoalSummary,
  GoalDetail
} from '../../models/monthly-collection-goals.model';

@Component({
  selector: 'app-search-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './search-tab.html',
  styleUrls: ['./search-tab.scss']
})
export class SearchTabComponent implements OnInit, OnDestroy {
  @Input() yearOptions: number[] = [];

  private readonly fb = inject(FormBuilder);
  private readonly goalsService = inject(MonthlyCollectionGoalsService);
  private readonly destroy$ = new Subject<void>();

  // Form
  filterForm!: FormGroup;

  // Lookups
  goalTypes = signal<GoalTypeLookup[]>([]);
  custodians = signal<CustodianLookup[]>([]);

  // State
  isLoading = signal(false);
  isLoadingCustodians = signal(false);
  isLoadingDetails = signal(false);
  hasSearched = signal(false);

  // Left Panel - Month Summary
  custodianName = signal('');
  goalTypeDescription = signal('');
  selectedYear = signal<string>(String(new Date().getFullYear()));
  monthlySummary = signal<MonthlyGoalSummary[]>([]);
  selectedMonth = signal<MonthlyGoalSummary | null>(null);

  // Right Panel - Month Details
  monthDetails = signal<GoalDetail[]>([]);
  filteredDetails = signal<GoalDetail[]>([]);
  searchText = signal('');

  // Sort state
  sortColumn = signal<string>('donationTypeDescription');
  sortDirection = signal<'asc' | 'desc' | 'default'>('default');

  // Table columns for detail view
  displayedColumns = [
    'donationType',
    'donationTypeDescription',
    'procedureCode',
    'procedureCodeDescription',
    'bloodType',
    'bloodTypeDescription',
    'goalCount'
  ];

  // Computed
  selectedMonthName = computed(() => this.selectedMonth()?.month || '');
  hasResults = computed(() => this.monthlySummary().length > 0);

  // Goals For field should be disabled when: no goal type selected OR loading OR no custodians available
  isCustodiansDisabled = computed(() => {
    const goalType = this.filterForm?.get('goalType')?.value;
    return !goalType || this.isLoadingCustodians() || this.custodians().length === 0;
  });

  sortedDetails = computed(() => {
    const data = [...this.filteredDetails()];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (direction === 'default') {
      return data;
    }

    return data.sort((a, b) => {
      const key = column as keyof GoalDetail;
      const aVal = a[key];
      const bVal = b[key];

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

  ngOnInit(): void {
    this.initializeForm();
    this.loadGoalTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const currentYear = new Date().getFullYear();

    this.filterForm = this.fb.group({
      goalType: ['', Validators.required],
      custodianId: ['', Validators.required],
      year: [currentYear, [Validators.required, Validators.pattern(/^\d{4}$/)]]
    });

    // Load custodians when goal type changes
    this.filterForm.get('goalType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((goalType) => {
        if (goalType) {
          this.loadCustodians(goalType);
        } else {
          this.custodians.set([]);
          this.filterForm.get('custodianId')?.setValue('');
        }
      });
  }

  private loadGoalTypes(): void {
    this.goalsService.getGoalTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          // Ensure we always have an array
          const data = Array.isArray(types) ? types : [];
          this.goalTypes.set(data);
        },
        error: () => this.goalTypes.set([])
      });
  }

  private loadCustodians(goalType: string): void {
    this.isLoadingCustodians.set(true);
    this.filterForm.get('custodianId')?.setValue('');

    this.goalsService.getCustodians(goalType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (custodians) => {
          // Ensure we always have an array
          const data = Array.isArray(custodians) ? custodians : [];
          this.custodians.set(data);
          this.isLoadingCustodians.set(false);

          // Set custom error if no custodians available
          const custodianControl = this.filterForm.get('custodianId');
          if (data.length === 0) {
            custodianControl?.setErrors({ noCustodians: true });
          } else {
            // Clear the noCustodians error if custodians are available
            if (custodianControl?.hasError('noCustodians')) {
              custodianControl.setErrors(null);
            }
          }
        },
        error: () => {
          this.custodians.set([]);
          this.isLoadingCustodians.set(false);
          // Set custom error on API error
          this.filterForm.get('custodianId')?.setErrors({ noCustodians: true });
        }
      });
  }

  retrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.selectedMonth.set(null);
    this.monthDetails.set([]);
    this.filteredDetails.set([]);

    const request = {
      goalType: this.filterForm.value.goalType,
      custodianId: this.filterForm.value.custodianId,
      year: this.filterForm.value.year
    };

    this.goalsService.searchGoals(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response) {
            this.custodianName.set(response.custodianName || '');
            this.goalTypeDescription.set(response.goalTypeDescription || '');
            this.selectedYear.set(response.year || String(request.year));
            const summary = Array.isArray(response.monthlySummaries) ? response.monthlySummaries : [];
            this.monthlySummary.set(summary);
            this.isLoading.set(false);

            // Auto-select first month with data
            const firstMonthWithData = summary.find(m => m.goalCount > 0);
            if (firstMonthWithData) {
              this.selectMonth(firstMonthWithData);
            }
          } else {
            this.isLoading.set(false);
            this.monthlySummary.set([]);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.monthlySummary.set([]);
        }
      });
  }

  selectMonth(month: MonthlyGoalSummary): void {
    this.selectedMonth.set(month);
    this.loadMonthDetails(month);
  }

  private loadMonthDetails(month: MonthlyGoalSummary): void {
    this.isLoadingDetails.set(true);
    this.searchText.set('');
    this.sortDirection.set('default');

    const request = {
      goalType: this.filterForm.value.goalType,
      custodianId: this.filterForm.value.custodianId,
      year: String(this.filterForm.value.year),
      month: parseInt(month.monthNumber, 10)
    };

    this.goalsService.getMonthDetails(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const details = response && Array.isArray(response.details) ? response.details : [];
          this.monthDetails.set(details);
          this.filteredDetails.set(details);
          this.isLoadingDetails.set(false);
        },
        error: () => {
          this.monthDetails.set([]);
          this.filteredDetails.set([]);
          this.isLoadingDetails.set(false);
        }
      });
  }

  onSearchDetails(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchValue = input.value.toLowerCase().trim();
    this.searchText.set(searchValue);

    if (!searchValue) {
      this.filteredDetails.set(this.monthDetails());
      return;
    }

    const filtered = this.monthDetails().filter(detail =>
      detail.donationType?.toLowerCase().includes(searchValue) ||
      detail.donationTypeDescription?.toLowerCase().includes(searchValue) ||
      detail.procedureCode?.toLowerCase().includes(searchValue) ||
      detail.procedureCodeDescription?.toLowerCase().includes(searchValue)
    );

    this.filteredDetails.set(filtered);
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
    return 'unfold_more';
  }

  getSortAriaLabel(column: string): string {
    if (this.sortColumn() !== column) {
      return `Sort by ${column}`;
    }

    switch (this.sortDirection()) {
      case 'asc': return `${column} sorted ascending, click to sort descending`;
      case 'desc': return `${column} sorted descending, click to remove sort`;
      default: return `Sort by ${column}`;
    }
  }

  isMonthSelected(month: MonthlyGoalSummary): boolean {
    return this.selectedMonth()?.month === month.month;
  }

  formatTotal(total: number): string {
    return total.toString().padStart(2, '0');
  }

  // Accessibility
  getMonthAriaLabel(month: MonthlyGoalSummary): string {
    return `${month.month} ${this.selectedYear()}, ${month.goalCount} goals`;
  }
}
