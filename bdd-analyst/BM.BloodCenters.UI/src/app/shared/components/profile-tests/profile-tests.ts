import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { TubesCheckInService } from '../../../modules/laboratory-functions/sample-management/regional-sample-tracking/tubes-check-in/services/tubes-check-in.service';
import { TestLookupDto } from '../../../modules/laboratory-functions/sample-management/regional-sample-tracking/tubes-check-in/models/tubes-check-in.model';

export interface ProfileTest {
  testName: string;
  testCode: string;
}

export interface ProfileTestsData {
  profileTests: ProfileTest[];
  additionalTests: ProfileTest[];
}

interface ProfileTestRow {
  profileTest: string;
  additionalTest: string;
}

/**
 * Profile Tests Panel Component
 * Displays contract profile tests and additional tests side-by-side
 *
 * API Endpoints:
 * - GET /regional-tubes/contract-tests/{contractId}?profileSetId={profileSetId} - Base profile tests
 * - GET /regional-tubes/additional-tests/{contractId} - Additional tests available for contract
 */
@Component({
  selector: 'app-profile-tests',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './profile-tests.html',
  styleUrl: './profile-tests.scss'
})
export class ProfileTestsComponent implements OnInit, OnDestroy, OnChanges {
  private readonly tubesService = inject(TubesCheckInService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Inputs for API call parameters
  @Input() contractId: string | null = null;
  @Input() profileSetId: string | null = null;
  @Input() dialogTitleId: string = 'profile-tests-title';

  // Legacy inputs (for backward compatibility if data is passed directly)
  @Input() set profileTests(value: ProfileTest[]) {
    this._profileTests.set(value || []);
  }
  @Input() set additionalTests(value: ProfileTest[]) {
    this._additionalTests.set(value || []);
  }

  @Output() closePanel = new EventEmitter<void>();

  // State signals
  private _profileTests = signal<ProfileTest[]>([]);
  private _additionalTests = signal<ProfileTest[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    if (this.contractId) {
      this.loadTests();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload tests when contractId or profileSetId changes
    if (
      (changes['contractId'] && !changes['contractId'].firstChange) ||
      (changes['profileSetId'] && !changes['profileSetId'].firstChange)
    ) {
      if (this.contractId) {
        this.loadTests();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Create rows with profile tests and additional tests side by side
  tableData = computed<ProfileTestRow[]>(() => {
    const profileTests = this._profileTests();
    const additionalTests = this._additionalTests();
    const maxLength = Math.max(profileTests.length, additionalTests.length);

    const rows: ProfileTestRow[] = [];
    for (let i = 0; i < maxLength; i++) {
      const pt = profileTests[i];
      const at = additionalTests[i];
      rows.push({
        profileTest: pt ? `${pt.testCode} - ${pt.testName}` : '',
        additionalTest: at ? `${at.testCode} - ${at.testName}` : ''
      });
    }

    return rows;
  });

  // Table configuration (data and isLoading passed separately as inputs)
  tableConfig: DataTableConfig<ProfileTestRow> = {
    columns: [
      {
        key: 'profileTest',
        header: 'Profile Tests',
        sortable: false,
        width: '50%'
      },
      {
        key: 'additionalTest',
        header: 'Additional Tests',
        sortable: false,
        width: '50%'
      }
    ],
    showPagination: false,
    stickyHeader: true,
    noDataIcon: 'science',
    emptyMessage: 'No data available',
    loadingMessage: 'Loading tests...',
    showTableOnEmpty: true
  };

  onClose(): void {
    this.closePanel.emit();
  }

  /**
   * Load both profile tests and additional tests from API
   * Follows the same pattern as BatchCommentsPanelComponent.loadComments()
   */
  private loadTests(): void {
    if (!this.contractId) return;

    this.isLoading.set(true);

    // Call both APIs in parallel (similar to BatchCommentsPanelComponent pattern)
    forkJoin({
      profileTests: this.tubesService.getContractTests(this.contractId, this.profileSetId || undefined),
      additionalTests: this.tubesService.getAdditionalTests(this.contractId)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Map TestLookupDto[] to ProfileTest[] (testId → testCode, testDesc → testName)
          this._profileTests.set(
            (data.profileTests || []).map(test => ({
              testCode: test.testId,
              testName: test.testDesc
            }))
          );

          this._additionalTests.set(
            (data.additionalTests || []).map(test => ({
              testCode: test.testId,
              testName: test.testDesc
            }))
          );

          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading tests:', error);
          this._profileTests.set([]);
          this._additionalTests.set([]);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        }
      });
  }
}
