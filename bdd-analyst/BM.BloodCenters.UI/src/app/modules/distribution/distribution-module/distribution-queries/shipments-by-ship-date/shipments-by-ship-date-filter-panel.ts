import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';
import { FilterState, LookupOption } from './models/shipments-by-ship-date.model';
import { ShipmentsByShipDateService } from './services/shipments-by-ship-date.service';
import moment from 'moment';

@Component({
  selector: 'app-shipments-by-ship-date-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatMomentDateModule,
    FilterPanelBase,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  template: `
    <app-filter-panel-base
      title="Filters"
      [maxContentHeight]="360"
      [width]="350"
      (apply)="onApply()"
      (clear)="onClear()"
      (close)="onClose()">

      <form [formGroup]="filterForm">
        <mat-form-field appearance="fill" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status" aria-label="Filter by status">
            <mat-option [value]="null">All</mat-option>
            @for (opt of statusOptions(); track opt.code) {
              <mat-option [value]="opt.code">{{ opt.description }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="filter-field">
          <mat-label>Type</mat-label>
          <mat-select formControlName="shipmentType" aria-label="Filter by type">
            <mat-option [value]="null">All</mat-option>
            @for (opt of typeOptions(); track opt.code) {
              <mat-option [value]="opt.code">{{ opt.description }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill" class="filter-field">
          <mat-label>Date Received</mat-label>
          <input matInput [matDatepicker]="dateReceivedPicker" formControlName="dateReceived"
                 aria-label="Filter by date received">
          <mat-datepicker-toggle matIconSuffix [for]="dateReceivedPicker"
                                aria-label="Open date received calendar"></mat-datepicker-toggle>
          <mat-datepicker #dateReceivedPicker></mat-datepicker>
        </mat-form-field>
      </form>

    </app-filter-panel-base>
  `,
  styles: [
    `
      .filter-field {
        width: 100%;
        margin-bottom: 0;
      }

      ::ng-deep .filter-panel__content {
        padding: 8px 20px !important;
        gap: 4px !important;
      }

      ::ng-deep .filter-panel__header{
        padding: 0 20px !important;
      }
    `,
  ],
})
export class ShipmentsByShipDateFilterPanel implements OnInit {
  @Input() currentFilters: FilterState = {
    status: null,
    shipmentType: null,
    dateReceived: null,
  };

  @Output() apply = new EventEmitter<FilterState>();
  @Output() clear = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private readonly shipmentService = inject(ShipmentsByShipDateService);

  statusOptions = signal<LookupOption[]>([]);
  typeOptions = signal<LookupOption[]>([]);
  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      status: [null],
      shipmentType: [null],
      dateReceived: [null],
    });
  }

  ngOnInit(): void {
    this.loadFilterOptions();

    if (this.currentFilters) {
      this.filterForm.patchValue({
        status: this.currentFilters.status,
        shipmentType: this.currentFilters.shipmentType,
        dateReceived: this.currentFilters.dateReceived ? moment(this.currentFilters.dateReceived) : null,
      });
    }
  }

  private loadFilterOptions(): void {
    this.shipmentService.getFilterOptions().subscribe({
      next: (options) => {
        this.statusOptions.set(options.statuses);
        this.typeOptions.set(options.types);
      },
    });
  }

  onApply(): void {
    const values = this.filterForm.value;
    const filters: FilterState = {
      status: values.status || null,
      shipmentType: values.shipmentType || null,
      dateReceived: values.dateReceived
        ? moment.isMoment(values.dateReceived)
          ? values.dateReceived.format('YYYY-MM-DD')
          : values.dateReceived
        : null,
    };
    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset();
    this.clear.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}
