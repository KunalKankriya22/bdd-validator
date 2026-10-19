import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip'; 

export interface FilterChip {
  key: string;
  label: string;
  value: any;
  removable?: boolean;
}

@Component({
  selector: 'app-filter-chips',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './filter-chips.html',
  styleUrls: ['./filter-chips.scss']
})
export class FilterChips implements OnChanges, AfterViewInit, OnDestroy {
  @Input() chips: FilterChip[] = [];
  @Input() maxVisible: number = 3;
  @Input() strictChipLimit = false;
  @Output() removeChip = new EventEmitter<string>();
  @Output() clearAll = new EventEmitter<void>();

  @ViewChild('chipsContainer', { read: ElementRef }) chipsContainer?: ElementRef;

  visibleChips: FilterChip[] = [];
  hiddenCount: number = 0;
  hiddenChipsTooltip: string = '';
  isExpanded: boolean = false;
  private dynamicMaxVisible: number = 3;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    // Initial calculation after view is rendered
    setTimeout(() => {
      this.calculateVisibleChips();
      this.setupResizeObserver();
    }, 50);

    // Also recalculate after images/fonts load and layout settles
    setTimeout(() => this.calculateVisibleChips(), 200);
    setTimeout(() => this.calculateVisibleChips(), 500);

    // Final recalculation after everything is definitely settled
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.calculateVisibleChips());
    } else {
      setTimeout(() => this.calculateVisibleChips(), 1000);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chips'] || changes['maxVisible'] || changes['strictChipLimit']) {
      // Recalculate when chips array changes
      setTimeout(() => this.calculateVisibleChips(), 0);
      // Double-check after a brief delay for layout settling
      setTimeout(() => this.calculateVisibleChips(), 50);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculateVisibleChips();
  }

  private setupResizeObserver(): void {
    if (!this.chipsContainer) {
      return;
    }

    // Find parent container by looking for common patterns: *__controls-left
    let parentElement = this.chipsContainer.nativeElement.closest('[class*="__controls-left"]');

    // Fallback to parent element if specific class not found
    if (!parentElement) {
      parentElement = this.chipsContainer.nativeElement.parentElement;
    }

    if (!parentElement) {
      return;
    }

    // Watch for size changes on the parent container
    this.resizeObserver = new ResizeObserver(() => {
      this.calculateVisibleChips();
    });

    this.resizeObserver.observe(parentElement);
  }

  private calculateVisibleChips(): void {
    if (!this.chips || this.chips.length === 0) {
      this.dynamicMaxVisible = 0;
      this.updateDisplay();
      return;
    }

    if (this.strictChipLimit) {
      const cap = Math.max(1, this.maxVisible);
      this.dynamicMaxVisible = this.chips.length <= cap ? this.chips.length : cap;
      this.updateDisplay();
      return;
    }

    if (!this.chipsContainer) {
      this.dynamicMaxVisible = this.maxVisible;
      this.updateDisplay();
      return;
    }

    // Get parent container (controls-left div) - use multiple selectors
    let parentElement = this.chipsContainer.nativeElement.closest('[class*="controls-left"]') ||
                        this.chipsContainer.nativeElement.closest('[class*="__controls-left"]') ||
                        this.chipsContainer.nativeElement.parentElement;

    if (!parentElement) {
      this.dynamicMaxVisible = this.maxVisible;
      this.updateDisplay();
      return;
    }

    // Get the parent width
    const parentWidth = (parentElement as HTMLElement).offsetWidth;

    // Find FILTER button or validation error - look in parent AND grandparent
    let filterButton = parentElement.querySelector('.filter-button') as HTMLElement;
    if (!filterButton && parentElement.parentElement) {
      filterButton = parentElement.parentElement.querySelector('.filter-button') as HTMLElement;
    }

    const validationError = parentElement.querySelector('.validation-error-inline') as HTMLElement;
    const leftFixedWidth = filterButton ? filterButton.offsetWidth : (validationError ? validationError.offsetWidth : 100);


    // Constants
    const CLEAR_BUTTON_WIDTH = 100; // CLEAR ALL button with padding
    const COUNT_BADGE_WIDTH = 50; // +N badge
    const GAP = 8; // Gap between items
    const MIN_CHIP_WIDTH = 80; // Minimum chip width for proper display
    const IDEAL_CHIP_WIDTH = 250; // Ideal chip width for comfortable reading
    const MAX_CHIP_WIDTH = 600; // Maximum chip width (constrained by CSS max-width: 600px)
    const BUFFER = 10; // Minimal safety margin

    // Available width calculation:
    // parentWidth - filterButton - gap - chips - gap - clearAll - buffer
    const gapsCount = 2; // gaps: filter|chips, chips|clearAll (no badge gap initially)
    const availableForChips = parentWidth - leftFixedWidth - CLEAR_BUTTON_WIDTH - (GAP * gapsCount) - BUFFER;

    // If not enough space for even 1 chip + badge, collapse all to +N only
    if (availableForChips < (MIN_CHIP_WIDTH + COUNT_BADGE_WIDTH + GAP)) {
      this.dynamicMaxVisible = 0;
      this.updateDisplay();
      return;
    }

    // Calculate average chip width based on actual chip content
    // IMPORTANT: Only use actual measurements if we have ALL chips visible
    // Otherwise, use estimated width to avoid "stuck collapsed" state
    let avgWidth = IDEAL_CHIP_WIDTH;
    const chipElements = this.chipsContainer.nativeElement.querySelectorAll('.filter-chip');

    // Only use measured width if all chips are currently visible
    if (chipElements.length === this.chips.length && chipElements.length > 0) {
      let totalChipWidth = 0;
      chipElements.forEach((chip: HTMLElement) => {
        totalChipWidth += chip.offsetWidth;
      });
      avgWidth = Math.min(Math.max(totalChipWidth / chipElements.length, MIN_CHIP_WIDTH), MAX_CHIP_WIDTH);
    } else {
      // Use estimated width based on label lengths
      // Get max label length to be more accurate
      const maxLabelLength = Math.max(...this.chips.map(chip => chip.label.length));
      // Estimate: ~6.5px per character + left padding (12px) + right padding (6px) + icon (26px) = 44px base
      const estimatedWidth = Math.min(maxLabelLength * 6.5 + 44, MAX_CHIP_WIDTH);
      avgWidth = Math.max(estimatedWidth, MIN_CHIP_WIDTH);
    }

    // First, check if ALL chips can fit without +N badge
    // Total width needed = sum of all chips + gaps between them
    const totalChipsWidth = this.chips.length * avgWidth + (this.chips.length - 1) * GAP;

    if (totalChipsWidth <= availableForChips) {
      // All chips fit! But respect maxVisible as hard limit
      this.dynamicMaxVisible = Math.min(this.chips.length, this.maxVisible);
      this.updateDisplay();
      return;
    }

    // Not all fit - need to use +N badge
    // Recalculate available space accounting for badge
    const availableForChipsWithBadge = availableForChips - COUNT_BADGE_WIDTH - GAP;

    // Calculate how many chips fit: width needed = n * avgWidth + (n-1) * GAP
    // Solving: n * avgWidth + (n-1) * GAP <= availableForChipsWithBadge
    // n * (avgWidth + GAP) - GAP <= availableForChipsWithBadge
    // n <= (availableForChipsWithBadge + GAP) / (avgWidth + GAP)
    let fittableChips = Math.floor((availableForChipsWithBadge + GAP) / (avgWidth + GAP));

    // Respect maxVisible as hard limit
    fittableChips = Math.min(fittableChips, this.maxVisible);

    // Ensure we show at least 1 chip if space allows
    if (fittableChips >= 1 && fittableChips < this.chips.length) {
      this.dynamicMaxVisible = fittableChips;
    } else if (fittableChips >= this.chips.length) {
      // Edge case: calculation says all fit (shouldn't happen, but be safe)
      this.dynamicMaxVisible = Math.min(this.chips.length, this.maxVisible);
    } else {
      // Not enough space for even 1 chip, just show +N
      this.dynamicMaxVisible = 0;
    }

    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.chips || this.chips.length === 0) {
      this.visibleChips = [];
      this.hiddenCount = 0;
      return;
    }

    // If expanded, show all chips
    if (this.isExpanded) {
      this.visibleChips = [...this.chips];
      this.hiddenCount = 0;
      this.hiddenChipsTooltip = '';
      return;
    }

    // Otherwise show based on dynamicMaxVisible
    const maxToShow = this.dynamicMaxVisible;

    // If maxToShow is 0, show no chips, just the +N badge with all chips
    if (maxToShow === 0) {
      this.visibleChips = [];
      this.hiddenCount = this.chips.length;
      this.hiddenChipsTooltip = this.chips.map(c => c.label).join('\n');
      return;
    }

    if (this.chips.length <= maxToShow) {
      this.visibleChips = this.chips.slice(0, maxToShow);
      this.hiddenCount = 0;
    } else {
      this.visibleChips = this.chips.slice(0, maxToShow);
      const hidden = this.chips.slice(maxToShow);
      this.hiddenCount = hidden.length;
      this.hiddenChipsTooltip = hidden.map(c => c.label).join('\n');
    }
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    if (!this.isExpanded) {
      // Recalculate when collapsing
      this.calculateVisibleChips();
    } else {
      // Just update display when expanding
      this.updateDisplay();
    }
  }

  onRemove(key: string): void {
    this.removeChip.emit(key);
  }

  onClear(): void {
    this.clearAll.emit();
  }

  get shouldShow(): boolean {
    return this.chips && this.chips.length > 0;
  }
}