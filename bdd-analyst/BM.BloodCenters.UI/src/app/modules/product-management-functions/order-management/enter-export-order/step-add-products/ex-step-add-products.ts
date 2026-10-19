import {
  Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter,
  inject, signal, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, catchError, of, debounceTime, combineLatest, filter, switchMap, startWith, distinctUntilChanged } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { EnterCommentsDialogComponent } from '../../enter-regular-order/dialogs/enter-comments-dialog/enter-comments-dialog';
import {
  ExportOrderDto,
  ExportOrderItemDto,
  CreateExportOrderItemDto,
  OrderItemAttributeDto,
  LookupItem,
  InventoryStockCheckResult
} from '../models/export-order.model';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ExportOrderApiService } from '../services/export-order-api.service';
import { positiveIntegerValidator } from '@shared/validators/input.validators';

@Component({
  selector: 'app-ex-step-add-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './ex-step-add-products.html',
  styleUrls: ['./ex-step-add-products.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExStepAddProductsComponent implements OnInit, OnDestroy, OnChanges {
  private static nextId = 0;
  protected readonly componentId = `ex-step-add-products-${ExStepAddProductsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @Input() orderData: Partial<ExportOrderDto> | null = null;
  @Input() orderItems: ExportOrderItemDto[] = [];
  @Input() customerId: string = '';
  @Input() consigneeId: string = '';
  @Input() priceChangeFlag: string | null = null;
  @Input() contractSubstituteFlag: string | null = null;
  @Output() itemAdded = new EventEmitter<CreateExportOrderItemDto>();
  @Output() itemAddedExtra = new EventEmitter<{ attribGroup?: string; attribCode?: string }>();
  @Output() itemDeleted = new EventEmitter<number>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ExportOrderApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  newItemForm!: FormGroup;
  saving = signal(false);
  showNewRow = signal(true);
  itemComments = signal<string[]>([]);
  pendingAttributes = signal<OrderItemAttributeDto[]>([]);

  products = signal<LookupItem[]>([]);
  bloodTypes = signal<LookupItem[]>([]);
  tiers = signal<(LookupItem & { unitPrice?: number })[]>([]);
  groups = signal<LookupItem[]>([]);
  attributeCodes = signal<LookupItem[]>([]);

  filteredProducts = signal<LookupItem[]>([]);
  filteredBloodTypes = signal<LookupItem[]>([]);
  filteredTiers = signal<(LookupItem & { unitPrice?: number })[]>([]);
  filteredGroups = signal<LookupItem[]>([]);
  filteredAttributeCodes = signal<LookupItem[]>([]);

  productSearchCtrl = new FormControl('');
  bloodTypeSearchCtrl = new FormControl('');
  tierSearchCtrl = new FormControl('');
  groupSearchCtrl = new FormControl('');
  attributeCodeSearchCtrl = new FormControl('');

  ngOnInit(): void {
    this.initializeForm();
    this.loadLookups();
    this.subscribeToSearchFilters();
    this.watchProductTypeChanges();
    this.watchTierChanges();
    this.watchGroupChanges();
    this.watchRequiredQtyChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customerId'] && !changes['customerId'].firstChange) {
      this.loadProductTypes();
    }

    if (changes['priceChangeFlag']) {
      const unitPriceCtrl = this.newItemForm?.get('unitPrice');
      if (unitPriceCtrl) {
        if (this.priceChangeFlag === 'Y') {
          unitPriceCtrl.enable();
        } else if (this.priceChangeFlag !== null) {
          unitPriceCtrl.disable();
        }
      }
    }

    if (changes['contractSubstituteFlag'] && this.contractSubstituteFlag) {
      this.newItemForm?.patchValue({ specialFlag: this.contractSubstituteFlag });
    }
  }

  private loadProductTypes(): void {
    this.apiService.getProductTypesLookup(this.customerId, this.consigneeId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(products => {
      this.products.set(products);
      this.filteredProducts.set(products);
      this.cdr.markForCheck();
    });
  }

  private loadLookups(): void {
    this.apiService.getProductTypesLookup(this.customerId, this.consigneeId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(products => {
      this.products.set(products);
      this.filteredProducts.set(products);
      this.cdr.markForCheck();
    });

    this.apiService.getAttributeGroupsLookup().pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(groups => {
      this.groups.set(groups);
      this.filteredGroups.set(groups);
      this.cdr.markForCheck();
    });
  }

  private watchProductTypeChanges(): void {
    this.newItemForm.get('productType')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(productType => {
      this.newItemForm.patchValue({ bloodType: '', tier: null });
      this.bloodTypes.set([]);
      this.filteredBloodTypes.set([]);
      this.tiers.set([]);
      this.filteredTiers.set([]);

      if (!productType) return;

      this.apiService.getBloodTypesLookup(productType).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(bloodTypes => {
        this.bloodTypes.set(bloodTypes);
        this.filteredBloodTypes.set(bloodTypes);
        this.cdr.markForCheck();
      });

      this.apiService.getTiersLookup(productType, this.customerId).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(tiers => {
        this.tiers.set(tiers);
        this.filteredTiers.set(tiers);
        // Auto-select tier 1 if available
        const tier1 = tiers.find(t => t.code === '1' || t.code === 1);
        if (tier1) {
          this.newItemForm.patchValue({ tier: tier1.code });
        }
        this.cdr.markForCheck();
      });
    });
  }

  private watchTierChanges(): void {
    this.newItemForm.get('tier')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(tier => {
      if (!tier) return;
      const tierStr = String(tier);
      const selectedTier = this.tiers().find(t => t.code === tierStr || String(t.code) === tierStr);
      if (selectedTier?.unitPrice != null) {
        this.newItemForm.patchValue({ unitPrice: selectedTier.unitPrice }, { emitEvent: false });
      }
    });
  }

  private watchGroupChanges(): void {
    this.newItemForm.get('group')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(group => {
      this.newItemForm.patchValue({ attributeCode: '' });
      this.attributeCodes.set([]);
      this.filteredAttributeCodes.set([]);

      if (!group) return;

      this.apiService.getAttributeCodesLookup(group).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(codes => {
        this.attributeCodes.set(codes);
        this.filteredAttributeCodes.set(codes);
        this.cdr.markForCheck();
      });
    });
  }

  private watchRequiredQtyChanges(): void {
    combineLatest([
      this.newItemForm.get('requiredQty')!.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged()
      ),
      this.newItemForm.get('productType')!.valueChanges.pipe(
        startWith(this.newItemForm.get('productType')!.value)
      ),
      this.newItemForm.get('bloodType')!.valueChanges.pipe(
        startWith(this.newItemForm.get('bloodType')!.value)
      )
    ]).pipe(
      takeUntil(this.destroy$),
      filter(([qty, productType, bloodType]) => !!qty && qty > 0 && !!productType && !!bloodType),
      switchMap(([qty, productType, bloodType]) =>
        this.apiService.checkInventoryStock(productType, bloodType, qty).pipe(
          catchError(() => of(null))
        )
      )
    ).subscribe(result => {
      if (result && result.warningLevel !== 'none' && result.warningMessage) {
        this.dialog.open(ConfirmActionDialogComponent, {
          width: '420px',
          disableClose: true,
          data: {
            title: 'Inventory Warning',
            message: result.warningMessage,
            detail: `Current Stock: ${result.currentStock} | Minimal: ${result.minimal} | Optimal: ${result.optimal}`,
            confirmText: 'OK'
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.newItemForm = this.fb.group({
      productType: ['', [Validators.required]],
      bloodType: ['', [Validators.required]],
      requiredQty: [null, [Validators.required, positiveIntegerValidator(1, 999)]],
      specialFlag: ['', [Validators.required]],
      tier: ['', [Validators.required]],
      unitPrice: [null, [Validators.min(0), Validators.max(999999.99)]],
      group: [''],
      attributeCode: ['']
    });
  }

  get nextItemNumber(): number {
    if (this.orderItems.length === 0) return 1;
    const maxItem = Math.max(...this.orderItems.map(i => i.itemNo));
    return maxItem + 1;
  }

  private static readonly STATUS_LABELS: Record<string, string> = {
    'OR': 'Ordered',
    'CA': 'Canceled',
    'SH': 'Shipped',
    'HO': 'Hold',
    'AL': 'Allocated',
    'PK': 'Packed'
  };

  getItemStatus(item: ExportOrderItemDto): string {
    const code = item.itemStatus || 'OR';
    return ExStepAddProductsComponent.STATUS_LABELS[code] ?? code;
  }

  getItemCost(item: ExportOrderItemDto): string {
    if (item.unitPrice != null) {
      return item.unitPrice.toFixed(2);
    }
    return '--';
  }

  getItemBloodTypeDisplay(item: ExportOrderItemDto): string {
    if (!item.bloodType) return '--';
    return item.bloodTypeDesc || item.bloodType;
  }

  get selectedAttributeDescription(): string {
    const code = this.newItemForm.get('attributeCode')?.value;
    if (!code) return '--';
    const attr = this.attributeCodes().find(a => a.code === code);
    return attr?.description || '--';
  }

  addAttribute(): void {
    const group = this.newItemForm.get('group')?.value;
    const code = this.newItemForm.get('attributeCode')?.value;
    if (!group || !code) return;

    // Check for duplicate
    const isDuplicate = this.pendingAttributes().some(
      a => a.attribGroup === group && a.attribCode === code
    );
    if (isDuplicate) {
      this.snackBar.open('This attribute is already added', 'Close', { duration: 3000 });
      return;
    }

    // Get description
    const attr = this.attributeCodes().find(a => a.code === code);

    this.pendingAttributes.update(list => [
      ...list,
      { attribGroup: group, attribCode: code, attribDesc: attr?.description || '' }
    ]);

    // Reset group and code for next attribute
    this.newItemForm.patchValue({ group: '', attributeCode: '' });
    this.attributeCodes.set([]);
    this.filteredAttributeCodes.set([]);
    this.cdr.markForCheck();
  }

  removeAttribute(index: number): void {
    this.pendingAttributes.update(list => list.filter((_, i) => i !== index));
    this.cdr.markForCheck();
  }

  onAddItem(): void {
    if (this.newItemForm.invalid) {
      this.newItemForm.markAllAsTouched();
      setTimeout(() => {
        const firstError = document.querySelector('.new-item-row mat-error');
        const field = firstError?.closest('td')?.querySelector('mat-select, input') as HTMLElement;
        if (field) field.focus();
      });
      return;
    }

    const formValue = this.newItemForm.getRawValue();

    const tierStr = String(formValue.tier);
    const selectedTier = this.tiers().find(t => t.code === tierStr || String(t.code) === tierStr);
    const tierPrice = selectedTier?.unitPrice ?? 0;
    const unitPrice = formValue.unitPrice != null && formValue.unitPrice >= 0 ? formValue.unitPrice : tierPrice;

    const tierNum = formValue.tier ? Number(formValue.tier) : 0;
    if (tierNum <= 0) {
      this.newItemForm.get('tier')?.setErrors({ required: true });
      this.newItemForm.markAllAsTouched();
      return;
    }

    const selectedBloodType = this.bloodTypes().find(bt => bt.code === formValue.bloodType);
    const attrs = this.pendingAttributes();

    const newItem: CreateExportOrderItemDto = {
      itemNo: this.nextItemNumber,
      productType: formValue.productType,
      bloodType: formValue.bloodType,
      bloodTypeDesc: selectedBloodType?.description,
      tier: tierNum,
      requiredQty: formValue.requiredQty,
      unitPrice,
      subOk: formValue.specialFlag || undefined,
      attribGroup: attrs.length > 0 ? attrs[0].attribGroup : (formValue.group || undefined),
      attribCode: attrs.length > 0 ? attrs[0].attribCode : (formValue.attributeCode || undefined),
      attributes: attrs.length > 0 ? attrs : undefined
    };
    this.itemAdded.emit(newItem);
    this.itemComments.update(c => [...c, '']);
    this.pendingAttributes.set([]);
    this.newItemForm.reset();
    this.newItemForm.patchValue({ specialFlag: this.contractSubstituteFlag || '' });
    setTimeout(() => {
      const firstField = document.getElementById(this.elementId('productType'));
      if (firstField) firstField.focus();
    });
  }

  onAddNewProducts(): void {
    if (this.showNewRow() && this.newItemForm.dirty && this.newItemForm.valid) {
      this.onAddItem();
    }
    this.showNewRow.set(true);
    this.pendingAttributes.set([]);
    this.newItemForm.reset();
    this.newItemForm.patchValue({ specialFlag: this.contractSubstituteFlag || '' });
  }

  onItemComment(index: number): void {
    const currentComment = index >= 0 ? (this.itemComments()[index] || '') : '';

    const dialogRef = this.dialog.open(EnterCommentsDialogComponent, {
      position: { right: '0' },
      width: '500px',
      height: '100vh',
      panelClass: 'right-panel-dialog',
      data: { notes: currentComment }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result !== null && result !== undefined && index >= 0) {
        this.itemComments.update(comments => {
          const updated = [...comments];
          updated[index] = result;
          return updated;
        });
        this.cdr.markForCheck();
      }
    });
  }

  onDeleteItem(itemNo: number): void {
    this.itemDeleted.emit(itemNo);
  }

  private subscribeToSearchFilters(): void {
    this.productSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredProducts.set(
        this.products().filter(p => (p.code || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search))
      );
    });

    this.bloodTypeSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredBloodTypes.set(
        this.bloodTypes().filter(bt => (bt.code || '').toLowerCase().includes(search) || (bt.description || '').toLowerCase().includes(search))
      );
    });

    this.tierSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredTiers.set(
        this.tiers().filter(t => (t.code || '').toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search))
      );
    });

    this.groupSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredGroups.set(
        this.groups().filter(g => (g.code || '').toLowerCase().includes(search) || (g.description || '').toLowerCase().includes(search))
      );
    });

    this.attributeCodeSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredAttributeCodes.set(
        this.attributeCodes().filter(a => (a.code || '').toLowerCase().includes(search) || (a.description || '').toLowerCase().includes(search))
      );
    });
  }

  get f() { return this.newItemForm.controls; }
}
