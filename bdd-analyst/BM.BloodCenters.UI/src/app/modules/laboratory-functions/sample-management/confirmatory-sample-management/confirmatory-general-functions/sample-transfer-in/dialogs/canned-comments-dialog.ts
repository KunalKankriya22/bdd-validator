import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface CannedCommentsDialogData {
  items: Array<{ code: string; codeDesc: string }>;
  previouslySelected: string[];
}

export interface CannedCommentsDialogResult {
  selectedDescriptions: string;
}

@Component({
  selector: 'app-canned-comments-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatCheckboxModule,
  ],
  templateUrl: './canned-comments-dialog.html',
  styles: [`
    .canned-comments-dialog {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: #ffffff;
      animation: slideInFromRight 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    @keyframes slideInFromRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);

      .header-left {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .back-button {
        color: rgba(0, 0, 0, 0.54);
      }

      h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
    }

    mat-dialog-content {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    .search-row {
      margin-bottom: 12px;
    }

    .search-field {
      width: 240px;
    }

    .search-icon {
      color: rgba(0, 0, 0, 0.54);
    }

    .comments-table {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .table-header {
      display: flex;
      background: #f5f5f5;
      border-bottom: 2px solid #009688;
      font-weight: 600;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.87);
    }

    .table-header .col,
    .table-row .col {
      padding: 8px 12px;
      display: flex;
      align-items: center;
    }

    .col--check { width: 48px; flex-shrink: 0; justify-content: center; }
    .col--code { width: 100px; flex-shrink: 0; }
    .col--desc { flex: 1; }

    .table-body {
      flex: 1;
      overflow-y: auto;
    }

    .table-row {
      display: flex;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.87);
      cursor: pointer;
      transition: background 0.15s;

      &:hover { background: #f5f5f5; }
    }

    .table-empty {
      padding: 24px;
      text-align: center;
      color: rgba(0, 0, 0, 0.38);
      font-size: 13px;
    }

    mat-dialog-actions {
      padding: 12px 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    .dialog-footer {
      display: flex;
      gap: 8px;
      width: 100%;
      justify-content: flex-end;
    }

    .exit-btn { min-width: 70px; }
    .select-btn { min-width: 80px; }

    ::ng-deep .canned-comments-dialog {
      .mat-mdc-form-field-subscript-wrapper { height: 0; }
      .mat-mdc-text-field-wrapper { background-color: #ffffff; }
    }
  `],
})
export class CannedCommentsDialogComponent implements OnInit {
  readonly data = inject<CannedCommentsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CannedCommentsDialogComponent>);

  searchCtrl = new FormControl<string>('');
  allItems = signal<Array<{ code: string; codeDesc: string }>>([]);
  checkedCodes = signal<Set<string>>(new Set());

  filteredItems = computed(() => {
    const term = (this.searchCtrl.value || '').toUpperCase().trim();
    const items = this.allItems();
    if (!term || term === '%') return items;
    return items.filter(
      i => i.code.toUpperCase().includes(term) || i.codeDesc.toUpperCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.allItems.set(this.data.items || []);
    if (this.data.previouslySelected?.length) {
      this.checkedCodes.set(new Set(this.data.previouslySelected));
    }
  }

  isChecked(code: string): boolean {
    return this.checkedCodes().has(code);
  }

  toggleItem(code: string): void {
    this.checkedCodes.update(set => {
      const next = new Set(set);
      if (next.has(code)) { next.delete(code); } else { next.add(code); }
      return next;
    });
  }

  onSearch(): void {
    this.allItems.set([...this.data.items]);
  }

  onSelect(): void {
    const selected = this.data.items.filter(i => this.checkedCodes().has(i.code));
    const concatenated = selected.map(s => s.codeDesc).join(',\n');
    this.dialogRef.close({ selectedDescriptions: concatenated } as CannedCommentsDialogResult);
  }

  onExit(): void {
    this.dialogRef.close(null);
  }
}
