import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin, of, takeUntil, catchError, finalize } from 'rxjs';

import { EquipmentQcDataService } from '../../services/equipment-qc-data.service';
import {
  EquipmentQcFilterCriteria,
  EquipmentType,
  QcType
} from '../../models/equipment-qc-data.model';

@Component({
  selector: 'app-equipment-qc-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './equipment-qc-filter-panel.component.html',
  styleUrl: './equipment-qc-filter-panel.component.scss'
})
export class EquipmentQcFilterPanelComponent implements OnInit, OnDestroy {
  private static nextId = 0;
  protected readonly componentId = `equipment-qc-filter-${EquipmentQcFilterPanelComponent.nextId++}`;

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;
  protected readonly errorId = (name: string) => `${this.componentId}-${name}-error`;
  protected readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  private readonly fb = inject(FormBuilder);
  private readonly equipmentQcDataService = inject(EquipmentQcDataService);
  private readonly destroy$ = new Subject<void>();

  protected readonly equipmentTypes = signal<EquipmentType[]>([]);
  protected readonly qcTypes = signal<QcType[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected readonly equipmentTypeSearchCtrl = new FormControl('');
  protected readonly qcTypeSearchCtrl = new FormControl('');
  private readonly equipmentTypeSearch = signal('');
  private readonly qcTypeSearch = signal('');
  private readonly selectedEquipmentTypeCode = signal<string | null>(null);
  private readonly selectedQcTypeCode = signal<string | null>(null);

  protected readonly filteredEquipmentTypes = computed(() => {
    const search = this.equipmentTypeSearch().toLowerCase();
    const types = this.equipmentTypes();
    return search ? types.filter(t => t.code.toLowerCase().includes(search)) : types;
  });

  protected readonly filteredQcTypes = computed(() => {
    const search = this.qcTypeSearch().toLowerCase();
    const types = this.qcTypes();
    return search ? types.filter(t => t.code.toLowerCase().includes(search)) : types;
  });

  protected readonly selectedEquipmentTypeDesc = computed(() => {
    const code = this.selectedEquipmentTypeCode();
    if (!code) return '-';
    const equipmentType = this.equipmentTypes().find(et => et.code === code);
    return equipmentType?.codeDesc || '-';
  });

  protected readonly selectedQcTypeDesc = computed(() => {
    const code = this.selectedQcTypeCode();
    if (!code) return '-';
    const qcType = this.qcTypes().find(qt => qt.code === code);
    return qcType?.codeDesc || '-';
  });

  filterForm!: FormGroup;

  @Output() retrieve = new EventEmitter<EquipmentQcFilterCriteria>();
  @Output() cleared = new EventEmitter<void>();

  ngOnInit(): void {
    this.initForm();
    this.loadLookups();
    this.setupAutoRetrieve();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      equipmentType: [null, [Validators.required]],
      qcType: [null, [Validators.required]]
    });
  }

  private loadLookups(): void {
    this.loading.set(true);

    forkJoin({
      equipmentTypes: this.equipmentQcDataService.getEquipmentTypes().pipe(
        catchError(() => { this.error.set('Failed to load equipment types'); return of([] as EquipmentType[]); })
      ),
      qcTypes: this.equipmentQcDataService.getQcTypes().pipe(
        catchError(() => { this.error.set('Failed to load QC types'); return of([] as QcType[]); })
      )
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe(results => {
      this.equipmentTypes.set(results.equipmentTypes);
      this.qcTypes.set(results.qcTypes);
    });
  }

  private setupAutoRetrieve(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value.equipmentType && value.qcType) {
          this.retrieve.emit({
            equipmentType: value.equipmentType,
            qcType: value.qcType
          });
        }
      });
  }

  private setupSearchSubscriptions(): void {
    this.equipmentTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.equipmentTypeSearch.set(value ?? ''));

    this.qcTypeSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.qcTypeSearch.set(value ?? ''));

    this.filterForm.get('equipmentType')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.selectedEquipmentTypeCode.set(value));

    this.filterForm.get('qcType')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.selectedQcTypeCode.set(value));
  }

  onClearAll(): void {
    this.filterForm.reset();
    this.cleared.emit();
  }

  get f() {
    return this.filterForm.controls;
  }
}
