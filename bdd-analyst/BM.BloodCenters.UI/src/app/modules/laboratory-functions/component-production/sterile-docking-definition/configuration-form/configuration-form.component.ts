import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
  inject,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, of } from 'rxjs';
import { takeUntil, debounceTime, switchMap } from 'rxjs/operators';
import moment from 'moment';

import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { SterileDockingLovService } from '../services/sterile-docking-lov.service';
import {
  DockingConfigurationDto,
  DockingConfigurationFormData,
  DockingType,
  DockingTypeOption,
  LovOption,
  AttributeCodeLovOption
} from '../models/sterile-docking-definition.model';
import { dockingTypeConditionalValidator } from '../utils/docking-type-validator.util';
import {
  trimmedMaxLengthValidator,
  positiveIntegerValidator,
  codeFieldValidator,
  getInputValidationError
} from '@shared/validators/input.validators';

@Component({
  selector: 'app-configuration-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './configuration-form.component.html',
  styleUrl: './configuration-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigurationFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly lovService = inject(SterileDockingLovService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly destroy$ = new Subject<void>();
  private readonly cancelDropdownReload$ = new Subject<void>();

  @Input() initialData?: DockingConfigurationFormData | null;
  @Output() submit = new EventEmitter<{ configData: any; formData: any }>();
  @Output() cancel = new EventEmitter<void>();
  @ViewChild('processDateInput') processDateInput?: ElementRef<HTMLInputElement>;

  // Form
  form!: FormGroup;

  // LOV data - using regular arrays (not signals) to match working pattern in other modules
  dockingTypes: DockingTypeOption[] = [];
  machineCodes: LovOption[] = [];
  waferLots: LovOption[] = [];
  catalogNumbers: LovOption[] = [];
  bagLots: LovOption[] = [];
  filterTypes: LovOption[] = [];
  filterLots: LovOption[] = [];
  attributeCodes: AttributeCodeLovOption[] = [];

  // Search controls for dropdowns
  dockingTypeSearchCtrl = new FormControl('');
  machineSearchCtrl = new FormControl('');
  waferSearchCtrl = new FormControl('');
  catalogSearchCtrl = new FormControl('');
  lotSearchCtrl = new FormControl('');
  attributeSearchCtrl = new FormControl('');
  filterTypeSearchCtrl = new FormControl('');
  filterLotSearchCtrl = new FormControl('');

  // Filtered arrays for searchable dropdowns (not observables!)
  filteredDockingTypes: DockingTypeOption[] = [];
  filteredMachines: LovOption[] = [];
  filteredWafers: LovOption[] = [];
  filteredCatalogs: LovOption[] = [];
  filteredBagLots: LovOption[] = [];
  filteredFilterTypes: LovOption[] = [];
  filteredFilterLots: LovOption[] = [];
  filteredAttributes: AttributeCodeLovOption[] = [];

  constructor() {
    // Set up effect to initialize process date with current date/time
    effect(() => {
      this.setProcessDate();
    });
  }

  private setProcessDate(): void {
    if (this.form) {
      const chapterNow = this.getChapterLocalNow();
      const formatted = chapterNow.format('MM-DD-YY HH:mm');
      this.form.patchValue({ processDate: formatted }, { emitEvent: false });
    }
  }

  private getChapterLocalNow(): moment.Moment {
    const chapterTimezone = this.headerService.getCurrentChapterTimezone();
    if (chapterTimezone) {
      return moment().utcOffset(chapterTimezone);
    }
    return moment();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupSearchControls();
    this.loadAllLovs();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset form and reload LOVs when chapter changes
        this.form.reset();
        this.initializeForm();
        this.setProcessDate();
        this.loadAllLovs();
      });
  }

  private initializeForm(): void {
    this.form = this.fb.group(
      {
        // Row 1
        dockingType: ['', [Validators.required]],
        description: [{ value: '', disabled: true }], // Auto-populated from dockingType, read-only
        machineCode: ['', [Validators.required, codeFieldValidator()]],
        waferLotNumber: ['', [Validators.required]],

        // Row 2
        numberOfUnits: [null, [Validators.required, positiveIntegerValidator(1, 999)]],
        bagCatalogNumber: ['', [Validators.required]],
        bagLotNumber: ['', [Validators.required]],
        filterType: [''], // Conditional: required when dockingType = FI/FB/BF
        filterLotNumber: [''], // Conditional: required when dockingType = FI/FB/BF

        // Row 3
        numberOfComponents: [null, [Validators.required, positiveIntegerValidator()]],
        attributeCode: [''],
        attributeDescription: [{ value: '', disabled: true }],
        processDate: [''],

        // Segment fields (SE docking type only)
        segmentRemFlag: [''],
        segmentNumber: ['']
      },
      { validators: [dockingTypeConditionalValidator()] }
    );

    // Add listener to log form status changes
    this.form.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(status => {
      console.log('[ConfigurationFormComponent] Form status changed:', status);
      console.log('[ConfigurationFormComponent] Form errors:', this.form.errors);
      console.log('[ConfigurationFormComponent] Form value:', this.form.value);

      // Log which fields are invalid
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          console.log(`[ConfigurationFormComponent] Invalid field: ${key}`, control.errors);
        }
      });
    });

    // Watch for docking type changes
    this.form.get('dockingType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.onDockingTypeChange(value));

    // Watch for attribute code changes
    this.form.get('attributeCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.onAttributeCodeChange(value));

    // Watch for catalog number changes — reload lot numbers filtered by docking type + catalog
    this.form.get('bagCatalogNumber')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        switchMap((catalogNumber) => {
          const dockingType = this.form.get('dockingType')?.value;
          if (dockingType && catalogNumber) {
            return this.lovService.getFilteredDropdowns(dockingType, catalogNumber);
          }
          return of(null);
        })
      )
      .subscribe(filters => {
        if (filters) {
          this.bagLots = filters.bagLots || [];
          this.filteredBagLots = this.bagLots;
          this.form.patchValue({ bagLotNumber: '' }, { emitEvent: false });
          this.cdr.markForCheck();
        }
      });

    // Filter type changes handled via (selectionChange) in template — see onFilterTypeChanged()

    // Patch initial data if provided
    if (this.initialData) {
      this.form.patchValue(this.initialData);
    }
  }

  private loadAllLovs(): void {
    console.log('[ConfigurationFormComponent] loadAllLovs() called');

    // Load all LOVs from the /filters endpoint
    console.log('[ConfigurationFormComponent] Subscribing to getDockingTypes()');
    this.lovService.getDockingTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          console.log('[ConfigurationFormComponent] Docking types received:', types);
          console.log('[ConfigurationFormComponent] Docking types count:', types.length);
          this.dockingTypes = types;
          this.filteredDockingTypes = types;
          this.cdr.markForCheck();
        },
        error: (err) => console.error('[ConfigurationFormComponent] Error loading docking types:', err)
      });

    console.log('[ConfigurationFormComponent] Subscribing to getMachineCodes()');
    this.lovService.getMachineCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          console.log('[ConfigurationFormComponent] Machine codes received:', codes);
          console.log('[ConfigurationFormComponent] Machine codes count:', codes.length);
          this.machineCodes = codes;
          this.filteredMachines = codes; // Update filtered array
          this.cdr.markForCheck();
        },
        error: (err) => console.error('[ConfigurationFormComponent] Error loading machine codes:', err)
      });

    console.log('[ConfigurationFormComponent] Subscribing to getWaferLots()');
    this.lovService.getWaferLots()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lots => {
        console.log('[ConfigurationFormComponent] Wafer lots received:', lots.length, 'items');
        this.waferLots = lots;
        this.filteredWafers = lots;
        this.cdr.markForCheck();
      });

    console.log('[ConfigurationFormComponent] Subscribing to getCatalogNumbers()');
    this.lovService.getCatalogNumbers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(catalogs => {
        console.log('[ConfigurationFormComponent] Catalog numbers received:', catalogs.length, 'items');
        this.catalogNumbers = catalogs;
        this.filteredCatalogs = catalogs;
        this.cdr.markForCheck();
      });

    console.log('[ConfigurationFormComponent] Subscribing to getBagLots()');
    this.lovService.getBagLots()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lots => {
        console.log('[ConfigurationFormComponent] Bag lots received:', lots.length, 'items');
        this.bagLots = lots;
        this.filteredBagLots = lots;
        this.cdr.markForCheck();
      });

    console.log('[ConfigurationFormComponent] Subscribing to getFilterTypes()');
    this.lovService.getFilterTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(types => {
        console.log('[ConfigurationFormComponent] Filter types received:', types.length, 'items');
        this.filterTypes = types;
        this.filteredFilterTypes = types;
        this.cdr.markForCheck();
      });

    console.log('[ConfigurationFormComponent] Subscribing to getFilterLots()');
    this.lovService.getFilterLots()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lots => {
        console.log('[ConfigurationFormComponent] Filter lots received:', lots.length, 'items');
        this.filterLots = lots;
        this.filteredFilterLots = lots;
        this.cdr.markForCheck();
      });

    console.log('[ConfigurationFormComponent] Subscribing to getAttributeCodes()');
    this.lovService.getAttributeCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(codes => {
        console.log('[ConfigurationFormComponent] Attribute codes received:', codes.length, 'items');
        this.attributeCodes = codes;
        this.filteredAttributes = codes;
        this.cdr.markForCheck();
      });
  }

  private setupSearchControls(): void {
    console.log('[ConfigurationFormComponent] setupSearchControls() called');

    // Initialize filtered arrays with full data
    this.filteredDockingTypes = this.dockingTypes;
    this.filteredMachines = this.machineCodes;
    this.filteredWafers = this.waferLots;
    this.filteredCatalogs = this.catalogNumbers;
    this.filteredBagLots = this.bagLots;
    this.filteredAttributes = this.attributeCodes;
    this.filteredFilterTypes = this.filterTypes;
    this.filteredFilterLots = this.filterLots;

    // Docking type search
    this.dockingTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((search) => {
        if (!search) {
          this.filteredDockingTypes = this.dockingTypes;
        } else {
          const s = search.toLowerCase();
          this.filteredDockingTypes = this.dockingTypes.filter(
            t => t.code.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s)
          );
        }
        this.cdr.markForCheck();
      });

    // Machine codes search - subscribe and update filtered array
    this.machineSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((search) => {
        console.log('[ConfigurationFormComponent] Filtering machines, search:', search);
        this.filteredMachines = this.filterOptions(this.machineCodes, search);
        this.cdr.markForCheck();
      });

    // Wafer lots search
    this.waferSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((search) => {
        this.filteredWafers = this.filterOptions(this.waferLots, search);
        this.cdr.markForCheck();
      });

    // Catalog numbers search
    this.catalogSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((search) => {
        this.filteredCatalogs = this.filterOptions(this.catalogNumbers, search);
        this.cdr.markForCheck();
      });

    // Bag lots search
    this.lotSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((search) => {
        this.filteredBagLots = this.filterOptions(this.bagLots, search);
        this.cdr.markForCheck();
      });

    // Attribute codes search
    this.attributeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((search) => {
        this.filteredAttributes = this.filterAttributeOptions(this.attributeCodes, search);
        this.cdr.markForCheck();
      });

    // Filter type search
    this.filterTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((search) => {
        this.filteredFilterTypes = this.filterOptions(this.filterTypes, search);
        this.cdr.markForCheck();
      });

    // Filter lot search
    this.filterLotSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((search) => {
        this.filteredFilterLots = this.filterOptions(this.filterLots, search);
        this.cdr.markForCheck();
      });

    console.log('[ConfigurationFormComponent] Search controls setup complete');
  }

  private filterOptions(options: LovOption[], search: string | null): LovOption[] {
    if (!search) {
      return options;
    }
    const searchLower = search.toLowerCase();
    return options.filter(
      option =>
        option.code.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    );
  }

  private filterAttributeOptions(
    options: AttributeCodeLovOption[],
    search: string | null
  ): AttributeCodeLovOption[] {
    if (!search) {
      return options;
    }
    const searchLower = search.toLowerCase();
    return options.filter(
      option =>
        option.code.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    );
  }

  onDockingTypeChange(type: DockingType): void {
    // Auto-populate description from docking type (disabled control)
    const descriptionControl = this.form.get('description');
    if (type) {
      const selectedType = this.dockingTypes.find(dt => dt.code === type);
      if (selectedType && descriptionControl) {
        descriptionControl.setValue(selectedType.description || '', { emitEvent: false });
      }
    } else {
      descriptionControl?.setValue('', { emitEvent: false });
    }

    // Handle conditional validators for filter fields
    const requiresFilter = ['FI', 'FB', 'BF'].includes(type);

    const filterTypeControl = this.form.get('filterType');
    const filterLotControl = this.form.get('filterLotNumber');

    if (requiresFilter) {
      filterTypeControl?.setValidators([Validators.required]);
      filterLotControl?.setValidators([Validators.required]);
    } else {
      filterTypeControl?.clearValidators();
      filterLotControl?.clearValidators();
      filterTypeControl?.setValue('');
      filterLotControl?.setValue('');
    }

    filterTypeControl?.updateValueAndValidity();
    filterLotControl?.updateValueAndValidity();

    // Handle segment fields for SE type
    const requiresSegment = type === 'SE';
    const segmentRemFlagControl = this.form.get('segmentRemFlag');
    const segmentNumberControl = this.form.get('segmentNumber');

    if (requiresSegment) {
      segmentRemFlagControl?.setValidators([Validators.required]);
      segmentNumberControl?.setValidators([Validators.required]);
    } else {
      segmentRemFlagControl?.clearValidators();
      segmentNumberControl?.clearValidators();
      segmentRemFlagControl?.setValue('');
      segmentNumberControl?.setValue('');
    }

    segmentRemFlagControl?.updateValueAndValidity();
    segmentNumberControl?.updateValueAndValidity();

    // Disable attributeCode for BA, FI, SE, NE; required for FB/BF (FMB error 0114)
    const attributeCodeControl = this.form.get('attributeCode');
    const attributeDescControl = this.form.get('attributeDescription');
    if (['BA', 'FI', 'SE', 'NE'].includes(type)) {
      attributeCodeControl?.disable();
      attributeCodeControl?.clearValidators();
      attributeCodeControl?.setValue('');
      attributeDescControl?.setValue('', { emitEvent: false });
    } else {
      attributeCodeControl?.enable();
      attributeCodeControl?.setValidators([Validators.required]);
    }
    attributeCodeControl?.updateValueAndValidity();

    // Disable numberOfComponents for FI, SE, NE; enforce >0 for FB/BF (errors 0117, 0128)
    const numberOfComponentsControl = this.form.get('numberOfComponents');
    if (['FI', 'SE', 'NE'].includes(type)) {
      numberOfComponentsControl?.disable();
      numberOfComponentsControl?.setValue(0);
    } else if (['FB', 'BF'].includes(type)) {
      numberOfComponentsControl?.enable();
      numberOfComponentsControl?.setValidators([Validators.required, positiveIntegerValidator(1, 999)]);
      numberOfComponentsControl?.updateValueAndValidity();
    } else {
      numberOfComponentsControl?.enable();
      numberOfComponentsControl?.setValidators([Validators.required, positiveIntegerValidator()]);
      numberOfComponentsControl?.updateValueAndValidity();
    }

    // Disable bagCatalogNumber for FI, FB, SE, NE (FMB: catalog_number navigable=false for FI/SE/NE)
    const bagCatalogControl = this.form.get('bagCatalogNumber');
    if (['FI', 'FB', 'SE', 'NE'].includes(type)) {
      bagCatalogControl?.disable();
      bagCatalogControl?.setValue('');
    } else {
      bagCatalogControl?.enable();
    }

    // Disable bagLotNumber for FI, FB (FMB: lot_number navigable property_false)
    const bagLotControl = this.form.get('bagLotNumber');
    if (['FI', 'FB'].includes(type)) {
      bagLotControl?.disable();
      bagLotControl?.setValue('');
    } else {
      bagLotControl?.enable();
    }

    // Reload catalog numbers and lot numbers filtered by docking type
    if (type) {
      this.cancelDropdownReload$.next();
      this.lovService.getFilteredDropdowns(type)
        .pipe(takeUntil(this.cancelDropdownReload$), takeUntil(this.destroy$))
        .subscribe(filters => {
          this.catalogNumbers = filters.catalogNumbers || [];
          this.filteredCatalogs = this.catalogNumbers;
          this.bagLots = filters.bagLots || [];
          this.filteredBagLots = this.bagLots;
          // Update filter types and lots filtered by docking type
          if (filters.filterTypes) {
            this.filterTypes = filters.filterTypes;
            this.filteredFilterTypes = this.filterTypes;
          }
          if (filters.filterLots) {
            this.filterLots = filters.filterLots;
            this.filteredFilterLots = this.filterLots;
          }
          // Also update wafer lots if returned (prevents race condition with initial load)
          if (filters.waferLots && filters.waferLots.length > 0) {
            this.waferLots = filters.waferLots;
            this.filteredWafers = this.waferLots;
          }
          this.attributeCodes = [];
          this.filteredAttributes = [];
          this.form.patchValue({ bagCatalogNumber: '', bagLotNumber: '', filterType: '', filterLotNumber: '', attributeCode: '', attributeDescription: '' }, { emitEvent: false });
          this.cdr.markForCheck();
        });
    }
  }

  private parseFilterTypeValue(value: string): { code: string; productType: string } {
    const idx = value.indexOf('::');
    if (idx === -1) return { code: value, productType: '' };
    return { code: value.substring(0, idx), productType: value.substring(idx + 2) };
  }

  getFilterTypeDisplay(): string {
    const val = this.form.get('filterType')?.value;
    if (!val) return '';
    return this.parseFilterTypeValue(val).code;
  }

  onFilterTypeSelectionChange(compositeValue: string): void {
    this.form.patchValue({ filterLotNumber: '', attributeCode: '', attributeDescription: '' }, { emitEvent: false });
    if (compositeValue) {
      const { productType } = this.parseFilterTypeValue(compositeValue);
      this.reloadAttributeCodesForFilterType(productType);
    } else {
      this.attributeCodes = [];
      this.filteredAttributes = [];
    }
    this.cdr.markForCheck();
  }

  private reloadAttributeCodesForFilterType(productType?: string): void {
    const dockingType = this.form.get('dockingType')?.value;

    if (dockingType && productType) {
      this.lovService.getFilteredDropdowns(dockingType, undefined, productType)
        .pipe(takeUntil(this.destroy$))
        .subscribe(filters => {
          this.attributeCodes = filters.attributeCodes || [];
          this.filteredAttributes = this.attributeCodes;
          this.cdr.markForCheck();
        });
    }
  }

  onAttributeCodeChange(code: string): void {
    if (!code) {
      this.form.patchValue({ attributeDescription: '' }, { emitEvent: false });
      return;
    }

    // Find the attribute in the list and populate description
    const attribute = this.attributeCodes.find(attr => attr.code === code);
    if (attribute) {
      this.form.patchValue(
        { attributeDescription: attribute.description || '' },
        { emitEvent: false }
      );
    }
  }

  showFilterFields(): boolean {
    const dockingType = this.form.get('dockingType')?.value;
    return ['FI', 'FB', 'BF'].includes(dockingType);
  }

  showSegmentFields(): boolean {
    return this.form.get('dockingType')?.value === 'SE';
  }

  onCatalogBarcodeScan(scanValue: string): void {
    if (!scanValue || scanValue.trim().length === 0) return;

    this.lovService.parseCatalogBarcode(scanValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            if (result.catalogNumber) {
              this.form.patchValue({ bagCatalogNumber: result.catalogNumber });
            }
            if (result.lotNumber) {
              this.form.patchValue({ bagLotNumber: result.lotNumber });
            }
            this.form.get('catalogBarcodeScan')?.setValue('');
            this.cdr.markForCheck();
          } else {
            this.snackbarService.showError(result.errorMessage || 'Invalid barcode format');
          }
        },
        error: () => {
          this.snackbarService.showError('Failed to parse barcode');
        }
      });
  }

  private readonly fieldLabels: Record<string, string> = {
    dockingType: 'Docking Type',
    description: 'Description',
    machineCode: 'Machine Code',
    waferLotNumber: 'Wafer Lot',
    numberOfUnits: 'Number of Units',
    bagCatalogNumber: 'Bag Catalog No',
    bagLotNumber: 'Bag Lot Number',
    filterType: 'Filter Type',
    filterLotNumber: 'Filter Lot Number',
    numberOfComponents: 'Number of Components',
    attributeCode: 'Attribute Code',
    attributeDescription: 'Attribute Description',
    processDate: 'Process Date',
    segmentRemFlag: 'Segment Removal Flag',
    segmentNumber: 'Segment Number'
  };

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    const label = this.fieldLabels[fieldName] || fieldName;
    return getInputValidationError(control, label);
  }

  onSubmit(): void {
    console.log('[ConfigurationFormComponent] onSubmit() called');
    console.log('[ConfigurationFormComponent] Form valid?', this.form.valid);
    console.log('[ConfigurationFormComponent] Form value:', this.form.value);

    if (this.form.invalid) {
      console.warn('[ConfigurationFormComponent] Form is invalid, marking fields as touched');
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.form.getRawValue();
    console.log('[ConfigurationFormComponent] Form raw value:', formValue);

    // Get chapterId from HeaderService
    const chapterId = this.headerService.getCurrentChapterId();
    console.log('[ConfigurationFormComponent] Chapter ID from HeaderService:', chapterId);

    if (!chapterId) {
      console.error('[ConfigurationFormComponent] Cannot submit: chapterId is required');
      alert('Chapter ID is required. Please ensure you are logged in.');
      return;
    }

    // Format collection date to YYYY-MM-DD using chapter local time
    const collDate = this.getChapterLocalNow().format('YYYY-MM-DD');
    console.log('[ConfigurationFormComponent] Collection date:', collDate);

    // Build configuration data (no API call - stored in memory only)
    const configData = {
      chapterId: chapterId,
      collDate: collDate,
      itemInd: formValue.dockingType,  // Map dockingType to itemInd for DTO
      dockingType: formValue.dockingType,
      description: formValue.description,
      sterileMachine: formValue.machineCode,  // Map machineCode to sterileMachine for DTO
      waferLotNumber: formValue.waferLotNumber,
      bagCatalogNumber: formValue.bagCatalogNumber,
      lotNumber: formValue.bagLotNumber,  // Map bagLotNumber to lotNumber for DTO
      filterType: this.parseFilterTypeValue(formValue.filterType || '').code,
      productType: this.parseFilterTypeValue(formValue.filterType || '').productType || undefined,
      filterLotNumber: formValue.filterLotNumber,
      numberOfItems: formValue.numberOfUnits,  // Map numberOfUnits to numberOfItems for DTO
      numberOfComponents: formValue.numberOfComponents,
      numberOfBags: formValue.numberOfComponents,
      attributeCode: formValue.attributeCode,
      attribCode: formValue.attributeCode,
      attribGroup: this.attributeCodes.find(a => a.code === formValue.attributeCode)?.attributeGroup || '',
      attributeDescription: formValue.attributeDescription,
      processDate: this.getChapterLocalNow().format('YYYY-MM-DDTHH:mm:ss'),
      processDateDisplay: formValue.processDate,
      catalogNumber: formValue.bagCatalogNumber,
      numberOfUnitsEntered: formValue.numberOfUnits,
      segmentRemFlag: formValue.segmentRemFlag || undefined,
      segmentNumber: formValue.segmentNumber || undefined
    };

    console.log('[ConfigurationFormComponent] Configuration data:', configData);
    console.log('[ConfigurationFormComponent] Emitting submit event (no API call)...');
    // Emit configuration data to parent - NO database save at this point
    this.submit.emit({ configData, formData: formValue });
    console.log('[ConfigurationFormComponent] Submit event emitted');
  }

  /**
   * Triggered when Process Date field receives focus
   * Validates form and triggers phase transition to Unit Entry
   */
  onProcessDateFocus(): void {
    console.log('[ConfigurationFormComponent] onProcessDateFocus() - User focused on Process Date field');

    // Validate form before transitioning
    if (this.form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });

      console.log('[ConfigurationFormComponent] Form is invalid, showing errors');
      this.snackbarService.showError('Please complete all required fields before proceeding');
      return;
    }

    // Form is valid - trigger the same logic as CONTINUE button
    console.log('[ConfigurationFormComponent] Form is valid, triggering phase transition');
    this.onSubmit();
  }

  onSegmentNumberAdvance(event: Event): void {
    event.preventDefault();
    this.processDateInput?.nativeElement.focus();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
