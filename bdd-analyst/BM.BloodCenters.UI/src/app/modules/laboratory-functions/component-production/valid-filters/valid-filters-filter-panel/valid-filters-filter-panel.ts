import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ValidFilterFilterValue, DropdownItem } from '../models/valid-filters.model';

@Component({
  selector: 'app-valid-filters-filter-panel',
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
  templateUrl: './valid-filters-filter-panel.html',
  styleUrls: ['./valid-filters-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidFiltersFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ValidFilterFilterValue | null = null;
  @Input() catalogOptions: DropdownItem[] = [];
  @Input() productTypeOptions: DropdownItem[] = [];
  @Output() apply = new EventEmitter<ValidFilterFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  allCatalogOptions: DropdownItem[] = [];
  filteredCatalogOptions: DropdownItem[] = [];
  catalogSearchControl = new FormControl('');

  allProductTypeOptions: DropdownItem[] = [];
  filteredProductTypeOptions: DropdownItem[] = [];
  productTypeSearchControl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.allCatalogOptions = [...this.catalogOptions];
    this.filteredCatalogOptions = [...this.catalogOptions];
    this.allProductTypeOptions = [...this.productTypeOptions];
    this.filteredProductTypeOptions = [...this.productTypeOptions];

    this.setupSearchControls();

    this.filterForm = this.fb.group({
      catalogNumber: [this.currentFilters?.catalogNumber ?? null],
      productType: [this.currentFilters?.productType ?? null],
      days: [this.currentFilters?.days ?? null],
    });
  }

  private setupSearchControls(): void {
    this.catalogSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        this.filteredCatalogOptions = this.filterOptions(search, this.allCatalogOptions);
        this.cdr.markForCheck();
      });

    this.productTypeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        this.filteredProductTypeOptions = this.filterOptions(search, this.allProductTypeOptions);
        this.cdr.markForCheck();
      });
  }

  private filterOptions(search: string | null, options: DropdownItem[]): DropdownItem[] {
    if (!search || search.length < 1) {
      return [...options];
    }
    const lowerSearch = search.toLowerCase();
    return options.filter(o =>
      o.code.toLowerCase().includes(lowerSearch) ||
      o.description.toLowerCase().includes(lowerSearch)
    );
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;
    const hasAnyFilter =
      (formValue.catalogNumber !== null && formValue.catalogNumber !== undefined) ||
      (formValue.productType !== null && formValue.productType !== undefined) ||
      (formValue.days !== null && formValue.days !== '' && formValue.days !== undefined);

    return !hasAnyFilter;
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: ValidFilterFilterValue = {};

    if (formValue.catalogNumber) {
      filters.catalogNumber = formValue.catalogNumber;
    }
    if (formValue.productType) {
      filters.productType = formValue.productType;
    }
    if (formValue.days !== null && formValue.days !== '' && formValue.days !== undefined) {
      filters.days = Number(formValue.days);
    }

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      catalogNumber: null,
      productType: null,
      days: null,
    });

    this.catalogSearchControl.setValue('', { emitEvent: false });
    this.filteredCatalogOptions = [...this.allCatalogOptions];
    this.productTypeSearchControl.setValue('', { emitEvent: false });
    this.filteredProductTypeOptions = [...this.allProductTypeOptions];

    this.cdr.markForCheck();
  }

  onDaysKeyDown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(event.key) || (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))) {
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onDaysPaste(event: ClipboardEvent): void {
    const paste = event.clipboardData?.getData('text') || '';
    if (!/^\d{1,4}$/.test(paste) || parseInt(paste, 10) > 9999) {
      event.preventDefault();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
