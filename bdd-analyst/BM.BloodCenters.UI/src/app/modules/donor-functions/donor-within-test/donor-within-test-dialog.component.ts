import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, signal, computed, Optional, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { DonorWithinTestService } from './services/donor-within-test.service';
import { DonorAttributesService } from '../donor-profile/donor-profile-maintenance/donor-attributes/services/donor-attributes.service';
import {
  DonationRecordDto,
  TestResultDto,
  ConfirmatoryTestDto,
  DonorWithinTestDialogData
} from './models/donor-within-test.models';

@Component({
  selector: 'app-donor-within-test-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DatePipe,
    SidePanelBase
  ],
  templateUrl: './donor-within-test-dialog.component.html',
  styleUrls: ['./donor-within-test-dialog.component.scss']
})
export class DonorWithinTestDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private cancelTests$ = new Subject<void>();
  private readonly service = inject(DonorWithinTestService);
  private readonly donorAttributesService = inject(DonorAttributesService);

  @Input() donorId: string = '';
  @Input() donorName: string = '';
  @Input() dob: string = '';
  @Input() sex: string = '';
  @Input() abo: string = '';

  @Output() closePanel = new EventEmitter<void>();

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) dialogData: DonorWithinTestDialogData | null) {
    if (dialogData) {
      this.donorId = dialogData.donorId;
      this.donorName = dialogData.donorName || '';
      this.dob = dialogData.dob || '';
      this.sex = this.formatSex(dialogData.sex || '');
      this.abo = dialogData.abo || '';
    }
  }

  readonly sidePanelButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary' }
  ];

  // Access level from GET /donor-within-test/access-level
  private _accessLevel: number | null = null;

  // Signal-based state
  readonly donations = signal<DonationRecordDto[]>([]);
  readonly selectedDonation = signal<DonationRecordDto | null>(null);
  readonly testResults = signal<TestResultDto[]>([]);
  readonly confirmTests = signal<ConfirmatoryTestDto[]>([]);
  readonly showConfirm = signal<boolean>(false);
  readonly loadingDonations = signal<boolean>(false);
  readonly loadingTests = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly hasHiddenTests = signal<boolean>(false);
  readonly hasValidTests = signal<boolean>(false);

  // Computed values
  readonly hasDonations = computed(() => this.donations().length > 0);
  readonly hasSelectedDonation = computed(() => this.selectedDonation() !== null);

  readonly displayedTests = computed(() => {
    const tests = this.testResults();
    const confirms = this.confirmTests();

    if (this.showConfirm() && confirms.length > 0) {
      const existingKeys = new Set(tests.map(t => `${t.testId}|${t.testType ?? ''}`));
      const confirmEntries = confirms.map(c => ({
        testId: c.testId,
        resultCode: c.resultCode,
        reactive: null,
        testType: c.testType || 'Confirm',
        absorbance: null
      }));

      const uniqueConfirms = confirmEntries.filter(c => {
        const key = `${c.testId}|${c.testType}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      return [...tests, ...uniqueConfirms];
    }

    return tests;
  });

  readonly confirmTestTypeGroups = computed(() => {
    const tests = this.confirmTests();
    if (tests.length === 0) return [];

    const groupMap = new Map<string, ConfirmatoryTestDto[]>();
    for (const test of tests) {
      const type = test.testType || 'Other';
      const group = groupMap.get(type);
      if (group) {
        group.push(test);
      } else {
        groupMap.set(type, [test]);
      }
    }

    return Array.from(groupMap.entries()).map(([type, items]) => ({ type, items }));
  });

  // Table columns
  donationsColumns: string[] = ['displayUnitId', 'collDate'];
  testResultsColumns: string[] = ['testId', 'resultCode', 'absorbance', 'reactive', 'testType'];

  ngOnInit(): void {
    this.loadDonorHeader();
    this.loadAccessLevelThenDonations();
  }

  private loadAccessLevelThenDonations(): void {
    this.service.getAccessLevel()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (level) => {
          this._accessLevel = level;
          this.loadDonations();
        },
        error: () => {
          this.error.set('Unable to determine access level. Please contact your system administrator.');
        }
      });
  }

  private loadDonorHeader(): void {
    if (!this.donorId) return;

    this.service.getDonorHeader(this.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (header) => {
          if (header) {
            if (!this.donorName && header.name) {
              this.donorName = header.name;
            }
            if (!this.dob && header.dateOfBirth) {
              this.dob = moment(header.dateOfBirth).format('DD-MMM-YYYY').toUpperCase();
            }
            if (header.sex) {
              this.sex = this.formatSex(header.sex);
            }
            if (header.abo) {
              this.abo = header.abo;
            }
          }
        },
        error: () => {
          this.loadDonorDemographicsFallback();
        }
      });
  }

  private loadDonorDemographicsFallback(): void {
    this.donorAttributesService.getDonorDemographics(this.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (demographics) => {
          if (!this.donorName && (demographics.firstName || demographics.lastName)) {
            this.donorName = `${demographics.lastName}, ${demographics.firstName}`.trim();
          }
          if (!this.dob && demographics.dateOfBirth) {
            this.dob = moment(demographics.dateOfBirth).format('DD-MMM-YYYY').toUpperCase();
          }
          if (!this.sex && demographics.gender) {
            this.sex = this.formatSex(demographics.gender);
          }
          if (!this.abo && demographics.bloodType) {
            this.abo = demographics.bloodType;
          }
        },
        error: () => { }
      });
  }

  ngOnDestroy(): void {
    this.cancelTests$.next();
    this.cancelTests$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDonations(): void {
    if (!this.donorId) {
      this.error.set('Donor ID is required');
      return;
    }

    if (this.donorId.length > 10) {
      this.error.set('Donor ID must not exceed 10 characters');
      return;
    }

    this.loadingDonations.set(true);
    this.error.set(null);

    this.service.getDonations(this.donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donations) => {
          this.donations.set(donations);
          this.loadingDonations.set(false);

          if (donations.length > 0) {
            this.selectDonation(donations[0]);
          }
        },
        error: (error) => {
          this.error.set(error.message || 'Failed to load donations');
          this.loadingDonations.set(false);
        }
      });
  }

  selectDonation(donation: DonationRecordDto): void {
    this.selectedDonation.set(donation);
    this.showConfirm.set(false);
    this.confirmTests.set([]);
    this.hasHiddenTests.set(false);
    this.hasValidTests.set(false);
    this.loadTestResults(donation.unitId, donation.collDate);
  }

  private loadTestResults(unitId: string, collDate: string): void {
    this.cancelTests$.next();
    this.loadingTests.set(true);
    this.error.set(null);

    const formattedDate = this.formatDateForApi(collDate);

    this.service.getTestResults(unitId, formattedDate, this._accessLevel ?? undefined)
      .pipe(takeUntil(this.cancelTests$), takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.testResults.set(response.data);
          this.hasHiddenTests.set(response.hasHiddenTests);
          this.hasValidTests.set(response.hasValidTests);
          this.loadingTests.set(false);

          if (this.showConfirm()) {
            this.loadConfirmatoryTests(unitId, formattedDate);
          }
        },
        error: (error) => {
          this.error.set(error.message || 'Failed to load test results');
          this.loadingTests.set(false);
        }
      });
  }

  private loadConfirmatoryTests(unitId: string, collDate: string): void {
    this.service.getConfirmatoryTests(unitId, collDate, this._accessLevel ?? undefined)
      .pipe(takeUntil(this.cancelTests$), takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.confirmTests.set(tests);
        },
        error: () => {
        }
      });
  }

  onShowConfirmChange(): void {
    const selected = this.selectedDonation();

    if (this.showConfirm() && selected) {
      const formattedDate = this.formatDateForApi(selected.collDate);
      this.loadConfirmatoryTests(selected.unitId, formattedDate);
    }
  }

  onRefresh(): void {
    const selected = this.selectedDonation();

    if (selected) {
      this.loadTestResults(selected.unitId, selected.collDate);
    }
  }

  onClose(): void {
    this.closePanel.emit();
  }

  onSidePanelButtonClick(action: string): void {
    if (action === 'close') {
      this.onClose();
    }
  }

  isSelected(donation: DonationRecordDto): boolean {
    const selected = this.selectedDonation();
    return selected !== null &&
           selected.unitId === donation.unitId &&
           selected.collDate === donation.collDate;
  }

  private formatSex(value: string): string {
    const upper = value?.toUpperCase();
    if (upper === 'M') return 'Male';
    if (upper === 'F') return 'Female';
    return value || '';
  }

  formatDateDisplay(dateStr: string): string {
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateStr;
  }

  private formatDateForApi(dateStr: string): string {
    const m = moment(dateStr);
    return m.isValid() ? m.format('YYYY-MM-DD') : dateStr;
  }

  get selectedDonationInfo(): string {
    const selected = this.selectedDonation();
    if (!selected) {
      return '';
    }
    return `Unit ID: ${selected.displayUnitId || selected.unitId} | Collection Date: ${this.formatDateDisplay(selected.collDate)}`;
  }
}
