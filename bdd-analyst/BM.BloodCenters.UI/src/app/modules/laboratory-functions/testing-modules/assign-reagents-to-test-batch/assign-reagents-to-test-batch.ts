import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DataTable } from '@shared/components/data-table/data-table';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';

import { AssignReagentsToTestBatchService } from './services/assign-reagents-to-test-batch.service';
import {
  TestBatchDetailDto,
  TestBatchOption,
  EditTestKitDialogData,
  EditTestKitDialogResult,
  ViewUnitsDialogData,
  GenerateWorksheetDialogData
} from './models/assign-reagents-to-test-batch.model';
import { ViewUnitsDialogComponent } from './view-units-dialog/view-units-dialog';
import { EditTestKitDialogComponent } from './edit-test-kit-dialog/edit-test-kit-dialog';
import { GenerateWorksheetDialogComponent } from './generate-worksheet-dialog/generate-worksheet-dialog';

@Component({
  selector: 'app-assign-reagents-to-test-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    NgxMatSelectSearchModule,
    DataTable,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './assign-reagents-to-test-batch.html',
  styleUrl: './assign-reagents-to-test-batch.scss'
})
export class AssignReagentsToTestBatch implements OnInit, OnDestroy {

  private static nextId = 0;
  protected readonly componentId = `assign-reagents-${AssignReagentsToTestBatch.nextId++}`;
  protected readonly elementId = (name: string) => `${this.componentId}-${name}`;

  private readonly service = inject(AssignReagentsToTestBatchService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly headerService = inject(HeaderService);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
  };

  protected readonly testBatchOptions = signal<TestBatchOption[]>([]);
  protected filteredTestBatches: TestBatchOption[] = [];
  protected testBatchSearchControl = new FormControl('');
  protected selectedTestBatchId = new FormControl<string | null>(null);
  protected readonly loadingOptions = signal<boolean>(false);

  protected readonly tests = signal<TestBatchDetailDto[]>([]);
  protected readonly testBatchId = signal<string>('');
  protected readonly loadingTests = signal<boolean>(false);

  protected readonly hasTests = computed(() => this.tests().length > 0);

  testsTableConfig!: DataTableConfig<TestBatchDetailDto>;

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
        };
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.initTableConfig();
    this.subscribeToChapterChanges();
    this.loadTestBatchOptions();
    this.setupSearchFilter();
    this.setupSelectionChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.clearState();
        this.loadTestBatchOptions();
      });
  }

  private clearState(): void {
    this.tests.set([]);
    this.testBatchId.set('');
    this.selectedTestBatchId.setValue(null);
    this.testBatchSearchControl.setValue('');
  }

  private loadTestBatchOptions(): void {
    this.loadingOptions.set(true);
    this.service.getTestBatchOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          this.testBatchOptions.set(options);
          this.filteredTestBatches = options;
          this.loadingOptions.set(false);
        },
        error: () => {
          this.testBatchOptions.set([]);
          this.filteredTestBatches = [];
          this.loadingOptions.set(false);
        }
      });
  }

  private setupSearchFilter(): void {
    this.testBatchSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((search) => {
        if (!search) {
          this.filteredTestBatches = this.testBatchOptions();
          return;
        }
        const lowerSearch = search.toLowerCase();
        this.filteredTestBatches = this.testBatchOptions().filter(
          (option) => option.displayName.toLowerCase().includes(lowerSearch)
        );
      });
  }

  private setupSelectionChange(): void {
    this.selectedTestBatchId.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tbId) => {
        if (tbId) {
          this.testBatchId.set(tbId);
          this.loadTests(tbId);
        } else {
          this.tests.set([]);
          this.testBatchId.set('');
        }
      });
  }

  private initTableConfig(): void {
    this.testsTableConfig = {
      columns: [
        {
          key: 'testId',
          header: 'Test ID',
          type: 'text',
          sortable: false
        },
        {
          key: 'testDesc',
          header: 'Description',
          type: 'text',
          sortable: false
        },
        {
          key: 'testKitId',
          header: 'Test Kit',
          type: 'text',
          sortable: false,
          valueFormatter: (value: any) => value || '-'
        }
      ],
      rowActions: [
        {
          icon: 'edit',
          action: 'edit',
          ariaLabel: 'Edit test kit assignment'
        }
      ],
      showPagination: false,
      stickyHeader: true,
      enableRowHighlight: false
    };
  }

  private loadTests(tbId: string): void {
    this.loadingTests.set(true);
    this.tests.set([]);

    this.service.getTestsInBatch(tbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.tests.set(response.data);
          this.loadingTests.set(false);
        },
        error: (err) => {
          this.loadingTests.set(false);
          this.snackbarService.showError(err?.error?.message);
        }
      });
  }

  onViewUnits(): void {
    const tbId = this.testBatchId();
    if (!tbId) {
      return;
    }

    const dialogData: ViewUnitsDialogData = { testBatchId: tbId };

    this.dialog.open(ViewUnitsDialogComponent, {
      width: '600px',
      height: 'calc(100vh - 64px)',
      position: { top: '64px', right: '0' },
      panelClass: 'right-side-drawer',
      data: dialogData
    });
  }

  onRowAction(event: TableRowActionEvent<TestBatchDetailDto>): void {
    if (event.action === 'edit') {
      this.onEditTest(event.row);
    }
  }

  private onEditTest(test: TestBatchDetailDto): void {
    const dialogData: EditTestKitDialogData = {
      testBatchId: this.testBatchId(),
      test
    };

    const dialogRef = this.dialog.open(EditTestKitDialogComponent, {
      width: '754px',
      maxWidth: '100vw',
      disableClose: true,
      position: { right: '0', top: '64px' },
      panelClass: 'right-side-drawer',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: EditTestKitDialogResult) => {
        if (result?.success) {
          this.loadTests(this.testBatchId());
          if (result.promptWorksheet) {
            this.promptForWorksheetGeneration();
          }
        }
      });
  }

  private promptForWorksheetGeneration(): void {
    const tbId = this.testBatchId();
    if (!tbId) return;

    forkJoin({
      printableTests: this.service.getPrintableTests(tbId),
      printers: this.service.getPrinters()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ printableTests, printers }) => {
          if (printableTests.length === 0) return;

          const dialogData: GenerateWorksheetDialogData = {
            testBatchId: tbId,
            printableTests,
            printers
          };

          this.dialog.open(GenerateWorksheetDialogComponent, {
            width: '600px',
            height: 'calc(100vh - 64px)',
            position: { top: '64px', right: '0' },
            panelClass: 'right-side-drawer',
            disableClose: true,
            data: dialogData
          });
        },
        error: () => {
          // Silently skip worksheet prompt on error
        }
      });
  }
}
