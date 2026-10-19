import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { HlaInterimOutputSearchParams, DropdownOption } from '../models/hla-interim-output.model';

@Component({
  selector: 'app-hla-interim-output-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './hla-interim-output-filter-panel.html',
  styleUrls: ['./hla-interim-output-filter-panel.scss']
})
export class HlaInterimOutputFilterPanel implements OnInit, OnChanges, OnDestroy {
  @Input() currentFilters: HlaInterimOutputSearchParams | null = null;
  @Input() matchA1A1Options: DropdownOption[] = [];
  @Input() matchA1A2Options: DropdownOption[] = [];
  @Input() matchA2A1Options: DropdownOption[] = [];
  @Input() matchA2A2Options: DropdownOption[] = [];
  @Input() outcomeAntigenA1Options: DropdownOption[] = [];
  @Input() outcomeAntigenA2Options: DropdownOption[] = [];

  @Output() apply = new EventEmitter<HlaInterimOutputSearchParams>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  private destroy$ = new Subject<void>();

  // Search controls for dropdowns
  readonly matchA1A1SearchControl = new FormControl('');
  readonly matchA1A2SearchControl = new FormControl('');
  readonly outcomeAntigenA1SearchControl = new FormControl('');
  readonly matchA2A1SearchControl = new FormControl('');
  readonly matchA2A2SearchControl = new FormControl('');
  readonly outcomeAntigenA2SearchControl = new FormControl('');

  // Signals for search filtering - separate for each dropdown type
  private readonly matchA1A1Search = signal('');
  private readonly matchA1A2Search = signal('');
  private readonly outcomeAntigenA1Search = signal('');
  private readonly matchA2A1Search = signal('');
  private readonly matchA2A2Search = signal('');
  private readonly outcomeAntigenA2Search = signal('');

  // Separate signals for each dropdown's options
  private readonly matchA1A1OptionsSignal = signal<DropdownOption[]>([]);
  private readonly matchA1A2OptionsSignal = signal<DropdownOption[]>([]);
  private readonly matchA2A1OptionsSignal = signal<DropdownOption[]>([]);
  private readonly matchA2A2OptionsSignal = signal<DropdownOption[]>([]);
  private readonly outcomeAntigenA1OptionsSignal = signal<DropdownOption[]>([]);
  private readonly outcomeAntigenA2OptionsSignal = signal<DropdownOption[]>([]);

  readonly filteredMatchA1A1Options = computed(() => {
    const search = this.matchA1A1Search().toLowerCase();
    const options = this.matchA1A1OptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(search));
  });

  readonly filteredMatchA1A2Options = computed(() => {
    const search = this.matchA1A2Search().toLowerCase();
    const options = this.matchA1A2OptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(search));
  });

  readonly filteredOutcomeAntigenA1Options = computed(() => {
    const search = this.outcomeAntigenA1Search().toLowerCase();
    const options = this.outcomeAntigenA1OptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(search));
  });

  readonly filteredMatchA2A1Options = computed(() => {
    const search = this.matchA2A1Search().toLowerCase();
    const options = this.matchA2A1OptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(search));
  });

  readonly filteredMatchA2A2Options = computed(() => {
    const search = this.matchA2A2Search().toLowerCase();
    const options = this.matchA2A2OptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(search));
  });

  readonly filteredOutcomeAntigenA2Options = computed(() => {
    const search = this.outcomeAntigenA2Search().toLowerCase();
    const options = this.outcomeAntigenA2OptionsSignal();
    if (!search) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(search));
  });

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupSearchSubscriptions();
    this.updateOptionSignals();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matchA1A1Options'] || changes['matchA1A2Options'] ||
        changes['matchA2A1Options'] || changes['matchA2A2Options'] ||
        changes['outcomeAntigenA1Options'] || changes['outcomeAntigenA2Options']) {
      this.updateOptionSignals();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateOptionSignals(): void {
    this.matchA1A1OptionsSignal.set(this.matchA1A1Options || []);
    this.matchA1A2OptionsSignal.set(this.matchA1A2Options || []);
    this.matchA2A1OptionsSignal.set(this.matchA2A1Options || []);
    this.matchA2A2OptionsSignal.set(this.matchA2A2Options || []);
    this.outcomeAntigenA1OptionsSignal.set(this.outcomeAntigenA1Options || []);
    this.outcomeAntigenA2OptionsSignal.set(this.outcomeAntigenA2Options || []);
  }

  private setupSearchSubscriptions(): void {
    this.matchA1A1SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.matchA1A1Search.set(value || ''));

    this.matchA1A2SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.matchA1A2Search.set(value || ''));

    this.outcomeAntigenA1SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.outcomeAntigenA1Search.set(value || ''));

    this.matchA2A1SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.matchA2A1Search.set(value || ''));

    this.matchA2A2SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.matchA2A2Search.set(value || ''));

    this.outcomeAntigenA2SearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.outcomeAntigenA2Search.set(value || ''));
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      matchA1A1: [this.currentFilters?.matchA1A1 || null],
      matchA1A2: [this.currentFilters?.matchA1A2 || null],
      outcomeAntigenA1: [this.currentFilters?.outcomeAntigenA1 || null],
      matchA2A1: [this.currentFilters?.matchA2A1 || null],
      matchA2A2: [this.currentFilters?.matchA2A2 || null],
      outcomeAntigenA2: [this.currentFilters?.outcomeAntigenA2 || null]
    });
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: HlaInterimOutputSearchParams = {};

    if (formValue.matchA1A1) {
      filters.matchA1A1 = formValue.matchA1A1;
    }

    if (formValue.matchA1A2) {
      filters.matchA1A2 = formValue.matchA1A2;
    }

    if (formValue.outcomeAntigenA1) {
      filters.outcomeAntigenA1 = formValue.outcomeAntigenA1;
    }

    if (formValue.matchA2A1) {
      filters.matchA2A1 = formValue.matchA2A1;
    }

    if (formValue.matchA2A2) {
      filters.matchA2A2 = formValue.matchA2A2;
    }

    if (formValue.outcomeAntigenA2) {
      filters.outcomeAntigenA2 = formValue.outcomeAntigenA2;
    }

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset({
      matchA1A1: null,
      matchA1A2: null,
      outcomeAntigenA1: null,
      matchA2A1: null,
      matchA2A2: null,
      outcomeAntigenA2: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;
    return !formValue.matchA1A1 && !formValue.matchA1A2 && !formValue.outcomeAntigenA1 &&
           !formValue.matchA2A1 && !formValue.matchA2A2 && !formValue.outcomeAntigenA2;
  }
}
