import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HeaderService } from '@shared/services/header.service';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { HoldInterCodeDto, DonationInterdictionDto } from '../../models/audit-donation.model';

export interface LocalHoldRow {
  interCode: string;
  interDescription: string;
}

@Component({
  selector: 'app-place-hold-side-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    NgxMatSelectSearchModule,
    SidePanelBase,
  ],
  templateUrl: './place-hold-side-panel.html',
  styleUrl: './place-hold-side-panel.scss',
})
export class PlaceHoldSidePanelComponent implements OnInit, OnDestroy {
  private readonly headerService = inject(HeaderService);
  private readonly destroy$ = new Subject<void>();

  @Input() holdCodes: HoldInterCodeDto[] = [];
  @Input() existingInterdictions: DonationInterdictionDto[] = [];
  @Input() initialRows: LocalHoldRow[] | null = null;
  @Input() unitId = '';
  @Input() transactionId = '';
  @Output() save = new EventEmitter<LocalHoldRow[]>();
  @Output() cancel = new EventEmitter<void>();

  rows = signal<LocalHoldRow[]>([]);
  showNewRow = signal(false);

  editSearchCtrl = new FormControl('');
  newSearchCtrl  = new FormControl('');
  private editSearchTerm = signal<string>('');
  private newSearchTerm  = signal<string>('');

  footerButtons: DialogButton[] = [
    { label: 'CANCEL', action: 'cancel', variant: 'secondary' },
    { label: 'PLACE HOLD', action: 'save', variant: 'primary' },
  ];

  ngOnInit(): void {
    if (this.initialRows !== null) {
      this.rows.set(this.initialRows);
    } else {
      this.rows.set(
        this.existingInterdictions.map(h => ({
          interCode: h.interCode,
          interDescription: h.interDescription ||
            this.holdCodes.find(c => c.interCode === h.interCode)?.interDescription || '',
        }))
      );
    }
    this.editSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.editSearchTerm.set(v ?? ''));
    this.newSearchCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.newSearchTerm.set(v ?? ''));
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cancel.emit());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEditCode(row: LocalHoldRow, newCode: string): void {
    const found = this.holdCodes.find(c => c.interCode === newCode);
    this.rows.update(rows =>
      rows.map(r => r.interCode === row.interCode
        ? { interCode: newCode, interDescription: found?.interDescription ?? '' }
        : r)
    );
  }

  onDelete(interCode: string): void {
    this.rows.update(rows => rows.filter(r => r.interCode !== interCode));
  }

  onAddNew(): void {
    this.showNewRow.set(true);
  }

  onNewCodeSelect(code: string): void {
    if (!code) return;
    const found = this.holdCodes.find(c => c.interCode === code);
    this.rows.update(rows => [
      ...rows,
      { interCode: code, interDescription: found?.interDescription ?? '' },
    ]);
    this.showNewRow.set(false);
  }

  availableForNew(): HoldInterCodeDto[] {
    const existing = new Set(this.rows().map(r => r.interCode));
    return this.holdCodes.filter(c => !existing.has(c.interCode));
  }

  filteredHoldCodesForEdit(): HoldInterCodeDto[] {
    const term = this.editSearchTerm().toLowerCase();
    if (!term) return this.holdCodes;
    return this.holdCodes.filter(c =>
      c.interCode.toLowerCase().includes(term) ||
      c.interDescription.toLowerCase().includes(term)
    );
  }

  filteredAvailableForNew(): HoldInterCodeDto[] {
    const term = this.newSearchTerm().toLowerCase();
    const available = this.availableForNew();
    if (!term) return available;
    return available.filter(c =>
      c.interCode.toLowerCase().includes(term) ||
      c.interDescription.toLowerCase().includes(term)
    );
  }

  isManual(interCode: string): boolean {
    return this.holdCodes.some(c => c.interCode === interCode);
  }

  onButtonClick(action: string): void {
    if (action === 'save') {
      this.save.emit(this.rows());
    } else {
      this.cancel.emit();
    }
  }

  onClose(): void {
    this.cancel.emit();
  }
}
