import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

export interface ChapterItem {
  chapterId: string;
  chapterName: string;
  selected: boolean;
  effectiveDate?: string;
  terminationDate?: string | null;
}

export interface SelectChaptersDialogData {
  contractId?: string;
  selectedChapters?: ChapterItem[];
  availableChapters?: ChapterItem[];
}

@Component({
  selector: 'app-select-chapters-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './select-chapters-dialog.html',
  styleUrl: './select-chapters-dialog.scss'
})
export class SelectChaptersDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<SelectChaptersDialogComponent>);
  private readonly data = inject<SelectChaptersDialogData>(MAT_DIALOG_DATA);

  // Signal-based state
  protected readonly chapters = signal<ChapterItem[]>([]);

  ngOnInit(): void {
    let availableChapters: ChapterItem[];

    
    if (this.data.availableChapters && this.data.availableChapters.length > 0) {
      availableChapters = [...this.data.availableChapters];
    } else {
      
      availableChapters = [];
    }

    // If we have pre-selected chapters from data, merge them
    if (this.data.selectedChapters && this.data.selectedChapters.length > 0) {
      const selectedIds = new Set(this.data.selectedChapters.map(c => c.chapterId));
      availableChapters.forEach(chapter => {
        chapter.selected = selectedIds.has(chapter.chapterId);
      });
    }

    this.chapters.set(availableChapters);
  }

  /**
   * Toggle chapter selection
   */
  toggleChapter(chapter: ChapterItem): void {
    chapter.selected = !chapter.selected;
    // Trigger signal update
    this.chapters.set([...this.chapters()]);
  }

  /**
   * Clear all selections
   */
  clearAll(): void {
    const updated = this.chapters().map(c => ({ ...c, selected: false }));
    this.chapters.set(updated);
  }

  /**
   * Cancel and close dialog
   */
  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Save selections and close dialog
   */
  saveAndClose(): void {
    const selectedChapters = this.chapters().filter(c => c.selected);
    this.dialogRef.close(selectedChapters);
  }
}
