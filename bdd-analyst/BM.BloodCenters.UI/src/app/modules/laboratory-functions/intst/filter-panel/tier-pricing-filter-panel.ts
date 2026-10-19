import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { TierPricingFilterValue, type CustomerFilterOption, type ProductTypeFilterOption } from '../models/customer-product-tier-pricing.model';

@Component({
  selector: 'app-tier-pricing-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    A11yModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './tier-pricing-filter-panel.html',
  styleUrls: ['./tier-pricing-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TierPricingFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: TierPricingFilterValue | null = null;
  @Input() customerOptions: CustomerFilterOption[] = [];
  @Input() productTypeOptions: ProductTypeFilterOption[] = [];
  @Output() apply = new EventEmitter<TierPricingFilterValue>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  filterForm!: FormGroup;

  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `tier-pricing-filter-${TierPricingFilterPanel.nextId++}`;

  // Searchable dropdown support
  readonly customerIdSearchCtrl = new FormControl('');
  readonly productTypeSearchCtrl = new FormControl('');

  private readonly customerIdSearch = signal('');
  private readonly productTypeSearch = signal('');

  private readonly customerOptionsSignal = signal<CustomerFilterOption[]>([]);
  private readonly productTypeOptionsSignal = signal<ProductTypeFilterOption[]>([]);

  readonly filteredCustomerOptions = computed(() => {
    const search = this.customerIdSearch().toLowerCase();
    if (!search) return this.customerOptionsSignal();
    return this.customerOptionsSignal().filter(opt =>
      opt.id.toLowerCase().includes(search) || opt.name.toLowerCase().includes(search)
    );
  });

  readonly filteredProductTypeOptions = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    if (!search) return this.productTypeOptionsSignal();
    return this.productTypeOptionsSignal().filter(opt =>
      opt.code.toLowerCase().includes(search) || (opt.desc?.toLowerCase().includes(search) ?? false)
    );
  });

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      customerId: [this.currentFilters?.customerId || null],
      productType: [this.currentFilters?.productType || null]
    });

    this.customerOptionsSignal.set(this.customerOptions);
    this.productTypeOptionsSignal.set(this.productTypeOptions);

    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscriptions(): void {
    this.customerIdSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.customerIdSearch.set(v || ''));
    this.productTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => this.productTypeSearch.set(v || ''));
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) {
      searchCtrl.setValue('');
    }
  }

  get selectedCustomerIdDisplay(): string {
    const id = this.filterForm.get('customerId')?.value;
    if (!id) return '';
    const opt = this.customerOptions.find(o => o.id === id);
    return opt ? `${opt.id} - ${opt.name}` : id;
  }

  get selectedProductTypeDisplay(): string {
    const code = this.filterForm.get('productType')?.value;
    if (!code) return '';
    const opt = this.productTypeOptions.find(o => o.code === code);
    return opt?.desc ? `${opt.code} - ${opt.desc}` : code;
  }

  onApply(): void {
    const formValue = this.filterForm.getRawValue();

    const filterValue: TierPricingFilterValue = {
      customerId: formValue.customerId || null,
      productType: formValue.productType || null
    };

    this.apply.emit(filterValue);
  }

  onClear(): void {
    this.filterForm.reset({
      customerId: null,
      productType: null
    });
  }

  get hasActiveFilters(): boolean {
    const formValue = this.filterForm?.value;
    if (!formValue) return false;
    return !!(formValue.customerId || formValue.productType);
  }

  onClose(): void {
    this.close.emit();
  }
}
