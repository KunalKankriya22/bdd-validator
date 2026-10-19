import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { Subject } from 'rxjs';
import moment, { Moment } from 'moment';

import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { UnitLevelQCFilterValue, DropdownOption } from '../models/unit-level-qc.model';

/**
 * Filter Panel Component for Unit Level QC for Labeling
 * Provides filtering capabilities for unit query
 */
@Component({
  selector: 'app-unit-level-qc-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  templateUrl: './unit-level-qc-filter-panel.html',
  styleUrls: ['./unit-level-qc-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitLevelQcFilterPanel implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `unit-level-qc-filter-panel-${UnitLevelQcFilterPanel.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  @Input() currentFilters: UnitLevelQCFilterValue | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<UnitLevelQCFilterValue>();

  filterForm!: FormGroup;

  // Dropdown options
  qcLabelFlagOptions: DropdownOption[] = [
    { value: 'All', label: 'All' },
    { value: 'Y', label: 'Y' },
    { value: 'N', label: 'N' }
  ];

  aboOptions: DropdownOption[] = [
    { value: 'All', label: 'All' },
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'O', label: 'O' },
    { value: 'AB', label: 'AB' }
  ];

  rhOptions: DropdownOption[] = [
    { value: 'All', label: 'All' },
    { value: '+', label: '+' },
    { value: '-', label: '-' }
  ];

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      unitId: [this.currentFilters?.unitId ?? ''],
      productCode: [this.currentFilters?.productCode ?? ''],
      qcLabelFlag: [this.currentFilters?.qcLabelFlag ?? 'All'],
      systemLabelDecision: [this.currentFilters?.systemLabelDecision ?? ''],
      abo: [this.currentFilters?.abo ?? 'All'],
      rh: [this.currentFilters?.rh ?? 'All'],
      status: [this.currentFilters?.status ?? ''],
      collDateFrom: [this.currentFilters?.collDateFrom ? moment(this.currentFilters.collDateFrom) : null],
      collDateTo: [this.currentFilters?.collDateTo ? moment(this.currentFilters.collDateTo) : null],
      labelDatsFrom: [this.currentFilters?.labelDatsFrom ? moment(this.currentFilters.labelDatsFrom) : null],
      labelDatsTo: [this.currentFilters?.labelDatsTo ? moment(this.currentFilters.labelDatsTo) : null]
    });
  }

  onApply(): void {
    const formValues = this.filterForm.value;

    const filters: UnitLevelQCFilterValue = {
      unitId: formValues.unitId?.trim() || undefined,
      productCode: formValues.productCode?.trim() || undefined,
      qcLabelFlag: formValues.qcLabelFlag === 'All' ? undefined : formValues.qcLabelFlag,
      systemLabelDecision: formValues.systemLabelDecision?.trim() || undefined,
      abo: formValues.abo === 'All' ? undefined : formValues.abo,
      rh: formValues.rh === 'All' ? undefined : formValues.rh,
      status: formValues.status?.trim() || undefined,
      collDateFrom: formValues.collDateFrom ? (formValues.collDateFrom as Moment).toDate() : null,
      collDateTo: formValues.collDateTo ? (formValues.collDateTo as Moment).toDate() : null,
      labelDatsFrom: formValues.labelDatsFrom ? (formValues.labelDatsFrom as Moment).toDate() : null,
      labelDatsTo: formValues.labelDatsTo ? (formValues.labelDatsTo as Moment).toDate() : null
    };

    this.apply.emit(filters);
  }

  onClear(): void {
    this.filterForm.reset({
      unitId: '',
      productCode: '',
      qcLabelFlag: 'All',
      systemLabelDecision: '',
      abo: 'All',
      rh: 'All',
      status: '',
      collDateFrom: null,
      collDateTo: null,
      labelDatsFrom: null,
      labelDatsTo: null
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
