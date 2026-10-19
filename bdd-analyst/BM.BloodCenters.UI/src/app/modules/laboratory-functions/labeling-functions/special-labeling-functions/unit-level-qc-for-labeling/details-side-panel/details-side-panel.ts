import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { UnitLevelQCDetailDto } from '../models/unit-level-qc.model';
import { UnitLevelQcApiService } from '../services/unit-level-qc-api.service';

/**
 * Details Side Panel Component
 * Displays detailed unit information with test results
 */
@Component({
  selector: 'app-unit-level-qc-details-side-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './details-side-panel.html',
  styleUrls: ['./details-side-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitLevelQcDetailsSidePanel implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `unit-level-qc-details-${UnitLevelQcDetailsSidePanel.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly apiService = inject(UnitLevelQcApiService);

  @Input() unitId!: string;
  @Output() close = new EventEmitter<void>();

  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly unitDetail = signal<UnitLevelQCDetailDto | null>(null);

  ngOnInit(): void {
    if (this.unitId) {
      this.loadUnitDetail();
    }
  }

  private loadUnitDetail(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getUnitDetail(this.unitId).subscribe({
      next: (detail) => {
        this.unitDetail.set(detail);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load unit details');
        this.loading.set(false);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  /**
   * Format date for display (DD-MMM-YYYY)
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Format value for display with fallback
   */
  formatValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    return value.toString();
  }
}
