import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { NotesManagerComponent } from '@shared/components/notes-manager/notes-manager';
import { UnitNote } from '../unit-query.model';
import { UnitQueryService } from '../unit-query.service';

export interface ComponentNotesPanelRecord {
  unitId: string;
  collDate: string;
  chapterId: string;
  productCode: string | null;
}

@Component({
  selector: 'app-component-notes-panel',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, SidePanelBase, NotesManagerComponent],
  providers: [DatePipe],
  template: `
    <app-side-panel-base title="Component Notes" width="900px" [showFooter]="false" (closePanel)="closePanel.emit()">
      <div panelContent>
        @if (loading) {
          <div class="panel-loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (error) {
          <p class="panel-error">{{ error }}</p>
        } @else {
          <app-notes-manager [notes]="notes" [readonly]="true" [loading]="loading"></app-notes-manager>
          @if (notes.length === 0) { <p class="panel-empty">No component notes found.</p> }
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
export class ComponentNotesPanelComponent implements OnInit, OnDestroy {
  @Input() record!: ComponentNotesPanelRecord;
  @Output() closePanel = new EventEmitter<void>();

  private readonly service = inject(UnitQueryService);
  private readonly datePipe = inject(DatePipe);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  error = '';
  notes: any[] = [];

  ngOnInit(): void {
    if (!this.record.productCode) {
      this.error = 'No component selected.';
      this.loading = false;
      return;
    }

    const collDateStr = this.datePipe.transform(this.record.collDate, 'yyyy-MM-dd') ?? this.record.collDate;
    this.service.getComponentNotes(this.record.unitId, collDateStr, this.record.productCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: UnitNote[]) => {
          this.notes = results.map((n) => ({
            id: n.auditKey ?? 0,
            text: n.note ?? '',
            userName: n.insertUserName ?? n.insertUser ?? '',
            timestamp: n.insertDate ?? '',
          }));
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error?.Message || 'Failed to load component notes.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
