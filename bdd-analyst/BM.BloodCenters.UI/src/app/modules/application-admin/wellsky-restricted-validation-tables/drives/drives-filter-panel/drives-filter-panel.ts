import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT, dateFormatValidator } from 'src/app/core/utils/date-adapter.util';
import { Subject, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { DrivesFilterValue, DrivesParamsDto } from '../models/drives.model';
import { DrivesService } from '../services/drives.service';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-drives-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    FilterPanelBase,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
  ],
  templateUrl: './drives-filter-panel.html',
  styleUrls: ['./drives-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrivesFilterPanel implements OnInit, OnChanges, OnDestroy {
  @Input() currentFilters: DrivesFilterValue | null = null;
  @Input() selectedChapterId: string | null = null;
  @Input() fromDate: string | null = null;
  @Input() toDate: string | null = null;
  @Output() apply = new EventEmitter<DrivesFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  typeOptions: Array<{ value: string; label: string }> = [];
  filteredTypeOptions: Array<{ value: string; label: string }> = [];
  typeSearchControl = new FormControl('');
  isLoadingTypes = false;

  siteIdOptions: Array<{ value: string; label: string }> = [];
  filteredSiteIdOptions: Array<{ value: string; label: string }> = [];
  siteSearchControl = new FormControl('');

  driveIdOptions: Array<{ value: string; label: string }> = [];
  filteredDriveIdOptions: Array<{ value: string; label: string }> = [];
  driveSearchControl = new FormControl('');

  periodOptions: string[] = ['After', 'Before'];
  filteredPeriodOptions: string[] = [...this.periodOptions];
  periodSearchControl = new FormControl('');

  isLoadingSiteIds = false;
  isLoadingDriveIds = false;

  // Store raw input text to preserve invalid dates
  private scheduledDateRawInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private drivesService: DrivesService,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      type: [this.currentFilters?.type || null],
      drive: [this.currentFilters?.drive || null],
      siteId: [this.currentFilters?.siteId || null],
      period: [this.currentFilters?.period || null],
      scheduledDate: [this.currentFilters?.scheduledDate ? new Date(this.currentFilters.scheduledDate) : null, [dateFormatValidator()]]
    });

    this.loadTypeOptions();
    this.loadDriveIdOptions();
    this.loadSiteIdOptions();
    this.setupValidation();
    this.setupTypeSearch();
    this.setupDriveSearch();
    this.setupSiteSearch();
    this.setupPeriodSearch();
    this.subscribeToChapterChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload drive, site, and type options when selectedChapterId changes
    if (changes['selectedChapterId'] && !changes['selectedChapterId'].firstChange) {
      // Clear type selection when chapter changes
      this.filterForm.get('type')?.setValue(null, { emitEvent: false });
      this.typeSearchControl.setValue('');
      this.loadTypeOptions();

      // Clear drive ID selection when chapter changes
      this.filterForm.get('drive')?.setValue(null, { emitEvent: false });
      this.driveSearchControl.setValue('');
      this.loadDriveIdOptions();

      // Clear site ID selection when chapter changes
      this.filterForm.get('siteId')?.setValue(null, { emitEvent: false });
      this.siteSearchControl.setValue('');
      this.loadSiteIdOptions();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupValidation(): void {
    // Watch for any form changes to trigger change detection
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Watch scheduled date changes
    this.filterForm.get('scheduledDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePeriod();
        this.cdr.markForCheck();
      });

    // Watch period changes
    this.filterForm.get('period')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validatePeriod();
        this.cdr.markForCheck();
      });
  }

  private validatePeriod(): void {
    const scheduledDate = this.filterForm.get('scheduledDate')?.value;
    const period = this.filterForm.get('period')?.value;
    const control = this.filterForm.get('period');

    if (scheduledDate && !period) {
      control?.setErrors({ required: true });
      control?.markAsTouched();
    } else {
      control?.setErrors(null);
    }
  }

  private loadTypeOptions(): void {
    this.isLoadingTypes = true;

    const params: DrivesParamsDto = {
      chapterId: this.selectedChapterId || undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined
    };

    this.drivesService.getDriveTypesForFilter(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const driveTypes = response.data || [];
        this.typeOptions = driveTypes.map(dt => ({
          value: dt.driveType,
          label: `${dt.driveType} - ${dt.driveTypeDescription}`
        }));
        this.filteredTypeOptions = [...this.typeOptions];
        this.isLoadingTypes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.typeOptions = [];
        this.filteredTypeOptions = [];
        this.isLoadingTypes = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadDriveIdOptions(): void {
    this.isLoadingDriveIds = true;

    // Build params object using DrivesParamsDto
    const params: DrivesParamsDto = {
      chapterId: this.selectedChapterId || undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined
    };

    // Use the getDrivesForFilter method with params from parent component
    this.drivesService.getDrivesForFilter(params).subscribe({
      next: (response) => {
        const drives = response.data || [];
        this.driveIdOptions = drives.map(drive => ({
          value: drive.drive,
          label: `${drive.drive}`
        }));
        this.filteredDriveIdOptions = [...this.driveIdOptions];
        this.isLoadingDriveIds = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.driveIdOptions = [];
        this.filteredDriveIdOptions = [];
        this.isLoadingDriveIds = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Load Site ID options from API filtered by selected chapter, fromDate, and toDate from parent
   */
  private loadSiteIdOptions(): void {
    this.isLoadingSiteIds = true;

    // Build params object using DrivesParamsDto
    const params: DrivesParamsDto = {
      chapterId: this.selectedChapterId || undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined
    };

    // Use the getGroupSitesForFilter method with params from parent component
    this.drivesService.getGroupSitesForFilter(params).subscribe({
      next: (response) => {
        const groupSites = response.data || [];
        this.siteIdOptions = groupSites.map(site => ({
          value: site.groupSiteId,
          label: `${site.groupSiteId} - ${site.siteName}`
        }));
        this.filteredSiteIdOptions = [...this.siteIdOptions];
        this.isLoadingSiteIds = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.siteIdOptions = [];
        this.filteredSiteIdOptions = [];
        this.isLoadingSiteIds = false;
        this.cdr.markForCheck();
      }
    });
  }

  onApply(): void {
    if (this.isApplyDisabled) {
      return;
    }

    const formValue = this.filterForm.value;

    const filters: DrivesFilterValue = {
      type: formValue.type || null,
      drive: formValue.drive || null,
      siteId: formValue.siteId || null,
      period: formValue.period || null,
      scheduledDate: formValue.scheduledDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      type: null,
      drive: null,
      siteId: null,
      period: null,
      scheduledDate: null
    });

    this.scheduledDateRawInput = '';

    // Clear validation state
    Object.keys(this.filterForm.controls).forEach(key => {
      const control = this.filterForm.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
      control?.updateValueAndValidity();
    });

    // Force change detection after form is fully reset
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check for date format validation errors
    const scheduledDateControl = this.filterForm.get('scheduledDate');
    const hasDateFormatErrors = !!(
      scheduledDateControl?.hasError('invalidDateFormat') ||
      scheduledDateControl?.hasError('matDatepickerParse')
    );

    if (hasDateFormatErrors) {
      return true;
    }

    // Check if at least one field has a value
    const hasAnyValue = formValue.type !== null ||
                        formValue.drive !== null ||
                        formValue.siteId !== null ||
                        (formValue.period !== null &&
                        formValue.scheduledDate !== null);

    // Disable if no values selected OR if there are validation errors
    return !hasAnyValue || this.hasValidationErrors;
  }

  get hasValidationErrors(): boolean {
    return this.filterForm.get('period')?.invalid || false;
  }

  getPeriodError(): string {
    const dateControl = this.filterForm.get('scheduledDate');
    const periodControl = this.filterForm.get('period');
    // Show error if date has value but period is not selected
    if (dateControl?.value && periodControl && periodControl.hasError('required')) {
      return 'Period is required';
    }
    return '';
  }

  /**
   * Store raw input text when user types in scheduled date field
   */
  onScheduledDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.scheduledDateRawInput = input.value;
  }

  /**
   * Restore invalid text when Material clears it on blur
   */
  onScheduledDateBlur(input: HTMLInputElement): void {
    // Use setTimeout to run after Material's blur handling
    setTimeout(() => {
      const control = this.filterForm.get('scheduledDate');
      // If control has no value but we have raw input, restore it
      if (!control?.value && this.scheduledDateRawInput && !input.value) {
        input.value = this.scheduledDateRawInput;
      }
    }, 0);
  }

  private setupTypeSearch(): void {
    this.typeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredTypeOptions = [...this.typeOptions];
          return;
        }
        const lowerSearch = search.toLowerCase();
        this.filteredTypeOptions = this.typeOptions.filter(type =>
          type.label.toLowerCase().includes(lowerSearch) ||
          type.value.toLowerCase().includes(lowerSearch)
        );
        this.cdr.markForCheck();
      });
  }

  private setupDriveSearch(): void {
    this.driveSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredDriveIdOptions = [...this.driveIdOptions];
          return;
        }
        const lowerSearch = search.toLowerCase();
        this.filteredDriveIdOptions = this.driveIdOptions.filter(drive =>
          drive.label.toLowerCase().includes(lowerSearch) ||
          drive.value.toLowerCase().includes(lowerSearch)
        );
        this.cdr.markForCheck();
      });
  }

  private setupSiteSearch(): void {
    this.siteSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredSiteIdOptions = [...this.siteIdOptions];
          return;
        }
        const lowerSearch = search.toLowerCase();
        this.filteredSiteIdOptions = this.siteIdOptions.filter(site =>
          site.label.toLowerCase().includes(lowerSearch) ||
          site.value.toLowerCase().includes(lowerSearch)
        );
        this.cdr.markForCheck();
      });
  }

  private setupPeriodSearch(): void {
    this.periodSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        if (!search) {
          this.filteredPeriodOptions = [...this.periodOptions];
          return;
        }
        const lowerSearch = search.toLowerCase();
        this.filteredPeriodOptions = this.periodOptions.filter(period =>
          period.toLowerCase().includes(lowerSearch)
        );
        this.cdr.markForCheck();
      });
  }

  onTypeDropdownClosed(): void {
    this.typeSearchControl.setValue('');
    this.filteredTypeOptions = [...this.typeOptions];
  }

  onSiteDropdownClosed(): void {
    this.siteSearchControl.setValue('');
    this.filteredSiteIdOptions = [...this.siteIdOptions];
  }

  onDriveDropdownClosed(): void {
    this.driveSearchControl.setValue('');
    this.filteredDriveIdOptions = [...this.driveIdOptions];
  }

  onPeriodDropdownClosed(): void {
    this.periodSearchControl.setValue('');
    this.filteredPeriodOptions = [...this.periodOptions];
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTypeOptions();
        this.loadDriveIdOptions();
        this.loadSiteIdOptions();
      });
  }
}
