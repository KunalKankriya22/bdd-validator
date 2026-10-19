import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { FreezeDetail } from '../unit-query.model';
import { UnitQueryService } from '../unit-query.service';
import { ComponentNotesPanelRecord } from './component-notes-panel';

@Component({
  selector: 'app-freeze-details-panel',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, SidePanelBase],
  providers: [DatePipe],
  template: `
    <app-side-panel-base title="Freeze Details" width="900px" [showFooter]="false" (closePanel)="closePanel.emit()">
      <div panelContent>
        @if (loading) {
          <div class="panel-loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (error) {
          <p class="panel-error">{{ error }}</p>
        } @else {
          <h4 class="section-title">Freeze Records</h4>
          <table mat-table [dataSource]="freezeRecords" class="panel-table">
            <ng-container matColumnDef="productCode"><th mat-header-cell *matHeaderCellDef>Product Code</th><td mat-cell *matCellDef="let row">{{ row.productCode || '-' }}</td></ng-container>
            <ng-container matColumnDef="parmCode"><th mat-header-cell *matHeaderCellDef>Parm Code</th><td mat-cell *matCellDef="let row">{{ row.parmCode || '-' }}</td></ng-container>
            <ng-container matColumnDef="processDats"><th mat-header-cell *matHeaderCellDef>Process Date/Time</th><td mat-cell *matCellDef="let row">{{ formatDateTime(row.processDats) }}</td></ng-container>
            <ng-container matColumnDef="insertUser"><th mat-header-cell *matHeaderCellDef>User</th><td mat-cell *matCellDef="let row">{{ row.insertUser || '-' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (freezeRecords.length === 0) { <p class="panel-empty">No freeze details found.</p> }
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
export class FreezeDetailsPanelComponent implements OnInit, OnDestroy {
  @Input() record!: ComponentNotesPanelRecord;
  @Output() closePanel = new EventEmitter<void>();

  private readonly service = inject(UnitQueryService);
  private readonly datePipe = inject(DatePipe);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  error = '';
  freezeRecords: FreezeDetail[] = [];
  displayedColumns = ['productCode', 'parmCode', 'processDats', 'insertUser'];

  ngOnInit(): void {
    if (!this.record.productCode) {
      this.error = 'No component selected.';
      this.loading = false;
      return;
    }

    const collDateStr = this.datePipe.transform(this.record.collDate, 'yyyy-MM-dd') ?? this.record.collDate;
    this.service.getFreezeDetails(this.record.unitId, collDateStr, this.record.productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.freezeRecords = results;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error?.Message || 'Failed to load freeze details.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
      return this.datePipe.transform(dateStr, 'MM-dd-yy HH:mm') ?? '-';
    } catch {
      return '-';
    }
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
