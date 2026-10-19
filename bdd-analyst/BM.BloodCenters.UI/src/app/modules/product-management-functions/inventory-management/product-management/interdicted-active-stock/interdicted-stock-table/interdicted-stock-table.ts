import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataTable } from '@shared/components/data-table/data-table';
import {
  DataTableConfig,
  TablePageEvent,
  TableSortEvent,
  TableRowActionEvent
} from '@shared/interfaces/data-table.interface';

/**
 * Thin wrapper around DataTable for the Interdicted Active Stock screen.
 * Suppresses the DataTable's hover background via inline !important styles
 * (inline !important always wins over stylesheet !important regardless of specificity).
 * Only the selected row keeps its highlight.
 */
@Component({
  selector: 'app-interdicted-stock-table',
  standalone: true,
  imports: [CommonModule, DataTable],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
    }
  `],
  template: `
    <app-data-table
      [config]="config"
      [data]="data"
      [loading]="loading"
      [highlightedRow]="highlightedRow"
      (pageChange)="pageChange.emit($event)"
      (sortChange)="sortChange.emit($event)"
      (rowClick)="rowClick.emit($event)"
      (rowAction)="rowAction.emit($event)">
    </app-data-table>
  `
})
export class InterdictedStockTable implements AfterViewInit, OnChanges, OnDestroy {
  @Input() config!: DataTableConfig<any>;
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() highlightedRow: any = null;
  @Input() focusedRow: any = null;

  @Output() pageChange = new EventEmitter<TablePageEvent>();
  @Output() sortChange = new EventEmitter<TableSortEvent>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() rowAction = new EventEmitter<TableRowActionEvent<any>>();

  private unlistenMouseover: (() => void) | null = null;
  private unlistenClick: (() => void) | null = null;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['highlightedRow'] || changes['focusedRow']) {
      setTimeout(() => {
        // Clear hover inline styles from the selected row so CSS highlight shows.
        if (changes['highlightedRow']) {
          const selected = this.el.nativeElement.querySelector<HTMLElement>(
            'tr.mat-mdc-row.data-table__row--selected'
          );
          selected?.querySelectorAll<HTMLElement>('td.mat-mdc-cell').forEach(cell => {
            cell.style.removeProperty('background-color');
          });
        }

        // Focus the arrow-key cursor row — shows focus ring only, no blue highlight.
        if (changes['focusedRow'] && this.focusedRow) {
          const idx = this.data.indexOf(this.focusedRow);
          if (idx >= 0) {
            const rows = this.el.nativeElement.querySelectorAll<HTMLElement>('tr.mat-mdc-row');
            rows[idx]?.focus();
          }
        }
      }, 0);
    }
  }

  ngAfterViewInit(): void {
    this.unlistenMouseover = this.renderer.listen(
      this.el.nativeElement,
      'mouseover',
      (event: MouseEvent) => {
        const row = (event.target as HTMLElement).closest(
          'tr.mat-mdc-row'
        ) as HTMLElement | null;

        if (!row) return;

        if (row.classList.contains('data-table__row--selected')) {
          // Already selected — ensure no leftover inline style blocks the highlight.
          row.querySelectorAll<HTMLElement>('td.mat-mdc-cell').forEach(cell => {
            cell.style.removeProperty('background-color');
          });
          return;
        }

        row.querySelectorAll<HTMLElement>('td.mat-mdc-cell').forEach(cell => {
          cell.style.setProperty('background-color', 'transparent', 'important');
        });

        row.addEventListener(
          'mouseleave',
          () => {
            row.querySelectorAll<HTMLElement>('td.mat-mdc-cell').forEach(cell => {
              cell.style.removeProperty('background-color');
            });
          },
          { once: true }
        );
      }
    );

    // Clear inline styles on click so Angular's change detection can apply
    // the data-table__row--selected CSS highlight immediately without waiting
    // for the mouse to move off the row.
    this.unlistenClick = this.renderer.listen(
      this.el.nativeElement,
      'click',
      (event: MouseEvent) => {
        const row = (event.target as HTMLElement).closest(
          'tr.mat-mdc-row'
        ) as HTMLElement | null;
        if (row) {
          row.querySelectorAll<HTMLElement>('td.mat-mdc-cell').forEach(cell => {
            cell.style.removeProperty('background-color');
          });
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.unlistenMouseover?.();
    this.unlistenClick?.();
  }
}
