import { Component, Inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

export interface HHQuestionDto {
  questionCode: string;
  questionText: string;
  ask?: string;
  abbrFlag?: string;
  abbrSeq?: number | null;
  repeated?: string;
  sequence?: number;
  questionNumber?: string;
  parentQuestion?: string;
  responseFlag?: string;
  subFlag?: string;
  goToNotes?: string;
}

export interface HHQuestionsDialogData {
  questions: HHQuestionDto[];
}

@Component({
  selector: 'app-hh-questions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
  ],
  template: `
    <div class="hh-questions-dialog">
      <div class="dialog-header">
        <h1 mat-dialog-title>Health History Questions</h1>
        <button mat-icon-button class="close-btn" (click)="close()" [attr.aria-label]="'Close dialog'">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="table-wrapper">
          <table mat-table [dataSource]="filteredQuestions()" class="hh-table" [attr.aria-label]="'Health history questions'">

            <ng-container matColumnDef="questionCode" sticky>
              <th mat-header-cell *matHeaderCellDef scope="col">Question Code</th>
              <td mat-cell *matCellDef="let q">{{ q.questionCode || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="ask">
              <th mat-header-cell *matHeaderCellDef scope="col">Ask</th>
              <td mat-cell *matCellDef="let q">{{ q.ask || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="abbrFlag">
              <th mat-header-cell *matHeaderCellDef scope="col">Abbr. Flag</th>
              <td mat-cell *matCellDef="let q">{{ q.abbrFlag || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="abbrSeq">
              <th mat-header-cell *matHeaderCellDef scope="col">Abbr. Seq</th>
              <td mat-cell *matCellDef="let q">{{ q.abbrSeq ?? '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="repeated">
              <th mat-header-cell *matHeaderCellDef scope="col">Repeated</th>
              <td mat-cell *matCellDef="let q">{{ q.repeated || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="sequence">
              <th mat-header-cell *matHeaderCellDef scope="col">Sequence</th>
              <td mat-cell *matCellDef="let q">{{ q.sequence ?? '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="questionNumber">
              <th mat-header-cell *matHeaderCellDef scope="col">Question Number</th>
              <td mat-cell *matCellDef="let q">{{ q.questionNumber || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="parentQuestion">
              <th mat-header-cell *matHeaderCellDef scope="col">Parent Question</th>
              <td mat-cell *matCellDef="let q">{{ q.parentQuestion || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="responseFlag">
              <th mat-header-cell *matHeaderCellDef scope="col">Response Flag</th>
              <td mat-cell *matCellDef="let q">{{ q.responseFlag || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="subFlag">
              <th mat-header-cell *matHeaderCellDef scope="col">Sub Flag</th>
              <td mat-cell *matCellDef="let q">{{ q.subFlag || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="goToNotes">
              <th mat-header-cell *matHeaderCellDef scope="col">Go To Notes</th>
              <td mat-cell *matCellDef="let q">{{ q.goToNotes || '-' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row no-data-row" *matNoDataRow>
              <td [attr.colspan]="displayedColumns.length" class="no-data-cell">
                <mat-icon aria-hidden="true">search_off</mat-icon>
                <span>No questions found</span>
              </td>
            </tr>
          </table>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-raised-button color="primary" (click)="close()">CLOSE</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .hh-questions-dialog {
      display: flex;
      flex-direction: column;
      width: 100%;

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        flex-shrink: 0;

        h1 { margin: 0; font-size: 18px; font-weight: 500; color: #333; }
      }

      mat-dialog-content {
        padding: 0;
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .table-wrapper {
        flex: 1;
        overflow: auto;

        .hh-table {
          width: 100%;
          min-width: 1100px;

          th {
            background: #f5f5f5;
            font-weight: 600;
            font-size: 12px;
            color: #333;
            padding: 10px 12px;
            white-space: nowrap;
            border-bottom: 2px solid #e0e0e0;
          }

          td {
            font-size: 12px;
            color: #555;
            padding: 10px 12px;
            white-space: nowrap;
            border-bottom: 1px solid #f0f0f0;
          }

          tr:last-child td { border-bottom: none; }
          tr:hover td { background: rgba(34,129,137,0.04); }
        }

        .no-data-cell {
          text-align: center;
          padding: 48px 16px;
          color: #999;

          mat-icon {
            display: block;
            margin: 0 auto 8px;
            font-size: 40px;
            width: 40px;
            height: 40px;
            opacity: 0.4;
          }
        }
      }

      mat-dialog-actions {
        padding: 12px 24px;
        border-top: 1px solid #e0e0e0;
        flex-shrink: 0;
      }
    }
  `]
})
export class HHQuestionsDialog implements OnInit {
  questions = signal<HHQuestionDto[]>([]);

  displayedColumns: string[] = [
    'questionCode', 'ask', 'abbrFlag', 'abbrSeq', 'repeated',
    'sequence', 'questionNumber', 'parentQuestion', 'responseFlag', 'subFlag', 'goToNotes'
  ];

  filteredQuestions = computed(() => this.questions());

  constructor(
    public dialogRef: MatDialogRef<HHQuestionsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: HHQuestionsDialogData
  ) {}

  ngOnInit(): void {
    this.questions.set(this.data.questions || []);
  }

  close(): void {
    this.dialogRef.close();
  }
}
