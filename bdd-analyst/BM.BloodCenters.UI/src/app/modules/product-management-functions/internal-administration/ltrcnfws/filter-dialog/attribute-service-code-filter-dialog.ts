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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { AttributeGroupDropdownDto } from '../models/attribute-service-code.model';

export interface AttributeServiceCodeFilterValue {
  attributeGroup: string | null;
  price: string | null;
  serviceCode: string | null;
}

@Component({
  selector: 'app-attribute-service-code-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    A11yModule
  ],
  templateUrl: './attribute-service-code-filter-dialog.html',
  styleUrls: ['./attribute-service-code-filter-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttributeServiceCodeFilterDialog implements OnInit, OnDestroy {
  @Input() currentFilters: AttributeServiceCodeFilterValue | null = null;
  @Input() attributeGroups: AttributeGroupDropdownDto[] = [];
  @Input() priceOptions: string[] = [];
  @Input() serviceCodeOptions: string[] = [];
  @Output() apply = new EventEmitter<AttributeServiceCodeFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  groupSearchControl = new FormControl<string>('');
  priceSearchControl = new FormControl<string>('');
  serviceCodeSearchControl = new FormControl<string>('');

  filteredGroups: AttributeGroupDropdownDto[] = [];
  filteredPrices: string[] = [];
  filteredServiceCodes: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filteredGroups = [...this.attributeGroups];
    this.filteredPrices = [...this.priceOptions];
    this.filteredServiceCodes = [...this.serviceCodeOptions];

    this.filterForm = this.fb.group({
      attributeGroup: [this.currentFilters?.attributeGroup || null],
      price: [this.currentFilters?.price || null],
      serviceCode: [this.currentFilters?.serviceCode || null]
    });

    this.groupSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search || '').toLowerCase();
        this.filteredGroups = this.attributeGroups.filter(
          (g) =>
            g.code.toLowerCase().includes(term) ||
            g.description.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    this.priceSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search || '').toLowerCase();
        this.filteredPrices = this.priceOptions.filter(
          (p) => p.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });

    this.serviceCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search || '').toLowerCase();
        this.filteredServiceCodes = this.serviceCodeOptions.filter(
          (c) => c.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onApply(): void {
    const filters: AttributeServiceCodeFilterValue = this.filterForm.value;
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
  }

  onClose(): void {
    this.close.emit();
  }
}
