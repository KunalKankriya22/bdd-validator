import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  Input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { A11yModule } from '@angular/cdk/a11y';

import {
  FilterValue,
  ProductCodeLOV,
  InventoryProductTypeLOV,
  ProductionProductTypeLOV,
  ServiceCodeLOV
} from '../models/enter-product-service-codes.model';

@Component({
  selector: 'app-enter-product-service-codes-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  templateUrl: './enter-product-service-codes-filter-panel.html',
  styleUrls: ['./enter-product-service-codes-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnterProductServiceCodesFilterPanel implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `filter-panel-${EnterProductServiceCodesFilterPanel.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @Input() currentFilters: FilterValue | null = null;

  @Input() set productCodeOptions(value: ProductCodeLOV[]) {
    this._productCodeOptions = value;
    this.filteredProductCodeOptions = [...value];
  }
  get productCodeOptions(): ProductCodeLOV[] { return this._productCodeOptions; }

  @Input() set inventoryProductTypeOptions(value: InventoryProductTypeLOV[]) {
    this._inventoryProductTypeOptions = value;
    this.filteredInvProductTypeOptions = [...value];
  }
  get inventoryProductTypeOptions(): InventoryProductTypeLOV[] { return this._inventoryProductTypeOptions; }

  @Input() set productionProductTypeOptions(value: ProductionProductTypeLOV[]) {
    this._productionProductTypeOptions = value;
    this.filteredProductTypeOptions = [...value];
  }
  get productionProductTypeOptions(): ProductionProductTypeLOV[] { return this._productionProductTypeOptions; }

  @Input() set serviceCodeOptions(value: ServiceCodeLOV[]) {
    this._serviceCodeOptions = value;
    this.filteredServiceCodeOptions = [...value];
  }
  get serviceCodeOptions(): ServiceCodeLOV[] { return this._serviceCodeOptions; }

  @Output() apply = new EventEmitter<FilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  productCodeSearchCtrl = new FormControl<string>('');
  invProductTypeSearchCtrl = new FormControl<string>('');
  productTypeSearchCtrl = new FormControl<string>('');
  serviceCodeSearchCtrl = new FormControl<string>('');

  filteredProductCodeOptions: ProductCodeLOV[] = [];
  filteredInvProductTypeOptions: InventoryProductTypeLOV[] = [];
  filteredProductTypeOptions: ProductionProductTypeLOV[] = [];
  filteredServiceCodeOptions: ServiceCodeLOV[] = [];

  private _productCodeOptions: ProductCodeLOV[] = [];
  private _inventoryProductTypeOptions: InventoryProductTypeLOV[] = [];
  private _productionProductTypeOptions: ProductionProductTypeLOV[] = [];
  private _serviceCodeOptions: ServiceCodeLOV[] = [];

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      productCode: [this.currentFilters?.productCode ?? null],
      invProductType: [this.currentFilters?.invProductType ?? null],
      productType: [this.currentFilters?.productType ?? null],
      serviceCode: [this.currentFilters?.serviceCode ?? null]
    });

    this.productCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredProductCodeOptions = this._productCodeOptions.filter(
          (o) => o.productCode.toLowerCase().includes(term) || (o.productDesc ?? '').toLowerCase().includes(term)
        );
      });

    this.invProductTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredInvProductTypeOptions = this._inventoryProductTypeOptions.filter(
          (o) => o.productType.toLowerCase().includes(term) || (o.productTypeDesc ?? '').toLowerCase().includes(term)
        );
      });

    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredProductTypeOptions = this._productionProductTypeOptions.filter(
          (o) => o.productType.toLowerCase().includes(term)
        );
      });

    this.serviceCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredServiceCodeOptions = this._serviceCodeOptions.filter(
          (o) => o.serviceCode.toLowerCase().includes(term)
        );
      });
  }

  get isApplyDisabled(): boolean {
    if (!this.filterForm) return true;
    const v = this.filterForm.value;
    return !v.productCode && !v.invProductType && !v.productType && !v.serviceCode;
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: FilterValue = {};

    if (formValue.productCode) {
      filters.productCode = formValue.productCode;
    }
    if (formValue.invProductType) {
      filters.invProductType = formValue.invProductType;
    }
    if (formValue.productType) {
      filters.productType = formValue.productType;
    }
    if (formValue.serviceCode) {
      filters.serviceCode = formValue.serviceCode;
    }

    this.apply.emit(filters);
  }

  onClearAll(): void {
    this.filterForm.reset({
      productCode: null,
      invProductType: null,
      productType: null,
      serviceCode: null
    });
    this.productCodeSearchCtrl.setValue('', { emitEvent: false });
    this.invProductTypeSearchCtrl.setValue('', { emitEvent: false });
    this.productTypeSearchCtrl.setValue('', { emitEvent: false });
    this.serviceCodeSearchCtrl.setValue('', { emitEvent: false });
    this.filteredProductCodeOptions = [...this._productCodeOptions];
    this.filteredInvProductTypeOptions = [...this._inventoryProductTypeOptions];
    this.filteredProductTypeOptions = [...this._productionProductTypeOptions];
    this.filteredServiceCodeOptions = [...this._serviceCodeOptions];

    // Apply empty filters to reset the table
    this.apply.emit({});
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
