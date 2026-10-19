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
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, take, takeUntil } from 'rxjs';

import { AddFunctionsService } from '../services/add-functions.service';
import { AddFunctionsFilterValue } from '../utils/add-functions-filter-chips.utils';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';

@Component({
  selector: 'app-add-functions-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    A11yModule,
    TranslateModule,
    NgxMatSelectSearchModule,
    FilterPanelBase
  ],
  templateUrl: './add-functions-filter-panel.html',
  styleUrls: ['./add-functions-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFunctionsFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: AddFunctionsFilterValue | null = null;
  @Output() apply = new EventEmitter<AddFunctionsFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  functionTypeOptions: string[] = [];
  scopeOptions: string[] = [];
  filteredScopeOptions: string[] = [];
  scopeSearchControl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private service: AddFunctionsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      functionType: [this.currentFilters?.functionType || null],
      scope: [this.currentFilters?.scope || null]
    });

    this.loadFilters();
    this.setupScopeSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupScopeSearch(): void {
    this.scopeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        const term = (searchTerm as string || '').toLowerCase();
        this.filteredScopeOptions = this.scopeOptions.filter(scope =>
          scope.toLowerCase().includes(term)
        );
        this.cdr.markForCheck();
      });
  }

  private loadFilters(): void {
    this.service.getFilters()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          // Filter to only show PAGE and MENU options
          this.functionTypeOptions = response.functionTypes.filter(
            (type: string) => type === 'PAGE' || type === 'MENU'
          );
          this.scopeOptions = response.functionScopes;
          this.filteredScopeOptions = [...this.scopeOptions];

          if (this.currentFilters) {
            this.filterForm.patchValue({
              functionType: this.currentFilters.functionType,
              scope: this.currentFilters.scope
            });
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading filters:', error);
        }
      });
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: AddFunctionsFilterValue = {
      functionType: formValue.functionType || null,
      scope: formValue.scope || null
    };
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      functionType: null,
      scope: null
    });
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }

  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // Check if at least one field has a value
    const hasAnyValue =
      (formValue.functionType !== null && formValue.functionType !== '') ||
      (formValue.scope !== null && formValue.scope !== '');

    return !hasAnyValue;
  }
}
