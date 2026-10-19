import { Component, EventEmitter, Input, Output, OnChanges, OnInit, SimpleChanges, ViewChildren, QueryList, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { Stage } from '../../models/sp-processes-stages.model';
import { SpProcessesStagesApiService } from '../../services/sp-processes-stages-api.service';

@Component({
  selector: 'app-stage-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ],
  templateUrl: './stage-configuration.component.html',
  styleUrls: ['./stage-configuration.component.scss']
})
export class StageConfigurationComponent implements OnInit, OnChanges {
  @Input() stages: Stage[] = [];
  @Input() processName: string = '';
  @Output() stagesChange = new EventEmitter<Stage[]>();

  @ViewChildren('stageCodeInput') stageCodeInputs!: QueryList<NgModel>;
  @ViewChildren('effDateInput') effDateInputs!: QueryList<NgModel>;
  @ViewChildren('termDateInput') termDateInputs!: QueryList<NgModel>;

  dirtyRows = new Set<number>();
  private originalDates = new Map<number, { effectiveDate: any; terminationDate: any }>();

  effDateMatchers: ErrorStateMatcher[] = [];
  termDateMatchers: ErrorStateMatcher[] = [];
  terminationDateFilters: Array<(date: moment.Moment | null) => boolean> = [];

  stageCodeOptions: { code: string; description: string }[] = [];
  isLoadingStageCodes = false;

  private readonly apiService = inject(SpProcessesStagesApiService);

  constructor(
    private headerService: HeaderService,
    private chapterTimezoneService: ChapterTimezoneService
  ) {}

  ngOnInit(): void {
    this.loadStageCodes();
  }

  private loadStageCodes(): void {
    this.isLoadingStageCodes = true;
    this.apiService.getStageCodes().subscribe({
      next: (codes) => {
        this.stageCodeOptions = codes;
        this.isLoadingStageCodes = false;
      },
      error: () => {
        this.isLoadingStageCodes = false;
      }
    });
  }

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stages']) {
      if (!changes['stages'].firstChange) {
        this.dirtyRows.clear();
      }

      this.originalDates.clear();
      this.stages?.forEach((row, i) => {
        if (row.auditKey && row.auditKey > 0) {
          this.originalDates.set(i, {
            effectiveDate: row.effectiveDate,
            terminationDate: row.terminationDate
          });
        }
      });
      this.buildDateErrorMatchers();
    }
  }

  private buildDateErrorMatchers(): void {
    this.effDateMatchers = (this.stages || []).map((_, i) => ({
      isErrorState: (control: any): boolean => {
        if (!control) return false;
        const row = this.stages[i];
        if (!this.isDateChanged(i, 'effectiveDate')) {
          return !!(control.errors?.['matDatepickerParse']);
        }
        if (!row?.auditKey || row.auditKey === 0) {
          return !!control.invalid;
        }
        return !!(control.invalid && (control.dirty || control.touched));
      }
    }));

    this.termDateMatchers = (this.stages || []).map((_, i) => ({
      isErrorState: (control: any): boolean => {
        if (!control) return false;
        const row = this.stages[i];
        if (!this.isDateChanged(i, 'terminationDate')) {
          return !!(control.errors?.['matDatepickerParse']);
        }
        if (!row?.auditKey || row.auditKey === 0) {
          return !!control.invalid;
        }
        return !!(control.invalid && (control.dirty || control.touched));
      }
    }));

    this.terminationDateFilters = (this.stages || []).map((row) =>
      (date: moment.Moment | null): boolean => {
        if (!date) return true;
        const checkDate = moment(date).startOf('day');
        const isNewRow = !row.auditKey || row.auditKey === 0;
        if (isNewRow) {
          const today = this.chapterTimezoneService.getChapterLocalDate();
          if (checkDate.isBefore(today)) return false;
        }
        if (row.effectiveDate) {
          const effDay = moment(row.effectiveDate).startOf('day');
          if (checkDate.isBefore(effDay)) return false;
        }
        return true;
      }
    );
  }

  addNextStage(): void {
    const maxSequence = this.stages.length > 0
      ? Math.max(...this.stages.map(s => s.sequence || 0))
      : 0;

    const nextSequence = maxSequence + 1;

    this.stages.push({
      sequence: nextSequence,
      stageCode: '',
      description: '',
      effectiveDate: this.chapterTimezoneService.getChapterLocalDate().toDate(),
      terminationDate: null,
      lastModifiedDate: null,
      auditKey: 0,
      isEditable: true,
      errors: {}
    });

    this.buildDateErrorMatchers();
    this.stagesChange.emit(this.stages);
  }

  private getOrdinalDescription(num: number): string {
    const ordinals = ['1st', '2nd', '3rd'];
    if (num <= 3) {
      return `${ordinals[num - 1]} stage`;
    }
    return `${num}th stage`;
  }

  deleteStage(index: number): void {
    const row = this.stages[index];
    if (!row.auditKey || row.auditKey === 0) {
      this.stages.splice(index, 1);
      // Update sequences
      this.stages.forEach((s, i) => s.sequence = i + 1);
      this.dirtyRows.delete(index);
      this.buildDateErrorMatchers();
      this.stagesChange.emit(this.stages);
    }
  }

  removeNewStages(): void {
    this.stages = this.stages.filter(stage => stage.auditKey && stage.auditKey > 0);
    this.dirtyRows.clear();
    this.buildDateErrorMatchers();
    this.stagesChange.emit(this.stages);
  }

  cancelChanges(): void {
    this.stages = this.stages.filter(stage => stage.auditKey && stage.auditKey > 0);
    this.stages.forEach((stage, i) => {
      const orig = this.originalDates.get(i);
      if (orig) {
        stage.effectiveDate = orig.effectiveDate;
        stage.terminationDate = orig.terminationDate;
      }
      stage.errors = {};
    });
    this.dirtyRows.clear();
    this.buildDateErrorMatchers();
    this.stagesChange.emit(this.stages);
  }

  clearAllFields(): void {
    this.stages.forEach((stage, i) => {
      if (stage.auditKey && stage.auditKey > 0) {
        const orig = this.originalDates.get(i);
        if (orig) {
          stage.effectiveDate = orig.effectiveDate;
          stage.terminationDate = orig.terminationDate;
        }
      } else {
        stage.effectiveDate = null;
        stage.terminationDate = null;
        stage.stageCode = '';
        stage.description = '';
      }

      stage.errors = {};
    });
    this.dirtyRows.clear();
    this.buildDateErrorMatchers();
    this.stagesChange.emit(this.stages);
  }

  onFieldBlur(index: number, fieldName: string): void {
    const row = this.stages[index];
    setTimeout(() => this.validateField(row, fieldName, index), 0);
  }

  isDateChanged(rowIndex: number, fieldName: 'effectiveDate' | 'terminationDate'): boolean {
    const row = this.stages[rowIndex];
    if (!row) return false;
    if (!row.auditKey || row.auditKey === 0) return true;

    const orig = this.originalDates.get(rowIndex);
    if (!orig) return true;

    return !this.areDatesEqual(row[fieldName], orig[fieldName]);
  }

  private areDatesEqual(date1: any, date2: any): boolean {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    const d1 = moment(date1).format('YYYY-MM-DD');
    const d2 = moment(date2).format('YYYY-MM-DD');
    return d1 === d2;
  }

  onFieldChange(index: number, fieldName: string): void {
    this.dirtyRows.add(index);
    setTimeout(() => this.validateField(this.stages[index], fieldName, index), 0);
    this.stagesChange.emit(this.stages);
  }

  private validateField(row: Stage, fieldName: string, rowIndex: number): void {
    if (!row.errors) {
      row.errors = {};
    }

    delete row.errors[fieldName];

    switch (fieldName) {
      case 'stageCode':
        if (!row.stageCode || row.stageCode.trim() === '') {
          row.errors['stageCode'] = 'Stage Code is required.';
        } else {
          const dupIdx = this.stages.findIndex((s, idx) =>
            idx !== rowIndex && s.stageCode === row.stageCode
          );
          if (dupIdx >= 0) {
            row.errors['stageCode'] = 'This stage code is already assigned to this process.';
          }
        }
        break;

      case 'effectiveDate':
      case 'terminationDate':
        this.validateDateFields(row, rowIndex);
        break;
    }
  }

  private hasInputText(control: NgModel | undefined): boolean {
    if (!control) return false;
    const el = (control as any)?.valueAccessor?._elementRef?.nativeElement;
    return el ? el.value?.trim().length > 0 : false;
  }

  private validateDateFields(row: Stage, rowIndex: number): void {
    const effDateControl = this.effDateInputs?.get(rowIndex);
    const termDateControl = this.termDateInputs?.get(rowIndex);
    const hasEffDateParseError = effDateControl?.errors?.['matDatepickerParse'];
    const hasTermDateParseError = termDateControl?.errors?.['matDatepickerParse'];

    const effDateHasText = this.hasInputText(effDateControl);
    const termDateHasText = this.hasInputText(termDateControl);

    if (row.errors) {
      delete row.errors['effectiveDate'];
      delete row.errors['terminationDate'];
    } else {
      row.errors = {};
    }

    if (hasEffDateParseError || (effDateHasText && !row.effectiveDate)) {
      row.errors['effectiveDate'] = 'Effective Date is invalid';
    } else if (this.isDateChanged(rowIndex, 'effectiveDate')) {
      if (!row.effectiveDate) {
        row.errors['effectiveDate'] = 'This field is required and cannot be left blank.';
      } else {
        const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');
        const today = DateFieldValidationUtility.getMinDate(this.chapterOffset);
        if (effDate.isBefore(today)) {
          row.errors['effectiveDate'] = 'Effective Date cannot be past date';
        }
      }
    }

    if (hasTermDateParseError || (termDateHasText && !row.terminationDate)) {
      row.errors['terminationDate'] = 'Termination Date is invalid';
    } else if (row.terminationDate && row.effectiveDate) {
      const termDate = moment.isMoment(row.terminationDate) ? row.terminationDate.clone().startOf('day') : moment(row.terminationDate).startOf('day');
      const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');

      if (termDate.isBefore(effDate)) {
        row.errors['terminationDate'] = 'Termination Date must be on or after Effective Date';
      }
    }
  }

  isChangedRow(index: number): boolean {
    const row = this.stages[index];
    return (!row?.auditKey || row.auditKey === 0) || this.dirtyRows.has(index);
  }

  getChangedStages(): Stage[] {
    return this.stages.filter((_, index) => this.isChangedRow(index));
  }

  validateAllStages(): boolean {
    let allValid = true;
    this.stages.forEach((row, index) => {
      if (this.isChangedRow(index)) {
        if (!this.validateStage(row, index)) {
          allValid = false;
        }
      } else {
        row.errors = {};
      }
    });
    return allValid;
  }

  private validateStage(row: Stage, rowIndex: number): boolean {
    let isValid = true;
    row.errors = {};
    const today = this.chapterTimezoneService.getChapterLocalDate();
    const isNewRow = !row.auditKey || row.auditKey === 0;

    if (!row.stageCode || row.stageCode.trim() === '') {
      row.errors['stageCode'] = 'Stage Code is required.';
      isValid = false;
    } else {
      const duplicateIndex = this.stages.findIndex((s, idx) =>
        idx !== rowIndex && s.stageCode === row.stageCode
      );
      if (duplicateIndex >= 0) {
        row.errors['stageCode'] = 'This stage code is already assigned to this process.';
        isValid = false;
      }
    }

    if (!row.effectiveDate) {
      row.errors['effectiveDate'] = 'Effective Date is required.';
      isValid = false;
    } else if (isNewRow || this.isDateChanged(rowIndex, 'effectiveDate')) {
      const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');
      if (effDate.isBefore(today)) {
        row.errors['effectiveDate'] = 'Effective Date cannot be past date';
        isValid = false;
      }
    }

    if (row.terminationDate && row.effectiveDate) {
      const termDate = moment.isMoment(row.terminationDate) ? row.terminationDate.clone().startOf('day') : moment(row.terminationDate).startOf('day');
      const effDate = moment.isMoment(row.effectiveDate) ? row.effectiveDate.clone().startOf('day') : moment(row.effectiveDate).startOf('day');
      if (termDate.isBefore(effDate)) {
        row.errors['terminationDate'] = 'Termination Date must be on or after Effective Date';
        isValid = false;
      }
    }

    return isValid;
  }

  hasRowErrors(row: Stage): boolean {
    return !!(row.errors && Object.keys(row.errors).length > 0);
  }

  get hasValidationErrors(): boolean {
    return this.stages.some(row => this.hasRowErrors(row));
  }

  hasNewStages(): boolean {
    return this.stages.some(row => !row.auditKey || row.auditKey === 0);
  }

  onStageCodeSelected(index: number): void {
    const stage = this.stages[index];
    const selected = this.stageCodeOptions.find(s => s.code === stage.stageCode);
    stage.description = selected?.description || '';
    this.onFieldChange(index, 'stageCode');
  }

  onEffectiveDateInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Clear invalid date if user types invalid format
    if (value && value.trim() !== '') {
      const effDateControl = this.effDateInputs?.get(index);
      if (effDateControl?.errors?.['matDatepickerParse']) {
        // Invalid date format - will be handled by validation
        return;
      }
    }
  }

  onTerminationDateInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Clear invalid date if user types invalid format
    if (value && value.trim() !== '') {
      const termDateControl = this.termDateInputs?.get(index);
      if (termDateControl?.errors?.['matDatepickerParse']) {
        // Invalid date format - will be handled by validation
        return;
      }
    }
  }

}
