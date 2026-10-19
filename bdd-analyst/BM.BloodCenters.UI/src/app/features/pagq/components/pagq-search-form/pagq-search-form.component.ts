import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { HeaderService } from '@shared/services/header.service';
import { ProductsWithAntigensService } from '../../services/products-with-antigens.service';
import {
  ProductTypeOption,
  AboRhTypeOption,
  InventoryClassOption,
  AntigenGroupOption,
  WarehouseOption,
  ValidAntigenOption,
  ProductAntigenSearchRequest,
  AntigenCriteriaPair
} from '../../models/products-with-antigens.models';
import {
  AntigenFilterDialogComponent,
  AntigenFilterDialogData,
  AntigenFilterDialogResult
} from '../antigen-filter-dialog/antigen-filter-dialog.component';

@Component({
  selector: 'app-pagq-search-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './pagq-search-form.component.html',
  styleUrl: './pagq-search-form.component.scss'
})
export class PagqSearchFormComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `pagq-search-form-${PagqSearchFormComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductsWithAntigensService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);

  protected readonly productTypes = signal<ProductTypeOption[]>([]);
  protected readonly aboRhTypes = signal<AboRhTypeOption[]>([]);
  protected readonly inventoryClasses = signal<InventoryClassOption[]>([]);
  protected readonly antigenGroups = signal<AntigenGroupOption[]>([]);
  protected readonly warehouses = signal<WarehouseOption[]>([]);
  protected readonly validAntigens = signal<ValidAntigenOption[]>([]);
  protected readonly selectedAntigenCriteria = signal<AntigenCriteriaPair[]>([]);

  protected readonly loadingDropdowns = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal<boolean>(false);

  protected readonly productTypeSearchCtrl = new FormControl<string>('');
  protected readonly aboRhSearchCtrl = new FormControl<string>('');
  protected readonly inventoryClassSearchCtrl = new FormControl<string>('');
  protected readonly antigenGroupSearchCtrl = new FormControl<string>('');
  protected readonly warehouseSearchCtrl = new FormControl<string>('');

  protected readonly productTypeSearch = signal<string>('');
  protected readonly aboRhSearch = signal<string>('');
  protected readonly inventoryClassSearch = signal<string>('');
  protected readonly antigenGroupSearch = signal<string>('');
  protected readonly warehouseSearch = signal<string>('');

  protected readonly filteredProductTypes = computed(() => {
    const search = this.productTypeSearch().toLowerCase();
    const items = this.productTypes();
    if (!search) return items;
    return items.filter(item =>
      item.productType.toLowerCase().includes(search) ||
      (item.description?.toLowerCase().includes(search) ?? false)
    );
  });

  protected readonly filteredAboRhTypes = computed(() => {
    const search = this.aboRhSearch().toLowerCase();
    const items = this.aboRhTypes();
    if (!search) return items;
    return items.filter(item =>
      item.aboDescription?.toLowerCase().includes(search) ?? false
    );
  });

  protected readonly filteredInventoryClasses = computed(() => {
    const search = this.inventoryClassSearch().toLowerCase();
    const items = this.inventoryClasses();
    if (!search) return items;
    return items.filter(item =>
      item.code.toLowerCase().includes(search) ||
      (item.description?.toLowerCase().includes(search) ?? false)
    );
  });

  protected readonly filteredAntigenGroups = computed(() => {
    const search = this.antigenGroupSearch().toLowerCase();
    const items = this.antigenGroups();
    if (!search) return items;
    return items.filter(item =>
      item.code.toLowerCase().includes(search) ||
      (item.description?.toLowerCase().includes(search) ?? false)
    );
  });

  protected readonly filteredWarehouses = computed(() => {
    const search = this.warehouseSearch().toLowerCase();
    const items = this.warehouses();
    if (!search) return items;
    return items.filter(item =>
      item.code.toLowerCase().includes(search) ||
      (item.description?.toLowerCase().includes(search) ?? false)
    );
  });

  searchForm!: FormGroup;

  @Output() search = new EventEmitter<ProductAntigenSearchRequest>();
  @Output() clear = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownOptions();
    this.subscribeToAntigenGroupChanges();
    this.subscribeToSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      productType: [null, [Validators.required, Validators.maxLength(5)]],
      aboRh: [null],
      inventoryClass: [null, Validators.maxLength(2)],
      antigenGroup: [null],
      warehouseId: [null, Validators.maxLength(1)]
    });
  }

  private loadDropdownOptions(): void {
    this.loadingDropdowns.set(true);

    this.service.getProductTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.productTypes.set(data),
        error: (err) => console.error('Error loading product types:', err)
      });

    this.service.getAboRhTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.aboRhTypes.set(data),
        error: (err) => console.error('Error loading ABO/Rh types:', err)
      });

    this.service.getInventoryClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.inventoryClasses.set(data),
        error: (err) => console.error('Error loading inventory classes:', err)
      });

    this.service.getAntigenGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.antigenGroups.set(data),
        error: (err) => console.error('Error loading antigen groups:', err)
      });

    this.service.getWarehouses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.warehouses.set(data);
          const currentWarehouse = this.headerService.getCurrentWarehouseId();
          if (currentWarehouse && data.some(w => w.code === currentWarehouse)) {
            this.searchForm.patchValue({ warehouseId: currentWarehouse });
          }
        },
        error: (err) => console.error('Error loading warehouses:', err)
      });

    this.service.getValidAntigens()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.validAntigens.set(data);
          this.loadingDropdowns.set(false);
        },
        error: (err) => {
          console.error('Error loading valid antigens:', err);
          this.loadingDropdowns.set(false);
        }
      });
  }

  private subscribeToSearchControls(): void {
    this.productTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.productTypeSearch.set(value || ''));

    this.aboRhSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.aboRhSearch.set(value || ''));

    this.inventoryClassSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.inventoryClassSearch.set(value || ''));

    this.antigenGroupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.antigenGroupSearch.set(value || ''));

    this.warehouseSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.warehouseSearch.set(value || ''));
  }

  private subscribeToAntigenGroupChanges(): void {
    this.searchForm.get('antigenGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(groupCode => {
        if (groupCode) {
          this.loadAntigenGroupDetail(groupCode);
        }
      });
  }

  private loadAntigenGroupDetail(groupCode: string): void {
    this.service.getAntigenGroupDetail(groupCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          const criteria: AntigenCriteriaPair[] = (detail.antigens || []).map(ag => ({
            antigenId: ag.antigenId,
            result: ag.result as 'P' | 'N'
          }));
          this.selectedAntigenCriteria.set(criteria);
          this.antigenRequiredError.set(false);
        },
        error: (err) => {
          console.error('Error loading antigen group detail:', err);
          this.error.set('Failed to load antigen group details');
        }
      });
  }

  openAntigenFilterDialog(): void {
    const dialogRef = this.dialog.open(AntigenFilterDialogComponent, {
      width: '340px',
      maxHeight: '80vh',
      panelClass: 'antigen-filter-panel-dialog',
      data: {
        validAntigens: this.validAntigens(),
        currentCriteria: this.selectedAntigenCriteria()
      } as AntigenFilterDialogData
    });

    dialogRef.afterClosed().subscribe((result: AntigenFilterDialogResult | undefined) => {
      if (result?.criteria) {
        this.selectedAntigenCriteria.set(result.criteria);
        this.antigenRequiredError.set(false);
        this.onSubmit();
      }
    });
  }

  removeAntigenCriteria(antigenId: string): void {
    const current = this.selectedAntigenCriteria();
    this.selectedAntigenCriteria.set(current.filter(c => c.antigenId !== antigenId));
  }

  protected readonly antigenRequiredError = signal<boolean>(false);

  onSubmit(): void {
    this.submitted.set(true);

    if (this.searchForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const antigenCriteria = this.selectedAntigenCriteria();

    if (antigenCriteria.length === 0) {
      this.antigenRequiredError.set(true);
      return;
    }

    this.antigenRequiredError.set(false);
    const formValue = this.searchForm.value;

    const searchRequest: ProductAntigenSearchRequest = {
      productType: formValue.productType,
      aboRh: formValue.aboRh || null,
      inventoryClass: formValue.inventoryClass || null,
      antigenGroup: formValue.antigenGroup || null,
      warehouseId: formValue.warehouseId || null,
      antigenCriteria: antigenCriteria,
      take: 10,
      skip: 0,
      sortColumn: null,
      sortOrder: null
    };

    this.search.emit(searchRequest);
  }

  onClear(): void {
    this.searchForm.reset();
    this.selectedAntigenCriteria.set([]);
    this.submitted.set(false);
    this.clear.emit();
  }

  get f() {
    return this.searchForm.controls;
  }
}
