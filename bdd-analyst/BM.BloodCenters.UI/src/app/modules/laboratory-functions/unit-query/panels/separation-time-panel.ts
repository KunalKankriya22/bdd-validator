import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { UnitQueryPanelRecord } from '../unit-query.model';
import { UnitQueryResult } from '../unit-query.model';

@Component({
  selector: 'app-separation-time-panel',
  standalone: true,
  imports: [CommonModule, MatTableModule, SidePanelBase],
  template: `
    <app-side-panel-base title="Separation Times" width="900px" [showFooter]="false" (closePanel)="closePanel.emit()">
      <div panelContent>
        <table mat-table [dataSource]="tableData" class="panel-table">
          <ng-container matColumnDef="label"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let row" class="row-label">{{ row.label }}</td></ng-container>
          <ng-container matColumnDef="firstSep"><th mat-header-cell *matHeaderCellDef>1st Sep</th><td mat-cell *matCellDef="let row">{{ row.firstSep }}</td></ng-container>
          <ng-container matColumnDef="secondSep"><th mat-header-cell *matHeaderCellDef>2nd Sep</th><td mat-cell *matCellDef="let row">{{ row.secondSep }}</td></ng-container>
          <ng-container matColumnDef="thirdSep"><th mat-header-cell *matHeaderCellDef>3rd Sep</th><td mat-cell *matCellDef="let row">{{ row.thirdSep }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </app-side-panel-base>
  `,
  styles: [`
    .panel-table { width: 100%; }
    .row-label { font-weight: 500; color: #666; }
  `],
})
export class SeparationTimePanelComponent {
  @Input() record!: UnitQueryPanelRecord;
  @Input() unitData: UnitQueryResult | null = null;
  @Output() closePanel = new EventEmitter<void>();

  displayedColumns = ['label', 'firstSep', 'secondSep', 'thirdSep'];

  get tableData() {
    const u = this.unitData;
    return [
      {
        label: 'Centrifuge',
        firstSep: u?.firstSepCentrifugeId || '--',
        secondSep: u?.secondSepCentrifugeId || '--',
        thirdSep: u?.thirdSepCentrifugeId || '--',
      },
      {
        label: 'Duration',
        firstSep: u?.firstSepDuration || '--',
        secondSep: u?.secondSepDuration || '--',
        thirdSep: u?.thirdSepDuration || '--',
      },
      {
        label: 'Weight',
        firstSep: u?.firstSepWeight != null ? u.firstSepWeight.toFixed(2) : '--',
        secondSep: u?.secondSepWeight != null ? u.secondSepWeight.toFixed(2) : '--',
        thirdSep: u?.thirdSepWeight != null ? u.thirdSepWeight.toFixed(2) : '--',
      },
      {
        label: 'Tech',
        firstSep: u?.firstSepUserId || '--',
        secondSep: u?.secondSepUserId || '--',
        thirdSep: u?.thirdSepUserId || '--',
      },
    ];
  }
}
