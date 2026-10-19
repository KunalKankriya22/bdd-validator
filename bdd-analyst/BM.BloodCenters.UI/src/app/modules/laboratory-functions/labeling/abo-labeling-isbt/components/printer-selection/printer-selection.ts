import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { PrinterInfo, ProcessingFacility } from '../../models/abo-labeling.model';

/**
 * Printer Selection Component
 * Displays current printer/facility and allows selection of label printer
 * Corresponds to Figma: "ABO Labeling - ISBT.png"
 */
@Component({
  selector: 'app-printer-selection',
  standalone: true,
  imports: [
    CommonModule,
    MatRadioModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './printer-selection.html',
  styleUrl: './printer-selection.scss',
})
export class PrinterSelectionComponent implements OnInit {
  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `printer-selection-${PrinterSelectionComponent.nextId++}`;

  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly labelId = (name: string) => `${this.componentId}-${name}-label`;

  // Signal-based state
  protected readonly printers = signal<PrinterInfo[]>([]);
  protected readonly selectedPrinter = signal<PrinterInfo | null>(null);
  protected readonly currentPrinter = signal<string>('KAS 4x2');
  protected readonly currentFacility = signal<ProcessingFacility>({
    name: 'Central Blood Center',
    address: '3851 Roger Brooke Drive Dallas, US, 78234',
  });
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed values
  protected readonly hasSelection = computed(() => this.selectedPrinter() !== null);
  protected readonly displayedColumns = ['select', 'labelPrinter', 'description'];

  // Outputs
  @Output() printerSelected = new EventEmitter<PrinterInfo>();
  @Output() facilitySelected = new EventEmitter<void>();
  @Output() tieTagPrinterSelected = new EventEmitter<void>();

  ngOnInit(): void {
    this.loadPrinters();
  }

  private loadPrinters(): void {
    // TODO: Replace with actual API call when printer endpoint is available
    // For now, using mock data from Figma design
    const mockPrinters: PrinterInfo[] = [
      { id: '1', name: 'SATO 4x4', description: 'Lenexa - 4X4', isSelected: true },
      { id: '2', name: 'CO 4x2', description: 'Colorado 4x2', isSelected: false },
      { id: '3', name: 'KAS-4x4', description: 'Lenexa - 4X2', isSelected: false },
      { id: '4', name: 'CO 4x4', description: 'Sato 4x2', isSelected: false },
    ];

    this.printers.set(mockPrinters);
    const defaultSelection = mockPrinters.find((p) => p.isSelected);
    if (defaultSelection) {
      this.selectedPrinter.set(defaultSelection);
    }
  }

  onPrinterSelect(printer: PrinterInfo): void {
    this.selectedPrinter.set(printer);
  }

  onSelectClick(): void {
    const selected = this.selectedPrinter();
    if (selected) {
      this.printerSelected.emit(selected);
    }
  }

  onSelectProcessingFacility(): void {
    this.facilitySelected.emit();
  }

  onSelectTieTagPrinter(): void {
    this.tieTagPrinterSelected.emit();
  }
}
