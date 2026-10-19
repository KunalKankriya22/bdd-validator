import { Component, EventEmitter, inject, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitRow, ValidateUnitResponse } from '../../models/create-test-batch.model';
import { CreateTestBatchService } from '../../services/create-test-batch.service';
import {
  WarningDialogComponent,
  WarningDialogData,
  WarningDialogResult,
} from '../warning-dialog/warning-dialog.component';

@Component({
  selector: 'app-unit-grid',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, UnitIdFieldComponent],
  templateUrl: './unit-grid.component.html',
  styleUrls: ['./unit-grid.component.scss'],
})
export class UnitGridComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly service = inject(CreateTestBatchService);
  private readonly dialog = inject(MatDialog);

  @ViewChild('unitField') unitField!: UnitIdFieldComponent;
  @Input() units: UnitRow[] = [];
  @Input() startSeq = 1;
  @Input() currentBatchId: string | null = null;
  @Output() unitsChanged = new EventEmitter<UnitRow[]>();

  onUnitValidated(event: any): void {
    const parsedId = this.unitField.parsedUnitId;
    if (!parsedId) return;

    const existingIds = this.units.map(u => u.unitId);
    this.service.validateUnit({
      unitId: parsedId,
      tbId: this.currentBatchId ?? undefined,
      existingUnitIds: existingIds,
      overrides: [],
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.item) {
            if (res.item.warnings?.length) {
              this.showWarningDialog(res.item);
              return;
            }
            this.addUnit(res.item);
          }
        },
      });
  }

  private addUnit(item: ValidateUnitResponse): void {
    const newUnit: UnitRow = {
      seqNo: this.startSeq + this.units.length,
      unitId: item.unitId,
      collDate: item.collDate,
      chapterId: item.chapterId,
    };
    this.unitsChanged.emit([...this.units, newUnit]);
    this.unitField.clear();
  }

  private showWarningDialog(item: ValidateUnitResponse): void {
    const dialogData: WarningDialogData = {
      title: 'Unit Validation Warning',
      warnings: item.warnings ?? [],
      allowOverride: true,
    };

    const dialogRef = this.dialog.open(WarningDialogComponent, {
      width: '560px',
      disableClose: true,
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: WarningDialogResult) => {
        if (result?.override) {
          this.addUnit(item);
        } else {
          this.unitField.clear();
        }
      });
  }

  removeUnit(index: number): void {
    const updated = this.units
      .filter((_, i) => i !== index)
      .map((u, i) => ({ ...u, seqNo: this.startSeq + i }));
    this.unitsChanged.emit(updated);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      return `${String(day).padStart(2, '0')}-${months[month - 1]}-${year}`;
    } catch {
      return dateStr;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
