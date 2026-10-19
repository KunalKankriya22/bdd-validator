import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { DockingConfigurationComplete } from '../models/sterile-docking-definition.model';

@Component({
  selector: 'app-configuration-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './configuration-summary.component.html',
  styleUrl: './configuration-summary.component.scss'
})
export class ConfigurationSummaryComponent {
  @Input() configuration?: DockingConfigurationComplete | null;

  showFilterFields(): boolean {
    const dockingType = this.configuration?.itemInd;
    return ['FI', 'FB', 'BF'].includes(dockingType || '');
  }

  showSegmentFields(): boolean {
    return this.configuration?.itemInd === 'SE';
  }

  formatYesNo(value?: 'Y' | 'N'): string {
    return value === 'Y' ? 'Yes' : 'No';
  }
}
