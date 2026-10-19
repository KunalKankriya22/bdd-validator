import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, inject, signal, computed,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { A11yModule } from '@angular/cdk/a11y';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BloodCenterInventoryLevelQueryService } from '../services/blood-center-inventory-level-query.service';
import {
  ProductTypeDto,
  BloodTypeDto,
  AttributeGroupDto,
  AttributeCodeDto,
  InventoryLevelQueryDto
} from '../interfaces/inventory-level.interface';

@Component({
  selector: 'app-blood-center-inventory-level-query-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  templateUrl: './blood-center-inventory-level-query-filter-panel.html',
  styleUrl: './blood-center-inventory-level-query-filter-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BloodCenterInventoryLevelQueryFilterPanel implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(BloodCenterInventoryLevelQueryService);
  private readonly cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  @Input() currentFilters: Partial<InventoryLevelQueryDto> | null = null;
  @Output() apply = new EventEmitter<Partial<InventoryLevelQueryDto>>();
  @Output() close = new EventEmitter<void>();

  // ── Data signals ──────────────────────────────────────────────────────────
  readonly productTypes = signal<ProductTypeDto[]>([]);
  readonly bloodTypes = signal<BloodTypeDto[]>([]);
  readonly attributeGroups = signal<AttributeGroupDto[]>([]);
  readonly attributeCodes = signal<AttributeCodeDto[]>([]);

  readonly hasChanges = signal(false);

  readonly selectedProductTypeDesc   = signal<string>('');
  readonly selectedBloodTypeDesc     = signal<string>('');
  readonly selectedAttributeCodeDesc = signal<string>('');

  // ── Per-dropdown search controls ──────────────────────────────────────────
  readonly productTypeSearchCtrl = new FormControl('');
  readonly bloodTypeSearchCtrl = new FormControl('');
  readonly attributeGroupSearchCtrl = new FormControl('');
  readonly attributeCodeSearchCtrl = new FormControl('');

  // ── Private search signals ────────────────────────────────────────────────
  private readonly productTypeSearch = signal('');
  private readonly bloodTypeSearch = signal('');
  private readonly attributeGroupSearch = signal('');
  private readonly attributeCodeSearch = signal('');

  // ── Computed filtered lists ───────────────────────────────────────────────
  readonly filteredProductTypes = computed(() =>
    this.filterItems(this.productTypes(), this.productTypeSearch())
  );
  readonly filteredBloodTypes = computed(() =>
    this.filterItems(this.bloodTypes(), this.bloodTypeSearch())
  );
  readonly filteredAttributeGroups = computed(() =>
    this.filterItems(this.attributeGroups(), this.attributeGroupSearch())
  );
  readonly filteredAttributeCodes = computed(() =>
    this.filterItems(this.attributeCodes(), this.attributeCodeSearch())
  );

  filterForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
    this.setupSearchSubscriptions();
    this.loadFilterOptions();
    if (this.currentFilters?.attributeGroup) {
      this.loadAttributeCodes(this.currentFilters.attributeGroup);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const f = this.currentFilters;
    this.filterForm = this.fb.group({
      productType:    [f?.productType    ?? null],
      bloodType:      [f?.bloodType      ?? null],
      attributeGroup: [f?.attributeGroup ?? null],
      attributeCode:  [{ value: f?.attributeCode ?? null, disabled: !f?.attributeGroup }]
    });
  }

  private setupFormListeners(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.hasChanges.set(true));

    this.filterForm.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(pt => this.onProductTypeChange(pt));

    this.filterForm.get('attributeGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(group => this.onAttributeGroupChange(group));

    this.filterForm.get('bloodType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(bt => {
        const found = this.bloodTypes().find(t => t.code === bt);
        this.selectedBloodTypeDesc.set(found?.description ?? '');
      });

    this.filterForm.get('attributeCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(code => {
        const found = code ? this.attributeCodes().find(c => c.code === code) : undefined;
        this.selectedAttributeCodeDesc.set(found?.description ?? '');
      });
  }

  private setupSearchSubscriptions(): void {
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.productTypeSearch.set(v || ''));

    this.bloodTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.bloodTypeSearch.set(v || ''));

    this.attributeGroupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.attributeGroupSearch.set(v || ''));

    this.attributeCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.attributeCodeSearch.set(v || ''));
  }

  onSelectOpenedChange(searchCtrl: FormControl, isOpen: boolean): void {
    if (!isOpen) searchCtrl.setValue('');
  }

  private filterItems<T extends { code?: string; description?: string }>(
    items: T[],
    search: string
  ): T[] {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item =>
      (item.code || '').toLowerCase().includes(lower) ||
      (item.description || '').toLowerCase().includes(lower)
    );
  }

  private onProductTypeChange(productType: string | null): void {
    this.filterForm.get('bloodType')?.setValue(null, { emitEvent: false });
    this.selectedBloodTypeDesc.set('');
    const found = this.productTypes().find(t => t.code === productType);
    this.selectedProductTypeDesc.set(found?.description ?? '');
    this.service.getBloodTypes('MI', productType ?? undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: d => { this.bloodTypes.set(d); this.cdr.markForCheck(); }, error: () => {} });
  }

  private loadFilterOptions(): void {
    this.service.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: d => { this.productTypes.set(d); this.cdr.markForCheck(); }, error: () => {} });

    this.service.getBloodTypes('MI', this.currentFilters?.productType ?? undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: d => { this.bloodTypes.set(d); this.cdr.markForCheck(); }, error: () => {} });

    this.service.getAttributeGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: d => { this.attributeGroups.set(d); this.cdr.markForCheck(); }, error: () => {} });
  }

  private loadAttributeCodes(group: string): void {
    this.service.getAttributeCodes(group)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: d => { this.attributeCodes.set(d); this.cdr.markForCheck(); }, error: () => {} });
  }

  private onAttributeGroupChange(group: string | null): void {
    const ctrl = this.filterForm.get('attributeCode');
    ctrl?.setValue(null, { emitEvent: false });
    this.selectedAttributeCodeDesc.set('');
    if (group) {
      ctrl?.enable({ emitEvent: false });
      this.loadAttributeCodes(group);
    } else {
      ctrl?.disable({ emitEvent: false });
      this.attributeCodes.set([]);
    }
  }

  onApply(): void {
    const raw = this.filterForm.getRawValue();
    this.apply.emit({
      productType:    raw.productType    || null,
      bloodType:      raw.bloodType      || null,
      attributeGroup: raw.attributeGroup || null,
      attributeCode:  raw.attributeCode  || null
    });
  }

  onClear(): void {
    this.filterForm.reset();
    this.hasChanges.set(false);
    this.attributeCodes.set([]);
    this.selectedProductTypeDesc.set('');
    this.selectedBloodTypeDesc.set('');
    this.selectedAttributeCodeDesc.set('');
    this.service.getBloodTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: d => { this.bloodTypes.set(d); this.cdr.markForCheck(); }, error: () => {} });
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const raw = this.filterForm.getRawValue();
    return !raw.productType && !raw.bloodType && !raw.attributeGroup && !raw.attributeCode;
  }

  get isAttributeCodeDisabled(): boolean {
    return this.filterForm.get('attributeCode')?.disabled ?? true;
  }
}
