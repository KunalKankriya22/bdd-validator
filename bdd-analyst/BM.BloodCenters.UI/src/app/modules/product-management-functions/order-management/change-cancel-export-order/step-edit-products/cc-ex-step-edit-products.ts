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
import { Subject, takeUntil, catchError, of, debounceTime } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import {
  ExportOrderDto,
  ExportOrderItemDto,
  CreateExportOrderItemDto,
  LookupItem
} from '../../enter-export-order/models/export-order.model';
import { ExportOrderApiService } from '../../enter-export-order/services/export-order-api.service';

@Component({
  selector: 'app-cc-ex-step-edit-products',
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
    NgxMatSelectSearchModule
  ],
  templateUrl: './cc-ex-step-edit-products.html',
  styleUrls: ['./cc-ex-step-edit-products.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CcExStepEditProductsComponent implements OnInit, OnDestroy, OnChanges {
  private static nextId = 0;
  protected readonly componentId = `cc-ex-step-edit-products-${CcExStepEditProductsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @Input() orderData: Partial<ExportOrderDto> | null = null;
  @Input() orderItems: ExportOrderItemDto[] = [];
  @Input() isReadOnly = false;
  @Output() itemAdded = new EventEmitter<CreateExportOrderItemDto>();
  @Output() itemDeleted = new EventEmitter<number>();
  @Output() itemCanceled = new EventEmitter<number>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ExportOrderApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  newItemForm!: FormGroup;
  saving = signal(false);
  showNewRow = signal(false);

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

  ngOnChanges(_changes: SimpleChanges): void {
    // No-op for now; items are purely input-driven
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadLookups();
    this.subscribeToSearchFilters();
    this.watchProductTypeChanges();
    this.watchGroupChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.newItemForm = this.fb.group({
      productType: ['', [Validators.required]],
      bloodType: ['', [Validators.required]],
      requiredQty: [null, [Validators.required, Validators.min(1)]],
      specialFlag: ['', [Validators.required]],
      tier: ['', [Validators.required]],
      group: [''],
      attributeCode: ['']
    });
  }

  private loadLookups(): void {
    const customerId = this.orderData?.customerId;
    const consigneeId = this.orderData?.consigneeId;

    this.apiService.getProductTypesLookup(customerId, consigneeId).pipe(
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

      this.apiService.getTiersLookup(productType, this.orderData?.customerId).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(tiers => {
        this.tiers.set(tiers);
        this.filteredTiers.set(tiers);
        // Auto-select tier 1 if available
        const tier1 = tiers.find(t => t.code === '1' || String(t.code) === '1');
        if (tier1) {
          this.newItemForm.patchValue({ tier: tier1.code });
        }
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

  get nextItemNumber(): number {
    if (this.orderItems.length === 0) return 1;
    const maxItem = Math.max(...this.orderItems.map(i => i.itemNo));
    return maxItem + 1;
  }

  private static readonly STATUS_LABELS: Record<string, string> = {
    'OR': 'Ordered',
    'CA': 'Canceled',
    'CN': 'Canceled',
    'SH': 'Shipped',
    'HO': 'Hold',
    'AL': 'Allocated',
    'PK': 'Packed',
    'CL': 'Closed',
    'BO': 'Back Ordered',
    'UF': 'Unfilled',
    'DL': 'Delivered'
  };

  getItemStatus(item: ExportOrderItemDto): string {
    const code = item.itemStatus || 'OR';
    return CcExStepEditProductsComponent.STATUS_LABELS[code] ?? code;
  }

  getStatusClass(item: ExportOrderItemDto): string {
    const code = item.itemStatus || 'OR';
    return `status-${code.toLowerCase()}`;
  }

  getItemBloodTypeDisplay(item: ExportOrderItemDto): string {
    if (!item.bloodType) return '--';
    return item.bloodTypeDesc || item.bloodType;
  }

  getItemCost(item: ExportOrderItemDto): string {
    if (item.unitPrice != null) {
      return item.unitPrice.toFixed(2);
    }
    return '--';
  }

  getSubOkDisplay(subOk?: string): string {
    if (subOk === 'Y') return 'Yes';
    if (subOk === 'N') return 'No';
    return '--';
  }

  isItemEditable(item: ExportOrderItemDto): boolean {
    const code = item.itemStatus || 'OR';
    return code !== 'CA' && code !== 'CN' && code !== 'SH' && code !== 'CL' && code !== 'DL';
  }

  onAddItem(): void {
    if (this.newItemForm.invalid) {
      this.newItemForm.markAllAsTouched();
      return;
    }

    const formValue = this.newItemForm.getRawValue();
    const tierStr = String(formValue.tier ?? '');
    const selectedTier = this.tiers().find(t => t.code === tierStr || String(t.code) === tierStr);
    const unitPrice = selectedTier?.unitPrice ?? 0;
    const tierNum = formValue.tier ? Number(formValue.tier) : 0;

    const selectedBloodType = this.bloodTypes().find(bt => bt.code === formValue.bloodType);

    const newItem: CreateExportOrderItemDto = {
      itemNo: this.nextItemNumber,
      productType: formValue.productType,
      bloodType: formValue.bloodType,
      bloodTypeDesc: selectedBloodType?.description,
      tier: tierNum,
      requiredQty: formValue.requiredQty,
      unitPrice,
      subOk: formValue.specialFlag || undefined,
      attribGroup: formValue.group || undefined,
      attribCode: formValue.attributeCode || undefined
    };
    this.itemAdded.emit(newItem);
    this.newItemForm.reset();
  }

  onAddNewProducts(): void {
    if (this.showNewRow()) {
      if (this.newItemForm.dirty) {
        if (this.newItemForm.valid) {
          this.onAddItem();
        } else {
          this.newItemForm.markAllAsTouched();
          this.cdr.markForCheck();
          return;
        }
      }
    } else {
      this.showNewRow.set(true);
      this.newItemForm.reset();
    }
  }

  onDiscardNewRow(): void {
    this.showNewRow.set(false);
    this.newItemForm.reset();
  }

  hasPendingItem(): boolean {
    return this.showNewRow() && this.newItemForm.dirty;
  }

  tryFlushPendingItem(): boolean {
    if (!this.showNewRow() || !this.newItemForm.dirty) return true;
    if (this.newItemForm.valid) {
      this.onAddItem();
      return true;
    }
    this.newItemForm.markAllAsTouched();
    this.cdr.markForCheck();
    return false;
  }

  onCancelItem(item: ExportOrderItemDto): void {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Cancel Item',
        message: `Are you sure you want to cancel item ${item.itemNo} (${item.productType})?`,
        confirmText: 'YES, CANCEL',
        cancelText: 'NO'
      }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(confirmed => {
      if (confirmed) {
        this.itemCanceled.emit(item.itemNo);
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
