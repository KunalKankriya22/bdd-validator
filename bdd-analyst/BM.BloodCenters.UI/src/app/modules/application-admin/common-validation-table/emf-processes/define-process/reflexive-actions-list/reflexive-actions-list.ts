import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ReflexiveAction {
  id: string;
  code: string;
  name: string;
  actionOn: string;
  actionValue: string;
  badge?: string;
  linkedAction?: string;
}

@Component({
  selector: 'app-reflexive-actions-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './reflexive-actions-list.html',
  styleUrls: ['./reflexive-actions-list.scss']
})
export class ReflexiveActionsListComponent {
  @Input() actions: ReflexiveAction[] = [];
  @Input() selectedActionId: string | null = null;
  @Input() isLoading = false;
  @Output() actionSelect = new EventEmitter<ReflexiveAction>();
  @Output() addNewAction = new EventEmitter<void>();

  onActionClick(action: ReflexiveAction): void {
    this.actionSelect.emit(action);
  }

  onAddNewAction(): void {
    this.addNewAction.emit();
  }

  isSelected(action: ReflexiveAction): boolean {
    return this.selectedActionId === action.id;
  }
}
