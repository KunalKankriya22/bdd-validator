import { Component, Inject, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import {
  ShipmentChargesDialogData,
  ShipmentCharge,
  ChargeCodeLookup,
  CreateShipmentChargeRequestDto,
} from '../../models/ship-discard-salvage.model';
import { ShipDiscardSalvageApiService } from '../../services/ship-discard-salvage-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

@Component({
  selector: 'app-shipment-charges-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    DataTable,
  ],
  templateUrl: './shipment-charges-dialog.html',
  styleUrl: './shipment-charges-dialog.scss',
})
export class ShipmentChargesDialogComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialogRef = inject(MatDialogRef<ShipmentChargesDialogComponent>);
  private readonly apiService = inject(ShipDiscardSalvageApiService);
  private readonly destroy$ = new Subject<void>();

  protected readonly charges = signal<ShipmentCharge[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly availableCharges = signal<ChargeCodeLookup[]>([]);

  chargeForm!: FormGroup;

  protected readonly quantityOptions = Array.from({ length: 99 }, (_, i) => i + 1);

  protected tableConfig: DataTableConfig<ShipmentCharge> = {
    columns: [
      { key: 'chargeCode', header: 'Charge', sortable: true },
      { key: 'description', header: 'Description' },
      { key: 'quantity', header: 'Quantity' },
      { key: 'price', header: 'Price', valueFormatter: (value) => value != null ? Number(value).toFixed(2) : '' },
      { key: 'amount', header: 'Amount', valueFormatter: (value) => value != null ? Number(value).toFixed(2) : '' },
      { key: 'crDbDesc', header: 'Credit/Debit' },
    ],
    rowActions: [
      {
        icon: 'delete',
        action: 'delete',
        ariaLabel: 'Remove charge',
        color: 'warn',
        visible: (row) => row.deletableFlag !== 'N',
      },
    ],
    sortConfig: { column: 'chargeCode', direction: 'D' },
    emptyMessage: 'No charges added',
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: ShipmentChargesDialogData) {
    this.initializeForm();
    this.loadLookupData();
    this.loadCharges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.chargeForm = this.fb.group({
      chargeCode: ['', Validators.required],
      description: [{ value: '', disabled: true }],
      quantity: [1, Validators.required],
      price: [{ value: '', disabled: true }],
      creditDebit: [{ value: '', disabled: true }],
    });

    this.chargeForm.get('chargeCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => {
        const charge = this.availableCharges().find(c => c.chargeCode === code);
        this.chargeForm.patchValue({
          description: charge?.chargeCodeDesc || '',
          price: charge?.charge ? charge.charge.toFixed(2) : '',
          creditDebit: charge?.crDbDesc || '',
        }, { emitEvent: false });
      });
  }

  private loadLookupData(): void {
    this.apiService.getChargeCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.availableCharges.set(codes),
        error: () => this.snackbarService.showError('Failed to load charge codes'),
      });
  }

  private addDefaultCharges(codes: ChargeCodeLookup[]): void {
    const boxCount = this.data.boxCount || 0;
    if (boxCount === 0) return;

    const defaultCodes = codes.filter(c => c.shipFlag === 'B' || c.shipFlag === 'S');
    if (defaultCodes.length === 0) return;

    const newCharges: ShipmentCharge[] = [];

    for (const code of defaultCodes) {
      const count = code.shipFlag === 'B' ? boxCount : 1;
      for (let i = 0; i < count; i++) {
        newCharges.push({
          chargeCode: code.chargeCode,
          description: code.chargeCodeDesc || '',
          quantity: 1,
          price: code.charge ?? 0,
          amount: code.charge ?? 0,
          crDbInd: code.chargeCodeType || '',
          crDbDesc: code.crDbDesc || '',
          orderNo: '',
          shipmentNo: this.data.shipmentNo,
          deletableFlag: 'Y',
          isNew: true,
        });
      }
    }

    this.charges.update(existing => [...existing, ...newCharges]);
  }

  private loadCharges(): void {
    this.loading.set(true);

    this.apiService.getShipmentCharges(this.data.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (charges) => {
          this.charges.set(charges);
          this.loading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to load shipment charges');
          this.loading.set(false);
        },
      });
  }

  onAddCharge(): void {
    if (this.chargeForm.invalid) return;

    const chargeCode = this.chargeForm.get('chargeCode')?.value;
    const quantity = this.chargeForm.get('quantity')?.value || 1;
    const chargeInfo = this.availableCharges().find(c => c.chargeCode === chargeCode);

    const newCharge: ShipmentCharge = {
      chargeCode,
      description: chargeInfo?.chargeCodeDesc || '',
      quantity,
      price: chargeInfo?.charge ?? 0,
      amount: quantity * (chargeInfo?.charge ?? 0),
      crDbInd: chargeInfo?.chargeCodeType || '',
      crDbDesc: chargeInfo?.crDbDesc || '',
      orderNo: '',
      shipmentNo: this.data.shipmentNo,
      deletableFlag: 'Y',
      isNew: true,
    };

    this.charges.update(existing => [...existing, newCharge]);
    this.chargeForm.patchValue({ chargeCode: '', quantity: 1, description: '', price: '', creditDebit: '' });
  }

  onChargeSelected(): void {
    const chargeCode = this.chargeForm.get('chargeCode')?.value;
    if (!chargeCode) return;

    const chargeInfo = this.availableCharges().find(c => c.chargeCode === chargeCode);
    if (!chargeInfo) return;

    const quantity = this.chargeForm.get('quantity')?.value || 1;
    const newCharge: ShipmentCharge = {
      chargeCode,
      description: chargeInfo.chargeCodeDesc || '',
      quantity,
      price: chargeInfo.charge ?? 0,
      amount: quantity * (chargeInfo.charge ?? 0),
      crDbInd: chargeInfo.chargeCodeType || '',
      crDbDesc: chargeInfo.crDbDesc || '',
      orderNo: '',
      shipmentNo: this.data.shipmentNo,
      deletableFlag: 'Y',
      isNew: true,
    };

    this.charges.update(existing => [...existing, newCharge]);
    this.chargeForm.patchValue({ chargeCode: '', quantity: 1, description: '', price: '', creditDebit: '' });
  }

  onRowAction(event: TableRowActionEvent<ShipmentCharge>): void {
    if (event.action === 'delete') {
      this.onRemoveCharge(event.row);
    }
  }

  onRemoveCharge(charge: ShipmentCharge): void {
    if (charge.deletableFlag === 'N') {
      this.snackbarService.showError('This charge cannot be deleted');
      return;
    }

    if (charge.isNew) {
      this.charges.update(charges => {
        const idx = charges.indexOf(charge);
        return idx >= 0 ? charges.filter((_, i) => i !== idx) : charges;
      });
      return;
    }

    this.loading.set(true);
    this.apiService.deleteShipmentCharge(this.data.shipmentNo, charge.chargeCode, charge.orderNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.charges.update(charges =>
            charges.filter(c => !(c.chargeCode === charge.chargeCode && c.orderNo === charge.orderNo))
          );
          this.snackbarService.showSuccess('Charge removed successfully');
          this.loading.set(false);
        },
        error: () => {
          this.snackbarService.showError('Failed to remove charge');
          this.loading.set(false);
        },
      });
  }

  onSortChange(event: TableSortEvent): void {
    this.tableConfig = {
      ...this.tableConfig,
      sortConfig: { column: event.column, direction: event.direction },
    };
    this.charges.update(items => [...items].sort((a, b) => {
      const valA = String((a as any)[event.column] ?? '');
      const valB = String((b as any)[event.column] ?? '');
      const cmp = valA.localeCompare(valB);
      return event.direction === 'A' ? cmp : -cmp;
    }));
  }

  onClearAll(): void {
    const deletableCharges = this.charges().filter(c => c.deletableFlag !== 'N');
    if (deletableCharges.length === 0) {
      this.snackbarService.showError('No deletable charges to clear');
      return;
    }

    const persistedCharges = deletableCharges.filter(c => !c.isNew);
    const newCharges = deletableCharges.filter(c => c.isNew);

    this.charges.update(charges => charges.filter(c => !newCharges.includes(c)));

    if (persistedCharges.length === 0) {
      this.snackbarService.showSuccess('All deletable charges cleared');
      return;
    }

    this.loading.set(true);
    const deleteOps = persistedCharges.map(charge =>
      this.apiService.deleteShipmentCharge(this.data.shipmentNo, charge.chargeCode, charge.orderNo)
    );

    forkJoin(deleteOps)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadCharges();
          this.snackbarService.showSuccess('All deletable charges cleared');
        },
        error: () => {
          this.loadCharges();
          this.snackbarService.showError('Some charges could not be deleted');
        },
      });
  }

  onSaveAndPrint(): void {
    const newCharges = this.charges().filter(c => c.isNew);

    if (newCharges.length === 0 && !this.data.finalizeOnSave) {
      this.snackbarService.showSuccess('Charges saved successfully');
      this.dialogRef.close(true);
      return;
    }

    this.loading.set(true);

    const saveOps = newCharges.map(c =>
      this.apiService.addShipmentCharge(this.data.shipmentNo, {
        chargeCode: c.chargeCode,
        quantity: c.quantity,
      })
    );

    if (saveOps.length > 0) {
      forkJoin(saveOps)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            if (this.data.finalizeOnSave) {
              this.finalizeShipment();
            } else {
              this.loading.set(false);
              this.snackbarService.showSuccess('Charges saved successfully');
              this.dialogRef.close(true);
            }
          },
          error: (err) => {
            this.loading.set(false);
            this.snackbarService.showError(err.error?.message || 'Failed to save charges');
          },
        });
    } else if (this.data.finalizeOnSave) {
      this.finalizeShipment();
    }
  }

  private finalizeShipment(): void {
    this.apiService.completeShipment(this.data.shipmentNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Shipment completed and charges saved successfully');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err.error?.message || 'Failed to complete shipment');
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  get f() {
    return this.chargeForm.controls;
  }
}
