import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ContainerFilterValue, ProductTypeDropdownDto, ContainerIdDropdownDto } from '../../models/container.model';
import { ContainerService } from '../../services/container.service';

@Component({
  selector: 'app-container-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './container-filter-panel.html',
  styleUrls: ['./container-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerFilterPanel implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly containerService = inject(ContainerService);
  private readonly destroy$ = new Subject<void>();

  @Input() currentFilters: ContainerFilterValue | null = null;
  @Input() baseCatalogNo = '';
  @Output() apply = new EventEmitter<ContainerFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  containerIds: ContainerIdDropdownDto[] = [];

  containerIdSearchCtrl = new FormControl('');
  filteredContainerIds: ContainerIdDropdownDto[] = [];

  showTerminatedOptions = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ];

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      catalogNumber: [this.currentFilters?.catalogNumber || null],
      showTerminated: [this.currentFilters?.showTerminated ?? null],
    });

    this.loadDropdownData();
  }

  private loadDropdownData(): void {
    this.containerService.getFilterCatalogNumbers(this.baseCatalogNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.containerIds = data;
          this.filteredContainerIds = data;
          this.setupSearchFilters();
          this.cdr.markForCheck();
        },
        error: () => {
          this.containerIds = [];
          this.filteredContainerIds = [];
        },
      });
  }

  private setupSearchFilters(): void {
    this.containerIdSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredContainerIds = this.filterContainerIds(search);
        this.cdr.markForCheck();
      });
  }

  private filterContainerIds(search: string | null): ContainerIdDropdownDto[] {
    if (!search) return this.containerIds;
    const lower = search.toLowerCase();
    return this.containerIds.filter((c) =>
      c.code.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower)
    );
  }

  get isApplyDisabled(): boolean {
    const values = this.filterForm.value;
    const hasCatalogNumber = values?.catalogNumber;
    const hasShowTerminated = values?.showTerminated !== null && values?.showTerminated !== undefined;

    return !(hasCatalogNumber || hasShowTerminated);
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: ContainerFilterValue = {
      catalogNumber: formValue.catalogNumber || undefined,
      showTerminated: formValue.showTerminated !== null && formValue.showTerminated !== undefined ? formValue.showTerminated : undefined,
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      catalogNumber: null,
      showTerminated: null,
    });
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
