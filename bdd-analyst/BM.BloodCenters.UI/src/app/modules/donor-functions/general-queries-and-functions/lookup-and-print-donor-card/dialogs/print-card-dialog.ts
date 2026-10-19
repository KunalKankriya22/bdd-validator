import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '@shared/services/notification.service';
import { LookupAndPrintDonorCardService } from '../services/lookup-and-print-donor-card.service';
import { PrintCardDialogData, PrinterItem } from '../models/lookup-donor-card.model';

@Component({
  selector: 'app-print-card-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './print-card-dialog.html',
  styleUrls: ['./print-card-dialog.scss'],
})
export class PrintCardDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<PrintCardDialog>);
  private readonly data = inject<PrintCardDialogData>(MAT_DIALOG_DATA);
  private readonly donorCardService = inject(LookupAndPrintDonorCardService);
  private readonly notification = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  readonly printerControl = new FormControl('', Validators.required);
  readonly queueControl = new FormControl('N');
  readonly printerSearchControl = new FormControl('');

  readonly printers = signal<PrinterItem[]>([]);
  readonly isPrinting = signal(false);

  private readonly printerSearch = signal('');
  readonly selectedPrinterValue = signal('');
  readonly selectedQueueValue = signal('');

  readonly isQueued = computed(() => this.selectedQueueValue() === 'Y');

  readonly filteredPrinters = computed(() => {
    const search = this.printerSearch().toLowerCase();
    const options = this.printers();
    if (!search) return options;
    return options.filter(o =>
      (o.code || '').toLowerCase().includes(search) ||
      (o.description || '').toLowerCase().includes(search)
    );
  });

  readonly selectedPrinterDisplay = computed(() => {
    const val = this.selectedPrinterValue();
    if (!val) return '';
    const option = this.printers().find(p => p.code === val);
    if (!option) return val;
    return option.description ? `${option.code} - ${option.description}` : option.code;
  });

  ngOnInit(): void {
    this.printerSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.printerSearch.set(value || ''));

    this.printerControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.selectedPrinterValue.set(value || ''));

    this.queueControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.selectedQueueValue.set(value || ''));

    this.printers.set(this.data.printers ?? []);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    const printerName = this.printerControl.value;
    const queue = this.queueControl.value;

    if (!printerName && !this.isQueued()) return;

    this.isPrinting.set(true);
    this.donorCardService.printCard({
      ...this.data.printRequest,
      printerName: printerName || '',
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isPrinting.set(false);
          this.notification.showSuccess('Printing Donor Card.');
          this.dialogRef.close({ printer: printerName, queue: queue === 'Y' ? 'Y' : null });
        },
        error: () => {
          this.isPrinting.set(false);
        },
      });
  }
}
