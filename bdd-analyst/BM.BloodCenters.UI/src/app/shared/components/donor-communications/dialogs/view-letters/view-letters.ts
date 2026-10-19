import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { DonorCommunicationsService } from '../../services/donor-communications.service';
import { CommunicationLetter, ViewLettersDialogData } from '../../models/donor-communications.model';
import { formatTableDateTime } from '@shared/utils/date-format.util';

@Component({
  selector: 'app-view-letters',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './view-letters.html',
  styleUrls: ['./view-letters.scss']
})
export class ViewLettersDialogComponent implements OnInit, OnDestroy {
  private readonly service = inject(DonorCommunicationsService);
  private destroy$ = new Subject<void>();

  // Signals
  letters = signal<CommunicationLetter[]>([]);
  loading = signal(false);
  selectedLetter = signal<CommunicationLetter | null>(null);
  selectedLetterText = signal<string>('');
  loadingLetterText = signal(false);

  // Table columns
  displayedColumns: string[] = ['letterDate', 'comments'];

  constructor(
    public dialogRef: MatDialogRef<ViewLettersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewLettersDialogData
  ) {}

  ngOnInit(): void {
    this.loadLetters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load letters for donor
   */
  private loadLetters(): void {
    this.loading.set(true);

    this.service.getLetters(this.data.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (letters) => {
          this.letters.set(letters);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  onRowClick(letter: CommunicationLetter): void {
    this.selectedLetter.set(letter);
  }

  onShowLetter(): void {
    const letter = this.selectedLetter();
    if (!letter) return;

    if (letter.letterText) {
      this.selectedLetterText.set(letter.letterText);
      return;
    }

    this.loadLetterText(letter.letterId);
  }

  /**
   * Load letter text
   */
  private loadLetterText(letterId: string): void {
    this.loadingLetterText.set(true);
    this.selectedLetterText.set('');

    this.service.getLetterText(this.data.donorId, letterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (text) => {
          this.selectedLetterText.set(text);
          this.loadingLetterText.set(false);

          // Update letter object with loaded text
          const currentLetters = this.letters();
          const updatedLetters = currentLetters.map(l =>
            l.letterId === letterId ? { ...l, letterText: text } : l
          );
          this.letters.set(updatedLetters);
        },
        error: () => {
          this.loadingLetterText.set(false);
        }
      });
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }

  formatDate(date: string | null | undefined): string {
    return formatTableDateTime(date);
  }

  /**
   * TrackBy function for table rows
   */
  trackByLetter(_index: number, item: CommunicationLetter): string {
    return item.letterId;
  }
}
