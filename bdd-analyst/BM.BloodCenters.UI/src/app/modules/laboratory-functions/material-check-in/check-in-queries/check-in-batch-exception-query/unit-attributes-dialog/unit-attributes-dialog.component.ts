import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';

import { CheckInBatchExceptionApiService } from '../services/check-in-batch-exception-api.service';
import { UnitAttributeDto } from '../models/check-in-batch-exception.model';

export interface UnitAttributesDialogData {
  unitId: string;
  collDate: string;
}

@Component({
  selector: 'app-unit-attributes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSortModule,
  ],
  templateUrl: './unit-attributes-dialog.component.html',
  styleUrls: ['./unit-attributes-dialog.component.scss'],
})
export class UnitAttributesDialogComponent implements OnInit {
  private readonly apiService = inject(CheckInBatchExceptionApiService);
  public readonly dialogRef = inject(MatDialogRef<UnitAttributesDialogComponent>);

  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `unit-attributes-dialog-${UnitAttributesDialogComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  // Signal-based state
  protected readonly attributes = signal<UnitAttributeDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Table configuration
  displayedColumns: string[] = ['attributeGroup', 'groupDescription', 'attributeCode', 'codeDescription'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: UnitAttributesDialogData) {}

  ngOnInit(): void {
    this.loadAttributes();
  }

  private loadAttributes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .getUnitAttributes(this.data.unitId, this.data.collDate)
      .subscribe({
        next: (data) => {
          this.attributes.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load unit attributes');
          this.loading.set(false);
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSortChange(sort: Sort): void {
    const data = this.attributes().slice();

    if (!sort.active || sort.direction === '') {
      this.attributes.set(data);
      return;
    }

    const sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'attributeGroup':
          return this.compare(a.attributeGroup, b.attributeGroup, isAsc);
        case 'groupDescription':
          return this.compare(
            a.groupDescription || '',
            b.groupDescription || '',
            isAsc
          );
        case 'attributeCode':
          return this.compare(a.attributeCode, b.attributeCode, isAsc);
        case 'codeDescription':
          return this.compare(
            a.codeDescription || '',
            b.codeDescription || '',
            isAsc
          );
        default:
          return 0;
      }
    });

    this.attributes.set(sortedData);
  }

  private compare(a: string, b: string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
