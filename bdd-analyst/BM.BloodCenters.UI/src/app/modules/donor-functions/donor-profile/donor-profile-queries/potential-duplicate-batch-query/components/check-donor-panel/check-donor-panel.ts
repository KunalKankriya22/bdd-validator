import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CheckSection } from '../../models/potential-duplicate-batch-query.model';

/**
 * Side panel for checking donor information across multiple sections
 * Displays Demographics, Interdictions, Donations, and Attributes in accordion format
 */
@Component({
  selector: 'app-check-donor-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './check-donor-panel.html',
  styleUrl: './check-donor-panel.scss'
})
export class CheckDonorPanel implements OnInit {
  /** Donor name for panel title */
  @Input() donorName: string = '';

  /** Donor ID being checked */
  @Input() donorId: string = '';

  /** Batch ID context */
  @Input() batchId: string = '';

  /** Emitted when panel is closed */
  @Output() closePanel = new EventEmitter<void>();

  /** Emitted when check is completed */
  @Output() checkCompleted = new EventEmitter<string[]>();

  /** Emitted when user wants to view donation history */
  @Output() viewDonations = new EventEmitter<void>();

  /** Panel title */
  get panelTitle(): string {
    return `Did you check: ${this.donorName}`;
  }

  /** Currently expanded section */
  expandedSection = signal<CheckSection | null>('demographics');

  /** Sections that have been checked */
  checkedSections = signal<Set<CheckSection>>(new Set());

  /** All check sections in order */
  readonly sections: { key: CheckSection; label: string; index: number }[] = [
    { key: 'demographics', label: 'Demographics', index: 0 },
    { key: 'interdictions', label: 'Interdictions', index: 1 },
    { key: 'donations', label: 'Donations', index: 2 },
    { key: 'attributes', label: 'Attributes', index: 3 }
  ];

  ngOnInit(): void {
    // Initially expand demographics section
    this.expandedSection.set('demographics');
  }

  /**
   * Handle section expansion
   */
  onSectionExpanded(section: CheckSection): void {
    this.expandedSection.set(section);
  }

  /**
   * Handle NEXT button click
   * Mark current section as checked and move to next section
   */
  onNext(currentSection: CheckSection): void {
    // Mark current section as checked
    const checked = new Set(this.checkedSections());
    checked.add(currentSection);
    this.checkedSections.set(checked);

    // Find next section
    const currentIndex = this.sections.findIndex(s => s.key === currentSection);
    if (currentIndex < this.sections.length - 1) {
      const nextSection = this.sections[currentIndex + 1];
      this.expandedSection.set(nextSection.key);
    }
  }

  /**
   * Handle CHECK & CONTINUE button click (final section)
   * Mark all sections as checked and emit completion
   */
  onCheckAndContinue(): void {
    // Mark attributes as checked
    const checked = new Set(this.checkedSections());
    checked.add('attributes');
    this.checkedSections.set(checked);

    // Emit checked sections
    this.checkCompleted.emit(Array.from(checked));

    // Close panel
    this.onClose();
  }

  /**
   * Handle close button click
   */
  onClose(): void {
    this.closePanel.emit();
  }

  /**
   * Check if section is checked
   */
  isSectionChecked(section: CheckSection): boolean {
    return this.checkedSections().has(section);
  }

  /**
   * Get section icon based on checked state
   */
  getSectionIcon(section: CheckSection): string {
    return 'lock';
  }

  /**
   * Check if this is the last section
   */
  isLastSection(section: CheckSection): boolean {
    return section === 'attributes';
  }

  onViewDonations(): void {
    this.viewDonations.emit();
  }
}
