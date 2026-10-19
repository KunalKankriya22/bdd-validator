import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef, inject, signal, computed, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, startWith, takeUntil } from 'rxjs';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { EnterNoteForSpecialProcessingService } from './services/enter-note-for-special-processing.service';
import type { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import type {
  ProcessCodeItem,
  ProductCodeItem,
  AliquotItem,
  SpecialProcessingNoteDto,
  ProductCodesResponse,
} from './models/enter-note-for-special-processing.model';

const NOTE_MAX_LENGTH = 240;

@Component({
  selector: 'app-enter-note-for-special-processing',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  providers: [DatePipe],
  templateUrl: './enter-note-for-special-processing.html',
  styleUrls: ['./enter-note-for-special-processing.scss'],
})
export class EnterNoteForSpecialProcessingComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EnterNoteForSpecialProcessingService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly datePipe = inject(DatePipe);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  readonly processCodes = signal<ProcessCodeItem[]>([]);
  readonly productCodes = signal<ProductCodeItem[]>([]);
  readonly aliquots = signal<AliquotItem[]>([]);
  readonly retrievedData = signal<SpecialProcessingNoteDto | null>(null);
  readonly loading = signal(false);
  readonly loadingCollectionDate = signal(false);
  readonly loadingAliquots = signal(false);
  readonly saving = signal(false);
  readonly hasSearched = signal(false);
  readonly selectedProcessCode = signal('');
  readonly selectedProductCode = signal('');
  readonly selectedUnitId = signal('');
  readonly selectedAliquot = signal('');
  readonly collectionDateValue = signal<string | null>(null);
  readonly currentNoteText = signal('');

  readonly noteChanged = computed(() => {
    return this.currentNoteText() !== this.originalNoteText;
  });

  readonly filteredProcessCodes = signal<ProcessCodeItem[]>([]);
  readonly filteredProductCodes = signal<ProductCodeItem[]>([]);
  readonly filteredAliquots = signal<AliquotItem[]>([]);

  readonly processCodeSearch = new FormControl('');
  readonly productCodeSearch = new FormControl('');
  readonly aliquotSearch = new FormControl('');

  readonly processDescription = computed(() => {
    const retrieved = this.retrievedData();
    if (retrieved) return retrieved.processDescription ?? '--';
    const code = this.selectedProcessCode();
    if (!code) return '--';
    const match = this.processCodes().find((item) => item.processCode === code);
    return match?.description ?? '--';
  });

  readonly collectionDate = computed(() => {
    const date = this.retrievedData()?.collectionDate ?? this.collectionDateValue();
    if (!date) return '--';
    return this.datePipe.transform(date, 'dd-MMM-yyyy')?.toUpperCase() ?? '--';
  });

  readonly retrieveDisabled = computed(() => {
    return this.loading() || !this.selectedProcessCode() || !this.selectedUnitId()
      || !this.selectedProductCode() || !this.selectedAliquot();
  });

  private readonly disableEffect = effect(() => {
    const hasUnit = !!this.selectedUnitId();
    const hasProcess = !!this.selectedProcessCode();
    const hasProduct = !!this.selectedProductCode();

    const unitIdCtrl = this.unitIdField?.unitIdControl;
    const productCtrl = this.searchForm.get('productCode');
    const aliquotCtrl = this.searchForm.get('aliquot');

    // unitIdCtrl is null on first run (before ViewChild init); ngAfterViewInit handles initial disable
    if (unitIdCtrl) {
      hasProcess ? unitIdCtrl.enable({ emitEvent: false }) : unitIdCtrl.disable({ emitEvent: false });
    }
    (hasProcess && hasUnit) ? productCtrl?.enable({ emitEvent: false }) : productCtrl?.disable({ emitEvent: false });
    hasProduct ? aliquotCtrl?.enable({ emitEvent: false }) : aliquotCtrl?.disable({ emitEvent: false });
  });

  readonly productDescription = computed(() => {
    const retrieved = this.retrievedData();
    if (retrieved) return retrieved.productDescription ?? '--';
    const code = this.selectedProductCode();
    if (!code) return '--';
    const match = this.productCodes().find((item) => item.productCode === code);
    return match?.description ?? '--';
  });

  readonly searchForm: FormGroup = this.fb.group({
    processCode: [''],
    productCode: [''],
    aliquot: [''],
  });

  readonly noteForm: FormGroup = this.fb.group({
    noteText: ['', [Validators.maxLength(NOTE_MAX_LENGTH)]],
  });

  readonly noteMaxLength = NOTE_MAX_LENGTH;

  private originalNoteText = '';

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Enter Note for Special Processing', link: null },
    ],
  };

  get charactersRemaining(): number {
    const currentLength = (this.noteForm.get('noteText')?.value ?? '').length;
    return NOTE_MAX_LENGTH - currentLength;
  }

  hasAnyFilterValue(): boolean {
    const { processCode, productCode, aliquot } = this.searchForm.getRawValue();
    return !!(processCode || this.selectedUnitId() || productCode || aliquot);
  }

  ngOnInit(): void {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    if (menuItem?.label) {
      this.pageHeaderConfig = {
        ...this.pageHeaderConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: menuItem.label, link: null },
        ],
      };
    }

    this.loadProcessCodes();
    this.setupSearchFilters();
    this.listenNoteTextChange();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    if (this.unitIdField && !this.selectedProcessCode()) {
      this.unitIdField.unitIdControl.disable({ emitEvent: false });
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetrieve(): void {
    const { processCode, productCode, aliquot } = this.searchForm.getRawValue();
    const unitId = this.selectedUnitId();

    if (!processCode || !unitId) {
      return;
    }

    this.loading.set(true);
    this.hasSearched.set(true);

    this.service.retrieve({
      processCode,
      unitId,
      productCode: productCode || '',
      aliquot: aliquot || '00',
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response?.item) {
            this.retrievedData.set(response.item);
            this.originalNoteText = response.item.noteText ?? '';
            this.noteForm.patchValue({ noteText: this.originalNoteText });

            this.searchForm.patchValue({
              processCode: response.item.processCode,
              productCode: response.item.productCode,
              aliquot: response.item.aliquot ?? '',
            }, { emitEvent: false });
            this.selectedProcessCode.set(response.item.processCode);
            this.selectedProductCode.set(response.item.productCode);
            this.selectedUnitId.set(response.item.unitId);
            this.selectedAliquot.set(response.item.aliquot ?? '');
            this.collectionDateValue.set(response.item.collectionDate ?? null);
          } else {
            this.retrievedData.set(null);
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.retrievedData.set(null);
          const errorMessage = error?.error?.errorResponse?.error || error?.error?.message || 'An error occurred while retrieving data';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  onClearAll(): void {
    this.searchForm.reset();
    this.noteForm.reset();
    this.unitIdField?.clear();
    this.retrievedData.set(null);
    this.hasSearched.set(false);
    this.originalNoteText = '';
    this.currentNoteText.set('');
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.aliquots.set([]);
    this.filteredAliquots.set([]);
    this.collectionDateValue.set(null);
    this.selectedProcessCode.set('');
    this.selectedProductCode.set('');
    this.selectedUnitId.set('');
    this.selectedAliquot.set('');
  }

  onSave(): void {
    if (this.noteForm.invalid || this.saving()) return;

    const data = this.retrievedData();
    if (!data) return;

    const noteText = this.noteForm.get('noteText')?.value ?? '';

    this.saving.set(true);

    this.service.save({
      processCode: data.processCode,
      unitId: data.unitId,
      productCode: data.productCode,
      aliquot: data.aliquot || '00',
      noteText,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbarService.showSuccess(
            `Note for Special Processing for Process code - (${data.processCode}) has been updated successfully.`
          );
          this.onClearAll();
        },
        error: (error) => {
          this.saving.set(false);
          const errorMessage = error?.error?.errorResponse?.error || error?.error?.message || 'An error occurred while saving';
          this.snackbarService.showError(errorMessage);
        },
      });
  }

  onCancel(): void {
    this.onClearAll();
  }

  onProcessCodeChange(): void {
    const processCode = this.searchForm.get('processCode')?.value ?? '';
    this.selectedProcessCode.set(processCode);
    this.searchForm.patchValue({ productCode: '', aliquot: '' }, { emitEvent: false });
    this.unitIdField?.clear();
    this.selectedUnitId.set('');
    this.selectedProductCode.set('');
    this.selectedAliquot.set('');
    this.collectionDateValue.set(null);
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.aliquots.set([]);
    this.filteredAliquots.set([]);
    this.retrievedData.set(null);
    this.hasSearched.set(false);
    this.noteForm.reset();
    this.originalNoteText = '';
  }

  onProductCodeChange(): void {
    const productCode = this.searchForm.get('productCode')?.value ?? '';
    this.selectedProductCode.set(productCode);
    this.searchForm.patchValue({ aliquot: '' }, { emitEvent: false });
    this.selectedAliquot.set('');
    this.aliquots.set([]);
    this.filteredAliquots.set([]);
    this.retrievedData.set(null);
    this.hasSearched.set(false);
    this.noteForm.reset();
    this.originalNoteText = '';

    this.loadAliquotsIfReady();
  }

  onAliquotChange(): void {
    const aliquot = this.searchForm.get('aliquot')?.value ?? '';
    this.selectedAliquot.set(aliquot);
  }

  clearDropdownSearch(ctrl: FormControl): void {
    ctrl.setValue('', { emitEvent: true });
  }

  private setupSearchFilters(): void {
    this.processCodeSearch.valueChanges.pipe(startWith(''), takeUntil(this.destroy$)).subscribe(q => {
      const s = (q || '').toLowerCase();
      this.filteredProcessCodes.set(s
        ? this.processCodes().filter(p => p.processCode.toLowerCase().includes(s) || p.description.toLowerCase().includes(s))
        : [...this.processCodes()]);
    });

    this.productCodeSearch.valueChanges.pipe(startWith(''), takeUntil(this.destroy$)).subscribe(q => {
      const s = (q || '').toLowerCase();
      this.filteredProductCodes.set(s
        ? this.productCodes().filter(p => p.productCode.toLowerCase().includes(s) || p.description.toLowerCase().includes(s))
        : [...this.productCodes()]);
    });

    this.aliquotSearch.valueChanges.pipe(startWith(''), takeUntil(this.destroy$)).subscribe(q => {
      const s = (q || '').toLowerCase();
      this.filteredAliquots.set(s
        ? this.aliquots().filter(a => a.aliquot.toLowerCase().includes(s))
        : [...this.aliquots()]);
    });
  }

  private loadProcessCodes(): void {
    this.service.getProcessCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.processCodes.set(codes);
          this.filteredProcessCodes.set([...codes]);
        },
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.selectedUnitId.set(data.parsedUnitId);

    this.searchForm.patchValue({ productCode: '', aliquot: '' }, { emitEvent: false });
    this.selectedProductCode.set('');
    this.selectedAliquot.set('');
    this.collectionDateValue.set(null);
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.aliquots.set([]);
    this.filteredAliquots.set([]);
    this.retrievedData.set(null);
    this.hasSearched.set(false);
    this.noteForm.reset();
    this.originalNoteText = '';

    this.loadProductCodesIfReady();
  }

  onUnitCleared(): void {
    this.selectedUnitId.set('');
    this.searchForm.patchValue({ productCode: '', aliquot: '' }, { emitEvent: false });
    this.selectedProductCode.set('');
    this.selectedAliquot.set('');
    this.collectionDateValue.set(null);
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.aliquots.set([]);
    this.filteredAliquots.set([]);
    this.retrievedData.set(null);
    this.hasSearched.set(false);
    this.noteForm.reset();
    this.originalNoteText = '';
  }

  private loadProductCodesIfReady(): void {
    const processCode = this.searchForm.getRawValue().processCode;
    const unitId = this.selectedUnitId();

    if (processCode && unitId) {
      this.loadingCollectionDate.set(true);
      this.service.getProductCodes(processCode, unitId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: ProductCodesResponse) => {
            const codes = response?.data ?? [];
            this.productCodes.set(codes);
            this.filteredProductCodes.set([...codes]);
            this.collectionDateValue.set(response?.item?.collectionDate ?? null);
            this.loadingCollectionDate.set(false);
          },
          error: (error) => {
            this.productCodes.set([]);
            this.collectionDateValue.set(null);
            this.loadingCollectionDate.set(false);
            const errorMessage = error?.error?.errorResponse?.error || error?.error?.message || 'Error loading product codes';
            this.snackbarService.showError(errorMessage);
          },
        });
    }
  }

  private loadAliquotsIfReady(): void {
    const processCode = this.searchForm.getRawValue().processCode;
    const unitId = this.selectedUnitId();
    const productCode = this.searchForm.getRawValue().productCode;

    if (processCode && unitId && productCode) {
      this.loadingAliquots.set(true);
      this.service.getAliquots(processCode, unitId, productCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (items) => {
            this.aliquots.set(items);
            this.filteredAliquots.set([...items]);
            this.loadingAliquots.set(false);
            if (items.length === 1) {
              this.searchForm.patchValue({ aliquot: items[0].aliquot }, { emitEvent: false });
              this.selectedAliquot.set(items[0].aliquot);
            }
          },
          error: (error) => {
            this.aliquots.set([]);
            this.filteredAliquots.set([]);
            this.loadingAliquots.set(false);
            const errorMessage = error?.error?.errorResponse?.error || error?.error?.message || 'Error loading aliquots';
            this.snackbarService.showError(errorMessage);
          },
        });
    }
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadProcessCodes();
      });
  }

  private listenNoteTextChange(): void {
    this.noteForm.get('noteText')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: string) => {
        this.currentNoteText.set(value ?? '');
      });
  }
}
