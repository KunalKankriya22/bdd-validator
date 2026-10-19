import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  GroupInterdictionFilterValue,
  ValidInterdictionDto
} from '../models/group-interdiction.model';

@Component({
  selector: 'app-group-interdiction-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './filter-panel.html',
  styleUrls: ['./filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupInterdictionFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: GroupInterdictionFilterValue | null = null;
  @Input() interdictionCodes: ValidInterdictionDto[] = [];
  @Output() apply = new EventEmitter<GroupInterdictionFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  interTypeOptions = [
    { value: 'HOLD', label: 'Hold' },
    { value: 'NFT', label: 'NFT' }
  ];

  interCodeSearchControl = new FormControl('');
  filteredInterCodeOptions: ValidInterdictionDto[] = [];

  private initialFilterValues: GroupInterdictionFilterValue | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupForm();
    this.filteredInterCodeOptions = [...this.interdictionCodes];
    this.setupSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupForm(): void {
    this.initialFilterValues = this.currentFilters ? { ...this.currentFilters } : null;

    this.filterForm = this.fb.group({
      interType: [this.currentFilters?.interType ?? null],
      interCode: [this.currentFilters?.interCode ?? null]
    });

    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  private setupSearchControls(): void {
    this.interCodeSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search: string | null) => {
        this.filteredInterCodeOptions = this.filterInterCodes(search);
        this.cdr.markForCheck();
      });
  }

  private filterInterCodes(search: string | null): ValidInterdictionDto[] {
    if (!search || search.length < 1) {
      return [...this.interdictionCodes];
    }
    const lowerSearch = search.toLowerCase();
    return this.interdictionCodes.filter(
      (option) =>
        option.interCode.toLowerCase().includes(lowerSearch) ||
        option.interDesc.toLowerCase().includes(lowerSearch)
    );
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    const hasAnyFilter = !!(formValue.interType || formValue.interCode);

    if (!hasAnyFilter) {
      return true;
    }

    const currentValues: GroupInterdictionFilterValue = {
      interType: formValue.interType || undefined,
      interCode: formValue.interCode || undefined
    };

    const initialValues: GroupInterdictionFilterValue = {
      interType: this.initialFilterValues?.interType || undefined,
      interCode: this.initialFilterValues?.interCode || undefined
    };

    return (
      currentValues.interType === initialValues.interType &&
      currentValues.interCode === initialValues.interCode
    );
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: GroupInterdictionFilterValue = {};

    if (formValue.interType) {
      filters.interType = formValue.interType;
    }
    if (formValue.interCode) {
      filters.interCode = formValue.interCode;
    }

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      interType: null,
      interCode: null
    });

    this.interCodeSearchControl.setValue('', { emitEvent: false });
    this.filteredInterCodeOptions = [...this.interdictionCodes];

    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  getInterCodeDisplay(option: ValidInterdictionDto): string {
    return `${option.interCode} - ${option.interDesc}`;
  }
}
