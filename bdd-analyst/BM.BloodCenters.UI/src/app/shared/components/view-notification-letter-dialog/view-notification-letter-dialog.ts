import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { MatTooltip } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { ViewNotificationLetterDialogService } from './view-notification-letter-dialog.service';
import {
  ViewNotificationLetterDialogData,
  ViewNotificationLetterDialogResult,
  NotificationLetter,
} from './view-notification-letter-dialog.model';

@Component({
  selector: 'app-view-notification-letter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DatePipe,
  ],
  templateUrl: './view-notification-letter-dialog.html',
  styleUrls: ['./view-notification-letter-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewNotificationLetterDialog implements OnInit, OnDestroy {
  private readonly service = inject(ViewNotificationLetterDialogService);
  private readonly dialogRef = inject(MatDialogRef<ViewNotificationLetterDialog>);
  readonly data = inject<ViewNotificationLetterDialogData>(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();
  private readonly letterTextCache = new Map<string, string>();

  letters = signal<NotificationLetter[]>([]);
  selectedLetter = signal<NotificationLetter | null>(null);
  letterText = signal<string | null>(null);
  loading = signal(true);
  loadingDetail = signal(false);
  error = signal<string | null>(null);

  displayedColumns: string[] = [
    'letterCode',
    'letterTitle',
    'authorizedBy',
    'authorizedDate',
    'generatedBy',
    'generatedDate',
    'lastReprintedBy',
    'lastReprintedOn',
  ];

  ngOnInit(): void {
    this.loadLetters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLetters(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .getLettersForDonor(this.data.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters) => {
          this.letters.set(letters);
          this.loading.set(false);
          this.autoSelectLetter(letters);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load notification letters');
          this.loading.set(false);
        },
      });
  }

  private autoSelectLetter(letters: NotificationLetter[]): void {
    if (!this.data.letterSeqNo) return;

    const match = letters.find(
      (l) =>
        l.letterSeqNo === this.data.letterSeqNo &&
        (!this.data.chapterId || l.chapterId === this.data.chapterId),
    );
    if (match) {
      this.selectRow(match);
      this.onShowLetter();
    }
  }

  selectRow(row: NotificationLetter): void {
    this.selectedLetter.set(row);
    this.letterText.set(null);
  }

  isSelected(row: NotificationLetter): boolean {
    const selected = this.selectedLetter();
    return selected !== null && selected.letterSeqNo === row.letterSeqNo;
  }

  onShowLetter(): void {
    const selected = this.selectedLetter();
    if (!selected) return;

    const cacheKey = `${selected.letterSeqNo}_${selected.chapterId}`;
    const cached = this.letterTextCache.get(cacheKey);
    if (cached) {
      this.letterText.set(cached);
      return;
    }

    this.loadingDetail.set(true);
    this.service
      .getLetterText(this.data.donorId, selected.letterSeqNo, selected.chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (text) => {
          if (text) {
            this.letterTextCache.set(cacheKey, text);
            this.letterText.set(text);
          }
          this.loadingDetail.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load letter content');
          this.loadingDetail.set(false);
        },
      });
  }

  onClose(): void {
    this.dialogRef.close({ action: 'close' } as ViewNotificationLetterDialogResult);
  }

  onRetry(): void {
    this.error.set(null);
    this.loadLetters();
  }

  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }

  focusNextRow(event: Event): void {
    const currentRow = event.target as HTMLElement;
    const nextRow = currentRow.nextElementSibling as HTMLElement | null;
    if (nextRow) {
      nextRow.setAttribute('tabindex', '0');
      currentRow.setAttribute('tabindex', '-1');
      nextRow.focus();
    }
  }

  focusPreviousRow(event: Event): void {
    const currentRow = event.target as HTMLElement;
    const prevRow = currentRow.previousElementSibling as HTMLElement | null;
    // Skip header row (mat-header-row)
    if (prevRow && !prevRow.classList.contains('mat-mdc-header-row')) {
      prevRow.setAttribute('tabindex', '0');
      currentRow.setAttribute('tabindex', '-1');
      prevRow.focus();
    }
  }
}
