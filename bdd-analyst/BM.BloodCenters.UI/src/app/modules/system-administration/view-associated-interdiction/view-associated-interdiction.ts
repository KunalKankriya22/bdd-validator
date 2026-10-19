import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { ViewAssociatedInterdictionService } from './services/view-associated-interdiction.service';

export interface AssociatedInterdiction {
  code: string;
  type: string;
  description: string;
  level: number;
  effectiveDate: string;
}

@Component({
  selector: 'app-view-associated-interdiction',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTableModule, MatButtonModule],
  templateUrl: './view-associated-interdiction.html',
  styleUrls: ['./view-associated-interdiction.scss'],
})
export class ViewAssociatedInterdictionComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() accessClassCode = '';
  @Input() accessClassDescription = '';
  @Output() closePanel = new EventEmitter<void>();

  interdictions: AssociatedInterdiction[] = [];
  isLoading = false;

  displayedColumns: string[] = ['code', 'type', 'description', 'level', 'effectiveDate'];

  constructor(private interdictionService: ViewAssociatedInterdictionService) {}

  /* LIFECYCLE*/
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.accessClassCode) {
      this.loadAssociatedInterdictions();
    }
  }

  /* API CALL*/
  private loadAssociatedInterdictions(): void {
    this.isLoading = true;

    this.interdictionService.getAssociatedInterdictions(this.accessClassCode).subscribe({
      next: (data) => {
        this.interdictions = data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.interdictions = [];
        this.isLoading = false;
      },
    });
  }

  codeSortDirection: 'asc' | 'desc' = 'asc';

  toggleCodeSort(): void {
    this.codeSortDirection = this.codeSortDirection === 'asc' ? 'desc' : 'asc';

    this.interdictions = [...this.interdictions].sort((a, b) => {
      const aVal = a.code.toLowerCase();
      const bVal = b.code.toLowerCase();

      return this.codeSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }

  getSortIcon(): string {
    return this.codeSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  /* CLOSE*/
  close(): void {
    this.closePanel.emit();
  }
}
