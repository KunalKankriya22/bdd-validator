import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import moment from 'moment';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { HeaderService } from '@shared/services/header.service';
import { MaintainGroupInterdictionsService } from '../../services/maintain-group-interdictions.service';
import { SelectInterdictionsDialogComponent } from '../select-interdictions-dialog/select-interdictions-dialog.component';
import { RemoveInterdictionDialogComponent } from '../remove-interdiction-dialog/remove-interdiction-dialog.component';
import { CommentsPanelComponent } from '../comments-panel/comments-panel.component';
import {
  GroupInterdictionLookupDto,
  DonorRecord,
  DonorGroupInterdictionParams,
  SelectableInterdiction,
  DonorInterdictionResponse,
  GROUP_MODE_OPTIONS,
  DEFERRAL_CHOICE_OPTIONS,
  RemoveInterdictionDialogData,
  RemoveInterdictionDialogResult
} from '../../models/maintain-group-interdictions.model';

@Component({
  selector: 'app-donors-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    ScrollingModule,
    SearchBar,
    SelectInterdictionsDialogComponent,
    CommentsPanelComponent
  ],
  templateUrl: './donors-tab.component.html',
  styleUrls: ['./donors-tab.component.scss']
})
export class DonorsTabComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MaintainGroupInterdictionsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly headerService = inject(HeaderService);

  controlForm!: FormGroup;
  valueSearchControl = new FormControl<string>('');
  readonly fallbackModeOptions = GROUP_MODE_OPTIONS;
  readonly deferralChoiceOptions = DEFERRAL_CHOICE_OPTIONS;
  readonly Math = Math; // Expose Math to template for virtual scroll height calculation

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by code or description',
    minLength: 3,
    ariaLabel: 'Search by interdiction code or description',
    debounceTime: 300,
    searchOnEnterOnly: true
  };

  modeOptions = signal<GroupInterdictionLookupDto[]>([]);
  valueOptions = signal<GroupInterdictionLookupDto[]>([]);
  filteredValueOptions = signal<GroupInterdictionLookupDto[]>([]);
  donors = signal<DonorRecord[]>([]);
  interdictions = signal<GroupInterdictionLookupDto[]>([]);
  isLoading = signal<boolean>(false);
  isLoadingValues = signal<boolean>(false);
  hasRetrieved = signal<boolean>(false);
  searchText = signal<string>('');
  modeDescription = signal<string>('');
  donorSortDirection = signal<'asc' | 'desc'>('asc');
  interdictionSortDirection = signal<'asc' | 'desc'>('asc');

  showSelectPanel = false;
  selectPanelExistingCodes: string[] = [];
  showCommentsPanel = false;
  selectedInterdictionForComments: GroupInterdictionLookupDto | null = null;
  selection = new SelectionModel<GroupInterdictionLookupDto>(true, []);
  selectedCount = signal(0);

  filteredInterdictions = computed(() => {
    const search = this.searchText().toLowerCase();
    const items = this.interdictions();
    const sorted = [...items].sort((a, b) => {
      const cmp = (a.code || '').localeCompare(b.code || '');
      return this.interdictionSortDirection() === 'asc' ? cmp : -cmp;
    });
    if (!search) return sorted;
    return sorted.filter(item =>
      (item.code || '').toLowerCase().includes(search) ||
      (item.description || '').toLowerCase().includes(search)
    );
  });

  sortedDonors = computed(() => {
    const items = this.donors();
    return [...items].sort((a, b) => {
      const cmp = (a.donorId || '').localeCompare(b.donorId || '');
      return this.donorSortDirection() === 'asc' ? cmp : -cmp;
    });
  });

  ngOnInit(): void {
    this.controlForm = this.fb.group({
      mode: ['', Validators.required],
      value: ['', Validators.required],
      type: ['B', Validators.required]
    });

    this.controlForm.get('mode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode: string) => {
        this.onModeChange(mode);
      });

    this.setupValueSearch();
    this.loadDonorGroupModes();
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onModeChange(mode: string): void {
    const modeOption = this.modeOptions().find(m => m.code === mode);
    this.modeDescription.set(modeOption?.description || '');
    this.controlForm.get('value')?.reset('');
    this.valueSearchControl.reset('');
    this.resetResults();

    // Only load value options if a valid mode is selected
    if (mode) {
      this.loadDonorValueOptions(mode);
    }
  }

  onRetrieve(): void {
    if (this.controlForm.invalid) {
      this.controlForm.markAllAsTouched();
      return;
    }

    // Close comment panel if open
    if (this.showCommentsPanel) {
      this.onCommentsPanelClose();
    }

    const params = this.buildParams();
    this.isLoading.set(true);
    this.interdictions.set([]);
    this.donors.set([]);

    this.service.retrieveDonors(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (donorsResponse) => {
          this.donors.set(donorsResponse.donors);
          this.hasRetrieved.set(true);
          this.isLoading.set(false);

          if (donorsResponse.donors.length > 0) {
            // Load existing interdictions for the donor group
            this.loadExistingInterdictions(params);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.hasRetrieved.set(true);
          this.showErrorMessage('Failed to retrieve data. Please try again.');
        }
      });
  }

  onAddInterdiction(): void {
    this.selectPanelExistingCodes = this.interdictions().map(i => i.code);
    this.showSelectPanel = true;
  }

  onSelectPanelClose(): void {
    this.showSelectPanel = false;
  }

  onViewComments(interdiction: GroupInterdictionLookupDto): void {
    this.selectedInterdictionForComments = interdiction;
    this.showCommentsPanel = true;
  }

  onCommentsPanelClose(): void {
    this.showCommentsPanel = false;
    this.selectedInterdictionForComments = null;
  }

  onInterdictionsSelected(selected: SelectableInterdiction[]): void {
    this.showSelectPanel = false;
    if (selected.length) {
      this.placeInterdictions(selected.map(i => i.interCode));
    }
  }

  onDeleteSelected(): void {
    const selected = this.selection.selected;
    if (selected.length === 0) return;

    const dialogData: RemoveInterdictionDialogData = {
      context: 'donor'
    };

    const dialogRef = this.dialog.open(RemoveInterdictionDialogComponent, {
      width: '508px',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: RemoveInterdictionDialogResult | null) => {
        if (result?.confirmed) {
          this.removeInterdictions(selected.map(i => i.code), result.reasonCode);
        }
      });
  }

  isAllSelected(): boolean {
    const visibleItems = this.filteredInterdictions();
    if (visibleItems.length === 0) return false;
    return visibleItems.every(item => this.selection.isSelected(item));
  }

  isIndeterminate(): boolean {
    const visibleItems = this.filteredInterdictions();
    const visibleSelectedCount = visibleItems.filter(item => this.selection.isSelected(item)).length;
    return visibleSelectedCount > 0 && visibleSelectedCount < visibleItems.length;
  }

  toggleRow(interdiction: GroupInterdictionLookupDto): void {
    this.selection.toggle(interdiction);
    this.syncSelectionCount();
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.filteredInterdictions().forEach(item => this.selection.select(item));
    }
    this.syncSelectionCount();
  }

  clearSelection(): void {
    this.selection.clear();
    this.selectedCount.set(0);
  }

  private syncSelectionCount(): void {
    this.selectedCount.set(this.selection.selected.length);
  }

  onSearchChange(searchTerm: string): void {
    this.searchText.set(searchTerm);
  }

  onSearchCleared(): void {
    this.searchText.set('');
  }

  toggleDonorSort(): void {
    this.donorSortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  toggleInterdictionSort(): void {
    this.interdictionSortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateStr;
  }

  formatValueOption(val: GroupInterdictionLookupDto): string {
    if (val.driveDate) {
      return `${val.code} - ${this.formatDate(val.driveDate)}`;
    }
    return val.code;
  }

  private placeInterdictions(codes: string[]): void {
    const params = this.buildParams();
    this.isLoading.set(true);

    this.service.placeDonorInterdictions({
      groupMode: params.groupMode,
      groupValue: params.groupValue,
      deferralChoice: params.deferralChoice,
      interCodes: codes
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DonorInterdictionResponse) => {
          if (response.failureCount === 0) {
            this.showSuccessMessage(
              `Interdictions placed successfully. ${response.successCount} of ${response.totalDonors} donor(s) processed.`
            );
          } else if (response.successCount > 0 && response.failureCount > 0) {
            // Partial failure - show detailed message
            const errorMessage = `Partial success: ${response.successCount} of ${response.totalDonors} interdiction(s) placed successfully, ${response.failureCount} failed. Check individual donor results for details.`;
            this.showPersistentErrorMessage(errorMessage);
          } else {
            // Complete failure - extract first error message if available
            const firstError = response.results.find(r => r.errorMessage);
            const errorMessage = firstError?.errorMessage || `Failed to place interdictions. ${response.failureCount} of ${response.totalDonors} donor(s) failed.`;
            this.showPersistentErrorMessage(errorMessage);
          }
          // refreshInterdictions will handle clearing the loading state
          this.refreshInterdictions();
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  private removeInterdictions(codes: string[], reasonCode: string): void {
    const params = this.buildParams();
    this.isLoading.set(true);

    this.service.removeDonorInterdictions({
      groupMode: params.groupMode,
      groupValue: params.groupValue,
      deferralChoice: params.deferralChoice,
      interCodes: codes,
      termReason: reasonCode
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DonorInterdictionResponse) => {
          if (response.failureCount === 0) {
            this.showSuccessMessage(
              `Interdiction(s) removed successfully. ${response.successCount} of ${response.totalDonors} donor(s) processed.`
            );
          } else if (response.successCount > 0 && response.failureCount > 0) {
            const errorMessage = `Partial success: ${response.successCount} of ${response.totalDonors} interdiction(s) removed successfully, ${response.failureCount} failed. Check individual donor results for details.`;
            this.showPersistentErrorMessage(errorMessage);
          } else {
            const firstError = response.results.find(r => r.errorMessage);
            const errorMessage = firstError?.errorMessage || `Failed to remove interdictions. ${response.failureCount} of ${response.totalDonors} donor(s) failed.`;
            this.showPersistentErrorMessage(errorMessage);
          }

          if (response.successCount > 0 && this.selectedInterdictionForComments?.code &&
              codes.includes(this.selectedInterdictionForComments.code)) {
            this.onCommentsPanelClose();
          }

          this.clearSelection();

          if (response.successCount > 0) {
            this.refreshInterdictions();
          } else {
            this.isLoading.set(false);
          }
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  private loadExistingInterdictions(params: DonorGroupInterdictionParams, showLoader: boolean = false): void {
    if (showLoader) {
      this.isLoading.set(true);
    }

    this.service.getExistingDonorInterCodes(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (interdictions) => {
          this.clearSelection();
          this.interdictions.set(interdictions);
          if (showLoader) {
            this.isLoading.set(false);
          }
        },
        error: () => {
          this.interdictions.set([]);
          if (showLoader) {
            this.isLoading.set(false);
          }
        }
      });
  }

  private refreshInterdictions(): void {
    this.loadExistingInterdictions(this.buildParams(), true);
  }

  private buildParams(): DonorGroupInterdictionParams {
    return {
      groupMode: this.controlForm.get('mode')?.value,
      groupValue: this.controlForm.get('value')?.value,
      deferralChoice: this.controlForm.get('type')?.value
    };
  }

  private loadDonorGroupModes(): void {
    this.service.getDonorGroupModes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modes) => {
          this.modeOptions.set(modes);
        },
        error: () => this.modeOptions.set(this.fallbackModeOptions)
      });
  }

  private loadDonorValueOptions(mode: string): void {
    this.isLoadingValues.set(true);
    this.valueOptions.set([]);
    this.filteredValueOptions.set([]);

    this.service.getDonorGroupValues(mode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (values) => {
          this.valueOptions.set(values);
          this.filteredValueOptions.set(values);
          this.isLoadingValues.set(false);
        },
        error: () => {
          this.valueOptions.set([]);
          this.filteredValueOptions.set([]);
          this.isLoadingValues.set(false);
          this.showErrorMessage('Failed to load values. Please try again.');
        }
      });
  }

  private setupValueSearch(): void {
    this.valueSearchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(search => {
        this.filteredValueOptions.set(this.filterValues(search));
      });
  }

  private filterValues(search: string | null): GroupInterdictionLookupDto[] {
    const allValues = this.valueOptions();

    if (!search || search.trim().length === 0) {
      return allValues;
    }

    const searchLower = search.toLowerCase().trim();

    // For better performance with large lists, use a more efficient filter
    return allValues.filter(v =>
      v.code.toLowerCase().indexOf(searchLower) !== -1
    );
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.controlForm.reset({ mode: '', value: '', type: 'B' });
        this.modeDescription.set('');
        this.valueOptions.set([]);
        this.filteredValueOptions.set([]);
        this.valueSearchControl.reset('');
        this.showSelectPanel = false;
        this.resetResults();
        this.loadDonorGroupModes();
      });
  }

  private resetResults(): void {
    this.donors.set([]);
    this.interdictions.set([]);
    this.hasRetrieved.set(false);
    this.searchText.set('');
    this.clearSelection();
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showPersistentErrorMessage(message: string): void {
    this.snackBar.open(message, 'DISMISS', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
