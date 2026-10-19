import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import { MatTooltipModule, MatTooltip } from '@angular/material/tooltip';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';

import { DriveDetailsQueryService } from '../../services/drive-details-query.service';
import {
  DriveEstimatedResource,
  DriveScheduledStaff,
  DriveActualStaff
} from '../../models/drive-details-query.model';

@Component({
  selector: 'app-drive-resources-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatTooltipModule,
    SidePanelBase
  ],
  templateUrl: './drive-resources-panel.html',
  styleUrl: './drive-resources-panel.scss'
})
export class DriveResourcesPanel implements OnInit, OnDestroy, OnChanges {
  private readonly service = inject(DriveDetailsQueryService);
  private destroy$ = new Subject<void>();

  /** Drive ID to load resources for */
  @Input() driveId: string = '';

  /** Schedule ID for resources */
  @Input() scheduleId?: string;

  /** Emitted when panel should be closed */
  @Output() closePanel = new EventEmitter<void>();

  panelTitle = 'Drive Resources';

  // No footer buttons - panel closes via X button only
  footerButtons: DialogButton[] = [];

  // Table data
  estimatedData: DriveEstimatedResource[] = [];
  scheduledData: DriveScheduledStaff[] = [];
  actualData: DriveActualStaff[] = [];

  // Team Leader Info (extracted from scheduled staff)
  teamLeaderPhone = '';
  teamLeaderPager = '';

  isLoading = false;

  ngOnInit(): void {
    this.loadResources();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driveId'] && !changes['driveId'].firstChange) {
      this.loadResources();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadResources(): void {
    if (!this.driveId) {
      return;
    }

    this.isLoading = true;

    this.service.getDriveResources(this.driveId, this.scheduleId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.estimatedData = response.estimatedResources || [];
          this.scheduledData = response.scheduledStaff || [];
          this.actualData = response.actualStaff || [];

          // Extract team leader info from scheduled staff
          const teamLeader = this.scheduledData.find(s => s.teamLeaderPhone || s.teamLeaderPager);
          if (teamLeader) {
            this.teamLeaderPhone = teamLeader.teamLeaderPhone || '';
            this.teamLeaderPager = teamLeader.teamLeaderPager || '';
          }
        },
        error: (err) => {
          console.error('Error loading drive resources:', err);
          this.estimatedData = [];
          this.scheduledData = [];
          this.actualData = [];
        }
      });
  }

  getFieldValue(value: string | null | undefined): string {
    return value || '--';
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
   * Show tooltip only if text is overflowing (truncated)
   */
  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }
}
