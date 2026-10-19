import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';

import { OfflineProductShipmentApiService } from '../../services/offline-product-shipment-api.service';
import {
  OfflineProductShipmentChargeDto,
  CreateOfflineProductShipmentChargeDto,
  ChargeCodeLookupDto,
  FinalizeShipmentResponseDto
} from '../../models/offline-product-shipment.model';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';

export interface ShipmentChargesDialogData {
  shipmentNo: string;
  orderNo: string;
  boxCount?: number;
  finalizeOnSave?: boolean;
  printerId?: string;
}

@Component({
  selector: 'app-shipment-charges-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable
  ],
  templateUrl: './shipment-charges-dialog.html',
  styleUrl: './shipment-charges-dialog.scss'
})
export class ShipmentChargesDialog implements OnInit, OnDestroy {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `shipment-charges-dialog-${ShipmentChargesDialog.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ShipmentChargesDialog>);
  protected readonly data = inject<ShipmentChargesDialogData>(MAT_DIALOG_DATA);
  private readonly apiService = inject(OfflineProductShipmentApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();

  // Signal-based state
  protected readonly charges = signal<OfflineProductShipmentChargeDto[]>([]);
  protected readonly chargeCodes = signal<ChargeCodeLookupDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);

  // Computed values
  protected readonly isEmpty = computed(() => this.charges().length === 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly shipmentNo = this.data.shipmentNo;
  protected readonly orderNo = this.data.orderNo;

  // Form
  form!: FormGroup;

  // Data table configuration
  protected tableConfig!: DataTableConfig<OfflineProductShipmentChargeDto>;

  ngOnInit(): void {
    this.initForm();
    this.initTableConfig();
    this.loadChargeCodes();
    this.loadCharges();

    // Load default charges if finalizing
    if (this.data.finalizeOnSave) {
      this.loadDefaultCharges();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the charge entry form
   */
  private initForm(): void {
    this.form = this.fb.group({
      chargeCode: [''],
      description: [{ value: '', disabled: true }],
      quantity: [1, [Validators.min(1), Validators.max(99)]],
      price: [{ value: '', disabled: true }],
      crDbInd: [{ value: '', disabled: true }]
    });

    // Watch for charge code selection to populate description, price, and C/D
    this.form.get('chargeCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(chargeCode => {
        if (chargeCode) {
          this.onChargeCodeChange(chargeCode);
        } else {
          this.clearChargeDetails();
        }
      });
  }

  /**
   * Initialize data table configuration for charges grid
   */
  private initTableConfig(): void {
    this.tableConfig = {
      columns: [
        {
          key: 'chargeCode',
          header: 'Charge',
          sortable: true,
          width: '15%'
        },
        {
          key: 'chargeCodeDesc',
          header: 'Description',
          sortable: false,
          width: '30%'
        },
        {
          key: 'quantity',
          header: 'Quantity',
          sortable: false,
          width: '15%'
        },
        {
          key: 'amount',
          header: 'Price',
          sortable: false,
          width: '15%',
          valueFormatter: (value: any) => value ? `$${Number(value).toFixed(2)}` : '$0.00'
        },
        {
          key: 'crDbDesc',
          header: 'Credit/Debit',
          sortable: false,
          width: '15%'
        }
      ],
      rowActions: [
        {
          icon: 'delete',
          label: 'Delete charge',
          color: 'default',
          action: 'delete'
        }
      ],
      showPagination: true,
      emptyMessage: 'No charges added'
    };
  }

  /**
   * Load available charge codes for dropdown
   */
  private loadChargeCodes(): void {
    this.apiService.getChargeCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.chargeCodes.set(codes),
        error: () => this.snackbarService.showError('Failed to load charge codes')
      });
  }

  /**
   * Load existing charges for this shipment/order
   */
  private loadCharges(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getCharges(100, 0, {
      shipmentNo: this.shipmentNo,
      orderNo: this.orderNo
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (charges) => {
          this.charges.set(charges);

          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load charges');
          this.snackbarService.showError('Failed to load shipment charges');
          this.loading.set(false);
        }
      });
  }

  /**
   * Load default charges when finalizing shipment
   */
  private loadDefaultCharges(): void {
    this.apiService.getDefaultCharges(this.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (defaultCharges) => {
          const markedCharges = defaultCharges.map(c => ({ ...c, isNew: true }));
          this.charges.update(existing => [...existing, ...markedCharges]);
        },
        error: () => {
          // Ignore error - default charges are optional
        }
      });
  }

  /**
   * Handle charge code selection - populate description, price, C/D
   */
  private onChargeCodeChange(chargeCode: string): void {
    const found = this.chargeCodes().find(c => c.chargeCode === chargeCode);
    if (found) {
      this.form.patchValue({
        description: found.chargeCodeDesc,
        price: found.charge ? `$${found.charge.toFixed(2)}` : '',
        crDbInd: found.crDbDesc || ''
      });
    }
  }

  onChargeSelected(): void {
    const chargeCode = this.form.get('chargeCode')?.value;
    if (!chargeCode) return;

    const found = this.chargeCodes().find(c => c.chargeCode === chargeCode);
    if (!found) return;

    const quantity = this.form.get('quantity')?.value || 1;
    const newCharge: OfflineProductShipmentChargeDto = {
      shipmentNo: this.shipmentNo,
      orderNo: this.orderNo,
      chargeCode: found.chargeCode,
      chargeCodeDesc: found.chargeCodeDesc || null,
      amount: (found.charge ?? 0) * quantity,
      crDbInd: found.chargeCodeType || null,
      crDbDesc: found.crDbDesc || null,
      chapterId: '',
      quantity
    };

    this.charges.update(existing => [...existing, newCharge]);
    this.form.patchValue({ chargeCode: '', quantity: 1, description: '', price: '', crDbInd: '' });
    this.submitted.set(false);
  }

  /**
   * Clear charge details when no charge code selected
   */
  private clearChargeDetails(): void {
    this.form.patchValue({
      description: '',
      price: '',
      crDbInd: ''
    });
  }

  /**
   * Get form controls for easy access
   */
  get f() {
    return this.form.controls;
  }

  /**
   * Add charge to the list (not saved to DB yet - just adds to local list)
   */
  onAddCharge(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    // Add charge to local list (will be saved on "SAVE AND PRINT")
    const selectedChargeCode = this.chargeCodes().find(c => c.chargeCode === this.form.get('chargeCode')?.value);
    const newCharge: OfflineProductShipmentChargeDto = {
      shipmentNo: this.shipmentNo,
      orderNo: this.orderNo,
      chargeCode: this.form.get('chargeCode')?.value,
      chargeCodeDesc: this.form.get('description')?.value,
      amount: selectedChargeCode?.charge ?? null,
      crDbInd: selectedChargeCode?.chargeCodeType || '',
      crDbDesc: this.form.get('crDbInd')?.value,
      chapterId: '',
      quantity: this.form.get('quantity')?.value
    };

    this.charges.update(charges => [...charges, newCharge]);


    // Reset form
    this.form.reset({ quantity: 1 });
    this.submitted.set(false);
  }

  /**
   * Delete charge from the list
   */
  onDeleteCharge(charge: OfflineProductShipmentChargeDto): void {
    // Remove from local list
    this.charges.update(charges => charges.filter(c =>
      !(c.shipmentNo === charge.shipmentNo &&
        c.orderNo === charge.orderNo &&
        c.chargeCode === charge.chargeCode)
    ));


    // If this was already persisted, call delete API
    // TODO: Determine if charge was already saved vs just added locally
    // this.apiService.deleteCharge(charge.shipmentNo, charge.orderNo)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: () => {
    //       this.snackbarService.showSuccess('Charge deleted successfully');
    //     },
    //     error: (err) => {
    //       this.snackbarService.showError('Failed to delete charge');
    //     }
    //   });
  }

  /**
   * CLEAR ALL button - remove all charges
   */
  onClearAll(): void {
    this.charges.set([]);

    this.form.reset({ quantity: 1 });
    this.submitted.set(false);
  }

  /**
   * SAVE AND PRINT button - save all charges and print pack list
   */
  onSaveAndPrint(): void {
    // Allow save with zero charges when finalizing
    if (this.charges().length === 0 && !this.data.finalizeOnSave) {
      this.snackbarService.showError('No charges to save');
      return;
    }

    this.loading.set(true);

    // Save each charge to the database (only new ones)
    const chargesToSave = this.charges().filter(c => c.isNew);
    const saveOperations = chargesToSave.map(charge => {
      const dto: CreateOfflineProductShipmentChargeDto = {
        shipmentNo: charge.shipmentNo,
        orderNo: charge.orderNo,
        chargeCode: charge.chargeCode || undefined,
        amount: charge.amount || undefined,
        quantity: charge.quantity || undefined,
        crDbInd: charge.crDbInd || undefined
      };
      return this.apiService.createCharge(dto);
    });

    const saveCharges$ = chargesToSave.length > 0
      ? forkJoin(saveOperations)
      : of([]);

    saveCharges$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // If finalizing, call finalize endpoint
          if (this.data.finalizeOnSave) {
            this.apiService.finalizeShipment(this.shipmentNo)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (result) => {
                  this.loading.set(false);
                  this.dialogRef.close({ saved: true, finalized: true });
                },
                error: () => {
                  this.snackbarService.showError('Failed to finalize shipment');
                  this.loading.set(false);
                }
              });
          } else {
            this.snackbarService.showSuccess(`Charges saved successfully. Shipment Number ${this.shipmentNo} pack list has been printed.`);
            this.loading.set(false);
            this.dialogRef.close({ saved: true });
          }
        },
        error: () => {
          this.snackbarService.showError('Failed to save charges');
          this.loading.set(false);
        }
      });
  }

  /**
   * Close dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }
}
