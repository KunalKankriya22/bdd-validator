import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, catchError, of, switchMap, debounceTime, finalize, tap, EMPTY } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { InternationalAddressDialogComponent } from '@shared/components/international-address-dialog/international-address-dialog.component';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { formatTableDate } from '@shared/utils/date-format.util';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { InternationalAddressDialogData } from '@shared/models/international-address.model';
import { NotificationService } from '@shared/services/notification.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DonorEligibilityPanel } from '../../donor-eligibility/donor-eligibility-panel';
import { DonorEligibilityInput } from '../../donor-eligibility/models/donor-eligibility.model';
import { FindDonorDialog } from '@shared/components/find-donor/find-donor';
import { FindDonorDialogResult } from '@shared/components/find-donor/find-donor.model';
import { AlternateDemographicsDialogComponent } from '@shared/components/alternate-demographics-dialog/alternate-demographics-dialog.component';
import { AlternateDemographicsDialogData } from '@shared/models/alternate-demographics.model';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { DonationDetailsDialogComponent } from '../../donor-profile/donation-details/donation-details-dialog/donation-details-dialog';
import { DonationDetailsData } from '../../donor-profile/donation-details/models/donation-details.model';
import { EmployerIntlAddressDialog, EmployerIntlAddressDialogData } from './dialogs/employer-intl-address-dialog';
import { EnterCommentsDialog } from './dialogs/enter-comments-dialog';
import { PrintCardDialog } from './dialogs/print-card-dialog';
import { YtdLossDialog } from './dialogs/ytd-loss-dialog';
import { LookupAndPrintDonorCardService } from './services/lookup-and-print-donor-card.service';
import { DonorDetailsItem, DonorAttributeItem, PrintCardDialogData, YtdLossDialogData, DonationTypeLovItem, ProcedureCodeLovItem, AlternateIdTypeLovItem, CityLovItem, CityStateLovItem, SponsorLovItem, EthnicGroupLovItem, HeightLovItem, PrinterItem } from './models/lookup-donor-card.model';

@Component({
  selector: 'app-lookup-and-print-donor-card',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    DataTable,
    UnitIdFieldComponent,
  ],
  templateUrl: './lookup-and-print-donor-card.html',
  styleUrls: ['./lookup-and-print-donor-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LookupAndPrintDonorCardComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `lookup-print-donor-card-${LookupAndPrintDonorCardComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  private readonly dialog = inject(MatDialog);
  private readonly donorCardService = inject(LookupAndPrintDonorCardService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  @ViewChild('scanIdField') scanIdField!: UnitIdFieldComponent;

  donorDetails = signal<DonorDetailsItem | null>(null);
  isLoading = signal(false);
  donorImageUrl = signal<string | null>(null);
  driveId = signal<string>('');
  driveName = signal<string>('');
  driveDate = signal<string>('');
  sponsorName = signal<string>('');
  isCardPrinted = signal(false);
  cachedPrinters = signal<PrinterItem[]>([]);
  eligibilityText = signal<string>('—');
  eligStatus = signal<string>('');
  isCheckingEligibility = signal(false);
  hasDonationType = signal(false);
  hasProcedureCode = signal(false);
  hasIdVerified = signal(false);
  hasAltId = signal(false);
  hasAltType = signal(false);
  weightValid = signal(true);
  private pendingProcedureCode = signal<string | null>(null);
  private pendingProcedureCodeDesc = signal<string | null>(null);

  readonly selectPanelLoadingValue = '__loading__';
  readonly selectPanelEmptyValue = '__empty__';

  donationTypeOptions = signal<DonationTypeLovItem[]>([]);
  procedureCodeOptions = signal<ProcedureCodeLovItem[]>([]);
  isLoadingDonationTypes = signal(false);
  isLoadingProcedureCodes = signal(false);
  isLoadingCities = signal(false);
  isLoadingZips = signal(false);
  isLoadingEmployerCities = signal(false);
  isLoadingEmployerZips = signal(false);
  isLoadingAlternateTypes = signal(false);
  isLoadingEthnicGroups = signal(false);
  isLoadingSponsors = signal(false);

  selectedDonationType = new FormControl<DonationTypeLovItem | null>(null, Validators.required);
  selectedProcedureCode = new FormControl<ProcedureCodeLovItem | null>({ value: null, disabled: true }, Validators.required);
  donationTypeSearchCtrl = new FormControl('');
  procedureCodeSearchCtrl = new FormControl('');
  private donTypeSearchQuery = signal('');
  private procCodeSearchQuery = signal('');

  // Editable fields — Donor Information
  middleNameCtrl = new FormControl('');
  suffixCtrl = new FormControl('');
  nickNameCtrl = new FormControl('');
  selectedHeight = new FormControl<HeightLovItem | null>(null);
  heightSearchCtrl = new FormControl('');
  private heightSearchQuery = signal('');
  weightCtrl = new FormControl('', [Validators.min(1), Validators.pattern(/^-?\d+$/)]);
  alternateIdCtrl = new FormControl('');
  selectedAlternateType = new FormControl<AlternateIdTypeLovItem | null>({ value: null, disabled: true });
  alternateTypeSearchCtrl = new FormControl('');
  private altTypeSearchQuery = signal('');

  // Editable fields — Address Information
  homeAddressCtrl = new FormControl('');
  apartmentNoCtrl = new FormControl('');
  selectedCity = new FormControl<CityLovItem | null>(null);
  citySearchCtrl = new FormControl('');
  private citySearchQuery = signal('');
  stateCtrl = new FormControl('');
  selectedZip = new FormControl<CityStateLovItem | null>(null);
  zipSearchCtrl = new FormControl('');
  private zipSearchQuery = signal('');

  filteredZipOptions = computed(() => {
    const q = this.zipSearchQuery().toLowerCase();
    const opts = this.zipOptions();
    return q ? opts.filter(o => o.zip.toLowerCase().includes(q)) : opts;
  });

  // Editable fields — Contact Information
  homePhoneCtrl = new FormControl('');
  workPhoneCtrl = new FormControl('');
  emailCtrl = new FormControl('');

  // Editable fields — Employer/School Information
  employerNameCtrl = new FormControl('');
  selectedEmployerCity = new FormControl<CityStateLovItem | null>(null);
  employerCitySearchCtrl = new FormControl('');
  private empCitySearchQuery = signal('');
  employerStateCtrl = new FormControl('');
  selectedEmployerZip = new FormControl<CityStateLovItem | null>(null);
  employerZipSearchCtrl = new FormControl('');
  private empZipSearchQuery = signal('');
  selectedSponsor = new FormControl<SponsorLovItem | null>(null);
  sponsorSearchCtrl = new FormControl('');
  private sponsorSearchQuery = signal('');
  altSponsorNameCtrl = new FormControl('');

  // Editable fields — Ethnicity
  selectedEthnicity = new FormControl<EthnicGroupLovItem | null>(null);
  ethnicitySearchCtrl = new FormControl('');
  private ethnicitySearchQuery = signal('');

  // Editable fields — Donation Information
  idVerifiedCtrl = new FormControl({ value: false, disabled: true });

  // LOV options
  alternateTypeOptions = signal<AlternateIdTypeLovItem[]>([]);
  ethnicGroupOptions = signal<EthnicGroupLovItem[]>([]);
  allCityOptions = signal<CityLovItem[]>([]);
  cityOptions = signal<CityStateLovItem[]>([]);
  zipOptions = signal<CityStateLovItem[]>([]);
  employerCityOptions = signal<CityStateLovItem[]>([]);
  employerZipOptions = signal<CityStateLovItem[]>([]);
  sponsorOptions = signal<SponsorLovItem[]>([]);

  heightOptions = signal<HeightLovItem[]>([]);
  isLoadingHeights = signal(false);

  filteredHeightOptions = computed(() => {
    const q = this.heightSearchQuery().toLowerCase();
    const opts = this.heightOptions();
    return q ? opts.filter(h => h.description.toLowerCase().includes(q) || h.code.toLowerCase().includes(q)) : opts;
  });

  filteredAlternateTypes = computed(() => {
    const q = this.altTypeSearchQuery().toLowerCase();
    const opts = this.alternateTypeOptions();
    return q ? opts.filter(o =>
      o.description.toLowerCase().includes(q) || o.code.toLowerCase().includes(q)
    ) : opts;
  });

  filteredSponsors = computed(() => {
    const q = this.sponsorSearchQuery().toLowerCase();
    const opts = this.sponsorOptions();
    return q ? opts.filter(o =>
      o.name.toLowerCase().includes(q) || o.sponsorId.toLowerCase().includes(q)
    ) : opts;
  });

  compareAlternateType = (a: AlternateIdTypeLovItem | null, b: AlternateIdTypeLovItem | null): boolean =>
    !!a && !!b && a.code === b.code;

  compareCity = (a: CityLovItem | null, b: CityLovItem | null): boolean =>
    !!a && !!b && a.city === b.city && a.state === b.state;

  compareCityState = (a: CityStateLovItem | null, b: CityStateLovItem | null): boolean =>
    !!a && !!b && a.city === b.city && a.state === b.state && a.zip === b.zip;

  filteredCityOptions = computed(() => {
    const q = this.citySearchQuery().toLowerCase();
    const opts = this.allCityOptions();
    return q ? opts.filter(o =>
      o.city.toLowerCase().includes(q) || o.state.toLowerCase().includes(q)
    ) : opts;
  });

  compareSponsor = (a: SponsorLovItem | null, b: SponsorLovItem | null): boolean =>
    !!a && !!b && a.sponsorId === b.sponsorId;

  compareEthnicGroup = (a: EthnicGroupLovItem | null, b: EthnicGroupLovItem | null): boolean =>
    !!a && !!b && a.code === b.code;

  compareHeight = (a: HeightLovItem | null, b: HeightLovItem | null): boolean =>
    !!a && !!b && a.code === b.code;

  filteredEthnicGroups = computed(() => {
    const q = this.ethnicitySearchQuery().toLowerCase();
    const opts = this.ethnicGroupOptions();
    return q ? opts.filter(o =>
      o.description.toLowerCase().includes(q) || o.code.toLowerCase().includes(q)
    ) : opts;
  });

  filteredDonationTypes = computed(() => {
    const q = this.donTypeSearchQuery().toLowerCase();
    const opts = this.donationTypeOptions();
    return q ? opts.filter(o =>
      o.description.toLowerCase().includes(q) || o.donationType.toLowerCase().includes(q)
    ) : opts;
  });

  filteredProcedureCodes = computed(() => {
    const q = this.procCodeSearchQuery().toLowerCase();
    const opts = this.procedureCodeOptions();
    return q ? opts.filter(o =>
      o.description.toLowerCase().includes(q) || o.procedureCode.toLowerCase().includes(q)
    ) : opts;
  });

  compareDonationType = (a: DonationTypeLovItem | null, b: DonationTypeLovItem | null): boolean =>
    !!a && !!b && a.donationType === b.donationType;

  compareProcedureCode = (a: ProcedureCodeLovItem | null, b: ProcedureCodeLovItem | null): boolean =>
    !!a && !!b && a.procedureCode === b.procedureCode;

  donorInfo = computed(() => {
    const d = this.donorDetails();
    if (!d) return null;
    return {
      donorName: `${d.lastName} ${d.firstName}`.trim(),
      driveId: this.driveId(),
      driveName: this.driveName(),
      driveDate: formatTableDate(this.driveDate()),
      dateOfBirth: formatTableDate(d.dateOfBirth),
      sex: d.gender || '—',
      abo: d.bloodType || '—',
      middleName: d.middleName || '—',
      suffix: d.lastNameSuffix || '—',
      nickName: d.alias || '—',
      height: d.height || '—',
      weight: d.donorWeight != null ? String(d.donorWeight) : '—',
      ethnicity: d.ethnicGroupDesc || d.ethnicGroup || '—',
      alternateId: d.alternateId || '—',
      alternateType: d.alternateIdTypeDesc || d.alternateIdType || '—',
    };
  });

  addressInfo = computed(() => {
    const addr = this.donorDetails()?.address;
    if (!addr) return null;
    return {
      homeAddress: addr.streetName || '—',
      apartmentNo: addr.suiteApt || '—',
      city: addr.city || '—',
      state: addr.state || '—',
      zip: addr.zip || '—',
    };
  });

  contactInfo = computed(() => {
    const addr = this.donorDetails()?.address;
    if (!addr) return null;
    const formatPhone = (area: string, phone: string) =>
      area && phone ? `(${area}) ${phone}` : phone || '';
    return {
      homePhone: formatPhone(addr.homeAreaCode, addr.homePhoneNo),
      workPhone: formatPhone(addr.dayAreaCode, addr.dayPhoneNo),
      email: addr.email || '',
    };
  });

  donorStatistics = computed(() => {
    const d = this.donorDetails();
    if (!d) return null;
    const lifeDon = d.lifeDonations ?? 0;
    const lifeCr = d.lifeCredit ?? 0;
    const ytdDon = d.ytdDonations ?? 0;
    const ytdCr = d.ytdCredit ?? 0;
    const sinceYear = d.donorSince ? this.calcYearsSince(d.donorSince) : '';
    return {
      lifeDonationsCR: `${lifeDon}/${lifeCr}`,
      ytdDonationsCR: `${ytdDon}/${ytdCr}`,
      lifetimeGallon: String(d.lifetimeGallon ?? 0),
      unitsRequiredNext: String(d.writesRequiredNext ?? 0),
      donorSince: formatTableDate(d.donorSince),
      donorSinceLabel: sinceYear ? `(${sinceYear})` : '',
    };
  });

  gallonImageUrl = computed(() => {
    const d = this.donorDetails();
    if (!d || (d.lifetimeGallon ?? 0) < 1 || !d.gallonImageFile) return null;
    const name = d.gallonImageFile.replace(/\.bmp$/i, '.png');
    return `/images/${name}`;
  });

  lastDonationInfo = computed(() => {
    const ld = this.donorDetails()?.lastDonation;
    if (!ld) return null;
    return {
      unitId: ld.lastUnitId || '—',
      date: formatTableDate(ld.lastDonDate),
      donation: ld.lastDonType || '—',
      procedure: ld.lastProcCode || '—',
      postCount: ld.postCount != null ? String(ld.postCount) : '—',
    };
  });

  employerInfo = computed(() => {
    const emp = this.donorDetails()?.employer;
    const cd = this.donorDetails()?.currentDonation;
    return {
      employerSchoolName: emp?.employerName || '—',
      city: emp?.city || '—',
      state: emp?.state || '—',
      zip: emp?.zip || '—',
      alternateSponsorCode: cd?.creditSponsor || '—',
      alternateSponsorName: cd?.creditSponsorName || '—',
    };
  });

  donationInfo = computed(() => {
    const cd = this.donorDetails()?.currentDonation;
    const d = this.donorDetails();
    return {
      idVerified: cd?.idVerified === 'Y' ? 'Yes' : cd?.idVerified === 'N' ? 'No' : '—',
      eligibility: d?.allowedToDonatFlg === 'Y' ? 'Eligible' : d?.allowedToDonatFlg === 'N' ? 'Not Eligible' : '—',
    };
  });

  canPrint = computed(() => {
    const altIdValid = !this.hasAltId() || this.hasAltType();
    return !!this.donorDetails() && this.hasProcedureCode() && this.hasIdVerified() && altIdValid && this.weightValid();
  });

  printButtonLabel = computed(() => this.isCardPrinted() ? 'REPRINT' : 'PRINT CARD');

  attributes = computed<DonorAttributeItem[]>(() => this.donorDetails()?.attributes ?? []);

  attributeTableConfig: DataTableConfig<DonorAttributeItem> = {
    columns: [
      { key: 'code', header: 'Code', sortable: false, width: '84px' },
      { key: 'attrType', header: 'Type', sortable: false, width: '85px' },
      { key: 'description', header: 'Description', sortable: false },
    ],
    showPagination: false,
    stickyHeader: false,
    emptyMessage: 'No attributes available',
    showTableOnEmpty: true,
  };

  constructor(
    private pageHeaderService: PageHeaderService,
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    this.donationTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.donTypeSearchQuery.set(v ?? ''));
    this.procedureCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.procCodeSearchQuery.set(v ?? ''));
    this.citySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.citySearchQuery.set(v ?? ''));
    this.heightSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.heightSearchQuery.set(v ?? ''));
    this.zipSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.zipSearchQuery.set(v ?? ''));
    this.alternateTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.altTypeSearchQuery.set(v ?? ''));

    this.weightCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.weightValid.set(!this.weightCtrl.value || this.weightCtrl.valid));

    this.alternateIdCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const hasId = !!(val && val.trim());
        this.hasAltId.set(hasId);
        if (hasId) {
          this.selectedAlternateType.addValidators(Validators.required);
          this.selectedAlternateType.enable({ emitEvent: false });
        } else {
          this.selectedAlternateType.removeValidators(Validators.required);
          this.selectedAlternateType.reset(null, { emitEvent: false });
          this.selectedAlternateType.disable({ emitEvent: false });
          this.hasAltType.set(false);
        }
        this.selectedAlternateType.updateValueAndValidity({ emitEvent: false });
      });

    this.selectedAlternateType.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.hasAltType.set(!!val));

    this.sponsorSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.sponsorSearchQuery.set(v ?? ''));
    this.ethnicitySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.ethnicitySearchQuery.set(v ?? ''));

    this.selectedDonationType.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        tap(v => {
          this.hasDonationType.set(!!v);
          // Always reset procedure code and downstream controls on donation type change
          this.selectedProcedureCode.setValue(null, { emitEvent: false });
          this.selectedProcedureCode.disable({ emitEvent: false });
          this.hasProcedureCode.set(false);
          this.idVerifiedCtrl.setValue(false, { emitEvent: false });
          this.idVerifiedCtrl.disable({ emitEvent: false });
          this.hasIdVerified.set(false);
          this.eligibilityText.set('—');
          this.procedureCodeOptions.set([]);
          this.procedureCodeSearchCtrl.setValue('', { emitEvent: false });
          this.isLoadingProcedureCodes.set(!!v);
        }),
        debounceTime(150),
        switchMap(donationType => {
          if (!donationType?.donationType) {
            this.isLoadingProcedureCodes.set(false);
            return EMPTY;
          }
          const donor = this.donorDetails();
          const donorId = donor?.donorId ?? '';
          const donorWeight = this.weightCtrl.value ? +this.weightCtrl.value : (donor?.donorWeight || null);
          return this.donorCardService.getProcedureCodesLov(donationType.donationType, donorId, donorWeight).pipe(
            catchError(() => of([])),
            finalize(() => this.isLoadingProcedureCodes.set(false))
          );
        })
      )
      .subscribe(items => {
        this.procedureCodeOptions.set(items);
        // Enable procedure code dropdown once API responds (even if empty)
        this.selectedProcedureCode.enable({ emitEvent: false });
        const pending = this.pendingProcedureCode();
        if (pending) {
          const match = items.find(i => i.procedureCode === pending);
          if (match) {
            this.selectedProcedureCode.setValue(match, { emitEvent: false });
          } else {
            // LOV empty (hold/deferral) — restore saved proc directly and add to options so mat-select renders the text
            const fallback: ProcedureCodeLovItem = { procedureCode: pending, description: this.pendingProcedureCodeDesc() ?? '' };
            this.procedureCodeOptions.set([fallback]);
            this.selectedProcedureCode.setValue(fallback, { emitEvent: false });
          }
          this.hasProcedureCode.set(true);
          this.idVerifiedCtrl.enable({ emitEvent: false });
          this.pendingProcedureCode.set(null);
          this.pendingProcedureCodeDesc.set(null);
        }
        this.cdr.markForCheck();
      });
    this.selectedProcedureCode.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.hasProcedureCode.set(!!v);
        if (!v) {
          this.idVerifiedCtrl.setValue(false, { emitEvent: false });
          this.idVerifiedCtrl.disable({ emitEvent: false });
          this.hasIdVerified.set(false);
          this.eligibilityText.set('—');
        } else {
          this.idVerifiedCtrl.enable({ emitEvent: false });
          if (this.selectedDonationType.value) {
            this.checkEligibility();
          }
        }
        this.cdr.markForCheck();
      });
    this.idVerifiedCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.hasIdVerified.set(!!v);
        if (v) {
          this.checkEligibility();
        } else {
          this.eligibilityText.set('—');
        }
      });

    const driveContextRaw = sessionStorage.getItem('driveContext');

    if (driveContextRaw) {
      const driveContext = JSON.parse(driveContextRaw);
      this.driveId.set(driveContext.driveId || '');
      this.driveName.set(driveContext.sponsorName || '');
      this.driveDate.set(driveContext.driveDate || '');
      this.sponsorName.set(driveContext.sponsorName || '');
      this.openFindDonor();
    } else {
      this.router.navigate(
        ['/donor-functions/recruitment/recruitment-general-functions/set-drive-date-and-id'],
        { queryParams: { returnUrl: '/donor-functions/general-queries-and-functions/lookup-and-print-donor-card' } }
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onChange(): void {
    this.resetDonorState();
    this.openFindDonor();
  }

  private resetDonorState(): void {
    this.donorDetails.set(null);
    this.donorImageUrl.set(null);
    this.isCardPrinted.set(false);
    this.eligibilityText.set('—');
    this.eligStatus.set('');

    this.selectedDonationType.setValue(null, { emitEvent: false });
    this.selectedProcedureCode.setValue(null, { emitEvent: false });
    this.selectedProcedureCode.disable({ emitEvent: false });
    this.idVerifiedCtrl.setValue(false, { emitEvent: false });
    this.idVerifiedCtrl.disable({ emitEvent: false });
    this.hasDonationType.set(false);
    this.hasProcedureCode.set(false);
    this.hasIdVerified.set(false);
    this.hasAltId.set(false);
    this.hasAltType.set(false);
    this.weightValid.set(true);
    this.donationTypeOptions.set([]);
    this.procedureCodeOptions.set([]);
    this.pendingProcedureCode.set(null);
    this.pendingProcedureCodeDesc.set(null);
    this.isCheckingEligibility.set(false);
    this.isLoadingProcedureCodes.set(false);
    this.isLoadingDonationTypes.set(false);
    this.donationTypeSearchCtrl.setValue('', { emitEvent: false });
    this.procedureCodeSearchCtrl.setValue('', { emitEvent: false });

    this.middleNameCtrl.reset('', { emitEvent: false });
    this.suffixCtrl.reset('', { emitEvent: false });
    this.nickNameCtrl.reset('', { emitEvent: false });
    this.selectedHeight.reset(null, { emitEvent: false });
    this.weightCtrl.reset('', { emitEvent: false });
    this.alternateIdCtrl.reset('', { emitEvent: false });
    this.selectedAlternateType.reset(null, { emitEvent: false });
    this.selectedAlternateType.disable({ emitEvent: false });

    this.homeAddressCtrl.reset('', { emitEvent: false });
    this.apartmentNoCtrl.reset('', { emitEvent: false });
    this.selectedCity.reset(null, { emitEvent: false });
    this.stateCtrl.reset('', { emitEvent: false });
    this.selectedZip.reset(null, { emitEvent: false });

    this.homePhoneCtrl.reset('', { emitEvent: false });
    this.workPhoneCtrl.reset('', { emitEvent: false });
    this.emailCtrl.reset('', { emitEvent: false });

    this.employerNameCtrl.reset('', { emitEvent: false });
    this.selectedEmployerCity.reset(null, { emitEvent: false });
    this.employerStateCtrl.reset('', { emitEvent: false });
    this.selectedEmployerZip.reset(null, { emitEvent: false });
    this.selectedSponsor.reset(null, { emitEvent: false });
    this.altSponsorNameCtrl.reset('', { emitEvent: false });

    this.selectedEthnicity.reset(null, { emitEvent: false });

    if (this.scanIdField) {
      this.scanIdField.prefill('');
    }

    this.cdr.markForCheck();
  }

  private openFindDonor(): void {
    const dialogRef = this.dialog.open(FindDonorDialog, {
      width: '1184px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'find-donor-panel',
      data: { mode: 'modify', programName: 'ONILKREG' },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: FindDonorDialogResult) => {
        if (result?.action === 'select' && result.donor) {
          this.loadDonorDetails(result.donor.donorId);
        }
      });
  }

  onPrintCard(): void {
    const d = this.donorDetails();
    if (!d) return;

    const altId = this.alternateIdCtrl.value?.trim();
    const altType = this.selectedAlternateType.value;
    if (altId && !altType) {
      this.notification.showError('Alternate Type is required when Alternate ID is provided');
      return;
    }

    const addr = d.address;
    const cd = d.currentDonation;

    const data: PrintCardDialogData = {
      printRequest: {
        donorId: d.donorId,
        driveId: this.driveId(),
        lastName: d.lastName || '',
        firstName: d.firstName || '',
        middleName: this.middleNameCtrl.value || '',
        lastNameSuffix: this.suffixCtrl.value || '',
        gender: d.gender || '',
        ssn: d.ssn || '',
        dateOfBirth: d.dateOfBirth || '',
        alias: this.nickNameCtrl.value || '',
        height: this.selectedHeight.value?.code || '',
        weight: this.weightCtrl.value ? +this.weightCtrl.value : null,
        ethnicGroup: this.selectedEthnicity.value?.code || d.ethnicGroup || '',
        alternateId: this.alternateIdCtrl.value || '',
        alternateIdType: this.selectedAlternateType.value?.code || '',
        scanId: this.scanIdField?.parsedUnitId || d.scanId || '',
        bloodType: d.bloodType || '',
        streetName: this.homeAddressCtrl.value || '',
        suiteApt: this.apartmentNoCtrl.value || '',
        city: this.selectedCity.value?.city || '',
        state: this.stateCtrl.value || '',
        zip: this.selectedZip.value?.zip || '',
        homeAreaCode: addr?.homeAreaCode || '',
        homePhoneNo: addr?.homePhoneNo || '',
        dayAreaCode: addr?.dayAreaCode || '',
        dayPhoneNo: addr?.dayPhoneNo || '',
        extension: addr?.extension != null ? String(addr.extension) : '',
        email: this.emailCtrl.value || '',
        employerName: this.employerNameCtrl.value || '',
        creditSponsor: this.selectedSponsor.value?.sponsorId || '',
        idVerified: this.idVerifiedCtrl.value ? 'Y' : 'N',
        unitId: cd?.unitId || '',
        intlAddress1: addr?.intlAddress1 || '',
        intlAddress2: addr?.intlAddress2 || '',
        intlAddress3: addr?.intlAddress3 || '',
        intlAddress4: addr?.intlAddress4 || '',
        intlPostalCode: addr?.intlPostalCode || '',
        countryName: addr?.countryName || '',
        intlHomePhone: addr?.intlHomePhone || '',
        intlWorkPhone: addr?.intlWorkPhone || '',
        intlWorkPhoneExt: addr?.intlWorkPhoneExt || '',
        intlMobilePhone: addr?.intlMobilePhone || '',
        intlFaxNo: addr?.intlFaxNo || '',
        intlAddrFlag: addr?.intlAddrFlag || 'N',
        abbrEligStatus: this.eligStatus() === 'Y' ? 'E' : this.eligStatus() === 'N' ? 'D' : '',
      },
      printers: this.cachedPrinters(),
    };

    this.dialog.open(PrintCardDialog, {
      width: '420px',
      disableClose: true,
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data,
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.printer) {
          this.isCardPrinted.set(true);
        }
      });
  }

  onComments(): void {
    const d = this.donorDetails();
    if (!d) return;
    this.dialog.open(EnterCommentsDialog, {
      width: '500px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: ['right-side-dialog', 'lookup-comments-dialog'],
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { donorId: d.donorId },
    });
  }

  onDonations(): void {
    const d = this.donorDetails();
    if (!d) return;

    this.dialog.open(DonationDetailsDialogComponent, {
      width: '1400px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      disableClose: false,
      data: {
        donorId: d.donorId,
        sourceLabel: this.headerConfig.title,
      } as DonationDetailsData,
    });
  }

  onSearchDonor(): void {
    this.openFindDonor();
  }

  onYtdLoss(): void {
    const d = this.donorDetails();
    if (!d) return;

    this.donorCardService.getYtdLoss(d.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loss) => {
          const data: YtdLossDialogData = {
            rbcLoss: loss.rbcLoss,
            plasmaLoss: loss.plasmaLoss,
          };
          this.dialog.open(YtdLossDialog, {
            width: '420px',
            disableClose: true,
            hasBackdrop: true,
            backdropClass: 'code-dialog-backdrop',
            data,
          });
        },
      });
  }

  onAlternateTypeClosed(): void {
    // Binding (closed) triggers CD in this OnPush component,
    // allowing mat-error to reflect the touched state set by mat-select on panel close.
  }

  onInternationalAddress(): void {
    const addr = this.donorDetails()?.address;
    const dialogData: InternationalAddressDialogData = {
      existingAddress: addr ? {
        streetName: addr.intlCityName || addr.intlCity || '',
        addr1: addr.intlAddress1 || null,
        addr2: addr.intlAddress2 || null,
        addr3: addr.intlAddress3 || null,
        addr4: addr.intlAddress4 || null,
        country: addr.countryName || '',
        postalCode: addr.intlPostalCode || null,
        homePhoneNo: addr.intlHomePhone || null,
        workPhoneNo: addr.intlWorkPhone || null,
        workPhoneExt: addr.intlWorkPhoneExt || null,
        mobilePhoneNo: addr.intlMobilePhone || null,
        faxNo: addr.intlFaxNo || null,
        email: addr.email || null,
        intlAddrFlag: addr.intlAddrFlag || 'N',
      } : null,
    };
    this.dialog.open(InternationalAddressDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: dialogData,
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  onAlternateAddress(): void {
    const d = this.donorDetails();
    if (!d) return;
    const dialogData: AlternateDemographicsDialogData = {
      donorId: d.donorId,
    };
    this.dialog.open(AlternateDemographicsDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      panelClass: ['code-dialog-panel-right', 'lookup-alt-demographics-dialog'],
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: dialogData,
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  onEmployerInternationalAddress(): void {
    const emp = this.donorDetails()?.employer;
    const dialogData: EmployerIntlAddressDialogData = {
      intlCity: emp?.intlCity || '',
      intlState: emp?.intlState || '',
      intlPostalCode: emp?.intlPostalCode || '',
      intlCountryName: emp?.intlCountryName || '',
    };
    this.dialog.open(EmployerIntlAddressDialog, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: true,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: dialogData,
    });
  }

  onFullEligibility(): void {
    const d = this.donorDetails();
    if (!d) return;

    const weight = this.weightCtrl.value ? +this.weightCtrl.value : d.donorWeight;
    const donationType = this.selectedDonationType.value?.donationType || null;
    const procedureCode = this.selectedProcedureCode.value?.procedureCode || null;

    console.log('🚀 Opening Full Eligibility with:');
    console.log('  Weight:', weight);
    console.log('  Donation Type:', donationType);
    console.log('  Procedure Code:', procedureCode);
    console.log('  Selected Donation Type Object:', this.selectedDonationType.value);

    const donorInput: DonorEligibilityInput = {
      donorId: d.donorId,
      donorName: `${d.lastName} ${d.firstName}`.trim(),
      dateOfBirth: d.dateOfBirth,
      sex: d.gender,
      bloodType: d.bloodType,
      donorWeight: weight,
      donationType: donationType,
      procedureCode: procedureCode,
    };

    console.log('📤 Sending to dialog:', donorInput);

    this.dialog.open(DonorEligibilityPanel, {
      width: '1100px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      data: donorInput,
      disableClose: true,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result && result.procedureCode) {
          console.log('📥 Received from Eligibility Panel:', result);

          // Set the selected procedure code in the parent form
          const matchingProcedureCode = this.procedureCodeOptions().find(
            pc => pc.procedureCode === result.procedureCode
          );

          if (matchingProcedureCode) {
            this.selectedProcedureCode.setValue(matchingProcedureCode);
            console.log('✅ Procedure code set to:', matchingProcedureCode.procedureCode);

            // Also update donation type if it changed
            if (result.donationType && result.donationType !== this.selectedDonationType.value?.donationType) {
              const matchingDonationType = this.donationTypeOptions().find(
                dt => dt.donationType === result.donationType
              );
              if (matchingDonationType) {
                this.selectedDonationType.setValue(matchingDonationType, { emitEvent: false });
                console.log('✅ Donation type updated to:', matchingDonationType.donationType);
              }
            }
          } else {
            console.warn('⚠️ Procedure code not found in options:', result.procedureCode);
          }
        }
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.donorImageUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  private loadDonationTypesLov(preselectDonationType?: string, preselectProcedureCode?: string, preselectProcedureCodeDesc?: string): void {
    this.isLoadingDonationTypes.set(true);

    this.donorCardService.getDonationTypesLov()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingDonationTypes.set(false))
      )
      .subscribe({
        next: (items) => {
          this.donationTypeOptions.set(items);
          if (preselectDonationType) {
            const match = items.find(i => i.donationType === preselectDonationType);
            if (match) {
              this.pendingProcedureCode.set(preselectProcedureCode ?? null);
              this.pendingProcedureCodeDesc.set(preselectProcedureCodeDesc ?? null);
              this.selectedDonationType.setValue(match);
            }
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading donation types:', error);
          this.notification.showError('Failed to load donation types');
        },
      });
  }

  private loadDonorDetails(donorId: string): void {
    this.isLoading.set(true);
    this.isCardPrinted.set(false);
    this.eligibilityText.set('—');
    this.eligStatus.set('');

    this.selectedDonationType.setValue(null, { emitEvent: false });
    this.selectedProcedureCode.setValue(null, { emitEvent: false });
    this.selectedProcedureCode.disable({ emitEvent: false });
    this.idVerifiedCtrl.setValue(false, { emitEvent: false });
    this.idVerifiedCtrl.disable({ emitEvent: false });
    this.hasDonationType.set(false);
    this.hasProcedureCode.set(false);
    this.hasIdVerified.set(false);
    this.procedureCodeOptions.set([]);
    this.pendingProcedureCode.set(null);
    const driveId = this.driveId();

    forkJoin({
      details: this.donorCardService.getDonorDetails(donorId, driveId),
      picture: this.donorCardService.getDonorPicture(donorId).pipe(catchError(() => of(null))),
      printers: this.donorCardService.getPrinters().pipe(catchError(() => of([]))),
      cities: this.donorCardService.getAllCitiesLov().pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ details, picture, printers, cities }) => {
          this.donorDetails.set(details);
          this.cachedPrinters.set(printers);
          this.allCityOptions.set(cities);
          if (picture) {
            this.donorImageUrl.set(`data:image/jpeg;base64,${picture}`);
          } else {
            this.donorImageUrl.set(null);
          }
          this.isLoading.set(false);

          this.populateEditableFields(details);
          this.loadDonationTypesLov(details.currentDonation?.donationType, details.currentDonation?.procedureCode, details.currentDonation?.procedureCodeDesc);
        },
        error: (error) => {
          console.error('Error loading donor details:', error);
          this.notification.showError('Failed to load donor details');
          this.isLoading.set(false);
        },
      });
  }

  private populateEditableFields(d: DonorDetailsItem): void {
    const addr = d.address;
    const emp = d.employer;
    const cd = d.currentDonation;
    const formatPhone = (area: string, phone: string) =>
      area && phone ? `(${area}) ${phone}` : phone || area || '';

    this.middleNameCtrl.setValue((d.middleName || '').toUpperCase());
    this.suffixCtrl.setValue((d.lastNameSuffix || '').toUpperCase());
    this.nickNameCtrl.setValue((d.alias || '').toUpperCase());
    this.weightCtrl.setValue(d.donorWeight != null ? String(d.donorWeight) : '');
    this.alternateIdCtrl.setValue(d.alternateId || '');
    if (d.alternateId) {
      this.selectedAlternateType.enable({ emitEvent: false });
    }

    this.homeAddressCtrl.setValue((addr?.streetName || '').toUpperCase());
    this.apartmentNoCtrl.setValue(addr?.suiteApt || '');
    this.stateCtrl.setValue(addr?.state || '');

    this.homePhoneCtrl.setValue(addr ? formatPhone(addr.homeAreaCode, addr.homePhoneNo) : '');
    this.workPhoneCtrl.setValue(addr ? formatPhone(addr.dayAreaCode, addr.dayPhoneNo) : '');
    this.emailCtrl.setValue(addr?.email || '');

    this.employerNameCtrl.setValue(emp?.employerName || '');
    this.employerStateCtrl.setValue(emp?.state || '');
    this.altSponsorNameCtrl.setValue(cd?.creditSponsorName || '');

    this.idVerifiedCtrl.setValue(false);

    this.loadHeightsLov(d.height);
    this.loadAlternateIdTypesLov(d.alternateIdType);
    this.loadEthnicGroupsLov(d.ethnicGroup);
    this.loadCityStateLov(addr?.city, addr?.state, addr?.zip);
    this.loadEmployerCityStateLov(emp?.city, emp?.state, emp?.zip);
    this.loadSponsorsLov(cd?.creditSponsor);

    setTimeout(() => {
      if (d.scanId && this.scanIdField) {
        this.scanIdField.prefill(d.scanId);
      }
    });
  }

  private loadAlternateIdTypesLov(preselectCode?: string): void {
    this.isLoadingAlternateTypes.set(true);
    this.donorCardService.getAlternateIdTypesLov()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingAlternateTypes.set(false))
      )
      .subscribe({
        next: (items) => {
          this.alternateTypeOptions.set(items);
          if (preselectCode) {
            const match = items.find(i => i.code === preselectCode);
            if (match) this.selectedAlternateType.setValue(match);
          }
        },
        error: (error) => {
          console.error('Error loading alternate ID types:', error);
          this.notification.showError('Failed to load alternate ID types');
        }
      });
  }

  private loadEthnicGroupsLov(preselectCode?: string): void {
    this.isLoadingEthnicGroups.set(true);
    this.donorCardService.getEthnicGroupsLov()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingEthnicGroups.set(false))
      )
      .subscribe({
        next: (items) => {
          this.ethnicGroupOptions.set(items);
          if (preselectCode) {
            const match = items.find(i => i.code === preselectCode);
            if (match) this.selectedEthnicity.setValue(match);
          }
        },
        error: (error) => {
          console.error('Error loading ethnic groups:', error);
          this.notification.showError('Failed to load ethnic groups');
        }
      });
  }

  private loadHeightsLov(preselectCode?: string): void {
    this.isLoadingHeights.set(true);
    this.donorCardService.getHeightsLov()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingHeights.set(false))
      )
      .subscribe({
        next: (items) => {
          this.heightOptions.set(items);
          if (preselectCode) {
            const match = items.find(i => i.code === preselectCode);
            if (match) this.selectedHeight.setValue(match);
          }
        },
        error: (error) => {
          console.error('Error loading heights:', error);
          this.notification.showError('Failed to load heights');
        }
      });
  }

  private loadCityStateLov(city?: string, state?: string, zip?: string): void {
    if (!city) return;

    const cityMatch = this.allCityOptions().find(i => i.city === city && i.state === state);
    if (cityMatch) this.selectedCity.setValue(cityMatch);

    this.isLoadingZips.set(true);
    this.donorCardService.getCityStateLov({ city, state, exact: true })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingZips.set(false))
      )
      .subscribe({
        next: (items) => {
          this.zipOptions.set(items);
          if (zip) {
            const zipMatch = items.find(i => i.zip === zip);
            if (zipMatch) this.selectedZip.setValue(zipMatch);
          }
        },
        error: (error) => {
          console.error('Error loading zip codes:', error);
          this.notification.showError('Failed to load zip codes');
        }
      });
  }

  private loadEmployerCityStateLov(city?: string, state?: string, zip?: string): void {
    if (!city) return;

    this.isLoadingEmployerZips.set(true);
    this.donorCardService.getCityStateLov({ city, state, exact: true })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingEmployerZips.set(false))
      )
      .subscribe({
        next: (items) => {
          this.employerCityOptions.set(items);
          this.employerZipOptions.set(items);
          const cityMatch = items.find(i => i.city === city && i.state === state);
          if (cityMatch) this.selectedEmployerCity.setValue(cityMatch);
          if (zip) {
            const zipMatch = items.find(i => i.zip === zip);
            if (zipMatch) this.selectedEmployerZip.setValue(zipMatch);
          }
        },
        error: (error) => {
          console.error('Error loading employer city/state:', error);
          this.notification.showError('Failed to load employer location data');
        }
      });
  }

  private loadSponsorsLov(preselectCode?: string): void {
    this.isLoadingSponsors.set(true);
    this.donorCardService.getSponsorsLov()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingSponsors.set(false))
      )
      .subscribe({
        next: (items) => {
          this.sponsorOptions.set(items);
          if (preselectCode) {
            const match = items.find(i => i.sponsorId === preselectCode);
            if (match) this.selectedSponsor.setValue(match);
          }
        },
        error: (error) => {
          console.error('Error loading sponsors:', error);
          this.notification.showError('Failed to load sponsors');
        }
      });
  }

  onCityChange(selected: CityLovItem): void {
    if (!selected) return;
    this.stateCtrl.setValue(selected.state || '');
    this.selectedZip.setValue(null);

    this.isLoadingZips.set(true);
    this.donorCardService.getCityStateLov({ city: selected.city, state: selected.state, exact: true })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingZips.set(false))
      )
      .subscribe({
        next: (items) => {
          this.zipOptions.set(items);
        },
        error: (error) => {
          console.error('Error loading zip codes for city:', error);
          this.notification.showError('Failed to load zip codes');
        }
      });
  }

  onEmployerCityChange(selected: CityStateLovItem): void {
    if (!selected) return;
    this.employerStateCtrl.setValue(selected.state || '');
    this.selectedEmployerZip.setValue(null);

    this.isLoadingEmployerZips.set(true);
    this.donorCardService.getCityStateLov({ city: selected.city })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingEmployerZips.set(false))
      )
      .subscribe({
        next: (items) => {
          this.employerZipOptions.set(items);
        },
        error: (error) => {
          console.error('Error loading employer zip codes:', error);
          this.notification.showError('Failed to load employer zip codes');
        }
      });
  }

  private checkEligibility(): void {
    const d = this.donorDetails();
    const procCode = this.selectedProcedureCode.value;
    const donType = this.selectedDonationType.value;
    if (!d || !procCode || !donType) {
      this.eligibilityText.set('—');
      this.eligStatus.set('');
      return;
    }

    this.isCheckingEligibility.set(true);
    this.donorCardService.checkDonorEligibility({
      donorId: d.donorId,
      procedureCode: procCode.procedureCode,
      donationType: donType.donationType,
      donorWeight: this.weightCtrl.value ? +this.weightCtrl.value : d.donorWeight,
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isCheckingEligibility.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.item) {
            this.eligibilityText.set(res.item.eligDescription);
            this.eligStatus.set(res.item.eligStatus);
          } else {
            this.eligibilityText.set('Unable to check eligibility');
            this.eligStatus.set('');
          }
        },
        error: (error) => {
          console.error('Error checking eligibility:', error);
          this.eligibilityText.set('Unable to check eligibility');
          this.eligStatus.set('');
          this.notification.showError('Failed to check donor eligibility');
        },
      });
  }


  private calcYearsSince(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const year = parseInt(parts[2], 10) || parseInt(parts[0], 10);
    const diff = new Date().getFullYear() - year;
    if (diff <= 0) return '';
    return diff === 1 ? '1 year' : `${diff} years`;
  }
}
