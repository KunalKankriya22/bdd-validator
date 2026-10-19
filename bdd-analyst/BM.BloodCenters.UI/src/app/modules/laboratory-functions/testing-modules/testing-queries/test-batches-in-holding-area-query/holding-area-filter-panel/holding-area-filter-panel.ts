import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { HoldingTestGridFilter } from '../test-batches-in-holding-area-query.model';

@Component({
  selector: 'app-holding-area-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './holding-area-filter-panel.html',
  styleUrls: ['./holding-area-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingAreaFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: HoldingTestGridFilter | null = null;

  private _filterOptions: {
    testIds: string[];
    absorbanceValues: string[];
    ratioValues: string[];
    resultValues: string[];
    statusValues: string[];
  } = { testIds: [], absorbanceValues: [], ratioValues: [], resultValues: [], statusValues: [] };

  @Input()
  get filterOptions() { return this._filterOptions; }
  set filterOptions(value: typeof this._filterOptions) {
    this._filterOptions = value;
    this.initFilteredOptions();
    if (this.viewInitialized) {
      this.cdr.detectChanges();
    }
  }

  @Output() apply = new EventEmitter<HoldingTestGridFilter>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private viewInitialized = false;

  filterForm!: FormGroup;

  testIdSearchCtrl = new FormControl('');
  absorbanceSearchCtrl = new FormControl('');
  ratioSearchCtrl = new FormControl('');
  resultValueSearchCtrl = new FormControl('');
  statusSearchCtrl = new FormControl('');

  filteredTestIds = signal<string[]>([]);
  filteredAbsorbances = signal<string[]>([]);
  filteredRatios = signal<string[]>([]);
  filteredResultValues = signal<string[]>([]);
  filteredStatuses = signal<string[]>([]);

  private destroy$ = new Subject<void>();
  private initialFilterValues: HoldingTestGridFilter | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.initFilteredOptions();
    this.setupSearchFilters();

    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
      this.initialFilterValues = { ...this.currentFilters };
    }

    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.viewInitialized = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      testId: [null],
      absorbance: [null],
      ratio: [null],
      resultValue: [null],
      status: [null],
    });
  }

  private initFilteredOptions(): void {
    this.filteredTestIds.set(this.filterOptions.testIds);
    this.filteredAbsorbances.set(this.filterOptions.absorbanceValues);
    this.filteredRatios.set(this.filterOptions.ratioValues);
    this.filteredResultValues.set(this.filterOptions.resultValues);
    this.filteredStatuses.set(this.filterOptions.statusValues);
  }

  private setupSearchFilters(): void {
    this.testIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const search = this.testIdSearchCtrl.value?.toLowerCase() || '';
        this.filteredTestIds.set(
          search ? this.filterOptions.testIds.filter(v => v.toLowerCase().includes(search)) : this.filterOptions.testIds
        );
      });

    this.absorbanceSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const search = this.absorbanceSearchCtrl.value?.toLowerCase() || '';
        this.filteredAbsorbances.set(
          search ? this.filterOptions.absorbanceValues.filter(v => v.toLowerCase().includes(search)) : this.filterOptions.absorbanceValues
        );
      });

    this.ratioSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const search = this.ratioSearchCtrl.value?.toLowerCase() || '';
        this.filteredRatios.set(
          search ? this.filterOptions.ratioValues.filter(v => v.toLowerCase().includes(search)) : this.filterOptions.ratioValues
        );
      });

    this.resultValueSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const search = this.resultValueSearchCtrl.value?.toLowerCase() || '';
        this.filteredResultValues.set(
          search ? this.filterOptions.resultValues.filter(v => v.toLowerCase().includes(search)) : this.filterOptions.resultValues
        );
      });

    this.statusSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const search = this.statusSearchCtrl.value?.toLowerCase() || '';
        this.filteredStatuses.set(
          search ? this.filterOptions.statusValues.filter(v => v.toLowerCase().includes(search)) : this.filterOptions.statusValues
        );
      });
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return true;

    const hasAnyValue =
      formValue.testId !== null ||
      formValue.absorbance !== null ||
      formValue.ratio !== null ||
      formValue.resultValue !== null ||
      formValue.status !== null;

    if (!hasAnyValue) return true;

    if (!this.hasFormChanged()) return true;

    return false;
  }

  private hasFormChanged(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return false;
    if (!this.initialFilterValues) return true;

    return (
      formValue.testId !== this.initialFilterValues.testId ||
      formValue.absorbance !== this.initialFilterValues.absorbance ||
      formValue.ratio !== this.initialFilterValues.ratio ||
      formValue.resultValue !== this.initialFilterValues.resultValue ||
      formValue.status !== this.initialFilterValues.status
    );
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    this.apply.emit({
      testId: formValue.testId || null,
      absorbance: formValue.absorbance || null,
      ratio: formValue.ratio || null,
      resultValue: formValue.resultValue || null,
      status: formValue.status || null,
    });
  }

  onClear(): void {
    this.filterForm.reset({
      testId: null,
      absorbance: null,
      ratio: null,
      resultValue: null,
      status: null,
    });
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
