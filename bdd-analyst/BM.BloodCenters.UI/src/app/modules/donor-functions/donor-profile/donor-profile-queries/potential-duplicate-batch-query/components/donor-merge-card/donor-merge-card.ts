import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import moment from 'moment';

import { DuplicateDonor } from '../../models/potential-duplicate-batch-query.model';

/**
 * Reusable card component for displaying donor information in merge scenarios
 * Shows primary or secondary donor details with navigation option
 */
@Component({
  selector: 'app-donor-merge-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './donor-merge-card.html',
  styleUrl: './donor-merge-card.scss'
})
export class DonorMergeCard {
  /** Card title (e.g., "Primary Merge" or "Secondary Merge") */
  @Input() title: string = '';

  /** Donor information to display */
  @Input() donor: DuplicateDonor | null = null;

  /** Whether to show the navigation arrow */
  @Input() showNavigation: boolean = true;

  /** Emitted when navigation arrow is clicked */
  @Output() navigate = new EventEmitter<string>();

  /**
   * Handle navigation arrow click
   * Navigates to donor profile/details page
   */
  onNavigate(): void {
    if (this.donor?.donorId) {
      this.navigate.emit(this.donor.donorId);
    }
  }

  /**
   * Format date to DD-MMM-YYYY
   */
  formatDate(value: string | null): string {
    if (!value) return '--';
    const m = moment(value);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : value;
  }

  /**
   * Display value or '--' for empty values
   */
  displayValue(value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '--';
    return value;
  }

  /**
   * Convert sex code to full display text
   * M -> Male, F -> Female
   */
  displaySex(value: string | null | undefined): string {
    if (!value) return '--';
    const sexMap: { [key: string]: string } = {
      'M': 'Male',
      'F': 'Female'
    };
    return sexMap[value.toUpperCase()] || value;
  }

  /**
   * Check if donor data is available
   */
  get hasDonor(): boolean {
    return this.donor !== null;
  }
}
