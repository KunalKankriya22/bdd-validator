import { Component, Inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UppercaseDatePipe } from '@shared/pipes/uppercase-date.pipe';
import { CommunicationLettersService } from '../services/communication-letters.service';
import { CommLetterView } from '../models/communication-letter.model';

export interface ViewCommLetterData {
  letter: CommLetterView;
}

@Component({
  selector: 'app-view-comm-letter',
  standalone: true,
  templateUrl: './view-letter.html',
  styleUrls: ['./view-letter.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UppercaseDatePipe,
  ],
})
export class ViewCommLetter implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  letter!: CommLetterView;
  dialogTitle = '';
  letterMessage = '';
  versionNo = '';

  constructor(
    private dialogRef: MatDialogRef<ViewCommLetter>,
    private dialog: MatDialog,
    private service: CommunicationLettersService,
    @Inject(MAT_DIALOG_DATA) public data: ViewCommLetterData,
  ) {
    this.letter = data.letter;
  }

  ngOnInit(): void {
    this.populateDisplayValues();
    this.loadFullLetterDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private populateDisplayValues(): void {
    this.dialogTitle = this.letter.letterTitle || this.letter.letterCode;
    this.versionNo = this.letter.versionNo?.toString() || '—';
    this.letterMessage = this.letter.letterContent || '';
  }

  private loadFullLetterDetails(): void {
    if (!this.letter.letterId) return;

    this.loading.set(true);

    this.service
      .getLetterContent(this.letter.letterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fullLetter) => {
          if (fullLetter?.letterId) {
            this.letter = fullLetter;
            this.populateDisplayValues();
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load letter content. Please try again.');
          this.loading.set(false);
        },
      });
  }

  onPreview(): void {
    this.dialogRef.close();
    import('../preview-letter/preview-letter').then((m) => {
      this.dialog.open(m.PreviewCommLetter, {
        width: '800px',
        height: '100vh',
        position: { right: '0', top: '64px' },
        panelClass: ['comm-letter-drawer', 'preview-letter-drawer'],
        autoFocus: false,
        data: { letter: this.letter },
      });
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
