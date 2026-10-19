import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { ComponentAttributesFilterValue } from '../models/unit-component-attributes-filter.model';
import { ComponentAttributesFilterOptionsDto, ProductCodeOption, AttributeCodeOption } from '../models/unit-component-attributes.interface';

@Component({
  selector: 'app-component-attributes-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './component-attributes-filter-panel.html',
  styleUrls: ['./component-attributes-filter-panel.scss'],
})
export class ComponentAttributesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ComponentAttributesFilterValue | null = null;
  @Input() filterOptions: ComponentAttributesFilterOptionsDto | null = null;

  @Output() apply = new EventEmitter<ComponentAttributesFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Search controls for dropdowns
  productCodeSearchCtrl = new FormControl('');
  attribCodeSearchCtrl = new FormControl('');
  userSearchCtrl = new FormControl('');

  // Filtered options using signals
  filteredProductCodeOptions = signal<ProductCodeOption[]>([]);
  filteredAttribCodeOptions = signal<AttributeCodeOption[]>([]);
  filteredUserOptions = signal<string[]>([]);

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      productCode: [this.currentFilters?.productCode || ''],
      attribCode: [this.currentFilters?.attribCode || ''],
      insertUserId: [this.currentFilters?.insertUserId || ''],
    });

    // Initialize filtered options
    if (this.filterOptions) {
      this.filteredProductCodeOptions.set(this.filterOptions.productCodes || []);
      this.filteredAttribCodeOptions.set(this.filterOptions.attribCodes || []);
      this.filteredUserOptions.set(this.filterOptions.users || []);
    }

    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchFilters(): void {
    // Filter Product Code options
    this.productCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterProductCodes();
      });

    // Filter Attribute Code options
    this.attribCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterAttribCodes();
      });

    // Filter User options
    this.userSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterUsers();
      });
  }

  private filterProductCodes(): void {
    const search = this.productCodeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredProductCodeOptions.set(this.filterOptions?.productCodes || []);
      return;
    }

    const filtered = (this.filterOptions?.productCodes || []).filter(option =>
      option.code.toLowerCase().includes(search) ||
      (option.description && option.description.toLowerCase().includes(search))
    );
    this.filteredProductCodeOptions.set(filtered);
  }

  private filterAttribCodes(): void {
    const search = this.attribCodeSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredAttribCodeOptions.set(this.filterOptions?.attribCodes || []);
      return;
    }

    const filtered = (this.filterOptions?.attribCodes || []).filter(option =>
      option.code.toLowerCase().includes(search) ||
      (option.description && option.description.toLowerCase().includes(search))
    );
    this.filteredAttribCodeOptions.set(filtered);
  }

  private filterUsers(): void {
    const search = this.userSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredUserOptions.set(this.filterOptions?.users || []);
      return;
    }

    const filtered = (this.filterOptions?.users || []).filter(user =>
      user.toLowerCase().includes(search)
    );
    this.filteredUserOptions.set(filtered);
  }

  onApply(): void {
    const filters: ComponentAttributesFilterValue = {
      productCode: this.filterForm.value.productCode || undefined,
      attribCode: this.filterForm.value.attribCode || undefined,
      insertUserId: this.filterForm.value.insertUserId || undefined,
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
  }

  onClose(): void {
    this.close.emit();
  }
}
