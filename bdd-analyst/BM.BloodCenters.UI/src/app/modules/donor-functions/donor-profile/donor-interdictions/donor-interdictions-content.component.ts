import { Component, OnInit, OnDestroy, inject, signal, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { DonorInterdictionsApiService } from './services/donor-interdictions-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { DonorInterdiction } from './models/donor-interdictions.model';
import { DialogHeaderFields } from '@shared/components/dialog-header-fields/dialog-header-fields';
import { DialogHeaderField } from '@shared/interfaces/dialog.interface';

@Component({
  selector: 'app-donor-interdictions-content',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    DialogHeaderFields
  ],
  templateUrl: './donor-interdictions-content.component.html',
  styleUrls: ['./donor-interdictions-content.component.scss']
})
export class DonorInterdictionsContentComponent implements OnInit, OnDestroy {
  private service = inject(DonorInterdictionsApiService);
  private loggingService = inject(LoggingService);
  private destroy$ = new Subject<void>();

  @Input() donorId!: string;
  @Output() closePanel = new EventEmitter<void>();

  protected readonly donorInfo = signal<any>(null);
  showTerminatedControl = new FormControl<string>('No');
  protected readonly allInterdictions = signal<DonorInterdiction[]>([]);
  protected readonly selectedInterdiction = signal<DonorInterdiction | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly otherIntersCount = signal<number>(0);

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

  displayedColumns = [
    'interCode',
    'interType',
    'unitId',
    'effDate',
    'termDate',
    'insertUser',
    'originatedFrom',
    'reasonCode',
    'releaseUser',
    'releaseDate'
  ];

  ngOnInit(): void {
    if (!this.donorId) {
      this.error.set('Donor ID is required');
      return;
    }
    this.loading.set(true);
    this.loadDonorDetails();
    this.setupFilterListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListener(): void {
    this.showTerminatedControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedInterdiction.set(null);
        this.loadInterdictions();
      });
  }

  private loadDonorDetails(): void {
    this.service.getDonorDetails(this.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.item) {
            this.donorInfo.set({
              donorId: response.item.donorId,
              donorName: response.item.name,
              dateOfBirth: response.item.dateOfBirth,
              gender: response.item.gender,
              aboType: response.item.bloodType
            });
            this.otherIntersCount.set(response.item.otherInters ?? 0);
            this.loadInterdictions();
          }
        },
        error: (err) => {
          this.loggingService.error('Error loading donor details', err);
          // Still load interdictions even if donor details fail
          this.loadInterdictions();
        }
      });
  }

  private loadInterdictions(): void {
    this.loading.set(true);
    this.error.set(null);

    const showTerminated = this.showTerminatedControl.value === 'Yes';
    this.service.getDonorInterdictions(this.donorId, showTerminated)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.allInterdictions.set(response.data);
            this.loading.set(false);
            (document.activeElement as HTMLElement)?.blur();
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

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  trackByInterdiction(index: number, item: DonorInterdiction): string {
    return `${item.interCode}-${item.effDate}-${item.unitId || index}`;
  }

  onClose(): void {
    this.closePanel.emit();
  }
}
