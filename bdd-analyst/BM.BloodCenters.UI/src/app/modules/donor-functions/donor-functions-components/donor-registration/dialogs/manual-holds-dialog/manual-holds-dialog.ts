import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import {
  ManualHoldsDialogData,
  ManualHoldsDialogResult,
  InterdictionCodeLookupDto,
} from '../../models/donor-registration.model';

@Component({
  selector: 'app-manual-holds-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './manual-holds-dialog.html',
  styleUrl: './manual-holds-dialog.scss',
})
export class ManualHoldsDialog {
  private readonly dialogRef = inject(MatDialogRef<ManualHoldsDialog>);
  readonly data: ManualHoldsDialogData = inject(MAT_DIALOG_DATA);

  searchControl = new FormControl('');
  displayedColumns = ['code', 'description', 'interType'];

  allCodes = signal<InterdictionCodeLookupDto[]>([]);
  private filterValue = signal('');

  filteredCodes = computed(() => {
    const search = this.filterValue();
    const list = this.allCodes();
    if (!search) return list;
    return list.filter((c) => c.interCode === search);
  });

  selectedCodes = signal<InterdictionCodeLookupDto[]>([]);

  constructor() {
    this.allCodes.set(this.data.interdictionCodes ?? []);
    this.selectedCodes.set(this.data.existingHolds ?? []);
  }

  onFind(): void {
    this.filterValue.set(this.searchControl.value ?? '');
  }

  toggleRow(code: InterdictionCodeLookupDto): void {
    const current = this.selectedCodes();
    const exists = current.some((c) => c.interCode === code.interCode);
    if (exists) {
      this.selectedCodes.set(current.filter((c) => c.interCode !== code.interCode));
    } else {
      this.selectedCodes.set([...current, code]);
    }
  }

  isSelected(code: InterdictionCodeLookupDto): boolean {
    return this.selectedCodes().some((c) => c.interCode === code.interCode);
  }

  onOk(): void {
    this.dialogRef.close({
      action: 'ok',
      selectedHolds: this.selectedCodes(),
    } as ManualHoldsDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' } as ManualHoldsDialogResult);
  }
}
