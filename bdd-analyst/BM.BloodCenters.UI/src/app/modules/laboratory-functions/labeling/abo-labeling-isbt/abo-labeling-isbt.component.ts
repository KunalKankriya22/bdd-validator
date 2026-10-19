import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrinterSelectionComponent } from './components/printer-selection/printer-selection';
import { AboLabelingFormComponent } from './components/abo-labeling-form/abo-labeling-form';
import { PrinterInfo } from './models/abo-labeling.model';

/**
 * ABO Labeling ISBT Container Component
 * Main container that manages printer selection and ABO labeling workflow
 * Routes: /laboratory-functions/labeling/abo-labeling-isbt
 */
@Component({
  selector: 'app-abo-labeling-isbt',
  standalone: true,
  imports: [CommonModule, PrinterSelectionComponent, AboLabelingFormComponent],
  templateUrl: './abo-labeling-isbt.component.html',
  styleUrl: './abo-labeling-isbt.component.scss',
})
export class AboLabelingIsbtComponent {
  // Signal to track which view to show
  readonly showPrinterSelection = signal<boolean>(true);
  readonly selectedPrinter = signal<PrinterInfo | null>(null);

  onPrinterSelected(printer: PrinterInfo): void {
    this.selectedPrinter.set(printer);
    this.showPrinterSelection.set(false);
  }

  onChangePrinter(): void {
    this.showPrinterSelection.set(true);
  }

  onFacilitySelected(): void {
    // TODO: Implement processing facility selection
    console.log('Select processing facility');
  }

  onTieTagPrinterSelected(): void {
    // TODO: Implement tie tag printer selection
    console.log('Select tie tag printer');
  }
}
