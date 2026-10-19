import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import moment from 'moment';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

// Shared
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

// Models
import { OrderStatusCodeDto, OrderFilters } from '../../models/order-processing-status.model';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.scss'
})
export class FilterPanelComponent implements OnInit {
  // Unique ID generation for accessibility
  private static nextId = 0;
  protected readonly componentId = `filter-panel-${FilterPanelComponent.nextId++}`;

  // Generate unique IDs for elements
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Dependency injection
  private readonly fb = inject(FormBuilder);

  // Inputs
  @Input() statusCodes: OrderStatusCodeDto[] = [];
  @Input() currentFilters: OrderFilters = {};

  // Outputs
  @Output() applyFilters = new EventEmitter<OrderFilters>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // Form
  filterForm!: FormGroup;

  // Today for date validation
  protected readonly today = moment().startOf('day');

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initialize form with current filter values
   */
  private initForm(): void {
    this.filterForm = this.fb.group({
      age: [this.currentFilters.age || null, [Validators.min(0)]],
      orderStatus: [this.currentFilters.orderStatus || ''],
      fromDate: [this.currentFilters.fromDate || null],
      toDate: [this.currentFilters.toDate || null]
    });
  }

  /**
   * Get form controls
   */
  get f() {
    return this.filterForm.controls;
  }

  /**
   * Apply filters
   */
  protected onApply(): void {
    if (this.filterForm.invalid) {
      Object.keys(this.filterForm.controls).forEach(key => {
        this.filterForm.controls[key].markAsTouched();
      });
      return;
    }

    const formValue = this.filterForm.value;
    const filters: OrderFilters = {
      age: formValue.age !== null && formValue.age !== '' ? formValue.age : undefined,
      orderStatus: formValue.orderStatus || undefined,
      fromDate: formValue.fromDate ? moment(formValue.fromDate).toDate() : undefined,
      toDate: formValue.toDate ? moment(formValue.toDate).toDate() : undefined
    };

    this.applyFilters.emit(filters);
  }

  /**
   * Clear all filters
   */
  protected onClear(): void {
    this.filterForm.reset({
      age: null,
      orderStatus: '',
      fromDate: null,
      toDate: null
    });
    this.clearFilters.emit();
  }

  /**
   * Close filter panel
   */
  protected onClose(): void {
    this.close.emit();
  }

  /**
   * Numbers-only keypress handler
   */
  protected onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Strip non-numeric characters on paste
   */
  protected onPasteNumbers(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericOnly = pastedText.replace(/[^0-9]/g, '');
    document.execCommand('insertText', false, numericOnly);
  }
}
