import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject, forkJoin, of, filter, takeUntil, catchError } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { ModifySddDetailsService } from './modify-sdd-details.service';
import {
  ProductCodeOption,
  LotNumberOption,
  WaferLotOption,
  MachineOption,
  SddFormData,
  SaveSddPayload,
  ItemInd,
} from './modify-sdd-details.model';

export type { ProductCodeOption, LotNumberOption, WaferLotOption, MachineOption, SddFormData, SaveSddPayload };
export { ItemInd };

@Component({
  selector: 'app-modify-sdd-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './modify-sdd-details.html',
  styleUrls: ['./modify-sdd-details.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModifySddDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `modify-sdd-details-${ModifySddDetailsComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId  = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId  = (name: string) => `${this.componentId}-${name}-label`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  protected readonly ItemInd = ItemInd;

  private readonly fb                = inject(FormBuilder);
  private readonly snackbarService   = inject(SnackbarService);
  private readonly sddService        = inject(ModifySddDetailsService);
  private readonly headerService     = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);

  readonly headerConfig = computed<PageHeaderConfig>(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    return pageData
      ? {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle ?? '',
        }
      : { breadcrumbs: [], title: '', subtitle: '' };
  });

  readonly isLoading = signal<boolean>(false);
  readonly isSaving  = signal<boolean>(false);

  readonly validatedUnitId = signal<string>('');

  readonly productDescription  = signal<string>('--');
  readonly worksheetNo         = signal<string>('--');
  readonly worksheetDescription = signal<string>('--');
  private readonly selectedItemInd = signal<string>('');

  readonly isSegmentType = computed(() => this.selectedItemInd() === ItemInd.SegmentsOnly);
  readonly isBagsDisabledByType = computed(
    () => this.selectedItemInd() === ItemInd.FiltersOnly || this.selectedItemInd() === ItemInd.SegmentsOnly
  );

  readonly hasResults       = signal<boolean>(false);
  readonly noProductsFound  = signal<boolean>(false);
  readonly detailUnitId     = signal<string>('');
  readonly detailProductCode = signal<string>('');
  readonly numberOfBagsLocked = signal<boolean>(false);  // true when bags_used > 0

  readonly detailSectionTitle = computed(
    () => `Modify SDD Details for Unit ID ${this.detailUnitId()}`
  );

  readonly numberOfBagsLabel = computed(() =>
    this.isBagsDisabledByType() ? 'Number of Bags (0)' : 'Number of Bags (0–9)'
  );

  readonly productCodeOptions  = signal<ProductCodeOption[]>([]);
  readonly lotNumberOptions    = signal<LotNumberOption[]>([]);
  readonly filteredLotNumbers  = signal<LotNumberOption[]>([]);
  readonly waferLotOptions     = signal<WaferLotOption[]>([]);
  readonly filteredWaferLots   = signal<WaferLotOption[]>([]);
  readonly machineOptions      = signal<MachineOption[]>([]);
  readonly filteredMachines    = signal<MachineOption[]>([]);

  readonly productCodeSearchControl = new FormControl('');
  readonly filteredProductCodes     = signal<ProductCodeOption[]>([]);
  readonly lotNumberSearchControl   = new FormControl('');
  readonly waferLotSearchControl    = new FormControl('');
  readonly machineSearchControl     = new FormControl('');

  // Weld values stored as Y/N (Oracle Forms standard); label shown to user
  readonly weldOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No'  },
  ] as const;

  // Segment removal flag uses same Y/N convention
  readonly segmentRemFlagOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No'  },
  ] as const;

  filterForm!: FormGroup;
  detailForm!: FormGroup;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initFilterForm();
    this.initDetailForm();
    this.setupProductCodeSearch();
    this.setupLotNumberSearch();
    this.setupWaferLotSearch();
    this.setupMachineSearch();
    this.loadWaferLotNumbers();
    this.loadSterileMachines();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    this.unitIdField.unitIdControl.valueChanges
      .pipe(filter(v => !v), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.validatedUnitId()) this.onUnitCleared();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onCancel();
        this.loadWaferLotNumbers();
        this.loadSterileMachines();
      });
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({ productCode: ['', Validators.required] });
  }

  private initDetailForm(): void {
    this.detailForm = this.fb.group({
      itemInd:        [''],
      lotNumber:      ['', Validators.required],
      numberOfItems:  [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      waferLotNumber: ['', Validators.required],
      machine:        [''],
      weld:           ['', Validators.required],
      numberOfBags:   [null, [Validators.required, Validators.min(0), Validators.max(9)]],
      // segment fields — only relevant when item_ind = 'SE'
      segmentRemFlag: [''],
      segmentNumber:  [''],
    });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    const parsedId = data.parsedUnitId ?? '';
    this.validatedUnitId.set(parsedId);
    this.resetBelowUnitState();
    this.isLoading.set(true);

    this.sddService.getProductsByUnit(parsedId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.isLoading.set(false);
          this.productCodeOptions.set(products);
          this.filteredProductCodes.set([...products]);
          this.productCodeSearchControl.setValue('');
          this.noProductsFound.set(products.length === 0);
          if (products.length === 1) {
            this.filterForm.get('productCode')?.setValue(products[0].productCode);
            this.onProductCodeChange(products[0].productCode);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.productCodeOptions.set([]);
          this.filteredProductCodes.set([]);
          this.noProductsFound.set(true);
          this.snackbarService.showError('Failed to load product codes.');
        },
      });
  }

  onUnitCleared(): void {
    this.validatedUnitId.set('');
    this.resetBelowUnitState();
  }

  private resetBelowUnitState(): void {
    this.productDescription.set('--');
    this.worksheetNo.set('--');
    this.worksheetDescription.set('--');
    this.selectedItemInd.set('');
    this.noProductsFound.set(false);
    this.productCodeOptions.set([]);
    this.filteredProductCodes.set([]);
    this.productCodeSearchControl.setValue('');
    this.lotNumberOptions.set([]);
    this.filteredLotNumbers.set([]);
    this.lotNumberSearchControl.setValue('');
    this.waferLotSearchControl.setValue('');
    this.machineSearchControl.setValue('');
    this.filterForm.get('productCode')?.setValue('');
    this.hasResults.set(false);
    this.detailUnitId.set('');
    this.detailProductCode.set('');
    this.numberOfBagsLocked.set(false);
    this.detailForm.enable();
    this.detailForm.reset();
  }

  onProductCodeChange(code: string): void {
    if (!code) return;
    const match = this.productCodeOptions().find(o => o.productCode === code);
    if (!match) return;

    this.productDescription.set(match.productDescription);
    this.worksheetNo.set(match.sdcWsNumber);
    this.worksheetDescription.set(match.itemIndDescription ?? '--');
    this.selectedItemInd.set(match.itemInd);

    const unitId = this.validatedUnitId();
    if (!unitId) return;

    this.detailUnitId.set(unitId);
    this.detailProductCode.set(code);
    this.hasResults.set(true);
    this.isLoading.set(true);

    forkJoin({
      lots: this.sddService.getLotNumbers(unitId, code).pipe(
        catchError(() => {
          this.snackbarService.showError('Failed to load lot numbers.');
          return of([] as LotNumberOption[]);
        }),
      ),
      formData: this.sddService.getFormData(unitId, code).pipe(
        catchError(() => {
          this.snackbarService.showError('Failed to load form data.');
          return of(null as SddFormData | null);
        }),
      ),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ lots, formData }) => {
          this.isLoading.set(false);

          this.lotNumberOptions.set(lots);
          this.filteredLotNumbers.set([...lots]);
          this.lotNumberSearchControl.setValue('');

          if (formData) {
            this.selectedItemInd.set(formData.itemInd);
            const bagsUsed = formData.bagsUsed ?? 0;
            this.numberOfBagsLocked.set(bagsUsed > 0);

            this.detailForm.patchValue({
              itemInd:        formData.itemInd,
              lotNumber:      formData.lotNumber,
              numberOfItems:  formData.numberOfItems,
              waferLotNumber: formData.waferLotNumber,
              machine:        formData.sterileMachine,
              weld:           formData.weldFlag,
              numberOfBags:   formData.numberOfBags,
              segmentRemFlag: formData.segmentRemFlag ?? '',
              segmentNumber:  formData.segmentNumber  ?? '',
            });
          }

          // Always enforce bags rule — depends on itemInd, not formData
          this.applyBagsDisableRule();
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  onLotNumberChange(value: string): void {
    const match = this.lotNumberOptions().find(o => o.lotNumber === value);
    if (match?.numberOfItems != null) {
      this.detailForm.get('numberOfItems')?.setValue(match.numberOfItems);
    }
  }

  onCancel(): void {
    this.hasResults.set(false);
    this.detailForm.enable();
    this.detailForm.reset();
    this.filterForm.reset();
    this.productDescription.set('--');
    this.worksheetNo.set('--');
    this.worksheetDescription.set('--');
    this.selectedItemInd.set('');
    this.productCodeOptions.set([]);
    this.filteredProductCodes.set([]);
    this.productCodeSearchControl.setValue('');
    this.lotNumberOptions.set([]);
    this.filteredLotNumbers.set([]);
    this.lotNumberSearchControl.setValue('');
    this.waferLotSearchControl.setValue('');
    this.machineSearchControl.setValue('');
    this.detailUnitId.set('');
    this.detailProductCode.set('');
    this.numberOfBagsLocked.set(false);
    this.noProductsFound.set(false);
    this.validatedUnitId.set('');
    this.unitIdField?.clear();
  }

  onSave(): void {
    if (this.detailForm.invalid) {
      this.detailForm.markAllAsTouched();
      return;
    }

    const unitId      = this.validatedUnitId();
    const productCode = this.filterForm.get('productCode')?.value as string;
    const sdcWsNumber = this.worksheetNo();
    const formValue   = this.detailForm.getRawValue();

    const payload: SaveSddPayload = {
      unitId,
      productCode,
      sdcWsNumber,
      itemInd:        formValue.itemInd,
      lotNumber:      formValue.lotNumber,
      numberOfItems:  formValue.numberOfItems,
      waferLotNumber: formValue.waferLotNumber,
      sterileMachine: formValue.machine,
      weldFlag:       formValue.weld,
      numberOfBags:   formValue.numberOfBags,
      ...(this.isSegmentType() && {
        segmentRemFlag: formValue.segmentRemFlag,
        segmentNumber:  formValue.segmentNumber,
      }),
    };

    this.isSaving.set(true);
    this.sddService.update(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.snackbarService.showSuccess('SDD details saved successfully.');
          this.onCancel();
        },
        error: () => {
          this.isSaving.set(false);
          this.snackbarService.showError('Failed to save SDD details. Please try again.');
        },
      });
  }

  private setupProductCodeSearch(): void {
    this.productCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const q = (term ?? '').toLowerCase();
        this.filteredProductCodes.set(
          !q
            ? [...this.productCodeOptions()]
            : this.productCodeOptions().filter(o => o.productCode.toLowerCase().includes(q))
        );
      });
  }

  private setupLotNumberSearch(): void {
    this.lotNumberSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const q = (term ?? '').toLowerCase();
        this.filteredLotNumbers.set(
          !q
            ? [...this.lotNumberOptions()]
            : this.lotNumberOptions().filter(o => o.lotNumber.toLowerCase().includes(q))
        );
      });
  }

  private setupWaferLotSearch(): void {
    this.waferLotSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const q = (term ?? '').toLowerCase();
        this.filteredWaferLots.set(
          !q
            ? [...this.waferLotOptions()]
            : this.waferLotOptions().filter(o => o.lotNumber.toLowerCase().includes(q))
        );
      });
  }

  private loadWaferLotNumbers(): void {
    this.sddService.getWaferLotNumbers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (waferLots) => {
          this.waferLotOptions.set(waferLots);
          this.filteredWaferLots.set([...waferLots]);
        },
        error: () => {
          this.waferLotOptions.set([]);
          this.filteredWaferLots.set([]);
          this.snackbarService.showError('Failed to load wafer lot numbers.');
        },
      });
  }

  private setupMachineSearch(): void {
    this.machineSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const q = (term ?? '').toLowerCase();
        this.filteredMachines.set(
          !q
            ? [...this.machineOptions()]
            : this.machineOptions().filter(
                o =>
                  o.code.toLowerCase().includes(q) ||
                  o.codeDescription.toLowerCase().includes(q)
              )
        );
      });
  }

  private loadSterileMachines(): void {
    this.sddService.getSterileMachines()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (machines) => {
          this.machineOptions.set(machines);
          this.filteredMachines.set([...machines]);
        },
        error: () => {
          this.machineOptions.set([]);
          this.filteredMachines.set([]);
          this.snackbarService.showError('Failed to load sterile machines.');
        },
      });
  }

  private applyBagsDisableRule(): void {
    const ctrl = this.detailForm.get('numberOfBags');
    if (!ctrl) return;

    if (this.isBagsDisabledByType()) {
      // FI/SE: field stays editable but value must not exceed 0
      ctrl.setValidators([Validators.required, Validators.min(0), Validators.max(0)]);
      ctrl.enable();
      ctrl.updateValueAndValidity();
    } else if (this.numberOfBagsLocked()) {
      ctrl.setValidators([Validators.required, Validators.min(0), Validators.max(9)]);
      ctrl.disable();
    } else {
      ctrl.setValidators([Validators.required, Validators.min(0), Validators.max(9)]);
      ctrl.enable();
    }
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    return /[0-9]/.test(event.key);
  }

  onPasteNumbers(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!/^\d+$/.test(pasted)) event.preventDefault();
  }

  get df() { return this.detailForm.controls; }

}
