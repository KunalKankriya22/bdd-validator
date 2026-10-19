import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

export interface EditRuleDialogData {
  association: LetterInterdictionAssociation;
}

@Component({
  selector: 'app-edit-rule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    DatePipe
  ],
  templateUrl: './edit-rule-dialog.component.html',
  styleUrls: ['./edit-rule-dialog.component.scss']
})
export class EditRuleDialogComponent implements OnInit {
  editForm: FormGroup;
  association: LetterInterdictionAssociation;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditRuleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditRuleDialogData
  ) {
    this.association = data.association;

    this.editForm = this.fb.group({
      terminationDate: [
        this.association.terminationDate ? new Date(this.association.terminationDate) : null,
        Validators.required
      ]
    });
  }

  ngOnInit(): void {}

  onSave(): void {
    if (this.editForm.valid) {
      const request: UpdateAssociationRequest = {
        terminationDate: this.formatDate(this.editForm.value.terminationDate)
      };
      this.dialogRef.close(request);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
