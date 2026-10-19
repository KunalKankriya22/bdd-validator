import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, concat } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldComponent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
} from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { HttpErrorHandler } from '@shared/utils/error-handler.utils';

import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

import { PlaceNotesOnMultipleUnitsApiService } from './services/place-notes-on-multiple-units-api.service';
import { UnitListItem, NoteEntry, UnitNoteDto } from './models/place-notes-on-multiple-units.model';

@Component({
  selector: 'app-place-notes-on-multiple-units',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    UnitIdFieldComponent,
    DataTable,
  ],
  providers: [DatePipe],
  templateUrl: './place-notes-on-multiple-units.html',
  styleUrl: './place-notes-on-multiple-units.scss',
})
export class PlaceNotesOnMultipleUnitsComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(PlaceNotesOnMultipleUnitsApiService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly datePipe = inject(DatePipe);
  private readonly chapterTimezoneService = inject(ChapterTimezoneService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(UnitIdFieldComponent) private unitIdField!: UnitIdFieldComponent;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  readonly isLoading = signal(false);
  readonly isLoadingNotes = signal(false);
  readonly isSubmitting = signal(false);

  readonly unitList = signal<UnitListItem[]>([]);
  readonly selectedUnit = signal<UnitListItem | null>(null);

  readonly existingNotes = signal<NoteEntry[]>([]);
  readonly pendingNewNotes = signal<NoteEntry[]>([]);
  readonly notes = computed(() => [...this.existingNotes(), ...this.pendingNewNotes()]);
  readonly currentNoteIndex = signal(0);

  readonly canAddNotes = signal(false);
  readonly accessChecked = signal(false);
  readonly currentUserName = signal('');
  readonly currentTimestamp = signal('');

  readonly noteTextControl = new FormControl('', [Validators.maxLength(1500)]);
  private readonly noteTextValue = signal('');

  readonly currentNote = computed(() => {
    const notesList = this.notes();
    const idx = this.currentNoteIndex();
    return notesList.length > 0 && idx < notesList.length ? notesList[idx] : null;
  });

  readonly canGoPrevious = computed(() => this.currentNoteIndex() > 0);
  readonly canGoNext = computed(() => {
    const idx = this.currentNoteIndex();
    const notesList = this.notes();
    return idx < notesList.length - 1;
  });

  readonly canSubmit = computed(() => {
    return this.canAddNotes()
      && this.unitList().length > 0
      && this.hasNewNoteContent()
      && !this.isSubmitting();
  });

  readonly isNoteEditable = computed(() => {
    const note = this.currentNote();
    return !!note?.isEditable && this.canAddNotes();
  });

  readonly unitTableConfig: DataTableConfig<UnitListItem> = {
    columns: [
      { key: 'unitId', header: 'Unit ID', sortable: false },
      {
        key: 'collDate',
        header: 'Collection Date',
        sortable: false,
        valueFormatter: (value: string | null) => this.formatCollDate(value),
      },
    ],
    rowActions: [
      {
        icon: 'delete',
        label: 'Delete',
        ariaLabel: 'Delete unit',
        action: 'delete',
      },
    ],
    enableRowHighlight: true,
  };

  ngOnInit(): void {
    this.checkAccess();

    this.noteTextControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.noteTextValue.set(value || ''));

    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.resetAll());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUnitValidated(event: UnitValidationResponse): void {
    const unitId = event.parsedUnitId;
    if (!unitId) return;

    if (this.unitList().some(u => u.unitId === unitId)) {
      this.snackbarService.showError('Duplicate unit — this unit is already in the list.');
      return;
    }

    this.isLoading.set(true);
    this.apiService.validateUnit(unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success && response.data?.length) {
            const unit = response.data[0];
            const newItem: UnitListItem = {
              unitId: unit.unitId,
              collDate: unit.collDate,
              noteId: unit.noteId ?? null,
              hasExistingNotes: unit.hasExistingNotes,
            };
            this.unitList.update(list => [...list, newItem]);
            this.unitIdField?.clear();

            // Auto-select if first unit or no unit selected
            if (!this.selectedUnit()) {
              this.onUnitRowClick(newItem);
            }
          } else {
            this.snackbarService.showError(response.message || 'Unit validation failed.');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while validating the unit.'),
          );
        },
      });
  }

  onUnitCleared(): void {
    // No action needed
  }

  onUnitRowClick(unit: UnitListItem): void {
    this.saveCurrentNoteText();
    this.selectedUnit.set(unit);
    this.loadNotesForUnit(unit);
  }

  onDeleteUnit(event: TableRowActionEvent<UnitListItem>): void {
    if (event.action !== 'delete') return;

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '460px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        title: 'Delete Unit/Batch',
        message:
          'Are you sure you want to delete the unit/batch?\nThis action will proceed with deleting all the selected record.',
        confirmText: 'YES, DELETE',
        cancelText: 'NO, CANCEL',
      } as ConfirmActionDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed === true) {
          const deletedUnitId = event.row.unitId;
          this.unitList.update(list => list.filter(u => u.unitId !== deletedUnitId));

          if (this.selectedUnit()?.unitId === deletedUnitId) {
            const remaining = this.unitList();
            if (remaining.length > 0) {
              this.onUnitRowClick(remaining[0]);
            } else {
              this.selectedUnit.set(null);
              this.existingNotes.set([]);
              this.pendingNewNotes.set([]);
              this.noteTextControl.setValue('');
            }
          }
        }
      });
  }

  onPreviousNote(): void {
    this.saveCurrentNoteText();
    if (this.currentNoteIndex() > 0) {
      this.currentNoteIndex.update(i => i - 1);
      this.loadCurrentNoteToControl();
    }
  }

  onNextNote(): void {
    this.saveCurrentNoteText();
    if (this.currentNoteIndex() < this.notes().length - 1) {
      this.currentNoteIndex.update(i => i + 1);
      this.loadCurrentNoteToControl();
    }
  }

  onAddAnotherNote(): void {
    this.saveCurrentNoteText();

    const maxSeq = this.notes().reduce((max, n) => Math.max(max, n.noteSeq), 0);
    const newNote: NoteEntry = {
      noteSeq: maxSeq + 1,
      noteText: '',
      author: this.currentUserName() || 'Unknown',
      timestamp: this.getChapterTimestamp(),
      isEditable: true,
    };

    this.pendingNewNotes.update(list => [...list, newNote]);
    this.currentNoteIndex.set(this.notes().length - 1);
    this.noteTextControl.setValue('');
  }

  onSubmit(): void {
    this.saveCurrentNoteText();

    const units = this.unitList();
    const newNotes = this.pendingNewNotes().filter(n => n.noteText.trim().length > 0);

    if (units.length === 0) {
      this.snackbarService.showError('Please add at least one unit before submitting.');
      return;
    }

    if (newNotes.length === 0) {
      this.snackbarService.showError('Please enter at least one note before submitting.');
      return;
    }

    this.isSubmitting.set(true);
    const unitIds = units.map(u => u.unitId);

    const requests$ = newNotes.map(n =>
      this.apiService.createNotes({ unitIds, note: n.noteText, notesTable: 'UNITS' }),
    );

    concat(...requests$)
      .pipe(toArray(), takeUntil(this.destroy$))
      .subscribe({
        next: (responses) => {
          this.isSubmitting.set(false);
          const failed = responses.find(r => !r.success);
          if (failed) {
            this.snackbarService.showError(failed.message || 'Failed to save notes.');
          } else {
            this.snackbarService.showSuccess('Notes saved successfully.');
            this.resetAll();
          }
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.snackbarService.showError(
            HttpErrorHandler.extractErrorMessage(error, 'An error occurred while saving notes.'),
          );
        },
      });
  }

  private loadNotesForUnit(unit: UnitListItem): void {
    this.refreshCurrentUserName();
    this.isLoadingNotes.set(true);
    this.existingNotes.set([]);
    this.currentNoteIndex.set(0);
    this.noteTextControl.setValue('');

    this.apiService.getNotesByUnit(unit.unitId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingNotes.set(false);
          const existing: NoteEntry[] = (response.data || []).map((dto: UnitNoteDto) => ({
            noteSeq: dto.noteSeq,
            noteText: dto.note,
            author: dto.insertUserName || dto.insertUser,
            timestamp: this.formatApiDate(dto.insertDate),
            isEditable: false,
          }));

          this.existingNotes.set(existing);

          if (this.canAddNotes() && this.pendingNewNotes().length === 0) {
            const maxSeq = existing.reduce((max, n) => Math.max(max, n.noteSeq), 0);
            this.pendingNewNotes.set([{
              noteSeq: maxSeq + 1,
              noteText: '',
              author: this.currentUserName() || '',
              timestamp: this.getChapterTimestamp(),
              isEditable: true,
            }]);
          } else if (this.pendingNewNotes().length > 0) {
            const maxSeq = existing.reduce((max, n) => Math.max(max, n.noteSeq), 0);
            this.pendingNewNotes.update(list =>
              list.map((n, i) => ({ ...n, noteSeq: maxSeq + i + 1 })),
            );
          }

          const allNotes = this.notes();
          if (allNotes.length > 0) {
            this.currentNoteIndex.set(0);
            this.noteTextControl.setValue(allNotes[0].noteText);
          } else {
            this.currentNoteIndex.set(0);
            this.noteTextControl.setValue('');
          }
        },
        error: () => {
          this.isLoadingNotes.set(false);
          this.existingNotes.set([]);
          if (this.canAddNotes() && this.pendingNewNotes().length === 0) {
            this.pendingNewNotes.set([{
              noteSeq: 1,
              noteText: '',
              author: this.currentUserName() || '',
              timestamp: this.getChapterTimestamp(),
              isEditable: true,
            }]);
          }
          this.currentNoteIndex.set(0);
          this.noteTextControl.setValue(this.pendingNewNotes()[0]?.noteText || '');
        },
      });
  }

  private checkAccess(): void {
    this.apiService.checkAccess()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.accessChecked.set(true);
          this.canAddNotes.set(response.hasAccess);
          const displayName = this.getDisplayName() || this.headerService.getCurrentUsername() || response.userId || '';
          this.currentUserName.set(displayName);
          this.currentTimestamp.set(this.getChapterTimestamp());
        },
        error: () => {
          this.accessChecked.set(true);
          this.canAddNotes.set(false);
        },
      });
  }

  private refreshCurrentUserName(): void {
    if (!this.currentUserName()) {
      const name = this.getDisplayName() || this.headerService.getCurrentUsername() || '';
      if (name) {
        this.currentUserName.set(name);
      }
    }
  }

  private getDisplayName(): string {
    const user = this.headerService.headerConfig()?.user;
    if (!user?.name) return '';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      return `${lastName}, ${firstName}`;
    }
    return user.name;
  }

  private resetAll(): void {
    this.unitList.set([]);
    this.selectedUnit.set(null);
    this.existingNotes.set([]);
    this.pendingNewNotes.set([]);
    this.currentNoteIndex.set(0);
    this.noteTextControl.setValue('');
    this.checkAccess();
  }

  private saveCurrentNoteText(): void {
    const idx = this.currentNoteIndex();
    const allNotes = this.notes();
    const note = allNotes[idx];
    if (!note?.isEditable) return;

    const text = this.noteTextControl.value || '';
    const pendingIdx = idx - this.existingNotes().length;
    if (pendingIdx >= 0) {
      this.pendingNewNotes.update(list =>
        list.map((n, i) => (i === pendingIdx ? { ...n, noteText: text } : n)),
      );
    }
  }

  private loadCurrentNoteToControl(): void {
    const note = this.currentNote();
    this.noteTextControl.setValue(note?.noteText || '');
  }

  private hasNewNoteContent(): boolean {
    const currentText = this.noteTextValue().trim();
    const currentNote = this.currentNote();
    if (currentNote?.isEditable && currentText) return true;
    return this.pendingNewNotes().some(n => n.noteText.trim().length > 0);
  }

  private formatCollDate(value: string | null): string {
    if (!value) return '-';
    try {
      return this.datePipe.transform(value, 'dd-MMM-yyyy', undefined, 'en-US')?.toUpperCase() || '-';
    } catch {
      return value;
    }
  }

  private formatApiDate(isoDate: string): string {
    if (!isoDate) return '';
    try {
      return this.datePipe.transform(isoDate, 'dd-MMM-yyyy  HH:mm', undefined, 'en-US')?.toUpperCase() || '';
    } catch {
      return isoDate;
    }
  }

  private getChapterTimestamp(): string {
    const chapterDate = this.chapterTimezoneService.getChapterLocalDate();
    return chapterDate.format('DD-MMM-YYYY  HH:mm').toUpperCase();
  }
}
