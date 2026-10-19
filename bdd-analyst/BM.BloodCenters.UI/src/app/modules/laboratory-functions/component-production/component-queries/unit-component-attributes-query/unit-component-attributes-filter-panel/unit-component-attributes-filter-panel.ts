import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { UnitAttributesFilterValue } from '../models/unit-component-attributes-filter.model';
import { UnitAttributesFilterOptionsDto, AttributeCodeOption, AttributeGroupOption } from '../models/unit-component-attributes.interface';

@Component({
  selector: 'app-unit-component-attributes-filter-panel',
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
  templateUrl: './unit-component-attributes-filter-panel.html',
  styleUrls: ['./unit-component-attributes-filter-panel.scss'],
})
export class UnitComponentAttributesFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: UnitAttributesFilterValue | null = null;
  @Input() filterOptions: UnitAttributesFilterOptionsDto | null = null;

  @Output() apply = new EventEmitter<UnitAttributesFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Search controls for dropdowns
  attribCodeSearchCtrl = new FormControl('');
  attribGroupSearchCtrl = new FormControl('');
  userSearchCtrl = new FormControl('');

  // Filtered options using signals
  filteredAttribCodeOptions = signal<AttributeCodeOption[]>([]);
  filteredAttribGroupOptions = signal<AttributeGroupOption[]>([]);
  filteredUserOptions = signal<string[]>([]);

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      attribCode: [this.currentFilters?.attribCode || ''],
      attribGroup: [this.currentFilters?.attribGroup || ''],
      insertUserId: [this.currentFilters?.insertUserId || ''],
    });

    // Initialize filtered options
    if (this.filterOptions) {
      this.filteredAttribCodeOptions.set(this.filterOptions.attribCodes || []);
      this.filteredAttribGroupOptions.set(this.filterOptions.attribGroups || []);
      this.filteredUserOptions.set(this.filterOptions.users || []);
    }

    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchFilters(): void {
    // Filter Attribute Code options
    this.attribCodeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterAttribCodes();
      });

    // Filter Attribute Group options
    this.attribGroupSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterAttribGroups();
      });

    // Filter User options
    this.userSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterUsers();
      });
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

  private filterAttribGroups(): void {
    const search = this.attribGroupSearchCtrl.value?.toLowerCase() || '';
    if (!search) {
      this.filteredAttribGroupOptions.set(this.filterOptions?.attribGroups || []);
      return;
    }

    const filtered = (this.filterOptions?.attribGroups || []).filter(option =>
      option.code.toLowerCase().includes(search)
    );
    this.filteredAttribGroupOptions.set(filtered);
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
    const filters: UnitAttributesFilterValue = {
      attribCode: this.filterForm.value.attribCode || undefined,
      attribGroup: this.filterForm.value.attribGroup || undefined,
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
