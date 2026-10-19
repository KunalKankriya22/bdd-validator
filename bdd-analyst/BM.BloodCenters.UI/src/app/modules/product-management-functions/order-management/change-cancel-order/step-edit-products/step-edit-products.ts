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
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  RegularOrderDto,
  OrderItemDto,
  CreateOrderItemDto,
  UpdateOrderItemRequestDto,
  LookupItem
} from '../../enter-regular-order/models/regular-order.model';
import { RegularOrderApiService } from '../../enter-regular-order/services/regular-order-api.service';
import { ConfirmCancellationDialogComponent } from '../dialogs/confirm-cancellation-dialog/confirm-cancellation-dialog';
import { EnterCommentsDialogComponent } from '../../enter-regular-order/dialogs/enter-comments-dialog/enter-comments-dialog';

@Component({
  selector: 'app-cc-step-edit-products',
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
  templateUrl: './step-edit-products.html',
  styleUrls: ['./step-edit-products.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CcStepEditProductsComponent implements OnInit, OnDestroy, OnChanges {
  private static nextId = 0;
  protected readonly componentId = `cc-step-edit-products-${CcStepEditProductsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @Input() orderData: Partial<RegularOrderDto> | null = null;
  @Input() orderItems: OrderItemDto[] = [];
  @Input() isReadOnly = false;
  @Output() itemAdded = new EventEmitter<CreateOrderItemDto>();
  @Output() itemDeleted = new EventEmitter<number>();
  @Output() itemUpdated = new EventEmitter<{ itemNo: number; dto: UpdateOrderItemRequestDto }>();
  @Output() itemCanceled = new EventEmitter<number>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(RegularOrderApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  newItemForm!: FormGroup;
  saving = signal(false);
  showNewRow = signal(false);
  itemComments = signal<string[]>([]);

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

  private updateSubjects = new Map<string, Subject<UpdateOrderItemRequestDto>>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orderItems'] && this.orderItems) {
      this.itemComments.set(this.orderItems.map(item => item.noteId ? '__has_note__' : ''));
    }
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
    this.updateSubjects.forEach(s => s.complete());
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
    this.apiService.getProductTypesLookup().pipe(
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

      this.apiService.getTiersLookup(productType).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(tiers => {
        this.tiers.set(tiers);
        this.filteredTiers.set(tiers);
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
    'SH': 'Shipped',
    'HO': 'Hold',
    'AL': 'Allocated',
    'PK': 'Packed',
    'CL': 'Closed',
    'BO': 'Back Ordered',
    'UF': 'Unfilled',
    'DL': 'Delivered',
    'SY': 'System Canceled'
  };

  getItemStatus(item: OrderItemDto): string {
    const code = item.itemStatus || 'OR';
    return CcStepEditProductsComponent.STATUS_LABELS[code] ?? code;
  }

  getStatusClass(item: OrderItemDto): string {
    const code = item.itemStatus || 'OR';
    return `status-${code.toLowerCase()}`;
  }

  getItemBloodTypeDisplay(item: OrderItemDto): string {
    if (!item.bloodType) return '--';
    return item.bloodTypeDesc || item.bloodType;
  }

  getSubOkDisplay(subOk?: string): string {
    if (subOk === 'Y') return 'Yes';
    if (subOk === 'N') return 'No';
    return '--';
  }

  isItemEditable(item: OrderItemDto): boolean {
    const code = item.itemStatus || 'OR';
    return code !== 'CA' && code !== 'SH' && code !== 'CL' && code !== 'SY' && code !== 'DL';
  }

  isItemFullyEditable(item: OrderItemDto): boolean {
    const code = item.itemStatus || 'OR';
    return (code === 'OR' || !code) && item.allocatedQty === 0;
  }

  isQtyOnlyEditable(item: OrderItemDto): boolean {
    return this.isItemEditable(item) && !this.isItemFullyEditable(item);
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

    const newItem: CreateOrderItemDto = {
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
    this.itemComments.update(c => [...c, '']);
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

  onProductTypeChange(item: OrderItemDto, value: string): void {
    this.itemUpdated.emit({
      itemNo: item.itemNo,
      dto: { productType: value }
    });

    if (value) {
      this.apiService.getBloodTypesLookup(value).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(bloodTypes => {
        this.bloodTypes.set(bloodTypes);
        this.filteredBloodTypes.set(bloodTypes);
        this.cdr.markForCheck();
      });

      this.apiService.getTiersLookup(value).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(tiers => {
        this.tiers.set(tiers);
        this.filteredTiers.set(tiers);
        this.cdr.markForCheck();
      });
    }
  }

  onBloodTypeChange(item: OrderItemDto, value: string): void {
    const selectedBt = this.bloodTypes().find(bt => bt.code === value);
    this.itemUpdated.emit({
      itemNo: item.itemNo,
      dto: { bloodType: value, bloodTypeDesc: selectedBt?.description }
    });
  }

  onFieldChange(item: OrderItemDto, field: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQty = parseInt(input.value, 10);
    if (isNaN(newQty) || newQty < 1) return;

    this.emitDebouncedUpdate(item.itemNo, { requiredQty: newQty });
  }

  onSubOkChange(item: OrderItemDto, value: string): void {
    this.itemUpdated.emit({
      itemNo: item.itemNo,
      dto: { subOk: value || undefined }
    });
  }

  onAttribGroupChange(item: OrderItemDto, value: string): void {
    this.itemUpdated.emit({
      itemNo: item.itemNo,
      dto: { attribGroup: value || undefined, attribCode: undefined }
    });

    if (value) {
      this.apiService.getAttributeCodesLookup(value).pipe(
        takeUntil(this.destroy$),
        catchError(() => of([]))
      ).subscribe(codes => {
        this.attributeCodes.set(codes);
        this.filteredAttributeCodes.set(codes);
        this.cdr.markForCheck();
      });
    }
  }

  onAttribCodeChange(item: OrderItemDto, value: string): void {
    this.itemUpdated.emit({
      itemNo: item.itemNo,
      dto: { attribCode: value || undefined }
    });
  }

  private emitDebouncedUpdate(itemNo: number, dto: UpdateOrderItemRequestDto): void {
    const key = `${itemNo}`;
    if (!this.updateSubjects.has(key)) {
      const subject = new Subject<UpdateOrderItemRequestDto>();
      this.updateSubjects.set(key, subject);
      subject.pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      ).subscribe(updateDto => {
        this.itemUpdated.emit({ itemNo, dto: updateDto });
      });
    }
    this.updateSubjects.get(key)!.next(dto);
  }

  onCancelItem(item: OrderItemDto): void {
    const dialogRef = this.dialog.open(ConfirmCancellationDialogComponent, {
      width: '420px',
      disableClose: true
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

  onItemComment(index: number): void {
    if (index < 0) return;
    const item = this.orderItems[index];
    if (!item || !this.orderData?.orderNo) return;

    const orderNo = this.orderData.orderNo;
    const itemNo = item.itemNo;

    this.apiService.getItemNotes(orderNo, itemNo).pipe(
      takeUntil(this.destroy$),
      catchError(() => of(null))
    ).subscribe(noteData => {
      const currentNote = noteData?.note ?? '';

      const dialogRef = this.dialog.open(EnterCommentsDialogComponent, {
        position: { right: '0' },
        width: '500px',
        height: '100vh',
        panelClass: 'right-panel-dialog',
        data: { notes: currentNote }
      });

      dialogRef.afterClosed().pipe(
        takeUntil(this.destroy$)
      ).subscribe(result => {
        if (result !== null && result !== undefined) {
          this.apiService.saveItemNotes(orderNo, itemNo, result).pipe(
            takeUntil(this.destroy$),
            catchError(() => {
              this.snackbarService.showError('Failed to save item comment');
              return of(null);
            })
          ).subscribe(response => {
            if (response !== null) {
              this.itemComments.update(comments => {
                const updated = [...comments];
                while (updated.length <= index) updated.push('');
                updated[index] = result || '';
                return updated;
              });
              this.snackbarService.showSuccess('Item comment saved successfully');
              this.cdr.markForCheck();
            }
          });
        }
      });
    });
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
