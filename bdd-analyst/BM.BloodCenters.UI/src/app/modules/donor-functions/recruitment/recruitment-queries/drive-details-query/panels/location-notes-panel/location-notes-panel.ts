import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, finalize } from 'rxjs';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogHeaderFields } from '@shared/components/dialog-header-fields/dialog-header-fields';
import { DialogButton, DialogHeaderField } from '@shared/interfaces/dialog.interface';

import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import { LocationNote } from '../../models/drive-details-query.model';

@Component({
  selector: 'app-location-notes-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    SidePanelBase,
    DialogHeaderFields
  ],
  templateUrl: './location-notes-panel.html',
  styleUrl: './location-notes-panel.scss'
})
export class LocationNotesPanel implements OnInit, OnDestroy, OnChanges {
  private readonly service = inject(DriveDetailsQueryService);
  private destroy$ = new Subject<void>();

  /** Drive ID to load notes for */
  @Input() driveId: string = '';

  /** Location ID for header display */
  @Input() locationId: string = '';

  /** Location name for header display */
  @Input() locationName: string = '';

  /** Emitted when panel should be closed */
  @Output() closePanel = new EventEmitter<void>();

  panelTitle = 'Location Notes';

  headerFields: DialogHeaderField[] = [];

  // No footer buttons - panel closes via X button only
  footerButtons: DialogButton[] = [];

  notes: LocationNote[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.initializeHeaderFields();
    this.loadLocationNotes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driveId'] && !changes['driveId'].firstChange) {
      this.loadLocationNotes();
    }
    if (changes['locationId'] || changes['locationName']) {
      this.initializeHeaderFields();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeHeaderFields(): void {
    this.headerFields = [
      { label: 'Location ID', value: this.locationId || '--' },
      { label: 'Location Name', value: this.locationName || '--' }
    ];
  }

  private loadLocationNotes(): void {
    if (!this.driveId) {
      return;
    }

    this.isLoading = true;

    this.service.getLocationNotes(this.driveId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (notes) => {
          this.notes = notes;

          // Update header fields from first note if available
          if (notes.length > 0) {
            this.headerFields = [
              { label: 'Location ID', value: notes[0].locationId || this.locationId || '--' },
              { label: 'Location Name', value: notes[0].locationName || this.locationName || '--' }
            ];
          }
        },
        error: (err) => {
          console.error('Error loading location notes:', err);
          this.notes = [];
        }
      });
  }

  onButtonClick(action: string): void {
    if (action === 'close') {
      this.closePanel.emit();
    }
  }

  onClose(): void {
    this.closePanel.emit();
  }

  /**
   * Format user name: converts "Last, First" to "First Last"
   */
  formatUserName(userName: string | null, userId: string | null): string {
    if (!userName && !userId) {
      return '--';
    }

    const name = userName || userId || '--';

    if (name.includes(',')) {
      const parts = name.split(',').map(part => part.trim());
      if (parts.length === 2) {
        return `${parts[1]} ${parts[0]}`;
      }
    }

    return name;
  }

  /**
   * Format version number to always show one decimal place
   */
  formatVersion(value: number | null): string {
    if (value === null || value === undefined) {
      return '--';
    }
    return value.toFixed(1);
  }

  /**
   * Format note date for display (DD-MMM-YYYY)
   */
  formatNoteDate(dateStr: string | null): string {
    if (!dateStr) return '--';
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  }
}
