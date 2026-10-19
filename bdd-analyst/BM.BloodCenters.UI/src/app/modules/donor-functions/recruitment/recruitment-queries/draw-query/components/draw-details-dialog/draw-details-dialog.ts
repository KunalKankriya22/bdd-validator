import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { DriveDetail } from '../../models/draw-query.model';
import { DrawQueryService } from '../../services/draw-query.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

export interface DrawDetailsDialogData {
  driveDate: string;
  driveDay: string;
  numberOfDrives: number;
  driveType: string;
}

@Component({
  selector: 'app-draw-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './draw-details-dialog.html',
  styleUrls: ['./draw-details-dialog.scss']
})
export class DrawDetailsDialog implements OnInit {
  driveDetails: DriveDetail[] = [];
  isLoading = false;

  tableConfig: DataTableConfig<DriveDetail> = {
    columns: [
      { key: 'driveId', header: 'S.No', sortable: false, type: 'text', width: '50px',
        valueFormatter: (_value, row) => {
          const index = this.driveDetails.indexOf(row);
          return (index + 1).toString();
        }
      },
      { key: 'projectedDraw', header: 'Project', sortable: false, type: 'number', width: '60px' },
      { key: 'driveType', header: 'Drive ID', sortable: false, type: 'text', width: '110px',
        valueFormatter: (_value, row) => row.driveId
      },
      { key: 'sponsorName', header: 'Sponsor Name', sortable: false, type: 'text', width: '180px' },
      { key: 'driveTimes', header: 'Time', sortable: false, type: 'text', width: '110px' },
      { key: 'sponsorId', header: 'P/Drw', sortable: false, type: 'text', width: '60px', cellClass: 'text-center',
        valueFormatter: (_value, row) => (row.projectedDraw || 0).toString()
      },
      { key: 'staffRequired', header: 'Staff', sortable: false, type: 'number', width: '50px', cellClass: 'text-center' },
      { key: 'vanRequired', header: 'Van', sortable: false, type: 'number', width: '50px', cellClass: 'text-center' },
      { key: 'coachRequired', header: 'Coach', sortable: false, type: 'number', width: '55px', cellClass: 'text-center' },
      { key: 'driveTypeDescription', header: 'Type', sortable: false, type: 'text', width: '60px' },
      { key: 'facilityCode', header: 'Facility', sortable: false, type: 'text', width: '80px',
        valueFormatter: (value) => value || '-'
      },
      { key: 'recruiterName', header: 'Recruiter', sortable: false, type: 'text', width: '120px' }
    ],
    rowActions: [],
    stickyHeader: true,
    showActionsAsMenu: false,
    stickyActionsColumn: true,
    showPagination: false,
    emptyMessage: 'No drive details found for this date.'
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DrawDetailsDialogData,
    private dialogRef: MatDialogRef<DrawDetailsDialog>,
    private drawQueryService: DrawQueryService,
    private router: Router
  ) {
    // WCAG 2.1.2: Allow Escape to close even with disableClose: true
    this.dialogRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        this.onClose();
      }
    });
  }

  ngOnInit(): void {
    this.loadDriveDetails();
  }

  get formattedDate(): string {
    if (!this.data.driveDate) return '';
    const date = new Date(this.data.driveDate);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const dayName = days[date.getDay()];
    return `${day}-${month}-${year} | ${dayName}`;
  }

  getTotalProjectedDraw(): number {
    return this.driveDetails.reduce((sum, d) => sum + (d.projectedDraw || 0), 0);
  }

  getTotalStaff(): number {
    return this.driveDetails.reduce((sum, d) => sum + (d.staffRequired || 0), 0);
  }

  getTotalVan(): number {
    return this.driveDetails.reduce((sum, d) => sum + (d.vanRequired || 0), 0);
  }

  getTotalCoach(): number {
    return this.driveDetails.reduce((sum, d) => sum + (d.coachRequired || 0), 0);
  }

  private loadDriveDetails(): void {
    this.isLoading = true;
    this.drawQueryService.getDriveDetails(this.data.driveDate, this.data.driveType).subscribe({
      next: (details) => {
        this.driveDetails = details;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading drive details:', error);
        this.isLoading = false;
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onRowAction(event: TableRowActionEvent<DriveDetail>): void {
    if (event.action === 'view-details') {
      // Store dialog data in sessionStorage before closing
      sessionStorage.setItem('drawDetailsDialogData', JSON.stringify(this.data));
      sessionStorage.setItem('shouldRestoreDrawQuery', 'true');

      // Signal that navigation is in progress (for loader)
      sessionStorage.setItem('driveDetailsNavigating', 'true');

      // Close the dialog
      this.dialogRef.close();

      // Navigate to drive details query with the driveId and driveType
      this.router.navigate(['/donor-functions/recruitment/recruitment-queries/drive-details-query'], {
        queryParams: {
          driveId: event.row.driveId,
          driveType: this.data.driveType
        }
      });
    }
  }
}
