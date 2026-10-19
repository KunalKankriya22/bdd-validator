import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { HeaderService } from '@shared/services/header.service';
import { CallListStatus, CreateCallListRequest } from '../../models/hla-rbc-request-query.model';
import { Moment } from 'moment';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'app-list-generation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './list-generation-dialog.html',
  styleUrls: ['./list-generation-dialog.scss'],
  providers: [
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
  ]
})
export class ListGenerationDialog implements OnInit, AfterViewInit {
  private dialogRef = inject(MatDialogRef<ListGenerationDialog>);
  private fb = inject(FormBuilder);
  private headerService = inject(HeaderService);
  private destroyRef = inject(DestroyRef);
  selectedDonorIds = inject<string[]>(MAT_DIALOG_DATA);

  @ViewChild('listNameInput') listNameInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  statusSearchControl = new FormControl<string>('');
  private statusSearchTerm = signal<string>('');

  private get chapterOffset(): string {
    return this.headerService.chapterTimeZone();
  }

  statusOptions: { value: string; label: string }[] = [
    { value: 'HLRBC', label: 'HLRBC' },
    { value: 'ACTIVE', label: 'ACTIVE' },
    { value: 'CANCELLED', label: 'CANCELLED' },
    { value: 'RELEASED', label: 'RELEASED' },
    { value: 'SCHEDULED', label: 'SCHEDULED' },
    { value: 'SUBMITEXEC', label: 'SUBMITEXEC' },
    { value: 'TOBROWSER', label: 'TOBROWSER' }
  ];

  filteredStatusOptions = computed(() => {
    const term = this.statusSearchTerm().toLowerCase();
    if (!term) return this.statusOptions;
    return this.statusOptions.filter(option =>
      option.label.toLowerCase().includes(term) ||
      option.value.toLowerCase().includes(term)
    );
  });

  get minDate() {
    return DateFieldValidationUtility.getMinDate(this.chapterOffset);
  }

  // Date filter to disable past dates
  get shelfLifeFilter() {
    return DateFieldValidationUtility.effectiveDateFilter;
  }

  // Error state matcher for shelf life field
  shelfLifeErrorMatcher = DateFieldValidationUtility.createDateErrorStateMatcher(
    () => this.getShelfLifeError()
  );

  ngOnInit(): void {
    this.form = this.fb.group({
      listName: ['', [Validators.required, Validators.maxLength(50)]],
      listStatus: ['', [Validators.required, Validators.maxLength(10)]],
      shelfLife: [null, [
        Validators.required,
        DateFieldValidationUtility.validDateValidator(),
        DateFieldValidationUtility.effectiveDateNotPastValidator()
      ]],
      comments: ['', Validators.maxLength(240)]
    });

    // Setup status search
    this.statusSearchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.statusSearchTerm.set(value || '');
      });
  }

  ngAfterViewInit(): void {
    // Focus on the List Name input field after view initialization
    setTimeout(() => {
      this.listNameInput?.nativeElement?.focus();
    }, 0);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { listName, listStatus, shelfLife, comments } = this.form.value;

    const payload: CreateCallListRequest = {
      listName: listName.trim(),
      listStatus: listStatus,
      shelfLife: DateFieldValidationUtility.serializeDateForApi(shelfLife) || '',
      selectedDonorIds: this.selectedDonorIds,
      ...(comments?.trim() && { comments: comments.trim() })
    };

    this.dialogRef.close(payload);
  }

  onShelfLifeInput(event: Event): void {
    DateFieldValidationUtility.handleStartDateInput(
      (event.target as HTMLInputElement).value,
      this.form.get('shelfLife')
    );
  }

  getShelfLifeError(): string {
    const control = this.form.get('shelfLife');
    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    // Check matDatepickerParse first - user typed something but datepicker couldn't parse it
    if (control.hasError('matDatepickerParse')) {
      return 'Shelf Life is invalid';
    }

    if (control.hasError('required')) {
      return 'Shelf Life is required';
    }

    if (control.hasError('invalidDateFormat')) {
      return 'Shelf Life is invalid';
    }

    if (control.hasError('invalidDate')) {
      return 'Shelf Life is invalid';
    }

    if (control.hasError('effectiveDatePast')) {
      return 'Shelf Life cannot be past date';
    }

    return '';
  }

  get f() { return this.form.controls; }
}
