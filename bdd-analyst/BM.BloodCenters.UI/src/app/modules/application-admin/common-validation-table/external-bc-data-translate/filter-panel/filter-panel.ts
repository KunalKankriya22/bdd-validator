import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CodeDescriptionOption } from '../models/external-bc-data-translate.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

export interface ExternalBcDataTranslateFilterFormValue {
  sourceId: string | null;
  targetId: string | null;
}

@Component({
  selector: 'app-external-bc-data-translate-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './filter-panel.html',
  styleUrls: ['./filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalBcDataTranslateFilterPanel implements OnInit {
  @Input() currentFilters: ExternalBcDataTranslateFilterFormValue | null = null;

  @Input() set sourceCodeTypeOptions(value: CodeDescriptionOption[]) {
    this.sourceCodeTypeOptionsSignal.set(value);
  }
  get sourceCodeTypeOptions(): CodeDescriptionOption[] {
    return this.sourceCodeTypeOptionsSignal();
  }

  @Input() set targetCodeTypeOptions(value: CodeDescriptionOption[]) {
    this.targetCodeTypeOptionsSignal.set(value);
  }
  get targetCodeTypeOptions(): CodeDescriptionOption[] {
    return this.targetCodeTypeOptionsSignal();
  }

  @Output() apply = new EventEmitter<ExternalBcDataTranslateFilterFormValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  initialFilterValues: ExternalBcDataTranslateFilterFormValue | null = null;

  // Search controls for dropdowns
  sourceCodeTypeSearchCtrl = new FormControl('');
  targetCodeTypeSearchCtrl = new FormControl('');

  // Signals for filtered options
  sourceCodeTypeOptionsSignal = signal<CodeDescriptionOption[]>([]);
  targetCodeTypeOptionsSignal = signal<CodeDescriptionOption[]>([]);

  // Convert FormControl values to signals
  sourceCodeTypeSearchSignal = toSignal(this.sourceCodeTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  targetCodeTypeSearchSignal = toSignal(this.targetCodeTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  filteredSourceCodeTypeOptions = computed(() => {
    const searchTerm = this.sourceCodeTypeSearchSignal()?.toLowerCase() || '';
    const options = this.sourceCodeTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.description.toLowerCase().includes(searchTerm)
    );
  });

  filteredTargetCodeTypeOptions = computed(() => {
    const searchTerm = this.targetCodeTypeSearchSignal()?.toLowerCase() || '';
    const options = this.targetCodeTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.description.toLowerCase().includes(searchTerm)
    );
  });

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      sourceId: [this.currentFilters?.sourceId || null],
      targetId: [this.currentFilters?.targetId || null]
    });

    // Store initial filter values to track changes
    this.initialFilterValues = {
      sourceId: this.currentFilters?.sourceId || null,
      targetId: this.currentFilters?.targetId || null
    };
  }

  /**
   * Checks if the current filter values have changed from the initial values
   */
  hasFilterChanged(): boolean {
    const currentValues = this.filterForm.value;

    return (
      (currentValues.sourceId || null) !== (this.initialFilterValues?.sourceId || null) ||
      (currentValues.targetId || null) !== (this.initialFilterValues?.targetId || null)
    );
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: ExternalBcDataTranslateFilterFormValue = {
      sourceId: formValue.sourceId || null,
      targetId: formValue.targetId || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();

    // Update initial filter values to match the cleared state
    // so that Apply button remains disabled after clearing
    this.initialFilterValues = {
      sourceId: null,
      targetId: null
    };
  }

  onClose(): void {
    this.close.emit();
  }
}
