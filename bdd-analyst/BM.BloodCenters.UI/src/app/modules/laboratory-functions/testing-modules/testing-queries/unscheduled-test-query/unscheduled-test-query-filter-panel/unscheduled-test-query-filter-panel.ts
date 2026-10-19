import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface UnscheduledTestFilterValue {
  reactive: string | null;
  ntsFlag: string | null;
  showCancel: string | null;
}

const DEFAULT_FILTERS: UnscheduledTestFilterValue = {
  reactive: null,
  ntsFlag: null,
  showCancel: null,
};

@Component({
  selector: 'app-unscheduled-test-query-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './unscheduled-test-query-filter-panel.html',
  styleUrls: ['./unscheduled-test-query-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnscheduledTestQueryFilterPanel implements OnInit {
  @Input() currentFilters: UnscheduledTestFilterValue = { ...DEFAULT_FILTERS };
  @Output() apply = new EventEmitter<UnscheduledTestFilterValue>();
  @Output() close = new EventEmitter<void>();

  readonly reactiveOptions = [
    { value: 'Y', label: 'Reactive Only' },
  ];

  readonly ntsFlagOptions = [
    { value: 'Y', label: 'Ignore NT' },
  ];

  readonly showCancelOptions = [
    { value: 'Y', label: 'Cancelled Only' },
  ];

  form = new FormGroup({
    reactive: new FormControl<string | null>(null),
    ntsFlag: new FormControl<string | null>(null),
    showCancel: new FormControl<string | null>(null),
  });

  private initialValues: UnscheduledTestFilterValue = { ...DEFAULT_FILTERS };

  ngOnInit(): void {
    const filters = this.currentFilters ?? DEFAULT_FILTERS;
    this.form.setValue({
      reactive: filters.reactive ?? null,
      ntsFlag: filters.ntsFlag ?? null,
      showCancel: filters.showCancel ?? null,
    });
    this.initialValues = this.form.getRawValue() as UnscheduledTestFilterValue;
  }

  get isApplyDisabled(): boolean {
    const current = this.form.getRawValue() as UnscheduledTestFilterValue;
    return (
      current.reactive === this.initialValues.reactive &&
      current.ntsFlag === this.initialValues.ntsFlag &&
      current.showCancel === this.initialValues.showCancel
    );
  }

  get isClearDisabled(): boolean {
    const current = this.form.getRawValue() as UnscheduledTestFilterValue;
    return current.reactive === null && current.ntsFlag === null && current.showCancel === null;
  }

  onApply(): void {
    this.apply.emit(this.form.getRawValue() as UnscheduledTestFilterValue);
  }

  onClear(): void {
    this.form.setValue({ reactive: null, ntsFlag: null, showCancel: null });
  }

  onClose(): void {
    this.close.emit();
  }
}
