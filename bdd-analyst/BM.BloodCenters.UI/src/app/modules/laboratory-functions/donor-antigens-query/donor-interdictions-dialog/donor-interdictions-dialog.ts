import { Component, OnInit, OnDestroy, inject, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { DonorInterdictionsApiService } from '../../../donor-functions/donor-profile/donor-interdictions/services/donor-interdictions-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { DonorInfo } from '../models/donor-antigens.model';
import { DonorInterdiction } from '../../../donor-functions/donor-profile/donor-interdictions/models/donor-interdictions.model';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogHeaderFields } from '@shared/components/dialog-header-fields/dialog-header-fields';
import { DialogHeaderField } from '@shared/interfaces/dialog.interface';

@Component({
  selector: 'app-donor-interdictions-side-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTableModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    SidePanelBase,
    DialogHeaderFields
  ],
  templateUrl: './donor-interdictions-dialog.html',
  styleUrl: './donor-interdictions-dialog.scss'
})
export class DonorInterdictionsSidePanel implements OnInit, OnDestroy {
  private service = inject(DonorInterdictionsApiService);
  private loggingService = inject(LoggingService);
  private destroy$ = new Subject<void>();

  @Input() donorId!: string;
  @Output() close = new EventEmitter<void>();

  // Form control for filter
  showTerminControl = new FormControl<string>('Yes');

  // Signal-based state
  protected readonly donorInfo = signal<DonorInfo | null>(null);
  protected readonly allInterdictions = signal<DonorInterdiction[]>([]);
  protected readonly selectedInterdiction = signal<DonorInterdiction | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Computed filtered interdictions
  protected readonly filteredInterdictions = computed(() => {
    return this.allInterdictions();
  });

  // Table columns
  displayedColumns = [
    'interdictions',
    'type',
    'unitId',
    'effectiveDate',
    'termDate',
    'userId',
    'originated',
    'reason',
    'releasedBy',
    'releaseDate'
  ];

  // Computed donor header fields for the side panel
  protected readonly donorHeaderFields = computed<DialogHeaderField[]>(() => {
    const info = this.donorInfo();
    if (!info) return [];

    return [
      { label: 'Name', value: info.donorName },
      { label: 'DOB', value: info.dateOfBirth },
      { label: 'Sex', value: info.gender },
      { label: 'ABO', value: info.aboType }
    ];
  });

  ngOnInit(): void {
    if (!this.donorId) {
      this.error.set('Donor ID is required');
      return;
    }
    this.loadDonorDetails();
    this.loadInterdictions();
    this.setupFilterListener();
  }

  private loadDonorDetails(): void {
    this.service.getDonorDetails(this.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            // Map API response to expected format
            this.donorInfo.set({
              donorId: response.item.donorId,
              donorName: response.item.name,
              dateOfBirth: response.item.dateOfBirth,
              gender: response.item.gender,
              aboType: response.item.bloodType
            });
          }
        },
        error: (err) => {
          this.loggingService.error('Error loading donor details', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListener(): void {
    this.showTerminControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload interdictions when filter changes
        this.selectedInterdiction.set(null);
        this.loadInterdictions();
      });
  }

  private loadInterdictions(): void {
    this.loading.set(true);
    this.error.set(null);

    const showTerminated = this.showTerminControl.value === 'Yes';
    this.service.getDonorInterdictions(this.donorId, showTerminated)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.allInterdictions.set(response.data);
            this.loading.set(false);

            // Auto-select first interdiction if available
            if (response.data.length > 0) {
              this.selectedInterdiction.set(response.data[0]);
            }
          } else {
            this.allInterdictions.set([]);
            this.error.set('Failed to load interdictions.');
            this.loading.set(false);
          }
        },
        error: (err) => {
          this.loggingService.error('Error loading donor interdictions', err);
          this.error.set('Failed to load interdictions. Please try again.');
          this.loading.set(false);
        }
      });
  }

  onRowClick(interdiction: DonorInterdiction): void {
    this.selectedInterdiction.set(interdiction);
  }

  isRowSelected(interdiction: DonorInterdiction): boolean {
    const selected = this.selectedInterdiction();
    return selected !== null &&
           selected.interCode === interdiction.interCode &&
           selected.effDate === interdiction.effDate &&
           selected.unitId === interdiction.unitId;
  }

  onClose(): void {
    this.close.emit();
  }

  formatDateOfBirth(dob: string): string {
    if (!dob) return '';
    const date = new Date(dob);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  trackByInterdiction(index: number, item: DonorInterdiction): string {
    return `${item.interCode}-${item.effDate}-${item.unitId || index}`;
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
