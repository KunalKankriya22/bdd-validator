import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  input,
  output,
  signal,
  model,
  computed,
  effect,
  ViewChild,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Subject,
  Observable,
  EMPTY,
  concat,
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  exhaustMap,
  tap,
  map,
  filter,
  catchError,
  startWith,
  takeUntil,
} from 'rxjs/operators';

import {
  DropdownItem,
  DropdownPage,
  DropdownFetchFn,
  SelectionMode,
} from './smart-dropdown.model';

export type { DropdownItem, DropdownPage, DropdownFetchFn, SelectionMode };

@Component({
  selector: 'app-smart-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
    ScrollingModule,
  ],
  templateUrl: './smart-dropdown.html',
  styleUrls: ['./smart-dropdown.scss'],
})
export class SmartDropdownComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly cdr = inject(ChangeDetectorRef);

  // --- Inputs ---
  multiple = input(false);
  showSelectAll = input(false);
  label = input<string | null>(null);
  placeholder = input('Select...');
  searchPlaceholder = input('Search options...');
  disabled = input(false);
  itemSize = input(42);
  maxVisibleChips = input(1);
  staticItems = input<DropdownItem[]>([]);
  fetchFn = input<DropdownFetchFn | null>(null);

  // --- Two-way bound value ---
  value = model<string | string[] | null>(null);

  // --- Outputs ---
  selectionChange = output<string | string[] | null>();
  selectionModeChange = output<SelectionMode>();

  // --- Internal state ---
  readonly searchControl = new FormControl('');
  readonly items = signal<DropdownItem[]>([]);
  readonly loading = signal(false);
  readonly totalCount = signal(0);
  readonly hasMore = signal(false);
  readonly isServerMode = signal(false);

  // ALL mode: true = user explicitly clicked ALL with no search filter.
  // Used for: trigger display ("All" chip) and backend submission ('ALL' keyword).
  readonly isAllMode = signal(false);

  private currentSkip = 0;
  private readonly pageSize = 50;
  private readonly destroy$ = new Subject<void>();
  private readonly loadMore$ = new Subject<void>();
  private readonly scrollThreshold = 0.8;

  @ViewChild(CdkVirtualScrollViewport) viewport?: CdkVirtualScrollViewport;

  // --- Computed: items to display ---
  readonly filteredItems = signal<DropdownItem[]>([]);

  readonly displayItems = computed(() =>
    this.isServerMode() ? this.items() : this.filteredItems()
  );

  // Are ALL currently displayed items selected?
  readonly allDisplayedSelected = computed(() => {
    if (!this.multiple()) return false;
    const val = this.value();
    if (!Array.isArray(val) || val.length === 0) return false;
    const display = this.displayItems();
    if (display.length === 0) return false;
    const selectedSet = new Set(val);
    return display.every(item => selectedSet.has(item.code));
  });

  // Are SOME (but not all) displayed items selected?
  readonly someDisplayedSelected = computed(() => {
    if (!this.multiple()) return false;
    const val = this.value();
    if (!Array.isArray(val) || val.length === 0) return false;
    const display = this.displayItems();
    if (display.length === 0) return false;
    const selectedSet = new Set(val);
    const selectedCount = display.filter(item => selectedSet.has(item.code)).length;
    return selectedCount > 0 && selectedCount < display.length;
  });

  // --- Lifecycle ---

  constructor() {
    // Watch for staticItems changes and update filteredItems in client-side mode
    effect(() => {
      const items = this.staticItems();
      const fetchFn = this.fetchFn();

      // Only update if in client-side mode (no fetchFn)
      if (!fetchFn && items.length > 0) {
        this.filteredItems.set([...items]);
      }
    });
  }

  ngOnInit(): void {
    const fetchFn = this.fetchFn();
    if (!fetchFn) {
      this.setupClientSideMode();
    } else {
      this.isServerMode.set(true);
      this.setupServerSideMode(fetchFn);
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Client-side mode ---

  private setupClientSideMode(): void {
    this.filteredItems.set([...this.staticItems()]);

    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(term => {
        const search = (term || '').toLowerCase().trim();
        const all = this.staticItems();
        if (!search) {
          this.filteredItems.set([...all]);
          return;
        }
        this.filteredItems.set(
          all.filter(
            opt =>
              (opt.code || '').toLowerCase().includes(search) ||
              (opt.description || '').toLowerCase().includes(search)
          )
        );
      });
  }

  // --- Server-side mode ---

  private setupServerSideMode(fetchFn: DropdownFetchFn): void {
    const search$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.currentSkip = 0;
        this.items.set([]);
      }),
    );

    const loadMore$ = this.loadMore$.pipe(
      filter(() => this.hasMore() && !this.loading()),
    );

    search$.pipe(
      switchMap(search =>
        concat(
          this.fetchPage(fetchFn, search || '', 0),
          loadMore$.pipe(
            exhaustMap(() =>
              this.fetchPage(fetchFn, this.searchControl.value || '', this.currentSkip)
            ),
          ),
        )
      ),
      takeUntil(this.destroy$),
    ).subscribe();
  }

  private fetchPage(fetchFn: DropdownFetchFn, search: string, skip: number): Observable<void> {
    this.loading.set(true);
    const selectedCodes = this.getSelectedCodes();

    return fetchFn(search, skip, this.pageSize, selectedCodes).pipe(
      tap(page => {
        if (skip === 0) {
          this.items.set(page.items);
        } else {
          this.items.update(current => [...current, ...page.items]);
        }
        this.totalCount.set(page.totalCount);
        this.hasMore.set(page.hasMore);
        this.currentSkip = skip + this.pageSize;
        this.loading.set(false);

        // Corner case #8: async page loads while ALL is active → auto-select new items
        if (this.multiple() && this.isAllMode()) {
          const newCodes = page.items.map(i => i.code);
          const currentVal = Array.isArray(this.value()) ? [...(this.value() as string[])] : [];
          const merged = [...new Set([...currentVal, ...newCodes])];
          this.value.set(merged);
          this.cdr.detectChanges();
        }
      }),
      map(() => void 0),
      catchError(() => {
        this.loading.set(false);
        return EMPTY;
      }),
    );
  }

  private getSelectedCodes(): string[] {
    const val = this.value();
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val) return [val];
    return [];
  }

  // --- Scroll ---

  onScroll(index: number): void {
    if (!this.isServerMode()) return;
    const visibleEnd = index + Math.ceil(this.getViewportHeight() / this.itemSize());
    if (visibleEnd >= this.items().length * this.scrollThreshold) {
      this.loadMore$.next();
    }
  }

  getViewportHeight(): number {
    const count = this.displayItems().length;
    return Math.min(count * this.itemSize(), 6 * this.itemSize());
  }

  trackByCode(_: number, item: DropdownItem): string {
    return item.code;
  }

  // --- Selection handlers ---

  // Called by ngModelChange on mat-select (individual item clicks by user)
  onValueChange(newValue: string | string[]): void {
    this.value.set(newValue);
  }

  // Called by (selectionChange) on mat-select (individual item clicks by user)
  onSelectionChange(event: MatSelectChange): void {
    // Corner case #3: user deselects an item while ALL is active → exit ALL mode
    if (this.isAllMode() && this.multiple()) {
      const selectedSet = new Set(event.value as string[]);
      const display = this.displayItems();
      const allStillSelected = display.every(item => selectedSet.has(item.code));
      if (!allStillSelected) {
        this.isAllMode.set(false);
        this.selectionModeChange.emit('individual');
      }
    }

    // Corner case #4: user manually selected every item → auto-enter ALL mode
    if (!this.isAllMode() && this.multiple() && Array.isArray(event.value)) {
      const hasSearch = !!(this.searchControl.value || '').trim();
      if (!hasSearch) {
        const totalItems = this.isServerMode() ? this.totalCount() : this.staticItems().length;
        if (event.value.length >= totalItems && totalItems > 0) {
          this.isAllMode.set(true);
          this.selectionModeChange.emit('all');
        }
      }
    }

    this.selectionChange.emit(event.value);
  }

  // Called by the ALL checkbox (change) event — NOT by mat-select
  toggleSelectAll(): void {
    const display = this.displayItems();
    const displayCodes = display.map(i => i.code);
    const displaySet = new Set(displayCodes);
    const currentVal = Array.isArray(this.value()) ? [...(this.value() as string[])] : [];
    const hasSearch = !!(this.searchControl.value || '').trim();

    if (this.allDisplayedSelected()) {
      // Corner case #2, #6: deselect all DISPLAYED items, keep items from other filters
      const remaining = currentVal.filter(code => !displaySet.has(code));
      this.value.set(remaining);
      this.isAllMode.set(false);
      this.selectionModeChange.emit('individual');
    } else {
      // Corner case #1, #6: select all DISPLAYED items, merge with existing selection
      const merged = [...new Set([...currentVal, ...displayCodes])];
      this.value.set(merged);

      // Only enter ALL mode if there's no search filter
      // Corner case #6, #7: filtered ALL ≠ global ALL
      if (!hasSearch) {
        if (this.isServerMode()) {
          // Server-side: user intent is "select everything" regardless of how many are loaded.
          // New pages will auto-select via fetchPage().
          this.isAllMode.set(true);
        } else {
          // Client-side: all items are loaded, so check if merged covers them all.
          const totalItems = this.staticItems().length;
          this.isAllMode.set(merged.length >= totalItems && totalItems > 0);
        }
      }

      this.selectionModeChange.emit(this.isAllMode() ? 'all' : 'individual');
    }

    this.selectionChange.emit(this.value());
    this.cdr.detectChanges();
  }

  // Corner case #9: deselect ALL via the "All" chip X button
  clearAll(event: MouseEvent): void {
    event.stopPropagation();
    this.value.set([]);
    this.isAllMode.set(false);
    this.selectionModeChange.emit('individual');
    this.selectionChange.emit([]);
    this.cdr.detectChanges();
  }

  // --- Chip display helpers ---

  getVisibleChips(): DropdownItem[] {
    const val = this.value();
    if (!Array.isArray(val) || val.length === 0) return [];
    const max = this.maxVisibleChips();
    const allItems = this.isServerMode() ? this.items() : this.staticItems();
    return val
      .slice(0, max)
      .map(code => allItems.find(i => i.code === code) || { code, description: code });
  }

  getSelectedCount(): number {
    const val = this.value();
    if (!Array.isArray(val)) return 0;
    if (this.isAllMode() && this.isServerMode()) {
      return this.totalCount();
    }
    return val.length;
  }

  getRemainingChipsCount(): number {
    return Math.max(0, this.getSelectedCount() - this.maxVisibleChips());
  }

  hasMoreChips(): boolean {
    return this.getRemainingChipsCount() > 0;
  }

  getHiddenChipsTooltip(): string {
    const val = this.value();
    if (!Array.isArray(val)) return '';
    const max = this.maxVisibleChips();
    const allItems = this.isServerMode() ? this.items() : this.staticItems();
    return val
      .slice(max)
      .map(code => {
        const item = allItems.find(i => i.code === code);
        return item ? item.description : code;
      })
      .join('\n');
  }

  removeChip(code: string, event: MouseEvent): void {
    event.stopPropagation();
    const val = this.value();
    if (!Array.isArray(val)) return;
    const updated = val.filter(v => v !== code);
    this.value.set(updated);
    this.isAllMode.set(false);
    this.selectionModeChange.emit('individual');
    this.selectionChange.emit(updated);
    this.cdr.detectChanges();
  }
}
