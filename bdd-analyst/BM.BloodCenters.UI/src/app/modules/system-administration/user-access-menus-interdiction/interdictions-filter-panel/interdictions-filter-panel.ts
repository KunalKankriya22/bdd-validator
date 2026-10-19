import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { InterdictionsFilterValue } from '../models/user-access-filters.model';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';

@Component({
  selector: 'app-interdictions-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    FilterPanelBase
  ],
  templateUrl: './interdictions-filter-panel.html',
  styleUrl: './interdictions-filter-panel.scss'
})
export class InterdictionsFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: InterdictionsFilterValue | null = null;
  @Output() apply = new EventEmitter<InterdictionsFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm: FormGroup;

  // Options (mock - replace with API call)
  interdictionsTypeOptions = ['INTER'];
  interdictionsCodeOptions = ['101B', '101C', '101E', '102A', '103B', '104C', '105D'];

  // Search control and filtered options for Interdictions Code
  interdictionsCodeSearchControl = new FormControl('');
  filteredInterdictionsCodeOptions: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      interdictionsType: [null],
      interdictionsCode: [null]
    });
  }

  ngOnInit(): void {
    // Initialize filtered options
    this.filteredInterdictionsCodeOptions = [...this.interdictionsCodeOptions];

    // Setup search functionality
    this.setupInterdictionsCodeSearch();

    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupInterdictionsCodeSearch(): void {
    this.interdictionsCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredInterdictionsCodeOptions = this.interdictionsCodeOptions.filter(code =>
          code.toLowerCase().includes(term)
        );
      });
  }

  onApply(): void {
    const filterValue: InterdictionsFilterValue = this.filterForm.value;
    this.apply.emit(filterValue);
  }

  onClear(): void {
    this.filterForm.reset({
      interdictionsType: null,
      interdictionsCode: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if at least one field has a value
    const hasAnyValue =
      (formValue.interdictionsType !== null && formValue.interdictionsType !== '') ||
      (formValue.interdictionsCode !== null && formValue.interdictionsCode !== '');

    return !hasAnyValue;
  }
}
