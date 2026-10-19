import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { UnitQueryService } from '../unit-query.service';
import { ComponentNotesPanelRecord } from './component-notes-panel';

@Component({
  selector: 'app-pathogen-reduction-panel',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, SidePanelBase],
  providers: [DatePipe],
  template: `
    <app-side-panel-base title="Pathogen Reduction Details" width="1100px" [showFooter]="false" (closePanel)="closePanel.emit()">
      <div panelContent>
        @if (loading) {
          <div class="panel-loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (error) {
          <p class="panel-error">{{ error }}</p>
        } @else if (details.length === 0) {
          <p class="panel-empty">No pathogen reduction details found.</p>
        } @else {
          @for (record of details; track $index) {
            <div class="detail-card">
              <!-- Row 1 -->
              <div class="detail-row">
                <div class="detail-field"><span class="label">Unit ID</span><span class="value">{{ record.unitId || '--' }}</span></div>
                <div class="detail-field"><span class="label">Collection Date</span><span class="value">{{ fmt(record.collDate) }}</span></div>
                <div class="detail-field"><span class="label">Product Category</span><span class="value">{{ record.prodCategory || '--' }}</span></div>
                <div class="detail-field"><span class="label">Product Code</span><span class="value">{{ record.initialProdCode || '--' }}</span></div>
                <div class="detail-field"><span class="label">Volume Type Set</span><span class="value">{{ record.volTypeSet || '--' }}</span></div>
                <div class="detail-field"><span class="label">Suspension Type</span><span class="value">{{ record.suspensionType || '--' }}</span></div>
                <div class="detail-field"><span class="label">Initial Platelet Count</span><span class="value">{{ record.initPltCount ?? '--' }}</span></div>
              </div>
              <!-- Row 2 -->
              <div class="detail-row">
                <div class="detail-field"><span class="label">RBC Status</span><span class="value">{{ record.rbcContentStatus === 'Y' ? 'Accepted' : record.rbcContentStatus === 'N' ? 'Not Accepted' : '--' }}</span></div>
                <div class="detail-field"><span class="label">Bleed End Time</span><span class="value">{{ fmtDt(record.bleedEndTime) }}</span></div>
                <div class="detail-field"><span class="label">Initial Platelet Weight</span><span class="value">{{ record.initialProdWeight ?? '--' }}</span></div>
                <div class="detail-field"><span class="label">Initial Product Volume</span><span class="value">{{ record.initialProdVol ?? '--' }}</span></div>
                <div class="detail-field"><span class="label">Equipment Type</span><span class="value">{{ record.equipType || '--' }}</span></div>
                <div class="detail-field"><span class="label">Suitability</span><span class="value">{{ record.suitStatusCode || '--' }}</span></div>
                <div class="detail-field"><span class="label">Description</span><span class="value">{{ record.suitStatusReason || '-' }}</span></div>
              </div>
              <!-- Row 3 -->
              <div class="detail-row">
                <div class="detail-field"><span class="label">Anti Volume</span><span class="value">{{ record.anticoagulantVolume ?? '--' }}</span></div>
                <div class="detail-field"><span class="label">Intermediate Product Code</span><span class="value">{{ record.suitProdCode || '--' }}</span></div>
                <div class="detail-field"><span class="label">Treatment Start Time</span><span class="value">{{ fmtDt(record.treatmentStartTime) }}</span></div>
                <div class="detail-field"><span class="label">Total Treatment Time</span><span class="value">{{ record.treatmentTime || '--' }}</span></div>
                <div class="detail-field"><span class="label">Aggregates Acceptability</span><span class="value">{{ record.aggrAcc === 'Y' ? 'Yes' : record.aggrAcc === 'N' ? 'No' : '--' }}</span></div>
                <div class="detail-field"><span class="label">Illuminator Type</span><span class="value">{{ record.illuminatorType || '--' }}</span></div>
                <div class="detail-field"><span class="label">Serial ID Number</span><span class="value">{{ record.illuminatorSerialNo || '--' }}</span></div>
              </div>
              <!-- Row 4 -->
              <div class="detail-row">
                <div class="detail-field"><span class="label">CAD Product Code</span><span class="value">{{ record.cadProdCode || '--' }}</span></div>
                <div class="detail-field"><span class="label">CAD Start Time</span><span class="value">{{ fmtDt(record.cadStartTime) }}</span></div>
                <div class="detail-field"><span class="label">CAD End Time</span><span class="value">{{ fmtDt(record.cadEndTime) }}</span></div>
                <div class="detail-field"><span class="label">CAD Total Time</span><span class="value">{{ record.cadTotalTime || '--' }}</span></div>
                <div class="detail-field"><span class="label">Operator ID</span><span class="value">{{ record.operatorId || '--' }}</span></div>
                <div class="detail-field"><span class="label">Final Number of Bags</span><span class="value">{{ record.finalPrdNumOfBags ?? '--' }}</span></div>
                <div class="detail-field"><span class="label">Set Lot Number</span><span class="value">{{ record.setIdLotNo || '--' }}</span></div>
              </div>

              <!-- Illuminator Message -->
              <div class="message-box">
                <h4 class="message-title">Illuminator Message</h4>
                <p class="message-text">{{ record.illuminatorMessage || '--' }}</p>
              </div>

              <!-- Weld/Seal Details -->
              <h4 class="section-title">Weld/Seal Details</h4>
              @if (record.sterileDockingRecords?.length) {
                <table mat-table [dataSource]="record.sterileDockingRecords" class="panel-table">
                  <ng-container matColumnDef="weldMachine"><th mat-header-cell *matHeaderCellDef>Weld Machine</th><td mat-cell *matCellDef="let row">{{ row.weldMachine || '--' }}</td></ng-container>
                  <ng-container matColumnDef="waferLotNo"><th mat-header-cell *matHeaderCellDef>Wafer Lot Number</th><td mat-cell *matCellDef="let row">{{ row.waferLotNo || '--' }}</td></ng-container>
                  <ng-container matColumnDef="weldOk"><th mat-header-cell *matHeaderCellDef>Ok?</th><td mat-cell *matCellDef="let row">{{ row.weldOk === 'Y' ? 'Yes' : row.weldOk === 'N' ? 'No' : '--' }}</td></ng-container>
                  <ng-container matColumnDef="procCode"><th mat-header-cell *matHeaderCellDef>Process</th><td mat-cell *matCellDef="let row">{{ row.procCode || '--' }}</td></ng-container>
                  <ng-container matColumnDef="setLotNo"><th mat-header-cell *matHeaderCellDef>Set Lot Number</th><td mat-cell *matCellDef="let row">{{ row.setLotNo || '--' }}</td></ng-container>
                  <ng-container matColumnDef="insertDate"><th mat-header-cell *matHeaderCellDef>Insert Date</th><td mat-cell *matCellDef="let row">{{ fmt(row.insertDate) }}</td></ng-container>
                  <ng-container matColumnDef="insertUser"><th mat-header-cell *matHeaderCellDef>Insert User</th><td mat-cell *matCellDef="let row">{{ row.insertUser || '--' }}</td></ng-container>
                  <tr mat-header-row *matHeaderRowDef="sterileDockingColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: sterileDockingColumns;"></tr>
                </table>
              } @else {
                <p class="panel-empty">No weld/seal records.</p>
              }

              <!-- Final Transfer/Storage -->
              <h4 class="section-title">Final Transfer/Storage</h4>
              @if (record.finalProductRecords?.length) {
                <table mat-table [dataSource]="record.finalProductRecords" class="panel-table">
                  <ng-container matColumnDef="productCode"><th mat-header-cell *matHeaderCellDef>Product Code</th><td mat-cell *matCellDef="let row">{{ row.productCode || '--' }}</td></ng-container>
                  <ng-container matColumnDef="prodWeight"><th mat-header-cell *matHeaderCellDef>Product Weight</th><td mat-cell *matCellDef="let row">{{ row.prodWeight ?? '--' }}</td></ng-container>
                  <ng-container matColumnDef="prodVol"><th mat-header-cell *matHeaderCellDef>Product Volume</th><td mat-cell *matCellDef="let row">{{ row.prodVol ?? '--' }}</td></ng-container>
                  <ng-container matColumnDef="anticoagulantVolume"><th mat-header-cell *matHeaderCellDef>Antico Volume</th><td mat-cell *matCellDef="let row">{{ row.anticoagulantVolume ?? '--' }}</td></ng-container>
                  <ng-container matColumnDef="finalPltCount"><th mat-header-cell *matHeaderCellDef>PLT(x10 11)</th><td mat-cell *matCellDef="let row">{{ row.finalPltCount ?? '--' }}</td></ng-container>
                  <ng-container matColumnDef="insertDate"><th mat-header-cell *matHeaderCellDef>Insert Date</th><td mat-cell *matCellDef="let row">{{ fmt(row.insertDate) }}</td></ng-container>
                  <ng-container matColumnDef="insertUser"><th mat-header-cell *matHeaderCellDef>Insert User</th><td mat-cell *matCellDef="let row">{{ row.insertUser || '--' }}</td></ng-container>
                  <tr mat-header-row *matHeaderRowDef="finalProductColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: finalProductColumns;"></tr>
                </table>
              } @else {
                <p class="panel-empty">No final transfer/storage records.</p>
              }

              @if ($index < details.length - 1) { <hr class="record-divider" /> }
            </div>
          }
        }
      </div>
    </app-side-panel-base>
  `,
  styles: [`
    .panel-loading { display: flex; justify-content: center; padding: 40px; }
    .panel-error { color: #d32f2f; padding: 16px; }
    .panel-empty { color: #666; padding: 16px; text-align: center; }
    .panel-table { width: 100%; }
    .detail-card { padding: 0 16px; }
    .detail-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 12px; }
    .detail-field { min-width: 0; }
    .detail-field .label { display: block; font-size: 11px; color: #666; margin-bottom: 2px; }
    .detail-field .value { display: block; font-size: 13px; font-weight: 500; color: #333; }
    .message-box { margin: 12px 0; padding: 12px 16px; background: #f5f5f5; border-radius: 4px; }
    .message-title { font-size: 14px; font-weight: 600; color: #333; margin: 0 0 6px; }
    .message-text { font-size: 13px; color: #555; margin: 0; }
    .section-title { font-size: 14px; font-weight: 600; color: #333; margin: 20px 0 8px; }
    .record-divider { margin: 24px 0; border: none; border-top: 1px solid #e0e0e0; }
  `],
})
export class PathogenReductionPanelComponent implements OnInit, OnDestroy {
  @Input() record!: ComponentNotesPanelRecord;
  @Output() closePanel = new EventEmitter<void>();

  private readonly service = inject(UnitQueryService);
  private readonly datePipe = inject(DatePipe);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  error = '';
  details: any[] = [];

  sterileDockingColumns = ['weldMachine', 'waferLotNo', 'weldOk', 'procCode', 'setLotNo', 'insertDate', 'insertUser'];
  finalProductColumns = ['productCode', 'prodWeight', 'prodVol', 'anticoagulantVolume', 'finalPltCount', 'insertDate', 'insertUser'];

  ngOnInit(): void {
    if (!this.record.productCode) {
      this.error = 'No component selected.';
      this.loading = false;
      return;
    }
    const collDateStr = this.datePipe.transform(this.record.collDate, 'yyyy-MM-dd') ?? this.record.collDate;
    this.service.getPathogenReduction(this.record.unitId, collDateStr, this.record.productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.details = data; this.loading = false; this.cdr.markForCheck(); },
        error: (err) => {
          this.error = err?.error?.message || err?.error?.Message || 'Failed to load pathogen reduction details.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  fmt(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    try { return this.datePipe.transform(dateStr, 'dd-MMM-yyyy')?.toUpperCase() ?? '--'; } catch { return '--'; }
  }

  fmtDt(dateStr: string | null | undefined): string {
    if (!dateStr) return '--';
    try { return this.datePipe.transform(dateStr, 'dd-MMM-yyyy, hh:mm a')?.toUpperCase() ?? '--'; } catch { return '--'; }
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
