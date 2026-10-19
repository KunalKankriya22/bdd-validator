import { Component, signal, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SpProcessesStagesApiService } from './services/sp-processes-stages-api.service';
import { HeaderService } from '@shared/services/header.service';
import { ProcessListComponent } from './components/process-list/process-list.component';
import { StageConfigurationComponent } from './components/stage-configuration/stage-configuration.component';
import {
  Process,
  Stage,
  ProcessStageRecord,
  BulkUpsertRequest,
  BulkUpsertRecordDto,
  BulkUpsertError,
} from './models/sp-processes-stages.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import moment from 'moment';

@Component({
  selector: 'app-sp-processes-stages',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    SearchBar,
    ProcessListComponent,
    StageConfigurationComponent
  ],
  templateUrl: './sp-processes-stages.component.html',
  styleUrls: ['./sp-processes-stages.component.scss']
})
export class SpProcessesStagesComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBar!: SearchBar;
  @ViewChild(StageConfigurationComponent) stageConfigComponent!: StageConfigurationComponent;

  allProcesses = signal<Process[]>([]);
  processes = signal<Process[]>([]);
  selectedProcess = signal<Process | null>(null);
  stages = signal<Stage[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isFormDirty = signal<boolean>(false);

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by process code or description',
    minLength: 1,
    ariaLabel: 'Search processes',
    debounceTime: 300,
    searchOnEnterOnly: true,
    alwaysShowTooltip: true
  };

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: SpProcessesStagesApiService,
    private snackbar: SnackbarService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.loadProcesses();
    this.subscribeToChapterChanges();
  }

  loadProcesses(processCodeToSelect?: string): void {
    this.isLoading.set(true);
    this.apiService.getProcessCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allProcesses.set(data);
          this.applySearch();

          if (processCodeToSelect) {
            const processToSelect = data.find(p => p.code === processCodeToSelect);
            if (processToSelect) {
              this.selectProcessAndLoadStages(processToSelect);
            }
          }

          this.isLoading.set(false);
        },
        error: (error) => {
          this.showErrorMessage(error);
          this.isLoading.set(false);
        }
      });
  }

  onSearch(searchText: string): void {
    if (!searchText) {
      this.processes.set([...this.allProcesses()]);
      const filtered = this.processes();
      if (filtered.length > 0 && !this.selectedProcess()) {
        this.selectProcessAndLoadStages(filtered[0]);
      }
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = this.allProcesses().filter(p =>
        p.code.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
      this.processes.set(filtered);

      if (filtered.length === 0) {
        this.selectedProcess.set(null);
        this.stages.set([]);
      } else {
        this.selectProcessAndLoadStages(filtered[0]);
      }
    }
  }

  private applySearch(): void {
    this.processes.set([...this.allProcesses()]);
    const filtered = this.processes();
    if (filtered.length > 0 && !this.selectedProcess()) {
      this.selectProcessAndLoadStages(filtered[0]);
    }
  }

  onProcessSelected(process: Process): void {
    this.selectProcessAndLoadStages(process);
  }

  private selectProcessAndLoadStages(process: Process): void {
    this.selectedProcess.set(process);
    this.isLoading.set(true);
    this.isFormDirty.set(false);

    this.apiService.getStages({ processCode: process.code })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stages.set(this.mapRecordsToStages(response.data));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.showErrorMessage(error);
          this.stages.set([]);
          this.isLoading.set(false);
        }
      });
  }

  private mapRecordsToStages(records: ProcessStageRecord[]): Stage[] {
    return records.map((record, index) => ({
      sequence: index + 1,
      stageCode: record.stageCode,
      description: record.stageCodeDesc || '',
      effectiveDate: record.effDate ? moment(record.effDate, 'DD-MMM-YYYY').toDate() : null,
      terminationDate: record.termDate ? moment(record.termDate, 'DD-MMM-YYYY').toDate() : null,
      lastModifiedDate: record.lastModifiedDate || null,
      auditKey: record.auditKey ?? null,
      isEditable: true,
      errors: {}
    }));
  }

  onStagesChange(updatedStages: Stage[]): void {
    this.stages.set(updatedStages);
    this.isFormDirty.set(true);
  }

  onSave(): void {
    if (!this.selectedProcess()) return;

    if (!this.stageConfigComponent.validateAllStages()) {
      this.snackbar.showError('Please fix validation errors before saving.');
      return;
    }

    const selectedProcess = this.selectedProcess();
    if (!selectedProcess) return;

    const changedStages = this.stageConfigComponent.getChangedStages();
    if (changedStages.length === 0) return;

    this.isSaving.set(true);

    const records: BulkUpsertRecordDto[] = changedStages.map(stage => ({
      auditKey: stage.auditKey || null,
      processCode: selectedProcess.code,
      stageCode: stage.stageCode,
      effDate: DateFieldValidationUtility.serializeDateForApi(stage.effectiveDate)!,
      termDate: DateFieldValidationUtility.serializeDateForApi(stage.terminationDate) ?? null,
    }));

    const request: BulkUpsertRequest = { records };

    this.apiService.bulkUpsert(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          this.isFormDirty.set(false);

          if (response.success && response.failureCount === 0) {
            this.snackbar.showSuccess(response.message || 'Process Stages updated successfully.');
          } else if (response.success && response.failureCount > 0) {
            this.snackbar.showError(response.message || `Partially completed: ${response.successCount} succeeded, ${response.failureCount} failed.`);
            this.mapBulkUpsertErrors(response.errors, changedStages);
          } else {
            this.snackbar.showError(response.message || 'Failed to save process stages.');
            this.mapBulkUpsertErrors(response.errors, changedStages);
          }

          this.loadProcesses(selectedProcess.code);
        },
        error: (error) => {
          this.showErrorMessage(error);
          this.isSaving.set(false);
        }
      });
  }

  onClearAll(): void {
    if (this.stageConfigComponent) {
      this.stageConfigComponent.clearAllFields();
      this.isFormDirty.set(false);
    }
  }

  onCancel(): void {
    if (this.stageConfigComponent) {
      this.stageConfigComponent.cancelChanges();
      this.isFormDirty.set(false);
    }
  }

  private mapBulkUpsertErrors(errors: BulkUpsertError[], changedStages: Stage[]): void {
    if (!errors || errors.length === 0) return;
    const currentStages = this.stages();
    errors.forEach(err => {
      const changedStage = changedStages[err.recordIndex];
      if (!changedStage) return;
      const fullIndex = currentStages.indexOf(changedStage);
      if (fullIndex >= 0) {
        currentStages[fullIndex].errors = {
          ...currentStages[fullIndex].errors,
          server: err.errorMessage || 'Save failed'
        };
      }
    });
    this.stages.set([...currentStages]);
  }

  private showErrorMessage(error: any): void {
    let message = error?.error?.errorResponse?.error
                || error?.error?.message
                || error?.message;

    if (!message) {
      message = 'An error occurred. Please try again.';
    }

    const errorCode = error?.error?.errorCode || error?.error?.errorResponse?.errorCode;
    if (errorCode) {
      message = `Error ${errorCode}: ${message}`;
    }

    this.snackbar.showError(message);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedProcess.set(null);
        this.stages.set([]);
        this.searchBar?.clearSearch();
        this.loadProcesses();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
