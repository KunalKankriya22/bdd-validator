import {
  Component,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import moment from 'moment';

import { ReactiveTest, ConfirmatoryTest } from '../../../models/regional-testing-contract.models';

/**
 * Customer Override Query Dialog Component
 * Displays reactive and confirmatory test tables
 *
 * TODO: Implement when customer override API is available
 */
@Component({
  selector: 'app-customer-override-query-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule
  ],
  templateUrl: './customer-override-query-dialog.component.html',
  styleUrl: './customer-override-query-dialog.component.scss'
})
export class CustomerOverrideQueryDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `customer-override-query-dialog-${CustomerOverrideQueryDialogComponent.nextId++}`;

  private readonly dialogRef = inject(MatDialogRef<CustomerOverrideQueryDialogComponent>);

  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  // Mock data - TODO: Replace with API data
  protected readonly reactiveTests = signal<ReactiveTest[]>([
    { testId: 'HIV1', testResults: 'Reactive', sequence: 1 },
    { testId: 'HCV', testResults: 'Reactive', sequence: 2 },
    { testId: 'HBV', testResults: 'Reactive', sequence: 3 }
  ]);

  protected readonly confirmatoryTests = signal<ConfirmatoryTest[]>([
    {
      testId: 'HIV1-WB',
      description: 'HIV-1 Western Blot',
      effDate: '2025-01-01T00:00:00Z',
      termDate: null
    },
    {
      testId: 'HCV-RIBA',
      description: 'HCV Recombinant Immunoblot Assay',
      effDate: '2025-01-01T00:00:00Z',
      termDate: null
    },
    {
      testId: 'HBV-NAT',
      description: 'HBV Nucleic Acid Test',
      effDate: '2025-01-01T00:00:00Z',
      termDate: '2025-12-31T00:00:00Z'
    }
  ]);

  protected readonly reactiveTestColumns: string[] = ['testId', 'testResults', 'sequence'];
  protected readonly confirmatoryTestColumns: string[] = ['testId', 'description', 'effDate', 'termDate'];

  onClose(): void {
    this.dialogRef.close();
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }
}
