import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ValidInstrumentTestScheduleDto } from '../../models/instrument-test-results.model';

@Component({
  selector: 'app-view-test-panel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './view-test-panel.html',
  styleUrls: ['./view-test-panel.scss'],
})
export class ViewTestPanelComponent {
  @Input({ required: true }) testData!: ValidInstrumentTestScheduleDto;
  @Input({ required: true }) machineName!: string;

  @Output() closePanel = new EventEmitter<void>();

  protected fmtDate(v: string | null | undefined): string {
    if (!v) return '—';
    const d = new Date(v);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }

  onClose(): void {
    this.closePanel.emit();
  }
}
