import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ProcessStep {
  id: string;
  sequence: string;
  name: string;
  conditions: ProcessStepCondition[];
}

export interface ProcessStepCondition {
  id: string;
  sequence: string;
  description: string;
}

@Component({
  selector: 'app-process-steps-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './process-steps-list.html',
  styleUrls: ['./process-steps-list.scss']
})
export class ProcessStepsListComponent {
  @Input() steps: ProcessStep[] = [];
  @Input() selectedStepId: string | null = null;
  @Input() isLoading = false;
  @Output() stepSelect = new EventEmitter<ProcessStep>();
  @Output() addNewStep = new EventEmitter<void>();

  onStepClick(step: ProcessStep): void {
    this.stepSelect.emit(step);
  }

  onAddNewStep(): void {
    this.addNewStep.emit();
  }

  isSelected(step: ProcessStep): boolean {
    return this.selectedStepId === step.id;
  }

  getDisplayDescription(description: string): string {
    // Remove lookingFor part (before pipe) for display
    const pipeParts = description.split('|');
    return pipeParts.length === 2 ? pipeParts[1].trim() : description;
  }
}
