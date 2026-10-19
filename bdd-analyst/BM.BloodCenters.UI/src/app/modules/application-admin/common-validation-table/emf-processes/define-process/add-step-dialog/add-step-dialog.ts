import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

export interface AddStepDialogData {
  steps: Array<{ id: string; name: string }>;
  existingStepNames?: string[];
  processCode?: string;
}

@Component({
  selector: 'app-add-step-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-step-dialog.html',
  styleUrls: ['./add-step-dialog.scss']
})
export class AddStepDialog implements OnInit, OnDestroy {
  selectedStep: string = '';
  duplicateError: string = '';
  searchControl = new FormControl('');
  filteredSteps: Array<{ id: string; name: string }> = [];
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddStepDialogData,
    private dialogRef: MatDialogRef<AddStepDialog>
  ) {}

  ngOnInit(): void {
    this.filteredSteps = [...this.data.steps];
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(search => {
        const term = (search || '').toLowerCase();
        this.filteredSteps = this.data.steps.filter(s =>
          s.name.toLowerCase().includes(term)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAddDisabled(): boolean {
    return !this.selectedStep || !!this.duplicateError;
  }

  onSelectionChange(): void {
    this.duplicateError = '';
    if (!this.selectedStep) return;

    const selectedStepData = this.data.steps.find(s => s.id === this.selectedStep);
    if (!selectedStepData) return;

    const existingNames = this.data.existingStepNames || [];
    const isDuplicate = existingNames.some(
      name => name.toLowerCase() === selectedStepData.name.toLowerCase()
    );

    if (isDuplicate) {
      const processName = this.data.processCode || selectedStepData.name;
      this.duplicateError =
        `The selected value already exists as a process step for the ${processName} process. Modify the value to continue.`;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    if (this.selectedStep && !this.duplicateError) {
      const selectedStepData = this.data.steps.find(s => s.id === this.selectedStep);
      this.dialogRef.close(selectedStepData);
    }
  }
}
