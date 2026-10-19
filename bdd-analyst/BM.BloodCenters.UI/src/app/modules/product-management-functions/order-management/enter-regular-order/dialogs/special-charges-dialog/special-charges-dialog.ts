import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { catchError, of, Subject, takeUntil, debounceTime } from 'rxjs';
import { RegularOrderApiService } from '../../services/regular-order-api.service';

export interface SpecialChargesDialogData {
  orderNo: string;
  charges: any[];
  apiService?: RegularOrderApiService;
}

@Component({
  selector: 'app-special-charges-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './special-charges-dialog.html',
  styleUrls: ['./special-charges-dialog.scss']
})
export class SpecialChargesDialogComponent implements OnInit, OnDestroy {
  readonly data = inject<SpecialChargesDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SpecialChargesDialogComponent>);
  private readonly fb = inject(FormBuilder);

  charges = signal<any[]>(this.data.charges || []);
  chargeCodes = signal<any[]>([]);
  filteredChargeCodes = signal<any[]>([]);
  chargeCodeSearchCtrl = new FormControl('');
  private readonly destroy$ = new Subject<void>();
  showNewRow = signal(true);
  saving = signal(false);
  hasChanges = signal(false);

  selectedDescription = signal('--');
  selectedCrDb = signal('--');

  chargeForm: FormGroup = this.fb.group({
    chargeCode: ['', [Validators.required]],
    quantity: [null],
    amount: [null, [Validators.min(0)]],
    discountPercent: [null, [Validators.min(0), Validators.max(100)]]
  });

  private get apiService(): RegularOrderApiService | undefined { return this.data.apiService; }

  ngOnInit(): void {
    this.apiService?.getChargeCodesLookup().pipe(
      catchError(() => of([]))
    ).subscribe(codes => {
      this.chargeCodes.set(codes);
      this.filteredChargeCodes.set(codes);
    });

    this.chargeCodeSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredChargeCodes.set(
        this.chargeCodes().filter(c => (c.code || '').toLowerCase().includes(search) || (c.description || '').toLowerCase().includes(search))
      );
    });

    this.chargeForm.get('quantity')!.valueChanges.subscribe(qty => {
      const code = this.chargeForm.get('chargeCode')?.value;
      const selected = this.chargeCodes().find(c => c.code === code);
      if (selected && qty) {
        const baseAmount = (selected.unitAmount ?? 0) * qty;
        const discount = this.chargeForm.get('discountPercent')?.value || 0;
        const discountedAmount = discount > 0 ? baseAmount * (1 - discount / 100) : baseAmount;
        this.chargeForm.patchValue({ amount: +discountedAmount.toFixed(2) }, { emitEvent: false });
      }
    });

    this.chargeForm.get('discountPercent')!.valueChanges.subscribe(discount => {
      const code = this.chargeForm.get('chargeCode')?.value;
      const qty = this.chargeForm.get('quantity')?.value;
      const selected = this.chargeCodes().find(c => c.code === code);
      if (selected && qty) {
        const baseAmount = (selected.unitAmount ?? 0) * qty;
        const pct = discount || 0;
        const discountedAmount = pct > 0 ? baseAmount * (1 - pct / 100) : baseAmount;
        this.chargeForm.patchValue({ amount: +discountedAmount.toFixed(2) }, { emitEvent: false });
      }
    });
  }

  onChargeCodeChange(): void {
    const code = this.chargeForm.get('chargeCode')?.value;
    const selected = this.chargeCodes().find(c => c.code === code);
    if (selected) {
      this.selectedDescription.set(selected.description || '--');
      const crDb = selected.crDbInd === 'CR' ? 'CR - Credit' : selected.crDbInd === 'DB' ? 'DB - Debit' : selected.crDbInd || '--';
      this.selectedCrDb.set(crDb);
      this.chargeForm.patchValue({
        quantity: 1,
        amount: selected.unitAmount ?? 0
      });
    } else {
      this.selectedDescription.set('--');
      this.selectedCrDb.set('--');
    }
  }

  onAddNewCharges(): void {
    const formValue = this.chargeForm.getRawValue();
    if (this.showNewRow() && formValue.chargeCode && this.apiService) {
      this.saving.set(true);
      const selected = this.chargeCodes().find(c => c.code === formValue.chargeCode);
      const qty = formValue.quantity || 1;
      const amount = formValue.amount ?? (selected?.unitAmount ?? 0) * qty;

      this.apiService.addOrderCharge(this.data.orderNo, {
        chargeCode: formValue.chargeCode,
        crDbInd: selected?.crDbInd || 'DB',
        quantity: qty,
        amount
      }).pipe(
        catchError(() => of(null))
      ).subscribe(result => {
        if (result?.data) {
          this.charges.set(result.data);
        } else if (selected) {
          this.charges.update(list => [...list, {
            chargeCode: formValue.chargeCode,
            chargeCodeDesc: selected.description,
            crDbInd: selected.crDbInd,
            quantity: formValue.quantity || 1,
            amount: formValue.amount ?? (selected.unitAmount ?? 0) * (formValue.quantity || 1)
          }]);
        }
        this.hasChanges.set(true);
        this.chargeForm.reset();
        this.selectedDescription.set('--');
        this.selectedCrDb.set('--');
        this.saving.set(false);
      });
    }
    this.showNewRow.set(true);
  }

  onDeleteCharge(chargeCode: string): void {
    if (!this.apiService) return;
    this.apiService.deleteOrderCharge(this.data.orderNo, chargeCode).pipe(
      catchError(() => of(false))
    ).subscribe(() => {
      this.charges.update(list => list.filter(c => c.chargeCode !== chargeCode));
      this.hasChanges.set(true);
    });
  }

  onSave(): void {
    this.dialogRef.close(this.charges());
  }

  onExit(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
