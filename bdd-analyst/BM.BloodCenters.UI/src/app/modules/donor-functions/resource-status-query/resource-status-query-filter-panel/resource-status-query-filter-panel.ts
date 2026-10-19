import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ResourceStatusQueryFilterValue } from '../models/resource-status-query.model';

@Component({
  selector: 'app-resource-status-query-filter-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './resource-status-query-filter-panel.html',
  styleUrls: ['./resource-status-query-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceStatusQueryFilterPanel implements OnInit {
  @Input() currentFilters: ResourceStatusQueryFilterValue | null = null;
  @Output() apply = new EventEmitter<ResourceStatusQueryFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  criticalOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      criticalInd: [this.currentFilters?.criticalInd || null]
    });
  }


  get isApplyDisabled(): boolean {
    if (this.filterForm?.invalid) return true;
    const formValue = this.filterForm?.value;
    if (!formValue) return true;
    return formValue.criticalInd === null;
  }

  onApply(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    const formValue = this.filterForm.value;
    const filters: ResourceStatusQueryFilterValue = {
      criticalInd: formValue.criticalInd || null
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
