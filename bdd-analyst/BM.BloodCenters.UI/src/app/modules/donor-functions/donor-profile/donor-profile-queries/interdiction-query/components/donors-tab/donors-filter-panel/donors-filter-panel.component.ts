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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { DonorsFilterValue } from '../../../models/interdiction-query.model';

@Component({
  selector: 'app-donors-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    FilterPanelBase
  ],
  templateUrl: './donors-filter-panel.component.html',
  styleUrls: ['./donors-filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonorsFilterPanelComponent implements OnInit {
  @Input() currentFilters: DonorsFilterValue | null = null;
  @Output() apply = new EventEmitter<DonorsFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      sex: [this.currentFilters?.sex ?? ''],
      showTerminated: [this.currentFilters?.showTerminated === true ? 'Yes' : 'No']
    });
  }

  onApply(): void {
    const filters: DonorsFilterValue = {
      showTerminated: this.filterForm.value.showTerminated === 'Yes',
      sex: this.filterForm.value.sex ?? ''
    };
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({ sex: '', showTerminated: 'No' });
  }

  onClose(): void {
    this.close.emit();
  }
}
