import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { FilterValue } from '../../models/hla-rbc-request-query.model';

@Component({
  selector: 'app-hla-rbc-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './filter-panel.html',
  styleUrls: ['./filter-panel.scss']
})
export class HlaRbcFilterPanel {
  @Input() mode: 'donors' | 'units' = 'donors';
  @Input() gradeOptions: { value: string; label: string }[] = [];
  @Input() levelOptions: number[] = [];
  @Input() patternOptions: string[] = [];
  @Input() aboOptions: string[] = [];
  @Input() antigenOptions: string[] = [];

  @Output() filtersApplied = new EventEmitter<FilterValue>();
  @Output() filtersCanceled = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  filterForm: FormGroup;

  // Search controls for each dropdown
  gradeSearchControl = new FormControl('');
  showGradeThroughSearchControl = new FormControl('');
  levelSearchControl = new FormControl('');
  patternSearchControl = new FormControl('');
  aboSearchControl = new FormControl('');
  antigenSearchControl = new FormControl('');

  constructor() {
    this.filterForm = this.fb.group({
      showGradeThrough: [''],
      grades: [[]],
      level: [null],
      pattern: [''],
      abo: [''],
      antigens: ['']
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

  get filteredLevelOptions() {
    const s = (this.levelSearchControl.value || '').toLowerCase();
    return s ? this.levelOptions.filter(l => l.toString().includes(s)) : this.levelOptions;
  }

  get filteredPatternOptions() {
    const s = (this.patternSearchControl.value || '').toLowerCase();
    return s ? this.patternOptions.filter(p => p.toLowerCase().includes(s)) : this.patternOptions;
  }

  get filteredAboOptions() {
    const s = (this.aboSearchControl.value || '').toLowerCase();
    return s ? this.aboOptions.filter(a => a.toLowerCase().includes(s)) : this.aboOptions;
  }

  get filteredAntigenOptions() {
    const s = (this.antigenSearchControl.value || '').toLowerCase();
    return s ? this.antigenOptions.filter(a => a.toLowerCase().includes(s)) : this.antigenOptions;
  }

  setFilters(filters: FilterValue): void {
    this.filterForm.patchValue({
      showGradeThrough: filters.showGradeThrough || '',
      grades: filters.grades || [],
      level: filters.level || null,
      pattern: filters.pattern || '',
      abo: filters.abo || '',
      antigens: filters.antigens || ''
    });
  }

  onApply(): void {
    const { showGradeThrough, grades, level, pattern, abo, antigens } = this.filterForm.value;
    const filters: FilterValue = {
      showGradeThrough: showGradeThrough || undefined,
      grades: grades?.length > 0 ? grades : undefined,
      level: level || undefined,
      pattern: pattern || undefined,
      abo: abo || undefined,
      antigens: antigens || undefined
    };
    this.filtersApplied.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset({ showGradeThrough: '', grades: [], level: null, pattern: '', abo: '', antigens: '' });
    this.gradeSearchControl.setValue('');
    this.showGradeThroughSearchControl.setValue('');
    this.levelSearchControl.setValue('');
    this.patternSearchControl.setValue('');
    this.aboSearchControl.setValue('');
    this.antigenSearchControl.setValue('');
  }

  onCancel(): void {
    this.filtersCanceled.emit();
  }
}
