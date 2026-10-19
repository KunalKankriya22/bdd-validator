import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import type { PrintInstructionDto } from '../models/print-special-instructions.models';

export interface ViewPrintInstructionsDialogData {
  instructions: PrintInstructionDto[];
}

@Component({
  selector: 'app-view-print-instructions-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="instructions-dialog">
      <div class="instructions-dialog__header">
        <h2 class="instructions-dialog__title">View Print Instructions</h2>
        <button
          mat-icon-button
          class="close-btn"
          (click)="onClose()"
          aria-label="Close dialog">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="instructions-dialog__content">
        <table class="instructions-table" aria-label="Print Instructions">
          <thead>
            <tr>
              <th class="col-sequence sortable"
              tabindex="0"
              (click)="toggleSort()"
              (keydown.enter)="toggleSort()"
              (keydown.space)="$event.preventDefault(); toggleSort()"
              aria-label="Sort by sequence"
              [attr.aria-sort]="sortState() === 'asc' ? 'ascending' : sortState() === 'desc' ? 'descending' : 'none'">
                <span class="col-header-content">
                  Sequence
                  @if (sortState() === 'asc') {
                    <mat-icon class="sort-icon sort-icon--active" aria-hidden="true">arrow_upward</mat-icon>
                  } @else if (sortState() === 'desc') {
                    <mat-icon class="sort-icon sort-icon--active" aria-hidden="true">arrow_downward</mat-icon>
                  } @else {
                    <mat-icon class="sort-icon sort-icon--inactive" aria-hidden="true">unfold_more</mat-icon>
                  }
                </span>
              </th>
              <th class="col-separator"></th>
              <th class="col-instructions">Print Instructions</th>
            </tr>
          </thead>
          <tbody>
            @for (instruction of sortedInstructions(); track instruction.sequence) {
              <tr>
                <td class="col-sequence">{{ instruction.sequence }}</td>
                <td class="col-separator"></td>
                <td class="col-instructions">{{ instruction.printInstruction }}</td>
              </tr>
            }
            @if (data.instructions.length === 0) {
              <tr>
                <td colspan="3" class="empty-cell">
                  <div class="empty-state">
                    <div class="empty-icon-circle">
                      <mat-icon class="empty-icon">search</mat-icon>
                    </div>
                    <p class="empty-message">No print instructions available to display</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="instructions-dialog__footer">
        <button mat-button class="btn-close" (click)="onClose()" aria-label="Close">CLOSE</button>
      </div>
    </div>
  `,
  styles: [`
    .instructions-dialog {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fff;
    }

    .instructions-dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .instructions-dialog__title {
      font-family: Roboto, sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: #081620;
      margin: 0;
    }

    .close-btn {
      color: #666;
      width: 32px;
      height: 32px;
    }

    .instructions-dialog__content {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }

    .instructions-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;

      thead tr {
        background: #fafafa;
        border-bottom: 2px solid #e0e0e0;
      }

      th {
        font-family: Roboto, sans-serif;
        font-weight: 500;
        font-size: 13px;
        color: #666;
        padding: 14px 16px;
        text-align: left;
        white-space: nowrap;
        vertical-align: middle;
      }

      td {
        font-family: Roboto, sans-serif;
        font-weight: 400;
        font-size: 14px;
        color: #333;
        padding: 14px 16px;
        border-bottom: 1px solid #f0f0f0;
        vertical-align: middle;
      }

      .col-sequence {
        width: 100px;
        text-align: center;
      }

      th.col-sequence {
        text-align: left;
        padding-left: 24px;
      }

      td.col-sequence {
        text-align: center;
        color: #228189;
        font-weight: 500;
      }

      .col-separator {
        width: 1px;
        min-width: 1px;
        background-color: #e0e0e0;
        padding: 0;
      }

      .col-instructions {
        padding-left: 24px;
      }

      .empty-cell {
        text-align: center;
        padding: 0;
        border: none;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        gap: 16px;
        min-height: 200px;
      }

      .empty-icon-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #9e9e9e;
      }

      .empty-message {
        color: #3d5463;
        margin: 0;
        font-size: 14px;
        font-family: Roboto, sans-serif;
        font-weight: 400;
      }
    }

    .sortable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: #f5f5f5;
      }

      &:focus-visible {
        outline: 2px solid #228189;
        outline-offset: -2px;
      }

      &:focus:not(:focus-visible) {
        outline: none;
      }

      .col-header-content {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .sort-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;

      &--active {
        color: #228189;
      }

      &--inactive {
        color: #999;
      }
    }

    .instructions-dialog__footer {
      display: flex;
      justify-content: flex-end;
      padding: 12px 24px;
      border-top: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .btn-close {
      color: #228189;
      font-family: Roboto, sans-serif;
      font-weight: 500;
      font-size: 14px;
      border: 1px solid #228189;
      text-transform: uppercase;
    }
  `],
})
export class ViewPrintInstructionsDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ViewPrintInstructionsDialogComponent>);
  readonly data: ViewPrintInstructionsDialogData = inject(MAT_DIALOG_DATA);

  readonly sortState = signal<'default' | 'asc' | 'desc'>('default');

  readonly sortedInstructions = computed(() => {
    const state = this.sortState();
    const instructions = [...this.data.instructions];

    if (state === 'asc') {
      return instructions.sort((a, b) => a.sequence - b.sequence);
    } else if (state === 'desc') {
      return instructions.sort((a, b) => b.sequence - a.sequence);
    }
    return instructions; // default - original order
  });

  toggleSort(): void {
    const current = this.sortState();
    if (current === 'default') {
      this.sortState.set('asc');
    } else if (current === 'asc') {
      this.sortState.set('desc');
    } else {
      this.sortState.set('default');
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
