import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import moment from 'moment';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { TubeCheckinShipmentService } from './services/tube-checkin-shipment.service';
import { TubeCheckinShipmentMockService } from './services/tube-checkin-shipment-mock.service';
import {
  SamplePackDto,
  SamplePackTubeDto,
  CreateSamplePackRequestDto,
  UpdateSamplePackRequestDto,
  AddTubeRequestDto,
  DestinationLab,
} from './models/tube-checkin-shipment.model';
import { ViewUnitsDialogComponent } from './view-units-dialog/view-units-dialog';
import { ManualUnitEntryDialogComponent } from './manual-unit-entry-dialog/manual-unit-entry-dialog';

/**
 * Tube Check-In / Shipment Component
 * Mnemonic: TSHIP
 * FMB: TSHIP (18.2.4 Tube Shipment)
 *
 * Purpose: Record the packing of tubes to be sent out for testing
 */
@Component({
  selector: 'app-tube-checkin-shipment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './tube-checkin-shipment.html',
  styleUrls: ['./tube-checkin-shipment.scss'],
  providers: [
    // REAL BACKEND: Using real API service
    TubeCheckinShipmentService,
    // MOCK DATA: Uncomment this line and comment out the line above to use mock backend
    // { provide: TubeCheckinShipmentService, useClass: TubeCheckinShipmentMockService },
    // Chapter-aware date adapter to ensure "today" in datepicker uses chapter timezone
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
})
export class TubeCheckinShipmentComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly tubeCheckinService = inject(TubeCheckinShipmentService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  @ViewChild('redTopField') redTopField?: UnitIdFieldComponent;
  @ViewChild('purpleTop1Field') purpleTop1Field?: UnitIdFieldComponent;
  @ViewChild('purpleTop2Field') purpleTop2Field?: UnitIdFieldComponent;

  private readonly destroy$ = new Subject<void>();

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Tube Check-In / Shipment', link: null },
    ],
    title: 'Tube Check-In / Shipment',
    subtitle: 'Check in and prepare blood sample tubes for shipment by verifying tube details, destination, and shipment readiness.',
  };

  // Form controls
  boxForm!: FormGroup;
  scanForm!: FormGroup;

  // Loading and error states
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Data
  openBoxes = signal<SamplePackDto[]>([]);
  destinationLabs = signal<DestinationLab[]>([]);
  currentBox = signal<SamplePackDto | null>(null);
  tubeEntries = signal<SamplePackTubeDto[]>([]);
  plateCapacity = signal<number>(88); // Default to 88 per Oracle Forms
  showScanningSection = signal<boolean>(false);

  // Gap #8: Check digit signals
  redTopCheckDigit = signal<string>('');
  purpleTop1CheckDigit = signal<string>('');
  purpleTop2CheckDigit = signal<string>('');

  // Pending tube buffer — collects scans before submitting one combined request
  // Matches FMB do_commit1 behaviour: all tubes for a unit saved in one call
  private pendingTube: { unitId: string; redTubeFlag: string | null; purpleTubeFlag: string | null; purpleTube2Flag: string | null } | null = null;

  // Search controls for dropdowns
  boxIdSearchControl = new FormControl('');
  extractTypeSearchControl = new FormControl('');
  donorTypeSearchControl = new FormControl('');
  destinationLabSearchControl = new FormControl('');

  // Computed: Plate capacity status
  capacityWarning = computed(() => {
    const filled = this.tubeEntries().length;
    const capacity = this.plateCapacity();

    if (capacity === 0) return null;

    const percentFull = (filled / capacity) * 100;

    if (percentFull >= 100) {
      return { level: 'error' as const, message: `Plate Full (${filled}/${capacity})` };
    } else if (percentFull >= 80) {
      return { level: 'warning' as const, message: `Plate Almost Full (${filled}/${capacity})` };
    } else {
      return { level: 'info' as const, message: `Plate Capacity: ${filled}/${capacity}` };
    }
  });

  // Table configuration
  tableConfig: DataTableConfig<SamplePackTubeDto> = {
    columns: [],
    pagination: {
      pageSize: 25,
      pageIndex: 0,
      totalRecords: 0,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButtons: true,
    },
    sortConfig: {
      column: 'unitId',
      direction: 'A',
    },
    stickyHeader: true,
    emptyMessage: 'No Results to Display',
    noDataIcon: 'search',
    loadingMessage: 'Loading units...',
    showPagination: false,
  };

  // Extract type options
  extractTypeOptions = [
    { value: 'V', label: 'Viral Marker' },
    { value: 'N', label: 'NAT' },
    { value: 'B', label: 'Both' },
  ];

  // Donor type options
  donorTypeOptions = [
    { value: 'I', label: 'First Time' },
    { value: 'R', label: 'Repeat' },
    { value: 'O', label: 'Others' },
  ];

  // Computed: Filtered donor type options based on extract type
  // Per FMB: If Extract type is N, then it will allow donor type I and R only
  filteredDonorTypeOptions = computed(() => {
    // All donor types (I/R/O) are valid for all extract types.
    // The original restriction blocking 'O' for NAT was removed in Oracle Forms
    // per business request (CHECK_DONOR VALIDATE_FIELD: "Removed as per Marsha's Request 10/05/99")
    return this.donorTypeOptions;
  });

  // Search-filtered signals for dropdowns
  boxIdSearch = signal<string>('');
  extractTypeSearch = signal<string>('');
  donorTypeSearch = signal<string>('');
  destinationLabSearch = signal<string>('');

  filteredOpenBoxes = computed(() => {
    const search = this.boxIdSearch().toLowerCase();
    if (!search) return this.openBoxes();
    return this.openBoxes().filter(box =>
      box.boxId.toLowerCase().includes(search) ||
      box.extractType.toLowerCase().includes(search) ||
      box.donorType.toLowerCase().includes(search) ||
      box.destinationCode.toLowerCase().includes(search)
    );
  });

  filteredExtractTypeOptions = computed(() => {
    const search = this.extractTypeSearch().toLowerCase();
    if (!search) return this.extractTypeOptions;
    return this.extractTypeOptions.filter(opt =>
      opt.value.toLowerCase().includes(search) ||
      opt.label.toLowerCase().includes(search)
    );
  });

  filteredDonorTypeOptionsWithSearch = computed(() => {
    const search = this.donorTypeSearch().toLowerCase();
    const baseOptions = this.filteredDonorTypeOptions(); // Apply extract type filter first
    if (!search) return baseOptions;
    return baseOptions.filter(opt =>
      opt.value.toLowerCase().includes(search) ||
      opt.label.toLowerCase().includes(search)
    );
  });

  filteredDestinationLabs = computed(() => {
    const search = this.destinationLabSearch().toLowerCase();
    if (!search) return this.destinationLabs();
    return this.destinationLabs().filter(lab =>
      lab.testingLabId.toLowerCase().includes(search) ||
      (lab.testingLabName && lab.testingLabName.toLowerCase().includes(search))
    );
  });

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [{ label: 'Home', link: '/home' }, { label: pageData.title, link: null }],
          title: pageData.title,
          subtitle: pageData.subtitle || this.headerConfig.subtitle,
        };
      }
    });
  }

  ngOnInit(): void {
    const chapterId = this.headerService.getCurrentChapterId();

    // Initialize forms immediately to avoid template errors
    this.initializeForms();
    this.setupFormListeners();
    this.loadInitialData();
    this.tableConfig.columns = this.getTableColumns();

    // Update collection date with chapter-local date if not already loaded
    if (!this.chapterTimezoneService.isChapterLocalDateAvailable()) {
      this.chapterTimezoneService.fetchChapterTimezone(chapterId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Update collection date field with chapter-local date
            const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
            this.boxForm.patchValue({
              collectionDate: chapterDate,
            }, { emitEvent: false });
          },
          error: () => {
            // Already using fallback system date from initialization
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Per Oracle Forms FMB: Auto-populate collection date with chapter-local current date for new boxes
    // This matches Oracle Forms PRE-TEXT-ITEM trigger behavior
    // Use Moment object directly for Material datepicker (it's configured to use moment adapter)
    const initialCollectionDate = this.chapterTimezoneService.getChapterLocalDate();

    this.boxForm = this.fb.group({
      boxId: [''], // Not required - can be blank to create new box
      collectionDate: [initialCollectionDate, Validators.required], // Auto-populate with chapter-local date as Moment
      extractType: ['', Validators.required],
      donorType: ['', Validators.required],
      destinationCode: ['', Validators.required],
    });

    // Force the datepicker to display the initial value
    // This ensures the date is visible immediately, matching Oracle Forms behavior
    setTimeout(() => {
      this.boxForm.patchValue({
        collectionDate: initialCollectionDate
      }, { emitEvent: false });
    }, 0);

    this.scanForm = this.fb.group({
      redTop: [''],
      purpleTop1: [''],
      purpleTop2: [''],
    });
  }

  private setupFormListeners(): void {
    // Setup search control listeners
    this.boxIdSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200))
      .subscribe(value => this.boxIdSearch.set(value || ''));

    this.extractTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200))
      .subscribe(value => this.extractTypeSearch.set(value || ''));

    this.donorTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200))
      .subscribe(value => this.donorTypeSearch.set(value || ''));

    this.destinationLabSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200))
      .subscribe(value => this.destinationLabSearch.set(value || ''));

    // FIX 2: Watch extract type changes to enable/disable tube fields
    // Also reset donor type if it becomes invalid (e.g., 'O' when switching to 'N')
    this.boxForm.get('extractType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(extractType => {
        this.updateTubeFieldsAvailability(extractType);
      });

    // Gap #7: Watch for tube ID matching validation
    this.scanForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.validateTubeIdMatching();
      });
  }

  // FIX 2: Update tube field availability based on extract type
  private updateTubeFieldsAvailability(extractType: string | null): void {
    const redTopControl = this.scanForm.get('redTop');
    const purpleTop1Control = this.scanForm.get('purpleTop1');
    const purpleTop2Control = this.scanForm.get('purpleTop2');

    if (!redTopControl || !purpleTop1Control || !purpleTop2Control) return;

    switch (extractType) {
      case 'V': // Viral Marker - red + purple1 only
        redTopControl.enable();
        purpleTop1Control.enable();
        purpleTop2Control.disable();
        purpleTop2Control.reset();
        // Disable the component's internal control as well
        if (this.purpleTop2Field) {
          this.purpleTop2Field.unitIdControl.disable();
        }
        // Focus on first enabled field (Red Top)
        setTimeout(() => this.redTopField?.focus(), 100);
        break;

      case 'N': // NAT - purple2 only
        redTopControl.disable();
        purpleTop1Control.disable();
        purpleTop2Control.enable();
        redTopControl.reset();
        purpleTop1Control.reset();
        // Disable the component's internal controls as well
        if (this.redTopField) {
          this.redTopField.unitIdControl.disable();
        }
        if (this.purpleTop1Field) {
          this.purpleTop1Field.unitIdControl.disable();
        }
        // Focus on Purple Top 2 (only enabled field)
        setTimeout(() => this.purpleTop2Field?.focus(), 100);
        break;

      case 'B': // Both - all enabled
        redTopControl.enable();
        purpleTop1Control.enable();
        purpleTop2Control.enable();
        // Enable the component's internal controls as well
        if (this.redTopField) {
          this.redTopField.unitIdControl.enable();
        }
        if (this.purpleTop1Field) {
          this.purpleTop1Field.unitIdControl.enable();
        }
        if (this.purpleTop2Field) {
          this.purpleTop2Field.unitIdControl.enable();
        }
        // Focus on first field (Red Top)
        setTimeout(() => this.redTopField?.focus(), 100);
        break;

      default:
        // Disable all until extract type selected
        redTopControl.disable();
        purpleTop1Control.disable();
        purpleTop2Control.disable();
        // Disable the component's internal controls as well
        if (this.redTopField) {
          this.redTopField.unitIdControl.disable();
        }
        if (this.purpleTop1Field) {
          this.purpleTop1Field.unitIdControl.disable();
        }
        if (this.purpleTop2Field) {
          this.purpleTop2Field.unitIdControl.disable();
        }
    }
  }

  // Gap #7: Validate that all tube IDs match
  private validateTubeIdMatching(): void {
    const redTop = this.scanForm.get('redTop')?.value?.trim();
    const purpleTop1 = this.scanForm.get('purpleTop1')?.value?.trim();
    const purpleTop2 = this.scanForm.get('purpleTop2')?.value?.trim();

    // Get all non-empty tube IDs
    const tubeIds = [redTop, purpleTop1, purpleTop2].filter(id => id && id.length > 0);

    // If we have at least 2 tubes scanned, they must match
    if (tubeIds.length >= 2) {
      const uniqueIds = new Set(tubeIds);

      if (uniqueIds.size > 1) {
        this.showErrorWithCode('0045', 'All tube unit IDs must match the same unit');

        // Clear the scan fields to prevent submission with mismatched IDs
        this.scanForm.patchValue({
          redTop: '',
          purpleTop1: '',
          purpleTop2: ''
        }, { emitEvent: false }); // Don't trigger validation loop
      }
    }
  }

  loadInitialData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const chapterId = this.headerService.getCurrentChapterId();

    // FIX 4: Load open boxes with full details
    this.tubeCheckinService.getOpenBoxesDetailed(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: boxes => {
          this.openBoxes.set(boxes);
        },
        error: () => {
          this.showError('Failed to load open boxes');
        },
      });

    // Load destination labs (uses chapter context from user session)
    this.tubeCheckinService.getDestinationLabs(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: labs => {
          this.destinationLabs.set(labs);
          this.isLoading.set(false);
        },
        error: () => {
          this.showError('Failed to load destination labs');
          this.isLoading.set(false);
        },
      });

    // Load plate capacity (uses chapter context from user session)
    this.tubeCheckinService.getPlateCapacity()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: capacity => {
          this.plateCapacity.set(capacity);
        },
        error: () => {
          this.showError('Failed to load plate capacity');
        },
      });
  }

  private getTableColumns(): TableColumn<SamplePackTubeDto>[] {
    return [
      {
        key: 'unitId',
        header: 'Unit ID',
        sortable: true, // Bug #6: Make Unit ID sortable
        width: '200px',
        // Bug #8: Add check digit to unit ID display
        valueFormatter: (value, row) => {
          if (!value) return '';
          const checkDigit = this.calculateCheckDigit(value);
          return checkDigit ? `${value}-${checkDigit}` : value;
        },
      },
      {
        key: 'redTubeFlag',
        header: 'Red Top',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => value === 'Y' ? 'R1' : '-',
      },
      {
        key: 'purpleTubeFlag',
        header: 'Purple Top 1',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => value === 'Y' ? 'P1' : '-',
      },
      {
        key: 'purpleTube2Flag',
        header: 'Purple Top 2',
        sortable: false,
        width: '150px',
        valueFormatter: (value) => value === 'Y' ? 'P2' : '-',
      },
    ];
  }

  // Handle box selection from dropdown
  onBoxIdSelected(event: any): void {
    const selectedBoxId = event.value;

    // If blank/null/undefined, allow creating a new box
    if (!selectedBoxId) {
      // Per Oracle Forms: Reset to chapter-local current date for new boxes
      // Use Moment object directly for Material datepicker
      const currentDate = this.chapterTimezoneService.getChapterLocalDate();
      this.boxForm.patchValue({
        collectionDate: currentDate,
        extractType: '',
        donorType: '',
        destinationCode: '',
      }, { emitEvent: false });
      return;
    }

    // Fetch full box details using GET /sample-packs/{boxId}
    const chapterId = this.headerService.getCurrentChapterId();
    this.tubeCheckinService.getBoxHeader(selectedBoxId, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: box => {
          if (box) {
            // Auto-populate fields with fetched box details
            // Bug #4: Preserve destination code with emitEvent: false
            this.boxForm.patchValue({
              collectionDate: box.collDate,
              extractType: box.extractType,
              donorType: box.donorType,
              destinationCode: box.destinationCode,
            }, { emitEvent: false });
          }
        },
        error: () => {
          this.showError('Failed to load box details');
        },
      });
  }

  onRetrieve(): void {
    const boxId = this.boxForm.get('boxId')?.value;

    // Validate required fields (excluding boxId which can be null for new box)
    if (!this.boxForm.get('collectionDate')?.value ||
        !this.boxForm.get('extractType')?.value ||
        !this.boxForm.get('donorType')?.value ||
        !this.boxForm.get('destinationCode')?.value) {
      this.showError('Please fill in all required fields (Collection Date, Extract Type, Donor Type, Send to)');
      return;
    }

    // Validate collection date year (must be ±1 of current year)
    const collectionDate = this.boxForm.get('collectionDate')?.value;
    if (!this.validateCollectionYear(collectionDate)) {
      return; // Error already shown
    }

    this.isLoading.set(true);
    this.showScanningSection.set(true);
    const chapterId = this.headerService.getCurrentChapterId();

    // Case 1: Box ID is null (user selected "Create New Box") - Create new box
    if (boxId === null || boxId === undefined || boxId === '') {
      this.createNewBox(chapterId);
      return;
    }

    // Case 2: Box ID is provided - Retrieve existing box
    this.tubeCheckinService.getBoxHeader(boxId, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: box => {
          if (!box) {
            this.showError('Box not found or not open');
            this.isLoading.set(false);
            this.showScanningSection.set(false);
            return;
          }

          this.currentBox.set(box);
          // Form already populated by onBoxIdSelected when user chose the box.
          // Do not re-patch here — it would overwrite any user changes (e.g. donor type).
          // Only update tube field availability using the current form extract type.
          this.updateTubeFieldsAvailability(this.boxForm.get('extractType')?.value);

          this.loadBoxUnits(boxId, chapterId);
        },
        error: () => {
          this.showError('Failed to retrieve box');
          this.isLoading.set(false);
          this.showScanningSection.set(false);
        },
      });
  }

  // Create a new box with auto-generated ID
  private createNewBox(chapterId: string): void {
    const collectionDateValue = this.boxForm.get('collectionDate')?.value;

    // Format date as YYYY-MM-DD string to avoid timezone issues
    // The form value is a Moment object from the datepicker
    let formattedDate: any = collectionDateValue;
    if (moment.isMoment(collectionDateValue)) {
      // Use moment's format method to get YYYY-MM-DD without timezone conversion
      formattedDate = collectionDateValue.format('YYYY-MM-DD');
    } else if (collectionDateValue instanceof Date) {
      const year = collectionDateValue.getFullYear();
      const month = String(collectionDateValue.getMonth() + 1).padStart(2, '0');
      const day = String(collectionDateValue.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    }

    const request: CreateSamplePackRequestDto = {
      boxId: '', // Backend will auto-generate the box ID
      collDate: formattedDate as any,
      extractType: this.boxForm.get('extractType')?.value,
      donorType: this.boxForm.get('donorType')?.value,
      destinationCode: this.boxForm.get('destinationCode')?.value,
    };

    this.tubeCheckinService.createBox(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          if (result.success) {
            // Extract box ID from response - check both data array and item object
            const resultAny = result as any;
            const createdBoxId = resultAny.item?.boxId || result.data?.[0]?.boxId || 'New Box';
            this.showSuccess(`Box ${createdBoxId} created successfully`);

            // Update the form with the created box ID
            this.boxForm.patchValue({ boxId: createdBoxId }, { emitEvent: false });

            // Set current box from the create response data
            if (resultAny.item) {
              this.currentBox.set(resultAny.item);
            }

            // Update tube fields based on extract type
            const extractType = this.boxForm.get('extractType')?.value;
            this.updateTubeFieldsAvailability(extractType);

            // Load units (should be empty for new box)
            this.loadBoxUnits(createdBoxId, chapterId);

            // Reload the open boxes list to include the newly created box
            this.loadOpenBoxes(chapterId);

            this.isLoading.set(false);
          } else {
            this.showErrorWithCode(result.errorCode, result.message || 'Failed to create box');
            this.isLoading.set(false);
            this.showScanningSection.set(false);
          }
        },
        error: err => {
          const errorCode = err?.error?.errorCode || err?.error?.ErrorCode;
          const errorMessage = err?.error?.message || err?.error?.Message || 'Failed to create box';
          this.showErrorWithCode(errorCode, errorMessage);
          this.isLoading.set(false);
          this.showScanningSection.set(false);
        },
      });
  }

  // Helper method to reload open boxes
  private loadOpenBoxes(chapterId: string): void {
    this.tubeCheckinService.getOpenBoxesDetailed(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: boxes => {
          this.openBoxes.set(boxes);
        },
        error: () => {
          // Silent fail - not critical if this fails
        },
      });
  }

  private loadBoxUnits(boxId: string, chapterId: string): void {
    this.tubeCheckinService.getBoxUnits(boxId, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: units => {
          this.tubeEntries.set(units);
          this.isLoading.set(false);
        },
        error: () => {
          this.showError('Failed to load box units');
          this.isLoading.set(false);
        },
      });
  }

  onClear(): void {
    this.boxForm.reset({
      boxId: '',
      collectionDate: '',
      extractType: '',
      donorType: '',
      destinationCode: '',
    });
    this.scanForm.reset();
    this.currentBox.set(null);
    this.tubeEntries.set([]);
    this.showScanningSection.set(false);

    // Gap #8: Clear check digits
    this.redTopCheckDigit.set('');
    this.purpleTop1CheckDigit.set('');
    this.purpleTop2CheckDigit.set('');
  }

  onViewUnitsInBox(): void {
    const boxId = this.boxForm.get('boxId')?.value;
    if (!boxId) {
      this.showError('Please select a box first');
      return;
    }

    const chapterId = this.headerService.getCurrentChapterId();

    this.tubeCheckinService.viewUnitsInBox(boxId, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.dialog.open(ViewUnitsDialogComponent, {
            width: '754px',
            maxWidth: '100vw',
            height: 'calc(100vh - 64px)',
            position: { right: '0', top: '64px' },
            panelClass: 'view-units-side-panel',
            hasBackdrop: true,
            backdropClass: 'side-panel-backdrop',
            disableClose: true,
            closeOnNavigation: true,
            autoFocus: false,
            restoreFocus: true,
            ariaLabelledBy: 'view-units-dialog-title',
            data: {
              boxId,
              tubes: data.tubes,
              unitCount: data.unitCount,
              tubeCount: data.tubeCount,
            },
          });
        },
        error: () => {
          this.showError('Failed to load box units');
        },
      });
  }

  onPrintPackList(): void {
    const boxId = this.boxForm.get('boxId')?.value;
    if (!boxId) {
      this.showError('Please select a box first');
      return;
    }

    const box = this.currentBox();
    if (!box) {
      this.showError('Box information not available');
      return;
    }

    // Print directly without showing dialog
    this.printPackList(boxId);
  }

  // Gap #10: Open manual unit entry dialog
  private openManualEntryDialog(tubeType: 'R' | 'P1' | 'P2'): void {
    const dialogRef = this.dialog.open(ManualUnitEntryDialogComponent, {
      width: '500px',
      data: { tubeType }
    });

    dialogRef.afterClosed().subscribe(unitId => {
      if (unitId) {
        // Process the manually entered unit ID
        const checkDigit = this.calculateCheckDigit(unitId);

        switch (tubeType) {
          case 'R':
            this.redTopCheckDigit.set(checkDigit);
            break;
          case 'P1':
            this.purpleTop1CheckDigit.set(checkDigit);
            break;
          case 'P2':
            this.purpleTop2CheckDigit.set(checkDigit);
            break;
        }

        // Route manual entry through the same buffer approach as barcode scan
        if (tubeType === 'R') this.handleRedTopScan(unitId);
        else if (tubeType === 'P1') this.handlePurpleTop1Scan(unitId);
        else if (tubeType === 'P2') this.handlePurpleTop2Scan(unitId);
      }
    });
  }

  onScanRedTop(): void {
    const value = this.scanForm.get('redTop')?.value?.trim();
    if (!value) return;
    if (value.toUpperCase() === 'M') { this.openManualEntryDialog('R'); this.scanForm.patchValue({ redTop: '' }); return; }
    this.scanForm.patchValue({ redTop: '' });
    this.handleRedTopScan(value);
  }

  onScanPurpleTop1(): void {
    const value = this.scanForm.get('purpleTop1')?.value?.trim();
    if (!value) return;
    if (value.toUpperCase() === 'M') { this.openManualEntryDialog('P1'); this.scanForm.patchValue({ purpleTop1: '' }); return; }
    this.scanForm.patchValue({ purpleTop1: '' });
    this.handlePurpleTop1Scan(value);
  }

  onScanPurpleTop2(): void {
    const value = this.scanForm.get('purpleTop2')?.value?.trim();
    if (!value) return;
    if (value.toUpperCase() === 'M') { this.openManualEntryDialog('P2'); this.scanForm.patchValue({ purpleTop2: '' }); return; }
    this.scanForm.patchValue({ purpleTop2: '' });
    this.handlePurpleTop2Scan(value);
  }

  // Tube scan handlers — buffer scans, submit ONE combined request per unit
  // Matches FMB do_commit1: all tubes for a unit are saved in a single API call

  onRedTopValidated(data: UnitValidationResponse): void {
    if (data.parsedUnitId) this.handleRedTopScan(data.parsedUnitId);
  }

  onRedTopCleared(): void { }

  onPurpleTop1Validated(data: UnitValidationResponse): void {
    if (data.parsedUnitId) this.handlePurpleTop1Scan(data.parsedUnitId);
  }

  onPurpleTop1Cleared(): void { }

  onPurpleTop2Validated(data: UnitValidationResponse): void {
    if (data.parsedUnitId) this.handlePurpleTop2Scan(data.parsedUnitId);
  }

  onPurpleTop2Cleared(): void { }

  private handleRedTopScan(unitId: string): void {
    const extractType = this.boxForm.get('extractType')?.value;
    this.pendingTube = { unitId, redTubeFlag: 'Y', purpleTubeFlag: null, purpleTube2Flag: null };
    setTimeout(() => this.redTopField?.clear(), 100);
    if (extractType === 'V' || extractType === 'B') {
      setTimeout(() => this.purpleTop1Field?.focus(), 150);
    } else {
      this.submitPendingTube();
      setTimeout(() => this.redTopField?.focus(), 150);
    }
  }

  private handlePurpleTop1Scan(unitId: string): void {
    const extractType = this.boxForm.get('extractType')?.value;
    if (this.pendingTube && this.pendingTube.unitId !== unitId) {
      this.showErrorWithCode('0045', 'All tube unit IDs must match the same unit');
      this.pendingTube = null;
      setTimeout(() => { this.purpleTop1Field?.clear(); this.redTopField?.clear(); this.redTopField?.focus(); }, 100);
      return;
    }
    if (this.pendingTube) {
      this.pendingTube.purpleTubeFlag = 'Y';
    } else {
      this.pendingTube = { unitId, redTubeFlag: null, purpleTubeFlag: 'Y', purpleTube2Flag: null };
    }
    setTimeout(() => this.purpleTop1Field?.clear(), 100);
    if (extractType === 'B') {
      setTimeout(() => this.purpleTop2Field?.focus(), 150);
    } else {
      this.submitPendingTube();
      setTimeout(() => this.redTopField?.focus(), 150);
    }
  }

  private handlePurpleTop2Scan(unitId: string): void {
    const extractType = this.boxForm.get('extractType')?.value;
    if (this.pendingTube && this.pendingTube.unitId !== unitId) {
      this.showErrorWithCode('0045', 'All tube unit IDs must match the same unit');
      this.pendingTube = null;
      setTimeout(() => { this.purpleTop2Field?.clear(); this.redTopField?.focus(); }, 100);
      return;
    }
    if (this.pendingTube) {
      this.pendingTube.purpleTube2Flag = 'Y';
    } else {
      this.pendingTube = { unitId, redTubeFlag: null, purpleTubeFlag: null, purpleTube2Flag: 'Y' };
    }
    setTimeout(() => this.purpleTop2Field?.clear(), 100);
    this.submitPendingTube();
    if (extractType === 'N') {
      setTimeout(() => this.purpleTop2Field?.focus(), 150);
    } else {
      setTimeout(() => this.redTopField?.focus(), 150);
    }
  }

  private submitPendingTube(): void {
    if (!this.pendingTube) return;
    const tube = this.pendingTube;
    this.pendingTube = null;
    this.processScan(tube);
  }

  /**
   * Handle Enter key press in empty scan fields
   * Validates that at least one tube has been scanned based on Extract Type
   * This validation helps users understand the requirement when they try to proceed without scanning
   */
  onEmptyFieldEnter(): void {
    // Check if any tubes have been scanned yet
    const hasAnyTubes = this.tubeEntries().length > 0;

    // Only show validation error if no tubes exist yet
    // If tubes already exist, the requirement is satisfied
    if (!hasAnyTubes) {
      this.validateTubeRequirement();
    }
  }

  private processScan(tube: { unitId: string; redTubeFlag: string | null; purpleTubeFlag: string | null; purpleTube2Flag: string | null }): void {
    const boxId = this.boxForm.get('boxId')?.value;
    if (!boxId) {
      this.showError('No box selected');
      return;
    }

    // Check capacity before attempting to add
    const currentCount = this.tubeEntries().length;
    const capacity = this.plateCapacity();
    if (capacity > 0 && currentCount >= capacity) {
      this.showError(`Plate capacity of ${capacity} has been reached. Cannot add more tubes.`);
      return;
    }

    const request: AddTubeRequestDto = {
      unitId: tube.unitId,
      redTubeFlag: tube.redTubeFlag,
      purpleTubeFlag: tube.purpleTubeFlag,
      purpleTube2Flag: tube.purpleTube2Flag,
    };

    this.tubeCheckinService.addTube(boxId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          if (result.success) {
            this.showSuccess(`Tube ${tube.unitId} added successfully`);
            const chapterId = this.headerService.getCurrentChapterId();
            this.loadBoxUnits(boxId, chapterId);
          } else {
            this.showErrorWithCode(result.errorCode, result.message);
          }
        },
        error: err => {
          const errorCode = err?.error?.errorCode || err?.error?.ErrorCode;
          const errorMessage = err?.error?.message || err?.error?.Message || 'Failed to add tube';
          this.showErrorWithCode(errorCode, errorMessage);
        },
      });
  }

  onCancel(): void {
    // Bug #12: Cancel stays on same page - clear form and reload boxes
    this.onClear();
    const chapterId = this.headerService.getCurrentChapterId();
    this.loadOpenBoxes(chapterId);
  }

  onCloseAndPrint(): void {
    const boxId = this.boxForm.get('boxId')?.value;
    if (!boxId) {
      this.showError('Please select a box first');
      return;
    }

    // Validate that at least one tube has been scanned based on Extract Type
    if (!this.validateTubeRequirement()) {
      return; // Error already shown
    }

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '500px',
      data: {
        title: 'Warning',
        message: 'Do you want to close the box and print the pack list?',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.closeBox(boxId, true);
      }
    });
  }

  private closeBox(boxId: string, printPackList: boolean): void {
    this.isSaving.set(true);

    this.tubeCheckinService.close(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          if (result.success) {
            this.showSuccess('Box closed successfully');

            // Print directly if requested
            if (printPackList && this.currentBox()) {
              this.printPackList(boxId);
            }

            this.onClear();
          } else {
            this.showError(result.message || 'Failed to close box');
          }
          this.isSaving.set(false);
        },
        error: err => {
          this.showError(err?.error?.message || 'Failed to close box');
          this.isSaving.set(false);
        },
      });
  }

  private printPackList(boxId: string): void {
    const box = this.currentBox();
    if (!box) {
      this.showError('Box information not available');
      return;
    }

    const chapterId = this.headerService.getCurrentChapterId();

    // Load tubes and print directly
    this.tubeCheckinService.getBoxUnits(boxId, chapterId).subscribe({
      next: (tubes) => {
        this.generateAndPrint(box, tubes);
      },
      error: () => {
        this.showError('Failed to load tubes for printing');
      },
    });
  }

  private generateAndPrint(box: SamplePackDto, tubes: SamplePackTubeDto[]): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.showError('Please allow popups to print');
      return;
    }

    const printContent = this.generatePrintHtml(box, tubes);
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Set up event handlers before calling print
    let printCompleted = false;

    printWindow.onafterprint = () => {
      printCompleted = true;
      printWindow.close();
    };

    // Auto-close window if user cancels or after a timeout
    printWindow.onbeforeunload = () => {
      printCompleted = true;
    };

    // Trigger print
    printWindow.print();

    // Fallback: auto-close the window after 2 seconds if it's still open
    // This handles the case where user clicks Cancel on print dialog
    setTimeout(() => {
      if (!printCompleted && printWindow && !printWindow.closed) {
        try {
          printWindow.close();
        } catch (e) {
          // Window might already be closed
        }
      }
    }, 2000);
  }

  private showSuccess(message: string): void {
    // Bug #14: Change snackbar button text from 'Close' to 'Dismiss'
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  // FIX 3: Enhanced error handling with backend error codes
  private showErrorWithCode(errorCode: string | undefined, message: string): void {
    let displayMessage = message;

    // Map specific error codes to user-friendly messages with error code prefix
    switch (errorCode) {
      case '0020':
        displayMessage = `Error 0020: ${message}`;
        break;
      case '0080':
        displayMessage = `Error 0080: ${message}`;
        break;
      case '0150':
        displayMessage = `Error 0150: ${message}`;
        break;
      case '0252':
        displayMessage = `Error 0252: Invalid Donor Type - ${message}`;
        break;
      case '0253':
        displayMessage = `Error 0253: Invalid Extract Type - ${message}`;
        break;
      case '0254':
        displayMessage = `Error 0254: Box Error - ${message}`;
        break;
      case '1811':
        displayMessage = `Error 1811: Invalid Testing Lab - ${message}`;
        break;
      default:
        // Always include error code if available
        displayMessage = errorCode ? `Error ${errorCode}: ${message}` : message;
    }

    this.snackBar.open(displayMessage, 'DISMISS', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  // Gap #8: Calculate check digit using ISBT MOD-37 algorithm
  private calculateCheckDigit(unitId: string): string {
    if (!unitId || unitId.length === 0) return '';

    const MOD37_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*';

    let si = 0;
    for (const c of unitId) {
      let a: number;
      if (c >= '0' && c <= '9') {
        a = c.charCodeAt(0) - 48;
      } else if (c === '*') {
        a = 36;
      } else {
        a = c.toUpperCase().charCodeAt(0) - 55;
      }
      si = ((si + a) * 2) % 37;
    }
    const checkValue = (38 - si) % 37;
    return MOD37_ALPHABET[checkValue];
  }

  // Get error message for Collection Date field
  getCollectionDateError(): string {
    const control = this.boxForm.get('collectionDate');
    if (!control) return '';

    // Only show errors if field is touched or dirty
    if (!(control.touched || control.dirty)) return '';

    // Priority 1: Parse error (invalid format) - check this FIRST
    // When user types invalid text like "jhg", matDatepickerParse is set
    if (control.hasError('matDatepickerParse')) {
      return 'Invalid date format';
    }

    // Priority 2: Invalid date
    if (control.hasError('invalidDate')) {
      return 'Invalid date format';
    }

    // Priority 3: Required error - only show if no parse/invalid errors
    // When parse fails, control value becomes null which also triggers required
    // We show parse error instead of required error in that case
    if (control.hasError('required')) {
      // If control has a value (user typed something) but required is triggered,
      // it means there's a parse issue, show parse error instead
      const inputElement = document.querySelector('input[formControlName="collectionDate"]') as HTMLInputElement;
      if (inputElement && inputElement.value && inputElement.value.trim()) {
        return 'Invalid date format';
      }
      return 'Collection Date is required';
    }

    return '';
  }

  /**
   * Validate collection date year - must be within ±1 year of current year
   * Per Oracle Forms: VALIDATE_COLLECTION_YEAR procedure
   */
  private validateCollectionYear(collectionDate: moment.Moment | null): boolean {
    if (!collectionDate || !moment.isMoment(collectionDate)) {
      return true; // Already validated as required
    }

    const collectionYear = collectionDate.year();
    const currentYear = moment().year();

    // Collection year should be within ±1 of current year
    const yearDiff = Math.abs(collectionYear - currentYear);

    if (yearDiff > 1) {
      this.showError('Collection year must be within ±1 year of current year');
      return false;
    }

    return true;
  }

  /**
   * Validate that at least one tube is scanned based on Extract Type
   * Per Oracle Forms FMB business rules:
   * - Viral Marker (V): Requires at least Red Top OR Purple Top 1
   * - NAT (N): Requires Purple Top 2
   * - Both (B): Requires at least one tube from any type
   */
  private validateTubeRequirement(): boolean {
    const extractType = this.boxForm.get('extractType')?.value;
    const tubes = this.tubeEntries();

    // Check what tube types have been scanned
    const hasRedTop = tubes.some(t => t.redTubeFlag === 'Y');
    const hasPurpleTop1 = tubes.some(t => t.purpleTubeFlag === 'Y');
    const hasPurpleTop2 = tubes.some(t => t.purpleTube2Flag === 'Y');

    switch (extractType) {
      case 'V': // Viral Marker
        if (!hasRedTop && !hasPurpleTop1) {
          this.showErrorWithCode('0020', 'Viral Marker requires at least Red Top or Purple Top 1 tube');
          return false;
        }
        break;

      case 'N': // NAT
        if (!hasPurpleTop2) {
          this.showErrorWithCode('0080', 'NAT requires Purple Top 2 tube');
          return false;
        }
        break;

      case 'B': // Both
        if (!hasRedTop && !hasPurpleTop1 && !hasPurpleTop2) {
          this.showErrorWithCode('0020', 'At least one tube is required');
          return false;
        }
        break;
    }

    return true;
  }

  // Gap #15: Helper methods for showing descriptions
  getExtractTypeDescription(): string {
    const selected = this.boxForm.get('extractType')?.value;
    if (!selected) return '';

    const option = this.extractTypeOptions.find(o => o.value === selected);
    return option?.label || '';
  }

  getDonorTypeDescription(): string {
    const selected = this.boxForm.get('donorType')?.value;
    if (!selected) return '';

    const option = this.donorTypeOptions.find(o => o.value === selected);
    return option?.label || '';
  }

  // Gap #14: Helper method for showing testing lab name
  getSelectedLabName(): string {
    const selectedCode = this.boxForm.get('destinationCode')?.value;
    if (!selectedCode) return '';

    const lab = this.destinationLabs().find(l => l.testingLabId === selectedCode);
    return lab?.testingLabName || '';
  }

  // Bug #16, #18, #10: Manual date input methods
  onCollectionDateBlur(event: any): void {
    const input = event.target.value;
    if (!input) return;

    const parsedDate = this.parseAndFormatDate(input);
    if (parsedDate) {
      this.boxForm.patchValue({ collectionDate: parsedDate }, { emitEvent: false });
    }
  }

  onCollectionDateInput(event: any): void {
    const input = event.target.value;
    if (!input) return;

    const parsedDate = this.parseAndFormatDate(input);
    if (parsedDate) {
      this.boxForm.patchValue({ collectionDate: parsedDate }, { emitEvent: false });
    }
  }

  private parseAndFormatDate(input: string): Date | null {
    if (!input || input.trim() === '') return null;

    const trimmed = input.trim();

    // Try to parse various date formats
    // Format: DDMMMYYYY, DD-MMM-YYYY, DD/MM/YYYY, MM/DD/YYYY, etc.
    const monthMap: { [key: string]: number } = {
      'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
    };

    // Pattern 1: DDMMMYYYY (e.g., 15JUN2024)
    let match = trimmed.match(/^(\d{1,2})([A-Z]{3})(\d{4})$/i);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthStr = match[2].toUpperCase();
      const year = parseInt(match[3], 10);
      const month = monthMap[monthStr];

      if (month !== undefined && day >= 1 && day <= 31) {
        return new Date(year, month, day);
      }
    }

    // Pattern 2: DD-MMM-YYYY (e.g., 15-JUN-2024)
    match = trimmed.match(/^(\d{1,2})-([A-Z]{3})-(\d{4})$/i);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthStr = match[2].toUpperCase();
      const year = parseInt(match[3], 10);
      const month = monthMap[monthStr];

      if (month !== undefined && day >= 1 && day <= 31) {
        return new Date(year, month, day);
      }
    }

    // Pattern 3: MM/DD/YYYY or DD/MM/YYYY - default browser parsing
    const browserDate = new Date(trimmed);
    if (!isNaN(browserDate.getTime())) {
      return browserDate;
    }

    return null;
  }

  private formatDateToDDMMMYYYY(date: Date): string {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Bug #11: Conditional asterisks based on extract type
  shouldShowRedTopAsterisk(): boolean {
    const extractType = this.boxForm.get('extractType')?.value;
    return extractType === 'V' || extractType === 'B';
  }

  shouldShowPurpleTop1Asterisk(): boolean {
    const extractType = this.boxForm.get('extractType')?.value;
    return extractType === 'V' || extractType === 'B';
  }

  shouldShowPurpleTop2Asterisk(): boolean {
    const extractType = this.boxForm.get('extractType')?.value;
    return extractType === 'N' || extractType === 'B';
  }

  isPurpleTop2Required(): boolean {
    const extractType = this.boxForm.get('extractType')?.value;
    // Purple Top 2 is strictly required for NAT (only field available)
    return extractType === 'N';
  }

  onPageChange(event: TablePageEvent): void {
    if (this.tableConfig.pagination) {
      this.tableConfig.pagination.pageIndex = event.pageIndex;
      this.tableConfig.pagination.pageSize = event.pageSize;
    }
  }

  onSortChange(event: TableSortEvent): void {
    if (this.tableConfig.sortConfig) {
      this.tableConfig.sortConfig.column = event.column;
      this.tableConfig.sortConfig.direction = event.direction;
    }

    // Actually sort the data
    const currentData = this.tubeEntries();
    const sortedData = [...currentData].sort((a, b) => {
      const column = event.column as keyof SamplePackTubeDto;
      const aValue = a[column];
      const bValue = b[column];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      // Apply sort direction
      return event.direction === 'A' ? comparison : -comparison;
    });

    this.tubeEntries.set(sortedData);
  }

  // Helper methods for printing
  private formatDateForPrint(date: Date | string | null): string {
    if (!date) return '-';
    const m = this.chapterTimezoneService.getChapterLocalDate();
    const d = typeof date === 'string' ? new Date(date) : date;
    // Format as DD-MMM-YYYY
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = d.getDate().toString().padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private getExtractTypeLabelForPrint(extractType: string): string {
    const labels: Record<string, string> = {
      'V': 'Viral Marker',
      'N': 'NAT',
      'B': 'Both',
    };
    return labels[extractType] || extractType;
  }

  private getDonorTypeLabelForPrint(donorType: string): string {
    const labels: Record<string, string> = {
      'I': 'First Time',
      'R': 'Repeat',
      'O': 'Others',
    };
    return labels[donorType] || donorType;
  }

  private generatePrintHtml(box: SamplePackDto, tubes: SamplePackTubeDto[]): string {
    const redTopCount = tubes.filter(t => t.redTubeFlag === 'Y').length;
    const purpleTop1Count = tubes.filter(t => t.purpleTubeFlag === 'Y').length;
    const purpleTop2Count = tubes.filter(t => t.purpleTube2Flag === 'Y').length;
    const totalTubeCount = redTopCount + purpleTop1Count + purpleTop2Count;
    const uniqueUnitCount = tubes.length;

    const rows = tubes.map((tube, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="font-family: 'Courier New', monospace; font-weight: 500;">${tube.unitId}</td>
        <td style="text-align: center;">${tube.redTubeFlag === 'Y' ? 'R1' : '-'}</td>
        <td style="text-align: center;">${tube.purpleTubeFlag === 'Y' ? 'P1' : '-'}</td>
        <td style="text-align: center;">${tube.purpleTube2Flag === 'Y' ? 'P2' : '-'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tube Shipment Pack List - Box ${box.boxId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .header h1 {
              font-size: 22px;
              margin: 0 0 8px 0;
              font-weight: 600;
            }
            .header .print-date {
              font-size: 12px;
              color: #666;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              margin: 0 0 12px 0;
              padding-bottom: 8px;
              border-bottom: 1px solid #e0e0e0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .info-item {
              display: flex;
              gap: 8px;
            }
            .info-label {
              font-weight: 600;
              min-width: 120px;
              color: #666;
            }
            .info-value {
              color: #333;
            }
            .summary-section {
              background: #f5f5f5;
              padding: 16px;
              border: 1px solid #333;
              margin-bottom: 25px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }
            .summary-item {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
              font-weight: 500;
            }
            .summary-value {
              font-size: 20px;
              font-weight: 600;
              color: #1976d2;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background: #f5f5f5;
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
              border-bottom: 2px solid #333;
            }
            td {
              padding: 10px 8px;
              border-bottom: 1px solid #ddd;
            }
            .footer {
              margin-top: 60px;
              padding-top: 24px;
              border-top: 1px solid #333;
              page-break-inside: avoid;
            }
            .signature-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 24px;
              gap: 32px;
            }
            .signature-line span {
              flex: 1;
              font-size: 13px;
              color: #666;
              border-bottom: 1px solid #333;
              padding-bottom: 4px;
            }
            @media print {
              body {
                margin: 0;
                padding: 15px;
              }
              .section, .summary-section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tube Shipment Pack List</h1>
            <div class="print-date">Printed: ${this.formatDateForPrint(new Date())}</div>
          </div>

          <div class="section">
            <h2 class="section-title">Box Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Box ID:</span>
                <span class="info-value">${box.boxId}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Collection Date:</span>
                <span class="info-value">${this.formatDateForPrint(box.collDate)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Extract Type:</span>
                <span class="info-value">${this.getExtractTypeLabelForPrint(box.extractType)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Donor Type:</span>
                <span class="info-value">${this.getDonorTypeLabelForPrint(box.donorType)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Destination:</span>
                <span class="info-value">${box.destinationCode}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value">${box.status || 'Closed'}</span>
              </div>
            </div>
          </div>

          <div class="summary-section">
            <h2 class="section-title">Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Unique Units:</span>
                <span class="summary-value">${uniqueUnitCount}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Total Tubes:</span>
                <span class="summary-value">${totalTubeCount}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Red Top (R1):</span>
                <span class="summary-value">${redTopCount}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Purple Top 1 (P1):</span>
                <span class="summary-value">${purpleTop1Count}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Purple Top 2 (P2):</span>
                <span class="summary-value">${purpleTop2Count}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Tube Details</h2>
            ${tubes.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">#</th>
                    <th>Unit ID</th>
                    <th style="text-align: center;">Red Top (R1)</th>
                    <th style="text-align: center;">Purple Top 1 (P1)</th>
                    <th style="text-align: center;">Purple Top 2 (P2)</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            ` : '<p style="text-align: center; padding: 40px; color: #999; font-style: italic;">No tubes in this box.</p>'}
          </div>

          <div class="footer">
            <div class="signature-line">
              <span>Prepared by: _______________________________</span>
              <span>Date: _______________________________</span>
            </div>
            <div class="signature-line">
              <span>Verified by: _______________________________</span>
              <span>Date: _______________________________</span>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
