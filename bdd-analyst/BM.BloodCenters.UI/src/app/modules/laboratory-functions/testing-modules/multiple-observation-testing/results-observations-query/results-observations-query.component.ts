import { Component, OnInit, OnDestroy, ViewChild, inject, signal, effect, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

import { ResultsObservationsApiService } from './services/results-observations-api.service';
import {
  TestForUnit,
  TestBatch,
  TestBandResponse
} from './models/results-observations.interface';

@Component({
  selector: 'app-results-observations-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './results-observations-query.component.html',
  styleUrl: './results-observations-query.component.scss',
})
export class ResultsObservationsQueryComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ResultsObservationsApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private currentUnitId = '';

  // Signals
  readonly isLoading = signal(false);
  readonly isLoadingBatches = signal(false);
  readonly isLoadingBandDetails = signal(false);
  readonly hasResults = signal(false);
  readonly testsAvailable = signal(false);
  readonly availableTests = signal<TestForUnit[]>([]);
  readonly testBatches = signal<TestBatch[]>([]);
  readonly selectedBatchIndex = signal<number>(-1);
  readonly selectedBatch = signal<TestBatch | null>(null);
  readonly bandDetails = signal<TestBandResponse | null>(null);

  // Form Controls
  testIdControl = new FormControl('');
  testSearchControl = new FormControl('');
  selectedTestDescription = '';

  // Filtered tests based on search
  readonly filteredTests = computed(() => {
    const searchTerm = this.testSearchControl.value?.toLowerCase() || '';
    if (!searchTerm) {
      return this.availableTests();
    }
    return this.availableTests().filter(test =>
      test.testId.toLowerCase().includes(searchTerm) ||
      test.testDesc.toLowerCase().includes(searchTerm)
    );
  });

  // Notes editing state
  readonly isEditingNote = signal(false);
  readonly noteText = signal('');
  readonly isSavingNote = signal(false);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: ''
  };

  constructor() {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: 'Laboratory Functions', link: null },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || 'View observation results, band entries, notes, test results, dates, and control values for units with confirmatory tests involving multiple observations.'
        };
      }
    });
  }

  ngOnInit(): void {
    // Clear results when chapter changes
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Called after unit ID is validated
   */
  onUnitValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    if (!unitId) return;

    this.currentUnitId = unitId;
    this.isLoading.set(true);

    // Step 1: Validate unit has completed test results
    this.apiService.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Step 2: Load available tests for this unit
            this.loadTestsForUnit(unitId);
          } else {
            this.isLoading.set(false);
            this.clearResults();
            const errorMsg = response.errorCode === '9784'
              ? 'Unit does not have any tests of this type'
              : response.message || 'Unit validation failed';
            this.snackbarService.showError(errorMsg);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.clearResults();
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while validating the unit. Please ensure the backend API is running on port 8000.')
          );
        }
      });
  }


  /**
   * Called when a test is selected from the dropdown
   */
  onTestSelected(): void {
    const selectedTestId = this.testIdControl.value;
    if (!selectedTestId) return;

    // Update description field
    const selectedTest = this.availableTests().find(t => t.testId === selectedTestId);
    this.selectedTestDescription = selectedTest?.testDesc || '';

    // Step 3: Load test batches for the selected test
    this.loadTestBatches(this.currentUnitId, selectedTestId);
  }

  /**
   * Select a test batch and load its band details
   */
  selectBatch(index: number): void {
    this.selectedBatchIndex.set(index);
    const batch = this.testBatches()[index];
    this.selectedBatch.set(batch);

    // Step 4: Load band details for the selected batch
    this.loadBandDetails(batch.unitId, batch.testId, batch.tbId, batch.tbSeqNo);
  }

  /**
   * Cancel button handler
   */
  onCancel(): void {
    this.clearAll();
  }

  /**
   * Save button handler (placeholder - implement as needed)
   */
  onSave(): void {
    this.snackbarService.showSuccess('Results saved successfully');
  }

  /**
   * Start editing an existing note
   */
  onEditNote(): void {
    this.isEditingNote.set(true);
    this.noteText.set(this.bandDetails()?.noteDetails?.note || '');
  }

  /**
   * Save note (create or update)
   */
  onSaveNote(): void {
    const batch = this.selectedBatch();
    const bandData = this.bandDetails();

    if (!batch || !bandData) return;

    const noteTextValue = this.noteText().trim();
    if (!noteTextValue) {
      this.snackbarService.showError('Note text cannot be empty');
      return;
    }

    this.isSavingNote.set(true);

    // If noteId exists, update; otherwise create
    if (bandData.noteId) {
      // Update existing note
      this.apiService.updateNote(bandData.noteId, { note: noteTextValue })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.isSavingNote.set(false);
            if (response.success) {
              this.snackbarService.showSuccess('Note updated successfully');
              this.isEditingNote.set(false);
              this.noteText.set('');
              // Refresh band details to show updated note
              this.loadBandDetails(batch.unitId, batch.testId, batch.tbId, batch.tbSeqNo);
            } else {
              this.snackbarService.showError(response.message || 'Failed to update note');
            }
          },
          error: (error: any) => {
            this.isSavingNote.set(false);
            this.snackbarService.showError(
              HttpErrorHandler.extractErrorMessage(error, 'An error occurred while updating the note')
            );
          }
        });
    } else {
      // Create new note
      const createRequest = {
        unitId: batch.unitId,
        testId: batch.testId,
        tbId: batch.tbId,
        tbSeqNo: batch.tbSeqNo,
        testChapterId: bandData.testChapterId || '',
        note: noteTextValue
      };

      this.apiService.createNote(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.isSavingNote.set(false);
            if (response.success) {
              this.snackbarService.showSuccess('Note created successfully');
              this.isEditingNote.set(false);
              this.noteText.set('');
              // Refresh band details to show new note
              this.loadBandDetails(batch.unitId, batch.testId, batch.tbId, batch.tbSeqNo);
            } else {
              this.snackbarService.showError(response.message || 'Failed to create note');
            }
          },
          error: (error: any) => {
            this.isSavingNote.set(false);
            this.snackbarService.showError(
              HttpErrorHandler.extractErrorMessage(error, 'An error occurred while creating the note')
            );
          }
        });
    }
  }

  /**
   * Delete note
   */
  onDeleteNote(): void {
    const batch = this.selectedBatch();
    const bandData = this.bandDetails();

    if (!batch || !bandData?.noteId) return;

    this.isSavingNote.set(true);

    this.apiService.deleteNote(
      bandData.noteId,
      batch.unitId,
      batch.testId,
      batch.tbId,
      batch.tbSeqNo,
      bandData.testChapterId || ''
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isSavingNote.set(false);
          if (response.success) {
            this.snackbarService.showSuccess('Note deleted successfully');
            this.isEditingNote.set(false);
            this.noteText.set('');
            // Refresh band details to clear note
            this.loadBandDetails(batch.unitId, batch.testId, batch.tbId, batch.tbSeqNo);
          } else {
            this.snackbarService.showError(response.message || 'Failed to delete note');
          }
        },
        error: (error: any) => {
          this.isSavingNote.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while deleting the note')
          );
        }
      });
  }



  /**
   * Load available tests for a unit
   */
  private loadTestsForUnit(unitId: string): void {
    this.apiService.getTestsForUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success && response.item) {
            const tests = response.item;
            this.availableTests.set(tests);
            this.testsAvailable.set(tests.length > 0);

            // If only one test, auto-select it
            if (tests.length === 1) {
              const test = tests[0];
              this.testIdControl.setValue(test.testId);
              this.selectedTestDescription = test.testDesc;
              this.loadTestBatches(unitId, test.testId);
            } else if (tests.length === 0) {
              this.snackbarService.showInfo('No tests available for this unit');
            }
          } else {
            this.clearResults();
            this.snackbarService.showError(response.message || 'Failed to load tests');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.clearResults();
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while loading tests')
          );
        }
      });
  }

  /**
   * Load test batches for a unit+test combination
   */
  private loadTestBatches(unitId: string, testId: string): void {
    this.isLoadingBatches.set(true);

    this.apiService.getTestBatches(unitId, testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingBatches.set(false);
          if (response.success && response.item) {
            const batches = response.item;
            this.testBatches.set(batches);
            this.hasResults.set(batches.length > 0);

            // Auto-select the first batch
            if (batches.length > 0) {
              this.selectBatch(0);
            } else {
              this.snackbarService.showInfo('No test batches found');
              this.selectedBatchIndex.set(-1);
              this.selectedBatch.set(null);
              this.bandDetails.set(null);
            }
          } else {
            this.testBatches.set([]);
            this.hasResults.set(false);
            this.snackbarService.showError(response.message || 'Failed to load test batches');
          }
        },
        error: (error) => {
          this.isLoadingBatches.set(false);
          this.testBatches.set([]);
          this.hasResults.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while loading test batches')
          );
        }
      });
  }

  /**
   * Load band details for a specific test batch
   */
  private loadBandDetails(
    unitId: string,
    testId: string,
    tbId: string,
    tbSeqNo: number
  ): void {
    this.isLoadingBandDetails.set(true);

    this.apiService.getBandDetails(unitId, testId, tbId, tbSeqNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingBandDetails.set(false);
          if (response.success && response.item) {
            const details = response.item;
            this.bandDetails.set(details);
            // Note is part of bandDetails response - displayed directly via template
          } else {
            this.bandDetails.set(null);
            if (response.statusCode !== 404) {
              this.snackbarService.showError(response.message || 'Failed to load band details');
            }
          }
        },
        error: (error) => {
          this.isLoadingBandDetails.set(false);
          this.bandDetails.set(null);
          // Don't show error snackbar for 404
          if (error.status !== 404) {
            this.snackbarService.showError(
              HttpErrorHandler.extractErrorMessage(error, 'An error occurred while loading band details')
            );
          }
        }
      });
  }

  /**
   * Clear results but keep unit ID
   */
  private clearResults(): void {
    this.testsAvailable.set(false);
    this.availableTests.set([]);
    this.testIdControl.setValue('');
    this.selectedTestDescription = '';
    this.testBatches.set([]);
    this.selectedBatchIndex.set(-1);
    this.selectedBatch.set(null);
    this.bandDetails.set(null);
    this.hasResults.set(false);
  }

  onUnitCleared(): void {
    this.resetState();
  }

  clearAll(): void {
    this.resetState();
    this.unitIdField?.clear();
  }

  private resetState(): void {
    this.currentUnitId = '';
    this.isEditingNote.set(false);
    this.noteText.set('');
    this.testSearchControl.setValue('');
    this.selectedTestDescription = '';
    this.clearResults();
  }
}
