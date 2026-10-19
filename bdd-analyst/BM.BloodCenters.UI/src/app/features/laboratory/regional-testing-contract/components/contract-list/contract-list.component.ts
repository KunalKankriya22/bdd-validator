import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RegionalTestingContractService } from '../../services/regional-testing-contract.service';
import { FilterDialogComponent } from '../dialogs/filter-dialog/filter-dialog.component';
import {
  RegionalTestingContract,
  RegionalTestingContractQueryDto,
  ContractFilter
} from '../../models/regional-testing-contract.models';

/**
 * Contract List Component
 * Main list view for regional testing contracts with filtering and pagination
 */
@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './contract-list.component.html',
  styleUrl: './contract-list.component.scss'
})
export class ContractListComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `contract-list-${ContractListComponent.nextId++}`;

  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(RegionalTestingContractService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Signal-based state
  protected readonly contracts = signal<RegionalTestingContract[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalCount = signal<number>(0);
  protected readonly currentFilter = signal<ContractFilter | null>(null);

  // Pagination state
  protected readonly pageSize = signal<number>(10);
  protected readonly pageIndex = signal<number>(0);
  protected readonly pageSizeOptions = [10, 25, 50, 100];

  // Table configuration
  protected readonly displayedColumns: string[] = [
    'contractId',
    'customerName',
    'chapterId',
    'effDate',
    'termDate',
    'actions'
  ];

  // Computed values
  protected readonly isEmpty = computed(() => this.contracts().length === 0 && !this.loading());
  protected readonly isReady = computed(() => !this.loading() && !this.error());

  filterForm!: FormGroup;
  searchForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadContracts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.filterForm = this.fb.group({
      showTerminated: ['No']
    });

    this.searchForm = this.fb.group({
      searchKeyword: ['']
    });

    // Watch search input
    this.searchForm.get('searchKeyword')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadContracts();
      });
  }

  loadContracts(): void {
    const skip = this.pageIndex() * this.pageSize();
    const take = this.pageSize();

    const query: RegionalTestingContractQueryDto = {
      searchKeyword: this.searchForm.get('searchKeyword')?.value || null,
      showTerminated: this.filterForm.get('showTerminated')?.value === 'Yes',
      sortColumn: 'EffDate',
      sortOrder: 'DESC'
    };

    this.loading.set(true);
    this.error.set(null);

    this.contractService.getContracts(take, skip, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.contracts.set(response.data || []);
          this.totalCount.set(response.totalCount || 0);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load contracts');
          this.loading.set(false);
          this.showError('Failed to load contracts. Please try again.');
        }
      });
  }

  onShowTerminatedChange(): void {
    this.pageIndex.set(0);
    this.loadContracts();
  }

  onClearShowTerminated(): void {
    this.filterForm.patchValue({ showTerminated: 'No' });
    this.pageIndex.set(0);
    this.loadContracts();
  }

  onOpenFilter(): void {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      width: '600px',
      disableClose: false
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((filter: ContractFilter) => {
        if (filter) {
          this.currentFilter.set(filter);
          this.pageIndex.set(0);
          // TODO: Apply advanced filter criteria to API query
          this.loadContracts();
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.loadContracts();
  }

  onAddNewContract(): void {
    this.router.navigate(['/laboratory/regional-testing-contract/create']);
  }

  onEditContract(contract: RegionalTestingContract): void {
    this.router.navigate(['/laboratory/regional-testing-contract/edit', contract.contractId]);
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 0,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, '', {
      duration: 8000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
