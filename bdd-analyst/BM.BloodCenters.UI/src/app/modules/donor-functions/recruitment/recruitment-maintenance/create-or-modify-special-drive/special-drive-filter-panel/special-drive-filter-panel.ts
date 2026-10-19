import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  inject,
  OnDestroy,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { Subject, startWith } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { SpecialDriveService } from '../services/special-drive.service';
import { DriveCategoryLookup, DriveIdLookup, SponsorLookup } from '../models/special-drive.model';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';

export interface SpecialDriveFilterValue {
  driveId?: string | null;
  sponsorId?: string | null;
  driveType?: string | null;
  category?: string | null;
  driveDate?: Date | null;
}

@Component({
  selector: 'app-special-drive-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './special-drive-filter-panel.html',
  styleUrls: ['./special-drive-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpecialDriveFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: SpecialDriveFilterValue | null = null;
  @Output() apply = new EventEmitter<SpecialDriveFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;
  private destroy$ = new Subject<void>();
  private initialFilterValues: SpecialDriveFilterValue | null = null;

  // Services
  private readonly specialDriveService = inject(SpecialDriveService);
  private readonly headerService = inject(HeaderService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);

  get minDate(): moment.Moment | null {
    return this.chapterTimezoneService.chapterLocalDate();
  }

  readonly pastDateFilter = (date: moment.Moment | null): boolean => {
    const min = this.chapterTimezoneService.chapterLocalDate();
    if (!date) return false;
    if (!min) return true;
    return date.isSameOrAfter(min, 'day');
  };

  // Loading states
  isLoadingDriveIds = false;
  isLoadingSponsors = false;
  isLoadingCategories = false;

  // Static drive type options
  driveTypeOptions = [
    { value: 'F', label: 'Fixed' },
    { value: 'I', label: 'Inside' },
    { value: 'C', label: 'Coach' }
  ];

  // Search controls for dropdowns
  driveIdSearchCtrl = new FormControl('');
  sponsorIdSearchCtrl = new FormControl('');
  driveTypeSearchCtrl = new FormControl('');
  categorySearchCtrl = new FormControl('');

  // Signals for options
  driveIdOptionsSignal = signal<DriveIdLookup[]>([]);
  sponsorOptionsSignal = signal<SponsorLookup[]>([]);
  driveTypeOptionsSignal = signal<typeof this.driveTypeOptions>([]);
  categoryOptionsSignal = signal<DriveCategoryLookup[]>([]);

  // Convert FormControl values to signals
  driveIdSearchSignal = toSignal(this.driveIdSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  sponsorIdSearchSignal = toSignal(this.sponsorIdSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  driveTypeSearchSignal = toSignal(this.driveTypeSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  categorySearchSignal = toSignal(this.categorySearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  // Filtered options
  filteredDriveIdOptions = computed(() => {
    const searchTerm = this.driveIdSearchSignal()?.toLowerCase() || '';
    const options = this.driveIdOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option => option.driveId.toLowerCase().includes(searchTerm));
  });

  filteredSponsorOptions = computed(() => {
    const searchTerm = this.sponsorIdSearchSignal()?.toLowerCase() || '';
    const options = this.sponsorOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.sponsorId.toLowerCase().includes(searchTerm) ||
      option.name.toLowerCase().includes(searchTerm)
    );
  });

  filteredDriveTypeOptions = computed(() => {
    const searchTerm = this.driveTypeSearchSignal()?.toLowerCase() || '';
    const options = this.driveTypeOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option => option.label.toLowerCase().includes(searchTerm));
  });

  filteredCategoryOptions = computed(() => {
    const searchTerm = this.categorySearchSignal()?.toLowerCase() || '';
    const options = this.categoryOptionsSignal();
    if (!searchTerm) return options;
    return options.filter(option =>
      option.code.toLowerCase().includes(searchTerm) ||
      option.description.toLowerCase().includes(searchTerm)
    );
  });

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.buildForm();

    // Store initial filter values to detect changes
    this.initialFilterValues = this.currentFilters ? { ...this.currentFilters } : null;

    this.driveTypeOptionsSignal.set(this.driveTypeOptions);
    this.loadDriveIds();
    this.loadSponsors();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.filterForm = this.fb.group({
      driveId: [this.currentFilters?.driveId || ''],
      sponsorId: [this.currentFilters?.sponsorId || ''],
      driveType: [this.currentFilters?.driveType || ''],
      category: [this.currentFilters?.category || ''],
      driveDate: [this.currentFilters?.driveDate || null]
    });
  }

  private loadDriveIds(): void {
    const chapterId = this.headerService.chapterId();
    if (!chapterId) {
      console.warn('No chapter ID available for loading drive IDs');
      return;
    }

    this.isLoadingDriveIds = true;

    this.specialDriveService.getDriveIds(chapterId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingDriveIds = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (driveIds) => {
          this.driveIdOptionsSignal.set(driveIds);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading drive IDs:', error);
          this.driveIdOptionsSignal.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  private loadSponsors(): void {
    const chapterId = this.headerService.chapterId();
    if (!chapterId) {
      console.warn('No chapter ID available for loading sponsors');
      return;
    }

    this.isLoadingSponsors = true;

    this.specialDriveService.getSponsors(chapterId, '', 500, 0)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingSponsors = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (sponsors) => {
          this.sponsorOptionsSignal.set(sponsors);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading sponsors:', error);
          this.sponsorOptionsSignal.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  private loadCategories(): void {
    this.isLoadingCategories = true;

    this.specialDriveService.getDriveCategories()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingCategories = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (categories) => {
          this.categoryOptionsSignal.set(categories);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.categoryOptionsSignal.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  getSelectedSponsorName(): string {
    const sponsorId = this.filterForm.get('sponsorId')?.value;
    if (!sponsorId) return '';
    const sponsor = this.sponsorOptionsSignal().find(s => s.sponsorId === sponsorId);
    return sponsor?.name || '';
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: SpecialDriveFilterValue = {
      driveId: formValue.driveId && formValue.driveId !== '' ? formValue.driveId : null,
      sponsorId: formValue.sponsorId && formValue.sponsorId !== '' ? formValue.sponsorId : null,
      driveType: formValue.driveType && formValue.driveType !== '' ? formValue.driveType : null,
      category: formValue.category && formValue.category !== '' ? formValue.category : null,
      driveDate: formValue.driveDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      driveId: '',
      sponsorId: '',
      driveType: '',
      category: '',
      driveDate: null
    });

    // Reset initial values so Apply stays disabled until user enters new data
    this.initialFilterValues = {
      driveId: null,
      sponsorId: null,
      driveType: null,
      category: null,
      driveDate: null
    };
  }

  onClose(): void {
    this.close.emit();
  }

  /**
   * Checks if any filter value has changed from the initial state
   */
  hasFilterChanged(): boolean {
    const current = this.filterForm.value;
    const initial = this.initialFilterValues;

    // Normalize empty strings to null for accurate comparison
    const normalize = (value: string | Date | null | undefined): string | Date | null => {
      return (value === '' || value === undefined) ? null : value;
    };

    return (
      normalize(current.driveId) !== normalize(initial?.driveId) ||
      normalize(current.sponsorId) !== normalize(initial?.sponsorId) ||
      normalize(current.driveType) !== normalize(initial?.driveType) ||
      normalize(current.category) !== normalize(initial?.category) ||
      normalize(current.driveDate) !== normalize(initial?.driveDate)
    );
  }
}
