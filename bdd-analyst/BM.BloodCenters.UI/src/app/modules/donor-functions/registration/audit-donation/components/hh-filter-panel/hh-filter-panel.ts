import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { HHTemplateQuestionDto } from '../../models/audit-donation.model';

@Component({
  selector: 'app-hh-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    MatButtonModule,
    MatIconModule,
    SearchBar,
    DataTable,
  ],
  templateUrl: './hh-filter-panel.html',
  styleUrl: './hh-filter-panel.scss',
})
export class HHFilterPanel implements AfterViewInit {
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(DataTable) private dataTable!: DataTable<HHTemplateQuestionDto>;

  @Input() questions: HHTemplateQuestionDto[] = [];
  @Input() set initialSelected(codes: Set<string>) {
    this.selectedCodes = new Set(codes);
    Promise.resolve().then(() => this.syncDataTableSelection());
  }

  @Output() apply = new EventEmitter<Set<string>>();
  @Output() cancel = new EventEmitter<void>();

  searchTerm = '';
  selectedCodes = new Set<string>();

  ngAfterViewInit(): void {
    Promise.resolve().then(() => this.syncDataTableSelection());
  }

  private syncDataTableSelection(): void {
    if (!this.dataTable || !this.questions.length) return;
    this.dataTable.selectedIds = new Set(this.selectedCodes);
    this.dataTable.selectedRows = this.questions.filter(q =>
      this.selectedCodes.has(q.questionCode)
    );
    this.dataTable.isAllSelected =
      this.dataTable.selectedRows.length === this.questions.length && this.questions.length > 0;
    this.cdr.detectChanges();
  }

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by question or sequence',
    minLength: 1,
    debounceTime: 0,
    alwaysShowTooltip: false,
  };

  tableConfig: DataTableConfig<HHTemplateQuestionDto> = {
    columns: [
      { key: 'sortSequence', header: 'Sequence', width: '100px' },
      { key: 'questionDescription', header: 'Question' },
    ],
    enableSelection: true,
    selectionKey: 'questionCode',
    showPagination: false,
    showTableOnEmpty: true,
    enableRowHighlight: false,
    emptyMessage: 'No questions found',
    noDataIcon: 'search_off',
  };

  filteredQuestions(): HHTemplateQuestionDto[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.questions;
    return this.questions.filter(q =>
      q.questionDescription?.toLowerCase().includes(term) ||
      String(q.sortSequence).includes(term)
    );
  }

  onSearch(term: string): void {
    this.searchTerm = term;
  }

  onSelectionChange(selected: HHTemplateQuestionDto[]): void {
    this.selectedCodes = new Set(selected.map(q => q.questionCode));
  }

  onApply(): void {
    this.apply.emit(new Set(this.selectedCodes));
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
