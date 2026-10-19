import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { InterdictionCodeOption, InterdictionUpgradeMatrixFilterValue, InterdictionUpgradeMatrixFilterLov } from '../models/interdiction-upgrade-matrix.model';

@Component({
  selector: 'app-interdiction-upgrade-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './interdiction-upgrade-filter-panel.html',
  styleUrls: ['./interdiction-upgrade-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterdictionUpgradeFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: InterdictionUpgradeMatrixFilterValue | null = null;
  @Input() filterLov: InterdictionUpgradeMatrixFilterLov | null = null;
  @Input() interdictionCodes: InterdictionCodeOption[] = [];
  @Output() apply = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  sourceInterdictionOptions: InterdictionCodeOption[] = [];
  existingInterdictionOptions: InterdictionCodeOption[] = [];
  actionInterdictionOptions: InterdictionCodeOption[] = [];
  actionOptions: string[] = [];

  // Search controls and filtered options
  sourceSearchControl = new FormControl('');
  filteredSourceOptions: InterdictionCodeOption[] = [];

  existingSearchControl = new FormControl('');
  filteredExistingOptions: InterdictionCodeOption[] = [];

  actionInterdictionSearchControl = new FormControl('');
  filteredActionInterdictionOptions: InterdictionCodeOption[] = [];

  isLoadingFilters = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Map backend Action value (P/R) to frontend value (Place/Release) for form initialization
    const actionValue = this.currentFilters?.action
      ? this.mapBackendActionToFrontend(this.currentFilters.action)
      : null;

    this.filterForm = this.fb.group({
      sourceInterdiction: [this.currentFilters?.sourceInterdiction || null],
      existingInterdiction: [this.currentFilters?.existingInterdiction || null],
      actionInterdiction: [this.currentFilters?.actionInterdiction || null],
      action: [actionValue]
    });

    this.setupSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  populateFilterOptions(): void {
    const descLookup = new Map<string, string>();
    (this.interdictionCodes || []).forEach(item => {
      if (item.interCode) {
        descLookup.set(item.interCode, item.interDesc || '');
      }
    });

    const filterData = this.filterLov;

    if (filterData) {
      const sourceCodes: string[] = filterData.sourceInterdiction || [];
      this.sourceInterdictionOptions = sourceCodes.map(code => ({
        interCode: code,
        interDesc: descLookup.get(code) || ''
      }));

      const existingCodes: string[] = filterData.existingInterdiction || [];
      this.existingInterdictionOptions = existingCodes.map(code => ({
        interCode: code,
        interDesc: descLookup.get(code) || ''
      }));

      const actionInterCodes: string[] = filterData.actionInterdiction || [];
      this.actionInterdictionOptions = actionInterCodes.map(code => ({
        interCode: code,
        interDesc: descLookup.get(code) || ''
      }));

      const backendActions = filterData.action || [];
      this.actionOptions = backendActions.map((action: string) => this.mapBackendActionToFrontend(action));

      this.filteredSourceOptions = [...this.sourceInterdictionOptions];
      this.filteredExistingOptions = [...this.existingInterdictionOptions];
      this.filteredActionInterdictionOptions = [...this.actionInterdictionOptions];
    }

    this.isLoadingFilters = false;
    this.cdr.markForCheck();
  }

  private setupSearchControls(): void {
    // Source Interdiction search
    this.sourceSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredSourceOptions = this.sourceInterdictionOptions.filter(option =>
          option.interCode.toLowerCase().includes(term) || option.interDesc.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Existing Interdiction search
    this.existingSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredExistingOptions = this.existingInterdictionOptions.filter(option =>
          option.interCode.toLowerCase().includes(term) || option.interDesc.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    // Action Interdiction search
    this.actionInterdictionSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search as string || '').toLowerCase();
        this.filteredActionInterdictionOptions = this.actionInterdictionOptions.filter(option =>
          option.interCode.toLowerCase().includes(term) || option.interDesc.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  /**
   * Map backend Action value to frontend display value
   * Backend: P or R
   * Frontend: Place or Release
   */
  private mapBackendActionToFrontend(action: string): string {
    if (action === 'P') return 'Place';
    if (action === 'R') return 'Release';
    return action; // Fallback to original value
  }

  /**
   * Map frontend Action value to backend value
   * Frontend: Place or Release
   * Backend: P or R
   */
  private mapFrontendActionToBackend(action: string): string {
    if (action === 'Place') return 'P';
    if (action === 'Release') return 'R';
    return action; // Fallback to original value
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: InterdictionUpgradeMatrixFilterValue = {
      sourceInterdiction: formValue.sourceInterdiction || null,
      existingInterdiction: formValue.existingInterdiction || null,
      actionInterdiction: formValue.actionInterdiction || null,
      // Map frontend Action value to backend value (Place -> P, Release -> R)
      action: formValue.action ? this.mapFrontendActionToBackend(formValue.action) : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    // Only reset form fields - panel stays open, applied filters remain unchanged
    // User can select new values and click Apply to apply new filters
    this.filterForm.reset({
      sourceInterdiction: null,
      existingInterdiction: null,
      actionInterdiction: null,
      action: null
    });
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    if (this.filterForm.invalid) {
      return true;
    }

    const formValue = this.filterForm.value;
    const hasAnyFilter = !!(
      formValue.sourceInterdiction ||
      formValue.existingInterdiction ||
      formValue.actionInterdiction ||
      formValue.action
    );

    const hasAppliedFilters = !!(
      this.currentFilters?.sourceInterdiction ||
      this.currentFilters?.existingInterdiction ||
      this.currentFilters?.actionInterdiction ||
      this.currentFilters?.action
    );

    // Enable when form has filters OR when clearing previously applied filters
    return !hasAnyFilter && !hasAppliedFilters;
  }
}
