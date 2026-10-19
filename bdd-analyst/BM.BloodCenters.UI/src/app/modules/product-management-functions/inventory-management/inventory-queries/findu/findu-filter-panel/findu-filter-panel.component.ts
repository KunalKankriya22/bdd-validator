import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subject } from 'rxjs';

import {
  StatusFilterValue,
  YesNoBlankOption
} from '../models/findu.models';

@Component({
  selector: 'app-findu-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './findu-filter-panel.component.html',
  styleUrls: ['./findu-filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinduFilterPanelComponent implements OnInit, OnDestroy {
  @Input() currentFilters: StatusFilterValue | null = null;

  @Output() apply = new EventEmitter<StatusFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  readonly yesNoBlankOptions: YesNoBlankOption[] = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      expired: [this.currentFilters?.expired ?? ''],
      interdicted: [this.currentFilters?.interdicted ?? ''],
      available: [this.currentFilters?.available ?? ''],
      labeled: [this.currentFilters?.labeled ?? ''],
      rejected: [this.currentFilters?.rejected ?? ''],
      tested: [this.currentFilters?.tested ?? ''],
      shipped: [this.currentFilters?.shipped ?? '']
    });
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: StatusFilterValue = {
      expired: formValue.expired || null,
      interdicted: formValue.interdicted || null,
      available: formValue.available || null,
      labeled: formValue.labeled || null,
      rejected: formValue.rejected || null,
      tested: formValue.tested || null,
      shipped: formValue.shipped || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      expired: '',
      interdicted: '',
      available: '',
      labeled: '',
      rejected: '',
      tested: '',
      shipped: ''
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
