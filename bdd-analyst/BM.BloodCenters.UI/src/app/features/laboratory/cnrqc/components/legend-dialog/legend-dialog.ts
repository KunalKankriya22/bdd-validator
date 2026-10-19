import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

/**
 * Dialog component for displaying collection days color legend
 */
@Component({
  selector: 'app-legend-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './legend-dialog.html',
  styleUrl: './legend-dialog.scss',
})
export class LegendDialogComponent {
  /** Legend entries for collection day colors */
  protected readonly legendEntries = [
    { color: 'WHITE', description: '0-2 days', cssClass: 'white-bg' },
    { color: 'YELLOW', description: '3-4 days', cssClass: 'yellow-bg' },
    { color: 'GREEN', description: '5 days', cssClass: 'green-bg' },
    { color: 'BLUE', description: '8+ days', cssClass: 'blue-bg' },
    { color: 'RED', description: '6-7 days', cssClass: 'red-bg' },
  ];
}
