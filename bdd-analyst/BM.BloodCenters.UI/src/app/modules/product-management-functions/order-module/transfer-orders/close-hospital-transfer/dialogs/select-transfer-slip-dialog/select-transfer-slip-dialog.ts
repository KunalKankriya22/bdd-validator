import { Component, OnInit, OnDestroy, signal, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { OpenTransferSlipDto, SelectTransferSlipDialogData } from '../../models/close-hospital-transfer.model';

type SortDirection = 'A' | 'D' | 'default';

@Component({
  selector: 'app-select-transfer-slip-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './select-transfer-slip-dialog.html',
  styleUrl: './select-transfer-slip-dialog.scss',
})
export class SelectTransferSlipDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<SelectTransferSlipDialogComponent>);
  private readonly dialogData: SelectTransferSlipDialogData = inject(MAT_DIALOG_DATA);
  private readonly elementRef = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();

  searchCtrl = new FormControl('');
  selectedPickSlipId = signal<string | null>(null);
  filteredSlips = signal<OpenTransferSlipDto[]>([]);

  private allSlips: OpenTransferSlipDto[] = [];
  private searchText = '';
  private sortColumn = 'pickSlipId';
  private sortDirection: SortDirection = 'A';

  ngOnInit(): void {
    this.allSlips = this.dialogData.slips || [];
    this.applyFilterAndSort();

    if (this.dialogData.selectedPickSlipId) {
      this.selectedPickSlipId.set(this.dialogData.selectedPickSlipId);
    }

    this.searchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((value: string | null) => {
        this.searchText = value || '';
        this.applyFilterAndSort();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('keydown.enter', ['$event'])
  onEnterKey(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT') return;

    const focusedRow = this.elementRef.nativeElement.querySelector('tbody tr:focus');
    if (focusedRow) {
      const index = Array.from(this.elementRef.nativeElement.querySelectorAll('tbody tr')).indexOf(focusedRow);
      const slips = this.filteredSlips();
      if (index >= 0 && index < slips.length) {
        this.selectedPickSlipId.set(slips[index].pickSlipId);
      }
    }

    if (this.selectedPickSlipId()) {
      this.onContinue();
    }
  }

  @HostListener('keydown.arrowDown', ['$event'])
  @HostListener('keydown.arrowUp', ['$event'])
  onArrowKey(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT') return;
    event.preventDefault();

    const rows = Array.from(this.elementRef.nativeElement.querySelectorAll('tbody tr[tabindex]')) as HTMLElement[];
    if (rows.length === 0) return;

    const focusedRow = this.elementRef.nativeElement.querySelector('tbody tr:focus');
    let currentIndex = focusedRow ? rows.indexOf(focusedRow) : -1;
    const keyEvent = event as KeyboardEvent;

    if (keyEvent.key === 'ArrowDown') {
      currentIndex = currentIndex < rows.length - 1 ? currentIndex + 1 : 0;
    } else {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : rows.length - 1;
    }

    rows[currentIndex].focus();
  }

  onSelectSlip(slip: OpenTransferSlipDto): void {
    this.selectedPickSlipId.set(slip.pickSlipId);
  }

  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'A' ? 'D' : this.sortDirection === 'D' ? 'default' : 'A';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'A';
    }
    this.applyFilterAndSort();
  }

  isSortActive(column: string): boolean {
    return this.sortColumn === column && this.sortDirection !== 'default';
  }

  getSortIcon(column: string): string {
    if (this.sortColumn === column) {
      if (this.sortDirection === 'A') return 'arrow_upward';
      if (this.sortDirection === 'D') return 'arrow_downward';
    }
    return 'unfold_more';
  }

  onContinue(): void {
    const selected = this.selectedPickSlipId();
    if (selected) {
      const slip = this.allSlips.find(s => s.pickSlipId === selected);
      this.dialogRef.close(slip || null);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  formatDate(isoDate: string | null | undefined): string {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private applyFilterAndSort(): void {
    const search = (this.searchText || '').toLowerCase();
    let slips = [...this.allSlips];

    if (search) {
      slips = slips.filter(s =>
        String(s.pickSlipId ?? '').toLowerCase().includes(search) ||
        String(s.sourceHospitalName ?? '').toLowerCase().includes(search) ||
        String(s.destinationHospitalName ?? '').toLowerCase().includes(search) ||
        String(s.pickSlipType ?? '').toLowerCase().includes(search) ||
        String(s.productCount ?? '').toLowerCase().includes(search),
      );
    }

    if (this.sortDirection !== 'default') {
      const isAsc = this.sortDirection === 'A';
      slips.sort((a, b) => {
        let valA: string | number | undefined;
        let valB: string | number | undefined;

        switch (this.sortColumn) {
          case 'pickSlipId': valA = a.pickSlipId; valB = b.pickSlipId; break;
          default: return 0;
        }

        if (valA == null && valB == null) return 0;
        if (valA == null) return isAsc ? -1 : 1;
        if (valB == null) return isAsc ? 1 : -1;

        return (valA < valB ? -1 : valA > valB ? 1 : 0) * (isAsc ? 1 : -1);
      });
    }

    this.filteredSlips.set(slips);
  }
}
