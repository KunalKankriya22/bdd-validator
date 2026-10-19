import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { UnitQueryPanelRecord } from '../unit-query.model';
import { UnitQueryService } from '../unit-query.service';

@Component({
  selector: 'app-equipment-supply-panel',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, SidePanelBase],
  template: `
    <app-side-panel-base title="Equipment and Supply Details" width="900px" [showFooter]="false" (closePanel)="closePanel.emit()">
      <div panelContent>
        @if (loading) {
          <div class="panel-loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (error) {
          <p class="panel-error">{{ error }}</p>
        } @else {
          <h4 class="section-title">Equipment</h4>
          <table mat-table [dataSource]="equipment" class="panel-table">
            <ng-container matColumnDef="equipReference"><th mat-header-cell *matHeaderCellDef>Reference</th><td mat-cell *matCellDef="let row">{{ row.equipReference || '-' }}</td></ng-container>
            <ng-container matColumnDef="equipType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row">{{ row.equipType || '-' }}</td></ng-container>
            <ng-container matColumnDef="serialNumber"><th mat-header-cell *matHeaderCellDef>Serial Number</th><td mat-cell *matCellDef="let row">{{ row.serialNumber || '-' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="equipColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: equipColumns;"></tr>
          </table>
          @if (equipment.length === 0) { <p class="panel-empty">No equipment records.</p> }

          <h4 class="section-title">Supply</h4>
          <table mat-table [dataSource]="supply" class="panel-table">
            <ng-container matColumnDef="equipReference"><th mat-header-cell *matHeaderCellDef>Reference</th><td mat-cell *matCellDef="let row">{{ row.equipReference || '-' }}</td></ng-container>
            <ng-container matColumnDef="equipType"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row">{{ row.equipType || '-' }}</td></ng-container>
            <ng-container matColumnDef="serialNumber"><th mat-header-cell *matHeaderCellDef>Serial Number</th><td mat-cell *matCellDef="let row">{{ row.serialNumber || '-' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="supplyColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: supplyColumns;"></tr>
          </table>
          @if (supply.length === 0) { <p class="panel-empty">No supply records.</p> }
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
export class EquipmentSupplyPanelComponent implements OnInit, OnDestroy {
  @Input() record!: UnitQueryPanelRecord;
  @Output() closePanel = new EventEmitter<void>();

  private readonly service = inject(UnitQueryService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  error = '';
  equipment: any[] = [];
  supply: any[] = [];
  equipColumns = ['equipReference', 'equipType', 'serialNumber'];
  supplyColumns = ['equipReference', 'equipType', 'serialNumber'];

  ngOnInit(): void {
    const collDateStr = this.record.collDate?.split('T')[0] ?? this.record.collDate;
    this.service.getEquipmentSupply(this.record.unitId, collDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.equipment = [...(data?.componentCgmpRecords ?? []), ...(data?.equipmentRecords ?? [])];
          this.supply = data?.supplyRecords ?? [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to load equipment/supply details.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
