import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';

import { ServiceHistoryQueryService } from '../services/service-history-query.service';
import {
  ServiceHistoryFilterValue,
  EquipmentTypeLookup,
  EquipmentIdLookup,
  EquipmentReferenceLookup
} from '../models/service-history-query.model';

@Component({
  selector: 'app-service-history-query-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './service-history-query-filter-panel.html',
  styleUrls: ['./service-history-query-filter-panel.scss']
})
export class ServiceHistoryQueryFilterPanel implements OnInit, OnDestroy {
  @Input() currentFilters: ServiceHistoryFilterValue | null = null;
  @Output() apply = new EventEmitter<ServiceHistoryFilterValue>();
  @Output() close = new EventEmitter<void>();

  filterForm: FormGroup;

  equipmentTypes: EquipmentTypeLookup[] = [];
  equipmentIds: EquipmentIdLookup[] = [];
  equipmentReferences: EquipmentReferenceLookup[] = [];

  isLoadingTypes = false;
  isLoadingIds = false;
  isLoadingReferences = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private serviceHistoryQueryService: ServiceHistoryQueryService
  ) {
    this.filterForm = this.fb.group({
      equipmentType: [null],
      equipmentId: [null],
      equipmentReference: [null],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadEquipmentTypes();
    this.setupFormSubscriptions();
    this.initializeFormWithCurrentFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load equipment types for dropdown
   */
  private loadEquipmentTypes(): void {
    this.isLoadingTypes = true;
    this.serviceHistoryQueryService
      .getEquipmentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.equipmentTypes = types;
          this.isLoadingTypes = false;
        },
        error: (error) => {
          console.error('Error loading equipment types:', error);
          this.isLoadingTypes = false;
        }
      });
  }

  /**
   * Setup form value change subscriptions
   */
  private setupFormSubscriptions(): void {
    // When equipment type changes, load equipment IDs and clear dependent fields
    this.filterForm.get('equipmentType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((equipmentType) => {
        // Clear dependent fields
        this.filterForm.patchValue({
          equipmentId: null,
          equipmentReference: null
        }, { emitEvent: false });

        // Clear dropdown arrays
        this.equipmentIds = [];
        this.equipmentReferences = [];

        // Load equipment IDs if equipment type is selected
        if (equipmentType) {
          this.loadEquipmentIds(equipmentType);
        }
      });

    // When equipment ID changes, load equipment references and clear dependent fields
    this.filterForm.get('equipmentId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((equipmentId) => {
        // Clear dependent field
        this.filterForm.patchValue({
          equipmentReference: null
        }, { emitEvent: false });

        // Clear dropdown array
        this.equipmentReferences = [];

        // Load equipment references if both equipment type and ID are selected
        const equipmentType = this.filterForm.get('equipmentType')?.value;
        if (equipmentType && equipmentId) {
          this.loadEquipmentReferences(equipmentType, equipmentId);
        }
      });
  }

  /**
   * Load equipment IDs for selected equipment type
   */
  private loadEquipmentIds(equipmentType: string): void {
    this.isLoadingIds = true;
    this.serviceHistoryQueryService
      .getEquipmentIds(equipmentType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ids) => {
          this.equipmentIds = ids;
          this.isLoadingIds = false;
        },
        error: (error) => {
          console.error('Error loading equipment IDs:', error);
          this.isLoadingIds = false;
        }
      });
  }

  /**
   * Load equipment references for selected equipment type and ID
   */
  private loadEquipmentReferences(equipmentType: string, equipmentId: string): void {
    this.isLoadingReferences = true;
    this.serviceHistoryQueryService
      .getEquipmentReferences(equipmentType, equipmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (references) => {
          this.equipmentReferences = references;
          this.isLoadingReferences = false;
        },
        error: (error) => {
          console.error('Error loading equipment references:', error);
          this.isLoadingReferences = false;
        }
      });
  }

  /**
   * Initialize form with current filter values
   */
  private initializeFormWithCurrentFilters(): void {
    if (this.currentFilters) {
      this.filterForm.patchValue({
        equipmentType: this.currentFilters.equipmentType || null,
        equipmentId: this.currentFilters.equipmentId || null,
        equipmentReference: this.currentFilters.equipmentReference || null,
        startDate: this.currentFilters.startDate || null,
        endDate: this.currentFilters.endDate || null
      });

      // Load dependent dropdowns if values exist
      if (this.currentFilters.equipmentType) {
        this.loadEquipmentIds(this.currentFilters.equipmentType);
      }
      if (this.currentFilters.equipmentType && this.currentFilters.equipmentId) {
        this.loadEquipmentReferences(
          this.currentFilters.equipmentType,
          this.currentFilters.equipmentId
        );
      }
    }
  }

  /**
   * Apply filters and emit
   */
  applyFilters(): void {
    const formValue = this.filterForm.value;

    // Get equipment type description for chip display
    const selectedType = this.equipmentTypes.find(
      (t) => t.equipType === formValue.equipmentType
    );

    const filters: ServiceHistoryFilterValue = {
      equipmentType: formValue.equipmentType || null,
      equipmentTypeDescription: selectedType?.equipTypeDescription || null,
      equipmentId: formValue.equipmentId || null,
      equipmentReference: formValue.equipmentReference || null,
      startDate: formValue.startDate || null,
      endDate: formValue.endDate || null
    };

    this.apply.emit(filters);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterForm.reset();
    this.equipmentIds = [];
    this.equipmentReferences = [];
  }

  /**
   * Close filter panel
   */
  closePanel(): void {
    this.close.emit();
  }

  /**
   * Check if apply button should be disabled
   */
  get isApplyDisabled(): boolean {
    const formValue = this.filterForm.value;

    // At least one filter must be selected
    return !Object.values(formValue).some(
      (value) => value !== null && value !== undefined && value !== ''
    );
  }

  /**
   * Get equipment type description by code
   */
  getEquipmentTypeDescription(code: string): string {
    const type = this.equipmentTypes.find((t) => t.equipType === code);
    return type ? type.equipTypeDescription || '' : '';
  }
}
