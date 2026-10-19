import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';

import {
  AntigenGroupOption,
  AntigenGroupRow,
  PanelMode,
  RbcAgGroupBatchUpdateRequest,
  RbcAgGroupCreateRequest,
  RbcAgGroupUpdateRequest,
  SEQUENCE_OPTIONS,
  DISPLAY_ORDER_OPTIONS,
} from '../models/rbc-ag-groups.model';
import { RbcAgGroupsService } from '../services/rbc-ag-groups.service';

@Component({
  selector: 'app-add-edit-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatSnackBarModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './add-edit-panel.html',
  styleUrls: ['./add-edit-panel.scss'],
})
export class AddEditPanelComponent implements OnInit, OnChanges {
  private readonly fb            = inject(FormBuilder);
  private readonly snackBar      = inject(MatSnackBar);
  private readonly service       = inject(RbcAgGroupsService);
  private readonly headerService = inject(HeaderService);
  private readonly destroyRef    = inject(DestroyRef);

  @Input() mode: PanelMode = 'add';
  @Input() selectedGroup: AntigenGroupOption | null = null;
  @Input() editRow: AntigenGroupRow | null = null;
  @Input() groupRows: AntigenGroupRow[] = [];

  @Output() closePanel  = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  serTestOptions: string[]      = [];
  molTestOptions: string[]      = [];
  readonly seqOptions           = SEQUENCE_OPTIONS;
  readonly displayOrderOptions  = DISPLAY_ORDER_OPTIONS;

  form!: FormGroup;
  isSaving = false;

  minDate = DateFieldValidationUtility.getMinDate();

  /** Tracks which date field was last changed for cross-field error attribution */
  private lastChangedDateField: 'effective' | 'termination' | null = null;

  effDateErrorMatcher  = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getEffectiveDateError());
  termDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => this.getTerminationDateError());

  get panelTitle(): string {
    switch (this.mode) {
      case 'add':       return 'Add New RBC Ag Groups';
      case 'editGroup': return 'Edit RBC Ag Groups';
      case 'editRow':   return 'Edit Define RBC Ag Groups';
    }
  }

  get serologicalRows(): FormArray {
    return this.form.get('serological') as FormArray;
  }

  get molecularRows(): FormArray {
    return this.form.get('molecular') as FormArray;
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadLookups();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mode'] || changes['selectedGroup'] || changes['editRow'] || changes['groupRows']) && this.form) {
      this.buildForm();
    }
  }

  private loadLookups(): void {
    this.service.lookupSerTestIds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: v => (this.serTestOptions = v), error: () => {} });

    this.service.lookupMolTestIds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: v => (this.molTestOptions = v), error: () => {} });
  }

  private buildForm(): void {
    this.lastChangedDateField = null;

    if (this.mode === 'add') {
      this.form = this.fb.group({
        antigenGroup:    [this.selectedGroup?.name ?? '', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[a-zA-Z]+$/)]],
        displayOrder:    [this.selectedGroup?.displayOrder ?? '', [Validators.required, Validators.min(1), Validators.max(10)]],
        effectiveDate:   [null, Validators.required],
        terminationDate: [null],
        serological: this.fb.array([this.newSerRow()]),
        molecular:   this.fb.array([this.newMolRow()]),
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')],
      });
      DateFieldValidationUtility.setupAddModeValidators(this.form, this.headerService.chapterTimeZone());

    } else if (this.mode === 'editGroup') {
      const rows   = this.groupRows;
      const effDate = rows[0]?.effectiveDate
        ? moment(rows[0].effectiveDate, 'DD-MMM-YYYY')
        : null;
      const termDate = rows[0]?.terminationDate
        ? moment(rows[0].terminationDate, 'DD-MMM-YYYY')
        : null;

      this.form = this.fb.group({
        effectiveDate:   [effDate],
        terminationDate: [termDate],
        serological: this.fb.array(
          rows.map(r => this.fb.group({
            test: [r.serologicalTest, Validators.required],
            seq:  [r.serologicalSeq,  Validators.required],
          })),
        ),
        molecular: this.fb.array(
          rows.map(r => this.fb.group({
            test: [r.molecularTest || ''],
            seq:  [r.molecularSeq  || 1],
          })),
        ),
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')],
      });
      DateFieldValidationUtility.setupEditModeValidators(this.form);

    } else {
      // editRow
      const effDate  = this.editRow?.effectiveDate
        ? moment(this.editRow.effectiveDate, 'DD-MMM-YYYY')
        : null;
      const termDate = this.editRow?.terminationDate
        ? moment(this.editRow.terminationDate, 'DD-MMM-YYYY')
        : null;

      this.form = this.fb.group({
        effectiveDate:   [effDate],
        serologicalSeq:  [this.editRow?.serologicalSeq ?? 1, Validators.required],
        molecularSeq:    [this.editRow?.molecularSeq   ?? 1, Validators.required],
        terminationDate: [termDate],
      }, {
        validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('effectiveDate', 'terminationDate')],
      });
      DateFieldValidationUtility.setupEditModeValidators(this.form);
    }

    // Track which field was last changed so cross-field error appears on the right control
    this.form.get('effectiveDate')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.lastChangedDateField = 'effective'; });

    this.form.get('terminationDate')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.lastChangedDateField = 'termination'; });
  }

  onAntigenGroupKeyPress(event: KeyboardEvent): boolean {
    return /^[a-zA-Z]$/.test(event.key);
  }

  private newSerRow(): FormGroup {
    return this.fb.group({ test: ['', Validators.required], seq: [null, Validators.required] });
  }

  private newMolRow(): FormGroup {
    return this.fb.group({ test: ['', Validators.required], seq: [null, Validators.required] });
  }

  addSerological(): void              { this.serologicalRows.push(this.newSerRow()); }
  addMolecular(): void                { this.molecularRows.push(this.newMolRow()); }
  removeSerological(i: number): void  { this.serologicalRows.removeAt(i); }
  removeMolecular(i: number): void    { this.molecularRows.removeAt(i); }

  // ── Date error messages (cross-field aware) ────────────────────────────────

  getEffectiveDateError(): string {
    const formErrors = this.lastChangedDateField === 'effective' ? this.form.errors : null;
    return DateFieldValidationUtility.getStartDateCrossFieldError(
      this.form.get('effectiveDate'), 'Effective Date', 'Termination Date', formErrors,
    );
  }

  getTerminationDateError(): string {
    const formErrors = this.lastChangedDateField === 'termination' ? this.form.errors : null;
    return DateFieldValidationUtility.getEndDateCrossFieldError(
      this.form.get('terminationDate'), 'Termination Date', 'Effective Date', formErrors,
    );
  }

  // ── Date input handlers ────────────────────────────────────────────────────

  onEffectiveDateInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('effectiveDate'),
    );
  }

  onTerminationDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('terminationDate'),
      this.mode !== 'add',
    );
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────

  onCancel(): void {
    this.closePanel.emit();
  }

  // ── Save (edit modes) ──────────────────────────────────────────────────────

  onSave(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;

    if (this.mode === 'editGroup') {
      this.service.batchUpdate(this.buildBatchUpdateRequest())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.showSnack('RBC Ag Groups updated successfully.');
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: () => {
            this.isSaving = false;
            this.showSnack('An error occurred. Please try again.', true);
          },
        });
    } else {
      this.service.update(this.buildUpdateRecords())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.showSnack('Define RBC Ag Groups Updated successfully.');
            this.saveSuccess.emit();
            this.closePanel.emit();
          },
          error: () => {
            this.isSaving = false;
            this.showSnack('An error occurred. Please try again.', true);
          },
        });
    }
  }

  // ── Add ────────────────────────────────────────────────────────────────────

  onAdd(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    const antigenGroup = this.form.get('antigenGroup')?.value ?? '';

    this.service.checkGroupExists(antigenGroup)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: exists => {
          if (exists) {
            this.isSaving = false;
            this.showSnack(`Antigen Group "${antigenGroup}" already exists.`, true);
            return;
          }
          this.service.create(this.buildCreateRecords())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.isSaving = false;
                this.showSnack('RBC Ag Group added successfully.');
                this.saveSuccess.emit();
                this.closePanel.emit();
              },
              error: () => {
                this.isSaving = false;
                this.showSnack('An error occurred. Please try again.', true);
              },
            });
        },
        error: () => {
          this.isSaving = false;
          this.showSnack('An error occurred. Please try again.', true);
        },
      });
  }

  onAddAndCreateAnother(): void {
    this.form.markAllAsTouched();
    DateFieldValidationUtility.clearOptionalDateErrors(this.form, 'terminationDate');

    if (this.form.invalid || this.isSaving) return;

    this.isSaving = true;
    const antigenGroup = this.form.get('antigenGroup')?.value ?? '';

    this.service.checkGroupExists(antigenGroup)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: exists => {
          if (exists) {
            this.isSaving = false;
            this.showSnack(`Antigen Group "${antigenGroup}" already exists.`, true);
            return;
          }
          this.service.create(this.buildCreateRecords())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.isSaving = false;
                this.showSnack('RBC Ag Group added successfully.');
                this.saveSuccess.emit();
                this.buildForm();
              },
              error: () => {
                this.isSaving = false;
                this.showSnack('An error occurred. Please try again.', true);
              },
            });
        },
        error: () => {
          this.isSaving = false;
          this.showSnack('An error occurred. Please try again.', true);
        },
      });
  }

  // ── Payload builders ───────────────────────────────────────────────────────

  private buildCreateRecords(): RbcAgGroupCreateRequest[] {
    const raw     = this.form.getRawValue();
    const serRows: Array<{ test: string; seq: number }> = this.serologicalRows.value;
    const molRows: Array<{ test: string; seq: number }> = this.molecularRows.value;
    const count   = Math.max(serRows.length, molRows.length);

    return Array.from({ length: count }, (_, i) => ({
      antigenGroup:       raw.antigenGroup,
      antigenGrpDispOrder: Number(raw.displayOrder),
      serAgTestId:        serRows[i]?.test ?? '',
      serTestDispOrder:   serRows[i]?.seq  ?? 0,
      molAgTestId:        molRows[i]?.test  || null,
      molTestDispOrder:   molRows[i]?.test  ? (molRows[i].seq ?? null) : null,
      effDate:            DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate)   ?? '',
      termDate:           DateFieldValidationUtility.serializeDateForApi(raw.terminationDate) ?? null,
    }));
  }

  private buildBatchUpdateRequest(): RbcAgGroupBatchUpdateRequest {
    const raw = this.form.getRawValue();
    const serRows: Array<{ test: string; seq: number }> = this.serologicalRows.value;
    const molRows: Array<{ test: string; seq: number }> = this.molecularRows.value;
    const count = Math.max(serRows.length, molRows.length);

    return {
      antigenGroup:        this.selectedGroup?.name ?? '',
      antigenGrpDispOrder: this.selectedGroup?.displayOrder ?? 0,
      termDate:            DateFieldValidationUtility.serializeDateForApi(raw.terminationDate) ?? null,
      records: Array.from({ length: count }, (_, i) => ({
        auditKey:          this.groupRows[i]?.auditKey ?? null,
        serAgTestId:       serRows[i]?.test ?? '',
        serTestDispOrder:  serRows[i]?.seq  ?? 0,
        molAgTestId:       molRows[i]?.test  || null,
        molTestDispOrder:  molRows[i]?.test  ? (molRows[i].seq ?? null) : null,
      })),
    };
  }

  private buildUpdateRecords(): RbcAgGroupUpdateRequest[] {
    const raw = this.form.getRawValue();

    if (this.mode === 'editRow' && this.editRow) {
      return [{
        auditKey:            this.editRow.auditKey,
        antigenGroup:        this.selectedGroup?.name ?? '',
        antigenGrpDispOrder: this.selectedGroup?.displayOrder ?? 0,
        serAgTestId:         this.editRow.serologicalTest,
        serTestDispOrder:    raw.serologicalSeq,
        molAgTestId:         this.editRow.molecularTest  || null,
        molTestDispOrder:    this.editRow.molecularTest  ? raw.molecularSeq : null,
        effDate:             DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate)   ?? '',
        termDate:            DateFieldValidationUtility.serializeDateForApi(raw.terminationDate) ?? null,
      }];
    }

    // editGroup — update every row
    const serRows: Array<{ test: string; seq: number }> = this.serologicalRows.value;
    const molRows: Array<{ test: string; seq: number }> = this.molecularRows.value;

    return this.groupRows.map((orig, i) => ({
      auditKey:            orig.auditKey,
      antigenGroup:        this.selectedGroup?.name ?? '',
      antigenGrpDispOrder: this.selectedGroup?.displayOrder ?? 0,
      serAgTestId:         serRows[i]?.test ?? orig.serologicalTest,
      serTestDispOrder:    serRows[i]?.seq  ?? orig.serologicalSeq,
      molAgTestId:         molRows[i]?.test  || null,
      molTestDispOrder:    molRows[i]?.test  ? (molRows[i].seq ?? null) : null,
      effDate:             DateFieldValidationUtility.serializeDateForApi(raw.effectiveDate)   ?? orig.effectiveDate,
      termDate:            DateFieldValidationUtility.serializeDateForApi(raw.terminationDate) ?? null,
    }));
  }

  private showSnack(msg: string, isError = false): void {
    this.snackBar.open(msg, 'DISMISS', {
      duration: 5000,
      panelClass: isError ? 'snackbar-error' : 'snackbar-success',
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
