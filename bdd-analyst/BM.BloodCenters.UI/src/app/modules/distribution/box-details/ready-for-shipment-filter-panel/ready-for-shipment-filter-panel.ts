import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnDestroy,
  Output,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { ReadyForShipmentFilterValue } from '../models/box-details.model';

@Component({
  selector: 'app-ready-for-shipment-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    A11yModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './ready-for-shipment-filter-panel.html',
  styleUrls: ['./ready-for-shipment-filter-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadyForShipmentFilterPanelComponent implements OnInit, OnDestroy {
  @Input() currentFilters: ReadyForShipmentFilterValue | null = null;
  @Input() priorities: string[] = [];
  @Input() consignees: string[] = [];
  @Input() packedByUsers: string[] = [];

  @Output() apply = new EventEmitter<ReadyForShipmentFilterValue>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  filterForm!: FormGroup;
  private initialValues!: ReadyForShipmentFilterValue;
  private destroy$ = new Subject<void>();

  prioritySearchCtrl = new FormControl<string>('');
  consigneeSearchCtrl = new FormControl<string>('');
  packedBySearchCtrl = new FormControl<string>('');

  filteredPriorities: string[] = [];
  filteredConsignees: string[] = [];
  filteredPackedByUsers: string[] = [];

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      priority: [this.currentFilters?.priority || null],
      consignee: [this.currentFilters?.consignee || null],
      packedBy: [this.currentFilters?.packedBy || null],
    });

    this.initialValues = { ...this.filterForm.value };

    this.filteredPriorities = [...this.priorities];
    this.filteredConsignees = [...this.consignees];
    this.filteredPackedByUsers = [...this.packedByUsers];

    this.setupSearchControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchControls(): void {
    this.prioritySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredPriorities = this.priorities.filter((p) =>
          p.toLowerCase().includes(term)
        );
      });

    this.consigneeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredConsignees = this.consignees.filter((c) =>
          c.toLowerCase().includes(term)
        );
      });

    this.packedBySearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        const term = (search ?? '').toLowerCase();
        this.filteredPackedByUsers = this.packedByUsers.filter((u) =>
          u.toLowerCase().includes(term)
        );
      });
  }

  get isApplyDisabled(): boolean {
    const current = this.filterForm.value;
    return (
      current.priority === this.initialValues.priority &&
      current.consignee === this.initialValues.consignee &&
      current.packedBy === this.initialValues.packedBy
    );
  }

  onApply(): void {
    this.apply.emit(this.filterForm.value);
  }

  onClear(): void {
    this.filterForm.reset({
      priority: null,
      consignee: null,
      packedBy: null,
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
