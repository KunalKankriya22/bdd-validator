import {
  Component,
  Inject,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  AdditionalBandsDialogData,
  AdditionalBandsDialogResult,
  OtherBandDto,
  SaveOtherBandsRequest,
} from '../enter-test-observations-tech1.model';
import { EnterTestObservationsTech1Service } from '../enter-test-observations-tech1.service';

interface BandItem {
  band1: string;
  band2: string;
}

@Component({
  selector: 'app-additional-bands-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './additional-bands-dialog.html',
  styleUrl: './additional-bands-dialog.scss',
})
export class AdditionalBandsDialogComponent implements OnInit {
  private static nextId = 0;
  protected readonly componentId = `additional-bands-dialog-${AdditionalBandsDialogComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly service = inject(EnterTestObservationsTech1Service);
  protected readonly dialogRef = inject(MatDialogRef<AdditionalBandsDialogComponent>);

  protected readonly unitId = signal<string>('');
  protected readonly savedBands = signal<BandItem[]>([]);
  protected readonly newBands = signal<BandItem[]>([]);
  protected readonly saving = signal<boolean>(false);
  protected readonly loadingBands = signal<boolean>(false);

  constructor(@Inject(MAT_DIALOG_DATA) public data: AdditionalBandsDialogData) {
    this.unitId.set(data.unitId);
  }

  ngOnInit(): void {
    this.loadExistingBands();
  }

  private loadExistingBands(): void {
    this.loadingBands.set(true);
    this.service
      .loadOtherBands(this.data.tbId, this.data.testId, this.data.unitId, this.data.tbSeqNo)
      .subscribe({
        next: (bands) => {
          const mapped: BandItem[] = bands.map((b: any) => ({
            band1: b.band1 || '',
            band2: b.band2 || '',
          }));
          this.savedBands.set(mapped);
          this.loadingBands.set(false);
        },
        error: () => {
          this.savedBands.set([]);
          this.loadingBands.set(false);
        },
      });
  }

  onAddNewRow(): void {
    this.newBands.update((bands) => [...bands, { band1: '', band2: '' }]);
  }

  onNewBandInput(index: number, field: 'band1' | 'band2', value: string): void {
    this.newBands.update((bands) => {
      const updated = [...bands];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  hasNewBandsWithValues(): boolean {
    return this.newBands().some(
      (b) => (b.band1 && b.band1.trim() !== '') || (b.band2 && b.band2.trim() !== '')
    );
  }

  onSaveNewBands(): void {
    const bandsToSave = this.newBands().filter(
      (b) => (b.band1 && b.band1.trim() !== '') || (b.band2 && b.band2.trim() !== '')
    );
    if (bandsToSave.length === 0) return;

    this.saving.set(true);

    const otherBands: OtherBandDto[] = bandsToSave.map((b) => ({
      band1: b.band1 || '',
      band2: b.band2 || '',
    }));

    const request: SaveOtherBandsRequest = {
      tbId: this.data.tbId,
      testId: this.data.testId,
      unitId: this.data.unitId,
      tbSeqNo: Number(this.data.tbSeqNo),
      otherBands,
    };

    this.service.saveOtherBands(request).subscribe({
      next: () => {
        this.savedBands.update((existing) => [...existing, ...bandsToSave]);
        this.newBands.set([]);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  onClearAll(): void {
    if (this.savedBands().length === 0 && this.newBands().length === 0) return;

    this.saving.set(true);
    this.service
      .deleteOtherBands(this.data.tbId, this.data.testId, this.data.unitId, this.data.tbSeqNo)
      .subscribe({
        next: () => {
          this.savedBands.set([]);
          this.newBands.set([]);
          this.saving.set(false);
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  onCancel(): void {
    const result: AdditionalBandsDialogResult = {
      action: 'cancel',
    };
    this.dialogRef.close(result);
  }
}
