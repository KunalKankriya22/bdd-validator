import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { OfflineProductShipmentApiService } from '../../services/offline-product-shipment-api.service';
import { PrinterLookupDto, PackListPrintConfirmationResult } from '../../models/offline-product-shipment.model';

export interface PackListPrintConfirmationDialogData {
  shipmentNo: string;
}

@Component({
  selector: 'app-pack-list-print-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './pack-list-print-confirmation-dialog.html',
  styleUrl: './pack-list-print-confirmation-dialog.scss'
})
export class PackListPrintConfirmationDialog implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `pack-list-print-${PackListPrintConfirmationDialog.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(OfflineProductShipmentApiService);
  private readonly dialogRef = inject(MatDialogRef<PackListPrintConfirmationDialog>);
  readonly data: PackListPrintConfirmationDialogData = inject(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  protected readonly printers = signal<PrinterLookupDto[]>([]);
  protected readonly loadingPrinters = signal(true);
  protected printerSearchCtrl = new FormControl('');
  private printerSearchText = signal('');

  protected readonly filteredPrinters = signal<PrinterLookupDto[]>([]);
  printForm!: FormGroup;

  ngOnInit(): void {
    this.printForm = this.fb.group({
      packListPrinterId: ['', [Validators.required]]
    });

    this.loadPrinters();

    this.printerSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.printerSearchText.set(v || '');
      const s = (v || '').toLowerCase();
      const all = this.printers();
      this.filteredPrinters.set(!s ? all : all.filter(p => (p.code + ' ' + (p.codeDesc || '')).toLowerCase().includes(s)));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPrinters(): void {
    this.loadingPrinters.set(true);
    this.apiService.getPrinters().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.printers.set(data);
        this.filteredPrinters.set(data);
        this.loadingPrinters.set(false);
      },
      error: () => {
        this.loadingPrinters.set(false);
      }
    });
  }

  onYesPrint(): void {
    if (this.printForm.invalid) return;
    const result: PackListPrintConfirmationResult = {
      print: true,
      printerId: this.printForm.get('packListPrinterId')?.value
    };
    this.dialogRef.close(result);
  }

  onNo(): void {
    const result: PackListPrintConfirmationResult = { print: false };
    this.dialogRef.close(result);
  }
}
