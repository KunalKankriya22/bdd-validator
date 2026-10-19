import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { NotesManagerComponent } from '@shared/components/notes-manager/notes-manager';
import { NoteActionEvent, NotesConfig } from '@shared/components/notes-manager/notes-manager.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { API } from '@core/constants/api.constants';
import { UnitQueryPanelRecord, UnitNote } from '../unit-query.model';
import { UnitQueryService } from '../unit-query.service';

@Component({
  selector: 'app-unit-notes-panel',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, SidePanelBase, NotesManagerComponent],
  providers: [DatePipe],
  template: `
    <app-side-panel-base title="Unit Notes" width="900px" [showFooter]="false" (closePanel)="closePanel.emit()">
      <div panelContent>
        @if (loading) {
          <div class="panel-loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (error) {
          <p class="panel-error">{{ error }}</p>
        } @else {
          <app-notes-manager
            [notes]="notes"
            [readonly]="false"
            [loading]="saving"
            [config]="notesConfig"
            (noteAction)="onNoteAction($event)">
          </app-notes-manager>
          @if (!saving && notes.length === 0) { <p class="panel-empty">No notes found.</p> }
        }
      </div>
    </app-side-panel-base>
  `,
  styles: [`
    .panel-loading { display: flex; justify-content: center; padding: 40px; }
    .panel-error { color: #d32f2f; padding: 16px; }
    .panel-empty { color: #666; padding: 16px; text-align: center; }
  `],
})
export class UnitNotesPanelComponent implements OnInit, OnDestroy {
  @Input() record!: UnitQueryPanelRecord;
  @Output() closePanel = new EventEmitter<void>();

  private readonly service = inject(UnitQueryService);
  private readonly http = inject(HttpClient);
  private readonly datePipe = inject(DatePipe);
  private readonly snackbar = inject(SnackbarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  saving = false;
  error = '';
  notes: any[] = [];

  readonly notesConfig: NotesConfig = {
    allowEdit: false,
    allowDelete: true,
    maxLength: 240,
    placeholder: 'Add a note...',
  };

  ngOnInit(): void {
    this.loadNotes();
  }

  onNoteAction(event: NoteActionEvent): void {
    switch (event.action) {
      case 'add':
        this.addNote(event.note.text);
        break;
      case 'delete':
        this.deleteNote(event.note);
        break;
    }
  }

  private loadNotes(): void {
    const collDateStr = this.datePipe.transform(this.record.collDate, 'yyyy-MM-dd') ?? this.record.collDate;
    this.service.getUnitNotes(this.record.unitId, collDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: UnitNote[]) => {
          this.notes = results.map((n) => ({
            id: n.auditKey ?? 0,
            text: n.note ?? '',
            userName: n.insertUserName ?? n.insertUser ?? '',
            timestamp: n.insertDate ?? '',
            metadata: { noteId: n.noteId, noteSeq: n.noteSeq },
          }));
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error?.Message || 'Failed to load notes.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private addNote(text: string): void {
    if (!text?.trim()) return;
    this.saving = true;
    this.cdr.markForCheck();

    const body = {
      unitIds: [this.record.unitId],
      notes: [text.trim()],
      notesTable: 'UNITS',
    };

    this.http.post<any>(API.PLACE_UNIT_NOTES.CREATE_NOTES, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.snackbar.showSuccess('Note added successfully.');
          this.loadNotes();
        },
        error: (err: any) => {
          this.saving = false;
          this.cdr.markForCheck();
          this.snackbar.showError(err?.error?.message || err?.error?.Message || 'Failed to add note.');
        },
      });
  }

  private deleteNote(note: any): void {
    const noteId = note.metadata?.noteId;
    const noteSeq = note.metadata?.noteSeq;
    if (noteId == null || noteSeq == null) return;

    this.saving = true;
    this.cdr.markForCheck();

    this.http.delete<any>(API.PLACE_UNIT_NOTES.DELETE_NOTE(noteId, noteSeq))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.snackbar.showSuccess('Note deleted successfully.');
          this.loadNotes();
        },
        error: (err: any) => {
          this.saving = false;
          this.cdr.markForCheck();
          this.snackbar.showError(err?.error?.message || err?.error?.Message || 'Failed to delete note.');
        },
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
