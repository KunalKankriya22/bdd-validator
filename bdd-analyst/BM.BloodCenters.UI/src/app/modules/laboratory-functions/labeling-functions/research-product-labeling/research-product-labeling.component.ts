import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  effect,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ResearchProductLabelingApiService } from './services/research-product-labeling-api.service';
import {
  ValidateUnitResponse,
  ResearchTypeDto,
  ResearchProductDto,
  LabeledProductDto,
  CatalogNumberDto,
  LabelPreviewResponse,
  CalculateExpiryResponse,
  BiohazardCheckResponse,
  ChapterConfigDto,
} from './models/research-product-labeling.model';

@Component({
  selector: 'app-research-product-labeling',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatTooltipModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './research-product-labeling.component.html',
  styleUrls: ['./research-product-labeling.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchProductLabelingComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('verifyUnitIdField') verifyUnitIdField!: UnitIdFieldComponent;

  private static nextId = 0;
  protected readonly componentId = `rpl-${ResearchProductLabelingComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly apiService = inject(ResearchProductLabelingApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // ── Header ──
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
  };

  // ── Label Setup Form (Card 1) ──
  labelSetupForm = new FormGroup({
    originalProductCode: new FormControl<string | null>(null),
    productType: new FormControl<string | null>('R'),
    researchProductCode: new FormControl<string | null>(null),
    bag: new FormControl<string | null>(null),
  });

  // ── Unit state ──
  readonly unitValidated = signal(false);
  readonly unitData = signal<ValidateUnitResponse | null>(null);
  readonly isLoadingUnit = signal(false);

  // ── Chapter config ──
  readonly chapterConfig = signal<ChapterConfigDto | null>(null);

  // ── MF/non-MF toggle ──
  readonly isMfProduct = computed(() => {
    const pt = this.selectedResearchProduct()?.productType;
    return pt === 'RPFF' || pt === 'RPL';
  });

  // ── Read-only computed displays ──
  readonly collectionDate = computed(() => {
    const d = this.unitData()?.collectionDate;
    return d ? this.formatDate(d) : '';
  });
  readonly description = computed(() => {
    const prod = this.validatedProduct();
    if (prod) return prod.productCode;
    return '';
  });

  // ── LOV options ──
  readonly researchTypeOptions = signal<ResearchTypeDto[]>([]);
  readonly originalProductCodeOptions = signal<LabeledProductDto[]>([]);
  readonly researchProductOptions = signal<ResearchProductDto[]>([]);
  readonly catalogNumberOptions = signal<CatalogNumberDto[]>([]);

  // ── Autocomplete filter signals ──
  readonly originalPcFilter = signal('');
  readonly researchPcFilter = signal('');
  readonly bagFilter = signal('');

  readonly filteredOriginalPcOptions = computed(() => {
    const search = this.originalPcFilter().toLowerCase();
    const opts = this.originalProductCodeOptions();
    if (!search) return opts;
    return opts.filter(o =>
      o.productCode.toLowerCase().includes(search) ||
      (o.productDesc || '').toLowerCase().includes(search),
    );
  });

  readonly filteredResearchPcOptions = computed(() => {
    const search = this.researchPcFilter().toLowerCase();
    const opts = this.researchProductOptions();
    if (!search) return opts;
    return opts.filter(o =>
      o.productCode.toLowerCase().includes(search) ||
      o.productDesc.toLowerCase().includes(search),
    );
  });

  readonly filteredBagOptions = computed(() => {
    const search = this.bagFilter().toLowerCase();
    const opts = this.catalogNumberOptions();
    if (!search) return opts;
    return opts.filter(o => o.catalogNumber.toLowerCase().includes(search));
  });

  // ── Validated product state ──
  readonly validatedProduct = signal<{ productCode: string; catalogNumber: string | null } | null>(null);
  readonly selectedResearchProduct = signal<ResearchProductDto | null>(null);

  // ── Label preview (Cards 2 & 3) ──
  readonly labelPreview = signal<LabelPreviewResponse | null>(null);
  readonly expiryData = signal<CalculateExpiryResponse | null>(null);
  readonly labelPrinted = signal(false);
  readonly isSaving = signal(false);

  // ── Verification state (Card 4) ──
  readonly verificationScanUnitAbo = signal('');
  readonly verificationUnitId = signal('');
  readonly verificationAbo = signal('');
  readonly verificationScanProdExp = signal('');
  readonly verificationProductCode = signal('');
  readonly verificationExpDate = signal('');
  readonly verificationCollDate = signal('');

  readonly verificationDescription = computed(() => {
    return '';
  });

  readonly verificationHasData = computed(() =>
    !!this.verificationUnitId() || !!this.verificationAbo() ||
    !!this.verificationProductCode() || !!this.verificationExpDate() ||
    !!this.verificationCollDate(),
  );

  readonly reprintEnabled = computed(() =>
    this.labelPrinted() && !this.verificationHasData(),
  );

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
        };
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.loadResearchTypes();
    this.loadChapterConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Autocomplete displayWith functions ──

  displayOriginalPc = (value: string): string => {
    if (!value) return '';
    const opt = this.originalProductCodeOptions().find(o => o.productCode === value);
    return opt ? `${opt.productCode} - ${opt.productDesc || ''}` : value;
  };

  displayResearchPc = (value: string): string => {
    if (!value) return '';
    const opt = this.researchProductOptions().find(o => o.productCode === value);
    return opt ? `${opt.productCode} - ${opt.productDesc}` : value;
  };

  displayBag = (value: string): string => {
    return value || '';
  };

  // ── Init loaders ──

  private loadResearchTypes(): void {
    this.apiService.getResearchTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            this.researchTypeOptions.set(res.data);
          }
        },
      });
  }

  private loadChapterConfig(): void {
    this.apiService.getChapterConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            this.chapterConfig.set(res.data);
          }
        },
      });
  }

  // ── Unit ID events (called after shared donor-lib validation succeeds) ──

  onUnitValidated(data: UnitValidationResponse): void {
    const unitId = data.parsedUnitId;
    if (!unitId) return;
    if (this.isLoadingUnit()) return;

    this.resetAll();
    this.isLoadingUnit.set(true);
    this.apiService.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.isLoadingUnit.set(false);
          if (!res.success || !res.data) {
            this.snackbarService.showError(res.message || 'Unit not found');
            return;
          }
          const unit = res.data;
          if (!unit.isValid) {
            this.snackbarService.showError(unit.errorMessage || 'Unit validation failed');
            return;
          }
          this.unitData.set(unit);
          this.unitValidated.set(true);
          this.loadUnitRelatedDropdowns(unit);
          this.cdr.markForCheck();
        },
        error: err => {
          this.isLoadingUnit.set(false);
          this.snackbarService.showError(err?.error?.message || 'Unit validation failed');
          this.cdr.markForCheck();
        },
      });
  }

  onUnitCleared(): void {
    this.resetAll();
  }

  private loadUnitRelatedDropdowns(unit: ValidateUnitResponse): void {
    const collDate = unit.collectionDate || unit.collDate;

    forkJoin({
      labeledProducts: this.apiService.getLabeledProducts(unit.unitId, collDate),
      researchProducts: this.apiService.getResearchProducts(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ labeledProducts, researchProducts }) => {
          if (labeledProducts.success && labeledProducts.data) {
            this.originalProductCodeOptions.set(labeledProducts.data);
          }
          if (researchProducts.success && researchProducts.data) {
            this.researchProductOptions.set(researchProducts.data);
          }
          this.cdr.markForCheck();
        },
      });
  }

  // ── Original Product Code selected ──

  onOriginalPcSelected(value: string): void {
    this.labelSetupForm.patchValue({ originalProductCode: value });

    const unit = this.unitData();
    if (!unit) return;

    this.apiService.validateProduct({
      unitId: unit.unitId,
      productCode: value,
      collectionDate: unit.collectionDate || unit.collDate,
      chapterId: unit.chapterId,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            if (!res.data.isValid) {
              this.snackbarService.showError(res.data.errorMessage || 'Invalid product code');
              return;
            }
            this.validatedProduct.set({
              productCode: res.data.productCode,
              catalogNumber: res.data.catalogNumber,
            });
          }
          this.cdr.markForCheck();
        },
      });
  }

  // ── Research Product Code selected ──

  onResearchPcSelected(value: string): void {
    this.labelSetupForm.patchValue({ researchProductCode: value });

    const unit = this.unitData();
    const origPc = this.labelSetupForm.value.originalProductCode;
    if (!unit || !origPc) return;

    this.apiService.validateResearchProduct({
      unitId: unit.unitId,
      productCode: origPc,
      researchProductCode: value,
      collectionDate: unit.collectionDate || unit.collDate,
      catalogNumber: unit.catalogNumber,
      chapterId: unit.chapterId,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            this.selectedResearchProduct.set(res.data);
            this.loadCatalogNumbers(unit, res.data.productType);
          }
          this.cdr.markForCheck();
        },
        error: err => {
          this.snackbarService.showError(err?.error?.message || 'Research product validation failed');
          this.cdr.markForCheck();
        },
      });
  }

  private loadCatalogNumbers(unit: ValidateUnitResponse, productType: string | null): void {
    this.apiService.getCatalogNumbers(unit.unitId, productType || 'R')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            this.catalogNumberOptions.set(res.data);
          }
          this.cdr.markForCheck();
        },
      });
  }

  // ── Bag/Catalog selected → triggers validate + biohazard + expiry + preview chain ──

  onBagSelected(value: string): void {
    this.labelSetupForm.patchValue({ bag: value });

    const unit = this.unitData();
    const origPc = this.labelSetupForm.value.originalProductCode;
    if (!unit || !origPc) return;

    this.isSaving.set(true);

    this.apiService.validateCatalog({
      unitId: unit.unitId,
      productCode: origPc,
      catalogNumber: value,
      productType: this.selectedResearchProduct()?.productType,
      chapterId: unit.chapterId,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          if (res.success) {
            this.runPostCatalogChain(unit);
          } else {
            this.isSaving.set(false);
            this.snackbarService.showError(res.message || 'Catalog validation failed');
            this.cdr.markForCheck();
          }
        },
        error: err => {
          this.isSaving.set(false);
          this.snackbarService.showError(err?.error?.message || 'Catalog validation failed');
          this.cdr.markForCheck();
        },
      });
  }

  private runPostCatalogChain(unit: ValidateUnitResponse): void {
    const origPc = this.labelSetupForm.value.originalProductCode!;
    const collDate = unit.collectionDate || unit.collDate;
    const researchPc = this.labelSetupForm.value.researchProductCode;
    const researchType = this.labelSetupForm.value.productType;
    const productType = this.selectedResearchProduct()?.productType;

    forkJoin({
      biohazard: this.apiService.checkBiohazard({
        unitId: unit.unitId,
        collectionDate: collDate,
        productCode: origPc,
        chapterId: unit.chapterId,
      }),
      expiry: this.apiService.calculateExpiry({
        unitId: unit.unitId,
        collectionDate: collDate,
        productCode: origPc,
        productType: productType,
        chapterId: unit.chapterId,
      }),
      preview: this.apiService.getLabelPreview({
        unitId: unit.unitId,
        productCode: origPc,
        researchTypeCode: researchType,
        researchProductCode: researchPc,
        collectionDate: collDate,
        chapterId: unit.chapterId,
      }),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ biohazard, expiry, preview }) => {
          this.isSaving.set(false);

          if (biohazard.success && biohazard.data?.hasBiohazard) {
            this.snackbarService.showError('Biohazard interdiction found for this unit');
          }

          if (expiry.success && expiry.data) {
            this.expiryData.set(expiry.data);
          }

          if (preview.success && preview.data) {
            this.labelPreview.set(preview.data);
          }

          this.cdr.markForCheck();
        },
        error: err => {
          this.isSaving.set(false);
          this.snackbarService.showError(err?.error?.message || 'Failed to load label preview');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Generate Label (Print) ──

  onGenerateLabel(): void {
    const unit = this.unitData();
    if (!unit) return;

    const origPc = this.labelSetupForm.value.originalProductCode;
    const researchType = this.labelSetupForm.value.productType;
    const researchPc = this.labelSetupForm.value.researchProductCode;
    const bag = this.labelSetupForm.value.bag;
    if (!origPc || !researchType) return;

    this.isSaving.set(true);
    this.apiService.generateLabel({
      unitId: unit.unitId,
      productCode: origPc,
      researchTypeCode: researchType,
      researchProductCode: researchPc,
      collectionDate: unit.collectionDate || unit.collDate,
      catalogNumber: bag,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.isSaving.set(false);
          if (res.success) {
            this.labelPrinted.set(true);
            this.snackbarService.showSuccess('Label generated successfully');
          } else {
            this.snackbarService.showError(res.message || 'Label generation failed');
          }
          this.cdr.markForCheck();
        },
        error: err => {
          this.isSaving.set(false);
          this.snackbarService.showError(err?.error?.message || 'Label generation failed');
          this.cdr.markForCheck();
        },
      });
  }

  // ── REPRINT ──

  onReprint(): void {
    if (!this.reprintEnabled()) return;
    this.onGenerateLabel();
  }

  // ── Complete Relabeling (Verification) ──

  onCompleteVerification(): void {
    const unit = this.unitData();
    const expiry = this.expiryData();
    if (!unit || !expiry?.expirationDate) return;

    const origPc = this.labelSetupForm.value.originalProductCode;
    const researchType = this.labelSetupForm.value.productType;
    const researchPc = this.labelSetupForm.value.researchProductCode;
    const bag = this.labelSetupForm.value.bag;
    if (!researchPc || !researchType) return;

    this.isSaving.set(true);
    this.apiService.completeRelabeling({
      unitId: unit.unitId,
      collectionDate: unit.collectionDate || unit.collDate,
      productCode: origPc,
      researchProductCode: researchPc,
      researchTypeCode: researchType,
      catalogNumber: bag,
      expirationDate: expiry.expirationDate,
      chapterId: unit.chapterId,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.isSaving.set(false);
          if (res.success && res.data?.success) {
            this.snackbarService.showSuccess(res.data.message || 'Relabeling completed');
            this.resetAll();
            this.unitIdField?.clear();
          } else {
            this.snackbarService.showError(res.data?.message || res.message || 'Verification failed');
          }
          this.cdr.markForCheck();
        },
        error: err => {
          this.isSaving.set(false);
          this.snackbarService.showError(err?.error?.message || 'Verification failed');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Verification scan handlers ──

  onVerifyScanUnitAboInput(event: Event): void {
    this.verificationScanUnitAbo.set((event.target as HTMLInputElement).value);
  }

  onScanUnitAboEnter(): void {
    const scanned = this.verificationScanUnitAbo().trim();
    if (!scanned) return;
    this.verificationUnitId.set(scanned);
    this.verificationScanUnitAbo.set('');
  }

  onVerifyUnitValidated(data: UnitValidationResponse): void {
    this.verificationUnitId.set(data.parsedUnitId || '');
  }

  onVerifyUnitCleared(): void {
    this.verificationUnitId.set('');
  }

  onVerifyAboChange(value: string): void {
    this.verificationAbo.set(value);
  }

  onVerifyScanProdExpInput(event: Event): void {
    this.verificationScanProdExp.set((event.target as HTMLInputElement).value);
  }

  onScanProdExpEnter(): void {
    const scanned = this.verificationScanProdExp().trim();
    if (!scanned) return;
    this.verificationProductCode.set(scanned);
    this.verificationScanProdExp.set('');
  }

  onVerifyProductCodeInput(event: Event): void {
    this.verificationProductCode.set((event.target as HTMLInputElement).value);
  }

  onVerifyExpDateInput(event: Event): void {
    this.verificationExpDate.set((event.target as HTMLInputElement).value);
  }

  onVerifyCollDateInput(event: Event): void {
    this.verificationCollDate.set((event.target as HTMLInputElement).value);
  }

  onVerifyExpDateBlur(): void {
    const entered = this.verificationExpDate().trim();
    if (!entered) return;
    this.runVerification();
  }

  onVerifyCollDateBlur(): void {
    const entered = this.verificationCollDate().trim();
    if (!entered) return;
    this.runVerification();
  }

  private runVerification(): void {
    const unit = this.unitData();
    const expiry = this.expiryData();
    if (!unit || !expiry?.expirationDate) return;

    const enteredUnitId = this.verificationUnitId().trim();
    const enteredProductCode = this.verificationProductCode().trim();
    const researchPc = this.labelSetupForm.value.researchProductCode;

    if (!enteredUnitId) {
      this.snackbarService.showError('Unit ID verification is required');
      return;
    }
    if (enteredUnitId !== unit.unitId) {
      this.snackbarService.showError('Scanned Unit ID does not match the labeled unit');
      return;
    }

    if (!enteredProductCode) {
      this.snackbarService.showError('Product Code verification is required');
      return;
    }
    if (enteredProductCode !== researchPc) {
      this.snackbarService.showError('Scanned Product Code does not match the research product');
      return;
    }

    if (!this.isMfProduct()) {
      const enteredExp = this.verificationExpDate().trim();
      if (!enteredExp) {
        this.snackbarService.showError('Expiration Date verification is required');
        return;
      }
      const expectedExp = moment(expiry.expirationDate).format('DD-MMM-YYYY HH:mm').toUpperCase();
      const enteredExpNorm = moment(enteredExp, ['DD-MMM-YYYY HH:mm', 'DD-MMM-YYYY HH24:MI', 'YYYY-MM-DDTHH:mm'], true);
      if (!enteredExpNorm.isValid() || enteredExpNorm.format('DD-MMM-YYYY HH:mm').toUpperCase() !== expectedExp) {
        this.snackbarService.showError(`Expiration Date does not match. Expected: ${expectedExp}`);
        return;
      }
    } else {
      const enteredColl = this.verificationCollDate().trim();
      if (!enteredColl) {
        this.snackbarService.showError('Collection Date verification is required');
        return;
      }
    }

    this.onCompleteVerification();
  }

  // ── Utilities ──

  private resetAll(): void {
    this.unitValidated.set(false);
    this.unitData.set(null);
    this.labelSetupForm.reset({ productType: 'R' });
    this.originalProductCodeOptions.set([]);
    this.researchProductOptions.set([]);
    this.catalogNumberOptions.set([]);
    this.validatedProduct.set(null);
    this.selectedResearchProduct.set(null);
    this.labelPreview.set(null);
    this.expiryData.set(null);
    this.labelPrinted.set(false);
    this.resetVerification();
    this.cdr.markForCheck();
  }

  private resetVerification(): void {
    this.verificationScanUnitAbo.set('');
    this.verificationUnitId.set('');
    this.verificationAbo.set('');
    this.verificationScanProdExp.set('');
    this.verificationProductCode.set('');
    this.verificationExpDate.set('');
    this.verificationCollDate.set('');
    this.verifyUnitIdField?.clear();
  }

  private formatDate(dateString: string): string {
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }
}
