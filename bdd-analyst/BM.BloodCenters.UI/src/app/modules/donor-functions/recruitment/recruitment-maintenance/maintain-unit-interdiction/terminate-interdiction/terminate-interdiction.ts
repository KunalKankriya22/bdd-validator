import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, finalize } from 'rxjs';
import moment from 'moment';

import { UnitInterdiction, TerminationReason } from '../models/unit-interdiction.model';
import { UnitInterdictionService } from '../services/unit-interdiction.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

export interface TerminateInterdictionDialogData {
  interdiction: UnitInterdiction;
  terminationReasons: TerminationReason[];
}

@Component({
  selector: 'app-terminate-interdiction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './terminate-interdiction.html',
  styleUrls: ['./terminate-interdiction.scss']
})
export class TerminateInterdictionComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private service = inject(UnitInterdictionService);
  private chapterTimezoneService = inject(ChapterTimezoneService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<TerminateInterdictionComponent>);
  readonly data = inject<TerminateInterdictionDialogData>(MAT_DIALOG_DATA);
  private destroy$ = new Subject<void>();

  terminateForm!: FormGroup;
  terminationReasons: TerminationReason[] = [];
  filteredTerminationReasons: TerminationReason[] = [];
  reasonSearchControl = new FormControl('');
  selectedReasonDescription = '';
  terminationDate!: Date;
  isSaving = false;

  ngOnInit(): void {
    this.terminationDate = this.chapterTimezoneService.getChapterLocalDate().toDate();
    this.initializeForm();

    // Use preloaded termination reasons from dialog data
    this.terminationReasons = this.data.terminationReasons || [];
    this.filteredTerminationReasons = this.terminationReasons;

    this.setupReasonSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.terminateForm = this.fb.group({
      reason: ['', [Validators.required, Validators.maxLength(5)]],
      comments: ['', Validators.maxLength(240)]
    });

    this.terminateForm.get('reason')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(reason => {
        this.onReasonChange(reason);
      });
  }

  private setupReasonSearch(): void {
    this.reasonSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterReasons();
      });
  }

  private filterReasons(): void {
    const searchTerm = (this.reasonSearchControl.value || '').toLowerCase().trim();
    if (!searchTerm) {
      this.filteredTerminationReasons = this.terminationReasons;
    } else {
      this.filteredTerminationReasons = this.terminationReasons.filter(reason =>
        reason.code.toLowerCase().includes(searchTerm) ||
        reason.description.toLowerCase().includes(searchTerm)
      );
    }
  }

  private onReasonChange(reasonCode: string): void {
    const selected = this.terminationReasons.find(r => r.code === reasonCode);
    this.selectedReasonDescription = selected ? selected.description : '';
  }

  private focusFirstInvalidField(): void {
    const firstInvalidControl = Object.keys(this.terminateForm.controls)
      .find(key => this.terminateForm.controls[key].invalid);
    if (firstInvalidControl) {
      const el = document.querySelector(`[formControlName="${firstInvalidControl}"]`) as HTMLElement;
      if (el) el.focus();
    }
  }

  onTerminate(): void {
    this.terminateForm.markAllAsTouched();

    if (this.terminateForm.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    const formValue = this.terminateForm.value;
    this.isSaving = true;

    const requestData = {
      transactionId: this.data.interdiction.transactionId,
      interCode: this.data.interdiction.code,
      interType: this.data.interdiction.type,
      insertDate: this.data.interdiction.effectiveDate
        ? moment(this.data.interdiction.effectiveDate).format('YYYY-MM-DD')
        : '',
      terminationDate: this.formatDateForApi(this.terminationDate),
      reasonCode: formValue.reason,
      comments: formValue.comments || undefined
    };

    this.service.terminateInterdiction(requestData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Interdiction terminated successfully', 'DISMISS', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close({ success: true });
        },
        error: (error) => {
          // Handle errors (including any error codes from API)
          // HTTP errors wrap the response in error.error
          const errorBody = error?.error || error;
          let errorMessage = errorBody?.message || errorBody?.error || error?.message || 'Failed to terminate interdiction';

          // Append error code to message if it exists
          const errorCode = errorBody?.errorCode || error?.errorCode;
          if (errorCode) {
            errorMessage = `Error ${errorCode}: ${errorMessage}`;
          }

          this.snackBar.open(errorMessage, 'DISMISS', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['termination-error-snackbar']
          });
        }
      });
  }

  formatDisplayDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
