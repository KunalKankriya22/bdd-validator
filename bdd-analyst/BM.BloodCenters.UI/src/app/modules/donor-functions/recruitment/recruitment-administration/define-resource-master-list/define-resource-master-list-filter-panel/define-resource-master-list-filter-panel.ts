import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { DefineResourceMasterListFilterValue } from '../models/define-resource-master-list.model';

@Component({
  selector: 'app-define-resource-master-list-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule
  ],
  templateUrl: './define-resource-master-list-filter-panel.html',
  styleUrls: ['./define-resource-master-list-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefineResourceMasterListFilterPanel implements OnInit {
  @Input() currentFilters: DefineResourceMasterListFilterValue | null = null;
  @Output() apply = new EventEmitter<DefineResourceMasterListFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      showTermination: [this.currentFilters?.showTermination || 'No'],
      critical: [this.currentFilters?.critical || 'Both (Yes & No)'],
      periodType1: [this.currentFilters?.periodType1 || 'After'],
      effectiveDate: [this.currentFilters?.effectiveDate || null],
      periodType2: [this.currentFilters?.periodType2 || 'Before'],
      terminationDate: [this.currentFilters?.terminationDate || null]
    });
  }

  onApply(): void {
    const formValue = this.filterForm.value;

    const filters: DefineResourceMasterListFilterValue = {
      resourceCode: this.currentFilters?.resourceCode || null,
      type: this.currentFilters?.type || null,
      sequence: this.currentFilters?.sequence || null,
      showTermination: formValue.showTermination || null,
      critical: formValue.critical || null,
      periodType1: formValue.periodType1 || null,
      effectiveDate: formValue.effectiveDate || null,
      periodType2: formValue.periodType2 || null,
      terminationDate: formValue.terminationDate || null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      showTermination: 'No',
      critical: 'Both (Yes & No)',
      periodType1: 'After',
      periodType2: 'Before'
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
