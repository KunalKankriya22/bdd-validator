import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TubesNotesPanelComponent } from '../../../modules/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/tubes-checkin-query/tubes-notes-panel/tubes-notes-panel';

export interface BatchNotesDialogData {
  batchId: string;
  contractId: string;
  contextLabel?: string;
  contextPrefix?: string;
}

@Component({
  selector: 'app-batch-notes-dialog',
  standalone: true,
  imports: [TubesNotesPanelComponent],
  templateUrl: './batch-notes-dialog.html',
  styleUrls: ['./batch-notes-dialog.scss'],
})
export class BatchNotesDialog {
  constructor(
    public dialogRef: MatDialogRef<BatchNotesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: BatchNotesDialogData,
  ) {}

  onPanelClose(): void {
    this.dialogRef.close();
  }
}
