import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { FilterValue } from '../../models/hla-rbc-request-query.model';

@Component({
  selector: 'app-donor-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './donor-filter-panel.html',
  styleUrls: ['./donor-filter-panel.scss']
})
export class DonorFilterPanel {
  @Input() gradeOptions: { value: string; label: string }[] = [];
  @Input() levelOptions: number[] = [];

  @Output() filtersApplied = new EventEmitter<FilterValue>();
  @Output() filtersCanceled = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  filterForm: FormGroup;

  // Search controls for each dropdown
  gradeSearchControl = new FormControl('');
  showGradeThroughSearchControl = new FormControl('');

  constructor() {
    this.filterForm = this.fb.group({
      showGradeThrough: [''],
      grades: [[]],
      level: [null]
    });
  }

  get filteredGradeOptions() {
    const s = (this.gradeSearchControl.value || '').toLowerCase();
    return s ? this.gradeOptions.filter(g => g.label.toLowerCase().includes(s)) : this.gradeOptions;
  }

  get filteredShowGradeThroughOptions() {
    const s = (this.showGradeThroughSearchControl.value || '').toLowerCase();
    return s ? this.gradeOptions.filter(g => g.label.toLowerCase().includes(s)) : this.gradeOptions;
  }

  get isApplyDisabled(): boolean {
    const { showGradeThrough, grades, level } = this.filterForm.value;
    return !showGradeThrough && (!grades || grades.length === 0) && !level;
  }

  setFilters(filters: FilterValue): void {
    this.filterForm.patchValue({
      showGradeThrough: filters.showGradeThrough || '',
      grades: filters.grades || [],
      level: filters.level || null
    });
  }

  onApply(): void {
    const { showGradeThrough, grades, level } = this.filterForm.value;
    const filters: FilterValue = {
      showGradeThrough: showGradeThrough || undefined,
      grades: grades?.length > 0 ? grades : undefined,
      level: level || undefined
    };
    this.filtersApplied.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset({ showGradeThrough: '', grades: [], level: null });
    this.gradeSearchControl.setValue('');
    this.showGradeThroughSearchControl.setValue('');
  }

  onCancel(): void {
    this.filtersCanceled.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    event.preventDefault();
    this.onCancel();
  }
}
