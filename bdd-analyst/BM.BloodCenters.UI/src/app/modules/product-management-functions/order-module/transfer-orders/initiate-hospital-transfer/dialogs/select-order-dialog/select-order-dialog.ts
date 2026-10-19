import { Component, OnInit, OnDestroy, signal, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { OrderSearchResultDto, SelectOrderDialogData } from '../../models/initiate-hospital-transfer.model';

type SortDirection = 'A' | 'D' | 'default';

@Component({
  selector: 'app-select-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './select-order-dialog.html',
  styleUrl: './select-order-dialog.scss',
})
export class SelectOrderDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<SelectOrderDialogComponent>);
  private readonly dialogData: SelectOrderDialogData = inject(MAT_DIALOG_DATA);
  private readonly elementRef = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();

  searchCtrl = new FormControl('');
  selectedOrderNo = signal<string | null>(null);
  filteredOrders = signal<OrderSearchResultDto[]>([]);

  private allOrders: OrderSearchResultDto[] = [];
  private searchText = '';
  private sortColumn = 'orderNo';
  private sortDirection: SortDirection = 'A';

  ngOnInit(): void {
    this.allOrders = this.dialogData.orders || [];
    this.applyFilterAndSort();

    if (this.dialogData.selectedOrderNo) {
      this.selectedOrderNo.set(this.dialogData.selectedOrderNo);
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
      const orders = this.filteredOrders();
      if (index >= 0 && index < orders.length) {
        this.selectedOrderNo.set(orders[index].orderNo);
      }
    }

    if (this.selectedOrderNo()) {
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

  onSelectOrder(order: OrderSearchResultDto): void {
    this.selectedOrderNo.set(order.orderNo);
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
    const selected = this.selectedOrderNo();
    if (selected) {
      const order = this.allOrders.find(o => o.orderNo === selected);
      this.dialogRef.close(order || null);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  private applyFilterAndSort(): void {
    const search = (this.searchText || '').toLowerCase();
    let orders = [...this.allOrders];

    if (search) {
      orders = orders.filter(o =>
        String(o.orderNo ?? '').toLowerCase().includes(search) ||
        String(o.consigneeName ?? '').toLowerCase().includes(search) ||
        String(o.class ?? '').toLowerCase().includes(search) ||
        String(o.priority ?? '').toLowerCase().includes(search) ||
        String(o.age ?? '').toLowerCase().includes(search),
      );
    }

    if (this.sortDirection !== 'default') {
      const isAsc = this.sortDirection === 'A';
      orders.sort((a, b) => {
        let valA: string | number | undefined;
        let valB: string | number | undefined;

        switch (this.sortColumn) {
          case 'orderNo': valA = a.orderNo; valB = b.orderNo; break;
          case 'consigneeName': valA = a.consigneeName; valB = b.consigneeName; break;
          case 'class': valA = a.class; valB = b.class; break;
          case 'age': valA = a.age; valB = b.age; break;
          case 'priority': valA = a.priority; valB = b.priority; break;
          default: return 0;
        }

        if (valA == null && valB == null) return 0;
        if (valA == null) return isAsc ? -1 : 1;
        if (valB == null) return isAsc ? 1 : -1;

        return (valA < valB ? -1 : valA > valB ? 1 : 0) * (isAsc ? 1 : -1);
      });
    }

    this.filteredOrders.set(orders);
  }
}
