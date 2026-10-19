
import { Component, OnInit, OnDestroy, ViewChild, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig, ActionButton } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { UppercaseDatePipe } from '@shared/pipes/uppercase-date.pipe';

import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { CommunicationLettersService } from './services/communication-letters.service';
import {
  CommLetterView,
  CommLetterFilterCriteria,
  CommLetterCodeOption,
} from './models/communication-letter.model';

@Component({
  selector: 'app-define-communication-letters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    UppercaseDatePipe,
  ],
  templateUrl: './define-communication-letters.html',
  styleUrls: ['./define-communication-letters.scss'],
})
export class DefineCommunicationLetters implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly historyError = signal<string | null>(null);

  currentVersionLetters: CommLetterView[] = [];
  versionHistoryLetters: CommLetterView[] = [];
  readonly currentTableSource = new MatTableDataSource<CommLetterView>();
  readonly historyTableSource = new MatTableDataSource<CommLetterView>();

  @ViewChild('currentPaginator')
  set currentPaginator(pag: MatPaginator) {
    this.currentTableSource.paginator = pag ?? null;
  }

  @ViewChild('historyPaginator')
  set historyPaginator(pag: MatPaginator) {
    this.historyTableSource.paginator = pag ?? null;
  }

  letterCodeControl = new FormControl<string | null>(null);
  letterCodeOptions = signal<CommLetterCodeOption[]>([]);
  selectedLetterTitle = '';

  readonly letterCodeSearchControl = new FormControl('');
  readonly letterCodeSearch = signal('');

  readonly filteredLetterCodeOptions = computed(() => {
    const search = this.letterCodeSearch().toLowerCase();
    const options = this.letterCodeOptions();
    if (!search) return options;
    return options.filter(
      (o) =>
        (o.letterCode || '').toLowerCase().includes(search) ||
        (o.letterTitle || '').toLowerCase().includes(search),
    );
  });

  readonly showTerminatedOptions = ['Yes', 'No'];
  readonly showTerminatedControl = new FormControl('No');

  filterCriteria: CommLetterFilterCriteria = { showTerminated: 'No' };
  hasSearched = false;

  displayedColumns: string[] = [
    'letterCode',
    'title',
    'versionNo',
    'versionDate',
    'effectiveDate',
    'terminationDate',
    'actions',
  ];

  selectedLetter: CommLetterView | null = null;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: '',
    actions: [
      {
        label: 'CREATE NEW LETTER',
        icon: 'add',
        variant: 'filled',
        matButton: 'raised',
        ariaLabel: 'Add new letter',
        onClick: () => this.openCreateDialog(),
      } as ActionButton,
    ],
  };

  constructor(
    private dialog: MatDialog,
    private service: CommunicationLettersService,
    private headerService: HeaderService,
    private snackBar: MatSnackBar,
    private pageHeaderService: PageHeaderService,
  ) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
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

  ngOnInit(): void {
    this.loadLetterCodes();
    this.setupLetterCodeSearch();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearAll();
        this.loadLetterCodes();
      });
  }

  private loadLetterCodes(): void {
    this.service
      .getLetterCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codes) => this.letterCodeOptions.set(codes),
        error: () => this.letterCodeOptions.set([]),
      });
  }

  private setupLetterCodeSearch(): void {
    this.letterCodeSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((term) => this.letterCodeSearch.set(term || ''));

    this.letterCodeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedCode) => {
        if (!selectedCode) {
          this.selectedLetterTitle = '';
          this.filterCriteria.letterCode = undefined;
          this.headerConfig = { ...this.headerConfig, subtitle: '' };
          return;
        }
        this.filterCriteria.letterCode = selectedCode;
        const opt = this.letterCodeOptions().find((o) => o.letterCode === selectedCode);
        this.selectedLetterTitle = opt?.letterTitle || '';
        this.headerConfig = { ...this.headerConfig, subtitle: opt?.letterTitle || '' };
      });

    this.showTerminatedControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.filterCriteria.showTerminated = val || 'No';
      });
  }

  onRetrieve(): void {
    this.hasSearched = true;
    this.loading.set(true);
    this.error.set(null);
    this.historyError.set(null);

    const letterCode = this.filterCriteria.letterCode;

    if (letterCode) {
      // When a specific letter code is selected, use the HISTORY endpoint to get
      // all past revisions instead of relying on a client-side date split.
      forkJoin({
        current: this.service.getLetters(this.filterCriteria),
        history: this.service.getLetterHistory(letterCode).pipe(
          catchError(() => {
            this.historyError.set('Version history could not be loaded. Please try again.');
            return of([]);
          }),
        ),
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: ({ current, history }) => {
            const today = DateFieldValidationUtility.getMinDate().format('YYYY-MM-DD');
            this.currentVersionLetters = current.filter((l) => {
              if (l.termDate == null) return true;
              return moment(l.termDate).format('YYYY-MM-DD') > today;
            });
            this.versionHistoryLetters = history;
            this.applyCurrentTableSearch();
            this.applyHistoryTableSearch();
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set(err.message || 'Failed to load communication letters');
            this.loading.set(false);
            this.showError('Failed to load communication letters');
          },
        });
    } else {
      this.service
        .getLetters(this.filterCriteria)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (letters) => {
            this.processLetters(letters);
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set(err.message || 'Failed to load communication letters');
            this.loading.set(false);
            this.showError('Failed to load communication letters');
          },
        });
    }
  }

  private processLetters(letters: CommLetterView[]): void {
    const today = DateFieldValidationUtility.getMinDate().format('YYYY-MM-DD');
    this.currentVersionLetters = letters.filter((l) => {
      if (l.termDate == null) return true;
      return moment(l.termDate).format('YYYY-MM-DD') > today;
    });
    this.versionHistoryLetters = letters.filter((l) => {
      if (l.termDate == null) return false;
      return moment(l.termDate).format('YYYY-MM-DD') <= today;
    });
    this.applyCurrentTableSearch();
    this.applyHistoryTableSearch();
  }

  private applyCurrentTableSearch(): void {
    this.currentTableSource.data = [...this.currentVersionLetters];
    this.currentTableSource.paginator?.firstPage();
  }

  private applyHistoryTableSearch(): void {
    this.historyTableSource.data = [...this.versionHistoryLetters];
    this.historyTableSource.paginator?.firstPage();
  }

  isLetterSelected(letter: CommLetterView): boolean {
    return this.selectedLetter?.letterId === letter.letterId;
  }

  onClear(): void {
    this.filterCriteria = { showTerminated: 'No' };
    this.showTerminatedControl.setValue('No', { emitEvent: false });
    this.letterCodeControl.setValue(null);
    this.letterCodeSearchControl.setValue('');
    this.selectedLetterTitle = '';
    this.headerConfig = { ...this.headerConfig, subtitle: '' };
    this.currentVersionLetters = [];
    this.versionHistoryLetters = [];
    this.currentTableSource.data = [];
    this.historyTableSource.data = [];
    this.hasSearched = false;
    this.historyError.set(null);
    this.selectedLetter = null;
  }

  private clearAll(): void {
    this.onClear();
  }

  openCreateDialog(): void {
    import('./create-edit-letter/create-edit-letter').then((m) => {
      const dialogRef = this.dialog.open(m.CreateEditCommLetter, {
        width: '800px',
        height: '100vh',
        position: { right: '0', top: '64px' },
        panelClass: ['comm-letter-drawer'],
        backdropClass: 'comm-letter-backdrop',
        disableClose: true,
        autoFocus: false,
        data: { mode: 'add', letterCodes: this.letterCodeOptions() },
      });

      dialogRef
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((result) => {
          if (result?.success) {
            this.showSuccess('Letter created successfully');
            this.loadLetterCodes();
            this.onRetrieve();
          }
        });
    });
  }

  openReviseDialog(letter: CommLetterView): void {
    this.selectedLetter = letter;
    import('./create-edit-letter/create-edit-letter').then((m) => {
      const dialogRef = this.dialog.open(m.CreateEditCommLetter, {
        width: '800px',
        height: '100vh',
        position: { right: '0', top: '64px' },
        panelClass: ['comm-letter-drawer'],
        backdropClass: 'comm-letter-backdrop',
        disableClose: true,
        autoFocus: false,
        data: { mode: 'edit', letter, letterCodes: this.letterCodeOptions() },
      });

      dialogRef
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((result) => {
          this.selectedLetter = null;
          (document.activeElement as HTMLElement)?.blur();
          if (result?.success) {
            this.showSuccess('Letter revised successfully');
            this.onRetrieve();
          }
        });
    });
  }

  openViewDialog(letter: CommLetterView): void {
    this.selectedLetter = letter;
    import('./view-letter/view-letter').then((m) => {
      const dialogRef = this.dialog.open(m.ViewCommLetter, {
        width: '800px',
        height: '100vh',
        position: { right: '0', top: '64px' },
        panelClass: ['comm-letter-drawer'],
        backdropClass: 'comm-letter-backdrop',
        autoFocus: false,
        data: { letter },
      });
      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.selectedLetter = null;
        (document.activeElement as HTMLElement)?.blur();
      });
    });
  }

  openPreviewDialog(letter: CommLetterView): void {
    this.selectedLetter = letter;
    import('./preview-letter/preview-letter').then((m) => {
      const dialogRef = this.dialog.open(m.PreviewCommLetter, {
        width: '800px',
        height: '100vh',
        position: { right: '0', top: '64px' },
        panelClass: ['comm-letter-drawer', 'preview-letter-drawer'],
        backdropClass: 'comm-letter-backdrop',
        autoFocus: false,
        data: { letter },
      });
      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.selectedLetter = null;
        (document.activeElement as HTMLElement)?.blur();
      });
    });
  }

  get hasCurrentData(): boolean {
    return this.currentTableSource.data.length > 0;
  }

  get hasHistoryData(): boolean {
    return this.historyTableSource.data.length > 0;
  }

  get hasData(): boolean {
    return this.hasCurrentData || this.hasHistoryData;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }
}
