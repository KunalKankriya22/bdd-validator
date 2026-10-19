import { Component, EventEmitter, inject, Input, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { PrintableTest, SubmitPrintRequest } from '../../models/create-test-batch.model';
import { CreateTestBatchService } from '../../services/create-test-batch.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-print-panel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './print-panel.component.html',
  styleUrls: ['./print-panel.component.scss'],
})
export class PrintPanelComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly service = inject(CreateTestBatchService);
  private readonly snackbarService = inject(SnackbarService);

  @Input() tests: PrintableTest[] = [];
  @Input() batchId = '';
  @Output() printComplete = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  selectedTestIds = new Set<string>();

  ngOnChanges(): void {
    this.selectedTestIds = new Set(this.tests.map(t => t.testId));
  }

  toggleTest(testId: string): void {
    if (this.selectedTestIds.has(testId)) {
      this.selectedTestIds.delete(testId);
    } else {
      this.selectedTestIds.add(testId);
    }
  }

  isSelected(testId: string): boolean {
    return this.selectedTestIds.has(testId);
  }

  onPrint(): void {
    if (this.selectedTestIds.size === 0) return;

    const request: SubmitPrintRequest = {
      tbId: this.batchId,
      testIds: Array.from(this.selectedTestIds),
    };

    this.service.submitPrint(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.snackbarService.showSuccess('Worksheet print submitted.');
            this.printComplete.emit();
          }
        },
      });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
