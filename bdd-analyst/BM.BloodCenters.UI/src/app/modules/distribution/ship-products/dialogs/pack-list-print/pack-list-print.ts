import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { ShipProductsService } from '../../services/ship-products.service';
import { LovOption } from '../../models/ship-products.model';

export interface PackListPrintDialogData {
  shipmentNo: string;
}

/**
 * Pack List Print Dialog
 * Confirmation dialog for printing pack list and finalizing shipment
 */
@Component({
  selector: 'app-pack-list-print-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './pack-list-print.html',
  styleUrls: ['./pack-list-print.scss']
})
export class PackListPrintDialog implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `pack-list-print-${PackListPrintDialog.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly shipProductsService = inject(ShipProductsService);
  private readonly dialogRef = inject(MatDialogRef<PackListPrintDialog>);

  protected readonly printerOptions = signal<LovOption[]>([]);
  protected readonly loadingOptions = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  printForm!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PackListPrintDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPrinterOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.printForm = this.fb.group({
      packListPrinterId: ['', Validators.required]
    });
  }

  private loadPrinterOptions(): void {
    this.loadingOptions.set(true);

    this.shipProductsService.getPackListPrinterOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.printerOptions.set(options);
          if (options.length > 0) {
            this.printForm.patchValue({ packListPrinterId: options[0].value });
          }
          this.loadingOptions.set(false);
        },
        error: (err) => {
          console.error('Failed to load printer options', err);
          this.loadingOptions.set(false);
        }
      });
  }

  onYesShip(): void {
    this.submitted.set(true);

    if (this.printForm.invalid) {
      return;
    }

    this.dialogRef.close({
      confirmed: true,
      packListPrinterId: this.printForm.get('packListPrinterId')?.value,
    });
  }

  onNo(): void {
    this.dialogRef.close({ confirmed: false });
  }

  get f() {
    return this.printForm.controls;
  }
}
