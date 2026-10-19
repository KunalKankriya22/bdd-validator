import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

export interface HHTemplateQuestion {
  questionCode: string;
  ask: string;
  abbrFlag: string;
  abbrSeq: number | null;
  repeated: string;
  sequence: number;
  questionNumber: string;
  parentQuestion: string;
  responseFlag: string;
  subFlag: string;
  goToNotes: string;
}

export interface HHTemplateDialogData {
  templateQuestions: HHTemplateQuestion[];
  templateName?: string;
}

@Component({
  selector: 'app-hh-template-dialog',
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
    <div class="hh-template-dialog">
      <div class="dialog-header">
        <h1 mat-dialog-title>Health History Template{{ data.templateName ? ' - ' + data.templateName : '' }}</h1>
        <button mat-icon-button class="close-button" (click)="close()" [attr.aria-label]="'Close dialog'">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <!-- Search Box -->
        <div class="search-section">
          <mat-form-field appearance="fill" class="search-field">
            <mat-label>Search Template Questions</mat-label>
            <input
              matInput
              [(ngModel)]="searchTermValue"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Search by question code..."
              />
            <mat-icon matPrefix aria-hidden="true">search</mat-icon>
          </mat-form-field>
        </div>

        <!-- Template Questions Table -->
        <div class="table-container">
          @if (filteredQuestions().length > 0) {
            <table mat-table [dataSource]="filteredQuestions()" class="template-table" [attr.aria-label]="'Health history template questions'">
              <!-- Question Code Column -->
              <ng-container matColumnDef="questionCode">
                <th mat-header-cell *matHeaderCellDef scope="col">Question Code</th>
                <td mat-cell *matCellDef="let question">{{ question.questionCode }}</td>
              </ng-container>

              <!-- Ask Column -->
              <ng-container matColumnDef="ask">
                <th mat-header-cell *matHeaderCellDef scope="col">Ask</th>
                <td mat-cell *matCellDef="let question">{{ question.ask }}</td>
              </ng-container>

              <!-- Abbr. Flag Column -->
              <ng-container matColumnDef="abbrFlag">
                <th mat-header-cell *matHeaderCellDef scope="col">Abbr. Flag</th>
                <td mat-cell *matCellDef="let question">{{ question.abbrFlag || '-' }}</td>
              </ng-container>

              <!-- Abbr. Seq Column -->
              <ng-container matColumnDef="abbrSeq">
                <th mat-header-cell *matHeaderCellDef scope="col">Abbr. Seq</th>
                <td mat-cell *matCellDef="let question">{{ question.abbrSeq ?? '-' }}</td>
              </ng-container>

              <!-- Repeated Column -->
              <ng-container matColumnDef="repeated">
                <th mat-header-cell *matHeaderCellDef scope="col">Repeated</th>
                <td mat-cell *matCellDef="let question">{{ question.repeated }}</td>
              </ng-container>

              <!-- Sequence Column -->
              <ng-container matColumnDef="sequence">
                <th mat-header-cell *matHeaderCellDef scope="col">Sequence</th>
                <td mat-cell *matCellDef="let question">{{ question.sequence }}</td>
              </ng-container>

              <!-- Question Number Column -->
              <ng-container matColumnDef="questionNumber">
                <th mat-header-cell *matHeaderCellDef scope="col">Question Number</th>
                <td mat-cell *matCellDef="let question">{{ question.questionNumber }}</td>
              </ng-container>

              <!-- Parent Question Column -->
              <ng-container matColumnDef="parentQuestion">
                <th mat-header-cell *matHeaderCellDef scope="col">Parent Question</th>
                <td mat-cell *matCellDef="let question">{{ question.parentQuestion || '-' }}</td>
              </ng-container>

              <!-- Response Flag Column -->
              <ng-container matColumnDef="responseFlag">
                <th mat-header-cell *matHeaderCellDef scope="col">Response Flag</th>
                <td mat-cell *matCellDef="let question">{{ question.responseFlag }}</td>
              </ng-container>

              <!-- Sub Flag Column -->
              <ng-container matColumnDef="subFlag">
                <th mat-header-cell *matHeaderCellDef scope="col">Sub Flag</th>
                <td mat-cell *matCellDef="let question">{{ question.subFlag || '-' }}</td>
              </ng-container>

              <!-- Go To Notes Column -->
              <ng-container matColumnDef="goToNotes">
                <th mat-header-cell *matHeaderCellDef scope="col">Go To Notes</th>
                <td mat-cell *matCellDef="let question">{{ question.goToNotes || '-' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="template-row"></tr>
            </table>
          } @else {
            <div class="no-results">
              <mat-icon aria-hidden="true">search_off</mat-icon>
              <p>No template questions found matching your search</p>
            </div>
          }
        </div>

        @if (filteredQuestions().length > 0) {
          <div class="results-summary">
            Showing {{ filteredQuestions().length }} of {{ questions().length }} questions
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-raised-button color="primary" (click)="close()" [attr.aria-label]="'Close dialog'">
          CLOSE
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .hh-template-dialog {
      width: 100%;
      max-width: 1200px;
      min-height: 600px;
      display: flex;
      flex-direction: column;

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #e0e0e0;

        h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 500;
          color: #333333;
        }

        .close-button {
          width: 32px;
          height: 32px;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
      }

      mat-dialog-content {
        padding: 16px 24px;
        overflow: hidden;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .search-section {
        flex-shrink: 0;

        .search-field {
          width: 100%;
          max-width: 400px;
          margin: 0;

          ::ng-deep .mat-mdc-form-field-infix {
            padding-top: 8px;
            padding-bottom: 8px;
          }
        }
      }

      .table-container {
        flex: 1;
        overflow: auto;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        background: #ffffff;

        .template-table {
          width: 100%;
          min-width: 1000px;

          th {
            background-color: #f5f5f5;
            font-weight: 600;
            font-size: 12px;
            color: #333333;
            padding: 12px 8px;
            border-bottom: 2px solid #e0e0e0;
            white-space: nowrap;
            position: sticky;
            top: 0;
            z-index: 10;
          }

          td {
            padding: 12px 8px;
            font-size: 12px;
            color: #666666;
            border-bottom: 1px solid #f0f0f0;
          }

          .template-row:hover {
            background-color: rgba(34, 129, 137, 0.04);
          }

          tr:last-child td {
            border-bottom: none;
          }
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 16px;
          color: #666666;

          mat-icon {
            font-size: 64px;
            width: 64px;
            height: 64px;
            margin-bottom: 16px;
            opacity: 0.3;
          }

          p {
            margin: 0;
            font-size: 14px;
          }
        }
      }

      .results-summary {
        flex-shrink: 0;
        font-size: 13px;
        color: #666666;
        text-align: right;
        padding: 8px 0;
      }

      mat-dialog-actions {
        padding: 16px 24px;
        border-top: 1px solid #e0e0e0;
        margin: 0;
        flex-shrink: 0;

        button {
          font-weight: 500;
          font-size: 13px;
          letter-spacing: 0.5px;
        }
      }
    }

    @media (max-width: 1024px) {
      .hh-template-dialog {
        max-width: 100%;

        .table-container {
          .template-table {
            min-width: 800px;

            th, td {
              padding: 8px 6px;
              font-size: 11px;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .hh-template-dialog {
        .search-section {
          .search-field {
            max-width: 100%;
          }
        }
      }
    }
  `]
})
export class HHTemplateDialog {
  searchTermValue = '';
  searchTerm = signal<string>('');
  questions = signal<HHTemplateQuestion[]>([]);

  displayedColumns: string[] = [
    'questionCode',
    'ask',
    'abbrFlag',
    'abbrSeq',
    'repeated',
    'sequence',
    'questionNumber',
    'parentQuestion',
    'responseFlag',
    'subFlag',
    'goToNotes'
  ];

  filteredQuestions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const allQuestions = this.questions();

    if (!term) {
      return allQuestions;
    }

    return allQuestions.filter(q =>
      q.questionCode?.toLowerCase().includes(term) ||
      q.questionNumber?.toLowerCase().includes(term) ||
      q.parentQuestion?.toLowerCase().includes(term)
    );
  });

  constructor(
    public dialogRef: MatDialogRef<HHTemplateDialog>,
    @Inject(MAT_DIALOG_DATA) public data: HHTemplateDialogData
  ) {
    this.questions.set(this.data.templateQuestions || []);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  close(): void {
    this.dialogRef.close();
  }
}
