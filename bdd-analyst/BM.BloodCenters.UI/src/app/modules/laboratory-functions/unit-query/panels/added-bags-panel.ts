import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { UnitQueryPanelRecord } from '../unit-query.model';
import { UnitQueryService } from '../unit-query.service';

@Component({
  selector: 'app-added-bags-panel',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, SidePanelBase],
  template: `
    <app-side-panel-base title="Added Bags" width="900px" [showFooter]="false" (closePanel)="closePanel.emit()">
      <div panelContent>
        @if (loading) {
          <div class="panel-loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (error) {
          <p class="panel-error">{{ error }}</p>
        } @else {
          <h4 class="section-title">Add-On Bags</h4>
          <table mat-table [dataSource]="bags" class="panel-table">
            <ng-container matColumnDef="sdcWsNumber"><th mat-header-cell *matHeaderCellDef>SDC WS#</th><td mat-cell *matCellDef="let row">{{ row.sdcWsNumber || '-' }}</td></ng-container>
            <ng-container matColumnDef="componentPrefix"><th mat-header-cell *matHeaderCellDef>Prefix</th><td mat-cell *matCellDef="let row">{{ row.componentPrefix || '-' }}</td></ng-container>
            <ng-container matColumnDef="productCode"><th mat-header-cell *matHeaderCellDef>Product</th><td mat-cell *matCellDef="let row">{{ row.productCode || '-' }}</td></ng-container>
            <ng-container matColumnDef="lotNumber"><th mat-header-cell *matHeaderCellDef>Lot Number</th><td mat-cell *matCellDef="let row">{{ row.lotNumber || '-' }}</td></ng-container>
            <ng-container matColumnDef="numberOfBags"><th mat-header-cell *matHeaderCellDef># Bags</th><td mat-cell *matCellDef="let row">{{ row.numberOfBags ?? '-' }}</td></ng-container>
            <ng-container matColumnDef="itemInd"><th mat-header-cell *matHeaderCellDef>Item</th><td mat-cell *matCellDef="let row">{{ row.itemInd || '-' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (bags.length === 0) { <p class="panel-empty">No add-on bags found.</p> }
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
export class AddedBagsPanelComponent implements OnInit, OnDestroy {
  @Input() record!: UnitQueryPanelRecord;
  @Output() closePanel = new EventEmitter<void>();

  private readonly service = inject(UnitQueryService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  error = '';
  bags: any[] = [];
  displayedColumns = ['sdcWsNumber', 'componentPrefix', 'productCode', 'lotNumber', 'numberOfBags', 'itemInd'];

  ngOnInit(): void {
    const collDateStr = this.record.collDate?.split('T')[0] ?? this.record.collDate;
    this.service.getAddOnBags(this.record.unitId, collDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.bags = data; this.loading = false; this.cdr.markForCheck(); },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to load add-on bags.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
