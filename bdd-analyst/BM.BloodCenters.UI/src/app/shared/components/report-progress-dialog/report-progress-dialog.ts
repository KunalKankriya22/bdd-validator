import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, switchMap, timer, tap, takeWhile } from 'rxjs';

import { ReportSubmissionService } from '../../../modules/system-administration/report-admin/report-submission/services/report-submission.service';
import { ReportProgressDialogData } from './report-progress-dialog.model';

type ReportPhase = 'submitting' | 'generating' | 'completed' | 'failed';

@Component({
  selector: 'app-report-progress-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './report-progress-dialog.html',
  styleUrl: './report-progress-dialog.scss',
})
export class ReportProgressDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<ReportProgressDialog>);
  readonly data: ReportProgressDialogData = inject(MAT_DIALOG_DATA);
  private readonly reportService = inject(ReportSubmissionService);
  private readonly destroy$ = new Subject<void>();

  phase = signal<ReportPhase>('submitting');
  statusMessage = signal('Submitting report...');
  errorMessage = signal('');

  private parmId = '';
  private reportFileName = '';

  ngOnInit(): void {
    this.submitReport();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCancel(): void {
    this.destroy$.next();
    this.dialogRef.close();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onOpenReport(): void {
    if (this.reportFileName) {
      window.open(`/reports/${this.reportFileName}`, '_blank');
    }
    this.dialogRef.close();
  }

  onRetry(): void {
    this.phase.set('submitting');
    this.statusMessage.set('Submitting report...');
    this.errorMessage.set('');
    this.submitReport();
  }

  private submitReport(): void {
    this.reportService.generateParmId()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (parmId) => {
          this.parmId = parmId;
          this.doSubmit();
        },
        error: () => {
          this.phase.set('failed');
          this.statusMessage.set('Report generation failed');
          this.errorMessage.set('Failed to generate parameter ID. Please try again.');
        },
      });
  }

  private doSubmit(): void {
    this.reportService.submitReport({
      reportName: this.data.reportName,
      parmId: this.parmId,
      autoPrint: false,
      printHeaderTrailer: false,
      deleteAfterPrint: false,
      noOfCopies: 1,
      parameters: [
        { parmNo: 1, parmSelect: this.data.unitId, parmCode: 'UNIT' },
      ],
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.phase.set('generating');
          this.statusMessage.set('Report is being generated...');
          this.pollStatus();
        },
        error: () => {
          this.phase.set('failed');
          this.statusMessage.set('Report generation failed');
          this.errorMessage.set('Failed to submit report. Please try again.');
        },
      });
  }

  private pollStatus(): void {
    timer(0, 3000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.reportService.getReportStatus(this.data.reportName, this.parmId)),
      tap((status) => {
        if (status.statusCode === 'C') {
          this.reportFileName = status.fileName || status.outputFile || '';
          this.phase.set('completed');
          this.statusMessage.set('Report generated successfully!');
        } else if (status.statusCode === 'F') {
          this.phase.set('failed');
          this.statusMessage.set('Report generation failed');
          this.errorMessage.set(status.statusMessage || 'The report server encountered an error.');
        }
      }),
      takeWhile((status) => status.statusCode !== 'C' && status.statusCode !== 'F'),
    ).subscribe();
  }
}
