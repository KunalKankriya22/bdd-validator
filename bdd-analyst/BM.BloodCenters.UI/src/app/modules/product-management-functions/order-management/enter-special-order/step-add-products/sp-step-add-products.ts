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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, catchError, of, debounceTime, combineLatest, filter, switchMap, startWith, distinctUntilChanged } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { EnterCommentsDialogComponent } from '../../enter-regular-order/dialogs/enter-comments-dialog/enter-comments-dialog';
import {
  SpecialOrderDto,
  SpecialOrderItemDto,
  CreateSpecialOrderItemDto,
  LookupItem,
  InventoryStockCheckResult
} from '../models/special-order.model';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { SpecialOrderApiService } from '../services/special-order-api.service';

@Component({
  selector: 'app-sp-step-add-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './sp-step-add-products.html',
  styleUrls: ['./sp-step-add-products.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpStepAddProductsComponent implements OnInit, OnDestroy, OnChanges {
  private static nextId = 0;
  protected readonly componentId = `sp-step-add-products-${SpStepAddProductsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @Input() orderData: Partial<SpecialOrderDto> | null = null;
  @Input() orderItems: SpecialOrderItemDto[] = [];
  @Output() itemAdded = new EventEmitter<CreateSpecialOrderItemDto>();
  @Output() itemAddedExtra = new EventEmitter<{ attribGroup?: string; attribCode?: string }>();
  @Output() itemDeleted = new EventEmitter<number>();

  // Gap #2: Customer/consignee inputs for filtered product types
  @Input() customerId: string = '';
  @Input() consigneeId: string = '';

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(SpecialOrderApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  newItemForm!: FormGroup;
  saving = signal(false);
  showNewRow = signal(true);
  itemComments = signal<string[]>([]);

  // Gap #3: Multi-antigen/attribute support per item
  itemAntigens = signal<Map<number, any[]>>(new Map());
  itemAttributes = signal<Map<number, any[]>>(new Map());
  expandedItems = signal<Set<number>>(new Set());

  // Per-item form controls for expanded row add antigen/attribute
  expandedAntigenCode: { [itemNo: number]: FormControl } = {};
  expandedAntigenCodeSearch: { [itemNo: number]: FormControl } = {};
  expandedAttribGroup: { [itemNo: number]: FormControl } = {};
  expandedAttribCode: { [itemNo: number]: FormControl } = {};
  expandedAttribSource: { [itemNo: number]: FormControl } = {};
  expandedAttribQty: { [itemNo: number]: FormControl } = {};
  expandedAttributeCodes: { [itemNo: number]: LookupItem[] } = {};
  filteredExpandedAttributeCodes: { [itemNo: number]: LookupItem[] } = {};
  expandedAttributeSources: { [itemNo: number]: LookupItem[] } = {};
  filteredExpandedAttributeSources: { [itemNo: number]: LookupItem[] } = {};

  products = signal<LookupItem[]>([]);
  bloodTypes = signal<LookupItem[]>([]);
  tiers = signal<(LookupItem & { unitPrice?: number })[]>([]);
  groups = signal<LookupItem[]>([]);
  attributeCodes = signal<LookupItem[]>([]);
  antigenCodes = signal<LookupItem[]>([]);
  attributeSources = signal<LookupItem[]>([]);

  filteredProducts = signal<LookupItem[]>([]);
  filteredBloodTypes = signal<LookupItem[]>([]);
  filteredTiers = signal<(LookupItem & { unitPrice?: number })[]>([]);
  filteredGroups = signal<LookupItem[]>([]);
  filteredAttributeCodes = signal<LookupItem[]>([]);
  filteredAntigenCodes = signal<LookupItem[]>([]);
  filteredAttributeSources = signal<LookupItem[]>([]);

  productSearchCtrl = new FormControl('');
  bloodTypeSearchCtrl = new FormControl('');
  tierSearchCtrl = new FormControl('');
  groupSearchCtrl = new FormControl('');
  attributeCodeSearchCtrl = new FormControl('');
  antigenCodeSearchCtrl = new FormControl('');
  attributeSourceSearchCtrl = new FormControl('');

  ngOnInit(): void {
    this.initializeForm();
    this.loadLookups();
    this.subscribeToSearchFilters();
    this.watchProductTypeChanges();
    this.watchGroupChanges();
    this.watchRequiredQtyChanges();
    this.watchPoolSplitValidators();
    this.watchSourceQtyInventory();
    this.loadItemAntigensForExistingItems();
    this.loadItemAttributesFromExistingItems();
  }

  private loadLookups(): void {
    // Gap #2: Pass customerId and consigneeId to filter product types
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

    this.apiService.getAntigenCodesLookup().pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(codes => {
      this.antigenCodes.set(codes);
      this.filteredAntigenCodes.set(codes);
      this.cdr.markForCheck();
    });

  }

  private watchProductTypeChanges(): void {
    this.newItemForm.get('productType')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(productType => {
      this.newItemForm.patchValue({ bloodType: '', tier: null, attributeSource: '' });
      this.bloodTypes.set([]);
      this.filteredBloodTypes.set([]);
      this.tiers.set([]);
      this.filteredTiers.set([]);
      this.attributeSources.set([]);
      this.filteredAttributeSources.set([]);

      if (!productType) return;

      this.apiService.getBloodTypesLookup(productType).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(bloodTypes => {
        this.bloodTypes.set(bloodTypes);
        this.filteredBloodTypes.set(bloodTypes);
        this.cdr.markForCheck();
      });

      this.apiService.getTiersLookup(productType).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(tiers => {
        this.tiers.set(tiers);
        this.filteredTiers.set(tiers);
        this.cdr.markForCheck();
      });

      this.apiService.getSourceProductsLookup(productType).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(sources => {
        this.attributeSources.set(sources);
        this.filteredAttributeSources.set(sources);
        this.cdr.markForCheck();
      });
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

  // Gap #2: Reload product types when customerId or consigneeId changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customerId'] || changes['consigneeId']) {
      this.reloadProductTypes();
    }
    if (changes['orderItems']) {
      this.loadItemAntigensForExistingItems();
      this.loadItemAttributesFromExistingItems();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.newItemForm = this.fb.group({
      productType: ['', [Validators.required]],
      bloodType: ['', [Validators.required]],
      requiredQty: [null, [Validators.required, Validators.min(1), Validators.max(998)]],
      specialFlag: ['', [Validators.required]],
      tier: ['', [Validators.required]],
      group: [''],
      attributeCode: [''],
      antigenCode: [''],
      attributeSource: [''],
      attributeQty: [null]
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

  getItemStatus(item: SpecialOrderItemDto): string {
    const code = item.itemStatus || 'OR';
    return SpStepAddProductsComponent.STATUS_LABELS[code] ?? code;
  }

  getItemBloodType(item: SpecialOrderItemDto): string {
    return item.bloodType || '--';
  }

  getItemBloodTypeDisplay(item: SpecialOrderItemDto): string {
    if (!item.bloodType) return '--';
    return item.bloodTypeDesc || item.bloodType;
  }

  getSelectedAntigenDesc(): string {
    const code = this.newItemForm.get('antigenCode')?.value;
    if (!code) return '--';
    const match = this.antigenCodes().find(a => a.code === code);
    return match?.description || code;
  }

  onAddItem(): void {
    if (this.newItemForm.invalid) {
      this.newItemForm.markAllAsTouched();
      return;
    }

    const formValue = this.newItemForm.getRawValue();
    const tierStr = String(formValue.tier);
    const selectedTier = this.tiers().find(t => t.code === tierStr || String(t.code) === tierStr);
    const unitPrice = selectedTier?.unitPrice ?? 0;

    const tierNum = formValue.tier ? Number(formValue.tier) : 0;
    if (tierNum <= 0) {
      this.newItemForm.get('tier')?.setErrors({ required: true });
      this.newItemForm.markAllAsTouched();
      return;
    }

    const newItem: CreateSpecialOrderItemDto = {
      itemNo: this.nextItemNumber,
      productType: formValue.productType,
      bloodType: formValue.bloodType,
      tier: tierNum,
      requiredQty: formValue.requiredQty,
      unitPrice,
      subOk: formValue.specialFlag || undefined,
      attribGroup: formValue.group || undefined,
      attribCode: formValue.attributeCode || undefined,
      antigenCode: formValue.antigenCode || undefined,
      sourceProductType: formValue.attributeSource || undefined,
      sourceQty: formValue.attributeQty || undefined
    };
    this.itemAdded.emit(newItem);
    this.itemComments.update(c => [...c, '']);
    this.newItemForm.reset();
  }

  onAddNewProducts(): void {
    if (this.showNewRow() && this.newItemForm.dirty && this.newItemForm.valid) {
      this.onAddItem();
    }
    this.showNewRow.set(true);
    this.newItemForm.reset();
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

    this.antigenCodeSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredAntigenCodes.set(
        this.antigenCodes().filter(a => (a.code || '').toLowerCase().includes(search) || (a.description || '').toLowerCase().includes(search))
      );
    });

    this.attributeSourceSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredAttributeSources.set(
        this.attributeSources().filter(s => (s.code || '').toLowerCase().includes(search) || (s.description || '').toLowerCase().includes(search))
      );
    });
  }

  // Gap #6: POOL/SPLIT conditional required validators
  private watchPoolSplitValidators(): void {
    this.newItemForm.get('group')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(group => {
      const attrSource = this.newItemForm.get('attributeSource')!;
      const attrQty = this.newItemForm.get('attributeQty')!;

      if (group === 'POOL' || group === 'SPLIT') {
        attrSource.setValidators([Validators.required]);
        attrQty.setValidators([Validators.required]);
      } else {
        attrSource.clearValidators();
        attrQty.clearValidators();
        attrSource.setErrors(null);
        attrQty.setErrors(null);
      }
      attrSource.updateValueAndValidity();
      attrQty.updateValueAndValidity();
    });
  }

  // Gap #14: Source qty inventory warning
  private watchSourceQtyInventory(): void {
    combineLatest([
      this.newItemForm.get('attributeSource')!.valueChanges.pipe(
        startWith(this.newItemForm.get('attributeSource')!.value),
        distinctUntilChanged()
      ),
      this.newItemForm.get('attributeQty')!.valueChanges.pipe(
        startWith(this.newItemForm.get('attributeQty')!.value),
        debounceTime(500),
        distinctUntilChanged()
      ),
      this.newItemForm.get('bloodType')!.valueChanges.pipe(
        startWith(this.newItemForm.get('bloodType')!.value)
      )
    ]).pipe(
      takeUntil(this.destroy$),
      filter(([source, qty, bloodType]) => !!source && !!qty && qty > 0 && !!bloodType),
      switchMap(([source, qty, bloodType]) =>
        this.apiService.checkInventoryStock(source, bloodType, qty).pipe(
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

  // Gap #2: Reload product types when customer/consignee changes
  private reloadProductTypes(): void {
    this.apiService.getProductTypesLookup(this.customerId, this.consigneeId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(products => {
      this.products.set(products);
      this.filteredProducts.set(products);
      this.cdr.markForCheck();
    });
  }

  // Gap #3: Expand/collapse per item
  toggleItemExpand(itemNo: number): void {
    this.expandedItems.update(set => {
      const newSet = new Set(set);
      if (newSet.has(itemNo)) {
        newSet.delete(itemNo);
      } else {
        newSet.add(itemNo);
        this.loadItemAntigens(itemNo);
        this.loadExpandedSources(itemNo);
      }
      return newSet;
    });
  }

  isItemExpanded(itemNo: number): boolean {
    return this.expandedItems().has(itemNo);
  }

  private loadItemAntigens(itemNo: number): void {
    const orderNo = this.orderData?.orderNo;
    if (!orderNo) return;

    this.apiService.getItemAntigens(orderNo, itemNo).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(antigens => {
      this.itemAntigens.update(map => {
        const newMap = new Map(map);
        newMap.set(itemNo, antigens);
        return newMap;
      });
      this.cdr.markForCheck();
    });
  }

  private loadItemAntigensForExistingItems(): void {
    if (!this.orderData?.orderNo || !this.orderItems?.length) return;
    this.orderItems.forEach(item => {
      this.loadItemAntigens(item.itemNo);
    });
  }

  private loadItemAttributesFromExistingItems(): void {
    if (!this.orderItems?.length) return;
    this.itemAttributes.update(map => {
      const newMap = new Map(map);
      this.orderItems.forEach(item => {
        if (item.attribGroup || item.attribCode) {
          const existing = newMap.get(item.itemNo) || [];
          const hasExisting = existing.some(
            a => a.group === item.attribGroup && a.code === item.attribCode
          );
          if (!hasExisting) {
            newMap.set(item.itemNo, [...existing, {
              group: item.attribGroup || '',
              code: item.attribCode || '',
              source: item.sourceProductType || '',
              qty: item.sourceQty ?? null
            }]);
          }
        }
      });
      return newMap;
    });
  }

  private loadExpandedSources(itemNo: number): void {
    const item = this.orderItems.find(i => i.itemNo === itemNo);
    if (!item?.productType) return;

    this.apiService.getSourceProductsLookup(item.productType).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(sources => {
      this.expandedAttributeSources[itemNo] = sources;
      this.filteredExpandedAttributeSources[itemNo] = sources;
      this.cdr.markForCheck();
    });
  }

  // Per-item form control accessors (lazily created)
  getExpandedAntigenCodeCtrl(itemNo: number): FormControl {
    if (!this.expandedAntigenCode[itemNo]) {
      this.expandedAntigenCode[itemNo] = new FormControl('');
    }
    return this.expandedAntigenCode[itemNo];
  }

  getExpandedAntigenCodeSearchCtrl(itemNo: number): FormControl {
    if (!this.expandedAntigenCodeSearch[itemNo]) {
      this.expandedAntigenCodeSearch[itemNo] = new FormControl('');
    }
    return this.expandedAntigenCodeSearch[itemNo];
  }

  getExpandedAttribGroupCtrl(itemNo: number): FormControl {
    if (!this.expandedAttribGroup[itemNo]) {
      this.expandedAttribGroup[itemNo] = new FormControl('');
    }
    return this.expandedAttribGroup[itemNo];
  }

  getExpandedAttribCodeCtrl(itemNo: number): FormControl {
    if (!this.expandedAttribCode[itemNo]) {
      this.expandedAttribCode[itemNo] = new FormControl('');
    }
    return this.expandedAttribCode[itemNo];
  }

  getExpandedAttribSourceCtrl(itemNo: number): FormControl {
    if (!this.expandedAttribSource[itemNo]) {
      this.expandedAttribSource[itemNo] = new FormControl('');
    }
    return this.expandedAttribSource[itemNo];
  }

  getExpandedAttribQtyCtrl(itemNo: number): FormControl {
    if (!this.expandedAttribQty[itemNo]) {
      this.expandedAttribQty[itemNo] = new FormControl(null);
    }
    return this.expandedAttribQty[itemNo];
  }

  onExpandedGroupChange(itemNo: number, group: string): void {
    this.expandedAttributeCodes[itemNo] = [];
    this.filteredExpandedAttributeCodes[itemNo] = [];
    this.getExpandedAttribCodeCtrl(itemNo).setValue('');

    if (!group) return;

    this.apiService.getAttributeCodesLookup(group).pipe(
      takeUntil(this.destroy$),
      catchError(() => of([]))
    ).subscribe(codes => {
      this.expandedAttributeCodes[itemNo] = codes;
      this.filteredExpandedAttributeCodes[itemNo] = codes;
      this.cdr.markForCheck();
    });
  }

  // Gap #3 + Gap #8: Add antigen to item with duplicate check
  onAddItemAntigen(itemNo: number): void {
    const orderNo = this.orderData?.orderNo;
    if (!orderNo) return;

    const ctrl = this.getExpandedAntigenCodeCtrl(itemNo);
    const antigenCode = ctrl.value;
    if (!antigenCode) return;

    // Gap #8: Duplicate antigen check
    const existingAntigens = this.itemAntigens().get(itemNo) || [];
    if (existingAntigens.some(a => a.antigenId === antigenCode)) {
      this.snackBar.open(`Antigen ${antigenCode} is already added to this item`, 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.apiService.addItemAntigen(orderNo, itemNo, antigenCode).pipe(
      takeUntil(this.destroy$),
      catchError(() => {
        this.snackBar.open('Failed to add antigen. Please try again.', 'DISMISS', {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return of(null);
      })
    ).subscribe(antigens => {
      if (antigens) {
        this.itemAntigens.update(map => {
          const newMap = new Map(map);
          newMap.set(itemNo, antigens);
          return newMap;
        });
        ctrl.setValue('');
        this.cdr.markForCheck();
      }
    });
  }

  onDeleteItemAntigen(itemNo: number, antigenId: string): void {
    const orderNo = this.orderData?.orderNo;
    if (!orderNo) return;

    this.apiService.deleteItemAntigen(orderNo, itemNo, antigenId).pipe(
      takeUntil(this.destroy$),
      catchError(() => {
        this.snackBar.open('Failed to delete antigen. Please try again.', 'DISMISS', {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return of(false);
      })
    ).subscribe(success => {
      if (success) {
        this.loadItemAntigens(itemNo);
      }
    });
  }

  onAddItemAttribute(itemNo: number): void {
    const group = this.getExpandedAttribGroupCtrl(itemNo).value;
    const code = this.getExpandedAttribCodeCtrl(itemNo).value;
    const source = this.getExpandedAttribSourceCtrl(itemNo).value;
    const qty = this.getExpandedAttribQtyCtrl(itemNo).value;

    if (!group || !code) {
      this.snackBar.open('Group and Code are required to add an attribute', 'DISMISS', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.itemAttributes.update(map => {
      const newMap = new Map(map);
      const existing = newMap.get(itemNo) || [];
      newMap.set(itemNo, [...existing, {
        group,
        code,
        source: source || '',
        qty: qty ?? null
      }]);
      return newMap;
    });

    this.getExpandedAttribGroupCtrl(itemNo).setValue('');
    this.getExpandedAttribCodeCtrl(itemNo).setValue('');
    this.getExpandedAttribSourceCtrl(itemNo).setValue('');
    this.getExpandedAttribQtyCtrl(itemNo).setValue(null);
    this.cdr.markForCheck();
  }

  onDeleteItemAttribute(itemNo: number, index: number): void {
    this.itemAttributes.update(map => {
      const newMap = new Map(map);
      const existing = [...(newMap.get(itemNo) || [])];
      existing.splice(index, 1);
      newMap.set(itemNo, existing);
      return newMap;
    });
    this.cdr.markForCheck();
  }

  get f() { return this.newItemForm.controls; }
}
