import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '../../../../../../shared/date/date-formats';
import { FilterPanelBase } from '../../../../../../shared/components/filter-panel-base/filter-panel-base';
import { FilterCriteria } from '../../models/regional-testing-contract.model';
import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';

@Component({
  selector: 'app-rgcon-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    FilterPanelBase
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './filters-dialog.html',
  styleUrl: './filters-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltersDialogComponent implements OnInit {
  @Input() currentFilters: FilterCriteria | null = null;

  @Output() apply = new EventEmitter<FilterCriteria>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(RegionalTestingContractApiService);

  protected readonly chapters = signal<{ chapterId: string; chapterName: string }[]>([]);

  filtersForm!: FormGroup;

  protected readonly effectiveDatePeriodOptions = [
    { value: 'After', label: 'After' },
    { value: 'Before', label: 'Before' }
  ];

  protected readonly terminationDatePeriodOptions = [
    { value: 'Before', label: 'Before' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadChapters();
  }

  private initForm(): void {
    this.filtersForm = this.fb.group({
      clientChapter: [this.currentFilters?.clientChapter || ''],
      effectiveDatePeriod: [this.currentFilters?.effectiveDatePeriod || 'After'],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      terminationDatePeriod: ['Before'],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });
  }

  private loadChapters(): void {
    this.apiService.getChaptersLookup().subscribe({
      next: (data) => this.chapters.set(data),
      error: () => {}
    });
  }

  get isApplyDisabled(): boolean {
    const v = this.filtersForm.value;
    return !(v.clientChapter || v.effectiveDate || v.terminationDate);
  }

  onApply(): void {
    if (this.filtersForm.invalid || this.isApplyDisabled) {
      return;
    }

    const formValue = this.filtersForm.value;
    const criteria: FilterCriteria = {
      clientChapter: formValue.clientChapter || undefined,
      effectiveDatePeriod: formValue.effectiveDatePeriod || undefined,
      effectiveDate: formValue.effectiveDate || undefined,
      terminationDatePeriod: formValue.terminationDatePeriod || undefined,
      terminationDate: formValue.terminationDate || undefined
    };

    this.apply.emit(criteria);
  }

  onClear(): void {
    this.filtersForm.reset({
      clientChapter: '',
      effectiveDatePeriod: 'After',
      terminationDatePeriod: 'Before'
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
