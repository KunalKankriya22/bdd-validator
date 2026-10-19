import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';

import { PackodApiService } from './services/packod-api.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { HeaderService } from '../../../shared/services/header.service';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '../../../shared/components/unit-id-field/unit-id-field.component';
import {
  ConsigneeDropdownDto,
  DiscardProductDto,
  PackProductRequestDto,
  OrderLookupModel,
  OpenBoxLookupModel,
  ProductCodeLookupModel,
  AliquotLookupModel,
  BloodTypeLookupModel,
  DiscardProductsParamsDto
} from './models';
import { BoxContentsDialogComponent, BoxContentsDialogData } from './dialogs/box-contents-dialog/box-contents-dialog.component';
import { CloseBoxConfirmationDialogComponent, CloseBoxConfirmationDialogData, CloseBoxConfirmationDialogResult } from './dialogs/close-box-confirmation-dialog/close-box-confirmation-dialog.component';
import { CreateNewBoxDialogComponent, CreateNewBoxDialogData, CreateNewBoxDialogResult } from './dialogs/create-new-box-dialog/create-new-box-dialog.component';

interface ProductTypeLookupModel {
  productType: string;
  description: string;
}

@Component({
  selector: 'app-packod',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    UnitIdFieldComponent,
    NgxMatSelectSearchModule
  ],
  templateUrl: './packod.component.html',
  styleUrls: ['./packod.component.scss']
})
export class PackodComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `packod-${PackodComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly packodApiService = inject(PackodApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Default code scheme — ISBT per Figma (no UI toggle)
  private readonly codeScheme = 'I';

  // Lookup data
  protected readonly consignees = signal<ConsigneeDropdownDto[]>([]);
  protected readonly selectedConsignee = signal<ConsigneeDropdownDto | null>(null);
  protected readonly orders = signal<OrderLookupModel[]>([]);
  protected readonly productTypes = signal<ProductTypeLookupModel[]>([]);
  protected readonly openBoxes = signal<OpenBoxLookupModel[]>([]);
  protected readonly selectedProductTypeDesc = signal<string>('');

  // Address auto-populated from consignee
  protected readonly address = signal<string>('');
  // Pick Slip ID set from pack response (when available)
  protected readonly pickSlipId = signal<string>('-');

  // Validated unit ID from UnitIdFieldComponent
  protected readonly currentUnitId = signal<string | null>(null);

  // Scan-step cascading LOVs
  protected readonly productCodes = signal<ProductCodeLookupModel[]>([]);
  protected readonly filteredProductCodes = signal<ProductCodeLookupModel[]>([]);
  protected readonly aliquots = signal<AliquotLookupModel[]>([]);
  protected readonly bloodTypes = signal<BloodTypeLookupModel[]>([]);

  // Product code search control for ngx-mat-select-search
  readonly productSearchControl = new FormControl<string>('');

  // Exp date/time display in scan row (resolved from discard products list)
  protected readonly scanExpDate = signal<string>('');
  protected readonly scanExpTime = signal<string>('');

  // Grid data (single discard products grid per Figma)
  protected readonly discardProducts = signal<DiscardProductDto[]>([]);
  protected readonly totalDiscardProducts = signal<number>(0);

  // Loading states
  protected readonly loadingConsignees = signal<boolean>(false);
  protected readonly loadingOrders = signal<boolean>(false);
  protected readonly loadingProductTypes = signal<boolean>(false);
  protected readonly loadingBoxes = signal<boolean>(false);
  protected readonly loadingDiscardProducts = signal<boolean>(false);
  protected readonly loadingProductCodes = signal<boolean>(false);
  protected readonly loadingAliquots = signal<boolean>(false);
  protected readonly loadingBloodTypes = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);
  protected readonly packing = signal<boolean>(false);

  // Pagination
  protected readonly pageSize = signal<number>(10);
  protected readonly pageIndex = signal<number>(0);
  protected readonly pageSizeOptions = [10, 25, 50, 100];

  // Computed
  protected readonly hasConsignee = computed(() => !!this.selectedConsignee());
  protected readonly hasBox = computed(() => !!this.headerForm?.get('boxId')?.value);
  protected readonly unitIdDisabled = computed(() => !this.hasConsignee());
  protected readonly canSave = computed(() =>
    this.hasConsignee() &&
    !!this.currentUnitId() &&
    !this.packing() &&
    !this.loadingProductCodes() &&
    !!this.scanForm?.get('bloodType')?.value
  );

  // Grid columns per Figma: Unit ID | Product Code | Product Type | Ordered ABO/Rh | Expiry Date and Time | Box ID
  readonly gridColumns: string[] = ['unitId', 'productCode', 'productType', 'aboDesc', 'expDate', 'boxId'];

  headerForm!: FormGroup;
  scanForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadConsignees();
    this.subscribeToFormChanges();
    this.setupProductSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.headerForm = this.fb.group({
      consigneeId: ['', Validators.required],
      orderNo: [{ value: '', disabled: true }],
      productType: [{ value: '', disabled: true }],
      boxId: [{ value: '', disabled: true }],
      pickSlipId: [{ value: '', disabled: true }]
    });

    this.scanForm = this.fb.group({
      productCode: [{ value: '', disabled: true }],
      aliquot: [{ value: '', disabled: true }],
      bloodType: [{ value: '', disabled: true }]
    });
  }

  private enableConsigneeDependentFields(): void {
    this.headerForm.get('orderNo')?.enable();
    this.headerForm.get('productType')?.enable();
    this.headerForm.get('boxId')?.enable();
    // UnitIdFieldComponent is controlled via [disabled] binding on unitIdDisabled()
  }

  private disableConsigneeDependentFields(): void {
    this.headerForm.get('orderNo')?.disable();
    this.headerForm.get('productType')?.disable();
    this.headerForm.get('boxId')?.disable();
    this.scanForm.get('productCode')?.disable();
    this.scanForm.get('aliquot')?.disable();
    this.scanForm.get('bloodType')?.disable();
  }

  private setupProductSearch(): void {
    this.productSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const t = (term || '').toLowerCase().trim();
        this.filteredProductCodes.set(
          t
            ? this.productCodes().filter(pc =>
                pc.productCode.toLowerCase().includes(t) ||
                pc.shortName?.toLowerCase().includes(t)
              )
            : this.productCodes()
        );
      });
  }

  private subscribeToFormChanges(): void {
    this.headerForm.get('consigneeId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(consigneeId => {
        const consignee = this.consignees().find(c => c.consigneeId === consigneeId) || null;
        this.selectedConsignee.set(consignee);
        this.address.set(consignee?.address || '');
        if (consignee) {
          this.onConsigneeChange(consignee);
        } else {
          this.resetDependentFields();
        }
      });

    this.headerForm.get('productType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(productType => {
        const found = this.productTypes().find(pt => pt.productType === productType);
        this.selectedProductTypeDesc.set(found?.description || '');
        this.loadOpenBoxes();
      });

    this.scanForm.get('productCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(productCode => {
        this.scanForm.patchValue({ aliquot: '', bloodType: '' }, { emitEvent: false });
        this.aliquots.set([]);
        this.bloodTypes.set([]);
        this.scanExpDate.set('');
        this.scanExpTime.set('');
        if (productCode) {
          const unitId = this.currentUnitId();
          if (unitId) {
            this.resolveExpDate(unitId, productCode);
            this.loadAliquots(unitId, productCode);
            this.loadBloodTypes(unitId, productCode);
          }
        }
      });
  }

  private loadConsignees(): void {
    this.loadingConsignees.set(true);
    this.packodApiService.getConsignees()
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingConsignees.set(false)))
      .subscribe({
        next: data => this.consignees.set(data),
        error: err => this.snackbarService.showError('Failed to load consignees: ' + (err.message || 'Unknown error'))
      });
  }

  private onConsigneeChange(consignee: ConsigneeDropdownDto): void {
    this.enableConsigneeDependentFields();
    this.headerForm.patchValue({ orderNo: '', productType: '', boxId: '' });
    this.selectedProductTypeDesc.set('');
    this.orders.set([]);
    this.productTypes.set([]);
    this.openBoxes.set([]);
    this.pickSlipId.set('-');
    this.resetScanStep();

    this.loadOrders(consignee.customerId, consignee.consigneeId);
    this.loadProductTypes(consignee.customerId, consignee.consigneeId);
    this.loadOpenBoxes();
    this.loadDiscardProducts();
  }

  private resetDependentFields(): void {
    this.disableConsigneeDependentFields();
    this.headerForm.patchValue({ orderNo: '', productType: '', boxId: '' });
    this.address.set('');
    this.selectedProductTypeDesc.set('');
    this.orders.set([]);
    this.productTypes.set([]);
    this.openBoxes.set([]);
    this.discardProducts.set([]);
    this.pickSlipId.set('-');
    this.resetScanStep();
  }

  private resetScanStep(): void {
    this.unitIdField?.clear();
    this.currentUnitId.set(null);
    this.scanForm.patchValue({ productCode: '', aliquot: '', bloodType: '' });
    this.scanForm.get('productCode')?.disable();
    this.scanForm.get('aliquot')?.disable();
    this.scanForm.get('bloodType')?.disable();
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.aliquots.set([]);
    this.bloodTypes.set([]);
    this.scanExpDate.set('');
    this.scanExpTime.set('');
  }

  private loadOrders(customerId: string, consigneeId: string): void {
    this.loadingOrders.set(true);
    this.packodApiService.getOrders(customerId, consigneeId)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingOrders.set(false)))
      .subscribe({
        next: data => this.orders.set(data),
        error: err => this.snackbarService.showError('Failed to load orders: ' + (err.message || 'Unknown error'))
      });
  }

  private loadProductTypes(customerId: string, consigneeId: string): void {
    this.loadingProductTypes.set(true);
    this.packodApiService.getProductTypes(customerId, consigneeId)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingProductTypes.set(false)))
      .subscribe({
        next: data => this.productTypes.set(data),
        error: err => this.snackbarService.showError('Failed to load product types: ' + (err.message || 'Unknown error'))
      });
  }

  private loadOpenBoxes(): void {
    const consigneeId = this.headerForm.get('consigneeId')?.value;
    if (!consigneeId) return;
    const productType = this.headerForm.get('productType')?.value || undefined;

    this.loadingBoxes.set(true);
    this.packodApiService.getOpenBoxes(consigneeId, productType)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingBoxes.set(false)))
      .subscribe({
        next: data => this.openBoxes.set(data),
        error: err => this.snackbarService.showError('Failed to load open boxes: ' + (err.message || 'Unknown error'))
      });
  }

  private loadDiscardProducts(): void {
    const consignee = this.selectedConsignee();
    if (!consignee) return;

    const params: DiscardProductsParamsDto = {
      consigneeId: consignee.consigneeId,
      customerId: consignee.customerId,
      productType: this.headerForm.get('productType')?.value || null
    };

    this.loadingDiscardProducts.set(true);
    this.packodApiService.getDiscardProducts(this.pageSize(), this.pageIndex() * this.pageSize(), params)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingDiscardProducts.set(false)))
      .subscribe({
        next: ({ data, totalCount }) => {
          this.discardProducts.set(data);
          this.totalDiscardProducts.set(totalCount);
        },
        error: err => this.snackbarService.showError('Failed to load discard products: ' + (err.message || 'Unknown error'))
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.loadDiscardProducts();
  }

  // Called by UnitIdFieldComponent after format validation passes
  onPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    if (!unitId || !this.hasConsignee()) {
      event.reject('No consignee selected');
      return;
    }

    const consignee = this.selectedConsignee()!;
    this.currentUnitId.set(unitId);

    this.scanForm.patchValue({ productCode: '', aliquot: '', bloodType: '' }, { emitEvent: false });
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.aliquots.set([]);
    this.bloodTypes.set([]);
    this.scanExpDate.set('');
    this.scanExpTime.set('');

    this.loadingProductCodes.set(true);
    this.packodApiService.getProductCodes(unitId, consignee.customerId, consignee.consigneeId, this.codeScheme)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingProductCodes.set(false)))
      .subscribe({
        next: data => {
          event.confirm();
          this.productCodes.set(data);
          this.filteredProductCodes.set(data);
          this.scanForm.get('productCode')?.enable();
          if (data.length === 1) {
            this.scanForm.patchValue({ productCode: data[0].productCode });
          }
        },
        error: err => {
          event.reject(err.error?.message || err.message || 'Invalid unit ID');
          this.currentUnitId.set(null);
        }
      });
  }

  // Called when UnitIdFieldComponent is cleared by the user
  onUnitIdCleared(): void {
    this.currentUnitId.set(null);
    this.scanForm.patchValue({ productCode: '', aliquot: '', bloodType: '' }, { emitEvent: false });
    this.scanForm.get('productCode')?.disable();
    this.scanForm.get('aliquot')?.disable();
    this.scanForm.get('bloodType')?.disable();
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.aliquots.set([]);
    this.bloodTypes.set([]);
    this.scanExpDate.set('');
    this.scanExpTime.set('');
  }

  private resolveExpDate(unitId: string, productCode: string): void {
    const product = this.discardProducts().find(
      p => p.unitId === unitId && p.productCode === productCode
    );
    if (product?.expDate) {
      const d = new Date(product.expDate);
      this.scanExpDate.set(this.formatDate(d));
      this.scanExpTime.set(this.formatTime(d));
    }
  }

  private loadAliquots(unitId: string, productCode: string): void {
    this.loadingAliquots.set(true);
    this.packodApiService.getAliquots(unitId, productCode)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingAliquots.set(false)))
      .subscribe({
        next: data => {
          this.aliquots.set(data);
          this.scanForm.get('aliquot')?.enable();
          if (data.length >= 1) {
            this.scanForm.patchValue({ aliquot: data[0].aliquot }, { emitEvent: false });
          }
        },
        error: err => this.snackbarService.showError('Failed to load aliquots: ' + (err.message || 'Unknown error'))
      });
  }

  private loadBloodTypes(unitId: string, productCode: string): void {
    this.loadingBloodTypes.set(true);
    this.packodApiService.getBloodTypes(unitId, productCode, this.codeScheme)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingBloodTypes.set(false)))
      .subscribe({
        next: data => {
          this.bloodTypes.set(data);
          this.scanForm.get('bloodType')?.enable();
          if (data.length === 1) {
            this.scanForm.patchValue({ bloodType: data[0].aboDesc }, { emitEvent: false });
          }
        },
        error: err => this.snackbarService.showError('Failed to load blood types: ' + (err.message || 'Unknown error'))
      });
  }

  onSave(): void {
    if (!this.canSave()) return;

    const consignee = this.selectedConsignee()!;
    const unitId = this.currentUnitId()!;
    const matchedProduct = this.discardProducts().find(
      p => p.unitId === unitId && p.productCode === this.scanForm.get('productCode')?.value
    );

    const request: PackProductRequestDto = {
      consigneeId: consignee.consigneeId,
      customerId: consignee.customerId,
      orderNo: this.headerForm.get('orderNo')?.value || null,
      productType: this.headerForm.get('productType')?.value || null,
      boxId: this.headerForm.get('boxId')?.value || null,
      unitId,
      productCode: this.scanForm.get('productCode')?.value,
      aliquot: this.scanForm.get('aliquot')?.value,
      bloodType: this.scanForm.get('bloodType')?.value,
      expDate: matchedProduct?.expDate ?? new Date().toISOString(),
      collDate: matchedProduct?.collDate ?? null,
      codeScheme: this.codeScheme
    };

    this.packing.set(true);
    this.packodApiService.packProduct(request)
      .pipe(takeUntil(this.destroy$), finalize(() => this.packing.set(false)))
      .subscribe({
        next: packed => {
          if (packed.boxId && !this.headerForm.get('boxId')?.value) {
            this.headerForm.patchValue({ boxId: packed.boxId });
            this.loadOpenBoxes();
          }
          this.resetScanStep();
          this.snackbarService.showSuccess(`Unit ${packed.unitId} packed successfully`);
          this.loadDiscardProducts();
        },
        error: err => {
          this.snackbarService.showError(err.error?.message || err.message || 'Failed to pack product');
        }
      });
  }

  onClearAll(): void {
    this.headerForm.patchValue({ boxId: '' });
    this.pickSlipId.set('-');
    this.resetScanStep();
    this.loadDiscardProducts();
  }

  onClearScan(): void {
    this.resetScanStep();
  }

  onViewBoxContents(): void {
    const boxId = this.headerForm.get('boxId')?.value;
    if (!boxId) return;

    this.loading.set(true);
    this.packodApiService.getBoxContents(boxId)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading.set(false)))
      .subscribe({
        next: items => {
          const dialogData: BoxContentsDialogData = { boxId, boxContents: items };
          this.dialog.open(BoxContentsDialogComponent, {
            width: '900px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            data: dialogData,
            autoFocus: true,
            restoreFocus: true
          });
        },
        error: err => this.snackbarService.showError('Failed to load box contents: ' + (err.message || 'Unknown error'))
      });
  }

  onCloseBox(): void {
    const boxId = this.headerForm.get('boxId')?.value;
    if (!boxId) return;

    const dialogData: CloseBoxConfirmationDialogData = { boxId, productCount: 0 };
    const dialogRef = this.dialog.open(CloseBoxConfirmationDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: dialogData,
      autoFocus: true,
      restoreFocus: true
    });

    dialogRef.afterClosed().subscribe((result: CloseBoxConfirmationDialogResult | undefined) => {
      if (!result?.confirmed || !result.closeCurrentBox) return;

      this.loading.set(true);
      this.packodApiService.closeBox({ boxId })
        .pipe(takeUntil(this.destroy$), finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.snackbarService.showSuccess(`Box ${boxId} closed successfully`);
            this.headerForm.patchValue({ boxId: '' });
            this.pickSlipId.set('-');
            this.loadOpenBoxes();
            this.loadDiscardProducts();
          },
          error: err => this.snackbarService.showError(err.error?.message || err.message || 'Failed to close box')
        });
    });
  }

  onCreateNewBox(): void {
    const consignee = this.selectedConsignee();
    if (!consignee) return;

    const currentBoxId = this.headerForm.get('boxId')?.value || null;

    const dialogData: CreateNewBoxDialogData = { currentBoxId };
    const dialogRef = this.dialog.open(CreateNewBoxDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: dialogData,
      autoFocus: true,
      restoreFocus: true,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result: CreateNewBoxDialogResult | undefined) => {
      if (!result?.confirmed) return;

      this.loading.set(true);
      this.packodApiService.createNewBox({
        currentBoxId,
        closeCurrentBox: result.closeCurrentBox,
        allProductsProperlyPacked: result.allProductsProperlyPacked,
        consigneeId: consignee.consigneeId
      })
        .pipe(takeUntil(this.destroy$), finalize(() => this.loading.set(false)))
        .subscribe({
          next: res => {
            this.snackbarService.showSuccess(res.message || 'New box created');
            this.headerForm.patchValue({ boxId: '' });
            this.pickSlipId.set('-');
            this.loadOpenBoxes();
            this.loadDiscardProducts();
          },
          error: err => this.snackbarService.showError(err.error?.message || err.message || 'Failed to create new box')
        });
    });
  }

  formatDate(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase().replace(/ /g, '-');
  }

  formatTime(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  formatDateTime(value: string | Date | null | undefined): string {
    const d = this.formatDate(value);
    const t = this.formatTime(value);
    return d && t ? `${d} ${t}` : d || t;
  }

  get hf() { return this.headerForm.controls; }
  get sf() { return this.scanForm.controls; }
}
