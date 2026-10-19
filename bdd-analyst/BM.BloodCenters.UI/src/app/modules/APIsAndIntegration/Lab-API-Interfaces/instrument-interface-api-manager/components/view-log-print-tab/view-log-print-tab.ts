import { Component, Input, signal, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LogFile } from '../../models/instrument-interface.model';

@Component({
  selector: 'app-view-log-print-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './view-log-print-tab.html',
  styleUrls: ['./view-log-print-tab.scss'],
})
export class ViewLogPrintTab implements OnChanges {
  @Input() chapterId!: string;
  @Input() instrumentId!: string;
  @Input() instrumentDesc: string = '';

  private instrumentService = inject(InstrumentInterfaceService);
  private snackbarService = inject(SnackbarService);

  logFiles = signal<LogFile[]>([]);
  selectedLogFile = signal<LogFile | null>(null);
  textContent = signal<string | null>(null);
  loading = signal<boolean>(false);
  showingLog = signal<boolean>(false);
  logShown = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chapterId'] || changes['instrumentId']) {
      this.clear();
    }
  }

  loadLogFiles(): void {
    if (!this.instrumentId) {
      this.snackbarService.showError('Please select an Instrument ID');
      return;
    }

    this.loading.set(true);
    this.instrumentService
      .getLogFiles(this.instrumentId)
      .subscribe({
        next: (files) => {
          this.logFiles.set(files);
          this.loading.set(false);

          if (files.length === 0) {
            this.snackbarService.showSuccess('No log files found for this instrument.');
          }
        },
        error: () => {
          this.loading.set(false);
          this.snackbarService.showError('Failed to load log files.');
        },
      });
  }

  onLogFileChange(): void {
    this.textContent.set(null);
    this.logShown.set(false);
  }

  showLog(): void {
    const logFile = this.selectedLogFile();

    if (!logFile?.fileName) {
      this.snackbarService.showError('Please select a log file name.');
      return;
    }

    if (!logFile.parmId) {
      this.snackbarService.showError('Parameter ID is required.');
      return;
    }

    if (logFile.reportStatus && logFile.reportStatus !== 'C') {
      this.snackbarService.showError('Report is not in completed status.');
      return;
    }

    this.showingLog.set(true);
    this.textContent.set(null);
    this.logShown.set(false);

    this.instrumentService
      .getLogFileContent(logFile.parmId)
      .subscribe({
        next: (response) => {
          if (response?.item?.content) {
            this.textContent.set(response.item.content);
            this.logShown.set(true);
          } else {
            this.snackbarService.showError('Log file content is empty.');
          }
          this.showingLog.set(false);
        },
        error: () => {
          this.showingLog.set(false);
          this.snackbarService.showError('Failed to retrieve log file content.');
        },
      });
  }

  viewReport(): void {
    const logFile = this.selectedLogFile();
    if (!logFile?.parmId) {
      this.snackbarService.showError('Please select a log file and click Show Log first.');
      return;
    }

    if (!this.logShown()) {
      this.snackbarService.showError('Please click Show Log first to view the report.');
      return;
    }

    this.instrumentService
      .downloadLogFile(logFile.parmId)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: () => {
          this.snackbarService.showError('Failed to open report.');
        },
      });
  }

  clear(): void {
    this.logFiles.set([]);
    this.selectedLogFile.set(null);
    this.textContent.set(null);
    this.loading.set(false);
    this.showingLog.set(false);
    this.logShown.set(false);
  }

  compareLogFiles(file1: LogFile | null, file2: LogFile | null): boolean {
    return file1?.parmId === file2?.parmId;
  }
}
