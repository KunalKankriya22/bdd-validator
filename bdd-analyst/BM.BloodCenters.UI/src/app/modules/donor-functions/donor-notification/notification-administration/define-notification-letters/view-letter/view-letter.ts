import { Component, Inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NotificationLettersService } from '../services/notification-letters.service';
import { LetterView, TemplateVariable } from '../models/notification-letter.model';
import { TemplateVariableUtil } from '../utils/template-variable.util';

/**
 * Dialog data interface for ViewLetter
 */
export interface ViewLetterData {
  letter: LetterView;
}

/**
 * Dialog component for viewing letter details (read-only)
 * Displays letter information with option to open preview
 */
@Component({
  selector: 'app-view-letter',
  standalone: true,
  templateUrl: './view-letter.html',
  styleUrls: ['./view-letter.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class ViewLetter implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  letter!: LetterView;

  // Loading state
  protected readonly loading = signal<boolean>(false);

  // Display values
  letterCode = '';
  title = '';
  description = '';
  effectiveDate = '';
  terminationDate = '';
  versionNo = '';
  fileName = '';
  letterMessage = '';
  createdBy = '';
  createdDate = '';

  // User avatars (placeholder for future implementation)
  userInitials: string[] = [];

  // Template variables for formatting letter message
  private templateVariables: TemplateVariable[] = [];

  constructor(
    private dialogRef: MatDialogRef<ViewLetter>,
    private dialog: MatDialog,
    private service: NotificationLettersService,
    @Inject(MAT_DIALOG_DATA) public data: ViewLetterData
  ) {
    this.letter = data.letter;
  }

  ngOnInit(): void {
    this.loadTemplateVariables();
    this.loadFullLetterDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load template variables for formatting letter message
   */
  private loadTemplateVariables(): void {
    this.service
      .getTemplateVariables()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (variables) => {
          this.templateVariables = variables;
        },
        error: (err) => {
          console.error('Failed to load template variables:', err);
          this.templateVariables = [];
        }
      });
  }

  /**
   * Load full letter details including letterMessage
   */
  private loadFullLetterDetails(): void {
    const letterCode = this.letter.letterCode;

    if (!letterCode) {
      console.error('Missing letterCode');
      this.populateDisplayValues();
      return;
    }

    this.loading.set(true);

    const versionNo = this.letter.currentVersion?.versionNo;

    // Minimum loading time to ensure spinner is visible
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));

    Promise.all([
      minLoadingTime,
      this.service
        .getLetterDetail(letterCode, 'N', versionNo)
        .pipe(takeUntil(this.destroy$))
        .toPromise()
    ]).then(([_, fullLetter]) => {
      if (fullLetter) {
        this.letter = fullLetter;
        this.populateDisplayValues();
        this.generateUserInitials();
      }
      this.loading.set(false);
    }).catch((err) => {
      console.error('Failed to load letter details:', err);
      this.populateDisplayValues();
      this.generateUserInitials();
      this.loading.set(false);
    });
  }

  /**
   * Populate display values from letter data
   */
  private populateDisplayValues(): void {
    this.letterCode = this.letter.letterCode;
    this.title = this.letter.title || '';
    this.description = this.letter.description || '';
    this.fileName = this.letter.fileName || '';

    if (this.letter.currentVersion) {
      const version = this.letter.currentVersion;
      this.effectiveDate = version.effectiveDate || '—';
      this.terminationDate = version.terminationDate || '—';
      this.versionNo = version.versionNo?.toString() || '—';

      // Format letter message with template variables replaced by sample data
      const rawMessage = version.letterMessage || '';
      this.letterMessage = this.formatLetterMessage(rawMessage);

      this.createdBy = version.createdBy || '—';
      this.createdDate = version.createdDate || '—';
    } else {
      // Set placeholders when version data is missing
      this.effectiveDate = '—';
      this.terminationDate = '—';
      this.versionNo = '—';
      this.createdBy = '—';
      this.createdDate = '—';
    }
  }

  /**
   * Format letter message with template variables replaced by sample data
   */
  private formatLetterMessage(rawMessage: string): string {
    if (!rawMessage || !rawMessage.trim()) {
      return '';
    }

    // If no template variables loaded yet, show raw message
    if (!this.templateVariables || this.templateVariables.length === 0) {
      return rawMessage;
    }

    // Use TemplateVariableUtil to replace variables with sample data
    return TemplateVariableUtil.generatePreview(rawMessage, this.templateVariables);
  }

  /**
   * Generate user initials for avatar badges
   * TODO: Get actual user information from backend
   */
  private generateUserInitials(): void {
    // Placeholder implementation
    // In a real implementation, this would fetch user information
    if (this.createdBy && this.createdBy !== '—') {
      const names = this.createdBy.split(' ');
      if (names.length >= 2) {
        this.userInitials = [
          names[0].charAt(0).toUpperCase(),
          names[1].charAt(0).toUpperCase()
        ];
      } else if (names.length === 1) {
        this.userInitials = [names[0].charAt(0).toUpperCase()];
      }
    }

    // Default initials if none available
    if (this.userInitials.length === 0) {
      this.userInitials = ['C', 'V'];
    }
  }

  /**
   * Open preview letter dialog
   * NOTE: View Letter already has full details loaded, so we can directly open preview
   */
  onPreview(): void {
    const versionNo = this.letter.currentVersion?.versionNo;
    const letterCode = this.letter.letterCode;

    if (!versionNo || !letterCode) {
      console.error('Cannot preview: missing version number or letter code');
      return;
    }

    this.dialogRef.close();

    // Import and open PreviewLetter dialog as right-side drawer
    import('../preview-letter/preview-letter').then(m => {
      this.dialog.open(m.PreviewLetter, {
        width: '800px',
        height: '100vh',
        position: { right: '0', top: '64px' },
        panelClass: ['notification-letter-drawer', 'preview-letter-drawer'],
        disableClose: true,
        data: {
          letterCode: letterCode,
          versionNo: versionNo
        }
      });
    });
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Get avatar color class based on index
   */
  getAvatarColorClass(index: number): string {
    const colors = ['avatar-primary', 'avatar-secondary', 'avatar-tertiary'];
    return colors[index % colors.length];
  }
}
