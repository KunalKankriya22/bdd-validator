import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

import {
  Overlay,
  OverlayRef,
  FlexibleConnectedPositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { UppercaseDatePipe } from '@shared/pipes/uppercase-date.pipe';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { FilterChips, FilterChip } from '@shared/components/filter-chips/filter-chips';
import {
  AuditHoldRecord,
  HoldDetails,
  HoldDetailRecord,
  HoldDetailsFilterValue,
  HoldDetailsRequest
} from '../models/release-audit-holds.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ReleaseAuditHoldsService } from '../services/release-audit-holds.service';
import { HoldDetailsFilterPanel } from '../hold-details-filter-panel/hold-details-filter-panel';

/**
 * Hold Details Panel - Shows unit holds and donor holds in separate sections
 */
@Component({
  selector: 'app-hold-details-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SidePanelBase,
    UppercaseDatePipe,
    FilterChips
  ],
  templateUrl: './hold-details-panel.html',
  styleUrls: ['./hold-details-panel.scss']
})
export class HoldDetailsPanel implements OnInit, OnDestroy {
  @Input() record!: AuditHoldRecord;
  @Output() closePanel = new EventEmitter<void>();

  @ViewChild('unitFilterBtn', { read: ElementRef }) unitFilterBtn!: ElementRef<HTMLElement>;
  @ViewChild('donorFilterBtn', { read: ElementRef }) donorFilterBtn!: ElementRef<HTMLElement>;

  footerButtons: DialogButton[] = [];
  holdDetails: HoldDetails | null = null;

  isLoadingUnitHolds = false;
  isLoadingDonorHolds = false;
  hasUnitHoldsError = false;
  hasDonorHoldsError = false;
  unitHoldsErrorMessage = '';
  donorHoldsErrorMessage = '';

  unitDisplayedColumns: string[] = [
    'type',
    'code',
    'description',
    'entryDate',
    'terminationDate',
    'insUser',
    'relDate',
    'relUser'
  ];

  donorDisplayedColumns: string[] = [
    'type',
    'code',
    'description',
    'entryDate',
    'terminationDate',
    'insUser',
    'relDate',
    'relUser'
  ];

  // Filter state
  unitHoldsFilters: HoldDetailsFilterValue | null = null;
  donorHoldsFilters: HoldDetailsFilterValue | null = null;

  // Filtered data sources
  filteredUnitHolds: HoldDetailRecord[] = [];
  filteredDonorHolds: HoldDetailRecord[] = [];

  // Filter chips
  unitFilterChips: FilterChip[] = [];
  donorFilterChips: FilterChip[] = [];

  // Track filter open state for active button styling
  isUnitFilterOpen = false;
  isDonorFilterOpen = false;

  private destroy$ = new Subject<void>();
  private overlayRef: OverlayRef | null = null;
  private activeFilterSection: 'unit' | 'donor' | null = null;

  constructor(
    private service: ReleaseAuditHoldsService,
    private overlay: Overlay,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.setupFooterButtons();
    this.loadHoldDetails();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayRef?.dispose();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeFilterPanel();
        this.closePanel.emit();
      });
  }

  private setupFooterButtons(): void {
    this.footerButtons = [
      {
        label: 'CLOSE',
        action: 'close',
        variant: 'primary',
        disabled: false
      }
    ];
  }

  private loadHoldDetails(): void {
    this.holdDetails = {
      unitHolds: { unitId: this.record.unitId, collectionDate: this.record.collectionDate, holds: [] },
      donorHolds: { unitId: this.record.unitId, collectionDate: this.record.collectionDate, holds: [] }
    };

    const unitRequest = this.buildBaseRequest({ holds: 'Active' });
    const donorRequest = this.buildBaseRequest({ holds: 'ActiveDonation' });
    this.loadUnitHolds(unitRequest);
    this.loadDonorHolds(donorRequest);
  }

  private buildBaseRequest(filters?: HoldDetailsFilterValue | null): HoldDetailsRequest {
    const request: HoldDetailsRequest = {
      transactionId: this.record.transactionId,
      donorId: this.record.donorId
    };

    if (filters) {
      request.holds = filters.holds || undefined;

      if (filters.entryDate && filters.entryDatePeriod) {
        request.entryDatePeriod = filters.entryDatePeriod;
        request.entryDateFrom = DateFieldValidationUtility.serializeDateForApi(moment(filters.entryDate));
      }

      if (filters.terminationDate && filters.terminationDatePeriod) {
        request.terminationDatePeriod = filters.terminationDatePeriod;
        request.terminationDateFrom = DateFieldValidationUtility.serializeDateForApi(moment(filters.terminationDate));
      }
    }

    return request;
  }

  private loadUnitHolds(request: HoldDetailsRequest): void {
    this.isLoadingUnitHolds = true;
    this.hasUnitHoldsError = false;

    this.service.getUnitHolds(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (holds) => {
          this.filteredUnitHolds = holds;
          if (this.holdDetails) {
            this.holdDetails.unitHolds.holds = holds;
          }
          this.isLoadingUnitHolds = false;
        },
        error: (err) => {
          this.isLoadingUnitHolds = false;
          this.hasUnitHoldsError = true;
          this.unitHoldsErrorMessage = err?.error?.message || 'Failed to load unit holds.';
        }
      });
  }

  private loadDonorHolds(request: HoldDetailsRequest): void {
    this.isLoadingDonorHolds = true;
    this.hasDonorHoldsError = false;

    this.service.getDonorHolds(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (holds) => {
          this.filteredDonorHolds = holds;
          if (this.holdDetails) {
            this.holdDetails.donorHolds.holds = holds;
          }
          this.isLoadingDonorHolds = false;
        },
        error: (err) => {
          this.isLoadingDonorHolds = false;
          this.hasDonorHoldsError = true;
          this.donorHoldsErrorMessage = err?.error?.message || 'Failed to load donor holds.';
        }
      });
  }

  onButtonClick(action: string): void {
    if (action === 'close') {
      this.closePanel.emit();
    }
  }

  onClose(): void {
    this.closePanel.emit();
  }

  onFilterClick(section: 'unit' | 'donor'): void {
    this.activeFilterSection = section;

    // Set active state
    if (section === 'unit') {
      this.isUnitFilterOpen = true;
    } else {
      this.isDonorFilterOpen = true;
    }

    const filterBtnElement = section === 'unit'
      ? this.unitFilterBtn?.nativeElement
      : this.donorFilterBtn?.nativeElement;

    if (!filterBtnElement) {
      return;
    }

    const positionStrategy: FlexibleConnectedPositionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(filterBtnElement)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -4
        }
      ])
      .withPush(false)
      .withFlexibleDimensions(true)
      .withViewportMargin(8);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const filterPortal = new ComponentPortal(HoldDetailsFilterPanel);
    const filterComponentRef = this.overlayRef.attach(filterPortal);

    // Pass section type and current filters to the panel
    filterComponentRef.instance.section = section;
    filterComponentRef.instance.currentFilters = section === 'unit'
      ? this.unitHoldsFilters
      : this.donorHoldsFilters;

    // Handle apply event
    filterComponentRef.instance.apply.pipe(takeUntil(this.destroy$)).subscribe((filters: HoldDetailsFilterValue) => {
      if (section === 'unit') {
        this.unitHoldsFilters = filters;
        this.applyUnitHoldsFilter(filters);
      } else {
        this.donorHoldsFilters = filters;
        this.applyDonorHoldsFilter(filters);
      }
      this.closeFilterPanel();
    });

    filterComponentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });

    this.overlayRef.backdropClick().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeFilterPanel();
    });
  }

  private closeFilterPanel(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;

    const triggerBtn = this.activeFilterSection === 'unit'
      ? this.unitFilterBtn?.nativeElement
      : this.activeFilterSection === 'donor'
        ? this.donorFilterBtn?.nativeElement
        : null;

    if (this.activeFilterSection === 'unit') {
      this.isUnitFilterOpen = false;
    } else if (this.activeFilterSection === 'donor') {
      this.isDonorFilterOpen = false;
    }

    this.activeFilterSection = null;

    if (triggerBtn) {
      triggerBtn.focus();
    }
  }

  /* -------------------------------- FILTER LOGIC -------------------------------- */

  private applyUnitHoldsFilter(filters: HoldDetailsFilterValue | null): void {
    this.unitFilterChips = this.buildFilterChips(filters);
    const request = this.buildBaseRequest(filters);
    this.loadUnitHolds(request);
  }

  private applyDonorHoldsFilter(filters: HoldDetailsFilterValue | null): void {
    this.donorFilterChips = this.buildFilterChips(filters);
    const request = this.buildBaseRequest(filters);
    this.loadDonorHolds(request);
  }

  private readonly holdsLabelMap: Record<string, string> = {
    'Active': 'Active Holds',
    'All': 'All Holds',
    'ActiveDonation': 'Active Donation Holds',
    'AllDonation': 'All Donation Holds'
  };

  private buildFilterChips(filters: HoldDetailsFilterValue | null): FilterChip[] {
    if (!filters) return [];
    const chips: FilterChip[] = [];

    if (filters.holds) {
      chips.push({
        key: 'holds',
        label: `Holds: ${this.holdsLabelMap[filters.holds] || filters.holds}`,
        value: filters.holds
      });
    }

    if (filters.entryDate && filters.entryDatePeriod) {
      const dateStr = DateFieldValidationUtility.formatDateForUI(moment(filters.entryDate));
      const operator = filters.entryDatePeriod === 'after' ? '≥' : '≤';
      chips.push({
        key: 'entryDate',
        label: `Entry Date ${operator} ${dateStr}`,
        value: filters.entryDate
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const dateStr = DateFieldValidationUtility.formatDateForUI(moment(filters.terminationDate));
      const operator = filters.terminationDatePeriod === 'after' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Term Date ${operator} ${dateStr}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  onRemoveUnitFilterChip(chipKey: string): void {
    if (!this.unitHoldsFilters) return;
    this.unitHoldsFilters = this.removeFilterByKey(this.unitHoldsFilters, chipKey);
    this.applyUnitHoldsFilter(this.unitHoldsFilters);
  }

  onRemoveDonorFilterChip(chipKey: string): void {
    if (!this.donorHoldsFilters) return;
    this.donorHoldsFilters = this.removeFilterByKey(this.donorHoldsFilters, chipKey);
    this.applyDonorHoldsFilter(this.donorHoldsFilters);
  }

  onClearUnitFilters(): void {
    this.unitHoldsFilters = null;
    this.unitFilterChips = [];
    this.applyUnitHoldsFilter(null);
  }

  onClearDonorFilters(): void {
    this.donorHoldsFilters = null;
    this.donorFilterChips = [];
    this.applyDonorHoldsFilter(null);
  }

  private removeFilterByKey(filters: HoldDetailsFilterValue, key: string): HoldDetailsFilterValue | null {
    const updated = { ...filters };
    if (key === 'holds') {
      delete updated.holds;
    } else if (key === 'entryDate') {
      delete updated.entryDatePeriod;
      delete updated.entryDate;
    } else if (key === 'terminationDate') {
      delete updated.terminationDatePeriod;
      delete updated.terminationDate;
    }

    const hasFilters = updated.holds || updated.entryDate || updated.terminationDate;
    return hasFilters ? updated : null;
  }
}
