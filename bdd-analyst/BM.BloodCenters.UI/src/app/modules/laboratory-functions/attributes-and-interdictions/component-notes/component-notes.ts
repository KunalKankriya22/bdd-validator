import { Component, OnInit, OnDestroy, signal, computed, ViewChild, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';

import { UnitIdFieldComponent } from '@shared/components/unit-id-field';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import { ComponentNotesApiService } from './services/component-notes-api.service';
import {
  ComponentNotesFormState,
  ProductOption,
  FIELD_LENGTHS
} from './models/component-notes.model';

@Component({
  selector: 'app-component-notes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    LoadingSpinnerComponent,
    MatTooltipModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './component-notes.html',
  styleUrls: ['./component-notes.scss']
})
export class ComponentNotesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiService = inject(ComponentNotesApiService);
  private snackbarService = inject(SnackbarService);
  private loggingService = inject(LoggingService);
  private pageHeaderService = inject(PageHeaderService);
  private headerService = inject(HeaderService);

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;
  @ViewChild('productSelect') productSelect!: MatSelect;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Component Notes', link: null }
    ],
    title: 'Component Notes',
    subtitle: 'Document details of interest at the component level.',
    showBackButton: false
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        untracked(() => {
          this.headerConfig = {
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null }
            ],
            title: pageData.title,
            subtitle: pageData.subtitle || 'Document details of interest at the component level.',
            showBackButton: false
          };
        });
      }
    });
  }

  formState = signal<ComponentNotesFormState>({
    unitId: '',
    collectionDate: '',
    collectionDateRaw: '',
    productCode: '',
    productDescription: '',
    componentPrefix: '',
    isUnitValidated: false,
    isProductSelected: false
  });

  viewState = signal<'initial' | 'unit-loaded' | 'note-form'>('initial');

  availableProducts = signal<ProductOption[]>([]);
  filteredProducts = signal<ProductOption[]>([]);
  productSearchControl = new FormControl('');

  noteText = signal('');
  originalNote = signal('');

  loading = signal<boolean>(false);
  saving = signal<boolean>(false);

  readonly FIELD_LENGTHS = FIELD_LENGTHS;

  unitFound = computed(() => this.formState().isUnitValidated);
  canRetrieve = computed(() =>
    this.formState().isUnitValidated && this.formState().isProductSelected && !this.loading()
  );
  canSave = computed(() =>
    this.noteText().trim().length > 0 && !this.saving()
  );
  charsRemaining = computed(() => FIELD_LENGTHS.NOTE_MAX - this.noteText().length);
  showEmptyState = computed(() => this.viewState() !== 'note-form');

  ngOnInit(): void {
    this.setupProductSearch();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupProductSearch(): void {
    this.productSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        this.filterProducts(searchTerm || '');
      });
  }

  private filterProducts(searchTerm: string): void {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredProducts.set(this.availableProducts());
      return;
    }
    const filtered = this.availableProducts().filter(product =>
      product.productCode.toLowerCase().includes(term) ||
      product.productDesc.toLowerCase().includes(term)
    );
    this.filteredProducts.set(filtered);
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
      });
  }

  formatCollectionDate(): string {
    const date = this.formState().collectionDateRaw;
    if (!date) return '-';

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  onUnitValidated(event: UnitValidationResponse): void {
    this.loggingService.debug('Unit validated', event);
    this.loading.set(true);

    this.apiService.validateUnit(event.parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (unitData) => {
          this.loggingService.debug('Unit validated, fetching products', unitData);

          if (!unitData.hasComponents) {
            this.snackbarService.showError('No acceptable components have been made from this unit');
            this.loading.set(false);
            this.clearForm();
            return;
          }

          this.apiService.getProducts(unitData.unitId, unitData.collDate)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => this.loading.set(false))
            )
            .subscribe({
              next: (products) => {
                this.formState.update(state => ({
                  ...state,
                  unitId: unitData.unitId,
                  collectionDateRaw: unitData.collDate,
                  collectionDate: this.formatDateForDisplay(unitData.collDate),
                  isUnitValidated: true,
                  productCode: '',
                  productDescription: '',
                  componentPrefix: '',
                  isProductSelected: false
                }));

                this.availableProducts.set(products);
                this.filteredProducts.set(products);
                this.viewState.set('unit-loaded');
                this.noteText.set('');
                this.originalNote.set('');

                if (products.length === 0) {
                  this.snackbarService.showInfo('No products found for this unit');
                }
              },
              error: (error) => {
                this.loggingService.error('Failed to get products', error);
                this.snackbarService.showError('Failed to retrieve products for this unit');
                this.loading.set(false);
              }
            });
        },
        error: (error) => {
          this.loggingService.error('Unit validation failed', error);
          const errorMessage = error?.message || 'Failed to validate unit';
          const errorCode = error?.errorCode;
          const displayMessage = errorCode
            ? `${errorCode}: ${errorMessage}`
            : errorMessage;
          this.snackbarService.showError(displayMessage);
          this.loading.set(false);
          this.clearForm();
        }
      });
  }

  onUnitCleared(): void {
    this.clearForm();
  }

  onProductChange(productCode: string): void {
    const product = this.availableProducts().find(p => p.productCode === productCode);
    if (product) {
      this.formState.update(state => ({
        ...state,
        productCode: product.productCode,
        productDescription: this.formatProductDescription(product.productDesc),
        isProductSelected: true
      }));
      this.viewState.set('unit-loaded');
      this.noteText.set('');
      this.originalNote.set('');
    }
  }

  formatProductDescription(desc: string): string {
    if (!desc) return '';
    const pipeIndex = desc.indexOf('|');
    return pipeIndex > -1 ? desc.substring(0, pipeIndex) : desc;
  }

  onRetrieve(): void {
    if (!this.formState().isUnitValidated || !this.formState().isProductSelected) {
      this.snackbarService.showError('Please select a Unit ID and Product Code');
      return;
    }

    const state = this.formState();
    this.loading.set(true);

    this.apiService.getComponentPrefixes(state.unitId, state.collectionDateRaw, state.productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prefixes) => {
          const prefix = prefixes.length > 0 ? prefixes[0].componentPrefix : '00';

          this.formState.update(s => ({ ...s, componentPrefix: prefix }));

          this.apiService.getNote(state.unitId, state.collectionDateRaw, state.productCode, prefix)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => this.loading.set(false))
            )
            .subscribe({
              next: (noteData) => {
                const existingNote = noteData?.note || '';
                this.noteText.set(existingNote);
                this.originalNote.set(existingNote);
                this.viewState.set('note-form');
              },
              error: (error) => {
                this.loggingService.error('Failed to get note', error);
                this.noteText.set('');
                this.originalNote.set('');
                this.viewState.set('note-form');
              }
            });
        },
        error: (error) => {
          this.loggingService.error('Failed to get component prefixes', error);
          this.snackbarService.showError('Failed to retrieve component data');
          this.loading.set(false);
        }
      });
  }

  onSave(): void {
    if (!this.noteText().trim()) return;

    const state = this.formState();
    this.saving.set(true);

    this.apiService.saveNote({
      unitId: state.unitId,
      collDate: state.collectionDateRaw,
      productCode: state.productCode,
      componentPrefix: state.componentPrefix,
      note: this.noteText().trim()
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: (response) => {
          this.snackbarService.showSuccess(response.message);
          this.onClearAll();
        },
        error: (error) => {
          this.loggingService.error('Failed to save note', error);
          const errorMessage = error?.message || 'Failed to save component note';
          this.snackbarService.showError(errorMessage);
        }
      }); 
  }

  onCancel(): void {
    this.noteText.set('');
    this.originalNote.set('');
    this.viewState.set('unit-loaded');
  }

  onClearAll(): void {
    this.formState.set({
      unitId: '',
      collectionDate: '',
      collectionDateRaw: '',
      productCode: '',
      productDescription: '',
      componentPrefix: '',
      isUnitValidated: false,
      isProductSelected: false
    });

    this.viewState.set('initial');
    this.loading.set(false);
    this.saving.set(false);
    this.availableProducts.set([]);
    this.filteredProducts.set([]);
    this.noteText.set('');
    this.originalNote.set('');
    this.productSearchControl.setValue('');

    if (this.unitIdField) {
      this.unitIdField.clear();
    }
  }

  onNoteInput(value: string): void {
    if (value.length <= FIELD_LENGTHS.NOTE_MAX) {
      this.noteText.set(value);
    }
  }

  private formatDateForDisplay(isoDate: string): string {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private clearForm(): void {
    this.formState.set({
      unitId: '',
      collectionDate: '',
      collectionDateRaw: '',
      productCode: '',
      productDescription: '',
      componentPrefix: '',
      isUnitValidated: false,
      isProductSelected: false
    });
    this.viewState.set('initial');
    this.availableProducts.set([]);
    this.filteredProducts.set([]);
    this.noteText.set('');
    this.originalNote.set('');
  }
}
