import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { UnitQueryPanelRecord, UnitTestDetail } from '../unit-query.model';
import { UnitQueryService } from '../unit-query.service';

@Component({
  selector: 'app-unit-test-details-panel',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, SidePanelBase],
  providers: [DatePipe],
  template: `
    <app-side-panel-base title="Unit Test Details" width="900px" [showFooter]="false" (closePanel)="closePanel.emit()">
      <div panelContent>
        @if (loading) {
          <div class="panel-loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (error) {
          <p class="panel-error">{{ error }}</p>
        } @else {
          <h4 class="section-title">Scheduled Test Results</h4>
          <table mat-table [dataSource]="scheduledTests" class="panel-table">
            <ng-container matColumnDef="testId"><th mat-header-cell *matHeaderCellDef>Test ID</th><td mat-cell *matCellDef="let row">{{ row.testId }}</td></ng-container>
            <ng-container matColumnDef="testSeqNo"><th mat-header-cell *matHeaderCellDef>Seq No</th><td mat-cell *matCellDef="let row">{{ row.testSeqNo }}</td></ng-container>
            <ng-container matColumnDef="resultStatus1"><th mat-header-cell *matHeaderCellDef>Result</th><td mat-cell *matCellDef="let row">{{ row.resultStatus1 || '-' }}</td></ng-container>
            <ng-container matColumnDef="testState"><th mat-header-cell *matHeaderCellDef>State</th><td mat-cell *matCellDef="let row">{{ row.testState || '-' }}</td></ng-container>
            <ng-container matColumnDef="tbId"><th mat-header-cell *matHeaderCellDef>TB ID</th><td mat-cell *matCellDef="let row">{{ row.tbId || '-' }}</td></ng-container>
            <ng-container matColumnDef="absorbance"><th mat-header-cell *matHeaderCellDef>Absorbance</th><td mat-cell *matCellDef="let row">{{ row.absorbance || '-' }}</td></ng-container>
            <ng-container matColumnDef="ratio"><th mat-header-cell *matHeaderCellDef>Ratio</th><td mat-cell *matCellDef="let row">{{ row.ratio || '-' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (scheduledTests.length === 0) { <p class="panel-empty">No scheduled test results found.</p> }

          <h4 class="section-title">Unscheduled Test Results</h4>
          <table mat-table [dataSource]="unscheduledTests" class="panel-table unscheduled-table">
            <ng-container matColumnDef="testId"><th mat-header-cell *matHeaderCellDef>Test ID</th><td mat-cell *matCellDef="let row">{{ row.testId }}</td></ng-container>
            <ng-container matColumnDef="testSeqNo"><th mat-header-cell *matHeaderCellDef>Seq No</th><td mat-cell *matCellDef="let row">{{ row.testSeqNo }}</td></ng-container>
            <ng-container matColumnDef="resultStatus1"><th mat-header-cell *matHeaderCellDef>Result</th><td mat-cell *matCellDef="let row">{{ row.resultStatus1 || '-' }}</td></ng-container>
            <ng-container matColumnDef="testState"><th mat-header-cell *matHeaderCellDef>State</th><td mat-cell *matCellDef="let row">{{ row.testState || '-' }}</td></ng-container>
            <ng-container matColumnDef="tbId"><th mat-header-cell *matHeaderCellDef>TB ID</th><td mat-cell *matCellDef="let row">{{ row.tbId || '-' }}</td></ng-container>
            <ng-container matColumnDef="absorbance"><th mat-header-cell *matHeaderCellDef>Absorbance</th><td mat-cell *matCellDef="let row">{{ row.absorbance || '-' }}</td></ng-container>
            <ng-container matColumnDef="ratio"><th mat-header-cell *matHeaderCellDef>Ratio</th><td mat-cell *matCellDef="let row">{{ row.ratio || '-' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="unscheduledColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: unscheduledColumns;"></tr>
          </table>
          @if (unscheduledTests.length === 0) { <p class="panel-empty">No unscheduled test results found.</p> }
        }
      </div>
    </app-side-panel-base>
  `,
  styles: [`
    .panel-loading { display: flex; justify-content: center; padding: 40px; }
    .panel-error { color: #d32f2f; padding: 16px; }
    .panel-empty { color: #666; padding: 16px; text-align: center; }
    .panel-table { width: 100%; }
    .section-title { font-size: 14px; font-weight: 600; color: #333; margin: 16px 0 8px; padding: 0 16px; }
  `],
})
export class UnitTestDetailsPanelComponent implements OnInit, OnDestroy {
  @Input() record!: UnitQueryPanelRecord;
  @Output() closePanel = new EventEmitter<void>();

  private readonly service = inject(UnitQueryService);
  private readonly datePipe = inject(DatePipe);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  error = '';
  scheduledTests: UnitTestDetail[] = [];
  unscheduledTests: UnitTestDetail[] = [];
  displayedColumns = ['testId', 'testSeqNo', 'resultStatus1', 'testState', 'tbId', 'absorbance', 'ratio'];
  unscheduledColumns = this.displayedColumns;

  ngOnInit(): void {
    const collDateStr = this.datePipe.transform(this.record.collDate, 'yyyy-MM-dd') ?? this.record.collDate;
    this.service.getUnitTestDetails(this.record.unitId, collDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (combined) => {
          this.scheduledTests = combined.scheduledTests ?? [];
          this.unscheduledTests = combined.unscheduledTests ?? [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error?.Message || 'Failed to load test details.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
