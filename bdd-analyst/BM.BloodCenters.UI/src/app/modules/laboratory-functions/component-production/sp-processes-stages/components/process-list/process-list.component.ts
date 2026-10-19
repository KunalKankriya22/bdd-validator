import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { Process } from '../../models/sp-processes-stages.model';

@Component({
  selector: 'app-process-list',
  standalone: true,
  imports: [CommonModule, MatListModule],
  templateUrl: './process-list.component.html',
  styleUrls: ['./process-list.component.scss']
})
export class ProcessListComponent {
  @Input() processes: Process[] = [];
  @Input() selectedProcessCode: string | null = null;
  @Input() isLoading = false;

  @Output() processSelected = new EventEmitter<Process>();

  onProcessClick(process: Process): void {
    this.processSelected.emit(process);
  }

  isSelected(process: Process): boolean {
    return this.selectedProcessCode === process.code;
  }
}
