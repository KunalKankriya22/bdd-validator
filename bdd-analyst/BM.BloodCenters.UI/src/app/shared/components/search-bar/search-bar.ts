import { Component, Input, Output, EventEmitter, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

export interface SearchBarConfig {
  placeholder: string;
  minLength?: number;
  ariaLabel?: string;
  debounceTime?: number;
  searchOnEnterOnly?: boolean;
  alwaysShowTooltip?: boolean;
  tooltip?: string;
  tooltipClass?: string;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.scss']
})
export class SearchBar implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(private cdr: ChangeDetectorRef) {}

  @Input() config: SearchBarConfig = {
    placeholder: 'Search',
    minLength: 3,
    ariaLabel: 'Search',
    debounceTime: 300
  };

  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();
  showTooltip = false;
  private lastEmittedValue = '';
  private lastEmittedTime = 0;
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      // Recheck tooltip when config changes
      setTimeout(() => this.checkTooltipNeeded(), 0);
    }

    // Sync searchText changes to the input element
    if (changes['searchText'] && this.searchInput?.nativeElement) {
      const newValue = changes['searchText'].currentValue || '';
      if (this.searchInput.nativeElement.value !== newValue) {
        this.searchInput.nativeElement.value = newValue;
      }
    }
  }

  ngOnInit(): void {
    // Set up debounced search
    this.searchSubject$
      .pipe(
        debounceTime(this.config.debounceTime || 300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchText) => {
        this.search.emit(searchText);
      });
  }

  ngAfterViewInit(): void {
    // Check if tooltip is needed after view initialization
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => this.checkTooltipNeeded(), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkTooltipNeeded(): void {
    if (this.config.alwaysShowTooltip === false) {
      this.showTooltip = false;
    } else {
      this.showTooltip = true;
    }
    this.cdr.markForCheck();
  }

  /**
   * Handle input changes — strip leading spaces immediately, allow trailing spaces in input
   * but always trim before processing/emitting search values.
   */
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Strip leading spaces immediately
    const hasLeadingSpace = value.length > 0 && value[0] === ' ';
    if (hasLeadingSpace) {
      const cursorPosition = input.selectionStart || 0;
      const leadingSpaces = value.length - value.trimStart().length;

      value = value.trimStart();
      input.value = value;

      const newPosition = Math.max(0, cursorPosition - leadingSpaces);
      try {
        input.setSelectionRange(newPosition, newPosition);
      } catch (e) {
        // Ignore cursor positioning errors
      }
    }

    this.searchText = value;
    this.searchTextChange.emit(value);

    const trimmedText = value.trim();
    const minLength = this.config.minLength ?? 3;

    if (this.config.searchOnEnterOnly) {
      // Auto-search when input is cleared (all characters removed)
      if (trimmedText === '') {
        this.search.emit('');
      }
      return;
    }

    // Always trim before emitting search values
    if (this.searchText === '') {
      this.searchSubject$.next('');
    } else if (trimmedText.length >= minLength) {
      this.searchSubject$.next(trimmedText);
    }
  }

  /**
   * Prevent leading spaces from being typed
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      const input = event.target as HTMLInputElement;
      const cursorPosition = input.selectionStart || 0;

      // Prevent leading space (cursor at position 0)
      if (cursorPosition === 0) {
        event.preventDefault();
        return;
      }
    }
  }

  /**
   * Trim leading and trailing spaces when user leaves the field
   * This ensures the input shows the trimmed value visually
   */
  onBlur(): void {
    if (this.searchText) {
      const trimmedText = this.searchText.trim();

      // Only update if trimming changed the value
      if (this.searchText !== trimmedText) {
        this.searchText = trimmedText;
        this.searchTextChange.emit(trimmedText);

        // Ensure the native input element shows the trimmed value
        if (this.searchInput?.nativeElement) {
          this.searchInput.nativeElement.value = trimmedText;
        }
      }
    }
  }

  onSearchSubmit(): void {
    const trimmedText = this.searchText.trim();
    const minLength = this.config.minLength ?? 3;

    console.log('⏎ Enter pressed - text:', trimmedText, 'length:', trimmedText.length, 'minLength:', minLength);

    // Don't submit if input is empty or only whitespace - BUG FIX
    if (!trimmedText) {
      return;
    }

    // Only submit if meets minimum length
    if (trimmedText.length >= minLength) {
      this.lastEmittedValue = trimmedText;
      this.lastEmittedTime = Date.now();
      this.search.emit(trimmedText);
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.searchTextChange.emit('');
    this.lastEmittedValue = '';
    this.lastEmittedTime = Date.now();

    // Clear the native input element to ensure visual sync
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.value = '';
    }

    this.search.emit('');
    this.cleared.emit();
  }

  focus(): void {
    this.searchInput?.nativeElement.focus();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkTooltipNeeded();
  }
}