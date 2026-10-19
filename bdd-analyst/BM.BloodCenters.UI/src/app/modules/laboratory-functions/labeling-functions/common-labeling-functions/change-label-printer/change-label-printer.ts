import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChangeLabelPrinterService } from './change-label-printer.service';
import {
  LabelPrinter,
  LabelPrinterContext,
  ProcessingFacility,
  ProcessingFacilityDetail,
  SaveSettingsRequest,
} from './change-label-printer.model';

const STORAGE_KEY = 'labelPrinterContext';

@Component({
  selector: 'app-change-label-printer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './change-label-printer.html',
  styleUrls: ['./change-label-printer.scss'],
})
export class ChangeLabelPrinterComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly headerService = inject(HeaderService);
  private readonly service = inject(ChangeLabelPrinterService);
  private readonly snackbarService = inject(SnackbarService);
  private returnUrl: string | null = null;

  readonly headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Change Label Printer', link: null },
    ],
  };

  // ── Loading / Error ────────────────────────────────────────────────────────
  loading = signal(false);
  loadingFacilities = signal(false);
  loadingTieTagPrinters = signal(false);

  // ── Current state (persisted in sessionStorage) ────────────────────────────
  currentLabelPrinter = signal<string | null>(null);
  currentTieTagPrinter = signal<string | null>(null);
  currentProcessingFacility = signal<string | null>(null);
  currentProcessingFacilityAuditKey = signal<number | null>(null);

  // ── Label Printer table ────────────────────────────────────────────────────
  labelPrinters = signal<LabelPrinter[]>([]);
  selectedPrinter = signal<string | null>(null);

  // ── Processing Facility dialog ─────────────────────────────────────────────
  showProcessingFacilityDialog = signal(false);
  facilityFindValue = 'W';
  selectedFacility = signal<ProcessingFacility | null>(null);
  showFacilityConfirmDialog = signal(false);
  pendingFacility = signal<ProcessingFacility | null>(null);
  facilityDialogData = signal<ProcessingFacility[]>([]);

  // ── Tie Tag Printer dialog ─────────────────────────────────────────────────
  showTieTagPrinterDialog = signal(false);
  tieTagFindValue = 'AGLBL';
  selectedTieTagPrinter = signal<LabelPrinter | null>(null);
  tieTagPrinters = signal<LabelPrinter[]>([]);

  // ── Confirmation message dialog ────────────────────────────────────────────
  showConfirmationDialog = signal(false);
  confirmationMessage = signal('');

  ngOnInit(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    this.returnUrl = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : null;
    this.subscribeToChapterChanges();
    this.restoreSettingsFromStorage();
    this.loadLabelPrinters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearSettingsAndReset();
        this.loadLabelPrinters();
      });
  }

  private clearSettingsAndReset(): void {
    sessionStorage.removeItem(STORAGE_KEY);

    this.currentLabelPrinter.set(null);
    this.currentTieTagPrinter.set(null);
    this.currentProcessingFacility.set(null);
    this.currentProcessingFacilityAuditKey.set(null);
    this.selectedPrinter.set(null);
    this.labelPrinters.set([]);
    this.tieTagPrinters.set([]);
    this.facilityDialogData.set([]);
    this.selectedFacility.set(null);
    this.selectedTieTagPrinter.set(null);
    this.showProcessingFacilityDialog.set(false);
    this.showTieTagPrinterDialog.set(false);
    this.showConfirmationDialog.set(false);
    this.showFacilityConfirmDialog.set(false);
  }

  // ── Storage ────────────────────────────────────────────────────────────────

  private restoreSettingsFromStorage(): void {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const ctx: LabelPrinterContext = JSON.parse(stored);
      if (ctx.labelPrinterCode) this.currentLabelPrinter.set(ctx.labelPrinterCode);
      if (ctx.tieTagPrinterCode) this.currentTieTagPrinter.set(ctx.tieTagPrinterCode);
      if (ctx.processingFacilityAuditKey) {
        this.currentProcessingFacilityAuditKey.set(ctx.processingFacilityAuditKey);
        this.loadProcessingFacilityDetails(ctx.processingFacilityAuditKey);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  private persistSettingsToStorage(): void {
    const ctx: LabelPrinterContext = {
      labelPrinterCode: this.currentLabelPrinter(),
      tieTagPrinterCode: this.currentTieTagPrinter(),
      processingFacilityAuditKey: this.currentProcessingFacilityAuditKey(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  }

  // ── Data Loading ───────────────────────────────────────────────────────────

  private loadLabelPrinters(): void {
    this.loading.set(true);

    this.service.getLabelPrinters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const printers = response.data ?? [];

          if (printers.length === 0) {
            this.labelPrinters.set([]);
            this.currentLabelPrinter.set(null);
            this.persistSettingsToStorage();
            this.loading.set(false);
            this.snackbarService.showInfo(response.message);
            return;
          }

          if (printers.length === 1) {
            this.labelPrinters.set(printers);
            this.selectedPrinter.set(printers[0].code);
            this.loading.set(false);
            this.saveSettings();
            return;
          }

          this.labelPrinters.set(printers);

          const currentCode = this.currentLabelPrinter();
          if (currentCode) {
            const match = printers.find(p => p.code === currentCode);
            if (match) {
              this.selectedPrinter.set(match.code);
            }
          }

          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          if (err?.error?.message) {
            this.snackbarService.showError(err.error.message);
          }
        },
      });
  }

  private loadProcessingFacilityDetails(auditKey: number): void {
    this.service.getProcessingFacilityDetails(auditKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const facility = response.data;
          if (facility) {
            this.currentProcessingFacility.set(this.formatFacilityAddress(facility));
          }
        },
        error: () => {},
      });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  onSelectPrinter(): void {
    const printer = this.selectedPrinter();
    if (!printer) return;
    this.confirmationMessage.set(`Msg:9300: You have selected - ${printer} as the label printer`);
    this.showConfirmationDialog.set(true);
  }

  onConfirmSelect(): void {
    this.showConfirmationDialog.set(false);
    this.saveSettings();
  }

  onCancelConfirm(): void {
    this.showConfirmationDialog.set(false);
  }

  private saveSettings(): void {
    const printerCode = this.selectedPrinter();
    if (!printerCode) return;

    const request: SaveSettingsRequest = {
      labelPrinterCode: printerCode,
      tieTagPrinterCode: this.currentTieTagPrinter() || undefined,
      processingFacilityAuditKey: this.currentProcessingFacilityAuditKey() || undefined,
    };

    this.loading.set(true);

    this.service.saveSettings(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          const settings = response.data;
          if (settings) {
            this.currentLabelPrinter.set(settings.labelPrinterCode);
            if (settings.tieTagPrinterCode) {
              this.currentTieTagPrinter.set(settings.tieTagPrinterCode);
            }
            if (settings.processingFacilityAuditKey) {
              this.currentProcessingFacilityAuditKey.set(settings.processingFacilityAuditKey);
            }
          }

          this.persistSettingsToStorage();
          this.snackbarService.showSuccess(response.message);

          if (this.returnUrl) {
            this.router.navigate([this.returnUrl]);
          }
        },
        error: (err) => {
          this.loading.set(false);
          if (err?.error?.message) {
            this.snackbarService.showError(err.error.message);
          }
        },
      });
  }

  // ── Processing Facility dialog ─────────────────────────────────────────────

  openProcessingFacilityDialog(): void {
    this.selectedFacility.set(null);
    this.showProcessingFacilityDialog.set(true);
    this.loadProcessingFacilities();
  }

  closeProcessingFacilityDialog(): void {
    this.showProcessingFacilityDialog.set(false);
  }

  private loadProcessingFacilities(): void {
    this.loadingFacilities.set(true);

    this.service.getProcessingFacilities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.facilityDialogData.set(response.data ?? []);
          this.loadingFacilities.set(false);
        },
        error: (err) => {
          this.loadingFacilities.set(false);
          if (err?.error?.message) {
            this.snackbarService.showError(err.error.message);
          }
        },
      });
  }

  onFacilityFind(): void {
    this.loadProcessingFacilities();
  }

  onFacilityOk(): void {
    const facility = this.selectedFacility();
    if (facility) {
      this.pendingFacility.set(facility);
      this.showProcessingFacilityDialog.set(false);
      this.showFacilityConfirmDialog.set(true);
    }
  }

  onFacilityConfirmExit(): void {
    const facility = this.pendingFacility();
    if (facility) {
      this.currentProcessingFacility.set(facility.name);
      this.currentProcessingFacilityAuditKey.set(facility.auditKey);
    }
    this.showFacilityConfirmDialog.set(false);
    this.pendingFacility.set(null);
  }

  onFacilityConfirmNo(): void {
    this.showFacilityConfirmDialog.set(false);
    this.pendingFacility.set(null);
    this.showProcessingFacilityDialog.set(true);
  }

  // ── Tie Tag Printer dialog ─────────────────────────────────────────────────

  openTieTagPrinterDialog(): void {
    this.selectedTieTagPrinter.set(null);
    this.showTieTagPrinterDialog.set(true);
    this.loadTieTagPrinters();
  }

  closeTieTagPrinterDialog(): void {
    this.showTieTagPrinterDialog.set(false);
  }

  private loadTieTagPrinters(): void {
    this.loadingTieTagPrinters.set(true);

    this.service.getTieTagPrinters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.tieTagPrinters.set(response.data ?? []);
          this.loadingTieTagPrinters.set(false);
        },
        error: (err) => {
          this.loadingTieTagPrinters.set(false);
          if (err?.error?.message) {
            this.snackbarService.showError(err.error.message);
          }
        },
      });
  }

  onTieTagFind(): void {
    this.loadTieTagPrinters();
  }

  onTieTagOk(): void {
    const printer = this.selectedTieTagPrinter();
    if (printer) {
      this.currentTieTagPrinter.set(printer.code);
    }
    this.showTieTagPrinterDialog.set(false);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private formatFacilityAddress(facility: ProcessingFacilityDetail): string {
    return [facility.name, facility.address1, facility.cityStateZip]
      .filter(Boolean)
      .join(' ');
  }
}
