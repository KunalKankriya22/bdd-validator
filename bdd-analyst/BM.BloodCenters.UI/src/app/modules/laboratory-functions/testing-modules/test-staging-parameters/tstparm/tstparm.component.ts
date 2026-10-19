import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import moment from 'moment';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { TstparmService } from './services/tstparm.service';
import {
  DropdownItem,
  ParmCodeDetail,
  AssignedParameter,
  FilterCriteria,
  BulkUpsertRequest
} from './models/tstparm.model';
import { TstparmFilterPanelComponent } from './components/tstparm-filter-panel/tstparm-filter-panel.component';

@Component({
  selector: 'app-tstparm',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    DragDropModule,
    PageHeaderWithBreadcrumb
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './tstparm.component.html',
  styleUrls: ['./tstparm.component.scss']
})
export class TstparmComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `tstparm-${TstparmComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TstparmService);
  private readonly snackbar = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  form!: FormGroup;

  protected readonly tests = signal<DropdownItem[]>([]);
  protected readonly parmTypes = signal<DropdownItem[]>([]);
  protected readonly selectedTestDescription = signal<string>('');
  protected readonly assignedParameters = signal<AssignedParameter[]>([]);
  protected readonly availableParameters = signal<ParmCodeDetail[]>([]);
  protected readonly searchTerm = signal<string>('');
  protected readonly filterCriteria = signal<FilterCriteria | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly loadingParmTypes = signal<boolean>(false);
  protected readonly loadingParameters = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly formDirty = signal<boolean>(false);
  protected readonly formValid = signal<boolean>(false);

  protected termDateControls = new Map<string, FormControl>();

  protected readonly filteredAvailableParameters = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const criteria = this.filterCriteria();
    const assigned = this.assignedParameters();

    let params = this.availableParameters().map(p => ({
      ...p,
      isAssigned: assigned.some(ap => ap.parmCode === p.parmCode)
    }));

    if (criteria?.datatype) {
      params = params.filter(p => p.datatype === criteria.datatype);
    }
    if (criteria?.relatedCode) {
      params = params.filter(p => p.relatedCode === criteria.relatedCode);
    }
    if (criteria?.voidCode) {
      params = params.filter(p => p.voidCode === criteria.voidCode);
    }
    if (criteria?.effDate && criteria?.effDatePeriod) {
      const filterDate = moment(criteria.effDate);
      if (criteria.effDatePeriod === 'After') {
        params = params.filter(p => p.effDate && moment(p.effDate).isSameOrAfter(filterDate, 'day'));
      } else {
        params = params.filter(p => p.effDate && moment(p.effDate).isSameOrBefore(filterDate, 'day'));
      }
    }
    if (criteria?.termDate && criteria?.termDatePeriod) {
      const filterDate = moment(criteria.termDate);
      if (criteria.termDatePeriod === 'Before') {
        params = params.filter(p => p.termDate && moment(p.termDate).isSameOrBefore(filterDate, 'day'));
      } else {
        params = params.filter(p => p.termDate && moment(p.termDate).isSameOrAfter(filterDate, 'day'));
      }
    }
    if (search) {
      params = params.filter(p =>
        p.parmCode.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        (p.relatedCode?.toLowerCase().includes(search) ?? false)
      );
    }

    return params;
  });

  private readonly TIME_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

  protected readonly isEmpty = computed(() => this.assignedParameters().length === 0);
  protected readonly isReady = computed(() => !this.loading() && !this.error());
  protected readonly hasTimeErrors = computed(() =>
    this.assignedParameters().some(p =>
      (p.effTime && !this.TIME_REGEX.test(p.effTime)) ||
      (p.termTime && !this.TIME_REGEX.test(p.termTime)) ||
      (p.datatype === 'DATETIME' && !!p.acceptMin && !this.TIME_REGEX.test(String(p.acceptMin))) ||
      (p.datatype === 'DATETIME' && !!p.acceptMax && !this.TIME_REGEX.test(String(p.acceptMax)))
    )
  );
  protected readonly canSave = computed(() =>
    this.formDirty() && this.formValid() && !this.saving() && !this.hasTimeErrors()
  );

  protected readonly headerConfig: PageHeaderConfig = {
    title: 'Define Critical Controls for Test',
    subtitle: 'Configure individual reports by defining report metadata and assigning parameters',
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Define Critical Controls for Test', link: null }
    ]
  };

  protected get today() { return this.chapterTimezoneService.getChapterLocalDate(); }

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    this.formValid.set(this.form.valid);
    this.loadLookupData();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      testId: [null, [Validators.required]],
      parmType: [null, [Validators.required]],
      tech1: [false],
      tech2: [false],
      searchTerm: ['']
    }, {
      validators: this.atLeastOneTechRequiredValidator
    });
  }

  private setupFormListeners(): void {
    this.form.get('testId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(testId => {
        this.form.get('parmType')?.setValue(null, { emitEvent: false });
        this.parmTypes.set([]);
        this.assignedParameters.set([]);
        this.selectedTestDescription.set('');

        if (testId) {
          const test = this.tests().find(t => t.value === testId);
          this.selectedTestDescription.set(test?.label ?? '');
          this.loadParmTypes(testId);
        }
      });

    this.form.get('parmType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(parmType => {
        const testId = this.form.get('testId')?.value;
        if (testId && parmType) {
          this.loadAssignedParameters(testId, parmType);
        } else {
          this.assignedParameters.set([]);
        }
      });

    this.form.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.searchTerm.set(term || '');
      });

    this.form.get('tech1')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.formDirty.set(true));

    this.form.get('tech2')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.formDirty.set(true));

    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => this.formValid.set(status === 'VALID'));
  }

  private atLeastOneTechRequiredValidator = (form: FormGroup) => {
    const tech1 = form.get('tech1')?.value;
    const tech2 = form.get('tech2')?.value;
    return tech1 || tech2 ? null : { atLeastOneTech: true };
  };

  private loadLookupData(): void {
    this.loading.set(true);

    this.service.getTestIdsDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.tests.set(tests);
        },
        error: (err) => {
          this.error.set('Failed to load tests');
          console.error('Failed to load tests:', err);
        }
      });

    this.service.getAllParmCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => {
          this.availableParameters.set(codes);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load parameter codes');
          console.error('Failed to load parameter codes:', err);
          this.loading.set(false);
        }
      });
  }

  private loadParmTypes(testId: string): void {
    this.loadingParmTypes.set(true);

    this.service.getParmTypesDropdown(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.parmTypes.set(types);
          this.loadingParmTypes.set(false);
        },
        error: (err) => {
          console.error('Failed to load parameter types:', err);
          this.loadingParmTypes.set(false);
        }
      });
  }

  private loadAssignedParameters(testId: string, parmType: string): void {
    this.loadingParameters.set(true);

    this.service.getAssignedParameters(testId, parmType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (records) => {
          this.assignedParameters.set(records.map(r => ({
            ...r,
            effTime: this.extractTime(r.effDate),
            termTime: this.extractTime(r.termDate),
          })));
          const first = records[0];
          this.form.patchValue({
            tech1: first?.tech1Reqd === 'Y',
            tech2: first?.tech2Reqd === 'Y'
          }, { emitEvent: false });
          this.formValid.set(this.form.valid);
          this.termDateControls.clear();
          this.loadingParameters.set(false);
          this.formDirty.set(false);
        },
        error: (err) => {
          console.error('Failed to load assigned parameters:', err);
          this.loadingParameters.set(false);
        }
      });
  }

  onAddParameter(param: ParmCodeDetail): void {
    const assigned = this.assignedParameters();
    const maxSequence = assigned.length > 0
      ? Math.max(...assigned.map(p => p.sequence))
      : 0;

    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
    const newParam: AssignedParameter = {
      parmCode: param.parmCode,
      parmDesc: param.description,
      datatype: param.datatype,
      relatedCode: param.relatedCode,
      sequence: maxSequence + 1,
      effDate: chapterNow.format('YYYY-MM-DD'),
      effTime: chapterNow.format('HH:mm'),
      isNew: true
    };

    this.assignedParameters.set([...assigned, newParam]);
    this.formDirty.set(true);
  }

  onRemoveParameter(param: AssignedParameter): void {
    const assigned = this.assignedParameters().find(p => p.parmCode === param.parmCode) ?? param;
    if (assigned.isNew) {
      this.removeFromLocal(param.parmCode);
      return;
    }

    const chapterNow = this.chapterTimezoneService.getChapterLocalDateTime();
    const updated = this.assignedParameters().map(p => {
      if (p.parmCode !== param.parmCode) return p;
      return {
        ...p,
        termDate: chapterNow.format('YYYY-MM-DD'),
        termTime: chapterNow.format('HH:mm'),
      };
    });
    this.assignedParameters.set(updated);
    this.formDirty.set(true);
    const control = this.termDateControls.get(param.parmCode);
    if (control) {
      control.setValue(this.parseMoment(chapterNow.format('YYYY-MM-DD')), { emitEvent: false });
    }
    this.snackbar.showSuccess(`Termination date set for parameter ${param.parmCode}. Click Save to confirm.`);
  }

  private removeFromLocal(parmCode: string): void {
    const updated = this.assignedParameters()
      .filter(p => p.parmCode !== parmCode)
      .map((p, i) => ({ ...p, sequence: i + 1 }));
    this.assignedParameters.set(updated);
    this.formDirty.set(true);
  }

  onDrop(event: CdkDragDrop<AssignedParameter[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const assigned = [...this.assignedParameters()];
    moveItemInArray(assigned, event.previousIndex, event.currentIndex);
    assigned.forEach((p, i) => p.sequence = i + 1);

    this.assignedParameters.set(assigned);
    this.formDirty.set(true);
  }

  onParameterFieldChange(param: AssignedParameter, field: string, value: any): void {
    const updated = this.assignedParameters().map(p =>
      p.parmCode === param.parmCode ? { ...p, [field]: value } : p
    );
    this.assignedParameters.set(updated);
    this.formDirty.set(true);
  }

  onOpenFilterPanel(): void {
    const availableRelatedCodes = [...new Set(
      this.availableParameters()
        .map(p => p.relatedCode)
        .filter((c): c is string => !!c)
    )];

    const availableVoidCodes = [...new Set(
      this.availableParameters()
        .map(p => p.voidCode)
        .filter((c): c is string => !!c)
    )];

    const dialogRef = this.dialog.open(TstparmFilterPanelComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        currentFilters: this.filterCriteria(),
        relatedCodes: availableRelatedCodes,
        voidCodes: availableVoidCodes
      }
    });

    dialogRef.componentInstance.currentFilters = this.filterCriteria();

    dialogRef.componentInstance.apply
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: FilterCriteria) => {
        this.filterCriteria.set(filters);
        dialogRef.close();
      });

    dialogRef.componentInstance.close
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        dialogRef.close();
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.assignedParameters().length === 0) {
      this.snackbar.showError('At least one parameter must be assigned');
      return;
    }

    const timeError = this.assignedParameters().find(p =>
      (p.effTime && !this.TIME_REGEX.test(p.effTime)) ||
      (p.termTime && !this.TIME_REGEX.test(p.termTime)) ||
      (p.datatype === 'DATETIME' && !!p.acceptMin && !this.TIME_REGEX.test(String(p.acceptMin))) ||
      (p.datatype === 'DATETIME' && !!p.acceptMax && !this.TIME_REGEX.test(String(p.acceptMax)))
    );
    if (timeError) {
      this.snackbar.showError(`Parameter ${timeError.parmCode}: Invalid time format. Use HH:MM (24-hour) format.`);
      return;
    }

    const rangeError = this.assignedParameters().find(p =>
      p.datatype !== 'DATETIME' &&
      p.acceptMin != null && p.acceptMax != null &&
      +p.acceptMin > +p.acceptMax
    );
    if (rangeError) {
      this.snackbar.showError(`Parameter ${rangeError.parmCode}: Min value cannot exceed Max value`);
      return;
    }

    const chapterToday = this.chapterTimezoneService.getChapterLocalDate();
    const pastTermDate = this.assignedParameters().find(p =>
      p.isNew && p.termDate && moment(p.termDate).isBefore(chapterToday, 'day')
    );
    if (pastTermDate) {
      this.snackbar.showError(`Parameter ${pastTermDate.parmCode}: Termination date cannot be a past date.`);
      return;
    }

    const assignedCodes = new Set(this.assignedParameters().map(p => p.parmCode));
    const datatypeMap = new Map(this.availableParameters().map(p => [p.parmCode, p.datatype]));
    const missingRelated = this.assignedParameters().find(p => {
      const dt = p.datatype || datatypeMap.get(p.parmCode);
      return p.relatedCode && dt !== 'DEVICE' && dt !== 'REAGENT' && !assignedCodes.has(p.relatedCode);
    });
    if (missingRelated) {
      this.snackbar.showError(
        `Parameter ${missingRelated.parmCode} requires related parameter ${missingRelated.relatedCode} to be assigned.`
      );
      return;
    }

    this.saving.set(true);

    const tech1 = this.form.get('tech1')?.value ? 'Y' : 'N';
    const tech2 = this.form.get('tech2')?.value ? 'Y' : 'N';

    const request: BulkUpsertRequest = {
      testId: this.form.get('testId')?.value,
      parmType: this.form.get('parmType')?.value,
      tech1Reqd: tech1,
      tech2Reqd: tech2,
      records: this.assignedParameters().map(p => ({
        parmCode: p.parmCode,
        relatedCode: p.relatedCode ?? null,
        sequence: p.sequence,
        acceptMin: p.acceptMin != null ? String(p.acceptMin) : null,
        acceptMax: p.acceptMax != null ? String(p.acceptMax) : null,
        effDate: this.combineDateAndTime(p.effDate, p.effTime) ?? this.chapterTimezoneService.getChapterLocalDate().format('YYYY-MM-DD'),
        termDate: this.combineDateAndTime(p.termDate, p.termTime) ?? null,
        isNew: p.isNew ?? false
      }))
    };

    this.service.saveTestConfiguration(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackbar.showSuccess(response.message ?? `Test ID ${request.testId} has been updated successfully.`);
          this.saving.set(false);
          this.formDirty.set(false);
          this.assignedParameters.update(params => params.map(p => ({ ...p, isNew: false })));
        },
        error: (err) => {
          this.snackbar.showError(err?.error?.message ?? 'Failed to save test configuration. Please try again.');
          console.error('Failed to save:', err);
          this.saving.set(false);
        }
      });
  }

  onCancel(): void {
    if (this.formDirty()) {
      this.form.reset();
      this.parmTypes.set([]);
      this.assignedParameters.set([]);
      this.termDateControls.clear();
      this.selectedTestDescription.set('');
      this.filterCriteria.set(null);
      this.formDirty.set(false);
    }
  }

  hasTimeError(value: string | null | undefined): boolean {
    return !!value && !this.TIME_REGEX.test(value.toString().trim());
  }

  onTimeInput(event: Event, param: AssignedParameter, field: 'effTime' | 'termTime'): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/[^0-9]/g, '');
    const formatted = digits.length <= 2 ? digits : digits.substring(0, 2) + ':' + digits.substring(2, 4);
    input.value = formatted;
    this.onParameterFieldChange(param, field, formatted || null);
  }

  onTimeBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.trim();
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    if (!/^[0-9]$/.test(event.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onlyTime(event: KeyboardEvent): boolean {
    if (!/^[0-9:]$/.test(event.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPasteNumbers(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '');
    document.execCommand('insertText', false, numericOnly);
  }

  onlyTimePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const timeOnly = pastedText.replace(/[^0-9:]/g, '').slice(0, 5);
    document.execCommand('insertText', false, timeOnly);
  }

  parseFieldValue(datatype: string | undefined, value: string): number | string | null {
    if (!value) return null;
    if (datatype === 'DATETIME') return value;
    const num = +value;
    return isNaN(num) ? null : num;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  parseMoment(value: string | null | undefined): moment.Moment | null {
    if (!value) return null;
    const m = moment(value, 'YYYY-MM-DD');
    return m.isValid() ? m : null;
  }

  getTermDateControl(parmCode: string): FormControl {
    if (!this.termDateControls.has(parmCode)) {
      const param = this.assignedParameters().find(p => p.parmCode === parmCode);
      this.termDateControls.set(parmCode, new FormControl(this.parseMoment(param?.termDate)));
    }
    return this.termDateControls.get(parmCode)!;
  }

  onTermDateInput(event: Event, param: AssignedParameter): void {
    const control = this.termDateControls.get(param.parmCode) ?? null;
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value, control
    );
    if (control?.value && moment.isMoment(control.value) && control.value.isValid()) {
      this.onDateFieldChange(param, 'termDate', control.value);
    }
  }

  onTermDateBlur(param: AssignedParameter): void {
    const control = this.termDateControls.get(param.parmCode);
    if (control) {
      control.markAsTouched();
    }
  }

  onDateFieldChange(param: AssignedParameter, field: 'effDate' | 'termDate', value: moment.Moment | null): void {
    const formatted = value ? value.format('YYYY-MM-DD') : null;
    const updated = this.assignedParameters().map(p => {
      if (p.parmCode !== param.parmCode) return p;
      const changes: Partial<AssignedParameter> = { [field]: formatted };
      if (field === 'termDate' && value && !p.termTime) {
        changes['termTime'] = this.chapterTimezoneService.getChapterLocalDateTime().format('HH:mm');
      }
      return { ...p, ...changes };
    });
    this.assignedParameters.set(updated);
    this.formDirty.set(true);
  }

  formatTime(value: string | null | undefined): string {
    if (!value) return '';
    const m = moment(value, ['HH:mm', 'HH:mm:ss', moment.ISO_8601], true);
    return m.isValid() ? m.format('HH:mm') : value;
  }

  private extractTime(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const m = moment(dateStr);
    if (!m.isValid()) return null;
    const t = m.format('HH:mm');
    return t === '00:00' ? null : t;
  }

  private combineDateAndTime(date: string | null | undefined, time: string | null | undefined): string | null {
    if (!date) return null;
    const d = moment(date).format('YYYY-MM-DD');
    return time ? `${d}T${time}:00` : d;
  }

  get f() {
    return this.form.controls;
  }
}
