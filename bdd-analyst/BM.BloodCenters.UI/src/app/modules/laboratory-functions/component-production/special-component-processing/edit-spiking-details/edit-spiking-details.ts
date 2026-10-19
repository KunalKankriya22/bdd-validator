import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, finalize, startWith, switchMap, tap, catchError } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';

import { EditSpikingDetailsService } from './services/edit-spiking-details.service';
import {
  ComponentSpikingDto,
  ProcessCodeDropdownDto,
  SpikingTypeDropdownDto,
  ProductCodeDropdownDto,
  LotNumberDropdownDto,
  UpdateComponentSpikingDto,
} from './models/edit-spiking-details.model';

@Component({
  selector: 'app-edit-spiking-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './edit-spiking-details.html',
  styleUrls: ['./edit-spiking-details.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSpikingDetailsComponent implements OnInit, OnDestroy {
  private readonly service = inject(EditSpikingDetailsService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Edit Spiking Details', link: null },
    ],
  };

  pageTitle = 'Edit Spiking Details';
  pageSubtitle = '';

  filterForm!: FormGroup;
  editForm!: FormGroup;

  processCodes: ProcessCodeDropdownDto[] = [];
  filteredProcessCodes: ProcessCodeDropdownDto[] = [];
  processSearchControl = new FormControl('');

  productCodes: ProductCodeDropdownDto[] = [];
  filteredProductCodes: ProductCodeDropdownDto[] = [];
  productSearchControl = new FormControl('');

  spikingTypes: SpikingTypeDropdownDto[] = [];
  filteredSpikingTypes: SpikingTypeDropdownDto[] = [];
  spikingTypeSearchControl = new FormControl('');

  bagLotNumbers: LotNumberDropdownDto[] = [];
  filteredBagLotNumbers: LotNumberDropdownDto[] = [];
  bagLotSearchControl = new FormControl('');
  bagLotSearchValue = '';

  filterLotNumbers: LotNumberDropdownDto[] = [];
  filteredFilterLotNumbers: LotNumberDropdownDto[] = [];
  filterLotSearchControl = new FormControl('');
  filterLotSearchValue = '';

  currentData: ComponentSpikingDto | null = null;
  isLoading = false;
  isLoadingDropdowns = false;
  isLoadingProductCodes = false;
  isSaving = false;
  showEditForm = false;

  // Unit ID validation data from shared component
  validatedUnitData: UnitValidationResponse | null = null;

  // Store the collection date from getUnitCollectionDates for use in retrieve
  selectedCollDate: string = '';

  ngOnInit(): void {
    this.initializeForms();
    this.loadProcessCodes();
    this.subscribeToChapterChanges();
    this.subscribeToSearchControls();
    this.subscribeToLotNumberFilters();
    this.updatePageHeader();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updatePageHeader(): void {
    const menuItem = this.pageHeaderService.getCurrentMenuItem();
    this.pageTitle = menuItem?.label || 'Edit Spiking Details';
    this.pageSubtitle = menuItem?.subtitle || '';
    this.pageHeaderConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: this.pageTitle, link: null },
      ],
    };
  }

  private initializeForms(): void {
    this.filterForm = this.fb.group({
      processCode: ['', Validators.required],
      productCode: ['', Validators.required],
      componentPrefix: [''],
    });

    this.editForm = this.fb.group({
      spikingType: ['', Validators.required],
      bagLotNumber: ['', Validators.required],
      filterLotNumber: [''],
      bagsSpiked: [0, [Validators.required, Validators.min(0), Validators.max(99)]],
      bagsForComponents: [0, [Validators.required, Validators.min(0), Validators.max(99)]],
    });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.clearAll();
      this.loadProcessCodes();
    });
  }

  private subscribeToSearchControls(): void {
    this.processSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProcessCodes = this.filterProcessCodes(search || '');
        this.cdr.markForCheck();
      });

    this.productSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredProductCodes = this.filterProductCodes(search || '');
        this.cdr.markForCheck();
      });

    this.spikingTypeSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredSpikingTypes = this.filterSpikingTypes(search || '');
        this.cdr.markForCheck();
      });

    }

  private filterProcessCodes(search: string): ProcessCodeDropdownDto[] {
    if (!search) return this.processCodes;
    const lowerSearch = search.toLowerCase();
    return this.processCodes.filter(
      (p) => p.code.toLowerCase().includes(lowerSearch) || p.codeDesc.toLowerCase().includes(lowerSearch)
    );
  }

  private filterProductCodes(search: string): ProductCodeDropdownDto[] {
    if (!search) return this.productCodes;
    const lowerSearch = search.toLowerCase();
    return this.productCodes.filter((p) => p.productCode.toLowerCase().includes(lowerSearch));
  }

  private filterSpikingTypes(search: string): SpikingTypeDropdownDto[] {
    if (!search) return this.spikingTypes;
    const lowerSearch = search.toLowerCase();
    return this.spikingTypes.filter(
      (t) => t.code.toLowerCase().includes(lowerSearch) || t.codeDesc.toLowerCase().includes(lowerSearch)
    );
  }

  private filterBagLots(search: string): LotNumberDropdownDto[] {
    if (!search) return this.bagLotNumbers;
    const lowerSearch = search.toLowerCase();
    return this.bagLotNumbers.filter((lot) => lot.lotNumber.toLowerCase().includes(lowerSearch));
  }

  private filterFilterLots(search: string): LotNumberDropdownDto[] {
    if (!search) return this.filterLotNumbers;
    const lowerSearch = search.toLowerCase();
    return this.filterLotNumbers.filter((lot) => lot.lotNumber.toLowerCase().includes(lowerSearch));
  }

  private subscribeToLotNumberFilters(): void {
    this.bagLotSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        const upperSearch = (search || '').toUpperCase();
        if (search && search !== upperSearch) {
          this.bagLotSearchControl.setValue(upperSearch, { emitEvent: false });
        }
        this.bagLotSearchValue = upperSearch;
        this.filteredBagLotNumbers = this.filterBagLots(upperSearch);
        this.cdr.markForCheck();
      });

    this.filterLotSearchControl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe((search) => {
        const upperSearch = (search || '').toUpperCase();
        if (search && search !== upperSearch) {
          this.filterLotSearchControl.setValue(upperSearch, { emitEvent: false });
        }
        this.filterLotSearchValue = upperSearch;
        this.filteredFilterLotNumbers = this.filterFilterLots(upperSearch);
        this.cdr.markForCheck();
      });

    // When a custom value is selected, add it to the list so it displays properly
    this.editForm.get('bagLotNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && !this.isBagLotInList(value)) {
          this.bagLotNumbers = [{ lotNumber: value }, ...this.bagLotNumbers];
          this.filteredBagLotNumbers = [...this.bagLotNumbers];
          this.cdr.markForCheck();
        }
      });

    this.editForm.get('filterLotNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && !this.isFilterLotInList(value)) {
          this.filterLotNumbers = [{ lotNumber: value }, ...this.filterLotNumbers];
          this.filteredFilterLotNumbers = [...this.filterLotNumbers];
          this.cdr.markForCheck();
        }
      });
  }

  private loadProcessCodes(): void {
    this.service
      .getProcessCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.processCodes = codes;
          this.filteredProcessCodes = codes;
          this.cdr.markForCheck();
        },
        error: () => {
          this.processCodes = [];
          this.filteredProcessCodes = [];
          this.cdr.markForCheck();
        },
      });
  }

  getProcessDescription(): string {
    const selectedCode = this.filterForm.get('processCode')?.value;
    if (!selectedCode) return '';
    const process = this.processCodes.find((p) => p.code === selectedCode);
    return process?.codeDesc || '';
  }

  getSpikingTypeDescription(): string {
    const selectedCode = this.editForm.get('spikingType')?.value;
    if (!selectedCode) return '';
    const type = this.spikingTypes.find((t) => t.code === selectedCode);
    return type?.codeDesc || '';
  }

  onProcessChange(): void {
    this.filterForm.patchValue({ productCode: '', componentPrefix: '' });
    this.productCodes = [];
    this.validatedUnitData = null;
    this.selectedCollDate = '';
    this.unitIdField?.clear();
    this.cdr.markForCheck();
  }

  // Called when unit ID is validated by the shared UnitIdFieldComponent
  onUnitValidated(data: UnitValidationResponse): void {
    this.validatedUnitData = data;
    this.filterForm.patchValue({ productCode: '', componentPrefix: '' });
    this.productCodes = [];
    this.loadProductCodes();
    this.cdr.markForCheck();
  }

  // Called when unit ID is cleared
  onUnitCleared(): void {
    this.validatedUnitData = null;
    this.filterForm.patchValue({ productCode: '', componentPrefix: '' });
    this.productCodes = [];
    this.selectedCollDate = '';
    this.cdr.markForCheck();
  }

  private loadProductCodes(): void {
    const processCode = this.filterForm.get('processCode')?.value;
    const unitId = this.validatedUnitData?.parsedUnitId;

    if (!unitId || !processCode) {
      return;
    }

    this.isLoadingProductCodes = true;
    this.selectedCollDate = '';
    this.cdr.markForCheck();

    const chapterId = this.headerService.getCurrentChapterId() || '';

    this.service
      .getUnitCollectionDates(unitId, processCode, chapterId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((dates) => {
          if (dates && dates.length > 0) {
            const collDate = dates[0].collDate;
            this.selectedCollDate = collDate;
            return this.service.getProductCodes(unitId, collDate, processCode, chapterId);
          }
          this.productCodes = [];
          this.selectedCollDate = '';
          return of([]);
        }),
        catchError(() => {
          this.productCodes = [];
          this.selectedCollDate = '';
          return of([]);
        }),
        finalize(() => {
          this.isLoadingProductCodes = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (codes) => {
          this.productCodes = codes;
          this.filteredProductCodes = codes;
          if (codes.length === 1) {
            this.filterForm.patchValue({
              productCode: codes[0].productCode,
              componentPrefix: codes[0].componentPrefix || ''
            });
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.productCodes = [];
          this.filteredProductCodes = [];
          this.cdr.markForCheck();
        },
      });
  }

  onProductCodeChange(): void {
    const productCode = this.filterForm.get('productCode')?.value;
    if (!productCode) {
      this.filterForm.patchValue({ componentPrefix: '' });
      return;
    }

    const selectedProduct = this.productCodes.find(p => p.productCode === productCode);
    if (selectedProduct?.componentPrefix) {
      this.filterForm.patchValue({ componentPrefix: selectedProduct.componentPrefix });
    }
    this.cdr.markForCheck();
  }

  onRetrieve(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      this.showErrorSnackbar('Please fill all required fields.');
      return;
    }

    if (!this.unitIdField?.isValid || !this.validatedUnitData) {
      this.showErrorSnackbar('Please enter a valid Unit ID.');
      return;
    }

    if (!this.selectedCollDate) {
      this.showErrorSnackbar('No collection date found for this unit.');
      return;
    }

    this.isLoading = true;
    this.showEditForm = false;
    this.currentData = null;

    const { processCode, productCode, componentPrefix } = this.filterForm.value;
    const unitId = this.validatedUnitData.parsedUnitId;

    this.service
      .getByKey(unitId, this.selectedCollDate, productCode, componentPrefix, processCode)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.currentData = data;
            this.showEditForm = true;
            this.loadEditDropdowns(data);
          } else {
            this.showErrorSnackbar('No spiking record found for the specified criteria.');
          }
        },
        error: (error) => {
          this.showErrorSnackbar(
            error?.error?.message || 'An error occurred while retrieving spiking details.'
          );
        },
      });
  }

  private loadEditDropdowns(data: ComponentSpikingDto): void {
    this.isLoadingDropdowns = true;

    forkJoin({
      spikingTypes: this.service.getSpikingTypes(),
      bagLotNumbers: this.service.getBagLotNumbers(),
      filterLotNumbers: this.service.getFilterLotNumbers(),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingDropdowns = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (result) => {
          this.spikingTypes = result.spikingTypes;
          this.filteredSpikingTypes = result.spikingTypes;
          this.bagLotNumbers = result.bagLotNumbers;
          this.filterLotNumbers = result.filterLotNumbers;
          this.filteredBagLotNumbers = [...this.bagLotNumbers];
          this.filteredFilterLotNumbers = [...this.filterLotNumbers];
          this.populateEditForm(data);
        },
        error: () => {
          this.spikingTypes = [];
          this.filteredSpikingTypes = [];
          this.bagLotNumbers = [];
          this.filterLotNumbers = [];
          this.populateEditForm(data);
        },
      });
  }

  private populateEditForm(data: ComponentSpikingDto): void {
    // Add retrieved values to dropdown lists if not present
    if (data.bagLotNumber && !this.isBagLotInList(data.bagLotNumber)) {
      this.bagLotNumbers = [{ lotNumber: data.bagLotNumber }, ...this.bagLotNumbers];
      this.filteredBagLotNumbers = [...this.bagLotNumbers];
    }

    if (data.filterLotNumber && !this.isFilterLotInList(data.filterLotNumber)) {
      this.filterLotNumbers = [{ lotNumber: data.filterLotNumber }, ...this.filterLotNumbers];
      this.filteredFilterLotNumbers = [...this.filterLotNumbers];
    }

    this.editForm.patchValue({
      spikingType: data.spikingType,
      bagLotNumber: data.bagLotNumber,
      filterLotNumber: data.filterLotNumber || '',
      bagsSpiked: data.bagsSpiked,
      bagsForComponents: data.bagsForComponents,
    });
  }

  onCancel(): void {
    this.showEditForm = false;
    this.currentData = null;
    this.editForm.reset();
    this.cdr.markForCheck();
  }

  onSave(): void {
    if (this.editForm.invalid || !this.currentData) {
      this.editForm.markAllAsTouched();
      return;
    }

    const bagsUsed = this.currentData.bagsUsed;
    const bagsSpiked = this.editForm.get('bagsSpiked')?.value;
    const bagsForComponents = this.editForm.get('bagsForComponents')?.value;

    if (bagsSpiked < bagsUsed) {
      this.showErrorSnackbar('Bags spiked cannot be less than bags used.');
      return;
    }

    if (bagsForComponents > bagsSpiked) {
      this.showErrorSnackbar('Bags for components cannot exceed bags spiked.');
      return;
    }

    if (bagsForComponents < bagsUsed) {
      this.showErrorSnackbar('Bags for components cannot be less than bags used.');
      return;
    }

    this.isSaving = true;

    const dto: UpdateComponentSpikingDto = {
      spikingType: this.editForm.get('spikingType')?.value,
      bagLotNumber: this.editForm.get('bagLotNumber')?.value,
      filterLotNumber: this.editForm.get('filterLotNumber')?.value || null,
      bagsSpiked: bagsSpiked,
      bagsForComponents: bagsForComponents,
    };

    this.service
      .update(
        this.currentData.unitId,
        this.currentData.collDate,
        this.currentData.productCode,
        this.currentData.componentPrefix,
        this.currentData.processCode,
        dto
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.showSuccessSnackbar(
            `Spiking details for unit ${this.currentData!.unitId} updated successfully.`
          );
          this.clearAll();
        },
        error: (error) => {
          this.showErrorSnackbar(
            error?.error?.message || 'An error occurred while updating spiking details.'
          );
        },
      });
  }

  clearAll(): void {
    this.filterForm.reset();
    this.editForm.reset();
    this.showEditForm = false;
    this.currentData = null;
    this.productCodes = [];
    this.validatedUnitData = null;
    this.selectedCollDate = '';
    this.unitIdField?.clear();
    this.cdr.markForCheck();
  }

  private showSuccessSnackbar(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showErrorSnackbar(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  isFilterFieldInvalid(fieldName: string): boolean {
    const control = this.filterForm.get(fieldName);
    return !!control && control.invalid && control.touched;
  }

  isEditFieldInvalid(fieldName: string): boolean {
    const control = this.editForm.get(fieldName);
    return !!control && control.invalid && control.touched;
  }

  onNumericKeyPress(event: KeyboardEvent): void {
    const charCode = event.which || event.keyCode;
    // Only allow digits 0-9
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return;
    }
    // Prevent typing if already 2 digits
    const input = event.target as HTMLInputElement;
    if (input.value.length >= 2 && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }

  onPasteNumeric(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '').substring(0, 2);
    const input = event.target as HTMLInputElement;
    input.value = numericOnly;
    input.dispatchEvent(new Event('input'));
  }

  isBagLotInList(value: string): boolean {
    if (!value) return true;
    return this.bagLotNumbers.some(lot => lot.lotNumber.toLowerCase() === value.toLowerCase());
  }

  isFilterLotInList(value: string): boolean {
    if (!value) return true;
    return this.filterLotNumbers.some(lot => lot.lotNumber.toLowerCase() === value.toLowerCase());
  }
}
