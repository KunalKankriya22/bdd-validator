import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DefineProcedureExclusionsFilterValue } from '../models/define-procedure-exclusions.model';
import { DefineProcedureExclusionsService } from '../services/define-procedure-exclusions.service';

@Component({
  selector: 'app-procedure-exclusions-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './procedure-exclusions-filter-panel.html',
  styleUrls: ['./procedure-exclusions-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcedureExclusionsFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: DefineProcedureExclusionsFilterValue | null = null;
  @Output() apply = new EventEmitter<DefineProcedureExclusionsFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  private readonly donationTypesSignal = signal<{ key: string; value: string }[]>([]);
  private readonly procedureCodesSignal = signal<{ key: string; value: string }[]>([]);
  private readonly interdictionsSignal = signal<{ key: string; value: string }[]>([]);

  readonly donationTypeSearchCtrl = new FormControl('');
  readonly procedureSearchCtrl = new FormControl('');
  readonly interdictionSearchCtrl = new FormControl('');

  private readonly donationTypeSearch = signal('');
  private readonly procedureSearch = signal('');
  private readonly interdictionSearch = signal('');

  readonly filteredDonationTypes = computed(() => this.filterItems(this.donationTypesSignal(), this.donationTypeSearch()));
  readonly filteredProcedures = computed(() => this.filterItems(this.procedureCodesSignal(), this.procedureSearch()));
  readonly filteredInterdictions = computed(() => this.filterItems(this.interdictionsSignal(), this.interdictionSearch()));

  isLoadingFilters = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private procedureExclusionsService: DefineProcedureExclusionsService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      donationType: [this.currentFilters?.donationType || null],
      procedureCode: [this.currentFilters?.procedureCode || null],
      interdictionCode: [this.currentFilters?.interdictionCode || null]
    });

    this.loadFilterOptions();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFilterOptions(): void {
    this.isLoadingFilters = true;

    forkJoin({
      filters: this.procedureExclusionsService.getProcedureExclusionsFilters().pipe(
        catchError(() => of({ data: [] } as any))
      ),
      lookups: this.procedureExclusionsService.getLookups().pipe(
        catchError(() => of({ data: [] } as any))
      )
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: ({ filters, lookups }) => {
        const filterData = filters.data?.[0] ?? null;
        const lookupData = lookups.data?.[0] ?? null;

        if (!filterData && !lookupData) {
          this.isLoadingFilters = false;
          this.snackBar.open('Failed to load filter options. Please refresh the page.', 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.cdr.markForCheck();
          return;
        }

        // Use /lookups for donation types (sorted by sort_sequence, matching Oracle Forms RG_DON_TYPE)
        const donationTypes = lookupData?.donationTypes || filterData?.donationTypes || [];
        this.donationTypesSignal.set(donationTypes.map((item: any) => ({
          key: item.key,
          value: item.value
        })));

        this.procedureCodesSignal.set((filterData?.procedureCodes || []).map((item: any) => ({
          key: item.key,
          value: item.value
        })));
        this.interdictionsSignal.set((filterData?.interdictionCodes || []).map((item: any) => ({
          key: item.key,
          value: item.value
        })));

        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingFilters = false;
        this.snackBar.open('Failed to load filter options. Please refresh the page.', 'DISMISS', {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.cdr.markForCheck();
      }
    });
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: DefineProcedureExclusionsFilterValue = {
      donationType: formValue.donationType && formValue.donationType !== '' ? formValue.donationType : null,
      procedureCode: formValue.procedureCode && formValue.procedureCode !== '' ? formValue.procedureCode : null,
      interdictionCode: formValue.interdictionCode && formValue.interdictionCode !== '' ? formValue.interdictionCode : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      donationType: null,
      procedureCode: null,
      interdictionCode: null
    });
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    const hasAnyValue =
      (formValue.donationType !== null && formValue.donationType !== '') ||
      (formValue.procedureCode !== null && formValue.procedureCode !== '') ||
      (formValue.interdictionCode !== null && formValue.interdictionCode !== '');

    return !hasAnyValue;
  }

  // --- Searchable dropdown support ---

  get selectedDonationTypeDisplay(): string {
    const val = this.filterForm.get('donationType')?.value;
    if (!val) return '';
    const found = this.donationTypesSignal().find(o => o.value === val);
    return found ? found.key : val;
  }

  get selectedProcedureDisplay(): string {
    const val = this.filterForm.get('procedureCode')?.value;
    if (!val) return '';
    const found = this.procedureCodesSignal().find(o => o.value === val);
    return found ? found.key : val;
  }

  get selectedInterdictionDisplay(): string {
    const val = this.filterForm.get('interdictionCode')?.value;
    if (!val) return '';
    const found = this.interdictionsSignal().find(o => o.value === val);
    return found ? found.key : val;
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  private setupSearchSubscriptions(): void {
    this.donationTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.donationTypeSearch.set(v || ''));
    this.procedureSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.procedureSearch.set(v || ''));
    this.interdictionSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.interdictionSearch.set(v || ''));
  }

  private filterItems(items: { key: string; value: string }[], search: string): { key: string; value: string }[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item => {
      const key = (item.key || '').toLowerCase();
      const value = (item.value || '').toLowerCase();
      return key.includes(lower) || value.includes(lower);
    });
  }
}
