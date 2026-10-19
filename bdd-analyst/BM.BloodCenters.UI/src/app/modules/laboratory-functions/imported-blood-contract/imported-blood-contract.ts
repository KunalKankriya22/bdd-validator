import { Component, OnInit, OnDestroy, effect, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin, of, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { PageHeaderWithBreadcrumb } from '../../../shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '../../../shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '../../../shared/services/page-header.service';
import { HeaderService } from '../../../shared/services/header.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { ChapterAwareDateAdapter } from '../../../shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '../../../shared/date/date-formats';
import { DateFieldValidationUtility } from '../../../shared/components/DateFieldUtility/date-field-validation.utility';
import { ChapterTimezoneService } from '../../../shared/services/chapter-timezone.service';
import moment from 'moment';

import { ImportedBloodContractService } from './imported-blood-contract.service';
import {
  ContractLovItem,
  ContractResponse,
  CodeDescription,
  TestLovItem,
  EditableTestRow,
  CreateContractRequest,
  UpdateContractRequest,
  AddressModel,
  ContractTest,
  BulkUpsertContractTests,
  UpsertContractTestItem,
} from './imported-blood-contract.model';
import { AddressDialogComponent, AddressDialogData } from './address-dialog/address-dialog';
import { ContactsDialogComponent } from './contacts-dialog/contacts-dialog';

@Component({
  selector: 'app-imported-blood-contract',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './imported-blood-contract.html',
  styleUrls: ['./imported-blood-contract.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
})
export class ImportedBloodContractComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ImportedBloodContractService);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);
  readonly headerService = inject(HeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  readonly CONTRACT_TYPE = 'IM';

  // Page header
  headerConfig: PageHeaderConfig = { breadcrumbs: [], title: '', subtitle: '' };

  // Screen state
  isLoading = false;
  isContractLoaded = false;
  isNewMode = false;
  currentContractId = '';

  // LOV data
  readonly contractsLov = signal<ContractLovItem[]>([]);
  readonly barcodeProtocols = signal<CodeDescription[]>([]);
  readonly testsLov = signal<TestLovItem[]>([]);

  // Search dropdown
  readonly contractSearchControl = new FormControl('');
  readonly filteredContracts = computed(() => {
    const search = (this.contractSearch() || '').toLowerCase();
    const items = this.contractsLov();
    if (!search) return items;
    return items.filter(c =>
      c.contractId.toLowerCase().includes(search) ||
      c.company.toLowerCase().includes(search)
    );
  });
  private readonly contractSearch = signal('');
  @ViewChild('contractSelect') contractSelect?: MatSelect;

  // Barcode protocol dropdown
  readonly barcodeSearchControl = new FormControl('');
  readonly filteredBarcodes = computed(() => {
    const search = (this.barcodeSearch() || '').toLowerCase();
    const items = this.barcodeProtocols();
    if (!search) return items;
    return items.filter(b =>
      b.code.toLowerCase().includes(search) ||
      b.description.toLowerCase().includes(search)
    );
  });
  private readonly barcodeSearch = signal('');

  // Contract form
  contractForm!: FormGroup;
  selectedContract: ContractResponse | null = null;
  addressData: AddressModel | null = null;

  // Effective date for display (read-only in edit)
  chapterLocalDate: Date = new Date();

  // Unit ID Pattern options (static)
  readonly unitIdPatternOptions = [
    { code: '=', description: 'Check Digit' },
    { code: '&', description: 'No Check Digit' },
  ];

  // Result Output options (static)
  readonly resultOutputOptions = [
    { code: 'R', description: 'Reports' },
    { code: 'E', description: 'Electronic' },
    { code: 'B', description: 'Both' },
  ];

  // Contract Tests (inline editable)
  editableTestRows: EditableTestRow[] = [];
  dirtyTestRowIds = new Set<number>();
  deletedTestRows: EditableTestRow[] = [];
  isTestsSaving = false;

  // Test dropdown search
  readonly testSearchControl = new FormControl('');
  readonly filteredTests = computed(() => {
    const search = (this.testSearch() || '').toLowerCase();
    const items = this.testsLov();
    if (!search) return items;
    return items.filter(t =>
      t.testId.toLowerCase().includes(search) ||
      t.testDescription.toLowerCase().includes(search)
    );
  });
  private readonly testSearch = signal('');
  openDropdown: { row: number; col: string } | null = null;

  // Searchable dropdown active item fix
  constructor() {
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

    effect(() => {
      const minDate = DateFieldValidationUtility.getMinDate(
        this.headerService.chapterTimeZone()
      );
      this.chapterLocalDate = minDate?.toDate?.() ?? minDate ?? new Date();
    });

    effect(() => {
      this.filteredContracts();
      this.filteredBarcodes();
      this.filteredTests();
      setTimeout(() => {
        if (this.contractSelect?.panelOpen) {
          (this.contractSelect as any)._keyManager?.setActiveItem(1);
        }
      });
    });
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadLovData();
    this.subscribeToChapterChanges();
    this.subscribeToFormChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Form Setup ───────────────────────────────────────────

  minEffectiveDate = DateFieldValidationUtility.getMinDate(this.headerService.chapterTimeZone());

  terminationDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();
    if (checkDate.isBefore(today)) return false;
    const eff = this.contractForm?.get('effDate')?.value;
    if (eff) {
      const effDay = moment(eff).startOf('day');
      if (checkDate.isBefore(effDay)) return false;
    }
    return true;
  };

  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getEffectiveDateError()
  );
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getTerminationDateError()
  );

  private buildForm(): void {
    this.contractForm = this.fb.group({
      company: ['', [Validators.required, Validators.maxLength(50)]],
      taxIdForm: ['', [Validators.pattern(/^\d+$/)]],
      barCodeProtocol: ['', [Validators.required]],
      unitIdPattern: [{ value: '', disabled: true }],
      ediInputInd: [null],
      resultOutputInd: ['', [Validators.required]],
      confirmTestFlag: [false],
      effDate: [null],
      termDate: [null],
    }, {
      validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effDate', 'termDate')]
    });
  }

  private subscribeToFormChanges(): void {
    this.contractForm.get('barCodeProtocol')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const pattern = this.contractForm.get('unitIdPattern');
        if (value === '8') {
          pattern?.enable({ emitEvent: false });
        } else {
          pattern?.setValue('', { emitEvent: false });
          pattern?.disable({ emitEvent: false });
        }
      });

    this.contractForm.get('effDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'effective';
        this.contractForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });

    this.contractForm.get('termDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastChangedDateField = 'termination';
        this.contractForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
  }

  private setupValidatorsForMode(): void {
    const effCtrl = this.contractForm.get('effDate');
    const termCtrl = this.contractForm.get('termDate');

    if (this.isNewMode) {
      effCtrl?.setValidators([
        Validators.required,
        DateFieldValidationUtility.effectiveDateNotPastValidator(this.headerService.chapterTimeZone())
      ]);
      termCtrl?.clearValidators();
    } else {
      effCtrl?.clearValidators();
      termCtrl?.setValidators([
        DateFieldValidationUtility.terminationDateNotPastValidator(this.headerService.chapterTimeZone())
      ]);
    }
    effCtrl?.updateValueAndValidity({ emitEvent: false });
    termCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.contractForm.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.contractForm.get('effDate'), 'Effective Date', 'Termination Date', formErrors
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.contractForm.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.contractForm.get('termDate'), 'Termination Date', 'Effective Date', formErrors
    );
  }

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value, this.contractForm.get('effDate')
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, this.contractForm.get('termDate'), !this.isNewMode
    );
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetScreen();
        this.loadLovData();
      });
  }

  // ─── LOV Loading ──────────────────────────────────────────

  private loadLovData(): void {
    this.service.searchContracts({ contractType: this.CONTRACT_TYPE })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: items => this.contractsLov.set(items),
        error: () => this.contractsLov.set([]),
      });

    this.service.getBarcodeProtocols()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: items => this.barcodeProtocols.set(items),
        error: () => this.barcodeProtocols.set([]),
      });

    this.service.getTests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: items => this.testsLov.set(items),
        error: () => this.testsLov.set([]),
      });
  }

  // ─── Search Card ──────────────────────────────────────────

  onNewContract(): void {
    this.isNewMode = true;
    this.isContractLoaded = true;
    this.currentContractId = '';
    this.selectedContract = null;
    this.addressData = null;
    this.editableTestRows = [];
    this.dirtyTestRowIds.clear();

    this.contractForm.reset({
      company: '',
      taxIdForm: '',
      barCodeProtocol: '',
      unitIdPattern: '',
      ediInputInd: null,
      resultOutputInd: '',
      confirmTestFlag: false,
      effDate: null,
      termDate: null,
    });
    this.contractForm.get('unitIdPattern')?.disable({ emitEvent: false });
    this.setupValidatorsForMode();

    if (this.contractSelect) {
      this.contractSelect.value = null;
    }
  }

  onContractSelected(contractId: string): void {
    if (!contractId) return;
    if (contractId === '__NEW__') {
      this.onNewContract();
      return;
    }
    this.isLoading = true;

    this.service.getById(contractId, this.CONTRACT_TYPE)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: contract => {
          this.isLoading = false;
          if (contract) {
            this.loadContractIntoForm(contract);
            this.loadContractTests(contractId);
          }
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private loadContractIntoForm(contract: ContractResponse): void {
    this.selectedContract = contract;
    this.currentContractId = contract.contractId;
    this.isContractLoaded = true;
    this.isNewMode = false;
    this.addressData = contract.address ?? null;

    this.contractForm.patchValue({
      company: contract.company,
      taxIdForm: contract.taxIdForm ?? '',
      barCodeProtocol: contract.barCodeProtocol,
      unitIdPattern: contract.unitIdPattern ?? '',
      ediInputInd: contract.ediInputInd === 'Y' ? 'Y' : null,
      resultOutputInd: contract.resultOutputInd ?? '',
      confirmTestFlag: contract.confirmTestFlag === 'Y',
      effDate: contract.effDate ? new Date(contract.effDate) : null,
      termDate: contract.termDate ? new Date(contract.termDate) : null,
    });

    if (contract.barCodeProtocol === '8') {
      this.contractForm.get('unitIdPattern')?.enable({ emitEvent: false });
    } else {
      this.contractForm.get('unitIdPattern')?.disable({ emitEvent: false });
    }

    this.setupValidatorsForMode();
    this.contractForm.markAsPristine();
    this.contractForm.markAsUntouched();
  }

  // ─── Contract Save ────────────────────────────────────────

  onSaveContract(): void {
    if (this.contractForm.invalid) return;

    const formValue = this.contractForm.getRawValue();
    this.isLoading = true;

    if (this.isNewMode) {
      const request: CreateContractRequest = {
        contractType: this.CONTRACT_TYPE,
        company: (formValue.company || '').trim(),
        taxIdForm: formValue.taxIdForm || undefined,
        barCodeProtocol: formValue.barCodeProtocol,
        unitIdPattern: formValue.unitIdPattern || undefined,
        ediInputInd: formValue.ediInputInd || undefined,
        resultOutputInd: formValue.resultOutputInd || undefined,
        confirmTestFlag: formValue.confirmTestFlag ? 'Y' : undefined,
        effDate: this.formatDateForApi(formValue.effDate),
        termDate: this.formatDateForApi(formValue.termDate),
        address: this.addressData ?? undefined,
      };

      this.service.create(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: response => {
            this.isLoading = false;
            if (response.success) {
              const newId = (response.item as any)?.contractId;
              this.snackbarService.showSuccess(response.message || `Contract ${newId || ''} created successfully`);
              if (newId) {
                this.service.getById(newId, this.CONTRACT_TYPE)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe({
                    next: contract => {
                      if (contract) {
                        const currentLov = this.contractsLov();
                        if (!currentLov.some(c => c.contractId === newId)) {
                          this.contractsLov.set([...currentLov, { contractId: newId, company: contract.company }]);
                        }
                        this.loadContractIntoForm(contract);
                        this.loadContractTests(newId);
                        setTimeout(() => {
                          if (this.contractSelect) {
                            this.contractSelect.value = newId;
                          }
                        });
                      }
                    },
                  });
              } else {
                this.resetScreen();
              }
            }
          },
          error: () => { this.isLoading = false; },
        });
      return;
    }

    if (!this.currentContractId) return;

    const request: UpdateContractRequest = {
      company: (formValue.company || '').trim(),
      taxIdForm: formValue.taxIdForm || undefined,
      barCodeProtocol: formValue.barCodeProtocol,
      unitIdPattern: formValue.unitIdPattern || undefined,
      ediInputInd: formValue.ediInputInd || undefined,
      resultOutputInd: formValue.resultOutputInd || undefined,
      confirmTestFlag: formValue.confirmTestFlag ? 'Y' : undefined,
      effDate: this.selectedContract?.effDate,
      termDate: this.formatDateForApi(formValue.termDate),
      address: this.addressData ?? undefined,
    };

    this.service.update(this.currentContractId, this.CONTRACT_TYPE, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.isLoading = false;
          if (response.success) {
            this.snackbarService.showSuccess(response.message || 'Contract updated successfully');
            this.onContractSelected(this.currentContractId);
          }
        },
        error: () => { this.isLoading = false; },
      });
  }

  onClearContract(): void {
    if (this.isNewMode) {
      this.resetScreen();
      this.loadLovData();
      return;
    }
    if (this.selectedContract) {
      this.loadContractIntoForm(this.selectedContract);
      this.contractForm.markAsPristine();
      this.contractForm.markAsUntouched();
    }
  }

  // ─── Address Dialog ───────────────────────────────────────

  onOpenAddress(): void {
    const dialogRef = this.dialog.open(AddressDialogComponent, {
      width: '700px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      disableClose: false,
      data: {
        address: this.addressData ? { ...this.addressData } : null,
        contractId: this.currentContractId,
        contractType: this.CONTRACT_TYPE,
        currentContract: this.selectedContract,
      } as AddressDialogData,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: AddressModel | null | undefined) => {
        if (result !== undefined) {
          this.addressData = result;
        }
      });
  }

  // ─── Contacts Dialog ──────────────────────────────────────

  onOpenContacts(): void {
    if (!this.currentContractId) return;

    const dialogRef = this.dialog.open(ContactsDialogComponent, {
      width: '800px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      panelClass: 'code-dialog-panel-right',
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      disableClose: false,
      data: { contractId: this.currentContractId },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  // ─── Contract Tests ───────────────────────────────────────

  private loadContractTests(contractId: string): void {
    this.service.getContractTests(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tests => {
          this.editableTestRows = tests.map(t => this.mapTestToEditableRow(t));
          this.dirtyTestRowIds.clear();
          this.deletedTestRows = [];
        },
        error: () => {
          this.editableTestRows = [];
          this.dirtyTestRowIds.clear();
          this.deletedTestRows = [];
        },
      });
  }

  private mapTestToEditableRow(test: ContractTest): EditableTestRow {
    return {
      testId: test.testId,
      testDescription: test.testDescription ?? '',
      stopLabelFlag: test.stopLabelFlag,
      effDate: test.effDate ? new Date(test.effDate) : null,
      termDate: test.termDate ? new Date(test.termDate) : null,
      lastModifiedDate: test.lastModifiedDate,
      auditKey: test.auditKey,
      isDirty: false,
      errors: {},
    };
  }

  onAddTestRow(): void {
    const newRow: EditableTestRow = {
      testId: '',
      testDescription: '',
      stopLabelFlag: 'Y',
      effDate: null,
      termDate: null,
      auditKey: 0,
      isDirty: true,
      errors: {},
    };

    this.editableTestRows.unshift(newRow);

    const newDirtyIds = new Set<number>();
    this.dirtyTestRowIds.forEach(id => newDirtyIds.add(id + 1));
    this.dirtyTestRowIds = newDirtyIds;
    this.dirtyTestRowIds.add(0);
  }

  onDeleteTestRow(index: number): void {
    const row = this.editableTestRows[index];

    if (row.auditKey > 0) {
      this.deletedTestRows.push(row);
    }

    this.editableTestRows.splice(index, 1);
    this.dirtyTestRowIds.delete(index);

    const newDirtyIds = new Set<number>();
    this.dirtyTestRowIds.forEach(id => {
      if (id > index) newDirtyIds.add(id - 1);
      else if (id < index) newDirtyIds.add(id);
    });
    this.dirtyTestRowIds = newDirtyIds;
  }

  onTestFieldChange(rowIndex: number, field: string, value: any): void {
    const row = this.editableTestRows[rowIndex];

    if (field === 'testId') {
      row.testId = value;
      const test = this.testsLov().find(t => t.testId === value);
      row.testDescription = test?.testDescription ?? '';
    } else if (field === 'stopLabelFlag') {
      row.stopLabelFlag = value;
    } else if (field === 'effDate') {
      row.effDate = value;
    } else if (field === 'termDate') {
      row.termDate = value;
    }

    row.isDirty = true;
    this.dirtyTestRowIds.add(rowIndex);

    if (row.errors[field]) {
      delete row.errors[field];
    }
  }

  onSaveTests(): void {
    const hasUpserts = this.dirtyTestRowIds.size > 0;
    const hasDeletes = this.deletedTestRows.length > 0;

    if (!hasUpserts && !hasDeletes) {
      this.snackbarService.showError('No changes to save');
      return;
    }

    this.isTestsSaving = true;

    const deleteRequests = this.deletedTestRows.map(row =>
      this.service.deleteTest(this.currentContractId, row.testId, row.auditKey)
    );

    const records: UpsertContractTestItem[] = this.editableTestRows
      .filter((_, i) => this.dirtyTestRowIds.has(i))
      .map(row => {
        const item: UpsertContractTestItem = {
          testId: (row.testId || '').trim(),
          stopLabelFlag: row.stopLabelFlag,
          effDate: this.formatDateForApi(row.effDate),
          termDate: this.formatDateForApi(row.termDate),
        };
        if (row.auditKey > 0) {
          item.auditKey = row.auditKey;
        }
        return item;
      });

    const delete$ = deleteRequests.length > 0 ? forkJoin(deleteRequests) : of([]);
    delete$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        if (records.length > 0) {
          this.service.bulkUpsertTests(this.currentContractId, { records })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: response => {
                this.isTestsSaving = false;
                if (response.success) {
                  this.snackbarService.showSuccess(response.message || 'Tests saved successfully');
                  this.loadContractTests(this.currentContractId);
                }
              },
              error: () => { this.isTestsSaving = false; },
            });
        } else {
          this.isTestsSaving = false;
          this.snackbarService.showSuccess('Tests deleted successfully');
          this.loadContractTests(this.currentContractId);
        }
      },
      error: () => {
        this.isTestsSaving = false;
        this.snackbarService.showError('Failed to save tests. Please try again.');
      },
    });
  }

  onCancelTests(): void {
    this.loadContractTests(this.currentContractId);
  }

  // ─── Dropdown Helpers ─────────────────────────────────────

  onContractSearchChange(value: string): void {
    this.contractSearch.set(value);
  }

  onBarcodeSearchChange(value: string): void {
    this.barcodeSearch.set(value);
  }

  onTestSearchChange(value: string): void {
    this.testSearch.set(value);
  }

  isDropdownOpen(rowIndex: number, column: string): boolean {
    return this.openDropdown?.row === rowIndex && this.openDropdown?.col === column;
  }

  onDropdownOpened(rowIndex: number, column: string, isOpen: boolean): void {
    this.openDropdown = isOpen ? { row: rowIndex, col: column } : null;
    if (!isOpen) {
      this.testSearchControl.setValue('', { emitEvent: false });
      this.testSearch.set('');
    }
  }

  hasNewTestRows(): boolean {
    return this.editableTestRows.some(r => r.auditKey === 0);
  }

  hasRowErrors(row: EditableTestRow): boolean {
    return Object.keys(row.errors).length > 0;
  }

  compareByCode(a: string, b: string): boolean {
    return a === b;
  }

  // ─── Utilities ────────────────────────────────────────────

  private resetScreen(): void {
    this.isContractLoaded = false;
    this.isNewMode = false;
    this.currentContractId = '';
    this.selectedContract = null;
    this.addressData = null;
    this.contractForm.reset();
    this.editableTestRows = [];
    this.dirtyTestRowIds.clear();
    this.deletedTestRows = [];
    this.contractsLov.set([]);
    this.barcodeProtocols.set([]);
    this.testsLov.set([]);
  }

  private formatDateForApi(date: Date | null | undefined): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  testEffDateFilter = (date: moment.Moment | null): boolean => {
    if (!date) return true;
    const checkDate = moment(date).startOf('day');
    const today = this.chapterTimezoneService.getChapterLocalDate();
    return !checkDate.isBefore(today);
  };

  getTestTermDateFilter(row: EditableTestRow): (date: moment.Moment | null) => boolean {
    return (date: moment.Moment | null): boolean => {
      if (!date) return true;
      const checkDate = moment(date).startOf('day');
      const today = this.chapterTimezoneService.getChapterLocalDate();
      if (checkDate.isBefore(today)) return false;
      if (row.effDate) {
        const effDay = moment(row.effDate).startOf('day');
        if (checkDate.isBefore(effDay)) return false;
      }
      return true;
    };
  }
}
