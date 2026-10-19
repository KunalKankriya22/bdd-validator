import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { forkJoin, catchError, of, Subject, takeUntil, debounceTime } from 'rxjs';
import { LookupItem } from '../../models/regular-order.model';
import { RegularOrderApiService } from '../../services/regular-order-api.service';

export interface InventoryDialogData {
  productType?: string;
  products?: LookupItem[];
  apiService?: RegularOrderApiService;
}

@Component({
  selector: 'app-inventory-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './inventory-dialog.html',
  styleUrls: ['./inventory-dialog.scss']
})
export class InventoryDialogComponent implements OnDestroy {
  readonly data = inject<InventoryDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<InventoryDialogComponent>);
  private readonly destroy$ = new Subject<void>();

  productControl = new FormControl<string>(this.data.productType || '');
  bloodTypeControl = new FormControl<string>('');
  productSearchCtrl = new FormControl('');
  bloodTypeSearchCtrl = new FormControl('');

  filteredProducts = signal<LookupItem[]>(this.data.products || []);
  bloodTypes = signal<LookupItem[]>([]);
  filteredBloodTypes = signal<LookupItem[]>([]);
  inventoryTiers = signal<any[]>([]);
  loading = signal(false);
  productName = signal('');
  abORh = signal('');
  optimal = signal<number | null>(null);
  minimal = signal<number | null>(null);

  private get apiService(): RegularOrderApiService | undefined { return this.data.apiService; }

  constructor() {
    this.productSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(term => {
      const search = (term || '').toLowerCase();
      this.filteredProducts.set(
        (this.data.products || []).filter(p => (p.code || '').toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search))
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get totalStock(): number { return this.inventoryTiers().reduce((sum, t) => sum + (t.inStock ?? 0), 0); }
  get totalOrder(): number { return this.inventoryTiers().reduce((sum, t) => sum + (t.onOrder ?? 0), 0); }
  get totalAlloc(): number { return this.inventoryTiers().reduce((sum, t) => sum + (t.allocated ?? 0), 0); }
  get totalPack(): number { return this.inventoryTiers().reduce((sum, t) => sum + (t.packed ?? 0), 0); }
  get totalAvail(): number { return this.inventoryTiers().reduce((sum, t) => sum + ((t.inStock ?? 0) - (t.onOrder ?? 0)), 0); }

  onProductChange(productType: string): void {
    this.bloodTypes.set([]);
    this.bloodTypeControl.setValue('');
    this.inventoryTiers.set([]);
    this.minimal.set(null);
    this.optimal.set(null);

    if (!productType || !this.apiService) return;

    this.apiService.getBloodTypesLookup(productType).pipe(
      catchError(() => of([]))
    ).subscribe(types => {
      this.bloodTypes.set(types);
      this.filteredBloodTypes.set(types);
      const product = this.data.products?.find(p => p.code === productType);
      this.productName.set(product?.description ?? productType);
    });
  }

  onRetrieve(): void {
    const productType = this.productControl.value;
    const bloodType = this.bloodTypeControl.value;
    if (!productType || !bloodType || !this.apiService) return;

    this.loading.set(true);
    this.abORh.set(bloodType);

    forkJoin({
      summary: this.apiService.getInventorySummary(productType, bloodType).pipe(catchError(() => of(null))),
      tiers: this.apiService.getInventoryTiers(productType, bloodType).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ summary, tiers }) => {
        if (summary) {
          this.minimal.set(summary.minimal ?? 0);
          this.optimal.set(summary.optimal ?? 0);
        }
        this.inventoryTiers.set(tiers ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onExit(): void {
    this.dialogRef.close();
  }
}
