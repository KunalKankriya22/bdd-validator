import { Component, Inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Subject } from 'rxjs';
import moment from 'moment';

export interface OtherHoldRecord {
  holdCode: string;
  description: string;
  origin?: string;
  reasonCode?: string;
  effectiveDate: string;
  terminationDate?: string;
}

export interface OtherHoldsDialogData {
  unitId: string;
}

@Component({
  selector: 'app-other-holds-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './other-holds-dialog.component.html',
  styleUrls: ['./other-holds-dialog.component.scss']
})
export class OtherHoldsDialogComponent implements OnInit, OnDestroy {
  otherHolds = signal<OtherHoldRecord[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  displayedColumns: string[] = [
    'holdCode',
    'description',
    'origin',
    'reasonCode',
    'effectiveDate',
    'terminationDate'
  ];

  private destroy$ = new Subject<void>();

  // TODO: Replace with real API call when backend endpoint is available
  private mockOtherHoldsData: { [unitId: string]: OtherHoldRecord[] } = {
    'W12342402705-Q': [
      {
        holdCode: '10IB',
        description: 'TB for Function 1.01',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      },
      {
        holdCode: 'BLTMN',
        description: 'Blood times not recorded on donor record',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      },
      {
        holdCode: 'HDT',
        description: 'Health History Deferral - Temporary',
        origin: '15',
        reasonCode: 'CMV',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      },
      {
        holdCode: 'ILBTM',
        description: 'Illegal Blood Time',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      }
    ],
    'W12342402705-D': [
      {
        holdCode: 'HDT',
        description: 'Health History Deferral',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      }
    ],
    'W12342402705-Y': [
      {
        holdCode: '10IB',
        description: 'TB for Function 1.01',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      }
    ],
    'W12342402705-W': [
      {
        holdCode: 'BLTMN',
        description: 'Blood times not recorded on donor record',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      }
    ]
  };

  constructor(
    public dialogRef: MatDialogRef<OtherHoldsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OtherHoldsDialogData
  ) {}

  ngOnInit(): void {
    this.loadOtherHolds();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOtherHolds(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    // TODO: Replace with real API call
    // Example: this.interdictionQueryService.getOtherHolds(this.data.unitId)
    const holds = this.mockOtherHoldsData[this.data.unitId] || [];

    // Simulate async loading
    setTimeout(() => {
      this.otherHolds.set(holds);
      this.isLoading.set(false);
    }, 300);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    return moment(date).isValid() ? moment(date).format('DD-MMM-YYYY').toUpperCase() : '';
  }
}
