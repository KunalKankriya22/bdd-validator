import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import {
  LetterInterdictionAssociation,
  UpdateAssociationRequest
} from '../../models/associate-letter.model';

@Component({
  selector: 'app-edit-rule-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    DatePipe
  ],
  templateUrl: './edit-rule-panel.component.html',
  styleUrls: ['./edit-rule-panel.component.scss']
})
export class EditRulePanelComponent implements OnInit {
  @Input() association!: LetterInterdictionAssociation;

  @Output() save = new EventEmitter<UpdateAssociationRequest>();
  @Output() close = new EventEmitter<void>();

  editForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.editForm = this.fb.group({
      terminationDate: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.association?.terminationDate) {
      this.editForm.patchValue({
        terminationDate: new Date(this.association.terminationDate)
      });
    }
  }

  onSave(): void {
    if (this.editForm.valid) {
      const request: UpdateAssociationRequest = {
        terminationDate: this.formatDate(this.editForm.value.terminationDate)
      };
      this.save.emit(request);
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
