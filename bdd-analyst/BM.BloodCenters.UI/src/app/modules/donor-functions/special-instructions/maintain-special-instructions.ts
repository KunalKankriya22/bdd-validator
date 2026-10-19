import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';

import { AlertComponent } from '@shared/components/alert/alert.component';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';

import { RouteKey } from '../../../core/constants/route-keys';
import { ROUTE_REGISTRY } from '../../../core/constants/route-registry';
import { ROUTES } from '../../../core/constants/route.constants';
import {
  SaveSpecialInstructionsRequest,
  SpecialInstructionDropdownItem,
  SpecialInstructionRow,
} from './models/maintain-special-instructions.models';
import { MaintainSpecialInstructionsService } from './services/maintain-special-instructions.service';

const MAX_LINES = 9;
const MAX_LINE_CHARS = 45;

@Component({
  selector: 'app-maintain-special-instructions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    AlertComponent,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './maintain-special-instructions.html',
  styleUrls: ['./maintain-special-instructions.scss'],
})
export class MaintainSpecialInstructionsComponent implements OnInit, OnDestroy {
  @ViewChild('tableWrapper') private tableWrapperRef!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private menuService = inject(MenuService);

  // ─── Header ──────────────────────────────────────────────────
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: [],
  };

  // ─── Dropdown state ──────────────────────────────────────────
  dropdownOptions = signal<SpecialInstructionDropdownItem[]>([]);
  loadingDropdown = signal(false);
  selectedInstruction = signal<SpecialInstructionDropdownItem | null>(null);
  searchControl = new FormControl('');
  searchTerm = signal<string>('');

  filteredOptions = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const opts = this.dropdownOptions();
    if (!search) return opts;
    return opts.filter(
      (o) =>
        o.specialInstruction.toLowerCase().includes(search) ||
        o.description.toLowerCase().includes(search),
    );
  });

  // ─── Table state ─────────────────────────────────────────────
  hasRetrieved = signal(false);
  loading = signal(false);
  saving = signal(false);
  rows = signal<SpecialInstructionRow[]>([]);
  alertDismissed = signal(false);
  isEditMode = signal(false);
  originalRows = signal<SpecialInstructionRow[]>([]);
  focusedRowIndex = signal<number | null>(null);

  // ─── Derived ─────────────────────────────────────────────────
  readonly canRetrieve = computed(
    () => this.selectedInstruction() !== null && !this.loading(),
  );
  readonly canAddNew = computed(
    () => this.rows().length < MAX_LINES,
  );
  readonly hasChanges = computed(() => this.rows().some((r) => r.isNew || r.isDirty));
  readonly isClearDisabled = computed(
    () => this.selectedInstruction() === null && this.searchTerm() === '' && !this.hasRetrieved(),
  );
  readonly maxLines = MAX_LINES;
  readonly maxLineChars = MAX_LINE_CHARS;

  constructor(
    private service: MaintainSpecialInstructionsService,
    private snackBar: MatSnackBar,
    private headerService: HeaderService,
  ) {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.MaintainSpecialInstructions].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);
        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null },
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || '',
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadDropdownOptions();
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.searchTerm.set(v ?? ''));
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Dropdown ────────────────────────────────────────────────
  private loadDropdownOptions(): void {
    this.loadingDropdown.set(true);
    this.service
      .getDropdownValues()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (opts) => {
          this.dropdownOptions.set(opts);
          this.loadingDropdown.set(false);
        },
        error: () => {
          this.loadingDropdown.set(false);
          this.showError('Failed to load special instruction options.');
        },
      });
  }

  onSelectionChange(item: SpecialInstructionDropdownItem): void {
    this.selectedInstruction.set(item);
    this.hasRetrieved.set(false);
    this.rows.set([]);
    this.alertDismissed.set(false);
  }

  getDescription(): string {
    const item = this.selectedInstruction();
    return item?.description || '-';
  }

  // ─── Retrieve ────────────────────────────────────────────────
  onRetrieve(): void {
    const item = this.selectedInstruction();
    if (!item) return;

    this.loading.set(true);
    this.alertDismissed.set(false);
    this.service
      .getLinesByLabelCode(item.specialInstruction)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lines) => {
          const mappedRows = lines.map((l, i) => ({
            lineNumber: i + 1,
            lineText: l.lineText,
            originalLineText: l.lineText,
          }));
          this.rows.set(mappedRows);
          this.originalRows.set(JSON.parse(JSON.stringify(mappedRows)));
          this.hasRetrieved.set(true);
          this.loading.set(false);
          this.isEditMode.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.showError('Failed to retrieve special instructions.');
        },
      });
  }

  // ─── Clear ───────────────────────────────────────────────────
  onClear(): void {
    this.selectedInstruction.set(null);
    this.searchControl.setValue('');
    this.searchTerm.set('');
    this.hasRetrieved.set(false);
    this.rows.set([]);
    this.alertDismissed.set(false);
    this.isEditMode.set(false);
    this.originalRows.set([]);
  }

  // ─── Edit Mode ───────────────────────────────────────────────
  enterEditMode(): void {
    this.isEditMode.set(true);
    this.originalRows.set(JSON.parse(JSON.stringify(this.rows())));
    this.alertDismissed.set(false);
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.rows.set(JSON.parse(JSON.stringify(this.originalRows())));
    this.alertDismissed.set(false);
  }

  // ─── Table operations ────────────────────────────────────────
  onDrop(event: CdkDragDrop<SpecialInstructionRow[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const item = this.selectedInstruction();
    if (!item) return;

    const current = [...this.rows()];
    moveItemInArray(current, event.previousIndex, event.currentIndex);
    this.renumber(current);
    this.rows.set(current);

    const from = Math.min(event.previousIndex, event.currentIndex);
    const to = Math.max(event.previousIndex, event.currentIndex);
    const affectedRows = current.slice(from, to + 1);

    const payload: SaveSpecialInstructionsRequest = {
      labelCode: item.specialInstruction,
      lines: affectedRows.map((row) => ({ lineNumber: row.lineNumber, lineText: row.lineText })),
    };

    this.service
      .saveLines(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {},
        error: () => {
          this.showError('Failed to reorder instructions.');
          this.onRetrieve();
        },
      });
  }

  onAddNew(): void {
    const current = [...this.rows()];
    if (current.length >= MAX_LINES) return;
    current.push({ lineNumber: current.length + 1, lineText: '', isNew: true });
    this.rows.set(current);
    setTimeout(() => {
      const el = this.tableWrapperRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  onDeleteRow(index: number): void {
    const row = this.rows()[index];
    if (!row) return;

    if (row.isNew) {
      this.removeRowLocally(index);
      return;
    }

    const item = this.selectedInstruction();
    if (!item) return;

    this.service
      .deleteLine(item.specialInstruction, row.lineNumber, row.lineText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Line deleted successfully.');
          this.onRetrieve();
        },
        error: () => this.showError('Failed to delete the line.'),
      });
  }

  private removeRowLocally(index: number): void {
    const current = [...this.rows()];
    current.splice(index, 1);
    this.renumber(current);
    this.rows.set(current);
  }

  onLineTextChange(index: number, value: string): void {
    const current = [...this.rows()];
    const row = current[index];
    const cleanedValue = row?.isNew ? value.trimStart() : value;
    const isDirty = !row?.isNew ? cleanedValue !== row?.originalLineText : undefined;
    current[index] = { ...row, lineText: cleanedValue, ...(isDirty !== undefined && { isDirty }) };
    this.rows.set(current);
  }

  onRowFocus(index: number): void {
    this.focusedRowIndex.set(index);
  }

  onRowBlur(): void {
    this.focusedRowIndex.set(null);
  }

  onLineTextKeydown(row: SpecialInstructionRow, event: KeyboardEvent): void {
    if (!row.isNew) return;
    if (event.key === ' ') {
      const input = event.target as HTMLInputElement;
      if (input.selectionStart === 0) {
        event.preventDefault();
      }
    }
  }

  private renumber(arr: SpecialInstructionRow[]): void {
    arr.forEach((row, i) => (row.lineNumber = i + 1));
  }

  // ─── Full replace — sends all non-empty rows to the API ─────
  onSave(): void {
    const item = this.selectedInstruction();
    if (!item) return;

    const lines = this.rows()
      .filter((r) => r.lineText.trim().length > 0)
      .map((r) => ({ lineNumber: r.lineNumber, lineText: r.lineText.trim() }));

    if (lines.length === 0) return;

    const payload: SaveSpecialInstructionsRequest = {
      labelCode: item.specialInstruction,
      lines,
    };

    this.saving.set(true);
    this.service
      .saveAll(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.isEditMode.set(false);
          this.showSuccess('Special instructions saved successfully.');
          this.onRetrieve();
        },
        error: (err) => {
          this.saving.set(false);
          const msg = err?.error?.message ?? 'Failed to save special instructions.';
          this.showError(msg);
        },
      });
  }

  // ─── Alert ───────────────────────────────────────────────────
  onDismissAlert(): void {
    this.alertDismissed.set(true);
  }

  // ─── Snackbar helpers ────────────────────────────────────────
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  // ─── Chapter changes subscription ────────────────────────────
  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClear();
        this.loadDropdownOptions();
      });
  }
}
