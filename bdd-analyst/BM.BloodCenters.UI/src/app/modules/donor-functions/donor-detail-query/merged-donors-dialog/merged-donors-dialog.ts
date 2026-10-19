import { Component, inject, OnInit, OnDestroy, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig } from '@shared/interfaces/data-table.interface';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import {
  MergedDonor,
  MergedDonorInterdiction,
  MergeHoldUnit,
  PotentialDuplicate,
} from '../models/donor-detail-query.model';

export interface MergedDonorsDialogData {
  donorId: string;
  donorName?: string;
}

@Component({
  selector: 'app-merged-donors-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DataTable,
  ],
  template: `
    <div class="side-panel-container">
      <div class="side-panel-header">
        <h2 class="side-panel-title" mat-dialog-title>
          Merged Information
          @if (data.donorName) {
            <span class="donor-info"> - {{ data.donorName }}</span>
          }
        </h2>
        <button type="button" mat-icon-button class="side-panel-close" aria-label="Close panel" (click)="onClose()">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <div class="side-panel-content">
        @if (loading()) {
          <div class="loading-container" role="status" aria-live="polite">
            <mat-spinner diameter="50" [attr.aria-label]="'Loading merged information'"></mat-spinner>
            <p class="loading-text">Loading merged information...</p>
          </div>
        } @else if (error()) {
          <div class="error-container" role="alert">
            <mat-icon color="warn" aria-hidden="true">error</mat-icon>
            <p class="error-text">{{ error() }}</p>
            <button mat-raised-button color="primary" type="button" (click)="loadData()">RETRY</button>
          </div>
        } @else {
          <!-- Merged Donors -->
          <section class="data-section">
            <h3 class="section-title">Merged Donors</h3>
            @if (hasMergedDonors()) {
              <app-data-table [data]="mergedDonors()" [config]="mergedDonorsConfig" aria-label="Merged donors table" />
            } @else {
              <p class="empty-section">No merged donors</p>
            }
          </section>

          <!-- Hold Units -->
          <section class="data-section">
            <h3 class="section-title">Merged Hold Units</h3>
            @if (hasHoldUnits()) {
              <app-data-table [data]="holdUnits()" [config]="holdUnitsConfig" aria-label="Hold units table" />
            } @else {
              <p class="empty-section">No hold units</p>
            }
          </section>

          <!-- Merged Interdictions -->
          <section class="data-section">
            <h3 class="section-title">Merged Donor Interdictions</h3>
            @if (hasMergedInterdictions()) {
              <app-data-table [data]="mergedInterdictions()" [config]="interdictionsConfig" aria-label="Merged interdictions table" />
            } @else {
              <p class="empty-section">No merged interdictions</p>
            }
          </section>

          <!-- Potential Duplicates -->
          <section class="data-section">
            <h3 class="section-title">Potential Duplicates</h3>
            @if (hasDuplicates()) {
              <app-data-table [data]="duplicates()" [config]="duplicatesConfig" aria-label="Potential duplicates table" />
            } @else {
              <p class="empty-section">No potential duplicates</p>
            }
          </section>
        }
      </div>
      <div class="side-panel-footer">
        <button mat-flat-button class="close-btn" type="button" (click)="onClose()">CLOSE</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .side-panel-container { display: flex; flex-direction: column; height: 100%; background: white; }
    .side-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 24px; border-bottom: 1px solid rgba(0,0,0,0.12);
      .side-panel-title { margin: 0; font-size: 20px; font-weight: 500;
        .donor-info { font-size: 16px; font-weight: 400; color: rgba(0,0,0,0.6); }
      }
    }
    .side-panel-content { flex: 1; overflow-y: auto; padding: 24px; }
    .side-panel-footer {
      display: flex; justify-content: flex-end; align-items: center;
      padding: 14px 24px; border-top: 1px solid rgba(0,0,0,0.12);
      background: #ffffff; flex-shrink: 0;
    }
    .close-btn {
      background-color: #228189 !important; color: #fff !important;
      font-size: 13px; font-weight: 600; letter-spacing: 0.4px;
      border-radius: 4px; min-width: 72px; height: 36px;
    }
    .data-section { margin-bottom: 32px;
      .section-title { margin: 0 0 16px 0; font-size: 16px; font-weight: 500; color: rgba(0,0,0,0.87);
        padding-bottom: 8px; border-bottom: 2px solid #1976d2;
      }
    }
    .empty-section { color: rgba(0,0,0,0.6); font-style: italic; padding: 16px 0; }
    .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 40px; text-align: center;
      .loading-text { margin-top: 16px; font-size: 16px; color: rgba(0,0,0,0.6); }
    }
    .error-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 40px; text-align: center;
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
      .error-text { margin: 8px 0 24px 0; font-size: 16px; color: rgba(0,0,0,0.87); }
    }
  `],
})
export class MergedDonorsDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<MergedDonorsDialog>);
  private readonly donorService = inject(DonorDetailQueryService);
  private readonly destroy$ = new Subject<void>();

  readonly mergedDonors = signal<MergedDonor[]>([]);
  readonly holdUnits = signal<MergeHoldUnit[]>([]);
  readonly mergedInterdictions = signal<MergedDonorInterdiction[]>([]);
  readonly duplicates = signal<PotentialDuplicate[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly hasMergedDonors = computed(() => this.mergedDonors().length > 0);
  readonly hasHoldUnits = computed(() => this.holdUnits().length > 0);
  readonly hasMergedInterdictions = computed(() => this.mergedInterdictions().length > 0);
  readonly hasDuplicates = computed(() => this.duplicates().length > 0);

  mergedDonorsConfig: DataTableConfig<MergedDonor> = {
    columns: [
      { key: 'secondaryDonorId', header: 'Donor ID', width: '100px', sortable: false },
      { key: 'gender', header: 'Sex', width: '60px', sortable: false },
      { key: 'dateOfBirth', header: 'DOB', width: '110px', sortable: false,
        valueFormatter: (v: string) => this.donorService.formatDate(v) },
      { key: 'lastName', header: 'Last Name', sortable: false },
      { key: 'firstName', header: 'First Name', sortable: false },
      { key: 'middleName', header: 'Middle Name', width: '110px', sortable: false },
    ],
    stickyHeader: true, showTableOnEmpty: false,
  };

  holdUnitsConfig: DataTableConfig<MergeHoldUnit> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'collDate', header: 'Coll Date', width: '120px', sortable: false,
        valueFormatter: (v: string) => this.donorService.formatDate(v) },
      { key: 'donorId', header: 'Donor ID', width: '110px', sortable: false },
    ],
    stickyHeader: true, showTableOnEmpty: false,
  };

  interdictionsConfig: DataTableConfig<MergedDonorInterdiction> = {
    columns: [
      { key: 'donorId', header: 'Donor ID', width: '100px', sortable: false },
      { key: 'interCode', header: 'Inter Code', width: '100px', sortable: false },
      { key: 'unitId', header: 'Unit ID', sortable: false },
      { key: 'effDate', header: 'Eff Date', width: '110px', sortable: false,
        valueFormatter: (v: string) => this.donorService.formatDate(v) },
      { key: 'termDate', header: 'Term Date', width: '110px', sortable: false,
        valueFormatter: (v: string) => v ? this.donorService.formatDate(v) : '-' },
    ],
    stickyHeader: true, showTableOnEmpty: false,
  };

  duplicatesConfig: DataTableConfig<PotentialDuplicate> = {
    columns: [
      { key: 'setId', header: 'Batch', width: '80px', sortable: false },
      { key: 'donorId', header: 'Donor ID', width: '100px', sortable: false },
      { key: 'mergeFlag', header: 'Flag', width: '60px', sortable: false },
      { key: 'resolveUser', header: 'Resolve User', width: '110px', sortable: false },
      { key: 'resolveDate', header: 'Resolve Date', sortable: false,
        valueFormatter: (v: string) => v ? this.donorService.formatDate(v) : '-' },
    ],
    stickyHeader: true, showTableOnEmpty: false,
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: MergedDonorsDialogData) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      donors: this.donorService.getMergedDonors(this.data.donorId),
      holdUnits: this.donorService.getMergeHoldUnits(this.data.donorId),
      interdictions: this.donorService.getMergedInterdictions(this.data.donorId),
      duplicates: this.donorService.getPotentialDuplicates(this.data.donorId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.mergedDonors.set(result.donors);
          this.holdUnits.set(result.holdUnits);
          this.mergedInterdictions.set(result.interdictions);
          this.duplicates.set(result.duplicates);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load merged information. Please try again.');
          this.loading.set(false);
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
