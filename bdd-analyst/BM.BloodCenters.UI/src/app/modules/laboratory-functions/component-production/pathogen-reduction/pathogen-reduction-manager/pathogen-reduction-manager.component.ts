import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';

// Angular Material
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

// Shared Components
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';

// Shared Services
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

// Shared Utils
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

// Date Formatting
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import moment from 'moment';

// Models and Services
import { PathogenReductionManagerService } from './services/pathogen-reduction-manager.service';
import { ProductDetailsDto } from './models/pathogen-reduction.model';
import {
  CheckSuitabilityRequestDto,
  SaveSuitabilityRequestDto,
  PathogenFinalProductDto,
  ReprintLabelRequestDto,
  UpdateFinalTransferRequestDto,
  UpdateIntermediateProcessRequestDto
} from './models/pathogen-reduction.model';
import { InitialSterileDockingPanelComponent } from './initial-sterile-docking-panel/initial-sterile-docking-panel.component';
import { PsoralenRemovalPanelComponent } from './psoralen-removal-panel/psoralen-removal-panel.component';
import { IlluminationBagRemovalPanelComponent } from './illumination-bag-removal-panel/illumination-bag-removal-panel.component';
import { QueryStatusPanelComponent } from './query-status-panel/query-status-panel.component';
import { CadBagRemovalPanelComponent } from './cad-bag-removal-panel/cad-bag-removal-panel.component';

// Constants
import { ROUTES } from '@core/constants/route.constants';

interface LookupOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-pathogen-reduction-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './pathogen-reduction-manager.component.html',
  styleUrl: './pathogen-reduction-manager.component.scss'
})
export class PathogenReductionManagerComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `pathogen-reduction-manager-${PathogenReductionManagerComponent.nextId++}`;

  private readonly fb = inject(FormBuilder);
  private readonly prService = inject(PathogenReductionManagerService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loginService = inject(LoginService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('unitIdField') unitIdField!: UnitIdFieldComponent;
  @ViewChild('intermediateUnitIdField') intermediateUnitIdField!: UnitIdFieldComponent;
  @ViewChild('finalUnitIdField') finalUnitIdField!: UnitIdFieldComponent;

  // Forms
  verifySuitabilityForm!: FormGroup;
  intermediateProcessForm!: FormGroup;
  finalTransferForm!: FormGroup;
  uploadManuallyForm!: FormGroup;

  // State signals
  loading = signal<boolean>(false);
  selectedTabIndex = 0;
  suitabilityStatus = signal<string | null>(null);
  showRejectionReason = signal<boolean>(false);

  // Flags for button enable/disable
  isSuitabilityPassed = signal<boolean>(false); // SUIT_STATUS_CODE = 'Y'
  isSterileDockingCompleted = signal<boolean>(false); // Record exists in pathogen_sterile_docking for PSORALEN
  isRemoveBagEnabled = signal<boolean>(false); // API flag: true = ENABLE buttons, false = DISABLE buttons
  hasInterimProductCode = signal<boolean>(false); // SUIT_PROD_CODE IS NOT NULL — required for sterile docking per FMB

  // Max date for Process Date - set to chapter local date (today)
  maxProcessDate!: Date;

  // Upload Manually state
  selectedFiles: File[] = [];
  isDraggingOver = false;

  // Specific gravity cache - Map<productCode, specificGravity>
  private specificGravityCache = new Map<string, number>();

  // Lookup options signals - loaded from API
  productCategories = signal<LookupOption[]>([]);
  productCodes = signal<LookupOption[]>([]);
  suspensionTypes = signal<LookupOption[]>([]);
  suspensionEquipmentMap = new Map<string, string>(); // Map combined key (suspensionType|equipType) to equipType
  volumeTypeSets = signal<LookupOption[]>([]);
  interimProductCodes = signal<LookupOption[]>([]);
  equipmentSerialNumbers = signal<LookupOption[]>([]);
  illuminatorEquipmentTypes = signal<LookupOption[]>([]);
  sterileDockingMachines = signal<LookupOption[]>([]);
  waferLotNumbers = signal<LookupOption[]>([]);
  setLotNumbers = signal<LookupOption[]>([]);
  chapters = signal<LookupOption[]>([]);
  cadProductCodes = signal<LookupOption[]>([]);

  // Final Products table data
  finalProducts = signal<PathogenFinalProductDto[]>([]);
  selectedProduct = signal<PathogenFinalProductDto | null>(null);
  currentChapterId = signal<string>('');
  currentProductCategory = signal<string>(''); // Store product category from API response

  // Search controls for dropdowns
  productCategorySearchControl = new FormControl('');
  productCodeSearchControl = new FormControl('');
  suspensionTypeSearchControl = new FormControl('');
  volumeTypeSetSearchControl = new FormControl('');
  interimProductCodeSearchControl = new FormControl('');
  equipmentSerialNumberSearchControl = new FormControl('');
  illuminatorEquipmentTypeSearchControl = new FormControl('');
  sterileDockingMachineSearchControl = new FormControl('');
  waferLotNumberSearchControl = new FormControl('');
  setLotNumberSearchControl = new FormControl('');
  intermediateInterimProductCodeSearchControl = new FormControl('');
  intermediateEquipmentTypeSearchControl = new FormControl('');
  cadProductCodeSearchControl = new FormControl('');

  // Filtered lookup options
  filteredProductCategories = signal<LookupOption[]>([]);
  filteredProductCodes = signal<LookupOption[]>([]);
  filteredSuspensionTypes = signal<LookupOption[]>([]);
  filteredVolumeTypeSets = signal<LookupOption[]>([]);
  filteredInterimProductCodes = signal<LookupOption[]>([]);
  filteredEquipmentSerialNumbers = signal<LookupOption[]>([]);
  filteredIlluminatorEquipmentTypes = signal<LookupOption[]>([]);
  filteredSterileDockingMachines = signal<LookupOption[]>([]);
  filteredWaferLotNumbers = signal<LookupOption[]>([]);
  filteredSetLotNumbers = signal<LookupOption[]>([]);
  filteredCadProductCodes = signal<LookupOption[]>([]);

  // Validated unit ID
  private validatedUnitId: string | null = null;

  // Manual unit ID with check digit (for display purposes)
  private manualUnitIdWithCheckDigit: string | null = null;

  // Saved unit ID from save response - to be passed to panels as read-only
  savedUnitIdForPanels: string | null = null;

  // Track auto-calculated interim product code to remove it when user selects a different code
  private autoCalculatedInterimCode: string | null = null;

  // Store process date/time from API response for validation (from getPathogenReductionDetails)
  private processDateTime: moment.Moment | null = null;

  // Store bleed end time from UNITS table for validation (from getUnitDetails)
  private bleedEndTime: moment.Moment | null = null;

  // Header config - dynamically loaded from menu items API via PageHeaderService
  headerConfig = computed(() => {
    const pageData = this.pageHeaderService.pageHeaderData();
    return {
      title: pageData?.title || 'Pathogen Reduction Manager',
      subtitle: pageData?.subtitle || 'Manage pathogen reduction processes to inactivate viruses, bacteria, and parasites in donated blood.',
      breadcrumbs: [
        { label: 'Home', link: ROUTES.HOME },
        { label: pageData?.title || 'Pathogen Reduction Manager', link: null }
      ]
    };
  });

  ngOnInit(): void {
    // Set max date to chapter local date (today) using ChapterTimezoneService
    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate();

    // Create Date object at end of day for the chapter local date
    this.maxProcessDate = chapterLocalDate.endOf('day').toDate();

    this.initForms();
    this.loadLookups();
    this.loadRemoveBagEnabled();
    this.setupSearchFilters();
    this.setupSuspensionTypeListener();
    this.setupProductCategoryListener();
    this.setupProductCodeListener();
    this.setupProcessDateTimeListeners();
    this.setupTreatmentDateTimeListeners();
    this.setupEquipmentTypeListener();
    this.setupInterimProductCodeListener();
    this.subscribeToChapterChanges();

    // Check if returning from PHERESIS or REJECT screen
    this.restoreFormStateIfReturning();

    // Mark form as pristine and untouched to avoid showing validation errors on load
    this.verifySuitabilityForm.markAsPristine();
    this.verifySuitabilityForm.markAsUntouched();

    // Debug: Log suspension type field state
    setTimeout(() => {
      const suspensionTypeControl = this.verifySuitabilityForm.get('suspensionType');
      const productCategoryControl = this.verifySuitabilityForm.get('productCategory');
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to chapter change events
   * When chapter changes in header, reset all forms and state
   */
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reset all tabs to initial state when chapter changes
        this.selectedTabIndex = 0;

        // Clear validated unit IDs
        this.validatedUnitId = null;
        this.manualUnitIdWithCheckDigit = null;
        this.savedUnitIdForPanels = null;

        // Clear suitability status
        this.suitabilityStatus.set(null);
        this.showRejectionReason.set(false);

        // Clear button enable flags
        this.isSuitabilityPassed.set(false);
        this.isSterileDockingCompleted.set(false);

        // Clear final products table
        this.finalProducts.set([]);
        this.selectedProduct.set(null);
        this.currentChapterId.set('');

        // Clear all unit ID fields
        if (this.unitIdField) {
          this.unitIdField.clear();
        }
        if (this.intermediateUnitIdField) {
          this.intermediateUnitIdField.clear();
        }
        if (this.finalUnitIdField) {
          this.finalUnitIdField.clear();
        }

        // Reset all forms to initial state
        this.verifySuitabilityForm.reset();
        this.intermediateProcessForm.reset({
          treatmentDate: this.chapterTimezoneService.getChapterLocalDate().toDate(),
          treatmentStartTime: this.chapterTimezoneService.getChapterLocalDateTime().format('HH:mm')
        });
        this.finalTransferForm.reset();
        this.uploadManuallyForm.reset({
          date: this.chapterTimezoneService.getChapterLocalDate().toDate()
        });

        // Clear all dropdown data that may be chapter-specific
        this.productCodes.set([]);
        this.filteredProductCodes.set([]);
        this.suspensionTypes.set([]);
        this.filteredSuspensionTypes.set([]);
        this.equipmentSerialNumbers.set([]);
        this.filteredEquipmentSerialNumbers.set([]);
        this.setLotNumbers.set([]);
        this.filteredSetLotNumbers.set([]);
        this.cadProductCodes.set([]);
        this.filteredCadProductCodes.set([]);

        // Reload lookups for the new chapter
        this.loadLookups();
        this.loadRemoveBagEnabled();

        // Close any open dialogs
        this.dialog.closeAll();
      });
  }

  /**
   * Restore form state if returning from PHERESIS or REJECT screen
   * Uses query parameters pattern (similar to verify-control-values)
   */
  private restoreFormStateIfReturning(): void {
    // Check for query params (from navigation back from child screens)
    const initialParams = this.route.snapshot.queryParams;

    if (initialParams['unitId'] || initialParams['tabIndex']) {
      setTimeout(async () => {
        // Restore tab index FIRST
        const tabIndex = initialParams['tabIndex'] ? parseInt(initialParams['tabIndex'], 10) : 0;
        this.selectedTabIndex = tabIndex;

        // Restore validated unit ID (parsed)
        if (initialParams['parsedUnitId']) {
          this.validatedUnitId = initialParams['parsedUnitId'];
        }

        // Tab 0: Verify Suitability - restore verify suitability form
        if (tabIndex === 0) {
          // Manually set the unit ID field display value (this won't trigger validation)
          if (initialParams['unitId'] && this.unitIdField) {
            this.unitIdField.unitIdControl?.setValue(initialParams['unitId'], { emitEvent: false });
          }

          // Load unit details directly using the parsed unit ID (no field validation)
          if (initialParams['parsedUnitId']) {
            try {
              this.loading.set(true);
              const unitDetails = await this.prService.getUnitDetails(initialParams['parsedUnitId']).toPromise();

              if (unitDetails) {
                if (unitDetails.collDate) {
                  this.verifySuitabilityForm.get('date')?.setValue(new Date(unitDetails.collDate));
                }
                if (unitDetails.bleedEndTime) {
                  this.verifySuitabilityForm.get('bleedEndTime')?.setValue(this.formatDisplayDateTime(unitDetails.bleedEndTime));
                }
              }
              this.loading.set(false);
            } catch (error) {
              this.loading.set(false);
            }
          }

          // Restore Product Category first (triggers product code loading)
          if (initialParams['productCategory']) {
            this.verifySuitabilityForm.patchValue({
              productCategory: initialParams['productCategory']
            }, { emitEvent: true });
          }

          // Wait for product codes to load, then restore Product Code first
          setTimeout(() => {
            // Step 1: Restore Product Code WITH event emission
            // This triggers getProductDetails API which loads suspension types and auto-populates fields
            if (initialParams['productCode']) {
              this.verifySuitabilityForm.patchValue({
                productCode: initialParams['productCode']
              }, { emitEvent: true }); // Triggers product details API call
            }

            // Step 2: Wait for product details to load, then restore remaining fields
            setTimeout(() => {
              // Restore suspension type WITH event emission to trigger equipment type population
              if (initialParams['suspensionType']) {
                this.verifySuitabilityForm.patchValue({
                  suspensionType: initialParams['suspensionType']
                }, { emitEvent: true }); // Triggers equipment type auto-population
              }

              // Restore all other fields without event emission
              this.verifySuitabilityForm.patchValue({
                volumeTypeSet: initialParams['volumeTypeSet'] || null,
                initialPlateletCount: initialParams['initialPlateletCount'] || null,
                productWeight: initialParams['productWeight'] || null,
                initialProductVolume: initialParams['initialProductVolume'] || null,
                rbcContent: initialParams['rbcContent'] || null,
                anticoagulantVolume: initialParams['anticoagulantVolume'] || null,
                processTime: initialParams['processTime'] || null,
                aggregates: initialParams['aggregates'] || null,
                interimProductCode: initialParams['interimProductCode'] || null,
                processDate: initialParams['processDate'] ? new Date(initialParams['processDate']) : null
              }, { emitEvent: false });

              if (initialParams['suitabilityStatus']) {
                this.suitabilityStatus.set(initialParams['suitabilityStatus']);
              }
            }, 800); // Wait for product details API to complete
          }, 500);
        }
        // Tab 1: Intermediate Process - restore intermediate process form
        else if (tabIndex === 1) {
          // Directly call the unit validation handler with the validated unit ID
          if (initialParams['parsedUnitId']) {
            // Manually set the unit ID field display value (this won't trigger validation)
            if (this.intermediateUnitIdField) {
              this.intermediateUnitIdField.unitIdControl?.setValue(initialParams['unitId'], { emitEvent: false });
            }

            // Directly load unit details by calling the API (skip validation since we already have valid ID)
            this.loading.set(true);
            this.prService.getUnitDetails(initialParams['parsedUnitId'])
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (unitDetails) => {
                  // Populate Collection Date
                  if (unitDetails.collDate) {
                    this.intermediateProcessForm.get('date')?.setValue(new Date(unitDetails.collDate));
                  }

                  // Then load pathogen reduction details
                  this.prService.getPathogenReductionDetails(initialParams['parsedUnitId'])
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                      next: (details) => {
                        this.loading.set(false);

                        // Populate all auto-filled fields (same logic as onIntermediateUnitIdValidated)
                        if (details.volTypeSet) {
                          this.intermediateProcessForm.get('volumeTypeSet')?.setValue(details.volTypeSet);
                        }
                        // Populate Illumination Status (0 or 1)
                        if (details.illuminationStatus !== null && details.illuminationStatus !== undefined) {
                          // Convert to number to ensure proper binding (backend might send as string "0" or "1")
                          const statusValue = typeof details.illuminationStatus === 'string'
                            ? parseInt(details.illuminationStatus, 10)
                            : details.illuminationStatus;
                          this.intermediateProcessForm.get('status')?.setValue(statusValue);
                        }
                        // Populate Illuminator Message separately
                        if (details.illuminatorMessage) {
                          this.intermediateProcessForm.get('instrumentMessage')?.setValue(details.illuminatorMessage);
                        }
                        // Populate Serial Number (Illuminator Reference)
                        if (details.illuminatorReference) {
                          this.intermediateProcessForm.get('serialNumber')?.setValue(details.illuminatorReference);
                        }
                        // Populate Operator ID
                        if (details.operatorId) {
                          this.intermediateProcessForm.get('operatorId')?.setValue(details.operatorId);
                        }
                        // Populate Treatment Date
                        if (details.treatmentDate) {
                          this.intermediateProcessForm.get('treatmentDate')?.setValue(new Date(details.treatmentDate));
                        }
                        // Populate Treatment Start Time
                        if (details.treatmentStartTime) {
                          this.intermediateProcessForm.get('treatmentStartTime')?.setValue(new Date(details.treatmentStartTime));
                        }
                        // Populate Treatment Elapsed Time
                        if (details.treatmentTime) {
                          this.intermediateProcessForm.get('treatmentElapsedTime')?.setValue(details.treatmentTime);
                        }
                        if (details.setIdLotNo) {
                          this.intermediateProcessForm.get('setIdLotNumber')?.setValue(details.setIdLotNo);
                        }
                        if (details.cadProdCode) {
                          this.intermediateProcessForm.get('cadProd')?.setValue(details.cadProdCode);
                        }
                        // Populate Interim Product Code (Suit Product Code)
                        if (details.suitProdCode) {
                          this.intermediateProcessForm.get('interimProductCode')?.setValue(details.suitProdCode);
                          // Load CAD product codes using productCategory from API response
                          this.loadCadProductCodes(
                            details.suitProdCode,
                            details.cadProdCode ?? undefined,
                            details.productCategory ?? undefined
                          );
                        }
                        if (details.illuminatorMessage) {
                          this.intermediateProcessForm.get('instrumentMessage')?.setValue(details.illuminatorMessage);
                        }

                        // Now restore user-entered fields from query params
                        setTimeout(() => {
                          this.intermediateProcessForm.patchValue({
                            treatmentDate: initialParams['treatmentDate'] ? new Date(initialParams['treatmentDate']) : null,
                            treatmentStartTime: initialParams['treatmentStartTime'] || null,
                            treatmentElapsedTime: initialParams['treatmentElapsedTime'] || null,
                            cadStartDate: initialParams['cadStartDate'] ? new Date(initialParams['cadStartDate']) : null,
                            cadStartTime: initialParams['cadStartTime'] || null
                          }, { emitEvent: false });
                        }, 100);
                      },
                      error: (error) => {
                        this.loading.set(false);
                      }
                    });
                },
                error: (error) => {
                  this.loading.set(false);
                }
              });
          }
        }
        // Tab 2: Final Transfer - restore final transfer form
        else if (tabIndex === 2) {
          // Directly call the unit validation handler with the validated unit ID
          if (initialParams['parsedUnitId']) {
            // Manually set the unit ID field display value (this won't trigger validation)
            if (this.finalUnitIdField) {
              this.finalUnitIdField.unitIdControl?.setValue(initialParams['unitId'], { emitEvent: false });
            }

            // Directly load pathogen reduction details by calling the API
            this.loading.set(true);
            this.prService.getPathogenReductionDetails(initialParams['parsedUnitId'])
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (details) => {
                  this.loading.set(false);

                  // Store chapter ID for reprint label
                  this.currentChapterId.set(details.chapterId || '');

                  // Populate Final Transfer form (same logic as onFinalUnitIdValidated)
                  this.finalTransferForm.patchValue({
                    date: details.collDate ? new Date(details.collDate) : null,
                    interimProductCode: details.suitProdCode || '',
                    cadProd: details.cadProdCode || '',
                    cadStartTime: details.cadStartTime || '',
                    cadStartTime2: details.cadStartTime || '',
                    cadElapsedTime: details.cadTotalTime || '',
                    cadStatus: details.illuminatorMessage || '',
                    volumeTypeSet: details.volTypeSet || '',
                    setIdLotNumber: details.setIdLotNo || ''
                  }, { emitEvent: false });

                  // Load final products table data
                  if (details.suitProdCode) {
                    this.loadFinalProducts(initialParams['parsedUnitId'], details.suitProdCode);
                  } else {
                    this.finalProducts.set([]);
                  }

                  // Restore user-entered fields from query params
                  setTimeout(() => {
                    this.finalTransferForm.patchValue({
                      cadEndTime: initialParams['cadEndTime'] || null,
                      cadEndTime2: initialParams['cadEndTime2'] || null,
                      numberOfBags: initialParams['numberOfBags'] || null
                    }, { emitEvent: false });
                  }, 100);
                },
                error: (error) => {
                  this.loading.set(false);
                }
              });
          }
        }
      }, 100);
    }
  }

  /**
   * Custom validator: At least one of Product Weight or Product Volume must be provided
   */
  private atLeastOneWeightOrVolumeValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const productWeight = formGroup.get('productWeight')?.value;
    const initialProductVolume = formGroup.get('initialProductVolume')?.value;

    if (!productWeight && !initialProductVolume) {
      return { atLeastOneWeightOrVolume: true };
    }

    return null;
  }

  /**
   * Custom validator: Process Date/Time combination must not be in the future
   * This is a form-level validator that checks both processDate and processTime
   */
  private notFutureDateTimeValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const processDate = formGroup.get('processDate')?.value;
    const processTime = formGroup.get('processTime')?.value;

    // Only validate if both date and time are present
    if (!processDate || !processTime) {
      return null;
    }

    try {
      // Combine date and time
      const datePart = moment(processDate).format('YYYY-MM-DD');
      const combinedDateTime = moment(`${datePart} ${processTime}`, 'YYYY-MM-DD HH:mm');

      // Get current chapter local date/time with CURRENT time (not midnight)
      const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();

      if (combinedDateTime.isAfter(chapterNow)) {
        // Set error on BOTH date and time fields so it displays under processDate
        const dateControl = formGroup.get('processDate');
        const timeControl = formGroup.get('processTime');

        // Set error on date field (to display message)
        const dateErrors = dateControl?.errors || {};
        dateControl?.setErrors({ ...dateErrors, futureDateTimeCombined: true }, { emitEvent: false });

        // Set error on time field (for red indicator)
        const timeErrors = timeControl?.errors || {};
        timeControl?.setErrors({ ...timeErrors, futureDateTime: true }, { emitEvent: false });

        return { futureDateTime: true };
      } else {
        // Clear the errors if date/time is valid
        const dateControl = formGroup.get('processDate');
        const timeControl = formGroup.get('processTime');

        // Clear date control error
        if (dateControl?.hasError('futureDateTimeCombined')) {
          const errors = { ...dateControl.errors };
          delete errors['futureDateTimeCombined'];
          dateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }

        // Clear time control error
        if (timeControl?.hasError('futureDateTime')) {
          const errors = { ...timeControl.errors };
          delete errors['futureDateTime'];
          timeControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      }
    } catch (error) {
    }

    return null;
  }

  /**
   * Custom validator: Treatment Date/Time combination must not be in the future
   * This is a form-level validator that checks both treatmentDate and treatmentStartTime
   */
  private notFutureTreatmentDateTimeValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const treatmentDate = formGroup.get('treatmentDate')?.value;
    const treatmentStartTime = formGroup.get('treatmentStartTime')?.value;

    // Only validate if both date and time are present
    if (!treatmentDate || !treatmentStartTime) {
      return null;
    }

    try {
      // Combine date and time
      const datePart = moment(treatmentDate).format('YYYY-MM-DD');
      const combinedDateTime = moment(`${datePart} ${treatmentStartTime}`, 'YYYY-MM-DD HH:mm');

      // Get current chapter local date/time with CURRENT time (not midnight)
      const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();

      if (combinedDateTime.isAfter(chapterNow)) {
        // Set error on BOTH date and time fields so it displays under treatmentDate
        const dateControl = formGroup.get('treatmentDate');
        const timeControl = formGroup.get('treatmentStartTime');

        // Set error on date field (to display message)
        const dateErrors = dateControl?.errors || {};
        dateControl?.setErrors({ ...dateErrors, futureDateTimeCombined: true }, { emitEvent: false });
        dateControl?.markAsTouched();

        // Set error on time field (for red indicator)
        const timeErrors = timeControl?.errors || {};
        timeControl?.setErrors({ ...timeErrors, futureDateTime: true }, { emitEvent: false });

        return { futureDateTime: true };
      } else {
        // Clear the errors if date/time is valid
        const dateControl = formGroup.get('treatmentDate');
        const timeControl = formGroup.get('treatmentStartTime');

        // Clear date control error
        if (dateControl?.hasError('futureDateTimeCombined')) {
          const errors = { ...dateControl.errors };
          delete errors['futureDateTimeCombined'];
          dateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }

        // Clear time control error
        if (timeControl?.hasError('futureDateTime')) {
          const errors = { ...timeControl.errors };
          delete errors['futureDateTime'];
          timeControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      }
    } catch (error) {
    }

    return null;
  }

  /**
   * Custom validator: CAD Start Date/Time combination must not be in the future
   * This is a form-level validator that checks both cadStartDate and cadStartTime
   */
  private notFutureCadStartDateTimeValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const cadStartDate = formGroup.get('cadStartDate')?.value;
    const cadStartTime = formGroup.get('cadStartTime')?.value;

    // Only validate if both date and time are present
    if (!cadStartDate || !cadStartTime) {
      return null;
    }

    try {
      // Combine date and time
      const datePart = moment(cadStartDate).format('YYYY-MM-DD');
      const combinedDateTime = moment(`${datePart} ${cadStartTime}`, 'YYYY-MM-DD HH:mm');

      // Get current chapter local date/time with CURRENT time (not midnight)
      const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();

      if (combinedDateTime.isAfter(chapterNow)) {
        // Set error on BOTH date and time fields so it displays under cadStartDate
        const dateControl = formGroup.get('cadStartDate');
        const timeControl = formGroup.get('cadStartTime');

        // Set error on date field (to display message)
        const dateErrors = dateControl?.errors || {};
        dateControl?.setErrors({ ...dateErrors, futureDateTimeCombined: true }, { emitEvent: false });
        dateControl?.markAsTouched();

        // Set error on time field (for red indicator)
        const timeErrors = timeControl?.errors || {};
        timeControl?.setErrors({ ...timeErrors, futureDateTime: true }, { emitEvent: false });

        return { futureDateTime: true };
      } else {
        // Clear the errors if date/time is valid
        const dateControl = formGroup.get('cadStartDate');
        const timeControl = formGroup.get('cadStartTime');

        // Clear date control error
        if (dateControl?.hasError('futureDateTimeCombined')) {
          const errors = { ...dateControl.errors };
          delete errors['futureDateTimeCombined'];
          dateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }

        // Clear time control error
        if (timeControl?.hasError('futureDateTime')) {
          const errors = { ...timeControl.errors };
          delete errors['futureDateTime'];
          timeControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      }
    } catch (error) {
    }

    return null;
  }

  /**
   * Custom validator: Treatment Date/Time must not be later than Process Date/Time
   * This validator checks that Treatment Date/Time <= Process Date/Time from API response
   */
  private treatmentNotAfterProcessValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const treatmentDate = formGroup.get('treatmentDate')?.value;
    const treatmentStartTime = formGroup.get('treatmentStartTime')?.value;

    // Only validate if both treatment date and time are present
    if (!treatmentDate || !treatmentStartTime || !this.processDateTime) {
      return null;
    }

    try {
      // Combine treatment date and time
      const datePart = moment(treatmentDate).format('YYYY-MM-DD');
      const treatmentDateTime = moment(`${datePart} ${treatmentStartTime}`, 'YYYY-MM-DD HH:mm');

      // Compare with process date/time from API response
      if (treatmentDateTime.isAfter(this.processDateTime)) {
        // Set error on BOTH date and time fields
        const dateControl = formGroup.get('treatmentDate');
        const timeControl = formGroup.get('treatmentStartTime');

        // Set error on date field (to display message)
        const dateErrors = dateControl?.errors || {};
        dateControl?.setErrors({ ...dateErrors, treatmentAfterProcess: true }, { emitEvent: false });
        dateControl?.markAsTouched();

        // Set error on time field (for red indicator)
        const timeErrors = timeControl?.errors || {};
        timeControl?.setErrors({ ...timeErrors, treatmentAfterProcess: true }, { emitEvent: false });

        return { treatmentAfterProcess: true };
      } else {
        // Clear the errors if date/time is valid
        const dateControl = formGroup.get('treatmentDate');
        const timeControl = formGroup.get('treatmentStartTime');

        // Clear date control error
        if (dateControl?.hasError('treatmentAfterProcess')) {
          const errors = { ...dateControl.errors };
          delete errors['treatmentAfterProcess'];
          dateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }

        // Clear time control error
        if (timeControl?.hasError('treatmentAfterProcess')) {
          const errors = { ...timeControl.errors };
          delete errors['treatmentAfterProcess'];
          timeControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      }
    } catch (error) {
    }

    return null;
  }

  /**
   * Custom validator: Process Date/Time must not be earlier than Bleed End Time (error 0475)
   * This validator checks that Process Date/Time >= Bleed End Time from UNITS table
   */
  private processNotBeforeBleedEndValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const processDate = formGroup.get('processDate')?.value;
    const processTime = formGroup.get('processTime')?.value;

    // Only validate if both process date and time are present AND bleedEndTime is available
    if (!processDate || !processTime || !this.bleedEndTime) {
      return null;
    }

    try {
      // Combine process date and time
      const datePart = moment(processDate).format('YYYY-MM-DD');
      const processDateTime = moment(`${datePart} ${processTime}`, 'YYYY-MM-DD HH:mm');

      // Compare with bleed end time from UNITS table
      if (processDateTime.isBefore(this.bleedEndTime)) {
        // Set error on BOTH date and time fields
        const dateControl = formGroup.get('processDate');
        const timeControl = formGroup.get('processTime');

        // Set error on date field (to display message)
        const dateErrors = dateControl?.errors || {};
        dateControl?.setErrors({ ...dateErrors, processBeforeBleedEnd: true }, { emitEvent: false });
        dateControl?.markAsTouched();

        // Set error on time field (for red indicator)
        const timeErrors = timeControl?.errors || {};
        timeControl?.setErrors({ ...timeErrors, processBeforeBleedEnd: true }, { emitEvent: false });

        return { processBeforeBleedEnd: true };
      } else {
        // Clear the errors if date/time is valid
        const dateControl = formGroup.get('processDate');
        const timeControl = formGroup.get('processTime');

        // Clear date control error
        if (dateControl?.hasError('processBeforeBleedEnd')) {
          const errors = { ...dateControl.errors };
          delete errors['processBeforeBleedEnd'];
          dateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }

        // Clear time control error
        if (timeControl?.hasError('processBeforeBleedEnd')) {
          const errors = { ...timeControl.errors };
          delete errors['processBeforeBleedEnd'];
          timeControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      }
    } catch (error) {
    }

    return null;
  }

  /**
   * Custom validator: Process Date must not be in the future (beyond chapter local date)
   */
  private notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Let required validator handle empty value
    }

    const selectedDate = moment(control.value).startOf('day');
    const chapterLocalDate = this.chapterTimezoneService.getChapterLocalDate().startOf('day');

    if (selectedDate.isAfter(chapterLocalDate)) {
      return { futureDate: true };
    }

    return null;
  }

  /**
   * Setup listeners for Process Date and Time to trigger form-level validation
   */
  private setupProcessDateTimeListeners(): void {
    // When process date changes, revalidate the form to check futureDateTime
    this.verifySuitabilityForm.get('processDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.verifySuitabilityForm.updateValueAndValidity({ emitEvent: false });
      });

    // When process time changes, revalidate the form to check futureDateTime
    this.verifySuitabilityForm.get('processTime')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.verifySuitabilityForm.updateValueAndValidity({ emitEvent: false });
      });
  }

  /**
   * Setup listeners for Treatment Date and Time to trigger form-level validation
   */
  private setupTreatmentDateTimeListeners(): void {
    // When treatment date changes, revalidate the form to check futureDateTime
    this.intermediateProcessForm.get('treatmentDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.intermediateProcessForm.updateValueAndValidity({ emitEvent: false });
      });

    // When treatment start time changes, revalidate the form to check futureDateTime
    this.intermediateProcessForm.get('treatmentStartTime')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.intermediateProcessForm.updateValueAndValidity({ emitEvent: false });
      });

    // When CAD start date changes, revalidate the form to check futureDateTime
    this.intermediateProcessForm.get('cadStartDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.intermediateProcessForm.updateValueAndValidity({ emitEvent: false });
      });

    // When CAD start time changes, revalidate the form to check futureDateTime
    this.intermediateProcessForm.get('cadStartTime')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.intermediateProcessForm.updateValueAndValidity({ emitEvent: false });
      });
  }

  /**
   * Setup listener for Suspension Type changes to auto-populate Equipment Type
   * The suspension type value is now a combined key: "suspensionType|equipType"
   */
  private setupSuspensionTypeListener(): void {
    this.verifySuitabilityForm.get('suspensionType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(combinedKey => {

        const equipmentTypeControl = this.verifySuitabilityForm.get('equipmentType');

        if (combinedKey) {
          // Get equipment type from the map using the combined key
          const equipmentType = this.suspensionEquipmentMap.get(combinedKey);

          if (equipmentType) {
            // Set the equipment type
            equipmentTypeControl?.setValue(equipmentType, { emitEvent: false });
          } else {
            // Clear if no equipment type found
            equipmentTypeControl?.setValue('', { emitEvent: false });
          }
        } else {
          // Clear equipment type if suspension type is cleared
          equipmentTypeControl?.setValue('', { emitEvent: false });
        }
      });
  }

  /**
   * Listen to Product Category changes to load product codes
   * Product codes require: unitId (from validation) + collectionDate (from UNITS) + productCategory
   */
  private setupProductCategoryListener(): void {
    this.verifySuitabilityForm.get('productCategory')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(productCategory => {
        // Load product codes only if:
        // 1. Unit ID is validated
        // 2. Collection date is available
        // 3. Product category is selected
        if (this.validatedUnitId && productCategory) {
          const collectionDateValue = this.verifySuitabilityForm.get('date')?.value;
          if (collectionDateValue) {
            // Ensure collectionDate is a Date object
            const collectionDate = collectionDateValue instanceof Date
              ? collectionDateValue
              : new Date(collectionDateValue);
            this.loadProductCodes(this.validatedUnitId, collectionDate, productCategory);
          }
        } else {
          // Clear product codes if category is cleared
          this.productCodes.set([]);
          this.filteredProductCodes.set([]);
          this.verifySuitabilityForm.get('productCode')?.setValue(null);
        }
      });
  }

  /**
   * Setup Equipment Type listener to auto-populate Illuminator field and load serial numbers
   * When Equipment Type is selected:
   * 1. Populate Illuminator with the description
   * 2. Load equipment serial numbers for the selected type
   */
  private setupEquipmentTypeListener(): void {
    this.intermediateProcessForm.get('equipmentType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(equipmentTypeCode => {
        if (equipmentTypeCode) {
          // Find the selected equipment type from the original data source
          const selectedEquipmentType = this.illuminatorEquipmentTypes().find(
            type => type.value === equipmentTypeCode
          );
          // Set the Illuminator field with only the description (extract from "CODE - Description" format)
          if (selectedEquipmentType) {
            // Extract description from label (format: "ILL - Illuminator")
            const description = selectedEquipmentType.label.includes(' - ')
              ? selectedEquipmentType.label.split(' - ')[1]
              : selectedEquipmentType.label;
            this.intermediateProcessForm.get('illuminator')?.setValue(description, { emitEvent: false });
          }

          // Load equipment serial numbers for the selected equipment type
          this.loadEquipmentSerialNumbers(equipmentTypeCode);
        } else {
          // Clear Illuminator field if Equipment Type is cleared
          this.intermediateProcessForm.get('illuminator')?.setValue('', { emitEvent: false });
          // Clear serial numbers dropdown
          this.equipmentSerialNumbers.set([]);
          this.filteredEquipmentSerialNumbers.set([]);
          this.intermediateProcessForm.get('serialNumber')?.setValue('');
        }
      });
  }

  private setupInterimProductCodeListener(): void {
    this.verifySuitabilityForm.get('interimProductCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.hasInterimProductCode.set(!!value && value.trim().length > 0);
      });
  }

  /**
   * Load Suspension Types from API and optionally filter by Equipment Type
   * Called AFTER Product Details API returns to ensure proper filtering
   * @param productDetails - Product details from COMPONENTS table (null if no details found)
   */
  private loadSuspensionTypes(productDetails: ProductDetailsDto | null): void {
    this.prService.getSuspensionTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Build map and dropdown options - show all combinations
          this.suspensionEquipmentMap.clear();

          const options = data
            .filter(item => item.suspensionType && item.equipType) // Skip empty rows
            .map(item => {
              // Create a unique key combining suspension type and equipment type
              const combinedKey = `${item.suspensionType}|${item.equipType}`;

              // Store equipment type in map using combined key
              this.suspensionEquipmentMap.set(combinedKey, item.equipType);

              return {
                value: combinedKey, // Use combined key as value
                label: `${item.suspensionType} - ${item.equipType}` // Display both in label
              };
            });

          this.suspensionTypes.set(options);

          // Filter by Equipment Type if available from Product Details
          if (productDetails?.equipType) {
            this.filterSuspensionTypesByEquipmentType(productDetails.equipType);
          } else {
            // No equipment type - show all suspension types
            this.filteredSuspensionTypes.set([...options]);
          }
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load suspension types');
        }
      });
  }

  /**
   * Filter Suspension Types to only show those compatible with the given Equipment Type
   * This prevents Equipment Type mismatch error (Error 0468 in FMB)
   * @param equipmentType - The equipment type from COMPONENTS table (e.g., "AMIC")
   */
  private filterSuspensionTypesByEquipmentType(equipmentType: string): void {
    // Filter suspension types to only show those with matching equipment type
    // The suspension type dropdown stores values as "suspensionType|equipType"
    const compatibleSuspensionTypes = this.suspensionTypes().filter(option => {
      // Extract equipment type from the combined key
      const parts = option.value.split('|');
      const suspensionEquipType = parts.length > 1 ? parts[1] : '';

      // Only show suspension types that match the equipment type from COMPONENTS
      return suspensionEquipType === equipmentType;
    });

    // Update the filtered list
    this.filteredSuspensionTypes.set(compatibleSuspensionTypes);

    // If no compatible suspension types found, show message to user
    if (compatibleSuspensionTypes.length === 0) {
      this.snackbarService.showInfo(
        `No compatible suspension types found for Equipment Type: ${equipmentType}. ` +
        `This product may not have been properly configured for pathogen reduction.`
      );
    }
  }

  /**
   * Setup Product Code listener to auto-populate product details from COMPONENTS table
   * When Product Code is selected, populate:
   * - Product Weight
   * - Initial Product Volume
   * - Anticoagulant Volume
   * - Initial Platelet Count (PLT only)
   * - Equipment Type
   * Based on FMB populate_cnt_wt_vol and populate_equipType procedures
   */
  private setupProductCodeListener(): void {
    this.verifySuitabilityForm.get('productCode')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(productCode => {
        if (productCode && this.validatedUnitId) {
          const collectionDate = this.verifySuitabilityForm.get('date')?.value;

          if (collectionDate) {
            // Call API to get product details
            this.prService.getProductDetails(this.validatedUnitId, productCode, collectionDate)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (details) => {
                  // After getting product details, load Suspension Types
                  // This ensures Suspension Types are loaded only when needed and can be filtered by Equipment Type
                  this.loadSuspensionTypes(details);

                  if (details) {
                    // Auto-populate fields from COMPONENTS table
                    // Fields are made read-only if they have values (predefined from Pheresis)

                    // Product Weight
                    if (details.initialProdWeight !== null && details.initialProdWeight !== undefined) {
                      this.verifySuitabilityForm.get('productWeight')?.setValue(details.initialProdWeight, { emitEvent: false });
                      this.verifySuitabilityForm.get('productWeight')?.disable({ emitEvent: false });
                    }

                    // Initial Product Volume
                    if (details.initialProdVol !== null && details.initialProdVol !== undefined) {
                      this.verifySuitabilityForm.get('initialProductVolume')?.setValue(details.initialProdVol, { emitEvent: false });
                      this.verifySuitabilityForm.get('initialProductVolume')?.disable({ emitEvent: false });
                    }

                    // Anticoagulant Volume
                    if (details.anticoagulantVolume !== null && details.anticoagulantVolume !== undefined) {
                      this.verifySuitabilityForm.get('anticoagulantVolume')?.setValue(details.anticoagulantVolume, { emitEvent: false });
                      this.verifySuitabilityForm.get('anticoagulantVolume')?.disable({ emitEvent: false });
                    }

                    // Initial Platelet Count (only for PLT products)
                    const productCategory = this.verifySuitabilityForm.get('productCategory')?.value;
                    if (productCategory === 'PLT' && details.initPltCount !== null && details.initPltCount !== undefined) {
                      this.verifySuitabilityForm.get('initialPlateletCount')?.setValue(details.initPltCount, { emitEvent: false });
                      this.verifySuitabilityForm.get('initialPlateletCount')?.disable({ emitEvent: false });
                    }

                    // Equipment Type (read-only, already disabled in form init)
                    if (details.equipType) {
                      this.verifySuitabilityForm.get('equipmentType')?.setValue(details.equipType, { emitEvent: false });
                    }
                  } else {
                    // No product details found - enable fields for manual entry
                    this.verifySuitabilityForm.get('productWeight')?.enable({ emitEvent: false });
                    this.verifySuitabilityForm.get('initialProductVolume')?.enable({ emitEvent: false });
                    this.verifySuitabilityForm.get('anticoagulantVolume')?.enable({ emitEvent: false });
                    this.verifySuitabilityForm.get('initialPlateletCount')?.enable({ emitEvent: false });
                  }
                },
                error: (error) => {
                  // On error, load all suspension types and enable fields for manual entry
                  this.loadSuspensionTypes(null);
                  this.verifySuitabilityForm.get('productWeight')?.enable({ emitEvent: false });
                  this.verifySuitabilityForm.get('initialProductVolume')?.enable({ emitEvent: false });
                  this.verifySuitabilityForm.get('anticoagulantVolume')?.enable({ emitEvent: false });
                  this.verifySuitabilityForm.get('initialPlateletCount')?.enable({ emitEvent: false });
                }
              });
          }
        } else {
          // Product Code cleared - enable all fields and clear suspension types
          this.verifySuitabilityForm.get('productWeight')?.enable({ emitEvent: false });
          this.verifySuitabilityForm.get('initialProductVolume')?.enable({ emitEvent: false });
          this.verifySuitabilityForm.get('anticoagulantVolume')?.enable({ emitEvent: false });
          this.verifySuitabilityForm.get('initialPlateletCount')?.enable({ emitEvent: false });
          this.verifySuitabilityForm.get('equipmentType')?.setValue('', { emitEvent: false });

          // Clear suspension types when product code is cleared
          this.suspensionTypes.set([]);
          this.filteredSuspensionTypes.set([]);
        }
      });
  }

  private initForms(): void {
    // Get chapter local date and time to avoid timezone issues
    const chapterLocalDateTime = this.chapterTimezoneService.getChapterLocalDateTime();
    const treatmentDateInitialValue = this.chapterTimezoneService.getChapterLocalDate().toDate();
    // Format chapter local time as HH:MM
    const treatmentTimeInitialValue = chapterLocalDateTime.format('HH:mm');

    // Verify Suitability Form
    // Mandatory fields: Product Category, Suspension Type, Product Weight OR Volume (at least one), Process DateTime, Volume Type Set
    // Max lengths based on PATHOGEN_REDUCTION_DETAILS table schema
    this.verifySuitabilityForm = this.fb.group({
      date: [{ value: null, disabled: true }], // Collection Date - auto-populated from UNITS table, read-only
      productCategory: ['', [Validators.required, Validators.maxLength(10)]], // PROD_CATEGORY VARCHAR2(10) - MANDATORY
      productCode: ['', [Validators.maxLength(8)]], // PRODUCT_CODE VARCHAR2(8)
      suspensionType: ['', [Validators.required, Validators.maxLength(50)]], // SUSPENSION_TYPE combined key (suspensionType|equipType) - MANDATORY
      equipmentType: [{ value: '', disabled: true }, [Validators.maxLength(10)]], // EQUIP_TYPE VARCHAR2(10) - Auto-populated from suspension type, always disabled
      initialPlateletCount: ['', [Validators.min(0), Validators.max(9.9), Validators.pattern(/^\d?(\.\d)?$/)]], // 0 to 9.9 - single digit before decimal, single after
      productWeight: ['', [Validators.min(0), Validators.max(999.99), Validators.pattern(/^\d{0,3}(\.\d{0,2})?$/)]], // 0 to 999.99 - max 3 digits before decimal, 2 after
      initialProductVolume: ['', [Validators.min(0), Validators.max(999.99), Validators.pattern(/^\d{0,3}(\.\d{0,2})?$/)]], // 0 to 999.99 - max 3 digits before decimal, 2 after
      rbcContent: [''], // Dropdown: "Acceptable" or "Not Acceptable"
      anticoagulantVolume: ['', [Validators.pattern(/^\d{1,22}$/), Validators.maxLength(22)]], // NUMBER(22,0) - integers only
      bleedEndTime: [{ value: null, disabled: true }], // Bleed End Time - auto-populated from UNITS table, read-only
      processDate: [null, [Validators.required, this.notFutureDateValidator.bind(this)]], // Process Date - MANDATORY, cannot be future
      processTime: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]], // Process Time - MANDATORY, HH:mm format
      volumeTypeSet: ['', [Validators.required, Validators.maxLength(10)]], // Assuming VARCHAR2(10) from lookup - MANDATORY
      aggregates: [''], // AGGR_ACC VARCHAR2(1) - Dropdown (A/NA), no maxLength needed
      interimProductCode: ['', [Validators.maxLength(8)]], // SUIT_PROD_CODE VARCHAR2(8)
      rejectionReason: ['', [Validators.maxLength(200)]] // SUIT_STATUS_REASON VARCHAR2(200) - Only required if rejected
    });

    // Add custom form-level validators
    this.verifySuitabilityForm.setValidators([
      this.atLeastOneWeightOrVolumeValidator,
      this.notFutureDateTimeValidator.bind(this),
      this.processNotBeforeBleedEndValidator.bind(this)
    ]);

    // Intermediate Process Form
    // Max lengths based on PATHOGEN_REDUCTION_DETAILS table schema
    this.intermediateProcessForm = this.fb.group({
      date: [{ value: null, disabled: true }], // Date - auto-populated, read-only (disabled like tab 1)
      process: [{ value: 'SUSTAINABILITY', disabled: true }], // Process name - readonly/disabled
      interimProductCode: ['', [Validators.maxLength(8)]], // SUIT_PROD_CODE VARCHAR2(8)
      equipmentType: ['', [Validators.maxLength(10)]], // EQUIP_TYPE VARCHAR2(10)
      illuminator: [{ value: '', disabled: true }, [Validators.maxLength(9)]], // ILLUMINATOR_REFERENCE VARCHAR2(9) - Auto-populated from equipment type, always disabled
      serialNumber: ['', [Validators.maxLength(30)]], // Assuming from equipment table
      volumeTypeSet: [{ value: '', disabled: true }, [Validators.maxLength(10)]], // Assuming VARCHAR2(10) - Auto-populated, disabled
      setIdLotNumber: [{ value: '', disabled: true }, [Validators.maxLength(10)]], // SET_ID_LOT_NO VARCHAR2(10) - Auto-populated, disabled
      operatorId: ['', [Validators.maxLength(30)]], // OPERATOR_ID VARCHAR2(30)
      treatmentDate: [treatmentDateInitialValue, [this.notFutureDateValidator.bind(this)]], // TREATMENT_DATE - Auto-populated with chapter local date, can be updated
      treatmentStartTime: [treatmentTimeInitialValue, [Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]], // Treatment Start Time - HH:mm format, initialized with chapter local time
      treatmentElapsedTime: ['', [Validators.maxLength(5)]], // Treatment elapsed/duration time (e.g., 00:05)
      status: [null], // ILLUMINATION_STATUS - 0 = Incomplete, 1 = Complete (enabled for user input)
      instrumentMessage: ['', [Validators.maxLength(200)]], // ILLUMINATOR_MESSAGE VARCHAR2(240)
      cadProd: ['', [Validators.maxLength(8)]], // CAD_PROD_CODE VARCHAR2(8)
      cadStartDate: [treatmentDateInitialValue, [this.notFutureDateValidator.bind(this)]], // CAD Start Date - initialized with chapter local date, cannot be future
      cadStartTime: ['', [Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]] // CAD Start Time - HH:mm format
    }, {
      validators: [
        this.notFutureTreatmentDateTimeValidator.bind(this),
        this.notFutureCadStartDateTimeValidator.bind(this),
        this.treatmentNotAfterProcessValidator.bind(this)
      ]
    });

    // Final Transfer Form
    // Max lengths based on PATHOGEN_REDUCTION_DETAILS table schema
    this.finalTransferForm = this.fb.group({
      date: [null],
      interimProductCode: ['', [Validators.maxLength(8)]], // SUIT_PROD_CODE VARCHAR2(8)
      cadProd: ['', [Validators.maxLength(8)]], // CAD_PROD_CODE VARCHAR2(8)
      cadStartTime: [''], // CAD_START_TIME DATE
      cadStartTime2: [''], // Additional field for UI
      cadEndTime: [''], // CAD_END_TIME DATE
      cadEndTime2: ['', [Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]], // CAD End Time - HH:mm format
      cadElapsedTime: ['', [Validators.maxLength(10)]], // CAD_TOTAL_TIME VARCHAR2(10)
      cadStatusValue: [''], // CAD_STATUS - EARLY, LATE, or READY (for logic/color coding)
      cadStatus: [''], // CAD_STATUS_MESSAGE - Display message
      numberOfBags: ['', [Validators.pattern(/^\d{0,22}$/)]], // FINAL_PRD_NUM_OF_BAGS NUMBER(22,0)
      volumeTypeSet: ['', [Validators.maxLength(10)]], // Assuming VARCHAR2(10)
      setIdLotNumber: ['', [Validators.maxLength(10)]], // SET_ID_LOT_NO VARCHAR2(10)
      finalProducts: this.fb.array([]) // FormArray for editable final products table
    });

    // Upload Manually Form
    this.uploadManuallyForm = this.fb.group({
      chapterId: ['', Validators.required],
      name: [{ value: '', disabled: true }],
      date: [this.chapterTimezoneService.getChapterLocalDate().toDate()]
    });

    // Listen for chapter selection to auto-populate name and update date
    this.uploadManuallyForm.get('chapterId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(chapterId => {
        if (chapterId) {
          const selectedChapter = this.chapters().find(c => c.value === chapterId);
          if (selectedChapter) {
            const name = selectedChapter.label.split(' - ')[1] || selectedChapter.label;
            this.uploadManuallyForm.get('name')?.setValue(name);
            // Update date to current chapter local date (FMB: s_date := get_local_time)
            this.uploadManuallyForm.get('date')?.setValue(this.chapterTimezoneService.getChapterLocalDate().toDate());
          }
        } else {
          this.uploadManuallyForm.get('name')?.setValue('');
        }
      });
  }

  private loadLookups(): void {
    this.loading.set(true);

    // Load Product Categories
    this.prService.getProductCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.productCategory,
            label: item.categoryDescription?.trim()
              ? `${item.productCategory} - ${item.categoryDescription.trim()}`
              : item.productCategory
          }));
          this.productCategories.set(options);
          this.filteredProductCategories.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load product categories');
        }
      });

    // NOTE: Product Codes are NOT loaded on init - they are loaded when:
    // 1. Unit ID is validated (provides unitId and collectionDate)
    // 2. Product Category is selected
    // See onProductCategoryChange() and onUnitIdValidated() methods

    // NOTE: Suspension Types are NOT loaded on init - they are loaded AFTER Product Details API returns
    // This allows filtering by Equipment Type from COMPONENTS table
    // See setupProductCodeListener() method

    // Load Volume Type Sets
    this.prService.getVolumeTypeSets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.volumeTypeSet,
            label: item.description?.trim()
              ? `${item.volumeTypeSet} - ${item.description.trim()}`
              : item.volumeTypeSet
          }));
          this.volumeTypeSets.set(options);
          this.filteredVolumeTypeSets.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load volume type sets');
        }
      });

    // Load Illuminator Equipment Types
    this.prService.getIlluminatorEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.code,
            label: item.codeDesc?.trim()
              ? `${item.code} - ${item.codeDesc.trim()}`
              : item.code
          }));
          this.illuminatorEquipmentTypes.set(options);
          this.filteredIlluminatorEquipmentTypes.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load illuminator equipment types');
        }
      });

    // Load Sterile Docking Machines
    this.prService.getSterileDockingMachines()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.code,
            label: item.codeDesc?.trim()
              ? `${item.code} - ${item.codeDesc.trim()}`
              : item.code
          }));
          this.sterileDockingMachines.set(options);
          this.filteredSterileDockingMachines.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load sterile docking machines');
        }
      });

    // Load Wafer Lot Numbers
    this.prService.getWaferLotNumbers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.lotNumber,
            label: item.expirationDate
              ? `${item.lotNumber} (Exp: ${item.expirationDate})`
              : item.lotNumber
          }));
          this.waferLotNumbers.set(options);
          this.filteredWaferLotNumbers.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load wafer lot numbers');
        }
      });

    // Load Chapters for Upload Manually dropdown
    this.prService.getChapters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.chapterId,
            label: `${item.chapterId} - ${item.chapterName}`
          }));
          this.chapters.set(options);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load chapters');
        }
      });

    // Load Interim Product Codes
    this.prService.getInterimProductCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.productCode,
            label: item.description?.trim()
              ? `${item.productCode} - ${item.description.trim()}`
              : item.productCode
          }));
          this.interimProductCodes.set(options);
          this.filteredInterimProductCodes.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load interim product codes');
        }
      });

    this.loading.set(false);
  }

  /**
   * Load remove bag enabled status from API
   * When API returns TRUE: buttons are ENABLED
   * When API returns FALSE: buttons are DISABLED
   * Controls enable/disable state for:
   * - Tab 1: Remove Psoralen button
   * - Tab 2: Remove Illumination Bag button
   * - Tab 3: Remove CAD Bag button
   */
  private loadRemoveBagEnabled(): void {
    this.prService.getRemoveBagEnabled()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isEnabled) => {
          this.isRemoveBagEnabled.set(isEnabled);
        },
        error: (error) => {
          // On error, default to disabled for safety (false = disabled)
          this.isRemoveBagEnabled.set(false);
          this.snackbarService.showError('Failed to load remove bag status');
        }
      });
  }

  private setupSearchFilters(): void {
    // Product Category search filter
    this.productCategorySearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredProductCategories.set(
          this.productCategories().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });

    // Product Code search filter
    this.productCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredProductCodes.set(
          this.productCodes().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });

    // Suspension Type search filter
    this.suspensionTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredSuspensionTypes.set(
          this.suspensionTypes().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });

    // Volume Type Set search filter
    this.volumeTypeSetSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredVolumeTypeSets.set(
          this.volumeTypeSets().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });

    // Interim Product Code search filter
    this.interimProductCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredInterimProductCodes.set(
          this.interimProductCodes().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });

    // Equipment Serial Number search filter
    this.equipmentSerialNumberSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredEquipmentSerialNumbers.set(
          this.equipmentSerialNumbers().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });

    // Illuminator Equipment Type search filter
    this.illuminatorEquipmentTypeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredIlluminatorEquipmentTypes.set(
          this.illuminatorEquipmentTypes().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });

    // Sterile Docking Machine search filter
    this.sterileDockingMachineSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredSterileDockingMachines.set(
          this.sterileDockingMachines().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });

    // Wafer Lot Number search filter
    this.waferLotNumberSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredWaferLotNumbers.set(
          this.waferLotNumbers().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });

    // Set Lot Number search filter
    this.setLotNumberSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredSetLotNumbers.set(
          this.setLotNumbers().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });

    // CAD Product Code search filter
    this.cadProductCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredCadProductCodes.set(
          this.cadProductCodes().filter(option =>
            option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
          )
        );
      });
  }

  /**
   * Load equipment serial numbers based on selected equipment type
   * @param equipType Equipment type code (e.g., 'AMIC')
   */
  loadEquipmentSerialNumbers(equipType: string): void {
    if (!equipType) {
      this.equipmentSerialNumbers.set([]);
      this.filteredEquipmentSerialNumbers.set([]);
      return;
    }

    this.prService.getEquipmentSerialNumbers(equipType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.serialNumber,
            label: item.serialNumber
          }));
          this.equipmentSerialNumbers.set(options);
          this.filteredEquipmentSerialNumbers.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load equipment serial numbers');
        }
      });
  }

  /**
   * Load set lot numbers based on selected volume type set
   * @param volumeTypeSet Volume type set code (e.g., 'LV', 'HV')
   */
  loadSetLotNumbers(volumeTypeSet: string): void {
    if (!volumeTypeSet) {
      this.setLotNumbers.set([]);
      this.filteredSetLotNumbers.set([]);
      return;
    }

    this.prService.getSetLotNumbers(volumeTypeSet)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.lotNumber,
            label: item.expirationDate
              ? `${item.lotNumber} (Exp: ${item.expirationDate})`
              : item.lotNumber
          }));
          this.setLotNumbers.set(options);
          this.filteredSetLotNumbers.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load set lot numbers');
        }
      });
  }

  /**
   * Load product codes (initial products) based on selected product category
   * Database Filter: pathogen_reduction_flag != 'Y'
   * @param productCategory Product category code (e.g., 'PLT', 'PLAS')
   */
  /**
   * Load product codes for a specific unit
   * Requires: unitId (from validation), collectionDate (from UNITS table), productCategory (from dropdown)
   * @param unitId Required unit ID
   * @param collectionDate Required collection date
   * @param productCategory Optional product category filter
   */
  loadProductCodes(unitId: string, collectionDate: Date, productCategory?: string): void {
    this.prService.getProductCodes(unitId, collectionDate, productCategory)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.productCode,
            label: item.description?.trim()
              ? `${item.productCode} - ${item.description.trim()}`
              : item.productCode
          }));
          this.productCodes.set(options);
          this.filteredProductCodes.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load product codes');
        }
      });
  }

  /**
   * Load CAD product codes based on product category, suitability product code, and CAD product code
   * FMB Logic: If PLAS category -> use suitProdCode, otherwise -> use cadProdCode
   * @param suitProdCode Suitability product code
   * @param cadProdCode CAD product code (optional, from intermediate process)
   * @param productCategoryOverride Product category (optional, from API response)
   */
  loadCadProductCodes(suitProdCode: string, cadProdCode?: string, productCategoryOverride?: string): void {
    if (!suitProdCode) {
      this.cadProductCodes.set([]);
      this.filteredCadProductCodes.set([]);
      return;
    }

    // Get product category from parameter, or Tab 1, or from stored details
    const productCategory = productCategoryOverride
      || this.verifySuitabilityForm.get('productCategory')?.value
      || '';

    if (!productCategory) {
      this.snackbarService.showError('Product Category is required to load product codes');
      return;
    }

    // For Intermediate Process tab: only pass productCategory and suitProdCode
    // cadProdCode parameter is optional and only used for Final Products tab
    this.prService.getCadProductCodes(productCategory, suitProdCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.productCode,
            label: item.description?.trim()
              ? `${item.productCode} - ${item.description.trim()}`
              : item.productCode
          }));
          this.cadProductCodes.set(options);
          this.filteredCadProductCodes.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load CAD product codes');
        }
      });
  }

  /**
   * Load interim product codes (suitability products) based on selected product category
   * Database Filter: pathogen_reduction_flag = 'Y'
   * @param productCategory Product category code (e.g., 'PLT', 'PLAS')
   */
  loadInterimProductCodes(productCategory?: string): void {
    this.prService.getInterimProductCodes(productCategory)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const options = data.map(item => ({
            value: item.productCode,
            label: item.description?.trim()
              ? `${item.productCode} - ${item.description.trim()}`
              : item.productCode
          }));
          this.interimProductCodes.set(options);
          this.filteredInterimProductCodes.set([...options]);
        },
        error: (error) => {
          this.snackbarService.showError('Failed to load interim product codes');
        }
      });
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;

    // Tab 1: Intermediate Process - update Treatment Date to chapter local date if not already set
    if (event.index === 1) {
      const treatmentDateControl = this.intermediateProcessForm.get('treatmentDate');
      const treatmentTimeControl = this.intermediateProcessForm.get('treatmentStartTime');

      // Only update if form is pristine (hasn't been modified by user)
      if (treatmentDateControl && treatmentDateControl.pristine) {
        treatmentDateControl.setValue(this.chapterTimezoneService.getChapterLocalDate().toDate());
      }

      // Update time to current chapter time if pristine
      if (treatmentTimeControl && treatmentTimeControl.pristine) {
        treatmentTimeControl.setValue(this.chapterTimezoneService.getChapterLocalDateTime().format('HH:mm'));
      }

      // Update CAD Start Date to chapter local date if pristine
      const cadStartDateControl = this.intermediateProcessForm.get('cadStartDate');
      if (cadStartDateControl && cadStartDateControl.pristine) {
        cadStartDateControl.setValue(this.chapterTimezoneService.getChapterLocalDate().toDate());
      }
    }

    // Tab 3: Upload Manually - update date to current chapter local date
    // FMB: :pi_upload_ctrl.s_date := lifetrack_timezone_convert.get_local_time(:pi_upload_ctrl.chapter_id, SYSDATE)
    if (event.index === 3) {
      this.uploadManuallyForm.get('date')?.setValue(this.chapterTimezoneService.getChapterLocalDate().toDate());
    }
  }

  /**
   * Lazy load CAD product codes when user opens the Product Code dropdown
   * Matches FMB behavior: LOV is loaded when user clicks the field
   */
  onProductCodeDropdownOpen(isOpen: boolean): void {
    // Only load when dropdown is opened and data not already loaded
    if (isOpen && this.cadProductCodes().length === 0) {
      const suitProdCode = this.verifySuitabilityForm.get('interimProductCode')?.value;
      const cadProdCode = this.intermediateProcessForm.get('cadProd')?.value;

      if (suitProdCode) {
        this.loadCadProductCodes(suitProdCode, cadProdCode);
      }
    }
  }

  /**
   * Auto-calculate full 8-character Interim Product Code when user selects from dropdown
   * Called when user selects 5-character base code from dropdown
   * Example: "A8331" -> "A8331V00"
   */
  onInterimProductCodeBlur(): void {
    const baseCode = this.verifySuitabilityForm.get('interimProductCode')?.value;

    // Remove previously auto-calculated code from dropdown if user selected a different base code
    if (this.autoCalculatedInterimCode && baseCode !== this.autoCalculatedInterimCode) {
      // Remove from both main list and filtered list
      const updatedOptions = this.interimProductCodes().filter(
        opt => opt.value !== this.autoCalculatedInterimCode
      );
      this.interimProductCodes.set(updatedOptions);
      this.filteredInterimProductCodes.set(updatedOptions);

      // Clear the tracked code
      this.autoCalculatedInterimCode = null;
    }

    // Only call API if code exists and is 5 characters (base code)
    // Some products might already be 8 characters, so check length first
    if (baseCode && this.validatedUnitId) {
      // Skip if already 8 characters (full code)
      if (baseCode.length === 8) {
        return;
      }

      // Only process 5-character base codes
      if (baseCode.length !== 5) {
        return;
      }

      // Call API to calculate full product code
      this.prService.calculateIntendedUse({
        unitId: this.validatedUnitId,
        baseProductCode: baseCode
      }).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            // Add the full product code to the dropdown options if it doesn't exist
            const fullCode = response.fullProductCode;
            const existingOption = this.interimProductCodes().find(opt => opt.value === fullCode);

            if (!existingOption) {
              // Add new option with full code
              const newOption = {
                value: fullCode,
                label: response.description
                  ? `${fullCode} - ${response.description}`
                  : fullCode
              };

              // Add to both the main list and filtered list
              const updatedOptions = [...this.interimProductCodes(), newOption];
              this.interimProductCodes.set(updatedOptions);
              this.filteredInterimProductCodes.set(updatedOptions);
            }

            // Track this code so we can remove it if user selects a different base code
            this.autoCalculatedInterimCode = fullCode;

            // Update field with full 8-character code
            this.verifySuitabilityForm.patchValue({
              interimProductCode: fullCode
            }, { emitEvent: false });
          },
          error: (error) => {
            const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to calculate intended use');
            this.snackbarService.showError(errorMessage);
          }
        });
    }
  }

  onUnitIdValidated(response: UnitValidationResponse): void {

    this.validatedUnitId = response.parsedUnitId;
    this.manualUnitIdWithCheckDigit = response.manualUnitId; // Store manual unit ID with check digit

    // Clear suitability status when new unit is entered
    this.suitabilityStatus.set(null);
    this.showRejectionReason.set(false);

    // Clear button enable flags
    this.isSuitabilityPassed.set(false);
    this.isSterileDockingCompleted.set(false);
    this.hasInterimProductCode.set(false);

    // Remove auto-calculated interim code from dropdown when new unit is validated
    if (this.autoCalculatedInterimCode) {
      const updatedOptions = this.interimProductCodes().filter(
        opt => opt.value !== this.autoCalculatedInterimCode
      );
      this.interimProductCodes.set(updatedOptions);
      this.filteredInterimProductCodes.set(updatedOptions);
      this.autoCalculatedInterimCode = null;
    }

    // Reset form to clear all previous values (except unit ID which is already set)
    // Only keep date and bleedEndTime disabled fields, clear all user-entered fields
    this.verifySuitabilityForm.patchValue({
      productCategory: '',
      productCode: '',
      suspensionType: '',
      equipmentType: '',
      initialPlateletCount: '',
      productWeight: '',
      initialProductVolume: '',
      rbcContent: '',
      anticoagulantVolume: '',
      processDate: null,
      processTime: '',
      volumeTypeSet: '',
      aggregates: '',
      interimProductCode: '',
      rejectionReason: ''
    });

    // Clear product codes and suspension types dropdowns
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.suspensionTypes.set([]);
    this.filteredSuspensionTypes.set([]);

    // Re-enable fields that might have been disabled from previous unit
    this.verifySuitabilityForm.get('productWeight')?.enable();
    this.verifySuitabilityForm.get('initialProductVolume')?.enable();
    this.verifySuitabilityForm.get('anticoagulantVolume')?.enable();
    this.verifySuitabilityForm.get('initialPlateletCount')?.enable();

    // Call API to get unit details from UNITS table
    this.loading.set(true);
    this.prService.getUnitDetails(response.parsedUnitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (unitDetails) => {
          this.loading.set(false);

          // Populate Collection Date (COLL_DATE) from UNITS table
          if (unitDetails.collDate) {
            const collectionDate = new Date(unitDetails.collDate);
            this.verifySuitabilityForm.get('date')?.setValue(collectionDate);
          }

          // Populate Bleed End Time (BLEED_END_TIME) from UNITS table - includes date and time
          // Format as DD-MMM-YYYY HH:mm for display
          if (unitDetails.bleedEndTime) {
            // Store bleedEndTime for validation
            this.bleedEndTime = moment(unitDetails.bleedEndTime);

            const formattedBleedEndTime = this.formatDisplayDateTime(unitDetails.bleedEndTime);
            this.verifySuitabilityForm.get('bleedEndTime')?.setValue(formattedBleedEndTime);

            // Trigger validation after setting bleedEndTime
            this.verifySuitabilityForm.updateValueAndValidity({ emitEvent: false });
          }

          // Load product codes if product category is already selected
          const productCategory = this.verifySuitabilityForm.get('productCategory')?.value;
          if (productCategory && unitDetails.collDate) {
            const collectionDate = new Date(unitDetails.collDate);
            this.loadProductCodes(response.parsedUnitId, collectionDate, productCategory);
          }

          // Check for existing pathogen reduction data (update mode)
          this.loadExistingPathogenReductionState(response.parsedUnitId);

        },
        error: (error) => {
          this.loading.set(false);
          this.snackbarService.showError('Failed to load unit details');
        }
      });
  }

  onUnitIdCleared(): void {
    this.validatedUnitId = null;
    this.manualUnitIdWithCheckDigit = null;
    this.suitabilityStatus.set(null);
    this.showRejectionReason.set(false);

    // Clear button enable flags
    this.isSuitabilityPassed.set(false);
    this.isSterileDockingCompleted.set(false);
    this.hasInterimProductCode.set(false);

    // Clear bleed end time for validation
    this.bleedEndTime = null;

    // Clear auto-populated fields from UNITS table
    this.verifySuitabilityForm.get('date')?.setValue(null);
    this.verifySuitabilityForm.get('bleedEndTime')?.setValue(null);

    // Clear product codes dropdown since it depends on unit ID
    this.productCodes.set([]);
    this.filteredProductCodes.set([]);
    this.verifySuitabilityForm.get('productCode')?.setValue(null);

    // Remove auto-calculated interim code from dropdown
    if (this.autoCalculatedInterimCode) {
      const updatedOptions = this.interimProductCodes().filter(
        opt => opt.value !== this.autoCalculatedInterimCode
      );
      this.interimProductCodes.set(updatedOptions);
      this.filteredInterimProductCodes.set(updatedOptions);
      this.autoCalculatedInterimCode = null;
    }
  }

  onIntermediateUnitIdValidated(response: UnitValidationResponse): void {
    if (response.parsedUnitId) {
      const unitId = response.parsedUnitId;
      this.validatedUnitId = unitId; // Enable Save button
      this.manualUnitIdWithCheckDigit = response.manualUnitId; // Store manual unit ID with check digit

      // Reset form to clear all previous values from old unit
      this.intermediateProcessForm.patchValue({
        interimProductCode: '',
        equipmentType: '',
        illuminator: '',
        serialNumber: '',
        operatorId: '',
        treatmentDate: this.chapterTimezoneService.getChapterLocalDate().toDate(), // Reset to chapter local date
        treatmentStartTime: this.chapterTimezoneService.getChapterLocalDateTime().format('HH:mm'), // Reset to current chapter time
        treatmentElapsedTime: '',
        instrumentMessage: '',
        cadProd: '',
        cadStartDate: this.chapterTimezoneService.getChapterLocalDate().toDate(), // Reset to chapter local date
        cadStartTime: ''
      });

      // Clear CAD product codes dropdown
      this.cadProductCodes.set([]);
      this.filteredCadProductCodes.set([]);

      this.loading.set(true);

      // First, call API to get unit details from UNITS table for collection date
      this.prService.getUnitDetails(unitId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (unitDetails) => {
            // Populate Collection Date (COLL_DATE) from UNITS table
            if (unitDetails.collDate) {
              const collectionDate = new Date(unitDetails.collDate);
              this.intermediateProcessForm.get('date')?.setValue(collectionDate);
            }

            // Second, call pathogen reduction API to get volume type set, status, and set ID
            this.prService.getPathogenReductionDetails(unitId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (details) => {
                  this.loading.set(false);

                  // Store Process Date/Time for validation
                  if (details.processDateTime) {
                    this.processDateTime = moment(details.processDateTime);
                    // Trigger validation after setting processDateTime
                    this.intermediateProcessForm.updateValueAndValidity({ emitEvent: false });
                  }

                  // Populate Volume Type Set (VOL_TYPE_SET)
                  if (details.volTypeSet) {
                    this.intermediateProcessForm.get('volumeTypeSet')?.setValue(details.volTypeSet);
                  }

                  // Populate Illumination Status (0 or 1)
                  if (details.illuminationStatus !== null && details.illuminationStatus !== undefined) {
                    // Convert to number to ensure proper binding (backend might send as string "0" or "1")
                    const statusValue = typeof details.illuminationStatus === 'string'
                      ? parseInt(details.illuminationStatus, 10)
                      : details.illuminationStatus;
                    this.intermediateProcessForm.get('status')?.setValue(statusValue);
                  }

                  // Populate Illuminator Message
                  if (details.illuminatorMessage) {
                    this.intermediateProcessForm.get('instrumentMessage')?.setValue(details.illuminatorMessage);
                  }

                  // Populate Serial Number (Illuminator Reference)
                  if (details.illuminatorReference) {
                    this.intermediateProcessForm.get('serialNumber')?.setValue(details.illuminatorReference);
                  }

                  // Populate Operator ID
                  if (details.operatorId) {
                    this.intermediateProcessForm.get('operatorId')?.setValue(details.operatorId);
                  }

                  // Populate Treatment Date
                  if (details.treatmentDate) {
                    this.intermediateProcessForm.get('treatmentDate')?.setValue(new Date(details.treatmentDate));
                  }

                  // Populate Treatment Start Time
                  if (details.treatmentStartTime) {
                    this.intermediateProcessForm.get('treatmentStartTime')?.setValue(new Date(details.treatmentStartTime));
                  }

                  // Populate Treatment Elapsed Time
                  if (details.treatmentTime) {
                    this.intermediateProcessForm.get('treatmentElapsedTime')?.setValue(details.treatmentTime);
                  }

                  // Populate Set ID Lot Number
                  if (details.setIdLotNo) {
                    this.intermediateProcessForm.get('setIdLotNumber')?.setValue(details.setIdLotNo);
                  }

                  // Populate CAD Product Code first
                  if (details.cadProdCode) {
                    this.intermediateProcessForm.get('cadProd')?.setValue(details.cadProdCode);
                  }

                  // Populate Interim Product Code and load CAD product codes
                  if (details.suitProdCode) {
                    this.intermediateProcessForm.get('interimProductCode')?.setValue(details.suitProdCode);
                    // Load CAD product codes using productCategory from API response
                    this.loadCadProductCodes(
                      details.suitProdCode,
                      details.cadProdCode ?? undefined,
                      details.productCategory ?? undefined
                    );
                  }

                  // Populate Treatment Date (from finalTransferDate)
                  if (details.finalTransferDate) {
                    const treatmentDate = new Date(details.finalTransferDate);
                    this.intermediateProcessForm.get('treatmentDate')?.setValue(treatmentDate);
                  }

                  // Populate Treatment Start Time (from treatmentStartTime - extract time only)
                  if (details.treatmentStartTime) {
                    const treatmentStartMoment = moment(details.treatmentStartTime);
                    const timeOnly = treatmentStartMoment.format('HH:mm');
                    this.intermediateProcessForm.get('treatmentStartTime')?.setValue(timeOnly);
                  }

                  // Populate Treatment Time (elapsed time)
                  if (details.treatmentTime) {
                    this.intermediateProcessForm.get('treatmentElapsedTime')?.setValue(details.treatmentTime);
                  }

                  // Populate Instrument Message
                  if (details.illuminatorMessage) {
                    this.intermediateProcessForm.get('instrumentMessage')?.setValue(details.illuminatorMessage);
                  }

                  // Populate CAD Product Code
                  if (details.cadProdCode) {
                    this.intermediateProcessForm.get('cadProd')?.setValue(details.cadProdCode);
                  }

                  // Populate CAD Start Time (extract date and time separately)
                  if (details.cadStartTime) {
                    const cadStartMoment = moment(details.cadStartTime);
                    const cadDate = cadStartMoment.toDate();
                    const cadTime = cadStartMoment.format('HH:mm');
                    this.intermediateProcessForm.get('cadStartDate')?.setValue(cadDate);
                    this.intermediateProcessForm.get('cadStartTime')?.setValue(cadTime);
                  }

                  this.snackbarService.showSuccess('Unit details loaded successfully');
                },
                error: (error) => {
                  this.loading.set(false);
                  this.snackbarService.showError(
                    error?.error?.message || 'Failed to load pathogen reduction details. Please try again.'
                  );
                }
              });
          },
          error: (error) => {
            this.loading.set(false);
            this.snackbarService.showError('Failed to load unit details');
          }
        });
    }
  }

  onIntermediateUnitIdCleared(): void {
    // Clear the validated unit ID to disable Save button
    this.validatedUnitId = null;

    // Clear process date/time for validation
    this.processDateTime = null;

    // Reset the entire form
    this.intermediateProcessForm.patchValue({
      date: null,
      interimProductCode: '',
      equipmentType: '',
      illuminator: '',
      serialNumber: '',
      volumeTypeSet: '',
      setIdLotNumber: '',
      operatorId: '',
      treatmentDate: this.chapterTimezoneService.getChapterLocalDate().toDate(),
      treatmentStartTime: this.chapterTimezoneService.getChapterLocalDateTime().format('HH:mm'),
      treatmentElapsedTime: '',
      status: '',
      instrumentMessage: '',
      cadProd: '',
      cadStartDate: this.chapterTimezoneService.getChapterLocalDate().toDate(),
      cadStartTime: ''
    });

    // Clear CAD product codes dropdown
    this.cadProductCodes.set([]);
    this.filteredCadProductCodes.set([]);
  }

  onCheckSuitability(): void {
    if (!this.validatedUnitId) {
      this.snackbarService.showError('Please enter a valid Unit ID');
      return;
    }

    const productCategory = this.verifySuitabilityForm.get('productCategory')?.value;
    if (!productCategory) {
      this.snackbarService.showError('Please select a Product Category');
      return;
    }

    const productCode = this.verifySuitabilityForm.get('productCode')?.value;
    const processDate = this.verifySuitabilityForm.get('processDate')?.value;
    const processTime = this.verifySuitabilityForm.get('processTime')?.value;

    // Validate process date and time are entered
    if (!processDate) {
      this.snackbarService.showError('Please enter Process Date');
      return;
    }

    if (!processTime) {
      this.snackbarService.showError('Please enter Process Time');
      return;
    }

    // Helper function to combine date and time into Date object (local time, no UTC conversion)
    const combineDateTime = (date: any, time: string | null): Date | null => {
      if (!date || !time) return null;
      try {
        const datePart = moment(date).format('YYYY-MM-DD');
        const combinedDateTime = moment(`${datePart} ${time}`, 'YYYY-MM-DD HH:mm');
        return combinedDateTime.isValid() ? combinedDateTime.toDate() : null;
      } catch (error) {
        return null;
      }
    };

    const processDateTime = combineDateTime(processDate, processTime);
    if (!processDateTime) {
      this.snackbarService.showError('Invalid Process Date/Time');
      return;
    }

    this.loading.set(true);

    // Get RBC Content and Aggregates values from form
    // These are form field values that FMB reads before saving to database
    const rbcContent = this.verifySuitabilityForm.get('rbcContent')?.value;
    const aggregates = this.verifySuitabilityForm.get('aggregates')?.value;

    // Helper function to convert aggregates dropdown to single character "A"/"N"/"Y"
    // Map UI values to database values: "Acceptable" -> "Y", "Not Acceptable" -> "N"
    const convertToDbValue = (value: string | null): string | null => {
      if (!value) return null;
      if (value === 'Acceptable' || value === 'PASS' || value === 'A') return 'Y';
      if (value === 'Not Acceptable' || value === 'FAIL' || value === 'N') return 'N';
      return value;
    };

    const payload: CheckSuitabilityRequestDto = {
      unitId: this.validatedUnitId,
      productCode: productCode || '',
      processDateTime: processDateTime,
      rbcContentStatus: convertToDbValue(rbcContent),
      aggrAcc: convertToDbValue(aggregates)
    };

    this.prService.checkSuitability(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          // Response is an array - get the first item
          const result = Array.isArray(response) ? response[0] : response;

          const rejectionReasonControl = this.verifySuitabilityForm.get('rejectionReason');

          // Set suitability status - badge will show automatically
          // FMB: statusFlag = 'Y' means suitable, 'N' means not suitable
          if (result.statusFlag === 'Y') {
            this.suitabilityStatus.set('Suitable');
            // Show "Suitable" message in textarea (disabled)
            rejectionReasonControl?.setValue('Product is suitable for Pathogen Inactivation Process.');
            rejectionReasonControl?.disable();

            // Enable suitability passed flag - save will happen when user clicks Save button
            this.isSuitabilityPassed.set(true);
          } else {
            this.suitabilityStatus.set('Not Suitable');
            // Disable INITIAL STERILE DOCKING button when suitability fails
            this.isSuitabilityPassed.set(false);
            // Show error messages in textarea (disabled)
            // FMB returns status with newlines already, or default message
            const statusText = result.status || 'Product is not suitable for Pathogen Inactivation Process.';
            rejectionReasonControl?.setValue(statusText);
            rejectionReasonControl?.disable();
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.suitabilityStatus.set('Not Suitable');
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to check suitability');
          this.snackbarService.showError(errorMessage);

          // Show error message in textarea (disabled)
          const rejectionReasonControl = this.verifySuitabilityForm.get('rejectionReason');
          rejectionReasonControl?.setValue(errorMessage);
          rejectionReasonControl?.disable();
        }
      });
  }

  onInitialSterileDocking(): void {
    const volumeTypeSet = this.verifySuitabilityForm.get('volumeTypeSet')?.value || '';

    const dialogRef = this.dialog.open(InitialSterileDockingPanelComponent, {
      width: '700px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'initial-sterile-docking-drawer',
      disableClose: true,
      hasBackdrop: true,
      backdropClass: 'side-panel-backdrop',
      data: {
        unitId: this.validatedUnitId, // Pass validated unit ID (parsed format) - available after unit validation
        manualUnitId: this.manualUnitIdWithCheckDigit, // Pass manual unit ID with check digit for display
        volumeTypeSet: volumeTypeSet // Pass volume type set to panel for Set Lot# filtering
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Sterile docking was saved successfully
        // Directly enable the REMOVE PSORALEN button
        this.isSterileDockingCompleted.set(true);
      }
    });
  }

  /**
   * Check if PHERESIS or REJECT buttons can be enabled
   * Requires: Unit ID validated, Product Category selected, and suitability checked
   */
  canAcceptOrReject(): boolean {
    return !!(this.validatedUnitId &&
              this.verifySuitabilityForm.get('productCategory')?.value &&
              this.suitabilityStatus());
  }

  /**
   * Check if SAVE button can be enabled
   * Requires: Unit ID validated and not loading
   */
  canSave(): boolean {
    // Check which tab is active and validate the appropriate form
    if (this.selectedTabIndex === 0) {
      // Tab 1: Verify Suitability
      return !!(this.validatedUnitId && !this.loading() && this.verifySuitabilityForm.valid);
    } else if (this.selectedTabIndex === 1) {
      // Tab 2: Intermediate Process
      return !!(this.validatedUnitId && !this.loading() && this.intermediateProcessForm.valid);
    } else if (this.selectedTabIndex === 2) {
      // Tab 3: Final Transfer
      return !!(this.validatedUnitId && !this.loading() && this.finalTransferForm.valid);
    }
    return !!(this.validatedUnitId && !this.loading());
  }

  /**
   * PHERESIS Button - Navigate directly to Enter Pheresis Components
   * No API call, no validation
   */
  onAcceptPheresis(): void {
    // Capture current form state for restoration on back navigation via query params
    const currentFormState = {
      unitId: this.validatedUnitId || '',
      productCategory: this.verifySuitabilityForm.get('productCategory')?.value || '',
      productCode: this.verifySuitabilityForm.get('productCode')?.value || '',
      volumeTypeSet: this.verifySuitabilityForm.get('volumeTypeSet')?.value || '',
      tabIndex: this.selectedTabIndex.toString()
    };

    // Construct return URL with query params
    const returnPath = '/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-manager';
    const params = new URLSearchParams();
    Object.entries(currentFormState).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const returnUrl = params.toString() ? `${returnPath}?${params.toString()}` : returnPath;

    // Navigate with returnUrl in query params
    this.router.navigate(['/laboratory-functions/component-production/pheresis-processing/enter-pheresis-components-isbt'], {
      queryParams: { returnUrl },
      state: { fromPathogenReduction: true }
    });
  }

  /**
   * Reusable method to navigate to Reject Unit Component with current form state
   * Used by both first tab REJECT button and second tab REJECT button
   */
  private navigateToRejectUnit(): void {
    // Capture current form state based on which tab is active
    // Get the FULL unit ID (with check digit) from the appropriate field component
    let fullUnitId = '';
    if (this.selectedTabIndex === 0 && this.unitIdField) {
      fullUnitId = this.unitIdField.unitIdControl?.value || '';
    } else if (this.selectedTabIndex === 1 && this.intermediateUnitIdField) {
      fullUnitId = this.intermediateUnitIdField.unitIdControl?.value || '';
    } else if (this.selectedTabIndex === 2 && this.finalUnitIdField) {
      fullUnitId = this.finalUnitIdField.unitIdControl?.value || '';
    }

    const currentFormState: any = {
      unitId: fullUnitId,
      parsedUnitId: this.validatedUnitId || '',
      tabIndex: this.selectedTabIndex.toString()
    };

    // Tab 0: Verify Suitability - save verify suitability form
    if (this.selectedTabIndex === 0) {
      const formValues = this.verifySuitabilityForm.getRawValue();

      currentFormState.productCategory = formValues.productCategory || '';
      currentFormState.productCode = formValues.productCode || '';
      currentFormState.volumeTypeSet = formValues.volumeTypeSet || '';

      // Add optional fields if they have values
      if (formValues.suspensionType) currentFormState.suspensionType = formValues.suspensionType;
      if (formValues.initialPlateletCount) currentFormState.initialPlateletCount = formValues.initialPlateletCount;
      if (formValues.productWeight) currentFormState.productWeight = formValues.productWeight;
      if (formValues.initialProductVolume) currentFormState.initialProductVolume = formValues.initialProductVolume;
      if (formValues.rbcContent) currentFormState.rbcContent = formValues.rbcContent;
      if (formValues.anticoagulantVolume) currentFormState.anticoagulantVolume = formValues.anticoagulantVolume;
      if (formValues.processDate) currentFormState.processDate = new Date(formValues.processDate).toISOString();
      if (formValues.processTime) currentFormState.processTime = formValues.processTime;
      if (formValues.aggregates) currentFormState.aggregates = formValues.aggregates;
      if (formValues.interimProductCode) currentFormState.interimProductCode = formValues.interimProductCode;
      if (this.suitabilityStatus()) currentFormState.suitabilityStatus = this.suitabilityStatus();
    }
    // Tab 1: Intermediate Process - save intermediate process form
    else if (this.selectedTabIndex === 1) {
      const formValues = this.intermediateProcessForm.getRawValue();

      currentFormState.interimProductCode = formValues.interimProductCode || '';
      currentFormState.equipmentType = formValues.equipmentType || '';
      currentFormState.illuminator = formValues.illuminator || '';
      currentFormState.serialNumber = formValues.serialNumber || '';
      currentFormState.volumeTypeSet = formValues.volumeTypeSet || '';
      currentFormState.setIdLotNumber = formValues.setIdLotNumber || '';
      currentFormState.operatorId = formValues.operatorId || '';
      currentFormState.status = formValues.status || '';
      currentFormState.instrumentMessage = formValues.instrumentMessage || '';
      currentFormState.cadProd = formValues.cadProd || '';

      if (formValues.treatmentDate) currentFormState.treatmentDate = new Date(formValues.treatmentDate).toISOString();
      if (formValues.treatmentStartTime) currentFormState.treatmentStartTime = formValues.treatmentStartTime;
      if (formValues.treatmentElapsedTime) currentFormState.treatmentElapsedTime = formValues.treatmentElapsedTime;
      if (formValues.cadStartDate) currentFormState.cadStartDate = new Date(formValues.cadStartDate).toISOString();
      if (formValues.cadStartTime) currentFormState.cadStartTime = formValues.cadStartTime;
    }
    // Tab 2: Final Transfer/Storage - save final transfer form
    else if (this.selectedTabIndex === 2) {
      const formValues = this.finalTransferForm.getRawValue();

      currentFormState.interimProductCode = formValues.interimProductCode || '';
      currentFormState.cadProd = formValues.cadProd || '';
      currentFormState.cadStartTime = formValues.cadStartTime || '';
      currentFormState.cadStartTime2 = formValues.cadStartTime2 || '';
      currentFormState.cadEndTime = formValues.cadEndTime || '';
      currentFormState.cadEndTime2 = formValues.cadEndTime2 || '';
      currentFormState.cadElapsedTime = formValues.cadElapsedTime || '';
      currentFormState.cadStatus = formValues.cadStatus || '';
      currentFormState.numberOfBags = formValues.numberOfBags || '';
      currentFormState.volumeTypeSet = formValues.volumeTypeSet || '';
      currentFormState.setIdLotNumber = formValues.setIdLotNumber || '';

      if (formValues.date) currentFormState.date = new Date(formValues.date).toISOString();
    }

    // Construct return URL with query params
    const returnPath = '/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-manager';
    const params = new URLSearchParams();
    Object.entries(currentFormState).forEach(([key, value]) => {
      if (value) params.append(key, value as string);
    });
    const returnUrl = params.toString() ? `${returnPath}?${params.toString()}` : returnPath;

    // Navigate with returnUrl in query params
    this.router.navigate(['/laboratory-functions/component-production/routine-component-production/reject-unit-component'], {
      queryParams: { returnUrl },
      state: { fromPathogenReduction: true }
    });
  }

  /**
   * Get CAD Status class for color coding
   * Returns 'EARLY', 'LATE', or 'READY' based on CAD status value from backend
   */
  getCadStatusClass(): string | null {
    const statusValue = this.finalTransferForm.get('cadStatusValue')?.value;
    return statusValue || null;
  }

  /**
   * REJECT Button - Directly navigate to Reject Unit Component
   * User will enter rejection reason in the Reject Unit Component screen
   */
  onRejectUnit(): void {
    this.navigateToRejectUnit();
  }

  onRemovePsoralen(): void {
    const dialogRef = this.dialog.open(PsoralenRemovalPanelComponent, {
      width: '700px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'psoralen-removal-drawer',
      disableClose: true,
      hasBackdrop: true,
      backdropClass: 'side-panel-backdrop',
      data: {
        unitId: this.validatedUnitId, // Pass validated unit ID (parsed format) - available after unit validation
        manualUnitId: this.manualUnitIdWithCheckDigit // Pass manual unit ID with check digit for display
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle the saved data here
      }
    });
  }

  onRemoveIlluminationBag(): void {
    // Use validatedUnitId from current tab (could be from any tab)
    // Prefer savedUnitIdForPanels from Tab 1 if available, otherwise use current validatedUnitId
    const unitId = this.savedUnitIdForPanels || this.validatedUnitId;
    const manualUnitId = this.manualUnitIdWithCheckDigit;

    const dialogRef = this.dialog.open(IlluminationBagRemovalPanelComponent, {
      width: '700px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'illumination-bag-removal-drawer',
      disableClose: true,
      hasBackdrop: true,
      backdropClass: 'side-panel-backdrop',
      data: {
        unitId: unitId, // Pass unit ID (parsed format)
        manualUnitId: manualUnitId // Pass manual unit ID with check digit for display
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle the saved data here
      }
    });
  }

  /**
   * REJECT Button on second tab (Intermediate Process) - Navigate to Reject Unit Component
   * Uses the same reusable navigation method as first tab
   */
  onReject(): void {
    this.navigateToRejectUnit();
  }

  onFinalUnitIdValidated(response: UnitValidationResponse): void {
    if (response.parsedUnitId) {
      const unitId = response.parsedUnitId;
      this.validatedUnitId = unitId; // Enable Save button
      this.manualUnitIdWithCheckDigit = response.manualUnitId; // Store manual unit ID with check digit

      // Reset form to clear all previous values from old unit
      this.finalTransferForm.patchValue({
        date: null,
        interimProductCode: '',
        cadProd: '',
        cadStartTime: '',
        cadStartTime2: '',
        cadEndTime: '',
        cadElapsedTime: '',
        cadStatusValue: '',
        cadStatus: '',
        numberOfBags: '',
        volumeTypeSet: '',
        setIdLotNumber: ''
      });

      // Clear final products table
      this.finalProducts.set([]);
      this.selectedProduct.set(null);

      this.loading.set(true);

      // Load pathogen reduction details for Final Transfer tab
      // Note: Backend DTO needs to be updated to include the following fields from PATHOGEN_REDUCTION_DETAILS table:
      // - collDate (COLL_DATE)
      // - suitProdCode (SUIT_PROD_CODE) - Interim Product Code
      // - cadProdCode (CAD_PROD_CODE) - CAD Prod
      // - cadStartTime (CAD_START_TIME) - CAD Start Time
      // - cadTotalTime (CAD_TOTAL_TIME) - CAD Elapsed Time
      // - illuminatorMessage (ILLUMINATOR_MESSAGE) - CAD Status
      // - volTypeSet (VOL_TYPE_SET) - Volume Type Set
      // - setIdLotNo (SET_ID_LOT_NO) - Set ID Lot Number

      this.prService.getPathogenReductionDetails(unitId, undefined, 'finaltransfer')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (details) => {
            // Store chapter ID and product category for later use
            this.currentChapterId.set(details.chapterId || '');
            this.currentProductCategory.set(details.productCategory || '');

            // Parse cadEndTime into date and time components if available
            let cadEndDate = null;
            let cadEndTime = '';
            if (details.cadEndTime) {
              const cadEndMoment = moment(details.cadEndTime);
              cadEndDate = cadEndMoment.toDate();
              cadEndTime = cadEndMoment.format('HH:mm'); // Extract only time in HH:mm format
            }

            // Populate Final Transfer form with data from PathogenReductionDetailsDto
            this.finalTransferForm.patchValue({
              date: details.collDate ? new Date(details.collDate) : null,
              interimProductCode: details.suitProdCode || '',
              cadProd: details.cadProdCode || '',
              cadStartTime: details.cadStartTime || '',
              cadStartTime2: details.cadStartTime || '',
              cadEndTime: cadEndDate,
              cadEndTime2: cadEndTime,
              cadElapsedTime: details.cadTotalTime || '',
              cadStatusValue: details.cadStatus || '', // EARLY, LATE, or READY
              cadStatus: details.cadStatusMessage || details.illuminatorMessage || '', // Display message
              numberOfBags: details.numBags || null,
              volumeTypeSet: details.volTypeSet || '',
              setIdLotNumber: details.setIdLotNo || ''
            });

            // Load CAD product codes for Final Transfer tab using productCategory and suitProdCode from API response
            if (details.suitProdCode) {
              this.loadCadProductCodes(
                details.suitProdCode,
                details.cadProdCode ?? undefined,
                details.productCategory ?? undefined
              );
            }

            // Load final products table data
            if (details.suitProdCode) {
              this.loadFinalProducts(unitId, details.suitProdCode);
            } else {
              this.finalProducts.set([]);
              this.loading.set(false);
              this.snackbarService.showSuccess('Unit details loaded successfully');
            }
          },
          error: (error) => {
            this.loading.set(false);

            // 404 is expected for units that haven't completed suitability yet - don't show error
            if (error?.status === 404) {
              this.finalTransferForm.reset();
              this.finalProducts.set([]);
            } else {
              // Show error only for actual failures (500, network errors, etc.)
              const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to load unit details. Please try again.');
              this.snackbarService.showError(errorMessage);
              this.finalTransferForm.reset();
            }
          }
        });
    }
  }

  /**
   * Load final products for the validated unit
   */
  private loadFinalProducts(unitId: string, suitProdCode: string): void {
    this.prService.getFinalProducts(unitId, suitProdCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.finalProducts.set(products);
          // Load products into the FormArray for editing
          this.loadFinalProductsIntoFormArray(products);
          this.loading.set(false);
          this.snackbarService.showSuccess(
            `Unit details loaded successfully. ${products.length} final product(s) found.`
          );
        },
        error: (error) => {
          this.finalProducts.set([]);
          // Clear FormArray on error
          this.finalProductsArray.clear();
          this.loading.set(false);
          // Don't show error for final products - just show success for main details
          this.snackbarService.showSuccess('Unit details loaded successfully');
        }
      });
  }

  onFinalUnitIdCleared(): void {
    // Clear Final Transfer form when unit ID is cleared
    this.finalTransferForm.reset();
    // Clear final products table data
    this.finalProducts.set([]);
    this.selectedProduct.set(null);
    this.currentChapterId.set('');
    this.currentProductCategory.set('');
    // Clear validated unit ID to disable Save button
    this.validatedUnitId = null;
    this.manualUnitIdWithCheckDigit = null;
  }

  /**
   * Select a product row in the Final Products table
   */
  selectProduct(product: PathogenFinalProductDto): void {
    this.selectedProduct.set(product);
  }

  /**
   * Check if a product is selected
   */
  isProductSelected(product: PathogenFinalProductDto): boolean {
    return this.selectedProduct() === product;
  }

  /**
   * Reprint label for the selected product or CAD product
   * Works for both Intermediate Process tab (tab 1) and Final Transfer tab (tab 2)
   */
  onReprintLabel(): void {
    // Check which tab we're on
    if (this.selectedTabIndex === 1) {
      // Intermediate Process tab - use CAD product code
      const cadProductCode = this.intermediateProcessForm.get('cadProd')?.value;
      const collDate = this.intermediateProcessForm.get('date')?.value;

      if (!cadProductCode) {
        this.snackbarService.showError('Please select a CAD product code');
        return;
      }

      if (!this.validatedUnitId) {
        this.snackbarService.showError('Please enter a valid Unit ID');
        return;
      }

      if (!collDate) {
        this.snackbarService.showError('Collection date is required to reprint the label');
        return;
      }

      this.loading.set(true);

      // Convert Date object to ISO string (YYYY-MM-DD format)
      const collDateString = collDate instanceof Date
        ? collDate.toISOString().split('T')[0]
        : collDate;

      const request: ReprintLabelRequestDto = {
        unitId: this.validatedUnitId,
        productCode: cadProductCode,
        collDate: collDateString
      };

      this.prService.reprintLabel(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.loading.set(false);
            const labelData = response.data?.[0];
            if (labelData?.preprintedLabel) {
              this.snackbarService.showSuccess('Product has preprinted label — no printing needed');
            } else {
              const warning = labelData?.timeLimitWarning ? ` | Warning: ${labelData.timeLimitWarning}` : '';
              this.snackbarService.showSuccess(`Label sent to printer${warning}`);
            }
          },
          error: (error) => {
            this.loading.set(false);
            this.snackbarService.showError(
              error?.error?.message || 'Failed to reprint label. Please try again.'
            );
          }
        });

      return;
    }

    // Final Transfer tab - use selected product from table
    const product = this.selectedProduct();
    const collDate = this.finalTransferForm.get('date')?.value;

    if (!product) {
      this.snackbarService.showError('Please select a product to reprint the label');
      return;
    }

    if (!collDate) {
      this.snackbarService.showError('Collection date is required to reprint the label');
      return;
    }

    this.loading.set(true);

    // Convert Date object to ISO string (YYYY-MM-DD format)
    const collDateString = collDate instanceof Date
      ? collDate.toISOString().split('T')[0]
      : collDate;

    const request: ReprintLabelRequestDto = {
      unitId: product.unitId,
      productCode: product.productCode,
      collDate: collDateString
    };

    this.prService.reprintLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          const labelData = response.data?.[0];
          if (labelData?.preprintedLabel) {
            this.snackbarService.showSuccess('Product has preprinted label — no printing needed');
          } else {
            const warning = labelData?.timeLimitWarning ? ` | Warning: ${labelData.timeLimitWarning}` : '';
            this.snackbarService.showSuccess(`Label sent to printer${warning}`);
          }
        },
        error: (error) => {
          this.loading.set(false);
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to reprint label. Please try again.');
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  /**
   * Get the final products FormArray
   */
  get finalProductsArray(): FormArray {
    return this.finalTransferForm.get('finalProducts') as FormArray;
  }

  /**
   * Create a new final product form group with FMB validations
   */
  private createFinalProductFormGroup(product?: PathogenFinalProductDto): FormGroup {
    const formGroup = this.fb.group({
      productCode: [product?.productCode || '', [Validators.required, Validators.maxLength(8)]],
      prodWeight: [product?.prodWeight || null, [Validators.required, Validators.min(1), Validators.max(999.99)]], // FMB error 0250: between 1 and 999.99
      prodVol: [{ value: product?.prodVol || null, disabled: true }], // Auto-calculated from weight
      anticoagulantVolume: [product?.anticoagulantVolume || null, [Validators.min(0), Validators.max(999), this.anticoagulantVolumeValidator(), this.anticoagulantMaxValidator()]], // FMB: FormatMask 999, MaxLength 5
      verifyProductCode: ['', [Validators.required, Validators.maxLength(8), this.verifyProductCodeValidator()]],
      finalPltCount: [product?.finalPltCount || null, [Validators.min(0), Validators.max(9.9), this.plateletCountMaxValidator()]] // FMB: FormatMask 9.9, MaxLength 3
    });

    // Add dynamic validator for volume that checks against parent initial volume
    formGroup.get('prodVol')?.addValidators(this.volumeMaxValidator());

    // Listen to weight changes to calculate volume (FMB: volume = ROUND(weight / specific_gravity, 2))
    formGroup.get('prodWeight')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(weight => {
      if (weight && weight >= 1 && weight <= 999.99) {
        this.calculateVolumeFromWeight(formGroup, weight);
      }
    });

    // Auto-populate anticoagulant volume from parent if empty
    if (!product?.anticoagulantVolume) {
      const parentAnticoagulant = this.finalTransferForm?.get('anticoagulantVolume')?.value;
      if (parentAnticoagulant) {
        formGroup.get('anticoagulantVolume')?.setValue(parentAnticoagulant);
      }
    }

    return formGroup;
  }

  /**
   * Add a new empty product row to the table
   */
  addNewProduct(): void {
    const newProductGroup = this.createFinalProductFormGroup();
    this.finalProductsArray.push(newProductGroup);
  }

  /**
   * Remove a product row from the table
   */
  removeProduct(index: number): void {
    this.finalProductsArray.removeAt(index);
  }

  /**
   * Select a product row (for disabled/saved rows to enable REPRINT LABEL)
   */
  selectProductRow(index: number): void {
    const productGroup = this.finalProductsArray.at(index) as FormGroup;

    // Check if productGroup exists
    if (!productGroup) {
      return;
    }

    // Only allow selection of disabled (saved) rows
    if (productGroup.get('productCode')?.disabled) {
      const productCode = productGroup.get('productCode')?.value;

      // Check if this row is already selected - if so, unselect it
      if (this.isProductRowSelected(index)) {
        this.selectedProduct.set(null);
        return;
      }

      // Create a PathogenFinalProductDto from the form data
      const product: PathogenFinalProductDto = {
        unitId: this.validatedUnitId || '',
        productCode: productCode,
        prodWeight: productGroup.get('prodWeight')?.value,
        prodVol: productGroup.get('prodVol')?.value,
        anticoagulantVolume: productGroup.get('anticoagulantVolume')?.value,
        finalPltCount: productGroup.get('finalPltCount')?.value,
        suitProdCode: '',
        cadProdCode: '',
        insertDate: new Date().toISOString(),
        insertUser: '',
        programId: null,
        auditKey: null
      };

      this.selectedProduct.set(product);
    }
  }

  /**
   * Check if a product row is selected
   */
  isProductRowSelected(index: number): boolean {
    const productGroup = this.finalProductsArray.at(index) as FormGroup;
    if (!productGroup) {
      return false;
    }
    const productCode = productGroup.get('productCode')?.value;
    const selectedProductCode = this.selectedProduct()?.productCode;

    return productCode === selectedProductCode && !!selectedProductCode;
  }

  /**
   * Check if a product row is disabled (saved from database)
   */
  isProductRowDisabled(index: number): boolean {
    const productGroup = this.finalProductsArray.at(index) as FormGroup;
    if (!productGroup) {
      return false;
    }
    return productGroup.get('productCode')?.disabled || false;
  }

  /**
   * Handle weight change - auto-calculate volume
   * Volume = ROUND(weight / specific_gravity, 2)
   * Note: specific_gravity comes from the product code's valid_products table
   */
  onWeightChange(index: number): void {
    const productGroup = this.finalProductsArray.at(index) as FormGroup;
    if (!productGroup) {
      return;
    }
    const weight = productGroup.get('prodWeight')?.value;

    if (weight && weight >= 1 && weight <= 999.99) {
      this.calculateVolumeFromWeight(productGroup, weight);
    } else {
      productGroup.get('prodVol')?.setValue(null);
    }
  }

  /**
   * Calculate volume from weight using specific gravity
   * FMB logic: volume = ROUND(weight / specific_gravity, 2)
   * Uses cached specific gravity fetched when product code was entered
   */
  private calculateVolumeFromWeight(formGroup: FormGroup, weight: number): void {
    const productCode = formGroup.get('productCode')?.value;

    if (!productCode) {
      formGroup.get('prodVol')?.setValue(null, { emitEvent: false });
      return;
    }

    // Get specific gravity from cache (set when product code was entered)
    const specificGravity = this.specificGravityCache.get(productCode) || 1.025;

    // FMB: volume = ROUND(weight / specific_gravity, 2)
    const volume = Math.round((weight / specificGravity) * 100) / 100;
    formGroup.get('prodVol')?.setValue(volume, { emitEvent: false });
  }

  /**
   * Handle product code change - fetch specific gravity and recalculate volume
   */
  onProductCodeChange(index: number): void {
    const productGroup = this.finalProductsArray.at(index) as FormGroup;
    if (!productGroup) {
      return;
    }
    const productCode = productGroup.get('productCode')?.value;

    // Auto-populate verify field with the same product code
    productGroup.get('verifyProductCode')?.setValue(productCode);

    // Re-validate the verify code field
    productGroup.get('verifyProductCode')?.updateValueAndValidity();

    if (!productCode) {
      return;
    }

    // Check if we already have specific gravity cached for this product code
    if (this.specificGravityCache.has(productCode)) {
      // Recalculate volume with cached specific gravity
      this.onWeightChange(index);
      return;
    }

    // Fetch specific gravity from API and cache it
    // Uses simple endpoint: GET /specific-gravity?productCode={productCode}
    // No unitId or collectionDate required!
    this.prService.getSpecificGravity(productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (specificGravity: number) => {
          // Cache the specific gravity for this product code
          this.specificGravityCache.set(productCode, specificGravity);

          // Recalculate volume if weight is already entered
          this.onWeightChange(index);
        },
        error: (error: unknown) => {
          // Use fallback specific gravity (default from API is 1.025)
          this.specificGravityCache.set(productCode, 1.025);
        }
      });
  }

  /**
   * Prevent negative sign, minus, and 'e' character in number inputs
   * Also prevent '+' sign to ensure only positive decimal numbers
   */
  preventNegativeInput(event: KeyboardEvent): void {
    const invalidChars = ['-', '+', 'e', 'E'];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Restrict anticoagulant volume input to max 3 digits (999)
   * FMB: FormatMask 999, MaxLength 5
   */
  restrictAnticoagulantInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove any non-digit characters except decimal point
    value = value.replace(/[^\d]/g, '');

    // Limit to 3 digits (999 max)
    if (value.length > 3) {
      value = value.substring(0, 3);
    }

    // Update input value if changed
    if (input.value !== value) {
      input.value = value;
      // Trigger Angular change detection
      const control = (event.target as any).closest('tr')?.formGroup?.get('anticoagulantVolume');
      if (control) {
        control.setValue(value ? parseInt(value, 10) : null);
      }
    }
  }

  /**
   * Load final products into the FormArray
   * All loaded products are disabled (read-only) as they are already saved in the database
   */
  private loadFinalProductsIntoFormArray(products: PathogenFinalProductDto[]): void {
    // Clear existing rows
    this.finalProductsArray.clear();

    // Get product category from suitability form
    const productCategory = this.verifySuitabilityForm.get('productCategory')?.value;

    // Add each product as a row
    products.forEach(product => {
      const productGroup = this.createFinalProductFormGroup(product);

      // Determine which product code to display based on category
      // If PLT: use cadProdCode, else (PLAS): use suitProdCode
      const displayProductCode = productCategory === 'PLT'
        ? product.cadProdCode
        : product.suitProdCode;

      // Set the product code field with the category-appropriate code
      productGroup.get('productCode')?.setValue(displayProductCode);
      productGroup.get('verifyProductCode')?.setValue(displayProductCode);

      // Disable all controls - saved products are read-only
      productGroup.get('productCode')?.disable();
      productGroup.get('prodWeight')?.disable();
      productGroup.get('prodVol')?.disable(); // Already disabled in form creation
      productGroup.get('anticoagulantVolume')?.disable();
      productGroup.get('verifyProductCode')?.disable();
      productGroup.get('finalPltCount')?.disable();

      this.finalProductsArray.push(productGroup);
    });
  }

  /**
   * Save Final Transfer data
   */
  onSaveFinalTransfer(): void {
    if (!this.validatedUnitId) {
      this.snackbarService.showError('Please enter a valid Unit ID');
      return;
    }

    const cadEndDate = this.finalTransferForm.get('cadEndTime')?.value;
    const cadEndTimeStr = this.finalTransferForm.get('cadEndTime2')?.value;
    const numberOfBags = this.finalTransferForm.get('numberOfBags')?.value;

    if (!cadEndDate || !cadEndTimeStr) {
      this.snackbarService.showError('CAD End Date and Time are required');
      return;
    }

    // Check for validation errors on cadEndTime2 (time field)
    if (this.finalTransferForm.get('cadEndTime2')?.hasError('invalidEndTime')) {
      this.snackbarService.showError('CAD End Date and Time must be after CAD Start Date and Time');
      return;
    }

    if (this.finalTransferForm.get('cadEndTime2')?.hasError('pattern')) {
      this.snackbarService.showError('Invalid time format. Please use HH:MM format (e.g., 14:30)');
      return;
    }

    // Check for min date validation on cadEndTime (date field)
    if (this.finalTransferForm.get('cadEndTime')?.hasError('matDatepickerMin')) {
      this.snackbarService.showError('CAD End Date must be on or after CAD Start Date');
      return;
    }

    if (!numberOfBags || numberOfBags <= 0) {
      this.snackbarService.showError('Number of Bags is required and must be greater than 0');
      return;
    }

    // Combine cadEndDate and cadEndTimeStr into a single ISO string
    const combinedCadEndTime = this.combineDateAndTime(cadEndDate, cadEndTimeStr);

    this.loading.set(true);

    const currentUser = this.loginService.getStoredUsername() || 'SYSTEM';
    const currentDateTime = new Date().toISOString();

    const payload: UpdateFinalTransferRequestDto = {
      unitId: this.validatedUnitId,
      cadEndTime: combinedCadEndTime,
      numBags: numberOfBags,
      finalTransferDate: currentDateTime,
      finalTransferUser: currentUser
    };

    this.prService.updateFinalTransfer(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // After successfully saving Final Transfer, save Final Products if any
          if (this.finalProductsArray.length > 0) {
            this.saveFinalProductsData();
          } else {
            this.loading.set(false);
            this.snackbarService.showSuccess(`Final Transfer saved successfully for Unit ID: ${this.validatedUnitId}`);
          }
        },
        error: (error) => {
          this.loading.set(false);
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to save Final Transfer');
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  /**
   * Save Final Products data
   */
  private saveFinalProductsData(): void {
    if (!this.validatedUnitId) {
      this.snackbarService.showError('Unit ID is required to save final products');
      return;
    }

    // Mark all fields as touched to show validation errors
    this.finalProductsArray.controls.forEach(control => {
      const productGroup = control as FormGroup;
      Object.keys(productGroup.controls).forEach(key => {
        productGroup.get(key)?.markAsTouched();
        productGroup.get(key)?.updateValueAndValidity();
      });
    });

    // Check if form array is valid
    if (this.finalProductsArray.invalid) {
      this.loading.set(false);
      this.snackbarService.showError('Please fix validation errors before saving');
      return;
    }

    // Build final products payload from form array
    // Only include NEW (enabled/editable) records - filter out disabled (saved) records
    const finalProducts: any[] = this.finalProductsArray.controls
      .filter(control => {
        const productGroup = control as FormGroup;
        // Only include rows where productCode is NOT disabled (new rows)
        return !productGroup.get('productCode')?.disabled;
      })
      .map(control => {
        const productGroup = control as FormGroup;
        return {
          finalUnitId: this.validatedUnitId,
          productCode: productGroup.get('productCode')?.value,
          prodWeight: productGroup.get('prodWeight')?.value,
          volume: productGroup.get('prodVol')?.value || null,
          anticoagulantVolume: productGroup.get('anticoagulantVolume')?.value || null,
          verifyProductCode: productGroup.get('verifyProductCode')?.value,
          finalPltCount: productGroup.get('finalPltCount')?.value || null
        };
      });

    // If there are no new products to save (all are disabled/saved), just show success and return
    if (finalProducts.length === 0) {
      this.loading.set(false);
      this.snackbarService.showSuccess('Final Transfer saved successfully');
      return;
    }

    // Get product category from API response (stored when unit was loaded)
    // Get suitProdCode and cadProdCode from final transfer form
    const productCategory = this.currentProductCategory();
    const suitProdCode = this.finalTransferForm.get('interimProductCode')?.value;
    const cadProdCode = this.finalTransferForm.get('cadProd')?.value;

    // Prepare the request payload
    const request = {
      sourceUnitId: this.validatedUnitId,
      productCategory: productCategory,
      suitProdCode: suitProdCode,
      cadProdCode: cadProdCode,
      finalProducts: finalProducts
    };

    // Call the API to save final products
    this.prService.saveFinalProducts(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Final Products and Final Transfer saved successfully');
          // Optionally reload final products to show updated data
          const suitProdCode = this.finalTransferForm.get('interimProductCode')?.value;
          if (suitProdCode && this.validatedUnitId) {
            this.loadFinalProducts(this.validatedUnitId, suitProdCode);
          }
        },
        error: (error) => {
          this.loading.set(false);
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to save Final Products');
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  onRemoveCADBag(): void {
    // Get the manual unit ID directly from the unit ID field component
    const manualUnitId = this.manualUnitIdWithCheckDigit || this.unitIdField?.unitIdControl?.value || '';
    const dialogRef = this.dialog.open(CadBagRemovalPanelComponent, {
      width: '700px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'cad-removal-dialog',
      disableClose: true,
      hasBackdrop: true,
      backdropClass: 'side-panel-backdrop',
      data: {
        unitId: manualUnitId, // Pass manual unit ID with check digit (for display)
        parsedUnitId: this.validatedUnitId, // Pass parsed unit ID (for API call)
        suitProdCode: this.finalTransferForm.get('interimProductCode')?.value
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Success - reload final products
        const unitId = this.validatedUnitId;
        const suitProdCode = this.finalTransferForm.get('interimProductCode')?.value;
        if (unitId && suitProdCode) {
          this.loadFinalProducts(unitId, suitProdCode);
        }
      }
    });
  }

  onQueryStatus(): void {
    const dialogRef = this.dialog.open(QueryStatusPanelComponent, {
      width: '1100px',
      maxWidth: '90vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'query-status-drawer',
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'side-panel-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Switch to Final Transfer tab (index 2)
        this.selectedTabIndex = 2;

        // Wait for tab to render, then set the Unit ID and trigger validation
        setTimeout(() => {
          if (this.finalUnitIdField) {
            // Format Unit ID with = prefix and 00 suffix (e.g., =W63332606170700)
            const formattedUnitId = `=${result.unitId}00`;

            // Set the formatted Unit ID value
            this.finalUnitIdField.setValue(formattedUnitId);

            // Trigger blur to start validation
            setTimeout(() => {
              if (this.finalUnitIdField.unitIdInput?.nativeElement) {
                this.finalUnitIdField.unitIdInput.nativeElement.dispatchEvent(new Event('blur'));
              }
            }, 50);
          }
        }, 100);
      }
    });
  }

  onSave(): void {
    // Route to correct save method based on selected tab
    if (this.selectedTabIndex === 0) {
      this.onSaveVerifySuitability();
    } else if (this.selectedTabIndex === 1) {
      this.onSaveIntermediateProcess();
    } else if (this.selectedTabIndex === 2) {
      this.onSaveFinalTransfer();
    } else {
      this.snackbarService.showError('Save is not available for this tab');
    }
  }

  onSaveVerifySuitability(): void {
    if (!this.validatedUnitId) {
      this.snackbarService.showError('Please enter a valid Unit ID');
      return;
    }

    // Mark all fields as touched to show validation errors
    Object.keys(this.verifySuitabilityForm.controls).forEach(key => {
      this.verifySuitabilityForm.get(key)?.markAsTouched();
    });

    // Validate form

    // Log all field errors
    Object.keys(this.verifySuitabilityForm.controls).forEach(key => {
      const control = this.verifySuitabilityForm.get(key);
      if (control?.invalid) {
      }
    });

    if (this.verifySuitabilityForm.invalid) {
      const errors: string[] = [];

      if (this.verifySuitabilityForm.get('productCategory')?.hasError('required')) {
        errors.push('Product Category is required');
      }
      if (this.verifySuitabilityForm.get('suspensionType')?.hasError('required')) {
        errors.push('Suspension Type is required');
      }
      if (this.verifySuitabilityForm.get('processDate')?.hasError('required')) {
        errors.push('Process Date is required');
      }
      if (this.verifySuitabilityForm.get('processTime')?.hasError('required')) {
        errors.push('Process Time is required');
      }
      if (this.verifySuitabilityForm.get('processTime')?.hasError('pattern')) {
        errors.push('Process Time must be in HH:MM format (e.g., 14:30)');
      }
      if (this.verifySuitabilityForm.hasError('futureDateTime')) {
        errors.push('Process Date/Time cannot be in the future');
      }
      if (this.verifySuitabilityForm.get('volumeTypeSet')?.hasError('required')) {
        errors.push('Volume Type Set is required');
      }
      if (this.verifySuitabilityForm.hasError('atLeastOneWeightOrVolume')) {
        errors.push('Either Product Weight or Product Volume is required');
      }

      if (errors.length > 0) {
        this.snackbarService.showError(errors.join(', '));
      } else {
        this.snackbarService.showError('Form validation failed. Please check all required fields.');
      }
      return;
    }

    // Must check suitability first before saving
    if (!this.suitabilityStatus()) {
      this.snackbarService.showError('Please check suitability before saving');
      return;
    }

    // Allow saving regardless of suitability status (Suitable or Not Suitable)

    this.loading.set(true);

    const payload = this.buildSaveSuitabilityPayload();

    this.prService.saveSuitability(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.snackbarService.showSuccess(`Suitability saved successfully for Unit ID: ${response.unitId}`);

          // Populate saved unit ID in Initial Sterile Docking and Remove Psoralen panels
          this.savedUnitIdForPanels = response.unitId;

          // Set suitability passed flag if suitability status is 'Suitable'
          // This enables the INITIAL STERILE DOCKING button
          if (this.suitabilityStatus() === 'Suitable') {
            this.isSuitabilityPassed.set(true);
          } else {
            this.isSuitabilityPassed.set(false);
          }

          // Check if sterile docking is completed to enable REMOVE PSORALEN button
          this.checkSterileDockingStatus(response.unitId);
        },
        error: (error) => {
          this.loading.set(false);
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to save suitability');
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  /**
   * Check if sterile docking has been completed for this unit
   * Enables the REMOVE PSORALEN button if sterile docking exists
   * @param unitId - Unit ID to check
   */
  private checkSterileDockingStatus(unitId: string): void {
    this.prService.getPathogenReductionDetails(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          // If sterileDockDate is not null, sterile docking has been completed
          // This means a record exists in pathogen_sterile_docking table for PSORALEN
          if (details.sterileDockDate) {
            this.isSterileDockingCompleted.set(true);
          } else {
            this.isSterileDockingCompleted.set(false);
          }
        },
        error: (error) => {
          this.isSterileDockingCompleted.set(false);
        }
      });
  }

  /**
   * Load existing pathogen reduction state for a unit (update mode detection).
   * Matches FMB SUIT_CHECK procedure: if a record exists in pathogen_reduction_details,
   * set button flags and suitability status from the stored data.
   */
  private loadExistingPathogenReductionState(unitId: string): void {
    this.prService.getPathogenReductionDetails(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          if (!details || !details.unitId) {
            return;
          }

          if (details.suitStatusCode === 'Y') {
            this.isSuitabilityPassed.set(true);
            this.suitabilityStatus.set('Suitable');
          } else if (details.suitStatusCode === 'N') {
            this.isSuitabilityPassed.set(false);
            this.suitabilityStatus.set('Not Suitable');
          }

          if (details.suitProdCode) {
            this.hasInterimProductCode.set(true);
          }

          if (details.sterileDockDate) {
            this.isSterileDockingCompleted.set(true);
          }
        },
        error: () => {
          // No existing record — this is a new entry, not update mode
        }
      });
  }

  /**
   * Build save suitability payload from form values
   * Only includes fields that are present in the UI
   * Uses getRawValue() to include disabled field (equipmentType)
   */
  private buildSaveSuitabilityPayload(): SaveSuitabilityRequestDto {
    const formValues = this.verifySuitabilityForm.getRawValue();
    const currentUser = this.loginService.getStoredUsername() || 'SYSTEM';
    const currentDateTime = new Date().toISOString();

    // Helper function to convert aggregates dropdown to single character "A"/"N"
    // AGGR_ACC is VARCHAR2(1) - single character only
    const convertAggregates = (value: string | null): string | null => {
      if (!value) return null;
      // Value is already "A" or "N" from dropdown
      return value;
    };

    // Helper function to parse numeric values
    const parseNumber = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Extract suspension type from combined key (format: "suspensionType|equipType")
    const extractSuspensionType = (combinedKey: string | null): string | null => {
      if (!combinedKey) return null;
      const parts = combinedKey.split('|');
      return parts[0] || null;
    };

    // Helper function to combine date and time into local datetime string (NO UTC conversion)
    const combineDateTime = (date: any, time: string | null): string | null => {
      if (!date || !time) return null;
      try {
        const datePart = moment(date).format('YYYY-MM-DD');
        const combinedDateTime = moment(`${datePart} ${time}`, 'YYYY-MM-DD HH:mm');
        // Use format() instead of toISOString() to avoid UTC conversion
        return combinedDateTime.isValid() ? combinedDateTime.format('YYYY-MM-DDTHH:mm:ss') : null;
      } catch (error) {
        return null;
      }
    };

    // Determine suitability status code based on check suitability result
    // 'Y' = Suitable (passed), 'N' = Not Suitable (failed)
    const suitStatusCode = this.suitabilityStatus() === 'Suitable' ? 'Y' : 'N';

    // Get rejection reason from form (only populated if not suitable)
    const suitStatusReason = formValues.rejectionReason || null;

    const payload: SaveSuitabilityRequestDto = {
      // Required fields
      unitId: this.validatedUnitId || '',
      productCode: formValues.productCode,
      suitabilityDate: currentDateTime,
      suitabilityUser: currentUser,

      // Optional fields - only send if present on UI
      collDate: formValues.date ? new Date(formValues.date).toISOString() : null,
      productCategory: formValues.productCategory || null,
      volumeTypeSet: formValues.volumeTypeSet || null,
      suspensionType: extractSuspensionType(formValues.suspensionType), // Extract suspension type from combined key
      initPltCount: parseNumber(formValues.initialPlateletCount),
      rbcContentStatus: formValues.rbcContent || null, // Already "PASS" or "FAIL" from dropdown
      bleedEndTime: formValues.bleedEndTime ? new Date(formValues.bleedEndTime).toISOString() : null,
      initialProdWeight: parseNumber(formValues.productWeight),
      initialProdVol: parseNumber(formValues.initialProductVolume),
      equipType: formValues.equipmentType || null,
      anticoagulantVolume: parseNumber(formValues.anticoagulantVolume),
      aggrAcc: convertAggregates(formValues.aggregates), // "A" or "N"
      processDateTime: combineDateTime(formValues.processDate, formValues.processTime),
      suitProdCode: formValues.interimProductCode || null,

      // Suitability status fields
      suitStatusCode: suitStatusCode, // 'Y' = Suitable, 'N' = Not Suitable
      suitStatusReason: suitStatusReason // Reason text (populated when not suitable)
    };

    return payload;
  }

  /**
   * Save Intermediate Process data (Tab 2)
   * Calls PUT /api/v1/pathogen-reduction/intermediate-process
   */
  onSaveIntermediateProcess(): void {
    if (!this.validatedUnitId) {
      this.snackbarService.showError('Please enter a valid Unit ID');
      return;
    }

    // Build the payload
    const payload = this.buildIntermediateProcessPayload();

    this.loading.set(true);

    this.prService.updateIntermediateProcess(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess(`Intermediate Process saved successfully for Unit ID: ${this.validatedUnitId}`);
        },
        error: (error) => {
          this.loading.set(false);
          const errorMessage = error?.error?.message || 'Failed to save Intermediate Process';
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  /**
   * Build intermediate process payload from form values
   * Combines Treatment Date and Treatment Start Time into ISO DateTime
   */
  private buildIntermediateProcessPayload(): UpdateIntermediateProcessRequestDto {
    const formValues = this.intermediateProcessForm.getRawValue();

    // Helper function to combine date and time into local datetime string (NO UTC conversion)
    const combineDateTime = (date: any, time: string | null): string | null => {
      if (!date) return null;

      try {
        const datePart = moment(date).format('YYYY-MM-DD');
        // If time is not provided or empty, use 00:00:00 as default
        const timePart = time && time.trim() ? time : '00:00';
        const combinedDateTime = moment(`${datePart} ${timePart}`, 'YYYY-MM-DD HH:mm');
        // Use format() instead of toISOString() to avoid UTC conversion
        return combinedDateTime.isValid() ? combinedDateTime.format('YYYY-MM-DDTHH:mm:ss') : null;
      } catch (error) {
        return null;
      }
    };

    // Combine Treatment Date + Treatment Start Time
    const treatmentStartTime = combineDateTime(formValues.treatmentDate, formValues.treatmentStartTime);

    // Combine CAD Start Date + CAD Start Time
    const cadStartTime = combineDateTime(formValues.cadStartDate, formValues.cadStartTime);

    // Format treatment date as YYYY-MM-DD only
    const treatmentDateString = formValues.treatmentDate
      ? moment(formValues.treatmentDate).format('YYYY-MM-DD')
      : null;

    const payload: UpdateIntermediateProcessRequestDto = {
      unitId: this.validatedUnitId || '',
      treatmentDate: treatmentDateString,
      treatmentStartTime: treatmentStartTime,
      treatmentTime: formValues.treatmentElapsedTime || null,
      operatorId: formValues.operatorId || null,
      illuminatorMessage: formValues.instrumentMessage || null,
      cadProdCode: formValues.cadProd || null,
      cadStartTime: cadStartTime,
      illuminatorReference: formValues.serialNumber || null,
      illuminationStatus: formValues.status  // 0 = Incomplete, 1 = Complete
    };

    return payload;
  }

  /**
   * Calculate Treatment End Time from Start Time + Elapsed Time
   * @param date Treatment Date
   * @param startTime Treatment Start Time (HH:mm format)
   * @param elapsedTime Treatment Elapsed Time (HH:mm format)
   * @returns ISO DateTime string or null
   */
  private calculateTreatmentEndTime(
    date: any,
    startTime: string | null,
    elapsedTime: string | null
  ): string | null {
    if (!date || !startTime || !elapsedTime) return null;

    try {
      // Parse treatment start time
      const datePart = moment(date).format('YYYY-MM-DD');
      const startDateTime = moment(`${datePart} ${startTime}`, 'YYYY-MM-DD HH:mm');

      if (!startDateTime.isValid()) return null;

      // Parse elapsed time (format: HH:mm or mm:ss)
      const elapsedParts = elapsedTime.split(':');
      if (elapsedParts.length !== 2) return null;

      const hours = parseInt(elapsedParts[0], 10);
      const minutes = parseInt(elapsedParts[1], 10);

      if (isNaN(hours) || isNaN(minutes)) return null;

      // Add elapsed time to start time
      const endDateTime = startDateTime.clone().add(hours, 'hours').add(minutes, 'minutes');

      return endDateTime.isValid() ? endDateTime.toISOString() : null;
    } catch (error) {
      return null;
    }
  }

  onClear(): void {
    // Clear based on selected tab
    if (this.selectedTabIndex === 0) {
      // Verify Suitability tab
      this.verifySuitabilityForm.reset();

      if (this.unitIdField) {
        this.unitIdField.clear();
      }

      // Reset and disable rejection reason field
      const rejectionReasonControl = this.verifySuitabilityForm.get('rejectionReason');
      rejectionReasonControl?.setValue('');
      rejectionReasonControl?.disable();
      rejectionReasonControl?.clearValidators();
      rejectionReasonControl?.updateValueAndValidity();

      this.validatedUnitId = null;
      this.manualUnitIdWithCheckDigit = null;
      this.suitabilityStatus.set(null);
      this.showRejectionReason.set(false);
    } else if (this.selectedTabIndex === 2) {
      // Final Transfer/Storage tab
      this.finalTransferForm.reset();

      if (this.finalUnitIdField) {
        this.finalUnitIdField.clear();
      }

      // Clear final products table data
      this.finalProducts.set([]);
      this.selectedProduct.set(null);
      this.currentChapterId.set('');

      // Clear validated unit ID
      this.validatedUnitId = null;
      this.manualUnitIdWithCheckDigit = null;
    }
  }

  onPrintLabel(): void {
    // For Verify Suitability tab (tab 0) - use product code and collection date from the form
    const productCode = this.verifySuitabilityForm.get('productCode')?.value;
    const collDate = this.verifySuitabilityForm.get('date')?.value;

    if (!productCode) {
      this.snackbarService.showError('Product code is required to print the label');
      return;
    }

    if (!collDate) {
      this.snackbarService.showError('Collection date is required to print the label');
      return;
    }

    if (!this.validatedUnitId) {
      this.snackbarService.showError('Unit ID is required to print the label');
      return;
    }

    this.loading.set(true);

    // Convert Date to ISO string (YYYY-MM-DD format) if needed
    const collDateString = collDate instanceof Date
      ? collDate.toISOString().split('T')[0]
      : collDate;

    const request: ReprintLabelRequestDto = {
      unitId: this.validatedUnitId,
      productCode: productCode,
      collDate: collDateString
    };

    this.prService.reprintLabel(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          const labelData = response.data?.[0];
          if (labelData?.preprintedLabel) {
            this.snackbarService.showSuccess('Product has preprinted label — no printing needed');
          } else {
            const warning = labelData?.timeLimitWarning ? ` | Warning: ${labelData.timeLimitWarning}` : '';
            this.snackbarService.showSuccess(`Label sent to printer${warning}`);
          }
        },
        error: (error) => {
          this.loading.set(false);
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to print label. Please try again.');
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  onExit(): void {
    // If on Intermediate Process (index 1), Final Transfer/Storage (index 2), or Upload Manually (index 3), navigate to Verify Suitability tab
    if (this.selectedTabIndex === 1 || this.selectedTabIndex === 2 || this.selectedTabIndex === 3) {
      this.selectedTabIndex = 0;
    } else {
      // For other tabs, navigate to home or previous page
      this.router.navigate(['/home']);
    }
  }

  // Upload Manually Methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(input.files);
    }
  }

  private handleFiles(fileList: FileList): void {
    const filesArray = Array.from(fileList);

    // Only allow CSV and TXT files
    const validFiles = filesArray.filter(file => {
      const fileName = file.name.toLowerCase();
      const isValid = fileName.endsWith('.csv') || fileName.endsWith('.txt');
      if (!isValid) {
        this.snackbarService.showError(`Invalid file type: ${file.name}. Only CSV and TXT files are allowed.`);
      }
      return isValid;
    });

    // Only allow 1 file at a time - replace existing file
    if (validFiles.length > 0) {
      this.selectedFiles = [validFiles[0]]; // Take only the first file
    }
  }

  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  onUpload(): void {
    // Validate chapter ID specifically
    const chapterId = this.uploadManuallyForm.get('chapterId')?.value;
    if (!chapterId) {
      this.snackbarService.showError('Please select a Chapter ID');
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.snackbarService.showError('Please select a CSV file to upload');
      return;
    }

    const file = this.selectedFiles[0];

    // Validate file type (CSV or TXT)
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
      this.snackbarService.showError('Only CSV and TXT files are supported');
      return;
    }

    this.loading.set(true);

    // Upload file to server
    this.prService.uploadData(file, chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          // Show results
          if (response.errorCount > 0) {
            // Show errors
            const errorList = response.errors.join('\n');
            const message = `Upload completed with errors. Success: ${response.successCount}, Errors: ${response.errorCount}\n\n${errorList}`;
            this.snackbarService.showError(message);
          } else {
            // All records uploaded successfully
            const recordText = response.successCount === 1 ? 'record' : 'records';
            this.snackbarService.showSuccess(`File uploaded successfully. ${response.successCount} ${recordText} processed.`);
          }

          // Clear selected files after upload
          this.selectedFiles = [];

          // Reset form
          this.uploadManuallyForm.get('chapterId')?.setValue('');
        },
        error: (error) => {
          this.loading.set(false);
          const errorMessage = HttpErrorHandler.extractErrorMessage(error, 'Failed to upload file. Please check the file format and try again.');
          this.snackbarService.showError(errorMessage);
        }
      });
  }

  /**
   * Validate numeric input - only allow numbers with max 2 decimal places
   * Used for Product Weight (999.99) and Initial Product Volume (999.99)
   * Range: 0 to 999.99
   * @param event Input event from the field
   */
  onNumericInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Restrict to max 2 decimal places and max 3 digits before decimal (format: 999.99)
    const match = value.match(/^(\d{0,3})(\.\d{0,2})?/);
    let result = match ? match[0] : '';

    // Enforce max value of 999.99
    const numValue = parseFloat(result);
    if (!isNaN(numValue) && numValue > 999.99) {
      result = '999.99';
    }

    if (input.value !== result) {
      input.value = result;
      // Trigger Angular form control update
      const formControlName = input.getAttribute('formControlName');
      if (formControlName) {
        this.verifySuitabilityForm.get(formControlName)?.setValue(result ? parseFloat(result) : null, { emitEvent: true });
      }
    }
  }

  /**
   * Format datetime for display in DD-MMM-YYYY HH:mm format
   * @param value ISO datetime string or datetime-local string
   * @returns Formatted string like "18-APR-2011 04:10"
   */
  formatDisplayDateTime(value: any): string {
    if (!value) return '';

    try {
      const date = moment(value);
      if (!date.isValid()) return '';

      // Format as DD-MMM-YYYY HH:mm (e.g., "18-APR-2011 04:10")
      return date.format('DD-MMM-YYYY HH:mm');
    } catch (error) {
      return '';
    }
  }

  /**
   * Combine date and time into ISO string
   * @param date Date object
   * @param timeStr Time string in HH:MM format
   * @returns ISO datetime string
   */
  private combineDateAndTime(date: Date, timeStr: string): string {
    if (!date || !timeStr) return '';

    // Format as local datetime string WITHOUT timezone conversion (same as Intermediate Process)
    // Backend expects: "YYYY-MM-DDTHH:mm:ss" (no Z suffix, no UTC conversion)
    try {
      const datePart = moment(date).format('YYYY-MM-DD');
      const combinedDateTime = moment(`${datePart} ${timeStr}`, 'YYYY-MM-DD HH:mm');
      // Use format() instead of toISOString() to avoid UTC conversion
      return combinedDateTime.isValid() ? combinedDateTime.format('YYYY-MM-DDTHH:mm:ss') : '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Handle time input with automatic formatting
   * Formats as HH:MM and enforces 24-hour format with valid hours (0-23) and minutes (0-59)
   */
  onProcessTimeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove all non-digit characters except colon
    const digitsOnly = value.replace(/[^\d]/g, '');

    // Format based on number of digits with validation
    if (digitsOnly.length >= 3) {
      let hours = digitsOnly.substring(0, 2);
      let minutes = digitsOnly.substring(2, 4);

      // Validate and cap hours to 23
      const hoursNum = parseInt(hours, 10);
      if (hoursNum > 23) {
        hours = '23';
      }

      // Validate and cap minutes to 59
      const minutesNum = parseInt(minutes, 10);
      if (minutesNum > 59) {
        minutes = '59';
      }

      value = `${hours}:${minutes}`;
    } else if (digitsOnly.length === 2) {
      // Validate hours when only 2 digits
      const hoursNum = parseInt(digitsOnly, 10);
      if (hoursNum > 23) {
        value = '23';
      } else {
        value = digitsOnly;
      }
    } else if (digitsOnly.length === 1) {
      value = digitsOnly;
    } else {
      value = '';
    }

    // Update input value
    if (input.value !== value) {
      input.value = value;
      // Determine which form control to update
      const formControlName = input.getAttribute('formControlName');
      if (formControlName === 'processTime') {
        this.verifySuitabilityForm.get('processTime')?.setValue(value);
      } else if (formControlName === 'treatmentStartTime') {
        this.intermediateProcessForm.get('treatmentStartTime')?.setValue(value);
      } else if (formControlName === 'treatmentElapsedTime') {
        this.intermediateProcessForm.get('treatmentElapsedTime')?.setValue(value);
      } else if (formControlName === 'cadStartTime') {
        this.intermediateProcessForm.get('cadStartTime')?.setValue(value);
      }
    }
  }

  /**
   * Validate time on blur - ensure proper format HH:MM
   */
  onProcessTimeBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if (!value) return;

    // Validate HH:MM format
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timePattern.test(value)) {
      // Try to auto-correct common formats
      const digitsOnly = value.replace(/\D/g, '');

      // Handle 1 or 2 digit hours (e.g., "21" -> "21:00", "9" -> "09:00")
      if (digitsOnly.length === 1 || digitsOnly.length === 2) {
        const hours = parseInt(digitsOnly, 10);
        if (hours >= 0 && hours <= 23) {
          const formatted = `${String(hours).padStart(2, '0')}:00`;
          input.value = formatted;
          // Determine which form control to update
          const formControlName = input.getAttribute('formControlName');
          if (formControlName === 'processTime') {
            this.verifySuitabilityForm.get('processTime')?.setValue(formatted);
          } else if (formControlName === 'treatmentStartTime') {
            this.intermediateProcessForm.get('treatmentStartTime')?.setValue(formatted);
          } else if (formControlName === 'treatmentElapsedTime') {
            this.intermediateProcessForm.get('treatmentElapsedTime')?.setValue(formatted);
          } else if (formControlName === 'cadStartTime') {
            this.intermediateProcessForm.get('cadStartTime')?.setValue(formatted);
          }
          return;
        }
      }

      // Handle 4 digits (e.g., "2130" -> "21:30")
      if (digitsOnly.length === 4) {
        const hours = parseInt(digitsOnly.substring(0, 2), 10);
        const minutes = parseInt(digitsOnly.substring(2, 4), 10);

        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          input.value = formatted;
          // Determine which form control to update
          const formControlName = input.getAttribute('formControlName');
          if (formControlName === 'processTime') {
            this.verifySuitabilityForm.get('processTime')?.setValue(formatted);
          } else if (formControlName === 'treatmentStartTime') {
            this.intermediateProcessForm.get('treatmentStartTime')?.setValue(formatted);
          } else if (formControlName === 'treatmentElapsedTime') {
            this.intermediateProcessForm.get('treatmentElapsedTime')?.setValue(formatted);
          } else if (formControlName === 'cadStartTime') {
            this.intermediateProcessForm.get('cadStartTime')?.setValue(formatted);
          }
          return;
        }
      }
    }

    // Mark as touched to trigger validation
    const formControlName = input.getAttribute('formControlName');
    if (formControlName === 'processTime') {
      this.verifySuitabilityForm.get('processTime')?.markAsTouched();
      this.verifySuitabilityForm.updateValueAndValidity();
    } else if (formControlName === 'treatmentStartTime') {
      this.intermediateProcessForm.get('treatmentStartTime')?.markAsTouched();
    } else if (formControlName === 'treatmentElapsedTime') {
      this.intermediateProcessForm.get('treatmentElapsedTime')?.markAsTouched();
    } else if (formControlName === 'cadStartTime') {
      this.intermediateProcessForm.get('cadStartTime')?.markAsTouched();
    }
  }

  /**
   * Handle time input for Final Transfer CAD End Time - auto-format HH:MM
   */
  onFinalTimeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove all non-digit characters except colon
    const digitsOnly = value.replace(/[^\d]/g, '');

    // Format based on number of digits with validation
    if (digitsOnly.length >= 3) {
      let hours = digitsOnly.substring(0, 2);
      let minutes = digitsOnly.substring(2, 4);

      // Validate and cap hours to 23
      const hoursNum = parseInt(hours, 10);
      if (hoursNum > 23) {
        hours = '23';
      }

      // Validate and cap minutes to 59
      const minutesNum = parseInt(minutes, 10);
      if (minutesNum > 59) {
        minutes = '59';
      }

      value = `${hours}:${minutes}`;
    } else if (digitsOnly.length === 2) {
      // Validate hours when only 2 digits
      const hoursNum = parseInt(digitsOnly, 10);
      if (hoursNum > 23) {
        value = '23';
      } else {
        value = digitsOnly;
      }
    } else if (digitsOnly.length === 1) {
      value = digitsOnly;
    } else {
      value = '';
    }

    // Update input value
    if (input.value !== value) {
      input.value = value;
      this.finalTransferForm.get('cadEndTime2')?.setValue(value);
    }
  }

  /**
   * Validate Final Transfer CAD End Time on blur - ensure proper format HH:MM
   */
  onFinalTimeBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if (!value) return;

    // Validate HH:MM format
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timePattern.test(value)) {
      // Try to auto-correct common formats
      const digitsOnly = value.replace(/\D/g, '');

      // Handle 1 or 2 digit hours (e.g., "21" -> "21:00", "9" -> "09:00")
      if (digitsOnly.length === 1 || digitsOnly.length === 2) {
        const hours = parseInt(digitsOnly, 10);
        if (hours >= 0 && hours <= 23) {
          const formatted = `${String(hours).padStart(2, '0')}:00`;
          input.value = formatted;
          this.finalTransferForm.get('cadEndTime2')?.setValue(formatted);
          return;
        }
      }

      // Handle 4 digits (e.g., "2130" -> "21:30")
      if (digitsOnly.length === 4) {
        const hours = parseInt(digitsOnly.substring(0, 2), 10);
        const minutes = parseInt(digitsOnly.substring(2, 4), 10);

        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          input.value = formatted;
          this.finalTransferForm.get('cadEndTime2')?.setValue(formatted);
          return;
        }
      }
    }

    // Mark as touched to trigger validation
    this.finalTransferForm.get('cadEndTime2')?.markAsTouched();

    // Validate against CAD Start Date and Time
    this.validateCadEndDateTime();
  }

  /**
   * Get minimum date for CAD End Date picker based on CAD Start Time
   * Returns the date portion of the CAD Start Time ISO datetime
   */
  getCadEndMinDate(): Date | null {
    const cadStartTimeIso = this.finalTransferForm.get('cadStartTime')?.value;
    if (!cadStartTimeIso) {
      return null;
    }
    return new Date(cadStartTimeIso);
  }

  /**
   * Validate CAD End Date and Time against CAD Start Date and Time
   * Called when CAD End Date or Time changes
   */
  validateCadEndDateTime(): void {
    // Get CAD Start Time from Final Transfer form (stored as ISO datetime string from API)
    const cadStartTimeIso = this.finalTransferForm.get('cadStartTime')?.value;
    const cadEndDate = this.finalTransferForm.get('cadEndTime')?.value;
    const cadEndTime = this.finalTransferForm.get('cadEndTime2')?.value;

    // Only validate if all fields have values
    if (!cadStartTimeIso || !cadEndDate || !cadEndTime) {
      return;
    }

    // Parse CAD Start DateTime from ISO format (e.g., "2026-06-25T06:30:00")
    const startDateTime = new Date(cadStartTimeIso);

    // Parse CAD End Date and Time
    const endDateTime = new Date(cadEndDate);
    const [endHours, endMinutes] = cadEndTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    // Check if end is before or equal to start
    if (endDateTime <= startDateTime) {
      this.finalTransferForm.get('cadEndTime2')?.setErrors({
        invalidEndTime: 'CAD End Date and Time must be after CAD Start Date and Time'
      });
    } else {
      // Clear the custom error if validation passes
      const currentErrors = this.finalTransferForm.get('cadEndTime2')?.errors;
      if (currentErrors && currentErrors['invalidEndTime']) {
        delete currentErrors['invalidEndTime'];
        const hasOtherErrors = Object.keys(currentErrors).length > 0;
        this.finalTransferForm.get('cadEndTime2')?.setErrors(hasOtherErrors ? currentErrors : null);
      }
    }
  }

  /**
   * Custom validator: Verify Product Code must match Product Code (FMB error 9728)
   */
  private verifyProductCodeValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const formGroup = control.parent;
      if (!formGroup) return null;

      const productCode = formGroup.get('productCode')?.value;
      const verifyCode = control.value;

      if (verifyCode && productCode && verifyCode !== productCode) {
        return { verifyMismatch: 'Verify code must match Product Code exactly' };
      }

      return null;
    };
  }

  /**
   * Custom validator: Anticoagulant Volume must be > 0 if provided (FMB error 0425)
   */
  private anticoagulantVolumeValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (value !== null && value !== undefined && value <= 0) {
        return { anticoagulantTooLow: 'Anticoagulant volume must be greater than 0' };
      }

      return null;
    };
  }

  /**
   * Custom validator: Anticoagulant Volume must be <= parent anticoagulant volume (FMB error 0467)
   */
  private anticoagulantMaxValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const parentAnticoagulant = this.finalTransferForm?.get('anticoagulantVolume')?.value;

      if (value !== null && value !== undefined &&
          parentAnticoagulant !== null && parentAnticoagulant !== undefined) {
        if (value > parentAnticoagulant) {
          return { anticoagulantExceedsParent: `Must be ≤ ${parentAnticoagulant}` };
        }
      }

      return null;
    };
  }

  /**
   * Custom validator: Volume must be <= initial product volume (FMB error 0464)
   */
  private volumeMaxValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const initialVolume = this.finalTransferForm?.get('initialProdVol')?.value;

      if (value !== null && value !== undefined &&
          initialVolume !== null && initialVolume !== undefined) {
        if (value > initialVolume) {
          return { volumeExceedsInitial: `Must be ≤ ${initialVolume}` };
        }
      }

      return null;
    };
  }

  /**
   * Custom validator: Final platelet count must be <= initial platelet count (FMB error 0463)
   */
  private plateletCountMaxValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const initialPltCount = this.finalTransferForm?.get('initPltCount')?.value;

      if (value !== null && value !== undefined &&
          initialPltCount !== null && initialPltCount !== undefined) {
        if (value > initialPltCount) {
          return { plateletExceedsInitial: `Must be ≤ ${initialPltCount}` };
        }
      }

      return null;
    };
  }

  /**
   * Validate integer input - only allow positive integers
   * @param event Input event from the field
   */
  onIntegerInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remove any non-digit characters
    const cleaned = value.replace(/\D/g, '');

    if (value !== cleaned) {
      input.value = cleaned;
      // Trigger Angular form control update
      const formControlName = input.getAttribute('formControlName');
      if (formControlName) {
        const form = this.finalTransferForm || this.intermediateProcessForm || this.verifySuitabilityForm;
        form.get(formControlName)?.setValue(cleaned, { emitEvent: false });
      }
    }
  }

  /**
   * Validate platelet count input - format 9.9 (range 0.0-9.9)
   * Only allows single digit before decimal, single digit after decimal
   * @param event Input event from the field
   */
  onPlateletCountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Restrict to format 9.9 (single digit before decimal, single digit after)
    const match = value.match(/^(\d?)(\.\d?)?/);
    let result = match ? match[0] : '';

    // Enforce max value of 9.9
    const numValue = parseFloat(result);
    if (!isNaN(numValue) && numValue > 9.9) {
      result = '9.9';
    }

    if (input.value !== result) {
      input.value = result;
      // Trigger Angular form control update
      this.verifySuitabilityForm.get('initialPlateletCount')?.setValue(result ? parseFloat(result) : null, { emitEvent: true });
    }
  }
}
