import { Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { TestKitLookup } from '../../models/create-test-batch.model';
import { CreateTestBatchService } from '../../services/create-test-batch.service';

interface KitGroup {
  testKitId: string;
  reviewedBy: string | null;
  testingLabCode: string | null;
  reagents: { reagentType: string | null; reagentName: string | null; reagentExpiryDate: string | null }[];
}

@Component({
  selector: 'app-test-kit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatRadioModule],
  templateUrl: './test-kit-dialog.component.html',
  styleUrls: ['./test-kit-dialog.component.scss'],
})
export class TestKitDialogComponent implements OnChanges, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly service = inject(CreateTestBatchService);

  @Input() testId = '';
  @Output() kitSelected = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  readonly kitGroups = signal<KitGroup[]>([]);
  selectedKitId: string | null = null;

  get selectedKitReagents(): KitGroup['reagents'] {
    return this.kitGroups().find(k => k.testKitId === this.selectedKitId)?.reagents ?? [];
  }

  ngOnChanges(): void {
    if (this.testId) {
      this.loadKits();
    }
  }

  private loadKits(): void {
    this.service.getTestKits(this.testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const grouped = new Map<string, KitGroup>();
            for (const row of res.data) {
              if (!grouped.has(row.testKitId)) {
                grouped.set(row.testKitId, {
                  testKitId: row.testKitId,
                  reviewedBy: row.reviewedBy,
                  testingLabCode: row.testingLabCode,
                  reagents: [],
                });
              }
              if (row.reagentType || row.reagentName) {
                grouped.get(row.testKitId)!.reagents.push({
                  reagentType: row.reagentType,
                  reagentName: row.reagentName,
                  reagentExpiryDate: row.reagentExpiryDate,
                });
              }
            }
            this.kitGroups.set(Array.from(grouped.values()));
            this.selectedKitId = null;
          }
        },
      });
  }

  onContinue(): void {
    if (this.selectedKitId) {
      this.kitSelected.emit(this.selectedKitId);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      return `${String(day).padStart(2, '0')}-${months[month - 1]}-${year}`;
    } catch { return dateStr; }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
