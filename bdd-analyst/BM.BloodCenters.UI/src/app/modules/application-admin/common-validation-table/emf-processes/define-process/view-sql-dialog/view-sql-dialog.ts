import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SqlStatement } from '../../services/define-process.service';

export interface ViewSqlDialogData {
  processCode: string;
  sqlStatements: SqlStatement[];
}

@Component({
  selector: 'app-view-sql-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './view-sql-dialog.html',
  styleUrls: ['./view-sql-dialog.scss']
})
export class ViewSqlDialogComponent {
  copiedIndex: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<ViewSqlDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewSqlDialogData
  ) {}

  onCopy(sql: string, index: number): void {
    navigator.clipboard.writeText(sql);
    this.copiedIndex = index;
    setTimeout(() => this.copiedIndex = null, 2000);
  }

  onCopyAll(): void {
    const allSql = this.data.sqlStatements
      .map((stmt, idx) => `-- ${idx + 1}. ${stmt.lookingFor} (Process Seq: ${stmt.processSeq})\n${stmt.sqlStmt}`)
      .join('\n\n');
    navigator.clipboard.writeText(allSql);
    this.copiedIndex = -1;
    setTimeout(() => this.copiedIndex = null, 2000);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
