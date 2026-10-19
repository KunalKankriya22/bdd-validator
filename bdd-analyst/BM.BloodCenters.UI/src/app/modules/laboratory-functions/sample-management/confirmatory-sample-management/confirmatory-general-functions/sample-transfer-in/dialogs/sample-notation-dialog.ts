import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Subject, takeUntil, catchError, of, forkJoin } from 'rxjs';
import moment from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { SampleTransferInApiService } from '../services/sample-transfer-in-api.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import type { SampleNotationItem } from '../models/sample-transfer-in.model';

export interface SampleNotationDialogData {
  unitId: string;
  transferMode: string;
}

interface EditedDate {
  effDate?: string;
  termDate?: string | null;
}

@Component({
  selector: 'app-sample-notation-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTableModule,
    MatDatepickerModule,
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
    { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
  ],
  templateUrl: './sample-notation-dialog.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .notation-dialog {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #ffffff;
      animation: slideInFromRight 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    @keyframes slideInFromRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
        padding: 0;
      }
    }

    mat-dialog-content {
      flex: 1;
      padding: 24px;
      overflow-y: hidden;
      max-height: none !important;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .form-row {
      margin-bottom: 8px;
      flex-shrink: 0;
    }

    .table-wrapper {
      max-height: 35vh;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .unit-id-field {
      width: 300px;
    }

    .form-field-full {
      width: 100%;
    }

    .description-row {
      margin-top: 16px;
      flex-shrink: 0;
    }

    .notation-table {
      width: 100%;
    }

    .notation-table th {
      font-weight: 600;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.87);
      background: #f5f5f5;
      padding: 8px 12px;
    }

    .notation-table td {
      font-size: 13px;
      padding: 4px 12px;
      vertical-align: middle;
    }

    .notation-table tr.selected-row {
      background: #e3f2fd;
    }

    .notation-table tr:hover {
      background: #f0f0f0;
      cursor: pointer;
    }

    .notation-table tr.selected-row:hover {
      background: #bbdefb;
    }

    .inline-date-field {
      width: 150px;
      font-size: 12px;
    }

    .inline-date-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .inline-date-field ::ng-deep .mat-mdc-text-field-wrapper {
      padding: 0 4px;
      background-color: transparent;
    }

    .inline-date-field ::ng-deep .mat-mdc-form-field-infix {
      padding: 4px 0;
      min-height: 28px;
    }

    .inline-date-field ::ng-deep input {
      font-size: 12px;
    }

    .inline-date-field ::ng-deep .mat-datepicker-toggle button {
      width: 24px;
      height: 24px;
      padding: 0;
    }

    .inline-date-field ::ng-deep .mat-datepicker-toggle .mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .table-loading, .table-empty {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 32px;
      color: rgba(0, 0, 0, 0.54);
      font-size: 13px;
    }

    .access-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      flex-shrink: 0;
      background: #fff8e1;
      border: 1px solid #ffecb3;
      border-radius: 4px;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.87);

      .access-icon {
        color: #ff9800;
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      span { flex: 1; }

      .dismiss-btn {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        line-height: 24px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    mat-dialog-actions {
      padding: 8px 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      min-height: unset;
      flex-shrink: 0;
    }

    .dialog-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      justify-content: flex-end;
    }

    .show-term-btn {
      margin-right: auto;
      color: #228189 !important;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.4px;
    }

    .cancel-btn, .delete-btn, .save-btn {
      min-width: 90px;
      border: 1.5px solid #228189 !important;
      color: #228189 !important;
      font-weight: 500;
      letter-spacing: 0.4px;
    }

    .save-btn:disabled, .delete-btn:disabled {
      opacity: 0.5;
    }

    ::ng-deep .notation-dialog {
      .mat-mdc-form-field-subscript-wrapper { height: 0; }
      .mat-mdc-text-field-wrapper { background-color: #ffffff; }
      .mat-mdc-form-field { width: 100%; }
    }
  `],
})
export class SampleNotationDialogComponent implements OnInit, OnDestroy {
  readonly data = inject<SampleNotationDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SampleNotationDialogComponent>);
  private readonly api = inject(SampleTransferInApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  notations = signal<SampleNotationItem[]>([]);
  selectedIndex = signal<number | null>(null);
  isLoading = signal(false);
  descriptionCtrl = new FormControl<string>('');
  accessMessage = signal('');
  showTerminated = signal(false);
  canAdd = signal(true);
  canDelete = signal(true);

  editedRows = signal<Map<number, EditedDate>>(new Map());

  displayedColumns = ['notationCode', 'notationType', 'shortDesc', 'testId', 'effDate', 'termDate'];

  showTermLabel = computed(() => this.showTerminated() ? 'HIDE TERM' : 'SHOW TERM');
  isDirty = computed(() => this.editedRows().size > 0);

  ngOnInit(): void {
    this.loadNotations();
    this.loadAccessControl();
  }

  private loadAccessControl(): void {
    this.api.getNotationAccess().pipe(
      takeUntil(this.destroy$),
      catchError(() => of({ canAdd: true, canDelete: true, message: '' })),
    ).subscribe(result => {
      this.canAdd.set(result.canAdd);
      this.canDelete.set(result.canDelete);
      if (result.message) {
        this.accessMessage.set(result.message);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotations(): void {
    this.isLoading.set(true);
    this.selectedIndex.set(null);
    this.editedRows.set(new Map());
    this.descriptionCtrl.setValue('');
    const showTerm = this.showTerminated() ? 'Y' : 'N';
    this.api.getNotations(this.data.unitId, showTerm).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.snackBar.open(err?.error?.message || 'Failed to load notations.', 'Close',
          { duration: 5000, panelClass: ['error-snackbar'], verticalPosition: 'top', horizontalPosition: 'right' });
        return of([]);
      }),
    ).subscribe(items => {
      this.notations.set(items);
      this.isLoading.set(false);
    });
  }

  selectNotation(row: SampleNotationItem, index: number): void {
    this.selectedIndex.set(index);
    this.descriptionCtrl.setValue(row.notationDesc || row.shortDesc || '');
  }

  getDateValue(dateStr: string | null | undefined): moment.Moment | null {
    if (!dateStr) return null;
    const m = moment(dateStr);
    return m.isValid() ? m : null;
  }

  onDateChange(rowIndex: number, field: 'effDate' | 'termDate', event: any): void {
    const dateValue = event.value;
    const serialized = dateValue ? DateFieldValidationUtility.serializeDateForApi(dateValue) : null;

    if (field === 'effDate' && !serialized) return;

    const current = new Map(this.editedRows());
    const existing = current.get(rowIndex) || {};

    if (field === 'effDate') {
      existing.effDate = serialized!;
    } else {
      existing.termDate = serialized;
    }

    const row = this.notations()[rowIndex];
    const origEff = this.serializeOriginalDate(row.effDate);
    const origTerm = this.serializeOriginalDate(row.termDate);
    const newEff = existing.effDate ?? origEff;
    const newTerm = existing.termDate !== undefined ? existing.termDate : origTerm;

    if (newEff === origEff && newTerm === origTerm) {
      current.delete(rowIndex);
    } else {
      current.set(rowIndex, existing);
    }

    this.editedRows.set(current);
  }

  private serializeOriginalDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const m = moment(dateStr);
    return m.isValid() ? m.format('YYYY-MM-DD') : null;
  }

  dismissAccessMessage(): void {
    this.accessMessage.set('');
  }

  onShowTerm(): void {
    if (this.isDirty()) {
      this.snackBar.open('Error 2156: Please save or clear changes before proceeding.', 'Close',
        { duration: 5000, panelClass: ['error-snackbar'], verticalPosition: 'top', horizontalPosition: 'right' });
      return;
    }
    this.showTerminated.update(v => !v);
    this.loadNotations();
  }

  onDelete(): void {
    const idx = this.selectedIndex();
    if (idx === null) {
      this.snackBar.open('Please select a notation to delete.', 'Close',
        { duration: 3000, panelClass: ['warning-snackbar'], verticalPosition: 'top', horizontalPosition: 'right' });
      return;
    }

    const notation = this.notations()[idx];
    this.isLoading.set(true);
    this.api.deleteNotation(notation.notationCode, this.data.unitId).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.isLoading.set(false);
        this.snackBar.open(err?.error?.message || 'Failed to delete notation.', 'Close',
          { duration: 5000, panelClass: ['error-snackbar'], verticalPosition: 'top', horizontalPosition: 'right' });
        return of(null);
      }),
    ).subscribe(res => {
      this.isLoading.set(false);
      if (!res) return;
      this.snackBar.open('Notation deleted successfully.', 'DISMISS',
        { duration: 3000, panelClass: ['success-snackbar'], verticalPosition: 'top', horizontalPosition: 'right' });
      this.loadNotations();
    });
  }

  onSave(): void {
    const edited = this.editedRows();
    if (edited.size === 0) return;

    const notationList = this.notations();

    const codeCounts = new Map<string, number>();
    for (const n of notationList) {
      codeCounts.set(n.notationCode, (codeCounts.get(n.notationCode) || 0) + 1);
    }
    const duplicates = Array.from(codeCounts.entries()).filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      this.snackBar.open(
        `Error 5238: Duplicate notation code(s) found: ${duplicates.map(([code]) => code).join(', ')}.`,
        'Close',
        { duration: 5000, panelClass: ['error-snackbar'], verticalPosition: 'top', horizontalPosition: 'right' },
      );
      return;
    }

    const dateError = this.validateNotationDates(edited, notationList);
    if (dateError) {
      this.snackBar.open(dateError, 'Close',
        { duration: 5000, panelClass: ['error-snackbar'], verticalPosition: 'top', horizontalPosition: 'right' });
      return;
    }

    const updates$ = Array.from(edited.entries()).map(([idx, changes]) => {
      const row = notationList[idx];
      const origEff = this.serializeOriginalDate(row.effDate);
      const origTerm = this.serializeOriginalDate(row.termDate);

      return this.api.updateNotation({
        notationCode: row.notationCode,
        unitId: this.data.unitId,
        effDate: changes.effDate ?? origEff ?? moment().format('YYYY-MM-DD'),
        termDate: changes.termDate !== undefined ? changes.termDate : origTerm,
      });
    });

    this.isLoading.set(true);
    forkJoin(updates$).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.isLoading.set(false);
        this.snackBar.open(err?.error?.message || 'Failed to save notation changes.', 'Close',
          { duration: 5000, panelClass: ['error-snackbar'], verticalPosition: 'top', horizontalPosition: 'right' });
        return of(null);
      }),
    ).subscribe(res => {
      this.isLoading.set(false);
      if (!res) return;
      this.snackBar.open('Notation updated successfully.', 'DISMISS',
        { duration: 3000, panelClass: ['success-snackbar'], verticalPosition: 'top', horizontalPosition: 'right' });
      this.loadNotations();
    });
  }

  private validateNotationDates(edited: Map<number, EditedDate>, notationList: SampleNotationItem[]): string | null {
    const chapterToday = moment(this.chapterTimezoneService.getChapterLocalDate());

    for (const [idx, changes] of edited.entries()) {
      const row = notationList[idx];
      const origEff = this.serializeOriginalDate(row.effDate);
      const origTerm = this.serializeOriginalDate(row.termDate);
      const effDateStr = changes.effDate ?? origEff;
      const termDateStr = changes.termDate !== undefined ? changes.termDate : origTerm;

      if (!effDateStr) {
        return `Error 5002: Effective date is required for notation ${row.notationCode}.`;
      }

      const effDate = moment(effDateStr);
      if (effDate.isBefore(chapterToday, 'day')) {
        return `Error 5003: Effective date for notation ${row.notationCode} cannot be before today.`;
      }

      if (termDateStr) {
        const termDate = moment(termDateStr);
        if (termDate.isBefore(effDate, 'day')) {
          return `Error 5004: Termination date cannot be before effective date for notation ${row.notationCode}.`;
        }
        if (termDate.isBefore(chapterToday, 'day')) {
          return `Error 3115: Termination date for notation ${row.notationCode} cannot be before today.`;
        }
      }
    }
    return null;
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
