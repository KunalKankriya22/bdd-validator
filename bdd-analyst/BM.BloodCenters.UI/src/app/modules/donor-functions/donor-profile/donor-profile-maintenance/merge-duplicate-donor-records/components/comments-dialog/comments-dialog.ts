import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';

@Component({
  selector: 'app-comments-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    SidePanelBase
  ],
  templateUrl: './comments-dialog.html',
  styleUrls: ['./comments-dialog.scss']
})
export class CommentsDialog {
  @Input() set note(value: string) {
    this.noteControl.setValue(value || '');
  }
  @Output() saveNote = new EventEmitter<string>();
  @Output() closePanel = new EventEmitter<void>();

  noteControl = new FormControl('');

  footerButtons: DialogButton[] = [
    { label: 'CANCEL', action: 'cancel', variant: 'secondary' },
    { label: 'SAVE', action: 'save', variant: 'primary' }
  ];

  onButtonClick(action: string): void {
    if (action === 'save') {
      this.saveNote.emit(this.noteControl.value?.trim() || '');
    } else {
      this.closePanel.emit();
    }
  }

  onClose(): void {
    this.closePanel.emit();
  }
}
