import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, ErrorStateMatcher } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import {
  UnitIdFieldComponent,
  UnitValidationResponse,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';
import { ModifySeparationTimesService } from './modify-separation-times.service';
import {
  SeparationTimesData,
  CentrifugeOption,
  CollectionDateOption,
  UpdateSeparationTimesPayload,
} from './modify-separation-times.model';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { dateFormatValidator } from 'src/app/core/utils/date-adapter.util';

@Component({
  selector: 'app-modify-separation-times',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './modify-separation-times.html',
  styleUrls: ['./modify-separation-times.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModifySeparationTimesComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `modify-sep-times-${ModifySeparationTimesComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @ViewChild(UnitIdFieldComponent) unitIdField!: UnitIdFieldComponent;

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly snackbarService = inject(SnackbarService);
  private readonly sepService = inject(ModifySeparationTimesService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);

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
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly unitData = signal<SeparationTimesData | null>(null);
  readonly centrifuges = signal<CentrifugeOption[]>([]);
  readonly collectionDates = signal<CollectionDateOption[]>([]);
  readonly selectedCollDate = signal<string>('');
  readonly validatedUnitId = signal<string>('');

  private maxCollDate: string | null = null;

  readonly hasResults = computed(() => this.unitData() !== null);
  readonly hasFormChanges = signal(false);

  readonly firstCentrifugeSearch = new FormControl('');
  readonly secondCentrifugeSearch = new FormControl('');

  private readonly firstSearchTerm = toSignal(
    this.firstCentrifugeSearch.valueChanges.pipe(startWith('')),
    { initialValue: '' },
  );
  private readonly secondSearchTerm = toSignal(
    this.secondCentrifugeSearch.valueChanges.pipe(startWith('')),
    { initialValue: '' },
  );

  readonly filteredFirstCentrifuges = computed(() => {
    const term = (this.firstSearchTerm() ?? '').toLowerCase();
    const all = this.centrifuges();
    if (!term) return all;
    return all.filter(c =>
      c.equipId.toLowerCase().includes(term) ||
      c.serialNumber.toLowerCase().includes(term) ||
      `${c.equipId} - ${c.serialNumber}`.toLowerCase().includes(term),
    );
  });

  readonly filteredSecondCentrifuges = computed(() => {
    const term = (this.secondSearchTerm() ?? '').toLowerCase();
    const all = this.centrifuges();
    if (!term) return all;
    return all.filter(c =>
      c.equipId.toLowerCase().includes(term) ||
      c.serialNumber.toLowerCase().includes(term) ||
      `${c.equipId} - ${c.serialNumber}`.toLowerCase().includes(term),
    );
  });

  readonly futureDateFilter = (d: Date | null): boolean => {
    if (!d) return true;
    const now = this.getChapterNow();
    return moment(d).isSameOrBefore(now, 'day');
  };

  readonly validationHints = signal<{ first: string | null; second: string | null }>({ first: null, second: null });

  firstDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getFirstSepDateError()
  );
  secondDateErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getSecondSepDateError()
  );

  private originalFormSnapshot = '';

  detailForm!: FormGroup;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initDetailForm();
    this.loadCentrifuges();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initDetailForm(): void {
    this.detailForm = this.fb.group({
      firstSepDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      firstSepTime: [''],
      firstSepCentrifugeId: [''],
      secondSepDate: [null, [dateFormatValidator(), DateFieldValidationUtility.validDateValidator()]],
      secondSepTime: [''],
      secondSepCentrifugeId: [''],
    });

    this.detailForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasFormChanges.set(
          this.originalFormSnapshot !== '' &&
          this.serializeFormValue() !== this.originalFormSnapshot,
        );
        this.updateValidationHints();
        this.cdr.markForCheck();
      });
  }

  private loadCentrifuges(): void {
    this.sepService.getCentrifuges()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.centrifuges.set(options);
          this.cdr.markForCheck();
        },
        error: () => {
          this.centrifuges.set([]);
          this.snackbarService.showError('Failed to load centrifuge list.');
        },
      });
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearFilter();
        this.loadCentrifuges();
      });
  }

  onPostValidate(event: UnitIdPostValidateEvent): void {
    const unitId = event.data.parsedUnitId;
    if (!unitId) {
      event.reject('Invalid Unit ID');
      return;
    }

    this.sepService.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (!result.isValid) {
            event.reject(result.message ?? 'Unit is not valid for this screen');
          } else {
            this.maxCollDate = result.maxCollDate;
            event.confirm();
          }
          this.cdr.markForCheck();
        },
        error: () => {
          event.reject('Error validating unit');
          this.cdr.markForCheck();
        },
      });
  }

  onUnitValidated(data: UnitValidationResponse): void {
    const parsedId = data.parsedUnitId ?? '';
    this.validatedUnitId.set(parsedId);
    this.isLoading.set(true);
    this.cdr.markForCheck();

    this.sepService.getCollectionDates(parsedId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dates) => {
          this.collectionDates.set(dates);
          const collDate = this.maxCollDate ?? (dates.length ? dates[0].collDate : '');
          this.selectedCollDate.set(collDate);
          this.loadSeparationTimes(parsedId, collDate);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackbarService.showError('Failed to load collection dates.');
          this.cdr.markForCheck();
        },
      });
  }

  onCollectionDateChange(collDate: string): void {
    this.selectedCollDate.set(collDate);
    const unitId = this.validatedUnitId();
    if (unitId && collDate) {
      this.isLoading.set(true);
      this.cdr.markForCheck();
      this.loadSeparationTimes(unitId, collDate);
    }
  }

  private loadSeparationTimes(unitId: string, collDate: string): void {
    this.sepService.getSeparationTimes(unitId, collDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading.set(false);
          this.unitData.set(result);
          this.populateForm(result);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading.set(false);
          this.snackbarService.showError('Failed to load separation times. Please try again.');
          this.cdr.markForCheck();
        },
      });
  }

  onUnitCleared(): void {
    this.resetAll();
  }

  onClearFilter(): void {
    this.resetAll();
    this.unitIdField?.clear();
  }

  onClearAll(): void {
    this.detailForm.reset();
    this.cdr.markForCheck();
  }

  onClearFirstSep(): void {
    this.detailForm.patchValue({
      firstSepDate: null,
      firstSepTime: '',
      firstSepCentrifugeId: '',
    });
    this.cdr.markForCheck();
  }

  onClearSecondSep(): void {
    this.detailForm.patchValue({
      secondSepDate: null,
      secondSepTime: '',
      secondSepCentrifugeId: '',
    });
    this.cdr.markForCheck();
  }

  onCancel(): void {
    this.onClearFilter();
  }

  onSave(): void {
    if (!this.unitIdField?.isValid) return;
    const data = this.unitData();
    if (!data) return;

    const validationError = this.validateBeforeSave(data);
    if (validationError) {
      this.snackbarService.showError(validationError);
      return;
    }

    const unitId = this.unitIdField.parsedUnitId!;
    const collDate = this.selectedCollDate();
    const payload = this.buildPayload(data);

    this.isSaving.set(true);
    this.cdr.markForCheck();

    this.sepService.updateSeparationTimes(unitId, collDate, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.snackbarService.showSuccess(
            `Separation times for Unit ID ${unitId} have been saved.`
          );
          this.onClearFilter();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSaving.set(false);
          const body = err?.error;
          const errorMessage = body?.errorResponse?.error
            || body?.message
            || 'Could not save changes.';
          this.snackbarService.showError(errorMessage);
          this.cdr.markForCheck();
        },
      });
  }

  private validateBeforeSave(data: SeparationTimesData): string | null {
    const fv = this.detailForm.getRawValue();
    const firstDate = fv.firstSepDate;
    const firstTime = fv.firstSepTime;
    const firstCent = fv.firstSepCentrifugeId;
    const secondDate = fv.secondSepDate;
    const secondTime = fv.secondSepTime;
    const secondCent = fv.secondSepCentrifugeId;

    const hasFirstTime = !!(firstDate && firstTime);
    const hasFirstCent = !!firstCent;
    const hasSecondTime = !!(secondDate && secondTime);
    const hasSecondCent = !!secondCent;

    if (hasFirstTime !== hasFirstCent) {
      return 'Separation details must be fully entered';
    }
    if (hasSecondTime !== hasSecondCent) {
      return 'Separation details must be fully entered';
    }

    if ((hasSecondTime || hasSecondCent) && !hasFirstTime) {
      return 'Second separation must be entered after first separation is entered';
    }

    if (hasFirstTime && hasSecondTime) {
      const first = this.combineDateTimeMoment(firstDate, firstTime);
      const second = this.combineDateTimeMoment(secondDate, secondTime);
      if (first && second && !second.isAfter(first)) {
        return 'Second sep/freeze time must be after first sep/freeze time';
      }
    }

    if (hasFirstTime) {
      const firstDt = this.combineDateTimeMoment(firstDate, firstTime);
      if (firstDt) {
        if (data.bleedEndTime) {
          const bleedEnd = moment(data.bleedEndTime);
          if (firstDt.isBefore(bleedEnd)) {
            return 'First separation time must be after bleed end time';
          }
        }
        if (firstDt.isAfter(this.getChapterNow())) {
          return 'Separation time cannot be in future';
        }
        const collDateMoment = moment(data.collDate);
        if (collDateMoment.isValid() && firstDt.isBefore(collDateMoment, 'day')) {
          return 'First separation time must be greater than collection date';
        }
      }
    }

    if (hasSecondTime) {
      const secondDt = this.combineDateTimeMoment(secondDate, secondTime);
      if (secondDt) {
        if (data.bleedEndTime) {
          const bleedEnd = moment(data.bleedEndTime);
          if (secondDt.isBefore(bleedEnd)) {
            return 'Second separation time must be after bleed end time';
          }
        }
        if (secondDt.isAfter(this.getChapterNow())) {
          return 'Separation time cannot be in future';
        }
        const collDateMoment = moment(data.collDate);
        if (collDateMoment.isValid() && secondDt.isBefore(collDateMoment, 'day')) {
          return 'Second separation time must be greater than collection date';
        }
      }
    }

    return null;
  }

  private buildPayload(data: SeparationTimesData): UpdateSeparationTimesPayload {
    const fv = this.detailForm.getRawValue();
    const firstSepTime = this.combineDateTimeIso(fv.firstSepDate, fv.firstSepTime);
    const secondSepTime = this.combineDateTimeIso(fv.secondSepDate, fv.secondSepTime);
    return {
      firstSepTime,
      firstSepCentrifugeId: fv.firstSepCentrifugeId || null,
      firstSepEntryMode: firstSepTime ? 'M' : null,
      secondSepTime,
      secondSepCentrifugeId: fv.secondSepCentrifugeId || null,
      secondSepEntryMode: secondSepTime ? 'M' : null,
    };
  }

  private populateForm(data: SeparationTimesData): void {
    const firstParsed = this.splitDateTime(data.firstSepTime);
    const secondParsed = this.splitDateTime(data.secondSepTime);

    const formValues = {
      firstSepDate: firstParsed.date,
      firstSepTime: firstParsed.time,
      firstSepCentrifugeId: data.firstSepCentrifugeId ?? '',
      secondSepDate: secondParsed.date,
      secondSepTime: secondParsed.time,
      secondSepCentrifugeId: data.secondSepCentrifugeId ?? '',
    };
    this.detailForm.patchValue(formValues);
    this.originalFormSnapshot = this.serializeFormValue();
    this.hasFormChanges.set(false);
    this.validationHints.set({ first: null, second: null });
  }

  private resetAll(): void {
    this.validatedUnitId.set('');
    this.selectedCollDate.set('');
    this.collectionDates.set([]);
    this.maxCollDate = null;
    this.unitData.set(null);
    this.detailForm.reset();
    this.originalFormSnapshot = '';
    this.hasFormChanges.set(false);
    this.validationHints.set({ first: null, second: null });
    this.firstCentrifugeSearch.reset();
    this.secondCentrifugeSearch.reset();
    this.cdr.markForCheck();
  }

  private splitDateTime(isoStr: string | null): { date: Date | null; time: string } {
    if (!isoStr) return { date: null, time: '' };
    const m = moment(isoStr);
    if (!m.isValid()) return { date: null, time: '' };
    return { date: m.toDate(), time: m.format('HH:mm') };
  }

  private combineDateTimeMoment(date: unknown, time: string): moment.Moment | null {
    if (!date || !time) return null;
    const d = moment(date);
    if (!d.isValid()) return null;
    const [hours, minutes] = time.split(':').map(Number);
    return d.clone().startOf('day').hours(hours).minutes(minutes);
  }

  private combineDateTimeIso(date: unknown, time: string): string | null {
    const m = this.combineDateTimeMoment(date, time);
    return m ? m.format('YYYY-MM-DDTHH:mm:ss') : null;
  }

  private getChapterNow(): moment.Moment {
    const tz = this.headerService.chapterTimeZone();
    if (!tz || tz === 'UTC') return moment();

    // Handle offset-based timezones like "+20:00", "-05:00"
    const offsetMatch = tz.match(/^([+-])(\d{1,2}):(\d{2})$/);
    if (offsetMatch) {
      const sign = offsetMatch[1] === '+' ? 1 : -1;
      const offsetMinutes = sign * (parseInt(offsetMatch[2], 10) * 60 + parseInt(offsetMatch[3], 10));
      const utcNow = moment.utc();
      const chapterNow = utcNow.add(offsetMinutes, 'minutes');
      return moment([chapterNow.year(), chapterNow.month(), chapterNow.date(), chapterNow.hour(), chapterNow.minute(), chapterNow.second()]);
    }

    // Handle IANA timezone names like "America/Chicago"
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(new Date());
      const get = (t: string) => parseInt(parts.find(p => p.type === t)!.value, 10);
      return moment([get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')]);
    } catch {
      return moment();
    }
  }

  private serializeFormValue(): string {
    const fv = this.detailForm.getRawValue();
    return JSON.stringify({
      firstSepDate: fv.firstSepDate ? moment(fv.firstSepDate).format('YYYY-MM-DD') : null,
      firstSepTime: fv.firstSepTime || null,
      firstSepCentrifugeId: fv.firstSepCentrifugeId || null,
      secondSepDate: fv.secondSepDate ? moment(fv.secondSepDate).format('YYYY-MM-DD') : null,
      secondSepTime: fv.secondSepTime || null,
      secondSepCentrifugeId: fv.secondSepCentrifugeId || null,
    });
  }

  private updateValidationHints(): void {
    const fv = this.detailForm.getRawValue();
    const data = this.unitData();
    let first: string | null = null;
    let second: string | null = null;

    const firstDt = this.combineDateTimeMoment(fv.firstSepDate, fv.firstSepTime);
    const secondDt = this.combineDateTimeMoment(fv.secondSepDate, fv.secondSepTime);

    if (firstDt) {
      if (firstDt.isAfter(this.getChapterNow())) {
        first = 'Separation time cannot be in future';
      } else if (data?.collDate) {
        const collDateMoment = moment(data.collDate);
        if (collDateMoment.isValid() && firstDt.isBefore(collDateMoment, 'day')) {
          first = 'First separation time must be on or after collection date';
        }
      }
    }

    if (secondDt) {
      if (secondDt.isAfter(this.getChapterNow())) {
        second = 'Separation time cannot be in future';
      } else if (firstDt && !secondDt.isAfter(firstDt)) {
        second = 'Second separation time must be after first separation time';
      } else if (data?.collDate) {
        const collDateMoment = moment(data.collDate);
        if (collDateMoment.isValid() && secondDt.isBefore(collDateMoment, 'day')) {
          second = 'Second separation time must be on or after collection date';
        }
      }
    }

    this.validationHints.set({ first, second });
  }

  formatEntryMode(mode: string | null): string {
    if (mode === 'A') return 'Automatic';
    if (mode === 'M') return 'Manual';
    return '—';
  }

  onTimeInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const inputType = (event as InputEvent).inputType ?? '';
    const isDeleting = inputType === 'deleteContentBackward' || inputType === 'deleteContentForward';

    const cursorPos = input.selectionStart ?? input.value.length;

    if (isDeleting) {
      let cleaned = input.value.replace(/[^0-9]/g, '');
      if (cleaned.length >= 3) {
        cleaned = cleaned.substring(0, 2) + ':' + cleaned.substring(2, 4);
      }
      input.value = cleaned;
      const newPos = Math.min(cursorPos, cleaned.length);
      input.setSelectionRange(newPos, newPos);
      this.detailForm.get(controlName)?.setValue(cleaned, { emitEvent: true });
      return;
    }

    let digits = input.value.replace(/[^0-9]/g, '');
    if (digits.length > 4) digits = digits.substring(0, 4);
    if (digits.length >= 2) {
      const hh = Math.min(parseInt(digits.substring(0, 2), 10), 23);
      const mmPart = digits.substring(2);
      const mm = mmPart.length === 2 ? Math.min(parseInt(mmPart, 10), 59).toString().padStart(2, '0') : mmPart;
      digits = hh.toString().padStart(2, '0') + (mmPart.length > 0 ? ':' + mm : '');
    }
    input.value = digits;
    const newCursor = digits.length > cursorPos ? cursorPos : digits.length;
    input.setSelectionRange(newCursor, newCursor);
    this.detailForm.get(controlName)?.setValue(digits, { emitEvent: true });
  }

  formatDateTime(isoStr: string | null): string {
    if (!isoStr) return '—';
    const m = moment(isoStr);
    return m.isValid() ? m.format('DD-MMM-YYYY HH:mm') : '—';
  }

  formatCollDateDisplay(collDate: string): string {
    if (!collDate) return '';
    const m = moment(collDate);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : collDate;
  }

  getFirstSepDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.detailForm.get('firstSepDate'),
      null,
      'First Separation Date'
    );
  }

  getSecondSepDateError(): string {
    return DateFieldValidationUtility.getDateErrorMessage(
      this.detailForm.get('secondSepDate'),
      null,
      'Second Separation Date'
    );
  }

  onFirstSepDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.detailForm.get('firstSepDate'),
      true
    );
  }

  onSecondSepDateInput(event: Event): void {
    DateFieldValidationUtility.handleEndDateInput(
      (event.target as HTMLInputElement).value,
      this.detailForm.get('secondSepDate'),
      true
    );
  }
}
