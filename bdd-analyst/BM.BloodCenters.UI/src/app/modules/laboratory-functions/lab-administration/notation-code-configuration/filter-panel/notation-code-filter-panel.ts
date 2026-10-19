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

import { NotationCodeFilterValue, LookUp, NOTATION_TYPE_LOOKUP } from '../models/notation-code.model';

@Component({
  selector: 'app-notation-code-filter-panel',
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
  templateUrl: './notation-code-filter-panel.html',
  styleUrls: ['./notation-code-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotationCodeFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: NotationCodeFilterValue | null = null;
  @Output() apply = new EventEmitter<NotationCodeFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  // Notation Type options (hardcoded)
  notationTypeOptions: LookUp[] = NOTATION_TYPE_LOOKUP;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      notationCode: [this.currentFilters?.notationCode ?? null],
      notationType: [this.currentFilters?.notationType ?? null]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onApply(): void {
    if (this.filterForm.invalid) {
      return;
    }

    const formValue = this.filterForm.value;

    const filterValue: NotationCodeFilterValue = {
      notationCode: formValue.notationCode || null,
      notationType: formValue.notationType || null
    };

    this.apply.emit(filterValue);
  }

  onClear(): void {
    this.filterForm.reset({
      notationCode: null,
      notationType: null
    });
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.close.emit();
  }
}
