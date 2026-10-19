import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { FilterChips, FilterChip } from './filter-chips';

describe('FilterChips', () => {
  let component: FilterChips;
  let fixture: ComponentFixture<FilterChips>;
  let compiled: HTMLElement;

  const mockChips: FilterChip[] = [
    { key: 'type', label: 'Type', value: 'Type1', removable: true },
    { key: 'chapter', label: 'Chapter', value: 'CH01', removable: true },
    { key: 'warehouse', label: 'Warehouse', value: 'WH1', removable: true },
    { key: 'status', label: 'Status', value: 'Active', removable: true },
    { key: 'priority', label: 'Priority', value: 'High', removable: true }
  ];

  beforeEach(() => {



      TestBed.configureTestingModule({
imports: [
        FilterChips,
        CommonModule,
        MatChipsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ]
    });


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(FilterChips);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();


    });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });
  describe('shouldShow getter', () => {


    it('should return false when chips array is empty', () => {
      component.chips = [];
      expect(component.shouldShow).toBe(false);
    });

    it('should return true when chips array has items', () => {
      component.chips = [mockChips[0]];
      expect(component.shouldShow).toBe(true);
    });
  });

  describe('ngOnChanges', () => {




    it('should call calculateVisibleChips when both chips and maxVisible change', fakeAsync(() => {
      // Wait for ngAfterViewInit timer to complete first
      tick(100);

      const spy = spyOn<any>(component, 'calculateVisibleChips');

      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false),
        maxVisible: new SimpleChange(3, 5, false)
      });

      tick(100); // Advance timer for ngOnChanges setTimeout (called twice: at 0ms and 50ms)
      expect(spy).toHaveBeenCalledTimes(2);
    }));
  });

  describe('strictChipLimit', () => {
    it('should cap visible chips at maxVisible when strictChipLimit is true', () => {
      component.strictChipLimit = true;
      component.maxVisible = 2;
      component.chips = mockChips;
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(2);
      component['updateDisplay']();
      expect(component.visibleChips.length).toBe(2);
      expect(component.hiddenCount).toBe(3);
    });

    it('should show all chips when under cap with strictChipLimit', () => {
      component.strictChipLimit = true;
      component.maxVisible = 5;
      component.chips = mockChips.slice(0, 2);
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(2);
    });
  });

  describe('updateDisplay - Collapsed State', () => {



    it('should calculate hidden count correctly', () => {
      component.chips = mockChips;
      component['dynamicMaxVisible'] = 2;
      component['updateDisplay']();

      expect(component.hiddenCount).toBe(3);
    });

    it('should generate tooltip text from hidden chips', () => {
      component.chips = mockChips;
      component['dynamicMaxVisible'] = 2;
      component['updateDisplay']();

      // Tooltip format: chip.label only
      const expectedTooltip = mockChips.slice(2).map(c => c.label).join('\n');
      expect(component.hiddenChipsTooltip).toBe(expectedTooltip);
    });



  });

  describe('updateDisplay - All Chips Visible', () => {


    it('should create a copy of chips array', () => {
      component.chips = mockChips.slice(0, 2);
      component['dynamicMaxVisible'] = 2;
      component['updateDisplay']();

      expect(component.visibleChips).not.toBe(component.chips);
      expect(component.visibleChips).toEqual(component.chips);
    });
  });

  describe('Chip Rendering', () => {

    it('should render chip labels correctly', (done) => {
      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const label = compiled.querySelector('.filter-chip__label');
        // Template displays: {{ chip.label }}
        expect(label?.textContent).toBe('Type');
        done();
      }, 150);
    });

    it('should set correct aria-label on chip', (done) => {
      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const chip = compiled.querySelector('.filter-chip');
        // aria-label format: chip.label + ' filter applied'
        expect(chip?.getAttribute('aria-label')).toBe('Type filter applied');
        done();
      }, 150);
    });

    it('should set role="status" on chip', (done) => {
      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const chip = compiled.querySelector('.filter-chip');
        expect(chip?.getAttribute('role')).toBe('status');
        done();
      }, 150);
    });

    it('should render remove button for each chip', (done) => {
      component.chips = mockChips.slice(0, 3);
      component['dynamicMaxVisible'] = 3;
      component.ngOnChanges({
        chips: new SimpleChange([], mockChips.slice(0, 3), false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const removeButtons = compiled.querySelectorAll('.filter-chip__remove');
        expect(removeButtons.length).toBe(3);
        done();
      }, 150);
    });

    it('should set correct aria-label on remove button', (done) => {
      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const removeButton = compiled.querySelector('.filter-chip__remove');
        // aria-label format: 'Remove ' + chip.label + ' filter'
        expect(removeButton?.getAttribute('aria-label')).toBe('Remove Type filter');
        done();
      }, 150);
    });

    it('should render close icon in remove button', (done) => {
      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const icon = compiled.querySelector('.filter-chip__remove-icon');
        expect(icon).toBeTruthy();
        expect(icon?.tagName.toLowerCase()).toBe('mat-icon');
        expect(icon?.textContent?.trim()).toBe('cancel');
        done();
      }, 150);
    });

    it('should render mat-icon for close button', (done) => {
      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const icon = compiled.querySelector('.filter-chip__remove-icon');
        expect(icon?.tagName.toLowerCase()).toBe('mat-icon');
        done();
      }, 150);
    });
  });

  describe('Count Badge', () => {



    it('should display correct hidden count', (done) => {
      component.chips = mockChips;
      component['dynamicMaxVisible'] = 2;

      // Spy on calculateVisibleChips to prevent it from recalculating
      spyOn<any>(component, 'calculateVisibleChips').and.callFake(() => {
        component['dynamicMaxVisible'] = 2;
        component['updateDisplay']();
      });

      component.ngOnChanges({
        chips: new SimpleChange([], mockChips, false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const countBadge = compiled.querySelector('.filter-chips__count');
        expect(countBadge?.textContent?.trim()).toBe('+3');
        done();
      }, 150);
    });

    it('should set correct aria-label on count badge', (done) => {
      component.chips = mockChips;
      component['dynamicMaxVisible'] = 3;
      component.ngOnChanges({
        chips: new SimpleChange([], mockChips, false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const countBadge = compiled.querySelector('.filter-chips__count');
        expect(countBadge?.getAttribute('aria-label')).toBe('2 more filters');
        done();
      }, 150);
    });

  });

  describe('Tooltip on Count Badge', () => {
    it('should show tooltip with hidden chip labels', (done) => {
      component.chips = mockChips;
      component['dynamicMaxVisible'] = 2;
      component.isExpanded = false;

      // Spy on calculateVisibleChips to prevent it from recalculating
      spyOn<any>(component, 'calculateVisibleChips').and.callFake(() => {
        component['dynamicMaxVisible'] = 2;
        component['updateDisplay']();
      });

      component.ngOnChanges({
        chips: new SimpleChange([], mockChips, false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const countBadge = compiled.querySelector('.filter-chips__count');
        expect(countBadge).toBeTruthy();
        expect(component.hiddenChipsTooltip).toBeTruthy();
        done();
      }, 150);
    });

  });

  describe('Clear All Button', () => {


    it('should display correct text', (done) => {
      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const clearButton = compiled.querySelector('.filter-chips__clear-all');
        expect(clearButton?.textContent?.trim()).toBe('CLEAR ALL');
        done();
      }, 150);
    });

    it('should set correct aria-label', (done) => {
      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const clearButton = compiled.querySelector('.filter-chips__clear-all');
        expect(clearButton?.getAttribute('aria-label')).toBe('Clear all applied filters');
        done();
      }, 150);
    });

  });

  describe('onRemove', () => {
    it('should emit removeChip event with correct key', (done) => {
      component.removeChip.subscribe((key: string) => {
        expect(key).toBe('type');
        done();
      });

      component.onRemove('type');
    });


    it('should emit correct key for each chip', () => {
      const emittedKeys: string[] = [];
      component.removeChip.subscribe((key: string) => {
        emittedKeys.push(key);
      });

      component.onRemove('type');
      component.onRemove('chapter');
      component.onRemove('warehouse');

      expect(emittedKeys).toEqual(['type', 'chapter', 'warehouse']);
    });
  });

  describe('onClear', () => {
    it('should emit clearAll event', (done) => {
      component.clearAll.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component.onClear();
    });

    it('should emit clearAll when clear all button is clicked', (done) => {
      let clearAllEmitted = false;
      component.clearAll.subscribe(() => {
        clearAllEmitted = true;
      });

      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const clearButton = compiled.querySelector('.filter-chips__clear-all') as HTMLElement;
        clearButton.click();
        expect(clearAllEmitted).toBe(true);
        done();
      }, 150);
    });
  });

  describe('Dynamic Chip Display', () => {


    it('should update visible chips count when dynamicMaxVisible changes', () => {
      component.chips = mockChips;
      component['dynamicMaxVisible'] = 2;
      component['updateDisplay']();

      expect(component.visibleChips.length).toBe(2);
      expect(component.hiddenCount).toBe(3);

      component['dynamicMaxVisible'] = 4;
      component['updateDisplay']();

      expect(component.visibleChips.length).toBe(4);
      expect(component.hiddenCount).toBe(1);
    });

    it('should display count badge when chips are hidden', (done) => {
      component.chips = mockChips;
      component['dynamicMaxVisible'] = 2;

      spyOn<any>(component, 'calculateVisibleChips').and.callFake(() => {
        component['dynamicMaxVisible'] = 2;
        component['updateDisplay']();
      });

      component.ngOnChanges({
        chips: new SimpleChange([], mockChips, false)
      });

      setTimeout(() => {
        fixture.detectChanges();

        const chipElements = compiled.querySelectorAll('.filter-chip');
        expect(chipElements.length).toBe(2);

        const countBadge = compiled.querySelector('.filter-chips__count');
        expect(countBadge).toBeTruthy();
        expect(countBadge?.textContent?.trim()).toBe('+3');
        done();
      }, 150);
    });
  });

  describe('Edge Cases', () => {


    it('should handle negative dynamicMaxVisible gracefully', () => {
      component.chips = mockChips;
      component['dynamicMaxVisible'] = -1;
      component.isExpanded = false;
      component['updateDisplay']();

      // With negative maxVisible, slice(0, -1) returns all but last element
      expect(component.visibleChips.length).toBe(4);
    });

    it('should handle single chip', (done) => {
      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const chipElements = compiled.querySelectorAll('.filter-chip');
        expect(chipElements.length).toBe(1);
        done();
      }, 150);
    });

    it('should handle chips with special characters in labels', (done) => {
      const specialChip: FilterChip = {
        key: 'special',
        label: '<script>alert("test")</script>',
        value: 'test'
      };
      component.chips = [specialChip];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [specialChip], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const label = compiled.querySelector('.filter-chip__label');
        expect(label?.textContent).toContain('script');
        done();
      }, 150);
    });

    it('should handle very long chip labels', (done) => {
      const longChip: FilterChip = {
        key: 'long',
        label: 'A'.repeat(500),
        value: 'test'
      };
      component.chips = [longChip];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [longChip], false)
      });

      setTimeout(() => {
        fixture.detectChanges();
        const label = compiled.querySelector('.filter-chip__label');
        // Template displays: {{ chip.label }} = 500 characters
        expect(label?.textContent?.length).toBe(500);
        done();
      }, 150);
    });


  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all interactive elements', (done) => {
      component.chips = mockChips;
      component.maxVisible = 3;
      component['dynamicMaxVisible'] = 3;
      component.ngOnChanges({
        chips: new SimpleChange([], mockChips, false)
      });

      setTimeout(() => {
        fixture.detectChanges();

        const removeButtons = compiled.querySelectorAll('.filter-chip__remove');
        removeButtons.forEach(button => {
          expect(button.getAttribute('aria-label')).toBeTruthy();
        });

        const clearButton = compiled.querySelector('.filter-chips__clear-all');
        expect(clearButton?.getAttribute('aria-label')).toBeTruthy();
        done();
      }, 150);
    });

    it('should mark decorative images with aria-hidden', (done) => {
      component.chips = [mockChips[0]];
      component['dynamicMaxVisible'] = 1;
      component.ngOnChanges({
        chips: new SimpleChange([], [mockChips[0]], false)
      });

      setTimeout(() => {
        fixture.detectChanges();

        const icon = compiled.querySelector('.filter-chip__remove-icon');
        expect(icon?.getAttribute('aria-hidden')).toBe('true');
        done();
      }, 150);
    });


    it('should have button type="button" to prevent form submission', (done) => {
      component.chips = mockChips;
      component.maxVisible = 3;
      component['dynamicMaxVisible'] = 3;
      component.ngOnChanges({
        chips: new SimpleChange([], mockChips, false)
      });

      setTimeout(() => {
        fixture.detectChanges();

        const buttons = compiled.querySelectorAll('button');
        buttons.forEach(button => {
          expect(button.getAttribute('type')).toBe('button');
        });
        done();
      }, 150);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete expand/collapse workflow', (done) => {
      component.chips = mockChips;
      component.maxVisible = 3;
      component['dynamicMaxVisible'] = 3;

      // Spy on calculateVisibleChips to maintain dynamicMaxVisible = 3
      spyOn<any>(component, 'calculateVisibleChips').and.callFake(() => {
        component['dynamicMaxVisible'] = 3;
        component['updateDisplay']();
      });

      component.ngOnChanges({
        chips: new SimpleChange([], mockChips, false)
      });

      setTimeout(() => {
        fixture.detectChanges();

        // Initial state
        let visibleChips = compiled.querySelectorAll('.filter-chip');
        expect(visibleChips.length).toBe(3);

        // Expand programmatically
        component.toggleExpand();
        fixture.detectChanges();

        visibleChips = compiled.querySelectorAll('.filter-chip');
        expect(visibleChips.length).toBe(5);

        // Collapse by clicking collapse button
        const collapseButton = compiled.querySelector('.filter-chips__collapse') as HTMLElement;
        collapseButton.click();
        fixture.detectChanges();

        visibleChips = compiled.querySelectorAll('.filter-chip');
        expect(visibleChips.length).toBe(3);
        done();
      }, 150);
    });

    it('should handle remove chip and update display', (done) => {
      let removedKey = '';
      component.removeChip.subscribe((key: string) => {
        removedKey = key;
      });

      component.chips = [...mockChips];
      component.maxVisible = 3;
      component['dynamicMaxVisible'] = 3;
      component.ngOnChanges({
        chips: new SimpleChange([], component.chips, false)
      });

      setTimeout(() => {
        fixture.detectChanges();

        const firstRemoveButton = compiled.querySelector('.filter-chip__remove') as HTMLElement;
        firstRemoveButton.click();

        expect(removedKey).toBe('type');
        done();
      }, 150);
    });

  });

  // Helper to create mock chipsContainer for DOM-dependent calculateVisibleChips tests
  function createMockContainer(options: {
    parentWidth?: number;
    filterButtonWidth?: number | null;
    validationErrorWidth?: number | null;
    chipElementWidths?: number[];
    hasParent?: boolean;
    parentViaClosest?: boolean;
    hasGrandparentFilterButton?: boolean;
    grandparentFilterButtonWidth?: number;
  } = {}): any {
    const parentWidth = options.parentWidth ?? 1000;
    const filterButtonWidth = options.filterButtonWidth ?? null;
    const validationErrorWidth = options.validationErrorWidth ?? null;
    const chipElementWidths = options.chipElementWidths ?? [];
    const hasParent = options.hasParent ?? true;
    const parentViaClosest = options.parentViaClosest ?? true;
    const hasGrandparentFilterButton = options.hasGrandparentFilterButton ?? false;
    const grandparentFilterButtonWidth = options.grandparentFilterButtonWidth ?? 100;

    const chipElements = chipElementWidths.map(w => ({ offsetWidth: w }));

    const grandparentEl = {
      querySelector: (sel: string) => {
        if (sel === '.filter-button' && hasGrandparentFilterButton) {
          return { offsetWidth: grandparentFilterButtonWidth };
        }
        return null;
      }
    };

    const parentEl = hasParent ? {
      offsetWidth: parentWidth,
      querySelector: (sel: string) => {
        if (sel === '.filter-button' && filterButtonWidth != null) return { offsetWidth: filterButtonWidth };
        if (sel === '.validation-error-inline' && validationErrorWidth != null) return { offsetWidth: validationErrorWidth };
        return null;
      },
      parentElement: grandparentEl
    } : null;

    return {
      nativeElement: {
        closest: (_sel: string) => parentViaClosest && hasParent ? parentEl : null,
        parentElement: hasParent ? parentEl : null,
        querySelectorAll: (_sel: string) => chipElements
      }
    };
  }

  describe('calculateVisibleChips - branch coverage', () => {
    it('should set dynamicMaxVisible to 0 for empty chips', () => {
      component.chips = [];
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(0);
      expect(component.visibleChips).toEqual([]);
      expect(component.hiddenCount).toBe(0);
    });

    it('should fall back to maxVisible when chipsContainer is undefined', () => {
      component.chips = mockChips;
      component.maxVisible = 4;
      component['chipsContainer'] = undefined;
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(4);
    });

    it('should fall back to maxVisible when no parent element found', () => {
      component.chips = mockChips;
      component.maxVisible = 4;
      component['chipsContainer'] = createMockContainer({ hasParent: false });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(4);
    });

    it('should collapse all when space is too small for one chip plus badge', () => {
      component.chips = mockChips;
      component.maxVisible = 5;
      component['chipsContainer'] = createMockContainer({
        parentWidth: 200,
        filterButtonWidth: 150
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(0);
    });

    it('should show all chips when measured widths fit in available space', () => {
      const twoChips = mockChips.slice(0, 2);
      component.chips = twoChips;
      component.maxVisible = 5;
      component['chipsContainer'] = createMockContainer({
        parentWidth: 2000,
        chipElementWidths: [100, 100]
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(2);
    });

    it('should respect maxVisible as upper limit when all measured chips fit', () => {
      component.chips = mockChips;
      component.maxVisible = 3;
      component['chipsContainer'] = createMockContainer({
        parentWidth: 3000,
        chipElementWidths: [80, 80, 80, 80, 80]
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(3);
    });

    it('should use estimated widths and limit chips when not all fit', () => {
      component.chips = mockChips;
      component.maxVisible = 5;
      // parentWidth 500: availableForChips=274, estimated avgWidth~102.5, not all fit
      component['chipsContainer'] = createMockContainer({
        parentWidth: 500,
        chipElementWidths: []
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(2);
    });

    it('should limit fittable chips by maxVisible when using estimated widths', () => {
      component.chips = mockChips;
      component.maxVisible = 1;
      component['chipsContainer'] = createMockContainer({
        parentWidth: 500,
        chipElementWidths: []
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(1);
    });

    it('should set dynamicMaxVisible to 0 when estimated chips are too wide to fit', () => {
      const longChips: FilterChip[] = Array.from({ length: 3 }, (_, i) => ({
        key: `k${i}`, label: 'X'.repeat(100), value: `v${i}`, removable: true
      }));
      component.chips = longChips;
      component.maxVisible = 5;
      // parentWidth 370: just passes minimum check but too narrow for 600px-wide chips
      component['chipsContainer'] = createMockContainer({
        parentWidth: 370,
        chipElementWidths: []
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(0);
    });

    it('should use filter button width from parent element', () => {
      component.chips = mockChips.slice(0, 2);
      component.maxVisible = 5;
      component['chipsContainer'] = createMockContainer({
        parentWidth: 2000,
        filterButtonWidth: 200,
        chipElementWidths: [100, 100]
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(2);
    });

    it('should find filter button in grandparent when not in parent', () => {
      component.chips = mockChips.slice(0, 2);
      component.maxVisible = 5;
      component['chipsContainer'] = createMockContainer({
        parentWidth: 2000,
        filterButtonWidth: null,
        hasGrandparentFilterButton: true,
        grandparentFilterButtonWidth: 150,
        chipElementWidths: [100, 100]
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(2);
    });

    it('should use validation error width when no filter button exists', () => {
      component.chips = mockChips.slice(0, 2);
      component.maxVisible = 5;
      component['chipsContainer'] = createMockContainer({
        parentWidth: 2000,
        filterButtonWidth: null,
        validationErrorWidth: 180,
        chipElementWidths: [100, 100]
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(2);
    });

    it('should default to 100px leftFixedWidth when no filter button or validation error', () => {
      component.chips = mockChips.slice(0, 2);
      component.maxVisible = 5;
      component['chipsContainer'] = createMockContainer({
        parentWidth: 2000,
        filterButtonWidth: null,
        validationErrorWidth: null,
        chipElementWidths: [100, 100]
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(2);
    });

    it('should cap strictChipLimit maxVisible to at least 1', () => {
      component.strictChipLimit = true;
      component.maxVisible = 0;
      component.chips = mockChips;
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(1);
    });

    it('should use parentElement fallback when closest returns null', () => {
      component.chips = mockChips.slice(0, 2);
      component.maxVisible = 5;
      component['chipsContainer'] = createMockContainer({
        parentWidth: 2000,
        parentViaClosest: false,
        chipElementWidths: [100, 100]
      });
      component['calculateVisibleChips']();
      expect(component['dynamicMaxVisible']).toBe(2);
    });
  });

  describe('updateDisplay - branch coverage', () => {
    it('should set empty arrays when chips is empty', () => {
      component.chips = [];
      component['updateDisplay']();
      expect(component.visibleChips).toEqual([]);
      expect(component.hiddenCount).toBe(0);
    });

    it('should show all chips and clear tooltip when expanded', () => {
      component.chips = mockChips;
      component.isExpanded = true;
      component['updateDisplay']();
      expect(component.visibleChips.length).toBe(5);
      expect(component.hiddenCount).toBe(0);
      expect(component.hiddenChipsTooltip).toBe('');
    });

    it('should show no visible chips and build tooltip when dynamicMaxVisible is 0', () => {
      component.chips = mockChips;
      component.isExpanded = false;
      component['dynamicMaxVisible'] = 0;
      component['updateDisplay']();
      expect(component.visibleChips).toEqual([]);
      expect(component.hiddenCount).toBe(5);
      expect(component.hiddenChipsTooltip).toBe(mockChips.map(c => c.label).join('\n'));
    });
  });

  describe('toggleExpand - branch coverage', () => {
    it('should expand and show all chips via updateDisplay', () => {
      component.chips = mockChips;
      component['dynamicMaxVisible'] = 2;
      component.isExpanded = false;
      component.toggleExpand();
      expect(component.isExpanded).toBe(true);
      expect(component.visibleChips.length).toBe(5);
      expect(component.hiddenCount).toBe(0);
    });

    it('should collapse and recalculate via calculateVisibleChips', () => {
      component.chips = mockChips;
      component.isExpanded = true;
      const spy = spyOn<any>(component, 'calculateVisibleChips');
      component.toggleExpand();
      expect(component.isExpanded).toBe(false);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onResize', () => {
    it('should delegate to calculateVisibleChips', () => {
      const spy = spyOn<any>(component, 'calculateVisibleChips');
      component.onResize();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy - branch coverage', () => {
    it('should disconnect resizeObserver when it exists', () => {
      const mockDisconnect = jasmine.createSpy('disconnect');
      component['resizeObserver'] = { disconnect: mockDisconnect, observe: () => {}, unobserve: () => {} } as any;
      component.ngOnDestroy();
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should not throw when resizeObserver is undefined', () => {
      component['resizeObserver'] = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('ngOnChanges - edge cases', () => {
    it('should not recalculate when no relevant input changes', fakeAsync(() => {
      tick(1000);
      const spy = spyOn<any>(component, 'calculateVisibleChips');
      component.ngOnChanges({});
      tick(100);
      expect(spy).not.toHaveBeenCalled();
    }));

    it('should recalculate when strictChipLimit changes', fakeAsync(() => {
      tick(1000);
      const spy = spyOn<any>(component, 'calculateVisibleChips');
      component.ngOnChanges({
        strictChipLimit: new SimpleChange(false, true, false)
      });
      tick(100);
      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('setupResizeObserver - branch coverage', () => {
    it('should return early when chipsContainer is undefined', () => {
      component['chipsContainer'] = undefined;
      component['setupResizeObserver']();
      expect(component['resizeObserver']).toBeUndefined();
    });

    it('should set up observer when parent found via closest', () => {
      const mockParent = document.createElement('div');
      component['chipsContainer'] = {
        nativeElement: {
          closest: () => mockParent,
          parentElement: mockParent
        }
      } as any;

      const origRO = (window as any).ResizeObserver;
      let observedEl: any = null;
      (window as any).ResizeObserver = class {
        constructor(public cb: Function) {}
        observe(el: any) { observedEl = el; }
        disconnect() {}
        unobserve() {}
      };

      component['setupResizeObserver']();
      expect(component['resizeObserver']).toBeDefined();
      expect(observedEl).toBe(mockParent);

      (window as any).ResizeObserver = origRO;
    });

    it('should fallback to parentElement when closest returns null', () => {
      const mockParent = document.createElement('div');
      component['chipsContainer'] = {
        nativeElement: {
          closest: () => null,
          parentElement: mockParent
        }
      } as any;

      const origRO = (window as any).ResizeObserver;
      let observedEl: any = null;
      (window as any).ResizeObserver = class {
        constructor(public cb: Function) {}
        observe(el: any) { observedEl = el; }
        disconnect() {}
        unobserve() {}
      };

      component['setupResizeObserver']();
      expect(component['resizeObserver']).toBeDefined();
      expect(observedEl).toBe(mockParent);

      (window as any).ResizeObserver = origRO;
    });

    it('should return early when no parent element found at all', () => {
      component['chipsContainer'] = {
        nativeElement: {
          closest: () => null,
          parentElement: null
        }
      } as any;

      component['setupResizeObserver']();
      expect(component['resizeObserver']).toBeUndefined();
    });

    it('should call calculateVisibleChips when resize is observed', () => {
      const mockParent = document.createElement('div');
      component['chipsContainer'] = {
        nativeElement: {
          closest: () => mockParent,
          parentElement: mockParent
        }
      } as any;

      const origRO = (window as any).ResizeObserver;
      let capturedCb: Function;
      (window as any).ResizeObserver = class {
        constructor(cb: Function) { capturedCb = cb; }
        observe() {}
        disconnect() {}
        unobserve() {}
      };

      component['setupResizeObserver']();
      const spy = spyOn<any>(component, 'calculateVisibleChips');
      capturedCb!([]);
      expect(spy).toHaveBeenCalled();

      (window as any).ResizeObserver = origRO;
    });
  });

  describe('ngAfterViewInit', () => {
    it('should schedule calculateVisibleChips and setupResizeObserver via timeouts', fakeAsync(() => {
      tick(1000);
      const calcSpy = spyOn<any>(component, 'calculateVisibleChips');
      const setupSpy = spyOn<any>(component, 'setupResizeObserver');
      component.ngAfterViewInit();
      tick(50);
      expect(setupSpy).toHaveBeenCalled();
      expect(calcSpy).toHaveBeenCalled();
      tick(150);
      tick(300);
      tick(500);
    }));
  });
});