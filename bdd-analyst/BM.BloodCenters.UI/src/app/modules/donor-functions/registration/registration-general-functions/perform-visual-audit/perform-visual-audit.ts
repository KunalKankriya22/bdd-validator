import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { UnitIdDisplayUtility } from '@shared/components/UnitIdDisplayUtility/unit-id-display.utility';
import { UnitIdDoubleEntryHelper } from '@shared/components/UnitIdDisplayUtility/unit-id-double-entry.helper';

import { PerformVisualAuditService, UnitValidationResult } from './services/perform-visual-audit.service';
import {
  AuditOption,
  AuditDecision,
  DeferralDecision,
  AuditUnit,
  DonorDetails,
  AuditCounts,
  DeferralCounts,
  ResetAuditForm,
  ResetOption,
  SearchUnitResponse,
  ReturnResult
} from './models/perform-visual-audit.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HeaderService } from '@shared/services/header.service';
import { UnitIdFieldComponent, UnitValidationResponse, UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import moment from 'moment';

@Component({
  selector: 'app-perform-visual-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
    UnitIdFieldComponent,
    A11yModule
  ],
  templateUrl: './perform-visual-audit.html',
  styleUrls: ['./perform-visual-audit.scss']
})
export class PerformVisualAuditComponent implements OnInit, OnDestroy {
  @ViewChild(SearchBar) searchBarComponent!: SearchBar;
  @ViewChild('holdReasonInput') holdReasonInput?: NgModel;
  @ViewChild('mainUnitIdField') mainUnitIdField?: UnitIdFieldComponent;
  @ViewChild('resetUnitIdField') resetUnitIdField?: UnitIdFieldComponent;
  @ViewChild('resetAuditTrigger') resetAuditTriggerRef!: ElementRef;

  headerConfig: PageHeaderConfig = { breadcrumbs: [], actions: [] };

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by Unit ID',
    minLength: 1,
    ariaLabel: 'Search by Unit ID',
    searchOnEnterOnly: false
  };

  readonly donationColumns: string[] = ['unitId', 'audit', 'collectionDate', 'donationType', 'procedureCode', 'holdReason', 'actions'];
  readonly deferralColumns: string[] = ['deferralId', 'deferralType', 'collectionDate', 'donationType', 'procedureCode', 'deferralCode', 'deferredThrough', 'comment', 'actions'];

  get displayedColumns(): string[] {
    return this.selectedOption === 'Donation' ? this.donationColumns : this.deferralColumns;
  }

  dataSource = new MatTableDataSource<AuditUnit>([]);

  selectedOption: AuditOption = 'Donation';
  selectedAuditDecision: AuditDecision = 'OK';
  selectedDeferralDecision: DeferralDecision = 'NODEF';
  optionList: string[] = ['Donation', 'Deferral'];
  auditDecisionList: AuditDecision[] = ['OK', 'HOLD'];
  deferralDecisionList: { value: DeferralDecision; label: string }[] = [
    { value: 'NODEF', label: 'No Deferral' },
    { value: 'TDEF', label: 'Temp Def' },
    { value: 'PDEF', label: 'Indef Def' }
  ];

  units: AuditUnit[] = [];
  donorDetails: DonorDetails | null = null;
  selectedUnit: AuditUnit | null = null;
  private donorDetailsMap = new Map<string, DonorDetails>();
  private unitIdDisplayMap = new Map<string, string>(); // parsedUnitId → formatted manualUnitId
  auditCounts: AuditCounts = { totalDonations: 0, totalHolds: 0, totalOks: 0 };
  deferralCounts: DeferralCounts = { noDef: 0, tempDef: 0, indDef: 0 };

  private enteredIds = new Set<string>();
  inputRowError = '';
  unitValidationState: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';

  // Double-entry helper for deferral ID (main table — donation uses app-unit-id-field)
  readonly deferralDoubleEntry = new UnitIdDoubleEntryHelper<UnitValidationResult>();

  // Double-entry helper for deferral ID in reset panel (donation uses app-unit-id-field)
  readonly resetDeferralDoubleEntry = new UnitIdDoubleEntryHelper<UnitValidationResult>();

  // Holds the postValidate event while the collection-date picker is open
  private pendingPostValidateEvent: UnitIdPostValidateEvent | null = null;

  pendingCollectionDates: string[] = [];
  pendingId = '';
  pendingIsRowSearch = false;
  selectedCollectionDate = '';
  showCollectionDatePicker = false;

  isResetPanelOpen = false;
  resetForm: ResetAuditForm = this.emptyResetForm();
  get resetStatusList(): string[] {
    return this.resetForm.option === 'Donation' ? ['OK', 'HOLD', 'Unaudited'] : ['Unaudited'];
  }
  isResetting = false;
  isResetSearching = false;
  resetSearchError = '';
  resetSearchDone = false;
  resetHoldReasonTouched = false;
  isLoading = false;
  isSearchingRow = false;
  isSaving = false;
  hasUnsavedChanges = false;
  newDeferralId = '';

  private readonly DONATION_INPUT_ROW: AuditUnit = {
    __isInputRow: true, unitId: '', audit: 'OK',
    collectionDate: '', donationType: '', procedureCode: ''
  };

  private readonly DEFERRAL_INPUT_ROW: AuditUnit = {
    __isInputRow: true, deferralId: '', audit: 'OK', deferralDecision: 'NODEF',
    collectionDate: '', donationType: '', procedureCode: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private auditService: PerformVisualAuditService,
    private headerService: HeaderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.headerConfig = {
      title: 'Perform Visual Audit',
      subtitle: 'Audit donations or deferrals and update their status.',
      breadcrumbs: [
        { label: 'Home', link: '/home' },
        { label: 'Perform Visual Audit', link: '' }
      ],
      actions: []
    };
  }

  ngOnInit(): void {
    this.loadResetOptions();
    this.syncDataSource();
    this.subscribeToChapterChanges();
    this.handleIncomingNavigation();
    this.dataSource.filterPredicate = (data: AuditUnit, filter: string) => {
      if ((data as any).__isInputRow) return true;
      if (!filter) return true;
      const id = (this.isDonation ? data.unitId : data.deferralId) || '';
      return id.toLowerCase().includes(filter);
    };
  }

  private loadResetOptions(): void {
    this.auditService.getResetOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options: ResetOption[]) => {
          if (options.length > 0) {
            this.optionList = options.map(o => o.description);
            if (!this.optionList.includes(this.selectedOption)) {
              this.selectedOption = this.optionList[0] as AuditOption;
            }
          }
        },
        error: () => {
          // keep static fallback ['Donation', 'Deferral']
        }
      });
  }

  private handleIncomingNavigation(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || window.history.state;

    // Handle navigation from Donations Pending Audit Query
    if (state?.unitId) {
      this.selectedOption = 'Donation';
      this.updateSearchPlaceholder();
      setTimeout(() => {
        this.onSearch(state.unitId);
      }, 0);
    }

    // Handle navigation from Deferrals Pending Audit Query
    if (state?.deferralId && state?.auditType === 'Deferral') {
      this.selectedOption = 'Deferral';
      this.updateSearchPlaceholder();
      setTimeout(() => {
        this.onSearch(state.deferralId);
      }, 0);
    }
  }

  private updateSearchPlaceholder(): void {
    this.searchConfig = {
      ...this.searchConfig,
      placeholder: this.isDonation ? 'Search by Unit ID' : 'Search by Deferral ID',
      ariaLabel: this.isDonation ? 'Search by Unit ID' : 'Search by Deferral ID'
    };
    this.dataSource.filter = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canDeactivate(): boolean {
    return !this.hasUnsavedChanges;
  }

  get isDonation(): boolean { return this.selectedOption === 'Donation'; }

  get canSave(): boolean {
    if (!this.hasUnsavedChanges || this.isSaving) return false;
    if (this.isDonation) {
      return !this.units.some(u => u.audit === 'HOLD' && !u.holdReason?.trim());
    }
    return !this.units.some(u =>
      (u.deferralDecision === 'TDEF' || u.deferralDecision === 'PDEF') && !u.holdReason?.trim()
    );
  }

  // Template accessors for deferral double-entry state
  get showDeferralDoubleEntryPrompt(): boolean { return this.deferralDoubleEntry.isPending; }
  get showResetDeferralDoubleEntryPrompt(): boolean { return this.resetDeferralDoubleEntry.isPending; }

  onOptionChange(): void {
    this.clearAll();
    this.updateSearchPlaceholder();
  }

  onTableSearch(searchText: string): void {
    this.dataSource.filter = (searchText || '').trim().toLowerCase();
    if (this.selectedUnit && this.dataSource.filter) {
      const id = (this.isDonation ? this.selectedUnit.unitId : this.selectedUnit.deferralId) || '';
      if (!id.toLowerCase().includes(this.dataSource.filter)) {
        this.selectedUnit = null;
        this.donorDetails = null;
      }
    }
  }

  onRowClick(unit: AuditUnit): void {
    if ((unit as any).__isInputRow) return;
    this.selectedUnit = unit;
    const id = unit.unitId || unit.deferralId || '';
    this.donorDetails = this.donorDetailsMap.get(id) || null;
  }

  onRowSpaceKey(event: Event, row: AuditUnit): void {
    if (row.__isInputRow) return;
    const kbEvent = event as KeyboardEvent;
    const target = kbEvent.target as HTMLElement;
    if (target !== kbEvent.currentTarget && ['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(target.tagName)) return;
    kbEvent.preventDefault();
    this.onRowClick(row);
  }

  onSearch(id: string): void {
    if (!id?.trim()) return;
    this.isLoading = true;
    this.inputRowError = '';
    const stripped = this.stripBarcodeChars(id.trim());

    if (!this.isDonation && !/^\d{8}$/.test(stripped)) {
      this.inputRowError = 'Invalid deferral ID format. Must be 8 numeric digits.';
      this.isLoading = false;
      return;
    }

    this.performSearch(stripped, false);
  }

  // Called by app-unit-id-field in the donation input row (postValidate = run search before marking valid)
  onMainUnitPostValidate(event: UnitIdPostValidateEvent): void {
    const parsedUnitId = event.data.parsedUnitId;
    const manualUnitId = event.data.manualUnitId || parsedUnitId;

    if (this.enteredIds.has(parsedUnitId)) {
      event.reject('This unit has already been entered in the current session.');
      return;
    }

    const chapterId = this.headerService.getCurrentChapterId();
    this.auditService.searchByUnitId({ option: 'Donation', unitId: parsedUnitId, chapterId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.units.some(u => u.auditStatus === 'HOLD')) {
            event.reject('This unit is already on HOLD and cannot be re-audited.');
            return;
          }

          if (response.units.some(u => u.auditStatus === 'OK')) {
            this.dialog.open(ConfirmActionDialogComponent, {
              width: '400px',
              disableClose: true,
              data: {
                title: 'Already Audited',
                message: 'This Donation has already been audited as OK. Do you want to continue?',
                confirmText: 'YES',
                cancelText: 'NO'
              }
            }).afterClosed()
              .pipe(takeUntil(this.destroy$))
              .subscribe(confirmed => {
                if (!confirmed) {
                  event.reject('');
                  setTimeout(() => this.mainUnitIdField?.clear(), 0);
                  return;
                }
                this.unitIdDisplayMap.set(parsedUnitId, manualUnitId);
                if (response.multipleCollectionDates) {
                  this.pendingPostValidateEvent = event;
                  this.handleSearchResponse(response, parsedUnitId, true);
                } else {
                  this.handleSearchResponse(response, parsedUnitId, true);
                  event.confirm();
                }
              });
            return;
          }

          this.unitIdDisplayMap.set(parsedUnitId, manualUnitId);
          if (response.multipleCollectionDates) {
            this.pendingPostValidateEvent = event;
            this.handleSearchResponse(response, parsedUnitId, true);
          } else {
            this.handleSearchResponse(response, parsedUnitId, true);
            event.confirm();
          }
        },
        error: (err) => {
          const body = err?.error;
          event.reject(body?.errorResponse?.error || body?.message || body?.error || 'Not found or failed to search.');
        }
      });
  }

  // Called after app-unit-id-field marks valid (after confirm()) — clear the field so the next unit can be entered
  onMainUnitValidated(_: UnitValidationResponse): void {
    setTimeout(() => this.mainUnitIdField?.clear(), 0);
  }

  // Deferral-mode input row search (donation mode uses app-unit-id-field above)
  onDeferralSearch(): void {
    const raw = this.newDeferralId;
    if (!raw?.trim()) {
      this.unitValidationState = 'idle';
      return;
    }

    const stripped = this.stripBarcodeChars(raw.trim());

    if (this.deferralDoubleEntry.isPending) {
      const result = this.deferralDoubleEntry.verify(stripped);
      if (result === 'confirmed') {
        const validationResult = this.deferralDoubleEntry.validatedData;
        if (!validationResult) return;

        const validatedUnitId = validationResult.parsedUnitId || stripped;
        this.inputRowError = '';
        this.unitValidationState = 'valid';

        if (this.enteredIds.has(validatedUnitId)) {
          this.inputRowError = 'This deferral has already been entered in the current session.';
          this.unitValidationState = 'invalid';
          return;
        }

        this.isSearchingRow = true;
        this.performSearch(validatedUnitId, true);
      } else {
        this.inputRowError = 'Unit IDs do not match. Please try again.';
        this.unitValidationState = 'invalid';
        this.newDeferralId = '';
      }
      return;
    }

    this.inputRowError = '';
    this.unitValidationState = 'validating';
    this.isSearchingRow = true;

    if (!/^\d{8}$/.test(stripped)) {
      this.inputRowError = 'Invalid deferral ID format. Must be 8 numeric digits.';
      this.unitValidationState = 'invalid';
      this.isSearchingRow = false;
      return;
    }

    const wasScanned = raw.length > stripped.length;
    if (!wasScanned) {
      this.deferralDoubleEntry.start(stripped, { isValid: true, parsedUnitId: stripped } as UnitValidationResult);
      this.inputRowError = '';
      this.unitValidationState = 'idle';
      this.newDeferralId = '';
      this.isSearchingRow = false;
      return;
    }

    this.unitValidationState = 'valid';
    if (this.enteredIds.has(stripped)) {
      this.inputRowError = 'This deferral has already been entered in the current session.';
      this.unitValidationState = 'invalid';
      this.isSearchingRow = false;
      return;
    }
    this.performSearch(stripped, true);
  }


  private stripBarcodeChars(input: string): string {
    // CODE128 format: =NFFFYYSSSSSSFF (16 chars, remove leading '=')
    if (input.startsWith('=') && input.length === 16) return input.substring(1);
    // Codabar format: DSSSSSSSD (9 chars, remove leading and trailing 'D')
    if (input.startsWith('D') && input.endsWith('D') && input.length === 9) return input.substring(1, 8);
    return input;
  }

  /**
   * Format unit ID for display using the utility
   */
  formatUnitIdForDisplay(unitId: string): string {
    if (!unitId) return '';
    // Use manualUnitId (15 chars, includes check digit) when available — parsedUnitId is 13 chars and won't format
    const displayId = this.unitIdDisplayMap.get(unitId) ?? unitId;
    return UnitIdDisplayUtility.formatCode128(displayId);
  }

  private performSearch(id: string, isRowSearch: boolean): void {
    const chapterId = this.headerService.getCurrentChapterId();
    const request = this.isDonation
      ? { option: this.selectedOption, unitId: id, chapterId }
      : { option: this.selectedOption, deferralId: id, chapterId };

    this.auditService
      .searchByUnitId(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const alreadyHold = response.units.some(u => u.auditStatus === 'HOLD');
          const alreadyOk = response.units.some(u => u.auditStatus === 'OK');

          if (alreadyHold) {
            this.showError('This unit is already on HOLD and cannot be re-audited.');
            this.isLoading = false;
            this.isSearchingRow = false;
            return;
          }

          if (alreadyOk) {
            const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
              width: '400px',
              disableClose: true,
              data: {
                title: 'Already Audited',
                message: 'This Donation has already been audited as OK. Do you want to continue?',
                confirmText: 'YES',
                cancelText: 'NO'
              }
            });
            dialogRef.afterClosed()
              .pipe(takeUntil(this.destroy$))
              .subscribe((confirmed) => {
                if (!confirmed) {
                  this.isLoading = false;
                  this.isSearchingRow = false;
                  return;
                }
                this.handleSearchResponse(response, id, isRowSearch);
              });
            return;
          }

          this.handleSearchResponse(response, id, isRowSearch);
        },
        error: (err) => {
          const body = err?.error;
          const errorCode = body?.errorResponse?.errorCode;
          const msg = body?.errorResponse?.error || body?.message || body?.error || 'Not found or failed to search.';
          if (errorCode === '16203') {
            this.dialog.open(ConfirmActionDialogComponent, {
              width: '400px',
              disableClose: true,
              data: { title: 'Error', message: `${errorCode}: ${msg}`, confirmText: 'OK' }
            });
          } else {
            this.inputRowError = msg;
          }
          this.isLoading = false;
          this.isSearchingRow = false;
        }
      });
  }

  private handleSearchResponse(response: SearchUnitResponse, id: string, isRowSearch: boolean): void {
    if (response.multipleCollectionDates) {
      this.pendingCollectionDates = [...new Set(response.units.map(u => u.collectionDate).filter(Boolean))];
      this.pendingId = id;
      this.pendingIsRowSearch = isRowSearch;
      this.selectedCollectionDate = '';
      this.showCollectionDatePicker = true;
      this.isLoading = false;
      this.isSearchingRow = false;
    } else {
      this.enteredIds.add(id);
      this.applySearchResponse(response, isRowSearch);
    }
  }

  onCollectionDateSelected(): void {
    if (!this.selectedCollectionDate) return;
    const id = this.pendingId;
    const isRowSearch = this.pendingIsRowSearch;
    this.showCollectionDatePicker = false;
    this.pendingCollectionDates = [];

    const chapterId = this.headerService.getCurrentChapterId();
    const request = this.isDonation
      ? { option: this.selectedOption, unitId: id, chapterId, collectionDate: this.selectedCollectionDate }
      : { option: this.selectedOption, deferralId: id, chapterId, collectionDate: this.selectedCollectionDate };

    this.isSearchingRow = isRowSearch;
    this.isLoading = !isRowSearch;

    this.auditService.searchByUnitId(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.enteredIds.add(id);
          this.units = this.units.filter(u => (u.unitId || u.deferralId) !== id);
          const filtered: SearchUnitResponse = {
            ...response,
            units: response.units.filter(u => u.collectionDate === this.selectedCollectionDate)
          };
          this.applySearchResponse(filtered, isRowSearch);
          if (this.pendingPostValidateEvent) {
            this.pendingPostValidateEvent.confirm();
            this.pendingPostValidateEvent = null;
          }
        },
        error: (err) => {
          const body = err?.error;
          const msg = body?.errorResponse?.error || body?.message || body?.error || 'Not found or failed to search.';
          this.inputRowError = msg;
          this.isLoading = false;
          this.isSearchingRow = false;
          if (this.pendingPostValidateEvent) {
            this.pendingPostValidateEvent.reject(msg);
            this.pendingPostValidateEvent = null;
          }
        }
      });
  }

  onCollectionDateCancelled(): void {
    if (this.pendingPostValidateEvent) {
      this.pendingPostValidateEvent.reject('');
      setTimeout(() => this.mainUnitIdField?.clear(), 0);
      this.pendingPostValidateEvent = null;
    }
    this.showCollectionDatePicker = false;
    this.pendingCollectionDates = [];
    this.pendingId = '';
    this.selectedCollectionDate = '';
  }

  private applySearchResponse(response: SearchUnitResponse, isRowSearch: boolean): void {
    this.inputRowError = '';
    if (!isRowSearch) {
      this.donorDetails = response.donorDetails;
    }

    const mapUnits = (units: AuditUnit[]) => units.map((unit: AuditUnit) => {
      const mapped = {
        ...unit,
        audit: this.isDonation ? this.selectedAuditDecision : unit.audit,
        deferralDecision: !this.isDonation
          ? (['NODEF', 'TDEF', 'PDEF'].includes(unit.deferralType ?? '') ? unit.deferralType as DeferralDecision : this.selectedDeferralDecision)
          : unit.deferralDecision,
        isModified: false
      };
      const id = mapped.unitId || mapped.deferralId || '';
      if (id && response.donorDetails) {
        this.donorDetailsMap.set(id, response.donorDetails);
      }
      return mapped;
    });

    if (isRowSearch) {
      const newUnits = mapUnits(response.units);
      this.units = [...this.units, ...newUnits];
      if (newUnits.length > 0) {
        const lastUnit = newUnits[newUnits.length - 1];
        const lastId = lastUnit.unitId || lastUnit.deferralId || '';
        this.selectedUnit = lastUnit;
        this.donorDetails = this.donorDetailsMap.get(lastId) || null;
      } else {
        this.selectedUnit = null;
      }
      if (!this.isDonation) this.newDeferralId = '';
      this.isSearchingRow = false;
      if (newUnits.length > 0) this.hasUnsavedChanges = true;
    } else {
      this.units = mapUnits(response.units);
      this.selectedUnit = null;
      this.isLoading = false;
    }
    this.syncDataSource();
    this.calculateCounts();
    if (!isRowSearch) this.hasUnsavedChanges = false;
  }

  onAuditChange(unit: AuditUnit, value: AuditDecision): void {
    unit.audit = value;
    unit.isModified = true;
    this.hasUnsavedChanges = true;
    this.calculateCounts();
  }

  onDeferralDecisionChange(unit: AuditUnit, value: DeferralDecision): void {
    unit.deferralDecision = value;
    if (value === 'NODEF') {
      unit.holdReason = '';
      unit.deferredTill = '';
    } else if (value === 'PDEF') {
      unit.deferredTill = '';
    }
    unit.isModified = true;
    this.hasUnsavedChanges = true;
    this.calculateCounts();
  }

  onDeleteUnit(unit: AuditUnit): void {
    const id = unit.unitId || unit.deferralId || '';
    this.enteredIds.delete(id);
    this.donorDetailsMap.delete(id);
    this.unitIdDisplayMap.delete(id);
    this.units = this.units.filter(u => u !== unit);
    if (this.selectedUnit === unit) {
      this.selectedUnit = null;
      this.donorDetails = null;
    }
    this.syncDataSource();
    this.hasUnsavedChanges = true;
    this.calculateCounts();
  }

  onClearInputRow(): void {
    if (this.isDonation) {
      this.mainUnitIdField?.clear();
    } else {
      this.newDeferralId = '';
      this.inputRowError = '';
      this.unitValidationState = 'idle';
      this.deferralDoubleEntry.reset();
    }
  }

  onOpenResetPanel(): void {
    this.resetForm = this.emptyResetForm();
    this.resetSearchError = '';
    this.resetSearchDone = false;
    this.resetHoldReasonTouched = false;
    this.resetDeferralDoubleEntry.reset();
    this.isResetPanelOpen = true;
  }

  onCloseResetPanel(): void {
    this.isResetPanelOpen = false;
    this.resetDeferralDoubleEntry.reset();
    setTimeout(() => this.resetAuditTriggerRef?.nativeElement?.focus(), 0);
  }

  // Called by app-unit-id-field in the reset panel (Donation mode) after format validation
  onResetUnitValidated(event: UnitValidationResponse): void {
    this.resetSearchDone = false;
    this.resetSearchError = '';
    this.resetForm.donorId = '';
    this.resetForm.name = '';
    this.resetForm.dateOfBirth = '';
    this.resetForm.gender = '';
    this.resetForm.currentAuditStatus = '';
    this.resetForm.currentReason = '';
    this.isResetSearching = true;
    this.performResetSearch(event.parsedUnitId);
  }

  // Called when the reset panel unit-id-field is cleared (donation mode)
  onResetUnitCleared(): void {
    this.resetSearchDone = false;
    this.resetSearchError = '';
    this.resetForm.donorId = '';
    this.resetForm.name = '';
    this.resetForm.dateOfBirth = '';
    this.resetForm.gender = '';
    this.resetForm.currentAuditStatus = '';
    this.resetForm.currentReason = '';
  }

  // Deferral-mode search in the reset panel (donation mode uses app-unit-id-field above)
  onResetDeferralIdSearch(): void {
    if (!this.resetForm.id?.trim()) return;
    if (this.resetSearchDone || this.isResetSearching) return;

    const raw = this.resetForm.id;
    const stripped = this.stripBarcodeChars(raw.trim());

    if (this.resetDeferralDoubleEntry.isPending) {
      const result = this.resetDeferralDoubleEntry.verify(stripped);
      if (result === 'confirmed') {
        const validationResult = this.resetDeferralDoubleEntry.validatedData;
        if (!validationResult) return;

        const validatedUnitId = validationResult.parsedUnitId || stripped;
        this.resetSearchError = '';
        this.isResetSearching = true;
        this.performResetSearch(validatedUnitId);
      } else {
        this.resetSearchError = 'Unit IDs do not match. Please try again.';
        this.resetForm.id = '';
      }
      return;
    }

    this.resetSearchError = '';
    this.isResetSearching = true;

    if (!/^\d{8}$/.test(stripped)) {
      this.resetSearchError = 'Invalid deferral ID format. Must be 8 numeric digits.';
      this.isResetSearching = false;
      return;
    }

    const wasScanned = raw.length > stripped.length;
    if (!wasScanned) {
      this.resetDeferralDoubleEntry.start(stripped, { isValid: true, parsedUnitId: stripped } as UnitValidationResult);
      this.resetSearchError = '';
      this.resetForm.id = '';
      this.isResetSearching = false;
      return;
    }

    this.performResetSearch(stripped);
  }

  private performResetSearch(id: string): void {
    const chapterId = this.headerService.getCurrentChapterId();
    const request = this.resetForm.option === 'Donation'
      ? { option: this.resetForm.option, unitId: id, chapterId, forReset: true }
      : { option: this.resetForm.option, deferralId: id, chapterId, forReset: true };

    this.auditService.searchByUnitId(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const donor = response.donorDetails;
          const unit = response.units?.[0];

          this.resetForm.donorId = donor?.donorId || '';
          this.resetForm.name = donor?.name || '';
          this.resetForm.dateOfBirth = donor?.dateOfBirth ? this.formatDate(donor.dateOfBirth) : '';
          this.resetForm.gender = donor?.sex || '';
          this.resetForm.currentAuditStatus = unit?.auditStatus ?? '';
          this.resetForm.currentReason = unit?.holdReason || '';
          this.isResetSearching = false;
          this.resetSearchDone = true;
          this.resetDeferralDoubleEntry.reset();
        },
        error: (err) => {
          const body = err?.error;
          const errorCode = body?.errorResponse?.errorCode;
          const msg = body?.errorResponse?.error || body?.message || body?.error || 'No record found for the entered ID.';
          this.resetForm.donorId = '';
          this.resetForm.name = '';
          this.resetForm.dateOfBirth = '';
          this.resetForm.gender = '';
          this.resetForm.currentAuditStatus = '';
          this.resetForm.currentReason = '';
          this.isResetSearching = false;
          this.resetDeferralDoubleEntry.reset();
          if (errorCode === '16327') {
            this.dialog.open(ConfirmActionDialogComponent, {
              width: '400px',
              disableClose: true,
              data: { title: 'Error', message: `${errorCode}: ${msg}`, confirmText: 'OK' }
            });
          } else {
            this.resetSearchError = msg;
          }
        }
      });
  }

  onResetOptionChange(): void {
    const currentOption = this.resetForm.option;
    this.resetForm = this.emptyResetForm();
    this.resetForm.option = currentOption;
    this.resetSearchError = '';
    this.resetSearchDone = false;
    this.resetHoldReasonTouched = false;
    this.resetDeferralDoubleEntry.reset();
    this.resetUnitIdField?.clear();
  }

  onResetNewStatusChange(): void {
    this.resetForm.holdReason = '';
    this.holdReasonInput?.control.markAsUntouched();
    this.resetHoldReasonTouched = false;
  }

  onSaveReset(): void {
    this.doResetSave(false);
  }

  onResetAndSave(): void {
    this.doResetSave(true);
  }

  private doResetSave(resetAnother: boolean): void {
    const idToCheck = this.resetForm.option === 'Donation'
      ? (this.resetUnitIdField?.parsedUnitId ?? this.resetForm.id)
      : this.resetForm.id;
    if (!idToCheck?.trim()) { this.showError('ID is required.'); return; }
    if (!this.resetForm.newAuditStatus) { this.showError('New Audit Status is required.'); return; }

    if (this.resetForm.option === 'Deferral' && this.resetForm.newAuditStatus !== 'Unaudited') {
      this.showError('Deferral reset only supports clearing the audit (set to blank).');
      return;
    }

    if (this.resetForm.newAuditStatus === 'HOLD' && !this.resetForm.holdReason?.trim()) {
      this.holdReasonInput?.control.markAsTouched();
      this.resetHoldReasonTouched = true;
      this.showError('Hold Reason is required when setting status to HOLD.');
      return;
    }

    const confirmRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: { title: 'Reset Audit Flag', message: 'Are you sure you want to reset the audit?\nThis action will reset the selected audit flag.', confirmText: 'RESET AUDIT', cancelText: 'CANCEL' }
    });
    confirmRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (!confirmed) return;

      this.isResetting = true;
      const chapterId = this.headerService.getCurrentChapterId();
      const newStatus = this.resetForm.newAuditStatus === 'Unaudited' ? null : this.resetForm.newAuditStatus;
      const idToUse = this.resetForm.option === 'Donation'
        ? (this.resetUnitIdField?.parsedUnitId ?? this.resetForm.id)
        : this.resetForm.id;
      const request = {
        option: this.resetForm.option,
        ...(this.resetForm.option === 'Donation' ? { unitId: idToUse } : { deferralId: idToUse }),
        newStatus,
        holdReason: this.resetForm.newAuditStatus === 'HOLD' ? this.resetForm.holdReason : null,
        chapterId
      };
      this.auditService.resetAudit(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
        next: (res: ReturnResult<void>) => {
          this.isResetting = false;
          this.showSuccess('Audit reset successfully.');
          const msg: string = res?.message || '';
          if (msg.includes('16325')) {
            this.showWarning('Products have been shipped for this unit. Lab data will be cleared.');
          }
          if (msg.includes('16324')) {
            this.showInfo('Lab interface has already processed this unit.');
          }
          // Remove reset unit from main audit list if present
          const resetId = idToUse;
          this.units = this.units.filter(u =>
            (this.resetForm.option === 'Donation' ? u.unitId : u.deferralId) !== resetId
          );
          this.syncDataSource();
          this.calculateCounts();
          // Always clear the reset form so it's ready for the next entry
          this.resetHoldReasonTouched = false;
          this.resetForm = this.emptyResetForm();
          this.resetSearchDone = false;
          this.resetSearchError = '';
          this.resetDeferralDoubleEntry.reset();
          this.resetUnitIdField?.clear();
          if (!resetAnother) {
            this.isResetPanelOpen = false;
          }
        },
        error: (err) => {
          const body = err?.error;
          const msg = body?.errorResponse?.error || body?.message || body?.error || 'Failed to reset audit.';
          this.resetSearchError = msg;
          this.isResetting = false;
        }
      });
    });
  }

  private emptyResetForm(): ResetAuditForm {
    return {
      option: 'Donation',
      id: '', donorId: '', name: '', dateOfBirth: '',
      gender: '', currentAuditStatus: '', currentReason: '',
      newAuditStatus: '', holdReason: ''
    };
  }

  onCancel(): void {
    if (!this.hasUnsavedChanges) { this.clearAll(); return; }
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { title: 'Unsaved Changes', message: 'You have unsaved changes. Are you sure you want to cancel?', confirmText: 'YES', cancelText: 'NO' }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) this.clearAll();
    });
  }

  onSave(): void {
    if (!this.hasUnsavedChanges) { this.showError('No changes to save.'); return; }
    if (this.isDonation) {
      const missingHoldReason = this.units.some(u => u.audit === 'HOLD' && !u.holdReason?.trim());
      if (missingHoldReason) {
        this.showError('Hold Reason is required for all units marked as HOLD.');
        return;
      }
    } else {
      const missingHoldReason = this.units.some(
        u => (u.deferralDecision === 'TDEF' || u.deferralDecision === 'PDEF') && !u.holdReason?.trim()
      );
      if (missingHoldReason) {
        this.showError('Comment is required for all TDEF and PDEF deferrals.');
        return;
      }
    }
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { title: 'Audit Confirmation', message: 'Are you sure you want to save the audit changes?\nThis action will proceed with saving all the audit records.', confirmText: 'SAVE', cancelText: 'CANCEL' }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (!confirmed) return;
      this.executeSave();
    });
  }

  private executeSave(): void {
    this.isSaving = true;
    const chapterId = this.headerService.getCurrentChapterId();
    this.auditService.saveAudit({
      option: this.selectedOption,
      chapterId,
      units: this.units.map(u => this.isDonation
        ? {
            unitId: u.unitId,
            transactionId: u.transactionId,
            audit: u.audit,
            holdReason: u.holdReason,
            collectionDate: u.collectionDate,
            donationType: u.donationType
          }
        : {
            deferralId: u.deferralId,
            transactionId: u.transactionId,
            deferralType: u.deferralDecision,
            holdReason: (u.deferralDecision === 'TDEF' || u.deferralDecision === 'PDEF') ? u.holdReason : undefined,
            deferredTill: u.deferralDecision === 'TDEF' ? (u.deferredTill || null) : null,
            collectionDate: u.collectionDate
          }
      )
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Audit saved successfully.');
          this.hasUnsavedChanges = false;
          this.units.forEach(u => (u.isModified = false));
          this.isSaving = false;
        },
        error: () => { this.showError('Failed to save audit.'); this.isSaving = false; }
      });
  }

  private get inputRow(): AuditUnit {
    return this.isDonation ? this.DONATION_INPUT_ROW : this.DEFERRAL_INPUT_ROW;
  }

  private syncDataSource(): void {
    this.dataSource.data = [this.inputRow, ...this.units];
  }

  private clearAll(): void {
    this.units = [];
    this.donorDetails = null;
    this.selectedUnit = null;
    this.donorDetailsMap.clear();
    this.unitIdDisplayMap.clear();
    this.hasUnsavedChanges = false;
    this.mainUnitIdField?.clear();
    this.newDeferralId = '';
    this.inputRowError = '';
    this.unitValidationState = 'idle';
    this.enteredIds.clear();
    this.showCollectionDatePicker = false;
    this.pendingId = '';
    this.pendingCollectionDates = [];
    this.deferralDoubleEntry.reset();
    this.pendingPostValidateEvent = null;
    this.syncDataSource();
    this.calculateCounts();
  }

  private calculateCounts(): void {
    this.auditCounts.totalDonations = this.units.length;
    this.auditCounts.totalHolds = this.units.filter(u => u.audit === 'HOLD').length;
    this.auditCounts.totalOks = this.units.filter(u => u.audit === 'OK').length;
    this.deferralCounts.noDef = this.units.filter(u => u.deferralDecision === 'NODEF').length;
    this.deferralCounts.tempDef = this.units.filter(u => u.deferralDecision === 'TDEF').length;
    this.deferralCounts.indDef = this.units.filter(u => u.deferralDecision === 'PDEF').length;
  }

  formatDate(isoDate: string | null | undefined): string {
    if (!isoDate) return '';
    const m = moment(isoDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.clearAll());
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] });
  }

  private showWarning(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 7000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['warning-snackbar'] });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['info-snackbar'] });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] });
  }
}
