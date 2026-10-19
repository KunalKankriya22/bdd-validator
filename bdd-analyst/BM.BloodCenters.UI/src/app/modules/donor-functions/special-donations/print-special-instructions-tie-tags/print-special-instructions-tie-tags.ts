import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, NgModel } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PrintSpecialInstructionsService } from './services/print-special-instructions.service';
import { SelectPrinterDialogComponent } from './dialogs/select-printer-dialog';
import { ViewPrintInstructionsDialogComponent } from './dialogs/view-print-instructions-dialog';
import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import type {
  DonorLookupDto,
  TieTagDto,
  PrintInstructionDto,
  PrinterDto,
} from './models/print-special-instructions.models';


@Component({
  selector: 'app-print-special-instructions-tie-tags',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    PageHeaderWithBreadcrumb,
    SearchBar,
  ],
  templateUrl: './print-special-instructions-tie-tags.html',
  styleUrls: ['./print-special-instructions-tie-tags.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintSpecialInstructionsTieTagsComponent implements OnInit, OnDestroy {
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly service = inject(PrintSpecialInstructionsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('donorIdSelect') donorIdSelect?: NgModel;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Print Special Instructions Tie Tag', link: null },
    ],
    title: '',
    subtitle: '',
    actions: [],
  };

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  // State signals
  protected readonly isLoading = signal(false);
  protected readonly hasError = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly hasRetrieved = signal(false);

  // Lookup data
  protected readonly donors = signal<DonorLookupDto[]>([]);
  protected readonly filteredDonors = signal<DonorLookupDto[]>([]);
  protected readonly tieTags = signal<TieTagDto[]>([]);
  protected readonly printers = signal<PrinterDto[]>([]);

  // ngModel bindings (matching existing component pattern)
  protected selectedDonorId = '';
  protected selectedDonorName = signal('');
  protected readonly interdictionSearch = signal('');

  protected readonly searchConfig: SearchBarConfig = {
    placeholder: 'Search by Interdiction Code',
    ariaLabel: 'Search by interdiction code',
    minLength: 3,
    debounceTime: 0,
    searchOnEnterOnly: true,
  };

  // Search control for ngx-mat-select-search (inner search only)
  protected readonly donorSearchControl = new FormControl<string>('');

  // Selection state (multiple selection)
  protected readonly selectedCodes = signal<Set<string>>(new Set());

  // Sorting
  protected readonly sortState = signal<'default' | 'asc' | 'desc'>('default');


  protected readonly sortedTieTags = computed(() => {
    const tags = [...this.tieTags()];
    const state = this.sortState();

    if (state === 'asc') {
      return tags.sort((a, b) => a.interdictionCode.localeCompare(b.interdictionCode));
    } else if (state === 'desc') {
      return tags.sort((a, b) => b.interdictionCode.localeCompare(a.interdictionCode));
    }
    return tags; // default - no sorting, original order
  });

  protected readonly hasSelection = computed(() => {
    return this.selectedCodes().size > 0;
  });

  ngOnInit(): void {
    this.loadDonors();
    this.setupDonorSearchFilter();
    this.subscribeToChapterChanges();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onClearAll();
        this.loadDonors();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDonors(): void {
    this.service
      .getDonors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.donors.set(data);
          this.filteredDonors.set(data);
          this.cdr.markForCheck();
        },
        error: () => {
          this.donors.set([]);
          this.filteredDonors.set([]);
          this.cdr.markForCheck();
        },
      });
  }

  private setupDonorSearchFilter(): void {
    this.donorSearchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((term) => {
      const search = (term || '').toLowerCase();
      const all = this.donors();
      this.filteredDonors.set(
        search ? all.filter((d) => d.displayValue.toLowerCase().includes(search)) : all,
      );
    });
  }

  protected onDonorSelected(donorId: string): void {
    const found = this.donors().find((d) => d.donorId === donorId);
    this.selectedDonorName.set(found ? this.service.formatDonorName(found.donorName) : '');
  }

  protected onInterdictionSearchChange(value: string): void {
    this.interdictionSearch.set(value);

    // Re-fetch data with the search filter
    const donorId = this.selectedDonorId;
    if (donorId) {
      this.fetchTieTags(donorId, value);
    }
  }

  private fetchTieTags(donorId: string, interdictionCode?: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.tieTags.set([]);
    this.selectedCodes.set(new Set());

    this.service
      .getTieTags(donorId, interdictionCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tags) => {
          this.tieTags.set(tags);
          this.hasRetrieved.set(true);
          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.hasRetrieved.set(true);
          this.errorMessage.set(err?.error?.message || 'Failed to retrieve tie tags.');
          this.snackBar.open(this.errorMessage(), 'Close', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
            duration: 5000,
          });
          this.cdr.markForCheck();
        },
      });
  }

  protected onRetrieve(): void {
    const donorId = this.selectedDonorId;
    if (!donorId) return;

    this.interdictionSearch.set('');
    this.sortState.set('default');
    this.fetchTieTags(donorId);
  }

  protected onClearAll(): void {
    this.selectedDonorId = '';
    this.selectedDonorName.set('');
    this.donorSearchControl.setValue('');
    this.interdictionSearch.set('');
    this.tieTags.set([]);
    this.selectedCodes.set(new Set());
    this.printers.set([]);
    this.hasRetrieved.set(false);
    this.hasError.set(false);
    this.errorMessage.set('');
    this.sortState.set('default');
    this.filteredDonors.set(this.donors());

    // Reset the validation state of the donor ID field
    if (this.donorIdSelect) {
      this.donorIdSelect.control.markAsUntouched();
      this.donorIdSelect.control.markAsPristine();
    }
  }

  protected onSelectRow(code: string): void {
    const currentSelection = new Set(this.selectedCodes());

    if (currentSelection.has(code)) {
      currentSelection.delete(code);
    } else {
      currentSelection.add(code);
    }

    this.selectedCodes.set(currentSelection);
    this.cdr.markForCheck();
  }

  protected isSelected(code: string): boolean {
    return this.selectedCodes().has(code);
  }

  protected isAllSelected(): boolean {
    const tags = this.tieTags();
    if (tags.length === 0) return false;
    return this.selectedCodes().size === tags.length;
  }

  protected isSomeSelected(): boolean {
    const selectedCount = this.selectedCodes().size;
    const totalCount = this.tieTags().length;
    return selectedCount > 0 && selectedCount < totalCount;
  }

  protected onToggleSelectAll(): void {
    const tags = this.tieTags();
    if (this.isAllSelected()) {
      // Deselect all
      this.selectedCodes.set(new Set());
    } else {
      // Select all
      const allCodes = new Set(tags.map(tag => tag.interdictionCode));
      this.selectedCodes.set(allCodes);
    }
    this.cdr.markForCheck();
  }

  protected onToggleSort(): void {
    const current = this.sortState();
    if (current === 'default') {
      this.sortState.set('asc');
    } else if (current === 'asc') {
      this.sortState.set('desc');
    } else {
      this.sortState.set('default');
    }
  }

  protected onPrint(): void {
    const donorId = this.selectedDonorId;
    if (!donorId) return;

    const printers = this.printers();

    if (printers.length === 0) {
      this.service
        .getPrinters()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.printers.set(data);
            if (data.length === 0) {
              this.snackBar.open('No printers are configured. Please contact your administrator.', 'Close', {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar'],
                duration: 5000,
              });
              return;
            }
            this.openPrinterDialog(donorId, data);
          },
          error: () => {
            this.snackBar.open('Failed to load printers. Please try again.', 'Close', {
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
              duration: 5000,
            });
          },
        });
    } else {
      this.openPrinterDialog(donorId, printers);
    }
  }

  private openPrinterDialog(donorId: string, printers: PrinterDto[]): void {
    const selectedCodes = Array.from(this.selectedCodes());
    const tieTags = this.tieTags();

    const firstTag = tieTags.find(t => t.interdictionCode === selectedCodes[0]);
    const defaultNumberOfLabels = firstTag?.numberOfLabel || 1;

    const dialogRef = this.dialog.open(SelectPrinterDialogComponent, {
      width: '440px',
      data: { printers, numberOfLabels: defaultNumberOfLabels, selectedCount: selectedCodes.length },
      disableClose: false,
      autoFocus: true,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      (document.activeElement as HTMLElement)?.blur();
      if (!result) return;

      this.printMultipleTieTags(donorId, selectedCodes, result.printerId, result.numberOfLabels);
    });
  }

  private printMultipleTieTags(donorId: string, interdictionCodes: string[], printerId: string, numberOfLabels: number): void {
    let successCount = 0;
    let errorCount = 0;
    const totalCount = interdictionCodes.length;

    interdictionCodes.forEach((code) => {
      this.service
        .printTieTags({
          donorId,
          interdictionCode: code,
          numberOfLabels,
          printer: printerId
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            successCount++;
            if (successCount + errorCount === totalCount) {
              this.showPrintSummary(successCount, errorCount);
            }
          },
          error: () => {
            errorCount++;
            if (successCount + errorCount === totalCount) {
              this.showPrintSummary(successCount, errorCount);
            }
          },
        });
    });
  }

  private showPrintSummary(successCount: number, errorCount: number): void {
    if (errorCount === 0) {
      this.snackBar.open(`${successCount} tie tag${successCount > 1 ? 's' : ''} sent to printer.`, 'Close', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        duration: 3000,
      });
    } else if (successCount === 0) {
      this.snackBar.open('Failed to print tie tags.', 'Close', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
        duration: 5000,
      });
    } else {
      this.snackBar.open(
        `${successCount} succeeded, ${errorCount} failed.`,
        'Close',
        {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['warning-snackbar'],
          duration: 5000,
        }
      );
    }
  }

  protected onViewPrintInstructions(): void {
    const selectedCodes = Array.from(this.selectedCodes());

    if (selectedCodes.length !== 1) return;

    const labelCode = selectedCodes[0];

    this.service
      .getPrintInstructions(labelCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (instructions) => {
          this.openInstructionsDialog(instructions);
        },
        error: () => {
          this.snackBar.open('Failed to load print instructions. Please try again.', 'Close', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
            duration: 5000,
          });
        },
      });
  }

  private openInstructionsDialog(instructions: PrintInstructionDto[]): void {
    const dialogRef = this.dialog.open(ViewPrintInstructionsDialogComponent, {
      width: '480px',
      maxWidth: '100vw',
      position: { right: '0', top: '0' },
      height: '100vh',
      data: { instructions },
      panelClass: 'instructions-panel',
      disableClose: false,
      autoFocus: false,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
      (document.activeElement as HTMLElement)?.blur();
    });
  }

  protected isRetrieveDisabled(): boolean {
    return this.isLoading() || !this.selectedDonorId;
  }
}
