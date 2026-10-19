import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment, { Moment } from 'moment';

import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MaintainDonorInterdictionService } from '../services/maintain-donor-interdiction.service';
import {
  DonorInterdiction,
  TerminationReason,
  TerminateInterdictionRequest
} from '../models/maintain-donor-interdiction.models';
import { TerminateConfirmationDialogComponent } from './terminate-confirmation-dialog.component';

export interface TerminateInterdictionDialogData {
  interdiction: DonorInterdiction;
  donorId: string;
}

@Component({
  selector: 'app-terminate-interdiction-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    NgxMatSelectSearchModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
  ],
  template: `
    <div class="side-panel" role="dialog" aria-modal="true" aria-labelledby="terminate-interdiction-title">
      <!-- Header -->
      <div class="panel-header">
        <h2 id="terminate-interdiction-title">Terminate Interdiction</h2>
        <button mat-icon-button (click)="onCancel()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Body -->
      <div class="panel-body">
        <form [formGroup]="form" class="panel-form">

          <!-- Row 1: Code (20% view-only) + Description (80% view-only) -->
          <div class="form-row">
            <div class="form-col col-20">
              <div class="readonly-field">
                <span class="readonly-label">Code</span>
                <span class="readonly-value">{{ data.interdiction.interCode }}</span>
              </div>
            </div>
            <div class="form-col col-80">
              <div class="readonly-field">
                <span class="readonly-label">Description</span>
                <span class="readonly-value">{{ data.interdiction.interDesc || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Row 2: Type (50% view-only) -->
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">Type</span>
                <span class="readonly-value">{{ data.interdiction.interType }}</span>
              </div>
            </div>
            <div class="form-col col-50"></div>
          </div>

          <!-- Row 3: Reason Code (30% dropdown) + Reason Description (70% view-only) -->
          <div class="form-row">
            <div class="form-col col-30">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Reason <span class="required-mark"></span></mat-label>
                <mat-select formControlName="termReason" (selectionChange)="onReasonChange()">
                  <mat-option>
                    <ngx-mat-select-search
                      [formControl]="reasonSearchCtrl"
                      placeholderLabel="Search reason..."
                      noEntriesFoundLabel="No matching reasons">
                    </ngx-mat-select-search>
                  </mat-option>
                  @for (reason of filteredReasons; track reason.code) {
                    <mat-option [value]="reason.code">{{ reason.code }} - {{ reason.description }}</mat-option>
                  }
                </mat-select>
                @if (form.get('termReason')?.hasError('required') && form.get('termReason')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
            </div>
            <div class="form-col col-70">
              <div class="readonly-field">
                <span class="readonly-label">Description</span>
                <span class="readonly-value">{{ selectedReasonDesc || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- Row 4: Termination Date (50% view-only, auto chapter date) -->
          <div class="form-row">
            <div class="form-col col-50">
              <div class="readonly-field">
                <span class="readonly-label">Termination Date</span>
                <span class="readonly-value">{{ termDateDisplay }}</span>
              </div>
            </div>
            <div class="form-col col-50"></div>
          </div>

          <!-- Row 5: Notes (100%) -->
          <div class="form-row">
            <div class="form-col col-100">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Notes</mat-label>
                <textarea matInput formControlName="notes" rows="3"
                          placeholder="Enter notes" maxlength="240"></textarea>
                <mat-hint align="end">{{ form.get('notes')?.value?.length || 0 }}/240</mat-hint>
              </mat-form-field>
            </div>
          </div>

        </form>
      </div>

      <!-- Footer -->
      <div class="panel-footer">
        <button mat-stroked-button type="button" (click)="onCancel()" class="cancel-button">
          CANCEL
        </button>
        <button mat-raised-button type="button" (click)="onTerminate()"
                [disabled]="form.invalid || submitting"
                class="terminate-button">
          TERMINATE
        </button>
      </div>
    </div>
  `,
  styles: [`
    .side-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #ffffff;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }

      button[mat-icon-button] {
        background: transparent;

        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }

        ::ng-deep .mat-mdc-button-persistent-ripple,
        ::ng-deep .mat-mdc-focus-indicator {
          display: none;
        }
      }
    }

    .panel-body {
      flex: 1 1 0;
      overflow-y: auto;
      padding: 16px 24px;
      min-height: 0;
    }

    .panel-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .form-col {
      display: flex;
      flex-direction: column;
    }

    .col-20 { flex: 0 0 20%; max-width: 20%; }
    .col-30 { flex: 0 0 30%; max-width: 30%; }
    .col-50 { flex: 0 0 calc(50% - 8px); max-width: calc(50% - 8px); }
    .col-70 { flex: 0 0 calc(70% - 16px); max-width: calc(70% - 16px); }
    .col-80 { flex: 0 0 calc(80% - 16px); max-width: calc(80% - 16px); }
    .col-100 { flex: 0 0 100%; max-width: 100%; }

    .full-width { width: 100%; }

    .required-mark {
      color: #f44336;
    }

    .readonly-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;
      min-height: 56px;
      justify-content: center;
    }

    .readonly-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
    }

    .readonly-value {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
      font-weight: 400;
    }

    .panel-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      flex-shrink: 0;
    }

    .cancel-button {
      color: #228189;
      border-color: #228189;
      font-weight: 500;
    }

    .terminate-button {
      background-color: #228189;
      color: #ffffff;
      font-weight: 500;
    }

    .terminate-button:hover { background-color: #1b6b72; }
    .terminate-button:disabled { opacity: 0.5; }
  `]
})
export class TerminateInterdictionDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MaintainDonorInterdictionService);
  private readonly confirmDialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly dialogRef = inject(MatDialogRef<TerminateInterdictionDialogComponent>);
  readonly data = inject<TerminateInterdictionDialogData>(MAT_DIALOG_DATA);
  private readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  terminationReasons: TerminationReason[] = [];
  filteredReasons: TerminationReason[] = [];
  reasonSearchCtrl = new FormControl('');
  submitting = false;
  selectedReasonDesc = '';
  termDateDisplay = '';

  ngOnInit(): void {
    this.initForm();
    this.loadTerminationReasons();
    this.reasonSearchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        this.filteredReasons = this.filterReasonList(search);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    this.termDateDisplay = chapterDate.format('DD-MMM-YYYY').toUpperCase();

    this.form = this.fb.group({
      termReason: ['', [Validators.required]],
      termDate: [chapterDate.format('YYYY-MM-DD')],
      notes: ['', [Validators.maxLength(240)]]
    });
  }

  private loadTerminationReasons(): void {
    this.service.getTerminationReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.terminationReasons = reasons;
          this.filteredReasons = reasons;
        },
        error: () => this.snackbarService.showError('Failed to load termination reasons')
      });
  }

  private filterReasonList(search: string | null): TerminationReason[] {
    if (!search) return this.terminationReasons;
    const term = search.toLowerCase();
    return this.terminationReasons.filter(r =>
      r.code.toLowerCase().includes(term) ||
      (r.description && r.description.toLowerCase().includes(term))
    );
  }

  onReasonChange(): void {
    const code = this.form.get('termReason')?.value;
    const selected = this.terminationReasons.find(r => r.code === code);
    this.selectedReasonDesc = selected?.description || '';
  }

  onTerminate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const confirmRef = this.confirmDialog.open(TerminateConfirmationDialogComponent, {
      width: '450px'
    });

    confirmRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed === true) {
          this.performTerminate();
        }
      });
  }

  private performTerminate(): void {
    this.submitting = true;
    const formValue = this.form.value;

    const request: TerminateInterdictionRequest = {
      donorId: this.data.donorId,
      interCode: this.data.interdiction.interCode,
      unitId: this.data.interdiction.unitId || undefined,
      effDate: this.data.interdiction.effDate,
      termDate: this.serializeDate(formValue.termDate),
      termReason: formValue.termReason,
      notes: formValue.notes || undefined
    };

    this.service.terminateInterdiction(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.dialogRef.close({ success: true });
        },
        error: (err) => {
          this.submitting = false;
          const errorCode = err?.error?.errorCode;
          const message = err?.error?.message || err?.message || 'Failed to terminate interdiction';
          const msg = errorCode ? `${errorCode}: ${message}` : message;
          this.snackbarService.showError(msg);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private serializeDate(date: Moment | string): string {
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    const m = moment(date);
    return m.isValid() ? m.format('YYYY-MM-DD') : String(date);
  }
}
