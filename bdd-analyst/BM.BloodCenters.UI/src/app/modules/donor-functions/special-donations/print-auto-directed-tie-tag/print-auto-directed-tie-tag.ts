import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  effect,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';

import { PrintAutoDirectedTieTagService } from './services/print-auto-directed-tie-tag.service';
import { SearchPatientDialogComponent } from './search-patient-dialog/search-patient-dialog';
import { SelectPrinterDialogComponent } from './select-printer-dialog/select-printer-dialog';
import type {
  TieTagSearchCriteriaDto,
  PatientSearchResultDto,
  TieTagDetailsDto,
  TieTagDonationDto,
  TieTagPrintRequestDto,
  PatientTypeDto,
  AttributeCodeDto,
} from './models/print-auto-directed-tie-tag.models';

interface DonationRow extends TieTagDonationDto {
  donType: string;
  cmv: string;
  ir: string;
  ifFlag: string;
  tagError: boolean;
  cmvError: boolean;
  irError: boolean;
  ifError: boolean;
}

@Component({
  selector: 'app-print-auto-directed-tie-tag',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: () => {
        const intl = new MatPaginatorIntl();
        intl.itemsPerPageLabel = 'Rows per page:';
        return intl;
      },
    },
  ],
  templateUrl: './print-auto-directed-tie-tag.html',
  styleUrls: ['./print-auto-directed-tie-tag.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintAutoDirectedTieTagComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('paginatorWrapper') paginatorWrapper!: ElementRef;
  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;

  private destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly tieTagService = inject(PrintAutoDirectedTieTagService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
  };

  filterForm!: FormGroup;

  readonly patientOptions = signal<PatientSearchResultDto[]>([]);
  isLoadingPatients = false;

  readonly patientSearchControl = new FormControl('');
  readonly tagSearchControl = new FormControl('');
  private readonly patientSearch = signal('');
  private readonly tagSearch = signal('');
  private readonly patientIdValue = signal<string | null>(null);

  readonly filteredPatients = computed(() => {
    const search = this.patientSearch().toLowerCase();
    const options = this.patientOptions();
    if (!search) return options;
    return options.filter(o =>
      (o.patientId || '').toLowerCase().includes(search) ||
      (o.lastName || '').toLowerCase().includes(search) ||
      (o.firstName || '').toLowerCase().includes(search),
    );
  });

  readonly filteredPatientTypes = computed(() => {
    const search = this.tagSearch().toLowerCase();
    if (!search) return this.patientTypes;
    return this.patientTypes.filter(t =>
      (t.code || '').toLowerCase().includes(search) ||
      (t.description || '').toLowerCase().includes(search),
    );
  });

  readonly selectedPatientDisplay = computed(() => {
    const selectedId = this.patientIdValue();
    if (!selectedId) return '';
    return selectedId;
  });

  isPatientTruncated = false;

  readonly searchOptions = [
    { value: 'LIKE', label: 'Like' },
    { value: 'EXACT', label: 'Exact' },
  ];

  dataSource: PatientSearchResultDto[] = [];
  isLoading = false;
  hasRetrievedData = false;

  selectedPatient: PatientSearchResultDto | null = null;
  patientDetails: TieTagDetailsDto | null = null;
  isLoadingDetails = false;

  donations: DonationRow[] = [];
  patientTypes: PatientTypeDto[] = [];
  attributes: AttributeCodeDto[] = [];
  irradiationPrompt = 'BLANK';
  isLoadingDonations = false;
  noProductsDefined = false;

  donationColumns = [
    'donorId', 'tag', 'unitId', 'collectionDate',
    'component1', 'component2', 'component3',
    'cmv', 'ir', 'ifFlag',
  ];

  copyOptions = [0, 1, 2, 3];

  displayedColumns: string[] = [
    'patientId',
    'lastName',
    'firstName',
    'dateOfBirth',
    'surgeryId',
    'surgeryDate',
  ];

  totalRecords = 0;
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  constructor() {
    this.patientSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.patientSearch.set(value || ''));

    this.tagSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.tagSearch.set(value || ''));

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
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadPatients();
    this.subscribeToChapterChanges();
  }

  ngAfterViewInit(): void {
    this.removePaginatorTooltips();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private removePaginatorTooltips(): void {
    setTimeout(() => {
      const paginatorEl = this.paginatorWrapper?.nativeElement;
      if (paginatorEl) {
        const buttons = paginatorEl.querySelectorAll(
          '.mat-mdc-paginator-navigation-first, .mat-mdc-paginator-navigation-previous, .mat-mdc-paginator-navigation-next, .mat-mdc-paginator-navigation-last',
        );
        buttons.forEach((btn: Element) => {
          btn.removeAttribute('matTooltip');
          btn.removeAttribute('ng-reflect-message');
          btn.removeAttribute('aria-describedby');
        });
      }
    });
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      patientId: [null],
      patientSearch: [null],
      searchOption: ['LIKE', [Validators.required]],
    });

    this.filterForm
      .get('patientId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(val => this.patientIdValue.set(val));
  }

  private loadPatients(): void {
    this.isLoadingPatients = true;
    this.cdr.markForCheck();

    this.tieTagService
      .getPatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: patients => {
          this.patientOptions.set(patients);
          this.isLoadingPatients = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.patientOptions.set([]);
          this.isLoadingPatients = false;
          this.cdr.markForCheck();
        },
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadPatients();
      });
  }

  get isRetrieveDisabled(): boolean {
    const formValue = this.filterForm.value;
    const hasPatientId = !!formValue.patientId;
    const hasSearch = !!formValue.patientSearch?.trim();
    return (!hasPatientId && !hasSearch) || this.isLoading;
  }

  get isClearAllDisabled(): boolean {
    const formValue = this.filterForm.value;
    const hasValues = formValue.patientId || formValue.patientSearch?.trim();
    return !hasValues && !this.hasRetrievedData;
  }

  onRetrieve(): void {
    if (this.isRetrieveDisabled) return;

    this.isLoading = true;
    this.pageIndex = 0;
    this.cdr.markForCheck();

    const formValue = this.filterForm.value;
    const criteria: TieTagSearchCriteriaDto = {};

    if (formValue.patientId) {
      criteria.patientId = formValue.patientId;
    }

    if (formValue.patientSearch?.trim()) {
      criteria.lastName = formValue.patientSearch.trim().toUpperCase();
    }

    criteria.searchMode = formValue.searchOption || 'LIKE';

    this.tieTagService
      .searchPatients(criteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: results => {
          this.isLoading = false;
          this.cdr.markForCheck();

          if (results.length === 0) {
            this.dataSource = [];
            this.totalRecords = 0;
            this.hasRetrievedData = true;
          } else {
            this.openSearchPatientDialog(results);
          }
        },
        error: () => {
          this.dataSource = [];
          this.totalRecords = 0;
          this.hasRetrievedData = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private openSearchPatientDialog(patients: PatientSearchResultDto[]): void {
    const dialogRef = this.dialog.open(SearchPatientDialogComponent, {
      panelClass: 'search-patient-right-dialog',
      width: '881px',
      maxWidth: '100vw',
      height: '100vh',
      position: { right: '0' },
      autoFocus: false,
      disableClose: true,
      data: { patients },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedPatient: PatientSearchResultDto | null) => {
        if (selectedPatient) {
          this.loadPatientDetails(selectedPatient);
        }
      });
  }

  private loadPatientDetails(patient: PatientSearchResultDto): void {
    this.selectedPatient = patient;
    this.isLoadingDetails = true;
    this.isLoadingDonations = true;
    this.filterForm.patchValue({ patientId: patient.patientId });
    this.patientIdValue.set(patient.patientId);
    this.cdr.markForCheck();

    this.tieTagService
      .getTransferDetails(patient.patientId, patient.surgeryId!, patient.surgeryDate!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: details => {
          this.patientDetails = details;
          this.isLoadingDetails = false;
          this.cdr.markForCheck();
          this.loadDonations(patient);
        },
        error: () => {
          this.patientDetails = null;
          this.isLoadingDetails = false;
          this.isLoadingDonations = false;
          this.cdr.markForCheck();
        },
      });
  }

  private loadDonations(patient: PatientSearchResultDto): void {
    forkJoin({
      donationsResp: this.tieTagService.getDonations(patient.patientId, patient.surgeryId!),
      patientTypes: this.tieTagService.getPatientTypes(),
      attributes: this.tieTagService.getAttributes(),
      irradiation: this.tieTagService.getIrradiationPrompt(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ donationsResp, patientTypes, attributes, irradiation }) => {
          this.patientTypes = patientTypes;
          this.attributes = attributes;
          this.irradiationPrompt = irradiation.irradiationPrompt;
          if (donationsResp.warnings.length) {
            donationsResp.warnings.forEach(w => {
              this.snackbarService.showError(w.message);
            });
          }

          this.donations = donationsResp.data.map(d => ({
            ...d,
            copies1: 0,
            copies2: 0,
            copies3: 0,
            donType: '',
            cmv: '',
            ir: '',
            ifFlag: '',
            tagError: false,
            cmvError: false,
            irError: false,
            ifError: false,
          }));

          this.noProductsDefined = this.donations.length > 0 &&
            this.donations.every(d => !d.product1 && !d.product2 && !d.product3);

          this.isLoadingDonations = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.donations = [];
          this.isLoadingDonations = false;
          this.cdr.markForCheck();
        },
      });
  }

  onClearAll(): void {
    this.filterForm.reset({
      patientId: null,
      patientSearch: null,
      searchOption: 'LIKE',
    });
    this.patientIdValue.set(null);
    this.patientSearchControl.setValue('');
    this.isPatientTruncated = false;
    this.dataSource = [];
    this.totalRecords = 0;
    this.hasRetrievedData = false;
    this.pageIndex = 0;
    this.selectedPatient = null;
    this.patientDetails = null;
    this.isLoadingDetails = false;
    this.donations = [];
    this.patientTypes = [];
    this.attributes = [];
    this.noProductsDefined = false;
    this.isLoadingDonations = false;
    this.cdr.markForCheck();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  checkPatientTruncation(el: HTMLElement): void {
    this.isPatientTruncated = el.scrollWidth > el.clientWidth;
  }

  showTooltipIfOverflowing(element: HTMLElement, tooltip: MatTooltip): void {
    tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }

  onTagDropdownOpened(opened: boolean): void {
    if (opened) {
      this.tagSearchControl.setValue('');
    }
  }

  onPrint(): void {
    if (!this.validateTagFields()) return;

    const request = this.buildPrintRequest('');

    this.tieTagService
      .validatePrintRequest(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.fetchPrintersAndOpenDialog();
        },
        error: () => {},
      });
  }

  private isRowBeingPrinted(d: DonationRow): boolean {
    return (!!d.product1 && d.copies1 > 0) ||
           (!!d.product2 && d.copies2 > 0) ||
           (!!d.product3 && d.copies3 > 0);
  }

  private validateTagFields(): boolean {
    let allValid = true;
    for (const donation of this.donations) {
      const printing = this.isRowBeingPrinted(donation);

      if (printing && !donation.donType) {
        donation.tagError = true;
        allValid = false;
      } else {
        donation.tagError = false;
      }

      if (printing && !donation.cmv) {
        donation.cmvError = true;
        allValid = false;
      } else {
        donation.cmvError = false;
      }

      if (printing && !donation.ir) {
        donation.irError = true;
        allValid = false;
      } else {
        donation.irError = false;
      }

      if (printing && !donation.ifFlag) {
        donation.ifError = true;
        allValid = false;
      } else {
        donation.ifError = false;
      }
    }
    if (!allValid) {
      this.cdr.markForCheck();
    }
    return allValid;
  }

  onTagChange(row: DonationRow): void {
    if (row.donType) {
      row.tagError = false;
      this.cdr.markForCheck();
    }
  }

  onAttributeChange(row: DonationRow, attr: 'cmv' | 'ir' | 'ifFlag'): void {
    if (attr === 'cmv') row.cmvError = false;
    else if (attr === 'ir') row.irError = false;
    else if (attr === 'ifFlag') row.ifError = false;
    this.cdr.markForCheck();
  }

  private fetchPrintersAndOpenDialog(): void {
    this.tieTagService
      .getPrinters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: printers => {
          if (printers.length === 0) {
            this.snackbarService.showError('No printers available.');
            return;
          }

          const dialogRef = this.dialog.open(SelectPrinterDialogComponent, {
            width: '400px',
            disableClose: true,
            autoFocus: false,
            data: { printers },
          });

          dialogRef
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
              if (result?.printerCode) {
                this.executePrint(result.printerCode);
              }
            });
        },
      });
  }

  private executePrint(printerCode: string): void {
    const request = this.buildPrintRequest(printerCode);

    this.tieTagService
      .printTieTags(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.snackbarService.showSuccess(response.message);
          this.onClearAll();
        },
        error: () => {},
      });
  }

  private buildPrintRequest(printerCode: string): TieTagPrintRequestDto {
    return {
      patientId: this.patientDetails!.patientId,
      surgeryId: this.patientDetails!.surgeryId,
      surgeryDate: this.patientDetails!.surgeryDate || '',
      dateNeededBy: this.patientDetails!.dateNeededBy,
      hospitalId: this.patientDetails!.hospitalId || '',
      printer: printerCode,
      donations: this.donations.map(d => ({
        seqNo: d.seqNo || '',
        unitId: d.unitId || null,
        chapterId: d.chapterId || this.patientDetails!.chapterId,
        donType: d.donType,
        product1: d.product1,
        print1: !!d.product1 && d.copies1 > 0,
        copies1: d.copies1,
        product2: d.product2,
        print2: !!d.product2 && d.copies2 > 0,
        copies2: d.copies2,
        product3: d.product3,
        print3: !!d.product3 && d.copies3 > 0,
        copies3: d.copies3,
        attributes: {
          CMV: d.cmv === 'Yes' ? 'Y' : d.cmv === 'No' ? 'N' : '',
          IR: d.ir === 'Yes' ? 'Y' : d.ir === 'No' ? 'N' : '',
          IF: d.ifFlag === 'Yes' ? 'Y' : d.ifFlag === 'No' ? 'N' : '',
        },
      })),
    };
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '--';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '--';
  }
}
