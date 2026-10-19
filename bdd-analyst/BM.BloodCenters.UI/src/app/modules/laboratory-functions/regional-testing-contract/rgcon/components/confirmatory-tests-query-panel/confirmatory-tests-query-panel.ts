import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { ReactiveTestResult, ConfirmatoryTestResult } from '../../models/regional-testing-contract.model';
import moment from 'moment';

@Component({
  selector: 'app-confirmatory-tests-query-panel',
  standalone: true,
  imports: [CommonModule, SidePanelBase],
  templateUrl: './confirmatory-tests-query-panel.html',
  styleUrl: './confirmatory-tests-query-panel.scss'
})
export class ConfirmatoryTestsQueryPanelComponent {
  private static nextId = 0;
  protected readonly componentId = `confirm-query-panel-${ConfirmatoryTestsQueryPanelComponent.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  @Input() reactiveTests: ReactiveTestResult[] = [];
  @Input() confirmatoryTests: ConfirmatoryTestResult[] = [];
  @Output() close = new EventEmitter<void>();

  footerButtons: DialogButton[] = [
    { label: 'CLOSE', action: 'close', variant: 'secondary' }
  ];

  onButtonClick(action: string): void {
    if (action === 'close') {
      this.close.emit();
    }
  }

  onClosePanel(): void {
    this.close.emit();
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '-';
  }
}
