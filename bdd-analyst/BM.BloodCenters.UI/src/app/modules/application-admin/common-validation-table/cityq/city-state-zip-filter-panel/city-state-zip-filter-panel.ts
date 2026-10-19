import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { CityStateZipFilterValue, StateDto } from '../models/city-state-zip-query.model';
import { CityStateZipQueryService } from '../services/city-state-zip-query.service';

@Component({
  selector: 'app-city-state-zip-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    FilterPanelBase
  ],
  templateUrl: './city-state-zip-filter-panel.html',
  styleUrls: ['./city-state-zip-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CityStateZipFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: CityStateZipFilterValue | null = null;
  @Output() apply = new EventEmitter<CityStateZipFilterValue>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly service = inject(CityStateZipQueryService);
  private destroy$ = new Subject<void>();

  filterForm!: FormGroup;
  stateOptions: StateDto[] = [];
  filteredStateOptions: StateDto[] = [];
  stateSearchControl = new FormControl('');
  isLoadingStates = false;

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      city: [this.currentFilters?.city || ''],
      zip: [this.currentFilters?.zip || ''],
      county: [this.currentFilters?.county || ''],
      state: [this.currentFilters?.state || '']
    });

    this.loadStates();
    this.setupSearchControl();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStates(): void {
    this.isLoadingStates = true;
    this.service.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.stateOptions = states;
          this.filteredStateOptions = [...states];
          this.isLoadingStates = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.stateOptions = [];
          this.filteredStateOptions = [];
          this.isLoadingStates = false;
          this.cdr.markForCheck();
        }
      });
  }

  private setupSearchControl(): void {
    this.stateSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm || '').toLowerCase();
        this.filteredStateOptions = this.stateOptions.filter(state =>
          state.code.toLowerCase().includes(term) ||
          state.description.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  get isApplyDisabled(): boolean {
    const values = this.filterForm.value;
    return !(values?.city?.trim() || values?.zip?.trim() || values?.county?.trim() || values?.state);
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: CityStateZipFilterValue = {
      city: formValue.city?.trim() || null,
      zip: formValue.zip?.trim() || null,
      county: formValue.county?.trim() || null,
      state: formValue.state || null
    };
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({ city: '', zip: '', county: '', state: '' });
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if ([8, 9, 27, 13, 46].includes(charCode)) {
      return true;
    }
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPasteNumbers(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '');
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = this.filterForm.get('zip')?.value || '';
    const newValue = currentValue.substring(0, start) + numericOnly + currentValue.substring(end);
    this.filterForm.patchValue({ zip: newValue.substring(0, 5) });
  }
}
