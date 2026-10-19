import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { YtdLossDialogData } from '../models/donor-detail-query.model';

@Component({
  selector: 'app-ytd-loss-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ytd-loss-dialog.html',
  styleUrls: ['./ytd-loss-dialog.scss'],
})
export class YtdLossDialog {
  private readonly dialogRef = inject(MatDialogRef<YtdLossDialog>);
  private readonly data = inject<YtdLossDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly rbcLoss: string;
  readonly plasmaLoss: string;

  constructor() {
    this.rbcLoss = this.data?.rbcLoss != null ? String(this.data.rbcLoss) : '—';
    this.plasmaLoss = this.data?.plasmaLoss != null ? String(this.data.plasmaLoss) : '—';
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
