import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, firstValueFrom, takeUntil, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import moment from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { ValidCollectionFacilitiesService } from './services/valid-collection-facilities.service';
import {
  ValidCollectionFacilityDto,
  ContractOption,
  CollectionIdOption,
  StateOption,
  CountryOption,
  AssociationWarningData,
} from './models/valid-collection-facilities.model';
import {
  collIdValidator,
  collNameMaxLengthValidator,
  effectiveDateValidator,
  terminationAfterEffectiveValidator,
  phoneNumberValidator,
  zipCodeValidator,
} from './validators/collection-facility.validators';
import { AssociationWarningDialogComponent } from './dialogs/association-warning-dialog/association-warning-dialog';

@Component({
  selector: 'app-valid-collection-facilities',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    NgxMatSelectSearchModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
  ],
  templateUrl: './valid-collection-facilities.html',
  styleUrls: ['./valid-collection-facilities.scss'],
})
export class ValidCollectionFacilitiesComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `valid-collection-facilities-${ValidCollectionFacilitiesComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly facilityService = inject(ValidCollectionFacilitiesService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal<boolean>(false);
  protected readonly facility = signal<ValidCollectionFacilityDto | null>(null);
  protected readonly submitted = signal<boolean>(false);
  protected readonly saved = signal<boolean>(false);

  protected readonly contracts = signal<ContractOption[]>([]);
  protected readonly collectionIds = signal<CollectionIdOption[]>([]);
  protected readonly states = signal<StateOption[]>([]);
  protected readonly countries = signal<CountryOption[]>([]);

  protected readonly isEmpty = computed(() => !this.showForm() && !this.loading());
  protected readonly isReady = computed(() => this.showForm() && !this.loading());
  protected readonly isInternational = signal<boolean>(false);

  // Searchable dropdown controls
  protected readonly contractSearchCtrl = new FormControl('');
  protected readonly stateSearchCtrl = new FormControl('');
  protected readonly licenceStateSearchCtrl = new FormControl('');
  protected readonly countrySearchCtrl = new FormControl('');
  protected readonly licenceCountrySearchCtrl = new FormControl('');

  private readonly contractSearchText = signal('');
  private readonly collIdSearchText = signal('');
  private readonly stateSearchText = signal('');
  private readonly licenceStateSearchText = signal('');
  private readonly countrySearchText = signal('');
  private readonly licenceCountrySearchText = signal('');

  protected readonly filteredContracts = computed(() => {
    const s = this.contractSearchText().toLowerCase();
    return !s ? this.contracts() : this.contracts().filter(c =>
      c.contractId.toLowerCase().includes(s) || c.contractName.toLowerCase().includes(s));
  });

  protected readonly filteredCollectionIds = computed(() => {
    const s = this.collIdSearchText().toLowerCase();
    return !s ? this.collectionIds() : this.collectionIds().filter(c =>
      c.collId.toLowerCase().includes(s));
  });

  protected readonly filteredStates = computed(() => {
    const s = this.stateSearchText().toLowerCase();
    return !s ? this.states() : this.states().filter(st =>
      st.code.toLowerCase().includes(s) || st.description.toLowerCase().includes(s));
  });

  protected readonly filteredLicenceStates = computed(() => {
    const s = this.licenceStateSearchText().toLowerCase();
    return !s ? this.states() : this.states().filter(st =>
      st.code.toLowerCase().includes(s) || st.description.toLowerCase().includes(s));
  });

  protected readonly filteredCountries = computed(() => {
    const s = this.countrySearchText().toLowerCase();
    return !s ? this.countries() : this.countries().filter(c =>
      c.code.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
  });

  protected readonly filteredLicenceCountries = computed(() => {
    const s = this.licenceCountrySearchText().toLowerCase();
    return !s ? this.countries() : this.countries().filter(c =>
      c.code.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
  });

  isEditMode(): boolean {
    return this.facility() !== null;
  }

  searchForm!: FormGroup;
  detailForm!: FormGroup;

  protected readonly headerConfig = computed<PageHeaderConfig>(() => {
    const data = this.pageHeaderService.pageHeaderData();
    return {
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: data?.title || 'Valid Collection Facilities', link: null },
      ],
      title: data?.title || 'Valid Collection Facilities',
      subtitle: data?.subtitle || 'Define valid collection facility identification number for ISBT contracts.',
      actions: [],
    };
  });

  protected readonly today = computed(() => {
    return this.chapterTimezoneService.isChapterLocalDateAvailable()
      ? this.chapterTimezoneService.getChapterLocalDate()
      : moment().startOf('day');
  });

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initSearchForm();
    this.initDetailForm();
    this.initSearchableDropdowns();
    this.loadDropdownData();
    this.subscribeToChapterChanges();
    this.fetchChapterLocalDate();
  }

  private fetchChapterLocalDate(): void {
    const chapterId = this.headerService.getCurrentChapterId();
    if (chapterId) {
      this.chapterTimezoneService.fetchChapterTimezone(chapterId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.detailForm.get('effDate')?.updateValueAndValidity();
          },
          error: (err) => {
            console.warn('Failed to fetch chapter timezone, using browser local date:', err);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadDropdownData();
        this.fetchChapterLocalDate();
      });
  }

  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      contractId: ['', Validators.required],
      contractType: [{ value: '', disabled: true }],
      collId: ['', [collIdValidator()]],
    });

    this.searchForm.get('contractId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.contractSearchText.set(value || '');
      });
  }

  onContractSelected(contractId: string): void {
    const selectedContract = this.contracts().find((c) => c.contractId === contractId);
    if (selectedContract) {
      this.searchForm.patchValue({
        contractType: selectedContract.contractTypeDesc
          ? `${selectedContract.contractType} - ${selectedContract.contractTypeDesc}`
          : selectedContract.contractType,
      });
      this.loadCollectionIds(contractId);
    } else {
      this.searchForm.patchValue({ contractType: '' });
      this.collectionIds.set([]);
    }
  }

  private initDetailForm(): void {
    this.detailForm = this.fb.group(
      {
        collName: ['', [Validators.required, collNameMaxLengthValidator()]],
        collIdHead: ['', [Validators.required, Validators.maxLength(40)]],

        international: [false],
        collAddress1: ['', [Validators.required, Validators.maxLength(40)]],
        collAddress2: ['', [Validators.maxLength(40)]],
        collAddress3: ['', [Validators.maxLength(40)]],
        city: ['', [Validators.required, Validators.maxLength(75)]],
        state: [''],
        zip: ['', [Validators.required, Validators.maxLength(8), zipCodeValidator()]],
        country: ['', [Validators.required, Validators.maxLength(15)]],
        intPhoneNumber: ['', [Validators.maxLength(15), phoneNumberValidator()]],

        registrationNo: ['', [Validators.required, Validators.maxLength(40)]],
        licenceNo: ['', [Validators.required, Validators.maxLength(40)]],
        licenceAddress1: ['', [Validators.required, Validators.maxLength(40)]],
        licenceAddress2: ['', [Validators.maxLength(40)]],
        licenceAddress3: ['', [Validators.maxLength(40)]],
        licenceCity: ['', [Validators.required, Validators.maxLength(75)]],
        licenceState: [''],
        licenceZip: ['', [Validators.required, Validators.maxLength(8), zipCodeValidator()]],
        licenceCountry: ['', [Validators.required, Validators.maxLength(15)]],
        phoneNo: ['', [Validators.maxLength(13), phoneNumberValidator()]],
        faxNo: ['', [Validators.maxLength(15), phoneNumberValidator()]],
        effDate: [null, [effectiveDateValidator(this.chapterTimezoneService, () => this.isEditMode())]],
        termDate: [null],
      },
      {
        validators: terminationAfterEffectiveValidator(),
      }
    );

    this.detailForm.get('international')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((isInternational) => {
        this.isInternational.set(isInternational);
        this.updateStateValidators(isInternational);
      });

    this.updateStateValidators(false);

    this.detailForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.detailForm.get('termDate')?.updateValueAndValidity();
      });

    this.detailForm.get('licenceNo')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged(),
        filter(value => value && value.length >= 3),
        filter(() => !this.saved())
      )
      .subscribe((licenceNo) => {
        this.autoPopulateLicenceAddress(licenceNo);
      });
  }

  private initSearchableDropdowns(): void {
    this.searchForm.get('collId')?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.collIdSearchText.set(v || ''));
    this.stateSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.stateSearchText.set(v || ''));
    this.licenceStateSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.licenceStateSearchText.set(v || ''));
    this.countrySearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.countrySearchText.set(v || ''));
    this.licenceCountrySearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.licenceCountrySearchText.set(v || ''));
  }

  private autoPopulateLicenceAddress(licenceNo: string): void {
    const chapterId = this.headerService.getCurrentChapterId();
    if (!chapterId) return;

    this.facilityService.getByLicenceNo(chapterId, licenceNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facility) => {
          if (facility) {
            this.detailForm.patchValue({
              licenceAddress1: facility.licenceAddress1,
              licenceAddress2: facility.licenceAddress2,
              licenceAddress3: facility.licenceAddress3,
              licenceCity: facility.licenceCity,
              licenceState: facility.licenceState,
              licenceZip: facility.licenceZip,
              licenceCountry: facility.licenceCountry,
            });
            this.snackbarService.showSuccess('License address auto-populated from existing record.');
          }
        },
        error: (err) => {
          console.warn('Failed to auto-populate license address:', err);
        }
      });
  }

  private loadDropdownData(): void {
    const chapterId = this.headerService.getCurrentChapterId();

    if (!chapterId) {
      console.warn('No chapter ID available');
      return;
    }

    this.facilityService.getContractOptions(chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => this.contracts.set(contracts),
        error: (err) => {
          console.error('Error loading contracts:', err);
          this.contracts.set([]);
        }
      });

    this.facilityService.getStateOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => this.states.set(states),
        error: (err) => {
          console.error('Error loading states:', err);
          this.states.set([]);
        }
      });

    this.facilityService.getCountryOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (countries) => this.countries.set(countries),
        error: (err) => {
          console.error('Error loading countries:', err);
          this.countries.set([]);
        }
      });
  }

  private loadCollectionIds(contractId: string): void {
    const chapterId = this.headerService.getCurrentChapterId();

    if (!chapterId) {
      return;
    }

    this.facilityService
      .getCollectionIdOptions(chapterId, contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facilities) => {
          const today = this.today();
          const options: CollectionIdOption[] = facilities
            .filter(f => {
              const eff = moment(f.effDate);
              const term = f.termDate ? moment(f.termDate) : null;
              return eff.isSameOrBefore(today) && (!term || term.isSameOrAfter(today));
            })
            .map((f) => ({
              collId: f.collId,
              collName: f.collName,
            }));
          this.collectionIds.set(options);
        },
        error: (err) => {
          console.error('Error loading collection IDs:', err);
          this.collectionIds.set([]);
        },
      });
  }

  async onRetrieve(): Promise<void> {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const chapterId = this.headerService.getCurrentChapterId();
    const contractId = this.searchForm.get('contractId')?.value;
    const collId = this.searchForm.get('collId')?.value;

    if (!chapterId || !contractId || !collId) {
      this.snackbarService.showError('Please select Contract ID and Collection ID.');
      return;
    }

    if (!this.saved()) {
      const shouldProceed = await this.checkAssociations(chapterId, collId, contractId);
      if (!shouldProceed) {
        this.searchForm.get('collId')?.reset();
        return;
      }
    }

    this.loading.set(true);
    this.error.set(null);

    this.facilityService
      .getValidCollectionFacilityById(chapterId, contractId, collId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.facility.set(data);
          this.populateDetailForm(data);
          this.showForm.set(true);
          this.loading.set(false);
          this.saved.set(false);
        },
        error: (err) => {
          if (err.status === 404) {
            this.facility.set(null);
            this.detailForm.reset();
            this.detailForm.patchValue({
              effDate: this.today().toDate(),
              international: false,
            });
            this.showForm.set(true);
          } else {
            console.error('Error retrieving facility:', err);
            this.error.set(err.error?.message || 'Failed to retrieve collection facility.');
            this.snackbarService.showError(this.error()!);
            this.showForm.set(false);
          }
          this.loading.set(false);
        },
      });
  }

  private populateDetailForm(data: ValidCollectionFacilityDto): void {
    const isInternational = data.intFlag === 'Y';

    this.detailForm.patchValue({
      collName: data.collName,
      collIdHead: data.collIdHead,
      international: isInternational,
      collAddress1: data.collAddress1,
      collAddress2: data.collAddress2,
      collAddress3: data.collAddress3,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country,
      intPhoneNumber: data.intPhoneNumber,
      registrationNo: data.registrationNo,
      licenceNo: data.licenceNo,
      licenceAddress1: data.licenceAddress1,
      licenceAddress2: data.licenceAddress2,
      licenceAddress3: data.licenceAddress3,
      licenceCity: data.licenceCity,
      licenceState: data.licenceState,
      licenceZip: data.licenceZip,
      licenceCountry: data.licenceCountry,
      phoneNo: data.phoneNo,
      faxNo: data.faxNo,
      effDate: data.effDate ? moment(data.effDate).toDate() : null,
      termDate: data.termDate ? moment(data.termDate).toDate() : null,
    });

    this.isInternational.set(isInternational);
    this.updateStateValidators(isInternational);
  }

  private updateStateValidators(isInternational: boolean): void {
    const stateControl = this.detailForm.get('state');
    const licenceStateControl = this.detailForm.get('licenceState');

    if (isInternational) {
      stateControl?.clearValidators();
      licenceStateControl?.clearValidators();
    } else {
      stateControl?.setValidators([Validators.required]);
      licenceStateControl?.clearValidators();
    }

    stateControl?.updateValueAndValidity();
    licenceStateControl?.updateValueAndValidity();
  }

  async onSave(): Promise<void> {
    this.submitted.set(true);

    if (this.detailForm.invalid) {
      const firstInvalid = document.querySelector('.ng-invalid[formControlName]');
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
      }
      this.snackbarService.showError('Please correct the errors in the form.');
      return;
    }

    const chapterId = this.headerService.getCurrentChapterId();
    const contractId = this.searchForm.get('contractId')?.value;
    const collId = this.searchForm.get('collId')?.value;

    if (!chapterId || !contractId || !collId) {
      this.snackbarService.showError('Missing required identifiers.');
      return;
    }

    this.loading.set(true);

    const formData = this.buildRequestPayload(chapterId, contractId, collId);
    const isExisting = this.facility() !== null;

    const saveOperation = isExisting
      ? this.facilityService.updateValidCollectionFacility(chapterId, contractId, collId, formData)
      : this.facilityService.createValidCollectionFacility(formData);

    saveOperation.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackbarService.showSuccess(`Collection details for ${collId} has been saved.`);
        this.loading.set(false);
        this.submitted.set(false);
        this.saved.set(true);
        this.onRetrieve();
      },
      error: (err) => {
        console.error('Error saving facility:', err);
        const errorMsg = err.error?.errorResponse?.error || err.error?.message || 'Failed to save collection facility.';
        this.snackbarService.showError(errorMsg);
        this.loading.set(false);
      },
    });
  }

  private async checkAssociations(
    chapterId: string,
    collId: string,
    currentContractId: string
  ): Promise<boolean> {
    try {
      const associations = await firstValueFrom(
        this.facilityService.checkCollectionIdAssociations(chapterId, collId, currentContractId)
      );

      if (associations && associations.length > 0) {
        const contractsList = this.contracts();
        const dialogData: AssociationWarningData = {
          collId,
          associations: associations.map((a) => ({
            contractId: a.contractId,
            companyName: contractsList.find(c => c.contractId === a.contractId)?.contractName || 'Unknown',
          })),
        };

        const dialogRef = this.dialog.open(AssociationWarningDialogComponent, {
          width: '600px',
          disableClose: true,
          data: dialogData,
        });

        const result = await firstValueFrom(dialogRef.afterClosed());
        return result?.assigned === true;
      }

      return true;
    } catch (err) {
      console.error('Error checking associations:', err);
      return true;
    }
  }

  private buildRequestPayload(chapterId: string, contractId: string, collId: string): any {
    const formValue = this.detailForm.value;

    return {
      chapterId,
      contractId,
      collId,
      collName: formValue.collName,
      collIdHead: formValue.collIdHead || null,
      intFlag: formValue.international ? 'Y' : 'N',
      collAddress1: formValue.collAddress1 || null,
      collAddress2: formValue.collAddress2 || null,
      collAddress3: formValue.collAddress3 || null,
      city: formValue.city,
      state: formValue.state || null,
      zip: formValue.zip || null,
      country: formValue.country || null,
      intPhoneNumber: formValue.intPhoneNumber || null,
      registrationNo: formValue.registrationNo || null,
      licenceNo: formValue.licenceNo || null,
      licenceAddress1: formValue.licenceAddress1 || null,
      licenceAddress2: formValue.licenceAddress2 || null,
      licenceAddress3: formValue.licenceAddress3 || null,
      licenceCity: formValue.licenceCity || null,
      licenceState: formValue.licenceState || null,
      licenceZip: formValue.licenceZip || null,
      licenceCountry: formValue.licenceCountry || null,
      phoneNo: formValue.phoneNo || null,
      faxNo: formValue.faxNo || null,
      effDate: formValue.effDate ? moment(formValue.effDate).format('YYYY-MM-DD') : null,
      termDate: formValue.termDate ? moment(formValue.termDate).format('YYYY-MM-DD') : null,
    };
  }

  onCancel(): void {
    this.showForm.set(false);
    this.detailForm.reset();
    this.submitted.set(false);
    this.saved.set(false);
  }

  clearAll(): void {
    this.searchForm.reset();
    this.detailForm.reset();
    this.showForm.set(false);
    this.facility.set(null);
    this.submitted.set(false);
    this.saved.set(false);
    this.error.set(null);
    this.collectionIds.set([]);
  }

  get sf() {
    return this.searchForm.controls;
  }

  get df() {
    return this.detailForm.controls;
  }
}
