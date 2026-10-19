import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin, takeUntil, switchMap } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitIdFieldComponent, UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';

import {
  BoxHeaderDto,
  BoxUnitDto,
  FacilityDropdownDto,
  SampleTypeDropdownDto,
  TestIdDropdownDto,
} from './models/confirmatory-sample-transfer-out.model';
import { ConfirmatorySampleTransferOutApiService } from './services/confirmatory-sample-transfer-out-api.service';
import { UnitsInBoxDialogComponent } from './dialogs/units-in-box-dialog/units-in-box-dialog.component';

@Component({
  selector: 'app-confirmatory-sample-transfer-out',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  templateUrl: './confirmatory-sample-transfer-out.component.html',
  styleUrl: './confirmatory-sample-transfer-out.component.scss',
})
export class ConfirmatorySampleTransferOutComponent implements OnInit, OnDestroy {
  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private static nextId = 0;
  protected readonly componentId = `ctrout-${ConfirmatorySampleTransferOutComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ConfirmatorySampleTransferOutApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);

  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: 'Track, organize, and transfer confirmatory samples.',
        };
      }
    });
  }

  // Dropdown data from API
  protected readonly openBoxes = signal<BoxHeaderDto[]>([]);
  protected readonly facilities = signal<FacilityDropdownDto[]>([]);
  protected readonly sampleTypes = signal<SampleTypeDropdownDto[]>([]);
  protected readonly testIds = signal<TestIdDropdownDto[]>([]);
  protected readonly showTestIdDropdown = signal<boolean>(false);

  // Search controls
  boxIdSearchCtrl = new FormControl('');
  facilitySearchCtrl = new FormControl('');
  sampleTypeSearchCtrl = new FormControl('');
  testIdSearchCtrl = new FormControl('');

  private boxIdSearchText = signal('');
  private facilitySearchText = signal('');
  private sampleTypeSearchText = signal('');
  private testIdSearchText = signal('');

  readonly filteredBoxIds = computed(() => {
    const s = this.boxIdSearchText().toLowerCase();
    return !s ? this.openBoxes() : this.openBoxes().filter((b) =>
      b.boxId.toLowerCase().includes(s)
    );
  });

  readonly filteredFacilities = computed(() => {
    const s = this.facilitySearchText().toLowerCase();
    return !s ? this.facilities() : this.facilities().filter((f) =>
      f.code.toLowerCase().includes(s) || f.description.toLowerCase().includes(s)
    );
  });

  readonly filteredSampleTypes = computed(() => {
    const s = this.sampleTypeSearchText().toLowerCase();
    return !s ? this.sampleTypes() : this.sampleTypes().filter((t) =>
      t.code.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)
    );
  });

  readonly filteredTestIds = computed(() => {
    const s = this.testIdSearchText().toLowerCase();
    return !s ? this.testIds() : this.testIds().filter((t) =>
      t.testId.toLowerCase().includes(s) || t.testDesc.toLowerCase().includes(s)
    );
  });

  // State
  protected readonly boxHeader = signal<BoxHeaderDto | null>(null);
  protected readonly units = signal<BoxUnitDto[]>([]);
  protected readonly selectedUnit = signal<BoxUnitDto | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly entryCollDate = signal<string>('-');
  protected readonly entryCustomerId = signal<string>('--');
  protected readonly currentParsedUnitId = signal<string>('');
  protected readonly selectedFacilityCode = signal<string>('');
  private validatedCollDate = '';
  private validatedContractId = '';
  private lastAddedSampleSeqNo = '';

  // Computed
  protected readonly showEntryBar = computed(() => !!this.selectedFacilityCode() || !!this.boxHeader());
  protected readonly hasBoxSelected = computed(() => this.boxHeader() !== null);
  protected readonly isEmpty = computed(() => this.units().length === 0);
  protected readonly showEmptyState = computed(() => !this.hasBoxSelected() || this.isEmpty());
  protected readonly unitCount = computed(() => this.units().length);
  protected readonly facilityDescription = computed(() => {
    const code = this.selectedFacilityCode();
    if (!code) return '--';
    const facility = this.facilities().find((f) => f.code === code);
    return facility?.description || '--';
  });

  // Forms
  headerForm!: FormGroup;
  entryForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadDropdowns();
    this.subscribeToChapterChanges();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.headerForm = this.fb.group({
      boxId: [''],
      shipmentNo: [''],
      facilityCode: [''],
    });

    this.entryForm = this.fb.group({
      sampleType: [''],
      frozen: [''],
      testId: [''],
    });

    this.headerForm.get('facilityCode')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code) => this.selectedFacilityCode.set(code || ''));
  }

  private loadDropdowns(): void {
    forkJoin([
      this.apiService.getActiveFacilities(),
      this.apiService.getActiveSampleTypes(),
      this.apiService.getOpenBoxes(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([facilities, sampleTypes, openBoxes]) => {
          this.facilities.set(facilities);
          this.sampleTypes.set(sampleTypes);
          this.openBoxes.set(openBoxes);

          const returnBoxId = this.route.snapshot.queryParams['boxId'];
          if (returnBoxId && !this.boxHeader()) {
            this.headerForm.patchValue({ boxId: returnBoxId }, { emitEvent: false });
            this.onBoxIdChange(returnBoxId);
          }
        },
        error: (err) => {
          this.snackbarService.showError('Failed to load dropdown data.');
          console.error('Failed to load dropdowns:', err);
        },
      });
  }

  private setupSearchSubscriptions(): void {
    this.boxIdSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.boxIdSearchText.set(val || ''));
    this.facilitySearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.facilitySearchText.set(val || ''));
    this.sampleTypeSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.sampleTypeSearchText.set(val || ''));
    this.testIdSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.testIdSearchText.set(val || ''));
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadDropdowns();
      });
  }

  // ── Box ID selection (existing box) ──

  onBoxIdChange(boxId: string): void {
    if (!boxId) {
      this.boxHeader.set(null);
      this.units.set([]);
      this.selectedUnit.set(null);
      return;
    }

    this.loading.set(true);
    this.apiService.getBoxDetails(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (box) => {
          this.boxHeader.set(box);
          this.units.set(box.units || []);
          this.selectedUnit.set((box.units && box.units.length > 0) ? box.units[0] : null);

          this.headerForm.patchValue({
            shipmentNo: box.shipmentNo || '',
            facilityCode: box.facilityCode,
          }, { emitEvent: true });

          if (box.externalFacFlag === 'Y') {
            this.showTestIdDropdown.set(true);
            this.loadTestIds(box.facilityCode);
          } else {
            this.showTestIdDropdown.set(false);
            this.testIds.set([]);
          }

          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err?.error?.message || err?.message || 'Failed to load box details.');
        },
      });
  }

  // ── Facility change (new box flow or manual change) ──

  onFacilityChange(facilityCode: string): void {
    if (!facilityCode) {
      this.showTestIdDropdown.set(false);
      this.testIds.set([]);
      return;
    }

    const facility = this.facilities().find((f) => f.code === facilityCode);
    if (facility?.isExternal === 'Y') {
      this.showTestIdDropdown.set(true);
      this.loadTestIds(facilityCode);
    } else {
      this.showTestIdDropdown.set(false);
      this.testIds.set([]);
    }
  }

  handleEntryEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.tryAddUnit();
    }
  }

  private loadTestIds(facilityCode: string): void {
    this.apiService.getActiveTestIds(facilityCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => this.testIds.set(tests),
        error: () => this.snackbarService.showError('Failed to load test IDs.'),
      });
  }

  // ── Unit ID validation (shared component) ──

  onSelectUnit(unit: BoxUnitDto): void {
    this.selectedUnit.set(unit);
  }

  onUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;

    const exists = this.units().some((u) => u.unitId === parsedUnitId);
    if (exists) {
      event.reject('This Unit ID has been scanned');
      return;
    }

    this.apiService.validateUnit({ unitId: parsedUnitId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.collDate) {
            this.validatedCollDate = result.collDate;
            this.entryCollDate.set(this.formatDate(result.collDate));
          }
          if (result.contractId) {
            this.validatedContractId = result.contractId;
            this.entryCustomerId.set(result.contractId);
          }

          if (result.isValid) {
            event.confirm();
          } else {
            event.reject(result.errorMessage || 'Unit validation failed');
          }
        },
        error: (err) => {
          const body = err?.error;
          const data = body?.data?.[0];
          if (data?.collDate) {
            this.validatedCollDate = data.collDate;
            this.entryCollDate.set(this.formatDate(data.collDate));
          }
          if (data?.contractId) {
            this.validatedContractId = data.contractId;
            this.entryCustomerId.set(data.contractId);
          }
          const errorMsg = data?.errorMessage
            || body?.errorResponse?.error
            || body?.message
            || 'Unit validation failed';
          event.reject(errorMsg);
        },
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    this.currentParsedUnitId.set(data.parsedUnitId);
  }

  onUnitCleared(): void {
    this.entryCollDate.set('-');
    this.entryCustomerId.set('--');
    this.validatedCollDate = '';
    this.validatedContractId = '';
    this.currentParsedUnitId.set('');
    this.lastAddedSampleSeqNo = '';
  }

  // ── Dropdown change handlers ──

  onFrozenChange(): void {
    this.tryAddUnit();
  }

  onTestIdChange(): void {
    this.tryAddTest();
  }

  private tryAddUnit(): void {
    const unitId = this.currentParsedUnitId();
    const sampleType = this.entryForm.get('sampleType')?.value;
    if (!unitId || !sampleType || !this.validatedCollDate) return;

    this.addUnitToBox();
  }

  private tryAddTest(): void {
    const testId = this.entryForm.get('testId')?.value;
    if (!testId || !this.lastAddedSampleSeqNo) return;

    const unitId = this.currentParsedUnitId();
    const sampleType = this.entryForm.get('sampleType')?.value;

    this.loading.set(true);
    this.apiService.addTestToSample(this.lastAddedSampleSeqNo, {
      testId,
      facilityCode: this.boxHeader()!.facilityCode,
      unitId,
      sampleType,
      collDate: this.validatedCollDate,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Test added successfully');
          this.afterUnitAdded(this.boxHeader()!.boxId, true);
        },
        error: (err) => {
          this.loading.set(false);
          const body = err?.error;
          this.snackbarService.showError(
            body?.errorResponse?.error || body?.message || 'Failed to add test'
          );
        },
      });
  }

  // ── Add unit (auto-creates box if needed) ──

  private addUnitToBox(): void {
    const facilityCode = this.selectedFacilityCode();
    const unitId = this.currentParsedUnitId();
    const sampleType = this.entryForm.get('sampleType')?.value;
    const frozen = this.entryForm.get('frozen')?.value || 'N';
    const shipmentNo = this.headerForm.get('shipmentNo')?.value?.trim() || undefined;

    if (!facilityCode || !unitId || !sampleType) return;

    this.loading.set(true);

    if (!this.boxHeader()) {
      this.apiService.createBox({ facilityCode, shipmentNo })
        .pipe(
          switchMap((boxId) => {
            this.headerForm.patchValue({ boxId }, { emitEvent: false });
            return this.apiService.getBoxDetails(boxId);
          }),
          switchMap((box) => {
            this.boxHeader.set(box);
            return this.apiService.addUnitToBox(box.boxId, {
              unitId,
              collDate: this.validatedCollDate,
              sampleType,
              frozenFlag: frozen,
            });
          }),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (response) => this.handleAddUnitResponse(response),
          error: (err) => {
            this.loading.set(false);
            this.snackbarService.showError(err?.error?.message || err?.message || 'Failed to create box or add unit.');
          },
        });
    } else {
      this.apiService.addUnitToBox(this.boxHeader()!.boxId, {
        unitId,
        collDate: this.validatedCollDate,
        sampleType,
        frozenFlag: frozen,
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => this.handleAddUnitResponse(response),
          error: (err) => {
            this.loading.set(false);
            this.snackbarService.showError(err?.error?.message || err?.message || 'Failed to add unit to box.');
          },
        });
    }
  }

  private handleAddUnitResponse(response: any): void {
    const boxId = this.boxHeader()!.boxId;

    if (response.success === false && response.errorCode === '1395') {
      this.snackbarService.showError(
        response.errorResponse?.error || 'Sample type already packed in another box'
      );
      this.loading.set(false);
      return;
    }
    if (response.success === false) {
      this.snackbarService.showError(
        response.errorResponse?.error || response.message || 'Failed to add unit'
      );
      this.loading.set(false);
      return;
    }

    this.lastAddedSampleSeqNo = response.data?.[0] || '';
    this.snackbarService.showSuccess('Unit added successfully');

    if (this.showTestIdDropdown()) {
      this.afterUnitAdded(boxId, false);
    } else {
      this.afterUnitAdded(boxId, true);
    }
  }

  private afterUnitAdded(boxId: string, resetEntry: boolean): void {
    this.apiService.getBoxDetails(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (box) => {
          this.boxHeader.set(box);
          this.units.set(box.units || []);
          this.selectedUnit.set((box.units && box.units.length > 0) ? box.units[box.units.length - 1] : null);
          this.loading.set(false);

          if (resetEntry) {
            this.resetEntryBar();
          }
          this.loadDropdowns();
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  private resetEntryBar(): void {
    this.entryForm.reset();
    this.entryCollDate.set('-');
    this.entryCustomerId.set('--');
    this.validatedCollDate = '';
    this.validatedContractId = '';
    this.currentParsedUnitId.set('');
    this.unitIdField?.clear();
    this.unitIdField?.focus();
  }

  // ── Actions ──

  clearAll(): void {
    this.headerForm.reset();
    this.entryForm.reset();
    this.boxHeader.set(null);
    this.units.set([]);
    this.selectedUnit.set(null);
    this.entryCollDate.set('-');
    this.entryCustomerId.set('--');
    this.currentParsedUnitId.set('');
    this.showTestIdDropdown.set(false);
    this.validatedCollDate = '';
    this.validatedContractId = '';
    this.lastAddedSampleSeqNo = '';
  }

  onEditUnitsInBox(): void {
    const boxId = this.boxHeader()?.boxId;
    if (!boxId) return;
    this.router.navigate([
      '/laboratory-functions/regional-sample-tracking/confirmatory-sample-transfer-out/edit-units-in-box',
    ], { queryParams: { boxId } });
  }

  onUnitsInBox(): void {
    const header = this.boxHeader();
    if (!header) {
      this.snackbarService.showError('Please select a box first.');
      return;
    }

    this.dialog.open(UnitsInBoxDialogComponent, {
      width: '65vw',
      maxWidth: '65vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'view-units-drawer-dialog',
      backdropClass: 'blur-backdrop',
      hasBackdrop: true,
      autoFocus: false,
      data: {
        boxHeader: header,
        units: this.units(),
      },
    });
  }

  onCloseBoxAndPrintReport(): void {
    const boxId = this.boxHeader()?.boxId;
    if (!boxId) return;

    this.loading.set(true);
    this.apiService.closeBox(boxId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.snackbarService.showSuccess('Box closed successfully.');
          this.clearAll();
          this.loadDropdowns();
        },
        error: (err) => {
          this.loading.set(false);
          this.snackbarService.showError(err?.error?.message || err?.message || 'Failed to close box.');
        },
      });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  }
}
