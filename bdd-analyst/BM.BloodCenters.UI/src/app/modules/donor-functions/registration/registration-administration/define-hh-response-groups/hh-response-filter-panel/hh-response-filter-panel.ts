import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-hh-response-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './hh-response-filter-panel.html',
  styleUrls: ['./hh-response-filter-panel.scss']
})
export class HHResponseFilterPanel implements OnInit {
  @Input() currentFilters: any = null;
  @Output() apply = new EventEmitter<any>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  filterForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      responseCode: [null]
    });
  }

  ngOnInit(): void {
    if (this.currentFilters?.responseCode) {
      this.filterForm.patchValue({
        responseCode: this.currentFilters.responseCode
      });
    }
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    this.apply.emit({
      responseCode: formValue.responseCode || null
    });
  }

  onClear(): void {
    this.filterForm.reset();
    this.clearAll.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  hasActiveFilters(): boolean {
    return !!this.filterForm.value.responseCode;
  }
}
