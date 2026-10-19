import {
  Component,
  Injectable,
  OnInit,
  OnDestroy,
  Input,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

import { MatDialogRef } from '@angular/material/dialog';

import { SearchForDonorDialog } from '@shared/components/search-for-donor/search-for-donor';
import { SearchForDonorDialogResult } from '@shared/components/search-for-donor/search-for-donor.model';

import { DonorInterdictionsContentComponent } from '../donor-profile/donor-interdictions/donor-interdictions-content.component';
import { DonorAttributesComponent } from '../donor-profile/donor-profile-maintenance/donor-attributes/donor-attributes.component';

import { DonorRbcAgQueryService } from './services/donor-rbc-ag-query.service';
import {
  DonorRbcAgQueryDto,
  AntigenTestHeaderDto,
  AntigenTestDetailDto,
  RESULT_CODE_DISPLAY,
  TestExclusionItem,
  UpdateGenotypeDto,
  UpdateExcludeFlagDto,
} from './models/donor-rbc-ag-query.model';
import { DonorAntigensApiService } from '../../laboratory-functions/donor-antigens-query/services/donor-antigens-api.service';
import { HlaAntigens, DonorAntigensData } from '../../laboratory-functions/donor-antigens-query/models/donor-antigens.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService, MenuItem } from '@shared/services/menu.service';
import { SidePanelBase } from '@shared/components/side-panel-base/side-panel-base';
import { DialogButton } from '@shared/interfaces/dialog.interface';
import { ROUTES } from 'src/app/core/constants/route.constants';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

/**
 * Panel data interface for excluding units
 */
export interface ExcludeUnitsPanelData {
  antigenCode: string;
  resultCode: string | null;
  confirmDate: string | null;
  serologicalTests: AntigenTestDetailDto[];
  molecularTests: AntigenTestDetailDto[];
}

/**
 * Panel data interface for genotype
 */
export interface GenotypePanelData {
  donorId: string;
  donorName: string;
  currentGenotype: string | null;
}

/**
 * Internal test row with selection state
 */
interface TestRowWithSelection extends AntigenTestDetailDto {
  selected: boolean;
  originalSelected: boolean; // Track original state to detect changes
}

@Component({
  selector: 'app-donor-interdictions-dialog-rbc',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    DonorInterdictionsContentComponent
  ],
  template: `
    <div class="side-panel-container">
      <div class="side-panel-header">
        <h2 class="side-panel-title">Donor Interdictions</h2>
        <button
          type="button"
          mat-icon-button
          class="side-panel-close"
          aria-label="Close panel"
          (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="side-panel-content-wrapper">
        <app-donor-interdictions-content
          [donorId]="donorId"
          (closePanel)="onClose()">
        </app-donor-interdictions-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }

    .side-panel-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .side-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .side-panel-title {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .side-panel-close mat-icon {
      color: rgba(0, 0, 0, 0.54);
    }

    .side-panel-close:hover mat-icon {
      color: rgba(0, 0, 0, 0.87);
    }

    .side-panel-content-wrapper {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  `]
})
class DonorInterdictionsDialogRbc {
  donorId: string = '';
  private dialogRef = inject(MatDialogRef<DonorInterdictionsDialogRbc>);

  onClose(): void {
    this.dialogRef.close();
  }
}

@Injectable()
class CustomPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Rows per page:';
}

@Component({
  selector: 'app-donor-rbc-ag-query',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDividerModule,
    FormsModule,
    CdkTextareaAutosize,
    PageHeaderWithBreadcrumb,
    SidePanelBase,
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }
  ],
  templateUrl: './donor-rbc-ag-query.html',
  styleUrl: './donor-rbc-ag-query.scss',
})
export class DonorRbcAgQueryComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() embedded = false;
  // Unique ID generation for accessibility
  private static nextId = 0;
  readonly componentId = `donor-rbc-ag-query-${DonorRbcAgQueryComponent.nextId++}`;

  // Generate unique IDs for elements
  readonly elementId = (name: string) => `${this.componentId}-${name}`;
  readonly tableId = (name: string) => `${this.componentId}-${name}-table`;

  // Dependencies
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly donorRbcAgQueryService = inject(DonorRbcAgQueryService);
  private readonly donorAntigensApiService = inject(DonorAntigensApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly headerService = inject(HeaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly menuService = inject(MenuService);
  private readonly destroy$ = new Subject<void>();

  // Page header configuration - populated dynamically from pageHeaderService
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [{ label: 'Home', link: '/home' }],
    title: '',
    subtitle: ''
  };

  // Signal-based state
  readonly donorData = signal<DonorRbcAgQueryDto | null>(null);
  readonly selectedAntigen = signal<AntigenTestHeaderDto | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly cmv = signal<string>('');
  readonly hemoglobinS = signal<string>('');

  // Access control
  readonly canExcludeUnits = signal<boolean>(false);

  // Panel state
  readonly showExcludeUnitsPanel = signal<boolean>(false);
  readonly excludeUnitsPanelData = signal<ExcludeUnitsPanelData | null>(null);
  readonly showGenotypePanel = signal<boolean>(false);
  readonly genotypePanelData = signal<GenotypePanelData | null>(null);
  readonly genotypeFormControl = new FormControl('');
  private readonly genotypeValue = signal<string>('');

  // Test data with selection state for exclude units panel
  readonly serologicalTestsWithSelection = signal<TestRowWithSelection[]>([]);
  readonly molecularTestsWithSelection = signal<TestRowWithSelection[]>([]);
  private readonly excludeChangeCounter = signal(0);

  onExcludeCheckboxChange(): void {
    this.excludeChangeCounter.update(c => c + 1);
  }

  // Exclude units panel configuration
  readonly excludeUnitsPanelButtons = computed<DialogButton[]>(() => {
    this.excludeChangeCounter();
    const serChanged = this.serologicalTestsWithSelection().some(t => t.selected !== t.originalSelected);
    const molChanged = this.molecularTestsWithSelection().some(t => t.selected !== t.originalSelected);
    const hasChanges = serChanged || molChanged;
    return [
      { label: 'CANCEL', action: 'cancel', variant: 'text' },
      { label: 'SAVE', action: 'save', variant: 'primary', disabled: !hasChanges }
    ];
  });

  // Genotype panel configuration
  readonly genotypePanelButtons: DialogButton[] = [
    { label: 'NO, CANCEL', action: 'cancel', variant: 'text' },
    { label: 'SAVE', action: 'save', variant: 'primary' }
  ];

  // HLA Antigens panel state
  readonly showHlaAntigensPanel = signal<boolean>(false);
  readonly hlaAntigensData = signal<HlaAntigens | null>(null);
  readonly hlaAntigensLoading = signal<boolean>(false);

  // HLA Antigens panel configuration - only CLOSE button
  readonly hlaAntigensPanelButtons: DialogButton[] = [
    { label: 'NO, CANCEL', action: 'close', variant: 'text' },
    { label: 'SAVE', action: 'save', variant: 'primary' }
  ];

  readonly displayedColumns = ['unitId', 'testId', 'result', 'collectionDate', 'confirm', 'luaFlag', 'select'];

  readonly hasSerologicalTests = computed(() => {
    return this.serologicalTestsWithSelection().length > 0;
  });

  readonly hasMolecularTests = computed(() => {
    return this.molecularTestsWithSelection().length > 0;
  });

  // Search and filtering
  readonly antigenSearchControl = new FormControl('');
  private readonly searchText = signal<string>('');

  // Pagination for serological tests
  readonly serologicalPageIndex = signal<number>(0);
  readonly serologicalPageSize = signal<number>(25);
  readonly serologicalPageSizeOptions = [10, 25, 50, 100];

  // Pagination for molecular tests
  readonly molecularPageIndex = signal<number>(0);
  readonly molecularPageSize = signal<number>(25);
  readonly molecularPageSizeOptions = [10, 25, 50, 100];

  // Table columns
  readonly testTableColumns = [
    'unitId',
    'testId',
    'result',
    'collectionDate',
    'confirm',
    'luaFlag',
    'excluded',
  ];

  // Computed values
  readonly filteredAntigens = computed(() => {
    const antigens = this.donorData()?.antigenTests || [];
    const search = this.searchText().toLowerCase().trim();

    if (!search) return antigens;

    return antigens.filter(a =>
      a.antigenCode.toLowerCase().includes(search)
    );
  });

  readonly paginatedSerologicalTests = computed(() => {
    const tests = this.selectedAntigen()?.serologicalTests || [];
    const pageIndex = this.serologicalPageIndex();
    const pageSize = this.serologicalPageSize();
    const startIndex = pageIndex * pageSize;
    return tests.slice(startIndex, startIndex + pageSize);
  });

  readonly serologicalTestsTotal = computed(() => {
    return this.selectedAntigen()?.serologicalTests.length || 0;
  });

  readonly paginatedMolecularTests = computed(() => {
    const tests = this.selectedAntigen()?.molecularTests || [];
    const pageIndex = this.molecularPageIndex();
    const pageSize = this.molecularPageSize();
    const startIndex = pageIndex * pageSize;
    return tests.slice(startIndex, startIndex + pageSize);
  });

  readonly molecularTestsTotal = computed(() => {
    return this.selectedAntigen()?.molecularTests.length || 0;
  });

  readonly isReady = computed(() => {
    return !this.loading() && !this.error() && this.donorData() !== null;
  });

  readonly hasSelectedAntigen = computed(() => {
    return this.selectedAntigen() !== null;
  });

  // Genotype character counter
  readonly genotypeRemainingChars = computed(() => {
    const value = this.genotypeValue();
    return 500 - value.length;
  });

  constructor() {
    // Dynamically load page header from menu configuration
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    if (!this.embedded) {
      // Set header dynamically from menu service if pageHeaderService doesn't have data (direct URL access)
      if (!this.pageHeaderService.pageHeaderData()) {
        const basePath = '/donor-functions/donor-rbc-ag-query';
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          const breadcrumbs = this.buildBreadcrumbPath(basePath);

          this.headerConfig = {
            breadcrumbs,
            title: menuItem.label,
            subtitle: menuItem.remarks?.trim() || menuItem.subtitle?.trim() || ''
          };
        }
      }

      // Get donor ID from route params OR query params
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        let donorId = params['donorId'];

        if (!donorId || donorId === ':donorId') {
          const queryParams = this.route.snapshot.queryParams;
          donorId = queryParams['donorId'];
        }

        if (!donorId) {
          this.openSearchForDonor();
          return;
        }

        this.loadDonorData(donorId);
      });
    }

    // Refresh data on chapter change
    this.headerService.chapterChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const donorId = this.donorData()?.donorId;
      if (donorId) {
        this.loadDonorData(donorId);
        this.cdr.markForCheck();
      }
    });

    // Setup search filter
    this.antigenSearchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.searchText.set(value || '');
      });

    // Track genotype form control changes for character counter
    this.genotypeFormControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.genotypeValue.set(value || '');
      });
  }

  ngAfterViewInit(): void {
    if (this.embedded) {
      setTimeout(() => this.openSearchForDonor(), 0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openSearch(): void {
    this.openSearchForDonor();
  }

  onChange(): void {
    const dialogRef = this.dialog.open(SearchForDonorDialog, {
      width: '1184px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'search-for-donor-panel',
      disableClose: false,
      data: {}
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: SearchForDonorDialogResult) => {
        if (result && result.action === 'select' && result.donor) {
          if (this.embedded) {
            this.loadDonorData(result.donor.donorId);
          } else {
            this.router.navigate(
              [ROUTE_REGISTRY[RouteKey.DonorRbcAgQuery].path.replace(':donorId', result.donor.donorId)]
            );
          }
        }
      });
  }

  private openSearchForDonor(): void {
    const dialogRef = this.dialog.open(SearchForDonorDialog, {
      width: '1184px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'search-for-donor-panel',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: SearchForDonorDialogResult) => {
        if (result && result.action === 'select' && result.donor) {
          if (this.embedded) {
            this.loadDonorData(result.donor.donorId);
          } else {
            this.router.navigate(
              [ROUTE_REGISTRY[RouteKey.DonorRbcAgQuery].path.replace(':donorId', result.donor.donorId)]
            );
          }
        } else if (!this.embedded) {
          this.router.navigate(['/home']);
        }
      });
  }

  private loadDonorData(donorId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.donorRbcAgQueryService.getDonorRbcAgQuery(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.donorData.set(data);
          this.loading.set(false);

          // Auto-select first antigen if available, otherwise clear stale selection
          if (data.antigenTests && data.antigenTests.length > 0) {
            this.selectAntigen(data.antigenTests[0]);
          } else {
            this.selectedAntigen.set(null);
          }

          // Use CMV and HgbS from main API response (matches legacy DONATIONS+UTRS by donor)
          this.cmv.set(data.cmvResult || '');
          const hgbs = data.hgbSResult || '';
          this.hemoglobinS.set(hgbs === 'Y' ? 'Yes' : hgbs === 'N' ? 'No' : hgbs);

          // Check AGXCL access to conditionally enable Exclude Units button
          this.checkExcludeAccess();
        },
        error: (err) => {
          this.loading.set(false);
          const errorMessage = err.error?.message || err.message || 'Failed to load donor data';
          this.error.set(errorMessage);
          this.showErrorMessage(errorMessage);
        }
      });
  }

  private checkExcludeAccess(): void {
    this.donorRbcAgQueryService.checkAccess()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hasAccess) => {
          this.canExcludeUnits.set(hasAccess);
        },
        error: () => {
          this.canExcludeUnits.set(false);
        }
      });
  }

  selectAntigen(antigen: AntigenTestHeaderDto): void {
    this.selectedAntigen.set(antigen);
    // Reset pagination when selecting new antigen
    this.serologicalPageIndex.set(0);
    this.molecularPageIndex.set(0);
  }

  isAntigenSelected(antigen: AntigenTestHeaderDto): boolean {
    return this.selectedAntigen()?.antigenCode === antigen.antigenCode;
  }

  onSerologicalPageChange(event: PageEvent): void {
    this.serologicalPageIndex.set(event.pageIndex);
    this.serologicalPageSize.set(event.pageSize);
  }

  onMolecularPageChange(event: PageEvent): void {
    this.molecularPageIndex.set(event.pageIndex);
    this.molecularPageSize.set(event.pageSize);
  }

  // Action button handlers
  onDonorInterdictions(): void {
    const donor = this.donorData();
    if (!donor) {
      this.showErrorMessage('No donor data available');
      return;
    }

    const dialogRef = this.dialog.open(DonorInterdictionsDialogRbc, {
      width: '70vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });

    dialogRef.componentInstance.donorId = donor.donorId;

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDonorData(donor.donorId);
      });
  }

  onAttributes(): void {
    const donor = this.donorData();
    if (!donor) {
      this.showErrorMessage('No donor data available');
      return;
    }

    const donorName = donor.fullName || '';

    const dialogRef = this.dialog.open(DonorAttributesComponent, {
      width: '70vw',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      disableClose: false,
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
    });

    const componentInstance = dialogRef.componentInstance;
    componentInstance.inputDonorId = donor.donorId;
    componentInstance.inputDonorName = donorName;
    componentInstance.inputDob = this.formatDate(donor.dateOfBirth);
    componentInstance.inputSex = donor.gender || '';
    componentInstance.inputAbo = donor.bloodType || '';

    componentInstance.closePanelEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        dialogRef.close();
      });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDonorData(donor.donorId);
      });
  }

  onHlaAntigens(): void {
    const donorId = this.donorData()?.donorId;
    if (!donorId) {
      this.showErrorMessage('No donor ID available');
      return;
    }

    this.hlaAntigensLoading.set(true);
    this.showHlaAntigensPanel.set(true);

    this.donorAntigensApiService.getDonorAntigens(donorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DonorAntigensData) => {
          this.hlaAntigensData.set(data.hlaAntigens);
          this.hlaAntigensLoading.set(false);
        },
        error: (err: any) => {
          this.hlaAntigensLoading.set(false);
          const errorMessage = err.error?.message || err.message || 'Failed to load HLA antigens data';
          this.showErrorMessage(errorMessage);
          this.showHlaAntigensPanel.set(false);
        }
      });
  }

  onExcludeUnits(): void {
    const selectedAntigen = this.selectedAntigen();
    if (!selectedAntigen) {
      this.showErrorMessage('Please select an antigen first');
      return;
    }

    const panelData: ExcludeUnitsPanelData = {
      antigenCode: selectedAntigen.antigenCode,
      resultCode: selectedAntigen.resultCode,
      confirmDate: selectedAntigen.confirmDate,
      serologicalTests: selectedAntigen.serologicalTests,
      molecularTests: selectedAntigen.molecularTests,
    };

    // Initialize test data with selection state and track original state
    this.serologicalTestsWithSelection.set(
      (selectedAntigen.serologicalTests || []).map(test => {
        const isSelected = test.excludeFlag === 'Y';
        return {
          ...test,
          selected: isSelected,
          originalSelected: isSelected // Track original state for change detection
        };
      })
    );

    this.molecularTestsWithSelection.set(
      (selectedAntigen.molecularTests || []).map(test => {
        const isSelected = test.excludeFlag === 'Y';
        return {
          ...test,
          selected: isSelected,
          originalSelected: isSelected // Track original state for change detection
        };
      })
    );

    this.excludeUnitsPanelData.set(panelData);
    this.showExcludeUnitsPanel.set(true);
  }

  onExcludeUnitsPanelButtonClick(action: string): void {
    if (action === 'save') {
      this.handleExcludeUnitsPanelSave();
    } else if (action === 'cancel') {
      this.onExcludeUnitsPanelCancel();
    }
  }

  onExcludeUnitsPanelCancel(): void {
    this.showExcludeUnitsPanel.set(false);
  }

  onGenotypeDetails(): void {
    const donor = this.donorData();
    if (!donor) {
      this.showErrorMessage('No donor data available');
      return;
    }

    const panelData: GenotypePanelData = {
      donorId: donor.donorId,
      donorName: donor.fullName || '',
      currentGenotype: donor.genotype,
    };

    // Set form control value to current genotype
    const initialValue = donor.genotype || '';
    this.genotypeFormControl.setValue(initialValue);
    this.genotypeValue.set(initialValue);

    this.genotypePanelData.set(panelData);
    this.showGenotypePanel.set(true);
  }

  private handleExcludeUnitsPanelSave(): void {
    const serologicalTests = this.serologicalTestsWithSelection();
    const molecularTests = this.molecularTestsWithSelection();

    // Collect ONLY changed exclude flags
    const changedExcludeFlags: UpdateExcludeFlagDto[] = [];

    // Add serological test updates (only if changed)
    serologicalTests.forEach(test => {
      if (!test.unitId || !test.testId) return;

      if (test.selected !== test.originalSelected) {
        changedExcludeFlags.push({
          donorId: test.donorId,
          antigenCode: test.antigenCode,
          unitId: test.unitId,
          testId: test.testId,
          testType: test.testType,
          testSeqNo: test.testSeqNo,
          excludeFlag: test.selected ? 'Y' : 'N',
        });
      }
    });

    // Add molecular test updates (only if changed)
    molecularTests.forEach(test => {
      if (!test.unitId || !test.testId) return;

      if (test.selected !== test.originalSelected) {
        changedExcludeFlags.push({
          donorId: test.donorId,
          antigenCode: test.antigenCode,
          unitId: test.unitId,
          testId: test.testId,
          testType: test.testType,
          testSeqNo: test.testSeqNo,
          excludeFlag: test.selected ? 'Y' : 'N',
        });
      }
    });

    // If no changes, just close the panel silently
    if (changedExcludeFlags.length === 0) {
      this.showExcludeUnitsPanel.set(false);
      return;
    }

    // Call bulk update API with array of changed records
    this.donorRbcAgQueryService.bulkUpdateExcludeFlag(changedExcludeFlags)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Saved Exclude Units successfully.');
          this.showExcludeUnitsPanel.set(false);
          const donorId = this.donorData()?.donorId;
          if (donorId) {
            this.loadDonorData(donorId);
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.message || 'Failed to update exclude flags';
          this.showErrorMessage(errorMessage);
          this.showExcludeUnitsPanel.set(false);
        }
      });
  }

  onGenotypePanelButtonClick(action: string): void {
    if (action === 'save') {
      this.handleGenotypePanelSave();
    } else if (action === 'cancel') {
      this.onGenotypePanelCancel();
    }
  }

  onGenotypePanelCancel(): void {
    this.showGenotypePanel.set(false);
    this.genotypeFormControl.setValue('');
    this.genotypeValue.set('');
  }

  onHlaAntigensPanelButtonClick(action: string): void {
    if (action === 'close' || action === 'save') {
      this.onHlaAntigensPanelClose();
    }
  }

  onHlaAntigensPanelClose(): void {
    this.showHlaAntigensPanel.set(false);
    this.hlaAntigensData.set(null);
  }

  private handleGenotypePanelSave(): void {
    const donorId = this.donorData()?.donorId;
    const genotype = this.genotypeFormControl.value?.trim() || '';

    if (!donorId) {
      this.showErrorMessage('Donor ID not found');
      return;
    }

    const payload: UpdateGenotypeDto = {
      donorId: donorId,
      genoType: genotype,
    };

    this.donorRbcAgQueryService.updateGenotype(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.showGenotypePanel.set(false);
          this.showSuccessMessage(response.message || 'Genotype updated successfully');
          this.loadDonorData(donorId);
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.message || 'Failed to update genotype';
          this.showErrorMessage(errorMessage);
        }
      });
  }

  // Helper methods
  getResultBadgeInfo(resultCode: string | null | undefined): { label: string; class: string; icon?: string } {
    if (!resultCode) return { label: 'NR', class: 'result-badge' };

    const display = RESULT_CODE_DISPLAY[resultCode];
    if (display) {
      return {
        label: display.label,
        class: `result-badge result-${display.color}`,
        icon: display.icon,
      };
    }

    return { label: resultCode, class: 'result-badge' };
  }

  // Separate method for antigen-result-header (no badge styling, full text labels, uses SVG for positive/negative)
  getResultHeaderInfo(resultCode: string | null | undefined): { label: string; class: string; icon?: string } {
    if (!resultCode) return { label: 'NR', class: '' };

    const labelMap: Record<string, string> = {
      '+': 'Positive',
      '-': 'Negative',
      '?': 'Discrepancy',
      'D': 'Discrepancy'
    };

    const display = RESULT_CODE_DISPLAY[resultCode];
    if (display) {
      // Use SVG icons for positive, negative, and discrepancy results in the header
      let icon = display.icon;
      if (resultCode === '+') {
        icon = '/assets/images/icons/pos-circle.svg';
      } else if (resultCode === '-') {
        icon = '/assets/images/icons/neg-circle.svg';
      } else if (resultCode === '?' || resultCode === 'D') {
        icon = '/assets/images/icons/dis-circle.svg';
      }

      return {
        label: labelMap[resultCode] || display.label,
        class: `result-header result-${display.color}`,
        icon: icon,
      };
    }

    return { label: resultCode, class: '' };
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  getResultTextForPanel(resultCode: string | null | undefined): string {
    if (!resultCode) return '';

    switch (resultCode) {
      case '+':
        return 'Positive';
      case '-':
        return 'Negative';
      case '?':
      case 'D':
        return 'Discordant';
      default:
        return '';
    }
  }

  getHlaValue(value: string | null | undefined): string {
    return value || '';
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar'],
    });
  }

  /**
   * Build breadcrumb path by traversing menu hierarchy
   * Returns full breadcrumb trail from Home to current page
   */
  private buildBreadcrumbPath(targetPath: string): Array<{ label: string; link: string | null }> {
    const breadcrumbs: Array<{ label: string; link: string | null }> = [
      { label: 'Home', link: '/home' }
    ];
    const menuItems = this.menuService.getMenuItemsSignal()();
    const path: Array<{ item: MenuItem; cumulativePath: string }> = [];

    const findPath = (
      items: MenuItem[],
      currentPath: Array<{ item: MenuItem; cumulativePath: string }>,
      parentPath: string
    ): boolean => {
      for (const item of items) {
        // Build cumulative path: if item has routePath, use it; otherwise construct from parent + label
        const itemPath = item.routePath || `${parentPath}/${item.label.toLowerCase().replace(/\s+/g, '-')}`;
        const newPath = [...currentPath, { item, cumulativePath: itemPath }];

        if (item.routePath === targetPath) {
          path.push(...newPath);
          return true;
        }
        if (item.children && item.children.length > 0) {
          if (findPath(item.children, newPath, itemPath)) {
            return true;
          }
        }
      }
      return false;
    };

    findPath(menuItems, [], '');

    path.forEach((pathItem, index) => {
      const isLastItem = index === path.length - 1;
      breadcrumbs.push({
        label: pathItem.item.breadcrumbLabel || pathItem.item.label,
        link: isLastItem ? null : pathItem.cumulativePath
      });
    });

    return breadcrumbs;
  }
}
