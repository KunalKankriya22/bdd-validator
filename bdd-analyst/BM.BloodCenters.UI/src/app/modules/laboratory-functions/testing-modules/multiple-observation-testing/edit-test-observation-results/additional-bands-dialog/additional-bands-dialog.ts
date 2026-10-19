import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { DropdownOption, OtherTestBandDto, TestObservationDto } from '../models/edit-test-observation-results.model';

export interface AdditionalBandsDialogData {
  unitId: string;
  otherBands: OtherTestBandDto[];
  testData: TestObservationDto;
}

interface OtherBandRow {
  tech1: string;
  tech2: string;
  supervisor: string;
  formGroup: FormGroup;
}

@Component({
  selector: 'app-additional-bands-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './additional-bands-dialog.html',
  styleUrls: ['./additional-bands-dialog.scss'],
})
export class AdditionalBandsDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `additional-bands-dialog-${AdditionalBandsDialogComponent.nextId++}`;

  readonly dialogRef = inject(MatDialogRef<AdditionalBandsDialogComponent>);
  readonly data = inject<AdditionalBandsDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  protected readonly rows = signal<OtherBandRow[]>([]);

  protected readonly supervisorOptions = signal<DropdownOption[]>([
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'D', label: 'D' },
  ]);

  constructor() {
    this.initializeRows();
  }

  private initializeRows(): void {
    const otherBands = this.data.otherBands ?? [];
    const result: OtherBandRow[] = [];

    // Group other bands by index to build rows
    const tech1Bands = otherBands.filter(b => b.tech === '1');
    const tech2Bands = otherBands.filter(b => b.tech === '2');
    const supBands = otherBands.filter(b => b.tech === 'S');

    const maxRows = Math.max(tech1Bands.length, tech2Bands.length, supBands.length, 1);

    for (let i = 0; i < maxRows; i++) {
      const t1 = tech1Bands[i]?.band1 ?? '';
      const t2 = tech2Bands[i]?.band1 ?? '';
      const sup = supBands[i]?.band1 ?? '';

      result.push({
        tech1: t1,
        tech2: t2,
        supervisor: sup,
        formGroup: this.fb.group({
          supervisor: [sup],
        }),
      });
    }

    // Ensure minimum of 6 rows (as in Figma)
    while (result.length < 6) {
      result.push({
        tech1: '',
        tech2: '',
        supervisor: '',
        formGroup: this.fb.group({
          supervisor: [''],
        }),
      });
    }

    this.rows.set(result);
  }

  onAddNew(): void {
    this.rows.update((rows) => [
      ...rows,
      {
        tech1: '',
        tech2: '',
        supervisor: '',
        formGroup: this.fb.group({
          supervisor: [''],
        }),
      },
    ]);
  }

  onSave(): void {
    const result = this.rows().map((row) => ({
      tech1: row.tech1,
      tech2: row.tech2,
      supervisor: row.formGroup.get('supervisor')?.value ?? '',
    }));
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
